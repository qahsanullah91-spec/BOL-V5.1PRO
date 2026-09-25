"use client"

import React from "react"
import { SavedDocument } from "@/lib/reports/types"
import { formatDisplayDate, isRtlText } from "@/lib/reports/parsers"
import { Button } from "@/components/ui/button"
import {
  X,
  Edit,
  ExternalLink,
  FileDown,
  Truck,
  Package,
  Scale,
  DollarSign,
  MapPin,
  FileText,
  Boxes,
} from "lucide-react"

interface BolQuickViewProps {
  doc: SavedDocument | null
  onClose: () => void
  onEditBol?: (id: string) => void
  onOpenPreview?: (id: string) => void
}

export function BolQuickView({
  doc,
  onClose,
  onEditBol,
  onOpenPreview,
}: BolQuickViewProps) {
  if (!doc) return null

  const isShipperRtl = isRtlText(doc.shipper_name)
  const isConsigneeRtl = isRtlText(doc.consignee_name)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                BOL Quick View
              </span>
              {doc.pdf_url && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  PDF Available
                </span>
              )}
            </div>
            <h2 className="text-xl font-black font-mono tracking-tight text-white mt-1 truncate">
              {doc.bol_number || "Draft BOL"}
            </h2>
            <p className="text-xs text-slate-400">
              Issued: {formatDisplayDate(doc.issue_date || doc.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          {onEditBol && (
            <Button
              size="sm"
              onClick={() => onEditBol(doc.id)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 text-xs"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit BOL
            </Button>
          )}

          {onOpenPreview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenPreview(doc.id)}
              className="rounded-xl border-slate-200 hover:bg-slate-100 font-bold h-8 text-xs text-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open Full BOL
            </Button>
          )}

          {doc.pdf_url && (
            <a
              href={doc.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 h-8 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Download PDF
            </a>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs">
          {/* Parties Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Shipper / فرستنده</span>
              <p className={`font-bold text-slate-900 text-sm mt-0.5 ${isShipperRtl ? "text-right font-[vazirmatn]" : ""}`} dir={isShipperRtl ? "rtl" : "ltr"}>
                {doc.shipper_name || <span className="text-red-500 italic">Missing Shipper</span>}
              </p>
            </div>

            <div className="border-t border-slate-200/80 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Consignee / گیرنده</span>
              <p className={`font-bold text-slate-900 text-sm mt-0.5 ${isConsigneeRtl ? "text-right font-[vazirmatn]" : ""}`} dir={isConsigneeRtl ? "rtl" : "ltr"}>
                {doc.consignee_name || <span className="text-red-500 italic">Missing Consignee</span>}
              </p>
            </div>

            {doc.notify_party_name && (
              <div className="border-t border-slate-200/80 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Notify Party</span>
                <p className="font-semibold text-slate-700 mt-0.5">{doc.notify_party_name}</p>
              </div>
            )}
          </div>

          {/* Cargo & Packages */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-black uppercase">Packages</span>
              </div>
              <p className="text-base font-black font-mono text-slate-900">
                {doc.number_of_packages || "-"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-black uppercase">Net Weight</span>
              </div>
              <p className="text-base font-black font-mono text-slate-900">
                {doc.net_weight || "-"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase">Goods Value</span>
              </div>
              <p className="text-base font-black font-mono text-emerald-700">
                {doc.goods_value || "-"}
              </p>
            </div>
          </div>

          {/* Commodity Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Description of Goods / Commodity</span>
            <p className="font-bold text-slate-900 mt-1 whitespace-pre-wrap leading-relaxed">
              {doc.cargo_description || doc.goods_description || doc.description_of_goods || <span className="text-amber-600 italic">No description provided</span>}
            </p>
          </div>

          {/* Route & Ports */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Route & Border Transits</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Port of Loading (POL)</span>
                <p className="font-bold text-slate-900 mt-0.5">{doc.port_of_loading || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Port of Discharge (POD)</span>
                <p className="font-bold text-slate-900 mt-0.5">{doc.port_of_discharge || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Final Destination</span>
                <p className="font-bold text-slate-900 mt-0.5">{doc.place_of_delivery || doc.destination_country || "-"}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Invoice Reference</span>
                <p className="font-bold text-slate-900 mt-0.5 font-mono">{doc.invoice_no || doc.invoice_number || "-"}</p>
              </div>
            </div>
          </div>

          {/* Transport & Containers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold">
              <Boxes className="w-4 h-4 text-purple-600" />
              <span>Containers & Vehicle Equipment</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Container Numbers</span>
                <p className="font-black font-mono text-slate-900 mt-0.5">
                  {doc.container_numbers || <span className="text-slate-400 font-normal italic">None declared</span>}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Seal Numbers</span>
                <p className="font-black font-mono text-slate-900 mt-0.5">
                  {doc.seal_numbers || <span className="text-slate-400 font-normal italic">-</span>}
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black">Truck License Plate</span>
                <p className="font-black font-mono text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.truck_number || "-"}</span>
                </p>
              </div>
              {doc.driver_name && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black">Driver</span>
                  <p className="font-bold text-slate-900 mt-0.5 truncate" title={doc.driver_name}>{doc.driver_name}</p>
                </div>
              )}
              {(doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent) && (
                <div className={!doc.driver_name ? "text-right" : ""}>
                  <span className="text-[10px] text-amber-700 uppercase font-black">Driver Rent</span>
                  <p className="font-black font-mono text-amber-900 mt-0.5 truncate" dir="ltr" title={doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent}>
                    {doc.driver_rent || (doc as any).driverFreight || (doc as any).driverRent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>ID: <code className="font-mono text-[10px]">{doc.id}</code></span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
