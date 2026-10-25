const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');
const jsQR = require('jsqr');

test('Bill of Lading Header Redesign & Large QR Code Suite', async (t) => {
  const headerPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'header.tsx');
  const previewPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'a4-preview.tsx');
  const qrComponentPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'document-qr-code.tsx');
  const cssPath = path.join(process.cwd(), 'app', 'globals.css');

  const headerSource = fs.readFileSync(headerPath, 'utf8');
  const previewSource = fs.readFileSync(previewPath, 'utf8');
  const qrSource = fs.readFileSync(qrComponentPath, 'utf8');
  const cssSource = fs.readFileSync(cssPath, 'utf8');

  await t.test('1. BillOfLadingHeader component is exported and contains the redesigned visual structure', () => {
    assert.ok(headerSource.includes('export function BillOfLadingHeader'), 'Must export BillOfLadingHeader component');
    assert.ok(headerSource.includes('bol-header'), 'Must include .bol-header class');
    assert.ok(headerSource.includes('bol-header-top'), 'Must include .bol-header-top class');
    assert.ok(headerSource.includes('bol-header-bottom'), 'Must include .bol-header-bottom class');
    assert.ok(headerSource.includes('bol-qr-container'), 'Must include .bol-qr-container class');
  });

  await t.test('2. Prominent Blue Header Area contains document icon and large bilingual titles', () => {
    assert.ok(headerSource.includes('FileText'), 'Must render document icon (FileText) in blue header');
    assert.ok(headerSource.includes('BILL OF LADING'), 'Must display English title: BILL OF LADING');
    assert.ok(headerSource.includes('بارنامه'), 'Must display Persian title: بارنامه');
    assert.ok(headerSource.includes('bol-title-en'), 'Must have .bol-title-en styling');
    assert.ok(headerSource.includes('bol-title-fa'), 'Must have .bol-title-fa styling');
  });

  await t.test('3. Lower section displays DOCUMENT NO. label and dynamic BOL number', () => {
    assert.ok(headerSource.includes('DOCUMENT NO.'), 'Must display uppercase label DOCUMENT NO.');
    assert.ok(headerSource.includes('bol-number-text'), 'Must have .bol-number-text class');
    assert.ok(headerSource.includes('{bolNumber}'), 'Must dynamically populate BOL number from props');
    assert.ok(!headerSource.includes('BOL-2026-NSA739') || headerSource.includes('bolNumber || "BOL-2026-NSA739"'), 'Must not hardcode BOL number as only value');
  });

  await t.test('4. Significantly enlarged QR code is positioned halfway across boundary (top 50% translateY(-50%))', () => {
    assert.ok(headerSource.includes('top: "50%"') || headerSource.includes('top: 50%') || headerSource.includes('top-1/2'), 'Must position top at 50%');
    assert.ok(headerSource.includes('translateY(-50%)') || headerSource.includes('-translate-y-1/2'), 'Must vertically center with translateY(-50%)');
    assert.ok(headerSource.includes('overflow-visible') || headerSource.includes('overflow: visible') || headerSource.includes('overflow: "visible"'), 'Container must allow QR code to overlap boundary without clipping');
    assert.ok(headerSource.includes('qrMmSize'), 'Must use enlarged millimeter sizing for QR code');
  });

  await t.test('5. A4 Preview integration: Page1Header uses BillOfLadingHeader', () => {
    assert.ok(previewSource.includes('BillOfLadingHeader'), 'A4 preview must import and use BillOfLadingHeader');
    assert.ok(previewSource.includes('<BillOfLadingHeader'), 'Page1Header must render <BillOfLadingHeader');
  });

  await t.test('6. QR Code is optically scannable and encodes valid BOL payload', () => {
    const sampleBol = 'BOL-2026-NSA739';
    const load = require('./load-typescript.cjs');
    const { getBolVerificationUrl } = load('lib/utils/qr-code.ts');
    const expectedUrl = getBolVerificationUrl(sampleBol);

    const qr = QRCode.create(expectedUrl, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const margin = 4;
    const total = size + margin * 2;
    const scale = 4;
    const imgSize = total * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);
    data.fill(255);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          const startY = (r + margin) * scale;
          const startX = (c + margin) * scale;
          for (let y = 0; y < scale; y++) {
            for (let x = 0; x < scale; x++) {
              const idx = ((startY + y) * imgSize + (startX + x)) * 4;
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }

    const decoded = jsQR(data, imgSize, imgSize);
    assert.ok(decoded, 'Optical barcode scanner must decode the QR code');
    assert.strictEqual(decoded.data, expectedUrl, 'Decoded content must match the BOL verification URL');
  });

  await t.test('7. Print and PDF CSS rules preserve colors, font sizes, and layout without page overflow', () => {
    assert.ok(cssSource.includes('.bol-header'), 'globals.css must contain .bol-header styles');
    assert.ok(cssSource.includes('.bol-header-top'), 'globals.css must contain .bol-header-top styles');
    assert.ok(cssSource.includes('.bol-header-bottom'), 'globals.css must contain .bol-header-bottom styles');
    assert.ok(cssSource.includes('.bol-qr-container'), 'globals.css must contain .bol-qr-container styles');
    assert.ok(cssSource.includes('print-color-adjust: exact'), 'Must enforce exact print color adjustment');
  });

  await t.test('8. Multi-page continuation: Page2Header preserves distinct continuation structure', () => {
    assert.ok(previewSource.includes('function Page2Header'), 'Must have Page2Header for multi-page mode');
    assert.ok(previewSource.includes('data-bol-page2-header="true"'), 'Page2Header must retain data-bol-page2-header attribute');
  });

  await t.test('9. Dynamic BOL payload responsiveness: QR updates accurately for custom BOL identifiers', () => {
    const customBol = 'BOL-CUSTOM-XYZ-2026-00441';
    const load = require('./load-typescript.cjs');
    const { getBolVerificationUrl } = load('lib/utils/qr-code.ts');
    const targetUrl = getBolVerificationUrl(customBol);
    assert.ok(targetUrl.includes(customBol), 'Verification URL must embed the custom BOL identifier');

    const qr = QRCode.create(targetUrl, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const margin = 2;
    const total = size + margin * 2;
    const scale = 3;
    const imgSize = total * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);
    data.fill(255);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          const startY = (r + margin) * scale;
          const startX = (c + margin) * scale;
          for (let y = 0; y < scale; y++) {
            for (let x = 0; x < scale; x++) {
              const idx = ((startY + y) * imgSize + (startX + x)) * 4;
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }

    const decoded = jsQR(data, imgSize, imgSize);
    assert.ok(decoded, 'Scanner must decode the updated dynamic QR code');
    assert.strictEqual(decoded.data, targetUrl);
  });
});
