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
import { KABUL_LANDMARK_DATA_URI } from "@/lib/utils/afghan-plate-landmark"

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

export interface AfghanVehiclePlateProps {
  /** Combined raw truck/vehicle plate string (e.g. "12346 کابل ل", "3292 هلمند", "2877 کابل", "35974 کابل", "38663-HRT", "2142نیمروز") */
  value?: string
  /** Explicit registration number (e.g. "12346" or "3292" or "2142") */
  plateNumber?: string
  /** Explicit province name (Dari/Pashto or English, e.g. "کابل" or "هلمند" or "نیمروز") */
  province?: string
  /** Explicit 3-letter province code (e.g. "KBL" or "HLM" or "NRZ") */
  provinceEn?: string
  /** Explicit plate classification letter (e.g. "ل" or "L") */
  plateLetter?: string
  /** Plate letter in Latin (e.g. "L") */
  plateLetterEn?: string
  /** Fallback category letter to use if none is in the input. Defaults to "ل" (commercial transport/truck). */
  defaultLetter?: string
  /** Fallback Latin category letter. Defaults to "L". */
  defaultLetterEn?: string
  /** Visual scale or size variant */
  size?: "compact" | "sm" | "default" | "md" | "lg" | "responsive"
  /** Whether to show the classification letter on the right. Defaults to true. */
  showLetter?: boolean
  /** Additional CSS class names */
  className?: string
  /** Custom inline styles */
  style?: React.CSSProperties
}

/**
 * <AfghanVehiclePlate />
 *
 * Official Afghanistan Vehicle Registration Plate UI Component.
 * Pixel-faithful, 1:1 same-to-same recreation of the official Afghanistan vehicle number plate:
 * - Pure white background (#ffffff) with crisp solid black border & slightly rounded corners
 * - Strictly NO shadows, gradients, metallic effects, debossed grooves, screws, or fake bolt heads
 * - Top row:
 *     - Left: Dari/Pashto Province (e.g. کابل / نیمروز / هلمند) in bold Dari typography with safe left breathing room
 *     - Center: Persian numerals (e.g. ۱۲۳۴۶ / ۲۱۴۲) with individually isolated digits to guarantee 100% legibility & prevent ligature overlap
 *     - Right: Dari category letter (e.g. ل)
 * - Upper-Left: Authentic Kabul landmark architectural line-art illustration
 * - Bottom row:
 *     - Left: 3-letter Latin province code (e.g. KBL / NRZ / HLM) in bold uppercase DIN font
 *     - Center: Latin numerals (e.g. 12346 / 2142) in large bold DIN/license-plate font with 1:1 vertical column alignment
 *     - Right: Latin category letter (e.g. L)
 * - Strict RTL / LTR isolation: digits and letters strictly preserve their correct reading order
 * - Fully dynamic: connects to database records while matching authentic physical plate proportions (2.62:1 aspect ratio)
 */
export function AfghanVehiclePlate({
  value,
  plateNumber: explicitNumber,
  province: explicitProvince,
  provinceEn: explicitProvinceEn,
  plateLetter: explicitLetter,
  plateLetterEn: explicitLetterEn,
  defaultLetter = "ل",
  defaultLetterEn = "L",
  size = "compact",
  showLetter = true,
  className = "",
  style,
}: AfghanVehiclePlateProps) {
  // Parse or compute data
  const data = useMemo(() => {
    const rawInput = value || explicitNumber || ""
    const isReferenceDefault = !rawInput && !explicitProvince && !explicitLetter

    if (isReferenceDefault) {
      return {
        number: "12346",
        numberFa: "۱۲۳۴۶",
        provinceFa: "کابل",
        provinceCode: "KBL",
        letterFa: "ل",
        letterEn: "L",
        hasLetter: showLetter,
      }
    }

    const parsed = parseAfghanPlate(rawInput)

    const finalNumber = explicitNumber ? convertToLatinDigits(explicitNumber.trim()) : (parsed.plateNumber || "12346")
    const finalNumberFa = finalNumber ? convertToPersianDigits(finalNumber) : (parsed.plateNumberFa || "۱۲۳۴۶")

    let finalProvFa = parsed.provinceFa || "کابل"
    let finalProvCode = parsed.provinceCode || "KBL"

    if (explicitProvince) {
      const info = getProvinceInfo(explicitProvince)
      finalProvFa = info.nameFa
      finalProvCode = explicitProvinceEn ? explicitProvinceEn.toUpperCase() : info.code
    } else if (explicitProvinceEn) {
      finalProvCode = explicitProvinceEn.toUpperCase()
    }

    // Determine category letter
    let finalLetterFa = parsed.plateLetterFa || defaultLetter || "ل"
    let finalLetterEn = parsed.plateLetterEn || defaultLetterEn || "L"

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

    return {
      number: finalNumber,
      numberFa: finalNumberFa,
      provinceFa: finalProvFa,
      provinceCode: finalProvCode,
      letterFa: finalLetterFa,
      letterEn: finalLetterEn,
      hasLetter: Boolean(showLetter && (finalLetterFa || finalLetterEn)),
    }
  }, [value, explicitNumber, explicitProvince, explicitProvinceEn, explicitLetter, explicitLetterEn, defaultLetter, defaultLetterEn, showLetter])

  // Precise sizing configurations preserving the exact 2.62:1 aspect ratio
  // and ensuring Persian numerals match Latin numerals in visual weight
  const sizeStyles = {
    sm: {
      container: "w-[166px] h-[63px] aspect-[2.62/1] rounded-[5px]",
      border: "border-[1.6px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[12pt] leading-none",
      provFaLong: "text-[10pt] leading-none",
      landmarkH: "h-[14px]",
      provEn: "text-[10.5pt] leading-none tracking-[0.06em]",
      numFa: "text-[20pt] leading-none",
      numEn: "text-[16pt] leading-none",
      digitGapFa: "0.12em",
      digitGapEn: "0.06em",
      letterFa: "text-[13pt] leading-none",
      letterEn: "text-[11pt] leading-none",
    },
    compact: {
      container: "w-[194px] h-[74px] aspect-[2.62/1] rounded-[6px]",
      border: "border-[1.8px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[14pt] leading-none",
      provFaLong: "text-[11.5pt] leading-none",
      landmarkH: "h-[18px]",
      provEn: "text-[12pt] leading-none tracking-[0.06em]",
      numFa: "text-[24pt] leading-none",
      numEn: "text-[19pt] leading-none",
      digitGapFa: "0.14em",
      digitGapEn: "0.08em",
      letterFa: "text-[15pt] leading-none",
      letterEn: "text-[12.5pt] leading-none",
    },
    default: {
      container: "w-[240px] h-[91px] aspect-[2.62/1] rounded-[7px]",
      border: "border-[2px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[17.5pt] leading-none",
      provFaLong: "text-[14.5pt] leading-none",
      landmarkH: "h-[22px]",
      provEn: "text-[15pt] leading-none tracking-[0.06em]",
      numFa: "text-[29pt] leading-none",
      numEn: "text-[23.5pt] leading-none",
      digitGapFa: "0.15em",
      digitGapEn: "0.08em",
      letterFa: "text-[19pt] leading-none",
      letterEn: "text-[15.5pt] leading-none",
    },
    md: {
      container: "w-[275px] h-[105px] aspect-[2.62/1] rounded-[8px]",
      border: "border-[2.5px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[20pt] leading-none",
      provFaLong: "text-[17pt] leading-none",
      landmarkH: "h-[26px]",
      provEn: "text-[17.5pt] leading-none tracking-[0.06em]",
      numFa: "text-[34pt] leading-none",
      numEn: "text-[27.5pt] leading-none",
      digitGapFa: "0.15em",
      digitGapEn: "0.08em",
      letterFa: "text-[22pt] leading-none",
      letterEn: "text-[18pt] leading-none",
    },
    lg: {
      container: "w-[330px] h-[126px] aspect-[2.62/1] rounded-[10px]",
      border: "border-[3px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[24pt] leading-none",
      provFaLong: "text-[20pt] leading-none",
      landmarkH: "h-[32px]",
      provEn: "text-[21pt] leading-none tracking-[0.06em]",
      numFa: "text-[41pt] leading-none",
      numEn: "text-[33pt] leading-none",
      digitGapFa: "0.16em",
      digitGapEn: "0.08em",
      letterFa: "text-[26pt] leading-none",
      letterEn: "text-[21pt] leading-none",
    },
    responsive: {
      container: "w-full max-w-[280px] aspect-[2.62/1] rounded-[6px]",
      border: "border-[2px] border-black",
      padding: "px-[3%] py-[2%]",
      provFa: "text-[clamp(12px,4.0vw,20pt)] leading-none",
      provFaLong: "text-[clamp(10px,3.2vw,16pt)] leading-none",
      landmarkH: "h-[clamp(12px,3.6vw,25px)]",
      provEn: "text-[clamp(10px,3.4vw,17pt)] leading-none tracking-[0.06em]",
      numFa: "text-[clamp(16px,6.0vw,31pt)] leading-none",
      numEn: "text-[clamp(13px,4.8vw,25pt)] leading-none",
      digitGapFa: "0.14em",
      digitGapEn: "0.08em",
      letterFa: "text-[clamp(13px,4.3vw,21pt)] leading-none",
      letterEn: "text-[clamp(11px,3.6vw,17pt)] leading-none",
    },
  }[size]

  const persianFontFamily = '"AfghanPlateFa", "NotoNaskhArabic", "Noto Naskh Arabic", "Vazirmatn", "Segoe UI", Tahoma, Arial, sans-serif'
  const latinFontFamily = '"Bahnschrift", "DIN Alternate", "DIN Condensed", "Franklin Gothic Medium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif'

  // Split digits into distinct characters to guarantee no HarfBuzz cursive joining or ligature collisions
  const digitsFa = useMemo(() => String(data.numberFa || "").split(""), [data.numberFa])
  const digitsEn = useMemo(() => String(data.number || "").split(""), [data.number])

  const isLongProvince = Boolean(data.provinceFa && data.provinceFa.length > 4)

  return (
    <div
      data-afghan-plate="true"
      dir="ltr"
      className={`relative inline-flex bg-white text-black shrink-0 select-none overflow-hidden ${sizeStyles.container} ${sizeStyles.border} ${className}`}
      style={{
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        aspectRatio: "2.62 / 1",
        ...style,
      }}
      title={`Afghanistan Vehicle Registration Plate: ${data.provinceCode} ${data.number}${data.hasLetter ? ` ${data.letterEn}` : ""}`}
    >
      <div className={`relative flex items-center justify-between w-full h-full min-w-0 ${sizeStyles.padding}`}>
        {/* ========================================================================= */}
        {/* COLUMN 1 (LEFT): Dari Province + Landmark Illustration + Latin Province    */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between items-center text-center h-full w-[26%] min-w-0 pl-[0.5%] pr-[0.5%] py-[0.5%]">
          {/* Top Left: Dari/Pashto Province (e.g. کابل / هلمند / نیمروز) */}
          <div className="flex items-center justify-center w-full h-[33%] min-w-0">
            <span
              dir="rtl"
              className={`font-black text-black select-text text-center truncate ${
                isLongProvince ? sizeStyles.provFaLong : sizeStyles.provFa
              }`}
              style={{
                fontFamily: persianFontFamily,
                fontWeight: 900,
                color: "#000000",
                maxWidth: "100%",
              }}
            >
              {data.provinceFa}
            </span>
          </div>

          {/* Middle Left: Architectural Landmark Illustration */}
          <div className="flex items-center justify-center w-full h-[34%] pointer-events-none overflow-hidden my-auto" aria-hidden="true">
            <img
              src={KABUL_LANDMARK_DATA_URI}
              alt=""
              className={`${sizeStyles.landmarkH} w-auto max-h-full max-w-[82%] object-contain select-none`}
              style={{
                filter: "contrast(1.15) brightness(0.92)",
                opacity: 1,
                display: "block",
              }}
              draggable={false}
              loading="eager"
            />
          </div>

          {/* Bottom Left: Latin Province Code (e.g. KBL / HLM / NRZ) */}
          <div className="flex items-center justify-center w-full h-[33%] min-w-0">
            <span
              className={`font-black text-black uppercase select-text text-center ${sizeStyles.provEn}`}
              style={{
                fontFamily: latinFontFamily,
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.provinceCode}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2 (CENTER): Persian Digits + Latin Digits                          */}
        {/* ========================================================================= */}
        <div className={`flex flex-col justify-center items-center text-center h-full flex-1 min-w-0 ${data.hasLetter ? "px-[1.5%]" : "px-[3%]"} py-[0.5%]`}>
          {/* Top Center: Persian Numerals (e.g. ۱۲۳۴۶ / ۲۱۴۲) */}
          <div className="flex items-center justify-center w-full h-1/2 min-w-0 pt-[1%] overflow-hidden">
            <div
              className="flex items-center justify-center min-w-0 tabular-nums"
              style={{
                gap: sizeStyles.digitGapFa,
                direction: "ltr",
                unicodeBidi: "isolate",
              }}
              dir="ltr"
            >
              {digitsFa.map((digit, idx) => (
                <span
                  key={idx}
                  className={`font-black text-black text-center tabular-nums select-text ${sizeStyles.numFa}`}
                  style={{
                    direction: "ltr",
                    unicodeBidi: "isolate",
                    fontFamily: persianFontFamily,
                    fontWeight: 900,
                    lineHeight: 1,
                    display: "inline-block",
                    color: "#000000",
                  }}
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Center: Latin Numerals (e.g. 12346 / 2142) */}
          <div className="flex items-center justify-center w-full h-1/2 min-w-0 pb-[1%] overflow-hidden">
            <div
              className="flex items-center justify-center min-w-0 tabular-nums"
              style={{
                gap: sizeStyles.digitGapEn,
                direction: "ltr",
                unicodeBidi: "isolate",
              }}
              dir="ltr"
            >
              {digitsEn.map((digit, idx) => (
                <span
                  key={idx}
                  className={`font-black text-black text-center tabular-nums select-text ${sizeStyles.numEn}`}
                  style={{
                    direction: "ltr",
                    unicodeBidi: "isolate",
                    fontFamily: latinFontFamily,
                    fontWeight: 900,
                    lineHeight: 1,
                    display: "inline-block",
                    color: "#000000",
                  }}
                >
                  {digit}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3 (RIGHT): Dari Letter + Latin Letter                              */}
        {/* ========================================================================= */}
        {data.hasLetter && (
          <div className="flex flex-col justify-between items-center text-center h-full w-[15%] min-w-0 pl-[0.5%] pr-[1%] py-[0.5%]">
            {/* Top Right: Dari Category Letter (e.g. ل) - Aligned with Top Row */}
            <div className="flex items-center justify-center w-full h-[33%] min-w-0">
              <span
                dir="rtl"
                className={`font-black text-black select-text text-center ${sizeStyles.letterFa}`}
                style={{
                  fontFamily: persianFontFamily,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#000000",
                }}
              >
                {data.letterFa}
              </span>
            </div>

            {/* Middle Spacer between Dari and Latin letter (aligned with landmark space, guaranteed separation) */}
            <div className="w-full h-[34%] min-h-[14px] flex-1 pointer-events-none" aria-hidden="true" />

            {/* Bottom Right: Latin Category Letter (e.g. L) - Aligned with Bottom Row */}
            <div className="flex items-center justify-center w-full h-[33%] min-w-0">
              <span
                className={`font-black text-black uppercase select-text text-center ${sizeStyles.letterEn}`}
                style={{
                  fontFamily: latinFontFamily,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#000000",
                }}
              >
                {data.letterEn}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AfghanVehiclePlate
