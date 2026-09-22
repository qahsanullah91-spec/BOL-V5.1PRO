/**
 * Sky Ariana Logistics — Report Center Grouping & Analytics Engine
 */

import {
  SavedDocument,
  ShipperSummary,
  ConsigneeSummary,
  CommoditySummary,
  DestinationSummary,
  ContainerRecord,
  ContainerSummaryStats,
  MonthlySummary,
  FinancialBreakdown,
} from "./types"
import {
  parseWeight,
  parsePackages,
  parseMoney,
  normalizeDate,
  formatDisplayDate,
  extractCleanCommodity,
} from "./parsers"

/**
 * Groups BOL records by Shipper.
 */
export function groupShippers(docs: SavedDocument[]): ShipperSummary[] {
  const map = new Map<
    string,
    {
      shipperName: string
      bolCount: number
      packages: number
      netWeightKg: number
      grossWeightKg: number
      goodsValueByCurrency: Record<string, number>
      containers: Set<string>
      destinations: Map<string, number>
      lastDateMs: number
      lastDateStr: string
    }
  >()

  for (const doc of docs) {
    const name = (doc.shipper_name || "").trim() || "Unspecified Shipper"
    const key = name.toLowerCase()

    if (!map.has(key)) {
      map.set(key, {
        shipperName: name,
        bolCount: 0,
        packages: 0,
        netWeightKg: 0,
        grossWeightKg: 0,
        goodsValueByCurrency: {},
        containers: new Set(),
        destinations: new Map(),
        lastDateMs: 0,
        lastDateStr: "-",
      })
    }

    const entry = map.get(key)!
    entry.bolCount++
    entry.packages += parsePackages(doc.number_of_packages)
    const net = parseWeight(doc.net_weight)
    entry.netWeightKg += net
    const gross = parseWeight(doc.gross_weight)
    entry.grossWeightKg += gross > 0 ? gross : net

    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount > 0) {
      entry.goodsValueByCurrency[currency] = (entry.goodsValueByCurrency[currency] || 0) + amount
    }

    if (doc.container_numbers) {
      const cList = doc.container_numbers.split(/[\n,;/]+/).map((c) => c.trim()).filter(Boolean)
      cList.forEach((c) => entry.containers.add(c.toUpperCase()))
    }

    const dest = (doc.port_of_discharge || doc.place_of_delivery || doc.destination_country || "").trim()
    if (dest) {
      entry.destinations.set(dest, (entry.destinations.get(dest) || 0) + 1)
    }

    const d = normalizeDate(doc.issue_date || doc.created_at)
    if (d && d.getTime() > entry.lastDateMs) {
      entry.lastDateMs = d.getTime()
      entry.lastDateStr = formatDisplayDate(d)
    }
  }

  return Array.from(map.values())
    .map((e) => {
      let topDest = "-"
      let maxCount = 0
      for (const [dest, count] of e.destinations.entries()) {
        if (count > maxCount) {
          maxCount = count
          topDest = dest
        }
      }

      return {
        shipperName: e.shipperName,
        bolCount: e.bolCount,
        packages: e.packages,
        netWeightKg: Math.round(e.netWeightKg * 100) / 100,
        grossWeightKg: Math.round(e.grossWeightKg * 100) / 100,
        goodsValueByCurrency: e.goodsValueByCurrency,
        containerCount: e.containers.size,
        topDestination: topDest,
        lastShipmentDate: e.lastDateStr,
      }
    })
    .sort((a, b) => b.bolCount - a.bolCount || b.netWeightKg - a.netWeightKg)
}

/**
 * Groups BOL records by Consignee.
 */
export function groupConsignees(docs: SavedDocument[]): ConsigneeSummary[] {
  const map = new Map<
    string,
    {
      consigneeName: string
      bolCount: number
      shippers: Set<string>
      packages: number
      netWeightKg: number
      grossWeightKg: number
      goodsValueByCurrency: Record<string, number>
      containers: Set<string>
      destinations: Map<string, number>
      lastDateMs: number
      lastDateStr: string
    }
  >()

  for (const doc of docs) {
    const name = (doc.consignee_name || "").trim() || "Unspecified Consignee"
    const key = name.toLowerCase()

    if (!map.has(key)) {
      map.set(key, {
        consigneeName: name,
        bolCount: 0,
        shippers: new Set(),
        packages: 0,
        netWeightKg: 0,
        grossWeightKg: 0,
        goodsValueByCurrency: {},
        containers: new Set(),
        destinations: new Map(),
        lastDateMs: 0,
        lastDateStr: "-",
      })
    }

    const entry = map.get(key)!
    entry.bolCount++
    if (doc.shipper_name) entry.shippers.add(doc.shipper_name.trim())

    entry.packages += parsePackages(doc.number_of_packages)
    const net = parseWeight(doc.net_weight)
    entry.netWeightKg += net
    const gross = parseWeight(doc.gross_weight)
    entry.grossWeightKg += gross > 0 ? gross : net

    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount > 0) {
      entry.goodsValueByCurrency[currency] = (entry.goodsValueByCurrency[currency] || 0) + amount
    }

    if (doc.container_numbers) {
      const cList = doc.container_numbers.split(/[\n,;/]+/).map((c) => c.trim()).filter(Boolean)
      cList.forEach((c) => entry.containers.add(c.toUpperCase()))
    }

    const dest = (doc.port_of_discharge || doc.place_of_delivery || doc.destination_country || "").trim()
    if (dest) {
      entry.destinations.set(dest, (entry.destinations.get(dest) || 0) + 1)
    }

    const d = normalizeDate(doc.issue_date || doc.created_at)
    if (d && d.getTime() > entry.lastDateMs) {
      entry.lastDateMs = d.getTime()
      entry.lastDateStr = formatDisplayDate(d)
    }
  }

  return Array.from(map.values())
    .map((e) => {
      let topDest = "-"
      let maxCount = 0
      for (const [dest, count] of e.destinations.entries()) {
        if (count > maxCount) {
          maxCount = count
          topDest = dest
        }
      }

      return {
        consigneeName: e.consigneeName,
        bolCount: e.bolCount,
        shipperCount: e.shippers.size,
        packages: e.packages,
        netWeightKg: Math.round(e.netWeightKg * 100) / 100,
        grossWeightKg: Math.round(e.grossWeightKg * 100) / 100,
        goodsValueByCurrency: e.goodsValueByCurrency,
        containerCount: e.containers.size,
        topDestination: topDest,
        lastShipmentDate: e.lastDateStr,
      }
    })
    .sort((a, b) => b.bolCount - a.bolCount || b.netWeightKg - a.netWeightKg)
}

/**
 * Groups BOL records by Commodity.
 */
export function groupCommodities(docs: SavedDocument[]): CommoditySummary[] {
  const map = new Map<
    string,
    {
      commodityName: string
      bolCount: number
      packages: number
      netWeightKg: number
      goodsValueByCurrency: Record<string, number>
      destinations: Set<string>
    }
  >()

  for (const doc of docs) {
    const rawDesc = doc.cargo_description || doc.goods_description || doc.description_of_goods || ""
    const commodity = extractCleanCommodity(rawDesc)
    const key = commodity.toLowerCase()

    if (!map.has(key)) {
      map.set(key, {
        commodityName: commodity,
        bolCount: 0,
        packages: 0,
        netWeightKg: 0,
        goodsValueByCurrency: {},
        destinations: new Set(),
      })
    }

    const entry = map.get(key)!
    entry.bolCount++
    entry.packages += parsePackages(doc.number_of_packages)
    entry.netWeightKg += parseWeight(doc.net_weight)

    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount > 0) {
      entry.goodsValueByCurrency[currency] = (entry.goodsValueByCurrency[currency] || 0) + amount
    }

    const dest = doc.port_of_discharge || doc.place_of_delivery || doc.destination_country
    if (dest && dest.trim()) entry.destinations.add(dest.trim())
  }

  return Array.from(map.values())
    .map((e) => {
      const usdVal = e.goodsValueByCurrency["USD"] || 0
      const averageValueUsd = e.bolCount > 0 ? Math.round((usdVal / e.bolCount) * 100) / 100 : 0

      return {
        commodityName: e.commodityName,
        bolCount: e.bolCount,
        packages: e.packages,
        netWeightKg: Math.round(e.netWeightKg * 100) / 100,
        goodsValueByCurrency: e.goodsValueByCurrency,
        averageValueUsd,
        destinations: Array.from(e.destinations),
      }
    })
    .sort((a, b) => b.bolCount - a.bolCount || b.netWeightKg - a.netWeightKg)
}

/**
 * Groups BOL records by Port of Loading, Port of Discharge, and Final Destination.
 */
export function groupDestinations(docs: SavedDocument[]): DestinationSummary[] {
  const map = new Map<
    string,
    {
      locationName: string
      type: "POL" | "POD" | "Final Destination"
      bolCount: number
      netWeightKg: number
      goodsValueByCurrency: Record<string, number>
      shippers: Map<string, number>
    }
  >()

  function addLocation(name: string, type: "POL" | "POD" | "Final Destination", doc: SavedDocument) {
    if (!name || !name.trim()) return
    const cleanName = name.trim()
    const key = `${type}::${cleanName.toLowerCase()}`

    if (!map.has(key)) {
      map.set(key, {
        locationName: cleanName,
        type,
        bolCount: 0,
        netWeightKg: 0,
        goodsValueByCurrency: {},
        shippers: new Map(),
      })
    }

    const entry = map.get(key)!
    entry.bolCount++
    entry.netWeightKg += parseWeight(doc.net_weight)

    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount > 0) {
      entry.goodsValueByCurrency[currency] = (entry.goodsValueByCurrency[currency] || 0) + amount
    }

    if (doc.shipper_name && doc.shipper_name.trim()) {
      const s = doc.shipper_name.trim()
      entry.shippers.set(s, (entry.shippers.get(s) || 0) + 1)
    }
  }

  for (const doc of docs) {
    if (doc.port_of_loading) addLocation(doc.port_of_loading, "POL", doc)
    if (doc.port_of_discharge) addLocation(doc.port_of_discharge, "POD", doc)
    if (doc.place_of_delivery && doc.place_of_delivery !== doc.port_of_discharge) {
      addLocation(doc.place_of_delivery, "Final Destination", doc)
    }
  }

  return Array.from(map.values())
    .map((e) => {
      const topShippers = Array.from(e.shippers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name)

      return {
        locationName: e.locationName,
        type: e.type,
        bolCount: e.bolCount,
        netWeightKg: Math.round(e.netWeightKg * 100) / 100,
        goodsValueByCurrency: e.goodsValueByCurrency,
        topShippers,
      }
    })
    .sort((a, b) => b.bolCount - a.bolCount || b.netWeightKg - a.netWeightKg)
}

/**
 * Extracts individual containers and categorizes their types.
 */
export function groupContainers(docs: SavedDocument[]): {
  containers: ContainerRecord[]
  stats: ContainerSummaryStats
} {
  const containerList: ContainerRecord[] = []
  const stats: ContainerSummaryStats = {
    total: 0,
    dry: 0,
    reefer: 0,
    twentyFt: 0,
    fortyFt: 0,
    fortyHc: 0,
    fortyRf: 0,
    other: 0,
  }

  for (const doc of docs) {
    const raw = doc.container_numbers || ""
    if (!raw.trim()) continue

    const tokens = raw
      .split(/[\n,;/]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length >= 4)

    const commodity = extractCleanCommodity(doc.cargo_description || doc.goods_description)
    const weight = parseWeight(doc.net_weight)
    const dateStr = formatDisplayDate(doc.issue_date || doc.created_at)

    for (const cNum of tokens) {
      // Determine container type
      let type: ContainerRecord["containerType"] = "Other"
      const upperDesc = (
        (doc.cargo_description || "") +
        " " +
        (doc.goods_description || "") +
        " " +
        cNum
      ).toUpperCase()

      if (cNum.includes("40RF") || upperDesc.includes("40RF") || (upperDesc.includes("40") && upperDesc.includes("REEFER"))) {
        type = "40 RF"
        stats.fortyRf++
        stats.reefer++
      } else if (cNum.includes("40HC") || upperDesc.includes("40HC") || upperDesc.includes("HIGH CUBE")) {
        type = "40 HC"
        stats.fortyHc++
        stats.dry++
      } else if (cNum.includes("40") || upperDesc.includes("40 FT") || upperDesc.includes("40FT")) {
        type = "40 FT"
        stats.fortyFt++
        stats.dry++
      } else if (cNum.includes("20") || upperDesc.includes("20 FT") || upperDesc.includes("20FT")) {
        type = "20 FT"
        stats.twentyFt++
        stats.dry++
      } else if (upperDesc.includes("REEFER") || upperDesc.includes("REEF")) {
        type = "Reefer"
        stats.reefer++
      } else {
        type = "Dry"
        stats.dry++
      }

      stats.total++
      const cleanContainerNumber = cNum.replace(/\s*\(.*?\)/g, "").trim()

      containerList.push({
        containerNumber: cleanContainerNumber || cNum,
        containerType: type,
        bolNumber: doc.bol_number || "-",
        shipper: doc.shipper_name || "-",
        consignee: doc.consignee_name || "-",
        commodity,
        weightKg: Math.round((weight / (tokens.length || 1)) * 100) / 100,
        origin: doc.port_of_loading || doc.origin_country || "-",
        destination: doc.port_of_discharge || doc.place_of_delivery || "-",
        date: dateStr,
      })
    }
  }

  return { containers: containerList, stats }
}

/**
 * Groups BOL records by Month chronologically.
 */
export function groupMonthly(
  docs: SavedDocument[],
  yearFilter?: number | "all"
): MonthlySummary[] {
  const map = new Map<
    string,
    {
      monthKey: string
      monthLabel: string
      dateMs: number
      bolCount: number
      packages: number
      netWeightKg: number
      goodsValueByCurrency: Record<string, number>
      containers: Set<string>
      shippers: Set<string>
      consignees: Set<string>
    }
  >()

  for (const doc of docs) {
    const d = normalizeDate(doc.issue_date || doc.created_at)
    if (!d) continue

    const year = d.getFullYear()
    if (yearFilter && yearFilter !== "all" && year !== yearFilter) {
      continue
    }

    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" })

    if (!map.has(monthKey)) {
      map.set(monthKey, {
        monthKey,
        monthLabel,
        dateMs: new Date(year, d.getMonth(), 1).getTime(),
        bolCount: 0,
        packages: 0,
        netWeightKg: 0,
        goodsValueByCurrency: {},
        containers: new Set(),
        shippers: new Set(),
        consignees: new Set(),
      })
    }

    const entry = map.get(monthKey)!
    entry.bolCount++
    entry.packages += parsePackages(doc.number_of_packages)
    entry.netWeightKg += parseWeight(doc.net_weight)

    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount > 0) {
      entry.goodsValueByCurrency[currency] = (entry.goodsValueByCurrency[currency] || 0) + amount
    }

    if (doc.container_numbers) {
      doc.container_numbers
        .split(/[\n,;/]+/)
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => entry.containers.add(c.toUpperCase()))
    }

    if (doc.shipper_name) entry.shippers.add(doc.shipper_name.trim())
    if (doc.consignee_name) entry.consignees.add(doc.consignee_name.trim())
  }

  return Array.from(map.values())
    .sort((a, b) => a.dateMs - b.dateMs)
    .map((e) => ({
      monthKey: e.monthKey,
      monthLabel: e.monthLabel,
      bolCount: e.bolCount,
      packages: e.packages,
      netWeightKg: Math.round(e.netWeightKg * 100) / 100,
      goodsValueByCurrency: e.goodsValueByCurrency,
      containerCount: e.containers.size,
      shipperCount: e.shippers.size,
      consigneeCount: e.consignees.size,
    }))
}

/**
 * Computes deep financial analytics strictly segregated by currency.
 */
export function calculateFinancialMetrics(docs: SavedDocument[]): FinancialBreakdown {
  const currencyTotals: Record<string, number> = {}
  const currencyCounts: Record<string, number> = {}

  let highest: { amount: number; currency: string; bolNumber: string; shipper: string } | null = null
  let lowest: { amount: number; currency: string; bolNumber: string; shipper: string } | null = null

  const shipperMap = new Map<string, { currencyTotals: Record<string, number>; bolCount: number }>()
  const commodityMap = new Map<string, { currencyTotals: Record<string, number>; bolCount: number }>()
  const destinationMap = new Map<string, { currencyTotals: Record<string, number>; bolCount: number }>()
  const monthMap = new Map<string, { monthLabel: string; dateMs: number; currencyTotals: Record<string, number> }>()

  for (const doc of docs) {
    const { amount, currency } = parseMoney(doc.goods_value)
    if (amount <= 0) continue

    currencyTotals[currency] = (currencyTotals[currency] || 0) + amount
    currencyCounts[currency] = (currencyCounts[currency] || 0) + 1

    const bolNumber = doc.bol_number || "-"
    const shipper = doc.shipper_name || "-"

    if (!highest || amount > highest.amount) {
      highest = { amount, currency, bolNumber, shipper }
    }
    if (!lowest || amount < lowest.amount) {
      lowest = { amount, currency, bolNumber, shipper }
    }

    // Shipper
    const sName = doc.shipper_name?.trim() || "Unspecified"
    if (!shipperMap.has(sName)) shipperMap.set(sName, { currencyTotals: {}, bolCount: 0 })
    const sEntry = shipperMap.get(sName)!
    sEntry.bolCount++
    sEntry.currencyTotals[currency] = (sEntry.currencyTotals[currency] || 0) + amount

    // Commodity
    const comm = extractCleanCommodity(doc.cargo_description || doc.goods_description)
    if (!commodityMap.has(comm)) commodityMap.set(comm, { currencyTotals: {}, bolCount: 0 })
    const cEntry = commodityMap.get(comm)!
    cEntry.bolCount++
    cEntry.currencyTotals[currency] = (cEntry.currencyTotals[currency] || 0) + amount

    // Destination
    const dest = doc.port_of_discharge?.trim() || doc.place_of_delivery?.trim() || "Unspecified"
    if (!destinationMap.has(dest)) destinationMap.set(dest, { currencyTotals: {}, bolCount: 0 })
    const dEntry = destinationMap.get(dest)!
    dEntry.bolCount++
    dEntry.currencyTotals[currency] = (dEntry.currencyTotals[currency] || 0) + amount

    // Month
    const d = normalizeDate(doc.issue_date || doc.created_at)
    if (d) {
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const mLabel = d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, {
          monthLabel: mLabel,
          dateMs: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
          currencyTotals: {},
        })
      }
      const mEntry = monthMap.get(mKey)!
      mEntry.currencyTotals[currency] = (mEntry.currencyTotals[currency] || 0) + amount
    }
  }

  const averageValuePerBol: Record<string, number> = {}
  for (const curr of Object.keys(currencyTotals)) {
    const cnt = currencyCounts[curr] || 1
    averageValuePerBol[curr] = Math.round((currencyTotals[curr] / cnt) * 100) / 100
  }

  const byShipper = Array.from(shipperMap.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => (b.currencyTotals["USD"] || 0) - (a.currencyTotals["USD"] || 0))
    .slice(0, 10)

  const byCommodity = Array.from(commodityMap.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => (b.currencyTotals["USD"] || 0) - (a.currencyTotals["USD"] || 0))
    .slice(0, 10)

  const byDestination = Array.from(destinationMap.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => (b.currencyTotals["USD"] || 0) - (a.currencyTotals["USD"] || 0))
    .slice(0, 10)

  const byMonth = Array.from(monthMap.values())
    .sort((a, b) => a.dateMs - b.dateMs)
    .map(({ monthLabel, currencyTotals }) => ({ monthLabel, currencyTotals }))

  return {
    currencyTotals,
    averageValuePerBol,
    highestValue: highest,
    lowestValue: lowest,
    byShipper,
    byCommodity,
    byDestination,
    byMonth,
  }
}
