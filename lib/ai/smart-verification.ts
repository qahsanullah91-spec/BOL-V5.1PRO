/**
 * Smart Search & Verification Engine
 * Sky Ariana Multi-Modal Logistics & Financial Integrity
 *
 * Provides authoritative verification for:
 * 1. Accounting Ledger Invariance Identity (Net Balance = Total Debit - Total Credit)
 * 2. Multi-Modal Border Station Routing (Islam Qala, Torghundi, Hairatan, Spin Boldak, Zaranj)
 * 3. Sanction & Regulatory Compliance Screening
 */

import { AccountRecord, LedgerTransactionRecord } from '@/lib/types/ledger-system'
import { RouteStop } from '@/lib/types/bill-of-lading'
import { extractStructuredData, generateAICompletion } from './ai-provider'
import { VERIFICATION_AUDIT_JSON_SCHEMA } from './schemas/bol-schema'

// Authoritative border stations recognised by Afghan Customs & Sky Ariana
export const RECOGNIZED_AFGHAN_BORDER_STATIONS = [
  { code: 'IQ', name: 'Islam Qala', namePersian: 'اسلام قلعه', country: 'Iran/Afghanistan', province: 'Herat' },
  { code: 'TG', name: 'Torghundi', namePersian: 'تورغونډۍ', country: 'Turkmenistan/Afghanistan', province: 'Herat' },
  { code: 'HT', name: 'Hairatan', namePersian: 'حیرتان', country: 'Uzbekistan/Afghanistan', province: 'Balkh' },
  { code: 'SB', name: 'Spin Boldak', namePersian: 'سپین بولدک', country: 'Pakistan/Afghanistan', province: 'Kandahar' },
  { code: 'ZR', name: 'Zaranj / Milak', namePersian: 'زرنج / میلک', country: 'Iran/Afghanistan', province: 'Nimroz' },
  { code: 'AQ', name: 'Aqina', namePersian: 'آقینه', country: 'Turkmenistan/Afghanistan', province: 'Faryab' },
  { code: 'SK', name: 'Sher Khan Bandar', namePersian: 'شیرخان بندر', country: 'Tajikistan/Afghanistan', province: 'Kunduz' },
  { code: 'DG', name: 'Dogharoun', namePersian: 'دوغارون', country: 'Iran/Afghanistan', province: 'Khorasan' },
]

// Recognized transshipment seaports & logistics hubs
export const RECOGNIZED_TRANSSHIPMENT_PORTS = [
  'Bandar Abbas',
  'Chabahar',
  'Mersin',
  'Hamriya',
  'Sharjah',
  'Dubai',
  'Jebel Ali',
  'Sohar',
  'Nhava Sheva',
  'Mundra',
  'Karachi',
  'Port Qasim',
]

// Prohibited / embargoed keywords for trade compliance screening
export const SANCTION_SCREENING_KEYWORDS = [
  'weapon',
  'armament',
  'ammunition',
  'explosive',
  'missile',
  'radioactive',
  'centrifuge',
  'military drone',
  'tactical gear',
  'surveillance interception',
  'narcotics',
  'precursor chemical',
  'enriched uranium',
]

export interface LedgerAuditResult {
  identitySatisfied: boolean
  totalDebit: number
  totalCredit: number
  expectedBalance: number
  actualBalance: number
  discrepancy: number
  chronologicalOrderValid: boolean
  currencyConsistent: boolean
  anomalies: string[]
}

export interface BorderRoutingAuditResult {
  origin?: string
  destination?: string
  borderStation?: string
  isRecognizedBorder: boolean
  routeContinuityValid: boolean
  transitIssues: string[]
  detectedStopsCount: number
}

export interface SanctionsAuditResult {
  passed: boolean
  riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  flaggedKeywords: string[]
  flaggedEntities: string[]
  advisory: string
}

export interface ComprehensiveAuditResult {
  timestamp: string
  verdict: 'PASS' | 'WARNING' | 'CRITICAL'
  ledgerAudit: LedgerAuditResult
  borderRoutingAudit: BorderRoutingAuditResult
  sanctionsAudit: SanctionsAuditResult
  executiveSummary: string
  actionableRecommendations: string[]
  aiSynthesized?: boolean
}

/**
 * Deterministic Ledger Invariance and Chronology Audit
 * Validates: Net Balance = Total Debit - Total Credit
 */
export function auditLedgerAccount(
  account: Partial<AccountRecord>,
  transactions: LedgerTransactionRecord[] = []
): LedgerAuditResult {
  const anomalies: string[] = []

  let calculatedDebit = 0
  let calculatedCredit = 0

  for (const t of transactions) {
    if (t.is_deleted) continue
    calculatedDebit += Number(t.debit || 0)
    calculatedCredit += Number(t.credit || 0)
  }

  // Round to 2 decimal places to avoid floating point inaccuracies
  calculatedDebit = Math.round(calculatedDebit * 100) / 100
  calculatedCredit = Math.round(calculatedCredit * 100) / 100
  const expectedBalance = Math.round((calculatedDebit - calculatedCredit) * 100) / 100

  const statedDebit = Number(account.total_debit ?? calculatedDebit)
  const statedCredit = Number(account.total_credit ?? calculatedCredit)
  const actualBalance = Number(account.current_balance ?? (statedDebit - statedCredit))

  const discrepancy = Math.abs(Math.round((expectedBalance - actualBalance) * 100) / 100)
  const identitySatisfied = discrepancy < 0.01

  if (!identitySatisfied) {
    anomalies.push(
      `Accounting invariance breached: Net Balance (${actualBalance}) does not equal Total Debit (${calculatedDebit}) - Total Credit (${calculatedCredit}). Discrepancy: ${discrepancy}`
    )
  }

  // Chronological verification
  let chronologicalOrderValid = true
  for (let i = 1; i < transactions.length; i++) {
    const prev = new Date(transactions[i - 1].transaction_date).getTime()
    const curr = new Date(transactions[i].transaction_date).getTime()
    if (!isNaN(prev) && !isNaN(curr) && curr < prev) {
      chronologicalOrderValid = false
      anomalies.push(
        `Chronological sequencing violation: Entry on ${transactions[i].transaction_date} is recorded after earlier entry ${transactions[i - 1].transaction_date}.`
      )
      break
    }
  }

  // Currency consistency
  const primaryCurrency = (account.currency || transactions[0]?.currency || 'USD').toUpperCase()
  let currencyConsistent = true
  for (const t of transactions) {
    if (t.currency && t.currency.toUpperCase() !== primaryCurrency) {
      currencyConsistent = false
      anomalies.push(
        `Multi-currency conflict: Entry ${t.id} uses ${t.currency} inside account configured for ${primaryCurrency}. Explicit conversion rate required.`
      )
      break
    }
  }

  return {
    identitySatisfied,
    totalDebit: calculatedDebit,
    totalCredit: calculatedCredit,
    expectedBalance,
    actualBalance,
    discrepancy,
    chronologicalOrderValid,
    currencyConsistent,
    anomalies,
  }
}

/**
 * Deterministic Border Station & Route Continuity Audit
 */
export function auditBorderRouting(payload: {
  origin?: string
  destination?: string
  borderStation?: string
  routes?: RouteStop[]
  truckNumber?: string
  driverName?: string
  cargoDescription?: string
}): BorderRoutingAuditResult {
  const issues: string[] = []

  const candidateBorder = (
    payload.borderStation ||
    payload.routes?.find((r) =>
      RECOGNIZED_AFGHAN_BORDER_STATIONS.some((b) =>
        r.location.toLowerCase().includes(b.name.toLowerCase()) ||
        (r.locationPersian && r.locationPersian.includes(b.namePersian))
      )
    )?.location ||
    ''
  ).trim()

  const isRecognizedBorder = RECOGNIZED_AFGHAN_BORDER_STATIONS.some(
    (b) =>
      candidateBorder.toLowerCase().includes(b.name.toLowerCase()) ||
      (payload.origin && payload.origin.toLowerCase().includes(b.name.toLowerCase())) ||
      (payload.destination && payload.destination.toLowerCase().includes(b.name.toLowerCase()))
  )

  if (!isRecognizedBorder && candidateBorder) {
    issues.push(
      `Border crossing "${candidateBorder}" is not among official Sky Ariana recognized border gates (Islam Qala, Torghundi, Hairatan, Spin Boldak, Zaranj).`
    )
  }

  // Continuity check
  const stops = payload.routes || []
  let routeContinuityValid = true

  if (stops.length > 0) {
    for (let i = 0; i < stops.length; i++) {
      if (stops[i].stopOrder !== i + 1) {
        routeContinuityValid = false
        issues.push(`Stop sequencing broken at index ${i}: expected order ${i + 1}, found ${stops[i].stopOrder}.`)
      }
    }
  }

  // Transport mode validation: Truck legs must have driver or truck number
  const hasTruckLeg = stops.some((s) => s.transportMode === 'truck' || s.transportMode === 'road')
  if (hasTruckLeg && !payload.truckNumber && !payload.driverName) {
    issues.push('Multi-modal integrity warning: Overland truck leg declared without truck plate or driver name.')
  }

  return {
    origin: payload.origin,
    destination: payload.destination,
    borderStation: candidateBorder || (isRecognizedBorder ? 'Recognized in route' : 'None specified'),
    isRecognizedBorder: isRecognizedBorder || stops.length === 0,
    routeContinuityValid,
    transitIssues: issues,
    detectedStopsCount: stops.length,
  }
}

/**
 * Deterministic Sanctions & Compliance Screening
 */
export function auditSanctionsAndCompliance(entities: {
  shipper?: string
  consignee?: string
  notifyParty?: string
  vessel?: string
  cargo?: string
  origin?: string
  destination?: string
}): SanctionsAuditResult {
  const flaggedKeywords: string[] = []
  const flaggedEntities: string[] = []

  const textToScan = [
    entities.shipper || '',
    entities.consignee || '',
    entities.notifyParty || '',
    entities.vessel || '',
    entities.cargo || '',
    entities.origin || '',
    entities.destination || '',
  ].join(' ').toLowerCase()

  for (const kw of SANCTION_SCREENING_KEYWORDS) {
    if (textToScan.includes(kw)) {
      flaggedKeywords.push(kw)
    }
  }

  let riskLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'CLEAN'
  let passed = true
  let advisory = 'Shipment entities and cargo cleared for standard Afghan transit processing.'

  if (flaggedKeywords.length > 0) {
    passed = false
    riskLevel = 'HIGH'
    advisory = `Compliance warning: Prohibited / dual-use terms detected (${flaggedKeywords.join(
      ', '
    )}). Mandatory compliance officer manual review required prior to document issuance.`
  }

  return {
    passed,
    riskLevel,
    flaggedKeywords,
    flaggedEntities,
    advisory,
  }
}

/**
 * Comprehensive Smart Verification with optional Gemini AI Synthesis
 */
export async function runComprehensiveVerification(params: {
  account?: Partial<AccountRecord>
  transactions?: LedgerTransactionRecord[]
  shipment?: any
  useAiSynthesis?: boolean
}): Promise<ComprehensiveAuditResult> {
  const ledgerAudit = auditLedgerAccount(params.account || {}, params.transactions || [])
  const borderRoutingAudit = auditBorderRouting({
    origin: params.shipment?.origin || params.shipment?.place_of_delivery,
    destination: params.shipment?.destination || params.shipment?.port_of_discharge,
    borderStation: params.shipment?.transit_border_station,
    routes: params.shipment?.routes,
    truckNumber: params.shipment?.truck_number,
    driverName: params.shipment?.driver_name,
    cargoDescription: params.shipment?.cargo_description,
  })
  const sanctionsAudit = auditSanctionsAndCompliance({
    shipper: params.shipment?.shipper_name,
    consignee: params.shipment?.consignee_name,
    notifyParty: params.shipment?.notify_party,
    vessel: params.shipment?.vessel_name,
    cargo: params.shipment?.cargo_description,
    origin: params.shipment?.origin,
    destination: params.shipment?.destination,
  })

  let verdict: 'PASS' | 'WARNING' | 'CRITICAL' = 'PASS'
  if (!ledgerAudit.identitySatisfied || sanctionsAudit.riskLevel === 'CRITICAL' || sanctionsAudit.riskLevel === 'HIGH') {
    verdict = 'CRITICAL'
  } else if (!ledgerAudit.chronologicalOrderValid || !ledgerAudit.currencyConsistent || borderRoutingAudit.transitIssues.length > 0) {
    verdict = 'WARNING'
  }

  const recommendations: string[] = []
  if (!ledgerAudit.identitySatisfied) {
    recommendations.push(
      `Reconcile account ledger balance: Adjust current balance by ${ledgerAudit.discrepancy} to satisfy Net Balance = Total Debit - Total Credit.`
    )
  }
  if (!ledgerAudit.chronologicalOrderValid) {
    recommendations.push('Sort ledger transactions in ascending chronological order by transaction date.')
  }
  if (borderRoutingAudit.transitIssues.length > 0) {
    recommendations.push(...borderRoutingAudit.transitIssues)
  }
  if (!sanctionsAudit.passed) {
    recommendations.push('Escalate to Compliance Officer for manual document clearance before issuing BOL.')
  }
  if (recommendations.length === 0) {
    recommendations.push('All mathematical invariance, border transit routing, and trade compliance gates passed.')
  }

  let executiveSummary = `Verification completed with verdict ${verdict}. Ledger Identity: ${
    ledgerAudit.identitySatisfied ? 'SATISFIED' : 'DISCREPANCY'
  } (Debit: $${ledgerAudit.totalDebit}, Credit: $${ledgerAudit.totalCredit}, Net: $${ledgerAudit.expectedBalance}). Border Routing: ${
    borderRoutingAudit.isRecognizedBorder ? 'RECOGNIZED' : 'UNVERIFIED'
  }. Compliance: ${sanctionsAudit.riskLevel}.`

  let aiSynthesized = false

  // Optional Gemini synthesis if requested and enabled
  if (params.useAiSynthesis) {
    try {
      const prompt = `Synthesize this logistics & accounting audit report into a professional 2-sentence executive summary:\n- Verdict: ${verdict}\n- Ledger Discrepancy: ${ledgerAudit.discrepancy}\n- Border Status: ${borderRoutingAudit.borderStation}\n- Sanctions Risk: ${sanctionsAudit.riskLevel}`
      const aiRes = await generateAICompletion(prompt, {
        systemPrompt:
          'You are Sky Ariana Chief Compliance Officer. Summarize findings with zero hallucination and strict adherence to provided numbers.',
      })
      if (aiRes?.text) {
        executiveSummary = aiRes.text.trim()
        aiSynthesized = true
      }
    } catch {
      // Deterministic fallback preserved
    }
  }

  return {
    timestamp: new Date().toISOString(),
    verdict,
    ledgerAudit,
    borderRoutingAudit,
    sanctionsAudit,
    executiveSummary,
    actionableRecommendations: recommendations,
    aiSynthesized,
  }
}
