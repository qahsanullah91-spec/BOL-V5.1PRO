---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Architecture Overview

**Analysis Date:** 2026-10-23

## Architectural Pattern

**Local-First Hybrid Desktop & Web Application**
Sky Ariana BOL utilizes a local-first, event-driven architecture designed to operate seamlessly in both a standalone offline Windows desktop environment (via Electron) and an optional hosted cloud environment (via Next.js on Vercel). Data is persisted locally with atomic guarantees, while background synchronization protocols replicate deltas across devices.

```
┌────────────────────────────────────────────────────────┐
│                   Desktop Shell                        │
│     Electron 34 (Main Process, Preload, Windows IPC)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                Presentation Layer                      │
│     Next.js 15 App Router + React 19 Client UI         │
│  - BOL Editor & Multi-Modal Routing                    │
│  - Interactive A4 Print Preview Studio                 │
│  - Account Ledgers & Financial Statements              │
│  - Treasury & Cash/Bank Management                     │
│  - Warehouse Inventory & Gate Pass Workflows           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            Domain & Business Engine Layer              │
│  - Accounting Invariance Identity Engine               │
│  - Multi-Currency Demarcation (USD, AFN, AED)          │
│  - Online Save & Background Sync Manager               │
│  - WhatsApp Bilingual Dispatch Formatter               │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Persistence & Storage Layer                │
│  - Atomic Crash-Proof Storage Engine (blob-db.ts)      │
│  - Local JSON Databases (.local-*.json) & Backups      │
│  - Delta Sync Queue & Cloud Relay (api/sync)           │
└────────────────────────────────────────────────────────┘
```

## Architectural Layers

### 1. Presentation Layer (React 19 & Next.js App Router)

- **Component Hierarchy**:
  - `components/bill-of-lading/`: BOL Editor, A4 preview scale, route stops, and document library
  - `components/reports/`: Saved BOL reports, Detailed Report Table, and vector Print Preview Studio
  - `components/accounting/`: Party ledgers, account statements, running balances, and print modals
  - `components/invoice/`: Commercial invoice creation, fee breakdowns, and PDF exports
  - `components/treasury/`: Multi-currency cash/bank books, payment vouchers (PV), receipt vouchers (RCPT)
  - `components/warehouse/`: Warehouse receiving (WHR), stock allocations, damage records, and outbound gate passes
  - `components/sync/`: Cloud sync modals, transfer code generators, and online status badges

### 2. Desktop Bridge Layer (Electron IPC)

- Mediates communication between web context and Windows operating system
- `electron/preload.ts`: Exposes secure `window.skyDesktop` bridge
- `electron/ipc/register-ipc.ts`: Registers handlers for native vector printing, printer discovery, PDF export, system updates, and process management

### 3. Domain & Business Engine Layer

- **Accounting Invariance**: Enforces the mathematical identity:
  $$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$
  All running balances are calculated in ascending chronological order.
- **Multi-Modal Route Engine**: Tracks origin, intermediate border stations (Islam Qala, Hairatan, Torghundi, Spin Boldak), sea ports (Bandar Abbas, Jebel Ali), and destination terminals.
- **Online Save Manager**: Singleton managing connectivity state, offline FIFO queues, exponential backoff, and background queue draining.

### 4. Persistence & Storage Layer

- Crash-proof JSON storage implemented in `lib/services/blob-db.ts`:
  1. Writes payload to a unique temporary file (`.tmp`)
  2. Creates a timestamped `.bak` copy of existing target
  3. Atomically replaces target file via `fs.promises.rename` with retry backoff for Windows locks
  4. Maintains bounded in-memory LRU cache (100 entries) and per-file serialized promise queues

## Key Entry Points

- **Electron Desktop Entry**: `electron/main.ts`
- **Web Application Entry**: `app/page.tsx`
- **Application Layout**: `app/layout.tsx`
- **System Update API**: `app/api/system/update/route.ts`
- **Cloud Synchronization API**: `app/api/sync/route.ts`
- **Health Probe API**: `app/api/health/route.ts`

---

*Architecture analysis: 2026-10-23*
*Update after structural or architectural refactoring*
