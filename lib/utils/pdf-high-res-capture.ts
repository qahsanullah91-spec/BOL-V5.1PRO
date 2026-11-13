import { PDFDocument } from "pdf-lib"

export interface EmbeddedFontPayload {
  notoSansRegular: string
  notoSansBold: string
  arabicRegular: string
  arabicBold: string
}

let cachedFontCssPayload: { key: string; css: string } | null = null

/**
 * Races an async capture step against a hard timeout so PDF export
 * can never hang indefinitely on stalled DOM, font, or canvas operations.
 */
export function withCaptureTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Timed out during PDF capture step.",
): Promise<T> {
  if (typeof window === "undefined") return promise
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    promise.then(
      (val) => {
        window.clearTimeout(timer)
        resolve(val)
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Generates embedded @font-face declarations for isolated SVG foreignObject
 * captures, mapping NotoSans, NotoNaskhArabic, and Vazirmatn cleanly without
 * duplicating multi-megabyte base64 blobs across redundant aliases.
 */
export function buildEmbeddedPdfFontCss(fonts: EmbeddedFontPayload | null | undefined): string {
  if (!fonts) return ""

  const cacheKey = `${fonts.notoSansRegular?.length || 0}:${fonts.notoSansBold?.length || 0}:${fonts.arabicRegular?.length || 0}:${fonts.arabicBold?.length || 0}`
  if (cachedFontCssPayload && cachedFontCssPayload.key === cacheKey) {
    return cachedFontCssPayload.css
  }

  const rules: string[] = []

  if (fonts.notoSansRegular) {
    rules.push(`
      @font-face {
        font-family: 'NotoSans';
        font-weight: 400;
        font-style: normal;
        src: url(data:font/truetype;charset=utf-8;base64,${fonts.notoSansRegular}) format('truetype');
      }
    `)
  }
  if (fonts.notoSansBold) {
    rules.push(`
      @font-face {
        font-family: 'NotoSans';
        font-weight: 700;
        font-style: normal;
        src: url(data:font/truetype;charset=utf-8;base64,${fonts.notoSansBold}) format('truetype');
      }
    `)
  }

  const arabicFamilies = ["NotoNaskhArabic", "Vazirmatn"]
  for (const family of arabicFamilies) {
    if (fonts.arabicRegular) {
      rules.push(`
        @font-face {
          font-family: '${family}';
          font-weight: 400;
          font-style: normal;
          src: url(data:font/truetype;charset=utf-8;base64,${fonts.arabicRegular}) format('truetype');
        }
      `)
    }
    if (fonts.arabicBold) {
      rules.push(`
        @font-face {
          font-family: '${family}';
          font-weight: 700;
          font-style: normal;
          src: url(data:font/truetype;charset=utf-8;base64,${fonts.arabicBold}) format('truetype');
        }
      `)
    }
  }

  const css = rules.join("\n")
  cachedFontCssPayload = { key: cacheKey, css }
  return css
}

/**
 * Waits for and inlines all <img> assets under rootElement as data URLs.
 * Fetches the raw source asset first so SVG logos/watermarks preserve infinite
 * vector clarity instead of being downsampled onto a 1x canvas before export.
 */
export async function inlineElementImagesPreservingVector(
  rootElement: HTMLElement | null | undefined,
  urlToDataUrl: (url?: string) => Promise<string | null>,
): Promise<void> {
  if (typeof window === "undefined" || !rootElement) return

  try {
    const imgElements = Array.from(rootElement.querySelectorAll("img"))
    const imgTasks = imgElements.map(async (img) => {
      try {
        if (img.loading === "lazy") {
          img.loading = "eager"
        }
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            window.setTimeout(resolve, 1500)
          })
        }
        if (typeof img.decode === "function") {
          try {
            await withCaptureTimeout(img.decode(), 1000).catch(() => {})
          } catch {}
        }
        if (img.src && !img.src.startsWith("data:")) {
          const fetchedDataUrl = await withCaptureTimeout(
            (async () => {
              const rawDataUrl = await urlToDataUrl(img.src)
              return rawDataUrl
            })(),
            3500,
          ).catch(() => null)
          if (fetchedDataUrl && fetchedDataUrl.startsWith("data:")) {
            img.src = fetchedDataUrl
            return
          }
          const canvas = document.createElement("canvas")
          const w = img.naturalWidth || img.width || 300
          const h = img.naturalHeight || img.height || 150
          if (w > 0 && h > 0) {
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (ctx) {
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = "high"
              ctx.drawImage(img, 0, 0, w, h)
              const dataUrl = canvas.toDataURL("image/png")
              if (dataUrl && dataUrl.length > 100 && dataUrl.startsWith("data:image/png")) {
                img.src = dataUrl
              }
            }
          }
        }
      } catch {}
    })

    // Also pre-inline CSS backgroundImage URLs (e.g. watermarks) so html-to-image doesn't stall fetching them
    const bgElements = Array.from(rootElement.querySelectorAll<HTMLElement>("[data-bol-watermark], [style*='background']"))
    const bgTasks = bgElements.map(async (el) => {
      try {
        const bg = el.style?.backgroundImage || ""
        const match = bg.match(/url\(["']?([^"')]+)["']?\)/i)
        const rawUrl = match?.[1]
        if (rawUrl && !rawUrl.startsWith("data:") && !rawUrl.startsWith("blob:")) {
          const dataUrl = await withCaptureTimeout(urlToDataUrl(rawUrl), 3500).catch(() => null)
          if (dataUrl && dataUrl.startsWith("data:")) {
            el.style.backgroundImage = `url('${dataUrl}')`
          }
        }
      } catch {}
    })

    await withCaptureTimeout(Promise.all([...imgTasks, ...bgTasks]), 5000).catch(() => {})
  } catch {}
}

function svgDataUrlToObjectUrl(svgDataUrl: string): string | null {
  if (typeof URL === "undefined" || typeof Blob === "undefined") return null
  if (!svgDataUrl.startsWith("data:image/svg+xml")) return null
  try {
    const commaIdx = svgDataUrl.indexOf(",")
    if (commaIdx === -1) return null
    const meta = svgDataUrl.slice(0, commaIdx)
    const payload = svgDataUrl.slice(commaIdx + 1)
    let svgContent: string
    if (meta.includes(";base64")) {
      svgContent = atob(payload)
    } else {
      try {
        svgContent = decodeURIComponent(payload)
      } catch {
        svgContent = unescape(payload)
      }
    }
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/**
 * Loads an SVG data URL into an HTMLImageElement with a bounded timeout so
 * exports never hang when an Electron window is hidden or minimized.
 * Uses a Blob Object URL when possible to avoid multi-megabyte data URI parser stalls.
 */
export function loadSvgImage(
  svgDataUrl: string,
  timeoutMs = 20000,
  timeoutMessage = "Timed out rasterizing the document page.",
): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = svgDataUrlToObjectUrl(svgDataUrl)
    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch {}
      }
    }

    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    image.onload = () => {
      window.clearTimeout(timer)
      cleanup()
      resolve(image)
    }
    image.onerror = () => {
      window.clearTimeout(timer)
      cleanup()
      reject(new Error("Failed to load serialized SVG for PDF export rasterization."))
    }
    image.crossOrigin = "anonymous"
    image.decoding = "async"
    image.src = objectUrl || svgDataUrl
  })
}

/**
 * Computes canvas dimensions scaled by targetRatio while staying strictly
 * within safe raster dimensions so Windows D3D11/ANGLE drivers never corrupt tiles.
 */
export function computeClampedCanvasDimensions(
  baseWidth: number,
  baseHeight: number,
  targetRatio: number,
  maxCanvasEdge = 4096,
): { width: number; height: number } {
  let width = Math.max(1, baseWidth) * targetRatio
  let height = Math.max(1, baseHeight) * targetRatio

  if (width > maxCanvasEdge || height > maxCanvasEdge) {
    const scaleDown = Math.min(maxCanvasEdge / width, maxCanvasEdge / height)
    width *= scaleDown
    height *= scaleDown
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}

/**
 * Draws an SVG/HTMLImageElement onto a CPU-backed white canvas (willReadFrequently: true,
 * alpha: false) to eliminate DirectX/ANGLE GPU texture readback corruption while preserving
 * crisp high-precision smoothing.
 */
export function drawImageHighQualityToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx =
    canvas.getContext("2d", { willReadFrequently: true, alpha: false }) ||
    canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Canvas 2D context is not available.")
  }
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, targetWidth, targetHeight)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  return canvas
}

/**
 * Uses Electron's Chromium printToPDF engine to produce a 100% infinite-resolution
 * vector PDF with selectable text and crisp SVG graphics directly from the print portal.
 * Returns null outside Electron or if no valid print portal is mounted.
 */
export async function captureElectronVectorPdf(
  mode: "bol" | "reports",
  options?: { landscape?: boolean },
): Promise<Blob | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null
  const skyDesktop = (window as unknown as {
    skyDesktop?: { getPreviewPdf?: (opts?: { landscape?: boolean; pageSize?: string }) => Promise<number[] | null> }
  }).skyDesktop
  if (typeof skyDesktop?.getPreviewPdf !== "function") return null

  const rootSelector = mode === "bol" ? "#bol-print-preview-root [data-bol-a4='true']" : "#sky-reports-print-root"
  const printRootEl = document.querySelector(rootSelector) as HTMLElement | null
  if (!printRootEl) return null

  const prevBodyMode = document.body.getAttribute("data-print-active")
  const prevHtmlMode = document.documentElement.getAttribute("data-print-active")

  try {
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {}
    }

    const imgs = Array.from(printRootEl.querySelectorAll("img"))
    await Promise.all(
      imgs.map(async (img) => {
        if (!img.complete) {
          await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            window.setTimeout(resolve, 1500)
          })
        }
        if (typeof img.decode === "function") {
          try {
            await img.decode()
          } catch {}
        }
      }),
    )

    document.body.setAttribute("data-print-active", mode)
    document.documentElement.setAttribute("data-print-active", mode)

    // Allow CSS @media print styles and any deferred portal content to settle
    await new Promise((resolve) => setTimeout(resolve, 80))

    const bytes = await skyDesktop.getPreviewPdf({
      pageSize: "A4",
      landscape: options?.landscape ?? false,
    })

    if (!bytes || !Array.isArray(bytes) || bytes.length < 100) {
      return null
    }

    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" })
    const header = await blob.slice(0, 5).text()
    if (header !== "%PDF-") {
      return null
    }
    return blob
  } catch (err) {
    console.warn("Electron native vector printToPDF fallback to raster:", err)
    return null
  } finally {
    if (prevBodyMode === null) {
      document.body.removeAttribute("data-print-active")
    } else {
      document.body.setAttribute("data-print-active", prevBodyMode)
    }
    if (prevHtmlMode === null) {
      document.documentElement.removeAttribute("data-print-active")
    } else {
      document.documentElement.setAttribute("data-print-active", prevHtmlMode)
    }
  }
}

/**
 * Merges multiple PDF Blobs sequentially into one unified PDF using pdf-lib.
 */
export async function mergePdfBlobs(blobs: Blob[]): Promise<Blob> {
  const validBlobs = blobs.filter((b) => b && b.size > 0)
  if (validBlobs.length === 1) return validBlobs[0]

  const merged = await PDFDocument.create()
  for (const blob of validBlobs) {
    const bytes = await blob.arrayBuffer()
    const srcDoc = await PDFDocument.load(bytes)
    const pages = await merged.copyPages(srcDoc, srcDoc.getPageIndices())
    for (const page of pages) {
      merged.addPage(page)
    }
  }
  const mergedBytes = await merged.save()
  return new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" })
}

/**
 * Detects whether a CSS value uses advanced/modern color functions (oklch, oklab, lab, lch, color-mix, color).
 */
export function hasUnsupportedColor(value?: string | null): boolean {
  if (!value) return false
  return /\b(?:lab|lch|oklab|oklch|color-mix|color)\(/i.test(value)
}

let colorConversionCanvas: HTMLCanvasElement | null = null
let colorConversionCtx: CanvasRenderingContext2D | null = null

/**
 * Converts ANY valid browser CSS color (including modern oklch, oklab, lab, lch, color-mix)
 * to standard rgba/hex representation using an off-screen canvas context.
 */
export function convertCssColorToRgb(colorStr?: string | null): string {
  if (!colorStr || colorStr === "transparent" || colorStr === "none" || colorStr === "inherit") {
    return colorStr || ""
  }
  if (!hasUnsupportedColor(colorStr)) {
    return colorStr
  }
  try {
    if (typeof document !== "undefined") {
      if (!colorConversionCanvas) {
        colorConversionCanvas = document.createElement("canvas")
        colorConversionCanvas.width = 1
        colorConversionCanvas.height = 1
        colorConversionCtx = colorConversionCanvas.getContext("2d", { willReadFrequently: true })
      }
      if (colorConversionCtx) {
        colorConversionCtx.fillStyle = "#000000"
        colorConversionCtx.fillStyle = colorStr
        const result = colorConversionCtx.fillStyle
        if (result && !hasUnsupportedColor(result)) {
          return result
        }
      }
    }
  } catch {}
  return "#0f172a"
}

export function setPDFStyle(
  element: HTMLElement | SVGElement,
  property: string,
  value: string,
): void {
  element.style.setProperty(property, value, "important")
}

export function getPDFBorderColor(className: string): string {
  if (className.includes("border-blue-")) return "#93c5fd"
  if (className.includes("border-red-")) return "#ff4d5f"
  if (className.includes("border-green-") || className.includes("border-emerald-")) return "#86efac"
  if (className.includes("border-purple-")) return "#c4b5fd"
  if (className.includes("border-amber-")) return "#fcd34d"
  return "#cbd5e1"
}

export function getPDFBoxShadow(className: string): string {
  if (className.includes("shadow-2xl")) return "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
  if (className.includes("shadow-lg")) return "0 10px 15px -3px rgba(15, 23, 42, 0.18)"
  if (className.includes("shadow-md")) return "0 4px 6px -1px rgba(15, 23, 42, 0.16)"
  if (className.includes("shadow-sm")) return "0 1px 2px 0 rgba(15, 23, 42, 0.12)"
  return "none"
}

export function getPDFTextColor(className: string, sourceStyle: CSSStyleDeclaration): string {
  if (className.includes("text-white")) return "#ffffff"
  if (className.includes("text-blue-100")) return "#dbeafe"
  if (className.includes("text-blue-400")) return "#60a5fa"
  if (className.includes("text-blue-500")) return "#3b82f6"
  if (className.includes("text-blue-600")) return "#2563eb"
  if (className.includes("text-blue-700")) return "#1d4ed8"
  if (className.includes("text-blue-800")) return "#1e40af"
  if (className.includes("text-red-400")) return "#f87171"
  if (className.includes("text-red-500")) return "#ef4444"
  if (className.includes("text-red-600")) return "#dc2626"
  if (className.includes("text-red-700")) return "#b91c1c"
  if (className.includes("text-red-800")) return "#991b1b"
  if (className.includes("text-green-600")) return "#16a34a"
  if (className.includes("text-green-700")) return "#15803d"
  if (className.includes("text-green-800")) return "#166534"
  if (className.includes("text-emerald-600")) return "#059669"
  if (className.includes("text-amber-600")) return "#d97706"
  if (className.includes("text-purple-600")) return "#9333ea"
  if (className.includes("text-cyan-600")) return "#0891b2"
  if (className.includes("text-sky-600")) return "#0284c7"
  if (className.includes("text-orange-600")) return "#ea580c"
  if (className.includes("text-gray-500")) return "#6b7280"
  if (className.includes("text-gray-600")) return "#4b5563"
  if (className.includes("text-gray-800")) return "#1f2937"

  if (sourceStyle.color && sourceStyle.color !== "rgba(0, 0, 0, 0)" && sourceStyle.color !== "transparent") {
    return convertCssColorToRgb(sourceStyle.color) || "#0f172a"
  }

  return "#0f172a"
}

export function getPDFBackgroundColor(className: string, sourceStyle: CSSStyleDeclaration): string {
  if (className.includes("bg-white/40")) return "rgba(255, 255, 255, 0.4)"
  if (className.includes("bg-white/50")) return "rgba(255, 255, 255, 0.5)"
  if (className.includes("bg-white/70")) return "rgba(255, 255, 255, 0.7)"
  if (className.includes("bg-white/80")) return "rgba(255, 255, 255, 0.8)"
  if (className.includes("bg-white/20")) return "rgba(255, 255, 255, 0.2)"
  if (className.includes("bg-blue-900/35")) return "rgba(30, 58, 138, 0.35)"
  if (className.includes("from-blue-500/10") || className.includes("to-blue-600/10")) return "#eff6ff"
  if (className.includes("from-green-500/10") || className.includes("to-green-600/10")) return "#f0fdf4"

  if (className.includes("from-blue-600") || className.includes("bg-blue-600") || className.includes("to-blue-800")) {
    return "#1e40ff"
  }
  if (className.includes("from-blue-500") || className.includes("to-blue-700") || className.includes("bg-blue-500")) {
    return "#1d4ed8"
  }
  if (className.includes("from-red-600") || className.includes("bg-red-600") || className.includes("to-rose-500")) {
    return "#ff263b"
  }
  if (className.includes("from-red-50") || className.includes("bg-red-50")) return "#fef2f2"
  if (className.includes("from-green-600") || className.includes("bg-green-600") || className.includes("from-emerald-600")) {
    return "#16a34a"
  }
  if (className.includes("from-green-500/10") || className.includes("bg-green-100") || className.includes("from-emerald-50")) {
    return "#f0fdf4"
  }
  if (className.includes("from-blue-50") || className.includes("bg-blue-50") || className.includes("bg-blue-100")) {
    return "#eff6ff"
  }
  if (className.includes("bg-white") || className.includes("via-white") || className.includes("from-white") || className.includes("to-white")) {
    return "#ffffff"
  }
  if (className.includes("bg-gray-50") || className.includes("from-gray-50")) return "#f9fafb"
  if (className.includes("bg-slate-50") || className.includes("from-slate-50")) return "#f8fafc"

  if (sourceStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && sourceStyle.backgroundColor !== "transparent") {
    return convertCssColorToRgb(sourceStyle.backgroundColor) || "transparent"
  }

  return "transparent"
}

export function getPDFBackgroundImage(className: string, sourceStyle: CSSStyleDeclaration): string {
  if (className.includes("from-blue-600") && className.includes("via-blue-700") && className.includes("to-blue-800")) {
    return "linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)"
  }
  if (className.includes("from-blue-600") && className.includes("to-blue-700")) {
    return "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)"
  }
  if (className.includes("from-blue-500") && className.includes("to-blue-700")) {
    return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
  }
  if (className.includes("from-red-600") && className.includes("to-rose-500")) {
    return "linear-gradient(90deg, #dc2626 0%, #f43f5e 100%)"
  }
  if (className.includes("from-red-50") && className.includes("to-white")) {
    return "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)"
  }
  if (className.includes("from-blue-50") && className.includes("via-white")) {
    return "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eff6ff 100%)"
  }
  if (className.includes("from-blue-50") && className.includes("to-white")) {
    return "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)"
  }
  if (className.includes("from-blue-300") && className.includes("to-blue-500")) {
    return "linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)"
  }
  if (className.includes("from-blue-500") && className.includes("to-blue-300")) {
    return "linear-gradient(90deg, #3b82f6 0%, #93c5fd 100%)"
  }
  if (className.includes("from-green-600") && className.includes("to-green-700")) {
    return "linear-gradient(90deg, #16a34a 0%, #15803d 100%)"
  }

  if (sourceStyle.backgroundImage && sourceStyle.backgroundImage !== "none") {
    if (!hasUnsupportedColor(sourceStyle.backgroundImage)) {
      return sourceStyle.backgroundImage
    }
  }

  return "none"
}

export function sanitizeElementForPDF(source: Element, target: Element): void {
  const sourceStyle = window.getComputedStyle(source)
  const targetElement = target as HTMLElement
  const className = source.getAttribute("class") || ""
  const textColor = getPDFTextColor(className, sourceStyle)
  const backgroundColor = getPDFBackgroundColor(className, sourceStyle)
  const backgroundImage = getPDFBackgroundImage(className, sourceStyle)
  const borderColor = getPDFBorderColor(className)
  const boxShadow = getPDFBoxShadow(className)
  const isBOLBadge = source.getAttribute("data-pdf-bol-badge") === "true"
  const isBOLNumber = source.getAttribute("data-pdf-bol-number") === "true"

  setPDFStyle(targetElement, "color", isBOLNumber || isBOLBadge ? "#1e40af" : textColor)
  setPDFStyle(targetElement, "background-color", isBOLBadge ? "#ffffff" : backgroundColor)
  setPDFStyle(targetElement, "background-image", backgroundImage)
  setPDFStyle(targetElement, "border-color", borderColor)
  setPDFStyle(targetElement, "border-top-color", borderColor)
  setPDFStyle(targetElement, "border-right-color", borderColor)
  setPDFStyle(targetElement, "border-bottom-color", borderColor)
  setPDFStyle(targetElement, "border-left-color", borderColor)
  setPDFStyle(targetElement, "outline-color", "#2563eb")
  setPDFStyle(targetElement, "text-decoration-color", textColor)
  setPDFStyle(targetElement, "box-shadow", boxShadow)
  setPDFStyle(targetElement, "opacity", "1")
  setPDFStyle(targetElement, "visibility", "visible")
  setPDFStyle(targetElement, "backdrop-filter", "none")
  setPDFStyle(targetElement, "-webkit-backdrop-filter", "none")

  if (isBOLBadge) {
    setPDFStyle(targetElement, "display", "inline-flex")
    setPDFStyle(targetElement, "align-items", "center")
    setPDFStyle(targetElement, "justify-content", "center")
    setPDFStyle(targetElement, "min-width", "150px")
    setPDFStyle(targetElement, "min-height", "34px")
  }

  if (isBOLNumber) {
    setPDFStyle(targetElement, "display", "block")
    setPDFStyle(targetElement, "font-family", "Arial, Helvetica, sans-serif")
    setPDFStyle(targetElement, "font-size", "13px")
    setPDFStyle(targetElement, "font-weight", "700")
    setPDFStyle(targetElement, "line-height", "1.2")
    setPDFStyle(targetElement, "white-space", "nowrap")
  }

  if (backgroundImage === "none" && hasUnsupportedColor(sourceStyle.backgroundImage)) {
    setPDFStyle(targetElement, "background-image", "none")
  }

  if (target instanceof SVGElement) {
    setPDFStyle(target, "color", textColor)
    setPDFStyle(target, "fill", sourceStyle.fill === "none" ? "none" : textColor)
    setPDFStyle(target, "stroke", sourceStyle.stroke === "none" ? "none" : textColor)
  }

  Array.from(source.children).forEach((sourceChild, index) => {
    const targetChild = target.children.item(index)
    if (targetChild) {
      sanitizeElementForPDF(sourceChild, targetChild)
    }
  })
}
