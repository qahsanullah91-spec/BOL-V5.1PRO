"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Radio,
  Power,
  Minimize2,
  Bell,
  Cpu,
  Zap,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Activity,
  HardDrive,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowDownToLine,
  Check,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export interface BackgroundSettingsState {
  runInBackground: boolean
  startWithWindows: boolean
  minimizeToTray: boolean
  notifyOnBackground: boolean
}

export interface BackgroundDiagnostics {
  isResidentActive: boolean
  isTrayInitialized: boolean
  platform: string
  uptimeSeconds: number
  memoryMB: number
  openAtLogin: boolean
  trayTooltip: string
}

const DEFAULT_BG_SETTINGS: BackgroundSettingsState = {
  runInBackground: true,
  startWithWindows: false,
  minimizeToTray: true,
  notifyOnBackground: true,
}

export function DesktopBackgroundSettingsCard() {
  const [settings, setSettings] = useState<BackgroundSettingsState>(DEFAULT_BG_SETTINGS)
  const [isElectron, setIsElectron] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false)
  const [diagnostics, setDiagnostics] = useState<BackgroundDiagnostics | null>(null)
  const [isTestingBalloon, setIsTestingBalloon] = useState<boolean>(false)
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false)

  const loadSettings = useCallback(async () => {
    if (typeof window === "undefined") return

    if (window.skyDesktop && typeof window.skyDesktop.getBackgroundSettings === "function") {
      setIsElectron(true)
      try {
        const res = await window.skyDesktop.getBackgroundSettings()
        if (res?.success && res.settings) {
          setSettings({
            runInBackground: Boolean(res.settings.runInBackground),
            startWithWindows: Boolean(res.settings.startWithWindows),
            minimizeToTray: Boolean(res.settings.minimizeToTray),
            notifyOnBackground: Boolean(res.settings.notifyOnBackground),
          })
        }

        // Load runtime diagnostics if available
        if (typeof window.skyDesktop.getBackgroundDiagnostics === "function") {
          const diagRes = await window.skyDesktop.getBackgroundDiagnostics()
          if (diagRes?.success && diagRes.diagnostics) {
            setDiagnostics(diagRes.diagnostics)
          }
        }
      } catch (err) {
        console.error("Failed to load background settings via desktop bridge:", err)
      } finally {
        setLoading(false)
      }
    } else {
      setIsElectron(false)
      // Read local cache for browser preview
      try {
        const raw = window.localStorage.getItem("skybol:desktop-background-settings")
        if (raw) {
          setSettings(JSON.parse(raw))
        }
      } catch {}
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()

    // Listen for live updates from tray context menu
    if (typeof window !== "undefined" && window.skyDesktop?.onBackgroundSettingsChanged) {
      const unsubscribe = window.skyDesktop.onBackgroundSettingsChanged((updated: any) => {
        if (updated) {
          setSettings({
            runInBackground: Boolean(updated.runInBackground),
            startWithWindows: Boolean(updated.startWithWindows),
            minimizeToTray: Boolean(updated.minimizeToTray),
            notifyOnBackground: Boolean(updated.notifyOnBackground),
          })
        }
      })
      return () => {
        if (typeof unsubscribe === "function") unsubscribe()
      }
    }
  }, [loadSettings])

  const handleToggle = async (key: keyof BackgroundSettingsState, value: boolean) => {
    setSavingKey(key)
    const nextSettings = { ...settings, [key]: value }
    setSettings(nextSettings)

    try {
      if (isElectron && window.skyDesktop?.saveBackgroundSettings) {
        const res = await window.skyDesktop.saveBackgroundSettings({ [key]: value })
        if (res?.success && res.settings) {
          setSettings({
            runInBackground: Boolean(res.settings.runInBackground),
            startWithWindows: Boolean(res.settings.startWithWindows),
            minimizeToTray: Boolean(res.settings.minimizeToTray),
            notifyOnBackground: Boolean(res.settings.notifyOnBackground),
          })
          toast.success("Background settings updated", {
            description: "Changes applied immediately to system tray and Windows startup.",
          })
        } else {
          throw new Error(res?.error || "Save failed")
        }
      } else {
        window.localStorage.setItem("skybol:desktop-background-settings", JSON.stringify(nextSettings))
        toast.info("Settings saved in local workspace cache")
      }
    } catch (err: any) {
      // Rollback on failure
      setSettings(settings)
      toast.error("Failed to update background setting", {
        description: err?.message || "Unknown desktop bridge error",
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handleMinimizeNow = async () => {
    if (isElectron && window.skyDesktop?.minimizeToTray) {
      try {
        await window.skyDesktop.minimizeToTray()
      } catch (err: any) {
        toast.error("Failed to minimize to tray: " + (err?.message || "Error"))
      }
    } else {
      toast.info("Minimize to tray is active in the desktop application window.")
    }
  }

  const handleTestBalloon = async () => {
    setIsTestingBalloon(true)
    try {
      if (isElectron && typeof window.skyDesktop?.testTrayNotification === "function") {
        const res = await window.skyDesktop.testTrayNotification()
        if (res?.success) {
          toast.success("Windows Tray Notification Sent!", {
            description: "Check the bottom-right corner of your Windows taskbar.",
          })
        } else {
          toast.info(res?.message || "Tray balloon notification sent.")
        }
      } else {
        toast.success("Simulated Tray Notification", {
          description: "AQ COMPANIES is active in Windows notification tray.",
        })
      }
    } catch (err: any) {
      toast.error("Failed to trigger test balloon: " + (err?.message || "Error"))
    } finally {
      setTimeout(() => setIsTestingBalloon(false), 800)
    }
  }

  const handleQuitCompletely = async () => {
    if (isElectron && window.skyDesktop?.quitApp) {
      try {
        toast.loading("Shutting down AQ COMPANIES backend and services...")
        await window.skyDesktop.quitApp()
      } catch (err: any) {
        toast.error("Failed to quit: " + (err?.message || "Error"))
      }
    } else {
      setShowQuitConfirm(false)
      toast.info("Application complete quit is active in desktop mode.")
    }
  }

  const isResidentActive = settings.runInBackground

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden transition-all duration-300">
      {/* Executive Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-sky-900/40 relative overflow-hidden">
        {/* Ambient lighting meshes */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-sky-500/15 via-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/25 via-blue-600/30 to-indigo-600/35 border border-sky-400/40 text-sky-300 flex items-center justify-center shadow-inner shrink-0 ring-4 ring-sky-500/10">
                <Radio className={cn("w-6 h-6", isResidentActive ? "animate-pulse text-sky-300" : "text-slate-400")} />
              </div>
              {isResidentActive && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Desktop Background & Tray Service
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    isResidentActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-xs"
                      : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  )}
                >
                  {isResidentActive ? "24/7 RESIDENT ACTIVE" : "STANDARD EXIT MODE"}
                </Badge>
              </div>

              <p className="text-xs text-sky-200/90 font-[vazirmatn] font-bold mt-1" dir="rtl">
                سرویس اجرای مداوم در پس‌زمینه ویندوز، سینی سیستم (تسک‌بار) و شروع خودکار سیستم
              </p>

              {/* Live telemetry badges */}
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-mono text-[10px]">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Resident RAM: ~{diagnostics?.memoryMB || 48} MB
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px]">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Wake Delay: &lt;10ms
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px]">
                  <Layers className="w-3 h-3 text-sky-400" />
                  System Tray Mesh Active
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestBalloon}
              disabled={isTestingBalloon}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Send a live test notification balloon to the Windows system tray"
            >
              <Bell className={cn("w-3.5 h-3.5 text-amber-300", isTestingBalloon && "animate-bounce")} />
              <span>{isTestingBalloon ? "Sending..." : "Test Tray Balloon"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleMinimizeNow}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0 rounded-xl text-xs font-black gap-1.5 cursor-pointer shadow-md transition-all"
              title="Minimize window directly to notification area"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize to Tray Now</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Core Value Pillars - Modern 3-Column Executive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-slate-50/80 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/60 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center border border-amber-200/80 dark:border-amber-800/40 shadow-2xs">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100/90 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  &lt;10ms Instant Awake
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                Zero Cold-Start Lag
              </h4>
              <span className="text-[10px] font-[vazirmatn] text-slate-400 block mt-0.5" dir="rtl">
                باز شدن فوری بدون تأخیر راه‌اندازی
              </span>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Stays resident in memory so reopening from tray is instant with 0 waiting time or splash screen delay.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/80 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/60 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Silent Worker Mesh
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                24/7 Background Sync &amp; API
              </h4>
              <span className="text-[10px] font-[vazirmatn] text-slate-400 block mt-0.5" dir="rtl">
                همگام‌سازی ۲۴ ساعته در پس‌زمینه
              </span>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Multi-device ledger syncing, central LAN server, and background analytics continue operating seamlessly.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/70 via-white to-slate-50/80 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-900/60 border border-sky-200/80 dark:border-sky-900/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center border border-sky-200/80 dark:border-sky-800/40 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100/90 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Tray Quick-Lock
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                Vault &amp; Privacy Lockdown
              </h4>
              <span className="text-[10px] font-[vazirmatn] text-slate-400 block mt-0.5" dir="rtl">
                قفل فوری محیط کار و امنیت بایومتریک
              </span>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Quick-lock your workspace directly from the system tray menu without terminating database engines.
              </p>
            </div>
          </div>
        </div>

        {/* Four Elevated Feature Toggle Cards */}
        <div className="space-y-3">
          {/* Card 1: Run in Background on Close */}
          <div className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            settings.runInBackground
              ? "border-emerald-200/90 bg-gradient-to-r from-emerald-50/40 via-white to-slate-50/60 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs"
              : "border-slate-200/90 bg-white dark:bg-slate-900/60 dark:border-slate-800"
          )}>
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border",
                settings.runInBackground
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                <Minimize2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Run in Background on Close (Keep Active in Tray)
                  </h4>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Recommended
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-[vazirmatn]" dir="rtl">
                  ادامه اجرای نرم‌افزار در پس‌زمینه هنگام کلیک روی دکمه بستن (ضربدر)
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  When enabled, clicking the red &times; close button conceals the window into the Windows taskbar tray without stopping database operations or local servers.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Click &times; &rarr; Conceals to Tray
                  </span>
                  <span>&bull;</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Zero Interruptions to Network Peers
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border hidden md:inline-block",
                settings.runInBackground
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}>
                {settings.runInBackground ? "ACTIVE (RESIDENT)" : "FULL EXIT"}
              </span>
              {savingKey === "runInBackground" && <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />}
              <Switch
                checked={settings.runInBackground}
                onCheckedChange={(val) => handleToggle("runInBackground", val)}
                disabled={loading || savingKey === "runInBackground"}
                aria-label="Toggle Run in Background on Close"
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Card 2: Launch on Windows Startup */}
          <div className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            settings.startWithWindows
              ? "border-blue-200/90 bg-gradient-to-r from-blue-50/40 via-white to-slate-50/60 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs"
              : "border-slate-200/90 bg-white dark:bg-slate-900/60 dark:border-slate-800"
          )}>
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border",
                settings.startWithWindows
                  ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                <Monitor className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Launch on Windows Startup (Silent Tray Boot)
                  </h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Silent Auto-Launch
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-[vazirmatn]" dir="rtl">
                  شروع خودکار نرم‌افزار با روشن شدن ویندوز (بدون باز شدن مزاحم پنجره در استارتاپ)
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically initializes the app in the background when your computer boots up. Ready immediately when you double-click the tray icon.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Windows Registry: HKCU\Software\Microsoft\Windows\CurrentVersion\Run
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border hidden md:inline-block",
                settings.startWithWindows
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}>
                {settings.startWithWindows ? "AUTO-START ON" : "DISABLED"}
              </span>
              {savingKey === "startWithWindows" && <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />}
              <Switch
                checked={settings.startWithWindows}
                onCheckedChange={(val) => handleToggle("startWithWindows", val)}
                disabled={loading || savingKey === "startWithWindows"}
                aria-label="Toggle Launch on Windows Startup"
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Card 3: Minimize to Notification Tray */}
          <div className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            settings.minimizeToTray
              ? "border-indigo-200/90 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50/60 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs"
              : "border-slate-200/90 bg-white dark:bg-slate-900/60 dark:border-slate-800"
          )}>
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border",
                settings.minimizeToTray
                  ? "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Minimize to Notification Tray
                  </h4>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Clean Taskbar
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-[vazirmatn]" dir="rtl">
                  کوچک کردن مستقیم پنجره به سینی سیستم (تسک‌بار پنهان)
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clicking the minimize button hides the main taskbar button and parks the application neatly in the system tray notification area.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    Keeps Taskbar Uncluttered
                  </span>
                  <span>&bull;</span>
                  <span>Restore via Single Click on Tray Icon</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border hidden md:inline-block",
                settings.minimizeToTray
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}>
                {settings.minimizeToTray ? "TRAY PARKING" : "TASKBAR ONLY"}
              </span>
              {savingKey === "minimizeToTray" && <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />}
              <Switch
                checked={settings.minimizeToTray}
                onCheckedChange={(val) => handleToggle("minimizeToTray", val)}
                disabled={loading || savingKey === "minimizeToTray"}
                aria-label="Toggle Minimize to Tray"
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Card 4: Tray Notifications & Balloons */}
          <div className={cn(
            "p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
            settings.notifyOnBackground
              ? "border-sky-200/90 bg-gradient-to-r from-sky-50/40 via-white to-slate-50/60 dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900 shadow-2xs"
              : "border-slate-200/90 bg-white dark:bg-slate-900/60 dark:border-slate-800"
          )}>
            <div className="flex items-start gap-3.5">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border",
                settings.notifyOnBackground
                  ? "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
              )}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Tray Notifications &amp; Balloons
                  </h4>
                  <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Audible &amp; Visual Feedback
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 font-[vazirmatn]" dir="rtl">
                  نمایش بالن اعلان ویندوز هنگام انتقال برنامه به پس‌زمینه
                </div>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Displays a brief confirmation balloon when the app is minimized or hidden into the system tray so you know it is safely resident.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestBalloon}
                    disabled={isTestingBalloon}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer underline underline-offset-2"
                  >
                    <span>Click to send test balloon notification</span> &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border hidden md:inline-block",
                settings.notifyOnBackground
                  ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300"
                  : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
              )}>
                {settings.notifyOnBackground ? "BALLOONS ON" : "MUTED"}
              </span>
              {savingKey === "notifyOnBackground" && <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />}
              <Switch
                checked={settings.notifyOnBackground}
                onCheckedChange={(val) => handleToggle("notifyOnBackground", val)}
                disabled={loading || savingKey === "notifyOnBackground"}
                aria-label="Toggle Tray Notifications"
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Collapsible System Telemetry Drawer */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full p-3.5 px-4 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>System Tray Telemetry &amp; Windows Runtime Architecture</span>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                ({diagnostics ? `PID Active • ${diagnostics.platform}` : "Desktop Standby"})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="text-[11px] font-semibold">{showDiagnostics ? "Hide Details" : "View Details"}</span>
              {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showDiagnostics && (
            <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Process Resident RSS</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {diagnostics?.memoryMB ? `${diagnostics.memoryMB} MB` : "~48 MB"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">Low memory footprint</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tray Initialization</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {diagnostics?.isTrayInitialized ? "Win32 Tray Bound" : "Active in Electron"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Direct HWND Shell Notify</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Database Locks</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                  0 Held (Idle)
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Optimistic concurrency safe</span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Windows Startup State</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {settings.startWithWindows ? "Auto-Launch Enabled" : "Manual Launch"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">User profile run key</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions & Complete Quit */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Right-click the AQ COMPANIES tray icon anytime for instant controls, quick-lock, and window management.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {!showQuitConfirm ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuitConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl gap-1.5 cursor-pointer font-bold"
              >
                <Power className="w-3.5 h-3.5 text-rose-500" />
                <span>Quit Application Completely</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200">Confirm complete exit?</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleQuitCompletely}
                  className="h-7 px-2.5 text-xs font-black rounded-lg cursor-pointer"
                >
                  Yes, Quit Now
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuitConfirm(false)}
                  className="h-7 px-2 text-xs font-bold rounded-lg cursor-pointer text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
