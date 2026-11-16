/**
 * Unit Test Suite for Google Antigravity SDK Agent Integration
 * Verifies Python agent execution, multi-tool telemetry, Pydantic structured output,
 * and strict accounting invariance identity: Net Balance == Total Debit - Total Credit.
 */

const test = require('node:test')
const assert = require('node:assert')
const { spawnSync } = require('child_process')
const path = require('path')

const cwd = path.resolve(__dirname, '..')
const pythonExe = process.platform === 'win32'
  ? path.join(cwd, '.venv', 'Scripts', 'python.exe')
  : path.join(cwd, '.venv', 'bin', 'python')
const scriptPath = path.join(cwd, 'scripts', 'ai', 'sky_antigravity_agent.py')

test('1. Antigravity Agent: Executes container lookup with multi-tool telemetry', () => {
  const run = spawnSync(pythonExe, [scriptPath, '--query', 'Where are active containers?', '--user', 'admin'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  })

  assert.strictEqual(run.status, 0, `Python exited with code ${run.status}: ${run.stderr}`)
  const parsed = JSON.parse(run.stdout)
  assert.strictEqual(parsed.success, true)
  assert.strictEqual(parsed.intent, 'QUERY_CONTAINER')
  assert.ok(parsed.tools_called.length > 0)
  assert.strictEqual(parsed.tools_called[0].tool_name, 'lookup_container')
  assert.ok(parsed.cards.length > 0)
  assert.strictEqual(parsed.cards[0].type, 'CONTAINER')
})

test('2. Antigravity Agent: Strict Accounting Invariance (Net Balance == Total Debit - Total Credit)', () => {
  const run = spawnSync(pythonExe, [scriptPath, '--query', 'Audit customer balances and net position', '--user', 'finance_officer'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  })

  assert.strictEqual(run.status, 0, `Python exited with code ${run.status}`)
  const parsed = JSON.parse(run.stdout)
  assert.strictEqual(parsed.success, true)
  assert.strictEqual(parsed.intent, 'FINANCIAL_INVARIANCE_AUDIT')
  assert.strictEqual(parsed.invariance_passed, true)
  
  // Mathematical identity verification
  assert.ok(parsed.content.includes('\\text{Net Balance} = \\text{Total Debit} - \\text{Total Credit}'))
  const finCard = parsed.cards.find(c => c.type === 'FINANCIAL')
  assert.ok(finCard, 'Must contain financial invariance card')

  const debitItem = finCard.financials.find(f => f.label === 'Total Debit')
  const creditItem = finCard.financials.find(f => f.label === 'Total Credit')
  const netItem = finCard.financials.find(f => f.label === 'Net Position')

  assert.ok(debitItem && creditItem && netItem)
  const calculatedNet = debitItem.amount - creditItem.amount
  assert.ok(Math.abs(calculatedNet - netItem.amount) < 0.01, 'Mathematical invariance violated!')
})

test('3. Antigravity Agent: Overland Border Station & Truck Transit Queue', () => {
  const run = spawnSync(pythonExe, [scriptPath, '--query', 'Which trucks are at Islam Qala border?', '--user', 'ops_lead'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  })

  assert.strictEqual(run.status, 0, `Python exited with code ${run.status}`)
  const parsed = JSON.parse(run.stdout)
  assert.strictEqual(parsed.success, true)
  assert.strictEqual(parsed.intent, 'BORDER_STATUS')
  assert.ok(parsed.tools_called.some(t => t.tool_name === 'check_border_delays'))
  assert.ok(parsed.cards.length > 0)
  assert.strictEqual(parsed.cards[0].type, 'TRUCK')
})

test('4. Antigravity Agent: Bilingual WhatsApp Dispatch Synthesis', () => {
  const run = spawnSync(pythonExe, [scriptPath, '--query', "Make today's WhatsApp shipment status", '--language', 'FA'], {
    cwd,
    encoding: 'utf-8',
    timeout: 15000,
  })

  assert.strictEqual(run.status, 0, `Python exited with code ${run.status}`)
  const parsed = JSON.parse(run.stdout)
  assert.strictEqual(parsed.success, true)
  assert.strictEqual(parsed.intent, 'WHATSAPP_DISPATCH')
  assert.ok(parsed.content.includes('wa.me') || parsed.content.includes('واتساپ'))
  assert.ok(parsed.cards.some(c => c.type === 'WHATSAPP_DISPATCH'))
})
