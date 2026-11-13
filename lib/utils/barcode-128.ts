/**
 * Code 128 (Subset B) Barcode Generator
 * Conforms to ISO/IEC 15417 specification.
 * Zero-dependency, offline-capable, SSR/Node/Browser compatible.
 */

// 107 patterns of Code 128:
// Indices 0-105 are 6-character strings representing module widths: [bar, space, bar, space, bar, space] (total 11 modules).
// Index 106 is STOP pattern: 7-character string: [bar, space, bar, space, bar, space, bar] (total 13 modules).
const CODE128_PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112", // 100-106 (104=Start B, 106=Stop)
]

export interface BarcodeBar {
  x: number
  width: number
}

export interface Barcode128Result {
  bars: BarcodeBar[]
  totalWidth: number
  height: number
  svgPath: string
  svgString: string
  encodedText: string
  checksum: number
}

export interface Barcode128Options {
  height?: number
  quietZone?: number
  barColor?: string
}

/**
 * Encodes text into Code 128 (Subset B) barcode bar coordinates and SVG path.
 */
export function generateBarcode128(
  rawText: string,
  options?: Barcode128Options
): Barcode128Result {
  const height = options?.height ?? 24
  const quietZone = options?.quietZone ?? 10
  const barColor = options?.barColor ?? "#000000"

  // Sanitize input to printable ASCII (32 to 126)
  let text = ""
  for (let i = 0; i < (rawText || "").length; i++) {
    const code = rawText.charCodeAt(i)
    if (code >= 32 && code <= 126) {
      text += rawText[i]
    }
  }

  if (!text) {
    text = "BOL"
  }

  // Code 128 (Subset B) sequence:
  // Start Code B is index 104
  const codes: number[] = [104]
  let checkSumTotal = 104

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) - 32
    codes.push(charCode)
    checkSumTotal += (i + 1) * charCode
  }

  const checksum = checkSumTotal % 103
  codes.push(checksum)
  codes.push(106) // STOP code

  // Build bars
  let currentX = quietZone
  const bars: BarcodeBar[] = []
  let svgPath = ""

  for (let c = 0; c < codes.length; c++) {
    const pattern = CODE128_PATTERNS[codes[c]]
    let isBar = true

    for (let p = 0; p < pattern.length; p++) {
      const w = parseInt(pattern[p], 10)
      if (isBar) {
        bars.push({ x: currentX, width: w })
        svgPath += `M${currentX},0h${w}v${height}h-${w}z `
      }
      currentX += w
      isBar = !isBar
    }
  }

  const totalWidth = currentX + quietZone

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="shape-rendering:crispEdges"><path d="${svgPath.trim()}" fill="${barColor}"/></svg>`

  return {
    bars,
    totalWidth,
    height,
    svgPath: svgPath.trim(),
    svgString,
    encodedText: text,
    checksum,
  }
}
