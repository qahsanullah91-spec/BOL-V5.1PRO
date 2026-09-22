"use client"

import React, { useEffect, useState } from "react"
import { Server, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { apiClient, type ServerConnectionState } from "@/lib/client/api-client"
import { offlineQueue } from "@/lib/client/offline-queue"

interface ServerStatusPillProps {
  onOpenSettings?: () => void
}

export function ServerStatusPill({ onOpenSettings }: ServerStatusPillProps) {
  const [state, setState] = useState<ServerConnectionState>(apiClient.getState())
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [serverMode, setServerMode] = useState<string>("standalone")

  useEffect(() => {
    // Check initial mode from local storage or server config API
    fetch("/api/server/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.config?.mode) {
          setServerMode(data.config.mode)
        }
      })
      .catch(() => {})

    const unsubClient = apiClient.subscribe(setState)
    const unsubQueue = offlineQueue.subscribe((q) => setPendingCount(q.length))

    return () => {
      unsubClient()
      unsubQueue()
    }
  }, [])

  if (serverMode === "server") {
    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
        title="Main Server PC (Hosting Sky Ariana Database)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Server className="h-3 w-3 text-emerald-600" />
        <span>Main Server</span>
      </button>
    )
  }

  if (serverMode === "client" || state.status !== "unconfigured") {
    if (state.status === "connected") {
      return (
        <button
          type="button"
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
          title={`Connected to Sky Ariana Server (${state.latencyMs ? `${state.latencyMs}ms` : "online"})`}
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="h-3 w-3 text-emerald-600" />
          <span>Connected {state.latencyMs ? `(${state.latencyMs}ms)` : ""}</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      )
    }

    if (state.status === "reconnecting") {
      return (
        <button
          type="button"
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
          title="Reconnecting to Sky Ariana Server..."
        >
          <RefreshCw className="h-3 w-3 text-amber-600 animate-spin" />
          <span>Reconnecting...</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-600 text-white text-[10px] rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={onOpenSettings}
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors cursor-pointer"
        title="Offline from Main Server. Changes queued locally."
      >
        <WifiOff className="h-3 w-3 text-rose-600" />
        <span>Offline {pendingCount > 0 ? `(${pendingCount} queued)` : ""}</span>
      </button>
    )
  }

  return null
}
