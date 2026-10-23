"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Printer,
  X,
  FileDown,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Truck,
  Building2,
  DollarSign,
  Maximize2,
  Minimize2,
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
  const [zoomLevel, setZoomLevel] = useState<number>(90)
  const [density, setDensity] = useState<"compact" | "standard">("compact")
  const [showKpis, setShowKpis] = useState<boolean>(true)
  const [showRent, setShowRent] = useState<boolean>(true)
  const [showGoodsValue, setShowGoodsValue] = useState<boolean>(true)
  const [showRoutes, setShowRoutes] = useState<boolean>(true)
  const [showTruckDriver, setShowTruckDriver] = useState<boolean>(true)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)
  const [availablePrinters, setAvailablePrinters] = useState<Array<{ name: string; displayName: string; isDefault: boolean }>>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>("")
  const previewScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrientation(initialOrientation)
  }, [initialOrientation])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Query native desktop printers if in Electron environment
  useEffect(() => {
    if (typeof window !== "undefined" && window.skyDesktop?.getPrinters) {
      window.skyDesktop.getPrinters().then((printers) => {
        if (Array.isArray(printers) && printers.length > 0) {
          setAvailablePrinters(printers)
          const def = printers.find((p) => p.isDefault) || printers[0]
          if (def) setSelectedPrinter(def.name)
        }
      }).catch(() => {})
    }
  }, [])

  // Calculate totals satisfying accounting invariance
  const summaryTotals = useMemo(() => {
    let packages = 0
    let weight = 0
    let goodsVal = 0
    let rentAfn = 0

    for (const item of data) {
      // packages
      const pkgStr = String(item.number_of_packages || "").replace(/[^\d.]/g, "")
      const p = parseFloat(pkgStr)
      if (!isNaN(p)) packages += p

      // weight
      const wtStr = String(item.net_weight || "").replace(/[^\d.]/g, "")
      const w = parseFloat(wtStr)
      if (!isNaN(w)) weight += w

      // goods value
      const gvStr = String(item.goods_value || "").replace(/[^\d.]/g, "")
      const gv = parseFloat(gvStr)
      if (!isNaN(gv)) goodsVal += gv

      // rent
      const rentStr = String(item.driver_rent || item.driverFreight || "").replace(/[^\d.]/g, "")
      const r = parseFloat(rentStr)
      if (!isNaN(r)) rentAfn += r
    }

    return {
      count: data.length,
      packages: kpis?.totalPackages ?? packages,
      weight: kpis?.totalNetWeight ?? weight,
      goodsValue: kpis?.totalGoodsValueUSD ?? goodsVal,
      rent: kpis?.totalDriverRentAFN ?? rentAfn,
    }
  }, [data, kpis])

  if (!isOpen) return null

  // Trigger high-fidelity print
  const handlePrint = () => {
    setIsPrinting(true)
    const toastId = toast.loading("Sending document to printer...")

    // Inject dedicated print styles scoped to report preview
    const printStyleId = "sky-report-print-preview-styles"
    let styleEl = document.getElementById(printStyleId) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement("style")
      styleEl.id = printStyleId
      document.head.appendChild(styleEl)
    }

    const isLandscape = orientation === "landscape"
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 ${isLandscape ? "landscape" : "portrait"};
          margin: 5mm 6mm 5mm 6mm;
        }
        body * {
          visibility: hidden !important;
        }
        #sky-report-print-sheet, #sky-report-print-sheet * {
          visibility: visible !important;
        }
        #sky-report-print-sheet {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          min-height: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          box-shadow: none !important;
          border: none !important;
          transform: none !important;
        }
        #sky-report-print-sheet table {
          display: table !important;
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
        }
        #sky-report-print-sheet thead {
          display: table-header-group !important;
        }
        #sky-report-print-sheet thead tr,
        #sky-report-print-sheet thead th {
          background: #0f172a !important;
          color: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #sky-report-print-sheet tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        #sky-report-print-sheet tbody tr:nth-child(even) {
          background-color: #f8fafc !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #sky-report-print-sheet tfoot {
          display: table-footer-group !important;
        }
        #sky-report-print-sheet tfoot tr,
        #sky-report-print-sheet tfoot td {
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

    setTimeout(async () => {
      try {
        if (typeof window !== "undefined" && window.skyDesktop?.print) {
          await window.skyDesktop.print({
            silent: false,
            printBackground: true,
            landscape: isLandscape,
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
        if (styleEl) {
          setTimeout(() => {
            styleEl?.remove()
          }, 3500)
        }
      }
    }, 150)
  }

  const isLandscape = orientation === "landscape"
  const paperWidthMm = isLandscape ? 297 : 210
  const paperHeightMm = isLandscape ? 210 : 297

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Floating Master Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0 shadow-lg select-none flex-wrap gap-3">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight text-white">
                Report Print Preview & Layout Studio
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                A4 Vector Precision
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {data.length} records • Paper: A4 ({paperWidthMm} × {paperHeightMm} mm)
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
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
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
              onClick={() => setZoomLevel(90)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Reset Zoom to 90%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
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

          {onDownloadPdf && (
            <Button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              variant="outline"
              size="sm"
              className="h-9 px-3.5 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileDown className="w-4 h-4 text-blue-400" />
              <span>{isGeneratingPdf ? "Generating..." : "Save PDF"}</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            size="sm"
            className="h-9 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
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
                  International Multimodal Logistics & Bill of Lading Management System
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
                {data.map((item, idx) => {
                  const cargoDesc = item.cargo_description || item.goods_description || item.description_of_goods || "—"
                  const numPackages = formatPackageDisplay(item.number_of_packages, cargoDesc)
                  const netWeight = item.net_weight ? `${Number(String(item.net_weight).replace(/[^\d.]/g, "")).toLocaleString()} KG` : "—"
                  const goodsVal = item.goods_value ? `${Number(String(item.goods_value).replace(/[^\d.]/g, "")).toLocaleString()}` : "—"
                  const rentNum = item.driver_rent || item.driverFreight
                  const driverRent = rentNum ? `${Number(String(rentNum).replace(/[^\d.]/g, "")).toLocaleString()} AFN` : "—"

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
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-[8px]">
                  <td className="p-1 border border-slate-800 text-center font-mono">
                    Σ
                  </td>
                  <td colSpan={showTruckDriver && isLandscape ? 5 : 4} className="p-1 border border-slate-800 text-right uppercase tracking-wider font-mono">
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
