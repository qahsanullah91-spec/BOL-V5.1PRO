"use client"

import { useState, useEffect, useCallback } from "react"
import { onlineSaveManager, SaveOnlineResult } from "./online-save-manager"

export interface OnlineSaveState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: string | null
  saveBolOnline: (
    url: string,
    method: "POST" | "PUT",
    dataToSend: any,
    options?: { maxRetries?: number }
  ) => Promise<SaveOnlineResult>
  drainPendingNow: () => Promise<{ processed: number; failed: number }>
  verifyConnectivity: () => Promise<boolean>
}

export function useOnlineSaveStatus(): OnlineSaveState {
  const [status, setStatus] = useState(() => onlineSaveManager.getStatus())

  useEffect(() => {
    const unsubscribe = onlineSaveManager.subscribe((newStatus) => {
      setStatus(newStatus)
    })
    return unsubscribe
  }, [])

  const saveBolOnline = useCallback(
    async (url: string, method: "POST" | "PUT", dataToSend: any, options?: { maxRetries?: number }) => {
      return onlineSaveManager.saveBol(url, method, dataToSend, options)
    },
    []
  )

  const drainPendingNow = useCallback(async () => {
    return onlineSaveManager.drainPendingQueue()
  }, [])

  const verifyConnectivity = useCallback(async () => {
    return onlineSaveManager.verifyConnectivity()
  }, [])

  return {
    ...status,
    saveBolOnline,
    drainPendingNow,
    verifyConnectivity,
  }
}
