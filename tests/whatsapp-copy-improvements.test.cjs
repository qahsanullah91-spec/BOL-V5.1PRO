const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const load = require('./load-typescript.cjs')

const {
  buildWhatsAppBOLMessage,
  buildWhatsAppShipmentUpdate,
  buildWhatsAppBilingualMessage,
  buildWhatsAppQuickMessage,
  toAsciiDigits,
} = load('lib/utils/bol-whatsapp-formatter.ts')

test('WhatsApp Copy Message Engine Improvements & Robustness Suite', async (t) => {
  await t.test('1. toAsciiDigits converts Eastern Arabic and Persian digits to ASCII', () => {
    assert.equal(toAsciiDigits('۰۱۲۳۴۵۶۷۸۹'), '0123456789')
    assert.equal(toAsciiDigits('١٢٣٤٥٦٧٨٩٠'), '1234567890')
    assert.equal(toAsciiDigits('۱۴۷۶ کارتن'), '1476 کارتن')
    assert.equal(toAsciiDigits(''), '')
  })

  await t.test('2. Typo normalization and Persian commodity extraction from package field', () => {
    const bol = {
      bol_number: 'BOL-TYPO-01',
      cargo_description: '📦 CONTAINER & CARGO DETAILS │ 🧾 DOCUMENT & SHIPPING DETAILS\n🥬 Cargo:   │ 📄 Invoice NO: INV-088\nTotal: 1,420 Cartons\nTotal Weight: 22,720 KG\nInvoice Rate: USD 3.25/KG',
      number_of_packages: '1476 -CTNS کشمش سیاه',
      net_weight: '23,616',
      truck_number: '41389کندهار',
    }
    const update = buildWhatsAppShipmentUpdate(bol)
    // Commodity should be extracted from package string and mapped to bilingual
    assert.match(update, /BLACK RAISINS \/ کشمش سیاه/)
    assert.doesNotMatch(update, /Total: 1,420/)
    assert.doesNotMatch(update, /Invoice Rate/)
    assert.match(update, /41389 کندهار/)
  })

  await t.test('3. Extended Afghan commodities bilingual dictionary', () => {
    const testCases = [
      { desc: 'GARDAK RAISINS', expected: /GARDAK RAISINS \/ کشمش گردک/ },
      { desc: 'SHONDOKHANI RAISINS', expected: /SHONDOKHANI RAISINS \/ کشمش شندوخانی/ },
      { desc: 'ABJOSH RAISINS', expected: /ABJOSH RAISINS \/ کشمش آبجوش/ },
      { desc: 'MAMRA ALMONDS', expected: /MAMRA ALMONDS \/ بادام مامایی/ },
      { desc: 'ASAFOETIDA HING', expected: /ASAFOETIDA \(HING\) \/ انغوزه \(هنگ\)/ },
      { desc: 'FRESH CHERRIES', expected: /FRESH CHERRIES \/ گیلاس تازه/ },
      { desc: 'SHAKAR PARA APRICOTS', expected: /SHAKAR PARA APRICOTS \/ قیسی شکرپاره/ },
      { desc: 'SESAME SEEDS', expected: /SESAME SEEDS \/ کنجد/ },
    ]

    for (const { desc, expected } of testCases) {
      const msg = buildWhatsAppShipmentUpdate({
        bol_number: 'BOL-COMM-TEST',
        cargo_description: desc,
        number_of_packages: '500 CTNS',
      })
      assert.match(msg, expected, `Expected commodity ${desc} to match ${expected}`)
    }
  })

  await t.test('4. Driver and Container details included in Shipment Update when present', () => {
    const bol = {
      bol_number: 'BOL-DRIVER-TEST',
      truck_number: '26253 - کابل',
      driver_name: 'محمد گل',
      driver_contact: '+93 700 123 456',
      container_numbers: 'MSCU9876543',
      seal_numbers: 'SL-5544',
      cargo_description: 'DRIED FIGS 1500 CTNS',
      number_of_packages: '1,500 CTNS',
      net_weight: '15,000',
    }

    const update = buildWhatsAppShipmentUpdate(bol)
    assert.match(update, /👤 \*Driver \/ راننده:\* محمد گل \(\+93 700 123 456\)/)
    assert.match(update, /📦 \*Container \/ کانتینر:\* MSCU9876543 \(Seal: SL-5544\)/)

    const quick = buildWhatsAppQuickMessage(bol)
    assert.match(quick, /• \*Driver:\* محمد گل \(\+93 700 123 456\)/)

    const bilingual = buildWhatsAppBilingualMessage(bol)
    assert.match(bilingual, /👤 \*Driver \/ راننده:\* محمد گل \(\+93 700 123 456\)/)
  })

  await t.test('5. Direct invoice number fields recognized without regex fallback', () => {
    const bolWithDirectField = {
      bol_number: 'BOL-INV-01',
      invoice_no: 'INV-9999',
      cargo_description: 'ALMONDS',
      number_of_packages: '100 CTNS',
    }
    const update = buildWhatsAppShipmentUpdate(bolWithDirectField)
    assert.match(update, /🧾 \*Invoice No\. \/ شماره فاکتور:\* INV-9999/)
  })

  await t.test('6. Northern and Eastern border stations detection', () => {
    const aqinaBol = {
      bol_number: 'BOL-AQINA',
      cargo_route_note: 'از آقینه با کانتینر معمولی تا بندر ترکمنستان',
      number_of_packages: '500 CTNS',
      cargo_description: 'PINE NUTS',
    }
    const aqinaUpdate = buildWhatsAppShipmentUpdate(aqinaBol)
    assert.match(aqinaUpdate, /Aqina/)
    assert.match(aqinaUpdate, /آقینه/)

    const torkhamBol = {
      bol_number: 'BOL-TORKHAM',
      cargo_route_note: 'از تورخم به بندر کراچی',
      number_of_packages: '800 CTNS',
      cargo_description: 'APPLES',
    }
    const torkhamUpdate = buildWhatsAppShipmentUpdate(torkhamBol)
    assert.match(torkhamUpdate, /Torkham/)
    assert.match(torkhamUpdate, /تورخم/)
  })

  await t.test('7. CopyWhatsAppButton component integration in bol-editor.tsx and a4-preview-toolbar.tsx', () => {
    const editorSrc = fs.readFileSync(path.resolve('components/bill-of-lading/bol-editor.tsx'), 'utf8')
    assert.ok(editorSrc.includes('import { CopyWhatsAppButton } from "./copy-whatsapp-button"'))
    assert.ok(editorSrc.includes('<CopyWhatsAppButton'))

    const previewSrc = fs.readFileSync(path.resolve('components/bill-of-lading/a4-preview-toolbar.tsx'), 'utf8')
    assert.ok(previewSrc.includes('<CopyWhatsAppButton'))

    const buttonSrc = fs.readFileSync(path.resolve('components/bill-of-lading/copy-whatsapp-button.tsx'), 'utf8')
    assert.ok(buttonSrc.includes('handleOpenWhatsApp'))
    assert.ok(buttonSrc.includes('Open in WhatsApp Web / App'))
    assert.ok(buttonSrc.includes('buildWhatsAppDeepLink'))
    assert.ok(buttonSrc.includes('dark:border-emerald-800'))
    assert.ok(buttonSrc.includes('dark:bg-emerald-950'))
    assert.ok(buttonSrc.includes('h-8'))
  })
})
