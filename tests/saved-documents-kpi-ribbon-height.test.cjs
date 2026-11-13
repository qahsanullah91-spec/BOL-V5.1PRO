const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

test('Saved Documents KPI Analytics Ribbon Compact Height', async (t) => {
  const filePath = path.join(__dirname, '../components/bill-of-lading/saved-documents.tsx');
  const code = fs.readFileSync(filePath, 'utf8');

  await t.test('1. KPI cards use compact padding (px-3 py-2 sm:py-2.5) to reduce card height', () => {
    assert.ok(
      code.includes('px-3 py-2 sm:py-2.5'),
      'Cards must use compact padding to reduce vertical height'
    );
    assert.ok(
      !code.includes('Live Summary Analytics Metrics Ribbon') ||
      !code.includes('bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 p-3.5'),
      'Old tall p-3.5 padding must be replaced with compact padding'
    );
  });

  await t.test('2. Metric spacing uses mt-1 sm:mt-1.5 and leading-tight for streamlined height', () => {
    assert.ok(
      code.includes('mt-1 sm:mt-1.5 flex items-baseline justify-between relative') ||
      code.includes('mt-1 sm:mt-1.5 relative'),
      'Metric section must use compact top margin'
    );
    assert.ok(
      code.includes('leading-tight'),
      'Numbers must use leading-tight to eliminate unnecessary vertical line-height expansion'
    );
  });

  await t.test('3. Card headers and icons use sleek compact dimensions', () => {
    assert.ok(
      code.includes('Total BOLs') &&
      code.includes('Packages') &&
      code.includes('Total Weight') &&
      code.includes('Goods Value'),
      'All 4 core logistics KPI cards must be retained'
    );
    assert.ok(
      code.includes('مجموع بارنامه‌ها') &&
      code.includes('مجموع بسته‌ها') &&
      code.includes('مجموع وزن') &&
      code.includes('ارزش کالا'),
      'Bilingual Dari/Pashto labels must be preserved'
    );
  });
});
