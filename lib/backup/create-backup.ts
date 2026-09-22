import { createZipArchive, type ArchiveEntry } from "@/lib/google-drive/archive"
import { encryptPayload, getOrCreateVaultKey } from "@/lib/google-drive/crypto"
import { collectApplicationData, type BackupRecordCounts } from "./collect-data"
import { computeBackupChecksum } from "./checksum"
import { createDatabaseManifest, type DatabaseBackupManifest } from "./manifest"
import { incrementDatabaseRevision } from "./revision"

export interface CreatedDatabaseBackup {
  buffer: Buffer
  manifest: DatabaseBackupManifest
  checksum: string
  recordCounts: BackupRecordCounts
  databaseRevision: number
  isEncrypted: boolean
}

/**
 * Creates a validated, standalone Sky Ariana database backup archive in memory.
 * Does not write to Google Drive directly (separation of concerns).
 */
export async function createDatabaseBackup(options?: {
  encrypt?: boolean
  passphrase?: string
  includeDocuments?: boolean
  googleAccount?: string
  actionName?: string
}): Promise<CreatedDatabaseBackup> {
  // 1. Increment database revision to mark this snapshot
  const databaseRevision = await incrementDatabaseRevision(
    options?.actionName || "backup_created"
  )

  // 2. Collect local data files
  const collected = await collectApplicationData({
    includeDocuments: options?.includeDocuments,
  })

  // 3. Compute checksum
  const checksum = computeBackupChecksum(collected.entries)

  // 4. Extract metadata indices for fast search
  const bolNumbers: string[] = []
  const invoiceNumbers: string[] = []
  const companyNames: string[] = []

  try {
    const bolsEntry = collected.entries.find((e) => e.path === "data/bols.json")
    if (bolsEntry && typeof bolsEntry.data === "string") {
      const bols = JSON.parse(bolsEntry.data)
      if (Array.isArray(bols)) {
        for (const b of bols.slice(0, 50)) {
          const num = b.bol_number || b.id
          if (num) bolNumbers.push(String(num))
        }
      }
    }
  } catch {}

  try {
    const invoicesEntry = collected.entries.find((e) => e.path === "data/invoices.json")
    if (invoicesEntry && typeof invoicesEntry.data === "string") {
      const invoices = JSON.parse(invoicesEntry.data)
      if (Array.isArray(invoices)) {
        for (const inv of invoices.slice(0, 50)) {
          const num = inv.invoice_number || inv.id
          if (num) invoiceNumbers.push(String(num))
        }
      }
    }
  } catch {}

  try {
    const companiesEntry = collected.entries.find((e) => e.path === "data/companies.json")
    if (companiesEntry && typeof companiesEntry.data === "string") {
      const companies = JSON.parse(companiesEntry.data)
      if (Array.isArray(companies)) {
        for (const c of companies.slice(0, 50)) {
          const name = c.name || c.companyName
          if (name) companyNames.push(String(name))
        }
      }
    }
  } catch {}

  // 5. Build manifest
  const manifest = createDatabaseManifest({
    databaseRevision,
    recordCounts: collected.recordCounts,
    checksum,
    googleAccount: options?.googleAccount,
    encrypted: Boolean(options?.encrypt),
    metadataIndex: {
      bolNumbers: Array.from(new Set(bolNumbers)),
      invoiceNumbers: Array.from(new Set(invoiceNumbers)),
      companyNames: Array.from(new Set(companyNames)),
    },
  })

  // 6. Build archive entries list with manifest.json at the root
  const archiveEntries: ArchiveEntry[] = [
    {
      path: "manifest.json",
      data: JSON.stringify(manifest, null, 2),
    },
    ...collected.entries,
  ]

  let buffer = createZipArchive(archiveEntries)
  const isEncrypted = Boolean(options?.encrypt)

  // 7. Encrypt payload if requested
  if (isEncrypted) {
    const key = options?.passphrase || (await getOrCreateVaultKey())
    const encryptedPkg = encryptPayload(buffer, key)
    buffer = Buffer.from(JSON.stringify(encryptedPkg, null, 2), "utf8")
  }

  return {
    buffer,
    manifest,
    checksum,
    recordCounts: collected.recordCounts,
    databaseRevision,
    isEncrypted,
  }
}
