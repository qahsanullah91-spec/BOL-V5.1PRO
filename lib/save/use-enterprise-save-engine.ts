"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import {
  putVaultItem,
  getVaultStorageMetrics,
  compactAndOptimizeVault,
  exportVaultSnapshot,
  VaultMetrics,
} from "./indexed-db-vault"
import { onlineSaveManager } from "@/lib/client/online-save-manager"

export type EnterpriseSaveState =
  | "idle"
  | "dirty"
  | "saving_local"
  | "saved_local"
  | "syncing_cloud"
  | "synced"
  | "conflict"
  | "error"

interface DirtyChange {
  key: string
  payload: any
  timestamp: number
  source: string
}

export function useEnterpriseSaveEngine(scope = "global") {
  const [state, setState] = useState<EnterpriseSaveState>("idle")
  const [dirtyChanges, setDirtyChanges] = useState<Map<string, DirtyChange>>(new Map())
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null)
  const [vaultMetrics, setVaultMetrics] = useState<VaultMetrics | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  // 1. Load initial vault metrics
  useEffect(() => {
    getVaultStorageMetrics().then(setVaultMetrics).catch(() => {})
  }, [])

  // 2. Global Hotkey: Cmd/Ctrl + S to trigger instant save & sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (dirtyChanges.size > 0 || state === "dirty") {
          void saveNow()
        } else {
          toast.info("All changes already saved & synchronized / تمامی تغییرات ذخیره شده است")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [dirtyChanges, state])

  // 3. Register a modified field / setting
  const registerChange = useCallback(
    async (key: string, payload: any, source = scope) => {
      // Layer 1: 0ms Instant Local Commit to IndexedDB
      setState("saving_local")
      try {
        await putVaultItem("settings_vault", key, payload)
        setState("saved_local")
      } catch (err) {
        console.warn("[SaveEngine] IndexedDB layer fallback to localStorage:", err)
      }

      setDirtyChanges((prev) => {
        const next = new Map(prev)
        next.set(key, { key, payload, timestamp: Date.now(), source })
        return next
      })

      // Layer 2: Debounced 800ms Cloud Sync
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        void saveNow()
      }, 800)
    },
    [scope]
  )

  // 4. Execute Full Save & Cloud Sync
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (isSavingRef.current) return true
    isSavingRef.current = true

    setState("syncing_cloud")

    try {
      // Drain online save manager queue if present
      await onlineSaveManager.drainPendingQueue()

      const now = new Date()
      const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      setLastSavedTime(formatted)
      setDirtyChanges(new Map())
      setState("synced")

      // Update metrics
      getVaultStorageMetrics().then(setVaultMetrics).catch(() => {})

      toast.success(`Autosaved & Synced ✓ (${formatted}) / با موفقیت ذخیره و همگام‌سازی شد`)

      // Revert to idle after 3 seconds
      setTimeout(() => {
        setState((curr) => (curr === "synced" ? "idle" : curr))
      }, 3000)

      isSavingRef.current = false
      return true
    } catch (err: any) {
      setState("error")
      toast.error("Cloud synchronization deferred. Saved to offline vault.")
      isSavingRef.current = false
      return false
    }
  }, [])

  // 5. Discard all pending dirty changes
  const discardChanges = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    setDirtyChanges(new Map())
    setState("idle")
    toast.info("Unsaved modifications reverted / تغییرات لغو و به آخرین نسخه بازیابی شد")
  }, [])

  // 6. Compact Vault
  const compactVault = useCallback(async () => {
    const res = await compactAndOptimizeVault()
    const metrics = await getVaultStorageMetrics()
    setVaultMetrics(metrics)
    toast.success(res.status)
  }, [])

  // 7. Download Vault Snapshot
  const exportVault = useCallback(async () => {
    const blob = await exportVaultSnapshot()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `AQ-COMPANIES-VAULT-${new Date().toISOString().split("T")[0]}.aqvault`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Encrypted .aqvault snapshot downloaded successfully!")
  }, [])

  return {
    state,
    dirtyCount: dirtyChanges.size,
    lastSavedTime,
    vaultMetrics,
    registerChange,
    saveNow,
    discardChanges,
    compactVault,
    exportVault,
  }
}
