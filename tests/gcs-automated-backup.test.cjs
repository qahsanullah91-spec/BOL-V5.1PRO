const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validateAccountingInvariance } = require('../scripts/gcs-automated-backup.cjs');

test('GCS Automated Backup script exists and exports required methods', () => {
  const scriptPath = path.resolve(__dirname, '../scripts/gcs-automated-backup.cjs');
  assert.ok(fs.existsSync(scriptPath), 'scripts/gcs-automated-backup.cjs must exist');
  assert.strictEqual(typeof validateAccountingInvariance, 'function');
});

test('Accounting Invariance Validator accepts mathematically balanced ledgers', () => {
  const validLedger = JSON.stringify({
    accounts: [
      { account_name: 'Client Alpha', total_debit: 15000, total_credit: 5000, current_balance: 10000 },
      { account_name: 'Client Beta', total_debit: 20000, total_credit: 20000, current_balance: 0 },
      { account_name: 'Driver Khair', total_debit: 4500, total_credit: 9000, current_balance: -4500 },
    ],
  });

  const result = validateAccountingInvariance(validLedger);
  assert.strictEqual(result.accountsCount, 3);
  assert.strictEqual(result.totalDebit, 39500);
  assert.strictEqual(result.totalCredit, 34000);
  assert.strictEqual(result.totalBalance, 5500);
});

test('Accounting Invariance Validator rejects unbalanced ledgers with discrepancy', () => {
  const invalidLedger = JSON.stringify({
    accounts: [
      { account_name: 'Corrupt Account', total_debit: 10000, total_credit: 4000, current_balance: 7500 }, // Discrepancy of 1500
    ],
  });

  assert.throws(
    () => validateAccountingInvariance(invalidLedger),
    /Accounting invariance violation/
  );
});

test('GCS Snapshot Directory and generated archives exist', () => {
  const gcsDir = path.resolve(__dirname, '../data/backups/gcs-snapshots');
  assert.ok(fs.existsSync(gcsDir), 'data/backups/gcs-snapshots directory must exist');
  const archives = fs.readdirSync(gcsDir).filter(f => f.endsWith('.json.gz'));
  assert.ok(archives.length > 0, 'At least one GCS snapshot archive must exist');
});
