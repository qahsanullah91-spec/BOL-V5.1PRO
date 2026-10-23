---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Coding Conventions & Core Standards

**Analysis Date:** 2026-10-23

## TypeScript Standards

- **Strict Mode Enforcement**: Strict type checking is mandatory across all modules (`tsconfig.json` and `tsconfig.electron.json`).
- **No Implicit `any`**: All function signatures, props, state hooks, and API responses must be explicitly typed.
- **Null Safety**: Protect all optional values using optional chaining (`?.`) and nullish coalescing (`??`).

## Accounting Invariance Identity

- **Mathematical Identity**: Every financial calculation, ledger ledger entry, balance summary widget, and export statement must strictly satisfy:
  $$\text{Net Balance} = \text{Total Debit} - \text{Total Credit}$$
- **Chronological Sequencing**: Running balances must always be calculated chronologically in ascending order by transaction date (`date` ascending).
- **Rounding Rule**: Financial amounts must be rounded to two decimal places:
  `Math.round((debit - credit) * 100) / 100`

## Multi-Modal Bill of Lading (BOL) Consistency

- **Required Metadata**: Every BOL record must retain:
  - Origin and destination terminals
  - Transit border stations (e.g., Islam Qala, Torghundi, Hairatan, Spin Boldak)
  - Driver full name and father name (`ولد`)
  - Driver freight/rent with currency demarcation
  - Package count, cargo description, gross weight, and net weight
- **Relational Integrity**: Cross-referencing between BOL numbers, invoices, and ledger accounts must remain 100% consistent with zero orphan records.

## Data Persistence & Concurrency Safety

- **Atomic File Writing**: All file mutations in `lib/services/blob-db.ts` must follow the crash-proof pattern:
  1. Write to unique `.tmp` file
  2. Sync file descriptor handle
  3. Copy existing file to `.bak` backup
  4. Atomically rename `.tmp` to target with retry backoff for Windows file locks
- **Serialized Write Queues**: Mutations to the same target file must be serialized via `queueFileOperation` promises.
- **Never Overwrite Without Backup**: Never delete or replace `.local-*.json` files without preserving backup copies.

## Bilingual & RTL Typography

- **Labels & Strings**: Maintain dual English and Pashto / Persian (Dari) terminology.
- **RTL Direction**: Apply `dir="rtl"` and appropriate font styling (`font-[vazirmatn]` or Arabic-script fonts) to RTL text blocks.
- **Typography Precision**: Preserve Zero-Width Non-Joiner (`\u200C`) for Persian/Dari compound words (e.g., `حمل‌ونقل` and `بین‌المللی`).

## Electron Desktop Architecture

- **Context Isolation**: Main world access is restricted through `contextBridge.exposeInMainWorld("skyDesktop", ...)`.
- **Typed Channels**: IPC messages must match typed definitions in `electron/desktop-api.d.ts`.
- **No Direct Shell Execution from Renderer**: All privileged OS operations (printing, setup execution, registry tweaks) must remain encapsulated in the Electron main process.

---

*Conventions analysis: 2026-10-23*
*Update when conventions or coding standards evolve*
