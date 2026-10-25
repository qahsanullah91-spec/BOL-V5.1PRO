const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('A4 Preview Toolbar Layout Fit & Sizing Integrity Audit', async (t) => {
  const toolbarPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview-toolbar.tsx');
  const appCssPath = path.join(__dirname, '..', 'app', 'globals.css');
  const stylesCssPath = path.join(__dirname, '..', 'styles', 'globals.css');

  assert.ok(fs.existsSync(toolbarPath), 'a4-preview-toolbar.tsx exists');
  assert.ok(fs.existsSync(appCssPath), 'app/globals.css exists');
  assert.ok(fs.existsSync(stylesCssPath), 'styles/globals.css exists');

  const toolbarSrc = fs.readFileSync(toolbarPath, 'utf8');
  const appCss = fs.readFileSync(appCssPath, 'utf8');
  const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

  await t.test('1. Verify Toolbar Row 1 & Row 2 flex-nowrap to prevent stair-step wrapping', () => {
    // Check that groups have flex-nowrap
    assert.match(toolbarSrc, /toolbar-group-identity flex items-center gap-[0-9.]+ sm:gap-[0-9.]+ flex-nowrap/, 'Group A (Identity) has flex-nowrap');
    assert.match(toolbarSrc, /toolbar-group-nav-appearance flex items-center gap-[0-9.]+ sm:gap-[0-9.]+ flex-nowrap/, 'Groups C&D (Nav & Appearance) has flex-nowrap');
    assert.match(toolbarSrc, /toolbar-group-export flex items-center gap-[0-9.]+ shrink-0 flex-nowrap/, 'Group E (Export) has flex-nowrap');
  });

  await t.test('2. Verify Desktop layout utilizes single continuous horizontal bar via display: contents', () => {
    // Verify in both CSS files
    for (const [name, css] of [['app/globals.css', appCss], ['styles/globals.css', stylesCss]]) {
      assert.match(css, /\.bol-editor-toolbar\s*\{[^}]*flex-direction:\s*row;/s, `${name} has flex-direction: row on toolbar`);
      assert.match(css, /\.bol-editor-toolbar\s*\{[^}]*flex-wrap:\s*(?:nowrap|wrap);/s, `${name} has flex-wrap on toolbar`);
      assert.match(css, /\.bol-editor-toolbar\s*\{[^}]*overflow-x:\s*(?:auto|visible|clip);/s, `${name} has overflow-x handling`);
      assert.match(css, /\.toolbar-cluster-row-1\s*\{[^}]*display:\s*contents;/s, `${name} expands cluster 1 via display: contents`);
      assert.match(css, /\.toolbar-cluster-row-2\s*\{[^}]*display:\s*contents;/s, `${name} expands cluster 2 via display: contents`);
      assert.match(css, /\.toolbar-divider-desktop\s*\{[^}]*display:\s*block;/s, `${name} renders desktop dividers`);
    }
  });

  await t.test('3. Verify Tablet fallback (<= 1023px) is exactly 2 balanced full-width rows (not 4 ragged rows)', () => {
    for (const [name, css] of [['app/globals.css', appCss], ['styles/globals.css', stylesCss]]) {
      const startIdx = css.indexOf('@media (max-width: 1023px)');
      assert.ok(startIdx !== -1, `${name} contains @media (max-width: 1023px)`);
      const nextQueryIdx = css.indexOf('@media (max-width: 767px)', startIdx);
      const tabletBody = nextQueryIdx !== -1 ? css.slice(startIdx, nextQueryIdx) : css.slice(startIdx, startIdx + 800);
      
      // Must NOT set width: 100% on nav or export groups (which was the bug causing rows 3 and 4)
      assert.doesNotMatch(tabletBody, /\.toolbar-group-nav-appearance\s*\{[^}]*width:\s*100%/s, `${name} tablet mode does NOT force nav to 100% width`);
      assert.doesNotMatch(tabletBody, /\.toolbar-group-export\s*\{[^}]*width:\s*100%/s, `${name} tablet mode does NOT force export to 100% width`);
      
      // Must balance both rows with justify-content: space-between
      assert.match(tabletBody, /\.toolbar-cluster-row-1\s*\{[^}]*justify-content:\s*space-between;/s, `${name} cluster 1 balances edge-to-edge`);
      assert.match(tabletBody, /\.toolbar-cluster-row-2\s*\{[^}]*justify-content:\s*space-between;/s, `${name} cluster 2 balances edge-to-edge`);
    }
  });

  await t.test('4. Verify Responsive Labeling preserves horizontal space on 1024px-1366px screens', () => {
    // Autosaved timestamp is hidden on screens below xl/2xl, keeping badge compact
    assert.match(toolbarSrc, /hidden (?:xl|2xl):inline font-mono/, 'Autosaved timestamp uses hidden to prevent wrapping');
    // Complete PDF label collapses to PDF on screens below xl/2xl
    assert.match(toolbarSrc, /hidden (?:lg|xl|2xl):inline.*Complete PDF/, 'Complete PDF collapses to PDF');
  });

  await t.test('5. Verify all primary actions and handlers remain wired', () => {
    assert.match(toolbarSrc, /onBackToEditor/, 'Back to Editor handler present');
    assert.match(toolbarSrc, /onSave/, 'Save handler present');
    assert.match(toolbarSrc, /onDownloadPdf/, 'Download PDF handler present');
    assert.match(toolbarSrc, /onDirectPrint/, 'Print handler present');
    assert.match(toolbarSrc, /onToggleFullscreen/, 'Fullscreen handler present');
    assert.match(toolbarSrc, /onToggleStampSignature/, 'Stamp signature handler present');
  });
});
