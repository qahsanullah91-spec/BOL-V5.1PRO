export default function CarIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="18" width="48" height="22" rx="10" fill="currentColor" opacity="0.12" />
      <path d="M12 34h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M16 34v6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 34v6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="18" cy="44" r="4" fill="currentColor" />
      <circle cx="46" cy="44" r="4" fill="currentColor" />
      <path d="M18 26h28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 26v-8h6v8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 26v-8h-6v8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
