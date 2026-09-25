"use client"

import React, { useEffect, useState } from "react"
import { Server, Wifi, WifiOff, RefreshCw, Laptop } from "lucide-react"
import { apiClient, type ServerConnectionState } from "@/lib/client/api-client"
import { offlineQueue } from "@/lib/client/offline-queue"

interface ServerStatusPillProps {
  onOpenSettings?: () => void
}

export function ServerStatusPill({ onOpenSettings }: ServerStatusPillProps) {
  const [state, setState] = useState<ServerConnectionState>(apiClient.getState())
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [connectionMode, setConnectionMode] = useState<"local" | "server">("local")
  const [serverState, setServerState] = useState<string>("LOCAL_READY")
  const [latencyMs, setLatencyMs] = useState<number | null>(null)

  useEffect(() => {
    // 1. Check Electron Desktop bridge
    if (typeof window !== "undefined" && (window as any).skyDesktop?.getNetworkStatus) {
      void (window as any).skyDesktop.getNetworkStatus().then((status: any) => {
        if (status) {
          setConnectionMode(status.mode || "local")
          setServerState(status.state || "LOCAL_READY")
          if (status.latencyMs) setLatencyMs(status.latencyMs)
        }
      })
    } else if (typeof window !== "undefined") {
      const mode = (localStorage.getItem("sky_connection_mode") as "local" | "server") || "local"
      setConnectionMode(mode)
    }

    const unsubClient = apiClient.subscribe(setState)
    const unsubQueue = offlineQueue.subscribe((q) => setPendingCount(q.length))

    return () => {
      unsubClient()
      unsubQueue()
    }
  }, [])

  // Local Offline Mode Pill
  if (connectionMode === "local") {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-full transition-colors cursor-pointer shadow-xs"
        title="Running in Standalone Local Offline Mode (SQLite WAL)"
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <Laptop className="h-3 w-3 text-blue-600" />
        <span className="font-mono text-[11px] font-bold">LOCAL</span>
      </button>
    )
  }

  // Central Server Mode Pills
  if (serverState === "SERVER_READY" || state.status === "connected") {
    const displayLatency = latencyMs || state.latencyMs
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer shadow-xs"
        title={`Connected to AQ COMPANIES Central Server (${displayLatency ? `${displayLatency}ms` : "online"})`}
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Wifi className="h-3 w-3 text-emerald-600" />
        <span className="font-mono text-[11px] font-bold">
          SERVER {displayLatency ? `(${displayLatency}ms)` : ""}
        </span>
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full">
            {pendingCount}
          </span>
        )}
      </button>
    )
  }

  if (serverState === "SERVER_CONNECTING" || state.status === "reconnecting") {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
        title="Connecting to Central Office Server..."
      >
        <RefreshCw className="h-3 w-3 text-amber-600 animate-spin" />
        <span className="font-mono text-[11px] font-bold">CONNECTING...</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors cursor-pointer shadow-xs"
      title="Disconnected from Central Office Server. Click to configure connection."
    >
      <WifiOff className="h-3 w-3 text-rose-600" />
      <span className="font-mono text-[11px] font-bold">SERVER OFFLINE</span>
    </button>
  )
}
