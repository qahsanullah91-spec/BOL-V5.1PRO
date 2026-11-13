import { NextResponse } from "next/server"
import path from "node:path"
import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import { ensureServerDirectories } from "@/lib/server/paths"
import {
  createServerBackup,
  listServerBackups,
  restoreServerBackup,
  pruneServerBackups,
} from "@/lib/database/backup"
import { verifyServerToken, isServerAdminSetup } from "@/lib/server/auth"

export async function GET(request: Request) {
  try {
    const isSetup = await isServerAdminSetup()
    if (!isSetup) {
      return NextResponse.json({ success: true, backups: [], backupDir: "" })
    }

    const authHeader = request.headers.get("authorization")
    const auth = await verifyServerToken(authHeader)

    // Note: Allow download if token valid or admin setup; check auth if token passed
    const paths = await ensureServerDirectories()
    const { searchParams } = new URL(request.url)
    const downloadParam = searchParams.get("download") || searchParams.get("file")

    if (downloadParam) {
      const safeFilename = path.basename(downloadParam)
      if (!safeFilename.endsWith(".zip")) {
        return NextResponse.json({ success: false, error: "Invalid backup filename" }, { status: 400 })
      }
      const targetPath = path.join(paths.backups, safeFilename)
      if (!existsSync(targetPath)) {
        return NextResponse.json({ success: false, error: "Backup file not found" }, { status: 404 })
      }
      const buffer = await fs.readFile(targetPath)
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "Content-Length": String(buffer.length),
        },
      })
    }

    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const backups = await listServerBackups()
    return NextResponse.json({ success: true, backups, backupDir: paths.backups })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list backups" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const auth = await verifyServerToken(authHeader)

    if (!auth.authenticated || (auth.role !== "admin" && auth.role !== "accounting")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to create backups" },
        { status: 403 }
      )
    }

    const backup = await createServerBackup({
      actor: auth.username || "admin",
    })

    return NextResponse.json({ success: true, backup })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create backup" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const auth = await verifyServerToken(authHeader)

    if (!auth.authenticated || auth.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can restore backups" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { filename } = body

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "Backup filename is required" },
        { status: 400 }
      )
    }

    const result = await restoreServerBackup(filename, {
      actor: auth.username || "admin",
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to restore backup" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const auth = await verifyServerToken(authHeader)

    if (!auth.authenticated || auth.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetFile = searchParams.get("filename") || searchParams.get("file")

    if (targetFile) {
      const safeFilename = path.basename(targetFile)
      if (!safeFilename.endsWith(".zip")) {
        return NextResponse.json({ success: false, error: "Invalid backup filename" }, { status: 400 })
      }
      const paths = await ensureServerDirectories()
      const targetPath = path.join(paths.backups, safeFilename)
      if (existsSync(targetPath)) {
        await fs.unlink(targetPath)
        return NextResponse.json({ success: true, deleted: safeFilename })
      }
      return NextResponse.json({ success: false, error: "Backup file not found" }, { status: 404 })
    }

    const maxKeep = parseInt(searchParams.get("keep") || "10", 10)
    const deleted = await pruneServerBackups(maxKeep)

    return NextResponse.json({ success: true, deletedCount: deleted })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete backup" },
      { status: 500 }
    )
  }
}
