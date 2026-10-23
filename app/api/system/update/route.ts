import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { CURRENT_SYSTEM_VERSION } from "@/lib/config/system-version"

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function findInstaller(customCandidate?: string | null): { path: string; size: number; mtime: Date; sha256?: string; version?: string } | null {
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
    path.join(process.resourcesPath || rootDir, "..", "..", "release"),
    path.join(process.env.USERPROFILE || "", "Downloads"),
    path.join(process.env.USERPROFILE || "", "Downloads", "release"),
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
            const content = fs.readFileSync(shaFile, "utf8").trim()
            sha256 = content.split(" ")[0]
          } catch {}
        }
        let version: string | undefined
        const latestYmlPath = path.join(dir, "latest.yml")
        if (fs.existsSync(latestYmlPath)) {
          try {
            const raw = fs.readFileSync(latestYmlPath, "utf8")
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customPath = searchParams.get("customPath")
    const installer = findInstaller(customPath)
    const rootDir = process.cwd()
    let latestYmlVersion = installer?.version || "5.1.0"
    let latestYmlDate = ""

    const installerDir = installer ? path.dirname(installer.path) : path.join(rootDir, "release")
    const latestYmlPath = path.join(installerDir, "latest.yml")
    if (fs.existsSync(latestYmlPath)) {
      try {
        const raw = fs.readFileSync(latestYmlPath, "utf8")
        const versionMatch = raw.match(/version:\s*([^\s]+)/)
        const dateMatch = raw.match(/releaseDate:\s*['"]?([^'"\n]+)/)
        if (versionMatch) latestYmlVersion = versionMatch[1]
        if (dateMatch) latestYmlDate = dateMatch[1]
      } catch {}
    }

    const hasInstaller = Boolean(installer)
    // If installer was created recently (or exists), it can be installed
    const installerMtime = installer ? installer.mtime.toISOString() : null
    const isNewer = Boolean(installer)

    return NextResponse.json({
      success: true,
      currentVersion: CURRENT_SYSTEM_VERSION.version,
      currentBuild: CURRENT_SYSTEM_VERSION.buildNumber,
      releaseDate: CURRENT_SYSTEM_VERSION.releaseDate,
      platform: process.platform,
      updateChannel: CURRENT_SYSTEM_VERSION.updateChannel,
      availableUpdate: {
        hasUpdate: isNewer,
        version: latestYmlVersion,
        installerName: installer ? path.basename(installer.path) : "AQ-COMPANIES-Setup.exe",
        installerPath: installer ? installer.path : null,
        installerSize: installer ? installer.size : 0,
        installerFormattedSize: installer ? formatBytes(installer.size) : "0 MB",
        installerModifiedTime: installerMtime,
        releaseDate: latestYmlDate || installerMtime || CURRENT_SYSTEM_VERSION.releaseDate,
        sha256: installer?.sha256 || null,
        status: hasInstaller ? "ready_to_install" : "up_to_date",
      },
      changelog: CURRENT_SYSTEM_VERSION.changelog,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to query system update status" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || "check"

    if (action === "kill-processes") {
      try {
        spawn("taskkill", ["/F", "/T", "/IM", "aq-backend.exe"], { windowsHide: true, stdio: "ignore" })
      } catch {}
      return NextResponse.json({ success: true, message: "Lingering background processes terminated." })
    }

    if (action === "install") {
      const targetPath = body.installerPath || body.customPath
      const isSilent = body.silent === true
      const installer = findInstaller(targetPath)
      if (!installer || !fs.existsSync(installer.path)) {
        return NextResponse.json(
          { success: false, error: "Installer executable (AQ-COMPANIES-Setup.exe) was not found in release directory." },
          { status: 404 }
        )
      }

      // Pre-emptively terminate background Python backend to release database locks
      try {
        spawn("taskkill", ["/F", "/T", "/IM", "aq-backend.exe"], { windowsHide: true, stdio: "ignore" })
      } catch {}

      // Launch installer detached with --updated flag to auto-upgrade
      const args = isSilent ? ["/S", "--updated"] : ["--updated"]
      const child = spawn(installer.path, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
      })
      child.unref()

      return NextResponse.json({
        success: true,
        message: "Installer launched successfully. Follow the on-screen setup prompts to complete the installation.",
        installerPath: installer.path,
      })
    }

    if (action === "open-folder") {
      const targetPath = body.installerPath || body.customPath
      const installer = findInstaller(targetPath)
      const targetDir = installer ? path.dirname(installer.path) : path.join(process.cwd(), "release")
      if (fs.existsSync(targetDir)) {
        spawn("explorer.exe", [targetDir], { detached: true, stdio: "ignore" }).unref()
        return NextResponse.json({ success: true, message: "Opened release directory in File Explorer." })
      }
      return NextResponse.json({ success: false, error: "Directory does not exist." }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Unknown action" })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process update action" },
      { status: 500 }
    )
  }
}
