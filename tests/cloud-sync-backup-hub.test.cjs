// @ts-check
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Multi-Device Cloud Sync & Enterprise Backup Hub Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..');
  const settingsPath = path.join(rootDir, 'components', 'settings-view.tsx');

  assert.ok(fs.existsSync(settingsPath), 'settings-view.tsx must exist');
  const src = fs.readFileSync(settingsPath, 'utf8');

  await t.test('1. No stale hardcoded "58 BOLs" in Cloud Sync Card', () => {
    assert.doesNotMatch(
      src,
      /58 BOLs/i,
      'Hardcoded "58 BOLs" must not exist anywhere in settings-view.tsx'
    );
    assert.match(
      src,
      /Upload your \{storageStats\.bolCount\} BOLs and \{storageStats\.ledgerCount\.toLocaleString\(\)\} ledger entries/,
      'Cloud sync card must dynamically render real saved BOL and ledger entry counts'
    );
  });

  await t.test('2. Dynamic Enterprise Storage Quota replaces obsolete 5 MB limit', () => {
    assert.doesNotMatch(
      src,
      /5 MB safe browser quota/i,
      'Obsolete "5 MB safe browser quota" label must be removed'
    );
    assert.match(
      src,
      /safeQuotaMB/,
      'storageStats must compute dynamic safe enterprise quota tier (safeQuotaMB)'
    );
    assert.match(
      src,
      /of \{storageStats\.safeQuotaMB\} MB Safe Enterprise Storage/,
      'UI must display percentage of dynamic safe enterprise storage'
    );
  });

  await t.test('3. Multi-segment storage breakdown bar and legend chips', () => {
    assert.match(
      src,
      /storageStats\.bolPercent/,
      'Storage meter must compute proportional bolPercent'
    );
    assert.match(
      src,
      /storageStats\.ledgerPercent/,
      'Storage meter must compute proportional ledgerPercent'
    );
    assert.match(
      src,
      /storageStats\.accountsPercent/,
      'Storage meter must compute proportional accountsPercent'
    );
    assert.match(
      src,
      /bg-amber-400/,
      'BOL documents segment must use amber styling'
    );
    assert.match(
      src,
      /bg-emerald-400/,
      'Ledger documents segment must use emerald styling'
    );
  });

  await t.test('4. Accounting Invariance Identity integrated in Hub (Net = Debit - Credit)', () => {
    assert.match(
      src,
      /validateLedgerInvariance/,
      'settings-view.tsx must import and execute validateLedgerInvariance'
    );
    assert.match(
      src,
      /handleRunInvarianceCheck/,
      'Diagnostic action handleRunInvarianceCheck must be wired'
    );
    assert.match(
      src,
      /Financial Invariance/i,
      'Financial Invariance stat card must be present'
    );
    assert.match(
      src,
      /100% Balanced/,
      'Financial Invariance display must confirm balanced accounts'
    );
  });

  await t.test('5. Hardened Backup Export with complete multi-table payload and timestamp tracking', () => {
    assert.match(
      src,
      /handleExportBackup/,
      'handleExportBackup handler must be defined'
    );
    assert.match(
      src,
      /skybol:last-backup-timestamp/,
      'Export must persist last-backup-timestamp'
    );
    assert.match(
      src,
      /savedInvoices/,
      'Backup package must include savedInvoices'
    );
    assert.match(
      src,
      /financialsMap/,
      'Backup package must include financialsMap'
    );
    assert.match(
      src,
      /Last Backup:/,
      'Card 2 must display the last backup timestamp'
    );
  });

  await t.test('6. Automated Pre-Restore Safety Snapshot & Fallback Rollback', () => {
    assert.match(
      src,
      /skybol:emergency-pre-restore-snapshot/,
      'handleRestoreFile must save an emergency pre-restore snapshot before mutating storage'
    );
    assert.match(
      src,
      /handleRevertPreRestore/,
      'handleRevertPreRestore handler must exist to undo accidental bad restores'
    );
    assert.match(
      src,
      /Undo Restore/,
      'Emergency rollback button must be exposed when safety snapshot exists'
    );
  });

  await t.test('7. Bilingual Dari/Pashto labels and RTL typography', () => {
    assert.match(
      src,
      /همگام‌سازی ابری تمام بارنامه‌ها و دفاتر حسابداری/,
      'Bilingual Persian/Dari description must be present for cloud sync'
    );
    assert.match(
      src,
      /دانلود فایل پشتیبان آفلاین/,
      'Bilingual Persian/Dari description must be present for backup export'
    );
    assert.match(
      src,
      /بازیابی مطمئن اطلاعات با ایجاد نسخه پشتیبان اضطراری/,
      'Bilingual Persian/Dari description must be present for restore'
    );
  });
});
