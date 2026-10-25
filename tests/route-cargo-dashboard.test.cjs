const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Side-by-Side Route & Cargo Dashboard Implementation', async (t) => {
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

  await t.test('1. CSS Grid layout specification in app/globals.css and styles/globals.css', () => {
    for (const [name, css] of [['app/globals.css', appCssContent], ['styles/globals.css', stylesCssContent]]) {
      assert.match(css, /\.route-cargo-dashboard\s*\{[^}]*display:\s*grid;/s, `${name} must define .route-cargo-dashboard as grid`)
      assert.match(css, /\.route-cargo-dashboard\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s, `${name} must define 1 column default for viewports < 1200px`)
      assert.match(css, /@media\s*\(\s*min-width:\s*1200px\s*\)\s*\{[^}]*minmax\(0,\s*1\.04fr\)\s*minmax\(0,\s*0\.96fr\)/s, `${name} must define 1.04fr / 0.96fr ratio for desktop >= 1200px`)
      assert.match(css, /@media\s*\(\s*min-width:\s*1400px\s*\)\s*\{[^}]*gap:\s*18px;/s, `${name} must define 18px gap for desktop >= 1400px`)
      assert.match(css, /\.route-cargo-dashboard\s*\.route-section,\s*\.route-cargo-dashboard\s*\.cargo-section\s*\{[^}]*min-width:\s*0;/s, `${name} must include min-width: 0 on .route-section and .cargo-section`)
    }
  })

  await t.test('2. DOM Structure: Shared parent container with Route on left and Cargo on right', () => {
    // Assert .route-cargo-dashboard wraps both sections
    const dashboardIndex = bolEditorContent.indexOf('className="route-cargo-dashboard')
    assert.ok(dashboardIndex !== -1, 'bol-editor.tsx must render className="route-cargo-dashboard"')

    const routeSectionIndex = bolEditorContent.indexOf('className="route-section')
    assert.ok(routeSectionIndex !== -1, 'bol-editor.tsx must contain className="route-section"')

    const cargoSectionIndex = bolEditorContent.indexOf('className="cargo-section')
    assert.ok(cargoSectionIndex !== -1, 'bol-editor.tsx must contain className="cargo-section"')

    assert.ok(
      dashboardIndex < routeSectionIndex && routeSectionIndex < cargoSectionIndex,
      'Route section must appear before Cargo section inside .route-cargo-dashboard'
    )

    // Route section contains #section-routes card
    assert.match(
      bolEditorContent,
      /<div className="route-section[^"]*">[\s\S]*?<Card id="section-routes"/,
      'Route section must contain <Card id="section-routes"'
    )

    // Cargo section contains #section-cargo card
    assert.match(
      bolEditorContent,
      /<div className="cargo-section[^"]*">[\s\S]*?<Card id="section-cargo"/,
      'Cargo section must contain <Card id="section-cargo"'
    )
  })

  await t.test('3. Section Jump Navigation maintains correct indices and IDs', () => {
    assert.match(
      bolEditorContent,
      /\{\s*id:\s*"section-routes",\s*label:\s*"05 Routes",\s*icon:\s*MapPin\s*\}/,
      'Section jump navigation includes 05 Routes pointing to section-routes'
    )
    assert.match(
      bolEditorContent,
      /\{\s*id:\s*"section-cargo",\s*label:\s*"06 Cargo",\s*icon:\s*Package\s*\}/,
      'Section jump navigation includes 06 Cargo pointing to section-cargo'
    )
  })

  await t.test('4. Route Stops & Transit Pathway preserves all critical controls and UI elements', () => {
    // Header labels
    assert.match(bolEditorContent, /Route Stops &amp; Transit Pathway|Route Stops & Transit Pathway/, 'Route title preserved')
    assert.match(bolEditorContent, /مسیر حمل و نقل و توقفگاه‌ها/, 'Bilingual route title preserved')

    // Action buttons
    assert.match(bolEditorContent, /Save to Presets/, 'Save to Presets button preserved')
    assert.match(bolEditorContent, /Sync with B\/L/, 'Sync with B/L button preserved')
    assert.match(bolEditorContent, /Reverse/, 'Reverse route button preserved')
    assert.match(bolEditorContent, /Add Stop/, 'Add Stop button preserved')

    // Presets bar & Transit Stepper
    assert.match(bolEditorContent, /Quick Presets/, 'Quick Presets heading preserved')
    assert.match(bolEditorContent, /Transit Stepper Pathway/, 'Transit Stepper Pathway preserved')

    // Stop Card controls
    assert.match(bolEditorContent, /duplicateRouteStop/, 'Duplicate stop action preserved')
    assert.match(bolEditorContent, /removeRouteStop/, 'Delete stop action preserved')
    assert.match(bolEditorContent, /moveRouteStop\(index,\s*'up'\)/, 'Move stop up action preserved')
    assert.match(bolEditorContent, /moveRouteStop\(index,\s*'down'\)/, 'Move stop down action preserved')

    // Afghanistan truck plate / transport modes / location catalog
    assert.match(bolEditorContent, /AfghanTruckPlate/, 'AfghanTruckPlate component preserved')
    assert.match(bolEditorContent, /quick-loc-catalog/, 'Quick Location Catalog preserved')
    assert.match(bolEditorContent, /plateNumber/, 'Plate number input preserved')

    // Empty state container safety
    assert.match(
      bolEditorContent,
      /formData\.routes\.length === 0[\s\S]*?Add First Stop/s,
      'Empty state preserves outer card and alignment with Add First Stop button'
    )
  })

  await t.test('5. Cargo Details & Specifications preserves all critical controls and UI elements', () => {
    // Header labels & actions
    assert.match(bolEditorContent, /Cargo Details &amp; Specifications|Cargo Details & Specifications/, 'Cargo title preserved')
    assert.match(bolEditorContent, /مشخصات کالا و محموله/, 'Bilingual cargo title preserved')
    assert.match(bolEditorContent, /Calculate totals/, 'Calculate totals button preserved')
    assert.match(bolEditorContent, /Clear All/, 'Clear All button preserved')

    // Status badges & Switch B/L
    assert.match(bolEditorContent, /Full Way Reefer/, 'Full Way Reefer badge preserved')
    assert.match(bolEditorContent, /Switch B\/L/, 'Switch B/L badge preserved')
    assert.match(bolEditorContent, /cargo_route_note/, 'Editable route textarea bound to cargo_route_note')
    assert.match(bolEditorContent, /RoutePresetSelector/, 'RoutePresetSelector preserved')

    // 4 KPI summary cards
    assert.match(bolEditorContent, /Total Packages/, 'KPI card Total Packages preserved')
    assert.match(bolEditorContent, /Total Gross Weight/, 'KPI card Total Gross Weight preserved')
    assert.match(bolEditorContent, /Total Net Weight/, 'KPI card Total Net Weight preserved')
    assert.match(bolEditorContent, /Estimated Goods Value/, 'KPI card Estimated Goods Value preserved')

    // Package, weight, rate, specification fields
    assert.match(bolEditorContent, /number_of_packages/, 'number_of_packages input preserved')
    assert.match(bolEditorContent, /kgs_per_carton/, 'kgs_per_carton input preserved')
    assert.match(bolEditorContent, /gross_weight_per_carton/, 'gross_weight_per_carton input preserved')
    assert.match(bolEditorContent, /container_numbers/, 'container_numbers input preserved')
    assert.match(bolEditorContent, /seal_numbers/, 'seal_numbers input preserved')
    assert.match(bolEditorContent, /rate_per_kgs/, 'rate_per_kgs input preserved')
    assert.match(bolEditorContent, /goods_value/, 'goods_value input preserved')

    // Description Studio
    assert.match(bolEditorContent, /Cargo Description & Document Studio/, 'Cargo Description Studio preserved')
    assert.match(bolEditorContent, /applyDefaultCargoDescription/, 'Default template action preserved')
    assert.match(bolEditorContent, /formatCleanCargoDescription/, 'Clean format action preserved')
    assert.match(bolEditorContent, /insertBilingualCargoHeader/, 'Bilingual header action preserved')
    assert.match(bolEditorContent, /cargo_description/, 'cargo_description textarea preserved')
  })

  await t.test('6. Internal Responsive Grid Safeguards prevent column overflow', () => {
    // Stop card location grid is responsive (not rigid 3+ columns on narrow desktop columns)
    assert.match(
      bolEditorContent,
      /grid gap-3\.5 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-\[1fr_1fr_1\.35fr\]/,
      'Stop card location/transport grid uses adaptive responsive columns'
    )

    // KPI cards in cargo panel adapt to column width
    assert.match(
      bolEditorContent,
      /grid grid-cols-1 gap-2\.5 sm:grid-cols-2/,
      'KPI cards use 2-column grid to fit neatly in cargo column'
    )

    // Cargo fields use adaptive grid
    assert.match(
      bolEditorContent,
      /grid grid-cols-1 gap-(?:3|4) sm:grid-cols-2/,
      'Cargo fields use adaptive grid to avoid horizontal blowout'
    )
  })
})
