const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

test("Saved BOL Report UI Polish: Executive header, glassmorphic KPI ribbon, two-tier toolbar & truck cardlet", async (t) => {
  const rootDir = path.resolve(__dirname, "..");
  const reportPath = path.join(rootDir, "components", "reports", "saved-bol-report.tsx");
  const tablePath = path.join(rootDir, "components", "reports", "detailed-report-table.tsx");

  assert.ok(fs.existsSync(reportPath), "saved-bol-report.tsx must exist");
  assert.ok(fs.existsSync(tablePath), "detailed-report-table.tsx must exist");

  const reportSrc = fs.readFileSync(reportPath, "utf-8");
  const tableSrc = fs.readFileSync(tablePath, "utf-8");

  await t.test("1. Report Header has executive styling, icons, bilingual subtitle and metadata pills", () => {
    // data-report-header must be preserved for print strip logic
    assert.ok(reportSrc.includes('data-report-header="true"'), "Must retain data-report-header attribute");
    assert.ok(reportSrc.includes("ShieldCheck"), "Must use ShieldCheck icon in header");
    assert.ok(reportSrc.includes("Clock"), "Must use Clock icon in header for generation time");
    assert.ok(reportSrc.includes("FileCheck"), "Must use FileCheck icon for audited scope");
    assert.ok(reportSrc.includes("Official Manifest"), "Must display Official Manifest badge");
    assert.ok(reportSrc.includes("گزارش جامع بارنامه‌های بین‌المللی"), "Must include bilingual Pashto/Dari title");
    assert.ok(reportSrc.includes("Verified Read-Only"), "Must retain verified status badge");
  });

  await t.test("2. Detailed Report Table aggregate summary banner renders 5 glassmorphic KPI cards", () => {
    assert.ok(tableSrc.includes("EXECUTIVE GLASSMORPHIC KPI TILES"), "Must have executive glassmorphic summary banner");
    assert.ok(tableSrc.includes("Filtered BOLs"), "Card 1: Filtered BOLs");
    assert.ok(tableSrc.includes("Total Packages"), "Card 2: Total Packages");
    assert.ok(tableSrc.includes("Total Net Weight"), "Card 3: Total Net Weight");
    assert.ok(tableSrc.includes("Total Gross Weight"), "Card 4: Total Gross Weight");
    assert.ok(tableSrc.includes("Total Value"), "Card 5: Total Declared Value");

    // Icon accents
    assert.ok(tableSrc.includes("<Scale"), "Must render Scale icon for weight");
    assert.ok(tableSrc.includes("<DollarSign"), "Must render DollarSign icon for value");
    assert.ok(tableSrc.includes("<Truck"), "Must render Truck icon for gross weight");
    assert.ok(tableSrc.includes("<Boxes"), "Must render Boxes icon for package count");
    assert.ok(tableSrc.includes("<FileText"), "Must render FileText icon for filtered BOLs");

    // Bilingual micro-labels
    assert.ok(tableSrc.includes("بارنامه‌های فیلترشده"), "Must include Pashto/Dari for filtered BOLs");
    assert.ok(tableSrc.includes("مجموع کارتن‌ها"), "Must include Pashto/Dari for total cartons");
    assert.ok(tableSrc.includes("مجموع وزن خالص"), "Must include Pashto/Dari for net weight");
    assert.ok(tableSrc.includes("مجموع وزن ناخالص"), "Must include Pashto/Dari for gross weight");
    assert.ok(tableSrc.includes("ارزش مجموعی اجناس"), "Must include Pashto/Dari for declared value");
  });

  await t.test("3. Detailed Report Table provides streamlined two-tier toolbar", () => {
    assert.ok(tableSrc.includes("STREAMLINED TWO-TIER TOOLBAR"), "Must have streamlined two-tier toolbar");
    assert.ok(tableSrc.includes("TIER 1: Batch Selection & Quick Filter Ribbon"), "Must have Tier 1 ribbon");
    assert.ok(tableSrc.includes("TIER 2: View Configurations & Export Action Suite"), "Must have Tier 2 bar");

    // Tier 1 controls
    assert.ok(tableSrc.includes("Select Page"), "Tier 1 must include Select Page checkbox");
    assert.ok(tableSrc.includes("Select All"), "Tier 1 must include Select All Filtered BOLs button");
    assert.ok(tableSrc.includes("Clear ("), "Tier 1 must include Clear selection button");
    assert.ok(tableSrc.includes("❄️ Reefer"), "Tier 1 must include Reefer quick filter chip");
    assert.ok(tableSrc.includes("📦 Dry"), "Tier 1 must include Dry quick filter chip");
    assert.ok(tableSrc.includes("⚠️ Missing Docs"), "Tier 1 must include Missing Docs quick filter chip");

    // Tier 2 controls
    assert.ok(tableSrc.includes("<ColumnCustomizer"), "Tier 2 must include Column Customizer");
    assert.ok(tableSrc.includes("Compact"), "Tier 2 must include density toggle Compact");
    assert.ok(tableSrc.includes("Normal"), "Tier 2 must include density toggle Normal");
    assert.ok(tableSrc.includes("Rows:"), "Tier 2 must include Rows per page selector");
    assert.ok(tableSrc.includes("Full Details"), "Tier 2 must include Wide Scroll toggle");
    assert.ok(tableSrc.includes("Expand All"), "Tier 2 must include Expand All toggle");
    assert.ok(tableSrc.includes("onPrintReport"), "Tier 2 must include Print button");
    assert.ok(tableSrc.includes("onDownloadPdf"), "Tier 2 must include Download PDF button");
    assert.ok(tableSrc.includes("onExportExcel"), "Tier 2 must include Excel button");
  });

  await t.test("4. Truck / Driver cell uses BiDi isolation, dedicated phone row, and transport plate badge", () => {
    assert.ok(tableSrc.includes('data-col-id="truckDriver"'), "Must preserve data-col-id='truckDriver'");
    assert.ok(tableSrc.includes("<bdi"), "Must isolate driver and father names with <bdi> to prevent text collision");
    assert.ok(tableSrc.includes('dir="auto"'), "Must use dir='auto' on bidi isolation");
    assert.ok(tableSrc.includes("dir=\"ltr\""), "Must enforce dir='ltr' for truck plate and driver phone number");
    assert.ok(tableSrc.includes("Phone className="), "Must render dedicated phone icon");
    assert.ok(tableSrc.includes("Driver Rent / کرایه موتر"), "Must retain driver rent badge title");
    assert.ok(tableSrc.includes("Transit Border:"), "Must retain transit border station badge");
  });
});
