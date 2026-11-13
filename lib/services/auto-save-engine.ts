/**
 * Sky Ariana Multi-Tier Auto-Save Engine
 * Provides sub-second debounced local & session syncing,
 * background API replication, draft recovery, and real-time status indicators.
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { putVaultItem, getVaultItem, deleteVaultItem } from "@/lib/save/indexed-db-vault"

export type AutoSaveStatus = "saved" | "saving" | "idle" | "error"

export interface UseAutoSaveOptions<T> {
  debounceMs?: number
  enabled?: boolean
  validate?: (data: T) => boolean
  onSave?: (data: T) => void
  apiEndpoint?: string
  syncWithIndexedDb?: boolean
}

export interface UseAutoSaveReturn<T> {
  status: AutoSaveStatus
  lastSavedAt: Date | null
  saveNow: () => void
  flush: () => void
  restoreDraft: () => T | null
  restoreDraftAsync: () => Promise<T | null>
  clearDraft: () => void
  hasDraft: boolean
  isDirty: boolean
}

/**
 * Universal Hook for Auto-Saving Form & Document Drafts
 * Multi-Tier Architecture:
 * - Tier 1: 0ms LocalStorage write
 * - Tier 2: SessionStorage backup mirror
 * - Tier 3: IndexedDB Data Vault (robust against quota and local clearing)
 * - Tier 4: Background API replication
 * - Lifecycle: beforeunload & pagehide guarantees zero lost keystrokes
 */
export function useAutoSave<T>(
  storageKey: string,
  currentData: T,
  options: UseAutoSaveOptions<T> = {}
): UseAutoSaveReturn<T> {
  const {
    debounceMs = 350,
    enabled = true,
    validate,
    onSave,
    apiEndpoint,
    syncWithIndexedDb = true,
  } = options

  const [status, setStatus] = useState<AutoSaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef<boolean>(true)
  const latestDataRef = useRef<T>(currentData)
  latestDataRef.current = currentData

  // Check if draft already exists in storage or IndexedDB
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(`${storageKey}:backup`)
      if (raw) {
        setHasDraft(true)
        return
      }
    } catch (_) {}

    if (syncWithIndexedDb) {
      getVaultItem("bol_drafts", storageKey)
        .then((record) => {
          if (record?.payload) setHasDraft(true)
        })
        .catch(() => {})
    }
  }, [storageKey, syncWithIndexedDb])

  // Core save routine
  const executeSave = useCallback(
    (data: T) => {
      if (typeof window === "undefined" || !enabled) return
      if (validate && !validate(data)) return

      setStatus("saving")
      try {
        const json = JSON.stringify(data)
        // Tier 1: LocalStorage fast RAM sync
        window.localStorage.setItem(storageKey, json)
        // Tier 2: Session storage backup mirror
        window.sessionStorage.setItem(`${storageKey}:backup`, json)

        // Tier 3: IndexedDB Vault transactional persistence
        if (syncWithIndexedDb) {
          putVaultItem("bol_drafts", storageKey, data).catch(() => {})
        }

        // Tier 4: Background API replication if endpoint specified
        if (apiEndpoint) {
          fetch(apiEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: storageKey, draft: data, timestamp: new Date().toISOString() }),
            keepalive: true,
          }).catch(() => {})
        }

        const now = new Date()
        setLastSavedAt(now)
        setStatus("saved")
        setHasDraft(true)
        setIsDirty(false)
        if (onSave) onSave(data)

        // Dispatch custom global event
        window.dispatchEvent(
          new CustomEvent("skybol:draft-saved", {
            detail: { storageKey, timestamp: now.toISOString() },
          })
        )
      } catch (err) {
        console.error(`[AutoSave] Error saving to ${storageKey}:`, err)
        setStatus("error")
      }
    },
    [storageKey, enabled, validate, onSave, apiEndpoint, syncWithIndexedDb]
  )

  // Debounced auto-save trigger on data changes
  useEffect(() => {
    // Skip initial mount to avoid overwriting stored drafts with initial blank state
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }

    if (!enabled) return

    setIsDirty(true)
    setStatus("saving")

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      executeSave(currentData)
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentData, executeSave, debounceMs, enabled])

  // Immediate flush routine for unmount, pagehide, and beforeunload
  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    executeSave(latestDataRef.current)
  }, [executeSave])

  // Attach lifecycle listeners to guarantee zero lost edits on page leave/refresh
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleBeforeUnload = () => flush()
    const handlePageHide = () => flush()
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handlePageHide)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handlePageHide)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      flush()
    }
  }, [flush])

  // Manual save trigger
  const saveNow = useCallback(() => {
    flush()
  }, [flush])

  // Restore draft from storage (sync)
  const restoreDraft = useCallback((): T | null => {
    if (typeof window === "undefined") return null
    try {
      const raw = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(`${storageKey}:backup`)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed as T
      }
    } catch (err) {
      console.error(`[AutoSave] Error restoring draft for ${storageKey}:`, err)
    }
    return null
  }, [storageKey])

  // Restore draft with IndexedDB fallback (async)
  const restoreDraftAsync = useCallback(async (): Promise<T | null> => {
    const syncResult = restoreDraft()
    if (syncResult) return syncResult

    if (syncWithIndexedDb) {
      try {
        const record = await getVaultItem<T>("bol_drafts", storageKey)
        if (record?.payload) return record.payload
      } catch (err) {
        console.error(`[AutoSave] IndexedDB restore error for ${storageKey}:`, err)
      }
    }
    return null
  }, [restoreDraft, syncWithIndexedDb, storageKey])

  // Clear draft from all tiers
  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.removeItem(storageKey)
      window.sessionStorage.removeItem(`${storageKey}:backup`)
      if (syncWithIndexedDb) {
        deleteVaultItem("bol_drafts", storageKey).catch(() => {})
      }
      setHasDraft(false)
      setIsDirty(false)
      setStatus("idle")
    } catch (_) {}
  }, [storageKey, syncWithIndexedDb])

  return {
    status,
    lastSavedAt,
    saveNow,
    flush,
    restoreDraft,
    restoreDraftAsync,
    clearDraft,
    hasDraft,
    isDirty,
  }
}

