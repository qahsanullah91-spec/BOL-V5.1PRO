---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Architecture Overview

**Analysis Date:** 2026-11-13

## Architectural Pattern

**Local-First Hybrid Desktop & Web Application with Dual Multi-Modal Document Generation**
Sky Ariana BOL utilizes a local-first, event-driven architecture designed to operate seamlessly in both a standalone offline Windows desktop environment (via Electron 41) and an enterprise cloud environment (Next.js 16 on Google Cloud Run or Vercel). Data is persisted locally with atomic guarantees, while background synchronization protocols replicate deltas across devices.

```
┌────────────────────────────────────────────────────────┐
│                   Desktop Shell                        │
│     Electron 41 (Main Process, Preload, Windows IPC)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                Presentation Layer                      │
│     Next.js 16 App Router + React 19 Client UI         │
│  - BOL Master Editor (8-tab responsive navigation)     │
│  - Interactive A4 Print Preview Studio                 │
│  - ACCI Commercial Invoice & Packing List Views        │
│  - Account Ledgers & Financial Statements              │
│  - Treasury & Multi-Currency Cash/Bank Books           │
│  - Multi-Device Cloud Sync Hub                         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            Domain & Business Engine Layer              │
│  - Accounting Invariance Identity Engine               │
│  - ACCI Document Synthesis (Docx & Vector PDF)         │
│  - Multi-Modal Afghan Transit Routing Engine           │
│  - Gemini AI Structured Extractor & Auditing           │
│  - WhatsApp Multilingual Dispatch Formatter            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Persistence & Storage Layer                │
│  - Atomic Crash-Proof Storage Engine (blob-db.ts)      │
│  - Local JSON Production Databases (.local-*.json)     │
│  - GCS Automated Snapshot Backup System                │
│  - Delta Sync Queue & Cloud Relay (api/sync)           │
└────────────────────────────────────────────────────────┘
```

## Architectural Layers

### 1. Presentation Layer (React 19 & Next.js 16 App Router)

- **BOL Master Navigation Suite (`components/bill-of-lading/bol-editor.tsx`)**:
  Manages the 8 primary tabs in strict chronological order:
  `[BOL Editor]` -> `[A4 Preview]` -> `[Saved BOLs]` -> `[Packing List]` -> `[Invoice]` -> `[Files]` -> `[Account Ledger]` -> `[BOL Settings]`
- **ACCI Document Suite**:
  - `components/bill-of-lading/commercial-invoice-view.tsx`: Side-by-side 2-column chamber layout, centered `Total Amount Say: USD:`, centered `(Origin Afghanistan)`, solid rectangular outer border box around chamber fee details, `TOTAL C&F`, and unbroken `SKY ARIANA LTD` signature stamp.
  - `components/bill-of-lading/packing-list-view.tsx`: Dual layout mode ("Classic" 3-column chamber layout matching authentic reference and "Matching Invoice" mode), vertical and horizontal center alignment for `(Origin Afghanistan)` and `SKY ARIANA LTD`.
- **A4 Preview & Report Studio (`components/bill-of-lading/a4-preview.tsx`)**:
  Accurate A4 proportions, dynamic zoom, auto-adjust dense layout, security watermarks, and optical-balanced signature block.
- **Financial Statements & Treasury (`components/accounting/`, `components/treasury/`)**:
  Running statements, invoice and fee demarcation (Freight, Demurrage, Documentation in USD and AFN), multi-currency vouchers.

### 2. Domain & Business Engine Layer

- **Accounting Invariance Engine**:
  Enforces the mathematical identity across all financial modules:
  $$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$
  Transactions are sorted in ascending chronological sequence; balance drift is blocked at save and backup time.
- **ACCI OpenXML Word & Vector PDF Engine**:
  - `lib/utils/acci-document-generator.ts`: Pure domain mapper transforming BOL form state into ACCI invoice and packing list data models, with Solar Hijri (Shamsi) date calculations.
  - `lib/utils/acci-word-generator.ts`: Direct OpenXML DOCX generator using `fflate` compression with Cambria font, exact tables, and custom margins.
  - `lib/utils/acci-pdf-generator.ts`: Vector PDF generator utilizing `jspdf` for razor-sharp vector output.
- **Google Gemini AI Extractor (`lib/ai/ai-provider.ts`)**:
  Extracts structured logistics data from text and WhatsApp messages, with schema verification and fallback to offline parsing.

### 3. Desktop Bridge Layer (Electron IPC)

- Mediates between Next.js frontend and Windows OS.
- `electron/preload.ts`: Exposes typed `window.skyDesktop` bridge.
- `electron/ipc/register-ipc.ts`: Native A4 vector printing, printer discovery, NSIS auto-updates, registry optimization.

### 4. Persistence & Storage Layer

- **Atomic Storage Engine (`lib/services/blob-db.ts`)**:
  Guarantees zero file corruption via serialized file operation queues, temporary staging, `.bak` snapshot generation, and atomic rename.
- **Automated GCS Backup Pipeline (`scripts/gcs-automated-backup.cjs`)**:
  Periodically packages all 64 production stores into gzip archives (`data/backups/gcs-snapshots/`), validates accounting invariance, and syncs to Google Cloud Storage.

## Key Entry Points

- **Electron Desktop Entry**: `electron/main.ts`
- **Web Application Entry**: `app/page.tsx`
- **Application Layout**: `app/layout.tsx`
- **AI Structured Extraction**: `app/api/ai/structured-extract/route.ts`
- **Cloud Sync API**: `app/api/sync/route.ts`
- **Health Probe API**: `app/api/health/route.ts` (port 3001)

---

*Architecture analysis: 2026-11-13*
*Update after structural or architectural refactoring*
