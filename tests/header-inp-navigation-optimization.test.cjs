const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('INP Optimization Suite — Header Navigation & span.font-extrabold Element Isolation', async (t) => {
  const headerPath = path.join(__dirname, '..', 'components', 'header.tsx');
  const yieldToPaintPath = path.join(__dirname, '..', 'lib', 'utils', 'yield-to-paint.ts');

  assert.ok(fs.existsSync(headerPath), 'header.tsx must exist');
  assert.ok(fs.existsSync(yieldToPaintPath), 'lib/utils/yield-to-paint.ts must exist');

  const headerCode = fs.readFileSync(headerPath, 'utf-8');
  const yieldCode = fs.readFileSync(yieldToPaintPath, 'utf-8');

  await t.test('1. yieldToPaint utility is present and leverages scheduler.yield and rAF', () => {
    assert.match(
      yieldCode,
      /export\s+function\s+yieldToPaint\(\):\s*Promise<void>/,
      'yieldToPaint must be exported as Promise<void>'
    );
    assert.match(
      yieldCode,
      /scheduler\.yield/,
      'yieldToPaint must leverage modern scheduler.yield() for Chrome/Edge'
    );
    assert.match(
      yieldCode,
      /requestAnimationFrame/,
      'yieldToPaint must fallback to requestAnimationFrame before paint'
    );
  });

  await t.test('2. header.tsx imports and invokes yieldToPaint before state transition', () => {
    assert.match(
      headerCode,
      /import\s+\{\s*yieldToPaint\s*\}\s+from\s+['"]@\/lib\/utils\/yield-to-paint['"]/,
      'header.tsx must import yieldToPaint from @/lib/utils/yield-to-paint'
    );
    assert.match(
      headerCode,
      /yieldToPaint\(\)\.then\(\(\)\s*=>\s*\{[\s\S]*startTransition\(\(\)\s*=>\s*\{[\s\S]*setView\(modId\)/,
      'handleNavigate must yieldToPaint before triggering setView transition'
    );
  });

  await t.test('3. span.font-extrabold.hidden.md:inline elements are pointer-events-isolated', () => {
    // Check all instances of font-extrabold hidden md:inline have pointer-events-none
    const lines = headerCode.split('\n');
    let matchedInstances = 0;
    for (const line of lines) {
      if (line.includes('font-extrabold') && line.includes('hidden') && line.includes('md:inline')) {
        matchedInstances++;
        assert.ok(
          line.includes('pointer-events-none'),
          `Target line must include pointer-events-none: "${line.trim()}"`
        );
      }
    }
    assert.ok(matchedInstances >= 3, `Must isolate all 3 target spans (found ${matchedInstances})`);
  });

  await t.test('4. Header buttons include active:scale and [&_span]:pointer-events-none', () => {
    assert.match(
      headerCode,
      /\[&_span\]:pointer-events-none\s+\[&_svg\]:pointer-events-none/,
      'Header buttons must prevent event interception on inner spans and svgs'
    );
    assert.match(
      headerCode,
      /active:scale-\[0\.98\]/,
      'Header buttons must provide instant sub-16ms tactile active scaling'
    );
  });

  await t.test('5. DropdownMenus use modal={false} to prevent body pointer locking', () => {
    assert.match(
      headerCode,
      /<DropdownMenu\s+modal=\{false\}>/,
      'DropdownMenu in header must use modal={false}'
    );
  });
});
