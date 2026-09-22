import React from "react"

export default function TrainIcon({ size = 32 }: { size?: number }) {
  const id = React.useId()
  const bodyGradient = `${id}-train-body`
  const windowGradient = `${id}-train-window`

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={bodyGradient} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#4f8ffb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={windowGradient} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="56" height="52" rx="10" fill="rgba(255,255,255,0.74)" />
      <g transform="translate(8,14)">
        <path d="M0 16 C0 8, 8 2, 20 2 H36 C48 2, 56 8, 56 16 V28 H0 Z" fill={`url(#${bodyGradient})`} />
        <rect x="6" y="10" width="12" height="8" rx="2" fill={`url(#${windowGradient})`} />
        <rect x="24" y="10" width="18" height="8" rx="2" fill={`url(#${windowGradient})`} />
        <path d="M8 18 H24" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
        <circle cx="14" cy="30" r="4" fill="#0f172a" />
        <circle cx="42" cy="30" r="4" fill="#0f172a" />
        <circle cx="14" cy="30" r="1.5" fill="#cbd5e1" />
        <circle cx="42" cy="30" r="1.5" fill="#cbd5e1" />
        <path d="M0 28 H56" stroke="#0f172a" strokeWidth="1" opacity="0.2" />
      </g>
    </svg>
  )
}
