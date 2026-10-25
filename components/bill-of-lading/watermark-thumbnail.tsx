"use client"

import React, { useState } from 'react'
import { FileText, AlertTriangle } from 'lucide-react'

export interface WatermarkThumbnailProps {
  url: string
  label: string
  category?: string
  highContrast?: boolean
  className?: string
  imageClassName?: string
  showPaperFrame?: boolean
}

/**
 * WatermarkThumbnail
 * 
 * Specialized high-clarity renderer for Bill of Lading watermarks.
 * Solves the washed-out / faint thumbnail problem by applying a calibrated high-contrast
 * presentation filter and authentic paper backdrop for library browsing,
 * while leaving underlying vector assets and final document printing opacities untouched.
 */
export function WatermarkThumbnail({
  url,
  label,
  category,
  highContrast = true,
  className = '',
  imageClassName = '',
  showPaperFrame = true,
}: WatermarkThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const isBlank = !url || url.trim() === ''
  const isSvg = url?.toLowerCase().endsWith('.svg')

  // Clean White / Blank Watermark
  if (isBlank) {
    return (
      <div
        className={`relative aspect-[210/297] h-full max-h-full mx-auto rounded-sm bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-2xs flex flex-col items-center justify-center p-2 text-center select-none ${className}`}
        aria-label="Clean White Paper - No Watermark"
      >
        <FileText className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-1" />
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Clean White
        </span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500">
          No Watermark
        </span>
      </div>
    )
  }

  // Error Fallback
  if (hasError) {
    return (
      <div
        className={`relative aspect-[210/297] h-full max-h-full mx-auto rounded-sm bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col items-center justify-center p-2 text-center text-amber-700 dark:text-amber-400 select-none ${className}`}
      >
        <AlertTriangle className="h-5 w-5 mb-1 opacity-70" />
        <span className="text-[10px] font-semibold">Preview Unavailable</span>
        <span className="text-[8px] opacity-75 truncate max-w-full px-1">{label}</span>
      </div>
    )
  }

  // Calibrated Visual Contrast Boost Filter
  // High-contrast mode enhances fine strokes and opacities for crisp browsing while preserving color fidelity.
  const filterStyle = highContrast
    ? isSvg
      ? 'contrast(1.32) brightness(0.92) saturate(1.4)'
      : 'contrast(1.18) brightness(0.95) saturate(1.2)'
    : undefined

  // Photographic watermarks print as a full-page background cover, so preview
  // them edge-to-edge (object-cover) instead of letterboxing a small landscape
  // photo inside the portrait paper frame. Vector guilloche / blueprint art is
  // authored full-page with its own margins, so it keeps object-contain.
  const content = (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          console.warn(`[WATERMARK PREVIEW ERROR] Failed to load watermark: ${url}`, e)
          setHasError(true)
        }}
        className={`h-full w-full ${isSvg ? 'object-contain p-0.5' : 'object-cover'} transition-transform duration-300 group-hover:scale-[1.03] ${imageClassName}`}
        style={filterStyle ? { filter: filterStyle } : undefined}
      />
    </div>
  )

  if (!showPaperFrame) {
    return content
  }

  return (
    <div
      className={`relative aspect-[210/297] h-full max-h-full mx-auto rounded-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 shadow-xs flex items-center justify-center p-0.5 group-hover:border-blue-400 group-hover:shadow-md transition-all ${className}`}
      aria-label={`Watermark thumbnail for ${label}`}
    >
      {/* Subtle Paper Corner Marks to simulate authentic security document */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-slate-300 dark:border-slate-600 pointer-events-none z-10" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-slate-300 dark:border-slate-600 pointer-events-none z-10" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-slate-300 dark:border-slate-600 pointer-events-none z-10" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-slate-300 dark:border-slate-600 pointer-events-none z-10" />

      {content}
    </div>
  )
}
