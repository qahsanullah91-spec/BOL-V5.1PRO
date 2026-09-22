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
