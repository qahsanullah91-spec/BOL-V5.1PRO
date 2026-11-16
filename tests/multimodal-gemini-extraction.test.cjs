const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const providerPath = path.join(__dirname, '..', 'lib', 'ai', 'ai-provider.ts')
const routePath = path.join(__dirname, '..', 'app', 'api', 'ai', 'structured-extract', 'route.ts')
const bulkInputPath = path.join(__dirname, '..', 'components', 'shipments', 'bulk-input-methods.tsx')

const providerSrc = fs.readFileSync(providerPath, 'utf8')
const routeSrc = fs.readFileSync(routePath, 'utf8')
const bulkInputSrc = fs.readFileSync(bulkInputPath, 'utf8')

test('Multimodal Gemini Document Extraction & Structured Schema Suite', async (t) => {
  await t.test('1. Multimodal Document Type & InlineData Support in AI Provider', () => {
    assert.ok(providerSrc.includes('export interface MultimodalDocument'), 'Must export MultimodalDocument interface')
    assert.ok(providerSrc.includes('file?: MultimodalDocument'), 'PromptOptions must include optional file')
    assert.ok(providerSrc.includes('inlineData: {'), 'Must pass inlineData to Gemini REST API payload')
    assert.ok(providerSrc.includes('options.file?.mimeType'), 'Must forward file.mimeType')
    assert.ok(providerSrc.includes('options.file ? 30000 :'), 'Must allocate 30s timeout for document file analysis')
  })

  await t.test('2. API Route Accepts Documents & Enforces MIME Whitelist', () => {
    assert.ok(routeSrc.includes('const { text = \'\', type = \'bol\', model, payload, file } = body'), 'Must extract file from request body')
    assert.ok(routeSrc.includes('application/pdf'), 'Must whitelist application/pdf')
    assert.ok(routeSrc.includes('image/png'), 'Must whitelist image/png')
    assert.ok(routeSrc.includes('image/jpeg'), 'Must whitelist image/jpeg')
    assert.ok(routeSrc.includes('image/webp'), 'Must whitelist image/webp')
    assert.ok(routeSrc.includes('attached document'), 'Prompt must contextualize attached document')
  })

  await t.test('3. Bulk Input UI Provides Drag & Drop Multimodal Document Dropzone', () => {
    assert.ok(bulkInputSrc.includes('handleFileSelect'), 'Must implement handleFileSelect handler')
    assert.ok(bulkInputSrc.includes('readAsDataURL'), 'Must read document file as Base64 Data URL')
    assert.ok(bulkInputSrc.includes('onDragOver'), 'Must implement onDragOver drag-and-drop event')
    assert.ok(bulkInputSrc.includes('onDrop'), 'Must implement onDrop event')
    assert.ok(bulkInputSrc.includes('selectedFile'), 'Must maintain selectedFile state')
    assert.ok(bulkInputSrc.includes('Analyzing Document with Gemini...'), 'Must render dedicated multimodal loading state')
  })
})
