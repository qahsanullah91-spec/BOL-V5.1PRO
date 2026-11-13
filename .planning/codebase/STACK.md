---
last_mapped_commit: 8a57ed6fd9472c92904aad31bd40ae76281bc5c8
last_mapped_at: 2026-11-13
---
# Technology Stack

**Analysis Date:** 2026-11-13

## Languages

**Primary:**
- TypeScript 5.8+ - Application codebase, React 19 components, Next.js 16 App Router endpoints, Electron main/preload processes, domain models, and document generator logic
- JavaScript / CommonJS (`.cjs`) - Fast zero-transpilation test suites (`tests/*.test.cjs`), release and version-control pipelines (`scripts/version-control.cjs`), GCS backup automation (`scripts/gcs-automated-backup.cjs`)

**Secondary:**
- Python 3.12+ (isolated virtual environment strictly at `.venv/`) - Auxiliary data analysis, photographic security watermark generators (`scripts/build-photographic-watermarks.py`), and offline tools
- NSIS Scripting (`.nsh`) - Windows desktop installer process termination and setup hooks (`build/installer.nsh`)
- HLSL / Shader & SVG - Vector logo suites, security guilloche patterns, and watermarks

## Runtime & Engines

**Environment:**
- Node.js 20.x / 22.x / 25.x - Unified runtime powering Next.js development server, build pipeline, and Electron desktop runtime
- Electron 41.x (`main`: `dist-electron/main.js`, source: `electron/main.ts`) - Windows 64-bit desktop application shell with native windowing, hardware print acceleration, and Windows 11 legacy print dialog bridge
- Next.js 16.0+ (App Router, Webpack dev) - Server and client hybrid architecture

**Package Manager:**
- npm 10.x+ - Strict dependency management with locked `package-lock.json`
- tsx 4.23+ - On-demand TypeScript execution engine (`node_modules/.bin/tsx`) for CLI tools and export scripts

## Frameworks & UI Architecture

**Core Frontend:**
- React 19.x - UI component layer with concurrency primitives, transitions, and modern state hooks
- Next.js 16 (App Router) - Server-side rendering, client hydration, and REST API routing

**Styling & Design System:**
- Tailwind CSS 4.x - Modern styling engine with zero-config CSS variables, dynamic dark mode, and `@media print` layout enforcement
- Radix UI & Shadcn Primitives - 27 headless UI primitives in `components/ui/` (Dialog, Sheet, Popover, Select, Tabs, Tooltip, Dropdown Menu, Table, etc.)
- Lucide React 0.56+ - Unified vector iconography
- Typography: Cambria typography for authentic Afghan Chamber of Commerce & Industry (ACCI) documents; Vazirmatn for Pashto/Dari RTL rendering

**Document, Vector & PDF Engines:**
- jsPDF 4.2+ (`jspdf`) - High-resolution vector PDF generation for Bills of Lading, A4 previews, Commercial Invoices, and Packing Lists
- fflate 0.8+ - Ultra-fast OpenXML ZIP compression for native Microsoft Word (`.docx`) generation (`lib/utils/acci-word-generator.ts`)
- html-to-image 1.11+ / html2canvas - Client-side raster preview snapshots (safely fallback to SVG renderers in hidden Electron windows)

## AI & Cloud Services

**Google Cloud Platform & Gemini AI:**
- Google Gemini API (`gemini-3.8-flash` & `gemini-2.5-flash`) - Automated multi-modal document extraction and compliance screening (`app/api/ai/structured-extract/route.ts`)
- Google Cloud Storage (GCS) - Automated snapshot backup synchronization (`scripts/gcs-automated-backup.cjs`)
- Google Cloud Run & Cloud SQL (PostgreSQL 16) - Production container deployment architecture (`docs/GOOGLE_CLOUD_DEPLOYMENT.md`)

## Key Configuration Files

| Configuration File | Scope & Purpose |
|---|---|
| `lib/config/system-version.ts` | **Single Source of Truth** for UI versioning, build identifiers, and changelog history |
| `package.json` | Dependencies, scripts, and electron-builder NSIS packaging configuration |
| `tsconfig.json` | Next.js TypeScript strict compiler settings |
| `tsconfig.electron.json` | Electron main and preload compiler configuration |
| `next.config.mjs` | Next.js production build configuration, Webpack watchOptions, and asset headers |
| `build/installer.nsh` | NSIS Windows installer macros for clean process termination during upgrades |

---

*Stack analysis: 2026-11-13*
*Update after major dependency changes*
