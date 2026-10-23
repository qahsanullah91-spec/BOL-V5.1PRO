# Testing & Quality Assurance Guide

Sky Ariana BOL maintains rigorous quality assurance standards through 600+ automated regression tests, strict TypeScript checks, and financial invariance audits.

---

## 1. Quick Test Commands

| Command | Description | Time |
| :--- | :--- | :--- |
| `npm test` | Runs the full regression suite (`node --test`) and executes `tsc --noEmit` | ~70s |
| `npm run typecheck` | Strict TypeScript compilation check for both Next.js app and Electron | ~10s |
| `npm run qa:data` | Verifies local JSON snapshot schemas and data integrity | ~2s |
| `npm run qa:backup` | Runs automated backup, snapshot, and disaster recovery suites | ~15s |
| `npm run qa:mobile` | Validates responsive layouts and Persian/Dari mojibake prevention | ~5s |
| `npm run qa:a4` | Audits A4 document print layouts and authorized signature blocks | ~5s |
| `npm run qa:full` | Comprehensive test covering backups, recovery, data, linting, and Next.js build | ~2m |

---

## 2. Running Python Pre-Deployment QA

The deployment skill provides an automated verification script that audits data snapshots, accounting invariance, and TypeScript compiler output:

```powershell
py .agents/skills/qa-and-deployment/scripts/verify_project.py
```

### Verification Pipeline:
1. **Snapshot Integrity Check**: Validates that `.local-bols.json`, `.local-account-ledgers.json`, `.local-bol-account-ledgers.json`, and `.local-invoices.json` contain valid JSON schemas.
2. **Accounting Invariance Verification**: Enforces $\text{Balance} = \text{Debit} - \text{Credit}$ sequentially across all accounts.
3. **TypeScript Strict Typecheck**: Runs `tsc --noEmit` with zero allowed warnings/errors.

---

## 3. Key Regression Test Suites

All tests are implemented using the native Node.js test runner (`node:test` and `node:assert/strict`):

- **[`tests/account-ledger-print.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/account-ledger-print.test.cjs)**:
  Verifies that account ledgers strictly preserve accounting invariance ($\text{Balance} = \text{Debit} - \text{Credit}$), ensures multi-currency segregation, and checks Windows-safe filename generation.
- **[`tests/bol-sequence.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/bol-sequence.test.cjs)**:
  Tests sequential numbering, atomic increment locks, and gap prevention across simultaneous saves.
- **[`tests/bol-whatsapp-template.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/bol-whatsapp-template.test.cjs)**:
  Validates WhatsApp shipment update formatting, transit route parsing, and Persian/Dari ZWNJ typography.
- **[`tests/print-preview-modal.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/print-preview-modal.test.cjs)**:
  Verifies Report Print Preview Studio features: A4 proportions, dynamic page numbering, column toggles, and print root isolation.
- **[`tests/treasury-engine.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/treasury-engine.test.cjs)**:
  Enforces double-entry dual-effect posting (Receipts, Payment Vouchers, Transfers, and Foreign Exchange vouchers).
- **[`tests/backup-restore-v2.test.cjs`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tests/backup-restore-v2.test.cjs)**:
  Tests sandbox restore simulations, checksum verification, and disaster recovery accreditation.

---

## 4. Running Individual Tests

You can execute any individual test file with Node:

```powershell
node --test tests/print-preview-modal.test.cjs
node --test tests/bol-whatsapp-template.test.cjs
node --test tests/account-ledger-print.test.cjs
```
