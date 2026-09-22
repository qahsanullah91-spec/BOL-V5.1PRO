"use client"

import React, { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { SavedDocument } from "@/lib/reports/types"
import { groupMonthly, groupShippers, groupCommodities } from "@/lib/reports/grouping"

interface ReportChartsProps {
  data: SavedDocument[]
  includeCharts?: boolean
  selectedYear?: number | "all"
  chartView?: "overview" | "monthly" | "shippers" | "commodities"
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#4f46e5",
  "#ca8a04",
  "#059669",
  "#be123c",
]

export function ReportCharts({
  data,
  includeCharts = false,
  selectedYear = "all",
  chartView = "overview",
}: ReportChartsProps) {
  // Aggregate data using shared grouping engine
  const monthlyData = useMemo(() => {
    return groupMonthly(data, selectedYear)
  }, [data, selectedYear])

  const shipperData = useMemo(() => {
    const list = groupShippers(data)
    return list.slice(0, 6).map((s) => ({
      name: s.shipperName.length > 18 ? s.shipperName.substring(0, 18) + "..." : s.shipperName,
      fullName: s.shipperName,
      count: s.bolCount,
      weight: s.netWeightKg,
    }))
  }, [data])

  const commodityData = useMemo(() => {
    const list = groupCommodities(data)
    return list.slice(0, 5).map((c) => ({
      name: c.commodityName,
      count: c.bolCount,
      packages: c.packages,
    }))
  }, [data])

  if (data.length === 0) return null

  // If monthly charts requested, render full 4-metric grid:
  if (chartView === "monthly") {
    return (
      <div
        data-report-charts-grid="true"
        className={`grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 mb-6 print:mb-4 break-inside-avoid print:break-inside-avoid ${
          includeCharts ? "" : "print:hidden"
        }`}
      >
        {/* 1. BOLs Per Month */}
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[230px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Bills of Lading (BOLs) Per Month
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }} />
                <Bar dataKey="bolCount" name="BOLs" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Weight Per Month */}
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[230px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Net Cargo Weight (KG) Per Month
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }} />
                <Bar dataKey="netWeightKg" name="Weight (KG)" fill="#d97706" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Goods Value Per Month */}
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[230px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Goods Value (USD) Per Month
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData.map((m) => ({
                  monthLabel: m.monthLabel,
                  valueUsd: m.goodsValueByCurrency["USD"] || 0,
                }))}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }} />
                <Bar dataKey="valueUsd" name="Value (USD)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Containers Per Month */}
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[230px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Container Deployments Per Month
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }} />
                <Bar dataKey="containerCount" name="Containers" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  // Default Overview / Standard view (Top Shippers & Monthly Activity)
  return (
    <div
      data-report-charts-grid="true"
      className={`grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 mb-8 print:mb-4 break-inside-avoid print:break-inside-avoid ${
        includeCharts ? "" : "print:hidden"
      }`}
    >
      {/* Top Shippers */}
      <div
        data-report-chart="true"
        className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[240px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
      >
        <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
          Top Commercial Shippers
        </h3>
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shipperData} layout="vertical" margin={{ top: 0, right: 15, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }}
                width={100}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }}
              />
              <Bar dataKey="count" name="BOLs" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {shipperData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly BOL Trend or Commodity Pie */}
      {commodityData.length > 1 ? (
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[240px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Top Commodities Breakdown
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commodityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="name"
                >
                  {commodityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingLeft: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div
          data-report-chart="true"
          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col h-[240px] print:h-[190px] print:p-3 print:bg-white print:border print:border-slate-300 print:rounded-lg break-inside-avoid print:break-inside-avoid"
        >
          <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 print:mb-1 print:text-[10px]">
            Shipment Volume Over Time
          </h3>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: "bold" }} />
                <Bar dataKey="bolCount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
