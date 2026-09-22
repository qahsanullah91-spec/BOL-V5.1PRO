import { extractZipArchive } from "@/lib/google-drive/archive"
import { validateLedgerInvariance } from "@/lib/services/ledger-sync-utils"
import type { DatabaseBackupManifest } from "./manifest"

export const CURRENT_BACKUP_SCHEMA_VERSION = 1

export interface BackupValidationResult {
  isValid: boolean
  manifest?: DatabaseBackupManifest
  files: Map<string, Buffer>
  invarianceValid: boolean
  errors: string[]
  warnings: string[]
  isNewerVersion?: boolean
}

/**
 * Inspects and validates a database backup archive in-memory before any restoration.
 */
export function validateDatabaseBackupBuffer(archiveBuffer: Buffer): BackupValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  let files: Map<string, Buffer>
  try {
    files = extractZipArchive(archiveBuffer)
  } catch (err) {
    return {
      isValid: false,
      files: new Map(),
      invarianceValid: false,
      errors: [`Corrupted or invalid ZIP archive: ${err instanceof Error ? err.message : String(err)}`],
      warnings: [],
    }
  }

  // 1. Manifest presence
  const manifestBuffer = files.get("manifest.json")
  if (!manifestBuffer) {
    return {
      isValid: false,
      files,
      invarianceValid: false,
      errors: ["Missing manifest.json in backup archive"],
      warnings,
    }
  }

  let manifest: DatabaseBackupManifest
  try {
    manifest = JSON.parse(manifestBuffer.toString("utf8"))
  } catch (err) {
    return {
      isValid: false,
      files,
      invarianceValid: false,
      errors: [`Invalid manifest.json format: ${err instanceof Error ? err.message : String(err)}`],
      warnings,
    }
  }

  // 2. Schema version check
  let isNewerVersion = false
  if (typeof manifest.schemaVersion === "number" && manifest.schemaVersion > CURRENT_BACKUP_SCHEMA_VERSION) {
    isNewerVersion = true
    errors.push(
      `This Google Drive database was created by a newer version of Sky Ariana BOL (schema v${manifest.schemaVersion}, current v${CURRENT_BACKUP_SCHEMA_VERSION}). Please update the application before restoring.`
    )
  }

  // 3. Check for core data files
  const coreFiles = ["data/bols.json", "data/invoices.json", "data/account-ledgers.json", "data/companies.json"]
  for (const coreFile of coreFiles) {
    if (!files.has(coreFile)) {
      warnings.push(`Missing core data file ${coreFile}; will default to empty collection if restored`)
    } else {
      try {
        JSON.parse(files.get(coreFile)!.toString("utf8"))
      } catch (err) {
        errors.push(`Data file ${coreFile} is corrupted: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  // 4. Accounting invariance check on account-ledgers
  let invarianceValid = true
  if (files.has("data/account-ledgers.json")) {
    try {
      const ledgers = JSON.parse(files.get("data/account-ledgers.json")!.toString("utf8"))
      const check = validateLedgerInvariance(ledgers)
      if (!check.isValid) {
        invarianceValid = false
        errors.push(
          `Restored ledger violates accounting invariance (Balance = Debit - Credit): ${check.discrepancies.length} discrepancy found`
        )
      }
    } catch {
      invarianceValid = false
    }
  }

  return {
    isValid: errors.length === 0,
    manifest,
    files,
    invarianceValid,
    errors,
    warnings,
    isNewerVersion,
  }
}
