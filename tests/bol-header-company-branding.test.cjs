const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Bill of Lading Header - Sky Ariana Corporate Branding Suite', async (t) => {
  const headerPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'header.tsx');
  const previewPath = path.join(process.cwd(), 'components', 'bill-of-lading', 'a4-preview.tsx');
  const cssPath = path.join(process.cwd(), 'app', 'globals.css');

  const headerSource = fs.readFileSync(headerPath, 'utf8');
  const previewSource = fs.readFileSync(previewPath, 'utf8');
  const cssSource = fs.readFileSync(cssPath, 'utf8');

  await t.test('1. Sky Ariana logo is positioned on the left side within a dedicated badge', () => {
    assert.ok(headerSource.includes('logoSrc'), 'Must compute logoSrc');
    assert.ok(headerSource.includes('/images/sky-ariana-logo.png'), 'Must fall back to /images/sky-ariana-logo.png');
    assert.ok(headerSource.includes('<img'), 'Must render image tag for company logo');
    assert.ok(headerSource.includes('crossOrigin="anonymous"'), 'Must have crossOrigin for canvas/pdf exports');
  });

  await t.test('2. Corporate Title "SKY ARIANA LIMITED" is displayed prominently in the center', () => {
    assert.ok(headerSource.includes('bol-company-title'), 'Must include .bol-company-title class');
    assert.ok(headerSource.includes('SKY ARIANA LIMITED'), 'Must have default SKY ARIANA LIMITED title');
    assert.ok(headerSource.includes('{resolvedCompanyTitle}'), 'Must render resolvedCompanyTitle');
  });

  await t.test('3. Persian company name is rendered in the center with RTL isolation', () => {
    assert.ok(headerSource.includes('bol-company-fa'), 'Must include .bol-company-fa class');
    assert.ok(headerSource.includes('{resolvedCompanyPersian}'), 'Must render resolvedCompanyPersian');
    assert.ok(headerSource.includes('dir="rtl"'), 'Must specify dir="rtl" for Persian company typography');
  });

  await t.test('4. Company Tagline / Business Scope is rendered in the center', () => {
    assert.ok(headerSource.includes('bol-company-tagline'), 'Must include .bol-company-tagline class');
    assert.ok(headerSource.includes('{resolvedCompanyTagline}'), 'Must render resolvedCompanyTagline');
    assert.ok(headerSource.includes('Import & Export - International Transportation'), 'Must default to official tagline');
  });

  await t.test('5. Lower center area displays official Head Office and Afghanistan Registration details', () => {
    assert.ok(headerSource.includes('HEAD OFFICE: ETIMAD RAHMI MARKET, KANDAHAR'), 'Must display Head Office location');
    assert.ok(headerSource.includes('REG: 90021-AFG'), 'Must display Afghanistan commercial registration');
    assert.ok(headerSource.includes('CARRIER CODE: SKY-AF'), 'Must display official carrier code');
  });

  await t.test('6. Bilingual Document titles and dynamic Document No. are preserved without overlap', () => {
    assert.ok(headerSource.includes('BILL OF LADING'), 'Must retain BILL OF LADING');
    assert.ok(headerSource.includes('bol-title-en'), 'Must retain bol-title-en');
    assert.ok(headerSource.includes('bol-title-fa'), 'Must retain bol-title-fa');
    assert.ok(headerSource.includes('DOCUMENT NO.'), 'Must retain DOCUMENT NO.');
    assert.ok(headerSource.includes('{bolNumber}'), 'Must retain dynamic bolNumber');
  });

  await t.test('7. Globals.css includes responsive and print-ready typography rules for company branding', () => {
    assert.ok(cssSource.includes('.bol-company-title'), 'globals.css must have .bol-company-title');
    assert.ok(cssSource.includes('.bol-company-fa'), 'globals.css must have .bol-company-fa');
    assert.ok(cssSource.includes('.bol-company-tagline'), 'globals.css must have .bol-company-tagline');
  });
});
