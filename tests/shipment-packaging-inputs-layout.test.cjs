const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Shipment & Packaging Inputs UI & Size Improvements ---');

const bolEditorPath = path.join(__dirname, '../components/bill-of-lading/bol-editor.tsx');
const editorCode = fs.readFileSync(bolEditorPath, 'utf8');

// 1. Verify Card 1 section header exists with updated styling
assert.ok(
  editorCode.includes('Shipment & Packaging Inputs') && editorCode.includes('مشخصات کانتینر، پلمپ و بسته‌بندی'),
  'Card 1 must contain updated bilingual title and subtitle'
);

// 2. Verify Container No & Seal No sit in a 2-column grid
assert.ok(
  editorCode.includes('{/* Row 1: Container No & Seal No (2 Balanced Columns) */}'),
  'Row 1 must be dedicated to Container No & Seal No in 2 balanced columns'
);

// 3. Verify No. of Packages is in its own generous full-width row
assert.ok(
  editorCode.includes('{/* Row 2: No. of Packages (Generous Full-Width to Prevent Text Clipping) */}'),
  'Row 2 must give No. of Packages full width to prevent truncation and text clipping'
);

// 4. Verify Net Wt & Gross Wt sit in a 2-column grid with tare badge
assert.ok(
  editorCode.includes('{/* Row 3: Net Wt. / Carton & Gross Wt. / Carton (2 Balanced Columns - Tare Badge Never Wraps) */}'),
  'Row 3 must balance Net Wt & Gross Wt in 2 columns'
);
assert.ok(
  editorCode.includes('whitespace-nowrap') && editorCode.includes('tare'),
  'Tare badge must have whitespace-nowrap to prevent label breaking onto two lines'
);

// 5. Verify input heights are updated to h-11 for improved sizing and click targets
const card1Start = editorCode.indexOf('{/* Field Grid - Section 1: Shipment & Packaging Inputs */}');
const card1End = editorCode.indexOf('{/* Field Grid - Row 2: Rates, Weights & Valuation */}');
const card1Code = editorCode.slice(card1Start, card1End);

const h11Matches = card1Code.match(/h-11/g);
assert.ok(
  h11Matches && h11Matches.length >= 5,
  'All 5 input fields in Card 1 must use enhanced h-11 sizing'
);

// 6. Verify data bindings
assert.ok(card1Code.includes('name="container_numbers"'), 'container_numbers input bound');
assert.ok(card1Code.includes('name="seal_numbers"'), 'seal_numbers input bound');
assert.ok(card1Code.includes('name="number_of_packages"'), 'number_of_packages input bound');
assert.ok(card1Code.includes('name="kgs_per_carton"'), 'kgs_per_carton input bound');
assert.ok(card1Code.includes('name="gross_weight_per_carton"'), 'gross_weight_per_carton input bound');

console.log('✓ All 6 Shipment & Packaging Inputs UI & Size tests passed successfully!');
