const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Sky Ariana Master Corporate Branding & Logo Suite', async (t) => {
  const rootDir = process.cwd();
  const publicImg = path.join(rootDir, 'public', 'images');
  const logosDir = path.join(publicImg, 'logos');
  const headerPath = path.join(rootDir, 'components', 'bill-of-lading', 'header.tsx');

  await t.test('1. Master Sky Ariana Logo and Brand Lockup exist in high definition', () => {
    const logoPng = path.join(publicImg, 'sky-ariana-logo.png');
    const lockupPng = path.join(publicImg, 'sky-ariana-brand-lockup.png');
    const logoSvg = path.join(publicImg, 'sky-ariana-logo.svg');

    assert.ok(fs.existsSync(logoPng), 'sky-ariana-logo.png must exist');
    assert.ok(fs.existsSync(lockupPng), 'sky-ariana-brand-lockup.png must exist');
    assert.ok(fs.existsSync(logoSvg), 'sky-ariana-logo.svg must exist');

    const svgContent = fs.readFileSync(logoSvg, 'utf8');
    assert.ok(svgContent.includes('<svg'), 'sky-ariana-logo.svg must be valid SVG');
    assert.ok(svgContent.includes('LETTER S'), 'SVG must include geometric Letter S');
    assert.ok(svgContent.includes('LETTER K'), 'SVG must include geometric Letter K');
    assert.ok(svgContent.includes('LETTER Y'), 'SVG must include geometric Letter Y');
  });

  await t.test('2. Logo design suite variants exist in public/images/logos', () => {
    const requiredLogos = [
      'sky-ariana-circular-seal.png',
      'sky-ariana-circular-seal.svg',
      'sky-ariana-modern-flat.png',
      'sky-ariana-modern-flat.svg',
      'sky-ariana-modern-3d.png',
      'sky-ariana-modern-3d.svg',
      'sky-ariana-gold-seal.png',
      'sky-ariana-gold-seal.svg',
      'sky-ariana-classic-horizontal.png',
    ];

    for (const name of requiredLogos) {
      const p = path.join(logosDir, name);
      assert.ok(fs.existsSync(p), `Missing required logo asset: ${name}`);
      const stat = fs.statSync(p);
      assert.ok(stat.size > 500, `${name} must not be empty`);
    }
  });

  await t.test('3. Bill of Lading Header cleanly integrates logo and brand lockup', () => {
    const headerSource = fs.readFileSync(headerPath, 'utf8');
    assert.ok(headerSource.includes('sky-ariana-logo.png'), 'Must fall back to sky-ariana-logo.png');
    assert.ok(headerSource.includes('sky-ariana-brand-lockup.png'), 'Must render official sky-ariana-brand-lockup.png');
    assert.ok(headerSource.includes('HEAD OFFICE: ETIMAD RAHMI MARKET, KANDAHAR'), 'Must display Head Office location');
    assert.ok(headerSource.includes('REG: 90021-AFG'), 'Must display registration');
    assert.ok(headerSource.includes('CARRIER CODE: SKY-AF'), 'Must display carrier code');
  });
});
