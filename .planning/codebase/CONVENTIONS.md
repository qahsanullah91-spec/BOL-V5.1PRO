---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Coding Conventions & Core Standards

**Analysis Date:** 2026-11-13

## 1. TypeScript & Code Standards

- **Strict Mode Enforcement**: Strict type checking is mandatory across all React 19 components, Next.js App Router handlers, Electron main/preload modules, and utility scripts (`tsconfig.json` and `tsconfig.electron.json`).
- **No Implicit `any`**: All function signatures, props, state hooks, and API responses must be explicitly typed.
- **UI Primitives**: Build interfaces using Tailwind CSS and Radix UI / Shadcn primitives. Ensure responsive layouts for desktop, tablet, and mobile views.

## 2. Accounting Invariance Identity

- **Mathematical Invariance**: All ledger entries, calculations, exports, and summary widgets must strictly satisfy:
  $$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$
- **Chronological Sequencing**: Running balances must be calculated chronologically in ascending order by transaction date.
- **Pre-Snapshot Gate**: All backup scripts (`scripts/gcs-automated-backup.cjs`, `lib/backup/validate-backup.ts`) must validate accounting invariance before writing or syncing snapshot archives.

## 3. Multi-Modal Bill of Lading (BOL) Consistency

- **Metadata Completeness**: BOL records must retain origin, transit border stations (e.g., Islam Qala, Torghundi, Hairatan, Spin Boldak), driver name, father name (`ولد`), driver rent, cargo carton count, gross weight, and net weight.
- **Relational Integrity**: Cross-reference BOL numbers seamlessly between shipment tables, client ledger accounts, and invoices with zero orphan records.

## 4. Invoice & Fee Demarcation

- **Fee Segregation**: Demarcate Freight, Demurrage/Detention, and Documentation Fees with accurate currency distinctions (USD vs. AFN).
- **Exchange Rates**: Any multi-currency conversions must explicitly declare the applied exchange rate and preserve base currency records.

## 5. Bilingual & RTL Support

- **Labels & Formatting**: Maintain English and Pashto / Dari label mapping across all financial statements, invoices, and print sheets.
- **Directionality**: Apply `dir="rtl"` and appropriate typography when rendering Pashto/Dari text columns, preserving Zero-Width Non-Joiner (`\u200C`) for compound words.

## 6. Data Integrity & Persistence Safety

- **Atomic File Operations**: Always write local JSON snapshots (`.local-*.json`) atomically (`lib/services/blob-db.ts`):
  1. Write to temporary file (`.tmp`)
  2. Flush file descriptor
  3. Create `.bak` backup copy
  4. Atomically rename/replace target with retry backoff for Windows file locks
- **Live Business Data Protection**: Root `.local-*.json` files are real production records. Never delete, reset, re-seed, or bulk-reformat them.

## 7. Python Virtual Environment Enforcement

- **Explicit Virtual Environment**: All scripts, tests, background services, and CLI tools must execute strictly via `.venv\Scripts\python.exe` (Windows) or `.venv/bin/python` (Unix). Never invoke global `python` or `python3`.
- **Prohibited Global Pip**: Global `pip install` is strictly prohibited. All packages must be installed directly through `.venv\Scripts\pip.exe`.
- **State Preservation**: Whenever dependencies are installed, updated, or removed, `.venv\Scripts\pip.exe freeze` must update `requirements.txt`.

## 8. Automatic Version Control & Release Workflow (MANDATORY)

- **Single Source of Truth**: `lib/config/system-version.ts` (UI-facing) + `package.json` (tooling). Never hardcode version strings elsewhere.
- **Single Writer**: All version mutations go through `node scripts/version-control.cjs` (`status` | `detect` | `release` | `verify` | `history` | `revalidate` | `revert --last`). Never hand-edit version fields across files.
- **One Increment Per Release**: Group all changes of a task into ONE release. Classify by overall impact: fixes/UI polish -> `--type patch`; new features/modules/db migrations -> `--type minor`; breaking changes -> `--type major`.
- **Build Identifiers**: Generated as `YYYY.MM.DD-PRO`; same-day rebuilds append `-2`, `-3`, etc.
- **Release Verification**: Automated validation (typecheck + test runner) must pass before a release is finalized.

---

*Conventions analysis: 2026-11-13*
*Update when conventions or coding standards evolve*
