"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { ChevronDown, Check } from "lucide-react"
import { VIEW_MODE_OPTIONS, type ViewMode } from "./view-types"

interface SavedBolViewSelectorProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalCount: number
}

export const SavedBolViewSelector = React.memo(function SavedBolViewSelector({
  viewMode,
  onViewModeChange,
  totalCount,
}: SavedBolViewSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeOption = VIEW_MODE_OPTIONS.find((opt) => opt.id === viewMode) || VIEW_MODE_OPTIONS[0]

  // Close dropdown on outside click or Esc key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isDropdownOpen])

  const selectMode = useCallback(
    (mode: ViewMode) => {
      onViewModeChange(mode)
      setIsDropdownOpen(false)
    },
    [onViewModeChange]
  )

  return (
    <div className="relative inline-flex items-center shrink-0" ref={containerRef}>
      {/* 10-Type Segmented Pill Switcher (Fitted Single-Pill Design) */}
      <div
        className="inline-flex items-center gap-0.5 sm:gap-1 bg-slate-100/95 dark:bg-slate-800/95 p-1 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xs shrink-0 max-w-full overflow-x-auto no-scrollbar"
        role="group"
        aria-label="BOL Document View Modes"
      >
        {VIEW_MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isActive = viewMode === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectMode(opt.id)}
              title={`${opt.title} — ${opt.description}`}
              aria-pressed={isActive}
              className={`relative h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-blue-950 dark:text-blue-300 shadow-sm border border-slate-200/90 dark:border-slate-700 font-black scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-blue-600 dark:text-blue-400 stroke-[2.4]" : "stroke-[1.8]"
                }`}
              />
              <span className="sr-only">{opt.title}</span>
            </button>
          )
        })}

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-slate-300/80 dark:bg-slate-700 mx-0.5 shrink-0" />

        {/* Compact View Menu Trigger */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            isDropdownOpen
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/90 dark:border-slate-700"
              : "text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 hover:shadow-2xs"
          }`}
          title="All 10 View Formats Menu (منوی ۱۰ حالت نمایش)"
        >
          <span className="hidden md:inline font-black text-slate-900 dark:text-white text-[11px] max-w-[85px] truncate">
            {activeOption.label}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </button>
      </div>

      {/* 10-Option Fitted Dropdown Menu (Guaranteed never to clip) */}
      {isDropdownOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-3xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200/95 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
          role="menu"
          aria-label="View Formats"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                View Format • ۱۰ حالت نمایش
              </p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {totalCount} Bills of Lading loaded
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black font-mono">
              10 Types
            </span>
          </div>

          {/* Options List */}
          <div className="py-1 max-h-[380px] overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
            {VIEW_MODE_OPTIONS.map((opt, index) => {
              const Icon = opt.icon
              const isCurrent = viewMode === opt.id

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectMode(opt.id)}
                  className={`w-full text-left p-2.5 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                    isCurrent
                      ? "bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/90 dark:border-blue-800 text-blue-950 dark:text-blue-100 shadow-2xs"
                      : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-transparent"
                  }`}
                  role="menuitem"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-black truncate">
                        {index + 1}. {opt.label}
                      </span>
                      <span
                        className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 shrink-0"
                        dir="rtl"
                      >
                        {opt.labelFa}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {opt.description}
                    </p>
                  </div>

                  {isCurrent && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
