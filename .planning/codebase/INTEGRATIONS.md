---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# External Integrations

**Analysis Date:** 2026-10-23

## Storage & Data Persistence

**Local-First JSON Database Engine:**
- Architecture: Crash-proof atomic file operations with automatic `.bak` backups and serialized write queues
- Module: `lib/services/blob-db.ts`
- Persistence Files:
  - `.local-bols.json` - Bills of Lading records, multi-modal routes, cargo and driver metadata
  - `.local-account-ledgers.json` - Customer and party financial ledger entries
  - `.local-bol-account-ledgers.json` - Shipment-specific ledger relations
  - `.local-invoices.json` - Commercial invoices and fee breakdowns
  - `.local-full-snapshot.json` - Comprehensive multi-table backup snapshot
  - `.local-treasury.json` - Enterprise treasury accounts, cash/bank vouchers, and currency exchanges
  - `.local-warehouse.json` - Warehouse receipts, lot inventory, damages, and gate passes

**Cloud Storage (Optional / Serverless):**
- Provider: Vercel Blob Storage (`@vercel/blob`)
- Purpose: Remote cloud persistence when running in serverless environments
- Fallback: Local filesystem or OS temporary directory (`os.tmpdir()`)

## Desktop OS Integration (Electron Bridge)

**Process Architecture:**
- Electron Main Process: `electron/main.ts`
- Preload Bridge: `electron/preload.ts` (exposes typed `window.skyDesktop` API)
- IPC Handler Registry: `electron/ipc/register-ipc.ts`

**Key OS Capabilities:**
- **Native A4 Vector Printing**: `print:page` and `print:get-printers` query physical Windows printers and invoke Chromium vector printing.
- **Windows 11 Print Dialog Optimization**: Injects `PreferLegacyPrintDialog` and `PreferLaunchLegacyDialog` into `HKCU\Software\Microsoft\Print\UnifiedPrintDialog` to bypass the Windows 11 Chromium preview error.
- **In-Place NSIS Updater**: `updater:install` launches setup detached with process teardown (`taskkill /F /T`) to avoid file lock collisions.
- **File System & Dialogs**: Native save file dialogs, directory browsing, and backup export/import.

## Cloud Synchronization & Multi-Device Relay

**Online Save Manager:**
- Client Engine: `lib/client/online-save-manager.ts`
- Functions: Offline queueing, FIFO background draining, exponential retry backoff, and non-blocking cloud relays.
- Endpoints:
  - `/api/sync` - Multi-device cloud state synchronization
  - `/api/health` - Periodic connectivity probe
  - `/api/sync/transfer-code` - Ephemeral cryptographic transfer code pairing for zero-setup LAN/WAN sync

## Messaging & External Communication

**WhatsApp Logistics Dispatch:**
- Implementation: `lib/utils/bol-whatsapp-formatter.ts`
- Protocol: `wa.me/` URI scheme with UTF-8 URL encoding
- Capabilities:
  - Multilingual templates: English, Pashto, and Persian/Dari
  - Zero-Width Non-Joiner (`\u200C`) preservation for Afghan/Persian typography
  - Customer Safe Mode: Redacts sensitive internal driver financial metrics prior to customer dispatch

---

*Integrations analysis: 2026-10-23*
*Update after adding external services or APIs*
