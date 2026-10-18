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
  
  // Find all matches like "777 CTNS", "304 CTNS", "1501 CTNS", "380 BAGS"
  const matches = [...text.matchAll(/(\d[\d,]*)\s*[-–—]?\s*(CTNS?|CARTONS?|BAGS?|PKGS?|PACKAGES?|UNITS?|BOXES?|ROLLS?)\b/gi)]
  if (matches.length > 1) {
    let total = 0
    const parts = matches.map(m => {
      const num = parseInt(m[1].replace(/,/g, ""), 10)
      if (!isNaN(num)) total += num
      return `${(!isNaN(num) ? num.toLocaleString("en-US") : m[1])} ${m[2].toUpperCase()}`
    })
    const unit = matches[0][2].toUpperCase()
    return `${total.toLocaleString("en-US")} ${unit} (${parts.join(" + ")})`
  } else if (matches.length === 1) {
    const num = parseInt(matches[0][1].replace(/,/g, ""), 10)
    const formattedNum = !isNaN(num) ? num.toLocaleString("en-US") : matches[0][1]
    return `${formattedNum} ${matches[0][2].toUpperCase()}`
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
  const locations = stops.map(stop => cleanStopLocationName(cleanValue(stop.location) || cleanValue(stop.locationPersian))).filter(Boolean)
  return {
    text: locations.length ? locations.join(" ➜ ") : [bol.port_of_loading, bol.port_of_discharge, bol.place_of_delivery]
      .map(cleanValue).map(cleanStopLocationName).filter(Boolean).join(" ➜ "),
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

function extractInvoiceNumber(bol: WhatsAppBol): string {
  if (bol.invoice_number) {
    const clean = cleanValue(bol.invoice_number)
    return clean.toUpperCase().startsWith("INV-") ? clean.toUpperCase() : `INV-${clean}`
  }
  const allText = [
    (bol as any).source_file,
    (bol as any).fileName,
    (bol as any).internal_bol_number,
    (bol as any).id,
    bol.cargo_description,
    (bol as any).cargoDescription,
  ].filter(Boolean).join(" ")

  const m = allText.match(/\bINV-?\s*(\d+)\b/i)
  if (m) return `INV-${m[1]}`
  
  const m2 = allText.match(/invoice\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Za-z0-9-]+)/i)
  if (m2 && !/^oice$/i.test(m2[1])) {
    const val = m2[1].trim()
    return val.toUpperCase().startsWith("INV") ? val.toUpperCase() : `INV-${val}`
  }
  return ""
}

function getPartyName(party: Party): string {
  if (typeof party === "object" && party !== null) {
    return cleanValue((party as any).name || (party as any).companyName || (party as any).company_name)
  }
  return cleanValue(party)
}

function formatTruckNumberExecutive(value: unknown): string {
  const text = cleanValue(value)
  if (!text) return ""
  // Check if plate has an Afghan province attached like "12797کندهار" or "12797 - کندهار"
  const m = text.match(/^(\d+)\s*[-–—]?\s*(.+)$/)
  if (m) {
    const num = m[1]
    const prov = m[2].trim()
    const provMap: Record<string, string> = {
      "کندهار": "Kandahar",
      "قندهار": "Kandahar",
      "kandahar": "Kandahar",
      "هرات": "Herat",
      "herat": "Herat",
      "کابل": "Kabul",
      "kabul": "Kabul",
      "نیمروز": "Nimroz",
      "nimroz": "Nimroz",
      "بلخ": "Balkh",
      "balkh": "Balkh",
      "مزار": "Mazar-i-Sharif",
      "مزارشریف": "Mazar-i-Sharif",
      "ننگرهار": "Nangarhar",
      "nangarhar": "Nangarhar",
      "جلال آباد": "Jalalabad",
      "جلال\u200Cآباد": "Jalalabad",
      "هلمند": "Helmand",
      "helmand": "Helmand",
      "غزنی": "Ghazni",
      "ghazni": "Ghazni",
      "فراه": "Farah",
      "farah": "Farah",
      "زابل": "Zabul",
      "zabul": "Zabul",
      "کندز": "Kunduz",
      "kunduz": "Kunduz",
    }
    const engProv = provMap[prov] || provMap[prov.toLowerCase()] || prov
    return `${num} – ${engProv}`
  }
  return text.replace(/^(\d+)([\u0600-\u06FF])/, "$1 – $2")
}

function getBilingualCommodity(commodity: string): string {
  if (!commodity) return ""
  const upper = commodity.toUpperCase().replace(/[-_]+/g, " ")
  const found: { en: string; fa: string }[] = []

  if (upper.includes("BLACK RAISIN") || upper.includes("BLACK-RAISNIS") || upper.includes("BLACK RAISNIS")) {
    found.push({ en: "BLACK RAISINS", fa: "کشمش سیاه" })
  }
  if (upper.includes("GREEN RAISIN") || upper.includes("GREEN-RAISNIS")) {
    found.push({ en: "GREEN RAISINS", fa: "کشمش سبز" })
  }
  if (upper.includes("GOLDEN RAISIN") || upper.includes("GOLDEN-RAISNIS") || upper.includes("GOLDEN RAISNIS")) {
    found.push({ en: "GOLDEN RAISINS", fa: "کشمش طلایی" })
  }
  if (upper.includes("RED RAISIN") || upper.includes("RED-RAISNIS")) {
    found.push({ en: "RED RAISINS", fa: "کشمش سرخ" })
  }
  if (upper.includes("DRIED FIG") || upper.includes("DRY FIGS") || upper.includes("FIGS") || upper.includes("انجیر")) {
    found.push({ en: "DRIED FIGS", fa: "انجیر خشک" })
  }
  if (upper.includes("PISTACHIO") || upper.includes("پسته")) {
    found.push({ en: "PISTACHIO", fa: "پسته" })
  }
  if (upper.includes("ALMOND") || upper.includes("بادام")) {
    found.push({ en: "ALMONDS", fa: "بادام" })
  }
  if (upper.includes("WALNUT") || upper.includes("چهارمغز")) {
    found.push({ en: "WALNUTS", fa: "چهارمغز" })
  }
  if (upper.includes("POMEGRANATE") || upper.includes("انار")) {
    found.push({ en: "POMEGRANATE", fa: "انار" })
  }
  if (upper.includes("APPLE") || upper.includes("سیب")) {
    found.push({ en: "APPLES", fa: "سیب" })
  }
  if (upper.includes("SAFFRON") || upper.includes("زعفران")) {
    found.push({ en: "SAFFRON", fa: "زعفران" })
  }
  if (upper.includes("LICORICE") || upper.includes("شیرین بویه") || upper.includes("مهک")) {
    found.push({ en: "AFGHAN LICORICE", fa: "شیرین بویه" })
  }
  if (upper.includes("APRICOT") || upper.includes("زردآلو") || upper.includes("قیسی")) {
    found.push({ en: "DRIED APRICOTS", fa: "زردآلو خشک" })
  }
  if (upper.includes("PINE NUT") || upper.includes("CHILGOZA") || upper.includes("جلغوزه")) {
    found.push({ en: "PINE NUTS", fa: "جلغوزه" })
  }
  if (upper.includes("CUMIN") || upper.includes("زیره")) {
    found.push({ en: "CUMIN SEEDS", fa: "زیره" })
  }

  if (found.length === 1) {
    return `${found[0].en} / ${found[0].fa}`
  } else if (found.length > 1) {
    const ens = found.map(f => f.en).join(" & ")
    const fas = found.map(f => f.fa).join(" و ")
    return `${ens} / ${fas}`
  }
  return commodity
}

function formatNumberWithCommas(value: unknown): string {
  const text = cleanValue(value)
  if (!text) return ""
  const m = text.match(/^(\d[\d,]*)(.*)$/)
  if (m) {
    const rawNum = parseInt(m[1].replace(/,/g, ""), 10)
    if (!isNaN(rawNum)) {
      return `${rawNum.toLocaleString("en-US")}${m[2]}`
    }
  }
  return text
}

function formatUnitPrice(bol: WhatsAppBol): string {
  const rate = cleanValue(bol.rate_per_kgs)
  if (rate) {
    const numMatch = rate.match(/[\d.,]+/)
    if (numMatch) {
      const parsed = parseFloat(numMatch[0].replace(/,/g, ""))
      const formattedRate = !isNaN(parsed) ? parsed.toFixed(2) : numMatch[0]
      return `USD ${formattedRate} per carton`
    }
  }
  // Fallback to checking cargo_description for @ 2.90$
  const descMatch = (bol.cargo_description || "").match(/@\s*([0-9.]+)\s*\$/)
  if (descMatch) {
    const parsed = parseFloat(descMatch[1])
    const formattedRate = !isNaN(parsed) ? parsed.toFixed(2) : descMatch[1]
    return `USD ${formattedRate} per carton`
  }
  return ""
}

function cleanStopLocationName(rawLocation: string): string {
  let loc = cleanValue(rawLocation)
  if (!loc) return ""
  // Strip airport long suffixes e.g. "Tashkent — Islam Karimov Intl Airport (TAS / UTTT), UZ" -> "Tashkent"
  loc = loc.replace(/\s*[-–—]\s*(?:Islam Karimov|Indira Gandhi|Chhatrapati|Al Maktoum|Dubai Intl|Kabul Intl|Intl Airport|Airport).*$/i, "")
  // Strip trailing country codes e.g. "Kabul, AF" -> "Kabul", "Bandar Abbas, IR" -> "Bandar Abbas"
  loc = loc.replace(/,\s*(?:AF|AFG|IR|IRN|AE|ARE|IN|IND|UZ|UZB|PK|PAK|TR|TUR|TJ|TJK|TM|TKM|KZ|KAZ|CN|CHN|RU|RUS|QA|QAT|OM|OMN|SA|SAU)\b/i, "")
  loc = loc.replace(/\s*\([^)]*\)\s*$/, "")
  loc = loc.trim()
  return loc
}

function getCountryFlag(location: string): string {
  const loc = location.toLowerCase().trim()
  if (/^[\uD83C][\uDDE6-\uDDFF]{2}/.test(loc)) return ""

  if (/kandahar|کندهار|herat|هرات|kabul|کابل|islam\s*qala|اسلام\s*قلعه|torghundi|تورغندی|hairatan|حیرتان|spin\s*boldak|اسپین\s*بولدک|zaranj|زرنج|jalalabad|جلال\s*آباد|nimroz|نیمروز|afghanistan|افغانستان/.test(loc)) {
    return "🇦🇫"
  }
  if (/bandar\s*abbas|بندرعباس|dogh?aroun|dougharoun|دوغارون|chabahar|چابهار|milak|میلک|iran|ایران|tehran|تهران|bandar\s*leng|mashhad/.test(loc)) {
    return "🇮🇷"
  }
  if (/dubai|دبی|jebel\s*ali|جبل\s*علی|sharjah|شارجه|uae|امارات|al\s*hamriya/.test(loc)) {
    return "🇦🇪"
  }
  if (/nhava\s*sheva|نهاوا\s*شیوا|mundra|موندرا|mumbai|بمبئی|delhi|دهلی|india|هند|jnpt/.test(loc)) {
    return "🇮🇳"
  }
  if (/tashkent|تاشکند|uzbekistan|ازبکستان|termez|ترمذ/.test(loc)) {
    return "🇺🇿"
  }
  if (/karachi|کراچی|port\s*qasim|قاسم|pakistan|پاکستان|torkham|تورخم|chaman|چمن/.test(loc)) {
    return "🇵🇰"
  }
  if (/mersin|مرسین|turkey|ترکیه|istanbul|استانبول/.test(loc)) {
    return "🇹🇷"
  }
  if (/turkmenistan|ترکمنستان|ashgabat/.test(loc)) {
    return "🇹🇲"
  }
  if (/tajikistan|تاجیکستان|dushanbe/.test(loc)) {
    return "🇹🇯"
  }
  return ""
}

function isAfghanLocation(location: string): boolean {
  const loc = location.toLowerCase()
  return /kandahar|کندهار|kabul|کابل|hairatan|حیرتان|nimroz|نیمروز|islam\s*qala|اسلام\s*قلعه|torghundi|تورغندی|spin\s*boldak|اسپین\s*بولدک|herat|هرات|zaranj|زرنج|jalalabad|جلال|balkh|بلخ|mazar|afghan/i.test(loc)
}

function formatTransitRouteExecutive(bol: WhatsAppBol): string {
  const stops = [...(bol.routes ?? [])].sort((a, b) => a.stopOrder - b.stopOrder)
  const rawLocations = stops.map(stop => cleanValue(stop.location) || cleanValue(stop.locationPersian)).filter(Boolean)

  if (rawLocations.length >= 2) {
    const cleaned = rawLocations.map(cleanStopLocationName)
    
    // Group consecutive Afghan locations for Line 1 (Inland Leg)
    const afghanStops: string[] = []
    const internationalStops: string[] = []

    for (let i = 0; i < cleaned.length; i++) {
      const loc = cleaned[i]
      if (afghanStops.length === i && isAfghanLocation(loc)) {
        afghanStops.push(loc)
      } else {
        internationalStops.push(loc)
      }
    }

    if (afghanStops.length > 0 && internationalStops.length > 0) {
      // Line 1: 🇦🇫 Origin ➜ Border (e.g. 🇦🇫 Kandahar ➜ Nimroz or 🇦🇫 Kandahar ➜ Kabul ➜ Hairatan)
      const inlandLine = `🇦🇫 ${afghanStops.join(" ➜ ")}`
      
      // Line 2: International Corridor (each with flag, e.g. 🇮🇷 Bandar Abbas ➜ 🇦🇪 Dubai / Jebel Ali ➜ 🇮🇳 Nhava Sheva)
      const intlFormatted = internationalStops.map(loc => {
        let displayLoc = loc
        // When Dubai is intermediate sea transit hub, format as Dubai / Jebel Ali
        if (/^dubai$/i.test(displayLoc)) {
          displayLoc = "Dubai / Jebel Ali"
        }
        const flag = getCountryFlag(displayLoc)
        return flag ? `${flag} ${displayLoc}` : displayLoc
      })

      return `${inlandLine}\n${intlFormatted.join(" ➜ ")}`
    }

    // Fallback if not partitioned cleanly
    const formatted = cleaned.map(loc => {
      const flag = getCountryFlag(loc)
      return flag ? `${flag} ${loc}` : loc
    })
    return formatted.join(" ➜ ")
  }

  // Absolute fallback based on border and destination
  const details = formatTransitDetailsText(bol)
  const borderMatch = details.en.match(/from\s+([A-Za-z\s]+?)\s+to/i)
  const border = borderMatch ? borderMatch[1].trim() : "Nimroz"
  return `🇦🇫 Kandahar ➜ ${border}\n🇮🇷 Bandar Abbas ➜ 🇦🇪 Dubai / Jebel Ali ➜ 🇮🇳 Nhava Sheva`
}

export function formatTransitDetailsText(bol: WhatsAppBol): { en: string; fa: string } {
  const note = extractRouteNote(bol)
  const stops = [...(bol.routes ?? [])].sort((a, b) => a.stopOrder - b.stopOrder)
  const stopLocs = stops.map(s => cleanValue(s.location) || cleanValue(s.locationPersian)).filter(Boolean)
  const allContext = [
    note,
    ...stopLocs,
    cleanValue((bol as any).border_station),
    cleanValue((bol as any).borderStation),
    cleanValue((bol as any).border_crossing),
    cleanValue(bol.port_of_loading),
    cleanValue(bol.port_of_discharge),
    cleanValue(bol.place_of_delivery),
  ].join(" ")

  // Check if shipment is an Air / Land-Air corridor (e.g. Hairatan ➜ Tashkent Airport ➜ New Delhi Airport)
  const hasAir = stops.some(s => s.transportMode === "airplane") ||
    /tashkent|تاشکند|airport|میدان هوایی|delhi.*airport|air\s*freight/i.test(allContext)
  
  if (hasAir && /tashkent|تاشکند/i.test(allContext) && /delhi|دهلی/i.test(allContext)) {
    const hasKabul = /kabul|کابل/i.test(allContext)
    const viaKabulEn = hasKabul ? " via Kabul" : ""
    const viaKabulFa = hasKabul ? " (از طریق کابل)" : ""
    const borderEn = /hairatan|حیرتان/i.test(allContext) ? "Hairatan" : "Hairatan"
    const borderFa = /hairatan|حیرتان/i.test(allContext) ? "حیرتان" : "حیرتان"

    return {
      en: `Overland transport from Kandahar${viaKabulEn} to ${borderEn} border, then transit to Tashkent International Airport for air freight. Final destination: New Delhi, India.`,
      fa: `حمل زمینی از کندهار${viaKabulFa} به مرز ${borderFa}، سپس ترانزیت به میدان هوایی بین‌المللی تاشکند جهت حمل هوایی. مقصد نهایی: دهلی نو، هند.`,
    }
  }

  // 1. Detect border station
  let borderEn = "Nimroz"
  let borderFa = "نیمروز"

  if (/nimroz|نیمروز|milak|میلک/i.test(allContext)) {
    borderEn = "Nimroz"
    borderFa = "نیمروز"
  } else if (/dogh?aroun|dougharoun|دوغارون/i.test(allContext)) {
    borderEn = "Dogharoun"
    borderFa = "دوغارون"
  } else if (/islam\s*qala|اسلام\s*قلعه/i.test(allContext)) {
    borderEn = "Islam Qala"
    borderFa = "اسلام قلعه"
  } else if (/torghundi|تورغندی/i.test(allContext)) {
    borderEn = "Torghundi"
    borderFa = "تورغندی"
  } else if (/hairatan|حیرتان/i.test(allContext)) {
    borderEn = "Hairatan"
    borderFa = "حیرتان"
  } else if (/spin\s*boldak|اسپین\s*بولدک|chaman|چمن/i.test(allContext)) {
    borderEn = "Spin Boldak"
    borderFa = "اسپین بولدک"
  }

  // Check if Pakistan corridor
  if (/karachi|کراچی|port\s*qasim/i.test(allContext) && !/bandar\s*abbas|بندرعباس/i.test(allContext)) {
    return {
      en: `Standard container from ${borderEn} to Karachi Port, then refrigerated container to Dubai/Jebel Ali for Switch B/L. Final destination: Nhava Sheva, India.`,
      fa: `حمل با کانتینر معمولی از ${borderFa} به بندر کراچی، سپس با کانتینر یخچالی به دبی / جبل علی جهت تعویض بارنامه (Switch B/L). مقصد نهایی: بندر نهاوا شیوا، هند.`,
    }
  }

  // Check if Chabahar corridor
  if (/chabahar|چابهار/i.test(allContext) && !/bandar\s*abbas|بندرعباس/i.test(allContext)) {
    return {
      en: `Standard container from ${borderEn} to Chabahar Port, then refrigerated container to Dubai/Jebel Ali for Switch B/L. Final destination: Nhava Sheva, India.`,
      fa: `حمل با کانتینر معمولی از ${borderFa} به بندر چابهار، سپس با کانتینر یخچالی به دبی / جبل علی جهت تعویض بارنامه (Switch B/L). مقصد نهایی: بندر نهاوا شیوا، هند.`,
    }
  }

  // 2. Detect destination
  let destEn = "Nhava Sheva, India"
  let destFa = "بندر نهاوا شیوا، هند"

  if (/mundra|موندرا/i.test(allContext)) {
    destEn = "Mundra, India"
    destFa = "بندر موندرا، هند"
  } else if (/nhava\s*sheva|نهاوا\s*شیوا|jnpt|mumbai|بمبئی/i.test(allContext)) {
    destEn = "Nhava Sheva, India"
    destFa = "بندر نهاوا شیوا، هند"
  } else if (/mersin|مرسین/i.test(allContext)) {
    destEn = "Mersin, Turkey"
    destFa = "بندر مرسین، ترکیه"
  } else if (/dubai|jebel\s*ali|دبی|جبل\s*علی/i.test(allContext) && !/nhava|mundra|india|هند/i.test(allContext)) {
    destEn = "Dubai / Jebel Ali, UAE"
    destFa = "دبی / جبل علی، امارات"
  }

  // 3. Detect switch B/L location
  let switchLocEn = "Dubai/Jebel Ali"
  let switchLocFa = "دبی / جبل علی"
  if (/سوییچ\s*(?:بی\s*ال|b\/l|بارنامه)?\s*در\s*بندرعباس|switch.*bandar\s*abbas/i.test(allContext)) {
    switchLocEn = "Bandar Abbas"
    switchLocFa = "بندرعباس"
  } else if (/سوییچ\s*(?:بی\s*ال|b\/l|بارنامه)?\s*در\s*مرسین|switch.*mersin/i.test(allContext)) {
    switchLocEn = "Mersin, Turkey"
    switchLocFa = "بندر مرسین"
  }

  // 4. Detect container modes
  const isFullReefer = /تمام\s*مسیر.*یخچالی|full\s*way\s*reefer/i.test(allContext) ||
    /یخچالی.*از.*(دوغارون|اسلام قلعه|نیمروز).*یخچالی/i.test(allContext) ||
    /کانتینر\s*یخچالی.*کانتینر\s*یخچالی/i.test(allContext)

  const isAllDry = /کانتینر\s*معمولی.*کانتینر\s*معمولی/i.test(allContext) && !/یخچالی|reefer/i.test(allContext)

  // 5. Generate English and Persian sentences (Strictly matching user prompt specification)
  if (isFullReefer) {
    return {
      en: `Refrigerated container (Full Way Reefer) from ${borderEn} to Bandar Abbas, then refrigerated container to ${switchLocEn} for Switch B/L. Final destination: ${destEn}.`,
      fa: `حمل با کانتینر یخچالی (تمام مسیر یخچالی) از ${borderFa} به بندرعباس، سپس با کانتینر یخچالی به ${switchLocFa} جهت تعویض بارنامه (Switch B/L). مقصد نهایی: ${destFa}.`,
    }
  }

  if (isAllDry) {
    return {
      en: `Standard container from ${borderEn} to Bandar Abbas, then container to ${switchLocEn} for Switch B/L. Final destination: ${destEn}.`,
      fa: `حمل با کانتینر معمولی از ${borderFa} به بندرعباس، سپس با کانتینر معمولی به ${switchLocFa} جهت تعویض بارنامه (Switch B/L). مقصد نهایی: ${destFa}.`,
    }
  }

  return {
    en: `Standard container from ${borderEn} to Bandar Abbas, then refrigerated container to ${switchLocEn} for Switch B/L. Final destination: ${destEn}.`,
    fa: `حمل با کانتینر معمولی از ${borderFa} به بندرعباس، سپس با کانتینر یخچالی به ${switchLocFa} جهت تعویض بارنامه (Switch B/L). مقصد نهایی: ${destFa}.`,
  }
}

export function buildWhatsAppShipmentUpdate(bol: WhatsAppBol): string {
  const blNo = bol.bol_number || bol.carrier_bol_number || bol.internal_bol_number || ""
  const invoiceNo = extractInvoiceNumber(bol)
  const truck = formatTruckNumberExecutive(bol.truck_number)
  const shipper = getPartyName(bol.shipper_name)
  const consignee = getPartyName(bol.consignee_name)
  const rawCargo = cargoSummary(bol.cargo_description, bol.number_of_packages)
  const commodity = getBilingualCommodity(rawCargo)
  const packages = cleanPackageCount(bol.number_of_packages, bol.package_type)
  const netWeight = formatNumberWithCommas(withUnit(bol.net_weight, "KG"))
  const unitPrice = formatUnitPrice(bol)
  const route = formatTransitRouteExecutive(bol)
  const details = formatTransitDetailsText(bol)

  const docLines = [
    blNo ? `📄 *B/L No. / شماره بارنامه\u200E:* ${blNo}` : "",
    invoiceNo ? `🧾 *Invoice No. / شماره فاکتور\u200E:* ${invoiceNo}` : "",
    truck ? `🚚 *Truck No. / شماره موتر\u200E:* ${truck}` : "",
  ].filter(Boolean)

  const partyLines = [
    shipper ? `🏢 *Shipper / فرستنده\u200E:* ${shipper}` : "",
    consignee ? `🏢 *Consignee / گیرنده\u200E:* ${consignee}` : "",
  ].filter(Boolean)

  const cargoLines = [
    commodity ? `🍇 *Commodity / نوع کالا\u200E:* ${commodity}` : "",
    packages ? `📦 *Packages / تعداد کارتن\u200E:* ${packages}` : "",
    netWeight ? `⚖️ *Net Weight / وزن خالص\u200E:* ${netWeight}` : "",
    unitPrice ? `💵 *Unit Price / قیمت واحد\u200E:* ${unitPrice}` : "",
  ].filter(Boolean)

  if (!docLines.length && !cargoLines.length) return ""

  const routeBlock = [
    "🛣️ *TRANSIT ROUTE / مسیر ترانزیت\u200E:*",
    route,
  ].join("\n")

  const detailsBlock = [
    "🚛 *TRANSIT DETAILS / جزئیات ترانزیت\u200E:*",
    details.en,
    "",
    details.fa,
  ].join("\n")

  const sections = [
    "🚢 *SKY ARIANA LIMITED*\n📋 *SHIPMENT UPDATE / اطلاعیه حمل بار*\n━━━━━━━━━━━━━━━",
    docLines.join("\n"),
    partyLines.join("\n"),
    cargoLines.join("\n"),
    routeBlock,
    detailsBlock,
    "━━━━━━━━━━━━━━\n🌐 *SKY ARIANA LIMITED*\n🚢 *International Transportation & Logistics*\n*حمل\u200Cونقل بین\u200Cالمللی و خدمات لجستیکی*\n━━━━━━━━━━━━━━",
  ].filter(Boolean)

  return sections.join("\n\n")
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
