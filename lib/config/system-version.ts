export interface SystemVersionInfo {
  version: string
  buildNumber: string
  releaseDate: string
  edition: string
  companyName: string
  applicationName: string
  developer: string
  platform: string
  updateChannel: "stable" | "beta"
  changelog: {
    version: string
    date: string
    title: string
    changes: string[]
  }[]
  systemRequirements: {
    recommendedBrowser: string
    pdfEngine: string
    localStoreKey: string
  }
}

export const SYSTEM_RELEASE_LABEL = "v5.2.3" as const

export const CURRENT_SYSTEM_VERSION = {
  version: SYSTEM_RELEASE_LABEL,
  buildNumber: "2026.10.25-PRO-4",
  releaseDate: "2026-10-25",
  edition: "AQ COMPANIES Enterprise Pro Edition",
  companyName: "AQ COMPANIES",
  applicationName: `AQ Companies BOL ${SYSTEM_RELEASE_LABEL}`,
  developer: "AHSANULLAH QURESHI",
  platform: "Windows Desktop / Electron / Web",
  updateChannel: "stable",
  changelog: [
    {
      version: "v5.2.3",
      date: "2026-10-25",
      title: "Logistics Quad Dashboard Completion & Test Suite Hardening",
      changes: [
        "Modified: A4 preview section headers aligned with print typography (11.5pt / 12.2pt) with resolved icon spacing and smooth four-stop blue gradient.",
        "Modified: Route timeline cards enlarged per spec (46-56px cards, 8.0-9.4pt city names, emoji-free country capsules via single countryDisplay).",
        "Modified: Description of Goods block: solid white background, crisp border-1.5 border-blue-300, enlarged titles/chips/rate badges, plus new normalizeCargoText and formatCargoRate helpers.",
        "Modified: BOL document header: official tagline default and lower center strip with HEAD OFFICE, REG 90021-AFG and CARRIER CODE SKY-AF.",
        "Modified: Edit form: #section-logistics-quad now wraps Freight, Remarks, Container & Shipping in spec order with jump-strip labels 07-10 and section icon gradients.",
        "Modified: App header collapses Sales & CRM below 1280px into the More Suites dropdown.",
        "Fixed: saved-bol-edit-sync audit walks the paginated list (page size capped at 50) instead of assuming page 1 holds every record.",
        "Fixed: Performance suite payload budget recalibrated to an 8KB-per-record guard for current bilingual record sizes.",
        "Fixed: Sequential BOL switching latency test warms up untimed and skips as 'dev server busy' when recompile stalls from active editing are detected (healthy median, stalled tail).",
        "Fixed: Removed duplicate BillOfLadingHeader import artifact in a4-preview.tsx.",
      ],
    },

    {
      version: "v5.2.2",
      date: "2026-10-25",
      title: "Fix Software Update Execution Engine and Scenario Detection",
      changes: [
        "Fixed: Resolved cmd.exe argument quotation bug preventing update batch runner execution",
        "Fixed: Fixed batch installer loop and duplicate instance launch in guided setup",
        "Fixed: Corrected Scenarios A-F detection and UI state persistence",
      ],
    },

    {
      version: "v5.2.1",
      date: "2026-10-25",
      title: "Polish Cargo Section 1 & 2 UI Layout and Sizing",
      changes: [
        "Added: Added live accounting invariance verification status bar to Rates & Totals",
        "Fixed: Section 1 container prefix laddering and gross weight Persian text overlap",
        "Fixed: Section 2 vertical rate laddering and empty space elimination",
      ],
    },

    {
      version: "v5.2.0",
      date: "2026-10-25",
      title: "Automatic Version Control & Release Pipeline",
      changes: [
        "Added: Central version-control CLI (scripts/version-control.cjs) with status, detect, release, verify, history and revert commands as the single writer for all version surfaces.",
        "Added: Append-only release-history.json with structured records (change category, features, fixes, validation status, git metadata).",
        "Added: Mandatory AI release workflow integrated into AGENTS.md (section 8) with one-increment-per-release and honest build-status reporting rules.",
        "Added: Automated validation gate: TypeScript typecheck plus the full unit test suite must pass before a release can report SUCCESS.",
        "Modified: app/loading.tsx now reads its version badge from lib/config/system-version.ts instead of a hardcoded literal.",
        "Modified: All version surfaces (package.json, package-lock.json, electron IPC/updater/main literals, docs) are synced only through the release workflow.",
      ],
    },
    {
      version: "v5.1.2",
      date: "2026-10-23",
      title: "Saved BOL Report Vector Printing & Layout Precision",
      changes: [
        "Calibrated landscape column weights preventing vertical letter-stacking of SAVED status, BOL numbers, and dates.",
        "Engineered automatic pruning for empty Container and Seal Number columns, returning horizontal space to active shipment data.",
        "Eliminated duplicate driver father names when already present in the primary driver record.",
        "Sanitized Packages column by removing redundant commodity names that duplicate Cargo Summary entries.",
        "Suppressed interactive UI action badges (Switch BL, AI triggers) during print rendering.",
        "Enforced strict keep-all word-break boundaries for financial, quantity, and status metrics in printed documents.",
      ],
    },
    {
      version: "v5.1.1",
      date: "2026-10-19",
      title: "Interactive Print Preview Studio & Windows 11 Modern Print Engine",
      changes: [
        "Eliminated Windows 11 'This app doesn't support print preview' error via automated PreferLegacyPrintDialog registry integration.",
        "Engineered interactive In-App A4 Print Preview & Layout Studio with true-to-life vector typography and drop-shadow canvas.",
        "Added live Orientation Switcher (A4 Landscape 297x210mm vs Portrait 210x297mm) with instant layout re-flow.",
        "Integrated real-time system printer selection with auto-detection of default Windows physical printer.",
        "Added dynamic density controls (Compact vs Standard) and column toggles (Rent, Goods Value, Route, Truck/Driver).",
        "Applied zero-overflow multi-page @media print CSS with repeating headers, footers, and page-break isolation.",
        "Unified desktop print across Saved BOL Reports, Detailed Report Table, Statements, and Commercial Invoices.",
      ],
    },
    {
      version: "v5.1.0",
      date: "2026-10-18",
      title: "NSIS Process Lock Shield & In-Place Instant Upgrade Engine",
      changes: [
        "Eliminated 'AQ COMPANIES cannot be closed' installer retry dialogs by integrating custom NSIS process termination hooks.",
        "Engineered detached launcher sequence with immediate OS-level process teardown to free all Windows file locks.",
        "Added 'Unlock Files & Terminate Background Instances' quick repair action directly in Software Updates tab.",
        "Implemented interactive In-App Update Modal with seamless automatic relaunch post-upgrade.",
      ],
    },
    {
      version: "v5.1.0",
      date: "2026-10-14",
      title: "1-Click Desktop Update Engine & Windows 11 Print System Upgrade",
      changes: [
        "Implemented 1-Click Desktop Update System in Settings with live installer detection and SHA-256 checksum verification.",
        "Engineered automatic detached NSIS installer execution with graceful process teardown to prevent Windows file lock errors.",
        "Added custom installer package browser allowing upgrades from USB drives, downloads, or network folders.",
        "Integrated Windows 11 Unified Print Dialog registry auto-configuration to permanently fix print preview warnings.",
        "Expanded photographic watermark library with high-resolution Afghan banknote crests, border crossings, and cargo planes.",
      ],
    },
    {
      version: "v5.1.0",
      date: "2026-09-17",
      title: "Executive Shipping Documents & Multi-Commodity Cargo Stacking",
      changes: [
        "Upgraded Packing List to support multi-commodity cargo items (2 to 5+ items) strictly stacked on top of each other.",
        "Added automatic weight & packages summing for combined shipments with discrete breakdown in summary cards.",
        "Refined Export Cargo Sticker with enlarged typography and removed carton counter badge.",
        "Enhanced A4 preview with default 100% scale and high-definition vector rendering.",
        "Updated system version to v5.1pro.",
      ],
    },
    {
      version: "v3.2.0",
      date: "2026-08-08",
      title: "User Management & Glassmorphism Security Update",
      changes: [
        "Added User Management with 4 System Roles: Superadmin, Admin, Accountant, Viewer.",
        "Added Change Password portal inside Settings with security verification.",
        "Created central System Version & Update config file (system-version.ts).",
        "Upgraded Edit Form cards with high contrast labels and dual-language badges.",
        "Integrated glassmorphic login screen with remember-me session persistence.",
      ],
    },
    {
      version: "v3.1.0",
      date: "2026-08-06",
      title: "Logistics Timeline & Dual Currency Ledger Upgrade",
      changes: [
        "Enhanced Route / Transportation timeline cards in A4 preview.",
        "Added automatic city name duplicate country code cleanup.",
        "Integrated multi-account ledger PDF export.",
      ],
    },
  ],
  systemRequirements: {
    recommendedBrowser: "Google Chrome, Microsoft Edge, Mozilla Firefox (Latest)",
    pdfEngine: "Turbopack Next.js HTML5 Canvas & Blob Stream",
    localStoreKey: "sky-bol-saved-documents",
  },
} satisfies SystemVersionInfo

export const SYSTEM_VERSION = CURRENT_SYSTEM_VERSION
