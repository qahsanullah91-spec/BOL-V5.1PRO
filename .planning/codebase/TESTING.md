---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Testing Strategy & Verification

**Analysis Date:** 2026-10-23

## Test Framework & Runners

- **Runner**: Node.js built-in test runner (`node:test`)
- **Assertions**: Node.js strict assertion library (`node:assert/strict`)
- **Language**: CommonJS (`.test.cjs`) for fast, zero-transpilation test execution
- **Execution Environment**: Cross-platform (Windows PowerShell / cmd.exe / Linux)

## Core Test Commands

```bash

# Run all automated tests (606 tests across 11 test suites)

cmd /c "npm test"

# Run strict TypeScript type checks (Next.js + Electron)

cmd /c "npm run typecheck"

# Run a specific test suite directly

node --test tests/print-preview-modal.test.cjs
node --test tests/communications-engine.test.cjs
node --test tests/accounting-invariance.test.cjs
```

## Test Suites & Coverage

| Test Suite | File Path | Focus & Critical Assertions |
|---|---|---|
| **Accounting Invariance** | `tests/accounting-invariance.test.cjs` | Validates $\text{Net Balance} = \text{Debit} - \text{Credit}$ across all 95 accounts (2,600+ ledger entries) |
| **Print Preview Studio** | `tests/print-preview-modal.test.cjs` | Windows 11 registry fix, IPC print handlers, A4 vector layout, repeating headers |
| **Communications Engine** | `tests/communications-engine.test.cjs` | Multilingual variable interpolation, WhatsApp deep links, customer safety sanitization |
| **Supplier & Profitability** | `tests/supplier-costs-profitability.test.cjs` | Gross profit calculation, variance detection, weight-based cost allocations, zero-division guards |
| **Enterprise Treasury** | `tests/treasury-engine.test.cjs` | Cash/bank books, idempotency keys, payment/receipt vouchers, FX currency exchange |
| **Warehouse Engine** | `tests/warehouse-engine.test.cjs` | Receiving (WHR), stock reservations, damage logs, zero negative stock enforcement |
| **BOL Lifecycle & Edits** | `tests/saved-bol-lifecycle.test.cjs` | Document package generation, auto-sync, draft updates, rate calculations |
| **Performance & Scale** | `tests/performance-scale-stress.test.cjs` | Rapid concurrent read-modify-write operations, bounded LRU cache eviction (100 items) |

## Quality Gates & Verification Standards

1. **Pre-Commit Verification**: All 11 test suites must pass 100% green with zero test failures or regressions.
2. **Type Safety Gate**: Both `tsconfig.json` and `tsconfig.electron.json` must compile with 0 errors via `tsc --noEmit`.
3. **Accounting Invariance Gate**: Every account ledger transaction must strictly maintain mathematical balance invariance.
4. **Relational Attachment Gate**: Files, document packages, and invoices must bind strictly to designated BOL numbers without cross-document leakage.

---

*Testing analysis: 2026-10-23*
*Update when adding new test suites or testing strategies*
