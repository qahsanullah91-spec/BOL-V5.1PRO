import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { validateDatabaseBackupBuffer } from "@/lib/backup/validate-backup"
import { registerBackupInCatalog } from "@/lib/backup/create-backup"
import { CURRENT_DATABASE_SCHEMA_VERSION, CURRENT_APPLICATION_VERSION } from "@/lib/backup/backup-manifest"
import type { BackupItem, BackupType } from "@/lib/backup/backup-types"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const note = (formData.get("note") as string) || "External backup upload"
    const actor = (formData.get("actor") as string) || "Admin"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No backup file uploaded" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate archive
    const validation = validateDatabaseBackupBuffer(buffer)
    if (!validation.isValid || !validation.manifest) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded file is not a valid Sky Ariana backup archive: " + validation.errors.join("; "),
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    const manifest = validation.manifest
    const backupDir = path.join(process.cwd(), "data", "backups")
    await fs.mkdir(backupDir, { recursive: true }).catch(() => {})

    const originalName = file.name || "uploaded-backup.zip"
    const cleanName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, "_")
    const finalFileName = cleanName.endsWith(".zip") ? cleanName : `${cleanName}.zip`
    const finalFilePath = path.join(backupDir, finalFileName)

    // Write file atomically
    const tempPath = path.join(backupDir, `.${finalFileName}.tmp`)
    await fs.writeFile(tempPath, buffer)
    await fs.rename(tempPath, finalFilePath)

    const backupItem: BackupItem = {
      id: manifest.backupId || `bkp-upload-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
      fileName: finalFileName,
      filePath: finalFilePath,
      type: (manifest.backupType as BackupType) || "MANUAL",
      status: "SUCCESS",
      verificationStatus: "VERIFIED",
      createdAt: manifest.createdAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdBy: `${actor} (Uploaded)`,
      appVersion: manifest.applicationVersion || manifest.appVersion || CURRENT_APPLICATION_VERSION,
      schemaVersion: manifest.databaseSchemaVersion || manifest.schemaVersion || CURRENT_DATABASE_SCHEMA_VERSION,
      databaseRevision: manifest.databaseRevision || Date.now(),
      fileSizeBytes: buffer.length,
      databaseSizeBytes: Math.round(buffer.length * 0.7),
      checksum: manifest.compositeChecksum || manifest.checksum || "",
      protected: false,
      note,
      recordCounts: validation.recordCounts || manifest.recordCounts || manifest.counts,
      storageLocation: "PRIMARY_LOCAL",
    }

    await registerBackupInCatalog(backupItem)

    return NextResponse.json({
      success: true,
      backup: backupItem,
      validation: {
        isValid: validation.isValid,
        invarianceValid: validation.invarianceValid,
        recordCounts: validation.recordCounts,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process uploaded backup" },
      { status: 500 }
    )
  }
}
