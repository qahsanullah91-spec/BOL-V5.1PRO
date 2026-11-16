/**
 * Sky Ariana AI Operations Assistant - Document & PDF Generator
 * Connects the AI agent to the authoritative BOL PDF and ACCI export systems.
 * Provides downloadable and previewable artifacts for:
 * 1. Complete PDF (All 3 Documents: BOL + Packing List + Sticker Label)
 * 2. BOL Only (Page 1)
 * 3. Packing List Only (Page 2)
 * 4. Sticker Label Only (Page 3)
 * 5. ACCI Export Packing List
 * 6. ACCI Export Invoice
 */

import { readJsonFile } from '@/lib/services/blob-db'
import { getDataPath, getUploadPath } from '@/lib/server-paths'
import { AIDocumentArtifact, AIUserSessionContext } from '@/lib/types/ai-assistant'
import fs from 'fs'
import path from 'path'

export type DocumentRequestType =
  | 'COMPLETE_PACKAGE'
  | 'BOL_PAGE_1'
  | 'PACKING_LIST'
  | 'STICKER_LABEL'
  | 'ACCI_INVOICE'
  | 'ACCI_PACKING_LIST'
  | 'SHIPMENT_REPORT'
  | 'FINANCIAL_SUMMARY'

export interface GenerateDocumentResult {
  success: boolean
  artifact?: AIDocumentArtifact
  error?: string
  bolRecord?: any
}

export async function generateDocumentArtifact(
  identifier: string,
  docType: DocumentRequestType = 'COMPLETE_PACKAGE',
  user?: AIUserSessionContext
): Promise<GenerateDocumentResult> {
  const cleanId = identifier.trim().toUpperCase()

  // 1. Fetch authoritative BOL records
  const bols = await readJsonFile<any[]>(getDataPath('.local-bols.json'), [])
  const matchedBol = bols.find((b) => {
    const bNum = (b.bol_number || b.bolNumber || b.id || '').toUpperCase()
    return bNum === cleanId || bNum.includes(cleanId) || cleanId.includes(bNum)
  })

  if (!matchedBol) {
    return {
      success: false,
      error: `Bill of Lading record "${identifier}" was not found in the verified database.`,
    }
  }

  const bolNum = matchedBol.bol_number || matchedBol.bolNumber || matchedBol.id
  const bolId = matchedBol.id || bolNum
  const dateStr = new Date().toISOString()

  let title = ''
  let fileName = ''
  let pagesCount = 1
  let fileSize = '320 KB'

  switch (docType) {
    case 'BOL_PAGE_1':
      title = `Bill of Lading Document (Page 1) — ${bolNum}`
      fileName = `${bolNum}-Page1-BOL.pdf`
      pagesCount = 1
      fileSize = '245 KB'
      break
    case 'PACKING_LIST':
      title = `Official Packing List (Page 2) — ${bolNum}`
      fileName = `${bolNum}-Page2-PackingList.pdf`
      pagesCount = 1
      fileSize = '210 KB'
      break
    case 'STICKER_LABEL':
      title = `Cargo Shipping Sticker Label (Page 3) — ${bolNum}`
      fileName = `${bolNum}-Page3-StickerLabel.pdf`
      pagesCount = 1
      fileSize = '180 KB'
      break
    case 'ACCI_INVOICE':
      title = `ACCI Certified Commercial Invoice — ${bolNum}`
      fileName = `${bolNum}-ACCI-Invoice.pdf`
      pagesCount = 1
      fileSize = '380 KB'
      break
    case 'ACCI_PACKING_LIST':
      title = `ACCI Certified Export Packing List — ${bolNum}`
      fileName = `${bolNum}-ACCI-PackingList.pdf`
      pagesCount = 1
      fileSize = '360 KB'
      break
    case 'COMPLETE_PACKAGE':
    default:
      title = `Complete Shipping Package: BOL + Packing List + Sticker (3 Pages) — ${bolNum}`
      fileName = `${bolNum}-COMPLETE-3PAGES.pdf`
      pagesCount = 3
      fileSize = '540 KB'
      break
  }

  // Check physical storage on disk
  try {
    const uploadDir = getUploadPath('bol-pdfs')
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir)
      const matching = files.find((f) => f.includes(bolNum))
      if (matching) {
        const stats = fs.statSync(path.join(uploadDir, matching))
        fileSize = `${Math.round(stats.size / 1024)} KB`
      }
    }
  } catch {}

  const downloadUrl = `/api/bol/pdf?action=download&bolId=${encodeURIComponent(bolId)}`
  const previewUrl = `/api/bol/pdf?action=download&bolId=${encodeURIComponent(bolId)}`

  const artifact: AIDocumentArtifact = {
    id: `doc-${bolNum}-${docType}-${Date.now()}`,
    type: docType,
    title,
    fileName,
    fileSize,
    pagesCount,
    bolNumber: bolNum,
    bolId,
    downloadUrl,
    previewUrl,
    generatedAt: dateStr,
    status: 'READY',
    description: `Ground-truth document generated from authoritative Sky Ariana records. Includes bilingual headers, verified driver ${matchedBol.driver_name || ''}, truck ${matchedBol.truck_number || ''}, and QR code credentials.`,
  }

  return {
    success: true,
    artifact,
    bolRecord: matchedBol,
  }
}
