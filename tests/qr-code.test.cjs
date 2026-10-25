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

  await t.test('4. Encodes and decodes full BOL WhatsApp text message optically', () => {
    const load = require('./load-typescript.cjs');
    const { generateQrMatrix } = load('lib/utils/qr-code.ts');
    const { buildWhatsAppBOLMessage } = load('lib/utils/bol-whatsapp-formatter.ts');

    const sampleBol = {
      bol_number: 'BOL-2026-NSA684',
      issue_date: '2026-10-24',
      truck_number: '41389 کابل',
      driver_name: 'احمد ولی',
      driver_contact: '+93 700 123 456',
      driver_rent: '48,000 AFN',
      shipper_name: 'RAHMAT NAZAR LTD',
      consignee_name: 'AL MADINA TRADING CO LLC',
      cargo_description: 'Fresh Afghan Dried Fruits & Green Raisins',
      number_of_packages: '1,400 CTNS',
      net_weight: '23,100 KG',
      container_numbers: 'MSCU1234567',
      routes: [{ stopOrder: 1, location: 'Kandahar' }, { stopOrder: 2, location: 'Bandar Abbas' }],
    };

    const whatsAppMessage = buildWhatsAppBOLMessage(sampleBol);
    assert.ok(whatsAppMessage.includes('BOL-2026-NSA684'));
    assert.ok(whatsAppMessage.includes('RAHMAT NAZAR LTD'));

    const qrResult = generateQrMatrix(whatsAppMessage);
    assert.ok(qrResult.svgString.includes('<svg'));
    assert.strictEqual(qrResult.payloadText, whatsAppMessage);
    assert.ok(qrResult.whatsappUrl.includes('https://api.whatsapp.com/send?text='));

    // Verify optical decode of the matrix
    const size = qrResult.moduleCount;
    const margin = qrResult.margin;
    const total = qrResult.size;
    const scale = 4;
    const imgSize = total * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);
    data.fill(255);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qrResult.modules[r][c]) {
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
    assert.ok(decoded, 'Barcode scanner must locate and decode the full WhatsApp message QR code');
    assert.strictEqual(decoded.data, whatsAppMessage, 'Decoded content must be the exact WhatsApp text message');
  });
});
