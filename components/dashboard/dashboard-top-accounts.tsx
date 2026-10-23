"use client"

import React, { memo, useState, useMemo } from "react"
import {
  Users,
  Building2,
  BookOpen,
  ArrowRight,
  Search,
  Plus,
  Landmark,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Account } from "@/lib/app-context"

interface DashboardTopAccountsProps {
  accounts: Account[]
  onSelectAccount: (account: Account) => void
  onOpenLedger: (account: Account) => void
  onOpenCompanies: (account: Account) => void
  onViewAllAccounts: () => void
}

export const DashboardTopAccounts = memo(function DashboardTopAccounts({
  accounts,
  onSelectAccount,
  onOpenLedger,
  onOpenCompanies,
  onViewAllAccounts,
}: DashboardTopAccountsProps) {
  const [query, setQuery] = useState("")

  // Calculate account balances satisfying accounting invariance (Debit - Credit)
  const accountsWithMetrics = useMemo(() => {
    return accounts.map((acc) => {
      let totalDebit = 0
      let totalCredit = 0
      let driverRentAfn = 0
      let entriesCount = 0

      if (Array.isArray(acc.companies)) {
        for (const comp of acc.companies) {
          if (Array.isArray(comp.ledgerEntries)) {
            for (const entry of comp.ledgerEntries) {
              totalDebit += Number(entry.debit) || 0
              totalCredit += Number(entry.credit) || 0
              entriesCount++
              const rentVal = (entry as any).driverRent || (entry as any).driverFreight
              if (rentVal) {
                const num = parseFloat(String(rentVal).replace(/,/g, "")) || 0
                if (!isNaN(num)) driverRentAfn += num
              }
            }
          }
        }
      }

      const balance = Math.round((totalDebit - totalCredit) * 100) / 100
      return {
        ...acc,
        balance,
        totalDebit,
        totalCredit,
        driverRentAfn,
        entriesCount,
        companiesCount: acc.companies?.length || 1,
      }
    })
  }, [accounts])

  // Filter accounts by search query or pick top accounts
  const displayedAccounts = useMemo(() => {
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      return accountsWithMetrics.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 6)
    }
    // Sort by largest balance first, or top active accounts
    return [...accountsWithMetrics]
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 6)
  }, [accountsWithMetrics, query])

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
              <span>Primary Business Accounts</span>
              <span className="text-[10px] font-bold text-slate-400 font-['Vazirmatn',sans-serif]" dir="rtl">
                حسابات تجاری اصلی
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80">
                {accounts.length} Accounts
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Client financial ledgers, running statements, and company branches
            </p>
          </div>
        </div>

        {/* Search & View All Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search account name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onViewAllAccounts}
            className="h-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedAccounts.map((account) => {
          return (
            <div
              key={account.id}
              className="group relative rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 p-3.5 sm:p-4 hover:border-emerald-400/80 dark:hover:border-emerald-500/80 transition-all duration-200 flex flex-col justify-between hover:shadow-md"
            >
              {/* Account Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="text-[13px] font-black text-slate-950 dark:text-slate-100 leading-tight truncate"
                        title={account.name}
                      >
                        {account.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-['Vazirmatn',sans-serif] block" dir="rtl">
                        حساب تجاری اصلی
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    {account.companiesCount} Company
                  </span>
                </div>

                {/* Financial Balance Tag */}
                <div className="mt-2.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[10.5px] font-sans font-medium flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-emerald-600" />
                    <span>Balance:</span>
                  </span>
                  <span
                    className={cn(
                      "font-black text-xs px-2 py-0.5 rounded-md",
                      account.balance > 0
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenLedger(account)}
                  className="h-7.5 rounded-xl border-slate-200 dark:border-slate-700 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Manage Ledgers</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenCompanies(account)}
                  className="h-7.5 rounded-xl text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Companies</span>
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
