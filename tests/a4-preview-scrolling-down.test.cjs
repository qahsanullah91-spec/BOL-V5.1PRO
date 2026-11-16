const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('A4 Preview & Software EXE Scrolling Down Verification Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..');
  const appCssPath = path.join(rootDir, 'app', 'globals.css');
  const bolEditorPath = path.join(rootDir, 'components', 'bill-of-lading', 'bol-editor.tsx');
  const useScalePath = path.join(rootDir, 'components', 'bill-of-lading', 'use-a4-preview-scale.ts');

  assert.ok(fs.existsSync(appCssPath), 'app/globals.css exists');
  assert.ok(fs.existsSync(bolEditorPath), 'bol-editor.tsx exists');
  assert.ok(fs.existsSync(useScalePath), 'use-a4-preview-scale.ts exists');

  const appCss = fs.readFileSync(appCssPath, 'utf8');
  const bolEditor = fs.readFileSync(bolEditorPath, 'utf8');
  const useScale = fs.readFileSync(useScalePath, 'utf8');

  await t.test('1. globals.css ensures .a4-preview-viewport enables vertical scrolling in ALL modes', () => {
    // Base viewport must enforce vertical and horizontal scrolling
    assert.match(
      appCss,
      /\.a4-preview-viewport\s*\{[^}]*overflow-y:\s*auto\s*!important;/s,
      '.a4-preview-viewport enforces overflow-y: auto !important'
    );
    assert.match(
      appCss,
      /\.a4-preview-viewport\s*\{[^}]*overflow-x:\s*auto\s*!important;/s,
      '.a4-preview-viewport enforces overflow-x: auto !important'
    );

    // Fit Page mode must NOT be locked with overflow: hidden
    assert.doesNotMatch(
      appCss,
      /\.a4-preview-viewport\[data-preview-mode="page"\]\s*\{[^}]*overflow:\s*hidden\s*!important;/s,
      'Fit Page mode must NOT have overflow: hidden !important'
    );

    // Fit Page mode must explicitly allow vertical scrolling
    assert.match(
      appCss,
      /\.a4-preview-viewport\[data-preview-mode="page"\]\s*\{[^}]*overflow-y:\s*auto\s*!important;/s,
      'Fit Page mode explicitly enables overflow-y: auto !important'
    );
  });

  await t.test('2. bol-editor.tsx never locks viewport with overflow-hidden', () => {
    // Must NOT have conditional overflow-hidden for page mode
    assert.doesNotMatch(
      bolEditor,
      /previewMode\s*===\s*["']page["']\s*\?\s*["']overflow-hidden["']/,
      'Viewport className must not conditionally assign overflow-hidden in page mode'
    );

    // Must declare overflow-y-auto and tabIndex={0}
    assert.match(
      bolEditor,
      /data-a4-viewport[\s\S]*?tabIndex=\{0\}/,
      'Viewport must have tabIndex={0} to receive keyboard focus for scrolling'
    );
    assert.match(
      bolEditor,
      /className=["'][^"']*?overflow-y-auto\s+overflow-x-auto[^"']*?["']/,
      'Viewport must include overflow-y-auto and overflow-x-auto'
    );

    // Bottom padding must provide comfortable clearance past the bottom of the document
    assert.match(
      bolEditor,
      /paddingBottom:\s*`\$\{Math\.max\(verticalPadding,\s*48\)\}px`/,
      'Stage wrapper provides at least 48px bottom scroll clearance'
    );
  });

  await t.test('3. use-a4-preview-scale.ts uses true totalUnscaledHeight and supports keyboard scrolling', () => {
    // currentDocHeight must always reflect totalUnscaledHeight
    assert.match(
      useScale,
      /const\s+currentDocHeight\s*=\s*totalUnscaledHeight/,
      'currentDocHeight strictly uses totalUnscaledHeight so all content is scrollable'
    );

    // Keyboard navigation must support PageDown, PageUp, Space, Home, End
    assert.match(useScale, /e\.key\s*===\s*["']PageDown["']/, 'Supports PageDown navigation');
    assert.match(useScale, /e\.key\s*===\s*["']PageUp["']/, 'Supports PageUp navigation');
    assert.match(useScale, /viewportRef\.current\.scrollBy/, 'Performs smooth scrollBy on viewport');
  });
});
