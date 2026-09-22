"use client"

import * as React from "react"
import { SearchIcon, FileText, User, Receipt, Truck } from "lucide-react"
import { useApp } from "@/lib/app-context"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const { setView } = useApp()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results || [])
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (item: any) => {
    setOpen(false)
    // Map item.type to the correct workspace view
    if (item.type === "bol") {
      setView("bol")
      // In a real app, you might dispatch an event to load this specific BOL
      // or redirect to a specific URL. For now, we just open the BOL workspace.
      window.dispatchEvent(new CustomEvent('load-bol-draft', { detail: { id: item.id } }))
    } else if (item.type === "invoice") {
      setView("invoice")
    } else if (item.type === "account") {
      setView("accounts")
    }
  }

  const bols = results.filter(r => r.type === "bol")
  const invoices = results.filter(r => r.type === "invoice")
  const accounts = results.filter(r => r.type === "account")

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors rounded-full border border-slate-200 dark:border-slate-700 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search anything...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400 opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search BOLs, Invoices, Accounts..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching database..." : "No results found."}
          </CommandEmpty>
          
          {bols.length > 0 && (
            <CommandGroup heading="Bills of Lading">
              {bols.map(bol => (
                <CommandItem key={bol.id} onSelect={() => handleSelect(bol)}>
                  <Truck className="mr-2 h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{bol.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{bol.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {invoices.length > 0 && (
            <CommandGroup heading="Invoices">
              {invoices.map(inv => (
                <CommandItem key={inv.id} onSelect={() => handleSelect(inv)}>
                  <Receipt className="mr-2 h-4 w-4 text-green-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{inv.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{inv.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {accounts.length > 0 && (
            <CommandGroup heading="Accounts & Ledgers">
              {accounts.map(acc => (
                <CommandItem key={acc.id} onSelect={() => handleSelect(acc)}>
                  <User className="mr-2 h-4 w-4 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{acc.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{acc.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
