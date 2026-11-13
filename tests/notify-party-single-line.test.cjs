const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Notify Party Single Line & No-Hyphen Audit', async (t) => {
  const projectRoot = path.join(__dirname, '..');
  const previewPath = path.join(projectRoot, 'components', 'bill-of-lading', 'a4-preview.tsx');
  const cssPath = path.join(projectRoot, 'app', 'globals.css');

  const previewCode = fs.readFileSync(previewPath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  await t.test('1. notifyPartyFa label does not contain hyphen character', () => {
    // Assert no \u002d or literal hyphen in notifyPartyFa definition
    const match = previewCode.match(/notifyPartyFa:\s*"([^"]+)"/);
    assert.ok(match, 'notifyPartyFa definition must exist in a4-preview.tsx');
    const raw = match[1];
    assert.ok(!raw.includes('-') && !raw.includes('\\u002d'), 'notifyPartyFa must not contain hyphen');
    
    // Decode unicode escapes if any
    const decoded = JSON.parse(`"${raw}"`);
    assert.ok(decoded.includes('طرف اطلاع') && decoded.includes('رسانی'), 'notifyPartyFa must contain طرف اطلاع and رسانی');
  });

  await t.test('2. a4-preview.tsx Notify Party subtitle enforces whitespace-nowrap', () => {
    assert.ok(
      previewCode.includes('labels.notifyPartyFa') &&
      previewCode.includes('whitespace-nowrap'),
      'Notify Party subtitle in JSX must include whitespace-nowrap class'
    );
    assert.ok(
      previewCode.includes('style={{ whiteSpace: "nowrap" }}'),
      'Notify Party subtitle must enforce inline whiteSpace: "nowrap"'
    );
  });

  await t.test('3. globals.css enforces white-space: nowrap !important on party-card-subtitle in PDF and print', () => {
    assert.match(
      cssCode,
      /\[data-bol-a4="true"\]\s+\.party-card-subtitle[\s\S]*?white-space:\s*nowrap\s*!important;/,
      'globals.css must enforce white-space: nowrap !important on [data-bol-a4="true"] .party-card-subtitle'
    );
    assert.match(
      cssCode,
      /\[data-pdf-export="true"\]\s+\.party-card-subtitle[\s\S]*?white-space:\s*nowrap\s*!important;/,
      'globals.css must enforce white-space: nowrap !important on [data-pdf-export="true"] .party-card-subtitle'
    );
  });
});
