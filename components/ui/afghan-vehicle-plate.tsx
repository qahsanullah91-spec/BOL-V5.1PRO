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
  /** Combined raw truck/vehicle plate string (e.g. "12346 کابل ل", "3292 هلمند", "2877 کابل", "35974 کابل", "38663-HRT") */
  value?: string
  /** Explicit registration number (e.g. "12346" or "3292") */
  plateNumber?: string
  /** Explicit province name (Dari/Pashto or English, e.g. "کابل" or "هلمند") */
  province?: string
  /** Explicit 3-letter province code (e.g. "KBL" or "HLM") */
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
 *     - Left: Dari/Pashto Province (e.g. کابل / هلمند) in bold Dari typography
 *     - Center: Persian numerals (e.g. ۱۲۳۴۶ / ۳۲۹۲) with authentic proportions & vertical alignment
 *     - Right: Dari category letter (e.g. ل)
 * - Upper-Left: Authentic Kabul landmark architectural line-art illustration
 * - Bottom row:
 *     - Left: 3-letter Latin province code (e.g. KBL / HLM) in bold uppercase
 *     - Center: Latin numerals (e.g. 12346 / 3292) in large bold DIN/license-plate font
 *     - Right: Latin category letter (e.g. L)
 * - Strict RTL / LTR isolation: digits and letters strictly preserve their correct reading order
 * - Fully dynamic: connects to database records while matching authentic physical plate proportions
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
  // and ensuring Persian numerals (38% height) match Latin numerals (35% height)
  const sizeStyles = {
    compact: {
      container: "w-[204px] h-[78px] rounded-[6px]",
      border: "border-[1.8px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[13pt] leading-none",
      landmarkH: "h-[19px]",
      provEn: "text-[10pt] leading-none tracking-[0.06em]",
      numFa: "text-[27pt] leading-none tracking-[0.06em]",
      numEn: "text-[21pt] leading-none tracking-[0.02em]",
      letterFa: "text-[17.5pt] leading-none",
      letterEn: "text-[13pt] leading-none",
    },
    sm: {
      container: "w-[172px] h-[66px] rounded-[5px]",
      border: "border-[1.6px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[11pt] leading-none",
      landmarkH: "h-[16px]",
      provEn: "text-[8.5pt] leading-none tracking-[0.06em]",
      numFa: "text-[23pt] leading-none tracking-[0.06em]",
      numEn: "text-[18pt] leading-none tracking-[0.02em]",
      letterFa: "text-[15pt] leading-none",
      letterEn: "text-[11pt] leading-none",
    },
    default: {
      container: "w-[250px] h-[95px] rounded-[7px]",
      border: "border-[2.2px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[16pt] leading-none",
      landmarkH: "h-[23px]",
      provEn: "text-[12.5pt] leading-none tracking-[0.06em]",
      numFa: "text-[33pt] leading-none tracking-[0.06em]",
      numEn: "text-[26pt] leading-none tracking-[0.02em]",
      letterFa: "text-[21pt] leading-none",
      letterEn: "text-[16pt] leading-none",
    },
    md: {
      container: "w-[285px] h-[108px] rounded-[8px]",
      border: "border-[2.5px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[18pt] leading-none",
      landmarkH: "h-[26px]",
      provEn: "text-[14pt] leading-none tracking-[0.06em]",
      numFa: "text-[38pt] leading-none tracking-[0.06em]",
      numEn: "text-[30pt] leading-none tracking-[0.02em]",
      letterFa: "text-[24pt] leading-none",
      letterEn: "text-[18.5pt] leading-none",
    },
    lg: {
      container: "w-[350px] h-[133px] rounded-[10px]",
      border: "border-[3px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[22pt] leading-none",
      landmarkH: "h-[32px]",
      provEn: "text-[17.5pt] leading-none tracking-[0.06em]",
      numFa: "text-[46pt] leading-none tracking-[0.06em]",
      numEn: "text-[37pt] leading-none tracking-[0.02em]",
      letterFa: "text-[29pt] leading-none",
      letterEn: "text-[23pt] leading-none",
    },
    responsive: {
      container: "w-full max-w-[320px] aspect-[2.62/1] rounded-[7px]",
      border: "border-[2px] border-black",
      padding: "px-[2.5%] py-[2%]",
      provFa: "text-[clamp(11px,3.8vw,20pt)] leading-none",
      landmarkH: "h-[clamp(14px,4.8vw,28px)]",
      provEn: "text-[clamp(9px,3.0vw,16pt)] leading-none tracking-[0.06em]",
      numFa: "text-[clamp(18px,6.8vw,36pt)] leading-none tracking-[0.06em]",
      numEn: "text-[clamp(15px,5.4vw,28pt)] leading-none tracking-[0.02em]",
      letterFa: "text-[clamp(12px,4.2vw,22pt)] leading-none",
      letterEn: "text-[clamp(10px,3.5vw,18pt)] leading-none",
    },
  }[size]

  const persianFontFamily = '"AfghanPlateFa", "NotoNaskhArabic", "Noto Naskh Arabic", "Vazirmatn", "Segoe UI", Tahoma, Arial, sans-serif'
  const latinFontFamily = '"Bahnschrift", "DIN Alternate", "DIN Condensed", "Franklin Gothic Medium", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Arial Black", sans-serif'

  return (
    <div
      data-afghan-plate="true"
      dir="ltr"
      className={`relative inline-flex bg-white text-black shrink-0 select-none overflow-hidden ${sizeStyles.container} ${sizeStyles.border} ${className}`}
      style={{
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        ...style,
      }}
      title={`Afghanistan Vehicle Registration Plate: ${data.provinceCode} ${data.number}${data.hasLetter ? ` ${data.letterEn}` : ""}`}
    >
      <div className={`relative flex items-center justify-between w-full h-full min-w-0 ${sizeStyles.padding}`}>
        {/* ========================================================================= */}
        {/* COLUMN 1 (LEFT): Dari Province + Landmark Illustration + Latin Province    */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between items-center text-center h-full w-[21%] min-w-0 py-[1%]">
          {/* Top Left: Dari/Pashto Province (e.g. کابل / هلمند) */}
          <div className="flex items-center justify-center w-full h-[36%] min-w-0">
            <span
              dir="rtl"
              className={`font-black text-black select-text ${sizeStyles.provFa}`}
              style={{
                fontFamily: persianFontFamily,
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.provinceFa}
            </span>
          </div>

          {/* Middle Left: Architectural Landmark Illustration */}
          <div className="flex items-center justify-center w-full h-[28%] pointer-events-none" aria-hidden="true">
            <img
              src={KABUL_LANDMARK_DATA_URI}
              alt=""
              className={`${sizeStyles.landmarkH} w-auto object-contain select-none`}
              style={{
                filter: "contrast(1.08) brightness(0.95)",
                maxWidth: "100%",
              }}
            />
          </div>

          {/* Bottom Left: Latin Province Code (e.g. KBL / HLM) */}
          <div className="flex items-center justify-center w-full h-[36%] min-w-0">
            <span
              className={`font-black text-black uppercase select-text ${sizeStyles.provEn}`}
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
        <div className={`flex flex-col justify-center items-center text-center h-full flex-1 min-w-0 ${data.hasLetter ? "px-[1.5%]" : "px-[4%]"} py-[0.5%]`}>
          {/* Top Center: Persian Numerals (e.g. ۱۲۳۴۶ / ۳۲۹۲) */}
          <div className="flex items-center justify-center w-full h-1/2 min-w-0 pt-[2%]">
            <span
              dir="ltr"
              className={`font-black text-black text-center tabular-nums select-text ${sizeStyles.numFa}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: persianFontFamily,
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.numberFa}
            </span>
          </div>

          {/* Bottom Center: Latin Numerals (e.g. 12346 / 3292) */}
          <div className="flex items-center justify-center w-full h-1/2 min-w-0 pb-[1%]">
            <span
              dir="ltr"
              className={`font-black text-black text-center tabular-nums select-text ${sizeStyles.numEn}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: latinFontFamily,
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.number}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3 (RIGHT): Dari Letter + Latin Letter                              */}
        {/* ========================================================================= */}
        {data.hasLetter && (
          <div className="flex flex-col justify-between items-center text-center h-full w-[14%] min-w-0 py-[1%]">
            {/* Top Right: Dari Category Letter (e.g. ل) */}
            <div className="flex items-center justify-center w-full h-1/2 min-w-0 pt-[2%]">
              <span
                dir="rtl"
                className={`font-black text-black select-text ${sizeStyles.letterFa}`}
                style={{
                  fontFamily: persianFontFamily,
                  fontWeight: 900,
                  color: "#000000",
                }}
              >
                {data.letterFa}
              </span>
            </div>

            {/* Bottom Right: Latin Category Letter (e.g. L) */}
            <div className="flex items-center justify-center w-full h-1/2 min-w-0 pb-[1%]">
              <span
                className={`font-black text-black uppercase select-text ${sizeStyles.letterEn}`}
                style={{
                  fontFamily: latinFontFamily,
                  fontWeight: 900,
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
