"use client"

import React, { memo } from "react"
import {
  FileText,
  Users,
  Landmark,
  Truck,
  ShieldCheck,
  ArrowUpRight,
  Boxes,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface DashboardKpiSummary {
  totalBols: number
  totalPackages: number
  packagesDisplay: string
  totalWeight: number
  totalGoodsValue: number
  accountsCount: number
  companiesCount: number
  shippersCount: number
  totalReceivablesUsd: number
  totalDriverRentAfn: number
  activeTrucksCount: number
  isSyncing: boolean
}

interface DashboardKpiGridProps {
  summary: DashboardKpiSummary
  onNavigate: (viewId: any) => void
}

export const DashboardKpiGrid = memo(function DashboardKpiGrid({
  summary,
  onNavigate,
}: DashboardKpiGridProps) {
  const cards = [
    {
      id: "bol",
      title: "BILLS OF LADING",
      titleFa: "مجموع اسناد بارنامه",
      value: summary.totalBols > 0 ? summary.totalBols.toLocaleString() : "—",
      subtext: summary.packagesDisplay || `${summary.totalPackages.toLocaleString()} CTNS`,
      secondary: summary.totalWeight > 0 ? `${summary.totalWeight.toLocaleString()} KG Gross` : "Active Freight",
      icon: FileText,
      badge: "Official BOLs",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      accentBg: "from-blue-500/10 to-indigo-500/5",
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/80 border-blue-200/80 dark:border-blue-800",
      view: "bol",
      trend: "+ Active Flow",
    },
    {
      id: "accounts",
      title: "ACCOUNTS & SHIPPERS",
      titleFa: "حسابات تجاری و شرکت‌ها",
      value: summary.accountsCount > 0 ? summary.accountsCount.toLocaleString() : "—",
      subtext: `${summary.shippersCount || summary.accountsCount} Registered Shippers`,
      secondary: `${summary.companiesCount || summary.accountsCount} Company Branches`,
      icon: Users,
      badge: "69 Active",
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      accentBg: "from-emerald-500/10 to-teal-500/5",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200/80 dark:border-emerald-800",
      view: "accounts",
      trend: "Accounting Verified",
    },
    {
      id: "ledger",
      title: "LEDGER RECEIVABLES",
      titleFa: "تراز مطالبات و دفتر حساب",
      value: summary.totalReceivablesUsd > 0 ? `$${summary.totalReceivablesUsd.toLocaleString()}` : "$0.00",
      subtext: summary.totalDriverRentAfn > 0 ? `Rent: ${summary.totalDriverRentAfn.toLocaleString()} AFN` : "Driver Rent Segregated",
      secondary: "Invariance: Debit - Credit",
      icon: Landmark,
      badge: "Net Balance",
      badgeColor: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      accentBg: "from-amber-500/10 to-yellow-500/5",
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/80 border-amber-200/80 dark:border-amber-800",
      view: "ledger",
      trend: "Multi-Currency Safe",
    },
    {
      id: "shipments",
      title: "TRANSIT & CORRIDORS",
      titleFa: "ناوگان مرزی و پیگیری",
      value: summary.activeTrucksCount > 0 ? `${summary.activeTrucksCount} Trucks` : "5 Borders",
      subtext: "Islam Qala • Torghundi • Hairatan",
      secondary: "Herat ➜ Bandar Abbas ➜ Nhava Sheva",
      icon: Truck,
      badge: "Active Corridors",
      badgeColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      accentBg: "from-cyan-500/10 to-sky-500/5",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-50 dark:bg-cyan-950/80 border-cyan-200/80 dark:border-cyan-800",
      view: "shipments",
      trend: "Live Control Tower",
    },
    {
      id: "data-protection",
      title: "CLOUD MESH & SECURITY",
      titleFa: "امنیت داده و همگام‌سازی",
      value: summary.isSyncing ? "Syncing..." : "100% Synced",
      subtext: "Encrypted Zero-Loss Snapshots",
      secondary: "33 Enterprise Modules Online",
      icon: ShieldCheck,
      badge: summary.isSyncing ? "Sync Active" : "Protected",
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      accentBg: "from-purple-500/10 to-indigo-500/5",
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-950/80 border-purple-200/80 dark:border-purple-800",
      view: "data-protection",
      trend: "Multi-Device Peer",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate(card.view)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onNavigate(card.view)
              }
            }}
            className={cn(
              "group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-4.5",
              "shadow-xs hover:shadow-lg hover:border-blue-400/80 dark:hover:border-blue-500/80 transition-all duration-200 cursor-pointer",
              "flex flex-col justify-between overflow-hidden hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            )}
          >
            {/* Subtle Gradient Backlight */}
            <div
              className={cn(
                "absolute -top-12 -right-12 w-28 h-28 rounded-full bg-linear-to-br blur-2xl opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none",
                card.accentBg
              )}
            />

            {/* Top Row: Icon + Badge + Arrow */}
            <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs",
                    card.badgeColor
                  )}
                >
                  {card.badge}
                </span>
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Value & Primary Title */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <span className="text-[10px] font-medium text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                  {card.titleFa}
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight truncate">
                {card.value}
              </div>
            </div>

            {/* Subtext and Secondary Metadata */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 relative z-10 space-y-1">
              <div className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 truncate flex items-center gap-1">
                <span>{card.subtext}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-slate-500 dark:text-slate-400">
                <span className="truncate">{card.secondary}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 text-[10px]">
                  {card.trend}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
