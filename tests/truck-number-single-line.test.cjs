const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('A4 Preview - Truck Number Single-Line Header Layout Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..')
  const previewPath = path.join(rootDir, 'components', 'bill-of-lading', 'a4-preview.tsx')
  assert.ok(fs.existsSync(previewPath), 'a4-preview.tsx must exist')

  const code = fs.readFileSync(previewPath, 'utf8')

  await t.test('1. Truck Number header renders in a single horizontal flex line with whitespace-nowrap', () => {
    assert.match(
      code,
      /<div className="flex items-center justify-center gap-1 text-center w-full shrink-0 whitespace-nowrap leading-snug pt-0\.5 pb-1 mb-0\.5 border-b border-blue-100\/90">/,
      'Truck Number header must use single-line horizontal flex row with whitespace-nowrap and clean bottom divider'
    )
  })

  await t.test('2. English TRUCK NUMBER and Dari/Pashto labels are unified on one line with separator', () => {
    assert.match(
      code,
      /TRUCK NUMBER[\s\S]*?<span className="text-blue-400 font-bold select-none text-\[8\.4pt\] leading-none">\/<\/span>[\s\S]*?شماره کامیون \/ موټر/,
      'Both English and Persian/Pashto labels must be on the same line joined by a slash separator'
    )
  })

  await t.test('3. Persian/Pashto label has RTL direction and isolated unicode bidi', () => {
    assert.match(
      code,
      /شماره کامیون \/ موټر[\s\S]*?dir="rtl"[\s\S]*?unicodeBidi:\s*"isolate"/,
      'Persian/Pashto label must use dir="rtl" and unicodeBidi: "isolate" to prevent BiDi slash flipping'
    )
  })

  await t.test('4. AfghanTruckPlate is preserved and receives compact/sm size', () => {
    assert.match(
      code,
      /<AfghanTruckPlate value=\{formData\.truck_number\} size=\{isUltra \? "sm" : "compact"\} className="max-w-full h-auto" \/>/,
      'AfghanTruckPlate component must be preserved'
    )
  })
})
