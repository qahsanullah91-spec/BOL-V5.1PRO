/**
 * Sky Ariana BOL — Enterprise Client-Side Online Save & Synchronization Engine
 * Handles online/offline detection, resilient multi-tier document saving,
 * automatic background queue draining, retry backoff, and cross-tab/device sync.
 */

export interface PendingOnlineSaveItem {
  id: string
  bolNumber: string
  method: "POST" | "PUT"
  url: string
  payload: any
  timestamp: string
  attempts: number
  lastError?: string
}

export type OnlineSaveStatus = "online" | "saving" | "synced" | "offline" | "syncing" | "error"

export interface SaveOnlineResult {
  success: boolean
  mode: "online" | "offline-queued"
  data: any
  error?: string
}

const STORAGE_PENDING_QUEUE = "skybol:online-pending-queue"
const STORAGE_LAST_SYNC_TIME = "skybol:last-online-sync-time"

type OnlineSaveListener = (state: {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: string | null
}) => void

class OnlineSaveManager {
  private static instance: OnlineSaveManager
  private isOnline = true
  private isSyncing = false
  private pendingQueue: PendingOnlineSaveItem[] = []
  private lastSyncTime: string | null = null
  private listeners: Set<OnlineSaveListener> = new Set()
  private drainInterval: ReturnType<typeof setInterval> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null

  private constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
      this.loadQueue()
      this.lastSyncTime = window.localStorage.getItem(STORAGE_LAST_SYNC_TIME)

      // Network lifecycle event listeners
      window.addEventListener("online", this.handleNetworkOnline)
      window.addEventListener("offline", this.handleNetworkOffline)
      window.addEventListener("focus", this.handleWindowFocus)

      // Background heartbeat for verified connectivity & auto-draining
      this.heartbeatInterval = setInterval(() => {
        void this.verifyConnectivity()
      }, 30000)

      this.drainInterval = setInterval(() => {
        if (this.isOnline && this.pendingQueue.length > 0 && !this.isSyncing) {
          void this.drainPendingQueue()
        }
      }, 15000)

      // Initial check
      void this.verifyConnectivity()
    }
  }

  public static getInstance(): OnlineSaveManager {
    if (!OnlineSaveManager.instance) {
      OnlineSaveManager.instance = new OnlineSaveManager()
    }
    return OnlineSaveManager.instance
  }

  private handleNetworkOnline = () => {
    this.isOnline = true
    this.notify()
    void this.drainPendingQueue()
  }

  private handleNetworkOffline = () => {
    this.isOnline = false
    this.notify()
  }

  private handleWindowFocus = () => {
    void this.verifyConnectivity()
    if (this.isOnline && this.pendingQueue.length > 0 && !this.isSyncing) {
      void this.drainPendingQueue()
    }
  }

  private loadQueue(): void {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_PENDING_QUEUE)
      if (raw) {
        const parsed = JSON.parse(raw)
        this.pendingQueue = Array.isArray(parsed) ? parsed : []
      }
    } catch {
      this.pendingQueue = []
    }
  }

  private persistQueue(): void {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_PENDING_QUEUE, JSON.stringify(this.pendingQueue))
    } catch (err) {
      console.warn("[OnlineSaveManager] Failed to persist pending queue:", err)
    }
    this.notify()
  }

  private notify(): void {
    const state = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingQueue.length,
      lastSyncTime: this.lastSyncTime,
    }
    for (const listener of this.listeners) {
      try {
        listener(state)
      } catch (e) {
        console.error("[OnlineSaveManager] Listener error:", e)
      }
    }
  }

  public subscribe(listener: OnlineSaveListener): () => void {
    this.listeners.add(listener)
    listener({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingQueue.length,
      lastSyncTime: this.lastSyncTime,
    })
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingQueue.length,
      lastSyncTime: this.lastSyncTime,
    }
  }

  /**
   * Verifies actual internet and API connectivity (not just Wi-Fi link)
   */
  public async verifyConnectivity(): Promise<boolean> {
    if (typeof window === "undefined") return true
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2800)
      const res = await fetch("/api/health?probe=online-save", {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeout)
      const isHealthy = res.ok
      if (this.isOnline !== isHealthy) {
        this.isOnline = isHealthy
        this.notify()
        if (isHealthy && this.pendingQueue.length > 0) {
          void this.drainPendingQueue()
        }
      }
      return isHealthy
    } catch {
      if (this.isOnline) {
        this.isOnline = false
        this.notify()
      }
      return false
    }
  }

  /**
   * Saves a BOL document online with automatic retry, local persistence,
   * and offline queuing fallback.
   */
  public async saveBol(
    url: string,
    method: "POST" | "PUT",
    dataToSend: any,
    options: { maxRetries?: number } = {}
  ): Promise<SaveOnlineResult> {
    const maxRetries = options.maxRetries ?? 2
    const bolNumber = dataToSend.bol_number || dataToSend.id || "BOL-UNKNOWN"

    // Helper to safely write to browser storage for instant recovery
    this.persistLocalBrowserSnapshots(dataToSend)

    // Check if network is known offline before attempting
    if (!this.isOnline) {
      this.enqueuePending(url, method, dataToSend, bolNumber, "Device is offline")
      return {
        success: true,
        mode: "offline-queued",
        data: dataToSend,
      }
    }

    let attempt = 0
    let lastErrorMsg = "Connection failed"

    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 6000)

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "X-Client-Save-Timestamp": new Date().toISOString(),
          },
          body: JSON.stringify(dataToSend),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
          let errMsg = `Server returned status ${res.status}`
          try {
            const errJson = await res.json()
            errMsg = errJson.error || errMsg
          } catch {}

          // If client validation error (400, 422), do not retry
          if (res.status >= 400 && res.status < 500 && res.status !== 408) {
            return {
              success: false,
              mode: "online",
              data: null,
              error: errMsg,
            }
          }
          throw new Error(errMsg)
        }

        const result = await res.json()
        if (result.success && result.data) {
          // Success! Remove any existing queued item for this BOL
          this.removePending(bolNumber)
          this.recordSuccessfulSync()

          // Trigger asynchronous background cloud snapshot update
          void this.triggerBackgroundCloudRelay(result.data)

          return {
            success: true,
            mode: "online",
            data: result.data,
          }
        } else {
          throw new Error(result.error || "Save not acknowledged by server")
        }
      } catch (err: any) {
        attempt++
        lastErrorMsg = err?.message || "Network request failed"
        if (attempt <= maxRetries) {
          // Exponential backoff wait (400ms, 1000ms)
          await new Promise((r) => setTimeout(r, attempt * 500))
        }
      }
    }

    // Network calls exhausted: Queue for automatic background sync
    this.isOnline = false
    this.enqueuePending(url, method, dataToSend, bolNumber, lastErrorMsg)

    return {
      success: true,
      mode: "offline-queued",
      data: dataToSend,
    }
  }

  private persistLocalBrowserSnapshots(data: any): void {
    if (typeof window === "undefined") return
    try {
      const keys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
      const targetId = data.id || data.bol_number
      const targetNum = data.bol_number

      for (const k of keys) {
        const raw = window.localStorage.getItem(k)
        const list: any[] = raw ? JSON.parse(raw) : []
        const filtered = list.filter((item) => {
          const iId = item.id || item.bol_number
          const iNum = item.bol_number
          return iId !== targetId && iNum !== targetId && iId !== targetNum && iNum !== targetNum
        })
        window.localStorage.setItem(k, JSON.stringify([data, ...filtered]))
      }
    } catch (e) {
      console.warn("[OnlineSaveManager] Failed to write browser snapshots:", e)
    }
  }

  private enqueuePending(
    url: string,
    method: "POST" | "PUT",
    payload: any,
    bolNumber: string,
    reason: string
  ): void {
    // Check if item already exists in queue; if so, update payload
    const existingIdx = this.pendingQueue.findIndex((i) => i.bolNumber === bolNumber || (payload.id && i.payload.id === payload.id))
    const item: PendingOnlineSaveItem = {
      id: `save_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bolNumber,
      method,
      url,
      payload,
      timestamp: new Date().toISOString(),
      attempts: existingIdx >= 0 ? this.pendingQueue[existingIdx].attempts : 0,
      lastError: reason,
    }

    if (existingIdx >= 0) {
      this.pendingQueue[existingIdx] = item
    } else {
      this.pendingQueue.unshift(item)
    }
    this.persistQueue()

    window.dispatchEvent(
      new CustomEvent("skybol:online-sync-queued", {
        detail: { bolNumber, count: this.pendingQueue.length },
      })
    )
  }

  private removePending(bolNumber: string): void {
    const before = this.pendingQueue.length
    this.pendingQueue = this.pendingQueue.filter(
      (item) => item.bolNumber !== bolNumber && item.payload?.id !== bolNumber
    )
    if (this.pendingQueue.length !== before) {
      this.persistQueue()
    }
  }

  private recordSuccessfulSync(): void {
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    this.lastSyncTime = nowStr
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_LAST_SYNC_TIME, nowStr)
      } catch {}
    }
    this.notify()
  }

  /**
   * Triggers a lightweight master cloud snapshot refresh in background
   */
  private async triggerBackgroundCloudRelay(savedRecord: any): Promise<void> {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documents: [savedRecord],
        }),
      }).catch(() => {})
    } catch {}
  }

  /**
   * Drains all queued pending saves in FIFO order
   */
  public async drainPendingQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isSyncing || this.pendingQueue.length === 0) {
      return { processed: 0, failed: 0 }
    }

    this.isSyncing = true
    this.notify()

    let processed = 0
    let failed = 0
    const successfullySyncedBols: string[] = []

    try {
      const itemsToProcess = [...this.pendingQueue]

      for (const item of itemsToProcess) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 6000)

          const res = await fetch(item.url, {
            method: item.method,
            headers: {
              "Content-Type": "application/json",
              "X-Client-Queue-Drain": "true",
            },
            body: JSON.stringify(item.payload),
            signal: controller.signal,
          })
          clearTimeout(timeout)

          if (res.ok) {
            this.pendingQueue = this.pendingQueue.filter((q) => q.id !== item.id)
            this.persistQueue()
            processed++
            successfullySyncedBols.push(item.bolNumber)
          } else {
            failed++
            item.attempts += 1
            item.lastError = `Server responded ${res.status}`

            // Drop unrecoverable client errors (4xx except 408/429) or items exceeding max retries
            // to prevent infinite retry loops on invalid payloads
            const isUnrecoverableClientError = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429
            if (isUnrecoverableClientError || item.attempts >= 5) {
              console.warn(
                `[OnlineSaveManager] Evicting unrecoverable pending save for ${item.bolNumber} (status: ${res.status}, attempts: ${item.attempts})`
              )
              this.pendingQueue = this.pendingQueue.filter((q) => q.id !== item.id)
            }
            this.persistQueue()
          }
        } catch (err: any) {
          failed++
          item.attempts += 1
          item.lastError = err?.message || "Network error during drain"
          this.persistQueue()
          // Network connection failed during drain, break loop and wait
          this.isOnline = false
          break
        }
      }

      if (processed > 0) {
        this.recordSuccessfulSync()
        window.dispatchEvent(
          new CustomEvent("skybol:online-sync-complete", {
            detail: {
              count: processed,
              bolNumbers: successfullySyncedBols,
            },
          })
        )
        window.dispatchEvent(new CustomEvent("skybol:documents-updated"))
        window.dispatchEvent(new CustomEvent("skybol:cloud-synced", { detail: { count: processed } }))
      }
    } finally {
      this.isSyncing = false
      this.notify()
    }

    return { processed, failed }
  }

  public getPendingQueue(): PendingOnlineSaveItem[] {
    return [...this.pendingQueue]
  }

  public clearPendingQueue(): void {
    this.pendingQueue = []
    this.persistQueue()
  }
}

export const onlineSaveManager = OnlineSaveManager.getInstance()
