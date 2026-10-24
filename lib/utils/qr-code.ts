import QRCode from "qrcode"

export interface QrCodeMatrixResult {
  size: number
  moduleCount: number
  path: string
  url: string
  margin: number
  svgString: string
  modules: boolean[][]
}

export interface QrCodeOptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  margin?: number
  customOrigin?: string
}

/**
 * Returns the canonical verification URL for a Bill of Lading.
 * If the input already starts with http:// or https://, it returns it unchanged.
 */
export function getBolVerificationUrl(bolNumber?: string, customOrigin?: string): string {
  const raw = (bolNumber || "SKY-BOL").trim()
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw
  }

  // Determine origin safely
  let origin = customOrigin
  if (!origin) {
    if (typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("localhost")) {
      origin = window.location.origin
    } else {
      origin = process.env.NEXT_PUBLIC_APP_URL || "https://skyarianabl.vercel.app"
    }
  }
  // Remove trailing slashes
  origin = origin.replace(/\/+$/, "")

  return `${origin}/?bol=${encodeURIComponent(raw)}&tab=preview`
}

/**
 * Generates standards-compliant ISO/IEC 18004 QR code matrix data and SVG paths.
 * Fully offline-capable and synchronous, safe for SSR, Node.js, and browser runtimes.
 */
export function generateQrMatrix(
  input: string,
  options?: QrCodeOptions
): QrCodeMatrixResult {
  const url = getBolVerificationUrl(input, options?.customOrigin)
  const margin = options?.margin ?? 2
  const errorCorrectionLevel = options?.errorCorrectionLevel ?? "M"

  try {
    const qr = QRCode.create(url, { errorCorrectionLevel })
    const moduleCount = qr.modules.size
    const size = moduleCount + margin * 2

    const modules: boolean[][] = []
    let path = ""
    for (let r = 0; r < moduleCount; r++) {
      const row: boolean[] = []
      for (let c = 0; c < moduleCount; c++) {
        const isDark = Boolean(qr.modules.get(r, c))
        row.push(isDark)
        if (isDark) {
          path += `M${c + margin},${r + margin}h1v1h-1z `
        }
      }
      modules.push(row)
    }

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${path}" fill="#0f172a"/></svg>`

    return {
      size,
      moduleCount,
      path,
      url,
      margin,
      svgString,
      modules,
    }
  } catch (err) {
    console.error("[QR Code] Generation failed for input:", input, err)
    const size = 25
    return {
      size,
      moduleCount: 21,
      path: "",
      url,
      margin: 2,
      svgString: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff"/></svg>`,
      modules: [],
    }
  }
}
