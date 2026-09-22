'use client'

export interface PDFLedgerRow {
  sNo?: number | string
  date: string
  shipperDescription: string
  invoiceNo: string
  dateOfShip?: string
  billOfLanding: string
  containerNo: string
  consignee: string
  quantity: string
  debit: number
  credit: number
  balance?: number
}

export async function parseLedgerPDF(file: File): Promise<PDFLedgerRow[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing can only be executed in the browser environment.')
  }

  try {
    const pdfjsLib = await import('pdfjs-dist')
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`
      } catch (e) {
        console.warn('[v0] Failed to set PDF worker source:', e)
      }
    }

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    const rows: PDFLedgerRow[] = []
    const allText: string[] = []

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ')
      allText.push(pageText)
    }

    const fullText = allText.join('\n')
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l)

    // Parse rows from extracted text
    // This is a heuristic parser for the specific ledger format
    let currentRow: Partial<PDFLedgerRow> | null = null
    let sNoCounter = 1

    for (let i = 0; i < lines.length; i++) {
      const line = lines.at(i) ?? ''

      // Skip header and footer lines
      if (isHeaderLine(line) || isFooterLine(line)) continue

      // Try to detect row start (typically with S.NO or a date)
      if (isRowStart(line)) {
        if (currentRow && hasRequiredFields(currentRow)) {
          rows.push(completeRow(currentRow, sNoCounter++))
        }
        currentRow = parseRowStart(line)
      } else if (currentRow && isNumeric(line)) {
        // This might be a quantity, debit, or credit
        const nextLine = lines.at(i + 1)
        currentRow = assignNumericField(currentRow, line, nextLine)
      }
    }

    // Add last row
    if (currentRow && hasRequiredFields(currentRow)) {
      rows.push(completeRow(currentRow, sNoCounter))
    }

    if (rows.length === 0) {
      throw new Error('No valid ledger entries found in PDF')
    }

    return rows
  } catch (error) {
    console.error('[v0] PDF parsing error:', error)
    throw error
  }
}

function isHeaderLine(line: string): boolean {
  const headerKeywords = [
    'BALANCE USD', 'CREDIT', 'DEBIT', 'QUANTITY', 'CONSIGNEE',
    'CONTAINER', 'BILL', 'INVOICE', 'DATE', 'DESCRIPTION',
    'SN', 'S.NO', 'تاریخ', 'تعداد', 'انوایس'
  ]
  return headerKeywords.some(keyword => 
    line.toUpperCase().includes(keyword.toUpperCase())
  ) && line.length < 100
}

function isFooterLine(line: string): boolean {
  const footerKeywords = ['NAJEB-AMIN', 'ADD:', 'TEL:', 'LICENCE', 'TOTAL']
  return footerKeywords.some(keyword => 
    line.toUpperCase().includes(keyword)
  )
}

function isRowStart(line: string): boolean {
  // Check if line starts with a number (S.NO) or date pattern
  return /^\d+$/.test(line) || /^\d{1,2}-\d{1,2}-\d{2,4}$/.test(line) || /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(line)
}

function parseRowStart(line: string): Partial<PDFLedgerRow> {
  const datePattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/
  const match = line.match(datePattern)
  
  if (match) {
    return {
      date: normalizeDate(match[0])
    }
  }

  return {}
}

function normalizeDate(dateStr: string): string {
  // Handle various date formats: DD-MM-YYYY, DD/MM/YYYY, etc.
  const parts = dateStr.split(/[-\/]/)
  if (parts.length === 3) {
    const [d, m, y] = parts
    const year = y.length === 2 ? `14${y}` : y // Afghan Hijri calendar
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return dateStr
}

function isNumeric(line: string): boolean {
  return /^\$?[\d,]+(\.\d{2})?$/.test(line) || /^[\d,]+(\.\d{2})?$/.test(line)
}

function assignNumericField(row: Partial<PDFLedgerRow>, value: string, nextLine?: string): Partial<PDFLedgerRow> {
  const num = parseFloat(value.replace(/[$,]/g, ''))
  
  // Heuristic: assign to debit, credit, or balance based on position
  if (!row.debit || row.debit === 0) {
    row.debit = num
  } else if (!row.credit || row.credit === 0) {
    row.credit = num
  } else if (!row.balance) {
    row.balance = num
  }

  return row
}

function hasRequiredFields(row: Partial<PDFLedgerRow>): boolean {
  return !!(row.date && (row.debit || row.credit))
}

function completeRow(row: Partial<PDFLedgerRow>, sNo: number): PDFLedgerRow {
  return {
    sNo: sNo.toString(),
    date: row.date || new Date().toISOString().split('T')[0],
    shipperDescription: row.shipperDescription || '',
    invoiceNo: row.invoiceNo || '',
    dateOfShip: row.dateOfShip || '',
    billOfLanding: row.billOfLanding || '',
    containerNo: row.containerNo || '',
    consignee: row.consignee || '',
    quantity: row.quantity || '',
    debit: row.debit || 0,
    credit: row.credit || 0,
    balance: row.balance || 0,
  }
}
