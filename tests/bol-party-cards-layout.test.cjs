const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('BOL Editor Party Cards Layout & Brand Header Suite', async (t) => {
  const editorPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'bol-editor.tsx');
  const headerPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'header.tsx');
  const editorSource = fs.readFileSync(editorPath, 'utf8');
  const headerSource = fs.readFileSync(headerPath, 'utf8');

  await t.test('1. Consignee card header uses flex-nowrap to keep all 4 buttons on single row', () => {
    const consigneeIdx = editorSource.indexOf('<Card id="section-consignee"');
    assert.ok(consigneeIdx !== -1, 'Consignee card must exist');
    const consigneeSnippet = editorSource.slice(consigneeIdx, consigneeIdx + 6000);
    assert.ok(consigneeSnippet.includes('flex-nowrap'), 'Consignee header must use flex-nowrap');
    assert.ok(consigneeSnippet.includes('handleSwapShipperConsignee'), 'Swap button must be wired');
    assert.ok(consigneeSnippet.includes('handleCopyConsigneeToNotify'), 'Notify button must be wired');
    assert.ok(consigneeSnippet.includes('handleSetConsigneeToOrder'), 'Order button must be wired');
    assert.ok(consigneeSnippet.includes('clearConsigneeFields'), 'Clear button must be wired');
  });

  await t.test('2. Shipper and Notify card headers also enforce single row alignment', () => {
    const shipperIdx = editorSource.indexOf('<Card id="section-shipper"');
    const notifyIdx = editorSource.indexOf('<Card id="section-notify"');
    assert.ok(shipperIdx !== -1 && notifyIdx !== -1, 'Shipper and Notify cards must exist');
    const shipperSnippet = editorSource.slice(shipperIdx, shipperIdx + 3000);
    const notifySnippet = editorSource.slice(notifyIdx, notifyIdx + 3000);
    assert.ok(shipperSnippet.includes('flex-nowrap'), 'Shipper header must use flex-nowrap');
    assert.ok(notifySnippet.includes('flex-nowrap'), 'Notify header must use flex-nowrap');
  });

  await t.test('3. Party cards inputs and textareas feature enlarged typography and min-height', () => {
    assert.ok(editorSource.includes('h-11 text-sm sm:text-base font-black'), 'Party name inputs must use enlarged h-11 text');
    assert.ok(editorSource.includes('min-h-[84px]'), 'Address textareas must have at least 84px min-height');
    assert.ok(editorSource.includes('text-[11px] font-bold bg-slate-100'), 'City helper chips must be enlarged to 11px font-bold');
  });

  await t.test('4. Presets bars include Zap icon and Presets label', () => {
    assert.ok(editorSource.includes('Presets:'), 'Must include Presets: label');
    assert.ok(editorSource.includes('fill-amber-500/20'), 'Must include Zap icon styling for presets');
  });

  await t.test('5. Bill of Lading Header integrates official high-res brand lockup image', () => {
    assert.ok(headerSource.includes('sky-ariana-brand-lockup.png'), 'Header must reference official brand lockup graphic');
    assert.ok(headerSource.includes('bol-brand-lockup-img'), 'Must include bol-brand-lockup-img styling');
    const brandImgPath = path.join(process.cwd(), 'public', 'images', 'sky-ariana-brand-lockup.png');
    assert.ok(fs.existsSync(brandImgPath), 'sky-ariana-brand-lockup.png must exist in public/images');
  });
});
