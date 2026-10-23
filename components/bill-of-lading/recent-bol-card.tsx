"use client"

import React, { memo, startTransition } from "react"
import { Clock, ArrowRight, Boxes, Truck, Pencil, FolderArchive, FileDown, Loader2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cleanBolNumber, isUUID } from "@/lib/utils/bol-filters"
import { extractCleanCommodity, isRtlText } from "@/lib/reports/parsers"

export interface SavedDocumentData {
  id: string
  bol_number?: string
  billOfLadingNumber?: string
  bolNo?: string
  issue_date?: string
  issueDate?: string
  created_at?: string
  createdAt?: string
  shipper_name?: string
  consignee_name?: string
  truck_number?: string
  driver_name?: string
  driver_rent?: string
  driverFreight?: string
  driverRent?: string
  number_of_packages?: string
  numberOfPackages?: string
  net_weight?: string
  netWeight?: string
  gross_weight?: string
  grossWeight?: string
  goods_value?: string
  goods_description?: string
  description_of_goods?: string
  cargo_description?: string
  commodity?: string
  pdf_url?: string | null
  pdf_status?: "ready" | "outdated" | "none" | string
  status?: string
}

export interface RecentBolCardProps {
  doc: SavedDocumentData
  onEdit: () => void
  onFiles: () => void
  onPdf: () => void
  onPreview?: () => void
  onCardClick?: () => void
  isDownloadingPdf?: boolean
  isSelected?: boolean
  className?: string
}

/**
 * Normalizes commodity strings, stripping numeric carton prefixes and fixing typos like RAISNIS -> RAISINS
 */
export function cleanCommodityName(text: string): string {
  if (!text) return ""

  // 1. If text has multiple lines or contains particulars header, find the content line
  const lines = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean)
  const candidate =
    lines.find((l) => {
      const u = l.toUpperCase()
      return (
        !u.startsWith("CONTAINER & CARGO") &&
        !u.startsWith("CARGO PARTICULARS") &&
        !u.startsWith("DOCUMENT & SHIPPING") &&
        !u.startsWith("SHIPPING DETAILS") &&
        !u.startsWith("TRANSIT DATE:") &&
        !u.startsWith("BORDER:") &&
        !u.startsWith("INVOICE NO:")
      )
    }) || text

  // 2. Strip section headers, description bullets, and carton counts
  let cleaned = candidate
    .replace(/^(?:CONTAINER\s*&\s*CARGO\s*PARTICULARS|CARGO\s*PARTICULARS|DESCRIPTION\s*OF\s*GOODS|DOCUMENT\s*&\s*SHIPPING|SHIPPING\s*DETAILS|CARGO\s*DESCRIPTION|COMMODITY)\s*[:•\-│\s]*/gi, "")
    .replace(/^[•*·\-🥬📦│\s]*(?:DESCRIPTION\s*OF\s*GOODS|DESCRIPTION|CARGO|COMMODITY)?\s*[:•\-│\s]*/gi, "")
    .replace(/\bRAISNIS\b/gi, "RAISINS")
    .replace(/^\s*\d+[\d,.]*\s*(?:CTNS?|CARTONS?|CNTS?|BAGS?|PKGS?|BOXES|PCS|UNITS)?\s*(?:OF\s*)?/i, "")
    .replace(/\s*[-–—]\s*(?:KGS?|KG|TONS?|USD|AFN|@).*$/i, "")
    .trim()

  // 3. If empty or still contains header remnants, use extractCleanCommodity
  if (!cleaned || cleaned.toUpperCase().includes("CONTAINER & CARGO") || cleaned.toUpperCase().includes("PARTICULARS")) {
    const extracted = extractCleanCommodity(text)
    if (extracted && extracted !== "General Cargo") {
      cleaned = extracted
    }
  }

  return cleaned
}

/**
 * Extracts clean commodity name, formatted packages count, and item count
 */
export function parseCargoSummaryDetails(doc: SavedDocumentData): {
  packages: string
  commodity: string
  itemCount: number
  rawText: string
} {
  const pkgStr = (doc.number_of_packages || doc.numberOfPackages || "").trim()
  const rawDesc = (doc.cargo_description || doc.goods_description || doc.description_of_goods || doc.commodity || "").trim()

  if (!pkgStr && !rawDesc) {
    return { packages: "—", commodity: "GENERAL CARGO", itemCount: 1, rawText: "" }
  }

  // 1. If number_of_packages contains split items (e.g., "460 CTNS BLACK RAISNIS - 994 CTNS GREEN RAISNIS")
  if (pkgStr.includes("-")) {
    const parts = pkgStr.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean)
    let totalPkgs = 0
    const commodities: string[] = []

    for (const p of parts) {
      const numMatch = p.match(/^([0-9,]+)/)
      if (numMatch) {
        totalPkgs += parseInt(numMatch[1].replace(/,/g, ""), 10) || 0
      }
      const comm = cleanCommodityName(p)
      if (comm && !commodities.includes(comm)) commodities.push(comm)
    }

    let commodity = commodities.join(" / ")
    if (!commodity) commodity = cleanCommodityName(rawDesc) || "CARGO"

    return {
      packages: totalPkgs > 0 ? `${totalPkgs.toLocaleString()} CTNS` : pkgStr,
      commodity: commodity.toUpperCase(),
      itemCount: parts.length,
      rawText: pkgStr,
    }
  }

  // 2. Single item in number_of_packages (e.g., "1454 CTNS BLACK RAISNIS ")
  if (pkgStr) {
    const numMatch = pkgStr.match(/^([0-9,]+)/)
    let packagesDisplay = pkgStr
    if (numMatch) {
      const num = parseInt(numMatch[1].replace(/,/g, ""), 10)
      if (!isNaN(num) && num > 0) {
        const unitMatch = pkgStr.match(/\b(CTNS?|CARTONS?|CNTS?|BAGS?|PKGS?|BOXES|PCS|UNITS)\b/i)
        const unit = unitMatch ? unitMatch[1].toUpperCase() : "CTNS"
        packagesDisplay = `${num.toLocaleString()} ${unit}`
      }
    }

    let commodity = cleanCommodityName(pkgStr)
    if (!commodity) {
      commodity = cleanCommodityName(rawDesc) || "GENERAL CARGO"
    }

    return {
      packages: packagesDisplay,
      commodity: commodity.toUpperCase(),
      itemCount: 1,
      rawText: pkgStr,
    }
  }

  // 3. Fallback to raw cargo description if packages string is absent
  return {
    packages: "—",
    commodity: (cleanCommodityName(rawDesc) || "GENERAL CARGO").toUpperCase(),
    itemCount: 1,
    rawText: rawDesc,
  }
}

/**
 * Extracts and sums weights, handling multi-part strings like "7,360 KG - 15,904 KG"
 */
export function parseWeightDetails(doc: SavedDocumentData): {
  netDisplay: string
  grossDisplay: string
  tooltip: string
} {
  function sumWeights(str?: string | null): { formatted: string; total: number; count: number } | null {
    if (!str) return null
    const parts = str.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean)
    let total = 0
    let unit = "KG"
    let count = 0

    for (const p of parts) {
      const numMatch = p.match(/([0-9,]+(?:\.[0-9]+)?)/)
      if (numMatch) {
        total += parseFloat(numMatch[1].replace(/,/g, "")) || 0
        count++
      }
      const unitMatch = p.match(/(KG|KGS|TONS?|LBS?)/i)
      if (unitMatch) unit = unitMatch[1].toUpperCase()
    }

    if (count === 0) return null
    return {
      formatted: `${total.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit === "KGS" ? "KG" : unit}`,
      total,
      count,
    }
  }

  const netInfo = sumWeights(doc.net_weight || doc.netWeight)
  const grossInfo = sumWeights(doc.gross_weight || doc.grossWeight)

  const netDisplay = netInfo ? netInfo.formatted : ""
  const grossDisplay = grossInfo ? grossInfo.formatted : ""

  const tooltipParts: string[] = []
  if (netDisplay) {
    tooltipParts.push(`Net Weight: ${netDisplay}${netInfo && netInfo.count > 1 ? ` (${doc.net_weight})` : ""}`)
  }
  if (grossDisplay) {
    tooltipParts.push(`Gross Weight: ${grossDisplay}${grossInfo && grossInfo.count > 1 ? ` (${doc.gross_weight})` : ""}`)
  }

  return {
    netDisplay,
    grossDisplay,
    tooltip: tooltipParts.join(" | ") || "Weight: Not specified",
  }
}

/**
 * Formats truck plate cleanly, separating digits and Persian/Pashto city names
 */
export function parseTruckDetails(doc: SavedDocumentData): {
  plateNumber: string
  city: string
  driver: string
  display: string
  tooltip: string
} {
  const rawTruck = (doc.truck_number || "").trim()
  const rawDriver = (doc.driver_name || "").trim()

  if (!rawTruck && !rawDriver) {
    return { plateNumber: "", city: "", driver: "", display: "—", tooltip: "No truck or driver assigned" }
  }

  if (rawTruck) {
    // Match numeric digits (either Western 0-9 or Eastern Arabic/Persian ۰-۹)
    const digitMatch = rawTruck.match(/[0-9\u0660-\u0669\u06F0-\u06F9]+(?:-[0-9\u0660-\u0669\u06F0-\u06F9]+)?/)
    const plateNumber = digitMatch ? digitMatch[0].trim() : ""
    const cleanCity = rawTruck.replace(plateNumber, "").replace(/[-_#:\s]+/g, " ").trim()
    let display = rawTruck
    if (cleanCity && plateNumber) {
      display = rawTruck.trim().match(/^[0-9\u0660-\u0669\u06F0-\u06F9]/)
        ? `${plateNumber} ${cleanCity}`
        : `${cleanCity} ${plateNumber}`
    }
    const tooltip = rawDriver ? `Truck: ${display} | Driver: ${rawDriver}` : `Truck: ${display}`

    return { plateNumber, city: cleanCity, driver: rawDriver, display, tooltip }
  }

  return { plateNumber: "", city: "", driver: rawDriver, display: rawDriver, tooltip: `Driver: ${rawDriver}` }
}

/**
 * Formats driver rent cleanly, extracting currency amount and stripping verbose commentary
 */
export function parseRentDetails(doc: SavedDocumentData): {
  display: string
  tooltip: string
} {
  const rawRent = String(doc.driver_rent || doc.driverFreight || doc.driverRent || "").trim()
  if (!rawRent || rawRent === "0" || rawRent === "0.00" || rawRent === "null" || rawRent === "undefined") {
    return { display: "", tooltip: "" }
  }

  // Match currency and amount (e.g., "38,500 AFN - کرایه واپسی")
  const match = rawRent.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]{3}|\$)?/)
  if (match) {
    const amount = match[1]
    let cur = (match[2] || "").toUpperCase()
    if (!cur && rawRent.toUpperCase().includes("AFN")) cur = "AFN"
    if (!cur && rawRent.toUpperCase().includes("USD")) cur = "USD"
    if (!cur && rawRent.toUpperCase().includes("AED")) cur = "AED"
    if (!cur) cur = "AFN"

    return {
      display: `${amount} ${cur}`,
      tooltip: `Driver Rent: ${rawRent}`,
    }
  }

  return {
    display: rawRent,
    tooltip: `Driver Rent: ${rawRent}`,
  }
}

/**
 * Formats official BOL Number, preventing UUID leakage
 */
export function formatCardBolNumber(doc: SavedDocumentData): string {
  const clean = cleanBolNumber(doc.bol_number || doc.billOfLadingNumber || doc.bolNo)
  if (!clean || clean === "BOL" || isUUID(clean)) {
    return "BOL NUMBER MISSING"
  }
  return clean
}

/**
 * Formats document date cleanly
 */
export function formatCardDate(doc: SavedDocumentData): string {
  const rawDate = doc.issue_date || doc.issueDate || doc.created_at || doc.createdAt
  if (!rawDate) return "No date"
  try {
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return "No date"
    return d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })
  } catch {
    return "No date"
  }
}

export const RecentBolCard = memo(function RecentBolCard({
  doc,
  onEdit,
  onFiles,
  onPdf,
  onPreview,
  onCardClick,
  isDownloadingPdf = false,
  isSelected = false,
  className,
}: RecentBolCardProps) {
  const bolNumber = formatCardBolNumber(doc)
  const dateDisplay = formatCardDate(doc)
  const shipper = (doc.shipper_name || "").trim()
  const consignee = (doc.consignee_name || "").trim()
  const isShipperRtl = isRtlText(shipper)
  const isConsigneeRtl = isRtlText(consignee)

  const cargo = parseCargoSummaryDetails(doc)
  const weights = parseWeightDetails(doc)
  const truck = parseTruckDetails(doc)
  const rent = parseRentDetails(doc)

  const handleCardClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    startTransition(() => {
      if (onCardClick) {
        onCardClick()
      } else if (onEdit) {
        onEdit()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      e.stopPropagation()
      handleCardClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800",
        "p-3.5 sm:p-4 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all duration-200",
        "flex flex-col justify-between h-full min-w-[250px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:-translate-y-0.5",
        isSelected && "ring-2 ring-blue-500 border-blue-500/60 shadow-blue-500/10",
        className
      )}
    >
      {/* Content Top Area */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row: BOL Number + Date */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-950 dark:bg-slate-900 text-amber-400 dark:text-amber-300 font-mono font-bold text-xs tracking-tight border border-slate-800 shadow-2xs select-all truncate max-w-[170px]"
              title={`Official BOL: ${bolNumber}`}
            >
              {bolNumber}
            </span>

            <span
              className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0"
              title={`Document Date: ${dateDisplay}`}
            >
              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{dateDisplay}</span>
            </span>
          </div>

          {/* Shipper & Consignee */}
          <div className="mb-2.5 space-y-1">
            <div
              className={cn(
                "text-[13px] font-black text-slate-950 dark:text-slate-100 leading-snug line-clamp-2",
                isShipperRtl && "font-['Vazirmatn',sans-serif] text-right"
              )}
              dir={isShipperRtl ? "rtl" : "ltr"}
              title={shipper || "No Shipper Specified"}
            >
              {shipper || "No Shipper Specified"}
            </div>
            <div
              className={cn(
                "text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 flex items-start gap-1 leading-snug",
                isConsigneeRtl && "font-['Vazirmatn',sans-serif]"
              )}
              title={consignee || "No Consignee Specified"}
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2" dir={isConsigneeRtl ? "rtl" : "ltr"}>
                {consignee || "No Consignee Specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Grouped Information Block (Cargo, Packages, Weight, Truck, Rent) */}
        <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 p-2.5 text-xs space-y-2 mb-3">
          {/* Cargo Details */}
          <div>
            <div className="flex items-center justify-between gap-1">
              <span
                className="font-black text-[11px] text-slate-900 dark:text-slate-200 tracking-tight uppercase truncate"
                title={cargo.commodity}
              >
                {cargo.commodity}
              </span>
              {cargo.itemCount > 1 && (
                <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200/60 shrink-0">
                  {cargo.itemCount} Items
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-1 text-[11px]">
              <span
                className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200 truncate"
                title={cargo.packages}
              >
                <Boxes className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{cargo.packages}</span>
              </span>

              {weights.netDisplay && (
                <span
                  className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[10.5px] shrink-0"
                  title={weights.tooltip}
                >
                  Net: {weights.netDisplay}
                </span>
              )}
            </div>
          </div>

          {/* Logistics Row: Truck & Driver Rent */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-2 text-[10.5px]">
            <div
              className="flex items-center gap-1.5 min-w-0 text-slate-700 dark:text-slate-300"
              title={truck.tooltip}
            >
              <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[10.5px] shrink-0">Truck:</span>
              <div className="flex items-center gap-1 min-w-0 truncate">
                {truck.city && (
                  <bdi
                    dir="auto"
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
                      isRtlText(truck.city) && "font-['Vazirmatn',sans-serif]"
                    )}
                  >
                    {truck.city}
                  </bdi>
                )}
                {truck.plateNumber ? (
                  <bdi dir="ltr" className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px] truncate">
                    {truck.plateNumber}
                  </bdi>
                ) : (
                  !truck.city && (
                    <span className="text-slate-400 text-[10.5px]">—</span>
                  )
                )}
              </div>
            </div>

            {rent.display && (
              <div
                className="flex items-center gap-1 shrink-0 font-mono"
                title={rent.tooltip}
              >
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Rent:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                  {rent.display}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: 2-Tier Balanced Grid (Zero Button Truncation) */}
      <div className="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
        {/* Tier 1: Primary Actions (Edit & Preview) */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              startTransition(() => {
                onEdit()
              })
            }}
            className="h-8.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5 px-2 w-full"
            title="Edit Bill of Lading"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Edit</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              startTransition(() => {
                if (onPreview) {
                  onPreview()
                } else if (onCardClick) {
                  onCardClick()
                }
              })
            }}
            className="h-8.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 px-2 w-full"
            title="Preview A4 Document"
          >
            <Eye className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span className="truncate">Preview</span>
          </Button>
        </div>

        {/* Tier 2: Document Files & PDF Output */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              startTransition(() => {
                onFiles()
              })
            }}
            className="h-7.5 rounded-xl border border-cyan-200/90 dark:border-cyan-800 bg-cyan-50/70 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-900 dark:text-cyan-300 font-bold text-[11px] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 px-2 w-full"
            title="Digital Shipment Files & Attachments"
          >
            <FolderArchive className="w-3 h-3 text-cyan-700 dark:text-cyan-400 shrink-0" />
            <span className="truncate">Files</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isDownloadingPdf}
            onClick={(e) => {
              e.stopPropagation()
              startTransition(() => {
                onPdf()
              })
            }}
            className={cn(
              "h-7.5 rounded-xl border font-bold text-[11px] cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 px-2 w-full",
              doc.pdf_status === "missing"
                ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-900 dark:text-rose-300 shadow-2xs"
                : doc.pdf_status === "outdated"
                ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-900 dark:text-amber-300 shadow-2xs"
                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
            )}
            title={
              doc.pdf_status === "missing"
                ? "Physical PDF missing — Click to Regenerate"
                : doc.pdf_status === "outdated"
                ? "Document updated since PDF generation — PDF Outdated"
                : "Download or Print BOL PDF"
            }
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
            ) : (
              <FileDown
                className={cn(
                  "w-3 h-3 shrink-0",
                  doc.pdf_status === "missing"
                    ? "text-rose-600 dark:text-rose-400"
                    : doc.pdf_status === "outdated"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-700 dark:text-slate-300"
                )}
              />
            )}
            <span className="truncate">
              {doc.pdf_status === "missing" ? "Missing" : doc.pdf_status === "outdated" ? "Outdated" : "PDF"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
})
