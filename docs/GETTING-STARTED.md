# Getting Started with AQ COMPANIES (Sky Ariana BOL)

Welcome to **AQ COMPANIES (Sky Ariana BOL v5.3.4)** — an enterprise multi-modal Bill of Lading (BOL), logistics, inventory, and ledger accounting workspace for desktop and local networks.

---

## 1. Prerequisites

Before setting up the development workspace, ensure your system meets the following prerequisites:

| Requirement | Supported Version | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (1903+) / Windows 11 (64-bit) | Primary target platform with NSIS desktop packaging |
| **Node.js** | v18.0.0+ (v20+ or v25 recommended) | Required for Next.js App Router and Electron |
| **npm** | v10.0.0+ | Project package manager (`npm@10.9.2` pinned) |
| **Python** | v3.8+ (Python 3.12/3.14 via `py` or `.venv`) | Used for backend services, ledger audits, and data validation |
| **PowerShell / Bash** | Windows PowerShell 5.1+, PowerShell 7+, or Git Bash | Native command execution |

---

## 2. Workspace Installation

Clone the repository and install all frontend and backend dependencies:

```powershell
# 1. Clone workspace
git clone <repository-url>
cd BOL-SOFTWARE-V5

# 2. Install Node dependencies
npm install
```

> [!NOTE]
> All scripts, background services, and automated tests use project root dependencies and `.venv\Scripts\python.exe` or `py` launcher.

---

## 3. Running in Development

The project supports running either as a web application in the browser or as a native desktop Electron application.

### A. Next.js Web Application (Port 3001)

To run the Next.js frontend with Hot Module Replacement (HMR):

```powershell
npm run dev
```

Open your browser at [http://localhost:3001](http://localhost:3001).

### B. Electron Native Desktop App

To run the Electron application concurrently with Next.js development server:

```powershell
npm run electron:dev
```

This starts the Next.js server on port 3001, compiles the Electron main/preload TypeScript code into `dist-electron/`, and launches the Electron application window.

---

## 4. Verification & Testing

Always verify TypeScript compilation and test suites before committing changes:

```powershell
# Run the complete test suite (600+ regression tests) & TypeScript check
npm test

# Run strict TypeScript typecheck only
npm run typecheck

# Run end-to-end QA validation script (Snapshots, Invariance, Typecheck)
py .agents/skills/qa-and-deployment/scripts/verify_project.py
```

---

## 5. Building & Packaging Releases

To compile the production bundles and generate the standalone Windows installer:

```powershell
# Compile Next.js production frontend and Electron main bundles
npm run build:electron
npm run build

# Build NSIS standalone installer (.exe in release/)
npm run package:win
```

The resulting installer `AQ-COMPANIES-Setup-5.3.4.exe` is output to the `release/` directory.
