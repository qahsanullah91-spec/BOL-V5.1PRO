const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const jsQR = require("jsqr");
const QRCode = require("qrcode");

test("QR Code WhatsApp Shipment Update Message Suite", async (t) => {
  const docQrCodePath = path.resolve("components/bill-of-lading/document-qr-code.tsx");
  const docQrCodeContent = fs.readFileSync(docQrCodePath, "utf8");

  const a4PreviewPath = path.resolve("components/bill-of-lading/a4-preview.tsx");
  const a4PreviewContent = fs.readFileSync(a4PreviewPath, "utf8");

  const load = require("./load-typescript.cjs");
  const { buildWhatsAppShipmentUpdate, buildWhatsAppBOLMessage } = load("lib/utils/bol-whatsapp-formatter.ts");
  const { generateQrMatrix } = load("lib/utils/qr-code.ts");

  await t.test("1. DocumentQRCode imports and prioritizes buildWhatsAppShipmentUpdate", () => {
    assert.ok(
      docQrCodeContent.includes("buildWhatsAppShipmentUpdate"),
      "DocumentQRCode must import buildWhatsAppShipmentUpdate from bol-whatsapp-formatter"
    );
    assert.ok(
      docQrCodeContent.includes("shipmentUpdateMsg"),
      "DocumentQRCode must compute shipmentUpdateMsg"
    );
    assert.ok(
      docQrCodeContent.includes('messageType = "update"'),
      "DocumentQRCode must default messageType to 'update'"
    );
  });

  await t.test("2. DocumentQRCode modal provides toggle between Shipment Update and Full BOL message", () => {
    assert.ok(
      docQrCodeContent.includes("Shipment Update (اطلاعیه حمل بار)"),
      "Modal must provide Shipment Update toggle option in Persian/English"
    );
    assert.ok(
      docQrCodeContent.includes("Full BOL Message (متن کامل بارنامه)"),
      "Modal must provide Full BOL toggle option in Persian/English"
    );
    assert.ok(
      docQrCodeContent.includes("https://api.whatsapp.com/send?text="),
      "Modal must support direct WhatsApp deep linking"
    );
  });

  await t.test("3. a4-preview.tsx Page1Header and Page2Header pass live formData to QR components", () => {
    assert.ok(
      a4PreviewContent.includes("formData?: BillOfLadingFormData") &&
      a4PreviewContent.includes("formData={formData}"),
      "Page1Header and Page2Header must accept and forward formData to BillOfLadingHeader and DocumentQRCode"
    );
  });

  await t.test("4. Shipment Update QR code is optically scannable and decodes 100% accurately", () => {
    const sampleBol = {
      bol_number: "BOL-2026-NSA739",
      truck_number: "48921-AFG",
      shipper_name: "RAHMAT NAZAR LTD",
      consignee_name: "LEELA GOPAL INTERNATIONAL",
      cargo_description: "FRESH APPLES",
      number_of_packages: "1200",
      package_type: "Cartons",
      net_weight: "24000",
    };

    const updateMsg = buildWhatsAppShipmentUpdate(sampleBol);
    assert.ok(updateMsg.includes("BOL-2026-NSA739"), "Must include BOL number");
    assert.ok(updateMsg.includes("RAHMAT NAZAR LTD"), "Must include Shipper name");
    assert.ok(updateMsg.includes("LEELA GOPAL INTERNATIONAL"), "Must include Consignee name");
    assert.ok(updateMsg.includes("SHIPMENT UPDATE"), "Must include SHIPMENT UPDATE header");

    const qrResult = generateQrMatrix(updateMsg, { rawTextMode: true, errorCorrectionLevel: "L" });
    assert.ok(qrResult.svgString.includes("<svg"), "Must produce valid SVG");
    assert.strictEqual(qrResult.payloadText, updateMsg);

    // Rasterize and test with jsQR optical scanner
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
    assert.ok(decoded, "Optical scanner must decode the shipment update QR code");
    assert.strictEqual(decoded.data, updateMsg, "Decoded text must match exact WhatsApp shipment update message");
  });
});
