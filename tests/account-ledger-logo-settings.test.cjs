const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('Account Ledger Logo & Branding Settings Suite', async (t) => {
  await t.test('1. AccountLedgerSettingsDialog exists with full presets gallery and watermark controls', () => {
    const dialogPath = path.join(__dirname, '..', 'components', 'ledger', 'account-ledger-settings-dialog.tsx');
    assert.ok(fs.existsSync(dialogPath), 'account-ledger-settings-dialog.tsx must exist');
    const content = fs.readFileSync(dialogPath, 'utf8');

    assert.ok(content.includes('export function AccountLedgerSettingsDialog'), 'Must export AccountLedgerSettingsDialog');
    assert.ok(content.includes('OFFICIAL_LOGO_PRESETS'), 'Must utilize OFFICIAL_LOGO_PRESETS');
    assert.ok(content.includes('WATERMARK_OPTIONS'), 'Must export WATERMARK_OPTIONS');
    assert.ok(content.includes('handleSyncWithBol'), 'Must provide 1-click sync with Bill of Lading');
    assert.ok(content.includes('Live Document Header Preview'), 'Must include live document header preview');
    assert.ok(content.includes('handleFileUpload'), 'Must support custom logo image uploads');
  });

  await t.test('2. LedgerView connects AccountLedgerSettingsDialog and responsive header branding', () => {
    const ledgerViewPath = path.join(__dirname, '..', 'components', 'ledger-view.tsx');
    assert.ok(fs.existsSync(ledgerViewPath), 'components/ledger-view.tsx must exist');
    const content = fs.readFileSync(ledgerViewPath, 'utf8');

    assert.ok(content.includes('AccountLedgerSettingsDialog'), 'ledger-view.tsx must import AccountLedgerSettingsDialog');
    assert.ok(content.includes('<AccountLedgerSettingsDialog'), 'ledger-view.tsx must render AccountLedgerSettingsDialog');
    assert.ok(content.includes('brandLockupUrl'), 'ledger-view.tsx must check brandLockupUrl');
    assert.ok(content.includes('backgroundOpacity'), 'ledger-view.tsx must apply backgroundOpacity');
  });

  await t.test('3. AccountLedgerDocument and AccountLedgerHeader integrate branding lockups and watermarks', () => {
    const docPath = path.join(__dirname, '..', 'components', 'ledger', 'account-ledger-document.tsx');
    assert.ok(fs.existsSync(docPath), 'account-ledger-document.tsx must exist');
    const content = fs.readFileSync(docPath, 'utf8');

    assert.ok(content.includes('brandLockupUrl?: string'), 'LedgerCompanySettings must support brandLockupUrl');
    assert.ok(content.includes('logoDesignId?: string'), 'LedgerCompanySettings must support logoDesignId');
    assert.ok(content.includes('backgroundOpacity?: number'), 'LedgerCompanySettings must support backgroundOpacity');
    assert.ok(content.includes('showLockup && brandLockup'), 'AccountLedgerHeader must render lockup banner');
    assert.ok(content.includes('ledger-watermark-layer'), 'AccountLedgerDocument must render watermark background layer');
  });

  await t.test('4. lib/app-context.tsx defines DEFAULT_LEDGER_SETTINGS with high-DPI branding defaults', () => {
    const contextPath = path.join(__dirname, '..', 'lib', 'app-context.tsx');
    const content = fs.readFileSync(contextPath, 'utf8');

    assert.ok(content.includes('DEFAULT_LEDGER_SETTINGS'), 'Must export DEFAULT_LEDGER_SETTINGS');
    assert.ok(content.includes("logoDesignId: 'modern-flat'"), 'Default design must be modern-flat');
    assert.ok(content.includes("brandLockupUrl: '/images/sky-ariana-brand-lockup.png'"), 'Default brand lockup must be set');
  });
});
