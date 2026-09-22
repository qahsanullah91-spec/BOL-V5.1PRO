import type { ReactNode } from "react"

type RouteIconProps = {
  size?: number
  strokeWidth?: number
}

function IconShell({ size, children }: RouteIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" fill="currentColor" opacity="0.1" />
      <circle cx="32" cy="32" r="23" fill="#fff" opacity="0.9" />
      {children}
    </svg>
  )
}

export function RouteTruckIcon({ size = 32, strokeWidth = 3 }: RouteIconProps) {
  return (
    <IconShell size={size}>
      <path
        d="M15 36H39V24H15V36Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M39 29H47L52 36V42H47"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 42H19M29 42H40" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="24" cy="42" r="4" fill="currentColor" />
      <circle cx="44" cy="42" r="4" fill="currentColor" />
      <path d="M20 30H30" stroke="currentColor" strokeWidth={strokeWidth - 0.8} strokeLinecap="round" opacity="0.55" />
    </IconShell>
  )
}

export function RouteVesselIcon({ size = 32, strokeWidth = 3 }: RouteIconProps) {
  return (
    <IconShell size={size}>
      <path
        d="M14 37H50L45 47H19L14 37Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M24 37L23 25H35L34 37"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M34 28H44L34 22V37" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M18 50C22 47 26 47 30 50C34 53 38 53 46 49" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" opacity="0.6" />
    </IconShell>
  )
}

export function RouteAirIcon({ size = 32, strokeWidth = 3 }: RouteIconProps) {
  return (
    <IconShell size={size}>
      <path
        d="M13 35L51 20L47 17L35 23L28 18L24 20L29 27L18 32L13 29L10 31L13 35Z"
        fill="currentColor"
        opacity="0.88"
      />
      <path d="M24 40L33 35" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.55" />
      <path d="M17 45H47" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" opacity="0.22" />
    </IconShell>
  )
}

export function RouteTrainIcon({ size = 32, strokeWidth = 3 }: RouteIconProps) {
  return (
    <IconShell size={size}>
      <path
        d="M19 20H45C49 20 52 23 52 27V39C52 43 49 46 45 46H19C15 46 12 43 12 39V27C12 23 15 20 19 20Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M18 30H30M36 30H46" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="23" cy="39" r="3" fill="currentColor" />
      <circle cx="41" cy="39" r="3" fill="currentColor" />
      <path d="M22 51L28 46M42 51L36 46" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
    </IconShell>
  )
}

export function RouteCarIcon({ size = 32, strokeWidth = 3 }: RouteIconProps) {
  return (
    <IconShell size={size}>
      <path
        d="M16 35L21 25H43L48 35"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 35H50V43H45M19 43H14V35"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="43" r="4" fill="currentColor" />
      <circle cx="40" cy="43" r="4" fill="currentColor" />
      <path d="M24 30H40" stroke="currentColor" strokeWidth={strokeWidth - 0.8} strokeLinecap="round" opacity="0.55" />
    </IconShell>
  )
}
