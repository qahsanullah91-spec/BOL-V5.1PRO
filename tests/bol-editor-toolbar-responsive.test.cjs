const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('BOL Editor Toolbar Responsive Architecture & Control Completeness', async (t) => {
  const toolbarPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview-toolbar.tsx');
  const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
  const copyWhatsAppPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'copy-whatsapp-button.tsx');

  assert.ok(fs.existsSync(toolbarPath), 'a4-preview-toolbar.tsx exists');
  assert.ok(fs.existsSync(globalsCssPath), 'globals.css exists');
  assert.ok(fs.existsSync(copyWhatsAppPath), 'copy-whatsapp-button.tsx exists');

  const toolbarSrc = fs.readFileSync(toolbarPath, 'utf8');
  const cssSrc = fs.readFileSync(globalsCssPath, 'utf8');
  const whatsappSrc = fs.readFileSync(copyWhatsAppPath, 'utf8');

  await t.test('1. Structure & Accessibility attributes', () => {
    assert.match(toolbarSrc, /role="toolbar"/, 'Toolbar has role="toolbar"');
    assert.match(toolbarSrc, /aria-label="A4 Preview Controls"/, 'Toolbar has aria-label');
    assert.match(toolbarSrc, /data-fit-page="true"/, 'Fit Page button has data-fit-page="true"');
    assert.match(toolbarSrc, /data-fit-width="true"/, 'Fit Width button has data-fit-width="true"');
    assert.match(toolbarSrc, /print:hidden/, 'Toolbar is hidden in print media');
    assert.match(toolbarSrc, /sticky top-0 z-30/, 'Toolbar has sticky top-0 z-30 positioning');
  });

  await t.test('2. Group A — Document Identity controls present and visible', () => {
    // Back to BOL Editor
    assert.match(toolbarSrc, /onBackToEditor/, 'Back to BOL Editor handler attached');
    assert.match(toolbarSrc, /ArrowLeft/, 'Back button icon is present');
    assert.match(toolbarSrc, /BOL Editor/, 'Back button text is present');

    // BOL Document Number badge
    assert.match(toolbarSrc, /{bolNumber}/, 'BOL number badge renders dynamic bolNumber');

    // Autosaved status & last-save time
    assert.match(toolbarSrc, /autoSaveStatus === "saved"/, 'Autosaved status check present');
    assert.match(toolbarSrc, /lastAutoSaveTime \|\| lastAutoSavedTime/, 'Last auto-save time is rendered');
    assert.doesNotMatch(toolbarSrc, /hidden lg:flex items-center shrink-0/, 'Autosaved indicator is not hidden on screens below lg');

    // Online/offline status badge
    assert.match(toolbarSrc, /<OnlineSyncStatusBadge/, 'Online sync status badge is rendered');
  });

  await t.test('3. Group B — Save and Update prominent button', () => {
    assert.match(toolbarSrc, /onClick=\{onSave\}/, 'Update button calls onSave');
    assert.match(toolbarSrc, /\{isEditMode \? "Update" : "Save"\}/, 'Renders dynamic Update / Save label');
    assert.match(toolbarSrc, /bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700/, 'Prominent primary action styling applied');
  });

  await t.test('4. Group C — Preview Navigation controls', () => {
    assert.match(toolbarSrc, /Fit Page/, 'Fit Page button label present');
    assert.match(toolbarSrc, /Fit Width/, 'Fit Width button label present');
    assert.match(toolbarSrc, /ZoomOut/, 'ZoomOut button present');
    assert.match(toolbarSrc, /\{Math\.round\(previewScale \* 100\)\}%/, 'Zoom percentage rendered and centered');
    assert.match(toolbarSrc, /ZoomIn/, 'ZoomIn button present');
  });

  await t.test('5. Group D — Document Appearance controls (Watermark & Stamp)', () => {
    assert.match(toolbarSrc, /Watermark/, 'Watermark label present');
    assert.match(toolbarSrc, /Palette/, 'Watermark palette icon present');
    assert.match(toolbarSrc, /\{bgImageUrl \?/, 'Watermark percentage or off badge rendered');
    assert.match(toolbarSrc, /onToggleStampSignature/, 'Stamp toggle handler attached');
    assert.match(toolbarSrc, /updateStampScale\(stampScale - 0\.1\)/, 'Stamp decrease button present');
    assert.match(toolbarSrc, /\{Math\.round\(stampScale \* 100\)\}%/, 'Stamp size percentage present');
    assert.match(toolbarSrc, /updateStampScale\(stampScale \+ 0\.1\)/, 'Stamp increase button present');
  });

  await t.test('6. Group E — Export & Sharing controls', () => {
    // Copy WhatsApp
    assert.match(toolbarSrc, /<CopyWhatsAppButton/, 'Copy WhatsApp button is rendered in toolbar');
    assert.doesNotMatch(toolbarSrc, /hidden 2xl:block[^>]*>\s*<CopyWhatsAppButton/, 'WhatsApp button is NOT hidden on viewports below 2xl');

    // Complete PDF split button
    assert.match(toolbarSrc, /onDownloadPdf\("all"\)/, 'Complete PDF button downloads all documents');
    assert.match(toolbarSrc, /onDownloadPdf\("bol"\)/, 'PDF dropdown has BOL only');
    assert.match(toolbarSrc, /onDownloadPdf\("packing-list"\)/, 'PDF dropdown has Packing List only');
    assert.match(toolbarSrc, /onDownloadPdf\("stickers"\)/, 'PDF dropdown has Stickers only');

    // Print button
    assert.match(toolbarSrc, /onDirectPrint/, 'Direct print handler present');
    assert.match(toolbarSrc, /Printer/, 'Printer icon present');

    // Fullscreen toggle & More actions (•••)
    assert.match(toolbarSrc, /onToggleFullscreen/, 'Fullscreen toggle present');
    assert.match(toolbarSrc, /MoreHorizontal/, 'More options menu present');
  });

  await t.test('7. Responsive CSS architecture in globals.css', () => {
    assert.match(cssSrc, /\.bol-editor-toolbar/, '.bol-editor-toolbar class defined');
    assert.match(cssSrc, /\.toolbar-cluster-row-1/, '.toolbar-cluster-row-1 defined');
    assert.match(cssSrc, /\.toolbar-cluster-row-2/, '.toolbar-cluster-row-2 defined');
    assert.match(cssSrc, /\.toolbar-group-nav-appearance/, '.toolbar-group-nav-appearance defined');

    // Check media queries
    assert.match(cssSrc, /@media \(min-width:\s*1600px\)/, 'Large desktop 1600px single-row query defined');
    assert.match(cssSrc, /@media \(max-width:\s*1023px\)/, 'Tablet 1023px wrapping query defined');
    assert.match(cssSrc, /@media \(max-width:\s*767px\)/, 'Mobile 767px stacking query defined');

    // Check 1600px single-row unification via display: contents
    assert.match(cssSrc, /display:\s*contents;/, 'Clusters expand into single row via display: contents at >= 1600px');
  });

  await t.test('8. CopyWhatsAppButton supports dark mode and uniform height', () => {
    assert.match(whatsappSrc, /dark:border-emerald-800/, 'WhatsApp button includes dark border');
    assert.match(whatsappSrc, /dark:bg-emerald-950/, 'WhatsApp button includes dark background');
    assert.match(whatsappSrc, /h-8/, 'WhatsApp button standardized to h-8 (32px)');
  });

  await t.test('9. Default Form Data leaves Note 2 blank', () => {
    const typesPath = path.join(__dirname, '..', 'lib', 'types', 'bill-of-lading.ts');
    const typesSrc = fs.readFileSync(typesPath, 'utf8');
    assert.match(typesSrc, /notes_2:\s*""/, 'initialFormData leaves notes_2 blank by default');
    assert.match(typesSrc, /notes_2_label:\s*""/, 'initialFormData leaves notes_2_label blank by default');
  });
});
