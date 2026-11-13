"use client"

import React, { memo } from "react"
import {
  FileText,
  Eye,
  FileDown,
  Pencil,
  FolderArchive,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { extractBolRoute } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export const SavedBolGalleryView = memo(function SavedBolGalleryView({
  documents,
  visibleCount,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1680px]:grid-cols-5 gap-5">
      {visibleDocs.map((doc, idx) => {
        const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
        const invoiceNo = extractInvoiceNumber(doc)
        const routeInfo = extractBolRoute(doc)
        const hasPdf = Boolean(doc.pdf_url)
        const isArchived = doc.isArchived || doc.status === "archived"

        return (
          <div
            key={`gallery-${doc.id || doc.bol_number || idx}`}
            className="group relative rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            {/* Mini A4 Sheet Look */}
            <div className="p-4 sm:p-5 space-y-3.5 bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-800/40 dark:to-slate-900">
              {/* Document Header with Logo & BOL # */}
              <div className="border-b-2 border-blue-900/80 dark:border-blue-500/80 pb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 dark:text-blue-300">
                      Sky Ariana
                    </span>
                  </div>
                  <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                    BILL OF LADING • بارنامه
                  </h4>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-xs sm:text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                    {bolNo}
                  </div>
                  {invoiceNo && (
                    <span className="text-[9.5px] font-mono font-bold text-emerald-700 dark:text-emerald-400 block mt-0.5">
                      INV: {invoiceNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Trading Parties Mini-Form */}
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Shipper / فرستنده</span>
                  <p className="font-black text-slate-900 dark:text-slate-100 truncate">
                    {doc.shipper_name || "Missing Shipper"}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Consignee / گیرنده</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {doc.consignee_name || "Missing Consignee"}
                  </p>
                </div>
              </div>

              {/* Route & Cargo Details */}
              <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 space-y-1 text-[11px]">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Packages:</span>
                  <span className="font-mono">{doc.number_of_packages || "—"}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Weight:</span>
                  <span className="font-mono">{doc.net_weight || doc.gross_weight || "—"}</span>
                </div>
                {routeInfo.display !== "—" && (
                  <div className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 truncate pt-1 border-t border-slate-100 dark:border-slate-800">
                    📍 {routeInfo.borderCrossing || routeInfo.shortDisplay || routeInfo.display}
                  </div>
                )}
              </div>

              {/* Bottom Official Certificate Footer: Stamp & QR */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <QrCode className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                  <span className="font-mono">VERIFIED</span>
                </div>

                {hasPdf ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> PDF Attached
                  </span>
                ) : (
                  <span className="text-slate-400">Draft Document</span>
                )}
              </div>
            </div>

            {/* Quick Action Bottom Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-1">
              <Button
                type="button"
                size="sm"
                onClick={() => onPreview(doc)}
                className="h-8 flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> A4 Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onEdit(doc)}
                className="h-8 w-8 p-0 rounded-xl cursor-pointer"
                title="Edit BOL"
              >
                <Pencil className="h-3.5 w-3.5 text-blue-600" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onDownload(doc)}
                className="h-8 w-8 p-0 rounded-xl border-amber-300 text-amber-700 cursor-pointer"
                title="Download PDF"
              >
                <FileDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onFiles(doc)}
                className="h-8 w-8 p-0 rounded-xl border-cyan-300 text-cyan-700 cursor-pointer"
                title="Shipment Files"
              >
                <FolderArchive className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
})
