import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"

type WhatsAppBol = BillOfLadingFormData
type Party = string | Record<string, unknown> | null | undefined

export function cleanValue(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return ""
  const text = String(value).trim()
  return /^(?:undefined|null|n\/?a|nan|\[object object\])$/i.test(text) ? "" : text
}

function line(label: string, value: unknown): string {
  const text = cleanValue(value)
  return text ? `*${label}:* ${text}` : ""
}

function section(heading: string, values: string[]): string {
  const content = values.filter(Boolean)
  return content.length ? `${heading}\n${content.join("\n")}` : ""
}

function withUnit(value: unknown, unit: string): string {
  const text = cleanValue(value)
  return text ? (new RegExp(`\\b${unit}\\b`, "i").test(text) ? text : `${text} ${unit}`) : ""
}

function cleanCargoText(text: string): string {
  if (!text) return ""
  return text
    .replace(/\bRAISNIS\b/gi, "RAISINS")
    .replace(/\bBLACK-RAISNIS\b/gi, "BLACK RAISINS")
    .replace(/\bGREEN-RAISNIS\b/gi, "GREEN RAISINS")
    .replace(/\bGOLDEN-RAISNIS\b/gi, "GOLDEN RAISINS")
}

function cargoSummary(value: unknown, packagesValue?: unknown): string {
  let summary = cleanValue(value).split(/\r?\n/).flatMap(row => row.split(/[|│]/)).map(segment =>
    segment.replace(/^[\p{Extended_Pictographic}\s•*>-]+/gu, "")
      .replace(/^\d+[.)]\s*/, "")
      .replace(/^(?:cargo|commodity|description of goods|goods)\s*[:#-]?\s*/i, "")
      .trim(),
  ).filter(segment => segment &&
    !/^(?:container\s*&\s*cargo|document\s*&\s*shipping|transit date|hs\s*code|afghan\s*tc|invoice|inv no|lot no|batch no|booking|seal no|container no)\b/i.test(segment) &&
    !/^[:#-]?\s*$/.test(segment),
  ).join("; ")

  if (!summary && packagesValue) {
    const pkgText = cleanValue(packagesValue)
    const match = pkgText.match(/(?:[-–—:]\s*)([A-Za-z\s()]+)$/)
    if (match && match[1]) {
      const stripped = match[1].replace(/^(?:ctns?|cartons?|bags?|packages?|pkgs?|units?|boxes?)\s*[-:]?\s*/i, "").trim()
      if (stripped) summary = stripped
    }
  }

  return cleanCargoText(summary)
}

function cleanPackageCount(packagesValue: unknown, packageType?: unknown): string {
  const text = cleanValue(packagesValue)
  if (!text) return ""
  const m = text.match(/^(\d[\d,]*)\s*[-–—]?\s*(CTNS?|CARTONS?|BAGS?|PKGS?|PACKAGES?|UNITS?|BOXES?|ROLLS?)\b/i)
  if (m) {
    const num = parseInt(m[1].replace(/,/g, ""), 10)
    const formattedNum = !isNaN(num) ? num.toLocaleString("en-US") : m[1]
    return `${formattedNum} ${m[2].toUpperCase()}`
  }
  const justNum = text.match(/^(\d[\d,]*)$/)
  if (justNum) {
    const num = parseInt(justNum[1].replace(/,/g, ""), 10)
    const formattedNum = !isNaN(num) ? num.toLocaleString("en-US") : justNum[1]
    const type = cleanValue(packageType) || "Cartons"
    return `${formattedNum} ${type}`
  }
  return cleanCargoText(text)
}

function routeDetails(bol: WhatsAppBol) {
  const stops = [...(bol.routes ?? [])].sort((a, b) => a.stopOrder - b.stopOrder)
  const locations = stops.map(stop => cleanValue(stop.location) || cleanValue(stop.locationPersian)).filter(Boolean)
  return {
    text: locations.length ? locations.join(" ➜ ") : [bol.port_of_loading, bol.port_of_discharge, bol.place_of_delivery]
      .map(cleanValue).filter(Boolean).join(" ➜ "),
    etd: stops.map(stop => cleanValue(stop.departureDate)).find(Boolean) || "",
    eta: [...stops].reverse().map(stop => cleanValue(stop.arrivalDate)).find(Boolean) || "",
  }
}

/** Accepts the editor's string fields and object-based parties from imported records. */
export function formatPartyForWhatsApp(party: Party, details: Record<string, unknown> = {}): string[] {
  const source: Record<string, unknown> = typeof party === "object" && party !== null ? party : { name: party }
  const data = { ...source, ...Object.fromEntries(Object.entries(details).filter(([, value]) => cleanValue(value))) }
  const field = (...keys: string[]): string => {
    for (const key of keys) {
      const value = cleanValue(data[key])
      if (value) return value
    }
    return ""
  }
  return [
    field("name", "companyName", "company_name"),
    field("address"),
    line("T.L No", field("licence", "license", "tlNo", "tl_no")),
    line("TIN", field("tin", "TIN")),
    line("FSSAI", field("fssai", "FSSAI")),
    line("GST", field("gst", "GST")),
    line("PAN", field("pan", "PAN")),
    line("IEC", field("iec", "IEC")),
    line("Phone", field("phone", "contact", "telephone")),
    line("Email", field("email")),
  ].filter(Boolean)
}

function cleanTruckNumber(value: unknown): string {
  const text = cleanValue(value)
  if (!text) return ""
  return text.replace(/^(\d+)([\u0600-\u06FF])/, "$1 $2")
}

function extractRouteNote(bol: WhatsAppBol): string {
  const raw = cleanValue(
    bol.cargo_route_note ||
    (bol as any).cargoRouteNote ||
    (bol as any).route_note ||
    (bol as any).routeNote ||
    (bol as any).transit_route ||
    (bol as any).route_persian
  )
  if (!raw) return ""
  return raw.replace(/^مسیر\s*[:#-]?\s*/i, "").trim()
}

export function buildWhatsAppBOLMessage(bol: WhatsAppBol): string {
  const route = routeDetails(bol)
  const routeNote = extractRouteNote(bol)
  const containerType = [cleanValue(bol.container_size), cleanValue(bol.container_type || bol.equipment_type)].filter(Boolean).join(" ")
  const meaningfulCargo = cargoSummary(bol.cargo_description, bol.number_of_packages)
  const formattedPackages = cleanPackageCount(bol.number_of_packages, bol.package_type)
  const truck = cleanTruckNumber(bol.truck_number)

  const parts = [
    "🚢 *SKY ARIANA LIMITED*",
    "📋 *BILL OF LADING / بارنامه*",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    section("📄 *DOCUMENT DETAILS*", [
      line("BOL No", bol.bol_number), line("Issue Date", bol.issue_date),
    ]),
    section("🚚 *TRANSPORT & DRIVER*", [
      line("Truck No", truck), line("Driver", bol.driver_name),
      line("Driver Phone", bol.driver_contact),
      line("Driver Rent", withUnit(bol.driver_rent, bol.driver_rent_currency || "AFN")),
    ]),
    section("📦 *SHIPPER / EXPORTER*", formatPartyForWhatsApp(bol.shipper_name, {
      address: bol.shipper_address, phone: bol.shipper_contact, email: bol.shipper_email, licence: bol.shipper_licence,
    })),
    section("📦 *CONSIGNEE / IMPORTER*", formatPartyForWhatsApp(bol.consignee_name, {
      address: bol.consignee_address, phone: bol.consignee_contact, email: bol.consignee_email, fssai: bol.consignee_fssai,
    })),
    section("📋 *NOTIFY PARTY*", formatPartyForWhatsApp(bol.notify_party, { address: bol.notify_party_address })),
    section("📦 *CARGO DETAILS*", [
      line("Commodity", meaningfulCargo),
      line("Packages", formattedPackages || [cleanValue(bol.number_of_packages), cleanValue(bol.package_type)].filter(Boolean).join(" ")),
      line("Weight / Carton", withUnit(bol.kgs_per_carton, "KG")),
      line("Net Weight", withUnit(bol.net_weight, "KG")), line("Gross Weight", withUnit(bol.gross_weight, "KG")),
      line("Rate / KG", withUnit(bol.rate_per_kgs, "USD")), line("Goods Value", withUnit(bol.goods_value, "USD")),
    ]),
    section("📦 *CONTAINER DETAILS*", [
      line("Container Type", containerType), line("Container No", bol.container_numbers), line("Seal No", bol.seal_numbers),
      line("Temperature", bol.temperature_setting),
    ]),
    section("🛣️ *ROUTE*", [
      route.text ? route.text : "",
      routeNote ? `مسیر: ${routeNote}` : "",
    ].filter(Boolean)),
    section("🚢 *SHIPPING DETAILS*", [
      line("Vessel", bol.vessel_name), line("Voyage", bol.voyage_number),
      line("Port of Loading", bol.port_of_loading), line("Port of Discharge", bol.port_of_discharge),
      line("Final Destination", bol.place_of_delivery), line("ETD", route.etd), line("ETA", route.eta),
    ]),
    section("📍 *BORDER REPRESENTATIVE*", [cleanValue(bol.notes_2)].filter(Boolean)),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━\n*SKY ARIANA LIMITED*\nImport • Export • International Transportation",
  ]
  if (parts.slice(3, -1).every(part => !part)) return ""
  return parts.filter(Boolean).join("\n\n")
}

export function buildWhatsAppShipmentUpdate(bol: WhatsAppBol): string {
  const route = routeDetails(bol)
  const routeNote = extractRouteNote(bol)
  const containerType = [cleanValue(bol.container_size), cleanValue(bol.container_type || bol.equipment_type)].filter(Boolean).join(" ")
  const meaningfulCargo = cargoSummary(bol.cargo_description, bol.number_of_packages)
  const formattedPackages = cleanPackageCount(bol.number_of_packages, bol.package_type)
  const truck = cleanTruckNumber(bol.truck_number)

  const details = [
    line("BOL", bol.bol_number),
    line("Truck", truck),
    line("Cargo", meaningfulCargo),
    line("Packages", formattedPackages || [cleanValue(bol.number_of_packages), cleanValue(bol.package_type)].filter(Boolean).join(" ")),
    line("Net Weight", withUnit(bol.net_weight, "KG")),
    line("Container", [containerType, cleanValue(bol.container_numbers)].filter(Boolean).join(" • ")),
    line(routeNote ? "Route" : "Route / مسیر", route.text),
    line("مسیر", routeNote),
    line("Vessel", bol.vessel_name),
    line("ETD", route.etd),
    line("ETA", route.eta),
  ].filter(Boolean)

  if (!details.length) return ""

  return [
    "🚢 *SKY ARIANA LIMITED — SHIPMENT UPDATE*",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    details.join("\n"),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "🌐 *Sky Ariana Logistics* • Afghanistan • UAE • India",
  ].join("\n")
}

export function buildWhatsAppBilingualMessage(bol: WhatsAppBol): string {
  const route = routeDetails(bol)
  const routeNote = extractRouteNote(bol)
  const containerType = [cleanValue(bol.container_size), cleanValue(bol.container_type || bol.equipment_type)].filter(Boolean).join(" ")
  const meaningfulCargo = cargoSummary(bol.cargo_description, bol.number_of_packages)
  const formattedPackages = cleanPackageCount(bol.number_of_packages, bol.package_type)
  const truck = cleanTruckNumber(bol.truck_number)

  const details = [
    bol.bol_number ? `📄 *BOL / نمبر بارنامه:* ${bol.bol_number}` : "",
    truck ? `🚚 *Truck / موټر نمبر:* ${truck}` : "",
    meaningfulCargo ? `🍇 *Commodity / جنس:* ${meaningfulCargo}` : "",
    (formattedPackages || bol.number_of_packages) ? `📦 *Packages / تعداد کارتن:* ${formattedPackages || cleanValue(bol.number_of_packages)}` : "",
    bol.net_weight ? `⚖️ *Net Weight / خالص وزن:* ${withUnit(bol.net_weight, "KG")}` : "",
    (containerType || bol.container_numbers) ? `📦 *Container / کانتینر:* ${[containerType, cleanValue(bol.container_numbers)].filter(Boolean).join(" • ")}` : "",
    route.text ? `🛣️ *Route / مسیر ترانزیت:*\n${route.text}` : "",
    routeNote ? `🗺️ *مسیر:* ${routeNote}` : "",
    bol.vessel_name ? `🚢 *Vessel / کشتی:* ${bol.vessel_name}` : "",
    route.etd ? `📅 *ETD / تاریخ حرکت:* ${route.etd}` : "",
    route.eta ? `📍 *ETA / تاریخ رسید:* ${route.eta}` : "",
  ].filter(Boolean)

  if (!details.length) return ""

  return [
    "🚢 *SKY ARIANA LIMITED*",
    "📋 *اطلاعیه باربری / SHIPMENT UPDATE*",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    details.join("\n"),
    "━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "🌐 *Sky Ariana Limited* • International Transportation",
  ].join("\n")
}

export function buildWhatsAppQuickMessage(bol: WhatsAppBol): string {
  const route = routeDetails(bol)
  const routeNote = extractRouteNote(bol)
  const meaningfulCargo = cargoSummary(bol.cargo_description, bol.number_of_packages)
  const formattedPackages = cleanPackageCount(bol.number_of_packages, bol.package_type)
  const truck = cleanTruckNumber(bol.truck_number)

  const items: string[] = []
  if (bol.bol_number) items.push(`• *BOL:* ${bol.bol_number}`)
  if (truck) items.push(`• *Truck:* ${truck}`)
  if (meaningfulCargo || formattedPackages) {
    const cargoLine = [meaningfulCargo, formattedPackages].filter(Boolean).join(" — ")
    items.push(`• *Cargo:* ${cargoLine}`)
  }
  if (bol.net_weight) items.push(`• *Weight:* ${withUnit(bol.net_weight, "KG")}`)
  if (route.text) items.push(`• *${routeNote ? "Corridor" : "Route / مسیر"}:* ${route.text}`)
  if (routeNote) items.push(`• *مسیر:* ${routeNote}`)

  if (!items.length) return ""

  return [
    "🚢 *SKY ARIANA DISPATCH*",
    ...items,
  ].join("\n")
}
