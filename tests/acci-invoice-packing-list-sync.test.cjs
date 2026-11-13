const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const fflate = require('fflate')

test('ACCI Navigation Tabs Order & Structure in bol-editor.tsx', () => {
  const bolEditorPath = path.resolve(__dirname, '../components/bill-of-lading/bol-editor.tsx')
  assert.ok(fs.existsSync(bolEditorPath), 'bol-editor.tsx must exist')
  const content = fs.readFileSync(bolEditorPath, 'utf8')

  // 1. Verify sm:grid-cols-8
  assert.match(content, /sm:grid-cols-8/, 'TabsList must have sm:grid-cols-8 for 8 navigation tabs')

  // 2. Verify Tab Triggers in exact requested order:
  // [BOL Editor] [A4 Preview] [Saved BOLs] [Packing List] [Invoice] [Files] [Account Ledger] [BOL Settings]
  const tabValues = []
  const triggerRegex = /<TabsTrigger\s+value="([^"]+)"/g
  let match
  while ((match = triggerRegex.exec(content)) !== null) {
    tabValues.push(match[1])
  }

  // The first 8 triggers should be our primary navigation
  const primaryTabs = tabValues.slice(0, 8)
  assert.deepEqual(
    primaryTabs,
    [
      'form',
      'preview',
      'saved-documents',
      'packing-list',
      'invoice',
      'attachments',
      'account',
      'pdf-settings',
    ],
    'Tabs must appear in exact chronological sequence after saved-documents'
  )

  // 3. Verify TabsContent contains packing-list and invoice
  assert.match(content, /<TabsContent\s+value="packing-list"/, 'TabsContent for packing-list must be declared')
  assert.match(content, /<TabsContent\s+value="invoice"/, 'TabsContent for invoice must be declared')

  // 4. Verify views are dynamically imported
  assert.match(content, /const PackingListView = dynamic/, 'PackingListView must be dynamic')
  assert.match(content, /const CommercialInvoiceView = dynamic/, 'CommercialInvoiceView must be dynamic')
})

test('ACCI Document Generator Logic & Exact Word Template Conformity', () => {
  // Read and test generator code
  const genCodePath = path.resolve(__dirname, '../lib/utils/acci-document-generator.ts')
  assert.ok(fs.existsSync(genCodePath), 'acci-document-generator.ts must exist')
  const genCode = fs.readFileSync(genCodePath, 'utf8')

  assert.match(genCode, /generateAcciInvoiceFromBol/, 'Must export generateAcciInvoiceFromBol')
  assert.match(genCode, /generateAcciPackingListFromBol/, 'Must export generateAcciPackingListFromBol')
  assert.match(genCode, /getShamsiDateString/, 'Must export getShamsiDateString')
  assert.match(genCode, /formatDateToDMY/, 'Must export formatDateToDMY')
  assert.match(genCode, /SKY ARIANA LTD/, 'Must default exporter to SKY ARIANA LTD')
  assert.match(genCode, /2401-2198/, 'Must default export licence to 2401-2198')
  assert.match(genCode, /ETEMAD RAHIMI MARKET KANDAHAR AFGHANISTAN/, 'Must include Kandahar headquarters address')
})

test('ACCI Word (.docx) Generator OpenXML Integrity', () => {
  const wordGenPath = path.resolve(__dirname, '../lib/utils/acci-word-generator.ts')
  assert.ok(fs.existsSync(wordGenPath), 'acci-word-generator.ts must exist')
  const wordGenCode = fs.readFileSync(wordGenPath, 'utf8')

  assert.match(wordGenCode, /generateAcciInvoiceDocx/, 'Must export generateAcciInvoiceDocx')
  assert.match(wordGenCode, /generateAcciPackingListDocx/, 'Must export generateAcciPackingListDocx')
  assert.match(wordGenCode, /downloadAcciInvoiceDocx/, 'Must export downloadAcciInvoiceDocx')
  assert.match(wordGenCode, /downloadAcciPackingListDocx/, 'Must export downloadAcciPackingListDocx')
  assert.match(wordGenCode, /Cambria/, 'Must use the requested Cambria typography')
  assert.match(wordGenCode, /applyCambriaFont/, 'Must apply Cambria to all document runs')
  assert.match(wordGenCode, /11906/, 'Must use standard A4 width 11906 dxa')
  assert.match(wordGenCode, /16838/, 'Must use standard A4 height 16838 dxa')
  assert.match(wordGenCode, /w:val="double"/, 'Must use double line border under header')
})

test('ACCI Vector PDF Generator Structure', () => {
  const pdfGenPath = path.resolve(__dirname, '../lib/utils/acci-pdf-generator.ts')
  assert.ok(fs.existsSync(pdfGenPath), 'acci-pdf-generator.ts must exist')
  const pdfGenCode = fs.readFileSync(pdfGenPath, 'utf8')

  assert.match(pdfGenCode, /generateAcciInvoicePdf/, 'Must export generateAcciInvoicePdf')
  assert.match(pdfGenCode, /generateAcciPackingListPdf/, 'Must export generateAcciPackingListPdf')
  assert.match(pdfGenCode, /downloadAcciInvoicePdf/, 'Must export downloadAcciInvoicePdf')
  assert.match(pdfGenCode, /downloadAcciPackingListPdf/, 'Must export downloadAcciPackingListPdf')
  assert.match(pdfGenCode, /registerPDFFontsSync/, 'Must sync register TrueType fonts for PDF')
  assert.match(pdfGenCode, /leftColW = 88/, 'Must use authentic side-by-side party box width')
  assert.match(pdfGenCode, /rightColW = 90/, 'Must use authentic side-by-side transit table width')
  assert.match(pdfGenCode, /col3CenterY/, 'Must vertically center Total Amount Say in description column')
})

test('UI Components Existence & Exact Authentic Layout', () => {
  const invoiceViewPath = path.resolve(__dirname, '../components/bill-of-lading/commercial-invoice-view.tsx')
  assert.ok(fs.existsSync(invoiceViewPath), 'commercial-invoice-view.tsx must exist')
  const invCode = fs.readFileSync(invoiceViewPath, 'utf8')
  assert.match(invCode, /CommercialInvoiceView/, 'Must export CommercialInvoiceView')
  assert.match(invCode, /downloadAcciInvoiceDocx/, 'Must provide Word docx download')
  assert.match(invCode, /downloadAcciInvoicePdf/, 'Must provide PDF download')
  assert.match(invCode, /window\.print\(\)/, 'Must support direct A4 print')
  assert.match(invCode, /grid grid-cols-2/, 'Must render side-by-side 2-column top section')
  assert.match(invCode, /3px double black/, 'Must render double line border under header')
  assert.match(invCode, /min-h-\[550px\]/, 'Must render continuous full-height table columns')
  assert.match(invCode, /Total Amount Say: USD:/, 'Must render amount in words say block')
  assert.match(invCode, /my-auto py-8 text-center flex flex-col items-center justify-center/, 'Total Amount Say block must be moved up into vertical center of description column')
  assert.match(invCode, /TOTAL C&F/, 'Must render C&F summary row')
  assert.match(invCode, /invoice-print-root/, 'Commercial invoice canvas must have invoice-print-root class')
  assert.match(invCode, /acci-document-cambria/, 'Commercial invoice must use Cambria in preview and print')
  assert.match(invCode, /SKY<br \/>ARIANA LTD/, 'Commercial invoice must render unbroken SKY ARIANA LTD company name')
  assert.doesNotMatch(invCode, /ARIAN<br \/>A LTD/, 'Commercial invoice must not have broken ARIAN / A LTD wrap')

  const plViewPath = path.resolve(__dirname, '../components/bill-of-lading/packing-list-view.tsx')
  assert.ok(fs.existsSync(plViewPath), 'packing-list-view.tsx must exist')
  const plCode = fs.readFileSync(plViewPath, 'utf8')
  assert.match(plCode, /PackingListView/, 'Must export PackingListView')
  assert.match(plCode, /downloadAcciPackingListDocx/, 'Must provide Word docx download')
  assert.match(plCode, /downloadAcciPackingListPdf/, 'Must provide PDF download')
  assert.match(plCode, /window\.print\(\)/, 'Must support direct A4 print')
  assert.match(plCode, /grid grid-cols-2/, 'Must render side-by-side 2-column top section')
  assert.match(plCode, /3px double black/, 'Must render double line border under header')
  assert.match(plCode, /min-h-\[550px\]/, 'Must render continuous full-height table columns')
  assert.match(plCode, /Description of Goods/, 'Must render Description of Goods header')
  assert.match(plCode, /Quantity/, 'Must render Quantity header')
  assert.match(plCode, /underline/, 'Must underline PACKING LIST title')
  assert.match(plCode, /invoice-print-root/, 'Packing list canvas must have invoice-print-root class')
  assert.match(plCode, /acci-document-cambria/, 'Packing list must use Cambria in preview and print')
  assert.match(plCode, /Same as Invoice/, 'Must have toolbar toggle for Same as Invoice layout')
  assert.match(plCode, /matching-invoice/, 'Must support matching-invoice column order')
  assert.match(plCode, /flex-1 flex items-center justify-center pb-14 text-center/, 'Classic packing-list origin must sit centered vertically and horizontally in column')
  assert.match(plCode, /flex-1 flex flex-col items-center justify-center pb-14 text-center/, 'Classic packing-list signature must sit centered vertically and horizontally in column')
  assert.match(plCode, /SKY<br \/>ARIANA LTD/, 'Packing list must render unbroken SKY ARIANA LTD company name')
  assert.doesNotMatch(plCode, /ARIAN<br \/>A LTD/, 'Packing list must not have broken ARIAN / A LTD wrap')

  // Exact Match to User Screenshots Tests
  assert.match(plCode, /useState<"matching-invoice" \| "classic">\("classic"\)/, 'Packing list must default to classic 3-column Chamber layout matching screenshot')
  assert.doesNotMatch(plCode, /PACKING LIST[\s\S]*?\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/, 'Packing list must not have asterisks under title')
  assert.match(invCode, /INVOICE[\s\S]*?\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*/, 'Invoice must have asterisks under title')
  assert.match(invCode, /text-blue-700 underline font-serif">Reg No :/, 'Invoice chamber box must have blue underlined Reg No hyperlink')
  assert.match(invCode, /text-blue-700 underline font-serif">Fee No :/, 'Invoice chamber box must have blue underlined Fee No hyperlink')
  assert.match(invCode, /text-blue-700 underline font-serif">Date :/, 'Invoice chamber box must have blue underlined Date hyperlink')
  assert.match(invCode, /text-blue-700 underline font-serif">Signature :/, 'Invoice chamber box must have blue underlined Signature hyperlink')
  const genCode = fs.readFileSync(path.resolve(__dirname, '../lib/utils/acci-document-generator.ts'), 'utf8')
  assert.match(genCode, /cleanNum\.startsWith\("1\/"\)/, 'Packing list number generator must format with 1/ prefix')

  // Exact Match to user reference image media_1794196380949.png and authentic Word files
  assert.match(invCode, /flex justify-between items-center text-\[10px\]/, 'Invoice Afghan transit table must use single row flex layout without vertical divider')
  assert.match(plCode, /flex justify-between items-center text-\[10px\]/, 'Packing list Afghan transit table must use single row flex layout without vertical divider')
  assert.match(invCode, /NOTIFY PARTY:/, 'Invoice must include seamless NOTIFY PARTY within outer party box')
  assert.match(plCode, /NOTIFY PARTY:/, 'Packing list must include seamless NOTIFY PARTY within outer party box')
  assert.match(plCode, /Afghan Transit form Airway Bill\./, 'Packing list transit table title must be Afghan Transit form Airway Bill.')
  assert.match(invCode, /Received the sum of------/, 'Invoice must render Received the sum of on chamber line')
  assert.match(genCode, /docTitle:\s*"Afghan Transit form Airway Bill\."/, 'Packing list generator must default transit docTitle to Afghan Transit form Airway Bill.')

  // Symmetrical Chamber Fee block & edge-to-edge TOTAL C&F / SKY ARIANA LTD across UI, PDF, and Word
  assert.match(invCode, /w-\[245px\] mx-auto flex flex-col/, 'Invoice Chamber block must use centered fixed symmetric container width')
  assert.match(invCode, /"-"\.repeat\(120\)/, 'Invoice Chamber dash spans must use 120 hyphens so lines never show white gaps')
  assert.match(invCode, /border-y border-black w-full h-\[36px\]/, 'TOTAL C&F and total amount borders must span full cell width edge-to-edge')
  assert.match(invCode, /border border-black mt-4 w-full flex-1 flex flex-col/, 'Invoice goods table must fill remaining A4 page height cleanly')
  assert.match(plCode, /border border-black mt-4 w-full flex-1 flex flex-col/, 'Packing list goods table must fill remaining A4 page height cleanly')

  const pdfCode = fs.readFileSync(path.resolve(__dirname, '../lib/utils/acci-pdf-generator.ts'), 'utf8')
  assert.match(pdfCode, /drawBlueLabelField/, 'PDF must render blue underlined Chamber Fee labels symmetrically')
  assert.match(pdfCode, /chamberBlockW = 66/, 'PDF Chamber Fee block must use fixed symmetric width')
  assert.match(pdfCode, /availableMidY = \(itemTopY \+ chamberBoxY\) \/ 2 - 8/, 'PDF Total Amount Say must be centered cleanly without double offset subtraction')

  const wordCode = fs.readFileSync(path.resolve(__dirname, '../lib/utils/acci-word-generator.ts'), 'utf8')
  assert.match(wordCode, /w:color w:val="1D4ED8"/, 'Word invoice must render blue underlined Chamber Fee labels matching preview & PDF')
  assert.match(wordCode, /w:leader="hyphen"/, 'Word invoice must use hyphen tab leaders for flush symmetric Chamber rows')
  assert.match(wordCode, /w:vMerge w:val="restart"/, 'Word invoice must merge footer columns cleanly alongside bordered TOTAL C&F row')
})


