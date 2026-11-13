"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Check,
  Upload,
  RotateCcw,
  Sparkles,
  Link2,
  Image as ImageIcon,
  Building2,
  Sliders,
  FileText,
  Layers,
} from "lucide-react"
import { toast } from "sonner"
import type { LedgerSettings, Account, Company } from "@/lib/types"
import { OFFICIAL_LOGO_PRESETS, type LogoDesignPreset } from "@/components/bill-of-lading/settings/bol-settings-types"
import { loadBolDocumentSettings } from "@/components/bill-of-lading/settings/bol-settings-storage"

export interface AccountLedgerSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAccount: Account | null
  currentCompany: Company | null
  ledgerSettings: LedgerSettings
  onUpdateSettings: (settings: Partial<LedgerSettings>) => void
}

export const WATERMARK_OPTIONS = [
  { id: "clean-white", name: "Clean White (None)", url: "", description: "Pure white document background without watermark" },
  { id: "mountain-premium", name: "Mountain Watermark (Official)", url: "/images/mountain-watermark-premium.png", description: "Official Sky Ariana mountain range logistics watermark" },
  { id: "ledger-classic", name: "Classic Ledger Pattern", url: "/ledger-background.png", description: "Traditional subtle ledger accounting grid pattern" },
  { id: "silk-road", name: "Silk Road Heritage", url: "/images/document-backgrounds/silk-road.svg", description: "Historic Eurasian trade route blueprint pattern" },
  { id: "deep-blue", name: "Deep Blue Logistics", url: "/images/document-backgrounds/deep-blue.svg", description: "Modern deep corporate transit vectors" },
  { id: "air-cargo", name: "Air Cargo Freighter", url: "/images/air_cargo_jet.jpg", description: "High-altitude global air freight illustration" },
]

export function AccountLedgerSettingsDialog({
  open,
  onOpenChange,
  currentAccount,
  currentCompany,
  ledgerSettings,
  onUpdateSettings,
}: AccountLedgerSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"logo" | "watermark" | "company">("logo")
  const [logoFilter, setLogoFilter] = useState<"all" | "modern" | "classic" | "seal">("all")

  // Draft settings state
  const [draftLogoUrl, setDraftLogoUrl] = useState<string>(ledgerSettings.logoUrl || ledgerSettings.companyLogo || "/images/sky-ariana-logo.png")
  const [draftLogoDesignId, setDraftLogoDesignId] = useState<string>(ledgerSettings.logoDesignId || "modern-flat")
  const [draftBrandLockupUrl, setDraftBrandLockupUrl] = useState<string>(ledgerSettings.brandLockupUrl || "/images/sky-ariana-brand-lockup.png")
  const [draftBgImage, setDraftBgImage] = useState<string>(ledgerSettings.backgroundImage || "/ledger-background.png")
  const [draftBgOpacity, setDraftBgOpacity] = useState<number>(ledgerSettings.backgroundOpacity ?? 0.12)

  // Company Details
  const [companyName, setCompanyName] = useState<string>(ledgerSettings.companyName || "SKY ARIANA LIMITED")
  const [companySubtitle, setCompanySubtitle] = useState<string>(ledgerSettings.companySubtitle || "Transport & Logistics • Import & Export")
  const [companyAddress, setCompanyAddress] = useState<string>(ledgerSettings.companyAddress || "2nd Floor, 16 No. Office, Shahidano Chowk, Etimad Rahmi Market, Kandahar, Afghanistan")
  const [companyPhone, setCompanyPhone] = useState<string>(ledgerSettings.companyPhone || "+93 700 939 365, +93 711 435 529")
  const [companyEmail, setCompanyEmail] = useState<string>(ledgerSettings.companyEmail || "info@skyariana.com")
  const [companyLicence, setCompanyLicence] = useState<string>(ledgerSettings.companyLicence || "2401-2198")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  // Sync draft state with incoming props on open
  useEffect(() => {
    if (open) {
      setDraftLogoUrl(ledgerSettings.logoUrl || ledgerSettings.companyLogo || "/images/sky-ariana-logo.png")
      setDraftLogoDesignId(ledgerSettings.logoDesignId || "modern-flat")
      setDraftBrandLockupUrl(ledgerSettings.brandLockupUrl || "/images/sky-ariana-brand-lockup.png")
      setDraftBgImage(ledgerSettings.backgroundImage || "/ledger-background.png")
      setDraftBgOpacity(ledgerSettings.backgroundOpacity ?? 0.12)
      setCompanyName(ledgerSettings.companyName || "SKY ARIANA LIMITED")
      setCompanySubtitle(ledgerSettings.companySubtitle || "Transport & Logistics • Import & Export")
      setCompanyAddress(ledgerSettings.companyAddress || "2nd Floor, 16 No. Office, Shahidano Chowk, Etimad Rahmi Market, Kandahar, Afghanistan")
      setCompanyPhone(ledgerSettings.companyPhone || "+93 700 939 365, +93 711 435 529")
      setCompanyEmail(ledgerSettings.companyEmail || "info@skyariana.com")
      setCompanyLicence(ledgerSettings.companyLicence || "2401-2198")
    }
  }, [open, ledgerSettings])

  // Handle Preset Selection
  const handleSelectPreset = (preset: LogoDesignPreset) => {
    setDraftLogoDesignId(preset.id)
    setDraftBrandLockupUrl(preset.lockupUrl)
    setDraftLogoUrl(preset.emblemUrl || preset.previewUrl)
    toast.success(`Selected logo: ${preset.name}`)
  }

  // Sync with Bill of Lading Logo
  const handleSyncWithBol = () => {
    try {
      const bolSettings = loadBolDocumentSettings()
      if (bolSettings.logoDesignId) {
        setDraftLogoDesignId(bolSettings.logoDesignId)
      }
      if (bolSettings.brandLockupUrl) {
        setDraftBrandLockupUrl(bolSettings.brandLockupUrl)
      }
      if (bolSettings.logoUrl) {
        setDraftLogoUrl(bolSettings.logoUrl)
      }
      toast.success("Successfully synchronized logo with active Bill of Lading branding!")
    } catch (err) {
      console.error("Failed to sync with BOL:", err)
      toast.error("Could not read Bill of Lading settings.")
    }
  }

  // Handle Custom File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, SVG, or JPG).")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setDraftLogoUrl(dataUrl)
      setDraftBrandLockupUrl(dataUrl)
      setDraftLogoDesignId("custom")
      toast.success(`Custom logo "${file.name}" uploaded successfully!`)
    }
    reader.readAsDataURL(file)
  }

  // Handle Background File Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setDraftBgImage(dataUrl)
      toast.success(`Custom watermark background uploaded!`)
    }
    reader.readAsDataURL(file)
  }

  // Save Settings
  const handleSave = () => {
    const payload: Partial<LedgerSettings> = {
      companyLogo: draftLogoUrl,
      logoUrl: draftLogoUrl,
      logoDesignId: draftLogoDesignId,
      brandLockupUrl: draftBrandLockupUrl,
      backgroundImage: draftBgImage,
      backgroundOpacity: draftBgOpacity,
      companyName,
      companySubtitle,
      companyAddress,
      companyPhone,
      companyEmail,
      companyLicence,
    }

    onUpdateSettings(payload)
    toast.success("Account Ledger settings updated successfully!")
    onOpenChange(false)
  }

  const filteredPresets = OFFICIAL_LOGO_PRESETS.filter(
    (p) => logoFilter === "all" || p.category === logoFilter
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Account Ledger Settings
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Customize company logo, branding lockup, watermark &amp; office details for{" "}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {currentCompany?.name || currentAccount?.name || "Account"}
                  </span>
                </p>
              </div>
            </div>

            {/* Sync with BOL Quick Action */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncWithBol}
              className="text-xs h-8 gap-1.5 font-bold border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300"
              title="Copy active logo branding from Bill of Lading"
            >
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sync with BOL Logo</span>
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("logo")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "logo"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Logo &amp; Brand Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("watermark")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "watermark"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PDF Watermark &amp; Background</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "company"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Office &amp; Contact Info</span>
            </button>
          </div>
        </DialogHeader>

        {/* Modal Body / Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LOGO & BRAND GALLERY */}
          {activeTab === "logo" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Official Logo Design Presets
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select a high-resolution logo design to display on the Account Ledger document and PDF exports.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: "All Logos" },
                      { id: "modern", label: "Modern" },
                      { id: "classic", label: "Vintage Heritage" },
                      { id: "seal", label: "Seals" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setLogoFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        logoFilter === f.id
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredPresets.map((preset) => {
                  const isSelected = draftLogoDesignId === preset.id
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative rounded-xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${preset.badgeColor}`}>
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>Active on Ledger</span>
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {preset.name}
                        </h5>
                        <p className="text-[11px] font-bold text-slate-500 font-sans" dir="rtl">
                          {preset.nameFa}
                        </p>
                      </div>

                      {/* Display Chamber */}
                      <div
                        className={`my-2.5 p-2.5 rounded-lg border flex items-center justify-center min-h-[96px] max-h-[115px] overflow-hidden ${
                          preset.id.includes("3d")
                            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/90 border-slate-700/80 shadow-inner"
                            : "bg-gradient-to-b from-white via-slate-50 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-slate-200/70 dark:border-slate-800 shadow-2xs"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${preset.previewUrl}?v=20261105-pro`}
                          alt={preset.name}
                          className="min-h-[72px] max-h-[88px] w-auto max-w-[96%] object-contain drop-shadow-xs transition-transform duration-200 hover:scale-[1.02]"
                          crossOrigin="anonymous"
                          loading="eager"
                        />
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1">
                        <p className="line-clamp-2 leading-relaxed">{preset.description}</p>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400">
                            {preset.isOldLogo ? "Vintage Heritage" : "Vector Lockup"}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={`h-7 px-3 text-xs font-bold rounded-lg cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white shadow-xs"
                                : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected ? "✓ Selected" : "Use This Logo"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom Logo Upload Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draftLogoUrl}
                      alt="Current Active Logo"
                      className="max-h-10 max-w-10 object-contain"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                      Upload Custom Company Logo
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Upload a PNG or SVG logo for this account ledger (max 5MB).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-8 gap-1.5 font-bold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Image</span>
                  </Button>
                  {draftLogoDesignId === "custom" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectPreset(OFFICIAL_LOGO_PRESETS[0])}
                      className="text-xs h-8 gap-1.5 text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Official</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WATERMARK & BACKGROUND */}
          {activeTab === "watermark" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  PDF &amp; Document Watermark Backgrounds
                </h4>
                <p className="text-xs text-slate-500">
                  Select a watermark pattern or background image for Account Ledger statements and exports.
                </p>
              </div>

              {/* Watermark Preset Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WATERMARK_OPTIONS.map((opt) => {
                  const isSelected = draftBgImage === opt.url
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setDraftBgImage(opt.url)}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-2 relative">
                        {opt.url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={opt.url}
                            alt={opt.name}
                            className="w-full h-full object-cover opacity-60"
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400">Clean White</span>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {opt.name}
                      </h5>
                      <p className="text-[10.5px] text-slate-500 line-clamp-1">{opt.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* Watermark Opacity Slider */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Watermark Print Opacity</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {Math.round(draftBgOpacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[draftBgOpacity * 100]}
                  min={2}
                  max={35}
                  step={1}
                  onValueChange={(val) => setDraftBgOpacity(val[0] / 100)}
                />
                <p className="text-[11px] text-slate-500">
                  Recommended opacity for clean ledger printing is 8% to 15% to maintain perfect readability of financial numbers.
                </p>
              </div>

              {/* Custom Watermark Input */}
              <div className="flex items-center gap-3">
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />
                <Input
                  type="text"
                  placeholder="/ledger-background.png or image URL"
                  value={draftBgImage}
                  onChange={(e) => setDraftBgImage(e.target.value)}
                  className="text-xs h-9 font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgInputRef.current?.click()}
                  className="text-xs h-9 gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICE & CONTACT DETAILS */}
          {activeTab === "company" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Company Head Office &amp; Contact Information
                </h4>
                <p className="text-xs text-slate-500">
                  These details print on the top-right header and bottom footer of official ledger statements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Company Corporate Title</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-xs h-9"
                    placeholder="SKY ARIANA LIMITED"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Business Tagline / Subtitle</Label>
                  <Input
                    value={companySubtitle}
                    onChange={(e) => setCompanySubtitle(e.target.value)}
                    className="text-xs h-9"
                    placeholder="Transport & Logistics • Import & Export"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold">Office Address</Label>
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="text-xs h-9"
                    placeholder="2nd Floor, 16 No. Office, Shahidano Chowk, Etimad Rahmi Market, Kandahar, Afghanistan"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Contact Phone Numbers</Label>
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="text-xs h-9"
                    placeholder="+93 700 939 365, +93 711 435 529"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Corporate Email</Label>
                  <Input
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="text-xs h-9"
                    placeholder="info@skyariana.com"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold">Transport Licence Number</Label>
                  <Input
                    value={companyLicence}
                    onChange={(e) => setCompanyLicence(e.target.value)}
                    className="text-xs h-9"
                    placeholder="2401-2198"
                  />
                </div>
              </div>
            </div>
          )}

          {/* LIVE DOCUMENT HEADER PREVIEW (Shown across all tabs) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Document Header Preview (A4 Statement)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                Real-time Feedback
              </span>
            </div>

            {/* Rendered Live Header Chamber */}
            <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-white to-blue-50/70 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                {/* Left Account Meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                    OFFICIAL ACCOUNT LEDGER
                  </p>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                    {companyName || currentCompany?.name || "SKY ARIANA LTD"}
                  </h3>
                  <p className="text-[10px] font-bold text-blue-500">
                    Account Holder / Shipper • صورت حساب شرکت
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                    Statement Date:{" "}
                    <span className="font-bold text-slate-800">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                {/* Center: Selected Brand Logo Lockup */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    {draftLogoUrl &&
                      draftBrandLockupUrl &&
                      draftLogoUrl !== draftBrandLockupUrl &&
                      !draftLogoDesignId.includes("seal") &&
                      draftLogoDesignId !== "modern-typography" &&
                      draftLogoDesignId !== "classic-heritage-full" && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`${draftLogoUrl}?v=20261105-pro`}
                          alt="SKY ARIANA Emblem"
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-blue-200 bg-white object-contain p-0.5 shadow-2xs shrink-0"
                        />
                      )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${draftBrandLockupUrl || draftLogoUrl}?v=20261105-pro`}
                      alt={companyName}
                      className="h-9 sm:h-11 max-w-[210px] object-contain drop-shadow-2xs"
                      onError={(e) => {
                        const target = e.currentTarget
                        if (!target.src.endsWith("/images/sky-ariana-brand-lockup.png")) {
                          target.src = "/images/sky-ariana-brand-lockup.png"
                        }
                      }}
                    />
                  </div>
                  {(!draftBrandLockupUrl || draftBrandLockupUrl.includes("seal") || draftBrandLockupUrl.includes("logo.png")) && (
                    <>
                      <p className="text-xs sm:text-sm font-black text-blue-900 leading-tight mt-0.5">
                        {companyName}
                      </p>
                      <p className="text-[8px] font-bold text-blue-600 tracking-widest uppercase">
                        {companySubtitle}
                      </p>
                    </>
                  )}
                </div>

                {/* Right: Office Meta */}
                <div className="flex-1 text-center sm:text-right text-[9px] text-slate-600 leading-tight">
                  <p className="font-black text-blue-900">AFGHANISTAN OFFICE</p>
                  <p className="line-clamp-2 mt-0.5">{companyAddress}</p>
                  <p className="text-blue-700 font-medium mt-1">Tel: {companyPhone}</p>
                  <p className="text-slate-400 mt-0.5">Licence: {companyLicence}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between sm:justify-between shrink-0">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Settings persist automatically to local ledger database and apply across live view &amp; PDF exports.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save &amp; Apply to Ledger</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
