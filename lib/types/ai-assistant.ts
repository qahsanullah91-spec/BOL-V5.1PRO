/**
 * Sky Ariana AI Operations Assistant Types
 * Upgraded Enterprise AI Assistant (ChatGPT & Google Gemini Architecture)
 * Database Grounded, Multi-Tool Agent, Multi-Provider (Gemini + OpenAI + Local)
 */

import { StaffRole } from '@/lib/rbac/rbac-types'

export type AIAssistantIntentType =
  | 'LOOKUP_BOL'
  | 'LOOKUP_CONTAINER'
  | 'LOOKUP_SHIPMENT'
  | 'LOOKUP_BOOKING'
  | 'LOOKUP_CUSTOMER'
  | 'LOOKUP_INVOICE'
  | 'SEARCH_SHIPMENTS'
  | 'SEARCH_CONTAINERS'
  | 'STALE_TRACKING'
  | 'BORDER_STATUS'
  | 'PORT_STATUS'
  | 'VESSEL_STATUS'
  | 'MISSING_DOCUMENTS'
  | 'CUSTOMER_BALANCE'
  | 'OVERDUE_INVOICES'
  | 'TODAY_PAYMENTS'
  | 'SHIPMENT_PROFIT'
  | 'DAILY_REPORT'
  | 'WHATSAPP_STATUS'
  | 'TASK_STATUS'
  | 'AUDIT_HISTORY'
  | 'CONTROL_TOWER_OVERVIEW'
  | 'SMART_VERIFICATION'
  | 'ACTION_PROPOSAL'
  | 'NAVIGATION'
  | 'GENERAL_QUESTION'
  | 'GENERATE_PDF'
  | 'GENERATE_REPORT'
  | 'WRITE_WHATSAPP'

export type AIActionType =
  | 'UPDATE_TRACKING'
  | 'CREATE_TASK'
  | 'PREPARE_DOCUMENT'
  | 'PREPARE_PAYMENT'
  | 'NAVIGATE'
  | 'GENERATE_PDF'
  | 'UPDATE_SHIPMENT'

export type AIProviderType = 'gemini' | 'openai' | 'offline_local' | 'antigravity'

export type AIAssistantMode = 'ASK' | 'WORK' | 'READ_ONLY' | 'READ_AND_ACTIONS'

export type SupportedLanguage = 'EN' | 'PS' | 'FA' | 'UR' | 'HI'

export interface AIAssistantConfig {
  enabled: boolean
  provider: AIProviderType
  apiKey?: string // Google Gemini API Key
  openaiApiKey?: string // OpenAI API Key
  model: string // Gemini model (e.g. gemini-3.8-flash)
  openaiModel?: string // OpenAI model (e.g. gpt-4o, gpt-4o-mini)
  defaultLanguage: SupportedLanguage
  mode: AIAssistantMode
  maxResults: number
  chatHistoryEnabled: boolean
  systemPrompt?: string
  temperature?: number
  lastTestedAt?: string
  lastTestStatus?: 'SUCCESS' | 'ERROR'
  lastTestMessage?: string
  maxResponseLength?: number
  errorLog?: Array<{
    timestamp: string
    message: string
    provider?: string
  }>
}

export interface AIMessageAttachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl?: string
  textExtract?: string
}

export interface AIWhatsAppCard {
  id: string
  title: string
  category:
    | 'SHIPMENT_UPDATE'
    | 'CONTAINER_LOCATION'
    | 'VESSEL_DEPARTURE_ARRIVAL'
    | 'ETA_ETD'
    | 'CUSTOMS_CLEARANCE'
    | 'DOCUMENT_REQUEST'
    | 'BL_CORRECTION'
    | 'PAYMENT_REMINDER'
    | 'INVOICE_PACKING_LIST'
    | 'CUSTOMER_COMMUNICATION'
    | 'TRUCK_BORDER_UPDATE'
  bolNumber?: string
  truckNumber?: string
  containerNumber?: string
  phone?: string
  message: string
  language: SupportedLanguage
  waUrl: string
  shortVersion?: string
  detailedVersion?: string
  currentVersion: 'short' | 'detailed'
}

export interface AIDocumentArtifact {
  id: string
  type:
    | 'COMPLETE_PACKAGE'
    | 'BOL_PAGE_1'
    | 'PACKING_LIST'
    | 'STICKER_LABEL'
    | 'ACCI_INVOICE'
    | 'ACCI_PACKING_LIST'
    | 'SHIPMENT_REPORT'
    | 'FINANCIAL_SUMMARY'
  title: string
  fileName: string
  fileSize?: string
  pagesCount?: number
  bolNumber?: string
  bolId?: string
  downloadUrl?: string
  previewUrl?: string
  generatedAt: string
  status: 'READY' | 'GENERATING' | 'FAILED'
  description?: string
}

export interface AICardItem {
  id: string
  type:
    | 'BOL'
    | 'CONTAINER'
    | 'CUSTOMER'
    | 'INVOICE'
    | 'BOOKING'
    | 'DOCUMENT'
    | 'BORDER'
    | 'REPORT'
    | 'TRUCK'
    | 'DOCUMENT_ARTIFACT'
    | 'WHATSAPP'
  title: string
  subtitle?: string
  status?: string
  statusColor?: string
  primaryReference: string
  secondaryReference?: string
  location?: string
  eta?: string
  financials?: {
    amount: number
    currency: string
    label: string
  }[]
  missingItems?: string[]
  updatedAt?: string
  isStale?: boolean
  staleReason?: string
  actions: {
    label: string
    action: string
    params?: Record<string, any>
    variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  }[]
}

export interface AIActionProposal {
  id: string
  actionType: AIActionType
  title: string
  description: string
  entityType: 'shipment' | 'container' | 'task' | 'document' | 'payment'
  entityId: string
  entityRef: string
  currentValues: Record<string, any>
  proposedValues: Record<string, any>
  requiresConfirmation: boolean
  confirmed: boolean
  executedAt?: string
  executedBy?: string
  auditNote?: string
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: AIAssistantIntentType
  filterChips?: {
    key: string
    label: string
    value: string
  }[]
  cards?: AICardItem[]
  actionProposal?: AIActionProposal
  whatsappCard?: AIWhatsAppCard
  documentArtifact?: AIDocumentArtifact
  attachments?: AIMessageAttachment[]
  sourceTags?: string[]
  recordCount?: number
  timestamp: string
  confidence?: number
  isError?: boolean
  isDraft?: boolean
  agentSteps?: string[]
  toolsCalled?: {
    tool_name: string
    parameters?: Record<string, any>
    status?: string
    result_preview?: string
    durationMs?: number
  }[]
  invariancePassed?: boolean
  engineUsed?: 'antigravity' | 'gemini' | 'openai' | 'offline_local'
  mode?: AIAssistantMode
  modelUsed?: string
}

export interface AIConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastPreview?: string
  mode: AIAssistantMode
  messages: AIChatMessage[]
  userId?: string
  workspaceId?: string
  clientId?: string
  pinned?: boolean
}

export interface AIUserSessionContext {
  userId?: string
  username: string
  name: string
  role: StaffRole | string
  isClientUser?: boolean
  clientId?: string
  clientName?: string
  permissions?: string[]
  language?: SupportedLanguage
  currentBolId?: string
  currentAccountId?: string
}

export interface AIQueryFilter {
  query?: string
  companyId?: string
  companyName?: string
  bolNumber?: string
  containerNumber?: string
  invoiceNumber?: string
  bookingNumber?: string
  truckPlate?: string
  vesselName?: string
  status?: string
  origin?: string
  destination?: string
  stage?: 'road' | 'border' | 'port' | 'sea' | 'delivered'
  dateRange?: {
    from?: string
    to?: string
    namedPeriod?: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month'
  }
  isOverdue?: boolean
  hasMissingDocs?: boolean
  isStale?: boolean
}

export interface AIResponsePayload {
  success: boolean
  message: AIChatMessage
  suggestions?: string[]
  requiresClarification?: boolean
  clarificationOptions?: string[]
  error?: string
}
