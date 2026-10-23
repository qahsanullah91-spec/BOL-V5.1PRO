"use client"

import React, { useMemo } from "react"
import {
  parseAfghanPlate,
  getProvinceInfo,
  getProvinceCode,
  normalizeProvinceName,
  convertToLatinDigits,
  convertToPersianDigits,
  AFGHAN_PLATE_LETTERS,
  type AfghanProvince,
  type ParsedAfghanPlate,
} from "@/lib/utils/afghan-plate"

export {
  parseAfghanPlate,
  getProvinceInfo,
  getProvinceCode,
  normalizeProvinceName,
  convertToLatinDigits,
  convertToPersianDigits,
  AFGHAN_PLATE_LETTERS,
  type AfghanProvince,
  type ParsedAfghanPlate,
}

/**
 * Official Afghanistan National Emblem Silhouette for Vehicle Registration Plates.
 * Depicts the historic national emblem: mosque with mihrab and minbar,
 * flanked by two ears of wheat and a star, in authentic monochrome stamped style.
 */
function AfghanNationalPlateEmblem({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {/* Top 5-Pointed Star */}
      <polygon points="24,2 25.5,5.5 29,5.8 26.5,8.2 27.2,12 24,10 20.8,12 21.5,8.2 19,5.8 22.5,5.5" />

      {/* Mosque Dome & Arch */}
      <path d="M24 13c-4.5 0-7 3.5-7 6.5h14c0-3-2.5-6.5-7-6.5z" />

      {/* Mosque Minaret Pillars & Arch Opening */}
      <path d="M18 20.5v12h12v-12h-12zm6 10c-1.8 0-3-1.6-3-3.5v-6.5h6v6.5c0 1.9-1.2 3.5-3 3.5z" />

      {/* Minbar / Pulpit Steps */}
      <path d="M23 27h2v3.5h-2zM21.5 28.5h5v2h-5z" />

      {/* Left Sheaf of Wheat */}
      <path
        d="M13 14c-1.5 3-2.5 7-1.5 12 1 4.5 3.5 8 7.5 10-1.8-3.5-2.2-7.5-1.5-11 .8-4 2-7 3.5-9.5-2.8-.5-5.5-.8-8-1.5z"
        opacity="0.95"
      />
      <path
        d="M11 19c-1.2 2.2-1.8 5-1.2 7.8 1.2-1.5 2.8-2.5 4.2-3.2-.8-2-1.8-3.8-3-4.6z"
        opacity="0.85"
      />

      {/* Right Sheaf of Wheat */}
      <path
        d="M35 14c1.5 3 2.5 7 1.5 12-1 4.5-3.5 8-7.5 10 1.8-3.5 2.2-7.5 1.5-11-.8-4 2-7 3.5-9.5 2.8-.5 5.5-.8 8-1.5z"
        opacity="0.95"
      />
      <path
        d="M37 19c1.2 2.2 1.8 5 1.2 7.8-1.2-1.5-2.8-2.5-4.2-3.2.8-2 1.8-3.8 3-4.6z"
        opacity="0.85"
      />

      {/* Base Ribbon & Plinth Pedestal */}
      <path d="M15 40h18c2 0 4-1 5-2H10c1 1 3 2 5 2z" />
      <rect x="18" y="41.5" width="12" height="2" rx="0.5" />
    </svg>
  )
}

/**
 * Stamped plate mounting bolt / screw head indentation.
 */
function PlateMountingBolt({ className = "w-2 h-2" }: { className?: string }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] border border-[#475569]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_1px_2px_rgba(0,0,0,0.35)] flex items-center justify-center pointer-events-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      <div className="w-[60%] h-[1.2px] bg-[#334155] rounded-full rotate-45 shadow-[0_0.5px_0_rgba(255,255,255,0.4)]" />
    </div>
  )
}

export interface AfghanTruckPlateProps {
  /** Combined raw truck plate string (e.g. "2877 کابل", "35974 کابل", "24345 کابل ل", "3292 هلمند") */
  value?: string
  /** Explicit registration number */
  plateNumber?: string
  /** Explicit province name (Dari/Pashto or English) */
  province?: string
  /** Explicit 3-letter province code */
  provinceEn?: string
  /** Explicit plate letter (e.g. "ل" or "L") */
  plateLetter?: string
  /** Plate letter in Latin */
  plateLetterEn?: string
  /** Visual scale */
  size?: "compact" | "default" | "sm" | "md" | "lg" | "responsive"
  /** Show official emblem on bottom left beside province code */
  showEmblem?: boolean
  /** Show realistic stamped metal mounting bolts */
  showBolts?: boolean
  /** Additional CSS class names */
  className?: string
  /** Custom inline styles */
  style?: React.CSSProperties
}

/**
 * <AfghanTruckPlate />
 *
 * Authentic Afghanistan Vehicle Registration License Plate Component.
 * Faithfully matches real physical Afghan commercial truck number plates:
 * - Stamped aluminum metal finish with light ivory background and debossed inner perimeter groove
 * - Bold dark charcoal/black outer frame with subtle metal stamped corners (not pill-shaped)
 * - Top row: Dari/Pashto Province (Left), Persian Numerals with wide authentic letter-spacing (Right)
 * - Bottom row: National Emblem & 3-letter Latin Serif Code (Left), Latin Serif Numerals (Right)
 * - Persian numerals align directly above the matching Latin numerals on the right
 * - Dari province aligns directly above the National Emblem + Latin abbreviation on the left
 * - RTL/LTR isolation: digits and letters strictly preserve their correct reading order
 * - Clean automotive aesthetic free of artificial badges, gradients, or oversized icons
 */
export function AfghanTruckPlate({
  value,
  plateNumber: explicitNumber,
  province: explicitProvince,
  provinceEn: explicitProvinceEn,
  plateLetter: explicitLetter,
  plateLetterEn: explicitLetterEn,
  size = "compact",
  showEmblem = true,
  showBolts = true,
  className = "",
  style,
}: AfghanTruckPlateProps) {
  // Parse or compute data
  const data = useMemo(() => {
    const parsed = parseAfghanPlate(value || explicitNumber || "")

    const finalNumber = explicitNumber ? convertToLatinDigits(explicitNumber.trim()) : parsed.plateNumber
    const finalNumberFa = finalNumber ? convertToPersianDigits(finalNumber) : parsed.plateNumberFa

    let finalProvFa = parsed.provinceFa
    let finalProvCode = parsed.provinceCode

    if (explicitProvince) {
      const info = getProvinceInfo(explicitProvince)
      finalProvFa = info.nameFa
      finalProvCode = explicitProvinceEn ? explicitProvinceEn.toUpperCase() : info.code
    } else if (explicitProvinceEn) {
      finalProvCode = explicitProvinceEn.toUpperCase()
    }

    let finalLetterFa = parsed.plateLetterFa
    let finalLetterEn = parsed.plateLetterEn

    if (explicitLetter) {
      const letterInfo = AFGHAN_PLATE_LETTERS[explicitLetter] || {
        fa: explicitLetter,
        en: explicitLetterEn || explicitLetter.toUpperCase(),
      }
      finalLetterFa = letterInfo.fa
      finalLetterEn = explicitLetterEn || letterInfo.en
    } else if (explicitLetterEn) {
      const letterInfo = AFGHAN_PLATE_LETTERS[explicitLetterEn] || {
        fa: explicitLetterEn,
        en: explicitLetterEn.toUpperCase(),
      }
      finalLetterFa = letterInfo.fa
      finalLetterEn = explicitLetterEn.toUpperCase()
    }

    const hasLetter = Boolean(finalLetterFa && finalLetterEn)

    return {
      number: finalNumber,
      numberFa: finalNumberFa,
      provinceFa: finalProvFa,
      provinceCode: finalProvCode,
      letterFa: finalLetterFa,
      letterEn: finalLetterEn,
      hasLetter,
    }
  }, [value, explicitNumber, explicitProvince, explicitProvinceEn, explicitLetter, explicitLetterEn])

  // Precision dimensional presets matching real license plate proportions (~3.9:1 aspect ratio)
  const sizeStyles = {
    compact: {
      container: "w-[196px] h-[50px] rounded-[6px]",
      border: "border-[2.2px] border-[#161616]",
      insetRim: "inset-[2.5px] rounded-[4px] border border-slate-400/50",
      padding: "pl-3.5 pr-3.5 py-1.5",
      provFa: "text-[11pt] leading-none",
      numFa: "text-[14pt] leading-none tracking-[0.2em]",
      letterFa: "text-[11pt] leading-none",
      emblem: "w-3.5 h-3.5",
      provEn: "text-[9pt] leading-none tracking-[0.04em]",
      numEn: "text-[13pt] leading-none tracking-[0.06em]",
      letterEn: "text-[9pt] leading-none",
      bolt: "w-2 h-2",
      boltLeft: "left-[3.5px]",
      boltRight: "right-[3.5px]",
    },
    sm: {
      container: "w-[158px] h-[40px] rounded-[5px]",
      border: "border-[1.8px] border-[#161616]",
      insetRim: "inset-[2px] rounded-[3px] border border-slate-400/50",
      padding: "pl-2.5 pr-2.5 py-1",
      provFa: "text-[9pt] leading-none",
      numFa: "text-[11.5pt] leading-none tracking-[0.18em]",
      letterFa: "text-[9pt] leading-none",
      emblem: "w-3 h-3",
      provEn: "text-[7.5pt] leading-none tracking-[0.04em]",
      numEn: "text-[10.5pt] leading-none tracking-[0.05em]",
      letterEn: "text-[7.5pt] leading-none",
      bolt: "w-1.5 h-1.5",
      boltLeft: "left-[2.5px]",
      boltRight: "right-[2.5px]",
    },
    default: {
      container: "w-[236px] h-[60px] rounded-[7px]",
      border: "border-[2.5px] border-[#161616]",
      insetRim: "inset-[3px] rounded-[5px] border border-slate-400/50",
      padding: "pl-4 pr-4 py-2",
      provFa: "text-[13.5pt] leading-none",
      numFa: "text-[17pt] leading-none tracking-[0.22em]",
      letterFa: "text-[13.5pt] leading-none",
      emblem: "w-4.5 h-4.5",
      provEn: "text-[11pt] leading-none tracking-[0.05em]",
      numEn: "text-[16pt] leading-none tracking-[0.07em]",
      letterEn: "text-[11pt] leading-none",
      bolt: "w-2.5 h-2.5",
      boltLeft: "left-[4px]",
      boltRight: "right-[4px]",
    },
    md: {
      container: "w-[268px] h-[68px] rounded-[8px]",
      border: "border-[2.8px] border-[#161616]",
      insetRim: "inset-[3.5px] rounded-[5.5px] border border-slate-400/50",
      padding: "pl-4.5 pr-4.5 py-2",
      provFa: "text-[15pt] leading-none",
      numFa: "text-[19pt] leading-none tracking-[0.24em]",
      letterFa: "text-[15pt] leading-none",
      emblem: "w-5 h-5",
      provEn: "text-[12.5pt] leading-none tracking-[0.05em]",
      numEn: "text-[18pt] leading-none tracking-[0.08em]",
      letterEn: "text-[12.5pt] leading-none",
      bolt: "w-2.5 h-2.5",
      boltLeft: "left-[4px]",
      boltRight: "right-[4px]",
    },
    lg: {
      container: "w-[324px] h-[82px] rounded-[9px]",
      border: "border-[3px] border-[#161616]",
      insetRim: "inset-[4px] rounded-[6px] border border-slate-400/50",
      padding: "pl-5 pr-5 py-2.5",
      provFa: "text-[18pt] leading-none",
      numFa: "text-[23pt] leading-none tracking-[0.25em]",
      letterFa: "text-[18pt] leading-none",
      emblem: "w-6 h-6",
      provEn: "text-[15pt] leading-none tracking-[0.05em]",
      numEn: "text-[22pt] leading-none tracking-[0.08em]",
      letterEn: "text-[15pt] leading-none",
      bolt: "w-3 h-3",
      boltLeft: "left-[4.5px]",
      boltRight: "right-[4.5px]",
    },
    responsive: {
      container: "w-full max-w-[280px] aspect-[3.92/1] rounded-[7px]",
      border: "border-[2.2px] border-[#161616]",
      insetRim: "inset-[3px] rounded-[5px] border border-slate-400/50",
      padding: "px-[5%] py-[2%]",
      provFa: "text-[clamp(10px,2.8vw,15pt)] leading-none",
      numFa: "text-[clamp(13px,3.8vw,20pt)] leading-none tracking-[0.22em]",
      letterFa: "text-[clamp(10px,2.8vw,15pt)] leading-none",
      emblem: "w-[clamp(12px,2.6vw,20px)] h-[clamp(12px,2.6vw,20px)]",
      provEn: "text-[clamp(8px,2.2vw,12pt)] leading-none tracking-[0.05em]",
      numEn: "text-[clamp(12px,3.4vw,18pt)] leading-none tracking-[0.07em]",
      letterEn: "text-[clamp(8px,2.2vw,12pt)] leading-none",
      bolt: "w-[clamp(6px,1.5vw,10px)] h-[clamp(6px,1.5vw,10px)]",
      boltLeft: "left-[2%]",
      boltRight: "right-[2%]",
    },
  }[size]

  return (
    <div
      data-afghan-plate="true"
      dir="ltr"
      className={`relative inline-flex flex-col justify-between shrink-0 select-none overflow-hidden ${sizeStyles.container} ${sizeStyles.border} bg-gradient-to-b from-[#fdfcf9] via-[#f7f6f1] to-[#edece4] text-black shadow-sm ${className}`}
      style={{
        boxShadow:
          "inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(0, 0, 0, 0.08), 0 2px 5px -1px rgba(0, 0, 0, 0.22), 0 1px 2px rgba(0, 0, 0, 0.12)",
        ...style,
      }}
      title={`Afghanistan Vehicle Registration Plate: ${data.provinceCode} ${data.number}${data.hasLetter ? ` ${data.letterEn}` : ""}`}
    >
      {/* Stamped plate inner debossed rim line */}
      <div
        className={`pointer-events-none absolute ${sizeStyles.insetRim} shadow-[inset_0_0.5px_0_rgba(255,255,255,0.9),0_0.5px_0_rgba(255,255,255,0.7)]`}
        aria-hidden="true"
      />

      {/* Left Stamped Mounting Bolt */}
      {showBolts && (
        <div className={`absolute ${sizeStyles.boltLeft} top-1/2 -translate-y-1/2 z-20 pointer-events-none`}>
          <PlateMountingBolt className={sizeStyles.bolt} />
        </div>
      )}

      {/* Right Stamped Mounting Bolt */}
      {showBolts && (
        <div className={`absolute ${sizeStyles.boltRight} top-1/2 -translate-y-1/2 z-20 pointer-events-none`}>
          <PlateMountingBolt className={sizeStyles.bolt} />
        </div>
      )}

      {/* Plate Content: Exactly 2 rows (Top: Dari Province + Persian Numerals, Bottom: Emblem + Latin Code + Latin Numerals) */}
      <div className={`relative z-10 flex flex-col justify-between h-full w-full min-w-0 ${sizeStyles.padding}`}>
        {/* TOP ROW: Dari Province (Left) + Persian Numerals (Right) */}
        <div className="flex items-center justify-between w-full min-w-0 leading-none">
          {/* Top Left: Province in Dari/Pashto Naskh */}
          <div className="flex items-center min-w-0">
            <span
              dir="rtl"
              className={`font-[vazirmatn] font-black text-black select-text ${sizeStyles.provFa}`}
              style={{
                fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", "Traditional Arabic", Tahoma, serif',
                textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
              }}
            >
              {data.provinceFa}
            </span>
          </div>

          {/* Top Right: Persian Numerals + Optional Letter */}
          <div className="flex items-center justify-end min-w-0">
            <span
              dir="ltr"
              className={`font-[vazirmatn] font-black text-black text-right tabular-nums select-text ${sizeStyles.numFa}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", Tahoma, sans-serif',
                textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
              }}
            >
              {data.numberFa}
            </span>
            {data.hasLetter && (
              <span
                dir="rtl"
                className={`font-[vazirmatn] font-black text-black ml-1.5 pl-1.5 border-l border-slate-400/60 select-text ${sizeStyles.letterFa}`}
                style={{
                  fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", "Traditional Arabic", Tahoma, serif',
                  textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
                }}
              >
                {data.letterFa}
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: National Emblem + Latin Code (Left) + Latin Numerals (Right) */}
        <div className="flex items-center justify-between w-full min-w-0 leading-none">
          {/* Bottom Left: Afghan Emblem + Latin Province Code */}
          <div className="flex items-center gap-1.5 min-w-0">
            {showEmblem && (
              <div className="shrink-0 text-black flex items-center" aria-hidden="true">
                <AfghanNationalPlateEmblem className={sizeStyles.emblem} />
              </div>
            )}
            <span
              className={`font-serif font-black text-black uppercase select-text ${sizeStyles.provEn}`}
              style={{
                fontFamily: '"Times New Roman", Times, Georgia, "Liberation Serif", serif',
                textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
              }}
            >
              {data.provinceCode}
            </span>
          </div>

          {/* Bottom Right: Latin Numerals + Optional Letter */}
          <div className="flex items-center justify-end min-w-0">
            <span
              dir="ltr"
              className={`font-serif font-black text-black text-right tabular-nums select-text ${sizeStyles.numEn}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: '"Times New Roman", Times, Georgia, "Liberation Serif", serif',
                textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
              }}
            >
              {data.number}
            </span>
            {data.hasLetter && (
              <span
                className={`font-serif font-black text-black uppercase ml-1.5 pl-1.5 border-l border-slate-400/60 select-text ${sizeStyles.letterEn}`}
                style={{
                  fontFamily: '"Times New Roman", Times, Georgia, "Liberation Serif", serif',
                  textShadow: "0 0.5px 0 rgba(255, 255, 255, 0.85)",
                }}
              >
                {data.letterEn}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AfghanTruckPlate
