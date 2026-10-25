# Configuration & Environment Guide

This document outlines runtime configurations, file locations, environment variables, and build parameters for **AQ COMPANIES (Sky Ariana BOL)**.

---

## 1. System Versioning

System versioning is defined authoritatively in [`lib/config/system-version.ts`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/lib/config/system-version.ts) and synchronized with [`package.json`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/package.json):

```typescript
export const CURRENT_SYSTEM_VERSION = {
  version: "5.3.4",
  buildNumber: 512,
  releaseDate: "2026-10-23",
  updateChannel: "stable",
  // ...
}
```

---

## 2. Local JSON Data Snapshots

The application maintains local JSON snapshots in the project root (development) or user app data (production) for offline capability and speed:

| Snapshot File | Purpose |
| :--- | :--- |
| `.local-bols.json` | Active Bill of Lading records and shipment metadata |
| `.local-account-ledgers.json` | Customer and vendor double-entry financial statements |
| `.local-bol-account-ledgers.json` | Cross-referenced BOL-specific ledger entries |
| `.local-invoices.json` | Commercial Invoices, fee demarcations, and exchange rates |
| `.local-bol-sequence.json` | Annual sequential counter for BOL numbers (e.g. `BOL-2026-NSA742`) |
| `.receipt-counter` | Incremental counter for official financial receipt vouchers |
| `.treasury-*-counter` | Counters for Treasury Payments (PV), Transfers (TRF), and FX exchanges |

> [!IMPORTANT]
> Write operations to local snapshot files must always be atomic: write to a `.tmp` file first and rename to target to prevent corruption during sudden power losses.

---

## 3. Environment Variables & Ports

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | Next.js development and production HTTP server port |
| `ELECTRON_START_URL` | `http://127.0.0.1:3001` | URL loaded by Electron window during desktop development |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API key for AI assistant features (deterministic offline fallback enabled when absent) |
| `NODE_ENV` | `development` / `production` | Standard Node runtime environment |

---

## 4. Electron Desktop Configuration

- **TypeScript Config**: [`tsconfig.electron.json`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/tsconfig.electron.json) compiles `electron/main.ts` and `electron/preload.ts` into `dist-electron/`.
- **NSIS Custom Hook**: [`build/installer.nsh`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/build/installer.nsh) provides custom NSIS macros (`customCheckAppRunning`, `customInit`, `customUnInstall`) to terminate lingering `aq-backend.exe` and `AQ COMPANIES.exe` process trees before updating files.
- **Packager Settings**: Configured under the `"build"` block in [`package.json`](file:///d:/SOFTWARES-APPS/BOL-SOFTWARE-V5/package.json):
  ```json
  "build": {
    "appId": "com.aqcompanies.app",
    "productName": "AQ COMPANIES",
    "win": {
      "target": ["nsis"],
      "icon": "public/icon.ico"
    },
    "nsis": {
      "include": "build/installer.nsh",
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
  ```
