const test = require('node:test');
const assert = require('node:assert/strict');
const QRCode = require('qrcode');
const jsQR = require('jsqr');

test('QR Code Generation & Decoding Verification Suite', async (t) => {
  const sampleBol = 'BOL-2026-NSA684';
  const expectedUrl = `https://skyarianabl.vercel.app/?bol=${encodeURIComponent(sampleBol)}&tab=preview`;

  await t.test('1. Standards-compliant ISO/IEC 18004 QR matrix can be generated', () => {
    const qr = QRCode.create(expectedUrl, { errorCorrectionLevel: 'M' });
    assert.ok(qr.modules, 'QR code must produce module matrix');
    assert.ok(qr.modules.size >= 21, 'QR code module grid size must be >= 21');
    assert.strictEqual(typeof qr.modules.get(0, 0), 'number', 'Matrix cells must be accessible');
  });

  await t.test('2. Decodes 100% accurately with standard optical barcode reader (jsQR)', () => {
    const qr = QRCode.create(expectedUrl, { errorCorrectionLevel: 'M' });
    const size = qr.modules.size;
    const margin = 4;
    const total = size + margin * 2;
    const scale = 4;
    const imgSize = total * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);
    data.fill(255); // White background

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
    assert.ok(decoded, 'Barcode scanner must successfully locate and decode the QR code');
    assert.strictEqual(decoded.data, expectedUrl, 'Decoded content must match the exact verification URL');
  });

  await t.test('3. Handles various BOL formats and edge cases', () => {
    const edgeCases = [
      'NSA-84',
      'BOL-2026-NSA685',
      'https://skyarianabl.vercel.app/verify/123',
    ];

    for (const testCase of edgeCases) {
      const qr = QRCode.create(testCase, { errorCorrectionLevel: 'M' });
      assert.ok(qr.modules.size >= 21);
    }
  });
});
