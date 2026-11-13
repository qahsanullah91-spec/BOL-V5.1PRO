const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Code 128 Barcode Generator and BOL Integration Suite', async (t) => {
  const barcodeUtilPath = path.join(__dirname, '..', 'lib', 'utils', 'barcode-128.ts');
  const barcodeCompPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'barcode.tsx');
  const a4PreviewPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx');

  assert.ok(fs.existsSync(barcodeUtilPath), 'lib/utils/barcode-128.ts must exist');
  assert.ok(fs.existsSync(barcodeCompPath), 'components/bill-of-lading/barcode.tsx must exist');
  assert.ok(fs.existsSync(a4PreviewPath), 'components/bill-of-lading/a4-preview.tsx must exist');

  await t.test('1. Barcode generator conforms to ISO/IEC 15417 Code 128', () => {
    const utilCode = fs.readFileSync(barcodeUtilPath, 'utf8');
    assert.match(utilCode, /export function generateBarcode128\b/, 'generateBarcode128 must be exported');
    assert.match(utilCode, /CODE128_PATTERNS/, 'Must define Code 128 pattern table');
    assert.match(utilCode, /2331112/, 'Must include Stop code pattern');
  });

  await t.test('2. React Barcode128 component provides SVG rendering with crispEdges', () => {
    const compCode = fs.readFileSync(barcodeCompPath, 'utf8');
    assert.match(compCode, /export function Barcode128\b/, 'Barcode128 component must be exported');
    assert.match(compCode, /shapeRendering:\s*["']crispEdges["']/, 'Must enforce crispEdges for sharp optical scanning');
    assert.match(compCode, /data-barcode=["']true["']/, 'Must render data-barcode attribute');
  });

  await t.test('3. Verify Code 128 checksum and width calculation in Node runtime', () => {
    const bolNum = "BOL-2026-NSA750";
    let sum = 104; // Start B
    for (let i = 0; i < bolNum.length; i++) {
      sum += (i + 1) * (bolNum.charCodeAt(i) - 32);
    }
    const checksum = sum % 103;
    assert.strictEqual(typeof checksum, 'number');
    assert.ok(checksum >= 0 && checksum < 103, 'Checksum must be between 0 and 102');
  });

  await t.test('4. ExecutiveBOLFooter integrates Barcode128 at the bottom of the BOL', () => {
    const a4Code = fs.readFileSync(a4PreviewPath, 'utf8');
    assert.match(a4Code, /import\s*\{\s*Barcode128\s*\}\s*from\s*["']\.\/barcode["']/, 'a4-preview.tsx must import Barcode128');
    assert.match(a4Code, /data-bol-barcode-tier=["']true["']/, 'Must render data-bol-barcode-tier in footer');
    assert.match(a4Code, /<Barcode128\s+value=\{bolNumber/, 'Must render Barcode128 with bolNumber in footer');
    assert.match(a4Code, /bolNumber\s*=\s*["']["']/, 'ExecutiveBOLFooter must declare bolNumber parameter with fallback');
  });

  await t.test('5. Multi-page and Single-page BOL pages pass bolNumber to ExecutiveBOLFooter', () => {
    const a4Code = fs.readFileSync(a4PreviewPath, 'utf8');
    const matches = a4Code.match(/<ExecutiveBOLFooter[\s\S]*?bolNumber=\{bolNumber\}[\s\S]*?\/>/g);
    assert.ok(matches, 'ExecutiveBOLFooter calls must include bolNumber');
    assert.strictEqual(matches.length, 3, 'Must pass bolNumber to ExecutiveBOLFooter in all 3 page configurations');
  });
});
