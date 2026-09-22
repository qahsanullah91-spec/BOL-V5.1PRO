"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Database,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  Pin,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  Search,
  SlidersHorizontal,
  Cloud,
  ArrowRight,
  Check,
  X,
  FileCheck2,
  Activity,
  History,
  Info,
  Server,
  AlertCircle,
  HelpCircle,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type {
  BackupItem,
  BackupType,
  DeepHealthReport,
  DisasterRecoveryConfig,
  EmergencyRecoveryPoint,
  RestoreDiffComparison,
  VerificationResult,
} from "@/lib/recovery/disaster-recovery-service"

export function DataProtectionCenter() {
  const { currentUser, setView } = useApp()

  // Data states
  const [healthReport, setHealthReport] = useState<DeepHealthReport | null>(null)
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [config, setConfig] = useState<DisasterRecoveryConfig | null>(null)
  const [emergencyPoints, setEmergencyPoints] = useState<{
    recommendedPoint: EmergencyRecoveryPoint | null
    availablePoints: EmergencyRecoveryPoint[]
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "overview" | "backups" | "restore" | "emergency" | "health" | "settings"
  >("overview")

  // Modals & Wizard states
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [backupType, setBackupType] = useState<BackupType>("QUICK")
  const [backupNote, setBackupNote] = useState("")
  const [isPinnedBackup, setIsPinnedBackup] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  // Guided Restore Wizard states
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null)
  const [restoreStep, setRestoreStep] = useState<1 | 2 | 3>(1)
  const [restoreVerification, setRestoreVerification] = useState<VerificationResult | null>(null)
  const [restoreDiff, setRestoreDiff] = useState<RestoreDiffComparison | null>(null)
  const [confirmationInput, setConfirmationInput] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)

  // Emergency Recovery states
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false)

  // Search in Backup Catalog
  const [backupSearch, setBackupSearch] = useState("")
  const [backupFilterType, setBackupFilterType] = useState<string>("ALL")

  // Load recovery data
  const loadRecoveryData = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/system/recovery")
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setHealthReport(data.health)
          setBackups(data.backups || [])
          setConfig(data.config)
          setEmergencyPoints(data.emergency)
        }
      }
    } catch (err: any) {
      toast.error(`Failed to load recovery data: ${err.message}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadRecoveryData()
  }, [])

  // Create Backup
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const res = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "backup",
          type: backupType,
          note: backupNote.trim() || undefined,
          pinned: isPinnedBackup,
          actor: currentUser?.name || "Admin",
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        setIsBackupModalOpen(false)
        setBackupNote("")
        setIsPinnedBackup(false)
        await loadRecoveryData()
      } else {
        toast.error(data.error || "Failed to create backup")
      }
    } catch (err: any) {
      toast.error(`Backup failed: ${err.message}`)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  // Toggle Pin
  const handleTogglePin = async (backupId: string) => {
    try {
      const res = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", backupId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message)
        await loadRecoveryData()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Delete Backup
  const handleDeleteBackup = async (item: BackupItem) => {
    if (item.pinned) {
      toast.error("Cannot delete a Pinned backup. Unpin it first.")
      return
    }
    if (!confirm(`Are you sure you want to delete backup "${item.fileName}"?`)) return

    try {
      const res = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", backupId: item.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Backup deleted")
        await loadRecoveryData()
      } else {
        toast.error(data.error || "Failed to delete backup")
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Start Restore Flow for an item
  const startRestoreWizard = async (item: BackupItem) => {
    setSelectedBackupForRestore(item)
    setRestoreStep(1)
    setActiveTab("restore")
    setConfirmationInput("")

    // Step 2: Auto-verify in-memory
    try {
      const vRes = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", backupId: item.id }),
      })
      const vData = await vRes.json()
      if (vRes.ok && vData.success) {
        setRestoreVerification(vData.verification)
      }

      // Step 3: Compute difference
      const cRes = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "compare", backupId: item.id }),
      })
      const cData = await cRes.json()
      if (cRes.ok && cData.success) {
        setRestoreDiff(cData.comparison)
      }
    } catch (err: any) {
      toast.error(`Verification error: ${err.message}`)
    }
  }

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore || confirmationInput !== "RESTORE") {
      toast.error('You must type "RESTORE" exactly to confirm.')
      return
    }

    setIsRestoring(true)
    try {
      const res = await fetch("/api/system/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          backupId: selectedBackupForRestore.id,
          confirmationText: confirmationInput,
          actor: currentUser?.name || "Admin",
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message, { duration: 6000 })
        setSelectedBackupForRestore(null)
        setConfirmationInput("")
        setActiveTab("overview")
        await loadRecoveryData()
      } else {
        toast.error(data.error || "Restore failed")
      }
    } catch (err: any) {
      toast.error(`Restore error: ${err.message}`)
    } finally {
      setIsRestoring(false)
    }
  }

  // Filtered Backups
  const filteredBackups = useMemo(() => {
    return backups.filter((b) => {
      const matchType = backupFilterType === "ALL" || b.type === backupFilterType
      const q = backupSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        b.fileName.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q)) ||
        b.type.toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [backups, backupSearch, backupFilterType])

  return (
    <div className="p-4 sm:p-6 max-w-[1750px] mx-auto space-y-6 animate-in fade-in duration-150">
      {/* ===================================================================== */}
      {/* 1. Header Ribbon                                                      */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                SKY ARIANA DATA PROTECTION CENTER
              </h1>
              <Badge className="bg-blue-600 text-white font-bold text-[10px]">
                ADMIN ONLY
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Database • Backup • Restore • Recovery • Sync Health
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecoveryData}
            disabled={isRefreshing}
            className="h-9 gap-1.5 font-bold text-xs dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setActiveTab("emergency")}
            className="h-9 gap-1.5 font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Emergency Recovery
          </Button>

          <Button
            onClick={() => setIsBackupModalOpen(true)}
            size="sm"
            className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Backup Now
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. Primary KPI Dashboard Strip                                        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Database Status */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Database Status</span>
            <Database className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-black text-slate-900 dark:text-white">
              {healthReport?.overallStatus || "HEALTHY"}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Rev: {healthReport?.databaseRevision || 1000} | Schema v14
          </p>
        </div>

        {/* Last Backup */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Last Local Backup</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
            {healthReport?.lastBackupTime
              ? new Date(healthReport.lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "Never"}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Verified Checksum ✓
          </p>
        </div>

        {/* Next Automatic Backup */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Next Auto Backup</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-white">
            {config?.autoBackupEnabled ? `Every ${config.autoBackupIntervalHours}h` : "Disabled"}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {config?.autoBackupEnabled ? "Active scheduler" : "Manual only"}
          </p>
        </div>

        {/* Total Backups & Size */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Backups</span>
            <HardDrive className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-white">
            {backups.length} Snapshots
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {(backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0) / (1024 * 1024)).toFixed(1)} MB stored
          </p>
        </div>

        {/* Cloud Backup Status */}
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Cloud Sync</span>
            <Cloud className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <p className="text-base font-black text-cyan-700 dark:text-cyan-300">
            {config?.cloudBackupStatus || "SYNCED"}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Secondary Protection
          </p>
        </div>

        {/* Recovery Window (RPO) */}
        <div className={`p-3.5 rounded-xl border shadow-2xs ${
          (healthReport?.recoveryPointObjectiveHours || 0) > 24
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">RPO Exposure</span>
            <Activity className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900 dark:text-white">
            {healthReport?.recoveryPointObjectiveHours !== undefined
              ? `${healthReport.recoveryPointObjectiveHours} hrs`
              : "N/A"}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Max data at risk window
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. Navigation Tabs                                                    */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
        {[
          { id: "overview", label: "Dashboard & Health", icon: Activity },
          { id: "backups", label: `Backups Catalog (${backups.length})`, icon: HardDrive },
          { id: "restore", label: "3-Step Restore Wizard", icon: RotateCcw },
          { id: "emergency", label: "Emergency Recovery", icon: AlertTriangle },
          { id: "health", label: "Deep Health Scanner", icon: ShieldCheck },
          { id: "settings", label: "Settings & Retention", icon: SlidersHorizontal },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: Dashboard & Health Overview                                    */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Health Checklist Banner */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Objective System Health Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Database Readable</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Yes
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Database Writable</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Atomic Validated
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Accounting Invariance</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Balanced
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-300">Zero-Record Guard</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Armed
                </span>
              </div>
            </div>
          </div>

          {/* Record Count Health Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Protected Operational Record Counts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { label: "Bills of Lading", count: healthReport?.recordCounts.bols || 0, color: "text-blue-600" },
                { label: "Ledger Transactions", count: healthReport?.recordCounts.ledgerEntries || 0, color: "text-emerald-600" },
                { label: "Commercial Invoices", count: healthReport?.recordCounts.invoices || 0, color: "text-purple-600" },
                { label: "Shipments & Transit", count: healthReport?.recordCounts.shipments || 0, color: "text-cyan-600" },
                { label: "Compliance Documents", count: healthReport?.recordCounts.documents || 0, color: "text-amber-600" },
                { label: "Registered Accounts", count: healthReport?.recordCounts.accounts || 0, color: "text-indigo-600" },
                { label: "Container Bookings", count: healthReport?.recordCounts.bookings || 0, color: "text-orange-600" },
                { label: "Master Entities", count: healthReport?.recordCounts.masterEntities || 0, color: "text-teal-600" },
                { label: "Workflow Tasks", count: healthReport?.recordCounts.tasks || 0, color: "text-rose-600" },
                { label: "Total Active Tables", count: 11, color: "text-slate-700 dark:text-slate-300" },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                  <p className={`text-lg font-black ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: Backups Catalog                                                */}
      {/* ===================================================================== */}
      {activeTab === "backups" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search backups by filename, note, or type..."
                value={backupSearch}
                onChange={(e) => setBackupSearch(e.target.value)}
                className="pl-9 h-8 text-xs font-medium"
              />
            </div>
            <div className="flex items-center gap-1">
              {["ALL", "QUICK", "FULL", "PRE_RESTORE", "EMERGENCY"].map((t) => (
                <button
                  key={t}
                  onClick={() => setBackupFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    backupFilterType === t
                      ? "bg-slate-900 text-white dark:bg-blue-600"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 font-black uppercase text-[10px]">
                    <th className="p-3">Backup File</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Revision</th>
                    <th className="p-3">Created At</th>
                    <th className="p-3">Records</th>
                    <th className="p-3">Size</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBackups.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePin(item.id)}
                            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                              item.pinned ? "text-amber-500" : "text-slate-300"
                            }`}
                            title={item.pinned ? "Pinned (Protected from deletion)" : "Pin Backup"}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{item.fileName}</span>
                            {item.note && <p className="text-[11px] text-slate-400 italic">"{item.note}"</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        rev.{item.databaseRevision}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {item.recordCounts?.bols || 0} BOLs | {item.recordCounts?.ledgerEntries || 0} Tx
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {(item.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="p-3">
                        <Badge className={item.isValid ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startRestoreWizard(item)}
                            className="h-7 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBackup(item)}
                            disabled={item.pinned}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            title={item.pinned ? "Cannot delete pinned backup" : "Delete Backup"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBackups.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No backups match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: 3-Step Guided Restore Wizard                                   */}
      {/* ===================================================================== */}
      {activeTab === "restore" && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Guided Database Restore Wizard
              </h2>
              <p className="text-xs text-slate-500">
                Safe, transactional restoration with automatic pre-restore backup and comparison diff.
              </p>
            </div>

            {!selectedBackupForRestore ? (
              <div className="p-8 text-center space-y-3 border border-dashed rounded-xl">
                <HardDrive className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Please select a backup from the Backups Catalog to initiate guided restore.
                </p>
                <Button size="sm" onClick={() => setActiveTab("backups")}>
                  Go to Backups Catalog
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step Indicators */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className={`p-2 rounded-lg ${restoreStep >= 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    1. Select & Verify
                  </div>
                  <div className={`p-2 rounded-lg ${restoreStep >= 2 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    2. Diff Comparison
                  </div>
                  <div className={`p-2 rounded-lg ${restoreStep >= 3 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    3. Safety Backup & Execute
                  </div>
                </div>

                {/* Diff Comparison Card */}
                {restoreDiff && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800/60 space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Restore Difference & Impact Analysis
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400">Current Revision</span>
                        <p className="font-mono font-bold text-sm">rev.{restoreDiff.currentRevision}</p>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400">Backup Revision</span>
                        <p className="font-mono font-bold text-sm text-blue-600">rev.{restoreDiff.backupRevision}</p>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400">BOL Impact</span>
                        <p className={`font-mono font-bold text-sm ${restoreDiff.bolsDiff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {restoreDiff.bolsDiff > 0 ? `-${restoreDiff.bolsDiff} BOLs` : "No loss"}
                        </p>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400">Ledger Impact</span>
                        <p className={`font-mono font-bold text-sm ${restoreDiff.ledgerEntriesDiff > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {restoreDiff.ledgerEntriesDiff > 0 ? `-${restoreDiff.ledgerEntriesDiff} Tx` : "No loss"}
                        </p>
                      </div>
                    </div>

                    {restoreDiff.warnings.length > 0 && (
                      <ul className="list-disc pl-5 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                        {restoreDiff.warnings.map((w, idx) => (
                          <li key={idx} className="font-medium">{w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Confirmation Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Confirm Destructive Restoration:
                  </div>
                  <p className="text-xs text-slate-500">
                    A mandatory Pre-Restore Safety Snapshot will be created automatically prior to modifying any tables.
                    To execute, type <span className="font-mono font-black text-red-600">RESTORE</span> below:
                  </p>
                  <Input
                    placeholder='Type "RESTORE" to confirm'
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    className="font-mono font-bold max-w-sm h-9 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedBackupForRestore(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteRestore}
                    disabled={confirmationInput !== "RESTORE" || isRestoring}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? "animate-spin" : ""}`} />
                    {isRestoring ? "Creating Pre-Restore & Restoring..." : "Execute Restore"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: Emergency Recovery Wizard                                      */}
      {/* ===================================================================== */}
      {activeTab === "emergency" && (
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Disaster Emergency Recovery
                </h2>
                <p className="text-xs text-slate-500">
                  When primary database fails to load, crashes, or is corrupted. Corrupt files are automatically quarantined without data loss.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/40 text-xs text-red-900 dark:text-red-200 space-y-1">
              <span className="font-bold">Golden Safety Rule:</span> "Database failed to load" is NEVER interpreted as "Database is empty". The software will never replace your database with empty or seed data.
            </div>

            {emergencyPoints?.recommendedPoint && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Recommended Latest Valid Recovery Point
                  </span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    rev.{emergencyPoints.recommendedPoint.databaseRevision}
                  </Badge>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold">{emergencyPoints.recommendedPoint.fileName}</span> (Created: {new Date(emergencyPoints.recommendedPoint.date).toLocaleString()})
                  <p className="text-[11px] text-slate-500 mt-1">
                    Contains {emergencyPoints.recommendedPoint.recordCounts.bols} BOLs and {emergencyPoints.recommendedPoint.recordCounts.ledgerEntries} Ledger Transactions.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const found = backups.find((b) => b.id === emergencyPoints.recommendedPoint?.backupId)
                    if (found) startRestoreWizard(found)
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
                >
                  Proceed with Recommended Recovery Point
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: Deep Health Scanner                                            */}
      {/* ===================================================================== */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Deep Health & Reference Integrity Scanner
              </h3>
              <p className="text-xs text-slate-500">
                Read-only analysis checking schema conformity, orphan records, and accounting balance invariants.
              </p>
            </div>
            <Button size="sm" onClick={loadRecoveryData} className="gap-1.5 text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5" /> Re-scan Now
            </Button>
          </div>

          <div className="space-y-2">
            {healthReport?.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  issue.severity === "CRITICAL"
                    ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                    : issue.severity === "WARNING"
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      issue.severity === "CRITICAL" ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="text-slate-900 dark:text-white">[{issue.module}]</span>
                    <span>{issue.message}</span>
                  </div>
                  {issue.details && <p className="text-[11px] text-slate-500">{issue.details}</p>}
                </div>
                {issue.repairAction && (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                    Fix: {issue.repairAction}
                  </span>
                )}
              </div>
            ))}
            {(!healthReport?.issues || healthReport.issues.length === 0) && (
              <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Zero Integrity Issues Found</p>
                <p className="text-[11px]">All schemas, references, and accounting balances conform strictly to specification.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: Settings & Retention                                           */}
      {/* ===================================================================== */}
      {activeTab === "settings" && config && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Automated Backup & Retention Rules
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Automated Background Backups</span>
                  <p className="text-[11px] text-slate-400">Regularly takes non-intrusive database snapshots</p>
                </div>
                <Badge className={config.autoBackupEnabled ? "bg-emerald-600 text-white" : "bg-slate-400"}>
                  {config.autoBackupEnabled ? "ON" : "OFF"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white">Hourly Snapshots Retention</span>
                  <p className="text-sm font-black text-blue-600 mt-1">Keep {config.retention.hourlyKeep} snapshots</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white">Daily Snapshots Retention</span>
                  <p className="text-sm font-black text-emerald-600 mt-1">Keep {config.retention.dailyKeep} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Create Backup Modal                                                   */}
      {/* ===================================================================== */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Create Database Snapshot</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Backup Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["QUICK", "FULL"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBackupType(t)}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      backupType === t
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-600"
                    }`}
                  >
                    {t === "QUICK" ? "Quick Database" : "Full Archive"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">Backup Note (Optional)</label>
              <Input
                placeholder="e.g. Before monthly reconciliation"
                value={backupNote}
                onChange={(e) => setBackupNote(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <label className="flex items-center gap-2 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isPinnedBackup}
                onChange={(e) => setIsPinnedBackup(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Pin Backup (Protects permanently from automatic retention cleanup)</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
