const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("PDF Export & QR Code Quality Suite", async (t) => {
  const qrCodePath = path.resolve("lib/utils/qr-code.ts");
  const qrCodeContent = fs.readFileSync(qrCodePath, "utf8");

  const docQrCodePath = path.resolve("components/bill-of-lading/document-qr-code.tsx");
  const docQrCodeContent = fs.readFileSync(docQrCodePath, "utf8");

  const shippingDocsPath = path.resolve("lib/utils/shipping-documents.ts");
  const shippingDocsContent = fs.readFileSync(shippingDocsPath, "utf8");

  const pdfUploadPath = path.resolve("lib/utils/pdf-upload.ts");
  const pdfUploadContent = fs.readFileSync(pdfUploadPath, "utf8");

  const bolEditorPath = path.resolve("components/bill-of-lading/bol-editor.tsx");
  const bolEditorContent = fs.readFileSync(bolEditorPath, "utf8");

  await t.test("1. DocumentQRCode uses accessible div role='button' for page triggers to prevent being stripped by PDF filters", () => {
    // Ensure the main page renders for DocumentQRCode don't wrap the QR in <button data-qr-code
    assert.ok(
      !docQrCodeContent.includes('<button\n          type="button"\n          onClick={() => setShowModal(true)}') &&
      !docQrCodeContent.includes('<button\r\n          type="button"\r\n          onClick={() => setShowModal(true)}'),
      "DocumentQRCode page triggers should not use <button> tags to avoid being stripped by PDF rasterization filters"
    );
    assert.ok(
      docQrCodeContent.includes('role="button"'),
      "DocumentQRCode interactive modes must have role='button' for accessibility"
    );
    assert.ok(
      docQrCodeContent.includes('data-qr-code="true"'),
      "DocumentQRCode must retain data-qr-code attribute"
    );
  });

  await t.test("2. DocumentQRCode SVG includes standard XML namespace xmlns attribute", () => {
    assert.ok(
      docQrCodeContent.includes('xmlns="http://www.w3.org/2000/svg"'),
      "qrSvg must include xmlns namespace for valid SVG serialization in html-to-image"
    );
  });

  await t.test("3. generateQrMatrix includes resilient fallback ensuring path is never empty", () => {
    assert.ok(
      qrCodeContent.includes("getBolVerificationUrl") && qrCodeContent.includes("qrFallback"),
      "generateQrMatrix must catch oversized payload errors and generate fallback QR code"
    );
  });

  await t.test("4. shipping-documents.ts drawBolPage enforces 336+ DPI (3.5x pixelRatio) and preserves data-qr-code", () => {
    assert.ok(
      shippingDocsContent.includes("pixelRatio: 3.5"),
      "drawBolPage must use pixelRatio: 3.5 for ultra-sharp print quality"
    );
    assert.ok(
      shippingDocsContent.includes('textRendering: "geometricPrecision"'),
      "drawBolPage must use geometricPrecision for pristine typography"
    );
    assert.ok(
      shippingDocsContent.includes('node.getAttribute?.("data-qr-code") === "true"') ||
      shippingDocsContent.includes('node.closest?.("[data-qr-code]")'),
      "drawBolPage filter must explicitly retain QR code elements"
    );
    assert.ok(
      shippingDocsContent.includes('"image/jpeg", 0.99'),
      "drawBolPage must use maximum quality 0.99 for clean, artifact-free output"
    );
  });

  await t.test("5. pdf-upload.ts generatePDFBlob enforces 336+ DPI and protects QR code elements", () => {
    assert.ok(
      pdfUploadContent.includes("pixelRatio: 3.5"),
      "pdf-upload must use pixelRatio: 3.5"
    );
    assert.ok(
      pdfUploadContent.includes('node.getAttribute?.("data-qr-code") === "true"') ||
      pdfUploadContent.includes('node.closest?.("[data-qr-code]")'),
      "pdf-upload filter must explicitly retain QR code elements"
    );
    assert.ok(
      pdfUploadContent.includes('"image/jpeg", 0.99'),
      "pdf-upload must use 0.99 JPEG quality"
    );
    assert.ok(
      pdfUploadContent.includes("button:not([data-qr-code])"),
      "pdf-upload fallback CSS must not hide data-qr-code buttons"
    );
  });

  await t.test("6. bol-editor.tsx mounts dedicated PDF export container and activates isExportingPDF", () => {
    assert.ok(
      bolEditorContent.includes("(isExportingPDF || isShippingExporting)"),
      "Dedicated PDF export container must mount during shipping document exports"
    );
    assert.ok(
      bolEditorContent.includes("setIsExportingPDF(true)") && bolEditorContent.includes("setIsShippingExporting(true)"),
      "handleShippingDocumentsDownload must enable both isShippingExporting and isExportingPDF"
    );
  });
});
