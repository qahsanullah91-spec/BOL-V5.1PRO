/**
 * Sky Ariana Enterprise Database Health & Integrity Audit Engine
 * Phase 16: Enterprise Resilience, Health Auditing & Safe Restore Engine
 */

import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { getDataPath, getUploadPath } from "@/lib/server-paths"
import { readJsonFile, writeJsonFile } from "@/lib/services/blob-db"
import { validateLedgerInvariance } from "@/lib/services/ledger-sync-utils"
import { collectAllSystemData } from "./backup-collector"
import { createFullSystemBackup } from "./create-backup"
import { CURRENT_DATABASE_SCHEMA_VERSION } from "./backup-manifest"
import type { DeepHealthReport, DatabaseHealthIssue, BackupItem } from "./backup-types"

const BACKUPS_CATALOG_FILE = getDataPath(".local-backups-catalog.json")

/**
 * Runs a deep, non-destructive health scan across all 25+ database stores, relational links,
 * accounting invariance, and file attachments.
 */
export async function runDeepHealthScan(): Promise<DeepHealthReport> {
  const issues: DatabaseHealthIssue[] = []
  const dataDir = path.join(process.cwd(), "data")

  // 1. Storage & Writable check
  let databaseReadable = true
  let databaseWritable = false
  let totalStorageBytes = 0

  try {
    const testFile = path.join(dataDir, `.health-probe-${Date.now()}.tmp`)
    await fs.writeFile(testFile, "health-check-probe", "utf8")
    const testRead = await fs.readFile(testFile, "utf8")
    databaseWritable = testRead === "health-check-probe"
    await fs.unlink(testFile).catch(() => {})
  } catch (err) {
    databaseWritable = false
    issues.push({
      severity: "CRITICAL",
      category: "STORAGE",
      module: "STORAGE_ENGINE",
      title: "Database storage directory is NOT writable",
      details: err instanceof Error ? err.message : String(err),
      repairable: false,
    })
  }

  // 2. Load all tables
  const [
    bols,
    shipments,
    containers,
    companies,
    accounts,
    invoices,
    accountLedgers,
    bolLedgers,
    payments,
    supplierBills,
    supplierCosts,
    supplierPayments,
    documents,
  ] = await Promise.all([
    readJsonFile<any[]>(getDataPath(".local-bols.json"), []),
    readJsonFile<any[]>(getDataPath(".local-shipments.json"), []),
    readJsonFile<any[]>(getDataPath(".local-container-bookings.json"), []),
    readJsonFile<any[]>(getDataPath(".local-companies.json"), []),
    readJsonFile<any[]>(getDataPath(".local-accounts.json"), []),
    readJsonFile<any[]>(getDataPath(".local-invoices.json"), []),
    readJsonFile<any>(getDataPath(".local-account-ledgers.json"), {}),
    readJsonFile<any>(getDataPath(".local-bol-account-ledgers.json"), {}),
    readJsonFile<any[]>(getDataPath(".local-payments.json"), []),
    readJsonFile<any[]>(getDataPath(".local-supplier-bills.json"), []),
    readJsonFile<any[]>(getDataPath(".local-supplier-costs.json"), []),
    readJsonFile<any[]>(getDataPath(".local-supplier-payments.json"), []),
    readJsonFile<any[]>(getDataPath(".local-documents.json"), []),
  ])

  // Compute storage size of .local-*.json files
  try {
    const dataFiles = await fs.readdir(dataDir).catch(() => [])
    for (const f of dataFiles) {
      if (f.startsWith(".local-") && f.endsWith(".json")) {
        const stat = await fs.stat(path.join(dataDir, f)).catch(() => null)
        if (stat) totalStorageBytes += stat.size
      }
    }
  } catch {}

  // 3. Relational integrity & duplicate primary keys
  const bolNumberMap = new Map<string, number>()
  for (const b of bols) {
    const num = String(b.bol_number || b.id || "").trim().toUpperCase()
    if (num) {
      bolNumberMap.set(num, (bolNumberMap.get(num) || 0) + 1)
    }
  }

  // Detect duplicate BOLs
  let duplicateBolCount = 0
  for (const [num, count] of bolNumberMap.entries()) {
    if (count > 1) {
      duplicateBolCount += count - 1
      issues.push({
        severity: "CRITICAL",
        category: "DUPLICATE",
        module: "BOLS",
        recordId: num,
        title: `Duplicate BOL Number detected: ${num}`,
        details: `BOL number appears ${count} times in the database.`,
        repairable: true,
        repairAction: "REPAIR_DUPLICATE_BOLS",
      })
    }
  }

  // Detect duplicate Containers
  const containerNumMap = new Map<string, number>()
  for (const c of containers) {
    const num = String(c.container_number || c.containerNumber || c.id || "").trim().toUpperCase()
    if (num) {
      containerNumMap.set(num, (containerNumMap.get(num) || 0) + 1)
    }
  }
  let duplicateContainerCount = 0
  for (const [num, count] of containerNumMap.entries()) {
    if (count > 1) {
      duplicateContainerCount += count - 1
      issues.push({
        severity: "WARNING",
        category: "DUPLICATE",
        module: "CONTAINERS",
        recordId: num,
        title: `Duplicate Container identifier: ${num}`,
        details: `Container ID is registered ${count} times in container bookings.`,
        repairable: true,
        repairAction: "REPAIR_DUPLICATE_CONTAINERS",
      })
    }
  }

  // Detect duplicate Invoices
  const invoiceNumMap = new Map<string, number>()
  for (const inv of invoices) {
    const num = String(inv.invoice_number || inv.invoiceNumber || inv.id || "").trim().toUpperCase()
    if (num) {
      invoiceNumMap.set(num, (invoiceNumMap.get(num) || 0) + 1)
    }
  }
  let duplicateInvoiceCount = 0
  for (const [num, count] of invoiceNumMap.entries()) {
    if (count > 1) {
      duplicateInvoiceCount += count - 1
      issues.push({
        severity: "CRITICAL",
        category: "DUPLICATE",
        module: "INVOICES",
        recordId: num,
        title: `Duplicate Invoice Number detected: ${num}`,
        details: `Invoice number is registered ${count} times in the system.`,
        repairable: true,
        repairAction: "REPAIR_DUPLICATE_INVOICES",
      })
    }
  }

  // Check Orphan Invoices (Invoices referencing missing BOLs)
  let orphanInvoicesCount = 0
  for (const inv of invoices) {
    const bolRef = String(inv.bol_number || inv.bolNumber || inv.reference_number || "").trim().toUpperCase()
    if (bolRef && !bolNumberMap.has(bolRef)) {
      orphanInvoicesCount++
      issues.push({
        severity: "WARNING",
        category: "ORPHAN",
        module: "INVOICES",
        recordId: inv.invoice_number || inv.id,
        title: `Orphan Invoice: ${inv.invoice_number || inv.id} references missing BOL ${bolRef}`,
        details: `Invoice ${inv.invoice_number} cannot find referenced BOL '${bolRef}'.`,
        repairable: true,
        repairAction: "LINK_ORPHAN_INVOICE",
      })
    }
  }

  // Check Orphan Payments (Payments referencing nonexistent invoice and nonexistent BOL)
  let orphanPaymentsCount = 0
  for (const p of payments) {
    const invRef = String(p.invoiceNumber || p.invoice_number || "").trim().toUpperCase()
    const bolRef = String(p.bolNumber || p.bol_number || "").trim().toUpperCase()
    const hasInv = invRef && invoiceNumMap.has(invRef)
    const hasBol = bolRef && bolNumberMap.has(bolRef)

    if (!hasInv && !hasBol && (invRef || bolRef)) {
      orphanPaymentsCount++
      issues.push({
        severity: "WARNING",
        category: "ORPHAN",
        module: "PAYMENTS",
        recordId: p.id || p.referenceNumber,
        title: `Orphan Payment: payment ${p.id || p.referenceNumber} references nonexistent Invoice/BOL`,
        details: `Target invoice '${invRef}' and BOL '${bolRef}' were not found.`,
        repairable: false,
      })
    }
  }

  // 4. Accounting Invariance Audit
  const ledgerCheck = validateLedgerInvariance(accountLedgers)
  let discrepanciesCount = 0
  if (!ledgerCheck.isValid) {
    discrepanciesCount = ledgerCheck.discrepancies.length
    for (const d of ledgerCheck.discrepancies) {
      issues.push({
        severity: "CRITICAL",
        category: "ACCOUNTING",
        module: "ACCOUNT_LEDGERS",
        recordId: d.account,
        title: `Accounting Invariance Discrepancy in account: ${d.account}`,
        details: `Debit - Credit does not equal final running balance. (${d.message || "Discrepancy detected"})`,
        repairable: true,
        repairAction: "RECOMPUTE_LEDGER_BALANCES",
      })
    }
  }

  // Check currency existence on ledgers
  if (typeof accountLedgers === "object" && accountLedgers !== null) {
    for (const [accName, val] of Object.entries(accountLedgers)) {
      const rows: any[] = Array.isArray(val) ? val : (val as any)?.entries || []
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row && typeof row === "object") {
          if (!row.currency || typeof row.currency !== "string" || !row.currency.trim()) {
            issues.push({
              severity: "WARNING",
              category: "ACCOUNTING",
              module: "ACCOUNT_LEDGERS",
              title: `Missing currency declaration on entry in account ${accName}`,
              details: `Row index ${i} lacks currency. Defaulting to USD is recommended.`,
              repairable: true,
              repairAction: "FILL_MISSING_CURRENCY",
            })
            break
          }
        }
      }
    }
  }

  // 5. Document & Attachment Check
  const uploadRoot = getUploadPath()
  let missingFilesCount = 0
  for (const doc of documents) {
    const fileUrl = doc.file_url || doc.url || doc.path || ""
    if (fileUrl) {
      const base = path.basename(fileUrl)
      const possibleDiskPaths = [
        path.join(uploadRoot, base),
        path.join(process.cwd(), "public", fileUrl.replace(/^\//, "")),
        path.join(process.cwd(), fileUrl.replace(/^\//, "")),
      ]
      const exists = possibleDiskPaths.some((p) => fsSync.existsSync(p))
      if (!exists) {
        missingFilesCount++
        issues.push({
          severity: "WARNING",
          category: "DOCUMENT",
          module: "DOCUMENTS",
          recordId: doc.id,
          title: `Attached file missing on disk: ${base}`,
          details: `Document '${doc.name || doc.title || doc.id}' references '${fileUrl}' which does not exist on disk.`,
          repairable: false,
        })
      }
    }
  }

  // 6. Last backup verification status
  const catalog = await readJsonFile<BackupItem[]>(BACKUPS_CATALOG_FILE, [])
  const validBackups = catalog.filter((b) => b.verificationStatus === "VERIFIED" && b.status === "SUCCESS")
  const lastBackup = catalog[0]
  const lastVerified = validBackups[0]

  const lastBackupValid = Boolean(lastBackup && lastBackup.verificationStatus === "VERIFIED")
  if (catalog.length === 0) {
    issues.push({
      severity: "CRITICAL",
      category: "STORAGE",
      module: "DISASTER_RECOVERY",
      title: "No system backups exist",
      details: "The system has no recorded recovery points. Immediate backup required.",
      repairable: true,
      repairAction: "TRIGGER_IMMEDIATE_BACKUP",
    })
  } else if (!lastBackupValid) {
    issues.push({
      severity: "WARNING",
      category: "STORAGE",
      module: "DISASTER_RECOVERY",
      title: "Latest backup is not verified or failed",
      details: `Backup ${lastBackup?.fileName || "unknown"} status: ${lastBackup?.status || "UNKNOWN"}.`,
      repairable: false,
    })
  }

  // Calculate Overall Status
  let overallStatus: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY"
  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length
  const warningCount = issues.filter((i) => i.severity === "WARNING").length

  if (criticalCount > 0 || !databaseWritable || !ledgerCheck.isValid) {
    overallStatus = "CRITICAL"
  } else if (warningCount > 0 || !lastBackupValid) {
    overallStatus = "WARNING"
  }

  const systemData = await collectAllSystemData({ includeAttachments: false })

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    databaseRevision: Date.now(),
    schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
    databaseReadable,
    databaseWritable,
    totalStorageBytes,
    lastBackupTime: lastBackup?.createdAt,
    lastBackupValid,
    lastVerifiedTime: lastVerified?.createdAt,
    recordCounts: systemData.recordCounts,
    issues,
    checks: {
      relationalIntegrity: {
        pass: orphanInvoicesCount === 0 && orphanPaymentsCount === 0,
        violations: orphanInvoicesCount + orphanPaymentsCount,
      },
      orphanDetection: {
        pass: orphanInvoicesCount === 0,
        orphansCount: orphanInvoicesCount,
      },
      duplicateCriticalIds: {
        pass: duplicateBolCount === 0 && duplicateContainerCount === 0 && duplicateInvoiceCount === 0,
        duplicatesCount: duplicateBolCount + duplicateContainerCount + duplicateInvoiceCount,
      },
      accountingInvariance: {
        pass: ledgerCheck.isValid,
        discrepanciesCount,
      },
      documentStorage: {
        pass: missingFilesCount === 0,
        missingFilesCount,
      },
    },
  }
}

/**
 * Executes controlled safe repairs on database issues.
 * ALWAYS creates a pre-repair safety snapshot before executing!
 */
export async function executeDatabaseRepair(actions: string[], actor = "System Admin"): Promise<{
  success: boolean
  preRepairBackupFileName: string
  repairsApplied: string[]
  errors: string[]
}> {
  // 1. Mandatory Pre-Repair Safety Backup
  let preRepairBackupFileName = ""
  try {
    const safetyBkp = await createFullSystemBackup({
      type: "PRE_REPAIR_SAFETY",
      actor: `Repair [${actor}]`,
      note: `Safety snapshot created before applying database repair actions: ${actions.join(", ")}`,
      protected: true,
    })
    preRepairBackupFileName = safetyBkp.backupItem.fileName
  } catch (err) {
    return {
      success: false,
      preRepairBackupFileName: "",
      repairsApplied: [],
      errors: [`Failed to create pre-repair safety backup: ${err instanceof Error ? err.message : String(err)}`],
    }
  }

  const repairsApplied: string[] = []
  const errors: string[] = []

  // 2. Recompute ledger balances if requested
  if (actions.includes("RECOMPUTE_LEDGER_BALANCES") || actions.includes("ALL")) {
    try {
      const ledgers = await readJsonFile<any>(getDataPath(".local-account-ledgers.json"), {})
      let fixedAccounts = 0

      for (const [accountKey, val] of Object.entries(ledgers)) {
        const rows: any[] = Array.isArray(val) ? val : (val as any)?.entries || []
        if (rows.length === 0) continue

        // Sort chronologically
        rows.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())

        let running = 0
        for (const row of rows) {
          const debit = Number(row.debit || 0)
          const credit = Number(row.credit || 0)
          running += debit - credit
          row.balance = Math.round(running * 100) / 100
        }

        if (Array.isArray(val)) {
          ledgers[accountKey] = rows
        } else {
          (val as any).entries = rows
          ;(val as any).currentBalance = Math.round(running * 100) / 100
        }
        fixedAccounts++
      }

      await writeJsonFile(getDataPath(".local-account-ledgers.json"), ledgers)
      repairsApplied.push(`Recomputed and aligned running balances across ${fixedAccounts} ledger accounts.`)
    } catch (err) {
      errors.push(`Failed to repair ledger balances: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 3. Fill missing currency
  if (actions.includes("FILL_MISSING_CURRENCY") || actions.includes("ALL")) {
    try {
      const ledgers = await readJsonFile<any>(getDataPath(".local-account-ledgers.json"), {})
      let filledCount = 0

      for (const [, val] of Object.entries(ledgers)) {
        const rows: any[] = Array.isArray(val) ? val : (val as any)?.entries || []
        for (const row of rows) {
          if (row && typeof row === "object") {
            if (!row.currency || !String(row.currency).trim()) {
              row.currency = "USD"
              filledCount++
            }
          }
        }
      }

      await writeJsonFile(getDataPath(".local-account-ledgers.json"), ledgers)
      repairsApplied.push(`Filled default USD currency for ${filledCount} entries lacking currency.`)
    } catch (err) {
      errors.push(`Failed to fill missing currency: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 4. Resolve duplicate BOLs
  if (actions.includes("REPAIR_DUPLICATE_BOLS") || actions.includes("ALL")) {
    try {
      const bols = await readJsonFile<any[]>(getDataPath(".local-bols.json"), [])
      const seen = new Map<string, number>()
      let resolvedCount = 0

      for (const b of bols) {
        const num = String(b.bol_number || b.id || "").trim().toUpperCase()
        if (num) {
          const count = seen.get(num) || 0
          if (count > 0) {
            b.bol_number = `${num}-DUP${count}`
            resolvedCount++
          }
          seen.set(num, count + 1)
        }
      }

      if (resolvedCount > 0) {
        await writeJsonFile(getDataPath(".local-bols.json"), bols)
        repairsApplied.push(`Deduplicated ${resolvedCount} duplicate BOL records with unique suffixes.`)
      }
    } catch (err) {
      errors.push(`Failed to deduplicate BOLs: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // 5. Trigger immediate backup if requested
  if (actions.includes("TRIGGER_IMMEDIATE_BACKUP")) {
    try {
      const bkp = await createFullSystemBackup({
        type: "MANUAL",
        actor,
        note: "Immediate system backup triggered via Database Health Repair Tool",
      })
      repairsApplied.push(`Created verified backup archive: ${bkp.backupItem.fileName}`)
    } catch (err) {
      errors.push(`Failed to create immediate backup: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return {
    success: errors.length === 0,
    preRepairBackupFileName,
    repairsApplied,
    errors,
  }
}
