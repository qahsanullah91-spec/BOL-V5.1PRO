"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageCircle,
  Phone,
  RotateCcw,
  Send,
  Ship,
  User,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BillOfLadingFormData } from "@/lib/types/bill-of-lading"
import {
  buildWhatsAppBilingualMessage,
  buildWhatsAppBOLMessage,
  buildWhatsAppQuickMessage,
  buildWhatsAppShipmentUpdate,
  cleanValue,
} from "@/lib/utils/bol-whatsapp-formatter"
import { buildWhatsAppDeepLink, normalizePhoneNumber } from "@/lib/whatsapp/phone-normalizer"

type CopyMode = "full" | "update" | "bilingual" | "quick"

function copyWithFallback(message: string): void {
  const textarea = document.createElement("textarea")
  textarea.value = message
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  const selection = document.getSelection()
  const previousRange = selection?.rangeCount ? selection.getRangeAt(0) : null
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
  try {
    textarea.select()
    if (!document.execCommand("copy")) throw new Error("Clipboard copy failed")
  } finally {
    textarea.remove()
    selection?.removeAllRanges()
    if (previousRange) selection?.addRange(previousRange)
    activeElement?.focus()
  }
}

export function CopyWhatsAppButton({
  bol,
  className = "",
}: {
  bol: BillOfLadingFormData
  className?: string
}) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied">("idle")
  const [previewMode, setPreviewMode] = useState<CopyMode | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [selectedPhone, setSelectedPhone] = useState<string>("")
  const [customPhone, setCustomPhone] = useState<string>("")
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current) }, [])

  const messageFor = (mode: CopyMode): string => {
    switch (mode) {
      case "update": return buildWhatsAppShipmentUpdate(bol)
      case "bilingual": return buildWhatsAppBilingualMessage(bol)
      case "quick": return buildWhatsAppQuickMessage(bol)
      case "full": default: return buildWhatsAppBOLMessage(bol)
    }
  }

  // Detect potential recipients with phone numbers
  const availableRecipients = useMemo(() => {
    const list: { key: string; label: string; name: string; phone: string; norm: string }[] = []
    const add = (key: string, label: string, rawName: unknown, rawPhone: unknown) => {
      const p = cleanValue(rawPhone)
      if (!p) return
      const norm = normalizePhoneNumber(p)
      const n = cleanValue(typeof rawName === "object" && rawName !== null ? (rawName as any).name : rawName)
      list.push({ key, label, name: n, phone: p, norm })
    }

    add("driver", "Driver", bol.driver_name, bol.driver_contact)
    add("consignee", "Consignee", bol.consignee_name, bol.consignee_contact)
    add("shipper", "Shipper", bol.shipper_name, bol.shipper_contact)
    add("notify", "Notify", bol.notify_party, (bol as any).notify_party_contact || (bol as any).notify_party_phone)
    return list
  }, [bol])

  // Update the editable textarea whenever the preview mode changes
  useEffect(() => {
    if (previewMode) {
      setCustomMessage(messageFor(previewMode) || "No BOL information available")
      // Select driver or consignee by default if available
      if (availableRecipients.length > 0 && !selectedPhone) {
        setSelectedPhone(availableRecipients[0].phone)
      }
    }
  }, [previewMode, bol])

  const handleCopy = async (mode: CopyMode | "custom") => {
    if (status === "copying") return
    const message = mode === "custom" ? customMessage : messageFor(mode as CopyMode)
    if (!message.trim()) {
      toast.error("No BOL information available")
      return
    }
    setStatus("copying")
    try {
      if (!navigator.clipboard?.writeText) {
        copyWithFallback(message)
      } else {
        try {
          await navigator.clipboard.writeText(message)
        } catch {
          copyWithFallback(message)
        }
      }
      setStatus("copied")
      setPreviewMode(null)
      const labelMap: Record<string, string> = {
        full: "Full BOL copied for WhatsApp",
        update: "Shipment update copied for WhatsApp",
        bilingual: "Bilingual update copied for WhatsApp",
        quick: "Quick dispatch copied for WhatsApp",
        custom: "Customized message copied for WhatsApp",
      }
      toast.success(labelMap[mode] || "Copied for WhatsApp")
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setStatus("idle"), 2000)
    } catch {
      setStatus("idle")
      toast.error("Could not copy message")
    }
  }

  const handleOpenWhatsApp = (mode?: CopyMode | "custom") => {
    const text = mode === "custom" ? customMessage : messageFor(mode || "update")
    if (!text.trim()) {
      toast.error("No message to send")
      return
    }

    const phoneToSend = customPhone.trim() || selectedPhone
    const deepLink = buildWhatsAppDeepLink(phoneToSend, text)
    if (typeof window !== "undefined") {
      window.open(deepLink, "_blank", "noopener,noreferrer")
    }
  }

  const handleOpenWhatsAppWithPhone = (phone: string, mode?: CopyMode) => {
    const text = messageFor(mode || "update")
    if (!text.trim()) {
      toast.error("No message to send")
      return
    }
    const deepLink = buildWhatsAppDeepLink(phone, text)
    if (typeof window !== "undefined") {
      window.open(deepLink, "_blank", "noopener,noreferrer")
    }
    toast.success(`Opening WhatsApp chat for ${phone}`)
  }

  const handleResetToTemplate = () => {
    if (previewMode) {
      setCustomMessage(messageFor(previewMode) || "")
      toast.info("Message reset to original template")
    }
  }

  // Calculate message stats
  const charCount = customMessage.length
  const wordCount = customMessage.trim() ? customMessage.trim().split(/\s+/).length : 0
  const lineCount = customMessage.trim() ? customMessage.split(/\r?\n/).length : 0

  return (
    <>
      <div className={`inline-flex items-center rounded-lg shadow-2xs shrink-0 ${className}`}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleCopy("update")}
          disabled={status === "copying"}
          className="h-8 px-2.5 rounded-r-none border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs cursor-pointer gap-1.5"
          title="Copy shipment update as WhatsApp message (Click for instant copy)"
          aria-label="Copy shipment update as WhatsApp message"
        >
          {status === "copying" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : status === "copied" ? (
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="hidden 2xl:inline">
            {status === "copied" ? "Copied ✓" : status === "copying" ? "Copying..." : "Copy WhatsApp"}
          </span>
          <span className="hidden sm:inline 2xl:hidden">
            {status === "copied" ? "Copied ✓" : status === "copying" ? "Copying..." : "WhatsApp"}
          </span>
          <span className="sm:hidden">{status === "copied" ? "✓" : "WA"}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={status === "copying"}
              className="h-8 w-7 p-0 rounded-l-none border-l-0 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 cursor-pointer"
              title="WhatsApp message options"
              aria-label="WhatsApp message options"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-88 rounded-2xl p-2 shadow-2xl border border-emerald-100 dark:border-emerald-900/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md space-y-1">
            {/* Header */}
            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="h-3 w-3" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                  Copy Message Mode
                </span>
              </div>
              <span className="text-[10px] font-[vazirmatn] text-slate-400 font-bold" dir="rtl">
                قالب‌های واتساپ
              </span>
            </div>

            {/* Mode 1: Shipment Update */}
            <DropdownMenuItem
              onClick={() => void handleCopy("update")}
              className="gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 transition-all border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/80 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 shadow-2xs group-hover:scale-105 transition-transform">
                <Ship className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 dark:text-slate-100">Shipment Update</span>
                  <span className="text-[9px] font-black uppercase tracking-tight bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded shadow-2xs">
                    Recommended
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  Clean executive format with emojis & route • اطلاعیه رسمی
                </span>
              </div>
            </DropdownMenuItem>

            {/* Mode 2: Bilingual */}
            <DropdownMenuItem
              onClick={() => void handleCopy("bilingual")}
              className="gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-950/50 transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-900/80 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 shadow-2xs group-hover:scale-105 transition-transform">
                <Globe className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 dark:text-slate-100">Bilingual (EN / دری)</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded shadow-2xs">
                    Customs
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  Dual-language for Afghan border customs • دو زبانه گمرکی
                </span>
              </div>
            </DropdownMenuItem>

            {/* Mode 3: Quick Dispatch */}
            <DropdownMenuItem
              onClick={() => void handleCopy("quick")}
              className="gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-purple-50/80 dark:hover:bg-purple-950/50 transition-all border border-transparent hover:border-purple-200 dark:hover:border-purple-900/80 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/70 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 shadow-2xs group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 dark:text-slate-100">Quick Dispatch</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded shadow-2xs">
                    Compact
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  Ultra-compact for drivers & dispatchers • خلاصه فوری
                </span>
              </div>
            </DropdownMenuItem>

            {/* Mode 4: Full BOL Document */}
            <DropdownMenuItem
              onClick={() => void handleCopy("full")}
              className="gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 shadow-2xs group-hover:scale-105 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-xs text-slate-900 dark:text-slate-100">Full BOL Document</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-2xs">
                    Complete
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                  Complete parties, rent, route & vessel • بارنامه کامل
                </span>
              </div>
            </DropdownMenuItem>

            {/* Direct 1-Click Send to Detected Recipient (If phone exists) */}
            {availableRecipients.length > 0 && (
              <>
                <DropdownMenuSeparator className="my-1 dark:bg-slate-800" />
                <div className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Send className="h-2.5 w-2.5 text-emerald-600" />
                    <span>Direct Send to Contact / ارسال مستقیم</span>
                  </span>
                  <span className="text-[9px] font-mono opacity-70">1-Click</span>
                </div>
                {availableRecipients.slice(0, 3).map((r) => (
                  <DropdownMenuItem
                    key={r.key}
                    onClick={() => handleOpenWhatsAppWithPhone(r.phone, "update")}
                    className="gap-2 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200"
                  >
                    <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Phone className="h-3 w-3" />
                    </span>
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className="text-xs font-bold truncate">
                        {r.label}: {r.name || r.phone}
                      </span>
                      {r.name && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {r.phone}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator className="my-1 dark:bg-slate-800" />

            {/* Footer Actions */}
            <DropdownMenuItem
              onClick={() => handleOpenWhatsApp("update")}
              className="gap-2.5 cursor-pointer py-2 px-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-black text-xs transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-[#25D366] shrink-0" />
              <span>Open in WhatsApp Web / App</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setPreviewMode("update")}
              className="gap-2.5 cursor-pointer py-2 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              <Eye className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex items-center justify-between w-full">
                <span>Preview & Customize Message...</span>
                <span className="text-[10px] text-slate-400 font-mono">ویرایش</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={previewMode !== null} onOpenChange={(open) => { if (!open) setPreviewMode(null) }}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 font-sans shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <div className="flex flex-col gap-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="m-0 text-lg font-black tracking-tight text-white sm:text-xl">WhatsApp Message Center</DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-relaxed text-emerald-100 sm:text-sm">
                  Preview, customize, or send directly via WhatsApp.
                </DialogDescription>
              </div>
            </div>
            {/* Format Toggles */}
            <div className="flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-emerald-950/35 p-1 shadow-inner sm:shrink-0" role="group" aria-label="Message format">
              <button
                type="button"
                onClick={() => setPreviewMode("update")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 cursor-pointer ${
                  previewMode === "update" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-50 hover:bg-white/10"
                }`}
              >
                <Ship className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Update</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("bilingual")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 cursor-pointer ${
                  previewMode === "bilingual" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-50 hover:bg-white/10"
                }`}
              >
                <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Bilingual</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("quick")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 cursor-pointer ${
                  previewMode === "quick" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-50 hover:bg-white/10"
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Quick</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("full")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 cursor-pointer ${
                  previewMode === "full" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-50 hover:bg-white/10"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Full BOL</span>
              </button>
            </div>
          </div>

          {/* Recipient Selection Bar */}
          {availableRecipients.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 border-b border-emerald-100 bg-emerald-50/80 px-4 py-3 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/30 sm:px-6">
              <span className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                <Phone className="w-3.5 h-3.5" /> Recipient:
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {availableRecipients.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => {
                      setSelectedPhone(r.phone)
                      setCustomPhone("")
                    }}
                    className={`max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                      selectedPhone === r.phone && !customPhone
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-100/50"
                    }`}
                  >
                    {r.label}: {r.name ? `${r.name} (${r.phone})` : r.phone}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Textarea Area */}
          <div className="relative flex min-h-0 flex-1 flex-col bg-slate-50/70 p-4 dark:bg-slate-900/50 sm:p-6">
            <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-emerald-500/30 dark:border-slate-800 dark:bg-slate-950">
              <textarea
                className="h-[42vh] max-h-[560px] min-h-[240px] w-full resize-y bg-transparent p-4 font-sans text-sm leading-7 text-slate-800 antialiased whitespace-pre-wrap placeholder:text-slate-400 focus:outline-none dark:text-slate-200 sm:p-5 sm:text-[15px]"
                dir="ltr"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault()
                    void handleCopy("custom")
                  }
                }}
                placeholder="Type your WhatsApp message here..."
              />
            </div>

            {/* Metrics & Reset Strip */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span><strong>{charCount.toLocaleString()}</strong> chars</span>
                <span>•</span>
                <span><strong>{wordCount.toLocaleString()}</strong> words</span>
                <span>•</span>
                <span><strong>{lineCount}</strong> lines</span>
                <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">(Ctrl + Enter to copy)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToTemplate}
                className="h-6 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer gap-1"
                title="Reset message back to original generated template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewMode(null)}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => handleOpenWhatsApp("custom")}
                className="rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold shadow-md shadow-emerald-600/15 gap-1.5 cursor-pointer"
                title="Open directly in WhatsApp Web or App"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </Button>
              <Button
                type="button"
                disabled={status === "copying"}
                onClick={() => void handleCopy("custom")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 gap-1.5 cursor-pointer"
              >
                {status === "copying" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{status === "copying" ? "Copying..." : "Copy Message"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
