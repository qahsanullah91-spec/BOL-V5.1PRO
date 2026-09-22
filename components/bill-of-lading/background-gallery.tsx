"use client"

import { useState } from 'react'
import {
  Check,
  Search,
  Sparkles,
  Shield,
  Ship,
  Truck,
  Plane,
  Mountain,
  Layers,
  FileText,
  Sliders,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DOCUMENT_BACKGROUNDS, type DocumentBackground } from '@/lib/document-backgrounds'

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  All: { label: 'All Watermarks', icon: Sparkles },
  Geometric: { label: 'Banknote Guilloche', icon: Shield },
  Maritime: { label: 'Maritime & Port', icon: Ship },
  Overland: { label: 'Silk Road Transit', icon: Truck },
  Aviation: { label: 'Aviation & Air Cargo', icon: Plane },
  Mountains: { label: 'Mountain Topo', icon: Mountain },
  Classic: { label: 'Classic Blueprints', icon: Layers },
}

interface BackgroundGalleryProps {
  value: string
  opacity?: number
  onOpacityChange?: (opacity: number) => void
  onSelect: (preset: DocumentBackground) => void
}

export function BackgroundGallery({
  value,
  opacity,
  onOpacityChange,
  onSelect,
}: BackgroundGalleryProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Categories list
  const rawCategories = ['All', ...Array.from(new Set(DOCUMENT_BACKGROUNDS.map((item) => item.category)))]

  // Filtered list
  const filtered = DOCUMENT_BACKGROUNDS.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const searchTarget = `${item.label} ${item.category}`.toLowerCase()
    const matchesQuery = query.trim() === '' || searchTarget.includes(query.trim().toLowerCase())
    return matchesCategory && matchesQuery
  })

  const currentPreset = DOCUMENT_BACKGROUNDS.find((item) => item.url === value)
  const currentOpacity = opacity ?? currentPreset?.opacity ?? 0.14

  return (
    <div className="space-y-4 mb-4">
      {/* 1. Live Document Watermark Readability Preview */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-900 p-4 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Miniature Paper Simulation */}
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-white/20">
              {/* Background Watermark Layer */}
              {value && (
                <div
                  className="absolute inset-0 bg-contain bg-center bg-no-repeat pointer-events-none transition-opacity duration-200"
                  style={{
                    backgroundImage: `url('${value}')`,
                    opacity: Math.max(0.04, Math.min(0.40, currentOpacity)),
                  }}
                  aria-hidden="true"
                />
              )}
              {/* Mock Invoice & Waybill Text Lines to Verify Legibility */}
              <div className="relative z-10 flex h-full flex-col justify-between text-[4.5px] leading-tight text-slate-800 font-sans select-none">
                <div>
                  <div className="flex items-center justify-between border-b border-blue-900/40 pb-0.5 font-black text-blue-950">
                    <span>SKY ARIANA</span>
                    <span className="text-[3.5px] font-mono">B/L 84920</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <div className="h-0.5 w-10 bg-slate-400/80 rounded" />
                    <div className="h-0.5 w-14 bg-slate-300 rounded" />
                    <div className="h-0.5 w-8 bg-slate-300 rounded" />
                  </div>
                </div>
                <div className="space-y-0.5 border-t border-slate-200 pt-0.5 font-mono text-[4px] text-slate-700">
                  <div className="flex justify-between font-bold">
                    <span>NET WT:</span>
                    <span>24,800 KG</span>
                  </div>
                  <div className="flex justify-between text-blue-900 font-bold">
                    <span>BALANCE:</span>
                    <span>$12,450 USD</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white">
                  {currentPreset?.label ?? (value ? 'Custom Watermark' : 'Clean White Paper')}
                </h4>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                  {currentPreset?.category ?? 'Base'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Simulated A4 bill of lading sheet · Legibility optimized with pure transparent vector security ink.
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400 font-mono">
                <span>Active Opacity:</span>
                <span className="font-bold text-amber-400">{Math.round(currentOpacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Quick Opacity Adjusters */}
          {onOpacityChange && value && (
            <div className="flex flex-col sm:items-end gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Quick Intensity:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Subtle 8%', val: 0.08 },
                  { label: 'Clean 14%', val: 0.14 },
                  { label: 'Balanced 20%', val: 0.20 },
                  { label: 'Prominent 28%', val: 0.28 },
                ].map((preset) => {
                  const isActive = Math.round(currentOpacity * 100) === Math.round(preset.val * 100)
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onOpacityChange(preset.val)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            aria-label="Search backgrounds"
            placeholder="Search guilloche, mountain, port, flight…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8 bg-white border-slate-200"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 shrink-0" role="status">
          Showing <strong>{filtered.length}</strong> of {DOCUMENT_BACKGROUNDS.length} watermarks
        </p>
      </div>

      {/* Category Chips with Icons */}
      <div className="flex flex-wrap gap-1.5" aria-label="Background categories">
        {rawCategories.map((catKey) => {
          const meta = CATEGORY_META[catKey] ?? { label: catKey, icon: Sparkles }
          const Icon = meta.icon
          const isSelected = selectedCategory === catKey
          return (
            <button
              key={catKey}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedCategory(catKey)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-900 text-white shadow-xs ring-2 ring-blue-600'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`} />
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Watermark Grid */}
      <div
        className="grid max-h-[460px] overflow-y-auto grid-cols-2 gap-3.5 p-1 sm:grid-cols-3 lg:grid-cols-4"
        aria-label="Document backgrounds"
      >
        {filtered.map((item) => {
          const isSelected = value === item.url
          return (
            <button
              type="button"
              key={item.label}
              aria-label={`Use ${item.label} watermark`}
              aria-pressed={isSelected}
              onClick={() => onSelect(item)}
              className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500 shadow-md shadow-blue-100'
                  : 'border-slate-200/90 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-50/60 p-2 flex items-center justify-center">
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.label}
                    loading="lazy"
                    className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-xs font-semibold text-slate-400">
                    Clean White
                  </div>
                )}

                {/* Selection Checkmark Badge */}
                {isSelected && (
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-blue-600 p-1.5 text-white shadow-md">
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                )}

                {/* Format Tag */}
                <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs backdrop-blur-xs">
                  {item.url.endsWith('.svg') ? 'SVG Vector' : item.url ? 'High-Res' : 'Blank'}
                </span>
              </div>

              {/* Information Row */}
              <div className="p-3 border-t border-slate-100 bg-white flex flex-col justify-between flex-1">
                <div>
                  <p className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                    {CATEGORY_META[item.category]?.label ?? item.category}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>Rec. Opacity:</span>
                  <span className="font-bold text-slate-700">{Math.round(item.opacity * 100)}%</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">No backgrounds match your search query.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSelectedCategory('All')
            }}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Reset search and filters
          </button>
        </div>
      )}

      <p className="text-[11px] text-slate-500">
        Banknote guilloche, maritime compass roses, and Silk Road contours are generated as 100% self-contained vector SVGs. All artwork renders offline and supports high-dpi vector printing.
      </p>
    </div>
  )
}

