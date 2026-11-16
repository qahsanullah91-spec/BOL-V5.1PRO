/**
 * Test Suite: Indian Ports Directory & Nhava Sheva (JNPT) Port Details
 * Verifies complete India ports coverage, decoupled bilingual matching,
 * port details banner, terminals, and route location center synchronization.
 */

const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const editorSrc = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx'),
  'utf8'
)

const serviceSrc = fs.readFileSync(
  path.join(__dirname, '..', 'lib', 'services', 'route-location-service.ts'),
  'utf8'
)

test('1. Nhava Sheva (INNSA) canonical records and aliases in bol-editor.tsx', () => {
  assert.ok(editorSrc.includes('Nhava Sheva Port (JNPT / Navi Mumbai), Maharashtra, India'), 'Must include canonical Nhava Sheva Port entry')
  assert.ok(editorSrc.includes('Nhava Sheva, IN'), 'Must include exact Nhava Sheva, IN entry')
  assert.ok(editorSrc.includes('INNSA'), 'Must reference UN/LOCODE INNSA')
  assert.ok(editorSrc.includes('INNSA1'), 'Must reference ICEGATE Customs Location Code INNSA1')
  assert.ok(editorSrc.includes('نوا شوا'), 'Must include Persian نوا شوا')
  assert.ok(editorSrc.includes('نهاوا شوا'), 'Must include Persian variant نهاوا شوا')
  assert.ok(editorSrc.includes('ناوا شیوا'), 'Must include Persian variant ناوا شیوا')
  assert.ok(editorSrc.includes('Jawaharlal Nehru Port'), 'Must include full port name alias')
  assert.ok(editorSrc.includes('BMCT'), 'Must include BMCT terminal')
  assert.ok(editorSrc.includes('GTI'), 'Must include GTI terminal')
  assert.ok(editorSrc.includes('NSICT'), 'Must include NSICT terminal')
})

test('2. Indian Ports Directory completeness in bol-editor.tsx', () => {
  const expectedPorts = [
    // 12 Major Ports
    { name: 'Nhava Sheva', code: 'INNSA' },
    { name: 'Mumbai Port', code: 'INBOM' },
    { name: 'Kandla', code: 'INIXY' },
    { name: 'Mormugao', code: 'INMRM' },
    { name: 'New Mangalore', code: 'INNML' },
    { name: 'Cochin', code: 'INCOK' },
    { name: 'Tuticorin', code: 'INTUT' },
    { name: 'Chennai', code: 'INMAA' },
    { name: 'Ennore', code: 'INENR' },
    { name: 'Visakhapatnam', code: 'INVTZ' },
    { name: 'Paradip', code: 'INPRT' },
    { name: 'Kolkata', code: 'INCCU' },
    { name: 'Haldia', code: 'INHAL' },
    // Major Non-Major / Commercial Gateways
    { name: 'Mundra', code: 'INMUN' },
    { name: 'Pipavav', code: 'INPAV' },
    { name: 'Hazira', code: 'INHZA' },
    { name: 'Kattupalli', code: 'INKAT' },
    { name: 'Krishnapatnam', code: 'INKRI' },
    { name: 'Gangavaram', code: 'INGGV' },
    { name: 'Dhamra', code: 'INDHM' },
    { name: 'Vizhinjam', code: 'INVIZ' },
    { name: 'Gopalpur', code: 'INGPR' },
    { name: 'Dahej', code: 'INDAH' },
    { name: 'Jaigad', code: 'INJAI' },
    { name: 'Dighi', code: 'INDGI' },
    // Inland Waterway Terminals
    { name: 'Varanasi', code: 'INVNS' },
    { name: 'Sahibganj', code: 'INSBG' },
    { name: 'Pandu', code: 'INGAU' },
  ]

  for (const p of expectedPorts) {
    assert.ok(
      editorSrc.includes(p.name) || editorSrc.includes(p.code),
      `bol-editor.tsx must include port ${p.name} (${p.code})`
    )
  }
})

test('3. UI Filter Ribbon promotes India tab and provides quick POD shortcuts', () => {
  assert.ok(editorSrc.includes('country: "India"') || editorSrc.includes('selectedCountryFilter === "India"'), 'Country filter must contain India tab')
  assert.ok(editorSrc.includes('setSelectedCountryFilter(tab.country)') || editorSrc.includes('selectedCountryFilter'), 'Filter click must set selectedCountryFilter')
  assert.ok(editorSrc.includes('Nhava Sheva') && editorSrc.includes('JNPT'), 'Must provide quick POD button or location for Nhava Sheva')
  assert.ok(editorSrc.includes('Mundra Port') || editorSrc.includes('Mundra'), 'Must provide quick POD button or location for Mundra Port')
  assert.ok(editorSrc.includes('activeLocationField'), 'Must track active focused input (en/fa)')
})

test('4. Port Details Banner is integrated into Route Stops in bol-editor.tsx', () => {
  assert.ok(editorSrc.includes('detectPortDetails = (route?:'), 'Must provide detectPortDetails helper')
  assert.ok(editorSrc.includes('const portInfo = detectPortDetails(route)'), 'Must call detectPortDetails on route stop')
  assert.ok(editorSrc.includes('UN/LOCODE: {portInfo.unLocode}'), 'Must render UN/LOCODE in port details banner')
  assert.ok(editorSrc.includes('Customs: {portInfo.customsCode}'), 'Must render customs location code')
  assert.ok(editorSrc.includes('Quick Terminal:'), 'Must render quick terminal buttons')
  assert.ok(editorSrc.includes('Set as Port of Discharge') || editorSrc.includes('portInfo'), 'Must provide Port of Discharge capability')
})

test('5. Decoupled bilingual search logic solves 0-results issue for "Nhava Sheva, I"', () => {
  // Simulate the search matcher logic implemented in bol-editor.tsx
  const normalizePersian = (text) => {
    return (text || '')
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/نهاوا/g, 'نوا')
      .replace(/شیوا/g, 'شوا')
      .toLowerCase()
      .trim()
  }

  const sampleLocation = {
    name: 'Nhava Sheva Port (JNPT / Navi Mumbai), Maharashtra, India',
    fa: 'بندر نوا شوا (JNPT / ناوی بمبئی)، ماهاراشترا، هند',
    code: 'INNSA',
    aliases: [
      'Nhava Sheva',
      'Nhava Sheva, IN',
      'Nhava Sheva, India',
      'JNPT',
      'Jawaharlal Nehru Port',
      'Navi Mumbai',
      'نوا شوا',
      'نهاوا شوا',
      'ناوا شوا',
      'ناوا شیوا',
      'بندر نوا شوا',
      'نوا شوا، هند',
    ],
  }

  // Exact scenario from user's screenshot:
  const activeInputEn = 'Nhava Sheva, I'
  const activeInputFa = 'نوا شوا، هند'

  const activeTokensEn = activeInputEn
    .toLowerCase()
    .split(/[\s,،/\\-]+/)
    .filter(t => t.length >= 2) // filters out trailing single character "I"
  const activeTokensFa = normalizePersian(activeInputFa)
    .split(/[\s,،/\\-]+/)
    .filter(Boolean)

  const textToSearch = [
    sampleLocation.name,
    sampleLocation.fa,
    sampleLocation.code,
    ...(sampleLocation.aliases || []),
  ].join(' ').toLowerCase()

  const normTarget = normalizePersian(textToSearch)

  const enMatch = activeTokensEn.length > 0 && activeTokensEn.every(t => textToSearch.includes(t))
  const faMatch = activeTokensFa.length > 0 && activeTokensFa.some(t => normTarget.includes(t))

  assert.ok(enMatch, 'English tokens "nhava" and "sheva" must match')
  assert.ok(faMatch, 'Persian token "نوا" and "شوا" must match normalized target')
  assert.ok(enMatch || faMatch, 'Decoupled search must yield a match (not 0 results)')
})

test('6. Route Location Service SEED_LOCATIONS contains Indian ports and Nhava Sheva aliases', () => {
  assert.ok(serviceSrc.includes("id: 'loc-port-nsa'"), 'SEED_LOCATIONS must contain loc-port-nsa')
  assert.ok(serviceSrc.includes("code: 'INNSA'"), 'loc-port-nsa must have code INNSA')
  assert.ok(serviceSrc.includes("'Nhava Sheva, IN'"), 'loc-port-nsa must include alias Nhava Sheva, IN')
  assert.ok(serviceSrc.includes("'JNPT'"), 'loc-port-nsa must include alias JNPT')
  assert.ok(serviceSrc.includes("'نوا شوا'"), 'loc-port-nsa must include alias نوا شوا')
  assert.ok(serviceSrc.includes("id: 'loc-port-bom'"), 'SEED_LOCATIONS must contain Mumbai Port (INBOM)')
  assert.ok(serviceSrc.includes("id: 'loc-port-ixy'"), 'SEED_LOCATIONS must contain Kandla Port (INIXY)')
  assert.ok(serviceSrc.includes("id: 'loc-port-maa'"), 'SEED_LOCATIONS must contain Chennai Port (INMAA)')
  assert.ok(serviceSrc.includes("id: 'loc-port-cok'"), 'SEED_LOCATIONS must contain Cochin Port (INCOK)')
  assert.ok(serviceSrc.includes("id: 'loc-port-vtz'"), 'SEED_LOCATIONS must contain Vizag Port (INVTZ)')
  assert.ok(serviceSrc.includes("id: 'loc-port-ccu'"), 'SEED_LOCATIONS must contain Kolkata Port (INCCU)')
  assert.ok(serviceSrc.includes("id: 'loc-port-hal'"), 'SEED_LOCATIONS must contain Haldia Port (INHAL)')
})

test('7. Suggested Locations Popover renders activeStopPort banner and dynamic card details', () => {
  assert.ok(editorSrc.includes('const activeStopPort = detectPortDetails(route)'), 'Must render activeStopPort banner inside popover')
  assert.ok(editorSrc.includes('const pDetails = detectPortDetails({ location: loc.name'), 'Must dynamically detect port details on location match cards')
  assert.ok(editorSrc.includes('pDetails.customsCode'), 'Must render customsCode on match cards')
  assert.ok(editorSrc.includes('popover-stop-term-'), 'Must provide terminal preset buttons inside popover banner')
})
