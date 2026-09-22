/**
 * Sky Ariana Logistics — Report Center Parsers & Normalization Engine
 */

/**
 * Safely parses weight values (Net / Gross weight in KG).
 * Handles strings like "23,616 KG", "23616", "23,616.50", "23.616", etc.
 */
export function parseWeight(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) || !isFinite(val) ? 0 : val

  const str = String(val).trim()
  if (!str) return 0

  // Match the first valid numeric group with optional decimals and commas
  const match = str.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)
  if (!match) return 0

  const parsed = parseFloat(match[0])
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed
}

/**
 * Safely parses package / carton counts.
 * Handles "1,476 CTNS", "1476 CARTONS", "1476", etc.
 */
export function parsePackages(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) || !isFinite(val) ? 0 : Math.round(val)

  const str = String(val).trim()
  if (!str) return 0

  const match = str.replace(/,/g, "").match(/\d+/)
  if (!match) return 0

  const parsed = parseInt(match[0], 10)
  return isNaN(parsed) ? 0 : parsed
}

export interface ParsedMoney {
  amount: number
  currency: string
}

/**
 * Safely parses monetary / goods values and determines the declared currency.
 * Never combines multi-currencies.
 *
 * Examples:
 * - "$6,846,064" -> { amount: 6846064, currency: "USD" }
 * - "6,846,064 USD" -> { amount: 6846064, currency: "USD" }
 * - "420,000 AED" -> { amount: 420000, currency: "AED" }
 * - "3,200,000 AFN" -> { amount: 3200000, currency: "AFN" }
 * - "€115,000" -> { amount: 115000, currency: "EUR" }
 */
export function parseMoney(val: unknown): ParsedMoney {
  if (val === null || val === undefined) return { amount: 0, currency: "USD" }

  const str = String(val).trim()
  if (!str) return { amount: 0, currency: "USD" }

  let currency = "USD"
  const upper = str.toUpperCase()

  if (upper.includes("AFN") || upper.includes("افغانی")) {
    currency = "AFN"
  } else if (upper.includes("AED") || upper.includes("درهم") || upper.includes("DHS")) {
    currency = "AED"
  } else if (upper.includes("EUR") || upper.includes("€") || upper.includes("EURO")) {
    currency = "EUR"
  } else if (upper.includes("INR") || upper.includes("₹") || upper.includes("RUPEE")) {
    currency = "INR"
  } else if (upper.includes("IRR") || upper.includes("تومان") || upper.includes("TOMAN") || upper.includes("RIAL")) {
    currency = "IRR"
  } else if (upper.includes("GBP") || upper.includes("£")) {
    currency = "GBP"
  } else {
    currency = "USD"
  }

  // Extract number
  const match = str.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)
  if (!match) return { amount: 0, currency }

  const parsed = parseFloat(match[0])
  return {
    amount: isNaN(parsed) || !isFinite(parsed) ? 0 : parsed,
    currency,
  }
}

/**
 * Normalizes historic date values into a valid JavaScript Date.
 * Handles ISO formats, "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", and human dates.
 */
export function normalizeDate(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }

  const str = String(val).trim()
  if (!str) return null

  // 1. Try native Date parse (handles YYYY-MM-DD, ISO-8601, and English month strings)
  const direct = new Date(str)
  if (!isNaN(direct.getTime())) {
    return direct
  }

  // 2. Try DD/MM/YYYY or DD-MM-YYYY format
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10)
    const month = parseInt(slashMatch[2], 10) - 1
    const year = parseInt(slashMatch[3], 10)
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime())) return d
  }

  return null
}

export function formatDateIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function formatDisplayDate(val: unknown): string {
  const d = normalizeDate(val)
  if (!d) return "-"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * Safely computes percentage delta between two periods without Infinity or NaN.
 */
export function safePercentageChange(
  current: number,
  previous: number
): { changePercent: number; percent: number; isNew: boolean; direction: "up" | "down" | "flat" } {
  if (previous === 0) {
    if (current === 0) return { changePercent: 0, percent: 0, isNew: false, direction: "flat" }
    return { changePercent: 0, percent: 0, isNew: true, direction: "up" }
  }

  const diff = current - previous
  const percent = Math.round((diff / Math.abs(previous)) * 1000) / 10

  let direction: "up" | "down" | "flat" = "flat"
  if (diff > 0) direction = "up"
  else if (diff < 0) direction = "down"

  return { changePercent: percent, percent, isNew: false, direction }
}

/**
 * Checks if a string contains Right-To-Left (Pashto/Dari/Arabic) characters.
 */
export function isRtlText(text?: string | null): boolean {
  if (!text) return false
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
}

/**
 * Extracts a clean commodity title from cargo descriptions.
 * Cleans packages counts, carton weights, typos (e.g. RAISNIS -> RAISINS), and rates.
 */
export function extractCleanCommodity(description?: string | null): string {
  if (!description) return "General Cargo"

  let text = description.trim()
  if (!text) return "General Cargo"

  // Take the first line or primary description segment
  const firstLine = text.split("\n")[0].trim()

  // Clean known prefixes like "1. 1476 CTNS - " or "1476 CTNS OF "
  let cleaned = firstLine
    .replace(/^\d+[\.\)]\s*/, "") // Strip leading numbering
    .replace(/^\d+[\s,-]*(?:CTNS|CARTONS|BAGS|PKGS|PACKAGES|BOXES)[\s,-]*(?:OF)?\s*/i, "")
    .replace(/\bRAISNIS\b/gi, "RAISINS")
    .replace(/\b(\d+)\s*-\s*KGS\b/gi, "")
    .replace(/\bRATE\s*[\d.]+\s*USD\b/gi, "")
    .replace(/\bPER\s*CARTON\b/gi, "")
    .replace(/["']/g, "")
    .trim()

  // Remove trailing dashes, commas, colons
  cleaned = cleaned.replace(/^[-,:\s]+|[-,:\s]+$/g, "").trim()

  if (!cleaned) return "General Cargo"

  // Standardize common commodities
  const upper = cleaned.toUpperCase()
  if (upper.includes("GOLDEN RAISIN")) return "Golden Raisins"
  if (upper.includes("BLACK RAISIN")) return "Black Raisins"
  if (upper.includes("GREEN RAISIN")) return "Green Raisins"
  if (upper.includes("CARAWAY") || upper.includes("ZEERA") || upper.includes("ZIRA")) return "Caraway Seeds"
  if (upper.includes("APRICOT")) return "Dry Apricots"
  if (upper.includes("ANARDANA") || upper.includes("POMEGRANATE")) return "Anardana"
  if (upper.includes("FIG") || upper.includes("INJEER")) return "Dried Figs"
  if (upper.includes("ALMOND") || upper.includes("BADAM")) return "Almonds"
  if (upper.includes("PISTACHIO") || upper.includes("PISTA")) return "Pistachios"
  if (upper.includes("WALNUT") || upper.includes("CHORMAGH")) return "Walnuts"
  if (upper.includes("SAFFRON") || upper.includes("ZAFARAN")) return "Saffron"

  return cleaned.length > 40 ? cleaned.substring(0, 40) + "..." : cleaned
}

export function extractInvoiceNo(doc: any): string {
  if (doc.invoice_no && doc.invoice_no.trim()) return doc.invoice_no.trim()
  if (doc.invoice_number && doc.invoice_number.trim()) return doc.invoice_number.trim()
  const texts = [
    doc.cargo_description,
    doc.goods_description,
    doc.description_of_goods,
    doc.remarks,
  ].filter(Boolean).join(" ")
  const match = texts.match(/(?:invoice|inv|fakt[ou]r|فاکتور)\s*(?:no|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]*)/i)
  return match?.[1]?.trim() || ""
}

export function extractTruckNo(doc: any): string {
  if (doc.truck_number && doc.truck_number.trim()) return doc.truck_number.trim()
  const texts = [
    doc.cargo_description,
    doc.goods_description,
    doc.description_of_goods,
    doc.remarks,
  ].filter(Boolean).join(" ")
  const match = texts.match(/(?:truck|lorry|vehicle|موتر)\s*(?:no|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/-]+)/i)
  return match?.[1]?.trim() || ""
}
