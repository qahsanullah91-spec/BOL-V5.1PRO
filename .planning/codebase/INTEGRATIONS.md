---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# External Integrations

**Analysis Date:** 2026-11-13

## Storage & Data Persistence

**Local-First JSON Database Engine:**
- Architecture: Crash-proof atomic write operations (`.tmp` write -> `.bak` preservation -> atomic rename with exponential lock backoff)
- Core Service: `lib/services/blob-db.ts`
- Primary Production Stores:
  - `.local-bols.json` - 284 production Bills of Lading records, multi-modal routing, and cargo weights
  - `.local-shipments.json` - 288 shipment operational records and statuses
  - `.local-accounts.json` - 92 client and supplier enterprise entities
  - `.local-ledger-system.json` - Master accounting ledger system (40+ accounts, 1,300+ transactions)
  - `.local-account-ledgers.json` & `.local-bol-account-ledgers.json` - Financial ledger relations
  - `.local-invoices.json` - Invoices and fee breakdowns
  - `.local-treasury-*.json` - Treasury accounts, cash/bank journals, and FX conversions
  - Counter tokens: `.receipt-counter`, `.treasury-*-counter`, `.local-bol-sequence.json`

**Cloud Storage & Remote Synchronization:**
- **Google Cloud Storage (GCS)**:
  - Integration: `scripts/gcs-automated-backup.cjs`
  - Bucket: `gs://sky-ariana-backups/snapshots/`
  - Capabilities: Pre-snapshot accounting invariance audit, SHA-256 fingerprinting, `.json.gz` compression, and automated GCS sync
- **Multi-Device Cloud Sync Relay**:
  - Integration: `lib/client/online-save-manager.ts` and `components/bill-of-lading/cloud-sync-modal.tsx`
  - Endpoints: `/api/sync`, `/api/health`, `/api/sync/transfer-code`
  - Security: Cryptographic transfer codes (`.local-sync-codes.json`) for peer-to-peer device pairing without public database exposure

## Artificial Intelligence & Document Extraction

**Google Gemini API Platform:**
- Service: `lib/ai/ai-provider.ts`
- Router: `app/api/ai/structured-extract/route.ts`
- Primary Model: `gemini-3.8-flash` (with automated model normalization)
- Capabilities:
  - Multi-modal extraction of consignee, shipper, Afghan transit stations (Islam Qala, Torghundi, Hairatan, Spin Boldak), driver, and rent
  - Strict OpenAPI/JSON schema adherence (`lib/ai/schemas/bol-schema.ts`)
  - Sanctions compliance screening and dual-use cargo verification
  - Comprehensive accounting audit mode (`runComprehensiveVerification`)
  - Offline Fallback: Deterministic WhatsApp parser (`lib/services/whatsapp-parser.ts`)

## Desktop OS Integration (Electron Bridge)

**Architecture:**
- Main Process: `electron/main.ts`
- Preload Bridge: `electron/preload.ts` (exposes typed `window.skyDesktop` API)
- IPC Handler Registry: `electron/ipc/register-ipc.ts`

**Key OS Capabilities:**
- **Native Vector Printing**: Direct A4 printing to Windows printers via Chromium print API
- **Windows 11 Print Dialog Optimization**: Injects `PreferLegacyPrintDialog` into registry (`HKCU\Software\Microsoft\Print\UnifiedPrintDialog`) to bypass Windows 11 Chromium preview crash
- **In-Place NSIS Updater**: `updater:install` launches setup detached with process teardown (`taskkill /F /T`) to eliminate file locks
- **Native File Dialogs**: Vector PDF save dialogs, backup archive imports/exports

## Messaging & External Communication

**WhatsApp Logistics Dispatch:**
- Implementation: `lib/utils/bol-whatsapp-formatter.ts`
- Protocols: Direct `wa.me/` URI generation with UTF-8 encoding
- Features: Multilingual templates (English, Pashto, Persian/Dari), Zero-Width Non-Joiner (`\u200C`) preservation, Customer Safe Mode (redacts driver cost margins)

---

*Integrations analysis: 2026-11-13*
*Update after adding external services or APIs*
