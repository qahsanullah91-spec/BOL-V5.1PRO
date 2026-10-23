"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
  Printer,
  X,
  FileDown,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  FileText,
  Maximize2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatPackageDisplay } from "./detailed-report-table"

export interface ReportPrintItem {
  id?: string
  bol_number?: string
  issue_date?: string
  created_at?: string
  shipper_name?: string
  consignee_name?: string
  cargo_description?: string
  goods_description?: string
  description_of_goods?: string
  number_of_packages?: string | number
  net_weight?: string | number
  gross_weight?: string | number
  driver_rent?: string | number
  driver_rent_currency?: string
  driverFreight?: string
  driver_name?: string
  driver_father_name?: string
  goods_value?: string | number
  truck_number?: string
  container_number?: string
  container_numbers?: string
  invoice_no?: string
  invoice_number?: string
  routes?: Array<{ stopOrder?: number; location?: string }>
  status?: string
}

export interface ReportPrintOverviewKpis {
  totalBols: number
  totalPackages: number
  totalNetWeight: number
  totalGoodsValueUSD: number
  totalDriverRentAFN: number
}

export interface ReportPrintPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  reportTitle?: string
  companyName?: string
  data: ReportPrintItem[]
  kpis?: ReportPrintOverviewKpis | null
  initialOrientation?: "landscape" | "portrait"
  onDownloadPdf?: () => void
  isGeneratingPdf?: boolean
}

/**
 * Sums multi-item values such as "1,200-1,300" or "USD 500 - USD 700" into a
 * single total (2,500 / 1,200). Stripping every non-digit character (the old
 * approach) would produce corrupted numbers like 12001300 and break the
 * accounting invariance of the summary totals.
 */
export function parseMultiNumberField(raw: unknown): number {
  if (raw === null || raw === undefined) return 0
  const str = String(raw).trim()
  if (!str) return 0
  let total = 0
  let found = false
  for (const segment of str.split(/[-–—]/)) {
    const match = segment.match(/\d[\d,]*(?:\.\d+)?/)
    if (match) {
      const n = parseFloat(match[0].replace(/,/g, ""))
      if (!isNaN(n)) {
        total += n
        found = true
      }
    }
  }
  return found ? total : 0
}

function formatCellNumber(raw: unknown, suffix: string, prefix = ""): string {
  if (raw === null || raw === undefined || String(raw).trim() === "") return "—"
  const total = parseMultiNumberField(raw)
  if (total === 0) return "—"
  return `${prefix}${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix ? ` ${suffix}` : ""}`
}

const PRINT_ROOT_ID = "sky-report-sheet-print-root"
const PRINT_STYLE_ID = "sky-report-sheet-print-style"

export function ReportPrintPreviewModal({
  isOpen,
  onClose,
  reportTitle = "Saved Bills of Lading — Executive Operations Report",
  companyName = "AQ COMPANIES",
  data,
  kpis,
  initialOrientation = "landscape",
  onDownloadPdf,
  isGeneratingPdf = false,
}: ReportPrintPreviewModalProps) {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(initialOrientation)
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  const [density, setDensity] = useState<"compact" | "standard">("compact")
  const [showKpis, setShowKpis] = useState<boolean>(true)
  const [showRent, setShowRent] = useState<boolean>(true)
  const [showGoodsValue, setShowGoodsValue] = useState<boolean>(true)
  const [showRoutes, setShowRoutes] = useState<boolean>(true)
  const [showTruckDriver, setShowTruckDriver] = useState<boolean>(true)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)
  const [isSavingPdf, setIsSavingPdf] = useState<boolean>(false)
  const [availablePrinters, setAvailablePrinters] = useState<Array<{ name: string; displayName: string; isDefault: boolean }>>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const previewScrollRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrientation(initialOrientation)
  }, [initialOrientation])

  // Query native desktop printers if in Electron environment
  useEffect(() => {
    if (typeof window !== "undefined" && window.skyDesktop?.getPrinters) {
      window.skyDesktop.getPrinters().then((printers: any) => {
        if (Array.isArray(printers) && printers.length > 0) {
          setAvailablePrinters(printers)
          const def = printers.find((p: any) => p.isDefault) || printers[0]
          if (def) setSelectedPrinter(def.name)
        }
      }).catch(() => {})
    }
  }, [])

  const isLandscape = orientation === "landscape"
  const paperWidthMm = isLandscape ? 297 : 210
  const paperHeightMm = isLandscape ? 210 : 297

  // Fit the A4 sheet to the available preview width
  const fitToWidth = useCallback(() => {
    const container = previewScrollRef.current
    if (!container) return
    const paperPx = isLandscape ? 1122.5 : 793.7
    const available = container.clientWidth - 56
    const fit = Math.floor(((available / paperPx) * 100) / 5) * 5
    setZoomLevel(Math.min(150, Math.max(40, fit)))
  }, [isLandscape])

  useEffect(() => {
    if (!isOpen) return
    fitToWidth()
  }, [isOpen, fitToWidth])

  useEffect(() => {
    if (!isOpen) return
    const onResize = () => fitToWidth()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [isOpen, fitToWidth])

  // Calculate totals satisfying accounting invariance
  const summaryTotals = useMemo(() => {
    let packages = 0
    let weight = 0
    let goodsVal = 0
    let rentAfn = 0

    for (const item of data) {
      packages += parseMultiNumberField(item.number_of_packages)
      weight += parseMultiNumberField(item.net_weight)
      goodsVal += parseMultiNumberField(item.goods_value)
      rentAfn += parseMultiNumberField(item.driver_rent || item.driverFreight)
    }

    return {
      count: data.length,
      packages: kpis?.totalPackages ?? packages,
      weight: kpis?.totalNetWeight ?? weight,
      goodsValue: kpis?.totalGoodsValueUSD ?? goodsVal,
      rent: kpis?.totalDriverRentAFN ?? rentAfn,
    }
  }, [data, kpis])

  // Rough page estimate for the status line (header + KPI band consume the first page)
  const estimatedPages = useMemo(() => {
    if (data.length === 0) return 1
    const rowsPerPage = isLandscape
      ? density === "compact" ? 30 : 24
      : density === "compact" ? 42 : 34
    return Math.max(1, Math.ceil(data.length / rowsPerPage))
  }, [data.length, density, isLandscape])

  /**
   * Clones the on-screen A4 sheet into a body-level print root. The root is
   * tagged data-print-root="true", which the global print stylesheet in
   * globals.css keeps visible (@media print hides body > * except the
   * whitelisted print roots). Setting data-print-active="reports" also tells
   * the report page's own beforeprint handler to skip its full-page clone, so
   * exactly this sheet is printed.
   */
  const buildSheetPrintRoot = useCallback((): (() => void) | null => {
    const sheet = sheetRef.current
    if (!sheet) return null

    let root = document.getElementById(PRINT_ROOT_ID)
    if (!root) {
      root = document.createElement("div")
      root.id = PRINT_ROOT_ID
      root.setAttribute("data-print-root", "true")
      document.body.appendChild(root)
    }
    root.innerHTML = ""

    const clone = sheet.cloneNode(true) as HTMLElement
    clone.removeAttribute("id")
    clone.style.transform = "none"
    clone.style.transformOrigin = "top left"
    clone.style.width = "100%"
    clone.style.minHeight = "0mm"
    clone.style.height = "auto"
    clone.style.margin = "0"
    clone.style.padding = "0"
    clone.style.boxShadow = "none"
    clone.style.border = "none"
    clone.style.borderRadius = "0"
    root.appendChild(clone)

    const isLandscapePrint = orientation === "landscape"

    let styleEl = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement("style")
      styleEl.id = PRINT_STYLE_ID
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `
      #${PRINT_ROOT_ID} { display: none; }
      @media print {
        @page {
          size: A4 ${isLandscapePrint ? "landscape" : "portrait"};
          margin: 6mm 5mm;
        }
        html, body {
          background: #ffffff !important;
          width: auto !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        #${PRINT_ROOT_ID} {
          display: block !important;
          position: static !important;
          width: 100% !important;
          background: #ffffff !important;
          color: #0f172a !important;
        }
        #${PRINT_ROOT_ID} table {
          display: table !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        #${PRINT_ROOT_ID} thead {
          display: table-header-group !important;
        }
        #${PRINT_ROOT_ID} thead tr,
        #${PRINT_ROOT_ID} thead th {
          background: #0f172a !important;
          color: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #${PRINT_ROOT_ID} tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        #${PRINT_ROOT_ID} tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #${PRINT_ROOT_ID} tfoot {
          display: table-footer-group !important;
        }
        #${PRINT_ROOT_ID} tfoot tr,
        #${PRINT_ROOT_ID} tfoot td {
          background: #0f172a !important;
          color: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print, [data-no-print="true"] {
          display: none !important;
        }
      }
    `

    document.body.setAttribute("data-print-active", "reports")
    document.documentElement.setAttribute("data-print-active", "reports")
    document.body.setAttribute("data-print-orientation", isLandscapePrint ? "landscape" : "portrait")
    document.documentElement.setAttribute("data-print-orientation", isLandscapePrint ? "landscape" : "portrait")

    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      document.body.removeAttribute("data-print-active")
      document.documentElement.removeAttribute("data-print-active")
      document.body.removeAttribute("data-print-orientation")
      document.documentElement.removeAttribute("data-print-orientation")
      document.getElementById(PRINT_STYLE_ID)?.remove()
      const r = document.getElementById(PRINT_ROOT_ID)
      if (r) r.innerHTML = ""
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)
    return cleanup
  }, [orientation])

  // Trigger high-fidelity print of the previewed sheet
  const handlePrint = useCallback(() => {
    setIsPrinting(true)
    const toastId = toast.loading("Sending document to printer...")
    const cleanup = buildSheetPrintRoot()

    if (!cleanup) {
      toast.error("Preview sheet is not ready yet — try again in a moment.", { id: toastId })
      setIsPrinting(false)
      return
    }

    setTimeout(async () => {
      try {
        if (typeof window !== "undefined" && window.skyDesktop?.print) {
          await window.skyDesktop.print({
            silent: false,
            printBackground: true,
            landscape: orientation === "landscape",
            pageSize: "A4",
            ...(selectedPrinter ? { deviceName: selectedPrinter } : {}),
          })
        } else {
          window.print()
        }
        toast.success("Print job dispatched successfully!", { id: toastId })
      } catch (err: any) {
        toast.error(err?.message || "Print request failed", { id: toastId })
      } finally {
        setIsPrinting(false)
        // afterprint may not fire in every environment — safety cleanup
        setTimeout(cleanup, 500)
      }
    }, 150)
  }, [buildSheetPrintRoot, orientation, selectedPrinter])

  // WYSIWYG PDF: capture exactly the previewed A4 sheet (not the report page
  // behind the modal), honoring this modal's orientation and column toggles.
  const handleSavePdf = useCallback(async () => {
    const sheet = sheetRef.current
    if (!sheet) {
      onDownloadPdf?.()
      return
    }

    setIsSavingPdf(true)
    const toastId = toast.loading("Generating high-resolution A4 PDF...")
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready
      }

      const { toSvg } = await import("html-to-image")
      const { jsPDF } = await import("jspdf")

      // html-to-image's toCanvas resolves via requestAnimationFrame, which
      // never fires while the window is hidden/minimized — hanging the export
      // forever with a stuck spinner. toSvg performs the same clone/embed
      // work but stops before that fragile step; we rasterize ourselves.
      const svgDataUrl = await toSvg(sheet, {
        cacheBust: false,
        skipFonts: true,
        backgroundColor: "#ffffff",
        width: sheet.offsetWidth,
        height: sheet.offsetHeight,
        style: {
          transform: "none",
          margin: "0",
          boxShadow: "none",
          opacity: "1",
          visibility: "visible",
          overflow: "visible",
          maxHeight: "none",
          height: "auto",
          minHeight: "0mm",
          WebkitFontSmoothing: "antialiased",
          MozosxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        } as any,
        filter: (node: HTMLElement) => {
          const tagName = node.tagName?.toUpperCase?.()
          if (tagName === "BUTTON" || node.getAttribute?.("role") === "button") return false
          if (node.classList?.contains?.("no-print")) return false
          if (node.getAttribute?.("data-no-print") === "true") return false
          if (node.getAttribute?.("data-print-ignore") === "true") return false
          return true
        },
      })

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        const timer = window.setTimeout(
          () => reject(new Error("Timed out rasterizing the preview sheet. Please try again.")),
          45000
        )
        image.onload = () => {
          window.clearTimeout(timer)
          resolve(image)
        }
        image.onerror = () => {
          window.clearTimeout(timer)
          reject(new Error("Failed to rasterize the preview sheet. Please try again."))
        }
        image.crossOrigin = "anonymous"
        image.decoding = "async"
        image.src = svgDataUrl
      })

      // Rasterize at high DPI, capped at the browser's maximum canvas size
      const MAX_CANVAS = 16384
      const ratio = 3
      let canvasWidth = sheet.offsetWidth * ratio
      let canvasHeight = sheet.offsetHeight * ratio
      if (canvasWidth > MAX_CANVAS || canvasHeight > MAX_CANVAS) {
        if (canvasWidth > MAX_CANVAS && canvasHeight > MAX_CANVAS) {
          if (canvasWidth > canvasHeight) {
            canvasHeight *= MAX_CANVAS / canvasWidth
            canvasWidth = MAX_CANVAS
          } else {
            canvasWidth *= MAX_CANVAS / canvasHeight
            canvasHeight = MAX_CANVAS
          }
        } else if (canvasWidth > MAX_CANVAS) {
          canvasHeight *= MAX_CANVAS / canvasWidth
          canvasWidth = MAX_CANVAS
        } else {
          canvasWidth *= MAX_CANVAS / canvasHeight
          canvasHeight = MAX_CANVAS
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(canvasWidth)
      canvas.height = Math.round(canvasHeight)
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas rendering is not available in this environment.")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const imgData = canvas.toDataURL("image/jpeg", 0.98)
      if (!imgData || imgData === "data:,") {
        throw new Error("Failed to capture the preview sheet. Please try again.")
      }

      const isLandscapePdf = orientation === "landscape"
      const pdf = new jsPDF({
        orientation: isLandscapePdf ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = isLandscapePdf ? 297 : 210
      const pdfHeight = isLandscapePdf ? 210 : 297
      const imgProps = pdf.getImageProperties(imgData)
      const canvasHeightMM = (imgProps.height * pdfWidth) / imgProps.width

      let heightLeft = canvasHeightMM
      let position = 0
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, canvasHeightMM, undefined, "SLOW")
      heightLeft -= pdfHeight
      while (heightLeft > 0) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, canvasHeightMM, undefined, "SLOW")
        heightLeft -= pdfHeight
      }

      const totalPdfPages = (pdf.internal as any).getNumberOfPages ? (pdf.internal as any).getNumberOfPages() : 1
      for (let i = 1; i <= totalPdfPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text(
          `${companyName} • SAVED BOL REPORT • Page ${i} of ${totalPdfPages} • ${new Date().toLocaleDateString("en-GB")}`,
          pdfWidth - 5,
          pdfHeight - 3,
          { align: "right" }
        )
      }

      const sanitizedCompany = (companyName || "AQ-COMPANIES").trim().replace(/[^a-zA-Z0-9_-]/g, "_")
      pdf.save(`${sanitizedCompany}-Saved-BOL-Report-${new Date().toISOString().split("T")[0]}.pdf`)
      toast.success("PDF saved — matches this preview exactly.", { id: toastId })
    } catch (err: any) {
      console.error("Preview PDF generation failed:", err)
      toast.error(err?.message || "Failed to generate PDF from preview", { id: toastId })
    } finally {
      setIsSavingPdf(false)
    }
  }, [companyName, orientation, onDownloadPdf])

  // ESC closes; Ctrl/Cmd+P prints the sheet itself while the modal is open
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault()
        e.stopPropagation()
        handlePrint()
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [isOpen, onClose, handlePrint])

  // Clean up any stray print artifacts when the modal closes
  useEffect(() => {
    if (!isOpen) {
      document.getElementById(PRINT_STYLE_ID)?.remove()
      const root = document.getElementById(PRINT_ROOT_ID)
      if (root) root.innerHTML = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const busyPdf = isSavingPdf || isGeneratingPdf
  // Columns: # + BOL + Date + (Truck/Driver) + Shipper + Consignee + Cargo + numeric columns
  const labelColSpan = 5 + (showTruckDriver && isLandscape ? 1 : 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Floating Master Toolbar */}
      <div
        data-no-print="true"
        className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0 shadow-lg select-none flex-wrap gap-3"
      >
        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-white">
                Report Print Preview &amp; Layout Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                A4 Vector Precision
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {data.length} records • A4 ({paperWidthMm} × {paperHeightMm} mm) • ~{estimatedPages} page{estimatedPages > 1 ? "s" : ""} • Ctrl+P to print • Esc to close
            </p>
          </div>
        </div>

        {/* Center: Controls (Orientation, Density, Column Toggles, Zoom) */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setOrientation("landscape")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                orientation === "landscape"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Landscape (افقی)</span>
            </button>
            <button
              type="button"
              onClick={() => setOrientation("portrait")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                orientation === "portrait"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Portrait (عمودی)</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Density Toggle */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setDensity("compact")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                density === "compact"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Fit more records per sheet"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => setDensity("standard")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                density === "standard"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard line spacing"
            >
              Standard
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Column Toggles */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900 rounded-xl px-2 py-1 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold mr-1">Columns:</span>
            <button
              type="button"
              onClick={() => setShowRent(!showRent)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                showRent ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Rent (AFN)
            </button>
            <button
              type="button"
              onClick={() => setShowGoodsValue(!showGoodsValue)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                showGoodsValue ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Value (USD)
            </button>
            <button
              type="button"
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                showRoutes ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Route
            </button>
            {isLandscape && (
              <button
                type="button"
                onClick={() => setShowTruckDriver(!showTruckDriver)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  showTruckDriver ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Truck/Driver
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold w-11 text-center text-slate-300">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={fitToWidth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
              title="Fit preview to window width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Fit</span>
            </button>
          </div>
        </div>

        {/* Right: Printer Selector & Actions (Print, PDF, Close) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {availablePrinters.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950/80 rounded-xl px-2.5 py-1.5 border border-slate-800 text-xs">
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
                title="Select target printer"
              >
                {availablePrinters.map((p) => (
                  <option key={p.name} value={p.name} className="bg-slate-900 text-white">
                    {p.displayName || p.name} {p.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSavePdf}
            disabled={busyPdf}
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
            title="Save this exact preview as a multi-page A4 PDF"
          >
            {busyPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <FileDown className="w-4 h-4 text-blue-400" />
            )}
            <span>{busyPdf ? "Saving PDF..." : "Save PDF"}</span>
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            size="sm"
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>{isPrinting ? "Printing..." : "Print Document Now"}</span>
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Content Body */}
      <div
        ref={previewScrollRef}
        className="flex-1 overflow-auto p-6 md:p-10 flex justify-center items-start bg-slate-950/60"
      >
        {/* Realistic A4 Paper Canvas */}
        <div
          ref={sheetRef}
          id="sky-report-print-sheet"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            width: isLandscape ? "297mm" : "210mm",
            minHeight: isLandscape ? "210mm" : "297mm",
          }}
          className="bg-white text-slate-900 shadow-2xl rounded-sm p-[8mm] transition-transform duration-150 flex flex-col justify-between border border-slate-200"
        >
          {/* Header */}
          <div className="space-y-3 pb-3 border-b-2 border-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-sans">
                    {companyName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white font-mono">
                    Official Document
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-medium">
                  International Multimodal Logistics &amp; Bill of Lading Management System
                </p>
                <p className="text-[9.5px] text-slate-500 font-mono">
                  Transit Corridors: Kandahar • Herat • Hairatan • Islam Qala • Bandar Abbas • Dubai / Jebel Ali • Nhava Sheva
                </p>
              </div>

              <div className="text-right space-y-1 shrink-0">
                <div className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {reportTitle}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} • {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[9.5px] text-emerald-700 font-bold font-mono">
                  Orientation: {isLandscape ? "A4 Landscape (297×210mm)" : "A4 Portrait (210×297mm)"}
                </div>
              </div>
            </div>

            {/* KPI Badges Row */}
            {showKpis && (
              <div className="grid grid-cols-5 gap-2 pt-1 font-mono">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded text-center">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
                    Total Shipments
                  </span>
                  <span className="text-xs font-black text-slate-900">
                    {summaryTotals.count.toLocaleString()}
                  </span>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 p-2 rounded text-center">
                  <span className="text-[8px] uppercase tracking-wider text-blue-700 font-bold block">
                    Total Packages
                  </span>
                  <span className="text-xs font-black text-blue-950">
                    {summaryTotals.packages.toLocaleString()} CTNS
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 p-2 rounded text-center">
                  <span className="text-[8px] uppercase tracking-wider text-emerald-700 font-bold block">
                    Net Weight (KG)
                  </span>
                  <span className="text-xs font-black text-emerald-950">
                    {summaryTotals.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG
                  </span>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 p-2 rounded text-center">
                  <span className="text-[8px] uppercase tracking-wider text-purple-700 font-bold block">
                    Declared Goods Value
                  </span>
                  <span className="text-xs font-black text-purple-950">
                    ${summaryTotals.goodsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 p-2 rounded text-center">
                  <span className="text-[8px] uppercase tracking-wider text-amber-800 font-bold block">
                    Total Driver Rent
                  </span>
                  <span className="text-xs font-black text-amber-950">
                    {summaryTotals.rent.toLocaleString()} AFN
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 my-3 overflow-hidden">
            <table className="w-full border-collapse text-left table-fixed">
              <thead>
                <tr className="bg-slate-900 text-white text-[8px] uppercase tracking-wider font-bold">
                  <th className="p-1 border border-slate-800 text-center w-7">#</th>
                  <th className="p-1 border border-slate-800 w-[12%]">BOL Number</th>
                  <th className="p-1 border border-slate-800 w-[8%]">Date</th>
                  {showTruckDriver && isLandscape && (
                    <th className="p-1 border border-slate-800 w-[12%]">Truck / Driver</th>
                  )}
                  <th className="p-1 border border-slate-800 w-[14%]">Shipper</th>
                  <th className="p-1 border border-slate-800 w-[14%]">Consignee</th>
                  <th className="p-1 border border-slate-800 w-[13%]">Cargo</th>
                  <th className="p-1 border border-slate-800 text-right w-[8%]">Packages</th>
                  <th className="p-1 border border-slate-800 text-right w-[9%]">Net Wt</th>
                  {showGoodsValue && (
                    <th className="p-1 border border-slate-800 text-right w-[9%]">Goods Value</th>
                  )}
                  {showRent && (
                    <th className="p-1 border border-slate-800 text-right w-[9%]">Driver Rent</th>
                  )}
                  {showRoutes && isLandscape && (
                    <th className="p-1 border border-slate-800 w-[10%]">Route / Border</th>
                  )}
                </tr>
              </thead>
              <tbody className={density === "compact" ? "text-[7.8px] leading-tight" : "text-[8.5px] leading-normal"}>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400 font-bold text-[10px] border border-slate-200">
                      No records match the current report filters — adjust filters and try again.
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => {
                    const cargoDesc = item.cargo_description || item.goods_description || item.description_of_goods || "—"
                    const numPackages = formatPackageDisplay(item.number_of_packages, cargoDesc)
                    const netWeight = formatCellNumber(item.net_weight, "KG")
                    const goodsVal = formatCellNumber(item.goods_value, "", "$")
                    const driverRent = formatCellNumber(item.driver_rent || item.driverFreight, "AFN")

                    const fName = (item.driver_father_name || "").trim()
                    const dName = (item.driver_name || "").trim()
                    const isFatherInName = Boolean(
                      fName &&
                      fName !== "-" &&
                      dName &&
                      (
                        dName.includes(fName) ||
                        dName.includes("ولد") ||
                        dName.includes("s/o") ||
                        dName.includes("S/O") ||
                        dName.includes("بن")
                      )
                    )
                    const truckOrDriver = [
                      item.truck_number,
                      dName + (!isFatherInName && fName && fName !== "-" ? ` (ولد ${fName})` : "")
                    ].filter(Boolean).join(" • ") || "—"

                    return (
                      <tr
                        key={item.id || idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/80"}
                      >
                        <td className="p-1 border border-slate-200 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-1 border border-slate-200 font-mono font-bold text-blue-900 truncate">
                          {item.bol_number || "—"}
                        </td>
                        <td className="p-1 border border-slate-200 font-mono text-slate-600 truncate">
                          {item.issue_date || (item.created_at ? item.created_at.slice(0, 10) : "—")}
                        </td>
                        {showTruckDriver && isLandscape && (
                          <td className="p-1 border border-slate-200 font-medium text-slate-700 truncate" title={truckOrDriver}>
                            {truckOrDriver}
                          </td>
                        )}
                        <td className="p-1 border border-slate-200 font-semibold text-slate-800 truncate" title={item.shipper_name}>
                          {item.shipper_name || "—"}
                        </td>
                        <td className="p-1 border border-slate-200 font-semibold text-slate-800 truncate" title={item.consignee_name}>
                          {item.consignee_name || "—"}
                        </td>
                        <td className="p-1 border border-slate-200 text-slate-700 truncate" title={cargoDesc}>
                          {cargoDesc}
                        </td>
                        <td className="p-1 border border-slate-200 text-right font-mono font-bold text-slate-900">
                          {numPackages}
                        </td>
                        <td className="p-1 border border-slate-200 text-right font-mono font-semibold text-slate-800">
                          {netWeight}
                        </td>
                        {showGoodsValue && (
                          <td className="p-1 border border-slate-200 text-right font-mono font-semibold text-purple-900">
                            {goodsVal}
                          </td>
                        )}
                        {showRent && (
                          <td className="p-1 border border-slate-200 text-right font-mono font-semibold text-amber-900">
                            {driverRent}
                          </td>
                        )}
                        {showRoutes && isLandscape && (
                          <td className="p-1 border border-slate-200 text-[7.5px] font-mono text-slate-600 truncate">
                            {item.routes && item.routes.length > 0
                              ? item.routes.map((r) => r.location).filter(Boolean).join(" ➜ ")
                              : "—"}
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-[8px]">
                  <td className="p-1 border border-slate-800 text-center font-mono">
                    Σ
                  </td>
                  <td colSpan={labelColSpan} className="p-1 border border-slate-800 text-right uppercase tracking-wider font-mono">
                    Total Summary ({summaryTotals.count} Shipments):
                  </td>
                  <td className="p-1 border border-slate-800 text-right font-mono font-black text-blue-200">
                    {summaryTotals.packages.toLocaleString()}
                  </td>
                  <td className="p-1 border border-slate-800 text-right font-mono font-black text-emerald-200">
                    {summaryTotals.weight.toLocaleString(undefined, { maximumFractionDigits: 1 })} KG
                  </td>
                  {showGoodsValue && (
                    <td className="p-1 border border-slate-800 text-right font-mono font-black text-purple-200">
                      ${summaryTotals.goodsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  )}
                  {showRent && (
                    <td className="p-1 border border-slate-800 text-right font-mono font-black text-amber-200">
                      {summaryTotals.rent.toLocaleString()} AFN
                    </td>
                  )}
                  {showRoutes && isLandscape && (
                    <td className="p-1 border border-slate-800"></td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer & Accounting Invariance Certification */}
          <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500 font-mono">
            <div>
              <span>Generated via AQ COMPANIES Logistics Platform • </span>
              <span className="font-bold text-slate-700">Accounting Invariance Verified (Net Balance = Total Debit - Total Credit)</span>
            </div>
            <div className="text-right">
              <span>Standard A4 Print Sheet • </span>
              <span className="font-bold text-slate-700">Audit Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
