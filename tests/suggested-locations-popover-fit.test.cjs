const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
const editorSrc = fs.readFileSync(editorPath, 'utf8');

test('Suggested Locations Popover Layout Fit & Responsive Safeguards', async (t) => {
  await t.test('1. Horizontal Scroll & Chevron Navigation for Filter Pills', () => {
    // Assert navigation chevrons are present
    assert.ok(editorSrc.includes('<ChevronLeft className="h-3.5 w-3.5" />'), 'Must include left chevron scroll button');
    assert.ok(editorSrc.includes('<ChevronRight className="h-3.5 w-3.5" />'), 'Must include right chevron scroll button');
    assert.ok(editorSrc.includes('pills-scroll-track'), 'Must include pills-scroll-track container');
    assert.ok(editorSrc.includes('container.scrollBy({ left: 140, behavior: \'smooth\' })'), 'Must support 140px smooth right scroll');
    assert.ok(editorSrc.includes('container.scrollBy({ left: -140, behavior: \'smooth\' })'), 'Must support 140px smooth left scroll');
    assert.ok(editorSrc.includes('e.currentTarget.scrollLeft += e.deltaY'), 'Must support mouse wheel horizontal scrolling');
  });

  await t.test('2. Popover Header Architecture Prevents 3-Column Column Squeeze', () => {
    // Row 1: Title, counter, mode badges, close button
    assert.ok(editorSrc.includes('Suggested Locations</span>'), 'Must display Suggested Locations title');
    assert.ok(editorSrc.includes('{quickLocationMatches.length}'), 'Must display match counter badge');
    assert.ok(editorSrc.includes('setShowLocationDropdown(null)'), 'Must include close trigger');

    // Row 2: Full-width live search bar
    assert.ok(editorSrc.includes('"Filter locations, ports, codes (e.g. Jask, Sohar, DXB)..."'), 'Must have descriptive search placeholder');
  });

  await t.test('3. Escape Key Closes Popover Cleanly', () => {
    assert.ok(editorSrc.includes('e.key === "Escape"'), 'Must listen for Escape key');
    assert.ok(editorSrc.includes('if (showLocationDropdown === null) return'), 'Escape key must guard active dropdown state');
  });

  await t.test('4. Rich Empty State UX with Show All & Accept Custom Entry Actions', () => {
    assert.ok(editorSrc.includes('No predefined locations found'), 'Must include empty state title');
    assert.ok(editorSrc.includes('🌐 Show All Locations'), 'Must provide Show All Locations button');
    assert.ok(editorSrc.includes('✓ Keep Custom Entry &amp; Close') || editorSrc.includes('✓ Keep Custom Entry & Close'), 'Must provide Keep Custom Entry button');
  });

  await t.test('5. Container Bounds & Positioning Safeguards', () => {
    assert.ok(editorSrc.includes('max-h-[70vh] sm:max-h-[30rem]'), 'Must use restrained popover height to avoid crushing cards');
    assert.ok(editorSrc.includes('border-2 border-amber-400'), 'Must maintain high-visibility amber accent border');
  });
});
