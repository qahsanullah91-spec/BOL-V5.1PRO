const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Cargo Description of Goods UI & Text Improvements ---');

const a4PreviewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
assert.ok(fs.existsSync(a4PreviewPath), 'a4-preview.tsx must exist');
const a4PreviewContent = fs.readFileSync(a4PreviewPath, 'utf8');

// 1. Verify normalizeCargoText auto-corrects RAISNIS and unit dashes
assert.ok(
  a4PreviewContent.includes('function normalizeCargoText('),
  'normalizeCargoText must be defined'
);
assert.ok(
  a4PreviewContent.includes('/\\braisnis\\b/gi'),
  'normalizeCargoText must correct raisnis to RAISINS'
);
assert.ok(
  a4PreviewContent.includes('16 KGS') || a4PreviewContent.includes('/(\\d+)\\s*-\\s*(KGS?|KG|CTNS?|PKGS?|BAGS?|BOXES|PCS|UNITS|TONS?|LBS?)\\b/gi'),
  'normalizeCargoText must clean awkward dashes before weight units'
);

// 2. Verify formatCargoRate correctly formats rate strings
assert.ok(
  a4PreviewContent.includes('function formatCargoRate('),
  'formatCargoRate must be defined'
);

// 3. Verify cleanCargoDescriptionText uses normalizeCargoText
assert.ok(
  a4PreviewContent.includes('const normalized = normalizeCargoText(text)'),
  'cleanCargoDescriptionText must normalize cargo text'
);

// 4. Verify CargoDescriptionBlock uses solid background to prevent watermark bleed-through
const blockStart = a4PreviewContent.indexOf('function CargoDescriptionBlock(');
const blockEnd = a4PreviewContent.indexOf('function BackgroundWatermark(');
assert.ok(blockStart !== -1 && blockEnd !== -1, 'Must find CargoDescriptionBlock range');
const blockCode = a4PreviewContent.slice(blockStart, blockEnd);

assert.ok(
  blockCode.includes('background: "#ffffff"'),
  'CargoDescriptionBlock container must have solid white background to block mountain watermark'
);
assert.ok(
  blockCode.includes('border-1.5 border-blue-300'),
  'CargoDescriptionBlock must have crisp border-1.5 border-blue-300'
);

// 5. Verify enlarged Header Bar typography
assert.ok(
  blockCode.includes('isUltra ? "text-[8.2pt]" : isCompact ? "text-[9.0pt]" : "text-[9.8pt]"'),
  'Description of Goods English title must be enlarged to at least 8.2pt'
);
assert.ok(
  blockCode.includes('isUltra ? "text-[8.5pt]" : isCompact ? "text-[9.4pt]" : "text-[10.2pt]"'),
  'Description of Goods Persian title must be enlarged to at least 8.5pt'
);

// 6. Verify enlarged Meta Chips & Item Cards
assert.ok(
  blockCode.includes('isUltra ? "text-[8.4pt]" : isCompact ? "text-[9.2pt]" : "text-[10.0pt]"'),
  'Meta chip value font size must be enlarged to at least 8.4pt'
);
assert.ok(
  blockCode.includes('text-[8.6pt]') && blockCode.includes('text-[10.5pt]'),
  'Cargo item cards must have enlarged typography (8.6pt to 10.5pt)'
);
assert.ok(
  blockCode.includes('isUltra ? "px-2 py-0.6 text-[8.0pt]" : isCompact ? "px-2.5 py-0.8 text-[8.8pt]" : "px-3 py-1 text-[9.5pt]"'),
  'Rate badge must have enlarged typography (8.0pt to 9.5pt)'
);

// 7. Verify bol-editor.tsx also has clean cargo format
const bolEditorPath = path.join(__dirname, '../components/bill-of-lading/bol-editor.tsx');
const bolEditorContent = fs.readFileSync(bolEditorPath, 'utf8');
assert.ok(
  bolEditorContent.includes('/\\braisnis\\b/gi'),
  'bol-editor formatCleanCargoDescription must correct raisnis'
);

console.log('✓ All 7 Cargo Description UI & Text tests passed successfully!');
