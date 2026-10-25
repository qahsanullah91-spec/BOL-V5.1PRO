const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

test('Repositioned Logistics Layout Suite', async (t) => {
  const bolEditorPath = path.resolve('components/bill-of-lading/bol-editor.tsx')
  const globalsCssPath = path.resolve('app/globals.css')

  assert.ok(fs.existsSync(bolEditorPath), 'bol-editor.tsx must exist')
  assert.ok(fs.existsSync(globalsCssPath), 'globals.css must exist')

  const bolEditorContent = fs.readFileSync(bolEditorPath, 'utf8')
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8')

  await t.test('1. CSS layout classes and responsive media query exist in globals.css', () => {
    assert.match(globalsCssContent, /\.logistics-page-layout\s*\{/, '.logistics-page-layout must exist')
    assert.match(globalsCssContent, /\.logistics-left-column/, '.logistics-left-column must exist')
    assert.match(globalsCssContent, /\.logistics-right-column/, '.logistics-right-column must exist')
    assert.match(globalsCssContent, /@media\s*\(\s*max-width:\s*1199px\s*\)/, 'Responsive media query below 1200px must exist')
  })

  await t.test('2. Layout structure: Left column contains Notes; Right column contains Doc Info (TOP) and Truck & Driver (BELOW)', () => {
    const layoutIdx = bolEditorContent.indexOf('logistics-page-layout')
    assert.ok(layoutIdx !== -1, 'logistics-page-layout must be present in bol-editor.tsx')

    const leftColIdx = bolEditorContent.indexOf('logistics-left-column')
    const rightColIdx = bolEditorContent.indexOf('logistics-right-column')
    assert.ok(leftColIdx !== -1 && rightColIdx !== -1, 'Both columns must exist')
    assert.ok(leftColIdx < rightColIdx, 'Left column must appear before right column in JSX')

    const notesIdx = bolEditorContent.indexOf('id="section-notes"')
    const docInfoIdx = bolEditorContent.indexOf('id="section-doc-info"')
    const truckIdx = bolEditorContent.indexOf('id="section-truck"')

    assert.ok(notesIdx !== -1, '#section-notes must exist')
    assert.ok(docInfoIdx !== -1, '#section-doc-info must exist')
    assert.ok(truckIdx !== -1, '#section-truck must exist')

    // Notes inside left column
    assert.ok(notesIdx > leftColIdx && notesIdx < rightColIdx, 'Notes must be inside left column')

    // In right column: Doc info comes first, Truck comes below
    assert.ok(docInfoIdx > rightColIdx, 'Doc info must be inside right column')
    assert.ok(truckIdx > docInfoIdx, 'Truck & Driver details must appear below Document Information in right column')
  })

  await t.test('3. Document Information preserves all badges, titles, and 3 horizontal cards', () => {
    assert.match(bolEditorContent, /01/, 'Section badge 01 must exist')
    assert.match(bolEditorContent, /Document Information/, 'Title Document Information must exist')
    assert.match(bolEditorContent, /BOL Header/i, 'BOL Header badge must exist')
    assert.match(bolEditorContent, /Today \/ امروز/, 'Today action button must exist')
    assert.match(bolEditorContent, /Next BOL #/, 'Next BOL # button must exist')
    assert.match(bolEditorContent, /اطلاعات سند و تاریخ‌ها/, 'Persian subtitle must exist')
    assert.match(bolEditorContent, /value=\{bolNumber\}/, 'BOL number input must exist')
    assert.match(bolEditorContent, /isEditingBolNumber/, 'isEditingBolNumber toggle must exist')
    assert.match(bolEditorContent, /value=\{issueDate\}/, 'Issue date input must exist')
    assert.match(bolEditorContent, /handleDateChange/, 'handleDateChange handler must exist')
    assert.match(bolEditorContent, /محاسبه خودکار خورشیدی/, 'Solar Hijri auto calculation must exist')
  })

  await t.test('4. Truck & Driver Details preserves badge, 5 inputs, plate preview, and rent presets', () => {
    assert.match(bolEditorContent, /TRANSPORT VEHICLE/i, 'Transport Vehicle badge must exist')
    assert.match(bolEditorContent, /name="truck_number"/, 'truck_number input must exist')
    assert.match(bolEditorContent, /name="driver_name"/, 'driver_name input must exist')
    assert.match(bolEditorContent, /name="driver_father_name"/, 'driver_father_name input must exist')
    assert.match(bolEditorContent, /name="driver_contact"/, 'driver_contact input must exist')
    assert.match(bolEditorContent, /name="driver_rent"/, 'driver_rent input must exist')
    assert.match(bolEditorContent, /46,000 AFN - کرایه واپسی/, 'Rent preset 46,000 must exist')
    assert.match(bolEditorContent, /45,000 AFN - کرایه واپسی/, 'Rent preset 45,000 must exist')
    assert.match(bolEditorContent, /53,000 AFN - کرایه واپسی/, 'Rent preset 53,000 must exist')
    assert.match(bolEditorContent, /38,500 AFN - کرایه واپسی/, 'Rent preset 38,500 must exist')
    assert.match(bolEditorContent, /<AfghanTruckPlate\s+value=\{formData\.truck_number/, 'Plate preview must be bound to truck_number')
    assert.match(bolEditorContent, /Quick Rent Presets|rent-preset-/, 'Quick Vehicle Rent presets must exist')
  })

  await t.test('5. Document Notes & Contacts preserves Note 1, Note 2, colors, and presets', () => {
    assert.match(bolEditorContent, /NOTE 01/, 'NOTE 01 badge must exist')
    assert.match(bolEditorContent, /Loading Contact/, 'Loading Contact label must exist')
    assert.match(bolEditorContent, /NOTE 02/, 'NOTE 02 badge must exist')
    assert.match(bolEditorContent, /Border Representatives/, 'Border Representatives label must exist')
    assert.match(bolEditorContent, /formData\.notes_1/, 'notes_1 binding must exist')
    assert.match(bolEditorContent, /formData\.notes_2/, 'notes_2 binding must exist')
    assert.match(bolEditorContent, /QUICK PRESETS:/, 'QUICK PRESETS strip must exist')
    assert.match(bolEditorContent, /Save to Presets \/ ذخیره مسیر/, 'Save to presets button must exist')
    assert.match(bolEditorContent, /Sync with B\/L \/ همگام‌سازی/, 'Sync with BOL button must exist')
  })
})
