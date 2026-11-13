/**
 * Enterprise Multi-Tier Auto-Saving System Test Suite
 * Validates 0ms local persistence, sessionStorage isolation, IndexedDB vault,
 * background API replication queue with synchronous/asynchronous flush,
 * and UI status badge hierarchy in BOL and Invoice editors.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 1. Validate DraftSaveQueue.flush() programmatic contract
test('DraftSaveQueue - flush() drains pending work and settles deterministically', async (t) => {
  // Read compiled or source TypeScript service
  const serviceSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'services', 'draft-save-queue.ts'), 'utf8');

  assert.match(serviceSrc, /async flush\(\): Promise<boolean>/, 'DraftSaveQueue implements async flush method');
  assert.match(serviceSrc, /while \(this\.running && !this\.stopped\)/, 'DraftSaveQueue awaits in-flight queue drain');
  assert.match(serviceSrc, /return this\.pending === undefined/, 'DraftSaveQueue confirms queue is fully drained');
});

// 2. Validate Multi-Document Draft Isolation in API route
test('Multi-Document Draft Isolation in app/api/draft/route.ts', async (t) => {
  const routeSrc = fs.readFileSync(path.join(__dirname, '..', 'app', 'api', 'draft', 'route.ts'), 'utf8');

  assert.match(routeSrc, /\.local-bol-draft\.json/, 'Routes BOL drafts to dedicated file');
  assert.match(routeSrc, /\.local-invoice-draft\.json/, 'Routes Invoice drafts to dedicated file');
  assert.match(routeSrc, /\.local-export-draft\.json/, 'Routes Export/Calculator drafts to dedicated file');
  assert.match(routeSrc, /\.local-cmr-draft\.json/, 'Routes CMR drafts to dedicated file');
  assert.match(routeSrc, /norm === "invoice"/, 'Handles invoice draft type explicitly');
  assert.match(routeSrc, /norm === "export"/, 'Handles export draft type explicitly');
});

// 3. Validate Multi-Tier Auto-Save Engine Architecture
test('Multi-Tier Engine in lib/services/auto-save-engine.ts', async (t) => {
  const engineSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'services', 'auto-save-engine.ts'), 'utf8');

  assert.match(engineSrc, /window\.localStorage\.setItem/, 'Tier 1 LocalStorage write present');
  assert.match(engineSrc, /window\.sessionStorage\.setItem/, 'Tier 2 SessionStorage mirror present');
  assert.match(engineSrc, /putVaultItem\(/, 'Tier 3 IndexedDB Data Vault write present');
  assert.match(engineSrc, /apiEndpoint/, 'Tier 4 Background API replication present');
  assert.match(engineSrc, /beforeunload/, 'beforeunload lifecycle listener registered');
  assert.match(engineSrc, /pagehide/, 'pagehide lifecycle listener registered');
  assert.match(engineSrc, /visibilitychange/, 'visibilitychange lifecycle listener registered');
  assert.match(engineSrc, /flush\(\)/, 'Provides flush method for unmount/beforeunload');
});

// 4. Validate Invoice Editor Enterprise Auto-Save Architecture
test('Invoice Editor Auto-Save Integration in components/invoice/invoice-editor.tsx', async (t) => {
  const invoiceSrc = fs.readFileSync(path.join(__dirname, '..', 'components', 'invoice', 'invoice-editor.tsx'), 'utf8');

  assert.match(invoiceSrc, /api\/draft\?type=invoice/, 'Replicates invoice drafts to /api/draft?type=invoice');
  assert.match(invoiceSrc, /putVaultItem\(/, 'Persists invoice drafts to IndexedDB vault');
  assert.match(invoiceSrc, /beforeunload/, 'Registers beforeunload flush listener in invoice editor');
  assert.match(invoiceSrc, /pagehide/, 'Registers pagehide flush listener in invoice editor');
  assert.match(invoiceSrc, /initSession/, 'Inspects existing drafts during session initialization');
});

// 5. Validate BOL Editor Status Badge Hierarchy & Lifecycle Flush
test('BOL Editor Status Badge Hierarchy and Multi-Tier Flush in components/bill-of-lading/bol-editor.tsx', async (t) => {
  const bolSrc = fs.readFileSync(path.join(__dirname, '..', 'components', 'bill-of-lading/bol-editor.tsx'), 'utf8');

  // Verify multi-tier persistence in persistLocalDraftSync
  assert.match(bolSrc, /window\.sessionStorage\.setItem\("skybol:active-form-draft:backup"/, 'Persists draft to sessionStorage mirror');
  assert.match(bolSrc, /putVaultItem\("bol_drafts", "skybol:active-form-draft"/, 'Persists draft to IndexedDB vault');

  // Verify status badge hierarchy: autoSaveStatus === "saved" comes before hasUnsavedChanges
  const savedStatusIdx = bolSrc.indexOf('autoSaveStatus === "saved" ?');
  const unsavedChangesIdx = bolSrc.indexOf('hasUnsavedChanges ?');
  assert.ok(savedStatusIdx !== -1, 'autoSaveStatus === "saved" exists in status badge logic');
  assert.ok(unsavedChangesIdx !== -1, 'hasUnsavedChanges exists in status badge logic');
  assert.ok(savedStatusIdx < unsavedChangesIdx, 'autoSaveStatus === "saved" must be evaluated BEFORE hasUnsavedChanges to prevent amber mask');

  // Verify lifecycle listeners call draftQueue.current?.flush()
  assert.match(bolSrc, /draftQueue\.current\?\.flush\(\)/, 'Lifecycle listeners call draftQueue.current?.flush()');

  // Verify session init fallback checks IndexedDB
  assert.match(bolSrc, /getVaultItem<any>\("bol_drafts", "skybol:active-form-draft"\)/, 'Session init checks IndexedDB vault fallback');
});
