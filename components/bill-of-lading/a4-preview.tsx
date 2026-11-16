"use client"

import { useState, useEffect, useLayoutEffect, useRef, useMemo, memo, Fragment } from "react"
import type { CSSProperties, ReactNode, ComponentType } from "react"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  FileText,
  Globe,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  RotateCcw,
  Route,
  ShieldCheck,
  Ship,
  Truck,
  UserRound,
  PenTool,
  Repeat,
  Snowflake,
  Compass,
  Receipt,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { BillOfLadingHeader } from "./header"
import { DocumentQRCode } from "./document-qr-code"
import { Barcode128 } from "./barcode"
export { DocumentQRCode, Barcode128 }
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { generateQrMatrix } from "@/lib/utils/qr-code"
import { parseLogisticsRoute, cleanRouteText } from "@/lib/utils/transit-route-parser"
import {
  RouteAirIcon,
  RouteCarIcon,
  RouteTrainIcon,
  RouteTruckIcon,
  RouteVesselIcon,
} from "../icons/RouteTransportIcons"
import {
  COMPANY_STAMP_SIGNATURE_SRC,
  DEFAULT_STAMP_CONFIG,
  getStoredCompanyStampConfig,
  saveStoredCompanyStampConfig,
  type CompanyStampConfig,
} from "@/lib/company-stamp-data"
import { COMPANY_STAMP_SIGNATURE_DATA_URL } from "@/lib/company-stamp-fallback"
import { AfghanTruckPlate } from "@/components/ui/afghan-truck-plate"
import { isPashtoOrArabic } from "@/lib/utils/pashto-bidi"
import {
  type SyncedCargoItem,
  type CargoTotals,
  type CargoDensityTier,
  splitMultiCargoItems,
  parseCargoTotal,
  parseSyncedCargoItems,
  getCargoDensity,
  shouldSplitToPage2,
  splitCargoForPages,
} from "@/lib/utils/cargo-grid"

interface A4PreviewProps {
  bolNumber: string
  issueDate: string
  persianDate: string
  persianDateNumeric: string
  formData: BillOfLadingFormData
  logoUrl?: string
  brandLockupUrl?: string
  logoDesignId?: string
  companyName?: string
  companyNamePersian?: string
  companySubtitle?: string
  companyPhone?: string
  companyEmail?: string
  companyAddress?: string
  companyLicence?: string
  exportTarget?: boolean
  pdfExport?: boolean
  includeColorStrip?: boolean
  backgroundImageUrl?: string
  backgroundOpacity?: number
  showStampSignature?: boolean
  onToggleStampSignature?: (show: boolean) => void
}

type DetailItem = {
  label: string
  value?: string | null
  important?: boolean
  rtl?: boolean
  highlight?: boolean
  highlightColor?: string
}

export const sampleBillOfLadingData: Partial<BillOfLadingFormData> = {
  bol_number: "BOL-2026-NSA001",
  notes_1_label: "Loading Contact",
  notes_1: "Nazar Mohammad (Yarmal)\n(+93) 0 700 203 307",
  notes_2_label: "Representative",
  notes_2: "Abdul Wahab Regwal / Najibullah Hussain Mahmoodi Muqadam\n0796140001  0703130001\nDougharoun Representative: 09152091993",
  shipper_name: "PAHLAWAN NOORI LTD",
  shipper_address: "Shorandam Industrial Park, Kandahar, Afghanistan",
  consignee_name: "S V INTERNATIONAL",
  consignee_address: "Delhi, India",
  routes: [
    { id: "sample-route-1", location: "Kandahar", locationPersian: "کندهار", stopOrder: 1, stopLabel: "Origin", transportMode: "truck" },
    { id: "sample-route-2", location: "Nimroz", locationPersian: "نیمروز", stopOrder: 2, stopLabel: "Stop 1", transportMode: "truck" },
    { id: "sample-route-3", location: "Bandar Abbas, IR", locationPersian: "بندرعباس، ایران", stopOrder: 3, stopLabel: "Stop 2", transportMode: "vessel" },
    { id: "sample-route-4", location: "Dubai, AE", locationPersian: "دبی، امارات", stopOrder: 4, stopLabel: "Stop 3", transportMode: "vessel" },
    { id: "sample-route-5", location: "Nhava Sheva, IN", locationPersian: "نهاوا شوا، هند", stopOrder: 5, stopLabel: "Destination", transportMode: "vessel" },
  ],
  cargo_description: `📦 CONTAINER & CARGO DETAILS │ 🧾 DOCUMENT & SHIPPING DETAILS
🥬 Cargo: | 📅 Transit Date: | 📄 HS CODE:  │ 📄 Afghan TC No:  │ 📄 Invoice NO: `,
  net_weight: "49,320 KGS",
  gross_weight: "55,685 KGS",
  number_of_packages: "1407 CNTS",
}

const a4ShellStyle: CSSProperties = {
  background: "#ffffff",
  fontFamily: "'NotoNaskhArabic', 'Vazirmatn', Arial, Helvetica, Inter, Calibri, sans-serif",
  width: "210mm",
  minWidth: "210mm",
  maxWidth: "210mm",
  height: "297mm",
  minHeight: "297mm",
  maxHeight: "297mm",
  overflow: "hidden",
  boxSizing: "border-box",
  position: "relative",
}

const pdfShellStyle: CSSProperties = {
  ...a4ShellStyle,
  width: "794px",
  minWidth: "794px",
  maxWidth: "794px",
  height: "1123px",
  minHeight: "1123px",
  maxHeight: "none",
  overflow: "visible",
}

export const BOL_TYPOGRAPHY = {
  companyTitle: "text-[21pt] font-black uppercase tracking-[0.035em] text-slate-900 leading-tight",
  companySubtitle: "text-[9.2pt] font-extrabold uppercase tracking-[0.18em] text-slate-600 leading-tight",
  companyPersian: "font-[vazirmatn] text-[12.5pt] font-extrabold leading-snug text-blue-700",
  sectionTitle: "text-[7.6pt] font-black uppercase leading-none tracking-wide",
  sectionSubtitle: "font-[vazirmatn] text-[7.4pt] font-bold leading-none",
  cardLabelEn: "text-[5.6pt] font-black uppercase tracking-wider text-blue-700 leading-tight",
  cardLabelFa: "font-[vazirmatn] text-[5.8pt] font-extrabold text-blue-600 leading-tight",
  numericValue: "whitespace-nowrap keep-all font-mono font-black direction-ltr unicode-isolate inline-block",
} as const

function getNumericFontClass(val?: string | null, baseClass = "text-[9.6pt]"): string {
  const s = cleanText(val)
  if (s.length > 25) return "text-[7.4pt]"
  if (s.length > 20) return "text-[8.8pt]"
  if (s.length > 15) return "text-[9.2pt]"
  if (s.length > 12) return "text-[9.4pt]"
  return baseClass
}

const blueBarStyle = {
  background: "linear-gradient(90deg, #1e40af 0%, #2563eb 55%, #0284c7 90%, #0891b2 100%)",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} satisfies CSSProperties

const darkHeaderStyle = {
  background: "#2563eb",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} satisfies CSSProperties

const headerGridStyle = {
  display: "grid",
  gridTemplateColumns: "28mm 1fr 42mm",
  alignItems: "center",
  columnGap: "2mm",
} satisfies CSSProperties

const logoFrameStyle = {
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  overflow: "hidden",
  boxSizing: "border-box",
} satisfies CSSProperties

const logoImageStyle = {
  display: "block",
  height: "100%",
  width: "100%",
  maxHeight: "100%",
  maxWidth: "100%",
  objectFit: "contain",
  objectPosition: "center",
} satisfies CSSProperties

const labels = {
  persianCompanyFallback: "شرکت حمل و نقل بین المللی اسکای آریانا",
  billOfLadingFa: "\u0628\u0627\u0631\u0646\u0627\u0645\u0647",
  exporterContactsFa: "\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0635\u0627\u062f\u0631\u06a9\u0646\u0646\u062f\u0647",
  exporterInfoFa: "\u0641\u0631\u0633\u062a\u0646\u062f\u0647",
  consigneeInfoFa: "\u06af\u06cc\u0631\u0646\u062f\u0647",
  notifyPartyFa: "\u0637\u0631\u0641 \u0627\u0637\u0644\u0627\u0639 \u0631\u0633\u0627\u0646\u06cc",
  routeFa: "\u0645\u0633\u06cc\u0631 \u062d\u0645\u0644 \u0648 \u0646\u0642\u0644",
  shipmentInfoFa: "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u062d\u0645\u0644",
  cargoDescFa: "\u0634\u0631\u062d \u06a9\u0627\u0644\u0627",
  containerNoFa: "\u0634\u0645\u0627\u0631\u0647 \u06a9\u0627\u0646\u062a\u06cc\u0646\u0631",
  sealNoFa: "\u0634\u0645\u0627\u0631\u0647 \u067e\u0644\u0645\u0628",
  packagesFa: "\u062a\u0639\u062f\u0627\u062f \u0628\u0633\u062a\u0647",
  kgsPerCartonFa: "\u06a9\u06cc\u0644\u0648 \u0641\u06cc \u06a9\u0627\u0631\u062a\u0646",
  grossPerCartonFa: "\u0648\u0632\u0646 \u0646\u0627\u062e\u0627\u0644\u0635 \u0641\u06cc \u06a9\u0627\u0631\u062a\u0646",
  rateFa: "\u0646\u0631\u062e \u0641\u06cc \u06a9\u06cc\u0644\u0648",
  goodsValueFa: "\u0627\u0631\u0632\u0634 \u06a9\u0627\u0644\u0627",
  netWeightFa: "\u0648\u0632\u0646 \u062e\u0627\u0644\u0635",
  grossWeightFa: "\u0648\u0632\u0646 \u0646\u0627\u062e\u0627\u0644\u0635",
  measurementFa: "\u0627\u0646\u062f\u0627\u0632\u0647",
  goodsDescriptionFa: "\u0634\u0631\u062d \u06a9\u0627\u0644\u0627",
  stampFa: "\u0645\u0647\u0631",
  companyStampSignFa: "\u0645\u0647\u0631 \u0648 \u0627\u0645\u0636\u0627\u06cc \u0634\u0631\u06a9\u062a",
  authorityVerificationFa: "\u062a\u0627\u06cc\u06cc\u062f \u0631\u0633\u0645\u06cc",
  shippingDetailsFa: "جزئیات حمل و بنادر",
  portOfLoadingFa: "بندر بارگیری",
  portOfDischargeFa: "بندر تخلیه",
  placeOfDeliveryFa: "محل تحویل",
  vesselVoyageFa: "کشتی و شماره سفر",
  freightPayableFa: "محل پرداخت کرایه",
} as const

function cleanText(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return ""
  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatCartonWeight(val?: string | number | null): string {
  if (!val) return "—"
  const str = String(val).trim()
  if (!str || str === "—") return "—"
  const numMatch = str.match(/([0-9]+(?:\.[0-9]+)?)/)
  if (!numMatch) return str
  const num = parseFloat(numMatch[1])
  if (isNaN(num)) return str
  return `${num.toFixed(2)} KGS`
}

/**
 * Auto-corrects common cargo-text typos and awkward unit dashes so printed
 * descriptions read cleanly: "RAISNIS" -> "RAISINS", "16-KGS" -> "16 KGS".
 */
function normalizeCargoText(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/\braisnis\b/gi, (m) => (m === m.toUpperCase() ? "RAISINS" : m[0] === m[0].toUpperCase() ? "Raisins" : "raisins"))
    .replace(/(\d+)\s*-\s*(KGS?|KG|CTNS?|PKGS?|BAGS?|BOXES|PCS|UNITS|TONS?|LBS?)\b/gi, "$1 $2")
}

/** Normalizes inline rate fragments (e.g. "@3.50$" -> "@ 3.50 $") for consistent badge display. */
function formatCargoRate(rate?: string | null): string {
  const raw = cleanText(rate)
  if (!raw) return ""
  return raw
    .replace(/@\s*/, "@ ")
    .replace(/\s*([$€£]|AFN)\s*$/i, " $1")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function cleanCargoDescriptionText(text?: string | null): string {
  if (!text) return ""

  const normalized = normalizeCargoText(text)
  const lines = normalized.split("\n")
  const cleanedLines = lines.map((line) => {
    const parts = line.split(/[│|]/)
    const validParts = parts
      .map((part) => part.trim())
      .filter((part) => {
        if (!part) return false
        // Filter out decorative header banners
        if (
          /^(?:📦\s*)?(?:container\s*&\s*cargo\s*(?:particulars|details)|document\s*&\s*shipping\s*details|export\s*cargo\s*&\s*container\s*specifications|مشخصات\s*و\s*تفکیک\s*محموله)[\s:│|]*$/i.test(
            part
          )
        ) {
          return false
        }
        if (part.includes(":")) {
          const colonIdx = part.indexOf(":")
          const val = part.slice(colonIdx + 1).trim()
          if (!val) return false
        }
        return true
      })

    return validParts.join(" │ ")
  })

  return cleanedLines.filter(Boolean).join("\n")
}

function hasValue(value?: string | null) {
  return cleanText(value).length > 0
}

function joinOfficeLine(parts: Array<string | undefined>) {
  return parts.map(cleanText).filter(Boolean).join(" | ")
}

function containsLatin(value: string) {
  return /[A-Za-z]/.test(value)
}

function containsArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value)
}

function textDirection(value?: string | null) {
  const text = cleanText(value)
  const hasArabic = /[\u0600-\u06FF]/.test(text)
  const hasLatin = /[A-Za-z]/.test(text)
  return hasArabic && !hasLatin ? "rtl" : "ltr"
}

function hasRTLText(value?: string | null) {
  const text = cleanText(value)
  return /[\u0600-\u06FF]/.test(text) && !/[A-Za-z]/.test(text)
}

function parseNamePhonePair(segment: string): { label: string; number: string } | null {
  const clean = segment.trim()
  if (!clean.includes(":")) return null
  const colonIdx = clean.indexOf(":")
  const label = clean.slice(0, colonIdx).trim()
  const number = clean.slice(colonIdx + 1).trim()
  if (!label || !number) return null

  // Reject general business fields from being formatted as phone pairs
  const isBusinessField = /^(no|gst|pan|iec|fssai|cargo|item|items|invoice|bl|bol|container|seal|truck|driver|weight|gross|net|rate|qty|quantity|total|remarks|goods|description|address|date|place|origin|destination)$/i.test(label)
  if (isBusinessField) return null

  const totalDigits = number.replace(/\D/g, "").length
  // Phone number MUST be purely digits, +, spaces, hyphens, parentheses, and NO English letters
  const isPurePhone = /^\+?[\d\s\-\(\)\/\.]{5,30}$/.test(number) && totalDigits >= 5 && !/[a-zA-Z]/.test(number)

  if (isPurePhone && (hasRTLText(label) || /^(phone|cell|tel|mobile|contact|rep|representative|whatsApp|telegram)$/i.test(label))) {
    return { label, number }
  }
  return null
}

function renderLineContent(line: string, forceLTR = false, parentClass?: string) {
  let clean = line.trim()
  if (!clean) return null

  // If line is a pure phone number with an accidental trailing colon (e.g. "0794983011:")
  if (/^\+?[\d\s\-\(\)\/\.]+:$/.test(clean) && !/[a-zA-Z]/.test(clean)) {
    clean = clean.slice(0, -1).trim()
  }

  const isCompanyName = Boolean(parentClass?.includes("party-card-name") || parentClass?.includes("company-name"))
  const isExplicitContact = Boolean(
    parentClass?.includes("party-card-contact") ||
    parentClass?.includes("party-card-phone") ||
    parentClass?.includes("party-card-email") ||
    parentClass?.includes("contact-details")
  )

  // Check if line is purely phone numbers or dialing codes (e.g. "0796140001 0703130001" or "(+93) 0 700 203 307")
  const totalDigits = clean.replace(/\D/g, "").length
  const isPureNumericPhone = /^\+?[\d\s\-\(\)\/\.]{7,50}$/.test(clean) && totalDigits >= 5 && !/[a-zA-Z]/.test(clean)
  if (isPureNumericPhone) {
    return (
      <span
        className="block party-card-typewriter party-card-phone contact-details font-bold text-black tracking-normal text-[11.0pt] leading-tight text-left"
        dir="ltr"
        style={{
          direction: "ltr",
          unicodeBidi: "isolate",
          fontFamily: '"Courier New", Courier, monospace',
          color: "#000000",
          fontWeight: 700,
          letterSpacing: 0,
          fontVariantLigatures: "none",
        }}
      >
        {clean}
      </span>
    )
  }

  // Check if line is an email address (e.g. HEMAL.DAVDA@YAHOO.COM)
  const isPureEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(clean)
  if (isPureEmail) {
    return (
      <span
        className="block party-card-typewriter party-card-email contact-details font-bold text-black tracking-normal text-[10.2pt] leading-tight text-left"
        dir="ltr"
        style={{
          direction: "ltr",
          unicodeBidi: "isolate",
          fontFamily: '"Courier New", Courier, monospace',
          color: "#000000",
          fontWeight: 700,
          letterSpacing: 0,
          fontVariantLigatures: "none",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {clean}
      </span>
    )
  }

  // Check if line contains multiple contact items separated by comma, pipe, or semicolon (e.g. "عصمت الله: 0729807676 , حکمت الله: 0799007371")
  const delimiter = clean.includes(" , ") ? " , " : clean.includes(",") ? "," : clean.includes("|") ? "|" : clean.includes("؛") ? "؛" : null
  if (delimiter) {
    const rawSegments = clean.split(delimiter).map((s) => s.trim()).filter(Boolean)
    const hasPairs = rawSegments.some((s) => parseNamePhonePair(s) !== null)

    if (hasPairs) {
      return (
        <span className="inline-flex items-center flex-wrap gap-x-2 gap-y-1 font-bold leading-normal text-left max-w-full" dir="ltr">
          {rawSegments.map((segment, idx) => {
            const pair = parseNamePhonePair(segment)
            if (pair) {
              const isLabelPersian = hasRTLText(pair.label)
              return (
                <span key={idx} className="whitespace-nowrap inline-flex items-center gap-1">
                  {idx > 0 && <span className="text-blue-400 font-bold mx-0.5">•</span>}
                  <span
                    className={isLabelPersian ? "persian-text bol-persian-text font-[vazirmatn] text-slate-800 font-extrabold text-[8.2pt]" : "party-card-typewriter text-black font-bold text-[8.2pt]"}
                    dir="ltr"
                    style={{
                      unicodeBidi: "isolate",
                      ...(isLabelPersian
                        ? {}
                        : {
                            fontFamily: '"Courier New", Courier, monospace',
                            color: "#000000",
                            fontWeight: 700,
                            letterSpacing: 0,
                            fontVariantLigatures: "none",
                          }),
                    }}
                  >
                    {pair.label}
                  </span>
                  <span className="text-slate-400 font-black text-[8.2pt]">:</span>
                  <span
                    className="party-card-typewriter party-card-phone contact-details font-bold text-black tracking-normal text-[9.5pt]"
                    dir="ltr"
                    style={{
                      direction: "ltr",
                      unicodeBidi: "isolate",
                      fontFamily: '"Courier New", Courier, monospace',
                      color: "#000000",
                      fontWeight: 700,
                      letterSpacing: 0,
                      fontVariantLigatures: "none",
                    }}
                  >
                    {pair.number}
                  </span>
                </span>
              )
            }

            const isSegPersian = hasRTLText(segment)
            return (
              <span key={idx} className="whitespace-nowrap inline-flex items-center gap-1">
                {idx > 0 && <span className="text-blue-400 font-bold mx-0.5">•</span>}
                <span
                  className={isSegPersian ? "persian-text bol-persian-text font-[vazirmatn] text-slate-800 font-extrabold text-[8.2pt]" : "party-card-typewriter text-black font-semibold text-[8pt]"}
                  dir="ltr"
                  style={{
                    unicodeBidi: "isolate",
                    ...(isSegPersian
                      ? {}
                      : {
                          fontFamily: '"Courier New", Courier, monospace',
                          color: "#000000",
                          fontWeight: 600,
                          letterSpacing: 0,
                          fontVariantLigatures: "none",
                        }),
                  }}
                >
                  {segment}
                </span>
              </span>
            )
          })}
        </span>
      )
    }
  }

  // Check if line is a single contact label:number pair (e.g. "نماینده دوغارون / شماره تماس: 09152091993")
  const singlePair = parseNamePhonePair(clean)
  if (singlePair) {
    const isLabelPersian = hasRTLText(singlePair.label)
    return (
      <span className="whitespace-nowrap inline-flex items-center gap-1 font-bold leading-normal text-left" dir="ltr">
        <span
          className={isLabelPersian ? "persian-text bol-persian-text font-[vazirmatn] text-slate-800 font-extrabold text-[8.4pt]" : "party-card-typewriter text-black font-bold text-[8.4pt]"}
          dir="ltr"
          style={{
            unicodeBidi: "isolate",
            ...(isLabelPersian
              ? {}
              : {
                  fontFamily: '"Courier New", Courier, monospace',
                  color: "#000000",
                  fontWeight: 700,
                  letterSpacing: 0,
                  fontVariantLigatures: "none",
                }),
          }}
        >
          {singlePair.label}
        </span>
        <span className="text-slate-400 font-black text-[8.4pt]">:</span>
        <span
          className="party-card-typewriter party-card-phone contact-details font-bold text-black tracking-normal text-[9.2pt]"
          dir="ltr"
          style={{
            direction: "ltr",
            unicodeBidi: "isolate",
            fontFamily: '"Courier New", Courier, monospace',
            color: "#000000",
            fontWeight: 700,
            letterSpacing: 0,
            fontVariantLigatures: "none",
          }}
        >
          {singlePair.number}
        </span>
      </span>
    )
  }

  // Check if line is a Persian section label ending with colon (e.g. "حاجی معلم صاحب:")
  if (clean.endsWith(":") && hasRTLText(clean.slice(0, -1))) {
    const labelOnly = clean.slice(0, -1).trim()
    return (
      <span
        className="block persian-text bol-persian-text font-[vazirmatn] text-[8.6pt] font-black text-blue-900 leading-tight text-left mt-0.5"
        dir="rtl"
        style={{ unicodeBidi: "isolate", textAlign: "left" }}
      >
        {labelOnly}:
      </span>
    )
  }

  // Ensure slashes in text have clean space around them so they don't stick to words
  const spacedLine = clean.replace(/([^\s])\/([^\s])/g, "$1 / $2")
  const isPersian = hasRTLText(spacedLine)
  const isPersianDigitsOnly = /^[\u06F0-\u06F9\/\-\s:]+$/.test(spacedLine)
  const isRegistrationLine = /^(gst|iec|fssai|fssi|pan|vat|tax|tin|cst|msme|eori|cin|llpin)\b/i.test(spacedLine)
  const isWeight700 = isCompanyName || isExplicitContact

  return (
    <span
      className={`block ${
        isPersian
          ? "persian-text bol-persian-text font-[vazirmatn] text-[10.0pt] font-extrabold text-slate-900"
          : `party-card-typewriter text-black font-typewriter ${
              isCompanyName
                ? "company-name font-bold text-[11.2pt]"
                : isExplicitContact
                ? "contact-details font-bold text-[9.8pt]"
                : isRegistrationLine
                ? "registration-details party-card-registration font-semibold text-[9.6pt]"
                : "business-address party-card-address font-semibold text-[9.6pt]"
            }`
      } ${isPersianDigitsOnly ? "persian-digits" : ""} leading-snug text-left break-words`}
      dir={isPersianDigitsOnly ? "ltr" : isPersian ? "rtl" : "ltr"}
      style={{
        unicodeBidi: "isolate",
        textAlign: "left",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        ...(isPersian
          ? {}
          : {
              fontFamily: '"Courier New", Courier, monospace',
              color: "#000000",
              fontWeight: isWeight700 ? 700 : 600,
              letterSpacing: 0,
              fontVariantLigatures: "none",
            }),
      }}
    >
      {spacedLine}
    </span>
  )
}

function TextLines({
  value,
  className,
  forceLTR = false,
}: {
  value?: string | null
  className?: string
  forceLTR?: boolean
}) {
  const lines = cleanText(value).split("\n").filter(Boolean)

  if (lines.length === 0) return null

  return (
    <span
      className={`block min-w-0 max-w-full ${className || ""} ${forceLTR ? "text-left" : ""}`}
      dir={forceLTR ? "ltr" : undefined}
      style={{
        overflowWrap: "anywhere",
        unicodeBidi: "plaintext",
        textAlign: forceLTR ? "left" : "inherit",
        wordBreak: "break-word",
      }}
    >
      {lines.map((line, index) => (
        <span key={`${line}-${index}`} className="block text-left">
          {renderLineContent(line, forceLTR, className)}
        </span>
      ))}
    </span>
  )
}

function Section({
  title,
  subtitle,
  icon,
  badge,
  centerContent,
  children,
  glass = false,
  printKey,
  pdfMode = false,
  titleClassName,
  subtitleClassName,
  compactHeight = false,
  densityTier = "normal",
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  badge?: ReactNode
  centerContent?: ReactNode
  children: ReactNode
  glass?: boolean
  printKey?: string
  pdfMode?: boolean
  titleClassName?: string
  subtitleClassName?: string
  compactHeight?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra
  const isCompactHeader = compactHeight || Boolean(badge)

  const headerPadding = isCompactHeader
    ? (isUltra ? "px-1.5 py-[0.5px]" : isCompact ? "px-1.8 py-[0.8px]" : "px-2 py-[1px]")
    : (isUltra ? "px-1.5 py-[0.8px]" : isCompact ? "px-1.8 py-[1.4px]" : "px-2 py-[2px]")

  return (
    <section
      dir="ltr"
      data-print-section={printKey || title}
      {...(pdfMode ? { 'data-no-break': true } : {})}
      className={`overflow-hidden rounded-xl border shrink-0 ${pdfMode ? 'border-blue-200/90 bg-white' : 'shadow-xs border-blue-200/80 bg-white/95'}`}
    >
      <div
        className={`flex items-center justify-between text-white ${headerPadding} ${
          isCompactHeader ? (isUltra ? "min-h-[19px]" : "min-h-[22px]") : ""
        }`}
        style={blueBarStyle}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          {icon}
          {/* Force English title to render left-to-right so mixed-language headers don't flip */}
          <h3
            dir="ltr"
            className={`${
              titleClassName || "!text-[11.5pt]"
            } font-black uppercase leading-none tracking-wide whitespace-nowrap shrink-0`}
          >
            {title}
          </h3>
        </div>
        {centerContent && <div className="flex-1 min-w-0 flex items-center justify-center px-2">{centerContent}</div>}
        {badge && (
          <div className="flex items-center justify-center shrink-0 mx-2">
            {badge}
          </div>
        )}
        {subtitle && (
          <p
            className={`persian-text bol-persian-text font-[vazirmatn] ${
              subtitleClassName || "!text-[12.2pt]"
            } font-bold leading-none whitespace-nowrap shrink-0`}
            dir="rtl"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className={isUltra ? "p-[2.5px]" : isCompact ? "p-[3px]" : "p-[3.5px]"}>{children}</div>
    </section>
  )
}

function renderFormattedLabel(label: string, forceLTR = false) {
  if (!label) return null

  if (label.includes("/")) {
    const parts = label.split("/")
    const englishPart = parts[0].trim()
    const persianPart = parts.slice(1).join("/").trim()

    return (
      <div className="flex items-center justify-between gap-2 text-left" dir="ltr">
        <span className="block text-[5.6pt] font-black uppercase tracking-wider text-blue-700 leading-tight text-left">
          {englishPart}
        </span>
        {persianPart && (
          <span className="block persian-text bol-persian-text font-[vazirmatn] text-[5.8pt] font-extrabold text-blue-600 leading-tight text-right" dir="rtl" style={{ unicodeBidi: "isolate" }}>
            {persianPart}
          </span>
        )}
      </div>
    )
  }

  if (label.includes("\n")) {
    const lines = label.split("\n")
    return (
      <div className="flex flex-col space-y-[1px] text-left" dir="ltr">
        {lines.map((line, idx) => {
          const isPersian = /[\u0600-\u06FF]/.test(line)
          return (
            <span
              key={idx}
              className={`block ${
                isPersian
                  ? "persian-text bol-persian-text font-[vazirmatn] text-[5.8pt] font-extrabold text-blue-600"
                  : "text-[5.6pt] font-black uppercase tracking-wider text-blue-700"
              } leading-tight text-left`}
              dir="ltr"
              style={{ unicodeBidi: "isolate", textAlign: "left" }}
            >
              {line.trim()}
            </span>
          )
        })}
      </div>
    )
  }

  const isPersianOnly = /[\u0600-\u06FF]/.test(label) && !/[A-Za-z]/.test(label)
  return (
    <div
      className={`block ${
        isPersianOnly
          ? "persian-text bol-persian-text font-[vazirmatn] text-[6pt] font-black text-blue-700"
          : "text-[5.6pt] font-black uppercase tracking-wider text-blue-700"
      } leading-tight text-left`}
      dir="ltr"
      style={{ unicodeBidi: "isolate", textAlign: "left" }}
    >
      {label}
    </div>
  )
}

function DetailCard({
  label,
  value,
  important,
  rtl,
  glass = false,
  pdfMode = false,
  compact = false,
  highlight = false,
  highlightColor,
  className,
  center = false,
  densityTier = "normal",
}: DetailItem & {
  glass?: boolean
  pdfMode?: boolean
  compact?: boolean
  className?: string
  center?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  if (!hasValue(value)) return null

  const isUltra = compact || densityTier === "ultra"
  const isCompactTier = densityTier === "compact"
  const theme = (highlightColor || '').toLowerCase()
  const isRedHighlight = theme === "red"
  const isGreenHighlight = theme === "green"

  const phoneBadgeClass = isUltra ? "w-5.5 h-5.5" : isCompactTier ? "w-6.5 h-6.5" : "w-7.5 h-7.5"
  const phoneIconClass = isUltra ? "h-3 w-3" : isCompactTier ? "h-3.5 w-3.5" : "h-4 w-4"

  const getPhoneFontSize = (lineStr: string) => {
    const len = lineStr.trim().length
    if (len <= 22) {
      return isUltra ? "text-[13pt]" : isCompactTier ? "text-[15pt]" : "text-[17pt]"
    }
    if (len <= 34) {
      return isUltra ? "text-[11.5pt]" : isCompactTier ? "text-[13.5pt]" : "text-[15pt]"
    }
    return isUltra ? "text-[10pt]" : isCompactTier ? "text-[11.5pt]" : "text-[13pt]"
  }

  const rawLines = cleanText(value).split("\n").map((l) => l.trim()).filter(Boolean)
  const lines: string[] = []
  for (const rawLine of rawLines) {
    if (rawLine.includes(",") && /:\s*[\d+]/.test(rawLine)) {
      const subParts = rawLine.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean)
      lines.push(...subParts)
    } else {
      lines.push(rawLine)
    }
  }

  const isLabelPersianOnly = /[\u0600-\u06FF]/.test(label) && !/[A-Za-z]/.test(label)
  const hasLabelSlash = label.includes("/")
  const slashParts = hasLabelSlash ? label.split("/") : []
  const englishLabel = hasLabelSlash ? slashParts[0].trim() : ""
  const persianLabel = hasLabelSlash ? slashParts.slice(1).join("/").trim() : ""

  return (
    <div
      dir="ltr"
      {...(pdfMode ? { 'data-no-break': true } : {})}
      style={{
        backgroundColor: "#ffffff",
        borderColor: isRedHighlight ? "#fecdd3" : isGreenHighlight ? "#a7f3d0" : "#bfdbfe",
        minHeight: isUltra ? "50px" : isCompactTier ? "56px" : "62px",
        boxSizing: "border-box",
      }}
      className={`rounded-lg border transition-all ${
        isRedHighlight
          ? "border-rose-200/90 bg-gradient-to-br from-rose-50/70 via-white to-pink-50/30"
          : isGreenHighlight
          ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30"
          : "border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40"
      } ${pdfMode ? "" : "shadow-2xs"} ${isUltra ? "p-1" : "p-1.2 sm:p-1.5"} ${className || ""}`}
    >
      {/* Header Bar */}
      <div
        style={{
          borderBottomColor: isRedHighlight ? "#fecdd3" : isGreenHighlight ? "#a7f3d0" : "#bfdbfe",
          minHeight: "24px",
        }}
        className={`flex items-center justify-between gap-1 pt-0.5 pb-1 mb-1 border-b min-h-[24px] ${
          isRedHighlight ? "border-rose-200/70" : isGreenHighlight ? "border-emerald-200/70" : "border-blue-200/70"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0" dir={isLabelPersianOnly ? "rtl" : "ltr"}>
          <div
            style={{
              backgroundColor: isRedHighlight ? "#e11d48" : isGreenHighlight ? "#059669" : "#2563eb",
            }}
            className={`p-0.8 rounded text-white shadow-2xs shrink-0 flex items-center justify-center ${
              isRedHighlight ? "bg-rose-600" : isGreenHighlight ? "bg-emerald-600" : "bg-blue-600"
            }`}
          >
            <UserRound className="h-2.5 w-2.5 text-white" />
          </div>
          {hasLabelSlash ? (
            <div className="flex items-center gap-1 min-w-0 flex-wrap" dir="ltr">
              <span
                className={`font-mono ${isUltra ? "text-[6.2pt]" : "text-[7.0pt]"} font-black uppercase tracking-wider ${
                  isRedHighlight ? "text-rose-900" : isGreenHighlight ? "text-emerald-900" : "text-blue-900"
                }`}
              >
                {englishLabel}
              </span>
              <span className="text-slate-300 font-bold text-[6.0pt]">/</span>
              <span
                className={`persian-text bol-persian-text font-[vazirmatn] ${isUltra ? "text-[7.2pt]" : "text-[8.0pt]"} font-black ${
                  isRedHighlight ? "text-rose-800" : isGreenHighlight ? "text-emerald-800" : "text-blue-800"
                }`}
                dir="rtl"
              >
                {persianLabel}
              </span>
            </div>
          ) : isLabelPersianOnly ? (
            <span
              className={`persian-text bol-persian-text font-[vazirmatn] ${
                isUltra ? "text-[7.5pt]" : "text-[8.4pt]"
              } font-black leading-normal whitespace-nowrap overflow-visible ${
                isRedHighlight ? "text-rose-950" : isGreenHighlight ? "text-emerald-950" : "text-blue-950"
              }`}
              dir="rtl"
            >
              {label}
            </span>
          ) : (
            <span
              className={`font-mono ${isUltra ? "text-[6.5pt]" : "text-[7.2pt]"} font-black uppercase tracking-wider whitespace-nowrap overflow-visible ${
                isRedHighlight ? "text-rose-900" : isGreenHighlight ? "text-emerald-900" : "text-blue-900"
              }`}
            >
              {label}
            </span>
          )}
        </div>

        <span
          style={{
            backgroundColor: isRedHighlight ? "#ffe4e6" : isGreenHighlight ? "#d1fae5" : "#dbeafe",
            borderColor: isRedHighlight ? "#fecdd3" : isGreenHighlight ? "#a7f3d0" : "#bfdbfe",
            color: isRedHighlight ? "#9f1239" : isGreenHighlight ? "#065f46" : "#1e40af",
          }}
          className={`px-2 py-0.5 rounded-full border font-mono text-[5.4pt] font-black uppercase tracking-wider shrink-0 shadow-2xs ${
            isRedHighlight
              ? "bg-rose-100/90 border-rose-200/90 text-rose-800"
              : isGreenHighlight
              ? "bg-emerald-100/90 border-emerald-200/90 text-emerald-800"
              : "bg-blue-100/90 border-blue-200/90 text-blue-800"
          }`}
        >
          OFFICIAL
        </span>
      </div>

      {/* Body Lines */}
      <div className="flex flex-col gap-1">
        {lines.map((line, idx) => {
          const totalDigits = line.replace(/\D/g, "").length

          // Check pure numeric phone (including multiple numbers separated by slash or pipe)
          const isPurePhone =
            /^[\d\s\+\-\(\)\/\.\|]{7,60}$/.test(line.trim()) && totalDigits >= 5 && !/[a-zA-Z\u0600-\u06FF]/.test(line)
          if (isPurePhone) {
            return (
              <div key={idx} className="flex items-center gap-1.5 my-0.5" dir="ltr">
                <div
                  className={`${phoneBadgeClass} rounded-full ${
                    isRedHighlight
                      ? "bg-rose-100/90 border-rose-200/90 text-rose-700"
                      : isGreenHighlight
                      ? "bg-emerald-100/90 border-emerald-200/90 text-emerald-700"
                      : "bg-blue-100/90 border-blue-200/90 text-blue-700"
                  } border flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <Phone className={phoneIconClass} />
                </div>
                <span className={`font-mono ${getPhoneFontSize(line)} font-black text-slate-950 tracking-tight leading-none whitespace-nowrap`}>
                  {line}
                </span>
              </div>
            )
          }

          // Check email
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)
          if (isEmail) {
            return (
              <div key={idx} className="flex items-center gap-1.5 my-0.1" dir="ltr">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isRedHighlight
                      ? "bg-rose-100/90 border-rose-200/90 text-rose-700"
                      : isGreenHighlight
                      ? "bg-emerald-100/90 border-emerald-200/90 text-emerald-700"
                      : "bg-sky-100/90 border-sky-200/90 text-sky-700"
                  } border flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <Mail className="h-1.8 w-1.8" />
                </div>
                <span className={`font-mono ${isUltra ? "text-[6pt]" : "text-[6.5pt]"} font-bold text-slate-800 tracking-tight leading-snug`}>
                  {line}
                </span>
              </div>
            )
          }

          // Check single label:phone pair
          const pair = parseNamePhonePair(line)
          if (pair) {
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-1 w-full my-0.2 px-1 py-0.3 rounded bg-white/80 border border-slate-200/70"
                dir="ltr"
              >
                <div className="flex items-center gap-1 min-w-0" dir={hasRTLText(pair.label) ? "rtl" : "ltr"}>
                  <div
                    className={`${phoneBadgeClass} rounded-full ${
                      isRedHighlight
                        ? "bg-rose-100/90 border-rose-200/90 text-rose-700"
                        : isGreenHighlight
                        ? "bg-emerald-100/90 border-emerald-200/90 text-emerald-700"
                        : "bg-blue-100/90 border-blue-200/90 text-blue-700"
                    } border flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    <Phone className={phoneIconClass} />
                  </div>
                  <span
                    className={`${
                      hasRTLText(pair.label)
                        ? `persian-text font-[vazirmatn] ${isUltra ? "text-[6.8pt]" : "text-[7.6pt]"} font-black`
                        : `font-sans ${isUltra ? "text-[6.6pt]" : "text-[7.4pt]"} font-bold`
                    } text-slate-900 truncate`}
                    dir={hasRTLText(pair.label) ? "rtl" : "ltr"}
                  >
                    {pair.label}:
                  </span>
                </div>
                <span className={`font-mono ${getPhoneFontSize(pair.number)} font-black text-slate-950 tracking-tight whitespace-nowrap shrink-0`} dir="ltr">
                  {pair.number}
                </span>
              </div>
            )
          }

          // Representative Name or Description
          const isLinePersian = hasRTLText(line)
          const hasPhoneDigits = totalDigits >= 5 && !/[a-zA-Z]/.test(line) && !isLinePersian

          return (
            <div key={idx} className="flex items-start gap-1.5 my-0.2 w-full min-w-0" dir={isLinePersian ? "rtl" : "ltr"}>
              <div
                className={`${hasPhoneDigits ? phoneBadgeClass : (isUltra ? "w-3.5 h-3.5" : "w-4 h-4")} mt-0.2 rounded-full ${
                  isRedHighlight
                    ? "bg-rose-100/90 border-rose-200/90 text-rose-700"
                    : isGreenHighlight
                    ? "bg-emerald-100/90 border-emerald-200/90 text-emerald-700"
                    : "bg-blue-100/90 border-blue-200/90 text-blue-700"
                } border flex items-center justify-center shrink-0 shadow-2xs`}
              >
                {hasPhoneDigits ? (
                  <Phone className={phoneIconClass} />
                ) : (
                  <UserRound className={isUltra ? "h-1.8 w-1.8" : "h-2 w-2"} />
                )}
              </div>
              <span
                className={`${
                  isLinePersian
                    ? `persian-text bol-persian-text font-[vazirmatn] ${isUltra ? "text-[7.4pt]" : isCompactTier ? "text-[8.2pt]" : "text-[9pt]"} font-extrabold`
                    : hasPhoneDigits
                    ? `font-mono ${getPhoneFontSize(line)} font-black text-slate-950 tracking-tight leading-none whitespace-nowrap`
                    : `font-sans ${isUltra ? "text-[6.4pt]" : "text-[7pt]"} font-bold`
                } text-slate-800 leading-snug break-words`}
              >
                {line}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PartyCard({
  title,
  subtitle,
  icon,
  name,
  address,
  contact,
  email,
  glass = false,
  pdfMode = false,
  densityTier = "normal",
}: {
  title: string
  subtitle: string
  icon: ReactNode
  name?: string
  address?: string
  contact?: string
  email?: string
  glass?: boolean
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  if (![name, address, contact, email].some(hasValue)) return null
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  return (
    <div
      {...(pdfMode ? { 'data-no-break': true } : {})}
      className={`party-card business-information consignee-details ${glass ? 'party-card-glass' : 'party-card-solid'} ${pdfMode ? 'party-card-pdf' : ''}`}
    >
      <div className={`party-card-header ${glass ? 'party-card-header-glass' : 'party-card-header-solid'} ${isUltra ? "!py-0.8 !px-1.5" : isCompact ? "!py-1 !px-2" : ""}`}>
        <span className={`party-card-icon ${isUltra ? "!w-4 !h-4 !min-w-4 rounded" : ""}`}>{icon}</span>
        <div className="party-card-header-text">
          <h4 className={`party-card-title ${isUltra ? "!text-[8.2pt]" : isCompact ? "!text-[9.2pt]" : "!text-[10.2pt]"}`}>{title}</h4>
          <p
            className={`party-card-subtitle ${isUltra ? "!text-[8.2pt]" : isCompact ? "!text-[9.2pt]" : "!text-[10.2pt]"} whitespace-nowrap`}
            dir="rtl"
            style={{ whiteSpace: "nowrap" }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      <div className={`party-card-body ${isUltra ? "!p-1.2 !gap-0.5" : isCompact ? "!p-1.5 !gap-1" : ""}`}>
        <TextLines value={name} className={`party-card-name company-name ${isUltra ? "!text-[8.8pt] leading-tight" : isCompact ? "!text-[9.8pt] leading-tight" : "!text-[11.2pt]"}`} />
        <div className={`party-card-info-list ${isUltra ? "!gap-0.3" : ""}`}>
          {hasValue(address) && (
            <div className="party-card-info-row">
              <MapPin className={`party-card-info-icon ${isUltra ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"}`} />
              <TextLines value={address} className={`party-card-info-text party-card-address business-address ${isUltra ? "!text-[7.6pt] leading-tight" : "!text-[9.6pt]"}`} />
            </div>
          )}
          {hasValue(contact) && (
            <div className="party-card-info-row">
              <Phone className={`party-card-info-icon ${isUltra ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"}`} />
              <TextLines value={contact} className={`party-card-info-text party-card-contact contact-details party-card-phone ${isUltra ? "!text-[7.6pt] leading-tight" : "!text-[9.8pt]"}`} />
            </div>
          )}
          {hasValue(email) && (
            <div className="party-card-info-row">
              <Mail className={`party-card-info-icon ${isUltra ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"}`} />
              <TextLines value={email} className={`party-card-info-text party-card-contact contact-details party-card-email ${isUltra ? "!text-[7.6pt] leading-tight" : "!text-[9.8pt]"}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type RouteTransportIcon = ComponentType<{ size?: number; strokeWidth?: number }>

type RouteTransportMeta = {
  label: string
  Icon: RouteTransportIcon
  color: string
}

const defaultRouteTransportMeta: RouteTransportMeta = {
  label: "TRUCK",
  Icon: RouteTruckIcon,
  color: "#2563eb",
}

const routeTransportMap: Record<string, RouteTransportMeta> = {
  air: {
    label: "AIR",
    Icon: RouteAirIcon,
    color: "#0f72e6",
  },
  airplane: {
    label: "AIR",
    Icon: RouteAirIcon,
    color: "#0f72e6",
  },
  plane: {
    label: "AIR",
    Icon: RouteAirIcon,
    color: "#0f72e6",
  },
  truck: {
    label: "TRUCK",
    Icon: RouteTruckIcon,
    color: "#2563eb",
  },
  road: {
    label: "TRUCK",
    Icon: RouteTruckIcon,
    color: "#2563eb",
  },
  lorry: {
    label: "TRUCK",
    Icon: RouteTruckIcon,
    color: "#2563eb",
  },
  van: {
    label: "VAN",
    Icon: RouteCarIcon,
    color: "#1d4ed8",
  },
  car: {
    label: "CAR",
    Icon: RouteCarIcon,
    color: "#1d4ed8",
  },
  train: {
    label: "TRAIN",
    Icon: RouteTrainIcon,
    color: "#0f172a",
  },
  rail: {
    label: "TRAIN",
    Icon: RouteTrainIcon,
    color: "#0f172a",
  },
  vessel: {
    label: "VESSEL",
    Icon: RouteVesselIcon,
    color: "#2563eb",
  },
  ship: {
    label: "VESSEL",
    Icon: RouteVesselIcon,
    color: "#2563eb",
  },
  boat: {
    label: "VESSEL",
    Icon: RouteVesselIcon,
    color: "#2563eb",
  },
  sea: {
    label: "VESSEL",
    Icon: RouteVesselIcon,
    color: "#2563eb",
  },
  ocean: {
    label: "VESSEL",
    Icon: RouteVesselIcon,
    color: "#2563eb",
  },
}

export function getRouteTransportMeta(mode?: string): RouteTransportMeta {
  if (!mode || typeof mode !== "string") {
    return defaultRouteTransportMeta
  }

  const normalizedMode = mode.trim().toLowerCase()
  return routeTransportMap[normalizedMode] ?? defaultRouteTransportMeta
}

function TransportIcon({ mode, size = 24 }: { mode?: string; size?: number }) {
  const { Icon } = getRouteTransportMeta(mode)
  return <Icon size={size} strokeWidth={2.4} aria-hidden="true" />
}

function routeModeLabel(mode?: string) {
  const normalizedMode = String(mode || "").trim().toLowerCase()
  if (!normalizedMode) return ""
  switch (normalizedMode) {
    case "airplane":
    case "plane":
    case "air":
      return "AIR"
    case "vessel":
    case "ship":
    case "boat":
    case "sea":
    case "ocean":
      return "VESSEL"
    case "train":
    case "rail":
      return "TRAIN"
    case "road":
    case "truck":
    case "lorry":
      return "TRUCK"
    case "car":
      return "CAR"
    case "van":
      return "VAN"
    default:
      return normalizedMode.toUpperCase()
  }
}

function routeFallbackLabels(location?: string | null) {
  const normalized = cleanText(location).toLowerCase()
  if (!normalized) return { persian: "", pashto: "" }

  if (normalized.includes("kandahar")) {
    return { persian: "\u06a9\u0646\u062f\u0647\u0627\u0631", pashto: "\u06a9\u0646\u062f\u0647\u0627\u0631" }
  }
  if (normalized.includes("nimroz") || normalized.includes("milak")) {
    return {
      persian: "\u0646\u06cc\u0645\u0631\u0648\u0632 / \u0645\u06cc\u0644\u06a9",
      pashto: "\u0646\u06cc\u0645\u0631\u0648\u0632 / \u0645\u06cc\u0644\u06a9",
    }
  }
  if (normalized.includes("dougharoun")) {
    return { persian: "\u062f\u0648\u063a\u0627\u0631\u0648\u0646\u060c \u0627\u06cc\u0631\u0627\u0646", pashto: "\u062f\u0648\u063a\u0627\u0631\u0648\u0646\u060c \u0627\u06cc\u0631\u0627\u0646" }
  }
  if (normalized.includes("dubai")) {
    return {
      persian: "\u062f\u0628\u06cc\u060c \u0627\u0645\u0627\u0631\u0627\u062a",
      pashto: "\u062f\u0628\u06cc\u060c \u0627\u0645\u0627\u0631\u0627\u062a",
    }
  }
  if (normalized.includes("iran") || normalized.includes("bandar abbas")) {
    return { persian: "\u0627\u06cc\u0631\u0627\u0646", pashto: "\u0627\u06cc\u0631\u0627\u0646" }
  }
  if (normalized.includes("nhava") || normalized.includes("sheva") || normalized.includes("india")) {
    return {
      persian: "\u0628\u0646\u062f\u0631 \u0646\u0627\u0648\u0627\u0634\u06cc\u0648\u0627",
      pashto: "\u0628\u0646\u062f\u0631 \u0646\u0627\u0648\u0627\u0634\u06cc\u0648\u0627",
    }
  }

  return { persian: "", pashto: "" }
}

function countryCodeToEmoji(countryCode?: string) {
  if (!countryCode) return ""
  const code = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return ""
  return code
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("")
}

function getRouteCountryMeta(location?: string, locationPersian?: string) {
  const source = String(location || locationPersian || "").trim()
  if (!source) return { emoji: "🌍", code: "", label: "" }

  const codeMatch = source.match(/,\s*([A-Za-z]{2})$/)
  const normalized = source.toLowerCase()

  const countryMatch = codeMatch?.[1]?.toUpperCase() ||
    (normalized.includes("afghanistan") || normalized.includes("kandahar") || normalized.includes("nimroz") || normalized.includes("milak") || normalized.includes("herat") || normalized.includes("kabul") || normalized.includes("mazar") || normalized.includes("hairatan") || normalized.includes("zaranj") || normalized.includes("islam qala") ? "AF" :
    normalized.includes("iran") || normalized.includes("bandar abbas") || normalized.includes("dougharoun") || normalized.includes("tehran") || normalized.includes("chabahar") || normalized.includes("milak border") || normalized.includes("jask") || normalized.includes("جاسک") ? "IR" :
    normalized.includes("india") || normalized.includes("nhava") || normalized.includes("sheva") || normalized.includes("mumbai") || normalized.includes("delhi") || normalized.includes("mundra") ? "IN" :
    normalized.includes("dubai") || normalized.includes("emirates") || normalized.includes("uae") || normalized.includes("abu dhabi") || normalized.includes("sharjah") || normalized.includes("jebel ali") ? "AE" :
    normalized.includes("pakistan") || normalized.includes("quetta") || normalized.includes("chaman") || normalized.includes("karachi") || normalized.includes("lahore") ? "PK" :
    normalized.includes("china") || normalized.includes("beijing") || normalized.includes("shanghai") || normalized.includes("qingdao") || normalized.includes("ningbo") || normalized.includes("guangzhou") || normalized.includes("shenzhen") ? "CN" :
    normalized.includes("turkey") || normalized.includes("mersin") || normalized.includes("istanbul") || normalized.includes("ankara") || normalized.includes("izmir") ? "TR" :
    normalized.includes("uzbekistan") || normalized.includes("tashkent") || normalized.includes("termez") ? "UZ" :
    normalized.includes("turkmenistan") || normalized.includes("ashgabat") ? "TM" :
    normalized.includes("tajikistan") || normalized.includes("dushanbe") ? "TJ" :
    normalized.includes("russia") || normalized.includes("moscow") || normalized.includes("saint petersburg") ? "RU" :
    normalized.includes("oman") || normalized.includes("muscat") || normalized.includes("sohar") || normalized.includes("suwaiq") || normalized.includes("al suwaiq") || normalized.includes("سویق") || normalized.includes("سويق") || normalized.includes("صحار") ? "OM" :
    normalized.includes("saudi") || normalized.includes("riyadh") || normalized.includes("jeddah") || normalized.includes("dammam") ? "SA" :
    "")

  const emojiMap: Record<string, string> = {
    AF: "🇦🇫",
    IR: "🇮🇷",
    IN: "🇮🇳",
    AE: "🇦🇪",
    PK: "🇵🇰",
    CN: "🇨🇳",
    TR: "🇹🇷",
    UZ: "🇺🇿",
    TM: "🇹🇲",
    TJ: "🇹🇯",
    RU: "🇷🇺",
    OM: "🇴🇲",
    SA: "🇸🇦",
    US: "🇺🇸",
    CA: "🇨🇦",
    GB: "🇬🇧",
  }

  const labelMap: Record<string, string> = {
    AF: "Afghanistan",
    IR: "Iran",
    IN: "India",
    AE: "UAE",
    PK: "Pakistan",
    CN: "China",
    TR: "Turkey",
    UZ: "Uzbekistan",
    TM: "Turkmenistan",
    TJ: "Tajikistan",
    RU: "Russia",
    OM: "Oman",
    SA: "Saudi Arabia",
    US: "USA",
    CA: "Canada",
    GB: "UK",
  }

  const code = countryMatch || ""
  const emoji = emojiMap[code] || countryCodeToEmoji(code) || "🌍"
  const label = labelMap[code] || code || ""

  return {
    emoji,
    code,
    label,
  }
}

interface FormattedRouteStopLocation {
  primaryName: string
  subFacility: string
  codeBadge: string
  persianMain: string
  persianSub: string
}

function formatRouteStopLocation(location?: string | null, locationPersian?: string | null): FormattedRouteStopLocation {
  const rawLoc = cleanText(location) || ""
  const rawFa = cleanText(locationPersian) || ""

  // Clean country code suffix like ", UZ", ", IN", ", AF", ", IR", ", AE", ", CI", ", GH"
  const cleanedLoc = rawLoc.replace(/,\s*[A-Za-z]{2,3}$/i, "").trim()

  // Extract airport/port code in parentheses e.g. (TAS / UTTT) -> TAS, (DEL / INDEL) -> DEL, (JNPT / Nhava Sheva) -> JNPT
  let codeBadge = ""
  const codeMatch = cleanedLoc.match(/\(([A-Za-z0-9\s\/\-_]+)\)/)
  if (codeMatch) {
    const inside = codeMatch[1].trim()
    const firstCode = inside.split(/[\/\s,]+/)[0].trim()
    if (firstCode.length >= 2 && firstCode.length <= 6) {
      codeBadge = firstCode
    }
  }

  let primaryName = cleanedLoc
  let subFacility = ""

  if (cleanedLoc.includes(" — ")) {
    const parts = cleanedLoc.split(" — ")
    primaryName = parts[0].trim()
    subFacility = parts[1].replace(/\([^)]+\)/g, "").trim()
  } else if (cleanedLoc.includes(" – ")) {
    const parts = cleanedLoc.split(" – ")
    primaryName = parts[0].trim()
    subFacility = parts[1].replace(/\([^)]+\)/g, "").trim()
  } else if (cleanedLoc.includes(" - ")) {
    const parts = cleanedLoc.split(" - ")
    primaryName = parts[0].trim()
    subFacility = parts[1].replace(/\([^)]+\)/g, "").trim()
  } else if (cleanedLoc.includes(" / ")) {
    const parts = cleanedLoc.split(" / ")
    primaryName = parts[0].trim()
    if (parts[1]) {
      subFacility = parts[1].replace(/\([^)]+\)/g, "").trim()
    }
  } else if (cleanedLoc.includes(" (") && cleanedLoc.length > 20) {
    primaryName = cleanedLoc.split(" (")[0].trim()
    const inside = cleanedLoc.match(/\(([^)]+)\)/)?.[1] || ""
    if (inside && inside !== codeBadge) {
      subFacility = inside
    }
  }

  // If subFacility is just redundant country name (already shown in top country pill), clear it
  if (/^(?:Oman|Afghanistan|Iran|Pakistan|India|UAE|United Arab Emirates|China|Turkey|Uzbekistan|Turkmenistan|Tajikistan)$/i.test(subFacility)) {
    subFacility = ""
  }

  // Persian formatting
  let persianMain = rawFa.replace(/،\s*(ازبکستان|هند|افغانستان|ایران|پاکستان|امارات|چین|ترکیه|عمان|آسیای مرکزی).*$/g, "").trim()
  let persianSub = ""

  if (persianMain.includes(" — ")) {
    const faParts = persianMain.split(" — ")
    persianMain = faParts[0].trim()
    persianSub = faParts[1]?.trim() || ""
  } else if (persianMain.includes(" – ")) {
    const faParts = persianMain.split(" – ")
    persianMain = faParts[0].trim()
    persianSub = faParts[1]?.trim() || ""
  } else if (persianMain.includes(" - ")) {
    const faParts = persianMain.split(" - ")
    persianMain = faParts[0].trim()
    persianSub = faParts[1]?.trim() || ""
  } else if (persianMain.includes(" (") && persianMain.length > 25) {
    const faParts = persianMain.split(" (")
    persianMain = faParts[0].trim()
    persianSub = faParts[1]?.replace(")", "").trim() || ""
  }

  if (/^(?:عمان|افغانستان|ایران|پاکستان|هند|امارات|چین|ترکیه|ازبکستان|ترکمنستان|تاجیکستان)$/i.test(persianSub)) {
    persianSub = ""
  }

  // Normalize authentic Afghan spelling for Nhava Sheva (نهاوا شیوا instead of نوا شوا)
  if (persianMain.includes("نوا شوا")) {
    persianMain = persianMain.replace(/نوا\s*شوا/g, "نهاوا شیوا")
  }
  if (!persianMain && (cleanedLoc.toLowerCase().includes("nhava") || cleanedLoc.toLowerCase().includes("sheva"))) {
    persianMain = "نهاوا شیوا"
  }
  if (persianSub.includes("نوا شوا")) {
    persianSub = persianSub.replace(/نوا\s*شوا/g, "نهاوا شیوا")
  }

  return {
    primaryName: primaryName || cleanedLoc,
    subFacility: subFacility !== primaryName ? subFacility : "",
    codeBadge,
    persianMain: persianMain || rawFa,
    persianSub,
  }
}

function RouteTimeline({
  routes,
  glass = false,
  densityTier = "normal",
}: {
  routes: BillOfLadingFormData["routes"]
  glass?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  if (!routes?.length) return null

  const isUltra = densityTier === "ultra" || routes.length >= 5
  const isCompact = densityTier === "compact" || routes.length >= 4 || isUltra

  const modeThemeMap: Record<string, { icon: string; label: string; persian: string; bg: string; style?: CSSProperties }> = {
    truck: { icon: "🚚", label: "TRUCK", persian: "جاده‌ای", bg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-black shadow-2xs", style: { backgroundColor: "#ecfdf5", color: "#064e3b", borderColor: "#6ee7b7" } },
    road: { icon: "🚚", label: "TRUCK", persian: "جاده‌ای", bg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-black shadow-2xs", style: { backgroundColor: "#ecfdf5", color: "#064e3b", borderColor: "#6ee7b7" } },
    lorry: { icon: "🚚", label: "TRUCK", persian: "جاده‌ای", bg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-black shadow-2xs", style: { backgroundColor: "#ecfdf5", color: "#064e3b", borderColor: "#6ee7b7" } },
    vessel: { icon: "🚢", label: "VESSEL", persian: "دریایی", bg: "bg-sky-50 text-sky-950 border-sky-300 font-black shadow-2xs", style: { backgroundColor: "#f0f9ff", color: "#082f49", borderColor: "#7dd3fc" } },
    ship: { icon: "🚢", label: "VESSEL", persian: "دریایی", bg: "bg-sky-50 text-sky-950 border-sky-300 font-black shadow-2xs", style: { backgroundColor: "#f0f9ff", color: "#082f49", borderColor: "#7dd3fc" } },
    boat: { icon: "🚢", label: "VESSEL", persian: "دریایی", bg: "bg-sky-50 text-sky-950 border-sky-300 font-black shadow-2xs", style: { backgroundColor: "#f0f9ff", color: "#082f49", borderColor: "#7dd3fc" } },
    sea: { icon: "🚢", label: "VESSEL", persian: "دریایی", bg: "bg-sky-50 text-sky-950 border-sky-300 font-black shadow-2xs", style: { backgroundColor: "#f0f9ff", color: "#082f49", borderColor: "#7dd3fc" } },
    ocean: { icon: "🚢", label: "VESSEL", persian: "دریایی", bg: "bg-sky-50 text-sky-950 border-sky-300 font-black shadow-2xs", style: { backgroundColor: "#f0f9ff", color: "#082f49", borderColor: "#7dd3fc" } },
    train: { icon: "🚆", label: "TRAIN", persian: "ریلی", bg: "bg-purple-50 text-purple-950 border-purple-300 font-black shadow-2xs", style: { backgroundColor: "#faf5ff", color: "#581c87", borderColor: "#d8b4fe" } },
    rail: { icon: "🚆", label: "TRAIN", persian: "ریلی", bg: "bg-purple-50 text-purple-950 border-purple-300 font-black shadow-2xs", style: { backgroundColor: "#faf5ff", color: "#581c87", borderColor: "#d8b4fe" } },
    airplane: { icon: "✈️", label: "AIR", persian: "هوایی", bg: "bg-blue-50 text-blue-950 border-blue-300 font-black shadow-2xs", style: { backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#93c5fd" } },
    air: { icon: "✈️", label: "AIR", persian: "هوایی", bg: "bg-blue-50 text-blue-950 border-blue-300 font-black shadow-2xs", style: { backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#93c5fd" } },
    plane: { icon: "✈️", label: "AIR", persian: "هوایی", bg: "bg-blue-50 text-blue-950 border-blue-300 font-black shadow-2xs", style: { backgroundColor: "#eff6ff", color: "#1e3a8a", borderColor: "#93c5fd" } },
    car: { icon: "🚗", label: "CAR", persian: "خودرو", bg: "bg-slate-50 text-slate-900 border-slate-300 font-black shadow-2xs", style: { backgroundColor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" } },
    van: { icon: "🚐", label: "VAN", persian: "ون", bg: "bg-slate-50 text-slate-900 border-slate-300 font-black shadow-2xs", style: { backgroundColor: "#f8fafc", color: "#0f172a", borderColor: "#cbd5e1" } },
  }
  const defaultModeTheme = { icon: "🚚", label: "TRUCK", persian: "جاده‌ای", bg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-black shadow-2xs", style: { backgroundColor: "#ecfdf5", color: "#064e3b", borderColor: "#6ee7b7" } }

  return (
    <div
      className={`route-timeline-container ${glass ? "glass-card" : ""}`}
      style={{
        background: "linear-gradient(145deg, #ffffff 0%, #f8faff 50%, #eff6ff 100%)",
        border: "1.5px solid #bfdbfe",
        borderRadius: "6px",
        padding: isUltra ? "1.5px 2px" : isCompact ? "2px 2.5px" : "2.5px 3.5px",
        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
      }}
      aria-label="Route and transportation path timeline"
    >
      {/* Route Cards Container */}
      <div className="route-timeline-cards flex items-center justify-between gap-0.5 sm:gap-1" role="list">
        {routes.map((route, index) => {
          const mode = (route.transportMode || "truck").toLowerCase().trim()
          const countryMeta = getRouteCountryMeta(route.location, route.locationPersian)
          const countryDisplay = countryMeta.label ? countryMeta.label.toUpperCase() : countryMeta.code
          const isLastRoute = index === routes.length - 1
          const isOrigin = index === 0
          const computedStopLabel = isOrigin ? "ORIGIN" : isLastRoute ? (isUltra ? "DEST" : "DESTINATION") : `STOP ${index}`
          const modeTheme = modeThemeMap[mode] || defaultModeTheme

          const formattedLoc = formatRouteStopLocation(route.location, route.locationPersian)

          return (
            <Fragment key={route.id || `${route.location}-${index}`}>
              <div className="route-timeline-item flex-1 min-w-0 flex flex-col items-stretch" role="listitem">
                <div
                  className={`route-timeline-card transition-all duration-200 w-full text-center relative overflow-hidden flex flex-col justify-between ${
                    isOrigin
                      ? "border-1.5 border-emerald-500 bg-linear-to-b from-emerald-50/70 via-white to-emerald-50/20 shadow-2xs shadow-emerald-100/50"
                      : isLastRoute
                      ? "border-1.5 border-indigo-500 bg-linear-to-b from-indigo-50/70 via-white to-indigo-50/20 shadow-2xs shadow-indigo-100/50"
                      : "border-1.5 border-blue-400 bg-linear-to-b from-blue-50/60 via-white to-blue-50/20 shadow-2xs shadow-blue-100/50"
                  }`}
                  style={{
                    borderRadius: "6px",
                    padding: isUltra ? "2px 2px" : isCompact ? "2.5px 3px" : "3px 4px",
                    minHeight: isUltra ? "46px" : isCompact ? "50px" : "56px",
                  }}
                >
                  {/* Top Accent Strip */}
                  <div className={`${isUltra ? "h-0.8" : "h-1"} w-full absolute top-0 left-0 right-0 ${
                    isOrigin ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-400' : isLastRoute ? 'bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-500' : 'bg-linear-to-r from-blue-500 via-cyan-500 to-blue-400'
                  }`} />

                  {/* Header 2-Tone Capsule Badge */}
                  <div className={`flex items-center justify-center ${isUltra ? "mt-0.5 mb-0.5 px-0.5" : "mt-0.8 mb-0.5 px-0.5"}`}>
                    <div className={`inline-flex items-center rounded-full border shadow-2xs overflow-hidden max-w-full font-black tracking-tight uppercase ${
                      isOrigin
                        ? "border-emerald-300/90"
                        : isLastRoute
                        ? "border-indigo-300/90"
                        : "border-blue-300/90"
                    } ${
                      isUltra ? "text-[4.6pt]" : isCompact ? "text-[5.0pt]" : "text-[5.5pt]"
                    }`}>
                      {/* Stop Type */}
                      <span className={`py-0.1 text-white shrink-0 font-black ${isUltra ? "px-1.2 text-[4.6pt]" : "px-1.5 text-[5.0pt]"} ${
                        isOrigin
                          ? "bg-emerald-600 border-r border-emerald-700"
                          : isLastRoute
                          ? "bg-indigo-600 border-r border-indigo-700"
                          : "bg-blue-600 border-r border-blue-700"
                      }`}>
                        {computedStopLabel}
                      </span>
                      {/* Country Display - clean single label without code duplication */}
                      {countryDisplay && (
                        <span className={`flex items-center gap-0.5 truncate font-extrabold ${
                          isOrigin
                            ? "bg-emerald-50/90 text-emerald-950"
                            : isLastRoute
                            ? "bg-indigo-50/90 text-indigo-950"
                            : "bg-blue-50/90 text-blue-950"
                        } ${
                          isUltra ? "px-1.2 py-0.1 text-[4.6pt]" : "px-1.5 py-0.1 text-[5.0pt]"
                        }`}>
                          <span className="truncate font-extrabold tracking-wide ml-0.5">{countryDisplay}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* City & Location Name (Vertically Balanced with High Contrast) */}
                  <div className={`flex-1 flex flex-col justify-center px-0.5 my-auto ${isUltra ? "min-h-[10px]" : isCompact ? "min-h-[12px]" : "min-h-[14px]"}`}>
                    <div className={`font-black text-slate-950 leading-tight break-words line-clamp-1 tracking-tight ${
                      isUltra ? "text-[8.0pt]" : isCompact ? "text-[8.6pt]" : "text-[9.4pt]"
                    }`}>
                      <span>{formattedLoc.primaryName}</span>
                      {formattedLoc.codeBadge && (
                        <span className={`ml-0.5 inline-block rounded bg-amber-100/90 text-amber-950 font-mono ${isUltra ? "text-[4pt] px-0.5" : "text-[4.5pt] px-0.8"} py-0.05 font-black border border-amber-300 align-middle`}>
                          {formattedLoc.codeBadge}
                        </span>
                      )}
                    </div>
                    {formattedLoc.subFacility && (
                      <div className={`font-semibold text-slate-500 leading-tight break-words line-clamp-1 ${isUltra ? "text-[4pt]" : "text-[4.4pt]"}`}>
                        {formattedLoc.subFacility}
                      </div>
                    )}
                    {hasValue(formattedLoc.persianMain) && (
                      <div className={`font-extrabold text-slate-800 dark:text-slate-200 font-[vazirmatn] leading-tight break-words line-clamp-1 mt-0.5 ${
                        isUltra ? "text-[7.0pt]" : isCompact ? "text-[7.6pt]" : "text-[8.4pt]"
                      }`} dir="rtl">
                        {formattedLoc.persianMain}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Mode Pill */}
                  <div className="mt-0.8 mb-0.5 flex items-center justify-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1 rounded-full font-black uppercase tracking-wide border whitespace-nowrap shadow-2xs ${
                        isUltra ? "px-2 py-0.4 text-[5.4pt]" : isCompact ? "px-2.5 py-0.5 text-[6.0pt]" : "px-3 py-0.6 text-[6.6pt]"
                      } ${modeTheme.bg}`}
                      style={modeTheme.style}
                    >
                      <span className={`${isUltra ? "text-[5.0pt]" : "text-[5.8pt]"} leading-none shrink-0`}>{modeTheme.icon}</span>
                      <span dir="rtl" className={`font-[vazirmatn] font-bold ${isUltra ? "text-[4.5pt]" : "text-[5.2pt]"} opacity-90 inline-block`}>
                        ({modeTheme.persian})
                      </span>
                      <span dir="ltr" className="inline-block font-black ml-0.5">
                        {modeTheme.label}
                      </span>
                    </span>
                  </div>

                  {/* Truck Specifications & Customs Seal Badges */}
                  {(route.plateNumber || route.chassisNumber || route.trailerMan || route.customsSealRequired) && (
                    <div className="mt-0.5 pt-0.5 border-t border-slate-200/80 space-y-0.2 text-left w-full">
                      {route.plateNumber && (
                        <div className="inline-flex items-center gap-0.5 bg-blue-100/90 text-blue-950 font-mono font-black text-[5.8pt] px-1 py-0.2 rounded border border-blue-200">
                          <span>پلیټ:</span>
                          <span>{route.plateNumber}</span>
                        </div>
                      )}
                      {route.chassisNumber && (
                        <div className="text-[5.8pt] font-extrabold text-slate-800 truncate">
                          <span className="text-slate-500">شاسی:</span> {route.chassisNumber}
                        </div>
                      )}
                      {route.trailerMan && (
                        <div className="text-[5.8pt] font-extrabold text-slate-800 truncate" dir="rtl font-[vazirmatn]">
                          <span className="text-slate-500">ټیلر مان:</span> {route.trailerMan}
                        </div>
                      )}
                      {route.customsSealRequired && (
                        <div className="mt-0.2 bg-amber-100 text-amber-950 font-black text-[5.8pt] px-1 py-0.2 rounded border border-amber-300 flex items-center gap-0.5 truncate" dir="rtl font-[vazirmatn]">
                          <span>📍 ګمرک سیل</span>
                          {route.customsSealNote ? <span className="font-semibold text-amber-800">({route.customsSealNote})</span> : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting Arrow Circle */}
              {!isLastRoute && (
                <div
                  className="route-timeline-arrow shrink-0 flex items-center justify-center w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-linear-to-b from-white to-blue-50 border border-blue-400 shadow-2xs text-blue-600 z-10 self-center mx-0.5"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-700 stroke-[2.5]" />
                </div>
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function parseDriverContactPhones(contact?: string | null): string[] {
  const text = cleanText(contact)
  if (!text) return []
  return text
    .split(/[,;/]+|\s{2,}/)
    .map((p) => p.trim().replace(/^,+|,+$/g, ""))
    .filter(Boolean)
}

function parseDriverRentInfo(rent?: string | null): { amount: string; note: string } {
  const text = cleanText(rent)
  if (!text) return { amount: "", note: "" }

  if (text.includes("\n")) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
    return { amount: lines[0] || "", note: lines.slice(1).join(" - ") }
  }

  // Handle formats like "45,000 - AFN - کرایه واپسی" or "45,000 AFN - کرایه واپسی"
  const parts = text.split(/\s*[-–—:]\s*/).map((p) => p.trim()).filter(Boolean)
  const currencies = new Set(["AFN", "USD", "EUR", "IRR", "PKR", "تومان", "افغانی", "دالر", "$"])

  if (parts.length >= 3 && currencies.has(parts[1].toUpperCase())) {
    return { amount: `${parts[0]} ${parts[1]}`, note: parts.slice(2).join(" - ") }
  }

  if (parts.length === 2 && currencies.has(parts[1].toUpperCase())) {
    return { amount: `${parts[0]} ${parts[1]}`, note: "" }
  }

  const match = text.match(/^([\d,.]+\s*(?:AFN|USD|\$|دالر|افغانی|تومان|IRR|PKR)?)(?:\s*[-–—:]\s*|\s+)(.*)$/i)
  if (match && match[1] && match[2]) {
    return { amount: match[1].trim(), note: match[2].trim() }
  }

  if (parts.length >= 2) {
    return { amount: parts[0], note: parts.slice(1).join(" - ") }
  }

  return { amount: text, note: "" }
}

function ShipmentOverview({
  issueDate,
  persianDateNumeric,
  formData,
  labels,
  pdfMode = false,
  densityTier = "normal",
}: {
  issueDate?: string
  persianDateNumeric?: string
  formData: BillOfLadingFormData
  labels: Record<string, string>
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  const driverNameVal = formData.driver_name ? formData.driver_name.trim() : ""
  const isPersianDriver = isPashtoOrArabic(driverNameVal) || isPashtoOrArabic(formData.driver_father_name || "")
  const fatherPrefix = isPersianDriver ? " ولد " : " S/O "
  const driverFatherNameVal = formData.driver_father_name ? `${fatherPrefix}${formData.driver_father_name.trim()}` : ""
  const driverFullInfo = driverNameVal || driverFatherNameVal ? `${driverNameVal}${driverFatherNameVal}` : ""

  const phones = parseDriverContactPhones(formData.driver_contact)
  const rentInfo = parseDriverRentInfo(formData.driver_rent)

  const hasIssueDate = hasValue(issueDate) || hasValue(persianDateNumeric)
  const hasTruck = hasValue(formData.truck_number)
  const hasDriver = hasValue(driverFullInfo)
  const hasContact = phones.length > 0
  const hasDriverOrContact = hasDriver || hasContact
  const hasRent = hasValue(formData.driver_rent)

  const activeCardsCount = [hasIssueDate, hasTruck, hasDriverOrContact, hasRent].filter(Boolean).length
  if (activeCardsCount === 0) return null

  const cardPaddingClass = hasTruck
    ? isUltra
      ? "px-1 py-0.8 min-h-[17.5mm]"
      : isCompact
      ? "px-1.5 py-1.2 min-h-[25mm]"
      : "px-2 py-1.5 min-h-[28mm]"
    : isUltra
    ? "px-1 py-0.6 min-h-[9mm]"
    : isCompact
    ? "px-1.5 py-0.8 min-h-[10.5mm]"
    : "px-2 py-1 min-h-[12mm]"
  const labelEnClass = `${isUltra ? "text-[7.2pt]" : isCompact ? "text-[8.0pt]" : "text-[8.8pt]"} font-black uppercase tracking-wider text-blue-900 leading-tight text-center block w-full`
  const labelFaClass = `font-[vazirmatn] ${isUltra ? "text-[7.0pt] mt-0.5" : isCompact ? "text-[7.8pt] mt-0.5" : "text-[8.6pt] mt-0.5"} font-black text-blue-700 leading-tight text-center block w-full`
  const cardHeaderEnClass = `${isUltra ? "text-[8.1pt]" : isCompact ? "text-[9.0pt]" : "text-[9.8pt]"} font-black uppercase tracking-wide text-blue-950 leading-snug`
  const cardHeaderFaClass = `${isUltra ? "text-[7.9pt]" : isCompact ? "text-[8.8pt]" : "text-[9.6pt]"} font-black text-blue-700 leading-snug`
  const valMarginClass = isUltra ? "my-auto pt-1 pb-0.5 text-center" : "my-auto pt-1.5 pb-1 text-center"

  const gridColsClass = activeCardsCount === 1
    ? "flex justify-start w-full"
    : activeCardsCount >= 4
    ? "grid-cols-[minmax(0,22fr)_minmax(0,28fr)_minmax(0,28fr)_minmax(0,22fr)]"
    : activeCardsCount === 3
    ? hasIssueDate && hasTruck
      ? "grid-cols-[minmax(0,18fr)_minmax(0,44fr)_minmax(0,38fr)]"
      : hasIssueDate
      ? "grid-cols-[minmax(0,20fr)_minmax(0,55fr)_minmax(0,25fr)]"
      : hasTruck
      ? "grid-cols-[minmax(0,44fr)_minmax(0,38fr)_minmax(0,18fr)]"
      : "grid-cols-3"
    : activeCardsCount === 2
    ? hasIssueDate && hasTruck
      ? "grid-cols-[minmax(0,22fr)_minmax(0,78fr)]"
      : hasIssueDate
      ? "grid-cols-[minmax(0,25fr)_minmax(0,75fr)]"
      : hasTruck
      ? "grid-cols-[minmax(0,55fr)_minmax(0,45fr)]"
      : "grid-cols-2"
    : "grid-cols-1"

  return (
    <div
      className={activeCardsCount === 1 ? gridColsClass : `grid gap-1.5 ${gridColsClass}`}
      dir="ltr"
    >
      {/* 1. ISSUE DATE */}
      {hasIssueDate && (
        <div
          className={`rounded-xl border text-center flex flex-col justify-between overflow-visible min-w-0 ${cardPaddingClass} ${
            pdfMode
              ? "border-blue-200 bg-white"
              : "border-blue-200/90 bg-gradient-to-b from-blue-50/40 via-white to-blue-50/20 shadow-xs"
          } ${activeCardsCount === 1 ? "w-full max-w-[44mm]" : "w-full max-w-[44mm] justify-self-start"}`}
        >
          <div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0.5 pb-1 mb-0.5 border-b border-blue-100/90">
            <span className={cardHeaderEnClass}>
              ISSUE DATE
            </span>
            <span className="text-blue-400 font-bold select-none text-[8.4pt] leading-none">/</span>
            <span
              className={`font-[vazirmatn] ${cardHeaderFaClass}`}
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "isolate" }}
            >
              تاریخ صدور
            </span>
          </div>
          <div className={`flex-1 flex flex-col items-center justify-center ${valMarginClass} w-full`}>
            {hasValue(issueDate) && (
              <div
                className={`font-mono font-black text-slate-950 ${
                  isUltra ? "text-[11.2pt] pt-0.5" : isCompact ? "text-[13.8pt] pt-1" : "text-[15.4pt] pt-1.5"
                } leading-tight whitespace-nowrap keep-all text-center tracking-tight`}
                dir="ltr"
                style={{ direction: "ltr", unicodeBidi: "isolate", textAlign: "center", paddingTop: isUltra ? "3px" : "4px" }}
              >
                {issueDate}
              </div>
            )}
            {hasValue(persianDateNumeric) && (
              <div
                className={`font-[vazirmatn] font-black text-blue-900 bg-blue-50/90 border border-blue-200/90 rounded-md shadow-2xs ${
                  isUltra
                    ? "text-[11.8pt] px-2 py-0.2 mt-0.5"
                    : isCompact
                    ? "text-[14.5pt] px-2.5 py-0.4 mt-0.5"
                    : "text-[16.0pt] px-3 py-0.5 mt-0.6"
                } leading-tight whitespace-nowrap keep-all text-center inline-flex items-center justify-center`}
                dir="rtl"
                style={{ direction: "rtl", textAlign: "center", backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1e3a8a" }}
              >
                {persianDateNumeric}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TRUCK NUMBER */}
      {hasTruck && (
        <div
          className={`rounded-xl border text-center flex flex-col justify-between overflow-visible ${cardPaddingClass} ${
            pdfMode ? "border-blue-200 bg-white" : "border-blue-200/90 bg-white/95 shadow-xs"
          } min-w-0`}
        >
          <div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0.5 pb-1 mb-0.5 border-b border-blue-100/90">
            <span className={cardHeaderEnClass}>
              TRUCK NUMBER
            </span>
            <span className="text-blue-400 font-bold select-none text-[8.4pt] leading-none">/</span>
            <span
              className={`font-[vazirmatn] ${cardHeaderFaClass}`}
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "isolate" }}
            >
              شماره کامیون / موټر
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center w-full my-auto min-w-0 pt-1.5 pb-0.5">
            <AfghanTruckPlate value={formData.truck_number} size={isUltra ? "sm" : "compact"} className="max-w-full h-auto" />
          </div>
        </div>
      )}

      {/* 3. DRIVER NAME & CONTACT */}
      {hasDriverOrContact && (
        <div
          className={`rounded-xl border text-center flex flex-col justify-between overflow-visible min-w-0 ${cardPaddingClass} ${
            pdfMode ? "border-blue-200 bg-white" : "border-blue-200/90 bg-white/95 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0.5 pb-1 mb-0.5 border-b border-blue-100/90">
            <span className={cardHeaderEnClass}>
              {hasDriver ? "DRIVER NAME" : "DRIVER CONTACT"}
            </span>
            <span className="text-blue-400 font-bold select-none text-[8.4pt] leading-none">/</span>
            <span
              className={`font-[vazirmatn] ${cardHeaderFaClass}`}
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "isolate" }}
            >
              {hasDriver ? "نام راننده" : "تماس راننده"}
            </span>
          </div>
          <div className={`flex-1 flex flex-col items-center justify-center ${valMarginClass} w-full gap-1.5`}>
            {hasDriver && (
              <div
                className={`font-[vazirmatn] font-black text-slate-950 ${
                  isUltra ? "text-[11.2pt]" : isCompact ? "text-[12.5pt]" : "text-[13.8pt]"
                } leading-tight break-words text-center w-full px-0.5`}
                dir="rtl"
                style={{ textAlign: "center", direction: "rtl" }}
              >
                {driverFullInfo}
              </div>
            )}
            {hasContact && (
              <div className={`flex flex-wrap items-center justify-center gap-1.5 w-full ${hasDriver ? (isUltra ? "mt-0.6" : "mt-1") : ""}`}>
                {phones.map((phone, idx) => (
                  <div
                    key={idx}
                    className={`font-mono font-black text-blue-950 ${
                      isUltra
                        ? "text-[9.5pt] py-0.6 px-2.5"
                        : isCompact
                        ? "text-[10.6pt] py-0.8 px-3"
                        : "text-[11.8pt] py-1 px-3.5"
                    } leading-tight tracking-tight bg-gradient-to-r from-blue-50/95 via-sky-50/90 to-blue-50/95 rounded-full border border-blue-300/80 shadow-2xs text-center whitespace-nowrap keep-all direction-ltr unicode-isolate inline-flex items-center justify-center gap-1.5`}
                    dir="ltr"
                    style={{ direction: "ltr", unicodeBidi: "isolate", textAlign: "center" }}
                  >
                    <Phone className={`${isUltra ? "h-2.5 w-2.5" : isCompact ? "h-3 w-3" : "h-3.2 w-3.2"} text-blue-600 shrink-0 inline`} />
                    <span>{phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DRIVER RENT */}
      {hasRent && (
        <div
          className={`rounded-xl border text-center flex flex-col justify-between overflow-visible min-w-0 ${cardPaddingClass} ${
            pdfMode ? "border-blue-200 bg-white" : "border-blue-200/90 bg-white/95 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0.5 pb-1 mb-0.5 border-b border-blue-100/90">
            <span className={cardHeaderEnClass}>
              DRIVER RENT
            </span>
            <span className="text-blue-400 font-bold select-none text-[8.4pt] leading-none">/</span>
            <span
              className={`font-[vazirmatn] ${cardHeaderFaClass}`}
              dir="rtl"
              style={{ direction: "rtl", unicodeBidi: "isolate" }}
            >
              کرایه راننده
            </span>
          </div>
          <div className={`flex-1 flex flex-col items-center justify-center ${valMarginClass} w-full`}>
            {(() => {
              const rawAmt = (rentInfo.amount || formData.driver_rent || "").trim()
              const match = rawAmt.match(/^([0-9,.]+)\s*(.*)$/)
              if (match) {
                const numPart = match[1]
                const currPart = match[2]
                return (
                  <div
                    className="flex items-baseline justify-center gap-1.5 leading-none whitespace-nowrap keep-all text-center"
                    dir="ltr"
                    style={{ direction: "ltr", unicodeBidi: "isolate", textAlign: "center" }}
                  >
                    <span
                      className={`font-mono font-black text-emerald-950 tracking-tight ${
                        isUltra ? "text-[11.5pt] pt-0.5" : isCompact ? "text-[14.2pt] pt-1" : "text-[16pt] pt-1.5"
                      }`}
                      style={{ paddingTop: isUltra ? "3px" : "4px" }}
                    >
                      {numPart}
                    </span>
                    {currPart && (
                      <span
                        className={`font-sans font-black uppercase text-emerald-800 ${
                          isUltra ? "text-[8.5pt]" : isCompact ? "text-[9.5pt]" : "text-[10.5pt]"
                        } tracking-wider`}
                      >
                        {currPart}
                      </span>
                    )}
                  </div>
                )
              }
              return (
                <div
                  className={`font-mono font-black text-emerald-950 ${
                    isUltra ? "text-[11.5pt]" : isCompact ? "text-[14.2pt]" : "text-[16pt]"
                  } leading-tight whitespace-nowrap keep-all text-center direction-ltr unicode-isolate inline-block`}
                  dir="ltr"
                  style={{ direction: "ltr", unicodeBidi: "isolate", textAlign: "center" }}
                >
                  {rawAmt}
                </div>
              )
            })()}
            {rentInfo.note && (
              <div className="flex items-center justify-center w-full mt-1">
                <span
                  className={`inline-flex items-center justify-center font-[vazirmatn] font-black text-emerald-950 bg-emerald-50/95 border border-emerald-300 rounded-full shadow-2xs ${
                    isUltra
                      ? "text-[9.2pt] px-2.5 py-0.4"
                      : isCompact
                      ? "text-[10.2pt] px-3 py-0.5"
                      : "text-[11.2pt] px-3.5 py-0.6"
                  } leading-tight whitespace-nowrap text-center`}
                  dir="rtl"
                  style={{ textAlign: "center", direction: "rtl", backgroundColor: "#ecfdf5", borderColor: "#6ee7b7", color: "#064e3b" }}
                >
                  {rentInfo.note}
                </span>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  )
}



function formatPackagesValue(val?: string | null, densityTier = "normal"): ReactNode {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra
  const text = cleanText(val)
  if (!text) return <span className="font-mono font-bold text-slate-400">—</span>

  const parts = splitMultiCargoItems(text)

  if (parts.length <= 1) {
    const fontCls = getNumericFontClass(text, isUltra ? "text-[10.5pt]" : isCompact ? "text-[12.2pt]" : "text-[13.8pt]")
    return (
      <span className={`font-mono font-black ${fontCls} text-slate-950 text-center leading-snug tracking-tight inline-block`}>
        {text}
      </span>
    )
  }

  const { sum, unit } = parseCargoTotal(parts)
  const maxLen = Math.max(...parts.map((p) => p.length))
  let itemFontClass = isUltra ? "text-[7.2pt]" : "text-[8.8pt]"
  if (parts.length >= 5 || maxLen > 25) {
    itemFontClass = isUltra ? "text-[6.2pt]" : "text-[7.4pt]"
  } else if (parts.length >= 4) {
    itemFontClass = isUltra ? "text-[6.6pt]" : "text-[8pt]"
  } else if (parts.length >= 3 || maxLen > 18) {
    itemFontClass = isUltra ? "text-[6.8pt]" : "text-[8.4pt]"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${isUltra ? "space-y-0.4 py-0.2" : "space-y-0.8 py-0.5"} w-full my-auto`}>
      <div className={`flex flex-col ${isUltra ? "space-y-0.3" : "space-y-0.5"} w-full`}>
        {parts.map((item, idx) => (
          <div
            key={idx}
            className={`w-full text-center ${isUltra ? "px-0.8 py-0.2" : "px-1 py-0.3"} rounded bg-slate-50 border border-slate-200/90 font-mono font-bold text-slate-950 leading-tight tracking-tight whitespace-nowrap keep-all direction-ltr unicode-isolate ${itemFontClass}`}
          >
            {item}
          </div>
        ))}
      </div>
      {sum > 0 && (
        <div className={`w-full ${isUltra ? "pt-0.3 px-1 py-0.2" : "pt-0.5 px-1.5 py-0.3"} border-t border-blue-100 flex items-center justify-center gap-1 bg-blue-50/90 rounded border border-blue-200 shadow-2xs`}>
          <span className={`${isUltra ? "text-[5.6pt]" : "text-[6.8pt]"} font-black text-blue-700 tracking-wider uppercase shrink-0`}>TOTAL:</span>
          <span className={`font-mono font-black ${isUltra ? "text-[8.8pt]" : "text-[10.4pt]"} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate inline-block`}>
            {sum.toLocaleString()} {unit || "CTNS"}
          </span>
        </div>
      )}
    </div>
  )
}

function renderCargoSection({
  labelEn,
  labelFa,
  value,
  theme = "blue",
  densityTier = "normal",
}: {
  labelEn: string
  labelFa: string
  value?: string | null
  theme?: "blue" | "cyan" | "indigo" | "emerald" | "slate"
  densityTier?: "ultra" | "compact" | "normal"
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra
  const text = cleanText(value)
  if (!text) return null

  const parts = splitMultiCargoItems(text)
  const isMulti = parts.length > 1

  const themeStyles = {
    blue: {
      badge: "bg-blue-50/90 text-blue-900 border-blue-200/90",
      fa: "text-blue-700",
      text: "text-blue-950",
    },
    cyan: {
      badge: "bg-cyan-50/90 text-cyan-900 border-cyan-200/90",
      fa: "text-cyan-700",
      text: "text-cyan-950",
    },
    indigo: {
      badge: "bg-indigo-50/90 text-indigo-900 border-indigo-200/90",
      fa: "text-indigo-700",
      text: "text-indigo-950",
    },
    emerald: {
      badge: "bg-emerald-50/90 text-emerald-900 border-emerald-200/90",
      fa: "text-emerald-700",
      text: "text-emerald-950",
    },
    slate: {
      badge: "bg-slate-100/90 text-slate-800 border-slate-200/90",
      fa: "text-slate-600",
      text: "text-slate-900",
    },
  }[theme]

  const singleFontCls = getNumericFontClass(text, isUltra ? "text-[8.4pt]" : "text-[9.8pt]")

  return (
    <div className={`w-full flex flex-col ${isUltra ? "space-y-0.3" : "space-y-0.5"}`}>
      {/* Sub-section Header Badge without cluttering count numbers */}
      <div
        className={`flex items-center justify-between ${
          isUltra ? "text-[5.6pt] px-1 py-0.2" : "text-[6.4pt] px-1.5 py-0.4"
        } font-black uppercase tracking-wider rounded border ${themeStyles.badge}`}
      >
        <span className="truncate">{labelEn}</span>
        <span className={`font-[vazirmatn] ${isUltra ? "text-[5.4pt]" : "text-[6.2pt]"} font-bold ${themeStyles.fa} shrink-0`} dir="rtl">
          {labelFa}
        </span>
      </div>

      {/* Values Stack */}
      <div className={`flex flex-col ${isUltra ? "space-y-0.3 px-0.2" : "space-y-0.5 px-0.5"} w-full`}>
        {isMulti ? (
          parts.map((p, idx) => {
            const multiFontCls = isUltra
              ? (p.length > 18 ? "text-[5.8pt]" : p.length > 14 ? "text-[6.6pt]" : "text-[7.4pt]")
              : (p.length > 18 ? "text-[6.8pt]" : p.length > 14 ? "text-[7.6pt]" : "text-[8.4pt]")
            return (
              <div
                key={idx}
                className={`font-mono font-bold ${multiFontCls} text-slate-900 text-center leading-tight tracking-tight whitespace-nowrap keep-all direction-ltr unicode-isolate inline-block`}
                dir="ltr"
                style={{ direction: "ltr", unicodeBidi: "isolate" }}
              >
                {p}
              </div>
            )
          })
        ) : (
          <div
            className={`font-mono font-black ${singleFontCls} text-center leading-tight whitespace-nowrap keep-all direction-ltr unicode-isolate inline-block ${themeStyles.text} py-0.2`}
            dir="ltr"
            style={{ direction: "ltr", unicodeBidi: "isolate" }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  )
}

function formatMultiCargoValue(val?: string | null, customClass = "text-[9.5pt]"): ReactNode {
  const text = cleanText(val)
  if (!text) return "—"

  const parts = splitMultiCargoItems(text)

  if (parts.length > 1) {
    const maxLen = Math.max(...parts.map((p) => p.length))
    let itemClass = customClass
    if (parts.length >= 5 || maxLen > 25) {
      itemClass = "text-[6.4pt] font-mono font-bold text-slate-900"
    } else if (parts.length >= 3 || maxLen > 22) {
      itemClass = "text-[7.4pt] font-mono font-bold text-slate-900"
    } else if (parts.length === 2 && maxLen > 16) {
      itemClass = "text-[8.2pt] font-mono font-bold text-slate-900"
    }

    return (
      <div className="flex flex-col space-y-0.5 w-full">
        {parts.map((p, idx) => (
          <span key={idx} className={`block leading-tight whitespace-nowrap keep-all direction-ltr unicode-isolate ${itemClass}`} dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
            {p.trim()}
          </span>
        ))}
      </div>
    )
  }

  const singleFontCls = getNumericFontClass(text, customClass)
  return <span className={`font-mono font-black ${singleFontCls} whitespace-nowrap keep-all direction-ltr unicode-isolate leading-tight inline-block`} dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>{text}</span>
}

function CargoRow({
  item,
  itemNumber,
  showIndexBadge,
  densityTier = "normal",
  pdfMode = false,
}: {
  item: SyncedCargoItem
  itemNumber: number
  showIndexBadge: boolean
  densityTier?: "ultra" | "compact" | "normal"
  pdfMode?: boolean
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  const packageQtyFont = isUltra ? "text-[11pt]" : isCompact ? "text-[14pt]" : "text-[16pt]"
  const qtyFont = isUltra ? "text-[9pt]" : isCompact ? "text-[11pt]" : "text-[12.8pt]"
  const commFont = isUltra ? "text-[7.2pt]" : isCompact ? "text-[8.2pt]" : "text-[9.4pt]"
  const valFont = isUltra ? "text-[8.8pt]" : isCompact ? "text-[10.2pt]" : "text-[11.8pt]"
  const subLabelFont = isUltra ? "text-[5.6pt]" : isCompact ? "text-[6.6pt]" : "text-[7.5pt]"

  // Separate quantity from commodity in packageText
  const pkgClean = cleanText(item.packageText)
  const qtyMatch = pkgClean.match(
    /^([\d,]+(?:\.\d+)?\s*(?:CTNS?|CARTONS?|BAGS?|PKGS?|BOXES|PCS|UNITS|ROLLS|DRUMS|KGS?|TONS?|LBS?)?)\s*(.*)$/i
  )
  const qtyPart = qtyMatch && qtyMatch[1] ? qtyMatch[1].trim() : ""
  const commPart = qtyMatch && qtyMatch[1] && qtyMatch[2] ? qtyMatch[2].trim().replace(/^[-–—|:]\s*/, "") : ""

  const cellBoxStyle: CSSProperties = {
    backgroundColor: "#ffffff",
    padding: isUltra ? "1.5px 2px" : isCompact ? "2px 2.5px" : "2.5px 3.5px",
    boxSizing: "border-box",
  }

  const cellMinHeight = isUltra ? "min-h-[24px]" : isCompact ? "min-h-[28px]" : "min-h-[32px]"
  const innerSubRowPad = isUltra ? "px-1 py-[1.5px]" : isCompact ? "px-1.5 py-[2px]" : "px-1.5 py-[2.5px]"
  const innerGap = isUltra ? "gap-[1.5px]" : isCompact ? "gap-[2px]" : "gap-[2.5px]"

  return (
    <div
      className={`grid grid-cols-[minmax(0,23fr)_minmax(0,21fr)_minmax(0,27fr)_minmax(0,29fr)] gap-1 items-stretch break-inside-avoid page-break-inside-avoid w-full box-border ${
        pdfMode ? "bg-white" : ""
      }`}
    >
      {/* 1. NO. OF PACKAGES */}
      <div
        className={`rounded-lg border border-slate-200/90 bg-white flex flex-col items-center justify-center text-center overflow-visible ${commPart ? (isUltra ? "min-h-[38px]" : isCompact ? "min-h-[42px]" : "min-h-[46px]") : cellMinHeight} shadow-2xs`}
        style={cellBoxStyle}
      >
        {qtyPart || commPart || pkgClean ? (
          <div className={`flex flex-col items-center justify-center w-full leading-normal ${isUltra ? "py-0.5" : "py-1"}`}>
            <div className="flex items-center justify-center gap-1 w-full">
              {showIndexBadge && (
                <span className="text-[4.8pt] font-black text-blue-800 bg-blue-50 px-1 py-0.1 rounded border border-blue-200/70 shrink-0">
                  #{itemNumber}
                </span>
              )}
              <span
                className={`font-mono font-black ${commPart ? (isUltra ? "text-[12pt]" : isCompact ? "text-[14pt]" : "text-[16pt]") : packageQtyFont} text-slate-950 whitespace-nowrap keep-all direction-ltr unicode-isolate leading-tight`}
                style={{
                  fontSize: commPart ? (isUltra ? "12pt" : isCompact ? "14pt" : (pdfMode ? "15pt" : "16pt")) : (isUltra ? "13pt" : isCompact ? "15pt" : "18pt"),
                  fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'NotoSans', sans-serif",
                }}
              >
                {qtyPart || pkgClean}
              </span>
            </div>
            {commPart && (
              <span
                className={`font-black ${
                  commPart.length > 22
                    ? (isUltra ? "text-[5.5pt]" : isCompact ? "text-[6.2pt]" : "text-[6.8pt]")
                    : commPart.length > 16
                    ? (isUltra ? "text-[6.5pt]" : isCompact ? "text-[7.2pt]" : "text-[7.8pt]")
                    : commPart.length > 11
                    ? (isUltra ? "text-[7.2pt]" : isCompact ? "text-[8.2pt]" : (pdfMode ? "text-[8.8pt]" : "text-[9.2pt]"))
                    : commPart.length > 7
                    ? (isUltra ? "text-[8.5pt]" : isCompact ? "text-[9.5pt]" : (pdfMode ? "text-[10.2pt]" : "text-[10.8pt]"))
                    : (isUltra ? "text-[9.5pt]" : isCompact ? "text-[10.5pt]" : (pdfMode ? "text-[11.2pt]" : "text-[11.8pt]"))
                } text-blue-900 tracking-tight uppercase text-center mt-1 pt-0.5 max-w-full whitespace-nowrap overflow-hidden text-ellipsis block leading-tight px-0.5`}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block",
                  maxWidth: "100%",
                  fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'NotoSans', sans-serif",
                  fontSize:
                    commPart.length > 22
                      ? (isUltra ? "5.5pt" : isCompact ? "6.2pt" : "6.8pt")
                      : commPart.length > 16
                      ? (isUltra ? "6.5pt" : isCompact ? "7.2pt" : "7.8pt")
                      : commPart.length > 11
                      ? (isUltra ? "7.2pt" : isCompact ? "8.2pt" : (pdfMode ? "8.8pt" : "9.2pt"))
                      : commPart.length > 7
                      ? (isUltra ? "8.5pt" : isCompact ? "9.5pt" : (pdfMode ? "10.2pt" : "10.8pt"))
                      : (isUltra ? "9.5pt" : isCompact ? "10.5pt" : (pdfMode ? "11.2pt" : "11.8pt")),
                  letterSpacing: commPart.length > 10 ? "-0.015em" : "normal",
                }}
                title={commPart}
              >
                {commPart}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 font-bold">—</span>
        )}
      </div>

      {/* 2. WT / CARTON */}
      <div
        className={`rounded-lg border border-slate-200/90 bg-white flex flex-col items-center justify-center overflow-hidden ${cellMinHeight} shadow-2xs`}
        style={cellBoxStyle}
      >
        {hasValue(item.netPerCarton) && hasValue(item.grossPerCarton) ? (
          <div className={`flex flex-col justify-center items-center w-full ${innerGap} my-auto`}>
            <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-blue-50/70 border border-blue-200/80`}>
              <span className={`${subLabelFont} font-black uppercase text-blue-900 whitespace-nowrap keep-all tracking-wider shrink-0`}>NET</span>
              <span className={`font-mono font-black ${valFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
                {formatCartonWeight(item.netPerCarton)}
              </span>
            </div>
            <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-slate-50 border border-slate-200/80`}>
              <span className={`${subLabelFont} font-black uppercase text-slate-700 whitespace-nowrap keep-all tracking-wider shrink-0`}>GROSS</span>
              <span className={`font-mono font-black ${valFont} text-slate-900 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
                {formatCartonWeight(item.grossPerCarton)}
              </span>
            </div>
          </div>
        ) : hasValue(item.netPerCarton) || hasValue(item.grossPerCarton) ? (
          <div className={`flex items-center justify-center w-full ${innerSubRowPad} rounded-md bg-slate-50 border border-slate-200/80 my-auto`}>
            <span className={`font-mono font-black ${qtyFont} text-slate-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
              {formatCartonWeight(item.netPerCarton || item.grossPerCarton)}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-bold my-auto">—</span>
        )}
      </div>

      {/* 3. TOTAL WEIGHTS */}
      <div
        className={`rounded-lg border border-slate-200/90 bg-white flex flex-col items-center justify-center overflow-hidden ${cellMinHeight} shadow-2xs`}
        style={cellBoxStyle}
      >
        {hasValue(item.netWeight) && hasValue(item.grossWeight) ? (
          <div className={`flex flex-col justify-center items-center w-full ${innerGap} my-auto`}>
            <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-blue-50/80 border border-blue-300/80`}>
              <span className={`${subLabelFont} font-black uppercase text-blue-900 whitespace-nowrap keep-all tracking-wider shrink-0`}>NET WT</span>
              <span className={`font-mono font-black ${valFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
                {item.netWeight}
              </span>
            </div>
            <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-slate-50 border border-slate-200/80`}>
              <span className={`${subLabelFont} font-black uppercase text-slate-700 whitespace-nowrap keep-all tracking-wider shrink-0`}>GROSS WT</span>
              <span className={`font-mono font-black ${valFont} text-slate-900 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
                {item.grossWeight}
              </span>
            </div>
          </div>
        ) : hasValue(item.netWeight) || hasValue(item.grossWeight) ? (
          <div className={`flex items-center justify-center w-full ${innerSubRowPad} rounded-md bg-blue-50/70 border border-blue-200/80 my-auto`}>
            <span className={`font-mono font-black ${qtyFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums`}>
              {item.netWeight || item.grossWeight}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 font-bold my-auto">—</span>
        )}
      </div>

      {/* 4. RATE & GOODS VALUE */}
      <div
        className={`rounded-lg border border-slate-200/90 bg-white flex flex-col items-center justify-center overflow-visible ${(hasValue(item.rate) && /\d/.test(item.rate) && hasValue(item.goodsValue) && /\d/.test(item.goodsValue)) ? (isUltra ? "min-h-[38px]" : isCompact ? "min-h-[42px]" : "min-h-[46px]") : cellMinHeight} shadow-2xs`}
        style={cellBoxStyle}
      >
        {(() => {
          const hasRate = hasValue(item.rate) && /\d/.test(item.rate)
          const hasGoodsVal = hasValue(item.goodsValue) && /\d/.test(item.goodsValue)

          // Format bare numeric rate like "2.50" -> "2.50 USD"
          const displayRate = hasRate
            ? /^\s*[$€£]?\s*[\d.,]+\s*$/.test(item.rate.trim())
              ? `${item.rate.trim()} USD`
              : item.rate
            : ""

          if (hasRate && hasGoodsVal) {
            return (
              <div className={`flex flex-col justify-center items-center w-full ${innerGap} my-auto py-0.5`}>
                <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-slate-50 border border-slate-200/80`} style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}>
                  <span className={`${subLabelFont} font-black uppercase text-slate-700 whitespace-nowrap keep-all tracking-wider shrink-0`}>RATE</span>
                  <span className={`font-mono font-black ${valFont} text-slate-900 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right truncate pl-1`} style={{ fontSize: displayRate.length > 9 ? "9.8pt" : undefined }}>
                    {displayRate}
                  </span>
                </div>
                <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-emerald-50/90 border border-emerald-300/90`} style={{ backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" }}>
                  <span className={`${subLabelFont} font-black uppercase text-emerald-800 whitespace-nowrap keep-all tracking-wider shrink-0`}>VALUE</span>
                  <span className={`font-mono font-black ${valFont} text-emerald-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right truncate pl-1`} style={{ fontSize: (item.goodsValue || "").length > 11 ? "9.8pt" : undefined }}>
                    {item.goodsValue}
                  </span>
                </div>
              </div>
            )
          }

          if (hasGoodsVal) {
            return (
              <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-emerald-50/90 border border-emerald-300/90 my-auto`} style={{ backgroundColor: "#ecfdf5", borderColor: "#6ee7b7" }}>
                <span className={`${subLabelFont} font-black uppercase text-emerald-800 whitespace-nowrap keep-all tracking-wider shrink-0`}>VALUE</span>
                <span className={`font-mono font-black ${qtyFont} leading-tight text-emerald-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right pl-1`} style={{ fontSize: (item.goodsValue || "").length > 11 ? "10pt" : undefined }}>
                  {item.goodsValue}
                </span>
              </div>
            )
          }

          if (hasRate) {
            return (
              <div className={`flex items-center justify-between w-full ${innerSubRowPad} rounded-md bg-slate-50 border border-slate-200/80 my-auto`} style={{ backgroundColor: "#f8fafc", borderColor: "#cbd5e1" }}>
                <span className={`${subLabelFont} font-black uppercase text-slate-700 whitespace-nowrap keep-all tracking-wider shrink-0`}>RATE</span>
                <span className={`font-mono font-black ${qtyFont} leading-tight text-slate-900 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right pl-1`} style={{ fontSize: displayRate.length > 9 ? "10pt" : undefined }}>
                  {displayRate}
                </span>
              </div>
            )
          }

          return <span className="text-slate-400 font-bold my-auto">—</span>
        })()}
      </div>
    </div>
  )
}

function CargoTotalsRow({
  totals,
  densityTier = "normal",
  itemCount,
}: {
  totals: CargoTotals
  densityTier?: "ultra" | "compact" | "normal"
  itemCount?: number
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  const totalValFont = isUltra ? "text-[9.8pt]" : isCompact ? "text-[12pt]" : "text-[14pt]"
  const subLabelFont = isUltra ? "text-[6pt]" : isCompact ? "text-[7.2pt]" : "text-[8.2pt]"

  return (
    <div
      className="grid grid-cols-[minmax(0,23fr)_minmax(0,21fr)_minmax(0,27fr)_minmax(0,29fr)] gap-1 items-center rounded-lg border-2 border-blue-400/90 bg-blue-50/95 shadow-2xs mt-0.5 break-inside-avoid page-break-inside-avoid w-full box-border"
      style={{
        backgroundColor: "#f0f7ff",
        backgroundImage: "linear-gradient(90deg, #edf5ff 0%, #f0f7ff 55%, #edfaf2 100%)",
        padding: isUltra ? "1.2px 3px" : "3px 6px",
        boxSizing: "border-box",
      }}
    >
      {/* Col 1 Totals: Packages */}
      <div className="flex items-center justify-center gap-1">
        <span className={`${subLabelFont} font-black text-blue-800 uppercase tracking-wider shrink-0`}>TOTAL:</span>
        <span className={`font-mono font-black ${totalValFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate`}>
          {totals.totalPackages > 0 ? `${totals.totalPackages.toLocaleString()} ${totals.packageUnit}` : "—"}
        </span>
      </div>

      {/* Col 2: Cargo Item Count / Unit */}
      <div className="flex items-center justify-center min-w-0">
        {itemCount && itemCount > 1 ? (
          <span className={`font-mono ${subLabelFont} font-black uppercase text-blue-900 bg-white border border-blue-300 px-1.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap keep-all text-center leading-none`}>
            {itemCount} COMMODITIES
          </span>
        ) : (
          <span className={`${subLabelFont} font-black uppercase text-blue-800/70 tracking-[0.12em] whitespace-nowrap text-center leading-none`}>
            WEIGHT TOTALS
          </span>
        )}
      </div>

      {/* Col 3 Totals: Net & Gross */}
      <div className="flex flex-col items-center justify-center leading-tight">
        <div className={`inline-flex flex-col items-start ${isUltra ? "gap-[0.5px]" : "gap-0.5"}`}>
          {totals.totalNetWeight > 0 && (
            <div className="flex items-center gap-1">
              <span className={`${subLabelFont} font-black text-blue-900 uppercase ${isUltra ? "min-w-[28px]" : "min-w-[38px]"} text-left shrink-0`}>NET:</span>
              <span className={`font-mono font-black ${totalValFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate`}>
                {totals.totalNetWeight.toLocaleString()} {totals.weightUnit}
              </span>
            </div>
          )}
          {totals.totalGrossWeight > 0 && (
            <div className="flex items-center gap-1">
              <span className={`${subLabelFont} font-black text-slate-600 uppercase ${isUltra ? "min-w-[28px]" : "min-w-[38px]"} text-left shrink-0`}>GROSS:</span>
              <span className={`font-mono font-black ${totalValFont} text-slate-800 whitespace-nowrap keep-all direction-ltr unicode-isolate`}>
                {totals.totalGrossWeight.toLocaleString()} {totals.weightUnit}
              </span>
            </div>
          )}
          {totals.totalNetWeight <= 0 && totals.totalGrossWeight <= 0 && (
            <span className="text-slate-400 font-bold">—</span>
          )}
        </div>
      </div>

      {/* Col 4 Totals: Goods Value */}
      <div className="flex items-center justify-center gap-1">
        <span className={`${subLabelFont} font-black text-emerald-800 uppercase tracking-wider shrink-0`}>TOTAL VAL:</span>
        <span className={`font-mono font-black ${totalValFont} text-emerald-950 whitespace-nowrap keep-all direction-ltr unicode-isolate`}>
          {totals.totalGoodsValue > 0
            ? `${totals.totalGoodsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${totals.currency}`
            : "—"}
        </span>
      </div>
    </div>
  )
}

function UnifiedCargoGrid({
  items,
  startIndex = 0,
  totalItemCount,
  showTotals = true,
  totals,
  labels,
  pdfMode = false,
  densityTier = "normal",
  formData,
  isContinuation = false,
}: {
  items: SyncedCargoItem[]
  startIndex?: number
  totalItemCount?: number
  showTotals?: boolean
  totals?: CargoTotals
  labels: Record<string, string>
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
  formData: BillOfLadingFormData
  isContinuation?: boolean
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  const hasContainer = hasValue(formData.container_numbers)
  const hasSeal = hasValue(formData.seal_numbers)
  const hasMeasurement = hasValue(formData.measurement)

  const titleClass = `${
    isUltra ? "text-[5.8pt]" : isCompact ? "text-[6.5pt]" : "text-[7pt]"
  } font-black uppercase tracking-wider leading-tight text-center block w-full whitespace-nowrap overflow-hidden text-ellipsis`
  const faTitleClass = `cargo-header-fa font-[vazirmatn] ${
    isUltra ? "text-[5pt] mt-0" : isCompact ? "text-[5.8pt] mt-0.2" : "text-[6.4pt] mt-0.2"
  } font-extrabold leading-tight text-center block w-full whitespace-nowrap overflow-hidden text-ellipsis`

  const headerCardStyle: CSSProperties = {
    backgroundColor: "#ffffff",
    padding: isUltra ? "0.6mm 1mm 0.5mm 1mm" : isCompact ? "0.8mm 1.2mm 0.6mm 1.2mm" : "1mm 1.5mm 0.8mm 1.5mm",
    boxSizing: "border-box",
  }

  const countForIndex = typeof totalItemCount === "number" ? totalItemCount : items.length

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isUltra ? "1px" : isCompact ? "1.6px" : "2.2px",
      }}
    >
      {/* Top Metadata Badges (Container, Seal, Measurement) - Only on initial section */}
      {!isContinuation && (hasContainer || hasSeal || hasMeasurement) && (
        <div className={`flex flex-wrap items-center ${isUltra ? "gap-1 px-0.2 mb-0.3" : "gap-1.5 px-0.5 mb-0.5"}`}>
          {hasContainer && (
            <div className={`inline-flex items-center gap-1 bg-blue-50/90 text-blue-950 font-mono font-black ${isUltra ? "text-[6.5pt] px-1.5 py-0.2" : "text-[7.2pt] px-2 py-0.3"} rounded-md border border-blue-200 shadow-2xs`}>
              <span className={`text-blue-700 font-black uppercase ${isUltra ? "text-[5.5pt]" : "text-[6pt]"} tracking-wide`}>CONT:</span>
              <span className="tracking-tight">{formData.container_numbers}</span>
            </div>
          )}
          {hasSeal && (
            <div className={`inline-flex items-center gap-1 bg-amber-50/90 text-amber-950 font-mono font-black ${isUltra ? "text-[6.5pt] px-1.5 py-0.2" : "text-[7.2pt] px-2 py-0.3"} rounded-md border border-amber-300 shadow-2xs`}>
              <span className={`text-amber-700 font-black uppercase ${isUltra ? "text-[5.5pt]" : "text-[6pt]"} tracking-wide`}>SEAL:</span>
              <span className="tracking-tight">{formData.seal_numbers}</span>
            </div>
          )}
          {hasMeasurement && (
            <div className={`inline-flex items-center gap-1 bg-slate-50 text-slate-900 font-mono font-black ${isUltra ? "text-[6.5pt] px-1.5 py-0.2" : "text-[7.2pt] px-2 py-0.3"} rounded-md border border-slate-200 shadow-2xs`}>
              <span className={`text-slate-600 font-black uppercase ${isUltra ? "text-[5.5pt]" : "text-[6pt]"} tracking-wide`}>MEASUREMENT:</span>
              <span className="tracking-tight">{formData.measurement}</span>
            </div>
          )}
        </div>
      )}

      {/* Continuation Banner on Page 2 */}
      {isContinuation && (
        <div className="flex items-center justify-between px-2 py-0.8 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 mb-0.5 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-blue-700" />
            <span className="text-[7pt] font-black uppercase tracking-wider whitespace-nowrap shrink-0">CARGO DESCRIPTION — CONTINUED</span>
          </div>
          <span className="font-[vazirmatn] text-[6.2pt] font-bold text-blue-800" dir="rtl">
            ادامه مشخصات کالا و محموله
          </span>
        </div>
      )}

      {/* Synchronized 4-Column Header Row */}
      <div className="grid grid-cols-[minmax(0,23fr)_minmax(0,21fr)_minmax(0,27fr)_minmax(0,29fr)] gap-1 items-stretch w-full box-border mt-1.5">
        {/* 1. NO. OF PACKAGES */}
        <div
          className={`rounded-lg border-t-[2.5px] border-t-blue-700 border-x border-b border-blue-200/90 text-center flex flex-col justify-center items-center overflow-visible ${
            isUltra ? "min-h-[22px]" : isCompact ? "min-h-[26px]" : "min-h-[28px]"
          } shadow-2xs`}
          style={{
            ...headerCardStyle,
            backgroundColor: "#f0f7ff",
            backgroundImage: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
            borderColor: "#93c5fd",
            borderTopColor: "#1d4ed8",
          }}
        >
          <div className={`${titleClass} text-blue-950`}>
            NO. OF PACKAGES
          </div>
          <div
            className={`${faTitleClass} text-blue-700`}
            dir="rtl"
            style={{ textAlign: "center", direction: "rtl", unicodeBidi: "isolate" }}
          >
            {labels.packagesFa || "تعداد بسته"}
          </div>
        </div>

        {/* 2. WT / CARTON */}
        <div
          className={`rounded-lg border-t-[2.5px] border-t-blue-700 border-x border-b border-blue-200/90 text-center flex flex-col justify-center items-center overflow-visible ${
            isUltra ? "min-h-[22px]" : isCompact ? "min-h-[26px]" : "min-h-[28px]"
          } shadow-2xs`}
          style={{
            ...headerCardStyle,
            backgroundColor: "#f0f7ff",
            backgroundImage: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
            borderColor: "#93c5fd",
            borderTopColor: "#1d4ed8",
          }}
        >
          <div className={`${titleClass} text-blue-950`}>
            WT / CARTON
          </div>
          <div
            className={`${faTitleClass} text-blue-700`}
            dir="rtl"
            style={{ textAlign: "center", direction: "rtl", unicodeBidi: "isolate" }}
          >
            وزن فی کارتن
          </div>
        </div>

        {/* 3. TOTAL WEIGHTS */}
        <div
          className={`rounded-lg border-t-[2.5px] border-t-blue-700 border-x border-b border-blue-200/90 text-center flex flex-col justify-center items-center overflow-visible ${
            isUltra ? "min-h-[22px]" : isCompact ? "min-h-[26px]" : "min-h-[28px]"
          } shadow-2xs`}
          style={{
            ...headerCardStyle,
            backgroundColor: "#f0f7ff",
            backgroundImage: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
            borderColor: "#93c5fd",
            borderTopColor: "#1d4ed8",
          }}
        >
          <div className={`${titleClass} text-blue-950`}>
            TOTAL WEIGHTS
          </div>
          <div
            className={`${faTitleClass} text-blue-700`}
            dir="rtl"
            style={{ textAlign: "center", direction: "rtl", unicodeBidi: "isolate" }}
          >
            وزن کل
          </div>
        </div>

        {/* 4. RATE & GOODS VALUE */}
        <div
          className={`rounded-lg border-t-[2.5px] border-t-blue-700 border-x border-b border-blue-200/90 text-center flex flex-col justify-center items-center overflow-visible ${
            isUltra ? "min-h-[22px]" : isCompact ? "min-h-[26px]" : "min-h-[28px]"
          } shadow-2xs`}
          style={{
            ...headerCardStyle,
            backgroundColor: "#f0f7ff",
            backgroundImage: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
            borderColor: "#93c5fd",
            borderTopColor: "#1d4ed8",
          }}
        >
          <div className={`${titleClass} text-blue-950`}>
            RATE & GOODS VALUE
          </div>
          <div
            className={`${faTitleClass} text-blue-700`}
            dir="rtl"
            style={{ textAlign: "center", direction: "rtl", unicodeBidi: "isolate" }}
          >
            نرخ و ارزش کالا
          </div>
        </div>
      </div>

      {/* Synchronized Item Rows */}
      <div className={`flex flex-col ${isUltra ? "gap-0.4 mt-0.4" : isCompact ? "gap-0.6 mt-0.6" : "gap-0.8 mt-0.8"}`}>
        {items.map((item, idx) => (
          <CargoRow
            key={item.id || idx}
            item={item}
            itemNumber={(startIndex || 0) + idx + 1}
            showIndexBadge={countForIndex > 1}
            densityTier={densityTier}
            pdfMode={pdfMode}
          />
        ))}
      </div>

      {/* Shipment Totals Row */}
      {showTotals && totals && (
        <CargoTotalsRow totals={totals} densityTier={densityTier} itemCount={items.length} />
      )}
    </div>
  )
}

function CargoOverview({
  formData,
  labels,
  pdfMode = false,
  densityTier = "normal",
  items,
  startIndex = 0,
  totalItemCount,
  showTotals = true,
  totals,
  isContinuation = false,
}: {
  formData: BillOfLadingFormData
  labels: Record<string, string>
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
  items?: SyncedCargoItem[]
  startIndex?: number
  totalItemCount?: number
  showTotals?: boolean
  totals?: CargoTotals
  isContinuation?: boolean
}) {
  const synced = parseSyncedCargoItems(formData)
  const displayItems = items || synced.items
  const displayTotals = totals || synced.totals
  const count = typeof totalItemCount === "number" ? totalItemCount : synced.items.length

  if (displayItems.length === 0 && !hasValue(formData.container_numbers) && !hasValue(formData.seal_numbers)) {
    return null
  }

  return (
    <UnifiedCargoGrid
      items={displayItems}
      startIndex={startIndex}
      totalItemCount={count}
      showTotals={showTotals}
      totals={displayTotals}
      labels={labels}
      pdfMode={pdfMode}
      densityTier={densityTier}
      formData={formData}
      isContinuation={isContinuation}
    />
  )
}

export interface AuthorizedSignatureBlockProps {
  isUltraCompact?: boolean
  isCompact?: boolean
  pdfMode?: boolean
  pdfExport?: boolean
  isStampActive?: boolean
  toggleStamp?: () => void
  stampConfig: CompanyStampConfig
  companyTitle: string
  labels: Record<string, string>
}

export function AuthorizedSignatureBlock({
  isUltraCompact,
  isCompact,
  pdfMode,
  pdfExport,
  isStampActive,
  toggleStamp,
  stampConfig,
  companyTitle,
  labels,
}: AuthorizedSignatureBlockProps) {
  const fullSignatoryTitle = stampConfig.signatoryTitle || `FOR & ON BEHALF OF: ${companyTitle}`
  const match = fullSignatoryTitle.match(/^(FOR\s*&\s*ON\s*BEHALF\s*OF:?)\s*(.*)$/i)
  const titleLine1 = match ? match[1].trim() : null
  const titleLine2 = match && match[2].trim() ? match[2].trim() : null

  const maxAllowedScale = isUltraCompact ? 1.8 : isCompact ? 2.2 : 2.5
  const rawScale = stampConfig.scale ?? 1.25
  const currentScale = Math.min(maxAllowedScale, Math.max(0.6, rawScale))

  const handleScaleChange = (delta: number) => {
    const next = Math.min(maxAllowedScale, Math.max(0.6, Math.round((currentScale + delta) * 100) / 100))
    saveStoredCompanyStampConfig({ scale: next })
  }

  const handleResetScale = () => {
    saveStoredCompanyStampConfig({ scale: DEFAULT_STAMP_CONFIG.scale || 1.25 })
  }

  return (
    <div
      data-authorized-signature="true"
      className={`relative flex flex-col items-center justify-between w-[58mm] min-w-[50mm] max-w-[64mm] text-center rounded-xl border border-blue-900/15 bg-white/95 backdrop-blur-xs ${
        isUltraCompact ? "p-1 pt-1.2 pb-1" : isCompact ? "p-1.5 pt-1.8 pb-1.5" : "p-2 pt-2.5 pb-2"
      } shadow-xs overflow-visible select-none`}
    >
      {/* Interactive Size Controls (- / + / Reset) - Shown only on preview, omitted in print & PDF */}
      {!pdfMode && !pdfExport && isStampActive && (
        <div
          data-stamp-controls="true"
          className="no-print absolute -top-8 right-0 z-30 flex items-center gap-1 rounded-full bg-slate-900/95 hover:bg-slate-900 px-2.5 py-0.5 text-white shadow-xl backdrop-blur-md border border-white/20 select-none transition-all duration-150"
          title="Adjust Official Stamp & Signature Size"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleScaleChange(-0.05)
            }}
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full hover:bg-white/25 active:scale-90 text-white/90 hover:text-white cursor-pointer transition-all"
            title="Decrease Stamp Size (-5%)"
            aria-label="Decrease Stamp Size"
          >
            <Minus className="h-3 w-3 stroke-[3]" />
          </button>

          <span
            className="font-mono text-[9.5px] font-black tracking-tight px-1 text-sky-300 cursor-default"
            title={`Current Scale: ${Math.round(currentScale * 100)}%`}
          >
            {Math.round(currentScale * 100)}%
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleScaleChange(0.05)
            }}
            className="flex h-4.5 w-4.5 items-center justify-center rounded-full hover:bg-white/25 active:scale-90 text-white/90 hover:text-white cursor-pointer transition-all"
            title="Increase Stamp Size (+5%)"
            aria-label="Increase Stamp Size"
          >
            <Plus className="h-3 w-3 stroke-[3]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              handleResetScale()
            }}
            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/25 active:scale-90 text-slate-300 hover:text-white cursor-pointer transition-all ml-0.5 pl-0.5 border-l border-white/20"
            title="Reset Stamp Size to Default (125%)"
            aria-label="Reset Stamp Size"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Attach Stamp Shortcut Pill when stamp is inactive */}
      {!pdfMode && !pdfExport && !isStampActive && toggleStamp && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            toggleStamp()
          }}
          className="no-print absolute -top-8 right-0 z-30 flex items-center gap-1.5 rounded-full bg-blue-600/90 hover:bg-blue-600 px-2.5 py-1 text-[9px] font-bold text-white shadow-md border border-white/20 select-none cursor-pointer transition-all active:scale-95"
          title="Attach Official Company Stamp & Signature"
        >
          <span>🖋️</span>
          <span>Attach Stamp</span>
        </button>
      )}

      {/* 1. Underlying Signatory Placeholder Chamber (always visible behind stamp or as manual signing area) */}
      <div
        className={`relative w-full ${
          isUltraCompact ? "h-[12mm]" : isCompact ? "h-[15.5mm]" : "h-[19.5mm]"
        } flex items-center justify-center`}
      >
        <span
          className="italic text-slate-400 font-medium tracking-tight select-none"
          style={{ fontSize: isUltraCompact ? "4.4pt" : "5.4pt" }}
        >
          (Authorized Sign & Seal / محل مهر و امضای مجاز)
        </span>
      </div>

      {/* 2. Authentic Physical Ink Stamp & Signature Overlay */}
      {isStampActive && (
        <div
          data-signature-art="true"
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-10"
          style={{
            top: isUltraCompact ? "0mm" : isCompact ? "0.5mm" : "1mm",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-company-stamp-img="true"
            src={stampConfig.dataUrl || COMPANY_STAMP_SIGNATURE_SRC}
            alt="Company Official Stamp & Signature"
            className="w-auto object-contain transition-transform duration-150"
            style={{
              height: isUltraCompact ? "21mm" : isCompact ? "26mm" : "32mm",
              maxWidth: isUltraCompact ? "45mm" : isCompact ? "52mm" : "56mm",
              transform: `scale(${currentScale * (isUltraCompact ? 0.9 : 1.0)}) rotate(${stampConfig.rotation ?? -1.5}deg)`,
              transformOrigin: "center center",
              opacity: stampConfig.opacity ?? 1.0,
              filter: "drop-shadow(0 1.5px 3.5px rgba(20, 50, 120, 0.22)) contrast(1.08)",
              imageRendering: "-webkit-optimize-contrast",
            }}
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.currentTarget
              if (target.src !== COMPANY_STAMP_SIGNATURE_DATA_URL) {
                target.src = COMPANY_STAMP_SIGNATURE_DATA_URL
              }
            }}
          />
        </div>
      )}

      {/* 3. Professional Thin Divider Line */}
      <div className={`w-[88%] mx-auto ${isUltraCompact ? "mt-0.2 mb-0.4" : "mt-0.5 mb-0.8"} border-b border-blue-900/20 shrink-0`} />

      {/* 4. English Authorization Text (Centered & Balanced) */}
      <div
        className="font-black text-blue-950 uppercase tracking-tight leading-tight text-center w-full px-0.5 shrink-0"
        style={{ fontSize: isUltraCompact ? "4.8pt" : isCompact ? "5.4pt" : "6.0pt" }}
      >
        {titleLine1 && titleLine2 ? (
          <>
            <span className="block">{titleLine1}</span>
            <span className={`block ${isUltraCompact ? "mt-0.1" : "mt-0.2"}`}>{titleLine2}</span>
          </>
        ) : (
          <span className="block">{fullSignatoryTitle}</span>
        )}
      </div>

      {/* 5. Persian / Dari Authorization Text (Balanced optical weight) */}
      <p
        className={`font-[vazirmatn] text-blue-900 font-extrabold leading-tight text-center w-full ${isUltraCompact ? "mt-0.1" : "mt-0.4"} shrink-0`}
        dir="rtl"
        style={{
          fontSize: isUltraCompact ? "5.0pt" : isCompact ? "5.4pt" : "5.8pt",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        {stampConfig.signatorySubtitle || labels.companyStampSignFa || "مهر و امضای مجاز شرکت"}
      </p>
    </div>
  )
}

export interface BottomDocumentAreaProps {
  isUltraCompact: boolean
  isCompact: boolean
  pdfMode: boolean
  exportTarget?: boolean
  pdfExport?: boolean
  toggleStamp?: () => void
  isStampActive?: boolean
  stampConfig: CompanyStampConfig
  companyTitle: string
  labels: Record<string, string>
}

export function BottomDocumentArea({
  isUltraCompact,
  isCompact,
  pdfMode,
  pdfExport,
  toggleStamp,
  isStampActive,
  stampConfig,
  companyTitle,
  labels,
}: BottomDocumentAreaProps) {
  return (
    <div
      data-no-break
      data-bottom-document-area="true"
      className={`relative mt-auto mb-1.5 sm:mb-2 flex shrink-0 items-end justify-end w-full px-0.5 ${
        isUltraCompact ? "pt-0.2" : isCompact ? "pt-0.5" : "pt-1"
      }`}
    >
      <AuthorizedSignatureBlock
        isUltraCompact={isUltraCompact}
        isCompact={isCompact}
        pdfMode={pdfMode}
        pdfExport={pdfExport}
        toggleStamp={toggleStamp}
        isStampActive={isStampActive}
        stampConfig={stampConfig}
        companyTitle={companyTitle}
        labels={labels}
      />
    </div>
  )
}

export const SignatureChamber = BottomDocumentArea

function ExecutiveBOLFooter({
  isUltraCompact,
  companyTitle,
  companyTagline,
  companyLicence,
  companyAddressLine,
  companyPhone,
  companyEmail,
  iranOffice,
  pageNumber = 1,
  totalPages = 1,
  bolNumber = "",
}: {
  isUltraCompact: boolean
  companyTitle: string
  companyTagline: string
  companyLicence?: string
  companyAddressLine: string
  companyPhone?: string
  companyEmail?: string
  iranOffice?: string
  pageNumber?: number
  totalPages?: number
  bolNumber?: string
}) {
  const cleanIranOffice = iranOffice
    ? iranOffice.replace(/^(?:(?:IRAN\s+(?:TRANSIT\s+)?OFFICE|TRANSIT\s+OFFICE|IRAN\s+OFFICE|OFFICE)\s*[:\-]\s*)+/gi, "").trim()
    : ""
  const sanitizedCompanyTitle = (companyTitle || "SKY ARIANA LIMITED").replace(/[\r\n\t]+/g, " ").trim()
  companyTitle = sanitizedCompanyTitle

  return (
    <footer
      data-bol-footer="true"
      className={`relative ${isUltraCompact ? "mt-0.5" : "mt-1"} shrink-0 overflow-hidden rounded-lg border border-blue-200/90 bg-gradient-to-r from-blue-50/60 via-white to-sky-50/60 text-slate-800 shadow-2xs`}
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      data-no-break
    >
      {/* Top Accent Stripe */}
      <div className="h-[1.5px] bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

      {/* Tier 1: Corporate Brand, Tagline & Official License Badge */}
      <div
        className={`${isUltraCompact ? "px-2.5 py-1 min-h-[20px]" : "px-3.5 py-1 min-h-[22px]"} flex items-center justify-between gap-2 border-b border-blue-100 bg-white/70 overflow-hidden leading-normal`}
        style={{
          height: isUltraCompact ? "20px" : "22px",
          maxHeight: isUltraCompact ? "20px" : "22px",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          className="flex items-center gap-1.5 min-w-0 shrink overflow-hidden"
          style={{ whiteSpace: "nowrap", overflow: "hidden", flexWrap: "nowrap" }}
        >
          <span
            className={`${isUltraCompact ? "text-[7.4pt]" : "text-[8.2pt]"} font-black uppercase tracking-wider text-blue-950 whitespace-nowrap shrink-0`}
            style={{ whiteSpace: "nowrap", flexShrink: 0, display: "inline-block" }}
          >
            {companyTitle}
          </span>
          <span className="text-blue-400 opacity-70 text-[6pt] shrink-0">•</span>
          <span className={`${isUltraCompact ? "text-[6.2pt]" : "text-[7pt]"} font-bold text-blue-700 truncate min-w-0`}>
            {companyTagline}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          {totalPages > 1 && (
            <div className={`flex items-center gap-1 bg-blue-100/70 text-blue-900 border border-blue-300 rounded-full ${isUltraCompact ? "px-2 py-0.5 text-[4.6pt]" : "px-2.5 py-0.5 text-[5.1pt]"} font-mono font-black tracking-wider shadow-2xs`}>
              <span>PAGE {pageNumber || 1} OF {totalPages}</span>
            </div>
          )}
          {companyLicence && (
            <div className={`flex items-center gap-1 bg-amber-50/90 text-amber-900 border border-amber-300/80 rounded-full ${isUltraCompact ? "px-2 py-0.5 text-[4.8pt]" : "px-2.5 py-0.5 text-[5.2pt]"} font-mono font-black tracking-wider shadow-2xs`}>
              <ShieldCheck className="w-2.5 h-2.5 text-amber-600 shrink-0" />
              <span>GOVT LICENCE NO: {companyLicence}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier 2: Well-Spaced 3-Column Operations & Contact Grid */}
      <div className={`${isUltraCompact ? "px-2.5 py-1.5 gap-2" : "px-3.5 py-2 gap-2.5"} grid grid-cols-12 items-start bg-white/95`}>
        {/* Registered HQ Address - 6 Cols */}
        <div className="col-span-6 flex items-start gap-1.5 text-left">
          <div className="w-[17px] h-[17px] min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center bg-blue-50 border border-blue-200/90 text-blue-600 shrink-0 mt-0.5 shadow-2xs">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={`${isUltraCompact ? "text-[4.6pt]" : "text-[5.1pt]"} text-blue-800 uppercase font-mono font-black tracking-wider whitespace-nowrap`}>HEAD OFFICE:</span>
            <span className={`${isUltraCompact ? "text-[5.8pt]" : "text-[6.4pt]"} leading-[1.2] text-slate-900 font-bold break-words`}>{companyAddressLine}</span>
          </div>
        </div>

        {/* Direct Dispatch & Operations Phone - 3 Cols */}
        <div className="col-span-3 flex items-start gap-1.5 font-mono text-left">
          <div className="w-[17px] h-[17px] min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-200/90 text-emerald-600 shrink-0 mt-0.5 shadow-2xs">
            <Phone className="w-2.5 h-2.5 shrink-0" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`${isUltraCompact ? "text-[4.6pt]" : "text-[5.1pt]"} text-emerald-800 uppercase font-sans font-black tracking-wider whitespace-nowrap`}>DIRECT DISPATCH:</span>
            <span className={`text-emerald-950 font-black ${isUltraCompact ? "text-[5.6pt]" : "text-[6.2pt]"} whitespace-nowrap`}>{companyPhone || "+93 700 939 365, +93 711 435 529"}</span>
          </div>
        </div>

        {/* Official Web & Correspondence - 3 Cols */}
        <div className="col-span-3 flex items-start gap-1.5 font-mono text-left">
          <div className="w-[17px] h-[17px] min-w-[17px] min-h-[17px] rounded-full flex items-center justify-center bg-sky-50 border border-sky-200/90 text-sky-600 shrink-0 mt-0.5 shadow-2xs">
            <Globe className="w-2.5 h-2.5 shrink-0" />
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className={`text-blue-950 font-black ${isUltraCompact ? "text-[5.6pt]" : "text-[6.2pt]"} whitespace-nowrap`}>www.skyariana.com</span>
            <span className={`text-slate-600 font-bold ${isUltraCompact ? "text-[4.8pt]" : "text-[5.4pt]"} truncate`}>{companyEmail || "transport@skyariana.com"}</span>
          </div>
        </div>
      </div>

      {/* Tier 3: Legal Non-Negotiability Notice & Official Jurisdiction Bar */}
      <div className={`${isUltraCompact ? "px-2.5 py-1 mt-0.5" : "px-3.5 py-1 mt-0.5"} flex items-center justify-between gap-2.5 bg-gradient-to-r from-blue-100/70 via-sky-50/80 to-blue-100/70 border-t border-blue-200/70 ${isUltraCompact ? "text-[4.4pt]" : "text-[4.9pt]"} font-semibold text-slate-700`}>
        <div className="flex items-center gap-1 text-left truncate min-w-0">
          {cleanIranOffice && (
            <span className="text-amber-800 font-bold truncate">IRAN TRANSIT OFFICE: {cleanIranOffice}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 pl-1">
          <span className={`font-[vazirmatn] text-blue-950 font-black ${isUltraCompact ? "text-[4.6pt]" : "text-[5.2pt]"} leading-none text-right whitespace-nowrap`} dir="rtl">
            سند رسمی، معتبر و قابل استناد حمل و نقل بین‌المللی شرکت اسکای آریانا لیمیتد
          </span>
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
        </div>
      </div>

      {/* Tier 4: Document Verification Barcode & Logistics Security Strip */}
      <div
        data-bol-barcode-tier="true"
        className={`${
          isUltraCompact ? "px-2.5 py-0.5" : "px-3.5 py-1"
        } flex items-center justify-between gap-2 bg-white/95 border-t border-blue-200/80 overflow-hidden`}
        style={{
          boxSizing: "border-box",
        }}
      >
        <div className="flex items-center gap-1 font-mono text-[4.6pt] sm:text-[5pt] font-bold text-slate-600 uppercase tracking-wider shrink-0">
          <span className="text-blue-900 font-black">CARRIER: SKY-AF</span>
          <span className="text-blue-300">•</span>
          <span>ORIGINAL B/L</span>
        </div>

        <div className="flex flex-col items-center justify-center shrink-0">
          <Barcode128
            value={bolNumber || "BOL-2026-SKY"}
            height={isUltraCompact ? 16 : 20}
            showText={true}
            textClassName={isUltraCompact ? "text-[5pt]" : "text-[5.8pt]"}
            maxWidth={isUltraCompact ? "160px" : "190px"}
          />
        </div>

        <div className="flex items-center gap-1 font-mono text-[4.6pt] sm:text-[5pt] font-bold text-slate-600 uppercase tracking-wider shrink-0">
          <span className="text-emerald-700 font-black">AUTHENTIC DOCUMENT</span>
          <span className="text-emerald-300">•</span>
          <span className="text-slate-700">ELECTRONIC TRACKING</span>
        </div>
      </div>
    </footer>
  )
}

function ShippingOverview({
  formData,
  labels,
  pdfMode = false,
  densityTier = "normal",
}: {
  formData: BillOfLadingFormData
  labels: Record<string, string>
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra

  const routePOL = formData.routes && formData.routes.length > 0
    ? (formData.routes.find((r) => r.transportMode === "vessel" || /port|بندر/i.test(r.location))?.location || formData.routes[0]?.location)
    : undefined
  const routePOD = formData.routes && formData.routes.length > 1
    ? (formData.routes.slice().reverse().find((r) => r.transportMode === "vessel" || /port|بندر/i.test(r.location))?.location || formData.routes[formData.routes.length - 1]?.location)
    : undefined
  const routePODelivery = formData.routes && formData.routes.length > 0
    ? formData.routes[formData.routes.length - 1]?.location
    : undefined

  const effectiveLoading = formData.port_of_loading || routePOL
  const effectiveDischarge = formData.port_of_discharge || (routePOD !== routePOL ? routePOD : undefined)
  const effectiveDelivery = formData.place_of_delivery || routePODelivery

  const hasLoading = hasValue(effectiveLoading)
  const hasDischarge = hasValue(effectiveDischarge)
  const hasDelivery = hasValue(effectiveDelivery)
  const hasVessel = hasValue(formData.vessel_name) || hasValue(formData.voyage_number)
  const hasFreight = hasValue(formData.freight_payable_at) || hasValue(formData.freight_terms)

  const vesselVoyageText = [
    formData.vessel_name ? `Vessel: ${formData.vessel_name}` : "",
    formData.voyage_number ? `Voy: ${formData.voyage_number}` : "",
  ].filter(Boolean).join(" / ")

  const freightText = [
    formData.freight_payable_at ? `Payable: ${formData.freight_payable_at}` : "",
    formData.freight_terms ? `Terms: ${formData.freight_terms}` : "",
  ].filter(Boolean).join(" | ")

  const items = [
    hasLoading && {
      title: "PORT OF LOADING",
      subtitle: labels.portOfLoadingFa || "بندر بارگیری",
      icon: "⚓",
      value: effectiveLoading,
      color: "text-blue-900",
      bg: "bg-blue-50/80",
    },
    hasDischarge && {
      title: "PORT OF DISCHARGE",
      subtitle: labels.portOfDischargeFa || "بندر تخلیه",
      icon: "🚢",
      value: effectiveDischarge,
      color: "text-indigo-900",
      bg: "bg-indigo-50/80",
    },
    hasDelivery && {
      title: "PLACE OF DELIVERY",
      subtitle: labels.placeOfDeliveryFa || "محل تحویل",
      icon: "📍",
      value: effectiveDelivery,
      color: "text-emerald-900",
      bg: "bg-emerald-50/80",
    },
    hasVessel && {
      title: "VESSEL / VOYAGE",
      subtitle: labels.vesselVoyageFa || "کشتی و سفر",
      icon: "🛥️",
      value: vesselVoyageText,
      color: "text-cyan-900",
      bg: "bg-cyan-50/80",
    },
    hasFreight && {
      title: "FREIGHT CHARGES",
      subtitle: labels.freightPayableFa || "پرداخت کرایه",
      icon: "💳",
      value: freightText,
      color: "text-slate-900",
      bg: "bg-slate-50/80",
    },
  ].filter(Boolean) as Array<{
    title: string
    subtitle: string
    icon: string
    value: string
    color: string
    bg: string
  }>

  if (items.length === 0) return null

  return (
    <div
      className={`grid gap-1 ${
        items.length >= 5 ? "grid-cols-5" :
        items.length === 4 ? "grid-cols-4" :
        items.length === 3 ? "grid-cols-3" :
        items.length === 2 ? "grid-cols-2" : "grid-cols-1"
      }`}
      dir="ltr"
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`rounded-lg border ${isUltra ? "px-1.5 pt-1 pb-1.5 min-h-[40px] gap-0.5" : "px-2 pt-1.5 pb-2 min-h-[46px] gap-1"} text-center flex flex-col justify-between ${
            pdfMode ? "border-blue-100 bg-white" : "border-blue-100/90 bg-white/95 shadow-2xs shadow-blue-100/50"
          }`}
        >
          <div>
            <div className="flex items-center justify-center gap-1">
              <span className={`${isUltra ? "text-[6.5pt]" : "text-[7.5pt]"} leading-none`}>{item.icon}</span>
              <span className={`${isUltra ? "text-[5.0pt]" : "text-[5.6pt]"} font-black uppercase tracking-wider text-blue-800 leading-tight`}>
                {item.title}
              </span>
            </div>
            <div className={`persian-text bol-persian-text font-[vazirmatn] ${isUltra ? "text-[4.6pt]" : "text-[5.2pt]"} font-bold text-blue-600 leading-snug mt-0.5`} dir="rtl">
              {item.subtitle}
            </div>
          </div>
          <div className={`${isUltra ? "mt-auto pt-0.5 pb-0.5 text-[6.5pt]" : "mt-auto pt-1 pb-0.5 text-[7.2pt]"} font-sans font-black text-slate-950 leading-tight break-words px-0.5`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

interface ParsedCargoMetaItem {
  label?: string
  value: string
  isRTL?: boolean
  type?: 'transit_date' | 'invoice' | 'hs_code' | 'tc_no' | 'general'
}

interface ParsedCargoItemLine {
  text: string
  isRTL?: boolean
}

function parseCargoDescription(text: string): {
  metaLines: ParsedCargoMetaItem[]
  itemLines: ParsedCargoItemLine[]
  totalLines: number
} {
  if (!text) return { metaLines: [], itemLines: [], totalLines: 0 }

  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean)
  const segments: string[] = []

  for (const line of rawLines) {
    if (
      /^(?:📦\s*)?(?:container\s*&\s*cargo\s*(?:particulars|details)|document\s*&\s*shipping\s*details|export\s*cargo\s*&\s*container\s*specifications|مشخصات\s*و\s*تفکیک\s*محموله)[\s:│|]*$/i.test(
        line
      )
    ) {
      continue
    }

    const parts = line.split(/[│|;]/).map((p) => p.trim()).filter(Boolean)
    segments.push(...parts)
  }

  const metaLines: ParsedCargoMetaItem[] = []
  const itemLines: ParsedCargoItemLine[] = []

  for (const rawSeg of segments) {
    let seg = rawSeg.replace(/^[•\-\*🥬📦📄🧾📅🏷️\s]+/, "").trim()
    if (!seg) continue

    if (
      /^(?:container\s*&\s*cargo\s*(?:particulars|details)|document\s*&\s*shipping\s*details|export\s*cargo\s*&\s*container\s*specifications|مشخصات\s*و\s*تفکیک\s*محموله)/i.test(
        seg
      )
    ) {
      continue
    }

    // 1. Transit Date
    const transitMatch = seg.match(/^(?:transit\s*date|trans\s*date|date)[\s:_–—]+(.+)$/i)
    if (transitMatch) {
      metaLines.push({
        label: "TRANSIT DATE",
        value: transitMatch[1].trim(),
        type: "transit_date",
        isRTL: false,
      })
      continue
    }

    // 2. Invoice
    const invMatch = seg.match(/^(?:invoice\s*no|inv\s*no|invoice|inv)[\s:_–—]+(.+)$/i)
    if (invMatch) {
      const val = invMatch[1].trim()
      metaLines.push({
        label: "INVOICE",
        value: /^INV/i.test(val) ? val : `INV-${val}`,
        type: "invoice",
        isRTL: false,
      })
      continue
    }
    if (/^INV-[\w\-]+/i.test(seg)) {
      metaLines.push({
        label: "INVOICE",
        value: seg,
        type: "invoice",
        isRTL: false,
      })
      continue
    }

    // 3. HS Code
    const hsMatch = seg.match(/^(?:hs\s*code|hscode|customs\s*code)[\s:_–—]+(.+)$/i)
    if (hsMatch) {
      metaLines.push({
        label: "HS CODE",
        value: hsMatch[1].trim(),
        type: "hs_code",
        isRTL: false,
      })
      continue
    }

    // 4. Afghan Transit Certificate
    const tcMatch = seg.match(/^(?:afghan\s*transit\s*tc\s*no|afghan\s*tc\s*no|tc\s*no|tc)[\s:_–—]+(.+)$/i)
    if (tcMatch) {
      const val = tcMatch[1].trim()
      metaLines.push({
        label: "AFGHAN TC",
        value: /^TC/i.test(val) ? val : `TC-${val}`,
        type: "tc_no",
        isRTL: false,
      })
      continue
    }
    if (/^TC-[\w\-]+/i.test(seg)) {
      metaLines.push({
        label: "AFGHAN TC",
        value: seg,
        type: "tc_no",
        isRTL: false,
      })
      continue
    }

    // 5. Strip commodity / description label prefix if user included "Description:" or "Cargo:"
    const descMatch = seg.match(/^(?:description|cargo|commodity|goods)[\s:_–—]*(.*)$/i)
    if (descMatch) {
      const rem = descMatch[1].trim()
      if (!rem) continue // was only "Description: " without content
      seg = rem
    }

    // 6. Generic colon metadata check
    const colonIdx = seg.indexOf(":")
    if (colonIdx > 0 && colonIdx <= 20) {
      const potentialLabel = seg.slice(0, colonIdx).trim()
      const potentialVal = seg.slice(colonIdx + 1).trim()
      if (
        /^(container|seal|truck|driver|port|place|remarks)$/i.test(potentialLabel) ||
        hasRTLText(potentialLabel)
      ) {
        if (potentialVal) {
          metaLines.push({
            label: potentialLabel.toUpperCase(),
            value: potentialVal,
            isRTL: hasRTLText(potentialLabel) || hasRTLText(potentialVal),
            type: "general",
          })
          continue
        }
      }
    }

    // Otherwise, this is a cargo item description
    itemLines.push({
      text: seg,
      isRTL: hasRTLText(seg),
    })
  }

  return { metaLines, itemLines, totalLines: segments.length }
}

function CargoDescriptionBlock({
  cleanedCargoDesc,
  pdfMode = false,
  densityTier = "normal",
  labels,
  cargoItems = [],
}: {
  cleanedCargoDesc: string
  pdfMode?: boolean
  densityTier?: "ultra" | "compact" | "normal"
  labels: Record<string, string>
  cargoItems?: SyncedCargoItem[]
}) {
  if (!cleanedCargoDesc && (!cargoItems || cargoItems.length === 0)) return null

  const isUltra = densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra
  const { metaLines, itemLines } = parseCargoDescription(cleanedCargoDesc)

  // Ensure commodities and goods descriptions are prominently displayed in Description of Goods
  const displayItemLines = useMemo(() => {
    // 1. If explicit itemLines exist from cargo_description, display them directly (never suppress user's goods description!)
    if (itemLines.length > 0) {
      return itemLines
    }

    if (!cargoItems || cargoItems.length === 0) return []

    // 2. Synthesize items from cargoItems if no explicit itemLines were provided in cargo description
    const synthesized: { text: string; isRTL: boolean }[] = []
    for (const item of cargoItems) {
      const pkgClean = cleanText(item.packageText)
      const qtyMatch = pkgClean.match(
        /^([\d,]+(?:\.\d+)?\s*(?:CTNS?|CARTONS?|BAGS?|PKGS?|BOXES|PCS|UNITS|ROLLS|DRUMS|KGS?|TONS?|LBS?)?)\s*(.*)$/i
      )
      const commPart = qtyMatch && qtyMatch[1] && qtyMatch[2] ? qtyMatch[2].trim().replace(/^[-–—|:]\s*/, "") : ""
      const textToDisplay = commPart || pkgClean
      if (textToDisplay && !synthesized.some((s) => s.text.toLowerCase() === textToDisplay.toLowerCase())) {
        synthesized.push({
          text: textToDisplay,
          isRTL: hasRTLText(textToDisplay),
        })
      }
    }
    return synthesized
  }, [itemLines, cargoItems])

  if (metaLines.length === 0 && displayItemLines.length === 0) return null

  const renderMetaChip = (
    meta: ParsedCargoMetaItem,
    idx: number
  ) => {
    const isTransitDate = meta.type === "transit_date" || /date/i.test(meta.label || "")
    const isInvoice = meta.type === "invoice" || /inv/i.test(meta.label || "")
    const isTc = meta.type === "tc_no" || /tc/i.test(meta.label || "")
    const isHs = meta.type === "hs_code" || /hs/i.test(meta.label || "")

    const chipTheme = isTransitDate
      ? {
          border: "border-blue-200/90",
          bg: "bg-blue-50/95",
          labelColor: "text-blue-700",
          valColor: "text-blue-950",
          icon: <CalendarDays className={`${isUltra ? "h-2.5 w-2.5" : "h-3 w-3"} text-blue-600 shrink-0`} />,
        }
      : isInvoice
      ? {
          border: "border-emerald-200/90",
          bg: "bg-emerald-50/95",
          labelColor: "text-emerald-700",
          valColor: "text-emerald-950",
          icon: <Receipt className={`${isUltra ? "h-2.5 w-2.5" : "h-3 w-3"} text-emerald-600 shrink-0`} />,
        }
      : isTc
      ? {
          border: "border-purple-200/90",
          bg: "bg-purple-50/95",
          labelColor: "text-purple-700",
          valColor: "text-purple-950",
          icon: <ShieldCheck className={`${isUltra ? "h-2.5 w-2.5" : "h-3 w-3"} text-purple-600 shrink-0`} />,
        }
      : isHs
      ? {
          border: "border-amber-200/90",
          bg: "bg-amber-50/95",
          labelColor: "text-amber-700",
          valColor: "text-amber-950",
          icon: <FileText className={`${isUltra ? "h-2.5 w-2.5" : "h-3 w-3"} text-amber-600 shrink-0`} />,
        }
      : {
          border: "border-slate-200/90",
          bg: "bg-slate-50/95",
          labelColor: "text-slate-700",
          valColor: "text-slate-950",
          icon: <FileText className={`${isUltra ? "h-2.5 w-2.5" : "h-3 w-3"} text-slate-500 shrink-0`} />,
        }

    return (
      <div
        key={idx}
        className={`inline-flex items-center gap-1 rounded-md border ${chipTheme.border} ${chipTheme.bg} ${
          isUltra ? "px-1.5 py-0.5" : isCompact ? "px-2 py-0.5" : "px-2.5 py-0.5"
        } leading-tight shadow-2xs`}
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {chipTheme.icon}
        {meta.label && (
          <span
            className={`${chipTheme.labelColor} font-black uppercase ${
              isUltra ? "text-[6.2pt]" : isCompact ? "text-[7pt]" : "text-[8pt]"
            } tracking-wider shrink-0`}
          >
            {meta.label}:
          </span>
        )}
        <span
          className={`font-black ${
            isUltra ? "text-[8.4pt]" : isCompact ? "text-[9.2pt]" : "text-[10.0pt]"
          } ${chipTheme.valColor} tracking-tight whitespace-nowrap direction-ltr unicode-isolate`}
          dir="ltr"
          style={{
            direction: "ltr",
            unicodeBidi: "isolate",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {meta.value}
        </span>
      </div>
    )
  }

  // When only metadata exists, render an ultra-sleek, compact single-row ribbon to fit screen perfectly
  if (displayItemLines.length === 0) {
    return (
      <div
        className={`rounded-lg border-1.5 border-blue-300 shadow-sm ${
          isUltra ? "mt-1 px-2.5 py-0.5" : isCompact ? "mt-1.5 px-3 py-1" : "mt-2 px-3.5 py-1.5"
        } flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap`}
        style={{ background: "#ffffff" }}
      >
        {/* Header Left Title */}
        <div className="flex items-center gap-1.5 shrink-0">
          <FileText className={`${isUltra ? "h-2.5 w-2.5" : "h-3.2 w-3.2"} text-blue-600 shrink-0`} />
          <p className={`${isUltra ? "text-[8.2pt]" : isCompact ? "text-[9.0pt]" : "text-[9.8pt]"} font-black uppercase tracking-wider text-blue-950 leading-tight whitespace-nowrap shrink-0`}>
            Description of Goods
          </p>
        </div>

        {/* Center: Meta Chips */}
        {metaLines.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 min-w-0 justify-center">
            {metaLines.map((meta, idx) => renderMetaChip(meta, idx))}
          </div>
        )}

        {/* Header Right Persian Title */}
        <p
          className={`font-[vazirmatn] ${isUltra ? "text-[8.5pt]" : isCompact ? "text-[9.4pt]" : "text-[10.2pt]"} font-black text-blue-900 leading-tight whitespace-nowrap shrink-0`}
          dir="rtl"
          style={{ direction: "rtl", unicodeBidi: "isolate", letterSpacing: "normal" }}
        >
          {labels.goodsDescriptionFa || "شرح کالا"}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border-1.5 border-blue-300 shadow-sm ${
        isUltra ? "mt-1 p-1.5" : isCompact ? "mt-1.5 p-2" : "mt-2 p-2.5"
      }`}
      style={{ background: "#ffffff" }}
    >
      {/* Header bar with balanced optical scaling */}
      <div className={`mb-1 flex items-center justify-between gap-1 text-blue-900 border-b border-blue-100 ${isUltra ? "pb-0.5" : "pb-1"}`}>
        <div className="flex items-center gap-1.5 shrink-0">
          <FileText className={`${isUltra ? "h-2.5 w-2.5" : "h-3.2 w-3.2"} text-blue-600 shrink-0`} />
          <p className={`${isUltra ? "text-[8.2pt]" : isCompact ? "text-[9.0pt]" : "text-[9.8pt]"} font-black uppercase tracking-wider text-blue-950 leading-tight whitespace-nowrap shrink-0`}>
            Description of Goods
          </p>
        </div>
        <p
          className={`font-[vazirmatn] ${isUltra ? "text-[8.5pt]" : isCompact ? "text-[9.4pt]" : "text-[10.2pt]"} font-black text-blue-900 leading-tight whitespace-nowrap shrink-0`}
          dir="rtl"
          style={{ direction: "rtl", unicodeBidi: "isolate", letterSpacing: "normal" }}
        >
          {labels.goodsDescriptionFa || "شرح کالا"}
        </p>
      </div>

      {/* Unified Single-Line Flow: When 1 item exists (e.g. Transit Date + Invoice + Cargo Item), render side-by-side in one line */}
      {displayItemLines.length === 1 ? (
        <div className={`flex items-center ${isUltra ? "gap-1" : "gap-1.5"} w-full flex-wrap sm:flex-nowrap pt-0.5`}>
          {metaLines.map((meta, idx) => renderMetaChip(meta, idx))}
          {displayItemLines.map((item, idx) => {
            const fontClass =
              displayItemLines.length >= 8 || isUltra
                ? "text-[8.6pt]"
                : displayItemLines.length >= 5
                ? "text-[9.4pt]"
                : isCompact
                ? "text-[10.0pt]"
                : "text-[10.5pt]"

            // Parse rate if present (e.g. "@ 3.50 $" or "@3.50$")
            const atMatch = item.text.match(/^(.+?)\s*(@\s*[$€£AFN]*\s*[\d,]+(?:\.\d+)?\s*[$€£AFN]*)\s*$/i)
            const mainText = atMatch ? atMatch[1].trim() : item.text
            const rateText = atMatch ? atMatch[2].trim() : null

            return (
              <div
                key={idx}
                className={`rounded-lg bg-white/90 border border-blue-100/90 ${
                  isUltra ? "px-1.5 py-0.5" : isCompact ? "px-2 py-0.5" : "px-3 py-1"
                } flex items-center justify-between gap-1.5 shadow-2xs overflow-hidden flex-1 min-w-[200px]`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    <Package className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <span
                    className={`${
                      item.isRTL
                        ? "font-[vazirmatn] text-right font-extrabold text-slate-900"
                        : "font-black text-slate-950 text-left direction-ltr unicode-isolate"
                    } ${fontClass} leading-snug tracking-tight break-words whitespace-normal`}
                    dir={item.isRTL ? "rtl" : "ltr"}
                    style={{
                      direction: item.isRTL ? "rtl" : "ltr",
                      unicodeBidi: "isolate",
                      fontFamily: item.isRTL
                        ? undefined
                        : "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    }}
                  >
                    {mainText}
                  </span>
                </div>
                {rateText && (
                  <span
                    className={`font-black text-emerald-900 bg-emerald-100/90 rounded border border-emerald-300/80 shrink-0 whitespace-nowrap shadow-2xs ${
                      isUltra ? "px-2 py-0.6 text-[8.0pt]" : isCompact ? "px-2.5 py-0.8 text-[8.8pt]" : "px-3 py-1 text-[9.5pt]"
                    }`}
                    style={{
                      fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                    }}
                  >
                    {formatCargoRate(rateText)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <>
          {/* Meta Chips Row */}
          {metaLines.length > 0 && (
            <div className={`flex flex-wrap items-center ${isUltra ? "gap-1" : "gap-1.5"} mb-1.5 pt-0.5`}>
              {metaLines.map((meta, idx) => renderMetaChip(meta, idx))}
            </div>
          )}

          {/* Item Cards (Multi-Item Grid) */}
          {displayItemLines.length > 0 && (
            <div
              className={`grid ${
                displayItemLines.length === 2
                  ? "grid-cols-2"
                  : displayItemLines.length === 3
                  ? "grid-cols-3"
                  : displayItemLines.length === 4
                  ? "grid-cols-2"
                  : displayItemLines.length <= 6
                  ? "grid-cols-3"
                  : "grid-cols-2"
              } ${isUltra ? "gap-0.5" : "gap-1"}`}
            >
              {displayItemLines.map((item, idx) => {
                const fontClass =
                  displayItemLines.length >= 8 || isUltra
                    ? "text-[8.6pt]"
                    : displayItemLines.length >= 5
                    ? "text-[9.4pt]"
                    : isCompact
                    ? "text-[10.0pt]"
                    : "text-[10.5pt]"

                // Parse rate if present (e.g. "@ 3.50 $" or "@3.50$")
                const atMatch = item.text.match(/^(.+?)\s*(@\s*[$€£AFN]*\s*[\d,]+(?:\.\d+)?\s*[$€£AFN]*)\s*$/i)
                const mainText = atMatch ? atMatch[1].trim() : item.text
                const rateText = atMatch ? atMatch[2].trim() : null

                return (
                  <div
                    key={idx}
                    className={`rounded-lg bg-white/90 border border-blue-100/90 ${
                      isUltra ? "px-1.5 py-0.5" : isCompact ? "px-2 py-0.5" : "px-3 py-1"
                    } flex items-center justify-between gap-1.5 shadow-2xs overflow-hidden`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[5.8pt] font-black text-blue-900 bg-blue-100/80 px-1.2 py-0.2 rounded border border-blue-200 shrink-0 shadow-2xs">
                        #{idx + 1}
                      </span>
                      <span
                        className={`${
                          item.isRTL
                            ? "font-[vazirmatn] text-right font-extrabold text-slate-900"
                            : "font-black text-slate-950 text-left direction-ltr unicode-isolate"
                        } ${fontClass} leading-snug tracking-tight break-words whitespace-normal`}
                        dir={item.isRTL ? "rtl" : "ltr"}
                        style={{
                          direction: item.isRTL ? "rtl" : "ltr",
                          unicodeBidi: "isolate",
                          fontFamily: item.isRTL
                            ? undefined
                            : "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                        }}
                      >
                        {mainText}
                      </span>
                    </div>
                    {rateText && (
                      <span
                        className={`font-black text-emerald-900 bg-emerald-100/90 rounded border border-emerald-300/80 shrink-0 whitespace-nowrap shadow-2xs ${
                          isUltra ? "px-2 py-0.6 text-[8.0pt]" : isCompact ? "px-2.5 py-0.8 text-[8.8pt]" : "px-3 py-1 text-[9.5pt]"
                        }`}
                        style={{
                          fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                        }}
                      >
                        {formatCargoRate(rateText)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BackgroundWatermark({
  backgroundImageUrl,
  backgroundOpacity = 0.11,
  pdfMode = false,
}: {
  backgroundImageUrl?: string
  backgroundOpacity?: number
  pdfMode?: boolean
}) {
  if (!backgroundImageUrl) return null
  const opacity = Math.max(
    0.01,
    Math.min(0.4, typeof backgroundOpacity === "number" && !isNaN(backgroundOpacity) ? backgroundOpacity : 0.11)
  )

  return (
    <div
      data-bol-watermark="true"
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        backgroundImage: `url('${backgroundImageUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        opacity,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
      aria-hidden="true"
    >
      <img
        src={backgroundImageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{
          filter: "contrast(1.02) brightness(1.02)",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
        loading="eager"
      />
    </div>
  )
}

function Page1Header({
  pdfMode,
  isUltraCompact,
  isCompact,
  bolLogoSrc,
  brandLockupSrc,
  logoDesignId,
  companyTitle,
  companyTagline,
  companyPersian,
  labels,
  bolNumber,
  formData,
}: {
  pdfMode: boolean
  isUltraCompact: boolean
  isCompact: boolean
  bolLogoSrc: string
  brandLockupSrc?: string
  logoDesignId?: string
  companyTitle: string
  companyTagline: string
  companyPersian: string
  labels: Record<string, string>
  bolNumber: string
  formData?: BillOfLadingFormData
}) {
  return (
    <BillOfLadingHeader
      bolNumber={bolNumber}
      pdfMode={pdfMode}
      isUltraCompact={isUltraCompact}
      isCompact={isCompact}
      labels={labels}
      companyTitle={companyTitle}
      companyTagline={companyTagline}
      companyPersian={companyPersian}
      bolLogoSrc={bolLogoSrc}
      brandLockupSrc={brandLockupSrc}
      logoDesignId={logoDesignId}
      formData={formData}
    />
  )
}

function Page2Header({
  pdfMode,
  isUltraCompact,
  isCompact,
  bolLogoSrc,
  companyTitle,
  companyPersian,
  labels,
  bolNumber,
  formData,
}: {
  pdfMode: boolean
  isUltraCompact: boolean
  isCompact: boolean
  bolLogoSrc: string
  companyTitle: string
  companyPersian: string
  labels: Record<string, string>
  bolNumber: string
  formData?: BillOfLadingFormData
}) {
  return (
    <header
      data-bol-header="true"
      data-bol-page2-header="true"
      className={`overflow-hidden rounded-2xl border shrink-0 ${
        pdfMode
          ? "border-blue-200 bg-white"
          : "border-blue-200/90 bg-gradient-to-r from-blue-50/20 via-white to-blue-50/20 shadow-xs"
      }`}
      style={pdfMode ? { boxShadow: "none" } : undefined}
    >
      <div
        className={isUltraCompact ? "px-2 py-1" : isCompact ? "px-2.5 py-1.2" : "px-3 py-1.5"}
        style={{
          display: "grid",
          gridTemplateColumns: isUltraCompact ? "15mm 1fr auto" : "17mm 1fr auto",
          alignItems: "center",
          columnGap: "2mm",
        }}
      >
        {/* Left: Compact Logo Frame */}
        <div
          className="flex items-center justify-center p-0 bg-transparent shrink-0"
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            height: isUltraCompact ? "15mm" : "17mm",
            maxHeight: isUltraCompact ? "15mm" : "17mm",
            maxWidth: isUltraCompact ? "15mm" : "17mm",
            minHeight: isUltraCompact ? "15mm" : "17mm",
            width: isUltraCompact ? "15mm" : "17mm",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bolLogoSrc || "/images/sky-ariana-logo.png"}
            alt="Company logo"
            className="logo object-contain"
            crossOrigin="anonymous"
            style={{
              ...logoImageStyle,
              filter: pdfMode ? "none" : "drop-shadow(0 1px 2.5px rgba(30, 58, 138, 0.14))",
            }}
          />
        </div>

        {/* Center: Title & Continuation Sheet Subtitle */}
        <div className="min-w-0 px-1 text-left flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2
              className={`english-text ${
                isUltraCompact ? "text-[12pt]" : "text-[14pt]"
              } font-black uppercase tracking-tight text-slate-900 leading-tight`}
            >
              {companyTitle}
            </h2>
            <span className="text-slate-300">│</span>
            <p
              className={`persian-text bol-persian-text ${
                isUltraCompact ? "text-[9.5pt]" : "text-[10.8pt]"
              } font-[vazirmatn] font-extrabold text-blue-700 leading-tight`}
              dir="rtl"
              style={{
                direction: "rtl",
                unicodeBidi: "isolate",
              }}
            >
              {companyPersian}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.2 text-[5.5pt] font-black text-blue-900 uppercase tracking-wider">
              <Package className="h-2.5 w-2.5 text-blue-700" />
              Bill of Lading Continuation Sheet
            </span>
            <span className="text-slate-400 text-[5pt]">•</span>
            <span className="font-[vazirmatn] text-blue-700 font-bold text-[5.2pt]" dir="rtl">
              صفحه ضمیمه و ادامه اقلام بارنامه
            </span>
          </div>
        </div>

        {/* Right: B/L Number Badge + Page 2 of 2 Badge + Enlarged Scannable QR Code */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right flex flex-col justify-center">
            <span className="block text-[4.8pt] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">
              DOCUMENT NO.
            </span>
            <span className="font-mono text-[7.8pt] font-black text-blue-950 tracking-tight whitespace-nowrap">
              {bolNumber}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-blue-600 bg-blue-600 px-2 py-1 text-white shadow-2xs">
            <span className="font-mono text-[6.5pt] font-black tracking-wider whitespace-nowrap">PAGE 2 OF 2</span>
          </div>
          <div
            data-qr-code="true"
            className={`shrink-0 flex items-center justify-center bg-white rounded-xl border-2 border-[#93c5fd] ${
              pdfMode ? "shadow-none" : "shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
            }`}
            style={{
              width: isUltraCompact ? "14.5mm" : isCompact ? "16mm" : "17.5mm",
              height: isUltraCompact ? "14.5mm" : isCompact ? "16mm" : "17.5mm",
              minWidth: isUltraCompact ? "14.5mm" : isCompact ? "16mm" : "17.5mm",
              minHeight: isUltraCompact ? "14.5mm" : isCompact ? "16mm" : "17.5mm",
              padding: isUltraCompact ? "0.6mm" : "0.8mm",
              borderRadius: isUltraCompact ? "2.6mm" : "3.2mm",
              boxSizing: "border-box",
            }}
            title="Official Verification QR Code - Click to view WhatsApp shipment update"
          >
            <DocumentQRCode
              value={bolNumber || "SKY-BOL"}
              formData={formData}
              size="100%"
              pdfMode={pdfMode}
              unstyled={true}
              showQuietZone={false}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function TransitRouteHeaderBadge({ isUltra = false }: { isUltra?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 ${
        isUltra ? "h-[16.5px] px-2 text-[6.5pt]" : "h-[18.5px] px-2.5 text-[7.2pt]"
      } rounded-full bg-white/20 hover:bg-white/25 border border-white/40 shadow-xs backdrop-blur-md text-white select-none whitespace-nowrap shrink-0 transition-colors`}
    >
      <Route className={`${isUltra ? "w-2.6 h-2.6" : "w-3 h-3"} text-cyan-200 shrink-0 stroke-[2.4]`} />
      <span
        className="bol-persian-text font-[vazirmatn] font-black text-white leading-none"
        dir="rtl"
        style={{ unicodeBidi: "isolate" }}
      >
        مسیر ترانزیت
      </span>
      <span className="text-white/45 font-mono text-[6.5pt] font-light leading-none select-none">/</span>
      <span
        dir="ltr"
        className="font-sans font-black tracking-wider uppercase text-white/95 leading-none"
        style={{ unicodeBidi: "isolate" }}
      >
        Transit Route
      </span>
    </div>
  )
}

function CargoRouteNoteBanner({
  cargoRouteNote,
  isUltraCompact = false,
  densityTier = "normal",
}: {
  cargoRouteNote: string
  isUltraCompact?: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  if (!hasValue(cargoRouteNote)) return null

  const isUltra = isUltraCompact || densityTier === "ultra"
  const isCompact = densityTier === "compact" || isUltra
  const normalizedRoute = cleanRouteText(cargoRouteNote)

  return (
    <div
      className={`${
        isUltra ? "mb-2 px-2.5 py-1.2" : isCompact ? "mb-2.5 px-3 py-1.4" : "mb-3 px-3.5 py-1.6"
      } rounded-lg border border-red-300/90 bg-gradient-to-r from-red-50/40 via-white/80 to-red-50/30 shadow-2xs`}
      dir="rtl"
    >
      <div className="flex items-center gap-1.5" dir="rtl">
        <Route className={`${isUltra ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-red-500 shrink-0 stroke-[2.2]`} aria-hidden="true" />
        <div
          className={`flex-1 bol-persian-text font-[vazirmatn] ${
            isUltra ? "text-[7.2pt]" : isCompact ? "text-[7.8pt]" : "text-[8.4pt]"
          } font-extrabold leading-relaxed text-red-800 dark:text-red-400 whitespace-pre-line break-words text-right`}
          dir="rtl"
          style={{ direction: "rtl", unicodeBidi: "isolate", letterSpacing: "normal" }}
        >
          {(() => {
            // Isolate English parenthetical phrases and B/L with <bdi dir="ltr"> so print/pdf engines never flip parentheses
            const parts = normalizedRoute.split(/(\([^)]+\)|B\/L)/g)
            return parts.map((part, idx) => {
              if (part === "B/L") {
                return (
                  <bdi
                    key={idx}
                    dir="ltr"
                    style={{ unicodeBidi: "isolate", display: "inline-block" }}
                    className="font-sans font-black px-0.5"
                  >
                    B/L
                  </bdi>
                )
              }
              if (part.startsWith("(") && part.endsWith(")")) {
                const inner = part.slice(1, -1).trim()
                const isPersian = /[\u0600-\u06FF]/.test(inner)
                if (isPersian) {
                  return (
                    <span key={idx} className="font-bold">
                      ({inner})
                    </span>
                  )
                }
                return (
                  <span
                    key={idx}
                    className="inline-flex items-baseline font-bold whitespace-nowrap"
                    style={{ unicodeBidi: "isolate" }}
                  >
                    <span className="opacity-75">(</span>
                    <bdi
                      dir="ltr"
                      className="font-sans font-black tracking-tight"
                      style={{ unicodeBidi: "isolate" }}
                    >
                      {inner}
                    </bdi>
                    <span className="opacity-75">)</span>
                  </span>
                )
              }
              return <span key={idx}>{part}</span>
            })
          })()}
        </div>
      </div>
    </div>
  )
}

function ExporterConsigneeSection({
  contactItems,
  hasExporter,
  hasNotify,
  formData,
  labels,
  pdfMode,
  isUltraCompact,
  densityTier = "normal",
}: {
  contactItems: DetailItem[]
  hasExporter: boolean
  hasNotify: boolean
  formData: BillOfLadingFormData
  labels: Record<string, string>
  pdfMode: boolean
  isUltraCompact: boolean
  densityTier?: "ultra" | "compact" | "normal"
}) {
  return (
    <Section
      title="Exporter Contacts"
      subtitle={labels.exporterContactsFa}
      icon={<Phone className={`${isUltraCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
      glass={!pdfMode}
      printKey="contacts"
      pdfMode={pdfMode}
      densityTier={densityTier}
    >
      {(() => {
        const activeContacts = contactItems.filter((item) => hasValue(item.value))
        if (activeContacts.length === 0) return null
        return (
          <div
            className={`grid ${activeContacts.length === 1 ? "grid-cols-1" : "grid-cols-2"} ${
              isUltraCompact ? "gap-1" : "gap-1.5"
            } items-stretch`}
            dir="ltr"
          >
            {activeContacts.map((item) => (
              <DetailCard
                key={item.label}
                {...item}
                glass={!pdfMode}
                pdfMode={pdfMode}
                compact={isUltraCompact}
                densityTier={densityTier}
                className="exporter-contact-detail-card h-full flex flex-col justify-between overflow-hidden"
              />
            ))}
          </div>
        )
      })()}
      <div
        className={`mt-0 grid grid-cols-2 ${
          isUltraCompact ? "gap-0.8" : "gap-1"
        } print:grid-cols-2 print:gap-1 print:mt-0`}
        dir="ltr"
      >
        {/* COMBINED EXPORTER & NOTIFY PARTY CARD (HIDE BLANK ONES CLEANLY) */}
        {(hasExporter || hasNotify) && (
          <div
            {...(pdfMode ? { "data-no-break": true } : {})}
            className={`party-card business-information ${!pdfMode ? "party-card-glass" : "party-card-solid"} ${
              pdfMode ? "party-card-pdf" : ""
            }`}
            dir="ltr"
          >
            <div className="flex flex-col divide-y divide-blue-100/80" dir="ltr">
              {/* EXPORTER INFORMATION */}
              {hasExporter && (
                <div dir="ltr" className="exporter-details text-left">
                  <div
                    className={`party-card-header ${
                      !pdfMode ? "party-card-header-glass" : "party-card-header-solid"
                    } ${isUltraCompact ? "!py-0.8 !px-1.5" : ""}`}
                    dir="ltr"
                  >
                    <span className={`party-card-icon ${isUltraCompact ? "!w-4 !h-4 !min-w-4 rounded" : ""}`}>
                      <Building2 className={`${isUltraCompact ? "h-2.8 w-2.8" : "h-3.5 w-3.5"}`} />
                    </span>
                    <div className="party-card-header-text text-left" dir="ltr">
                      <h4 className={`party-card-title text-left ${isUltraCompact ? "!text-[8.2pt]" : "!text-[10.2pt]"}`} dir="ltr">
                        Exporter Info
                      </h4>
                      <p
                        className={`party-card-subtitle text-left ${isUltraCompact ? "!text-[8.2pt]" : "!text-[10.2pt]"}`}
                        dir="ltr"
                      >
                        {labels.exporterInfoFa}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`party-card-body text-left ${isUltraCompact ? "!p-1.2 !gap-0.5" : ""}`}
                    dir="ltr"
                  >
                    <TextLines
                      value={formData.shipper_name}
                      className={`party-card-name company-name text-left ${isUltraCompact ? "!text-[8.8pt] leading-tight" : "!text-[11.2pt]"}`}
                    />
                    <div className={`party-card-info-list text-left ${isUltraCompact ? "!gap-0.2" : ""}`} dir="ltr">
                      {hasValue(formData.shipper_address) && (
                        <div className="party-card-info-row text-left" dir="ltr">
                          <MapPin
                            className={`party-card-info-icon ${
                              isUltraCompact ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"
                            }`}
                          />
                          <TextLines
                            value={formData.shipper_address}
                            className={`party-card-info-text party-card-address business-address text-left ${
                              isUltraCompact ? "!text-[7.6pt] leading-tight" : "!text-[9.6pt]"
                            }`}
                          />
                        </div>
                      )}
                      {hasValue(formData.shipper_contact) && (
                        <div className="party-card-info-row text-left" dir="ltr">
                          <Phone
                            className={`party-card-info-icon ${
                              isUltraCompact ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"
                            }`}
                          />
                          <TextLines
                            value={formData.shipper_contact}
                            className={`party-card-info-text party-card-contact contact-details party-card-phone text-left ${
                              isUltraCompact ? "!text-[7.6pt] leading-tight" : "!text-[9.8pt]"
                            }`}
                          />
                        </div>
                      )}
                      {hasValue(formData.shipper_email) && (
                        <div className="party-card-info-row text-left" dir="ltr">
                          <Mail
                            className={`party-card-info-icon ${
                              isUltraCompact ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"
                            }`}
                          />
                          <TextLines
                            value={formData.shipper_email}
                            className={`party-card-info-text party-card-contact contact-details party-card-email text-left ${
                              isUltraCompact ? "!text-[7.6pt] leading-tight" : "!text-[9.8pt]"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFY PARTY */}
              {hasNotify && (
                <div className="notify-party-details">
                  <div
                    className={`party-card-header ${
                      !pdfMode ? "party-card-header-glass" : "party-card-header-solid"
                    } ${isUltraCompact ? "!py-0.8 !px-1.5" : ""}`}
                  >
                    <span className={`party-card-icon ${isUltraCompact ? "!w-4 !h-4 !min-w-4 rounded" : ""}`}>
                      <Mail className={`${isUltraCompact ? "h-2.8 w-2.8" : "h-3.5 w-3.5"}`} />
                    </span>
                    <div className="party-card-header-text">
                      <h4 className={`party-card-title ${isUltraCompact ? "!text-[8.2pt]" : "!text-[10.2pt]"}`}>Notify Party</h4>
                      <p
                        className={`party-card-subtitle ${isUltraCompact ? "!text-[8.2pt]" : "!text-[10.2pt]"} whitespace-nowrap`}
                        dir="rtl"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {labels.notifyPartyFa}
                      </p>
                    </div>
                  </div>
                  <div className={`party-card-body ${isUltraCompact ? "!p-1.2 !gap-0.5" : ""}`}>
                    <TextLines
                      value={formData.notify_party}
                      className={`party-card-name company-name ${isUltraCompact ? "!text-[8.8pt] leading-tight" : "!text-[11.2pt]"}`}
                    />
                    <div className={`party-card-info-list ${isUltraCompact ? "!gap-0.2" : ""}`}>
                      {hasValue(formData.notify_party_address) && (
                        <div className="party-card-info-row">
                          <MapPin
                            className={`party-card-info-icon ${
                              isUltraCompact ? "!w-2.8 !min-w-2.8 !h-2.8 !mt-0.1" : "!w-3.2 !min-w-3.2 !h-3.2 !mt-0.5"
                            }`}
                          />
                          <TextLines
                            value={formData.notify_party_address}
                            className={`party-card-info-text party-card-address business-address ${
                              isUltraCompact ? "!text-[7.6pt] leading-tight" : "!text-[9.6pt]"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONSIGNEE INFORMATION CARD */}
        <PartyCard
          title="Consignee Information"
          subtitle={labels.consigneeInfoFa}
          icon={<UserRound className={`${isUltraCompact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />}
          name={formData.consignee_name}
          address={formData.consignee_address}
          contact={formData.consignee_contact}
          email={formData.consignee_email}
          glass={!pdfMode}
          pdfMode={pdfMode}
          densityTier={densityTier}
        />
      </div>
    </Section>
  )
}

function A4PreviewComponent({
  bolNumber,
  issueDate,
  persianDateNumeric,
  formData,
  logoUrl,
  brandLockupUrl,
  logoDesignId,
  companyName,
  companyNamePersian,
  companySubtitle,
  companyPhone,
  companyEmail,
  companyAddress,
  companyLicence,
  exportTarget = false,
  pdfExport = false,
  includeColorStrip = true,
  backgroundImageUrl = "/images/mountain_logistics_bg.jpg",
  backgroundOpacity = 0.11,
  showStampSignature,
  onToggleStampSignature,
}: A4PreviewProps) {
  const [internalStampActive, setInternalStampActive] = useState(true)
  const [stampConfig, setStampConfig] = useState<CompanyStampConfig>(DEFAULT_STAMP_CONFIG)
  const isStampActive =
    showStampSignature !== undefined ? showStampSignature : internalStampActive && stampConfig.enabled

  useEffect(() => {
    setStampConfig(getStoredCompanyStampConfig())

    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark("bol:a4-preview-mounted")
      try {
        if (performance.getEntriesByName("bol:preview-tab-click").length > 0) {
          performance.measure("bol:click-to-preview-mounted", "bol:preview-tab-click", "bol:a4-preview-mounted")
          const m = performance.getEntriesByName("bol:click-to-preview-mounted").pop()
          if (m) {
            console.info(`[AQ PERF] BOL Editor -> A4 Preview mounted: ${Math.round(m.duration)}ms`)
          }
        }
      } catch {}
    }

    const handleStampUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<CompanyStampConfig>>
      if (customEvent.detail) {
        setStampConfig((prev) => ({
          ...prev,
          ...customEvent.detail,
          dataUrl: customEvent.detail?.dataUrl !== undefined ? customEvent.detail.dataUrl : prev.dataUrl,
          scale: customEvent.detail?.scale !== undefined ? customEvent.detail.scale : prev.scale,
          rotation: customEvent.detail?.rotation !== undefined ? customEvent.detail.rotation : prev.rotation,
          opacity: customEvent.detail?.opacity !== undefined ? customEvent.detail.opacity : prev.opacity,
          signatoryTitle:
            customEvent.detail?.signatoryTitle !== undefined
              ? customEvent.detail.signatoryTitle
              : prev.signatoryTitle,
          signatorySubtitle:
            customEvent.detail?.signatorySubtitle !== undefined
              ? customEvent.detail.signatorySubtitle
              : prev.signatorySubtitle,
          enabled: customEvent.detail?.enabled !== undefined ? customEvent.detail.enabled : prev.enabled,
        }))
      } else {
        setStampConfig(getStoredCompanyStampConfig())
      }
    }

    window.addEventListener("company_stamp_updated", handleStampUpdate)
    return () => {
      window.removeEventListener("company_stamp_updated", handleStampUpdate)
    }
  }, [])

  const toggleStamp = () => {
    if (onToggleStampSignature) {
      onToggleStampSignature(!isStampActive)
    } else {
      setInternalStampActive(!internalStampActive)
    }
  }

  const pdfMode = exportTarget || pdfExport
  const resolvedBrandLockup =
    brandLockupUrl && !brandLockupUrl.includes("aq-logo")
      ? brandLockupUrl
      : undefined
  const bolLogoSrc =
    logoUrl && !logoUrl.includes("aq-logo") && !logoUrl.includes("aq_logo") && !logoUrl.includes("aq-companies")
      ? logoUrl
      : "/images/sky-ariana-logo.png"
  const companyTitle = cleanText(companyName) || "SKY ARIANA LIMITED"
  const companyTagline = cleanText(companySubtitle) || "Import & Export - International Transportation"
  const companyPersian = cleanText(companyNamePersian) || labels.persianCompanyFallback
  const companyAddressLine =
    cleanText(companyAddress) ||
    "2nd Floor, 16 No. Office, Shahidano, Chowk, Etimad Rahmi Market, Kandahar, Afghanistan"
  const iranOffice = joinOfficeLine([
    formData.iran_office_building
      ? formData.iran_office_building.replace(/^(?:(?:IRAN\s+(?:TRANSIT\s+)?OFFICE|TRANSIT\s+OFFICE|IRAN\s+OFFICE|OFFICE)\s*[:\-]\s*)+/gi, "").trim()
      : undefined,
    formData.iran_office_location,
    formData.iran_office_pobox ? `P.O.Box: ${formData.iran_office_pobox}` : undefined,
    formData.iran_office_telefax ? `Tel/Fax: ${formData.iran_office_telefax}` : undefined,
    formData.iran_office_cellphone ? `Cell: ${formData.iran_office_cellphone}` : undefined,
    formData.iran_office_email ? `Email: ${formData.iran_office_email}` : undefined,
  ])

  const contactItems: DetailItem[] = [
    {
      label: formData.notes_1_label || "Contact Phone",
      value: formData.notes_1,
      important: true,
      highlight: true,
      highlightColor: formData.notes_1_theme || "blue",
    },
    {
      label: formData.notes_2_label || "Border Representative / نماینده مرزی",
      value: formData.notes_2,
      important: true,
      highlight: true,
      highlightColor: formData.notes_2_theme || "blue",
    },
  ]

  const hasShipmentData = [
    issueDate,
    persianDateNumeric,
    formData.truck_number,
    formData.driver_name,
    formData.driver_father_name,
    formData.driver_contact,
    formData.driver_rent,
  ].some(hasValue)

  const hasCargoData = [
    formData.number_of_packages,
    formData.kgs_per_carton,
    formData.gross_weight_per_carton,
    formData.rate_per_kgs,
    formData.goods_value,
    formData.net_weight,
    formData.gross_weight,
    formData.container_numbers,
    formData.seal_numbers,
    formData.measurement,
  ].some(hasValue)

  const hasShippingData = [
    formData.port_of_loading,
    formData.port_of_discharge,
    formData.place_of_delivery,
    formData.vessel_name,
    formData.voyage_number,
    formData.freight_payable_at,
    formData.freight_terms,
    formData.routes && formData.routes.length > 0 ? "has_routes" : "",
  ].some(hasValue)

  const cleanedCargoDesc = cleanCargoDescriptionText(formData.cargo_description)

  const cargoTextBlob = [
    formData.cargo_description,
    (formData as any).cargoDescription,
    formData.cargo_route_note,
    (formData as any).cargoRouteNote,
    formData.remarks,
  ].filter(Boolean).join("\n")

  const regexTransitMatch = cargoTextBlob.match(/(?:transit\s*date|trans\s*date)[\s:_–—]+([^\n│|;•]+)/i)
  const regexInvMatch =
    cargoTextBlob.match(/(?:invoice\s*no|inv\s*no|invoice|inv)[\s:_–—]+([^\n│|;•]+)/i) ||
    cargoTextBlob.match(/\b(INV-[\w\-]+)\b/i)

  const rawInvoice =
    cleanText(formData.invoice_number) ||
    cleanText((formData as any).invoice_no) ||
    cleanText((formData as any).invoiceNo) ||
    cleanText((formData as any).invoice) ||
    (regexInvMatch ? regexInvMatch[1].trim() : "") ||
    ""
  const invoiceNumber = rawInvoice ? (/^INV/i.test(rawInvoice) ? rawInvoice : `INV-${rawInvoice}`) : ""

  const transitDate =
    cleanText((formData as any).transit_date) ||
    cleanText((formData as any).transitDate) ||
    (regexTransitMatch ? regexTransitMatch[1].trim() : "") ||
    cleanText(issueDate) ||
    cleanText(formData.issue_date) ||
    cleanText((formData as any).issueDate) ||
    ""

  const shipmentHeaderDetails = (transitDate || invoiceNumber) ? (
    <div
      className="inline-flex items-center justify-center select-none"
      style={{ whiteSpace: "nowrap" }}
    >
      <div
        className={`inline-flex items-center rounded-full bg-white/95 border border-red-300/90 shadow-sm transition-all my-0.5 ${
          pdfMode ? "gap-2 px-3 py-1 min-h-[22px]" : "gap-2.5 px-3.5 py-[2.5px]"
        }`}
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#f87171",
          borderWidth: "1.5px",
          borderStyle: "solid",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          lineHeight: "1",
        }}
      >
        {transitDate && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none">
            <CalendarDays className={`${pdfMode ? "h-3 w-3" : "h-3.5 w-3.5"} text-red-500 mr-1.5 shrink-0`} />
            <span className={`inline-flex items-center text-red-500 font-extrabold uppercase tracking-wider leading-none mr-1.5 ${
              pdfMode ? "text-[8.5pt]" : "text-[9.5pt] sm:text-[10pt]"
            }`}>
              TRANSIT DATE:
            </span>
            <span
              className={`inline-flex items-center text-red-700 font-black font-mono tracking-tight leading-none pl-0.5 ${
                pdfMode ? "text-[11pt]" : "text-[12pt] sm:text-[12.8pt]"
              }`}
              style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'NotoSans', sans-serif" }}
            >
              {transitDate}
            </span>
          </span>
        )}
        {transitDate && invoiceNumber && (
          <span
            style={{
              display: "inline-block",
              width: "1.5px",
              height: "14px",
              backgroundColor: "#f87171",
              margin: "0 6px",
              flexShrink: 0,
              verticalAlign: "middle",
            }}
            aria-hidden="true"
          />
        )}
        {invoiceNumber && (
          <span
            className="inline-flex items-center whitespace-nowrap leading-none"
            title={`Invoice: ${invoiceNumber}`}
            aria-label={`Invoice: ${invoiceNumber}`}
          >
            <span className="sr-only">Invoice: </span>
            <span
              className={`text-red-700 font-black font-mono tracking-tight leading-none ${
                pdfMode ? "text-[11pt]" : "text-[12pt] sm:text-[12.8pt]"
              }`}
              style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'NotoSans', sans-serif" }}
            >
              {invoiceNumber}
            </span>
          </span>
        )}
      </div>
    </div>
  ) : undefined
  const hasExporter = [
    formData.shipper_name,
    formData.shipper_address,
    formData.shipper_contact,
    formData.shipper_email,
  ].some(hasValue)
  const hasNotify = [formData.notify_party, formData.notify_party_address].some(hasValue)

  const descLines = cleanedCargoDesc ? cleanedCargoDesc.split("\n").map((l) => l.trim()).filter(Boolean) : []
  const descLineCount = descLines.length
  const routeCount = (formData.routes || []).length

  // Synced cargo items across all columns
  const syncedCargo = useMemo(() => parseSyncedCargoItems(formData), [formData])
  const isMultiPage = shouldSplitToPage2({
    cargoCount: syncedCargo.items.length,
    routeCount,
    descLineCount,
    hasShippingData,
    hasRouteNote: hasValue(formData.cargo_route_note),
  })

  const { page1Items, page2Items } = useMemo(
    () => splitCargoForPages(syncedCargo.items, isMultiPage),
    [syncedCargo.items, isMultiPage]
  )

  const consigneeLines = (formData.consignee_address || "").split("\n").map((l) => l.trim()).filter(Boolean).length
  const shipperLines = (formData.shipper_address || "").split("\n").map((l) => l.trim()).filter(Boolean).length
  const notifyLines = (formData.notify_party_address || "").split("\n").map((l) => l.trim()).filter(Boolean).length
  const totalPartyLines = consigneeLines + shipperLines + notifyLines
  const activeContactsCount = contactItems.filter((item) => hasValue(item.value)).length

  let densityScore = 0
  if (routeCount >= 5) densityScore += 3.5
  else if (routeCount >= 4) densityScore += 2.5
  else if (routeCount >= 3) densityScore += 1.5

  if (descLineCount >= 7) densityScore += 5
  else if (descLineCount >= 5) densityScore += 4
  else if (descLineCount >= 3) densityScore += 3
  else if (descLineCount >= 2) densityScore += 1

  if (syncedCargo.items.length >= 6) densityScore += 5
  else if (syncedCargo.items.length >= 4) densityScore += 3
  else if (syncedCargo.items.length >= 2) densityScore += 1

  if (hasShippingData) densityScore += 2
  if (hasValue(formData.cargo_route_note)) densityScore += 2
  if (hasNotify) densityScore += 1
  if (contactItems.length > 0) densityScore += 1

  // Granular line budget for long party addresses & business notes
  if (totalPartyLines >= 12) densityScore += 4
  else if (totalPartyLines >= 8) densityScore += 3
  else if (totalPartyLines >= 5) densityScore += 1.5

  if (activeContactsCount >= 2) densityScore += 1.5
  else if (activeContactsCount === 1) densityScore += 1

  const isUltraCompact = densityScore >= 5 || syncedCargo.items.length >= 5 || (routeCount >= 4 && (hasShippingData || syncedCargo.items.length >= 2)) || totalPartyLines >= 10
  const isCompact = (densityScore >= 3 || syncedCargo.items.length >= 3 || routeCount >= 3 || totalPartyLines >= 5) && !isUltraCompact
  const densityTier: "ultra" | "compact" | "normal" = isUltraCompact ? "ultra" : isCompact ? "compact" : "normal"

  // Per-page density tiers in multi-page mode
  const page1Ultra = page1Items.length >= 7 || totalPartyLines >= 12
  const page1Compact = (page1Items.length >= 5 || totalPartyLines >= 8) && !page1Ultra
  const page1Density: "ultra" | "compact" | "normal" = page1Ultra ? "ultra" : page1Compact ? "compact" : "normal"

  const page2Ultra = page2Items.length >= 6 || descLineCount >= 7
  const page2Compact = (page2Items.length >= 4 || descLineCount >= 4 || routeCount >= 4) && !page2Ultra
  const page2Density: "ultra" | "compact" | "normal" = page2Ultra ? "ultra" : page2Compact ? "compact" : "normal"

  // Dynamic Content Auto-Fit Scaling Engine (strictly bounds total visual height inside single A4 297mm bounds)
  const hasTruck = hasValue(formData.truck_number)
  const hasDriver = hasValue(formData.driver_name) || hasValue(formData.driver_father_name)
  const hasDriverOrContact = hasDriver || parseDriverContactPhones(formData.driver_contact).length > 0
  const hasRent = hasValue(formData.driver_rent)
  const activeShipmentCardsCount = [hasValue(issueDate) || hasValue(persianDateNumeric), hasTruck, hasDriverOrContact, hasRent].filter(Boolean).length

  const estimatedMainContentHeight = useMemo(() => {
    let h = 0
    // 1. Shipment Information
    if (activeShipmentCardsCount > 0) {
      h += 24 // Section header
      h += hasTruck ? (isUltraCompact ? 84 : 96) : (isUltraCompact ? 42 : 52)
      h += 2
    }
    // 2. Exporter & Consignee Section
    h += 24 // Section header
    if (activeContactsCount > 0) {
      h += isUltraCompact ? 46 : 56
    }
    const leftPartyH =
      (hasExporter ? (isUltraCompact ? 38 + shipperLines * 12 : 50 + shipperLines * 14) : 0) +
      (hasNotify ? (isUltraCompact ? 38 + notifyLines * 12 : 50 + notifyLines * 14) : 0)
    const rightPartyH =
      (isUltraCompact ? 38 + consigneeLines * 12 : 50 + consigneeLines * 14) +
      (hasValue(formData.consignee_contact) ? (isUltraCompact ? 12 : 15) : 0) +
      (hasValue(formData.consignee_email) ? (isUltraCompact ? 12 : 15) : 0)
    h += Math.max(leftPartyH, rightPartyH, isUltraCompact ? 52 : 70)
    h += 2

    // 3. Cargo Description
    if (hasCargoData || hasValue(cleanedCargoDesc) || hasValue(formData.cargo_route_note)) {
      h += 24
      if (hasValue(formData.cargo_route_note)) {
        h += (formData.cargo_route_note?.length || 0) > 60 ? (isUltraCompact ? 36 : 46) : (isUltraCompact ? 28 : 36)
      }
      if (hasCargoData) {
        h += syncedCargo.items.length * (isUltraCompact ? 38 : 46) + (isUltraCompact ? 28 : 34)
      }
      if (hasValue(cleanedCargoDesc) || syncedCargo.items.length > 0) {
        h += isUltraCompact ? 26 : 30
      }
      h += 2
    }

    // 4. Shipping Details
    if (hasShippingData) {
      h += 24 + (isUltraCompact ? 54 : 68)
      h += 2
    }

    // 5. Route Timeline
    if (routeCount > 0) {
      h += 24 + (isUltraCompact ? 68 : 82) + (routeCount >= 4 ? 12 : 0)
      h += 2
    }

    // 6. Authorized Signature Chamber
    h += isUltraCompact ? 104 : 124

    // Section gaps
    const activeSectionsCount = [
      activeShipmentCardsCount > 0,
      true,
      hasCargoData || hasValue(cleanedCargoDesc) || hasValue(formData.cargo_route_note),
      hasShippingData,
      routeCount > 0,
    ].filter(Boolean).length
    h += activeSectionsCount * (isUltraCompact ? 2 : 4)

    return h
  }, [
    activeShipmentCardsCount,
    hasTruck,
    isUltraCompact,
    activeContactsCount,
    hasExporter,
    hasNotify,
    shipperLines,
    notifyLines,
    consigneeLines,
    formData.consignee_contact,
    formData.consignee_email,
    formData.cargo_route_note,
    hasCargoData,
    cleanedCargoDesc,
    syncedCargo.items.length,
    hasShippingData,
    routeCount,
  ])

  // Single A4 printable main container target: 815px (total 1122.5 - header ~135 - footer ~75 - padding ~19 - margin ~30)
  const staticFitScale = useMemo(() => {
    if (isMultiPage) return 1.0
    const TARGET_AVAILABLE_H = 815
    if (estimatedMainContentHeight <= TARGET_AVAILABLE_H) return 1.0
    const ratio = TARGET_AVAILABLE_H / estimatedMainContentHeight
    return Math.min(1.0, Math.max(0.68, Math.round(ratio * 1000) / 1000))
  }, [isMultiPage, estimatedMainContentHeight])

  const [dynamicFitScale, setDynamicFitScale] = useState<number>(staticFitScale)

  useEffect(() => {
    setDynamicFitScale(staticFitScale)
  }, [staticFitScale])

  const mainContentRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (isMultiPage || !mainContentRef.current) return
    const mainEl = mainContentRef.current
    const checkOverflow = () => {
      if (!mainEl) return
      const clientH = mainEl.clientHeight
      const scrollH = mainEl.scrollHeight
      if (clientH > 0 && scrollH > clientH + 1) {
        const ratio = (clientH - 2) / scrollH
        const measured = Math.min(1.0, Math.max(0.65, Math.round(ratio * 1000) / 1000))
        setDynamicFitScale((prev) => Math.min(prev, measured))
      }
    }
    checkOverflow()
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(checkOverflow) : null
    ro?.observe(mainEl)
    return () => ro?.disconnect()
  }, [isMultiPage])

  const effectiveFitScale = pdfMode ? 1.0 : Math.min(staticFitScale, dynamicFitScale)

  if (isMultiPage) {
    return (
      <div
        data-bol-a4="true"
        data-a4-preview="true"
        id="bol-a4-preview-document"
        data-multipage="true"
        data-density={densityTier}
        data-pdf-export={pdfMode ? "true" : undefined}
        data-color-strip={includeColorStrip ? "true" : "false"}
        className={`bol-a4-document mx-auto flex flex-col items-center gap-6 print:gap-0 print:m-0 print:p-0 ${
          pdfMode ? "m-0 p-0 shadow-none border-0 ring-0" : ""
        }`}
      >
        {/* PAGE 1: Master Overview & Initial Cargo Items */}
        <div
          data-bol-page="true"
          data-page-number="1"
          data-density={page1Density}
          className={`bol-a4-page mx-auto flex ${pdfMode ? "h-[1123px] min-h-[1123px] w-[794px] min-w-[794px] max-w-[794px] overflow-visible" : "h-[297mm] min-h-[297mm] max-h-[297mm] w-[210mm] min-w-[210mm] max-w-[210mm] overflow-hidden"} flex-col justify-between text-slate-950 relative box-border print:m-0 print:p-0 print:border-none print:shadow-none print:ring-0 ${
            pdfMode ? "shadow-none ring-0 border-0 m-0" : "shadow-2xl shadow-blue-200/50 ring-1 ring-blue-100"
          } ${
            page1Ultra
              ? "p-[2mm] px-[2.8mm] gap-[0.4mm]"
              : page1Compact
              ? "p-[2.2mm] px-[3mm] gap-[0.5mm]"
              : "p-[2.5mm] px-[3.2mm] gap-[0.6mm]"
          }`}
          style={pdfMode ? pdfShellStyle : a4ShellStyle}
        >
          <BackgroundWatermark backgroundImageUrl={backgroundImageUrl} backgroundOpacity={backgroundOpacity} pdfMode={pdfMode} />
          <Page1Header
            pdfMode={pdfMode}
            isUltraCompact={page1Ultra}
            isCompact={page1Compact}
            bolLogoSrc={bolLogoSrc}
            brandLockupSrc={resolvedBrandLockup}
            logoDesignId={logoDesignId}
            companyTitle={companyTitle}
            companyTagline={companyTagline}
            companyPersian={companyPersian}
            labels={labels}
            bolNumber={bolNumber}
            formData={formData}
          />

          <main
            data-bol-content="true"
            data-density={page1Density}
            className={`mt-0 flex min-h-0 flex-1 flex-col ${
              page1Ultra ? "gap-[1.2mm]" : page1Compact ? "gap-[1.6mm]" : "gap-[2.2mm]"
            } print:gap-[1.2mm] justify-start overflow-hidden`}
          >
            {hasShipmentData && (
              <Section
                title="Shipment Information"
                subtitle={labels.shipmentInfoFa}
                centerContent={shipmentHeaderDetails}
                icon={<CalendarDays className={`${page1Ultra ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
                glass={!pdfMode}
                printKey="shipment"
                pdfMode={pdfMode}
                titleClassName={page1Ultra ? "text-[8.5pt]" : "text-[9.2pt]"}
                densityTier={page1Density}
              >
                <ShipmentOverview
                  issueDate={issueDate}
                  persianDateNumeric={persianDateNumeric}
                  formData={formData}
                  labels={labels}
                  pdfMode={pdfMode}
                  densityTier={page1Density}
                />
              </Section>
            )}

            <ExporterConsigneeSection
              contactItems={contactItems}
              hasExporter={hasExporter}
              hasNotify={hasNotify}
              formData={formData}
              labels={labels}
              pdfMode={pdfMode}
              isUltraCompact={page1Ultra}
              densityTier={page1Density}
            />

            {(hasCargoData || hasValue(formData.cargo_route_note)) && (
              <Section
                title="Cargo Description"
                subtitle={labels.cargoDescFa}
                badge={hasValue(formData.cargo_route_note) ? <TransitRouteHeaderBadge isUltra={page1Ultra} /> : undefined}
                icon={
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-white/20 border border-white/30 shadow-2xs shrink-0">
                    <Package className={`${page1Ultra ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-white stroke-[2.2]`} />
                  </div>
                }
                glass={!pdfMode}
                printKey="cargo"
                pdfMode={pdfMode}
                titleClassName={page1Ultra ? "text-[8.2pt]" : "text-[8.8pt]"}
                subtitleClassName={page1Ultra ? "!text-[8.6pt]" : "!text-[9.5pt]"}
                densityTier={page1Density}
                compactHeight={true}
              >
                {hasValue(formData.cargo_route_note) && (
                  <CargoRouteNoteBanner
                    cargoRouteNote={formData.cargo_route_note}
                    isUltraCompact={page1Ultra}
                    densityTier={page1Density}
                  />
                )}
                {hasCargoData && (
                  <CargoOverview
                    formData={formData}
                    labels={labels}
                    pdfMode={pdfMode}
                    densityTier={page1Density}
                    items={page1Items}
                    startIndex={0}
                    totalItemCount={syncedCargo.items.length}
                    showTotals={false}
                  />
                )}
                {/* Continuation alert banner */}
                <div className="rounded-lg border-2 border-dashed border-blue-400/80 bg-blue-50/80 p-1.5 px-3 flex items-center justify-between text-blue-950 mt-auto shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white font-mono text-[7pt] font-black">
                      ↓
                    </span>
                    <div>
                      <span className="text-[6.8pt] font-black uppercase tracking-wider text-blue-950">
                        CARGO ITEMS CONTINUED ON PAGE 2 ({page2Items.length} MORE ITEMS)
                      </span>
                      <p className="text-[5.5pt] font-bold text-blue-800 font-[vazirmatn]" dir="rtl">
                        ادامه اقلام و مشخصات بار در صفحه دوم بارنامه درج شده است
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[5.8pt] font-bold text-blue-900 bg-white border border-blue-200 rounded px-1.5 py-0.5">
                      TOTALS & SIGNATURES ON SHEET 2
                    </span>
                    <span className="font-mono text-[6.5pt] font-black text-blue-600">PAGE 1 OF 2 →</span>
                  </div>
                </div>
              </Section>
            )}
          </main>

          <ExecutiveBOLFooter
            isUltraCompact={page1Ultra}
            companyTitle={companyTitle}
            companyTagline={companyTagline}
            companyLicence={companyLicence}
            companyAddressLine={companyAddressLine}
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            iranOffice={iranOffice}
            pageNumber={1}
            totalPages={2}
            bolNumber={bolNumber}
          />
        </div>

        {/* PAGE 2: Cargo Continuation, Description of Goods, Route, Signatures & Totals */}
        <div
          data-bol-page="true"
          data-page-number="2"
          data-density={page2Density}
          className={`bol-a4-page mx-auto flex ${pdfMode ? "h-[1123px] min-h-[1123px] w-[794px] min-w-[794px] max-w-[794px] overflow-visible" : "h-[297mm] min-h-[297mm] max-h-[297mm] w-[210mm] min-w-[210mm] max-w-[210mm] overflow-hidden"} flex-col justify-between text-slate-950 relative box-border print:m-0 print:p-0 print:border-none print:shadow-none print:ring-0 ${
            pdfMode ? "shadow-none ring-0 border-0 m-0" : "shadow-2xl shadow-blue-200/50 ring-1 ring-blue-100"
          } ${
            page2Ultra
              ? "p-[2mm] px-[2.8mm] gap-[0.4mm]"
              : page2Compact
              ? "p-[2.2mm] px-[3mm] gap-[0.5mm]"
              : "p-[2.5mm] px-[3.2mm] gap-[0.6mm]"
          }`}
          style={pdfMode ? pdfShellStyle : a4ShellStyle}
        >
          <BackgroundWatermark backgroundImageUrl={backgroundImageUrl} backgroundOpacity={backgroundOpacity} pdfMode={pdfMode} />
          <Page2Header
            pdfMode={pdfMode}
            isUltraCompact={page2Ultra}
            isCompact={page2Compact}
            bolLogoSrc={bolLogoSrc}
            companyTitle={companyTitle}
            companyPersian={companyPersian}
            labels={labels}
            bolNumber={bolNumber}
            formData={formData}
          />

          <main
            data-bol-content="true"
            data-density={page2Density}
            className={`mt-0 flex min-h-0 flex-1 flex-col ${
              page2Ultra ? "gap-[1.2mm]" : page2Compact ? "gap-[1.6mm]" : "gap-[2.2mm]"
            } print:gap-[1.2mm] justify-start overflow-hidden`}
          >
            <Section
              title="Cargo Description (Continuation)"
              subtitle={labels.cargoDescFa}
              icon={
                <div className="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-white/20 border border-white/30 shadow-2xs shrink-0">
                  <Package className={`${page2Ultra ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-white stroke-[2.2]`} />
                </div>
              }
              glass={!pdfMode}
              printKey="cargo"
              pdfMode={pdfMode}
              titleClassName={page2Ultra ? "text-[8.2pt]" : "text-[8.8pt]"}
              subtitleClassName={page2Ultra ? "!text-[8.6pt]" : "!text-[9.5pt]"}
              densityTier={page2Density}
              compactHeight={true}
            >
              <CargoOverview
                formData={formData}
                labels={labels}
                pdfMode={pdfMode}
                densityTier={page2Density}
                items={page2Items}
                startIndex={page1Items.length}
                totalItemCount={syncedCargo.items.length}
                showTotals={true}
                totals={syncedCargo.totals}
                isContinuation={true}
              />
              {(hasValue(cleanedCargoDesc) || (syncedCargo.items && syncedCargo.items.length > 0)) && (
                <CargoDescriptionBlock
                  cleanedCargoDesc={cleanedCargoDesc}
                  pdfMode={pdfMode}
                  densityTier={page2Density}
                  labels={labels}
                  cargoItems={syncedCargo.items}
                />
              )}
            </Section>

            {hasShippingData && (
              <Section
                title="Shipping Details & Ports"
                subtitle={labels.shippingDetailsFa}
                icon={<Ship className={`${page2Ultra ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
                glass={!pdfMode}
                printKey="shipping"
                pdfMode={pdfMode}
                titleClassName={page2Ultra ? "text-[8.5pt]" : "text-[9.2pt]"}
                densityTier={page2Density}
              >
                <ShippingOverview
                  formData={formData}
                  labels={labels}
                  pdfMode={pdfMode}
                  densityTier={page2Density}
                />
              </Section>
            )}

            <Section
              title="Route / Transportation Path"
              subtitle={labels.routeFa}
              badge={
                formData.routes && formData.routes.length > 0 ? (
                  <span className="text-[6.8pt] font-black uppercase whitespace-nowrap inline-flex items-center justify-center leading-none shrink-0 h-[17px] px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white shadow-2xs tracking-wider">
                    {formData.routes.length} STOPS • TRANSIT
                  </span>
                ) : undefined
              }
              icon={
                <div className="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-white/20 border border-white/30 shadow-2xs shrink-0">
                  <Route className={`${page2Ultra ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-white stroke-[2.2]`} />
                </div>
              }
              glass={!pdfMode}
              printKey="route"
              pdfMode={pdfMode}
              titleClassName={page2Ultra ? "text-[8.5pt]" : "text-[9.2pt]"}
              densityTier={page2Density}
            >
              <RouteTimeline routes={formData.routes} glass={!pdfMode} densityTier={page2Density} />
            </Section>

            <SignatureChamber
              isUltraCompact={page2Ultra}
              isCompact={page2Compact}
              pdfMode={pdfMode}
              exportTarget={exportTarget}
              pdfExport={pdfExport}
              toggleStamp={toggleStamp}
              isStampActive={isStampActive}
              stampConfig={stampConfig}
              companyTitle={companyTitle}
              labels={labels}
            />
          </main>

          <ExecutiveBOLFooter
            isUltraCompact={page2Ultra}
            companyTitle={companyTitle}
            companyTagline={companyTagline}
            companyLicence={companyLicence}
            companyAddressLine={companyAddressLine}
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            iranOffice={iranOffice}
            pageNumber={2}
            totalPages={2}
            bolNumber={bolNumber}
          />
        </div>
      </div>
    )
  }

  // SINGLE-PAGE MODE (Default when cargo items fit comfortably on 1 sheet)
  return (
    <div
      data-bol-a4="true"
      data-a4-preview="true"
      id="bol-a4-preview-document"
      data-density={densityTier}
      data-pdf-export={pdfMode ? "true" : undefined}
      data-color-strip={includeColorStrip ? "true" : "false"}
      className={`bol-a4-document mx-auto flex ${pdfMode ? "h-[1123px] min-h-[1123px] w-[794px] min-w-[794px] max-w-[794px] overflow-visible" : "h-[297mm] min-h-[297mm] max-h-[297mm] w-[210mm] min-w-[210mm] max-w-[210mm] overflow-hidden"} flex-col justify-between text-slate-950 relative box-border print:m-0 print:p-0 print:border-none print:shadow-none print:ring-0 ${
        pdfMode ? "shadow-none ring-0 border-0 m-0" : "shadow-2xl shadow-blue-200/50 ring-1 ring-blue-100"
      }`}
      style={pdfMode ? pdfShellStyle : a4ShellStyle}
    >
      <div
        data-bol-page="true"
        data-page-number="1"
        data-density={densityTier}
        className={`bol-a4-page relative flex h-full flex-col justify-between ${
          isUltraCompact
            ? "p-[1.8mm] px-[2.6mm] gap-[0.3mm]"
            : isCompact
            ? "p-[2.2mm] px-[3mm] gap-[0.5mm]"
            : "p-[2.5mm] px-[3.2mm] gap-[0.6mm]"
        } ${pdfMode ? "overflow-visible" : "overflow-hidden"} box-border`}
      >
        <BackgroundWatermark backgroundImageUrl={backgroundImageUrl} backgroundOpacity={backgroundOpacity} pdfMode={pdfMode} />
        <Page1Header
          pdfMode={pdfMode}
          isUltraCompact={isUltraCompact}
          isCompact={isCompact}
          bolLogoSrc={bolLogoSrc}
          brandLockupSrc={resolvedBrandLockup}
          logoDesignId={logoDesignId}
          companyTitle={companyTitle}
          companyTagline={companyTagline}
          companyPersian={companyPersian}
          labels={labels}
          bolNumber={bolNumber}
            formData={formData}
        />

        <main
          ref={mainContentRef}
          data-bol-content="true"
          data-density={densityTier}
          data-auto-fit-scale={effectiveFitScale < 1 ? effectiveFitScale : undefined}
          className={`mt-0 flex min-h-0 flex-1 flex-col ${
            isUltraCompact ? "gap-[0.5mm]" : isCompact ? "gap-[1.0mm]" : "gap-[1.6mm]"
          } print:gap-[0.5mm] justify-start overflow-hidden`}
        >
          <div
            data-bol-autofit-canvas="true"
            className={`flex flex-col flex-1 w-full min-h-0 ${
              isUltraCompact ? "gap-[0.5mm]" : isCompact ? "gap-[1.0mm]" : "gap-[1.6mm]"
            } justify-between`}
            style={
              effectiveFitScale < 1
                ? {
                    transform: `scale(${effectiveFitScale})`,
                    transformOrigin: "top center",
                    width: `${(100 / effectiveFitScale).toFixed(3)}%`,
                    marginLeft: `${((1 - 1 / effectiveFitScale) * 50).toFixed(3)}%`,
                  }
                : undefined
            }
          >
            {hasShipmentData && (
              <Section
                title="Shipment Information"
                subtitle={labels.shipmentInfoFa}
                centerContent={shipmentHeaderDetails}
                icon={<CalendarDays className={`${isUltraCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
                glass={!pdfMode}
                printKey="shipment"
                pdfMode={pdfMode}
                titleClassName={isUltraCompact ? "text-[8.5pt]" : "text-[9.2pt]"}
                densityTier={densityTier}
              >
                <ShipmentOverview
                  issueDate={issueDate}
                  persianDateNumeric={persianDateNumeric}
                  formData={formData}
                  labels={labels}
                  pdfMode={pdfMode}
                  densityTier={densityTier}
                />
              </Section>
            )}

            <ExporterConsigneeSection
              contactItems={contactItems}
              hasExporter={hasExporter}
              hasNotify={hasNotify}
              formData={formData}
              labels={labels}
              pdfMode={pdfMode}
              isUltraCompact={isUltraCompact}
              densityTier={densityTier}
            />

            {(hasCargoData || hasValue(cleanedCargoDesc) || hasValue(formData.cargo_route_note)) && (
              <Section
                title="Cargo Description"
                subtitle={labels.cargoDescFa}
                badge={hasValue(formData.cargo_route_note) ? <TransitRouteHeaderBadge isUltra={isUltraCompact} /> : undefined}
                icon={
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-white/20 border border-white/30 shadow-2xs shrink-0">
                    <Package className={`${isUltraCompact ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-white stroke-[2.2]`} />
                  </div>
                }
                glass={!pdfMode}
                printKey="cargo"
                pdfMode={pdfMode}
                titleClassName={isUltraCompact ? "text-[8.2pt]" : "text-[8.8pt]"}
                subtitleClassName={isUltraCompact ? "!text-[8.6pt]" : "!text-[9.5pt]"}
                densityTier={densityTier}
                compactHeight={true}
              >
                {hasValue(formData.cargo_route_note) && (
                  <CargoRouteNoteBanner
                    cargoRouteNote={formData.cargo_route_note}
                    isUltraCompact={isUltraCompact}
                    densityTier={densityTier}
                  />
                )}
                {hasCargoData && (
                  <CargoOverview
                    formData={formData}
                    labels={labels}
                    pdfMode={pdfMode}
                    densityTier={densityTier}
                    items={syncedCargo.items}
                    startIndex={0}
                    totalItemCount={syncedCargo.items.length}
                    showTotals={true}
                    totals={syncedCargo.totals}
                  />
                )}
                {(hasValue(cleanedCargoDesc) || (syncedCargo.items && syncedCargo.items.length > 0)) && (
                  <CargoDescriptionBlock
                    cleanedCargoDesc={cleanedCargoDesc}
                    pdfMode={pdfMode}
                    densityTier={densityTier}
                    labels={labels}
                    cargoItems={syncedCargo.items}
                  />
                )}
              </Section>
            )}

            {hasShippingData && (
              <Section
                title="Shipping Details & Ports"
                subtitle={labels.shippingDetailsFa}
                icon={<Ship className={`${isUltraCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />}
                glass={!pdfMode}
                printKey="shipping"
                pdfMode={pdfMode}
                titleClassName={isUltraCompact ? "text-[8.5pt]" : "text-[9.2pt]"}
                densityTier={densityTier}
              >
                <ShippingOverview
                  formData={formData}
                  labels={labels}
                  pdfMode={pdfMode}
                  densityTier={densityTier}
                />
              </Section>
            )}

            <Section
              title="Route / Transportation Path"
              subtitle={labels.routeFa}
              badge={
                formData.routes && formData.routes.length > 0 ? (
                  <span className="text-[6.8pt] font-black uppercase whitespace-nowrap inline-flex items-center justify-center leading-none shrink-0 h-[17px] px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white shadow-2xs tracking-wider">
                    {formData.routes.length} STOPS • TRANSIT
                  </span>
                ) : undefined
              }
              icon={
                <div className="flex items-center justify-center w-[18px] h-[18px] rounded-[4px] bg-white/20 border border-white/30 shadow-2xs shrink-0">
                  <Route className={`${isUltraCompact ? "h-2.8 w-2.8" : "h-3.2 w-3.2"} text-white stroke-[2.2]`} />
                </div>
              }
              glass={!pdfMode}
              printKey="route"
              pdfMode={pdfMode}
              titleClassName={isUltraCompact ? "text-[8.5pt]" : "text-[9.2pt]"}
              densityTier={densityTier}
            >
              <RouteTimeline routes={formData.routes} glass={!pdfMode} densityTier={densityTier} />
            </Section>

            <SignatureChamber
              isUltraCompact={isUltraCompact}
              isCompact={isCompact}
              pdfMode={pdfMode}
              exportTarget={exportTarget}
              pdfExport={pdfExport}
              toggleStamp={toggleStamp}
              isStampActive={isStampActive}
              stampConfig={stampConfig}
              companyTitle={companyTitle}
              labels={labels}
            />
          </div>
        </main>

        <ExecutiveBOLFooter
          isUltraCompact={isUltraCompact}
          companyTitle={companyTitle}
          companyTagline={companyTagline}
          companyLicence={companyLicence}
          companyAddressLine={companyAddressLine}
          companyPhone={companyPhone}
          companyEmail={companyEmail}
          iranOffice={iranOffice}
          pageNumber={1}
          totalPages={1}
          bolNumber={bolNumber}
        />
      </div>
    </div>
  )
}

export const A4Preview = memo(A4PreviewComponent)
export const BOLDocument = A4Preview
export default A4Preview
