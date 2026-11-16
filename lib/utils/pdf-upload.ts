"use client"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import { COMPANY_STAMP_SIGNATURE_DATA_URL, getCompanyStampDataUrl } from "@/lib/company-stamp-fallback"
import { isPashtoOrArabic, prepareBidiPdfText } from "@/lib/utils/pashto-bidi"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { isUUID } from "@/lib/utils/bol-filters"
import {
  buildEmbeddedPdfFontCss,
  inlineElementImagesPreservingVector,
  loadSvgImage,
  computeClampedCanvasDimensions,
  drawImageHighQualityToCanvas,
  captureElectronVectorPdf,
  withCaptureTimeout,
  convertCssColorToRgb,
  hasUnsupportedColor,
  setPDFStyle,
  getPDFTextColor,
  getPDFBackgroundColor,
  getPDFBackgroundImage,
  getPDFBorderColor,
  getPDFBoxShadow,
  sanitizeElementForPDF,
} from "@/lib/utils/pdf-high-res-capture"

// Dynamically import PDF libraries only in browser environment
let html2canvasLib: any = null
let jsPDFConstructor: any = null
let jsPDFOnlyConstructor: any = null
let pdfFontAssets:
  | {
      notoSansRegular: string
      notoSansBold: string
      arabicRegular: string
      arabicBold: string
    }
  | null = null

async function loadPDFLibraries() {
  if (html2canvasLib && jsPDFConstructor) {
    return { html2canvas: html2canvasLib, jsPDF: jsPDFConstructor }
  }

  if (typeof window === "undefined") {
    throw new Error("PDF generation only works in browser")
  }

  try {
    html2canvasLib = (await import("html2canvas")).default
    // @ts-ignore - jsPDF ships this browser bundle without a separate declaration file.
    jsPDFConstructor = (await import("jspdf/dist/jspdf.es.min.js")).jsPDF
    return { html2canvas: html2canvasLib, jsPDF: jsPDFConstructor }
  } catch (error) {
    throw new Error(`Failed to load PDF libraries: ${error}`)
  }
}

/**
 * Preload PDF generation libraries in background for faster subsequent PDF generation
 */
export async function preloadBOLPDFGeneration(): Promise<void> {
  try {
    await loadPDFLibraries()
  } catch {
    // Non-critical background prefetch
  }
}

async function loadJSPDFLibrary() {
  if (jsPDFConstructor || jsPDFOnlyConstructor) {
    return jsPDFConstructor || jsPDFOnlyConstructor
  }

  if (typeof window === "undefined") {
    throw new Error("PDF generation only works in browser")
  }

  try {
    // @ts-ignore - jsPDF ships this browser bundle without a separate declaration file.
    jsPDFOnlyConstructor = (await import("jspdf/dist/jspdf.es.min.js")).jsPDF
    return jsPDFOnlyConstructor
  } catch (error) {
    throw new Error(`Failed to load PDF library: ${error}`)
  }
}

async function normalizePDFBlob(pdfBlob: Blob): Promise<Blob> {
  const normalizedBlob =
    pdfBlob.type === "application/pdf"
      ? pdfBlob
      : new Blob([pdfBlob], { type: "application/pdf" })

  const header = await normalizedBlob.slice(0, 5).text()
  if (header !== "%PDF-") {
    throw new Error("Generated file is not a valid PDF. Please try again.")
  }

  return normalizedBlob
}

type ModernBOLPDFOptions = {
  bolNumber: string
  issueDate: string
  persianDateNumeric: string
  formData: BillOfLadingFormData
  logoUrl?: string
  companyName?: string
  companyNamePersian?: string
  companySubtitle?: string
  companyPhone?: string
  companyEmail?: string
  companyAddress?: string
  companyLicence?: string
  onProgress?: (progress: number, message: string) => void
}

type PDFDetailItem = {
  label: string
  value?: string | null
  important?: boolean
}

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const PAGE_MARGIN = 8
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const BLUE = [37, 99, 235] as const
const BLUE_DARK = [30, 64, 175] as const
const CYAN = [8, 145, 178] as const
const SKY_BG = [239, 246, 255] as const
const BORDER_BLUE = [147, 197, 253] as const
const TEXT_DARK = [15, 23, 42] as const
const TEXT_MUTED = [71, 85, 105] as const

function cleanPDFText(value?: string | null) {
  if (!value) return ""
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function hasPDFValue(value?: string | null) {
  return cleanPDFText(value).length > 0
}

function containsArabic(value: string) {
  return isPashtoOrArabic(value)
}

function truncateText(value: string, maxLength: number) {
  const text = cleanPDFText(value)
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function fetchAsBase64(url: string) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null
  const timer = controller && typeof window !== "undefined" ? window.setTimeout(() => controller.abort(), 5000) : null
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined)
    if (!response.ok) {
      throw new Error(`Failed to load asset: ${url}`)
    }
    const dataUrl = await blobToDataURL(await response.blob())
    return dataUrl.split(",")[1] || ""
  } finally {
    if (timer !== null && typeof window !== "undefined") {
      window.clearTimeout(timer)
    }
  }
}

async function fetchImageDataURL(url?: string) {
  try {
    const source = url || "/images/logo.png"
    if (source.startsWith("data:")) return source
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null
    const timer = controller && typeof window !== "undefined" ? window.setTimeout(() => controller.abort(), 5000) : null
    try {
      const response = await fetch(source, controller ? { signal: controller.signal } : undefined)
      if (!response.ok) return null
      return blobToDataURL(await response.blob())
    } finally {
      if (timer !== null && typeof window !== "undefined") {
        window.clearTimeout(timer)
      }
    }
  } catch {
    return null
  }
}

export async function loadPDFFontAssets() {
  if (pdfFontAssets) return pdfFontAssets

  const [notoSansRegular, notoSansBold, arabicRegular, arabicBold] = await Promise.all([
    fetchAsBase64("/fonts/NotoSans-Regular.ttf"),
    fetchAsBase64("/fonts/NotoSans-Bold.ttf"),
    fetchAsBase64("/fonts/NotoNaskhArabic-Regular.ttf"),
    fetchAsBase64("/fonts/NotoNaskhArabic-Bold.ttf"),
  ])

  pdfFontAssets = {
    notoSansRegular,
    notoSansBold,
    arabicRegular,
    arabicBold,
  }

  return pdfFontAssets
}

async function registerPDFFonts(doc: any) {
  const fontList = typeof doc.getFontList === "function" ? doc.getFontList() : null
  if (fontList?.NotoSans && fontList?.NotoNaskhArabic) return

  const { notoSansRegular, notoSansBold, arabicRegular, arabicBold } = await loadPDFFontAssets()

  doc.addFileToVFS("NotoSans-Regular.ttf", notoSansRegular)
  doc.addFileToVFS("NotoSans-Bold.ttf", notoSansBold)
  doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", arabicRegular)
  doc.addFileToVFS("NotoNaskhArabic-Bold.ttf", arabicBold)
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal")
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold")
  doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskhArabic", "normal")
  doc.addFont("NotoNaskhArabic-Bold.ttf", "NotoNaskhArabic", "bold")
}

function setColor(doc: any, rgb: readonly number[], target: "text" | "draw" | "fill") {
  if (target === "text") doc.setTextColor(rgb[0], rgb[1], rgb[2])
  if (target === "draw") doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  if (target === "fill") doc.setFillColor(rgb[0], rgb[1], rgb[2])
}

function setPDFTextStyle(doc: any, text: string, size: number, weight: "normal" | "bold" = "normal") {
  doc.setFont(containsArabic(text) ? "NotoNaskhArabic" : "NotoSans", weight)
  doc.setFontSize(size)
}

function preparePDFText(doc: any, text: string) {
  if (isPashtoOrArabic(text)) {
    return prepareBidiPdfText(text)
  }
  return text
}

function drawText(
  doc: any,
  text: string,
  x: number,
  y: number,
  options: {
    size?: number
    weight?: "normal" | "bold"
    color?: readonly number[]
    align?: "left" | "center" | "right"
    maxWidth?: number
    lineHeight?: number
  } = {}
) {
  const value = cleanPDFText(text)
  if (!value) return 0

  const size = options.size ?? 8
  const lineHeight = options.lineHeight ?? size * 0.38
  setPDFTextStyle(doc, value, size, options.weight ?? "normal")
  setColor(doc, options.color ?? TEXT_DARK, "text")

  const lines = value
    .split("\n")
    .flatMap((line) => {
      const prepared = preparePDFText(doc, line)
      return options.maxWidth ? doc.splitTextToSize(prepared, options.maxWidth) : [prepared]
    })

  lines.forEach((line: string, index: number) => {
    doc.text(line, x, y + index * lineHeight, { align: options.align ?? "left", baseline: "top" })
  })

  return Math.max(lineHeight, lines.length * lineHeight)
}

function roundedCard(
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: readonly number[] = [255, 255, 255],
  stroke: readonly number[] = BORDER_BLUE,
  radius = 2.4
) {
  setColor(doc, fill, "fill")
  setColor(doc, stroke, "draw")
  doc.setLineWidth(0.25)
  doc.roundedRect(x, y, width, height, radius, radius, "FD")
}

function drawTransportIcon(doc: any, x: number, y: number, mode?: string, size = 7) {
  const cx = x
  const cy = y
  const s = size
  setColor(doc, BLUE, "fill")
  doc.setLineWidth(0.4)

  if (mode === "truck" || mode === "road") {
    // simple truck: trailer + cab + wheels
    setColor(doc, BLUE, "fill")
    doc.rect(cx, cy + s * 0.25, s * 0.9, s * 0.45, "F")
    doc.rect(cx + s * 0.6, cy, s * 0.35, s * 0.5, "F")
    setColor(doc, [0, 0, 0], "fill")
    doc.circle(cx + s * 0.2, cy + s * 0.82, s * 0.16, "F")
    doc.circle(cx + s * 0.68, cy + s * 0.82, s * 0.16, "F")
    return
  }

  if (mode === "vessel" || mode === "ship") {
    // simple vessel: deck + hull ellipse
    setColor(doc, BLUE, "fill")
    doc.rect(cx + s * 0.05, cy + s * 0.15, s * 0.9, s * 0.28, "F")
    setColor(doc, BLUE_DARK, "fill")
    // hull as ellipse-like shape (ellipse exists in jspdf)
    if (typeof doc.ellipse === "function") {
      doc.ellipse(cx + s * 0.5, cy + s * 0.78, s * 0.5, s * 0.22, "F")
    } else {
      doc.rect(cx + s * 0.15, cy + s * 0.6, s * 0.7, s * 0.2, "F")
    }
    return
  }

  if (mode === "airplane") {
    // simple airplane: fuselage + wings
    setColor(doc, BLUE, "fill")
    doc.rect(cx + s * 0.12, cy + s * 0.32, s * 0.76, s * 0.22, "F")
    setColor(doc, BLUE_DARK, "fill")
    doc.rect(cx + s * 0.02, cy + s * 0.4, s * 0.28, s * 0.08, "F")
    doc.rect(cx + s * 0.7, cy + s * 0.4, s * 0.28, s * 0.08, "F")
    return
  }

  // default: small filled circle
  setColor(doc, BLUE, "fill")
  doc.circle(cx + s / 2, cy + s / 2, s / 2, "F")
}

function drawRouteLegend(doc: any, x: number, y: number, size = 7) {
  const items: { mode: string; label: string }[] = [
    { mode: "truck", label: "Truck / Road" },
    { mode: "vessel", label: "Vessel / Ship" },
    { mode: "airplane", label: "Air / Airplane" },
    { mode: "train", label: "Train" },
  ]
  const padding = 3
  const itemW = 40
  const width = items.length * itemW + padding * 2
  const height = size + 4
  roundedCard(doc, x, y, width, height, [255, 255, 255], BORDER_BLUE, 1.8)
  let cx = x + padding
  items.forEach((it) => {
    drawTransportIcon(doc, cx, y + 1, it.mode, size)
    drawText(doc, it.label, cx + size + 2, y + 1.4, { size: 5.6, color: TEXT_DARK, maxWidth: itemW - size - 4 })
    cx += itemW
  })
  return height
}

function blueSectionHeader(
  doc: any,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  width: number,
  height = 8
) {
  setColor(doc, BLUE, "fill")
  setColor(doc, BLUE, "draw")
  doc.roundedRect(x, y, width, height, 2.2, 2.2, "F")
  setColor(doc, CYAN, "fill")
  doc.rect(x + width * 0.58, y, width * 0.42, height, "F")
  drawText(doc, title, x + 4, y + 2.1, { size: 9.8, weight: "bold", color: [255, 255, 255] })
  if (subtitle) {
    drawText(doc, subtitle, x + width - 4, y + 1.8, {
      size: 10,
      weight: "bold",
      color: [255, 255, 255],
      align: "right",
    })
  }
}

function drawDetailCard(
  doc: any,
  item: PDFDetailItem,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const compact = height <= 15
  roundedCard(doc, x, y, width, height, [255, 255, 255], BORDER_BLUE, 1.6)
  drawText(doc, item.label || "", x + 2, y + 1.6, {
    size: compact ? 5.0 : 5.6,
    weight: "bold",
    color: BLUE,
    maxWidth: width - 4,
    lineHeight: 2.2,
  })
  drawText(doc, item.value || "", x + 2, y + (compact ? 5.2 : 6.2), {
    size: compact ? (item.important ? 6.4 : 5.8) : item.important ? 7.4 : 6.6,
    weight: item.important ? "bold" : "normal",
    color: TEXT_DARK,
    maxWidth: width - 4,
    lineHeight: 2.5,
  })
}

function drawPartyCard(
  doc: any,
  title: string,
  subtitle: string,
  name: string | undefined,
  address: string | undefined,
  contact: string | undefined,
  email: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number
) {
  roundedCard(doc, x, y, width, height, [255, 255, 255], BORDER_BLUE, 2)
  setColor(doc, SKY_BG, "fill")
  doc.roundedRect(x, y, width, 7, 2, 2, "F")
  drawText(doc, title, x + 3, y + 1.8, { size: 7.5, weight: "bold", color: TEXT_DARK })
  drawText(doc, subtitle, x + width - 3, y + 1.8, { size: 6.2, weight: "bold", color: BLUE, align: "right" })
  let cursorY = y + 8.5
  if (hasPDFValue(name)) {
    cursorY += drawText(doc, truncateText(name || "", 64), x + 3, cursorY, {
      size: 7.6,
      weight: "bold",
      color: TEXT_DARK,
      maxWidth: width - 6,
      lineHeight: 2.8,
    }) + 0.5
  }
  if (hasPDFValue(address) && cursorY < y + height - 4) {
    const addressLines = cleanPDFText(address).split("\n").slice(0, 2).join(" ")
    cursorY += drawText(doc, addressLines, x + 3, cursorY, {
      size: 6.0,
      weight: "normal",
      color: TEXT_DARK,
      maxWidth: width - 6,
      lineHeight: 2.6,
    }) + 0.5
  }
  if (hasPDFValue(contact) && cursorY < y + height - 3) {
    cursorY += drawText(doc, contact || "", x + 3, cursorY, {
      size: 5.8,
      weight: "bold",
      color: TEXT_DARK,
      maxWidth: width - 6,
      lineHeight: 2.5,
    }) + 0.5
  }
  if (hasPDFValue(email) && cursorY < y + height - 3) {
    drawText(doc, email || "", x + 3, cursorY, {
      size: 5.6,
      weight: "normal",
      color: TEXT_MUTED,
      maxWidth: width - 6,
      lineHeight: 2.5,
    })
  }
}

function drawFooter(doc: any, options: ModernBOLPDFOptions, page: number, totalPages: number) {
  const y = PAGE_HEIGHT - 18
  const companyTitle = cleanPDFText(options.companyName) || "SKY ARIANA LIMITED"
  const companyTagline = cleanPDFText(options.companySubtitle) || "Import & Export - International Transportation"
  roundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 10, BLUE, BLUE, 2)
  drawText(
    doc,
    `${companyTitle} - ${companyTagline} | ${cleanPDFText(options.companyPhone)} | ${cleanPDFText(options.companyEmail)}${options.companyLicence ? ` | Licence: ${options.companyLicence}` : ""}`,
    PAGE_WIDTH / 2,
    y + 2.3,
    { size: 6.8, weight: "bold", color: [255, 255, 255], align: "center", maxWidth: CONTENT_WIDTH - 6 }
  )
  drawText(doc, cleanPDFText(options.companyAddress) || "2nd Floor, 16 No. Office, Shahidano, Chowk, Etimad Rahmi Market, Kandahar, Afghanistan", PAGE_WIDTH / 2, y + 6.3, {
    size: 6.2,
    weight: "bold",
    color: [255, 255, 255],
    align: "center",
    maxWidth: CONTENT_WIDTH - 6,
  })
  drawText(doc, `Page ${page} of ${totalPages}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 5, {
    size: 6,
    weight: "bold",
    color: TEXT_MUTED,
    align: "right",
  })
}

export async function generateModernBOLPDFBlob(options: ModernBOLPDFOptions): Promise<Blob> {
  const jsPDF = await loadJSPDFLibrary()
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  })

  options.onProgress?.(8, "Loading embedded fonts...")
  await registerPDFFonts(doc)
  doc.setLanguage?.("en-US")
  const smartPdfTitle = buildBolSmartFileName(options.formData, options.bolNumber, "").replace(/\.pdf$/i, "")
  doc.setProperties({
    title: smartPdfTitle,
    subject: smartPdfTitle,
    author: cleanPDFText(options.companyName) || "SKY ARIANA LIMITED",
    creator: "Sky Ariana BOL PDF Export",
    keywords: "bill of lading, logistics, cargo, shipment",
  })

  options.onProgress?.(18, "Preparing document assets...")
  const logoDataUrl = await fetchImageDataURL(options.logoUrl)

  const form = options.formData
  const companyTitle = cleanPDFText(options.companyName) || "SKY ARIANA LIMITED"
  const companyTagline = cleanPDFText(options.companySubtitle) || "Import & Export - International Transportation"
  const companyPersian = cleanPDFText(options.companyNamePersian) || "شرکت حمل و نقل بین المللی اسکای آریانا"
  let pageNo = 1
  let y = PAGE_MARGIN

  const addPage = () => {
    drawFooter(doc, options, pageNo, 0)
    doc.addPage()
    pageNo += 1
    y = PAGE_MARGIN
  }

  const ensureSpace = (height: number) => {
    if (y + height > PAGE_HEIGHT - 22) {
      addPage()
    }
  }

  options.onProgress?.(32, "Drawing premium header...")
  roundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 32, [255, 255, 255], BORDER_BLUE, 4)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", PAGE_MARGIN + 5, y + 5, 25, 20, undefined, "SLOW")
  }
  drawText(doc, companyTitle, PAGE_WIDTH / 2, y + 6.0, {
    size: 19.0,
    weight: "bold",
    color: TEXT_DARK,
    align: "center",
    maxWidth: 110,
    lineHeight: 6.2,
  })
  drawText(doc, companyTagline, PAGE_WIDTH / 2, y + 17.2, {
    size: 9.0,
    weight: "bold",
    color: TEXT_DARK,
    align: "center",
  })
  drawText(doc, companyPersian, PAGE_WIDTH / 2, y + 22.8, {
    size: 11.8,
    weight: "bold",
    color: BLUE_DARK,
    align: "center",
  })
  roundedCard(doc, PAGE_WIDTH - PAGE_MARGIN - 35, y + 4, 32, 15, BLUE_DARK, BLUE_DARK, 2.5)
  drawText(doc, "BILL OF\nLADING", PAGE_WIDTH - PAGE_MARGIN - 19, y + 6.1, {
    size: 9,
    weight: "bold",
    color: [255, 255, 255],
    align: "center",
    lineHeight: 4,
  })
  roundedCard(doc, PAGE_WIDTH - PAGE_MARGIN - 35, y + 20, 32, 8.5, [255, 255, 255], BORDER_BLUE, 1.8)
  drawText(doc, options.bolNumber, PAGE_WIDTH - PAGE_MARGIN - 19, y + 22.6, {
    size: 7.4,
    weight: "bold",
    color: BLUE_DARK,
    align: "center",
  })
  y += 36

  options.onProgress?.(45, "Building shipment sections...")
  ensureSpace(54)
  blueSectionHeader(doc, "EXPORTER CONTACTS", "Exporter Contacts", PAGE_MARGIN, y, CONTENT_WIDTH)
  y += 10
  const contactW = (CONTENT_WIDTH - 3) / 2
  drawDetailCard(doc, { label: form.notes_1_label || "Contact Phone", value: form.notes_1, important: true }, PAGE_MARGIN, y, contactW, 18)
  drawDetailCard(doc, { label: form.notes_2_label || "Representative", value: form.notes_2, important: true }, PAGE_MARGIN + contactW + 3, y, contactW, 18)
  y += 21
  drawPartyCard(doc, "EXPORTER INFORMATION", "Exporter", form.shipper_name, form.shipper_address, form.shipper_contact, form.shipper_email, PAGE_MARGIN, y, contactW, 34)
  drawPartyCard(doc, "CONSIGNEE INFORMATION", "Consignee", form.consignee_name, form.consignee_address, form.consignee_contact, form.consignee_email, PAGE_MARGIN + contactW + 3, y, contactW, 34)
  y += 38

  ensureSpace(28)
  blueSectionHeader(doc, "ROUTE / TRANSPORTATION PATH", "Route", PAGE_MARGIN, y, CONTENT_WIDTH)
  y += 10
  let routeX = PAGE_MARGIN + 3
  let routeY = y
  form.routes.forEach((route, index) => {
    if (routeX + 38 > PAGE_WIDTH - PAGE_MARGIN) {
      routeX = PAGE_MARGIN + 3
      routeY += 13
    }
    roundedCard(doc, routeX, routeY, 34, 10, [255, 255, 255], BORDER_BLUE, 2)
    setColor(doc, BLUE, "fill")
    doc.circle(routeX + 5, routeY + 5, 3.2, "F")
    drawText(doc, String(index + 1), routeX + 5, routeY + 3.2, { size: 6.2, weight: "bold", color: [255, 255, 255], align: "center" })
    // draw small transport icon and adjust text
    drawTransportIcon(doc, routeX + 12, routeY + 1.6, route.transportMode, 7)
    drawText(doc, truncateText(route.location || `Stop ${index + 1}`, 16), routeX + 18, routeY + 2.4, { size: 6.4, weight: "bold", color: TEXT_DARK, maxWidth: 14 })
    if (route.locationPersian) {
      drawText(doc, route.locationPersian, routeX + 32, routeY + 6.2, { size: 5.4, color: BLUE, align: "right", maxWidth: 16 })
    }
    if (index < form.routes.length - 1) {
      setColor(doc, BORDER_BLUE, "draw")
      doc.setLineWidth(0.5)
      doc.line(routeX + 35, routeY + 5, routeX + 42, routeY + 5)
      drawText(doc, "->", routeX + 43.5, routeY + 3.1, { size: 7, weight: "bold", color: BLUE })
    }
    routeX += 49
  })
  y = routeY + 14

  // draw legend for transport icons (if space)
  ensureSpace(14)
  y += drawRouteLegend(doc, PAGE_MARGIN, y, 7) + 4

  ensureSpace(26)
  // show English title on the left and Pashto/Persian subtitle on the right
  blueSectionHeader(doc, "SHIPMENT INFORMATION", "اطلاعات حمل", PAGE_MARGIN, y, CONTENT_WIDTH)
  y += 10
  const shipmentItems: PDFDetailItem[] = [
    { label: "BOL Number", value: options.bolNumber, important: true },
    { label: "Invoice Reference", value: form.bol_number || options.bolNumber, important: true },
    { label: "Date", value: options.issueDate, important: true },
    { label: "Persian Date", value: options.persianDateNumeric, important: true },
  ]
  const shipmentW = (CONTENT_WIDTH - 6) / 4
  shipmentItems.forEach((item, index) => {
    drawDetailCard(doc, item, PAGE_MARGIN + index * (shipmentW + 2), y, shipmentW, 16)
  })
  y += 20

  ensureSpace(72)
  blueSectionHeader(doc, "CARGO DESCRIPTION", "Cargo", PAGE_MARGIN, y, CONTENT_WIDTH)
  y += 10
  const cargoItems: PDFDetailItem[] = [
    { label: "Container No.", value: form.container_numbers, important: true },
    { label: "Seal No.", value: form.seal_numbers, important: true },
    { label: "No. of Packages", value: form.number_of_packages, important: true },
    { label: "KGS per Carton", value: form.kgs_per_carton, important: true },
    { label: "Gross / Carton KGS", value: form.gross_weight_per_carton, important: true },
    { label: "Rate per KGS", value: form.rate_per_kgs, important: true },
    { label: "Goods Value", value: form.goods_value, important: true },
    { label: "Net Weight", value: form.net_weight, important: true },
    { label: "Gross Weight", value: form.gross_weight, important: true },
    { label: "Measurement", value: form.measurement },
  ].filter((item) => hasPDFValue(item.value))
  const cargoW = (CONTENT_WIDTH - 8) / 5
  cargoItems.forEach((item, index) => {
    const row = Math.floor(index / 5)
    const col = index % 5
    drawDetailCard(doc, item, PAGE_MARGIN + col * (cargoW + 2), y + row * 15, cargoW, 13)
  })
  y += Math.ceil(cargoItems.length / 5) * 15 + 2
  roundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 34, [255, 255, 255], BORDER_BLUE, 2.2)
  drawText(doc, "Description of Goods", PAGE_MARGIN + 3, y + 3, {
    size: 8,
    weight: "bold",
    color: TEXT_DARK,
  })
  drawText(doc, form.cargo_description, PAGE_MARGIN + 3, y + 9, {
    size: 6.8,
    weight: "bold",
    color: TEXT_DARK,
    maxWidth: CONTENT_WIDTH - 6,
    lineHeight: 2.8,
  })
  y += 38

  if (hasPDFValue(form.freight_payable_at) || hasPDFValue(form.remarks)) {
    ensureSpace(20)
    blueSectionHeader(doc, "REMARKS / NOTES", "Remarks", PAGE_MARGIN, y, CONTENT_WIDTH)
    y += 10
    drawDetailCard(doc, { label: "Freight Payable At", value: form.freight_payable_at }, PAGE_MARGIN, y, contactW, 14)
    drawDetailCard(doc, { label: "Remarks", value: form.remarks }, PAGE_MARGIN + contactW + 3, y, contactW, 14)
    y += 18
  }

  ensureSpace(30)
  const sigW = (CONTENT_WIDTH - 3) / 2
  const sigX = PAGE_MARGIN + (CONTENT_WIDTH - sigW) / 2
  roundedCard(doc, sigX, y, sigW, 26, [255, 255, 255], BORDER_BLUE, 2)
  try {
    const stampData = (await getCompanyStampDataUrl()) || COMPANY_STAMP_SIGNATURE_DATA_URL
    doc.addImage(stampData, "PNG", sigX + sigW / 2 - 12.5, y + 1, 25, 25)
  } catch {}
  drawText(doc, "Company Stamp & Sign", sigX + sigW / 2, y + 24, { size: 6.5, weight: "bold", color: TEXT_DARK, align: "center" })

  const totalPages = doc.internal.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawFooter(doc, options, page, totalPages)
  }

  options.onProgress?.(100, "PDF ready")
  const blob = doc.output("blob") as Blob
  return normalizePDFBlob(blob)
}

export async function generatePremiumBOLPDFBlob(options: ModernBOLPDFOptions): Promise<Blob> {
  const jsPDF = await loadJSPDFLibrary()
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  })

  options.onProgress?.(8, "Loading embedded fonts")
  await registerPDFFonts(doc)
  doc.setLanguage?.("en-US")
  const smartPdfTitle = buildBolSmartFileName(options.formData, options.bolNumber, "").replace(/\.pdf$/i, "")
  doc.setProperties({
    title: smartPdfTitle,
    subject: smartPdfTitle,
    author: cleanPDFText(options.companyName) || "SKY ARIANA LIMITED",
    creator: "Sky Ariana BOL PDF Export",
    keywords: "bill of lading, logistics, cargo, shipment",
  })

  options.onProgress?.(16, "Preparing assets")
  const logoDataUrl = await fetchImageDataURL(options.logoUrl)

  const form = options.formData
  const companyTitle = cleanPDFText(options.companyName) || "SKY ARIANA LIMITED"
  const companyTagline = cleanPDFText(options.companySubtitle) || "Import & Export - International Transportation"
  const companyPersian = cleanPDFText(options.companyNamePersian) || "شرکت حمل و نقل بین المللی اسکای آریانا"
  const contactCardWidth = (CONTENT_WIDTH - 3) / 2
  let y = PAGE_MARGIN

  options.onProgress?.(24, "Drawing premium header")
  roundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 28, [255, 255, 255], BORDER_BLUE, 3)
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", PAGE_MARGIN + 3, y + 3.5, 22, 17, undefined, "SLOW")
  }
  drawText(doc, companyTitle, PAGE_WIDTH / 2, y + 4.8, {
    size: 18.5,
    weight: "bold",
    color: TEXT_DARK,
    align: "center",
    maxWidth: 115,
    lineHeight: 5.8,
  })
  drawText(doc, companyTagline, PAGE_WIDTH / 2, y + 14.8, {
    size: 8.8,
    weight: "bold",
    color: TEXT_MUTED,
    align: "center",
  })
  drawText(doc, companyPersian, PAGE_WIDTH / 2, y + 20.0, {
    size: 11.2,
    weight: "bold",
    color: BLUE_DARK,
    align: "center",
  })
  roundedCard(doc, PAGE_WIDTH - PAGE_MARGIN - 34, y + 3.5, 31, 13, BLUE_DARK, BLUE_DARK, 2.2)
  drawText(doc, "BILL OF\nLADING", PAGE_WIDTH - PAGE_MARGIN - 18.5, y + 5.0, {
    size: 8.2,
    weight: "bold",
    color: [255, 255, 255],
    align: "center",
    lineHeight: 3.6,
  })
  roundedCard(doc, PAGE_WIDTH - PAGE_MARGIN - 34, y + 17.5, 31, 7.5, [255, 255, 255], BORDER_BLUE, 1.6)
  drawText(doc, options.bolNumber, PAGE_WIDTH - PAGE_MARGIN - 18.5, y + 19.4, {
    size: 6.8,
    weight: "bold",
    color: BLUE_DARK,
    align: "center",
  })
  y += 31

  options.onProgress?.(36, "Rendering parties and contacts")
  blueSectionHeader(doc, "EXPORTER CONTACTS", "تماس های صادرکننده", PAGE_MARGIN, y, CONTENT_WIDTH, 7)
  y += 8.5
  drawDetailCard(doc, { label: form.notes_1_label || "Loading Contact", value: form.notes_1, important: true }, PAGE_MARGIN, y, contactCardWidth, 14)
  drawDetailCard(doc, { label: form.notes_2_label || "Representative", value: form.notes_2, important: true }, PAGE_MARGIN + contactCardWidth + 3, y, contactCardWidth, 14)
  y += 16.5

  const partyHeight = 24
  drawPartyCard(doc, "EXPORTER INFORMATION", "فرستنده", form.shipper_name, form.shipper_address, form.shipper_contact, form.shipper_email, PAGE_MARGIN, y, contactCardWidth, partyHeight)
  drawPartyCard(doc, "CONSIGNEE INFORMATION", "گیرنده", form.consignee_name, form.consignee_address, form.consignee_contact, form.consignee_email, PAGE_MARGIN + contactCardWidth + 3, y, contactCardWidth, partyHeight)
  y += partyHeight + 2.5

  options.onProgress?.(48, "Rendering route and shipment data")
  const routes = form.routes?.length ? form.routes : []
  const routeColumns = 4
  const routeRows = Math.max(1, Math.ceil(routes.length / routeColumns))
  blueSectionHeader(doc, "ROUTE / TRANSPORTATION PATH", "مسیر حمل و نقل", PAGE_MARGIN, y, CONTENT_WIDTH, 7)
  y += 8.5
  const routeCardWidth = (CONTENT_WIDTH - (routeColumns - 1) * 3) / routeColumns
  routes.forEach((route, index) => {
    const row = Math.floor(index / routeColumns)
    const col = index % routeColumns
    const x = PAGE_MARGIN + col * (routeCardWidth + 3)
    const ry = y + row * 11
    roundedCard(doc, x, ry, routeCardWidth, 9.5, [255, 255, 255], BORDER_BLUE, 1.8)
    setColor(doc, BLUE, "fill")
    doc.circle(x + 4, ry + 4.8, 2.8, "F")
    drawText(doc, String(index + 1), x + 4, ry + 3.2, { size: 5.5, weight: "bold", color: [255, 255, 255], align: "center" })
    drawTransportIcon(doc, x + 8.5, ry + 1.8, route.transportMode, 5.8)
    drawText(doc, truncateText(route.location || `Stop ${index + 1}`, 22), x + 16, ry + 1.8, {
      size: 6.0,
      weight: "bold",
      color: TEXT_DARK,
      maxWidth: routeCardWidth - 17,
      lineHeight: 2.6,
    })
    if (route.locationPersian) {
      drawText(doc, truncateText(route.locationPersian, 22), x + 16, ry + 5.2, {
        size: 5.0,
        color: BLUE,
        maxWidth: routeCardWidth - 17,
        lineHeight: 2.4,
      })
    }
  })
  y += routeRows * 11 + 2.5

  // draw legend for transport icons
  y += drawRouteLegend(doc, PAGE_MARGIN, y, 5.5) + 2.5

  blueSectionHeader(doc, "SHIPMENT INFORMATION", "اطلاعات حمل", PAGE_MARGIN, y, CONTENT_WIDTH, 7)
  y += 8.5

  const driverNameVal = form.driver_name ? form.driver_name.trim() : ""
  const driverFatherNameVal = form.driver_father_name ? ` S/O ${form.driver_father_name.trim()}` : ""
  const driverFullInfo = driverNameVal || driverFatherNameVal ? `${driverNameVal}${driverFatherNameVal}` : undefined
  const combinedDateVal = [options.issueDate, options.persianDateNumeric].filter(Boolean).join("\n")

  const shipmentItems: PDFDetailItem[] = [
    { label: "Truck Number / شماره کامیون", value: form.truck_number, important: true },
    { label: "Driver Name / نام راننده", value: driverFullInfo, important: true },
    { label: "Driver Contact / تماس راننده", value: form.driver_contact, important: true },
    { label: "Driver Rent / کرایه راننده", value: form.driver_rent, important: true },
    { label: "Date / تاریخ / شمسی", value: combinedDateVal, important: true },
  ].filter((item) => hasPDFValue(item.value))

  const shipmentCols = Math.max(1, shipmentItems.length)
  const shipmentW = (CONTENT_WIDTH - (shipmentCols - 1) * 2) / shipmentCols
  shipmentItems.forEach((item, index) => {
    drawDetailCard(doc, item, PAGE_MARGIN + index * (shipmentW + 2), y, shipmentW, 14)
  })
  y += 16.5

  blueSectionHeader(doc, "CARGO DESCRIPTION", "شرح کالا", PAGE_MARGIN, y, CONTENT_WIDTH, 7)
  y += 8.5
  const cargoItems: PDFDetailItem[] = [
    { label: "Container No.", value: form.container_numbers, important: true },
    { label: "Seal No.", value: form.seal_numbers, important: true },
    { label: "No. of Packages", value: form.number_of_packages, important: true },
    { label: "KGS per Carton", value: form.kgs_per_carton, important: true },
    { label: "Gross / Carton KGS", value: form.gross_weight_per_carton, important: true },
    { label: "Rate per KGS", value: form.rate_per_kgs, important: true },
    { label: "Goods Value", value: form.goods_value, important: true },
    { label: "Net Weight", value: form.net_weight, important: true },
    { label: "Gross Weight", value: form.gross_weight, important: true },
    { label: "Measurement", value: form.measurement },
  ].filter((item) => hasPDFValue(item.value))
  const cargoColumns = 5
  const cargoW = (CONTENT_WIDTH - (cargoColumns - 1) * 2) / cargoColumns
  const cargoRows = Math.ceil(cargoItems.length / cargoColumns)
  cargoItems.forEach((item, index) => {
    const row = Math.floor(index / cargoColumns)
    const col = index % cargoColumns
    drawDetailCard(doc, item, PAGE_MARGIN + col * (cargoW + 2), y + row * 12.5, cargoW, 11.5)
  })
  y += cargoRows * 12.5 + 2

  const descriptionTitle = "Description of Goods / شرح کالا"
  const descriptionText = cleanPDFText(form.cargo_description)
  const descriptionBoxHeight = 22
  roundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, descriptionBoxHeight, [255, 255, 255], BORDER_BLUE, 2)
  drawText(doc, descriptionTitle, PAGE_MARGIN + 3, y + 2.5, { size: 7.2, weight: "bold", color: TEXT_DARK })
  if (descriptionText) {
    drawText(doc, descriptionText, PAGE_MARGIN + 3, y + 7.5, {
      size: 6.2,
      weight: "bold",
      color: TEXT_DARK,
      maxWidth: CONTENT_WIDTH - 6,
      lineHeight: 2.6,
    })
  }
  y += descriptionBoxHeight + 2.5

  options.onProgress?.(82, "Adding signature section")
  const signatureWidth = (CONTENT_WIDTH - 3) / 2
  const sigX = PAGE_MARGIN + (CONTENT_WIDTH - signatureWidth) / 2
  const sigHeight = 25
  roundedCard(doc, sigX, y, signatureWidth, sigHeight, [255, 255, 255], BORDER_BLUE, 2)
  try {
    const stampData = (await getCompanyStampDataUrl()) || COMPANY_STAMP_SIGNATURE_DATA_URL
    doc.addImage(stampData, "PNG", sigX + signatureWidth / 2 - 11.5, y + 1, 23, 23)
  } catch {}
  drawText(doc, "Company Stamp & Sign", sigX + signatureWidth / 2, y + 23, {
    size: 6.0,
    weight: "bold",
    color: TEXT_DARK,
    align: "center",
  })

  const totalPages = doc.internal.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    drawFooter(doc, options, page, totalPages)
  }

  options.onProgress?.(100, "PDF ready")
  return normalizePDFBlob(doc.output("blob") as Blob)
}

export type GenerateBOLPDFBlobOptions = {
  fileName?: string
  previewElement?: HTMLElement | null
  modern?: ModernBOLPDFOptions
  useElectronVectorPdf?: boolean
  onFallback?: (reason: string) => void
}

export async function generateBOLPDFBlob(options: GenerateBOLPDFBlobOptions): Promise<Blob>
export async function generateBOLPDFBlob(bolDocument: Record<string, any>): Promise<Blob>
export async function generateBOLPDFBlob(
  optionsOrBol: GenerateBOLPDFBlobOptions | Record<string, any>
): Promise<Blob> {
  const rawDoc = optionsOrBol as Record<string, any>
  const isDirectBol = Boolean(
    rawDoc &&
      !rawDoc.modern &&
      (rawDoc.bol_number || rawDoc.id || rawDoc.barnamehNo)
  )

  const cleanDirectBol = (
    (!isUUID(String(rawDoc.bol_number || "")) ? rawDoc.bol_number : "") ||
    (!isUUID(String(rawDoc.barnamehNo || "")) ? rawDoc.barnamehNo : "") ||
    (!isUUID(String(rawDoc.bolNo || "")) ? rawDoc.bolNo : "") ||
    (!isUUID(String(rawDoc.id || "")) ? rawDoc.id : "") ||
    "BOL"
  )

  const options: GenerateBOLPDFBlobOptions = isDirectBol
    ? {
        fileName: buildBolSmartFileName(
          rawDoc,
          cleanDirectBol,
          ".pdf"
        ),
        modern: {
          bolNumber: cleanDirectBol,
          issueDate: rawDoc.issue_date || "",
          persianDateNumeric: "",
          formData: rawDoc as BillOfLadingFormData,
          logoUrl: "/images/logo.png",
          companyName: "SKY ARIANA LIMITED",
          companyNamePersian: "شرکت حمل و نقل بین المللی اسکای آریانا",
          companySubtitle: "Import & Export - International Transportation",
          companyPhone: "+93 700 939 365",
          companyEmail: "info@skyariana.com",
          companyAddress: "Kandahar, Afghanistan",
          companyLicence: "2401-2198",
        },
      }
    : (optionsOrBol as GenerateBOLPDFBlobOptions)

  const fileName = options?.fileName || "BOL.pdf"
  const previewElement =
    options?.previewElement ||
    (typeof document !== "undefined"
      ? (document.querySelector('[data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-bol-a4="true"]') as HTMLElement | null)
      : null)

  if (previewElement) {
    try {
      return await generatePDFBlob(previewElement, fileName, {
        useElectronVectorPdf: options?.useElectronVectorPdf,
      })
    } catch (error) {
      console.warn("Direct element PDF capture failed, falling back to premium generator:", error)
      options?.onFallback?.(error instanceof Error ? error.message : String(error))
    }
  }

  if (options?.modern) {
    return await generatePremiumBOLPDFBlob(options.modern)
  }

  throw new Error("No preview element or modern BOL options available to generate PDF.")
}

// DOM sanitization, color normalization, and palette mapping for PDF export
// are imported from @/lib/utils/pdf-high-res-capture to guarantee unified styling.

/**
 * Generate PDF from HTML element and return as Blob
 * Uses html-to-image (native SVG foreignObject) for 100% pixel-perfect, font-perfect,
 * RTL-compatible rendering identical to the on-screen A4 preview.
 */
export async function generatePDFBlob(
  element: HTMLElement,
  fileName: string,
  options?: { useElectronVectorPdf?: boolean },
): Promise<Blob> {
  if (options?.useElectronVectorPdf) {
    const vectorBlob = await captureElectronVectorPdf("bol", { landscape: false })
    if (vectorBlob) {
      return await normalizePDFBlob(vectorBlob)
    }
  }

  const jsPDF = await loadJSPDFLibrary()
  const pageWidth = 210
  const pageHeight = 297

  // Target the exact A4 root element if element is a container wrapper
  const a4Element =
    (element.matches?.('[data-bol-a4="true"]')
      ? element
      : (element.querySelector?.('[data-bol-a4="true"]') as HTMLElement | null)) || element

  // 1. Wait for document fonts and all image assets to be fully ready & decoded (with bounded timeouts)
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await withCaptureTimeout(document.fonts.ready, 2000).catch(() => {})
    } catch {}
  }

  // Pre-inline images while preserving SVG vector clarity, and build embedded font CSS
  await withCaptureTimeout(
    inlineElementImagesPreservingVector(a4Element, fetchImageDataURL),
    5000,
  ).catch(() => {})

  // 2. Pre-bundle embedded font CSS for html-to-image (including Vazirmatn & Noto)
  let fontCSS = ""
  try {
    const fonts = await withCaptureTimeout(loadPDFFontAssets(), 4000).catch(() => null)
    fontCSS = buildEmbeddedPdfFontCss(fonts)
  } catch (fontErr) {
    console.warn("Could not pre-bundle fonts for PDF capture:", fontErr)
  }

  // Target all pages if multi-page BOL, otherwise target the single A4 page
  const pageNodes = Array.from(
    a4Element.querySelectorAll('[data-bol-page="true"]')
  ) as HTMLElement[]
  const pagesToRender = pageNodes.length > 0 ? pageNodes : [a4Element]

  // 3. Primary capture: High-resolution native SVG foreignObject rasterization via html-to-image
  try {
    const { toSvg } = await import("html-to-image")

    // Cooperative yield to keep UI responsive and spinners rendering
    await new Promise((resolve) => setTimeout(resolve, 0))

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      putOnlyUsedFonts: true,
      precision: 16,
    })

    const cleanTitle = (fileName || "BOL").replace(/\.pdf$/i, "")
    pdf.setProperties({
      title: cleanTitle,
      subject: "Official Bill of Lading",
      author: "AQ COMPANIES / SKY ARIANA LIMITED",
      creator: "Sky Ariana BOL PDF Engine",
    })

    for (let pIdx = 0; pIdx < pagesToRender.length; pIdx++) {
      if (pIdx > 0) {
        pdf.addPage("a4", "portrait")
      }
      const pageEl = pagesToRender[pIdx]
      const elementFilter = (node: HTMLElement) => {
        if (!node) return true
        if (node.getAttribute?.("data-print-ignore") === "true") return false
        if (node.getAttribute?.("data-pdf-ignore") === "true") return false
        if (node.getAttribute?.("data-html2canvas-ignore") === "true") return false
        if (node.getAttribute?.("data-stamp-controls") === "true" || node.closest?.('[data-stamp-controls="true"]')) return false
        if (node.getAttribute?.("data-preview-toolbar") === "true" || node.closest?.('[data-preview-toolbar="true"]')) return false
        if (typeof node.className === "string" && (node.className.includes("no-print") || node.className.includes("print:hidden"))) return false
        if (node.classList?.contains?.("no-print")) return false
        if (node.getAttribute?.("data-qr-code") === "true" || node.closest?.("[data-qr-code]")) return true
        if (node.tagName === "BUTTON") return false
        return true
      }

      const captureStyle = {
        transform: "none",
        margin: "0",
        opacity: "1",
        visibility: "visible",
        boxShadow: "none",
        outline: "none",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision",
      } as any

      const rasterizeSvgToPng = async (svgDataUrl: string, timeoutMs: number): Promise<string> => {
        const img = await loadSvgImage(svgDataUrl, timeoutMs, "Timed out rasterizing the page for PDF export.")
        const ratio = 4 // Clamped strictly <= 4096px CPU canvas edge to prevent GPU VRAM tile corruption
        const { width: targetWidth, height: targetHeight } = computeClampedCanvasDimensions(
          pageEl.offsetWidth || 794,
          pageEl.offsetHeight || 1123,
          ratio,
          4096,
        )
        const canvas = drawImageHighQualityToCanvas(img, targetWidth, targetHeight)
        return canvas.toDataURL("image/png")
      }

      let imageData: string | null = null

      try {
        const svgDataUrl = await withCaptureTimeout(
          toSvg(pageEl, {
            pixelRatio: 4, // 384+ DPI print-grade vector resolution floor
            cacheBust: false,
            skipFonts: true,
            fontEmbedCSS: fontCSS || undefined,
            imagePlaceholder: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>",
            backgroundColor: "#ffffff",
            style: captureStyle,
            filter: elementFilter,
          }),
          20000,
          "Timed out building SVG snapshot for PDF export.",
        )

        imageData = await rasterizeSvgToPng(svgDataUrl, 20000)
      } catch (svgErr) {
        console.warn("Primary toSvg capture failed in pdf-upload, retrying lightweight SVG capture:", svgErr)
        const lightSvgDataUrl = await withCaptureTimeout(
          toSvg(pageEl, {
            pixelRatio: 4,
            cacheBust: false,
            skipFonts: true,
            fontEmbedCSS: undefined,
            imagePlaceholder: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/>",
            backgroundColor: "#ffffff",
            style: captureStyle,
            filter: elementFilter,
          }),
          12000,
          "Timed out building lightweight SVG snapshot for PDF export.",
        )
        imageData = await rasterizeSvgToPng(lightSvgDataUrl, 12000)
      }

      if (imageData) {
        pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "MEDIUM")
      }
    }

    const blob = pdf.output("blob") as Blob
    return await normalizePDFBlob(blob)
  } catch (htmlToImageError) {
    console.warn("html-to-image capture failed, trying html2canvas fallback:", htmlToImageError)
  }

  // 4. Secondary fallback: html2canvas
  let wrapper: HTMLDivElement | null = null

  try {
    const { html2canvas } = await loadPDFLibraries()

    const pixelWidth = 794
    const pixelHeight = 1123

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
      precision: 16,
    })

    const cleanTitle = (fileName || "BOL").replace(/\.pdf$/i, "")
    pdf.setProperties({
      title: cleanTitle,
      subject: "Official Bill of Lading",
      author: "AQ COMPANIES / SKY ARIANA LIMITED",
      creator: "Sky Ariana BOL PDF Engine",
    })

    for (let pIdx = 0; pIdx < pagesToRender.length; pIdx++) {
      if (pIdx > 0) {
        pdf.addPage("a4", "portrait")
      }
      const pageToRender = pagesToRender[pIdx]
      const clonedElement = pageToRender.cloneNode(true) as HTMLElement

      // Preserve attributes for exact CSS styling in PDF mode
      clonedElement.setAttribute("data-pdf-export", "true")
      clonedElement.setAttribute("data-bol-a4", "true")
      clonedElement.setAttribute("data-pdf-export-fixed", "true")

      // Clean fixed dimensions matching standard A4 (794px x 1123px at 96 DPI, overflow: visible)
      clonedElement.style.width = "794px"
      clonedElement.style.height = "1123px"
      clonedElement.style.maxHeight = "1123px"
      clonedElement.style.maxWidth = "794px"
      clonedElement.style.minHeight = "1123px"
      clonedElement.style.overflow = "visible"
      clonedElement.style.background = "#ffffff"
      clonedElement.style.boxShadow = "none"
      clonedElement.style.margin = "0"
      clonedElement.style.backdropFilter = "none"
      clonedElement.querySelectorAll<HTMLElement>('main[data-bol-content="true"]').forEach((m) => {
        m.style.minHeight = "auto"
        m.style.overflow = "visible"
      })
      sanitizeElementForPDF(pageToRender, clonedElement)

      wrapper = document.createElement("div")
      wrapper.style.position = "fixed"
      wrapper.style.left = "-10000px"
      wrapper.style.top = "0"
      wrapper.style.width = "794px"
      wrapper.style.height = "1123px"
      wrapper.style.background = "#ffffff"
      wrapper.style.overflow = "visible"
      wrapper.style.opacity = "1"
      wrapper.style.pointerEvents = "none"
      wrapper.style.zIndex = "-9999"
      wrapper.appendChild(clonedElement)
      document.body.appendChild(wrapper)

      // Cooperative yield before fallback canvas creation: guarantee fonts & images are fully decoded
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try { await document.fonts.ready } catch {}
      }
      try {
        const clonedImgs = Array.from(clonedElement.querySelectorAll("img"))
        await Promise.all(clonedImgs.map((img) => (img.complete ? Promise.resolve() : img.decode?.().catch(() => {}))))
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 0))

      const canvas = await html2canvas(clonedElement, {
        scale: 4, // 384 DPI print-grade resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        imageTimeout: 8000,
        scrollX: 0,
        scrollY: 0,
        width: pixelWidth,
        height: pixelHeight,
        windowWidth: pixelWidth,
        windowHeight: pixelHeight,
        ignoreElements: (el: Element) => {
          const tag = el.tagName?.toUpperCase()
          if (tag === "FILTER" || tag === "DEFS" || tag === "BUTTON") return true
          if (el instanceof HTMLCanvasElement && (el.width === 0 || el.height === 0)) return true
          if (el instanceof HTMLImageElement && (el.naturalWidth === 0 || el.naturalHeight === 0)) return true
          if (el.getAttribute?.("data-print-ignore") === "true") return true
          if (el.getAttribute?.("data-pdf-ignore") === "true") return true
          if (el.getAttribute?.("data-html2canvas-ignore") === "true") return true
          if (el.classList?.contains("no-print") || el.classList?.contains("print:hidden")) return true
          return false
        },
        onclone: (clonedDocument: Document) => {
          try {
            if (clonedDocument.documentElement) {
              clonedDocument.documentElement.style.setProperty("background-color", "#ffffff", "important")
              clonedDocument.documentElement.style.setProperty("background", "#ffffff", "important")
              clonedDocument.documentElement.style.setProperty("color", "#0f172a", "important")
            }
            if (clonedDocument.body) {
              clonedDocument.body.style.setProperty("background-color", "#ffffff", "important")
              clonedDocument.body.style.setProperty("background", "#ffffff", "important")
              clonedDocument.body.style.setProperty("color", "#0f172a", "important")
            }
            clonedDocument.querySelectorAll("style").forEach((styleNode) => {
              if (styleNode.textContent && /oklch|oklab|lab|lch/i.test(styleNode.textContent)) {
                styleNode.textContent = styleNode.textContent
                  .replace(/(?:background(?:-color|-image)?\s*:\s*[^;]*?)(?:oklch|oklab|lab|lch)\([^)]+\)/gi, (match) => match.replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#ffffff"))
                  .replace(/(?:border(?:-color|-top|-bottom|-left|-right)?\s*:\s*[^;]*?)(?:oklch|oklab|lab|lch)\([^)]+\)/gi, (match) => match.replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#cbd5e1"))
                  .replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#0f172a")
              }
            })
            clonedDocument.querySelectorAll<HTMLElement>("[style]").forEach((styledEl) => {
              const s = styledEl.getAttribute("style") || ""
              if (/oklch|oklab|lab|lch/i.test(s)) {
                styledEl.setAttribute(
                  "style",
                  s
                    .replace(/(?:background(?:-color|-image)?\s*:\s*[^;]*?)(?:oklch|oklab|lab|lch)\([^)]+\)/gi, (match) => match.replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#ffffff"))
                    .replace(/(?:border(?:-color|-top|-bottom|-left|-right)?\s*:\s*[^;]*?)(?:oklch|oklab|lab|lch)\([^)]+\)/gi, (match) => match.replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#cbd5e1"))
                    .replace(/(?:oklch|oklab|lab|lch)\([^)]+\)/gi, "#0f172a"),
                )
              }
            })
          } catch {}
          const style = clonedDocument.createElement("style")
          style.textContent = `
                :root, html, body {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  color: #0f172a !important;
                  --background: #ffffff !important;
                  --foreground: #0f172a !important;
                  --card: #ffffff !important;
                  --card-foreground: #0f172a !important;
                  --popover: #ffffff !important;
                  --popover-foreground: #0f172a !important;
                  --primary: #1d4ed8 !important;
                  --primary-foreground: #ffffff !important;
                  --secondary: #f8fafc !important;
                  --secondary-foreground: #0f172a !important;
                  --muted: #f8fafc !important;
                  --muted-foreground: #475569 !important;
                  --accent: #dbeafe !important;
                  --accent-foreground: #0f172a !important;
                  --destructive: #dc2626 !important;
                  --destructive-foreground: #ffffff !important;
                  --border: #cbd5e1 !important;
                  --input: #cbd5e1 !important;
                  --ring: #2563eb !important;
                  -webkit-font-smoothing: antialiased !important;
                  -moz-osx-font-smoothing: grayscale !important;
                  text-rendering: optimizeLegibility !important;
                }

                *, *::before, *::after {
                  text-shadow: none !important;
                  backdrop-filter: none !important;
                  -webkit-backdrop-filter: none !important;
                }

                .no-print, [data-print-ignore="true"], [data-pdf-ignore="true"], [data-html2canvas-ignore="true"], button:not([data-qr-code]) {
                  display: none !important;
                }

                [data-print-section] > div:first-child h3,
                [data-print-section] > div:first-child p.bol-persian-text {
                  white-space: nowrap !important;
                  flex-shrink: 0 !important;
                }

                [data-pdf-export-fixed="true"] {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-height: 297mm !important;
                  min-height: 297mm !important;
                  overflow: hidden !important;
                  box-shadow: none !important;
                  margin: 0 !important;
                }
              `
          clonedDocument.head.appendChild(style)
        },
      })

      const imageData = canvas.toDataURL("image/png")
      pdf.addImage(imageData, "PNG", 0, 0, pageWidth, pageHeight, undefined, "MEDIUM")

      wrapper.remove()
      wrapper = null
    }

    const blob = pdf.output("blob") as Blob
    return normalizePDFBlob(blob)
  } catch (error) {
    console.error("PDF generation error:", error)
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  } finally {
    wrapper?.remove()
  }
}

/**
 * Upload PDF to server storage
 */
export async function uploadPDFToServer(
  pdfBlob: Blob,
  bolId: string,
  bolNumber: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const validPdfBlob = await normalizePDFBlob(pdfBlob)
    const formData = new FormData()
    formData.append("pdf", validPdfBlob, `${bolNumber || "BOL"}.pdf`)
    formData.append("bolId", bolId || bolNumber || "BOL")
    formData.append("bolNumber", bolNumber || "BOL")

    const response = await fetch("/api/bol/pdf", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || "Failed to upload PDF",
      }
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        success: true,
        url: data.data.pdfUrl,
      }
    }

    return {
      success: false,
      error: data.error || "Failed to upload PDF",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error uploading PDF",
    }
  }
}

/**
 * Download PDF from server
 */
export async function downloadPDFFromServer(
  bolId: string,
  fileName: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `/api/bol/pdf?action=download&bolId=${bolId}`
    )

    if (!response.ok) {
      throw new Error("Failed to download PDF")
    }

    const data = await response.json()

    if (data.success && data.data?.pdfUrl) {
      // Redirect to the PDF URL for download
      window.open(data.data.pdfUrl, "_blank")
      return true
    }

    return false
  } catch (error) {
    console.error("Error downloading PDF:", error)
    return false
  }
}

/**
 * Automatically builds a rich document and file name from the BOL data following the user's specification:
 * [Invoice No]-[Consignee Name]-[Quantity]-[Product Name]-[Shipper Name]-BOL (e.g. INV-168-MANIK TRADERS-1506-CTNS-BLACK-RAISNIS-NAJEB AMIN LTD-BOL.pdf)
 */
export function buildBolSmartFileName(
  docOrFormData: any,
  fallbackBolNumber: string = "BOL",
  extension: string = ".pdf"
): string {
  if (!docOrFormData) {
    const cleanFallback = (fallbackBolNumber || "BOL").trim().replace(/[/\\:*?"<>|]/g, "_")
    const base = cleanFallback.toUpperCase().endsWith("BOL") ? cleanFallback : `${cleanFallback}-BOL`
    return extension ? (base.endsWith(extension) ? base : `${base}${extension}`) : base
  }

  // 1. Extract Invoice Number (FIRST SHOULD COME INVOICE NO: e.g. INV-096)
  let invNo = extractInvoiceNumber(docOrFormData)
  if (!invNo) {
    invNo = "INV-001"
  }
  invNo = invNo
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.,\s]+|[-.,\s]+$/g, "")

  // 2. Extract Consignee Name (Take first line before newline, pipe or comma)
  const rawConsignee = (
    docOrFormData.consignee_name ||
    docOrFormData.consignee ||
    docOrFormData.consigneeName ||
    ""
  ).trim()
  let consignee = rawConsignee.split(/[\r\n,│|]+/)[0].trim()
  consignee = consignee
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[-.,\s]+|[-.,\s]+$/g, "")
    .trim()
    .toUpperCase()
  if (!consignee) consignee = "CONSIGNEE"

  // 3. Extract Quantity and candidate commodity from packages field (e.g. 1430-CTNS)
  const rawQty = String(docOrFormData.number_of_packages || docOrFormData.packages || "").trim()
  let quantity = ""
  let candidateCommodityFromQty = ""

  if (rawQty) {
    // Check if multi-item package string, e.g. '305 CTNS GREEN RAISNIS - 603 CTNS BLACK RAISNIS - 546 CTNS GOLDEN RAISNIS'
    const parts = rawQty.split(/[\r\n|;]+|\s+[-–—]\s+/).map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      let sum = 0
      let allHave = true
      let unit = "CTNS"
      for (const p of parts) {
        const m = p.match(/^\s*([0-9,]+)/)
        if (m) {
          const val = parseFloat(m[1].replace(/,/g, ""))
          if (!isNaN(val) && val > 0) sum += val
          else allHave = false
        } else {
          allHave = false
        }
        const u = p.match(/\b(CTNS?|CARTONS?|CNTS?|BAGS?|PKGS?|BOXES?|PCS)\b/i)
        if (u) {
          unit = /^CARTONS?|^CTNS?|^CNTS?/i.test(u[1]) ? "CTNS" : u[1].toUpperCase()
        }
      }
      if (allHave && sum > 0) {
        quantity = `${sum}-${unit}`
      }
    }

    if (!quantity) {
      const qtyMatch = rawQty.match(/^(\d[\d,\s]*)\s*([a-zA-Z]+)?(?:\s+(.*))?$/)
      if (qtyMatch) {
        const num = qtyMatch[1].replace(/[\s,]/g, "")
        const rawUnit = (
          qtyMatch[2] ||
          docOrFormData.package_type ||
          docOrFormData.packageType ||
          "CTNS"
        ).trim().toUpperCase()
        const typeAbbr = /^CARTONS?|^CTNS?|^CNTS?/i.test(rawUnit)
          ? "CTNS"
          : /^BAGS?/i.test(rawUnit)
          ? "BAGS"
          : /^BOXES?|^BOX/i.test(rawUnit)
          ? "BOXES"
          : /^PACKAGES?|^PKGS?/i.test(rawUnit)
          ? "PKGS"
          : /^UNITS?/i.test(rawUnit)
          ? "UNITS"
          : rawUnit
        quantity = `${num}-${typeAbbr}`
        if (qtyMatch[3]) {
          candidateCommodityFromQty = qtyMatch[3].trim()
        }
      } else {
        quantity = rawQty.replace(/[/\\:*?"<>|]/g, "").replace(/\s+/g, "-").toUpperCase()
      }
    }
  }
  quantity = quantity.replace(/[/\\:*?"<>|]/g, "").replace(/-+/g, "-").replace(/^[-.,\s]+|[-.,\s]+$/g, "")

  // 4. Extract Product Name / Commodity / Particulars
  let rawProduct = (docOrFormData.commodity || candidateCommodityFromQty || "").trim()
  if (!rawProduct) {
    const rawCargo = (docOrFormData.cargo_description || "").trim()
    const lines = rawCargo.split(/[\r\n]+/)
    for (const line of lines) {
      const cleaned = line
        .replace(/^[\s\u2022\u25CF\u25AA\u25AB\u2023\u2043\-\*📦🚚⚓🚢✈️📄📝]+/g, "")
        .replace(/^(?:Description(?:\s+of\s+goods)?|Commodity|Cargo|Product|Goods|Particulars(?:\s+of\s+goods)?)\s*[:#-]?\s*/i, "")
        .trim()
      if (!cleaned) continue

      const partMatch = cleaned.match(/^(?:PARTICULARS\s*(?:OF\s*GOODS)?)\s*[:#-]+\s*(.*)$/i)
      if (partMatch) {
        rawProduct = partMatch[1].trim() || "PARTICULARS"
        break
      }

      if (/^(?:CONTAINER|CARGO|TRANSIT|INVOICE|INV|PACKING|DATE|SEAL|TRUCK|DRIVER|NET|GROSS|TOTAL|ROUTE|REMARKS|BORDER)/i.test(cleaned)) {
        continue
      }
      let prod = cleaned
        .replace(/\b\d+[\d,\s-]*(?:ctns?|cartons?|bags?|boxes?|pkgs?|packages?|units?)\b/gi, "")
        .replace(/\b\d+[\d,.\s-]*(?:kgs?|kg|tons?|mt|metric\s*tons?)\b/gi, "")
        .replace(/@.*$/g, "")
        .replace(/[$€£¥]\s*[\d,.]+|[\d,.]+\s*(?:usd|afn|pkr|eur|inr)/gi, "")
        .replace(/^[-:,\s]+|[-:,\s]+$/g, "")
        .trim()
      if (prod.length >= 2) {
        rawProduct = prod
        break
      }
    }
  }
  if (!rawProduct) {
    rawProduct = "PARTICULARS"
  }
  let product = rawProduct
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.,\s]+|[-.,\s]+$/g, "")
    .trim()
    .toUpperCase()

  // 5. Extract Shipper Name (Take first line)
  const rawShipper = (
    docOrFormData.shipper_name ||
    docOrFormData.shipperDescription ||
    docOrFormData.shipper ||
    docOrFormData.shipperName ||
    ""
  ).trim()
  let shipper = rawShipper.split(/[\r\n,│|]+/)[0].trim()
  shipper = shipper
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[-.,\s]+|[-.,\s]+$/g, "")
    .trim()
    .toUpperCase()
  if (!shipper) shipper = "SHIPPER"

  // 6. BOL Number
  let rawCandidate = (
    docOrFormData.bol_number ||
    docOrFormData.barnamehNo ||
    docOrFormData.bolNo ||
    fallbackBolNumber ||
    ""
  ).trim()
  if (isUUID(rawCandidate)) {
    rawCandidate = (!isUUID(String(fallbackBolNumber || "")) ? fallbackBolNumber : "") || "BOL"
  }
  let bolNumber = rawCandidate
  if (/NSA[-_]?76[O0]\d*/i.test(bolNumber)) {
    bolNumber = "BOL-2026-NSA763"
  }
  bolNumber = bolNumber
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.,\s]+|[-.,\s]+$/g, "")
    .trim()
    .toUpperCase()
  if (!bolNumber) bolNumber = "BOL"

  // Construct components in exact order requested by user:
  // [Invoice No]-[Consignee Name]-[Quantity]-[Product/Particulars]-[Shipper Name]-[BOL Number]
  const parts: string[] = [invNo, consignee, quantity, product, shipper, bolNumber].filter(Boolean)

  // Join parts with hyphen, ensuring clean file name
  const rawFileName = parts.join("-").replace(/[/\\:*?"<>|]/g, "_").replace(/-+/g, "-").trim()
  return extension ? (rawFileName.endsWith(extension) ? rawFileName : `${rawFileName}${extension}`) : rawFileName
}

/**
 * Save a PDF blob as a file on the user's device
 */
export async function savePDFToDevice(
  pdfBlob: Blob,
  fileName: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    if (typeof window === "undefined") {
      throw new Error("Local PDF save is only available in the browser")
    }

    const validPdfBlob = await normalizePDFBlob(pdfBlob)

    // Trigger direct browser file download immediately to user's device
    const url = URL.createObjectURL(validPdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 10000)

    // Background backup call to local save API if endpoint exists
    try {
      const formData = new FormData()
      formData.append("pdf", validPdfBlob, fileName)
      formData.append("fileName", fileName)

      fetch("/api/bol/pdf/local-save", {
        method: "POST",
        body: formData,
      }).catch(() => {})
    } catch {}

    return { success: true, path: fileName }
  } catch (error) {
    console.error("Error saving PDF to device:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error saving PDF",
    }
  }
}

/**
 * Open the generated PDF in the browser print flow.
 */
export async function printPDFBlob(
  pdfBlob: Blob,
  fileName: string
): Promise<boolean> {
  try {
    if (typeof window === "undefined") {
      throw new Error("PDF print is only available in the browser")
    }

    const validPdfBlob = await normalizePDFBlob(pdfBlob)
    const url = URL.createObjectURL(validPdfBlob)

    const printWindow = window.open(url, "_blank")
    if (printWindow) {
      printWindow.document.title = fileName
      printWindow.focus()
      setTimeout(() => {
        try {
          printWindow.print()
        } finally {
          setTimeout(() => URL.revokeObjectURL(url), 60000)
        }
      }, 1000)
      return true
    }

    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    iframe.src = url
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 60000)
      }
    }
    document.body.appendChild(iframe)

    return true
  } catch (error) {
    console.error("Error printing PDF:", error)
    return false
  }
}

const PRINT_WINDOW_READY_TIMEOUT_MS = 5000

function waitForPrintWindowReady(printWindow: Window | null, timeout = PRINT_WINDOW_READY_TIMEOUT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    if (!printWindow || printWindow.closed) {
      resolve(false)
      return
    }

    const start = Date.now()
    const interval = window.setInterval(() => {
      if (!printWindow || printWindow.closed) {
        window.clearInterval(interval)
        resolve(false)
        return
      }

      try {
        if ((printWindow as any).__skyBolPrintReady === true || printWindow.document.readyState === "complete") {
          window.clearInterval(interval)
          resolve(true)
          return
        }
      } catch {
        // ignore cross-window access issues until the preview window is ready
      }

      if (Date.now() - start > timeout) {
        window.clearInterval(interval)
        resolve(false)
      }
    }, 50)
  })
}

export function openPDFPrintWindow(fileName: string): Window | null {
  if (typeof window === "undefined") return null

  const printWindow = window.open("", "_blank", "width=1000,height=840")
  if (!printWindow) return null

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>${fileName}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #eff6ff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }
          .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 16px;
            background: #ffffff;
            border-bottom: 1px solid #dbeafe;
          }
          .toolbar h1 {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
          }
          .toolbar button {
            border: none;
            background: #2563eb;
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            padding: 10px 16px;
            border-radius: 9999px;
            cursor: pointer;
          }
          .toolbar button:hover {
            background: #1d4ed8;
          }
          .viewer {
            position: absolute;
            top: 52px;
            left: 0;
            right: 0;
            bottom: 0;
            background: #f8fafc;
          }
          .viewer iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #ffffff;
          }
          .loading {
            display: grid;
            min-height: 100vh;
            place-items: center;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <h1>${fileName}</h1>
          <button id="print-button" type="button">Print</button>
        </div>
        <div class="viewer">
          <iframe id="pdf-preview" title="PDF Preview"></iframe>
        </div>
        <script>
          window.__skyBolPrintReady = false

          const printButton = document.getElementById('print-button')
          const previewFrame = document.getElementById('pdf-preview')

          window.addEventListener('message', (event) => {
            if (event?.data?.type === 'sky-bol-load-pdf' && event.data.url) {
              previewFrame.src = event.data.url
            }
          })

          if (printButton) {
            printButton.addEventListener('click', () => {
              if (previewFrame && previewFrame.contentWindow) {
                previewFrame.contentWindow.focus()
                previewFrame.contentWindow.print()
              }
            })
          }

          function markReady() {
            window.__skyBolPrintReady = true
          }

          if (document.readyState === 'complete') {
            markReady()
          } else {
            window.addEventListener('DOMContentLoaded', markReady)
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  return printWindow
}

export async function printPDFBlobInWindow(
  pdfBlob: Blob,
  fileName: string,
  printWindow: Window | null
): Promise<boolean> {
  try {
    if (!printWindow || printWindow.closed) {
      return printPDFBlob(pdfBlob, fileName)
    }

    const validPdfBlob = await normalizePDFBlob(pdfBlob)
    const url = URL.createObjectURL(validPdfBlob)

    try {
      const windowReady = await waitForPrintWindowReady(printWindow)
      if (windowReady) {
        try {
          printWindow.postMessage({ type: "sky-bol-load-pdf", url }, window.location.origin)
          printWindow.focus()
        } catch (error) {
          console.error("Failed to send PDF preview URL to print window:", error)
          if (!printWindow.closed) {
            printWindow.location.replace(url)
          }
        }
      } else {
        console.warn("Print window did not become ready in time; falling back to direct PDF navigation")
        if (!printWindow.closed) {
          printWindow.location.replace(url)
          printWindow.focus()
        }
      }
    } catch (error) {
      console.error("Failed to prepare print window:", error)
      if (printWindow && !printWindow.closed) {
        try {
          printWindow.location.replace(url)
          printWindow.focus()
        } catch {
          // ignore
        }
      }
    }

    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000)
    return true
  } catch (error) {
    console.error("Error printing PDF in window:", error)
    return false
  }
}

/**
 * Delete PDF from server
 */
export async function deletePDFFromServer(
  bolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/bol/pdf?bolId=${bolId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || "Failed to delete PDF",
      }
    }

    const data = await response.json()

    return {
      success: data.success,
      error: data.error,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error deleting PDF",
    }
  }
}

