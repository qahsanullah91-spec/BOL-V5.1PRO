const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('BOL Print-to-A4-Preview 1:1 Parity Suite', async (t) => {
  const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
  const previewPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx');
  const appCssPath = path.join(__dirname, '..', 'app', 'globals.css');

  assert.ok(fs.existsSync(editorPath), 'bol-editor.tsx must exist');
  assert.ok(fs.existsSync(previewPath), 'a4-preview.tsx must exist');
  assert.ok(fs.existsSync(appCssPath), 'app/globals.css must exist');

  const editorCode = fs.readFileSync(editorPath, 'utf8');
  const previewCode = fs.readFileSync(previewPath, 'utf8');
  const appCss = fs.readFileSync(appCssPath, 'utf8');

  await t.test('1. PrintPreviewPortal renders A4Preview in full-fidelity mode without pdfExport or exportTarget', () => {
    const portalIdx = editorCode.indexOf('<PrintPreviewPortal>');
    assert.ok(portalIdx !== -1, 'PrintPreviewPortal must be present in bol-editor.tsx');
    const portalCloseIdx = editorCode.indexOf('</PrintPreviewPortal>', portalIdx);
    const portalBlock = editorCode.substring(portalIdx, portalCloseIdx);

    assert.ok(
      !portalBlock.includes('pdfExport'),
      'PrintPreviewPortal must NOT pass pdfExport so print renders with identical styles to screen preview'
    );
    assert.ok(
      !portalBlock.includes('exportTarget'),
      'PrintPreviewPortal must NOT pass exportTarget'
    );
  });

  await t.test('2. BackgroundWatermark renders an explicit <img> tag inside data-bol-watermark for print engine guarantee', () => {
    assert.ok(
      previewCode.includes('data-bol-watermark="true"'),
      'data-bol-watermark="true" attribute must exist in a4-preview.tsx'
    );
    assert.match(
      previewCode,
      /<div[^>]*data-bol-watermark="true"[^>]*>[\s\S]*?<img[\s\S]*?src=\{backgroundImageUrl\}[\s\S]*?<\/div>/,
      'BackgroundWatermark must include an <img> tag to guarantee rendering in physical print dialogs'
    );
  });

  await t.test('3. app/globals.css does not force yellowish overrides or shrunken fonts in print mode', () => {
    assert.ok(
      !appCss.includes('#fffdf5'),
      'globals.css must not use yellowish #fffdf5 card backgrounds in print'
    );
    assert.ok(
      !appCss.includes('#fde68a'),
      'globals.css must not use yellow #fde68a card borders in print'
    );
    assert.ok(
      !appCss.includes('#fffbeb'),
      'globals.css must not use yellow #fffbeb shipment card backgrounds in print'
    );
  });

  await t.test('4. app/globals.css does not wash out the watermark with 98% opaque white sections in print', () => {
    assert.ok(
      !appCss.includes('background-color: rgba(255, 255, 255, 0.98) !important;'),
      'globals.css must not override print section backgrounds with 98% opaque white'
    );
    assert.match(
      appCss,
      /\[data-bol-watermark="true"\],\s*\[data-bol-watermark="true"\]\s+img\s*\{[^}]*display:\s*block\s*!important;/,
      'globals.css must guarantee [data-bol-watermark="true"] img is display: block in print'
    );
  });

  await t.test('5. party-card-glass preserves translucent white background and backdrop-filter blur', () => {
    assert.match(
      appCss,
      /\.party-card-glass\s*\{[\s\S]*?border-color:\s*#93c5fd;[\s\S]*?backdrop-filter:\s*blur/,
      'party-card-glass must preserve translucent border and blur'
    );
    assert.match(
      appCss,
      /\[data-bol-a4="true"\]\s+\.party-card-glass[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.92\)\s*!important;/,
      '[data-bol-a4="true"] .party-card-glass must have translucent background'
    );
  });

  await t.test('6. app/globals.css ensures QR code and data-qr-code containers remain visible and displayed in print', () => {
    assert.match(
      appCss,
      /\[data-qr-code="true"\][\s\S]*?display:\s*flex\s*!important;/,
      'globals.css must ensure [data-qr-code="true"] is display: flex in print'
    );
    assert.ok(
      appCss.includes('[role="button"]:not([data-qr-code="true"])'),
      'globals.css must not blanket hide [role="button"] without excluding data-qr-code'
    );
  });
});
