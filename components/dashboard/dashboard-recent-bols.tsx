"use client"

import React, { memo } from "react"
import {
  Zap,
  ArrowRight,
  Plus,
  FileText,
  Boxes,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecentBolCard, type SavedDocumentData } from "@/components/bill-of-lading/recent-bol-card"

interface DashboardRecentBolsProps {
  bols: SavedDocumentData[]
  onEdit: (doc: SavedDocumentData) => void
  onPreview: (doc: SavedDocumentData) => void
  onFiles: (doc: SavedDocumentData) => void
  onPdf: (doc: SavedDocumentData) => void
  onViewAll: () => void
  onNewBol: () => void
  downloadingPdfId?: string | null
}

export const DashboardRecentBols = memo(function DashboardRecentBols({
  bols,
  onEdit,
  onPreview,
  onFiles,
  onPdf,
  onViewAll,
  onNewBol,
  downloadingPdfId,
}: DashboardRecentBolsProps) {
  if (bols.length === 0) return null

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-amber-400 before:via-amber-500 before:to-yellow-400">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
              <span>Latest BOL Creations</span>
              <span className="text-[10px] font-bold text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                آخرین بارنامه‌های ثبت شده
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200/80">
                {bols.length} Recent
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live transit documents with quick edit, preview, digital attachments, and PDF downloads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onNewBol}
            className="h-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New BOL</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onViewAll}
            className="h-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <span>All BOLs Archive</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Responsive Card Grid: 1 col (mobile), 2 cols (tablet), 3 cols (laptop), 4 cols (desktop — 8 cards in 2 clean rows) */}
      <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10 items-stretch">
        {bols.slice(0, 8).map((doc) => (
          <RecentBolCard
            key={`dash-recent-${doc.id || doc.bol_number}`}
            doc={doc}
            onEdit={() => onEdit(doc)}
            onPreview={() => onPreview(doc)}
            onFiles={() => onFiles(doc)}
            onPdf={() => onPdf(doc)}
            onCardClick={() => onPreview(doc)}
            isDownloadingPdf={downloadingPdfId === doc.id}
          />
        ))}
      </div>
    </div>
  )
})
