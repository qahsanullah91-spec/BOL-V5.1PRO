"use client"

import { useState, useEffect, useMemo } from "react"
import { AccountRecord, AccountType } from "@/lib/types/ledger-system"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Filter,
} from "lucide-react"

interface AllLedgersTabProps {
  onSelectAccount: (accountId: string) => void
  onNewAccountClick: () => void
}

type FilterCategory =
  | "all"
  | "customer"
  | "shipper"
  | "consignee"
  | "agent"
  | "supplier"
  | "company"
  | "office_expense"
  | "transportation"
  | "outstanding"
  | "credit"

export function AllLedgersTab({ onSelectAccount, onNewAccountClick }: AllLedgersTabProps) {
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<FilterCategory>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currencyFilter, setCurrencyFilter] = useState("all")

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/accounting/ledgers?limit=200")
      const data = await res.json()
      if (res.ok && data.success) {
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error("Failed to load accounts:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const currencies = useMemo(() => {
    const set = new Set<string>()
    accounts.forEach((a) => {
      if (a.currency) set.add(a.currency)
    })
    return Array.from(set)
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Currency
      if (currencyFilter !== "all" && acc.currency !== currencyFilter) return false

      // Category
      if (category === "outstanding") {
        if (acc.current_balance <= 0.01) return false
      } else if (category === "credit") {
        if (acc.current_balance >= -0.01) return false
      } else if (category !== "all") {
        if (acc.account_type !== category) return false
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = acc.account_name.toLowerCase().includes(q)
        const matchDisplay = acc.display_name.toLowerCase().includes(q)
        const matchCode = (acc.account_code || "").toLowerCase().includes(q)
        const matchAliases = (acc.aliases || []).some((al) => al.toLowerCase().includes(q))
        if (!matchName && !matchDisplay && !matchCode && !matchAliases) return false
      }

      return true
    })
  }, [accounts, category, searchQuery, currencyFilter])

  const categories = [
    { id: "all", label: "All Ledgers", count: accounts.length },
    {
      id: "customer",
      label: "Customer Ledgers",
      count: accounts.filter((a) => a.account_type === "customer").length,
    },
    {
      id: "company",
      label: "Company Ledgers",
      count: accounts.filter((a) => a.account_type === "company").length,
    },
    {
      id: "transportation",
      label: "Transportation Ledgers",
      count: accounts.filter((a) => a.account_type === "transportation").length,
    },
    {
      id: "shipper",
      label: "Shipper Ledgers",
      count: accounts.filter((a) => a.account_type === "shipper").length,
    },
    {
      id: "consignee",
      label: "Consignee Ledgers",
      count: accounts.filter((a) => a.account_type === "consignee").length,
    },
    {
      id: "agent",
      label: "Agent Ledgers",
      count: accounts.filter((a) => a.account_type === "agent").length,
    },
    {
      id: "supplier",
      label: "Supplier Ledgers",
      count: accounts.filter((a) => a.account_type === "supplier").length,
    },
    {
      id: "office_expense",
      label: "Office Expense",
      count: accounts.filter((a) => a.account_type === "office_expense").length,
    },
    {
      id: "outstanding",
      label: "Outstanding Balances",
      count: accounts.filter((a) => a.current_balance > 0.01).length,
    },
    {
      id: "credit",
      label: "Credit Balances",
      count: accounts.filter((a) => a.current_balance < -0.01).length,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Category Filter Pills */}
      <div className="relative mb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_90%,transparent_100%)] pr-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as FilterCategory)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border shadow-sm select-none ${
                category === cat.id
                  ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-md transform scale-[1.02]"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                  category === cat.id
                    ? "bg-white/25 text-white dark:bg-slate-900/25 dark:text-slate-900"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search company name, ledger title, code, alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Currency:</span>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="h-9 px-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-hidden"
            >
              <option value="all">All Currencies</option>
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(searchQuery || currencyFilter !== "all" || category !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setCurrencyFilter("all")
                setCategory("all")
              }}
              className="h-9 text-xs text-slate-500"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}

          <Button
            size="sm"
            onClick={onNewAccountClick}
            className="h-9 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            New Account Ledger
          </Button>
        </div>
      </div>

      {/* Account Ledgers List / Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[220px]">Account Name / Company</th>
                <th className="py-3 px-4 w-28">Type</th>
                <th className="py-3 px-4 w-20">Currency</th>
                <th className="py-3 px-4 w-32 text-right">Total Debit</th>
                <th className="py-3 px-4 w-32 text-right">Total Credit</th>
                <th className="py-3 px-4 w-36 text-right">Net Balance</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No account ledgers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc, idx) => {
                  const currSym = acc.currency === "AFN" ? "؋" : "$"
                  const isOut = acc.current_balance > 0.01
                  const isAdv = acc.current_balance < -0.01

                  return (
                    <tr
                      key={acc.id}
                      onClick={() => onSelectAccount(acc.id)}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {acc.display_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{acc.account_code || "N/A"}</span>
                          {acc.source && <span className="text-[10px] text-slate-500">Sheet: {acc.source}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {acc.account_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {acc.currency}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                        {currSym}{acc.total_debit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {currSym}{acc.total_credit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded ${
                            isOut
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                              : isAdv
                              ? "bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200"
                              : "text-slate-500"
                          }`}
                        >
                          {currSym}{acc.current_balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            Outstanding
                          </span>
                        ) : isAdv ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                            Advance
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold text-slate-400">
                            Settled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectAccount(acc.id)
                          }}
                        >
                          <span>Open</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
