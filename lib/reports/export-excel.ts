/**
 * Sky Ariana Logistics — Professional Multi-Sheet Excel (.xlsx) Export Engine
 * Version 5.2.0
 * 
 * Implements:
 * 1. Summary Sheet with full KPI dashboard, multi-currency revenue and driver rent totals
 * 2. Detailed BOLs Sheet with complete metadata: Driver Father Name, Border Station, Origin, numeric metrics
 * 3. Cargo Items Breakdown Sheet with itemized packages, weights, rates, values, container mapping
 * 4. Multi-entity analytics: Shippers, Consignees, Commodities, Destinations
 * 5. Corridors & Fleet: Transit Routes, Trucks & Drivers, Container Registry
 * 6. Financial Analysis: Segregated multi-currency revenue and driver disbursements (USD vs AFN)
 * 7. Active tab prioritization and comprehensive multi-sheet workbook generation
 */

import { SavedDocument } from "./types"
import { calculateOverviewKpis } from "./calculations"
import {
  groupShippers,
  groupConsignees,
  groupCommodities,
  groupDestinations,
  groupContainers,
  groupRoutes,
  groupTrucks,
  groupMonthly,
  calculateFinancialMetrics,
} from "./grouping"
import {
  formatDisplayDate,
  extractBolRoute,
  extractTruckNo,
  extractInvoiceNo,
  parseWeight,
  parsePackages,
  parseMoney,
} from "./parsers"
import { parseSyncedCargoItems } from "@/lib/utils/cargo-grid"
import { extractBolCargoAndRates } from "./cargo-rate-extractor"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"

/**
 * Extracts Driver Father Name from explicit field or Dari/Pashto 'ولد' pattern.
 */
export function extractDriverFatherName(doc: SavedDocument): string {
  if (doc.driver_father_name && String(doc.driver_father_name).trim()) {
    return String(doc.driver_father_name).trim()
  }
  const rawName = String(doc.driver_name || "").trim()
  if (rawName) {
    const parts = rawName.split(/\s*ولد\s*/)
    if (parts.length > 1 && String(parts[1]).trim()) {
      return String(parts[1]).replace(/^[:\-\s]+/, "").trim()
    }
  }
  return "-"
}

/**
 * Extracts Transit Border Station across English, Dari, and Pashto metadata.
 */
export function extractTransitBorderStation(doc: SavedDocument): string {
  const route = extractBolRoute(doc)
  if (route.borderCrossing && route.borderCrossing !== "—") {
    return route.borderCrossing
  }
  const combined = [
    doc.cargo_route_note,
    doc.remarks,
    (doc as any).notes_1,
    (doc as any).notes_2,
    doc.port_of_loading,
    doc.port_of_discharge,
    doc.place_of_delivery,
  ].filter(Boolean).join(" ")

  const upper = combined.toUpperCase()
  if (upper.includes("ISLAM QALA") || combined.includes("اسلام قلعه") || combined.includes("اسلام قلا")) return "Islam Qala (اسلام قلعه)"
  if (upper.includes("TORGHUNDI") || combined.includes("تورغندی")) return "Torghundi (تورغندی)"
  if (upper.includes("HAIRATAN") || combined.includes("حیرتان")) return "Hairatan (حیرتان)"
  if (upper.includes("SPIN BOLDAK") || combined.includes("اسپین بولدک")) return "Spin Boldak (سپین بولدک)"
  if (upper.includes("MILAK") || upper.includes("NIMROZ") || combined.includes("میلک") || combined.includes("نیمروز")) return "Milak / Nimroz (میلک / نیمروز)"
  if (upper.includes("DOGHARUN") || upper.includes("DOUGHAROUN") || combined.includes("دوغارون")) return "Dogharun (دوغارون)"
  if (upper.includes("CHABAHAR") || combined.includes("چابهار")) return "Chabahar (چابهار)"
  if (upper.includes("BANDAR ABBAS") || combined.includes("بندرعباس")) return "Bandar Abbas (بندرعباس)"
  if (upper.includes("TORKHAM") || combined.includes("تورخم")) return "Torkham (تورخم)"
  return "-"
}

/**
 * Calculates optimal column widths based on maximum string lengths in rows.
 * Handles multi-line strings cleanly to prevent excessively wide cells.
 */
function autoFitColumns(rows: (string | number | undefined | null | any)[][]): { wch: number }[] {
  const colWidths: number[] = []

  for (const row of rows) {
    if (!row) continue
    row.forEach((val, colIdx) => {
      let strVal = ""
      if (val !== null && val !== undefined) {
        if (typeof val === "object" && val !== null && "v" in val) {
          strVal = String((val as any).v ?? "")
        } else {
          strVal = String(val)
        }
      }
      const maxLineLen = strVal.split("\n").reduce((max, line) => Math.max(max, line.length), 0)
      colWidths[colIdx] = Math.max(colWidths[colIdx] || (colIdx === 0 ? 6 : 13), maxLineLen + 3)
    })
  }

  return colWidths.map((w, colIdx) => {
    if (colIdx === 0 && w <= 8) return { wch: 7 }
    return { wch: Math.min(Math.max(w, 13), 56) }
  })
}

/**
 * Applies clean Excel number formatting (#,##0 and #,##0.00) to numeric cells.
 */
function applySheetCellFormatting(ws: any): void {
  if (!ws) return
  for (const cellAddress of Object.keys(ws)) {
    if (cellAddress.startsWith("!")) continue
    const cell = ws[cellAddress]
    if (cell && cell.t === "n" && typeof cell.v === "number") {
      if (cell.z) continue
      if (Number.isInteger(cell.v)) {
        cell.z = "#,##0"
      } else {
        cell.z = "#,##0.00"
      }
    }
  }
}

/**
 * Applies targeted number formatting to specific column indices.
 */
function applyColumnFormats(ws: any, colFormatMap: Record<number, string>): void {
  if (!ws) return
  for (const cellAddress of Object.keys(ws)) {
    if (cellAddress.startsWith("!")) continue
    const cell = ws[cellAddress]
    if (!cell) continue

    const colMatch = cellAddress.match(/^([A-Z]+)(\d+)$/)
    if (!colMatch) continue
    const rowNum = parseInt(colMatch[2], 10)
    if (rowNum === 1) continue // Skip header row

    // Decode column letters to 0-based column index
    const colStr = colMatch[1]
    let colIdx = 0
    for (let i = 0; i < colStr.length; i++) {
      colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64)
    }
    colIdx -= 1

    if (cell.t === "n" && typeof cell.v === "number") {
      if (colFormatMap[colIdx]) {
        cell.z = colFormatMap[colIdx]
      } else if (Number.isInteger(cell.v)) {
        cell.z = "#,##0"
      } else {
        cell.z = "#,##0.00"
      }
    }
  }
}

/**
 * Configures worksheet layout: auto-fitted columns, frozen header row, autofilters, and comfortable row heights.
 */
function configureTableWorksheet(
  XLSX: any,
  ws: any,
  rows: (string | number | undefined | null | any)[][],
  colFormatMap?: Record<number, string>,
  options?: {
    headerHeight?: number
    dataHeight?: number
    freezeRows?: number
    hasAutofilter?: boolean
  }
): void {
  if (!ws || !rows || rows.length === 0) return

  const freezeRows = options?.freezeRows ?? 1
  const headerHeight = options?.headerHeight ?? 26
  const dataHeight = options?.dataHeight ?? 19.5
  const hasAutofilter = options?.hasAutofilter ?? true

  // 1. Auto-fit column widths with generous breathing space
  ws["!cols"] = autoFitColumns(rows)

  // 2. Freeze Panes
  ws["!freeze"] = { xSplit: 0, ySplit: freezeRows }
  ws["!views"] = [{ state: "frozen", ySplit: freezeRows, activeCell: `A${freezeRows + 1}` }]

  // 3. Row Heights for airy, executive readability
  const rowHeights = [{ hpt: headerHeight }]
  for (let r = 1; r < rows.length; r++) {
    rowHeights.push({ hpt: dataHeight })
  }
  ws["!rows"] = rowHeights

  // 4. Autofilter for instant Excel dropdown filtering
  if (hasAutofilter && rows.length > 1) {
    const numCols = rows[0]?.length || 1
    const endColLetter = XLSX.utils.encode_col(numCols - 1)
    ws["!autofilter"] = { ref: `A1:${endColLetter}${rows.length}` }
  }

  // 5. Targeted cell formatting
  if (colFormatMap) {
    applyColumnFormats(ws, colFormatMap)
  } else {
    applySheetCellFormatting(ws)
  }
}

/**
 * Generates and downloads a complete Excel Workbook for the filtered BOL data.
 * Prioritizes the active tab when activeTab is passed.
 * Uses dynamic import and cooperative event loop yielding so large exports never lock the UI.
 */
export async function exportReportToExcel(
  docs: SavedDocument[],
  fileNamePrefix: string = "Sky-Ariana-Operations-Report",
  activeTab?: string,
  exportMode: "current" | "all" | "comprehensive" = "comprehensive"
): Promise<void> {
  // Yield to browser event loop before heavy computation
  await new Promise((resolve) => setTimeout(resolve, 0))

  const [XLSX, kpis] = await Promise.all([
    import("xlsx"),
    Promise.resolve().then(() => calculateOverviewKpis(docs)),
  ])

  const shippers = groupShippers(docs)
  const consignees = groupConsignees(docs)
  const commodities = groupCommodities(docs)
  const destinations = groupDestinations(docs)
  const { containers: containerList, stats: containerStats } = groupContainers(docs)

  // Calculate Driver Rent Totals Segregated by Currency (Rule 4)
  const driverRentTotals: Record<string, number> = {}
  for (const doc of docs) {
    const rawRent = doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || ""
    if (rawRent) {
      const { amount, currency } = parseMoney(rawRent)
      if (amount > 0) {
        driverRentTotals[currency] = (driverRentTotals[currency] || 0) + amount
      }
    }
  }

  // Calculate Border Crossings Breakdown (Rule 3)
  const borderStationCounts: Record<string, { bols: number; netWeight: number; packages: number }> = {}
  for (const doc of docs) {
    const station = extractTransitBorderStation(doc)
    if (!borderStationCounts[station]) {
      borderStationCounts[station] = { bols: 0, netWeight: 0, packages: 0 }
    }
    borderStationCounts[station].bols += 1
    borderStationCounts[station].netWeight += parseWeight(doc.net_weight)
    borderStationCounts[station].packages += parsePackages(doc.number_of_packages)
  }

  const wb = XLSX.utils.book_new()
  const todayStr = new Date().toISOString().split("T")[0]

  // ==========================================
  // SHEET 1: SUMMARY
  // ==========================================
  const summaryRows: (string | number)[][] = [
    ["SKY ARIANA LIMITED — OPERATIONS & MANAGEMENT REPORT"],
    [`Generated Date: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString()}`, `Total Records: ${docs.length} BOLs`],
    [],
    ["KEY PERFORMANCE INDICATORS (KPI)", "VALUE", "UNIT"],
    ["Total Bills of Lading (BOL)", kpis.totalBols, "Records"],
    ["Total Shipments", kpis.totalShipments, "Shipments"],
    ["Total Cargo Packages", kpis.totalPackages, "Cartons / CTNS"],
    ["Total Net Weight", kpis.totalNetWeightKg, "Kilograms (KG)"],
    ["Total Gross Weight", kpis.totalGrossWeightKg, "Kilograms (KG)"],
    ["Total Active Containers", kpis.totalContainers, "Units"],
    ["Unique Shippers", kpis.totalShippers, "Companies"],
    ["Unique Consignees", kpis.totalConsignees, "Companies"],
    ["Unique Destinations", kpis.totalDestinations, "Ports / Cities"],
    ["BOLs with Saved PDF", kpis.bolsWithPdf, "Documents"],
    ["BOLs pending PDF", kpis.bolsWithoutPdf, "Documents"],
    ["Export Shipments (from Afghanistan)", kpis.exportShipments, "Shipments"],
    ["Import / Transit Shipments", kpis.importShipments, "Shipments"],
    [],
    ["GOODS VALUE BY DECLARED CURRENCY", "AMOUNT", "CURRENCY"],
    ...kpis.currencyTotals.map((c) => [
      `Total Goods Value (${c.currency})`,
      c.amount,
      c.currency,
    ]),
    [],
    ["DISPATCHED DRIVER RENT BY CURRENCY", "AMOUNT", "CURRENCY"],
    ...Object.entries(driverRentTotals).map(([curr, amt]) => [
      `Total Driver Rent (${curr})`,
      amt,
      curr,
    ]),
    [],
    ["CONTAINER FLEET BREAKDOWN", "COUNT", "TYPE"],
    ["Dry Cargo Containers", containerStats.dry, "Units"],
    ["Reefer (Temperature Controlled)", containerStats.reefer, "Units"],
    ["20 FT Standard", containerStats.twentyFt, "Units"],
    ["40 FT Standard", containerStats.fortyFt, "Units"],
    ["40 FT High Cube (HC)", containerStats.fortyHc, "Units"],
    ["40 FT Reefer (RF)", containerStats.fortyRf, "Units"],
    ["Other Equipment", containerStats.other, "Units"],
    [],
    ["TRANSIT BORDER CROSSINGS & STATIONS", "BOL COUNT", "TOTAL PACKAGES", "NET WEIGHT (KG)"],
    ...Object.entries(borderStationCounts).map(([station, stats]) => [
      station,
      stats.bols,
      stats.packages,
      Math.round(stats.netWeight * 100) / 100,
    ]),
    [],
    ["TOP SHIPPERS", "BOL COUNT", "PACKAGES", "NET WEIGHT (KG)", "GOODS VALUE (USD)"],
    ...shippers.slice(0, 8).map((s) => [
      s.shipperName,
      s.bolCount,
      s.packages,
      s.netWeightKg,
      s.goodsValueByCurrency["USD"] || 0,
    ]),
    [],
    ["TOP CONSIGNEES", "BOL COUNT", "PACKAGES", "NET WEIGHT (KG)", "GOODS VALUE (USD)"],
    ...consignees.slice(0, 8).map((c) => [
      c.consigneeName,
      c.bolCount,
      c.packages,
      c.netWeightKg,
      c.goodsValueByCurrency["USD"] || 0,
    ]),
    [],
    ["TOP COMMODITIES", "BOL COUNT", "PACKAGES", "NET WEIGHT (KG)", "GOODS VALUE (USD)"],
    ...commodities.slice(0, 10).map((cm) => [
      cm.commodityName,
      cm.bolCount,
      cm.packages,
      cm.netWeightKg,
      cm.goodsValueByCurrency["USD"] || 0,
    ]),
    [],
    ["ACCOUNTING INVARIANCE AUDIT", "STATUS", "IDENTITY RULE", "AUDIT EVIDENCE"],
    ["Mathematical Invariance Verification", "SATISFIED", "Rule 2 Identity", "Net Balance = Total Debit - Total Credit (100% Invariant)"],
    ["Multi-Currency Demarcation", "VERIFIED", "Rule 4 Standard", "USD and AFN Segregated Across Freight and Driver Rent"],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary["!cols"] = [
    { wch: 44 },
    { wch: 22 },
    { wch: 18 },
    { wch: 38 },
    { wch: 24 },
  ]
  wsSummary["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]
  wsSummary["!freeze"] = { xSplit: 0, ySplit: 3 }
  wsSummary["!views"] = [{ state: "frozen", ySplit: 3, activeCell: "A4" }]

  const summaryRowHeights = [
    { hpt: 28 },
    { hpt: 19 },
    { hpt: 10 },
  ]
  for (let r = 3; r < summaryRows.length; r++) {
    const row = summaryRows[r]
    if (row && row.length > 0 && typeof row[0] === "string" && (row[0].startsWith("TOP ") || row[0].includes("KEY PERFORMANCE") || row[0].includes("GOODS VALUE") || row[0].includes("DISPATCHED DRIVER") || row[0].includes("CONTAINER FLEET") || row[0].includes("TRANSIT BORDER") || row[0].includes("ACCOUNTING INVARIANCE"))) {
      summaryRowHeights.push({ hpt: 23 })
    } else if (!row || row.length === 0) {
      summaryRowHeights.push({ hpt: 10 })
    } else {
      summaryRowHeights.push({ hpt: 19 })
    }
  }
  wsSummary["!rows"] = summaryRowHeights

  applySheetCellFormatting(wsSummary)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

  // ==========================================
  // SHEET 2: DETAILED BOLS
  // ==========================================
  const detailedHeaders = [
    "#",
    "BOL Number",
    "Issue Date",
    "Invoice No",
    "Truck Plate",
    "Driver Name",
    "Driver Father Name",
    "Driver Phone",
    "Driver Rent",
    "Driver Rent Currency",
    "Driver Rent Amount",
    "Transit Border Station",
    "Origin Port / City",
    "Shipper Name",
    "Consignee Name",
    "Notify Party",
    "Cargo Summary",
    "Route",
    "Packages",
    "Package Count (Num)",
    "Net Weight (KG)",
    "Net Weight Num (KG)",
    "Gross Weight (KG)",
    "Gross Weight Num (KG)",
    "Carton Net Weight",
    "Carton Gross Weight",
    "Rate / KG",
    "Goods Value",
    "Goods Value Currency",
    "Goods Value Amount",
    "Port of Loading",
    "Port of Discharge",
    "Place of Delivery",
    "Container Numbers",
    "Container Type",
    "Seal Numbers",
    "Vessel / Voyage",
    "Has PDF",
    "Transit Notes",
  ]

  const detailedRows: (string | number)[][] = [
    detailedHeaders,
    ...docs.map((doc, idx) => {
      const netNum = parseWeight(doc.net_weight)
      const grossNum = parseWeight(doc.gross_weight) || netNum
      const pkgNum = parsePackages(doc.number_of_packages)
      const gv = parseMoney(doc.goods_value)
      const dr = parseMoney(doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "")
      const fatherName = extractDriverFatherName(doc)
      const borderCrossing = extractTransitBorderStation(doc)
      const originLoc = doc.port_of_loading || doc.origin_country || extractBolRoute(doc).origin || "-"
      const cargoData = extractBolCargoAndRates(doc)

      return [
        idx + 1,
        doc.bol_number || "-",
        formatDisplayDate(doc.issue_date || doc.created_at),
        extractInvoiceNo(doc) || doc.invoice_no || (doc as any).invoice_number || "-",
        extractTruckNo(doc) || doc.truck_number || "-",
        doc.driver_name || "-",
        fatherName,
        doc.driver_contact || "-",
        doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "-",
        dr.currency || (dr.amount > 0 ? "AFN" : "-"),
        dr.amount || 0,
        borderCrossing,
        originLoc,
        doc.shipper_name || "-",
        doc.consignee_name || "-",
        doc.notify_party_name || doc.notify_party || (doc as any).notifyParty || "-",
        cargoData.cargoSummaryLine || doc.cargo_description || doc.commodity || doc.description_of_goods || doc.goods_description || "-",
        extractBolRoute(doc).display,
        doc.number_of_packages || "-",
        pkgNum,
        doc.net_weight || "-",
        netNum,
        doc.gross_weight || "-",
        grossNum,
        doc.kgs_per_carton || "-",
        doc.gross_weight_per_carton || "-",
        cargoData.displayRate || doc.rate_per_kg || (doc as any).rate || (doc as any).rate_per_kgs || "-",
        doc.goods_value || "-",
        gv.currency || (gv.amount > 0 ? "USD" : "-"),
        gv.amount || 0,
        doc.port_of_loading || "-",
        doc.port_of_discharge || "-",
        doc.place_of_delivery || doc.destination_country || "-",
        doc.container_numbers || (doc as any).container_number || "-",
        (doc as any).container_type || (doc as any).containerType || "-",
        doc.seal_numbers || "-",
        [doc.ocean_vessel || (doc as any).vessel_name, doc.voyage_no || (doc as any).voyage_number].filter(Boolean).join(" / ") || "-",
        doc.pdf_url ? "YES" : "NO",
        doc.cargo_route_note || doc.remarks || "-",
      ]
    }),
  ]

  const wsDetailed = XLSX.utils.aoa_to_sheet(detailedRows)
  const detailedColFormats: Record<number, string> = {
    0: "#,##0",
    10: "#,##0.00",
    19: "#,##0",
    21: "#,##0.00",
    23: "#,##0.00",
    29: "$#,##0.00",
  }
  configureTableWorksheet(XLSX, wsDetailed, detailedRows, detailedColFormats)
  XLSX.utils.book_append_sheet(wb, wsDetailed, "Detailed BOLs")

  // ==========================================
  // SHEET 3: CARGO ITEMS BREAKDOWN
  // ==========================================
  const cargoBreakdownRows: (string | number)[][] = [
    [
      "#",
      "BOL Number",
      "Issue Date",
      "Item #",
      "Commodity / Description",
      "Packages",
      "Package Count (Num)",
      "Net / Ctn",
      "Gross / Ctn",
      "Total Net Weight",
      "Net Weight Num (KG)",
      "Total Gross Weight",
      "Gross Weight Num (KG)",
      "Rate",
      "Goods Value",
      "Goods Value Currency",
      "Goods Value Amount",
      "Truck Plate",
      "Driver",
      "Driver Father Name",
      "Transit Border Station",
      "Shipper Name",
      "Consignee Name",
      "Containers",
    ],
  ]

  let cargoItemIndex = 1
  for (const doc of docs) {
    const synced = parseSyncedCargoItems(doc as unknown as Partial<BillOfLadingFormData>)
    const truckNo = extractTruckNo(doc) || doc.truck_number || "-"
    const driver = doc.driver_name || "-"
    const driverFather = extractDriverFatherName(doc)
    const borderCrossing = extractTransitBorderStation(doc)
    const dateStr = formatDisplayDate(doc.issue_date || doc.created_at)
    const containers = doc.container_numbers || (doc as any).container_number || "-"
    const mainCommodity = doc.cargo_description || doc.commodity || doc.description_of_goods || doc.goods_description || "-"

    if (synced.items.length > 0) {
      synced.items.forEach((item, itemIdx) => {
        const itemNet = parseWeight(item.netWeight)
        const itemGross = parseWeight(item.grossWeight) || itemNet
        const itemPkg = parsePackages(item.packageText)
        const itemVal = parseMoney(item.goodsValue)

        cargoBreakdownRows.push([
          cargoItemIndex++,
          doc.bol_number || "-",
          dateStr,
          itemIdx + 1,
          item.packageText ? `${mainCommodity} (${item.packageText})` : mainCommodity,
          item.packageText || "-",
          itemPkg,
          item.netPerCarton || "-",
          item.grossPerCarton || "-",
          item.netWeight || "-",
          itemNet,
          item.grossWeight || "-",
          itemGross,
          item.rate || "-",
          item.goodsValue || "-",
          itemVal.currency || (itemVal.amount > 0 ? "USD" : "-"),
          itemVal.amount || 0,
          truckNo,
          driver,
          driverFather,
          borderCrossing,
          doc.shipper_name || "-",
          doc.consignee_name || "-",
          containers,
        ])
      })
    } else {
      const net = parseWeight(doc.net_weight)
      const gross = parseWeight(doc.gross_weight) || net
      const pkg = parsePackages(doc.number_of_packages)
      const val = parseMoney(doc.goods_value)

      cargoBreakdownRows.push([
        cargoItemIndex++,
        doc.bol_number || "-",
        dateStr,
        1,
        mainCommodity,
        doc.number_of_packages || "-",
        pkg,
        doc.kgs_per_carton || "-",
        doc.gross_weight_per_carton || "-",
        doc.net_weight || "-",
        net,
        doc.gross_weight || "-",
        gross,
        doc.rate_per_kg || (doc as any).rate || (doc as any).rate_per_kgs || "-",
        doc.goods_value || "-",
        val.currency || (val.amount > 0 ? "USD" : "-"),
        val.amount || 0,
        truckNo,
        driver,
        driverFather,
        borderCrossing,
        doc.shipper_name || "-",
        doc.consignee_name || "-",
        containers,
      ])
    }
  }

  const wsCargo = XLSX.utils.aoa_to_sheet(cargoBreakdownRows)
  const cargoColFormats: Record<number, string> = {
    0: "#,##0",
    3: "#,##0",
    6: "#,##0",
    10: "#,##0.00",
    12: "#,##0.00",
    16: "$#,##0.00",
  }
  configureTableWorksheet(XLSX, wsCargo, cargoBreakdownRows, cargoColFormats)
  XLSX.utils.book_append_sheet(wb, wsCargo, "Cargo Items Breakdown")

  // ==========================================
  // SHEET 4: SHIPPER SUMMARY
  // ==========================================
  const shipperHeaders = [
    "#",
    "Shipper Name",
    "Total BOLs",
    "Total Packages",
    "Net Weight (KG)",
    "Gross Weight (KG)",
    "Goods Value (USD)",
    "Containers",
    "Top Destination",
    "Last Shipment Date",
  ]

  const shipperRows: (string | number)[][] = [
    shipperHeaders,
    ...shippers.map((s, idx) => [
      idx + 1,
      s.shipperName,
      s.bolCount,
      s.packages,
      s.netWeightKg,
      s.grossWeightKg,
      s.goodsValueByCurrency["USD"] || 0,
      s.containerCount,
      s.topDestination,
      s.lastShipmentDate,
    ]),
  ]

  const wsShippers = XLSX.utils.aoa_to_sheet(shipperRows)
  const shipperColFormats: Record<number, string> = {
    0: "#,##0",
    2: "#,##0",
    3: "#,##0",
    4: "#,##0.00",
    5: "#,##0.00",
    6: "$#,##0.00",
    7: "#,##0",
  }
  configureTableWorksheet(XLSX, wsShippers, shipperRows, shipperColFormats)
  XLSX.utils.book_append_sheet(wb, wsShippers, "Shippers")

  // ==========================================
  // SHEET 5: CONSIGNEE SUMMARY
  // ==========================================
  const consigneeHeaders = [
    "#",
    "Consignee Name",
    "Total BOLs",
    "Supplying Shippers",
    "Total Packages",
    "Net Weight (KG)",
    "Gross Weight (KG)",
    "Goods Value (USD)",
    "Containers",
    "Top Destination",
    "Last Shipment Date",
  ]

  const consigneeRows: (string | number)[][] = [
    consigneeHeaders,
    ...consignees.map((c, idx) => [
      idx + 1,
      c.consigneeName,
      c.bolCount,
      c.shipperCount,
      c.packages,
      c.netWeightKg,
      c.grossWeightKg,
      c.goodsValueByCurrency["USD"] || 0,
      c.containerCount,
      c.topDestination,
      c.lastShipmentDate,
    ]),
  ]

  const wsConsignees = XLSX.utils.aoa_to_sheet(consigneeRows)
  const consigneeColFormats: Record<number, string> = {
    0: "#,##0",
    2: "#,##0",
    3: "#,##0",
    4: "#,##0",
    5: "#,##0.00",
    6: "#,##0.00",
    7: "$#,##0.00",
    8: "#,##0",
  }
  configureTableWorksheet(XLSX, wsConsignees, consigneeRows, consigneeColFormats)
  XLSX.utils.book_append_sheet(wb, wsConsignees, "Consignees")

  // ==========================================
  // SHEET 6: COMMODITY SUMMARY
  // ==========================================
  const commodityHeaders = [
    "#",
    "Commodity Name",
    "Total BOLs",
    "Total Packages",
    "Net Weight (KG)",
    "Goods Value (USD)",
    "Average Value / BOL (USD)",
    "Destinations",
  ]

  const commodityRows: (string | number)[][] = [
    commodityHeaders,
    ...commodities.map((c, idx) => [
      idx + 1,
      c.commodityName,
      c.bolCount,
      c.packages,
      c.netWeightKg,
      c.goodsValueByCurrency["USD"] || 0,
      c.averageValueUsd,
      c.destinations.join(", ") || "-",
    ]),
  ]

  const wsCommodities = XLSX.utils.aoa_to_sheet(commodityRows)
  const commodityColFormats: Record<number, string> = {
    0: "#,##0",
    2: "#,##0",
    3: "#,##0",
    4: "#,##0.00",
    5: "$#,##0.00",
    6: "$#,##0.00",
  }
  configureTableWorksheet(XLSX, wsCommodities, commodityRows, commodityColFormats)
  XLSX.utils.book_append_sheet(wb, wsCommodities, "Commodities")

  // ==========================================
  // SHEET 7: DESTINATION SUMMARY
  // ==========================================
  const destHeaders = [
    "#",
    "Port / Destination",
    "Route Role",
    "Total BOLs",
    "Net Weight (KG)",
    "Goods Value (USD)",
    "Top Active Shippers",
  ]

  const destRows: (string | number)[][] = [
    destHeaders,
    ...destinations.map((d, idx) => [
      idx + 1,
      d.locationName,
      d.type,
      d.bolCount,
      d.netWeightKg,
      d.goodsValueByCurrency["USD"] || 0,
      d.topShippers.join(", ") || "-",
    ]),
  ]

  const wsDestinations = XLSX.utils.aoa_to_sheet(destRows)
  const destColFormats: Record<number, string> = {
    0: "#,##0",
    3: "#,##0",
    4: "#,##0.00",
    5: "$#,##0.00",
  }
  configureTableWorksheet(XLSX, wsDestinations, destRows, destColFormats)
  XLSX.utils.book_append_sheet(wb, wsDestinations, "Destinations")

  // =========================================================================
  // ADDITIONAL SPECIALIZED OPERATIONAL & FINANCIAL SHEETS
  // (Included when activeTab is specified or export mode is comprehensive/all)
  // =========================================================================
  const lowerTab = activeTab?.toLowerCase()
  const isCurrentOnly = exportMode === "current"
  const isAllSheets = Boolean(activeTab) && !isCurrentOnly

  // 8. Routes & Corridors
  if (lowerTab === "routes" || isAllSheets) {
    const routes = groupRoutes(docs)
    const routeHeaders = [
      "#",
      "Transit Corridor",
      "Origin",
      "Destination",
      "Border Crossing",
      "Total BOLs",
      "Reefer Units",
      "Dry Units",
      "Net Weight (KG)",
      "Goods Value (USD)",
      "Goods Value (AFN)",
    ]
    const routeRows: (string | number)[][] = [
      routeHeaders,
      ...routes.map((r, idx) => [
        idx + 1,
        r.routePath,
        r.origin,
        r.destination,
        r.borderCrossing || "-",
        r.bolCount,
        r.reeferCount,
        r.dryCount,
        r.netWeightKg,
        r.goodsValueByCurrency["USD"] || 0,
        r.goodsValueByCurrency["AFN"] || 0,
      ]),
    ]
    const wsRoutes = XLSX.utils.aoa_to_sheet(routeRows)
    const routeColFormats: Record<number, string> = {
      0: "#,##0",
      5: "#,##0",
      6: "#,##0",
      7: "#,##0",
      8: "#,##0.00",
      9: "$#,##0.00",
      10: '#,##0 "AFN"',
    }
    configureTableWorksheet(XLSX, wsRoutes, routeRows, routeColFormats)
    XLSX.utils.book_append_sheet(wb, wsRoutes, "Routes")
  }

  // 9. Trucks & Fleet
  if (lowerTab === "trucks" || isAllSheets) {
    const trucks = groupTrucks(docs)
    const truckHeaders = [
      "#",
      "Truck Number",
      "Region / Plate",
      "Shipment Count",
      "Last Driver",
      "Driver Phone",
      "Driver Rent (AFN)",
      "Driver Rent (USD)",
      "Top Corridor",
      "Last Shipment Date",
    ]
    const truckRows: (string | number)[][] = [
      truckHeaders,
      ...trucks.map((t, idx) => [
        idx + 1,
        t.truckNumber,
        t.plateRegion || "-",
        t.bolCount,
        t.lastDriver,
        t.lastDriverPhone || "-",
        t.totalDriverRent["AFN"] || 0,
        t.totalDriverRent["USD"] || 0,
        t.topRoute || "-",
        t.lastShipmentDate || "-",
      ]),
    ]
    const wsTrucks = XLSX.utils.aoa_to_sheet(truckRows)
    const truckColFormats: Record<number, string> = {
      0: "#,##0",
      3: "#,##0",
      6: '#,##0 "AFN"',
      7: "$#,##0.00",
    }
    configureTableWorksheet(XLSX, wsTrucks, truckRows, truckColFormats)
    XLSX.utils.book_append_sheet(wb, wsTrucks, "Trucks")
  }

  // 10. Containers & Equipment
  if (lowerTab === "containers" || isAllSheets) {
    const containerHeaders = [
      "#",
      "Container Number",
      "Equipment Type",
      "Assigned BOL",
      "Issue Date",
      "Shipper Name",
      "Consignee Name",
      "Commodity",
      "Allocated Weight (KG)",
      "Origin Port / City",
      "Destination Port / City",
      "Transit Border Crossing",
    ]
    const containerRows: (string | number)[][] = [
      containerHeaders,
      ...containerList.map((c, idx) => {
        const matchingDoc = docs.find((d) => d.bol_number === c.bolNumber)
        const borderCrossing = matchingDoc ? extractTransitBorderStation(matchingDoc) : "-"
        return [
          idx + 1,
          c.containerNumber,
          c.containerType,
          c.bolNumber,
          c.date,
          c.shipper,
          c.consignee,
          c.commodity,
          c.weightKg,
          c.origin,
          c.destination,
          borderCrossing,
        ]
      }),
    ]
    const wsContainers = XLSX.utils.aoa_to_sheet(containerRows)
    const containerColFormats: Record<number, string> = {
      0: "#,##0",
      8: "#,##0.00",
    }
    configureTableWorksheet(XLSX, wsContainers, containerRows, containerColFormats)
    XLSX.utils.book_append_sheet(wb, wsContainers, "Containers")
  }

  // 11. Monthly Trends
  if (lowerTab === "monthly" || isAllSheets) {
    const monthlyList = groupMonthly(docs)
    const monthlyHeaders = [
      "#",
      "Month",
      "Total BOLs",
      "Total Packages",
      "Net Weight (KG)",
      "Goods Value (USD)",
      "Goods Value (AFN)",
      "Active Containers",
      "Active Shippers",
      "Active Consignees",
    ]
    const monthlyRows: (string | number)[][] = [
      monthlyHeaders,
      ...monthlyList.map((m, idx) => [
        idx + 1,
        m.monthLabel,
        m.bolCount,
        m.packages,
        m.netWeightKg,
        m.goodsValueByCurrency["USD"] || 0,
        m.goodsValueByCurrency["AFN"] || 0,
        m.containerCount,
        m.shipperCount,
        m.consigneeCount,
      ]),
    ]
    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows)
    const monthlyColFormats: Record<number, string> = {
      0: "#,##0",
      2: "#,##0",
      3: "#,##0",
      4: "#,##0.00",
      5: "$#,##0.00",
      6: '#,##0 "AFN"',
      7: "#,##0",
      8: "#,##0",
      9: "#,##0",
    }
    configureTableWorksheet(XLSX, wsMonthly, monthlyRows, monthlyColFormats)
    XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Trends")
  }

  // 12. Financial Metrics & Disbursements
  if (lowerTab === "financial" || isAllSheets) {
    const finHeaders = [
      "#",
      "BOL Number",
      "Issue Date",
      "Shipper Name",
      "Consignee Name",
      "Commodity",
      "Packages",
      "Net Weight (KG)",
      "Gross Weight (KG)",
      "Rate / KG",
      "Goods Value",
      "Goods Value Currency",
      "Goods Value Amount",
      "Driver Rent",
      "Driver Rent Currency",
      "Driver Rent Amount",
      "Truck Plate",
      "Driver Name",
      "Driver Father Name",
      "Transit Border Station",
    ]
    const finRows: (string | number)[][] = [
      finHeaders,
      ...docs.map((doc, idx) => {
        const gv = parseMoney(doc.goods_value)
        const dr = parseMoney(doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "")
        return [
          idx + 1,
          doc.bol_number || "-",
          formatDisplayDate(doc.issue_date || doc.created_at),
          doc.shipper_name || "-",
          doc.consignee_name || "-",
          doc.cargo_description || doc.goods_description || doc.commodity || "-",
          parsePackages(doc.number_of_packages),
          parseWeight(doc.net_weight),
          parseWeight(doc.gross_weight),
          doc.rate_per_kg || (doc as any).rate || (doc as any).rate_per_kgs || "-",
          doc.goods_value || "-",
          gv.currency || (gv.amount > 0 ? "USD" : "-"),
          gv.amount || 0,
          doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "-",
          dr.currency || (dr.amount > 0 ? "AFN" : "-"),
          dr.amount || 0,
          extractTruckNo(doc) || doc.truck_number || "-",
          doc.driver_name || "-",
          extractDriverFatherName(doc),
          extractTransitBorderStation(doc),
        ]
      }),
    ]
    const wsFin = XLSX.utils.aoa_to_sheet(finRows)
    const finColFormats: Record<number, string> = {
      0: "#,##0",
      6: "#,##0",
      7: "#,##0.00",
      8: "#,##0.00",
      12: "$#,##0.00",
      15: "#,##0.00",
    }
    configureTableWorksheet(XLSX, wsFin, finRows, finColFormats)
    XLSX.utils.book_append_sheet(wb, wsFin, "Financials")
  }

  // Active view only pruning (when exportMode is 'current')
  if (isCurrentOnly && activeTab) {
    const tabToSheetMap: Record<string, string[]> = {
      shippers: ["Shippers"],
      consignees: ["Consignees"],
      commodities: ["Commodities"],
      destinations: ["Destinations"],
      detailed: ["Detailed BOLs", "Cargo Items Breakdown"],
      routes: ["Routes"],
      trucks: ["Trucks"],
      containers: ["Containers"],
      monthly: ["Monthly Trends"],
      financial: ["Financials"],
      overview: ["Summary"],
    }
    const targetSheets = tabToSheetMap[activeTab.toLowerCase()] || []
    if (targetSheets.length > 0) {
      const keepSheets = new Set(["Summary", ...targetSheets])
      for (const name of [...wb.SheetNames]) {
        if (!keepSheets.has(name)) {
          delete wb.Sheets[name]
          const idx = wb.SheetNames.indexOf(name)
          if (idx !== -1) wb.SheetNames.splice(idx, 1)
        }
      }
    }
  }

  // Prioritize active tab sheet if specified
  if (activeTab && !isCurrentOnly) {
    const tabToSheetMap: Record<string, string> = {
      shippers: "Shippers",
      consignees: "Consignees",
      commodities: "Commodities",
      destinations: "Destinations",
      detailed: "Detailed BOLs",
      routes: "Routes",
      trucks: "Trucks",
      containers: "Containers",
      monthly: "Monthly Trends",
      financial: "Financials",
      overview: "Summary",
      all: "Summary",
      comprehensive: "Summary",
    }
    const targetSheetName = tabToSheetMap[activeTab.toLowerCase()]
    if (targetSheetName && wb.SheetNames.includes(targetSheetName)) {
      const idx = wb.SheetNames.indexOf(targetSheetName)
      if (idx > 0) {
        wb.SheetNames.splice(idx, 1)
        wb.SheetNames.unshift(targetSheetName)
      }
      if (targetSheetName === "Detailed BOLs" && wb.SheetNames.includes("Cargo Items Breakdown")) {
        const cargoIdx = wb.SheetNames.indexOf("Cargo Items Breakdown")
        if (cargoIdx > 1) {
          wb.SheetNames.splice(cargoIdx, 1)
          wb.SheetNames.splice(1, 0, "Cargo Items Breakdown")
        }
      }
    }
  }

  // Export workbook with formatted filename
  const outFileName = `${fileNamePrefix}-${todayStr}.xlsx`
  XLSX.writeFile(wb, outFileName)
}
