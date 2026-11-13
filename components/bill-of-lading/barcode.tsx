"use client"

import React, { useMemo } from "react"
import { generateBarcode128 } from "@/lib/utils/barcode-128"

export interface Barcode128Props {
  value: string
  height?: number
  showText?: boolean
  text?: string
  className?: string
  textClassName?: string
  barColor?: string
  maxWidth?: number | string
}

export function Barcode128({
  value,
  height = 20,
  showText = true,
  text,
  className = "",
  textClassName = "",
  barColor = "#000000",
  maxWidth = "200px",
}: Barcode128Props) {
  const result = useMemo(
    () => generateBarcode128(value, { height, barColor }),
    [value, height, barColor]
  )

  const displayText = text ?? result.encodedText

  return (
    <div
      data-barcode="true"
      data-barcode-value={result.encodedText}
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ maxWidth }}
    >
      <svg
        viewBox={`0 0 ${result.totalWidth} ${result.height}`}
        width="100%"
        height={result.height}
        preserveAspectRatio="none"
        className="block overflow-hidden"
        style={{
          display: "block",
          shapeRendering: "crispEdges",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
        aria-label={`Barcode: ${displayText}`}
      >
        <path d={result.svgPath} fill={barColor} />
      </svg>
      {showText && (
        <span
          className={`font-mono font-bold tracking-widest text-slate-800 text-center leading-none mt-0.5 select-all ${
            textClassName || "text-[6pt]"
          }`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {displayText}
        </span>
      )}
    </div>
  )
}

export default Barcode128
