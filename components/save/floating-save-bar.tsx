"use client"

import React from "react"
import { Save, Undo2, CloudCheck, RefreshCw } from "lucide-react"

interface FloatingSaveBarProps {
  dirtyCount: number
  isSaving?: boolean
  onSave: () => void | Promise<any>
  onDiscard: () => void
}

export function FloatingSaveBar({
  dirtyCount,
  isSaving = false,
  onSave,
  onDiscard,
}: FloatingSaveBarProps) {
  if (dirtyCount <= 0) return null

  return (
    <aside
      aria-label="Unsaved changes bar"
      className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-4 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-black/90 text-white shadow-2xl shadow-blue-900/30 border border-slate-700/80 backdrop-blur-2xl">
        {/* Unsaved count indicator */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-black text-amber-300 font-mono">{dirtyCount}</span>
          <span className="text-slate-300 font-medium">Unsaved Changes</span>
          <span className="text-amber-400 font-[vazirmatn] text-[11px] font-bold" dir="rtl">
            ({dirtyCount} تغییر ذخیره نشده)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Revert changes / لغو تغییرات"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Discard / لغو</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Save & Sync Now (Cmd/Ctrl + S)"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save & Sync (⌘S) / ذخیره</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
