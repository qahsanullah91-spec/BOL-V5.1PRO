export {}

export interface DesktopUpdateInfo {
  success: boolean
  hasUpdate: boolean
  installerPath: string | null
  installerName: string | null
  installerSize: number
  installerFormattedSize: string
  installerModifiedTime: string | null
  version: string
  currentVersion: string
  sha256: string | null
  status: "ready_to_install" | "up_to_date" | "not_found" | string
  error?: string
}

declare global {
  interface Window {
    skyDesktop?: {
      platform: string
      selectFiles(multiple?: boolean): Promise<string[]>
      selectFolder(): Promise<string | null>
      saveFile(defaultName: string, bytes: number[]): Promise<string | null>
      openFile(filePath: string): Promise<string>
      revealFile(filePath: string): Promise<void>
      print(): Promise<boolean>
      exportPageToPdf(defaultName: string): Promise<string | null>
      exportBackup(): Promise<string | null>
      restoreBackup(): Promise<number | null>
      windowAction(action: "minimize" | "maximize" | "close" | "fullscreen"): Promise<void>
      getNetworkStatus(): Promise<any>
      getNetworkConfig(): Promise<any>
      saveNetworkConfig(config: any): Promise<any>
      testServerConnection(url: string): Promise<any>
      switchNetworkMode(mode: "local" | "server", serverConfig?: any): Promise<any>
      readClipboardText(): Promise<string>
      writeClipboardText(text: string): Promise<boolean>
      checkForUpdates(customPath?: string): Promise<DesktopUpdateInfo>
      installUpdate(installerPath?: string): Promise<{ success: boolean; message: string; error?: string }>
      openUpdateFolder(targetPath?: string): Promise<{ success: boolean; error?: string }>
      selectInstallerFile(): Promise<string | null>
    }
  }
}

