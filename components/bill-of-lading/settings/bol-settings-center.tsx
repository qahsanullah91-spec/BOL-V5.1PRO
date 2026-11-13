"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Sliders,
  Sparkles,
  Building2,
  ImageIcon,
  Stamp,
  Printer,
  FileText,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Globe,
  Search,
  Eye,
  Check,
  Shield,
  Phone,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BillOfLading, BillOfLadingFormData } from '@/lib/types/bill-of-lading'
import { DocumentBackground } from '@/lib/document-backgrounds'
import {
  BolDocumentSettings,
  DEFAULT_BOL_SETTINGS,
  SettingsTabId,
  SettingsTabMeta,
  CustomWatermarkItem,
  OFFICIAL_LOGO_PRESETS,
  LogoDesignPreset,
} from './bol-settings-types'
import {
  loadBolDocumentSettings,
  saveBolDocumentSettings,
  exportSettingsToJson,
  validateAndImportSettingsJson,
} from './bol-settings-storage'
import dynamic from 'next/dynamic'
const LiveA4SettingsPreview = dynamic(() => import('./live-a4-settings-preview').then(m => m.LiveA4SettingsPreview), { ssr: false })
const WatermarkSettingsPanel = dynamic(() => import('./watermark-settings-panel').then(m => m.WatermarkSettingsPanel), { ssr: false })

export interface BolSettingsCenterProps {
  currentBol?: Partial<BillOfLadingFormData & BillOfLading> | null
  activeBgImageUrl: string
  activeBgOpacity: number
  onBgImageChange: (url: string) => void
  onBgOpacityChange: (opacity: number) => void
  showStampSignature: boolean
  onToggleStampSignature: (show: boolean) => void
  logoUrl: string
  onLogoChange: (url: string) => void
  brandLockupUrl?: string
  onBrandLockupChange?: (url: string) => void
  logoDesignId?: string
  onLogoDesignChange?: (designId: string, brandLockupUrl: string, emblemUrl: string) => void
  companyName: string
  companyNamePersian: string
  companySubtitle: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
  companyLicence: string
  onCompanyInfoChange: (info: {
    companyName?: string
    companyNamePersian?: string
    companySubtitle?: string
    companyPhone?: string
    companyEmail?: string
    companyAddress?: string
    companyLicence?: string
  }) => void
  iranOffice?: {
    iran_office_building?: string
    iran_office_location?: string
    iran_office_pobox?: string
    iran_office_telefax?: string
    iran_office_cellphone?: string
    iran_office_email?: string
  }
  onIranOfficeChange?: (info: any) => void
  onOpenDocumentCenter?: () => void
  onOpenPrintDialog?: () => void
  onSaveToCloud?: () => void
  isSaving?: boolean
}

const SETTINGS_TABS: (SettingsTabMeta & { icon: any })[] = [
  { id: 'watermark', label: 'Watermark', labelPersian: 'واترمارک', description: 'Document background & security patterns', icon: ImageIcon },
  { id: 'branding', label: 'Logo & Branding', labelPersian: 'لوگو و برند', description: 'Official company logo and identity', icon: Sparkles },
  { id: 'stamp', label: 'Stamp & Signature', labelPersian: 'مهر و امضا', description: 'Carrier verification stamp and placement', icon: Stamp },
  { id: 'general', label: 'General Profile', labelPersian: 'اطلاعات شرکت', description: 'Company name, address, and contact numbers', icon: Building2 },
  { id: 'pdf-print', label: 'PDF & Print', labelPersian: 'پی‌دی‌اف و چاپ', description: 'Document dimensions, export quality & resolution', icon: Printer },
  { id: 'defaults', label: 'Defaults', labelPersian: 'پیش‌فرض‌ها', description: 'Default currency, language & border notes', icon: Sliders },
  { id: 'backup', label: 'Backup & Restore', labelPersian: 'پشتیبان‌گیری', description: 'Export or import configuration JSON', icon: Download },
]

export function BolSettingsCenter({
  currentBol,
  activeBgImageUrl,
  activeBgOpacity,
  onBgImageChange,
  onBgOpacityChange,
  showStampSignature,
  onToggleStampSignature,
  logoUrl,
  onLogoChange,
  brandLockupUrl,
  onBrandLockupChange,
  logoDesignId,
  onLogoDesignChange,
  companyName,
  companyNamePersian,
  companySubtitle,
  companyPhone,
  companyEmail,
  companyAddress,
  companyLicence,
  onCompanyInfoChange,
  iranOffice,
  onIranOfficeChange,
  onOpenDocumentCenter,
  onOpenPrintDialog,
  onSaveToCloud,
  isSaving = false,
}: BolSettingsCenterProps) {
  // Loaded permanent settings from storage (lazy initialized to eliminate mount cascade)
  const [savedSettings, setSavedSettings] = useState<BolDocumentSettings>(() => loadBolDocumentSettings())
  // Working draft of settings
  const [draftSettings, setDraftSettings] = useState<BolDocumentSettings>(() => savedSettings)
  // Active navigation tab
  const [activeTab, setActiveTab] = useState<SettingsTabId>('watermark')
  // Active watermark draft state (immediate live feedback)
  const [draftWatermarkUrl, setDraftWatermarkUrl] = useState(() => activeBgImageUrl || savedSettings.defaultBgImageUrl)
  const [draftWatermarkOpacity, setDraftWatermarkOpacity] = useState(() => activeBgOpacity ?? savedSettings.defaultBgOpacity)
  const [draftShowStamp, setDraftShowStamp] = useState(() => showStampSignature)
  const [draftLogoUrl, setDraftLogoUrl] = useState(() => logoUrl || savedSettings.logoUrl)
  const [draftLogoDesignId, setDraftLogoDesignId] = useState<string>(() => logoDesignId || savedSettings.logoDesignId || 'modern-flat')
  const [draftBrandLockupUrl, setDraftBrandLockupUrl] = useState<string>(() => brandLockupUrl || savedSettings.brandLockupUrl || '/images/sky-ariana-brand-lockup.png')
  const [logoFilterCategory, setLogoFilterCategory] = useState<'all' | 'classic' | 'modern' | 'seal'>('all')

  // Tracking unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Sync external prop changes
  useEffect(() => {
    if (activeBgImageUrl) setDraftWatermarkUrl(activeBgImageUrl)
    if (activeBgOpacity !== undefined) setDraftWatermarkOpacity(activeBgOpacity)
    setDraftShowStamp(showStampSignature)
    if (logoUrl) setDraftLogoUrl(logoUrl)
    if (brandLockupUrl) setDraftBrandLockupUrl(brandLockupUrl)
    if (logoDesignId) setDraftLogoDesignId(logoDesignId)
  }, [activeBgImageUrl, activeBgOpacity, showStampSignature, logoUrl, brandLockupUrl, logoDesignId])

  // Mark unsaved changes when draft deviates from saved
  useEffect(() => {
    const isWatermarkChanged =
      draftWatermarkUrl !== activeBgImageUrl ||
      Math.round(draftWatermarkOpacity * 100) !== Math.round(activeBgOpacity * 100)
    const isStampChanged = draftShowStamp !== showStampSignature
    const isLogoChanged = draftLogoUrl !== logoUrl || draftBrandLockupUrl !== (brandLockupUrl || savedSettings.brandLockupUrl) || draftLogoDesignId !== (logoDesignId || savedSettings.logoDesignId)
    const isProfileChanged =
      draftSettings.companyName !== companyName ||
      draftSettings.companyAddress !== companyAddress ||
      draftSettings.companyPhone !== companyPhone ||
      draftSettings.companyEmail !== companyEmail ||
      draftSettings.companyLicence !== companyLicence

    setHasUnsavedChanges(isWatermarkChanged || isStampChanged || isLogoChanged || isProfileChanged)
  }, [
    draftWatermarkUrl,
    draftWatermarkOpacity,
    draftShowStamp,
    draftLogoUrl,
    draftSettings,
    activeBgImageUrl,
    activeBgOpacity,
    showStampSignature,
    logoUrl,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    companyLicence,
  ])

  // Is this watermark an override compared to global default?
  const isWatermarkOverride = useMemo(() => {
    return (
      draftWatermarkUrl !== savedSettings.defaultBgImageUrl ||
      Math.round(draftWatermarkOpacity * 100) !== Math.round(savedSettings.defaultBgOpacity * 100)
    )
  }, [draftWatermarkUrl, draftWatermarkOpacity, savedSettings])

  // APPLY ALL SETTINGS
  const handleApplySettings = () => {
    const updated: BolDocumentSettings = {
      ...draftSettings,
      defaultBgImageUrl: draftWatermarkUrl,
      defaultBgOpacity: draftWatermarkOpacity,
      defaultShowStamp: draftShowStamp,
      logoUrl: draftLogoUrl,
      logoDesignId: draftLogoDesignId,
      brandLockupUrl: draftBrandLockupUrl,
      lastUpdated: new Date().toISOString(),
    }

    // Persist to storage
    saveBolDocumentSettings(updated)
    setSavedSettings(updated)

    // Notify parent handlers
    onBgImageChange(draftWatermarkUrl)
    onBgOpacityChange(draftWatermarkOpacity)
    onToggleStampSignature(draftShowStamp)
    onLogoChange(draftLogoUrl)
    if (onBrandLockupChange) onBrandLockupChange(draftBrandLockupUrl)
    if (onLogoDesignChange) onLogoDesignChange(draftLogoDesignId, draftBrandLockupUrl, draftLogoUrl)
    onCompanyInfoChange({
      companyName: draftSettings.companyName,
      companyNamePersian: draftSettings.companyNamePersian,
      companySubtitle: draftSettings.companySubtitle,
      companyPhone: draftSettings.companyPhone,
      companyEmail: draftSettings.companyEmail,
      companyAddress: draftSettings.companyAddress,
      companyLicence: draftSettings.companyLicence,
    })

    if (onIranOfficeChange && draftSettings.iranOffice) {
      onIranOfficeChange(draftSettings.iranOffice)
    }

    // Update recents
    const currentLabel =
      draftSettings.customWatermarks.find((cw) => cw.url === draftWatermarkUrl)?.label || 'Watermark'
    if (currentLabel) {
      const newRecents = [currentLabel, ...draftSettings.watermarkRecents.filter((r) => r !== currentLabel)].slice(0, 6)
      setDraftSettings((prev) => ({ ...prev, watermarkRecents: newRecents }))
    }

    setHasUnsavedChanges(false)
    toast.success('Document settings applied and saved successfully!')
  }

  // CANCEL / DISCARD DRAFT
  const handleCancelSettings = () => {
    setDraftSettings(savedSettings)
    setDraftWatermarkUrl(activeBgImageUrl)
    setDraftWatermarkOpacity(activeBgOpacity)
    setDraftShowStamp(showStampSignature)
    setDraftLogoUrl(logoUrl)
    setHasUnsavedChanges(false)
    toast.info('Draft changes discarded. Reverted to last saved settings.')
  }

  // SET AS GLOBAL DEFAULT
  const handleSetAsDefault = (url: string, opacity: number) => {
    const updated: BolDocumentSettings = {
      ...draftSettings,
      defaultBgImageUrl: url,
      defaultBgOpacity: opacity,
      lastUpdated: new Date().toISOString(),
    }
    saveBolDocumentSettings(updated)
    setSavedSettings(updated)
    setDraftSettings(updated)
    toast.success('Saved as system Global Default for all future documents!')
  }

  // RESET TO GLOBAL DEFAULT
  const handleResetToDefault = () => {
    setDraftWatermarkUrl(savedSettings.defaultBgImageUrl)
    setDraftWatermarkOpacity(savedSettings.defaultBgOpacity)
    toast.info(`Reset to Global Default (${Math.round(savedSettings.defaultBgOpacity * 100)}%)`)
  }

  // TOGGLE FAVORITE
  const handleToggleFavorite = (label: string) => {
    setDraftSettings((prev) => {
      const exists = prev.watermarkFavorites.includes(label)
      const nextFavs = exists
        ? prev.watermarkFavorites.filter((f) => f !== label)
        : [...prev.watermarkFavorites, label]
      const updated = { ...prev, watermarkFavorites: nextFavs }
      saveBolDocumentSettings(updated)
      return updated
    })
  }

  // ADD CUSTOM WATERMARK
  const handleAddCustomWatermark = (item: CustomWatermarkItem) => {
    setDraftSettings((prev) => {
      const next = [item, ...prev.customWatermarks.filter((w) => w.id !== item.id)]
      const updated = { ...prev, customWatermarks: next }
      saveBolDocumentSettings(updated)
      return updated
    })
    setDraftWatermarkUrl(item.url)
    setDraftWatermarkOpacity(item.opacity)
    toast.success(`Custom watermark "${item.label}" added to your library!`)
  }

  // DELETE CUSTOM WATERMARK
  const handleDeleteCustomWatermark = (id: string) => {
    setDraftSettings((prev) => {
      const next = prev.customWatermarks.filter((w) => w.id !== id)
      const updated = { ...prev, customWatermarks: next }
      saveBolDocumentSettings(updated)
      return updated
    })
    if (draftWatermarkUrl.includes(id)) {
      setDraftWatermarkUrl(savedSettings.defaultBgImageUrl)
      setDraftWatermarkOpacity(savedSettings.defaultBgOpacity)
    }
    toast.info('Custom watermark deleted.')
  }

  // LOGO PRESET & UPLOAD HANDLERS
  const handleSelectLogoPreset = (preset: LogoDesignPreset) => {
    setDraftLogoDesignId(preset.id)
    setDraftBrandLockupUrl(preset.lockupUrl)
    setDraftLogoUrl(preset.emblemUrl)
    setDraftSettings((prev) => ({
      ...prev,
      logoDesignId: preset.id,
      brandLockupUrl: preset.lockupUrl,
      logoUrl: preset.emblemUrl,
    }))
    toast.success(`Selected logo: ${preset.name}`)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, SVG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size exceeds 5MB limit. Please provide a lighter image.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        setDraftLogoUrl(dataUrl)
        setDraftBrandLockupUrl(dataUrl)
        setDraftLogoDesignId('custom')
        setDraftSettings((prev) => ({
          ...prev,
          logoUrl: dataUrl,
          brandLockupUrl: dataUrl,
          logoDesignId: 'custom',
        }))
        toast.success('Custom logo uploaded!')
      }
    }
    reader.readAsDataURL(file)
  }

  // EXPORT SETTINGS JSON
  const handleExportJson = () => {
    const jsonStr = exportSettingsToJson(draftSettings)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sky-ariana-bol-settings-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('BOL Settings exported successfully (without secrets).')
  }

  // IMPORT SETTINGS JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const result = validateAndImportSettingsJson(text, draftSettings)
      if (!result.isValid || !result.updatedSettings) {
        toast.error(result.error || 'Failed to import settings JSON.')
        return
      }

      setDraftSettings(result.updatedSettings)
      setDraftWatermarkUrl(result.updatedSettings.defaultBgImageUrl)
      setDraftWatermarkOpacity(result.updatedSettings.defaultBgOpacity)
      setDraftShowStamp(result.updatedSettings.defaultShowStamp)
      setDraftLogoUrl(result.updatedSettings.logoUrl)
      setHasUnsavedChanges(true)
      toast.success('Settings imported into draft. Review and click "Apply Changes" to persist.')
    }
    reader.readAsText(file)
  }

  // RESET ALL SETTINGS
  const handleResetAll = () => {
    setDraftSettings(DEFAULT_BOL_SETTINGS)
    setDraftWatermarkUrl(DEFAULT_BOL_SETTINGS.defaultBgImageUrl)
    setDraftWatermarkOpacity(DEFAULT_BOL_SETTINGS.defaultBgOpacity)
    setDraftShowStamp(DEFAULT_BOL_SETTINGS.defaultShowStamp)
    setDraftLogoUrl(DEFAULT_BOL_SETTINGS.logoUrl)
    setResetConfirmOpen(false)
    setHasUnsavedChanges(true)
    toast.warning('Settings reset to system defaults. Click "Apply Changes" to confirm.')
  }

  return (
    <div className="space-y-4">
      {/* 1. Unsaved Changes Action Banner (Floating Sticky) */}
      {hasUnsavedChanges && (
        <div className="sticky top-2 z-40 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500 text-slate-950 font-sans shadow-xl border border-amber-400 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-slate-950 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Unsaved Settings Draft</p>
              <p className="text-[11px] opacity-90">
                You have active configuration changes. The live A4 preview reflects your draft in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelSettings}
              className="h-8 text-xs font-bold bg-white/90 text-slate-900 border-transparent hover:bg-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplySettings}
              className="h-8 text-xs font-black bg-slate-950 text-white hover:bg-slate-900 shadow-md cursor-pointer gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Apply & Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* 2. Master Split Layout: 60% Left (Tabs & Controls) / 40% Right (Sticky Live A4 Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Controls & Settings Sub-tabs (7 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          {/* Header Card */}
          <Card className="bg-white/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                    <Sliders className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Document Configuration Center
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage watermarks, branding, security stamps, and export defaults
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 font-[vazirmatn] bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
                    مرکز تنظیمات اسناد
                  </span>
                </div>
              </div>

              {/* Sub-tab Navigation Strip */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 pb-1 border-t border-slate-200/60 dark:border-slate-800/60 mt-3">
                {SETTINGS_TABS.map((tab) => {
                  const isActive = activeTab === tab.id
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500/30 font-black'
                          : 'bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      <span className="text-[10px] font-normal font-[vazirmatn] opacity-75" dir="rtl">
                        ({tab.labelPersian})
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {/* TAB 1: WATERMARK */}
              {activeTab === 'watermark' && (
                <WatermarkSettingsPanel
                  activeWatermarkUrl={draftWatermarkUrl}
                  activeOpacity={draftWatermarkOpacity}
                  onSelectWatermark={(preset) => {
                    setDraftWatermarkUrl(preset.url)
                    if (!preset.url) setDraftWatermarkOpacity(0)
                  }}
                  onOpacityChange={(op) => setDraftWatermarkOpacity(op)}
                  defaultWatermarkUrl={savedSettings.defaultBgImageUrl}
                  defaultOpacity={savedSettings.defaultBgOpacity}
                  onSetAsDefault={handleSetAsDefault}
                  onResetToDefault={handleResetToDefault}
                  isOverride={isWatermarkOverride}
                  favorites={draftSettings.watermarkFavorites}
                  onToggleFavorite={handleToggleFavorite}
                  recents={draftSettings.watermarkRecents}
                  customWatermarks={draftSettings.customWatermarks}
                  onAddCustomWatermark={handleAddCustomWatermark}
                  onDeleteCustomWatermark={handleDeleteCustomWatermark}
                />
              )}

              {/* TAB 2: LOGO & BRANDING */}
              {activeTab === 'branding' && (
                <div className="space-y-5">
                  {/* Header Description & Category Filter */}
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900/80 dark:to-blue-950/30 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          <span>Official Logo Designs & Brand Headers</span>
                          <span className="text-xs font-semibold text-slate-400 font-sans" dir="rtl">
                            / انتخاب طرح‌های رسمی لوگو
                          </span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          Choose from official modern vector designs, authentic heritage classic designs (old logo), or upload a custom corporate emblem.
                        </p>
                      </div>

                      {/* Active Badge Indicator */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-xs font-black text-blue-900 dark:text-blue-200 shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Active Design:</span>
                        <span className="capitalize">
                          {draftLogoDesignId === 'custom'
                            ? 'Custom Upload'
                            : (OFFICIAL_LOGO_PRESETS.find((p) => p.id === draftLogoDesignId)?.name.split(' (')[0] || draftLogoDesignId)}
                        </span>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="text-slate-500 font-bold mr-1 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Filter Designs:</span>
                      </span>
                      {[
                        { id: 'all', label: `All Designs (${OFFICIAL_LOGO_PRESETS.length})`, icon: Sparkles },
                        { id: 'modern', label: `Modern Designs (${OFFICIAL_LOGO_PRESETS.filter((p) => p.category === 'modern').length})`, icon: Sparkles },
                        { id: 'classic', label: `Old Logo Designs (${OFFICIAL_LOGO_PRESETS.filter((p) => p.category === 'classic').length})`, icon: RotateCcw },
                        { id: 'seal', label: `Circular Seals (${OFFICIAL_LOGO_PRESETS.filter((p) => p.category === 'seal').length})`, icon: Shield },
                      ].map((cat) => {
                        const isCatActive = logoFilterCategory === cat.id
                        const CatIcon = cat.icon
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setLogoFilterCategory(cat.id as any)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCatActive
                                ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <CatIcon className={`w-3 h-3 ${isCatActive ? 'text-white' : 'text-slate-400'}`} />
                            <span>{cat.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Preset Logo Gallery Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {OFFICIAL_LOGO_PRESETS.filter(
                      (preset) => logoFilterCategory === 'all' || preset.category === logoFilterCategory
                    ).map((preset) => {
                      const isSelected = draftLogoDesignId === preset.id
                      const is3dEmblem = preset.id === 'circular-seal-3d'
                      const isGoldSeal = preset.id === 'circular-seal-gold'
                      const isCircularSeal = preset.id === 'circular-seal'
                      const isSquareSeal = preset.aspectRatio === 'aspect-square'

                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectLogoPreset(preset)}
                          className={`group relative rounded-2xl border-2 p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                            isSelected
                              ? 'border-blue-600 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20 translate-y-[-1px]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm'
                          }`}
                        >
                          {/* Card Header */}
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${preset.badgeColor}`}>
                                {preset.badge}
                              </span>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>Active on BOL / در حال استفاده</span>
                                </span>
                              )}
                            </div>

                            <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {preset.name}
                            </h5>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-sans" dir="rtl">
                              {preset.nameFa}
                            </p>
                          </div>

                          {/* Logo Image Display Chamber */}
                          <div
                            className={`my-3 p-3 rounded-xl border flex items-center justify-center min-h-[125px] max-h-[145px] overflow-hidden group shadow-inner transition-all ${
                              is3dEmblem
                                ? 'bg-gradient-to-b from-slate-950 via-[#071328] to-slate-950 border-blue-900/50'
                                : isGoldSeal
                                ? 'bg-gradient-to-b from-slate-950 via-[#181205] to-slate-950 border-amber-900/50'
                                : preset.id.includes('3d')
                                ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/90 border-slate-700/80'
                                : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-slate-200/80 dark:border-slate-800'
                            }`}
                          >
                            {isSquareSeal ? (
                              <div className="relative flex items-center justify-center">
                                {/* Ambient backglow for seal presentation */}
                                <div
                                  className={`absolute inset-0 rounded-full blur-md opacity-30 ${
                                    is3dEmblem
                                      ? 'bg-blue-500'
                                      : isGoldSeal
                                      ? 'bg-amber-400'
                                      : 'bg-blue-300'
                                  }`}
                                />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`${preset.previewUrl}?v=20261105-pro`}
                                  alt={preset.name}
                                  className="relative max-h-[115px] w-auto max-w-full object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-108"
                                  crossOrigin="anonymous"
                                  loading="eager"
                                />
                              </div>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={`${preset.previewUrl}?v=20261105-pro`}
                                alt={preset.name}
                                className="max-h-[110px] w-auto max-w-full object-contain drop-shadow-2xs transition-transform duration-200 group-hover:scale-105"
                                crossOrigin="anonymous"
                                loading="eager"
                              />
                            )}
                          </div>

                          {/* Card Footer / Descriptions */}
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-600 dark:text-slate-400 space-y-1">
                            <p className="line-clamp-2 leading-relaxed">{preset.description}</p>
                            <p className="line-clamp-1 leading-relaxed text-slate-500 dark:text-slate-400 font-sans" dir="rtl">
                              {preset.descriptionFa}
                            </p>

                            <div className="pt-2.5 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400">
                                {preset.isOldLogo ? 'Vintage Heritage' : 'Vector Lockup'}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                className={`h-7 px-3.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-black'
                                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300'
                                }`}
                              >
                                {isSelected ? '✓ Selected' : 'Use This Logo'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Live BOL Header Preview Strip */}
                  <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/30 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span>Live Bill of Lading Header Preview</span>
                        <span className="text-[11px] font-semibold text-slate-400 font-sans" dir="rtl">
                          / پیش‌نمایش سربرگ زنده
                        </span>
                      </h5>
                      <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-2xs">
                        A4 Ratio Preview
                      </span>
                    </div>

                    {/* Render miniature BOL Header with balanced proportions & no clipping */}
                    {(() => {
                      const previewLockupHasEmblem = Boolean(
                        draftLogoDesignId === 'classic-heritage-full' ||
                        draftLogoDesignId === 'classic-stack' ||
                        (draftLogoUrl && draftBrandLockupUrl && draftLogoUrl === draftBrandLockupUrl) ||
                        (draftBrandLockupUrl && draftBrandLockupUrl.includes('classic-heritage')) ||
                        (draftBrandLockupUrl && draftBrandLockupUrl.includes('classic-stack')) ||
                        (draftBrandLockupUrl && draftBrandLockupUrl.includes('sky-ariana-modern-flat.png')) ||
                        (draftBrandLockupUrl && draftBrandLockupUrl.includes('sky-ariana-modern-3d.png')) ||
                        (draftBrandLockupUrl && draftBrandLockupUrl.includes('vintage-heritage') && !draftBrandLockupUrl.includes('vintage-heritage-lockup'))
                      )
                      return (
                        <div className="relative border border-[#bfdbfe] dark:border-blue-900/80 rounded-2xl bg-gradient-to-r from-blue-50/40 via-white to-blue-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-3 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 shadow-sm min-h-[76px] sm:min-h-[84px] overflow-visible">
                          {/* Left Circular Seal */}
                          {!previewLockupHasEmblem && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center p-0.5 border border-[#93c5fd]/80 dark:border-blue-800 bg-white dark:bg-slate-900 shadow-[0_2px_10px_rgba(37,99,235,0.12)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={draftLogoUrl || '/images/sky-ariana-logo.png'}
                                alt="Seal"
                                className="w-full h-full object-contain rounded-full"
                              />
                            </div>
                          )}

                          {/* Center Selected Brand Lockup with generous headroom and natural scaling */}
                          <div className="flex-1 min-w-0 flex items-center justify-center text-center px-2 py-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={draftBrandLockupUrl || '/images/sky-ariana-brand-lockup.png'}
                              alt="Header Brand"
                              className="w-auto max-w-full object-contain drop-shadow-xs transition-all duration-200"
                              style={{
                                maxHeight: (draftLogoDesignId === 'classic-stack' || (draftBrandLockupUrl && draftBrandLockupUrl.includes('classic-stack'))) ? '64px' : '52px',
                                height: 'auto',
                              }}
                            />
                          </div>

                          {/* Right Miniature Document Badge */}
                          <div className="w-28 sm:w-32 shrink-0 rounded-xl border border-blue-300 dark:border-blue-800/80 bg-white dark:bg-slate-800 overflow-hidden shadow-2xs text-[9px] font-sans">
                            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-2 py-1 flex items-center justify-between font-black text-[8px] tracking-wider uppercase">
                              <span>B/L DOC</span>
                              <span className="font-sans text-[7.5px] opacity-90" dir="rtl">بارنامه</span>
                            </div>
                            <div className="p-1.5 text-right font-mono bg-blue-50/30 dark:bg-slate-900/40">
                              <span className="block text-[8px] font-bold text-slate-400">NO.</span>
                              <span className="block font-black text-slate-900 dark:text-slate-100 text-[10px] leading-tight">
                                {(currentBol as any)?.bill_of_lading_number || currentBol?.bol_number || 'SKB-98421'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Custom Logo Upload Section */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draftLogoUrl || '/images/sky-ariana-logo.png'}
                          alt="Company Logo"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="space-y-2 flex-1 w-full sm:w-auto">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          aria-label="Upload custom company logo"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => logoInputRef.current?.click()}
                            className="text-xs h-8 gap-1.5 cursor-pointer bg-white dark:bg-slate-800"
                          >
                            <Upload className="h-3.5 w-3.5 text-blue-600" /> Upload Custom Logo
                          </Button>
                          {draftLogoDesignId === 'custom' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSelectLogoPreset(OFFICIAL_LOGO_PRESETS[0])}
                              className="text-xs h-8 text-slate-500 hover:text-red-600 cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revert to Official Preset
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Recommended format: High-resolution PNG with transparent background or SVG vector. Max file size: 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STAMP & SIGNATURE */}
              {activeTab === 'stamp' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Stamp className="h-4 w-4 text-red-600" /> Carrier Verification Stamp
                        </h4>
                        <p className="text-xs text-slate-500">
                          Official Sky Ariana security seal placed in the carrier verification box.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftShowStamp(!draftShowStamp)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          draftShowStamp ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={draftShowStamp}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            draftShowStamp ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">Status</span>
                        <span className={draftShowStamp ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {draftShowStamp ? 'Enabled on Document ✓' : 'Hidden'}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">Position</span>
                        <span className="text-slate-600 dark:text-slate-300">Carrier Verification Box (A4 Footer)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GENERAL PROFILE */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  {/* Quick Export Actions */}
                  <div className="grid sm:grid-cols-2 gap-3 mb-2">
                    {onOpenDocumentCenter && (
                      <Button
                        variant="outline"
                        onClick={onOpenDocumentCenter}
                        className="text-xs h-9 border-blue-200 text-blue-700 dark:text-blue-300 gap-1.5"
                      >
                        <Download className="h-4 w-4" /> Open Document Center
                      </Button>
                    )}
                    {onSaveToCloud && (
                      <Button
                        variant="outline"
                        onClick={onSaveToCloud}
                        className="text-xs h-9 border-emerald-200 text-emerald-700 dark:text-emerald-300 gap-1.5"
                      >
                        <Upload className="h-4 w-4" /> Save PDF to Cloud Storage
                      </Button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-xs font-bold">Company Name (English)</Label>
                      <Input
                        value={draftSettings.companyName}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyName: e.target.value })
                        }
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold font-[vazirmatn]" dir="rtl">
                        نام شرکت (فارسی)
                      </Label>
                      <Input
                        value={draftSettings.companyNamePersian}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyNamePersian: e.target.value })
                        }
                        dir="rtl"
                        className="mt-1 h-9 text-xs font-[vazirmatn]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Subtitle / Header Description</Label>
                    <Input
                      value={draftSettings.companySubtitle}
                      onChange={(e) =>
                        setDraftSettings({ ...draftSettings, companySubtitle: e.target.value })
                      }
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-blue-500" /> Phone
                      </Label>
                      <Input
                        value={draftSettings.companyPhone}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyPhone: e.target.value })
                        }
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-blue-500" /> Email
                      </Label>
                      <Input
                        value={draftSettings.companyEmail}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyEmail: e.target.value })
                        }
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3.5">
                    <div>
                      <Label className="text-xs font-bold">Address</Label>
                      <Input
                        value={draftSettings.companyAddress}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyAddress: e.target.value })
                        }
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold">Licence Number</Label>
                      <Input
                        value={draftSettings.companyLicence}
                        onChange={(e) =>
                          setDraftSettings({ ...draftSettings, companyLicence: e.target.value })
                        }
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PDF & PRINT */}
              {activeTab === 'pdf-print' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Printer className="h-4 w-4 text-purple-600" /> Print & PDF Dimension Standards
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standardized physical document dimensions and scale fidelity.
                    </p>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px]">Paper Size</span>
                        <strong className="text-slate-800 dark:text-slate-200">A4 (210 × 297 mm)</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px]">Orientation</span>
                        <strong className="text-slate-800 dark:text-slate-200">Portrait</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block text-[10px]">Scale Invariance</span>
                        <strong className="text-slate-800 dark:text-slate-200">100% Unscaled</strong>
                      </div>
                    </div>

                    {onOpenPrintDialog && (
                      <Button
                        size="sm"
                        onClick={onOpenPrintDialog}
                        className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" /> Launch Official Print Dialog
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: DEFAULTS */}
              {activeTab === 'defaults' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-blue-600" /> New Document Defaults
                    </h4>
                    <p className="text-xs text-slate-500">
                      Settings applied when creating new Bills of Lading.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
                      <div>
                        <Label className="text-xs font-bold">Default Currency</Label>
                        <select
                          value={draftSettings.defaultCurrency}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, defaultCurrency: e.target.value as any })
                          }
                          className="mt-1 h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="AFN">AFN (؋)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold">Transit Border Note</Label>
                        <Input
                          value={draftSettings.defaultTransitBorderNote || ''}
                          onChange={(e) =>
                            setDraftSettings({ ...draftSettings, defaultTransitBorderNote: e.target.value })
                          }
                          placeholder="ISLAM QALA / TORGHUNDI"
                          className="mt-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: BACKUP & RESTORE */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Save className="h-4 w-4 text-emerald-600" /> Export & Import Configuration
                    </h4>
                    <p className="text-xs text-slate-500">
                      Backup document settings or restore configuration to another device. Secrets and credentials are automatically stripped.
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <Button
                        size="sm"
                        onClick={handleExportJson}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Export Settings JSON
                      </Button>

                      <input
                        ref={importInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleImportJson}
                        className="hidden"
                        aria-label="Import settings json"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => importInputRef.current?.click()}
                        className="text-xs font-bold gap-1.5 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-blue-600" /> Import Settings JSON
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setResetConfirmOpen(true)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Factory Defaults
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Sticky Live A4 Preview (5 cols on lg, 5 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-4">
          <Card className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-3.5">
            <LiveA4SettingsPreview
              settings={draftSettings}
              activeWatermarkUrl={draftWatermarkUrl}
              activeWatermarkOpacity={draftWatermarkOpacity}
              activeWatermarkLabel={
                draftSettings.customWatermarks.find((cw) => cw.url === draftWatermarkUrl)?.label
              }
              currentBol={currentBol}
              showStamp={draftShowStamp}
            />
          </Card>
        </div>
      </div>

      {/* Factory Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h4 className="text-sm font-bold">Reset All BOL Settings?</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will restore company information, print preferences, and watermark defaults to factory settings. Uploaded custom watermarks will NOT be deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setResetConfirmOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs" onClick={handleResetAll}>
                Confirm Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
