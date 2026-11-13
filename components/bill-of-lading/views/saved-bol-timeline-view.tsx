"use client"

import React, { memo, useMemo } from "react"
import {
  Calendar,
  Clock,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  Compass,
  Copy,
  Receipt,
  Truck,
  RotateCcw,
  Archive,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { extractBolRoute } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export const SavedBolTimelineView = memo(function SavedBolTimelineView({
  documents,
  visibleCount,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onArchive,
  onRestore,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  // Group documents by relative date buckets
  const timeBuckets = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const oneDay = 24 * 60 * 60 * 1000
    const sevenDays = 7 * oneDay
    const thirtyDays = 30 * oneDay

    const groups: {
      id: string
      title: string
      titleFa: string
      badge: string
      docs: any[]
    }[] = [
      { id: "today", title: "Recent & Today", titleFa: "امروز و ۲۴ ساعت اخیر", badge: "Live", docs: [] },
      { id: "week", title: "Past 7 Days", titleFa: "هفت روز اخیر", badge: "This Week", docs: [] },
      { id: "month", title: "This Month", titleFa: "سی روز اخیر", badge: "Monthly", docs: [] },
      { id: "earlier", title: "Earlier Archive", titleFa: "آرشیو ماه‌های گذشته", badge: "Historical", docs: [] },
    ]

    visibleDocs.forEach((doc) => {
      const rawDate = doc.issue_date || doc.created_at
      const time = rawDate ? new Date(rawDate).getTime() : 0
      const diff = today - time

      if (diff <= oneDay) {
        groups[0].docs.push(doc)
      } else if (diff <= sevenDays) {
        groups[1].docs.push(doc)
      } else if (diff <= thirtyDays) {
        groups[2].docs.push(doc)
      } else {
        groups[3].docs.push(doc)
      }
    })

    return groups.filter((g) => g.docs.length > 0)
  }, [visibleDocs])

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {timeBuckets.map((bucket) => (
        <div key={bucket.id} className="relative">
          {/* Section Milestone Header */}
          <div className="sticky top-2 z-20 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-2 px-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {bucket.title}
                </h3>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400" dir="rtl">
                  • {bucket.titleFa}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-black font-mono">
              {bucket.docs.length} BOLs
            </span>
          </div>

          {/* Timeline Rail & Events */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 dark:border-blue-900 ml-4 sm:ml-5 space-y-4">
            {bucket.docs.map((doc, idx) => {
              const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
              const invoiceNo = extractInvoiceNumber(doc)
              const routeInfo = extractBolRoute(doc)
              const hasPdf = Boolean(doc.pdf_url)
              const isArchived = doc.isArchived || doc.status === "archived"
              const rawDate = doc.issue_date || doc.created_at
              const dateStr = rawDate ? new Date(rawDate).toLocaleDateString("en-GB") : "No date"

              return (
                <div key={`timeline-${doc.id || doc.bol_number || idx}`} className="relative group">
                  {/* Timeline Node Marker */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-xs group-hover:scale-125 group-hover:bg-amber-500 transition-all" />

                  {/* Event Card */}
                  <div
                    className={`p-4 sm:p-5 rounded-3xl border bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all space-y-3 ${
                      isArchived
                        ? "border-slate-200 dark:border-slate-800 opacity-75"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
                    }`}
                  >
                    {/* Top Row: Date Badge, BOL #, Invoice, PDF Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-600" />
                          {dateStr}
                        </span>

                        <div className="flex items-center gap-1.5 font-mono font-black text-sm text-blue-950 dark:text-blue-300">
                          <span>{bolNo}</span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(bolNo, e)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer transition-colors"
                            title="Copy BOL #"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>

                        {invoiceNo && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold">
                            INV: {invoiceNo}
                          </span>
                        )}

                        {isArchived && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 text-[10px] font-black uppercase">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPdf && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            PDF Ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Parties & Transit Path */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Trading Parties</span>
                        <p className="font-black text-slate-900 dark:text-slate-100 truncate">
                          {doc.shipper_name || "Missing Shipper"}
                        </p>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                          ➔ {doc.consignee_name || "Missing Consignee"}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Logistics & Route</span>
                        {routeInfo.display !== "—" ? (
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Compass className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate" dir={routeInfo.isPersian ? "rtl" : "ltr"}>
                              {routeInfo.display}
                            </span>
                          </div>
                        ) : (
                          <p className="text-slate-400 font-medium">Standard direct routing</p>
                        )}
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]" dir="auto">
                          🚚 {doc.truck_number || doc.driver_name || "No truck assigned"}
                        </p>
                      </div>
                    </div>

                    {/* Cargo Specs & Driver Rent */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {doc.number_of_packages && <span>📦 <strong className="text-slate-900 dark:text-slate-100">{doc.number_of_packages}</strong></span>}
                        {(doc.net_weight || doc.gross_weight) && <span>⚖️ <strong className="text-slate-900 dark:text-slate-100">{doc.net_weight || doc.gross_weight}</strong></span>}
                        {doc.goods_value && <span>💰 <strong className="text-emerald-700 dark:text-emerald-400">{doc.goods_value}</strong></span>}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onEdit(doc)}
                          className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onPreview(doc)}
                          className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <Eye className="h-3 w-3 mr-1" /> Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onFiles(doc)}
                          className="h-8 px-3 rounded-xl border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs font-bold cursor-pointer"
                        >
                          <FolderArchive className="h-3 w-3 mr-1 text-cyan-600" /> Files
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDownload(doc)}
                          className="h-8 px-3 rounded-xl border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold cursor-pointer"
                        >
                          <FileDown className="h-3 w-3 mr-1 text-amber-600" /> PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})
