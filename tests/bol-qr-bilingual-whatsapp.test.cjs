const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const jsQR = require('jsqr');

test('BOL QR Code Bilingual WhatsApp Message Suite', async (t) => {
  const qrComponentPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'document-qr-code.tsx');
  const qrSource = fs.readFileSync(qrComponentPath, 'utf8').replace(/\r\n/g, '\n');

  await t.test('1. DocumentQRCode imports buildWhatsAppBilingualMessage', () => {
    assert.ok(
      qrSource.includes('buildWhatsAppBilingualMessage'),
      'document-qr-code.tsx must import buildWhatsAppBilingualMessage'
    );
  });

  await t.test('2. Default messageType is set to "bilingual"', () => {
    assert.ok(
      qrSource.includes('messageType = "bilingual"'),
      'DocumentQRCode default messageType must be "bilingual"'
    );
    assert.ok(
      qrSource.includes('bilingualMsg'),
      'DocumentQRCode must calculate bilingualMsg'
    );
  });

  await t.test('3. Resolved payload prioritizes bilingual message as default', () => {
    assert.ok(
      qrSource.includes('selectedMode === "bilingual"') && qrSource.includes('if (bilingualMsg) return bilingualMsg'),
      'resolvedPayload must return bilingualMsg when in bilingual mode'
    );
  });

  await t.test('4. Modal contains Bilingual tab as first active option', () => {
    assert.ok(
      qrSource.includes('Bilingual (دوزبانه)'),
      'Modal must have Bilingual toggle option'
    );
  });

  await t.test('5. Generates scannable QR code matching exact bilingual message format', () => {
    const load = require('./load-typescript.cjs');
    const { generateQrMatrix } = load('lib/utils/qr-code.ts');
    const { buildWhatsAppBilingualMessage } = load('lib/utils/bol-whatsapp-formatter.ts');

    const sampleBol = {
      bol_number: 'BOL-2026-NSA755',
      truck_number: '35633 هرات',
      driver_name: 'سیدحامد',
      driver_contact: '+93 795623231',
      cargo_description: 'Description: BLACK RAISINS 1375 CTNS 16.0-KGS; INV-036',
      number_of_packages: '1,375 CTNS',
      net_weight: '22,000 KG',
      cargo_route_note: 'مسیر حمل کانتینر: از دوغارون به بندر مرسین؛ سپس به مقصد نهایی هند (بندر نهاوا شیوا).',
      routes: [
        { stopOrder: 1, location: 'Islam Qala' },
        { stopOrder: 2, location: 'Dougharoun' },
        { stopOrder: 3, location: 'Mersin Port' },
        { stopOrder: 4, location: 'Nhava Sheva' },
      ],
    };

    const bilingualMsg = buildWhatsAppBilingualMessage(sampleBol);

    // Verify key fields matching the user screenshot
    assert.ok(bilingualMsg.includes('🚢 *SKY ARIANA LIMITED*'));
    assert.ok(bilingualMsg.includes('📋 *اطلاعیه باربری / SHIPMENT UPDATE*'));
    assert.ok(bilingualMsg.includes('📄 *BOL / نمبر بارنامه:* BOL-2026-NSA755'));
    assert.ok(bilingualMsg.includes('سیدحامد'));
    assert.ok(bilingualMsg.includes('1,375 CTNS'));
    assert.ok(bilingualMsg.includes('22,000 KG'));
    assert.ok(bilingualMsg.includes('Islam Qala ➔ Dougharoun ➔ Mersin Port ➔ Nhava Sheva'));
    assert.ok(bilingualMsg.includes('مسیر حمل کانتینر'));

    // Verify QR matrix generation
    const qrResult = generateQrMatrix(bilingualMsg);
    assert.ok(qrResult.modules && qrResult.modules.length > 0, 'Must produce matrix modules');
    assert.ok(qrResult.svgString.includes('<svg'), 'Must produce valid SVG QR');
    assert.strictEqual(qrResult.payloadText, bilingualMsg);

    // Verify optical decode on bilingual message
    const opticalSample = {
      bol_number: 'BOL-2026-NSA755',
      truck_number: '35633 هرات',
      cargo_description: 'BLACK RAISINS 1375 CTNS',
      routes: [
        { stopOrder: 1, location: 'Islam Qala' },
        { stopOrder: 2, location: 'Mersin Port' },
      ],
    };
    const opticalMsg = buildWhatsAppBilingualMessage(opticalSample);
    const opticalQr = generateQrMatrix(opticalMsg);
    const size = opticalQr.moduleCount;
    const margin = opticalQr.margin;
    const scale = 4;
    const imgSize = opticalQr.size * scale;
    const data = new Uint8ClampedArray(imgSize * imgSize * 4);
    data.fill(255);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (opticalQr.modules[r][c]) {
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
    assert.ok(decoded, 'jsQR scanner must successfully decode QR');
    assert.strictEqual(decoded.data, opticalMsg, 'Decoded QR text must match the exact bilingual message');
  });
});
