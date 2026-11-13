const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Company Stamp & Signature Improvement Suite', async (t) => {
  const previewPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'a4-preview.tsx');
  const cssPath = path.join(process.cwd(), 'app', 'globals.css');
  const dataPath = path.join(process.cwd(), 'lib', 'company-stamp-data.ts');

  const previewSource = fs.readFileSync(previewPath, 'utf8');
  const cssSource = fs.readFileSync(cssPath, 'utf8');
  const dataSource = fs.readFileSync(dataPath, 'utf8');

  await t.test('1. Floating stamp size controls are positioned outside above the card to avoid blocking the stamp', () => {
    assert.ok(
      previewSource.includes('no-print absolute -top-8 right-0') || previewSource.includes('-top-8 right-0'),
      'Stamp size control pill must be positioned at -top-8 right-0 so it does not cover the stamp'
    );
    assert.ok(
      !previewSource.includes('data-stamp-controls="true"\n          className="no-print absolute top-1 right-1'),
      'Stamp controls must NOT be positioned at top-1 right-1 inside the card'
    );
  });

  await t.test('2. Stamp base height and maxWidth are enlarged for authentic prominent presence', () => {
    assert.ok(
      previewSource.includes('32mm') && previewSource.includes('56mm'),
      'Stamp in normal mode must have expanded dimensions up to 32mm height and 56mm maxWidth'
    );
    assert.ok(
      previewSource.includes('h-[19.5mm]'),
      'Chamber placeholder must provide comfortable 19.5mm height for enlarged stamp'
    );
  });

  await t.test('3. Transform scaling applies full uninhibited scale without artificial down-multiplier', () => {
    assert.ok(
      previewSource.includes('currentScale * (isUltraCompact ? 0.9 : 1.0)'),
      'Transform must allow full 1.0x scale in standard mode'
    );
    assert.ok(
      !previewSource.includes('currentScale * (isUltraCompact ? 0.75 : 0.85)'),
      'Must remove artificial 0.85 down-scaling multiplier'
    );
  });

  await t.test('4. Enhanced visual clarity, contrast, and print rendering', () => {
    assert.ok(
      previewSource.includes('imageRendering: "-webkit-optimize-contrast"'),
      'Must optimize contrast for image rendering'
    );
    assert.ok(
      previewSource.includes('contrast(1.08)'),
      'Must apply contrast enhancement for deep physical ink look'
    );
  });

  await t.test('5. Max allowed scale supports enlargement up to 250%', () => {
    assert.ok(
      previewSource.includes('2.5'),
      'Max allowed scale must support up to 2.5 (250%)'
    );
  });

  await t.test('6. Print and PDF rules in globals.css allow full stamp expansion', () => {
    assert.ok(
      cssSource.includes('height: 30mm !important'),
      'Print stylesheet must allow stamp height up to 30mm'
    );
    assert.ok(
      cssSource.includes('max-width: 56mm !important'),
      'Print stylesheet must allow stamp max-width up to 56mm'
    );
  });

  await t.test('7. Default stamp config calibrated for prominent display', () => {
    assert.ok(
      dataSource.includes('scale: 1.25'),
      'Default stamp scale must be calibrated to 1.25'
    );
  });
});
