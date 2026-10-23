const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const loadTypescript = require('./load-typescript.cjs')

const {
  convertToPersianDigits,
  convertToLatinDigits,
  getProvinceInfo,
  getProvinceCode,
  normalizeProvinceName,
  parseAfghanPlate,
} = loadTypescript('lib/utils/afghan-plate.ts')

test('Afghan Vehicle Plate UI: Reference Plate (12346 کابل ل) matches authentic Afghan registration standards', () => {
  const plate = parseAfghanPlate('12346 کابل ل')
  assert.equal(plate.plateNumber, '12346')
  assert.equal(plate.plateNumberFa, '۱۲۳۴۶')
  assert.equal(plate.provinceFa, 'کابل')
  assert.equal(plate.provinceCode, 'KBL')
  assert.equal(plate.provinceEn, 'Kabul')
  assert.equal(plate.hasLetter, true)
  assert.equal(plate.plateLetterFa, 'ل')
  assert.equal(plate.plateLetterEn, 'L')
})

test('Afghan Vehicle Plate UI: Reverse-order and Latin inputs resolve accurately', () => {
  // Province first in Persian: هلمند 3292
  const faFirst = parseAfghanPlate('هلمند 3292')
  assert.equal(faFirst.plateNumber, '3292')
  assert.equal(faFirst.plateNumberFa, '۳۲۹۲')
  assert.equal(faFirst.provinceCode, 'HLM')
  assert.equal(faFirst.provinceFa, 'هلمند')

  // Latin code with hyphen: HLM-3292
  const latinCode = parseAfghanPlate('HLM-3292')
  assert.equal(latinCode.plateNumber, '3292')
  assert.equal(latinCode.plateNumberFa, '۳۲۹۲')
  assert.equal(latinCode.provinceCode, 'HLM')
  assert.equal(latinCode.provinceFa, 'هلمند')

  // Full English name: 3292 Helmand
  const engName = parseAfghanPlate('3292 Helmand')
  assert.equal(engName.plateNumber, '3292')
  assert.equal(engName.provinceCode, 'HLM')
  assert.equal(engName.provinceFa, 'هلمند')
})

test('Afghan Vehicle Plate UI: Commercial vehicle classification letters (e.g. ل / L for Lorri/Truck)', () => {
  const truckPlate = parseAfghanPlate('24345 کابل ل')
  assert.equal(truckPlate.plateNumber, '24345')
  assert.equal(truckPlate.plateNumberFa, '۲۴۳۴۵')
  assert.equal(truckPlate.provinceCode, 'KBL')
  assert.equal(truckPlate.hasLetter, true)
  assert.equal(truckPlate.plateLetterFa, 'ل')
  assert.equal(truckPlate.plateLetterEn, 'L')
})

test('Afghan Vehicle Plate UI: Component implements exact same-to-same white flat plate layout & landmark', () => {
  const vehicleComponentPath = path.resolve(__dirname, '..', 'components', 'ui', 'afghan-vehicle-plate.tsx')
  const truckComponentPath = path.resolve(__dirname, '..', 'components', 'ui', 'afghan-truck-plate.tsx')

  assert.ok(fs.existsSync(vehicleComponentPath), 'afghan-vehicle-plate.tsx must exist')
  assert.ok(fs.existsSync(truckComponentPath), 'afghan-truck-plate.tsx must exist')

  const code = fs.readFileSync(vehicleComponentPath, 'utf8')

  // 1. Exact plate structure: pure white background & thin solid black outer border
  assert.ok(code.includes('data-afghan-plate="true"'), 'Must have data attribute')
  assert.ok(code.includes('bg-white') && code.includes('#ffffff'), 'Must have pure white background')
  assert.ok(code.includes('border-black'), 'Must have thin solid black border')

  // 2. No screws, metallic effects, gradients, shadows, or fake bolt heads
  assert.ok(!code.includes('PlateMountingBolt'), 'Must NOT have screws or mounting bolt heads')
  assert.ok(!code.includes('from-[#fdfcf9]'), 'Must NOT have metallic gradients')
  assert.ok(!code.includes('insetRim'), 'Must NOT have fake debossed rims')

  // 3. Landmark illustration
  assert.ok(code.includes('KABUL_LANDMARK_DATA_URI'), 'Must include authentic Kabul landmark asset')

  // 4. Typography & Proportions
  assert.ok(code.includes('vazirmatn') || code.includes('Noto Naskh Arabic'), 'Must use authentic Dari/Persian typeface')
  assert.ok(code.includes('data.provinceFa'), 'Must render Dari province')
  assert.ok(code.includes('data.numberFa'), 'Must render Persian numerals')
  assert.ok(code.includes('data.provinceCode'), 'Must render Latin province code')
  assert.ok(code.includes('data.number'), 'Must render Latin numerals')
  assert.ok(code.includes('data.letterFa'), 'Must support Dari category letter')
  assert.ok(code.includes('data.letterEn'), 'Must support Latin category letter')
  assert.ok(code.includes('tabular-nums'), 'Must use tabular numerals for digit alignment')
  assert.ok(code.includes('unicodeBidi: "isolate"'), 'Must isolate numbers to prevent digit reversal')
})
