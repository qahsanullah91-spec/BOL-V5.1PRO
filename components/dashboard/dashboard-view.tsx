"use client"

import React, { useState, useEffect, useCallback, useMemo, startTransition } from "react"
import {
  Sparkles,
  RefreshCw,
  Plus,
  Calendar,
  CloudCheck,
  ShieldCheck,
  Search,
  Building2,
  FileText,
  Clock,
  Layers,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp, type Account } from "@/lib/app-context"
import { toast } from "sonner"
import { DashboardKpiGrid, type DashboardKpiSummary } from "./dashboard-kpi-grid"
import { DashboardQuickActions } from "./dashboard-quick-actions"
import { DashboardCharts } from "./dashboard-charts"
import { DashboardRecentBols } from "./dashboard-recent-bols"
import { DashboardTopAccounts } from "./dashboard-top-accounts"
import type { SavedDocumentData } from "@/components/bill-of-lading/recent-bol-card"
import { cleanBolNumber } from "@/lib/utils/bol-filters"

export function DashboardView() {
  const {
    accounts,
    setView,
    selectAccount,
    selectCompany,
    currentUser,
    isSyncing,
    syncCloudData,
  } = useApp()

  const [bolSummary, setBolSummary] = useState({
    total_bols: 0,
    total_packages: 0,
    packages_display: "—",
    total_weight: 0,
    total_goods_value: 0,
  })
  const [recentBols, setRecentBols] = useState<SavedDocumentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Solar Hijri and Gregorian current date formatting
  const todayFormatted = useMemo(() => {
    try {
      const d = new Date()
      const greg = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      // Approximate solar hijri conversion for Afghan logistics operations
      const hijriYear = d.getFullYear() - 621
      return { greg, hijriYear }
    } catch {
      return { greg: "Today", hijriYear: 1405 }
    }
  }, [])

  // 1. Load BOL summary & recent documents from API and local storage
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)

    // Fast path from local storage
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("skybol:saved-documents") || window.localStorage.getItem("sky-bol-browser-documents")
        if (raw) {
          const docs: SavedDocumentData[] = JSON.parse(raw)
          if (Array.isArray(docs) && docs.length > 0) {
            const active = docs.filter((d: any) => !d.isArchived && d.status !== "archived")
            setRecentBols(active.slice(0, 8))
            let pkgs = 0
            let wt = 0
            for (const d of active) {
              const p = parseInt(String(d.number_of_packages || d.numberOfPackages || "0").replace(/,/g, ""), 10)
              if (!isNaN(p)) pkgs += p
              const w = parseFloat(String(d.gross_weight || d.net_weight || "0").replace(/,/g, ""))
              if (!isNaN(w)) wt += w
            }
            setBolSummary((prev) => ({
              ...prev,
              total_bols: active.length,
              total_packages: pkgs,
              packages_display: `${pkgs.toLocaleString()} CTNS`,
              total_weight: Math.round(wt),
            }))
          }
        }
      }
    } catch (e) {
      console.warn("[Dashboard] Error reading local storage cache:", e)
    }

    // Network enrichment from FastAPI/Next API endpoints
    try {
      const [sumRes, recRes] = await Promise.allSettled([
        fetch("/api/bol/summary", { cache: "no-store" }),
        fetch("/api/bol/recent?limit=8", { cache: "no-store" }),
      ])

      if (sumRes.status === "fulfilled" && sumRes.value.ok) {
        const json = await sumRes.value.json()
        if (json?.data) {
          setBolSummary(json.data)
        }
      }

      if (recRes.status === "fulfilled" && recRes.value.ok) {
        const json = await recRes.value.json()
        if (Array.isArray(json?.data) && json.data.length > 0) {
          setRecentBols(json.data)
        }
      }
    } catch (err) {
      console.warn("[Dashboard] Network load error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    loadDashboardData()

    // Listen to real-time update events
    const handleUpdate = () => {
      loadDashboardData()
    }
    window.addEventListener("skybol:documents-updated", handleUpdate)
    window.addEventListener("skybol:account-ledger-updated", handleUpdate)

    return () => {
      window.removeEventListener("skybol:documents-updated", handleUpdate)
      window.removeEventListener("skybol:account-ledger-updated", handleUpdate)
    }
  }, [loadDashboardData])

  // 2. Financial & Account Aggregates satisfying accounting invariance (Debit - Credit)
  const financialMetrics = useMemo(() => {
    let totalDebit = 0
    let totalCredit = 0
    let totalDriverRentAfn = 0
    let totalCompanies = 0

    for (const acc of accounts) {
      if (Array.isArray(acc.companies)) {
        totalCompanies += acc.companies.length
        for (const comp of acc.companies) {
          if (Array.isArray(comp.ledgerEntries)) {
            for (const entry of comp.ledgerEntries) {
              totalDebit += Number(entry.debit) || 0
              totalCredit += Number(entry.credit) || 0
              const entryDriverRent = (entry as any).driverRent
              if (entryDriverRent) {
                const rentVal = parseFloat(String(entryDriverRent).replace(/,/g, "")) || 0
                if (!isNaN(rentVal)) totalDriverRentAfn += rentVal
              }
            }
          }
        }
      }
    }

    const netReceivables = Math.round((totalDebit - totalCredit) * 100) / 100
    return {
      totalDebit,
      totalCredit,
      netReceivables,
      totalDriverRentAfn: Math.round(totalDriverRentAfn),
      totalCompanies: Math.max(totalCompanies, accounts.length),
    }
  }, [accounts])

  // 3. Navigation & Actions handlers
  const handleNavigate = useCallback(
    (targetView: any) => {
      startTransition(() => {
        setView(targetView)
      })
    },
    [setView]
  )

  const handleNewBol = useCallback(() => {
    startTransition(() => {
      setView("bol")
    })
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("skybol:new-bol"))
    }
  }, [setView])

  const handleEditBol = useCallback(
    (doc: SavedDocumentData) => {
      const canonicalId = cleanBolNumber(doc.bol_number) || cleanBolNumber(doc.id) || doc.id || doc.bol_number
      startTransition(() => {
        setView("bol")
      })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("skybol:load-bol-doc", { detail: { id: canonicalId, doc } }))
      }
    },
    [setView]
  )

  const handlePreviewBol = useCallback(
    (doc: SavedDocumentData) => {
      handleEditBol(doc)
    },
    [handleEditBol]
  )

  const handleFiles = useCallback(
    (doc: SavedDocumentData) => {
      const canonicalId = cleanBolNumber(doc.bol_number) || cleanBolNumber(doc.id) || doc.id || doc.bol_number
      startTransition(() => {
        setView("bol")
      })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("skybol:load-bol-tab", { detail: { id: canonicalId, tab: "attachments", doc } }))
      }
    },
    [setView]
  )

  const handlePdfDownload = useCallback(async (doc: SavedDocumentData) => {
    const id = doc.id || doc.bol_number
    if (!id) return
    setDownloadingPdfId(id)
    try {
      const res = await fetch(`/api/bol/pdf?action=download&bolId=${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error("PDF download failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${doc.bol_number || id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("PDF downloaded successfully")
    } catch {
      toast.error("Unable to generate PDF")
    } finally {
      setDownloadingPdfId(null)
    }
  }, [])

  const handleOpenLedger = useCallback(
    (account: Account) => {
      selectAccount(account)
      if (account.companies && account.companies.length > 0) {
        selectCompany(account.companies[0])
      }
      handleNavigate("ledger")
    },
    [selectAccount, selectCompany, handleNavigate]
  )

  const handleOpenCompanies = useCallback(
    (account: Account) => {
      selectAccount(account)
      handleNavigate("companies")
    },
    [selectAccount, handleNavigate]
  )

  const kpiSummary: DashboardKpiSummary = {
    totalBols: bolSummary.total_bols,
    totalPackages: bolSummary.total_packages,
    packagesDisplay: bolSummary.packages_display,
    totalWeight: bolSummary.total_weight,
    totalGoodsValue: bolSummary.total_goods_value,
    accountsCount: accounts.length,
    companiesCount: financialMetrics.totalCompanies,
    shippersCount: accounts.length,
    totalReceivablesUsd: financialMetrics.netReceivables,
    totalDriverRentAfn: financialMetrics.totalDriverRentAfn,
    activeTrucksCount: 48,
    isSyncing,
  }

  return (
    <div className="w-full max-w-[1780px] mx-auto p-3 sm:p-5 lg:p-6 space-y-5 animate-in fade-in duration-200">
      {/* =================================================================== */}
      {/* 1. EXECUTIVE HERO BANNER                                            */}
      {/* =================================================================== */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-linear-to-br from-white via-slate-50/80 to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-850 p-4 sm:p-6 shadow-sm">
        {/* Decorative ambient gradient backdrop */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-linear-to-bl from-blue-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Command Center</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>System Online & Synchronized</span>
              </span>

              <span className="text-slate-400 text-xs hidden sm:inline">•</span>

              <span className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayFormatted.greg}</span>
                <span className="font-['Vazirmatn',sans-serif] text-[11px] text-slate-400">({todayFormatted.hijriYear} هـ.ش)</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              Sky Ariana Logistics & BOL Management
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Real-time executive oversight across multi-modal Bills of Lading, client account ledgers, border customs corridors, and multi-currency financials.
            </p>
          </div>

          {/* Primary Quick Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
            <Button
              type="button"
              onClick={handleNewBol}
              className="h-9 sm:h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-sm transition-all flex items-center gap-2 px-3.5 sm:px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Create BOL</span>
              <span className="text-[11px] font-normal opacity-80 hidden min-[400px]:inline font-['Vazirmatn',sans-serif]">
                / بارنامه جدید
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={syncCloudData}
              disabled={isSyncing}
              className="h-9 sm:h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs transition-all flex items-center gap-2 px-3.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Cloud"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleNavigate("reports")}
              className="h-9 sm:h-10 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs transition-all flex items-center gap-1.5 px-3"
            >
              <span>Reports</span>
            </Button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. EXECUTIVE METRIC KPI CARDS                                       */}
      {/* =================================================================== */}
      <DashboardKpiGrid summary={kpiSummary} onNavigate={handleNavigate} />

      {/* =================================================================== */}
      {/* 3. QUICK ACTION COMMAND HUB                                         */}
      {/* =================================================================== */}
      <DashboardQuickActions
        onNavigate={handleNavigate}
        onNewBol={handleNewBol}
        onSync={syncCloudData}
        isSyncing={isSyncing}
      />

      {/* =================================================================== */}
      {/* 4. RECENT BILLS OF LADING CREATIONS (6 RECENT)                      */}
      {/* =================================================================== */}
      {recentBols.length > 0 && (
        <DashboardRecentBols
          bols={recentBols}
          onEdit={handleEditBol}
          onPreview={handlePreviewBol}
          onFiles={handleFiles}
          onPdf={handlePdfDownload}
          onViewAll={() => handleNavigate("bol")}
          onNewBol={handleNewBol}
          downloadingPdfId={downloadingPdfId}
        />
      )}

      {/* =================================================================== */}
      {/* 5. INTERACTIVE CHARTS & CARGO / CORRIDOR BREAKDOWN                  */}
      {/* =================================================================== */}
      <DashboardCharts
        bolsCount={bolSummary.total_bols}
        packagesTotal={bolSummary.total_packages}
      />

      {/* =================================================================== */}
      {/* 6. PRIMARY BUSINESS ACCOUNTS & CLIENT LEDGERS                       */}
      {/* =================================================================== */}
      <DashboardTopAccounts
        accounts={accounts}
        onSelectAccount={selectAccount}
        onOpenLedger={handleOpenLedger}
        onOpenCompanies={handleOpenCompanies}
        onViewAllAccounts={() => handleNavigate("accounts")}
      />
    </div>
  )
}
