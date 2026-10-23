---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Areas of Concern & Technical Debt

**Analysis Date:** 2026-10-23

## Known Technical Debt & Platform Nuances

### 1. Windows PowerShell Execution Policy Restrictions

- **Issue**: Default Windows PowerShell script execution policy blocks executing `npm.ps1` (`SecurityError / UnauthorizedAccess`).
- **Mitigation**: Always run npm commands via `cmd /c "npm ..."` or invoke Node directly (`node --test ...`).
- **Status**: Documented and mitigated across local workflow scripts.

### 2. Windows In-Place Process & File Locking

- **Issue**: Windows operating system strictly locks `.exe` and `.dll` binaries in `Program Files` while processes are running. NSIS installers historically raised *"AQ COMPANIES cannot be closed"* error dialogs during automatic updates.
- **Mitigation**:
  - Implemented `build/installer.nsh` with `customCheckAppRunning` and `customInit` macros executing `taskkill /F /T /IM "AQ COMPANIES.exe"` and `taskkill /F /T /IM "aq-backend.exe"`.
  - Added delayed detached installer launcher in `electron/ipc/register-ipc.ts` with immediate application exit.
- **Monitoring**: Verify that automatic updates on Windows 10/11 machines complete without manual Task Manager intervention.

### 3. Multi-PC LAN & Offline Editing Conflicts

- **Issue**: Multiple logistics coordinators may edit the same BOL or account ledger entries concurrently across different office terminals without an active internet connection.
- **Mitigation**:
  - `OnlineSaveManager` provides offline FIFO queueing and auto-drain with 4xx error eviction.
  - Delta synchronization engine (`lib/sync/sync-queue.ts`) records field-level modifications and resolves non-overlapping edits.
  - Ephemeral transfer codes allow point-to-point snapshot synchronization without cloud infrastructure.

### 4. Dual Runtime Target Compatibility (Desktop vs Web)

- **Issue**: Features relying on Electron native modules (`window.skyDesktop.print`, `window.skyDesktop.getPrinters`, file system dialogs) are unavailable when the application is accessed as a web application via Vercel or standard browsers.
- **Mitigation**: All native desktop bridge calls must maintain defensive checks:
  `if (typeof window !== "undefined" && window.skyDesktop?.print) { ... } else { window.print() }`

### 5. Memory Management with Growing Ledger Snapshots

- **Issue**: Local JSON files (`.local-bols.json`, `.local-account-ledgers.json`) grow continuously as hundreds of new shipments are created each quarter.
- **Mitigation**:
  - `lib/services/blob-db.ts` enforces a bounded LRU memory cache capped at 100 entries (`MAX_CACHE_ENTRIES = 100`).
  - Report tables implement client-side pagination and lazy rendering to preserve 60fps UI performance.

---

*Concerns analysis: 2026-10-23*
*Update as technical debt is resolved or new concerns arise*
