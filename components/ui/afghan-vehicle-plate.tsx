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
  /** Combined raw truck/vehicle plate string (e.g. "12346 کابل ل", "2877 کابل", "35974 کابل", "24345 کابل ل", "38663-HRT") */
  value?: string
  /** Explicit registration number (e.g. "12346") */
  plateNumber?: string
  /** Explicit province name (Dari/Pashto or English, e.g. "کابل") */
  province?: string
  /** Explicit 3-letter province code (e.g. "KBL") */
  provinceEn?: string
  /** Explicit plate classification letter (e.g. "ل" or "L") */
  plateLetter?: string
  /** Plate letter in Latin (e.g. "L") */
  plateLetterEn?: string
  /** Visual scale or size variant */
  size?: "compact" | "sm" | "default" | "md" | "lg" | "responsive"
  /** Whether to show the classification letter on the right. Defaults to true if letter is provided or present. */
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
 *     - Left: Dari/Persian Province (e.g. کابل) in bold Dari calligraphy
 *     - Center: Persian numerals (e.g. ۱۲۳۴۶) with authentic proportions & tracking
 *     - Right: Dari category letter (e.g. ل)
 * - Upper-Left: Authentic Kabul landmark architectural line-art illustration
 * - Bottom row:
 *     - Left: 3-letter Latin province code (e.g. KBL) in bold uppercase
 *     - Center: Latin numerals (e.g. 12346) in large bold font
 *     - Right: Latin category letter (e.g. L)
 * - Strict RTL / LTR isolation: digits and letters strictly preserve their correct reading order
 * - Fully dynamic: connects to database records while defaulting to the canonical reference plate
 */
export function AfghanVehiclePlate({
  value,
  plateNumber: explicitNumber,
  province: explicitProvince,
  provinceEn: explicitProvinceEn,
  plateLetter: explicitLetter,
  plateLetterEn: explicitLetterEn,
  size = "compact",
  showLetter,
  className = "",
  style,
}: AfghanVehiclePlateProps) {
  // Parse or compute data
  const data = useMemo(() => {
    // If no values provided at all, default to reference plate values
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
        hasLetter: true,
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

    let finalLetterFa = parsed.plateLetterFa || ""
    let finalLetterEn = parsed.plateLetterEn || ""

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

    // Determine if letter should be shown
    const letterPresent = Boolean(finalLetterFa || finalLetterEn)
    const shouldShowLetter = showLetter !== undefined ? showLetter : letterPresent

    return {
      number: finalNumber,
      numberFa: finalNumberFa,
      provinceFa: finalProvFa,
      provinceCode: finalProvCode,
      letterFa: finalLetterFa,
      letterEn: finalLetterEn,
      hasLetter: shouldShowLetter && letterPresent,
    }
  }, [value, explicitNumber, explicitProvince, explicitProvinceEn, explicitLetter, explicitLetterEn, showLetter])

  // Precise sizing configurations preserving the exact 2.62:1 aspect ratio
  const sizeStyles = {
    compact: {
      container: "w-[184px] h-[70px] rounded-[5px]",
      border: "border-[1.8px] border-black",
      padding: "px-[3.5%] py-[2.5%]",
      provFa: "text-[12pt] leading-none",
      landmarkH: "h-[16px]",
      provEn: "text-[9.5pt] leading-none tracking-[0.05em]",
      numFa: "text-[18pt] leading-none tracking-[0.14em]",
      numEn: "text-[19pt] leading-none tracking-[0.02em]",
      letterFa: "text-[13pt] leading-none",
      letterEn: "text-[11pt] leading-none",
    },
    sm: {
      container: "w-[158px] h-[60px] rounded-[4px]",
      border: "border-[1.6px] border-black",
      padding: "px-[3.5%] py-[2.2%]",
      provFa: "text-[10pt] leading-none",
      landmarkH: "h-[13px]",
      provEn: "text-[8pt] leading-none tracking-[0.05em]",
      numFa: "text-[15.5pt] leading-none tracking-[0.14em]",
      numEn: "text-[16pt] leading-none tracking-[0.02em]",
      letterFa: "text-[11pt] leading-none",
      letterEn: "text-[9.5pt] leading-none",
    },
    default: {
      container: "w-[236px] h-[90px] rounded-[7px]",
      border: "border-[2.2px] border-black",
      padding: "px-[3.5%] py-[2.5%]",
      provFa: "text-[15pt] leading-none",
      landmarkH: "h-[21px]",
      provEn: "text-[12pt] leading-none tracking-[0.05em]",
      numFa: "text-[23pt] leading-none tracking-[0.14em]",
      numEn: "text-[24pt] leading-none tracking-[0.02em]",
      letterFa: "text-[16pt] leading-none",
      letterEn: "text-[14pt] leading-none",
    },
    md: {
      container: "w-[275px] h-[105px] rounded-[8px]",
      border: "border-[2.5px] border-black",
      padding: "px-[3.5%] py-[2.5%]",
      provFa: "text-[17.5pt] leading-none",
      landmarkH: "h-[24px]",
      provEn: "text-[14pt] leading-none tracking-[0.05em]",
      numFa: "text-[27pt] leading-none tracking-[0.14em]",
      numEn: "text-[28pt] leading-none tracking-[0.02em]",
      letterFa: "text-[19pt] leading-none",
      letterEn: "text-[16pt] leading-none",
    },
    lg: {
      container: "w-[340px] h-[130px] rounded-[10px]",
      border: "border-[3px] border-black",
      padding: "px-[3.5%] py-[2.5%]",
      provFa: "text-[22pt] leading-none",
      landmarkH: "h-[30px]",
      provEn: "text-[17pt] leading-none tracking-[0.05em]",
      numFa: "text-[33pt] leading-none tracking-[0.15em]",
      numEn: "text-[35pt] leading-none tracking-[0.02em]",
      letterFa: "text-[23pt] leading-none",
      letterEn: "text-[20pt] leading-none",
    },
    responsive: {
      container: "w-full max-w-[320px] aspect-[2.62/1] rounded-[7px]",
      border: "border-[2px] border-black",
      padding: "px-[3.5%] py-[2.5%]",
      provFa: "text-[clamp(11px,3.8vw,20pt)] leading-none",
      landmarkH: "h-[clamp(14px,4.8vw,28px)]",
      provEn: "text-[clamp(9px,3.0vw,16pt)] leading-none tracking-[0.05em]",
      numFa: "text-[clamp(16px,5.8vw,31pt)] leading-none tracking-[0.14em]",
      numEn: "text-[clamp(17px,6.0vw,33pt)] leading-none tracking-[0.02em]",
      letterFa: "text-[clamp(11px,3.9vw,21pt)] leading-none",
      letterEn: "text-[clamp(10px,3.5vw,18pt)] leading-none",
    },
  }[size]

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
        <div className="flex flex-col justify-between items-center text-center h-full w-[22%] min-w-0 py-[1%]">
          {/* Top Left: Dari Province (e.g. کابل) */}
          <div className="flex items-center justify-center w-full min-w-0">
            <span
              dir="rtl"
              className={`font-[vazirmatn] font-black text-black select-text ${sizeStyles.provFa}`}
              style={{
                fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", "Traditional Arabic", Arial, Tahoma, sans-serif',
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.provinceFa}
            </span>
          </div>

          {/* Middle Left: Architectural Landmark Illustration */}
          <div className="flex items-center justify-center w-full my-auto pointer-events-none" aria-hidden="true">
            <img
              src={KABUL_LANDMARK_DATA_URI}
              alt=""
              className={`${sizeStyles.landmarkH} w-auto object-contain select-none`}
              style={{
                filter: "contrast(1.05)",
                maxWidth: "100%",
              }}
            />
          </div>

          {/* Bottom Left: Latin Province Code (e.g. KBL) */}
          <div className="flex items-center justify-center w-full min-w-0">
            <span
              className={`font-sans font-black text-black uppercase select-text ${sizeStyles.provEn}`}
              style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
        <div className="flex flex-col justify-between items-center text-center h-full flex-1 min-w-0 px-[2%] py-[1%]">
          {/* Top Center: Persian Numerals (e.g. ۱۲۳۴۶) */}
          <div className="flex items-center justify-center w-full min-w-0">
            <span
              dir="ltr"
              className={`font-[vazirmatn] font-black text-black text-center tabular-nums select-text ${sizeStyles.numFa}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", Arial, Tahoma, sans-serif',
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {data.numberFa}
            </span>
          </div>

          {/* Bottom Center: Latin Numerals (e.g. 12346) */}
          <div className="flex items-center justify-center w-full min-w-0">
            <span
              dir="ltr"
              className={`font-sans font-black text-black text-center tabular-nums select-text ${sizeStyles.numEn}`}
              style={{
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
        <div className="flex flex-col justify-between items-center text-center h-full w-[16%] min-w-0 py-[1%]">
          {/* Top Right: Dari Category Letter (e.g. ل) */}
          <div className="flex items-center justify-center w-full min-w-0">
            {data.hasLetter ? (
              <span
                dir="rtl"
                className={`font-[vazirmatn] font-black text-black select-text ${sizeStyles.letterFa}`}
                style={{
                  fontFamily: 'var(--font-vazirmatn), "Noto Naskh Arabic", "Vazirmatn", "Traditional Arabic", Arial, Tahoma, sans-serif',
                  fontWeight: 900,
                  color: "#000000",
                }}
              >
                {data.letterFa}
              </span>
            ) : (
              <span className="invisible select-none text-[10pt]">&nbsp;</span>
            )}
          </div>

          {/* Bottom Right: Latin Category Letter (e.g. L) */}
          <div className="flex items-center justify-center w-full min-w-0">
            {data.hasLetter ? (
              <span
                className={`font-sans font-black text-black uppercase select-text ${sizeStyles.letterEn}`}
                style={{
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 900,
                  color: "#000000",
                }}
              >
                {data.letterEn}
              </span>
            ) : (
              <span className="invisible select-none text-[10pt]">&nbsp;</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AfghanVehiclePlate
