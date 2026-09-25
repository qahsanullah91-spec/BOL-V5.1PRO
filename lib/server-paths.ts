import path from "path"
import os from "os"
import fs from "fs"

/** 
 * Central configuration layer for all server paths (Phase 3).
 * Respects environment variables for strict file management.
 */

export function getDataRoot(): string {
  if (typeof window !== "undefined") return ""
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH)
  if (process.env.SKY_DATA_DIR) return path.resolve(process.env.SKY_DATA_DIR)
  
  const root = process.cwd()
  // Backwards compatibility: if data already exists in root, use it.
  if (fs.existsSync && fs.existsSync(path.join(root, ".local-bols.json"))) {
    return root
  }
  return path.join(root, "data")
}

export function getBackupRoot(): string {
  if (process.env.BACKUP_PATH) return path.resolve(process.env.BACKUP_PATH)
  return path.join(getDataRoot(), "..", "backups")
}

export function getDataPath(fileName: string): string {
  const root = getDataRoot()
  return path.join(root, path.basename(fileName))
}

export function getUploadPath(...segments: string[]): string {
  const root = process.env.UPLOAD_PATH 
    ? path.resolve(process.env.UPLOAD_PATH)
    : process.env.SKY_DATA_DIR
      ? path.join(path.resolve(process.env.SKY_DATA_DIR), "uploads")
      : path.join(process.cwd(), "public", "uploads")
      
  const names = segments.map((segment) => {
    const name = path.basename(segment)
    if (!name || name === "." || name === ".." || /[\u0000:]/.test(name)) {
      throw new Error("Invalid upload path segment")
    }
    return name
  })
  return path.join(root, ...names)
}

/**
 * Standardized cross-platform directory accessors (Phase 5).
 */
export function getAppDataDir(): string {
  return getDataRoot()
}

export function getDatabasePath(): string {
  const root = getDataRoot()
  const candidateApp = path.join(root, "app.db")
  const candidateAq = path.join(root, "aq_companies.db")
  if (fs.existsSync(candidateApp)) return candidateApp
  if (fs.existsSync(candidateAq)) return candidateAq
  const subDataApp = path.join(root, "Data", "app.db")
  if (fs.existsSync(subDataApp)) return subDataApp
  return candidateApp
}

export function getBackupDir(): string {
  const root = getDataRoot()
  const bkp = path.join(root, "backups")
  if (!fs.existsSync(bkp)) {
    try { fs.mkdirSync(bkp, { recursive: true }) } catch {}
  }
  return bkp
}

export function getRecoveryDir(): string {
  const root = getDataRoot()
  const rec = path.join(root, "recovery")
  if (!fs.existsSync(rec)) {
    try { fs.mkdirSync(rec, { recursive: true }) } catch {}
  }
  return rec
}

export function getLogsDir(): string {
  const root = getDataRoot()
  const lg = path.join(root, "logs")
  if (!fs.existsSync(lg)) {
    try { fs.mkdirSync(lg, { recursive: true }) } catch {}
  }
  return lg
}

export function getDocumentsDir(): string {
  const root = getDataRoot()
  const doc = path.join(root, "Documents")
  if (!fs.existsSync(doc)) {
    try { fs.mkdirSync(doc, { recursive: true }) } catch {}
  }
  return doc
}

export function getExportsDir(): string {
  const root = getDataRoot()
  const exp = path.join(root, "exports")
  if (!fs.existsSync(exp)) {
    try { fs.mkdirSync(exp, { recursive: true }) } catch {}
  }
  return exp
}

export function getTempDir(): string {
  const root = getDataRoot()
  const tmp = path.join(root, "temp")
  if (!fs.existsSync(tmp)) {
    try { fs.mkdirSync(tmp, { recursive: true }) } catch {}
  }
  return tmp
}

