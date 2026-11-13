"use client"

import React, { useState, useEffect } from "react"
import {
  Server,
  Laptop,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
  HardDrive,
  Database,
  Radio,
  Sliders,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CURRENT_SYSTEM_VERSION } from "@/lib/config/system-version"

interface NetworkConfig {
  mode: "local" | "server"
  serverHost: string
  serverPort: number
  useSsl: boolean
  customUrl?: string
}

interface ServerInfo {
  server_name: string
  version: string
  minimum_client_version: string
  connection_mode: string
  database_type: string
  maintenance_mode: boolean
  uptime_seconds: number
  server_time: string
}

export function ServerConnectionTab() {
  const [mode, setMode] = useState<"local" | "server">("local")
  const [serverHost, setServerHost] = useState("192.168.1.100")
  const [serverPort, setServerPort] = useState(8000)
  const [useSsl, setUseSsl] = useState(false)
  const [customUrl, setCustomUrl] = useState("")

  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    latencyMs?: number
    serverInfo?: ServerInfo
    error?: string
  } | null>(null)

  const [activeStatus, setActiveStatus] = useState<string>("LOCAL_READY")
  const [isDesktop, setIsDesktop] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load initial settings
  useEffect(() => {
    const desktopAvailable = typeof window !== "undefined" && Boolean((window as any).skyDesktop?.getNetworkConfig)
    setIsDesktop(desktopAvailable)

    if (desktopAvailable) {
      void (window as any).skyDesktop.getNetworkConfig().then((cfg: NetworkConfig) => {
        if (cfg) {
          setMode(cfg.mode || "local")
          if (cfg.serverHost) setServerHost(cfg.serverHost)
          if (cfg.serverPort) setServerPort(cfg.serverPort)
          setUseSsl(Boolean(cfg.useSsl))
          if (cfg.customUrl) setCustomUrl(cfg.customUrl)
        }
      })

      void (window as any).skyDesktop.getNetworkStatus().then((status: any) => {
        if (status?.state) setActiveStatus(status.state)
      })
    } else if (typeof window !== "undefined") {
      const savedMode = (localStorage.getItem("sky_connection_mode") as "local" | "server") || "local"
      const savedHost = localStorage.getItem("sky_server_host") || "192.168.1.100"
      const savedPort = parseInt(localStorage.getItem("sky_server_port") || "8000", 10)
      const savedSsl = localStorage.getItem("sky_server_ssl") === "true"
      const savedUrl = localStorage.getItem("sky_server_custom_url") || ""

      setMode(savedMode)
      setServerHost(savedHost)
      setServerPort(savedPort)
      setUseSsl(savedSsl)
      setCustomUrl(savedUrl)
    }
  }, [])

  const buildTargetUrl = () => {
    if (customUrl.trim().length > 0) {
      return customUrl.trim().replace(/\/+$/, "")
    }
    const proto = useSsl ? "https" : "http"
    return `${proto}://${serverHost.trim()}:${serverPort}`
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    const targetUrl = buildTargetUrl()

    try {
      if (isDesktop && (window as any).skyDesktop?.testServerConnection) {
        const res = await (window as any).skyDesktop.testServerConnection(targetUrl)
        setTestResult(res)
      } else {
        const start = Date.now()
        const res = await fetch(`${targetUrl}/api/v1/system/server-status`, {
          signal: AbortSignal.timeout(5000),
        })
        const latencyMs = Date.now() - start
        if (res.ok) {
          const info = await res.json()
          setTestResult({ success: true, latencyMs, serverInfo: info })
        } else {
          setTestResult({
            success: false,
            latencyMs,
            error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
          })
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || "Failed to reach server. Please check IP address, port, and firewall rules.",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveAndApply = async () => {
    setSaving(true)
    setSaveSuccess(false)
    const targetUrl = buildTargetUrl()

    const configPayload: Partial<NetworkConfig> = {
      mode,
      serverHost,
      serverPort,
      useSsl,
      customUrl: customUrl.trim() || undefined,
    }

    try {
      if (isDesktop && (window as any).skyDesktop?.switchNetworkMode) {
        const newStatus = await (window as any).skyDesktop.switchNetworkMode(mode, configPayload)
        if (newStatus?.state) setActiveStatus(newStatus.state)
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("sky_connection_mode", mode)
        localStorage.setItem("sky_server_host", serverHost)
        localStorage.setItem("sky_server_port", String(serverPort))
        localStorage.setItem("sky_server_ssl", String(useSsl))
        localStorage.setItem("sky_server_custom_url", customUrl)
        localStorage.setItem("sky_backend_api_url", mode === "server" ? targetUrl : "http://127.0.0.1:8000")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      alert(`Failed to apply configuration: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-7 rounded-3xl border border-blue-900/60 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 shadow-inner">
                <Radio className="h-6 w-6 animate-pulse" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Multi-PC Office Networking & Central Server
              </h2>
              <span className="font-[vazirmatn] text-sm sm:text-base font-bold text-sky-200" dir="rtl">
                (سرور شبکه محلی و اتصال چند کامپیوتر)
              </span>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-200 border-blue-400/40 font-mono text-xs font-bold px-2.5 py-0.5">
                Phase 7 Architecture
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-3xl">
              Configure whether this workstation operates as an independent offline PC or connects securely over the office LAN to the central AQ COMPANIES server and PostgreSQL database.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md text-right min-w-[170px]">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Active Status / وضعیت</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span
                  className={`h-3 w-3 rounded-full shrink-0 ${
                    mode === "local"
                      ? "bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                      : activeStatus === "SERVER_READY"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : activeStatus === "OFFLINE"
                      ? "bg-rose-400"
                      : "bg-amber-400 animate-spin"
                  }`}
                />
                <span className="text-sm font-black text-white font-mono tracking-wide">
                  {mode === "local" ? "LOCAL OFFLINE" : activeStatus.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mode 1: Local Offline */}
        <div
          onClick={() => setMode("local")}
          className={`cursor-pointer rounded-3xl p-6 border-2 transition-all duration-200 flex flex-col justify-between ${
            mode === "local"
              ? "bg-blue-50/70 border-blue-600 shadow-lg ring-4 ring-blue-500/15"
              : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`p-3.5 rounded-2xl shadow-sm ${mode === "local" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Laptop className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-lg sm:text-xl">Local Offline Mode</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-500">Standalone Single PC</p>
                    <span className="text-slate-300">•</span>
                    <span className="font-[vazirmatn] text-xs font-bold text-blue-700" dir="rtl">تک کاربره مستقل</span>
                  </div>
                </div>
              </div>
              {mode === "local" && (
                <Badge className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 shrink-0">
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Selected
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-[14.5px] text-slate-700 font-medium mt-4 leading-relaxed">
              All data is saved locally on this machine using the embedded SQLite engine. Ideal for portable laptops, single-PC offices, or fieldwork without internet or network connections.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-100/80 text-blue-900 border border-blue-200/90 font-bold shadow-2xs">
              <HardDrive className="h-4 w-4 text-blue-700" /> Embedded SQLite
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold shadow-2xs">
              ⚡ Zero Network Latency
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold shadow-2xs">
              🔒 100% Offline
            </span>
          </div>
        </div>

        {/* Mode 2: Central Office Server */}
        <div
          onClick={() => setMode("server")}
          className={`cursor-pointer rounded-3xl p-6 border-2 transition-all duration-200 flex flex-col justify-between ${
            mode === "server"
              ? "bg-emerald-50/70 border-emerald-600 shadow-lg ring-4 ring-emerald-500/15"
              : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md"
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className={`p-3.5 rounded-2xl shadow-sm ${mode === "server" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Server className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-lg sm:text-xl">Central Server Mode</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-500">Multi-PC Office Network</p>
                    <span className="text-slate-300">•</span>
                    <span className="font-[vazirmatn] text-xs font-bold text-emerald-700" dir="rtl">شبکه چند کامپیوتر اداری</span>
                  </div>
                </div>
              </div>
              {mode === "server" && (
                <Badge className="bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 shrink-0">
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Selected
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-[14.5px] text-slate-700 font-medium mt-4 leading-relaxed">
              Connects over the office LAN to the central server and PostgreSQL database. Multiple workstations collaborate seamlessly with live updates, automatic sequential numbers, and conflict protection.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 border border-emerald-200/90 font-bold shadow-2xs">
              <Database className="h-4 w-4 text-emerald-700" /> PostgreSQL Ready
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold shadow-2xs">
              🛡️ Concurrency Safe
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold shadow-2xs">
              🌐 Multi-PC LAN
            </span>
          </div>
        </div>
      </div>

      {/* Server Configuration Parameters */}
      <Card className={`border-2 rounded-3xl shadow-md transition-all bg-white ${mode === "server" ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-200/90"}`}>
        <CardHeader className="pb-4 pt-6 px-6 sm:px-7 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-600" />
                  Central Server Connection Settings
                </CardTitle>
                <span className="font-[vazirmatn] text-sm font-bold text-slate-500" dir="rtl">
                  (تنظیمات اتصال به سرور مرکزی)
                </span>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-600 font-medium">
                Specify the IP address or host name of the computer hosting the AQ COMPANIES server.
              </CardDescription>
            </div>
            {mode === "server" ? (
              <Badge variant="outline" className="text-emerald-800 border-emerald-400 bg-emerald-50 font-black text-xs px-3 py-1 rounded-full shadow-2xs">
                ● Active Target
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-600 border-slate-300 bg-slate-50 font-bold text-xs px-3 py-1 rounded-full">
                Offline Mode Selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6 sm:p-7">
          {mode === "local" && (
            <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-3 flex-wrap text-xs sm:text-sm text-blue-950">
              <div className="flex items-center gap-2.5">
                <Laptop className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                <span className="font-semibold">
                  Workstation is currently in <strong>Local Offline Mode</strong>. You can configure and test your office LAN server settings below at any time.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMode("server")}
                className="bg-white hover:bg-blue-600 hover:text-white border-blue-300 text-blue-800 font-bold text-xs shrink-0 cursor-pointer transition shadow-2xs"
              >
                Switch to Central Server Mode
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-900">Server Host / IP Address</Label>
                <span className="font-[vazirmatn] text-xs font-semibold text-slate-500" dir="rtl">آدرس سرور یا آی‌پی</span>
              </div>
              <Input
                placeholder="192.168.1.100 or server.office.local"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                className="font-mono text-base font-bold text-slate-950 bg-slate-50/70 border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl h-12 px-4 shadow-2xs"
              />
              <p className="text-xs font-medium text-slate-500">
                Enter the local LAN IP address of your main office server (e.g. 192.168.1.100).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-900">Port</Label>
                <span className="font-[vazirmatn] text-xs font-semibold text-slate-500" dir="rtl">پورت</span>
              </div>
              <Input
                type="number"
                placeholder="8000"
                value={serverPort}
                onChange={(e) => setServerPort(parseInt(e.target.value, 10) || 8000)}
                className="font-mono text-base font-bold text-slate-950 bg-slate-50/70 border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl h-12 px-4 shadow-2xs"
              />
              <p className="text-xs font-medium text-slate-500">Default API port is 8000.</p>
            </div>
          </div>

          <div className="pt-1">
            <label className="inline-flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-800 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
              <input
                type="checkbox"
                checked={useSsl}
                onChange={(e) => setUseSsl(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Use HTTPS / SSL Encryption</span>
              <span className="font-[vazirmatn] text-xs font-medium text-slate-500" dir="rtl">(استفاده از پروتکل امن HTTPS)</span>
            </label>
          </div>

          {/* Test & Action Controls */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleTestConnection}
                disabled={testing}
                className="h-11 px-5 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer transition"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2 text-blue-600" />
                    Testing Handshake...
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2 text-emerald-600" />
                    Test Connection
                  </>
                )}
              </Button>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200/90 text-xs sm:text-sm font-mono font-bold text-slate-800 shadow-2xs">
                <span className="text-slate-500 uppercase tracking-wider text-[11px]">Target:</span>
                <span className="text-blue-900">{buildTargetUrl()}</span>
              </div>
            </div>

            <Button
              type="button"
              size="default"
              onClick={handleSaveAndApply}
              disabled={saving}
              className={`h-11 px-7 rounded-xl text-sm sm:text-base font-black shadow-md cursor-pointer transition-all ${
                mode === "server"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Applying Configuration...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Configuration Saved!
                </>
              ) : (
                "Save & Apply Connection Mode"
              )}
            </Button>
          </div>

          {/* Test Feedback Result */}
          {testResult && (
            <div
              className={`p-5 rounded-2xl border-2 mt-4 transition-all shadow-sm ${
                testResult.success
                  ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                  : "bg-rose-50 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {testResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-black text-base">
                      {testResult.success
                        ? "Connection Successful — Server Verified Ready"
                        : "Connection Failed"}
                    </h4>
                    {testResult.latencyMs !== undefined && (
                      <Badge className="bg-emerald-600 text-white font-mono text-xs font-bold px-3 py-0.5 rounded-full">
                        {testResult.latencyMs} ms latency
                      </Badge>
                    )}
                  </div>
                  {testResult.success && testResult.serverInfo ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/90 shadow-2xs">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">Server Name</span>
                        <span className="font-black text-slate-950 text-sm">{testResult.serverInfo.server_name}</span>
                      </div>
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/90 shadow-2xs">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">Backend Engine</span>
                        <span className="font-black text-slate-950 text-sm capitalize">{testResult.serverInfo.database_type}</span>
                      </div>
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/90 shadow-2xs">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">Server Version</span>
                        <span className="font-black text-slate-950 text-sm">v{testResult.serverInfo.version}</span>
                      </div>
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-200/90 shadow-2xs">
                        <span className="text-slate-500 block text-[11px] uppercase font-bold">Maintenance</span>
                        <span className="font-black text-slate-950 text-sm">
                          {testResult.serverInfo.maintenance_mode ? "Enabled" : "Normal Operations"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-rose-800 leading-relaxed font-mono font-semibold">
                      {testResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Architectural Safety Guarantees Notice */}
      <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-blue-100">
          <div className="flex items-center gap-2.5 font-black text-base text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tracking-tight">Data Safety & Office Network Invariance Rules</span>
                <Badge variant="outline" className="bg-blue-100/70 text-blue-800 border-blue-300/80 font-black text-[10px] uppercase tracking-wider">
                  System Invariance
                </Badge>
              </div>
              <p className="font-[vazirmatn] text-xs font-semibold text-slate-500 mt-0.5" dir="rtl">
                اصول ایمنی داده‌ها و تضمین‌های یکپارچگی معماری شبکه اداری
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/90 shadow-2xs inline-flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Enterprise Guard Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Rule 1 */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <HardDrive className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Zero Corruption
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">Zero Network Share SQLite Corruption</h4>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                The SQLite database is never placed in shared Windows SMB network folders, OneDrive, Dropbox, or Google Drive sync directories.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Radio className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  API-Driven
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">API-Driven Multi-Client Architecture</h4>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Workstations communicate strictly over HTTP/REST API with the Central Server. Clients do not hold raw database locks.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Concurrency
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">Optimistic Concurrency Protection</h4>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Edits to BOLs, Invoices, and Ledgers are validated by revision version numbers. If another staff member updates simultaneously, conflict protection preserves your draft.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Accounting Invariance
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-snug">Mathematical Accounting Invariance</h4>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                Debits and Credits are verified mathematically across both SQLite and PostgreSQL:
              </p>
              <div className="mt-1.5 font-mono text-[10px] font-black text-blue-900 bg-blue-50/90 py-1 px-2 rounded-lg border border-blue-200 text-center tracking-tight">
                Net Balance = Debit - Credit
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
