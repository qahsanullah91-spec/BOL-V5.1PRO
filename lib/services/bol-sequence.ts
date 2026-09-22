import { getDataPath } from "@/lib/server-paths"
import { mutateJsonFile, readJsonFile } from "@/lib/services/blob-db"
import * as localStorage from "@/lib/services/local-storage-service"
import { createClient } from "@/lib/supabase/server"

const SEQUENCE_FILE = getDataPath(".local-bol-sequence.json")
const START_SEQUENCE = 470

function extractBolNumberSuffix(bolNum: any): number {
  if (!bolNum) return 0
  const str = String(bolNum)
  const match = str.match(/NSA(\d+)/i) || str.match(/(\d+)\s*$/)
  if (match && match[1]) {
    const val = parseInt(match[1], 10)
    return isNaN(val) ? 0 : val
  }
  return 0
}

async function findBaselineMaxSequence(year: number): Promise<number> {
  let maxFound = START_SEQUENCE - 1

  try {
    const localBols = await localStorage.getAllLocalBOLs()
    for (const bol of localBols) {
      const numStr = bol.bol_number || bol.billOfLadingNumber || bol.id || ""
      const parsed = extractBolNumberSuffix(numStr)
      if (parsed > maxFound) maxFound = parsed
    }
  } catch (e) {
    console.error("[bol-sequence] Error reading local BOLs:", e)
  }

  try {
    const snapPath = getDataPath(".local-full-snapshot.json")
    const snapshot = await readJsonFile<any>(snapPath, {})
    if (snapshot && Array.isArray(snapshot.documents)) {
      for (const bol of snapshot.documents) {
        const numStr = bol.bol_number || bol.billOfLadingNumber || bol.id || ""
        const parsed = extractBolNumberSuffix(numStr)
        if (parsed > maxFound) maxFound = parsed
      }
    }
  } catch (e) {
    console.error("[bol-sequence] Error reading snapshot documents:", e)
  }

  return maxFound
}

export async function getNextAtomicBolNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()

  let allocatedSeq = START_SEQUENCE

  await mutateJsonFile(
    SEQUENCE_FILE,
    { year: currentYear, sequence: START_SEQUENCE - 1 },
    async (current: { year?: number; sequence?: number }) => {
      let currentSeq = typeof current?.sequence === "number" ? current.sequence : 0
      const recordedYear = current?.year || currentYear

      if (recordedYear !== currentYear || currentSeq < START_SEQUENCE) {
        const baseline = await findBaselineMaxSequence(currentYear)
        currentSeq = Math.max(baseline, START_SEQUENCE - 1)
      }

      allocatedSeq = currentSeq + 1
      return {
        year: currentYear,
        sequence: allocatedSeq,
        updated_at: new Date().toISOString(),
      }
    }
  )

  const padded = String(allocatedSeq).padStart(3, "0")
  return `BOL-${currentYear}-NSA${padded}`
}
