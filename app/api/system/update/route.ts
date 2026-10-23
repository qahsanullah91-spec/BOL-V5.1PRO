import { NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { CURRENT_SYSTEM_VERSION } from "@/lib/config/system-version"
import {
  evaluateSystemUpdate,
  runSystemDiagnostics,
  createPreUpdateBackup,
  prepareAndExecuteUpdate,
  getUpdateHistory,
  getUpdateSettings,
  saveUpdateSettings,
} from "@/lib/services/system-update-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customPath = searchParams.get("customPath")
    const updateInfo = await evaluateSystemUpdate(customPath)
    const settings = getUpdateSettings()
    const history = getUpdateHistory().slice(0, 5)

    return NextResponse.json({
      success: true,
      currentVersion: CURRENT_SYSTEM_VERSION.version,
      currentBuild: CURRENT_SYSTEM_VERSION.buildNumber,
      releaseDate: CURRENT_SYSTEM_VERSION.releaseDate,
      platform: process.platform,
      updateChannel: settings.releaseChannel || CURRENT_SYSTEM_VERSION.updateChannel,
      availableUpdate: {
        hasUpdate: updateInfo.hasUpdate,
        status: updateInfo.status,
        isRepairOrReinstall: updateInfo.isRepairOrReinstall,
        version: updateInfo.availableVersion,
        build: updateInfo.availableBuild,
        installerName: updateInfo.installerName,
        installerPath: updateInfo.installerPath,
        installerSize: updateInfo.installerSize,
        installerFormattedSize: updateInfo.installerFormattedSize,
        installerModifiedTime: updateInfo.installerModifiedTime,
        releaseDate: updateInfo.releaseDate,
        sha256: updateInfo.sha256,
        manifestSha256: updateInfo.manifestSha256,
        isHashVerified: updateInfo.isHashVerified,
        channel: updateInfo.channel,
        diagnosticMessage: updateInfo.diagnosticMessage,
      },
      settings,
      recentHistory: history,
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

    if (action === "check") {
      const updateInfo = await evaluateSystemUpdate(body.customPath)
      return NextResponse.json({ success: true, updateInfo })
    }

    if (action === "diagnose") {
      const diagnostics = await runSystemDiagnostics()
      return NextResponse.json({ success: true, diagnostics })
    }

    if (action === "prepare-system" || action === "kill-processes") {
      try {
        spawn("taskkill", ["/F", "/T", "/IM", "aq-backend.exe"], { windowsHide: true, stdio: "ignore" })
      } catch {}
      const diagnostics = await runSystemDiagnostics()
      return NextResponse.json({
        success: true,
        message: "Background microservice workers closed and memory handles flushed.",
        diagnostics,
      })
    }

    if (action === "backup-now") {
      const backupResult = await createPreUpdateBackup()
      return NextResponse.json({ success: backupResult.success, backupResult })
    }

    if (action === "install") {
      const targetPath = body.installerPath || body.customPath
      const result = await prepareAndExecuteUpdate({
        installerPath: targetPath,
        silent: body.silent === true,
        isRepair: body.isRepair === true,
      })
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 })
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        backupPath: result.backupPath,
        runnerPath: result.runnerPath,
      })
    }

    if (action === "open-folder") {
      const targetPath = body.installerPath || body.customPath
      const candidateDir = targetPath && fs.existsSync(targetPath)
        ? (fs.statSync(targetPath).isDirectory() ? targetPath : path.dirname(targetPath))
        : path.join(process.cwd(), "release")

      if (fs.existsSync(candidateDir)) {
        spawn("explorer.exe", [candidateDir], { detached: true, stdio: "ignore" }).unref()
        return NextResponse.json({ success: true, message: "Opened release directory in File Explorer." })
      }
      return NextResponse.json({ success: false, error: "Directory does not exist." }, { status: 404 })
    }

    if (action === "get-history") {
      const history = getUpdateHistory()
      return NextResponse.json({ success: true, history })
    }

    if (action === "get-settings") {
      const settings = getUpdateSettings()
      return NextResponse.json({ success: true, settings })
    }

    if (action === "save-settings") {
      const updated = saveUpdateSettings(body.settings || {})
      return NextResponse.json({ success: true, settings: updated })
    }

    return NextResponse.json({ success: true, message: `Action '${action}' processed.` })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process update action" },
      { status: 500 }
    )
  }
}
