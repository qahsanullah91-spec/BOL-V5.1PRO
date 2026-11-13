"use client"

import type { CSSProperties } from "react"
import { FileText } from "lucide-react"
import { DocumentQRCode } from "./document-qr-code"

export interface BillOfLadingHeaderProps {
  bolNumber?: string
  pdfMode?: boolean
  isUltraCompact?: boolean
  isCompact?: boolean
  labels?: {
    billOfLadingFa?: string
    documentNo?: string
    persianCompanyFallback?: string
    [key: string]: string | undefined
  }
  companyTitle?: string
  companyTagline?: string
  companyPersian?: string
  bolLogoSrc?: string
  brandLockupSrc?: string
  logoDesignId?: string
  className?: string
  style?: CSSProperties
  formData?: any
}

/**
 * BillOfLadingHeader - Professional, print-ready Bill of Lading header featuring:
 * 1. Left: Official circular company logo (Sky Ariana Ltd)
 * 2. Center: Prominent "SKY ARIANA LIMITED" title, English transportation tagline, and Persian company name
 * 3. Right: Specialized Bill of Lading document card with:
 *    - Blue top section: Document icon badge + "BILL OF LADING" & "بارنامه"
 *    - White bottom section: "DOCUMENT NO." label & dynamic BOL number
 *    - Large scannable QR code positioned halfway across the blue and white boundary
 */
export function BillOfLadingHeader({
  bolNumber = "",
  pdfMode = false,
  isUltraCompact = false,
  isCompact = false,
  labels,
  companyTitle,
  companyTagline,
  companyPersian,
  bolLogoSrc,
  brandLockupSrc,
  logoDesignId,
  className = "",
  style,
  formData,
}: BillOfLadingHeaderProps) {
  // Card & QR sizing calibrated for A4 density tiers with enlarged QR code & balanced proportions
  const qrMmSize = isUltraCompact ? 20 : isCompact ? 23 : 26
  const qrPaddingRightMm = isUltraCompact ? 22 : isCompact ? 25.5 : 29
  const cardWidthMm = isUltraCompact ? 63 : isCompact ? 68 : 72
  const cardHeightMm = isUltraCompact ? 21 : isCompact ? 23.5 : 26
  const cardTopHeightMm = isUltraCompact ? 11 : isCompact ? 12 : 13.5
  const cardBottomHeightMm = isUltraCompact ? 10 : isCompact ? 11.5 : 12.5

  // Logo & banner dimensions
  const logoMmSize = isUltraCompact ? 27 : isCompact ? 31 : 35
  const bannerMinHeightMm = isUltraCompact ? 30 : isCompact ? 35 : 40

  const resolvedCompanyTitle = companyTitle?.trim() || "SKY ARIANA LIMITED"
  const resolvedCompanyTagline =
    companyTagline?.trim() || "Import & Export - International Transportation"
  const resolvedCompanyPersian =
    companyPersian?.trim() ||
    labels?.persianCompanyFallback ||
    "شرکت حمل و نقل بین المللی اسکای آریانا"
  const logoSrc = bolLogoSrc || "/images/sky-ariana-logo.png"
  const isSkyArianaBrand = resolvedCompanyTitle.toUpperCase().includes("SKY ARIANA")
  const resolvedBrandLockup = brandLockupSrc || "/images/sky-ariana-brand-lockup.png"
  const isStacked =
    resolvedBrandLockup.includes("classic-stack") ||
    logoDesignId === "classic-stack"

  // Check if brand lockup already embeds the company circular emblem/seal to eliminate duplicate logos
  const lockupHasEmblem = Boolean(
    (isSkyArianaBrand && (
      logoDesignId === "classic-heritage-full" ||
      logoDesignId === "classic-stack" ||
      isStacked ||
      (bolLogoSrc && brandLockupSrc && bolLogoSrc === brandLockupSrc) ||
      (logoSrc && resolvedBrandLockup && logoSrc === resolvedBrandLockup) ||
      resolvedBrandLockup.includes("classic-heritage") ||
      resolvedBrandLockup.includes("classic-stack") ||
      resolvedBrandLockup.includes("sky-ariana-modern-flat.png") ||
      resolvedBrandLockup.includes("sky-ariana-modern-3d.png") ||
      (resolvedBrandLockup.includes("vintage-heritage") && !resolvedBrandLockup.includes("vintage-heritage-lockup"))
    )) || (
      !isSkyArianaBrand && bolLogoSrc && brandLockupSrc && bolLogoSrc === brandLockupSrc
    )
  )

  return (
    <header
      data-bol-header="true"
      className={`bol-header relative overflow-visible border border-[#bfdbfe] rounded-2xl bg-gradient-to-r from-blue-50/30 via-white to-blue-50/40 text-slate-900 select-none shrink-0 ${
        pdfMode ? "shadow-none" : "shadow-[0_2px_10px_rgba(37,99,235,0.06)]"
      } ${className}`}
      style={{
        width: "100%",
        minHeight: `${bannerMinHeightMm}mm`,
        padding: isUltraCompact
          ? "1.5mm 2.5mm"
          : isCompact
          ? "1.8mm 3mm"
          : "2.2mm 3.5mm",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "2.5mm",
        ...style,
      }}
    >
      {/* 1. Left: Circular Emblem Badge (omitted when brand lockup already embeds the emblem) */}
      {!lockupHasEmblem && (
        <div
          data-bol-logo-badge="true"
          className={`bol-logo-badge shrink-0 flex items-center justify-center rounded-full bg-white border border-[#93c5fd]/80 overflow-hidden ${
            pdfMode ? "shadow-none" : "shadow-[0_2px_12px_rgba(37,99,235,0.18)]"
          }`}
          style={{
            width: `${logoMmSize}mm`,
            height: `${logoMmSize}mm`,
            maxWidth: `${logoMmSize}mm`,
            maxHeight: `${logoMmSize}mm`,
            padding: 0,
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={resolvedCompanyTitle}
            className="w-full h-full object-contain rounded-full"
            crossOrigin="anonymous"
            loading="eager"
            decoding="async"
            style={{
              imageRendering: "-webkit-optimize-contrast",
              filter: pdfMode ? "none" : "drop-shadow(0 1.5px 3px rgba(15, 23, 42, 0.12))",
            }}
            onError={(e) => {
              const target = e.currentTarget
              if (!target.src.endsWith("/images/sky-ariana-logo.png")) {
                target.src = "/images/sky-ariana-logo.png"
              }
            }}
          />
        </div>
      )}

      {/* 2. Center: Company Brand Title, Tagline, and Persian Name */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center px-1">
        {isSkyArianaBrand ? (
          <div className="flex-1 w-full min-w-0 flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {(() => {
              const resolvedBrandLockup = brandLockupSrc || "/images/sky-ariana-brand-lockup.png"
              const isStacked = resolvedBrandLockup.includes("classic-stack") || logoDesignId === "classic-stack"
              return (
                <img
                  src={resolvedBrandLockup}
                  alt={resolvedCompanyTitle}
                  className="bol-brand-lockup-img object-contain"
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="async"
                  style={{
                    height: isStacked
                      ? (isUltraCompact ? "23mm" : isCompact ? "27mm" : "32mm")
                      : (isUltraCompact ? "21mm" : isCompact ? "25mm" : "29.5mm"),
                    maxHeight: isStacked
                      ? (isUltraCompact ? "23mm" : isCompact ? "27mm" : "32mm")
                      : (isUltraCompact ? "21mm" : isCompact ? "25mm" : "29.5mm"),
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "contain",
                    imageRendering: "-webkit-optimize-contrast",
                    filter: pdfMode ? "none" : "drop-shadow(0 1.5px 3.5px rgba(30, 58, 138, 0.08))",
                  }}
                  onError={(e) => {
                    const target = e.currentTarget
                    if (!target.src.endsWith("/images/sky-ariana-brand-lockup.png")) {
                      target.src = "/images/sky-ariana-brand-lockup.png"
                    }
                  }}
                />
              )
            })()}
            {/* Semantic elements for accessibility, print indexing, and test validation */}
            <h1 className="sr-only bol-company-title">{resolvedCompanyTitle}</h1>
            <p className="sr-only bol-company-tagline">{resolvedCompanyTagline}</p>
            <p className="sr-only bol-company-fa" dir="rtl">{resolvedCompanyPersian}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <h1
              className={`bol-company-title font-black uppercase tracking-[0.035em] text-[#1e293b] leading-tight whitespace-nowrap truncate max-w-full ${
                isUltraCompact ? "text-[14pt]" : isCompact ? "text-[16.5pt]" : "text-[20pt]"
              }`}
              style={{
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {resolvedCompanyTitle}
            </h1>
            <p
              className={`bol-company-tagline font-black uppercase tracking-[0.14em] text-[#475569] leading-tight whitespace-nowrap truncate max-w-full ${
                isUltraCompact
                  ? "text-[5.8pt] mt-0.5"
                  : isCompact
                  ? "text-[6.6pt] mt-0.5"
                  : "text-[7.5pt] mt-0.5"
              }`}
              style={{
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {resolvedCompanyTagline}
            </p>
            <p
              className={`bol-company-fa font-[vazirmatn] font-extrabold text-[#2563eb] leading-tight whitespace-nowrap truncate max-w-full ${
                isUltraCompact
                  ? "text-[7.5pt] mt-0.5"
                  : isCompact
                  ? "text-[8.5pt] mt-0.5"
                  : "text-[9.8pt] mt-0.5"
              }`}
              dir="rtl"
              style={{
                direction: "rtl",
                unicodeBidi: "isolate",
              }}
            >
              {resolvedCompanyPersian}
            </p>
          </div>
        )}

        {/* Lower center strip: official head office, registration and carrier code */}
        <div
          className={`bol-company-registration flex items-center justify-center gap-2 text-slate-800 font-extrabold tracking-[0.06em] whitespace-nowrap leading-none ${
            isUltraCompact ? "text-[4.8pt] mt-1 mb-0.5" : isCompact ? "text-[5.8pt] mt-1 mb-0.5" : "text-[6.8pt] mt-1.2 mb-0.8"
          }`}
          style={{
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <span>HEAD OFFICE: ETIMAD RAHMI MARKET, KANDAHAR</span>
          <span className="text-[#2563eb] font-black">•</span>
          <span>REG: 90021-AFG</span>
          <span className="text-[#2563eb] font-black">•</span>
          <span>CARRIER CODE: SKY-AF</span>
        </div>
      </div>

      {/* 3. Right: Bill of Lading Document Card with Large Overlapping QR Code */}
      <div
        data-bol-title-card="true"
        className={`bol-card relative overflow-visible border border-[#2563eb]/90 rounded-2xl bg-white shrink-0 ${
          pdfMode ? "shadow-none" : "shadow-[0_4px_16px_rgba(37,99,235,0.12)]"
        }`}
        style={{
          width: `${cardWidthMm}mm`,
          height: `${cardHeightMm}mm`,
          boxSizing: "border-box",
        }}
      >
        {/* Top Blue Section: Badge Icon & Bilingual Titles */}
        <div
          className="bol-header-top relative overflow-hidden rounded-t-[14px] bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white flex items-center shadow-xs"
          style={{
            height: `${cardTopHeightMm}mm`,
            minHeight: `${cardTopHeightMm}mm`,
            padding: isUltraCompact ? "1mm 1.8mm" : isCompact ? "1.2mm 2.2mm" : "1.5mm 2.5mm",
            paddingRight: `${qrPaddingRightMm}mm`,
            boxSizing: "border-box",
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Document icon in translucent badge */}
            <div
              className="shrink-0 flex items-center justify-center rounded-full bg-white/25 border border-white/40 backdrop-blur-xs shadow-xs"
              style={{
                width: isUltraCompact ? "4.8mm" : isCompact ? "5.4mm" : "6mm",
                height: isUltraCompact ? "4.8mm" : isCompact ? "5.4mm" : "6mm",
              }}
            >
              <FileText
                className="text-white stroke-[2.4]"
                style={{
                  width: isUltraCompact ? "2.8mm" : isCompact ? "3.2mm" : "3.5mm",
                  height: isUltraCompact ? "2.8mm" : isCompact ? "3.2mm" : "3.5mm",
                }}
              />
            </div>

            {/* Titles: English & Persian */}
            <div className="flex flex-col justify-center min-w-0">
              <span
                className={`bol-title-en font-black uppercase text-white tracking-[0.04em] leading-none whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] ${
                  isUltraCompact ? "text-[7.2pt]" : isCompact ? "text-[8.2pt]" : "text-[9.2pt]"
                }`}
                style={{
                  fontFamily:
                    "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                }}
              >
                BILL OF LADING
              </span>
              <span
                className={`bol-title-fa font-[vazirmatn] font-extrabold text-white/95 leading-none whitespace-nowrap ${
                  isUltraCompact ? "text-[6.8pt] mt-0.5" : isCompact ? "text-[7.6pt] mt-0.5" : "text-[8.5pt] mt-0.5"
                }`}
                dir="rtl"
                style={{
                  direction: "rtl",
                  unicodeBidi: "isolate",
                }}
              >
                {labels?.billOfLadingFa || "بارنامه"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom White Section: Document Label & Dynamic BOL Number */}
        <div
          className="bol-header-bottom relative overflow-hidden rounded-b-[14px] bg-white border-t border-[#bfdbfe] flex items-center"
          style={{
            height: `${cardBottomHeightMm}mm`,
            minHeight: `${cardBottomHeightMm}mm`,
            padding: isUltraCompact ? "0.9mm 1.8mm" : isCompact ? "1.1mm 2.2mm" : "1.3mm 2.5mm",
            paddingRight: `${qrPaddingRightMm}mm`,
            boxSizing: "border-box",
          }}
        >
          <div className="flex flex-col justify-center min-w-0 max-w-full">
            <span
              className={`bol-number-label block font-black uppercase tracking-[0.14em] text-slate-500 leading-none ${
                isUltraCompact ? "text-[5.6pt] mb-0.5" : isCompact ? "text-[6.2pt] mb-0.5" : "text-[6.8pt] mb-0.5"
              }`}
              style={{
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {labels?.documentNo || "DOCUMENT NO."}
            </span>
            <span
              data-pdf-bol-number="true"
              className={`bol-number-text block font-black text-[#1d4ed8] leading-tight tracking-tight whitespace-nowrap keep-all direction-ltr unicode-isolate truncate ${
                isUltraCompact ? "!text-[9pt]" : isCompact ? "!text-[10.2pt]" : "!text-[11.5pt]"
              }`}
              style={{
                color: "#1d4ed8",
                direction: "ltr",
                unicodeBidi: "isolate",
                fontFamily:
                  "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {bolNumber}
            </span>
          </div>
        </div>

        {/* Large Overlapping QR Code Container (spans top blue & bottom white boundary halfway) */}
        <div
          className="bol-qr-container absolute z-20 bg-white border-2 border-[#93c5fd] rounded-2xl flex items-center justify-center shrink-0"
          style={{
            width: `${qrMmSize}mm`,
            height: `${qrMmSize}mm`,
            right: isUltraCompact ? "1.2mm" : isCompact ? "1.4mm" : "1.6mm",
            top: "50%",
            transform: "translateY(-50%)",
            padding: isUltraCompact ? "0.6mm" : isCompact ? "0.8mm" : "1mm",
            borderRadius: isUltraCompact ? "2.6mm" : "3.2mm",
            boxShadow: pdfMode ? "none" : "0 4px 16px rgba(37, 99, 235, 0.18)",
            boxSizing: "border-box",
          }}
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
    </header>
  )
}

export default BillOfLadingHeader
