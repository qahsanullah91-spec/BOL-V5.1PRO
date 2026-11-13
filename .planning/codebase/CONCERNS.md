---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Areas of Concern & Technical Debt

**Analysis Date:** 2026-11-13

## Runtime & Environment Gotchas

### 1. Port 3001 Hardcoding & Port 3000 Collision

- **Issue**: `next dev`, `next start`, and `electron:dev` (via `wait-on`) hardcode port 3001. Port 3000 hosts a different service on this developer workstation.
- **Rule**: Never change the development or production server port to 3000. All health checks, Electron URLs, and test requests must strictly target `http://localhost:3001`.

### 2. Hidden-Window Rendering in Electron

- **Issue**: Libraries like `html-to-image` (`toCanvas`) and `yieldToPaint` (based on `requestAnimationFrame`) **hang indefinitely when the Electron window is hidden** (e.g. during background PDF generation or headless tasks).
- **Mitigation**: Use `toSvg` plus a manual `Image` loader with a timeout cap instead of `toCanvas` or rAF loops.

### 3. Tailwind Glob Scanning Safety

- **Issue**: Temporary files or scrap files with curly braces or junk patterns in their names crash `next build` during Tailwind's glob scanning phase.
- **Mitigation**: `scripts/check-tailwind-glob-safety.cjs` guards this in prebuild and release workflows. Maintain clean workspace naming.

### 4. BOL Editor Toolbar CSS Wrapping

- **Issue**: The `.bol-editor-toolbar` in `app/globals.css` must wrap and never clip or use `overflow-x: auto / hidden` at any breakpoint. `.toolbar-group-nav-appearance` must wrap below 1024px. Source-assertion tests strictly enforce this.

### 5. Windows In-Place Process & File Locking

- **Issue**: Running Electron and Node background processes lock executable binaries, causing NSIS installers to fail if instances remain active during updates.
- **Mitigation**:
  - `build/installer.nsh` executes `taskkill /F /T /IM "AQ COMPANIES.exe"` and `taskkill /F /T /IM "electron.exe"`.
  - `electron/ipc/register-ipc.ts` implements delayed detached installer execution.

## Data Persistence & Concurrency Concerns

### 6. Live Business Data Protection

- **Issue**: Root `.local-*.json` files (`.local-bols.json`, `.local-account-ledgers.json`, `.local-ledger-system.json`, `.local-invoices.json`, etc.) contain real production records.
- **Mitigation**:
  - Direct deletion, resetting, or re-seeding is strictly prohibited.
  - All writes must go through the atomic temporary file staging in `lib/services/blob-db.ts`.
  - Automated daily snapshots are compressed and stored in `data/backups/gcs-snapshots/` via `scripts/gcs-automated-backup.cjs`.

### 7. Source-Assertion Test Fragility

- **Issue**: Modifying class names, prop names, or markup strings in toolbars or views can break source-assertion tests (`tests/*.test.cjs`) without causing runtime syntax or TypeScript errors.
- **Mitigation**: Always run `node tests/<matching-test>.test.cjs` or full `npm test` after modifying UI layout or CSS.

---

*Concerns analysis: 2026-11-13*
*Update as technical debt is resolved or new concerns arise*
