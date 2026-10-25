const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('A4 Preview - Section Header UI & Sizing Test', async (t) => {
  const a4PreviewPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx');
  const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');

  assert.ok(fs.existsSync(a4PreviewPath), 'a4-preview.tsx must exist');
  assert.ok(fs.existsSync(globalsCssPath), 'app/globals.css must exist');

  const previewCode = fs.readFileSync(a4PreviewPath, 'utf8');
  const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

  await t.test('1. Section header gap between icon and title is resolved (no broken gap-1.2)', () => {
    assert.ok(!previewCode.includes('gap-1.2'), 'Must not have broken gap-1.2');
    assert.ok(previewCode.includes('gap-2.5 shrink-0'), 'Must have gap-2.5 shrink-0 for clear icon spacing');
  });

  await t.test('2. Section title and subtitle font sizes are significantly enlarged to match', () => {
    assert.ok(previewCode.includes('!text-[11.5pt]'), 'English section title must be enlarged to 11.5pt');
    assert.ok(previewCode.includes('!text-[12.2pt]'), 'Dari subtitle must be enlarged to 12.2pt to match optical presence');
  });

  await t.test('3. app/globals.css does not clamp section header height', () => {
    assert.ok(!cssCode.includes('[data-print-section] > div:first-child {\n    display: flex !important;\n    align-items: center !important;\n    justify-content: space-between !important;\n    height: 5.6mm'), 'globals.css must not clamp header height to 5.6mm');
    assert.ok(cssCode.includes('min-height: 7.2mm !important'), 'globals.css must allow comfortable min-height of 7.2mm');
    assert.ok(cssCode.includes('font-size: 11.5pt !important'), 'globals.css must set 11.5pt for section h3');
    assert.ok(cssCode.includes('font-size: 12.2pt !important'), 'globals.css must set 12.2pt for section bol-persian-text');
  });

  await t.test('4. Smooth gradient is enforced in both a4-preview and globals.css', () => {
    assert.ok(previewCode.includes('#1e40af 0%, #2563eb 55%, #0284c7 90%, #0891b2 100%'), 'a4-preview must have smooth rich gradient');
    assert.ok(cssCode.includes('#1e40af 0%'), 'globals.css must have #1e40af in gradient');
    assert.ok(cssCode.includes('#0284c7 90%'), 'globals.css must have #0284c7 in gradient');
  });
});
