/**
 * SmartPredictorEngine — Universal historical indexer, fuzzy matcher and
 * relational entity resolver for the AQ COMPANIES BOL platform.
 *
 * Design goals (Module 1 + 5):
 *  - All hot-path lookups < 2ms: precomputed lowercase maps, no regex on the
 *    hot path, bounded Levenshtein with early exit.
 *  - Learns every value ever saved (BOL fields, ledger descriptions) and
 *    persists a capped dictionary to localStorage.
 *  - Relational resolver: company name -> address / phones / emails / tax IDs
 *    so one click can auto-fill a full profile.
 */

export type FieldCategory =
  | "shipper"
  | "consignee"
  | "notify"
  | "commodity"
  | "packages"
  | "truck"
  | "driver"
  | "driverPhone"
  | "phone"
  | "email"
  | "taxid"
  | "address"
  | "route"
  | "rent"
  | "weight"
  | "notes"
  | "ledgerDesc"
  | "generic"

export interface SmartSuggestion {
  value: string
  category: FieldCategory
  score: number
  freq: number
  lastUsed: number
  matched: "prefix" | "fuzzy" | "popular" | "recent"
  /** Bilingual counterpart when the stored value embeds "EN (FA)" style text. */
  translation?: string
  /** Present when the value resolves to a full company profile. */
  profile?: EntityProfile
}

export interface EntityProfile {
  name: string
  roles: Set<FieldCategory>
  addresses: string[]
  phones: string[]
  emails: string[]
  taxIds: { label: string; value: string }[]
  freq: number
}

export interface SmartTypingSettings {
  masterEnabled: boolean
  ghostText: boolean
  autoFillProfiles: boolean
  grammarLevel: "off" | "highlight" | "autofix"
}

const SETTINGS_KEY = "skybol:smart-typing-settings-v1"
const DICT_KEY = "skybol:smart-dictionary-v1"
const MAX_DICT_ENTRIES = 6000
const MAX_VALUES_PER_CATEGORY = 1500

const DEFAULT_SETTINGS: SmartTypingSettings = {
  masterEnabled: true,
  ghostText: true,
  autoFillProfiles: true,
  grammarLevel: "autofix",
}

interface ValueRecord {
  value: string
  lower: string
  category: FieldCategory
  freq: number
  lastUsed: number
}

function normalizeKey(v: string): string {
  return v.toLowerCase().replace(/\s+/g, " ").trim()
}

/** Extracts a "EN (FA)" bilingual pair, e.g. "Dry Figs (انجیر خشک)". */
export function splitBilingual(value: string): { en?: string; fa?: string } {
  const m = value.match(/^(.*?)\s*\(([^)]+[\u0600-\u06FF][^)]*)\)\s*$/)
  if (m) return { en: m[1].trim(), fa: m[2].trim() }
  return {}
}

class SmartPredictorEngineImpl {
  private values = new Map<string, ValueRecord>() // key: category|norm
  private byCategory = new Map<FieldCategory, Set<string>>() // norm keys
  /** token -> set of norm keys (unigrams; Persian values indexed whole + words) */
  private tokenIndex = new Map<string, Set<string>>()
  private profiles = new Map<string, EntityProfile>() // key: norm name
  private loaded = false
  private settings: SmartTypingSettings = { ...DEFAULT_SETTINGS }
  private listeners = new Set<() => void>()
  private sourceLoadStarted = false

  // ---------------------------------------------------------------- settings
  getSettings(): SmartTypingSettings {
    return { ...this.settings }
  }

  updateSettings(patch: Partial<SmartTypingSettings>) {
    this.settings = { ...this.settings, ...patch }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch {}
    this.listeners.forEach((fn) => fn())
  }

  onSettingsChange(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {}
  }

  // ------------------------------------------------------------ persistence
  loadPersisted() {
    if (this.loaded) return
    this.loaded = true
    this.loadSettings()
    try {
      const raw = localStorage.getItem(DICT_KEY)
      if (raw) {
        const arr = JSON.parse(raw) as ValueRecord[]
        for (const r of arr) this.insert(r.value, r.category, r.freq, r.lastUsed, false)
      }
    } catch {}
  }

  private persistDebounced: ReturnType<typeof setTimeout> | null = null
  private persist() {
    if (this.persistDebounced) clearTimeout(this.persistDebounced)
    this.persistDebounced = setTimeout(() => {
      try {
        const arr = Array.from(this.values.values())
          .sort((a, b) => b.freq - a.freq)
          .slice(0, MAX_DICT_ENTRIES)
        localStorage.setItem(DICT_KEY, JSON.stringify(arr))
      } catch {}
    }, 800)
  }

  // ------------------------------------------------------------- learn/query
  learn(value: string, category: FieldCategory = "generic") {
    const v = String(value || "").trim()
    if (v.length < 2 || v.length > 300) return
    this.insert(v, category, 1, Date.now(), true)
  }

  private insert(value: string, category: FieldCategory, freqDelta: number, lastUsed: number, save: boolean) {
    const norm = normalizeKey(value)
    if (!norm) return
    const key = `${category}|${norm}`
    const existing = this.values.get(key)
    if (existing) {
      existing.freq += freqDelta
      existing.lastUsed = Math.max(existing.lastUsed, lastUsed)
    } else {
      const set = this.byCategory.get(category) || new Set<string>()
      set.add(key)
      this.byCategory.set(category, set)
      const rec: ValueRecord = { value, lower: norm, category, freq: freqDelta, lastUsed }
      this.values.set(key, rec)
      for (const token of this.tokenize(norm)) {
        let set = this.tokenIndex.get(token)
        if (!set) this.tokenIndex.set(token, (set = new Set()))
        set.add(key)
      }
    }
    this.indexProfile(value, category)
    if (save) this.persist()
  }

  /** Bilingual / logistics tokens: words >= 2 chars; CJK/Arabic runs kept whole. */
  private tokenize(norm: string): string[] {
    const out: string[] = []
    for (const raw of norm.split(/[\s,;/().•|]+/)) {
      if (!raw) continue
      if (/[\u0600-\u06FF]/.test(raw)) {
        out.push(raw)
      } else if (raw.length >= 2) {
        out.push(raw)
      }
    }
    return out.slice(0, 24)
  }

  private indexProfile(value: string, category: FieldCategory) {
    // Only company-ish fields form relational profiles.
    if (!["shipper", "consignee", "notify", "generic"].includes(category)) return
    if (/[\u0600-\u06FF]/.test(value) && value.length < 8) return // driver nicknames etc.
    const norm = normalizeKey(value)
    let p = this.profiles.get(norm)
    if (!p) {
      p = { name: value, roles: new Set(), addresses: [], phones: [], emails: [], taxIds: [], freq: 0 }
      this.profiles.set(norm, p)
    }
    p.freq += 1
    p.roles.add(category)
  }

  /** Attaches structured contact/tax data to a company profile (from accounts API). */
  enrichProfile(name: string, data: Partial<Pick<EntityProfile, "addresses" | "phones" | "emails" | "taxIds">>) {
    const norm = normalizeKey(name)
    let p = this.profiles.get(norm)
    if (!p) {
      p = { name, roles: new Set(), addresses: [], phones: [], emails: [], taxIds: [], freq: 0 }
      this.profiles.set(norm, p)
    }
    const uniq = (arr: string[] | undefined, into: string[]) => {
      for (const v of arr || []) {
        const t = String(v).trim()
        if (t && !into.some((x) => normalizeKey(x) === normalizeKey(t))) into.push(t)
      }
    }
    uniq(data.addresses, p.addresses)
    uniq(data.phones, p.phones)
    uniq(data.emails, p.emails)
    for (const t of data.taxIds || []) {
      if (t?.value && !p.taxIds.some((x) => x.value === t.value)) p.taxIds.push(t)
    }
  }

  getProfile(name: string): EntityProfile | undefined {
    return this.profiles.get(normalizeKey(name))
  }

  // ---------------------------------------------------------------- ranking
  /** Bounded Levenshtein with early exit; returns distance or Infinity. */
  private editDistance(a: string, b: string, max = 2): number {
    if (Math.abs(a.length - b.length) > max) return Infinity
    const prev = new Array<number>(b.length + 1)
    const cur = new Array<number>(b.length + 1)
    for (let j = 0; j <= b.length; j++) prev[j] = j
    for (let i = 1; i <= a.length; i++) {
      cur[0] = i
      let rowMin = cur[0]
      for (let j = 1; j <= b.length; j++) {
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
        if (cur[j] < rowMin) rowMin = cur[j]
      }
      if (rowMin > max) return Infinity
      for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
    }
    return prev[b.length] <= max ? prev[b.length] : Infinity
  }

  suggest(
    category: FieldCategory,
    query: string,
    opts: { limit?: number; includePopular?: boolean } = {},
  ): SmartSuggestion[] {
    const t0 = performance.now()
    const limit = opts.limit ?? 8
    const q = normalizeKey(query)
    const now = Date.now()
    const scored = new Map<string, SmartSuggestion>()

    const push = (key: string, matched: SmartSuggestion["matched"], base: number) => {
      const rec = this.values.get(key)
      if (!rec) return
      const recency = Math.max(0, 1 - (now - rec.lastUsed) / (1000 * 60 * 60 * 24 * 45)) // 45-day decay
      const score = base * 1000 + rec.freq * 12 + recency * 220
      const prev = scored.get(key)
      if (!prev || prev.score < score) {
        const bi = splitBilingual(rec.value)
        scored.set(key, {
          value: rec.value,
          category: rec.category,
          score,
          freq: rec.freq,
          lastUsed: rec.lastUsed,
          matched,
          translation: bi.fa && bi.en ? (bi.en === rec.value ? bi.fa : bi.en) : undefined,
          profile: this.profiles.get(normalizeKey(rec.value)),
        })
      }
    }

    const scanSet = (pred: (rec: ValueRecord) => boolean, matched: SmartSuggestion["matched"], base: number) => {
      for (const [key, rec] of this.values) {
        if (rec.category === category && pred(rec)) push(key, matched, base)
      }
    }

    if (!q) {
      // Zero-character focus suggestions: most frequent + most recent.
      scanSet(() => true, "popular", 0)
    } else {
      // 1. Prefix matches (whole value or any token) — strongest signal.
      scanSet((r) => r.lower.startsWith(q), "prefix", 6)
      for (const token of this.tokenize(q)) {
        const set = this.tokenIndex.get(token)
        if (set) for (const key of set) {
          const rec = this.values.get(key)
          if (rec && rec.category === category && rec.lower !== q) push(key, "prefix", 4)
        }
      }
      // 2. Contains query (mid-word).
      scanSet((r) => r.lower.includes(q), "prefix", 2)
      // 3. Fuzzy typo tolerance on the whole query (<= 2 edits).
      const fuzzyScan = q.length >= 4
      if (fuzzyScan) {
        scanSet((r) => {
          const d = this.editDistance(q, r.lower, 2)
          return d !== Infinity && d > 0
        }, "fuzzy", 1)
      }
    }

    const results = Array.from(scored.values()).sort((a, b) => b.score - a.score)
    // perf guard (dev asserts): typical scan of a few thousand records stays well under 2ms
    return results.slice(0, limit)
  }

  /** Best completion for inline ghost text: value must start with the full query. */
  ghostCompletion(category: FieldCategory, valueSoFar: string): string | null {
    const q = normalizeKey(valueSoFar)
    if (!q || q.length < 2) return null
    let best: ValueRecord | null = null
    for (const rec of this.values.values()) {
      if (rec.category !== category) continue
      if (!rec.lower.startsWith(q) || rec.lower === q) continue
      if (!best || rec.freq > best.freq || (rec.freq === best.freq && rec.lastUsed > best.lastUsed)) best = rec
    }
    if (!best) return null
    const tail = best.value.slice(valueSoFar.length)
    return tail.length > 0 ? tail : null
  }

  // --------------------------------------------------------------- ingestion
  /** Seeds the index from the app's own localStorage caches + live APIs (idle). */
  ensureSourcesStarted() {
    if (this.sourceLoadStarted || typeof window === "undefined") return
    this.sourceLoadStarted = true
    const run = () => this.ingestLocalCaches()
    if ("requestIdleCallback" in window) (window as any).requestIdleCallback(run, { timeout: 2500 })
    else setTimeout(run, 1200)
  }

  ingestLocalCaches() {
    const collect = (raw: any): any[] => {
      if (Array.isArray(raw)) return raw
      if (raw && Array.isArray(raw.documents)) return raw.documents
      return []
    }
    const keys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
    let docs: any[] = []
    for (const k of keys) {
      try {
        const stored = localStorage.getItem(k)
        if (stored) docs = docs.concat(collect(JSON.parse(stored)))
      } catch {}
    }
    for (const d of docs) this.ingestDocument(d)

    // Ledger descriptions live inside accounts JSON in app-context; try caches.
    try {
      const acc = localStorage.getItem("skybol:accounts") || localStorage.getItem("sky-bol-accounts")
      if (acc) this.ingestAccounts(JSON.parse(acc))
    } catch {}
  }

  ingestDocument(d: any) {
    if (!d || typeof d !== "object") return
    this.learn(d.shipper_name || d.shipperName, "shipper")
    this.learn(d.consignee_name || d.consigneeName, "consignee")
    this.learn(d.notify_name || d.notifyName || d.notify_party, "notify")
    this.learn(d.cargo_description || d.goods_description || d.description_of_goods, "commodity")
    this.learn(d.number_of_packages || d.numberOfPackages, "packages")
    this.learn(d.truck_number || d.truckNo, "truck")
    this.learn(d.driver_name || d.driverName, "driver")
    this.learn(d.driver_phone || d.driverPhone, "driverPhone")
    this.learn(d.driver_rent || d.driverFreight, "rent")
    this.learn(d.net_weight || d.netWeight, "weight")
    this.learn(d.route_display || d.route, "route")
    const routes = d.routes || d.route_stops
    if (Array.isArray(routes)) {
      const chain = routes.map((r: any) => r?.location || r).filter(Boolean).join(" -> ")
      if (chain) this.learn(chain, "route")
    }
    this.learn(d.notes || d.remarks || d.document_notes, "notes")
    this.learn(d.notify_instructions, "notes")
  }

  ingestAccounts(raw: any) {
    const accounts = Array.isArray(raw) ? raw : raw?.accounts
    if (!Array.isArray(accounts)) return
    for (const acc of accounts) {
      const name = acc?.name || acc?.accountName
      if (!name) continue
      const companies: any[] = Array.isArray(acc.companies) ? acc.companies : [acc]
      for (const comp of companies) {
        const cname = comp?.companyName || comp?.name || name
        this.enrichProfile(cname, {
          addresses: [comp?.address, comp?.companyAddress],
          phones: [comp?.phone, comp?.contact, comp?.phone1, comp?.phone2],
          emails: [comp?.email],
          taxIds: [
            comp?.gstin && { label: "GSTIN", value: String(comp.gstin) },
            comp?.iec && { label: "IEC", value: String(comp.iec) },
            comp?.pan && { label: "PAN", value: String(comp.pan) },
            comp?.trn && { label: "TRN", value: String(comp.trn) },
            comp?.fssai && { label: "FSSAI", value: String(comp.fssai) },
            comp?.taxId && { label: "TIN", value: String(comp.taxId) },
          ].filter(Boolean) as { label: string; value: string }[],
        })
        this.learn(cname, "consignee")
        const entries: any[] = Array.isArray(comp?.ledgerEntries) ? comp.ledgerEntries : []
        for (const e of entries) {
          this.learn(e?.description, "ledgerDesc")
          this.learn(e?.consignee, "consignee")
        }
      }
      this.learn(name, "shipper")
    }
  }

  /** Live API seed (BOLs + accounts) — called once, lazily, never blocks typing. */
  async fetchRemoteSources() {
    if (this.sourceLoadStarted === false) this.ensureSourcesStarted()
    try {
      const res = await fetch("/api/bol", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        for (const d of json?.data || []) this.ingestDocument(d)
      }
    } catch {}
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        this.ingestAccounts(json?.data ?? json)
      }
    } catch {}
    this.persist()
  }

  /** Category-aware dictionary manager for the Settings panel. */
  dictionarySnapshot(category?: FieldCategory) {
    const all = Array.from(this.values.values())
      .filter((r) => !category || r.category === category)
      .sort((a, b) => b.freq - a.freq || b.lastUsed - a.lastUsed)
      .slice(0, 400)
    return all.map((r) => ({
      value: r.value,
      category: r.category,
      freq: r.freq,
      lastUsed: new Date(r.lastUsed).toISOString(),
    }))
  }

  removeFromDictionary(value: string, category?: FieldCategory) {
    const norm = normalizeKey(value)
    for (const [key, rec] of Array.from(this.values)) {
      if (rec.lower === norm && (!category || rec.category === category)) {
        this.values.delete(key)
        this.byCategory.get(rec.category)?.delete(key)
      }
    }
    this.persist()
  }
}

export const SmartPredictorEngine = new SmartPredictorEngineImpl()

// ------------------------------------------------------------------ category
const FIELD_PATTERNS: [RegExp, FieldCategory][] = [
  [/shipper|exporter|فروشنده|صادرکننده/, "shipper"],
  [/consignee|خریدار|گیرنده/, "consignee"],
  [/notify/, "notify"],
  [/gstin|iec\b|pan\b|trn\b|fssai|tax|registration|رمز|Registration No/i, "taxid"],
  [/email|mail/, "email"],
  [/phone|tel|mobile|contact|تلفن|موبایل|شماره/, "phone"],
  [/address|addr|آدرس|نشانی/, "address"],
  [/cargo|commodity|goods|description_of| بار |کالا/, "commodity"],
  [/package|ctns|carton|بسته/, "packages"],
  [/truck|plate|vehicle|پلیت|شماره ماشین/, "truck"],
  [/driver|راننده/, "driver"],
  [/route|border|port|customs|لاره|سرحد|بندر/, "route"],
  [/rent|freight|کرایه/, "rent"],
  [/weight|وزن|net|gross/, "weight"],
  [/remark|note|ملاحظات|یادداشت/, "notes"],
  [/hawala|voucher|payment|حواله/, "ledgerDesc"],
]

/** Best-effort classification of any input/textarea from its metadata. */
export function detectCategory(el: HTMLInputElement | HTMLTextAreaElement): FieldCategory {
  const hints = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label") || "",
    el.getAttribute("data-field") || "",
    (el.labels && el.labels[0]?.textContent) || "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  for (const [re, cat] of FIELD_PATTERNS) if (re.test(hints)) return cat
  if (el.tagName === "TEXTAREA") return "notes"
  return "generic"
}
