import type { ReactNode } from "react"

/**
 * TypeScript type definitions for ledger redesign components
 * Ensures type safety across gallery, row, and cell components
 */

/**
 * Media attachment with metadata
 * Used in ledger entries and gallery modal
 */
export interface MediaAttachment {
  id: string
  name: string
  originalName: string
  url: string
  type: string
  kind: MediaKind
  size: number
  uploadedAt: string
  storagePath?: string
  favorite?: boolean
}

/**
 * Media file type categories
 */
export type MediaKind = "image" | "video" | "audio" | "document"

/**
 * Ledger entry (row data)
 * Contains all financial and shipping information
 */
export interface LedgerEntry {
  id: string
  date: string
  description: string
  invoiceNo: string
  dateOfShip: string
  billOfLanding: string
  containerType: string
  containerDetails?: string
  containerNo: string
  consignee: string
  quantity: string
  packing: string
  debit: number
  credit: number
  billOfLandingSurrendered: boolean
  pdfName?: string
  pdfUrl?: string
  pdfDataUrl?: string
  statusPdfName?: string
  statusPdfUrl?: string
  statusPdfDataUrl?: string
  mediaFiles?: MediaAttachment[]
  mediaName?: string
  mediaUrl?: string
  mediaType?: string
  receiptId?: string
  receiptNo?: string
}

/**
 * Auto-generated receipt for credit rows
 */
export interface ReceiptRecord {
  id: string
  receiptNo: string
  ledgerRowId: string
  accountId: string
  accountName: string
  date: string
  receivedFrom: string
  amount: number
  currency: string
  paymentMethod: string
  description: string
  blNo?: string
  containerNo?: string
  consignee?: string
  createdAt: string
  updatedAt: string
}

/**
 * Ledger row with calculated balance
 * Used for rendering rows with running balance
 */
export interface LedgerRowWithBalance extends LedgerEntry {
  sNo: number
  balanceUsd: number
}

/**
 * Gallery modal props
 */
export interface LedgerGalleryModalProps {
  files: MediaAttachment[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onDelete?: (fileId: string) => void
  rowId?: string
}

/**
 * Row component props
 */
export interface LedgerRowProps {
  row: LedgerEntry
  sNo: number
  isEditing: boolean
  isSelected: boolean
  editingDraft?: Partial<LedgerEntry>
  onSelect: () => void
  onEdit: () => void
  onSave?: () => void
  onCancel?: () => void
  onDelete?: () => void
  onEditChange?: (field: keyof LedgerEntry, value: any) => void
  onMediaAdd?: (files: FileList) => void
  onMediaDelete?: (fileId: string) => void
  getMediaFiles?: (row: LedgerEntry) => MediaAttachment[]
}

/**
 * Editable cell props
 */
export interface EditableCellProps {
  label?: string
  value: string | number
  onChange: (value: string) => void
  isEditing: boolean
  type?: "text" | "number" | "date" | "textarea" | "email" | "tel" | "url"
  placeholder?: string
  children?: ReactNode
  dir?: "ltr" | "rtl"
  className?: string
  disabled?: boolean
  minHeight?: string
  required?: boolean
  step?: string
  min?: string
  max?: string
  pattern?: string
  list?: string
  autoComplete?: string
  rows?: number
  cols?: number
  maxLength?: number
}

/**
 * Column definition for ledger header
 */
export interface LedgerColumn {
  id: string
  en: string
  ps?: string
}

/**
 * Account record (company profile)
 */
export interface AccountRecord {
  id: string
  companyName: string
  address: string
  contact: string
  email?: string
  licenceNo?: string
  type: AccountType
  accountType?: StrictAccountType
  openingBalance: number
  currency: string
  notes?: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

/**
 * Account type variants
 */
export type AccountType = "import" | "export" | "both"
export type StrictAccountType = "import" | "export"
export type AccountStatus = "active" | "inactive"

/**
 * Ledger profile (shipper/customer info for printing)
 */
export interface LedgerProfile {
  shipperCustomerName: string
  shipperCustomerAddress: string
  shipperCustomerContact: string
  shipperCustomerEmail: string
  officeAddress: string
  footerInfo: string
  logoDataUrl: string
}

/**
 * Ledger defaults (office settings)
 */
export interface AccountLedgerDefaults {
  officeAddress: string
  footerInfo: string
  logoDataUrl: string
}

/**
 * Balance calculation method
 */
export type BalanceMethod = "debitMinusCredit" | "creditMinusDebit"

/**
 * Media viewer state
 */
export interface MediaViewerState {
  items: MediaAttachment[]
  index: number
  rowId: string
}

/**
 * Saved party (shipper/consignee from BOL data)
 */
export interface SavedParty {
  id?: string
  name: string
  address?: string
  contact?: string
  email?: string
  source?: string
}

/**
 * Export account ledger snapshot (for storage)
 */
export interface AccountLedgerSnapshot {
  accounts: AccountRecord[]
  ledgerEntries: Record<string, LedgerEntry[]>
  ledgerProfiles: Record<string, LedgerProfile>
}

/**
 * Gallery viewer state
 */
export interface GalleryViewerState {
  files: MediaAttachment[]
  index: number
  isOpen: boolean
  rowId?: string
}

/**
 * Edit draft state
 */
export interface EditDraftState {
  rowId: string
  data: Partial<LedgerEntry>
  savedAt?: string
}

/**
 * Toast notification
 */
export interface Toast {
  type: "success" | "error" | "info" | "warning"
  message: string
  duration?: number
}

/**
 * Row density options
 */
export type RowDensity = "compact" | "medium" | "comfortable"

/**
 * Print preview state
 */
export interface PrintPreviewState {
  isOpen: boolean
  zoom: number
  fitMode: "width" | "page"
  pageCount: number
}

/**
 * API response types
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * File upload response
 */
export interface FileUploadResponse extends ApiResponse {
  name?: string
  url?: string
  type?: string
  size?: number
  kind?: MediaKind
  mediaKind?: MediaKind
  uploadedAt?: string
  localPath?: string
  storageFolder?: string
}

/**
 * Container type option
 */
export interface ContainerTypeOption {
  value: string
  label: string
  code?: string
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  [key: string]: number // 0-100
}

/**
 * Row selection state
 */
export interface RowSelectionState {
  selectedIds: Set<string>
  lastSelectedId?: string
  isMultiSelect: boolean
}

/**
 * Media filter options
 */
export type MediaFilter = "all" | MediaKind | "favorites"

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc"

/**
 * Column sort state
 */
export interface SortState {
  column: string
  direction: SortDirection
}

// Re-export commonly used types
export type { ReactNode } from "react"
