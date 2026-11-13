const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const loadTypescript = require('./load-typescript.cjs')

const {
  testAIConnection,
  updateAIAssistantConfig,
  getAIAssistantConfig,
  normalizeGeminiModel,
} = loadTypescript('lib/ai/ai-provider.ts')

test('AI Connection Resilience: offline_local provider succeeds without external network', async () => {
  // Set to offline_local
  await updateAIAssistantConfig({ provider: 'offline_local' })
  
  const res = await testAIConnection()
  assert.strictEqual(res.success, true, 'Offline provider must succeed in testing')
  assert.match(res.message, /Offline Deterministic Engine/i, 'Must confirm offline engine status')
  assert.strictEqual(res.model, 'Offline Deterministic Engine')
})

test('AI Connection Resilience: testAIConnection returns structured result', async () => {
  const res = await testAIConnection()
  assert.strictEqual(typeof res.success, 'boolean')
  assert.strictEqual(typeof res.message, 'string')
  assert.ok(res.message.length > 0)
})
