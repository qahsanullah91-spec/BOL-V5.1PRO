"use client"

import React, { memo, useMemo } from "react"
import {
  Route,
  Compass,
  MapPin,
  Truck,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  Copy,
  Receipt,
  Boxes,
  Scale,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { extractBolRoute, parseWeight, parsePackages } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

interface BorderGroup {
  id: string
  name: string
  nameFa: string
  corridor: string
  badgeColor: string
  docs: any[]
}

export const SavedBolRouteView = memo(function SavedBolRouteView({
  documents,
  visibleCount,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  // Group documents by border stations
  const borderGroups = useMemo(() => {
    const groups: Record<string, BorderGroup> = {
      islam_qala: {
        id: "islam_qala",
        name: "Islam Qala Border",
        nameFa: "گمرک مرزی اسلام قلعه (هرات - ایران)",
        corridor: "Bandar Abbas / Chabahar ➔ Islam Qala ➔ Herat / Kabul",
        badgeColor: "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
        docs: [],
      },
      torghundi: {
        id: "torghundi",
        name: "Torghundi Border",
        nameFa: "گمرک تورغندی (هرات - ترکمنستان)",
        corridor: "Turkmenistan / Central Asia ➔ Torghundi ➔ Herat",
        badgeColor: "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
        docs: [],
      },
      hairatan: {
        id: "hairatan",
        name: "Hairatan Border",
        nameFa: "گمرک حیرتان (مزار شریف - ازبکستان)",
        corridor: "Uzbekistan / Termez ➔ Hairatan ➔ Mazar-i-Sharif / Kabul",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
        docs: [],
      },
      spin_boldak: {
        id: "spin_boldak",
        name: "Spin Boldak Border",
        nameFa: "گمرک اسپین بولدک (قندهار - پاکستان)",
        corridor: "Karachi Port / Chaman ➔ Spin Boldak ➔ Kandahar / Kabul",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
        docs: [],
      },
      zaranj: {
        id: "zaranj",
        name: "Zaranj / Milak Border",
        nameFa: "گمرک مرزی زرنج (نیمروز - میلک)",
        corridor: "Chabahar / Milak ➔ Zaranj ➔ Nimroz / Delaram",
        badgeColor: "bg-cyan-100 text-cyan-900 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300",
        docs: [],
      },
      other: {
        id: "other",
        name: "Direct & Domestic Logistics",
        nameFa: "مسیرهای مستقیم و ترانزیت داخلی",
        corridor: "Direct delivery across Afghan commercial centers",
        badgeColor: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
        docs: [],
      },
    }

    visibleDocs.forEach((doc) => {
      const route = extractBolRoute(doc)
      const context = `${route.display} ${route.borderCrossing || ""} ${doc.port_of_loading || ""} ${doc.port_of_discharge || ""} ${doc.place_of_delivery || ""} ${doc.cargo_route_note || ""}`.toLowerCase()

      if (context.includes("islam qala") || context.includes("اسلام قلعه") || context.includes("islamqala")) {
        groups.islam_qala.docs.push(doc)
      } else if (context.includes("torghundi") || context.includes("تورغندی") || context.includes("turghundi")) {
        groups.torghundi.docs.push(doc)
      } else if (context.includes("hairatan") || context.includes("حیرتان") || context.includes("hayratan")) {
        groups.hairatan.docs.push(doc)
      } else if (context.includes("spin boldak") || context.includes("اسپین بولدک") || context.includes("boldak") || context.includes("chaman")) {
        groups.spin_boldak.docs.push(doc)
      } else if (context.includes("zaranj") || context.includes("زرنج") || context.includes("milak")) {
        groups.zaranj.docs.push(doc)
      } else {
        groups.other.docs.push(doc)
      }
    })

    return Object.values(groups).filter((g) => g.docs.length > 0)
  }, [visibleDocs])

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <div className="space-y-8">
      {borderGroups.map((group) => {
        const groupWeight = group.docs.reduce((acc, d) => acc + parseWeight(d.net_weight || d.gross_weight), 0)
        const groupPkgs = group.docs.reduce((acc, d) => acc + parsePackages(d.number_of_packages), 0)
        const reeferCount = group.docs.filter((d) => extractBolRoute(d).hasReefer).length

        return (
          <div
            key={group.id}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs overflow-hidden"
          >
            {/* Group Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border-b border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {group.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400" dir="rtl">
                      • {group.nameFa}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {group.corridor}
                  </p>
                </div>
              </div>

              {/* Group Quick Stats Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${group.badgeColor}`}>
                  {group.docs.length} BOLs
                </span>
                {groupWeight > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold">
                    ⚖️ {(groupWeight / 1000).toFixed(1)} MT
                  </span>
                )}
                {reeferCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 text-xs font-bold border border-cyan-200 dark:border-cyan-800">
                    ❄️ {reeferCount} Reefer
                  </span>
                )}
              </div>
            </div>

            {/* Grid of Shipments under this Border */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {group.docs.map((doc) => {
                const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
                const invoiceNo = extractInvoiceNumber(doc)
                const routeInfo = extractBolRoute(doc)

                return (
                  <div
                    key={`route-${doc.id || doc.bol_number}`}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all space-y-3 group"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-mono font-black text-sm text-blue-950 dark:text-blue-300">
                        <span>{bolNo}</span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(bolNo, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy BOL #"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {invoiceNo && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-xs font-mono font-bold">
                          {invoiceNo}
                        </span>
                      )}
                    </div>

                    {/* Parties */}
                    <div className="text-xs space-y-0.5">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {doc.shipper_name || "N/A"}
                      </p>
                      <p className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                        ➔ {doc.consignee_name || "N/A"}
                      </p>
                    </div>

                    {/* Transit Route Spec */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Compass className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate" dir={routeInfo.isPersian ? "rtl" : "ltr"}>
                          {routeInfo.display !== "—" ? routeInfo.display : "Standard Route"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span dir="auto">🚚 <bdi>{doc.truck_number || doc.driver_name || "N/A"}</bdi></span>
                        {routeInfo.isFullReefer ? (
                          <span className="text-cyan-700 font-bold">❄️ Full Reefer</span>
                        ) : routeInfo.hasReefer ? (
                          <span className="text-cyan-700 font-bold">❄️ Reefer</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {doc.number_of_packages && <span>📦 {doc.number_of_packages}</span>}
                        {(doc.net_weight || doc.gross_weight) && <span>⚖️ {doc.net_weight || doc.gross_weight}</span>}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onEdit(doc)}
                          className="h-7 px-2 text-xs font-bold bg-blue-600 text-white rounded-lg cursor-pointer"
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onPreview(doc)}
                          className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDownload(doc)}
                          className="h-7 w-7 p-0 text-amber-600 border-amber-300 rounded-lg cursor-pointer"
                          title="Download PDF"
                        >
                          <FileDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
})
