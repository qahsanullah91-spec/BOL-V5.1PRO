/**
 * Sky Ariana Logistics — Professional Multi-Sheet Excel (.xlsx) Export Engine
 */

import * as XLSX from "xlsx"
import { SavedDocument } from "./types"
import { calculateOverviewKpis } from "./calculations"
import {
  groupShippers,
  groupConsignees,
  groupCommodities,
  groupDestinations,
  groupContainers,
} from "./grouping"
import { formatDisplayDate } from "./parsers"

/**
 * Calculates optimal column widths based on maximum string lengths in rows.
 */
function autoFitColumns(rows: (string | number | undefined | null)[][]): { wch: number }[] {
  const colWidths: number[] = []

  for (const row of rows) {
    row.forEach((val, colIdx) => {
      const len = val !== null && val !== undefined ? String(val).length : 0
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3)
    })
  }

  // Cap at reasonable maximums
  return colWidths.map((w) => ({ wch: Math.min(Math.max(w, 12), 45) }))
}

/**
 * Generates and downloads a complete 6-Sheet Excel Workbook for the filtered BOL data.
 */
export function exportReportToExcel(
  docs: SavedDocument[],
  fileNamePrefix: string = "Sky-Ariana-Operations-Report"
): void {
  const kpis = calculateOverviewKpis(docs)
  const shippers = groupShippers(docs)
  const consignees = groupConsignees(docs)
  const commodities = groupCommodities(docs)
  const destinations = groupDestinations(docs)
  const { stats: containerStats } = groupContainers(docs)

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
    ["CONTAINER FLEET BREAKDOWN", "COUNT", "TYPE"],
    ["Dry Cargo Containers", containerStats.dry, "Units"],
    ["Reefer (Temperature Controlled)", containerStats.reefer, "Units"],
    ["20 FT Standard", containerStats.twentyFt, "Units"],
    ["40 FT Standard", containerStats.fortyFt, "Units"],
    ["40 FT High Cube (HC)", containerStats.fortyHc, "Units"],
    ["40 FT Reefer (RF)", containerStats.fortyRf, "Units"],
    ["Other Equipment", containerStats.other, "Units"],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary["!cols"] = autoFitColumns(summaryRows)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

  // ==========================================
  // SHEET 2: DETAILED BOLS
  // ==========================================
  const detailedHeaders = [
    "#",
    "BOL Number",
    "Issue Date",
    "Invoice No",
    "Shipper Name",
    "Consignee Name",
    "Packages",
    "Net Weight (KG)",
    "Gross Weight (KG)",
    "Goods Value",
    "Port of Loading",
    "Port of Discharge",
    "Place of Delivery",
    "Container Numbers",
    "Truck Plate",
    "Has PDF",
  ]

  const detailedRows: (string | number)[][] = [
    detailedHeaders,
    ...docs.map((doc, idx) => [
      idx + 1,
      doc.bol_number || "-",
      formatDisplayDate(doc.issue_date || doc.created_at),
      doc.invoice_no || doc.invoice_number || "-",
      doc.shipper_name || "-",
      doc.consignee_name || "-",
      doc.number_of_packages || "-",
      doc.net_weight || "-",
      doc.gross_weight || "-",
      doc.goods_value || "-",
      doc.port_of_loading || "-",
      doc.port_of_discharge || "-",
      doc.place_of_delivery || "-",
      doc.container_numbers || "-",
      doc.truck_number || "-",
      doc.pdf_url ? "YES" : "NO",
    ]),
  ]

  const wsDetailed = XLSX.utils.aoa_to_sheet(detailedRows)
  wsDetailed["!cols"] = autoFitColumns(detailedRows)
  wsDetailed["!freeze"] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsDetailed, "Detailed BOLs")

  // ==========================================
  // SHEET 3: SHIPPER SUMMARY
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
  wsShippers["!cols"] = autoFitColumns(shipperRows)
  wsShippers["!freeze"] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsShippers, "Shippers")

  // ==========================================
  // SHEET 4: CONSIGNEE SUMMARY
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
  wsConsignees["!cols"] = autoFitColumns(consigneeRows)
  wsConsignees["!freeze"] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsConsignees, "Consignees")

  // ==========================================
  // SHEET 5: COMMODITY SUMMARY
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
  wsCommodities["!cols"] = autoFitColumns(commodityRows)
  wsCommodities["!freeze"] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsCommodities, "Commodities")

  // ==========================================
  // SHEET 6: DESTINATION SUMMARY
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
  wsDestinations["!cols"] = autoFitColumns(destRows)
  wsDestinations["!freeze"] = { xSplit: 0, ySplit: 1 }
  XLSX.utils.book_append_sheet(wb, wsDestinations, "Destinations")

  // Export workbook
  const outFileName = `${fileNamePrefix}-${todayStr}.xlsx`
  XLSX.writeFile(wb, outFileName)
}
