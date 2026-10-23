---
last_mapped_commit: e375f553418e664b7c4d0e8cf05859dcdbf106a4
last_mapped_at: 2026-10-23
---
# Technology Stack

**Analysis Date:** 2026-10-23

## Languages

**Primary:**
- TypeScript 5.8+ - Application code, React 19 components, Next.js API routes, Electron main/preload scripts, domain models

**Secondary:**
- JavaScript / CommonJS (`.cjs`) - Unit test suites (`tests/*.test.cjs`), electron-builder configuration, build and tooling scripts
- NSIS Scripting (`.nsh`) - Windows desktop installer process termination and setup hooks (`build/installer.nsh`)

## Runtime

**Environment:**
- Node.js 20.x+ - Unified runtime powering local development, Next.js server, and Electron desktop shell
- Electron 34.x - Windows 64-bit desktop wrapper providing native window management, direct A4 printing, and OS integration

**Package Manager:**
- npm 10.x+
- Lockfile: `package-lock.json` present and strictly versioned

## Frameworks

**Core:**
- Next.js 15.2+ (App Router) - Full-stack React framework providing SSR, API routing, and optimized bundle delivery
- React 19.x - UI component layer utilizing modern hooks and concurrency primitives

**Desktop:**
- Electron 34.x - Cross-platform desktop framework packaging the Next.js runtime into a standalone Windows enterprise desktop suite

**Styling & UI:**
- Tailwind CSS 4.x - Utility-first styling engine with customized corporate palette, dark mode support, and print media rules
- Radix UI / Shadcn Primitives - Accessible dialogs, dropdowns, popovers, tooltips, and form elements
- Lucide React - Unified iconography across all desktop and report modules

**Document & PDF Generation:**
- jsPDF 2.5+ - Client-side vector PDF generation for Bills of Lading, Cargo Manifests, and Financial Invoices

## Key Dependencies

**Critical:**
- `@vercel/blob` 0.27+ - Optional cloud persistence and remote blob storage synchronization
- `sonner` 2.0+ - Toast notification system for user feedback, progress reporting, and cloud sync status
- `canvas-confetti` 1.9+ - Visual completion celebration triggers
- `clsx` & `tailwind-merge` - Conditional class composition and utility merging

## Configuration

**Environment:**
- `.env.local` - Local development environment secrets, cloud credentials, and API tokens (never committed)
- System storage: Local JSON databases stored in application root or Windows `%APPDATA%` directory

**Build & Compiler:**
- `tsconfig.json` - Next.js TypeScript strict compiler settings
- `tsconfig.electron.json` - Electron main and preload compiler configuration
- `next.config.mjs` - Next.js production build configuration and asset headers
- `package.json` (`build` field) - Electron-builder configuration for Windows NSIS packaging

## Platform Requirements

**Development:**
- Windows 10/11 64-bit (PowerShell / cmd.exe)
- Node.js 20+

**Production:**
- Standalone Windows 64-bit Desktop Application (`AQ-COMPANIES-Setup-v5.1.2.exe`)
- Cloud deployment on Vercel (optional for web interface access)

---

*Stack analysis: 2026-10-23*
*Update after major dependency changes*
