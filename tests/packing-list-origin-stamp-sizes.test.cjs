const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

test('Packing List & Commercial Invoice - Origin & SKY ARIANA LTD enlarged text sizes', () => {
  const plViewPath = path.resolve(__dirname, '../components/bill-of-lading/packing-list-view.tsx')
  assert.ok(fs.existsSync(plViewPath), 'packing-list-view.tsx must exist')
  const plCode = fs.readFileSync(plViewPath, 'utf8')

  // Classic Chamber layout font assertions
  assert.match(plCode, /font-serif text-\[19px\] font-normal text-black tracking-wide/, 'Classic packing list origin must have enlarged text-[19px] serif typography')
  assert.match(plCode, /text-\[14\.5px\] font-bold uppercase tracking-wider leading-snug whitespace-nowrap[\s\S]*?SKY<br \/>ARIANA LTD/, 'Classic packing list signature must have enlarged text-[14.5px] uppercase font')
  assert.match(plCode, /text-slate-800 font-mono text-\[11px\] tracking-tighter select-none overflow-hidden whitespace-nowrap mt-1/, 'Classic packing list dashed line must scale to text-[11px]')

  // Invoice layout font assertions
  const invViewPath = path.resolve(__dirname, '../components/bill-of-lading/commercial-invoice-view.tsx')
  assert.ok(fs.existsSync(invViewPath), 'commercial-invoice-view.tsx must exist')
  const invCode = fs.readFileSync(invViewPath, 'utf8')

  assert.match(invCode, /text-\[14px\] font-bold uppercase tracking-wider leading-snug whitespace-nowrap[\s\S]*?SKY<br \/>ARIANA LTD/, 'Commercial invoice signature must have enlarged text-[14px] uppercase font')
  assert.match(invCode, /font-bold text-\[14px\] tracking-wide text-black pt-1 font-serif[\s\S]*?invoiceData\.originCountry/, 'Commercial invoice origin country must have enlarged text-[14px] serif font')

  // PDF generator assertions
  const pdfGenPath = path.resolve(__dirname, '../lib/utils/acci-pdf-generator.ts')
  assert.ok(fs.existsSync(pdfGenPath), 'acci-pdf-generator.ts must exist')
  const pdfCode = fs.readFileSync(pdfGenPath, 'utf8')

  assert.match(pdfCode, /doc\.setFontSize\(12\.5\)[\s\S]*?doc\.text\(data\.originCountry/, 'PDF generator must use 12.5pt for origin')
  assert.match(pdfCode, /doc\.setFontSize\(10\.5\)[\s\S]*?doc\.text\("SKY"/, 'PDF generator must use 10.5pt for SKY stamp')

  // Word (.docx) generator assertions
  const docxGenPath = path.resolve(__dirname, '../lib/utils/acci-word-generator.ts')
  assert.ok(fs.existsSync(docxGenPath), 'acci-word-generator.ts must exist')
  const docxCode = fs.readFileSync(docxGenPath, 'utf8')

  assert.match(docxCode, /item\.origin \|\| "\(Origin Afghanistan\)"[\s\S]*?sizeHalfPt:\s*28/, 'Word generator must use sizeHalfPt 28 for origin')
  assert.match(docxCode, /"SKY"[\s\S]*?sizeHalfPt:\s*23/, 'Word generator must use sizeHalfPt 23 for SKY stamp')
})
