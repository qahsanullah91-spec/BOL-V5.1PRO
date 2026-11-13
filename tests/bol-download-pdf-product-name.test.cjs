const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

test('BOL Download PDF Product Name & Description Display', () => {
  const a4PreviewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
  assert.ok(fs.existsSync(a4PreviewPath), 'a4-preview.tsx must exist');
  const a4PreviewContent = fs.readFileSync(a4PreviewPath, 'utf8');

// 1. Verify CargoRow commPart has dynamic font scaling tiers and readable letter-spacing
assert.ok(
  a4PreviewContent.includes('commPart.length > 22'),
  'CargoRow commPart must have scaling tier for length > 22'
);
assert.ok(
  a4PreviewContent.includes('commPart.length > 16'),
  'CargoRow commPart must have scaling tier for length > 16'
);
assert.ok(
  a4PreviewContent.includes('commPart.length > 11'),
  'CargoRow commPart must have scaling tier for length > 11 (e.g. BLACK RAISINS)'
);
assert.ok(
  a4PreviewContent.includes('letterSpacing: commPart.length > 10 ? "-0.015em" : "normal"'),
  'CargoRow commPart must keep product names readable without excessive letter compression'
);
assert.ok(
  a4PreviewContent.includes('max-w-full whitespace-nowrap overflow-hidden text-ellipsis block leading-tight px-0.5'),
  'CargoRow commPart must preserve standard wrapper classes for test suite compliance'
);

// 2. Verify CargoDescriptionBlock entry check checks both cleanedCargoDesc and cargoItems
const blockStart = a4PreviewContent.indexOf('function CargoDescriptionBlock(');
const blockEnd = a4PreviewContent.indexOf('function BackgroundWatermark(');
assert.ok(blockStart !== -1 && blockEnd !== -1, 'Must find CargoDescriptionBlock boundaries');
const blockCode = a4PreviewContent.slice(blockStart, blockEnd);

assert.ok(
  blockCode.includes('if (!cleanedCargoDesc && (!cargoItems || cargoItems.length === 0)) return null'),
  'CargoDescriptionBlock must remain visible when cargoItems are available even if cleanedCargoDesc is empty'
);

// 3. Verify displayItemLines never strips user product descriptions
assert.ok(
  blockCode.includes('if (itemLines.length > 0)'),
  'CargoDescriptionBlock must directly preserve itemLines when present'
);
assert.ok(
  blockCode.includes('Synthesize items from cargoItems if no explicit itemLines were provided'),
  'CargoDescriptionBlock must synthesize commodity items when explicit lines are absent'
);
assert.ok(
  !blockCode.includes('return !cargoItems.some((item) => {'),
  'CargoDescriptionBlock must NOT filter out commodity items matching cargoItems'
);

// 4. Verify Page 1 and Page 2 call sites render CargoDescriptionBlock when cargoItems exist
assert.ok(
  a4PreviewContent.includes('(hasValue(cleanedCargoDesc) || (syncedCargo.items && syncedCargo.items.length > 0))'),
  'Call sites on Page 1 and Page 2 must invoke CargoDescriptionBlock when cargo items exist'
);
  console.log('✓ All BOL Download PDF Product Name tests passed successfully!');
});
