"use client"

/**
 * Module 4 — "Smart Typing & AI Recommendations" settings card.
 * / تنظیمات هوشمند تایپ و پیشنهادات خودکار
 *
 * Self-contained: reads/writes SmartPredictorEngine settings, manages the
 * learned dictionary (view / search / delete), no external state needed.
 */

import React, { useMemo, useState, useSyncExternalStore } from "react"
import { Sparkles, Wand2, UserRoundCheck, ShieldCheck, Trash2, Search, BookA } from "lucide-react"
import { SmartPredictorEngine, type FieldCategory, type SmartTypingSettings } from "@/lib/smart/smart-predictor-engine"

const CATEGORY_LABELS: Partial<Record<FieldCategory, string>> = {
  shipper: "Shippers",
  consignee: "Consignees",
  notify: "Notify Parties",
  commodity: "Cargo",
  packages: "Packages",
  truck: "Truck Plates",
  driver: "Drivers",
  phone: "Phones",
  driverPhone: "Driver Phones",
  email: "Emails",
  taxid: "Tax IDs",
  address: "Addresses",
  route: "Routes / Borders",
  rent: "Rents",
  weight: "Weights",
  notes: "Notes",
  ledgerDesc: "Ledger Descriptions",
  generic: "General",
}

function Toggle({
  enabled,
  onChange,
  icon,
  title,
  titleFa,
  desc,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  icon: React.ReactNode
  title: string
  titleFa: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
        enabled
          ? "border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30"
          : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-xl shrink-0 ${enabled ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
            <span>{title}</span>
            <span className="text-[10px] font-bold text-slate-400 font-[vazirmatn]" dir="rtl">
              {titleFa}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
        </div>
      </div>
      <span
        className={`relative inline-flex h-5.5 w-10 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  )
}

export function SmartTypingSettingsCard() {
  const settings = useSyncExternalStore(
    (cb) => SmartPredictorEngine.onSettingsChange(cb),
    () => SmartPredictorEngine.getSettings(),
    () => SmartPredictorEngine.getSettings(),
  )
  const [search, setSearch] = useState("")
  const [refreshTick, setRefreshTick] = useState(0)

  const set = (patch: Partial<SmartTypingSettings>) => SmartPredictorEngine.updateSettings(patch)

  const entries = useMemo(() => {
    void refreshTick
    return SmartPredictorEngine.dictionarySnapshot()
      .filter((e) => !search || e.value.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 60)
  }, [search, refreshTick])

  const grammarLevels: { id: SmartTypingSettings["grammarLevel"]; label: string; fa: string }[] = [
    { id: "off", label: "Off", fa: "خاموش" },
    { id: "highlight", label: "Highlight Only", fa: "فقط نشان دادن" },
    { id: "autofix", label: "Auto-Fix Commercial Terms", fa: "اصلاح خودکار" },
  ]

  return (
    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-purple-500 before:via-indigo-500 before:to-blue-500">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2 flex-wrap tracking-tight">
              <span>Smart Typing &amp; AI Recommendations</span>
              <span className="text-[11px] font-bold text-slate-400 font-[vazirmatn]" dir="rtl">
                / تنظیمات هوشمند تایپ و پیشنهادات خودکار
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Predictive autocomplete, ghost text, profile auto-fill &amp; bilingual grammar assistance in every field
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <Toggle
          enabled={settings.masterEnabled}
          onChange={(v) => set({ masterEnabled: v })}
          icon={<Sparkles className="w-4 h-4" />}
          title="Smart Field Recommendations"
          titleFa="پیشنهاد خودکار کلمات و نام‌ها"
          desc="Frosted-glass suggestions from 268+ historical BOLs & ledgers in every input"
        />
        <Toggle
          enabled={settings.ghostText}
          onChange={(v) => set({ ghostText: v })}
          icon={<Wand2 className="w-4 h-4" />}
          title="Inline Ghost Text (Tab)"
          titleFa="تکمیل سایه‌ای با Tab"
          desc="GitHub-style inline completion — press Tab or → to accept"
        />
        <Toggle
          enabled={settings.autoFillProfiles}
          onChange={(v) => set({ autoFillProfiles: v })}
          icon={<UserRoundCheck className="w-4 h-4" />}
          title="Auto-Fill Linked Profiles"
          titleFa="تکمیل خودکار مشخصات"
          desc="Fill address, phone, GSTIN/IEC/PAN automatically when a known party is selected"
        />
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-900 dark:text-slate-100">Grammar &amp; Auto-Correction</span>
            <span className="text-[10px] font-bold text-slate-400 font-[vazirmatn]" dir="rtl">
              / گرامر و اصلاح خودکار
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {grammarLevels.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => set({ grammarLevel: lvl.id })}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black transition cursor-pointer ${
                  settings.grammarLevel === lvl.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {lvl.label}
                <span className="ml-1 font-[vazirmatn] opacity-70">{lvl.fa}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Dictionary Manager */}
      <div className="mt-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookA className="w-3.5 h-3.5" />
            Learned Dictionary
            <span className="text-[10px] font-bold text-slate-400 font-[vazirmatn]" dir="rtl">
              / دیکشنری یادگرفته‌شده
            </span>
          </span>
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learned values..."
              className="h-7 w-44 pl-7 pr-2 text-[11px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
        <div className="max-h-44 overflow-y-auto scrollbar-thin space-y-1">
          {entries.length === 0 && (
            <p className="text-[11px] text-slate-400 py-3 text-center">
              {search ? "No learned values match." : "The dictionary fills up automatically as you save BOLs and ledger entries."}
            </p>
          )}
          {entries.map((e) => (
            <div
              key={`${e.category}-${e.value}`}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
            >
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {e.value.length > 90 ? e.value.slice(0, 90) + "…" : e.value}
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  {CATEGORY_LABELS[e.category] || e.category} • used {e.freq}× • {new Date(e.lastUsed).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  SmartPredictorEngine.removeFromDictionary(e.value, e.category as FieldCategory)
                  setRefreshTick((t) => t + 1)
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                title="Remove from dictionary"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
