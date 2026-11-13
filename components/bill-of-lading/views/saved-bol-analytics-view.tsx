"use client"

import React, { memo, useMemo } from "react"
import {
  BarChart3,
  TrendingUp,
  Boxes,
  Scale,
  Banknote,
  Building2,
  Users,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  Compass,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { parsePackages, parseWeight, extractBolRoute } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export const SavedBolAnalyticsView = memo(function SavedBolAnalyticsView({
  documents,
  visibleCount,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  // Compute rich business analytics
  const analytics = useMemo(() => {
    let totalPkgs = 0
    let totalWeightKg = 0
    let totalRentAfn = 0
    let reeferCount = 0

    const shipperCounts: Record<string, { count: number; weight: number }> = {}
    const consigneeCounts: Record<string, { count: number; weight: number }> = {}
    const borderCounts: Record<string, number> = {}

    visibleDocs.forEach((doc) => {
      const pkgs = parsePackages(doc.number_of_packages)
      const wt = parseWeight(doc.net_weight || doc.gross_weight)
      totalPkgs += pkgs
      totalWeightKg += wt

      const rentRaw = String(doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "").trim()
      if (rentRaw) {
        const num = parseFloat(rentRaw.replace(/[^0-9.]/g, "")) || 0
        if (!/usd|\$/i.test(rentRaw)) totalRentAfn += num
      }

      const routeInfo = extractBolRoute(doc)
      if (routeInfo.hasReefer) reeferCount++

      const border = routeInfo.borderCrossing ? routeInfo.borderCrossing.split(" ")[0] : "Direct/Domestic"
      borderCounts[border] = (borderCounts[border] || 0) + 1

      const s = doc.shipper_name?.trim() || "Unspecified Shipper"
      if (!shipperCounts[s]) shipperCounts[s] = { count: 0, weight: 0 }
      shipperCounts[s].count++
      shipperCounts[s].weight += wt

      const c = doc.consignee_name?.trim() || "Unspecified Consignee"
      if (!consigneeCounts[c]) consigneeCounts[c] = { count: 0, weight: 0 }
      consigneeCounts[c].count++
      consigneeCounts[c].weight += wt
    })

    const topShippers = Object.entries(shipperCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    const topConsignees = Object.entries(consigneeCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)

    const topBorders = Object.entries(borderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    return {
      totalPkgs,
      totalWeightKg,
      totalWeightMt: (totalWeightKg / 1000).toFixed(1),
      totalRentAfn,
      reeferCount,
      topShippers,
      topConsignees,
      topBorders,
    }
  }, [visibleDocs])

  return (
    <div className="space-y-6">
      {/* 4 Grand Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-3xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
            <span>Filtered Shipments</span>
            <Boxes className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {visibleDocs.length} <span className="text-xs font-bold text-slate-500">BOLs</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            تعداد بارنامه‌های فعال در این فیلتر
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span>Total Cargo Tonnage</span>
            <Scale className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {analytics.totalWeightMt} <span className="text-xs font-bold text-slate-500">Metric Tons</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {analytics.totalPkgs.toLocaleString()} total cartons/packages
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
            <span>Total Freight Rent</span>
            <Banknote className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {analytics.totalRentAfn.toLocaleString()} <span className="text-xs font-bold text-slate-500">AFN</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            مجموع تعهدات کرایه پرداختنی
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <span>Active Border Stations</span>
            <Compass className="h-4 w-4" />
          </div>
          <p className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {analytics.topBorders.length} <span className="text-xs font-bold text-slate-500">Corridors</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            ❄️ {analytics.reeferCount} Refrigerated shipments
          </p>
        </div>
      </div>

      {/* Two Side-by-Side Leaderboards: Top Shippers & Top Consignees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Shippers */}
        <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Top Shippers & Exporters • صادرکنندگان برتر
              </h4>
            </div>
          </div>

          <div className="space-y-2">
            {analytics.topShippers.map(([name, data], idx) => {
              const percent = visibleDocs.length > 0 ? Math.round((data.count / visibleDocs.length) * 100) : 0
              return (
                <div key={name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate max-w-[200px] text-slate-900 dark:text-slate-100">
                      {idx + 1}. {name}
                    </span>
                    <span className="font-mono text-blue-700 dark:text-blue-300">
                      {data.count} BOLs ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Consignees */}
        <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                Top Consignees & Importers • واردکنندگان برتر
              </h4>
            </div>
          </div>

          <div className="space-y-2">
            {analytics.topConsignees.map(([name, data], idx) => {
              const percent = visibleDocs.length > 0 ? Math.round((data.count / visibleDocs.length) * 100) : 0
              return (
                <div key={name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate max-w-[200px] text-slate-900 dark:text-slate-100">
                      {idx + 1}. {name}
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-300">
                      {data.count} BOLs ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Border Stations Traffic Distribution */}
      <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
          Transit Corridor Distribution • توزیع ترافیک در گمرکات مرزی
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {analytics.topBorders.map(([border, count]) => {
            const percent = visibleDocs.length > 0 ? Math.round((count / visibleDocs.length) * 100) : 0
            return (
              <div
                key={border}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1 text-center"
              >
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate">
                  {border}
                </p>
                <p className="text-base font-black font-mono text-indigo-700 dark:text-indigo-300">
                  {count} <span className="text-[10px] text-slate-500">({percent}%)</span>
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
