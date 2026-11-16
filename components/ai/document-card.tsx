'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Share2,
  ExternalLink,
  ShieldCheck,
  Loader2,
  FolderDown,
} from 'lucide-react'
import { AIDocumentArtifact } from '@/lib/types/ai-assistant'
import { toast } from 'sonner'

interface DocumentCardProps {
  artifact: AIDocumentArtifact
  onViewBol?: (bolNumber: string) => void
}

export function DocumentArtifactCard({ artifact, onViewBol }: DocumentCardProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!artifact.downloadUrl) return
    setDownloading(true)
    try {
      const a = document.createElement('a')
      a.href = artifact.downloadUrl
      a.download = artifact.fileName || 'Document.pdf'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Download started: ${artifact.fileName}`)
    } catch (err: any) {
      toast.error('Failed to initiate download.')
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }

  const handlePreview = () => {
    if (artifact.downloadUrl) {
      window.open(artifact.downloadUrl, '_blank')
    }
  }

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'COMPLETE_PACKAGE':
        return 'Complete 3-Page Shipping Package'
      case 'BOL_PAGE_1':
        return 'Bill of Lading (Page 1)'
      case 'PACKING_LIST':
        return 'Packing List (Page 2)'
      case 'STICKER_LABEL':
        return 'Sticker Label (Page 3)'
      case 'ACCI_INVOICE':
        return 'ACCI Certified Commercial Invoice'
      case 'ACCI_PACKING_LIST':
        return 'ACCI Certified Export Packing List'
      default:
        return 'Official Document'
    }
  }

  return (
    <div className="w-full my-3 rounded-2xl bg-gradient-to-b from-blue-500/10 via-slate-50 to-white dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 border border-blue-500/30 dark:border-blue-600/30 shadow-md overflow-hidden transition-all">
      {/* Document Card Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600/15 dark:bg-blue-900/30 border-b border-blue-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {artifact.title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                {artifact.pagesCount} Page(s)
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              {artifact.fileName} • {artifact.fileSize || 'PDF'}
            </span>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>Verified & Signed</span>
        </span>
      </div>

      {/* Document Description Body */}
      <div className="p-4 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
        <p className="leading-relaxed">
          {artifact.description ||
            `Official vector document generated directly from verified database records with high-resolution headers, bilingual text, and QR code verification credentials.`}
        </p>

        {artifact.bolNumber && (
          <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">BOL Ref:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{artifact.bolNumber}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-400">Type:</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {getDocTypeBadge(artifact.type)}
            </span>
          </div>
        )}
      </div>

      {/* Document Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Preview in Browser</span>
          </button>
        </div>

        {artifact.bolNumber && onViewBol && (
          <button
            type="button"
            onClick={() => onViewBol(artifact.bolNumber!)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open in BOL Editor</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
