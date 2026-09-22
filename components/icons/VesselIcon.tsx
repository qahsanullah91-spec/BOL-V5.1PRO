import React from "react"

type IconProps = {
  size?: number
  strokeWidth?: number
}

export default function VesselIcon({ size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 38 C18 26 46 26 52 38"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 38 L14 48 H50 L54 38"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 38 L22 24 L34 24 L32 38"
        stroke="#1d4ed8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#bfdbfe"
      />
      <path
        d="M32 38 L32 18"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M34 24 L42 28 L34 28 Z"
        fill="#eff6ff"
        stroke="#2563eb"
        strokeWidth="2"
      />
      <path
        d="M18 46 H46"
        stroke="#60a5fa"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.18"
      />
      <path
        d="M18 44 C22 42 26 42 30 44"
        stroke="#60a5fa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M38 44 C42 42 46 42 50 44"
        stroke="#60a5fa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
