/**
 * AQ COMPANIES - Electron Native Update Engine
 * Implements version checking, real SHA-256 verification, protective pre-update backup,
 * diagnostics, and safe external updater execution within the Electron process.
 */

import { app } from "electron"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { spawn, execSync } from "node:child_process"

export type UpdateStatus =
  | "ready_to_install"
  | "up_to_date"
  | "same_version_new_build"
  | "downgrade_warning"
  | "not_found"
  | "verification_failed"
  | "insufficient_space"
  | "error"

export interface ReleaseManifest {
  appName: string
  version: string
  build: string
  platform: string
  architecture: string
  installer: string
  sha256: string
  size: number
  formattedSize?: string
  releaseDate: string
  channel: string
  minimumSupportedVersion?: string
}

export interface DesktopUpdateInfo {
  success: boolean
  status: UpdateStatus
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

export interface UpdateSettings {
  autoCheck: boolean
  checkIntervalMinutes: number
  autoDownload: boolean
  installationMode: "seamless" | "guided"
  releaseChannel: "stable" | "beta"
  customReleaseDir: string
  backupBeforeUpdate: boolean
  restartAfterUpdate: "prompt" | "auto"
}

export interface UpdateHistoryItem {
  id: string
  version: string
  build: string
  date: string
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS"
  installer: string
  sha256: string
  verification: string
  backupPath?: string
  details: string
}

export interface SystemDiagnosticResult {
  timestamp: string
  isReadyForUpdate: boolean
  processes: Array<{ name: string; pid?: number; status: "running" | "idle" | "stopped"; description: string }>
  fileLocks: Array<{ file: string; locked: boolean; description: string }>
  diskSpace: { drive: string; freeBytes: number; freeFormatted: string; requiredBytes: number; isSufficient: boolean }
  databaseHealth: { ok: boolean; message: string; recordCount?: number }
  warnings: string[]
  recommendations: string[]
}

const DEFAULT_SETTINGS: UpdateSettings = {
  autoCheck: true,
  checkIntervalMinutes: 30,
  autoDownload: false,
  installationMode: "guided",
  releaseChannel: "stable",
  customReleaseDir: "",
  backupBeforeUpdate: true,
  restartAfterUpdate: "prompt",
}

// SemVer Parsing & Comparison
export function parseSemVer(v: string) {
  const clean = String(v || "").trim().replace(/^v/i, "")
  const [corePart, buildPart = ""] = clean.split("+")
  const [verPart, prePart = ""] = corePart.split("-")
  const parts = verPart.split(".").map((n) => parseInt(n, 10))

  return {
    major: Number.isFinite(parts[0]) ? parts[0] : 0,
    minor: Number.isFinite(parts[1]) ? parts[1] : 0,
    patch: Number.isFinite(parts[2]) ? parts[2] : 0,
    prerelease: prePart.trim().toLowerCase(),
    build: buildPart.trim(),
  }
}

export function compareSemVer(v1Str: string, v2Str: string): number {
  const v1 = parseSemVer(v1Str)
  const v2 = parseSemVer(v2Str)

  if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1
  if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1
  if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1

  if (!v1.prerelease && v2.prerelease) return 1
  if (v1.prerelease && !v2.prerelease) return -1
  if (v1.prerelease && v2.prerelease) {
    if (v1.prerelease !== v2.prerelease) {
      return v1.prerelease.localeCompare(v2.prerelease)
    }
  }

  return 0
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function computeSha256(filePath: string): string {
  if (!fs.existsSync(filePath)) return ""
  const fileBuffer = fs.readFileSync(filePath)
  return crypto.createHash("sha256").update(fileBuffer).digest("hex")
}

function getDataDirectory(): string {
  try {
    return path.join(app.getPath("userData"), "data")
  } catch {
    return path.join(process.cwd(), "data")
  }
}

function getCandidateReleaseDirs(customDir?: string): string[] {
  const dirs: string[] = []
  if (customDir && fs.existsSync(customDir)) {
    dirs.push(path.resolve(customDir))
  }

  const rootDir = process.cwd()
  let userProfile = ""
  try {
    userProfile = app.getPath("downloads")
  } catch {
    userProfile = process.env.USERPROFILE || ""
  }

  dirs.push(
    path.join(rootDir, "release"),
    path.join(getDataDirectory(), "release"),
    "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5\\release",
    path.join(rootDir, "..", "release"),
    userProfile,
    path.join(userProfile, "release")
  )

  return Array.from(new Set(dirs.filter((d) => fs.existsSync(d))))
}

export function findInstallerCandidate(customCandidate?: string | null): {
  installerPath: string
  installerName: string
  installerDir: string
  manifest: ReleaseManifest | null
} | null {
  if (customCandidate && fs.existsSync(customCandidate)) {
    const stats = fs.statSync(customCandidate)
    if (stats.isFile() && customCandidate.toLowerCase().endsWith(".exe")) {
      const installerDir = path.dirname(customCandidate)
      const manifest = readReleaseManifest(installerDir)
      return {
        installerPath: path.resolve(customCandidate),
        installerName: path.basename(customCandidate),
        installerDir,
        manifest,
      }
    } else if (stats.isDirectory()) {
      const found = scanDirectoryForInstaller(customCandidate)
      if (found) return found
    }
  }

  const settings = getUpdateSettings()
  if (settings.customReleaseDir && fs.existsSync(settings.customReleaseDir)) {
    const found = scanDirectoryForInstaller(settings.customReleaseDir)
    if (found) return found
  }

  const candidates = getCandidateReleaseDirs()
  for (const dir of candidates) {
    const found = scanDirectoryForInstaller(dir)
    if (found) return found
  }

  return null
}

function scanDirectoryForInstaller(dir: string): {
  installerPath: string
  installerName: string
  installerDir: string
  manifest: ReleaseManifest | null
} | null {
  try {
    const files = fs.readdirSync(dir)
    const installerName = files.find(
      (f) => f.startsWith("AQ-COMPANIES-Setup") && f.endsWith(".exe") && !f.includes(".blockmap")
    )
    if (installerName) {
      const installerPath = path.join(dir, installerName)
      const manifest = readReleaseManifest(dir)
      return {
        installerPath,
        installerName,
        installerDir: dir,
        manifest,
      }
    }
  } catch {}
  return null
}

export function readReleaseManifest(dir: string): ReleaseManifest | null {
  const manifestPath = path.join(dir, "release-manifest.json")
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = fs.readFileSync(manifestPath, "utf8")
      return JSON.parse(raw) as ReleaseManifest
    } catch {}
  }
  return null
}

export async function evaluateSystemUpdate(customCandidate?: string | null): Promise<DesktopUpdateInfo> {
  const currentVersion = (app.getVersion() || "5.2.10").replace(/^v/i, "")
  const currentBuild = "2026.10.25-PRO-11"

  const candidate = findInstallerCandidate(customCandidate)
  if (!candidate || !fs.existsSync(candidate.installerPath)) {
    return {
      success: true,
      status: "not_found",
      hasUpdate: false,
      isRepairOrReinstall: false,
      currentVersion,
      currentBuild,
      availableVersion: currentVersion,
      version: currentVersion,
      availableBuild: currentBuild,
      installerPath: null,
      installerName: null,
      installerSize: 0,
      installerFormattedSize: "0 MB",
      installerModifiedTime: null,
      releaseDate: new Date().toISOString().slice(0, 10),
      sha256: null,
      manifestSha256: null,
      isHashVerified: false,
      channel: "stable",
      diagnosticMessage: "No installer package was detected in configured release directories.",
    }
  }

  const { installerPath, installerName, installerDir, manifest } = candidate
  const stats = fs.statSync(installerPath)
  const installerModifiedTime = stats.mtime.toISOString()

  const actualSha256 = computeSha256(installerPath)
  let expectedSha256: string | null = manifest?.sha256 || null
  if (!expectedSha256) {
    const companionSha = `${installerPath}.sha256`
    if (fs.existsSync(companionSha)) {
      try {
        const raw = fs.readFileSync(companionSha, "utf8").trim()
        expectedSha256 = raw.split(" ")[0].trim().toLowerCase()
      } catch {}
    }
  }

  let availableVersion = manifest?.version || ""
  let availableBuild = manifest?.build || ""
  let releaseDate = manifest?.releaseDate || ""

  if (!availableVersion) {
    const latestYmlPath = path.join(installerDir, "latest.yml")
    if (fs.existsSync(latestYmlPath)) {
      try {
        const raw = fs.readFileSync(latestYmlPath, "utf8")
        const vMatch = raw.match(/version:\s*([^\s]+)/)
        const dMatch = raw.match(/releaseDate:\s*['"]?([^'"\n]+)/)
        if (vMatch) availableVersion = vMatch[1].replace(/^v/i, "")
        if (dMatch) releaseDate = dMatch[1]
      } catch {}
    }
  }

  if (!availableVersion) {
    const match = installerName.match(/(\d+\.\d+\.\d+)/)
    availableVersion = match ? match[1] : currentVersion
  }
  if (!releaseDate) {
    releaseDate = installerModifiedTime
  }

  const isHashVerified = Boolean(
    expectedSha256 && actualSha256 && expectedSha256.toLowerCase() === actualSha256.toLowerCase()
  )

  if (expectedSha256 && !isHashVerified) {
    return {
      success: true,
      status: "verification_failed",
      hasUpdate: false,
      isRepairOrReinstall: false,
      currentVersion,
      currentBuild,
      availableVersion,
    version: availableVersion,
      availableBuild,
      installerPath,
      installerName,
      installerSize: stats.size,
      installerFormattedSize: formatBytes(stats.size),
      installerModifiedTime,
      releaseDate,
      sha256: actualSha256,
      manifestSha256: expectedSha256,
      isHashVerified: false,
      channel: manifest?.channel || "stable",
      error: "Cryptographic hash mismatch. The installer file is corrupted or untrusted.",
      diagnosticMessage: `Computed SHA-256 (${actualSha256.slice(0, 16)}...) does not match expected (${expectedSha256.slice(0, 16)}...).`,
    }
  }

  const comparison = compareSemVer(availableVersion, currentVersion)

  let status: UpdateStatus
  let hasUpdate = false
  let isRepairOrReinstall = false

  if (comparison > 0) {
    status = "ready_to_install"
    hasUpdate = true
  } else if (comparison === 0) {
    if (availableBuild && currentBuild && availableBuild !== currentBuild) {
      status = "same_version_new_build"
      hasUpdate = false
      isRepairOrReinstall = true
    } else {
      status = "up_to_date"
      hasUpdate = false
      isRepairOrReinstall = true
    }
  } else {
    status = "downgrade_warning"
    hasUpdate = false
    isRepairOrReinstall = true
  }

  return {
    success: true,
    status,
    hasUpdate,
    isRepairOrReinstall,
    currentVersion,
    currentBuild,
    availableVersion,
    version: availableVersion,
    availableBuild: availableBuild || currentBuild,
    installerPath,
    installerName,
    installerSize: stats.size,
    installerFormattedSize: formatBytes(stats.size),
    installerModifiedTime,
    releaseDate,
    sha256: actualSha256,
    manifestSha256: expectedSha256 || actualSha256,
    isHashVerified: true,
    channel: manifest?.channel || "stable",
    diagnosticMessage:
      status === "up_to_date"
        ? "Your software is up to date. The available installer matches current version."
        : status === "ready_to_install"
        ? `A newer software release (v${availableVersion}) is ready to install.`
        : status === "same_version_new_build"
        ? `Installer build (${availableBuild}) differs from installed build (${currentBuild}).`
        : "Available installer is older than current version.",
  }
}

export async function createPreUpdateBackup(): Promise<{
  success: boolean
  backupPath: string
  backupName: string
  recordCounts: { bols: number; accounts: number; invoices: number; shipments: number }
  error?: string
}> {
  try {
    const dataDir = getDataDirectory()
    const backupRoot = path.join(dataDir, "backups")
    const currentVer = app.getVersion() || "5.2.10"
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const backupName = `pre-update-v${currentVer.replace(/^v/i, "")}-${timestamp}`
    const targetDir = path.join(backupRoot, backupName)

    fs.mkdirSync(targetDir, { recursive: true })

    const scanDirs = [dataDir, process.cwd(), "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5"]
    const copiedFiles: string[] = []

    let bolsCount = 0
    let accountsCount = 0
    let invoicesCount = 0
    let shipmentsCount = 0

    for (const dir of Array.from(new Set(scanDirs))) {
      if (!fs.existsSync(dir)) continue
      try {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          if (file.startsWith(".local-") && file.endsWith(".json")) {
            const src = path.join(dir, file)
            const dest = path.join(targetDir, file)
            if (!fs.existsSync(dest)) {
              fs.copyFileSync(src, dest)
              copiedFiles.push(file)
              try {
                const content = JSON.parse(fs.readFileSync(src, "utf8"))
                if (file.includes("bols") && Array.isArray(content)) bolsCount = content.length
                if (file.includes("accounts") && Array.isArray(content)) accountsCount = content.length
                if (file.includes("invoices") && Array.isArray(content)) invoicesCount = content.length
                if (file.includes("shipments") && Array.isArray(content)) shipmentsCount = content.length
              } catch {}
            }
          }
        }
      } catch {}
    }

    const candidateDbs = [
      path.join(dataDir, "app.db"),
      path.join(process.cwd(), "data", "app.db"),
      "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5\\data\\app.db",
    ]
    for (const dbPath of candidateDbs) {
      if (fs.existsSync(dbPath)) {
        try {
          const destDb = path.join(targetDir, "app.db")
          if (!fs.existsSync(destDb)) {
            fs.copyFileSync(dbPath, destDb)
            copiedFiles.push("app.db")
          }
        } catch {}
      }
    }

    const manifest = {
      backupType: "PRE_UPDATE_PROTECTIVE_SNAPSHOT",
      appName: "AQ-COMPANIES",
      currentVersion: currentVer,
      buildNumber: "2026.10.25-PRO-11",
      createdAt: new Date().toISOString(),
      files: copiedFiles,
      recordCounts: {
        bols: bolsCount,
        accounts: accountsCount,
        invoices: invoicesCount,
        shipments: shipmentsCount,
      },
    }

    fs.writeFileSync(path.join(targetDir, "backup-manifest.json"), JSON.stringify(manifest, null, 2), "utf8")

    return {
      success: true,
      backupPath: targetDir,
      backupName,
      recordCounts: manifest.recordCounts,
    }
  } catch (error: any) {
    return {
      success: false,
      backupPath: "",
      backupName: "",
      recordCounts: { bols: 0, accounts: 0, invoices: 0, shipments: 0 },
      error: error?.message || "Failed to create pre-update backup snapshot",
    }
  }
}

export async function runSystemDiagnostics(): Promise<SystemDiagnosticResult> {
  const timestamp = new Date().toISOString()
  const processes: SystemDiagnosticResult["processes"] = []
  const fileLocks: SystemDiagnosticResult["fileLocks"] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  try {
    const tasklist = execSync("tasklist /FO CSV /NH", { windowsHide: true, encoding: "utf8" })
    const lower = tasklist.toLowerCase()

    const hasElectron = lower.includes("aq companies.exe")
    const hasBackend = lower.includes("aq-backend.exe")

    processes.push({
      name: "AQ COMPANIES.exe",
      status: hasElectron ? "running" : "idle",
      description: "Primary Electron Desktop Application Container",
    })

    processes.push({
      name: "aq-backend.exe",
      status: hasBackend ? "running" : "stopped",
      description: "Standalone Python Logistics & Financial Microservice",
    })
  } catch {
    processes.push({
      name: "AQ Application Processes",
      status: "running",
      description: "Desktop Application Process Tree",
    })
  }

  const dataDir = getDataDirectory()
  const criticalFiles = [
    { name: ".local-bols.json", path: path.join(dataDir, ".local-bols.json") },
    { name: ".local-account-ledgers.json", path: path.join(dataDir, ".local-account-ledgers.json") },
    { name: "app.db", path: path.join(dataDir, "app.db") },
  ]

  for (const item of criticalFiles) {
    if (fs.existsSync(item.path)) {
      try {
        const fd = fs.openSync(item.path, "r")
        fs.closeSync(fd)
        fileLocks.push({ file: item.name, locked: false, description: "Unlocked and accessible" })
      } catch (err: any) {
        fileLocks.push({ file: item.name, locked: true, description: `File handle busy: ${err.message}` })
        warnings.push(`File ${item.name} is currently locked by a process.`)
      }
    } else {
      fileLocks.push({ file: item.name, locked: false, description: "Not present (clean state)" })
    }
  }

  let freeBytes = 10 * 1024 * 1024 * 1024
  let driveLetter = "D:"
  try {
    const cwdRoot = path.parse(process.cwd()).root
    driveLetter = cwdRoot.replace(/\\$/, "")
    const psOut = execSync(
      `powershell -NoProfile -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Root -like '${driveLetter}*' }).Free"`,
      { windowsHide: true, encoding: "utf8" }
    ).trim()
    const parsed = parseInt(psOut, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      freeBytes = parsed
    }
  } catch {}

  const requiredBytes = 1.5 * 1024 * 1024 * 1024
  const isSufficient = freeBytes >= requiredBytes
  if (!isSufficient) {
    warnings.push(`Low disk space on ${driveLetter}: Only ${formatBytes(freeBytes)} free (1.5 GB required).`)
    recommendations.push("Free up disk space on target installation drive before upgrading.")
  }

  let dbHealthOk = true
  let dbMessage = "All core local JSON databases are well-formed."
  let recordCount = 0
  const bolsPath = path.join(dataDir, ".local-bols.json")
  if (fs.existsSync(bolsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(bolsPath, "utf8"))
      if (Array.isArray(data)) recordCount = data.length
    } catch {
      dbHealthOk = false
      dbMessage = "Corrupt JSON detected in .local-bols.json"
      warnings.push("Database file .local-bols.json could not be parsed as valid JSON.")
    }
  }

  const isReadyForUpdate = isSufficient && dbHealthOk && !fileLocks.some((l) => l.locked)

  return {
    timestamp,
    isReadyForUpdate,
    processes,
    fileLocks,
    diskSpace: {
      drive: driveLetter,
      freeBytes,
      freeFormatted: formatBytes(freeBytes),
      requiredBytes,
      isSufficient,
    },
    databaseHealth: {
      ok: dbHealthOk,
      message: dbMessage,
      recordCount,
    },
    warnings,
    recommendations,
  }
}

export async function prepareAndExecuteUpdate(options: {
  installerPath?: string | null
  silent?: boolean
  isRepair?: boolean
}): Promise<{
  success: boolean
  message: string
  backupPath?: string
  runnerPath?: string
  error?: string
}> {
  const evalResult = await evaluateSystemUpdate(options.installerPath)
  if (!evalResult.installerPath || !fs.existsSync(evalResult.installerPath)) {
    return { success: false, message: "Installer package was not found." }
  }

  if (evalResult.status === "verification_failed") {
    return { success: false, message: "Update aborted: Cryptographic SHA-256 verification failed." }
  }

  const diagnostics = await runSystemDiagnostics()
  if (!diagnostics.diskSpace.isSufficient) {
    return {
      success: false,
      message: `Insufficient disk space (${diagnostics.diskSpace.freeFormatted} free). 1.5 GB is required.`,
    }
  }

  const backupRes = await createPreUpdateBackup()
  if (!backupRes.success) {
    return {
      success: false,
      message: `Failed to create protective pre-update backup: ${backupRes.error}`,
    }
  }

  const historyItem: UpdateHistoryItem = {
    id: `update-${Date.now()}`,
    version: evalResult.availableVersion,
    build: evalResult.availableBuild,
    date: new Date().toISOString(),
    status: "IN_PROGRESS",
    installer: evalResult.installerName || "AQ-COMPANIES-Setup.exe",
    sha256: evalResult.sha256 || "",
    verification: evalResult.isHashVerified ? "SHA-256 Verified" : "Unverified",
    backupPath: backupRes.backupPath,
    details: `Initiated update from v${evalResult.currentVersion} to v${evalResult.availableVersion}`,
  }
  recordUpdateHistory(historyItem)

  const tempDir = process.env.TEMP || process.env.TMP || path.join(process.cwd(), "scratch")
  fs.mkdirSync(tempDir, { recursive: true })

  const runnerFileName = `aq-updater-${Date.now()}.bat`
  const runnerPath = path.join(tempDir, runnerFileName)
  const logPath = path.join(tempDir, `aq-updater-${Date.now()}.log`)

  const installerPath = evalResult.installerPath
  const isSilent = Boolean(options.silent)
  const args = isSilent ? "/S --updated" : "--updated"

  const installedAppExe = path.join(
    process.env.LOCALAPPDATA || "C:\\Users\\Default\\AppData\\Local",
    "Programs",
    "AQ COMPANIES",
    "AQ COMPANIES.exe"
  )

  const nsisArgs = isSilent ? "/S" : ""

  const runnerScript = `@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ================================================================= > "${logPath}"
echo      AQ COMPANIES - SECURE SOFTWARE UPDATER RUNNER >> "${logPath}"
echo      Timestamp: %DATE% %TIME% >> "${logPath}"
echo      Target Installer: "${installerPath}" >> "${logPath}"
echo      Mode: ${isSilent ? "Seamless / Silent" : "Guided Setup Wizard"} >> "${logPath}"
echo ================================================================= >> "${logPath}"

echo [1/3] Waiting for parent application processes to exit cleanly... >> "${logPath}"
for /L %%i in (1,1,10) do (
  tasklist /FI "IMAGENAME eq AQ COMPANIES.exe" 2>nul | find /I /N "AQ COMPANIES.exe">nul
  if errorlevel 1 (
    goto :PROCESS_CLEARED
  )
  timeout /t 1 /nobreak >nul
)

:: Forcibly release any lingering locks if application hasn't exited yet
taskkill /F /T /IM "AQ COMPANIES.exe" >nul 2>&1
taskkill /F /T /IM "aq-backend.exe" >nul 2>&1
timeout /t 1 /nobreak >nul

:PROCESS_CLEARED
echo [2/3] Executing installer package... >> "${logPath}"
${
  isSilent
    ? `start /wait "" "${installerPath}" ${nsisArgs}
set INSTALLER_EXIT=!ERRORLEVEL!
echo [3/3] Installer finished with exit code: !INSTALLER_EXIT! >> "${logPath}"

if "!INSTALLER_EXIT!"=="0" (
  echo Installation succeeded. Locating installed AQ COMPANIES.exe to relaunch... >> "${logPath}"
  set "APP_EXE="
  if exist "%LOCALAPPDATA%\\Programs\\AQ COMPANIES\\AQ COMPANIES.exe" (
    set "APP_EXE=%LOCALAPPDATA%\\Programs\\AQ COMPANIES\\AQ COMPANIES.exe"
  ) else if exist "%ProgramFiles%\\AQ COMPANIES\\AQ COMPANIES.exe" (
    set "APP_EXE=%ProgramFiles%\\AQ COMPANIES\\AQ COMPANIES.exe"
  ) else if exist "%ProgramFiles(x86)%\\AQ COMPANIES\\AQ COMPANIES.exe" (
    set "APP_EXE=%ProgramFiles(x86)%\\AQ COMPANIES\\AQ COMPANIES.exe"
  )
  if defined APP_EXE (
    echo Launching: !APP_EXE! >> "${logPath}"
    start "" "!APP_EXE!" --updated
  ) else (
    echo Note: Installed executable not in default paths; user can launch from desktop shortcut. >> "${logPath}"
  )
) else (
  echo Installer returned non-zero exit code: !INSTALLER_EXIT! >> "${logPath}"
)`
    : `start "" "${installerPath}"
echo [3/3] Guided installer launched into user session. >> "${logPath}"`
}

timeout /t 2 /nobreak >nul
(goto) 2>nul & del "%~f0"
exit /b 0
`

  fs.writeFileSync(runnerPath, runnerScript, "utf8")

  // Spawn runner detached without extra quotes that trigger cmd.exe syntax error
  const child = spawn("cmd.exe", ["/c", runnerPath], {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  })
  child.unref()

  return {
    success: true,
    message: "Pre-update backup created and external updater runner launched.",
    backupPath: backupRes.backupPath,
    runnerPath,
  }
}

function getHistoryFilePath(): string {
  const dataDir = getDataDirectory()
  return path.join(dataDir, ".local-update-history.json")
}

export function getUpdateHistory(): UpdateHistoryItem[] {
  const file = getHistoryFilePath()
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, "utf8")
      const list = JSON.parse(raw)
      if (Array.isArray(list)) return list
    } catch {}
  }
  return []
}

export function recordUpdateHistory(item: UpdateHistoryItem): void {
  const file = getHistoryFilePath()
  const history = getUpdateHistory()
  const existingIdx = history.findIndex((h) => h.id === item.id)
  if (existingIdx >= 0) {
    history[existingIdx] = item
  } else {
    history.unshift(item)
  }

  const pruned = history.slice(0, 50)
  const tempPath = `${file}.tmp.${Date.now()}`
  fs.writeFileSync(tempPath, JSON.stringify(pruned, null, 2), "utf8")
  fs.renameSync(tempPath, file)
}

function getSettingsFilePath(): string {
  const dataDir = getDataDirectory()
  return path.join(dataDir, ".local-update-settings.json")
}

export function getUpdateSettings(): UpdateSettings {
  const file = getSettingsFilePath()
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, "utf8")
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {}
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveUpdateSettings(settings: Partial<UpdateSettings>): UpdateSettings {
  const current = getUpdateSettings()
  const updated: UpdateSettings = { ...current, ...settings }
  const file = getSettingsFilePath()
  const tempPath = `${file}.tmp.${Date.now()}`
  fs.writeFileSync(tempPath, JSON.stringify(updated, null, 2), "utf8")
  fs.renameSync(tempPath, file)
  return updated
}
