import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import type {
  AcciInvoiceData,
  AcciInvoiceItem,
  AcciPackingListData,
  AcciPackingListItem,
  AcciPartyInfo,
  AcciTemplateStyle,
} from "@/lib/types/acci-documents"
import { numberToWords } from "@/lib/utils/number-to-words"
import { gregorianToPersian, toPersianDate } from "@/lib/utils/persian-date"
import {
  clean,
  extractInvoiceNumber,
  extractPhone,
  extractEmail,
  extractGst,
  extractPan,
  parseCommodityItems,
  cleanAddressBlock,
} from "@/lib/utils/shipping-documents"

const DEFAULT_EXPORTER = {
  name: "SKY ARIANA LTD",
  tlNo: "2401-2198",
  address: "OFF NO.16 1ST FLR BLOCK 6 ETEMAD RAHIMI MARKET KANDAHAR AFGHANISTAN.",
  phone: "+93700939365",
  email: "INFO@SKYARIANA.COM",
}

export function extractExporterInfo(formData: BillOfLadingFormData): AcciPartyInfo {
  const rawName = clean(formData.shipper_name)
  const isSkyAriana = !rawName || /sky\s*ariana/i.test(rawName)

  if (isSkyAriana) {
    return {
      name: DEFAULT_EXPORTER.name,
      tlNo: DEFAULT_EXPORTER.tlNo,
      address: clean(formData.shipper_address) || DEFAULT_EXPORTER.address,
      phone: clean(formData.shipper_contact) || DEFAULT_EXPORTER.phone,
      email: clean(formData.shipper_email) || DEFAULT_EXPORTER.email,
    }
  }

  // Custom Shipper (e.g. WASELA LTD)
  const rawAddress = clean(formData.shipper_address) || ""
  let tlNo = clean(formData.shipper_licence) || ""
  let cleanAddr = rawAddress

  if (!tlNo && rawAddress) {
    const licMatch = rawAddress.match(/(?:t\.?l\.?\s*(?:no\.?|number)?|lic(?:en[sc]e)?\.?\s*(?:no\.?|number)?)\s*[:#-]?\s*([A-Za-z0-9\/-]+)/i)
    if (licMatch) {
      tlNo = licMatch[1].trim()
      cleanAddr = rawAddress.replace(/(?:t\.?l\.?\s*(?:no\.?|number)?|lic(?:en[sc]e)?\.?\s*(?:no\.?|number)?)\s*[:#-]?\s*[A-Za-z0-9\/-]+/gi, "").trim().replace(/[,\s]+$/, "")
    }
  }

  const phone = clean(formData.shipper_contact) || extractPhone(rawAddress) || ""
  const email = clean(formData.shipper_email) || extractEmail(rawAddress) || ""

  return {
    name: rawName.toUpperCase(),
    tlNo: tlNo || undefined,
    address: (cleanAddr || rawAddress).toUpperCase(),
    phone: phone || undefined,
    email: email || undefined,
  }
}

export function formatDateToDMY(dateInput?: string | null): string {
  if (!dateInput) {
    const now = new Date()
    const d = String(now.getDate()).padStart(2, "0")
    const m = String(now.getMonth() + 1).padStart(2, "0")
    const y = now.getFullYear()
    return `${d}/${m}/${y}`
  }

  const trimmed = dateInput.trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed
  }

  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split("T")[0].split("-")
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`
    }
  }

  const d = new Date(trimmed)
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  return trimmed
}

export function getShamsiDateString(gregorianDateInput?: string | null): string {
  let gYear = 2026
  let gMonth = 10
  let gDay = 20

  if (gregorianDateInput) {
    const trimmed = gregorianDateInput.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split("T")[0].split("-")
      gYear = parseInt(parts[0], 10) || gYear
      gMonth = parseInt(parts[1], 10) || gMonth
      gDay = parseInt(parts[2], 10) || gDay
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const parts = trimmed.split("/")
      gDay = parseInt(parts[0], 10) || gDay
      gMonth = parseInt(parts[1], 10) || gMonth
      gYear = parseInt(parts[2], 10) || gYear
    } else {
      const d = new Date(trimmed)
      if (!isNaN(d.getTime())) {
        gYear = d.getFullYear()
        gMonth = d.getMonth() + 1
        gDay = d.getDate()
      }
    }
  }

  const p = gregorianToPersian(gYear, gMonth, gDay)
  const pDay = String(p.day).padStart(2, "0")
  const pMonth = String(p.month).padStart(2, "0")
  const pYear = String(p.year)

  return `${pDay}/${pMonth}/${pYear}`
}

export function extractRatePerKg(cargoText?: string | null): number | null {
  if (!cargoText) return null
  const rateMatch = cargoText.match(/(?:@|rate|price)\s*[:#-]?\s*([0-9]+(?:\.[0-9]+)?)/i)
  if (rateMatch && rateMatch[1]) {
    const val = parseFloat(rateMatch[1])
    if (!isNaN(val) && val > 0) return val
  }
  return null
}

export function extractIec(addressOrText?: string | null): string {
  if (!addressOrText) return ""
  const m = addressOrText.match(/\bIEC\s*[:#-]?\s*([A-Z0-9]+)/i)
  return m ? m[1].trim() : ""
}

export function extractTrn(addressOrText?: string | null): string {
  if (!addressOrText) return ""
  const m = addressOrText.match(/\bTRN\s*(?:NO|NUMBER)?\s*[:#-]?\s*([A-Z0-9]+)/i)
  return m ? m[1].trim() : ""
}

export function determineTransitRouteText(
  formData: BillOfLadingFormData,
  templateStyle: AcciTemplateStyle
): { docTitle: string; via: string } {
  const cargo = formData.cargo_description || ""
  const isAir =
    templateStyle === "kabul" ||
    /\b(?:air|airway|airport|fly|flight|karzai)\b/i.test(cargo) ||
    /\b(?:hamid karzai|kabul airport)\b/i.test(formData.port_of_loading || "")

  const routes = [...(formData.routes || [])].sort((a, b) => a.stopOrder - b.stopOrder)
  const firstRoute = routes[0]
  const lastRoute = routes.length > 0 ? routes[routes.length - 1] : undefined

  let dest = clean(formData.place_of_delivery)
  if (!dest && lastRoute?.location) {
    dest = lastRoute.location.toUpperCase().trim()
    if (/\bIN\b/i.test(dest) || /india/i.test(dest)) {
      dest = dest.replace(/,\s*IN\b/i, " (INDIA)").replace(/\s*INDIA\b/i, " (INDIA)")
      if (!dest.includes("(INDIA)")) dest += " (INDIA)"
    }
  }
  if (!dest) {
    const consigneeAddr = formData.consignee_address || ""
    if (/india/i.test(consigneeAddr)) dest = "INDIA"
    else if (/uae|dubai|jebel\s*ali/i.test(consigneeAddr)) dest = "UNITED ARAB EMIRATES"
    else if (/iran/i.test(consigneeAddr)) dest = "IRAN"
    else dest = "INDIA"
  }

  if (isAir) {
    return {
      docTitle: "Afghan Transit form Airway Bill.",
      via: `BY AIR FROM HAMID KARZAI AIRPORT TO ${dest.toUpperCase().trim()}.`,
    }
  }

  // Road Transit: origin
  let origin = clean(formData.port_of_loading)
  if (!origin && firstRoute?.location) {
    origin = firstRoute.location.toUpperCase().trim()
    if (!origin.includes("AFGHANISTAN")) origin = `${origin} (AFGHANISTAN)`
  }
  if (!origin) origin = "KANDAHAR (AFGHANISTAN)"

  // Discharge port / Border
  let portDischarge = clean(formData.port_of_discharge)
  if (!portDischarge) {
    const portStop = routes.find((r) => /\b(?:port|sea|bandar|bndr)\b/i.test(r.location))
    if (portStop) {
      portDischarge = portStop.location.toUpperCase().trim().replace(/,\s*[A-Z]{2}\b/i, "")
    } else if (lastRoute && lastRoute !== firstRoute) {
      portDischarge = lastRoute.location.toUpperCase().trim().replace(/,\s*[A-Z]{2}\b/i, "")
    }
  }

  // Format via text cleanly
  let via = ""
  const cleanDest = dest.replace(/^\(|\)$/g, "").trim()
  if (portDischarge && cleanDest && !portDischarge.includes(cleanDest)) {
    via = `GOODS IN TRANSIT BY ROAD FROM ${origin} TO ${portDischarge} (${cleanDest})`
  } else if (portDischarge) {
    via = `GOODS IN TRANSIT BY ROAD FROM ${origin} TO ${portDischarge}`
  } else {
    via = `GOODS IN TRANSIT BY ROAD FROM ${origin} TO ${dest}`
  }

  return {
    docTitle: "Afghan Transit Form Way Bill",
    via,
  }
}

export function generateAcciInvoiceFromBol(
  formData: BillOfLadingFormData,
  options?: {
    templateStyle?: AcciTemplateStyle
    invoiceNumberOverride?: string
    invoiceDateOverride?: string
  }
): AcciInvoiceData {
  const cargo = formData.cargo_description || ""
  const templateStyle: AcciTemplateStyle =
    options?.templateStyle ||
    (/\b(?:air|airway|hamid karzai)\b/i.test(cargo) ? "kabul" : "kandahar")

  const rawInv = options?.invoiceNumberOverride || extractInvoiceNumber(formData, cargo) || "001"
  const cleanInvNumber = rawInv.replace(/^INV[-_\s:]*/i, "").trim() || "001"

  const invoiceDateStr = formatDateToDMY(options?.invoiceDateOverride || formData.issue_date)
  const shamsiDateStr = getShamsiDateString(options?.invoiceDateOverride || formData.issue_date)

  const consigneeAddr = cleanAddressBlock(formData.consignee_address || "")
  const consigneeGst = extractGst(consigneeAddr) || ""
  const consigneePan = extractPan(consigneeAddr) || ""
  const consigneeIec = extractIec(consigneeAddr) || ""
  const consigneePhone = clean(formData.consignee_contact) || extractPhone(consigneeAddr) || ""
  const consigneeEmail = clean(formData.consignee_email) || extractEmail(consigneeAddr) || ""

  const notifyName = clean(formData.notify_party) || ""
  const notifyAddr = clean(formData.notify_party_address) || ""
  const notifyTrn = extractTrn(notifyAddr) || (notifyName ? "100340961000003" : "")

  const transit = determineTransitRouteText(formData, templateStyle)

  const rawPackages = clean(formData.number_of_packages) || "0"
  const pkgMatches = rawPackages.match(/\d+[\d,]*/g)
  const totalPkgCount = pkgMatches ? pkgMatches[0].replace(/,/g, "") : rawPackages
  const pkgType = /bags?/i.test(rawPackages) ? "BAGS" : "CTNS"

  const rawNetWt = clean(formData.net_weight).replace(/[^\d.]/g, "")
  const netWtNum = parseFloat(rawNetWt) || (parseFloat(totalPkgCount) * 10) || 0

  const rawGrossWt = clean(formData.gross_weight).replace(/[^\d.]/g, "")
  const grossWtNum = parseFloat(rawGrossWt) || Math.round(netWtNum * 1.05)

  // Commodity Parsing
  const parsedCommodities = parseCommodityItems(
    cargo,
    rawPackages,
    String(netWtNum),
    String(grossWtNum),
    clean(formData.kgs_per_carton),
    clean(formData.gross_weight_per_carton),
    pkgType,
    "",
    clean(formData.measurement),
    "",
    ""
  )

  const parsedRate = extractRatePerKg(cargo)
  const rawGoodsVal = clean(formData.goods_value).replace(/[^\d.]/g, "")
  const totalValNum = parseFloat(rawGoodsVal) || (parsedRate ? Math.round(parsedRate * netWtNum * 100) / 100 : 0)

  const effectiveUnitPrice = parsedRate || (netWtNum > 0 && totalValNum > 0 ? Math.round((totalValNum / netWtNum) * 100) / 100 : 3.0)
  const finalTotalAmount = totalValNum > 0 ? totalValNum : Math.round(effectiveUnitPrice * netWtNum * 100) / 100

  const items: AcciInvoiceItem[] = []

  if (parsedCommodities && parsedCommodities.length > 1) {
    parsedCommodities.forEach((c, idx) => {
      const cNet = parseFloat(c.netWeight.replace(/[^\d.]/g, "")) || (netWtNum / parsedCommodities.length)
      const cGross = parseFloat(c.grossWeight.replace(/[^\d.]/g, "")) || (grossWtNum / parsedCommodities.length)
      const cPrice = Math.round(effectiveUnitPrice * cNet * 100) / 100
      items.push({
        no: idx + 1,
        packagesCount: c.packageCount || Math.round(parseFloat(totalPkgCount) / parsedCommodities.length),
        packageType: c.packageType ? c.packageType.toUpperCase() : pkgType,
        netWeight: cNet,
        grossWeight: cGross,
        description: c.commodity.toUpperCase(),
        unitPrice: effectiveUnitPrice,
        totalPrice: cPrice,
      })
    })
  } else {
    const mainDesc = parsedCommodities?.[0]?.commodity?.toUpperCase() || clean(formData.cargo_description).split("\n")[0].toUpperCase() || "DRIED FRUITS (BLACK RAISINS)"
    items.push({
      no: 1,
      packagesCount: totalPkgCount,
      packageType: pkgType,
      netWeight: netWtNum,
      grossWeight: grossWtNum,
      description: mainDesc,
      unitPrice: effectiveUnitPrice,
      totalPrice: finalTotalAmount,
    })
  }

  const words = numberToWords(finalTotalAmount, "USD").toUpperCase()

  return {
    invoiceNumber: cleanInvNumber,
    invoiceDate: invoiceDateStr,
    templateStyle,
    exporter: extractExporterInfo(formData),
    consignee: {
      name: clean(formData.consignee_name).toUpperCase() || "CONSIGNEE",
      address: consigneeAddr.toUpperCase(),
      gstin: consigneeGst.toUpperCase(),
      pan: consigneePan.toUpperCase(),
      iec: consigneeIec.toUpperCase(),
      phone: consigneePhone,
      email: consigneeEmail,
    },
    notifyParty: notifyName
      ? {
          name: notifyName.toUpperCase(),
          address: notifyAddr.toUpperCase(),
          trn: notifyTrn,
        }
      : undefined,
    transit: {
      docTitle: transit.docTitle,
      bolNumber: clean(formData.bol_number || formData.bill_of_lading_number) || "BOL-001",
      bolDate: formatDateToDMY(formData.issue_date),
      termsOfPayment: templateStyle === "kabul" ? "100% Advance, Part Payment Allowed" : "100% Advance Payment",
      letterOfCredit: "Letter Of Credit",
      collectionBasisNo: "Collection Basis   No:",
      through: "Through:",
      via: transit.via,
    },
    items,
    totalPackages: totalPkgCount,
    totalNetWeight: netWtNum,
    totalGrossWeight: grossWtNum,
    totalAmount: finalTotalAmount,
    currency: "USD",
    amountInWords: words,
    originCountry: "(Origin Afghanistan)",
    acciChamber: {
      regNo: "------------------0000--------------------",
      feeNo: "------------------0000--------------------",
      receivedSum: "2,330",
      shamsiDate: `-----------------${shamsiDateStr}-----------------`,
      signature: "---------------------------------------------",
    },
    incoterm: "TOTAL C&F",
    signedBy: "SKY ARIANA LTD",
  }
}

export function generateAcciPackingListFromBol(
  formData: BillOfLadingFormData,
  options?: {
    templateStyle?: AcciTemplateStyle
    packingListNumberOverride?: string
    packingListDateOverride?: string
  }
): AcciPackingListData {
  const invData = generateAcciInvoiceFromBol(formData, {
    templateStyle: options?.templateStyle,
  })

  const rawNum = (
    options?.packingListNumberOverride ||
    formData.packing_list_number ||
    invData.invoiceNumber ||
    ""
  ).trim()

  const cleanNum = rawNum.replace(/^INV[-_ ]?/i, "").trim()
  const plNumber =
    cleanNum.startsWith("1/") || !/^\d+$/.test(cleanNum)
      ? (cleanNum || "1/001")
      : `1/${cleanNum}`
  const dateStr = options?.packingListDateOverride || invData.invoiceDate

  const items: AcciPackingListItem[] = invData.items.map((it) => ({
    no: it.no,
    description: it.description,
    origin: "(Origin Afghanistan)",
    packagesCount: it.packagesCount,
    packageType: it.packageType,
    netWeight: it.netWeight,
    grossWeight: it.grossWeight || Math.round(Number(it.netWeight) * 1.05),
  }))

  return {
    packingListNumber: plNumber,
    date: dateStr,
    invoiceNumber: invData.invoiceNumber,
    templateStyle: invData.templateStyle,
    exporter: invData.exporter,
    consignee: invData.consignee,
    notifyParty: invData.notifyParty,
    transit: {
      ...invData.transit,
      docTitle: invData.transit.docTitle,
    },
    items,
    totalPackages: invData.totalPackages,
    totalNetWeight: invData.totalNetWeight,
    totalGrossWeight: invData.totalGrossWeight || Math.round(Number(invData.totalNetWeight) * 1.05),
    vehicleInfo: {
      truckNumber: clean(formData.truck_number),
      driverName: clean(formData.driver_name),
      driverFatherName: clean(formData.driver_father_name),
      driverContact: clean(formData.driver_contact),
      containerNumber: clean(formData.container_numbers),
      sealNumber: clean(formData.seal_numbers),
    },
    originCountry: "(Origin Afghanistan)",
    signedBy: "SKY ARIANA LTD",
  }
}
