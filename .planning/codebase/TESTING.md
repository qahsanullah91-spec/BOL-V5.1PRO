---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Testing Strategy & Verification

**Analysis Date:** 2026-11-13

## Test Framework & Philosophy

- **Test Runner**: Node.js built-in test runner (`node:test`)
- **Assertion Library**: Node.js strict assertion library (`node:assert/strict`)
- **Execution Style**: CommonJS test suites (`tests/*.test.cjs`) for zero-transpilation execution
- **Execution Protocol**: Strictly run with `--test-concurrency=1` because test suites interact with local JSON stores
- **Scale**: **121 automated test suites** encompassing over **1,030 individual unit and integration tests**

## Source-Assertion Test Convention

Many tests in `tests/*.test.cjs` are **source-assertion tests** that read component and CSS source text and regex-assert on it (class names, handler props, CSS properties, media queries):
- Consequence: Renaming a CSS class, handler prop, or markup string can cause tests to fail even without a runtime error.
- Rule: After modifying toolbar, editor, dashboard markup, or `app/globals.css`, run the matching test suites (e.g. `tests/a4-preview-toolbar-layout-fit.test.cjs`, `tests/responsive-layout-system.test.cjs`, `tests/acci-invoice-packing-list-sync.test.cjs`) or full `npm test`.

## Core Test Commands

```bash

# Run full automated test suite (all 121 suites + TypeScript typecheck)

npm test

# Run strict TypeScript typecheck (Next.js app + Electron shell)

npm run typecheck

# Run end-to-end QA validation suite

npm run qa

# Run a specific test suite directly

node tests/acci-invoice-packing-list-sync.test.cjs
node tests/ledger-accounting.test.cjs
node tests/gcs-automated-backup.test.cjs
node tests/gemini-structured-output.test.cjs
```

## Key Test Suites & Coverage Areas

| Test Suite | File Path | Focus & Assertions |
|---|---|---|
| **ACCI Invoice & Packing List** | `tests/acci-invoice-packing-list-sync.test.cjs` | 8-tab navigation order, Cambria typography, OpenXML DOCX integrity, vector PDF structure, side-by-side chamber layout, centered Origin Afghanistan and SKY ARIANA LTD, solid chamber border box |
| **GCS Automated Backup** | `tests/gcs-automated-backup.test.cjs` | Accounting invariance validator, rejection of unbalanced ledgers, GCS snapshot archive verification |
| **Gemini Structured Output** | `tests/gemini-structured-output.test.cjs` | Model normalization (`gemini-3.8-flash`), OpenAPI JSON schemas, Afghan border routing, sanctions screening, comprehensive verification |
| **Ledger Accounting** | `tests/ledger-accounting.test.cjs` | Validates $\text{Net Balance} = \text{Debit} - \text{Credit}$ across all accounts, running balances, and transaction consistency |
| **Data Integrity Audit** | `scripts/verify-data-integrity.cjs` | Validates 284 BOLs, 288 shipments, 92 accounts, and 1,522 indexed files with 0 defects |
| **Cloud Sync & Backup Hub** | `tests/cloud-sync-backup-hub.test.cjs` | Dynamic enterprise quotas, multi-segment storage bar, pre-restore safety snapshots, RTL typography |
| **Google Drive & Encryption** | `tests/google-drive.test.cjs` | AES-256-GCM encrypted payloads, CRC32, SHA-256 deterministic hashes, zip-slip protection |
| **A4 Preview & Toolbar Fit** | `tests/a4-preview-toolbar-layout-fit.test.cjs` | Flex wrap protection, display:contents desktop continuous bar, responsive button labeling |
| **Security Watermarks** | `tests/watermark-library.test.cjs` | Asset catalog, print opacity range (0.00 to 0.35), photo freighter jet assets |

## Quality Gates & Verification Standards

1. **Pre-Release Typecheck Gate**: `npm run typecheck` must pass with 0 errors across both `tsconfig.json` and `tsconfig.electron.json`.
2. **Pre-Release Unit Test Gate**: All 121 test suites must pass 100% green with zero failures.
3. **Data Integrity Gate**: `node scripts/verify-data-integrity.cjs` must report 0 defects before any data merge or release.
4. **Accounting Invariance Gate**: Every account and transaction must satisfy $\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$.

---

*Testing analysis: 2026-11-13*
*Update when adding new test suites or testing strategies*
