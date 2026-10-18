import { BrowserWindow, dialog, ipcMain, shell, clipboard, app } from "electron"
import { readFile } from "node:fs/promises"
import fs from "node:fs"
import { spawn } from "node:child_process"
import path from "node:path"
import { atomicWriteFile } from "../services/atomic-file"
import { createDataBackup, restoreDataBackup } from "../services/data"
import { backendManager, type ConnectionMode, type NetworkConfig } from "../backend-manager"

type SavePayload = { defaultName?: string; bytes: number[] }

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function findInstallerPath(customCandidate?: string): { path: string; size: number; mtime: Date; sha256?: string; version?: string } | null {
  const candidateDirs: string[] = []
  if (customCandidate && fs.existsSync(customCandidate)) {
    const stats = fs.statSync(customCandidate)
    if (stats.isFile()) {
      let sha256: string | undefined
      const shaFile = `${customCandidate}.sha256`
      if (fs.existsSync(shaFile)) {
        try {
          sha256 = fs.readFileSync(shaFile, "utf8").trim().split(" ")[0]
        } catch {}
      }
      return { path: customCandidate, size: stats.size, mtime: stats.mtime, sha256 }
    } else if (stats.isDirectory()) {
      candidateDirs.push(customCandidate)
    }
  }

  const rootDir = process.cwd()
  candidateDirs.push(
    path.join(rootDir, "release"),
    path.join(rootDir, "..", "release"),
    path.join(app.getAppPath(), "release"),
    path.join(app.getAppPath(), "..", "release"),
    path.join(process.resourcesPath || rootDir, "..", "..", "release"),
    path.join(app.getPath("downloads")),
    "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5\\release"
  )

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue
    try {
      const files = fs.readdirSync(dir)
      const installerName = files.find(f => f.startsWith("AQ-COMPANIES-Setup") && f.endsWith(".exe"))
      if (installerName) {
        const fullPath = path.join(dir, installerName)
        const stats = fs.statSync(fullPath)
        let sha256: string | undefined
        const shaFile = `${fullPath}.sha256`
        if (fs.existsSync(shaFile)) {
          try {
            sha256 = fs.readFileSync(shaFile, "utf8").trim().split(" ")[0]
          } catch {}
        }
        let version: string | undefined
        const latestYml = path.join(dir, "latest.yml")
        if (fs.existsSync(latestYml)) {
          try {
            const raw = fs.readFileSync(latestYml, "utf8")
            const vm = raw.match(/version:\s*([^\s]+)/)
            if (vm) version = vm[1]
          } catch {}
        }
        return { path: fullPath, size: stats.size, mtime: stats.mtime, sha256, version }
      }
    } catch {}
  }
  return null
}

function safeName(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const cleaned = path.basename(value).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").trim()
  return cleaned || fallback
}

function bytesFrom(payload: SavePayload): Buffer {
  if (!payload || !Array.isArray(payload.bytes) || payload.bytes.length > 150_000_000) {
    throw new Error("Invalid or oversized file payload")
  }
  return Buffer.from(payload.bytes)
}

export function registerIpcHandlers(options: {
  getWindow: () => BrowserWindow | null
  dataDirectory: string
}): void {
  const { getWindow, dataDirectory } = options

  ipcMain.handle("dialog:open-files", async (_event, config?: { multiple?: boolean }) => {
    const options = {
      properties: config?.multiple ? ["openFile", "multiSelections"] : ["openFile"],
    } as Electron.OpenDialogOptions
    const owner = getWindow()
    const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    return result.canceled ? [] : result.filePaths
  })
  ipcMain.handle("dialog:open-folder", async () => {
    const options: Electron.OpenDialogOptions = { properties: ["openDirectory", "createDirectory"] }
    const owner = getWindow()
    const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    return result.canceled ? null : result.filePaths[0]
  })
  ipcMain.handle("file:save", async (_event, payload: SavePayload) => {
    const options: Electron.SaveDialogOptions = {
      defaultPath: safeName(payload?.defaultName, "Sky-Ariana-Export.bin"),
    }
    const owner = getWindow()
    const result = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return null
    await atomicWriteFile(result.filePath, bytesFrom(payload))
    return result.filePath
  })
  ipcMain.handle("file:open", async (_event, filePath: unknown) => {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) throw new Error("Invalid file path")
    return shell.openPath(filePath)
  })
  ipcMain.handle("file:reveal", async (_event, filePath: unknown) => {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) throw new Error("Invalid file path")
    shell.showItemInFolder(filePath)
  })
  ipcMain.handle("print:page", async () => {
    const window = getWindow()
    if (!window) return false
    return new Promise<boolean>((resolve) => {
      window.webContents.print({ silent: false, printBackground: true }, (success) => resolve(success))
    })
  })
  ipcMain.handle("print:pdf", async (_event, defaultName?: unknown) => {
    const window = getWindow()
    if (!window) throw new Error("Application window is unavailable")
    const result = await dialog.showSaveDialog(window, {
      defaultPath: safeName(defaultName, "Sky-Ariana-Document.pdf"),
      filters: [{ name: "PDF document", extensions: ["pdf"] }],
    })
    if (result.canceled || !result.filePath) return null
    const pdf = await window.webContents.printToPDF({
      pageSize: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    })
    await atomicWriteFile(result.filePath, pdf)
    return result.filePath
  })
  ipcMain.handle("backup:export", async () => {
    const nowStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const options: Electron.SaveDialogOptions = {
      defaultPath: `AQ_COMPANIES_FULL_BACKUP_${nowStr}_v5.2.0.json`,
      filters: [{ name: "AQ Companies backup", extensions: ["json"] }],
    }
    const owner = getWindow()
    const result = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options)
    if (result.canceled || !result.filePath) return null
    await atomicWriteFile(result.filePath, await createDataBackup(dataDirectory))
    return result.filePath
  })
  ipcMain.handle("backup:restore", async () => {
    const options: Electron.OpenDialogOptions = {
      properties: ["openFile"], filters: [{ name: "Sky Ariana backup", extensions: ["json"] }],
    }
    const owner = getWindow()
    const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null
    return restoreDataBackup(dataDirectory, await readFile(result.filePaths[0], "utf8"))
  })
  ipcMain.handle("window:action", (_event, action: unknown) => {
    const window = getWindow()
    if (!window || typeof action !== "string") return
    if (action === "minimize") window.minimize()
    else if (action === "maximize") window.isMaximized() ? window.unmaximize() : window.maximize()
    else if (action === "close") window.close()
    else if (action === "fullscreen") window.setFullScreen(!window.isFullScreen())
  })

  // Phase 7: Multi-PC Office Network & Central Server IPC Handlers
  ipcMain.handle("network:get-status", async () => {
    return backendManager.getNetworkStatus()
  })

  ipcMain.handle("network:get-config", async () => {
    return backendManager.getNetworkConfig()
  })

  ipcMain.handle("network:save-config", async (_event, config: Partial<NetworkConfig>) => {
    return backendManager.saveNetworkConfig(config)
  })

  ipcMain.handle("network:test-connection", async (_event, url: string) => {
    return backendManager.testServerConnection(url)
  })

  ipcMain.handle("network:switch-mode", async (_event, payload: { mode: ConnectionMode; serverConfig?: Partial<NetworkConfig> }) => {
    return backendManager.switchMode(payload.mode, payload.serverConfig)
  })

  // Desktop Global Clipboard Bridge Handlers
  ipcMain.handle("clipboard:read-text", () => {
    try {
      return clipboard.readText()
    } catch {
      return ""
    }
  })

  ipcMain.handle("clipboard:write-text", (_event, text: unknown) => {
    try {
      if (typeof text === "string") {
        clipboard.writeText(text)
        return true
      }
      return false
    } catch {
      return false
    }
  })

  // Desktop Software Updater Handlers
  ipcMain.handle("updater:check", async (_event, customCandidate?: string) => {
    try {
      const installer = findInstallerPath(customCandidate)
      const currentVersion = app.getVersion() || "5.1.0"
      if (!installer) {
        return {
          success: true,
          hasUpdate: false,
          installerPath: null,
          installerName: null,
          installerSize: 0,
          installerFormattedSize: "0 MB",
          installerModifiedTime: null,
          version: currentVersion,
          currentVersion,
          sha256: null,
          status: "not_found",
        }
      }

      return {
        success: true,
        hasUpdate: true,
        installerPath: installer.path,
        installerName: path.basename(installer.path),
        installerSize: installer.size,
        installerFormattedSize: formatBytes(installer.size),
        installerModifiedTime: installer.mtime.toISOString(),
        version: installer.version || currentVersion,
        currentVersion,
        sha256: installer.sha256 || null,
        status: "ready_to_install",
      }
    } catch (e: any) {
      return {
        success: false,
        hasUpdate: false,
        error: e?.message || "Failed to check for updates",
      }
    }
  })

  ipcMain.handle("updater:install", async (_event, targetPath?: string) => {
    try {
      const installer = findInstallerPath(targetPath)
      if (!installer || !fs.existsSync(installer.path)) {
        return { success: false, error: "Setup executable was not found. Please verify release directory." }
      }

      // Launch the installer detached so it continues after app exits
      const child = spawn(installer.path, [], {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
      })
      child.unref()

      // Gracefully exit the current application after 1500ms so files are not locked
      setTimeout(() => {
        try {
          app.quit()
        } catch {
          process.exit(0)
        }
      }, 1500)

      return {
        success: true,
        message: "Installer launched successfully. The application will close in a moment to complete setup.",
        installerPath: installer.path,
      }
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to launch installer" }
    }
  })

  ipcMain.handle("updater:open-folder", async (_event, targetDirOrFile?: string) => {
    try {
      let targetPath = targetDirOrFile
      if (!targetPath) {
        const installer = findInstallerPath()
        targetPath = installer ? path.dirname(installer.path) : path.join(process.cwd(), "release")
      }
      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath)
        if (stats.isDirectory()) {
          shell.openPath(targetPath)
        } else {
          shell.showItemInFolder(targetPath)
        }
        return { success: true }
      }
      return { success: false, error: "Path does not exist" }
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to open directory" }
    }
  })

  ipcMain.handle("updater:select-file", async () => {
    const owner = getWindow()
    const result = owner
      ? await dialog.showOpenDialog(owner, {
          title: "Select AQ COMPANIES Update Package (.exe)",
          filters: [{ name: "Executable Installers (*.exe)", extensions: ["exe"] }],
          properties: ["openFile"],
        })
      : await dialog.showOpenDialog({
          title: "Select AQ COMPANIES Update Package (.exe)",
          filters: [{ name: "Executable Installers (*.exe)", extensions: ["exe"] }],
          properties: ["openFile"],
        })
    return result.canceled ? null : result.filePaths[0]
  })
}
