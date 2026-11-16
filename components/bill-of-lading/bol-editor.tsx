"use client"

import { useState, useEffect, useEffectEvent, useRef, useCallback, memo, useMemo, useDeferredValue, startTransition, type ReactNode } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import { DraftSaveQueue } from "@/lib/services/draft-save-queue"
import { putVaultItem, getVaultItem, deleteVaultItem } from "@/lib/save/indexed-db-vault"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShipperNameInput } from "./shipper-name-input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DOCUMENT_BACKGROUNDS } from "@/lib/document-backgrounds"

const safeChunkDynamic = <T,>(loader: () => Promise<T>): (() => Promise<T>) => {
  return () =>
    loader().catch((err) => {
      if (typeof window !== "undefined") {
        const msg = String(err?.message || err || "")
        if (
          err?.name === "ChunkLoadError" ||
          msg.includes("Loading chunk") ||
          msg.includes("Failed to load chunk") ||
          msg.includes("_next/static/chunks")
        ) {
          console.warn("[bol-editor] Stale chunk detected, refreshing page...", err)
          const lastReload = Number(sessionStorage.getItem("sky_chunk_reload") || "0")
          const now = Date.now()
          if (now - lastReload > 15000) {
            sessionStorage.setItem("sky_chunk_reload", String(now))
            window.location.reload()
          }
        }
      }
      throw err
    })
}

const A4Preview = dynamic(
  safeChunkDynamic(() => import("./a4-preview").then((m) => m.A4Preview)),
  {
    loading: () => (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-600">Loading document preview…</p>
      </div>
    ),
    ssr: false,
  }
)
import { A4PreviewToolbar } from "./a4-preview-toolbar"
import { useA4PreviewScale, A4_WIDTH_PX, A4_HEIGHT_PX, resetAllParentScrolls } from "./use-a4-preview-scale"
import { parseSyncedCargoItems, shouldSplitToPage2 } from "@/lib/utils/cargo-grid"
import { CopyWhatsAppButton } from "./copy-whatsapp-button"
import PrintSafeBOL from "./print-safe-bol"
import { BillOfLadingFormData, initialFormData, RouteStop, AFGHANISTAN_DOCUMENT_OPTIONS, DOCUMENT_CATEGORIES, AfghanistanDocumentDetail, type DocumentCategory, NOTE_THEMES, type NoteTheme, CARGO_ROUTE_NOTE_OPTIONS } from "@/lib/types/bill-of-lading"
import { isUUID, cleanBolNumber, normalizeBolRecord, parseBolSeq, formatCanonicalDriverRent } from "@/lib/utils/bol-filters"
import { onlineSaveManager } from "@/lib/client/online-save-manager"
import { OnlineSyncStatusBadge } from "@/components/sync/online-sync-status-badge"
import { ArrowLeft, Printer, Save, FileText, Eye, Plus, Loader2, Calendar, Truck, MapPin, MapPinOff, Trash2, ArrowRight, Package, Edit3, ImageIcon, Upload, RotateCcw, ScrollText, Check, Download, Building2, Phone, Mail, Ship, Plane, Train, AlertCircle, User, Bell, Globe, Shield, Leaf, Heart, Scale, Bookmark, BookmarkPlus, X, IdCard, Car, Landmark, ShieldCheck, Receipt, List, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, CheckCircle2, Circle, Sparkles, Copy, Box, ArrowLeftRight, Zap, Calculator, Sliders, SlidersHorizontal, Layers, Keyboard, Cloud, DownloadCloud, UploadCloud, RefreshCw, FileSpreadsheet, Coins, Hash, MoreHorizontal, Palette, ZoomIn, ZoomOut, Maximize2, Minimize2, FolderArchive, Search, Snowflake } from "lucide-react"
import { formatPersianDate, getDualDates } from "@/lib/utils/persian-date"
import {
  generateBOLPDFBlob,
  uploadPDFToServer,
  savePDFToDevice,
  openPDFPrintWindow,
  printPDFBlobInWindow,
  buildBolSmartFileName,
} from "@/lib/utils/pdf-upload"
import {
  buildShippingDocumentFileName,
  deriveShippingDocumentData,
  generateShippingDocumentsPDF,
  type ShippingDocumentKind,
  type StickerLayout,
} from "@/lib/utils/shipping-documents"
import { PackingListPdfPage } from "./shipping-documents/packing-list-pdf-page"
import { StickerPdfPage } from "./shipping-documents/sticker-pdf-page"
import { AfghanTruckPlate } from "@/components/ui/afghan-truck-plate"
import { RoutePresetSelector } from "./route-preset-selector"
import { ShipmentFilesSkeleton } from "./shipment-files-skeleton"
const SavedDocuments = dynamic(
  safeChunkDynamic(() => import("./saved-documents").then((m) => m.SavedDocuments)),
  {
    loading: () => <p role="status" className="p-6 text-sm text-slate-600">Loading saved BOLs…</p>,
    ssr: false,
  }
)
const LedgerView = dynamic(
  safeChunkDynamic(() => import("@/components/ledger-view").then((m) => m.LedgerView)),
  {
    loading: () => <p role="status" className="p-6 text-sm text-slate-600">Loading account ledger…</p>,
    ssr: false,
  }
)
const BolFilesAttachmentsTab = dynamic(
  safeChunkDynamic(() => import("./bol-files-attachments-tab").then((m) => m.BolFilesAttachmentsTab)),
  {
    loading: () => <div className="p-4 sm:p-6"><ShipmentFilesSkeleton /></div>,
    ssr: false,
  }
)
const PackingListView = dynamic(
  safeChunkDynamic(() => import("./packing-list-view").then((m) => m.PackingListView)),
  {
    loading: () => <div className="p-6 text-sm text-slate-600">Loading Packing List…</div>,
    ssr: false,
  }
)
const CommercialInvoiceView = dynamic(
  safeChunkDynamic(() => import("./commercial-invoice-view").then((m) => m.CommercialInvoiceView)),
  {
    loading: () => <div className="p-6 text-sm text-slate-600">Loading Commercial Invoice…</div>,
    ssr: false,
  }
)
import { getFinancialsMap, saveFinancialsForEntry } from "@/lib/services/ledger-sync-utils"
import { findDuplicatePartyCandidates } from "@/lib/utils/duplicate-prevention"
import type { PrintOptions } from "@/components/print-options-dialog"
const PrintOptionsDialog = dynamic(
  safeChunkDynamic(() => import("@/components/print-options-dialog").then((m) => m.PrintOptionsDialog)),
  { ssr: false }
)
import { BolSettingsSkeleton } from "./settings/bol-settings-skeleton"
const BackgroundGallery = dynamic(safeChunkDynamic(() => import("./background-gallery").then((m) => m.BackgroundGallery)), { ssr: false })
const BolSettingsCenter = dynamic(
  safeChunkDynamic(() => import("./settings/bol-settings-center").then((m) => m.BolSettingsCenter)),
  {
    loading: () => <BolSettingsSkeleton />,
    ssr: false,
  }
)
const ShippingDocumentCenter = dynamic(safeChunkDynamic(() => import("./shipping-document-center").then((m) => m.ShippingDocumentCenter)), { ssr: false })
const CloudSyncModal = dynamic(safeChunkDynamic(() => import("./cloud-sync-modal").then((m) => m.CloudSyncModal)), { ssr: false })
const PartyDirectoryModal = dynamic(safeChunkDynamic(() => import("./party-directory-modal").then((m) => m.PartyDirectoryModal)), { ssr: false })
import {
  dougharounToMersinLegs,
  nimrozToBandarAbbasLegs,
  nimrozFullWayReeferSwitchLegs,
  dogharonToMersinReeferLegs,
  exportCorridorToBillOfLadingRoutes,
} from "@/lib/services/multi-leg-quote-service"

interface BOLEditorProps {
  onSave?: (data: BillOfLadingFormData) => void
  onRefreshDocuments?: () => void
  loadDocumentId?: string | null
  onDocumentLoaded?: () => void
  savedDocumentsPanel?: ReactNode
  accountLedgerPanel?: ReactNode
}

interface SavedParty {
  id: string
  name: string
  address: string
  contact: string
  email: string
  savedAt: string
}

function PrintPreviewPortal({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.setAttribute("data-print-active", "bol")
    }
    const handleAfterPrint = () => {
      document.body.removeAttribute("data-print-active")
    }
    window.addEventListener("beforeprint", handleBeforePrint)
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      window.removeEventListener("afterprint", handleAfterPrint)
      document.body.removeAttribute("data-print-active")
    }
  }, [])

  useEffect(() => {
    let root = document.getElementById("bol-print-preview-root") as HTMLDivElement | null
    if (!root) {
      root = document.createElement("div")
      root.id = "bol-print-preview-root"
      root.className = "bol-print-root"
      root.dataset.printRoot = "true"
      document.body.appendChild(root)
    }
    setContainer(root)
  }, [])

  if (!container) return null
  return createPortal(children, container)
}

const SAVED_SHIPPERS_STORAGE_KEY = "sky-bol-saved-shippers"
const SAVED_CONSIGNEES_STORAGE_KEY = "sky-bol-saved-consignees"
const SAVED_NOTIFY_PARTIES_STORAGE_KEY = "sky-bol-saved-notify-parties"
const SAVED_NOTES_1_STORAGE_KEY = "sky-bol-saved-notes-1"
const SAVED_NOTES_2_STORAGE_KEY = "sky-bol-saved-notes-2"
const ACCOUNT_CUSTOM_COMPANIES_STORAGE_KEY = "sky-bol-account-custom-companies"
const ACCOUNT_LEDGER_STORAGE_KEY = "sky-bol-company-ledgers"
const PDF_COMPANY_SETTINGS_STORAGE_KEY = "sky-bol-company-pdf-settings"
const SAVED_ROUTE_PRESETS_STORAGE_KEY = "sky-bol-custom-route-presets"
const SHIPPER_SEED_LIST: SavedParty[] = []
const CONSIGNEE_SEED_LIST: SavedParty[] = []
const NOTIFY_PARTY_SEED_LIST: SavedParty[] = []

export interface SavedRoutePreset {
  id: string
  title: string
  titlePersian?: string
  icon?: string
  routes: RouteStop[]
  savedAt: string
}

interface SavedNoteOption {
  id: string
  label: string
  content: string
  theme?: "red" | "blue" | "green" | "purple" | "orange" | "gray"
  savedAt?: string
}

const NOTE_1_SEED_LIST: SavedNoteOption[] = [
  {
    id: "n1-yaramel",
    label: "دکندهار بارگیری مسؤل",
    content: "نظرمحمد (یارمل)\n(+93) 0 700 203 307",
    theme: "blue",
  },
  {
    id: "n1-loading-contact",
    label: "Loading Contact / مسئول بارگیری",
    content: "نظرمحمد (یارمل)\n(+93) 0 700 203 307",
    theme: "blue",
  },
  {
    id: "n1-skyariana-office",
    label: "Sky Ariana Head Office / دفتر مرکزی",
    content: "دفتر مرکزی اسکای آریانا لیمیتد\n+93 700 939 365 / +93 711 435 529\ninfo@skyariana.com",
    theme: "blue",
  },
  {
    id: "n1-exporter-contact",
    label: "Exporter Contact / تماس صادرکننده",
    content: "+93 700 939 365 / +93 711 435 529",
    theme: "green",
  },
]

const NOTE_2_SEED_LIST: SavedNoteOption[] = [
  {
    id: "n2-dougharoun-islamqala",
    label: "نماینده دوغارون و اسلام قلعه",
    content: "عبدالوهاب ریگوال اسلام قلعه / نجیب الله حسین محمودی مقدم\n0796140001  0703130001\nنماینده دوغارون / شماره تماس : 09152091993",
    theme: "blue",
  },
  {
    id: "n2-nimroz-milak",
    label: "نماینده نمبرونه - نیمروز",
    content: "نماینده نیمروز و میلک\n0711 263 528 │ 079 335 3246",
    theme: "red",
  },
  {
    id: "n2-torghundi",
    label: "نماینده تورغندی و هرات",
    content: "نماینده مرزی تورغندی و هرات\nحاجی معلم صاحب : 0799007371 │ عصمت الله : 0729807676 │ حکمت الله : 0794983011",
    theme: "purple",
  },
  {
    id: "n2-hairatan",
    label: "نماینده حیرتان و مزار شریف",
    content: "نماینده مرزی حیرتان و بلخ\nدفتر بندر حیرتان : 0700939365 │ 0700203307",
    theme: "green",
  },
  {
    id: "n2-spinboldak",
    label: "نماینده اسپین بولدک - قندهار",
    content: "نماینده مرزی اسپین بولدک و چمن\nدفتر بولدک : 0700203307 │ 0700939365",
    theme: "orange",
  },
]

function mergeSavedNoteOptions(seedOptions: SavedNoteOption[], storedOptions: SavedNoteOption[]) {
  const byId = new Map<string, SavedNoteOption>()
  seedOptions.forEach((seed) => byId.set(seed.id, seed))
  // Stored copies must win so edits to the built-in presets survive a reload.
  storedOptions.forEach((item) => byId.set(item.id, item))
  return Array.from(byId.values())
}

interface AccountLedgerEntry {
  id: string
  date: string
  description: string
  invoiceNo: string
  shipDate: string
  barnamehNo?: string
  bolNo: string
  truckNo?: string
  containerNo: string
  consignee: string
  quantity: string
  driverRent?: string
  driverFreight?: string
  debit: string
  credit: string
  pdfFile?: string
}

type AccountLedgerRecords = Record<string, AccountLedgerEntry[]>

const accountCompanyKey = (companyName: string) => companyName.trim().toLowerCase()
const getInvoiceNoFromDescription = (description?: string | null) => {
  const text = description || ""
  const match = text.match(/invoice\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]*)/i)
  return match?.[1]?.trim() || ""
}

function cleanPartyName(name?: string | null): string {
  if (!name || typeof name !== "string") return ""
  return name.replace(/^[\s@#*]+/, "").replace(/[\s@#*]+$/, "").trim()
}

function mergeSavedParties(seedParties: SavedParty[], storedParties: SavedParty[]) {
  const byName = new Map<string, SavedParty>()

  for (const party of seedParties) {
    const cleaned = cleanPartyName(party.name)
    if (cleaned) {
      byName.set(cleaned.toLowerCase(), { ...party, name: cleaned })
    }
  }

  for (const party of storedParties) {
    const cleaned = cleanPartyName(party.name)
    if (cleaned) {
      const existing = byName.get(cleaned.toLowerCase())
      byName.set(cleaned.toLowerCase(), {
        ...party,
        name: cleaned,
        address: party.address?.trim() || existing?.address || "",
        contact: party.contact?.trim() || existing?.contact || "",
        email: party.email?.trim() || existing?.email || "",
      })
    }
  }

  const usedIds = new Map<string, number>()

  return Array.from(byName.values())
    .filter((party) => party.name.trim())
    .map((party) => {
      const baseId = party.id?.trim() || `saved-party-${party.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      const count = usedIds.get(baseId) || 0
      usedIds.set(baseId, count + 1)

      if (count === 0) {
        return { ...party, id: baseId }
      }

      return {
        ...party,
        id: `${baseId}-${count + 1}`,
      }
    })
}

function syncBolToAccountLedger(data: BillOfLadingFormData & { bol_number?: string }) {
  try {
    const shipperName = data.shipper_name ? String(data.shipper_name).trim() : ""
    const bolNo = data.bol_number ? String(data.bol_number).trim() : ""

    if (!shipperName || !bolNo) return

    const companyKey = accountCompanyKey(shipperName)
    const storedCompanies = JSON.parse(
      window.localStorage.getItem(ACCOUNT_CUSTOM_COMPANIES_STORAGE_KEY) ||
      window.localStorage.getItem("skybol:account-custom-companies") ||
      "[]"
    ) as string[]
    const hasCompany = storedCompanies.some((companyName) => accountCompanyKey(companyName) === companyKey)

    const updatedCompanies = hasCompany ? storedCompanies : [...storedCompanies, shipperName]
    if (!hasCompany) {
      window.localStorage.setItem(ACCOUNT_CUSTOM_COMPANIES_STORAGE_KEY, JSON.stringify(updatedCompanies))
      window.localStorage.setItem("skybol:account-custom-companies", JSON.stringify(updatedCompanies))
      window.dispatchEvent(new CustomEvent("skybol:account-company-updated", { detail: { companyName: shipperName } }))
    }

    const rawRecords = window.localStorage.getItem(ACCOUNT_LEDGER_STORAGE_KEY) || window.localStorage.getItem("skybol:account-ledgers") || "{}"
    const records = JSON.parse(rawRecords) as AccountLedgerRecords
    const existingRow = Object.values(records)
      .flat()
      .find((row) => (row.barnamehNo && row.barnamehNo.trim().toLowerCase() === bolNo.toLowerCase()) || (row.bolNo && row.bolNo.trim().toLowerCase() === bolNo.toLowerCase()))
    
    const financialsMap = getFinancialsMap()
    const fin = bolNo ? financialsMap[bolNo.trim().toLowerCase()] : undefined

    const rawDriverRent = data.driver_rent != null ? String(data.driver_rent).trim() : ""
    const driverRentVal = fin?.driverFreight || rawDriverRent || existingRow?.driverFreight || existingRow?.driverRent || ""
  
  let debitVal = 0
  if (fin?.debit !== undefined && fin.debit > 0) {
    debitVal = fin.debit
  } else if (existingRow?.debit !== undefined && existingRow?.debit !== "" && Number(existingRow.debit) > 0) {
    debitVal = Number(existingRow.debit)
  } else if ((data as any)?.debit && Number((data as any).debit) > 0) {
    debitVal = Number((data as any).debit)
  }

  let creditVal = 0
  if (fin?.credit !== undefined && fin.credit > 0) {
    creditVal = fin.credit
  } else if (existingRow?.credit !== undefined && existingRow?.credit !== "" && Number(existingRow.credit) > 0) {
    creditVal = Number(existingRow.credit)
  } else if ((data as any)?.credit && Number((data as any).credit) > 0) {
    creditVal = Number((data as any).credit)
  }

  const nextRow: AccountLedgerEntry = {
    id: existingRow?.id || crypto.randomUUID(),
    date: fin?.date || existingRow?.date || data.issue_date || new Date().toISOString().split("T")[0],
    description: shipperName,
    invoiceNo: fin?.invoiceNo || existingRow?.invoiceNo || getInvoiceNoFromDescription(data.cargo_description),
    shipDate: existingRow?.shipDate || data.issue_date || "",
    barnamehNo: bolNo,
    bolNo: bolNo,
    truckNo: data.truck_number || existingRow?.truckNo || "",
    containerNo: data.container_numbers || existingRow?.containerNo || "",
    consignee: data.consignee_name || existingRow?.consignee || "",
    quantity: data.number_of_packages || existingRow?.quantity || "",
    driverRent: driverRentVal,
    driverFreight: driverRentVal,
    debit: debitVal as any,
    credit: creditVal as any,
    pdfFile: fin?.pdfPathname || existingRow?.pdfFile || "",
  }

  if (debitVal > 0 || creditVal > 0 || driverRentVal) {
    saveFinancialsForEntry(bolNo, nextRow.id, nextRow)
  }

  const nextRecords = Object.fromEntries(
    Object.entries(records).map(([key, rows]) => [
      key, 
      rows.filter((row) => (row.barnamehNo || row.bolNo || "").trim().toLowerCase() !== bolNo.toLowerCase())
    ])
  ) as AccountLedgerRecords

  const companyRows = nextRecords[companyKey] || []
  nextRecords[companyKey] = [nextRow, ...companyRows]
  nextRecords[shipperName.toLowerCase()] = [nextRow, ...companyRows]

  try {
    window.localStorage.setItem(ACCOUNT_LEDGER_STORAGE_KEY, JSON.stringify(nextRecords))
    window.localStorage.setItem("skybol:account-ledgers", JSON.stringify(nextRecords))
  } catch (storageErr) {
    console.warn("Storage quota exceeded for ledger cache, server persistence will handle it:", storageErr)
  }

  // Sync to backend account ledgers API
  fetch("/api/account-ledgers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accounts: updatedCompanies,
      ledgerEntries: nextRecords,
    }),
    keepalive: true,
  }).catch((err) => console.warn("Background ledger sync to API:", err))

  fetch("/api/bol-account-ledgers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customCompanies: updatedCompanies,
      ledgerRecords: nextRecords,
    }),
    keepalive: true,
  }).catch(() => {})

  fetch("/api/ledger-entries", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      barnamehNo: bolNo,
      companyId: companyKey,
      ...nextRow,
    }),
    keepalive: true,
  }).catch(() => {})

  window.dispatchEvent(
    new CustomEvent("skybol:account-ledger-updated", {
      detail: { companyName: shipperName, bolNo },
    })
  )
  } catch (syncErr) {
    console.warn("syncBolToAccountLedger non-fatal error:", syncErr)
  }
}

/**
 * Yields execution to the browser's paint pipeline so user interactions
 * (pointer clicks, active button CSS states, focus rings) paint in < 16ms
 * before any heavy React state transitions or component mounts run.
 */
function yieldToPaint(): Promise<void> {
  if (typeof window !== "undefined" && "scheduler" in window && typeof (window as any).scheduler?.yield === "function") {
    return (window as any).scheduler.yield()
  }
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    // requestAnimationFrame never fires while the window is hidden/occluded —
    // cap the paint yield so deferred actions cannot hang in that state.
    const timer = setTimeout(finish, 50)
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => {
        clearTimeout(timer)
        finish()
      })
    } else {
      clearTimeout(timer)
      setTimeout(finish, 0)
    }
  })
}

export function BOLEditor({ onSave, onRefreshDocuments, loadDocumentId, onDocumentLoaded, savedDocumentsPanel, accountLedgerPanel }: BOLEditorProps) {
  const [formData, setFormData] = useState<BillOfLadingFormData>(initialFormData)
  const deferredFormData = useDeferredValue(formData)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Section 23: Warn user before navigating away if they have unsaved changes in the BOL editor
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?"
        return e.returnValue
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const [bolNumber, setBolNumber] = useState<string>("BOL-2026-NSA685")
  const [isEditingBolNumber, setIsEditingBolNumber] = useState(false)
  const [issueDate, setIssueDate] = useState<string>("")
  const [persianDate, setPersianDate] = useState<string>("")
  const [persianDateNumeric, setPersianDateNumeric] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isShippingExporting, setIsShippingExporting] = useState(false)
  const editorRootRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return
    const updateHeight = () => editorRootRef.current?.style.setProperty('--bol-toolbar-height', toolbar.offsetHeight + 'px')
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(toolbar)
    return () => observer.disconnect()
  }, [])

  const [activeTab, setActiveTab] = useState<string>("form")
  const [pendingTab, setPendingTab] = useState<string | null>(null)
  const activeTabRef = useRef<string>("form")
  activeTabRef.current = activeTab
  const [isHydrating, setIsHydrating] = useState(false)
  const [activeBolId, setActiveBolId] = useState<string>("")
  const [hydrationError, setHydrationError] = useState<string | null>(null)
  const loadRequestIdRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeBolIdRef = useRef<string>("")
  activeBolIdRef.current = activeBolId
  const bolNumberRef = useRef<string>(bolNumber)
  bolNumberRef.current = bolNumber
  const formDataRef = useRef<any>(formData)
  formDataRef.current = formData

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const [isPreviewReady, setIsPreviewReady] = useState(false)

  // Two-phase progressive mount for A4 Preview to guarantee < 16ms INP:
  // Phase 1 (Frame 1): Renders lightweight paper skeleton immediately so the tab switch paints instantly.
  // Phase 2 (Frame 2): Double-RAF mounts the full A4Preview component after the browser paint finishes.
  useEffect(() => {
    if (activeTab === "preview") {
      let isCancelled = false
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isCancelled) {
            setIsPreviewReady(true)
          }
        })
      })
      return () => {
        isCancelled = true
        cancelAnimationFrame(rafId)
      }
    } else {
      setIsPreviewReady(false)
    }
  }, [activeTab])

  const [isSettingsReady, setIsSettingsReady] = useState(false)

  // Two-phase progressive mount for Document Configuration Settings to guarantee < 16ms INP:
  // Phase 1 (Frame 1): Renders lightweight settings skeleton immediately so the tab switch paints instantly.
  // Phase 2 (Frame 2): Double-RAF mounts the full BolSettingsCenter component after the browser paint finishes.
  useEffect(() => {
    if (activeTab === "pdf-settings") {
      let isCancelled = false
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!isCancelled) {
            setIsSettingsReady(true)
          }
        })
      })
      return () => {
        isCancelled = true
        cancelAnimationFrame(rafId)
      }
    } else {
      setIsSettingsReady(false)
    }
  }, [activeTab])

  // Intelligent background preloader: Warm up chunks and prime critical images in browser cache
  useEffect(() => {
    const preloadPreviewAndAssets = () => {
      void import("./a4-preview").catch(() => {})
      void import("./settings/bol-settings-center").catch(() => {})
      if (typeof window !== "undefined") {
        const prime = (src: string) => {
          const img = new Image()
          img.src = src
        }
        prime("/images/sky-ariana-logo.png")
        prime("/images/mountain-watermark-premium.png")
      }
    }
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        const handle = (window as any).requestIdleCallback(preloadPreviewAndAssets, { timeout: 1500 })
        return () => (window as any).cancelIdleCallback(handle)
      } else {
        const timer = setTimeout(preloadPreviewAndAssets, 600)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const flushDraftRef = useRef<((skipStateUpdate?: boolean) => void) | null>(null)
  const pendingTabRef = useRef<string | null>(null)

  const handleTabChange = useCallback((newTab: string) => {
    if (newTab === activeTab || newTab === pendingTabRef.current) return
    pendingTabRef.current = newTab
    setPendingTab(newTab)

    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(`bol:tab-click-${newTab}`)
    }

    if (typeof window !== "undefined") {
      // Defer URL update to idle/timeout so it never blocks the interaction paint
      setTimeout(() => {
        try {
          const url = new URL(window.location.href)
          url.searchParams.set("tab", newTab)
          if (bolNumber) {
            url.searchParams.set("bol", bolNumber)
          }
          const newUrlStr = url.pathname + url.search + url.hash
          window.history.replaceState(window.history.state, "", newUrlStr)
        } catch (_) {}
      }, 120)

      // Defer draft serialization and LocalStorage write off the critical render path
      const deferDraft = "requestIdleCallback" in window
        ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 2000 })
        : (cb: () => void) => setTimeout(cb, 300)

      deferDraft(() => {
        flushDraftRef.current?.(true)
      })
    }

    // Break out of synchronous event loop and yield to browser's paint engine.
    // This guarantees the button click/press visual state paints in < 16ms,
    // completely eliminating the INP blocking issue on tab triggers.
    yieldToPaint().then(() => {
      pendingTabRef.current = null
      startTransition(() => {
        setPendingTab(null)
        setActiveTab(newTab)
      })
    })
  }, [activeTab, bolNumber])

  useEffect(() => {
    pendingTabRef.current = null
    setPendingTab(null)
    const mainWorkspace = document.querySelector('[data-main-workspace="true"]') as HTMLElement | null
    if (activeTab === "preview") {
      if (mainWorkspace) {
        mainWorkspace.dataset.previewActive = "true"
      }
      requestAnimationFrame(() => {
        if (mainWorkspace && (mainWorkspace.scrollTop !== 0 || mainWorkspace.scrollLeft !== 0)) {
          mainWorkspace.scrollTop = 0
          mainWorkspace.scrollLeft = 0
        }
        resetAllParentScrolls()
      })
    } else {
      if (mainWorkspace) {
        delete mainWorkspace.dataset.previewActive
      }
    }
  }, [activeTab])
  const [logoUrl, setLogoUrl] = useState<string>("/images/sky-ariana-logo.png")
  const [brandLockupUrl, setBrandLockupUrl] = useState<string>("/images/sky-ariana-brand-lockup.png")
  const [logoDesignId, setLogoDesignId] = useState<string>("modern-flat")
  const logoInputRef = useRef<HTMLInputElement>(null)
  const isCompanySettingsLoadedRef = useRef(false)
  const [companyName, setCompanyName] = useState("SKY ARIANA LIMITED")
  const [companyNamePersian, setCompanyNamePersian] = useState("شرکت حمل و نقل بین المللی اسکای آریانا")
  const [companySubtitle, setCompanySubtitle] = useState("Import & Export - International Transportation")
  const [companyPhone, setCompanyPhone] = useState("+93 700 939 365, +93 711 435 529")
  const [companyEmail, setCompanyEmail] = useState("info@skyariana.com, transport@skyariana.com")
  const [companyAddress, setCompanyAddress] = useState("2nd Floor, 16 No. Office, Shahidano, Chowk, Etimad Rahmi Market, Kandahar, Afghanistan")
  const [companyLicence, setCompanyLicence] = useState("2401-2198")
  const [bgImageUrl, setBgImageUrl] = useState<string>("/images/mountain-watermark-premium.png")
  const [bgOpacity, setBgOpacity] = useState<number>(0.22)
  const previewPageCount = useMemo(() => {
    const synced = parseSyncedCargoItems(deferredFormData)
    const isMulti = shouldSplitToPage2({
      cargoCount: synced.items.length,
      routeCount: (deferredFormData.routes || []).length,
      descLineCount: (deferredFormData.cargo_description || "").split("\n").filter(Boolean).length,
      hasShippingData: [
        deferredFormData.port_of_loading,
        deferredFormData.port_of_discharge,
        deferredFormData.place_of_delivery,
        deferredFormData.vessel_name,
        deferredFormData.voyage_number,
        deferredFormData.freight_payable_at,
        deferredFormData.freight_terms,
      ].some(Boolean),
      hasRouteNote: Boolean(deferredFormData.cargo_route_note?.trim()),
    })
    return isMulti ? 2 : 1
  }, [deferredFormData])

  const hasBolData = Boolean(
    bolNumber ||
    formData.bol_number ||
    formData.shipper_name ||
    formData.consignee_name ||
    formData.cargo_description ||
    formData.number_of_packages
  )

  const {
    viewportRef,
    previewScale,
    previewMode,
    setPreviewMode,
    setManualScale,
    zoomIn,
    zoomOut,
    isFullscreen,
    toggleFullscreen,
    isScaleReady,
    showDiagnostics,
    setShowDiagnostics,
    debugMetrics,
    stageWidth,
    stageHeight,
    verticalPadding,
    totalUnscaledHeight,
  } = useA4PreviewScale(activeTab === "preview", previewPageCount)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editDocumentId, setEditDocumentId] = useState<string | null>(null)
  const editDocumentIdRef = useRef<string | null>(null)
  editDocumentIdRef.current = editDocumentId
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle" | "local" | "error">("idle")
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>("")
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false)
  const [checkingDraft, setCheckingDraft] = useState(true)
  const draftQueue = useRef<DraftSaveQueue<string> | null>(null)
  const draftRevision = useRef(0)
  const queuedRevision = useRef(0)
  useEffect(() => {
    const queue = new DraftSaveQueue<string>(async (body) => {
      const response = await fetch("/api/draft?type=bol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
      if (!response.ok) throw new Error("Draft backup failed")
      const result: { success?: boolean } = await response.json()
      if (result.success !== true) throw new Error("Draft backup was not confirmed")
    }, (status) => {
      if (queuedRevision.current === draftRevision.current) {
        setAutoSaveStatus(status)
        if (status === "saved") {
          const nowFormatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          setLastAutoSaveTime(nowFormatted)
          setLastAutoSavedTime(nowFormatted)
        }
      }
    })
    draftQueue.current = queue
    const retry = () => queue.retry()
    window.addEventListener("online", retry)
    return () => {
      queue.dispose()
      window.removeEventListener("online", retry)
      draftQueue.current = null
    }
  }, [])

  // Synchronous LocalStorage Draft Persist (0ms latency, runs immediately on every change)
  const persistLocalDraftSync = useCallback(() => {
    if (typeof window === "undefined") return null
    try {
      const currentDocData = {
        ...formData,
        bol_number: bolNumber,
        issue_date: issueDate,
        persian_date: persianDate,
        persian_date_numeric: persianDateNumeric,
        updated_at: new Date().toISOString(),
      }

      // Tier 1: Instant LocalStorage Write
      window.localStorage.setItem("skybol:active-form-draft", JSON.stringify(currentDocData))
      window.localStorage.setItem(
        "sky-bol-live-draft",
        JSON.stringify({
          formData: currentDocData,
          bolNumber,
          issueDate,
          persianDate,
          persianDateNumeric,
          savedAt: currentDocData.updated_at,
        })
      )
      if (bolNumber) {
        window.localStorage.setItem("skybol:last-active-document-id", bolNumber)
        window.localStorage.setItem(`skybol:draft:${cleanBolNumber(bolNumber)}`, JSON.stringify(currentDocData))
      }

      // Tier 2: SessionStorage Isolation Mirror (survives accidental refreshes even if localStorage is full or locked)
      try {
        window.sessionStorage.setItem("skybol:active-form-draft:backup", JSON.stringify(currentDocData))
      } catch (_) {}

      // Tier 3: IndexedDB Data Vault (asynchronous durable persistence with large quota)
      void putVaultItem("bol_drafts", "skybol:active-form-draft", currentDocData).catch(() => {})
      if (bolNumber) {
        void putVaultItem("bol_drafts", `skybol:draft:${cleanBolNumber(bolNumber)}`, currentDocData).catch(() => {})
      }

      return currentDocData
    } catch (e) {
      console.warn("Local storage draft save error:", e)
      return null
    }
  }, [formData, bolNumber, issueDate, persianDate, persianDateNumeric])

  // Flush Draft to Server Queue (Atomically writes to .local-bol-draft.json)
  const flushDraftToServer = useCallback((skipStateUpdate = false) => {
    if (typeof window === "undefined" || checkingDraft || hasRecoverableDraft || isHydrating) return
    const currentDocData = persistLocalDraftSync()
    if (!currentDocData) return

    // Any valid BOL number or non-empty form field is backed up
    const hasAnyContent = Boolean(
      (bolNumber && bolNumber.trim().length >= 2) ||
      Object.entries(currentDocData).some(([key, val]) => {
        if (["id", "type", "created_at", "updated_at", "revision", "user_id"].includes(key)) return false
        if (key === "routes") return Array.isArray(val) && val.length > 2
        if (typeof val === "string") return val.trim().length > 0 && val.trim() !== "0"
        return false
      })
    )

    if (hasAnyContent && draftQueue.current) {
      draftRevision.current += 1
      queuedRevision.current = draftRevision.current
      if (!skipStateUpdate && isMountedRef.current) {
        setAutoSaveStatus("saving")
      }
      draftQueue.current.enqueue(JSON.stringify({ type: "bol", draft: currentDocData }))
    } else {
      if (!skipStateUpdate && isMountedRef.current) {
        setAutoSaveStatus("local")
      }
    }

    // Tier 3: Auto-save Shipper & Consignee into Autocomplete Databases (deferred to idle to eliminate main thread blocking)
    const deferPartyPersist = typeof window !== "undefined" && "requestIdleCallback" in window
      ? (cb: () => void) => (window as any).requestIdleCallback(cb, { timeout: 1200 })
      : (cb: () => void) => setTimeout(cb, 600)

    deferPartyPersist(() => {
      try {
        if (formData.shipper_name?.trim()) {
          const sName = formData.shipper_name.trim()
          const rawS = window.localStorage.getItem(SAVED_SHIPPERS_STORAGE_KEY)
          let listS: SavedParty[] = []
          try { listS = rawS ? JSON.parse(rawS) : [] } catch (_) {}
          const matchS = listS.find((s) => s.name.trim().toLowerCase() === sName.toLowerCase())
          const curS: SavedParty = {
            id: matchS ? matchS.id : crypto.randomUUID(),
            name: sName,
            address: formData.shipper_address || "",
            contact: formData.shipper_contact || "",
            email: formData.shipper_email || "",
            savedAt: new Date().toISOString(),
          }
          const nextS = [curS, ...listS.filter((s) => s.id !== curS.id)].slice(0, 1000)
          window.localStorage.setItem(SAVED_SHIPPERS_STORAGE_KEY, JSON.stringify(nextS))
        }

        if (formData.consignee_name?.trim()) {
          const cName = formData.consignee_name.trim()
          const rawC = window.localStorage.getItem(SAVED_CONSIGNEES_STORAGE_KEY)
          let listC: SavedParty[] = []
          try { listC = rawC ? JSON.parse(rawC) : [] } catch (_) {}
          const matchC = listC.find((c) => c.name.trim().toLowerCase() === cName.toLowerCase())
          const curC: SavedParty = {
            id: matchC ? matchC.id : crypto.randomUUID(),
            name: cName,
            address: formData.consignee_address || "",
            contact: formData.consignee_contact || "",
            email: formData.consignee_email || "",
            savedAt: new Date().toISOString(),
          }
          const nextC = [curC, ...listC.filter((c) => c.id !== curC.id)].slice(0, 1000)
          window.localStorage.setItem(SAVED_CONSIGNEES_STORAGE_KEY, JSON.stringify(nextC))
        }
      } catch (_) {}
    })
  }, [persistLocalDraftSync, checkingDraft, hasRecoverableDraft, isHydrating, bolNumber, formData])

  // Keep ref synchronized for tab changes and lifecycle events
  useEffect(() => {
    flushDraftRef.current = flushDraftToServer
  }, [flushDraftToServer])

  // Enterprise Multi-Tier Real-Time Auto-Saving Engine (Debounced local 150ms, debounced server 500ms, 30s heartbeat)
  useEffect(() => {
    if (typeof window === "undefined") return
    if (checkingDraft || hasRecoverableDraft || isHydrating) return

    // 1. Debounced local write (150ms) to eliminate main-thread blocking during active keystrokes
    const localTimer = setTimeout(() => {
      persistLocalDraftSync()
    }, 150)

    // 2. Schedule debounced server backup (500ms) - only flip autoSaveStatus to "saving" when server queue actually fires
    const serverTimer = setTimeout(() => {
      if (isMountedRef.current) {
        setAutoSaveStatus("saving")
      }
      flushDraftToServer()
    }, 500)

    // 3. Heartbeat backup every 30 seconds (guarded by visibility to conserve CPU)
    const heartbeat = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return
      flushDraftToServer(true)
    }, 30000)

    return () => {
      clearTimeout(localTimer)
      clearTimeout(serverTimer)
      clearInterval(heartbeat)
      // Note: Do NOT flush synchronously on every keystroke/effect re-run.
      // Doing so previously blocked the main thread for >1000ms on resets and fast typing.
    }
  }, [formData, bolNumber, issueDate, persianDate, persianDateNumeric, checkingDraft, hasRecoverableDraft, isHydrating, persistLocalDraftSync, flushDraftToServer])

  // Dedicated unmount & page visibility lifecycle listeners (attached once on mount)
  useEffect(() => {
    if (typeof window === "undefined") return
    const handleFlush = () => {
      persistLocalDraftSync()
      flushDraftRef.current?.(true)
      void draftQueue.current?.flush()
    }
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        persistLocalDraftSync()
        flushDraftRef.current?.(true)
        void draftQueue.current?.flush()
      }
    }

    window.addEventListener("pagehide", handleFlush)
    window.addEventListener("beforeunload", handleFlush)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      window.removeEventListener("pagehide", handleFlush)
      window.removeEventListener("beforeunload", handleFlush)
      document.removeEventListener("visibilitychange", handleVisibility)
      flushDraftRef.current?.(true)
      void draftQueue.current?.flush()
    }
  }, [persistLocalDraftSync])

  useEffect(() => {
    const handleOnlineSyncComplete = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.count) {
        toast.success(`✓ Synchronized ${detail.count} document(s) with online cloud!`, {
          description: detail.bolNumbers?.length ? `Documents: ${detail.bolNumbers.join(", ")}` : undefined,
        })
        onRefreshDocuments?.()
      }
    }
    window.addEventListener("skybol:online-sync-complete", handleOnlineSyncComplete)
    return () => window.removeEventListener("skybol:online-sync-complete", handleOnlineSyncComplete)
  }, [onRefreshDocuments])
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState<number | null>(null)
  const [activeLocationField, setActiveLocationField] = useState<"en" | "fa" | null>(null)

  useEffect(() => {
    if (showLocationDropdown === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLocationDropdown(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showLocationDropdown])
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("ALL")
  const [selectedIndiaCategoryFilter, setSelectedIndiaCategoryFilter] = useState("ALL")
  const [selectedIranCategoryFilter, setSelectedIranCategoryFilter] = useState("ALL")
  const [disableModeFilter, setDisableModeFilter] = useState(false)
  const [showStampSignature, setShowStampSignature] = useState(true)
  const [routeLocationSearch, setRouteLocationSearch] = useState("")
  const [filterByRouteInput, setFilterByRouteInput] = useState(false)
  const [savedShippers, setSavedShippers] = useState<SavedParty[]>([])
  const [selectedShipperId, setSelectedShipperId] = useState<string>("")
  const [showShipperDropdown, setShowShipperDropdown] = useState(false)
  const [shipperSearchQuery, setShipperSearchQuery] = useState("")
  const [savedConsignees, setSavedConsignees] = useState<SavedParty[]>([])
  const [selectedConsigneeId, setSelectedConsigneeId] = useState<string>("")
  const [showConsigneeDropdown, setShowConsigneeDropdown] = useState(false)
  const [consigneeSearchQuery, setConsigneeSearchQuery] = useState("")
  const [consigneeDirectorySearch, setConsigneeDirectorySearch] = useState("")
  const [isBrowseConsigneeModalOpen, setIsBrowseConsigneeModalOpen] = useState(false)
  const [savedNotifyParties, setSavedNotifyParties] = useState<SavedParty[]>([])
  const [selectedNotifyPartyId, setSelectedNotifyPartyId] = useState<string>("")
  const [showNotifyPartyDropdown, setShowNotifyPartyDropdown] = useState(false)
  const [notifyPartySearchQuery, setNotifyPartySearchQuery] = useState("")
  const [notifyDirectorySearch, setNotifyDirectorySearch] = useState("")
  const [isBrowseNotifyModalOpen, setIsBrowseNotifyModalOpen] = useState(false)
  const [shipperDirectorySearch, setShipperDirectorySearch] = useState("")
  const [isBrowseShipperModalOpen, setIsBrowseShipperModalOpen] = useState(false)
  const [apiShippers, setApiShippers] = useState<SavedParty[]>([])
  const [apiConsignees, setApiConsignees] = useState<SavedParty[]>([])
  const [apiNotifyParties, setApiNotifyParties] = useState<SavedParty[]>([])
  const [savedTruckPresets, setSavedTruckPresets] = useState<Array<{
    id: string
    label: string
    truck_number: string
    driver_name: string
    driver_father_name: string
    driver_contact: string
    driver_rent: string
  }>>([
    {
      id: "preset-kandahar",
      label: "کندهار - هلمند | ۳۲۹۲ هلمند (محمد ولد عبدالله)",
      truck_number: "3292 هلمند",
      driver_name: "محمد",
      driver_father_name: "عبدالله",
      driver_contact: "+93 703751149",
      driver_rent: "46,000 AFN - کرایه واپسی",
    },
    {
      id: "preset-herat",
      label: "هرات - اسلام قلعه | ۳۸۵۵۲ هرات (احمد ولد غلام‌سخی)",
      truck_number: "38552 هرات",
      driver_name: "احمد",
      driver_father_name: "غلام‌سخی",
      driver_contact: "+93 799123456",
      driver_rent: "45,000 AFN - کرایه واپسی",
    },
    {
      id: "preset-kabul",
      label: "کابل - جلال‌آباد | ۲۸۷۷ کابل (نجیب‌الله ولد شیرخان)",
      truck_number: "2877 کابل",
      driver_name: "نجیب‌الله",
      driver_father_name: "شیرخان",
      driver_contact: "+93 788654321",
      driver_rent: "53,000 AFN - کرایه واپسی",
    },
    {
      id: "preset-nimroz",
      label: "نیمروز - زرنج | ۱۹۴۳ نیمروز (عبدالحکیم ولد بسم‌الله)",
      truck_number: "1943 نیمروز",
      driver_name: "عبدالحکیم",
      driver_father_name: "بسم‌الله",
      driver_contact: "+93 777987654",
      driver_rent: "38,500 AFN - کرایه واپسی",
    },
  ])
  const [selectedTruckPresetId, setSelectedTruckPresetId] = useState<string>("")
  const [savedNotes1, setSavedNotes1] = useState<SavedNoteOption[]>([])
  const [selectedNote1Id, setSelectedNote1Id] = useState<string>("")
  const [savedNotes2, setSavedNotes2] = useState<SavedNoteOption[]>([])
  const [selectedNote2Id, setSelectedNote2Id] = useState<string>("")
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isDocumentCenterOpen, setIsDocumentCenterOpen] = useState(false)
  const [savedRoutePresets, setSavedRoutePresets] = useState<SavedRoutePreset[]>([])
  const [isSaveRouteModalOpen, setIsSaveRouteModalOpen] = useState(false)
  const [newPresetTitle, setNewPresetTitle] = useState("")
  const [newPresetIcon, setNewPresetIcon] = useState("🚛")
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string | null>(null)
  const [recoverableDraftTime, setRecoverableDraftTime] = useState<string | null>(null)
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false)
  const [activePrintOptions, setActivePrintOptions] = useState<PrintOptions>({
    copies: 1,
    quality: "standard",
    includeColorStrip: true,
    fitToPage: true,
  })

  // Check for active export corridor transfer from Logistics Calculator
  useEffect(() => {
    try {
      const rawExportDraft = window.localStorage.getItem("skybol:active-export-routes-draft")
      if (rawExportDraft) {
        const parsed = JSON.parse(rawExportDraft)
        if (Array.isArray(parsed.routes) && parsed.routes.length > 0) {
          setFormData((prev) => ({
            ...prev,
            routes: parsed.routes,
            shipping_cost: parsed.shipping_cost || prev.shipping_cost,
            shipping_cost_currency: "USD",
            remarks: parsed.remarks || prev.remarks,
          }))
          window.localStorage.removeItem("skybol:active-export-routes-draft")
          toast.success("Loaded Export Corridor into Active BOL! 🚛", {
            description: `${parsed.routes.length} export & transit route stops populated`,
          })
        }
      }
    } catch (e) {
      console.warn("Error reading export draft:", e)
    }
  }, [])

  const handleRestoreDraft = () => {
    try {
      const rawDraft = window.localStorage.getItem("sky-bol-live-draft") || window.localStorage.getItem("skybol:active-form-draft")
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft)
        const dData = parsed.formData || parsed
        if (dData) setFormData(dData)
        const candidateDraftBol = cleanBolNumber(parsed.bolNumber) || cleanBolNumber(dData.bol_number)
        if (candidateDraftBol) setBolNumber(candidateDraftBol)
        if (parsed.issueDate || dData.issue_date) setIssueDate(parsed.issueDate || dData.issue_date)
        if (parsed.persianDate || dData.persian_date) setPersianDate(parsed.persianDate || dData.persian_date)
        if (parsed.persianDateNumeric || dData.persian_date_numeric) setPersianDateNumeric(parsed.persianDateNumeric || dData.persian_date_numeric)
        setHasRecoverableDraft(false)
        toast.success("Draft Restored Successfully! 🚀", {
          description: `پیش‌نویس ذخیره‌شده با موفقیت بازیابی شد`,
        })
      }
    } catch (e) {
      toast.error("Failed to restore draft")
    }
  }

  const handleDiscardDraft = () => {
    window.localStorage.removeItem("sky-bol-live-draft")
    window.localStorage.removeItem("skybol:active-form-draft")
    try { window.sessionStorage.removeItem("skybol:active-form-draft:backup") } catch (_) {}
    void deleteVaultItem("bol_drafts", "skybol:active-form-draft").catch(() => {})
    fetch("/api/draft?type=bol", { method: "DELETE" }).catch(() => {})
    setHasRecoverableDraft(false)
    toast.info("Unsaved draft discarded")
  }

  const handleExportFullBackup = () => {
    try {
      const backupPayload = {
        app: "Sky Ariana BOL Logistics Suite",
        version: "3.2",
        exportedAt: new Date().toISOString(),
        companySettings: window.localStorage.getItem(PDF_COMPANY_SETTINGS_STORAGE_KEY),
        routePresets: window.localStorage.getItem(SAVED_ROUTE_PRESETS_STORAGE_KEY),
        savedShippers: window.localStorage.getItem(SAVED_SHIPPERS_STORAGE_KEY),
        savedConsignees: window.localStorage.getItem(SAVED_CONSIGNEES_STORAGE_KEY),
        savedNotifyParties: window.localStorage.getItem(SAVED_NOTIFY_PARTIES_STORAGE_KEY),
        savedNotes1: window.localStorage.getItem(SAVED_NOTES_1_STORAGE_KEY),
        savedNotes2: window.localStorage.getItem(SAVED_NOTES_2_STORAGE_KEY),
        currentForm: formData,
      }

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const dateStr = new Date().toISOString().split("T")[0]
      a.href = url
      a.download = `sky-ariana-bol-backup-${dateStr}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Full Backup Downloaded! 💾", {
        description: "تمامی اطلاعات، پیش‌فرض‌ها و تنظیمات با موفقیت در فایل JSON ذخیره شدند",
      })
    } catch (e) {
      toast.error("Failed to generate backup")
    }
  }

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)
        if (parsed.companySettings) window.localStorage.setItem(PDF_COMPANY_SETTINGS_STORAGE_KEY, parsed.companySettings)
        if (parsed.routePresets) {
          window.localStorage.setItem(SAVED_ROUTE_PRESETS_STORAGE_KEY, parsed.routePresets)
          setSavedRoutePresets(JSON.parse(parsed.routePresets))
        }
        if (parsed.savedShippers) window.localStorage.setItem(SAVED_SHIPPERS_STORAGE_KEY, parsed.savedShippers)
        if (parsed.savedConsignees) window.localStorage.setItem(SAVED_CONSIGNEES_STORAGE_KEY, parsed.savedConsignees)
        if (parsed.savedNotifyParties) window.localStorage.setItem(SAVED_NOTIFY_PARTIES_STORAGE_KEY, parsed.savedNotifyParties)
        if (parsed.savedNotes1) window.localStorage.setItem(SAVED_NOTES_1_STORAGE_KEY, parsed.savedNotes1)
        if (parsed.savedNotes2) window.localStorage.setItem(SAVED_NOTES_2_STORAGE_KEY, parsed.savedNotes2)
        if (parsed.currentForm) setFormData(parsed.currentForm)

        toast.success("Backup Restored Successfully! 🎉", {
          description: "تمامی اطلاعات با موفقیت بازیابی و اعمال شدند",
        })
        setIsBackupModalOpen(false)
      } catch (err) {
        toast.error("Invalid Backup File", { description: "فایل انتخاب‌شده نامعتبر است" })
      }
    }
    reader.readAsText(file)
  }

  // Load saved route presets from localStorage on mount
  useEffect(() => {
    try {
      const storedPresets = window.localStorage.getItem(SAVED_ROUTE_PRESETS_STORAGE_KEY)
      if (storedPresets) {
        setSavedRoutePresets(JSON.parse(storedPresets))
      }
    } catch (e) {
      console.error("Error loading saved route presets:", e)
    }
  }, [])

  // Load saved PDF / Company settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PDF_COMPANY_SETTINGS_STORAGE_KEY) || window.localStorage.getItem("skybol:company-settings")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.companyName) setCompanyName(parsed.companyName)
        if (parsed.companyNamePersian) setCompanyNamePersian(parsed.companyNamePersian)
        if (parsed.companySubtitle) setCompanySubtitle(parsed.companySubtitle)
        if (parsed.companyPhone) setCompanyPhone(parsed.companyPhone)
        if (parsed.companyEmail) setCompanyEmail(parsed.companyEmail)
        if (parsed.companyAddress) setCompanyAddress(parsed.companyAddress)
        if (parsed.companyLicence) setCompanyLicence(parsed.companyLicence)
        if (parsed.logoUrl && !parsed.logoUrl.includes("aq-logo") && !parsed.logoUrl.includes("aq_logo") && !parsed.logoUrl.includes("aq-companies")) {
          setLogoUrl(parsed.logoUrl)
        } else {
          setLogoUrl("/images/sky-ariana-logo.png")
        }
        if (typeof parsed.bgImageUrl === "string") {
          const isLegacyGlobalFlight = parsed.bgImageUrl === "/images/document-backgrounds/global-flight.svg"
          setBgImageUrl(
            isLegacyGlobalFlight
              ? "/images/document-backgrounds/global-flight-premium.png"
              : parsed.bgImageUrl,
          )
          if (typeof parsed.bgOpacity === "number" && Number.isFinite(parsed.bgOpacity)) {
            const minimumOpacity = isLegacyGlobalFlight ? 0.22 : 0
            setBgOpacity(Math.max(minimumOpacity, Math.min(0.35, parsed.bgOpacity)))
          }
        }
        if (parsed.iranOffice) {
          setFormData((prev) => ({
            ...prev,
            iran_office_building: parsed.iranOffice.iran_office_building ?? prev.iran_office_building,
            iran_office_location: parsed.iranOffice.iran_office_location ?? prev.iran_office_location,
            iran_office_pobox: parsed.iranOffice.iran_office_pobox ?? prev.iran_office_pobox,
            iran_office_telefax: parsed.iranOffice.iran_office_telefax ?? prev.iran_office_telefax,
            iran_office_cellphone: parsed.iranOffice.iran_office_cellphone ?? prev.iran_office_cellphone,
            iran_office_email: parsed.iranOffice.iran_office_email ?? prev.iran_office_email,
          }))
        }
      }
    } catch (e) {
      console.error("Error reading stored PDF / company settings:", e)
    } finally {
      isCompanySettingsLoadedRef.current = true
    }
  }, [])

  const persistCompanySettings = (overrides?: {
    companyName?: string
    companyNamePersian?: string
    companySubtitle?: string
    companyPhone?: string
    companyEmail?: string
    companyAddress?: string
    companyLicence?: string
    logoUrl?: string
    brandLockupUrl?: string
    logoDesignId?: string
    bgImageUrl?: string
    bgOpacity?: number
    iranOffice?: {
      iran_office_building?: string
      iran_office_location?: string
      iran_office_pobox?: string
      iran_office_telefax?: string
      iran_office_cellphone?: string
      iran_office_email?: string
    }
  }) => {
    try {
      const dataToSave = {
        companyName: overrides?.companyName ?? companyName,
        companyNamePersian: overrides?.companyNamePersian ?? companyNamePersian,
        companySubtitle: overrides?.companySubtitle ?? companySubtitle,
        companyPhone: overrides?.companyPhone ?? companyPhone,
        companyEmail: overrides?.companyEmail ?? companyEmail,
        companyAddress: overrides?.companyAddress ?? companyAddress,
        companyLicence: overrides?.companyLicence ?? companyLicence,
        logoUrl: overrides?.logoUrl ?? logoUrl,
        bgImageUrl: overrides?.bgImageUrl ?? bgImageUrl,
        bgOpacity: overrides?.bgOpacity ?? bgOpacity,
        iranOffice: {
          iran_office_building: overrides?.iranOffice?.iran_office_building ?? formData.iran_office_building,
          iran_office_location: overrides?.iranOffice?.iran_office_location ?? formData.iran_office_location,
          iran_office_pobox: overrides?.iranOffice?.iran_office_pobox ?? formData.iran_office_pobox,
          iran_office_telefax: overrides?.iranOffice?.iran_office_telefax ?? formData.iran_office_telefax,
          iran_office_cellphone: overrides?.iranOffice?.iran_office_cellphone ?? formData.iran_office_cellphone,
          iran_office_email: overrides?.iranOffice?.iran_office_email ?? formData.iran_office_email,
        },
      }
      window.localStorage.setItem(PDF_COMPANY_SETTINGS_STORAGE_KEY, JSON.stringify(dataToSave))
      window.localStorage.setItem("skybol:company-settings", JSON.stringify(dataToSave))
    } catch (e) {
      console.error("Error persisting company / PDF settings:", e)
    }
  }

  // Auto-persist company settings when they change after initial load
  useEffect(() => {
    if (!isCompanySettingsLoadedRef.current) return
    persistCompanySettings()
  }, [
    companyName,
    companyNamePersian,
    companySubtitle,
    companyPhone,
    companyEmail,
    companyAddress,
    companyLicence,
    logoUrl,
    bgImageUrl,
    bgOpacity,
    formData.iran_office_building,
    formData.iran_office_location,
    formData.iran_office_pobox,
    formData.iran_office_telefax,
    formData.iran_office_cellphone,
    formData.iran_office_email,
  ])


  useEffect(() => {
    try {
      const storedShippers: SavedParty[] = JSON.parse(window.localStorage.getItem(SAVED_SHIPPERS_STORAGE_KEY) || "[]")
      const storedConsignees: SavedParty[] = JSON.parse(window.localStorage.getItem(SAVED_CONSIGNEES_STORAGE_KEY) || "[]")
      const storedNotifyParties: SavedParty[] = JSON.parse(window.localStorage.getItem(SAVED_NOTIFY_PARTIES_STORAGE_KEY) || "[]")
      const storedNotes1 = JSON.parse(window.localStorage.getItem(SAVED_NOTES_1_STORAGE_KEY) || "[]")
      const storedNotes2 = JSON.parse(window.localStorage.getItem(SAVED_NOTES_2_STORAGE_KEY) || "[]")

      let mergedShippers = storedShippers
      let mergedConsignees = storedConsignees
      let mergedNotifyParties = storedNotifyParties
      const mergedNotes1 = storedNotes1.length > 0 ? storedNotes1 : mergeSavedNoteOptions(NOTE_1_SEED_LIST, storedNotes1)
      const mergedNotes2 = storedNotes2.length > 0 ? storedNotes2 : mergeSavedNoteOptions(NOTE_2_SEED_LIST, storedNotes2)

      // Harvest parties from any existing saved BOL documents
      try {
        const docKeys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
        const harvestedConsignees: SavedParty[] = []
        const harvestedShippers: SavedParty[] = []
        const harvestedNotify: SavedParty[] = []
        for (const k of docKeys) {
          const raw = window.localStorage.getItem(k)
          if (raw) {
            const parsedDocs = JSON.parse(raw)
            if (Array.isArray(parsedDocs)) {
              for (const doc of parsedDocs) {
                if (doc.consignee_name && typeof doc.consignee_name === "string" && doc.consignee_name.trim()) {
                  harvestedConsignees.push({
                    id: `doc-consignee-${doc.consignee_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: doc.consignee_name.trim(),
                    address: (doc.consignee_address || "").trim(),
                    contact: (doc.consignee_contact || "").trim(),
                    email: (doc.consignee_email || "").trim(),
                    savedAt: doc.created_at || doc.issue_date || new Date().toISOString(),
                  })
                }
                if (doc.shipper_name && typeof doc.shipper_name === "string" && doc.shipper_name.trim()) {
                  harvestedShippers.push({
                    id: `doc-shipper-${doc.shipper_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: doc.shipper_name.trim(),
                    address: (doc.shipper_address || "").trim(),
                    contact: (doc.shipper_contact || "").trim(),
                    email: (doc.shipper_email || "").trim(),
                    savedAt: doc.created_at || doc.issue_date || new Date().toISOString(),
                  })
                }
                if (doc.notify_party && typeof doc.notify_party === "string" && doc.notify_party.trim()) {
                  harvestedNotify.push({
                    id: `doc-notify-${doc.notify_party.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                    name: doc.notify_party.trim(),
                    address: (doc.notify_party_address || "").trim(),
                    contact: "",
                    email: "",
                    savedAt: doc.created_at || doc.issue_date || new Date().toISOString(),
                  })
                }
              }
            }
          }
        }
        if (harvestedConsignees.length > 0) {
          mergedConsignees = mergeSavedParties(mergedConsignees, harvestedConsignees)
        }
        if (harvestedShippers.length > 0) {
          mergedShippers = mergeSavedParties(mergedShippers, harvestedShippers)
        }
        if (harvestedNotify.length > 0) {
          mergedNotifyParties = mergeSavedParties(mergedNotifyParties, harvestedNotify)
        }
      } catch (e) {}

      // Alphabetical sorting A-Z for fast location
      mergedConsignees.sort((a: SavedParty, b: SavedParty) => a.name.localeCompare(b.name))
      mergedShippers.sort((a: SavedParty, b: SavedParty) => a.name.localeCompare(b.name))
      mergedNotifyParties.sort((a: SavedParty, b: SavedParty) => a.name.localeCompare(b.name))

      setSavedShippers(mergedShippers)
      setSavedConsignees(mergedConsignees)
      setSavedNotifyParties(mergedNotifyParties)
      setSavedNotes1(mergedNotes1)
      setSavedNotes2(mergedNotes2)

      // Always persist the full merged lists
      window.localStorage.setItem(SAVED_SHIPPERS_STORAGE_KEY, JSON.stringify(mergedShippers))
      window.localStorage.setItem(SAVED_CONSIGNEES_STORAGE_KEY, JSON.stringify(mergedConsignees))
      window.localStorage.setItem(SAVED_NOTIFY_PARTIES_STORAGE_KEY, JSON.stringify(mergedNotifyParties))
      window.localStorage.setItem(SAVED_NOTES_1_STORAGE_KEY, JSON.stringify(mergedNotes1))
      window.localStorage.setItem(SAVED_NOTES_2_STORAGE_KEY, JSON.stringify(mergedNotes2))

      // Asynchronously merge seeds in background idle time so 135KB JSON never blocks initial page render
      const scheduleSeedMerge = () => {
        Promise.all([
          import("@/lib/data/shippers-from-pdf.json"),
          import("@/lib/data/consignees-from-pdf.json"),
          import("@/lib/data/notify-parties-from-pdf.json"),
        ]).then(([sMod, cMod, nMod]) => {
          const sSeed = (sMod.default || sMod) as SavedParty[]
          const cSeed = (cMod.default || cMod) as SavedParty[]
          const nSeed = (nMod.default || nMod) as SavedParty[]
          setSavedShippers((prev) => {
            const merged = mergeSavedParties(sSeed, prev).sort((a, b) => a.name.localeCompare(b.name))
            try { window.localStorage.setItem(SAVED_SHIPPERS_STORAGE_KEY, JSON.stringify(merged)) } catch {}
            return merged
          })
          setSavedConsignees((prev) => {
            const merged = mergeSavedParties(cSeed, prev).sort((a, b) => a.name.localeCompare(b.name))
            try { window.localStorage.setItem(SAVED_CONSIGNEES_STORAGE_KEY, JSON.stringify(merged)) } catch {}
            return merged
          })
          setSavedNotifyParties((prev) => {
            const merged = mergeSavedParties(nSeed, prev).sort((a, b) => a.name.localeCompare(b.name))
            try { window.localStorage.setItem(SAVED_NOTIFY_PARTIES_STORAGE_KEY, JSON.stringify(merged)) } catch {}
            return merged
          })
        }).catch(() => {})
      }

      if (typeof window !== "undefined") {
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(scheduleSeedMerge)
        } else {
          setTimeout(scheduleSeedMerge, 300)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading saved parties:", error)
    }
  }, [])

  // Async party search from FastAPI SQLite / seed proxy with 200ms debounce
  useEffect(() => {
    const q = (shipperSearchQuery || "").trim()
    if (!q || q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/parties/search?role=SHIPPER&q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            const mapped: SavedParty[] = json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.address || "",
              contact: p.phone || p.contact_person || "",
              email: p.email || "",
              savedAt: p.updated_at || new Date().toISOString(),
            }))
            setApiShippers(mapped)
          }
        }
      } catch {}
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [shipperSearchQuery])

  useEffect(() => {
    const q = (consigneeSearchQuery || "").trim()
    if (!q || q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/parties/search?role=CONSIGNEE&q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            const mapped: SavedParty[] = json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.address || "",
              contact: p.phone || p.contact_person || "",
              email: p.email || "",
              savedAt: p.updated_at || new Date().toISOString(),
            }))
            setApiConsignees(mapped)
          }
        }
      } catch {}
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [consigneeSearchQuery])

  useEffect(() => {
    const q = (notifyPartySearchQuery || "").trim()
    if (!q || q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/parties/search?role=NOTIFY_PARTY&q=${encodeURIComponent(q)}&limit=20`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            const mapped: SavedParty[] = json.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.address || "",
              contact: p.phone || p.contact_person || "",
              email: p.email || "",
              savedAt: p.updated_at || new Date().toISOString(),
            }))
            setApiNotifyParties(mapped)
          }
        }
      } catch {}
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [notifyPartySearchQuery])

  // Load document when loadDocumentId changes
  useEffect(() => {
    if (loadDocumentId) {
      void loadBolDocument(loadDocumentId, { targetTab: "form", force: true })
    }
  }, [loadDocumentId])

  const applyLoadedDocument = useCallback((rawDoc: any, id: string) => {
    const doc = normalizeBolRecord(rawDoc, id)
    const docBolNumber = cleanBolNumber(doc.bol_number) || cleanBolNumber(id) || id || ""
    if (docBolNumber) {
      setBolNumber(docBolNumber)
      setActiveBolId(docBolNumber)
    }
    const rawIssueDate = doc.issue_date || new Date().toISOString().split("T")[0]
    setIssueDate(rawIssueDate)
    setEditDocumentId(doc.id || id)
    setIsEditMode(true)
    const dualDates = getDualDates(rawIssueDate)
    if (dualDates) {
      setPersianDate(dualDates.persian)
      setPersianDateNumeric(formatPersianDate(rawIssueDate) ?? dualDates.persianNumeric)
    }
    const nextFormData = {
      ...doc,
      bol_number: docBolNumber,
      issue_date: rawIssueDate,
      routes: (Array.isArray(doc.routes) && doc.routes.length > 0) ? doc.routes : initialFormData.routes,
      cargo_description: doc.cargo_description || initialFormData.cargo_description,
      notes_1: doc.notes_1 !== undefined && doc.notes_1 !== "" ? doc.notes_1 : initialFormData.notes_1,
      notes_1_label: doc.notes_1_label || initialFormData.notes_1_label,
      notes_1_theme: doc.notes_1_theme || initialFormData.notes_1_theme,
      notes_2: doc.notes_2 !== undefined && doc.notes_2 !== "" ? doc.notes_2 : initialFormData.notes_2,
      notes_2_label: doc.notes_2_label || initialFormData.notes_2_label,
      notes_2_theme: doc.notes_2_theme || initialFormData.notes_2_theme,
      afghanistan_documents: doc.afghanistan_documents || [],
      afghanistan_document_details: doc.afghanistan_document_details || {},
    }
    setFormData(nextFormData)
    setHasUnsavedChanges(false)

    // Synchronize or reset directory preset selections to match the loaded document
    const sName = (nextFormData.shipper_name || "").trim().toLowerCase()
    const matchShipper = sName ? savedShippers.find((s) => s.name.trim().toLowerCase() === sName) : null
    setSelectedShipperId(matchShipper ? matchShipper.id : "")

    const cName = (nextFormData.consignee_name || "").trim().toLowerCase()
    const matchConsignee = cName ? savedConsignees.find((c) => c.name.trim().toLowerCase() === cName) : null
    setSelectedConsigneeId(matchConsignee ? matchConsignee.id : "")

    const nName = (nextFormData.notify_party || "").trim().toLowerCase()
    const matchNotify = nName ? savedNotifyParties.find((n) => n.name.trim().toLowerCase() === nName) : null
    setSelectedNotifyPartyId(matchNotify ? matchNotify.id : "")

    const n1Label = (nextFormData.notes_1_label || "").trim().toLowerCase()
    const n1Content = (nextFormData.notes_1 || "").trim()
    const matchNote1 = (n1Label || n1Content) ? savedNotes1.find((n) => (n1Label && n.label.trim().toLowerCase() === n1Label) || (n1Content && n.content.trim() === n1Content)) : null
    setSelectedNote1Id(matchNote1 ? matchNote1.id : "")

    const n2Label = (nextFormData.notes_2_label || "").trim().toLowerCase()
    const n2Content = (nextFormData.notes_2 || "").trim()
    const matchNote2 = (n2Label || n2Content) ? savedNotes2.find((n) => (n2Label && n.label.trim().toLowerCase() === n2Label) || (n2Content && n.content.trim() === n2Content)) : null
    setSelectedNote2Id(matchNote2 ? matchNote2.id : "")

    const truckNum = (nextFormData.truck_number || "").trim().toLowerCase()
    const matchTruck = truckNum ? savedTruckPresets.find((t) => t.truck_number.trim().toLowerCase() === truckNum) : null
    setSelectedTruckPresetId(matchTruck ? matchTruck.id : "")

    setShipperDirectorySearch("")
    setConsigneeDirectorySearch("")
    setNotifyDirectorySearch("")
    setShipperSearchQuery("")
    setConsigneeSearchQuery("")
    setNotifyPartySearchQuery("")
    try {
      if (docBolNumber) {
        window.localStorage.setItem("skybol:last-active-document-id", docBolNumber)
      }
    } catch (_) {}
    if (typeof document !== "undefined") {
      const smartTitle = buildBolSmartFileName({ ...nextFormData, bol_number: doc.bol_number || "" }, doc.bol_number || id, "")
      if (smartTitle) {
        document.title = smartTitle
      }
    }
    onDocumentLoaded?.()
  }, [onDocumentLoaded, savedShippers, savedConsignees, savedNotifyParties, savedNotes1, savedNotes2, savedTruckPresets])

  const loadBolDocument = useCallback(async (
    rawId: string,
    options?: { targetTab?: string; force?: boolean; initialData?: any }
  ) => {
    const targetTab = options?.targetTab || "form"
    const force = options?.force ?? false
    const initialData = options?.initialData
    const id = (rawId || "").trim()
    if (!id) return

    const canonicalId = cleanBolNumber(id) || id

    // Increment request ID and cancel previous in-flight fetch
    const currentRequestId = ++loadRequestIdRef.current
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Update URL query parameters for deep linking & refresh
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set("bol", canonicalId)
        if (targetTab) {
          url.searchParams.set("tab", targetTab)
        }
        const newUrlStr = url.pathname + url.search + url.hash
        window.history.replaceState(window.history.state, "", newUrlStr)
      } catch (_) {}
    }

    // Fast optimistic path: If initial document is available (from RecentBolCard or SavedDocuments table)
    if (initialData) {
      const normalized = normalizeBolRecord(initialData, canonicalId)
      startTransition(() => {
        setHydrationError(null)
        setActiveBolId(canonicalId)
        if (targetTab && activeTabRef.current !== targetTab) {
          setActiveTab(targetTab)
        }
        applyLoadedDocument(normalized, canonicalId)
      })
    }

    // Set hydration state immediately
    setIsHydrating(!initialData)
    setHydrationError(null)
    setActiveBolId(canonicalId)

    // Switch tab if requested
    if (targetTab && activeTabRef.current !== targetTab) {
      startTransition(() => {
        setActiveTab(targetTab)
      })
    }

    // 0. If this is already the currently active document in memory and complete, skip redundant reload
    const curBolNumber = bolNumberRef.current
    const curEditDocId = editDocumentIdRef.current
    const curFormData = formDataRef.current
    if (!force && (curBolNumber === canonicalId || curEditDocId === canonicalId)) {
      const isCurrentComplete = Boolean(
        (curFormData?.truck_number || curFormData?.truckNumber) &&
        (curFormData?.consignee_name || curFormData?.consigneeName) &&
        (curFormData?.consignee_address || curFormData?.consigneeAddress) &&
        (curFormData?.cargo_route_note || curFormData?.cargoRouteNote) &&
        (curFormData?.routes && Array.isArray(curFormData?.routes) && curFormData.routes.length > 0)
      )
      if (isCurrentComplete) {
        setIsHydrating(false)
        return
      }
    }

    // 1. Instant Cache-First Check: read synchronously from localStorage (<1ms)
    let cachedDoc: any = null
    try {
      if (typeof window !== "undefined") {
        const stored1 = window.localStorage.getItem("skybol:saved-documents")
        const stored2 = window.localStorage.getItem("sky-bol-browser-documents")
        const stored3 = window.localStorage.getItem("skybol:backup-documents")
        const list1 = stored1 ? JSON.parse(stored1) : []
        const list2 = stored2 ? JSON.parse(stored2) : []
        const list3 = stored3 ? JSON.parse(stored3) : []
        cachedDoc = [...list1, ...list2, ...list3].find(
          (d: any) =>
            d?.id === id ||
            d?.id === canonicalId ||
            d?.bol_number === id ||
            d?.bol_number === canonicalId ||
            d?.billOfLadingNumber === canonicalId ||
            d?.bolNo === canonicalId
        )
      }
    } catch (e) {
      console.warn("Local storage document cache read error:", e)
    }

    const isCachedComplete = Boolean(
      cachedDoc &&
      (cachedDoc.truck_number || cachedDoc.truckNumber) &&
      (cachedDoc.consignee_name || cachedDoc.consigneeName) &&
      (cachedDoc.consignee_address || cachedDoc.consigneeAddress) &&
      (cachedDoc.cargo_route_note || cachedDoc.cargoRouteNote) &&
      (cachedDoc.routes && Array.isArray(cachedDoc.routes) && cachedDoc.routes.length > 0)
    )

    if (cachedDoc) {
      if (loadRequestIdRef.current === currentRequestId) {
        const mergedWithCache = { ...(initialData || {}), ...cachedDoc }
        const normalized = normalizeBolRecord(mergedWithCache, canonicalId)
        startTransition(() => {
          applyLoadedDocument(normalized, canonicalId)
          if (isCachedComplete) setIsHydrating(false)
        })
      }
    }

    // 2. Fetch authoritative document from server
    if (!isCachedComplete) {
      setIsLoading(true)
    }

    try {
      let doc: any = null
      try {
        const response = await fetch(`/api/bol/${encodeURIComponent(canonicalId)}`, {
          signal: abortController.signal,
        })
        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            doc = result.data
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          return
        }
        console.warn("Server document fetch failed:", err)
      }

      // Check request ID guard against race conditions
      if (loadRequestIdRef.current !== currentRequestId) {
        return
      }

      if (doc) {
        const merged: any = {
          ...(cachedDoc || {}),
          ...(initialData || {}),
          ...doc,
        }
        // Retain values if doc has empty strings or missing fields
        if (!merged.cargo_route_note) merged.cargo_route_note = cachedDoc?.cargo_route_note || initialData?.cargo_route_note || ""
        if (!merged.cargoRouteNote) merged.cargoRouteNote = merged.cargo_route_note
        if (!merged.consignee_address) merged.consignee_address = cachedDoc?.consignee_address || initialData?.consignee_address || ""
        if (!merged.consigneeAddress) merged.consigneeAddress = merged.consignee_address
        if (!merged.consignee_contact) merged.consignee_contact = cachedDoc?.consignee_contact || initialData?.consignee_contact || ""
        if (!merged.consigneeContact) merged.consigneeContact = merged.consignee_contact
        if (!merged.consignee_email) merged.consignee_email = cachedDoc?.consignee_email || initialData?.consignee_email || ""
        if (!merged.consigneeEmail) merged.consigneeEmail = merged.consignee_email
        if (!merged.shipper_address) merged.shipper_address = cachedDoc?.shipper_address || initialData?.shipper_address || ""
        if (!merged.shipperAddress) merged.shipperAddress = merged.shipper_address
        if (!merged.shipper_contact) merged.shipper_contact = cachedDoc?.shipper_contact || initialData?.shipper_contact || ""
        if (!merged.shipperContact) merged.shipperContact = merged.shipper_contact
        if (!merged.kgs_per_carton) merged.kgs_per_carton = cachedDoc?.kgs_per_carton || initialData?.kgs_per_carton || ""
        if (!merged.kgsPerCarton) merged.kgsPerCarton = merged.kgs_per_carton
        if (!merged.gross_weight_per_carton) merged.gross_weight_per_carton = cachedDoc?.gross_weight_per_carton || initialData?.gross_weight_per_carton || ""
        if (!merged.grossWeightPerCarton) merged.grossWeightPerCarton = merged.gross_weight_per_carton
        if (!merged.rate_per_kgs) merged.rate_per_kgs = cachedDoc?.rate_per_kgs || initialData?.rate_per_kgs || ""
        if (!merged.ratePerKgs) merged.ratePerKgs = merged.rate_per_kgs
        if (!merged.goods_value) merged.goods_value = cachedDoc?.goods_value || initialData?.goods_value || ""
        if (!merged.goodsValue) merged.goodsValue = merged.goods_value
        if (!merged.notes_1 && (cachedDoc?.notes_1 || initialData?.notes_1)) merged.notes_1 = cachedDoc?.notes_1 || initialData?.notes_1
        if (!merged.notes_2 && (cachedDoc?.notes_2 || initialData?.notes_2)) merged.notes_2 = cachedDoc?.notes_2 || initialData?.notes_2
        merged.driver_rent = formatCanonicalDriverRent(doc?.driver_rent, cachedDoc?.driver_rent || initialData?.driver_rent || "")

        if (Array.isArray(doc.routes) && doc.routes.length > 0) {
          merged.routes = doc.routes
        }
        const normalized = normalizeBolRecord(merged, canonicalId)
        applyLoadedDocument(normalized, canonicalId)
        setIsHydrating(false)

        // Sync back to local storage cache so client storage is pristine
        try {
          if (typeof window !== "undefined") {
            const keys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
            for (const k of keys) {
              const raw = window.localStorage.getItem(k)
              const list: any[] = raw ? JSON.parse(raw) : []
              const next = [
                merged,
                ...list.filter(
                  (d: any) =>
                    d?.id !== id &&
                    d?.id !== canonicalId &&
                    d?.bol_number !== id &&
                    d?.bol_number !== canonicalId &&
                    d?.bol_number !== doc.bol_number
                ),
              ]
              window.localStorage.setItem(k, JSON.stringify(next.slice(0, 1000)))
            }
          }
        } catch (_) {}
      } else if (!isCachedComplete && !initialData) {
        setIsHydrating(false)
        setHydrationError(`BOL could not be loaded: ${canonicalId}`)
        toast.error(`Unable to load document ${canonicalId}`)
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return
      console.error("[v0] Error loading document:", error)
      if (loadRequestIdRef.current === currentRequestId) {
        setIsHydrating(false)
        setHydrationError(`Failed to load document: ${canonicalId}`)
        toast.error("Failed to load document")
      }
    } finally {
      if (loadRequestIdRef.current === currentRequestId) {
        setIsLoading(false)
      }
    }
  }, [applyLoadedDocument])

  const loadDocument = useCallback(async (id: string, force = false) => {
    return loadBolDocument(id, { targetTab: activeTab, force })
  }, [loadBolDocument, activeTab])

  const getHighestKnownBolSequence = useCallback((): number => {
    let max = 683

    // 1. Current in-memory document / form
    const currentSeq = parseBolSeq(bolNumberRef.current || bolNumber)
    if (currentSeq > max) max = currentSeq

    // 2. Check localStorage records (saved, browser, backups)
    if (typeof window !== "undefined") {
      try {
        const storedMax = window.localStorage.getItem("skybol:highest-allocated-bol")
        if (storedMax) {
          const parsed = parseInt(storedMax, 10)
          if (!isNaN(parsed) && parsed > max) max = parsed
        }

        const keys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
        for (const k of keys) {
          const raw = window.localStorage.getItem(k)
          if (!raw) continue
          const list = JSON.parse(raw)
          if (Array.isArray(list)) {
            for (const item of list) {
              const seq = parseBolSeq(item?.bol_number || item?.billOfLadingNumber || item?.bolNo || item?.id)
              if (seq > max) max = seq
            }
          }
        }
      } catch (_) {}
    }

    return max
  }, [bolNumber, formData?.bol_number])

  const fetchNextBolNumber = useCallback(async (minRequiredSeq?: number) => {
    setIsLoading(true)
    try {
      const highestKnown = getHighestKnownBolSequence()
      const minSeq = typeof minRequiredSeq === "number" ? minRequiredSeq : Math.max(highestKnown + 1, 685)
      const fetchUrl = `/api/bol?action=next-number&minSequence=${minSeq}`
      const response = await fetch(fetchUrl)
      const result = await response.json()
      
      const serverSeq = parseBolSeq(result?.bolNumber)
      const targetSeq = Math.max(serverSeq, minSeq)
      const finalBol = `BOL-2026-NSA${targetSeq}`

      startTransition(() => {
        setBolNumber(finalBol)
        setFormData((prev: any) => ({
          ...prev,
          bol_number: finalBol,
        }))
      })
    } catch (error) {
      console.error("Error fetching BOL number:", error)
      const highestKnown = getHighestKnownBolSequence()
      const targetSeq = Math.max(minRequiredSeq || 0, highestKnown + 1, 685)
      const fallbackBol = `BOL-2026-NSA${targetSeq}`
      startTransition(() => {
        setBolNumber(fallbackBol)
        setFormData((prev: any) => ({
          ...prev,
          bol_number: fallbackBol,
        }))
      })
    } finally {
      setIsLoading(false)
    }
  }, [getHighestKnownBolSequence])

  // Unified Session Auto-Resume: Automatically restores active work on app launch or reload
  useEffect(() => {
    let initialized = false

    const initActiveSession = async () => {
      try {
        // 0. URL Deep Link Check: e.g. /?bol=BOL-2026-NSA648&tab=preview
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search)
          const urlBol = urlParams.get("bol")
          const urlTab = urlParams.get("tab")
          if (urlBol) {
            await loadBolDocument(urlBol, { targetTab: urlTab || "form", force: true })
            initialized = true
            setCheckingDraft(false)
            return
          }
        }

        // If loadDocumentId was explicitly passed via props, honor it
        if (loadDocumentId) {
          await loadBolDocument(loadDocumentId, { targetTab: "form", force: true })
          initialized = true
          setCheckingDraft(false)
          return
        }

        const rawDraft = window.localStorage.getItem("sky-bol-live-draft") || window.localStorage.getItem("skybol:active-form-draft")
        let draftData: any = null

        if (rawDraft) {
          try {
            const parsed = JSON.parse(rawDraft)
            const dData = parsed.formData || parsed
            if (dData && (parsed.savedAt || dData.updated_at)) {
              draftData = dData
            }
          } catch (_) {}
        }

        // Tier 2 Fallback: Check SessionStorage mirror
        if (!draftData) {
          try {
            const sessionRaw = window.sessionStorage.getItem("skybol:active-form-draft:backup")
            if (sessionRaw) {
              const parsed = JSON.parse(sessionRaw)
              if (parsed?.updated_at || parsed?.bol_number) {
                draftData = parsed
              }
            }
          } catch (_) {}
        }

        // Tier 3 Fallback: Check IndexedDB Vault
        if (!draftData) {
          try {
            const vaultRecord = await getVaultItem<any>("bol_drafts", "skybol:active-form-draft")
            const vData = vaultRecord?.payload || vaultRecord
            if (vData && (vData.updated_at || vData.bol_number)) {
              draftData = vData
            }
          } catch (_) {}
        }

        // Tier 4 Fallback: If local/vault draft is missing or empty, attempt recovery from server draft
        if (!draftData) {
          try {
            const sDraftRes = await fetch("/api/draft?type=bol")
            if (sDraftRes.ok) {
              const sJson = await sDraftRes.json()
              if (sJson?.draft) {
                draftData = sJson.draft
              }
            }
          } catch (_) {}
        }

        // Reconcile draft against official server record if bol_number is set
        if (draftData?.bol_number) {
          try {
            const sRes = await fetch(`/api/bol/${encodeURIComponent(draftData.bol_number)}`)
            if (sRes.ok) {
              const sJson = await sRes.json()
              const officialDoc = sJson?.data
              if (officialDoc) {
                // Official document in database is the golden foundation
                const merged: any = { ...officialDoc }
                for (const [k, v] of Object.entries(draftData)) {
                  if (v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)) {
                    merged[k] = v
                  }
                }
                if (Array.isArray(officialDoc.routes) && officialDoc.routes.length > 0) {
                  if (!Array.isArray(merged.routes) || merged.routes.length <= 2) {
                    merged.routes = officialDoc.routes
                  }
                }
                draftData = merged
              }
            }
          } catch (e) {
            console.warn("Draft server reconciliation error:", e)
          }
        }

        // Check if draft has meaningful user content
        const hasDraftContent = Boolean(
          draftData && (
            (draftData.shipper_name && draftData.shipper_name.trim().toLowerCase() !== "no shipper") ||
            (draftData.consignee_name && draftData.consignee_name.trim().toLowerCase() !== "no consignee") ||
            (draftData.driver_name && String(draftData.driver_name).trim()) ||
            (draftData.driver_rent != null && String(draftData.driver_rent).trim() !== "") ||
            (draftData.truck_number && String(draftData.truck_number).trim()) ||
            (draftData.cargo_description && String(draftData.cargo_description).trim().length > 5) ||
            (draftData.number_of_packages != null && String(draftData.number_of_packages).trim() !== "0") ||
            (draftData.notes_1 && String(draftData.notes_1).trim()) ||
            (draftData.notes_2 && String(draftData.notes_2).trim())
          )
        )

        if (hasDraftContent && draftData) {
          applyLoadedDocument(draftData, draftData.bol_number || "draft")
          setHasRecoverableDraft(false)
          setCheckingDraft(false)
          setAutoSaveStatus("saved")
          if (draftData.updated_at) {
            const formattedTime = new Date(draftData.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            setLastAutoSaveTime(formattedTime)
            setLastAutoSavedTime(formattedTime)
          }
          initialized = true
          toast.info("Resumed Active BOL", {
            description: `Restored ${draftData.bol_number || "active BOL"} with your latest details.`,
            action: {
              label: "New Blank BOL",
              onClick: handleNewDocument,
            },
          })
          return
        }

        // 2. Check for last active document ID in local storage
        const lastActiveId = window.localStorage.getItem("skybol:last-active-document-id")
        if (lastActiveId === "__NEW__") {
          initialized = true
          setCheckingDraft(false)
          setSelectedShipperId("")
          setSelectedConsigneeId("")
          setSelectedNotifyPartyId("")
          setSelectedNote1Id("")
          setSelectedNote2Id("")
          setSelectedTruckPresetId("")
          setShipperDirectorySearch("")
          setConsigneeDirectorySearch("")
          setNotifyDirectorySearch("")
          setShipperSearchQuery("")
          setConsigneeSearchQuery("")
          setNotifyPartySearchQuery("")
          const highestKnown = getHighestKnownBolSequence()
          const nextInitSeq = Math.max(highestKnown + 1, 685)
          setBolNumber(`BOL-2026-NSA${nextInitSeq}`)
          void fetchNextBolNumber(nextInitSeq)
          const today = new Date().toISOString().split("T")[0]
          setIssueDate(today)
          const dualDates = getDualDates(today)
          if (dualDates) {
            setPersianDate(dualDates.persian)
            setPersianDateNumeric(formatPersianDate(today) ?? dualDates.persianNumeric)
          }
          return
        }
        if (lastActiveId) {
          await loadBolDocument(lastActiveId, { targetTab: "form", force: true })
          initialized = true
          setCheckingDraft(false)
          return
        }

        // 3. Fallback: check most recent BOL from server
        try {
          const res = await fetch("/api/bol?action=recent&limit=1")
          if (res.ok) {
            const json = await res.json()
            if (json?.data && Array.isArray(json.data) && json.data.length > 0 && json.data[0]?.bol_number) {
              const mostRecentId = json.data[0].bol_number
              await loadBolDocument(mostRecentId, { targetTab: "form", force: true })
              initialized = true
              setCheckingDraft(false)
              return
            }
          }
        } catch (_) {}

      } catch (e) {
        console.error("Error initializing BOL session:", e)
      } finally {
        setCheckingDraft(false)
        if (!initialized) {
          setSelectedShipperId("")
          setSelectedConsigneeId("")
          setSelectedNotifyPartyId("")
          setSelectedNote1Id("")
          setSelectedNote2Id("")
          setSelectedTruckPresetId("")
          setShipperDirectorySearch("")
          setConsigneeDirectorySearch("")
          setNotifyDirectorySearch("")
          void fetchNextBolNumber()
          const today = new Date().toISOString().split("T")[0]
          setIssueDate(today)
          const dualDates = getDualDates(today)
          if (dualDates) {
            setPersianDate(dualDates.persian)
            setPersianDateNumeric(formatPersianDate(today) ?? dualDates.persianNumeric)
          }
        }
      }
    }

    void initActiveSession()
  }, [])

  // Handle Browser Back / Forward deep-link transitions
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      const urlBol = params.get("bol")
      const urlTab = params.get("tab")
      if (urlBol && urlBol !== activeBolIdRef.current) {
        void loadBolDocument(urlBol, { targetTab: urlTab || "preview", force: true })
      } else if (urlTab && urlTab !== activeTabRef.current) {
        setActiveTab(urlTab)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [loadBolDocument])

  // Reset scroll to top when switching BOLs (Section 73)
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0
    }
  }, [bolNumber, activeBolId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    handleFieldChange(name, value)
  }

  const handleFieldChange = (name: string, value: string) => {
    setHasUnsavedChanges(true)

    // Master Directory Decoupling: If user edits party name directly in the form,
    // detach the directory ID reference so saving BOL doesn't mutate old directory record
    if (name === "shipper_name") {
      const match = savedShippers.find((s) => s.id === selectedShipperId)
      if (match && match.name.trim().toLowerCase() !== value.trim().toLowerCase()) {
        setSelectedShipperId("")
      }
    } else if (name === "consignee_name") {
      const match = savedConsignees.find((c) => c.id === selectedConsigneeId)
      if (match && match.name.trim().toLowerCase() !== value.trim().toLowerCase()) {
        setSelectedConsigneeId("")
      }
    } else if (name === "notify_party") {
      const match = savedNotifyParties.find((n) => n.id === selectedNotifyPartyId)
      if (match && match.name.trim().toLowerCase() !== value.trim().toLowerCase()) {
        setSelectedNotifyPartyId("")
      }
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value }

      if (
        name === "number_of_packages" ||
        name === "kgs_per_carton" ||
        name === "gross_weight_per_carton" ||
        name === "rate_per_kgs"
      ) {
        const calc = calculateMultiCargo(
          name === "number_of_packages" ? value : next.number_of_packages,
          name === "kgs_per_carton" ? value : next.kgs_per_carton,
          name === "gross_weight_per_carton" ? value : next.gross_weight_per_carton,
          name === "rate_per_kgs" ? value : next.rate_per_kgs
        )

        if (calc.formattedNetWeight) next.net_weight = calc.formattedNetWeight
        if (calc.formattedGrossWeight) next.gross_weight = calc.formattedGrossWeight
        if (calc.formattedGoodsValue) next.goods_value = calc.formattedGoodsValue
      }

      return next
    })
  }

  const parseNumericValue = (value: string): number | null => {
    const cleaned = value.replace(/,/g, "").match(/-?\d*\.?\d+/)?.[0]
    if (!cleaned) return null

    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }

  const parsePackagesList = (str: string): number[] => {
    if (!str) return []
    const cleaned = str.replace(/(\d),(\d)/g, '$1$2')
    const parts = cleaned.split(
      /\s*[\+;/]\s*|\s+-\s+|\s*,\s*|(?<=[A-Za-z)\]"'])\s+(?=\d+\s*(?:CTNS?|CARTONS?|CNTS?|BAGS?|PKGS?|BOXES|PCS|UNITS|ROLLS|DRUMS)\b)/i
    )
    const numbers: number[] = []

    for (const part of parts) {
      const nonKgMatches = part.match(/\b(\d+(\.\d+)?)\s*(?!kg|kgs|kilo|ton|cbm)\b/gi)
      if (nonKgMatches && nonKgMatches.length > 0) {
        for (const m of nonKgMatches) {
          const num = parseFloat(m.replace(/[^\d.]/g, ''))
          if (!isNaN(num) && num > 0) {
            numbers.push(num)
          }
        }
      } else {
        const matches = part.match(/\b\d+(\.\d+)?\b/g)
        if (matches && matches.length > 0) {
          const num = parseFloat(matches[0])
          if (!isNaN(num) && num > 0) {
            numbers.push(num)
          }
        }
      }
    }

    if (numbers.length === 0) {
      const allMatches = cleaned.match(/\b\d+(\.\d+)?\b/g)
      if (allMatches) {
        for (const m of allMatches) {
          const num = parseFloat(m)
          if (!isNaN(num) && num > 0) {
            numbers.push(num)
          }
        }
      }
    }

    return numbers
  }

  const parseWeightsOrRatesList = (str: string): number[] => {
    if (!str) return []
    const cleaned = str.replace(/(\d),(\d)/g, '$1$2')
    const matches = cleaned.match(/\b\d+(\.\d+)?\b/g)
    if (!matches) return []
    return matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n) && n > 0)
  }

  const formatWeightValue = (value: number): string => {
    return Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 2 })
  }

  const formatUsdValue = (value: number): string => {
    return `${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`
  }

  const calculateMultiCargo = useCallback((
    packagesStr: string,
    netPerCartonStr: string,
    grossPerCartonStr: string,
    rateStr: string
  ) => {
    const pkgList = parsePackagesList(packagesStr || "")
    const netKgList = parseWeightsOrRatesList(netPerCartonStr || "")
    const grossKgList = parseWeightsOrRatesList(grossPerCartonStr || "")
    const rateList = parseWeightsOrRatesList(rateStr || "")

    const itemCount = Math.max(pkgList.length, netKgList.length, grossKgList.length, rateList.length, 1)
    const isMultiItem = itemCount > 1 || pkgList.length > 1

    const items: Array<{
      packages: number
      netPerCarton: number
      grossPerCarton: number
      rate: number
      netWeight: number
      grossWeight: number
      goodsValue: number
    }> = []

    let totalPackages = 0
    let totalNetWeight = 0
    let totalGrossWeight = 0
    let totalGoodsValue = 0

    for (let i = 0; i < itemCount; i++) {
      const pkg = pkgList[i] !== undefined ? pkgList[i] : (pkgList[0] || 0)
      const netPerCt = netKgList[i] !== undefined ? netKgList[i] : (netKgList[0] || 0)
      const grossPerCt = grossKgList[i] !== undefined ? grossKgList[i] : (grossKgList[0] || 0)
      const rate = rateList[i] !== undefined ? rateList[i] : (rateList[0] || 0)

      const netWeight = pkg > 0 && netPerCt > 0 ? pkg * netPerCt : 0
      const grossWeight = pkg > 0 && grossPerCt > 0 ? pkg * grossPerCt : 0
      const goodsValue = netWeight > 0 && rate > 0 ? netWeight * rate : 0

      items.push({
        packages: pkg,
        netPerCarton: netPerCt,
        grossPerCarton: grossPerCt,
        rate,
        netWeight,
        grossWeight,
        goodsValue,
      })

      totalPackages += pkg
      totalNetWeight += netWeight
      totalGrossWeight += grossWeight
      totalGoodsValue += goodsValue
    }

    let formattedNetWeight = ""
    let formattedGrossWeight = ""
    let formattedGoodsValue = ""

    if (isMultiItem && items.length > 1) {
      formattedNetWeight = items.map((it) => `${formatWeightValue(it.netWeight)} KG`).join(" - ")
      formattedGrossWeight = items.map((it) => `${formatWeightValue(it.grossWeight)} KG`).join(" - ")
      formattedGoodsValue = items.map((it) => `${it.goodsValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`).join(" - ")
    } else if (items.length === 1 && items[0].netWeight > 0) {
      formattedNetWeight = `${formatWeightValue(items[0].netWeight)} KG`
      formattedGrossWeight = items[0].grossWeight > 0 ? `${formatWeightValue(items[0].grossWeight)} KG` : ""
      formattedGoodsValue = items[0].goodsValue > 0 ? formatUsdValue(items[0].goodsValue) : ""
    }

    return {
      isMultiItem,
      items,
      totalPackages,
      totalNetWeight,
      totalGrossWeight,
      totalGoodsValue,
      formattedNetWeight,
      formattedGrossWeight,
      formattedGoodsValue,
    }
  }, [])

  const liveCargoCalc = useMemo(() => {
    return calculateMultiCargo(
      formData.number_of_packages || "",
      formData.kgs_per_carton || "",
      formData.gross_weight_per_carton || "",
      formData.rate_per_kgs || ""
    )
  }, [
    calculateMultiCargo,
    formData.number_of_packages,
    formData.kgs_per_carton,
    formData.gross_weight_per_carton,
    formData.rate_per_kgs,
  ])

  const persistSavedParties = (
    storageKey: string,
    parties: SavedParty[],
    setParties: React.Dispatch<React.SetStateAction<SavedParty[]>>
  ) => {
    setParties(parties)
    window.localStorage.setItem(storageKey, JSON.stringify(parties))
  }

  const applyTruckPreset = (id: string) => {
    const found = savedTruckPresets.find((p) => p.id === id)
    if (!found) return
    setSelectedTruckPresetId(id)
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        truck_number: found.truck_number || prev.truck_number,
        driver_name: found.driver_name || prev.driver_name,
        driver_father_name: found.driver_father_name || prev.driver_father_name,
        driver_contact: found.driver_contact || prev.driver_contact,
        driver_rent: found.driver_rent || prev.driver_rent,
      }))
      setHasUnsavedChanges(true)
    })
    toast.success(`Applied vehicle preset: ${found.label}`)
  }

  const saveCurrentTruckPreset = () => {
    const truckNo = (formData.truck_number || "").trim()
    const rawDriverName = (formData.driver_name || "").replace(/^[\s,،-]+|[\s,،-]+$/g, "").trim()
    if (!truckNo && !rawDriverName) {
      toast.error("Enter a truck number or driver name before saving a preset.")
      return
    }
    const label = `${truckNo || "Vehicle"} | ${rawDriverName || "Driver"}`
    const newPreset = {
      id: `truck-${Date.now()}`,
      label,
      truck_number: truckNo,
      driver_name: rawDriverName,
      driver_father_name: (formData.driver_father_name || "").trim(),
      driver_contact: (formData.driver_contact || "").trim(),
      driver_rent: (formData.driver_rent || "").trim(),
    }
    const nextList = [newPreset, ...savedTruckPresets.filter((p) => p.label !== label)]
    setSavedTruckPresets(nextList)
    setSelectedTruckPresetId(newPreset.id)
    try {
      window.localStorage.setItem("skybol:saved-truck-presets", JSON.stringify(nextList))
    } catch {}
    toast.success(`Saved truck & driver preset: ${label}`)
  }

  const splitDriverFatherName = () => {
    const current = (formData.driver_name || "").replace(/^[\s,،-]+/, "").trim()
    const match = current.match(/^(.*?)\s+(?:ولد|بن)\s+(.*)$/)
    if (match) {
      const driver = match[1].replace(/^[\s,،-]+|[\s,،-]+$/g, "").trim()
      const father = match[2].replace(/^[\s,،-]+|[\s,،-]+$/g, "").trim()
      startTransition(() => {
        setFormData((prev) => ({
          ...prev,
          driver_name: driver,
          driver_father_name: father,
        }))
        setHasUnsavedChanges(true)
      })
      toast.success(`Split: Driver = "${driver}", Father = "${father}"`)
    }
  }

  const applySavedNote1 = (id: string) => {
    const found = savedNotes1.find((n) => n.id === id)
    if (!found) return
    setSelectedNote1Id(id)
    setFormData((prev) => ({
      ...prev,
      notes_1_label: found.label,
      notes_1: found.content,
      notes_1_theme: found.theme || prev.notes_1_theme || "red",
    }))
    toast.success("Applied saved option to Note 1")
  }

  const persistSavedNotes = (
    storageKey: string,
    notes: SavedNoteOption[],
    setNotes: React.Dispatch<React.SetStateAction<SavedNoteOption[]>>,
  ) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notes))
      setNotes(notes)
      return true
    } catch (error) {
      console.error("Failed to save note presets:", error)
      toast.error("Could not save the note preset", {
        description: "Browser storage is unavailable or full.",
      })
      return false
    }
  }

  const saveCurrentNote1 = (saveAsNew = false) => {
    const label = (formData.notes_1_label || "").trim() || "Note 1"
    const content = (formData.notes_1 || "").trim()
    if (!content) {
      toast.error("Enter Note 1 content first")
      return
    }

    const normalizedLabel = label.toLocaleLowerCase()
    const existingMatch = saveAsNew
      ? undefined
      : savedNotes1.find((n) => n.id === selectedNote1Id)
        || savedNotes1.find((n) => n.label.trim().toLocaleLowerCase() === normalizedLabel)
    const currentNote: SavedNoteOption = {
      id: existingMatch ? existingMatch.id : `n1-${Date.now()}`,
      label,
      content,
      theme: formData.notes_1_theme || "red",
      savedAt: new Date().toISOString(),
    }
    const nextList = [currentNote, ...savedNotes1.filter((n) => n.id !== currentNote.id)]
    if (!persistSavedNotes(SAVED_NOTES_1_STORAGE_KEY, nextList, setSavedNotes1)) return
    setSelectedNote1Id(currentNote.id)
    toast.success(existingMatch ? "Note 1 preset updated" : "Note 1 preset saved", {
      description: `“${label}” is ready to reuse`,
    })
  }

  const saveCurrentNote1AsNew = () => saveCurrentNote1(true)

  const deleteSavedNote1 = () => {
    if (!selectedNote1Id) return
    const nextList = savedNotes1.filter((n) => n.id !== selectedNote1Id)
    if (!persistSavedNotes(SAVED_NOTES_1_STORAGE_KEY, nextList, setSavedNotes1)) return
    setSelectedNote1Id("")
    toast.success("Saved Note 1 option deleted")
  }

  const applySavedNote2 = (id: string) => {
    const found = savedNotes2.find((n) => n.id === id)
    if (!found) return
    setSelectedNote2Id(id)
    setFormData((prev) => ({
      ...prev,
      notes_2_label: found.label,
      notes_2: found.content,
      notes_2_theme: found.theme || prev.notes_2_theme || "green",
    }))
    toast.success("Applied saved option to Note 2")
  }

  const applyBorderStationPreset = (
    presetId: string,
    defaultLabel: string,
    defaultContent: string,
    defaultTheme: NoteTheme
  ) => {
    const existing = savedNotes2.find(
      (n) =>
        n.id === presetId ||
        n.label.trim().toLowerCase() === defaultLabel.trim().toLowerCase() ||
        n.content.trim() === defaultContent.trim()
    )

    const finalLabel = existing ? existing.label : defaultLabel
    const finalContent = existing ? existing.content : defaultContent
    const finalTheme = (existing?.theme || defaultTheme) as NoteTheme
    const finalId = existing ? existing.id : presetId

    if (!existing) {
      const newOption: SavedNoteOption = {
        id: presetId,
        label: defaultLabel,
        content: defaultContent,
        theme: defaultTheme,
        savedAt: new Date().toISOString(),
      }
      const nextList = [newOption, ...savedNotes2.filter((n) => n.id !== presetId)]
      persistSavedNotes(SAVED_NOTES_2_STORAGE_KEY, nextList, setSavedNotes2)
    }

    setSelectedNote2Id(finalId)
    setFormData((prev) => ({
      ...prev,
      notes_2_label: finalLabel,
      notes_2: finalContent,
      notes_2_theme: finalTheme,
    }))
    toast.success(`Applied: ${finalLabel}`)
  }

  const saveCurrentNote2 = (saveAsNew = false) => {
    const label = (formData.notes_2_label || "").trim() || "Note 2"
    const content = (formData.notes_2 || "").trim()
    if (!content) {
      toast.error("Enter Note 2 content first")
      return
    }

    const normalizedLabel = label.toLowerCase()
    const existingMatch = saveAsNew
      ? undefined
      : (selectedNote2Id && selectedSavedNote2?.label.trim().toLowerCase() === normalizedLabel)
        ? selectedSavedNote2
        : savedNotes2.find((n) => n.label.trim().toLowerCase() === normalizedLabel)
          || (selectedNote2Id ? savedNotes2.find((n) => n.id === selectedNote2Id) : undefined)
    const currentNote: SavedNoteOption = {
      id: existingMatch ? existingMatch.id : `n2-${Date.now()}`,
      label,
      content,
      theme: formData.notes_2_theme || "green",
      savedAt: new Date().toISOString(),
    }
    const nextList = [currentNote, ...savedNotes2.filter((n) => n.id !== currentNote.id)]
    if (!persistSavedNotes(SAVED_NOTES_2_STORAGE_KEY, nextList, setSavedNotes2)) return
    setSelectedNote2Id(currentNote.id)
    toast.success(existingMatch ? "Note 2 preset updated" : "Note 2 preset saved", {
      description: `“${label}” is ready to reuse`,
    })
  }

  const saveCurrentNote2AsNew = () => saveCurrentNote2(true)

  const deleteSavedNote2 = () => {
    if (!selectedNote2Id) return
    const nextList = savedNotes2.filter((n) => n.id !== selectedNote2Id)
    if (!persistSavedNotes(SAVED_NOTES_2_STORAGE_KEY, nextList, setSavedNotes2)) return
    setSelectedNote2Id("")
    toast.success("Saved Note 2 option deleted")
  }

  // Decoupled / Form-Validated Selected Entity IDs:
  // An entity ID is only considered actively selected if the corresponding form field actually contains that entity's data.
  // This guarantees that when a new blank BOL is created or fields are cleared, phantom directory selections never linger.
  const isShipperSelected = Boolean(
    selectedShipperId &&
    formData.shipper_name?.trim() &&
    (savedShippers.some((s) => s.id === selectedShipperId && s.name.trim().toLowerCase() === formData.shipper_name.trim().toLowerCase()) ||
     apiShippers.some((s) => s.id === selectedShipperId && s.name.trim().toLowerCase() === formData.shipper_name.trim().toLowerCase()))
  )

  const isConsigneeSelected = Boolean(
    selectedConsigneeId &&
    formData.consignee_name?.trim() &&
    (savedConsignees.some((c) => c.id === selectedConsigneeId && c.name.trim().toLowerCase() === formData.consignee_name.trim().toLowerCase()) ||
     apiConsignees.some((c) => c.id === selectedConsigneeId && c.name.trim().toLowerCase() === formData.consignee_name.trim().toLowerCase()))
  )

  const isNotifyPartySelected = Boolean(
    selectedNotifyPartyId &&
    formData.notify_party?.trim() &&
    (savedNotifyParties.some((n) => n.id === selectedNotifyPartyId && n.name.trim().toLowerCase() === formData.notify_party.trim().toLowerCase()) ||
     apiNotifyParties.some((n) => n.id === selectedNotifyPartyId && n.name.trim().toLowerCase() === formData.notify_party.trim().toLowerCase()))
  )

  const isNote1Selected = Boolean(
    selectedNote1Id &&
    (formData.notes_1?.trim() || formData.notes_1_label?.trim()) &&
    savedNotes1.some((n) => n.id === selectedNote1Id)
  )

  const isNote2Selected = Boolean(
    selectedNote2Id &&
    (formData.notes_2?.trim() || formData.notes_2_label?.trim()) &&
    savedNotes2.some((n) => n.id === selectedNote2Id)
  )

  const isTruckPresetSelected = Boolean(
    selectedTruckPresetId &&
    formData.truck_number?.trim() &&
    savedTruckPresets.some((t) => t.id === selectedTruckPresetId && t.truck_number.trim().toLowerCase() === formData.truck_number.trim().toLowerCase())
  )

  const selectedSavedNote1 = isNote1Selected ? savedNotes1.find((note) => note.id === selectedNote1Id) : undefined
  const selectedSavedNote2 = isNote2Selected ? savedNotes2.find((note) => note.id === selectedNote2Id) : undefined
  const isNote1PresetDirty = Boolean(isNote1Selected && selectedSavedNote1 && (
    selectedSavedNote1.label !== (formData.notes_1_label || "").trim()
    || selectedSavedNote1.content !== (formData.notes_1 || "").trim()
    || (selectedSavedNote1.theme || "red") !== (formData.notes_1_theme || "red")
  ))
  const isNote2PresetDirty = Boolean(isNote2Selected && selectedSavedNote2 && (
    selectedSavedNote2.label !== (formData.notes_2_label || "").trim()
    || selectedSavedNote2.content !== (formData.notes_2 || "").trim()
    || (selectedSavedNote2.theme || "green") !== (formData.notes_2_theme || "green")
  ))

  const isShipperExisting = Boolean(
    formData.shipper_name?.trim() &&
    savedShippers.some(
      (s) =>
        s.name.trim().toLowerCase() === formData.shipper_name.trim().toLowerCase() ||
        (isShipperSelected && s.id === selectedShipperId)
    )
  )

  const isConsigneeExisting = Boolean(
    formData.consignee_name?.trim() &&
    savedConsignees.some(
      (c) =>
        c.name.trim().toLowerCase() === formData.consignee_name.trim().toLowerCase() ||
        (isConsigneeSelected && c.id === selectedConsigneeId)
    )
  )

  const isNotifyPartyExisting = Boolean(
    formData.notify_party?.trim() &&
    savedNotifyParties.some(
      (n) =>
        n.name.trim().toLowerCase() === formData.notify_party.trim().toLowerCase() ||
        (isNotifyPartySelected && n.id === selectedNotifyPartyId)
    )
  )

  // Self-Healing Synchronization: Clear phantom preset IDs whenever corresponding form fields are empty
  useEffect(() => {
    if (!formData.shipper_name?.trim() && selectedShipperId) {
      setSelectedShipperId("")
    }
    if (!formData.consignee_name?.trim() && selectedConsigneeId) {
      setSelectedConsigneeId("")
    }
    if (!formData.notify_party?.trim() && selectedNotifyPartyId) {
      setSelectedNotifyPartyId("")
    }
    if (!formData.notes_2?.trim() && !formData.notes_2_label?.trim() && selectedNote2Id) {
      setSelectedNote2Id("")
    }
    if (!formData.notes_1?.trim() && !formData.notes_1_label?.trim() && selectedNote1Id) {
      setSelectedNote1Id("")
    }
    if (!formData.truck_number?.trim() && selectedTruckPresetId) {
      setSelectedTruckPresetId("")
    }
  }, [
    formData.shipper_name,
    formData.consignee_name,
    formData.notify_party,
    formData.notes_2,
    formData.notes_2_label,
    formData.notes_1,
    formData.notes_1_label,
    formData.truck_number,
    selectedShipperId,
    selectedConsigneeId,
    selectedNotifyPartyId,
    selectedNote2Id,
    selectedNote1Id,
    selectedTruckPresetId,
  ])

  const filteredSavedConsignees = useMemo(() => {
    const q = consigneeDirectorySearch.trim().toLowerCase()
    if (!q) return savedConsignees
    return savedConsignees.filter((c) =>
      [c.name, c.address, c.contact, c.email].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    )
  }, [savedConsignees, consigneeDirectorySearch])

  const filteredSavedShippers = useMemo(() => {
    const q = shipperDirectorySearch.trim().toLowerCase()
    if (!q) return savedShippers
    return savedShippers.filter((s) =>
      [s.name, s.address, s.contact, s.email].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    )
  }, [savedShippers, shipperDirectorySearch])

  const filteredSavedNotifyParties = useMemo(() => {
    const q = notifyDirectorySearch.trim().toLowerCase()
    if (!q) return savedNotifyParties
    return savedNotifyParties.filter((n) =>
      [n.name, n.address, n.contact, n.email].filter(Boolean).some((field) => field.toLowerCase().includes(q))
    )
  }, [savedNotifyParties, notifyDirectorySearch])

  const matchingShippers = useMemo(() => {
    const q = (shipperSearchQuery || formData.shipper_name || "").toLowerCase().trim()
    const pool = [...savedShippers, ...apiShippers]
    const seen = new Set<string>()
    const unique: SavedParty[] = []
    for (const item of pool) {
      const norm = (item.name || "").trim().toLowerCase()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        unique.push(item)
      }
    }
    if (!q) return []
    return unique
      .filter((s) => [s.name, s.address, s.contact, s.email].filter(Boolean).some((field) => field.toLowerCase().includes(q)))
      .slice(0, 25)
  }, [savedShippers, apiShippers, shipperSearchQuery, formData.shipper_name])

  const matchingConsignees = useMemo(() => {
    const q = (consigneeSearchQuery || formData.consignee_name || "").toLowerCase().trim()
    const pool = [...savedConsignees, ...apiConsignees]
    const seen = new Set<string>()
    const unique: SavedParty[] = []
    for (const item of pool) {
      const norm = (item.name || "").trim().toLowerCase()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        unique.push(item)
      }
    }
    if (!q) return []
    return unique
      .filter((c) => [c.name, c.address, c.contact, c.email].filter(Boolean).some((field) => field.toLowerCase().includes(q)))
      .slice(0, 25)
  }, [savedConsignees, apiConsignees, consigneeSearchQuery, formData.consignee_name])

  const matchingNotifyParties = useMemo(() => {
    const q = (notifyPartySearchQuery || formData.notify_party || "").toLowerCase().trim()
    const pool = [...savedNotifyParties, ...apiNotifyParties]
    const seen = new Set<string>()
    const unique: SavedParty[] = []
    for (const item of pool) {
      const norm = (item.name || "").trim().toLowerCase()
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        unique.push(item)
      }
    }
    if (!q) return []
    return unique
      .filter((n) => [n.name, n.address, n.contact, n.email].filter(Boolean).some((field) => field.toLowerCase().includes(q)))
      .slice(0, 25)
  }, [savedNotifyParties, apiNotifyParties, notifyPartySearchQuery, formData.notify_party])

  const clearShipperFields = () => {
    setFormData((prev) => ({
      ...prev,
      shipper_name: "",
      shipper_address: "",
      shipper_contact: "",
      shipper_email: "",
    }))
    setSelectedShipperId("")
    setShipperSearchQuery("")
    setShipperDirectorySearch("")
    toast.info("Shipper fields cleared", { description: "اطلاعات فرستنده پاک شد" })
  }

  const clearConsigneeFields = () => {
    setFormData((prev) => ({
      ...prev,
      consignee_name: "",
      consignee_address: "",
      consignee_contact: "",
      consignee_email: "",
    }))
    setSelectedConsigneeId("")
    setConsigneeSearchQuery("")
    setConsigneeDirectorySearch("")
    toast.info("Consignee fields cleared", { description: "اطلاعات گیرنده پاک شد" })
  }

  const clearNotifyPartyFields = () => {
    setFormData((prev) => ({
      ...prev,
      notify_party: "",
      notify_party_address: "",
    }))
    setSelectedNotifyPartyId("")
    setNotifyPartySearchQuery("")
    setNotifyDirectorySearch("")
    toast.info("Notify party cleared", { description: "اطلاعات طرف اطلاع پاک شد" })
  }

  const handleSetNotifySameAsConsignee = () => {
    setFormData((prev) => ({
      ...prev,
      notify_party: "SAME AS CONSIGNEE",
      notify_party_address: "",
    }))
    toast.success("Notify Party: SAME AS CONSIGNEE", { description: "طرف اطلاع به صورت برابر گیرنده تنظیم شد" })
  }

  const handleSetConsigneeToOrder = () => {
    setFormData((prev) => ({
      ...prev,
      consignee_name: "TO ORDER OF SHIPPER",
      consignee_address: "NEGOTIABLE BILL OF LADING",
    }))
    toast.success("Consignee: TO ORDER OF SHIPPER", { description: "گیرنده به حواله‌کرد فرستنده تنظیم شد" })
  }

  const handleSwapConsigneeNotify = () => {
    setFormData((prev) => ({
      ...prev,
      consignee_name: prev.notify_party,
      consignee_address: prev.notify_party_address,
      notify_party: prev.consignee_name,
      notify_party_address: [prev.consignee_address, prev.consignee_contact, prev.consignee_email].filter(Boolean).join(", "),
    }))
    toast.success("Swapped Consignee & Notify Party", { description: "اطلاعات گیرنده و طرف اطلاع جابجا شدند" })
  }

  const handleCopyShipperToConsignee = () => {
    if (!formData.shipper_name.trim()) {
      toast.error("Shipper is empty", { description: "ابتدا نام فرستنده را وارد کنید" })
      return
    }
    setFormData((prev) => ({
      ...prev,
      consignee_name: prev.shipper_name,
      consignee_address: prev.shipper_address,
      consignee_contact: prev.shipper_contact,
      consignee_email: prev.shipper_email,
    }))
    toast.success("Copied Shipper to Consignee", { description: "فرستنده به گیرنده کاپی شد" })
  }

  const handleCopyConsigneeToShipper = () => {
    if (!formData.consignee_name.trim()) {
      toast.error("Consignee is empty", { description: "ابتدا نام گیرنده را وارد کنید" })
      return
    }
    setFormData((prev) => ({
      ...prev,
      shipper_name: prev.consignee_name,
      shipper_address: prev.consignee_address,
      shipper_contact: prev.consignee_contact,
      shipper_email: prev.consignee_email,
    }))
    toast.success("Copied Consignee to Shipper", { description: "گیرنده به فرستنده کاپی شد" })
  }

  const saveCurrentShipper = () => {
    const shipperName = formData.shipper_name.trim()
    if (!shipperName) {
      toast.error("Add shipper name first", {
        description: "Enter a shipper name before saving it.",
      })
      return
    }

    const existingMatch =
      (selectedShipperId ? savedShippers.find((s) => s.id === selectedShipperId) : undefined) ||
      savedShippers.find((s) => s.name.trim().toLowerCase() === shipperName.toLowerCase())

    if (!existingMatch) {
      const candidates = findDuplicatePartyCandidates(shipperName, savedShippers)
      if (candidates.length > 0 && candidates[0].similarity >= 0.88) {
        toast.warning(`Potential duplicate detected: "${candidates[0].name}"`, {
          description: `Existing party matches canonical format (${candidates[0].matchedCanonical}). Saved as distinct record.`,
          duration: 6000,
        })
      }
    }

    const currentShipper: SavedParty = {
      id: existingMatch ? existingMatch.id : crypto.randomUUID(),
      name: shipperName,
      address: (formData.shipper_address || "").trim() || (existingMatch?.address || ""),
      contact: (formData.shipper_contact || "").trim(),
      email: (formData.shipper_email || "").trim(),
      savedAt: new Date().toISOString(),
    }

    const nextShippers = [
      currentShipper,
      ...savedShippers.filter((s) => s.id !== currentShipper.id && s.name.trim().toLowerCase() !== shipperName.toLowerCase()),
    ].slice(0, 10000)

    persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, nextShippers, setSavedShippers)
    setSelectedShipperId(currentShipper.id)
    toast.success(existingMatch ? "Shipper updated in directory!" : "New shipper saved successfully!", {
      description: `${currentShipper.name} is stored in saved shippers directory.`,
    })
  }

  const applySavedShipper = (shipperId: string) => {
    const shipper = savedShippers.find((item) => item.id === shipperId) || apiShippers.find((item) => item.id === shipperId)
    if (!shipper) return

    setSelectedShipperId(shipperId)
    setFormData((prev) => ({
      ...prev,
      shipper_name: shipper.name || prev.shipper_name,
      shipper_address: shipper.address || "",
      shipper_contact: shipper.contact || "",
      shipper_email: shipper.email || "",
    }))
    toast.success(`Loaded Shipper: ${shipper.name}`, {
      description: shipper.address ? shipper.address.slice(0, 40) + "..." : "Shipper loaded",
    })
  }

  const deleteSavedShipper = () => {
    if (!selectedShipperId) return

    const shipper = savedShippers.find((item) => item.id === selectedShipperId)
    persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, savedShippers.filter((item) => item.id !== selectedShipperId), setSavedShippers)
    setSelectedShipperId("")
    toast.success("Saved shipper removed", {
      description: shipper?.name || "The shipper was removed from saved shippers.",
    })
  }

  const saveCurrentConsignee = () => {
    const consigneeName = formData.consignee_name.trim()
    if (!consigneeName) {
      toast.error("Add consignee name first", {
        description: "Enter a consignee name before saving it.",
      })
      return
    }

    const existingMatch = savedConsignees.find(
      (c) => c.name.trim().toLowerCase() === consigneeName.toLowerCase() ||
             (selectedConsigneeId && c.id === selectedConsigneeId && c.name.trim().toLowerCase() === consigneeName.toLowerCase())
    )

    if (!existingMatch) {
      const candidates = findDuplicatePartyCandidates(consigneeName, savedConsignees)
      if (candidates.length > 0 && candidates[0].similarity >= 0.88) {
        toast.warning(`Potential duplicate detected: "${candidates[0].name}"`, {
          description: `Existing consignee matches canonical format (${candidates[0].matchedCanonical}). Saved as distinct record.`,
          duration: 6000,
        })
      }
    }

    const currentConsignee: SavedParty = {
      id: existingMatch ? existingMatch.id : crypto.randomUUID(),
      name: consigneeName,
      address: (formData.consignee_address || "").trim() || (existingMatch?.address || ""),
      contact: (formData.consignee_contact || "").trim(),
      email: (formData.consignee_email || "").trim(),
      savedAt: new Date().toISOString(),
    }

    const nextConsignees = [
      currentConsignee,
      ...savedConsignees.filter((c) => c.id !== currentConsignee.id && c.name.trim().toLowerCase() !== consigneeName.toLowerCase()),
    ].slice(0, 10000)

    persistSavedParties(SAVED_CONSIGNEES_STORAGE_KEY, nextConsignees, setSavedConsignees)
    setSelectedConsigneeId(currentConsignee.id)
    toast.success(existingMatch ? "Consignee updated in directory!" : "New consignee saved successfully!", {
      description: `${currentConsignee.name} is stored in saved consignees directory.`,
    })
  }

  const applySavedConsignee = (consigneeId: string) => {
    const consignee = savedConsignees.find((item) => item.id === consigneeId) || apiConsignees.find((item) => item.id === consigneeId)
    if (!consignee) return

    setSelectedConsigneeId(consigneeId)
    setFormData((prev) => ({
      ...prev,
      consignee_name: consignee.name || prev.consignee_name,
      consignee_address: consignee.address || "",
      consignee_contact: consignee.contact || "",
      consignee_email: consignee.email || "",
    }))
    toast.success(`Loaded Consignee: ${consignee.name}`, {
      description: consignee.address ? consignee.address.slice(0, 40) + "..." : "Consignee loaded",
    })
  }

  const deleteSavedConsignee = () => {
    if (!selectedConsigneeId) return

    const consignee = savedConsignees.find((item) => item.id === selectedConsigneeId)
    persistSavedParties(
      SAVED_CONSIGNEES_STORAGE_KEY,
      savedConsignees.filter((item) => item.id !== selectedConsigneeId),
      setSavedConsignees
    )
    setSelectedConsigneeId("")
    toast.success("Saved consignee removed", {
      description: consignee?.name || "The consignee was removed from saved consignees.",
    })
  }

  const saveCurrentNotifyParty = () => {
    const notifyPartyName = formData.notify_party.trim()
    if (!notifyPartyName) {
      toast.error("Add notify party name first", {
        description: "ابتدا نام طرف اطلاع را وارد کنید",
      })
      return
    }

    const existingMatch = savedNotifyParties.find(
      (n) => n.name.trim().toLowerCase() === notifyPartyName.toLowerCase() ||
             (selectedNotifyPartyId && n.id === selectedNotifyPartyId && n.name.trim().toLowerCase() === notifyPartyName.toLowerCase())
    )

    if (!existingMatch) {
      const candidates = findDuplicatePartyCandidates(notifyPartyName, savedNotifyParties)
      if (candidates.length > 0 && candidates[0].similarity >= 0.88) {
        toast.warning(`Potential duplicate detected: "${candidates[0].name}"`, {
          description: `Existing notify party matches canonical format (${candidates[0].matchedCanonical}). Saved as distinct record.`,
          duration: 6000,
        })
      }
    }

    const currentNotifyParty: SavedParty = {
      id: existingMatch ? existingMatch.id : crypto.randomUUID(),
      name: notifyPartyName,
      address: (formData.notify_party_address || "").trim() || (existingMatch?.address || ""),
      contact: "",
      email: "",
      savedAt: new Date().toISOString(),
    }

    const nextNotifyParties = [
      currentNotifyParty,
      ...savedNotifyParties.filter(
        (n) => n.id !== currentNotifyParty.id && n.name.trim().toLowerCase() !== notifyPartyName.toLowerCase()
      ),
    ].slice(0, 10000)

    persistSavedParties(SAVED_NOTIFY_PARTIES_STORAGE_KEY, nextNotifyParties, setSavedNotifyParties)
    setSelectedNotifyPartyId(currentNotifyParty.id)
    toast.success(existingMatch ? "Notify party updated in directory!" : "New notify party saved successfully!", {
      description: `${currentNotifyParty.name} در لیست ذخیره شد.`,
    })
  }

  const applySavedNotifyParty = (notifyPartyId: string) => {
    const notifyParty = savedNotifyParties.find((item) => item.id === notifyPartyId) || apiNotifyParties.find((item) => item.id === notifyPartyId)
    if (!notifyParty) return

    setSelectedNotifyPartyId(notifyPartyId)
    setFormData((prev) => ({
      ...prev,
      notify_party: notifyParty.name || prev.notify_party,
      notify_party_address: notifyParty.address || "",
    }))
    toast.success(`Loaded Notify Party: ${notifyParty.name}`, {
      description: notifyParty.address ? notifyParty.address.slice(0, 40) + "..." : "طرف اطلاع بارگذاری شد",
    })
  }

  const deleteSavedNotifyParty = () => {
    if (!selectedNotifyPartyId) return

    const notifyParty = savedNotifyParties.find((item) => item.id === selectedNotifyPartyId)
    persistSavedParties(
      SAVED_NOTIFY_PARTIES_STORAGE_KEY,
      savedNotifyParties.filter((item) => item.id !== selectedNotifyPartyId),
      setSavedNotifyParties
    )
    setSelectedNotifyPartyId("")
    toast.success("Saved notify party removed", {
      description: notifyParty?.name || "The notify party was removed from saved notify parties.",
    })
  }

  const CARGO_PRESETS = [
    {
      name: "Dried Figs (انجیر خشک)",
      description: "AFGHAN DRIED FIGS (ANJEER) - PREMIUM GRADE AAA PACKED IN 10KG CARTONS",
      packages: "1,200 CTNS",
      kgsPerCarton: "10.0",
      grossPerCarton: "10.5",
      rate: "4.50",
      cbm: "24.0 CBM",
    },
    {
      name: "Green Raisins (کشمش سبز)",
      description: "AFGHAN GREEN RAISINS (KISHMISH) - NATURAL SHADE DRIED PACKED IN 10KG CARTONS",
      packages: "2,000 CTNS",
      kgsPerCarton: "10.0",
      grossPerCarton: "10.4",
      rate: "3.80",
      cbm: "28.0 CBM",
    },
    {
      name: "Mamra Almonds (بادام مامایی)",
      description: "AFGHAN MAMRA ALMONDS (GIRDI BADAM) - VACUUM PACKED IN 20KG SACKS / CARTONS",
      packages: "800 BAGS",
      kgsPerCarton: "20.0",
      grossPerCarton: "20.3",
      rate: "12.00",
      cbm: "20.0 CBM",
    },
    {
      name: "Pomegranate Juice (آب انار)",
      description: "100% PURE NATURAL POMEGRANATE JUICE IN 1L TETRAPAKS / 12 BOTTLES PER CARTON",
      packages: "1,500 CTNS",
      kgsPerCarton: "12.0",
      grossPerCarton: "12.8",
      rate: "2.20",
      cbm: "22.5 CBM",
    },
    {
      name: "Textiles / Fabrics (پارچه)",
      description: "SYNTHETIC & COTTON WOVEN FABRIC ROLLS IN HEAVY POLYETHYLENE WRAPPING",
      packages: "450 ROLLS",
      kgsPerCarton: "45.0",
      grossPerCarton: "46.0",
      rate: "5.50",
      cbm: "35.0 CBM",
    },
    {
      name: "General Transit Goods (کالای عمومی)",
      description: "COMMERCIAL GENERAL CARGO AS PER ATTACHED INVOICE & PACKING LIST",
      packages: "1,000 CTNS",
      kgsPerCarton: "15.0",
      grossPerCarton: "15.5",
      rate: "1.80",
      cbm: "25.0 CBM",
    },
  ]

  const handleSwapShipperConsignee = () => {
    setFormData((prev) => ({
      ...prev,
      shipper_name: prev.consignee_name,
      shipper_address: prev.consignee_address,
      shipper_contact: prev.consignee_contact,
      shipper_email: prev.consignee_email,
      consignee_name: prev.shipper_name,
      consignee_address: prev.shipper_address,
      consignee_contact: prev.shipper_contact,
      consignee_email: prev.shipper_email,
    }))
    toast.success("Swapped Shipper ⇄ Consignee details!")
  }

  const handleCopyShipperToNotify = () => {
    setFormData((prev) => ({
      ...prev,
      notify_party: prev.shipper_name,
      notify_party_address: [prev.shipper_address, prev.shipper_contact, prev.shipper_email].filter(Boolean).join(", "),
    }))
    toast.success("Copied Shipper to Notify Party!")
  }

  const handleCopyConsigneeToNotify = () => {
    setFormData((prev) => ({
      ...prev,
      notify_party: prev.consignee_name,
      notify_party_address: [prev.consignee_address, prev.consignee_contact, prev.consignee_email].filter(Boolean).join(", "),
    }))
    toast.success("Copied Consignee to Notify Party!")
  }

  const handleAutoCalculateWeights = () => {
    const calc = calculateMultiCargo(
      formData.number_of_packages || "",
      formData.kgs_per_carton || "",
      formData.gross_weight_per_carton || "",
      formData.rate_per_kgs || ""
    )

    if (calc.totalPackages <= 0) {
      toast.error("Enter the number of packages first", {
        description: "Add one or more carton/package quantities before calculating totals.",
      })
      return
    }

    const hasCartonWeight = calc.items.some((item) => item.netPerCarton > 0 || item.grossPerCarton > 0)
    if (!hasCartonWeight) {
      toast.error("Enter a carton weight first", {
        description: "Add net or gross weight per carton to calculate shipment totals.",
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      net_weight: calc.formattedNetWeight || prev.net_weight,
      gross_weight: calc.formattedGrossWeight || prev.gross_weight,
      goods_value: calc.formattedGoodsValue || prev.goods_value,
    }))

    if (calc.isMultiItem) {
      toast.success(`Calculated ${calc.items.length} Cargo Items!`, {
        description: `Net: ${calc.formattedNetWeight} | Gross: ${calc.formattedGrossWeight} | Val: ${calc.formattedGoodsValue}`,
      })
    } else {
      toast.success("Weights & Goods Value Recalculated!", {
        description: `Net: ${calc.formattedNetWeight || "N/A"} | Gross: ${calc.formattedGrossWeight || "N/A"} | Value: ${calc.formattedGoodsValue || "N/A"}`,
      })
    }
  }

  const handleApplyCargoPreset = (preset: (typeof CARGO_PRESETS)[number]) => {
    const packageCount = parseNumericValue(preset.packages)
    const kgs = parseNumericValue(preset.kgsPerCarton)
    const gross = parseNumericValue(preset.grossPerCarton)
    const rate = parseNumericValue(preset.rate)

    const netCalc = packageCount && kgs ? `${formatWeightValue(packageCount * kgs)} KG` : ""
    const grossCalc = packageCount && gross ? `${formatWeightValue(packageCount * gross)} KG` : ""
    const valCalc = rate && packageCount && kgs ? formatUsdValue(rate * packageCount * kgs) : ""

    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        cargo_description: preset.description,
        number_of_packages: preset.packages,
        kgs_per_carton: preset.kgsPerCarton,
        gross_weight_per_carton: preset.grossPerCarton,
        rate_per_kgs: preset.rate,
        net_weight: netCalc || prev.net_weight,
        gross_weight: grossCalc || prev.gross_weight,
        goods_value: valCalc || prev.goods_value,
        measurement: preset.cbm || prev.measurement,
      }))
      setHasUnsavedChanges(true)
    })

    toast.success(`Applied Preset: ${preset.name}`, {
      description: "Updated description, packages, weights and rate values.",
    })
  }

  const handleCargoFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [fieldName]: value }

      if (
        fieldName === "number_of_packages" ||
        fieldName === "kgs_per_carton" ||
        fieldName === "gross_weight_per_carton" ||
        fieldName === "rate_per_kgs"
      ) {
        const calc = calculateMultiCargo(
          updated.number_of_packages || "",
          updated.kgs_per_carton || "",
          updated.gross_weight_per_carton || "",
          updated.rate_per_kgs || ""
        )

        if (calc.formattedNetWeight) updated.net_weight = calc.formattedNetWeight
        if (calc.formattedGrossWeight) updated.gross_weight = calc.formattedGrossWeight
        if (calc.formattedGoodsValue) updated.goods_value = calc.formattedGoodsValue
      }

      return updated
    })
  }

  const insertCargoTagSnippet = (tagText: string) => {
    setFormData((prev) => {
      const current = (prev.cargo_description || "").trim()
      const newDesc = current ? `${current}\n${tagText}` : tagText
      return { ...prev, cargo_description: newDesc }
    })
    toast.success("Added cargo tag", { description: tagText.slice(0, 35) })
  }

  const clearCargoDescription = () => {
    setFormData((prev) => ({ ...prev, cargo_description: "" }))
    toast.info("Cargo description cleared", { description: "شرح کالا پاک شد" })
  }

  const applyDefaultCargoDescription = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const defaultText = `📦 CONTAINER & CARGO PARTICULARS:\n• Description: \n• Transit Date: ${today}\n• INV-`
    setFormData((prev) => ({ ...prev, cargo_description: defaultText }))
    toast.success("Applied default cargo particulars", { description: "الگوی پیش‌فرض کالا ثبت شد" })
  }

  const clearAllCargoFields = () => {
    setFormData((prev) => ({
      ...prev,
      container_numbers: "",
      seal_numbers: "",
      number_of_packages: "",
      kgs_per_carton: "",
      gross_weight_per_carton: "",
      rate_per_kgs: "",
      goods_value: "",
      net_weight: "",
      gross_weight: "",
      measurement: "",
      cargo_description: "",
      cargo_route_note: "",
    }))
    toast.info("All cargo fields cleared", { description: "تمامی مشخصات کالا پاک شد" })
  }

  const generateRandomSealNumber = () => {
    const randomSix = Math.floor(100000 + Math.random() * 900000)
    const seal = `SL-${randomSix}`
    handleCargoFieldChange("seal_numbers", seal)
    toast.success("Generated Seal Number", { description: seal })
  }

  const applyContainerPrefix = (prefix: string) => {
    const current = (formData.container_numbers || "").trim()
    const nextVal = current ? `${current}, ${prefix}` : prefix
    handleCargoFieldChange("container_numbers", nextVal)
  }

  const applyPackageUnit = (unit: string) => {
    const rawCount = formData.number_of_packages || ""
    const digitsMatch = rawCount.match(/\d+[\d,]*/)
    const count = digitsMatch ? digitsMatch[0] : "1,000"
    handleCargoFieldChange("number_of_packages", `${count} ${unit}`)
    toast.info(`Updated unit to ${unit}`)
  }

  const applyCartonWeightPreset = (net: string, gross: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        kgs_per_carton: net,
        gross_weight_per_carton: gross,
      }
      const calc = calculateMultiCargo(
        updated.number_of_packages || "",
        net,
        gross,
        updated.rate_per_kgs || ""
      )
      if (calc.formattedNetWeight) updated.net_weight = calc.formattedNetWeight
      if (calc.formattedGrossWeight) updated.gross_weight = calc.formattedGrossWeight
      if (calc.formattedGoodsValue) updated.goods_value = calc.formattedGoodsValue
      return updated
    })
    toast.success(`Set carton weights: Net ${net} kg / Gross ${gross} kg`)
  }

  const applyVolumeCbmPreset = (cbm: string) => {
    handleCargoFieldChange("measurement", cbm)
    toast.info(`Applied container volume: ${cbm}`)
  }

  const formatCleanCargoDescription = () => {
    const desc = formData.cargo_description || ""
    if (!desc.trim()) return
    const cleaned = desc
      .split("\n")
      .map((line) => {
        let l = line.trim()
        if (!l) return ""
        // Auto-correct common clerical cargo typos
        l = l
          .replace(/\braisnis\b/gi, (m) => (m === m.toUpperCase() ? "RAISINS" : m[0] === m[0].toUpperCase() ? "Raisins" : "raisins"))
          .replace(/\bapricotes\b/gi, (m) => (m === m.toUpperCase() ? "APRICOTS" : "apricots"))
          .replace(/\bfigues\b/gi, (m) => (m === m.toUpperCase() ? "FIGS" : "figs"))
          .replace(/\bwalnutts\b/gi, (m) => (m === m.toUpperCase() ? "WALNUTS" : "walnuts"))
          .replace(/\bpistachos\b/gi, (m) => (m === m.toUpperCase() ? "PISTACHIOS" : "pistachios"))
          .replace(/\balmondes\b/gi, (m) => (m === m.toUpperCase() ? "ALMONDS" : "almonds"))
          .replace(/(\d+)\s*-\s*(KGS?|KG|CTNS?|PKGS?|BAGS?|BOXES|PCS|UNITS|TONS?|LBS?)\b/gi, "$1 $2")
          .replace(/@\s*([\d,]+(?:\.\d+)?)\s*\$/g, "@ $$$1")
        return l
      })
      .filter(Boolean)
      .join("\n")
    setFormData((prev) => ({ ...prev, cargo_description: cleaned }))
    toast.success("Cargo description formatted cleanly and verified")
  }

  const insertBilingualCargoHeader = () => {
    const header = "📦 مشخصات و تفکیک محموله صادراتی / EXPORT CARGO & CONTAINER SPECIFICATIONS"
    setFormData((prev) => {
      const current = (prev.cargo_description || "").trim()
      if (current.includes("EXPORT CARGO & CONTAINER SPECIFICATIONS")) return prev
      return { ...prev, cargo_description: `${header}\n\n${current}` }
    })
    toast.success("Added bilingual cargo header")
  }

  const NOTE_THEME_BUTTON_CLASSES: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    gray: 'bg-slate-500',
  }

  // Get theme styles for notes
  const getNoteThemeStyles = (theme: NoteTheme = 'blue') => {
    const themes = {
      blue: {
        container: 'bg-linear-to-br from-blue-50/90 via-white to-sky-50/40 border-blue-200/90 shadow-xs shadow-blue-100/50 dark:from-blue-950/40 dark:via-slate-900/90 dark:to-blue-950/20 dark:border-blue-900/60 dark:shadow-none',
        badge: 'bg-blue-600 text-white shadow-xs shadow-blue-600/30',
        label: 'text-blue-900 dark:text-blue-200',
        input: 'border-blue-200/90 bg-white/95 focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 text-slate-900 font-bold dark:border-blue-800/60 dark:bg-slate-900/90 dark:text-blue-200 dark:focus:border-blue-400',
        textarea: 'border-blue-200/90 focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 bg-white/95 text-slate-900 dark:border-blue-800/60 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-blue-400',
        chip: 'bg-blue-50/90 hover:bg-blue-100 text-blue-800 border-blue-200/80 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800',
      },
      red: {
        container: 'bg-linear-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-200/90 shadow-xs shadow-rose-100/50 dark:from-rose-950/40 dark:via-slate-900/90 dark:to-rose-950/20 dark:border-rose-900/60 dark:shadow-none',
        badge: 'bg-rose-600 text-white shadow-xs shadow-rose-600/30',
        label: 'text-rose-900 dark:text-rose-200',
        input: 'border-rose-200/90 bg-white/95 focus:border-rose-600 focus:ring-2 focus:ring-rose-400/20 text-slate-900 font-bold dark:border-rose-800/60 dark:bg-slate-900/90 dark:text-rose-200 dark:focus:border-rose-400',
        textarea: 'border-rose-200/90 focus:border-rose-600 focus:ring-2 focus:ring-rose-400/20 bg-white/95 text-slate-900 dark:border-rose-800/60 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-rose-400',
        chip: 'bg-rose-50/90 hover:bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800',
      },
      green: {
        container: 'bg-linear-to-br from-emerald-50/90 via-white to-emerald-50/40 border-emerald-200/90 shadow-xs shadow-emerald-100/50 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-emerald-950/20 dark:border-emerald-900/60 dark:shadow-none',
        badge: 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30',
        label: 'text-emerald-900 dark:text-emerald-200',
        input: 'border-emerald-200/90 bg-white/95 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/20 text-slate-900 font-bold dark:border-emerald-800/60 dark:bg-slate-900/90 dark:text-emerald-200 dark:focus:border-emerald-400',
        textarea: 'border-emerald-200/90 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/20 bg-white/95 text-slate-900 dark:border-emerald-800/60 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-emerald-400',
        chip: 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800',
      },
      orange: {
        container: 'bg-linear-to-br from-amber-50/90 via-white to-amber-50/40 border-amber-200/90 shadow-xs shadow-amber-100/50 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-amber-950/20 dark:border-amber-900/60 dark:shadow-none',
        badge: 'bg-amber-600 text-white shadow-xs shadow-amber-600/30',
        label: 'text-amber-900 dark:text-amber-200',
        input: 'border-amber-200/90 bg-white/95 focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20 text-slate-900 font-bold dark:border-amber-800/60 dark:bg-slate-900/90 dark:text-amber-200 dark:focus:border-amber-400',
        textarea: 'border-amber-200/90 focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20 bg-white/95 text-slate-900 dark:border-amber-800/60 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-amber-400',
        chip: 'bg-amber-50/90 hover:bg-amber-100 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 dark:border-amber-800',
      },
      purple: {
        container: 'bg-linear-to-br from-purple-50/90 via-white to-purple-50/40 border-purple-200/90 shadow-xs shadow-purple-100/50 dark:from-purple-950/40 dark:via-slate-900/90 dark:to-purple-950/20 dark:border-purple-900/60 dark:shadow-none',
        badge: 'bg-purple-600 text-white shadow-xs shadow-purple-600/30',
        label: 'text-purple-900 dark:text-purple-200',
        input: 'border-purple-200/90 bg-white/95 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/20 text-slate-900 font-bold dark:border-purple-800/60 dark:bg-slate-900/90 dark:text-purple-200 dark:focus:border-purple-400',
        textarea: 'border-purple-200/90 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/20 bg-white/95 text-slate-900 dark:border-purple-800/60 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-purple-400',
        chip: 'bg-purple-50/90 hover:bg-purple-100 text-purple-800 border-purple-200/80 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 dark:border-purple-800',
      },
      gray: {
        container: 'bg-linear-to-br from-slate-50/90 via-white to-slate-50/40 border-slate-200/90 shadow-xs shadow-slate-100/50 dark:from-slate-900/90 dark:via-slate-850 dark:to-slate-900/90 dark:border-slate-800 dark:shadow-none',
        badge: 'bg-slate-700 text-white shadow-xs shadow-slate-700/30',
        label: 'text-slate-800 dark:text-slate-200',
        input: 'border-slate-200/90 bg-white/95 focus:border-slate-600 focus:ring-2 focus:ring-slate-400/20 text-slate-900 font-bold dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-slate-500',
        textarea: 'border-slate-200/90 focus:border-slate-600 focus:ring-2 focus:ring-slate-400/20 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-slate-500',
        chip: 'bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700',
      },
    }
    return themes[theme] || themes.blue
  }

  const handleDateChange = (gregorianDate: string) => {
    setIssueDate(gregorianDate)
    const dualDates = getDualDates(gregorianDate)
    if (dualDates) {
      setPersianDate(dualDates.persian)
      setPersianDateNumeric(formatPersianDate(gregorianDate) ?? dualDates.persianNumeric)
    }
  }

  const handleSetToday = () => {
    const today = new Date().toISOString().split("T")[0]
    handleDateChange(today)
    toast.success("Date set to Today / تاریخ امروز تنظیم شد")
  }

  const handleSetYesterday = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yesterday = d.toISOString().split("T")[0]
    handleDateChange(yesterday)
    toast.info("Date set to Yesterday / تاریخ دیروز تنظیم شد")
  }

  const handleCopyBolNumber = async () => {
    if (!bolNumber) return
    try {
      await navigator.clipboard.writeText(bolNumber)
      toast.success("BOL # copied to clipboard!", { description: bolNumber })
    } catch {
      toast.info(bolNumber)
    }
  }

  const handleIncrementBolNumber = useCallback(() => {
    const currentSeq = parseBolSeq(bolNumber)
    const highestKnown = getHighestKnownBolSequence()

    // If current BOL has a valid sequence, increment by 1. Otherwise take highest known + 1 (minimum 685)
    const nextSeq = currentSeq > 0 ? currentSeq + 1 : Math.max(highestKnown + 1, 685)
    const prefixMatch = (bolNumber || "").match(/^(.*?)(\d+)$/)
    const prefix = prefixMatch ? prefixMatch[1] : "BOL-2026-NSA"
    const nextBol = `${prefix}${nextSeq}`

    setBolNumber(nextBol)
    setFormData((prev) => ({
      ...prev,
      bol_number: nextBol,
    }))

    if (typeof window !== "undefined") {
      try {
        const currentHighest = Number(window.localStorage.getItem("skybol:highest-allocated-bol") || "0")
        const newHighest = Math.max(currentHighest, nextSeq)
        window.localStorage.setItem("skybol:highest-allocated-bol", String(newHighest))
        fetch(`/api/bol?action=set-sequence&sequence=${newHighest + 1}`).catch(() => {})
      } catch (_) {}
    }

    toast.success("Next BOL # Generated", { description: nextBol })
  }, [bolNumber, getHighestKnownBolSequence])

  const handleClearNote1 = () => {
    setFormData((prev) => ({ ...prev, notes_1: "", notes_1_label: "" }))
    setSelectedNote1Id("")
    toast.info("Note 1 cleared")
  }

  const handleClearNote2 = () => {
    setFormData((prev) => ({ ...prev, notes_2: "", notes_2_label: "" }))
    setSelectedNote2Id("")
    toast.info("Note 2 cleared")
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string
      if (!rawDataUrl) return

      // Create an image to optimize dimensions for high-DPI A4 print while keeping storage compact
      const img = new Image()
      img.onload = () => {
        const maxDim = 800
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)
          const optimizedDataUrl = canvas.toDataURL("image/png", 0.95)
          setLogoUrl(optimizedDataUrl)
          persistCompanySettings({ logoUrl: optimizedDataUrl })
          toast.success("Company logo uploaded and saved to settings!")
        } else {
          setLogoUrl(rawDataUrl)
          persistCompanySettings({ logoUrl: rawDataUrl })
          toast.success("Company logo uploaded and saved to settings!")
        }
      }
      img.onerror = () => {
        setLogoUrl(rawDataUrl)
        persistCompanySettings({ logoUrl: rawDataUrl })
        toast.success("Company logo uploaded and saved to settings!")
      }
      img.src = rawDataUrl
    }
    reader.readAsDataURL(file)
  }

  const resetLogo = () => {
    const defaultLogo = "/images/logo.png"
    setLogoUrl(defaultLogo)
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
    persistCompanySettings({ logoUrl: defaultLogo })
    toast.success("Company logo reset to default.")
  }

  const toggleAfghanistanDocument = (docId: string) => {
    setFormData((prev) => {
      const docs = prev.afghanistan_documents || []
      if (docs.includes(docId)) {
        const newDetails = { ...prev.afghanistan_document_details }
        delete newDetails[docId]
        return { ...prev, afghanistan_documents: docs.filter((d) => d !== docId), afghanistan_document_details: newDetails }
      }
      return { 
        ...prev, 
        afghanistan_documents: [...docs, docId],
        afghanistan_document_details: {
          ...prev.afghanistan_document_details,
          [docId]: { documentNumber: "", dateIssued: "", issuingAuthority: "" }
        }
      }
    })
  }

  const handleDocumentDetailChange = (docId: string, field: keyof AfghanistanDocumentDetail, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      afghanistan_document_details: {
        ...prev.afghanistan_document_details,
        [docId]: {
          ...(prev.afghanistan_document_details?.[docId] || { documentNumber: "", dateIssued: "", issuingAuthority: "" }),
          [field]: value
        }
      }
    }))
  }

  const handleRouteChange = (index: number, field: keyof RouteStop, value: any) => {
    setFormData((prev) => {
      const newRoutes = [...prev.routes]
      newRoutes[index] = { ...newRoutes[index], [field]: value }
      return { ...prev, routes: newRoutes }
    })
  }

  const applyDogharonToMersinReeferExportPreset = () => {
    const newRoutes = exportCorridorToBillOfLadingRoutes(dogharonToMersinReeferLegs)
    setFormData((prev) => ({
      ...prev,
      routes: newRoutes,
      port_of_loading: "Dogharon / Islam Qala, AF",
      port_of_discharge: "Mersin Port, Turkey",
      place_of_delivery: "Mersin Reefer Terminal, TR",
      container_type: "40RF",
      equipment_type: "40RF",
      temperature_setting: "-18°C Frozen",
      plugging_days: 7,
      escort_service_required: true,
      shipping_cost: "14494.12",
      shipping_cost_currency: "USD",
      driver_rent: "800.00",
      driver_rent_currency: "USD",
      remarks: "❄️ 40RF REEFER EXPORT: Escort Service (مامور بدرقه), Turkey Transit Trucking, 7 Days Plugging Charges, 8% TRF Included.",
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Route 3: Dogharon ➔ Mersin Reefer (40RF)", {
      description: "کانتینر ۴۰ فوت یخچالی با مامور بدرقه، کرایه ترانزیت، ۷ روز هزینه برق و مالیات TRF ($14,494.12)",
    })
  }

  const applyDougharounToMersinExportPreset = () => {
    const newRoutes = exportCorridorToBillOfLadingRoutes(dougharounToMersinLegs)
    setFormData((prev) => ({
      ...prev,
      routes: newRoutes,
      port_of_loading: "Dougharoun / Islam Qala, AF",
      port_of_discharge: "Mersin Port, Turkey",
      place_of_delivery: "Mersin Seaport Terminal, TR",
      shipping_cost: "3100.00",
      shipping_cost_currency: "USD",
      driver_rent: "1200.00",
      driver_rent_currency: "USD",
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Route 1: Dougharoun ➔ Mersin Export Corridor", {
      description: "۵ ایستگاه ترانزیت، اسناد T1، کرایه‌های ترانزیت و THC صادراتی اعمال شد ($3,100)",
    })
  }

  const applyNimrozToBandarAbbasExportPreset = () => {
    const newRoutes = exportCorridorToBillOfLadingRoutes(nimrozToBandarAbbasLegs)
    setFormData((prev) => ({
      ...prev,
      routes: newRoutes,
      port_of_loading: "Nimroz / Milak, AF",
      port_of_discharge: "Bandar Abbas Port, IR",
      place_of_delivery: "Bandar Abbas Terminal, IR",
      shipping_cost: "1550.00",
      shipping_cost_currency: "USD",
      driver_rent: "850.00",
      driver_rent_currency: "USD",
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Route 2: Nimroz ➔ Bandar Abbas Export Corridor", {
      description: "۳ ایستگاه ترانزیت، گمرک صادرات، کرایه لاری جنوب و THC بندرعباس اعمال شد ($1,550)",
    })
  }

  const applyNimrozFullReeferSwitchPreset = () => {
    const newRoutes = exportCorridorToBillOfLadingRoutes(nimrozFullWayReeferSwitchLegs)
    setFormData((prev) => ({
      ...prev,
      routes: newRoutes,
      cargo_route_note: "از نیمروز تمام مسیر کانتینر یخچالی (با سوییچ بی ال در بندرعباس - تمام مسیر یخچالی)",
      container_type: "40' REEFER HIGH CUBE",
      port_of_loading: "Nimroz / Milak, AF",
      port_of_discharge: "Bandar Abbas Port (Switch Hub), IR",
      place_of_delivery: "Jebel Ali / Dubai, AE",
      shipping_cost: "2850.00",
      shipping_cost_currency: "USD",
      driver_rent: "1350.00",
      driver_rent_currency: "USD",
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Route: Nimroz Full Way Reefer & Switch B/L Corridor", {
      description: "مسیر نیمروز به بندرعباس و دبی تمام مسیر یخچالی همراه با سوییچ بارنامه اعمال شد ($2,850)",
    })
  }

  const applyHeratIslamQalaDougharounPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        {
          id: crypto.randomUUID(),
          location: "Herat, AF",
          locationPersian: "هرات، افغانستان",
          stopOrder: 1,
          transportMode: "truck",
        },
        {
          id: crypto.randomUUID(),
          location: "Islam Qala, AF",
          locationPersian: "اسلام قلعه، افغانستان",
          stopOrder: 2,
          transportMode: "truck",
          customsSealRequired: true,
          customsSealNote: "📍 په ګمرک کې سیل غواړي / Customs Seal Required",
        },
        {
          id: crypto.randomUUID(),
          location: "Dougharoun, IR",
          locationPersian: "دوغارون، ایران",
          stopOrder: 3,
          transportMode: "truck",
        },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Truck Route Preset", {
      description: "هرات → اسلام قلعه → دوغارون مسیر اضافه شد",
    })
  }

  const applyKandaharNimrozBandarAbbasDubaiIndiaPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Kandahar, AF", locationPersian: "کندهار، افغانستان", stopOrder: 1, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Nimroz, AF", locationPersian: "نیمروز / میلک", stopOrder: 2, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Bandar Abbas, IR", locationPersian: "بندرعباس، ایران", stopOrder: 3, transportMode: "vessel" },
        { id: crypto.randomUUID(), location: "Dubai, AE", locationPersian: "دبی، امارات", stopOrder: 4, transportMode: "vessel" },
        { id: crypto.randomUUID(), location: "Nhava Sheva, IN", locationPersian: "نهاوا شوا، هند", stopOrder: 5, transportMode: "vessel" },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Afghanistan-India Sea Route", {
      description: "کندهار → نیمروز → بندرعباس → دبی → نهاوا شوا هند مسیر اضافه شد",
    })
  }

  const applyKandaharChamanKarachiDubaiPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Kandahar, AF", locationPersian: "کندهار، افغانستان", stopOrder: 1, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Chaman, PK", locationPersian: "چمن / کویته پاکستان", stopOrder: 2, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Karachi Port, PK", locationPersian: "بندر کراچی، پاکستان", stopOrder: 3, transportMode: "vessel" },
        { id: crypto.randomUUID(), location: "Dubai, AE", locationPersian: "دبی، امارات", stopOrder: 4, transportMode: "vessel" },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Pakistan Transit Route", {
      description: "کندهار → چمن → کراچی → دبی مسیر اضافه شد",
    })
  }

  const applyMazarHairatanTashkentPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Mazar-i-Sharif, AF", locationPersian: "مزار شریف، افغانستان", stopOrder: 1, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Hairatan Border, AF", locationPersian: "حیرتان، افغانستان", stopOrder: 2, transportMode: "train", customsSealRequired: true, customsSealNote: "📍 سیل ګمرک حیرتان" },
        { id: crypto.randomUUID(), location: "Termez, UZ", locationPersian: "ترمذ، ازبکستان", stopOrder: 3, transportMode: "train" },
        { id: crypto.randomUUID(), location: "Tashkent, UZ", locationPersian: "تاشکند، ازبکستان", stopOrder: 4, transportMode: "train" },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Uzbekistan Rail Route", {
      description: "مزار شریف → حیرتان → تاشکند مسیر اضافه شد",
    })
  }

  const applyNimrozChabaharIndiaPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Zaranj / Nimroz, AF", locationPersian: "زرنج / نیمروز، افغانستان", stopOrder: 1, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Milak Border, IR", locationPersian: "مرز میلک، ایران", stopOrder: 2, transportMode: "truck", customsSealRequired: true, customsSealNote: "📍 گمرک میلک" },
        { id: crypto.randomUUID(), location: "Chabahar Port, IR", locationPersian: "بندر چابهار، ایران", stopOrder: 3, transportMode: "vessel" },
        { id: crypto.randomUUID(), location: "Mundra Port, IN", locationPersian: "بندر موندرا، هند", stopOrder: 4, transportMode: "vessel" },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Chabahar Port Route", {
      description: "نیمروز → میلک → چابهار → موندرا هند مسیر اضافه شد",
    })
  }

  const applyKabulDubaiAirPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Kabul Airport (KBL), AF", locationPersian: "میدان هوایی کابل، افغانستان", stopOrder: 1, transportMode: "airplane" },
        { id: crypto.randomUUID(), location: "Dubai Airport (DXB), AE", locationPersian: "میدان هوایی دبی، امارات", stopOrder: 2, transportMode: "airplane" },
      ],
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Air Cargo Route", {
      description: "کابل → دبی مسیر هوایی اضافه شد",
    })
  }

  const applyJaskSuwaiqSoharCorridorPreset = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        { id: crypto.randomUUID(), location: "Nimroz / Milak, AF", locationPersian: "زرنج / نیمروز، افغانستان", stopOrder: 1, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Jask Port – IRAN", locationPersian: "جاسک – ایران", stopOrder: 2, transportMode: "truck" },
        { id: crypto.randomUUID(), location: "Suwaiq Port – Oman", locationPersian: "بندر السویق – عمان", stopOrder: 3, transportMode: "vessel" },
        { id: crypto.randomUUID(), location: "Sohar Port – Oman", locationPersian: "بندر صحار – عمان", stopOrder: 4, transportMode: "vessel" },
      ],
      port_of_loading: "Jask Port – IRAN",
      port_of_discharge: "Suwaiq Port – Oman",
      place_of_delivery: "Sohar Port – Oman",
      cargo_route_note: "مسیر ترانزیت: نیمروز / زرنج ⬅️ بندر جاسک (ایران) ⬅️ بندر السویق (عمان) ⬅️ بندر صحار (عمان)",
    }))
    setActiveRouteIndex(0)
    toast.success("Applied Oman-Iran Corridor Preset", {
      description: "نیمروز ➔ جاسک (ایران) ➔ بندر السویق (عمان) ➔ بندر صحار (عمان) مسیر اعمال شد",
    })
  }

  const openSaveRouteModal = () => {
    if (!formData.routes || formData.routes.length === 0) {
      toast.error("No Route Stops", { description: "لطفاً ابتدا حداقل یک توقفگاه در مسیر اضافه کنید" })
      return
    }
    const firstStop = formData.routes[0]?.location || formData.routes[0]?.locationPersian || "Origin"
    const lastStop = formData.routes[formData.routes.length - 1]?.location || formData.routes[formData.routes.length - 1]?.locationPersian || "Destination"
    const suggestedTitle = formData.routes.length === 1 ? firstStop : `${firstStop} ➡️ ${lastStop}`
    setNewPresetTitle(suggestedTitle)
    setIsSaveRouteModalOpen(true)
  }

  const handleSaveRoutePreset = () => {
    if (!newPresetTitle.trim()) {
      toast.error("Preset Name Required", { description: "لطفاً نامی برای پیش‌فرض مسیر وارد کنید" })
      return
    }

    const newPreset: SavedRoutePreset = {
      id: crypto.randomUUID(),
      title: newPresetTitle.trim(),
      icon: newPresetIcon || "🗺️",
      routes: JSON.parse(JSON.stringify(formData.routes)),
      savedAt: new Date().toISOString(),
    }

    const updated = [newPreset, ...savedRoutePresets]
    setSavedRoutePresets(updated)
    try {
      window.localStorage.setItem(SAVED_ROUTE_PRESETS_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error("Error saving route preset to localStorage:", e)
    }

    setIsSaveRouteModalOpen(false)
    toast.success("Route Saved to Quick Presets! ⭐", {
      description: `مسیر «${newPreset.title}» با موفقیت در پیش‌فرض‌های سریع ذخیره شد`,
    })
  }

  const handleDeleteRoutePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = savedRoutePresets.filter((p) => p.id !== presetId)
    setSavedRoutePresets(updated)
    try {
      window.localStorage.setItem(SAVED_ROUTE_PRESETS_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error("Error deleting route preset from localStorage:", e)
    }
    toast.success("Route Preset Deleted", {
      description: "پیش‌فرض مسیر با موفقیت حذف شد",
    })
  }

  const applyCustomRoutePreset = (preset: SavedRoutePreset) => {
    const clonedRoutes: RouteStop[] = preset.routes.map((r, i) => ({
      ...r,
      id: crypto.randomUUID(),
      stopOrder: i + 1,
    }))
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        routes: clonedRoutes,
      }))
      setActiveRouteIndex(0)
      setHasUnsavedChanges(true)
    })
    toast.success(`Applied Route: ${preset.title}`, {
      description: `مسیر «${preset.title}» (${clonedRoutes.length} توقفگاه) با موفقیت اعمال شد`,
    })
  }

  const moveRouteStop = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= formData.routes.length) return
    setFormData((prev) => {
      const newRoutes = [...prev.routes]
      const temp = newRoutes[index]
      newRoutes[index] = newRoutes[targetIndex]
      newRoutes[targetIndex] = temp
      return {
        ...prev,
        routes: newRoutes.map((r, i) => ({ ...r, stopOrder: i + 1 })),
      }
    })
    setActiveRouteIndex(targetIndex)
  }

  const duplicateRouteStop = (index: number) => {
    setFormData((prev) => {
      const currentStop = prev.routes[index]
      const newStop: RouteStop = {
        ...currentStop,
        id: crypto.randomUUID(),
        stopOrder: index + 2,
      }
      const newRoutes = [...prev.routes]
      newRoutes.splice(index + 1, 0, newStop)
      return {
        ...prev,
        routes: newRoutes.map((r, i) => ({ ...r, stopOrder: i + 1 })),
      }
    })
    setActiveRouteIndex(index + 1)
    toast.success("Stop Duplicated", { description: "توقفگاه کپی شد" })
  }

  const reverseRoutes = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [...prev.routes].reverse().map((r, i) => ({ ...r, stopOrder: i + 1 })),
    }))
    setActiveRouteIndex(0)
    toast.success("Route Pathway Reversed", { description: "مسیر ترانزیت برعکس شد" })
  }

  const syncRoutesWithBOLPorts = () => {
    if (formData.routes.length < 2) return
    const firstStop = formData.routes[0]
    const lastStop = formData.routes[formData.routes.length - 1]
    
    setFormData((prev) => ({
      ...prev,
      port_of_loading: firstStop.location || prev.port_of_loading,
      port_of_discharge: lastStop.location || prev.port_of_discharge,
      place_of_delivery: lastStop.location || prev.place_of_delivery,
    }))
    toast.success("Synchronized with B/L Ports", {
      description: `بارگیری: ${firstStop.location || "N/A"} | تخلیه: ${lastStop.location || "N/A"}`,
    })
  }

  const addRouteStop = () => {
    setFormData((prev) => ({
      ...prev,
      routes: [
        ...prev.routes,
        {
          id: crypto.randomUUID(),
          location: "",
          locationPersian: "",
          stopOrder: prev.routes.length + 1,
        },
      ],
    }))
    setActiveRouteIndex(formData.routes.length)
  }

  const removeRouteStop = (index: number) => {
    if (!formData.routes[index]) return
    const remainingStops = formData.routes.length - 1
    setFormData((prev) => ({
      ...prev,
      routes: prev.routes
        .filter((_, i) => i !== index)
        .map((route, routeIndex) => ({ ...route, stopOrder: routeIndex + 1 })),
    }))
    if (remainingStops === 0) {
      setActiveRouteIndex(null)
      setShowLocationDropdown(null)
    } else if (activeRouteIndex === index) {
      setActiveRouteIndex(Math.max(0, index - 1))
    }
  }

  const getTransportIcon = (mode?: string) => {
    const base = "inline-flex items-center justify-center rounded-md p-1.5"
    switch (mode) {
      case "truck":
        return (
          <span className={`${base} bg-blue-50 text-blue-600`}>
            <Truck className="h-6 w-6" />
          </span>
        )
      case "vessel":
        return (
          <span className={`${base} bg-cyan-50 text-cyan-600`}>
            <Ship className="h-6 w-6" />
          </span>
        )
      case "airplane":
        return (
          <span className={`${base} bg-sky-50 text-sky-600`}>
            <Plane className="h-6 w-6" />
          </span>
        )
      case "train":
        return (
          <span className={`${base} bg-orange-50 text-orange-600`}>
            <Train className="h-6 w-6" />
          </span>
        )
      case "road":
        return (
          <span className={`${base} bg-amber-50 text-amber-600`}>
            <Car className="h-6 w-6" />
          </span>
        )
      default:
        return (
          <span className={`${base} bg-gray-50 text-gray-500`}>
            <MapPin className="h-6 w-6" />
          </span>
        )
    }
  }

  const getTransportLabel = (mode?: string) => {
    switch (mode) {
      case "truck":
        return "Truck / تراک"
      case "vessel":
        return "Vessel / کشتی"
      case "airplane":
        return "Airplane / هواپیما"
      case "train":
        return "Train / قطار"
      case "road":
        return "Road / جاده"
      default:
        return "Select Mode / حالت انتخاب کنید"
    }
  }

  const getRouteStopLabel = (index: number, total: number) => {
    if (index === 0) return "Origin"
    if (index === total - 1) return "Destination"
    return `Stop ${index}`
  }

  const getRouteStopLabelPersian = (index: number, total: number) => {
    if (index === 0) return "مبدا"
    if (index === total - 1) return "مقصد"
    return "توقف"
  }

  const getTransportDetails = (mode?: string) => {
    const details: Record<string, { duration: string; capacity: string; cost: string; notes: string; durationPersian: string; capacityPersian: string; costPersian: string; notesPersian: string }> = {
      truck: {
        duration: "1-3 Days",
        capacity: "20-25 Tons",
        cost: "Low-Medium",
        notes: "Direct, flexible timing",
        durationPersian: "1-3 روز",
        capacityPersian: "20-25 تن",
        costPersian: "پایین-متوسط",
        notesPersian: "مستقیم، زمان بندی انعطاف پذیر"
      },
      vessel: {
        duration: "7-14 Days",
        capacity: "1000+ Tons",
        cost: "Low (Bulk)",
        notes: "Cost-effective for large shipments",
        durationPersian: "7-14 روز",
        capacityPersian: "1000+ تن",
        costPersian: "پایین (بزرگ)",
        notesPersian: "صرفه‌جویی برای حمل‌ونقل بزرگ"
      },
      airplane: {
        duration: "1-2 Days",
        capacity: "50-100 Tons",
        cost: "High",
        notes: "Fastest, premium rates",
        durationPersian: "1-2 روز",
        capacityPersian: "50-100 تن",
        costPersian: "بالا",
        notesPersian: "سریع‌ترین، نرخ بالا"
      },
      train: {
        duration: "3-7 Days",
        capacity: "500+ Tons",
        cost: "Medium",
        notes: "Reliable on established routes",
        durationPersian: "3-7 روز",
        capacityPersian: "500+ تن",
        costPersian: "متوسط",
        notesPersian: "قابل اعتماد در مسیرهای منظم"
      },
      road: {
        duration: "2-5 Days",
        capacity: "15-20 Tons",
        cost: "Medium",
        notes: "Direct delivery by road",
        durationPersian: "2-5 روز",
        capacityPersian: "15-20 تن",
        costPersian: "متوسط",
        notesPersian: "تحویل مستقیم از طریق جاده"
      },
    }
    return details[mode || ""] || { 
      duration: "-", 
      capacity: "-", 
      cost: "-", 
      notes: "-",
      durationPersian: "-",
      capacityPersian: "-",
      costPersian: "-",
      notesPersian: "-"
    }
  }

  // Predefined locations for quick selection & Country flag mapping
  const countryFlags: Record<string, string> = {
    "Afghanistan": "🇦🇫",
    "Iran": "🇮🇷",
    "Pakistan": "🇵🇰",
    "UAE": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
    "Qatar": "🇶🇦",
    "Bahrain": "🇧🇭",
    "Oman": "🇴🇲",
    "Kuwait": "🇰🇼",
    "Iraq": "🇮🇶",
    "Jordan": "🇯🇴",
    "Lebanon": "🇱🇧",
    "Turkey": "🇹🇷",
    "Turkmenistan": "🇹🇲",
    "Uzbekistan": "🇺🇿",
    "Tajikistan": "🇹🇯",
    "Kyrgyzstan": "🇰🇬",
    "Kazakhstan": "🇰🇿",
    "India": "🇮🇳",
    "Sri Lanka": "🇱🇰",
    "Bangladesh": "🇧🇩",
    "China": "🇨🇳",
    "Ivory Coast": "🇨🇮",
    "Nigeria": "🇳🇬",
    "Ghana": "🇬🇭",
    "Benin": "🇧🇯",
    "Togo": "🇹🇬",
    "Senegal": "🇸🇳",
    "Kenya": "🇰🇪",
    "Tanzania": "🇹🇿",
    "South Africa": "🇿🇦",
    "Egypt": "🇪🇬",
    "Morocco": "🇲🇦",
    "Sudan": "🇸🇩",
    "Djibouti": "🇩🇯",
    "Singapore": "🇸🇬",
    "Malaysia": "🇲🇾",
    "Vietnam": "🇻🇳",
    "Thailand": "🇹🇭",
    "Indonesia": "🇮🇩",
    "Philippines": "🇵🇭",
    "South Korea": "🇰🇷",
    "Japan": "🇯🇵",
    "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪",
    "Germany": "🇩🇪",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Greece": "🇬🇷",
    "United Kingdom": "🇬🇧",
    "France": "🇫🇷",
    "Poland": "🇵🇱",
    "USA": "🇺🇸",
    "Canada": "🇨🇦",
    "Brazil": "🇧🇷",
    "Panama": "🇵🇦",
  }

  const predefinedLocations: Array<{
    name: string
    persian: string
    country: string
    code: string
    locationType?: string
    state?: string
    district?: string
    portType?: string
    borderCountry?: string
    iataCode?: string
    unLocode?: string
    customsCode?: string
    isPort?: boolean
    portName?: string
    isBorder?: boolean
    cargoEnabled?: boolean
    containerEnabled?: boolean
    railConnected?: boolean
    roadConnected?: boolean
    airCargo?: boolean
    seaCargo?: boolean
    inlandWaterway?: boolean
    aliases?: string[] | string
  }> = [
    // 🇨🇮 Ivory Coast & West Africa (Explicit User Preset)
    { name: "Abidjan, Ivory Coast", persian: "ابیدجان، ساحل عاج", country: "Ivory Coast", code: "ABJ", isPort: true, portName: "Abidjan Port" },
    { name: "Abidjan Port, CI", persian: "بندر ابیدجان، ساحل عاج", country: "Ivory Coast", code: "ABJ-PORT", isPort: true, portName: "Abidjan Port" },
    { name: "Ivory Coast, West Africa", persian: "ساحل عاج، غرب آفریقا", country: "Ivory Coast", code: "CIV", isPort: false },
    { name: "San Pedro Port, CI", persian: "بندر سن پدرو، ساحل عاج", country: "Ivory Coast", code: "SPY", isPort: true, portName: "San Pedro Port" },
    { name: "Lagos Port (Apapa), NG", persian: "بندر لاگوس (آپاپا)، نیجریه", country: "Nigeria", code: "LOS", isPort: true, portName: "Lagos Port / Apapa" },
    { name: "Tin Can Island Port, NG", persian: "بندر تین کن، نیجریه", country: "Nigeria", code: "TIN", isPort: true, portName: "Tin Can Island" },
    { name: "Tema Port, GH", persian: "بندر تما، غنا", country: "Ghana", code: "TEM", isPort: true, portName: "Tema Port" },
    { name: "Takoradi Port, GH", persian: "بندر تاکورادی، غنا", country: "Ghana", code: "TKD", isPort: true, portName: "Takoradi Port" },
    { name: "Cotonou Port, BJ", persian: "بندر کوتونو، بنین", country: "Benin", code: "COO", isPort: true, portName: "Cotonou Port" },
    { name: "Lome Port, TG", persian: "بندر لومه، توگو", country: "Togo", code: "LOM", isPort: true, portName: "Lome Port" },
    { name: "Dakar Port, SN", persian: "بندر داکار، سنگال", country: "Senegal", code: "DKR", isPort: true, portName: "Dakar Port" },
    { name: "Mombasa Port, KE", persian: "بندر مومباسا، کنیا", country: "Kenya", code: "MBA", isPort: true, portName: "Mombasa Port" },
    { name: "Dar es Salaam Port, TZ", persian: "بندر دارالسلام، تانزانیا", country: "Tanzania", code: "DAR", isPort: true, portName: "Dar es Salaam Port" },
    { name: "Durban Port, ZA", persian: "بندر دوربان، آفریقای جنوبی", country: "South Africa", code: "DUR", isPort: true, portName: "Durban Port" },
    { name: "Cape Town Port, ZA", persian: "بندر کیپ‌تاون، آفریقای جنوبی", country: "South Africa", code: "CPT", isPort: true, portName: "Cape Town Port" },
    { name: "Port Said, EG", persian: "پورت سعید، مصر", country: "Egypt", code: "PSD", isPort: true, portName: "Port Said" },
    { name: "Alexandria Port, EG", persian: "بندر اسکندریه، مصر", country: "Egypt", code: "ALY", isPort: true, portName: "Alexandria Port" },
    { name: "Damietta Port, EG", persian: "بندر دمیاط، مصر", country: "Egypt", code: "DAM", isPort: true, portName: "Damietta Port" },
    { name: "Casablanca Port, MA", persian: "بندر کازابلانکا، مراکش", country: "Morocco", code: "CAS", isPort: true, portName: "Casablanca Port" },
    { name: "Tanger Med Port, MA", persian: "بندر طنجه مد، مراکش", country: "Morocco", code: "TNG", isPort: true, portName: "Tanger Med Port" },
    { name: "Djibouti Port, DJ", persian: "بندر جیبوتی", country: "Djibouti", code: "JIB", isPort: true, portName: "Djibouti Port" },
    { name: "Port Sudan, SD", persian: "پورت سودان", country: "Sudan", code: "PZU", isPort: true, portName: "Port Sudan" },

    // 🇦🇫 Afghanistan — Major Cities & Commercial Transport Hubs
    { name: "Kabul, AF", persian: "کابل، افغانستان", country: "Afghanistan", code: "KBL" },
    { name: "Kandahar, AF", persian: "کندهار، افغانستان", country: "Afghanistan", code: "KDH" },
    { name: "Herat, AF", persian: "هرات، افغانستان", country: "Afghanistan", code: "HRA" },
    { name: "Mazar-e Sharif, AF", persian: "مزارشریف، افغانستان", country: "Afghanistan", code: "MAZ" },
    { name: "Jalalabad, AF", persian: "جلال‌آباد، افغانستان", country: "Afghanistan", code: "JBD" },
    { name: "Kunduz, AF", persian: "کندوز، افغانستان", country: "Afghanistan", code: "KDZ" },
    { name: "Ghazni, AF", persian: "غزنی، افغانستان", country: "Afghanistan", code: "GHZ" },
    { name: "Baghlan, AF", persian: "بغلان، افغانستان", country: "Afghanistan", code: "BGH" },
    { name: "Nimroz, AF", persian: "نیمروز، افغانستان", country: "Afghanistan", code: "NMZ" },
    { name: "Logar, AF", persian: "لوگر، افغانستان", country: "Afghanistan", code: "LOG" },
    { name: "Paktia, AF", persian: "پکتیا، افغانستان", country: "Afghanistan", code: "PKT" },
    { name: "Nangarhar, AF", persian: "ننگرهار، افغانستان", country: "Afghanistan", code: "NGR" },
    { name: "Bamyan, AF", persian: "بامیان، افغانستان", country: "Afghanistan", code: "BAM" },
    { name: "Faizabad, AF", persian: "فیض‌آباد، افغانستان", country: "Afghanistan", code: "FAZ" },

    // 🇦🇫 Afghanistan — International Airports (Air Cargo)
    { name: "Kabul — Hamid Karzai Intl Airport (KBL / OAKB), AF", persian: "میدان هوایی بین‌المللی کابل (حامد کرزی)، افغانستان", country: "Afghanistan", code: "KBL", locationType: "AIRPORT_INTERNATIONAL", iataCode: "KBL", airCargo: true, cargoEnabled: true, aliases: "Kabul Airport, KBL, OAKB, میدان هوایی کابل" },
    { name: "Kandahar — Ahmad Shah Baba Intl Airport (KDH / OAKN), AF", persian: "میدان هوایی بین‌المللی کندهار (احمد شاه بابا)، افغانستان", country: "Afghanistan", code: "KDH", locationType: "AIRPORT_INTERNATIONAL", iataCode: "KDH", airCargo: true, cargoEnabled: true, aliases: "Kandahar Airport, KDH, OAKN, میدان هوایی کندهار" },
    { name: "Mazar-i-Sharif — Maulana Jalaluddin Balkhi Intl Airport (MZR / OAMS), AF", persian: "میدان هوایی بین‌المللی مزارشریف (مولانا جلال‌الدین بلخی)، افغانستان", country: "Afghanistan", code: "MZR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "MZR", airCargo: true, aliases: "Mazar Airport, MZR, OAMS, میدان هوایی مزارشریف" },
    { name: "Herat — Khwaja Abdullah Ansari Intl Airport (HEA / OAHR), AF", persian: "میدان هوایی بین‌المللی هرات (خواجه عبدالله انصاری)، افغانستان", country: "Afghanistan", code: "HEA", locationType: "AIRPORT_INTERNATIONAL", iataCode: "HEA", airCargo: true, aliases: "Herat Airport, HEA, OAHR, میدان هوایی هرات" },

    // 🇦🇫 Afghanistan — Official Border & Customs Crossings (Cross-Border Transit)
    { name: "Hairatan, AF", persian: "حیرتان، افغانستان", country: "Afghanistan", code: "HRT", isBorder: true, borderCountry: "Uzbekistan" },
    { name: "Sher Khan Bandar, AF", persian: "شیرخان بندر، افغانستان", country: "Afghanistan", code: "SKB", isBorder: true, borderCountry: "Tajikistan" },
    { name: "Aqina, AF", persian: "آقینه، افغانستان", country: "Afghanistan", code: "AQI", isBorder: true, borderCountry: "Turkmenistan" },
    { name: "Torghundi, AF", persian: "تورغندی، افغانستان", country: "Afghanistan", code: "TRG", isBorder: true, borderCountry: "Turkmenistan" },
    { name: "Islam Qala, AF", persian: "اسلام قلعه، افغانستان", country: "Afghanistan", code: "ISQ", isBorder: true, borderCountry: "Iran" },
    { name: "Abu Nasr Farahi, AF", persian: "ابونصر فراهی، افغانستان", country: "Afghanistan", code: "ANF", isBorder: true, borderCountry: "Iran" },
    { name: "Zaranj, AF", persian: "زرنج، افغانستان", country: "Afghanistan", code: "ZRJ", isBorder: true, borderCountry: "Iran" },
    { name: "Milak, AF", persian: "میلک، افغانستان", country: "Afghanistan", code: "MLK", isBorder: true, borderCountry: "Iran" },
    { name: "Mahiroud, AF", persian: "ماهیرود، افغانستان", country: "Afghanistan", code: "MAH", isBorder: true, borderCountry: "Iran" },
    { name: "Torkham, AF", persian: "تورخم، افغانستان", country: "Afghanistan", code: "THM", isBorder: true, borderCountry: "Pakistan" },
    { name: "Spin Boldak, AF", persian: "سپین بولدک، افغانستان", country: "Afghanistan", code: "SPB", isBorder: true, borderCountry: "Pakistan" },
    { name: "Ghulam Khan, AF", persian: "غلام خان، افغانستان", country: "Afghanistan", code: "GLK", isBorder: true, borderCountry: "Pakistan" },
    { name: "Dand Patan, AF", persian: "ډنډ پټان، افغانستان", country: "Afghanistan", code: "DPT", isBorder: true, borderCountry: "Pakistan" },
    { name: "Angur Ada, AF", persian: "انګور اډه، افغانستان", country: "Afghanistan", code: "AAD", isBorder: true, borderCountry: "Pakistan" },
    { name: "Kharlachi, AF", persian: "خرلاچي، افغانستان", country: "Afghanistan", code: "KHL", isBorder: true, borderCountry: "Pakistan" },
    { name: "Bahramcha, AF", persian: "بهرامچه، افغانستان", country: "Afghanistan", code: "BRC", isBorder: true, borderCountry: "Pakistan" },
    { name: "Taptan, AF", persian: "تپتن، افغانستان", country: "Afghanistan", code: "TAP", isBorder: true, borderCountry: "Pakistan" },
    { name: "Ishkashim, AF", persian: "اشکاشم، افغانستان", country: "Afghanistan", code: "ISH", isBorder: true, borderCountry: "Tajikistan" },
    { name: "Ai-Khanoum, AF", persian: "آیخانم، افغانستان", country: "Afghanistan", code: "AIK", isBorder: true, borderCountry: "Tajikistan" },
    
    // 🇮🇷 Iran — All Commercial Seaports & Terminals (Persian Gulf, Sea of Oman & Caspian Sea) + Major Cities
    { name: "Bandar Abbas (Shahid Rajaee Port), IR", persian: "بندرعباس (بندر شهید رجایی)، ایران", country: "Iran", code: "BND", isPort: true, portName: "Bandar Abbas (Shahid Rajaee)", locationType: "SEA_PORT_MAJOR", unLocode: "IRBND", customsCode: "IRBND1", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Bandar Abbas, Shahid Rajaee, IRBND, بندرعباس, شهید رجایی" },
    { name: "Bandar Abbas (Shahid Bahonar Port), IR", persian: "بندرعباس (بندر شهید باهنر)، ایران", country: "Iran", code: "BND-BHN", isPort: true, portName: "Shahid Bahonar Port (Bandar Abbas)", locationType: "SEA_PORT_MAJOR", unLocode: "IRBND", customsCode: "IRBND2", seaCargo: true, containerEnabled: true, aliases: "Shahid Bahonar, Bahonar Port, Bandar Abbas, شهید باهنر" },
    { name: "Chabahar Port (Shahid Beheshti), IR", persian: "بندر چابهار (شهید بهشتی)، ایران", country: "Iran", code: "CHA", isPort: true, portName: "Chabahar Port (Shahid Beheshti)", locationType: "SEA_PORT_MAJOR", unLocode: "IRZBR", customsCode: "IRZBR1", seaCargo: true, containerEnabled: true, aliases: "Chabahar, Shahid Beheshti, ZBR, چابهار" },
    { name: "Chabahar (Shahid Kalantari Port), IR", persian: "بندر چابهار (شهید کلانتری)، ایران", country: "Iran", code: "CHA-KLN", isPort: true, portName: "Shahid Kalantari Port (Chabahar)", locationType: "SEA_PORT_MAJOR", unLocode: "IRZBR", customsCode: "IRZBR2", seaCargo: true, aliases: "Shahid Kalantari, Chabahar, شهید کلانتری" },
    { name: "Bandar Imam Khomeini (BIK), IR", persian: "بندر امام خمینی، ایران", country: "Iran", code: "BIK", isPort: true, portName: "Bandar Imam Khomeini (BIK)", locationType: "SEA_PORT_MAJOR", unLocode: "IRBKM", customsCode: "IRBKM1", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "BIK, Bandar Khomeini, IRBKM, Sarbandar" },
    { name: "Bushehr Port, IR", persian: "بندر بوشهر، ایران", country: "Iran", code: "BSH", isPort: true, portName: "Bushehr Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRBUZ", customsCode: "IRBUZ1", seaCargo: true, containerEnabled: true, aliases: "Bushehr, IRBUZ, بندر بوشهر" },
    { name: "Khorramshahr Port, IR", persian: "بندر خرمشهر، ایران", country: "Iran", code: "KHR", isPort: true, portName: "Khorramshahr Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRKHO", customsCode: "IRKHO1", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Khorramshahr, IRKHO, Arvand, خرمشهر" },
    { name: "Abadan Port, IR", persian: "بندر آبادان، ایران", country: "Iran", code: "ABD-PORT", isPort: true, portName: "Abadan Port", locationType: "SEA_PORT", unLocode: "IRABD", seaCargo: true, aliases: "Abadan, IRABD, بندر آبادان" },
    { name: "Bandar Lengeh Port, IR", persian: "بندر لنگه، ایران", country: "Iran", code: "BLG", isPort: true, portName: "Bandar Lengeh", locationType: "SEA_PORT", unLocode: "IRBDH", customsCode: "IRBDH1", seaCargo: true, aliases: "Bandar Lenguh, Lengeh, IRBDH, بندر لنگه" },
    { name: "Qeshm Island Port (Bahman / Kaveh), IR", persian: "بندر قشم (اسکله بهمن / کاوه)، ایران", country: "Iran", code: "GSM", isPort: true, portName: "Qeshm Port", locationType: "SEA_PORT", unLocode: "IRGSM", customsCode: "IRGSM1", seaCargo: true, aliases: "Qeshm, Bahman Port, Kaveh Port, Shahid Zakeri, قشم" },
    { name: "Kish Island Port, IR", persian: "بندر کیش، ایران", country: "Iran", code: "KIH-PORT", isPort: true, portName: "Kish Commercial Port", locationType: "SEA_PORT", unLocode: "IRKIH", customsCode: "IRKIH1", seaCargo: true, aliases: "Kish, IRKIH, بندر کیش" },
    { name: "Jask Port – IRAN", persian: "جاسک – ایران", country: "Iran", code: "JSK", isPort: true, portName: "Jask Port (Bandar Jask)", locationType: "SEA_PORT_MAJOR", unLocode: "IRJSK", customsCode: "IRJSK1", seaCargo: true, containerEnabled: true, cargoEnabled: true, roadConnected: true, state: "Hormozgan", aliases: "Jask Port – IRAN, Jask Port - Iran, Jask Port, Bandar Jask Port, Bandar Jask, Port of Jask, Jask, IRJSK, JSK, جاسک – ایران, جاسک - ایران, بندر جاسک, بندر جاسک، ایران, جاسک, پایانه تجاری و نفتی جاسک, Jask Port - IRAN, Jask Port, IR" },
    { name: "Jask Port - Iran", persian: "جاسک - ایران", country: "Iran", code: "JSK", isPort: true, portName: "Jask Port (Bandar Jask)", locationType: "SEA_PORT_MAJOR", unLocode: "IRJSK", customsCode: "IRJSK1", seaCargo: true, containerEnabled: true, cargoEnabled: true, roadConnected: true, state: "Hormozgan", aliases: "Jask Port - Iran, Jask Port – IRAN, Jask Port, Bandar Jask Port, Bandar Jask, Port of Jask, Jask, IRJSK, JSK, جاسک - ایران, جاسک – ایران, بندر جاسک, بندر جاسک، ایران, جاسک, پایانه تجاری و نفتی جاسک, Jask Port - IRAN, Jask Port, IR" },
    { name: "Bandar Jask Port, IR", persian: "بندر جاسک، ایران", country: "Iran", code: "JSK", isPort: true, portName: "Bandar Jask Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRJSK", customsCode: "IRJSK1", seaCargo: true, containerEnabled: true, cargoEnabled: true, roadConnected: true, state: "Hormozgan", aliases: "Bandar Jask Port, Jask Port, Jask Port - Iran, Jask Port, IR, Jask, IRJSK, JSK, بندر جاسک، ایران, بندر جاسک, جاسک - ایران, جاسک" },
    { name: "Bandar Mahshahr Port (Imam Khomeini Petrochemical), IR", persian: "بندر ماهشهر، ایران", country: "Iran", code: "MRX", isPort: true, portName: "Bandar Mahshahr Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRMRX", seaCargo: true, aliases: "Mahshahr, IRMRX, ماهشهر" },
    { name: "Assaluyeh Port (Pars Special Energy Zone), IR", persian: "بندر عسلویه (منطقه ویژه پارس)، ایران", country: "Iran", code: "PGU", isPort: true, portName: "Assaluyeh / Pars Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRPGU", customsCode: "IRPGU1", seaCargo: true, aliases: "Assaluyeh, Asaluyeh, Tombak, Pars Port, عسلویه" },
    { name: "Bandar Kangan Port, IR", persian: "بندر کنگان، ایران", country: "Iran", code: "KNG", isPort: true, portName: "Kangan Port", locationType: "SEA_PORT", unLocode: "IRKNG", seaCargo: true, aliases: "Kangan, کنگان" },
    { name: "Bandar Genaveh Port, IR", persian: "بندر گناوه، ایران", country: "Iran", code: "GNV", isPort: true, portName: "Bandar Genaveh", locationType: "SEA_PORT", unLocode: "IRGNV", seaCargo: true, aliases: "Genaveh, Ganaveh, گناوه" },
    { name: "Bandar Deylam Port, IR", persian: "بندر دیلم، ایران", country: "Iran", code: "DYL", isPort: true, portName: "Bandar Deylam", locationType: "SEA_PORT", seaCargo: true, aliases: "Deylam, بندر دیلم" },
    { name: "Bandar Dayyer Port, IR", persian: "بندر دیر، ایران", country: "Iran", code: "DYR", isPort: true, portName: "Bandar Dayyer", locationType: "SEA_PORT", seaCargo: true, aliases: "Dayyer, بندر دیر" },
    { name: "Bandar Charak Port, IR", persian: "بندر چارک، ایران", country: "Iran", code: "CHK", isPort: true, portName: "Bandar Charak", locationType: "SEA_PORT", seaCargo: true, aliases: "Charak, چارک" },
    { name: "Bandar Khamir / Pohl Port, IR", persian: "بندر خمیر / بندر پل، ایران", country: "Iran", code: "KHM", isPort: true, portName: "Bandar Khamir / Pohl", locationType: "SEA_PORT", seaCargo: true, aliases: "Khamir, Pohl, Pol, بندر خمیر, بندر پل" },
    { name: "Bandar Kong Port, IR", persian: "بندر کنگ، ایران", country: "Iran", code: "KOG", isPort: true, portName: "Bandar Kong", locationType: "SEA_PORT", seaCargo: true, aliases: "Kong, بندر کنگ" },
    { name: "Bandar Tiab Port, IR", persian: "بندر تیاب (هرمزگان)، ایران", country: "Iran", code: "TYB", isPort: true, portName: "Bandar Tiab", locationType: "SEA_PORT", seaCargo: true, aliases: "Tiab, بندر تیاب" },
    { name: "Bandar Sirik Port, IR", persian: "بندر سیریک (هرمزگان)، ایران", country: "Iran", code: "SRK", isPort: true, portName: "Bandar Sirik", locationType: "SEA_PORT", seaCargo: true, aliases: "Sirik, بندر سیریک" },
    { name: "Konarak Port, IR", persian: "بندر کنارک (سیستان و بلوچستان)، ایران", country: "Iran", code: "KNR", isPort: true, portName: "Konarak Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Konarak, کنارک" },
    { name: "Beris / Pasabandar Port, IR", persian: "بندر بریس / پسابندر، ایران", country: "Iran", code: "PSB", isPort: true, portName: "Beris / Pasabandar Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Beris, Pasabandar, بریس, پسابندر" },
    { name: "Parsian Commercial Port, IR", persian: "بندر پارسیان، ایران", country: "Iran", code: "PRS-IR", isPort: true, portName: "Parsian Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Parsian, پارسیان" },
    { name: "Kharg Island Oil & Cargo Terminal, IR", persian: "پایانه دریایی جزیره خارگ، ایران", country: "Iran", code: "KHG", isPort: true, portName: "Kharg Island Terminal", locationType: "SEA_PORT", unLocode: "IRKHK", seaCargo: true, aliases: "Kharg, Khark, IRKHK, خارگ" },
    { name: "Lavan Island Port, IR", persian: "بندر جزیره لاوان، ایران", country: "Iran", code: "LVP", isPort: true, portName: "Lavan Island Port", locationType: "SEA_PORT", unLocode: "IRLVP", seaCargo: true, aliases: "Lavan, لاوان" },
    { name: "Sirri Island Port, IR", persian: "بندر جزیره سیری، ایران", country: "Iran", code: "SXI", isPort: true, portName: "Sirri Island Port", locationType: "SEA_PORT", unLocode: "IRSXI", seaCargo: true, aliases: "Sirri, سیری" },
    { name: "Hormuz Island Port, IR", persian: "بندر جزیره هرمز، ایران", country: "Iran", code: "HRM", isPort: true, portName: "Hormuz Island Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Hormuz, هرمز" },
    { name: "Hendijan Port (Sajafi), IR", persian: "بندر هندیجان (سجافی)، ایران", country: "Iran", code: "HND", isPort: true, portName: "Hendijan Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Hendijan, Sajafi, هندیجان" },
    { name: "Arvandkenar Port, IR", persian: "بندر اروندکنار، ایران", country: "Iran", code: "ARV", isPort: true, portName: "Arvandkenar Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Arvandkenar, اروندکنار" },
    // Caspian Sea Ports (Northern Iran)
    { name: "Bandar Anzali Port, IR", persian: "بندر انزلی (دریای خزر)، ایران", country: "Iran", code: "ANZ", isPort: true, portName: "Bandar Anzali", locationType: "SEA_PORT_MAJOR", unLocode: "IRBAZ", seaCargo: true, containerEnabled: true, aliases: "Anzali, IRBAZ, بندر انزلی" },
    { name: "Caspian Port (Anzali Free Zone), IR", persian: "مجتمع بندری کاسپین (منطقه آزاد انزلی)، ایران", country: "Iran", code: "CASP-IR", isPort: true, portName: "Caspian Port (Anzali FZ)", locationType: "SEA_PORT_MAJOR", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Caspian Port, Anzali Free Zone, بندر کاسپین" },
    { name: "Nowshahr Port, IR", persian: "بندر نوشهر (مازندران)، ایران", country: "Iran", code: "NSH", isPort: true, portName: "Nowshahr Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRNSH", seaCargo: true, containerEnabled: true, aliases: "Nowshahr, Noshahr, IRNSH, نوشهر" },
    { name: "Amirabad Port (Behshahr SEZ), IR", persian: "بندر امیرآباد (بهشهر / مازندران)، ایران", country: "Iran", code: "AMR", isPort: true, portName: "Amirabad Port", locationType: "SEA_PORT_MAJOR", unLocode: "IRAMR", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Amirabad, Behshahr, IRAMR, امیرآباد" },
    { name: "Fereydunkenar Port, IR", persian: "بندر فریدونکنار، ایران", country: "Iran", code: "FRD", isPort: true, portName: "Fereydunkenar Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Fereydunkenar, فریدونکنار" },
    { name: "Astara Port (Gilan), IR", persian: "بندر آستارا، ایران", country: "Iran", code: "AST-PORT", isPort: true, portName: "Astara Port", locationType: "SEA_PORT", unLocode: "IRAST", borderCountry: "Azerbaijan", isBorder: true, seaCargo: true, railConnected: true, aliases: "Astara, IRAST, بندر آستارا" },
    { name: "Bandar Torkaman Port, IR", persian: "بندر ترکمن (گلستان)، ایران", country: "Iran", code: "TRK-IR", isPort: true, portName: "Bandar Torkaman", locationType: "SEA_PORT", seaCargo: true, aliases: "Torkaman, بندر ترکمن" },
    { name: "Bandar Gaz Port, IR", persian: "بندر گز (گلستان)، ایران", country: "Iran", code: "BGA", isPort: true, portName: "Bandar Gaz", locationType: "SEA_PORT", seaCargo: true, aliases: "Bandar Gaz, بندر گز" },
    { name: "Khaje Nafas Port, IR", persian: "بندر خواجه نفس (گلستان)، ایران", country: "Iran", code: "KHN", isPort: true, portName: "Khaje Nafas Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Khaje Nafas, خواجه نفس" },
    { name: "Dougharoun, IR", persian: "دوغارون، ایران", country: "Iran", code: "DGH", isBorder: true, borderCountry: "Afghanistan" },
    { name: "Tehran, IR", persian: "تهران، ایران", country: "Iran", code: "TEH" },
    { name: "Mashhad, IR", persian: "مشهد، ایران", country: "Iran", code: "MSH" },
    { name: "Zahedan, IR", persian: "زاهدان، ایران", country: "Iran", code: "ZAH" },
    { name: "Kerman, IR", persian: "کرمان، ایران", country: "Iran", code: "KRM" },
    { name: "Isfahan, IR", persian: "اصفهان، ایران", country: "Iran", code: "ISF" },
    { name: "Tabriz, IR", persian: "تبریز، ایران", country: "Iran", code: "TBZ" },
    { name: "Rasht, IR", persian: "رشت، ایران", country: "Iran", code: "RSH" },
    { name: "Qom, IR", persian: "قم، ایران", country: "Iran", code: "QOM" },
    { name: "Ahvaz, IR", persian: "اهواز، ایران", country: "Iran", code: "AHZ" },
    { name: "Shiraz, IR", persian: "شیراز، ایران", country: "Iran", code: "SHZ" },
    { name: "Abadan, IR", persian: "آبادان، ایران", country: "Iran", code: "ABD" },
    { name: "Birjand, IR", persian: "بیرجند، ایران", country: "Iran", code: "BRJ" },

    // 🇮🇷 Iran — International Airports (Air Cargo)
    { name: "Tehran — Imam Khomeini Intl Airport (IKA / OIIE), IR", persian: "فرودگاه بین‌المللی امام خمینی تهران (هاب بار هوایی)، ایران", country: "Iran", code: "IKA", locationType: "AIRPORT_INTERNATIONAL", iataCode: "IKA", airCargo: true, cargoEnabled: true, aliases: "Tehran Airport, IKA, OIIE, فرودگاه امام خمینی" },
    { name: "Tehran — Mehrabad Intl Airport (THR / OIII), IR", persian: "فرودگاه بین‌المللی مهرآباد تهران، ایران", country: "Iran", code: "THR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "THR", airCargo: true, aliases: "Mehrabad Airport, THR, OIII, فرودگاه مهرآباد" },
    { name: "Mashhad — Shahid Hasheminejad Intl Airport (MHD / OIMM), IR", persian: "فرودگاه بین‌المللی مشهد (شهید هاشمی‌نژاد)، ایران", country: "Iran", code: "MHD", locationType: "AIRPORT_INTERNATIONAL", iataCode: "MHD", airCargo: true, aliases: "Mashhad Airport, MHD, فرودگاه مشهد" },
    { name: "Shiraz — Shahid Dastghaib Intl Airport (SYZ / OISS), IR", persian: "فرودگاه بین‌المللی شیراز، ایران", country: "Iran", code: "SYZ", locationType: "AIRPORT_INTERNATIONAL", iataCode: "SYZ", airCargo: true, aliases: "Shiraz Airport, SYZ, فرودگاه شیراز" },
    { name: "Isfahan — Shahid Beheshti Intl Airport (IFN / OIFM), IR", persian: "فرودگاه بین‌المللی اصفهان، ایران", country: "Iran", code: "IFN", locationType: "AIRPORT_INTERNATIONAL", iataCode: "IFN", airCargo: true, aliases: "Isfahan Airport, IFN" },
    { name: "Bandar Abbas International Airport (BND / OIKB), IR", persian: "فرودگاه بین‌المللی بندرعباس، ایران", country: "Iran", code: "BND-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "BND", airCargo: true, aliases: "Bandar Abbas Airport, BND" },
    
    // Pakistan - Major Cities & Ports
    { name: "Karachi, PK", persian: "کراچی، پاکستان", country: "Pakistan", code: "KRC", isPort: true, portName: "Karachi Port (KPT)" },
    { name: "Port Qasim, PK", persian: "بندر قاسم، پاکستان", country: "Pakistan", code: "PQS", isPort: true, portName: "Port Muhammad Bin Qasim" },
    { name: "Gwadar, PK", persian: "گوادر، پاکستان", country: "Pakistan", code: "GWD", isPort: true, portName: "Gwadar Deep Sea Port" },
    { name: "Peshawar, PK", persian: "پشاور، پاکستان", country: "Pakistan", code: "PSH" },
    { name: "Islamabad, PK", persian: "اسلام‌آباد، پاکستان", country: "Pakistan", code: "ISB" },
    { name: "Lahore, PK", persian: "لاهور، پاکستان", country: "Pakistan", code: "LHR" },
    { name: "Quetta, PK", persian: "کویتہ، پاکستان", country: "Pakistan", code: "QTA" },
    { name: "Torkham, PK", persian: "تورخم، پاکستان", country: "Pakistan", code: "TRK" },
    { name: "Chaman, PK", persian: "چمن، پاکستان", country: "Pakistan", code: "CHM" },
    { name: "Multan, PK", persian: "ملتان، پاکستان", country: "Pakistan", code: "MLT" },
    { name: "Faisalabad, PK", persian: "فیصل‌آباد، پاکستان", country: "Pakistan", code: "FSB" },

    // 🇵🇰 Pakistan — International Airports (Air Cargo)
    { name: "Karachi — Jinnah Intl Airport (KHI / OPKC), PK", persian: "میدان هوایی بین‌المللی جناح کراچی، پاکستان", country: "Pakistan", code: "KHI", locationType: "AIRPORT_INTERNATIONAL", iataCode: "KHI", airCargo: true, cargoEnabled: true, aliases: "Karachi Airport, KHI, OPKC" },
    { name: "Islamabad International Airport (ISB / OPIS), PK", persian: "میدان هوایی بین‌المللی اسلام‌آباد، پاکستان", country: "Pakistan", code: "ISB-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "ISB", airCargo: true, cargoEnabled: true, aliases: "Islamabad Airport, ISB" },
    { name: "Lahore — Allama Iqbal Intl Airport (LHE / OPLA), PK", persian: "میدان هوایی بین‌المللی علامه اقبال لاهور، پاکستان", country: "Pakistan", code: "LHE", locationType: "AIRPORT_INTERNATIONAL", iataCode: "LHE", airCargo: true, cargoEnabled: true, aliases: "Lahore Airport, LHE" },
    { name: "Peshawar — Bacha Khan Intl Airport (PEW / OPPS), PK", persian: "میدان هوایی بین‌المللی باچا خان پشاور، پاکستان", country: "Pakistan", code: "PEW", locationType: "AIRPORT_INTERNATIONAL", iataCode: "PEW", airCargo: true, aliases: "Peshawar Airport, PEW" },
    { name: "Quetta International Airport (UET / OPQT), PK", persian: "میدان هوایی بین‌المللی کویته، پاکستان", country: "Pakistan", code: "UET", locationType: "AIRPORT_INTERNATIONAL", iataCode: "UET", airCargo: true, aliases: "Quetta Airport, UET" },
    { name: "Sialkot International Airport (SKT / OPST), PK", persian: "میدان هوایی بین‌المللی سیالکوت (هاب صادرات)، پاکستان", country: "Pakistan", code: "SKT", locationType: "AIRPORT_INTERNATIONAL", iataCode: "SKT", airCargo: true, cargoEnabled: true, aliases: "Sialkot Airport, SKT" },
    
    // 🇦🇪 Dubai All Ports & UAE Seaports (Complete Marine Terminals)
    { name: "Jebel Ali Port (Mina Jebel Ali), Dubai, AE", persian: "بندر جبل علی، دبی", country: "UAE", code: "JEA", isPort: true, portName: "Jebel Ali Port (Mina Jebel Ali)" },
    { name: "Port Rashid (Mina Rashid), Dubai, AE", persian: "بندر راشد، دبی", country: "UAE", code: "DXB-PRD", isPort: true, portName: "Port Rashid (Mina Rashid)" },
    { name: "Al Hamriya Port (Mina Al Hamriya), Dubai, AE", persian: "بندر حمرية، دبی", country: "UAE", code: "HAM-DXB", isPort: true, portName: "Al Hamriya Port (Dubai)" },
    { name: "Dubai Creek (Deira Wharfage / Mina Al Khor), AE", persian: "اسکله خور دبی / دیره", country: "UAE", code: "DXB-CRK", isPort: true, portName: "Dubai Creek (Deira Wharfage)" },
    { name: "Dubai Maritime City (DMC), AE", persian: "شهرک دریایی دبی", country: "UAE", code: "DMC", isPort: true, portName: "Dubai Maritime City (DMC)" },
    { name: "Dubai Drydocks World, AE", persian: "حوضچه خشک دبی", country: "UAE", code: "DDW", isPort: true, portName: "Dubai Drydocks World" },
    { name: "Jebel Ali Free Zone (JAFZA), Dubai, AE", persian: "منطقه آزاد جبل علی، دبی", country: "UAE", code: "JAFZA", isPort: true, portName: "Jebel Ali Free Zone (JAFZA)" },
    { name: "Dubai Logistics City (DLC / DWC), AE", persian: "شهرک لجستیک دبی (DWC)", country: "UAE", code: "DWC", isPort: true, portName: "Dubai Logistics City (DWC)" },
    { name: "Dubai, AE", persian: "دبی، امارات متحده عربی", country: "UAE", code: "DXB", isPort: false },
    { name: "Port of Fujairah, AE", persian: "بندر فجیرة، امارات", country: "UAE", code: "FJR", isPort: true, portName: "Port of Fujairah" },
    { name: "Khalifa Port (Mina Khalifa), Abu Dhabi, AE", persian: "بندر خلیفه، ابوظبی", country: "UAE", code: "KHL", isPort: true, portName: "Khalifa Port (Abu Dhabi)" },
    { name: "Mina Zayed (Port Zayed), Abu Dhabi, AE", persian: "بندر زاید، ابوظبی", country: "UAE", code: "MZY", isPort: true, portName: "Mina Zayed (Port Zayed)" },
    { name: "Musaffah Port, Abu Dhabi, AE", persian: "بندر مصفح، ابوظبی", country: "UAE", code: "MSF", isPort: true, portName: "Musaffah Port (Abu Dhabi)" },
    { name: "Khorfakkan Port, Sharjah, AE", persian: "بندر خورفکان، شارجه", country: "UAE", code: "KLF", isPort: true, portName: "Khorfakkan Port (Sharjah)" },
    { name: "Port Khalid, Sharjah, AE", persian: "بندر خالد، شارجه", country: "UAE", code: "PKH", isPort: true, portName: "Port Khalid (Sharjah)" },
    { name: "Hamriyah Free Zone Port, Sharjah, AE", persian: "بندر حمرية شارجه", country: "UAE", code: "HFZ", isPort: true, portName: "Hamriyah Port (Sharjah)" },
    { name: "Ajman Port, AE", persian: "بندر عجمان، امارات", country: "UAE", code: "AJM", isPort: true, portName: "Port of Ajman" },
    { name: "Saqr Port (Ras Al Khaimah), AE", persian: "بندر صقر، رأس الخیمه", country: "UAE", code: "SQR", isPort: true, portName: "Saqr Port (Ras Al Khaimah)" },
    { name: "Ras Al Khaimah Port (RAK Port), AE", persian: "بندر رأس الخیمه، امارات", country: "UAE", code: "RAK", isPort: true, portName: "Port of Ras Al Khaimah" },
    { name: "Umm Al Quwain Port, AE", persian: "بندر ام‌القیوین، امارات", country: "UAE", code: "UAQ", isPort: true, portName: "Port of Umm Al Quwain" },
    { name: "Abu Dhabi, AE", persian: "ابوظبی، امارات", country: "UAE", code: "AUH" },
    { name: "Sharjah, AE", persian: "شارجہ، امارات", country: "UAE", code: "SHJ" },

    // 🇦🇪 UAE — International Airports (Air Cargo)
    { name: "Dubai International Airport (DXB / OMDB), AE", persian: "میدان هوایی بین‌المللی دبی (هاب بار هوایی امارات)", country: "UAE", code: "DXB-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "DXB", unLocode: "AEDXB", airCargo: true, cargoEnabled: true, aliases: "Dubai Airport, DXB, OMDB, میدان هوایی دبی, Dubai Cargo" },
    { name: "Dubai — Al Maktoum Intl Airport (DWC / OMDW / Dubai World Central), AE", persian: "میدان هوایی آل مکتوم دبی (دبی ورلد سنترال / DWC)", country: "UAE", code: "DWC-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "DWC", unLocode: "AEDWC", airCargo: true, cargoEnabled: true, aliases: "DWC Airport, Dubai World Central, Al Maktoum, OMDW, میدان هوایی آل مکتوم" },
    { name: "Sharjah International Airport (SHJ / OMSJ), AE", persian: "میدان هوایی بین‌المللی شارجه (هاب بار هوایی منطقه‌ای)", country: "UAE", code: "SHJ-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "SHJ", unLocode: "AESHJ", airCargo: true, cargoEnabled: true, aliases: "Sharjah Airport, SHJ, OMSJ, میدان هوایی شارجه" },
    { name: "Abu Dhabi — Zayed Intl Airport (AUH / OMAA), AE", persian: "میدان هوایی بین‌المللی زاید ابوظبی", country: "UAE", code: "AUH-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "AUH", unLocode: "AEAUH", airCargo: true, cargoEnabled: true, aliases: "Abu Dhabi Airport, AUH, OMAA, میدان هوایی ابوظبی" },
    { name: "Ras Al Khaimah International Airport (RKT / OMRK), AE", persian: "میدان هوایی بین‌المللی رأس الخیمه، امارات", country: "UAE", code: "RKT", locationType: "AIRPORT_INTERNATIONAL", iataCode: "RKT", unLocode: "AERKT", airCargo: true, aliases: "RAK Airport, RKT" },
    { name: "Fujairah International Airport (FJR / OMFJ), AE", persian: "میدان هوایی بین‌المللی فجیره، امارات", country: "UAE", code: "FJR-AIR", locationType: "AIRPORT_INTERNATIONAL", iataCode: "FJR", unLocode: "AEFJR", airCargo: true, aliases: "Fujairah Airport, FJR" },

    { name: "Hamad Port (Doha), QA", persian: "بندر حمد، قطر", country: "Qatar", code: "DOH", isPort: true, portName: "Hamad Port" },
    { name: "Dammam (King Abdulaziz Port), SA", persian: "بندر دمام، عربستان", country: "Saudi Arabia", code: "DMM", isPort: true, portName: "King Abdulaziz Port (Dammam)" },
    { name: "Jeddah Islamic Port, SA", persian: "بندر اسلامی جده، عربستان", country: "Saudi Arabia", code: "JED", isPort: true, portName: "Jeddah Islamic Port" },
    { name: "King Abdullah Port, SA", persian: "بندر ملک عبدالله، عربستان", country: "Saudi Arabia", code: "KAP", isPort: true, portName: "King Abdullah Port" },
    { name: "Bahrain Port (Khalifa Bin Salman), BH", persian: "بندر خلیفه بن سلمان، بحرین", country: "Bahrain", code: "BAH", isPort: true, portName: "Khalifa Bin Salman Port" },
    // 🇴🇲 Oman — All Commercial Seaports, Terminals & Dry Ports
    { name: "Sohar Port & Freezone, OM", persian: "بندر صحار، عمان", country: "Oman", code: "SOH", isPort: true, portName: "Sohar Port", locationType: "SEA_PORT_MAJOR", unLocode: "OMSOH", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Sohar, Sohar Port, OMSOH, بندر صحار, بندر صحار – عمان, Sohar Port – Oman" },
    { name: "Sohar Port – Oman", persian: "بندر صحار – عمان", country: "Oman", code: "SOH", isPort: true, portName: "Sohar Port", locationType: "SEA_PORT_MAJOR", unLocode: "OMSOH", seaCargo: true, containerEnabled: true, railConnected: true, aliases: "Sohar, Sohar Port, Sohar Port – Oman, Sohar Port - Oman, Sohar Port & Freezone, OMSOH, بندر صحار, بندر صحار – عمان, بندر صحار - عمان, صحار" },
    { name: "Port of Salalah, OM", persian: "بندر صلاله، عمان", country: "Oman", code: "SLL", isPort: true, portName: "Port of Salalah", locationType: "SEA_PORT_MAJOR", unLocode: "OMSLL", seaCargo: true, containerEnabled: true, aliases: "Salalah, Salalah Port, OMSLL, بندر صلاله" },
    { name: "Port Sultan Qaboos (Muscat / Muttrah), OM", persian: "بندر سلطان قابوس (مسقط)، عمان", country: "Oman", code: "MCT", isPort: true, portName: "Port Sultan Qaboos", locationType: "SEA_PORT_MAJOR", unLocode: "OMMCT", seaCargo: true, containerEnabled: true, aliases: "Muscat Port, Sultan Qaboos, Muttrah, OMMCT, بندر مسقط, بندر سلطان قابوس" },
    { name: "Port of Duqm (SEZAD), OM", persian: "بندر دقم (منطقه ویژه اقتصادی)، عمان", country: "Oman", code: "DQM", isPort: true, portName: "Port of Duqm", locationType: "SEA_PORT_MAJOR", unLocode: "OMDQM", seaCargo: true, containerEnabled: true, aliases: "Duqm, Duqm Port, OMDQM, SEZAD, بندر دقم" },
    { name: "Port of Suwaiq (Al Suwaiq), OM", persian: "بندر السويق، عمان", country: "Oman", code: "SWQ", isPort: true, portName: "Port of Suwaiq", locationType: "SEA_PORT_MAJOR", unLocode: "OMSWQ", seaCargo: true, containerEnabled: true, aliases: "Suwaiq, Suwaiq Port, Suwaiq Port - Oman, Suwaiq Port – Oman, Al Suwaiq, OMSWQ, بندر السويق, بندر السویق – عمان" },
    { name: "Suwaiq Port – Oman", persian: "بندر السویق – عمان", country: "Oman", code: "SWQ", isPort: true, portName: "Suwaiq Port", locationType: "SEA_PORT_MAJOR", unLocode: "OMSWQ", seaCargo: true, containerEnabled: true, aliases: "Suwaiq, Suwaiq Port, Suwaiq Port – Oman, Suwaiq Port - Oman, Al Suwaiq, Port of Suwaiq, OMSWQ, بندر السویق, بندر السويق, بندر السویق – عمان, بندر السویق - عمان, السویق" },
    { name: "Port of Khasab (Musandam), OM", persian: "بندر خصب (مسندم)، عمان", country: "Oman", code: "KHS", isPort: true, portName: "Port of Khasab", locationType: "SEA_PORT", unLocode: "OMKHS", seaCargo: true, containerEnabled: true, aliases: "Khasab, Khasab Port, OMKHS, بندر خصب" },
    { name: "Port of Shinas, OM", persian: "بندر شناص، عمان", country: "Oman", code: "SHN", isPort: true, portName: "Port of Shinas", locationType: "SEA_PORT", unLocode: "OMSHN", seaCargo: true, containerEnabled: true, aliases: "Shinas, Shinas Port, OMSHN, بندر شناص" },
    { name: "Port of Sur, OM", persian: "بندر صور، عمان", country: "Oman", code: "SUH", isPort: true, portName: "Port of Sur", locationType: "SEA_PORT", unLocode: "OMSUR", seaCargo: true, aliases: "Sur Port, OMSUR, بندر صور" },
    { name: "Qalhat LNG Marine Terminal (Sur), OM", persian: "ترمینال قلهات (صور)، عمان", country: "Oman", code: "QAL", isPort: true, portName: "Qalhat Marine Terminal", locationType: "SEA_PORT", unLocode: "OMQAL", seaCargo: true, aliases: "Qalhat, OMQAL, قلهات" },
    { name: "Mina Al Fahal Port (Muscat), OM", persian: "بندر الفحل (مسقط)، عمان", country: "Oman", code: "MFH", isPort: true, portName: "Mina Al Fahal", locationType: "SEA_PORT", unLocode: "OMMFH", seaCargo: true, aliases: "Mina Al Fahal, OMMFH, بندر الفحل" },
    { name: "Masirah Port, OM", persian: "بندر مصیره، عمان", country: "Oman", code: "MSR", isPort: true, portName: "Port of Masirah", locationType: "SEA_PORT", unLocode: "OMMSR", seaCargo: true, aliases: "Masirah, OMMSR, بندر مصیره" },
    { name: "Shannah Ferry & Cargo Port, OM", persian: "بندر شنه، عمان", country: "Oman", code: "SHH", isPort: true, portName: "Shannah Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Shannah, Shanna, بندر شنه" },
    { name: "Khazaen Dry Port (Barka / Muscat ICD), OM", persian: "بندر خشک خزائن (مسقط / بركاء)، عمان", country: "Oman", code: "KZN", isPort: true, portName: "Khazaen Dry Port", locationType: "ICD", railConnected: true, roadConnected: true, containerEnabled: true, aliases: "Khazaen, Barka Dry Port, خزائن" },
    { name: "Port of Dibba (Musandam), OM", persian: "بندر دبا (مسندم)، عمان", country: "Oman", code: "DBB-OM", isPort: true, portName: "Port of Dibba (Oman)", locationType: "SEA_PORT", seaCargo: true, aliases: "Dibba Oman, Dibba Al-Baya, بندر دبا" },
    { name: "Lima Port (Musandam), OM", persian: "بندر لیما (مسندم)، عمان", country: "Oman", code: "LMA", isPort: true, portName: "Port of Lima", locationType: "SEA_PORT", seaCargo: true, aliases: "Lima Port, بندر لیما" },
    { name: "Al Ashkharah Port, OM", persian: "بندر الاشخره، عمان", country: "Oman", code: "ASH-OM", isPort: true, portName: "Al Ashkharah Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Ashkharah, Al Ashkharah, بندر الاشخره" },
    { name: "Raysut Port Terminal (Salalah), OM", persian: "اسکله ریسوت (صلاله)، عمان", country: "Oman", code: "RYS", isPort: true, portName: "Raysut Terminal", locationType: "SEA_PORT", seaCargo: true, aliases: "Raysut, ریسوت" },
    { name: "Hasik Port (Dhofar), OM", persian: "بندر حاسک (ظفار)، عمان", country: "Oman", code: "HSK", isPort: true, portName: "Hasik Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Hasik, بندر حاسک" },
    { name: "Mirbat Port (Dhofar), OM", persian: "بندر مرباط (ظفار)، عمان", country: "Oman", code: "MRB", isPort: true, portName: "Mirbat Port", locationType: "SEA_PORT", seaCargo: true, aliases: "Mirbat, بندر مرباط" },
    { name: "Shuwaikh Port (Kuwait), KW", persian: "بندر شیوخ، کویت", country: "Kuwait", code: "KWT", isPort: true, portName: "Shuwaikh Port" },
    { name: "Umm Qasr Port (Basra), IQ", persian: "بندر ام قصر (بصره)، عراق", country: "Iraq", code: "UQR", isPort: true, portName: "Umm Qasr Port" },
    { name: "Aqaba Port, JO", persian: "بندر عقبه، اردن", country: "Jordan", code: "AQB", isPort: true, portName: "Port of Aqaba" },
    { name: "Beirut Port, LB", persian: "بندر بیروت، لبنان", country: "Lebanon", code: "BEY", isPort: true, portName: "Port of Beirut" },
    
    // 🇮🇳 INDIA — LAND BORDERS, INTEGRATED CHECK POSTS (ICP) & CUSTOMS CROSSINGS
    { name: "Attari / Wagah (ICP Attari), Punjab, IN", persian: "اٹاری بارڈر / واہگہ (پایانه مرزی پاکستان)، هند", country: "India", code: "ATT", locationType: "INTEGRATED_CHECK_POST", state: "Punjab", district: "Amritsar", borderCountry: "Pakistan", isBorder: true, roadConnected: true, railConnected: true, customsCode: "INATT1", unLocode: "INATQ" },
    { name: "Dera Baba Nanak (Kartarpur Corridor), Punjab, IN", persian: "دیره بابا نانک (مرز پاکستان)، هند", country: "India", code: "DBN", locationType: "CUSTOMS_BORDER", state: "Punjab", district: "Gurdaspur", borderCountry: "Pakistan", isBorder: true },
    { name: "Raxaul (ICP Raxaul / Birgunj Gateway), Bihar, IN", persian: "راکسول (پایانه مرزی نپال)، هند", country: "India", code: "RXL", locationType: "INTEGRATED_CHECK_POST", state: "Bihar", district: "East Champaran", borderCountry: "Nepal", isBorder: true, railConnected: true, roadConnected: true, unLocode: "INRXL", customsCode: "INRXL1" },
    { name: "Jogbani (ICP Jogbani / Biratnagar Gateway), Bihar, IN", persian: "جوگبانی (مرز نپال)، هند", country: "India", code: "JGB", locationType: "INTEGRATED_CHECK_POST", state: "Bihar", district: "Araria", borderCountry: "Nepal", isBorder: true, railConnected: true, roadConnected: true, unLocode: "INJGB", customsCode: "INJGB1" },
    { name: "Rupaidiha (ICP Rupaidiha / Nepalgunj), UP, IN", persian: "روپیدیها (مرز نپال)، هند", country: "India", code: "RPD", locationType: "INTEGRATED_CHECK_POST", state: "Uttar Pradesh", district: "Bahraich", borderCountry: "Nepal", isBorder: true, roadConnected: true, unLocode: "INRPD" },
    { name: "Panitanki (Raniganj / Kakarbhitta Gateway), WB, IN", persian: "پانی تانکی (مرز نپال)، هند", country: "India", code: "PTK", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "Darjeeling", borderCountry: "Nepal", isBorder: true, roadConnected: true },
    { name: "Jaigaon (Phuntsholing Gateway), WB, IN", persian: "جایگاون (مرز بوتان)، هند", country: "India", code: "JGN", locationType: "LAND_BORDER", state: "West Bengal", district: "Alipurduar", borderCountry: "Bhutan", isBorder: true, roadConnected: true, unLocode: "INJGN" },
    { name: "Petrapole (ICP Petrapole / Benapole Gateway), WB, IN", persian: "پتراپول (پایانه مرزی بنگلادش)، هند", country: "India", code: "PTP", locationType: "INTEGRATED_CHECK_POST", state: "West Bengal", district: "North 24 Parganas", borderCountry: "Bangladesh", isBorder: true, railConnected: true, roadConnected: true, unLocode: "INPTP", customsCode: "INPTP1" },
    { name: "Hili (Hili Land Customs Station), WB, IN", persian: "هیلی (گمرک مرزی بنگلادش)، هند", country: "India", code: "HLI", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "Dakshin Dinajpur", borderCountry: "Bangladesh", isBorder: true, unLocode: "INHLI" },
    { name: "Changrabandha (Burimari Gateway), WB, IN", persian: "چانگرابندها (مرز بنگلادش)، هند", country: "India", code: "CGB", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "Cooch Behar", borderCountry: "Bangladesh", isBorder: true, unLocode: "INCGB" },
    { name: "Ghojadanga (Bhomra Gateway), WB, IN", persian: "غوجادانگا (مرز بنگلادش)، هند", country: "India", code: "GHD", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "North 24 Parganas", borderCountry: "Bangladesh", isBorder: true, unLocode: "INGHD" },
    { name: "Mahadipur (Sonamasjid Gateway), WB, IN", persian: "مهدی‌پور (مرز بنگلادش)، هند", country: "India", code: "MDP", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "Malda", borderCountry: "Bangladesh", isBorder: true, unLocode: "INMDP" },
    { name: "Fulbari (Banglabandha Gateway), WB, IN", persian: "فولباری (مرز بنگلادش)، هند", country: "India", code: "FLB", locationType: "CUSTOMS_BORDER", state: "West Bengal", district: "Jalpaiguri", borderCountry: "Bangladesh", isBorder: true, unLocode: "INFLB" },
    { name: "Dawki (ICP Dawki / Tamabil Gateway), Meghalaya, IN", persian: "داوکی (پایانه مرزی بنگلادش)، هند", country: "India", code: "DWK", locationType: "INTEGRATED_CHECK_POST", state: "Meghalaya", district: "West Jaintia Hills", borderCountry: "Bangladesh", isBorder: true, unLocode: "INDWK" },
    { name: "Sutarkandi (ICP Sutarkandi / Sheola Gateway), Assam, IN", persian: "سوتارکندی (مرز بنگلادش)، هند", country: "India", code: "STK", locationType: "INTEGRATED_CHECK_POST", state: "Assam", district: "Karimganj", borderCountry: "Bangladesh", isBorder: true, unLocode: "INSTK" },
    { name: "Agartala (ICP Agartala / Akhaura Gateway), Tripura, IN", persian: "آگارتالا (پایانه مرزی بنگلادش)، هند", country: "India", code: "AGT", locationType: "INTEGRATED_CHECK_POST", state: "Tripura", district: "West Tripura", borderCountry: "Bangladesh", isBorder: true, unLocode: "INAGT" },
    { name: "Srimantapur (Bibirbazar Gateway), Tripura, IN", persian: "سریماتاپور (مرز بنگلادش)، هند", country: "India", code: "SMP", locationType: "CUSTOMS_BORDER", state: "Tripura", district: "Sepahijala", borderCountry: "Bangladesh", isBorder: true, unLocode: "INSMP" },
    { name: "Sabroom (ICP Sabroom / Chittagong Corridor), Tripura, IN", persian: "سابروم (مرز بنگلادش)، هند", country: "India", code: "SBR", locationType: "INTEGRATED_CHECK_POST", state: "Tripura", district: "South Tripura", borderCountry: "Bangladesh", isBorder: true, unLocode: "INSBR" },
    { name: "Moreh (ICP Moreh / Tamu Gateway), Manipur, IN", persian: "موره (مرز میانمار)، هند", country: "India", code: "MRH", locationType: "INTEGRATED_CHECK_POST", state: "Manipur", district: "Tengnoupal", borderCountry: "Myanmar", isBorder: true, unLocode: "INMRH" },
    { name: "Zokhawthar (Rih Dil Gateway), Mizoram, IN", persian: "زوخاوتر (مرز میانمار)، هند", country: "India", code: "ZKT", locationType: "CUSTOMS_BORDER", state: "Mizoram", district: "Champhai", borderCountry: "Myanmar", isBorder: true, unLocode: "INZKT" },

    // 🇮🇳 INDIA — MAJOR SEAPORTS & PREMIER CONTAINER TERMINALS
    { 
      name: "Nhava Sheva Port (JNPT / Navi Mumbai), Maharashtra, India", 
      persian: "بندر نوا شوا (JNPT ممبئی)، هند", 
      country: "India", 
      code: "INNSA", 
      isPort: true, 
      portName: "Nhava Sheva Port (JNPT / Navi Mumbai)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Maharashtra", 
      district: "Raigad / Navi Mumbai", 
      unLocode: "INNSA", 
      customsCode: "INNSA1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: [
        "Nhava Sheva",
        "Nhava Sheva, IN",
        "Nhava Sheva, India",
        "Nhava Sheva Port",
        "JNPT",
        "Jawaharlal Nehru Port",
        "JNPT Mumbai",
        "Navi Mumbai",
        "Nava Sheva",
        "Nhava",
        "Sheva",
        "INNSA",
        "INNSA1",
        "نوا شوا",
        "نهاوا شوا",
        "ناوا شوا",
        "ناوا شیوا",
        "بندر نوا شوا",
        "بندر نهاوا شوا",
        "بندر ناوا شوا",
        "بندر ناوا شیوا",
        "ممبئی",
        "بندر ممبئی",
        "هند",
        "هندوستان"
      ]
    },
    { 
      name: "Nhava Sheva, IN", 
      persian: "نوا شوا، هند", 
      country: "India", 
      code: "INNSA", 
      isPort: true, 
      portName: "Nhava Sheva (JNPT)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Maharashtra", 
      district: "Navi Mumbai", 
      unLocode: "INNSA", 
      customsCode: "INNSA1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: [
        "Nhava Sheva",
        "Nhava Sheva, India",
        "Nhava Sheva Port",
        "JNPT",
        "Jawaharlal Nehru",
        "Nava Sheva",
        "نوا شوا",
        "نهاوا شوا",
        "ناوا شیوا",
        "بندر نوا شوا",
        "هند"
      ]
    },
    { 
      name: "Jawaharlal Nehru Port (JNPT / Nhava Sheva), MH, IN", 
      persian: "بندر نهاوا شوا (JNPT ممبئی)، هند", 
      country: "India", 
      code: "INNSA", 
      isPort: true, 
      portName: "Jawaharlal Nehru Port (JNPT / Nhava Sheva)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Maharashtra", 
      district: "Raigad / Navi Mumbai", 
      unLocode: "INNSA", 
      customsCode: "INNSA1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: [
        "Nhava Sheva",
        "Nhava Sheva Port",
        "JNPT",
        "Jawaharlal Nehru Port",
        "نوا شوا",
        "نهاوا شوا",
        "ناوا شوا",
        "ناوا شیوا"
      ]
    },
    { 
      name: "Mumbai Port Trust (MbPT), Maharashtra, IN", 
      persian: "بندر ممبئی، هند", 
      country: "India", 
      code: "INBOM", 
      isPort: true, 
      portName: "Mumbai Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Maharashtra", 
      district: "Mumbai", 
      unLocode: "INBOM", 
      seaCargo: true,
      aliases: ["Mumbai Port", "Bombay Port", "MbPT", "INBOM", "بندر ممبئی", "ممبئی"]
    },
    { 
      name: "Mundra Port (Adani Ports & SEZ), Gujarat, India", 
      persian: "بندر موندرا (بزرگترین بندر تجاری گجرات)، هند", 
      country: "India", 
      code: "INMUN", 
      isPort: true, 
      portName: "Mundra Port & SEZ (APSEZ)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Gujarat", 
      district: "Kutch", 
      unLocode: "INMUN", 
      customsCode: "INMUN1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: ["Mundra", "Mundra Port", "Mundra, IN", "Mundra, India", "Adani Mundra", "APSEZ", "INMUN", "موندرا", "بندر موندرا"]
    },
    { 
      name: "Mundra, IN", 
      persian: "موندرا، هند", 
      country: "India", 
      code: "INMUN", 
      isPort: true, 
      portName: "Mundra Port", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Gujarat", 
      district: "Kutch", 
      unLocode: "INMUN", 
      customsCode: "INMUN1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: ["Mundra", "Mundra Port", "Mundra India", "موندرا", "بندر موندرا"]
    },
    { 
      name: "Deendayal Port (Kandla), Gujarat, IN", 
      persian: "بندر کاندلا (دیندایال)، هند", 
      country: "India", 
      code: "INIXY", 
      isPort: true, 
      portName: "Deendayal Port (Kandla)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Gujarat", 
      district: "Kutch", 
      unLocode: "INIXY", 
      customsCode: "INIXY1", 
      containerEnabled: true,
      railConnected: true,
      seaCargo: true,
      aliases: ["Kandla", "Kandla Port", "Deendayal", "Deendayal Port", "INIXY", "کاندلا", "بندر کاندلا", "دیندایال"]
    },
    { 
      name: "Pipavav Port (APM Terminals), Gujarat, IN", 
      persian: "بندر پیپاوائو (گجرات)، هند", 
      country: "India", 
      code: "INPAV", 
      isPort: true, 
      portName: "Port Pipavav (APM Terminals)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Gujarat", 
      district: "Amreli", 
      unLocode: "INPAV", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: ["Pipavav", "Port Pipavav", "APM Terminals Pipavav", "INPAV", "پیپاوائو", "بندر پیپاوائو"]
    },
    { 
      name: "Hazira Port (Adani / Essar), Gujarat, IN", 
      persian: "بندر هزیرا (سورت)، هند", 
      country: "India", 
      code: "INHZA", 
      isPort: true, 
      portName: "Hazira Port (Adani Hazira)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Gujarat", 
      district: "Surat", 
      unLocode: "INHZA", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Hazira", "Hazira Port", "Adani Hazira", "Surat Port", "INHZA", "هزیرا", "بندر هزیرا"]
    },
    { 
      name: "Chennai Port Trust, Tamil Nadu, IN", 
      persian: "بندر چنای (مدراس)، هند", 
      country: "India", 
      code: "INMAA", 
      isPort: true, 
      portName: "Chennai Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Tamil Nadu", 
      district: "Chennai", 
      unLocode: "INMAA", 
      customsCode: "INMAA1", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: ["Chennai", "Chennai Port", "Madras Port", "INMAA", "چنای", "بندر چنای", "مدراس"]
    },
    { 
      name: "Kamarajar Port (Ennore), Tamil Nadu, IN", 
      persian: "بندر کاماراجار (انور)، هند", 
      country: "India", 
      code: "INENR", 
      isPort: true, 
      portName: "Kamarajar Port (Ennore)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Tamil Nadu", 
      district: "Chennai", 
      unLocode: "INENR", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Kamarajar", "Ennore", "Kamarajar Port", "Ennore Port", "INENR", "کاماراجار", "بندر انور"]
    },
    { 
      name: "Kattupalli Port (Adani Kattupalli), Tamil Nadu, IN", 
      persian: "بندر کاتوپالی (چنای)، هند", 
      country: "India", 
      code: "INKAT", 
      isPort: true, 
      portName: "Adani Kattupalli Port", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Tamil Nadu", 
      district: "Tiruvallur", 
      unLocode: "INKAT", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Kattupalli", "Kattupalli Port", "Adani Kattupalli", "INKAT", "کاتوپالی", "بندر کاتوپالی"]
    },
    { 
      name: "V.O. Chidambaranar Port (Tuticorin), Tamil Nadu, IN", 
      persian: "بندر توتیکورین (VOC Port)، هند", 
      country: "India", 
      code: "INTUT", 
      isPort: true, 
      portName: "V.O. Chidambaranar Port (Tuticorin)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Tamil Nadu", 
      district: "Thoothukudi", 
      unLocode: "INTUT", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Tuticorin", "Tuticorin Port", "VOC Port", "Chidambaranar", "INTUT", "توتیکورین", "بندر توتیکورین"]
    },
    { 
      name: "Cochin Port Trust (Vallarpadam ICTT), Kerala, IN", 
      persian: "بندر کوچین (پایانه بین‌المللی کانتینری والرپادام)، هند", 
      country: "India", 
      code: "INCOK", 
      isPort: true, 
      portName: "Cochin Port (Vallarpadam ICTT)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Kerala", 
      district: "Ernakulam", 
      unLocode: "INCOK", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Cochin", "Cochin Port", "Kochi Port", "Vallarpadam ICTT", "INCOK", "کوچین", "بندر کوچین"]
    },
    { 
      name: "Vizhinjam International Seaport, Kerala, IN", 
      persian: "بندر بین‌المللی ویژینجام (ترانس‌شیپ‌منت کانتینری)، هند", 
      country: "India", 
      code: "INVIZ", 
      isPort: true, 
      portName: "Vizhinjam International Transshipment Deepwater Port", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Kerala", 
      district: "Thiruvananthapuram", 
      unLocode: "INVIZ", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Vizhinjam", "Vizhinjam Port", "Trivandrum Seaport", "INVIZ", "ویژینجام", "بندر ویژینجام"]
    },
    { 
      name: "New Mangalore Port, Karnataka, IN", 
      persian: "بندر نیو منگلور، هند", 
      country: "India", 
      code: "INNML", 
      isPort: true, 
      portName: "New Mangalore Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Karnataka", 
      district: "Dakshina Kannada", 
      unLocode: "INNML", 
      seaCargo: true,
      aliases: ["New Mangalore", "Mangalore Port", "NMPT", "INNML", "نیو منگلور", "بندر منگلور"]
    },
    { 
      name: "Mormugao Port Trust, Goa, IN", 
      persian: "بندر مورموگائو (گوا)، هند", 
      country: "India", 
      code: "INMRM", 
      isPort: true, 
      portName: "Mormugao Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Goa", 
      district: "South Goa", 
      unLocode: "INMRM", 
      seaCargo: true,
      aliases: ["Mormugao", "Mormugao Port", "Goa Port", "MPT", "INMRM", "مورموگائو", "بندر گوا"]
    },
    { 
      name: "Visakhapatnam Port Trust (Vizag Port), AP, IN", 
      persian: "بندر ویساکاپاتنام (ویزگ)، هند", 
      country: "India", 
      code: "INVTZ", 
      isPort: true, 
      portName: "Visakhapatnam Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Andhra Pradesh", 
      district: "Visakhapatnam", 
      unLocode: "INVTZ", 
      containerEnabled: true, 
      railConnected: true, 
      seaCargo: true,
      aliases: ["Visakhapatnam", "Vizag", "Vizag Port", "VPT", "INVTZ", "ویساکاپاتنام", "ویزگ", "بندر ویزگ"]
    },
    { 
      name: "Gangavaram Port (Adani Gangavaram), AP, IN", 
      persian: "بندر گانگااورام (ویزگ)، هند", 
      country: "India", 
      code: "INGGV", 
      isPort: true, 
      portName: "Gangavaram Port", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Andhra Pradesh", 
      district: "Visakhapatnam", 
      unLocode: "INGGV", 
      seaCargo: true,
      aliases: ["Gangavaram", "Gangavaram Port", "Adani Gangavaram", "INGGV", "گانگااورام", "بندر گانگااورام"]
    },
    { 
      name: "Krishnapatnam Port (Adani KPCL), AP, IN", 
      persian: "بندر کریشناپاتنام (نلور)، هند", 
      country: "India", 
      code: "INKRI", 
      isPort: true, 
      portName: "Krishnapatnam Port (KPCL)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Andhra Pradesh", 
      district: "Nellore", 
      unLocode: "INKRI", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Krishnapatnam", "Krishnapatnam Port", "KPCL", "INKRI", "کریشناپاتنام", "بندر کریشناپاتنام"]
    },
    { 
      name: "Paradip Port Trust, Odisha, IN", 
      persian: "بندر پارادیپ (اودیشا)، هند", 
      country: "India", 
      code: "INPRT", 
      isPort: true, 
      portName: "Paradip Port Trust", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Odisha", 
      district: "Jagatsinghpur", 
      unLocode: "INPRT", 
      seaCargo: true,
      aliases: ["Paradip", "Paradip Port", "INPRT", "پارادیپ", "بندر پارادیپ"]
    },
    { 
      name: "Dhamra Port (Adani Dhamra), Odisha, IN", 
      persian: "بندر دهامرا (اودیشا)، هند", 
      country: "India", 
      code: "INDHM", 
      isPort: true, 
      portName: "Dhamra Port (DPCL)", 
      locationType: "SEA_PORT_MAJOR", 
      state: "Odisha", 
      district: "Bhadrak", 
      unLocode: "INDHM", 
      seaCargo: true,
      aliases: ["Dhamra", "Dhamra Port", "Adani Dhamra", "INDHM", "دهامرا", "بندر دهامرا"]
    },
    { 
      name: "Syama Prasad Mookerjee Port (Kolkata Dock), WB, IN", 
      persian: "بندر کلکته (سیااما پراساد)، هند", 
      country: "India", 
      code: "INCCU", 
      isPort: true, 
      portName: "Syama Prasad Mookerjee Port Kolkata", 
      locationType: "SEA_PORT_MAJOR", 
      state: "West Bengal", 
      district: "Kolkata", 
      unLocode: "INCCU", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Kolkata Port", "Calcutta Port", "Syama Prasad Mookerjee", "INCCU", "کلکته", "بندر کلکته"]
    },
    { 
      name: "Haldia Dock Complex (HDC), West Bengal, IN", 
      persian: "بندر هالدیا (داک کمپلکس کلکته)، هند", 
      country: "India", 
      code: "INHAL", 
      isPort: true, 
      portName: "Haldia Dock Complex", 
      locationType: "SEA_PORT_MAJOR", 
      state: "West Bengal", 
      district: "Purba Medinipur", 
      unLocode: "INHAL", 
      containerEnabled: true, 
      seaCargo: true,
      aliases: ["Haldia", "Haldia Port", "HDC", "INHAL", "هالدیا", "بندر هالدیا"]
    },

    // 🇮🇳 INDIA — COMMERCIAL NON-MAJOR CARGO SEAPORTS & BULK TERMINALS
    { name: "Bedi Port, Gujarat, IN", persian: "بندر بدی (جام‌نگر)، هند", country: "India", code: "INBED", isPort: true, portName: "Bedi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INBED", seaCargo: true, aliases: ["Bedi", "Bedi Port", "Jamnagar Port", "بدی"] },
    { name: "Sikka Port (Reliance Terminal), Gujarat, IN", persian: "بندر سیکا (پایانه نفتی ریلاینس)، هند", country: "India", code: "INSIK", isPort: true, portName: "Sikka Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INSIK", seaCargo: true, aliases: ["Sikka", "Sikka Port", "Reliance Sikka", "سیکا"] },
    { name: "Dahej Port (Petronet LNG), Gujarat, IN", persian: "بندر داهج (گجرات)، هند", country: "India", code: "INDHJ", isPort: true, portName: "Dahej Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INDHJ", seaCargo: true, aliases: ["Dahej", "Dahej Port", "Petronet Dahej", "داهج"] },
    { name: "Porbandar Port, Gujarat, IN", persian: "بندر پوربندر، هند", country: "India", code: "INPBD-PORT", isPort: true, portName: "Porbandar Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INPBD", seaCargo: true, aliases: ["Porbandar", "Porbandar Port", "پوربندر"] },
    { name: "Okha Port, Gujarat, IN", persian: "بندر اوخا (دوارکا)، هند", country: "India", code: "INOKH", isPort: true, portName: "Okha Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INOKH", seaCargo: true, aliases: ["Okha", "Okha Port", "Dwarka Port", "اوخا"] },
    { name: "Navlakhi Port, Gujarat, IN", persian: "بندر ناولاخی (موربی)، هند", country: "India", code: "INNAV", isPort: true, portName: "Navlakhi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INNAV", seaCargo: true, aliases: ["Navlakhi", "Navlakhi Port", "Morbi Port", "ناولاخی"] },
    { name: "Magdalla Port (Surat), Gujarat, IN", persian: "بندر ماگدالا (سورت)، هند", country: "India", code: "INMAG", isPort: true, portName: "Magdalla Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INMAG", seaCargo: true, aliases: ["Magdalla", "Magdalla Port", "Surat Port", "ماگدالا"] },
    { name: "Bhavnagar Port, Gujarat, IN", persian: "بندر باوناگار، هند", country: "India", code: "INBHU", isPort: true, portName: "Bhavnagar Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INBHU", seaCargo: true, aliases: ["Bhavnagar", "Bhavnagar Port", "باوناگار"] },
    { name: "Jafrabad Port, Gujarat, IN", persian: "بندر جعفرآباد، هند", country: "India", code: "INJAF", isPort: true, portName: "Jafrabad Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INJAF", seaCargo: true, aliases: ["Jafrabad", "Jafrabad Port", "جعفرآباد"] },
    { name: "Mandvi Port (Kutch), Gujarat, IN", persian: "بندر ماندوی (کوچ)، هند", country: "India", code: "INMDA", isPort: true, portName: "Mandvi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INMDA", seaCargo: true, aliases: ["Mandvi", "Mandvi Port", "ماندوی"] },
    { name: "Rozi Pier (Jamnagar), Gujarat, IN", persian: "پایانه روزی پیر (جام‌نگر)، هند", country: "India", code: "INRZI", isPort: true, portName: "Rozi Pier", locationType: "SEA_PORT_NON_MAJOR", state: "Gujarat", unLocode: "INRZI", seaCargo: true, aliases: ["Rozi Pier", "Rozi Port", "روزی"] },
    { name: "Jaigad Port (JSW Jaigad), Maharashtra, IN", persian: "بندر جایگاد (راتناگیری)، هند", country: "India", code: "INJAI-PORT", isPort: true, portName: "JSW Jaigad Port", locationType: "SEA_PORT_NON_MAJOR", state: "Maharashtra", unLocode: "INJAI", seaCargo: true, aliases: ["Jaigad", "Jaigad Port", "JSW Jaigad", "جایگاد"] },
    { name: "Dighi Port (Adani Dighi), Maharashtra, IN", persian: "بندر دیگی (رایگاد)، هند", country: "India", code: "INDGI", isPort: true, portName: "Dighi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Maharashtra", unLocode: "INDGI", seaCargo: true, aliases: ["Dighi", "Dighi Port", "Adani Dighi", "دیگی"] },
    { name: "Dharamtar Port, Maharashtra, IN", persian: "بندر دهارام‌تار (رایگاد)، هند", country: "India", code: "INDMT", isPort: true, portName: "Dharamtar Port", locationType: "SEA_PORT_NON_MAJOR", state: "Maharashtra", unLocode: "INDMT", seaCargo: true, aliases: ["Dharamtar", "Dharamtar Port", "دهارام‌تار"] },
    { name: "Redi Port, Maharashtra, IN", persian: "بندر ردی (سیندودورگ)، هند", country: "India", code: "INRED", isPort: true, portName: "Redi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Maharashtra", unLocode: "INRED", seaCargo: true, aliases: ["Redi", "Redi Port", "ردی"] },
    { name: "Rewas Port, Maharashtra, IN", persian: "بندر رواس (رایگاد)، هند", country: "India", code: "INREW-PORT", isPort: true, portName: "Rewas Port", locationType: "SEA_PORT_NON_MAJOR", state: "Maharashtra", unLocode: "INREW", seaCargo: true, aliases: ["Rewas", "Rewas Port", "رواس"] },
    { name: "Karwar Port, Karnataka, IN", persian: "بندر کاروار، هند", country: "India", code: "INKRW", isPort: true, portName: "Karwar Port", locationType: "SEA_PORT_NON_MAJOR", state: "Karnataka", unLocode: "INKRW", seaCargo: true, aliases: ["Karwar", "Karwar Port", "کاروار"] },
    { name: "Old Mangalore Port, Karnataka, IN", persian: "بندر قدیم منگلور، هند", country: "India", code: "INMNP", isPort: true, portName: "Old Mangalore Port", locationType: "SEA_PORT_NON_MAJOR", state: "Karnataka", unLocode: "INMNP", seaCargo: true, aliases: ["Old Mangalore", "Mangalore Bunder", "بندر قدیم منگلور"] },
    { name: "Malpe Port, Karnataka, IN", persian: "بندر مالپه (اودوپی)، هند", country: "India", code: "INMAL", isPort: true, portName: "Malpe Port", locationType: "SEA_PORT_NON_MAJOR", state: "Karnataka", unLocode: "INMAL", seaCargo: true, aliases: ["Malpe", "Malpe Port", "مالپه"] },
    { name: "Tadadi Port, Karnataka, IN", persian: "بندر تادادی، هند", country: "India", code: "INTAD", isPort: true, portName: "Tadadi Port", locationType: "SEA_PORT_NON_MAJOR", state: "Karnataka", unLocode: "INTAD", seaCargo: true, aliases: ["Tadadi", "Tadadi Port", "تادادی"] },
    { name: "Beypore Port, Kerala, IN", persian: "بندر بیپور (کوزیکود)، هند", country: "India", code: "INBEY", isPort: true, portName: "Beypore Port", locationType: "SEA_PORT_NON_MAJOR", state: "Kerala", unLocode: "INBEY", seaCargo: true, aliases: ["Beypore", "Beypore Port", "Calicut Port", "بیپور"] },
    { name: "Azhikkal Port (Kannur), Kerala, IN", persian: "بندر آژیکال (کانور)، هند", country: "India", code: "INAZH", isPort: true, portName: "Azhikkal Port", locationType: "SEA_PORT_NON_MAJOR", state: "Kerala", unLocode: "INAZH", seaCargo: true, aliases: ["Azhikkal", "Azhikkal Port", "Kannur Port", "آژیکال"] },
    { name: "Kollam Port, Kerala, IN", persian: "بندر کولام (کویلون)، هند", country: "India", code: "INKLM", isPort: true, portName: "Kollam Port", locationType: "SEA_PORT_NON_MAJOR", state: "Kerala", unLocode: "INKLM", seaCargo: true, aliases: ["Kollam", "Kollam Port", "Quilon Port", "کولام"] },
    { name: "Neendakara Port, Kerala, IN", persian: "بندر نینداکارا (کولام)، هند", country: "India", code: "INNEE", isPort: true, portName: "Neendakara Port", locationType: "SEA_PORT_NON_MAJOR", state: "Kerala", unLocode: "INNEE", seaCargo: true, aliases: ["Neendakara", "Neendakara Port", "نینداکارا"] },
    { name: "Ponnani Port, Kerala, IN", persian: "بندر پونانی (مالاپورام)، هند", country: "India", code: "INPON", isPort: true, portName: "Ponnani Port", locationType: "SEA_PORT_NON_MAJOR", state: "Kerala", unLocode: "INPON", seaCargo: true, aliases: ["Ponnani", "Ponnani Port", "پونانی"] },
    { name: "Cuddalore Port, Tamil Nadu, IN", persian: "بندر کادالور، هند", country: "India", code: "INCDL", isPort: true, portName: "Cuddalore Port", locationType: "SEA_PORT_NON_MAJOR", state: "Tamil Nadu", unLocode: "INCDL", seaCargo: true, aliases: ["Cuddalore", "Cuddalore Port", "کادالور"] },
    { name: "Nagapattinam Port, Tamil Nadu, IN", persian: "بندر ناگاپاتینام، هند", country: "India", code: "INNAG-PORT", isPort: true, portName: "Nagapattinam Port", locationType: "SEA_PORT_NON_MAJOR", state: "Tamil Nadu", unLocode: "INNAG", seaCargo: true, aliases: ["Nagapattinam", "Nagapattinam Port", "ناگاپاتینام"] },
    { name: "Colachel Port, Tamil Nadu, IN", persian: "بندر کولاچل (کانیاکوماری)، هند", country: "India", code: "INCOL", isPort: true, portName: "Colachel Port", locationType: "SEA_PORT_NON_MAJOR", state: "Tamil Nadu", unLocode: "INCOL", seaCargo: true, aliases: ["Colachel", "Colachel Port", "کولاچل"] },
    { name: "Karaikal Port (Adani Karaikal), Puducherry, IN", persian: "بندر کارایکال، هند", country: "India", code: "INKRK", isPort: true, portName: "Karaikal Port", locationType: "SEA_PORT_NON_MAJOR", state: "Puducherry", unLocode: "INKRK", seaCargo: true, aliases: ["Karaikal", "Karaikal Port", "Adani Karaikal", "کارایکال"] },
    { name: "Kakinada Deep Water Port, AP, IN", persian: "بندر کاکینادا، هند", country: "India", code: "INKAK", isPort: true, portName: "Kakinada Deep Water Port", locationType: "SEA_PORT_NON_MAJOR", state: "Andhra Pradesh", unLocode: "INKAK", seaCargo: true, aliases: ["Kakinada", "Kakinada Port", "کاکینادا"] },
    { name: "Machilipatnam Port, AP, IN", persian: "بندر ماچیلی‌پاتنام، هند", country: "India", code: "INMTM", isPort: true, portName: "Machilipatnam Port", locationType: "SEA_PORT_NON_MAJOR", state: "Andhra Pradesh", unLocode: "INMTM", seaCargo: true, aliases: ["Machilipatnam", "Machilipatnam Port", "ماچیلی‌پاتنام"] },
    { name: "Bhavanapadu Port (Mulapeta), AP, IN", persian: "بندر مولاپتا (باواناپادو)، هند", country: "India", code: "INBHP", isPort: true, portName: "Bhavanapadu / Mulapeta Port", locationType: "SEA_PORT_NON_MAJOR", state: "Andhra Pradesh", unLocode: "INBHP", seaCargo: true, aliases: ["Bhavanapadu", "Mulapeta", "مولاپتا"] },
    { name: "Ramayapatnam Port, AP, IN", persian: "بندر رامایاپاتنام، هند", country: "India", code: "INRAM", isPort: true, portName: "Ramayapatnam Port", locationType: "SEA_PORT_NON_MAJOR", state: "Andhra Pradesh", unLocode: "INRAM", seaCargo: true, aliases: ["Ramayapatnam", "Ramayapatnam Port", "رامایاپاتنام"] },
    { name: "Gopalpur Port, Odisha, IN", persian: "بندر گوپال‌پور (گانجام)، هند", country: "India", code: "INGPR", isPort: true, portName: "Gopalpur Port", locationType: "SEA_PORT_NON_MAJOR", state: "Odisha", unLocode: "INGPR", seaCargo: true, aliases: ["Gopalpur", "Gopalpur Port", "گوپال‌پور"] },
    { name: "Astaranga Port, Odisha, IN", persian: "بندر آستارانگا (پوری)، هند", country: "India", code: "INAST", isPort: true, portName: "Astaranga Port", locationType: "SEA_PORT_NON_MAJOR", state: "Odisha", unLocode: "INAST", seaCargo: true, aliases: ["Astaranga", "Astaranga Port", "آستارانگا"] },
    { name: "Subarnarekha Port (Kirtania), Odisha, IN", persian: "بندر سوبارنارکا (کیرتانیا)، هند", country: "India", code: "INSUB", isPort: true, portName: "Subarnarekha Port", locationType: "SEA_PORT_NON_MAJOR", state: "Odisha", unLocode: "INSUB", seaCargo: true, aliases: ["Subarnarekha", "Kirtania Port", "سوبارنارکا"] },
    { name: "Kulpi Port, West Bengal, IN", persian: "بندر کولپی، هند", country: "India", code: "INKLP", isPort: true, portName: "Kulpi Port", locationType: "SEA_PORT_NON_MAJOR", state: "West Bengal", unLocode: "INKLP", seaCargo: true, aliases: ["Kulpi", "Kulpi Port", "کولپی"] },
    { name: "Port Blair Port (Haddo Wharf), Andaman & Nicobar, IN", persian: "بندر پورت بلیر (جزایر آندامان)، هند", country: "India", code: "INIXZ-PORT", isPort: true, portName: "Port Blair Port", locationType: "SEA_PORT_NON_MAJOR", state: "Andaman and Nicobar", unLocode: "INIXZ", seaCargo: true, aliases: ["Port Blair Port", "Haddo Wharf", "Andaman Port", "پورت بلیر"] },

    // 🇮🇳 INDIA — INLAND WATERWAY MULTIMODAL TERMINALS (NW-1 & NW-2)
    { name: "NW-1 Varanasi Multimodal Inland Terminal, UP, IN", persian: "پایانه چندوجهی آبراه ملی ۱ واراناسی، هند", country: "India", code: "INVNS-IW", isPort: true, portName: "Varanasi Inland Multimodal Terminal", locationType: "INLAND_WATERWAY", state: "Uttar Pradesh", unLocode: "INVNS", seaCargo: true, inlandWaterway: true, containerEnabled: true, railConnected: true, aliases: ["Varanasi Inland Port", "NW-1 Varanasi", "واراناسی آبراه"] },
    { name: "NW-1 Sahibganj Multimodal Inland Terminal, Jharkhand, IN", persian: "پایانه چندوجهی آبراه ملی ۱ صاحب‌گنج، هند", country: "India", code: "INSBI-IW", isPort: true, portName: "Sahibganj Inland Multimodal Terminal", locationType: "INLAND_WATERWAY", state: "Jharkhand", seaCargo: true, inlandWaterway: true, containerEnabled: true, aliases: ["Sahibganj Inland Port", "NW-1 Sahibganj", "صاحب‌گنج آبراه"] },
    { name: "NW-1 Haldia Multimodal Inland Terminal, WB, IN", persian: "پایانه چندوجهی آبراه ملی ۱ هالدیا، هند", country: "India", code: "INHAL-IW", isPort: true, portName: "Haldia Inland Multimodal Terminal", locationType: "INLAND_WATERWAY", state: "West Bengal", unLocode: "INHAL", seaCargo: true, inlandWaterway: true, containerEnabled: true, aliases: ["Haldia Inland Terminal", "NW-1 Haldia", "هالدیا آبراه"] },
    { name: "NW-1 Kalughat Container Terminal (Patna), Bihar, IN", persian: "پایانه کانتینری کالوگهات پتنه (آبراه ملی ۱)، هند", country: "India", code: "INPAT-IW", isPort: true, portName: "Kalughat Container Terminal Patna", locationType: "INLAND_WATERWAY", state: "Bihar", unLocode: "INPAT", seaCargo: true, inlandWaterway: true, containerEnabled: true, aliases: ["Kalughat Patna", "NW-1 Kalughat", "پتنه آبراه"] },
    { name: "NW-2 Pandu Inland River Port (Guwahati), Assam, IN", persian: "بندر رودخانه‌ای پاندو گواتی (آبراه ملی ۲)، هند", country: "India", code: "INGAU-IW", isPort: true, portName: "Pandu River Port Guwahati", locationType: "INLAND_WATERWAY", state: "Assam", unLocode: "INGAU", seaCargo: true, inlandWaterway: true, containerEnabled: true, aliases: ["Pandu Port", "NW-2 Pandu", "پاندو آبراه"] },
    { name: "NW-2 Dhubri Inland River Port, Assam, IN", persian: "بندر رودخانه‌ای دوبری (آبراه ملی ۲)، هند", country: "India", code: "INDHB-IW", isPort: true, portName: "Dhubri River Port", locationType: "INLAND_WATERWAY", state: "Assam", seaCargo: true, inlandWaterway: true, aliases: ["Dhubri Port", "NW-2 Dhubri", "دوبری آبراه"] },

    // 🇮🇳 INDIA — INTERNATIONAL & CUSTOMS AIRPORTS (AIR CARGO)
    { name: "New Delhi — Indira Gandhi Intl Airport (DEL / IGI / INDEL), IN", persian: "میدان هوایی بین‌المللی دهلی نو (IGI / دهلی)، هند", country: "India", code: "DEL", locationType: "AIRPORT_INTERNATIONAL", state: "Delhi", district: "New Delhi", iataCode: "DEL", unLocode: "INDEL", customsCode: "INDEL4", airCargo: true, cargoEnabled: true, aliases: "New Delhi, New Delhi Airport, Delhi Airport, IGI, IGI Airport, Indira Gandhi, Cargo Terminal Delhi, INDEL" },
    { name: "Delhi — Indira Gandhi Intl Airport (DEL / INDEL), IN", persian: "میدان هوایی بین‌المللی دهلی (IGI)، هند", country: "India", code: "DEL", locationType: "AIRPORT_INTERNATIONAL", state: "Delhi", district: "New Delhi", iataCode: "DEL", unLocode: "INDEL", customsCode: "INDEL4", airCargo: true, cargoEnabled: true, aliases: "New Delhi, New Delhi Airport, Delhi Airport, IGI, IGI Airport, Indira Gandhi, INDEL" },
    { name: "Mumbai — Chhatrapati Shivaji Maharaj Intl Airport (BOM / INBOM), IN", persian: "میدان هوایی بین‌المللی ممبئی (CSMIA)، هند", country: "India", code: "BOM", locationType: "AIRPORT_INTERNATIONAL", state: "Maharashtra", iataCode: "BOM", unLocode: "INBOM", customsCode: "INBOM4", airCargo: true, cargoEnabled: true, aliases: "Bombay Airport, Mumbai Cargo, CSMIA" },
    { name: "Bengaluru — Kempegowda Intl Airport (BLR / INBLR), IN", persian: "میدان هوایی بین‌المللی بنگلور (KIA)، هند", country: "India", code: "BLR", locationType: "AIRPORT_INTERNATIONAL", state: "Karnataka", iataCode: "BLR", unLocode: "INBLR", customsCode: "INBLR4", airCargo: true, cargoEnabled: true },
    { name: "Hyderabad — Rajiv Gandhi Intl Airport (HYD / INHYD), IN", persian: "میدان هوایی بین‌المللی حیدرآباد (RGIA)، هند", country: "India", code: "HYD", locationType: "AIRPORT_INTERNATIONAL", state: "Telangana", iataCode: "HYD", unLocode: "INHYD", customsCode: "INHYD4", airCargo: true, cargoEnabled: true },
    { name: "Chennai International Airport (MAA / INMAA), IN", persian: "میدان هوایی بین‌المللی چنای، هند", country: "India", code: "MAA", locationType: "AIRPORT_INTERNATIONAL", state: "Tamil Nadu", iataCode: "MAA", unLocode: "INMAA", customsCode: "INMAA4", airCargo: true, cargoEnabled: true },
    { name: "Kolkata — Netaji Subhas Chandra Bose Intl Airport (CCU / INCCU), IN", persian: "میدان هوایی بین‌المللی کلکته (NSCBIA)، هند", country: "India", code: "CCU", locationType: "AIRPORT_INTERNATIONAL", state: "West Bengal", iataCode: "CCU", unLocode: "INCCU", customsCode: "INCCU4", airCargo: true, cargoEnabled: true },
    { name: "Ahmedabad — Sardar Vallabhbhai Patel Intl Airport (AMD / INAMD), IN", persian: "میدان هوایی بین‌المللی احمدآباد، هند", country: "India", code: "AMD", locationType: "AIRPORT_INTERNATIONAL", state: "Gujarat", iataCode: "AMD", unLocode: "INAMD", customsCode: "INAMD4", airCargo: true, cargoEnabled: true },
    { name: "Kochi — Cochin International Airport (COK / INCOK), IN", persian: "میدان هوایی بین‌المللی کوچین، هند", country: "India", code: "COK", locationType: "AIRPORT_INTERNATIONAL", state: "Kerala", iataCode: "COK", unLocode: "INCOK", customsCode: "INCOK4", airCargo: true, cargoEnabled: true },
    { name: "Goa — Manohar Intl Airport (Mopa / GOX), IN", persian: "میدان هوایی بین‌المللی موپا، گوا، هند", country: "India", code: "GOX", locationType: "AIRPORT_INTERNATIONAL", state: "Goa", iataCode: "GOX", unLocode: "INGOX", airCargo: true },
    { name: "Goa — Dabolim Airport (GOI / INGOI), IN", persian: "میدان هوایی دابولیم، گوا، هند", country: "India", code: "GOI", locationType: "AIRPORT_INTERNATIONAL", state: "Goa", iataCode: "GOI", unLocode: "INGOI", airCargo: true },
    { name: "Pune International Airport (PNQ / INPNQ), IN", persian: "میدان هوایی بین‌المللی پونا، هند", country: "India", code: "PNQ", locationType: "AIRPORT_CUSTOMS", state: "Maharashtra", iataCode: "PNQ", unLocode: "INPNQ", airCargo: true },
    { name: "Jaipur International Airport (JAI / INJAI), IN", persian: "میدان هوایی بین‌المللی جیپور، هند", country: "India", code: "JAI", locationType: "AIRPORT_INTERNATIONAL", state: "Rajasthan", iataCode: "JAI", unLocode: "INJAI", airCargo: true },
    { name: "Lucknow — Chaudhary Charan Singh Intl Airport (LKO / INLKO), IN", persian: "میدان هوایی بین‌المللی لکهنو، هند", country: "India", code: "LKO", locationType: "AIRPORT_INTERNATIONAL", state: "Uttar Pradesh", iataCode: "LKO", unLocode: "INLKO", airCargo: true },
    { name: "Amritsar — Sri Guru Ram Dass Jee Intl Airport (ATQ / INATQ), IN", persian: "میدان هوایی بین‌المللی امریتسر، هند", country: "India", code: "ATQ", locationType: "AIRPORT_INTERNATIONAL", state: "Punjab", iataCode: "ATQ", unLocode: "INATQ", customsCode: "INATQ4", airCargo: true },
    { name: "Varanasi — Lal Bahadur Shastri Intl Airport (VNS / INVNS), IN", persian: "میدان هوایی بین‌المللی واراناسی، هند", country: "India", code: "VNS", locationType: "AIRPORT_INTERNATIONAL", state: "Uttar Pradesh", iataCode: "VNS", unLocode: "INVNS", airCargo: true },
    { name: "Guwahati — Lokpriya Gopinath Bordoloi Intl Airport (GAU / INGAU), IN", persian: "میدان هوایی بین‌المللی گواتی، هند", country: "India", code: "GAU", locationType: "AIRPORT_INTERNATIONAL", state: "Assam", iataCode: "GAU", unLocode: "INGAU", airCargo: true },
    { name: "Kozhikode — Calicut International Airport (CCJ / INCCJ), IN", persian: "میدان هوایی بین‌المللی کالیکوت (کوزیکود)، هند", country: "India", code: "CCJ", locationType: "AIRPORT_INTERNATIONAL", state: "Kerala", iataCode: "CCJ", unLocode: "INCCJ", airCargo: true },
    { name: "Thiruvananthapuram International Airport (TRV / INTRV), IN", persian: "میدان هوایی بین‌المللی تریواندروم، هند", country: "India", code: "TRV", locationType: "AIRPORT_INTERNATIONAL", state: "Kerala", iataCode: "TRV", unLocode: "INTRV", airCargo: true },
    { name: "Tiruchirappalli International Airport (TRZ / INTRZ), IN", persian: "میدان هوایی بین‌المللی تیروچیراپالی، هند", country: "India", code: "TRZ", locationType: "AIRPORT_INTERNATIONAL", state: "Tamil Nadu", iataCode: "TRZ", unLocode: "INTRZ", airCargo: true },
    { name: "Mangaluru International Airport (IXE / INIXE), IN", persian: "میدان هوایی بین‌المللی منگلور، هند", country: "India", code: "IXE", locationType: "AIRPORT_INTERNATIONAL", state: "Karnataka", iataCode: "IXE", unLocode: "INIXE", airCargo: true },
    { name: "Kannur International Airport (CNN / INCNN), IN", persian: "میدان هوایی بین‌المللی کانور، هند", country: "India", code: "CNN", locationType: "AIRPORT_INTERNATIONAL", state: "Kerala", iataCode: "CNN", unLocode: "INCNN", airCargo: true },
    { name: "Bhubaneswar — Biju Patnaik Intl Airport (BBI / INBBI), IN", persian: "میدان هوایی بین‌المللی بوبانسوار، هند", country: "India", code: "BBI", locationType: "AIRPORT_INTERNATIONAL", state: "Odisha", iataCode: "BBI", unLocode: "INBBI", airCargo: true },
    { name: "Patna — Jay Prakash Narayan Airport (PAT / INPAT), IN", persian: "میدان هوایی پتنه، هند", country: "India", code: "PAT", locationType: "AIRPORT_CUSTOMS", state: "Bihar", iataCode: "PAT", unLocode: "INPAT" },
    { name: "Raipur — Swami Vivekananda Airport (RPR / INRPR), IN", persian: "میدان هوایی رایپور، هند", country: "India", code: "RPR", locationType: "AIRPORT_DOMESTIC", state: "Chhattisgarh", iataCode: "RPR", unLocode: "INRPR" },
    { name: "Srinagar International Airport (SXR / INSXR), IN", persian: "میدان هوایی بین‌المللی سرینگر (کشمیر)، هند", country: "India", code: "SXR", locationType: "AIRPORT_INTERNATIONAL", state: "Jammu and Kashmir", iataCode: "SXR", unLocode: "INSXR", airCargo: true },
    { name: "Nagpur — Dr. Babasaheb Ambedkar Intl Airport (NAG / INNAG), IN", persian: "میدان هوایی بین‌المللی ناگپور (MIHAN)، هند", country: "India", code: "NAG", locationType: "AIRPORT_INTERNATIONAL", state: "Maharashtra", iataCode: "NAG", unLocode: "INNAG", airCargo: true },
    { name: "Chandigarh International Airport (IXC / INIXC), IN", persian: "میدان هوایی بین‌المللی چندیگر، هند", country: "India", code: "IXC", locationType: "AIRPORT_CUSTOMS", state: "Punjab / Chandigarh", iataCode: "IXC", unLocode: "INIXC", airCargo: true },
    { name: "Port Blair — Veer Savarkar Intl Airport (IXZ / INIXZ), IN", persian: "میدان هوایی پورت بلیر (جزایر آندامان)، هند", country: "India", code: "IXZ", locationType: "AIRPORT_INTERNATIONAL", state: "Andaman and Nicobar", iataCode: "IXZ", unLocode: "INIXZ" },
    { name: "Bagdogra Airport (IXB / INIXB), West Bengal, IN", persian: "میدان هوایی باگدوگرا (سیلیگوری)، هند", country: "India", code: "IXB", locationType: "AIRPORT_CUSTOMS", state: "West Bengal", iataCode: "IXB", unLocode: "INIXB" },
    { name: "Gaya International Airport (GAY / INGAY), IN", persian: "میدان هوایی بین‌المللی گایا، هند", country: "India", code: "GAY", locationType: "AIRPORT_INTERNATIONAL", state: "Bihar", iataCode: "GAY", unLocode: "INGAY" },
    { name: "Madurai Airport (IXM / INIXM), IN", persian: "میدان هوایی مادورای، هند", country: "India", code: "IXM", locationType: "AIRPORT_CUSTOMS", state: "Tamil Nadu", iataCode: "IXM", unLocode: "INIXM", airCargo: true },
    { name: "Coimbatore International Airport (CJB / INCJB), IN", persian: "میدان هوایی بین‌المللی کویمباتور، هند", country: "India", code: "CJB", locationType: "AIRPORT_INTERNATIONAL", state: "Tamil Nadu", iataCode: "CJB", unLocode: "INCJB", airCargo: true },
    { name: "Surat International Airport (STV / INSTV), IN", persian: "میدان هوایی بین‌المللی سورت، هند", country: "India", code: "STV", locationType: "AIRPORT_INTERNATIONAL", state: "Gujarat", iataCode: "STV", unLocode: "INSTV", airCargo: true },
    { name: "Tirupati International Airport (TIR / INTIR), IN", persian: "میدان هوایی بین‌المللی تیروپاتی، هند", country: "India", code: "TIR", locationType: "AIRPORT_INTERNATIONAL", state: "Andhra Pradesh", iataCode: "TIR", unLocode: "INTIR" },
    { name: "Vijayawada International Airport (VGA / INVGA), IN", persian: "میدان هوایی بین‌المللی ویجیاوادا، هند", country: "India", code: "VGA", locationType: "AIRPORT_INTERNATIONAL", state: "Andhra Pradesh", iataCode: "VGA", unLocode: "INVGA", airCargo: true },
    { name: "Visakhapatnam International Airport (VTZ / INVTZ), IN", persian: "میدان هوایی بین‌المللی ویساکاپاتنام، هند", country: "India", code: "VTZ-AIR", locationType: "AIRPORT_INTERNATIONAL", state: "Andhra Pradesh", iataCode: "VTZ", unLocode: "INVTZ", airCargo: true },
    { name: "Indore — Devi Ahilya Bai Holkar Intl Airport (IDR / INIDR), IN", persian: "میدان هوایی بین‌المللی ایندور، هند", country: "India", code: "IDR", locationType: "AIRPORT_INTERNATIONAL", state: "Madhya Pradesh", iataCode: "IDR", unLocode: "INIDR", airCargo: true },

    // 🇮🇳 INDIA — OPERATIONAL DOMESTIC CARGO & CIVIL AIRPORTS
    { name: "Agartala Airport (MBB / IXA), Tripura, IN", persian: "میدان هوایی آگارتالا، هند", country: "India", code: "IXA", locationType: "AIRPORT_DOMESTIC", state: "Tripura", iataCode: "IXA" },
    { name: "Agatti Airport (AGX), Lakshadweep, IN", persian: "میدان هوایی آگاتی (لاکشادویپ)، هند", country: "India", code: "AGX", locationType: "AIRPORT_DOMESTIC", state: "Lakshadweep", iataCode: "AGX" },
    { name: "Aurangabad Airport (IXU), Maharashtra, IN", persian: "میدان هوایی اورنگ‌آباد (سامباجی‌نگر)، هند", country: "India", code: "IXU", locationType: "AIRPORT_DOMESTIC", state: "Maharashtra", iataCode: "IXU" },
    { name: "Bhopal — Raja Bhoj Airport (BHO), MP, IN", persian: "میدان هوایی راجا بوج (بوپال)، هند", country: "India", code: "BHO", locationType: "AIRPORT_DOMESTIC", state: "Madhya Pradesh", iataCode: "BHO" },
    { name: "Dehradun — Jolly Grant Airport (DED), Uttarakhand, IN", persian: "میدان هوایی دهرادون، هند", country: "India", code: "DED", locationType: "AIRPORT_DOMESTIC", state: "Uttarakhand", iataCode: "DED" },
    { name: "Dibrugarh Airport (DIB), Assam, IN", persian: "میدان هوایی دیبروگار، هند", country: "India", code: "DIB", locationType: "AIRPORT_DOMESTIC", state: "Assam", iataCode: "DIB" },
    { name: "Dimapur Airport (DMU), Nagaland, IN", persian: "میدان هوایی دیماپور، هند", country: "India", code: "DMU", locationType: "AIRPORT_DOMESTIC", state: "Nagaland", iataCode: "DMU" },
    { name: "Hubballi Airport (HBX), Karnataka, IN", persian: "میدان هوایی هوبلی، هند", country: "India", code: "HBX", locationType: "AIRPORT_DOMESTIC", state: "Karnataka", iataCode: "HBX" },
    { name: "Imphal — Bir Tikendrajit Airport (IMF), Manipur, IN", persian: "میدان هوایی ایمفال، هند", country: "India", code: "IMF", locationType: "AIRPORT_DOMESTIC", state: "Manipur", iataCode: "IMF" },
    { name: "Jabalpur Airport (JLR), MP, IN", persian: "میدان هوایی جبل‌پور، هند", country: "India", code: "JLR", locationType: "AIRPORT_DOMESTIC", state: "Madhya Pradesh", iataCode: "JLR" },
    { name: "Jaisalmer Airport (JSA), Rajasthan, IN", persian: "میدان هوایی جیسلمیر، هند", country: "India", code: "JSA", locationType: "AIRPORT_DOMESTIC", state: "Rajasthan", iataCode: "JSA" },
    { name: "Jammu Airport (IXJ), J&K, IN", persian: "میدان هوایی جمو، هند", country: "India", code: "IXJ", locationType: "AIRPORT_DOMESTIC", state: "Jammu and Kashmir", iataCode: "IXJ" },
    { name: "Jodhpur Airport (JDH), Rajasthan, IN", persian: "میدان هوایی جودپور، هند", country: "India", code: "JDH", locationType: "AIRPORT_DOMESTIC", state: "Rajasthan", iataCode: "JDH" },
    { name: "Kanpur Airport (KNU / Chakeri), UP, IN", persian: "میدان هوایی کانپور، هند", country: "India", code: "KNU", locationType: "AIRPORT_DOMESTIC", state: "Uttar Pradesh", iataCode: "KNU" },
    { name: "Khajuraho Airport (HJR), MP, IN", persian: "میدان هوایی خاجوراهو، هند", country: "India", code: "HJR", locationType: "AIRPORT_DOMESTIC", state: "Madhya Pradesh", iataCode: "HJR" },
    { name: "Kullu Manali Airport (KUU / Bhuntar), HP, IN", persian: "میدان هوایی کولو مانالی، هند", country: "India", code: "KUU", locationType: "AIRPORT_DOMESTIC", state: "Himachal Pradesh", iataCode: "KUU" },
    { name: "Leh — Kushok Bakula Rimpochee Airport (IXL), Ladakh, IN", persian: "میدان هوایی لیه (لداخ)، هند", country: "India", code: "IXL", locationType: "AIRPORT_DOMESTIC", state: "Ladakh", iataCode: "IXL" },
    { name: "Lilabari Airport (IXI), Assam, IN", persian: "میدان هوایی لیلاباری، هند", country: "India", code: "IXI", locationType: "AIRPORT_DOMESTIC", state: "Assam", iataCode: "IXI" },
    { name: "Ludhiana — Sahnewal Airport (LUH), Punjab, IN", persian: "میدان هوایی لودیانا، هند", country: "India", code: "LUH", locationType: "AIRPORT_DOMESTIC", state: "Punjab", iataCode: "LUH" },
    { name: "Mysuru — Mandakalli Airport (MYQ), Karnataka, IN", persian: "میدان هوایی میسور، هند", country: "India", code: "MYQ", locationType: "AIRPORT_DOMESTIC", state: "Karnataka", iataCode: "MYQ" },
    { name: "Pantnagar Airport (PGH), Uttarakhand, IN", persian: "میدان هوایی پنت‌نگر، هند", country: "India", code: "PGH", locationType: "AIRPORT_DOMESTIC", state: "Uttarakhand", iataCode: "PGH" },
    { name: "Pondicherry Airport (PNY), Puducherry, IN", persian: "میدان هوایی پوندیچری، هند", country: "India", code: "PNY", locationType: "AIRPORT_DOMESTIC", state: "Puducherry", iataCode: "PNY" },
    { name: "Porbandar Airport (PBD), Gujarat, IN", persian: "میدان هوایی پوربندر، هند", country: "India", code: "PBD", locationType: "AIRPORT_DOMESTIC", state: "Gujarat", iataCode: "PBD" },
    { name: "Rajahmundry Airport (RJA), AP, IN", persian: "میدان هوایی راجاهموندری، هند", country: "India", code: "RJA", locationType: "AIRPORT_DOMESTIC", state: "Andhra Pradesh", iataCode: "RJA" },
    { name: "Rajkot International Airport (Hirasar / HSR), Gujarat, IN", persian: "میدان هوایی بین‌المللی راجکوت (هیراسار)، هند", country: "India", code: "HSR", locationType: "AIRPORT_DOMESTIC", state: "Gujarat", iataCode: "HSR" },
    { name: "Ranchi — Birsa Munda Airport (IXR), Jharkhand, IN", persian: "میدان هوایی رانچی، هند", country: "India", code: "IXR", locationType: "AIRPORT_DOMESTIC", state: "Jharkhand", iataCode: "IXR" },
    { name: "Shillong — Umroi Airport (SHL), Meghalaya, IN", persian: "میدان هوایی شیلانگ، هند", country: "India", code: "SHL", locationType: "AIRPORT_DOMESTIC", state: "Meghalaya", iataCode: "SHL" },
    { name: "Shimla Airport (SLV / Jubbarhatti), HP, IN", persian: "میدان هوایی شیملا، هند", country: "India", code: "SLV", locationType: "AIRPORT_DOMESTIC", state: "Himachal Pradesh", iataCode: "SLV" },
    { name: "Shirdi Airport (SAG), Maharashtra, IN", persian: "میدان هوایی شیردی، هند", country: "India", code: "SAG", locationType: "AIRPORT_DOMESTIC", state: "Maharashtra", iataCode: "SAG" },
    { name: "Tezpur Airport (TEZ), Assam, IN", persian: "میدان هوایی تزپور، هند", country: "India", code: "TEZ", locationType: "AIRPORT_DOMESTIC", state: "Assam", iataCode: "TEZ" },
    { name: "Tezu Airport (TEI), Arunachal Pradesh, IN", persian: "میدان هوایی تزو، هند", country: "India", code: "TEI", locationType: "AIRPORT_DOMESTIC", state: "Arunachal Pradesh", iataCode: "TEI" },
    { name: "Udaipur — Maharana Pratap Airport (UDR), Rajasthan, IN", persian: "میدان هوایی اودیپور، هند", country: "India", code: "UDR", locationType: "AIRPORT_DOMESTIC", state: "Rajasthan", iataCode: "UDR" },
    { name: "Vadodara Airport (BDQ), Gujarat, IN", persian: "میدان هوایی وادودارا، هند", country: "India", code: "BDQ", locationType: "AIRPORT_DOMESTIC", state: "Gujarat", iataCode: "BDQ" },

    // 🇮🇳 INDIA — INLAND CONTAINER DEPOTS (ICD) & RAIL CONTAINER TERMINALS (CONCOR)
    { name: "ICD Tughlakabad (TKD / CONCOR Delhi), IN", persian: "پایانه کانتینری خشکی توغلق‌آباد دهلی (بزرگترین ICD هند)", country: "India", code: "INTKD", locationType: "ICD", state: "Delhi", customsCode: "INTKD6", unLocode: "INTKD", containerEnabled: true, railConnected: true, cargoEnabled: true },
    { name: "ICD Dadri (DER / CONCOR Greater Noida), UP, IN", persian: "پایانه کانتینری دادری (نویدا / DFC)، هند", country: "India", code: "INDER", locationType: "ICD", state: "Uttar Pradesh", customsCode: "INDER6", containerEnabled: true, railConnected: true, cargoEnabled: true },
    { name: "ICD Patparganj (PPG / East Delhi), IN", persian: "پایانه کانتینری پتپرگنج دهلی، هند", country: "India", code: "INPPG", locationType: "ICD", state: "Delhi", customsCode: "INPPG6", containerEnabled: true },
    { name: "ICD Garhi Harsaru (GHR / Gateway Distriparks Gurugram), Haryana, IN", persian: "پایانه کانتینری گارهی هارسارو (گورگان)، هند", country: "India", code: "INGHR", locationType: "ICD", state: "Haryana", customsCode: "INGHR6", containerEnabled: true, railConnected: true },
    { name: "ICD Rewari (CONCOR Haryana), IN", persian: "پایانه کانتینری ریواری، هند", country: "India", code: "INREW", locationType: "ICD", state: "Haryana", containerEnabled: true, railConnected: true },
    { name: "ICD Kanakpura (KNK / CONCOR Jaipur), Rajasthan, IN", persian: "پایانه کانتینری کاناکپورا (جیپور)، هند", country: "India", code: "INKNK", locationType: "ICD", state: "Rajasthan", customsCode: "INKNK6", containerEnabled: true, railConnected: true },
    { name: "ICD Sabarmati / Khodiyar (SBI / CONCOR Ahmedabad), Gujarat, IN", persian: "پایانه کانتینری سابرماتی (احمدآباد)، هند", country: "India", code: "INSBI", locationType: "ICD", state: "Gujarat", customsCode: "INSBI6", containerEnabled: true, railConnected: true },
    { name: "ICD Ludhiana (LDH / Dhandari Kalan CONCOR), Punjab, IN", persian: "پایانه کانتینری لودیانا (دانداری کالان پنجاب)، هند", country: "India", code: "INLDH", locationType: "ICD", state: "Punjab", customsCode: "INLDH6", containerEnabled: true, railConnected: true },
    { name: "ICD Amritsar / Khasa (ASR / CONCOR Punjab), IN", persian: "پایانه کانتینری امریتسر (خاسا)، هند", country: "India", code: "INASR", locationType: "ICD", state: "Punjab", customsCode: "INASR6", containerEnabled: true, railConnected: true },
    { name: "ICD Jaipur / Sanganer, Rajasthan, IN", persian: "پایانه کانتینری سانگانر (جیپور)، هند", country: "India", code: "INJAI6", locationType: "ICD", state: "Rajasthan", customsCode: "INJAI6", containerEnabled: true },
    { name: "ICD Moradabad (MBD / CONCOR UP), IN", persian: "پایانه کانتینری مرادآباد، هند", country: "India", code: "INMBD", locationType: "ICD", state: "Uttar Pradesh", customsCode: "INMBD6", containerEnabled: true, railConnected: true },
    { name: "ICD Kanpur / JRY (Juhi / Chakeri), UP, IN", persian: "پایانه کانتینری کانپور (JRY)، هند", country: "India", code: "INCPC", locationType: "ICD", state: "Uttar Pradesh", customsCode: "INCPC6", containerEnabled: true, railConnected: true },
    { name: "ICD Agra / Jhandi, UP, IN", persian: "پایانه کانتینری آگرا، هند", country: "India", code: "INAGR", locationType: "ICD", state: "Uttar Pradesh", customsCode: "INAGR6", containerEnabled: true },
    { name: "ICD Nagpur / Butibori & MIHAN, MH, IN", persian: "پایانه کانتینری ناگپور (بوتیبوری)، هند", country: "India", code: "INNAG6", locationType: "ICD", state: "Maharashtra", customsCode: "INNAG6", containerEnabled: true, railConnected: true },
    { name: "ICD Pithampur / Dhannad (Indore), MP, IN", persian: "پایانه کانتینری پیتامپور (ایندور)، هند", country: "India", code: "INPTI", locationType: "ICD", state: "Madhya Pradesh", customsCode: "INPTI6", containerEnabled: true, railConnected: true },
    { name: "ICD Raipur / Mandir Hasaud, Chhattisgarh, IN", persian: "پایانه کانتینری رایپور، هند", country: "India", code: "INRPR6", locationType: "ICD", state: "Chhattisgarh", customsCode: "INRPR6", containerEnabled: true, railConnected: true },
    { name: "ICD Sanathnagar / Hyderabad (SNF / CONCOR), Telangana, IN", persian: "پایانه کانتینری سنات‌نگر حیدرآباد، هند", country: "India", code: "INSNF", locationType: "ICD", state: "Telangana", customsCode: "INSNF6", containerEnabled: true, railConnected: true },
    { name: "ICD Whitefield / Bengaluru (WFD / CONCOR), Karnataka, IN", persian: "پایانه کانتینری وایت‌فیلد بنگلور، هند", country: "India", code: "INWFD", locationType: "ICD", state: "Karnataka", customsCode: "INWFD6", containerEnabled: true, railConnected: true },
    { name: "ICD Tondiarpet / Chennai (TNP / CONCOR), Tamil Nadu, IN", persian: "پایانه کانتینری تون‌دیارپت چنای، هند", country: "India", code: "INTNP", locationType: "ICD", state: "Tamil Nadu", customsCode: "INTNP6", containerEnabled: true, railConnected: true },
    { name: "ICD Irugur / Coimbatore (IGU / CONCOR), Tamil Nadu, IN", persian: "پایانه کانتینری ایروگور (کویمباتور)، هند", country: "India", code: "INIGU", locationType: "ICD", state: "Tamil Nadu", customsCode: "INIGU6", containerEnabled: true, railConnected: true },
    { name: "ICD Cossipore / Kolkata (CONCOR), West Bengal, IN", persian: "پایانه کانتینری کوسیپور کلکته، هند", country: "India", code: "INCOSI", locationType: "ICD", state: "West Bengal", containerEnabled: true, railConnected: true },

    // 🇮🇳 INDIA — CONTAINER FREIGHT STATIONS (CFS GATEWAYS)
    { name: "CFS Dronagiri Node (Nhava Sheva / JNPT), Maharashtra, IN", persian: "ایستگاه بارانداز کانتینری درونازیری (نهاوا شوا)، هند", country: "India", code: "CFS-DRN", locationType: "CFS", state: "Maharashtra", district: "Navi Mumbai", containerEnabled: true, roadConnected: true },
    { name: "CFS Seabird Marine Services (Nhava Sheva), Maharashtra, IN", persian: "پایانه بار کانتینری سی‌برد (نهاوا شوا ممبئی)، هند", country: "India", code: "CFS-SBD", locationType: "CFS", state: "Maharashtra", district: "Navi Mumbai", containerEnabled: true },
    { name: "CFS Allcargo Logistics Park (JNPT), Maharashtra, IN", persian: "پارک لجستیک آل‌کارگو (نهاوا شوا)، هند", country: "India", code: "CFS-ACG", locationType: "CFS", state: "Maharashtra", district: "Navi Mumbai", containerEnabled: true },
    { name: "CFS Gateway Distriparks (Nhava Sheva), Maharashtra, IN", persian: "ایستگاه کانتینری گیت‌وی (نهاوا شوا)، هند", country: "India", code: "CFS-GDL", locationType: "CFS", state: "Maharashtra", district: "Navi Mumbai", containerEnabled: true },
    { name: "CFS Adani Logistics (Mundra SEZ), Gujarat, IN", persian: "ایستگاه بار کانتینری آدانی (موندرا)، هند", country: "India", code: "CFS-ADL", locationType: "CFS", state: "Gujarat", district: "Kutch", containerEnabled: true },
    { name: "CFS CWC Mundra, Gujarat, IN", persian: "انبار مرکزی بار کانتینری موندرا، هند", country: "India", code: "CFS-CWC", locationType: "CFS", state: "Gujarat", district: "Kutch", containerEnabled: true },
    { name: "CFS Kandla (CWC / Gandhidham), Gujarat, IN", persian: "ایستگاه کانتینری گاندی‌دام / کاندلا، هند", country: "India", code: "CFS-KDL", locationType: "CFS", state: "Gujarat", district: "Kutch", containerEnabled: true },
    { name: "CFS Manali / Thiruvottiyur (Chennai Port), Tamil Nadu, IN", persian: "ایستگاه کانتینری منالی چنای، هند", country: "India", code: "CFS-MNL", locationType: "CFS", state: "Tamil Nadu", district: "Chennai", containerEnabled: true },
    { name: "CFS Sattva Logistics (Chennai / Kattupalli), Tamil Nadu, IN", persian: "ایستگاه کانتینری ساتوا (چنای)، هند", country: "India", code: "CFS-STV", locationType: "CFS", state: "Tamil Nadu", district: "Tiruvallur", containerEnabled: true },
    { name: "CFS Tuticorin (St. John / Pearl City), Tamil Nadu, IN", persian: "ایستگاه کانتینری توتیکورین، هند", country: "India", code: "CFS-TUT", locationType: "CFS", state: "Tamil Nadu", district: "Thoothukudi", containerEnabled: true },
    { name: "CFS Vallarpadam / Willingdon Island (Cochin), Kerala, IN", persian: "ایستگاه کانتینری کوچین، هند", country: "India", code: "CFS-COK", locationType: "CFS", state: "Kerala", district: "Ernakulam", containerEnabled: true },
    { name: "CFS Haldia / Kolkata Dock (Balmer Lawrie / CWC), WB, IN", persian: "ایستگاه بار کانتینری هالدیا کلکته، هند", country: "India", code: "CFS-HLD", locationType: "CFS", state: "West Bengal", district: "Purba Medinipur", containerEnabled: true },
    { name: "CFS Visakhapatnam (VPA / CONCOR CFS), AP, IN", persian: "ایستگاه کانتینری ویزگ، هند", country: "India", code: "CFS-VTZ", locationType: "CFS", state: "Andhra Pradesh", district: "Visakhapatnam", containerEnabled: true },

    // 🇮🇳 INDIA — INLAND WATERWAYS & MULTIMODAL TERMINALS (IWAI)
    { name: "Varanasi Multimodal Terminal (MMT Varanasi / NW-1), UP, IN", persian: "پایانه چندوجهی آبراه ملی ۱ واراناسی (گنگ)، هند", country: "India", code: "INVAR-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Uttar Pradesh", district: "Varanasi", inlandWaterway: true, railConnected: true, roadConnected: true, cargoEnabled: true },
    { name: "Sahibganj Multimodal Terminal (MMT Sahibganj / NW-1), Jharkhand, IN", persian: "پایانه آبراه چندوجهی صاحب‌گنج (گنگ)، هند", country: "India", code: "INSBG-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Jharkhand", district: "Sahibganj", inlandWaterway: true, railConnected: true, roadConnected: true, cargoEnabled: true },
    { name: "Haldia Multimodal Terminal (MMT Haldia / NW-1), WB, IN", persian: "پایانه چندوجهی آبراه هالدیا (هوگلی)، هند", country: "India", code: "INHAL-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "West Bengal", district: "Purba Medinipur", inlandWaterway: true, railConnected: true, roadConnected: true, cargoEnabled: true },
    { name: "Kalughat Intermodal Terminal (Saran / NW-1), Bihar, IN", persian: "پایانه آبراه کلوگهات (ساران / بهار)، هند", country: "India", code: "INKAL-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Bihar", district: "Saran", inlandWaterway: true, containerEnabled: true, roadConnected: true },
    { name: "Gaighat Cargo Terminal (Patna / NW-1), Bihar, IN", persian: "پایانه باربری گای‌گهات پتنه (آبراه گنگ)، هند", country: "India", code: "INPAT-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Bihar", district: "Patna", inlandWaterway: true, cargoEnabled: true },
    { name: "Farakka Navigational Lock & Terminal (NW-1), WB, IN", persian: "پایانه و سد آبراه فاراکا، هند", country: "India", code: "INFRK-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "West Bengal", district: "Murshidabad", inlandWaterway: true },
    { name: "Pandu Multimodal Terminal (Guwahati / NW-2), Assam, IN", persian: "پایانه چندوجهی پاندو گواتی (آبراه براهماپوترا)، هند", country: "India", code: "INGAU-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Assam", district: "Kamrup", inlandWaterway: true, railConnected: true, roadConnected: true },
    { name: "Dhubri River Terminal (NW-2), Assam, IN", persian: "پایانه رودخانه‌ای دوبری (مرز بنگلادش)، هند", country: "India", code: "INDHB-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Assam", district: "Dhubri", borderCountry: "Bangladesh", inlandWaterway: true, isBorder: true },
    { name: "Jogighopa Multimodal Logistics Park (MMLP / NW-2), Assam, IN", persian: "پارک لجستیک چندوجهی جوگیگوپا، هند", country: "India", code: "INJGH-MMT", locationType: "MULTIMODAL_TERMINAL", state: "Assam", district: "Bongaigaon", inlandWaterway: true, railConnected: true, roadConnected: true },
    { name: "Prayagraj Terminal (Allahabad / NW-1), UP, IN", persian: "پایانه آبراه پرایاگ‌راج (الله‌آباد)، هند", country: "India", code: "INPRG-MMT", locationType: "INLAND_WATERWAY_TERMINAL", state: "Uttar Pradesh", district: "Prayagraj", inlandWaterway: true },

    // Indian Subcontinent Neighbours
    { name: "Colombo Port, LK", persian: "بندر کلمبو، سری‌لانکا", country: "Sri Lanka", code: "CMB", isPort: true, portName: "Port of Colombo" },
    { name: "Chittagong Port, BD", persian: "بندر چتاگانگ، بنگلادش", country: "Bangladesh", code: "CGP", isPort: true, portName: "Chittagong Port" },

    // China & East Asia
    { name: "Shanghai Port (Yangshan), CN", persian: "بندر شانگهای، چین", country: "China", code: "SHA", isPort: true, portName: "Shanghai Port" },
    { name: "Ningbo-Zhoushan Port, CN", persian: "بندر نینگبو، چین", country: "China", code: "NBO", isPort: true, portName: "Ningbo-Zhoushan Port" },
    { name: "Shenzhen (Yantian/Shekou), CN", persian: "بندر شنژن (یانتیان)، چین", country: "China", code: "SZX", isPort: true, portName: "Shenzhen Port" },
    { name: "Guangzhou Port (Nansha), CN", persian: "بندر گوانجو (نانشا)، چین", country: "China", code: "GZU", isPort: true, portName: "Guangzhou Port" },
    { name: "Qingdao Port, CN", persian: "بندر چینگدائو، چین", country: "China", code: "TAO", isPort: true, portName: "Qingdao Port" },
    { name: "Tianjin Port, CN", persian: "بندر تیانجین، چین", country: "China", code: "TSN", isPort: true, portName: "Tianjin Port" },
    { name: "Xiamen Port, CN", persian: "بندر شیامن، چین", country: "China", code: "XMN", isPort: true, portName: "Xiamen Port" },
    { name: "Hong Kong Port, HK", persian: "بندر هنگ کنگ", country: "China", code: "HKG", isPort: true, portName: "Port of Hong Kong" },
    { name: "Busan Port, KR", persian: "بندر بوسان، کوریای جنوبی", country: "South Korea", code: "PUS", isPort: true, portName: "Busan Port" },
    { name: "Incheon Port, KR", persian: "بندر اینچئون، کوریای جنوبی", country: "South Korea", code: "ICN", isPort: true, portName: "Incheon Port" },
    { name: "Tokyo / Yokohama Port, JP", persian: "بندر توکیو / یوکوهاما، جاپان", country: "Japan", code: "TYO", isPort: true, portName: "Tokyo / Yokohama Port" },
    { name: "Kobe Port, JP", persian: "بندر کوبه، جاپان", country: "Japan", code: "UKB", isPort: true, portName: "Kobe Port" },

    // Southeast Asia
    { name: "Singapore Port (PSA), SG", persian: "بندر سنگاپور", country: "Singapore", code: "SIN", isPort: true, portName: "Port of Singapore" },
    { name: "Port Klang, MY", persian: "بندر کلانگ، مالزی", country: "Malaysia", code: "PKG", isPort: true, portName: "Port Klang" },
    { name: "Tanjung Pelepas Port, MY", persian: "بندر تانجونگ پلپاس، مالزی", country: "Malaysia", code: "TPP", isPort: true, portName: "Port of Tanjung Pelepas" },
    { name: "Laem Chabang Port, TH", persian: "بندر لئم چابانگ، تایلند", country: "Thailand", code: "LCH", isPort: true, portName: "Laem Chabang Port" },
    { name: "Bangkok Port, TH", persian: "بندر بانکوک، تایلند", country: "Thailand", code: "BKK", isPort: true, portName: "Bangkok Port" },
    { name: "Tanjung Priok (Jakarta), ID", persian: "بندر جاکارتا، اندونزیا", country: "Indonesia", code: "JKT", isPort: true, portName: "Tanjung Priok Port" },
    { name: "Manila Port, PH", persian: "بندر مانیل، فیلیپین", country: "Philippines", code: "MNL", isPort: true, portName: "Port of Manila" },
    { name: "Hai Phong Port, VN", persian: "بندر های فونگ، ویتنام", country: "Vietnam", code: "HPH", isPort: true, portName: "Hai Phong Port" },
    { name: "Cai Mep Port (Vung Tau), VN", persian: "بندر کای مپ، ویتنام", country: "Vietnam", code: "VUT", isPort: true, portName: "Cai Mep Port" },

    // Turkey - Ports & Cities
    { name: "Mersin Port, TR", persian: "بندر مرسین، ترکیه", country: "Turkey", code: "MRS", isPort: true, portName: "Mersin International Port" },
    { name: "Ambarli Port (Istanbul), TR", persian: "بندر امبارلی، استانبول", country: "Turkey", code: "AMB", isPort: true, portName: "Ambarli Port" },
    { name: "Izmir Port, TR", persian: "بندر ازمیر، ترکیه", country: "Turkey", code: "IZM", isPort: true, portName: "Izmir Port" },
    { name: "Iskenderun Port, TR", persian: "بندر اسکندرون، ترکیه", country: "Turkey", code: "ISK", isPort: true, portName: "Iskenderun Port" },
    { name: "Samsun Port, TR", persian: "بندر سامسون، ترکیه", country: "Turkey", code: "SAS", isPort: true, portName: "Samsun Port" },
    { name: "Trabzon Port, TR", persian: "بندر ترابزون، ترکیه", country: "Turkey", code: "TRB", isPort: true, portName: "Trabzon Port" },
    { name: "Istanbul, TR", persian: "استانبول، ترکیه", country: "Turkey", code: "IST" },
    { name: "Ankara, TR", persian: "آنکارا، ترکیه", country: "Turkey", code: "ANK" },
    { name: "Gaziantep, TR", persian: "غازی‌عینتاب، ترکیه", country: "Turkey", code: "GZT" },

    // 🇺🇿 UZBEKISTAN — AIRPORTS, RIVER PORTS, ICD & BORDER LOGISTICS
    { name: "Tashkent — Islam Karimov Intl Airport (TAS / UTTT), UZ", persian: "میدان هوایی بین‌المللی تاشکند (اسلام کریموف)، ازبکستان", country: "Uzbekistan", code: "TAS", locationType: "AIRPORT_INTERNATIONAL", state: "Tashkent", iataCode: "TAS", unLocode: "UZTAS", airCargo: true, cargoEnabled: true },
    { name: "Navoi International Airport (NVI / UTSA Cargo Hub), UZ", persian: "میدان هوایی بین‌المللی ناوی (بزرگترین هاب کارگو هوایی آسیای مرکزی)، ازبکستان", country: "Uzbekistan", code: "NVI", locationType: "AIRPORT_INTERNATIONAL", state: "Navoiy", iataCode: "NVI", unLocode: "UZNVI", airCargo: true, cargoEnabled: true },
    { name: "Termez International River Port (TICC / Amu Darya), UZ", persian: "بندر بین‌المللی رودخانه‌ای ترمذ (مرکز لجستیک آمودریا / مرز حیرتان)، ازبکستان", country: "Uzbekistan", code: "TMZ-PORT", isPort: true, portName: "Termez International River Port (TICC)", locationType: "INLAND_WATERWAY_TERMINAL", state: "Surxondaryo", district: "Termez", borderCountry: "Afghanistan", isBorder: true, inlandWaterway: true, railConnected: true, roadConnected: true, containerEnabled: true, cargoEnabled: true },
    { name: "Termez International Airport (TMZ / UTST), UZ", persian: "میدان هوایی بین‌المللی ترمذ (مرز افغانستان)، ازبکستان", country: "Uzbekistan", code: "TMZ", locationType: "AIRPORT_INTERNATIONAL", state: "Surxondaryo", iataCode: "TMZ", unLocode: "UZTMZ", borderCountry: "Afghanistan", isBorder: true, airCargo: true },
    { name: "Samarkand International Airport (SKD / UTSS), UZ", persian: "میدان هوایی بین‌المللی سمرقند (Air Marakanda)، ازبکستان", country: "Uzbekistan", code: "SKD", locationType: "AIRPORT_INTERNATIONAL", state: "Samarkand", iataCode: "SKD", unLocode: "UZSKD", airCargo: true },
    { name: "Bukhara International Airport (BHK / UTSB), UZ", persian: "میدان هوایی بین‌المللی بخارا، ازبکستان", country: "Uzbekistan", code: "BHK", locationType: "AIRPORT_INTERNATIONAL", state: "Bukhara", iataCode: "BHK", unLocode: "UZBHK", airCargo: true },
    { name: "Andijan International Airport (AZN / UTKA), UZ", persian: "میدان هوایی بین‌المللی اندیجان، ازبکستان", country: "Uzbekistan", code: "AZN", locationType: "AIRPORT_INTERNATIONAL", state: "Andijan", iataCode: "AZN", unLocode: "UZAZN", airCargo: true },
    { name: "Fergana International Airport (FEG / UTKF), UZ", persian: "میدان هوایی بین‌المللی فرغانه، ازبکستان", country: "Uzbekistan", code: "FEG", locationType: "AIRPORT_INTERNATIONAL", state: "Fergana", iataCode: "FEG", unLocode: "UZFEG", airCargo: true },
    { name: "Namangan International Airport (NMA / UTKN), UZ", persian: "میدان هوایی بین‌المللی نمنگان، ازبکستان", country: "Uzbekistan", code: "NMA", locationType: "AIRPORT_INTERNATIONAL", state: "Namangan", iataCode: "NMA", unLocode: "UZNMA", airCargo: true },
    { name: "Urgench International Airport (UGC / UTNU), UZ", persian: "میدان هوایی بین‌المللی اورگنچ (خوارزم)، ازبکستان", country: "Uzbekistan", code: "UGC", locationType: "AIRPORT_INTERNATIONAL", state: "Khorezm", iataCode: "UGC", unLocode: "UZUGC", airCargo: true },
    { name: "Nukus Airport (NCU / UTNN), UZ", persian: "میدان هوایی نوکوس (قره‌قالپاقستان)، ازبکستان", country: "Uzbekistan", code: "NCU", locationType: "AIRPORT_DOMESTIC", state: "Karakalpakstan", iataCode: "NCU", unLocode: "UZNCU" },
    { name: "Chukursay Container Terminal (Tashkent ICD / Rail Hub), UZ", persian: "پایانه کانتینری ریل چوقورسای تاشکند (بزرگترین هاب ریلی کانتینری ازبکستان)", country: "Uzbekistan", code: "CHUKUR", locationType: "ICD", state: "Tashkent", railConnected: true, containerEnabled: true, cargoEnabled: true },
    { name: "Sergeli Logistics Center (Tashkent Customs Hub), UZ", persian: "مرکز لجستیک و گمرک سرگیلی تاشکند، ازبکستان", country: "Uzbekistan", code: "SERGELI", locationType: "LOGISTICS_HUB", state: "Tashkent", railConnected: true, containerEnabled: true },
    { name: "Angren Logistics Center (Tashkent Region Dry Port), UZ", persian: "پایانه کانتینری و مرکز لجستیک آنگرن، ازبکستان", country: "Uzbekistan", code: "ANGREN", locationType: "ICD", state: "Tashkent Region", railConnected: true, containerEnabled: true },
    { name: "Hairatan / Termez Friendship Bridge (Border Post), UZ", persian: "پل دوستی ترمذ / حیرتان (گذرگاه ریلی و جاده‌ای افغانستان و ازبکستان)", country: "Uzbekistan", code: "FRND-BRG", locationType: "INTEGRATED_CHECK_POST", state: "Surxondaryo", borderCountry: "Afghanistan", isBorder: true, railConnected: true, roadConnected: true },
    { name: "Alat / Farap Customs Border Crossing, UZ", persian: "گذرگاه مرزی آلات / فاراب (مرز ترکمنستان)، ازبکستان", country: "Uzbekistan", code: "ALAT", locationType: "CUSTOMS_BORDER", state: "Bukhara", borderCountry: "Turkmenistan", isBorder: true, roadConnected: true },
    { name: "Gisht Kuprik / Chernyaevka Customs Border, UZ", persian: "گذرگاه مرزی گیشت کوپریک (مرز قزاقستان)، ازبکستان", country: "Uzbekistan", code: "GISHT", locationType: "CUSTOMS_BORDER", state: "Tashkent Region", borderCountry: "Kazakhstan", isBorder: true, roadConnected: true },
    { name: "Dustlik / Andijan Customs Border, UZ", persian: "گذرگاه مرزی دوستلیک (مرز قرقیزستان)، ازبکستان", country: "Uzbekistan", code: "DSTLK", locationType: "CUSTOMS_BORDER", state: "Andijan", borderCountry: "Kyrgyzstan", isBorder: true, roadConnected: true },
    { name: "Oybek / Bekabad Customs Border, UZ", persian: "گذرگاه مرزی اویبیک (مرز تاجیکستان)، ازبکستان", country: "Uzbekistan", code: "OYBEK", locationType: "CUSTOMS_BORDER", state: "Tashkent Region", borderCountry: "Tajikistan", isBorder: true, roadConnected: true },
    { name: "Tashkent City (Central Logistics Hub), UZ", persian: "شهر تاشکند (مرکز ترانزیت و لجستیک)، ازبکستان", country: "Uzbekistan", code: "TSH", locationType: "LOGISTICS_HUB", state: "Tashkent", roadConnected: true, railConnected: true },
    { name: "Samarkand, UZ", persian: "سمرقند، ازبکستان", country: "Uzbekistan", code: "SMR", locationType: "LOGISTICS_HUB", state: "Samarkand" },
    { name: "Bukhara, UZ", persian: "بخارا، ازبکستان", country: "Uzbekistan", code: "BKH", locationType: "LOGISTICS_HUB", state: "Bukhara" },

    // Central Asia Neighbours
    { name: "Ashgabat, TM", persian: "عشق‌آباد، تركمنستان", country: "Turkmenistan", code: "ASH" },
    { name: "Turkmenbashi Port, TM", persian: "بندر ترکمن‌باشی، تركمنستان", country: "Turkmenistan", code: "TBH", isPort: true, portName: "Turkmenbashi Port" },
    { name: "Dushanbe, TJ", persian: "دوشنبه، تاجیکستان", country: "Tajikistan", code: "DSH" },
    { name: "Bishkek, KG", persian: "بیشکک، قرقیزستان", country: "Kyrgyzstan", code: "BSK" },
    { name: "Almaty, KZ", persian: "آلماتی، قزاقستان", country: "Kazakhstan", code: "ALA" },
    { name: "Aktau Port, KZ", persian: "بندر آکتائو (خزر)، قزاقستان", country: "Kazakhstan", code: "SCO", isPort: true, portName: "Aktau Port" },
    
    // Europe & Americas Major Ports
    { name: "Rotterdam Port, NL", persian: "بندر روتردام، هلند", country: "Netherlands", code: "RTM", isPort: true, portName: "Port of Rotterdam" },
    { name: "Antwerp-Bruges Port, BE", persian: "بندر آنتورپ، بلجیم", country: "Belgium", code: "ANR", isPort: true, portName: "Port of Antwerp-Bruges" },
    { name: "Hamburg Port, DE", persian: "بندر هامبورگ، آلمان", country: "Germany", code: "HAM", isPort: true, portName: "Port of Hamburg" },
    { name: "Bremerhaven Port, DE", persian: "بندر برمرهافن، آلمان", country: "Germany", code: "BRV", isPort: true, portName: "Port of Bremerhaven" },
    { name: "Valencia Port, ES", persian: "بندر والنسیا، اسپانیا", country: "Spain", code: "VLC", isPort: true, portName: "Port of Valencia" },
    { name: "Algeciras Port, ES", persian: "بندر الجسیراس، اسپانیا", country: "Spain", code: "ALG", isPort: true, portName: "Port of Algeciras" },
    { name: "Barcelona Port, ES", persian: "بندر بارسلونا، اسپانیا", country: "Spain", code: "BCN", isPort: true, portName: "Port of Barcelona" },
    { name: "Piraeus Port, GR", persian: "بندر پیرئوس (آتن)، یونان", country: "Greece", code: "PIR", isPort: true, portName: "Port of Piraeus" },
    { name: "Felixstowe Port, UK", persian: "بندر فلیکس‌استو، بریتانیا", country: "United Kingdom", code: "FXT", isPort: true, portName: "Port of Felixstowe" },
    { name: "Southampton Port, UK", persian: "بندر ساوت‌همپتون، بریتانیا", country: "United Kingdom", code: "SOU", isPort: true, portName: "Port of Southampton" },
    { name: "London Gateway, UK", persian: "بندر لندن گیت‌وی، بریتانیا", country: "United Kingdom", code: "LGP", isPort: true, portName: "London Gateway Port" },
    { name: "Le Havre Port, FR", persian: "بندر لو هاور، فرانسه", country: "France", code: "LEH", isPort: true, portName: "Port of Le Havre" },
    { name: "Marseille-Fos Port, FR", persian: "بندر مارسی، فرانسه", country: "France", code: "MRS", isPort: true, portName: "Port of Marseille-Fos" },
    { name: "Genoa Port, IT", persian: "بندر جنوا، ایتالیا", country: "Italy", code: "GOA", isPort: true, portName: "Port of Genoa" },
    { name: "Gdansk Port, PL", persian: "بندر گدانسک، پولند", country: "Poland", code: "GDN", isPort: true, portName: "Port of Gdansk" },
    { name: "Los Angeles Port, US", persian: "بندر لس آنجلس، امریکا", country: "USA", code: "LAX", isPort: true, portName: "Port of Los Angeles" },
    { name: "Long Beach Port, US", persian: "بندر لانگ بیچ، امریکا", country: "USA", code: "LGB", isPort: true, portName: "Port of Long Beach" },
    { name: "New York & New Jersey, US", persian: "بندر نیویورک، امریکا", country: "USA", code: "NYC", isPort: true, portName: "Port of New York & New Jersey" },
    { name: "Houston Port, US", persian: "بندر هیوستون، امریکا", country: "USA", code: "HOU", isPort: true, portName: "Port of Houston" },
    { name: "Savannah Port, US", persian: "بندر ساوانا، امریکا", country: "USA", code: "SAV", isPort: true, portName: "Port of Savannah" },
    { name: "Miami Port, US", persian: "بندر میامی، امریکا", country: "USA", code: "MIA", isPort: true, portName: "Port of Miami" },
    { name: "Vancouver Port, CA", persian: "بندر ونکوور، کانادا", country: "Canada", code: "VAN", isPort: true, portName: "Port of Vancouver" },
    { name: "Montreal Port, CA", persian: "بندر مونترال، کانادا", country: "Canada", code: "MTR", isPort: true, portName: "Port of Montreal" },
    { name: "Santos Port, BR", persian: "بندر سانتوس (سائوپائولو)، برزیل", country: "Brazil", code: "SSZ", isPort: true, portName: "Port of Santos" },
    { name: "Colon Port (Panama Canal), PA", persian: "بندر کولون (کانال پاناما)", country: "Panama", code: "ONX", isPort: true, portName: "Port of Colon" },
  ]

  const selectPredefinedLocation = (index: number, location: { name: string; persian: string }) => {
    setFormData((prev) => {
      const newRoutes = [...prev.routes]
      newRoutes[index] = { 
        ...newRoutes[index], 
        location: location.name, 
        locationPersian: location.persian 
      }
      return { ...prev, routes: newRoutes }
    })
  }

  const activeInputLocationEn = showLocationDropdown !== null && activeRouteIndex !== null ? (formData.routes[activeRouteIndex]?.location || "") : ""
  const activeInputLocationFa = showLocationDropdown !== null && activeRouteIndex !== null ? (formData.routes[activeRouteIndex]?.locationPersian || "") : ""
  const activeInputLocation =
    activeLocationField === "en"
      ? activeInputLocationEn
      : activeLocationField === "fa"
      ? activeInputLocationFa
      : `${activeInputLocationEn} ${activeInputLocationFa}`.trim()
  const activeStopTransportMode = showLocationDropdown !== null && activeRouteIndex !== null ? (formData.routes[activeRouteIndex]?.transportMode || "truck") : null
  const rawLocationQuery = (routeLocationSearch || (filterByRouteInput ? activeInputLocation : "")).trim().toLowerCase()
  const quickLocationQuery = rawLocationQuery
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\u0640]/g, "-")
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ")
  const queryTokens = quickLocationQuery
    .split(/[\s,./\-_()–—ـ\u00A0\u200C\u060C\u061B]+/)
    .map((t) => t.replace(/^-+|-+$/g, ""))
    .filter((t) => t.length > 0)

  const isAirportLocation = (loc: (typeof predefinedLocations)[0]) => {
    const nameLow = (loc.name || "").toLowerCase()
    const fa = loc.persian || ""
    const lType = loc.locationType || ""
    return (
      Boolean(loc.airCargo) ||
      Boolean(loc.iataCode) ||
      lType.startsWith("AIRPORT") ||
      lType === "AIR_CARGO" ||
      nameLow.includes("airport") ||
      nameLow.includes("air cargo") ||
      nameLow.includes("intl air") ||
      nameLow.includes("igi") ||
      fa.includes("میدان هوایی") ||
      fa.includes("فرودگاه") ||
      fa.includes("هوایی")
    )
  }

  const isSeaPortLocation = (loc: (typeof predefinedLocations)[0]) => {
    const nameLow = (loc.name || "").toLowerCase()
    const fa = loc.persian || ""
    const lType = loc.locationType || ""
    const pType = loc.portType || ""
    return (
      Boolean(loc.isPort) ||
      Boolean(loc.portName) ||
      Boolean(loc.seaCargo) ||
      lType.startsWith("SEA_PORT") ||
      lType === "TERMINAL" ||
      lType === "INLAND_WATERWAY_TERMINAL" ||
      pType === "SEA" ||
      pType === "SEA_CARGO" ||
      nameLow.includes("port") ||
      nameLow.includes("harbour") ||
      nameLow.includes("dock") ||
      nameLow.includes("wharf") ||
      nameLow.includes("seaport") ||
      fa.includes("بندر") ||
      fa.includes("ترمینال بحری") ||
      fa.includes("اسکله") ||
      fa.includes("لنگرگاه")
    )
  }

  const isRailLocation = (loc: (typeof predefinedLocations)[0]) => {
    const nameLow = (loc.name || "").toLowerCase()
    const fa = loc.persian || ""
    const lType = loc.locationType || ""
    return (
      Boolean(loc.railConnected) ||
      lType.startsWith("ICD") ||
      lType.startsWith("RAIL") ||
      nameLow.includes("icd") ||
      nameLow.includes("rail") ||
      nameLow.includes("station") ||
      fa.includes("راه آهن") ||
      fa.includes("ریل") ||
      fa.includes("پایانه کانتینری")
    )
  }

  const detectPortDetails = (route?: { location?: string; locationPersian?: string; name?: string; persian?: string; code?: string; unLocode?: string }) => {
    if (!route) return null
    const locEn = (route.location || route.name || "").toLowerCase()
    const locFa = (route.locationPersian || route.persian || "").toLowerCase()
    const code = (route.code || "").toLowerCase()
    const unLocode = (route.unLocode || "").toLowerCase()
    const combined = `${locEn} ${locFa} ${code} ${unLocode}`.trim()
    if (!combined) return null

    const normCombined = combined
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\u0640]/g, "-")
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/[آأإ]/g, "ا")

    // ==========================================
    // 🇮🇷 IRAN COMMERCIAL SEAPORTS & ENERGY GATEWAYS
    // ==========================================

    // 0.A Jask Port (Bandar Jask / Makran Crude Oil & Commercial Gateway Hub) — Iran
    if (
      normCombined.includes("jask") ||
      normCombined.includes("irjsk") ||
      normCombined.includes("jsk") ||
      normCombined.includes("جاسک")
    ) {
      return {
        name: "Jask Port (Bandar Jask / Makran Oil & Commercial Gateway)",
        title: "Jask Commercial Port Authority & Makran Energy Hub",
        titleFa: "بندر تجاری و نفتی جاسک (پایانه مکران / هرمزگان)، ایران",
        unLocode: "IRJSK",
        customsCode: "IRJSK1",
        stateCountry: "Hormozgan / Gulf of Oman, Iran 🇮🇷",
        category: "Strategic Deepwater Energy, Commercial & Multimodal Seaport",
        terminals: "Jask Commercial Jetty, Makran Crude Terminal, Multi-Purpose Coastal Berths, Customs Bonded Zone",
        terminalPresets: ["Jask Commercial Jetty", "Makran Terminal", "Customs Bonded Zone", "General Cargo Wharf"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.B Shahid Rajaee Port (Bandar Abbas / Megamax Container Hub) — Iran
    if (
      normCombined.includes("rajaee") ||
      normCombined.includes("rajaie") ||
      normCombined.includes("rajai") ||
      normCombined.includes("رجایی") ||
      (normCombined.includes("bandar abbas") && !normCombined.includes("bahonar")) ||
      (normCombined.includes("بندرعباس") && !normCombined.includes("باهنر")) ||
      (normCombined.includes("بندر عباس") && !normCombined.includes("باهنر")) ||
      normCombined.includes("irbnd")
    ) {
      return {
        name: "Shahid Rajaee Port (Bandar Abbas)",
        title: "Shahid Rajaee Port Authority (Bandar Abbas)",
        titleFa: "مجتمع بزرگ بندری شهید رجایی (بندرعباس / خلیج فارس)، ایران",
        unLocode: "IRBND",
        customsCode: "IRBND1",
        stateCountry: "Hormozgan / Persian Gulf, Iran 🇮🇷",
        category: "Iran's Premier Deepwater Megamax Container & Multi-Modal Hub",
        terminals: "Container Terminal #1, Container Terminal #2, Petrochemical Wharf, General Cargo Wharves",
        terminalPresets: ["Container Terminal #1", "Container Terminal #2", "Petrochemical Wharf", "General Cargo"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 0.C Shahid Bahonar Port (Bandar Abbas / General Cargo & Passenger) — Iran
    if (
      normCombined.includes("bahonar") ||
      normCombined.includes("باهنر")
    ) {
      return {
        name: "Shahid Bahonar Port (Bandar Abbas)",
        title: "Shahid Bahonar Port Authority (Bandar Abbas)",
        titleFa: "بندر شهید باهنر (بندرعباس / هرمزگان)، ایران",
        unLocode: "IRBND",
        customsCode: "IRBND2",
        stateCountry: "Hormozgan / Persian Gulf, Iran 🇮🇷",
        category: "Commercial Multi-Purpose Seaport, Ro-Ro & Passenger Terminal",
        terminals: "Bahonar Cargo Berths 1-5, Ro-Ro Wharf, Passenger Pier",
        terminalPresets: ["Bahonar Cargo Berth", "Ro-Ro Terminal", "General Cargo Berth"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.D Shahid Beheshti Port (Chabahar / Oceanic Hub & Afghanistan Transit) — Iran
    if (
      normCombined.includes("beheshti") ||
      normCombined.includes("بهشتی") ||
      (normCombined.includes("chabahar") && !normCombined.includes("kalantari")) ||
      (normCombined.includes("چابهار") && !normCombined.includes("کلانتری")) ||
      normCombined.includes("irzbr") ||
      normCombined.includes("ipgl")
    ) {
      return {
        name: "Shahid Beheshti Port (Chabahar)",
        title: "Shahid Beheshti Port Authority (Chabahar Oceanic Hub)",
        titleFa: "بندر شهید بهشتی (چابهار / دریای عمان)، ایران",
        unLocode: "IRZBR",
        customsCode: "IRZBR1",
        stateCountry: "Sistan and Baluchestan / Sea of Oman, Iran 🇮🇷",
        category: "Strategic Oceanic Deepwater Container Gateway (INSTC / Afghanistan Transit)",
        terminals: "Shahid Beheshti Container Terminal (IPGL / Adani-JNPA), Grain Silo Berth, General Cargo Berths 1-5",
        terminalPresets: ["Shahid Beheshti CT", "IPGL Terminal", "Grain Silo Berth", "General Cargo Berth"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.E Shahid Kalantari Port (Chabahar) — Iran
    if (
      normCombined.includes("kalantari") ||
      normCombined.includes("کلانتری")
    ) {
      return {
        name: "Shahid Kalantari Port (Chabahar)",
        title: "Shahid Kalantari Port Authority (Chabahar)",
        titleFa: "بندر شهید کلانتری (چابهار)، ایران",
        unLocode: "IRZBR",
        customsCode: "IRZBR2",
        stateCountry: "Sistan and Baluchestan / Sea of Oman, Iran 🇮🇷",
        category: "Coastal & General Cargo Commercial Seaport",
        terminals: "Kalantari Commercial Berths 1-5, Coastal Traffic Jetty",
        terminalPresets: ["Kalantari Berth #1", "Coastal Jetty"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.F Bandar Imam Khomeini Port (BIK) — Iran
    if (
      normCombined.includes("imam khomeini") ||
      normCombined.includes("bik") ||
      normCombined.includes("irbkm") ||
      normCombined.includes("امام خمینی") ||
      normCombined.includes("سربندر")
    ) {
      return {
        name: "Bandar Imam Khomeini Port (BIK)",
        title: "Bandar Imam Khomeini Port Authority (BIK)",
        titleFa: "مجتمع بزرگ بندری امام خمینی (خوزستان)، ایران",
        unLocode: "IRBKM",
        customsCode: "IRBKM1",
        stateCountry: "Khuzestan / Persian Gulf, Iran 🇮🇷",
        category: "Premier Strategic Bulk Grain, Petrochemical & Container Hub",
        terminals: "Grain Silo Terminal, Petrochemical Docks, Container Wharf, General Cargo Berths",
        terminalPresets: ["Grain Silo Terminal", "Petrochemical Dock", "Container Terminal", "General Cargo"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 0.G Bushehr Port — Iran
    if (
      normCombined.includes("bushehr") ||
      normCombined.includes("irbuz") ||
      normCombined.includes("بوشهر")
    ) {
      return {
        name: "Bushehr Port Authority",
        title: "Bushehr Port Authority & Negin Island Complex",
        titleFa: "بندر بوشهر (مجتمع بندری نگین)، ایران",
        unLocode: "IRBUZ",
        customsCode: "IRBUZ1",
        stateCountry: "Bushehr / Persian Gulf, Iran 🇮🇷",
        category: "Major Commercial Coastal Seaport & Negin Container Terminal",
        terminals: "Negin Island Container Terminal, Kowser Wharf, Commercial Berths",
        terminalPresets: ["Negin Island CT", "Kowser Wharf", "Commercial Berth"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.H Khorramshahr Commercial Port — Iran
    if (
      normCombined.includes("khorramshahr") ||
      normCombined.includes("irkho") ||
      normCombined.includes("خرمشهر")
    ) {
      return {
        name: "Khorramshahr Commercial Port",
        title: "Khorramshahr Port Authority (Arvand Free Zone)",
        titleFa: "بندر تجاری خرمشهر (منطقه آزاد اروند)، خوزستان، ایران",
        unLocode: "IRKHO",
        customsCode: "IRKHO1",
        stateCountry: "Khuzestan, Iran 🇮🇷",
        category: "Historic Riverine Commercial & Free Zone Gateway",
        terminals: "Arvand Container Terminal, General Cargo Wharves 1-13",
        terminalPresets: ["Arvand CT", "General Cargo Wharf", "Ro-Ro Berth"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 0.I Bandar Anzali & Caspian Port (Anzali Free Zone) — Iran
    if (
      normCombined.includes("anzali") ||
      normCombined.includes("caspian") ||
      normCombined.includes("irbaz") ||
      normCombined.includes("انزلی") ||
      normCombined.includes("کاسپین")
    ) {
      return {
        name: "Bandar Anzali & Caspian Port (Anzali Free Zone)",
        title: "Bandar Anzali & Caspian Port Complex (INSTC)",
        titleFa: "مجتمع بندری انزلی و کاسپین (منطقه آزاد انزلی)، گیلان، ایران",
        unLocode: "IRBAZ",
        customsCode: "IRBAZ1",
        stateCountry: "Gilan / Caspian Sea, Iran 🇮🇷",
        category: "Premier Caspian Sea Multi-Modal & Container Seaport",
        terminals: "Caspian Free Zone Container Terminal, Anzali Historic Docks, Ro-Ro Rail Ferry Berth",
        terminalPresets: ["Caspian CT", "Ro-Ro Rail Berth", "Anzali Dock"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 0.J Assaluyeh Port (Pars Energy SEZ) — Iran
    if (
      normCombined.includes("assaluyeh") ||
      normCombined.includes("asaluyeh") ||
      normCombined.includes("irpgu") ||
      normCombined.includes("عسلویه")
    ) {
      return {
        name: "Assaluyeh Port (Pars Energy SEZ)",
        title: "Pars Special Economic Energy Zone Port (Assaluyeh)",
        titleFa: "بندر عسلویه (منطقه ویژه اقتصادی انرژی پارس)، ایران",
        unLocode: "IRPGU",
        customsCode: "IRPGU1",
        stateCountry: "Bushehr / Persian Gulf, Iran 🇮🇷",
        category: "Major Energy, Petrochemical & Container Port",
        terminals: "Pars Petrochemical Port, General Cargo Jetty, LNG Berths",
        terminalPresets: ["Pars Petrochemical Jetty", "General Cargo Berth", "LNG Terminal"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.K Bandar Lengeh Port — Iran
    if (
      normCombined.includes("lengeh") ||
      normCombined.includes("irbdh") ||
      normCombined.includes("لنگه")
    ) {
      return {
        name: "Bandar Lengeh Port",
        title: "Bandar Lengeh Commercial Port Authority",
        titleFa: "بندر تجاری لنگه (هرمزگان)، ایران",
        unLocode: "IRBDH",
        customsCode: "IRBDH1",
        stateCountry: "Hormozgan / Persian Gulf, Iran 🇮🇷",
        category: "Commercial Coastal Trade & Ro-Ro Gateway to UAE",
        terminals: "Lengeh Commercial Wharves, Ro-Ro Berth",
        terminalPresets: ["Lengeh Commercial Wharf", "Ro-Ro Berth"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.L Qeshm Island Port (Bahman / Kaveh) — Iran
    if (
      normCombined.includes("qeshm") ||
      normCombined.includes("irgsm") ||
      normCombined.includes("قشم")
    ) {
      return {
        name: "Qeshm Island Port (Bahman / Kaveh)",
        title: "Qeshm Free Zone Port Authority",
        titleFa: "بندر جزیره قشم (اسکله بهمن و کاوه)، هرمزگان، ایران",
        unLocode: "IRGSM",
        customsCode: "IRGSM1",
        stateCountry: "Hormozgan / Persian Gulf, Iran 🇮🇷",
        category: "Island Free Trade & Commercial Container Terminal",
        terminals: "Bahman Cargo Pier, Kaveh Deepwater Jetty",
        terminalPresets: ["Bahman Cargo Pier", "Kaveh Deepwater Jetty"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 0.M Kish Island Commercial Port — Iran
    if (
      normCombined.includes("kish") ||
      normCombined.includes("irkih") ||
      normCombined.includes("کیش")
    ) {
      return {
        name: "Kish Island Commercial Port",
        title: "Kish Free Zone Commercial Port Authority",
        titleFa: "بندر تجاری جزیره کیش (منطقه آزاد)، ایران",
        unLocode: "IRKIH",
        customsCode: "IRKIH1",
        stateCountry: "Hormozgan / Persian Gulf, Iran 🇮🇷",
        category: "Island Free Trade Commercial & Passenger Gateway",
        terminals: "Commercial Cargo Basin, Passenger Pier",
        terminalPresets: ["Commercial Cargo Basin", "Kish Passenger Pier"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // ==========================================
    // 🇮🇳 INDIA COMMERCIAL SEAPORTS & ICD GATEWAYS
    // ==========================================

    // 1. Nhava Sheva / JNPT
    if (
      combined.includes("nhava") ||
      combined.includes("sheva") ||
      combined.includes("jnpt") ||
      combined.includes("innsa") ||
      combined.includes("نوا شوا") ||
      combined.includes("نهاوا شوا") ||
      combined.includes("ناوا شیوا") ||
      combined.includes("ناوا شوا") ||
      combined.includes("jawaharlal nehru")
    ) {
      return {
        name: "Nhava Sheva Port (JNPT / Navi Mumbai)",
        title: "Nhava Sheva Port Authority (JNPT / Mumbai)",
        titleFa: "بندر نوا شوا (JNPT ممبئی)، هند",
        unLocode: "INNSA",
        customsCode: "INNSA1",
        stateCountry: "Maharashtra, India 🇮🇳",
        category: "Major Container Seaport & Gateway Hub",
        terminals: "JNPCT, NSICT (DP World), GTI (APM Terminals), BMCT (PSA Mumbai), NSIGT",
        terminalPresets: ["JNPCT", "NSICT (DP World)", "GTI (APM)", "BMCT (PSA Mumbai)", "NSIGT"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 2. Mundra Port (APSEZ)
    if (
      combined.includes("mundra") ||
      combined.includes("inmun") ||
      combined.includes("موندرا") ||
      combined.includes("apsez")
    ) {
      return {
        name: "Mundra Port (Adani Ports & SEZ)",
        title: "Mundra Port & SEZ (APSEZ)",
        titleFa: "بندر موندرا (گجرات)، هند",
        unLocode: "INMUN",
        customsCode: "INMUN1",
        stateCountry: "Gujarat, India 🇮🇳",
        category: "Premier Commercial & Container Deepwater Hub",
        terminals: "AICTPL (CT3/CT4), MICT (DP World), AMCT",
        terminalPresets: ["AICTPL (Adani)", "MICT (DP World)", "AMCT Terminal 2"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 3. Deendayal / Kandla Port
    if (
      combined.includes("kandla") ||
      combined.includes("deendayal") ||
      combined.includes("inixy") ||
      combined.includes("کاندلا") ||
      combined.includes("دیندایال")
    ) {
      return {
        name: "Deendayal Port (Kandla)",
        title: "Deendayal Port Authority (Kandla)",
        titleFa: "بندر کاندلا (دیندایال)، هند",
        unLocode: "INIXY",
        customsCode: "INIXY1",
        stateCountry: "Gujarat, India 🇮🇳",
        category: "Major Bulk, Liquid & Dry Cargo Gateway",
        terminals: "Kandla Cargo Berths, Oil Jetties, Tuna Tekra Container Terminal",
        terminalPresets: ["Tuna Tekra", "Cargo Berth #1-6", "Oil Jetty"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 4. Pipavav Port
    if (combined.includes("pipavav") || combined.includes("inpav") || combined.includes("پیپاوائو")) {
      return {
        name: "Port Pipavav (APM Terminals)",
        title: "Port Pipavav (APM Terminals)",
        titleFa: "بندر پیپاوائو (گجرات)، هند",
        unLocode: "INPAV",
        customsCode: "INPAV1",
        stateCountry: "Gujarat, India 🇮🇳",
        category: "Major Container & Liquid Seaport",
        terminals: "APM Terminals Pipavav",
        terminalPresets: ["APM Terminals Pipavav"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 5. Cochin / Vallarpadam
    if (combined.includes("cochin") || combined.includes("kochi") || combined.includes("vallarpadam") || combined.includes("incok") || combined.includes("کوچین")) {
      return {
        name: "Cochin Port (Vallarpadam ICTT)",
        title: "Cochin Port (Vallarpadam ICTT)",
        titleFa: "بندر کوچین (پایانه بین‌المللی کانتینری والرپادام)، هند",
        unLocode: "INCOK",
        customsCode: "INCOK1",
        stateCountry: "Kerala, India 🇮🇳",
        category: "International Container Transshipment Terminal (ICTT)",
        terminals: "Vallarpadam ICTT (DP World)",
        terminalPresets: ["Vallarpadam ICTT", "Ernakulam Wharf"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 6. Mumbai Port Trust (MbPT)
    if (combined.includes("mumbai port") || combined.includes("inbom") || (combined.includes("mumbai") && !combined.includes("navi mumbai") && !combined.includes("nhava")) || combined.includes("بندر ممبئی")) {
      return {
        name: "Mumbai Port Trust (MbPT)",
        title: "Mumbai Port Authority (MbPT)",
        titleFa: "بندر ممبئی (قدیم)، ماهاراشترا، هند",
        unLocode: "INBOM",
        customsCode: "INBOM1",
        stateCountry: "Maharashtra, India 🇮🇳",
        category: "Major Natural Seaport & Multipurpose Gateway",
        terminals: "Indira Dock, Victoria Dock, Offshore Container Terminal (OCT)",
        terminalPresets: ["Indira Dock", "OCT Terminal", "Victoria Dock"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 7. Chennai Port (Madras)
    if (combined.includes("chennai") || combined.includes("madras") || combined.includes("inmaa") || combined.includes("چنای") || combined.includes("مدرس")) {
      return {
        name: "Chennai Port Trust (Madras Port)",
        title: "Chennai Port Authority (CCTPL / CITPL)",
        titleFa: "بندر چنای (مدرس)، تامیل نادو، هند",
        unLocode: "INMAA",
        customsCode: "INMAA1",
        stateCountry: "Tamil Nadu, India 🇮🇳",
        category: "Premier East Coast Container & Automobile Seaport",
        terminals: "CCTPL (DP World), CITPL (PSA Chennai), Jawahar Dock",
        terminalPresets: ["CCTPL (DP World)", "CITPL (PSA)", "Jawahar Dock"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 8. Kamarajar Port (Ennore)
    if (combined.includes("ennore") || combined.includes("kamarajar") || combined.includes("inenr") || combined.includes("انور") || combined.includes("کاماراجار")) {
      return {
        name: "Kamarajar Port (Ennore Port)",
        title: "Kamarajar Port Limited (Ennore)",
        titleFa: "بندر انور (کاماراجار)، تامیل نادو، هند",
        unLocode: "INENR",
        customsCode: "INENR1",
        stateCountry: "Tamil Nadu, India 🇮🇳",
        category: "Corporate Major Seaport & Container Facility",
        terminals: "AECTPL (Adani Ennore Container Terminal), Chettinad Coal Terminal",
        terminalPresets: ["Adani Ennore CT", "Coal Terminal", "General Cargo"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 9. Kattupalli Port (Adani Kattupalli)
    if (combined.includes("kattupalli") || combined.includes("inkat") || combined.includes("کاتوپالی")) {
      return {
        name: "Kattupalli Port (Adani Ports)",
        title: "Adani Kattupalli Port & Container Terminal",
        titleFa: "بندر کاتوپالی (آدانی)، تامیل نادو، هند",
        unLocode: "INKAT",
        customsCode: "INKAT1",
        stateCountry: "Tamil Nadu, India 🇮🇳",
        category: "Modern Deepwater Container Terminal & Gateway",
        terminals: "Adani Kattupalli Container Terminal (AKCTP)",
        terminalPresets: ["Adani Kattupalli CT", "Berth #1", "Berth #2"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 10. V.O. Chidambaranar Port (Tuticorin)
    if (combined.includes("tuticorin") || combined.includes("chidambaranar") || combined.includes("intut") || combined.includes("توتیکورین")) {
      return {
        name: "V.O. Chidambaranar Port (Tuticorin)",
        title: "V.O. Chidambaranar Port Authority (VOC Port)",
        titleFa: "بندر توتیکورین (چی‌دامبارانار)، تامیل نادو، هند",
        unLocode: "INTUT",
        customsCode: "INTUT1",
        stateCountry: "Tamil Nadu, India 🇮🇳",
        category: "Major Deepwater Container & All-Weather Seaport",
        terminals: "Dakshin Bharat Gateway Terminal (DBGT), PSA SICAL Container Terminal",
        terminalPresets: ["DBGT Terminal", "PSA Sical", "Berth #8 Container"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 11. Vizhinjam International Seaport (Trivandrum)
    if (combined.includes("vizhinjam") || combined.includes("inviz") || combined.includes("ویژینجام") || combined.includes("تیرووانانتاپورام")) {
      return {
        name: "Vizhinjam International Transshipment Deepwater Seaport",
        title: "Vizhinjam International Seaport (Adani Ports)",
        titleFa: "بندر ترانزیت بین‌المللی ویژینجام، کرالا، هند",
        unLocode: "INVIZ",
        customsCode: "INVIZ1",
        stateCountry: "Kerala, India 🇮🇳",
        category: "Premier Deepwater Megamax Container Transshipment Hub",
        terminals: "Adani Vizhinjam Container Terminal (Ultra Large Vessel Berth)",
        terminalPresets: ["Adani Vizhinjam CT", "Deepwater Berth 1"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 12. New Mangalore Port (NMPT)
    if (combined.includes("new mangalore") || combined.includes("mangalore") || combined.includes("innml") || combined.includes("منگلور")) {
      return {
        name: "New Mangalore Port Authority (NMPT)",
        title: "New Mangalore Port Authority (NMPT)",
        titleFa: "بندر نیو منگلور، کارناتاکا، هند",
        unLocode: "INNML",
        customsCode: "INNML1",
        stateCountry: "Karnataka, India 🇮🇳",
        category: "Major All-Weather Deepwater Coastal Seaport",
        terminals: "JMM Container Terminal (Berth 14), Deep Draft Bulk Cargo Berths",
        terminalPresets: ["Berth 14 Container", "Bulk Berth #8"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 13. Mormugao Port (Goa)
    if (combined.includes("mormugao") || combined.includes("marmagao") || combined.includes("goa port") || combined.includes("inmrm") || combined.includes("مورموگائو") || combined.includes("گوا")) {
      return {
        name: "Mormugao Port Authority (Goa)",
        title: "Mormugao Port Authority (Goa)",
        titleFa: "بندر مورموگائو، گوا، هند",
        unLocode: "INMRM",
        customsCode: "INMRM1",
        stateCountry: "Goa, India 🇮🇳",
        category: "Major Natural Harbor & Multipurpose Bulk/Container Port",
        terminals: "Berth 10/11 Multipurpose, SWPL Bulk Terminal",
        terminalPresets: ["Berth 10 Multipurpose", "SWPL Terminal"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 14. Visakhapatnam Port (Vizag Port)
    if (combined.includes("visakhapatnam") || combined.includes("vizag") || combined.includes("invtz") || combined.includes("ویساخاپاتنام") || combined.includes("ویزاگ")) {
      return {
        name: "Visakhapatnam Port Authority (Vizag Port)",
        title: "Visakhapatnam Port Authority (VCTPL)",
        titleFa: "بندر ویساخاپاتنام (ویزاگ)، آندرا پرادش، هند",
        unLocode: "INVTZ",
        customsCode: "INVTZ1",
        stateCountry: "Andhra Pradesh, India 🇮🇳",
        category: "Major Natural Deepwater East Coast Gateway",
        terminals: "Visakha Container Terminal (VCTPL / JM Baxi), Outer Harbour Ore Berths",
        terminalPresets: ["VCTPL Terminal", "Outer Harbour Berth", "EQ Berths"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 15. Gangavaram Port (Adani Gangavaram)
    if (combined.includes("gangavaram") || combined.includes("inggv") || combined.includes("گانگاوارام")) {
      return {
        name: "Gangavaram Port (Adani Gangavaram)",
        title: "Adani Gangavaram Deepwater Port",
        titleFa: "بندر گانگاوارام (آدانی)، آندرا پرادش، هند",
        unLocode: "INGGV",
        customsCode: "INGGV1",
        stateCountry: "Andhra Pradesh, India 🇮🇳",
        category: "Deepest All-Weather Multipurpose Port in India",
        terminals: "Deepwater Multipurpose Berths 1-9, Adani Bulk & Container Facility",
        terminalPresets: ["Adani Gangavaram Berth", "Deepwater Berth #1"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 16. Krishnapatnam Port (Adani KPCL)
    if (combined.includes("krishnapatnam") || combined.includes("inkri") || combined.includes("kpcl") || combined.includes("کریشناپاتنام")) {
      return {
        name: "Krishnapatnam Port (Adani KPCL)",
        title: "Adani Krishnapatnam Port Limited (KPCT)",
        titleFa: "بندر کریشناپاتنام (آدانی)، آندرا پرادش، هند",
        unLocode: "INKRI",
        customsCode: "INKRI1",
        stateCountry: "Andhra Pradesh, India 🇮🇳",
        category: "Premier Deepwater Multimodal & Container Hub",
        terminals: "KPCT Container Terminal, Automated Bulk Cargo Berths",
        terminalPresets: ["KPCT Container Terminal", "Berth #1-4"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 17. Paradip Port
    if (combined.includes("paradip") || combined.includes("paradeep") || combined.includes("inprt") || combined.includes("پارادیپ")) {
      return {
        name: "Paradip Port Authority",
        title: "Paradip Port Authority (PICT)",
        titleFa: "بندر پارادیپ، اودیشا، هند",
        unLocode: "INPRT",
        customsCode: "INPRT1",
        stateCountry: "Odisha, India 🇮🇳",
        category: "Major All-Weather Deepwater East Coast Port",
        terminals: "Paradip International Cargo Terminal (PICT), Mechanised Coal Berths",
        terminalPresets: ["PICT Container", "Mechanised Coal Berth"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 18. Dhamra Port (Adani Dhamra)
    if (combined.includes("dhamra") || combined.includes("indhm") || combined.includes("دهامرا")) {
      return {
        name: "Dhamra Port (Adani Dhamra)",
        title: "Dhamra Port Company Limited (DPCL)",
        titleFa: "بندر دهامرا (آدانی)، اودیشا، هند",
        unLocode: "INDHM",
        customsCode: "INDHM1",
        stateCountry: "Odisha, India 🇮🇳",
        category: "Deep Draft All-Weather Seaport & LNG Terminal",
        terminals: "Dhamra LNG Terminal, Adani Deepwater Bulk Berths",
        terminalPresets: ["Dhamra Bulk Berth", "LNG Terminal"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 19. Gopalpur Port
    if (combined.includes("gopalpur") || combined.includes("ingpr") || combined.includes("ingpt") || combined.includes("گوپالپور")) {
      return {
        name: "Gopalpur Port Limited",
        title: "Gopalpur Port Authority (Shapoorji Pallonji / JSW)",
        titleFa: "بندر گوپال‌پور، اودیشا، هند",
        unLocode: "INGPT",
        customsCode: "INGPT1",
        stateCountry: "Odisha, India 🇮🇳",
        category: "Deepwater Commercial Seaport & Bulk Gateway",
        terminals: "Commercial Deepwater Berths, Bulk Cargo Jetties",
        terminalPresets: ["Gopalpur Deepwater Berth"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 20. Syama Prasad Mookerjee Port (Kolkata Dock Complex)
    if (combined.includes("kolkata") || combined.includes("calcutta") || combined.includes("inccu") || combined.includes("کلکته") || combined.includes("موکرجی")) {
      return {
        name: "Syama Prasad Mookerjee Port (Kolkata Port)",
        title: "Syama Prasad Mookerjee Port Authority (Kolkata)",
        titleFa: "بندر کلکته (شاماپرساد موکرجی)، بنگال غربی، هند",
        unLocode: "INCCU",
        customsCode: "INCCU1",
        stateCountry: "West Bengal, India 🇮🇳",
        category: "India's Oldest Operating Major Riverine Seaport",
        terminals: "Netaji Subhash Dock (NSD), Kidderpore Dock (KPD)",
        terminalPresets: ["Netaji Subhash Dock", "Kidderpore Dock"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 21. Haldia Dock Complex (HDC)
    if (combined.includes("haldia") || combined.includes("inhal") || combined.includes("هالدیا") || combined.includes("هالدیه")) {
      return {
        name: "Haldia Dock Complex (HDC - Kolkata Port)",
        title: "Haldia Dock Complex (SMP Kolkata)",
        titleFa: "مجموعه اسکله‌های هالدیا، بنگال غربی، هند",
        unLocode: "INHAL",
        customsCode: "INHAL1",
        stateCountry: "West Bengal, India 🇮🇳",
        category: "Major Riverine Deep Draft Container & Bulk Complex",
        terminals: "Berth 4B Container, Oil Jetties 1-3, General Cargo Berths",
        terminalPresets: ["Berth 4B Container", "Haldia Oil Jetty"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 22. Hazira Port (Adani / Essar)
    if (combined.includes("hazira") || combined.includes("inhza") || combined.includes("حاضیره") || combined.includes("هازیرا")) {
      return {
        name: "Hazira Port (Adani Hazira / Essar Bulk)",
        title: "Adani Hazira Port Limited (AHPL)",
        titleFa: "بندر هازیرا (سورت)، گجرات، هند",
        unLocode: "INHZA",
        customsCode: "INHZA1",
        stateCountry: "Gujarat, India 🇮🇳",
        category: "Strategic Commercial Container & Multi-Commodity Gateway",
        terminals: "Adani Hazira Container Terminal (AHCT), Essar Bulk Terminal",
        terminalPresets: ["Adani Hazira CT", "Essar Bulk Terminal"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 23. Dahej Port (Petronet LNG / Adani)
    if (combined.includes("dahej") || combined.includes("indhj") || combined.includes("داهج")) {
      return {
        name: "Dahej Port (Petronet LNG / Adani)",
        title: "Dahej Commercial Seaport & LNG Terminal",
        titleFa: "بندر داهج، گجرات، هند",
        unLocode: "INDHJ",
        customsCode: "INDHJ1",
        stateCountry: "Gujarat, India 🇮🇳",
        category: "Specialized Deepwater Bulk, Liquid & LNG Gateway",
        terminals: "Petronet LNG Jetty, Adani Dahej Solid Cargo Port",
        terminalPresets: ["Adani Dahej Terminal", "Petronet LNG Jetty"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 24. Karaikal Port (Adani Karaikal)
    if (combined.includes("karaikal") || combined.includes("inkrk") || combined.includes("کارایکال")) {
      return {
        name: "Karaikal Port (Adani Karaikal)",
        title: "Adani Karaikal Port Limited",
        titleFa: "بندر کارایکال، پودوچری، هند",
        unLocode: "INKRK",
        customsCode: "INKRK1",
        stateCountry: "Puducherry, India 🇮🇳",
        category: "Deepwater All-Weather Multipurpose Port",
        terminals: "Multipurpose Berths 1-4, Adani Bulk & Container Facility",
        terminalPresets: ["Karaikal Multipurpose Berth"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 25. Port Blair Port (Andaman & Nicobar)
    if (combined.includes("port blair") || combined.includes("inixz") || combined.includes("andaman") || combined.includes("پورت بلیر") || combined.includes("آندامان")) {
      return {
        name: "Port Blair Port Authority (Andaman)",
        title: "Port Blair Port Trust",
        titleFa: "بندر پورت بلیر، جزایر آندامان و نیکوبار، هند",
        unLocode: "INIXZ",
        customsCode: "INIXZ1",
        stateCountry: "Andaman and Nicobar Islands, India 🇮🇳",
        category: "Major Island Territory Seaport & Naval Harbor",
        terminals: "Haddo Wharf, Chatham Wharf, Hope Town",
        terminalPresets: ["Haddo Wharf", "Chatham Wharf"],
        railConnected: false,
        seaCargo: true,
      }
    }

    // 26. ICD Tughlakabad (Delhi TKD - India's Premier Inland Dry Port)
    if (combined.includes("tughlakabad") || combined.includes("tkd") || combined.includes("intkd") || combined.includes("توغلق‌آباد") || combined.includes("طغلق آباد") || combined.includes("خشکه دهلی")) {
      return {
        name: "ICD Tughlakabad (TKD Delhi / CONCOR)",
        title: "Inland Container Depot Tughlakabad (ICD TKD)",
        titleFa: "بندر خشک طغلق‌آباد (CONCOR دهلی)، هند",
        unLocode: "INTKD",
        customsCode: "INTKD6",
        stateCountry: "New Delhi / NCR, India 🇮🇳",
        category: "India's Premier & Largest Inland Container Dry Port",
        terminals: "CONCOR ICD Tughlakabad, Rail Container Siding, Customs Bonded CFS",
        terminalPresets: ["CONCOR ICD TKD", "Rail Yard Siding", "Customs Bonded Area"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 27. ICD Dadri (Greater Noida / DFC Junction)
    if (combined.includes("dadri") || combined.includes("inder") || combined.includes("دادری")) {
      return {
        name: "ICD Dadri (CONCOR Multimodal Logistics Hub)",
        title: "ICD Dadri (Western & Eastern DFC Junction)",
        titleFa: "بندر خشک دادری (تقاطع DFC نویدا بزرگ)، هند",
        unLocode: "INDER",
        customsCode: "INDER6",
        stateCountry: "Uttar Pradesh / NCR, India 🇮🇳",
        category: "Premier DFC Connected Multimodal Logistics Hub",
        terminals: "CONCOR Dadri MMLH, Dedicated Freight Corridor Yard, Bonded CFS",
        terminalPresets: ["CONCOR Dadri MMLH", "DFC Siding", "Customs Terminal"],
        railConnected: true,
        seaCargo: true,
      }
    }

    // 28. Generic lookup from predefinedLocations if isPort is true or locationType is SEA_PORT/ICD
    const matched = predefinedLocations.find((p) => {
      const isCandidate = p.isPort || p.locationType?.startsWith("SEA_PORT") || p.locationType === "ICD"
      if (!isCandidate) return false
      const pName = (p.name || "").toLowerCase()
      const pCode = (p.code || "").toLowerCase()
      const pUnlocode = (p.unLocode || "").toLowerCase()
      const pFa = (p.persian || "").toLowerCase()
      const pAliases = Array.isArray(p.aliases) ? p.aliases.join(" ").toLowerCase() : (p.aliases || "").toLowerCase()
      return (
        (locEn && (pName.includes(locEn) || (pCode && pCode === locEn) || (pUnlocode && pUnlocode === locEn) || pAliases.includes(locEn))) ||
        (locFa && (pFa.includes(locFa) || pAliases.includes(locFa)))
      )
    })

    if (matched) {
      const derivedPresets = matched.district ? [matched.district] : [matched.name.split(",")[0]]
      return {
        name: matched.portName || matched.name,
        title: matched.name,
        titleFa: matched.persian,
        unLocode: matched.unLocode || matched.code,
        customsCode: matched.customsCode || `${matched.unLocode || matched.code}1`,
        stateCountry: `${matched.state ? `${matched.state}, ` : ""}${matched.country}`,
        category: matched.locationType ? matched.locationType.replace(/_/g, " ") : "Seaport",
        terminals: matched.district || undefined,
        terminalPresets: derivedPresets,
        railConnected: Boolean(matched.railConnected),
        seaCargo: Boolean(matched.seaCargo || matched.isPort),
      }
    }

    return null
  }

  const quickLocationMatches = predefinedLocations.filter((loc) => {
    // 0. Strict Transport Mode Filter (AIR = Airports only, SEA = Ports only, RAIL = Rail/ICD only)
    if (!disableModeFilter && activeStopTransportMode) {
      if (activeStopTransportMode === "airplane" && !isAirportLocation(loc)) {
        return false
      }
      if (activeStopTransportMode === "vessel" && !isSeaPortLocation(loc)) {
        return false
      }
      if (activeStopTransportMode === "train" && !isRailLocation(loc)) {
        return false
      }
    }

    // Match against full searchable metadata
    const searchableText = [
      loc.name,
      loc.persian,
      loc.country,
      loc.code,
      loc.portName || "",
      loc.borderCountry || "",
      loc.state || "",
      loc.district || "",
      loc.locationType || "",
      loc.iataCode || "",
      loc.unLocode || "",
      loc.customsCode || "",
      loc.portType || "",
      typeof loc.aliases === "string" ? loc.aliases : (loc.aliases || []).join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\u0640]/g, "-")
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, " ")

    const normSearchable = searchableText
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/[آأإ]/g, "ا")
      .replace(/نهاوا/g, "نوا")
      .replace(/شیوا/g, "شوا")

    const normQuery = quickLocationQuery
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/ة/g, "ه")
      .replace(/[آأإ]/g, "ا")
      .replace(/نهاوا/g, "نوا")
      .replace(/شیوا/g, "شوا")

    let matchesQuery = !quickLocationQuery || searchableText.includes(quickLocationQuery) || normSearchable.includes(normQuery)

    // Token-based matching with bilingual decoupling
    if (!matchesQuery && queryTokens.length > 0) {
      const enTokens = queryTokens.filter((t) => /[a-zA-Z0-9]/.test(t))
      const faTokens = queryTokens
        .filter((t) => /[\u0600-\u06FF]/.test(t))
        .map((t) =>
          t
            .replace(/ي/g, "ی")
            .replace(/ك/g, "ک")
            .replace(/ة/g, "ه")
            .replace(/[آأإ]/g, "ا")
            .replace(/نهاوا/g, "نوا")
            .replace(/شیوا/g, "شوا")
        )

      const enMatch =
        enTokens.length > 0 &&
        enTokens.every((token) => {
          if (token === "new" && (enTokens.includes("del") || enTokens.includes("delhi") || enTokens.includes("york"))) {
            return searchableText.includes("delhi") || searchableText.includes("new") || searchableText.includes("york")
          }
          if (token.length <= 2) {
            return searchableText.includes(token) || loc.code.toLowerCase().startsWith(token) || (loc.country || "").toLowerCase().startsWith(token)
          }
          return searchableText.includes(token)
        })

      const faMatch =
        faTokens.length > 0 &&
        faTokens.every((token) => {
          return normSearchable.includes(token)
        })

      if (enMatch || faMatch) {
        matchesQuery = true
      }
    }

    // Special resilient matching for Nhava Sheva / JNPT
    const isNhavaQuery =
      normQuery.includes("nhava") ||
      normQuery.includes("sheva") ||
      normQuery.includes("jnpt") ||
      normQuery.includes("nava sheva") ||
      normQuery.includes("innsa") ||
      normQuery.includes("نوا شوا") ||
      normQuery.includes("نهاوا شوا") ||
      normQuery.includes("ناوا شیوا") ||
      (normQuery.includes("نوا") && normQuery.includes("شوا"))

    if (!matchesQuery && isNhavaQuery) {
      if (
        loc.code === "INNSA" ||
        loc.unLocode === "INNSA" ||
        searchableText.includes("nhava") ||
        searchableText.includes("sheva") ||
        searchableText.includes("jnpt") ||
        normSearchable.includes("نوا شوا") ||
        (normSearchable.includes("نوا") && normSearchable.includes("شوا"))
      ) {
        matchesQuery = true
      }
    }

    // Special resilient matching for Mundra
    const isMundraQuery =
      normQuery.includes("mundra") ||
      normQuery.includes("inmun") ||
      normQuery.includes("موندرا")

    if (!matchesQuery && isMundraQuery) {
      if (
        loc.code === "INMUN" ||
        loc.unLocode === "INMUN" ||
        searchableText.includes("mundra") ||
        normSearchable.includes("موندرا")
      ) {
        matchesQuery = true
      }
    }

    // Special prefix matching for Jask (e.g. "jask", "jask port", "jask - i", "جاسک")
    if (!matchesQuery && (quickLocationQuery.includes("jask") || quickLocationQuery.includes("جاسک"))) {
      if (
        loc.code === "JSK" ||
        loc.unLocode === "IRJSK" ||
        searchableText.includes("jask") ||
        searchableText.includes("جاسک")
      ) {
        matchesQuery = true
      }
    }

    // Special prefix matching (e.g. "new del", "new delhi", "delhi air", "igi")
    if (!matchesQuery && quickLocationQuery.length >= 3) {
      if (
        (quickLocationQuery.startsWith("new del") || quickLocationQuery === "new delhi" || quickLocationQuery.includes("igi")) &&
        (loc.code === "DEL" || searchableText.includes("delhi") || searchableText.includes("indira gandhi"))
      ) {
        matchesQuery = true
      }
    }

    if (!matchesQuery) return false

    // If an explicit search term is typed, show all global matches immediately
    if (quickLocationQuery) return true

    // Otherwise apply country / region filters
    if (selectedCountryFilter === "PORTS") {
      if (!loc.isPort) return false
    } else if (selectedCountryFilter === "AFRICA") {
      const africaCountries = ["Ivory Coast", "Nigeria", "Ghana", "Benin", "Togo", "Senegal", "Kenya", "Tanzania", "South Africa", "Egypt", "Morocco", "Djibouti", "Sudan"]
      if (!africaCountries.includes(loc.country)) return false
    } else if (selectedCountryFilter === "GULF") {
      const gulfCountries = ["Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "Iraq", "Jordan", "Lebanon"]
      if (!gulfCountries.includes(loc.country)) return false
    } else if (selectedCountryFilter === "EUROPE_AMERICAS") {
      const euroAmericas = ["Netherlands", "Belgium", "Germany", "Spain", "Italy", "Greece", "United Kingdom", "France", "Poland", "USA", "Canada", "Brazil", "Panama"]
      if (!euroAmericas.includes(loc.country)) return false
    } else if (selectedCountryFilter === "CENTRAL_ASIA") {
      const centralAsia = ["Uzbekistan", "Turkmenistan", "Tajikistan", "Kyrgyzstan", "Kazakhstan"]
      if (!centralAsia.includes(loc.country)) return false
    } else if (selectedCountryFilter !== "ALL" && loc.country !== selectedCountryFilter) {
      return false
    }

    // Secondary category filter for India
    if (selectedCountryFilter === "India" && selectedIndiaCategoryFilter !== "ALL") {
      if (selectedIndiaCategoryFilter === "AIRPORTS") {
        if (!loc.locationType?.startsWith("AIRPORT") && !loc.airCargo && !loc.iataCode) return false
      } else if (selectedIndiaCategoryFilter === "SEAPORTS") {
        if (!loc.locationType?.startsWith("SEA_PORT") && !loc.isPort) return false
      } else if (selectedIndiaCategoryFilter === "LAND_PORTS") {
        if (loc.locationType !== "LAND_BORDER" && loc.locationType !== "INTEGRATED_CHECK_POST" && loc.locationType !== "CUSTOMS_BORDER" && !loc.isBorder) return false
      } else if (selectedIndiaCategoryFilter === "ICD") {
        if (loc.locationType !== "ICD" && loc.locationType !== "RAIL_CONTAINER_TERMINAL") return false
      } else if (selectedIndiaCategoryFilter === "CFS") {
        if (loc.locationType !== "CFS") return false
      } else if (selectedIndiaCategoryFilter === "TERMINALS") {
        if (!loc.locationType?.includes("TERMINAL") && !loc.inlandWaterway) return false
      } else if (selectedIndiaCategoryFilter === "LOGISTICS") {
        if (loc.locationType !== "LOGISTICS_HUB" && !loc.cargoEnabled && !loc.containerEnabled) return false
      }
    }

    // Secondary category filter for Iran
    if (selectedCountryFilter === "Iran" && selectedIranCategoryFilter !== "ALL") {
      if (selectedIranCategoryFilter === "SEAPORTS") {
        if (!loc.isPort && !loc.locationType?.startsWith("SEA_PORT")) return false
      } else if (selectedIranCategoryFilter === "BORDERS") {
        if (!loc.isBorder && loc.locationType !== "LAND_BORDER") return false
      } else if (selectedIranCategoryFilter === "AIRPORTS") {
        if (!loc.locationType?.startsWith("AIRPORT") && !loc.airCargo && !loc.iataCode) return false
      }
    }

    return true
  }).sort((a, b) => {
    const q = quickLocationQuery.toLowerCase()
    if (q.includes("jask") || q.includes("جاسک") || q.includes("irjsk")) {
      const aIsJsk = a.code === "JSK" || a.unLocode === "IRJSK" || (a.name || "").toLowerCase().includes("jask") ? 1 : 0
      const bIsJsk = b.code === "JSK" || b.unLocode === "IRJSK" || (b.name || "").toLowerCase().includes("jask") ? 1 : 0
      if (aIsJsk !== bIsJsk) return bIsJsk - aIsJsk
    }
    if (q.includes("nhava") || q.includes("sheva") || q.includes("jnpt") || q.includes("innsa") || q.includes("نوا") || q.includes("نهاوا") || q.includes("شیوا")) {
      const aIsNsa = a.code === "INNSA" || a.unLocode === "INNSA" ? 1 : 0
      const bIsNsa = b.code === "INNSA" || b.unLocode === "INNSA" ? 1 : 0
      if (aIsNsa !== bIsNsa) return bIsNsa - aIsNsa
    }
    if (q.includes("mundra") || q.includes("inmun") || q.includes("موندرا")) {
      const aIsMun = a.code === "INMUN" || a.unLocode === "INMUN" ? 1 : 0
      const bIsMun = b.code === "INMUN" || b.unLocode === "INMUN" ? 1 : 0
      if (aIsMun !== bIsMun) return bIsMun - aIsMun
    }
    return 0
  })

  const handleQuickLocationSelect = (loc: { name: string; persian: string }) => {
    const targetIndex =
      activeRouteIndex !== null
        ? activeRouteIndex
        : formData.routes.findIndex((route) => !route.location)

    if (targetIndex >= 0) {
      selectPredefinedLocation(targetIndex, loc)
      setActiveRouteIndex(targetIndex)
      return
    }

    setFormData((prev) => ({
      ...prev,
      routes: [
        ...prev.routes,
        {
          id: crypto.randomUUID(),
          location: loc.name,
          locationPersian: loc.persian,
          stopOrder: prev.routes.length + 1,
        },
      ],
    }))
    setActiveRouteIndex(formData.routes.length)
  }

  const handleQuickSetDischarge = (portName: string) => {
    setFormData((prev) => ({ ...prev, port_of_discharge: portName }))
    toast.success(`Port of Discharge: ${portName}`)
  }

  const handleQuickSetLoading = (portName: string) => {
    setFormData((prev) => ({ ...prev, port_of_loading: portName }))
    toast.success(`Port of Loading: ${portName}`)
  }

  const handleQuickSetDelivery = (place: string) => {
    setFormData((prev) => ({ ...prev, place_of_delivery: place }))
    toast.success(`Place of Delivery: ${place}`)
  }

  const handleSave = async () => {
    if (isSaving || isHydrating) return
    setIsSaving(true)
    setAutoSaveStatus("saving")
    try {
      const cleanNum = cleanBolNumber(bolNumber)
      const validEditId = editDocumentId || formData.id || cleanNum
      const method = (isEditMode && validEditId) ? "PUT" : "POST"
      const url = (isEditMode && validEditId) ? `/api/bol/${encodeURIComponent(validEditId)}` : "/api/bol"
      
      // Include the BOL number and incremented revision in the request
      const dataToSend = {
        ...formData,
        bol_number: cleanNum,
        issue_date: issueDate,
        revision: Number((formData as any).revision || 1) + 1,
      }

      if (!isEditMode) {
        delete dataToSend.id
      }
      
      const saveResult = await onlineSaveManager.saveBol(url, method, dataToSend)
      
      if (!saveResult.success) {
        setAutoSaveStatus("error")
        toast.error("Could not update BOL. Your changes are still available.", {
          description: saveResult.error || "Save error",
        })
        return
      }
      
      if (saveResult.data) {
        const canonicalRecord = normalizeBolRecord(saveResult.data, cleanNum || validEditId)
        const savedBolNumber = cleanBolNumber(canonicalRecord.bol_number) || cleanNum || "BOL-2026-NSA626"
        const savedId = canonicalRecord.id || editDocumentId || savedBolNumber

        // Update form data and switch to edit mode so user keeps current document
        const updatedFormData: BillOfLadingFormData = {
          ...formData,
          ...canonicalRecord,
          id: savedId,
          bol_number: savedBolNumber,
          issue_date: canonicalRecord.issue_date || issueDate,
          consignee_address: canonicalRecord.consignee_address || (canonicalRecord as any).consigneeAddress || formData.consignee_address || "",
          consignee_contact: canonicalRecord.consignee_contact || (canonicalRecord as any).consigneeContact || formData.consignee_contact || "",
          consignee_email: canonicalRecord.consignee_email || (canonicalRecord as any).consigneeEmail || formData.consignee_email || "",
          shipper_address: canonicalRecord.shipper_address || (canonicalRecord as any).shipperAddress || formData.shipper_address || "",
          shipper_contact: canonicalRecord.shipper_contact || (canonicalRecord as any).shipperContact || formData.shipper_contact || "",
          shipper_email: canonicalRecord.shipper_email || (canonicalRecord as any).shipperEmail || formData.shipper_email || "",
          cargo_route_note: canonicalRecord.cargo_route_note || (canonicalRecord as any).cargoRouteNote || formData.cargo_route_note || "",
          kgs_per_carton: canonicalRecord.kgs_per_carton || (canonicalRecord as any).kgsPerCarton || formData.kgs_per_carton || "",
          gross_weight_per_carton: canonicalRecord.gross_weight_per_carton || (canonicalRecord as any).grossWeightPerCarton || formData.gross_weight_per_carton || "",
          rate_per_kgs: canonicalRecord.rate_per_kgs || (canonicalRecord as any).ratePerKgs || formData.rate_per_kgs || "",
          goods_value: canonicalRecord.goods_value || (canonicalRecord as any).goodsValue || formData.goods_value || "",
          notes_1: canonicalRecord.notes_1 !== undefined && canonicalRecord.notes_1 !== "" ? canonicalRecord.notes_1 : formData.notes_1,
          notes_2: canonicalRecord.notes_2 !== undefined && canonicalRecord.notes_2 !== "" ? canonicalRecord.notes_2 : formData.notes_2,
        }
        setFormData(updatedFormData)
        setIsEditMode(true)
        setEditDocumentId(savedId)
        setBolNumber(savedBolNumber)
        setActiveBolId(savedId)
        setHasUnsavedChanges(false)
        setAutoSaveStatus("saved")

        // Save directly to browser local storage for 100% instant UI sync
        try {
          const filterOut = (d: any) => {
            const dId = d.id || d.bol_number
            const dNum = d.bol_number
            return (
              dId !== updatedFormData.id &&
              dNum !== updatedFormData.id &&
              dId !== updatedFormData.bol_number &&
              dNum !== updatedFormData.bol_number &&
              dId !== validEditId &&
              dNum !== validEditId
            )
          }

          const keys = ["sky-bol-browser-documents", "skybol:saved-documents", "skybol:backup-documents"]
          for (const k of keys) {
            const raw = window.localStorage.getItem(k)
            const currentList: any[] = raw ? JSON.parse(raw) : []
            const updatedList = [updatedFormData, ...currentList.filter(filterOut)]
            window.localStorage.setItem(k, JSON.stringify(updatedList))
          }
        } catch (e) {
          console.error("Browser local storage error:", e)
        }

        // Auto-save shipper and consignee details into quick saved options
        try {
          if (updatedFormData.shipper_name?.trim()) {
            const sName = updatedFormData.shipper_name.trim()
            const matchS = savedShippers.find((s) => s.name.trim().toLowerCase() === sName.toLowerCase())
            const curS: SavedParty = {
              id: matchS ? matchS.id : crypto.randomUUID(),
              name: sName,
              address: updatedFormData.shipper_address || "",
              contact: updatedFormData.shipper_contact || "",
              email: updatedFormData.shipper_email || "",
              savedAt: new Date().toISOString(),
            }
            const nextS = [curS, ...savedShippers.filter((s) => s.id !== curS.id)].slice(0, 10000)
            persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, nextS, setSavedShippers)
          }

          if (updatedFormData.consignee_name?.trim()) {
            const cName = updatedFormData.consignee_name.trim()
            const matchC = savedConsignees.find((c) => c.name.trim().toLowerCase() === cName.toLowerCase())
            const curC: SavedParty = {
              id: matchC ? matchC.id : crypto.randomUUID(),
              name: cName,
              address: updatedFormData.consignee_address || "",
              contact: updatedFormData.consignee_contact || "",
              email: updatedFormData.consignee_email || "",
              savedAt: new Date().toISOString(),
            }
            const nextC = [curC, ...savedConsignees.filter((c) => c.id !== curC.id)].slice(0, 10000)
            persistSavedParties(SAVED_CONSIGNEES_STORAGE_KEY, nextC, setSavedConsignees)
          }

          if (updatedFormData.notify_party?.trim()) {
            const nName = updatedFormData.notify_party.trim()
            const matchN = savedNotifyParties.find((n) => n.name.trim().toLowerCase() === nName.toLowerCase())
            const curN: SavedParty = {
              id: matchN ? matchN.id : crypto.randomUUID(),
              name: nName,
              address: updatedFormData.notify_party_address || "",
              contact: "",
              email: "",
              savedAt: new Date().toISOString(),
            }
            const nextN = [curN, ...savedNotifyParties.filter((n) => n.id !== curN.id)].slice(0, 10000)
            persistSavedParties(SAVED_NOTIFY_PARTIES_STORAGE_KEY, nextN, setSavedNotifyParties)
          }
        } catch (err) {
          console.error("Auto-save party error:", err)
        }

        try {
          syncBolToAccountLedger(updatedFormData)
        } catch (ledgerSyncErr) {
          console.warn("Non-fatal account ledger sync error:", ledgerSyncErr)
        }
        
        window.dispatchEvent(new CustomEvent("skybol:documents-updated", { detail: updatedFormData }))

        // Purge active draft cache on server and local storage to prevent false alerts
        try {
          window.localStorage.removeItem("sky-bol-live-draft")
          window.localStorage.removeItem("skybol:active-form-draft")
          window.localStorage.removeItem(`skybol:draft:${cleanBolNumber(savedBolNumber)}`)
          window.localStorage.removeItem(`skybol:draft:${cleanBolNumber(validEditId)}`)
          try { window.sessionStorage.removeItem("skybol:active-form-draft:backup") } catch (_) {}
          void deleteVaultItem("bol_drafts", "skybol:active-form-draft").catch(() => {})
          if (savedBolNumber) void deleteVaultItem("bol_drafts", `skybol:draft:${cleanBolNumber(savedBolNumber)}`).catch(() => {})
          if (validEditId) void deleteVaultItem("bol_drafts", `skybol:draft:${cleanBolNumber(validEditId)}`).catch(() => {})
          window.localStorage.setItem("skybol:last-active-document-id", savedBolNumber)
          const savedSeq = parseBolSeq(savedBolNumber)
          if (savedSeq > 0) {
            const currentHighest = Number(window.localStorage.getItem("skybol:highest-allocated-bol") || "0")
            const newHighest = Math.max(currentHighest, savedSeq)
            window.localStorage.setItem("skybol:highest-allocated-bol", String(newHighest))
            fetch(`/api/bol?action=set-sequence&sequence=${newHighest + 1}`).catch(() => {})
          }
          fetch("/api/draft?type=bol", { method: "DELETE" }).catch(() => {})
          setHasRecoverableDraft(false)
          setAutoSaveStatus("saved")
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          setLastAutoSaveTime(nowStr)
          setLastAutoSavedTime(nowStr)
        } catch (_) {}

        onSave?.(updatedFormData)
        onRefreshDocuments?.()
        
        // Show success toast with BOL number & 1-click action to View Saved BOLs
        if (saveResult.mode === "offline-queued") {
          toast.info("Saved locally (Offline Mode)", {
            description: `BOL ${savedBolNumber} saved locally and queued. Will automatically sync online when reconnected.`,
            action: {
              label: "Cloud Queue",
              onClick: () => setIsCloudSyncModalOpen(true),
            },
          })
        } else {
          const action = isEditMode ? "updated" : "saved"
          toast.success(`Document ${action} & synced online!`, {
            description: `BOL ${savedBolNumber} ${action} in cloud and local storage`,
            action: {
              label: "View Saved BOLs",
              onClick: () => setActiveTab("saved-documents"),
            },
          })
        }
      }
    } catch (error) {
      console.error("[v0] Error saving BOL:", error)
      setAutoSaveStatus("error")
      toast.error("Could not update BOL. Your changes are still available.", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewDocument = () => {
    // 0. Compute next available sequence based on all known documents before state reset
    const highestBeforeReset = getHighestKnownBolSequence()
    const nextNewSeq = Math.max(highestBeforeReset + 1, 685)
    const nextNewBol = `BOL-2026-NSA${nextNewSeq}`

    // 1. Switch to form tab immediately
    startTransition(() => {
      setActiveTab("form")
    })
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set("tab", "form")
        url.searchParams.delete("bol")
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
      } catch (_) {}
    }

    // 2. Clear stored drafts asynchronously to avoid blocking the event loop (< 16ms INP)
    setTimeout(() => {
      try {
        window.localStorage.removeItem("sky-bol-live-draft")
        window.localStorage.removeItem("skybol:active-form-draft")
        try { window.sessionStorage.removeItem("skybol:active-form-draft:backup") } catch (_) {}
        void deleteVaultItem("bol_drafts", "skybol:active-form-draft").catch(() => {})
        window.localStorage.setItem("skybol:last-active-document-id", "__NEW__")
        window.localStorage.setItem("skybol:highest-allocated-bol", String(nextNewSeq))
        fetch(`/api/bol?action=set-sequence&sequence=${nextNewSeq + 1}`).catch(() => {})
        fetch("/api/draft?type=bol", { method: "DELETE" }).catch(() => {})
      } catch (_) {}
    }, 0)

    // 3. Mark state reset as non-blocking React 19 transition
    startTransition(() => {
      setHasRecoverableDraft(false)
      setIsEditMode(false)
      setEditDocumentId(null)
      setSelectedShipperId("")
      setSelectedConsigneeId("")
      setSelectedNotifyPartyId("")
      setSelectedNote1Id("")
      setSelectedNote2Id("")
      setSelectedTruckPresetId("")
      setShipperDirectorySearch("")
      setConsigneeDirectorySearch("")
      setNotifyDirectorySearch("")
      setShipperSearchQuery("")
      setConsigneeSearchQuery("")
      setNotifyPartySearchQuery("")
      setShowShipperDropdown(false)
      setShowConsigneeDropdown(false)
      setShowNotifyPartyDropdown(false)
      setHasUnsavedChanges(false)
      const today = new Date().toISOString().split("T")[0]
      setFormData({
        ...initialFormData,
        bol_number: nextNewBol,
        cargo_description: `📦 CONTAINER & CARGO PARTICULARS:\n• Description: \n• Transit Date: ${today}\n• INV-`,
      })
      setActiveRouteIndex(null)
      setShowLocationDropdown(null)
      setBolNumber(nextNewBol)
      setIssueDate(today)
      const dualDates = getDualDates(today)
      if (dualDates) {
        setPersianDate(dualDates.persian)
        setPersianDateNumeric(formatPersianDate(today) ?? dualDates.persianNumeric)
      }
    })

    // 4. Fetch the real sequence number in background
    void fetchNextBolNumber(nextNewSeq)
  }

  const handleDuplicateCurrent = async () => {
    setIsSaving(true)
    const toastId = toast.loading("Duplicating BOL...", {
      description: "Allocating official atomic sequence number...",
    })
    try {
      const highestKnown = getHighestKnownBolSequence()
      const minAlloc = Math.max(highestKnown + 1, 685)
      const response = await fetch(`/api/bol?action=next-number&advance=true&minSequence=${minAlloc}`)
      let newBolNumber = `BOL-2026-NSA${minAlloc}`
      if (response.ok) {
        const result = await response.json()
        if (result?.bolNumber) {
          const s = parseBolSeq(result.bolNumber)
          if (s >= minAlloc) {
            newBolNumber = result.bolNumber
          }
        }
      }
      const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `bol-${Date.now()}`
      const today = new Date().toISOString().split("T")[0]

      setIsEditMode(false)
      setEditDocumentId(null)
      setBolNumber(newBolNumber)

      setFormData((prev: any) => {
        const next = {
          ...prev,
          id: newId,
          bol_number: newBolNumber,
          billOfLadingNumber: newBolNumber,
          bolNo: newBolNumber,
          issue_date: today,
          issueDate: today,
          pdf_url: null,
          pdf_status: "none",
          pdf_uploaded_at: null,
          isLegacyImport: false,
          legacySource: null,
          legacyBarnama: null,
          revision: 1,
          status: "active",
          isArchived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
          duplicated_from: prev.bol_number || prev.id || null,
        }
        try {
          const s = parseBolSeq(newBolNumber)
          if (s > 0) {
            window.localStorage.setItem("skybol:highest-allocated-bol", String(s))
            fetch(`/api/bol?action=set-sequence&sequence=${s + 1}`).catch(() => {})
          }
          window.localStorage.setItem(`skybol:draft:${newBolNumber}`, JSON.stringify(next))
          window.localStorage.setItem("skybol:last-active-document-id", newBolNumber)
        } catch (_) {}
        return next
      })

      setIssueDate(today)
      const dualDates = getDualDates(today)
      if (dualDates) {
        setPersianDate(dualDates.persian)
        setPersianDateNumeric(formatPersianDate(today) ?? dualDates.persianNumeric)
      }

      toast.success(`Duplicated as ${newBolNumber}!`, {
        id: toastId,
        description: "Official sequence allocated. Document isolated in draft storage. Review & click Save.",
      })
    } catch (e) {
      toast.error("Failed to duplicate document", { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      if (!isEditMode || hasUnsavedChanges || !editDocumentId) {
        await handleSave()
      }

      setIsSaving(true)
      setIsExportingPDF(true)
      await new Promise((resolve) => setTimeout(resolve, 80))
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready
        } catch {}
      }
      const toastId = toast.loading("Generating PDF...", {
        description: "Please wait, this may take a moment...",
      })

      const fileName = buildBolSmartFileName({ ...formData, bol_number: bolNumber }, bolNumber, ".pdf")
      const previewElement =
        (document.querySelector('[data-pdf-export-container="true"] [data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-bol-a4="true"]') as HTMLElement | null)
      const pdfBlob = await generateBOLPDFBlob({
        fileName,
        previewElement,
        useElectronVectorPdf: true,
        modern: {
          bolNumber: bolNumber || "BOL",
          issueDate,
          persianDateNumeric,
          formData: { ...formData, bol_number: bolNumber },
          logoUrl,
          companyName,
          companyNamePersian,
          companySubtitle,
          companyPhone,
          companyEmail,
          companyAddress,
          companyLicence,
          onProgress: (progress: number, message: string) => {
            toast.loading(`${message} (${Math.round(progress)}%)`, {
              id: toastId,
              description: "Generating premium print-ready PDF",
            })
          },
        },
        onFallback: (reason: string) => {
          toast.warning("Using compatibility PDF mode", {
            description: reason,
          })
        },
      })

      toast.loading("Uploading PDF to storage...", {
        id: toastId,
        description: "Saving to cloud storage...",
      })

      // Upload to server
      const uploadResult = await uploadPDFToServer(
        pdfBlob,
        formData.id || "",
        fileName.replace(/\.pdf$/i, "")
      )

      if (uploadResult.success && uploadResult.url) {
        toast.success("PDF saved successfully!", {
          id: toastId,
          description: "Your BOL PDF has been stored and is ready for download",
        })
        onRefreshDocuments?.()
      } else {
        toast.error("Failed to save PDF", {
          id: toastId,
          description: uploadResult.error || "Unknown error occurred",
        })
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error generating PDF", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsSaving(false)
      setIsExportingPDF(false)
    }
  }

  const handleDirectPrint = () => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      const smartTitle = buildBolSmartFileName({ ...formData, bol_number: bolNumber }, bolNumber, "")
      if (smartTitle) {
        document.title = smartTitle
      }

      // Explicitly set BOL active print mode and clear any ledger/invoice styles
      document.body.classList.remove("ledger-landscape-active")
      document.body.removeAttribute("data-print-mode")
      document.documentElement.removeAttribute("data-print-mode")
      document.body.setAttribute("data-print-active", "bol")
      document.documentElement.setAttribute("data-print-active", "bol")

      const previewEl = document.getElementById("bol-print-preview")
      if (previewEl) {
        previewEl.setAttribute("data-print-quality", "standard")
        previewEl.setAttribute("data-color-strip", "true")
        previewEl.setAttribute("data-fit-to-page", "true")
      }

      const cleanup = () => {
        document.body.removeAttribute("data-print-active")
        document.documentElement.removeAttribute("data-print-active")
        window.removeEventListener("afterprint", cleanup)
      }
      window.addEventListener("afterprint", cleanup)

      setTimeout(() => {
        window.print()
        setTimeout(cleanup, 2500)
      }, 150)
    }
  }

  const handlePrint = async (options: PrintOptions) => {
    try {
      setIsSaving(true)
      setActivePrintOptions(options)

      const smartTitle = buildBolSmartFileName({ ...formData, bol_number: bolNumber }, bolNumber, "")
      const fileName = buildBolSmartFileName({ ...formData, bol_number: bolNumber }, bolNumber, ".pdf")
      if (smartTitle && typeof document !== "undefined") {
        document.title = smartTitle
      }

      // Explicitly set BOL active print mode and clear any ledger/invoice styles
      document.body.classList.remove("ledger-landscape-active")
      document.body.removeAttribute("data-print-mode")
      document.documentElement.removeAttribute("data-print-mode")
      document.body.setAttribute("data-print-active", "bol")
      document.documentElement.setAttribute("data-print-active", "bol")

      const cleanup = () => {
        document.body.removeAttribute("data-print-active")
        document.documentElement.removeAttribute("data-print-active")
        window.removeEventListener("afterprint", cleanup)
      }
      window.addEventListener("afterprint", cleanup)

      if (options.quality !== "high-quality") {
        if (typeof window !== "undefined" && typeof window.print === "function") {
          const previewEl = document.getElementById("bol-print-preview")
          if (previewEl) {
            previewEl.setAttribute("data-print-quality", options.quality)
            previewEl.setAttribute("data-color-strip", options.includeColorStrip ? "true" : "false")
            previewEl.setAttribute("data-fit-to-page", options.fitToPage ? "true" : "false")
          }
          setTimeout(async () => {
            if (typeof window !== "undefined" && window.skyDesktop?.print) {
              try {
                await window.skyDesktop.print({
                  silent: false,
                  printBackground: true,
                  pageSize: "A4",
                  landscape: false,
                })
                setIsSaving(false)
                cleanup()
                return
              } catch (e) {
                // fallback to browser window.print()
              }
            }
            window.print()
            setIsSaving(false)
            setTimeout(cleanup, 2500)
          }, 50)
          return
        }
      }

      setIsExportingPDF(true)
      await new Promise((resolve) => setTimeout(resolve, 80))
      const toastId = toast.loading("Opening print preview...", {
        description: `Preparing BOL layout (${options.quality} quality)...`,
      })

      const printWindow = openPDFPrintWindow(fileName)

      const previewElement =
        (document.querySelector('[data-pdf-export-container="true"] [data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-bol-a4="true"]') as HTMLElement | null)
      const pdfBlob = await generateBOLPDFBlob({
        fileName,
        previewElement,
        useElectronVectorPdf: true,
        modern: {
          bolNumber: bolNumber || "BOL",
          issueDate,
          persianDateNumeric,
          formData: { ...formData, bol_number: bolNumber },
          logoUrl,
          companyName,
          companyNamePersian,
          companySubtitle,
          companyPhone,
          companyEmail,
          companyAddress,
          companyLicence,
        },
      })
      await printPDFBlobInWindow(pdfBlob, fileName, printWindow)
      toast.dismiss(toastId)
      cleanup()
    } catch (error) {
      console.error("Error preparing print:", error)
      if (typeof window !== "undefined" && typeof window.print === "function") {
        window.print()
      }
    } finally {
      setIsSaving(false)
      setIsExportingPDF(false)
    }
  }

  const handleDownloadPDF = async () => {
    await handleShippingDocumentsDownload("all")
  }

  const shippingDocumentData = useMemo(
    () =>
      deriveShippingDocumentData(
        {
          ...formData,
          bol_number: bolNumber,
          issue_date: issueDate,
          company_name: companyName,
          company_subtitle: companySubtitle,
          company_phone: companyPhone,
          company_email: companyEmail,
          company_address: companyAddress,
          company_licence: companyLicence,
        } as any,
        bolNumber,
        issueDate,
      ),
    [
      formData,
      bolNumber,
      issueDate,
      companyName,
      companySubtitle,
      companyPhone,
      companyEmail,
      companyAddress,
      companyLicence,
    ],
  )

  const createShippingDocuments = async (
    kind: ShippingDocumentKind = "all",
    stickerQuantity = 1,
    stickerLayout: StickerLayout = "single",
    onProgress?: (progress: number, message: string) => void,
  ) => {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {}
    }
    let bolElement =
      (document.querySelector('[data-pdf-export-container="true"] [data-pdf-export="true"]') as HTMLElement | null) ||
      (document.querySelector('[data-pdf-export="true"]') as HTMLElement | null) ||
      (document.querySelector('[data-bol-a4="true"]') as HTMLElement | null)
    if (!bolElement) {
      await new Promise((resolve) => setTimeout(resolve, 120))
      bolElement =
        (document.querySelector('[data-pdf-export-container="true"] [data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-pdf-export="true"]') as HTMLElement | null) ||
        (document.querySelector('[data-bol-a4="true"]') as HTMLElement | null)
    }
    return generateShippingDocumentsPDF({
      kind,
      data: shippingDocumentData,
      bolElement,
      logoUrl,
      companyName,
      companySubtitle,
      companyPhone,
      companyEmail,
      companyAddress,
      companyLicence,
      stickerQuantity,
      stickerLayout,
      useElectronVectorPdf: true,
      onProgress,
    })
  }

  const handleShippingDocumentsDownload = async (
    kind: ShippingDocumentKind,
    stickerQuantity = 1,
    stickerLayout: StickerLayout = "single",
  ) => {
    if (!isEditMode || hasUnsavedChanges || !editDocumentId) {
      try {
        await handleSave()
      } catch (saveErr) {
        console.warn("Auto-save before download notice:", saveErr)
      }
    }
    setIsSaving(true)
    setIsShippingExporting(true)
    setIsExportingPDF(true)
    await new Promise((resolve) => setTimeout(resolve, 150))
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready
      } catch {}
    }
    const fileName = buildShippingDocumentFileName(kind, shippingDocumentData)
    const toastId = toast.loading("Building shipping documents...", {
      description: kind === "all" ? "Combining BOL, packing list and sticker labels" : `Preparing ${fileName}`,
    })
    try {
      const pdfBlob = await createShippingDocuments(
        kind,
        stickerQuantity,
        stickerLayout,
        (progress, message) => {
          toast.loading(message, { id: toastId, description: `${progress}% complete` })
        }
      )
      const saved = await savePDFToDevice(pdfBlob, fileName)
      if (!saved.success) throw new Error(saved.error || "The PDF could not be saved to this device.")
      toast.success("Shipping PDF saved", {
        id: toastId,
        description: saved.path || fileName,
      })
    } catch (error) {
      console.error("Shipping document generation failed:", error)
      toast.error("Could not generate shipping documents", {
        id: toastId,
        description: error instanceof Error ? error.message : "An unexpected PDF error occurred.",
      })
    } finally {
      setIsSaving(false)
      setIsShippingExporting(false)
      setIsExportingPDF(false)
    }
  }

  const handleShippingDocumentsPrint = async (
    kind: ShippingDocumentKind,
    stickerQuantity = 1,
    stickerLayout: StickerLayout = "single",
  ) => {
    if (!isEditMode || hasUnsavedChanges || !editDocumentId) {
      try {
        await handleSave()
      } catch (saveErr) {
        console.warn("Auto-save before print notice:", saveErr)
      }
    }
    const fileName = buildShippingDocumentFileName(kind, shippingDocumentData)
    const printWindow = openPDFPrintWindow(fileName)
    setIsSaving(true)

    setIsShippingExporting(true)
    setIsExportingPDF(true)
    await new Promise((resolve) => setTimeout(resolve, 150))
    const toastId = toast.loading("Preparing print-ready PDF...", { description: fileName })
    try {
      const pdfBlob = await createShippingDocuments(
        kind,
        stickerQuantity,
        stickerLayout,
        (progress, message) => {
          toast.loading(message, { id: toastId, description: `${progress}% complete` })
        }
      )
      const opened = await printPDFBlobInWindow(pdfBlob, fileName, printWindow)
      if (!opened) throw new Error("The print preview window could not be opened.")
      toast.success("Print preview ready", { id: toastId, description: fileName })
    } catch (error) {
      printWindow?.close()
      toast.error("Could not prepare print preview", {
        id: toastId,
        description: error instanceof Error ? error.message : "An unexpected PDF error occurred.",
      })
    } finally {
      setIsSaving(false)
      setIsShippingExporting(false)
      setIsExportingPDF(false)
    }
  }

  const handleShellAction = useEffectEvent((event: Event) => {
      const detail = (event as CustomEvent<{ action?: string; tab?: string }>).detail

      startTransition(() => {
        if (detail?.tab) {
          setActiveTab(detail.tab)
        }

        switch (detail?.action) {
          case "form":
            setActiveTab("form")
            break
          case "new":
            handleNewDocument()
            setActiveTab("form")
            break
          case "print":
            setIsPrintDialogOpen(true)
            break
          case "download":
            void handleDownloadPDF()
            break
          case "save-pdf":
            void handleExportPDF()
            break
          case "preview":
            setActiveTab("preview")
            break
          case "saved-documents":
            setActiveTab("saved-documents")
            break
          case "account":
            setActiveTab("account")
            break
          case "attachments":
          case "files":
            setActiveTab("attachments")
            break
          case "pdf-settings":
            setActiveTab("pdf-settings")
            break
        }
      })
  })
  useEffect(() => {
    window.addEventListener("skybol:editor-action", handleShellAction)
    const handleGlobalNew = () => {
      handleNewDocument()
      setActiveTab("form")
    }
    window.addEventListener("skybol:create-new-bol", handleGlobalNew)

    return () => {
      window.removeEventListener("skybol:editor-action", handleShellAction)
      window.removeEventListener("skybol:create-new-bol", handleGlobalNew)
    }
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    const timer = setTimeout(() => {
      const smartTitle = buildBolSmartFileName(formData, bolNumber, "")
      if (smartTitle && document.title !== smartTitle) {
        document.title = smartTitle
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [formData.shipper_name, formData.cargo_description, bolNumber])

  const handleBeforePrint = useEffectEvent(() => {
      if (typeof document !== "undefined") {
        const smartTitle = buildBolSmartFileName(formData, bolNumber, "")
        if (smartTitle) {
          document.title = smartTitle
        }
      }
  })
  useEffect(() => {
    window.addEventListener("beforeprint", handleBeforePrint)
    return () => window.removeEventListener("beforeprint", handleBeforePrint)
  }, [])

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !e.shiftKey) {
        e.preventDefault()
        if (bolNumber && !isSaving) {
          handleSave()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p" && !e.shiftKey) {
        e.preventDefault()
        handleDirectPrint()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleNewDocument()
        setActiveTab("form")
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault()
        handleDuplicateCurrent()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        setIsShortcutsModalOpen(true)
      }
  })
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div
      ref={editorRootRef}
      className={`bol-workspace ${
        activeTab === "preview" && !isFullscreen
          ? "flex-1 flex flex-col min-h-0 h-full max-h-full overflow-hidden"
          : "min-h-screen"
      } bg-transparent print:min-h-0 print:bg-white print:overflow-visible`}
    >
      {/* Action Bar - Mobile & Desktop sticky beneath header */}
      <div ref={toolbarRef} className={`bol-action-bar sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-2.5 py-1.5 shadow-sm shadow-blue-900/5 backdrop-blur-xl md:px-4 md:py-1.5 print:hidden ${activeTab === "preview" ? "hidden" : ""}`}>
        <div className="max-w-[1780px] mx-auto flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
          {/* Header Info */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <div className="rounded-xl border border-blue-200 bg-white/80 p-1 sm:p-1.5 shadow-2xs">
                <FileText className="h-3.5 w-3.5 text-blue-700 shrink-0" />
              </div>
              <span className="font-extrabold text-slate-950 text-xs sm:text-sm whitespace-nowrap">Bill of Lading</span>
              <div className="rounded-lg border border-blue-200 bg-blue-50/90 px-2 py-0.5">
                {isLoading || isHydrating ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-700" />
                ) : (
                  <span className="font-mono font-black text-blue-700 text-xs sm:text-xs tracking-tight">{bolNumber}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600 whitespace-nowrap">
                <Calendar className="h-3 w-3 text-blue-500 shrink-0" />
                <span>{issueDate}</span>
              </div>
              {persianDateNumeric && (
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200/60 bg-white/70 px-1.5 py-0.5 text-[11px]">
                  <span className="text-slate-600 font-bold font-[vazirmatn]" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                    {persianDateNumeric}
                  </span>
                </div>
              )}
              <div role="status" aria-live="polite" aria-atomic="true">
              {isHydrating ? (
                <div className="flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50/90 px-2 py-0.5 text-[10.5px] text-blue-900 font-bold shadow-2xs">
                  <Loader2 className="h-2.5 w-2.5 text-blue-600 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : isSaving || autoSaveStatus === "saving" ? (
                <div className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50/90 px-2 py-0.5 text-[10.5px] text-amber-900 font-bold shadow-2xs animate-pulse">
                  <RefreshCw className="h-2.5 w-2.5 text-amber-600 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : autoSaveStatus === "error" ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-800 shadow-2xs">
                  <AlertCircle className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                  <span>Save Failed</span>
                </div>
              ) : autoSaveStatus === "saved" ? (
                <div
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 shadow-2xs cursor-pointer hover:bg-emerald-100/80 transition-colors"
                  title={`Draft autosaved at ${lastAutoSaveTime || lastAutoSavedTime || "just now"}. Click or press Ctrl+S to save official document.`}
                  onClick={handleSave}
                  role="button"
                  tabIndex={0}
                >
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                  <span>Autosaved ✓</span>
                  {(lastAutoSaveTime || lastAutoSavedTime) && (
                    <span className="hidden xl:inline font-mono text-[10px] font-medium opacity-85">
                      ({lastAutoSaveTime || lastAutoSavedTime})
                    </span>
                  )}
                </div>
              ) : autoSaveStatus === "local" ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-blue-800 shadow-2xs" title="Draft saved locally">
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-blue-600" />
                  <span>Local Draft ✓</span>
                </div>
              ) : hasUnsavedChanges ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-900 shadow-2xs">
                  <AlertCircle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                  <span>Unsaved Changes</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-bold text-slate-700 shadow-2xs">
                  <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-slate-500" />
                  <span>{hasRecoverableDraft ? "Restore or discard the previous draft" : checkingDraft ? "Checking draft…" : "Autosave ready"}</span>
                </div>
              )}
              </div>

              {/* Online Cloud Sync Status Badge */}
              <OnlineSyncStatusBadge
                variant="full"
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
                className="hidden lg:inline-flex"
              />
              <OnlineSyncStatusBadge
                variant="compact"
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
                className="hidden sm:inline-flex lg:hidden"
              />
              <OnlineSyncStatusBadge
                variant="icon"
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
                className="sm:hidden"
              />
            </div>

            {/* Mobile Primary Save Button */}
            <div className="flex items-center gap-1 md:hidden shrink-0">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving}
                className="h-7.5 rounded-lg bg-linear-to-r from-blue-600 to-cyan-500 px-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                {isEditMode ? "Update" : "Save"}
              </Button>
            </div>
          </div>
          
          {/* Actions - Responsive high-density toolbar with zero clipping */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleTabChange("saved-documents")}
              className="h-7.5 rounded-xl border-emerald-200 bg-emerald-50/80 px-2 sm:px-2.5 text-xs font-bold text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 shadow-2xs shrink-0 cursor-pointer"
              title="Saved BOL Archive"
            >
              <FileText className="h-3.5 w-3.5 mr-1 text-emerald-600" />
              <span>Saved BOLs</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewDocument}
              className="h-7.5 rounded-xl border-slate-200 bg-white/90 px-2 sm:px-2.5 text-xs font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 shadow-2xs shrink-0 cursor-pointer"
              title="New Document (Ctrl + Shift + N)"
            >
              <Plus className="h-3.5 w-3.5 mr-1 text-blue-600" />
              <span>New</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDirectPrint}
              disabled={isSaving}
              className="h-7.5 rounded-xl border-slate-200 bg-white/90 px-2 sm:px-2.5 text-xs font-bold text-blue-700 hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50 shadow-2xs shrink-0 cursor-pointer"
              title="Instant Print (Ctrl + P)"
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span>Print</span>
            </Button>

            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving}
              className="h-7.5 rounded-xl bg-linear-to-r from-blue-600 to-cyan-500 px-3 text-xs font-black text-white shadow-md shadow-blue-400/25 hover:shadow-blue-400/40 shrink-0 cursor-pointer"
              title="Save Document (Ctrl + S)"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              <span>{isEditMode ? "Update" : "Save"}</span>
            </Button>

            <div className="inline-flex items-center rounded-xl shadow-2xs">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleShippingDocumentsDownload("all")}
                disabled={isSaving}
                className="h-7.5 rounded-r-none border-slate-200 bg-white/90 px-2 sm:px-2.5 text-xs font-bold text-blue-700 hover:border-blue-200 hover:bg-blue-50 shrink-0 cursor-pointer gap-1"
                title="Download Complete PDF (BOL + Packing List + Sticker)"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-blue-700" />}
                <span>Complete PDF</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    className="h-7.5 w-6 p-0 rounded-l-none border-l-0 border-slate-200 bg-white/90 text-blue-700 hover:bg-blue-50 cursor-pointer shrink-0"
                    title="More PDF options"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-xl">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-500">Download PDF</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => void handleShippingDocumentsDownload("all")} className="gap-2 text-xs font-black text-[#0284c7] cursor-pointer">
                    <Package className="h-3.5 w-3.5" />Download Complete PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleShippingDocumentsDownload("bol")} className="gap-2 text-xs font-bold cursor-pointer">
                    <FileText className="h-3.5 w-3.5" />BOL Only (Page 1)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleShippingDocumentsDownload("packing-list")} className="gap-2 text-xs font-bold cursor-pointer">
                    <FileSpreadsheet className="h-3.5 w-3.5" />Packing List Only (Page 2)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleShippingDocumentsDownload("stickers")} className="gap-2 text-xs font-bold cursor-pointer">
                    <Layers className="h-3.5 w-3.5" />Sticker Label Only (Page 3)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDocumentCenterOpen(true)} className="gap-2 text-xs font-bold cursor-pointer">
                    <Eye className="h-3.5 w-3.5 text-[#0284c7]" />Preview Documents (3-in-1)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Copy WhatsApp Button */}
            <CopyWhatsAppButton
              bol={{ ...formData, bol_number: bolNumber, issue_date: issueDate }}
            />

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsCloudSyncModalOpen(true)}
              className="h-7.5 rounded-xl border-blue-200 bg-blue-50/90 px-2 sm:px-2.5 text-xs font-black text-blue-800 hover:border-blue-300 hover:bg-blue-100 shadow-2xs shrink-0 cursor-pointer"
              title="Cloud Sync: Upload/Download all BOLs across all devices"
            >
              <Cloud className="h-3.5 w-3.5 mr-1 text-blue-600" />
              <span>Cloud Sync</span>
            </Button>

            {/* Quick Secondary Tools: Duplicate, Backup, Shortcuts */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7.5 w-7.5 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs shrink-0 cursor-pointer"
                  title="More actions & tools"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-xl">
                <DropdownMenuItem onClick={() => handleTabChange("preview")} className="gap-2 text-xs font-bold cursor-pointer">
                  <Eye className="h-3.5 w-3.5" />A4 Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTabChange("pdf-settings")} className="gap-2 text-xs font-bold cursor-pointer">
                  <Sliders className="h-3.5 w-3.5" />BOL Print Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicateCurrent} className="gap-2 text-xs font-bold cursor-pointer">
                  <Copy className="h-3.5 w-3.5 text-purple-600" />
                  <span>Duplicate BOL</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+Shift+D</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCloudSyncModalOpen(true)} className="gap-2 text-xs font-bold cursor-pointer">
                  <DownloadCloud className="h-3.5 w-3.5 text-blue-600" />
                  <span>Backup & Restore</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsShortcutsModalOpen(true)} className="gap-2 text-xs font-bold cursor-pointer">
                  <Keyboard className="h-3.5 w-3.5 text-slate-600" />
                  <span>Keyboard Shortcuts</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">Ctrl+/</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {hasRecoverableDraft && activeTab !== "preview" && (
        <div className="w-full max-w-[1780px] mx-auto px-2 sm:px-4 lg:px-6 pt-1.5 print:hidden">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-500/10 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-950/40 px-3 py-1.5 text-xs text-amber-950 dark:text-amber-200 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <div className="truncate flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-slate-100 text-xs">Unsaved Draft Detected</span>
                <span className="text-[10.5px] font-[vazirmatn] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.2 rounded-full border border-amber-200/60 dark:border-amber-800 hidden sm:inline-block">
                  پیش‌نویس ذخیره نشده
                </span>
                <span className="text-[10.5px] font-mono text-amber-900 dark:text-amber-300 font-bold">({recoverableDraftTime})</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
                  — Restore previous cargo details & consignee?
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleRestoreDraft}
                className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-extrabold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                <span>Restore Draft</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDiscardDraft}
                className="h-7 px-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="h-3 w-3 mr-1 text-slate-400" />
                <span>Discard</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full ${activeTab === "preview" ? "flex-1 flex flex-col min-h-0 h-full p-0 max-w-none" : "max-w-[1780px] mx-auto px-2 sm:px-4 lg:px-6 py-1.5 md:py-2"} print:max-w-none print:p-0 print:m-0`}>
        <Tabs activationMode="manual" value={activeTab} onValueChange={handleTabChange} className={`print:hidden w-full ${activeTab === "preview" ? "flex-1 flex flex-col min-h-0 h-full" : ""}`}>
          <TabsList className={`bol-navigation ${activeTab === "preview" ? "hidden" : "mb-1.5"} flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar w-full sm:grid-cols-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/85 dark:bg-slate-900/90 p-0.5 shadow-2xs backdrop-blur-xl h-auto sm:h-9 gap-1 sm:gap-0 shrink-0`}>
            <TabsTrigger
              value="form"
              data-tab="form"
              data-state={(pendingTab || activeTab) === "form" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "form"}
              onPointerDown={(e) => {
                if (activeTab === "form" || pendingTab === "form") {
                  e.preventDefault()
                } else {
                  setPendingTab("form")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">BOL Editor</span>
              <span className="sm:hidden">Form</span>
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              data-tab="preview"
              data-state={(pendingTab || activeTab) === "preview" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "preview"}
              onPointerDown={(e) => {
                if (activeTab === "preview" || pendingTab === "preview") {
                  e.preventDefault()
                } else {
                  setPendingTab("preview")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Eye className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">A4 Preview</span>
              <span className="sm:hidden">Preview</span>
            </TabsTrigger>
            <TabsTrigger
              value="saved-documents"
              data-tab="saved-documents"
              data-state={(pendingTab || activeTab) === "saved-documents" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "saved-documents"}
              onPointerDown={(e) => {
                if (activeTab === "saved-documents" || pendingTab === "saved-documents") {
                  e.preventDefault()
                } else {
                  setPendingTab("saved-documents")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Layers className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Saved BOLs</span>
              <span className="sm:hidden">Saved</span>
            </TabsTrigger>
            <TabsTrigger
              value="packing-list"
              data-tab="packing-list"
              data-state={(pendingTab || activeTab) === "packing-list" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "packing-list"}
              onPointerDown={(e) => {
                if (activeTab === "packing-list" || pendingTab === "packing-list") {
                  e.preventDefault()
                } else {
                  setPendingTab("packing-list")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Package className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline">Packing List</span>
              <span className="sm:hidden">Packing</span>
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              data-tab="invoice"
              data-state={(pendingTab || activeTab) === "invoice" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "invoice"}
              onPointerDown={(e) => {
                if (activeTab === "invoice" || pendingTab === "invoice") {
                  e.preventDefault()
                } else {
                  setPendingTab("invoice")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Receipt className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Invoice</span>
              <span className="sm:hidden">Invoice</span>
            </TabsTrigger>
            <TabsTrigger
              value="attachments"
              data-tab="attachments"
              data-state={(pendingTab || activeTab) === "attachments" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "attachments"}
              onPointerDown={(e) => {
                if (activeTab === "attachments" || pendingTab === "attachments") {
                  e.preventDefault()
                } else {
                  setPendingTab("attachments")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <FolderArchive className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
              <span className="hidden sm:inline">Files</span>
              <span className="sm:hidden">Files</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              data-tab="account"
              data-state={(pendingTab || activeTab) === "account" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "account"}
              onPointerDown={(e) => {
                if (activeTab === "account" || pendingTab === "account") {
                  e.preventDefault()
                } else {
                  setPendingTab("account")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Landmark className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Account Ledger</span>
              <span className="sm:hidden">Ledger</span>
            </TabsTrigger>
            <TabsTrigger
              value="pdf-settings"
              data-tab="pdf-settings"
              data-state={(pendingTab || activeTab) === "pdf-settings" ? "active" : "inactive"}
              aria-selected={(pendingTab || activeTab) === "pdf-settings"}
              onPointerDown={(e) => {
                if (activeTab === "pdf-settings" || pendingTab === "pdf-settings") {
                  e.preventDefault()
                } else {
                  setPendingTab("pdf-settings")
                }
              }}
              className="overflow-hidden shrink-0 min-w-[70px] sm:min-w-0 sm:shrink gap-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex-1 justify-center px-2 py-1 data-[state=active]:bg-white data-[state=active]:text-blue-950 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white dark:text-slate-400 dark:hover:text-slate-200 data-[state=active]:shadow-sm transition-colors cursor-pointer [&_span]:pointer-events-none [&_svg]:pointer-events-none"
            >
              <Sliders className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-400" />
              <span className="hidden sm:inline">BOL Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" forceMount className="edit-form-panel space-y-2.5 data-[state=inactive]:hidden data-[state=active]:animate-none">
            {isHydrating ? (
              <div className="flex flex-col items-center justify-center p-16 sm:p-24 space-y-4 rounded-2xl border border-blue-100 dark:border-blue-900 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-xl my-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="text-center space-y-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">Loading BOL...</h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Hydrating canonical document {activeBolId || editDocumentId || bolNumber}
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* Top Smart Quick-Actions & Navigation Ribbon */}
            <div className="bol-utility-bar relative z-10 rounded-xl border border-white/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 shadow-sm shadow-blue-500/10 backdrop-blur-xl transition-all space-y-1.5">
              {/* Row 1: Smart Utility Buttons + Inline Cargo Presets */}
              <div className="flex items-center justify-between gap-2">
                {/* Utilities */}
                <div className="flex min-w-0 flex-wrap items-center gap-1 sm:gap-1.5 sm:flex-nowrap sm:shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAutoCalculateWeights}
                    className="h-7 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer active:scale-95 transition-all px-2 sm:px-2.5"
                    title="Auto-calculate Net Weight, Gross Weight & USD Goods Value"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    <span>Auto-Calculate</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSwapShipperConsignee}
                    className="h-7 rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-300 font-extrabold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all px-2 sm:px-2.5"
                    title="Swap Shipper and Consignee details"
                  >
                    <ArrowLeftRight className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                    <span>Swap ⇄</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShipperToNotify}
                    className="h-7 rounded-lg border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 font-extrabold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all px-2 sm:px-2.5"
                    title="Copy Shipper details to Notify Party"
                  >
                    <Copy className="h-3 w-3 mr-1 text-amber-700 dark:text-amber-400" />
                    <span className="hidden sm:inline">Shipper ➔ Notify</span>
                    <span className="sm:hidden">Ship➔Notif</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyConsigneeToNotify}
                    className="h-7 rounded-lg border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 font-extrabold text-[11px] shadow-2xs cursor-pointer active:scale-95 transition-all px-2 sm:px-2.5"
                    title="Copy Consignee details to Notify Party"
                  >
                    <Copy className="h-3 w-3 mr-1 text-emerald-700 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Consignee ➔ Notify</span>
                    <span className="sm:hidden">Cons➔Notif</span>
                  </Button>
                </div>

                {/* Inline Cargo Presets Strip */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth min-w-0 pl-1">
                  <span className="text-[10.5px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span className="hidden xl:inline">Presets:</span>
                  </span>
                  {CARGO_PRESETS.map((preset, pIdx) => (
                    <button
                      key={`top-cargo-preset-${preset.name}-${pIdx}`}
                      type="button"
                      onClick={() => handleApplyCargoPreset(preset)}
                      className="rounded-lg border border-purple-200/80 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-300 px-2 py-0.5 text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0 [&_*]:pointer-events-none"
                      title={`Fill cargo specification with ${preset.name}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Section Jump Navigation Strip */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth border-t border-slate-100 dark:border-slate-800 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-0.5 shrink-0 flex items-center gap-0.5">
                  <Layers className="h-2.5 w-2.5 text-blue-500 dark:text-blue-400" />
                  Jump:
                </span>
                {[
                  { id: "section-doc", label: "01 Doc", icon: Calendar },
                  { id: "section-shipper", label: "02 Shipper", icon: User },
                  { id: "section-consignee", label: "03 Consignee", icon: User },
                  { id: "section-notify", label: "04 Notify", icon: Bell },
                  { id: "section-shipment-intelligence", label: "05 Cargo", icon: Package },
                  { id: "section-routes", label: "06 Routes", icon: MapPin },
                  { id: "section-freight", label: "07 Freight", icon: Receipt },
                  { id: "section-remarks", label: "08 Remarks", icon: FileText },
                  { id: "section-container", label: "09 Container", icon: Box },
                  { id: "section-shipping", label: "10 Shipping", icon: Ship },
                  { id: "section-afghan", label: "11 Docs", icon: ScrollText },
                ].map((sec) => {
                  const IconComponent = sec.icon
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(sec.id)
                        if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900 dark:hover:bg-slate-700 dark:hover:border-blue-700 dark:hover:text-white px-2 py-0.5 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 active:scale-95"
                    >
                      <IconComponent className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{sec.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

{/* ══════════════════════════════════════════════════════════════════════════════════
               REPOSITIONED LOGISTICS LAYOUT: 
               Left Column: Document Notes & Contacts
               Right Column TOP: Document Information
               Right Column BELOW: Truck & Driver Details
               ══════════════════════════════════════════════════════════════════════════════════ */}
            <div id="section-doc" className="logistics-page-layout grid grid-cols-1 min-[1200px]:grid-cols-2 gap-[18px] items-start w-full max-w-full min-w-0">
              {/* Left Column: Document Notes & Contacts */}
              <div className="logistics-left-column min-w-0 w-full">
                {/* Document Notes & Contacts Card */}
                <Card id="section-notes" className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col justify-between">
                  {/* Top Accent Strip */}
                  <div className="h-1 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500" />

                  <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-white/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-blue-600 text-white shadow-xs">
                            <Bookmark className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-slate-950 dark:text-slate-100 text-xs sm:text-sm tracking-tight uppercase select-none">
                                Document Notes &amp; Contacts
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">│</span>
                              <span className="font-[vazirmatn] text-blue-700 dark:text-blue-400 font-extrabold text-xs sm:text-sm">
                                یادداشت‌ها، مستندات و تماس‌های مربوطه
                              </span>
                            </div>
                            <span className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                              BOL Reference, Serial &amp; Issue Dates • <span className="font-[vazirmatn] text-blue-700 dark:text-blue-400">شماره و تاریخ‌های بارنامه</span>
                            </span>
                          </div>
                        </div>

                        {/* Top Action Buttons (Save to Presets, Sync with B/L, Reverse, Add Stop) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={openSaveRouteModal}
                            className="h-7 sm:h-7.5 rounded-lg border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-[10.5px] sm:text-xs font-black shadow-xs cursor-pointer transition-all gap-1"
                            title="Save current route path into Quick Presets list for one-click reuse"
                          >
                            <BookmarkPlus className="h-3.5 w-3.5 text-white" />
                            <span>Save to Presets / ذخیره مسیر</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={syncRoutesWithBOLPorts}
                            className="h-7 sm:h-7.5 rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/60 px-2.5 text-[10.5px] sm:text-xs font-extrabold text-blue-900 dark:text-blue-300 shadow-2xs hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-all"
                            title="Synchronize Stop 1 with Port of Loading and Last Stop with Port of Discharge"
                          >
                            <ArrowLeftRight className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                            <span>Sync with B/L / همگام‌سازی</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={reverseRoutes}
                            className="h-7 sm:h-7.5 rounded-lg border-purple-200 dark:border-purple-800 bg-purple-50/90 dark:bg-purple-950/60 px-2.5 text-[10.5px] sm:text-xs font-extrabold text-purple-900 dark:text-purple-300 shadow-2xs hover:bg-purple-100 dark:hover:bg-purple-900/60 cursor-pointer transition-all"
                            title="Reverse the entire route sequence"
                          >
                            <RotateCcw className="h-3 w-3 mr-1 text-purple-700 dark:text-purple-400" />
                            <span>Reverse / معکوس مسیر</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={addRouteStop}
                            className="h-7 sm:h-7.5 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 text-white px-2.5 text-[10.5px] sm:text-xs font-extrabold shadow-xs hover:from-amber-600 hover:to-orange-600 cursor-pointer transition-all"
                          >
                            <Plus className="h-3.5 w-3.5 mr-0.5 text-white" />
                            <span>Add Stop / افزودن توقف</span>
                          </Button>
                        </div>
                      </div>

                      {/* Quick Presets Strip */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          QUICK PRESETS:
                        </span>

                        {savedRoutePresets.map((preset, pIdx) => (
                          <div key={`left-saved-preset-${preset.id || pIdx}`} className="relative group inline-flex items-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => applyCustomRoutePreset(preset)}
                              className="h-6.5 rounded-lg border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/80 pr-5 pl-2 text-[10.5px] font-black text-amber-950 shadow-2xs hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 cursor-pointer transition-all gap-1"
                              title={`Click to apply ${preset.title} (${preset.routes.length} stops)`}
                            >
                              <span className="pointer-events-none">{preset.icon || "⭐"}</span>
                              <span className="max-w-[130px] truncate pointer-events-none">{preset.title}</span>
                              <span className="rounded-full bg-amber-200/90 px-1 py-0.2 text-[8.5px] font-black text-amber-900 pointer-events-none">
                                {preset.routes.length}
                              </span>
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteRoutePreset(preset.id, e)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-200 text-red-600 transition-all cursor-pointer"
                              title="Delete this saved preset"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyHeratIslamQalaDougharounPreset}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all gap-1"
                        >
                          <span>Islam Qala, AF ➔ Nhava ...</span>
                          <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-1 text-[8.5px] font-black">5</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyKandaharNimrozBandarAbbasDubaiIndiaPreset}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all gap-1"
                        >
                          <span>Kandahar, AF ➔ Nhava S...</span>
                          <span className="rounded-full bg-amber-200 dark:bg-amber-800 px-1 text-[8.5px] font-black">5</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyDogharonToMersinReeferExportPreset}
                          className="h-6.5 rounded-lg border border-cyan-300/80 bg-cyan-50/80 dark:bg-cyan-950/40 text-[10px] font-extrabold text-cyan-950 dark:text-cyan-200 shadow-2xs hover:bg-cyan-100 cursor-pointer transition-all"
                        >
                          <Ship className="h-3 w-3 mr-1 text-cyan-700" />
                          <span>Route 3: Dogharon ➔ Mersin Reefer ($14,494)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyDougharounToMersinExportPreset}
                          className="h-6.5 rounded-lg border border-purple-300/80 bg-purple-50/80 dark:bg-purple-950/40 text-[10px] font-extrabold text-purple-950 dark:text-purple-200 shadow-2xs hover:bg-purple-100 cursor-pointer transition-all"
                        >
                          <Truck className="h-3 w-3 mr-1 text-purple-700" />
                          <span>TR Route 1: Dougharoun ➡️ Mersin ($3,100)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyNimrozToBandarAbbasExportPreset}
                          className="h-6.5 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/40 text-[10px] font-extrabold text-amber-950 dark:text-amber-200 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all"
                        >
                          <Ship className="h-3 w-3 mr-1 text-amber-700" />
                          <span>TR Route 2: Nimroz ➡️ Bandar Abbas ($1,550)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyMazarHairatanTashkentPreset}
                          className="h-6.5 rounded-lg border border-emerald-300/80 bg-emerald-50/80 dark:bg-emerald-950/40 text-[10px] font-extrabold text-emerald-950 dark:text-emerald-200 shadow-2xs hover:bg-emerald-100 cursor-pointer transition-all"
                        >
                          <span>UZ Mazar ➔ Hairatan ➔ Tashkent</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyKabulDubaiAirPreset}
                          className="h-6.5 rounded-lg border border-blue-300/80 bg-blue-50/80 dark:bg-blue-950/40 text-[10px] font-extrabold text-blue-950 dark:text-blue-200 shadow-2xs hover:bg-blue-100 cursor-pointer transition-all"
                        >
                          <span>Kabul ➔ Dubai (Air)</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyKandaharChamanKarachiDubaiPreset}
                          className="h-6.5 rounded-lg border border-indigo-300/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-[10px] font-extrabold text-indigo-950 dark:text-indigo-200 shadow-2xs hover:bg-indigo-100 cursor-pointer transition-all"
                        >
                          <span>PK Kandahar ➔ Karachi ➔ Dubai</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={applyJaskSuwaiqSoharCorridorPreset}
                          className="h-6.5 rounded-lg border border-teal-300/80 bg-teal-50/80 dark:bg-teal-950/40 text-[10px] font-extrabold text-teal-950 dark:text-teal-200 shadow-2xs hover:bg-teal-100 cursor-pointer transition-all"
                        >
                          <Ship className="h-3 w-3 mr-1 text-teal-700" />
                          <span>OM/IR جاسک ➔ السویق ➔ صحار</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* ══════════════════════════════════════════════════════════════════
                        NOTE 1: Primary Loading & Dispatch Contact
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className={`p-4 rounded-2xl backdrop-blur-xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs ${getNoteThemeStyles(formData.notes_1_theme).container}`}>
                      {/* Note 1 Card Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white font-mono text-[10px] font-black tracking-wider shrink-0 shadow-2xs">
                            NOTE 01
                          </span>
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">Loading Contact</span>
                            <span className="text-slate-300 dark:text-slate-600">│</span>
                            <span className="font-[vazirmatn] text-[11px] text-blue-800 dark:text-blue-300 font-bold shrink-0" dir="rtl">مسئول بارگیری</span>
                          </div>
                        </div>

                        {/* Theme Palette Swatches & Clear */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                            {NOTE_THEMES.map((theme, tIdx) => (
                              <button
                                key={`note-theme-1-${theme.value}-${tIdx}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, notes_1_theme: theme.value })}
                                className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-120 cursor-pointer ${
                                  NOTE_THEME_BUTTON_CLASSES[theme.value] ?? ''
                                } ${
                                  formData.notes_1_theme === theme.value 
                                    ? 'border-slate-950 ring-2 ring-blue-500 ring-offset-1 scale-110' 
                                    : 'border-white/80 opacity-70 hover:opacity-100'
                                }`}
                                title={`Theme: ${theme.label}`}
                              />
                            ))}
                          </div>
                          {Boolean(formData.notes_1 || formData.notes_1_label) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearNote1}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition shrink-0"
                              title="Clear Note 1 / پاک کردن یادداشت ۱"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Note 1 Title Row with Title Quick-Chips */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <Input
                            type="text"
                            value={formData.notes_1_label || ""}
                            onChange={(e) => setFormData({ ...formData, notes_1_label: e.target.value })}
                            dir="auto"
                            placeholder="Note 1 Title (e.g. دکندهار بارگیری مسؤل / Loading Contact)..."
                            className={`h-8 px-2.5 text-xs font-bold rounded-xl transition ${getNoteThemeStyles(formData.notes_1_theme).input}`}
                          />
                        </div>

                        {/* Title Quick Suggestions */}
                        <div className="flex flex-wrap items-center gap-1 pl-5">
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 shrink-0">Suggestions:</span>
                          {[
                            "دکندهار بارگیری مسؤل",
                            "Loading Contact",
                            "مسئول بارگیری و هماهنگی",
                            "تماس صادرکننده (Shipper)",
                          ].map((suggestedTitle, stIdx) => (
                            <button
                              key={`sug-title-1-${suggestedTitle}-${stIdx}`}
                              type="button"
                              onClick={() => setFormData({ ...formData, notes_1_label: suggestedTitle })}
                              className={`text-[9.5pt] px-2 py-0.5 rounded-lg border font-medium cursor-pointer transition-all hover:scale-102 ${
                                formData.notes_1_label === suggestedTitle
                                  ? "bg-blue-600 text-white border-blue-600 font-bold shadow-2xs"
                                  : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              }`}
                            >
                              {suggestedTitle}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note 1 Preset Management Bar */}
                      <div className="space-y-1.5 bg-slate-50/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex-1 min-w-[170px]">
                            <Select
                              value={isNote1Selected ? selectedNote1Id : "none"}
                              onValueChange={(value) => {
                                if (value === "none") {
                                  setSelectedNote1Id("")
                                  return
                                }
                                applySavedNote1(value)
                              }}
                            >
                              <SelectTrigger className="h-7.5 text-xs border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium">
                                <SelectValue placeholder="Saved presets / الگوهای ذخیره شده" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="none" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  📋 Choose preset... ({savedNotes1.length} available)
                                </SelectItem>
                                {savedNotes1.map((opt, optIndex) => (
                                  <SelectItem key={`${opt.id || "note1"}-${optIndex}`} value={opt.id || `opt1-${optIndex}`} className="text-xs py-2">
                                    <div className="flex flex-col gap-0.5 text-left max-w-[280px]">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{opt.label}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                        {opt.content.replace(/\s+/g, ' ')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => saveCurrentNote1()}
                              disabled={!formData.notes_1?.trim() || Boolean(selectedSavedNote1 && !isNote1PresetDirty)}
                              className="h-7.5 px-2.5 text-xs font-bold border-blue-200 bg-white hover:bg-blue-50 text-blue-700 dark:bg-slate-900 dark:border-blue-800 dark:text-blue-300 rounded-lg shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                              title={selectedSavedNote1 ? "Update the selected preset" : "Save current note as new preset"}
                            >
                              {selectedSavedNote1 ? <RefreshCw className="h-3 w-3 mr-1 text-blue-600" /> : <Save className="h-3 w-3 mr-1 text-blue-600" />}
                              {selectedSavedNote1 ? "Update" : "Save preset"}
                            </Button>

                            {isNote1Selected && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCurrentNote1AsNew}
                                  disabled={!formData.notes_1?.trim()}
                                  className="h-7.5 px-2 text-xs border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-300 rounded-lg cursor-pointer"
                                  title="Keep existing and save as a new separate preset"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={deleteSavedNote1}
                                  className="h-7.5 px-1.5 text-xs border-red-200 bg-white hover:bg-red-50 text-red-600 dark:bg-slate-900 dark:border-red-800 dark:text-red-300 rounded-lg cursor-pointer"
                                  title="Delete the selected preset"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Preset Status Indicator */}
                        <div className="flex items-center justify-between text-[10px] px-1 font-semibold">
                          {selectedSavedNote1 ? (
                            isNote1PresetDirty ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  Customized for this BOL (Base: {selectedSavedNote1.label})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedNote1Id("")}
                                  className="text-[9px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                                  title="Detach from preset template"
                                >
                                  (Detach)
                                </button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active Preset: {selectedSavedNote1.label}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">Custom note entry (Title, content &amp; color save with BOL)</span>
                          )}
                        </div>
                      </div>

                      {/* ⚡ 1-Click Quick Fill Chips for Note 1 */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-500 fill-amber-400" />
                          <span>1-Click Quick Fill / پر کردن سریع:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                notes_1_label: "دکندهار بارگیری مسؤل",
                                notes_1: "نظرمحمد (یارمل)\n(+93) 0 700 203 307",
                                notes_1_theme: "blue",
                              }))
                              toast.success("Applied: نظرمحمد (یارمل) - کندهار")
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-blue-200/90 bg-white hover:bg-blue-50 text-blue-900 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-blue-800 dark:text-blue-200"
                          >
                            <span className="text-blue-600 font-mono text-[10px]">📍</span>
                            <span>نظرمحمد (یارمل) - کندهار</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                notes_1_label: "Sky Ariana Head Office",
                                notes_1: "دفتر مرکزی اسکای آریانا لیمیتد\n+93 700 939 365 / +93 711 435 529\ninfo@skyariana.com",
                                notes_1_theme: "blue",
                              }))
                              toast.success("Applied: دفتر مرکزی اسکای آریانا")
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-200/90 bg-white hover:bg-emerald-50 text-emerald-900 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-200"
                          >
                            <span className="text-emerald-600 font-mono text-[10px]">🏢</span>
                            <span>دفتر مرکزی اسکای آریانا</span>
                          </button>

                          {formData.shipper_name && (
                            <button
                              type="button"
                              onClick={() => {
                                const contactParts = [formData.shipper_name, formData.shipper_address].filter(Boolean).join("\n")
                                setFormData((prev) => ({
                                  ...prev,
                                  notes_1_label: "تماس فرستنده / Shipper Contact",
                                  notes_1: contactParts,
                                  notes_1_theme: "green",
                                }))
                                toast.success("Applied: تماس صادرکننده فعلی")
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                            >
                              <User className="h-3 w-3 text-slate-500" />
                              <span className="truncate max-w-[140px]">{formData.shipper_name}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Note 1 Textarea with Live Counters and Copy Action */}
                      <div className="space-y-1">
                        <Textarea
                          value={formData.notes_1 || ""}
                          onChange={(e) => setFormData({ ...formData, notes_1: e.target.value })}
                          dir="auto"
                          placeholder="Add custom loading/dispatch contact info (e.g. نظرمحمد (یارمل) (+93) 0 700 203 307)..."
                          className={`rounded-xl text-xs sm:text-sm font-semibold leading-relaxed resize-y font-[vazirmatn] shadow-xs ${getNoteThemeStyles(formData.notes_1_theme).textarea}`}
                          rows={3}
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 px-1 pt-0.5">
                          <span className="font-[vazirmatn] font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3 text-blue-600" />
                            نمایش در بخش Exporter Contacts بارنامه رسمی A4
                          </span>
                          <div className="flex items-center gap-2">
                            {formData.notes_1?.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                                    navigator.clipboard.writeText(formData.notes_1 || "")
                                    toast.success("Note 1 text copied to clipboard! 📋")
                                  }
                                }}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                Copy
                              </button>
                            )}
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                              {(formData.notes_1 || "").length} chars
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        NOTE 2: Border & Transit Representatives
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className={`p-4 rounded-2xl backdrop-blur-xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-xs ${getNoteThemeStyles(formData.notes_2_theme).container}`}>
                      {/* Note 2 Card Header */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-700 text-white font-mono text-[10px] font-black tracking-wider shrink-0 shadow-2xs">
                            NOTE 02
                          </span>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">Border Representatives</span>
                            <span className="text-slate-300 dark:text-slate-600">│</span>
                            <span className="font-[vazirmatn] text-[11px] text-indigo-800 dark:text-indigo-300 font-bold shrink-0" dir="rtl">نمایندگان مرزی</span>
                          </div>
                        </div>

                        {/* Theme Palette Swatches & Clear */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                            {NOTE_THEMES.map((theme, tIdx) => (
                              <button
                                key={`note-theme-2-${theme.value}-${tIdx}`}
                                type="button"
                                onClick={() => setFormData({ ...formData, notes_2_theme: theme.value })}
                                className={`w-3.5 h-3.5 rounded-full border transition-all hover:scale-120 cursor-pointer ${
                                  NOTE_THEME_BUTTON_CLASSES[theme.value] ?? ''
                                } ${
                                  formData.notes_2_theme === theme.value 
                                    ? 'border-slate-950 ring-2 ring-blue-500 ring-offset-1 scale-110' 
                                    : 'border-white/80 opacity-70 hover:opacity-100'
                                }`}
                                title={`Theme: ${theme.label}`}
                              />
                            ))}
                          </div>
                          {Boolean(formData.notes_2 || formData.notes_2_label) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleClearNote2}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition shrink-0"
                              title="Clear Note 2 / پاک کردن یادداشت ۲"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Note 2 Title Row with Title Quick-Chips */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <Input
                            type="text"
                            value={formData.notes_2_label || ""}
                            onChange={(e) => setFormData({ ...formData, notes_2_label: e.target.value })}
                            dir="auto"
                            placeholder="Note 2 Title (e.g. نماینده مرزی و گمرک / Border Representative)..."
                            className={`h-8 px-2.5 text-xs font-bold rounded-xl transition ${getNoteThemeStyles(formData.notes_2_theme).input}`}
                          />
                        </div>

                        {/* Title Quick Suggestions */}
                        <div className="flex flex-wrap items-center gap-1 pl-5">
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 shrink-0">Suggestions:</span>
                          {[
                            "نماینده مرزی و گمرک",
                            "نماینده دوغارون و اسلام قلعه",
                            "نماینده نمبرونه - نیمروز",
                            "Border Representative",
                            "Customs Clearance",
                          ].map((suggestedTitle, stIdx) => (
                            <button
                              key={`sug-title-2-${suggestedTitle}-${stIdx}`}
                              type="button"
                              onClick={() => {
                                const matched = savedNotes2.find((n) => n.label.trim().toLowerCase() === suggestedTitle.trim().toLowerCase())
                                if (matched) {
                                  applySavedNote2(matched.id)
                                } else {
                                  if (selectedNote2Id) setSelectedNote2Id("")
                                  setFormData((prev) => ({ ...prev, notes_2_label: suggestedTitle }))
                                }
                              }}
                              className={`text-[9.5pt] px-2 py-0.5 rounded-lg border font-medium cursor-pointer transition-all hover:scale-102 ${
                                formData.notes_2_label === suggestedTitle
                                  ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                                  : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              }`}
                            >
                              {suggestedTitle}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note 2 Preset Management Bar */}
                      <div className="space-y-1.5 bg-slate-50/70 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex-1 min-w-[170px]">
                            <Select
                              value={isNote2Selected ? selectedNote2Id : "none"}
                              onValueChange={(value) => {
                                if (value === "none") {
                                  setSelectedNote2Id("")
                                  return
                                }
                                applySavedNote2(value)
                              }}
                            >
                              <SelectTrigger className="h-7.5 text-xs border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-medium">
                                <SelectValue placeholder="Saved presets / الگوهای ذخیره شده" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="none" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  📋 Choose preset... ({savedNotes2.length} available)
                                </SelectItem>
                                {savedNotes2.map((opt, optIndex) => (
                                  <SelectItem key={`${opt.id || "note2"}-${optIndex}`} value={opt.id || `opt2-${optIndex}`} className="text-xs py-2">
                                    <div className="flex flex-col gap-0.5 text-left max-w-[280px]">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{opt.label}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                        {opt.content.replace(/\s+/g, ' ')}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => saveCurrentNote2()}
                              disabled={!formData.notes_2?.trim() || Boolean(selectedSavedNote2 && !isNote2PresetDirty)}
                              className="h-7.5 px-2.5 text-xs font-bold border-blue-200 bg-white hover:bg-blue-50 text-blue-700 dark:bg-slate-900 dark:border-blue-800 dark:text-blue-300 rounded-lg shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                              title={selectedSavedNote2 ? "Update master preset template" : "Save current note as new preset"}
                            >
                              {selectedSavedNote2 ? <RefreshCw className="h-3 w-3 mr-1 text-blue-600" /> : <Save className="h-3 w-3 mr-1 text-blue-600" />}
                              {selectedSavedNote2 ? "Update" : "Save preset"}
                            </Button>

                            {isNote2Selected && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCurrentNote2AsNew}
                                  disabled={!formData.notes_2?.trim()}
                                  className="h-7.5 px-2 text-xs border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-300 rounded-lg cursor-pointer"
                                  title="Keep existing and save as a new separate preset"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={deleteSavedNote2}
                                  className="h-7.5 px-1.5 text-xs border-red-200 bg-white hover:bg-red-50 text-red-600 dark:bg-slate-900 dark:border-red-800 dark:text-red-300 rounded-lg cursor-pointer"
                                  title="Delete the selected preset"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Preset Status Indicator */}
                        <div className="flex items-center justify-between text-[10px] px-1 font-semibold">
                          {isNote2Selected && selectedSavedNote2 ? (
                            isNote2PresetDirty ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  Customized for this BOL (Base: {selectedSavedNote2.label})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedNote2Id("")}
                                  className="text-[9px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                                  title="Detach from preset template"
                                >
                                  (Detach)
                                </button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active Preset: {selectedSavedNote2.label}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">Custom note entry (Title, content &amp; color save with BOL)</span>
                          )}
                        </div>
                      </div>

                      {/* ⚡ 1-Click Quick Fill Chips for Note 2 (Border Stations) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1">
                          <Zap className="h-3 w-3 text-amber-500 fill-amber-400" />
                          <span>1-Click Border Stations / ایستگاه‌های مرزی و گمرک:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              applyBorderStationPreset(
                                "n2-dougharoun-islamqala",
                                "نماینده دوغارون و اسلام قلعه",
                                "عبدالوهاب ریگوال اسلام قلعه / نجیب الله حسین محمودی مقدم\n0796140001  0703130001\nنماینده دوغارون / شماره تماس : 09152091993",
                                "blue"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              formData.notes_2?.includes("عبدالوهاب ریگوال") || (isNote2Selected && selectedNote2Id === "n2-dougharoun-islamqala")
                                ? "border-blue-500 bg-blue-100 text-blue-950 ring-2 ring-blue-400/40 shadow-xs dark:bg-blue-950 dark:border-blue-400 dark:text-blue-100"
                                : "border-blue-200/90 bg-white hover:bg-blue-50 text-blue-900 shadow-2xs hover:scale-102 dark:bg-slate-900 dark:border-blue-800 dark:text-blue-200"
                            }`}
                          >
                            <span className="text-blue-600 font-mono text-[10px]">🛂</span>
                            <span>دوغارون و اسلام‌قلعه</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              applyBorderStationPreset(
                                "n2-nimroz-milak",
                                "نماینده نمبرونه - نیمروز",
                                "نماینده نیمروز و میلک\n0711 263 528 │ 079 335 3246",
                                "red"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              formData.notes_2?.includes("نیمروز و میلک") || (isNote2Selected && selectedNote2Id === "n2-nimroz-milak")
                                ? "border-rose-500 bg-rose-100 text-rose-950 ring-2 ring-rose-400/40 shadow-xs dark:bg-rose-950 dark:border-rose-400 dark:text-rose-100"
                                : "border-rose-200/90 bg-white hover:bg-rose-50 text-rose-900 shadow-2xs hover:scale-102 dark:bg-slate-900 dark:border-rose-800 dark:text-rose-200"
                            }`}
                          >
                            <span className="text-rose-600 font-mono text-[10px]">🛂</span>
                            <span>نیمروز و میلک</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              applyBorderStationPreset(
                                "n2-torghundi",
                                "نماینده تورغندی و هرات",
                                "نماینده مرزی تورغندی و هرات\nحاجی معلم صاحب : 0799007371 │ عصمت الله : 0729807676 │ حکمت الله : 0794983011",
                                "purple"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              formData.notes_2?.includes("تورغندی و هرات") || (isNote2Selected && selectedNote2Id === "n2-torghundi")
                                ? "border-purple-500 bg-purple-100 text-purple-950 ring-2 ring-purple-400/40 shadow-xs dark:bg-purple-950 dark:border-purple-400 dark:text-purple-100"
                                : "border-purple-200/90 bg-white hover:bg-purple-50 text-purple-900 shadow-2xs hover:scale-102 dark:bg-slate-900 dark:border-purple-800 dark:text-purple-200"
                            }`}
                          >
                            <span className="text-purple-600 font-mono text-[10px]">🛂</span>
                            <span>تورغندی و هرات</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              applyBorderStationPreset(
                                "n2-hairatan",
                                "نماینده حیرتان و مزار شریف",
                                "نماینده مرزی حیرتان و بلخ\nدفتر بندر حیرتان : 0700939365 │ 0700203307",
                                "green"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              formData.notes_2?.includes("حیرتان و بلخ") || (isNote2Selected && selectedNote2Id === "n2-hairatan")
                                ? "border-emerald-500 bg-emerald-100 text-emerald-950 ring-2 ring-emerald-400/40 shadow-xs dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-100"
                                : "border-emerald-200/90 bg-white hover:bg-emerald-50 text-emerald-900 shadow-2xs hover:scale-102 dark:bg-slate-900 dark:border-emerald-800 dark:text-emerald-200"
                            }`}
                          >
                            <span className="text-emerald-600 font-mono text-[10px]">🛂</span>
                            <span>حیرتان و مزار شریف</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              applyBorderStationPreset(
                                "n2-spinboldak",
                                "نماینده اسپین بولدک - قندهار",
                                "نماینده مرزی اسپین بولدک و چمن\nدفتر بولدک : 0700203307 │ 0700939365",
                                "orange"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              formData.notes_2?.includes("اسپین بولدک") || (isNote2Selected && selectedNote2Id === "n2-spinboldak")
                                ? "border-amber-500 bg-amber-100 text-amber-950 ring-2 ring-amber-400/40 shadow-xs dark:bg-amber-950 dark:border-amber-400 dark:text-amber-100"
                                : "border-amber-200/90 bg-white hover:bg-amber-50 text-amber-900 shadow-2xs hover:scale-102 dark:bg-slate-900 dark:border-amber-800 dark:text-amber-200"
                            }`}
                          >
                            <span className="text-amber-600 font-mono text-[10px]">🛂</span>
                            <span>اسپین بولدک</span>
                          </button>
                        </div>
                      </div>

                      {/* Note 2 Textarea with Live Counters and Copy Action */}
                      <div className="space-y-1">
                        <Textarea
                          value={formData.notes_2 || ""}
                          onChange={(e) => setFormData({ ...formData, notes_2: e.target.value })}
                          dir="auto"
                          placeholder="Add border representative contact info, customs clearance notes, phone numbers..."
                          className={`rounded-xl text-xs sm:text-sm font-semibold leading-relaxed resize-y font-[vazirmatn] shadow-xs ${getNoteThemeStyles(formData.notes_2_theme).textarea}`}
                          rows={3}
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 px-1 pt-0.5">
                          <span className="font-[vazirmatn] font-medium flex items-center gap-1">
                            <FileText className="h-3 w-3 text-indigo-600" />
                            نمایش در بخش Exporter Contacts بارنامه رسمی A4
                          </span>
                          <div className="flex items-center gap-2">
                            {formData.notes_2?.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                                    navigator.clipboard.writeText(formData.notes_2 || "")
                                    toast.success("Note 2 text copied to clipboard! 📋")
                                  }
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                Copy
                              </button>
                            )}
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                              {(formData.notes_2 || "").length} chars
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Document Information (TOP) + Truck & Driver Details (BELOW) */}
              <div className="logistics-right-column min-w-0 w-full flex flex-col gap-[18px]">
                            {/* 01 Document Information Card */}
            <Card id="section-doc-info" className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
              {/* Top Accent Strip */}
              <div className="h-1 w-full bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500" />
              
              <CardHeader className="py-2 px-3 sm:py-2.5 sm:px-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-white/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                <CardTitle className="text-sm flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 text-white text-[11px] font-black shadow-2xs">
                      01
                    </span>
                    <div className="p-1.5 rounded-xl bg-linear-to-br from-blue-500/10 to-indigo-500/15 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/70 shadow-2xs">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-950 dark:text-slate-100 text-xs sm:text-sm tracking-tight select-none">Document Information</span>
                        <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          BOL Header
                        </span>
                      </div>
                      <span className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                        BOL Reference, Serial & Issue Dates • <span className="font-[vazirmatn] text-blue-700 dark:text-blue-400">شماره و تاریخ‌های بارنامه</span>
                      </span>
                    </div>
                  </div>

                  {/* Header Actions & Badges */}
                  <div className="flex items-center flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="inline-flex items-center gap-1 h-6.5 px-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/60 border border-blue-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                      title="Set issue date to today / تنظیم به تاریخ امروز"
                    >
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>Today / امروز</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleIncrementBolNumber}
                      className="inline-flex items-center gap-1 h-6.5 px-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/60 border border-indigo-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                      title="Generate next BOL sequence number / ایجاد شماره بارنامه بعدی"
                    >
                      <Plus className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Next BOL #</span>
                    </button>

                    <span className="hidden sm:inline-flex text-[11px] font-extrabold text-blue-900 dark:text-blue-300 font-[vazirmatn] bg-white/90 dark:bg-slate-850 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-2xs">
                      اطلاعات سند و تاریخ‌ها
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 p-3 sm:p-4">
                {/* 3-Column Grid for BOL Number & Issue Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5">
                  {/* 1. BOL Number */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-linear-to-br from-blue-50/80 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="p-0.5 rounded-md bg-blue-600 text-white">
                            <Hash className="w-3 h-3" />
                          </span>
                          <span>BOL Number</span>
                        </label>
                        <span className="font-[vazirmatn] text-blue-800 dark:text-blue-400 font-bold text-[11px]">شماره بارنامه</span>
                      </div>

                      {isEditingBolNumber ? (
                        <div className="flex gap-1.5 mt-1">
                          <Input
                            value={bolNumber}
                            onChange={(e) => setBolNumber(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setIsEditingBolNumber(false)
                            }}
                            className="font-mono font-black text-xs sm:text-sm text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-blue-300 dark:border-blue-700 shadow-inner rounded-xl h-8.5 sm:h-9 focus:ring-2 focus:ring-blue-500/20 uppercase"
                            placeholder="BOL-2026-NSA685"
                            autoFocus
                          />
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsEditingBolNumber(false)}
                            className="rounded-xl h-8.5 sm:h-9 px-3 font-bold text-xs bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Done
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 px-2.5 py-1 sm:py-1.5 bg-white dark:bg-slate-950 rounded-xl font-mono font-black text-xs sm:text-sm text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-slate-700 shadow-2xs flex items-center justify-between overflow-hidden">
                            <span className="truncate tracking-wide">{isLoading ? <Loader2 className="h-3 w-3 animate-spin text-blue-600" /> : bolNumber || "BOL-000"}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 uppercase">Live</span>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsEditingBolNumber(true)}
                            className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-blue-200 dark:border-slate-700 text-blue-700 dark:text-slate-200 shadow-2xs shrink-0 cursor-pointer"
                            title="Edit BOL Number manually"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyBolNumber}
                            className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-blue-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs shrink-0 cursor-pointer"
                            title="Copy BOL Number to clipboard"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 pt-1.5 border-t border-blue-100 dark:border-slate-800 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                      <span>Unique Document ID</span>
                      <button
                        type="button"
                        onClick={handleIncrementBolNumber}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Auto +1
                      </button>
                    </div>
                  </div>

                  {/* 2. Issue Date (Gregorian) */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-linear-to-br from-indigo-50/80 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-indigo-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="p-0.5 rounded-md bg-indigo-600 text-white">
                            <Calendar className="w-3 h-3" />
                          </span>
                          <span>Issue Date (Gregorian)</span>
                        </label>
                        <span className="font-[vazirmatn] text-indigo-800 dark:text-indigo-400 font-bold text-[11px]">تاریخ میلادی</span>
                      </div>

                      <div className="relative flex items-center mt-1">
                        <div className="absolute left-2.5 text-indigo-600 dark:text-indigo-400 pointer-events-none">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <Input
                          type="date"
                          value={issueDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="pl-8 font-mono font-black text-xs sm:text-sm text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-indigo-200 dark:border-indigo-900/60 shadow-2xs rounded-xl h-8.5 sm:h-9 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-indigo-100 dark:border-slate-800 flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {issueDate ? new Date(issueDate).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "Select date"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSetToday}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                        >
                          Today
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={handleSetYesterday}
                          className="text-slate-500 dark:text-slate-400 font-bold hover:underline cursor-pointer"
                        >
                          -1d
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Issue Date (Persian Solar) */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-linear-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="p-0.5 rounded-md bg-emerald-600 text-white">
                            <Globe className="w-3 h-3" />
                          </span>
                          <span>Issue Date (Persian)</span>
                        </label>
                        <span className="font-[vazirmatn] text-emerald-800 dark:text-emerald-400 font-bold text-[11px]">تاریخ هجری شمسی</span>
                      </div>

                      <div className="px-2.5 py-1 bg-white dark:bg-slate-950 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs flex flex-col items-start justify-center h-8.5 sm:h-9">
                        <p className="font-[vazirmatn] text-[11px] font-black text-slate-900 dark:text-slate-100 leading-tight truncate w-full" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                          {persianDate || "محاسبه خودکار..."}
                        </p>
                        <p className="font-[vazirmatn] text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 leading-tight font-mono" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                          {persianDateNumeric || "--/--/----"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-emerald-100 dark:border-slate-800 flex items-center justify-between text-[10.5px]">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 font-[vazirmatn]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        محاسبه خودکار خورشیدی
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-mono">Solar Hijri</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
                                {/* 02 Truck & Driver Details Card */}
                <Card id="section-truck" className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(30,58,138,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
                  {/* Top Accent Strip */}
                  <div className="h-1 w-full bg-linear-to-r from-sky-500 via-blue-600 to-indigo-600" />

                  <CardHeader className="py-2.5 px-3 sm:py-3 sm:px-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-sky-50/80 via-blue-50/40 to-white/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      {/* Left: Icon, Title & Badge */}
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs">
                          <Truck className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                            <span>Truck & Driver Details</span>
                            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                              Transport Vehicle
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-[vazirmatn]">
                            اطلاعات موتر، راننده، شماره تماس و کرایه توافقی
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick Rent Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: "46,000 AFN", value: "46,000 AFN - کرایه واپسی" },
                          { label: "45,000 AFN", value: "45,000 AFN - کرایه واپسی" },
                          { label: "53,000 AFN", value: "53,000 AFN - کرایه واپسی" },
                          { label: "38,500 AFN", value: "38,500 AFN - کرایه واپسی" },
                        ].map((preset, pIdx) => (
                          <button
                            key={`rent-preset-${pIdx}`}
                            type="button"
                            onClick={() => {
                              startTransition(() => {
                                setFormData((prev) => ({ ...prev, driver_rent: preset.value }))
                                setHasUnsavedChanges(true)
                              })
                              toast.success(`Set Driver Rent: ${preset.value}`)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-400 shadow-2xs hover:scale-102 transition cursor-pointer"
                          >
                            <span className="text-amber-500 font-black">⚡</span>
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 sm:p-4 space-y-3.5">
                    {/* Row 1: Vehicle & Driver Identity (3 Columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {/* 1. Truck No */}
                      <div>
                        <label className="mb-1 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Truck No.</span>
                          </span>
                          <span className="font-[vazirmatn] text-[10.5px] font-bold text-blue-800 dark:text-blue-400">شماره موتر/کامیون</span>
                        </label>
                        <Input
                          name="truck_number"
                          value={formData.truck_number}
                          onChange={handleInputChange}
                          placeholder="e.g. 3292 هلمند"
                          className="rounded-xl h-8.5 sm:h-9 font-mono text-xs sm:text-sm font-black uppercase text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-[vazirmatn]"
                        />
                      </div>

                      {/* 2. Driver Name */}
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Driver Name</span>
                          </label>
                          <span className="font-[vazirmatn] text-[10.5px] font-bold text-blue-800 dark:text-blue-400">نام راننده</span>
                        </div>
                        <div className="relative">
                          <Input
                            name="driver_name"
                            value={formData.driver_name}
                            onChange={(e) => {
                              const raw = e.target.value
                              handleFieldChange("driver_name", raw)
                            }}
                            onBlur={() => {
                              const sanitized = (formData.driver_name || "").replace(/^[\s,،-]+|[\s,،-]+$/g, "").trim()
                              if (sanitized !== formData.driver_name) {
                                setFormData((prev) => ({ ...prev, driver_name: sanitized }))
                              }
                            }}
                            placeholder="Enter driver name..."
                            className="rounded-xl h-8.5 sm:h-9 text-xs sm:text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-[vazirmatn]"
                          />
                        </div>
                        {/* Auto-split Father Name when 'ولد' or 'بن' is present */}
                        {Boolean(formData.driver_name && /(?:ولد|بن)\s+/i.test(formData.driver_name) && !formData.driver_father_name?.trim()) && (
                          <button
                            type="button"
                            onClick={splitDriverFatherName}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                            title="Automatically split 'ولد' into Father Name"
                          >
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>Auto-split Father Name (ولد عبدالله)</span>
                          </button>
                        )}
                      </div>

                      {/* 3. Father Name */}
                      <div>
                        <label className="mb-1 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Father Name</span>
                          </span>
                          <span className="font-[vazirmatn] text-[10.5px] font-bold text-blue-800 dark:text-blue-400">نام پدر</span>
                        </label>
                        <Input
                          name="driver_father_name"
                          value={formData.driver_father_name}
                          onChange={handleInputChange}
                          placeholder="Father's name..."
                          className="rounded-xl h-8.5 sm:h-9 text-xs sm:text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-[vazirmatn]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Driver Contact & Generous Rent (2:3 Proportional Layout) */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3 items-start">
                      {/* 4. Driver Contact (2 cols = ~40% width) */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Driver Contact</span>
                          </span>
                          <span className="font-[vazirmatn] text-[10.5px] font-bold text-blue-800 dark:text-blue-400">شماره تماس راننده</span>
                        </label>
                        <Input
                          name="driver_contact"
                          value={formData.driver_contact}
                          onChange={handleInputChange}
                          placeholder="+93 700 123 456"
                          type="tel"
                          className="rounded-xl h-8.5 sm:h-9 font-mono text-xs sm:text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      {/* 5. Driver Rent (3 cols = ~60% width - Full text visible without clipping) */}
                      <div className="sm:col-span-3">
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Driver Rent (Agreed Freight)</span>
                          </label>
                          <span className="font-[vazirmatn] text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-400">کرایه راننده</span>
                        </div>
                        <div className="relative">
                          <Input
                            name="driver_rent"
                            value={formData.driver_rent}
                            onChange={handleInputChange}
                            onBlur={() => {
                              const formatted = formatCanonicalDriverRent(formData.driver_rent)
                              if (formatted && formatted !== formData.driver_rent) {
                                setFormData((prev) => ({ ...prev, driver_rent: formatted }))
                              }
                            }}
                            placeholder="46,000 AFN - کرایه واپسی"
                            className="rounded-xl h-8.5 sm:h-9 text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all font-mono"
                            style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                          />
                        </div>
                        {/* Quick Suffix Modifiers */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-400 font-medium">Quick suffix:</span>
                          {["کرایه واپسی", "کرایه رفت", "صافی"].map((suffix) => (
                            <button
                              key={suffix}
                              type="button"
                              onClick={() => {
                                const current = (formData.driver_rent || "").trim()
                                const numMatch = current.match(/^([\d,]+(?:\.\d+)?\s*(?:AFN|USD)?)/i)
                                const base = numMatch ? numMatch[1].trim() : current || "46,000 AFN"
                                const nextRent = `${base} - ${suffix}`
                                setFormData((prev) => ({ ...prev, driver_rent: nextRent }))
                                setHasUnsavedChanges(true)
                              }}
                              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer font-[vazirmatn]"
                            >
                              +{suffix}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Official Afghan Vehicle Plate & Preset Manager */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center gap-4">
                      {/* Left: Afghan Plate Preview */}
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="p-1.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                          <AfghanTruckPlate value={formData.truck_number || "3292 هلمند"} size="compact" />
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-400 font-[vazirmatn]">
                          پلاک رسمی موتر • Official Afghan Plate
                        </span>
                      </div>

                      {/* Right: Real Vehicle & Driver Preset Manager */}
                      <div className="flex-1 min-w-0 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex-1 min-w-[200px]">
                            <Select
                              value={isTruckPresetSelected ? selectedTruckPresetId : "none"}
                              onValueChange={(value) => {
                                if (value === "none") {
                                  setSelectedTruckPresetId("")
                                  return
                                }
                                applyTruckPreset(value)
                              }}
                            >
                              <SelectTrigger className="h-8 w-full text-xs border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl font-medium shadow-2xs">
                                <SelectValue placeholder="🚚 Choose Vehicle Preset / الگوهای موتر" />
                              </SelectTrigger>
                              <SelectContent className="max-h-64 dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="none" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  📋 Choose saved vehicle... ({savedTruckPresets.length} available)
                                </SelectItem>
                                {savedTruckPresets.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id} className="text-xs py-2">
                                    <div className="flex flex-col gap-0.5 text-left max-w-[340px]">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{opt.label}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                        {opt.truck_number} • {opt.driver_name} • {opt.driver_rent}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={saveCurrentTruckPreset}
                            className="h-8 px-3 text-xs font-bold border-blue-200 bg-white hover:bg-blue-50 text-blue-700 dark:bg-slate-900 dark:border-blue-800 dark:text-blue-300 rounded-xl shadow-2xs cursor-pointer"
                            title="Save current truck and driver details as a reusable preset"
                          >
                            <Save className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                            <span>Save preset</span>
                          </Button>
                        </div>

                        {/* 1-Click Route & Vehicle Rent Bar */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span>1-Click Route & Vehicle Rent / انتخاب سریع مسیر:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              {
                                icon: "📍",
                                label: "تخفیف (یارمل) - کندهار",
                                truck: "3292 هلمند",
                                driver: "محمد",
                                father: "عبدالله",
                                contact: "+93 703751149",
                                rent: "46,000 AFN - کرایه واپسی",
                                color: "text-blue-900 border-blue-200/90 bg-blue-50/50 hover:bg-blue-100/70",
                              },
                              {
                                icon: "🏢",
                                label: "دفتر مرکزی اسکای آریانا",
                                truck: "38552 هرات",
                                driver: "احمد",
                                father: "غلام‌سخی",
                                contact: "+93 799123456",
                                rent: "45,000 AFN - کرایه واپسی",
                                color: "text-emerald-900 border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-100/70",
                              },
                              {
                                icon: "🚚",
                                label: "RAHMAT NAZAR LTD",
                                truck: "2877 کابل",
                                driver: "نجیب‌الله",
                                father: "شیرخان",
                                contact: "+93 788654321",
                                rent: "53,000 AFN - کرایه واپسی",
                                color: "text-indigo-900 border-indigo-200/90 bg-indigo-50/50 hover:bg-indigo-100/70",
                              },
                              {
                                icon: "🛡️",
                                label: "نیمروز - زرنج (ترانزیت)",
                                truck: "1943 نیمروز",
                                driver: "عبدالحکیم",
                                father: "بسم‌الله",
                                contact: "+93 777987654",
                                rent: "38,500 AFN - کرایه واپسی",
                                color: "text-purple-900 border-purple-200/90 bg-purple-50/50 hover:bg-purple-100/70",
                              },
                            ].map((routeItem, rIdx) => (
                              <button
                                key={`route-preset-${rIdx}`}
                                type="button"
                                onClick={() => {
                                  startTransition(() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      truck_number: routeItem.truck,
                                      driver_name: routeItem.driver,
                                      driver_father_name: routeItem.father,
                                      driver_contact: routeItem.contact,
                                      driver_rent: routeItem.rent,
                                    }))
                                    setHasUnsavedChanges(true)
                                  })
                                  toast.success(`Applied vehicle & route: ${routeItem.label}`)
                                }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs hover:scale-102 transition cursor-pointer dark:bg-slate-900 ${routeItem.color}`}
                              >
                                <span>{routeItem.icon}</span>
                                <span>{routeItem.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 02 Shipper, 03 Consignee & 04 Notify Party — 3-Column Side-by-Side Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
              {/* 02 Shipper Card */}
              <Card id="section-shipper" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-blue-200/90 dark:border-blue-900/50 shadow-md shadow-blue-500/5 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2 pt-3 px-3 sm:px-3.5 xl:px-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-blue-50/80 via-indigo-50/40 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-1 sm:gap-1.5 flex-nowrap min-w-0 w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-[10.5px] font-black shadow-xs shrink-0">
                          02
                        </span>
                        <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 shrink">
                          <span className="font-extrabold text-slate-950 dark:text-slate-100 text-xs sm:text-[13px] tracking-tight select-none truncate block">Shipper<span className="hidden xl:inline"> / Exporter</span></span>
                          <span className="text-[9.5px] sm:text-[10px] text-blue-700 dark:text-blue-400 font-bold block font-[vazirmatn] truncate">فرستنده<span className="hidden xl:inline"> / صادرکننده</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-nowrap ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSwapShipperConsignee}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 gap-1"
                          title="Swap Shipper with Consignee"
                        >
                          <ArrowLeftRight className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Swap</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyShipperToNotify}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 gap-1"
                          title="Copy Shipper to Notify Party"
                        >
                          <Copy className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Notify</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearShipperFields}
                          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center p-0 shrink-0"
                          title="Clear all Shipper fields"
                        >
                          ✕
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3.5 p-4 sm:p-5">
                    {/* Saved Shippers Directory Bar */}
                    <div className="rounded-2xl border border-blue-200/80 dark:border-slate-800 bg-linear-to-br from-blue-50/80 to-indigo-50/40 dark:from-slate-900/90 dark:to-slate-850/90 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                      {/* Header with Title, Live Badge & Browse All Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">Directory</span>
                          <span className="rounded-full bg-blue-200/90 dark:bg-blue-900/70 px-2 py-0.5 text-[10px] font-black text-blue-950 dark:text-blue-200 shadow-2xs">
                            {shipperDirectorySearch
                              ? `${filteredSavedShippers.length} / ${savedShippers.length}`
                              : `${savedShippers.length} Verified`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBrowseShipperModalOpen(true)}
                            className="text-[11px] font-black text-blue-800 dark:text-blue-400 hover:text-blue-950 dark:hover:text-blue-300 underline flex items-center gap-1 cursor-pointer transition-colors"
                            title="Browse full searchable directory table with addresses and contacts"
                          >
                            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Browse All ({savedShippers.length})</span>
                          </button>
                          <span className="font-[vazirmatn] text-blue-900 dark:text-blue-400 font-bold text-[10.5px]" dir="rtl">
                            فرستنده‌های ذخیره شده
                          </span>
                        </div>
                      </div>

                      {/* Quick Directory Filter Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-blue-600/70 dark:text-blue-400/70 pointer-events-none" />
                        <Input
                          value={shipperDirectorySearch}
                          onChange={(e) => setShipperDirectorySearch(e.target.value)}
                          placeholder={`Filter all ${savedShippers.length} shippers (search name, city, address)...`}
                          className="h-8.5 pl-8 pr-7 text-xs font-bold bg-white/95 dark:bg-slate-950 border-blue-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium text-slate-900 dark:text-slate-100"
                        />
                        {shipperDirectorySearch && (
                          <button
                            type="button"
                            onClick={() => setShipperDirectorySearch("")}
                            className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Select Dropdown */}
                      <Select
                        value={isShipperSelected ? selectedShipperId : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            setSelectedShipperId("")
                            return
                          }
                          applySavedShipper(value)
                        }}
                      >
                        <SelectTrigger className="h-9.5 w-full text-xs font-bold text-slate-900 dark:text-slate-100 border-white dark:border-slate-700 bg-white/95 dark:bg-slate-950 backdrop-blur-md rounded-xl shadow-2xs">
                          <SelectValue placeholder={shipperDirectorySearch ? `Select from ${filteredSavedShippers.length} matching...` : `Select from directory (${savedShippers.length} available)...`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 dark:bg-slate-900 dark:border-slate-800">
                          <SelectItem value="none">
                            {shipperDirectorySearch
                              ? `-- Matching ${filteredSavedShippers.length} of ${savedShippers.length} shippers --`
                              : `-- Select from all ${savedShippers.length} saved shippers --`}
                          </SelectItem>
                          {filteredSavedShippers.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                              No shippers match "{shipperDirectorySearch}"
                            </div>
                          ) : (
                            filteredSavedShippers.map((shipper, index) => (
                              <SelectItem key={`${shipper.id}-${index}`} value={shipper.id} className="text-xs py-2">
                                <div className="flex flex-col gap-0.5 text-left max-w-[340px]">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{shipper.name}</span>
                                  {(shipper.address || shipper.contact || shipper.email) && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                      {[shipper.address, shipper.contact, shipper.email].filter(Boolean).join(" • ")}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <div>
                          {isShipperSelected ? (
                            <button
                              type="button"
                              onClick={() => setSelectedShipperId("")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-900 dark:text-blue-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer shadow-2xs"
                              title="Clear directory selection without deleting record"
                            >
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              <span>Linked</span>
                              <span className="text-slate-400 hover:text-red-600 ml-0.5">✕</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {formData.shipper_name ? (isShipperExisting ? "Matches directory" : "Unsaved company") : "Select or type below"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveCurrentShipper}
                            className={`h-7.5 px-3 text-xs font-black rounded-lg shadow-xs cursor-pointer transition-all ${
                              isShipperExisting
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                            }`}
                            title={isShipperExisting ? "Update existing shipper in directory" : "Save as new shipper in directory"}
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {isShipperExisting ? "Update" : "Save New"}
                          </Button>
                          {isShipperSelected && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={deleteSavedShipper}
                              className="h-7.5 w-7.5 p-0 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg shadow-xs cursor-pointer flex items-center justify-center"
                              title="Delete selected saved shipper from directory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Shipper Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-0.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                        Presets:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            shipper_name: "AFGHAN ARYA DRY FRUITS & SAFFRON EXPORT CO.",
                            shipper_address: "Charahi Haji Yaqoob, Shahr-e-Naw, Kabul, Afghanistan",
                            shipper_contact: "+93 700 284 920",
                            shipper_email: "export@afghanarya.af",
                          }))
                          toast.success("Loaded Afghan Exporter preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        🇦🇫 Kabul
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            shipper_name: "SKY ARIANA GLOBAL LOGISTICS FZE",
                            shipper_address: "Jebel Ali Free Zone (JAFZA), Dubai, United Arab Emirates",
                            shipper_contact: "+971 4 881 2345",
                            shipper_email: "ops@skyarianalogistics.com",
                          }))
                          toast.success("Loaded Dubai Shipper preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        🇦🇪 Dubai
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            shipper_name: "YAFEZ INTERNATIONAL TRADING CO.",
                            shipper_address: "Boulevard Imam Khomeini, Bandar Abbas, Iran",
                            shipper_contact: "+98 76 3222 6028",
                            shipper_email: "yafez.trade@gmail.com",
                          }))
                          toast.success("Loaded Iran Exporter preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        🇮🇷 Iran
                      </button>
                    </div>

                    {/* Shipper Name with Live Floating Autocomplete */}
                    <div className="relative">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Shipper Name</span>
                          {isShipperExisting && (
                            <span className="rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-1 py-0.2 text-[8.5px] font-black">Directory</span>
                          )}
                        </span>
                        <span className="font-[vazirmatn] text-blue-900 dark:text-blue-400 font-bold text-[10.5px]">نام فرستنده</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-blue-600 dark:text-blue-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </div>
                        <ShipperNameInput
                          name="shipper_name"
                          aria-label="Shipper Name"
                          value={formData.shipper_name}
                          onFocus={() => setShowShipperDropdown(true)}
                          onValueChange={(value) => {
                            handleFieldChange("shipper_name", value)
                            setShowShipperDropdown(true)
                            setShipperSearchQuery(value)
                          }}
                          placeholder="Type or search shipper..."
                          className="pl-10 rounded-xl h-11 text-sm sm:text-base font-black text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
                        />
                      </div>

                      {/* Floating Autocomplete Suggestions */}
                      {showShipperDropdown && matchingShippers.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-blue-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur-xl no-scrollbar">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 mb-1 px-1">
                            <span className="text-[10.5px] font-black text-blue-950 dark:text-blue-300">
                              Matches ({matchingShippers.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowShipperDropdown(false)}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>
                          <div className="space-y-1">
                            {matchingShippers.slice(0, 8).map((shipper, sIdx) => (
                              <button
                                key={`${shipper.id || shipper.name}-${sIdx}`}
                                type="button"
                                onClick={() => {
                                  applySavedShipper(shipper.id)
                                  setShowShipperDropdown(false)
                                }}
                                className="w-full flex flex-col items-start p-1.5 rounded-xl text-left bg-slate-50/70 hover:bg-blue-50 border border-slate-100 hover:border-blue-300 dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:border-slate-700 transition-all cursor-pointer group"
                              >
                                <span className="text-xs font-black text-slate-900 group-hover:text-blue-950 dark:text-slate-100 dark:group-hover:text-blue-300 truncate w-full">
                                  {shipper.name}
                                </span>
                                {shipper.address && (
                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate w-full mt-0.5">
                                    {shipper.address}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Shipper Address */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          Shipper Address
                        </label>
                        <span className="font-[vazirmatn] text-blue-900 dark:text-blue-400 font-bold text-[10.5px]">آدرس فرستنده</span>
                      </div>
                      <Textarea
                        name="shipper_address"
                        value={formData.shipper_address}
                        onChange={handleInputChange}
                        placeholder="Enter shipper complete address..."
                        rows={3}
                        className="rounded-xl p-3 text-xs sm:text-sm font-semibold leading-relaxed text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs min-h-[84px] transition-all"
                      />
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {["Kabul, AF", "Dubai, UAE", "Bandar Abbas, IR", "Mumbai, IN"].map((city, cIdx) => (
                          <button
                            key={`shipper-city-${city}-${cIdx}`}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                shipper_address: prev.shipper_address ? `${prev.shipper_address.trim()}, ${city}` : city,
                              }))
                            }}
                            className="text-[11px] font-bold bg-slate-100 hover:bg-blue-100 hover:text-blue-800 text-slate-700 dark:bg-slate-800 dark:hover:bg-blue-900/50 dark:hover:text-blue-300 dark:text-slate-300 rounded-lg px-2 py-0.5 transition cursor-pointer shadow-2xs"
                          >
                            + {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Phone</span>
                          <span className="font-[vazirmatn] text-blue-900 dark:text-blue-400 font-bold text-xs">تلفن</span>
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="w-4 h-4 absolute left-3 text-blue-600 dark:text-blue-400 pointer-events-none" />
                          <Input
                            name="shipper_contact"
                            value={formData.shipper_contact || ""}
                            onChange={handleInputChange}
                            placeholder="+93 700 123 456"
                            type="tel"
                            className="pl-9 rounded-xl h-10 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Email</span>
                          <span className="font-[vazirmatn] text-blue-900 dark:text-blue-400 font-bold text-xs">ایمیل</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 absolute left-3 text-blue-600 dark:text-blue-400 pointer-events-none" />
                          <Input
                            name="shipper_email"
                            value={formData.shipper_email || ""}
                            onChange={handleInputChange}
                            placeholder="info@company.com"
                            type="email"
                            className="pl-9 rounded-xl h-10 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* 03 Consignee Card */}
              <Card id="section-consignee" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-emerald-200/90 dark:border-emerald-900/50 shadow-md shadow-emerald-500/5 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2 pt-3 px-3 sm:px-3.5 xl:px-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-emerald-50/80 via-teal-50/40 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-1 sm:gap-1.5 flex-nowrap min-w-0 w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-600 text-white text-[10.5px] font-black shadow-xs shrink-0">
                          03
                        </span>
                        <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 shrink">
                          <span className="font-extrabold text-slate-950 dark:text-slate-100 text-xs sm:text-[13px] tracking-tight select-none truncate block">Consignee<span className="hidden xl:inline"> / Importer</span></span>
                          <span className="text-[9.5px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block font-[vazirmatn] truncate">گیرنده<span className="hidden xl:inline"> / واردکننده</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-nowrap ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSwapShipperConsignee}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 gap-1"
                          title="Swap Consignee with Shipper"
                        >
                          <ArrowLeftRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Swap</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyConsigneeToNotify}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 gap-1"
                          title="Copy Consignee to Notify Party"
                        >
                          <Copy className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Notify</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSetConsigneeToOrder}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-[10px] sm:text-[11px] font-black cursor-pointer shrink-0 gap-1"
                          title="Set Consignee to 'TO ORDER OF SHIPPER' (Negotiable BOL)"
                        >
                          <span className="shrink-0 text-[11px] leading-none">📜</span>
                          <span className="hidden sm:inline lg:hidden xl:inline">Order</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearConsigneeFields}
                          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center p-0 shrink-0"
                          title="Clear all Consignee fields"
                        >
                          ✕
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3.5 p-4 sm:p-5">
                    {/* Saved Consignees Directory Bar */}
                    <div className="rounded-2xl border border-emerald-200/80 dark:border-slate-800 bg-linear-to-br from-emerald-50/80 to-teal-50/40 dark:from-slate-900/90 dark:to-slate-850/90 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                      {/* Header with Title, Live Badge & Browse All Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">Directory</span>
                          <span className="rounded-full bg-emerald-200/90 dark:bg-emerald-900/70 px-2 py-0.5 text-[10px] font-black text-emerald-950 dark:text-emerald-200 shadow-2xs">
                            {consigneeDirectorySearch
                              ? `${filteredSavedConsignees.length} / ${savedConsignees.length}`
                              : `${savedConsignees.length} Verified`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBrowseConsigneeModalOpen(true)}
                            className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer transition-colors"
                            title="Browse full searchable directory table with addresses and contacts"
                          >
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Browse All ({savedConsignees.length})</span>
                          </button>
                          <span className="font-[vazirmatn] text-emerald-900 dark:text-emerald-400 font-bold text-[10.5px]" dir="rtl">
                            گیرنده‌های ذخیره شده
                          </span>
                        </div>
                      </div>

                      {/* Quick Directory Filter Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-emerald-600/70 dark:text-emerald-400/70 pointer-events-none" />
                        <Input
                          value={consigneeDirectorySearch}
                          onChange={(e) => setConsigneeDirectorySearch(e.target.value)}
                          placeholder={`Filter all ${savedConsignees.length} consignees (search name, city, address)...`}
                          className="h-8.5 pl-8 pr-7 text-xs font-bold bg-white/95 dark:bg-slate-950 border-emerald-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium text-slate-900 dark:text-slate-100"
                        />
                        {consigneeDirectorySearch && (
                          <button
                            type="button"
                            onClick={() => setConsigneeDirectorySearch("")}
                            className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Select Dropdown */}
                      <Select
                        value={isConsigneeSelected ? selectedConsigneeId : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            setSelectedConsigneeId("")
                            return
                          }
                          applySavedConsignee(value)
                        }}
                      >
                        <SelectTrigger className="h-9.5 w-full text-xs font-bold text-slate-900 dark:text-slate-100 border-white dark:border-slate-700 bg-white/95 dark:bg-slate-950 backdrop-blur-md rounded-xl shadow-2xs">
                          <SelectValue placeholder={consigneeDirectorySearch ? `Select from ${filteredSavedConsignees.length} matching...` : `Select from directory (${savedConsignees.length} available)...`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 dark:bg-slate-900 dark:border-slate-800">
                          <SelectItem value="none">
                            {consigneeDirectorySearch
                              ? `-- Matching ${filteredSavedConsignees.length} of ${savedConsignees.length} consignees --`
                              : `-- Select from all ${savedConsignees.length} saved consignees --`}
                          </SelectItem>
                          {filteredSavedConsignees.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                              No consignees match "{consigneeDirectorySearch}"
                            </div>
                          ) : (
                            filteredSavedConsignees.map((consignee, index) => (
                              <SelectItem key={`${consignee.id}-${index}`} value={consignee.id} className="text-xs py-2">
                                <div className="flex flex-col gap-0.5 text-left max-w-[340px]">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{consignee.name}</span>
                                  {(consignee.address || consignee.contact || consignee.email) && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                      {[consignee.address, consignee.contact, consignee.email].filter(Boolean).join(" • ")}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <div>
                          {isConsigneeSelected ? (
                            <button
                              type="button"
                              onClick={() => setSelectedConsigneeId("")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer shadow-2xs"
                              title="Clear directory selection without deleting record"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Linked</span>
                              <span className="text-slate-400 hover:text-red-600 ml-0.5">✕</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {formData.consignee_name ? (isConsigneeExisting ? "Matches directory" : "Unsaved company") : "Select or type below"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveCurrentConsignee}
                            className={`h-7.5 px-3 text-xs font-black rounded-lg shadow-xs cursor-pointer transition-all ${
                              isConsigneeExisting
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                            }`}
                            title={isConsigneeExisting ? "Update existing consignee in directory" : "Save as new consignee in directory"}
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {isConsigneeExisting ? "Update" : "Save New"}
                          </Button>
                          {isConsigneeSelected && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={deleteSavedConsignee}
                              className="h-7.5 w-7.5 p-0 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg shadow-xs cursor-pointer flex items-center justify-center"
                              title="Delete selected saved consignee"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Consignee Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-0.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                        Presets:
                      </span>
                      <button
                        type="button"
                        onClick={handleSetConsigneeToOrder}
                        className="h-7 px-2.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-100 dark:bg-purple-950/70 text-xs font-black text-purple-950 dark:text-purple-200 hover:bg-purple-600 hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        📜 TO ORDER OF SHIPPER
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "YAAQOUB HAMDAN GENERAL TRADING LLC",
                            consignee_address: "Al Ras, Deira, P.O.Box 88201, Dubai, United Arab Emirates",
                            consignee_contact: "+971 4 226 8890",
                            consignee_email: "info@yaaqoubtrading.ae",
                          }))
                          toast.success("Loaded Yaaqoub Hamdan (Dubai) Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇦🇪 Dubai</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "M/S SKY OVERSEAS IMPEX PVT LTD",
                            consignee_address: "Plot No. 45/A, Sector 19, Vashi, Navi Mumbai, Nhava Sheva Port, Maharashtra 400705, India",
                            consignee_contact: "+91 22 2789 4455",
                            consignee_email: "imports@skyoverseas.in",
                          }))
                          toast.success("Loaded Nhava Sheva (India) Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇮🇳 Nhava Sheva</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "MERSIN GLOBAL TRANS LOJISTIK VE TICARET A.S.",
                            consignee_address: "Akdeniz Mah., Ismet Inonu Bulvari, No: 42, Mersin Port Free Zone, 33060 Mersin, Turkey",
                            consignee_contact: "+90 324 238 9012",
                            consignee_email: "info@mersinlojistik.com.tr",
                          }))
                          toast.success("Loaded Mersin (Turkey) Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇹🇷 Mersin</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "GULF STAR FREIGHT & LOGISTICS FZE",
                            consignee_address: "Hamriyah Free Zone, Phase 1, Warehouse P1-08, Sharjah, United Arab Emirates",
                            consignee_contact: "+971 6 526 1122",
                            consignee_email: "operations@gulfstarfze.ae",
                          }))
                          toast.success("Loaded Hamriyah (Sharjah) Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇦🇪 Hamriyah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "AL MADINA LOGISTICS SERVICES CO SAOC",
                            consignee_address: "Sohar Port & Freezone, Plot 44-B, P.O. Box 112, Sohar 322, Sultanate of Oman",
                            consignee_contact: "+968 2685 0200",
                            consignee_email: "sohar@almadinalogistics.om",
                          }))
                          toast.success("Loaded Sohar (Oman) Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇴🇲 Sohar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            consignee_name: "SOCIETE COMMERCIALE IVOIRIENNE SARL",
                            consignee_address: "Zone Industrielle de Yopougon, 21 BP 455, Abidjan 21, Côte d'Ivoire",
                            consignee_contact: "+225 27 23 45 67 89",
                            consignee_email: "contact@sci-abidjan.ci",
                          }))
                          toast.success("Loaded Abidjan Consignee preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-emerald-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <span>🇨🇮 Ivory Coast</span>
                      </button>
                    </div>

                    {/* Consignee Name with Live Floating Autocomplete */}
                    <div className="relative">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Consignee Name</span>
                          {isConsigneeExisting && (
                            <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 text-[8.5px] font-black">Directory</span>
                          )}
                        </span>
                        <span className="font-[vazirmatn] text-emerald-900 dark:text-emerald-400 font-bold text-[10.5px]">نام گیرنده</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-emerald-600 dark:text-emerald-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </div>
                        <Input
                          name="consignee_name"
                          value={formData.consignee_name}
                          onFocus={() => setShowConsigneeDropdown(true)}
                          onChange={(e) => {
                            handleInputChange(e)
                            setShowConsigneeDropdown(true)
                            setConsigneeSearchQuery(e.target.value)
                          }}
                          placeholder="Type or search consignee..."
                          className="pl-10 rounded-xl h-11 text-sm sm:text-base font-black text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                          dir="auto"
                        />
                      </div>

                      {/* Floating Autocomplete Suggestions */}
                      {showConsigneeDropdown && matchingConsignees.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-emerald-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur-xl no-scrollbar">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 mb-1 px-1">
                            <span className="text-[10.5px] font-black text-emerald-950 dark:text-emerald-300">
                              Matches ({matchingConsignees.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowConsigneeDropdown(false)}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>
                          <div className="space-y-1">
                            {matchingConsignees.slice(0, 8).map((consignee, cIdx) => (
                              <button
                                key={`${consignee.id || consignee.name}-${cIdx}`}
                                type="button"
                                onClick={() => {
                                  applySavedConsignee(consignee.id)
                                  setShowConsigneeDropdown(false)
                                }}
                                className="w-full flex flex-col items-start p-1.5 rounded-xl text-left bg-slate-50/70 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-300 dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:border-slate-700 transition-all cursor-pointer group"
                              >
                                <span className="text-xs font-black text-slate-900 group-hover:text-emerald-950 dark:text-slate-100 dark:group-hover:text-emerald-300 truncate w-full">
                                  {consignee.name}
                                </span>
                                {consignee.address && (
                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate w-full mt-0.5">
                                    {consignee.address}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Consignee Address */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          Consignee Address
                        </label>
                        <span className="font-[vazirmatn] text-emerald-900 dark:text-emerald-400 font-bold text-[10.5px]">آدرس گیرنده</span>
                      </div>
                      <Textarea
                        name="consignee_address"
                        value={formData.consignee_address}
                        onChange={handleInputChange}
                        placeholder="Enter consignee complete destination address..."
                        rows={3}
                        className="rounded-xl p-3 text-xs sm:text-sm font-semibold leading-relaxed text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs min-h-[84px] transition-all"
                      />
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {["Nhava Sheva, India", "Mersin, Turkey", "Hamriyah, Sharjah UAE", "Sohar, Oman", "Dubai, UAE", "Abidjan, Ivory Coast", "Rotterdam, Netherlands"].map((city, cIdx) => (
                          <button
                            key={`consignee-city-${city}-${cIdx}`}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                consignee_address: prev.consignee_address ? `${prev.consignee_address.trim()}, ${city}` : city,
                              }))
                            }}
                            className="text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 dark:bg-slate-800 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300 dark:text-slate-300 rounded-lg px-2 py-0.5 transition cursor-pointer shadow-2xs"
                          >
                            + {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Phone</span>
                          <span className="font-[vazirmatn] text-emerald-900 dark:text-emerald-400 font-bold text-xs">تلفن</span>
                        </label>
                        <div className="relative flex items-center">
                          <Phone className="w-4 h-4 absolute left-3 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                          <Input
                            name="consignee_contact"
                            value={formData.consignee_contact || ""}
                            onChange={handleInputChange}
                            placeholder="+971 4 123 4567"
                            type="tel"
                            className="pl-9 rounded-xl h-10 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                          <span>Email</span>
                          <span className="font-[vazirmatn] text-emerald-900 dark:text-emerald-400 font-bold text-xs">ایمیل</span>
                        </label>
                        <div className="relative flex items-center">
                          <Mail className="w-4 h-4 absolute left-3 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                          <Input
                            name="consignee_email"
                            value={formData.consignee_email || ""}
                            onChange={handleInputChange}
                            placeholder="import@buyer.com"
                            type="email"
                            className="pl-9 rounded-xl h-10 text-xs sm:text-[13px] font-bold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>

              {/* 04 Notify Party Card */}
              <Card id="section-notify" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-amber-200/90 dark:border-amber-900/50 shadow-md shadow-amber-500/5 dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2 pt-3 px-3 sm:px-3.5 xl:px-4 border-b border-slate-100 dark:border-slate-800 bg-linear-to-r from-amber-50/80 via-orange-50/40 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                    <CardTitle className="text-sm sm:text-base flex items-center justify-between gap-1 sm:gap-1.5 flex-nowrap min-w-0 w-full">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-600 text-white text-[10.5px] font-black shadow-xs shrink-0">
                          04
                        </span>
                        <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs shrink-0">
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 shrink">
                          <span className="font-extrabold text-slate-950 dark:text-slate-100 text-xs sm:text-[13px] tracking-tight select-none truncate block">Notify Party</span>
                          <span className="text-[9.5px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-bold block font-[vazirmatn] truncate">طرف اطلاع<span className="hidden xl:inline"> / نماینده دوم</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-nowrap ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleSetNotifySameAsConsignee}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-100/80 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-300 text-[10px] sm:text-[11px] font-black cursor-pointer shrink-0 gap-1"
                          title="Set Notify Party to 'SAME AS CONSIGNEE'"
                        >
                          <span className="shrink-0 text-[11px] leading-none">📋</span>
                          <span className="hidden sm:inline lg:hidden xl:inline">Same</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyConsigneeToNotify}
                          className="h-7 px-1.5 sm:px-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 gap-1"
                          title="Copy full Consignee details into Notify Party"
                        >
                          <Copy className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Consignee</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearNotifyPartyFields}
                          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer flex items-center justify-center p-0 shrink-0"
                          title="Clear all Notify Party fields"
                        >
                          ✕
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3.5 p-4 sm:p-5">
                    {/* Saved Notify Parties Directory Bar */}
                    <div className="rounded-2xl border border-amber-200/80 dark:border-slate-800 bg-linear-to-br from-amber-50/80 to-orange-50/40 dark:from-slate-900/90 dark:to-slate-850/90 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                      {/* Header with Title, Live Badge & Browse All Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">Directory</span>
                          <span className="rounded-full bg-amber-200/90 dark:bg-amber-900/70 px-2 py-0.5 text-[10px] font-black text-amber-950 dark:text-amber-200 shadow-2xs">
                            {notifyDirectorySearch
                              ? `${filteredSavedNotifyParties.length} / ${savedNotifyParties.length}`
                              : `${savedNotifyParties.length} Verified`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBrowseNotifyModalOpen(true)}
                            className="text-[11px] font-black text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-300 underline flex items-center gap-1 cursor-pointer transition-colors"
                            title="Browse full searchable directory table with addresses and contacts"
                          >
                            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Browse All ({savedNotifyParties.length})</span>
                          </button>
                          <span className="font-[vazirmatn] text-amber-900 dark:text-amber-400 font-bold text-[10.5px]" dir="rtl">
                            طرف‌های اطلاع ذخیره شده
                          </span>
                        </div>
                      </div>

                      {/* Quick Directory Filter Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-amber-600/70 dark:text-amber-400/70 pointer-events-none" />
                        <Input
                          value={notifyDirectorySearch}
                          onChange={(e) => setNotifyDirectorySearch(e.target.value)}
                          placeholder={`Filter all ${savedNotifyParties.length} notify parties (search name, city, address)...`}
                          className="h-8.5 pl-8 pr-7 text-xs font-bold bg-white/95 dark:bg-slate-950 border-amber-200 dark:border-slate-700 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-xl shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium text-slate-900 dark:text-slate-100"
                        />
                        {notifyDirectorySearch && (
                          <button
                            type="button"
                            onClick={() => setNotifyDirectorySearch("")}
                            className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Select Dropdown */}
                      <Select
                        value={isNotifyPartySelected ? selectedNotifyPartyId : "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            setSelectedNotifyPartyId("")
                            return
                          }
                          applySavedNotifyParty(value)
                        }}
                      >
                        <SelectTrigger className="h-9.5 w-full text-xs font-bold text-slate-900 dark:text-slate-100 border-white dark:border-slate-700 bg-white/95 dark:bg-slate-950 backdrop-blur-md rounded-xl shadow-2xs">
                          <SelectValue placeholder={notifyDirectorySearch ? `Select from ${filteredSavedNotifyParties.length} matching...` : `Select from directory (${savedNotifyParties.length} available)...`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 dark:bg-slate-900 dark:border-slate-800">
                          <SelectItem value="none">
                            {notifyDirectorySearch
                              ? `-- Matching ${filteredSavedNotifyParties.length} of ${savedNotifyParties.length} notify parties --`
                              : `-- Select from all ${savedNotifyParties.length} saved notify parties --`}
                          </SelectItem>
                          {filteredSavedNotifyParties.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-400">
                              No notify parties match "{notifyDirectorySearch}"
                            </div>
                          ) : (
                            filteredSavedNotifyParties.map((notifyParty, index) => (
                              <SelectItem key={`${notifyParty.id}-${index}`} value={notifyParty.id} className="text-xs py-2">
                                <div className="flex flex-col gap-0.5 text-left max-w-[340px]">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">{notifyParty.name}</span>
                                  {notifyParty.address && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                      {notifyParty.address}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                      {/* Bottom Action Footer */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <div>
                          {isNotifyPartySelected ? (
                            <button
                              type="button"
                              onClick={() => setSelectedNotifyPartyId("")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer shadow-2xs"
                              title="Clear directory selection without deleting record"
                            >
                              <Check className="w-3.5 h-3.5 text-amber-600" />
                              <span>Linked</span>
                              <span className="text-slate-400 hover:text-red-600 ml-0.5">✕</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {formData.notify_party ? (isNotifyPartyExisting ? "Matches directory" : "Unsaved company") : "Select or type below"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveCurrentNotifyParty}
                            className={`h-7.5 px-3 text-xs font-black rounded-lg shadow-xs cursor-pointer transition-all ${
                              isNotifyPartyExisting
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
                                : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20"
                            }`}
                            title={isNotifyPartyExisting ? "Update existing notify party in directory" : "Save as new notify party in directory"}
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            {isNotifyPartyExisting ? "Update" : "Save New"}
                          </Button>
                          {isNotifyPartySelected && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={deleteSavedNotifyParty}
                              className="h-7.5 w-7.5 p-0 border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg shadow-xs cursor-pointer flex items-center justify-center"
                              title="Delete selected saved notify party from directory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Notify Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-0.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                        Presets:
                      </span>
                      <button
                        type="button"
                        onClick={handleSetNotifySameAsConsignee}
                        className="h-7 px-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-950/70 text-xs font-black text-amber-950 dark:text-amber-200 hover:bg-amber-600 hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        📋 SAME AS CONSIGNEE
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            notify_party: "YAAQOUB HAMDAN GENERAL TRADING LLC",
                            notify_party_address: "Al Ras, Deira, P.O.Box 88201, Dubai, United Arab Emirates",
                          }))
                          toast.success("Loaded Yaaqoub Hamdan (Dubai) Notify preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white dark:hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        🇦🇪 Dubai
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            notify_party: "ABIDJAN PORT TRANSIT & CLEARANCE SARL",
                            notify_party_address: "Port Autonome d'Abidjan, Boulevard de Vridi, BP 982, Abidjan, Côte d'Ivoire",
                          }))
                          toast.success("Loaded Abidjan Clearance Agent Notify preset")
                        }}
                        className="h-7 px-2.5 rounded-lg border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-amber-600 dark:hover:bg-amber-600 hover:text-white dark:hover:text-white transition shadow-2xs cursor-pointer"
                      >
                        🇨🇮 Abidjan
                      </button>
                    </div>

                    {/* Notify Party Name with Live Floating Autocomplete */}
                    <div className="relative">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>Notify Party Name</span>
                          {isNotifyPartyExisting && (
                            <span className="rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1 py-0.2 text-[8.5px] font-black">Directory</span>
                          )}
                        </span>
                        <span className="font-[vazirmatn] text-amber-900 dark:text-amber-400 font-bold text-[10.5px]">نام طرف اطلاع</span>
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 text-amber-600 dark:text-amber-400 pointer-events-none">
                          <Bell className="w-4 h-4" />
                        </div>
                        <Input
                          name="notify_party"
                          value={formData.notify_party}
                          onFocus={() => setShowNotifyPartyDropdown(true)}
                          onChange={(e) => {
                            handleInputChange(e)
                            setShowNotifyPartyDropdown(true)
                            setNotifyPartySearchQuery(e.target.value)
                          }}
                          placeholder="Type or search notify party..."
                          className="pl-10 rounded-xl h-11 text-sm sm:text-base font-black text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all"
                          dir="auto"
                        />
                      </div>

                      {/* Floating Autocomplete Suggestions */}
                      {showNotifyPartyDropdown && matchingNotifyParties.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-amber-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl shadow-slate-900/20 backdrop-blur-xl no-scrollbar">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 mb-1 px-1">
                            <span className="text-[10.5px] font-black text-amber-950 dark:text-amber-300">
                              Matches ({matchingNotifyParties.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowNotifyPartyDropdown(false)}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                            >
                              ✕ Close
                            </button>
                          </div>
                          <div className="space-y-1">
                            {matchingNotifyParties.slice(0, 8).map((notify, nIdx) => (
                              <button
                                key={`${notify.id || notify.name}-${nIdx}`}
                                type="button"
                                onClick={() => {
                                  applySavedNotifyParty(notify.id)
                                  setShowNotifyPartyDropdown(false)
                                }}
                                className="w-full flex flex-col items-start p-1.5 rounded-xl text-left bg-slate-50/70 hover:bg-amber-50 border border-slate-100 hover:border-amber-300 dark:bg-slate-800/70 dark:hover:bg-slate-700 dark:border-slate-700 transition-all cursor-pointer group"
                              >
                                <span className="text-xs font-black text-slate-900 group-hover:text-amber-950 dark:text-slate-100 dark:group-hover:text-amber-300 truncate w-full">
                                  {notify.name}
                                </span>
                                {notify.address && (
                                  <p className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate w-full mt-0.5">
                                    {notify.address}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notify Party Address / Contact */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                          Address & Arrival Contact
                        </label>
                        <span className="font-[vazirmatn] text-amber-900 dark:text-amber-400 font-bold text-[10.5px]">آدرس و تلفن طرف اطلاع</span>
                      </div>
                      <Textarea
                        name="notify_party_address"
                        value={formData.notify_party_address}
                        onChange={handleInputChange}
                        placeholder="Enter notify party complete address, phone..."
                        rows={3}
                        className="rounded-xl p-3 text-xs sm:text-sm font-semibold leading-relaxed text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs min-h-[84px] transition-all"
                      />
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {["Deira, Dubai, UAE", "Abidjan, Ivory Coast", "Bandar Abbas, Iran", "Kabul, AF"].map((city, cIdx) => (
                          <button
                            key={`notify-city-${city}-${cIdx}`}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                notify_party_address: prev.notify_party_address ? `${prev.notify_party_address.trim()}, ${city}` : city,
                              }))
                            }}
                            className="text-[11px] font-bold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 dark:bg-slate-800 dark:hover:bg-amber-900/50 dark:hover:text-amber-300 dark:text-slate-300 rounded-lg px-2 py-0.5 transition cursor-pointer shadow-2xs"
                          >
                            + {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Arrival Notice Dispatch Info Banner (Balances height with Phone/Email columns) */}
                    <div className="mt-1 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-linear-to-r from-amber-50/70 via-orange-50/40 to-amber-50/50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900/50 p-2.5 shadow-2xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10.5px] font-bold text-amber-950 dark:text-amber-200 truncate leading-tight">
                            Arrival Notice & Discharge Port Broker
                          </p>
                          <p className="text-[9.5px] text-amber-700/80 dark:text-amber-400/80 truncate leading-tight font-medium">
                            Cargo release notifications & destination clearing
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSetNotifySameAsConsignee}
                        className="h-6 px-2 text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-md shrink-0 cursor-pointer"
                        title="Copy Consignee to Notify Party"
                      >
                        Sync Consignee
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>

                        {/* Side-by-Side Route & Cargo Dashboard */}
            <div className="route-cargo-dashboard w-full">
              {/* First Column — Live Shipment Intelligence & Rates Studio (Promoted Above Route Stops) */}
              <div className="intelligence-section w-full min-w-0">
                <span id="section-cargo-anchor" className="sr-only" />
                <Card id="section-shipment-intelligence" className="overflow-hidden rounded-[28px] sm:rounded-[32px] w-full border border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-[0_20px_55px_-24px_rgba(88,28,135,0.28)] dark:shadow-[0_20px_55px_-24px_rgba(0,0,0,0.6)] backdrop-blur-2xl [content-visibility:auto] [contain-intrinsic-size:1px_600px]">
                  <CardHeader className="border-b border-purple-100 dark:border-slate-800 bg-linear-to-r from-purple-50/90 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 px-4 py-4 sm:px-5">
                    <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-purple-600 text-white text-[11px] font-black shadow-xs shrink-0">
                          05
                        </span>
                        <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-purple-600 text-white text-xs font-black shadow-xs shrink-0">
                          <Zap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-950 dark:text-slate-100 text-base tracking-tight select-none">Live Shipment Intelligence</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              (liveCargoCalc.totalPackages > 0 && liveCargoCalc.items.some((item) => item.netPerCarton > 0 || item.grossPerCarton > 0))
                                ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                : "border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${(liveCargoCalc.totalPackages > 0 && liveCargoCalc.items.some((item) => item.netPerCarton > 0 || item.grossPerCarton > 0)) ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                              {(liveCargoCalc.totalPackages > 0 && liveCargoCalc.items.some((item) => item.netPerCarton > 0 || item.grossPerCarton > 0)) ? "⚡ Auto-Calculation Synced" : "Enter Packages + Carton Weight"}
                            </span>
                          </div>
                          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Real-time carton multiplication, payload tare analysis, and freight valuation</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAutoCalculateWeights}
                          className="h-9 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-3.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-indigo-700 active:scale-95 cursor-pointer"
                          title="Calculate Net Weight, Gross Weight and Goods Value"
                        >
                          <Calculator className="h-3.5 w-3.5 mr-1" />
                          Recalculate
                        </Button>
                        <span className="rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 text-xs font-extrabold text-purple-900 dark:text-purple-300 font-[vazirmatn]" dir="rtl">
                          محاسبه هوشمند محموله
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-5 pt-4 sm:px-5">

                {/* Live Weights & Calculation Metrics KPI Cards */}
                {(() => {
                  const isMulti = liveCargoCalc.isMultiItem && liveCargoCalc.items.length > 1
                  const hasPackageInput = liveCargoCalc.totalPackages > 0
                  const hasWeightInput = liveCargoCalc.items.some((item) => item.netPerCarton > 0 || item.grossPerCarton > 0)
                  const calculationReady = hasPackageInput && hasWeightInput

                  const netVal = parseNumericValue(formData.net_weight || "") || (liveCargoCalc.totalNetWeight > 0 ? liveCargoCalc.totalNetWeight : 0)
                  const grossVal = parseNumericValue(formData.gross_weight || "") || (liveCargoCalc.totalGrossWeight > 0 ? liveCargoCalc.totalGrossWeight : 0)
                  const tareVal = grossVal > netVal ? grossVal - netVal : 0
                  const netCartonVal = parseFloat(formData.kgs_per_carton || "0") || 0
                  const grossCartonVal = parseFloat(formData.gross_weight_per_carton || "0") || 0
                  const tareCartonDiff = grossCartonVal > netCartonVal ? (grossCartonVal - netCartonVal).toFixed(2) : null
                  const isContainerIsoValid = /^[A-Z]{4}\d{7}$/.test((formData.container_numbers || "").trim().replace(/[-\s]/g, ""))

                  return (
                    <div className="space-y-3">
                      {/* Live Totals Header Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-linear-to-r from-slate-50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-purple-950/30 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                            <Zap className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">Live Shipment Intelligence</p>
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                calculationReady
                                  ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                  : "border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${calculationReady ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                {calculationReady ? "⚡ Auto-Calculation Synced" : "Enter Packages + Carton Weight"}
                              </span>
                            </div>
                            <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">Real-time carton multiplication, payload tare analysis, and freight valuation</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAutoCalculateWeights}
                            className="h-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3 text-xs font-black shadow-2xs cursor-pointer transition-all"
                            title="Recalculate weights & goods value from cartons"
                          >
                            <Calculator className="h-3.5 w-3.5 mr-1" />
                            Recalculate
                          </Button>
                        </div>
                      </div>

                      {/* 4 Primary KPI Cards */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-live="polite">
                        {/* 01 Total Packages */}
                        <div className="relative overflow-hidden rounded-2xl border border-purple-200/90 dark:border-purple-900/60 bg-linear-to-br from-purple-50/80 via-white to-purple-50/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/20 p-4 shadow-2xs transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10.5px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Total Packages
                            </span>
                            <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/70 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                              تعداد کل بسته‌ها
                            </span>
                          </div>
                          <p className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100 truncate tracking-tight">
                            {isMulti && liveCargoCalc.totalPackages > 0
                              ? `${liveCargoCalc.totalPackages.toLocaleString("en-US")} CTNS`
                              : formData.number_of_packages || "0 CTNS"}
                          </p>
                          <div className="mt-2 pt-2 border-t border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-[10px]">
                            <span className="text-purple-700 dark:text-purple-400 font-semibold truncate">
                              {isMulti
                                ? liveCargoCalc.items.map((it, idx) => `#${idx + 1}: ${it.packages}`).join(" | ")
                                : "Cartons / Units"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {["500", "1,000", "1,200"].map((qty, qIdx) => (
                                <button
                                  key={`cargo-qty-${qty}-${qIdx}`}
                                  type="button"
                                  onClick={() => handleCargoFieldChange("number_of_packages", `${qty} CTNS`)}
                                  className="text-[9px] font-extrabold text-purple-800 dark:text-purple-300 bg-white dark:bg-slate-900 hover:bg-purple-200 dark:hover:bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                                >
                                  {qty}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 02 Total Net Weight */}
                        <div className="relative overflow-hidden rounded-2xl border border-blue-200/90 dark:border-blue-900/60 bg-linear-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 p-4 shadow-2xs transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10.5px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                              <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              Total Net Weight
                            </span>
                            <span className="text-[9.5px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                              وزن خالص کل
                            </span>
                          </div>
                          <p className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100 truncate tracking-tight">
                            {isMulti && liveCargoCalc.totalNetWeight > 0
                              ? `${formatWeightValue(liveCargoCalc.totalNetWeight)} KG`
                              : formData.net_weight || "0 KG"}
                          </p>
                          <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/50 flex items-center justify-between text-[10px]">
                            <span className="text-blue-700 dark:text-blue-400 font-semibold truncate">
                              {netVal > 0 ? `≈ ${(netVal / 1000).toFixed(2)} Metric Tons (MT)` : "Net Cargo Weight"}
                            </span>
                            {netCartonVal > 0 && (
                              <span className="text-[9.5px] font-black text-blue-800 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/70 px-1.5 py-0.5 rounded">
                                {netCartonVal} kg/ctn
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 03 Total Gross Weight */}
                        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 bg-linear-to-br from-indigo-50/80 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 p-4 shadow-2xs transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                              <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              Total Gross Weight
                            </span>
                            <span className="text-[9.5px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/90 dark:bg-indigo-950/70 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                              وزن ناخالص کل
                            </span>
                          </div>
                          <p className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-indigo-100 truncate tracking-tight">
                            {isMulti && liveCargoCalc.totalGrossWeight > 0
                              ? `${formatWeightValue(liveCargoCalc.totalGrossWeight)} KG`
                              : formData.gross_weight || "0 KG"}
                          </p>
                          <div className="mt-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-[10px]">
                            <span className="text-indigo-700 dark:text-indigo-400 font-semibold truncate">
                              {tareVal > 0 ? `Packaging Tare: +${formatWeightValue(tareVal)} KG` : "Gross with Packaging"}
                            </span>
                            {tareCartonDiff && (
                              <span className="text-[9.5px] font-black text-indigo-800 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/70 px-1.5 py-0.5 rounded">
                                +{tareCartonDiff} kg tare
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 04 Estimated Goods Value */}
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 dark:border-emerald-900/60 bg-linear-to-br from-emerald-50/80 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 p-4 shadow-2xs transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              Est. Goods Value
                            </span>
                            <span className="text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              ارزش کل کالا
                            </span>
                          </div>
                          <p className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100 truncate tracking-tight">
                            {isMulti && liveCargoCalc.totalGoodsValue > 0
                              ? formatUsdValue(liveCargoCalc.totalGoodsValue)
                              : formData.goods_value || "$0.00"}
                          </p>
                          <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-[10px]">
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                              {formData.rate_per_kgs ? `@ $${formData.rate_per_kgs.replace(/^\$/, "")} / KG Rate` : "Total Declared Value"}
                            </span>
                            {formData.rate_per_kgs && netVal > 0 && (
                              <span className="text-[9.5px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">
                                USD
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tare & Payload Diagnostic Strip */}
                      {(netVal > 0 || grossVal > 0) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 shadow-2xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              <Box className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              Payload Breakdown:
                            </span>
                            <span>
                              Cargo Net: <strong className="text-blue-900 dark:text-blue-400">{formatWeightValue(netVal)} KG</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Total Gross: <strong className="text-indigo-900 dark:text-indigo-400">{formatWeightValue(grossVal)} KG</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Tare (Packaging): <strong className="text-amber-800 dark:text-amber-400">{formatWeightValue(tareVal)} KG</strong>
                              {grossVal > 0 && tareVal > 0 && (
                                <span className="ml-1 text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                                  ({((tareVal / grossVal) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </span>
                          </div>

                          {formData.measurement && (
                            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                              Volume: {formData.measurement}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Multi-Item Cargo Breakdown Interactive Live Strip */}
                      {isMulti && (
                        <div className="rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-linear-to-r from-purple-50/90 via-indigo-50/60 to-purple-50/90 dark:from-purple-950/50 dark:via-indigo-950/30 dark:to-purple-950/50 p-3.5 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-600 text-white text-[10px] font-black">
                                2+
                              </span>
                              <span className="text-xs font-black text-purple-950 dark:text-purple-200">
                                Multi-Item Shipment Breakdown ({liveCargoCalc.items.length} Cargo Items)
                              </span>
                            </div>
                            <span className="text-[10.5px] font-black text-purple-700 dark:text-purple-300 bg-purple-200/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-800">
                              تفکیک اقلام چندگانه محموله
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {liveCargoCalc.items.map((it, idx) => (
                              <div key={`cargo-item-${idx}`} className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3 border border-purple-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                  <span className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1">
                                    <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    Item #{idx + 1}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {it.packages.toLocaleString("en-US")} CTNS
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="bg-blue-50/70 dark:bg-blue-950/50 p-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                    <span className="text-blue-600 dark:text-blue-400 block text-[9.5px] font-bold">Net Weight</span>
                                    <span className="font-black text-blue-950 dark:text-blue-300 text-xs">{formatWeightValue(it.netWeight)} KG</span>
                                    <span className="text-[9px] text-blue-500 dark:text-blue-400 block font-medium">({it.netPerCarton} kg/ctn)</span>
                                  </div>
                                  <div className="bg-indigo-50/70 dark:bg-indigo-950/50 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                                    <span className="text-indigo-600 dark:text-indigo-400 block text-[9.5px] font-bold">Gross Weight</span>
                                    <span className="font-black text-indigo-950 dark:text-indigo-300 text-xs">{formatWeightValue(it.grossWeight)} KG</span>
                                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 block font-medium">({it.grossPerCarton} kg/ctn)</span>
                                  </div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">Rate: ${it.rate}/kg</span>
                                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                                    ${it.goodsValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Side-by-Side: Section 1 (Shipment & Packaging Inputs) & Section 2 (Rates & Calculated Totals) */}
                <div className="cargo-inputs-rates-grid grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-5 items-stretch w-full min-w-0">
                  {/* Field Grid - Section 1: Shipment & Packaging Inputs */}
                  <div className="h-full space-y-4 rounded-2xl border border-purple-200/90 dark:border-purple-900/50 bg-linear-to-b from-purple-50/40 via-white to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-linear-to-br from-purple-600 to-indigo-700 text-white font-black text-xs shadow-xs">
                        1
                      </span>
                      <div>
                        <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-purple-950 dark:text-purple-100">
                          Shipment & Packaging Inputs
                        </span>
                        <span className="block text-[10.5px] font-medium text-purple-700/80 dark:text-purple-400">
                          Container identification, customs seal, package quantity and unit carton weights
                        </span>
                      </div>
                    </div>
                    <span className="font-[vazirmatn] text-xs sm:text-sm font-bold text-purple-800 dark:text-purple-300" dir="rtl">
                      مشخصات کانتینر، پلمپ و بسته‌بندی
                    </span>
                  </div>

                  {/* Row 1: Container No & Seal No (2 Balanced Columns) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 cargo-adaptive-subgrid">
                    {/* Container No */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-3.5 shadow-2xs transition-all hover:border-purple-200 dark:hover:border-purple-800/60">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                          <span>Container No.</span>
                          {/^[A-Z]{4}\d{7}$/.test((formData.container_numbers || "").trim().replace(/[-\s]/g, "")) && (
                            <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                              ✓ ISO VALID
                            </span>
                          )}
                        </label>
                        <span className="font-[vazirmatn] text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0" dir="rtl">
                          شماره کانتینر
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-purple-600 dark:text-purple-400 pointer-events-none">
                          <Box className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <Input
                          name="container_numbers"
                          value={formData.container_numbers}
                          onChange={(e) => handleCargoFieldChange("container_numbers", e.target.value.toUpperCase())}
                          placeholder="MSCU1234567"
                          className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold uppercase text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all tracking-wider"
                        />
                      </div>
                      {/* Popular Shipping Line Prefixes */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mr-0.5">Prefix:</span>
                        {["MSCU", "CMAU", "COSU", "MEDU", "MAEU", "TGHU"].map((pfx, pIdx) => (
                          <button
                            key={`pfx-${pfx}-${pIdx}`}
                            type="button"
                            onClick={() => applyContainerPrefix(pfx)}
                            className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-900/60 hover:text-purple-900 dark:hover:text-purple-200 rounded-lg px-2 py-0.5 transition cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs active:scale-95 whitespace-nowrap"
                          >
                            +{pfx}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seal No */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-3.5 shadow-2xs transition-all hover:border-purple-200 dark:hover:border-purple-800/60">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">Seal No.</label>
                        <span className="font-[vazirmatn] text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0" dir="rtl">
                          شماره پلمپ
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-purple-600 dark:text-purple-400 pointer-events-none">
                          <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <Input
                          name="seal_numbers"
                          value={formData.seal_numbers}
                          onChange={(e) => handleCargoFieldChange("seal_numbers", e.target.value.toUpperCase())}
                          placeholder="SL-987654"
                          className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold uppercase text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all tracking-wider"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={generateRandomSealNumber}
                          className="text-[9.5px] font-extrabold text-purple-800 dark:text-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 dark:hover:bg-purple-900/70 rounded-lg px-2.5 py-0.5 border border-purple-200 dark:border-purple-800/80 transition cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>🎲</span>
                          <span>Gen Seal #</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCargoFieldChange("seal_numbers", `AFG-CUSTOMS-${new Date().getFullYear()}`)}
                          className="text-[9.5px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg px-2.5 py-0.5 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                        >
                          Customs Seal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: No. of Packages (Generous Full-Width to Prevent Text Clipping) */}
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-3.5 shadow-2xs transition-all hover:border-purple-200 dark:hover:border-purple-800/60">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                        <Package className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>No. of Packages & Specification</span>
                        <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">(Quantity + Unit + Cargo Details)</span>
                      </label>
                      <span className="font-[vazirmatn] text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0" dir="rtl">
                        تعداد و مشخصات بسته
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-purple-600 dark:text-purple-400 pointer-events-none">
                        <Package className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <Input
                        name="number_of_packages"
                        value={formData.number_of_packages}
                        onChange={(e) => handleCargoFieldChange("number_of_packages", e.target.value)}
                        placeholder="e.g. 1,475 CTNS GOLDEN RAISINS (GRADE AAA)"
                        className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all"
                      />
                    </div>
                    {/* Package Unit Chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mr-0.5">Quick Unit:</span>
                      {["CTNS", "BAGS", "BOXES", "PALLETS", "ROLLS", "DRUMS"].map((unit, uIdx) => (
                        <button
                          key={`unit-${unit}-${uIdx}`}
                          type="button"
                          onClick={() => applyPackageUnit(unit)}
                          className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-900/60 hover:text-purple-900 dark:hover:text-purple-200 rounded-lg px-2.5 py-0.5 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Net Wt. / Carton & Gross Wt. / Carton (2 Balanced Columns - Tare Badge Never Wraps) */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Net Wt. / Carton */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-3.5 shadow-2xs transition-all hover:border-purple-200 dark:hover:border-purple-800/60">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200">Net Wt. / Carton</label>
                        <span className="font-[vazirmatn] text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0" dir="rtl">
                          کیلو فی کارتن (خالص)
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-purple-600 dark:text-purple-400 pointer-events-none">
                          <Scale className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <Input
                          name="kgs_per_carton"
                          value={formData.kgs_per_carton}
                          onChange={(e) => handleCargoFieldChange("kgs_per_carton", e.target.value)}
                          placeholder="10.0 or 12.5"
                          className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all font-mono"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mr-0.5">Presets:</span>
                        {["10.0", "12.5", "15.0", "20.0"].map((w, wIdx) => (
                          <button
                            key={`weight-${w}-${wIdx}`}
                            type="button"
                            onClick={() => handleCargoFieldChange("kgs_per_carton", w)}
                            className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-900/60 hover:text-purple-900 dark:hover:text-purple-200 rounded-lg px-2.5 py-0.5 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                          >
                            {w} kg
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gross Wt. / Carton */}
                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-3.5 shadow-2xs transition-all hover:border-purple-200 dark:hover:border-purple-800/60">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                            Gross Wt. / Carton
                          </label>
                          {parseFloat(formData.gross_weight_per_carton || "0") > parseFloat(formData.kgs_per_carton || "0") && (
                            <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                              +{(parseFloat(formData.gross_weight_per_carton || "0") - parseFloat(formData.kgs_per_carton || "0")).toFixed(2)} tare
                            </span>
                          )}
                        </div>
                        <span className="font-[vazirmatn] text-[11px] font-bold text-purple-800 dark:text-purple-300 shrink-0" dir="rtl">
                          وزن ناخالص کارتن
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-purple-600 dark:text-purple-400 pointer-events-none">
                          <Scale className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <Input
                          name="gross_weight_per_carton"
                          value={formData.gross_weight_per_carton}
                          onChange={(e) => handleCargoFieldChange("gross_weight_per_carton", e.target.value)}
                          placeholder="10.5 or 13.0"
                          className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold text-slate-950 dark:text-slate-100 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:bg-white dark:focus:bg-slate-950 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs transition-all font-mono"
                        />
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mr-0.5">Presets:</span>
                        {[
                          { n: "10.0", g: "10.5" },
                          { n: "12.5", g: "13.0" },
                          { n: "15.0", g: "15.5" },
                          { n: "20.0", g: "20.4" },
                        ].map((pair, pIdx) => (
                          <button
                            key={`pair-${pair.g}-${pIdx}`}
                            type="button"
                            onClick={() => applyCartonWeightPreset(pair.n, pair.g)}
                            className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-purple-900/60 hover:text-purple-900 dark:hover:text-purple-200 rounded-lg px-2.5 py-0.5 border border-slate-200/60 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                          >
                            {pair.g} kg
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Field Grid - Row 2: Rates, Weights & Valuation */}
                  <div className="h-full space-y-4 rounded-2xl border-2 border-emerald-300/80 dark:border-emerald-800/80 bg-linear-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 shadow-2xs transition-all flex flex-col justify-between">
                    {/* Section Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-xs font-black text-white shadow-xs">2</span>
                        <div>
                          <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-100">Rates & Calculated Totals</span>
                          <span className="block text-[10.5px] font-medium text-emerald-700/80 dark:text-emerald-400">Calculated values update live with instant manual override support</span>
                        </div>
                      </div>
                      <span className="font-[vazirmatn] text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300" dir="rtl">ارزش‌گذاری، نرخ و اوزان کل</span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Row A: Financial Valuation & Rates */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {/* Rate per KG */}
                        <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-white/90 dark:bg-slate-950/80 p-3.5 shadow-2xs hover:border-emerald-300 transition-all">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="text-xs font-black text-emerald-950 dark:text-slate-100">Rate per KG</label>
                            <span className="font-[vazirmatn] text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0" dir="rtl">نرخ فی کیلو</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none">
                              <Receipt className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <Input
                              name="rate_per_kgs"
                              value={formData.rate_per_kgs}
                              onChange={(e) => handleCargoFieldChange("rate_per_kgs", e.target.value)}
                              placeholder="1.20 or 4.50"
                              className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold text-emerald-950 dark:text-emerald-200 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all font-mono"
                            />
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 mr-0.5">Rate Presets:</span>
                            {["0.85", "1.20", "2.50", "3.80", "4.50"].map((r, rIdx) => (
                              <button
                                key={`rate-${r}-${rIdx}`}
                                type="button"
                                onClick={() => handleCargoFieldChange("rate_per_kgs", r)}
                                className="text-[9.5px] font-extrabold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-lg px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-800 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                              >
                                ${r}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Goods Value (USD) */}
                        <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-white/90 dark:bg-slate-950/80 p-3.5 shadow-2xs hover:border-emerald-300 transition-all">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="text-xs font-black text-emerald-950 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                              <span>Goods Value (USD)</span>
                              {formData.goods_value && (
                                <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">Auto</span>
                              )}
                            </label>
                            <span className="font-[vazirmatn] text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0" dir="rtl">ارزش کالا</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none">
                              <Building2 className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <Input
                              name="goods_value"
                              value={formData.goods_value}
                              onChange={(e) => handleCargoFieldChange("goods_value", e.target.value)}
                              placeholder="$10,000.00"
                              className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold font-mono text-emerald-950 dark:text-emerald-200 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition-all"
                            />
                          </div>
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-400 font-bold px-0.5">
                            <span className="font-semibold text-emerald-700/80 dark:text-emerald-400">Formula: Net Wt × Rate</span>
                            <button
                              type="button"
                              onClick={handleAutoCalculateWeights}
                              className="font-extrabold text-emerald-900 dark:text-emerald-200 bg-emerald-100/70 hover:bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 active:scale-95 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              ⚡ Recalculate
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Row B: Physical Weights & Container Volume */}
                      <div className="grid grid-cols-1 gap-3.5">
                        {/* Total Net Weight */}
                        <div className="rounded-xl border border-blue-200/90 dark:border-blue-900/60 bg-white/90 dark:bg-slate-950/80 p-3.5 shadow-2xs hover:border-blue-300 transition-all">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="text-xs font-black text-blue-950 dark:text-slate-100">Total Net Weight</label>
                            <span className="font-[vazirmatn] text-[11px] font-bold text-blue-700 dark:text-blue-400 shrink-0" dir="rtl">وزن خالص کل</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-blue-600 dark:text-blue-400 pointer-events-none">
                              <Scale className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <Input
                              name="net_weight"
                              value={formData.net_weight}
                              onChange={(e) => handleCargoFieldChange("net_weight", e.target.value)}
                              placeholder="4,800 KG"
                              className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold font-mono text-blue-950 dark:text-blue-200 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all"
                            />
                          </div>
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-blue-800 dark:text-blue-400 font-bold px-0.5">
                            <span className="font-semibold text-blue-700/80 dark:text-blue-400">Cartons × Net/Ctn</span>
                            <button
                              type="button"
                              onClick={handleAutoCalculateWeights}
                              className="font-extrabold text-blue-900 dark:text-blue-200 bg-blue-100/70 hover:bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 active:scale-95 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              ↺ Sync
                            </button>
                          </div>
                        </div>

                        {/* Total Gross Weight */}
                        <div className="rounded-xl border border-indigo-200/90 dark:border-indigo-900/60 bg-white/90 dark:bg-slate-950/80 p-3.5 shadow-2xs hover:border-indigo-300 transition-all">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <label className="text-xs font-black text-indigo-950 dark:text-slate-100">Total Gross Weight</label>
                              {(() => {
                                const n = parseFloat((formData.net_weight || "").replace(/[^0-9.]/g, "")) || 0
                                const g = parseFloat((formData.gross_weight || "").replace(/[^0-9.]/g, "")) || 0
                                if (g > n && n > 0) {
                                  return (
                                    <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                                      +{(g - n).toLocaleString()} kg tare
                                    </span>
                                  )
                                }
                                return null
                              })()}
                            </div>
                            <span className="font-[vazirmatn] text-[11px] font-bold text-indigo-700 dark:text-indigo-400 shrink-0" dir="rtl">وزن ناخالص کل</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-indigo-600 dark:text-indigo-400 pointer-events-none">
                              <Scale className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <Input
                              name="gross_weight"
                              value={formData.gross_weight}
                              onChange={(e) => handleCargoFieldChange("gross_weight", e.target.value)}
                              placeholder="5,000 KG"
                              className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold font-mono text-indigo-950 dark:text-indigo-200 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-2xs transition-all"
                            />
                          </div>
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-indigo-800 dark:text-indigo-400 font-bold px-0.5">
                            <span className="font-semibold text-indigo-700/80 dark:text-indigo-400">Cartons × Gross/Ctn</span>
                            <button
                              type="button"
                              onClick={handleAutoCalculateWeights}
                              className="font-extrabold text-indigo-900 dark:text-indigo-200 bg-indigo-100/70 hover:bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 active:scale-95 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              ↺ Sync
                            </button>
                          </div>
                        </div>

                        {/* Volume (CBM) */}
                        <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-white/90 dark:bg-slate-950/80 p-3.5 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between min-w-0">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="text-xs font-black text-amber-950 dark:text-slate-100">Volume (CBM)</label>
                            <span className="font-[vazirmatn] text-[11px] font-bold text-amber-700 dark:text-amber-400 shrink-0" dir="rtl">حجم کانتینر</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-3.5 text-amber-600 dark:text-amber-400 pointer-events-none">
                              <FileText className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <Input
                              name="measurement"
                              value={formData.measurement}
                              onChange={(e) => handleCargoFieldChange("measurement", e.target.value)}
                              placeholder="25.0 CBM"
                              className="pl-10.5 pr-3.5 rounded-xl h-11 text-sm font-extrabold font-mono text-amber-950 dark:text-amber-200 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 shadow-inner focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs transition-all"
                            />
                          </div>
                          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                            {[
                              { label: "20' STD", cbm: "33.0 CBM" },
                              { label: "40' STD", cbm: "67.0 CBM" },
                              { label: "40' HQ", cbm: "76.0 CBM" },
                              { label: "LCL", cbm: "15.0 CBM" },
                            ].map((box, bIdx) => (
                              <button
                                key={`box-${box.label}-${bIdx}`}
                                type="button"
                                onClick={() => applyVolumeCbmPreset(box.cbm)}
                                className="text-[9.5px] font-extrabold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 rounded-lg py-1 px-1 border border-amber-200 dark:border-amber-800 shadow-2xs active:scale-95 transition-all cursor-pointer text-center whitespace-nowrap"
                              >
                                {box.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Accounting Invariance & Calculation Status Bar */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Live Calculation Active</span>
                        <span className="text-[10.5px] font-semibold text-emerald-700/80 dark:text-emerald-400/80">(Net Wt × Rate = Valuation)</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono font-black text-emerald-800 dark:text-emerald-300 text-xs">
                        <span>Net Valuation:</span>
                        <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          {formData.goods_value || "$0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field Grid - Row 3: Cargo Description Studio */}
                <div className="space-y-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-linear-to-b from-slate-50/60 via-white to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-3.5 sm:p-4.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 dark:bg-slate-700 text-xs font-black text-white shadow-2xs">3</span>
                      <div>
                        <label className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                          Cargo Description & Document Studio
                        </label>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Print-ready commodity description with automated customs clauses</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        {formData.cargo_description ? `${formData.cargo_description.length} chars • ${formData.cargo_description.trim().split(/\s+/).filter(Boolean).length} words` : "Empty"}
                      </span>
                      <button
                        type="button"
                        onClick={applyDefaultCargoDescription}
                        className="text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 bg-white dark:bg-slate-850 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                        title="Apply default cargo particulars template"
                      >
                        📦 Default Template
                      </button>
                      <button
                        type="button"
                        onClick={formatCleanCargoDescription}
                        className="text-[10.5px] font-extrabold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 bg-white dark:bg-slate-850 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800 transition cursor-pointer"
                        title="Tidy line breaks and formatting"
                      >
                        🧹 Clean Format
                      </button>
                      <button
                        type="button"
                        onClick={insertBilingualCargoHeader}
                        className="text-[10.5px] font-extrabold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 bg-white dark:bg-slate-850 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                        title="Add bilingual English/Dari header"
                      >
                        🌐 Bilingual Header
                      </button>
                      <button
                        type="button"
                        onClick={clearCargoDescription}
                        className="text-[10.5px] font-extrabold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 bg-white hover:bg-red-50 dark:bg-slate-850 dark:hover:bg-red-950/50 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        title="Clear description text"
                      >
                        ✕ Clear
                      </button>
                      <span className="font-[vazirmatn] text-[11px] font-extrabold text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                        شرح کامل کالا و محموله
                      </span>
                    </div>
                  </div>

                  {/* Quick Tag Snippets Bar */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Quick Tags:
                    </span>
                    {[
                      {
                        label: "+ Default Template",
                        text: `📦 CONTAINER & CARGO PARTICULARS:
• Description: 
• Transit Date: ${new Date().toLocaleDateString("en-CA")}
• INV-`,
                      },
                      { label: "+ Transit Date", text: `• Transit Date: ${new Date().toLocaleDateString("en-CA")}` },
                      { label: "+ Description", text: "• Description: " },
                      { label: "+ INV-", text: "• INV-" },
                      { label: "+ HS Code", text: "• HS Code: 0806.20" },
                      { label: "+ Afghan TC No", text: "• Afghan Transit TC No: TC-" },
                      { label: "+ Temp Controlled (+4°C)", text: "• Temperature Controlled Reefer Cargo (+4°C to +8°C)" },
                      { label: "+ Customs Seal Verified", text: "• Customs Seal Intact & Verified at Border Station" },
                      { label: "+ Fragile", text: "• FRAGILE - HANDLE WITH CARE - STOW AWAY FROM HEAT" },
                      { label: "+ Non-Hazardous", text: "• NON-HAZARDOUS GENERAL DRY COMMERCIAL CARGO" },
                    ].map((snippet, sIdx) => (
                      <button
                        key={`snip-${snippet.label}-${sIdx}`}
                        type="button"
                        onClick={() => insertCargoTagSnippet(snippet.text)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:border-purple-300 dark:hover:border-purple-800 text-slate-700 dark:text-slate-300 hover:text-purple-900 dark:hover:text-purple-200 px-2 py-1 text-[10.5px] font-extrabold whitespace-nowrap transition cursor-pointer shadow-2xs active:scale-95 shrink-0"
                      >
                        {snippet.label}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    name="cargo_description"
                    value={formData.cargo_description}
                    onChange={(e) => handleCargoFieldChange("cargo_description", e.target.value)}
                    dir="auto"
                    placeholder={`📦 CONTAINER & CARGO PARTICULARS:\n• Description: \n• Transit Date: ${new Date().toLocaleDateString("en-CA")}\n• INV-`}
                    rows={4}
                    className="min-h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 text-xs sm:text-sm font-semibold leading-relaxed text-slate-950 dark:text-slate-100 shadow-inner transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:bg-slate-950"
                  />
                </div>
              </CardContent>
            </Card>
              </div>

              {/* Second Column — Cargo Presets & Specifications */}
              <div className="cargo-section w-full min-w-0">
                <Card id="section-cargo" className="overflow-hidden rounded-[28px] sm:rounded-[32px] w-full border border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-[0_20px_55px_-24px_rgba(88,28,135,0.28)] dark:shadow-[0_20px_55px_-24px_rgba(0,0,0,0.6)] backdrop-blur-2xl [content-visibility:auto] [contain-intrinsic-size:1px_600px]">
              <CardHeader className="border-b border-purple-100 dark:border-slate-800 bg-linear-to-r from-purple-50/90 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 px-4 py-4 sm:px-5">
                <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center px-1.5 h-6 rounded-lg bg-purple-600 text-white text-[10px] font-black shadow-xs">
                      Presets
                    </span>
                    <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
                      <Package className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-950 dark:text-slate-100 text-base tracking-tight select-none">Cargo Details & Specifications</span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-purple-700 dark:text-purple-300">Packages, weights, rates and printable cargo description</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAutoCalculateWeights}
                      className="h-9 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-3.5 text-xs font-black text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-indigo-700 active:scale-95 cursor-pointer"
                      title="Calculate Net Weight, Gross Weight and Goods Value"
                    >
                      <Calculator className="h-3.5 w-3.5 mr-1" />
                      Calculate totals
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllCargoFields}
                      className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-[10.5px] font-bold text-slate-600 dark:text-slate-300 shadow-2xs hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400"
                      title="Clear all Cargo fields"
                    >
                      ✕ Clear All
                    </Button>
                    <span className="rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 text-xs font-extrabold text-purple-900 dark:text-purple-300 font-[vazirmatn]" dir="rtl">
                      مشخصات کالا و محموله
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-5 pt-4 sm:px-5">
                <RoutePresetSelector
                  value={formData.cargo_route_note}
                  onChange={(val) => setFormData((prev) => ({ ...prev, cargo_route_note: val }))}
                />
                {/* Quick Cargo Preset Selector Strip */}
                <div className="rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-linear-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/80 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 p-3.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      1-Click Cargo Commodity Presets
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 font-[vazirmatn]" dir="rtl">
                      بارگذاری پیش‌فرض‌های آماده کالا
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {CARGO_PRESETS.map((preset, pIdx) => {
                      const match = preset.name.match(/^(.*?)\s*\((.*?)\)$/)
                      const englishName = match ? match[1].trim() : preset.name
                      const persianName = match ? match[2].trim() : ""

                      const iconMap: Record<string, string> = {
                        "Dried Figs": "🍯",
                        "Green Raisins": "🍇",
                        "Mamra Almonds": "🥜",
                        "Pomegranate Juice": "🥤",
                        "Textiles / Fabrics": "🧵",
                        "General Transit Goods": "📦",
                      }
                      const icon = iconMap[englishName] || "📦"

                      return (
                        <button
                          key={`main-cargo-preset-${preset.name}-${pIdx}`}
                          type="button"
                          onClick={() => handleApplyCargoPreset(preset)}
                          className="group/preset rounded-xl border border-purple-200/90 dark:border-purple-800/80 bg-white dark:bg-slate-900 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white hover:border-purple-600 dark:hover:border-purple-500 text-slate-800 dark:text-slate-200 p-2.5 transition-all cursor-pointer shadow-2xs hover:shadow-md active:scale-98 flex flex-col justify-between gap-1.5 text-left [&_*]:pointer-events-none"
                          title={`Apply ${preset.name} (${preset.packages}, ${preset.kgsPerCarton} kg/ctn, $${preset.rate}/kg)`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0">{icon}</span>
                              <span className="text-xs font-black truncate">{englishName}</span>
                            </div>
                            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-100 group-hover/preset:bg-white/20 text-purple-900 group-hover/preset:text-white dark:bg-purple-900/60 dark:text-purple-200 shrink-0 border border-purple-200/60 group-hover/preset:border-white/30">
                              {preset.packages}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 w-full text-[10.5px] opacity-75 group-hover/preset:opacity-90">
                            {persianName ? (
                              <span className="font-[vazirmatn] font-bold text-slate-500 group-hover/preset:text-white truncate" dir="rtl">
                                {persianName}
                              </span>
                            ) : <span />}
                            <span className="font-mono text-[9px] text-slate-400 group-hover/preset:text-white/80 shrink-0">
                              {preset.kgsPerCarton}kg • ${preset.rate}/kg
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>


              {/* Third Column — Route Stops & Transit Pathway */}
              <div className="route-section w-full min-w-0">
                <Card id="section-routes" data-smart-ignore="true" data-transit-stops-container="true" className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[28px] sm:rounded-[32px] border border-blue-100/80 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_600px]">
              <CardHeader className="pb-4 border-b border-slate-100/80 dark:border-slate-800 bg-linear-to-r from-blue-50/50 via-indigo-50/30 to-slate-50/50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] font-black shadow-xs shrink-0">
                        06
                      </span>
                      <div className="p-3 rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-cyan-500 shadow-lg shadow-blue-500/25 text-white">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-blue-950 dark:text-slate-100 text-lg tracking-tight">Route Stops &amp; Transit Pathway</span>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-[vazirmatn]">
                            مسیر حمل و نقل و توقفگاه‌ها
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Define multi-stop transit route, border customs points, vehicle plates, and transport modes
                        </p>
                      </div>
                    </div>

                    {/* Top Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={openSaveRouteModal}
                        className="h-9 rounded-xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white px-3 text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer transition-all gap-1.5"
                        title="Save current route path into Quick Presets list for one-click reuse"
                      >
                        <BookmarkPlus className="h-4 w-4 text-white" />
                        Save to Presets / ذخیره مسیر
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={syncRoutesWithBOLPorts}
                        className="h-9 rounded-xl border-blue-200 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/60 px-3 text-xs font-extrabold text-blue-900 dark:text-blue-300 shadow-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer transition-all"
                        title="Synchronize Stop 1 with Port of Loading and Last Stop with Port of Discharge"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5 text-blue-700 dark:text-blue-400" />
                        Sync with B/L / همگام‌سازی
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={reverseRoutes}
                        className="h-9 rounded-xl border-purple-200 dark:border-purple-800 bg-purple-50/90 dark:bg-purple-950/60 px-3 text-xs font-extrabold text-purple-900 dark:text-purple-300 shadow-xs hover:bg-purple-100 dark:hover:bg-purple-900/60 cursor-pointer transition-all"
                        title="Reverse the entire route sequence (e.g. Export return trip)"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-purple-700 dark:text-purple-400" />
                        Reverse / معکوس مسیر
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={addRouteStop}
                        className="h-9 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white px-3.5 text-xs font-extrabold shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 cursor-pointer transition-all"
                      >
                        <Plus className="h-4 w-4 mr-1 text-white" />
                        Add Stop / افزودن توقفگاه
                      </Button>
                    </div>
                  </div>

                  {/* Route Presets Strip */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Quick Presets:
                    </span>

                    {/* Custom User Saved Presets */}
                    {savedRoutePresets.map((preset, pIdx) => (
                      <div key={preset.id ? `${preset.id}-${pIdx}` : `preset-${pIdx}`} className="relative group inline-flex items-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => applyCustomRoutePreset(preset)}
                          className="h-7.5 rounded-lg border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50/80 pr-6 pl-2.5 text-[11px] font-black text-amber-950 shadow-2xs hover:border-amber-400 hover:from-amber-100 hover:to-orange-100 cursor-pointer transition-all gap-1.5"
                          title={`Click to apply ${preset.title} (${preset.routes.length} stops)`}
                        >
                          <span className="pointer-events-none">{preset.icon || "⭐"}</span>
                          <span className="max-w-[150px] truncate pointer-events-none">{preset.title}</span>
                          <span className="rounded-full bg-amber-200/90 px-1.5 py-0.2 text-[9px] font-black text-amber-900 pointer-events-none">
                            {preset.routes.length}
                          </span>
                        </Button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRoutePreset(preset.id, e)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-200 text-red-600 transition-all cursor-pointer"
                          title="Delete this saved preset"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyDogharonToMersinReeferExportPreset}
                      className="h-7.5 rounded-lg border border-cyan-300 bg-cyan-50/90 px-2.5 text-[11px] font-black text-cyan-950 shadow-2xs hover:bg-cyan-100 cursor-pointer transition-all"
                      title="Route 3: Dogharon → Bazargan → Mersin Reefer (40RF with Escort & Plugging - $14,494.12 USD)"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1 text-cyan-700" />
                      ❄️ Route 3: Dogharon ➡️ Mersin Reefer ($14,494)
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyDougharounToMersinExportPreset}
                      className="h-7.5 rounded-lg border border-purple-300 bg-purple-50/90 px-2.5 text-[11px] font-black text-purple-950 shadow-2xs hover:bg-purple-100 cursor-pointer transition-all"
                      title="Route 1: Dougharoun → Bazargan → Mersin (Afghan Export via Turkey - $3,100 USD)"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1 text-purple-700" />
                      🇹🇷 Route 1: Dougharoun ➡️ Mersin ($3,100)
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyNimrozToBandarAbbasExportPreset}
                      className="h-7.5 rounded-lg border border-amber-300 bg-amber-50/90 px-2.5 text-[11px] font-black text-amber-950 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all"
                      title="Route 2: Nimroz → Milak → Bandar Abbas (Afghan Export via South Iran - $1,550 USD)"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1 text-amber-700" />
                      🇮🇷 Route 2: Nimroz ➡️ Bandar Abbas ($1,550)
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyNimrozFullReeferSwitchPreset}
                      className="h-7.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50/90 dark:bg-purple-950/60 px-2.5 text-[11px] font-black text-purple-950 dark:text-purple-200 shadow-2xs hover:bg-purple-100 dark:hover:bg-purple-900/60 cursor-pointer transition-all"
                      title="Nimroz → Bandar Abbas (Switch B/L) → Dubai (Full Way Reefer - $2,850 USD)"
                    >
                      <Snowflake className="h-3.5 w-3.5 mr-1 text-cyan-600 shrink-0" />
                      <span>❄️ 🔄 نیمروز ریفر + سوییچ BL ($2,850)</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyKandaharNimrozBandarAbbasDubaiIndiaPreset}
                      className="h-7.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 text-[11px] font-extrabold text-emerald-900 shadow-2xs hover:bg-emerald-100 cursor-pointer transition-all"
                      title="Kandahar → Nimroz → Bandar Abbas → Dubai → Nhava Sheva (India)"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                      🇦🇫 ➡️ 🇮🇷 ➡️ 🇦🇪 ➡️ 🇮🇳 Kandahar to India
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyHeratIslamQalaDougharounPreset}
                      className="h-7.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 text-[11px] font-extrabold text-blue-900 shadow-2xs hover:bg-blue-100 cursor-pointer transition-all"
                      title="Herat → Islam Qala → Dougharoun (Afghanistan to Iran)"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1 text-blue-700" />
                      🚛 Herat ➡️ Dougharoun
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyNimrozChabaharIndiaPreset}
                      className="h-7.5 rounded-lg border border-cyan-200 bg-cyan-50/80 px-2.5 text-[11px] font-extrabold text-cyan-900 shadow-2xs hover:bg-cyan-100 cursor-pointer transition-all"
                      title="Nimroz → Milak Border → Chabahar Port → Mundra (India)"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1 text-cyan-700" />
                      🇮🇷 Nimroz ➡️ Chabahar ➡️ India
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyKandaharChamanKarachiDubaiPreset}
                      className="h-7.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 text-[11px] font-extrabold text-indigo-900 shadow-2xs hover:bg-indigo-100 cursor-pointer transition-all"
                      title="Kandahar → Chaman → Karachi → Dubai"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1 text-indigo-700" />
                      🇵🇰 Kandahar ➡️ Karachi ➡️ Dubai
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyMazarHairatanTashkentPreset}
                      className="h-7.5 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 text-[11px] font-extrabold text-amber-900 shadow-2xs hover:bg-amber-100 cursor-pointer transition-all"
                      title="Mazar-i-Sharif → Hairatan Border → Termez → Tashkent (Rail)"
                    >
                      <Train className="h-3.5 w-3.5 mr-1 text-amber-700" />
                      🇺🇿 Mazar ➡️ Hairatan ➡️ Tashkent
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyKabulDubaiAirPreset}
                      className="h-7.5 rounded-lg border border-sky-200 bg-sky-50/80 px-2.5 text-[11px] font-extrabold text-sky-900 shadow-2xs hover:bg-sky-100 cursor-pointer transition-all"
                      title="Kabul Airport → Dubai Airport (Air Cargo)"
                    >
                      <Plane className="h-3.5 w-3.5 mr-1 text-sky-700" />
                      ✈️ Kabul ➡️ Dubai (Air)
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={applyJaskSuwaiqSoharCorridorPreset}
                      className="h-7.5 rounded-lg border border-teal-300 dark:border-teal-800 bg-teal-50/90 dark:bg-teal-950/60 px-2.5 text-[11px] font-black text-teal-950 dark:text-teal-200 shadow-2xs hover:bg-teal-100 dark:hover:bg-teal-900/60 cursor-pointer transition-all"
                      title="Nimroz → Jask Port (Iran) → Suwaiq Port (Oman) → Sohar Port (Oman)"
                    >
                      <Ship className="h-3.5 w-3.5 mr-1 text-teal-700 dark:text-teal-400" />
                      <span>🇮🇷 ➡️ 🇴🇲 جاسک ➔ السویق ➔ صحار</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-5 pb-6">
                {formData.routes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-blue-200 dark:border-slate-800 bg-white/55 dark:bg-slate-900/60 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 mx-auto mb-3 shadow-inner">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-extrabold text-blue-950 dark:text-blue-200">No transit route stops configured</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-[vazirmatn] mt-1" dir="rtl">
                      برای شروع یک توقفگاه اضافه نمایید یا از پیش‌فرض‌های سریع بالا انتخاب کنید
                    </p>
                    <Button
                      type="button"
                      onClick={addRouteStop}
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-black shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 cursor-pointer transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Add First Stop / افزودن اولین توقفگاه
                    </Button>
                  </div>
                ) : (
                  <>
                {/* Visual Route Pathway Stepper Timeline */}
                <div className="rounded-2xl border border-blue-200/80 bg-linear-to-r from-blue-50/90 via-indigo-50/50 to-cyan-50/90 p-4 shadow-inner overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                        Transit Stepper Pathway / نقشه مسیر
                      </span>
                      <span className="rounded-full bg-blue-200/70 px-2 py-0.5 text-[10px] font-black text-blue-900">
                        {formData.routes.length} Stops Total
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 font-[vazirmatn]" dir="rtl">
                      برای انتخاب یا ویرایش روی هر توقفگاه کلیک کنید
                    </span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {formData.routes.map((route, index) => {
                      const isOrigin = index === 0
                      const isDest = index === formData.routes.length - 1
                      const stopName = route.location || `Stop #${index + 1}`
                      const isSelected = activeRouteIndex === index
                      
                      return (
                        <div key={route.id ? `route-chip-${route.id}-${index}` : `route-chip-${index}`} className="flex items-center gap-2.5 shrink-0">
                          <div
                            onClick={() => setActiveRouteIndex(index)}
                            className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-300 cursor-pointer ${
                              isSelected
                                ? "border-2 border-blue-600 bg-white shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/15 scale-102"
                                : "border-slate-200/90 bg-white/95 hover:border-blue-300 hover:bg-white hover:shadow-md"
                            }`}
                          >
                            {/* Reorder & Action Mini Toolbar (Hover) */}
                            <div className="absolute -top-3.5 right-2 hidden group-hover:flex items-center gap-0.5 bg-white p-0.5 rounded-lg shadow-md border border-slate-200 z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveRouteStop(index, 'up')
                                }}
                                disabled={index === 0}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer disabled:opacity-30"
                                title="Move Earlier (▲)"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveRouteStop(index, 'down')
                                }}
                                disabled={index === formData.routes.length - 1}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer disabled:opacity-30"
                                title="Move Later (▼)"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateRouteStop(index)
                                }}
                                className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                title="Duplicate Stop"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              {formData.routes.length > 2 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeRouteStop(index)
                                  }}
                                  className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title="Delete Stop"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>

                            {/* Stop Index Badge */}
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-white text-sm shadow-md ${
                                isOrigin
                                  ? "bg-linear-to-br from-emerald-500 to-teal-700 shadow-emerald-500/25"
                                  : isDest
                                  ? "bg-linear-to-br from-indigo-600 to-purple-700 shadow-indigo-500/25"
                                  : "bg-linear-to-br from-blue-600 to-cyan-600 shadow-blue-500/25"
                              }`}
                            >
                              {index + 1}
                            </div>

                            <div className="min-w-[140px] max-w-[260px]">
                              <div className="flex items-center gap-1.5">
                                {getTransportIcon(route.transportMode)}
                                <span className={`text-[10px] font-black uppercase tracking-wider ${
                                  isOrigin ? "text-emerald-700" : isDest ? "text-indigo-700" : "text-blue-700"
                                }`}>
                                  {isOrigin ? "Origin (مبدأ)" : isDest ? "Destination (مقصد)" : `Stop #${index + 1}`}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs font-black text-blue-950 leading-snug break-words line-clamp-2">{stopName}</p>
                              {route.locationPersian && (
                                <p className="text-[10px] font-bold text-slate-500 font-[vazirmatn] leading-tight break-words line-clamp-2 mt-0.5" dir="rtl">{route.locationPersian}</p>
                              )}

                              {/* Truck / Seal details badge */}
                              {route.plateNumber && (
                                <span className="mt-1 inline-block rounded bg-blue-100 px-1 py-0.2 text-[9px] font-extrabold text-blue-900 border border-blue-200">
                                  Plate: {route.plateNumber}
                                </span>
                              )}
                              {route.customsSealRequired && (
                                <span className="mt-1 ml-1 inline-block rounded bg-amber-100 px-1 py-0.2 text-[9px] font-extrabold text-amber-900 border border-amber-200" dir="rtl">
                                  📍 سیل ګمرک
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Connecting arrow */}
                          {index < formData.routes.length - 1 && (
                            <div className="flex items-center gap-1 px-0.5 text-blue-500 shrink-0">
                              <span className="h-0.5 w-4 bg-linear-to-r from-blue-400 to-indigo-400 rounded-full" />
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Stop Cards List */}
                <div className="space-y-4">
                  {formData.routes.map((route, index) => {
                    const isOrigin = index === 0
                    const isDest = index === formData.routes.length - 1
                    const isSelected = activeRouteIndex === index

                    return (
                      <div
                        key={route.id ? `route-card-${route.id}-${index}` : `route-card-${index}`}
                        className={`rounded-2xl border transition-all ${
                          isSelected
                            ? "border-2 border-blue-500 bg-white shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10"
                            : "border-slate-200/90 bg-white/95 hover:border-slate-300"
                        } p-4.5`}
                      >
                        {/* Stop Card Header */}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ${
                              isOrigin
                                ? "bg-linear-to-br from-emerald-500 to-teal-700"
                                : isDest
                                ? "bg-linear-to-br from-indigo-600 to-purple-700"
                                : "bg-linear-to-br from-blue-600 to-cyan-600"
                            }`}>
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-black text-blue-950 dark:text-slate-100">
                                  {isOrigin ? "Origin Point (نقطه مبدأ)" : isDest ? "Final Destination (مقصد نهایی)" : `Stop #${index + 1} - Transit Stop (توقفگاه)`}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider shrink-0 ${
                                  isOrigin ? "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" : isDest ? "bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800" : "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                }`}>
                                  {isOrigin ? "Port of Loading" : isDest ? "Port of Discharge" : `Transit Stop`}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-[vazirmatn] mt-0.5" dir="rtl">
                                {route.locationPersian || (isOrigin ? "محل بارگیری" : isDest ? "محل تخلیه نهایی" : "ایستگاه و مرز ترانزیتی")}
                              </p>
                            </div>
                          </div>

                          {/* Action Toolbar on Card (Sleek Single-Line Fit) */}
                          <div className="flex items-center gap-1 shrink-0 ml-auto">
                            {/* Move Up */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === 0}
                              onClick={() => moveRouteStop(index, 'up')}
                              className="h-7.5 w-7.5 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 disabled:opacity-30 cursor-pointer"
                              title="Move Stop Earlier (▲)"
                              aria-label="Move Stop Earlier"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                              <span className="sr-only">Move Up</span>
                            </Button>

                            {/* Move Down */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={index === formData.routes.length - 1}
                              onClick={() => moveRouteStop(index, 'down')}
                              className="h-7.5 w-7.5 p-0 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 disabled:opacity-30 cursor-pointer"
                              title="Move Stop Later (▼)"
                              aria-label="Move Stop Later"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                              <span className="sr-only">Move Down</span>
                            </Button>

                            {/* Duplicate */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateRouteStop(index)}
                              className="h-7.5 rounded-lg border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 px-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                              title="Duplicate this stop"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              <span>Duplicate</span>
                            </Button>

                            {/* Delete */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/40 px-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 hover:text-red-700 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                              onClick={() => removeRouteStop(index)}
                              title="Remove this route stop"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>

                        {/* Location and Transport Inputs (Clean 2-Column + Full-Width Mode Selector) */}
                        <div className="space-y-3">
                          {/* Relative container spanning both English and Persian inputs so the recommendation popover spans the full route stop card */}
                          <div className="relative">
                            <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                              {/* English Location */}
                              <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between h-5">
                                  <span className="truncate">Location (EN) / {isOrigin ? "Origin" : isDest ? "Dest." : `#${index + 1}`}</span>
                                  {route.location && (
                                    <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">Selected</span>
                                  )}
                                </label>
                                <Input
                                  value={route.location}
                                  data-smart-disable="true"
                                  data-transit-stop="true"
                                  onFocus={() => {
                                    setActiveRouteIndex(index)
                                    setActiveLocationField("en")
                                    setFilterByRouteInput(false)
                                    setShowLocationDropdown(index)
                                  }}
                                  onChange={(e) => {
                                    setActiveRouteIndex(index)
                                    setActiveLocationField("en")
                                    setFilterByRouteInput(true)
                                    setShowLocationDropdown(index)
                                    handleRouteChange(index, "location", e.target.value)
                                  }}
                                  placeholder={`e.g. ${isOrigin ? "Kandahar, AF" : isDest ? "Nhava Sheva, IN" : "Bandar Abbas, IR"}`}
                                  className="h-10.5 rounded-xl border-slate-200 bg-white font-semibold text-slate-900 focus:border-amber-400 focus:ring-amber-200"
                                />
                              </div>

                              {/* Persian Location */}
                              <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between h-5" dir="rtl">
                                  <span className="font-[vazirmatn] truncate">موقعیت (فارسی / پښتو)</span>
                                  <span className="text-[9px] font-extrabold text-slate-400 font-sans uppercase direction-ltr">FA / PS</span>
                                </label>
                                <Input
                                  value={route.locationPersian}
                                  data-smart-disable="true"
                                  data-transit-stop="true"
                                  onFocus={() => {
                                    setActiveRouteIndex(index)
                                    setActiveLocationField("fa")
                                    setFilterByRouteInput(false)
                                    setShowLocationDropdown(index)
                                  }}
                                  onChange={(e) => {
                                    setActiveRouteIndex(index)
                                    setActiveLocationField("fa")
                                    setFilterByRouteInput(true)
                                    setShowLocationDropdown(index)
                                    handleRouteChange(index, "locationPersian", e.target.value)
                                  }}
                                  placeholder="نام محل، بندر یا گمرک"
                                  dir="rtl"
                                  className="h-10.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-xs font-[vazirmatn] focus:border-amber-400 focus:ring-amber-200"
                                />
                              </div>
                            </div>

                            {/* Inline Recommendation Popover (Full Stop Card Width + Responsive 2-Col Layout) */}
                            {showLocationDropdown === index && (
                              <>
                                {/* Backdrop to dismiss popover when clicking anywhere outside */}
                                <div
                                  className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[1px]"
                                  onClick={() => setShowLocationDropdown(null)}
                                  aria-hidden="true"
                                />
                                <div className="absolute inset-x-0 top-full z-50 mt-1.5 w-full max-h-[70vh] sm:max-h-[30rem] flex flex-col rounded-2xl border-2 border-amber-400 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-950/35 backdrop-blur-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                                  {/* Popover Header (Fixed Top) */}
                                  <div className="shrink-0 p-3 sm:p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/70 dark:bg-slate-900/70">
                                    {/* Header Row 1: Title + Badges + Close Button */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                        <span className="text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-1">
                                          <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                          <span>Suggested Locations</span>
                                        </span>
                                        <span className="rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-black border border-amber-300/40 shrink-0">
                                          {quickLocationMatches.length}
                                        </span>
                                        {selectedCountryFilter !== "ALL" && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedCountryFilter("ALL")
                                              setFilterByRouteInput(false)
                                            }}
                                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 px-2 py-0.5 text-[9.5px] font-black border border-amber-400/40 hover:bg-amber-500/25 transition cursor-pointer shrink-0"
                                            title="Click to reset country filter"
                                          >
                                            <span>{selectedCountryFilter}</span>
                                            <span className="text-amber-700 dark:text-amber-300 font-normal">✕</span>
                                          </button>
                                        )}
                                        {route.transportMode === "airplane" && !disableModeFilter && (
                                          <span className="rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 px-2 py-0.5 text-[9px] font-black border border-sky-200 dark:border-sky-800 shrink-0">
                                            ✈️ Airports Only
                                          </span>
                                        )}
                                        {route.transportMode === "vessel" && !disableModeFilter && (
                                          <span className="rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 text-[9px] font-black border border-cyan-200 dark:border-cyan-800 shrink-0">
                                            🚢 Ports Only
                                          </span>
                                        )}
                                        {route.transportMode === "train" && !disableModeFilter && (
                                          <span className="rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 px-2 py-0.5 text-[9px] font-black border border-purple-200 dark:border-purple-800 shrink-0">
                                            🚆 Rail Only
                                          </span>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setShowLocationDropdown(null)}
                                        className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                                        title="Close suggested locations (Esc)"
                                      >
                                        <span>✕</span>
                                        <span>Close</span>
                                      </button>
                                    </div>

                                    {/* Header Row 2: Full-Width Search Input with Clear Button */}
                                    <div className="relative w-full">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                      <Input
                                        value={routeLocationSearch}
                                        onChange={(e) => {
                                          setRouteLocationSearch(e.target.value)
                                          setFilterByRouteInput(false)
                                        }}
                                        placeholder={
                                          filterByRouteInput && activeInputLocation
                                            ? `Filtering by stop: "${activeInputLocation}"... (click ✕ to clear)`
                                            : "Filter locations, ports, codes (e.g. Jask, Sohar, DXB)..."
                                        }
                                        className="h-8.5 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 pl-8 pr-8 focus:border-amber-400 focus:ring-amber-200 w-full font-medium shadow-2xs"
                                        autoFocus={false}
                                      />
                                      {(routeLocationSearch || (filterByRouteInput && activeInputLocation)) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRouteLocationSearch("")
                                            setFilterByRouteInput(false)
                                          }}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                          title="Clear search and show all"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {/* Active Stop Port / Terminal Information Banner inside popover */}
                                    {(() => {
                                      const activeStopPort = detectPortDetails(route)
                                      if (!activeStopPort) return null
                                      return (
                                        <div className="rounded-xl border border-cyan-300 dark:border-cyan-700 bg-linear-to-r from-cyan-50/95 via-sky-50/70 to-emerald-50/60 dark:from-cyan-950/50 dark:via-slate-900/70 dark:to-emerald-950/40 p-2.5 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
                                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span className="flex items-center justify-center h-5 w-5 rounded-md bg-cyan-600 text-white text-[10px] font-black shrink-0">
                                                ⚓
                                              </span>
                                              <span className="text-xs font-black text-cyan-950 dark:text-cyan-200 truncate">
                                                {activeStopPort.title}
                                              </span>
                                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-[vazirmatn] truncate" dir="rtl">
                                                {activeStopPort.titleFa}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                              <span className="rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-1.5 py-0.5 text-[9px] font-black font-mono">
                                                UN/LOCODE: {activeStopPort.unLocode}
                                              </span>
                                              {activeStopPort.customsCode && (
                                                <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 text-[9px] font-black font-mono">
                                                  Customs: {activeStopPort.customsCode}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-1 text-[9px]">
                                            <span className="rounded-md bg-cyan-100/90 dark:bg-cyan-900/60 text-cyan-900 dark:text-cyan-200 px-1.5 py-0.5 font-extrabold">
                                              {activeStopPort.category}
                                            </span>
                                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 font-medium">
                                              📍 {activeStopPort.stateCountry}
                                            </span>
                                            {activeStopPort.railConnected && (
                                              <span className="rounded-md bg-purple-100/90 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 px-1.5 py-0.5 font-bold">
                                                🚆 Rail / DFC Connected
                                              </span>
                                            )}
                                          </div>
                                          {activeStopPort.terminalPresets && (
                                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-cyan-200/60 dark:border-slate-800">
                                              <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 mr-1">Quick Terminal:</span>
                                              {activeStopPort.terminalPresets.map((term) => (
                                                <button
                                                  key={`popover-stop-term-${term}`}
                                                  type="button"
                                                  onClick={() => {
                                                    handleRouteChange(index, "customsSealNote", term)
                                                    toast.success(`Set terminal: ${term}`)
                                                  }}
                                                  className="rounded-md bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 px-1.5 py-0.5 text-[8.5px] font-extrabold text-cyan-950 dark:text-cyan-200 cursor-pointer transition shadow-2xs"
                                                >
                                                  +{term}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })()}

                                    {/* Mode-Specific Filtering Alert & Toggle */}
                                    {route.transportMode === "airplane" && (
                                      <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-xl px-3 py-1.5 gap-2 shadow-2xs">
                                        <div className="flex items-center gap-1.5 text-sky-950 dark:text-sky-200 font-black text-[11px] truncate">
                                          <Plane className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                          <span className="truncate">AIR MODE: Showing Airports Only (میدان‌های هوایی)</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setDisableModeFilter(!disableModeFilter)}
                                          className="text-[9.5px] font-black px-2 py-0.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-200 hover:bg-sky-100 transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                        >
                                          {disableModeFilter ? "✈️ Filter Airports Only" : "🌐 Show All Locations"}
                                        </button>
                                      </div>
                                    )}

                                    {route.transportMode === "vessel" && (
                                      <div className="flex items-center justify-between bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 rounded-xl px-3 py-1.5 gap-2 shadow-2xs">
                                        <div className="flex items-center gap-1.5 text-cyan-950 dark:text-cyan-200 font-black text-[11px] truncate">
                                          <Ship className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                          <span className="truncate">SEA MODE: Showing Ports Only (بنادر دریایی)</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setDisableModeFilter(!disableModeFilter)}
                                          className="text-[9.5px] font-black px-2 py-0.5 rounded-lg border border-cyan-300 dark:border-cyan-700 bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-100 transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                        >
                                          {disableModeFilter ? "⚓ Filter Ports Only" : "🌐 Show All Locations"}
                                        </button>
                                      </div>
                                    )}

                                    {route.transportMode === "train" && (
                                      <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-1.5 gap-2 shadow-2xs">
                                        <div className="flex items-center gap-1.5 text-purple-950 dark:text-purple-200 font-black text-[11px] truncate">
                                          <Train className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                          <span className="truncate">RAIL MODE: Showing Rail & ICD Hubs (ایستگاه‌های ریل)</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setDisableModeFilter(!disableModeFilter)}
                                          className="text-[9.5px] font-black px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-200 hover:bg-purple-100 transition cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                                        >
                                          {disableModeFilter ? "🚆 Filter Rail Only" : "🌐 Show All Locations"}
                                        </button>
                                      </div>
                                    )}

                                    {/* Quick Country Filter Chips — Single-Row Smooth Horizontal Scroll with Navigation Chevrons */}
                                    <div className="relative flex items-center group/pills w-full min-w-0">
                                      {/* Scroll Left Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          const container = e.currentTarget.parentElement?.querySelector('.pills-scroll-track') as HTMLDivElement | null
                                          if (container) container.scrollBy({ left: -140, behavior: 'smooth' })
                                        }}
                                        className="hidden sm:flex shrink-0 items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-900 transition mr-1 cursor-pointer"
                                        title="Scroll filter chips left"
                                        aria-label="Scroll left"
                                      >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                      </button>

                                      {/* Scroll Track with Wheel Support */}
                                      <div
                                        onWheel={(e) => {
                                          if (e.deltaY !== 0) {
                                            e.currentTarget.scrollLeft += e.deltaY
                                          }
                                        }}
                                        className="pills-scroll-track flex items-center gap-1.5 overflow-x-auto pb-1 scroll-smooth no-scrollbar scrollbar-none w-full min-w-0"
                                      >
                                        {[
                                          { label: "🌍 All", value: "ALL" },
                                          { label: "⚓ Ports", value: "PORTS" },
                                          { label: "🇮🇳 India", value: "India" },
                                          { label: "🇦🇪 UAE / Dubai", value: "UAE" },
                                          { label: "🇴🇲 Oman", value: "Oman" },
                                          { label: "🇮🇷 Iran", value: "Iran" },
                                          { label: "🇦🇫 Afghanistan", value: "Afghanistan" },
                                          { label: "🇨🇮 Ivory Coast / Africa", value: "AFRICA" },
                                          { label: "🇺🇿 Uzbekistan", value: "Uzbekistan" },
                                          { label: "🇵🇰 Pakistan", value: "Pakistan" },
                                          { label: "🇸🇦 Gulf", value: "GULF" },
                                          { label: "🇹🇷 Turkey", value: "Turkey" },
                                          { label: "🇨🇳 China", value: "China" },
                                          { label: "🇪🇺 Europe / US", value: "EUROPE_AMERICAS" },
                                          { label: "🌐 Central Asia", value: "CENTRAL_ASIA" },
                                        ].map((tab) => (
                                          <button
                                            key={tab.value}
                                            type="button"
                                            onClick={() => {
                                              setSelectedCountryFilter(tab.value)
                                              setFilterByRouteInput(false)
                                              setRouteLocationSearch("")
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                                              selectedCountryFilter === tab.value
                                                ? "bg-amber-600 text-white shadow-xs ring-1 ring-amber-400"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            {tab.label}
                                          </button>
                                        ))}
                                      </div>

                                      {/* Scroll Right Button */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          const container = e.currentTarget.parentElement?.querySelector('.pills-scroll-track') as HTMLDivElement | null
                                          if (container) container.scrollBy({ left: 140, behavior: 'smooth' })
                                        }}
                                        className="hidden sm:flex shrink-0 items-center justify-center h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-900 transition ml-1 cursor-pointer"
                                        title="Scroll filter chips right"
                                        aria-label="Scroll right"
                                      >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    {/* Secondary category filter for India inside popover */}
                                    {selectedCountryFilter === "India" && (
                                      <div
                                        onWheel={(e) => {
                                          if (e.deltaY !== 0) {
                                            e.currentTarget.scrollLeft += e.deltaY
                                          }
                                        }}
                                        className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-amber-200/80 bg-amber-50/60 dark:bg-slate-800/60 p-1.5 rounded-xl no-scrollbar scrollbar-none"
                                      >
                                        <span className="text-[9px] font-black text-amber-950 dark:text-amber-200 self-center mr-1 shrink-0">🇮🇳 Filter:</span>
                                        {[
                                          { label: "ALL", value: "ALL" },
                                          { label: "✈️ AIRPORTS", value: "AIRPORTS" },
                                          { label: "⚓ SEAPORTS", value: "SEAPORTS" },
                                          { label: "🚚 LAND PORTS", value: "LAND_PORTS" },
                                          { label: "📦 ICD", value: "ICD" },
                                          { label: "🏢 CFS", value: "CFS" },
                                          { label: "🚢 TERMINALS", value: "TERMINALS" },
                                          { label: "🌐 LOGISTICS", value: "LOGISTICS" },
                                        ].map((cat) => (
                                          <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setSelectedIndiaCategoryFilter(cat.value)}
                                            className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shrink-0 whitespace-nowrap ${
                                              selectedIndiaCategoryFilter === cat.value
                                                ? "bg-amber-600 text-white shadow-xs"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            {cat.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Secondary category filter for Iran inside popover */}
                                    {selectedCountryFilter === "Iran" && (
                                      <div
                                        onWheel={(e) => {
                                          if (e.deltaY !== 0) {
                                            e.currentTarget.scrollLeft += e.deltaY
                                          }
                                        }}
                                        className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-amber-200/80 bg-amber-50/60 dark:bg-slate-800/60 p-1.5 rounded-xl no-scrollbar scrollbar-none"
                                      >
                                        <span className="text-[9px] font-black text-amber-950 dark:text-amber-200 self-center mr-1 shrink-0">🇮🇷 Filter:</span>
                                        {[
                                          { label: "ALL", value: "ALL" },
                                          { label: "⚓ SEAPORTS", value: "SEAPORTS" },
                                          { label: "🛂 BORDERS", value: "BORDERS" },
                                          { label: "✈️ AIRPORTS", value: "AIRPORTS" },
                                        ].map((cat) => (
                                          <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setSelectedIranCategoryFilter(cat.value)}
                                            className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer shrink-0 whitespace-nowrap ${
                                              selectedIranCategoryFilter === cat.value
                                                ? "bg-amber-600 text-white shadow-xs"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            {cat.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Scrollable Location Match Cards — Responsive Grid with Minimum Card Width */}
                                  <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 sm:p-4 pt-2.5">
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-2.5">
                                      {quickLocationMatches.map((loc, locIndex) => (
                                        <div
                                          key={`quick-loc-popover-${loc.name}-${loc.code || locIndex}-${locIndex}`}
                                          className="flex flex-col justify-between rounded-xl p-3 text-left transition bg-white hover:bg-amber-50/70 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/90 hover:border-amber-400 dark:border-slate-700/80 dark:hover:border-amber-400 group shadow-xs hover:shadow-md min-w-0"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleQuickLocationSelect(loc)
                                              setShowLocationDropdown(null)
                                            }}
                                            className="flex flex-col items-start w-full cursor-pointer text-left gap-1.5 min-w-0"
                                          >
                                            {/* Card Top Row: Flag pill + Country / Tags + Code Pill */}
                                            <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                                <span className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold shrink-0 border border-slate-200/80 dark:border-slate-700 select-none">
                                                  {countryFlags[loc.country] || "📍"}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                  {loc.country || "Location"}
                                                </span>
                                                {loc.borderCountry && (
                                                  <span className="text-[8.5px] font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800 shrink-0">
                                                    ⇄ {loc.borderCountry}
                                                  </span>
                                                )}
                                                {loc.locationType && (
                                                  <span className="text-[8.5px] font-black text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 px-1.5 py-0.5 rounded shrink-0">
                                                    {loc.locationType.replace(/_/g, " ")}
                                                  </span>
                                                )}
                                              </div>

                                              {loc.code && (
                                                <span className="rounded-md bg-amber-100 dark:bg-amber-950/70 border border-amber-300/80 dark:border-amber-800 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:text-amber-200 shrink-0">
                                                  {loc.code}
                                                </span>
                                              )}
                                              {loc.unLocode && loc.unLocode !== loc.code && (
                                                <span className="rounded-md bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-900 dark:text-blue-200 shrink-0">
                                                  {loc.unLocode}
                                                </span>
                                              )}
                                            </div>

                                            {/* Location Names: English + Persian (Full Width, break-normal so words never split character-by-character) */}
                                            <div className="w-full min-w-0 pt-0.5">
                                              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-950 dark:group-hover:text-amber-200 leading-snug break-normal">
                                                {loc.name}
                                              </p>
                                              {loc.persian && (
                                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 font-[vazirmatn] leading-snug break-normal mt-0.5 text-right w-full" dir="rtl">
                                                  {loc.persian}
                                                </p>
                                              )}
                                              {(() => {
                                                const pDetails = detectPortDetails({ location: loc.name, locationPersian: loc.persian, code: loc.code, unLocode: loc.unLocode })
                                                if (!pDetails) return null
                                                return (
                                                  <div className="mt-1.5 p-1.5 rounded-lg bg-linear-to-r from-cyan-50/90 via-sky-50/60 to-emerald-50/50 dark:from-cyan-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 border border-cyan-200 dark:border-cyan-800 text-[8.5px] font-bold text-cyan-950 dark:text-cyan-200 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-1">
                                                      <span className="font-black text-cyan-800 dark:text-cyan-300">⚓ {pDetails.category}</span>
                                                      {pDetails.unLocode && (
                                                        <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-1 py-0.2 rounded font-mono font-black">
                                                          {pDetails.unLocode}
                                                        </span>
                                                      )}
                                                      {pDetails.customsCode && (
                                                        <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-1 py-0.2 rounded font-mono font-black">
                                                          Customs: {pDetails.customsCode}
                                                        </span>
                                                      )}
                                                      {pDetails.railConnected && (
                                                        <span className="bg-purple-100 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-1 py-0.2 rounded">
                                                          🚆 DFC Rail
                                                        </span>
                                                      )}
                                                    </div>
                                                    {pDetails.terminals && (
                                                      <div className="text-[8px] text-slate-600 dark:text-slate-300 font-medium truncate">
                                                        🚢 {pDetails.terminals}
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })()}
                                            </div>
                                          </button>

                                          {/* Action Toolbar on Card */}
                                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleQuickLocationSelect(loc)
                                                setShowLocationDropdown(null)
                                              }}
                                              className="text-[9.5px] font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg px-2.5 py-1 transition cursor-pointer shadow-2xs"
                                            >
                                              + Stop #{index + 1}
                                            </button>
                                            {loc.isPort && (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => handleQuickSetDischarge(loc.portName || loc.name)}
                                                  className="text-[9.5px] font-extrabold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 rounded-lg px-2 py-1 transition cursor-pointer border border-indigo-200/60 dark:border-indigo-800 active:scale-95"
                                                  title="Set as Port of Discharge (POD)"
                                                >
                                                  🚢 POD
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleQuickSetLoading(loc.portName || loc.name)}
                                                  className="text-[9.5px] font-extrabold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-600 rounded-lg px-2 py-1 transition cursor-pointer border border-blue-200/60 dark:border-blue-800 active:scale-95"
                                                  title="Set as Port of Loading (POL)"
                                                >
                                                  ⚓ POL
                                                </button>
                                              </>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleQuickSetDelivery(loc.country === "Ivory Coast" ? "Ivory Coast, West Africa" : loc.name)}
                                              className="text-[9.5px] font-extrabold bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 rounded-lg px-2 py-1 transition cursor-pointer border border-emerald-200/60 dark:border-emerald-800 active:scale-95 ml-auto"
                                              title="Set as Final Place of Delivery"
                                            >
                                              📍 Delivery
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {quickLocationMatches.length === 0 && (
                                        <div className="col-span-full p-5 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-2xs">
                                          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400">
                                            <MapPinOff className="h-6 w-6 text-amber-500/80 mb-0.5" />
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                              No predefined locations found
                                            </p>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-sm">
                                              {quickLocationQuery
                                                ? `No catalog match for "${quickLocationQuery}". You can keep your custom entry or reset filters.`
                                                : "No locations match the selected country or transport mode filters."}
                                            </p>
                                          </div>
                                          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                                            {(routeLocationSearch || filterByRouteInput || selectedCountryFilter !== "ALL" || disableModeFilter) && (
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setRouteLocationSearch("")
                                                  setFilterByRouteInput(false)
                                                  setSelectedCountryFilter("ALL")
                                                  setDisableModeFilter(true)
                                                }}
                                                className="h-7.5 px-3 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-50 cursor-pointer shadow-2xs"
                                              >
                                                🌐 Show All Locations
                                              </Button>
                                            )}
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => setShowLocationDropdown(null)}
                                              className="h-7.5 px-3 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
                                            >
                                              ✓ Keep Custom Entry &amp; Close
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                        {/* Seaport & Terminal Information Banner (Nhava Sheva, Mundra, Kandla, etc.) */}
                        {(() => {
                          const portInfo = detectPortDetails(route)
                          if (!portInfo) return null
                          return (
                            <div className="port-details-banner rounded-xl border border-cyan-200 dark:border-cyan-800 bg-linear-to-r from-cyan-50/90 via-sky-50/60 to-emerald-50/50 dark:from-cyan-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 p-2.5 sm:p-3 shadow-2xs space-y-1.5 animate-in fade-in duration-150">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="flex items-center justify-center h-5 w-5 rounded-md bg-cyan-600 text-white text-[10px] font-black shrink-0">
                                    ⚓
                                  </span>
                                  <span className="text-xs font-black text-cyan-950 dark:text-cyan-200 truncate">
                                    {portInfo.title}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-[vazirmatn] truncate" dir="rtl">
                                    {portInfo.titleFa}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 text-[9px] font-black font-mono">
                                    UN/LOCODE: {portInfo.unLocode}
                                  </span>
                                  {portInfo.customsCode && (
                                    <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 text-[9px] font-black font-mono">
                                      Customs: {portInfo.customsCode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Port metadata badges */}
                              <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                                <span className="rounded-md bg-cyan-100/90 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-200 px-1.5 py-0.5 font-extrabold">
                                  {portInfo.category}
                                </span>
                                <span className="rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 font-medium">
                                  📍 {portInfo.stateCountry}
                                </span>
                                {portInfo.terminals && (
                                  <span className="rounded-md bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 font-bold truncate max-w-full">
                                    🚢 Terminals: {portInfo.terminals}
                                  </span>
                                )}
                                {portInfo.railConnected && (
                                  <span className="rounded-md bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 px-1.5 py-0.5 font-bold">
                                    🚆 Rail / DFC Connected
                                  </span>
                                )}
                              </div>

                              {/* Quick helper buttons */}
                              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-cyan-200/50 dark:border-slate-800">
                                {portInfo.terminalPresets && (
                                  <>
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mr-1">Quick Terminal:</span>
                                    {portInfo.terminalPresets.map((term) => (
                                      <button
                                        key={term}
                                        type="button"
                                        onClick={() => {
                                          handleRouteChange(index, "customsSealNote", term)
                                          toast.success(`Set terminal: ${term}`)
                                        }}
                                        className="rounded-md bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 px-1.5 py-0.5 text-[9px] font-extrabold text-cyan-950 dark:text-cyan-200 cursor-pointer transition shadow-2xs"
                                      >
                                        +{term}
                                      </button>
                                    ))}
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, port_of_discharge: portInfo.name }))
                                    toast.success(`Set Port of Discharge: ${portInfo.name}`)
                                  }}
                                  className="ml-auto rounded-md bg-cyan-700 hover:bg-cyan-800 text-white px-2 py-0.5 text-[9px] font-black cursor-pointer transition shadow-2xs"
                                >
                                  ⚓ Set as POD
                                </button>
                              </div>
                            </div>
                          )
                        })()}

                        {/* Transport Mode Selector (Full Width Horizontal Pills) */}
                        <div>
                          <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between h-5">
                            <span>Transport Mode / حالت حمل و نقل</span>
                            <span className="text-[9.5px] font-extrabold text-slate-400 uppercase">Select Mode</span>
                          </label>
                          
                          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {/* Option: Truck/Road */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRouteChange(index, "transportMode", "truck")
                                setDisableModeFilter(false)
                              }}
                              className={`flex items-center justify-center gap-1 sm:gap-1.5 h-10 rounded-xl border transition-all cursor-pointer px-1 sm:px-2 ${
                                route.transportMode === "truck" || route.transportMode === "road" || !route.transportMode
                                  ? "border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/25 font-black"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:bg-slate-50 font-bold"
                              }`}
                              title="Road / Truck Transport (حمل جاده‌ای با موتر)"
                            >
                              <Truck className={`h-4 w-4 shrink-0 ${route.transportMode === "truck" || route.transportMode === "road" || !route.transportMode ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                              <span className="text-[11px] font-black uppercase">Truck</span>
                            </button>

                            {/* Option: Vessel/Sea */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRouteChange(index, "transportMode", "vessel")
                                setDisableModeFilter(false)
                              }}
                              className={`flex items-center justify-center gap-1 sm:gap-1.5 h-10 rounded-xl border transition-all cursor-pointer px-1 sm:px-2 ${
                                route.transportMode === "vessel"
                                  ? "border-cyan-500 bg-cyan-50/90 dark:bg-cyan-950/60 text-cyan-950 dark:text-cyan-200 shadow-xs ring-2 ring-cyan-500/25 font-black"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-cyan-300 hover:bg-slate-50 font-bold"
                              }`}
                              title="Maritime / Sea Vessel (حمل دریایی با کشتی)"
                            >
                              <Ship className={`h-4 w-4 shrink-0 ${route.transportMode === "vessel" ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`} />
                              <span className="text-[11px] font-black uppercase">Sea</span>
                            </button>

                            {/* Option: Plane/Air */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRouteChange(index, "transportMode", "airplane")
                                setDisableModeFilter(false)
                              }}
                              className={`flex items-center justify-center gap-1 sm:gap-1.5 h-10 rounded-xl border transition-all cursor-pointer px-1 sm:px-2 ${
                                route.transportMode === "airplane"
                                  ? "border-sky-500 bg-sky-50/90 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 shadow-xs ring-2 ring-sky-500/25 font-black"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-sky-300 hover:bg-slate-50 font-bold"
                              }`}
                              title="Air Freight / Flight (حمل هوایی با طیاره)"
                            >
                              <Plane className={`h-4 w-4 shrink-0 ${route.transportMode === "airplane" ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}`} />
                              <span className="text-[11px] font-black uppercase">Air</span>
                            </button>

                            {/* Option: Train/Rail */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRouteChange(index, "transportMode", "train")
                                setDisableModeFilter(false)
                              }}
                              className={`flex items-center justify-center gap-1 sm:gap-1.5 h-10 rounded-xl border transition-all cursor-pointer px-1 sm:px-2 ${
                                route.transportMode === "train"
                                  ? "border-purple-500 bg-purple-50/90 dark:bg-purple-950/60 text-purple-950 dark:text-purple-200 shadow-xs ring-2 ring-purple-500/25 font-black"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-purple-300 hover:bg-slate-50 font-bold"
                              }`}
                              title="Rail / Train Transport (حمل ریلی با قطار)"
                            >
                              <Train className={`h-4 w-4 shrink-0 ${route.transportMode === "train" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                              <span className="text-[11px] font-black uppercase">Rail</span>
                            </button>
                          </div>
                        </div>
                      </div>

                        {/* Dedicated Specifications Panel based on Transport Mode */}
                        {(route.transportMode === "truck" || route.transportMode === "road" || !route.transportMode) && (
                          <div className="mt-3 rounded-2xl border border-blue-100 dark:border-slate-800 bg-linear-to-br from-blue-50/70 via-indigo-50/30 to-amber-50/30 dark:from-slate-900/90 dark:via-slate-850 dark:to-slate-900 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-blue-200/60 dark:border-slate-800 pb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
                                  <Truck className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wider text-blue-950 dark:text-blue-200 truncate">
                                  Truck Specifications &amp; Customs Seal
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 font-[vazirmatn] shrink-0" dir="rtl">
                                مشخصات موټر، شاسی و ډریور
                              </span>
                            </div>

                            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                              {/* Plate Number */}
                              <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                                  Plate No. / پلیټ نمبر
                                </label>
                                <Input
                                  value={route.plateNumber || ""}
                                  onChange={(e) => handleRouteChange(index, "plateNumber", e.target.value)}
                                  placeholder="مثلا: KBL-7842"
                                  className="h-9.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-xs focus:border-amber-400 focus:ring-amber-200"
                                />
                              </div>

                              {/* Chassis Number */}
                              <div>
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                                  Chassis No. / شاسی نمبر
                                </label>
                                <Input
                                  value={route.chassisNumber || ""}
                                  onChange={(e) => handleRouteChange(index, "chassisNumber", e.target.value)}
                                  placeholder="CH-908712"
                                  className="h-9.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-xs focus:border-amber-400 focus:ring-amber-200"
                                />
                              </div>

                              {/* Driver / Trailer Man (Spans 2 columns on sm) */}
                              <div className="sm:col-span-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1 font-[vazirmatn]">
                                  Trailer Man / Driver (ټیلر مان / ډریور)
                                </label>
                                <Input
                                  value={route.trailerMan || ""}
                                  onChange={(e) => handleRouteChange(index, "trailerMan", e.target.value)}
                                  placeholder="نام دریور / ټیلر مان (Driver Full Name)"
                                  className="h-9.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 text-xs font-[vazirmatn] focus:border-amber-400 focus:ring-amber-200"
                                />
                              </div>
                            </div>

                            {/* Customs Seal Requirement */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-blue-200/50 dark:border-slate-800">
                              <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                                <input
                                  type="checkbox"
                                  checked={Boolean(route.customsSealRequired)}
                                  onChange={(e) => handleRouteChange(index, "customsSealRequired", e.target.checked)}
                                  className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-400 cursor-pointer"
                                />
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-[vazirmatn] flex items-center gap-1.5" dir="rtl">
                                  <span>📍 په ګمرک کې سیل غواړي</span>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-sans direction-ltr">
                                    (Customs Seal Required)
                                  </span>
                                </span>
                              </label>
                              {route.customsSealRequired && (
                                <Input
                                  value={route.customsSealNote || ""}
                                  onChange={(e) => handleRouteChange(index, "customsSealNote", e.target.value)}
                                  placeholder="Customs seal details / جزئیات سیل ګمرک"
                                  className="h-8.5 w-full sm:w-64 rounded-lg border-amber-400 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 font-[vazirmatn] focus:border-amber-500"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sea / Vessel Mode Panel */}
                        {route.transportMode === "vessel" && (
                          <div className="mt-3.5 rounded-2xl border border-cyan-100 bg-linear-to-br from-cyan-50/70 via-blue-50/30 to-slate-50/30 p-3.5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-cyan-200/60 pb-2">
                              <div className="p-1.5 rounded-lg bg-cyan-600 text-white shadow-xs">
                                <Ship className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-cyan-950">
                                Sea Port &amp; Vessel Details / مشخصات کشتی و بندر بحری
                              </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Vessel Name / نام کشتی
                                </label>
                                <Input
                                  value={route.notes || ""}
                                  onChange={(e) => handleRouteChange(index, "notes", e.target.value)}
                                  placeholder="e.g. WAN HAI 512"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Port Terminal / ترمینل بندر
                                </label>
                                <Input
                                  value={route.customsSealNote || ""}
                                  onChange={(e) => handleRouteChange(index, "customsSealNote", e.target.value)}
                                  placeholder="Terminal 1 / Berthing Quay"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Container No. / کانتینر
                                </label>
                                <Input
                                  value={route.plateNumber || ""}
                                  onChange={(e) => handleRouteChange(index, "plateNumber", e.target.value)}
                                  placeholder="MSCU-1234567"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Air Cargo Panel */}
                        {route.transportMode === "airplane" && (
                          <div className="mt-3.5 rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50/70 via-blue-50/30 to-slate-50/30 p-3.5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-sky-200/60 pb-2">
                              <div className="p-1.5 rounded-lg bg-sky-600 text-white shadow-xs">
                                <Plane className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-sky-950">
                                Air Freight &amp; Flight Information / پرواز و بارنامه هوایی
                              </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Flight No. / شماره پرواز
                                </label>
                                <Input
                                  value={route.notes || ""}
                                  onChange={(e) => handleRouteChange(index, "notes", e.target.value)}
                                  placeholder="e.g. FG-311 / EK-205"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Air Waybill (AWB) / شماره AWB
                                </label>
                                <Input
                                  value={route.plateNumber || ""}
                                  onChange={(e) => handleRouteChange(index, "plateNumber", e.target.value)}
                                  placeholder="AWB-9087612"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Rail Freight Panel */}
                        {route.transportMode === "train" && (
                          <div className="mt-3.5 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 via-orange-50/30 to-slate-50/30 p-3.5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                              <div className="p-1.5 rounded-lg bg-amber-600 text-white shadow-xs">
                                <Train className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                                Railway Freight Information / معلومات خط آهن و واگن
                              </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Wagon / Train No. / شماره واگن
                                </label>
                                <Input
                                  value={route.plateNumber || ""}
                                  onChange={(e) => handleRouteChange(index, "plateNumber", e.target.value)}
                                  placeholder="WGN-54210"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                                  Railway Station / ایستگاه ریل
                                </label>
                                <Input
                                  value={route.notes || ""}
                                  onChange={(e) => handleRouteChange(index, "notes", e.target.value)}
                                  placeholder="Hairatan Railway Terminal"
                                  className="h-9.5 rounded-xl border-slate-200 bg-white font-bold text-slate-900 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Quick Select Locations Bar with Live Search */}
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="flex flex-col gap-3 mb-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-1 bg-amber-500 rounded-full inline-block" />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Quick Location Selector
                          </span>
                          <span className="text-slate-300 font-light">|</span>
                          <span className="text-xs font-bold text-slate-600 font-[vazirmatn]" dir="rtl">
                            انتخاب سریع محل
                          </span>
                        </div>
                        {activeRouteIndex !== null && (
                          <p className="text-[11px] font-bold text-amber-800 pl-3">
                            Targeting: <span className="font-black text-blue-950">{getRouteStopLabel(activeRouteIndex, formData.routes.length)} (Stop #{activeRouteIndex + 1})</span>
                          </p>
                        )}
                      </div>

                      {/* Live Search Input with Search Icon & Clear Button */}
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <Input
                          value={routeLocationSearch}
                          onChange={(e) => setRouteLocationSearch(e.target.value)}
                          placeholder="Search city, port, code, or country..."
                          className="h-8.5 text-xs rounded-xl bg-white border-slate-200/90 pl-8 pr-7 font-medium shadow-2xs focus-visible:ring-amber-400 focus-visible:border-amber-400"
                        />
                        {routeLocationSearch && (
                          <button
                            type="button"
                            onClick={() => setRouteLocationSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Regional Country Tabs — Uniform Height, Single-Line, Smooth Horizontal Scroll */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                      {[
                        { label: "ALL", country: "ALL" },
                        { label: "⚓ ALL SEAPORTS", country: "PORTS" },
                        { label: "🇦🇪 DUBAI & UAE PORTS", country: "UAE" },
                        { label: "🇴🇲 OMAN PORTS", country: "Oman" },
                        { label: "🇮🇷 IRAN PORTS", country: "Iran" },
                        { label: "🇨🇮 IVORY COAST & AFRICA", country: "AFRICA" },
                        { label: "🇦🇫 AFGHANISTAN", country: "Afghanistan" },
                        { label: "🇺🇿 UZBEKISTAN", country: "Uzbekistan" },
                        { label: "🇮🇳 INDIA", country: "India" },
                        { label: "🇵🇰 PAKISTAN", country: "Pakistan" },
                        { label: "🇸🇦 🇶🇦 GULF STATES", country: "GULF" },
                        { label: "🇹🇷 TURKEY", country: "Turkey" },
                        { label: "🇨🇳 CHINA & ASIA", country: "China" },
                        { label: "🇪🇺 EUROPE & AMERICAS", country: "EUROPE_AMERICAS" },
                        { label: "🌐 CENTRAL ASIA", country: "CENTRAL_ASIA" },
                      ].map((tab) => (
                        <button
                          key={tab.country}
                          type="button"
                          onClick={() => {
                            setSelectedCountryFilter(tab.country)
                            setFilterByRouteInput(false)
                            setRouteLocationSearch("")
                          }}
                          className={`h-8 shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer select-none ${
                            selectedCountryFilter === tab.country
                              ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-300 font-black"
                              : "bg-slate-100/90 text-slate-700 hover:bg-amber-100/80 hover:text-amber-950 border border-slate-200/70"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Secondary Category Filter Pill Bar for INDIA */}
                    {selectedCountryFilter === "India" && (
                      <div className="flex items-center gap-1.5 overflow-x-auto p-2 rounded-2xl bg-linear-to-r from-amber-50/90 via-orange-50/50 to-white border border-amber-200/80 shadow-2xs pb-2 scrollbar-thin scrollbar-thumb-amber-200">
                        <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <span>🇮🇳</span>
                          <span>India Category:</span>
                        </span>
                        {[
                          { label: "ALL", value: "ALL" },
                          { label: "✈️ AIRPORTS", value: "AIRPORTS" },
                          { label: "⚓ SEAPORTS", value: "SEAPORTS" },
                          { label: "🚚 LAND PORTS", value: "LAND_PORTS" },
                          { label: "📦 ICD", value: "ICD" },
                          { label: "🏢 CFS", value: "CFS" },
                          { label: "🚢 TERMINALS", value: "TERMINALS" },
                          { label: "🌐 LOGISTICS", value: "LOGISTICS" },
                        ].map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedIndiaCategoryFilter(cat.value)}
                            className={`h-7 shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 rounded-lg text-[10px] font-black transition-all cursor-pointer select-none ${
                              selectedIndiaCategoryFilter === cat.value
                                ? "bg-amber-600 text-white shadow-xs ring-1 ring-amber-300"
                                : "bg-white text-slate-700 hover:bg-amber-100 hover:text-amber-900 border border-slate-200"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Secondary Category Filter Pill Bar for IRAN */}
                    {selectedCountryFilter === "Iran" && (
                      <div className="flex items-center gap-1.5 overflow-x-auto p-2 rounded-2xl bg-linear-to-r from-amber-50/90 via-orange-50/50 to-white border border-amber-200/80 shadow-2xs pb-2 scrollbar-thin scrollbar-thumb-amber-200">
                        <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <span>🇮🇷</span>
                          <span>Iran Category:</span>
                        </span>
                        {[
                          { label: "ALL", value: "ALL" },
                          { label: "⚓ SEAPORTS", value: "SEAPORTS" },
                          { label: "🛂 BORDERS", value: "BORDERS" },
                          { label: "✈️ AIRPORTS", value: "AIRPORTS" },
                        ].map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedIranCategoryFilter(cat.value)}
                            className={`h-7 shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 rounded-lg text-[10px] font-black transition-all cursor-pointer select-none ${
                              selectedIranCategoryFilter === cat.value
                                ? "bg-amber-600 text-white shadow-xs ring-1 ring-amber-300"
                                : "bg-white text-slate-700 hover:bg-amber-100 hover:text-amber-900 border border-slate-200"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Responsive Location Cards Grid with Full Visibility & Polished Alignment */}
                  <div className="grid max-h-[480px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 overflow-y-auto p-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
                    {quickLocationMatches.map((loc, locIndex) => (
                      <div
                        key={`quick-loc-catalog-${loc.name}-${loc.code || locIndex}-${locIndex}`}
                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 transition-all hover:border-amber-400 hover:bg-amber-50/25 hover:shadow-md shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleQuickLocationSelect(loc)}
                          className="flex flex-col items-start w-full text-left cursor-pointer"
                          title={`Add to Route Stop: ${loc.name}${loc.borderCountry ? ` (Border: ${loc.borderCountry})` : ""}`}
                        >
                          {/* Top Row: Type/Flag Icon Badge + Country Tag + Code Pill */}
                          <div className="flex items-center justify-between gap-2 w-full min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-black shrink-0 select-none">
                                {loc.isPort ? "⚓" : (countryFlags[loc.country] || "📍")}
                              </span>
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                                {loc.country}
                              </span>
                            </div>
                            {loc.code && (
                              <span className="text-[9.5px] font-black font-mono bg-amber-100 text-amber-900 border border-amber-300/70 rounded-md px-1.5 py-0.5 shrink-0">
                                {loc.code}
                              </span>
                            )}
                          </div>

                          {/* Location Names: English + Persian with Symmetrical Alignment */}
                          <div className="w-full min-w-0 mt-2 space-y-0.5">
                            <p className="font-black text-slate-900 text-xs sm:text-[13px] leading-snug break-normal group-hover:text-amber-950 transition-colors">
                              {loc.name}
                            </p>
                            <p className="text-slate-600 font-[vazirmatn] text-[11px] font-bold leading-snug text-right w-full mt-0.5" dir="rtl">
                              {loc.persian}
                            </p>
                          </div>

                          {/* Metadata Tags Row (Border Country, Location Type, State) */}
                          {(loc.borderCountry || loc.locationType || loc.state) && (
                            <div className="flex flex-wrap items-center gap-1 w-full mt-2">
                              {loc.borderCountry && (
                                <span className="text-[8.5px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 shrink-0">
                                  ⇄ {loc.borderCountry}
                                </span>
                              )}
                              {loc.locationType && (
                                <span className="text-[8.5px] font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded shrink-0">
                                  {loc.locationType.replace(/_/g, " ")}
                                </span>
                              )}
                              {loc.state && (
                                <span className="text-[8.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                  {loc.state}
                                </span>
                              )}
                            </div>
                          )}
                        </button>

                        {/* Quick 1-Click Set Actions Toolbar */}
                        <div className="mt-3 pt-2 border-t border-slate-100/90 grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => handleQuickLocationSelect(loc)}
                            className="flex-1 text-[9.5px] font-black bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-lg py-1 px-1.5 transition-all cursor-pointer text-center whitespace-nowrap shadow-2xs active:scale-95 border border-slate-200/60"
                            title="Add to Route Stops"
                          >
                            + Route
                          </button>
                          {loc.isPort && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickSetDischarge(loc.portName || loc.name)}
                                className="flex-1 text-[9.5px] font-black bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-lg py-1 px-1.5 transition-all cursor-pointer text-center whitespace-nowrap border border-indigo-200/60 active:scale-95"
                                title="Set as Port of Discharge (بندر تخلیه)"
                              >
                                🚢 POD
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickSetLoading(loc.portName || loc.name)}
                                className="flex-1 text-[9.5px] font-black bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg py-1 px-1.5 transition-all cursor-pointer text-center whitespace-nowrap border border-blue-200/60 active:scale-95"
                                title="Set as Port of Loading (بندر بارگیری)"
                              >
                                ⚓ POL
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleQuickSetDelivery(loc.country === "Ivory Coast" ? "Ivory Coast, West Africa" : loc.name)}
                            className="flex-1 text-[9.5px] font-black bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-lg py-1 px-1.5 transition-all cursor-pointer text-center whitespace-nowrap border border-emerald-200/60 active:scale-95"
                            title="Set as Place of Delivery (محل تحویل)"
                          >
                            📍 Delivery
                          </button>
                        </div>
                      </div>
                    ))}
                    {quickLocationMatches.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/50 backdrop-blur-md px-3 py-8 text-center text-xs font-bold text-slate-500">
                        No matching locations / نتیجه‌ای یافت نشد
                      </div>
                    )}
                  </div>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
              </div>

</div>

            {/* Logistics Quad dashboard: Freight, Remarks, Container & Shipping */}
            <div id="section-logistics-quad" className="edit-form-dashboard">

            {/* Freight Information */}
            <Card id="section-freight" className="bg-white/70 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_300px]">
              <CardHeader className="pb-4 border-b border-white/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100">Freight Information</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-[vazirmatn]">اطلاعات حمل</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-5 pb-6">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block">Freight Payable At / محل پرداخت کرایه</label>
                  <Input
                    name="freight_payable_at"
                    value={formData.freight_payable_at}
                    onChange={handleInputChange}
                    placeholder="Payment location"
                    className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block">Freight Terms / شرایط حمل</label>
                  <Input
                    name="freight_terms"
                    value={formData.freight_terms}
                    onChange={handleInputChange}
                    placeholder="e.g., Prepaid, Collect"
                    className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Remarks */}
            <Card id="section-remarks" className="bg-white/70 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_250px]">
              <CardHeader className="pb-4 border-b border-white/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-800/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100">Remarks</span>
                  </div>
                  <span className="text-sm font-normal text-blue-600/80 dark:text-blue-400 font-[vazirmatn]">توضیحات</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col pt-5 pb-6">
                <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block">Additional Notes / یادداشت‌های اضافی</label>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Additional notes or special instructions"
                  rows={3}
                  className="glass-input rounded-xl min-h-20 w-full flex-1 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                />
              </CardContent>
            </Card>

            {/* Container Details */}
            <Card id="section-container" className="bg-white/70 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_400px] flex flex-col">
              <CardHeader className="pb-4 border-b border-white/50 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100">Container Details</span>
                  </div>
                  <span className="text-sm font-normal text-blue-600/80 dark:text-blue-400 font-[vazirmatn]">جزئیات کانتینر</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 min-[1600px]:grid-cols-1 gap-3.5">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Container Type / نوع کانتینر</label>
                    <Select value={formData.container_type || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, container_type: value === "none" ? "" : value }))}>
                      <SelectTrigger className="h-11 glass-input rounded-xl text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        <SelectItem value="none">Select Type</SelectItem>
                        <SelectItem value="dry">Dry Container</SelectItem>
                        <SelectItem value="reefer">Refrigerated (Reefer)</SelectItem>
                        <SelectItem value="open_top">Open Top</SelectItem>
                        <SelectItem value="flat_rack">Flat Rack</SelectItem>
                        <SelectItem value="tank">Tank Container</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Container Size / اندازه کانتینر</label>
                    <Select value={formData.container_size || "none"} onValueChange={(value) => setFormData((prev) => ({ ...prev, container_size: value === "none" ? "" : value }))}>
                      <SelectTrigger className="h-11 glass-input rounded-xl text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700">
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        <SelectItem value="none">Select Size</SelectItem>
                        <SelectItem value="20ft">20 ft (TEU)</SelectItem>
                        <SelectItem value="40ft">40 ft (FEU)</SelectItem>
                        <SelectItem value="40ft_hc">40 ft High Cube</SelectItem>
                        <SelectItem value="45ft_hc">45 ft High Cube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Container No. / شماره کانتینر</label>
                    <Input
                      name="container_numbers"
                      value={formData.container_numbers}
                      onChange={handleInputChange}
                      placeholder="e.g., MSCU1234567"
                      className="h-11 glass-input rounded-xl font-mono text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Seal No. / شماره سیل</label>
                    <Input
                      name="seal_numbers"
                      value={formData.seal_numbers}
                      onChange={handleInputChange}
                      placeholder="e.g., SL12345"
                      className="h-11 glass-input rounded-xl font-mono text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700 uppercase"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Details */}
            <Card id="section-shipping" className="bg-white/70 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_400px]">
              <CardHeader className="pb-4 border-b border-white/50 dark:border-slate-800 bg-white/40 dark:bg-slate-800/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30">
                      <Ship className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100">Shipping Details</span>
                  </div>
                  <span className="text-sm font-normal text-blue-600/80 dark:text-blue-400 font-[vazirmatn]">جزئیات حمل</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* 1-Click Quick Port Presets */}
                <div className="rounded-2xl border border-cyan-100 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/30 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                      <span>⚓</span> Quick Port & Location Presets / انتخاب سریع بندر و کشور:
                    </span>
                    <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 font-[vazirmatn]" dir="rtl">
                      یک کلیک برای پر کردن بنادر
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          port_of_discharge: "Abidjan Port",
                          place_of_delivery: "Ivory Coast, West Africa",
                        }))
                        toast.success("Set POD: Abidjan Port & Delivery: Ivory Coast, West Africa")
                      }}
                      className="rounded-xl border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-900 dark:text-slate-100 shadow-2xs hover:bg-cyan-600 dark:hover:bg-cyan-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇨🇮</span>
                      <span>Abidjan Port & Ivory Coast</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Jebel Ali Port (Mina Jebel Ali)" }))
                        toast.success("Set POL: Jebel Ali Port (Dubai)")
                      }}
                      className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-cyan-900 dark:text-cyan-300 shadow-2xs hover:bg-cyan-600 dark:hover:bg-cyan-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Jebel Ali Port (Dubai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Port Rashid (Mina Rashid)" }))
                        toast.success("Set POL: Port Rashid (Dubai)")
                      }}
                      className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-cyan-900 dark:text-cyan-300 shadow-2xs hover:bg-cyan-600 dark:hover:bg-cyan-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Port Rashid (Dubai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Al Hamriya Port (Dubai)" }))
                        toast.success("Set POL: Al Hamriya Port (Dubai)")
                      }}
                      className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-cyan-900 dark:text-cyan-300 shadow-2xs hover:bg-cyan-600 dark:hover:bg-cyan-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Al Hamriya Port (Dubai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Dubai Creek (Deira Wharfage)" }))
                        toast.success("Set POL: Dubai Creek (Deira)")
                      }}
                      className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-cyan-900 dark:text-cyan-300 shadow-2xs hover:bg-cyan-600 dark:hover:bg-cyan-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Dubai Creek (Deira)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Port of Fujairah" }))
                        toast.success("Set POL: Port of Fujairah")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Fujairah Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Khalifa Port (Abu Dhabi)" }))
                        toast.success("Set POL: Khalifa Port (Abu Dhabi)")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Khalifa Port (Abu Dhabi)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Bandar Abbas (Shahid Rajaee)" }))
                        toast.success("Set POL: Bandar Abbas")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Bandar Abbas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Chabahar Port (Shahid Beheshti)" }))
                        toast.success("Set POL: Chabahar Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Chabahar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Bandar Imam Khomeini (BIK)" }))
                        toast.success("Set POL: Bandar Imam Khomeini (BIK)")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Bandar Imam Khomeini</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Bushehr Port" }))
                        toast.success("Set POL: Bushehr Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Bushehr Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Khorramshahr Port" }))
                        toast.success("Set POL: Khorramshahr Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Khorramshahr</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Bandar Anzali" }))
                        toast.success("Set POL: Bandar Anzali")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Bandar Anzali</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Jask Port (Bandar Jask)" }))
                        toast.success("Set POL: Jask Port (Iran)")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇷</span>
                      <span>Jask Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Sohar Port" }))
                        toast.success("Set POD: Sohar Port (Oman)")
                      }}
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-2xs hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇴🇲</span>
                      <span>Sohar Port (Oman)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port of Suwaiq" }))
                        toast.success("Set POD: Port of Suwaiq (Oman)")
                      }}
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-2xs hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇴🇲</span>
                      <span>Suwaiq Port (Oman)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port of Salalah" }))
                        toast.success("Set POD: Port of Salalah (Oman)")
                      }}
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-2xs hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇴🇲</span>
                      <span>Salalah Port (Oman)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port of Duqm" }))
                        toast.success("Set POD: Port of Duqm (Oman)")
                      }}
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-2xs hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇴🇲</span>
                      <span>Duqm Port (Oman)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port Sultan Qaboos" }))
                        toast.success("Set POD: Port Sultan Qaboos (Muscat)")
                      }}
                      className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-2xs hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇴🇲</span>
                      <span>Muscat (Sultan Qaboos)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Jebel Ali Port, Dubai", port_of_discharge: prev.port_of_discharge || "Abidjan Port" }))
                        toast.success("Set POL: Jebel Ali, Dubai")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇦🇪</span>
                      <span>Jebel Ali / Dubai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Nhava Sheva Port (JNPT), Mumbai, India" }))
                        toast.success("Set POD: Nhava Sheva (JNPT)")
                      }}
                      className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-indigo-900 dark:text-indigo-300 shadow-2xs hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇳</span>
                      <span>POD: Nhava Sheva (JNPT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Mundra Port, Gujarat, India" }))
                        toast.success("Set POD: Mundra Port")
                      }}
                      className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-indigo-900 dark:text-indigo-300 shadow-2xs hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇳</span>
                      <span>POD: Mundra Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Nhava Sheva (JNPT), Mumbai" }))
                        toast.success("Set POL: Nhava Sheva (JNPT)")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇳</span>
                      <span>Nhava Sheva (Mumbai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Mundra Port, Gujarat" }))
                        toast.success("Set POL: Mundra Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇮🇳</span>
                      <span>Mundra Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Karachi Port (KPT)" }))
                        toast.success("Set POL: Karachi Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇵🇰</span>
                      <span>Karachi Port</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port of Rotterdam" }))
                        toast.success("Set POD: Port of Rotterdam")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇳🇱</span>
                      <span>Rotterdam</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Port of Hamburg" }))
                        toast.success("Set POD: Port of Hamburg")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇩🇪</span>
                      <span>Hamburg</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Shanghai Port (Yangshan)" }))
                        toast.success("Set POL: Shanghai Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇨🇳</span>
                      <span>Shanghai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_loading: "Port of Singapore" }))
                        toast.success("Set POL: Port of Singapore")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇸🇬</span>
                      <span>Singapore</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Lagos Port / Apapa" }))
                        toast.success("Set POD: Lagos Port / Apapa")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇳🇬</span>
                      <span>Lagos (Apapa)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Durban Port" }))
                        toast.success("Set POD: Durban Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇿🇦</span>
                      <span>Durban</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, port_of_discharge: "Mombasa Port" }))
                        toast.success("Set POD: Mombasa Port")
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>🇰🇪</span>
                      <span>Mombasa</span>
                    </button>
                  </div>
                </div>

                <div className="shipping-fields-grid">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Vessel / کشتی</label>
                    <Input
                      name="vessel_name"
                      value={formData.vessel_name}
                      onChange={handleInputChange}
                      placeholder="e.g. MSC AURELIA"
                      className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Voyage No. / سفر</label>
                    <Input
                      name="voyage_number"
                      value={formData.voyage_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 2410E"
                      className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Port of Loading / بندر بارگیری</label>
                    <Input
                      name="port_of_loading"
                      list="world-seaports-list"
                      value={formData.port_of_loading}
                      onChange={handleInputChange}
                      placeholder="e.g. Bandar Abbas / Jebel Ali"
                      className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Port of Discharge / بندر تخلیه</label>
                    <Input
                      name="port_of_discharge"
                      list="world-seaports-list"
                      value={formData.port_of_discharge}
                      onChange={handleInputChange}
                      placeholder="e.g. Abidjan Port / Rotterdam"
                      className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                  <div className="full-width">
                    <label className="text-sm text-gray-600 dark:text-slate-300 mb-2 block font-medium">Place of Delivery / محل تحویل</label>
                    <Input
                      name="place_of_delivery"
                      list="world-places-list"
                      value={formData.place_of_delivery}
                      onChange={handleInputChange}
                      placeholder="e.g. Ivory Coast, West Africa / Europe"
                      className="glass-input rounded-xl h-11 text-slate-900 dark:text-slate-100 dark:bg-slate-950 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Datalists for global ports and locations autocomplete */}
                <datalist id="world-seaports-list">
                  {predefinedLocations
                    .filter((loc) => loc.isPort)
                    .map((loc, idx) => (
                      <option key={`port-${loc.name}-${loc.code || idx}-${idx}`} value={loc.portName || loc.name}>
                        {`${countryFlags[loc.country] || "⚓"} ${loc.name} (${loc.code})`}
                      </option>
                    ))}
                </datalist>

                <datalist id="world-places-list">
                  {predefinedLocations.map((loc, idx) => (
                    <option key={`place-${loc.name}-${loc.code || idx}-${idx}`} value={loc.name}>
                      {`${countryFlags[loc.country] || "📍"} ${loc.name} - ${loc.persian}`}
                    </option>
                  ))}
                </datalist>
              </CardContent>
            </Card>

            </div>

            {/* Afghanistan Documents */}
            <Card id="section-afghan" className="bg-white/70 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden [content-visibility:auto] [contain-intrinsic-size:1px_350px]">
              <CardHeader className="pb-3 bg-linear-to-r from-green-500/12 via-green-400/6 to-transparent dark:from-green-950/40 dark:via-green-900/20 dark:to-transparent border-b border-green-200/40 dark:border-green-800/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-linear-to-br from-green-600 to-green-700 shadow-lg shadow-green-500/25">
                      <ScrollText className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100">Afghanistan Documents</span>
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 rounded-full border dark:border-green-800/60">
                      {(formData.afghanistan_documents || []).length} selected
                    </span>
                  </div>
                  <span className="text-sm font-normal text-green-600/80 dark:text-green-400 font-[vazirmatn]">اسناد افغانستان</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                {/* Category Legend */}
                <div className="flex flex-wrap gap-2 p-3 bg-linear-to-br from-gray-50/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm rounded-xl border border-gray-100/50 dark:border-slate-700/60">
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">Categories:</span>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat], cIdx) => (
                    <span 
                      key={`doc-cat-legend-${key}-${cIdx}`} 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                        key === 'transport' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300' :
                        key === 'customs' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' :
                        key === 'commercial' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' :
                        key === 'health' ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300' :
                        key === 'insurance' ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300' :
                        key === 'driver' ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300' :
                        'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {cat.label}
                    </span>
                  ))}
                </div>

                {/* Required Documents Alert */}
                <div className="flex items-start gap-3 p-3 bg-linear-to-br from-amber-50/80 to-white/60 dark:from-amber-950/30 dark:to-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-200/50 dark:border-amber-800/40">
                  <div className="p-1.5 rounded-lg bg-amber-500 shadow-sm">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Required Documents</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Documents marked with <Sparkles className="h-3 w-3 inline text-amber-500" /> are typically required for Afghanistan transit
                    </p>
                  </div>
                </div>

                {/* Document Selection Grid - Grouped by Category */}
                <div className="space-y-4">
                  {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category], catIdx) => {
                    const categoryDocs = AFGHANISTAN_DOCUMENT_OPTIONS.filter(doc => doc.category === categoryKey)
                    if (categoryDocs.length === 0) return null
                    
                    const categoryColor = categoryKey === 'transport' ? 'blue' :
                      categoryKey === 'customs' ? 'amber' :
                      categoryKey === 'commercial' ? 'emerald' :
                      categoryKey === 'health' ? 'rose' :
                      categoryKey === 'insurance' ? 'purple' :
                      categoryKey === 'driver' ? 'cyan' : 'red'

                    return (
                      <div key={`doc-category-${categoryKey}-${catIdx}`} className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-${categoryColor}-100 dark:bg-${categoryColor}-950/80 text-${categoryColor}-700 dark:text-${categoryColor}-300`}>
                            {category.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400 font-[vazirmatn]">{category.labelPersian}</span>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categoryDocs.map((doc, docIdx) => {
                            const isSelected = (formData.afghanistan_documents || []).includes(doc.id)
                            const DocIcon = doc.icon === 'truck' ? Truck :
                              doc.icon === 'file-text' ? FileText :
                              doc.icon === 'receipt' ? Receipt :
                              doc.icon === 'list' ? List :
                              doc.icon === 'globe' ? Globe :
                              doc.icon === 'shield' ? Shield :
                              doc.icon === 'leaf' ? Leaf :
                              doc.icon === 'heart' ? Heart :
                              doc.icon === 'scale' ? Scale :
                              doc.icon === 'bookmark' ? Bookmark :
                              doc.icon === 'id-card' ? IdCard :
                              doc.icon === 'car' ? Car :
                              doc.icon === 'building' ? Building2 :
                              doc.icon === 'landmark' ? Landmark :
                              doc.icon === 'map-pin' ? MapPin :
                              doc.icon === 'user' ? User :
                              doc.icon === 'package' ? Package :
                              doc.icon === 'shield-check' ? ShieldCheck :
                              FileText
                            
                            return (
                              <button
                                key={`doc-opt-${doc.id || 'doc'}-${docIdx}`}
                                type="button"
                                onClick={() => toggleAfghanistanDocument(doc.id)}
                                className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 overflow-hidden ${
                                  isSelected
                                    ? `border-${categoryColor}-400 dark:border-${categoryColor}-500/70 bg-linear-to-br from-${categoryColor}-50/80 to-white/60 dark:from-${categoryColor}-950/40 dark:to-slate-900/80 ring-1 ring-${categoryColor}-200/50 dark:ring-${categoryColor}-800/50 shadow-md`
                                    : "border-gray-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm hover:border-gray-300 dark:hover:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-sm"
                                }`}
                              >
                                {/* Required badge */}
                                {doc.required && (
                                  <div className="absolute top-1.5 right-1.5 pointer-events-none">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                  </div>
                                )}
                                
                                {/* Checkbox */}
                                <div className={`flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 transition-all ${
                                  isSelected
                                    ? `bg-${categoryColor}-600 border-${categoryColor}-600 text-white shadow-sm`
                                    : "border-gray-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800 group-hover:border-gray-400 dark:group-hover:border-slate-500"
                                }`}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                
                                {/* Icon */}
                                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                  isSelected
                                    ? `bg-${categoryColor}-500/20 dark:bg-${categoryColor}-500/30`
                                    : "bg-gray-100 dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700"
                                }`}>
                                  <DocIcon className={`h-4 w-4 ${isSelected ? `text-${categoryColor}-600 dark:text-${categoryColor}-400` : "text-gray-500 dark:text-slate-400"}`} />
                                </div>
                                
                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-sm font-medium truncate ${isSelected ? "text-gray-800 dark:text-slate-100" : "text-gray-600 dark:text-slate-300"}`}>
                                      {doc.label}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 font-[vazirmatn] truncate" dir="rtl">
                                    {doc.labelPersian}
                                  </p>
                                  <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 line-clamp-1">
                                    {doc.description}
                                  </p>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Document Details */}
                {(formData.afghanistan_documents || []).length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-green-100/50 dark:border-green-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                          Document Details
                        </p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 rounded-full border dark:border-green-800/60">
                          {(formData.afghanistan_documents || []).length} documents
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-[vazirmatn]">جزئیات اسناد انتخاب شده</p>
                    </div>
                    
                    <div className="space-y-3">
                      {(formData.afghanistan_documents || []).map((docId, docIdx) => {
                        const doc = AFGHANISTAN_DOCUMENT_OPTIONS.find((d) => d.id === docId)
                        if (!doc) return null
                        const details = formData.afghanistan_document_details?.[docId] || { 
                          documentNumber: "", 
                          dateIssued: "", 
                          expiryDate: "", 
                          issuingAuthority: "", 
                          issuingLocation: "", 
                          remarks: "", 
                          verified: false 
                        }
                        
                        const categoryColor = doc.category === 'transport' ? 'blue' :
                          doc.category === 'customs' ? 'amber' :
                          doc.category === 'commercial' ? 'emerald' :
                          doc.category === 'health' ? 'rose' :
                          doc.category === 'insurance' ? 'purple' :
                          doc.category === 'driver' ? 'cyan' : 'red'
                        
                        const DocIcon = doc.icon === 'truck' ? Truck :
                          doc.icon === 'file-text' ? FileText :
                          doc.icon === 'receipt' ? Receipt :
                          doc.icon === 'list' ? List :
                          doc.icon === 'globe' ? Globe :
                          doc.icon === 'shield' ? Shield :
                          doc.icon === 'leaf' ? Leaf :
                          doc.icon === 'heart' ? Heart :
                          doc.icon === 'scale' ? Scale :
                          doc.icon === 'bookmark' ? Bookmark :
                          doc.icon === 'id-card' ? IdCard :
                          doc.icon === 'car' ? Car :
                          doc.icon === 'building' ? Building2 :
                          doc.icon === 'landmark' ? Landmark :
                          doc.icon === 'map-pin' ? MapPin :
                          doc.icon === 'user' ? User :
                          doc.icon === 'package' ? Package :
                          doc.icon === 'shield-check' ? ShieldCheck :
                          FileText
                          
                        return (
                          <div key={`doc-detail-${docId || "doc"}-${docIdx}`} className={`p-4 bg-linear-to-br from-${categoryColor}-50/50 to-white/40 dark:from-${categoryColor}-950/30 dark:to-slate-900/70 backdrop-blur-sm rounded-xl border border-${categoryColor}-100/40 dark:border-${categoryColor}-800/40 shadow-sm`}>
                            {/* Document Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100/50 dark:border-slate-800/80">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-${categoryColor}-500/20 dark:bg-${categoryColor}-500/30`}>
                                  <DocIcon className={`h-4 w-4 text-${categoryColor}-600 dark:text-${categoryColor}-400`} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{doc.label}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 font-[vazirmatn]" dir="rtl">{doc.labelPersian}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleDocumentDetailChange(docId, "verified", !details.verified)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    details.verified
                                      ? "bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/60"
                                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  {details.verified ? (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <Circle className="h-3.5 w-3.5" />
                                      Mark Verified
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleAfghanistanDocument(docId)}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="Delete document"
                                  aria-label="Delete document"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Document Fields */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Document Number / شماره سند</label>
                                <Input
                                  value={details.documentNumber}
                                  onChange={(e) => handleDocumentDetailChange(docId, "documentNumber", e.target.value)}
                                  placeholder="e.g., TR-2024-001"
                                  className={`font-mono text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Date Issued / تاریخ صدور</label>
                                <Input
                                  type="date"
                                  value={details.dateIssued}
                                  onChange={(e) => handleDocumentDetailChange(docId, "dateIssued", e.target.value)}
                                  className={`text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Expiry Date / تاریخ انقضا</label>
                                <Input
                                  type="date"
                                  value={details.expiryDate || ""}
                                  onChange={(e) => handleDocumentDetailChange(docId, "expiryDate", e.target.value)}
                                  className={`text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Issuing Authority / مرجع صادرکننده</label>
                                <Input
                                  value={details.issuingAuthority}
                                  onChange={(e) => handleDocumentDetailChange(docId, "issuingAuthority", e.target.value)}
                                  placeholder="e.g., Ministry of Commerce"
                                  className={`text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Issuing Location / محل صدور</label>
                                <Input
                                  value={details.issuingLocation || ""}
                                  onChange={(e) => handleDocumentDetailChange(docId, "issuingLocation", e.target.value)}
                                  placeholder="e.g., Kabul, Afghanistan"
                                  className={`text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5 block">Remarks / یادداشت</label>
                                <Input
                                  value={details.remarks || ""}
                                  onChange={(e) => handleDocumentDetailChange(docId, "remarks", e.target.value)}
                                  placeholder="Additional notes..."
                                  className={`text-sm border-${categoryColor}-100/60 dark:border-slate-700 bg-white/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 backdrop-blur-sm focus:border-${categoryColor}-400 focus:ring-${categoryColor}-400/30 focus:bg-white/80 dark:focus:bg-slate-900`}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {(formData.afghanistan_documents || []).length === 0 && (
                  <div className="text-center py-8 px-4 bg-linear-to-br from-gray-50/50 to-white/30 dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 mb-3">
                      <FileText className="h-6 w-6 text-gray-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300">No documents selected</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-[vazirmatn]">هیچ سندی انتخاب نشده است</p>
                    <p className="text-xs text-gray-400 dark:text-slate-400 mt-2">Select documents from the categories above to add details</p>
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent
            value="preview"
            className={`preview-tab-panel flex-1 flex flex-col min-h-0 ${
              isFullscreen
                ? "fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 p-2 sm:p-3 overflow-hidden"
                : "mt-0"
            } print:p-0 print:m-0 print:border-none`}
          >
            {activeTab === "preview" && (
              <>
            {/* Single Unified Executive A4 Preview Toolbar */}
            <A4PreviewToolbar
              bolNumber={bolNumber}
              isLoading={isLoading || isHydrating}
              isSaving={isSaving}
              isEditMode={isEditMode}
              hasUnsavedChanges={hasUnsavedChanges}
              autoSaveStatus={autoSaveStatus}
              lastAutoSaveTime={lastAutoSaveTime}
              lastAutoSavedTime={lastAutoSavedTime}
              previewMode={previewMode}
              previewScale={previewScale}
              isFullscreen={isFullscreen}
              bgImageUrl={bgImageUrl}
              bgOpacity={bgOpacity}
              showStampSignature={showStampSignature}
              formData={formData}
              issueDate={issueDate}
              onBackToEditor={() => handleTabChange("form")}
              onSave={handleSave}
              onSetPreviewMode={setPreviewMode}
              onSetManualScale={setManualScale}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onToggleFullscreen={toggleFullscreen}
              onSetBgImage={(url: string, opacity?: number) => {
                setBgImageUrl(url)
                if (opacity !== undefined) setBgOpacity(opacity)
              }}
              onSetBgOpacity={setBgOpacity}
              onToggleStampSignature={() => setShowStampSignature((prev) => !prev)}
              onDownloadPdf={handleShippingDocumentsDownload}
              onDirectPrint={handleDirectPrint}
              onOpenPrintDialog={() => setIsPrintDialogOpen(true)}
              onOpenDocumentCenter={() => setIsDocumentCenterOpen(true)}
              onOpenSavedDocuments={() => handleTabChange("saved-documents")}
              onNewDocument={handleNewDocument}
              onDuplicateCurrent={handleDuplicateCurrent}
              onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
              onOpenPdfSettings={() => handleTabChange("pdf-settings")}
              onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
              onToggleDiagnostics={() => setShowDiagnostics((prev) => !prev)}
              onOpenPackingList={() => handleTabChange("packing-list")}
              onOpenInvoice={() => handleTabChange("invoice")}
            />

            {/* Tier 1: A4 Preview Viewport (owns vertical & horizontal scrolling in all modes with wheel & keyboard navigation) */}
            <div
              ref={viewportRef}
              data-a4-viewport
              data-preview-mode={previewMode}
              tabIndex={0}
              onDoubleClick={(e) => {
                if (e.target === viewportRef.current) {
                  toggleFullscreen()
                }
              }}
              className="a4-preview-viewport flex-1 min-h-0 w-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-950/80 shadow-inner relative print:hidden overflow-y-auto overflow-x-auto focus:outline-none"
            >
              {/* Tier 2: Centered Stage Wrapper */}
              <div
                data-a4-stage-wrapper
                className="a4-centered-stage-wrapper w-full min-h-full flex flex-col items-center transition-[padding] duration-150"
                style={{
                  paddingTop: `${verticalPadding}px`,
                  paddingBottom: `${Math.max(verticalPadding, 48)}px`,
                }}
              >
                {/* Tier 3: Scale Stage (layout dimensions match scaled A4 exactly) */}
                <div
                  data-a4-stage="true"
                  className="a4-preview-stage"
                  style={{
                    width: `${stageWidth}px`,
                    height: `${stageHeight}px`,
                  }}
                >
                  {/* Tier 4: True A4 Document & Scale Wrapper */}
                  <div
                    data-a4-scale-wrapper
                    className="a4-scale-wrapper"
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                      width: `${A4_WIDTH_PX}px`,
                      minWidth: `${A4_WIDTH_PX}px`,
                      height: `${totalUnscaledHeight}px`,
                      minHeight: `${totalUnscaledHeight}px`,
                    }}
                  >
                    {isHydrating || !isPreviewReady ? (
                      <div className="w-[210mm] h-[297mm] bg-white rounded-xl p-8 animate-pulse flex flex-col justify-between box-border shadow-lg">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                              <span className="text-sm font-black text-slate-800 tracking-tight">
                                Loading BOL Preview... {activeBolId || bolNumber}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">A4 Document Hydration</span>
                          </div>
                          <div className="h-12 bg-slate-100 rounded-lg w-full" />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="h-28 bg-slate-50 rounded-lg border border-slate-100" />
                            <div className="h-28 bg-slate-50 rounded-lg border border-slate-100" />
                          </div>
                          <div className="h-48 bg-slate-50 rounded-lg border border-slate-100" />
                        </div>
                        <div className="h-16 bg-slate-100 rounded-lg w-full" />
                      </div>
                    ) : hydrationError ? (
                      <div className="w-[210mm] min-h-[297mm] bg-white rounded-xl p-10 flex flex-col items-center justify-center text-center box-border shadow-lg">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">BOL could not be loaded</h3>
                        <p className="text-sm font-mono text-slate-600 mb-6">BOL: {activeBolId || bolNumber}</p>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" onClick={() => handleTabChange("saved-documents")}>
                            Back to Saved BOLs
                          </Button>
                          <Button onClick={() => void loadBolDocument(activeBolId || bolNumber, { targetTab: "preview", force: true })}>
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <A4Preview
                        key={bolNumber || "preview"}
                        bolNumber={bolNumber}
                        issueDate={issueDate}
                        persianDate={persianDate}
                        persianDateNumeric={persianDateNumeric}
                        formData={deferredFormData}
                        logoUrl={logoUrl}
                        brandLockupUrl={brandLockupUrl}
                        logoDesignId={logoDesignId}
                        companyName={companyName}
                        companyNamePersian={companyNamePersian}
                        companySubtitle={companySubtitle}
                        companyPhone={companyPhone}
                        companyEmail={companyEmail}
                        companyAddress={companyAddress}
                        companyLicence={companyLicence}
                        backgroundImageUrl={bgImageUrl}
                        backgroundOpacity={bgOpacity}
                        showStampSignature={showStampSignature}
                        onToggleStampSignature={setShowStampSignature}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Development Diagnostics Overlay (Ctrl+Shift+X, Section 32) */}
            {showDiagnostics && (
              <div className="fixed bottom-3 right-3 z-50 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-[11px] font-mono text-slate-200 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 font-bold text-sky-400">
                  <span>Preview Diagnostics</span>
                  <button type="button" onClick={() => setShowDiagnostics(false)} className="hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="mt-1 space-y-0.5 text-[10px]">
                  <div>Mode: <span className="text-white font-bold">{previewMode}</span></div>
                  <div>Viewport: <span className="text-white font-bold">{debugMetrics.viewportW} × {debugMetrics.viewportH}px</span></div>
                  <div>Scale: <span className="text-emerald-400 font-bold">{Math.round(previewScale * 100)}%</span></div>
                  <div>Stage: <span className="text-white font-bold">{debugMetrics.stageW} × {debugMetrics.stageH}px</span></div>
                  <div>Doc Top: <span className={debugMetrics.docTopRel < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{debugMetrics.docTopRel}px</span></div>
                  <div>Doc Bottom: <span className="text-white font-bold">{debugMetrics.docBottomRel}px</span></div>
                  <div>Overflow: <span className="text-amber-400 font-bold">X={debugMetrics.overflowX}px, Y={debugMetrics.overflowY}px</span></div>
                </div>
              </div>
            )}
              </>
            )}
          </TabsContent>

          <TabsContent value="saved-documents" className="focus-visible:outline-none">
            {activeTab === "saved-documents" && (
              <section className="min-h-0 w-full print:hidden [content-visibility:auto]">
                {savedDocumentsPanel || (
                  <SavedDocuments
                    onLoadDocument={(id, targetTab, initialDoc) => {
                      void loadBolDocument(id, { targetTab: targetTab || "form", force: true, initialData: initialDoc })
                    }}
                  />
                )}
              </section>
            )}
          </TabsContent>

          {/* ACCI Packing List Tab */}
          <TabsContent value="packing-list" className="focus-visible:outline-none">
            {activeTab === "packing-list" && (
              <section className="min-h-0 w-full">
                <PackingListView
                  formData={formData}
                  onBackToEditor={() => handleTabChange("form")}
                  onNavigateToTab={(tab) => handleTabChange(tab)}
                />
              </section>
            )}
          </TabsContent>

          {/* ACCI Commercial Invoice Tab */}
          <TabsContent value="invoice" className="focus-visible:outline-none">
            {activeTab === "invoice" && (
              <section className="min-h-0 w-full">
                <CommercialInvoiceView
                  formData={formData}
                  onBackToEditor={() => handleTabChange("form")}
                  onNavigateToTab={(tab) => handleTabChange(tab)}
                />
              </section>
            )}
          </TabsContent>

          {/* Shipment Attachments & Digital Folder Tab */}
          <TabsContent value="attachments" className="focus-visible:outline-none">
            {activeTab === "attachments" && (
              <section className="min-h-0 w-full overflow-hidden rounded-[24px] border border-white/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-2 sm:p-4 shadow-xl shadow-blue-200/30 dark:shadow-none backdrop-blur-2xl print:hidden [content-visibility:auto]">
                <BolFilesAttachmentsTab
                  bolNumber={bolNumber || formData.bol_number || "BOL-0000"}
                  containerNumber={formData.container_numbers}
                  consigneeName={formData.consignee_name}
                />
              </section>
            )}
          </TabsContent>

          <TabsContent value="account" className="focus-visible:outline-none">
            {activeTab === "account" && (
              <section className="min-h-0 w-full overflow-hidden rounded-[30px] border border-white/70 dark:border-slate-800 bg-white/45 dark:bg-slate-900/60 p-1 sm:p-2 shadow-2xl shadow-blue-200/40 dark:shadow-none backdrop-blur-2xl print:hidden [content-visibility:auto]">
                {accountLedgerPanel || <LedgerView />}
              </section>
            )}
          </TabsContent>

          {/* PDF Settings Tab */}
          <TabsContent value="pdf-settings" className="focus-visible:outline-none">
            {activeTab === "pdf-settings" && (
              !isSettingsReady ? (
                <BolSettingsSkeleton />
              ) : (
                <BolSettingsCenter
                  currentBol={deferredFormData}
                  activeBgImageUrl={bgImageUrl}
                  activeBgOpacity={bgOpacity}
                  onBgImageChange={setBgImageUrl}
                  onBgOpacityChange={setBgOpacity}
                  showStampSignature={showStampSignature}
                  onToggleStampSignature={setShowStampSignature}
                  logoUrl={logoUrl}
                        brandLockupUrl={brandLockupUrl}
                        logoDesignId={logoDesignId}
                  onLogoChange={setLogoUrl}
                  onLogoDesignChange={(designId, brandUrl, emblemUrl) => {
                    setLogoDesignId(designId)
                    setBrandLockupUrl(brandUrl)
                    setLogoUrl(emblemUrl)
                    persistCompanySettings({ logoDesignId: designId, brandLockupUrl: brandUrl, logoUrl: emblemUrl })
                  }}
                  companyName={companyName}
                  companyNamePersian={companyNamePersian}
                  companySubtitle={companySubtitle}
                  companyPhone={companyPhone}
                  companyEmail={companyEmail}
                  companyAddress={companyAddress}
                  companyLicence={companyLicence}
                  onCompanyInfoChange={(info) => {
                    if (info.companyName !== undefined) setCompanyName(info.companyName)
                    if (info.companyNamePersian !== undefined) setCompanyNamePersian(info.companyNamePersian)
                    if (info.companySubtitle !== undefined) setCompanySubtitle(info.companySubtitle)
                    if (info.companyPhone !== undefined) setCompanyPhone(info.companyPhone)
                    if (info.companyEmail !== undefined) setCompanyEmail(info.companyEmail)
                    if (info.companyAddress !== undefined) setCompanyAddress(info.companyAddress)
                    if (info.companyLicence !== undefined) setCompanyLicence(info.companyLicence)
                  }}
                  iranOffice={{
                    iran_office_building: formData.iran_office_building,
                    iran_office_location: formData.iran_office_location,
                    iran_office_pobox: formData.iran_office_pobox,
                    iran_office_telefax: formData.iran_office_telefax,
                    iran_office_cellphone: formData.iran_office_cellphone,
                    iran_office_email: formData.iran_office_email,
                  }}
                  onIranOfficeChange={(info) => {
                    setFormData((prev) => ({
                      ...prev,
                      iran_office_building: info.iran_office_building ?? prev.iran_office_building,
                      iran_office_location: info.iran_office_location ?? prev.iran_office_location,
                      iran_office_pobox: info.iran_office_pobox ?? prev.iran_office_pobox,
                      iran_office_telefax: info.iran_office_telefax ?? prev.iran_office_telefax,
                      iran_office_cellphone: info.iran_office_cellphone ?? prev.iran_office_cellphone,
                      iran_office_email: info.iran_office_email ?? prev.iran_office_email,
                    }))
                  }}
                  onOpenDocumentCenter={() => setIsDocumentCenterOpen(true)}
                  onOpenPrintDialog={() => setIsPrintDialogOpen(true)}
                  onSaveToCloud={handleExportPDF}
                  isSaving={isSaving}
                />
              )
            )}
          </TabsContent>
        </Tabs>

        {/* Print-only A4 Preview */}
        <PrintPreviewPortal>
          <div
            id="bol-print-preview"
            data-print-root="true"
            className="hidden print:block print:w-[210mm] print:max-w-[210mm] print:m-0 print:p-0 print:box-border print:overflow-visible"
          >
            <PrintSafeBOL>
              <A4Preview
                bolNumber={bolNumber}
                issueDate={issueDate}
                persianDate={persianDate}
                persianDateNumeric={persianDateNumeric}
                formData={isExportingPDF || isShippingExporting ? formData : deferredFormData}
                logoUrl={logoUrl}
                        brandLockupUrl={brandLockupUrl}
                        logoDesignId={logoDesignId}
                companyName={companyName}
                companyNamePersian={companyNamePersian}
                companySubtitle={companySubtitle}
                companyPhone={companyPhone}
                companyEmail={companyEmail}
                companyAddress={companyAddress}
                companyLicence={companyLicence}
                includeColorStrip={activePrintOptions.includeColorStrip}
                backgroundImageUrl={bgImageUrl}
                backgroundOpacity={bgOpacity}
                showStampSignature={showStampSignature}
                onToggleStampSignature={setShowStampSignature}
              />
            </PrintSafeBOL>
          </div>
        </PrintPreviewPortal>

        {/* Dedicated PDF export source. Mounted on-demand during export. Off-screen positioning (-left-[10000px]) guarantees zero background bleed into A4 Preview. */}
        {(isExportingPDF || isShippingExporting) && (
          <div
            data-pdf-export-container="true"
            aria-hidden="true"
            className="fixed -left-[10000px] top-0 pointer-events-none opacity-100 z-[-9999] bg-white"
            style={{ position: "fixed", left: "-10000px", top: 0, width: "794px", minWidth: "794px", maxWidth: "794px", height: "1123px", minHeight: "1123px", maxHeight: "1123px", overflow: "visible", boxSizing: "border-box" }}
          >
            <A4Preview
              bolNumber={bolNumber}
              issueDate={issueDate}
              persianDate={persianDate}
              persianDateNumeric={persianDateNumeric}
              formData={formData}
              logoUrl={logoUrl}
                        brandLockupUrl={brandLockupUrl}
                        logoDesignId={logoDesignId}
              companyName={companyName}
              companyNamePersian={companyNamePersian}
              companySubtitle={companySubtitle}
              companyPhone={companyPhone}
              companyEmail={companyEmail}
              companyAddress={companyAddress}
              companyLicence={companyLicence}
              backgroundImageUrl={bgImageUrl}
              backgroundOpacity={bgOpacity}
              showStampSignature={showStampSignature}
              onToggleStampSignature={setShowStampSignature}
              pdfExport
              exportTarget
            />
          </div>
        )}

        {/* Dedicated Shipping Documents export source (Packing List & Stickers). Off-screen positioning (-left-[10000px]) guarantees zero background bleed into A4 Preview. */}
        {(isDocumentCenterOpen || isShippingExporting) && (
          <div
            data-shipping-export-container="true"
            aria-hidden="true"
            className="fixed -left-[10000px] top-0 overflow-hidden pointer-events-none opacity-100 z-[-9999] bg-white"
            style={{ position: "fixed", left: "-10000px", top: 0, width: "210mm" }}
          >
            <div data-shipping-preview-export="packing-list">
              <PackingListPdfPage
                data={shippingDocumentData}
                logoUrl={logoUrl}
                companyName={companyName}
                companySubtitle={companySubtitle}
              />
            </div>
            <div data-shipping-preview-export="stickers">
              <StickerPdfPage
                data={shippingDocumentData}
                logoUrl={logoUrl}
                companyName={companyName}
                companySubtitle={companySubtitle}
              />
            </div>
          </div>
        )}
      </div>

      <ShippingDocumentCenter
        open={isDocumentCenterOpen}
        onOpenChange={setIsDocumentCenterOpen}
        data={shippingDocumentData}
        logoUrl={logoUrl}
        companyName={companyName}
        companySubtitle={companySubtitle}
        onDownload={handleShippingDocumentsDownload}
        onPrint={handleShippingDocumentsPrint}
        bolPreview={isDocumentCenterOpen ? (
          <A4Preview
            bolNumber={bolNumber}
            issueDate={issueDate}
            persianDate={persianDate}
            persianDateNumeric={persianDateNumeric}
            formData={deferredFormData}
            logoUrl={logoUrl}
                        brandLockupUrl={brandLockupUrl}
                        logoDesignId={logoDesignId}
            companyName={companyName}
            companyNamePersian={companyNamePersian}
            companySubtitle={companySubtitle}
            companyPhone={companyPhone}
            companyEmail={companyEmail}
            companyAddress={companyAddress}
            companyLicence={companyLicence}
            backgroundImageUrl={bgImageUrl}
            backgroundOpacity={bgOpacity}
            showStampSignature={showStampSignature}
            onToggleStampSignature={setShowStampSignature}
          />
        ) : undefined}
      />

      {/* Print Options Dialog */}
      <PrintOptionsDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        onPrint={handlePrint}
        isPrinting={isSaving}
      />

      {/* Save Route Preset Dialog */}
      <Dialog open={isSaveRouteModalOpen} onOpenChange={setIsSaveRouteModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <BookmarkPlus className="h-4 w-4" />
              </span>
              Save Route to Quick Presets
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium font-[vazirmatn]" dir="rtl">
              ذخیره توقفگاه‌های فعلی مسیر ({formData.routes.length} توقفگاه) در نوار پیش‌فرض‌های سریع برای استفاده آسان
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5">
                Preset Name / نام پیش‌فرض مسیر
              </label>
              <Input
                value={newPresetTitle}
                onChange={(e) => setNewPresetTitle(e.target.value)}
                placeholder="e.g. Kandahar ➡️ Islam Qala ➡️ Mashhad"
                className="h-10 rounded-xl border-slate-200 font-bold text-sm focus:border-amber-500 focus:ring-amber-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5">
                Icon / آیکون مسیر
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["🚛", "🚢", "✈️", "🚆", "⭐", "🗺️", "📍", "📦", "🇦🇫", "🇮🇷", "🇵🇰", "🇦🇪", "🇮🇳", "🇺🇿"].map((emoji, eIdx) => (
                  <button
                    key={`emoji-${emoji}-${eIdx}`}
                    type="button"
                    onClick={() => setNewPresetIcon(emoji)}
                    className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-all ${
                      newPresetIcon === emoji
                        ? "bg-amber-500 text-white shadow-md scale-110 ring-2 ring-amber-400"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Stops Preview */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 block mb-1.5">
                Stops to be saved ({formData.routes.length}):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-blue-950">
                {formData.routes.map((r, i) => (
                  <span key={`route-summary-${r.id || i}-${i}`} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-blue-400">➡️</span>}
                    <span className="rounded-md bg-white px-2 py-0.5 border border-blue-200/80 shadow-2xs">
                      {r.location || r.locationPersian || `Stop #${i + 1}`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSaveRouteModalOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              Cancel / لغو
            </Button>
            <Button
              type="button"
              onClick={handleSaveRoutePreset}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save Preset / ذخیره پیش‌فرض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-black">
              <Keyboard className="h-5 w-5 text-blue-600" />
              Keyboard Shortcuts / کلیدهای میانبر
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Boost your logistics productivity with instant keyboard shortcuts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-3">
            {[
              { keys: ["Ctrl", "S"], desc: "Save / Update Bill of Lading", fa: "ذخیره یا ویرایش بارنامه" },
              { keys: ["Ctrl", "P"], desc: "Print Document / Open PDF Print Dialog", fa: "چاپ سند یا پیش‌نمایش" },
              { keys: ["Ctrl", "Shift", "N"], desc: "Create New Blank Document", fa: "ایجاد سند جدید و خالی" },
              { keys: ["Ctrl", "Shift", "D"], desc: "Duplicate Current Document", fa: "تکثیر و کپی بارنامه فعلی" },
              { keys: ["Ctrl", "/"], desc: "Open this Shortcuts Guide", fa: "نمایش این راهنما" },
            ].map((sc, i) => (
              <div key={`shortcut-${sc.desc}-${i}`} className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-100 bg-slate-50/80">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900">{sc.desc}</span>
                  <span className="text-[10.5px] text-slate-500 font-bold font-[vazirmatn]">{sc.fa}</span>
                </div>
                <div className="flex items-center gap-1">
                  {sc.keys.map((k, kIdx) => (
                    <kbd key={`kbd-${k}-${kIdx}`} className="px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs text-[11px] font-black font-mono text-blue-900">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsShortcutsModalOpen(false)}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
            >
              Got it / فهمیدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup & Restore Data Hub Dialog */}
      <Dialog open={isBackupModalOpen} onOpenChange={setIsBackupModalOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 text-lg font-black">
              <DownloadCloud className="h-5 w-5 text-emerald-600" />
              Backup & Restore Data Hub / پشتیبان‌گیری
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Export all your saved B/Ls, company profiles, and presets or restore from a JSON backup.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Export Card */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-emerald-950">Export Full JSON Backup</h4>
                <p className="text-[11px] text-emerald-800 font-medium">Download complete backup file of all documents & settings</p>
              </div>
              <Button
                type="button"
                onClick={handleExportFullBackup}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Download
              </Button>
            </div>

            {/* Import Card */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-blue-950">Restore from Backup File</h4>
                <p className="text-[11px] text-blue-800 font-medium">Select a previously saved .json backup file to restore</p>
              </div>
              <label className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer inline-flex items-center justify-center">
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackupFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBackupModalOpen(false)}
              className="rounded-xl font-bold text-xs"
            >
              Close / بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Device Cloud Sync Hub */}
      <CloudSyncModal
        open={isCloudSyncModalOpen}
        onOpenChange={setIsCloudSyncModalOpen}
        onSyncComplete={() => {
          if (onRefreshDocuments) onRefreshDocuments()
        }}
      />

      {/* Consignee Master Directory Modal */}
      <PartyDirectoryModal
        open={isBrowseConsigneeModalOpen}
        onOpenChange={setIsBrowseConsigneeModalOpen}
        role="CONSIGNEE"
        parties={savedConsignees}
        selectedPartyId={isConsigneeSelected ? selectedConsigneeId : ""}
        onSelectParty={(party) => {
          applySavedConsignee(party.id)
        }}
        onSaveNewParty={(party) => {
          const formatted: SavedParty = {
            id: party.id,
            name: party.name,
            address: party.address || "",
            contact: party.contact || "",
            email: party.email || "",
            savedAt: party.savedAt || new Date().toISOString(),
          }
          const next = [formatted, ...savedConsignees.filter((c) => c.id !== formatted.id)]
          persistSavedParties(SAVED_CONSIGNEES_STORAGE_KEY, next, setSavedConsignees)
          applySavedConsignee(formatted.id)
        }}
        onUpdateParty={(updated) => {
          const formatted: SavedParty = {
            id: updated.id,
            name: updated.name,
            address: updated.address || "",
            contact: updated.contact || "",
            email: updated.email || "",
            savedAt: new Date().toISOString(),
          }
          const next = savedConsignees.map((c) => (c.id === formatted.id ? formatted : c))
          persistSavedParties(SAVED_CONSIGNEES_STORAGE_KEY, next, setSavedConsignees)
          if (selectedConsigneeId === formatted.id) {
            applySavedConsignee(formatted.id)
          }
          toast.success("Consignee updated in directory.")
        }}
        onDeleteParty={(id) => {
          const next = savedConsignees.filter((c) => c.id !== id)
          persistSavedParties(SAVED_CONSIGNEES_STORAGE_KEY, next, setSavedConsignees)
          if (selectedConsigneeId === id) setSelectedConsigneeId("")
          toast.success("Consignee deleted from directory.")
        }}
      />

      {/* Shipper Master Directory Modal */}
      <PartyDirectoryModal
        open={isBrowseShipperModalOpen}
        onOpenChange={setIsBrowseShipperModalOpen}
        role="SHIPPER"
        parties={savedShippers}
        selectedPartyId={isShipperSelected ? selectedShipperId : ""}
        onSelectParty={(party) => {
          applySavedShipper(party.id)
        }}
        onSaveNewParty={(party) => {
          const formatted: SavedParty = {
            id: party.id || crypto.randomUUID(),
            name: party.name,
            address: party.address || "",
            contact: party.contact || "",
            email: party.email || "",
            savedAt: party.savedAt || new Date().toISOString(),
          }
          const next = [formatted, ...savedShippers.filter((s) => s.id !== formatted.id)]
          persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, next, setSavedShippers)
          applySavedShipper(formatted.id)
          toast.success("New shipper added to directory.")
        }}
        onUpdateParty={(updated) => {
          const formatted: SavedParty = {
            id: updated.id,
            name: updated.name,
            address: updated.address || "",
            contact: updated.contact || "",
            email: updated.email || "",
            savedAt: new Date().toISOString(),
          }
          const next = savedShippers.map((s) => (s.id === formatted.id ? formatted : s))
          persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, next, setSavedShippers)
          if (selectedShipperId === formatted.id) {
            applySavedShipper(formatted.id)
          }
          toast.success("Shipper updated in directory.")
        }}
        onDeleteParty={(id) => {
          const next = savedShippers.filter((s) => s.id !== id)
          persistSavedParties(SAVED_SHIPPERS_STORAGE_KEY, next, setSavedShippers)
          if (selectedShipperId === id) setSelectedShipperId("")
          toast.success("Shipper deleted from directory.")
        }}
      />

      {/* Notify Party Master Directory Modal */}
      <PartyDirectoryModal
        open={isBrowseNotifyModalOpen}
        onOpenChange={setIsBrowseNotifyModalOpen}
        role="NOTIFY_PARTY"
        parties={savedNotifyParties}
        selectedPartyId={isNotifyPartySelected ? selectedNotifyPartyId : ""}
        onSelectParty={(party) => {
          applySavedNotifyParty(party.id)
        }}
        onSaveNewParty={(party) => {
          const formatted: SavedParty = {
            id: party.id || crypto.randomUUID(),
            name: party.name,
            address: party.address || "",
            contact: party.contact || "",
            email: party.email || "",
            savedAt: party.savedAt || new Date().toISOString(),
          }
          const next = [formatted, ...savedNotifyParties.filter((n) => n.id !== formatted.id)]
          persistSavedParties(SAVED_NOTIFY_PARTIES_STORAGE_KEY, next, setSavedNotifyParties)
          applySavedNotifyParty(formatted.id)
          toast.success("New notify party added to directory.")
        }}
        onUpdateParty={(updated) => {
          const formatted: SavedParty = {
            id: updated.id,
            name: updated.name,
            address: updated.address || "",
            contact: updated.contact || "",
            email: updated.email || "",
            savedAt: new Date().toISOString(),
          }
          const next = savedNotifyParties.map((n) => (n.id === formatted.id ? formatted : n))
          persistSavedParties(SAVED_NOTIFY_PARTIES_STORAGE_KEY, next, setSavedNotifyParties)
          if (selectedNotifyPartyId === formatted.id) {
            applySavedNotifyParty(formatted.id)
          }
          toast.success("Notify party updated in directory.")
        }}
        onDeleteParty={(id) => {
          const next = savedNotifyParties.filter((n) => n.id !== id)
          persistSavedParties(SAVED_NOTIFY_PARTIES_STORAGE_KEY, next, setSavedNotifyParties)
          if (selectedNotifyPartyId === id) setSelectedNotifyPartyId("")
          toast.success("Notify party deleted from directory.")
        }}
      />
    </div>
  )
}
