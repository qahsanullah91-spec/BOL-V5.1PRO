"use client"

import { useState, useMemo } from "react"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import {
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { generateQrMatrix } from "@/lib/utils/qr-code"
import { buildWhatsAppBOLMessage, buildWhatsAppShipmentUpdate } from "@/lib/utils/bol-whatsapp-formatter"

export interface DocumentQRCodeProps {
  value: string
  formData?: BillOfLadingFormData | any
  textMessage?: string
  messageType?: "update" | "full" | "auto"
  size?: number | string
  pdfMode?: boolean
  className?: string
  unstyled?: boolean
  showQuietZone?: boolean
}

export function DocumentQRCode({
  value,
  formData,
  textMessage,
  messageType = "update",
  size = 50,
  pdfMode = false,
  className = "",
  unstyled = false,
  showQuietZone = true,
}: DocumentQRCodeProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedMode, setSelectedMode] = useState<"update" | "full">(
    messageType === "full" ? "full" : "update"
  )

  const effectiveFormData: BillOfLadingFormData = useMemo(() => {
    if (formData && typeof formData === "object") {
      return {
        ...formData,
        bol_number: formData.bol_number || value || "SKY-BOL",
      }
    }
    return {
      bol_number: value || "SKY-BOL",
    } as BillOfLadingFormData
  }, [formData, value])

  const shipmentUpdateMsg = useMemo(() => {
    try {
      const msg = buildWhatsAppShipmentUpdate(effectiveFormData)
      return msg && msg.trim() ? msg.trim() : ""
    } catch {
      return ""
    }
  }, [effectiveFormData])

  const fullBolMsg = useMemo(() => {
    try {
      const msg = buildWhatsAppBOLMessage(effectiveFormData)
      return msg && msg.trim() ? msg.trim() : ""
    } catch {
      return ""
    }
  }, [effectiveFormData])

  const resolvedPayload = useMemo(() => {
    if (textMessage && textMessage.trim()) {
      return textMessage.trim()
    }
    if (selectedMode === "update") {
      if (shipmentUpdateMsg) return shipmentUpdateMsg
      if (fullBolMsg) return fullBolMsg
    } else {
      if (fullBolMsg) return fullBolMsg
      if (shipmentUpdateMsg) return shipmentUpdateMsg
    }
    return value || "SKY-BOL"
  }, [textMessage, selectedMode, shipmentUpdateMsg, fullBolMsg, value])

  const isFormattedMessage = Boolean(
    (textMessage && textMessage.trim()) || shipmentUpdateMsg || fullBolMsg
  )

  const qrData = useMemo(() => {
    return generateQrMatrix(resolvedPayload, {
      errorCorrectionLevel: isFormattedMessage ? "L" : "M",
      margin: showQuietZone ? 2 : 0,
      rawTextMode: isFormattedMessage,
    })
  }, [resolvedPayload, showQuietZone, isFormattedMessage])

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(resolvedPayload)
        setCopied(true)
        toast.success(
          selectedMode === "update"
            ? "Shipment update WhatsApp text copied to clipboard"
            : "Full BOL WhatsApp text copied to clipboard"
        )
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      toast.error("Failed to copy WhatsApp message")
    }
  }

  const handleDownloadSvg = () => {
    try {
      const blob = new Blob([qrData.svgString], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${value || "BOL"}-QR.svg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("QR Code SVG downloaded")
    } catch {
      toast.error("Failed to download SVG")
    }
  }

  const handleDownloadPng = () => {
    try {
      const canvas = document.createElement("canvas")
      const scale = 16 // 16x density for razor-sharp logistics print
      const totalSize = qrData.size * scale
      canvas.width = totalSize
      canvas.height = totalSize
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, totalSize, totalSize)

      ctx.fillStyle = "#0f172a"
      for (let r = 0; r < qrData.moduleCount; r++) {
        for (let c = 0; c < qrData.moduleCount; c++) {
          if (qrData.modules[r]?.[c]) {
            ctx.fillRect(
              (c + qrData.margin) * scale,
              (r + qrData.margin) * scale,
              scale,
              scale
            )
          }
        }
      }

      const pngUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = pngUrl
      a.download = `${value || "BOL"}-QR.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success("High-resolution QR code PNG downloaded")
    } catch {
      toast.error("Failed to download PNG")
    }
  }

  const qrSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${qrData.size} ${qrData.size}`}
      className="w-full h-full object-contain shrink-0 block"
      style={{
        shapeRendering: "crispEdges",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        backgroundColor: "#ffffff",
      }}
    >
      <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
      <path d={qrData.path} fill="#0f172a" />
    </svg>
  )

  // In PDF export mode or print, render strictly static vector SVG without interactive handlers
  if (pdfMode) {
    if (unstyled) {
      return (
        <div
          className={`w-full h-full flex items-center justify-center p-0 m-0 ${className}`}
          data-qr-code="true"
        >
          {qrSvg}
        </div>
      )
    }

    return (
      <div
        className={`shrink-0 flex items-center justify-center bg-white rounded-md border border-blue-200/90 shadow-2xs ${className}`}
        style={{ padding: "2px" }}
        data-qr-code="true"
      >
        {qrSvg}
      </div>
    )
  }

  const modalContent = (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader className="bg-gradient-to-r from-emerald-900 via-blue-900 to-indigo-950 text-white p-4.5 shrink-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl backdrop-blur-xs border border-emerald-400/30 text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <DialogTitle className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>BOL QR Code & WhatsApp Shipment Update</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Live Scannable
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-blue-200 font-medium mt-0.5">
                Scanning this QR code with any mobile camera or barcode scanner outputs the complete WhatsApp shipment update message
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center gap-3.5">
          {/* Quick Mode Toggle: Shipment Update vs Full BOL */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full">
            <button
              type="button"
              onClick={() => setSelectedMode("update")}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedMode === "update"
                  ? "bg-white text-emerald-900 shadow-xs border border-emerald-300/80 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span className="text-emerald-600">📋</span>
              <span>Shipment Update (اطلاعیه حمل بار)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("full")}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedMode === "full"
                  ? "bg-white text-emerald-900 shadow-xs border border-emerald-300/80 font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span className="text-blue-600">📄</span>
              <span>Full BOL Message (متن کامل بارنامه)</span>
            </button>
          </div>

          {/* Scannable High-Res QR Code Card */}
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-emerald-100 shadow-md flex flex-col items-center group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={220}
              height={220}
              viewBox={`0 0 ${qrData.size} ${qrData.size}`}
              className="shrink-0 block"
              style={{ shapeRendering: "crispEdges" }}
            >
              <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
              <path d={qrData.path} fill="#0f172a" />
            </svg>
            <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>ISO/IEC 18004 Standard • Formatted WhatsApp Text</span>
            </div>
          </div>

          {/* WhatsApp Text Message Preview Bubble */}
          <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 text-left flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  {selectedMode === "update"
                    ? "Shipment Update Message (پیام به‌روزرسانی بارنامه برای واتساپ)"
                    : "Full BOL Message (متن کامل بارنامه برای واتساپ)"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-xs font-bold bg-white text-emerald-900 rounded-md border border-emerald-300 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {/* Message Content Container */}
            <pre
              className="text-xs font-mono text-slate-800 bg-white/90 p-3 rounded-lg border border-emerald-100 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all"
              dir="auto"
            >
              {resolvedPayload}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Download Vector SVG"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>SVG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Download High-Res PNG"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>PNG (HD)</span>
            </button>
            <a
              href={qrData.whatsappUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(resolvedPayload)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Open WhatsApp with Message"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white" />
              <span>Open WhatsApp</span>
            </a>
          </div>

          <p className="text-[10px] text-slate-400 text-center leading-normal">
            Scan with any smartphone camera (iPhone / Android) or barcode scanner to instantly read the entire Bill of Lading shipment update.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (unstyled) {
    return (
      <>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowModal(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setShowModal(true)
            }
          }}
          title="Official Verification QR Code - Click to view WhatsApp BOL message"
          className={`w-full h-full flex items-center justify-center p-0 m-0 bg-transparent border-0 shadow-none cursor-pointer focus:outline-hidden group relative select-none ${className}`}
          data-qr-code="true"
          aria-label="Enlarge QR Code and View WhatsApp Message"
        >
          {qrSvg}
          <span className="sr-only">Verify BOL QR Code</span>
        </div>
        {modalContent}
      </>
    )
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setShowModal(true)
          }
        }}
        title="Official Verification QR Code - Click to view WhatsApp BOL message"
        className={`shrink-0 flex items-center justify-center bg-white rounded-md border border-blue-200/90 p-[2px] shadow-2xs hover:border-blue-500 hover:shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer group relative select-none ${className}`}
        data-qr-code="true"
        aria-label="Enlarge QR Code and View WhatsApp Message"
      >
        {qrSvg}
        <span className="sr-only">Verify BOL QR Code</span>
      </div>
      {modalContent}
    </>
  )
}

export default DocumentQRCode
