"use client"

import React, { useState } from "react"
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Trash2,
  FileCheck2,
  PlayCircle,
  Shield,
  FileArchive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { BackupItem, BackupType } from "@/lib/backup/backup-types"

interface BackupHistoryTableProps {
  backups: BackupItem[]
  onVerify: (backupId: string) => void
  onTestRestore: (backupId: string) => void
  onOpenRestoreWizard: (backup: BackupItem) => void
  onToggleProtect: (backupId: string, currentStatus: boolean) => void
  onDelete: (backupId: string) => void
  onDownload: (backup: BackupItem) => void
  verifyingId: string | null
  drillingId: string | null
}

export function BackupHistoryTable({
  backups,
  onVerify,
  onTestRestore,
  onOpenRestoreWizard,
  onToggleProtect,
  onDelete,
  onDownload,
  verifyingId,
  drillingId,
}: BackupHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("ALL")

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const filtered = backups.filter((b) => {
    const matchesSearch =
      b.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.createdBy.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === "ALL" || b.type === selectedType
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: BackupType) => {
    switch (type) {
      case "FULL":
        return <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[9px] px-1.5 py-0 font-bold">FULL</Badge>
      case "PRE_RESTORE":
      case "PRE_RESTORE_SAFETY":
        return <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-[9px] px-1.5 py-0 font-bold">PRE-RESTORE</Badge>
      case "PRE_REPAIR_SAFETY":
        return <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[9px] px-1.5 py-0 font-bold">PRE-REPAIR</Badge>
      case "PRE_IMPORT":
        return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] px-1.5 py-0 font-bold">PRE-IMPORT</Badge>
      case "EMERGENCY":
        return <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[9px] px-1.5 py-0 font-bold">EMERGENCY</Badge>
      default:
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold">{type}</Badge>
    }
  }

  return (
    <div className="bg-card border rounded-xl shadow-2xs overflow-hidden flex flex-col">
      {/* Search and Filters Bar */}
      <div className="p-2 sm:p-2.5 bg-muted/30 border-b flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by filename, note, user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-7.5 bg-background shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-0.5" />
          {(["ALL", "FULL", "PRE_RESTORE_SAFETY", "PRE_IMPORT", "MANUAL"] as const).map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="text-[11px] h-7 px-2.5 font-medium shadow-2xs"
            >
              {type === "PRE_RESTORE_SAFETY" ? "SAFETY" : type.replace(/_/g, " ")}
            </Button>
          ))}
          <span className="text-[10px] text-muted-foreground font-mono ml-1.5 whitespace-nowrap hidden lg:inline">
            ({filtered.length}/{backups.length})
          </span>
        </div>
      </div>

      {/* Backups Table with Sticky Header & Viewport-aware height */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-275px)] min-h-[380px] relative">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b text-muted-foreground font-semibold text-[11px] shadow-2xs">
            <tr>
              <th className="py-2 px-3 min-w-[260px] max-w-[340px]">Archive Package</th>
              <th className="py-2 px-2.5 w-[110px]">Type</th>
              <th className="py-2 px-2.5 w-[130px]">Created</th>
              <th className="py-2 px-2.5 w-[140px]">Records</th>
              <th className="py-2 px-2.5 w-[75px]">Size</th>
              <th className="py-2 px-2.5 w-[110px]">Verification</th>
              <th className="py-2 px-2 text-center w-[55px]">Locked</th>
              <th className="py-2 px-3 text-right w-[240px] min-w-[240px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <FileArchive className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No backup archives match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isVerifying = verifyingId === item.id
                const isDrilling = drillingId === item.id

                return (
                  <tr key={item.id} className="even:bg-muted/15 hover:bg-primary/5 transition-colors text-[11px]">
                    <td className="py-1.5 px-3 min-w-[260px] max-w-[340px]">
                      <div className="font-mono font-semibold text-foreground truncate" title={item.fileName}>
                        {item.fileName}
                      </div>
                      {item.note && (
                        <div className="text-[10px] text-muted-foreground truncate" title={item.note}>
                          {item.note}
                        </div>
                      )}
                    </td>

                    <td className="py-1.5 px-2.5 whitespace-nowrap">
                      {getTypeBadge(item.type)}
                    </td>

                    <td className="py-1.5 px-2.5 whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        by {item.createdBy}
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-foreground">
                          {item.recordCounts?.totalRecords || item.recordCounts?.bols || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          (B: {item.recordCounts?.bols || 0}, I: {item.recordCounts?.invoices || 0})
                        </span>
                      </div>
                    </td>

                    <td className="py-1.5 px-2.5 whitespace-nowrap font-mono text-muted-foreground">
                      {formatBytes(item.fileSizeBytes)}
                    </td>

                    <td className="py-1.5 px-2.5 whitespace-nowrap">
                      {item.verificationStatus === "VERIFIED" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle className="h-3.5 w-3.5" />
                          VERIFIED
                        </span>
                      ) : item.verificationStatus === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          <XCircle className="h-3.5 w-3.5" />
                          FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          UNVERIFIED
                        </span>
                      )}
                    </td>

                    <td className="py-1.5 px-2 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleProtect(item.id, item.protected)}
                        className={`p-1 rounded hover:bg-muted transition-colors ${
                          item.protected ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-muted-foreground"
                        }`}
                        title={item.protected ? "Protected from deletion. Click to unlock." : "Click to protect from deletion."}
                      >
                        {item.protected ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </td>

                    <td className="py-1.5 px-3 text-right whitespace-nowrap w-[240px] min-w-[240px]">
                      <div className="flex items-center justify-end gap-1">
                        {/* Deep Verify Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onVerify(item.id)}
                          disabled={isVerifying}
                          className="h-6 px-1.5 text-[10px] font-medium gap-1 hover:bg-primary/10"
                          title="Verify archive CRC32, checksums and schema integrity"
                        >
                          <FileCheck2 className={`h-3 w-3 ${isVerifying ? "animate-spin text-primary" : ""}`} />
                          {isVerifying ? "Verifying..." : "Verify"}
                        </Button>

                        {/* Sandbox Drill Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTestRestore(item.id)}
                          disabled={isDrilling}
                          className="h-6 px-1.5 text-[10px] font-medium gap-1 hover:bg-muted"
                          title="Run in-memory sandbox restore drill without modifying database"
                        >
                          <PlayCircle className={`h-3 w-3 ${isDrilling ? "animate-spin text-primary" : ""}`} />
                          {isDrilling ? "Drilling..." : "Drill"}
                        </Button>

                        {/* Safe Restore Wizard */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenRestoreWizard(item)}
                          className="h-6 px-2 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 gap-1 shadow-2xs"
                          title="Open safe multi-step restore wizard"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </Button>

                        {/* Download Archive */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload(item)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                          title="Download ZIP package"
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          disabled={item.protected}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-20"
                          title={item.protected ? "Protected items cannot be deleted" : "Delete backup"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
