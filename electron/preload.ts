import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("skyDesktop", {
  platform: process.platform,
  selectFiles: (multiple = false) => ipcRenderer.invoke("dialog:open-files", { multiple }),
  selectFolder: () => ipcRenderer.invoke("dialog:open-folder"),
  saveFile: (defaultName: string, bytes: number[]) => ipcRenderer.invoke("file:save", { defaultName, bytes }),
  openFile: (filePath: string) => ipcRenderer.invoke("file:open", filePath),
  revealFile: (filePath: string) => ipcRenderer.invoke("file:reveal", filePath),
  print: (options?: { silent?: boolean; printBackground?: boolean; landscape?: boolean; margins?: any; pageSize?: any; deviceName?: string }) => ipcRenderer.invoke("print:page", options),
  getPrinters: () => ipcRenderer.invoke("print:get-printers"),
  getPreviewPdf: (options?: { landscape?: boolean; pageSize?: any }) => ipcRenderer.invoke("print:get-preview-pdf", options),
  getPreviewPDF: (options?: { landscape?: boolean; pageSize?: any }) => ipcRenderer.invoke("print:get-preview-pdf", options),
  exportPageToPdf: (defaultName: string) => ipcRenderer.invoke("print:pdf", defaultName),
  exportBackup: () => ipcRenderer.invoke("backup:export"),
  restoreBackup: () => ipcRenderer.invoke("backup:restore"),
  windowAction: (action: "minimize" | "maximize" | "close" | "fullscreen") => ipcRenderer.invoke("window:action", action),
  // Phase 7 Network Bridge
  getNetworkStatus: () => ipcRenderer.invoke("network:get-status"),
  getNetworkConfig: () => ipcRenderer.invoke("network:get-config"),
  saveNetworkConfig: (config: any) => ipcRenderer.invoke("network:save-config", config),
  testServerConnection: (url: string) => ipcRenderer.invoke("network:test-connection", url),
  switchNetworkMode: (mode: "local" | "server", serverConfig?: any) => ipcRenderer.invoke("network:switch-mode", { mode, serverConfig }),
  // Desktop Clipboard Bridge
  readClipboardText: () => ipcRenderer.invoke("clipboard:read-text"),
  writeClipboardText: (text: string) => ipcRenderer.invoke("clipboard:write-text", text),
  // Software Updater Bridge
  checkForUpdates: (customPath?: string) => ipcRenderer.invoke("updater:check", customPath),
  installUpdate: (options?: string | { targetPath?: string; silent?: boolean; isRepair?: boolean }) => ipcRenderer.invoke("updater:install", options),
  diagnoseUpdate: () => ipcRenderer.invoke("updater:diagnose"),
  prepareUpdate: () => ipcRenderer.invoke("updater:prepare"),
  createUpdateBackup: () => ipcRenderer.invoke("updater:backup-now"),
  getUpdateHistory: () => ipcRenderer.invoke("updater:get-history"),
  getUpdateSettings: () => ipcRenderer.invoke("updater:get-settings"),
  saveUpdateSettings: (settings: any) => ipcRenderer.invoke("updater:save-settings", settings),
  killProcesses: () => ipcRenderer.invoke("updater:kill-processes"),
  openUpdateFolder: (targetPath?: string) => ipcRenderer.invoke("updater:open-folder", targetPath),
  selectInstallerFile: () => ipcRenderer.invoke("updater:select-file"),
  onReleaseDetected: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on("updater:release-detected", handler)
    return () => ipcRenderer.removeListener("updater:release-detected", handler)
  },
})

// Native Desktop Menu Event Bridge
ipcRenderer.on("menu:new", () => {
  window.dispatchEvent(new CustomEvent("skybol:navigate-view", { detail: { view: "bol" } }))
  window.dispatchEvent(new CustomEvent("skybol:create-new-bol"))
})
ipcRenderer.on("menu:open", () => {
  window.dispatchEvent(new CustomEvent("skybol:navigate-view", { detail: { view: "bol" } }))
  window.dispatchEvent(new CustomEvent("skybol:editor-action", { detail: { action: "saved-documents", tab: "saved-documents" } }))
})
ipcRenderer.on("menu:save", () => {
  window.dispatchEvent(new CustomEvent("skybol:editor-action", { detail: { action: "save" } }))
})
ipcRenderer.on("menu:export-pdf", () => {
  window.dispatchEvent(new CustomEvent("skybol:editor-action", { detail: { action: "download" } }))
})

