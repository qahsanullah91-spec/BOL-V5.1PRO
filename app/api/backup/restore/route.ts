import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import { getDataPath } from "@/lib/server-paths"
import { readJsonFile } from "@/lib/services/blob-db"
import { generateRestorePreview, restoreDatabaseArchiveBuffer } from "@/lib/backup/restore-backup"
import type { BackupItem } from "@/lib/backup/backup-types"

export const dynamic = "force-dynamic"

const BACKUPS_CATALOG_FILE = getDataPath(".local-backups-catalog.json")

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action || "execute"
    const backupId = body.backupId

    if (!backupId) {
      return NextResponse.json(
        { success: false, error: "backupId is required" },
        { status: 400 }
      )
    }

    const catalog = await readJsonFile<BackupItem[]>(BACKUPS_CATALOG_FILE, [])
    const backup = catalog.find((b) => b.id === backupId)

    if (!backup) {
      return NextResponse.json(
        { success: false, error: `Backup with ID ${backupId} not found in catalog` },
        { status: 404 }
      )
    }

    const archiveBuffer = await fs.readFile(backup.filePath)

    if (action === "preview") {
      const preview = await generateRestorePreview(archiveBuffer, backup.fileName)
      return NextResponse.json({ success: true, preview })
    }

    // Execution
    const mode = body.mode === "merge" ? "merge" : "replace"
    const actor = body.actor || "Admin"
    const note = body.note || ""

    const result = await restoreDatabaseArchiveBuffer({
      archiveBuffer,
      mode,
      actor,
      note,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          rolledBack: result.rolledBack,
          warnings: result.warnings,
          preRestoreBackupFile: result.preRestoreBackupFile,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Restore operation failed" },
      { status: 500 }
    )
  }
}
