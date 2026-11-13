const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Consignee Card UI Improvements & No-Clip Single Row Audit', async (t) => {
  const editorPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'bol-editor.tsx');
  const editorSource = fs.readFileSync(editorPath, 'utf8');

  const consigneeIdx = editorSource.indexOf('<Card id="section-consignee"');
  const notifyIdx = editorSource.indexOf('<Card id="section-notify"');
  assert.ok(consigneeIdx !== -1, 'Consignee card must exist');
  assert.ok(notifyIdx !== -1, 'Notify card must exist');
  const consigneeSnippet = editorSource.slice(consigneeIdx, notifyIdx);

  await t.test('1. Consignee card header buttons use compact h-7 and gap-1 to prevent right edge clipping', () => {
    assert.ok(consigneeSnippet.includes('flex-nowrap'), 'Must use flex-nowrap');
    assert.ok(consigneeSnippet.includes('h-7 px-1.5 sm:px-2'), 'Action buttons must use compact h-7 padding to fit all screen widths');
    assert.ok(consigneeSnippet.includes('h-7 w-7 rounded-lg'), 'Clear button must use h-7 w-7');
    assert.ok(consigneeSnippet.includes('handleSwapShipperConsignee'), 'Swap button wired');
    assert.ok(consigneeSnippet.includes('handleCopyConsigneeToNotify'), 'Notify button wired');
    assert.ok(consigneeSnippet.includes('handleSetConsigneeToOrder'), 'Order button wired');
    assert.ok(consigneeSnippet.includes('clearConsigneeFields'), 'Clear button wired');
  });

  await t.test('2. Consignee presets bar includes international transit hubs', () => {
    assert.ok(consigneeSnippet.includes('Nhava Sheva'), 'Must include Nhava Sheva preset');
    assert.ok(consigneeSnippet.includes('Mersin'), 'Must include Mersin Turkey preset');
    assert.ok(consigneeSnippet.includes('Hamriyah'), 'Must include Hamriyah Sharjah preset');
    assert.ok(consigneeSnippet.includes('Sohar'), 'Must include Sohar Oman preset');
    assert.ok(consigneeSnippet.includes('Dubai'), 'Must include Dubai preset');
    assert.ok(consigneeSnippet.includes('TO ORDER OF SHIPPER'), 'Must include To Order of Shipper preset');
  });

  await t.test('3. Address quick city chips include new international ports', () => {
    assert.ok(consigneeSnippet.includes('Mersin, Turkey'), 'Must include Mersin in city chips');
    assert.ok(consigneeSnippet.includes('Hamriyah, Sharjah UAE'), 'Must include Hamriyah in city chips');
    assert.ok(consigneeSnippet.includes('Sohar, Oman'), 'Must include Sohar in city chips');
    assert.ok(consigneeSnippet.includes('Nhava Sheva, India'), 'Must include Nhava Sheva in city chips');
  });
});
