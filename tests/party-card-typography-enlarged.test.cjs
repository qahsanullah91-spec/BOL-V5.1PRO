const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Party Card Typography Enlargement (Exporter, Consignee, Notify Party) ---');

const cssPath = path.join(__dirname, '../app/globals.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

const previewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
const previewCode = fs.readFileSync(previewPath, 'utf8');

// 1. Verify globals.css [data-bol-a4="true"] party-card-name font-size enlarged to >= 10.8pt
assert.ok(
  cssCode.includes('[data-bol-a4="true"] .party-card-name') &&
  cssCode.includes('font-size: 10.8pt !important;'),
  'A4 preview party-card-name must be enlarged to 10.8pt'
);

// 2. Verify globals.css [data-bol-a4="true"] party-card-info-text font-size enlarged to >= 9.4pt
assert.ok(
  cssCode.includes('[data-bol-a4="true"] .party-card-info-text') &&
  cssCode.includes('font-size: 9.4pt !important;'),
  'A4 preview party-card-info-text must be enlarged to 9.4pt'
);

// 3. Verify globals.css [data-bol-a4="true"] party-card-title and subtitle enlarged to >= 9.6pt
assert.ok(
  cssCode.includes('[data-bol-a4="true"] .party-card-title') &&
  cssCode.includes('font-size: 9.6pt !important;'),
  'A4 preview party-card-title must be enlarged to 9.6pt'
);
assert.ok(
  cssCode.includes('[data-bol-a4="true"] .party-card-subtitle') &&
  cssCode.includes('font-size: 9.6pt !important;'),
  'A4 preview party-card-subtitle must be enlarged to 9.6pt'
);

// 4. Verify a4-preview.tsx JSX uses enlarged font classes in normal mode
assert.ok(
  previewCode.includes('!text-[11.2pt]') && previewCode.includes('party-card-name company-name'),
  'a4-preview.tsx party-card-name must use enlarged 11.2pt typography in normal mode'
);
assert.ok(
  previewCode.includes('!text-[10.2pt]') && previewCode.includes('party-card-title'),
  'a4-preview.tsx party-card-title must use enlarged 10.2pt typography in normal mode'
);
assert.ok(
  previewCode.includes('!text-[9.6pt]') && previewCode.includes('party-card-info-text'),
  'a4-preview.tsx party-card-info-text must use enlarged 9.6pt typography in normal mode'
);

console.log('✓ All Party Card Typography Enlargement checks passed successfully!');
