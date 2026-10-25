export interface RouteLeg {
  origin: string
  containerType: string
  isReefer: boolean
  isDry: boolean
  raw: string
}

export interface ParsedLogisticsRoute {
  originalText: string
  isStructured: boolean
  legs: RouteLeg[]
  switchBlBadge: string | null
  reeferBadge: string | null
  destinationBadge?: string | null
}

const KNOWN_TRANSIT_LOCATIONS = [
  // ─── Turkish Ports / Mediterranean Hubs ───
  "بندر مرسین ترکیه",
  "بندر مرسین",
  "مرسین ترکیه",
  "مرسین",

  // ─── UAE Hamriya Port (Sharjah) ───
  "بندر حمریه (شارجه)",
  "بندر حمریه شارجه",
  "بندر حمریه",
  "بندر حمرية (شارجه)",
  "بندر حمرية شارجه",
  "بندر حمرية",
  "حمریه (شارجه)",
  "حمریه شارجه",
  "حمریه",
  "حمرية (شارجه)",
  "حمرية شارجه",
  "حمرية",

  // ─── Oman Sohar Port ───
  "بندر صحار (عمان)",
  "بندر صحار عمان",
  "بندر صحار",
  "صحار (عمان)",
  "صحار عمان",
  "صحار",

  // ─── UAE Jebel Ali / Dubai Hubs ───
  "بندر جبل علی (دبی)",
  "بندر جبل علی",
  "جبل علی / دبی",
  "دبی / جبل علی",
  "جبل علی (دبی)",
  "جبل علی",
  "دبی",

  // ─── Iranian Transit Ports & Borders ───
  "بندرعباس",
  "بندر چابهار",
  "چابهار",
  "میرجاوه",
  "دوغارون",

  // ─── Pakistan Ports & Borders ───
  "بندر کراچی",
  "کراچی",
  "اسپین بولدک",
  "سپین بولدک",

  // ─── Indian Destination Ports ───
  "بندر موندرا (Mundra)",
  "بندر موندرا",
  "موندرا / نهاوا شیوا هند",
  "موندرا هند",
  "موندرا",
  "بندر نهاوا شیوا (Nhava Sheva)",
  "بندر نهاوا شیوا",
  "نهاوا شیوا (Nhava Sheva)",
  "نهاوا شیوا",
  "Nhava Sheva",

  // ─── Afghan Border Stations & Terminals ───
  "اسلام قلعه",
  "تورغندی",
  "حیرتان",
  "نیمروز",
  "مقصد نهایی",
  "هرات",
  "کابل",
  "قندهار",
  "مزار شریف",
]

/**
 * Parses a raw logistics route directive text (such as "از نیمروز کانتینر معمولی از بندرعباس کانتینر یخچالی (با سوییچ بی ال در دبی / جبل علی)")
 * into structured multi-leg segments, container type indicators, switch B/L instructions, and destinations.
 */
export function parseLogisticsRoute(rawText?: string | null): ParsedLogisticsRoute {
  if (!rawText || typeof rawText !== "string") {
    return {
      originalText: "",
      isStructured: false,
      legs: [],
      switchBlBadge: null,
      reeferBadge: null,
      destinationBadge: null,
    }
  }

  const text = rawText.trim()
  if (!text) {
    return {
      originalText: "",
      isStructured: false,
      legs: [],
      switchBlBadge: null,
      reeferBadge: null,
      destinationBadge: null,
    }
  }

  // 1. Extract Reefer condition badge: e.g. "(تمام مسیر یخچالی - Full Way Reefer)" or "(Full Way Reefer)"
  let reeferBadge: string | null = null
  const reeferMatch = text.match(/\(([^)]*(?:Full\s*Way\s*Reefer|تمام\s*مسیر\s*یخچالی)[^)]*)\)/i)
  if (reeferMatch) {
    reeferBadge = reeferMatch[1].trim()
  } else if (text.includes("تمام مسیر کانتینر یخچالی") || text.includes("تمام مسیر یخچالی") || /full\s*way\s*reefer/i.test(text)) {
    reeferBadge = "تمام مسیر یخچالی (Full Way Reefer)"
  } else {
    // Only capture parenthesis reefer note if it is not just a container specification
    const generalReeferMatch = text.match(/\(([^)]*(?:Reefer|یخچالی)[^)]*)\)/i)
    if (generalReeferMatch && !/^(?:Reefer|یخچالی)$/i.test(generalReeferMatch[1].trim())) {
      reeferBadge = generalReeferMatch[1].trim()
    }
  }

  // 2. Extract Switch B/L directive: e.g. "(با سوییچ بی ال در دبی / جبل علی)" or "با سوییچ B/L در بندر حمریه (شارجه)"
  let switchBlBadge: string | null = null
  const switchBlRegex = /(?:\(?\s*(?:با\s+)?سوی[ی]?چ\s*(?:بی\s*ال|B\/L|بارنامه)(?:\s+در\s+([^,\.؛،\n()]+(?:\([^()]+\)[^,\.؛،\n()]*)?))?\s*\)?)/i
  const switchMatch = text.match(switchBlRegex)
  if (switchMatch) {
    const loc = switchMatch[1] ? switchMatch[1].trim() : ""
    switchBlBadge = loc ? `سوییچ بی ال در ${loc}` : "با سوییچ بی ال"
  }

  // 3. Extract Destination directive: e.g. "مقصد نهایی: نهاوا شیوا (Nhava Sheva)" or "به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند"
  let destinationBadge: string | null = null
  const destMatch = text.match(/(?:مقصد\s*(?:نهایی)?[:\s]+)([^,\.؛،\n]+)/i)
  if (destMatch) {
    destinationBadge = destMatch[1].trim()
  }

  // 4. Extract multi-leg segments starting with "از ..."
  let cleanedForLegs = text
    .replace(/[🗺️📦❄️🔄📍]/g, " ")
    .replace(/^[\s🗺️📦❄️🔄📍]*(?:مسیر(?:\s*حمل\s*کانتینر)?[:\s]+)+/gi, " ")
    .replace(switchBlRegex, "")
    .replace(/\([^)]*(?:Full\s*Way\s*Reefer|تمام\s*مسیر\s*یخچالی)[^)]*\)/gi, "")
    .replace(/(?:و\s+)?مقصد\s*(?:نهایی)?[:\s]+[^,\.؛،\n]+/gi, "")
    .trim()

  // Normalize inverted Persian phrasing: "سپس با کانتینر یخچالی از بندرعباس" -> "از بندرعباس با کانتینر یخچالی"
  for (const loc of KNOWN_TRANSIT_LOCATIONS) {
    const escaped = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`سپس\\s+((?:با\\s+)?کانتینر\\s+(?:یخچالی|معمولی)[^از]*)\\s+از\\s+(${escaped})`, "g")
    cleanedForLegs = cleanedForLegs.replace(regex, (_, cont, matchedLoc) => `از ${matchedLoc} ${cont}`)
  }
  cleanedForLegs = cleanedForLegs.replace(
    /سپس\s+((?:با\s+)?کانتینر\s+(?:یخچالی|معمولی)[^از]*)\s+از\s+([^\s،,]+(?:\s+[^\s،,]+)?)/g,
    (_, cont, loc) => `از ${loc} ${cont}`
  )

  const legs: RouteLeg[] = []
  const rawParts = cleanedForLegs.split(/(?=از\s+)/).map((p) => p.trim()).filter(Boolean)

  for (const part of rawParts) {
    if (!part.startsWith("از")) continue

    let matchedLocation = ""
    const afterAz = part.replace(/^از\s+/, "").trim()
    for (const loc of KNOWN_TRANSIT_LOCATIONS) {
      if (afterAz.startsWith(loc)) {
        matchedLocation = loc
        break
      }
    }
    if (!matchedLocation) {
      const tokens = afterAz.split(/\s+/)
      if (tokens[0] === "اسلام" || tokens[0] === "اسپین" || tokens[0] === "سپین" || tokens[0] === "بندر") {
        matchedLocation = `${tokens[0]} ${tokens[1] || ""}`.trim()
      } else {
        matchedLocation = tokens[0] || ""
      }
    }

    const isReefer = part.includes("یخچالی") || part.toLowerCase().includes("reefer")
    const isDry = part.includes("معمولی") || part.toLowerCase().includes("dry")
    const containerType = isReefer ? "کانتینر یخچالی" : isDry ? "کانتینر معمولی" : ""

    legs.push({
      origin: `از ${matchedLocation}`.trim(),
      containerType,
      isReefer,
      isDry,
      raw: part,
    })
  }

  const isStructured = legs.length > 0 || Boolean(switchBlBadge) || Boolean(reeferBadge)

  return {
    originalText: text,
    isStructured,
    legs,
    switchBlBadge,
    reeferBadge,
    destinationBadge,
  }
}
