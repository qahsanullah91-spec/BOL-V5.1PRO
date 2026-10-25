# API & IPC Interface Reference

This document catalogs the HTTP Route Handlers and Electron Desktop Inter-Process Communication (IPC) interfaces for **AQ COMPANIES (Sky Ariana BOL)**.

---

## 1. Next.js Server Route Handlers

### A. System Updater (`/api/system/update`)

#### `GET /api/system/update`
Queries the local release directory and system status to detect whether a new installer package is available.

- **Query Parameters**:
  - `customPath` *(optional)*: Direct path to a candidate installer `.exe` or release folder.
- **Response**:
  ```json
  {
    "success": true,
    "currentVersion": "5.2.3",
    "currentBuild": 512,
    "releaseDate": "2026-10-23",
    "platform": "win32",
    "availableUpdate": {
      "hasUpdate": true,
      "version": "5.2.3",
      "installerName": "AQ-COMPANIES-Setup-5.2.3.exe",
      "installerPath": "D:\\SOFTWARES-APPS\\BOL-SOFTWARE-V5\\release\\AQ-COMPANIES-Setup-5.2.3.exe",
      "installerFormattedSize": "115.42 MB",
      "status": "ready_to_install"
    },
    "changelog": [ ... ]
  }
  ```

#### `POST /api/system/update`
Executes updater actions (process management and installer triggering).

- **Request Body**:
  ```json
  {
    "action": "install" | "kill-processes" | "open-folder",
    "installerPath": "string (optional)",
    "silent": false
  }
  ```
- **Actions**:
  - `kill-processes`: Pre-emptively terminates lingering `aq-backend.exe` processes to release file locks.
  - `install`: Launches the installer executable in a detached process and exits cleanly.
  - `open-folder`: Opens the release folder in Windows File Explorer.

---

### B. Document Synchronization (`/api/sync`)

#### `POST /api/sync`
Transfers and persists batches of documents from offline queues to central snapshots.

- **Headers**:
  - `Content-Type: application/json`
  - `X-Client-Queue-Drain: true` *(optional, set by `OnlineSaveManager`)*
- **Request Body**:
  ```json
  {
    "documents": [
      {
        "id": "BOL-2026-NSA742",
        "bol_number": "BOL-2026-NSA742",
        "client_name": "RAHMAT NAZAR LTD",
        "origin": "Kandahar",
        "cargo_weight_kg": 24000,
        "updated_at": "2026-10-23T15:00:00Z"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "syncedCount": 1,
    "timestamp": "2026-10-23T15:00:01Z"
  }
  ```

---

## 2. Electron Desktop IPC Bridge (`window.desktopApi`)

When running inside the Electron container, the preload script exposes secure desktop APIs via `window.desktopApi`:

### A. Print APIs

| IPC Channel | TypeScript Method | Description |
| :--- | :--- | :--- |
| `print:page` | `desktopApi.printPage(options)` | Opens native print dialog or silent printing with custom margins and page size (`A4`) |
| `print:get-printers` | `desktopApi.getPrinters()` | Returns available system printer devices asynchronously |
| `print:get-preview-pdf` | `desktopApi.getPreviewPdf(options)` | Generates PDF buffer for in-app preview studio rendering |
| `print:pdf` | `desktopApi.printPdf(defaultName)` | Prompts native Windows save dialog to export PDF |

### B. System Updater Bridge

| IPC Channel | TypeScript Method | Description |
| :--- | :--- | :--- |
| `updater:check` | `desktopApi.updater.check(candidatePath)` | Discovers local update installer executables |
| `updater:install` | `desktopApi.updater.install(options)` | Terminates backend trees and launches installer with delay |
| `updater:kill-processes`| `desktopApi.updater.killProcesses()` | Forcibly terminates lingering background services |
| `updater:open-folder` | `desktopApi.updater.openFolder(path)` | Shows installer file in Windows File Explorer |

### C. Native Filesystem & Shell

| IPC Channel | TypeScript Method | Description |
| :--- | :--- | :--- |
| `fs:read-file` | `desktopApi.fs.readFile(filePath)` | Reads UTF-8 file content securely |
| `fs:write-file` | `desktopApi.fs.writeFile(filePath, content)` | Atomic file write operation |
| `fs:exists` | `desktopApi.fs.exists(filePath)` | Checks if a file path exists |
| `shell:open-external` | `desktopApi.shell.openExternal(url)` | Opens external URLs in system browser (e.g. `wa.me`) |
| `app:get-version` | `desktopApi.app.getVersion()` | Returns current package version string |
