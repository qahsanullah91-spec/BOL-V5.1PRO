const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Issue Date Single-Line Bilingual Header Test', async (t) => {
  const filePath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx')
  const content = fs.readFileSync(filePath, 'utf8')

  await t.test('1. Issue Date card header is rendered on a single line with whitespace-nowrap and flex items-center', () => {
    assert.match(
      content,
      /<div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0\.5 pb-1 mb-0\.5 border-b border-blue-100\/90">/,
      'Must use single-line flex container with whitespace-nowrap and clean bottom divider'
    )
  })

  await t.test('2. English ISSUE DATE and Persian تاریخ صدور are inline with divider slash', () => {
    assert.match(
      content,
      /ISSUE DATE[\s\S]*?<span className="text-blue-400 font-bold select-none text-\[8\.4pt\] leading-none">\/<\/span>[\s\S]*?تاریخ صدور/,
      'Must pair ISSUE DATE and تاریخ صدور inline with divider slash'
    )
  })

  await t.test('3. Persian تاریخ صدور declares dir="rtl" for proper bidirectional rendering', () => {
    assert.match(
      content,
      /font-\[vazirmatn\][\s\S]*?dir="rtl"[\s\S]*?تاریخ صدور/,
      'Must declare dir="rtl" on Persian text'
    )
  })

  await t.test('4. Dates continue to render vertically with enlarged prominent typography below header', () => {
    assert.match(
      content,
      /flex-1 flex flex-col items-center justify-center[\s\S]*?\{issueDate\}[\s\S]*?\{persianDateNumeric\}/,
      'Must keep dates cleanly stacked in flex-col below header'
    )
  })
})
