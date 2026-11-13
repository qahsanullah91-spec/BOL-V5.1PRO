const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const highResHelper = fs.readFileSync(path.join(root, 'lib', 'utils', 'pdf-high-res-capture.ts'), 'utf8');
const shippingDocs = fs.readFileSync(path.join(root, 'lib', 'utils', 'shipping-documents.ts'), 'utf8');
const pdfUpload = fs.readFileSync(path.join(root, 'lib', 'utils', 'pdf-upload.ts'), 'utf8');
const pdfGen = fs.readFileSync(path.join(root, 'lib', 'utils', 'pdf-generator.ts'), 'utf8');
const savedReport = fs.readFileSync(path.join(root, 'components', 'reports', 'saved-bol-report.tsx'), 'utf8');
const printModal = fs.readFileSync(path.join(root, 'components', 'reports', 'report-print-preview-modal.tsx'), 'utf8');
const reportsView = fs.readFileSync(path.join(root, 'components', 'reports-view.tsx'), 'utf8');
const bolEditor = fs.readFileSync(path.join(root, 'components', 'bill-of-lading', 'bol-editor.tsx'), 'utf8');

test('Shared high-res PDF capture helper prevents GPU VRAM rainbow corruption and embeds vector fonts', () => {
  assert.ok(highResHelper.includes('Vazirmatn'), 'Must embed Vazirmatn @font-face alias for bilingual PDF typography');
  assert.ok(highResHelper.includes('NotoNaskhArabic'), 'Must embed NotoNaskhArabic @font-face');
  assert.ok(highResHelper.includes('NotoSans'), 'Must embed NotoSans @font-face');
  assert.ok(
    highResHelper.includes('const rawDataUrl = await urlToDataUrl(img.src)'),
    'inlineElementImagesPreservingVector must fetch raw SVG/image assets before falling back to 1x canvas',
  );
  assert.ok(
    highResHelper.includes('willReadFrequently: true, alpha: false'),
    'drawImageHighQualityToCanvas must force CPU software canvas backing to prevent DirectX/ANGLE GPU rainbow tile corruption',
  );
  assert.ok(
    highResHelper.includes('ctx.imageSmoothingQuality = "high"'),
    'drawImageHighQualityToCanvas must enable high-precision smoothing',
  );
  assert.ok(
    highResHelper.includes('maxCanvasEdge = 4096'),
    'computeClampedCanvasDimensions must clamp within 4096px GPU tile safety limit',
  );
  assert.ok(
    highResHelper.includes('captureElectronVectorPdf') && highResHelper.includes('mergePdfBlobs'),
    'Helper must expose Electron native vector printToPDF capture and pdf-lib merger',
  );
});

test('BOL & Shipping Document PDF engines prefer Electron vector printToPDF and clamp CPU raster <= 4096px', () => {
  assert.ok(shippingDocs.includes('captureElectronVectorPdf'), 'shipping-documents must use native Electron vector printToPDF when enabled');
  assert.ok(shippingDocs.includes('mergePdfBlobs'), 'shipping-documents must merge vector BOL with packing list/stickers cleanly');
  assert.ok(shippingDocs.includes('4096'), 'drawBolPage must clamp canvas <= 4096px to prevent GPU corruption');
  assert.ok(shippingDocs.includes('undefined, "MEDIUM"'), 'drawBolPage must use MEDIUM lossless PNG compression');

  assert.ok(pdfUpload.includes('captureElectronVectorPdf'), 'pdf-upload must support Electron native vector printToPDF');
  assert.ok(pdfUpload.includes('4096'), 'generatePDFBlob must clamp canvas <= 4096px to prevent GPU corruption');
  assert.ok(pdfUpload.includes('undefined, "MEDIUM"'), 'generatePDFBlob must use MEDIUM lossless PNG compression');
  assert.ok(pdfUpload.includes('scale: 4'), 'html2canvas fallback must use safe 4x scale');
  assert.ok(pdfUpload.includes('precision: 16'), 'generatePDFBlob jsPDF must set precision: 16');

  assert.ok(bolEditor.includes('useElectronVectorPdf: true'), 'bol-editor must enable Electron vector PDF export');
});

test('Report & Preview PDF exports eliminate lossy JPEG compression and enforce CPU-safe canvas backing', () => {
  assert.ok(savedReport.includes('captureElectronVectorPdf("reports"'), 'saved-bol-report must use native Electron vector PDF for reports');
  assert.ok(savedReport.includes('drawImageHighQualityToCanvas'), 'saved-bol-report fallback must use CPU-backed drawImageHighQualityToCanvas');
  assert.ok(!savedReport.includes('canvas.toDataURL("image/jpeg"'), 'saved-bol-report must not downgrade report text with lossy JPEG');
  assert.ok(savedReport.includes('canvas.toDataURL("image/png")'), 'saved-bol-report must export lossless PNG');

  assert.ok(printModal.includes('willReadFrequently: true, alpha: false'), 'report-print-preview-modal must use CPU-backed canvas');
  assert.ok(!printModal.includes('canvas.toDataURL("image/jpeg"'), 'report-print-preview-modal must not use lossy JPEG');
  assert.ok(printModal.includes('canvas.toDataURL("image/png")'), 'report-print-preview-modal must export lossless PNG');

  assert.ok(!reportsView.includes("toDataURL('image/jpeg'"), 'reports-view must not use lossy JPEG');
  assert.ok(reportsView.includes("toDataURL('image/png')"), 'reports-view must export lossless PNG');
  assert.ok(reportsView.includes('renderReportsContainerToPdf'), 'reports-view must share renderReportsContainerToPdf helper');

  assert.ok(pdfGen.includes('type: "png"'), 'pdf-generator must use lossless png');
  assert.ok(pdfGen.includes('scale: 4'), 'pdf-generator must use safe scale: 4');
});

test('PDF engines sanitize modern CSS colors (oklch) and patch-html2canvas guards are active', () => {
  assert.ok(highResHelper.includes('convertCssColorToRgb'), 'pdf-high-res-capture must export convertCssColorToRgb');
  assert.ok(highResHelper.includes('sanitizeElementForPDF'), 'pdf-high-res-capture must export sanitizeElementForPDF');
  assert.ok(highResHelper.includes('hasUnsupportedColor'), 'pdf-high-res-capture must detect unsupported CSS color functions');
  assert.ok(shippingDocs.includes('oklch'), 'shipping-documents onclone must sanitize oklch from cloned style tags');
  assert.ok(pdfUpload.includes('oklch'), 'pdf-upload onclone must sanitize oklch from cloned style tags');

  const patchScript = fs.readFileSync(path.join(root, 'scripts', 'patch-html2canvas.cjs'), 'utf8');
  assert.ok(patchScript.includes('unsupported color function'), 'patch script must target unsupported color function error');
  assert.ok(fs.existsSync(path.join(root, 'scripts', 'patch-html2canvas.cjs')), 'patch-html2canvas.cjs must exist');
});
