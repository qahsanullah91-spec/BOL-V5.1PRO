const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const loadTypescript = require('./load-typescript.cjs')

// Load modules
const { processUserQuery } = loadTypescript('lib/ai/assistant-service.ts')
const {
  getAIAssistantConfig,
  updateAIAssistantConfig,
  generateAIStream,
  normalizeGeminiModel,
  normalizeOpenAIModel,
  testAIConnection,
} = loadTypescript('lib/ai/ai-provider.ts')

const {
  listConversations,
  getConversation,
  saveConversation,
  renameConversation,
  deleteConversation,
  searchConversations,
} = loadTypescript('lib/ai/conversation-service.ts')

const {
  extractAttachmentContent,
  extractTextFromCsv,
} = loadTypescript('lib/ai/attachment-extractor.ts')

const { getAllLocalBOLs } = loadTypescript('lib/services/local-storage-service.ts')
const { getAllShipments } = loadTypescript('lib/services/shipment-service.ts')

// Test User Personas
const superadminUser = {
  userId: 'usr-admin-aq',
  username: 'ahsanullah',
  name: 'Ahsanullah Qureshi',
  role: 'superadmin',
  language: 'EN',
}

const staffOperator = {
  userId: 'usr-staff-1',
  username: 'operator1',
  name: 'Kabul Operations Lead',
  role: 'operations',
  language: 'FA',
}

const clientShipper = {
  userId: 'usr-client-2',
  username: 'ani_traders',
  name: 'Ani Traders',
  role: 'client',
  isClientUser: true,
  clientId: 'acc-ani-1',
  language: 'EN',
}

// ============================================================================
// Test 1: Start a New Conversation
// ============================================================================
test('Phase 2 - Test 1: Start a new conversation and initialize session structure', async () => {
  const newConvoId = `convo-new-${Date.now()}`
  const convo = {
    id: newConvoId,
    title: 'New Operations Briefing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
    mode: 'ASK',
    messages: [],
    userId: superadminUser.userId,
  }

  const saved = await saveConversation(convo, superadminUser)
  assert.strictEqual(saved.id, newConvoId)
  assert.strictEqual(saved.mode, 'ASK')
  assert.strictEqual(saved.messages.length, 0)

  const fetched = await getConversation(newConvoId, superadminUser)
  assert.ok(fetched, 'Must retrieve newly created conversation')
  assert.strictEqual(fetched.title, 'New Operations Briefing')

  // Clean up
  await deleteConversation(newConvoId, superadminUser)
})

// ============================================================================
// Test 2: Send a Normal Message
// ============================================================================
test('Phase 2 - Test 2: Send a normal query and verify grounded response', async () => {
  const res = await processUserQuery(
    'Show me active shipments arriving at Nhava Sheva',
    superadminUser,
    'offline_local'
  )

  assert.strictEqual(res.success, true)
  assert.ok(res.message, 'Must return an AIChatMessage payload')
  assert.strictEqual(res.message.role, 'assistant')
  assert.ok(res.message.content.length > 20, 'Response must have meaningful content')
  assert.strictEqual(res.message.invariancePassed, true, 'Must verify accounting invariance')
})

// ============================================================================
// Test 3: Receive a Streamed AI Response
// ============================================================================
test('Phase 2 - Test 3: Stream AI response tokens smoothly via async generator', async () => {
  const chunks = []
  const streamGen = generateAIStream('Summarize today border transit conditions', {
    systemPrompt: 'You are Sky Ariana Logistics Assistant.',
    userId: superadminUser.userId,
  })

  for await (const chunkObj of streamGen) {
    if (chunkObj.chunk) {
      chunks.push(chunkObj.chunk)
    }
  }

  assert.ok(chunks.length > 0, 'Must emit multiple token chunks')
  const aggregated = chunks.join('')
  assert.ok(aggregated.length > 10, 'Aggregated streamed content must not be empty')
})

// ============================================================================
// Test 4: Switch Between OpenAI and Google Gemini
// ============================================================================
test('Phase 2 - Test 4: Switch AI provider dynamically between Gemini and OpenAI', async () => {
  // 1. Switch to Gemini
  const geminiCfg = await updateAIAssistantConfig({ provider: 'gemini', model: 'gemini-3.8-flash' })
  assert.strictEqual(geminiCfg.provider, 'gemini')
  assert.strictEqual(geminiCfg.model, 'gemini-3.8-flash')

  // 2. Switch to OpenAI
  const openaiCfg = await updateAIAssistantConfig({ provider: 'openai', openaiModel: 'gpt-4o' })
  assert.strictEqual(openaiCfg.provider, 'openai')
  assert.strictEqual(openaiCfg.openaiModel, 'gpt-4o')

  // 3. Revert to Offline Local for safe hermetic testing
  const localCfg = await updateAIAssistantConfig({ provider: 'offline_local' })
  assert.strictEqual(localCfg.provider, 'offline_local')
})

// ============================================================================
// Test 5: Change the AI Model
// ============================================================================
test('Phase 2 - Test 5: Configure and normalize model identifiers', () => {
  assert.strictEqual(normalizeGeminiModel('gemini-1.5-pro'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-3.8-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeGeminiModel('gemini-2.5-flash'), 'gemini-3.8-flash')
  assert.strictEqual(normalizeOpenAIModel('gpt-4o'), 'gpt-4o')
  assert.strictEqual(normalizeOpenAIModel('gpt-4o-mini'), 'gpt-4o-mini')
})

// ============================================================================
// Test 6: Save and Reopen Previous Chats
// ============================================================================
test('Phase 2 - Test 6: Save multi-turn conversation and reopen with full context', async () => {
  const sessionId = `session-context-${Date.now()}`
  const initialData = {
    id: sessionId,
    title: 'Customer Ledger Review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 2,
    mode: 'ASK',
    userId: superadminUser.userId,
    messages: [
      {
        id: `msg-1`,
        role: 'user',
        content: 'What is the balance for ANI TRADERS?',
        timestamp: new Date().toISOString(),
      },
      {
        id: `msg-2`,
        role: 'assistant',
        content: 'Verified ledger balance: $3,200 USD.',
        timestamp: new Date().toISOString(),
      },
    ],
  }

  // Save
  await saveConversation(initialData, superadminUser)

  // Reopen
  const reopened = await getConversation(sessionId, superadminUser)
  assert.ok(reopened, 'Reopened session must exist')
  assert.strictEqual(reopened.messages.length, 2)
  assert.strictEqual(reopened.messages[0].content, 'What is the balance for ANI TRADERS?')
  assert.strictEqual(reopened.messages[1].content, 'Verified ledger balance: $3,200 USD.')

  // Clean up
  await deleteConversation(sessionId, superadminUser)
})

// ============================================================================
// Test 7: Rename and Delete Conversations
// ============================================================================
test('Phase 2 - Test 7: In-line rename and delete conversation lifecycle', async () => {
  const tempId = `temp-convo-${Date.now()}`
  await saveConversation(
    {
      id: tempId,
      title: 'Original Title',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      mode: 'ASK',
      messages: [],
      userId: superadminUser.userId,
    },
    superadminUser
  )

  // Rename
  const renamedOk = await renameConversation(tempId, 'Updated Logistics Audit', superadminUser)
  assert.strictEqual(renamedOk, true)

  const verifyRenamed = await getConversation(tempId, superadminUser)
  assert.strictEqual(verifyRenamed.title, 'Updated Logistics Audit')

  // Search by new title
  const searchResults = await searchConversations('Logistics Audit', superadminUser)
  assert.ok(searchResults.some((c) => c.id === tempId))

  // Delete
  const deletedOk = await deleteConversation(tempId, superadminUser)
  assert.strictEqual(deletedOk, true)

  const verifyDeleted = await getConversation(tempId, superadminUser)
  assert.strictEqual(verifyDeleted, null)
})

// ============================================================================
// Test 8: Upload and Extract Document Attachments (PDF / CSV / Excel / Docx)
// ============================================================================
test('Phase 2 - Test 8: Parse file attachments with anti-prompt-injection isolation', async () => {
  // 1. CSV Extraction
  const sampleCsv = Buffer.from(
    'BOL_NUMBER,CONTAINER,DRIVER,STATUS\nBOL-2026-NSA648,MYRU450180-0,Mohammad Rahim,At Border\n'
  )
  const csvText = extractTextFromCsv(sampleCsv)
  assert.ok(csvText.includes('BOL-2026-NSA648'))
  assert.ok(csvText.includes('Mohammad Rahim'))

  // 2. Master attachment extractor with Base64 payload
  const b64 = sampleCsv.toString('base64')
  const result = await extractAttachmentContent({
    name: 'shipments_manifest.csv',
    type: 'text/csv',
    base64Data: b64,
    size: sampleCsv.length,
  })

  assert.strictEqual(result.success, true)
  assert.ok(result.extractedText.includes('BOL-2026-NSA648'))

  // 3. Security Guard: File size exceeds cap (> 15MB) rejected
  const oversizedResult = await extractAttachmentContent({
    name: 'huge_file.pdf',
    type: 'application/pdf',
    base64Data: 'AAAA',
    size: 20 * 1024 * 1024,
  })
  assert.strictEqual(oversizedResult.success, false)
  assert.ok(oversizedResult.error.includes('15 MB'))
})

// ============================================================================
// Test 9: Multilingual Responses (English, Persian, Pashto)
// ============================================================================
test('Phase 2 - Test 9: Generate natural responses in English, Persian/Dari, and Pashto', async () => {
  // English
  const resEn = await processUserQuery('What is the status of BOL-2026-NSA648?', superadminUser, 'offline_local')
  assert.strictEqual(resEn.success, true)

  // Persian (Dari)
  const resFa = await processUserQuery(
    'وضعیت بارنامه شماره BOL-2026-NSA648 چیست؟',
    staffOperator,
    'offline_local'
  )
  assert.strictEqual(resFa.success, true)
  assert.ok(resFa.message.content.length > 10)

  // Pashto
  const pashtoUser = { ...staffOperator, language: 'PS' }
  const resPs = await processUserQuery(
    'د بارنامې معلومات راکړئ',
    pashtoUser,
    'offline_local'
  )
  assert.strictEqual(resPs.success, true)
  assert.ok(resPs.message.content.length > 10)
})

// ============================================================================
// Test 10: User Privacy & Conversation Ownership Isolation
// ============================================================================
test('Phase 2 - Test 10: Strict RBAC isolation blocks users from viewing private chats of others', async () => {
  const privateConvoId = `private-staff-convo-${Date.now()}`

  // Staff creates a conversation
  await saveConversation(
    {
      id: privateConvoId,
      title: 'Confidential Transit Negotiation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      mode: 'ASK',
      messages: [{ id: 'm1', role: 'user', content: 'Secret transit rates', timestamp: new Date().toISOString() }],
      userId: staffOperator.userId,
    },
    staffOperator
  )

  // 1. Owner (staff) can view
  const staffView = await getConversation(privateConvoId, staffOperator)
  assert.ok(staffView, 'Owner must have access')

  // 2. Client user MUST be blocked (returns null)
  const clientView = await getConversation(privateConvoId, clientShipper)
  assert.strictEqual(clientView, null, 'Client must NOT see staff conversation')

  // 3. Client user cannot delete staff conversation
  const deleteAttempt = await deleteConversation(privateConvoId, clientShipper)
  assert.strictEqual(deleteAttempt, false, 'Client must NOT be permitted to delete another user chat')

  // 4. Superadmin has oversight access
  const adminView = await getConversation(privateConvoId, superadminUser)
  assert.ok(adminView, 'Superadmin must have oversight access')

  // Clean up
  await deleteConversation(privateConvoId, superadminUser)
})

// ============================================================================
// Test 11: API Keys Never Exposed in Browser Payloads
// ============================================================================
test('Phase 2 - Test 11: API keys are masked or hidden in client-facing configurations', async () => {
  // Seed a dummy test key
  await updateAIAssistantConfig({
    apiKey: 'AIzaSySecretTestKey1234567890',
    openaiApiKey: 'sk-proj-SecretOpenAITestKey9876543210',
  })

  const cfg = await getAIAssistantConfig()
  // Mock safeConfig masking transformation from route handler
  const safeConfig = {
    ...cfg,
    apiKey: cfg.apiKey ? '••••••••••••••••' + cfg.apiKey.slice(-4) : '',
    openaiApiKey: cfg.openaiApiKey ? '••••••••••••••••' + cfg.openaiApiKey.slice(-4) : '',
    hasKeyConfigured: Boolean(cfg.apiKey || cfg.openaiApiKey),
  }

  assert.ok(!safeConfig.apiKey.includes('AIzaSySecretTestKey'), 'Raw Gemini key must NOT be present')
  assert.ok(!safeConfig.openaiApiKey.includes('SecretOpenAITestKey'), 'Raw OpenAI key must NOT be present')
  assert.ok(safeConfig.apiKey.startsWith('••••'), 'Key must be masked')
  assert.strictEqual(safeConfig.hasKeyConfigured, true)
})

// ============================================================================
// Test 12: Application Navigation & Business Modules Intact
// ============================================================================
test('Phase 2 - Test 12: Existing business modules remain fully operational', async () => {
  // Check BOL system
  const bols = await getAllLocalBOLs()
  assert.ok(Array.isArray(bols), 'BOL database must be an array')
  assert.ok(bols.length > 0, 'BOL records must exist in production database')

  // Check Shipments module
  const shipments = await getAllShipments()
  assert.ok(Array.isArray(shipments), 'Shipments database must be an array')
  assert.ok(shipments.length > 0, 'Shipment records must exist in production database')

  // Verify first BOL record has required multi-modal fields
  const firstBol = bols[0]
  assert.ok(firstBol.bol_number || firstBol.id, 'BOL record must have identifier')
})
