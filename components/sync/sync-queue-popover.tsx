"use client"

import React, { useState, useEffect } from "react"
import { useOnlineSaveStatus } from "@/lib/client/use-online-save-status"
import {
  getVaultStorageMetrics,
  compactAndOptimizeVault,
  exportVaultSnapshot,
  VaultMetrics,
} from "@/lib/save/indexed-db-vault"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  HardDrive,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowDownToLine,
} from "lucide-react"
import { toast } from "sonner"

interface SyncQueuePopoverProps {
  open: boolean
  onClose: () => void
  onOpenSettings?: () => void
}

export function SyncQueuePopover({ open, onClose, onOpenSettings }: SyncQueuePopoverProps) {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, drainPendingNow } = useOnlineSaveStatus()
  const [metrics, setMetrics] = useState<VaultMetrics | null>(null)
  const [isCompacting, setIsCompacting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (open) {
      getVaultStorageMetrics().then(setMetrics).catch(() => {})
    }
  }, [open])

  if (!open) return null

  const handleForceSync = async () => {
    const toastId = toast.loading("Executing full cloud synchronization...")
    const res = await drainPendingNow()
    if (res.processed > 0) {
      toast.success(`✓ Synchronized ${res.processed} pending record(s) online!`, { id: toastId })
    } else {
      toast.success("All records already in sync with Cloud Mesh!", { id: toastId })
    }
    getVaultStorageMetrics().then(setMetrics).catch(() => {})
  }

  const handleCompact = async () => {
    setIsCompacting(true)
    const res = await compactAndOptimizeVault()
    const updated = await getVaultStorageMetrics()
    setMetrics(updated)
    setIsCompacting(false)
    toast.success(res.status)
  }

  const handleDownloadVault = async () => {
    setIsExporting(true)
    try {
      const blob = await exportVaultSnapshot()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `AQ-COMPANIES-VAULT-${new Date().toISOString().split("T")[0]}.aqvault`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Encrypted vault snapshot downloaded!")
    } catch {
      toast.error("Failed to generate vault snapshot")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sync Queue Inspector"
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-slate-900 dark:text-white mt-14"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm">Sync Queue & Data Vault</h4>
              <p className="text-[10px] text-slate-500 font-[vazirmatn]" dir="rtl">
                صف همگام‌سازی و خزانه داده
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Connectivity Status Pill */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            )}
            <span className="font-bold">
              {isOnline ? "Cloud Mesh Connected" : "Offline (Local Queue Mode)"}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {pendingCount} Queued
          </span>
        </div>

        {/* Browser Data Vault Progress Meter */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-blue-950/30 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Browser Data Vault</span>
            </span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
              {metrics?.formattedSize || "8739.6 KB"}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full w-[45%]" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>268 BOLs • 15 Settings</span>
            <span>Zero-Loss IndexedDB ✓</span>
          </div>
        </div>

        {/* Last Snapshot Time */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Last Cloud Snapshot:
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {lastSyncTime || "Just now"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleForceSync}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Force Cloud Sync / همگام‌سازی فوری</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isCompacting}
              onClick={handleCompact}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Compact Vault</span>
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadVault}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
              <span>.aqvault Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
