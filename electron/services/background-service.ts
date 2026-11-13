import { app, BrowserWindow, Menu, Tray, nativeImage, Notification, type NativeImage } from "electron"
import fs from "node:fs"
import path from "node:path"
import { atomicWriteFile } from "./atomic-file"

export interface BackgroundSettings {
  runInBackground: boolean
  startWithWindows: boolean
  minimizeToTray: boolean
  notifyOnBackground: boolean
}

const DEFAULT_SETTINGS: BackgroundSettings = {
  runInBackground: true,
  startWithWindows: false,
  minimizeToTray: true,
  notifyOnBackground: true,
}

let cachedSettings: BackgroundSettings = { ...DEFAULT_SETTINGS }
let trayInstance: Tray | null = null
let isAppQuitting = false
let lastNotificationTime = 0
let settingsFilePath = ""

export function isQuitting(): boolean {
  return isAppQuitting
}

export function setQuitting(value: boolean): void {
  isAppQuitting = value
}

export function getBackgroundSettingsPath(): string {
  if (!settingsFilePath) {
    try {
      const userData = app.getPath("userData")
      settingsFilePath = path.join(userData, "background-settings.json")
    } catch {
      settingsFilePath = path.join(process.cwd(), "data", "background-settings.json")
    }
  }
  return settingsFilePath
}

export function loadBackgroundSettings(): BackgroundSettings {
  try {
    const filePath = getBackgroundSettingsPath()
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8")
      const parsed = JSON.parse(raw) as Partial<BackgroundSettings>
      cachedSettings = {
        runInBackground: typeof parsed.runInBackground === "boolean" ? parsed.runInBackground : DEFAULT_SETTINGS.runInBackground,
        startWithWindows: typeof parsed.startWithWindows === "boolean" ? parsed.startWithWindows : DEFAULT_SETTINGS.startWithWindows,
        minimizeToTray: typeof parsed.minimizeToTray === "boolean" ? parsed.minimizeToTray : DEFAULT_SETTINGS.minimizeToTray,
        notifyOnBackground: typeof parsed.notifyOnBackground === "boolean" ? parsed.notifyOnBackground : DEFAULT_SETTINGS.notifyOnBackground,
      }
    }
  } catch (err) {
    console.error("Failed to load background settings from disk:", err)
  }

  // Cross-check with Windows login item status if available
  if (process.platform === "win32") {
    try {
      const loginSettings = app.getLoginItemSettings()
      if (typeof loginSettings.openAtLogin === "boolean") {
        cachedSettings.startWithWindows = loginSettings.openAtLogin
      }
    } catch {}
  }

  return { ...cachedSettings }
}

export async function saveBackgroundSettings(newSettings: Partial<BackgroundSettings>): Promise<BackgroundSettings> {
  cachedSettings = {
    ...cachedSettings,
    ...newSettings,
  }

  // Synchronize Windows Auto-Start
  if (process.platform === "win32" && typeof newSettings.startWithWindows === "boolean") {
    applyAutoStartSettings(newSettings.startWithWindows)
  }

  // Persist to disk atomically
  try {
    const filePath = getBackgroundSettingsPath()
    await atomicWriteFile(filePath, JSON.stringify(cachedSettings, null, 2))
  } catch (err) {
    console.error("Failed to save background settings to disk:", err)
  }

  // Refresh Tray context menu checkmarks
  updateTrayMenu()

  return { ...cachedSettings }
}

export function applyAutoStartSettings(enabled: boolean): boolean {
  if (process.platform !== "win32") return false
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true,
      path: process.execPath,
      args: ["--hidden"],
    })
    return true
  } catch (err) {
    console.error("Failed to update Windows auto-launch login item settings:", err)
    return false
  }
}

export function showAndFocusWindow(win: BrowserWindow | null): void {
  if (!win || win.isDestroyed()) return
  try {
    // 1. If hidden, show first so Windows DWM recognizes the HWND as visible
    if (!win.isVisible()) {
      win.show()
    }
    // 2. If minimized, un-minimize and restore to previous bounds
    if (win.isMinimized()) {
      win.restore()
    }
    // 3. Ensure window is visible, brought to top, and focused
    win.show()
    win.focus()

    // 4. Notify renderer that window has been restored
    if (win.webContents && !win.webContents.isDestroyed()) {
      try {
        win.webContents.send("window:restored")
      } catch {}
    }
  } catch (err) {
    console.error('Failed to show and focus window:', err)
  }
}

export function notifyBackgroundActive(title?: string, content?: string): void {
  if (!cachedSettings.notifyOnBackground) return

  // Prevent spamming notification: max once per 3 minutes unless explicitly called
  const now = Date.now()
  if (now - lastNotificationTime < 180_000) return
  lastNotificationTime = now

  const notificationTitle = title || "AQ COMPANIES • Running in Background"
  const notificationContent = content || "Application is minimized to the system tray. Double-click the tray icon anytime to restore."

  if (trayInstance && !trayInstance.isDestroyed() && process.platform === "win32") {
    try {
      trayInstance.displayBalloon({
        title: notificationTitle,
        content: notificationContent,
        iconType: "info",
      })
      return
    } catch {}
  }

  try {
    if (Notification.isSupported()) {
      new Notification({
        title: notificationTitle,
        body: notificationContent,
        silent: true,
      }).show()
    }
  } catch {}
}

export function testNotificationBalloon(customTitle?: string, customContent?: string): { success: boolean; message: string } {
  const title = customTitle || "AQ COMPANIES • Background Tray Test";
  const content = customContent || "Desktop notification and system tray integration is working properly! Double-click tray icon anytime to restore.";

  if (trayInstance && !trayInstance.isDestroyed() && process.platform === "win32") {
    try {
      trayInstance.displayBalloon({
        title,
        content,
        iconType: "info",
      });
      return { success: true, message: "Windows notification balloon sent successfully" };
    } catch (err) {
      console.warn("displayBalloon error, falling back to Notification API:", err);
    }
  }

  try {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body: content,
        silent: false,
      }).show();
      return { success: true, message: "Desktop notification toast displayed" };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || "Notification display failed" };
  }

  return { success: false, message: "Notifications not supported in current environment" };
}

export function getBackgroundServiceDiagnostics(): {
  isResidentActive: boolean;
  isTrayInitialized: boolean;
  platform: string;
  uptimeSeconds: number;
  memoryMB: number;
  openAtLogin: boolean;
  trayTooltip: string;
} {
  const mem = process.memoryUsage();
  let openAtLogin = false;
  if (process.platform === "win32") {
    try {
      openAtLogin = app.getLoginItemSettings().openAtLogin;
    } catch {}
  }
  return {
    isResidentActive: cachedSettings.runInBackground,
    isTrayInitialized: Boolean(trayInstance && !trayInstance.isDestroyed()),
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: Math.round(mem.rss / (1024 * 1024)),
    openAtLogin,
    trayTooltip: "AQ COMPANIES • Logistics and BOL Management (Background Active)",
  };
}

function resolveTrayIcon(): NativeImage {
  const candidatePaths: string[] = [
    app.isPackaged ? path.join(process.resourcesPath, "app-icon.ico") : "",
    app.isPackaged ? path.join(process.resourcesPath, "icon-light-32x32.png") : "",
    app.isPackaged ? path.join(process.resourcesPath, "app-icon.png") : "",
    path.join(process.cwd(), "public", "app-icon.ico"),
    path.join(process.cwd(), "public", "icon-light-32x32.png"),
    path.join(process.cwd(), "public", "app-icon.png"),
    path.join(process.cwd(), "public", "icon-512x512.png"),
  ].filter(Boolean)

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const img = nativeImage.createFromPath(candidate)
        if (!img.isEmpty()) {
          if (candidate.endsWith(".ico")) return img
          return img.resize({ width: 16, height: 16 })
        }
      }
    } catch {}
  }

  return nativeImage.createEmpty()
}

let windowGetterRef: (() => BrowserWindow | null) | null = null

export function updateTrayMenu(): void {
  if (!trayInstance || trayInstance.isDestroyed()) return

  const win = windowGetterRef ? windowGetterRef() : null
  const isVisible = win && !win.isDestroyed() && win.isVisible()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: isVisible ? "Hide to System Tray (انتقال به پس‌زمینه)" : "Open AQ COMPANIES (باز کردن نرم‌افزار)",
      click: () => {
        const targetWin = windowGetterRef ? windowGetterRef() : null
        if (!targetWin || targetWin.isDestroyed()) return
        if (targetWin.isVisible()) {
          targetWin.hide()
        } else {
          showAndFocusWindow(targetWin)
        }
      },
    },
    {
      label: "Lock Application Now (قفل سریع برنامه)",
      click: () => {
        const targetWin = windowGetterRef ? windowGetterRef() : null
        if (targetWin && !targetWin.isDestroyed()) {
          showAndFocusWindow(targetWin)
          targetWin.webContents.send("security:trigger-lock")
        }
      },
    },
    { type: "separator" },
    {
      label: "Status: 24/7 Background Engine Active",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Run in Background on Close (اجرا در پس‌زمینه)",
      type: "checkbox",
      checked: cachedSettings.runInBackground,
      click: (item) => {
        void saveBackgroundSettings({ runInBackground: item.checked }).then((updated) => {
          const targetWin = windowGetterRef ? windowGetterRef() : null
          targetWin?.webContents.send("background:settings-changed", updated)
        })
      },
    },
    {
      label: "Start with Windows (اجرا خودکار با ویندوز)",
      type: "checkbox",
      checked: cachedSettings.startWithWindows,
      click: (item) => {
        void saveBackgroundSettings({ startWithWindows: item.checked }).then((updated) => {
          const targetWin = windowGetterRef ? windowGetterRef() : null
          targetWin?.webContents.send("background:settings-changed", updated)
        })
      },
    },
    {
      label: "Minimize to Tray (کوچک کردن به سینی)",
      type: "checkbox",
      checked: cachedSettings.minimizeToTray,
      click: (item) => {
        void saveBackgroundSettings({ minimizeToTray: item.checked }).then((updated) => {
          const targetWin = windowGetterRef ? windowGetterRef() : null
          targetWin?.webContents.send("background:settings-changed", updated)
        })
      },
    },
    { type: "separator" },
    {
      label: "Check for Updates... (بررسی بروزرسانی)",
      click: () => {
        const targetWin = windowGetterRef ? windowGetterRef() : null
        if (targetWin && !targetWin.isDestroyed()) {
          showAndFocusWindow(targetWin)
          targetWin.webContents.send("skybol:navigate-view", { view: "settings" })
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit Completely (خروج کامل از نرم‌افزار)",
      click: () => {
        quitCompletely()
      },
    },
  ])

  trayInstance.setContextMenu(contextMenu)
}

export function initBackgroundService(windowGetter: () => BrowserWindow | null): Tray | null {
  windowGetterRef = windowGetter
  loadBackgroundSettings()

  try {
    const icon = resolveTrayIcon()
    if (trayInstance && !trayInstance.isDestroyed()) {
      trayInstance.destroy()
    }

    trayInstance = new Tray(icon)
    trayInstance.setToolTip("AQ COMPANIES • Logistics & BOL Management (Background Active)")

    updateTrayMenu()

    trayInstance.on("click", () => {
      const win = windowGetterRef ? windowGetterRef() : null
      showAndFocusWindow(win)
      updateTrayMenu()
    })

    trayInstance.on("double-click", () => {
      const win = windowGetterRef ? windowGetterRef() : null
      showAndFocusWindow(win)
      updateTrayMenu()
    })

    return trayInstance
  } catch (err) {
    console.error("Failed to initialize system tray for background service:", err)
    return null
  }
}

export function quitCompletely(): void {
  setQuitting(true)
  if (trayInstance && !trayInstance.isDestroyed()) {
    try {
      trayInstance.destroy()
    } catch {}
    trayInstance = null
  }
  app.quit()
}
