"use client"

import { useState } from "react"

export function RouteNavigation() {
  const [active, setActive] = useState<"sea" | "land">("land")

  return (
    <div className="rounded-[28px] border border-blue-100 bg-white/90 p-4 shadow-2xl shadow-blue-200/40 backdrop-blur-2xl">
      <div className="mb-3">
        <p className="text-sm font-black text-slate-950">Route / Transportation Path</p>
        <p className="text-xs text-slate-500">Select the active route mode.</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          aria-pressed={active === "sea"}
          onClick={() => setActive("sea")}
          className={`flex h-16 w-16 items-center justify-center rounded-[12px] border border-slate-200 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
            active === "sea"
              ? "bg-[#E9ECEF]"
              : "bg-white hover:bg-slate-100"
          }`}
          title="Sea freight"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-7 w-7"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 16h18" />
            <path d="M5 16l1.5-4.5h11L19 16" />
            <path d="M8 12V8h8v4" />
            <path d="M4 16l2 2h12l2-2" />
            <path d="M7 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
            <path d="M17 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
        </button>

        <button
          type="button"
          aria-pressed={active === "land"}
          onClick={() => setActive("land")}
          className={`flex h-16 w-16 items-center justify-center rounded-[12px] border border-slate-200 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
            active === "land"
              ? "bg-[#E9ECEF]"
              : "bg-white hover:bg-slate-100"
          }`}
          title="Land transport"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-7 w-7"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 13h11v4H3z" />
            <path d="M14 13h5l2.5 3.5V20H17" />
            <path d="M7 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
            <path d="M17 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
            <path d="M3 13V9a1 1 0 0 1 1-1h8" />
            <path d="M5 9V7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
