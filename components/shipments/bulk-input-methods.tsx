"use client"

import React, { useState } from "react"
import {
  FileSpreadsheet,
  MessageCircle,
  FileJson,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  Zap,
  Loader2,
  CheckCircle2,
  Upload,
  FileUp,
  FileText,
  X,
  Image as ImageIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { WhatsAppParser } from "@/lib/services/whatsapp-parser"
import { ParsedBulkRow } from "@/lib/types/bulk-import"
import { toast } from "sonner"

interface BulkInputMethodsProps {
  onComplete: (parsed: ParsedBulkRow[], raw: any[], sourceType: any) => void
}

export function BulkInputMethods({ onComplete }: BulkInputMethodsProps) {
  const [activeMethod, setActiveMethod] = useState<"SELECT" | "WHATSAPP" | "EXCEL" | "JSON" | "GEMINI_AI">("SELECT")
  const [inputText, setInputText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<any | null>(null)
  const [selectedFile, setSelectedFile] = useState<{
    file: File
    base64: string
    name: string
    size: number
    mimeType: string
  } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFileSelect = (file: File) => {
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|png|jpe?g|webp)$/i)) {
      toast.error("Please upload a PDF or image file (PNG, JPG, WebP)")
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setSelectedFile({
        file,
        base64: result,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/pdf",
      })
      toast.success(`Attached ${file.name} for multimodal extraction`)
    }
    reader.onerror = () => {
      toast.error("Failed to read file")
    }
    reader.readAsDataURL(file)
  }

  const handleWhatsAppParse = () => {
    if (!inputText.trim()) return
    const { mappedRow } = WhatsAppParser.parseText(inputText)
    onComplete([mappedRow], [{ originalText: inputText }], "WHATSAPP")
  }

  const handleGeminiExtract = async () => {
    if (!inputText.trim() && !selectedFile) {
      toast.error("Please enter shipment text or attach a document file")
      return
    }

    try {
      setIsExtracting(true)
      const res = await fetch("/api/ai/structured-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          file: selectedFile
            ? {
                data: selectedFile.base64,
                mimeType: selectedFile.mimeType,
                name: selectedFile.name,
              }
            : undefined,
          type: "bol",
        }),
      })

      const data = await res.json()
      if (data.success && data.data) {
        setExtractionResult(data)
        const d = data.data

        const parsedRow: ParsedBulkRow = {
          consignee: d.consignee_name,
          shipper: d.shipper_name,
          notifyParty: d.notify_party,
          commodity: d.cargo_description,
          packages: d.number_of_packages,
          netWeight: d.net_weight,
          grossWeight: d.gross_weight,
          truckNumber: d.truck_number,
          driver: d.driver_name,
          driverPhone: d.driver_contact,
          origin: d.port_of_loading || (d.routes?.[0]?.location ?? undefined),
          route: d.transit_border_station,
          containerNumber: d.container_numbers,
          sealNumber: d.seal_numbers,
          unitWeight: d.kgs_per_carton,
        }

        toast.success(`Extracted structured BOL data (${data.method === 'gemini' ? data.modelUsed : 'Offline Parser'})`)
        onComplete([parsedRow], [{ originalText: inputText, extracted: d, fileAttached: selectedFile?.name }], "WHATSAPP")
      } else {
        toast.error(data.error || "Structured extraction failed. Falling back to local WhatsApp parser.")
        handleWhatsAppParse()
      }
    } catch (err: any) {
      toast.warning(`Extraction network fallback: ${err.message}`)
      handleWhatsAppParse()
    } finally {
      setIsExtracting(false)
    }
  }

  const handleEmptyGrid = () => {
    // Generate 10 empty rows
    const emptyRows: ParsedBulkRow[] = Array(10).fill({})
    onComplete(emptyRows, emptyRows, "MANUAL")
  }

  if (activeMethod === "GEMINI_AI") {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200 space-y-4">
        <div>
          <button onClick={() => setActiveMethod("SELECT")} className="text-sm text-slate-500 hover:text-slate-800 mb-2 cursor-pointer">
            ← Back to Methods
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <h3 className="text-xl font-black text-slate-900">Gemini AI Multimodal &amp; Structured Extraction</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload a scanned Bill of Lading, invoice, or commercial receipt (PDF, PNG, JPG), or paste unformatted WhatsApp chat. Google Gemini extracts strict schema fields (Consignee, Truck, Border Station, Weights, Cartons).
          </p>
        </div>

        {/* Multimodal File Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0])
            }
          }}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all text-center ${
            isDragging
              ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30"
              : selectedFile
              ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850 hover:border-amber-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between gap-3 p-1">
              <div className="flex items-center gap-2.5 min-w-0 text-left">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0">
                  {selectedFile.mimeType.includes("pdf") ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10.5px] font-medium text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.mimeType.includes("pdf") ? "PDF Document" : "Image"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs font-bold"
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Remove attached document"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer py-2 flex flex-col items-center justify-center gap-1.5"
            >
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <FileUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Click to browse or drag &amp; drop document
                </p>
                <p className="text-[10.5px] font-medium text-slate-500 mt-0.5">
                  Supports Scanned PDF, PNG, JPG, or WebP up to 15MB
                </p>
              </div>
            </div>
          )}
        </div>

        <Textarea
          className="min-h-[180px] font-mono text-sm p-4 bg-white"
          placeholder="Optional: Paste supplemental logistics text in English, Dari, or Pashto (e.g. WhatsApp notes, driver phone, customs rates)...&#10;&#10;Consignee: Afghan Aryana Ltd&#10;Truck: HRT-9281, Driver: Mohammad Gul&#10;Border: Islam Qala&#10;Cargo: 1,200 Cartons Dry Raisins, Gross Weight: 21,600 KG..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          dir="auto"
        />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Multimodal Gemini 3.8 Flash + schema enforcement</span>
          </div>

          <Button
            onClick={handleGeminiExtract}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
            disabled={(!inputText.trim() && !selectedFile) || isExtracting}
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>{selectedFile ? "Analyzing Document with Gemini..." : "Extracting with Gemini..."}</span>
              </>
            ) : (
              <>
                <span>Extract &amp; Open Grid</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (activeMethod === "WHATSAPP") {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6">
          <button onClick={() => setActiveMethod("SELECT")} className="text-sm text-slate-500 hover:text-slate-800 mb-2 cursor-pointer">
            ← Back to Methods
          </button>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-green-500" /> Paste WhatsApp Shipment
          </h3>
          <p className="text-sm text-slate-500 mt-1">Paste unstructured text (English, Dari, Pashto). The parser will automatically extract fields.</p>
        </div>
        
        <Textarea 
          className="min-h-[300px] font-mono text-sm p-4 bg-white"
          placeholder="جنس: کشمش گردک&#10;تعداد: 1427 کارتن 16 کیلویی&#10;باردان: 1.900 kg&#10;نرخ: 3.4 دالر&#10;موتر نمبر: 81745 هرات..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          dir="auto"
        />
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleWhatsAppParse} className="bg-green-600 hover:bg-green-700" disabled={!inputText.trim()}>
            Parse & Open Grid <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto">
        <h3 className="text-2xl font-black text-slate-900">How would you like to enter shipments?</h3>
        <p className="text-slate-500 mt-2">Select an input method. All methods will take you to the Grid Editor where you can review, fix errors, and map columns before finalizing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gemini AI Smart Extract */}
        <Card className="cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group border-amber-200/80 bg-linear-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900" onClick={() => setActiveMethod("GEMINI_AI")}>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-slate-900 dark:text-white">Gemini AI Extract</h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">AI</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Extract schema-strict BOL particulars from unformatted text via Gemini 3.8 Flash.</p>
          </CardContent>
        </Card>

        {/* WhatsApp Paste */}
        <Card className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all group" onClick={() => setActiveMethod("WHATSAPP")}>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900">WhatsApp Text</h4>
            <p className="text-xs text-slate-500 mt-2">Paste a multilingual chat message to auto-extract fields deterministically.</p>
          </CardContent>
        </Card>

        {/* Empty Grid */}
        <Card className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group" onClick={handleEmptyGrid}>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900">Manual Grid</h4>
            <p className="text-xs text-slate-500 mt-2">Start with an empty spreadsheet and type or paste data manually.</p>
          </CardContent>
        </Card>

        {/* Excel Paste */}
        <Card className="cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group" onClick={() => setActiveMethod("EXCEL")}>
          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-slate-900">Paste Excel</h4>
            <p className="text-xs text-slate-500 mt-2">Copy rows directly from Excel and paste them into the grid.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
