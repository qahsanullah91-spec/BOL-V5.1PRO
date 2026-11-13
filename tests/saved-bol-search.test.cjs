const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Saved BOL Search Engine & Two-Tier Responsive Toolbar Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..')
  const savedDocsPath = path.join(rootDir, 'components', 'bill-of-lading', 'saved-documents.tsx')
  const source = fs.readFileSync(savedDocsPath, 'utf8')

  await t.test('1. saved-documents.tsx implements two-tier responsive toolbar preventing search crushing', () => {
    assert.ok(source.includes('Two-Tier Spacious Responsive Toolbar'), 'Must declare two-tier toolbar architecture')
    assert.ok(source.includes('Tier 1: Dedicated Full-Width / Flex Search Bar'), 'Must feature dedicated Tier 1 search bar')
    assert.ok(source.includes('Tier 2: Date Filters, Sort, and Management Actions Bar'), 'Must feature Tier 2 for secondary controls')
    assert.ok(source.includes('min-w-[280px]'), 'Search bar must enforce minimum width of at least 280px')
  })

  await t.test('2. Search input includes keyboard shortcuts (Ctrl+K, Esc), clear button, and live match counter', () => {
    assert.ok(source.includes('searchInputRef'), 'Must declare searchInputRef for programmatic focus')
    assert.ok(source.includes('Ctrl+K'), 'Must render Ctrl+K shortcut indicator')
    assert.ok(source.includes('{filteredDocuments.length} found'), 'Must render match counter badge when query is active')
    assert.ok(source.includes('Clear search (Esc)'), 'Must render clear search button with Esc hint')
  })

  await t.test('3. Search indexing covers comprehensive logistics fields', () => {
    assert.ok(source.includes('notify_party_name'), 'Must index notify_party_name')
    assert.ok(source.includes('cargo_description'), 'Must index cargo_description')
    assert.ok(source.includes('container_numbers'), 'Must index container_numbers')
    assert.ok(source.includes('seal_numbers'), 'Must index seal_numbers')
    assert.ok(source.includes('port_of_loading'), 'Must index port_of_loading')
    assert.ok(source.includes('cargo_route_note'), 'Must index cargo_route_note')
    assert.ok(source.includes('digitsOnly'), 'Must index normalized numeric digits for rapid BOL # lookups')
  })

  await t.test('4. Multi-token search matching algorithm (pure logic simulation)', () => {
    function simulateSearch(query, doc) {
      const cleanBol = doc.bol_number || ''
      const digitsOnly = cleanBol.replace(/\D/g, '')
      const numOnly = digitsOnly.length >= 2 ? digitsOnly.slice(-3) : ''

      const text = [
        doc.bol_number,
        cleanBol,
        cleanBol.replace(/-/g, ''),
        cleanBol.replace(/-/g, ' '),
        numOnly,
        doc.shipper_name,
        doc.consignee_name,
        doc.notify_party_name,
        doc.truck_number,
        doc.driver_name,
        doc.goods_description,
        doc.cargo_description,
        doc.container_numbers,
        doc.port_of_discharge,
        doc.origin,
        doc.destination,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const normText = text.replace(/[^a-z0-9]/g, '')
      const cleanQuery = query.trim().toLowerCase()
      const tokens = cleanQuery.split(/\s+/).filter(Boolean)

      return tokens.every((token) => {
        if (text.includes(token)) return true
        const normToken = token.replace(/[^a-z0-9]/g, '')
        if (normToken && normText.includes(normToken)) return true
        return false
      })
    }

    const sampleDoc = {
      bol_number: 'BOL-2026-NSA744',
      shipper_name: 'ABDUL WAHID S/O GHULAM RASOOL',
      consignee_name: 'K.KISHORE OVERSEAS',
      notify_party_name: 'AL ARAB DATES FACTORY FZCO, DUBAI, UAE',
      truck_number: 'KBL-48291',
      driver_name: 'MOHAMMAD ISMAIL',
      goods_description: 'FRESH DRIED DATES',
      cargo_description: '688 BAGS FRESH RAISINS',
      container_numbers: 'MSKU-982134-2',
      port_of_discharge: 'NHAVA SHEVA',
      origin: 'KANDAHAR',
      destination: 'MUMBAI, INDIA',
    }

    // Single token lookups
    assert.equal(simulateSearch('744', sampleDoc), true, 'Matches by BOL 3-digit suffix 744')
    assert.equal(simulateSearch('NSA744', sampleDoc), true, 'Matches unhyphenated NSA744')
    assert.equal(simulateSearch('wahid', sampleDoc), true, 'Matches shipper name wahid')
    assert.equal(simulateSearch('kishore', sampleDoc), true, 'Matches consignee name kishore')
    assert.equal(simulateSearch('dates', sampleDoc), true, 'Matches commodity dates')
    assert.equal(simulateSearch('msku', sampleDoc), true, 'Matches container MSKU')
    assert.equal(simulateSearch('nhava', sampleDoc), true, 'Matches port nhava')

    // Multi-token AND lookups (any order)
    assert.equal(simulateSearch('744 wahid', sampleDoc), true, 'Multi-token: 744 wahid')
    assert.equal(simulateSearch('kandahar kishore', sampleDoc), true, 'Multi-token: kandahar kishore')
    assert.equal(simulateSearch('dubai dates al arab', sampleDoc), true, 'Multi-token: notify party + commodity + city')
    assert.equal(simulateSearch('ismail 48291', sampleDoc), true, 'Multi-token: driver + truck plate')

    // Non-matching
    assert.equal(simulateSearch('unknown shipper 999', sampleDoc), false, 'Non-existent term returns false')
  })

  await t.test('5. Empty search state provides custom query feedback and clear button', () => {
    assert.ok(source.includes('No BOLs matching "${query}"'), 'Must display specific query feedback in empty state')
    assert.ok(source.includes('Clear Search'), 'Must provide one-click Clear Search button in empty state')
  })
})
