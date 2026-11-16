'use client'

import React, { useState } from 'react'
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  RotateCw,
  Share2,
  FileText,
  Truck,
  CheckCircle2,
} from 'lucide-react'
import { AIWhatsAppCard, SupportedLanguage } from '@/lib/types/ai-assistant'
import { toast } from 'sonner'

interface WhatsAppCardProps {
  card: AIWhatsAppCard
  onRegenerate?: (card: AIWhatsAppCard) => void
  onLanguageChange?: (card: AIWhatsAppCard, newLang: SupportedLanguage) => void
}

export function WhatsAppMessageCard({ card, onRegenerate, onLanguageChange }: WhatsAppCardProps) {
  const [version, setVersion] = useState<'short' | 'detailed'>(card.currentVersion || 'detailed')
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(
    version === 'short' && card.shortVersion ? card.shortVersion : card.detailedVersion || card.message
  )
  const [copied, setCopied] = useState(false)

  const activeText = isEditing
    ? editedText
    : version === 'short' && card.shortVersion
    ? card.shortVersion
    : card.detailedVersion || card.message

  const currentWaUrl = `https://wa.me/${card.phone || ''}?text=${encodeURIComponent(activeText)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(activeText)
    setCopied(true)
    toast.success('WhatsApp message copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSwitchVersion = (v: 'short' | 'detailed') => {
    setVersion(v)
    if (v === 'short' && card.shortVersion) {
      setEditedText(card.shortVersion)
    } else {
      setEditedText(card.detailedVersion || card.message)
    }
  }

  const getLangBadge = (lang: string) => {
    if (lang === 'FA') return 'فارسی / Dari'
    if (lang === 'PS') return 'پښتو / Pashto'
    return 'English'
  }

  return (
    <div className="w-full my-3 rounded-2xl bg-gradient-to-b from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 border border-emerald-500/30 dark:border-emerald-600/30 shadow-md overflow-hidden transition-all">
      {/* WhatsApp Card Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-600/15 dark:bg-emerald-900/30 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {card.title || 'WhatsApp Message Generator'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                {getLangBadge(card.language)}
              </span>
            </div>
            {card.bolNumber && (
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                BOL: {card.bolNumber} {card.truckNumber ? `• Truck: ${card.truckNumber}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Short / Detailed Toggle */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/80 p-0.5 rounded-xl border border-emerald-500/20 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => handleSwitchVersion('short')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              version === 'short'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Short
          </button>
          <button
            type="button"
            onClick={() => handleSwitchVersion('detailed')}
            className={`px-2 py-0.5 rounded-lg transition-all ${
              version === 'detailed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>

      {/* Message Body */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="w-full p-3 text-xs font-mono rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Edit message wording..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Done Editing
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`p-3.5 rounded-xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed shadow-inner ${
              card.language === 'FA' || card.language === 'PS' ? 'text-right' : 'text-left'
            }`}
            dir={card.language === 'FA' || card.language === 'PS' ? 'rtl' : 'ltr'}
          >
            {activeText}
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy WhatsApp Message'}</span>
          </button>

          <a
            href={currentWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Edit wording"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit'}</span>
          </button>

          {onRegenerate && (
            <button
              type="button"
              onClick={() => onRegenerate(card)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Regenerate message"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
