const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

test('A4 Preview Cargo Row Package & Commodity Preservation', () => {
  const a4Path = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
  const a4Code = fs.readFileSync(a4Path, 'utf8');

  // 1. Verify qtyMatch and commPart parsing logic
  assert.ok(
    a4Code.includes('const commPart = qtyMatch && qtyMatch[1] && qtyMatch[2] ? qtyMatch[2].trim().replace(/^[-–—|:]\\s*/, "") : ""'),
    'CargoRow must cleanly extract commodity subtitle only when distinct quantity is matched'
  );

  // 2. Verify commPart uses whitespace-nowrap and never line-clamp or break-words
  assert.ok(
    a4Code.includes('max-w-full whitespace-nowrap overflow-hidden text-ellipsis block leading-tight px-0.5'),
    'CargoRow must prevent word wrapping across lines so commodity subtitles like DRY FIGS never get clipped'
  );
  assert.ok(
    !a4Code.includes('line-clamp-2 uppercase text-center ${isUltra ? "mt-0" : "mt-0.2"} max-w-full break-words'),
    'CargoRow must not use break-words or line-clamp-2 on commodity subtitles'
  );

  // 3. Verify RATE and VALUE subrow styling protects currency strings like USD from edge clipping
  assert.ok(
    a4Code.includes('text-slate-900 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right truncate pl-1'),
    'RATE value must have text-right truncate pl-1'
  );
  assert.ok(
    a4Code.includes('text-emerald-950 whitespace-nowrap keep-all direction-ltr unicode-isolate tabular-nums text-right truncate pl-1'),
    'VALUE value must have text-right truncate pl-1'
  );

  // 4. Verify bol-editor passes live formData to the export container
  const editorPath = path.join(__dirname, '../components/bill-of-lading/bol-editor.tsx');
  const editorCode = fs.readFileSync(editorPath, 'utf8');
  assert.ok(
    editorCode.includes('data-pdf-export-container="true"') && editorCode.includes('formData={formData}'),
    'bol-editor PDF export container must pass live formData to ensure real-time user edits are exported'
  );
});
