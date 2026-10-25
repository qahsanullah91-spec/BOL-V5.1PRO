"use client"

/**
 * GlobalSmartInputLayer — Module 2 + parts of Modules 3/4/5.
 *
 * Mounted ONCE at the app root. Enhances every <input> and <textarea> in the
 * software at runtime (no form rewrites needed):
 *  - inline ghost-text completion (Tab / ArrowRight accepts)
 *  - frosted-glass suggestion popover with keyboard navigation
 *  - zero-character "focus suggestions"
 *  - 1-click relational "Auto-Fill Full Profile"
 *  - bilingual grammar assistant pill on textareas + blur auto-fix
 *
 * Everything is gated by the SmartTypingSettings (Module 4) and hot-path work
 * is rAF-deferred (Module 5).
 */

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Sparkles, Wand2, Languages, CheckCheck, ChevronRight, UserRoundCheck, X } from "lucide-react"
import {
  SmartPredictorEngine,
  detectCategory,
  type FieldCategory,
  type SmartSuggestion,
  type SmartTypingSettings,
} from "@/lib/smart/smart-predictor-engine"
import {
  checkText,
  autoFixText,
  toFormalClause,
  bilingualSync,
  type GrammarLevel,
  type GrammarIssue,
} from "@/lib/smart/grammar-and-polish-engine"

const CATEGORY_LABELS: Partial<Record<FieldCategory, string>> = {
  shipper: "Shipper / Exporter",
  consignee: "Consignee",
  notify: "Notify Party",
  commodity: "Cargo / Commodity",
  packages: "Packages",
  truck: "Truck Plate",
  driver: "Driver",
  driverPhone: "Driver Phone",
  phone: "Phone",
  email: "Email",
  taxid: "Tax / Registration ID",
  address: "Address",
  route: "Route / Border",
  rent: "Driver Rent",
  weight: "Weight",
  notes: "Notes",
  ledgerDesc: "Ledger Description",
}

interface ActiveField {
  el: HTMLInputElement | HTMLTextAreaElement
  category: FieldCategory
  isTextarea: boolean
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
}

function isEnhanceable(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return false
  if (el.hasAttribute("data-smart-disable")) return false
  if (el.readOnly || el.disabled) return false
  if (el.closest("[contenteditable='true'], [data-smart-ignore='true']")) return false
  const type = (el as HTMLInputElement).type
  if (el instanceof HTMLInputElement && !["text", "search", "tel", "email", "url", ""].includes(type)) return false
  return true
}

function measureCaretEndGhost(el: HTMLInputElement): { top: number; left: number } | null {
  // Ghost is only offered while the caret sits at the end of the value.
  const mirror = document.createElement("div")
  const cs = window.getComputedStyle(el)
  for (const prop of [
    "fontFamily", "fontSize", "fontWeight", "letterSpacing", "wordSpacing",
    "textTransform", "paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth",
    "direction", "boxSizing",
  ] as const) {
    mirror.style[prop] = cs[prop]
  }
  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.whiteSpace = "pre"
  mirror.style.width = "auto"
  mirror.textContent = el.value || "0"
  document.body.appendChild(mirror)
  const textW = mirror.getBoundingClientRect().width - (el.value ? 0 : 0)
  document.body.removeChild(mirror)
  const csPad = parseFloat(cs.paddingLeft) || 0
  const csBorder = parseFloat(cs.borderLeftWidth) || 0
  return { top: 0, left: Math.max(0, textW + csPad + csBorder) }
}

export function GlobalSmartInputLayer() {
  const [settings, setSettings] = useState<SmartTypingSettings>(() => SmartPredictorEngine.getSettings())
  const [active, setActive] = useState<ActiveField | null>(null)
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [selected, setSelected] = useState(0)
  const [ghost, setGhost] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [pillPos, setPillPos] = useState<{ top: number; left: number } | null>(null)
  const [issues, setIssues] = useState<GrammarIssue[]>([])
  const [showIssues, setShowIssues] = useState(false)
  const [grammarMenu, setGrammarMenu] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  const activeRef = useRef<ActiveField | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingValue = useRef<string>("")
  const ghostAcceptedRef = useRef(false)

  // ------------------------------------------------------------- bootstrap
  useEffect(() => {
    setMounted(true)
    SmartPredictorEngine.loadPersisted()
    SmartPredictorEngine.ensureSourcesStarted()
    const t = setTimeout(() => void SmartPredictorEngine.fetchRemoteSources(), 3000)
    const off = SmartPredictorEngine.onSettingsChange(() => setSettings(SmartPredictorEngine.getSettings()))
    const onDocsUpdated = () => SmartPredictorEngine.ingestLocalCaches()
    window.addEventListener("skybol:documents-updated", onDocsUpdated)
    return () => {
      clearTimeout(t)
      off()
      window.removeEventListener("skybol:documents-updated", onDocsUpdated)
    }
  }, [])

  // --------------------------------------------------------- field tracking
  const refresh = useCallback(() => {
    const a = activeRef.current
    if (!a) return
    const { el, category, isTextarea } = a
    const rect = el.getBoundingClientRect()
    if (rect.width === 0) return
    setPopoverPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 340) })
    setPillPos({ top: rect.top + 2, left: rect.right - 8 })

    const value = el.value
    if (!isTextarea) {
      const atEnd = el.selectionStart === value.length
      const g = settings.ghostText && atEnd ? SmartPredictorEngine.ghostCompletion(category, value) : null
      setGhost(ghostAcceptedRef.current ? null : g)
    } else {
      setGhost(null)
    }
    const token = value.slice(0, el.selectionStart ?? value.length)
    setSuggestions(SmartPredictorEngine.suggest(category, token, { limit: 8, includePopular: true }))
    setSelected(0)

    if (isTextarea && settings.grammarLevel !== "off") {
      setIssues(checkText(value, settings.grammarLevel))
    }
  }, [settings.ghostText, settings.grammarLevel])

  const scheduleRefresh = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      refresh()
    })
  }, [refresh])

  const attachField = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      const category = detectCategory(el)
      const field: ActiveField = { el, category, isTextarea: el instanceof HTMLTextAreaElement }
      activeRef.current = field
      setDismissed(false)
      setShowIssues(false)
      setGrammarMenu(false)
      setActive(field)
      scheduleRefresh()
      el.setAttribute("data-smart-active", "true")
    },
    [scheduleRefresh],
  )

  const detachField = useCallback(
    (commit: boolean) => {
      const a = activeRef.current
      if (a) {
        a.el.removeAttribute("data-smart-active")
        if (commit && a.el.value.trim().length >= 2) {
          // Blur auto-fix for identity/company fields at autofix level
          if (
            settings.grammarLevel === "autofix" &&
            ["shipper", "consignee", "notify", "taxid"].includes(a.category) &&
            a.el instanceof HTMLInputElement
          ) {
            const fixed = autoFixText(a.el.value)
            if (fixed !== a.el.value) setNativeValue(a.el, fixed)
          }
          SmartPredictorEngine.learn(a.el.value, a.category)
        }
      }
      activeRef.current = null
      setActive(null)
      setSuggestions([])
      setGhost(null)
      setIssues([])
      setPopoverPos(null)
      setPillPos(null)
      setGrammarMenu(false)
      setShowIssues(false)
    },
    [settings.grammarLevel],
  )

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Element
      if (!isEnhanceable(t)) return
      ghostAcceptedRef.current = false
      attachField(t)
    }
    const onFocusOut = (e: FocusEvent) => {
      const t = e.target as Element
      if (t === activeRef.current?.el) detachField(true)
    }
    const onInput = (e: Event) => {
      if (e.target !== activeRef.current?.el) return
      if (ghostAcceptedRef.current) ghostAcceptedRef.current = false
      scheduleRefresh()
    }
    const onDocSave = () => SmartPredictorEngine.ingestLocalCaches()
    document.addEventListener("focusin", onFocusIn, true)
    document.addEventListener("focusout", onFocusOut, true)
    document.addEventListener("input", onInput, true)
    window.addEventListener("skybol:documents-updated", onDocSave)
    window.addEventListener("resize", scheduleRefresh)
    window.addEventListener("scroll", scheduleRefresh, true)
    return () => {
      document.removeEventListener("focusin", onFocusIn, true)
      document.removeEventListener("focusout", onFocusOut, true)
      document.removeEventListener("input", onInput, true)
      window.removeEventListener("skybol:documents-updated", onDocSave)
      window.removeEventListener("resize", scheduleRefresh)
      window.removeEventListener("scroll", scheduleRefresh, true)
    }
  }, [attachField, detachField, scheduleRefresh])

  // ------------------------------------------------------------- committing
  const commitSuggestion = useCallback(
    (s: SmartSuggestion) => {
      const a = activeRef.current
      if (!a) return
      setNativeValue(a.el, s.value)
      ghostAcceptedRef.current = false
      setGhost(null)
      setDismissed(true)
      // Relational auto-fill: offer + apply full profile for company fields
      if (
        settings.autoFillProfiles &&
        s.profile &&
        ["shipper", "consignee", "notify"].includes(a.category) &&
        s.profile.addresses.length + s.profile.phones.length + s.profile.emails.length + s.profile.taxIds.length > 0
      ) {
        autoFillProfile(a.el, s.profile, s.category)
      }
      scheduleRefresh()
      a.el.focus()
    },
    [settings.autoFillProfiles, scheduleRefresh],
  )

  const acceptGhost = useCallback(() => {
    const a = activeRef.current
    if (!a || !ghost) return
    setNativeValue(a.el, a.el.value + ghost)
    ghostAcceptedRef.current = true
    setGhost(null)
    scheduleRefresh()
  }, [ghost, scheduleRefresh])

  const autoFillProfile = (el: HTMLInputElement | HTMLTextAreaElement, profile: NonNullable<SmartSuggestion["profile"]>, role: FieldCategory) => {
    const container = el.closest("form") || el.closest("div[class]")?.parentElement || document.body
    const fill = (cat: FieldCategory, value: string) => {
      const fields = Array.from(container.querySelectorAll("input, textarea")).filter(
        (f) => f !== el && isEnhanceable(f) && detectCategory(f as HTMLInputElement) === cat && !(f as HTMLInputElement).value.trim(),
      ) as HTMLInputElement[]
      if (fields[0]) setNativeValue(fields[0], value)
    }
    for (const addr of profile.addresses.slice(0, 1)) fill("address", addr)
    for (const p of profile.phones.slice(0, 1)) fill("phone", p)
    for (const e of profile.emails.slice(0, 1)) fill("email", e)
    for (const t of profile.taxIds.slice(0, 3)) {
      const fields = Array.from(container.querySelectorAll("input")).filter(
        (f) => f !== el && isEnhanceable(f) && detectCategory(f) === "taxid",
      ) as HTMLInputElement[]
      const byLabel = fields.find((f) => (f.labels?.[0]?.textContent || "").toUpperCase().includes(t.label))
        || fields.find((f) => (f.name + f.id + f.placeholder).toLowerCase().includes(t.label.toLowerCase()))
        || fields.find((f) => !f.value.trim())
      if (byLabel) setNativeValue(byLabel, t.value)
    }
  }

  // -------------------------------------------------------- keyboard capture
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const a = activeRef.current
      if (!a || !settings.masterEnabled) return
      const popoverVisible = suggestions.length > 0 && !dismissed
      if (e.key === "Escape") {
        if (popoverVisible || grammarMenu || showIssues) {
          e.preventDefault()
          setDismissed(true)
          setGrammarMenu(false)
          setShowIssues(false)
        }
        return
      }
      if (e.key === "Tab") {
        if (ghost) {
          e.preventDefault()
          acceptGhost()
        } else if (popoverVisible && suggestions[0]) {
          e.preventDefault()
          commitSuggestion(suggestions[selected])
        }
        return
      }
      if (e.key === "ArrowRight" && ghost) {
        const el = a.el
        if (el.selectionStart === el.value.length) {
          e.preventDefault()
          acceptGhost()
        }
        return
      }
      if (!popoverVisible) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected((s) => (s + 1) % suggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => (s - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === "Enter" && !a.isTextarea) {
        e.preventDefault()
        commitSuggestion(suggestions[selected])
      }
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [active, suggestions, selected, ghost, dismissed, grammarMenu, showIssues, settings.masterEnabled, acceptGhost, commitSuggestion])

  // ------------------------------------------------------------ ghost layer
  const ghostLayer = (() => {
    const a = active
    if (!a || a.isTextarea || !ghost || !settings.ghostText || !settings.masterEnabled) return null
    const pos = measureCaretEndGhost(a.el as HTMLInputElement)
    if (!pos) return null
    const cs = window.getComputedStyle(a.el)
    const rect = a.el.getBoundingClientRect()
    return createPortal(
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: rect.top + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.paddingTop) || 0),
          left: rect.left + pos.left,
          height: rect.height,
          display: "flex",
          alignItems: cs.alignItems === "center" || true ? "center" : "flex-start",
          pointerEvents: "none",
          zIndex: 60,
          direction: cs.direction as "ltr" | "rtl",
        }}
      >
        <span
          style={{
            fontFamily: cs.fontFamily,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            letterSpacing: cs.letterSpacing,
            color: "#94a3b8",
            whiteSpace: "pre",
            opacity: 0.85,
          }}
        >
          {ghost}
        </span>
        <span
          style={{
            marginLeft: 8,
            fontFamily: cs.fontFamily,
            fontSize: 9.5,
            fontWeight: 800,
            color: "#94a3b8",
            background: "rgba(241,245,249,0.9)",
            border: "1px solid #e2e8f0",
            borderRadius: 5,
            padding: "1px 5px",
            lineHeight: 1.4,
            pointerEvents: "none",
          }}
        >
          Tab ↹
        </span>
      </div>,
      document.body,
    )
  })()

  // --------------------------------------------------------------- popover
  const popover = (() => {
    const a = active
    if (!a || !settings.masterEnabled || dismissed) return null
    if (!popoverPos) return null
    const isTextEmpty = a.el.value.trim() === ""
    if (!isTextEmpty && suggestions.length === 0) return null
    if (isTextEmpty && suggestions.length === 0) return null
    const categoryLabel = CATEGORY_LABELS[a.category]

    return createPortal(
      <div
        data-smart-popover="true"
        className="fixed z-[70] rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl shadow-2xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-98 duration-100"
        style={{ top: popoverPos.top, left: popoverPos.left, width: Math.min(480, popoverPos.width + 140), maxHeight: 380 }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
            Smart Recommendations {categoryLabel ? `• ${categoryLabel}` : ""}
          </span>
          <button
            type="button"
            className="text-slate-300 hover:text-slate-500 cursor-pointer"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDismissed(true)
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-1.5 pb-1.5 space-y-0.5" style={{ maxHeight: 320 }}>
          {suggestions.map((s, i) => {
            const q = a.el.value.trim().toLowerCase()
            const start = s.value.toLowerCase().startsWith(q) ? q.length : 0
            const isSel = i === selected
            const hasProfile =
              settings.autoFillProfiles &&
              s.profile &&
              ["shipper", "consignee", "notify"].includes(a.category) &&
              s.profile.addresses.length + s.profile.phones.length + s.profile.emails.length + s.profile.taxIds.length > 0
            return (
              <div key={`${s.category}-${s.value}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    commitSuggestion(s)
                  }}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isSel ? "bg-blue-500/10 dark:bg-blue-400/10" : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      <span className="text-[#2563EB] dark:text-blue-400 font-black">{s.value.slice(0, start)}</span>
                      <span>{s.value.slice(start)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.1 rounded-md">
                        Used {s.freq}×
                      </span>
                      {s.translation && (
                        <span className="text-[9.5px] font-semibold text-blue-600/80 dark:text-blue-300/80 font-[vazirmatn]" dir="rtl">
                          {s.translation}
                        </span>
                      )}
                      {s.matched === "fuzzy" && (
                        <span className="text-[9.5px] font-bold text-amber-500">did you mean?</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSel ? "text-blue-500" : "text-slate-300"}`} />
                </button>
                {isSel && hasProfile && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      commitSuggestion(s)
                    }}
                    className="w-full mx-1 mb-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    style={{ width: "calc(100% - 0.5rem)" }}
                  >
                    <UserRoundCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10.5px] font-black">Auto-Fill Full Profile &amp; Tax IDs</span>
                    <span className="text-[10px] font-bold font-[vazirmatn]" dir="rtl">
                      / تکمیل خودکار مشخصات کامل
                    </span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 text-[9.5px] font-bold text-slate-400">
          <kbd className="px-1 rounded border border-slate-200 dark:border-slate-700">↑↓</kbd> navigate
          <kbd className="px-1 rounded border border-slate-200 dark:border-slate-700">Tab</kbd> accept
          <kbd className="px-1 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> select
          <kbd className="px-1 rounded border border-slate-200 dark:border-slate-700">Esc</kbd> dismiss
        </div>
      </div>,
      document.body,
    )
  })()

  // ---------------------------------------------------- grammar pill (textarea)
  const grammarPill = (() => {
    const a = active
    if (!a || !a.isTextarea || !settings.masterEnabled || settings.grammarLevel === "off" || !pillPos) return null
    const issueCount = issues.length
    const level = settings.grammarLevel
    return createPortal(
      <div className="fixed z-[70]" style={{ top: pillPos.top, left: pillPos.left, transform: "translate(-100%, -30%)" }}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setGrammarMenu((m) => !m)}
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-amber-300/70 dark:border-amber-700/60 shadow-lg text-[10.5px] font-black text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Improve Grammar & Format / اصلاح نگارش و متن رسمی"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline">Improve Grammar &amp; Format</span>
            <span className="hidden lg:inline font-[vazirmatn]" dir="rtl">
              / اصلاح نگارش
            </span>
            {issueCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-amber-400 text-amber-950 text-[9px] font-black leading-none">
                {issueCount}
              </span>
            )}
          </button>
        </div>

        {showIssues && issueCount > 0 && (
          <div className="mt-1 w-72 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 space-y-1">
            {issues.slice(0, 5).map((it, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const a2 = activeRef.current
                  if (!a2) return
                  const v = a2.el.value
                  setNativeValue(a2.el, v.slice(0, it.start) + it.after + v.slice(it.end))
                  scheduleRefresh()
                }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200">
                  <span className="line-through text-rose-500">{it.before}</span>
                  <span className="mx-1">→</span>
                  <span className="text-emerald-600 font-black">{it.after}</span>
                </div>
                <div className="text-[9.5px] text-slate-400">{it.message}</div>
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const a2 = activeRef.current
                if (!a2) return
                setNativeValue(a2.el, autoFixText(a2.el.value))
                scheduleRefresh()
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-600 text-white text-[10.5px] font-black hover:bg-emerald-500 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Fix all issues
            </button>
          </div>
        )}

        {grammarMenu && (
          <div className="mt-1 w-64 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 space-y-0.5">
            {[
              {
                icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />,
                label: "Fix Spelling & Grammar",
                fa: "اصلاح املا و گرامر",
                run: () => autoFixText(activeRef.current!.el.value),
              },
              {
                icon: <Wand2 className="w-3.5 h-3.5 text-indigo-600" />,
                label: "Convert to Formal BOL Clause",
                fa: "تبدیل به متن رسمی بارنامه",
                run: () => toFormalClause(activeRef.current!.el.value),
              },
              {
                icon: <Languages className="w-3.5 h-3.5 text-blue-600" />,
                label: "Bilingual Sync (EN ⇄ دری)",
                fa: "ترجمه دو زبانه",
                run: () => bilingualSync(activeRef.current!.el.value).result,
              },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const a2 = activeRef.current
                  if (!a2) return
                  const next = m.run()
                  if (next !== a2.el.value) setNativeValue(a2.el, next)
                  setGrammarMenu(false)
                  scheduleRefresh()
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left cursor-pointer transition-colors"
              >
                {m.icon}
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{m.label}</div>
                  <div className="text-[9.5px] text-slate-400 font-[vazirmatn]" dir="rtl">
                    {m.fa}
                  </div>
                </div>
              </button>
            ))}
            {level === "highlight" && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowIssues((v) => !v)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 text-left cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  {issueCount} suggestion{issueCount === 1 ? "" : "s"} — review
                </span>
              </button>
            )}
          </div>
        )}
      </div>,
      document.body,
    )
  })()

  if (!mounted) return null
  return (
    <>
      {ghostLayer}
      {popover}
      {grammarPill}
    </>
  )
}

/** Named export per the architecture spec — the layer IS the global hook. */
export function useGlobalSmartInputs() {
  return <GlobalSmartInputLayer />
}
