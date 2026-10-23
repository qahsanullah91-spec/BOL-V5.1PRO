---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Codebase Structure

**Analysis Date:** 2026-10-23

## Directory Layout

```
BOL-SOFTWARE-V5/
├── .agents/                    # Agent customizations, workflows, skills, and project rules
│   ├── rules/                  # Coding standards, data safety, accounting invariance
│   └── skills/                 # bol-ledger-workflow, sky-ariana-ops, qa-and-deployment
├── .planning/                  # GSD planning directory (codebase maps, requirements, roadmaps)
├── app/                        # Next.js 15 App Router
│   ├── api/                    # Server API route handlers
│   │   ├── health/             # Heartbeat & connectivity probe
│   │   ├── sync/               # Cloud sync & transfer code endpoints
│   │   └── system/update/      # Windows updater & process termination API
│   ├── layout.tsx              # Root HTML & body structure with global CSS
│   └── page.tsx                # Main SPA orchestrator and tab router
├── build/                      # Build assets & NSIS custom installer scripts
│   └── installer.nsh           # NSIS process kill shield for seamless in-place updates
├── components/                 # React 19 UI Components
│   ├── accounting/             # Customer/supplier ledgers, statements, vouchers
│   ├── bill-of-lading/         # BOL Editor, print preview, multi-modal routing
│   ├── invoice/                # Commercial invoice builder, fee demarcation
│   ├── reports/                # Saved BOL reports, Detailed Report Table, Print Studio
│   ├── settings/               # System settings, backup/restore, software updates
│   ├── sync/                   # Cloud synchronization modals & status badges
│   ├── treasury/               # Enterprise Treasury, cash/bank accounts, FX exchanges
│   ├── ui/                     # Primitives (Radix / Shadcn components)
│   └── warehouse/              # Inventory LOT management, WHR receipts, gate passes
├── electron/                   # Electron 34 Desktop Runtime
│   ├── desktop-api.d.ts        # Typed TypeScript declarations for window.skyDesktop
│   ├── ipc/                    # IPC channel registrations
│   ├── main.ts                 # Main Electron process, window management, registry tweaks
│   └── preload.ts              # Secure contextBridge exposure
├── lib/                        # Shared Business Logic & Infrastructure
│   ├── client/                 # Client singletons (online-save-manager, hooks)
│   ├── config/                 # System version, release metadata, constants
│   ├── reports/                # Report query parsers, aggregators, filters
│   ├── services/               # Storage services (blob-db, local-storage, invoice-storage)
│   ├── sync/                   # Delta sync queue, cryptographic transfer code helpers
│   ├── types/                  # TypeScript interface definitions (BOL, invoice, treasury)
│   └── utils/                  # Formatting, date parsing (Persian/Gregorian), WhatsApp
├── public/                     # Static public assets (watermarks, icons, sounds)
├── tests/                      # Automated unit and integration test suites (.test.cjs)
├── package.json                # Dependencies, scripts, and electron-builder NSIS config
├── tsconfig.json               # Next.js TypeScript strict compiler configuration
└── tsconfig.electron.json      # Electron TypeScript compiler configuration
```

## Key File Locations

| Purpose | File Path |
|---|---|
| **System Version & Changelog** | `lib/config/system-version.ts` |
| **Crash-Proof Atomic JSON Engine** | `lib/services/blob-db.ts` |
| **Online Save & Queue Manager** | `lib/client/online-save-manager.ts` |
| **Electron Main Process** | `electron/main.ts` |
| **Electron Preload Bridge** | `electron/preload.ts` |
| **Electron IPC Handlers** | `electron/ipc/register-ipc.ts` |
| **NSIS Update Lock Shield** | `build/installer.nsh` |
| **Print Preview Studio** | `components/reports/report-print-preview-modal.tsx` |
| **Detailed Report Table** | `components/reports/detailed-report-table.tsx` |
| **BOL Master Editor** | `components/bill-of-lading/bol-editor.tsx` |
| **WhatsApp Formatter** | `lib/utils/bol-whatsapp-formatter.ts` |
| **Enterprise Treasury Engine** | `components/treasury/treasury-tab.tsx` |
| **Core Test Suite Runner** | `tests/accounting-invariance.test.cjs` |

## Naming & File Conventions

- **React Components**: `kebab-case.tsx` (e.g., `report-print-preview-modal.tsx`)
- **Utility & Service Modules**: `kebab-case.ts` (e.g., `online-save-manager.ts`)
- **Test Files**: `kebab-case.test.cjs` using native `node:test` and `node:assert/strict`
- **Data Snapshots**: `.local-<entity>.json` (e.g., `.local-bols.json`, `.local-invoices.json`)
- **Custom Browser Events**: Namespaced as `skybol:<event-name>` (e.g., `skybol:online-sync-complete`)

---

*Structure analysis: 2026-10-23*
*Update after moving or reorganizing directory structures*
