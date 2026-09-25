"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ShieldCheck,
  Archive,
  Activity,
  RotateCcw,
  Wrench,
  Settings,
  Plus,
} from "lucide-react"

import { BackupDashboardCards } from "./backup-dashboard-cards"
import { BackupHistoryTable } from "./backup-history-table"
import { RestoreModalWizard } from "./restore-modal-wizard"
import { DatabaseHealthTab } from "./database-health-tab"
import { ImportRollbackTab } from "./import-rollback-tab"
import { RecoveryToolsTab } from "./recovery-tools-tab"
import { StorageSettingsTab } from "./storage-settings-tab"

import type {
  BackupItem,
  DeepHealthReport,
  DisasterRecoveryConfig,
  BackupType,
} from "@/lib/backup/backup-types"

export function BackupRecoveryView() {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [healthReport, setHealthReport] = useState<DeepHealthReport | null>(null)
  const [config, setConfig] = useState<DisasterRecoveryConfig | null>(null)
  const [stats, setStats] = useState({
    totalBackups: 0,
    verifiedBackups: 0,
    protectedBackups: 0,
    lastSuccessfulBackup: null as string | null,
    lastVerifiedTime: null as string | null,
    totalStorageBytes: 0,
    isLocked: false,
    lockedBy: undefined as string | undefined,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [drillingId, setDrillingId] = useState<string | null>(null)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newBackupType, setNewBackupType] = useState<BackupType>("FULL")
  const [newBackupNote, setNewBackupNote] = useState("")
  const [newBackupProtected, setNewBackupProtected] = useState(false)
  const [newBackupAttachments, setNewBackupAttachments] = useState(true)

  const [restoreModalBackup, setRestoreModalBackup] = useState<BackupItem | null>(null)

  // Load backups list
  const loadBackups = async () => {
    try {
      const res = await fetch("/api/backup")
      const data = await res.json()
      if (data.success) {
        setBackups(data.backups || [])
        if (data.stats) setStats(data.stats)
        if (data.config) setConfig(data.config)
      }
    } catch (err) {
      console.error("Failed to load backups:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load health report
  const loadHealthReport = async () => {
    setIsScanning(true)
    try {
      const res = await fetch("/api/backup/health")
      const data = await res.json()
      if (data.success && data.report) {
        setHealthReport(data.report)
      }
    } catch (err) {
      console.error("Failed to load health report:", err)
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    loadBackups()
    loadHealthReport()
  }, [])

  // Create new backup
  const handleCreateBackup = async () => {
    setIsCreating(true)
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newBackupType,
          note: newBackupNote,
          protected: newBackupProtected,
          includeAttachments: newBackupAttachments,
          actor: "Admin User",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIsCreateModalOpen(false)
        setNewBackupNote("")
        setNewBackupProtected(false)
        await loadBackups()
        await loadHealthReport()
      } else {
        alert(data.error || "Failed to create backup")
      }
    } catch (err: any) {
      alert(err?.message || "Failed to create backup")
    } finally {
      setIsCreating(false)
    }
  }

  // Verify single backup
  const handleVerify = async (backupId: string) => {
    setVerifyingId(backupId)
    try {
      const res = await fetch("/api/backup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      })
      const data = await res.json()
      if (data.success) {
        await loadBackups()
      } else {
        alert(data.error || "Verification failed")
      }
    } catch (err: any) {
      alert(err?.message || "Verification request failed")
    } finally {
      setVerifyingId(null)
    }
  }

  // Run test restore drill
  const handleTestRestore = async (backupId: string) => {
    setDrillingId(backupId)
    try {
      const res = await fetch("/api/backup/test-restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId }),
      })
      const data = await res.json()
      if (data.success) {
        const d = data.drillResult
        alert(
          `Drill Result for ${data.fileName}:\nPass: ${d.pass ? "YES (100% Balanced)" : "NO"}\nRecords: ${d.recordsVerified}\nTables: ${d.tablesVerified}\nInvariance: ${d.invarianceValid ? "BALANCED" : "DISCREPANCY"}`
        )
      } else {
        alert(data.error || "Drill failed")
      }
    } catch (err: any) {
      alert(err?.message || "Drill request failed")
    } finally {
      setDrillingId(null)
    }
  }

  // Toggle protection
  const handleToggleProtect = async (backupId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/backup/protect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId, protected: !currentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        await loadBackups()
      }
    } catch (err) {
      console.error("Failed to toggle protection:", err)
    }
  }

  // Delete backup
  const handleDelete = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup package? This action cannot be undone.")) return
    try {
      const res = await fetch(`/api/backup?id=${encodeURIComponent(backupId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        await loadBackups()
      } else {
        alert(data.error || "Failed to delete backup")
      }
    } catch (err: any) {
      alert(err?.message || "Delete request error")
    }
  }

  // Download backup
  const handleDownload = (backup: BackupItem) => {
    window.open(`/api/backup/download?id=${encodeURIComponent(backup.id)}`, "_blank")
  }

  return (
    <div className="space-y-3 w-full">
      {/* Top Health & Fast Metrics */}
      <BackupDashboardCards
        healthReport={healthReport}
        backups={backups}
        config={config}
        stats={stats}
        isScanning={isScanning}
        isCreating={isCreating}
        onTriggerScan={loadHealthReport}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onEmergencyExport={() => window.open("/api/backup/emergency-export", "_blank")}
      />

      {/* Tabs */}
      <Tabs defaultValue="archives" className="space-y-2.5">
        <TabsList className="h-9 p-1 bg-muted/80 backdrop-blur rounded-lg inline-flex items-center gap-1 border shadow-2xs">
          <TabsTrigger value="archives" className="h-7 px-3 text-xs gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Archive className="h-3.5 w-3.5" />
            Backup Archives ({backups.length})
          </TabsTrigger>
          <TabsTrigger value="health" className="h-7 px-3 text-xs gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Activity className="h-3.5 w-3.5" />
            Database Health & Audit
            {healthReport && healthReport.issues.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {healthReport.issues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rollback" className="h-7 px-3 text-xs gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Import Rollback
          </TabsTrigger>
          <TabsTrigger value="tools" className="h-7 px-3 text-xs gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Wrench className="h-3.5 w-3.5" />
            Drills & Recovery Tools
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-7 px-3 text-xs gap-1.5 font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Settings className="h-3.5 w-3.5" />
            Schedules & Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archives" className="space-y-2.5 outline-none">
          <BackupHistoryTable
            backups={backups}
            onVerify={handleVerify}
            onTestRestore={handleTestRestore}
            onOpenRestoreWizard={(b) => setRestoreModalBackup(b)}
            onToggleProtect={handleToggleProtect}
            onDelete={handleDelete}
            onDownload={handleDownload}
            verifyingId={verifyingId}
            drillingId={drillingId}
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <DatabaseHealthTab
            report={healthReport}
            isLoading={isScanning}
            onRefresh={loadHealthReport}
            onRepairComplete={async () => {
              await loadHealthReport()
              await loadBackups()
            }}
          />
        </TabsContent>

        <TabsContent value="rollback" className="space-y-4">
          <ImportRollbackTab
            onRollbackComplete={async () => {
              await loadBackups()
              await loadHealthReport()
            }}
          />
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <RecoveryToolsTab
            latestBackup={backups[0] || null}
            onRefreshBackups={loadBackups}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <StorageSettingsTab
            initialConfig={config}
            onConfigUpdated={(cfg) => setConfig(cfg)}
          />
        </TabsContent>
      </Tabs>

      {/* Create Backup Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Plus className="h-5 w-5 text-primary" />
              Create Verified System Backup
            </DialogTitle>
            <DialogDescription className="text-xs">
              Packages all 25+ database files, ledger accounts, and attachments into a standardized, verified ZIP archive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Backup Classification</label>
              <div className="grid grid-cols-2 gap-2">
                {(["FULL", "MANUAL", "PRE_MIGRATION", "EMERGENCY"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewBackupType(t)}
                    className={`p-2 rounded-lg border text-left text-xs ${
                      newBackupType === t ? "border-primary bg-primary/5 font-bold" : "border-border hover:bg-muted"
                    }`}
                  >
                    {t.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Archive Note / Description</label>
              <Input
                placeholder="e.g. Month-End audit milestone, pre-upgrade snapshot"
                value={newBackupNote}
                onChange={(e) => setNewBackupNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="protectedBackup"
                  checked={newBackupProtected}
                  onCheckedChange={(c) => setNewBackupProtected(Boolean(c))}
                />
                <label htmlFor="protectedBackup" className="cursor-pointer font-semibold">
                  Protect from automated retention pruning
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeAttachments"
                  checked={newBackupAttachments}
                  onCheckedChange={(c) => setNewBackupAttachments(Boolean(c))}
                />
                <label htmlFor="includeAttachments" className="cursor-pointer">
                  Include file uploads & documents in archive
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateBackup} disabled={isCreating} className="text-xs font-bold">
              {isCreating ? "Creating & Verifying..." : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safe Restore Wizard Modal */}
      <RestoreModalWizard
        isOpen={Boolean(restoreModalBackup)}
        onClose={() => setRestoreModalBackup(null)}
        backup={restoreModalBackup}
        onRestoreSuccess={async () => {
          await loadBackups()
          await loadHealthReport()
        }}
      />
    </div>
  )
}
