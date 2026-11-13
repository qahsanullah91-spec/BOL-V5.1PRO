"use client"

import React, { memo } from "react"
import {
  FileText,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  Archive,
  RotateCcw,
  Trash2,
  Copy,
  Compass,
  Banknote,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { extractBolRoute, parsePackages, parseWeight } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export const SavedBolCompactView = memo(function SavedBolCompactView({
  documents,
  visibleCount,
  sortBy,
  selectedDocIds = [],
  onToggleSelect,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onArchive,
  onRestore,
  onHardDelete,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  const copyToClipboard = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}: ${text}`)
  }

  // Summary statistics for footer
  const totalPkgs = visibleDocs.reduce((acc, d) => acc + parsePackages(d.number_of_packages), 0)
  const totalWeight = visibleDocs.reduce((acc, d) => acc + parseWeight(d.net_weight || d.gross_weight), 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 select-none sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[130px]">BOL Number</th>
              <th className="py-2.5 px-3 min-w-[95px]">Invoice #</th>
              <th className="py-2.5 px-3 min-w-[95px]">Date</th>
              <th className="py-2.5 px-3 min-w-[220px]">Shipper ➔ Consignee</th>
              <th className="py-2.5 px-3 min-w-[140px]">Border / Route</th>
              <th className="py-2.5 px-3 min-w-[90px] text-right">Packages</th>
              <th className="py-2.5 px-3 min-w-[100px] text-right">Net Weight</th>
              <th className="py-2.5 px-3 min-w-[110px] text-right">Driver Rent</th>
              <th className="py-2.5 px-3 min-w-[120px]">Truck / Driver</th>
              <th className="py-2.5 px-3 min-w-[70px] text-center">PDF</th>
              <th className="py-2.5 px-3 min-w-[140px] text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {visibleDocs.map((doc, idx) => {
              const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
              const invoiceNo = extractInvoiceNumber(doc)
              const routeInfo = extractBolRoute(doc)
              const hasPdf = Boolean(doc.pdf_url)
              const isArchived = doc.isArchived || doc.status === "archived"
              const isSelected = selectedDocIds.includes(doc.id || doc.bol_number)
              const rent = doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent
              const hasRent = rent && String(rent).trim() !== "" && String(rent).trim() !== "0"

              return (
                <tr
                  key={`compact-${doc.id || doc.bol_number || idx}`}
                  className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors group ${
                    isArchived
                      ? "opacity-65 bg-slate-50/40 dark:bg-slate-900/40"
                      : isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/40"
                      : idx % 2 === 1
                      ? "bg-slate-50/30 dark:bg-slate-800/20"
                      : "bg-white dark:bg-slate-900"
                  }`}
                >
                  {/* Row index / checkbox */}
                  <td className="py-2 px-3 text-center text-[10.5px] font-mono text-slate-400">
                    {onToggleSelect ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(doc.id || doc.bol_number)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                      />
                    ) : (
                      idx + 1
                    )}
                  </td>

                  {/* BOL Number with copy button */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5 font-black text-blue-950 dark:text-blue-300 font-mono text-xs">
                      <span className="truncate max-w-[110px]" title={bolNo}>
                        {bolNo}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(bolNo, "BOL Number", e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-blue-600 cursor-pointer transition-opacity"
                        title="Copy BOL #"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      {isArchived && (
                        <span className="px-1 py-0.2 rounded bg-slate-800 text-amber-300 text-[8.5px] font-black uppercase">
                          ARC
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Invoice # */}
                  <td className="py-2 px-3">
                    {invoiceNo ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                        {invoiceNo}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                    {doc.issue_date || doc.created_at ? (
                      new Date(doc.issue_date || doc.created_at).toLocaleDateString("en-GB")
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Shipper ➔ Consignee */}
                  <td className="py-2 px-3 max-w-[240px]">
                    <div className="truncate text-[11px]" title={`${doc.shipper_name || "N/A"} ➔ ${doc.consignee_name || "N/A"}`}>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {doc.shipper_name || "N/A"}
                      </span>
                      <span className="text-slate-400 mx-1">➔</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {doc.consignee_name || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* Border / Route */}
                  <td className="py-2 px-3 max-w-[160px]">
                    {routeInfo.display !== "—" ? (
                      <div className="flex items-center gap-1 truncate" title={routeInfo.display}>
                        <Compass className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span
                          className="text-[10.5px] font-semibold text-indigo-950 dark:text-indigo-200 truncate"
                          dir={routeInfo.isPersian ? "rtl" : "ltr"}
                        >
                          {routeInfo.borderCrossing
                            ? routeInfo.borderCrossing.split(" ")[0]
                            : routeInfo.shortDisplay || routeInfo.display}
                        </span>
                        {routeInfo.isFullReefer && (
                          <span className="text-[8px] font-black text-cyan-700 bg-cyan-100 rounded px-1">❄️</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Packages */}
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {doc.number_of_packages ? (
                      <span className="font-bold">{doc.number_of_packages}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Weight */}
                  <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {doc.net_weight || doc.gross_weight ? (
                      <span>{doc.net_weight || doc.gross_weight}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Driver Rent */}
                  <td className="py-2 px-3 text-right font-mono text-[11px]">
                    {hasRent ? (
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        {String(rent)}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* Truck / Driver */}
                  <td className="py-2 px-3 max-w-[130px]">
                    <div className="truncate text-[10.5px]" dir="auto" title={doc.truck_number || doc.driver_name || "N/A"}>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {doc.truck_number || doc.driver_name || "—"}
                      </span>
                    </div>
                  </td>

                  {/* PDF Status */}
                  <td className="py-2 px-3 text-center">
                    {hasPdf ? (
                      <button
                        type="button"
                        onClick={() => onOpenPdf(doc)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer hover:scale-110 transition-transform"
                        title="Open Uploaded PDF"
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </button>
                    ) : (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"
                        title="No PDF uploaded"
                      />
                    )}
                  </td>

                  {/* Quick Actions */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(doc)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer"
                        title="Edit BOL"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onPreview(doc)}
                        className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="A4 Preview"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownload(doc)}
                        className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg cursor-pointer"
                        title="Download PDF"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onFiles(doc)}
                        className="h-7 w-7 p-0 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 rounded-lg cursor-pointer"
                        title="Shipment Folder & Attachments"
                      >
                        <FolderArchive className="h-3.5 w-3.5" />
                      </Button>

                      {isArchived ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => onRestore(doc)}
                          className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Restore to Active"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => onArchive(doc, e)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg cursor-pointer"
                          title="Archive BOL"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-black text-[11px] text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
            <tr>
              <td colSpan={6} className="py-2 px-3">
                Total Shown: {visibleDocs.length} Bills of Lading
              </td>
              <td className="py-2 px-3 text-right font-mono">
                {totalPkgs > 0 ? `${totalPkgs.toLocaleString()} CTNS` : "—"}
              </td>
              <td className="py-2 px-3 text-right font-mono">
                {totalWeight > 0 ? `${Math.round(totalWeight).toLocaleString()} KG` : "—"}
              </td>
              <td colSpan={4} className="py-2 px-3 text-right text-slate-500 font-medium">
                High-Density Space-Optimized Mode
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
})
