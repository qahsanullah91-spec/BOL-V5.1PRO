"use client"

import React from "react"
import { useOnlineSaveStatus } from "@/lib/client/use-online-save-status"
import { Cloud, CheckCircle2, RefreshCw, AlertTriangle, CloudOff } from "lucide-react"
import { toast } from "sonner"

export interface OnlineSyncStatusBadgeProps {
  variant?: "compact" | "full" | "icon"
  onOpenCloudSync?: () => void
  className?: string
}

export function OnlineSyncStatusBadge({
  variant = "full",
  onOpenCloudSync,
  className = "",
}: OnlineSyncStatusBadgeProps) {
  const { isOnline, isSyncing, pendingCount, lastSyncTime, drainPendingNow, verifyConnectivity } =
    useOnlineSaveStatus()

  const handleClick = async () => {
    if (isSyncing) return

    if (pendingCount > 0) {
      const toastId = toast.loading(`Synchronizing ${pendingCount} pending offline changes online...`)
      const res = await drainPendingNow()
      if (res.processed > 0) {
        toast.success(`✓ Synchronized ${res.processed} pending document(s) online!`, { id: toastId })
      } else if (res.failed > 0) {
        toast.error(`Could not sync. Still offline or connection error.`, { id: toastId })
      }
      return
    }

    if (onOpenCloudSync) {
      onOpenCloudSync()
      return
    }

    // Ping & Verify
    const toastId = toast.loading("Verifying cloud connection...")
    const ok = await verifyConnectivity()
    if (ok) {
      toast.success("✓ Cloud connection active & verified!", {
        id: toastId,
        description: `Last synced at ${lastSyncTime || "recently"}`,
      })
    } else {
      toast.error("Cloud server unreachable or network offline.", {
        id: toastId,
        description: "Documents will be saved locally and queued until reconnected.",
      })
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center p-1 rounded-lg transition-all cursor-pointer ${
          !isOnline
            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
            : isSyncing
            ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            : pendingCount > 0
            ? "text-amber-600 hover:bg-amber-50"
            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
        } ${className}`}
        title={
          !isOnline
            ? "Offline: Changes saved locally and queued for online sync"
            : isSyncing
            ? "Syncing documents to Cloud..."
            : pendingCount > 0
            ? `${pendingCount} document(s) pending online sync. Click to retry.`
            : `Cloud Synchronized (Last: ${lastSyncTime || "now"}). Click to test connection.`
        }
      >
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
        ) : !isOnline ? (
          <CloudOff className="h-3.5 w-3.5 text-amber-600" />
        ) : pendingCount > 0 ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        ) : (
          <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        )}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white">
            {pendingCount}
          </span>
        )}
      </button>
    )
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-bold shadow-2xs transition-all cursor-pointer ${
          !isOnline
            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            : isSyncing
            ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse"
            : pendingCount > 0
            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
        } ${className}`}
        title="Click to check connection or sync pending changes"
      >
        {isSyncing ? (
          <RefreshCw className="h-2.5 w-2.5 animate-spin text-blue-600 shrink-0" />
        ) : !isOnline ? (
          <CloudOff className="h-2.5 w-2.5 text-amber-600 shrink-0" />
        ) : pendingCount > 0 ? (
          <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
        ) : (
          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}
        <span>
          {isSyncing
            ? "Syncing…"
            : !isOnline
            ? `Offline (${pendingCount} Queued)`
            : pendingCount > 0
            ? `${pendingCount} Pending Sync`
            : "Online ✓"}
        </span>
      </button>
    )
  }

  // Full Variant
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold shadow-2xs transition-all cursor-pointer ${
        !isOnline
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          : isSyncing
          ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
          : pendingCount > 0
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      } ${className}`}
      title={
        !isOnline
          ? "Network is offline. Your work is saved locally and will auto-sync once connected."
          : isSyncing
          ? "Syncing documents to Cloud..."
          : pendingCount > 0
          ? `Click to sync ${pendingCount} offline changes now`
          : `All documents synchronized online. Last check: ${lastSyncTime || "now"}. Click to test.`
      }
    >
      {isSyncing ? (
        <RefreshCw className="h-3 w-3 animate-spin text-blue-600 shrink-0" />
      ) : !isOnline ? (
        <CloudOff className="h-3 w-3 text-amber-600 shrink-0" />
      ) : pendingCount > 0 ? (
        <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
      ) : (
        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
      )}
      <span>
        {isSyncing
          ? "Syncing to Cloud…"
          : !isOnline
          ? `Offline · ${pendingCount} Queued`
          : pendingCount > 0
          ? `${pendingCount} Pending Cloud Sync`
          : `Online · Cloud Synced`}
      </span>
      {isOnline && pendingCount === 0 && lastSyncTime && (
        <span className="hidden xl:inline text-[9.5px] opacity-75 font-mono">
          ({lastSyncTime})
        </span>
      )}
    </button>
  )
}
