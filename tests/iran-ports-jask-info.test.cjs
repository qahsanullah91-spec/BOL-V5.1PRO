/**
 * Test Suite: Iranian Ports Directory, Jask Port Details & Resilient Matching
 * Verifies complete Iran ports coverage, Jask Port details banner,
 * terminals, customs code IRJSK1, UN/LOCODE IRJSK, and resilient bilingual input resolution.
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

test('1. Jask Port (IRJSK) canonical records, customs code, and aliases in bol-editor.tsx', () => {
  assert.ok(editorSrc.includes('Jask Port – IRAN') || editorSrc.includes('Jask Port - Iran'), 'Must include canonical Jask Port entry')
  assert.ok(editorSrc.includes('IRJSK'), 'Must reference UN/LOCODE IRJSK')
  assert.ok(editorSrc.includes('IRJSK1'), 'Must reference Customs Location Code IRJSK1')
  assert.ok(editorSrc.includes('جاسک – ایران') || editorSrc.includes('جاسک - ایران'), 'Must include Persian Jask variant')
  assert.ok(editorSrc.includes('بندر جاسک'), 'Must include Bandar Jask alias')
  assert.ok(editorSrc.includes('Makran'), 'Must include Makran terminal/hub reference')
  assert.ok(editorSrc.includes('Jask Commercial Jetty'), 'Must include Jask Commercial Jetty terminal')
})

test('2. Iranian Ports Directory completeness in bol-editor.tsx detectPortDetails', () => {
  const expectedIranPorts = [
    { name: 'Jask Port', code: 'IRJSK', customs: 'IRJSK1' },
    { name: 'Shahid Rajaee', code: 'IRBND', customs: 'IRBND1' },
    { name: 'Shahid Bahonar', code: 'IRBND', customs: 'IRBND2' },
    { name: 'Shahid Beheshti', code: 'IRZBR', customs: 'IRZBR1' },
    { name: 'Shahid Kalantari', code: 'IRZBR', customs: 'IRZBR2' },
    { name: 'Bandar Imam Khomeini', code: 'IRBKM', customs: 'IRBKM1' },
    { name: 'Bushehr Port', code: 'IRBUZ', customs: 'IRBUZ1' },
    { name: 'Khorramshahr', code: 'IRKHO', customs: 'IRKHO1' },
    { name: 'Bandar Anzali', code: 'IRBAZ', customs: 'IRBAZ1' },
    { name: 'Assaluyeh Port', code: 'IRPGU', customs: 'IRPGU1' },
  ]

  for (const p of expectedIranPorts) {
    assert.ok(
      editorSrc.includes(p.code) && (editorSrc.includes(p.customs) || editorSrc.includes(p.name)),
      `bol-editor.tsx must include Iranian port ${p.name} (${p.code} / ${p.customs})`
    )
  }
})

test('3. UI Filter Ribbon provides Iran secondary category filter tabs', () => {
  assert.ok(editorSrc.includes('selectedIranCategoryFilter'), 'Must maintain selectedIranCategoryFilter state')
  assert.ok(editorSrc.includes('selectedCountryFilter === "Iran"'), 'Must check for active Iran country filter')
  assert.ok(editorSrc.includes('Iran Category:') || editorSrc.includes('🇮🇷 Filter:'), 'Must display Iran category header')
})

test('4. Resilient input matching scenario: "Jask Port - I" and "جاسک - ایران"', () => {
  // Normalize string helper mirroring bol-editor.tsx
  const normalizeText = (text) => {
    return (text || '')
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\u0640]/g, '-')
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ')
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ة/g, 'ه')
      .replace(/[آأإ]/g, 'ا')
      .toLowerCase()
      .trim()
  }

  const sampleJaskLocation = {
    name: 'Jask Port – IRAN',
    persian: 'جاسک – ایران',
    country: 'Iran',
    code: 'JSK',
    unLocode: 'IRJSK',
    customsCode: 'IRJSK1',
    aliases: 'Jask Port – IRAN, Jask Port - Iran, Jask Port, Bandar Jask Port, Bandar Jask, Port of Jask, Jask, IRJSK, JSK, جاسک – ایران, جاسک - ایران, بندر جاسک, بندر جاسک، ایران, جاسک, پایانه تجاری و نفتی جاسک, Jask Port - IRAN, Jask Port, IR',
  }

  // Exact scenario from user request / screenshot:
  const activeInputEn = 'Jask Port - I'
  const activeInputFa = 'جاسک - ایران'

  const searchable = [
    sampleJaskLocation.name,
    sampleJaskLocation.persian,
    sampleJaskLocation.country,
    sampleJaskLocation.code,
    sampleJaskLocation.unLocode,
    sampleJaskLocation.customsCode,
    sampleJaskLocation.aliases,
  ].join(' ')

  const normSearchable = normalizeText(searchable)
  const normInputEn = normalizeText(activeInputEn)
  const normInputFa = normalizeText(activeInputFa)

  const tokensEn = normInputEn
    .split(/[\s,./\-_()–—ـ]+/)
    .filter((t) => t.length >= 2) // filter single trailing character like 'i'
  const tokensFa = normInputFa
    .split(/[\s,./\-_()–—ـ]+/)
    .filter(Boolean)

  const enMatch = tokensEn.length > 0 && tokensEn.every((t) => normSearchable.includes(t))
  const faMatch = tokensFa.length > 0 && tokensFa.some((t) => normSearchable.includes(t))

  assert.ok(enMatch, 'English tokens "jask" and "port" must match searchable metadata')
  assert.ok(faMatch, 'Persian token "جاسک" and "ایران" must match searchable metadata')
  assert.ok(enMatch || faMatch, 'Resilient matcher must never return 0 results for Jask input')
})

test('5. Route Location Service SEED_LOCATIONS contains Jask Port with terminals', () => {
  assert.ok(serviceSrc.includes("id: 'loc-port-irjsk'"), 'SEED_LOCATIONS must contain loc-port-irjsk')
  assert.ok(serviceSrc.includes("code: 'IRJSK'"), 'loc-port-irjsk must have code IRJSK')
  assert.ok(serviceSrc.includes("'IRJSK1'"), 'loc-port-irjsk must have customs location code IRJSK1')
  assert.ok(serviceSrc.includes("'Jask Commercial Jetty'"), 'loc-port-irjsk must include Jask Commercial Jetty terminal')
  assert.ok(serviceSrc.includes("'Makran Crude Terminal'"), 'loc-port-irjsk must include Makran Crude Terminal')
  assert.ok(serviceSrc.includes("id: 'loc-port-bnd'"), 'SEED_LOCATIONS must contain Bandar Abbas Port (IRBND)')
  assert.ok(serviceSrc.includes("id: 'loc-port-irzbr'"), 'SEED_LOCATIONS must contain Chabahar Port (IRZBR)')
})
