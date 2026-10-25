---
trigger: always_on
---

# Sky Ariana BOL — Core Project Rules & Standards

## 1. TypeScript & Code Standards
- **Strict Mode Enforcement**: Maintain strict type safety across all React 19 components, Next.js App Router handlers, and utility modules. No implicit `any`.
- **UI Component Consistency**: Use Tailwind CSS and Radix UI / Shadcn primitives. Ensure responsive layouts for desktop, tablet, and mobile invoice viewing.

## 2. Accounting Invariance Identity
- **Mathematical Invariance**: All ledger entries, calculations, exports, and summary widgets must strictly satisfy:
  $$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$
- **Chronological Sequencing**: Running balances must be calculated chronologically in ascending order by transaction date.

## 3. Multi-Modal Bill of Lading (BOL) Consistency
- **Metadata Completeness**: BOL records must retain origin, transit border stations (e.g., Islam Qala, Torghundi, Hairatan, Spin Boldak), driver name, father name, driver rent, cargo carton count, gross weight, and net weight.
- **Relational Integrity**: Cross-reference BOL numbers seamlessly between shipment tables, client ledger accounts, and invoices.

## 4. Invoice & Fee Demarcation
- **Fee Segregation**: Demarcate Freight, Demurrage/Detention, and Documentation Fees with accurate currency distinctions (USD vs. AFN).
- **Exchange Rates**: Any multi-currency conversions must explicitly declare the applied exchange rate and preserve base currency records.

## 5. Bilingual & RTL Support
- **Labels & Formatting**: Maintain English and Pashto / Dari label mapping across all financial statements, invoices, and print sheets.
- **Directionality**: Apply `dir="rtl"` and appropriate typography when rendering Pashto/Dari text columns.

## 6. Data Integrity & Persistence
- **Atomic Operations**: Always write local JSON snapshots (`.local-*.json`) atomically to prevent file corruption during concurrent operations or background syncs.

## 7. Python Virtual Environment & Dependency Standards
- **Explicit Virtual Environment**: All scripts, tests, background services, and CLI tools must execute strictly via `.venv\Scripts\python.exe` (Windows) or `.venv/bin/python` (Unix). Never invoke global `python` or `python3`.
- **Prohibited Global Pip**: Global `pip install` is strictly prohibited. All packages must be installed directly through `.venv\Scripts\pip.exe`.
- **State Preservation**: Whenever dependencies are installed, updated, or removed, `.venv\Scripts\pip.exe freeze` must update `requirements.txt` to guarantee reproducible builds.
- **Reactive Probing**: Environment probing is performed only when resolving missing packages (`ModuleNotFoundError`) or upon explicit request.

## 8. Automatic Version Control & Release Workflow (MANDATORY)
- **Single Source of Truth**: `lib/config/system-version.ts` (UI-facing) + `package.json` (tooling). All displays (Settings, About, loading badge, logs, docs, release manifest) must read from or be synced with these — never hardcode version strings elsewhere.
- **Single Writer**: All version mutations go through `node scripts/version-control.cjs` (`status` | `detect` | `release` | `verify` | `history` | `revalidate` | `revert --last`). Never hand-edit version fields across files.
- **One Increment Per Release**: Group all changes of a task into ONE release. Classify by overall impact, not file count: fixes/UI polish → `--type patch`; new features/modules/db migrations → `--type minor`; breaking/architectural changes → `--type major`. No actual software change → no increment.
- **Build Identifiers**: Generated from the actual release date as `YYYY.MM.DD-PRO`; same-day rebuilds append `-2`, `-3`, … Release records append to `release-history.json` (never overwritten).
- **Required End-of-Task Workflow**: (1) `status` → inspect current version; (2) review the task's changes; (3) `detect` for a classification suggestion; (4) `release --type <patch|minor|major> --title "..." --feature ... --fixed ...`; (5) let it run validation (typecheck + tests); (6) report the final version in the SOFTWARE UPDATE REPORT format. Only claim SUCCESS for builds that actually ran and passed — otherwise report the status as pending/failed.
- **Git Safety**: The release script never commits or pushes. Only tag with `--tag` on explicit authorization, and an existing tag is never overwritten. Unrelated user modifications are preserved.
- **Failure Safety**: If validation fails, the script preserves the previous version metadata (backup under `scratch/version-control-backups/`) and offers `revert --last`. Never reset databases or delete user data during a version update.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
