export {}

export interface DesktopUpdateInfo {
  success: boolean
  status: "ready_to_install" | "up_to_date" | "same_version_new_build" | "downgrade_warning" | "not_found" | "verification_failed" | "insufficient_space" | "error"
  hasUpdate: boolean
  isRepairOrReinstall: boolean
  currentVersion: string
  currentBuild: string
  availableVersion: string
  version?: string
  availableBuild: string
  installerPath: string | null
  installerName: string | null
  installerSize: number
  installerFormattedSize: string
  installerModifiedTime: string | null
  releaseDate: string
  sha256: string | null
  manifestSha256: string | null
  isHashVerified: boolean
  channel: string
  error?: string
  diagnosticMessage?: string
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
      print(options?: { silent?: boolean; printBackground?: boolean; landscape?: boolean; margins?: any; pageSize?: any; deviceName?: string }): Promise<boolean>
      getPrinters(): Promise<Array<{ name: string; displayName: string; isDefault: boolean; status: number }>>
      getPreviewPdf(options?: { landscape?: boolean; pageSize?: any }): Promise<number[] | null>
      getPreviewPDF(options?: { landscape?: boolean; pageSize?: any }): Promise<number[] | null>
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
      installUpdate(options?: string | { targetPath?: string; silent?: boolean; isRepair?: boolean }): Promise<{ success: boolean; message: string; error?: string; backupPath?: string; runnerPath?: string }>
      diagnoseUpdate(): Promise<{ success: boolean; diagnostics: any; error?: string }>
      prepareUpdate(): Promise<{ success: boolean; message: string; diagnostics?: any; error?: string }>
      createUpdateBackup(): Promise<{ success: boolean; backupPath: string; backupName: string; recordCounts: any; error?: string }>
      getUpdateHistory(): Promise<{ success: boolean; history: any[]; error?: string }>
      getUpdateSettings(): Promise<{ success: boolean; settings: any; error?: string }>
      saveUpdateSettings(settings: any): Promise<{ success: boolean; settings: any; error?: string }>
      killProcesses(): Promise<{ success: boolean; message: string; error?: string }>
      openUpdateFolder(targetPath?: string): Promise<{ success: boolean; error?: string }>
      selectInstallerFile(): Promise<string | null>
      onReleaseDetected?(callback: (data: any) => void): () => void
    }
  }
}
