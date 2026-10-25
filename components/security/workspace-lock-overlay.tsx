"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSecurityLock } from "@/lib/security/use-security-lock"
import { useApp } from "@/lib/app-context"
import {
  Fingerprint,
  ScanFace,
  KeyRound,
  Lock,
  ShieldCheck,
  Camera,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react"

export function WorkspaceLockOverlay() {
  const {
    isLocked,
    securitySettings,
    activeLockMethods,
    isLockedOut,
    lockoutRemainingSeconds,
    unlockWithFingerprint,
    unlockWithFace,
    unlockWithPin,
    unlockWithPassword,
  } = useSecurityLock()

  const { currentUser } = useApp()

  // Selected Tab: Default to fingerprint, pin, or password
  const [selectedMethod, setSelectedMethod] = useState<"fingerprint" | "face" | "pin" | "password">("pin")

  // PIN Input State
  const pinLength = securitySettings.pinLength || 4
  const [pinDigits, setPinDigits] = useState<string[]>([])
  const [pinShake, setPinShake] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  // Password State
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Face Scan HUD State
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [faceScanProgress, setFaceScanProgress] = useState(0)
  const [faceScanStatus, setFaceScanStatus] = useState<"idle" | "scanning" | "matched" | "failed">("idle")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Set initial preferred unlock method based on enabled settings
  useEffect(() => {
    if (securitySettings.fingerprintEnabled) {
      setSelectedMethod("fingerprint")
    } else if (securitySettings.pinEnabled) {
      setSelectedMethod("pin")
    } else if (securitySettings.faceLockEnabled) {
      setSelectedMethod("face")
    } else {
      setSelectedMethod("password")
    }
  }, [securitySettings.fingerprintEnabled, securitySettings.pinEnabled, securitySettings.faceLockEnabled])

  // Camera stream lifecycle for Face tab
  useEffect(() => {
    if (isLocked && selectedMethod === "face" && securitySettings.faceLockType === "camera_hud") {
      let isMounted = true
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } } })
        .then((stream) => {
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
          setIsCameraActive(true)
        })
        .catch(() => {
          setIsCameraActive(false)
        })

      return () => {
        isMounted = false
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        setIsCameraActive(false)
      }
    }
  }, [isLocked, selectedMethod, securitySettings.faceLockType])

  // Tactile PIN Numpad Handlers
  const handlePinDigit = async (digit: string) => {
    if (isLockedOut || pinLoading) return
    if (pinDigits.length >= pinLength) return

    const next = [...pinDigits, digit]
    setPinDigits(next)

    if (next.length === pinLength) {
      setPinLoading(true)
      const pinStr = next.join("")
      const success = await unlockWithPin(pinStr)
      setPinLoading(false)
      if (success) {
        setPinDigits([])
      } else {
        setPinShake(true)
        setTimeout(() => {
          setPinShake(false)
          setPinDigits([])
        }, 600)
      }
    }
  }

  const handlePinBackspace = () => {
    if (pinDigits.length > 0) {
      setPinDigits((prev) => prev.slice(0, -1))
    }
  }

  const handlePinClear = () => {
    setPinDigits([])
  }

  // Keyboard support for PIN entry
  useEffect(() => {
    if (!isLocked || selectedMethod !== "pin") return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        void handlePinDigit(e.key)
      } else if (e.key === "Backspace") {
        e.preventDefault()
        handlePinBackspace()
      } else if (e.key === "Escape") {
        e.preventDefault()
        handlePinClear()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLocked, selectedMethod, pinDigits, pinLength, isLockedOut, pinLoading])

  // Face Scan Animation Trigger
  const triggerFaceScan = async () => {
    setFaceScanStatus("scanning")
    setFaceScanProgress(10)

    const interval = setInterval(() => {
      setFaceScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 20
      })
    }, 150)

    await new Promise((r) => setTimeout(r, 900))
    clearInterval(interval)
    setFaceScanProgress(100)
    setFaceScanStatus("matched")

    await new Promise((r) => setTimeout(r, 400))
    await unlockWithFace()
    setFaceScanStatus("idle")
    setFaceScanProgress(0)
  }

  // Master Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || passwordLoading || isLockedOut) return
    setPasswordLoading(true)
    const success = await unlockWithPassword(password)
    setPasswordLoading(false)
    if (success) {
      setPassword("")
    }
  }

  if (!isLocked) return null

  const userName = currentUser?.name || "System Administrator"
  const userHandle = currentUser?.username ? `@${currentUser.username}` : "@admin"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workspace Lock Screen"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none backdrop-blur-[28px] bg-slate-900/60 dark:bg-black/75 animate-in fade-in duration-300"
      style={{ WebkitBackdropFilter: "blur(28px) saturate(180%)" }}
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-500/15 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-emerald-500/15 blur-[100px]" />
      </div>

      {/* Main Frosted Glass Hub Card */}
      <div className="relative w-full max-w-md mx-auto rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-700/80 shadow-2xl shadow-black/30 p-6 sm:p-8 space-y-6">
        {/* Emblem & Active User Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-black text-amber-400 font-mono tracking-tighter">AQ</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{userName}</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{userHandle}</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 inline" /> Protected Vault
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-[vazirmatn] mt-0.5" dir="rtl">
              محیط کاربری قفل شده است — لطفاً هویت خود را احراز نمایید
            </p>
          </div>
        </div>

        {/* Lockout Warning Banner */}
        {isLockedOut && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Too many failed attempts. Wait {lockoutRemainingSeconds}s / تلاش‌های مکرر ناموفق. لطفاً{" "}
              {lockoutRemainingSeconds} ثانیه شکیبا باشید.
            </span>
          </div>
        )}

        {/* Unlock Method Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setSelectedMethod("fingerprint")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              selectedMethod === "fingerprint"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="Fingerprint / اثر انگشت"
          >
            <Fingerprint className="w-4 h-4" />
            <span className="text-[10px]">Touch ID</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod("face")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              selectedMethod === "face"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="Face Recognition / تشخیص چهره"
          >
            <ScanFace className="w-4 h-4" />
            <span className="text-[10px]">Face ID</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod("pin")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              selectedMethod === "pin"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="PIN Pad / رمز پین"
          >
            <KeyRound className="w-4 h-4" />
            <span className="text-[10px]">PIN Code</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod("password")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
              selectedMethod === "password"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            title="Master Password / رمز اصلی"
          >
            <Lock className="w-4 h-4" />
            <span className="text-[10px]">Password</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: FINGERPRINT BIOMETRIC SCANNER                                      */}
        {/* ========================================================================= */}
        {selectedMethod === "fingerprint" && (
          <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
            <div className="relative inline-flex items-center justify-center">
              {/* Pulsing Ripple Rings */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500/10 via-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/40 flex items-center justify-center relative shadow-inner">
                <Fingerprint className="w-12 h-12 text-emerald-500 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                Touch sensor to unlock / لمس حسگر اثر انگشت
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {securitySettings.fingerprintDeviceName}
              </p>
            </div>

            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => void unlockWithFingerprint()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Scan Fingerprint / تایید با اثر انگشت</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FACE LOCK RECOGNITION HUD                                         */}
        {/* ========================================================================= */}
        {selectedMethod === "face" && (
          <div className="space-y-4 text-center py-1 animate-in fade-in duration-200">
            {/* Circular HUD Reticle Frame */}
            <div className="relative w-40 h-40 mx-auto rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-xl overflow-hidden">
              <div className="relative w-full h-full rounded-full bg-slate-950 overflow-hidden flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <Camera className="w-8 h-8 text-blue-400" />
                    <span className="text-[10px] font-bold">Live HUD Camera</span>
                  </div>
                )}

                {/* Animated HUD Scan Line */}
                <div
                  className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] transition-all duration-300"
                  style={{ top: `${faceScanProgress}%` }}
                />

                {/* Concentric Rotating Reticle Circle */}
                <div className="absolute inset-2 border border-cyan-400/30 rounded-full border-dashed animate-spin [animation-duration:12s] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                Face ID & AI Verification / تشخیص چهره
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Position your face within the reticle frame
              </p>
            </div>

            <button
              type="button"
              disabled={isLockedOut || faceScanStatus === "scanning"}
              onClick={() => void triggerFaceScan()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ScanFace className="w-4 h-4" />
              <span>
                {faceScanStatus === "scanning"
                  ? "Analyzing Biometrics..."
                  : "Verify Face / تایید هویت چهره"}
              </span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TACTILE QUICK PIN PAD                                             */}
        {/* ========================================================================= */}
        {selectedMethod === "pin" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Masked Dot Indicators */}
            <div
              className={`flex items-center justify-center gap-3 py-2 ${
                pinShake ? "animate-[shake_0.5s_ease-in-out]" : ""
              }`}
            >
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = idx < pinDigits.length
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? "bg-blue-600 border-blue-600 scale-110 shadow-xs shadow-blue-500/50"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    }`}
                  />
                )
              })}
            </div>

            {/* Tactile 3x4 Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isLockedOut || pinLoading}
                  onClick={() => void handlePinDigit(num)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-95 text-slate-800 dark:text-white font-mono font-black text-lg transition-all flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs cursor-pointer disabled:opacity-40"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handlePinClear}
                disabled={isLockedOut || pinLoading || pinDigits.length === 0}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-95 text-slate-500 text-xs font-bold transition-all flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 cursor-pointer disabled:opacity-40"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={isLockedOut || pinLoading}
                onClick={() => void handlePinDigit("0")}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-95 text-slate-800 dark:text-white font-mono font-black text-lg transition-all flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 shadow-xs cursor-pointer disabled:opacity-40"
              >
                0
              </button>

              <button
                type="button"
                onClick={handlePinBackspace}
                disabled={isLockedOut || pinLoading || pinDigits.length === 0}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 active:scale-95 text-slate-500 transition-all flex items-center justify-center border border-slate-200/80 dark:border-slate-700/60 cursor-pointer disabled:opacity-40"
                title="Backspace / حذف رقم آخر"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MASTER PASSWORD FALLBACK                                           */}
        {/* ========================================================================= */}
        {selectedMethod === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5">
                Master Account Password / رمز عبور اصلی
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoFocus
                  required
                  disabled={isLockedOut || passwordLoading}
                  className="w-full h-11 px-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl focus:bg-white focus:border-amber-500 dark:focus:bg-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLockedOut || passwordLoading || !password}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{passwordLoading ? "Verifying..." : "Unlock Workspace / بازگشایی سیستم"}</span>
            </button>
          </form>
        )}

        {/* Footer Hotkey & Security Hint */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>AQ Companies Vault v5.2</span>
          <span>Hotkey: Cmd/Ctrl + L</span>
        </div>
      </div>
    </div>
  )
}
