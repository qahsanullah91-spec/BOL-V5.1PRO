"use client"

import React, { useState, useMemo, useRef } from "react"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import type { AcciTemplateStyle, AcciPackingListData } from "@/lib/types/acci-documents"
import {
  generateAcciPackingListFromBol,
  formatDateToDMY,
} from "@/lib/utils/acci-document-generator"
import { downloadAcciPackingListDocx } from "@/lib/utils/acci-word-generator"
import { downloadAcciPackingListPdf } from "@/lib/utils/acci-pdf-generator"
import { Button } from "@/components/ui/button"
import {
  Printer,
  Download,
  FileDown,
  ArrowLeft,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  Package,
} from "lucide-react"

export interface PackingListViewProps {
  formData: BillOfLadingFormData
  onBackToEditor?: () => void
  onNavigateToTab?: (tab: string) => void
}

export function PackingListView({
  formData,
  onBackToEditor,
  onNavigateToTab,
}: PackingListViewProps) {
  const [templateStyle, setTemplateStyle] = useState<AcciTemplateStyle>(() =>
    /\b(?:air|airway|hamid karzai)\b/i.test(formData.cargo_description || "") ? "kabul" : "kandahar"
  )
  const [zoom, setZoom] = useState<number>(100)
  const [copied, setCopied] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [columnOrder, setColumnOrder] = useState<"matching-invoice" | "classic">("classic")

  // Manual overrides
  const [packingListNumberOverride, setPackingListNumberOverride] = useState<string>("")
  const [packingListDateOverride, setPackingListDateOverride] = useState<string>("")
  const [truckOverride, setTruckOverride] = useState<string>("")
  const [driverOverride, setDriverOverride] = useState<string>("")
  const [containerOverride, setContainerOverride] = useState<string>("")
  const [sealOverride, setSealOverride] = useState<string>("")

  const packingData: AcciPackingListData = useMemo(() => {
    const base = generateAcciPackingListFromBol(formData, {
      templateStyle,
      packingListNumberOverride: packingListNumberOverride.trim() || undefined,
      packingListDateOverride: packingListDateOverride.trim() || undefined,
    })

    return {
      ...base,
      vehicleInfo: {
        ...base.vehicleInfo,
        truckNumber: truckOverride.trim() || base.vehicleInfo?.truckNumber,
        driverName: driverOverride.trim() || base.vehicleInfo?.driverName,
        containerNumber: containerOverride.trim() || base.vehicleInfo?.containerNumber,
        sealNumber: sealOverride.trim() || base.vehicleInfo?.sealNumber,
      },
    }
  }, [
    formData,
    templateStyle,
    packingListNumberOverride,
    packingListDateOverride,
    truckOverride,
    driverOverride,
    containerOverride,
    sealOverride,
  ])

  const printAreaRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printArea = printAreaRef.current
    if (!printArea) {
      window.print()
      return
    }

    let root = document.getElementById("sky-invoice-print-root")
    if (!root) {
      root = document.createElement("div")
      root.id = "sky-invoice-print-root"
      root.className = "invoice-print-root"
      root.setAttribute("data-print-root", "true")
      document.body.appendChild(root)
    }
    root.innerHTML = ""

    const clone = printArea.cloneNode(true) as HTMLElement
    clone.style.transform = "none"
    clone.style.margin = "0 auto"
    clone.style.boxShadow = "none"
    clone.style.border = "none"
    clone.className = "invoice-print-root acci-document-cambria bg-white text-black w-full p-0 m-0"
    root.appendChild(clone)

    document.body.setAttribute("data-print-active", "invoice")
    document.documentElement.setAttribute("data-print-active", "invoice")

    const cleanup = () => {
      document.body.removeAttribute("data-print-active")
      document.documentElement.removeAttribute("data-print-active")
      if (root) root.innerHTML = ""
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)

    setTimeout(() => {
      window.print()
      setTimeout(cleanup, 2500)
    }, 80)
  }

  const handleDownloadPdf = () => {
    downloadAcciPackingListPdf(packingData)
  }

  const handleDownloadDocx = () => {
    downloadAcciPackingListDocx(packingData)
  }

  const handleCopyText = async () => {
    const text = `
*PACKING LIST - SKY ARIANA LTD*
No: ${packingData.packingListNumber}
Date: ${packingData.date}
Consignee: ${packingData.consignee.name}
Total Packages: ${packingData.totalPackages}
Total Net Weight: ${packingData.totalNetWeight} KGS
Total Gross Weight: ${packingData.totalGrossWeight} KGS
Truck No: ${packingData.vehicleInfo?.truckNumber || "N/A"}
Driver: ${packingData.vehicleInfo?.driverName || "N/A"}
Route: ${packingData.transit.via}
    `.trim()

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 pb-12">
      {/* Action Toolbar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 shadow-sm print:hidden">
        <div className="max-w-[1500px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Navigation and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onBackToEditor && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToEditor}
                className="h-8 gap-1.5 text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">BOL Editor</span>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-amber-600/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Package className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  Packing List (ACCI)
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    Auto-Synced
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Exact Chamber of Commerce Word layout &bull; List #{packingData.packingListNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Template toggle & Zoom */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTemplateStyle("kandahar")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  templateStyle === "kandahar"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Kandahar (Road)
              </button>
              <button
                type="button"
                onClick={() => setTemplateStyle("kabul")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  templateStyle === "kabul"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Kabul (Air)
              </button>
            </div>

            {/* Layout Order Switcher: Same as Invoice vs Classic */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setColumnOrder("matching-invoice")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  columnOrder === "matching-invoice"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Column layout matches Commercial Invoice (Quantity in Col 2, Description in Col 3)"
              >
                Same as Invoice
              </button>
              <button
                type="button"
                onClick={() => setColumnOrder("classic")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  columnOrder === "classic"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Classic Chamber layout (Description in Col 2, Quantity in Col 3)"
              >
                Chamber Classic
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 dark:text-slate-400"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] font-mono px-1.5 text-slate-700 dark:text-slate-300 min-w-[42px] text-center font-bold">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 dark:text-slate-400"
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-600 dark:text-slate-400"
                onClick={() => setZoom(100)}
                title="Reset Zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`h-8 gap-1.5 text-xs font-bold border-slate-300 dark:border-slate-700 ${
                isEditMode ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300" : ""
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isEditMode ? "Done Editing" : "Edit Fields"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="h-8 gap-1.5 text-xs font-bold border-slate-300 dark:border-slate-700"
              title="Copy Summary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{copied ? "Copied" : "Copy"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadDocx}
              className="h-8 gap-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
              title="Download Word Document (.docx)"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Word (.docx)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="h-8 gap-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              title="Download Vector PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Edit Fields Bar */}
        {isEditMode && (
          <div className="max-w-[1500px] mx-auto mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Packing List No</label>
              <input
                type="text"
                placeholder={packingData.packingListNumber}
                value={packingListNumberOverride}
                onChange={(e) => setPackingListNumberOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Date (DD/MM/YYYY)</label>
              <input
                type="text"
                placeholder={packingData.date}
                value={packingListDateOverride}
                onChange={(e) => setPackingListDateOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Truck Number</label>
              <input
                type="text"
                placeholder="Truck No"
                value={truckOverride}
                onChange={(e) => setTruckOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Driver Name</label>
              <input
                type="text"
                placeholder="Driver Name"
                value={driverOverride}
                onChange={(e) => setDriverOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Container Number</label>
              <input
                type="text"
                placeholder="Container No"
                value={containerOverride}
                onChange={(e) => setContainerOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Seal Number</label>
              <input
                type="text"
                placeholder="Seal No"
                value={sealOverride}
                onChange={(e) => setSealOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main A4 Document Canvas */}
      <div className="flex-1 flex justify-center p-2 sm:p-6 overflow-x-auto print:p-0 print:m-0 print:overflow-visible">
        <div
          ref={printAreaRef}
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
            transformOrigin: "top center",
          }}
          className="acci-document-cambria bg-white text-black shadow-xl print:shadow-none w-[210mm] min-h-[297mm] p-[12mm] box-border select-text border border-slate-300 dark:border-slate-700 print:border-none print:w-full print:p-0 print:m-0 flex flex-col justify-between"
        >
          <div className="flex-1 flex flex-col min-h-full">
            {/* Header Title: Underlined (No Asterisks matching official ACCI packing list) */}
            <div className="text-center mb-3">
              <h1 className="text-2xl font-bold tracking-wider text-black font-serif underline decoration-1 underline-offset-4">
                PACKING LIST
              </h1>
            </div>

            {/* Top Section: EXACT 2 Columns Side-by-Side (50% / 50% Full-Width Alignment matching authentic Word template) */}
            <div className="grid grid-cols-2 gap-4 text-xs items-stretch w-full">
              {/* Left Column: Outer Bordered Party Box */}
              <div className="border border-black p-2.5 flex flex-col justify-between text-[10.5px] leading-tight w-full min-h-[195px]">
                <div>
                  <p className="font-bold text-[11px]">FROM: {packingData.exporter.name}</p>
                  <p className="text-[10px] mt-0.5 leading-snug">
                    {packingData.exporter.tlNo ? `T.L NO: ${packingData.exporter.tlNo} ` : ""}
                    {packingData.exporter.address ? `ADD: ${packingData.exporter.address}` : ""}
                  </p>
                  {(packingData.exporter.phone || packingData.exporter.email) && (
                    <p className="text-[10px] mt-0.5">
                      {packingData.exporter.phone && `TEL: ${packingData.exporter.phone} `}
                      {packingData.exporter.email && (
                        <>
                          EMAIL:{" "}
                          <span className="text-blue-700 underline">{packingData.exporter.email}</span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="my-1.5 border-b border-dashed border-black w-full" />

                <div className="space-y-1">
                  <div>
                    <p className="font-bold text-[11px]">TO: {packingData.consignee.name}</p>
                    <p className="text-[10px] mt-0.5 whitespace-pre-line leading-snug">{packingData.consignee.address}</p>
                  </div>

                  {packingData.notifyParty && (
                    <div className="pt-0.5 leading-tight">
                      <p className="font-bold text-[10.5px]">NOTIFY PARTY:</p>
                      <p className="font-bold text-[10px]">{packingData.notifyParty.name}</p>
                      <p className="text-[9.5px] leading-snug">
                        {packingData.notifyParty.address}
                        {packingData.notifyParty.trn && ` TRN NO: ${packingData.notifyParty.trn}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: No/Date at Top, Transit Table Full-Width Below */}
              <div className="flex flex-col justify-between w-full">
                <div className="mb-1 text-xs font-serif leading-tight">
                  <p className="font-bold text-[11px]">No: {packingData.packingListNumber}</p>
                  <p className="font-bold text-[11px] mt-0.5">Date: {packingData.date}</p>
                </div>

                {/* Afghan Transit Form Table (Single horizontal cells matching authentic image) */}
                <div className="border border-black text-[10.5px] w-full">
                  {/* Row 1: Title - Dynamic transit docTitle with fallback: Afghan Transit form Airway Bill. */}
                  <div className="border-b border-black py-1 px-2.5 font-bold text-xs tracking-wide text-center">
                    {packingData.transit.docTitle.includes("Way Bill") ? (
                      <>
                        Afghan Transit Form <span className="underline">Way Bill</span>
                      </>
                    ) : (
                      packingData.transit.docTitle || "Afghan Transit form Airway Bill."
                    )}
                  </div>

                  {/* Row 2: NO & Date (NO vertical divider, matching reference image) */}
                  <div className="border-b border-black py-1 px-2.5 flex justify-between items-center text-[10px]">
                    <span className="font-bold">NO: {packingData.transit.bolNumber || ""}</span>
                    <span className="font-bold pr-6">Date: {packingData.transit.bolDate || ""}</span>
                  </div>

                  {/* Row 3: Terms of Payment (Centered) */}
                  <div className="border-b border-black py-1 px-2 text-center text-[10px] font-bold">
                    Terms of Payment: {packingData.transit.termsOfPayment || ""}
                  </div>

                  {/* Row 4: Letter of Credit & Collection Basis (NO vertical divider, matching reference image) */}
                  <div className="border-b border-black py-1 px-2.5 text-[9.5px] leading-tight">
                    <div className="flex justify-between items-center">
                      <span>Letter of Credit</span>
                      <span className="pr-6">Collection Basis</span>
                    </div>
                    <div className="mt-0.5">No:</div>
                  </div>

                  {/* Row 5: Through & Via */}
                  <div className="py-1 px-2.5 text-[9.5px] leading-tight">
                    <div className="font-bold">Through:</div>
                    <div className="mt-0.5 font-bold">
                      Via:{packingData.transit.via}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Goods Table */}
            <div className="border border-black mt-4 w-full flex-1 flex flex-col">
              {columnOrder === "matching-invoice" ? (
                /* Matching Commercial Invoice Layout: NO | Quantity | Description of Goods */
                <>
                  <div
                    className="grid grid-cols-[8%_32%_60%] bg-white font-bold text-center text-xs divide-x divide-black"
                    style={{ borderBottom: "3px double black" }}
                  >
                    <div
                      className="py-1.5 flex items-center justify-center font-bold"
                      style={{ borderRight: "3px double black" }}
                    >
                      NO
                    </div>
                    <div className="py-1.5 flex items-center justify-center">Quantity</div>
                    <div className="py-1.5 flex items-center justify-center">Description of Goods</div>
                  </div>

                  <div className="grid grid-cols-[8%_32%_60%] divide-x divide-black min-h-[550px] flex-1 text-xs">
                    {/* Column 1: NO (Double right border) */}
                    <div
                      className="p-2 text-center font-bold text-sm"
                      style={{ borderRight: "3px double black" }}
                    >
                      {packingData.items.map((item) => (
                        <div key={item.no} className="mb-3">{item.no}</div>
                      ))}
                    </div>

                    {/* Column 2: Quantity (Packages, NW, GW) */}
                    <div className="p-3 font-bold text-left leading-normal">
                      {packingData.items.map((item, idx) => (
                        <div key={idx} className="mb-3 space-y-1">
                          <div className="text-sm font-bold uppercase">{item.packagesCount} {item.packageType}</div>
                          <div className="text-xs">NW: {item.netWeight} KGS</div>
                          <div className="text-xs">GW: {item.grossWeight} KGS</div>
                        </div>
                      ))}
                    </div>

                    {/* Column 3: Description of Goods (Commodity, Origin & Stamp at Bottom) */}
                    <div className="p-3 flex flex-col justify-between text-left">
                      <div>
                        {packingData.items.map((item, idx) => (
                          <p key={idx} className="font-bold text-sm tracking-wide mb-2 uppercase">
                            {item.description}
                          </p>
                        ))}
                      </div>

                      {/* Origin & Stamp at Bottom */}
                      <div className="mt-auto pt-6 flex items-end justify-between px-6">
                        <div className="text-center">
                          <p className="font-serif text-base font-bold text-black">{packingData.originCountry}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold uppercase tracking-wider leading-snug whitespace-nowrap">
                            SKY<br />ARIANA LTD
                          </p>
                          <div className="border-b-2 border-black w-32 mx-auto mt-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Classic Chamber Layout: No | Description of Goods | Quantity */
                <>
                  <div
                    className="grid grid-cols-[10%_58%_32%] bg-white font-bold text-center text-xs divide-x divide-black"
                    style={{ borderBottom: "3px double black" }}
                  >
                    <div
                      className="py-1.5 flex items-center justify-center font-bold"
                      style={{ borderRight: "3px double black" }}
                    >
                      No
                    </div>
                    <div className="py-1.5 flex items-center justify-center">Description of Goods</div>
                    <div className="py-1.5 flex items-center justify-center">Quantity</div>
                  </div>

                  <div className="grid grid-cols-[10%_58%_32%] divide-x divide-black min-h-[550px] flex-1 text-xs">
                    {/* Column 1: No (Double right border) */}
                    <div
                      className="p-2 text-center font-bold text-sm"
                      style={{ borderRight: "3px double black" }}
                    >
                      {packingData.items.map((item) => (
                        <div key={item.no} className="mb-3">{item.no}.</div>
                      ))}
                    </div>

                    {/* Column 2: Description of Goods (Centered Commodity, Vertically & Horizontally Centered Origin) */}
                    <div className="p-3 flex flex-col text-center">
                      <div className="min-h-[90px]">
                        {packingData.items.map((item, idx) => (
                          <p key={idx} className="font-bold text-sm tracking-wide mb-2 uppercase text-center">
                            {item.description}
                          </p>
                        ))}
                      </div>

                      {/* Origin at Vertical Center */}
                      <div className="flex-1 flex items-center justify-center pb-14 text-center">
                        <p className="font-serif text-[19px] font-normal text-black tracking-wide">{packingData.originCountry}</p>
                      </div>
                    </div>

                    {/* Column 3: Quantity (Centered Packages/Weights, Vertically & Horizontally Centered Stamp) */}
                    <div className="p-3 flex flex-col text-center font-bold">
                      <div className="min-h-[90px] space-y-1">
                        {packingData.items.map((item, idx) => (
                          <div key={idx} className="mb-3 space-y-1 text-xs text-center">
                            <div className="text-sm font-bold uppercase">{item.packagesCount} {item.packageType}</div>
                            <div className="text-xs">NW: {item.netWeight} KGS</div>
                            <div className="text-xs">GW: {item.grossWeight} KGS</div>
                          </div>
                        ))}
                      </div>

                      {/* Stamp / Signature at Vertical Center (Aligned horizontally with Origin) */}
                      <div className="flex-1 flex flex-col items-center justify-center pb-14 text-center">
                        <p className="text-[14.5px] font-bold uppercase tracking-wider leading-snug whitespace-nowrap">
                          SKY<br />ARIANA LTD
                        </p>
                        <div className="text-slate-800 font-mono text-[11px] tracking-tighter select-none overflow-hidden whitespace-nowrap mt-1">
                          ------------------------------
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
