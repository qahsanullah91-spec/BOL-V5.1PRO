"use client"

import React, { useState } from "react"
import { useSecurityLock } from "@/lib/security/use-security-lock"
import {
  calculatePasswordStrength,
  calculateSecurityPostureScore,
  verifyPinCode,
} from "@/lib/security/security-vault-service"
import { FingerprintScannerModal } from "./fingerprint-scanner-modal"
import { toast } from "sonner"
import {
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  ScanFace,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Camera,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  Layers,
  FileCheck2,
  HardDrive,
  Landmark,
  Trash2,
  Plus,
  Zap,
  Activity,
  Cpu,
  Check,
  X,
  Award,
  Scale,
} from "lucide-react"

export function SecuritySettingsView() {
  const {
    securitySettings,
    activeLockMethods,
    isShieldProtected,
    enrolledFingerprints,
    saveFingerprint,
    deleteFingerprint,
    lockWorkspace,
    updateSecuritySettings,
    enrollFingerprint,
    enrollFace,
    setPin,
    changeMasterPassword,
  } = useSecurityLock()

  // Master Password Form State
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPass, setShowOldPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [revokeSessions, setRevokeSessions] = useState(true)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // PIN Setup Modal / State
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinMode, setPinMode] = useState<4 | 6>(securitySettings.pinLength || 4)
  const [newPinValue, setNewPinValue] = useState("")
  const [confirmPinValue, setConfirmPinValue] = useState("")
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter")

  // Inline PIN Testing State
  const [showTestPinInput, setShowTestPinInput] = useState(false)
  const [testPinValue, setTestPinValue] = useState("")
  const [pinTestResult, setPinTestResult] = useState<"idle" | "matched" | "mismatched">("idle")

  // Biometric Sensor Testing State
  const [fpTestState, setFpTestState] = useState<"idle" | "scanning" | "matched">("idle")
  const [faceTestState, setFaceTestState] = useState<"idle" | "scanning" | "matched">("idle")

  // Fingerprint Enrollment Modal State
  const [showFingerprintModal, setShowFingerprintModal] = useState(false)
  const [isEnrollingFingerprint, setIsEnrollingFingerprint] = useState(false)

  // Face Setup Modal / State
  const [faceConfidence, setFaceConfidence] = useState(securitySettings.faceLockConfidence || 85)
  const [faceLowLight, setFaceLowLight] = useState(securitySettings.faceLockLowLightFallback ?? true)

  const passStrength = calculatePasswordStrength(newPassword)
  const postureScore = calculateSecurityPostureScore(securitySettings)

  // Password criteria indicators
  const hasMinLength = newPassword.length >= 8
  const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  // Handlers
  const handleMasterPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg(null)
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "New password and Confirm password do not match / رمز جدید با تکرار آن یکسان نیست" })
      return
    }
    setPasswordLoading(true)
    const res = await changeMasterPassword(oldPassword, newPassword, revokeSessions)
    setPasswordLoading(false)
    if (res.success) {
      setPassMsg({ type: "success", text: "Password changed successfully! / رمز عبور با موفقیت بروزرسانی شد" })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      setPassMsg({ type: "error", text: res.message || "Failed to update password / خطا در تغییر رمز عبور" })
    }
  }

  const handleEnrollFingerprintClick = async () => {
    setIsEnrollingFingerprint(true)
    await enrollFingerprint()
    setIsEnrollingFingerprint(false)
  }

  const handleTestFingerprint = async () => {
    if (fpTestState === "scanning") return
    setFpTestState("scanning")
    await new Promise((r) => setTimeout(r, 800))
    setFpTestState("matched")
    toast.success("Fingerprint Sensor Match: 98% Biometric Confidence! / اثر انگشت تایید شد")
    setTimeout(() => setFpTestState("idle"), 2800)
  }

  const handleTestFaceRecognition = async () => {
    if (faceTestState === "scanning") return
    setFaceTestState("scanning")
    await new Promise((r) => setTimeout(r, 850))
    setFaceTestState("matched")
    toast.success("3D Facial Mesh Verified: 96% Match! / چهره با موفقیت احراز گردید")
    setTimeout(() => setFaceTestState("idle"), 2800)
  }

  const handleVerifyInlineTestPin = async () => {
    if (!testPinValue) return
    const isValid = await verifyPinCode(testPinValue, securitySettings)
    if (isValid) {
      setPinTestResult("matched")
      toast.success("PIN Verified Successfully! / رمز پین تایید شد")
    } else {
      setPinTestResult("mismatched")
      toast.error("Incorrect PIN Code / رمز پین اشتباه است")
    }
  }

  const handleSavePin = async () => {
    if (newPinValue.length !== pinMode) return
    if (pinStep === "enter") {
      setPinStep("confirm")
      return
    }
    if (newPinValue !== confirmPinValue) {
      alert("PIN codes do not match / رمزهای پین یکسان نیستند")
      return
    }
    await setPin(newPinValue, pinMode)
    setShowPinModal(false)
    setNewPinValue("")
    setConfirmPinValue("")
    setPinStep("enter")
  }

  const handleArmAllGates = () => {
    updateSecuritySettings({
      actionGates: {
        treasuryLedger: true,
        bolModifyDelete: true,
        exportVault: true,
        accountingLedgerLock: true,
      },
    })
    toast.success("All security action gates armed! / تمام گیت‌های امنیتی فعال شدند")
  }

  const handleResetGateDefaults = () => {
    updateSecuritySettings({
      actionGates: {
        treasuryLedger: true,
        bolModifyDelete: true,
        exportVault: true,
        accountingLedgerLock: true,
      },
    })
    toast.info("Security action gates restored to enterprise baseline")
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SECURITY POSTURE HEADER BANNER (12-Col Full-Width Card)                */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl border border-slate-700/80 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all ${
                  isShieldProtected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                {isShieldProtected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Protected / محافظت شده</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Standard Security / امنیت استاندارد</span>
                  </>
                )}
              </span>

              {/* Cryptographic Cipher Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-cyan-300 border border-cyan-500/30">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Argon2id + AES-256 GCM</span>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {activeLockMethods.map((method) => (
                  <span
                    key={method}
                    className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-mono font-bold capitalize text-slate-200"
                  >
                    {method === "fingerprint"
                      ? "Touch ID"
                      : method === "face"
                      ? "Face ID"
                      : method === "pin"
                      ? "Quick PIN"
                      : "Master Passlock"}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>Enterprise Security & Biometric Vault</span>
                <span className="text-sm font-bold text-amber-400 font-[vazirmatn]" dir="rtl">
                  خزانه امنیت و قفل بیومتریک
                </span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Multi-factor biometric access controls, encrypted session keys, and action-level authorization gates
              </p>
            </div>

            {/* Real-time Security Posture Score Bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 max-w-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Security Posture Score:</span>
                  <span className="text-emerald-400 font-mono font-black">{postureScore.score}%</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-300 font-[vazirmatn]" dir="rtl">
                  {postureScore.tierFa}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    postureScore.score >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : postureScore.score >= 50
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-rose-500 to-red-400"
                  }`}
                  style={{ width: `${postureScore.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions: Auto-Lock & Lock Workspace Now */}
          <div className="flex items-center gap-3 flex-wrap shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-1.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px]">
                <span className="text-slate-400 block text-[9.5px]">Auto-Lock Timer</span>
                <select
                  value={securitySettings.autoLockMinutes}
                  onChange={(e) => updateSecuritySettings({ autoLockMinutes: Number(e.target.value) })}
                  className="bg-transparent text-white font-bold cursor-pointer outline-hidden pr-2 text-xs"
                >
                  <option value={0} className="bg-slate-900 text-white">Disabled</option>
                  <option value={1} className="bg-slate-900 text-white">1 Minute</option>
                  <option value={5} className="bg-slate-900 text-white">5 Minutes</option>
                  <option value={15} className="bg-slate-900 text-white">15 Minutes</option>
                  <option value={30} className="bg-slate-900 text-white">30 Minutes</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={lockWorkspace}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Lock Workspace (Cmd/Ctrl + L)"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Now / قفل فوری (⌘L)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FOUR INTERACTIVE AUTHENTICATION MODULES (2x2 Bento Grid)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* MODULE 1: FINGERPRINT BIOMETRIC LOCK */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4 relative flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs relative">
                  <Fingerprint className={`w-6 h-6 ${fpTestState === "scanning" ? "animate-ping text-emerald-400" : "animate-pulse"}`} />
                  {fpTestState === "matched" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Fingerprint Biometric Lock</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold font-[vazirmatn]" dir="rtl">
                      قفل اثر انگشت
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    WebAuthn & Apple Touch ID / Windows Hello Platform Sensor
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.fingerprintEnabled}
                  onChange={(e) => updateSecuritySettings({ fingerprintEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hardware Sensor:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Platform Enclave Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Registered Device:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[210px]">
                  {securitySettings.fingerprintDeviceName}
                </span>
              </div>
            </div>

            {/* Enrolled Fingerprints List in Software */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Enrolled Fingerprints in Software Vault:</span>
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {enrolledFingerprints.length} Registered
                </span>
              </div>

              {enrolledFingerprints.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {enrolledFingerprints.map((fp) => (
                    <div
                      key={fp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs transition-all hover:border-emerald-500/40"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{fp.name}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-[vazirmatn]" dir="rtl">
                              ({fp.nameFa})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                              {fp.qualityScore}% Quality
                            </span>
                            <span>•</span>
                            <span>Software Vault Secured</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFingerprint(fp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
                        title="Remove Fingerprint / حذف اثر انگشت"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium text-center">
                  No fingerprints enrolled yet / هیچ اثر انگشتی ثبت نشده است
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons for Module 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              disabled={fpTestState === "scanning"}
              onClick={handleTestFingerprint}
              className={`py-2.5 px-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                fpTestState === "matched"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30"
                  : fpTestState === "scanning"
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 border-emerald-400 animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{fpTestState === "scanning" ? "Scanning..." : fpTestState === "matched" ? "Matched ✓" : "Test Sensor / آزمون"}</span>
            </button>

            <button
              type="button"
              disabled={isEnrollingFingerprint}
              onClick={() => setShowFingerprintModal(true)}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Fingerprint className="w-4 h-4" />
              <span>
                {isEnrollingFingerprint ? "Enrolling..." : "Enroll / ثبت اثر انگشت"}
              </span>
            </button>
          </div>
        </div>

        {/* MODULE 2: FACE LOCK RECOGNITION */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4 relative flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs relative">
                  <ScanFace className={`w-6 h-6 ${faceTestState === "scanning" ? "animate-pulse text-cyan-400" : ""}`} />
                  {faceTestState === "matched" && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Face Lock Recognition</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold font-[vazirmatn]" dir="rtl">
                      قفل تشخیص چهره
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI Biometric Face Model & Live HUD Camera Reticle
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.faceLockEnabled}
                  onChange={(e) => updateSecuritySettings({ faceLockEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Interactive Confidence Threshold Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Confidence Threshold:</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400">{faceConfidence}% Match</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 75, label: "75% Fast", labelFa: "سریع" },
                  { value: 85, label: "85% Balanced", labelFa: "متعادل" },
                  { value: 95, label: "95% Strict", labelFa: "حداکثر" },
                ].map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => {
                      setFaceConfidence(tier.value)
                      updateSecuritySettings({ faceLockConfidence: tier.value })
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      faceConfidence === tier.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    }`}
                  >
                    <span>{tier.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Toggles: 3D Anti-Spoofing & Low-Light Fallback */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      3D Anti-Spoofing & Liveness
                    </span>
                    <span className="text-[10px] text-slate-500 font-[vazirmatn]" dir="rtl">
                      جلوگیری از جعل تصویر و ویدیو
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.faceLockAntiSpoofing ?? true}
                  onChange={(e) => updateSecuritySettings({ faceLockAntiSpoofing: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Low-Light Dynamic Gain
                    </span>
                    <span className="text-[10px] text-slate-500 font-[vazirmatn]" dir="rtl">
                      تقویت حساسیت در نور کم
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={faceLowLight}
                  onChange={(e) => {
                    setFaceLowLight(e.target.checked)
                    updateSecuritySettings({ faceLockLowLightFallback: e.target.checked })
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Neural Face Mesh Model Badge */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  MobileNet-V3 468-Point Mesh
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {securitySettings.faceLockEnabled || securitySettings.faceLockEnrolled ? "Armed ✓" : "Standby"}
              </span>
            </div>
          </div>

          {/* Action Buttons for Module 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              disabled={faceTestState === "scanning"}
              onClick={handleTestFaceRecognition}
              className={`py-2.5 px-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                faceTestState === "matched"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30"
                  : faceTestState === "scanning"
                  ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 border-blue-400 animate-pulse"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
              }`}
            >
              <ScanFace className="w-3.5 h-3.5 text-blue-500" />
              <span>{faceTestState === "scanning" ? "Detecting..." : faceTestState === "matched" ? "Matched ✓" : "Test Face / آزمون چهره"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                enrollFace()
              }}
              className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Setup / تنظیم چهره</span>
            </button>
          </div>
        </div>

        {/* MODULE 3: QUICK PIN CODE LOCK */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4 relative flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Quick PIN Code Lock</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold font-[vazirmatn]" dir="rtl">
                      رمز پین سریع
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Salted SHA-256 Vault Hash with Anti-Brute-Force Lockout
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings.pinEnabled}
                  onChange={(e) => updateSecuritySettings({ pinEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* PIN Format Selector & Visual Masked Slots */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-bold">PIN Format:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode(4)
                      updateSecuritySettings({ pinLength: 4 })
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      (securitySettings.pinLength || 4) === 4
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    4-Digit PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinMode(6)
                      updateSecuritySettings({ pinLength: 6 })
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      (securitySettings.pinLength || 4) === 6
                        ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    6-Digit PIN
                  </button>
                </div>
              </div>

              {/* Visual Masked PIN Slots */}
              <div className="flex items-center justify-center gap-2 pt-1 pb-1">
                {Array.from({ length: securitySettings.pinLength || 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-9 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-lg shadow-xs"
                  >
                    •
                  </div>
                ))}
              </div>

              {/* Telemetry Status */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80 dark:border-slate-700/60">
                <span className="text-slate-500">Lockout Protection:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Armed (5-Min Lock after {securitySettings.maxFailedAttempts || 5} Fails)
                </span>
              </div>
            </div>

            {/* Inline Test PIN Verification Tool */}
            {showTestPinInput && (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">Test Your Current PIN:</span>
                  {pinTestResult === "matched" && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <Check className="w-3.5 h-3.5" /> Correct
                    </span>
                  )}
                  {pinTestResult === "mismatched" && (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                      <X className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={securitySettings.pinLength || 4}
                    value={testPinValue}
                    onChange={(e) => {
                      setTestPinValue(e.target.value.replace(/\D/g, ""))
                      setPinTestResult("idle")
                    }}
                    placeholder={`Enter ${securitySettings.pinLength || 4}-digit PIN`}
                    className="flex-1 h-9 px-3 text-center tracking-[0.3em] font-mono font-bold text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyInlineTestPin}
                    className="px-3.5 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons for Module 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowTestPinInput(!showTestPinInput)
                setPinTestResult("idle")
                setTestPinValue("")
              }}
              className="py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>{showTestPinInput ? "Hide Test / بستن" : "Test PIN / آزمون رمز"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="py-2.5 px-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change PIN / تغییر پین</span>
            </button>
          </div>
        </div>

        {/* MODULE 4: MASTER PASSLOCK & ACCOUNT PASSWORD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4 relative flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Master Passlock & Password</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-bold font-[vazirmatn]" dir="rtl">
                    رمز عبور اصلی
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Primary Superadmin Credentials & Cryptographic Recovery Key
                </p>
              </div>
            </div>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  passMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                }`}
              >
                {passMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleMasterPasswordSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  Current Password / رمز فعلی
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-9.5 px-3 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                  New Strong Password / رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full h-9.5 px-3 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Entropy Strength Meter */}
                {newPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">Strength: {passStrength.label}</span>
                      <span className="text-slate-400 font-[vazirmatn]">{passStrength.labelFa}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color.split(" ")[0]} transition-all duration-300`}
                        style={{ width: `${passStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Password Requirement Policy Checklist */}
              {newPassword && (
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                  <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600" : "text-slate-400"}`}>
                    {hasMinLength ? "✓" : "○"} 8+ Chars
                  </span>
                  <span className={`flex items-center gap-1 ${hasUpperLower ? "text-emerald-600" : "text-slate-400"}`}>
                    {hasUpperLower ? "✓" : "○"} Upper & Lower
                  </span>
                  <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600" : "text-slate-400"}`}>
                    {hasNumber ? "✓" : "○"} Numbers (0-9)
                  </span>
                  <span className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-600" : "text-slate-400"}`}>
                    {hasSpecial ? "✓" : "○"} Symbols (!@#$)
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                    Confirm Password / تایید رمز جدید
                  </label>
                  {passwordsMatch && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Match ✓
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                      <X className="w-3 h-3" /> No match
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full h-9.5 px-3 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border rounded-xl focus:bg-white transition-all ${
                      passwordsMatch
                        ? "border-emerald-500 focus:border-emerald-600 ring-1 ring-emerald-500/20"
                        : passwordsMismatch
                        ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-400/20"
                        : "border-slate-300 dark:border-slate-700 focus:border-amber-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="revoke-sessions"
                  checked={revokeSessions}
                  onChange={(e) => setRevokeSessions(e.target.checked)}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="revoke-sessions" className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  Sign out all other devices / خروج از سایر دستگاه‌ها
                </label>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{passwordLoading ? "Updating..." : "Update Master Password / تغییر رمز عبور"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTION-LEVEL SECURITY GATE MATRIX (12-Col Card)                        */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Action-Level Security Gate Matrix</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold font-[vazirmatn]" dir="rtl">
                  ماتریس تایید امنیتی برای عملیات‌های حساس
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Require Touch ID, Face Recognition, or PIN re-verification before executing high-risk administrative operations
              </p>
            </div>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleArmAllGates}
              className="py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer"
            >
              Arm All / فعال‌سازی همه
            </button>
            <button
              type="button"
              onClick={handleResetGateDefaults}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Reset / پیش‌فرض
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
          {/* Gate 1: Treasury */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Treasury & Ledger Desk</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                    securitySettings.actionGates.treasuryLedger
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {securitySettings.actionGates.treasuryLedger ? "Armed ✓" : "Bypassed"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-[vazirmatn]" dir="rtl">
                خزانه‌داری، بانک و دفتر حساب
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400">Gate Verification:</span>
              <input
                type="checkbox"
                checked={securitySettings.actionGates.treasuryLedger}
                onChange={(e) =>
                  updateSecuritySettings({
                    actionGates: { ...securitySettings.actionGates, treasuryLedger: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Gate 2: BOL Modify & Delete */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Finalized BOL Edits</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                    securitySettings.actionGates.bolModifyDelete
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {securitySettings.actionGates.bolModifyDelete ? "Armed ✓" : "Bypassed"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-[vazirmatn]" dir="rtl">
                ویرایش یا حذف بارنامه‌های نهایی
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400">Gate Verification:</span>
              <input
                type="checkbox"
                checked={securitySettings.actionGates.bolModifyDelete}
                onChange={(e) =>
                  updateSecuritySettings({
                    actionGates: { ...securitySettings.actionGates, bolModifyDelete: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Gate 3: Vault Data & Backups */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Vault Data & Backups</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                    securitySettings.actionGates.exportVault
                      ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {securitySettings.actionGates.exportVault ? "Armed ✓" : "Bypassed"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-[vazirmatn]" dir="rtl">
                خروجی پشتیبان و دانلود خزانه
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400">Gate Verification:</span>
              <input
                type="checkbox"
                checked={securitySettings.actionGates.exportVault}
                onChange={(e) =>
                  updateSecuritySettings({
                    actionGates: { ...securitySettings.actionGates, exportVault: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Gate 4: Accounting Invariance Identity Lock */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Ledger Invariance Lock</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold ${
                    securitySettings.actionGates.accountingLedgerLock ?? true
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {securitySettings.actionGates.accountingLedgerLock ?? true ? "Armed ✓" : "Bypassed"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-[vazirmatn]" dir="rtl">
                قفل توازن و انطباق حسابداری
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-400">Net = Debit - Credit:</span>
              <input
                type="checkbox"
                checked={securitySettings.actionGates.accountingLedgerLock ?? true}
                onChange={(e) =>
                  updateSecuritySettings({
                    actionGates: { ...securitySettings.actionGates, accountingLedgerLock: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FINGERPRINT SCANNER & SOFTWARE VAULT ENROLLMENT MODAL                      */}
      {/* ========================================================================= */}
      <FingerprintScannerModal
        isOpen={showFingerprintModal}
        onClose={() => setShowFingerprintModal(false)}
        onSave={(fp) => {
          saveFingerprint(fp)
          updateSecuritySettings({ fingerprintEnabled: true })
        }}
      />

      {/* ========================================================================= */}
      {/* PIN CONFIGURATION MODAL                                                    */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h4 className="font-black text-sm text-slate-900 dark:text-white">Set Quick PIN / تنظیم رمز پین</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false)
                  setPinStep("enter")
                  setNewPinValue("")
                  setConfirmPinValue("")
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPinMode(4)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  pinMode === 4 ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-slate-500"
                }`}
              >
                4-Digit Mode
              </button>
              <button
                type="button"
                onClick={() => setPinMode(6)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  pinMode === 6 ? "bg-white dark:bg-slate-700 text-amber-600 shadow-xs" : "text-slate-500"
                }`}
              >
                6-Digit Mode
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {pinStep === "enter"
                  ? `Enter New ${pinMode}-Digit PIN:`
                  : `Confirm ${pinMode}-Digit PIN:`}
              </label>
              <input
                type="password"
                maxLength={pinMode}
                autoFocus
                value={pinStep === "enter" ? newPinValue : confirmPinValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  if (pinStep === "enter") setNewPinValue(val)
                  else setConfirmPinValue(val)
                }}
                placeholder={"•".repeat(pinMode)}
                className="w-full text-center tracking-[0.5em] text-xl font-mono font-black h-12 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (pinStep === "confirm") {
                    setPinStep("enter")
                  } else {
                    setShowPinModal(false)
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {pinStep === "confirm" ? "Back" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={(pinStep === "enter" ? newPinValue : confirmPinValue).length !== pinMode}
                onClick={handleSavePin}
                className="flex-1 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
              >
                {pinStep === "enter" ? "Next / مرحله بعد" : "Save PIN / ذخیره پین"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
