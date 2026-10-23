# Development & Architecture Guide

This guide describes the architecture, software patterns, accounting rules, and engineering standards for **AQ COMPANIES (Sky Ariana BOL)**.

---

## 1. Technology Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Runtime**: Node.js v20+ / Electron Desktop Runtime
- **Type System**: TypeScript in Strict Mode (zero implicit `any`)
- **Styling**: Tailwind CSS + Radix UI Primitives + Lucide Icons
- **Data Persistence**: Local JSON snapshots (`.local-*.json`) + SQLite (`aq_companies.db`)
- **Process Orchestration**: Electron IPC bridge with background Python microservices

---

## 2. Workspace Organization

```text
BOL-SOFTWARE-V5/
├── app/                        # Next.js App Router
│   ├── api/                    # Server Route Handlers (update, sync, backup)
│   ├── layout.tsx              # Root HTML layout with RTL/LTR theme provider
│   └── page.tsx                # Main single-page application dashboard
├── components/                 # React 19 UI Components
│   ├── accounting/             # Account ledgers, statements, vouchers
│   ├── bill-of-lading/         # BOL Editor, A4 preview, stamp/signature blocks
│   ├── invoice/                # Commercial invoice generation & print sheets
│   ├── reports/                # Report tables, Print Preview Studio, filters
│   ├── settings/               # System updater, cloud sync, general config
│   └── sync/                   # Online/offline sync status badge
├── electron/                   # Electron Desktop Architecture
│   ├── ipc/                    # Modular IPC handlers (print, updater, fs, app)
│   ├── main.ts                 # Main process lifecycle and window management
│   └── preload.ts              # Context bridge exposing safe desktop APIs
├── lib/                        # Core Domain & Business Logic
│   ├── client/                 # OnlineSaveManager, offline queues, hooks
│   ├── config/                 # System versioning & release constants
│   ├── services/               # Ledger calculation, storage, and export engines
│   ├── types/                  # TypeScript interfaces (BOL, Invoice, Ledger)
│   └── utils/                  # Date conversion, WhatsApp formatting, route parsing
├── tests/                      # Automated regression test suites (node:test)
└── docs/                       # Architectural and operational documentation
```

---

## 3. Core Accounting Invariance Identity

All financial calculations, ledger views, print statements, and PDF exports must strictly preserve the following mathematical identity:

$$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$

### Invariance Rules:
1. **Chronological Ordering**: Running balances must be calculated in ascending order by transaction date.
2. **Multi-Currency Demarcation**:
   - Freight and Documentation revenues are denominated in **USD**.
   - Driver rents and domestic transport costs are denominated in **AFN** or **AED**.
   - Currencies must never be blended or summed into a single figure without explicit exchange rate declaration.

---

## 4. Multi-Modal Bill of Lading (BOL) Standards

Every BOL document must preserve full metadata integrity across international corridors:

- **Origin & Route Borders**: Islam Qala, Torghundi, Hairatan, Spin Boldak, Nimroz, Dogharoun / Dougharoun, Bandar Abbas, Karachi, and Chabahar.
- **Driver Information**: Driver name, father name, Afghan license plate, and driver rent.
- **Cargo Quantities**: Carton count, package type, gross weight (KG), and net weight (KG).
- **Relational Integrity**: Cross-reference BOL numbers seamlessly across shipment records, invoices, and ledger accounts.

---

## 5. Resilient Online Save & Offline Synchronization

The application features a resilient offline-first architecture via [`OnlineSaveManager`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/lib/client/online-save-manager.ts):

- **Automatic Network Detection**: Listens to browser network transitions (`online`, `offline`), window focus, and background heartbeat pings.
- **FIFO Queue Draining**: When network connectivity is restored, pending document saves are drained in chronological FIFO order.
- **Unrecoverable Error Eviction**: HTTP 4xx client errors (excluding 408/429) or records exceeding 5 retries are evicted from the queue to prevent infinite retry loops on malformed payloads.
- **Cross-Component Events**: Dispatches `skybol:online-sync-queued`, `skybol:online-sync-complete`, and `skybol:documents-updated` custom events.

---

## 6. Bilingual Typography & RTL Support

- **Pashto & Dari Typography**: Maintain English and Pashto / Dari label mapping across invoices, A4 previews, and financial statements.
- **Directionality**: Apply `dir="rtl"` to RTL container elements.
- **Zero Width Non-Joiner (ZWNJ)**: Preserve Persian typographic ZWNJ characters (`\u200C`) in Persian text (e.g. `حمل‌ونقل بین‌المللی`) to prevent disjointed word rendering.
