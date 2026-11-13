"use client"

import React, { useState, useMemo, useRef } from "react"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import type { AcciTemplateStyle, AcciInvoiceData } from "@/lib/types/acci-documents"
import {
  generateAcciInvoiceFromBol,
  formatDateToDMY,
  getShamsiDateString,
} from "@/lib/utils/acci-document-generator"
import { downloadAcciInvoiceDocx } from "@/lib/utils/acci-word-generator"
import { downloadAcciInvoicePdf } from "@/lib/utils/acci-pdf-generator"
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
  FileText,
} from "lucide-react"

export interface CommercialInvoiceViewProps {
  formData: BillOfLadingFormData
  onBackToEditor?: () => void
  onNavigateToTab?: (tab: string) => void
}

export function CommercialInvoiceView({
  formData,
  onBackToEditor,
  onNavigateToTab,
}: CommercialInvoiceViewProps) {
  const [templateStyle, setTemplateStyle] = useState<AcciTemplateStyle>(() =>
    /\b(?:air|airway|hamid karzai)\b/i.test(formData.cargo_description || "") ? "kabul" : "kandahar"
  )
  const [zoom, setZoom] = useState<number>(100)
  const [copied, setCopied] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)

  // User manual overrides
  const [invoiceNumberOverride, setInvoiceNumberOverride] = useState<string>("")
  const [invoiceDateOverride, setInvoiceDateOverride] = useState<string>("")
  const [shamsiDateOverride, setShamsiDateOverride] = useState<string>("")
  const [feeNoOverride, setFeeNoOverride] = useState<string>("")
  const [regNoOverride, setRegNoOverride] = useState<string>("")
  const [receivedSumOverride, setReceivedSumOverride] = useState<string>("")
  const [termsOverride, setTermsOverride] = useState<string>("")

  const invoiceData: AcciInvoiceData = useMemo(() => {
    const base = generateAcciInvoiceFromBol(formData, {
      templateStyle,
      invoiceNumberOverride: invoiceNumberOverride.trim() || undefined,
      invoiceDateOverride: invoiceDateOverride.trim() || undefined,
    })

    return {
      ...base,
      transit: {
        ...base.transit,
        termsOfPayment: termsOverride.trim() || base.transit.termsOfPayment,
      },
      acciChamber: {
        ...base.acciChamber,
        regNo: regNoOverride.trim() ? `------------------${regNoOverride.trim()}--------------------` : base.acciChamber.regNo,
        feeNo: feeNoOverride.trim() ? `------------------${feeNoOverride.trim()}--------------------` : base.acciChamber.feeNo,
        receivedSum: receivedSumOverride.trim() || base.acciChamber.receivedSum,
        shamsiDate: shamsiDateOverride.trim() ? `-----------------${shamsiDateOverride.trim()}-----------------` : base.acciChamber.shamsiDate,
      },
    }
  }, [
    formData,
    templateStyle,
    invoiceNumberOverride,
    invoiceDateOverride,
    shamsiDateOverride,
    feeNoOverride,
    regNoOverride,
    receivedSumOverride,
    termsOverride,
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
    downloadAcciInvoicePdf(invoiceData)
  }

  const handleDownloadDocx = () => {
    downloadAcciInvoiceDocx(invoiceData)
  }

  const handleCopyText = async () => {
    const text = `
*COMMERCIAL INVOICE - SKY ARIANA LTD*
Invoice No: ${invoiceData.invoiceNumber}
Date: ${invoiceData.invoiceDate}
Consignee: ${invoiceData.consignee.name}
Destination: ${invoiceData.transit.via}
Total Packages: ${invoiceData.totalPackages}
Total Net Weight: ${invoiceData.totalNetWeight} KGS
Total Amount: $${invoiceData.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
Amount in Words: ${invoiceData.amountInWords}
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
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 shadow-sm print:hidden">
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
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  ACCI Commercial Invoice
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    Exact Word Format
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Side-by-side waybill & chamber layout &bull; Invoice #{invoiceData.invoiceNumber}
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
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
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
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Kabul (Air)
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
              title="Download Exact Word Document (.docx)"
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
              className="h-8 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Edit Fields Bar */}
        {isEditMode && (
          <div className="max-w-[1500px] mx-auto mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Inv Number</label>
              <input
                type="text"
                placeholder={invoiceData.invoiceNumber}
                value={invoiceNumberOverride}
                onChange={(e) => setInvoiceNumberOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Date (DD/MM/YYYY)</label>
              <input
                type="text"
                placeholder={invoiceData.invoiceDate}
                value={invoiceDateOverride}
                onChange={(e) => setInvoiceDateOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Shamsi Date</label>
              <input
                type="text"
                placeholder="28/07/1405"
                value={shamsiDateOverride}
                onChange={(e) => setShamsiDateOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">ACCI Fee No</label>
              <input
                type="text"
                placeholder="0000"
                value={feeNoOverride}
                onChange={(e) => setFeeNoOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Received Sum (AFN)</label>
              <input
                type="text"
                placeholder="2,330"
                value={receivedSumOverride}
                onChange={(e) => setReceivedSumOverride(e.target.value)}
                className="w-full mt-0.5 px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Terms</label>
              <input
                type="text"
                placeholder={invoiceData.transit.termsOfPayment}
                value={termsOverride}
                onChange={(e) => setTermsOverride(e.target.value)}
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
            {/* Header Title: Centered, Bold, Asterisks */}
            <div className="text-center mb-3">
              <h1 className="text-2xl font-bold tracking-wider text-black font-serif">INVOICE</h1>
              <p className="text-xs font-bold text-black tracking-widest mt-0.5">***************</p>
            </div>

            {/* Top Section: EXACT 2 Columns Side-by-Side (50% / 50% Full-Width Alignment matching authentic Word template) */}
            <div className="grid grid-cols-2 gap-4 text-xs items-stretch w-full">
              {/* Left Column: Outer Bordered Party Box */}
              <div className="border border-black p-2.5 flex flex-col justify-between text-[10.5px] leading-tight w-full min-h-[195px]">
                <div>
                  <p className="font-bold text-[11px]">FROM: {invoiceData.exporter.name}</p>
                  <p className="text-[10px] mt-0.5 leading-snug">
                    {invoiceData.exporter.tlNo ? `T.L NO: ${invoiceData.exporter.tlNo} ` : ""}
                    {invoiceData.exporter.address ? `ADD: ${invoiceData.exporter.address}` : ""}
                  </p>
                  {(invoiceData.exporter.phone || invoiceData.exporter.email) && (
                    <p className="text-[10px] mt-0.5">
                      {invoiceData.exporter.phone && `TEL: ${invoiceData.exporter.phone} `}
                      {invoiceData.exporter.email && (
                        <>
                          EMAIL:{" "}
                          <span className="text-blue-700 underline">{invoiceData.exporter.email}</span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="my-1.5 border-b border-dashed border-black w-full" />

                <div className="space-y-1">
                  <div>
                    <p className="font-bold text-[11px]">TO: {invoiceData.consignee.name}</p>
                    <p className="text-[10px] mt-0.5 whitespace-pre-line leading-snug">{invoiceData.consignee.address}</p>
                  </div>

                  {invoiceData.notifyParty && (
                    <div className="pt-0.5 leading-tight">
                      <p className="font-bold text-[10.5px]">NOTIFY PARTY:</p>
                      <p className="font-bold text-[10px]">{invoiceData.notifyParty.name}</p>
                      <p className="text-[9.5px] leading-snug">
                        {invoiceData.notifyParty.address}
                        {invoiceData.notifyParty.trn && ` TRN NO: ${invoiceData.notifyParty.trn}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: No/Date at Top, Transit Table Full-Width Below */}
              <div className="flex flex-col justify-between w-full">
                <div className="mb-1 text-xs font-serif leading-tight">
                  <p className="font-bold text-[11px]">No: {invoiceData.invoiceNumber}</p>
                  <p className="font-bold text-[11px] mt-0.5">Date: {invoiceData.invoiceDate}</p>
                </div>

                {/* Afghan Transit Form Way Bill Table (Single horizontal cells matching authentic image) */}
                <div className="border border-black text-[10.5px] w-full">
                  {/* Row 1: Afghan Transit Form Way Bill */}
                  <div className="border-b border-black py-1 px-2.5 font-bold text-xs tracking-wide">
                    {invoiceData.transit.docTitle.includes("Way Bill") ? (
                      <>
                        Afghan Transit Form <span className="underline">Way Bill</span>
                      </>
                    ) : (
                      invoiceData.transit.docTitle
                    )}
                  </div>

                  {/* Row 2: No & Date (NO vertical divider, matching reference image) */}
                  <div className="border-b border-black py-1 px-2.5 flex justify-between items-center text-[10px]">
                    <span className="font-bold">No: {invoiceData.transit.bolNumber || ""}</span>
                    <span className="font-bold pr-6">Date: {invoiceData.transit.bolDate || ""}</span>
                  </div>

                  {/* Row 3: Terms of Payment & 100% Advance Payment (Centered) */}
                  <div className="border-b border-black py-1 px-2 text-center leading-tight">
                    <div className="font-bold text-[10.5px]">Terms of Payment</div>
                    <div className="text-[10px] font-normal mt-0.5">
                      {invoiceData.transit.termsOfPayment || "100% Advance Payment"}
                    </div>
                  </div>

                  {/* Row 4: Letter of Credit & Collection Basis (NO vertical divider, matching reference image) */}
                  <div className="border-b border-black py-1 px-2.5 text-[9.5px] leading-tight">
                    <div className="flex justify-between items-center">
                      <span>Letter Of Credit</span>
                      <span className="pr-6">Collection Basis</span>
                    </div>
                    <div className="mt-0.5">No:</div>
                  </div>

                  {/* Row 5: Through & Via */}
                  <div className="py-1 px-2.5 text-[9.5px] leading-tight">
                    <div className="font-bold">Through:</div>
                    <div className="mt-0.5 font-bold">
                      Via:{invoiceData.transit.via}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Goods Table (Authentic White Header, Double Bottom Line, Double NO Divider) */}
            <div className="border border-black mt-4 w-full flex-1 flex flex-col">
              {/* Header Row: Pure white bg, NO, Quantity, Description, Unit Price, Total Price */}
              <div
                className="grid grid-cols-[6%_16%_52%_12%_14%] bg-white font-bold text-center text-xs divide-x divide-black"
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
                <div className="py-1.5 flex flex-col items-center justify-center text-[10.5px] leading-tight">
                  <span>Unit price</span>
                  <span>USD</span>
                </div>
                <div className="py-1.5 flex flex-col items-center justify-center text-[10.5px] leading-tight">
                  <span>Total price</span>
                  <span>USD</span>
                </div>
              </div>

              {/* Body Columns (Continuous full-height down to A4 bottom border, min-height 550px) */}
              <div className="grid grid-cols-[6%_16%_52%_12%_14%] divide-x divide-black min-h-[550px] flex-1 text-xs">
                {/* Column 1: NO (Double right border) */}
                <div
                  className="p-2 text-center font-bold text-sm"
                  style={{ borderRight: "3px double black" }}
                >
                  {invoiceData.items.map((item) => (
                    <div key={item.no} className="mb-3">{item.no}</div>
                  ))}
                </div>

                {/* Column 2: Quantity */}
                <div className="p-2.5 font-bold text-left leading-normal">
                  {invoiceData.items.map((item, idx) => (
                    <div key={idx} className="mb-3 space-y-0.5">
                      <div className="text-sm uppercase">{item.packagesCount} {item.packageType}</div>
                      <div className="text-xs">{item.netWeight} KGS</div>
                    </div>
                  ))}
                </div>

                {/* Column 3: Description of Goods (Commodity at Top, Total Say in Center, Chamber Block at Bottom) */}
                <div className="p-3 flex flex-col justify-between text-left min-h-full">
                  {/* Top: Commodity items description */}
                  <div className="space-y-2">
                    {invoiceData.items.map((item, idx) => (
                      <p key={idx} className="font-bold text-sm tracking-wide uppercase font-serif">
                        {item.description}
                      </p>
                    ))}
                  </div>

                  {/* Center: Total Amount Say, Words, and Country of Origin (Moved Up in Center, Improved Typography) */}
                  <div className="my-auto py-8 text-center flex flex-col items-center justify-center">
                    <div className="max-w-[460px] mx-auto text-center space-y-1.5">
                      <p className="text-[12.5px] font-bold uppercase tracking-wider text-black font-serif">
                        Total Amount Say: USD:
                      </p>
                      <p className="font-bold text-[13.5px] uppercase tracking-wide leading-relaxed text-black font-serif px-2">
                        {invoiceData.amountInWords}
                      </p>
                      <p className="font-bold text-[14px] tracking-wide text-black pt-1 font-serif">
                        {invoiceData.originCountry}
                      </p>
                    </div>
                  </div>

                  {/* Center Chamber Fee Block with Outer Border Box matching authentic downside image */}
                  <div className="my-auto py-4 w-full flex justify-center">
                    <div className="border border-black p-2.5 w-[245px] mx-auto flex flex-col gap-[3px] text-[10px] leading-snug font-serif text-black">
                      <div className="flex items-baseline w-full whitespace-nowrap">
                        <span className="shrink-0 text-blue-700 underline font-serif">Reg No :</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter ml-0.5 select-none" aria-hidden="true">{"-".repeat(120)}</span>
                        <span className="shrink-0 font-serif text-[10px] px-1">{(invoiceData.acciChamber.regNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"}</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter select-none" aria-hidden="true">{"-".repeat(120)}</span>
                      </div>
                      <div className="flex items-baseline w-full whitespace-nowrap">
                        <span className="shrink-0 text-blue-700 underline font-serif">Fee No :</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter ml-0.5 select-none" aria-hidden="true">{"-".repeat(120)}</span>
                        <span className="shrink-0 font-serif text-[10px] px-1">{(invoiceData.acciChamber.feeNo || "0000").replace(/^-+|-+$/g, "").trim() || "0000"}</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter select-none" aria-hidden="true">{"-".repeat(120)}</span>
                      </div>
                      <div className="flex items-baseline w-full whitespace-nowrap">
                        <span className="shrink-0 font-bold text-black font-serif">Received the sum of------</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter select-none" aria-hidden="true">{"-".repeat(120)}</span>
                        <span className="shrink-0 font-bold text-black font-serif pl-1">{invoiceData.acciChamber.receivedSum || "2,330"}</span>
                      </div>
                      <div className="flex items-baseline w-full whitespace-nowrap">
                        <span className="shrink-0 text-blue-700 underline font-serif">Date :</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter ml-0.5 select-none" aria-hidden="true">{"-".repeat(120)}</span>
                        <span className="shrink-0 font-serif text-[10px] px-1">{(invoiceData.acciChamber.shamsiDate || "28/07/1405").replace(/^-+|-+$/g, "").trim() || "28/07/1405"}</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter select-none" aria-hidden="true">{"-".repeat(120)}</span>
                      </div>
                      <div className="flex items-baseline w-full whitespace-nowrap pt-2">
                        <span className="shrink-0 text-blue-700 underline font-serif">Signature :</span>
                        <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-[9.5px] tracking-tighter ml-1 select-none" aria-hidden="true">{"-".repeat(120)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 4: Unit price USD (Rate at Top, Edge-to-Edge TOTAL C&F aligned with Col 5 at Bottom) */}
                <div className="py-2 flex flex-col justify-between text-center font-bold">
                  <div className="px-2 pt-1 text-sm">
                    {invoiceData.items.map((item, idx) => (
                      <div key={idx} className="mb-3">{item.unitPrice.toFixed(2)}</div>
                    ))}
                  </div>
                  <div className="mt-auto mb-3 w-full text-center">
                    <div
                      className="border-y border-black w-full h-[36px] flex flex-col items-center justify-center font-bold text-xs leading-tight text-center"
                      title="TOTAL C&F"
                    >
                      <div>TOTAL</div>
                      <div>C&amp;F</div>
                    </div>
                    {/* Visual spacer matching signature block height in Col 5 */}
                    <div className="h-[46px] mt-3" aria-hidden="true" />
                  </div>
                </div>

                {/* Column 5: Total price USD (Item Total at Top, Edge-to-Edge Final Total & Stamp at Bottom) */}
                <div className="py-2 flex flex-col justify-between text-right font-bold">
                  <div className="px-2 pt-1 text-sm pr-2.5">
                    {invoiceData.items.map((item, idx) => (
                      <div key={idx} className="mb-3">
                        {item.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto mb-3 w-full text-center">
                    {/* Final Total Amount with continuous edge-to-edge top/bottom borders aligned with TOTAL C&F */}
                    <div className="border-y border-black w-full h-[36px] px-2.5 font-black text-xs text-right whitespace-nowrap flex items-center justify-end">
                      {invoiceData.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>

                    {/* Stamp / Signature Text */}
                    <div className="h-[46px] mt-3 px-1.5 text-center flex flex-col items-center justify-start">
                      <p className="text-[14px] font-bold uppercase tracking-wider leading-snug whitespace-nowrap">
                        SKY<br />ARIANA LTD
                      </p>
                      <div className="text-black font-mono text-[10px] tracking-tighter select-none whitespace-nowrap mt-1">
                        ------------------------
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
