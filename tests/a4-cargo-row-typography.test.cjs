const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing A4 Preview Cargo Row & Totals Typography Improvements ---');

const a4PreviewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
const a4PreviewCode = fs.readFileSync(a4PreviewPath, 'utf8');

// 1. Verify CargoRow font constants are enlarged
assert.ok(
  a4PreviewCode.includes('const valFont = isUltra ? "text-[8.8pt]" : isCompact ? "text-[10.2pt]" : "text-[11.8pt]"'),
  'CargoRow valFont must be enlarged to 11.8pt in normal density'
);

assert.ok(
  a4PreviewCode.includes('const subLabelFont = isUltra ? "text-[5.6pt]" : isCompact ? "text-[6.6pt]" : "text-[7.5pt]"'),
  'CargoRow subLabelFont must be enlarged to 7.5pt in normal density'
);

assert.ok(
  a4PreviewCode.includes('const packageQtyFont = isUltra ? "text-[10pt]" : isCompact ? "text-[12pt]" : "text-[14pt]"') ||
  a4PreviewCode.includes('const packageQtyFont = isUltra ? "text-[11pt]" : isCompact ? "text-[14pt]" : "text-[16pt]"'),
  'CargoRow packageQtyFont must be enlarged in normal density'
);

// 2. Verify sub-cards in CargoRow use rounded-md pills with tabular-nums and font-black
const cargoRowStart = a4PreviewCode.indexOf('function CargoRow(');
const cargoRowEnd = a4PreviewCode.indexOf('function CargoTotalsRow(');
assert.ok(cargoRowStart !== -1 && cargoRowEnd !== -1, 'CargoRow and CargoTotalsRow must exist');
const cargoRowCode = a4PreviewCode.slice(cargoRowStart, cargoRowEnd);

// NET & GROSS labels & styling
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>NET</span>'), 'NET label has tracking-wider');
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>GROSS</span>'), 'GROSS label has tracking-wider');

// NET WT & GROSS WT labels & styling
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>NET WT</span>'), 'NET WT label has tracking-wider');
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>GROSS WT</span>'), 'GROSS WT label has tracking-wider');

// RATE & VALUE labels & styling
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>RATE</span>'), 'RATE label has tracking-wider');
assert.ok(cargoRowCode.includes('tracking-wider shrink-0`}>VALUE</span>'), 'VALUE label has tracking-wider');

// Check pill styling rounded-md
assert.ok(cargoRowCode.includes('rounded-md bg-blue-50/70 border border-blue-200/80'), 'NET pill container styled with rounded-md');
assert.ok(cargoRowCode.includes('rounded-md bg-emerald-50/90 border border-emerald-300/90'), 'VALUE pill container styled with rounded-md');

// Check tabular-nums on font-black values
assert.ok(cargoRowCode.includes('font-mono font-black ${valFont} text-blue-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums'), 'NET values have tabular-nums and font-black');
assert.ok(cargoRowCode.includes('font-mono font-black ${valFont} text-emerald-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums'), 'VALUE values have tabular-nums and font-black');

// 3. Verify CargoTotalsRow font constants are proportionally scaled
assert.ok(
  a4PreviewCode.includes('const totalValFont = isUltra ? "text-[9.8pt]" : isCompact ? "text-[12pt]" : "text-[14pt]"'),
  'CargoTotalsRow totalValFont must be scaled up to 14pt in normal density'
);

assert.ok(
  a4PreviewCode.includes('const subLabelFont = isUltra ? "text-[6pt]" : isCompact ? "text-[7.2pt]" : "text-[8.2pt]"'),
  'CargoTotalsRow subLabelFont must be scaled up to 8.2pt in normal density'
);

console.log('✓ All A4 Preview Cargo Row & Totals Typography tests passed successfully!');
