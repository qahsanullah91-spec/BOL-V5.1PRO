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
  assert.ok(code.includes('digitsFa.map'), 'Must map individual Persian digits to prevent ligature collision')
  assert.ok(code.includes('digitsEn.map'), 'Must map individual Latin digits for 1:1 column alignment')
})

test('Afghan Vehicle Plate UI: Compound inputs like 2142نیمروز and Pashto spellings resolve accurately', () => {
  const nimrozPlate = parseAfghanPlate('2142نیمروز')
  assert.equal(nimrozPlate.plateNumber, '2142')
  assert.equal(nimrozPlate.plateNumberFa, '۲۱۴۲')
  assert.equal(nimrozPlate.provinceFa, 'نیمروز')
  assert.equal(nimrozPlate.provinceCode, 'NRZ')
  assert.equal(nimrozPlate.provinceEn, 'Nimroz')

  const wardakPlate = parseAfghanPlate('3214وردګ')
  assert.equal(wardakPlate.plateNumber, '3214')
  assert.equal(wardakPlate.plateNumberFa, '۳۲۱۴')
  assert.equal(wardakPlate.provinceFa, 'وردک')
  assert.equal(wardakPlate.provinceCode, 'WDK')

  const nangarharPlate = parseAfghanPlate('5512 ننګرهار')
  assert.equal(nangarharPlate.plateNumber, '5512')
  assert.equal(nangarharPlate.provinceCode, 'NGR')
})

test('Afghan Vehicle Plate UI: Trademark/landmark emblem sizing is calibrated to match plate hierarchy without text collision', () => {
  const vehicleComponentPath = path.resolve(__dirname, '..', 'components', 'ui', 'afghan-vehicle-plate.tsx')
  const code = fs.readFileSync(vehicleComponentPath, 'utf8')

  // Verify compact landmark height is enlarged (18px) for prominent legibility
  assert.match(code, /compact:\s*\{[^}]*landmarkH:\s*"h-\[18px\]"/, 'Compact landmark height must be calibrated bigger (18px)');

  // Verify sm landmark height is scaled up (14px)
  assert.match(code, /sm:\s*\{[^}]*landmarkH:\s*"h-\[14px\]"/, 'Small landmark height must be calibrated bigger (14px)');

  // Verify overflow-hidden and bounding constraints are present on landmark slot
  assert.ok(code.includes('overflow-hidden my-auto'), 'Landmark container must enforce overflow containment and vertical centering');
  assert.ok(code.includes('max-w-[82%]'), 'Landmark image must enforce maximum width constraint to prevent horizontal collision');
})


