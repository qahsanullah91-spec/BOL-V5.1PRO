import fs from "node:fs"
import { app, BrowserWindow, Menu, nativeImage, shell } from "electron"
import { spawn, type ChildProcess } from "node:child_process"
import { createServer } from "node:net"
import { mkdir, readFile } from "node:fs/promises"
import path from "node:path"
import { registerIpcHandlers } from "./ipc/register-ipc"
import { atomicWriteFile } from "./services/atomic-file"
import { initializeDataDirectory } from "./services/data"
import { backendManager } from "./backend-manager"

const PRODUCT_NAME = "AQ COMPANIES"
const PRODUCT_DESCRIPTION = "Logistics & BOL Management"
const DEVELOPER_NAME = "Ahsanullah Qureshi"
if (!app.isPackaged) {
  app.setName(`${PRODUCT_NAME} Dev`)
} else {
  app.setName(PRODUCT_NAME)
}
let mainWindow: BrowserWindow | null = null
let applicationServer: ChildProcess | null = null
let applicationUrl = ""

type WindowState = { width: number; height: number; x?: number; y?: number; maximized?: boolean }

function handleSquirrelEvent(): boolean {
  const event = process.argv[1]
  if (!event?.startsWith("--squirrel-")) return false
  const updateExecutable = path.resolve(path.dirname(process.execPath), "..", "Update.exe")
  const executableName = path.basename(process.execPath)
  if (["--squirrel-install", "--squirrel-updated"].includes(event)) {
    spawn(updateExecutable, ["--createShortcut", executableName], { detached: true, windowsHide: true }).unref()
  } else if (event === "--squirrel-uninstall") {
    spawn(updateExecutable, ["--removeShortcut", executableName], { detached: true, windowsHide: true }).unref()
  }
  setTimeout(() => app.quit(), 1000)
  return true
}

async function tryListenPort(candidatePort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.once("error", reject)
    server.listen(candidatePort, "127.0.0.1", () => {
      const address = server.address()
      const port = typeof address === "object" && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

async function reservePort(): Promise<number> {
  const preferredPorts = [39481, 39482, 39483, 39484, 39485, 0]
  for (const candidate of preferredPorts) {
    try {
      const boundPort = await tryListenPort(candidate)
      if (boundPort > 0) return boundPort
    } catch {
      // Port in use, try next candidate
    }
  }
  return tryListenPort(0)
}

async function waitForServer(url: string): Promise<void> {
  const expiresAt = Date.now() + 90_000 // 90s grace period for cold start / busy disk
  const cleanUrl = url.trim().replace(/\/+$/, "")
  const probeUrl = `${cleanUrl}/api/health`
  const rootUrl = `${cleanUrl}/`
  let attempts = 0

  while (Date.now() < expiresAt) {
    try {
      const response = await fetch(probeUrl, {
        signal: AbortSignal.timeout(2500),
      })
      if (response.status < 500) {
        logMain(`Probe succeeded at ${probeUrl} with HTTP ${response.status}`)
        // Warm up root page in background asynchronously without delaying window URL transition
        void fetch(rootUrl, { signal: AbortSignal.timeout(4000) }).catch(() => {})
        return
      }
    } catch (err: any) {
      // Server warming up
    }
    attempts++
    // Adaptive fast polling: 80ms for first 25 attempts (~2s), then 200ms
    const pollDelay = attempts < 25 ? 80 : 200
    await new Promise((resolve) => setTimeout(resolve, pollDelay))
  }
  throw new Error("The bundled application server did not start in time")
}

import { appendFileSync, mkdirSync } from "node:fs"

function logMain(message: string): void {
  try {
    const userData = app.getPath("userData")
    const logDir = path.join(userData, "data", "logs")
    mkdirSync(logDir, { recursive: true })
    appendFileSync(path.join(logDir, "main-process.log"), `[${new Date().toISOString()}] ${message}\n`)
  } catch {}
}

process.on("uncaughtException", (err) => {
  logMain(`[Uncaught Exception] ${err.stack || err.message}`)
})
process.on("unhandledRejection", (reason) => {
  logMain(`[Unhandled Rejection] ${reason}`)
})

async function startApplicationServer(dataDirectory: string): Promise<string> {
  const developmentUrl = process.env.ELECTRON_START_URL
  if (!app.isPackaged) {
    applicationUrl = (developmentUrl || "http://127.0.0.1:3001").trim()
    await waitForServer(applicationUrl)
    return applicationUrl
  }
  logMain(`Reserving port for bundled app server...`)
  const port = await reservePort()
  const serverRoot = path.join(process.resourcesPath, "app-server")
  const serverEntry = path.join(serverRoot, "server.js")
  applicationUrl = `http://127.0.0.1:${port}`
  logMain(`Spawning app server on ${applicationUrl} with ${serverEntry}`)
  applicationServer = spawn(process.execPath, [serverEntry], {
    cwd: serverRoot,
    windowsHide: true,
    stdio: "pipe",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      SKY_DATA_DIR: dataDirectory,
      SKY_DESKTOP: "1",
    },
  })
  applicationServer.stdout?.on("data", (d) => logMain(`[AppServer] ${d.toString().trim()}`))
  applicationServer.stderr?.on("data", (d) => logMain(`[AppServer Error] ${d.toString().trim()}`))
  applicationServer.once("error", (error) => logMain(`[AppServer Failed to spawn] ${error.message}`))
  applicationServer.once("exit", (code) => logMain(`[AppServer Exited] code ${code}`))
  logMain(`Waiting for app server at ${applicationUrl}...`)
  await waitForServer(applicationUrl)
  logMain(`App server ready at ${applicationUrl}`)
  return applicationUrl
}

async function readWindowState(filePath: string): Promise<WindowState> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as WindowState
  } catch {
    return { width: 1440, height: 900 }
  }
}

function buildApplicationMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: "File", submenu: [
      { label: "New", accelerator: "CmdOrCtrl+N", click: () => mainWindow?.webContents.send("menu:new") },
      { label: "Open", accelerator: "CmdOrCtrl+O", click: () => mainWindow?.webContents.send("menu:open") },
      { label: "Save", accelerator: "CmdOrCtrl+S", click: () => mainWindow?.webContents.send("menu:save") },
      { label: "Export PDF", click: () => mainWindow?.webContents.send("menu:export-pdf") },
      { label: "Print", accelerator: "CmdOrCtrl+P", click: () => mainWindow?.webContents.print({ printBackground: true }) },
      { type: "separator" }, { role: "quit", label: "Exit" },
    ] },
    { label: "Edit", submenu: [
      { role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
    ] },
    { label: "View", submenu: [
      { role: "reload" }, { role: "toggleDevTools", label: "Developer Tools", accelerator: "F12" }, { type: "separator" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }, { type: "separator" }, { role: "togglefullscreen" },
    ] },
    { label: "Help", submenu: [{
      label: "About",
      click: () => void app.showAboutPanel(),
    }] },
  ])
}

function getAqEmblemBase64(): string {
  try {
    const candidatePaths = [
      path.join(process.cwd(), "public", "images", "aq-companies-emblem.png"),
      path.join(process.cwd(), "public", "images", "aq-companies-logo.png"),
      path.join(process.resourcesPath, "app-server", "public", "images", "aq-companies-emblem.png"),
      path.join(process.resourcesPath, "app-server", "public", "images", "aq-companies-logo.png"),
      path.join(process.resourcesPath, "app-icon.png"),
      path.join(process.cwd(), "public", "icon-512x512.png"),
    ]
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`
      }
    }
  } catch (err) {
    console.error("Failed to load AQ Companies logo for loading splash:", err)
  }
  return ""
}

function getSplashHtml(): string {
  const logoDataUrl = getAqEmblemBase64()
  const emblemContent = logoDataUrl
    ? `<img class="emblem-img" src="${logoDataUrl}" alt="AQ Companies" />`
    : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
        <line x1="2" y1="20" x2="2.01" y2="20"></line>
      </svg>`
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AQ COMPANIES</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: radial-gradient(circle at 50% 25%, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      overflow: hidden;
      cursor: default;
    }
    .ambient-1 {
      position: absolute;
      top: 15%;
      left: 28%;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(60px);
      pointer-events: none;
      animation: floatA 6s ease-in-out infinite alternate;
    }
    .ambient-2 {
      position: absolute;
      bottom: 18%;
      right: 28%;
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(60px);
      pointer-events: none;
      animation: floatB 7s ease-in-out infinite alternate;
    }
    .card {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 44px 52px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 28px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      text-align: center;
      max-width: 480px;
      width: 90%;
    }
    .emblem-wrapper {
      position: relative;
      margin-bottom: 22px;
      width: 96px;
      height: 76px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .emblem-pulse {
      position: absolute;
      inset: -6px;
      border-radius: 22px;
      background: linear-gradient(135deg, rgba(217, 119, 6, 0.4), rgba(56, 189, 248, 0.35));
      filter: blur(8px);
      animation: pulse 2.2s infinite ease-in-out;
    }
    .emblem-box {
      position: relative;
      width: 96px;
      height: 76px;
      border-radius: 20px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 1.5px solid rgba(56, 189, 248, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      padding: 6px 10px;
    }
    .emblem-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.6));
      user-select: none;
      -webkit-user-drag: none;
    }
    .title {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      background: linear-gradient(135deg, #ffffff 40%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 28px;
    }
    .track {
      width: 260px;
      height: 4px;
      background: rgba(30, 41, 59, 0.8);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 16px;
    }
    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 45%;
      border-radius: 999px;
      background: linear-gradient(90deg, #38bdf8, #f59e0b, #10b981);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
      animation: barAnimation 1.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
    }
    .status-msg {
      font-size: 11.5px;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: blink 1.2s infinite ease-in-out;
    }
    .badge {
      margin-top: 24px;
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 9.5px;
      color: #64748b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 1px;
    }
    @keyframes barAnimation {
      0% { left: -45%; width: 35%; }
      50% { left: 25%; width: 55%; }
      100% { left: 100%; width: 45%; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.4; transform: scale(0.96); }
      50% { opacity: 0.9; transform: scale(1.06); }
    }
    @keyframes blink {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes floatA {
      0% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(-16px) scale(1.08); }
    }
    @keyframes floatB {
      0% { transform: translateY(0px) scale(1); }
      100% { transform: translateY(16px) scale(1.06); }
    }
  </style>
</head>
<body>
  <div class="ambient-1"></div>
  <div class="ambient-2"></div>
  <div class="card">
    <div class="emblem-wrapper">
      <div class="emblem-pulse"></div>
      <div class="emblem-box">
        ${emblemContent}
      </div>
    </div>
    <div class="title">AQ COMPANIES</div>
    <div class="subtitle">Logistics & Bill of Lading Platform</div>
    <div class="track">
      <div class="bar"></div>
    </div>
    <div class="status-msg">
      <span class="status-dot"></span>
      <span id="txt">Starting core engine...</span>
    </div>
    <div class="badge">AQ-SYSTEM v5.2.10 PRO • ULTRA PERFORMANCE RUNTIME</div>
  </div>
  <script>
    const steps = [
      "Starting core logistics engine...",
      "Initializing local database...",
      "Warming up financial ledger cache...",
      "Opening workspace..."
    ];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % steps.length;
      const el = document.getElementById("txt");
      if (el) el.textContent = steps[i];
    }, 600);
  </script>
</body>
</html>`
}

async function createMainWindow(): Promise<void> {
  const isDev = !app.isPackaged
  const userData = app.getPath("userData")
  const dataDirectory = isDev ? path.join(process.cwd(), "data") : path.join(userData, "data")
  const statePath = path.join(userData, "window-state.json")
  await mkdir(userData, { recursive: true })
  await mkdir(dataDirectory, { recursive: true })
  const seedDirectory = app.isPackaged ? path.join(process.resourcesPath, "seed-data") : process.cwd()
  await initializeDataDirectory(dataDirectory, seedDirectory)
  process.env.SKY_DATA_DIR = dataDirectory

  // Start background services in parallel with window preparation
  void backendManager.start(dataDirectory).catch((err) => console.error("Python backend start warning:", err))
  logMain(`Initiating application server concurrently...`)
  const serverPromise = startApplicationServer(dataDirectory)

  const state = await readWindowState(statePath)
  const icon = nativeImage.createFromPath(
    app.isPackaged ? path.join(process.resourcesPath, "app-icon.png") : path.join(process.cwd(), "public", "icon-512x512.png"),
  )
  logMain(`Creating main window with dimensions ${state.width}x${state.height}...`)
  mainWindow = new BrowserWindow({
    title: PRODUCT_NAME,
    width: Math.max(1100, state.width), height: Math.max(700, state.height), x: state.x, y: state.y,
    minWidth: 1024, minHeight: 680, show: false, backgroundColor: "#020617", icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("blob:") || (applicationUrl && url.startsWith(applicationUrl))) return { action: "allow" }
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    return { action: "deny" }
  })
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (applicationUrl && !url.startsWith(applicationUrl)) {
      event.preventDefault()
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url)
    }
  })
  mainWindow.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    logMain(`[Renderer Failed Load] code=${errorCode} error=${errorDescription} url=${validatedURL}`)
  })
  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    logMain(`[Renderer Console L${level}] ${message} (${sourceId}:${line})`)
  })

  // Show window smoothly once the initial splash layout has rendered
  mainWindow.once("ready-to-show", () => {
    logMain(`Main window ready-to-show triggered`)
    mainWindow?.show()
    if (state.maximized) {
      mainWindow?.maximize()
    }
  })

  mainWindow.on("close", () => {
    if (!mainWindow) return
    const bounds = mainWindow.getNormalBounds()
    void atomicWriteFile(statePath, JSON.stringify({ ...bounds, maximized: mainWindow.isMaximized() }, null, 2))
  })
  mainWindow.on("closed", () => {
    logMain(`Main window closed event fired`)
    mainWindow = null
  })

  // Load instant branded splash screen into window immediately
  const splashDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(getSplashHtml())}`
  await mainWindow.loadURL(splashDataUrl)

  // Await the application server (which has been booting in parallel)
  const targetUrl = await serverPromise
  logMain(`Loading application URL: ${targetUrl}`)
  await mainWindow.loadURL(targetUrl)
  logMain(`Main window URL load completed successfully`)
}

if (handleSquirrelEvent()) {
  // The installer owns startup while shortcuts or an uninstall are being processed.
} else if (!app.requestSingleInstanceLock()) {
  logMain(`Failed to acquire single instance lock. Another instance is already running. Quitting.`)
  app.quit()
} else {
  logMain(`Single instance lock acquired successfully. Initializing app...`)
  if (app.isPackaged) {
    app.setName(PRODUCT_NAME)
  }
  app.setAboutPanelOptions({
    applicationName: PRODUCT_NAME,
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    copyright: `Copyright © ${DEVELOPER_NAME}`,
    authors: [DEVELOPER_NAME],
    website: "https://skyariana.com",
  })
  app.on("second-instance", () => {
    logMain(`Second instance triggered; focusing existing window.`)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
function startReleaseFolderWatcher(windowGetter: () => BrowserWindow | null): void {
  const candidateDirs = [
    path.join(process.cwd(), "release"),
    "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5\\release",
  ]
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        let debounceTimer: NodeJS.Timeout | null = null
        fs.watch(dir, (_eventType: string, filename: string | null) => {
          if (!filename || filename.includes(".tmp")) return
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            const win = windowGetter()
            if (win && !win.isDestroyed()) {
              logMain(`[Release Watcher] Detected release artifact change: ${filename}`)
              win.webContents.send("updater:release-detected", {
                directory: dir,
                filename,
                timestamp: Date.now(),
              })
            }
          }, 600)
        })
        logMain(`[Release Watcher] Actively monitoring directory: ${dir}`)
        break
      } catch (err: any) {
        logMain(`[Release Watcher] Error: ${err?.message}`)
      }
    }
  }
}

function configureWindowsPrintPreferences(): void {
  if (process.platform !== "win32") return
  try {
    // Windows 11 Modern Print Dialog displays "This app doesn't support print preview" for all Win32/Chromium apps.
    // Setting both PreferLegacyPrintDialog and PreferLaunchLegacyDialog restores the classic, fast, reliable Windows print dialog.
    spawn("reg", ["add", "HKCU\\Software\\Microsoft\\Print\\UnifiedPrintDialog", "/v", "PreferLegacyPrintDialog", "/t", "REG_DWORD", "/d", "1", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    }).unref()
    spawn("reg", ["add", "HKCU\\Software\\Microsoft\\Print\\UnifiedPrintDialog", "/v", "PreferLaunchLegacyDialog", "/t", "REG_DWORD", "/d", "1", "/f"], {
      windowsHide: true,
      stdio: "ignore",
    }).unref()
  } catch (err: any) {
    logMain(`Failed to configure Windows print preferences: ${err?.message || err}`)
  }
}

  app.whenReady().then(async () => {
    configureWindowsPrintPreferences()
    logMain(`Electron app ready. Setting up menus and windows...`)
    Menu.setApplicationMenu(buildApplicationMenu())
    registerIpcHandlers({ getWindow: () => mainWindow, dataDirectory: path.join(app.getPath("userData"), "data") })
    await createMainWindow()
    startReleaseFolderWatcher(() => mainWindow)
  }).catch((error) => {
    logMain(`[App Error on Startup] ${error instanceof Error ? (error.stack || error.message) : String(error)}`)
    console.error(error)
    dialogError(error)
  })
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createMainWindow() })
  app.on("window-all-closed", () => {
    logMain(`All windows closed. Platform: ${process.platform}`)
    if (process.platform !== "darwin") app.quit()
  })
  app.on("before-quit", () => {
    logMain(`App before-quit fired. Cleaning up backend and servers...`)
    void backendManager.stop().catch(console.error)
    applicationServer?.kill()
    applicationServer = null
  })
}

function dialogError(error: unknown): void {
  const message = error instanceof Error ? (error.stack || error.message) : String(error)
  logMain(`[dialogError] ${message}`)
  void import("electron").then(({ dialog }) => dialog.showErrorBox(`${PRODUCT_NAME} could not start`, message))
}
