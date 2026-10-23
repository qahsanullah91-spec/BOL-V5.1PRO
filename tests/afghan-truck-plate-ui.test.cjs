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

test('Afghan Truck Plate UI: Reference Plate (3292 هلمند) matches authentic Afghan registration standards', () => {
  const plate = parseAfghanPlate('3292 هلمند')
  assert.equal(plate.plateNumber, '3292')
  assert.equal(plate.plateNumberFa, '۳۲۹۲')
  assert.equal(plate.provinceFa, 'هلمند')
  assert.equal(plate.provinceCode, 'HLM')
  assert.equal(plate.provinceEn, 'Helmand')
  assert.equal(plate.hasLetter, false)
})

test('Afghan Truck Plate UI: Reverse-order and Latin inputs resolve accurately', () => {
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

test('Afghan Truck Plate UI: Commercial vehicle classification letters (e.g. ل / L for Lorri/Truck)', () => {
  const truckPlate = parseAfghanPlate('24345 کابل ل')
  assert.equal(truckPlate.plateNumber, '24345')
  assert.equal(truckPlate.plateNumberFa, '۲۴۳۴۵')
  assert.equal(truckPlate.provinceCode, 'KBL')
  assert.equal(truckPlate.hasLetter, true)
  assert.equal(truckPlate.plateLetterFa, 'ل')
  assert.equal(truckPlate.plateLetterEn, 'L')
})

test('Afghan Truck Plate UI: Component source file implements authentic physical metal styling and layout', () => {
  const componentPath = path.resolve(__dirname, '..', 'components', 'ui', 'afghan-truck-plate.tsx')
  assert.ok(fs.existsSync(componentPath), 'afghan-truck-plate.tsx must exist')

  const code = fs.readFileSync(componentPath, 'utf8')

  // 1. Authentic plate materials & borders
  assert.ok(code.includes('data-afghan-plate="true"'), 'Must have data attribute')
  assert.ok(code.includes('border-[#161616]'), 'Must have dark black metal outer frame')
  assert.ok(code.includes('insetRim') && code.includes('border-slate-400/50'), 'Must have inner stamped debossed rim line')
  assert.ok(code.includes('PlateMountingBolt'), 'Must have realistic stamped mounting bolts')
  assert.ok(code.includes('AfghanNationalPlateEmblem'), 'Must have official Afghanistan emblem silhouette')

  // 2. Proportions and Typography
  assert.ok(code.includes('Times New Roman') || code.includes('font-serif'), 'Must use serif font for Latin letters and numbers')
  assert.ok(code.includes('vazirmatn') || code.includes('Noto Naskh Arabic'), 'Must use authentic Dari/Persian typeface')
  assert.ok(code.includes('tracking-[0.2em]') || code.includes('tracking-[0.22em]'), 'Must use authentic wide letter-spacing for Persian numerals')

  // 3. Row & Column Alignment
  assert.ok(code.includes('data.provinceFa'), 'Must render Dari province on top row')
  assert.ok(code.includes('data.numberFa'), 'Must render Persian numerals on top row')
  assert.ok(code.includes('data.provinceCode'), 'Must render Latin province code on bottom row')
  assert.ok(code.includes('data.number'), 'Must render Latin numerals on bottom row')
  assert.ok(code.includes('tabular-nums'), 'Must use tabular numerals for perfect digit alignment')
})
