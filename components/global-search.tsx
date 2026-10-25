"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { CommandCenterModal } from "@/components/search/command-center-modal"

interface GlobalSearchProps {
  className?: string
  mobileIconOnly?: boolean
}

export function GlobalSearch({ className, mobileIconOnly = false }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false)

  // Listen for Ctrl+K and Cmd+K globally
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  if (mobileIconOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Global Search & Command Center (Ctrl+K)"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <CommandCenterModal open={open} onOpenChange={setOpen} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className || "hidden sm:flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200/90 bg-slate-100/90 text-slate-500 hover:bg-slate-200/90 hover:text-blue-600 dark:bg-slate-800/90 dark:text-slate-400 dark:border-slate-700/90 dark:hover:bg-slate-700/90 transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs group"}
        title="Search BOL, container, truck... (Ctrl + K)"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
      </button>

      <CommandCenterModal open={open} onOpenChange={setOpen} />
    </>
  )
}
