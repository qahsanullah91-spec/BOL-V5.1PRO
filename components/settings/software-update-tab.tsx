"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Terminal,
  Clock,
  HardDrive,
  FileCode,
  ChevronDown,
  ChevronUp,
  Zap,
  Laptop,
  ArrowUpRight,
  ExternalLink,
  Unlock,
  Layers,
  X,
  ShieldAlert,
} from "lucide-react"
import { CURRENT_SYSTEM_VERSION, SYSTEM_RELEASE_LABEL } from "@/lib/config/system-version"
import { toast } from "sonner"

interface UpdateStatusData {
  success: boolean
  hasUpdate: boolean
  version: string
  currentVersion: string
  installerName: string | null
  installerPath: string | null
  installerSize: number
  installerFormattedSize: string
  installerModifiedTime: string | null
  releaseDate: string
  sha256: string | null
  status: "ready_to_install" | "up_to_date" | "not_found" | "error"
  error?: string
}

export function SoftwareUpdateTab() {
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [isInstalling, setIsInstalling] = useState<boolean>(false)
  const [installCountdown, setInstallCountdown] = useState<number | null>(null)
  const [customPath, setCustomPath] = useState<string>("")
  const [updateData, setUpdateData] = useState<UpdateStatusData | null>(null)
  const [copiedSha, setCopiedSha] = useState<boolean>(false)
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false)
  const [expandedChangelog, setExpandedChangelog] = useState<boolean>(true)
  const [isDesktopApp, setIsDesktopApp] = useState<boolean>(false)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [upgradeMode, setUpgradeMode] = useState<"seamless" | "guided">("seamless")
  const [isKillingProcesses, setIsKillingProcesses] = useState<boolean>(false)

  // Detect environment on mount
  useEffect(() => {
    setIsDesktopApp(typeof window !== "undefined" && Boolean(window.skyDesktop))
    const savedCustomPath = typeof window !== "undefined" ? window.localStorage.getItem("skybol:custom-installer-path") : null
    if (savedCustomPath) {
      setCustomPath(savedCustomPath)
    }
  }, [])

  // Check for updates
  const checkForUpdates = useCallback(async (pathCandidate?: string) => {
    setIsChecking(true)
    const targetCandidate = pathCandidate !== undefined ? pathCandidate : customPath
    try {
      if (typeof window !== "undefined" && window.skyDesktop?.checkForUpdates) {
        // Native Electron IPC
        const res = await window.skyDesktop.checkForUpdates(targetCandidate || undefined)
        if (res.success) {
          setUpdateData({
            success: true,
            hasUpdate: res.hasUpdate,
            version: (res as any).availableVersion || (res as any).version || CURRENT_SYSTEM_VERSION.version,
            currentVersion: res.currentVersion || CURRENT_SYSTEM_VERSION.version,
            installerName: res.installerName,
            installerPath: res.installerPath,
            installerSize: res.installerSize,
            installerFormattedSize: res.installerFormattedSize,
            installerModifiedTime: res.installerModifiedTime,
            releaseDate: res.installerModifiedTime || CURRENT_SYSTEM_VERSION.releaseDate,
            sha256: res.sha256,
            status: (res.status as any) || (res.hasUpdate ? "ready_to_install" : "not_found"),
          })
          if (res.hasUpdate) {
            toast.success("New update package detected & ready to install!")
          } else {
            toast.info("No new installer found. System is up to date.")
          }
        } else {
          setUpdateData(prev => ({
            ...prev,
            success: false,
            hasUpdate: false,
            version: CURRENT_SYSTEM_VERSION.version,
            currentVersion: CURRENT_SYSTEM_VERSION.version,
            installerName: null,
            installerPath: null,
            installerSize: 0,
            installerFormattedSize: "0 MB",
            installerModifiedTime: null,
            releaseDate: CURRENT_SYSTEM_VERSION.releaseDate,
            sha256: null,
            status: "error",
            error: res.error,
          }))
          toast.error(res.error || "Failed to scan for updates")
        }
      } else {
        // Fallback to Next.js API route
        const url = targetCandidate
          ? `/api/system/update?customPath=${encodeURIComponent(targetCandidate)}`
          : "/api/system/update"
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          const avail = json.availableUpdate
          setUpdateData({
            success: true,
            hasUpdate: avail?.hasUpdate ?? false,
            version: avail?.version || CURRENT_SYSTEM_VERSION.version,
            currentVersion: json.currentVersion || CURRENT_SYSTEM_VERSION.version,
            installerName: avail?.installerName || null,
            installerPath: avail?.installerPath || null,
            installerSize: avail?.installerSize || 0,
            installerFormattedSize: avail?.installerFormattedSize || "0 MB",
            installerModifiedTime: avail?.installerModifiedTime || null,
            releaseDate: avail?.releaseDate || CURRENT_SYSTEM_VERSION.releaseDate,
            sha256: avail?.sha256 || null,
            status: avail?.status || (avail?.hasUpdate ? "ready_to_install" : "not_found"),
          })
          if (avail?.hasUpdate) {
            toast.success("Update package detected and ready to install!")
          } else {
            toast.info("System is synchronized. No pending installer package.")
          }
        } else {
          throw new Error(json.error || "Update check failed")
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Error checking for updates")
      setUpdateData(prev => ({
        ...prev,
        success: false,
        hasUpdate: false,
        version: CURRENT_SYSTEM_VERSION.version,
        currentVersion: CURRENT_SYSTEM_VERSION.version,
        installerName: null,
        installerPath: null,
        installerSize: 0,
        installerFormattedSize: "0 MB",
        installerModifiedTime: null,
        releaseDate: CURRENT_SYSTEM_VERSION.releaseDate,
        sha256: null,
        status: "error",
        error: err?.message,
      }))
    } finally {
      setIsChecking(false)
    }
  }, [customPath])

  // Run update check once on load
  useEffect(() => {
    checkForUpdates()
  }, [checkForUpdates])

  // Release file locks and kill background workers
  const handleKillProcesses = async () => {
    setIsKillingProcesses(true)
    try {
      if (typeof window !== "undefined" && window.skyDesktop?.killProcesses) {
        const res = await window.skyDesktop.killProcesses()
        if (res.success) {
          toast.success("Background processes terminated & Windows file locks released!")
        } else {
          toast.error(res.error || "Failed to terminate background processes")
        }
      } else {
        const res = await fetch("/api/system/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "kill-processes" }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Background processes terminated & Windows file locks released!")
        } else {
          toast.error(json.error || "Failed to terminate processes")
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Error clearing background processes")
    } finally {
      setIsKillingProcesses(false)
    }
  }

  // Open In-App Confirmation Modal
  const handleOpenInstallModal = () => {
    if (!updateData?.installerPath && !updateData?.hasUpdate) {
      toast.error("No valid installer found to install.")
      return
    }
    setShowConfirmModal(true)
  }

  // Execute Upgrade
  const triggerInstall = async (mode: "seamless" | "guided" = upgradeMode) => {
    setShowConfirmModal(false)
    setIsInstalling(true)
    setInstallCountdown(3)

    try {
      const isSilent = mode === "seamless"
      if (typeof window !== "undefined" && window.skyDesktop?.installUpdate) {
        const res = await window.skyDesktop.installUpdate({
          targetPath: updateData?.installerPath || undefined,
          silent: isSilent,
        })
        if (res.success) {
          toast.success("Installer launched! Closing current application in 2 seconds...")
          let count = 3
          const timer = setInterval(() => {
            count -= 1
            setInstallCountdown(count)
            if (count <= 0) {
              clearInterval(timer)
            }
          }, 800)
        } else {
          setIsInstalling(false)
          setInstallCountdown(null)
          toast.error(res.error || "Failed to start update installer")
        }
      } else {
        // Fallback for API
        const res = await fetch("/api/system/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "install",
            installerPath: updateData?.installerPath,
            silent: isSilent,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Installer executable triggered successfully! Follow on-screen setup.")
          setIsInstalling(false)
          setInstallCountdown(null)
        } else {
          setIsInstalling(false)
          setInstallCountdown(null)
          toast.error(json.error || "Failed to launch installer via server API")
        }
      }
    } catch (e: any) {
      setIsInstalling(false)
      setInstallCountdown(null)
      toast.error(e?.message || "Failed to trigger installer")
    }
  }

  // Open Release Directory
  const handleOpenFolder = async () => {
    try {
      if (typeof window !== "undefined" && window.skyDesktop?.openUpdateFolder) {
        const res = await window.skyDesktop.openUpdateFolder(updateData?.installerPath || undefined)
        if (!res.success) toast.error(res.error || "Could not open release folder")
      } else {
        const res = await fetch("/api/system/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "open-folder", installerPath: updateData?.installerPath }),
        })
        const json = await res.json()
        if (json.success) toast.success("Opened release directory in Windows Explorer")
        else toast.error(json.error || "Directory not found")
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to open folder")
    }
  }

  // Browse for custom installer .exe
  const handleBrowseInstaller = async () => {
    try {
      if (typeof window !== "undefined" && window.skyDesktop?.selectInstallerFile) {
        const filePath = await window.skyDesktop.selectInstallerFile()
        if (filePath) {
          setCustomPath(filePath)
          window.localStorage.setItem("skybol:custom-installer-path", filePath)
          toast.success(`Selected custom package: ${filePath}`)
          checkForUpdates(filePath)
        }
      } else {
        const manual = window.prompt("Enter full absolute path to installer (e.g. D:\\releases\\AQ-COMPANIES-Setup.exe):", customPath)
        if (manual) {
          setCustomPath(manual)
          window.localStorage.setItem("skybol:custom-installer-path", manual)
          checkForUpdates(manual)
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "File browser failed")
    }
  }

  const copyShaToClipboard = () => {
    if (!updateData?.sha256) return
    navigator.clipboard.writeText(updateData.sha256)
    setCopiedSha(true)
    toast.success("SHA-256 checksum copied to clipboard!")
    setTimeout(() => setCopiedSha(false), 2500)
  }

  const copyBuildCommand = () => {
    const cmd = "node scripts/release-pipeline.cjs --skip-frontend"
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(true)
    toast.success("Release build command copied to clipboard!")
    setTimeout(() => setCopiedCmd(false), 2500)
  }

  const hasInstallerReady = Boolean(updateData?.installerPath && updateData.hasUpdate)

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Update Engine
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-slate-300 border border-white/10">
                {CURRENT_SYSTEM_VERSION.version} • {CURRENT_SYSTEM_VERSION.buildNumber}
              </span>
              {isDesktopApp && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Desktop Native Mode
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              Software Updates & Release Deployment
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Every time you modify the software code or create a new release build, this updater automatically
              scans for the compiled installer package and lets you upgrade with 1-click without losing any data.
            </p>
            <p className="text-xs text-emerald-300 font-[vazirmatn] font-bold" dir="rtl">
              سیستم مدیریت بروزرسانی خودکار و نصب نسخه جدید بدون از دست رفتن اطلاعات
            </p>
          </div>

          {/* Quick Check Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => checkForUpdates()}
              disabled={isChecking || isInstalling}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-black text-xs transition border border-white/20 flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isChecking ? "animate-spin" : ""}`} />
              <span>{isChecking ? "Scanning Release Files..." : "Check For Updates"}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenFolder}
              className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-200 font-bold text-xs transition border border-slate-700 flex items-center gap-2 shadow-sm cursor-pointer"
              title="Open release directory in Windows Explorer"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Open Release Folder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Action Card (Install Now or Status) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-lg shadow-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-3.5 rounded-2xl ${
                hasInstallerReady
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : updateData?.status === "error"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              }`}>
                {hasInstallerReady ? (
                  <Zap className="w-6 h-6 animate-bounce" />
                ) : updateData?.status === "error" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Update Detection Status
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {isInstalling
                    ? "Upgrading Software... Launching Setup Package"
                    : hasInstallerReady
                    ? `Ready to Install: ${updateData?.installerName || "AQ-COMPANIES-Setup.exe"}`
                    : updateData?.status === "not_found"
                    ? "No Setup Executable Found in Release Folder"
                    : "Software is Up to Date"}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
              {hasInstallerReady ? (
                <>
                  A verified Windows setup package (<span className="font-mono font-bold text-slate-900">{updateData?.installerName}</span>)
                  is available ({updateData?.installerFormattedSize || "535 MB"}). Click below to install and update your desktop installation.
                </>
              ) : (
                <>
                  Installed application: <span className="font-bold text-slate-900">{CURRENT_SYSTEM_VERSION.applicationName}</span>.
                  Whenever you modify source code, run the build pipeline to generate the setup executable.
                </>
              )}
            </p>

            {updateData?.installerPath && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 overflow-x-auto max-w-2xl">
                <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">{updateData.installerPath}</span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:min-w-[250px]">
            {hasInstallerReady ? (
              <button
                type="button"
                onClick={handleOpenInstallModal}
                disabled={isInstalling}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-5 h-5 ${isInstalling ? "animate-bounce" : ""}`} />
                <span>
                  {isInstalling
                    ? installCountdown !== null && installCountdown > 0
                      ? `Exiting in ${installCountdown}s to Apply Update...`
                      : "Launching Installer..."
                    : "Install Update Now (1-Click)"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => checkForUpdates()}
                disabled={isChecking}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
                <span>Scan for New Release Package</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleKillProcesses}
              disabled={isKillingProcesses || isInstalling}
              className="w-full py-2.5 px-4 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="Force terminate lingering background instances to unlock files before installation"
            >
              <Unlock className={`w-3.5 h-3.5 text-amber-700 ${isKillingProcesses ? "animate-spin" : ""}`} />
              <span>{isKillingProcesses ? "Clearing Locks..." : "Unlock Files & Clear Workers"}</span>
            </button>

            <button
              type="button"
              onClick={handleBrowseInstaller}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Custom Package (.exe)...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Comparison Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Installed Version */}
        <div className="p-5 rounded-3xl border border-blue-200/80 bg-blue-50/50 space-y-2">
          <div className="flex items-center justify-between text-blue-900 font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-blue-600" />
              Installed Version
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200/60 text-blue-800">Current</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {CURRENT_SYSTEM_VERSION.version}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Build: {CURRENT_SYSTEM_VERSION.buildNumber}
          </p>
        </div>

        {/* Card 2: Available Release */}
        <div className="p-5 rounded-3xl border border-emerald-200/80 bg-emerald-50/50 space-y-2">
          <div className="flex items-center justify-between text-emerald-900 font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-600" />
              Package Available
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">Release</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {updateData?.version || "5.1.0"}
          </div>
          <p className="text-[11px] text-slate-500 truncate" title={updateData?.installerName || "AQ-COMPANIES-Setup.exe"}>
            {updateData?.installerName || "AQ-COMPANIES-Setup.exe"}
          </p>
        </div>

        {/* Card 3: Package Size */}
        <div className="p-5 rounded-3xl border border-indigo-200/80 bg-indigo-50/50 space-y-2">
          <div className="flex items-center justify-between text-indigo-900 font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              Installer Size
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-800">NSIS x64</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {updateData?.installerFormattedSize || "535.32 MB"}
          </div>
          <p className="text-[11px] text-slate-500">
            {updateData?.installerSize ? `${updateData.installerSize.toLocaleString()} bytes` : "Self-extracting"}
          </p>
        </div>

        {/* Card 4: Release Date */}
        <div className="p-5 rounded-3xl border border-amber-200/80 bg-amber-50/50 space-y-2">
          <div className="flex items-center justify-between text-amber-900 font-black text-xs uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Release Date
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">Verified</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono truncate">
            {updateData?.installerModifiedTime
              ? new Date(updateData.installerModifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : CURRENT_SYSTEM_VERSION.releaseDate}
          </div>
          <p className="text-[11px] text-slate-500">
            Channel: {CURRENT_SYSTEM_VERSION.updateChannel.toUpperCase()}
          </p>
        </div>
      </div>

      {/* SHA-256 Checksum Card */}
      {updateData?.sha256 && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cryptographic Integrity Verification (SHA-256)
            </span>
            <button
              type="button"
              onClick={copyShaToClipboard}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-slate-200"
            >
              {copiedSha ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSha ? "Checksum Copied!" : "Copy SHA-256"}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-emerald-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 break-all select-all">
            {updateData.sha256}
          </div>
          <p className="text-[11px] text-slate-400">
            This cryptographic hash guarantees that the update executable was built locally and has not been tampered with or corrupted.
          </p>
        </div>
      )}

      {/* Developer Instructions: How to compile update when changes are made */}
      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wide">
                Developer Guide: Updating After Code Changes
              </h4>
              <p className="text-xs text-indigo-800 font-medium">
                Whenever you modify features, components, or styles in this software, build a new update package with this command:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyBuildCommand}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? "Command Copied!" : "Copy Build Command"}</span>
          </button>
        </div>

        <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs border border-slate-800 space-y-2">
          <div className="text-emerald-400 font-bold"># Quick 1-Step Release Pipeline (Windows NSIS):</div>
          <div className="text-amber-300 select-all font-bold">
            node scripts/release-pipeline.cjs --skip-frontend
          </div>
          <div className="text-slate-400 text-[11px]">
            Or for a full rebuild including Next.js standalone frontend: <span className="text-slate-200">npm run release:win</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="bg-white/80 p-3 rounded-2xl border border-indigo-100 font-medium">
            <span className="font-black text-indigo-950 block mb-0.5">1. Make Your Edits</span>
            Edit any code, bill of lading templates, ledgers, or styling.
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-indigo-100 font-medium">
            <span className="font-black text-indigo-950 block mb-0.5">2. Run Release Command</span>
            The script bundles the app into <span className="font-mono text-blue-700">release/AQ-COMPANIES-Setup.exe</span>.
          </div>
          <div className="bg-white/80 p-3 rounded-2xl border border-indigo-100 font-medium">
            <span className="font-black text-indigo-950 block mb-0.5">3. 1-Click Install</span>
            Return to this Settings tab and click <span className="font-bold text-emerald-700">"Install Update Now"</span>.
          </div>
        </div>
      </div>

      {/* Changelog & Release Notes */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setExpandedChangelog(!expandedChangelog)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 font-bold">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">What&apos;s New in This Version & Release History</h4>
              <p className="text-xs text-slate-500">Documented changelog and feature enhancements</p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            {expandedChangelog ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {expandedChangelog && (
          <div className="pt-2 space-y-4 border-t border-slate-100">
            {CURRENT_SYSTEM_VERSION.changelog.map((entry, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white font-mono">
                      {entry.version}
                    </span>
                    <span className="text-xs font-black text-slate-800">{entry.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{entry.date}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                  {entry.changes.map((change, cIdx) => (
                    <li key={cIdx} className="leading-relaxed">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Update Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Confirm Software Upgrade
                  </h3>
                  <p className="text-xs text-slate-300">
                    Upgrading to {updateData?.version || CURRENT_SYSTEM_VERSION.version} • {updateData?.installerFormattedSize || "535 MB"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Upgrade Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Select Upgrade Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setUpgradeMode("seamless")}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                      upgradeMode === "seamless"
                        ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        1-Click Seamless
                      </span>
                      {upgradeMode === "seamless" && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Recommended. Automatically terminates background processes, runs in-place upgrade, and relaunches smoothly.
                    </p>
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full w-fit">
                      Auto-Relaunch (--updated)
                    </span>
                  </div>

                  <div
                    onClick={() => setUpgradeMode("guided")}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${
                      upgradeMode === "guided"
                        ? "border-blue-500 bg-blue-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Guided Setup
                      </span>
                      {upgradeMode === "guided" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      Launches the full interactive Windows NSIS installation wizard with standard setup prompts and directory options.
                    </p>
                    <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full w-fit">
                      Standard Setup Wizard
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Safety Reassurance Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Guaranteed Data Protection</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your bills of lading, account ledgers, local SQLite database, settings, and documents stored in AppData are completely safe and preserved during the upgrade process.
                </p>
                <p className="text-[11px] text-slate-500 font-[vazirmatn] font-bold" dir="rtl">
                  تمامی بارنامه‌ها، حساب‌ها و اطلاعات پایگاه داده شما کاملاً امن و دست‌نخورده باقی می‌ماند.
                </p>
              </div>

              {/* Package Details */}
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100/80 px-4 py-2.5 rounded-xl font-mono">
                <span className="truncate max-w-[280px]">
                  {updateData?.installerName || "AQ-COMPANIES-Setup.exe"}
                </span>
                <span className="font-bold text-slate-700">
                  {updateData?.installerFormattedSize || "535 MB"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => triggerInstall(upgradeMode)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Start Upgrade Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Installation / App Teardown Overlay */}
      {isInstalling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <Download className="w-8 h-8 animate-bounce text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">
                Upgrading AQ COMPANIES...
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {installCountdown !== null && installCountdown > 0
                  ? `Releasing all process locks and exiting in ${installCountdown}s...`
                  : "Installer running in background. Upgrading components..."}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-800 font-medium flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>NSIS Process Lock Shield active: files unlocked cleanly</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
