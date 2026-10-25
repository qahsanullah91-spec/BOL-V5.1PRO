/**
 * GrammarAndPolishEngine — real-time English + Dari/Pashto logistics
 * proofreader, script normalizer and formal BOL clause formatter.
 *
 * Pure rule-based (zero network, zero dependencies) so every check runs in
 * well under 2ms even for long textareas.
 */

export type GrammarLevel = "off" | "highlight" | "autofix"

export interface GrammarIssue {
  start: number
  end: number
  before: string
  after: string
  rule: string
  message: string
  messageFa: string
}

// ----------------------------------------------------------------- Persian
const AR_FA_CHAR_MAP: [RegExp, string][] = [
  [/ي/g, "ی"], // Arabic yeh -> Farsi yeh
  [/ك/g, "ک"], // Arabic kaf -> Farsi keheh
  [/ى/g, "ی"], // Alef maksura
  [/ة/g, "ه"], // Teh marbuta
  [/ؤ\u200c?/g, "و"], // rarely intended in these logistics words
]

/** Common Dari/Pashto logistics compounds that need ZWNJ or fixing. */
const FA_WORD_FIXES: [RegExp, string][] = [
  [/\bنماینده\s+گی\b/g, "نماینده‌گی"],
  [/\bنماینده\s*گی\b/g, "نماینده‌گی"],
  [/\bهمگام\s+سازی\b/g, "همگام‌سازی"],
  [/\bبار\s+گیری\b/g, "بارگیری"],
  [/\bمسؤل\s+بارگیری\b/g, "مسؤل بارگیری"],
  [/\bکرایه\s+واپسی\b/g, "کرایه واپسی"], // keep spaced (correct as-is, docs canonical)
  [/\bانتقال\s+ادات\b/g, "انتقالات"],
  [/\s+واپسی\b/g, " واپسی"],
  [/\bمیسري\b/g, "ميسري"],
]

export function normalizePersianScript(text: string): string {
  let out = text
  for (const [re, rep] of AR_FA_CHAR_MAP) out = out.replace(re, rep)
  for (const [re, rep] of FA_WORD_FIXES) out = out.replace(re, rep)
  // Collapse runs of spaces inside Arabic text lines (not leading indentation)
  out = out.replace(/([\u0600-\u06FF]) {2,}([\u0600-\u06FF])/g, "$1 $2")
  return out
}

export function isPersianText(text: string): boolean {
  const fa = (text.match(/[\u0600-\u06FF]/g) || []).length
  const en = (text.match(/[A-Za-z]/g) || []).length
  return fa > en
}

// ------------------------------------------------------- English commercial
interface Rule {
  re: RegExp
  replace: string | ((m: string, ...g: string[]) => string)
  rule: string
  message: string
  messageFa: string
}

const EN_RULES: Rule[] = [
  {
    re: /\bNOTIFY\s+PARTI\b(?!\w)/gi,
    replace: "NOTIFY PARTY",
    rule: "bol-notify-party",
    message: 'Standard BOL term is "NOTIFY PARTY".',
    messageFa: "اصطلاح رسمی بارنامه «NOTIFY PARTY» است.",
  },
  {
    re: /\bPACKING\s+LIST\s+ATTACH\b(?!\w)/gi,
    replace: "PACKING LIST ATTACHED",
    rule: "bol-packing-attached",
    message: 'Should read "PACKING LIST ATTACHED".',
    messageFa: "باید «PACKING LIST ATTACHED» نوشته شود.",
  },
  {
    re: /\bCLEAN\s+ON\s*BORD\b/gi,
    replace: "CLEAN ON BOARD",
    rule: "bol-clean-on-board",
    message: 'Standard clause is "CLEAN ON BOARD".',
    messageFa: "عبارت رسمی «CLEAN ON BOARD» است.",
  },
  {
    re: /\bFREIGHT\s+PRE\s*PAID\b/gi,
    replace: "FREIGHT PREPAID",
    rule: "bol-freight-prepaid",
    message: 'Standard term is "FREIGHT PREPAID".',
    messageFa: "اصطلاح رسمی «FREIGHT PREPAID» است.",
  },
  {
    re: /\bFREIGHT\s+COLLECT\b(?!\w)/gi,
    replace: "FREIGHT COLLECT",
    rule: "bol-term-casing",
    message: "Commercial terms are written in uppercase on BOLs.",
    messageFa: "اصطلاحات تجاری در بارنامه با حروف بزرگ نوشته می‌شوند.",
  },
  {
    re: /\bPAYMENT\s+HAS\s+TO\s+BE\s+MADE\b/gi,
    replace: "Payment has to be made",
    rule: "sentence-case",
    message: "Use sentence casing for instruction sentences.",
    messageFa: "برای جملات دستوری از حروف بزرگ در ابتدای جمله استفاده شود.",
  },
  {
    re: /\bCONSIGNEE\b/gi,
    replace: "CONSIGNEE",
    rule: "bol-term-casing",
    message: "Party roles are written uppercase on BOLs.",
    messageFa: "نقش طرفین در بارنامه با حروف بزرگ است.",
  },
  {
    re: /\bSHIPP?ER\b/gi,
    replace: "SHIPPER",
    rule: "typo-shipper",
    message: 'Correct spelling is "SHIPPER".',
    messageFa: "املای صحیح «SHIPPER» است.",
  },
  {
    re: /\bRECIVED\b|\bRECIEVED\b/gi,
    replace: "RECEIVED",
    rule: "typo-received",
    message: 'Correct spelling is "RECEIVED".',
    messageFa: "املای صحیح «RECEIVED» است.",
  },
  {
    re: /\bTHROUGH\s+TO\s+THE\b/gi,
    replace: "TO THE",
    rule: "grammar-through",
    message: '"through to the" is redundant — use "to the".',
    messageFa: "«through to the» تکراری است؛ «to the» کافی است.",
  },
]

const PHONES = /(\+?93[\s-]?|0)?7[0-9][\s-]?\d{3}[\s-]?\d{3,4}\b/g
const AMOUNTS = /\b(\d+(?:\.\d+)?)\s?(KG|AFN|USD|AED|CTNS?|BAGS?)\b/gi

/** Canonical formatting: uppercase commercial terms, clean spacing. */
export function normalizeCommercialFormatting(text: string): string {
  let out = text
  out = out.replace(/[ \t]{2,}/g, " ")
  out = out.replace(/\s+([,.;:])/g, "$1")
  out = out.replace(/([,;:])(?=\S)/g, "$1 ")
  for (const r of EN_RULES) {
    out = out.replace(r.re, r.replace as string)
  }
  // Canonical amount formatting: "23210 KG" -> "23,210 KG", "45000 AFN" -> "45,000 AFN"
  out = out.replace(AMOUNTS, (m, num: string, unit: string) => {
    const n = parseFloat(num)
    if (isNaN(n)) return m
    const formatted = n.toLocaleString("en-US", { maximumFractionDigits: 2 })
    const u = unit.toUpperCase()
    return `${formatted} ${u === "CTN" ? "CTNS" : u}`
  })
  return out.replace(/[ \t]{2,}/g, " ").trimEnd()
}

/** Normalizes Afghan mobile numbers to "(+93) 0 700 203 307" style. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "")
  let d = digits.startsWith("+93") ? "0" + digits.slice(3) : digits
  if (d.startsWith("93") && d.length >= 11) d = "0" + d.slice(2)
  const m = d.match(/^(0)?(7\d{2})(\d{3})(\d{3,4})$/)
  if (!m) return raw
  return `(+93) ${m[1] || "0"} ${m[2]} ${m[3]} ${m[4]}`
}

// ------------------------------------------------------------------- checks
export function checkText(text: string, level: GrammarLevel): GrammarIssue[] {
  if (level === "off" || !text.trim()) return []
  const issues: GrammarIssue[] = []
  for (const r of EN_RULES) {
    for (const m of text.matchAll(r.re)) {
      const idx = m.index ?? 0
      issues.push({
        start: idx,
        end: idx + m[0].length,
        before: m[0],
        after: typeof r.replace === "string" ? r.replace : m[0],
        rule: r.rule,
        message: r.message,
        messageFa: r.messageFa,
      })
    }
  }
  // Persian script variants
  for (const m of text.matchAll(/[يكى]/g)) {
    const idx = m.index ?? 0
    issues.push({
      start: idx,
      end: idx + 1,
      before: m[0],
      after: normalizePersianScript(m[0]),
      rule: "fa-script",
      message: "Use Farsi ی / ک instead of Arabic ي / ك.",
      messageFa: "به جای «ي/ك» عربی از «ی/ک» فارسی استفاده شود.",
    })
  }
  return issues
}

/** Applies all safe fixes (used by "Fix Spelling & Grammar"). */
export function autoFixText(text: string): string {
  let out = normalizeCommercialFormatting(text)
  out = normalizePersianScript(out)
  return out
}

// ------------------------------------------------- formal BOL clause builder
const FA_EN_PHRASES: [RegExp, string][] = [
  [/نماینده\s*(گمرک|مرزی|گمرکی)[^\n]*/g, "Customs & Border Clearing Agent"],
  [/نماینده\s*نیمرونه[^。\n]*/g, "Clearing agent at Nimroz / Milak border"],
  [/کرایه\s*واپسی/g, "Freight payable at destination"],
  [/د\s*کندهار\s*بارگیری\s*مسؤل/g, "Loading supervisor at Kandahar"],
  [/نقداً?\s*وصول\s*شد/g, "Cash received in full"],
  [/حواله\s*شد/g, "Transferred via Hawala"],
  [/باقی\s*ماند/g, "Balance remaining"],
  [/شرکت\s*حمل\s*و\s*نقل\s*بین\s*المللی/g, "International Transport Company"],
]

const EN_FA_PHRASES: [RegExp, string][] = [
  [/customs\s*(and|&)\s*border\s*clearing\s*agent/gi, "نماینده گمرک و مرزی"],
  [/freight\s+payable\s+at\s+destination/gi, "کرایه واپسی"],
  [/clean\s+on\s+board/gi, "بارگیری سالم — CLEAN ON BOARD"],
  [/balance\s+remaining/gi, "باقی مانده"],
  [/cash\s+received(\s+in\s+full)?/gi, "نقداً وصول شد"],
  [/transferred\s+via\s+hawala/gi, "حواله شد"],
]

/**
 * Mode 3 — bilingual sync. Detects the dominant script and returns the
 * professional counterpart text (phrase-level translation of logistics terms).
 */
export function bilingualSync(text: string): { result: string; direction: "fa-to-en" | "en-to-fa" } {
  const faToEn = isPersianText(text)
  let out = text
  if (faToEn) {
    for (const [re, rep] of FA_EN_PHRASES) out = out.replace(re, rep)
    out = normalizePersianScript(out)
    return { result: out.trim(), direction: "fa-to-en" }
  }
  for (const [re, rep] of EN_FA_PHRASES) out = out.replace(re, rep)
  return { result: out.trim(), direction: "en-to-fa" }
}

/** Mode 2 — converts a rough note into a formal commercial BOL clause. */
export function toFormalClause(text: string): string {
  let out = autoFixText(text)
  const fa = isPersianText(out)
  const sentences = out
    .split(/(?<=[.!؟?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (!fa) {
        s = s.charAt(0).toUpperCase() + s.slice(1)
        if (!/[.:]$/.test(s)) s += "."
      }
      return s
    })
  const body = sentences.join(" ")
  if (fa) return body
  const clausePrefix = "COMMERCIAL CLAUSE"
  if (/freight|payment|كرایه|کرایه/i.test(body) && !/^FREIGHT CLAUSE/i.test(body)) {
    return `${clausePrefix} — FREIGHT & PAYMENT:\n${body}`
  }
  if (/agent|customs|border|گمرک|مرزی/i.test(body)) {
    return `${clausePrefix} — CUSTOMS & CLEARING:\n${body}`
  }
  return `${clausePrefix}:\n${body}`
}
