const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const load = require("./load-typescript.cjs");
const { exportReportToExcel } = load("lib/reports/export-excel.ts");

const MOCK_DATE_RANGE_BOLS = [
  {
    id: "QA-DR-001",
    bol_number: "BOL-2026-OCT001",
    issue_date: "2026-10-05T09:00:00Z",
    created_at: "2026-10-05T09:00:00Z",
    truck_number: "11223 Herat",
    driver_name: "Abdul Qayoum",
    driver_rent: "22,000 AFN",
    invoice_no: "INV-OCT-01",
    shipper_name: "AFGHAN FRUIT EXPORTERS LTD",
    consignee_name: "AL HILAL TRADING LLC",
    goods_description: "Red Raisins",
    number_of_packages: "800 CTNS",
    net_weight: "16,000 KG",
    gross_weight: "17,200 KG",
    goods_value: "$48,000.00",
    port_of_loading: "Kandahar",
    port_of_discharge: "Jebel Ali, UAE",
    cargo_route_note: "Via Islam Qala border",
  },
  {
    id: "QA-DR-002",
    bol_number: "BOL-2026-OCT002",
    issue_date: "2026-10-15T14:30:00Z",
    created_at: "2026-10-15T14:30:00Z",
    truck_number: "44556 Nimroz",
    driver_name: "Mohammad Karim",
    driver_rent: "35,000 AFN",
    invoice_no: "INV-OCT-02",
    shipper_name: "KANDAHAR FRESH FRUIT CO",
    consignee_name: "MAHARAJA FOODS PVT LTD",
    goods_description: "Dried Figs",
    number_of_packages: "500 CTNS",
    net_weight: "10,000 KG",
    gross_weight: "10,800 KG",
    goods_value: "$35,000.00",
    port_of_loading: "Kandahar",
    port_of_discharge: "Nhava Sheva, IN",
    cargo_route_note: "Via Hairatan border",
  },
];

test("Date-Range Analytics & Excel: Generates executive Report Scope and Daily Timeline sheet", async () => {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch {
    XLSX = require(path.resolve(__dirname, "../node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx"));
  }

  const originalWriteFile = XLSX.writeFile;
  let capturedWb = null;

  XLSX.writeFile = (wb) => {
    capturedWb = wb;
  };

  try {
    const dateRangeFilter = {
      dateFrom: "2026-10-01",
      dateTo: "2026-10-31",
      label: "this_month",
    };

    await exportReportToExcel(MOCK_DATE_RANGE_BOLS, "QA-Date-Range-Export", "all", "all", dateRangeFilter);

    assert.ok(capturedWb, "Workbook must be generated and captured");
    const sheets = capturedWb.SheetNames;
    assert.ok(sheets.includes("Summary"), "Must include Summary sheet");
    assert.ok(sheets.includes("Daily Timeline"), "Must include Daily Timeline sheet when dateRangeFilter is passed");
    assert.equal(sheets.length, 13, "Must produce 13 sheets (12 core sheets + Daily Timeline)");

    // 1. Verify Summary sheet contains Date Range Scope Audit
    const summarySheet = capturedWb.Sheets["Summary"];
    const summaryRows = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
    const summaryText = JSON.stringify(summaryRows);

    assert.ok(summaryText.includes("REPORT SCOPE & DATE-RANGE AUDIT"), "Summary must display REPORT SCOPE & DATE-RANGE AUDIT section");
    assert.ok(summaryText.includes("Active Date Range Filter"), "Summary must show Active Date Range Filter");
    assert.ok(summaryText.includes("2026-10-01 to 2026-10-31"), "Summary must show exact filtered dates");
    assert.ok(summaryText.includes("Average Daily BOL Dispatch Rate"), "Summary must show daily dispatch run-rate");
    assert.ok(summaryText.includes("Average Daily Cargo Volume"), "Summary must show daily volume run-rate");
    assert.ok(summaryText.includes("Average Daily Net Weight"), "Summary must show daily weight run-rate");
    assert.ok(summaryText.includes("ACCOUNTING INVARIANCE AUDIT"), "Summary must display Accounting Invariance Audit");

    // 2. Verify Daily Timeline sheet structure
    const dailySheet = capturedWb.Sheets["Daily Timeline"];
    assert.ok(dailySheet, "Daily Timeline sheet must exist");
    assert.ok(dailySheet["!autofilter"], "Daily Timeline sheet must have autofilter configured");
    assert.ok(dailySheet["!freeze"], "Daily Timeline sheet must freeze header row");

    const dailyData = XLSX.utils.sheet_to_json(dailySheet);
    assert.ok(dailyData.length >= 2, "Daily Timeline must contain daily breakdown rows");
    assert.ok(dailyData.some((row) => row["Date"] === "2026-10-05" || row["Date"] === "2026-10-15"), "Must list specific dates");
    assert.ok(dailyData.some((row) => row["Date"] === "TOTAL"), "Must have TOTAL summary row");
  } finally {
    XLSX.writeFile = originalWriteFile;
  }
});

test("SavedBolReport UI: Contains inline date-range inputs and executive analytics banner", () => {
  const filePath = path.join(__dirname, "../components/reports/saved-bol-report.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Verify inline custom date range inputs
  assert.ok(content.includes('title="Date Range Start Date"'), "Must contain Start Date picker");
  assert.ok(content.includes('title="Date Range End Date"'), "Must contain End Date picker");
  assert.ok(content.includes('title="Clear custom date range"'), "Must contain clear date range button");

  // Verify executive date range analytics banner
  assert.ok(content.includes("Date Range Operations Analytics"), "Must render Date Range Operations Analytics header");
  assert.ok(content.includes("Export Period Excel (.xlsx)"), "Must provide 1-click Export Period Excel action button");
  assert.ok(content.includes("Shipments / Day"), "Must display Shipments / Day daily run-rate metric");
  assert.ok(content.includes("Cargo Volume / Day"), "Must display Cargo Volume / Day metric");
  assert.ok(content.includes("Net Weight Pacing"), "Must display Net Weight Pacing metric");
  assert.ok(content.includes("Declared Value (USD)"), "Must display Declared Value (USD)");
  assert.ok(content.includes("Driver Rent (AFN)"), "Must display Driver Rent (AFN)");
});
