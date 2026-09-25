import { NextRequest, NextResponse } from "next/server"
import {
  listAllBackups,
  createFullSystemBackup,
  deleteBackupItem,
  isBackupOperationInProgress,
} from "@/lib/backup/create-backup"
import { getDisasterRecoveryConfig } from "@/lib/backup/backup-retention-service"
import type { BackupType } from "@/lib/backup/backup-types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [backups, config] = await Promise.all([
      listAllBackups(),
      getDisasterRecoveryConfig(),
    ])

    const verifiedList = backups.filter(
      (b) => b.verificationStatus === "VERIFIED" && b.status === "SUCCESS"
    )
    const lockStatus = isBackupOperationInProgress()

    const stats = {
      totalBackups: backups.length,
      verifiedBackups: verifiedList.length,
      protectedBackups: backups.filter((b) => b.protected).length,
      lastSuccessfulBackup: verifiedList[0]?.createdAt || backups[0]?.createdAt || null,
      lastVerifiedTime: verifiedList[0]?.createdAt || null,
      totalStorageBytes: backups.reduce((sum, b) => sum + (b.fileSizeBytes || 0), 0),
      isLocked: lockStatus.locked,
      lockedBy: lockStatus.holder,
    }

    return NextResponse.json({
      success: true,
      stats,
      config,
      backups,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to list backups" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const type: BackupType = body.type || "MANUAL"
    const actor: string = body.actor || "User Admin"
    const note: string = body.note || ""
    const isProtected: boolean = Boolean(body.protected)
    const includeAttachments: boolean = body.includeAttachments !== false

    const result = await createFullSystemBackup({
      type,
      actor,
      note,
      protected: isProtected,
      includeAttachments,
    })

    return NextResponse.json({
      success: true,
      backup: result.backupItem,
      manifest: result.manifest,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create backup" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const backupId = searchParams.get("id")
    const actor = searchParams.get("actor") || "Admin"

    if (!backupId) {
      return NextResponse.json(
        { success: false, error: "Backup ID parameter is required" },
        { status: 400 }
      )
    }

    const result = await deleteBackupItem(backupId, { actor })
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, deletedId: backupId })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete backup" },
      { status: 500 }
    )
  }
}
