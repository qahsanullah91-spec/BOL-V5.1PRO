const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Watermark Toolbar Button Icon-Only Audit', async (t) => {
  const toolbarPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview-toolbar.tsx');
  assert.ok(fs.existsSync(toolbarPath), 'a4-preview-toolbar.tsx must exist');

  const toolbarSrc = fs.readFileSync(toolbarPath, 'utf8');

  await t.test('1. Watermark button uses compact square icon-only button sizing (h-8 w-8 p-0)', () => {
    assert.match(
      toolbarSrc,
      /className="[^"]*h-8 w-8 p-0[^"]*"[\s\S]*?title=\{`Background & Watermark:/,
      'Watermark button must use h-8 w-8 p-0 icon-only class structure'
    );
  });

  await t.test('2. Watermark button renders Palette icon cleanly', () => {
    assert.match(
      toolbarSrc,
      /<Palette className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" \/>/,
      'Watermark button must render Palette icon with standard size'
    );
  });

  await t.test('3. Watermark button provides sr-only label for accessibility without visible text', () => {
    assert.match(
      toolbarSrc,
      /<span className="sr-only">Watermark[^<]*<\/span>/,
      'Watermark button must keep sr-only label for accessibility'
    );
  });
});
