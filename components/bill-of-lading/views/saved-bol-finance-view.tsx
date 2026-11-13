"use client"

import React, { memo, useMemo } from "react"
import {
  BadgeDollarSign,
  Banknote,
  Receipt,
  FileCheck,
  Eye,
  Pencil,
  FileDown,
  FolderArchive,
  TrendingUp,
  Wallet,
  ArrowRight,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SavedBolViewCommonProps } from "./view-types"
import { parseMoney, parseWeight } from "@/lib/reports/parsers"
import { extractInvoiceNumber } from "@/lib/utils/shipping-documents"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export const SavedBolFinanceView = memo(function SavedBolFinanceView({
  documents,
  visibleCount,
  onEdit,
  onDownload,
  onPreview,
  onOpenPdf,
  onFiles,
}: SavedBolViewCommonProps) {
  const visibleDocs = documents.slice(0, visibleCount)

  // Calculate financial aggregates
  const stats = useMemo(() => {
    let totalRentAfn = 0
    let totalRentUsd = 0
    let totalGoodsValueUsd = 0
    let invoicedCount = 0

    visibleDocs.forEach((doc) => {
      const invoiceNo = extractInvoiceNumber(doc)
      if (invoiceNo) invoicedCount++

      // Driver rent parsing
      const rentRaw = String(doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent || "").trim()
      if (rentRaw) {
        const isUsd = /usd|\$/i.test(rentRaw)
        const num = parseFloat(rentRaw.replace(/[^0-9.]/g, "")) || 0
        if (isUsd) {
          totalRentUsd += num
        } else {
          totalRentAfn += num
        }
      }

      // Goods value parsing
      const gvRaw = String(doc.goods_value || "").trim()
      if (gvRaw) {
        const gvNum = parseFloat(gvRaw.replace(/[^0-9.]/g, "")) || 0
        totalGoodsValueUsd += gvNum
      }
    })

    const invoicePercent = visibleDocs.length > 0 ? Math.round((invoicedCount / visibleDocs.length) * 100) : 0
    const avgRent = visibleDocs.length > 0 ? Math.round(totalRentAfn / visibleDocs.length) : 0

    return {
      totalRentAfn,
      totalRentUsd,
      totalGoodsValueUsd,
      invoicedCount,
      invoicePercent,
      avgRent,
    }
  }, [visibleDocs])

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success(`Copied: ${text}`)
  }

  return (
    <div className="space-y-6">
      {/* Financial KPI Summary Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 rounded-3xl border border-blue-200/90 dark:border-blue-800 bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-950/40 dark:to-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
            <span>Total Driver Rent (AFN)</span>
            <Banknote className="h-4 w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {stats.totalRentAfn.toLocaleString()} <span className="text-xs font-bold text-slate-500">AFN</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            مجموع کرایه پرداختنی به رانندگان
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-emerald-200/90 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/40 dark:to-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span>Declared Goods Value</span>
            <BadgeDollarSign className="h-4 w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            ${stats.totalGoodsValueUsd.toLocaleString()}{" "}
            <span className="text-xs font-bold text-slate-500">USD</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            ارزش مجموعی کالای ترانزیتی
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-indigo-200/90 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/40 dark:to-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <span>Invoiced Shipments</span>
            <Receipt className="h-4 w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {stats.invoicedCount} / {visibleDocs.length}{" "}
            <span className="text-xs font-bold text-indigo-600">({stats.invoicePercent}%)</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            بارنامه‌های دارای فاکتور رسمی
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl border border-amber-200/90 dark:border-amber-800 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-950/40 dark:to-slate-900 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
            <span>Average Rent per BOL</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
            {stats.avgRent.toLocaleString()} <span className="text-xs font-bold text-slate-500">AFN</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400" dir="rtl">
            میانگین هزینه کرایه هر موتر
          </p>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="p-4 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Shipment Invoicing & Freight Audit Ledger
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cross-reference BOL numbers with invoices, declared values, and driver payouts
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400" dir="rtl">
            دفتر معین مالی و کرایه بارنامه‌ها
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 uppercase font-black tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">BOL & Invoice</th>
                <th className="p-3.5">Account / Shipper</th>
                <th className="p-3.5">Consignee</th>
                <th className="p-3.5 text-right">Goods Value</th>
                <th className="p-3.5 text-right">Driver Rent / Freight</th>
                <th className="p-3.5">Truck / Driver Name</th>
                <th className="p-3.5 text-center">Invoicing Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {visibleDocs.map((doc, idx) => {
                const bolNo = cleanBolNumber(doc.bol_number) || doc.bol_number || "BOL"
                const invoiceNo = extractInvoiceNumber(doc)
                const rent = doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent
                const hasRent = rent && String(rent).trim() !== "" && String(rent).trim() !== "0"

                return (
                  <tr
                    key={`fin-${doc.id || doc.bol_number || idx}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3.5 font-mono text-xs">
                      <div className="flex items-center gap-1.5 font-black text-blue-950 dark:text-blue-300">
                        <span>{bolNo}</span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(bolNo, e)}
                          className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                          title="Copy BOL #"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {invoiceNo ? (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                          {invoiceNo}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">No invoice</span>
                      )}
                    </td>

                    <td className="p-3.5 max-w-[180px] truncate">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate" title={doc.shipper_name || "N/A"}>
                        {doc.shipper_name || "N/A"}
                      </p>
                    </td>

                    <td className="p-3.5 max-w-[180px] truncate text-slate-700 dark:text-slate-300" title={doc.consignee_name || "N/A"}>
                      {doc.consignee_name || "N/A"}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {doc.goods_value ? doc.goods_value : <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-amber-900 dark:text-amber-300">
                      {hasRent ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800">
                          {String(rent)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-[11px]" dir="auto">
                      <div className="truncate max-w-[140px]" title={doc.truck_number || doc.driver_name || "N/A"}>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          <bdi>{doc.truck_number || doc.driver_name || "—"}</bdi>
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      {invoiceNo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-black">
                          <FileCheck className="h-3 w-3" /> Invoiced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                          Pending Invoice
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onEdit(doc)}
                          className="h-8 px-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onPreview(doc)}
                          className="h-8 px-2 rounded-xl text-xs font-bold cursor-pointer"
                          title="A4 Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onDownload(doc)}
                          className="h-8 px-2 rounded-xl border-amber-300 text-amber-900 dark:text-amber-300 text-xs font-bold cursor-pointer"
                          title="Download PDF"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
