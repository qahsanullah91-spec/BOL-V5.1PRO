const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const loadTypescript = require('./load-typescript.cjs')

// Load Upgraded AI Assistant modules
const {
  processUserQuery,
} = loadTypescript('lib/ai/assistant-service.ts')

const {
  generateWhatsAppMessageCard,
} = loadTypescript('lib/ai/whatsapp-generator.ts')

const {
  generateDocumentArtifact,
} = loadTypescript('lib/ai/document-generator.ts')

const {
  executeTool,
  REGISTERED_TOOLS,
} = loadTypescript('lib/ai/tool-registry.ts')

const {
  getAIAssistantConfig,
  updateAIAssistantConfig,
  testAIConnection,
  normalizeGeminiModel,
  normalizeOpenAIModel,
} = loadTypescript('lib/ai/ai-provider.ts')

const {
  listConversations,
  saveConversation,
  getConversation,
  renameConversation,
  deleteConversation,
  searchConversations,
} = loadTypescript('lib/ai/conversation-service.ts')

const {
  createActionProposal,
  executeConfirmedAction,
} = loadTypescript('lib/ai/action-planner.ts')

// Test Users
const adminUser = {
  userId: 'usr-admin-1',
  username: 'ahsanullah',
  name: 'Ahsanullah Qureshi',
  role: 'superadmin',
  language: 'EN',
}

const viewerUser = {
  userId: 'usr-viewer-1',
  username: 'guest',
  name: 'Guest Viewer',
  role: 'viewer',
  language: 'EN',
}

const clientUser = {
  userId: 'usr-client-1',
  username: 'client1',
  name: 'Client User',
  role: 'client',
  isClientUser: true,
  clientId: 'acc-client-1',
  language: 'EN',
}

// ============================================================================
// Acceptance Test 1: WhatsApp Message Generation from verified record
// ============================================================================
test('Acceptance Test 1: AI generates verified WhatsApp message for BOL in English, Persian and Pashto', async () => {
  const sampleBol = {
    bol_number: 'BOL-2026-NSA648',
    truck_number: 'KBL-5821',
    driver_name: 'Mohammad Rahim',
    driver_contact: '+93700123456',
    driver_rent: '$1,800 USD',
    currentLocation: 'Islam Qala Border',
    destination: 'Kabul Customs Terminal',
    status: 'at_border',
  }

  // English WhatsApp
  const waCardEn = generateWhatsAppMessageCard({
    bol: sampleBol,
    category: 'SHIPMENT_UPDATE',
    language: 'EN',
  })

  assert.ok(waCardEn.message.includes('BOL-2026-NSA648'), 'Must include exact BOL number')
  assert.ok(waCardEn.message.includes('KBL-5821'), 'Must include exact truck plate')
  assert.ok(waCardEn.message.includes('Mohammad Rahim'), 'Must include driver name')
  assert.ok(waCardEn.waUrl.startsWith('https://wa.me/'), 'Must build valid wa.me URL')

  // Persian (Farsi) WhatsApp
  const waCardFa = generateWhatsAppMessageCard({
    bol: sampleBol,
    category: 'TRUCK_BORDER_UPDATE',
    language: 'FA',
  })
  assert.ok(waCardFa.message.includes('اسکای آریانا'), 'Must include company name in Persian')
  assert.ok(waCardFa.message.includes('BOL-2026-NSA648'), 'Must preserve exact BOL number in Persian')

  // Pashto WhatsApp
  const waCardPs = generateWhatsAppMessageCard({
    bol: sampleBol,
    category: 'TRUCK_BORDER_UPDATE',
    language: 'PS',
  })
  assert.ok(waCardPs.message.includes('اسکای آریانا'), 'Must include company name in Pashto')
  assert.ok(waCardPs.message.includes('BOL-2026-NSA648'), 'Must preserve exact BOL number in Pashto')
})

// ============================================================================
// Acceptance Test 2: Containers currently at port terminal
// ============================================================================
test('Acceptance Test 2: AI retrieves verified containers currently at Bandar Abbas', async () => {
  const res = await processUserQuery('Show me all containers currently at Bandar Abbas', adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  assert.ok(res.message.content.includes('Bandar Abbas') || res.message.content.includes('Port Terminal') || res.message.content.includes('Container'), 'Must reference port containers')
  assert.strictEqual(res.message.invariancePassed, true, 'Must maintain mathematical invariance')
})

// ============================================================================
// Acceptance Test 3: Missing Shipping Documents Check
// ============================================================================
test('Acceptance Test 3: AI audits shipments for missing documents and compliance gaps', async () => {
  const res = await processUserQuery('Which shipments are missing documents?', adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  assert.ok(res.message.content.includes('Missing') || res.message.content.includes('Compliance') || res.message.content.includes('Document'), 'Must list missing document details')
})

// ============================================================================
// Acceptance Test 4: Complete BOL PDF Generation & Artifact Link
// ============================================================================
test('Acceptance Test 4: AI generates complete BOL PDF artifact with downloadable URL', async () => {
  const bols = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../.local-bols.json'), 'utf8'))
  const testBolNumber = bols[0]?.bol_number || 'BOL-2026-NSA648'

  const res = await processUserQuery(`Generate the complete PDF for ${testBolNumber}`, adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  assert.ok(res.message.documentArtifact, 'Must return documentArtifact object')
  assert.strictEqual(res.message.documentArtifact.pagesCount, 3, 'Complete package must specify 3 pages')
  assert.ok(res.message.documentArtifact.downloadUrl.includes('/api/bol/pdf'), 'Must provide valid download URL')
})

// ============================================================================
// Acceptance Test 5: Invoice summary with Strict Accounting Invariance
// ============================================================================
test('Acceptance Test 5: AI calculates invoice balances strictly satisfying Net = Debit - Credit', async () => {
  const res = await processUserQuery('Calculate outstanding balances and show overdue invoices', adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  assert.strictEqual(res.message.invariancePassed, true, 'Accounting invariance identity must be strictly satisfied')
})

// ============================================================================
// Acceptance Test 6: Two-Phase Action Confirmation for status mutations
// ============================================================================
test('Acceptance Test 6: AI creates action proposal requiring confirmation before updating tracking', async () => {
  const res = await processUserQuery('Update status of BOL-2026-NSA648 to Reached Port Bandar Abbas', adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  assert.ok(res.message.actionProposal, 'Must return actionProposal object requiring confirmation')
  assert.strictEqual(res.message.actionProposal.requiresConfirmation, true)
  assert.strictEqual(res.message.actionProposal.confirmed, false)
})

// ============================================================================
// Acceptance Test 7: Unauthorized users blocked from privileged actions
// ============================================================================
test('Acceptance Test 7: Client user cannot access system audit trail or profit margins', async () => {
  const resAudit = await processUserQuery('Who changed system audit history?', clientUser, 'offline_local')
  assert.ok(resAudit.message.content.includes('Access Denied') || resAudit.message.isError, 'Must deny audit access to client')

  const resProfit = await processUserQuery('Show me profit margin for NSA583', viewerUser, 'offline_local')
  assert.ok(resProfit.message.content.includes('Access Denied') || resProfit.message.isError, 'Must deny profit margin to viewer')
})

// ============================================================================
// Acceptance Test 8: Nonexistent records report clear "Not Found" notice
// ============================================================================
test('Acceptance Test 8: AI explicitly reports when requested BOL record does not exist', async () => {
  const res = await processUserQuery('Show me BOL-9999-NONEXISTENT', adminUser, 'offline_local')
  assert.strictEqual(res.success, true)
  const contentLower = (res.message && res.message.content ? res.message.content : '').toLowerCase()
  assert.ok(
    contentLower.includes('no record') ||
    contentLower.includes('no matching records') ||
    contentLower.includes('not found') ||
    contentLower.includes('does not exist'),
    'Must clearly indicate nonexistent record without guessing'
  )
})

// ============================================================================
// Acceptance Test 9: Conversation persistence (Save, Get, Rename, Search, Delete)
// ============================================================================
test('Acceptance Test 9: Conversation lifecycle (Create, Retrieve, Rename, Search, Delete)', async () => {
  const testId = `test-convo-${Date.now()}`
  const initialConvo = {
    id: testId,
    title: 'Test Logistics Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 1,
    mode: 'WORK',
    messages: [
      {
        id: `msg-1-${Date.now()}`,
        role: 'user',
        content: 'Where are active containers?',
        timestamp: new Date().toISOString(),
      },
    ],
  }

  // 1. Save
  const saved = await saveConversation(initialConvo)
  assert.strictEqual(saved.id, testId)

  // 2. Retrieve
  const fetched = await getConversation(testId)
  assert.ok(fetched, 'Must retrieve saved conversation')
  assert.strictEqual(fetched.title, 'Test Logistics Session')

  // 3. Search
  const searchResults = await searchConversations('Logistics')
  assert.ok(searchResults.some((c) => c.id === testId), 'Must find conversation via keyword search')

  // 4. Rename
  const renamed = await renameConversation(testId, 'Renamed Logistics Session')
  assert.strictEqual(renamed, true)
  const fetchedRenamed = await getConversation(testId)
  assert.strictEqual(fetchedRenamed.title, 'Renamed Logistics Session')

  // 5. Delete
  const deleted = await deleteConversation(testId)
  assert.strictEqual(deleted, true)
  const fetchedDeleted = await getConversation(testId)
  assert.strictEqual(fetchedDeleted, null, 'Deleted conversation must not exist')
})

// ============================================================================
// Acceptance Test 10: Multi-Provider Configuration (OpenAI, Gemini, Local)
// ============================================================================
test('Acceptance Test 10: Multi-provider configuration and offline local verification', async () => {
  // Test 10.1: Offline Local Engine succeeds without internet
  await updateAIAssistantConfig({ provider: 'offline_local' })
  const localRes = await testAIConnection()
  assert.strictEqual(localRes.success, true)
  assert.strictEqual(localRes.model, 'Offline Deterministic Engine')

  // Test 10.2: Model Normalization
  assert.strictEqual(normalizeGeminiModel('gemini-1.5-pro'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-3.8-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeOpenAIModel('gpt-4o'), 'gpt-4o')

  // Test 10.3: Registered tools coverage
  const toolNames = REGISTERED_TOOLS.map((t) => t.name)
  assert.ok(toolNames.includes('search_shipments'))
  assert.ok(toolNames.includes('get_shipment_details'))
  assert.ok(toolNames.includes('search_containers'))
  assert.ok(toolNames.includes('get_container_location'))
  assert.ok(toolNames.includes('get_bol_details'))
  assert.ok(toolNames.includes('check_missing_documents'))
  assert.ok(toolNames.includes('get_invoice_details'))
  assert.ok(toolNames.includes('get_outstanding_balances'))
  assert.ok(toolNames.includes('generate_bol_pdf'))
  assert.ok(toolNames.includes('create_shipment_report'))
  assert.ok(toolNames.includes('prepare_whatsapp_message'))
  assert.ok(toolNames.includes('update_shipment_status'))
})
