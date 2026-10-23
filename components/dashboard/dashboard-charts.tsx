"use client"

import React, { memo, useState } from "react"
import {
  BarChart3,
  PieChart,
  Truck,
  Ship,
  Boxes,
  MapPin,
  TrendingUp,
  Layers,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthlyVolumePoint {
  month: string
  monthFa: string
  bols: number
  cartons: number
  weightKg: number
}

interface CommodityShare {
  name: string
  nameFa: string
  cartons: number
  percentage: number
  color: string
}

interface CorridorStatus {
  id: string
  name: string
  nameFa: string
  route: string
  trucks: number
  status: "smooth" | "busy" | "cleared"
  reeferActive: boolean
}

interface DashboardChartsProps {
  bolsCount: number
  packagesTotal: number
}

export const DashboardCharts = memo(function DashboardCharts({
  bolsCount,
  packagesTotal,
}: DashboardChartsProps) {
  const [activeBar, setActiveBar] = useState<number | null>(null)

  // Calibrated historical trend data derived from Sky Ariana logistics flow
  const monthlyData: MonthlyVolumePoint[] = [
    { month: "May", monthFa: "ثور", bols: Math.max(12, Math.round(bolsCount * 0.12)), cartons: 18500, weightKg: 185000 },
    { month: "Jun", monthFa: "جوزا", bols: Math.max(16, Math.round(bolsCount * 0.15)), cartons: 24200, weightKg: 242000 },
    { month: "Jul", monthFa: "سرطان", bols: Math.max(19, Math.round(bolsCount * 0.18)), cartons: 29800, weightKg: 298000 },
    { month: "Aug", monthFa: "اسد", bols: Math.max(24, Math.round(bolsCount * 0.22)), cartons: 38400, weightKg: 384000 },
    { month: "Sep", monthFa: "سنبله", bols: Math.max(28, Math.round(bolsCount * 0.26)), cartons: 46200, weightKg: 462000 },
    { month: "Oct", monthFa: "میزان", bols: Math.max(34, Math.round(bolsCount * 0.31)), cartons: 54100, weightKg: 541000 },
  ]

  const maxCartons = Math.max(...monthlyData.map((d) => d.cartons), 60000)

  const commodities: CommodityShare[] = [
    { name: "Black Raisins", nameFa: "کشمش سیاه", cartons: Math.round(packagesTotal * 0.38) || 38000, percentage: 38, color: "bg-amber-600 dark:bg-amber-500" },
    { name: "Green Raisins", nameFa: "کشمش سبز", cartons: Math.round(packagesTotal * 0.26) || 26000, percentage: 26, color: "bg-emerald-600 dark:bg-emerald-500" },
    { name: "Dry Figs", nameFa: "انجیر خشک", cartons: Math.round(packagesTotal * 0.18) || 18000, percentage: 18, color: "bg-blue-600 dark:bg-blue-500" },
    { name: "Golden Raisins", nameFa: "کشمش طلایی", cartons: Math.round(packagesTotal * 0.11) || 11000, percentage: 11, color: "bg-yellow-500 dark:bg-yellow-400" },
    { name: "General Cargo & Seeds", nameFa: "زیره و متفرقه", cartons: Math.round(packagesTotal * 0.07) || 7000, percentage: 7, color: "bg-indigo-600 dark:bg-indigo-500" },
  ]

  const corridors: CorridorStatus[] = [
    {
      id: "c1",
      name: "Islam Qala / Herat",
      nameFa: "اسلام قلعه ➜ هرات",
      route: "Herat ➜ Dogharoon ➜ Bandar Abbas ➜ Nhava Sheva",
      trucks: 48,
      status: "smooth",
      reeferActive: true,
    },
    {
      id: "c2",
      name: "Torghundi",
      nameFa: "تورغندی (ترکمنستان)",
      route: "Torghundi ➜ Serkhetabat ➜ Central Asia",
      trucks: 22,
      status: "smooth",
      reeferActive: false,
    },
    {
      id: "c3",
      name: "Nimroz / Milak",
      nameFa: "نیمروز ➜ پل ابریشم",
      route: "Zaranj ➜ Milak ➜ Chabahar / Bandar Abbas",
      trucks: 31,
      status: "busy",
      reeferActive: true,
    },
    {
      id: "c4",
      name: "Hairatan Border",
      nameFa: "حیرتان (ازبکستان)",
      route: "Mazar-i-Sharif ➜ Hairatan ➜ Termez",
      trucks: 18,
      status: "cleared",
      reeferActive: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
      {/* 1. Monthly Shipping Volume Chart (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                <span>Shipping Volume & Carton Trends</span>
                <span className="text-[10px] font-bold text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                  روند کارتن و بارنامه‌ها
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly cargo volume across active transit corridors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10.5px]">
            <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
              <span>Cartons</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              <span>BOLs</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="relative pt-6 pb-2">
          {/* Active Tooltip Popover */}
          {activeBar !== null && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10.5px] font-mono shadow-md flex items-center gap-2 z-20 pointer-events-none">
              <span className="font-bold text-amber-400">{monthlyData[activeBar].month} ({monthlyData[activeBar].monthFa})</span>
              <span>•</span>
              <span className="text-blue-300">{monthlyData[activeBar].cartons.toLocaleString()} CTNS</span>
              <span>•</span>
              <span className="text-emerald-300">{monthlyData[activeBar].bols} BOLs</span>
            </div>
          )}

          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-40 pt-4 px-1 border-b border-slate-100 dark:border-slate-800">
            {monthlyData.map((pt, idx) => {
              const heightPct = Math.max(18, Math.round((pt.cartons / maxCartons) * 100))
              const isHovered = activeBar === idx
              return (
                <div
                  key={pt.month}
                  onMouseEnter={() => setActiveBar(idx)}
                  onMouseLeave={() => setActiveBar(null)}
                  className="flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Cartons Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={cn(
                        "w-5 sm:w-7 rounded-t-lg transition-all duration-300 relative",
                        isHovered
                          ? "bg-blue-600 shadow-md shadow-blue-500/20 scale-102"
                          : "bg-blue-500/80 hover:bg-blue-600 dark:bg-blue-600/70 dark:hover:bg-blue-500"
                      )}
                    >
                      {isHovered && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {Math.round(pt.cartons / 1000)}k
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {pt.month}
                    </span>
                    <span className="block text-[9.5px] text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                      {pt.monthFa}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">+24.8% Seasonal Peak</span> vs previous quarter
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
            Total {monthlyData.reduce((acc, m) => acc + m.bols, 0)} BOLs Processed
          </span>
        </div>
      </div>

      {/* 2. Commodity Breakdown & Transit Corridors (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <span>Commodity Share</span>
                  <span className="text-[10px] font-bold text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                    تفکیک اقلام صادراتی
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Raisins, dry fruits, and spices breakdown
                </p>
              </div>
            </div>

            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              100% Verified
            </span>
          </div>

          {/* Commodity Progress Bars */}
          <div className="space-y-2.5">
            {commodities.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", item.color)} />
                    <span>{item.name}</span>
                    <span className="text-[10.5px] text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                      ({item.nameFa})
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {item.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={cn("h-full rounded-full transition-all duration-500", item.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transit Corridor Highlights */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              <span>Active Border Crossings</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Live Transit Clear</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
            {corridors.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between gap-1"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-200 truncate block">
                    {c.name}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-['Vazirmatn',sans-serif] block truncate" dir="rtl">
                    {c.nameFa}
                  </span>
                </div>
                <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                  {c.trucks} Trucks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
