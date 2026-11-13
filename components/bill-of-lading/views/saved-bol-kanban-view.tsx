"use client"

import React, { memo, useMemo } from "react"
import {
  FileText,
  Truck,
  Building2,
  FileCheck,
  Archive,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  Compass,
  Copy,
  Receipt,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { extractBolRoute } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

interface KanbanColumn {
  id: string
  title: string
  titleFa: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor: string
  headerBg: string
  borderColor: string
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "draft",
    title: "Drafts & New",
    titleFa: "اسناد جدید و پیش‌نویس",
    icon: FileText,
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    headerBg: "bg-blue-50/70 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    id: "transit",
    title: "In Transit",
    titleFa: "در حال ترانزیت جاده‌ای",
    icon: Truck,
    badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    headerBg: "bg-indigo-50/70 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "border",
    title: "Border Stations",
    titleFa: "گمرکات و مرزهای ورودی",
    icon: Building2,
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    headerBg: "bg-amber-50/70 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  {
    id: "documented",
    title: "Documented & Invoiced",
    titleFa: "دارای فاکتور و اسناد PDF",
    icon: FileCheck,
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    headerBg: "bg-emerald-50/70 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "archived",
    title: "Delivered & Archived",
    titleFa: "تکمیل شده و بایگانی",
    icon: Archive,
    badgeColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    headerBg: "bg-slate-100/70 dark:bg-slate-900/40",
    borderColor: "border-slate-300 dark:border-slate-700",
  },
]

export const SavedBolKanbanView = memo(function SavedBolKanbanView({
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

  // Group documents into the 5 Kanban stages
  const columnsData = useMemo(() => {
    const buckets: Record<string, any[]> = {
      draft: [],
      transit: [],
      border: [],
      documented: [],
      archived: [],
    }

    visibleDocs.forEach((doc) => {
      const isArchived = doc.isArchived || doc.status === "archived"
      const hasPdf = Boolean(doc.pdf_url)
      const invoiceNo = extractInvoiceNumber(doc)
      const routeInfo = extractBolRoute(doc)
      const hasBorder = Boolean(routeInfo.borderCrossing || doc.borderCrossing)
      const hasTruck = Boolean(doc.truck_number || doc.driver_name)

      if (isArchived) {
        buckets.archived.push(doc)
      } else if (hasPdf && invoiceNo) {
        buckets.documented.push(doc)
      } else if (hasBorder) {
        buckets.border.push(doc)
      } else if (hasTruck) {
        buckets.transit.push(doc)
      } else {
        buckets.draft.push(doc)
      }
    })

    return buckets
  }, [visibleDocs])

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <div className="overflow-x-auto pb-4 pt-1">
      <div className="flex items-start gap-4 min-w-[1250px]">
        {KANBAN_COLUMNS.map((col) => {
          const Icon = col.icon
          const colDocs = columnsData[col.id] || []

          return (
            <div
              key={col.id}
              className={`flex-1 min-w-[270px] max-w-[340px] rounded-3xl border ${col.borderColor} bg-slate-50/50 dark:bg-slate-900/50 shadow-xs flex flex-col max-h-[820px]`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 rounded-t-3xl border-b ${col.borderColor} ${col.headerBg} flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                    <Icon className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                      {col.title}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400" dir="rtl">
                      {col.titleFa}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono ${col.badgeColor}`}>
                  {colDocs.length}
                </span>
              </div>

              {/* Column Card Body */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
                {colDocs.length === 0 ? (
                  <div className="p-6 text-center text-xs font-medium text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    No shipments in this stage
                  </div>
                ) : (
                  colDocs.map((doc) => {
                    const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
                    const invoiceNo = extractInvoiceNumber(doc)
                    const routeInfo = extractBolRoute(doc)
                    const isArchived = doc.isArchived || doc.status === "archived"

                    return (
                      <div
                        key={`kanban-${doc.id || doc.bol_number}`}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-2 group"
                      >
                        {/* Header: BOL & Invoice */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 font-mono font-black text-xs text-blue-950 dark:text-blue-300">
                            <span className="truncate">{bolNo}</span>
                            <button
                              type="button"
                              onClick={(e) => copyToClipboard(bolNo, e)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-opacity"
                              title="Copy BOL #"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {invoiceNo && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9.5px] font-mono font-bold">
                              {invoiceNo}
                            </span>
                          )}
                        </div>

                        {/* Parties: Shipper ➔ Consignee */}
                        <div className="text-[11px] leading-tight space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate" title={doc.shipper_name || "N/A"}>
                            {doc.shipper_name || "N/A"}
                          </p>
                          <div className="flex items-center gap-1 text-slate-400">
                            <span>↓</span>
                            <p className="font-medium text-slate-700 dark:text-slate-300 truncate" title={doc.consignee_name || "N/A"}>
                              {doc.consignee_name || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Route / Border tag */}
                        {routeInfo.display !== "—" && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[10.5px]">
                            <Compass className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span className="truncate font-semibold text-slate-800 dark:text-slate-200" dir={routeInfo.isPersian ? "rtl" : "ltr"}>
                              {routeInfo.borderCrossing ? routeInfo.borderCrossing.split(" ")[0] : routeInfo.shortDisplay || routeInfo.display}
                            </span>
                            {routeInfo.isFullReefer && (
                              <span className="text-[8px] font-black text-cyan-700 bg-cyan-100 rounded px-1">❄️ Reefer</span>
                            )}
                          </div>
                        )}

                        {/* Specs: Packages & Truck */}
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                          <span>📦 {doc.number_of_packages || "—"}</span>
                          <span className="truncate max-w-[120px]" dir="auto">
                            🚚 <bdi>{doc.truck_number || doc.driver_name || "—"}</bdi>
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onEdit(doc)}
                              className="h-7 px-2 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer"
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onPreview(doc)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                              title="A4 Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onFiles(doc)}
                              className="h-7 w-7 p-0 text-cyan-600 hover:text-cyan-700 rounded-lg cursor-pointer"
                              title="Shipment Files"
                            >
                              <FolderArchive className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onDownload(doc)}
                              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 rounded-lg cursor-pointer"
                              title="Download PDF"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
