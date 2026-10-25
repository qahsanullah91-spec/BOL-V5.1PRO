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
- **Live Business Data**: Root `.local-*.json` files (`.local-bols.json`, `.local-account-ledgers.json`, `.local-bol-account-ledgers.json`, `.local-invoices.json`, `.receipt-counter`, `.treasury-*-counter`, …) are real production records. Never delete, reset, re-seed, or bulk-reformat them. Audit with `node scripts/verify-data-integrity.cjs` or the `bol-ledger-workflow` skill CLI.

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

## 9. Repository Map & Stack
- **Stack**: Next.js 16 (App Router, webpack dev) + React 19 + TypeScript strict + Tailwind CSS v4 + Radix/Shadcn (27 primitives in `components/ui/`); Electron 41 desktop shell (`main`: `dist-electron/main.js`).
- **Key directories**: `app/` (routes + `globals.css` — the live stylesheet), `components/` (feature suites; `components/bill-of-lading/` is the core BOL module), `lib/` (types, services, utils, `lib/config/system-version.ts`), `electron/` (main process, `ipc/`, `services/`), `scripts/` (SQL migrations `001_*.sql`–`013_*.sql`, version-control, build/QA tooling), `tests/` (121 `node:test` `.test.cjs` suites), `docs/`.
- **Commands**: `npm run dev` (port 3001) · `npm run electron:dev` · `npm run typecheck` (both app + electron tsconfigs) · `npm test` (`node --test --test-concurrency=1 tests/*.test.cjs` + typecheck) · `npm run lint` (eslint, 0 warnings) · `npm run qa` · `npm run release:win` (Windows installer pipeline).
- **Docs to read before sensitive changes**: `docs/DATA-ARCHITECTURE.md`, `docs/TESTING.md`, `docs/RELEASE_AND_ROLLBACK_GUIDE.md`, `docs/BUILD-WINDOWS.md`.

## 10. Test Suite Convention — Source-Assertion Tests
- Most `tests/*.test.cjs` suites are `node:test` scripts that read component/CSS **source text and regex-assert on it** (class names, handler props, CSS properties, media queries) — they do not execute the UI.
- Consequence: renaming a CSS class, handler prop, or markup string can fail tests with **no runtime error**. After editing toolbar/editor/dashboard markup or `globals.css`, run the matching suites (e.g. `tests/a4-preview-toolbar-layout-fit.test.cjs`, `tests/bol-editor-toolbar-responsive.test.cjs`, `tests/responsive-layout-system.test.cjs`) or the full `npm test`.
- Always run with `--test-concurrency=1` (the suites share local JSON snapshots).

## 11. Runtime & Environment Gotchas
- **Port 3001 only**: `next dev`/`next start` and `electron:dev` (via `wait-on`) hardcode port 3001. Port 3000 hosts a different application on this machine — never use it.
- **Printing**: never fake print output with CSS visibility tricks. Print flows must clone content into the whitelisted print root and set `data-print-active` (see `print-safe-bol.tsx`, ledger/invoice print components) — otherwise output is blank.
- **Hidden-window rendering**: `html-to-image` `toCanvas` and `yieldToPaint` (rAF-based) **hang when the Electron window is hidden** (e.g., background PDF generation). Use `toSvg` + a manual `Image` loader with a timeout cap instead.
- **Tailwind glob poisoning**: junk filenames containing braces crash `next build` during Tailwind's glob scan; `scripts/check-tailwind-glob-safety.cjs` guards this — keep it in prebuild flows.
- **BOL editor toolbar CSS** (`.bol-editor-toolbar` in `app/globals.css`): must **wrap, never clip** — no `nowrap` + hidden/`auto` horizontal scroll at any breakpoint; `.toolbar-group-nav-appearance` must wrap below 1024px. Source-assertion tests enforce this.
- **Dev auth**: admin login in dev is seeded via `sessionStorage`; the IAB (in-app browser) tab stays hidden.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
