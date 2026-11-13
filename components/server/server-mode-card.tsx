"use client"

import React, { useEffect, useState } from "react"
import {
  Server,
  Laptop,
  Wifi,
  Copy,
  Check,
  RefreshCw,
  Shield,
  KeyRound,
  Download,
  Upload,
  AlertTriangle,
  HardDrive,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  RotateCcw,
  FolderArchive,
  FolderOpen,
  Archive,
  Loader2,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { apiClient, type ServerConnectionState } from "@/lib/client/api-client"
import { offlineQueue } from "@/lib/client/offline-queue"

export function ServerModeCard() {
  const [mode, setMode] = useState<"server" | "client">("server")
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Server PC state
  const [pairingRole, setPairingRole] = useState("accounting")
  const [generatedCode, setGeneratedCode] = useState<any>(null)
  const [adminSetupOpen, setAdminSetupOpen] = useState(false)
  const [adminUsername, setAdminUsername] = useState("admin")
  const [adminPassword, setAdminPassword] = useState("")
  const [devices, setDevices] = useState<any[]>([])
  const [backups, setBackups] = useState<any[]>([])
  const [backupDir, setBackupDir] = useState<string>("C:\\ProgramData\\SkyArianaBOL\\backups\\")
  const [isRefreshingBackups, setIsRefreshingBackups] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [restoringFile, setRestoringFile] = useState<string | null>(null)
  const [copiedPath, setCopiedPath] = useState(false)
  const [copiedFilename, setCopiedFilename] = useState<string | null>(null)

  // Client PC state
  const [clientServerUrl, setClientServerUrl] = useState("")
  const [clientDeviceName, setClientDeviceName] = useState("")
  const [clientPairingCode, setClientPairingCode] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null)
  const [clientState, setClientState] = useState<ServerConnectionState>(apiClient.getState())
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0)

  // Load configuration & status
  const refreshStatus = async () => {
    try {
      const res = await fetch("/api/server/status")
      const data = await res.json()
      if (data.success) {
        setStatusData(data)
        setMode(data.mode || "server")
      }
    } catch {
      // Ignored
    }
  }

  const loadDevices = async () => {
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      if (!activeToken) return
      const res = await fetch("/api/server/devices", {
        headers: { Authorization: `Bearer ${activeToken}` }
      })
      const data = await res.json()
      if (data.success) setDevices(data.devices || [])
    } catch {}
  }

  const loadBackups = async () => {
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      const headers: Record<string, string> = {}
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`
      const res = await fetch("/api/server/backups", { headers })
      const data = await res.json()
      if (data.success) {
        setBackups(data.backups || [])
        if (data.backupDir) setBackupDir(data.backupDir)
      }
    } catch {}
  }

  useEffect(() => {
    void refreshStatus()
    void loadDevices()
    void loadBackups()

    const unsubClient = apiClient.subscribe(setClientState)
    const unsubQueue = offlineQueue.subscribe((q) => setPendingQueueCount(q.length))

    if (typeof window !== "undefined") {
      setClientServerUrl(localStorage.getItem("sky_server_url") || "")
      setClientDeviceName(localStorage.getItem("sky_device_name") || "Office PC")
    }

    return () => {
      unsubClient()
      unsubQueue()
    }
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // Mode switch
  const handleModeSwitch = async (newMode: "server" | "client") => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/server/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      })
      const data = await res.json()
      if (data.success) {
        setMode(newMode)
        setSuccessMsg(`Switched to ${newMode === "server" ? "Main Server PC" : "Client PC"} mode.`)
        await refreshStatus()
      } else {
        setErrorMsg(data.error || "Failed to switch mode")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to switch mode")
    } finally {
      setLoading(false)
    }
  }

  // Server Admin Setup
  const handleAdminSetup = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/server/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg("Administrator account configured successfully.")
        setAdminSetupOpen(false)
        await refreshStatus()
      } else {
        setErrorMsg(data.error || "Failed to setup admin")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Admin setup error")
    } finally {
      setLoading(false)
    }
  }

  // Generate Pairing Code
  const handleGeneratePairingCode = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/server/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", role: pairingRole }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedCode(data)
      } else {
        setErrorMsg(data.error || "Failed to generate pairing code")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate pairing code")
    } finally {
      setLoading(false)
    }
  }

  // Device Revoke/Block
  const handleDeviceAction = async (deviceId: string, action: "revoke" | "block" | "unrevoke" | "delete") => {
    try {
      const res = await fetch("/api/server/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, deviceId }),
      })
      const data = await res.json()
      if (data.success) {
        await loadDevices()
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Device action failed")
    }
  }

  // Create Backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      const headers: Record<string, string> = {}
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`
      const res = await fetch("/api/server/backups", { method: "POST", headers })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Backup created: ${data.backup?.filename || "Server snapshot archive ready"}`)
        await loadBackups()
      } else {
        setErrorMsg(data.error || "Backup failed")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Backup failed")
    } finally {
      setIsCreatingBackup(false)
      setLoading(false)
    }
  }

  // Restore Backup
  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore ${filename}? A pre-restore snapshot will be created automatically.`)) {
      return
    }
    setRestoringFile(filename)
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`
      const res = await fetch("/api/server/backups", {
        method: "PUT",
        headers,
        body: JSON.stringify({ filename }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Database restored successfully from ${filename}`)
        await refreshStatus()
      } else {
        setErrorMsg(data.error || "Restore failed")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Restore failed")
    } finally {
      setRestoringFile(null)
      setLoading(false)
    }
  }

  // Migrate Data
  const handleMigrateData = async () => {
    if (!window.confirm("Migrate existing local records into the server database? A backup will be preserved automatically.")) {
      return
    }
    setIsMigrating(true)
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      const headers: Record<string, string> = {}
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`
      const res = await fetch("/api/server/migrate", { method: "POST", headers })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Migration complete! Migrated: ${data.counts?.bols ?? 0} BOLs, ${data.counts?.invoices ?? 0} invoices, ${data.counts?.ledgerAccounts ?? 0} ledger accounts.`)
        await refreshStatus()
        await loadBackups()
      } else {
        setErrorMsg(data.error || "Migration failed")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Migration failed")
    } finally {
      setIsMigrating(false)
      setLoading(false)
    }
  }

  // Delete Backup
  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${filename}?`)) {
      return
    }
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const activeToken = typeof window !== "undefined" ? localStorage.getItem("sky_server_token") : null
      const headers: Record<string, string> = {}
      if (activeToken) headers["Authorization"] = `Bearer ${activeToken}`
      const res = await fetch(`/api/server/backups?filename=${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers,
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Backup archive ${filename} permanently deleted.`)
        await loadBackups()
      } else {
        setErrorMsg(data.error || "Failed to delete backup")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete backup")
    } finally {
      setLoading(false)
    }
  }

  // Refresh Backups list
  const handleRefreshBackups = async () => {
    setIsRefreshingBackups(true)
    try {
      await loadBackups()
    } finally {
      setTimeout(() => setIsRefreshingBackups(false), 500)
    }
  }

  // Copy directory path
  const handleCopyPath = (pathText: string) => {
    navigator.clipboard.writeText(pathText)
    setCopiedPath(true)
    setTimeout(() => setCopiedPath(false), 2000)
  }

  // Open directory in native explorer
  const handleOpenFolder = (dirPath: string) => {
    const skyDesktop = typeof window !== "undefined" ? (window as any).skyDesktop : null
    if (skyDesktop?.openFile) {
      skyDesktop.openFile(dirPath)
    } else if (skyDesktop?.revealFile) {
      skyDesktop.revealFile(dirPath)
    } else if (skyDesktop?.openUpdateFolder) {
      skyDesktop.openUpdateFolder(dirPath)
    } else {
      handleCopyPath(dirPath)
      setSuccessMsg(`Backup storage directory copied to clipboard: ${dirPath}`)
    }
  }

  // Reveal specific backup file in native explorer
  const handleRevealBackup = (targetFile: string) => {
    const skyDesktop = typeof window !== "undefined" ? (window as any).skyDesktop : null
    const baseDir = backupDir.endsWith("\\") || backupDir.endsWith("/") ? backupDir : `${backupDir}\\`
    const fullPath = targetFile.includes(":\\") || targetFile.startsWith("/")
      ? targetFile
      : `${baseDir}${targetFile}`
    if (skyDesktop?.revealFile) {
      skyDesktop.revealFile(fullPath)
    } else if (skyDesktop?.openFile) {
      skyDesktop.openFile(fullPath)
    } else {
      navigator.clipboard.writeText(fullPath)
      setSuccessMsg(`File path copied: ${fullPath}`)
    }
  }

  // Download backup archive
  const handleDownloadBackup = (filename: string) => {
    const link = document.createElement("a")
    link.href = `/api/server/backups?download=${encodeURIComponent(filename)}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Copy filename
  const handleCopyFilename = (filename: string) => {
    navigator.clipboard.writeText(filename)
    setCopiedFilename(filename)
    setTimeout(() => setCopiedFilename(null), 2000)
  }

  // Format bytes to KB / MB
  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 KB"
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Client Test Connection
  const handleTestClientConnection = async () => {
    if (!clientServerUrl) return
    setLoading(true)
    setTestResult(null)
    try {
      const result = await apiClient.testServerUrl(clientServerUrl)
      setTestResult(result)
    } finally {
      setLoading(false)
    }
  }

  // Client Pair
  const handleClientPair = async () => {
    if (!clientServerUrl || !clientPairingCode || !clientDeviceName) {
      setErrorMsg("Please fill in Server URL, Device Name, and Pairing Code.")
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      localStorage.setItem("sky_device_name", clientDeviceName)
      await apiClient.pair(clientServerUrl, clientPairingCode, clientDeviceName)
      setSuccessMsg("Paired successfully with Main Server PC!")
      await apiClient.checkConnection()
    } catch (err: any) {
      setErrorMsg(err.message || "Pairing failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-blue-50 mt-0.5 sm:mt-0">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sans text-base font-black text-slate-900 tracking-tight">
                  Office LAN Server & Client Architecture
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    mode === "server"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  )}
                >
                  {mode === "server" ? "Server Host Active" : "Client Workstation"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Run one Main PC as the central server and connect other PCs securely over the local network.
              </p>
              <span className="text-[11px] text-slate-400 font-[vazirmatn] block mt-0.5" dir="rtl">
                معماری سرور مرکزی و کلاینت‌های شبکه محلی اداری
              </span>
            </div>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200/90 p-1 bg-slate-100/90 shadow-inner self-start md:self-center">
            <button
              type="button"
              onClick={() => handleModeSwitch("server")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                mode === "server"
                  ? "bg-white shadow-xs text-blue-700 font-black ring-1 ring-slate-950/5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              )}
            >
              <Server className="h-3.5 w-3.5 text-blue-600" />
              Main Server PC
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("client")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                mode === "client"
                  ? "bg-white shadow-xs text-indigo-700 font-black ring-1 ring-slate-950/5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              )}
            >
              <Laptop className="h-3.5 w-3.5 text-indigo-600" />
              Client PC
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SERVER PC VIEW */}
      {mode === "server" && (
        <div className="space-y-6">
          {/* Server Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Server Address */}
            <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-slate-50/80 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/90 text-blue-700 flex items-center justify-center border border-blue-200/80 shadow-2xs">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">Server Address (Local LAN)</span>
                      <span className="font-[vazirmatn] text-[10px] text-slate-400 block" dir="rtl">آدرس شبکه محلی سرور</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/90 text-blue-800 border border-blue-200 font-mono">
                    Port 8000
                  </span>
                </div>

                <div className="mt-2.5 p-2 rounded-xl bg-white border border-blue-200/80 shadow-2xs flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-black text-blue-950 tracking-tight truncate">
                    {statusData?.serverUrl || "http://127.0.0.1:8000"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs font-bold text-blue-700 hover:bg-blue-50 shrink-0 gap-1 rounded-lg cursor-pointer"
                    onClick={() => copyToClipboard(statusData?.serverUrl || "http://127.0.0.1:8000", "serverUrl")}
                  >
                    {copied === "serverUrl" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-[11px] text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-blue-100/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Provide this address to Client PCs</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LAN Active
                </span>
              </div>
            </div>

            {/* Card 2: Central Data Directory */}
            <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/80 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">Central Data Directory</span>
                      <span className="font-[vazirmatn] text-[10px] text-slate-400 block" dir="rtl">مسیر ذخیره‌سازی مرکزی پایگاه داده</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                    Direct SQLite
                  </span>
                </div>

                <div className="mt-2.5 p-2 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
                  <div className="font-mono text-xs font-bold text-slate-800 truncate" title="C:\ProgramData\SkyArianaBOL\">
                    C:\ProgramData\SkyArianaBOL\
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-emerald-100/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> No Windows file share needed
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Zero Lock Risk
                </span>
              </div>
            </div>

            {/* Card 3: Connected Devices */}
            <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/80 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100/90 text-indigo-700 flex items-center justify-center border border-indigo-200/80 shadow-2xs">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">Connected Devices</span>
                      <span className="font-[vazirmatn] text-[10px] text-slate-400 block" dir="rtl">دستگاه‌های متصل و کلاینت‌ها</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 border border-indigo-200">
                    Active Mesh
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950 tracking-tight">{devices.length}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Workstations</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-indigo-100/80 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {devices.filter((d) => !d.revoked).length} Active trusted sessions
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {devices.filter((d) => d.revoked).length} revoked
                </span>
              </div>
            </div>
          </div>

          {/* Initial Admin Setup Prompt if not configured */}
          {!statusData?.adminConfigured && (
            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 p-5 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs shrink-0 mt-0.5">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-sans text-sm font-black text-slate-900 tracking-tight">
                      Set Up Central Server Administrator
                    </h4>
                    <Badge variant="outline" className="bg-amber-100/80 text-amber-800 border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Security Recommended
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Protect pairing code generation and database management by configuring an administrator password.
                  </p>
                  <span className="text-[11px] text-slate-400 font-[vazirmatn] block mt-0.5" dir="rtl">
                    پیکربندی حساب مدیر کل جهت حفاظت از کدهای جفت‌سازی و مدیریت پایگاه داده
                  </span>

                  {adminSetupOpen ? (
                    <div className="mt-3.5 flex flex-wrap gap-3 items-end p-3.5 bg-white/90 border border-amber-200/80 rounded-xl shadow-2xs">
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Username</Label>
                        <Input
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          className="h-9 text-xs w-36 mt-1 bg-white rounded-xl border-slate-300"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-slate-700">Password (min 8 chars)</Label>
                        <Input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="h-9 text-xs w-48 mt-1 bg-white rounded-xl border-slate-300"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAdminSetup}
                        disabled={loading}
                        className="h-9 px-4 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white cursor-pointer shadow-2xs"
                      >
                        Save Admin Account
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdminSetupOpen(false)}
                        className="h-9 text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setAdminSetupOpen(true)}
                      className="mt-3 h-8.5 px-3.5 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-2xs cursor-pointer"
                    >
                      Configure Admin Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pairing Code Generator */}
          <Card className="border border-slate-200/90 bg-white rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
            <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-blue-50 mt-0.5 sm:mt-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-sans text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        Device Pairing & Access Control
                      </h3>
                      <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        15-Min TTL
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Generate secure, one-time 15-minute pairing codes for new Client PCs.
                    </p>
                    <span className="text-[11px] text-slate-400 font-[vazirmatn] block mt-0.5" dir="rtl">
                      جفت‌سازی دستگاه‌ها، صدور کدهای امنیتی موقت و کنترل دسترسی کلاینت‌ها
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-end justify-between gap-3.5">
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    Authorized Workstation Role
                  </Label>
                  <select
                    value={pairingRole}
                    onChange={(e) => setPairingRole(e.target.value)}
                    className="h-9 text-xs rounded-xl border border-slate-300 bg-white px-3 font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full outline-none transition-all cursor-pointer"
                  >
                    <option value="accounting">Accounting (Ledger & Invoices)</option>
                    <option value="operations">Operations (BOL & Cargo)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={handleGeneratePairingCode}
                    disabled={loading}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xs gap-1.5 transition-all cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Generate Pairing Code
                  </Button>
                </div>
              </div>

              {generatedCode && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-blue-900 uppercase tracking-wide">
                        One-Time Pairing Code
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200 capitalize">
                        Role: {generatedCode.role || pairingRole}
                      </span>
                    </div>
                    <div className="font-mono text-2xl font-black tracking-widest text-blue-950 bg-white border border-blue-200/80 px-3 py-1 rounded-lg inline-block shadow-inner">
                      {generatedCode.code}
                    </div>
                    <div className="text-[11px] text-blue-600 flex items-center gap-1 font-medium">
                      <Clock className="h-3 w-3" />
                      Expires at {new Date(generatedCode.expiresAt).toLocaleTimeString()} (Valid for 15 minutes)
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCode.code, "pairCode")}
                    className="gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-800 font-bold h-9 px-3.5 rounded-xl shadow-2xs cursor-pointer"
                  >
                    {copied === "pairCode" ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Devices Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Registered Client Devices</span>
                    <Badge variant="outline" className="text-[10px] font-bold ml-1 bg-slate-50 border-slate-200">
                      {devices.length} Total
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Workstations authorized to connect to this server
                  </span>
                </div>

                {devices.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-blue-600 mx-auto flex items-center justify-center shadow-2xs mb-3">
                      <Laptop className="h-6 w-6" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800">No Client Devices Registered Yet</h4>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      Pair other computers on your office network to allow multi-user operations. Select a role above and click <span className="font-semibold text-slate-700">"Generate Pairing Code"</span>.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-600 font-medium">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">1. Generate Code</span>
                      <span className="text-slate-400">→</span>
                      <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">2. Open Client PC Settings</span>
                      <span className="text-slate-400">→</span>
                      <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">3. Enter Server URL & Code</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-black">
                        <tr>
                          <th className="p-3">Device Name</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {devices.map((device) => (
                          <tr key={device.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-slate-900">{device.name}</td>
                            <td className="p-3 capitalize">
                              <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 border-slate-200">
                                {device.role}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">{device.ip}</td>
                            <td className="p-3">
                              {device.revoked ? (
                                <Badge variant="destructive" className="text-[10px] font-bold">Revoked</Badge>
                              ) : device.blocked ? (
                                <Badge variant="destructive" className="text-[10px] font-bold">Blocked</Badge>
                              ) : (
                                <Badge className="bg-emerald-600 text-[10px] font-bold">Trusted</Badge>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {!device.revoked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg cursor-pointer"
                                  onClick={() => handleDeviceAction(device.id, "revoke")}
                                >
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-lg cursor-pointer"
                                  onClick={() => handleDeviceAction(device.id, "unrevoke")}
                                >
                                  Unrevoke
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Central Backups & Migration */}
          <Card className="border border-slate-200/90 bg-white rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
            <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-blue-50 mt-0.5 sm:mt-0">
                    <HardDrive className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-sans text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        Server Database Backups & Migration
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50/80 text-blue-700 border-blue-200/80 px-2 py-0.5 rounded-full">
                        {backups.length} {backups.length === 1 ? "Archive" : "Archives"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Automated & on-demand ZIP snapshots with instant rollback protection
                    </p>
                    <span className="text-[11px] text-slate-400 font-[vazirmatn] block mt-0.5" dir="rtl">
                      نسخه‌های پشتیبان سرور، بازیابی و مهاجرت اطلاعات محلی
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleRefreshBackups()}
                    disabled={loading || isRefreshingBackups}
                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs font-semibold gap-1.5 cursor-pointer"
                    title="Refresh backups archive list"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-slate-500", isRefreshingBackups && "animate-spin text-blue-600")} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleMigrateData}
                    disabled={loading || isMigrating}
                    className="h-8 px-3 text-xs font-semibold text-slate-700 hover:text-blue-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors shadow-2xs gap-1.5 cursor-pointer"
                    title="Migrate existing local JSON records into central server database"
                  >
                    {isMigrating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    <span>{isMigrating ? "Migrating..." : "Migrate Existing Local Data"}</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateBackup}
                    disabled={loading || isCreatingBackup}
                    className="h-8 px-3.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xs transition-all gap-1.5 cursor-pointer"
                    title="Create an immediate ZIP archive of the server database"
                  >
                    {isCreatingBackup ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>{isCreatingBackup ? "Backing up..." : "Backup Now"}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Directory Path Pill */}
              <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <FolderArchive className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Storage Vault Path
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">• Local Archive Vault</span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-slate-800 truncate select-all">
                      {backupDir || "C:\\ProgramData\\SkyArianaBOL\\backups\\"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPath(backupDir || "C:\\ProgramData\\SkyArianaBOL\\backups\\")}
                    className="h-7 px-2.5 text-[11px] font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer"
                    title="Copy directory path to clipboard"
                  >
                    {copiedPath ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-500" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenFolder(backupDir || "C:\\ProgramData\\SkyArianaBOL\\backups\\")}
                    className="h-7 px-2.5 text-[11px] font-semibold bg-white border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-blue-50/50 gap-1.5 shadow-2xs cursor-pointer"
                    title="Open backup folder in Windows Explorer"
                  >
                    <FolderOpen className="h-3 w-3 text-blue-600" />
                    <span>Open Folder</span>
                  </Button>
                </div>
              </div>

              {/* Backups Empty State or List */}
              {backups.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/30 rounded-2xl p-7 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                    <HardDrive className="h-7 w-7 text-blue-600" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="font-sans text-sm sm:text-base font-black text-slate-800 tracking-tight">
                      No Server Backups Created Yet
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Create a point-in-time snapshot of the central database before client sync operations, software updates, or data migration.
                    </p>
                    <span className="text-[11px] text-slate-400 font-[vazirmatn] block pt-0.5" dir="rtl">
                      هنوز هیچ نسخه پشتیبانی از پایگاه داده مرکزی در این پوشه ذخیره نشده است
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={loading || isCreatingBackup}
                    className="mt-1 h-9 px-4 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs gap-2 cursor-pointer"
                  >
                    {isCreatingBackup ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{isCreatingBackup ? "Creating Archive..." : "Create First Backup"}</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {backups.map((b) => (
                    <div
                      key={b.filename}
                      className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 hover:border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                          <Archive className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="font-mono font-bold text-slate-800 text-xs truncate select-all flex items-center gap-2">
                            <span>{b.filename}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyFilename(b.filename)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              title="Copy filename"
                            >
                              {copiedFilename === b.filename ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 bg-slate-200/70 text-slate-700 border-0">
                              {formatSize(b.sizeBytes)}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(b.createdAt).toLocaleString()}
                            </span>
                            {b.manifest?.recordCounts && (
                              <span className="text-[10px] text-slate-400 hidden md:inline">
                                ({b.manifest.recordCounts.bols ?? 0} BOLs, {b.manifest.recordCounts.invoices ?? 0} Invoices)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevealBackup(b.filePath || b.filename)}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                          title="Reveal file in Windows Explorer"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadBackup(b.filename)}
                          className="h-7 px-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                          title="Download backup archive"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreBackup(b.filename)}
                          disabled={loading || restoringFile === b.filename}
                          className="h-7 px-2.5 text-xs font-bold text-amber-700 hover:text-amber-900 border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 shadow-2xs gap-1.5 cursor-pointer"
                          title="Restore database from this archive"
                        >
                          {restoringFile === b.filename ? (
                            <Loader2 className="h-3 w-3 animate-spin text-amber-700" />
                          ) : (
                            <RotateCcw className="h-3 w-3 text-amber-700" />
                          )}
                          <span>{restoringFile === b.filename ? "Restoring..." : "Restore"}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBackup(b.filename)}
                          disabled={loading}
                          className="h-7 px-2 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                          title="Delete backup archive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CLIENT PC VIEW */}
      {mode === "client" && (
        <Card className="border border-slate-200/90 bg-white rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
          <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-4 ring-indigo-50 mt-0.5 sm:mt-0">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-sans text-sm sm:text-base font-black text-slate-900 tracking-tight">
                      Connect to Main Sky Ariana Server
                    </h3>
                    <Badge variant="outline" className="bg-indigo-50/80 text-indigo-700 border-indigo-200 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      Client Mesh
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Connect this workstation to the central Sky Ariana Server PC over the local network.
                  </p>
                  <span className="text-[11px] text-slate-400 font-[vazirmatn] block mt-0.5" dir="rtl">
                    اتصال این ایستگاه کاری به سرور مرکزی اسکای آریانا از طریق شبکه محلی
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-blue-600" />
                  Server URL (e.g. http://192.168.1.50:8000)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="http://192.168.1.50:8000"
                    value={clientServerUrl}
                    onChange={(e) => setClientServerUrl(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl border-slate-300 bg-slate-50/60 focus:bg-white"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestClientConnection}
                    disabled={loading || !clientServerUrl}
                    className="h-9 px-3 text-xs font-bold rounded-xl border-slate-300 hover:bg-slate-50 shrink-0 gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Radio className="h-3.5 w-3.5 text-blue-600" />
                    Test Ping
                  </Button>
                </div>
                {testResult && (
                  <div className={cn(
                    "text-[11px] mt-1.5 flex items-center gap-1.5 font-semibold p-2 rounded-lg border",
                    testResult.success
                      ? "text-emerald-700 bg-emerald-50/80 border-emerald-200"
                      : "text-rose-700 bg-rose-50/80 border-rose-200"
                  )}>
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Central server responding with latency: <strong className="font-mono">{testResult.latencyMs}ms</strong></span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>{testResult.error || "Connection failed. Verify server PC is running on this LAN."}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-indigo-600" />
                  Workstation Name
                </Label>
                <Input
                  placeholder="e.g. Accounting PC 2"
                  value={clientDeviceName}
                  onChange={(e) => setClientDeviceName(e.target.value)}
                  className="h-9 text-xs rounded-xl border-slate-300 bg-slate-50/60 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                Pairing Code (Obtain from Main Server PC)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="SKY-XXXX-XXXX"
                  value={clientPairingCode}
                  onChange={(e) => setClientPairingCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs font-mono uppercase tracking-widest max-w-sm rounded-xl border-slate-300 bg-slate-50/60 focus:bg-white font-bold"
                />
                <Button
                  size="sm"
                  onClick={handleClientPair}
                  disabled={loading || !clientPairingCode || !clientServerUrl}
                  className="h-9 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xs gap-1.5 cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Pair & Connect
                </Button>
              </div>
            </div>

            {/* Client Status Indicator */}
            <div className="mt-4 p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs",
                  clientState.status === "connected" ? "bg-emerald-500 animate-pulse" :
                  clientState.status === "reconnecting" ? "bg-amber-500 animate-pulse" :
                  "bg-rose-500"
                )} />
                <div>
                  <div className="text-xs font-black capitalize text-slate-800 flex items-center gap-2">
                    <span>Workstation Status: {clientState.status}</span>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase",
                      clientState.status === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      clientState.status === "reconnecting" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {clientState.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {clientState.latencyMs ? `Latency: ${clientState.latencyMs}ms` : "Offline queue active"}
                    {pendingQueueCount > 0 ? ` • ${pendingQueueCount} pending changes queued` : ""}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => apiClient.checkConnection()}
                  className="h-8 text-xs font-semibold gap-1.5 rounded-lg bg-white border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-600" /> Check Now
                </Button>
                {clientState.status !== "unconfigured" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => apiClient.clearCredentials()}
                    className="h-8 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
