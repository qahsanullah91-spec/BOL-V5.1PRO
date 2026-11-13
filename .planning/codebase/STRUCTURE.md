---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Codebase Structure

**Analysis Date:** 2026-11-13

## Directory Layout

```
BOL-SOFTWARE-V5/
├── .agents/                    # Agent rules, workflows, skills, and project configurations
│   ├── rules/                  # coding-standards, data-safety-and-sync, python-dependencies
│   └── skills/                 # bol-ledger-workflow, sky-ariana-ops, qa-and-deployment
├── .planning/                  # GSD planning directory (codebase maps, requirements, roadmaps)
│   └── codebase/               # 7 structured codebase mapping documents
├── app/                        # Next.js 16 App Router
│   ├── api/                    # Server API route handlers
│   │   ├── ai/structured-extract/ # Gemini AI logistics extractor & audit endpoint
│   │   ├── health/             # Heartbeat & connectivity probe (port 3001)
│   │   ├── server/backups/     # Central backup creation & download
│   │   ├── sync/               # Multi-device cloud sync & transfer codes
│   │   └── system/update/      # Windows updater & process termination API
│   ├── globals.css             # Live CSS stylesheet, Tailwind v4 theme, print rules
│   ├── layout.tsx              # Root HTML & body structure with global CSS
│   └── page.tsx                # Main SPA orchestrator and tab router
├── build/                      # Build assets & NSIS custom installer scripts
│   └── installer.nsh           # NSIS process kill shield for seamless in-place updates
├── components/                 # React 19 UI Components
│   ├── accounting/             # Customer/supplier ledgers, statements, vouchers
│   ├── backup/                 # Data protection cards, backup history, automatic backups
│   ├── bill-of-lading/         # BOL Editor, ACCI Invoice & Packing List views, A4 preview
│   ├── reports/                # Saved BOL reports, Detailed Report Table, Print Studio
│   ├── settings/               # System settings, backup/restore, software updates
│   ├── sync/                   # Cloud synchronization modals & status badges
│   ├── treasury/               # Enterprise Treasury, cash/bank accounts, FX exchanges
│   ├── ui/                     # 27 Radix / Shadcn primitives
│   └── warehouse/              # Inventory LOT management, WHR receipts, gate passes
├── docs/                       # Architectural guides and deployment specifications
│   ├── GOOGLE_CLOUD_DEPLOYMENT.md # Cloud Run, Cloud SQL, and GCS deployment architecture
│   ├── DATA-ARCHITECTURE.md    # Local-first persistence specifications
│   ├── TESTING.md              # Test suite conventions and execution protocols
│   └── RELEASE_AND_ROLLBACK_GUIDE.md # Production release and version control rules
├── electron/                   # Electron 41 Desktop Runtime
│   ├── desktop-api.d.ts        # Typed TypeScript declarations for window.skyDesktop
│   ├── ipc/                    # IPC channel registrations (printing, updater, dialogs)
│   ├── main.ts                 # Main Electron process, window management, registry tweaks
│   └── preload.ts              # Secure contextBridge exposure
├── lib/                        # Shared Business Logic & Infrastructure
│   ├── ai/                     # Gemini AI provider abstraction, schemas, verification
│   ├── backup/                 # Central backup collector, manifest, scheduler, retention
│   ├── client/                 # Client singletons (online-save-manager, hooks)
│   ├── config/                 # system-version.ts (Single Source of Truth)
│   ├── services/               # Storage services (blob-db.ts, local-storage)
│   ├── sync/                   # Delta sync queue, cryptographic transfer code helpers
│   ├── types/                  # TypeScript interface definitions (BOL, ACCI, treasury)
│   └── utils/                  # ACCI docx/pdf generators, Shamsi dates, WhatsApp formatter
├── public/                     # Static public assets (watermarks, logos, sounds)
├── scratch/                    # Intermediate test outputs and sample exports
│   └── acci-exports/           # Generated sample ACCI Invoice & Packing List docx/pdf files
├── scripts/                    # Automation, database migrations, and QA tooling
│   ├── gcs-automated-backup.cjs # Automated GCS snapshot backup pipeline
│   ├── generate-acci-sample-exports.ts # Sample ACCI export generator
│   ├── verify-data-integrity.cjs # Pre-merge data integrity audit
│   └── version-control.cjs     # Single Writer Rule 8 versioning pipeline
├── tests/                      # 121 automated test suites (1,030+ tests in .test.cjs)
├── package.json                # Dependencies, scripts, and electron-builder NSIS config
├── tsconfig.json               # Next.js TypeScript strict compiler configuration
└── tsconfig.electron.json      # Electron TypeScript compiler configuration
```

## Key File Locations

| Purpose | File Path |
|---|---|
| **System Version & Changelog** | `lib/config/system-version.ts` |
| **Crash-Proof Atomic JSON Engine** | `lib/services/blob-db.ts` |
| **ACCI Invoice Interactive View** | `components/bill-of-lading/commercial-invoice-view.tsx` |
| **ACCI Packing List View** | `components/bill-of-lading/packing-list-view.tsx` |
| **ACCI OpenXML Word Generator** | `lib/utils/acci-word-generator.ts` |
| **ACCI Vector PDF Generator** | `lib/utils/acci-pdf-generator.ts` |
| **GCS Automated Backup Pipeline** | `scripts/gcs-automated-backup.cjs` |
| **Gemini AI Structured Extractor** | `app/api/ai/structured-extract/route.ts` |
| **Electron Main Process** | `electron/main.ts` |
| **Electron Preload Bridge** | `electron/preload.ts` |
| **Electron IPC Handlers** | `electron/ipc/register-ipc.ts` |
| **Single Writer Version Pipeline** | `scripts/version-control.cjs` |
| **Pre-Merge Integrity Audit** | `scripts/verify-data-integrity.cjs` |

## Naming & File Conventions

- **React Components**: `kebab-case.tsx` (e.g., `commercial-invoice-view.tsx`)
- **Utility & Service Modules**: `kebab-case.ts` (e.g., `acci-word-generator.ts`)
- **Automated Test Files**: `kebab-case.test.cjs` using native `node:test` and `node:assert/strict`
- **Data Snapshots**: `.local-<entity>.json` (e.g., `.local-bols.json`, `.local-ledger-system.json`)
- **Counter Tokens**: `.<name>-counter` (e.g., `.receipt-counter`, `.treasury-rcpt-counter`)
- **Custom Browser Events**: Namespaced as `skybol:<event-name>` (e.g., `skybol:online-sync-complete`)

---

*Structure analysis: 2026-11-13*
*Update after moving or reorganizing directory structures*
