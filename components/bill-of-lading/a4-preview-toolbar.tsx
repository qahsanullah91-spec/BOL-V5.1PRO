"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DOCUMENT_BACKGROUNDS } from "@/lib/document-backgrounds"
import { CopyWhatsAppButton } from "./copy-whatsapp-button"
import { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import { getStoredCompanyStampConfig, saveStoredCompanyStampConfig, type CompanyStampConfig } from "@/lib/company-stamp-data"
import {
  ArrowLeft,
  Printer,
  Save,
  FileText,
  Eye,
  Plus,
  Loader2,
  Package,
  Check,
  Download,
  CheckCircle2,
  Copy,
  Sliders,
  Layers,
  Keyboard,
  Cloud,
  RefreshCw,
  FileSpreadsheet,
  MoreHorizontal,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { OnlineSyncStatusBadge } from "@/components/sync/online-sync-status-badge"
import type { PreviewMode } from "./use-a4-preview-scale"

export interface A4PreviewToolbarProps {
  bolNumber: string
  isLoading: boolean
  isSaving: boolean
  isEditMode: boolean
  hasUnsavedChanges?: boolean
  autoSaveStatus: "idle" | "saving" | "saved" | "local" | "error"
  lastAutoSaveTime?: string
  lastAutoSavedTime?: string | null
  previewMode: PreviewMode
  previewScale: number
  isFullscreen: boolean
  bgImageUrl: string | null
  bgOpacity: number
  showStampSignature: boolean
  formData: BillOfLadingFormData
  issueDate: string
  onBackToEditor: () => void
  onSave: () => void
  onSetPreviewMode: (mode: PreviewMode) => void
  onSetManualScale: (scale: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleFullscreen: () => void
  onSetBgImage: (url: string, opacity?: number) => void
  onSetBgOpacity: (opacity: number) => void
  onToggleStampSignature: () => void
  onDownloadPdf: (kind: "all" | "bol" | "packing-list" | "stickers") => void
  onDirectPrint: () => void
  onOpenPrintDialog?: () => void
  onOpenDocumentCenter: () => void
  onOpenSavedDocuments: () => void
  onNewDocument: () => void
  onDuplicateCurrent: () => void
  onOpenCloudSync: () => void
  onOpenPdfSettings: () => void
  onOpenShortcuts: () => void
  onToggleDiagnostics?: () => void
}

function A4PreviewToolbarBase({
  bolNumber,
  isLoading,
  isSaving,
  isEditMode,
  hasUnsavedChanges = false,
  autoSaveStatus,
  lastAutoSaveTime,
  lastAutoSavedTime,
  previewMode,
  previewScale,
  isFullscreen,
  bgImageUrl,
  bgOpacity,
  showStampSignature,
  formData,
  issueDate,
  onBackToEditor,
  onSave,
  onSetPreviewMode,
  onSetManualScale,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onSetBgImage,
  onSetBgOpacity,
  onToggleStampSignature,
  onDownloadPdf,
  onDirectPrint,
  onOpenPrintDialog,
  onOpenDocumentCenter,
  onOpenSavedDocuments,
  onNewDocument,
  onDuplicateCurrent,
  onOpenCloudSync,
  onOpenPdfSettings,
  onOpenShortcuts,
  onToggleDiagnostics,
}: A4PreviewToolbarProps) {
  const currentPreset = DOCUMENT_BACKGROUNDS.find((p) => p.url === bgImageUrl)

  const [stampScale, setStampScale] = React.useState(() => {
    if (typeof window !== "undefined") {
      return getStoredCompanyStampConfig().scale || 1.2
    }
    return 1.2
  })

  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<CompanyStampConfig>>
      if (customEvent.detail?.scale !== undefined) {
        setStampScale(customEvent.detail.scale)
      }
    }
    window.addEventListener("company_stamp_updated", handleUpdate)
    return () => window.removeEventListener("company_stamp_updated", handleUpdate)
  }, [])

  const updateStampScale = (newScale: number) => {
    const clamped = Math.min(2.5, Math.max(0.5, Math.round(newScale * 100) / 100))
    setStampScale(clamped)
    saveStoredCompanyStampConfig({ scale: clamped })
  }

  return (
    <div
      role="toolbar"
      aria-label="A4 Preview Controls"
      className="a4-preview-toolbar bol-editor-toolbar sticky top-0 z-30 print:hidden"
    >
      {/* ==================================================== */}
      {/* CLUSTER ROW 1: DOCUMENT IDENTITY (A) & SAVE/UPDATE (B) */}
      {/* ==================================================== */}
      <div className="toolbar-cluster-row-1">
        {/* GROUP A: Document Identity */}
        <div className="toolbar-group toolbar-group-identity flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0 shrink-0">
          {/* Back to BOL Editor Button */}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onBackToEditor}
            className="h-8 px-2.5 sm:px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50/80 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs shadow-2xs cursor-pointer gap-1.5 transition-all shrink-0"
            title="Back to BOL Editor Form (Ctrl + Shift + F)"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="hidden sm:inline">BOL Editor</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {/* BOL Number Badge */}
          <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/60 px-2.5 py-1 shadow-2xs shrink-0 h-8">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-700 dark:text-blue-400" />
            ) : (
              <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-xs tracking-tight">
                {bolNumber}
              </span>
            )}
          </div>

          {/* Autosaved Status Indicator */}
          <div role="status" aria-live="polite" className="flex items-center shrink-0">
            {autoSaveStatus === "saving" || isSaving ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/90 dark:bg-amber-950/60 dark:border-amber-800 px-2.5 py-1 text-xs text-amber-900 dark:text-amber-200 font-bold shadow-2xs animate-pulse h-8">
                <RefreshCw className="h-3 w-3 text-amber-600 animate-spin shrink-0" />
                <span>Autosaving…</span>
              </div>
            ) : autoSaveStatus === "saved" ? (
              <div
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-all h-8"
                title={`Draft autosaved at ${lastAutoSaveTime || lastAutoSavedTime || "just now"}. Press Ctrl+S to save official document.`}
                onClick={onSave}
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Autosaved ✓
                  {lastAutoSaveTime || lastAutoSavedTime ? (
                    <span className="hidden 2xl:inline font-mono text-[11px] font-normal opacity-90 ml-1">
                      ({lastAutoSaveTime || lastAutoSavedTime})
                    </span>
                  ) : null}
                </span>
              </div>
            ) : autoSaveStatus === "local" ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 shadow-2xs dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 h-8">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                <span>Saved locally</span>
              </div>
            ) : hasUnsavedChanges ? (
              <div
                className="flex items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-emerald-50/70 px-2.5 py-1 text-xs font-bold text-emerald-900 shadow-2xs dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 h-8"
                title="Previewing live draft changes. Click Save/Update to commit official BOL."
              >
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">Live Draft Preview</span>
                <span className="xl:hidden">Draft</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 h-8">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>Saved ✓</span>
              </div>
            )}
          </div>

          {/* Online Cloud Sync Status Badge */}
          <OnlineSyncStatusBadge
            variant="compact"
            onOpenCloudSync={onOpenCloudSync}
            className="hidden sm:inline-flex"
          />
          <OnlineSyncStatusBadge
            variant="icon"
            onOpenCloudSync={onOpenCloudSync}
            className="sm:hidden"
          />
        </div>

        {/* GROUP B: Save and Update */}
        <div className="toolbar-group toolbar-group-save flex items-center shrink-0">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="h-8 rounded-lg bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-3.5 text-xs font-black text-white shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Save / Update Document (Ctrl + S)"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-0.5" /> : <Save className="h-3.5 w-3.5 mr-0.5" />}
            <span>{isEditMode ? "Update" : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Desktop Vertical Divider 1 */}
      <div className="toolbar-divider-desktop" />

      {/* ==================================================== */}
      {/* CLUSTER ROW 2: PREVIEW NAV (C), APPEARANCE (D), EXPORT (E) */}
      {/* ==================================================== */}
      <div className="toolbar-cluster-row-2">
        {/* Navigation & Appearance Subrow */}
        <div className="toolbar-group-nav-appearance flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0 shrink-0">
          {/* GROUP C: Preview Navigation */}
          <div className="toolbar-group toolbar-group-nav flex items-center shrink-0">
            <div className="inline-flex items-center gap-0.5 bg-slate-100/90 dark:bg-slate-800/90 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0 h-8">
              <button
                type="button"
                data-fit-page="true"
                onClick={() => onSetPreviewMode("page")}
                className={`h-7 px-2 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center ${
                  previewMode === "page"
                    ? "bg-blue-600 text-white shadow-2xs font-black"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
                title="Fit complete physical A4 page on screen without scrolling (Ctrl + 0)"
              >
                Fit Page
              </button>

              <button
                type="button"
                data-fit-width="true"
                onClick={() => onSetPreviewMode("width")}
                className={`h-7 px-2 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center ${
                  previewMode === "width"
                    ? "bg-blue-600 text-white shadow-2xs font-black"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                }`}
                title="Fit document width to screen; scroll vertically (Ctrl + Shift + 0)"
              >
                Fit Width
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                className="h-7 w-6 p-0 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer flex items-center justify-center shrink-0"
                title="Zoom Out (Ctrl + -)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>

              {/* Interactive Percentage Label: Click to reset to 100% */}
              <button
                type="button"
                onClick={() => onSetManualScale(1.0)}
                className={`h-7 font-mono text-xs font-bold px-2 rounded hover:bg-white dark:hover:bg-slate-700 min-w-[36px] px-1 text-center select-none cursor-pointer transition-colors flex items-center justify-center ${
                  previewMode === "manual" && Math.round(previewScale * 100) === 100
                    ? "text-blue-600 dark:text-blue-400 font-black"
                    : "text-slate-700 dark:text-slate-300"
                }`}
                title="Click to reset to 100% physical size (Ctrl + 1)"
              >
                {Math.round(previewScale * 100)}%
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                className="h-7 w-6 p-0 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer flex items-center justify-center shrink-0"
                title="Zoom In (Ctrl + +)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Divider between Nav and Appearance */}
          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

          {/* GROUP D: Document Appearance */}
          <div className="toolbar-group toolbar-group-appearance flex items-center gap-1.5 shrink-0">
            {/* Watermark Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-2.5 rounded-lg text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 gap-1.5 shadow-2xs cursor-pointer flex items-center shrink-0"
                  title={`Background & Watermark: ${currentPreset?.label ?? "None"} (${Math.round(bgOpacity * 100)}%)`}
                >
                  <Palette className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="hidden sm:inline text-xs font-bold">Watermark</span>
                  {bgImageUrl ? (
                    <span className="rounded bg-blue-100/90 dark:bg-blue-900/60 px-1.5 py-0.5 text-[10.5px] font-mono font-bold text-blue-800 dark:text-blue-200">
                      {Math.round(bgOpacity * 100)}%
                    </span>
                  ) : (
                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] text-slate-400 font-semibold">
                      Off
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-68 max-h-88 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border-slate-200 dark:border-slate-800"
              >
                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 px-2 py-1">
                  Document Background & Watermark
                </DropdownMenuLabel>
                {DOCUMENT_BACKGROUNDS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.label}
                    onClick={() => onSetBgImage(preset.url, preset.opacity)}
                    className={`gap-2 text-xs font-bold cursor-pointer rounded-lg px-2 py-1.5 ${
                      bgImageUrl === preset.url
                        ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {bgImageUrl === preset.url && (
                      <Check className="h-3.5 w-3.5 ml-auto text-blue-600 dark:text-blue-400" />
                    )}
                  </DropdownMenuItem>
                ))}
                {bgImageUrl && (
                  <>
                    <DropdownMenuSeparator className="my-1.5 dark:bg-slate-800" />
                    <div className="px-2 py-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block mb-1">
                        Watermark Opacity
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: "8%", val: 0.08 },
                          { label: "14%", val: 0.14 },
                          { label: "20%", val: 0.20 },
                          { label: "28%", val: 0.28 },
                        ].map((lvl) => (
                          <button
                            key={lvl.label}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSetBgOpacity(lvl.val)
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold text-center transition-all cursor-pointer ${
                              Math.round(bgOpacity * 100) === Math.round(lvl.val * 100)
                                ? "bg-blue-600 text-white shadow-2xs font-black"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Stamp & Signature Controls */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs overflow-hidden h-8 shrink-0">
              <button
                type="button"
                onClick={onToggleStampSignature}
                className={`h-full px-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showStampSignature
                    ? "bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                title="Toggle Official Stamp & Signature Overlay"
              >
                <span className="text-xs leading-none">{showStampSignature ? "🖋️" : "⚪"}</span>
                <span className="hidden sm:inline">Stamp</span>
              </button>

              {showStampSignature && (
                <div className="flex items-center border-l border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/40 px-0.5 h-full">
                  <button
                    type="button"
                    onClick={() => updateStampScale(stampScale - 0.1)}
                    className="h-5 w-4 flex items-center justify-center text-xs font-black text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer transition-colors"
                    title="Make stamp smaller"
                  >
                    -
                  </button>
                  <span className="px-1 text-[10px] font-mono font-bold text-blue-900 dark:text-blue-100 select-none">
                    {Math.round(stampScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => updateStampScale(stampScale + 0.1)}
                    className="h-5 w-4 flex items-center justify-center text-xs font-black text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded cursor-pointer transition-colors"
                    title="Make stamp bigger"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Vertical Divider 2 */}
        <div className="toolbar-divider-desktop" />

        {/* GROUP E: Export and Sharing */}
        <div className="toolbar-group toolbar-group-export flex items-center gap-1.5 shrink-0 flex-nowrap">
          {/* Copy WhatsApp Button */}
          <CopyWhatsAppButton
            bol={{ ...formData, bol_number: bolNumber, issue_date: issueDate }}
          />

          {/* Complete PDF Split Button */}
          <div className="inline-flex items-center rounded-lg shadow-2xs shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => void onDownloadPdf("all")}
              disabled={isSaving}
              className="h-8 px-2.5 rounded-r-none bg-gradient-to-r from-[#0369a1] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-extrabold text-xs cursor-pointer gap-1.5 shadow-xs flex items-center"
              title="Download Complete PDF (Page 1: BOL, Page 2: Packing List, Page 3: Sticker Label)"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden 2xl:inline">Complete PDF</span>
              <span className="2xl:hidden">PDF</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  className="h-8 px-1.5 rounded-l-none border-l border-white/25 bg-[#0284c7] hover:bg-[#0369a1] text-white cursor-pointer flex items-center justify-center"
                  title="Download options"
                >
                  <span className="text-[10px] opacity-90">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shipping documents
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => void onDownloadPdf("all")}
                  className="gap-2 text-xs font-black text-[#0284c7] dark:text-sky-400 cursor-pointer"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Download Complete PDF (All 3 Documents)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => void onDownloadPdf("bol")}
                  className="gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download BOL Only (Page 1)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void onDownloadPdf("packing-list")}
                  className="gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Download Packing List Only (Page 2)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void onDownloadPdf("stickers")}
                  className="gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Download Sticker Label Only (Page 3)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Print Button Group */}
          <div className="inline-flex items-center rounded-lg shadow-2xs shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDirectPrint}
              className={`h-8 px-2 sm:px-2.5 ${onOpenPrintDialog ? "rounded-r-none" : "rounded-lg"} border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer gap-1.5 flex items-center shrink-0 shadow-2xs`}
              title="Instant Print Document (Ctrl + P)"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            {onOpenPrintDialog && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-1.5 rounded-l-none border-l-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-center"
                    title="Print options & quality settings"
                  >
                    <span className="text-[10px] opacity-70">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <DropdownMenuItem
                    onClick={onDirectPrint}
                    className="gap-2 text-xs font-bold cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-blue-600" />
                    <span>Direct Print (Default Printer)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onOpenPrintDialog}
                    className="gap-2 text-xs font-bold cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-amber-500" />
                    <span>Print Options & Quality</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Fullscreen Toggle Button */}
          <Button
            type="button"
            size="sm"
            variant={isFullscreen ? "default" : "outline"}
            onClick={onToggleFullscreen}
            className={`h-8 w-8 p-0 rounded-lg font-bold shadow-2xs cursor-pointer transition-all flex items-center justify-center shrink-0 ${
              isFullscreen
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Preview (Distraction-Free)"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>

          {/* More Actions Dropdown (•••) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-2xs shrink-0 cursor-pointer flex items-center justify-center"
                title="More actions & secondary tools"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl p-1.5 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <DropdownMenuItem onClick={onDuplicateCurrent} className="gap-2 text-xs font-bold cursor-pointer">
                <Copy className="h-3.5 w-3.5 text-purple-600" />
                <span>Duplicate BOL</span>
                <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+Shift+D</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenCloudSync} className="gap-2 text-xs font-bold cursor-pointer">
                <Cloud className="h-3.5 w-3.5 text-blue-600" />
                <span>Cloud Sync / Backup</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenPdfSettings} className="gap-2 text-xs font-bold cursor-pointer">
                <Sliders className="h-3.5 w-3.5 text-slate-600" />
                <span>BOL Print Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenDocumentCenter} className="gap-2 text-xs font-bold cursor-pointer">
                <Eye className="h-3.5 w-3.5 text-[#0284c7]" />
                <span>Preview Documents (3-in-1)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-slate-800" />
              <DropdownMenuItem onClick={onOpenSavedDocuments} className="gap-2 text-xs font-bold cursor-pointer">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span>Saved BOLs Archive</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewDocument} className="gap-2 text-xs font-bold cursor-pointer">
                <Plus className="h-3.5 w-3.5 text-blue-600" />
                <span>New BOL</span>
                <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+Shift+N</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-slate-800" />
              <DropdownMenuItem onClick={onOpenShortcuts} className="gap-2 text-xs font-bold cursor-pointer">
                <Keyboard className="h-3.5 w-3.5 text-slate-600" />
                <span>Keyboard Shortcuts</span>
                <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+/</span>
              </DropdownMenuItem>
              {onToggleDiagnostics && (
                <>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuItem onClick={onToggleDiagnostics} className="gap-2 text-xs font-mono text-slate-500 cursor-pointer">
                    <span>Diagnostics Overlay</span>
                    <span className="ml-auto text-[10px] text-slate-400">Ctrl+Shift+X</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export const A4PreviewToolbar = React.memo(A4PreviewToolbarBase)
