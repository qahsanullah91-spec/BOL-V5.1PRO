"use client"

import React, { useState, useEffect } from "react"

const STEPS = [
  "Starting core logistics engine...",
  "Initializing local database...",
  "Warming up financial ledger cache...",
  "Opening workspace...",
]

export default function RootLoading() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length)
    }, 600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] text-slate-50 select-none overflow-hidden cursor-default">
      {/* Ambient background glows */}
      <div className="absolute top-[15%] left-[28%] w-80 h-80 rounded-full bg-sky-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[18%] right-[28%] w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative z-10 flex flex-col items-center px-10 py-11 bg-slate-900/75 border border-white/10 rounded-[28px] backdrop-blur-2xl shadow-2xl text-center max-w-[460px] w-[90%]">
        
        {/* Emblem Wrapper */}
        <div className="relative mb-5.5 w-24 h-19 flex items-center justify-center">
          <div className="absolute -inset-1.5 rounded-[22px] bg-gradient-to-br from-amber-500/40 to-sky-400/35 blur-md animate-pulse" />
          <div className="relative w-24 h-19 rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 border border-sky-400/50 flex items-center justify-center shadow-xl p-2">
            <img 
              src="/images/aq-companies-emblem.png" 
              alt="AQ Companies" 
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-[22px] font-black tracking-[3px] uppercase bg-gradient-to-br from-white via-white to-slate-300 bg-clip-text text-transparent mb-1.5">
          AQ COMPANIES
        </div>
        <div className="text-[11px] text-slate-400 font-semibold tracking-[0.8px] uppercase mb-7">
          Logistics &amp; Bill of Lading Platform
        </div>

        {/* Track / Progress Bar */}
        <div className="w-64 h-1 bg-slate-800/80 rounded-full overflow-hidden relative border border-white/5 mb-4">
          <div className="absolute top-0 bottom-0 left-0 w-[45%] rounded-full bg-gradient-to-r from-sky-400 via-amber-500 to-emerald-500 shadow-[0_0_12px_rgba(56,189,248,0.6)] animate-pulse" />
        </div>

        {/* Status Message */}
        <div className="text-[11.5px] text-slate-400 font-mono font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping" />
          <span>{STEPS[stepIndex]}</span>
        </div>

        {/* Runtime Badge */}
        <div className="mt-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9.5px] text-slate-400 font-mono tracking-wider">
          AQ-SYSTEM v5.1.2 PRO • ULTRA PERFORMANCE RUNTIME
        </div>
      </div>
    </div>
  )
}
