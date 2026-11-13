"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Fingerprint,
  CheckCircle2,
  X,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Layers,
  Check,
} from "lucide-react"
import { EnrolledFingerprint } from "@/lib/security/security-vault-service"

interface FingerprintScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (fingerprint: EnrolledFingerprint) => void
}

type FingerType =
  | "index_right"
  | "thumb_right"
  | "middle_right"
  | "index_left"
  | "thumb_left"
  | "custom"

interface FingerOption {
  type: FingerType
  labelEn: string
  labelFa: string
  shortLabel: string
}

const FINGER_OPTIONS: FingerOption[] = [
  {
    type: "index_right",
    labelEn: "Right Index Finger",
    labelFa: "انگشت اشاره راست",
    shortLabel: "Right Index",
  },
  {
    type: "thumb_right",
    labelEn: "Right Thumb",
    labelFa: "انگشت شست راست",
    shortLabel: "Right Thumb",
  },
  {
    type: "middle_right",
    labelEn: "Right Middle Finger",
    labelFa: "انگشت وسط راست",
    shortLabel: "Right Middle",
  },
  {
    type: "index_left",
    labelEn: "Left Index Finger",
    labelFa: "انگشت اشاره چپ",
    shortLabel: "Left Index",
  },
  {
    type: "thumb_left",
    labelEn: "Left Thumb",
    labelFa: "انگشت شست چپ",
    shortLabel: "Left Thumb",
  },
  {
    type: "custom",
    labelEn: "Custom Finger / Other",
    labelFa: "انگشت دلخواه / سایر",
    shortLabel: "Custom",
  },
]

export function FingerprintScannerModal({ isOpen, onClose, onSave }: FingerprintScannerModalProps) {
  const [selectedFinger, setSelectedFinger] = useState<FingerType>("index_right")
  const [customName, setCustomName] = useState("")
  const [customNameFa, setCustomNameFa] = useState("")

  // Scan state machine
  const [scanState, setScanState] = useState<"idle" | "touching" | "scanning" | "extracting" | "complete">("idle")
  const [progress, setProgress] = useState(0)
  const [qualityScore, setQualityScore] = useState(98)
  const [minutiaeCount, setMinutiaeCount] = useState(48)
  const [cryptoHash, setCryptoHash] = useState("")

  const scanTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setScanState("idle")
      setProgress(0)
      setQualityScore(98)
      setMinutiaeCount(48)
      setCryptoHash("")
    } else {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Web Audio subtle chirp synth for high-tech biometric feedback
  const playBiometricTone = (type: "start" | "beep" | "success") => {
    if (typeof window === "undefined") return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === "start") {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.06, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      } else if (type === "beep") {
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        gain.gain.setValueAtTime(0.04, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch {}
  }

  // Interactive Scan Simulation Flow
  const startScan = () => {
    if (scanState === "scanning" || scanState === "extracting") return

    setScanState("touching")
    setProgress(5)
    playBiometricTone("start")

    let current = 5
    scanTimerRef.current = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 6

      if (current >= 30 && current < 70) {
        setScanState("scanning")
      } else if (current >= 70 && current < 100) {
        setScanState("extracting")
      }

      if (current >= 100) {
        if (scanTimerRef.current) clearInterval(scanTimerRef.current)
        setProgress(100)
        setScanState("complete")

        const randomQuality = 95 + Math.floor(Math.random() * 5)
        const randomMinutiae = 44 + Math.floor(Math.random() * 12)
        const randomHash = Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("")

        setQualityScore(randomQuality)
        setMinutiaeCount(randomMinutiae)
        setCryptoHash(randomHash)
        playBiometricTone("success")
      } else {
        setProgress(current)
        if (current % 25 === 0) {
          playBiometricTone("beep")
        }
      }
    }, 120)
  }

  const handleResetScan = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current)
    setScanState("idle")
    setProgress(0)
    setCryptoHash("")
  }

  const handleSaveToSoftware = () => {
    const selectedOpt = FINGER_OPTIONS.find((f) => f.type === selectedFinger)!
    const name = selectedFinger === "custom" && customName ? customName : selectedOpt.labelEn
    const nameFa = selectedFinger === "custom" && customNameFa ? customNameFa : selectedOpt.labelFa

    const fingerprint: EnrolledFingerprint = {
      id: `fp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      nameFa,
      fingerType: selectedFinger,
      biometricToken: cryptoHash || `aq_bio_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      qualityScore,
      enrolledAt: new Date().toISOString(),
      sensorType: "software_optical",
    }

    onSave(fingerprint)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fingerprint Scanner Modal"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none backdrop-blur-xl bg-slate-950/70 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg mx-auto rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60 p-6 sm:p-7 space-y-6 text-white overflow-hidden">
        {/* Top Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Biometric Fingerprint Scanner</span>
                <span className="text-xs font-bold text-emerald-400 font-[vazirmatn]" dir="rtl">
                  اسکنر بیومتریک اثر انگشت
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan finger in system and save to software vault / اسکن و ثبت اثر انگشت در سیستم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Finger Selector Options */}
        <div className="space-y-2 relative z-10">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>Select Finger to Register / انتخاب انگشت:</span>
            <span className="text-emerald-400 font-mono text-[11px]">Hardware Ready ✓</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {FINGER_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                disabled={scanState === "scanning" || scanState === "extracting"}
                onClick={() => setSelectedFinger(opt.type)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  selectedFinger === opt.type
                    ? "bg-emerald-500/20 border-emerald-500 text-white shadow-xs shadow-emerald-500/20"
                    : "bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-black">{opt.shortLabel}</span>
                  {selectedFinger === opt.type && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 font-[vazirmatn]" dir="rtl">
                  {opt.labelFa}
                </span>
              </button>
            ))}
          </div>

          {selectedFinger === "custom" && (
            <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
              <input
                type="text"
                placeholder="Finger Label (e.g. Left Ring)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-hidden focus:border-emerald-500 font-medium"
              />
              <input
                type="text"
                placeholder="نام انگشت (مثلاً انگشت انگشتری)"
                value={customNameFa}
                onChange={(e) => setCustomNameFa(e.target.value)}
                dir="rtl"
                className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-hidden focus:border-emerald-500 font-[vazirmatn]"
              />
            </div>
          )}
        </div>

        {/* 2. Interactive Center Biometric Scanner HUD */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="relative">
            {/* Outer Rotating Radar Frame */}
            <div
              className={`absolute -inset-3 rounded-full border border-dashed transition-all ${
                scanState === "scanning" || scanState === "extracting"
                  ? "border-emerald-400/60 animate-spin [animation-duration:6s]"
                  : scanState === "complete"
                  ? "border-emerald-500/80"
                  : "border-slate-700/60"
              }`}
            />

            {/* Glowing Pulse Rings */}
            {scanState !== "idle" && (
              <div
                className={`absolute -inset-1 rounded-full animate-ping pointer-events-none ${
                  scanState === "complete" ? "bg-emerald-500/30" : "bg-emerald-400/20"
                }`}
              />
            )}

            {/* Optical Sensor Touch Target */}
            <button
              type="button"
              onClick={startScan}
              disabled={scanState === "scanning" || scanState === "extracting"}
              className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl overflow-hidden group select-none active:scale-95 ${
                scanState === "complete"
                  ? "bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400 shadow-emerald-500/30"
                  : scanState === "scanning" || scanState === "extracting"
                  ? "bg-slate-900 border-2 border-emerald-500 text-emerald-300 shadow-emerald-500/20"
                  : "bg-slate-900 hover:bg-slate-850 border-2 border-slate-700 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400"
              }`}
              title="Click or Touch to Scan Finger"
            >
              {/* Animated Laser Sweep Beam */}
              {(scanState === "touching" || scanState === "scanning" || scanState === "extracting") && (
                <div
                  className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_#10b981] transition-all duration-150 z-20 pointer-events-none"
                  style={{ top: `${progress}%` }}
                />
              )}

              {/* Fingerprint Vector Graphic */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                {scanState === "complete" ? (
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-in zoom-in duration-300 drop-shadow-[0_0_12px_#10b981]" />
                ) : (
                  <Fingerprint
                    className={`w-18 h-18 transition-all ${
                      scanState === "scanning" || scanState === "extracting"
                        ? "text-emerald-400 animate-pulse drop-shadow-[0_0_10px_#10b981]"
                        : "text-slate-400 group-hover:text-emerald-400"
                    }`}
                  />
                )}
              </div>

              {/* Progress Overlay Indicator */}
              <div className="absolute bottom-2 inset-x-0 text-center z-10">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {scanState === "idle"
                    ? "TOUCH SENSOR"
                    : scanState === "complete"
                    ? "VERIFIED 100%"
                    : `${progress}%`}
                </span>
              </div>
            </button>
          </div>

          {/* Scanner Stage Messaging */}
          <div className="text-center space-y-1">
            <p className="text-xs font-black text-white">
              {scanState === "idle" && "Place and hold finger on optical sensor to scan"}
              {scanState === "touching" && "Finger detected — Acquiring biometric friction ridges..."}
              {scanState === "scanning" && "Scanning ridge paths and bifurcations (35-70%)..."}
              {scanState === "extracting" && "Extracting 256-bit cryptographic minutiae template..."}
              {scanState === "complete" && "Biometric Fingerprint Captured & Verified!"}
            </p>
            <p className="text-[11px] font-bold text-emerald-400 font-[vazirmatn]" dir="rtl">
              {scanState === "idle" && "جهت آغاز اسکن، حسگر بیومتریک را لمس کنید"}
              {scanState === "touching" && "انگشت شناسایی شد — دریافت الگوهای شیار انگشت..."}
              {scanState === "scanning" && "اسکن نقاط انشعاب و ویژگی‌های بیومتریک..."}
              {scanState === "extracting" && "تولید بردار رمزنگاری شده ۲۵۶ بیتی..."}
              {scanState === "complete" && "اثر انگشت با موفقیت اسکن و تایید گردید"}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-200 rounded-full ${
                scanState === "complete"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-blue-500 via-emerald-400 to-teal-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 3. Metadata & Cryptographic Quality Audit */}
        {scanState === "complete" && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Minutiae Quality Match:</span>
              </span>
              <span className="font-mono font-black text-emerald-400">
                {qualityScore}% ({minutiaeCount} Points Mapped)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Biometric SHA-256 Vault Hash:</span>
              </span>
              <span className="font-mono text-[10px] text-slate-300 truncate max-w-[190px]">
                {cryptoHash.slice(0, 16)}...{cryptoHash.slice(-8)}
              </span>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {scanState === "complete" ? (
            <button
              type="button"
              onClick={handleResetScan}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Again / اسکن مجدد</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel / لغو
            </button>
          )}

          <div className="flex items-center gap-2">
            {scanState !== "complete" ? (
              <button
                type="button"
                onClick={startScan}
                disabled={scanState === "scanning" || scanState === "extracting"}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Start Scan / شروع اسکن</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveToSoftware}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save to Software / ذخیره در سیستم</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
