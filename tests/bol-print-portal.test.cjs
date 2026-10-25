const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('BOL Print Architecture & Non-Blank Guarantee Suite', async (t) => {
  const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
  const printSafePath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'print-safe-bol.tsx');
  const appCssPath = path.join(__dirname, '..', 'app', 'globals.css');

  assert.ok(fs.existsSync(editorPath), 'bol-editor.tsx must exist');
  assert.ok(fs.existsSync(printSafePath), 'print-safe-bol.tsx must exist');
  assert.ok(fs.existsSync(appCssPath), 'app/globals.css must exist');

  const editorCode = fs.readFileSync(editorPath, 'utf8');
  const printSafeCode = fs.readFileSync(printSafePath, 'utf8');
  const appCss = fs.readFileSync(appCssPath, 'utf8');

  await t.test('1. PrintPreviewPortal mounts immediately without blocking on isPrinting', () => {
    // Locate PrintPreviewPortal function block
    const portalStartIdx = editorCode.indexOf('function PrintPreviewPortal');
    assert.ok(portalStartIdx !== -1, 'PrintPreviewPortal function must exist in bol-editor.tsx');
    const portalEndIdx = editorCode.indexOf('const SAVED_SHIPPERS_STORAGE_KEY');
    const portalBody = editorCode.substring(portalStartIdx, portalEndIdx);

    assert.ok(!portalBody.includes('isPrinting'), 'PrintPreviewPortal must NOT gate portal rendering on isPrinting');
    assert.ok(portalBody.includes('bol-print-preview-root'), 'Must target bol-print-preview-root');
    assert.ok(portalBody.includes('createPortal(children, container)'), 'Must portal children into container');
    assert.ok(portalBody.includes('bol-print-root'), 'Must assign bol-print-root class');
  });

  await t.test('2. PrintSafeBOL is imported statically with zero dynamic chunk latency', () => {
    assert.match(editorCode, /import\s+PrintSafeBOL\s+from\s+["']\.\/print-safe-bol["']/,
      'PrintSafeBOL must be statically imported to eliminate dynamic chunk loading delays during print');
    assert.ok(!editorCode.includes('const PrintSafeBOL = dynamic('),
      'PrintSafeBOL must not use dynamic import');
  });

  await t.test('3. print-safe-bol.tsx does not constrain or hide multi-page content with max-h or overflow-hidden', () => {
    assert.ok(!printSafeCode.includes('print:max-h-[297mm]'),
      'print-safe-bol must not restrict maximum height to prevent clipping multi-page BOLs');
    assert.ok(!printSafeCode.includes('print:overflow-hidden'),
      'print-safe-bol must not clip overflow in print mode');
    assert.ok(printSafeCode.includes('print:overflow-visible'),
      'print-safe-bol must ensure overflow is visible in print mode');
  });

  await t.test('4. Dedicated #bol-print-preview element exists and embeds A4Preview', () => {
    assert.ok(editorCode.includes('id="bol-print-preview"'), 'bol-print-preview element must exist');
    assert.ok(editorCode.includes('data-print-root="true"'), 'data-print-root="true" must be set on print container');
    assert.ok(editorCode.includes('<PrintSafeBOL>'), 'Must wrap print preview in PrintSafeBOL');
  });

  await t.test('5. app/globals.css properly isolates print root on screen and reveals it during print', () => {
    // Screen mode: must be hidden
    assert.match(appCss, /#bol-print-preview-root\s*\{[^}]*display:\s*none\s*!important/,
      '#bol-print-preview-root must be display: none on screen');

    // Print mode: must be visible
    assert.match(appCss, /#bol-print-preview-root\s*\{[^}]*display:\s*block\s*!important/,
      '#bol-print-preview-root must be display: block in @media print');
    assert.match(appCss, /#bol-print-preview\s*,\s*\.bol-a4-document\s*\{[^}]*display:\s*block\s*!important/,
      '#bol-print-preview and .bol-a4-document must be display: block in @media print');
  });

  await t.test('6. beforeprint and afterprint event listeners manage active print dataset', () => {
    assert.ok(editorCode.includes('window.addEventListener("beforeprint", handleBeforePrint)'),
      'beforeprint listener must be registered');
    assert.ok(editorCode.includes('data-print-active'),
      'data-print-active attribute must be manipulated for BOL printing');
  });
});
