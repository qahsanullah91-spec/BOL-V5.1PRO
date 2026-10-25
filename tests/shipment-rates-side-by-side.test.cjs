const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Side-by-Side Shipment & Packaging Inputs and Rates & Calculated Totals Layout Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..')
  const bolEditorPath = path.join(rootDir, 'components', 'bill-of-lading', 'bol-editor.tsx')
  const appCssPath = path.join(rootDir, 'app', 'globals.css')
  const stylesCssPath = path.join(rootDir, 'styles', 'globals.css')

  assert.ok(fs.existsSync(bolEditorPath), 'bol-editor.tsx must exist')
  assert.ok(fs.existsSync(appCssPath), 'app/globals.css must exist')
  assert.ok(fs.existsSync(stylesCssPath), 'styles/globals.css must exist')

  const bolEditorContent = fs.readFileSync(bolEditorPath, 'utf8')
  const appCssContent = fs.readFileSync(appCssPath, 'utf8')
  const stylesCssContent = fs.readFileSync(stylesCssPath, 'utf8')

  await t.test('1. CSS Grid definitions: 2-column layout on desktop with min-width: 1024px', () => {
    for (const [name, css] of [['app/globals.css', appCssContent], ['styles/globals.css', stylesCssContent]]) {
      assert.match(css, /\.cargo-inputs-rates-grid\s*\{/, `${name} must define .cargo-inputs-rates-grid`)
      assert.match(css, /@media\s*\(\s*min-width:\s*1024px\s*\)\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
        `${name} must specify 2-column grid at min-width: 1024px`)
    }
  })

  await t.test('2. DOM Structure: Side-by-side grid wrapper encloses Section 1 and Section 2 in order', () => {
    const gridIdx = bolEditorContent.indexOf('cargo-inputs-rates-grid')
    const s1Idx = bolEditorContent.indexOf('{/* Field Grid - Section 1: Shipment & Packaging Inputs */}')
    const s2Idx = bolEditorContent.indexOf('{/* Field Grid - Row 2: Rates, Weights & Valuation */}')
    const s3Idx = bolEditorContent.indexOf('{/* Field Grid - Row 3: Cargo Description Studio */}')

    assert.ok(gridIdx !== -1, 'cargo-inputs-rates-grid wrapper must exist in bol-editor.tsx')
    assert.ok(s1Idx !== -1, 'Section 1 marker must exist')
    assert.ok(s2Idx !== -1, 'Section 2 marker must exist')
    assert.ok(s3Idx !== -1, 'Section 3 marker must exist')

    assert.ok(gridIdx < s1Idx, 'Grid wrapper must enclose Section 1')
    assert.ok(s1Idx < s2Idx, 'Section 1 (Shipment & Packaging Inputs) must appear before Section 2 (Rates & Totals)')
    assert.ok(s2Idx < s3Idx, 'Section 2 must appear before Section 3 (Cargo Description Studio)')
  })

  await t.test('3. Section 1 (Shipment & Packaging Inputs) preserves all fields, presets, and balanced rows', () => {
    assert.match(bolEditorContent, /Shipment & Packaging Inputs/, 'Title Shipment & Packaging Inputs must exist')
    assert.match(bolEditorContent, /مشخصات کانتینر، پلمپ و بسته‌بندی/, 'Persian subtitle must exist')
    assert.match(bolEditorContent, /name="container_numbers"/, 'Container numbers input must exist')
    assert.match(bolEditorContent, /name="seal_numbers"/, 'Seal numbers input must exist')
    assert.match(bolEditorContent, /name="number_of_packages"/, 'Number of packages input must exist')
    assert.match(bolEditorContent, /name="kgs_per_carton"/, 'Kgs per carton input must exist')
    assert.match(bolEditorContent, /name="gross_weight_per_carton"/, 'Gross weight per carton input must exist')
  })

  await t.test('4. Section 2 (Rates & Calculated Totals) preserves all valuations, weights, and presets', () => {
    assert.match(bolEditorContent, /Rates & Calculated Totals/, 'Title Rates & Calculated Totals must exist')
    assert.match(bolEditorContent, /ارزش‌گذاری، نرخ و اوزان کل/, 'Persian subtitle must exist')
    assert.match(bolEditorContent, /name="rate_per_kgs"/, 'Rate per kg input must exist')
    assert.match(bolEditorContent, /name="goods_value"/, 'Goods value input must exist')
    assert.match(bolEditorContent, /name="net_weight"/, 'Net weight input must exist')
    assert.match(bolEditorContent, /name="gross_weight"/, 'Gross weight input must exist')
    assert.match(bolEditorContent, /name="measurement"/, 'Measurement volume input must exist')
    assert.match(bolEditorContent, /20' STD/, '20 STD preset must exist')
    assert.match(bolEditorContent, /40' HQ/, '40 HQ preset must exist')
  })

  await t.test('5. Equal height stretching and responsive classes applied', () => {
    const s1Card = bolEditorContent.slice(
      bolEditorContent.indexOf('{/* Field Grid - Section 1: Shipment & Packaging Inputs */}'),
      bolEditorContent.indexOf('{/* Field Grid - Row 2: Rates, Weights & Valuation */}')
    )
    const s2Card = bolEditorContent.slice(
      bolEditorContent.indexOf('{/* Field Grid - Row 2: Rates, Weights & Valuation */}'),
      bolEditorContent.indexOf('{/* Field Grid - Row 3: Cargo Description Studio */}')
    )

    assert.ok(s1Card.includes('h-full') && s1Card.includes('flex flex-col justify-between'), 'Section 1 must stretch with h-full and flex')
    assert.ok(s2Card.includes('h-full') && s2Card.includes('flex flex-col justify-between'), 'Section 2 must stretch with h-full and flex')
  })
})
