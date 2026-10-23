"use client"

import React, { memo } from "react"
import {
  FilePlus,
  Users,
  BookOpen,
  Receipt,
  BarChart3,
  Activity,
  Landmark,
  RefreshCw,
  FolderArchive,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardQuickActionsProps {
  onNavigate: (viewId: any) => void
  onNewBol: () => void
  onSync: () => void
  isSyncing: boolean
}

export const DashboardQuickActions = memo(function DashboardQuickActions({
  onNavigate,
  onNewBol,
  onSync,
  isSyncing,
}: DashboardQuickActionsProps) {
  const actions = [
    {
      id: "new-bol",
      label: "New Bill of Lading",
      labelFa: "ایجاد بارنامه جدید",
      description: "Generate verified multi-modal BOL",
      icon: FilePlus,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-300/80 dark:border-amber-700/80",
      iconBg: "bg-amber-500 text-slate-950",
      action: onNewBol,
      highlight: true,
    },
    {
      id: "accounts",
      label: "Customer Accounts",
      labelFa: "حسابات و شرکت‌ها",
      description: "69 client ledger directories",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400",
      action: () => onNavigate("accounts"),
    },
    {
      id: "ledger",
      label: "Client Ledgers",
      labelFa: "دفتر حساب جاری",
      description: "Debit / credit financial balance",
      icon: BookOpen,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400",
      action: () => onNavigate("ledger"),
    },
    {
      id: "invoice",
      label: "Invoices & Billing",
      labelFa: "صدور فاکتور رسمی",
      description: "Freight & demurrage billing",
      icon: Receipt,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400",
      action: () => onNavigate("invoice"),
    },
    {
      id: "reports",
      label: "Operations Reports",
      labelFa: "گزارشات و عملکرد",
      description: "Printable export sheets & P&L",
      icon: BarChart3,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-rose-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400",
      action: () => onNavigate("reports"),
    },
    {
      id: "shipments",
      label: "Control Tower",
      labelFa: "برج مراقبت ناوگان",
      description: "Live border transit & trucks",
      icon: Activity,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-cyan-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400",
      action: () => onNavigate("shipments"),
    },
    {
      id: "treasury",
      label: "Treasury & Bank",
      labelFa: "خزانه‌داری و نقدینگی",
      description: "Multi-currency bank accounts",
      icon: Landmark,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300",
      action: () => onNavigate("treasury"),
    },
    {
      id: "sync",
      label: isSyncing ? "Syncing..." : "Sync Cloud Data",
      labelFa: "همگام‌سازی ابری",
      description: "Multi-device peer data sync",
      icon: RefreshCw,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-white dark:bg-slate-900 hover:bg-sky-50/60 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-800",
      iconBg: "bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400",
      action: onSync,
      isAnimated: isSyncing,
    },
  ]

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Quick Action Command Hub</span>
              <span className="text-[10px] font-bold text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                مرکز اقدامات سریع
              </span>
            </h3>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
          1-Click direct launch into any workspace
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.action}
              className={cn(
                "group relative rounded-xl border p-2.5 sm:p-3 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between",
                "shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-97 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                act.bgColor
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs",
                    act.iconBg
                  )}
                >
                  <Icon className={cn("w-4 h-4", act.isAnimated && "animate-spin")} />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div>
                <span className="block text-xs font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {act.label}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 font-['Vazirmatn',sans-serif] truncate mt-0.5" dir="rtl">
                  {act.labelFa}
                </span>
                <span className="hidden min-[1600px]:block text-[9.5px] text-slate-400 dark:text-slate-500 truncate mt-1">
                  {act.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
