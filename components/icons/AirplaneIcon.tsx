import React from "react"

type IconProps = {
  size?: number
  strokeWidth?: number
}

export default function AirplaneIcon({ size = 32 }: IconProps) {
  const id = React.useId()
  const bodyGradient = `${id}-airplane-body`
  const wingGradient = `${id}-airplane-wing`

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={bodyGradient} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4f8ffb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={wingGradient} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ebf8ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="56" height="52" rx="10" fill="rgba(255,255,255,0.72)" />
      <g transform="translate(8,14) scale(0.92)">
        <path d="M10 30 L54 16 L50 12 L38 18 L30 14 L22 18 L10 12 L6 16 Z" fill={`url(#${bodyGradient})`} />
        <path d="M24 12 L28 4 L32 12" fill={`url(#${wingGradient})`} opacity="0.9" />
        <path d="M18 22 L46 10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
        <path d="M14 26 L50 14" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
        <circle cx="30" cy="18" r="3" fill="#f8fafc" opacity="0.96" />
      </g>
    </svg>
  )
}
