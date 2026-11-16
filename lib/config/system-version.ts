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

export const SYSTEM_RELEASE_LABEL = "v5.28.1" as const

export const CURRENT_SYSTEM_VERSION = {
  version: SYSTEM_RELEASE_LABEL,
  buildNumber: "2026.11.15-PRO-15",
  releaseDate: "2026-11-15",
  edition: "AQ COMPANIES Enterprise Pro Edition",
  companyName: "AQ COMPANIES",
  applicationName: `AQ Companies BOL ${SYSTEM_RELEASE_LABEL}`,
  developer: "AHSANULLAH QURESHI",
  platform: "Windows Desktop / Electron / Web",
  updateChannel: "stable",
  changelog: [
    {
      version: "v5.28.1",
      date: "2026-11-15",
      title: "Fix A4 Preview PDF Export & Exact Layout Fidelity",
      changes: [
        "Added: Fixed A4 Preview PDF Download (Complete PDF / Download BOL Only) 1:1 layout match for BOL-2026-NSA763",
        "Fixed: Resolved Shipping Details & Ports clipping, unrounded carton weights, Exporter Contacts overlap, route bidi parentheses, logo text font readiness, and download filename",
      ],
    },

    {
      version: "v5.28.0",
      date: "2026-11-15",
      title: "Phase 2: Build SKY AI Chat Engine",
      changes: [
        "Added: ChatGPT/Gemini style interface with conversation history, user profile, and session search",
        "Added: Multi-provider streaming engine with Google Gemini, OpenAI, and Offline Local support",
        "Added: Safe file attachment parsing for PDF, DOCX, XLSX, CSV, and images",
        "Fixed: Enforced RBAC conversation ownership and user privacy isolation",
      ],
    },

    {
      version: "v5.27.1",
      date: "2026-11-15",
      title: "Fix Software EXE Vertical Scrolling in A4 Preview & Workspace",
      changes: [
        "Added: Added smooth keyboard (PageDown/PageUp/Space) and mouse wheel scrolling with 48px bottom clearance in A4 preview",
        "Fixed: Restored vertical scrolling down in desktop EXE by eliminating overflow-hidden lock on A4 preview viewport and stage",
      ],
    },

    {
      version: "v5.27.0",
      date: "2026-11-15",
      title: "Upgrade SKY AI Business Assistant",
      changes: [
        "Added: ChatGPT and Gemini style AI chat interface with sidebar, conversation history, and Ask/Work modes",
        "Added: Dedicated WhatsApp generator across 11 logistics categories in English, Persian, and Pashto",
        "Added: Authoritative BOL PDF and ACCI export document generation inside chat",
        "Added: Multi-provider AI support (Google Gemini, OpenAI GPT-4o, and Offline Local Engine)",
        "Fixed: Enhanced container location and missing document auditing with zero hallucination",
      ],
    },

    {
      version: "v5.26.2",
      date: "2026-11-15",
      title: "Fix A4 Preview PDF Download Clipping, Header Collisions and Card Alignment",
      changes: [
        "Added: Fixed A4 Preview PDF exported layout with proper dynamic scale calibration, zero character slicing, and clean card spacing",
        "Fixed: Resolved horizontal border collision slicing through shipment info cards, party names, exporter contacts, and cargo grid headers; fixed document cutoff to ensure full visibility of timeline, signature chamber, and footer",
      ],
    },

    {
      version: "v5.26.1",
      date: "2026-11-15",
      title: "Fix A4 Preview PDF download, eliminate oklch color parser exceptions and isolate offscreen export containers",
      changes: [
        "Added: Quarantined on-demand export containers (data-pdf-export-container and data-shipping-export-container) to -left-[10000px] off-screen to eliminate background bleed into A4 Preview",
        "Added: Added !important white background overrides in onclone hooks across pdf-upload.ts and shipping-documents.ts to protect html2canvas against oklch color errors",
        "Added: Purged stale Webpack bytecode caches and rebuilt clean development bundles",
        "Added: Integrated executive Date-Range Operations Analytics banner and 13-sheet multi-sheet Excel export engine with daily timeline pacing",
        "Fixed: Resolved 'Attempting to parse an unsupported color function oklch' error during PDF download",
        "Fixed: Eliminated background document bleed visible behind A4 Preview during PDF generation",
      ],
    },

    {
      version: "v5.26.0",
      date: "2026-11-15",
      title: "Google Antigravity SDK Agent Integration & Sky AI Assistant Overhaul",
      changes: [
        "Added: Integrated Google Antigravity SDK autonomous multi-tool agent architecture in Python with Pydantic structured output",
        "Added: Implemented double-entry accounting invariance identity assertion (Net Balance = Total Debit - Total Credit) with zero-tolerance mathematical audit",
        "Added: Engineered Sky AI Assistant Executive UI with dynamic Engine Selector (Antigravity SDK, Gemini 3.8 Flash, Local Grounded), live telemetry HUD, and 6 domain capability hubs",
        "Added: Added interactive Google Antigravity Agent Execution Trace accordion displaying step-by-step reasoning, tool invocations, and invariance verification",
        "Fixed: Resolved SeaportInfo customsLocationCode TypeScript typing drift in route-location-service",
        "Fixed: Fixed Daily Timeline sheet TOTAL row alignment in date-range Excel exports",
      ],
    },

    {
      version: "v5.25.3",
      date: "2026-11-15",
      title: "Iran Port Information & Jask Seaport Details Integration",
      changes: [
        "Added: Iranian Seaports (Jask Port, Bandar Abbas, Chabahar, BIK, Bushehr, Khorramshahr, Anzali, Assaluyeh) first-class Port Details and terminal presets",
        "Added: Iran Category secondary filter tabs in route stop location picker",
        "Fixed: Resilient input resolution for Jask Port ensuring zero search drops on dash/partial entries",
      ],
    },

    {
      version: "v5.25.2",
      date: "2026-11-15",
      title: "A4 PDF Export Quality, Anti-Blackout & Typography Fit Polish",
      changes: [
        "Added: Enhanced A4 Preview & PDF Export rendering with strict hex color sanitization preventing black bar artifacts",
        "Fixed: Resolved solid black bars on cargo headers and pills, squashed Persian contacts header, monospace line collisions, and ultra-density date overlap",
      ],
    },

    {
      version: "v5.25.1",
      date: "2026-11-15",
      title: "Sky AI Assistant Interface Redesign & Operational Telemetry",
      changes: [
        "Added: Transformed Sky AI Assistant into dense 6-domain operations command center with live telemetry",
        "Added: Added quick action prompt chips and enhanced input console with keyboard shortcuts",
        "Fixed: Resolved barren layout and wasted vertical space in AI Assistant workspace",
      ],
    },

    {
      version: "v5.25.0",
      date: "2026-11-15",
      title: "Databricks Apps Integration & AppKit Workspace",
      changes: [
        "Added: Installed and verified Databricks CLI v1.26.0 with permanent User PATH registration",
        "Added: Created dual-mode Databricks Apps Python backend with offline simulation fallback",
        "Added: Configured dynamic local runner successfully hosting endpoints on port 8008",
        "Added: Engineered Next.js API route proxy for secure frontend-to-warehouse dispatch",
        "Added: Scaffolded Databricks AppKit Workspace with Metric Views, Genie AI, and SQL Explorer",
        "Added: Added databricks navigation view to AppContext and enterprise header menu",
        "Fixed: Resolved Windows port 8000 bind conflict via dynamic multi-port selection in run_local.py",
      ],
    },

    {
      version: "v5.24.1",
      date: "2026-11-15",
      title: "Fix A4 Preview PDF download, eliminate oklch color parser exceptions and isolate offscreen export containers",
      changes: [
        "Fixed: Purged stale Webpack cache and eliminated OKLCH color parser exceptions in html2canvas PDF rendering pipeline",
        "Fixed: Replaced oklch design tokens in app/globals.css and styles/globals.css with standard hex colors for universal canvas compatibility",
        "Fixed: Isolated on-demand export containers strictly off-screen (-10000px) to prevent background packing list bleed during A4 Preview PDF downloads",
      ],
    },

    {
      version: "v5.24.0",
      date: "2026-11-15",
      title: "Flutter Mobile Companion App Scaffold & Dart Porting",
      changes: [
        "Added: Scaffolded apps/driver_companion Flutter companion app with layered MVVM architecture",
        "Added: Ported multi-modal BOL and Ledger accounting models to Dart",
        "Added: Ported 3-way offline synchronization engine and SHA-256 checksums to Dart",
      ],
    },

    {
      version: "v5.23.0",
      date: "2026-11-15",
      title: "A4 PDF Export Typography, India Ports & Saved BOL Report Enhancements",
      changes: [
        "Added: Added India ports (Nhava Sheva, Mundra, Kandla, Pipavav, Chennai, Kolkata, Cochin, Tuticorin) to route selector",
        "Added: Improved Saved BOL Report and Excel multi-column formatting",
        "Fixed: Resolved top-clipping of numerals in Issue Date and Driver Rent cards in A4 PDF preview",
        "Fixed: Fixed Cargo table column headers height and padding to prevent horizontal text slicing",
        "Fixed: Fixed Cargo package commodity and Rate/Value cell heights with visible overflow",
        "Fixed: Fixed Exporter Contacts header bar squashing and party address typewriter line-height",
        "Fixed: Protected Transport Mode pills in Route Timeline from OKLCH color wiping with explicit pastel styling",
      ],
    },

    {
      version: "v5.22.0",
      date: "2026-11-15",
      title: "A4 Preview PDF High-Resolution Quality & Indian Ports Hub Release",
      changes: [
        "Added: Fixed Arabic and Persian cursive font shaping by resetting letter-spacing to 0 in PDF exports",
        "Added: Enhanced toSvg primary vector engine in shipping-documents and pdf-upload with skipFonts and fallback protection",
        "Added: Added complete Indian Seaports & ICDs directory with Nhava Sheva (INNSA) and quick POD shortcuts in BOL editor",
        "Fixed: Fixed Section 1 transit date and invoice capsule styling with solid white pill and red divider",
        "Fixed: Resolved vertical numeral clipping on Issue Date and Driver Rent cards in Section 1",
        "Fixed: Fixed Exporter Contacts DetailCard layout squashing and invalid Tailwind decimal classes",
        "Fixed: Resolved CargoRow package count and commodity name overlap with expanded cell height",
        "Fixed: Fixed Footer Tier 2 and Tier 3 spacing to eliminate Iran Transit Office and Head Office collision",
      ],
    },

    {
      version: "v5.21.3",
      date: "2026-11-14",
      title: "Fix A4 Preview Off-Screen PDF Export Containers Bleed",
      changes: [
        "Fixed: Relocated on-demand PDF and shipping document export containers off-screen to -left-[10000px], completely eliminating background bleed during PDF download in A4 Preview",
        "Fixed: Updated fallback DOM wrappers in pdf-upload and shipping-documents with -10000px left offsets and -9999 z-index",
      ],
    },

    {
      version: "v5.21.2",
      date: "2026-11-14",
      title: "Fix A4 preview PDF download colors, SVG rasterization, and layout fidelity",
      changes: [
        "Added: Synchronized DOM sanitization and modern CSS color mapping across all PDF export engines",
        "Fixed: Route transportation path solid black rectangles on vessel mode pills",
        "Fixed: Cargo description section header badge white blackout",
        "Fixed: Shipping details & ports Persian subtitles colliding with English port values",
        "Fixed: Cargo table Rate & Goods Value numeric top clipping",
        "Fixed: SVG foreignObject UTF-8 byte corruption on Dari/Pashto text in loadSvgImage",
      ],
    },

    {
      version: "v5.21.1",
      date: "2026-11-14",
      title: "Fix BOL PDF Download Fidelity, Section Visibility & India Ports",
      changes: [
        "Added: Indian Ports directory with UN/LOCODE and resilient bilingual search in route selector",
        "Fixed: Resolved PDF export dropout where section headers and cards vanished under watermark blowout",
      ],
    },

    {
      version: "v5.21.0",
      date: "2026-11-14",
      title: "Executive Styled Excel Export Engine and Saved BOL Report Center Enhancements",
      changes: [
        "Added: Integrated xlsx-js-style executive corporate styling engine across all 12 operational sheets with brand navy headers, alternating zebra striping, accounting double underlines, and emerald/amber status badges",
        "Added: Enhanced Saved BOL Report Center toolbar with prominent PRO Excel export dropdown menu supporting full 12-sheet workbook, active tab view, and selected records",
        "Fixed: Purged stale Next.js Webpack cache and eliminated OKLCH color parser exceptions in html2canvas PDF rendering pipeline",
      ],
    },

    {
      version: "v5.20.0",
      date: "2026-11-14",
      title: "Indian Ports Directory & Port Details Integration with High-Res PDF Export Fix",
      changes: [
        "Added: Full Indian Ports Directory (25+ major seaports, commercial gateways, and premier ICDs) with UN/LOCODE, ICEGATE customs station codes, active terminals, and DFC badges",
        "Added: Interactive Suggested Locations popover header banner and location match cards with quick terminal preset buttons",
        "Fixed: Nhava Sheva 0-results issue via decoupled bilingual token matching",
        "Fixed: PDF download missing middle sections and vector icon line-art fills in Saved BOL and BOL Editor",
      ],
    },

    {
      version: "v5.19.3",
      date: "2026-11-14",
      title: "A4 Preview Route Timeline Cards Equal Width & Persian Typography Polish",
      changes: [
        "Added: Balanced route cards with 100% equal width flex-1 distribution and centered connecting arrows",
        "Fixed: Resolved unequal card width where Card 5 was 20% wider, and normalized authentic Persian spelling to نهاوا شیوا",
      ],
    },

    {
      version: "v5.19.2",
      date: "2026-11-13",
      title: "Route Preset Selector Fitted Responsive Layout & Interactive Navigation",
      changes: [
        "Added: Added interactive smooth-scroll chevron controls to station and container filter rails",
        "Fixed: Resolved RTL horizontal clipping and vertical scrollbar collision in route cards list",
      ],
    },

    {
      version: "v5.19.1",
      date: "2026-11-13",
      title: "Saved BOL Report: Rate per KG, Net Weight, and Gross Weight Stacked Hierarchy",
      changes: [
        "Added: 3-tier vertical stack displaying Rate per KG on top, Net Weight in middle, and Gross Weight on bottom in both table and cargo summary",
        "Added: Added Rate/KG on top of Gross Wt in table header with active sort controls",
        "Fixed: Resolved horizontal collision where adjacent weight and rate columns smashed into single strings like 22,597 KG5.00",
      ],
    },

    {
      version: "v5.19.0",
      date: "2026-11-13",
      title: "Add Complete Indian Ports Directory and Fix Nhava Sheva Port Details",
      changes: [
        "Added: Full Indian Ports Directory (12 Major Ports, Commercial Gateways & Inland Terminals)",
        "Added: Seaport & Customs Terminal Banner in Route Stop Cards with ICEGATE Code and Terminal Presets",
        "Added: Decoupled Bilingual Route Search Matcher with Persian Normalization",
        "Fixed: Nhava Sheva search returning 0 matches when typing 'Nhava Sheva, I' with Persian 'نوا شوا، هند'",
        "Fixed: Missing port details and terminal selectors for Nhava Sheva and other Indian ports in route stop editor",
      ],
    },

    {
      version: "v5.18.20",
      date: "2026-11-13",
      title: "PDF Quality, Scannable Vector QR Code and Route En-Dash Normalization",
      changes: [
        "Added: Preserved black vector QR code paths and white backgrounds across PDF high-res capture and print portals",
        "Added: Added en-dash and em-dash splitting in route stops to prevent location name clipping",
        "Fixed: Purged stale Webpack bytecode caches and added predev patch guard to eliminate oklch color errors during PDF download",
      ],
    },

    {
      version: "v5.18.19",
      date: "2026-11-13",
      title: "PDF Quality, Scannable Vector QR Code and Route En-Dash Normalization",
      changes: [
        "Added: Preserved black vector QR code paths and white backgrounds across PDF high-res capture and print portals",
        "Added: Added en-dash and em-dash splitting in route stops to prevent location name clipping",
        "Fixed: Purged stale Webpack bytecode caches and added predev patch guard to eliminate oklch color errors during PDF download",
      ],
    },

    {
      version: "v5.18.18",
      date: "2026-11-13",
      title: "Elevate Saved BOL Report Excel Export Design",
      changes: [
        "Added: Executive multi-sheet Excel workbook (.xlsx) with interactive autofilters, frozen headers, and accounting invariance audit",
        "Added: Direct 1-click and bulk Excel export buttons in Saved Documents list view",
        "Fixed: Optimized column widths, row heights, and numeric formatting across all 12 operational sheets",
      ],
    },

    {
      version: "v5.18.17",
      date: "2026-11-13",
      title: "Fix Suggested Locations Popover & Route Stop Card Layout",
      changes: [
        "Added: Added left and right chevron scroll navigation and mouse wheel horizontal scrolling to the popover country filter chips bar, preventing chip clipping",
        "Added: Restructured Suggested Locations popover header into balanced full-width rows with clear search input and reset badges, preventing 3-column dashboard squeeze",
        "Added: Added rich, actionable empty state with Show All Locations and Keep Custom Entry buttons when no predefined location matches",
        "Fixed: Fixed clipping of country filter chips (IR Iran, etc.) on narrow containers and Windows desktop",
        "Fixed: Fixed popover overlay height from awkwardly crushing Route Stop driver and customs seal fields",
      ],
    },

    {
      version: "v5.18.16",
      date: "2026-11-13",
      title: "Flutter Mobile Companion App and mobile-optimized paginated sync stream",
      changes: [
        "Added: Flutter companion app scaffolding with compute isolate parsing",
        "Added: Paginated and lightweight mobile API sync stream",
        "Fixed: Stray button bracket in bol-editor quick location filter",
      ],
    },

    {
      version: "v5.18.15",
      date: "2026-11-13",
      title: "Vercel Analytics & Speed Insights Integration and MCP Server Stability",
      changes: [
        "Added: Integrated @vercel/speed-insights and verified @vercel/analytics conditional mounting",
        "Added: Added mandatory AQ-COMPANIES update report header and footer banner",
        "Fixed: Resolved mcp-toolbox-for-databases stdio pollution and github-mcp-server cache corruption",
      ],
    },

    {
      version: "v5.18.14",
      date: "2026-11-13",
      title: "Fix and Fit Saved BOL Report to Screen, Print, PDF and Excel",
      changes: [
        "Added: Screen-fitted responsive report with 1-click See All at Once mode",
        "Added: Dynamic 100% proportional column scaling for A4 print and vector PDF",
        "Added: Enhanced Excel multi-sheet export with auto-fitting widths and accounting invariance compliance",
        "Fixed: Saved BOL Report horizontal overflow on standard screen viewports",
        "Fixed: Print and PDF right-edge column clipping on A4 paper",
      ],
    },

    {
      version: "v5.18.13",
      date: "2026-11-13",
      title: "Register OKLCH in html2canvas supported color functions and purge webpack cache",
      changes: [
        "Fixed: Injected OKLCH directly into html2canvas SUPPORTED_COLOR_FUNCTIONS registry across all unminified and minified bundles",
        "Fixed: Purged persistent webpack bytecode cache in node_modules/.cache/webpack and .next build cache",
        "Fixed: Added explicit background-color and color styling to root and body in PDF export onclone",
      ],
    },

    {
      version: "v5.18.12",
      date: "2026-11-13",
      title: "GCS automated backup pipeline, GCP Cloud Run architecture docs, and ACCI sample exports",
      changes: [
        "Added: GCS automated snapshot backups with accounting invariance enforcement",
        "Added: ACCI sample docx and pdf exports generator",
        "Fixed: Aligned downside chamber box and centered packing list layout",
      ],
    },

    {
      version: "v5.18.11",
      date: "2026-11-13",
      title: "BOL Print and A4 Preview 1:1 Visual Parity and QR Print Guarantee",
      changes: [
        "Added: Preserved full watermark transparency and subtle glassmorphic card backgrounds in print output",
        "Added: Guaranteed scannable vector QR code rendering in print previews and physical printouts",
        "Fixed: Resolved print CSS opaque white block overrides covering the background watermark",
        "Fixed: Resolved interactive role=button print stripping hiding the header QR code",
      ],
    },

    {
      version: "v5.18.10",
      date: "2026-11-13",
      title: "Fix OKLCH color error and purge stale webpack cache for PDF downloads",
      changes: [
        "Fixed: Purged stale Next.js Webpack cache and patched html2canvas and html2pdf bundles against OKLCH color errors during PDF download",
        "Fixed: Added comprehensive onclone style sanitization and unconditional border color overrides for PDF generation",
      ],
    },

    {
      version: "v5.18.9",
      date: "2026-11-13",
      title: "Fix OKLCH Color Parsing in PDF Generator",
      changes: [
        "Added: Added OKLCH to RGB conversion and automated html2canvas color error guards",
        "Fixed: Resolved 'Attempting to parse an unsupported color function oklch' error when downloading PDF",
      ],
    },

    {
      version: "v5.18.8",
      date: "2026-11-13",
      title: "Align Invoice downside Chamber Fee bordered box with authentic template image",
      changes: [
        "Fixed: Added outer black border box around Chamber Fee details in Invoice preview and PDF matching user screenshot",
        "Fixed: Formatted Reg No, Fee No, Received sum, Date, and Signature spacing within bordered box",
      ],
    },

    {
      version: "v5.18.7",
      date: "2026-11-13",
      title: "Fix Shipping Documents PDF Generation and Cloned Iframe Resolution",
      changes: [
        "Added: Enhanced PDF download pipeline with isolated DOM wrapper for html2canvas and synchronous shipping page bundling",
        "Fixed: Resolved 'Unable to find element in cloned iframe' error on Complete PDF and shipping document exports",
      ],
    },

    {
      version: "v5.18.6",
      date: "2026-11-13",
      title: "Enlarge (Origin Afghanistan) and SKY ARIANA LTD Stamp Typography",
      changes: [
        "Added: Enlarged font sizing for (Origin Afghanistan) and SKY ARIANA LTD signature stamp across UI, PDF, and Word exports",
        "Modified: Packing list view, commercial invoice view, PDF generator, and Word generator",
      ],
    },

    {
      version: "v5.18.5",
      date: "2026-11-12",
      title: "Add Jask, Suwaiq, and Sohar Port Details and Multi-Modal Transit Corridor",
      changes: [
        "Added: Bilingual metadata, UN/LOCODEs, and aliases for Jask Port (Iran), Suwaiq Port (Oman), and Sohar Port (Oman)",
        "Added: 1-click Nimroz -> Jask -> Suwaiq -> Sohar multi-modal truck and vessel transit corridor preset",
        "Modified: Transit route parser, A4 preview timeline flags, BOL editor predefinedLocations, and route preset selector",
        "Fixed: Exact unicode en-dash and Persian yeh bidirectional aliases",
      ],
    },

    {
      version: "v5.18.4",
      date: "2026-11-12",
      title: "Fix BOL Print Layout to Match A4 Preview 1:1",
      changes: [
        "Added: Full-fidelity A4 preview rendering in PrintPreviewPortal without pdfMode suppression",
        "Added: Guaranteed physical print watermark rendering via dedicated high-contrast image layer",
        "Fixed: Yellow and amber print overrides on party cards, shipment info cards, and contact badges",
        "Fixed: 98% opaque white wash on print sections that covered the background watermark",
      ],
    },

    {
      version: "v5.18.3",
      date: "2026-11-12",
      title: "Fix and Fit Saved BOL Report to See All at Once",
      changes: [
        "Added: Enhanced Saved BOL Report with 5 Executive Glassmorphic KPI Tiles, streamlined Two-Tier Toolbar, 1-click Fit Screen and See All at Once scroll auto-reset, and BiDi-isolated driver cardlets",
        "Fixed: Resolved horizontal table scrolling and column clipping on BOL No, sticky cell transparency issues in Chromium, and unconstrained table expansion",
      ],
    },

    {
      version: "v5.18.2",
      date: "2026-11-12",
      title: "Integrate Jask Port Iran with Full Bilingual & Punctuation-Agnostic Matching",
      changes: [
        "Added: Added Jask Port - Iran (جاسک - ایران) preset, UN/LOCODE IRJSK, Hormozgan maritime metadata, and quick POL button",
        "Fixed: Resolved 0-match results when typing Jask Port with Unicode hyphens, en-dashes, Persian labels, or trailing spaces",
      ],
    },

    {
      version: "v5.18.1",
      date: "2026-11-12",
      title: "Add Jask, Suwaiq, and Sohar Port Information and Corridor Presets",
      changes: [
        "Added: Jask Port (Iran), Suwaiq Port (Oman), and Sohar Port (Oman) metadata, UN/LOCODEs, Persian labels, and 1-click transit corridor preset",
        "Modified: Transit route parser, A4 preview country metadata detection, BOL editor predefinedLocations, and route preset selector",
      ],
    },

    {
      version: "v5.18.0",
      date: "2026-11-12",
      title: "Enterprise Multi-Tier Auto-Saving System",
      changes: [
        "Added: Enterprise 4-Tier Auto-Saving Architecture across Bill of Lading and Invoices with 0ms LocalStorage, SessionStorage isolation mirror, IndexedDB Data Vault, and background server replication",
        "Added: Added lifecycle flush synchronization on beforeunload, pagehide, and visibilitychange with deterministic DraftSaveQueue flush for zero data loss",
        "Added: Fixed BOL editor status badge hierarchy: autoSaveStatus saved displays green checkmark with exact timestamp and click-to-save action",
        "Added: Added multi-document draft isolation in /api/draft with dedicated stores for BOL, Invoices, CMR, and Export Calculator",
        "Fixed: Resolved race condition where uncommitted invoice drafts were cleared on component mount and drafts were overwritten by blank state",
      ],
    },

    {
      version: "v5.17.3",
      date: "2026-11-12",
      title: "Add Jask, Suwaiq, and Sohar Port Information and Corridor Presets",
      changes: [
        "Added: Jask Port (Iran), Suwaiq Port (Oman), and Sohar Port (Oman) metadata, UN/LOCODEs, Persian labels, and 1-click transit corridor preset",
        "Modified: Transit route parser, A4 preview country metadata detection, BOL editor predefinedLocations, and route preset selector",
      ],
    },

    {
      version: "v5.17.2",
      date: "2026-11-12",
      title: "Eliminate Duplicate Logo in BOL Header",
      changes: [
        "Fixed: Conditionally omit standalone circular logo badge when brand lockup embeds emblem to avoid rendering two logos side by side",
      ],
    },

    {
      version: "v5.17.1",
      date: "2026-11-12",
      title: "Fix AI Assistant Gemini network fetch error and add offline engine resilience",
      changes: [
        "Added: Added automatic offline deterministic engine verification and quick-switch action on AI connection test",
        "Fixed: Resolved Gemini network error: fetch failed by unwrapping connect timeouts and adding resilient retry",
      ],
    },

    {
      version: "v5.17.0",
      date: "2026-11-12",
      title: "Enterprise Multi-Tier Auto-Saving System",
      changes: [
        "Added: Enterprise 4-Tier Auto-Saving Architecture across BOL and Invoices with 0ms LocalStorage, SessionStorage isolation mirror, IndexedDB Data Vault, and background server replication",
        "Added: Added lifecycle flush synchronization on beforeunload, pagehide, and visibilitychange with deterministic DraftSaveQueue flush for zero data loss",
        "Added: Fixed BOL editor status badge hierarchy: autoSaveStatus saved displays green checkmark with exact timestamp and click-to-save action",
        "Added: Added multi-document draft isolation in /api/draft with dedicated stores for BOL, Invoices, CMR, and Export Calculator",
        "Fixed: Resolved race condition where uncommitted invoice drafts were cleared on component mount and drafts were overwritten by blank state",
      ],
    },

    {
      version: "v5.16.16",
      date: "2026-11-12",
      title: "Center Commercial Invoice Chamber Fee Lines Symmetrically",
      changes: [
        "Fixed: Centered Commercial Invoice Chamber Fee lines (Reg No, Fee No, Received the sum of, Date, Signature) dead center within the goods description column with gapless 120-hyphen flex fills and calibrated w-[245px] container",
      ],
    },

    {
      version: "v5.16.15",
      date: "2026-11-12",
      title: "Enlarge & Polish Shipment Information Card Header Typography",
      changes: [
        "Added: Enlarged bilingual Shipment Information card headers across all density modes (9.8pt/9.0pt/8.1pt English and 9.6pt/8.8pt/7.9pt Persian/Pashto) with crisp bottom hairline dividers",
        "Fixed: Resolved top text clipping, uneven slash separator sizing (unified 8.4pt), and narrow Issue Date column fit in A4 preview",
      ],
    },

    {
      version: "v5.16.14",
      date: "2026-11-12",
      title: "Fix Commercial Invoice Chamber Block & Summary Alignment Across Preview, Print, PDF, and Word",
      changes: [
        "Fixed: Aligned all five Commercial Invoice Chamber Fee lines (Reg No, Fee No, Received the sum of, Date, Signature) to an exact symmetric centered width with consistent serif typography across Preview, Print, PDF, and Word (.docx)",
        "Fixed: Removed horizontal cell padding gaps on TOTAL C&F and total amount borders so horizontal dividers span edge-to-edge cleanly alongside SKY ARIANA LTD",
        "Fixed: Expanded Invoice and Packing List Goods Table bodies to fill full A4 page height cleanly without awkward bottom margins and fixed PDF Total Amount Say vertical centering",
      ],
    },

    {
      version: "v5.16.13",
      date: "2026-11-12",
      title: "Symmetrically Center Commercial Invoice Chamber Fee Block",
      changes: [
        "Fixed: Placed Received the sum of on its own centered line below Fee No and centered all five Chamber Fee lines symmetrically inside the Description column matching the reference layout across preview, print, PDF, and Word exports",
      ],
    },

    {
      version: "v5.16.12",
      date: "2026-11-12",
      title: "Fix PDF Export Hanging at 50% (Rendering Master Bill of Lading)",
      changes: [
        "Fixed: Replaced hanging html-to-image toCanvas fallback with bounded-timeout lightweight toSvg + html2canvas fallback",
        "Fixed: Added hard capture timeouts on fonts, images, watermark backgrounds, and SVG serialization; converted SVG data URIs to Blob Object URLs and deduplicated embedded font CSS",
      ],
    },

    {
      version: "v5.16.11",
      date: "2026-11-12",
      title: "Fix PDF Download Rainbow Corruption & Enable Native Chromium Vector PDF",
      changes: [
        "Added: Added Chromium native vector printToPDF capture (captureElectronVectorPdf) and pdf-lib page merging for infinite-DPI, searchable text BOL and Report PDFs inside Electron",
        "Added: Enforced live formData in PrintPreviewPortal during export so downloaded vector PDFs always reflect latest edits",
        "Fixed: Fixed GPU VRAM tile readback rainbow stripe corruption on downloaded PDFs by forcing CPU software canvas backing (willReadFrequently: true, alpha: false), clamping raster dimensions within 4096px GPU tile limits, and using safe MEDIUM PNG compression",
      ],
    },

    {
      version: "v5.16.10",
      date: "2026-11-12",
      title: "Ultra-HD Lossless PDF Download Quality Upgrade (576 DPI BOL & 480 DPI Reports)",
      changes: [
        "Added: Upgraded BOL and Shipping Document PDF export rasterization to 576 DPI (ratio 6) with lossless PNG, high-precision canvas smoothing, and precision 16 vector geometry",
        "Added: Added Vazirmatn, NotoNaskhArabic, and NotoSans embedded @font-face font mapping plus vector-preserving SVG asset inlining without 1x bitmap downsampling",
        "Added: Upgraded Saved BOL Report, Report Print Preview Studio, Reports View, and html2pdf exports from 288 DPI lossy JPEG to 480 DPI lossless PNG",
        "Fixed: Fixed SVG logos and watermarks being rasterized at 1x naturalWidth before high-DPI capture",
      ],
    },

    {
      version: "v5.16.9",
      date: "2026-11-12",
      title: "Center Commercial Invoice Chamber Fee Block",
      changes: [
        "Fixed: Horizontally centered Reg No, Fee No, Received sum, Date, and Signature block in Commercial Invoice preview, print, PDF, and Word exports",
      ],
    },

    {
      version: "v5.16.8",
      date: "2026-11-12",
      title: "Complete Oman & Iran Seaports Catalog and Route Filter Fix",
      changes: [
        "Added: Added all Oman ports (Suwaiq, Sohar, Salalah, Duqm, Muscat/Sultan Qaboos, Khasab, Shinas, Sur, Qalhat, Mina Al Fahal, Masirah, Shannah, Khazaen, Dibba, Lima, Al Ashkharah, Raysut, Hasik, Mirbat) and all Iran seaports across Persian Gulf, Sea of Oman, and Caspian Sea",
        "Added: Added dedicated Oman and Iran quick filter tabs, 1-click Shipping Details port presets, and Persian route parser keywords",
        "Fixed: Fixed Suggested Locations popover showing 0 matches when opening pre-filled route stops or switching country filter chips",
      ],
    },

    {
      version: "v5.16.7",
      date: "2026-11-12",
      title: "Move Packing List (Origin Afghanistan) and SKY ARIANA LTD stamp to vertical center matching authentic Word template",
      changes: [
        "Fixed: Centered (Origin Afghanistan) vertically and horizontally in Col 2 across UI, DOCX, and PDF",
        "Fixed: Centered SKY ARIANA LTD signature block vertically and horizontally in Col 3 aligned with Origin",
        "Fixed: Fixed Webpack watchOptions.ignored schema compliance in next.config.mjs",
      ],
    },

    {
      version: "v5.16.6",
      date: "2026-11-11",
      title: "System Performance and UI Responsiveness Optimization",
      changes: [
        "Added: Debounced non-blocking BOL draft persistence, webpack watchOptions ignore patterns, and background interval throttling",
        "Fixed: Fixed 5.8GB heap memory leak in dev server, eliminated forced compositor invalidations on window focus/restore, and resolved keystroke input lag",
      ],
    },

    {
      version: "v5.16.5",
      date: "2026-11-11",
      title: "Fix Wasela and Custom Shipper Data Sync in ACCI Invoice and Packing List",
      changes: [
        "Added: Support custom shipper address, license, contact, notify party, and route stops in ACCI Invoice and Packing List",
        "Fixed: Fixed Sky Ariana default exporter and airway bill title overrides when viewing custom shipper BOLs",
      ],
    },

    {
      version: "v5.16.4",
      date: "2026-11-11",
      title: "Saved BOL Report Fit-to-Screen UI Optimization",
      changes: [
        "Added: Fit to Screen default view and 1-click See All at Once preset button",
        "Added: Streamlined 2-line Truck/Driver, inline multi-item Cargo summary, and compact row height (~36px)",
        "Fixed: Eliminated vertical row bloat and horizontal overflow in Saved BOL Detailed Report",
      ],
    },

    {
      version: "v5.16.3",
      date: "2026-11-11",
      title: "ACCI Commercial Invoice Total Amount Say Centering and UI Elevation",
      changes: [
        "Added: Moved Total Amount Say, amount in words, and origin country up into the vertical center of the goods description column with elevated typography",
        "Fixed: Eliminated bottom cramping in commercial invoice table by cleanly separating centered amount say block from the bottom chamber fee block",
      ],
    },

    {
      version: "v5.16.2",
      date: "2026-11-11",
      title: "Cambria document typography",
      changes: [
        "Modified: Invoice and packing-list preview, print, and DOCX typography now use Cambria",
      ],
    },

    {
      version: "v5.16.1",
      date: "2026-11-10",
      title: "Refine ACCI Invoice chamber layout and Packing List transit headers for 1:1 Word template fidelity",
      changes: [
        "Fixed: Removed outer border box around Chamber block in Invoice UI and PDF to match authentic Word file",
        "Fixed: Aligned Fee No and Received sum on identical horizontal line with tabbed spacing",
        "Fixed: Standardized Packing List transit form title to Afghan Transit form Airway Bill. and Row 3 to Terms of Payment",
      ],
    },

    {
      version: "v5.16.0",
      date: "2026-11-08",
      title: "Gemini 3.8 Structured Extraction & Smart Verification Suite",
      changes: [
        "Added: Gemini active model upgrade to gemini-3.8-flash, gemini-4-argon, and gemini-3.5-flash-lite",
        "Added: Strict OpenAPI/JSON schema-enforced structured extraction for multi-modal BOL and ledger transactions",
        "Added: Deterministic Smart Verification engine for accounting invariance, border station routing, and sanctions compliance",
        "Fixed: Deprecated gemini-2.5-flash and gemini-1.5-* model references with auto-normalizer",
        "Fixed: INVOICE_REGEX word-prefix conflict with invariance and financial audit terms",
      ],
    },

    {
      version: "v5.15.6",
      date: "2026-11-08",
      title: "Align Invoice and Packing List top section with authentic single-cell template",
      changes: [
        "Added: Single-cell dividerless Afghan Transit table in Invoice and Packing List matching authentic chamber template",
        "Fixed: Removed vertical divider lines across Rows 2 and 4 of Afghan Transit table",
        "Fixed: Aligned No and Date paragraphs cleanly above transit table",
        "Fixed: Seamless Notify Party within outer party box without dotted sub-box",
        "Fixed: Resolved ParsedBulkRow typing in structured extraction fallback",
      ],
    },

    {
      version: "v5.15.5",
      date: "2026-11-08",
      title: "ACCI Packing List & Commercial Invoice Exact Pixel-Perfect Design Conformity",
      changes: [
        "Added: Synchronized ACCI Packing List and Commercial Invoice exact-to-exact with official user reference templates across UI preview, vector PDF, and Word docx",
        "Fixed: Removed asterisks from Packing List header, set default layout to classic 3-column Chamber view, added 1/ prefix to packing list numbers, styled blue underlined Chamber box hyperlinks, and aligned stacked TOTAL C&F",
      ],
    },

    {
      version: "v5.15.4",
      date: "2026-11-08",
      title: "Fix on-screen canvas visibility for ACCI Invoice and Packing List",
      changes: [
        "Added: Fixed on-screen document canvas visibility by isolating print portal styles from on-screen preview",
        "Fixed: Resolved blank preview issue caused by invoice-print-root CSS hiding on screen",
      ],
    },

    {
      version: "v5.15.3",
      date: "2026-11-08",
      title: "Pixel-perfect alignment and Same-as-Invoice layout sync for ACCI Invoice and Packing List",
      changes: [
        "Added: Added Same-as-Invoice column layout toggle (NO | Quantity | Description of Goods) for Packing List",
        "Added: Unified document headers, number formats, asterisks styling, and company signature lines",
        "Fixed: Fixed broken company signature wrapping (ARIAN / A LTD), aligned TOTAL C&F baseline, and eliminated repeating chamber box dashes",
      ],
    },

    {
      version: "v5.15.2",
      date: "2026-11-08",
      title: "ACCI Invoice and Packing List exact visual parity with authentic Word templates",
      changes: [
        "Added: Side-by-side top layout with 50/50 flush margin alignment with main goods table",
        "Added: Authentic double line borders on table headers and NO column",
        "Added: Underlined Packing List title with asterisks removed and clean goods table",
        "Added: Official Chamber of Commerce dashed registration box and TOTAL C&F row border alignment",
        "Fixed: Aligned top section margins flush with main table borders",
        "Fixed: Added double borders on headers and NO column",
        "Fixed: Underlined Packing List title with asterisks removed",
        "Fixed: Removed truck and driver clutter from packing list goods table",
        "Fixed: Formatted chamber box with authentic dashed lines and shared TOTAL C&F row border",
      ],
    },

    {
      version: "v5.15.1",
      date: "2026-11-08",
      title: "Fix ACCI Invoice and Packing List layout matching authentic Word templates",
      changes: [
        "Fixed: Side-by-side 2-column top section (party box and transit table)",
        "Fixed: Double horizontal line under main goods table header",
        "Fixed: Continuous vertical table column borders extending to bottom",
        "Fixed: Aligned Chamber of Commerce block, origin line, and company stamps with authentic ACCI Word documents",
      ],
    },

    {
      version: "v5.15.0",
      date: "2026-11-08",
      title: "Automated ACCI Packing List & Commercial Invoice Generation from BOL",
      changes: [
        "Added: Added Packing List and Commercial Invoice navigation tabs directly following Saved BOLs in bol-editor",
        "Added: Automatic synchronization of BOL formData to official ACCI Chamber of Commerce document templates",
        "Added: Pixel-perfect matching of official ACCI Word documents (Kandahar Road and Kabul Air templates)",
        "Added: Authentic Word (.docx) and high-resolution vector PDF export using OpenXML and jsPDF",
        "Added: Integrated ACCI document access into A4 Preview toolbar and Saved BOL cards",
        "Fixed: Bilingual date conversion handling Shamsi/Jalali calendar and Amount in Words for USD",
      ],
    },

    {
      version: "v5.14.1",
      date: "2026-11-08",
      title: "PDF Download UI Fit, Transit Date Colon Spacing, Route Header Badge No-Clip, and Cargo Route Note Typography",
      changes: [
        "Fixed: Transit date colon spacing in PDF header details",
      ],
    },

    {
      version: "v5.14.0",
      date: "2026-11-08",
      title: "Enterprise Security & Biometric Vault UI & Telemetry Overhaul",
      changes: [
        "Added: Real-time Security Posture Score calculation (0-100%) and interactive gauge widget with Argon2id + AES-256 GCM cryptographic badge",
        "Added: Interactive Face Recognition suite with clickable Confidence Threshold selectors (75%/85%/95%), 3D Anti-Spoofing & Liveness detection toggle, low-light gain boost, and neural mesh model status",
        "Added: Interactive Biometric Sensor Testing and instant Verification simulations for Fingerprint, Face Recognition, and Quick PIN",
        "Added: Tactile Quick PIN visual matrix with masked slot indicators and 4-Digit vs 6-Digit format switcher",
        "Added: Master Passlock password criteria policy checklist (8+ chars, upper/lower, numbers, symbols) and real-time matching indicator badge",
        "Added: Expanded Action-Level Security Gate Matrix with batch Arm All / Reset actions and Accounting Invariance Identity Lock (Net = Debit - Credit)",
        "Fixed: Confirm password field show/hide eye toggle (showConfirmPass) and floating Back to Top button layout overlap prevention",
      ],
    },

    {
      version: "v5.13.2",
      date: "2026-11-08",
      title: "Polish Saved BOL Reports Header, Glassmorphic KPI Ribbon & Two-Tier Toolbar",
      changes: [
        "Added: Executive report header with bilingual subtitle, Official Manifest badge, and metadata pills",
        "Added: Five glassmorphic KPI micro-cards with Lucide icon accents and Dari/Pashto labels",
        "Added: Streamlined two-tier toolbar separating batch selection/quick filters from view controls and export suite",
        "Fixed: BiDi text overlap in Truck / Driver table cell via <bdi dir='auto'> isolation and dedicated phone number row",
      ],
    },

    {
      version: "v5.13.1",
      date: "2026-11-08",
      title: "Fix and fit Saved BOL 10-type view switcher and dropdown layout",
      changes: [
        "Added: Streamlined single-pill view switcher, overflow-safe dropdown positioning, clean scrollbar styling, and improved responsive toolbar fitting",
      ],
    },

    {
      version: "v5.13.0",
      date: "2026-11-08",
      title: "Desktop Background & Tray Service System and UI Modernization",
      changes: [
        "Added: Added background runtime diagnostics, test notification balloon bridge, live telemetry drawer, and executive interactive toggle cards",
        "Fixed: Modernized desktop tray settings with high-contrast KPI pillars, active state border lighting, and fixed buildNumber type access",
      ],
    },

    {
      version: "v5.12.0",
      date: "2026-11-08",
      title: "Multi-Device Cloud Sync and Enterprise Backup Hub Upgrade",
      changes: [
        "Added: Dynamic enterprise safe storage quota tier replacing obsolete 5 MB limit",
        "Added: Segmented visual storage breakdown bar for BOLs, ledgers, accounts, and invoices",
        "Added: Real-time accounting invariance verification (Net = Debit - Credit)",
        "Added: Hardened multi-table JSON export with timestamp tracking",
        "Added: Automated pre-restore emergency snapshot with one-click undo rollback",
        "Fixed: Stale hardcoded 58 BOLs in Live Cloud Sync card replaced with dynamic live count",
        "Fixed: Storage progress bar pegged at 100% false alarm resolved",
      ],
    },

    {
      version: "v5.11.0",
      date: "2026-11-08",
      title: "Add 10 distinct viewing modes and responsive view switcher to Saved BOLs",
      changes: [
        "Added: 10 comprehensive viewing options for Saved Bills of Lading: Grid Cards, Detailed List, Master Table, Ultra-Dense Rows, Kanban Pipeline, Chronological Timeline, Financial & Invoicing Ledger, Route & Border Stations, Document Showcase Gallery, and Executive Operations Matrix",
      ],
    },

    {
      version: "v5.10.0",
      date: "2026-11-08",
      title: "Desktop Background & Tray Service System & UI Enhancement",
      changes: [
        "Added: Added background runtime diagnostics, test notification balloon bridge, live telemetry drawer, and executive interactive toggle cards",
        "Fixed: Modernized desktop tray settings with high-contrast KPI pillars, active state border lighting, and fixed buildNumber type access",
      ],
    },

    {
      version: "v5.9.1",
      date: "2026-11-08",
      title: "Make Saved Documents Summary KPI Cards Height Compact",
      changes: [
        "Added: Streamlined Saved Documents summary KPI analytics cards with compact vertical padding and tighter line heights",
        "Fixed: Reduced excessive card height across Total BOLs, Packages, Total Weight, and Goods Value cards while preserving full bilingual metadata",
      ],
    },

    {
      version: "v5.9.0",
      date: "2026-11-08",
      title: "Fix Watermark Previews and Expand Background Gallery",
      changes: [
        "Added: Fixed XML parsing in Above the Clouds, Contour Map, Trade Network, and Harbor Morning; updated Above the Clouds with authentic freighter jet artwork; expanded catalog with 16 new vector and photographic watermark presets",
        "Fixed: Resolved 'Preview Unavailable' in background gallery due to unescaped XML ampersand entities",
      ],
    },

    {
      version: "v5.8.60",
      date: "2026-11-08",
      title: "Elevate LAN Server Architecture & Pairing UI in Settings",
      changes: [
        "Added: Modernized Office LAN Server mode switcher, executive KPI summary cards, and device pairing interface",
        "Fixed: Replaced bare wireframe settings layout with polished enterprise networking cards and empty states",
      ],
    },

    {
      version: "v5.8.59",
      date: "2026-11-08",
      title: "Redesign Server Database Backups & Migration Card",
      changes: [
        "Added: Redesigned Server Database Backups card with executive sans typography, storage vault path pill with copy and open folder shortcuts, live refresh action, and backup download/delete controls",
        "Fixed: Replaced unstyled plain backup card and empty state with executive Sky Ariana design system components, interactive path pill, and loading spinners",
      ],
    },

    {
      version: "v5.8.58",
      date: "2026-11-08",
      title: "Improve LAN Server and Central Node settings UI",
      changes: [
        "Added: Enlarged typography, bilingual Persian labels, prominent inputs, and refined contrast across LAN Server settings",
      ],
    },

    {
      version: "v5.8.57",
      date: "2026-11-07",
      title: "Enlarge Transit Date and Invoice badge typography and enforce sans-serif",
      changes: [
        "Added: Enlarged Transit Date and Invoice header text with bold typography, improved badge spacing, and enforced clean sans-serif font family in PDF download",
      ],
    },

    {
      version: "v5.8.56",
      date: "2026-11-07",
      title: "Enlarge and Improve BOL Page 2 Continuation QR Code",
      changes: [
        "Added: Enhanced Page 2 continuation sheet header with enlarged 14.5mm-17.5mm scannable QR verification badge",
        "Fixed: Resolved microscopic unreadable 18px-20px QR code on BOL continuation sheet (Page 2)",
      ],
    },

    {
      version: "v5.8.55",
      date: "2026-11-07",
      title: "Fix Cargo Row packaging and commodity text in PDF download",
      changes: [
        "Added: Calibrate Cargo Row font sizing to prevent ellipsis truncation of commodity names like BLACK RAISINS and enforce explicit sans-serif typography in PDF download",
      ],
    },

    {
      version: "v5.8.54",
      date: "2026-11-07",
      title: "Enlarge Cargo Row Quantity and Commodity Typography",
      changes: [
        "Added: Enhanced readability with 20pt/17pt/14pt package quantity and scaled commodity font",
        "Fixed: Further enlarged commodity and quantity font rendering in A4 Preview",
      ],
    },

    {
      version: "v5.8.53",
      date: "2026-11-07",
      title: "Enlarge Cargo Row package quantity and commodity text",
      changes: [
        "Added: Enlarged Cargo Row package quantity up to 20pt and commodity subtitle up to 12pt for high-contrast prominent visibility in A4 preview and PDF export",
      ],
    },

    {
      version: "v5.8.52",
      date: "2026-11-07",
      title: "Enlarge Cargo Row Quantity and Commodity Typography",
      changes: [
        "Added: Enhanced readability with 20pt/17pt/14pt package quantity and scaled commodity font",
        "Fixed: Further enlarged commodity and quantity font rendering in A4 Preview",
      ],
    },

    {
      version: "v5.8.51",
      date: "2026-11-07",
      title: "Refine A4 Preview Typography and Single-Line Goods Flow",
      changes: [
        "Added: Enlarged package quantity badge and calibrated commodity font scale",
        "Fixed: Commodity name half-cut in PDF download and multi-line goods description wrapping",
      ],
    },

    {
      version: "v5.8.50",
      date: "2026-11-07",
      title: "Refine and Fit Transit Date & Invoice Header Badge",
      changes: [
        "Added: Proportionally scaled typography and fitted height for the center Transit Date and Invoice capsule in Shipment Information header",
        "Fixed: Prevented badge from overflowing or touching blue header bar borders and eliminated serifed monospace font fallback on Windows",
      ],
    },

    {
      version: "v5.8.49",
      date: "2026-11-07",
      title: "Display invoice number as pure value INV-036 in Shipment Information header",
      changes: [
        "Fixed: Refined Shipment Information header badge to display only the raw invoice number value (e.g. INV-036) without the INVOICE NO: text label or receipt icon, while preserving TRANSIT DATE and high-contrast typography",
      ],
    },

    {
      version: "v5.8.48",
      date: "2026-11-07",
      title: "Improve WhatsApp message center layout",
      changes: [
        "Added: Improved responsive layout, recipient selection, and message editing in the WhatsApp Message Center",
        "Fixed: Prevented dialog header controls and message actions from feeling cramped across viewport sizes",
      ],
    },

    {
      version: "v5.8.47",
      date: "2026-11-07",
      title: "Restore Transit Date and Invoice No in Shipment Information Header",
      changes: [
        "Fixed: Restored multi-source extraction for Transit Date and Invoice No across cargo description, route notes, remarks, and dedicated fields with issue date fallback, and rendered both TRANSIT DATE: and INVOICE NO: labels with high-contrast red typography and micro-icons across screen preview and PDF export",
      ],
    },

    {
      version: "v5.8.46",
      date: "2026-11-07",
      title: "Refine Shipment Information header invoice label and multi-source fallbacks",
      changes: [
        "Added: Added Receipt icon and INVOICE NO label along with regex transit/invoice fallbacks from cargo description",
        "Fixed: Preserve invoice label display and enhance fallback extraction in A4 preview",
      ],
    },

    {
      version: "v5.8.45",
      date: "2026-11-07",
      title: "Unify Description of Goods metadata and item cards into single line",
      changes: [
        "Added: Side-by-side single-line layout for Description of Goods rendering transit date, invoice, and cargo description in one continuous row",
        "Fixed: Prevent Description of Goods single-item cards from breaking onto an unnecessary second row",
      ],
    },

    {
      version: "v5.8.44",
      date: "2026-11-07",
      title: "Enlarge Shipment Overview Header Typography",
      changes: [
        "Added: Enlarged font scaling across Issue Date, Truck Number, Driver Name, and Driver Rent card headers",
        "Fixed: Improved visual prominence and readability of bilingual overview card headers on A4 print and preview",
      ],
    },

    {
      version: "v5.8.43",
      date: "2026-11-07",
      title: "Fix BOL Download PDF layout and typography to match A4 Preview",
      changes: [
        "Added: Fixed BOL Download PDF layout to strictly match A4 Preview: enlarged Transit Date and Invoice No typography in PDF mode, added explicit margin spacing between icons, labels, and values to eliminate text jamming in PDF rasterization, and connected shipmentHeaderDetails to section headers across both single and multi-page layouts",
      ],
    },

    {
      version: "v5.8.42",
      date: "2026-11-07",
      title: "Display Only Invoice Number in A4 Preview Header Badge",
      changes: [
        "Added: Direct invoice number display in shipment overview header badge",
        "Fixed: Removed redundant INVOICE NO: label and receipt icon from header capsule, displaying only the invoice number (e.g. INV-036)",
      ],
    },

    {
      version: "v5.8.41",
      date: "2026-11-07",
      title: "BOL Settings Center Sub-Tab Responsive Wrapping Layout",
      changes: [
        "Added: Responsive flex-wrap navigation strip with executive pill styling for document configuration tabs",
        "Fixed: Prevent clipping of PDF & Print, Defaults, and Backup tabs across split and compact views",
      ],
    },

    {
      version: "v5.8.40",
      date: "2026-11-07",
      title: "Fix BOL Download PDF Product Name Truncation & Quality",
      changes: [
        "Added: Enhanced PDF download image fidelity with MEDIUM compression",
        "Fixed: Commodity product names like BLACK RAISINS display fully in CargoRow without ellipsis cutoff",
      ],
    },

    {
      version: "v5.8.39",
      date: "2026-11-07",
      title: "Fix and polish route timeline cards UI and typography",
      changes: [
        "Added: Clean single-label country badges and frosted icon header in Route Timeline",
        "Fixed: Resolved redundant country code duplication like AF AFGHANISTAN and IN INDIA, microscopic badge fonts, Persian text contrast, and mode pill edge collision",
      ],
    },

    {
      version: "v5.8.38",
      date: "2026-11-07",
      title: "Enlarge Shipment Overview Header Typography",
      changes: [
        "Added: Enlarged font scaling across Issue Date, Truck Number, Driver Name, and Driver Rent card headers",
        "Fixed: Improved visual prominence and readability of bilingual overview card headers on A4 print and preview",
      ],
    },

    {
      version: "v5.8.37",
      date: "2026-11-07",
      title: "Fix Consignee, Shipper & Notify Party Header UI Fit",
      changes: [
        "Modified: Responsive title and action button spacing in Card 02, 03, and 04 with generous corner radius margin",
        "Fixed: Prevent right-edge button overflow and clipping in Consignee, Shipper, and Notify Party card headers across all desktop and laptop viewport widths",
      ],
    },

    {
      version: "v5.8.36",
      date: "2026-11-07",
      title: "Route Preset Selector Filter Toolbar Layout & View Mode Fit",
      changes: [
        "Added: Dedicated full-width Station Tabs rail and fluid search/view mode row",
        "Fixed: Prevent View Mode Toggle and Search input horizontal overflow past card boundary in multi-column dashboards",
      ],
    },

    {
      version: "v5.8.35",
      date: "2026-11-07",
      title: "Fix and Fit Route Preset and Cargo Presets UI",
      changes: [
        "Added: Fitted 2-tier compact route list with bidi-safe destination typography and dynamic transit ports",
        "Added: Container type filter bar upgraded to single-row scrollable rail",
        "Added: 1-Click Cargo Commodity Presets redesigned as responsive interactive card grid",
      ],
    },

    {
      version: "v5.8.34",
      date: "2026-11-07",
      title: "Fix BOL download PDF product name truncation and improve package commodity styling",
      changes: [
        "Added: Added crisp executive commodity pill styling with subtle border and dark contrast typography in A4 Preview package column",
        "Fixed: Calibrated font sizing tiers for PDF mode and screen mode to ensure product names like BLACK RAISINS are never cut off with ellipsis",
      ],
    },

    {
      version: "v5.8.33",
      date: "2026-11-07",
      title: "A4 Preview Issue Date Bilingual Header Fitting",
      changes: [
        "Added: Rebalanced ShipmentOverview grid ratios with tight tracking",
        "Fixed: Prevent ISSUE DATE / تاریخ صدور horizontal clipping on both boundaries",
      ],
    },

    {
      version: "v5.8.32",
      date: "2026-11-07",
      title: "Quick Location Selector UI Fit & Alignment Polish",
      changes: [
        "Added: Enforced uniform h-8 height, single-line whitespace-nowrap, and smooth horizontal scrolling across all regional country tabs",
        "Added: Polished Quick Location Cards with clean icon/flag badge pills, symmetrical bilingual Persian/English alignment, and uniform action buttons",
        "Added: Enhanced search header with search icon, clear button, and bidirectional punctuation isolation",
        "Fixed: Eliminated jagged 4-line tab wrapping and awkward floating text on Windows systems",
      ],
    },

    {
      version: "v5.8.31",
      date: "2026-11-07",
      title: "Enlarge Transit Date and Invoice No badge UI in A4 preview",
      changes: [
        "Added: Redesigned Transit Date and Invoice No badge with executive rounded-full pill, enlarged icons (h-4.5 w-4.5 on screen), 50% larger labels (10pt), and 60% larger bold values (12-13pt) for immediate high-contrast visibility while preserving strict PDF print invariance",
      ],
    },

    {
      version: "v5.8.30",
      date: "2026-11-07",
      title: "Fix dead-code duplicate else-if branches in WhatsApp formatter",
      changes: [
        "Fixed: Remove three unreachable duplicate else-if branches (aqina, sher khan, torkham) in bol-whatsapp-formatter.ts that caused ESLint no-dupe-else-if errors (lint was blocking at 3 errors)",
      ],
    },

    {
      version: "v5.8.29",
      date: "2026-11-07",
      title: "Refine A4 preview transit date and invoice header into executive badge capsule",
      changes: [
        "Added: Refined A4 preview Shipment Information header badge with high-contrast red typography and micro-icons",
        "Fixed: Replace raw oversized red header text with balanced executive badge capsule",
      ],
    },

    {
      version: "v5.8.28",
      date: "2026-11-07",
      title: "Center transit date and invoice number in red on A4 preview shipment header",
      changes: [
        "Added: Centered red transit date and invoice number in A4 preview Shipment Information header",
        "Fixed: Display transit date and invoice number in red with multi-field fallbacks",
      ],
    },

    {
      version: "v5.8.27",
      date: "2026-11-07",
      title: "Project Cleanup, Disk Reclamation and Watermark Polish",
      changes: [
        "Added: Reclaimed 25.46 GB disk space by removing obsolete build caches and archiving legacy workspaces",
        "Added: Cleaned project root from 246 scattered files down to 23 canonical files",
        "Added: Categorized 22 documentation files into docs subdirectories with master index",
        "Added: Organized maintenance, debug, and benchmark scripts into dedicated modules",
        "Fixed: Replaced Airport Cargo Ramp Night watermark with authentic widebody Boeing freighter",
        "Fixed: Corrected mojibake and auto-calculation badges in Section 05 Live Shipment Intelligence",
      ],
    },

    {
      version: "v5.8.26",
      date: "2026-11-07",
      title: "Improve BOL Product Name Readability",
      changes: [
        "Fixed: Enlarge cargo product names and relax letter spacing to make commodity labels clearer",
      ],
    },

    {
      version: "v5.8.25",
      date: "2026-11-07",
      title: "Enlarge BOL Cargo Package Text",
      changes: [
        "Fixed: Slightly enlarge package quantities and commodity names while preserving compact card fitting",
      ],
    },

    {
      version: "v5.8.24",
      date: "2026-11-07",
      title: "Restore BOL Header Logo",
      changes: [
        "Fixed: Show the circular Sky Ariana emblem in the BOL header and use the correct logo fallback asset",
      ],
    },

    {
      version: "v5.8.23",
      date: "2026-11-07",
      title: "Improve BOL PDF Download Quality",
      changes: [
        "Fixed: Prevent invoice and transit date overlap and use lossless 384 DPI PDF page captures",
      ],
    },

    {
      version: "v5.8.22",
      date: "2026-11-07",
      title: "Remove Duplicate Sky Ariana Emblem",
      changes: [
        "Fixed: Show the Sky Ariana logo lockup once in the BOL header",
      ],
    },

    {
      version: "v5.8.21",
      date: "2026-11-07",
      title: "Shipment Information Header Styling",
      changes: [
        "Fixed: Enlarge invoice and transit date text with white labels and red values",
      ],
    },

    {
      version: "v5.8.20",
      date: "2026-11-07",
      title: "Shipment Header Detail Styling",
      changes: [
        "Fixed: Increase and refine the centered red invoice and transit date text",
      ],
    },

    {
      version: "v5.8.19",
      date: "2026-11-07",
      title: "Centered Invoice and Transit Details",
      changes: [
        "Fixed: Show invoice number and transit date centered in red on Shipment Information",
      ],
    },

    {
      version: "v5.8.18",
      date: "2026-11-06",
      title: "Bilingual WhatsApp Driver Rent",
      changes: [
        "Fixed: Include driver rent in bilingual WhatsApp shipment messages",
      ],
    },

    {
      version: "v5.8.17",
      date: "2026-11-06",
      title: "Route Preset Selector Responsive Fitted Layout",
      changes: [
        "Added: Fitted multi-row wrapping for quick shortcuts & container filter pills",
        "Fixed: Prevent horizontal overflow clipping of modifier buttons in RTL mode",
      ],
    },

    {
      version: "v5.8.16",
      date: "2026-11-06",
      title: "Fix location popover off-screen clipping and align perfectly within route stop card",
      changes: [
        "Added: Full-width inset-x-0 containment, mobile-responsive stacked header, and single-row horizontal scrolling country chips in both popover and catalog",
        "Fixed: Popover expanding off the left edge of the screen, chopped-off titles and filter chips, catalog multi-row wrapping",
      ],
    },

    {
      version: "v5.8.15",
      date: "2026-11-06",
      title: "Copy WhatsApp Dropdown & Message Formatting Improvements",
      changes: [
        "Added: Enhanced WhatsApp menu with badges, bilingual subtitles, and direct 1-click contact sending",
        "Added: Enriched WhatsApp templates with transit date, gross weight, and driver rent",
      ],
    },

    {
      version: "v5.8.14",
      date: "2026-11-06",
      title: "Disable Smart Recommendations popover in Transit Stop fields",
      changes: [
        "Fixed: Suppress floating Smart Recommendations popover in Transit Stop inputs so users rely exclusively on the built-in Suggested Locations catalog; isolate cross-category party pooling",
      ],
    },

    {
      version: "v5.8.13",
      date: "2026-11-06",
      title: "Fix and improve Route Location suggestion dropdown and card layout",
      changes: [
        "Added: Responsive auto-filling location card grid with minimum width, single-row horizontally scrollable country filter strip, fixed-header single scroll container, and break-normal typography",
        "Fixed: Squished location cards, character-by-character vertical text breaking, nested double scrollbars, filter chips wrapping into multiple rows",
      ],
    },

    {
      version: "v5.8.12",
      date: "2026-11-06",
      title: "Route Preset Selector Fitted Adaptive UI & High-Density Mode",
      changes: [
        "Added: Compact List mode for Route Preset Selector fitting 10+ routes on screen with sleek single-line rows",
        "Added: Single-row scrollable rail for 9 Border Station tabs and 6 Container Type filters preventing wrapping",
        "Added: Collapsible and categorized quick shortcuts bar with 1-click toggle between routes and modifiers",
        "Fixed: Fixed vertical shortcut button tower and cramped 2-column card wrapping in narrow containers",
      ],
    },

    {
      version: "v5.8.11",
      date: "2026-11-06",
      title: "Fix Electron Minimize Freeze and Splash Stuck Issue",
      changes: [
        "Fixed: Prevent freeze and occlusion hang on window minimize and restore",
        "Fixed: Normalize packaged application URL to 127.0.0.1 and improve startup watchdog",
        "Fixed: Auto-recover Next.js server child process on exit",
        "Fixed: Single line layout for Driver Rent and automatic BOL A4 fit",
      ],
    },

    {
      version: "v5.8.10",
      date: "2026-11-05",
      title: "BOL Driver Rent Card Single-Line Bilingual Header Alignment",
      changes: [
        "Added: Re-aligned DRIVER RENT / کرایه راننده bilingual labels into a clean single-line header on A4 preview",
        "Fixed: Eliminated vertical text stacking in Driver Rent card header to maintain optical balance with truck and date cards",
      ],
    },

    {
      version: "v5.8.9",
      date: "2026-11-05",
      title: "Fix full product name display in BOL PDF export",
      changes: [
        "Fixed: Cargo package card commodity font size and inline scaling calibrated to prevent ellipsis cutoff for long product names",
      ],
    },

    {
      version: "v5.8.8",
      date: "2026-11-05",
      title: "Watermark Toolbar Icon-Only Layout",
      changes: [
        "Added: A4 Preview Toolbar Watermark button converted to compact square icon-only button",
        "Fixed: Removed visible text and percentage badge from button face for a clean minimal toolbar",
      ],
    },

    {
      version: "v5.8.7",
      date: "2026-11-05",
      title: "Fix and fit route location dropdown popover",
      changes: [
        "Added: Full card width route location recommendation popover",
        "Fixed: Eliminated vertical letter-by-letter wrapping and narrow column clamping",
      ],
    },

    {
      version: "v5.8.6",
      date: "2026-11-05",
      title: "Single-Line Driver & Overview Card Labels",
      changes: [
        "Added: Harmonized Driver Name and Driver Rent card header labels into sleek single-line bilingual badges",
        "Fixed: Aligned DRIVER NAME and نام راننده into a single horizontal row with elegant separator",
      ],
    },

    {
      version: "v5.8.5",
      date: "2026-11-05",
      title: "Unify Truck Number Bilingual Header on Single Line",
      changes: [
        "Added: Unified TRUCK NUMBER and Persian/Pashto labels into a single horizontal row",
        "Fixed: Resolved vertical card crunch in A4 preview by condensing truck header into one line",
      ],
    },

    {
      version: "v5.8.4",
      date: "2026-11-05",
      title: "Enlarge CargoRow Package Quantity and Commodity Typography",
      changes: [
        "Added: Increased font size of package count and commodity subtitle in A4 preview CargoRow for optimal legibility",
        "Fixed: Resolved overly small package commodity and quantity typography in A4 print view",
      ],
    },

    {
      version: "v5.8.3",
      date: "2026-11-05",
      title: "Single-Line Bilingual Issue Date Header",
      changes: [
        "Added: Single-line inline bilingual header for Issue Date card in A4 Preview",
        "Fixed: Aligned English and Persian issue date labels on a single line with clean divider slash",
      ],
    },

    {
      version: "v5.8.2",
      date: "2026-11-05",
      title: "Cargo Freighter Jet Watermark Extra Wing Removal",
      changes: [
        "Added: Replaced Cargo Freighter Jet watermark with an authentic, aerodynamically accurate Boeing 777F widebody freighter in flight over sunset clouds",
        "Fixed: Eliminated extra hallucinated wing from Cargo Freighter Jet watermark",
      ],
    },

    {
      version: "v5.8.1",
      date: "2026-11-05",
      title: "Fix and Fit Route Stop Card UI Layout",
      changes: [
        "Fixed: Replaced fragmented route stop action buttons with single-line toolbar, aligned English and Persian location baselines, expanded transport mode pills to full width, and upgraded truck specifications grid to 2 balanced columns",
      ],
    },

    {
      version: "v5.8.0",
      date: "2026-11-05",
      title: "3-Column Side-by-Side BOL Editor Layout",
      changes: [
        "Added: Split Route Stops, Cargo Details, and Live Shipment Intelligence into 3 responsive side-by-side columns",
        "Added: Integrated clean party name sanitization and party directory updates",
        "Fixed: Resolved vertical stacking in BOL Edit form by aligning Route, Cargo Specs, and Shipment Intelligence side-by-side",
      ],
    },

    {
      version: "v5.7.19",
      date: "2026-11-05",
      title: "Promote Cargo & Live Shipment Intelligence Above Route Stops",
      changes: [
        "Added: Positioned Cargo & Live Shipment Intelligence Card directly below Notify Party for streamlined operational flow",
        "Fixed: Eliminated need to scroll past 1,200+ lines of Route Stops to input cargo and weights",
      ],
    },

    {
      version: "v5.7.18",
      date: "2026-11-05",
      title: "Cargo Freighter Jet Watermark Anatomical Accuracy Fix",
      changes: [
        "Added: Replaced Cargo Freighter Jet watermark with an authentic, aerodynamically accurate Boeing 777F widebody freighter in flight over sunset clouds",
        "Fixed: Removed extra hallucinated wing from Cargo Freighter Jet watermark",
      ],
    },

    {
      version: "v5.7.17",
      date: "2026-11-05",
      title: "Make Autosave and Online Status Badges Icon-Only",
      changes: [
        "Fixed: Converted Autosaved and Online status text badges in A4 Preview toolbar into sleek icon-only badges with tooltips",
      ],
    },

    {
      version: "v5.7.16",
      date: "2026-11-05",
      title: "Side-by-Side 3-Column Edit Form Layout",
      changes: [
        "Added: Split Route Stops, Cargo Specifications, and Live Shipment Intelligence into 3 responsive side-by-side columns",
        "Fixed: Resolved vertical stacking in BOL Edit form by aligning Route, Cargo Specs, and Shipment Intelligence side-by-side",
      ],
    },

    {
      version: "v5.7.15",
      date: "2026-11-05",
      title: "Fix Notify Party Persian Subtitle to Render on a Single Line Without Hyphenation",
      changes: [
        "Added: Removed hyphen break in Persian Notify Party label (طرف اطلاع رسانی) and enforced white-space nowrap in A4 preview and PDF export",
        "Fixed: Resolved two-line split (طرف اطلاع- / رسانی) in BOL PDF download and printed documents",
      ],
    },

    {
      version: "v5.7.14",
      date: "2026-11-05",
      title: "Cargo Description Section Header & Transit Route Badge UI Polish",
      changes: [
        "Added: Modernized Cargo Description section header with compact height, frosted icon tile, and sleek Transit Route glassmorphic micro-capsule",
        "Fixed: Optimized section header vertical footprint, eliminated excessive height, and modernized bilingual typography",
      ],
    },

    {
      version: "v5.7.13",
      date: "2026-11-05",
      title: "Fix Product Name Ellipsis Truncation and Improve PDF Download Engine",
      changes: [
        "Added: Upgraded PDF download engine with pre-rasterization font and image decoding readiness and higher fidelity compression",
        "Fixed: Resolved commodity product name truncation in cargo rows by calibrating font scaling",
      ],
    },

    {
      version: "v5.7.12",
      date: "2026-11-05",
      title: "Night Air Dispatch Watermark High-Definition Upgrade",
      changes: [
        "Added: Upgraded Night Air Dispatch watermark and login showcase with authentic high-resolution Boeing 747 freighter apron night loading photograph",
        "Fixed: Eliminated distorted text and AI artifacts on Night Air Dispatch watermark",
      ],
    },

    {
      version: "v5.7.11",
      date: "2026-11-05",
      title: "Fix 3D Metallic and Gold Monogram Seals and Polish BOL Settings Center",
      changes: [
        "Added: Enhanced BOL Settings Center gallery with radial glow framing and unclipped A4 live header preview",
        "Fixed: Restored authentic SKY typography on 3D Metallic Blue Seal and Circular Gold Luxury Seal",
      ],
    },

    {
      version: "v5.7.10",
      date: "2026-11-05",
      title: "Fix Cargo Freighter Jet Watermark Photo and Preview in BOL Settings",
      changes: [
        "Added: Upgraded Cargo Freighter Jet with a high-resolution Sky Ariana branded wide-body aircraft in level flight with complete wings and tail, and perfected thumbnail presentation without distracting corner crop overlays",
        "Fixed: Resolved clipped wings, steep banking angle, and US test livery on Cargo Freighter Jet photo, and eliminated viewfinder crop bracket artifacts in BOL watermark settings",
      ],
    },

    {
      version: "v5.7.9",
      date: "2026-11-05",
      title: "Banknote-Grade Intaglio Watermark Library Modernization",
      changes: [
        "Added: Modernized 12 Mountain and Overland security watermark SVGs with bank-grade intaglio guilloche engravings and high-definition vectors",
        "Fixed: Replaced crude/neon vector placeholders across Alpine Dawn, Golden Summit, Silent Peaks, Silk Road, Border Crossing, and others with banknote security artwork",
      ],
    },

    {
      version: "v5.7.8",
      date: "2026-11-05",
      title: "Fix Account Ledger Logo Designs & High-DPI Showcase Gallery",
      changes: [
        "Fixed: Display complete horizontal corporate logo banners in Account Ledger settings dialog and synchronize header branding",
      ],
    },

    {
      version: "v5.7.7",
      date: "2026-11-05",
      title: "High-definition photographic logistics watermarks in BOL Settings",
      changes: [
        "Added: Replaced 12 cartoonish vector backgrounds in BOL Settings with high-definition realistic photographic logistics watermarks (truck fleet convoys, intermodal freight rail, mountain passes, deep-sea container ships, harbor cranes at dawn, coastal freight, container port terminals, navigation beacons, and sunset anchorage)",
        "Fixed: Replaced crude vector illustrations in BOL settings watermark library with enterprise photographic security watermarks",
      ],
    },

    {
      version: "v5.7.6",
      date: "2026-11-05",
      title: "Remove English transit details from WhatsApp shipment update",
      changes: [
        "Fixed: Removed '🚛 *TRANSIT DETAILS / جزئیات ترانزیت:*' and English transit details from WhatsApp shipment update message, retaining only Persian transit route details",
      ],
    },

    {
      version: "v5.7.5",
      date: "2026-11-05",
      title: "Upgrade BOL settings watermarks with HD photographic transport assets",
      changes: [
        "Added: Replace 7 legacy vector blueprint watermarks with high-definition realistic photographic logistics watermarks",
      ],
    },

    {
      version: "v5.7.4",
      date: "2026-11-05",
      title: "High-definition photographic logistics watermarks in BOL Settings",
      changes: [
        "Added: Replaced 12 cartoonish vector backgrounds in BOL Settings with high-definition realistic photographic logistics watermarks (truck fleet convoys, intermodal freight rail, mountain passes, deep-sea container ships, harbor cranes at dawn, coastal freight, container port terminals, navigation beacons, and sunset anchorage)",
        "Fixed: Replaced crude vector illustrations in BOL settings watermark library with enterprise photographic security watermarks",
      ],
    },

    {
      version: "v5.7.3",
      date: "2026-11-05",
      title: "BOL A4 Preview Dynamic Content Auto-Fit & Density Optimization Engine",
      changes: [
        "Added: Dynamic Content Auto-Fit Scaling Canvas inside A4 Preview with real-time DOM ResizeObserver",
        "Added: Multi-line party address & contact density scoring",
        "Fixed: Bottom signature block clipping and overflow when adding dense BOL content",
      ],
    },

    {
      version: "v5.7.2",
      date: "2026-11-04",
      title: "Fix BOL Download PDF Product Name and Description Display",
      changes: [
        "Added: Dynamic font calibration in No. of Packages preventing ellipsis truncation, and prominent Description of Goods cards display for all commodities",
        "Fixed: Resolved BLACK RAIS... ellipsis cutoff in No. of Packages column and fixed Description of Goods commodity filtering suppression in BOL PDF export",
      ],
    },

    {
      version: "v5.7.1",
      date: "2026-11-04",
      title: "Fix window restore freeze and background minimize lifecycle",
      changes: [
        "Added: Enhanced window restore lifecycle with auto-recovery and power resume invalidation",
        "Fixed: Resolved window freezing when un-minimizing or reopening from system tray by disabling Chromium occlusion backgrounding and invalidating compositor swapchain",
      ],
    },

    {
      version: "v5.7.0",
      date: "2026-11-04",
      title: "Account Ledger Official Logo & Branding Gallery with BOL Sync",
      changes: [
        "Added: Interactive Logo Presets Gallery with 10 design variants, 1-click Sync with BOL Logo, PDF Watermarks with opacity slider, and live A4 document header preview in Account Ledger",
        "Fixed: Replaced rudimentary manual text path inputs in Ledger Settings with modern visual gallery, fixed Modern Flat and 3D logo preview cards to display full brand lockups",
      ],
    },

    {
      version: "v5.6.7",
      date: "2026-11-04",
      title: "Saved BOL Search Engine & Responsive Toolbar Upgrade",
      changes: [
        "Added: Redesigned Saved BOL toolbar into spacious two-tier responsive architecture preventing search input crushing",
        "Added: Added multi-token AND matching, BOL number normalization, and deep logistics indexing",
        "Added: Added Ctrl+K shortcut, live match counter, active search chip, and direct clear button",
        "Fixed: Resolved search input crushing on Saved BOL screen when viewing on desktop",
      ],
    },

    {
      version: "v5.6.6",
      date: "2026-11-04",
      title: "BOL Settings UI & Vintage Stacked Logo Improvements",
      changes: [
        "Added: Fixed authentic vintage stacked logo asset and dynamic chamber preview",
        "Added: Expanded circular seals gallery with 3D Metallic and Gold Luxury presets",
        "Added: Elevated BOL Settings Center navigation tabs and filter badges",
        "Fixed: Resolved horizontal logo preview mismatch on Classic Vintage Stacked card",
      ],
    },

    {
      version: "v5.6.5",
      date: "2026-11-04",
      title: "Added Founding Vintage Heritage (Since 2011) logo preset in BOL Settings",
      changes: [
        "Added: Integrated classic 2011 Sky Ariana founding emblem, three-tier corporate typography lockup, and settings gallery card",
        "Fixed: Synchronized all preset definitions, test assertions, and document header mappings",
      ],
    },

    {
      version: "v5.6.4",
      date: "2026-11-04",
      title: "BOL Dynamic Auto-Adjusting Layout & PDF Download Optimization",
      changes: [
        "Added: Adaptive content compaction for dense BOLs with 4+ route stops, smart pagination, and dynamic stamp scale bounding",
        "Added: High-speed 336+ DPI vector PDF rasterization using toSvg with 30s timeout cap and filter for print controls",
        "Fixed: Resolved vertical overcrowding and overlap between route stops, stamp chamber, and executive footer",
        "Fixed: Fixed stamp control pill floating into route cards and stamp image bleeding outside signature bounds",
      ],
    },

    {
      version: "v5.6.3",
      date: "2026-11-04",
      title: "BOL Settings Logo Design Suite Integration",
      changes: [
        "Added: Expanded BOL Settings Logo & Branding gallery with authentic Modern Typography, Modern Flat Vector, 3D Chrome, and Full Heritage presets",
        "Fixed: Dynamic filter pill counts and transparent rendering across live A4 previews and document headers",
      ],
    },

    {
      version: "v5.6.2",
      date: "2026-11-04",
      title: "Enhanced logo design presets and full-width gallery showcase in BOL Settings",
      changes: [
        "Added: Replaced empty circular previews with full-width corporate logo lockups and true 3D chrome metallic design",
        "Fixed: Corrected 3D metallic lockup URL mapping to prevent duplicate circular emblem on BOL header",
      ],
    },

    {
      version: "v5.6.1",
      date: "2026-11-04",
      title: "Vector-grade Sky Ariana branding upgrade and high-definition logo suite",
      changes: [
        "Added: Regenerated mathematically perfected circular SKY emblem and high-DPI brand lockup",
        "Fixed: Eliminated raster pixelation, uneven stroke widths, and compression halos in company header",
      ],
    },

    {
      version: "v5.6.0",
      date: "2026-11-04",
      title: "Multi-Design Logo & Vintage Heritage Brand Selector",
      changes: [
        "Added: BOL Settings Logo Design Gallery with Vintage Old Logo presets (horizontal and stacked), Modern 3D Metallic Gloss, Modern Flat Vector, and Circular Seal with Live A4 Preview",
        "Fixed: Header logo lockup dynamic switching across BOL editor, live preview, print, and PDF exports",
      ],
    },

    {
      version: "v5.5.15",
      date: "2026-11-04",
      title: "Shipper Directory UI & Data Healing",
      changes: [
        "Added: Enhanced Party Directory Modal with Edit Drawer, missing info alerts, and copy actions",
        "Fixed: Restored missing Rahmat Nazar Ltd address and prevented empty string overwrite in directory merge",
      ],
    },

    {
      version: "v5.5.14",
      date: "2026-11-04",
      title: "A4 Preview Cargo Description Single-Row Fit & Spacing Polish",
      changes: [
        "Added: Sleek single-row horizontal ribbon when only cargo metadata exists to guarantee single-page screen fit",
        "Fixed: Eliminated redundant empty card space beneath meta chips and replaced invalid Tailwind spacing utilities with standard spacing",
      ],
    },

    {
      version: "v5.5.13",
      date: "2026-11-04",
      title: "Refine Sky Ariana Logo Badge and Header Typography",
      changes: [
        "Added: High-definition 1024x1024 circular emblem and tightly cropped brand lockup",
        "Fixed: Edge-to-edge logo badge without halo and high-contrast registration details",
      ],
    },

    {
      version: "v5.5.12",
      date: "2026-11-02",
      title: "Fix Consignee and Party Cards Header UI Fit",
      changes: [
        "Fixed: Fit all 4 action buttons (Swap, Notify, Order, Clear) and section title in Consignee Card header on single row with no clipping",
      ],
    },

    {
      version: "v5.5.11",
      date: "2026-11-01",
      title: "Fix Consignee UI Card Header Overflow & Add Multi-Modal Presets",
      changes: [
        "Added: Added international port presets (Nhava Sheva, Mersin, Hamriyah, Sohar) to Consignee card",
        "Added: Expanded address quick-append city chips with Turkey, UAE, Oman, and India hubs",
        "Fixed: Consignee card header button clipping on right edge with compact h-7 single-row layout",
      ],
    },

    {
      version: "v5.5.10",
      date: "2026-11-01",
      title: "Enlarge Sky Ariana Header Brand Lockup and Optimize Layout",
      changes: [
        "Added: High-definition Sky Ariana brand identity lockup across screen, print, and PDF",
        "Fixed: Enlarged centered brand lockup to 31mm and increased container min-height to 40mm to prevent text clipping",
      ],
    },

    {
      version: "v5.5.9",
      date: "2026-11-01",
      title: "International Multi-Modal Transit Routes (Mersin, Hamriya, Sohar, Jebel Ali)",
      changes: [
        "Added: Multi-modal transit route presets for Mersin, Hamriya, Sohar, and Jebel Ali ports",
        "Added: Quick route modifier chips and port switcher in RoutePresetSelector",
        "Fixed: Bi-directional formatting and port recognition in transit-route-parser",
      ],
    },

    {
      version: "v5.5.8",
      date: "2026-11-01",
      title: "Enhanced Bill of Lading Party Cards UI & Header Polish",
      changes: [
        "Added: Modern unified party cards with themed color accents, streamlined directory actions, and Arrival Notice helper",
        "Fixed: Header action wrap in Consignee card, redundant directory full-browse buttons, vertical card height imbalance",
      ],
    },

    {
      version: "v5.5.7",
      date: "2026-11-01",
      title: "Party Cards UI Overhaul & Official Sky Ariana Brand Lockup",
      changes: [
        "Added: Integrated official Sky Ariana brand lockup graphic in A4 BOL header with high-contrast Kufic Arabic and English typography",
        "Added: Redesigned Shipper, Consignee, and Notify Party cards with enlarged typography, dedicated phone and mail icons, and styled preset chips",
        "Fixed: Resolved Consignee header wrapping bug by enforcing flex-nowrap on card actions bar",
        "Fixed: Aligned all party card directory and autocomplete controls with high-visibility font weights",
      ],
    },

    {
      version: "v5.5.6",
      date: "2026-11-01",
      title: "Bottom BOL Tracking Barcode",
      changes: [
        "Added: Added scannable Code 128 barcode encoding the B/L number with human-readable text at the bottom of the Bill of Lading",
        "Added: High-density vector SVG rendering with crispEdges and optical quiet zones",
        "Fixed: Multi-page continuation sheet and single-page barcode synchronization across preview and PDF export",
      ],
    },

    {
      version: "v5.5.5",
      date: "2026-11-01",
      title: "Fix PDF Download Package Commodity Truncation & Footer Overlap",
      changes: [
        "Added: Isolated bidirectional parentheses in Persian route directives and auto-healed repeated Iran transit office prefixes",
        "Fixed: Preserved full commodity subtitles (e.g. DRY FIGS) in downloaded PDFs, prevented Executive footer company title from wrapping over HEAD OFFICE, and replaced all legacy logos with official Sky Ariana monogram emblem",
      ],
    },

    {
      version: "v5.5.4",
      date: "2026-11-01",
      title: "Update Sky Ariana Brand Logo Design",
      changes: [
        "Added: Modernized Sky Ariana corporate circular emblem in BOL header and documents",
        "Added: Full high-resolution branding assets (emblem, horizontal lockup, and full logo)",
        "Fixed: Aligned official Persian company name typography with new brand identity",
      ],
    },

    {
      version: "v5.5.3",
      date: "2026-11-01",
      title: "Fix BOL PDF Download Text Clipping & RTL Overlap",
      changes: [
        "Fixed: Package subtitle commodity text truncation (DRY FIGS preserved without line break)",
        "Fixed: Rate and Goods Value currency USD right border clipping in A4 and PDF exports",
        "Fixed: Executive footer company title wrapping over HEAD OFFICE in dense PDF documents",
        "Fixed: Cargo route directive bidirectional parenthesis collision and duplicate Iran office prefix",
      ],
    },

    {
      version: "v5.5.2",
      date: "2026-10-29",
      title: "PDF Footer Layout Fix & Route BiDi Normalization",
      changes: [
        "Added: Bidi isolation with <bdi> and auto-healing for mixed Persian/English route banners",
        "Fixed: PDF footer SKY ARIANA LIMITED overlap on HEAD OFFICE, duplicate IRAN TRANSIT OFFICE prefix, and reversed parentheses/split Persian words in route banner",
      ],
    },

    {
      version: "v5.5.1",
      date: "2026-10-27",
      title: "NSIS Upgrade Shield & Uninstaller Error 2 Bypass",
      changes: [
        "Added: Added NSIS customUnInstallCheck, customUnInstallCheckCurrentUser, preInit, customInit, and customRemoveFiles hooks",
        "Fixed: Resolved uninstaller exit code 2 crash ('Failed to uninstall old application files: 2') by introducing customUnInstallCheck & process termination shield",
      ],
    },

    {
      version: "v5.5.0",
      date: "2026-10-27",
      title: "Desktop Background Operation & System Tray Service",
      changes: [
        "Added: Enterprise Windows System Tray integration with 24/7 resident background operation on window close",
        "Added: Windows silent auto-launch support (--hidden flag) on system boot",
        "Added: Minimize to Tray functionality and native Windows notification balloons",
        "Added: Bilingual English and Dari/Pashto background settings control card in Settings view",
        "Fixed: Window close event interceptor cleanly preserving background SQLite and Next.js processes without termination",
      ],
    },

    {
      version: "v5.4.18",
      date: "2026-10-27",
      title: "Modern Windows 11 NSIS Installer UI Design Overhaul",
      changes: [
        "Added: Enterprise Core Architecture showcase card filling installation empty void, royal blue modern progress bar with uxtheme decoupling, clean white background, Segoe UI typography, and 2X high-DPI graphics",
        "Fixed: NSIS Installing page empty gray void, classic Win98 green progress bar styling, cramped installer header text, Electron TypeScript minimize event handler",
      ],
    },

    {
      version: "v5.4.17",
      date: "2026-10-27",
      title: "Fix and improve WhatsApp copy message formatting, direct sharing, and toolbar actions",
      changes: [
        "Added: Direct WhatsApp Web deep-link dispatch, recipient phone selector (Driver/Consignee/Shipper), expanded bilingual commodities, message metrics with reset, mounted CopyWhatsAppButton on BOL Editor action bar",
        "Fixed: Persian commodity extraction, table metadata leakage in cargo summary, glued truck plates, direct invoice number resolution",
      ],
    },

    {
      version: "v5.4.16",
      date: "2026-10-27",
      title: "In-System Fingerprint Scanner & Software Biometric Vault",
      changes: [
        "Added: Interactive Biometric Fingerprint Scanner HUD with laser sweep, multi-finger selection, and software vault storage",
        "Fixed: Resolved WebAuthn invalid domain error on 127.0.0.1 and Electron desktop runtime; added direct in-system fingerprint capture and unlock",
      ],
    },

    {
      version: "v5.4.15",
      date: "2026-10-27",
      title: "Fix Windows Hello biometric 'This is an invalid domain' error in packaged exe",
      changes: [
        "Fixed: Vault fingerprint unlock now loads the app via localhost so Windows Hello/WebAuthn accepts the RP domain; raw domain errors replaced with a friendly bilingual fallback pointing to PIN/Password",
      ],
    },

    {
      version: "v5.4.14",
      date: "2026-10-26",
      title: "Enlarge A4 preview Exporter, Consignee, and Notify Party typography",
      changes: [
        "Added: Enlarged business information typography in Exporter, Consignee, and Notify Party cards (titles, company names, addresses, contacts)",
        "Modified: Scaled up party card typography in app/globals.css and components/bill-of-lading/a4-preview.tsx",
      ],
    },

    {
      version: "v5.4.13",
      date: "2026-10-26",
      title: "Smart Recommendations on Word Typing & Autocomplete Optimization",
      changes: [
        "Added: Multi-word and word-boundary prefix matching with highlighted search matches",
        "Added: Bilingual Dari/Persian unicode normalization and directory party profile auto-fill",
        "Fixed: Prevent recommendations popover from opening on empty input focus",
        "Fixed: Trigger smart recommendations dynamically only when words are typed",
      ],
    },

    {
      version: "v5.4.12",
      date: "2026-10-26",
      title: "Fix Software Updater Hanging on Stdin Pipe and Black Window",
      changes: [
        "Fixed: Eliminated deadlocking tasklist/find pipe on detached stdin in external update runner",
        "Fixed: Suppressed black terminal window popup by enabling windowsHide on background update runner",
        "Fixed: Replaced input-redirection sensitive timeout with reliable non-blocking network ping delay",
      ],
    },

    {
      version: "v5.4.11",
      date: "2026-10-26",
      title: "Release v5.4.11 with PDF Download & A4 Header Text Fixes",
      changes: [
        "Added: Package production Windows installer (AQ-COMPANIES-Setup.exe) and publish update manifest for 1-click in-app update delivery",
        "Fixed: Prevent text wrapping and bottom-edge clipping in downloaded PDF for TOTAL WEIGHTS (NET WT / GROSS WT), Description of Goods header, Route / Transportation Path, Cargo Description, and Exporter Contacts blue section bars",
      ],
    },

    {
      version: "v5.4.10",
      date: "2026-10-26",
      title: "Fix Lingering Directory and Preset Selections on New BOL",
      changes: [
        "Fixed: Cleared lingering party, preset, and border station selections when creating a new BOL",
        "Fixed: Guarded directory dropdowns and action buttons so empty form fields never display lingering selections",
        "Fixed: Synchronized preset selection state with loaded BOL document records",
      ],
    },

    {
      version: "v5.4.9",
      date: "2026-10-25",
      title: "Fix Download PDF Text Wrapping & Section Header UI Clipping",
      changes: [
        "Added: Enforce strict whitespace-nowrap and flex-shrink-0 across PDF and A4 print section headers, rebalance cargo grid proportions for optimal weight value fitting, and eliminate line breaking in high-DPI canvas exports",
        "Fixed: Prevent text wrapping and bottom-edge clipping in downloaded PDF for TOTAL WEIGHTS (NET WT / GROSS WT), Description of Goods header, Route / Transportation Path, Cargo Description, and Exporter Contacts blue section bars",
      ],
    },

    {
      version: "v5.4.8",
      date: "2026-10-25",
      title: "Fix Minified React Error #185 in Settings View",
      changes: [
        "Fixed: Resolved infinite re-render loop in useSyncExternalStore by stabilizing settings snapshot",
        "Fixed: Wrapped localStorage storageStats in resilient try-catch",
      ],
    },

    {
      version: "v5.4.7",
      date: "2026-10-25",
      title: "Refine Afghan Truck License Plate Font, Proportions, and Column Alignment",
      changes: [
        "Fixed: Modernized Latin plate font stack to Bahnschrift/DIN stamped plate typography",
        "Fixed: Harmonized Persian and Latin numeral optical size proportions",
        "Fixed: Enforced 1:1 vertical column alignment for individual plate digits",
      ],
    },

    {
      version: "v5.4.6",
      date: "2026-10-25",
      title: "Fix header navigation overflow clipping and suite active icons",
      changes: [
        "Modified: Calibrated Dashboard and Protection pill breakpoints, dynamic suite icons for active modules, and ServerStatusPill text display",
        "Fixed: Resolved navigation horizontal overflow clipping of Settings/Docs & Tools on 1536px laptop screens",
      ],
    },

    {
      version: "v5.4.5",
      date: "2026-10-25",
      title: "Enlarge and improve A4 Preview cargo row typography and pills",
      changes: [
        "Added: Enlarged A4 preview cargo sub-card typography for NET, GROSS, NET WT, GROSS WT, RATE, and VALUE labels and numeric values",
        "Modified: Upgraded pill containers with rounded-md and distinct high-contrast color borders, tabular numbers, and font-black weights",
      ],
    },

    {
      version: "v5.4.4",
      date: "2026-10-25",
      title: "Container Details & Shipping Details Ergonomic Responsive Grid Fix",
      changes: [
        "Fixed: Resolved horizontal squash of Container Details inputs into spacious responsive grid",
        "Fixed: Resolved text truncation of Port of Loading and Discharge via shipping-fields-grid",
      ],
    },

    {
      version: "v5.4.3",
      date: "2026-10-25",
      title: "Race-tolerant BOL sequence tests for live-data environments",
      changes: [
        "Fixed: bol-sequence tests #8 and #9 now tolerate live BOL allocation during validation: #8 retries the scan/peek pair, #9 asserts the hard invariant (next strictly greater than the advanced target) instead of an exact +1",
        "Fixed: Both suites keep the hard anti-collision invariant: next available BOL never falls behind highest existing + 1",
      ],
    },

    {
      version: "v5.4.2",
      date: "2026-10-25",
      title: "Race-tolerant BOL sequence test for live-data environments",
      changes: [
        "Fixed: bol-sequence test #8 retries the scan/peek pair and asserts the hard invariant (next number never behind highest+1), so BOLs created by the running app during validation no longer flake releases",
      ],
    },

    {
      version: "v5.4.1",
      date: "2026-10-25",
      title: "Race-tolerant BOL sequence test for live-data environments",
      changes: [
        "Fixed: bol-sequence test #8 retries the scan/peek pair and asserts the hard invariant (next number never behind highest+1), so BOLs created by the running app during validation no longer flake releases",
      ],
    },

    {
      version: "v5.4.0",
      date: "2026-10-25",
      title: "Multi-Modal Biometric Security Vault, IndexedDB Engine & Settings Redesign",
      changes: [
        "Added: Enterprise 12-column Bento Grid Security & Passwords suite with WebAuthn Touch ID, Face Recognition, Quick PIN, and Action Gates",
        "Added: Full-screen un-bypassable frosted glass WorkspaceLockOverlay with Cmd+L hotkey and inactivity auto-lock",
        "Added: Zero-loss dual-layer saving state machine with instant IndexedDB persistence, floating save bar, and sync queue popover",
        "Added: Modernized macOS Sequoia settings shell with Cmd+K search highlighting and live sidebar micro-badges",
      ],
    },

    {
      version: "v5.3.6",
      date: "2026-10-25",
      title: "BOL editor watermark gallery aligned with settings panel card design",
      changes: [
        "Fixed: Editor watermark picker cards: Selected pill replaces the format tag (matching Settings), titles clamp to two lines with tooltip, Recommended label spelled out",
      ],
    },

    {
      version: "v5.3.5",
      date: "2026-10-25",
      title: "BOL editor watermark gallery aligned with settings panel card design",
      changes: [
        "Fixed: Editor watermark picker cards: Selected pill replaces the format tag (matching Settings), titles clamp to two lines with tooltip, Recommended label spelled out",
      ],
    },

    {
      version: "v5.3.4",
      date: "2026-10-25",
      title: "BOL Settings watermark gallery visual overhaul",
      changes: [
        "Fixed: Photo watermark thumbnails now fill the A4 paper frame edge-to-edge (object-cover) like they actually print, instead of floating tiny inside white margins; vector SVG art keeps full-page contain",
        "Fixed: Gallery card titles no longer truncate mid-word (two-line clamp with tooltip) and the Recommended opacity badge is spelled out instead of cryptic 'Rec:'",
        "Fixed: Selected watermark card shows a single clean 'Selected' pill in place of the format tag; favorite star no longer crowded",
      ],
    },

    {
      version: "v5.3.3",
      date: "2026-10-25",
      title: "BOL Settings watermark gallery visual overhaul",
      changes: [
        "Fixed: Photo watermark thumbnails now fill the A4 paper frame edge-to-edge (object-cover) like they actually print, instead of floating tiny inside white margins; vector SVG art keeps full-page contain",
        "Fixed: Gallery card titles no longer truncate mid-word (two-line clamp with tooltip) and the Recommended opacity badge is spelled out instead of cryptic 'Rec:'",
        "Fixed: Selected watermark card shows a single clean 'Selected' pill in place of the format tag; favorite star no longer crowded",
      ],
    },

    {
      version: "v5.3.2",
      date: "2026-10-25",
      title: "AQ Companies brand favicon and app icon set",
      changes: [
        "Fixed: Browser tab showed the default v0 placeholder favicon; replaced with AQ monogram brand icon set (favicon.ico, light/dark 32px, 192/512, maskable, apple-touch, SVG, Electron app-icon.ico/png) generated from the master logo, plus missing apple-touch-icon.png now provided",
      ],
    },

    {
      version: "v5.3.1",
      date: "2026-10-25",
      title: "Truck number plate typography matched to official Afghan plate reference",
      changes: [
        "Added: Latin plate row (digits, province code, category letter) switched from condensed DIN/Bahnschrift to wide heavy Arial Black grotesque matching the official Kabul plate photo",
        "Added: Persian digit tracking widened to match reference spacing",
      ],
    },

    {
      version: "v5.3.0",
      date: "2026-10-25",
      title: "Global Smart Input Layer & Workspace Security",
      changes: [
        "Added: GlobalSmartInputLayer: smart-typing assistance wired into workspace inputs with per-input type handling and direction-aware rendering.",
        "Added: Smart predictor and grammar-and-polish engines (lib/smart) with a Smart Typing settings card in the editor settings.",
        "Added: Workspace lock overlay security component for locking the workspace during inactivity or manual lock.",
        "Added: Regenerated brand icon set (app icon, favicon, maskable/light/dark icons, AQ monogram) via scripts/generate-brand-icons.cjs.",
        "Modified: Watermark settings panel and watermark thumbnail refinements.",
      ],
    },

    {
      version: "v5.2.11",
      date: "2026-10-25",
      title: "AQ Companies brand favicon and app icon set",
      changes: [
        "Fixed: Browser tab showed the default v0 placeholder favicon; replaced with AQ monogram brand icon set (favicon.ico, light/dark 32px, 192/512, maskable, apple-touch, SVG, Electron app-icon.ico/png) generated from the master logo, plus missing apple-touch-icon.png now provided",
      ],
    },

    {
      version: "v5.2.10",
      date: "2026-10-25",
      title: "Tighter Persian Digit Spacing on Vehicle Plates",
      changes: [
        "Fixed: Reduced digitGapFa from 0.12-0.16em to a uniform 0.02em across all six plate size variants so the Persian numerals are optically as snug as the Latin row.",
      ],
    },

    {
      version: "v5.2.9",
      date: "2026-10-25",
      title: "Top bar version badge accuracy and suite-row overflow fix",
      changes: [
        "Fixed: Header version badges now read SYSTEM_RELEASE_LABEL instead of hardcoded v5.1 / v5.1.0 (logo badge + user menu)",
        "Fixed: Ask AI quick pill gated to >=1600px and CRM label kept compact, so the suite row no longer clips the active module pill (e.g. Backup & DR) mid-word on 1536-1600px screens",
      ],
    },

    {
      version: "v5.2.8",
      date: "2026-10-25",
      title: "Modern Persian Typography App-Wide (Genuine Vazirmatn)",
      changes: [
        "Modified: Noto Naskh Arabic remains bundled and available as an explicit fallback family for stacks that request it.",
        "Fixed: Replaced the fake Vazirmatn alias with real Vazirmatn-Bold.ttf (weights 700-900) and Vazirmatn-Regular.ttf (weights 100-700) faces, giving Persian UI text and print documents clean, consistent modern typography with proper regular-weight rendering.",
      ],
    },

    {
      version: "v5.2.7",
      date: "2026-10-25",
      title: "Dark theme polish for Staff Roles & Permissions screens",
      changes: [
        "Fixed: Staff Users, Roles, Permission Matrix, Approval Rules, Approval Inbox, Audit Log and their modals now render correctly in dark mode (cards, inputs, selects, badges, table and buttons were hard-coded light)",
      ],
    },

    {
      version: "v5.2.6",
      date: "2026-10-25",
      title: "Authentic Vehicle Plate Persian Typography",
      changes: [
        "Modified: Bundled Vazirmatn-Bold.ttf and Vazirmatn-Regular.ttf with their SIL OFL license in public/fonts.",
        "Fixed: The AfghanPlateFa @font-face pointed at NotoNaskhArabic-Bold.ttf, so plate numbers rendered in heavy traditional Naskh that clashed with the DIN-style Latin row; it now loads the genuine Vazirmatn font for clean, vertically consistent plate typography.",
      ],
    },

    {
      version: "v5.2.5",
      date: "2026-10-25",
      title: "Header Search Bar Icon-Only Trigger",
      changes: [
        "Modified: GlobalSearch desktop trigger reduced to a compact icon-only button with tooltip discoverability.",
        "Modified: Header no longer passes the wide pill className; single icon-only trigger serves all breakpoints.",
      ],
    },

    {
      version: "v5.2.4",
      date: "2026-10-25",
      title: "Mobile UI overflow fixes: toolbar zoom clipping, select overflow, dashboard header wrap",
      changes: [
        "Fixed: A4 preview toolbar zoom controls no longer clip past the right edge on mobile/tablet (nav+appearance cluster now wraps and centers)",
        "Fixed: Select triggers no longer overflow their cards with long values (max-width guard + truncation, directory and vehicle preset selects full-width)",
        "Fixed: Dashboard and Saved 'LATEST BOL CREATIONS' header no longer stacks text vertically on phones",
      ],
    },

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
