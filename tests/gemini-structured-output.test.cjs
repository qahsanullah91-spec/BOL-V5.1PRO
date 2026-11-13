const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const loadTypescript = require('./load-typescript.cjs')

// Load modules under test
const {
  normalizeGeminiModel,
  isSupportedGeminiModel,
  DEFAULT_AI_CONFIG,
} = loadTypescript('lib/ai/ai-provider.ts')

const {
  BOL_EXTRACTION_JSON_SCHEMA,
  LEDGER_EXTRACTION_JSON_SCHEMA,
  VERIFICATION_AUDIT_JSON_SCHEMA,
} = loadTypescript('lib/ai/schemas/bol-schema.ts')

const {
  auditLedgerAccount,
  auditBorderRouting,
  auditSanctionsAndCompliance,
  runComprehensiveVerification,
  RECOGNIZED_AFGHAN_BORDER_STATIONS,
} = loadTypescript('lib/ai/smart-verification.ts')

const {
  routeUserIntent,
} = loadTypescript('lib/ai/intent-router.ts')

const {
  checkIntentPermission,
} = loadTypescript('lib/ai/permission-filter.ts')

// ============================================================================
// Test Suite 1: Gemini Model Normalization & Current Model Standards
// ============================================================================

test('1. Model Normalization: auto-upgrades deprecated models to gemini-3.8-flash', () => {
  // Legacy models MUST be substituted with gemini-3.8-flash
  assert.strictEqual(normalizeGeminiModel('gemini-flash-latest'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-2.5-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-2.0-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-1.5-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-1.5-pro'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-pro'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel(''), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel(undefined), 'gemini-3.8-flash')

  // Current active models must be preserved intact
  assert.strictEqual(normalizeGeminiModel('gemini-4-argon'), 'gemini-4-argon')
  assert.strictEqual(normalizeGeminiModel('gemini-3.8-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-3.5-flash-lite'), 'gemini-3.5-flash-lite')
  assert.strictEqual(normalizeGeminiModel('gemini-3.1-flash-lite'), 'gemini-3.1-flash-lite')

  // Default system configuration uses gemini-3.8-flash
  assert.strictEqual(DEFAULT_AI_CONFIG.model, 'gemini-3.8-flash')
  assert.strictEqual(isSupportedGeminiModel('gemini-3.8-flash'), true)
  assert.strictEqual(isSupportedGeminiModel('gemini-4-argon'), true)
})

// ============================================================================
// Test Suite 2: Strict OpenAPI / JSON Schema Validation
// ============================================================================

test('2. Schema Definitions: strict OpenAPI/JSON schemas for BOL and Ledger', () => {
  // BOL Schema
  assert.strictEqual(BOL_EXTRACTION_JSON_SCHEMA.type, 'object')
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.consignee_name)
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.cargo_description)
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.transit_border_station)
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.routes)
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.truck_number)
  assert.ok(BOL_EXTRACTION_JSON_SCHEMA.properties.driver_name)
  assert.deepStrictEqual(BOL_EXTRACTION_JSON_SCHEMA.required, ['consignee_name', 'cargo_description'])

  // Ledger Schema
  assert.strictEqual(LEDGER_EXTRACTION_JSON_SCHEMA.type, 'object')
  assert.ok(LEDGER_EXTRACTION_JSON_SCHEMA.properties.account_name)
  assert.ok(LEDGER_EXTRACTION_JSON_SCHEMA.properties.debit)
  assert.ok(LEDGER_EXTRACTION_JSON_SCHEMA.properties.credit)
  assert.ok(LEDGER_EXTRACTION_JSON_SCHEMA.properties.currency)
  assert.deepStrictEqual(LEDGER_EXTRACTION_JSON_SCHEMA.required, [
    'account_name',
    'transaction_date',
    'transaction_type',
    'currency',
  ])

  // Verification Audit Schema
  assert.strictEqual(VERIFICATION_AUDIT_JSON_SCHEMA.type, 'object')
  assert.ok(VERIFICATION_AUDIT_JSON_SCHEMA.properties.ledgerAudit)
  assert.ok(VERIFICATION_AUDIT_JSON_SCHEMA.properties.borderRoutingAudit)
  assert.ok(VERIFICATION_AUDIT_JSON_SCHEMA.properties.sanctionsAudit)
})

// ============================================================================
// Test Suite 3: Deterministic Accounting Invariance Identity Audit
// ============================================================================

test('3. Ledger Invariance: Net Balance = Total Debit - Total Credit with chronological checks', () => {
  // Case A: Perfect Invariance
  const balancedAccount = {
    total_debit: 5000,
    total_credit: 2000,
    current_balance: 3000,
    currency: 'USD',
  }
  const balancedTransactions = [
    { id: 'tx-1', debit: 3000, credit: 0, transaction_date: '2026-10-01', currency: 'USD' },
    { id: 'tx-2', debit: 2000, credit: 0, transaction_date: '2026-10-05', currency: 'USD' },
    { id: 'tx-3', debit: 0, credit: 2000, transaction_date: '2026-10-10', currency: 'USD' },
  ]
  const auditA = auditLedgerAccount(balancedAccount, balancedTransactions)
  assert.strictEqual(auditA.identitySatisfied, true)
  assert.strictEqual(auditA.discrepancy, 0)
  assert.strictEqual(auditA.totalDebit, 5000)
  assert.strictEqual(auditA.totalCredit, 2000)
  assert.strictEqual(auditA.expectedBalance, 3000)
  assert.strictEqual(auditA.chronologicalOrderValid, true)
  assert.strictEqual(auditA.currencyConsistent, true)
  assert.strictEqual(auditA.anomalies.length, 0)

  // Case B: Invariance Discrepancy
  const brokenAccount = {
    total_debit: 5000,
    total_credit: 2000,
    current_balance: 4500, // Discrepancy: 1500
    currency: 'USD',
  }
  const auditB = auditLedgerAccount(brokenAccount, balancedTransactions)
  assert.strictEqual(auditB.identitySatisfied, false)
  assert.strictEqual(auditB.discrepancy, 1500)
  assert.ok(auditB.anomalies.length >= 1)
  assert.ok(auditB.anomalies[0].includes('Accounting invariance breached'))

  // Case C: Chronological Out-of-Order Entries
  const outOfOrderTransactions = [
    { id: 'tx-1', debit: 1000, credit: 0, transaction_date: '2026-10-15', currency: 'USD' },
    { id: 'tx-2', debit: 1000, credit: 0, transaction_date: '2026-10-02', currency: 'USD' }, // earlier than tx-1!
  ]
  const auditC = auditLedgerAccount({ total_debit: 2000, total_credit: 0, current_balance: 2000 }, outOfOrderTransactions)
  assert.strictEqual(auditC.chronologicalOrderValid, false)
  assert.ok(auditC.anomalies.some((m) => m.includes('Chronological sequencing violation')))

  // Case D: Currency Conflict (USD account containing AFN entry)
  const currencyConflictTransactions = [
    { id: 'tx-1', debit: 1000, credit: 0, transaction_date: '2026-10-01', currency: 'USD' },
    { id: 'tx-2', debit: 75000, credit: 0, transaction_date: '2026-10-02', currency: 'AFN' }, // currency conflict!
  ]
  const auditD = auditLedgerAccount({ currency: 'USD', total_debit: 76000, total_credit: 0, current_balance: 76000 }, currencyConflictTransactions)
  assert.strictEqual(auditD.currencyConsistent, false)
  assert.ok(auditD.anomalies.some((m) => m.includes('Multi-currency conflict')))
})

// ============================================================================
// Test Suite 4: Multi-Modal Border Station Routing Verification
// ============================================================================

test('4. Border Station Routing: validates recognized stations and route continuity', () => {
  // Case A: Valid recognized border station (Islam Qala) with proper sequence
  const validShipment = {
    origin: 'Kandahar',
    destination: 'Nhava Sheva, IN',
    borderStation: 'Islam Qala',
    truckNumber: 'HRT-81745',
    driverName: 'Mohammad Rahim',
    routes: [
      { id: 'r1', location: 'Kandahar', stopOrder: 1, transportMode: 'truck' },
      { id: 'r2', location: 'Islam Qala', stopOrder: 2, transportMode: 'truck' },
      { id: 'r3', location: 'Bandar Abbas', stopOrder: 3, transportMode: 'truck' },
      { id: 'r4', location: 'Nhava Sheva', stopOrder: 4, transportMode: 'vessel' },
    ],
  }
  const auditA = auditBorderRouting(validShipment)
  assert.strictEqual(auditA.isRecognizedBorder, true)
  assert.strictEqual(auditA.routeContinuityValid, true)
  assert.strictEqual(auditA.transitIssues.length, 0)
  assert.strictEqual(auditA.detectedStopsCount, 4)

  // Case B: Unrecognized border station
  const unknownBorderShipment = {
    origin: 'Kabul',
    destination: 'Dubai',
    borderStation: 'Unknown Mountain Pass 99',
    routes: [
      { id: 'r1', location: 'Kabul', stopOrder: 1, transportMode: 'truck' },
      { id: 'r2', location: 'Unknown Mountain Pass 99', stopOrder: 2, transportMode: 'truck' },
    ],
  }
  const auditB = auditBorderRouting(unknownBorderShipment)
  assert.strictEqual(auditB.isRecognizedBorder, false)
  assert.ok(auditB.transitIssues.some((m) => m.includes('official Sky Ariana recognized border gates')))

  // Case C: Broken sequencing (stopOrder out of sequence)
  const brokenSequenceShipment = {
    origin: 'Herat',
    destination: 'Torghundi',
    borderStation: 'Torghundi',
    routes: [
      { id: 'r1', location: 'Herat', stopOrder: 1, transportMode: 'truck' },
      { id: 'r2', location: 'Torghundi', stopOrder: 5, transportMode: 'truck' }, // jumped from 1 to 5
    ],
  }
  const auditC = auditBorderRouting(brokenSequenceShipment)
  assert.strictEqual(auditC.routeContinuityValid, false)
  assert.ok(auditC.transitIssues.some((m) => m.includes('Stop sequencing broken')))

  // Verify list of Afghan borders contains Islam Qala, Torghundi, Hairatan, Spin Boldak, Zaranj
  const stationNames = RECOGNIZED_AFGHAN_BORDER_STATIONS.map((s) => s.name)
  assert.ok(stationNames.includes('Islam Qala'))
  assert.ok(stationNames.includes('Torghundi'))
  assert.ok(stationNames.includes('Hairatan'))
  assert.ok(stationNames.includes('Spin Boldak'))
  assert.ok(stationNames.includes('Zaranj / Milak'))
})

// ============================================================================
// Test Suite 5: Trade Compliance & Sanctions Screening
// ============================================================================

test('5. Sanctions Screening: catches restricted terms and dual-use cargo', () => {
  // Case A: Clean commercial logistics shipment
  const cleanShipment = {
    shipper: 'Aryana Fresh Fruit Co',
    consignee: 'Haji Noor Trading LLC',
    cargo: '1,427 Cartons Dried Raisins and Saffron',
    origin: 'Kandahar',
    destination: 'Nhava Sheva',
  }
  const auditA = auditSanctionsAndCompliance(cleanShipment)
  assert.strictEqual(auditA.passed, true)
  assert.strictEqual(auditA.riskLevel, 'CLEAN')
  assert.strictEqual(auditA.flaggedKeywords.length, 0)
  assert.ok(auditA.advisory.includes('cleared for standard Afghan transit'))

  // Case B: Restricted / Prohibited keyword match
  const flaggedShipment = {
    shipper: 'Suspicious Import Corp',
    consignee: 'Unknown Recipient',
    cargo: 'Heavy tactical gear and ammunition supplies',
    origin: 'Border Area',
    destination: 'Conflict Zone',
  }
  const auditB = auditSanctionsAndCompliance(flaggedShipment)
  assert.strictEqual(auditB.passed, false)
  assert.strictEqual(auditB.riskLevel, 'HIGH')
  assert.ok(auditB.flaggedKeywords.includes('ammunition'))
  assert.ok(auditB.flaggedKeywords.includes('tactical gear'))
  assert.ok(auditB.advisory.includes('Compliance warning: Prohibited / dual-use terms detected'))
})

// ============================================================================
// Test Suite 6: Comprehensive Verification Integration
// ============================================================================

test('6. Comprehensive Verification: aggregates ledger, routing, and compliance', async () => {
  const result = await runComprehensiveVerification({
    account: { total_debit: 10000, total_credit: 4000, current_balance: 6000, currency: 'USD' },
    transactions: [
      { id: 'tx-1', debit: 10000, credit: 0, transaction_date: '2026-10-01', currency: 'USD' },
      { id: 'tx-2', debit: 0, credit: 4000, transaction_date: '2026-10-05', currency: 'USD' },
    ],
    shipment: {
      origin: 'Kandahar',
      destination: 'Nhava Sheva',
      transit_border_station: 'Islam Qala',
      truck_number: 'HRT-81745',
      driver_name: 'Mohammad Rahim',
      shipper_name: 'Aryana Fruits',
      consignee_name: 'Haji Noor Trading',
      cargo_description: 'Dried Figs',
    },
    useAiSynthesis: false, // deterministic test
  })

  assert.strictEqual(result.verdict, 'PASS')
  assert.strictEqual(result.ledgerAudit.identitySatisfied, true)
  assert.strictEqual(result.borderRoutingAudit.isRecognizedBorder, true)
  assert.strictEqual(result.sanctionsAudit.passed, true)
  assert.ok(result.executiveSummary.includes('PASS'))
  assert.ok(result.actionableRecommendations.length > 0)
})

// ============================================================================
// Test Suite 7: AI Assistant Intent & Permission Gating
// ============================================================================

test('7. Intent Router & Permission Gate: routes SMART_VERIFICATION and gates by role', () => {
  // Intent Router
  const parsed1 = routeUserIntent('verify ledger discrepancies for Haji Noor Trading')
  assert.strictEqual(parsed1.intent, 'SMART_VERIFICATION')

  const parsed2 = routeUserIntent('audit accounting invariance identity')
  assert.strictEqual(parsed2.intent, 'SMART_VERIFICATION')

  const parsed3 = routeUserIntent('check border routing and sanctions for shipment NSA-583')
  assert.strictEqual(parsed3.intent, 'SMART_VERIFICATION')

  // Permission Gate
  const clientUser = {
    userId: 'usr-client',
    username: 'client_user',
    name: 'Client Shipper',
    role: 'client',
    isClientUser: true,
  }
  const staffOpsUser = {
    userId: 'usr-ops',
    username: 'ops_user',
    name: 'Operations Officer',
    role: 'operations',
  }

  const clientCheck = checkIntentPermission(clientUser, 'SMART_VERIFICATION')
  assert.strictEqual(clientCheck.allowed, false, 'Client user must not access internal verification audit')

  const staffCheck = checkIntentPermission(staffOpsUser, 'SMART_VERIFICATION')
  assert.strictEqual(staffCheck.allowed, true, 'Staff operations user must have access to smart verification')
})
