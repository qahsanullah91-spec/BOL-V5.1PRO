const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Cargo Section 1 & Section 2 UI Layout and Sizing Polish Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..');
  const bolEditorPath = path.join(rootDir, 'components', 'bill-of-lading', 'bol-editor.tsx');

  assert.ok(fs.existsSync(bolEditorPath), 'bol-editor.tsx must exist');
  const code = fs.readFileSync(bolEditorPath, 'utf8');

  const s1Start = code.indexOf('{/* Field Grid - Section 1: Shipment & Packaging Inputs */}');
  const s2Start = code.indexOf('{/* Field Grid - Row 2: Rates, Weights & Valuation */}');
  const s3Start = code.indexOf('{/* Field Grid - Row 3: Cargo Description Studio */}');

  assert.ok(s1Start !== -1, 'Section 1 must exist');
  assert.ok(s2Start !== -1, 'Section 2 must exist');
  assert.ok(s3Start !== -1, 'Section 3 must exist');

  const s1Code = code.slice(s1Start, s2Start);
  const s2Code = code.slice(s2Start, s3Start);

  await t.test('1. Section 1 Container No: Full horizontal prefix row without vertical laddering', () => {
    assert.ok(s1Code.includes('Prefix:'), 'Prefix label must exist');
    assert.ok(s1Code.includes('"MSCU"') && s1Code.includes('+{pfx}'), 'MSCU dynamic prefix button must exist');
    assert.ok(s1Code.includes('"CMAU"'), 'CMAU dynamic prefix button must exist');
    assert.ok(s1Code.includes('"COSU"'), 'COSU dynamic prefix button must exist');
    assert.ok(s1Code.includes('"MEDU"'), 'MEDU dynamic prefix button must exist');
    assert.ok(s1Code.includes('"MAEU"'), 'MAEU dynamic prefix button must exist');
    assert.ok(s1Code.includes('"TGHU"'), 'TGHU dynamic prefix button must exist');
    assert.ok(s1Code.includes('whitespace-nowrap'), 'Buttons must have whitespace-nowrap to avoid breaking text');
  });

  await t.test('2. Section 1 Gross Wt: Label and tare badge do not collide with Persian text', () => {
    assert.ok(s1Code.includes('Gross Wt. / Carton'), 'Gross Wt label must exist');
    assert.ok(s1Code.includes('وزن ناخالص کارتن'), 'Persian label must exist');
    assert.ok(s1Code.includes('shrink-0'), 'Persian label must have shrink-0 to prevent collision');
  });

  await t.test('3. Section 1: All 5 inputs retain h-11 height', () => {
    const h11Matches = s1Code.match(/h-11/g);
    assert.ok(h11Matches && h11Matches.length >= 5, 'Section 1 must have at least 5 h-11 inputs');
  });

  await t.test('4. Section 2 Rate Presets: All 5 rate buttons layout horizontally', () => {
    assert.ok(s2Code.includes('Rate Presets:'), 'Rate Presets label must exist');
    assert.ok(s2Code.includes('"0.85"') && s2Code.includes('${r}'), '0.85 rate preset must exist');
    assert.ok(s2Code.includes('"1.20"'), '1.20 rate preset must exist');
    assert.ok(s2Code.includes('"2.50"'), '2.50 rate preset must exist');
    assert.ok(s2Code.includes('"3.80"'), '3.80 rate preset must exist');
    assert.ok(s2Code.includes('"4.50"'), '4.50 rate preset must exist');
  });

  await t.test('5. Section 2 Volume Presets: 4 container presets formatted cleanly', () => {
    assert.ok(s2Code.includes("20' STD"), "20' STD preset must exist");
    assert.ok(s2Code.includes("40' STD"), "40' STD preset must exist");
    assert.ok(s2Code.includes("40' HQ"), "40' HQ preset must exist");
    assert.ok(s2Code.includes("LCL"), "LCL preset must exist");
    assert.ok(s2Code.includes('grid-cols-4'), 'Volume presets must use a 4-column balanced grid');
  });

  await t.test('6. Section 2 Live Calculation Status Bar: Eliminates giant empty void', () => {
    assert.ok(s2Code.includes('Live Calculation Active'), 'Status bar must show live calculation state');
    assert.ok(s2Code.includes('Net Valuation:'), 'Status bar must show net valuation preview');
    assert.ok(s2Code.includes('formData.goods_value'), 'Status bar must bind to live goods_value');
  });
});
