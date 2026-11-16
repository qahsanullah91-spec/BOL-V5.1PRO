const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const load = require("./load-typescript.cjs");
const { exportReportToExcel } = load("lib/reports/export-excel.ts");

const MOCK_BOLS = [
  {
    id: "QA-XL-001",
    bol_number: "BOL-2026-NSA701",
    issue_date: "2026-11-10T10:00:00Z",
    created_at: "2026-11-10T10:00:00Z",
    truck_number: "22792 Herat",
    driver_name: "Mohammad Reza",
    driver_father_name: "Ali",
    driver_contact: "0790712343",
    driver_rent: "18,000 AFN",
    invoice_no: "INV-071",
    shipper_name: "ARIF BASIT TAWAKAL LTD",
    shipper_address: "Kandahar, Afghanistan",
    consignee_name: "D.B. FORTUNE",
    consignee_address: "Khari Baoli, Delhi, India",
    notify_party_name: "SYDNEY LAND TRADING CO L.L.C",
    goods_description: "Golden Raisins",
    number_of_packages: "1051 CTNS",
    kgs_per_carton: "20.0 KG",
    gross_weight_per_carton: "21.5004757 KG",
    net_weight: "21,020 KG",
    gross_weight: "22,597 KG",
    rate_per_kgs: "5.00 USD",
    goods_value: "$105,100.00",
    port_of_loading: "Kandahar",
    port_of_discharge: "Nhava Sheva, IN",
    place_of_delivery: "Delhi, India",
    container_numbers: "MSCU1122334",
    seal_numbers: "SL-99881",
    cargo_route_note: "Islam Qala to Dogharoun to Jask Port to Suwaiq Port to Sohar Port to Nhava Sheva (Reefer)",
    pdf_url: "https://storage.googleapis.com/sky-bol/BOL-2026-NSA701.pdf",
  },
  {
    id: "QA-XL-002",
    bol_number: "BOL-2026-NSA702",
    issue_date: "2026-11-11T12:00:00Z",
    created_at: "2026-11-11T12:00:00Z",
    truck_number: "19834 Nimroz",
    driver_name: "Ahmad ولد Ghulam",
    driver_contact: "0788990011",
    driver_rent: "25,000 AFN",
    invoice_no: "INV-072",
    shipper_name: "KANDAHAR FRESH FRUIT CO",
    consignee_name: "EMIRATES SPICES LLC",
    goods_description: "Green Raisins\nAlmonds",
    number_of_packages: "600 CTNS - 400 CTNS",
    kgs_per_carton: "10 KG - 10 KG",
    gross_weight_per_carton: "11 KG - 11 KG",
    net_weight: "6,000 KG - 4,000 KG",
    gross_weight: "6,600 KG - 4,400 KG",
    rate_per_kgs: "4.20 USD - 6.50 USD",
    goods_value: "$25,200.00 - $26,000.00",
    port_of_loading: "Kandahar",
    port_of_discharge: "Jebel Ali, UAE",
    place_of_delivery: "Dubai, UAE",
    container_numbers: "CMAU5544332",
    seal_numbers: "SL-33441",
    cargo_route_note: "Via Islam Qala border",
    pdf_url: null,
  },
];

test("Excel Export: Generates professional multi-sheet workbook with frontend-design polish", async () => {
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
    await exportReportToExcel(MOCK_BOLS, "Test-Excel-Polish", "all", "all");

    assert.ok(capturedWb, "Workbook must be generated and captured");
    const sheets = capturedWb.SheetNames;
    assert.equal(sheets.length, 12, "Must produce all 12 operational sheets");

    // 1. Check Summary Sheet layout & executive design
    const summarySheet = capturedWb.Sheets["Summary"];
    assert.ok(summarySheet, "Summary sheet must exist");
    assert.ok(summarySheet["!merges"]?.length > 0, "Summary sheet must have merged title cells");
    assert.ok(summarySheet["!cols"]?.length >= 2, "Summary sheet must configure column widths");
    assert.ok(summarySheet["!rows"]?.length >= 5, "Summary sheet must configure row heights");
    assert.ok(summarySheet["!views"]?.length > 0, "Summary sheet must configure freeze pane view");
    assert.equal(summarySheet["A1"].s?.fill?.fgColor?.rgb, "1E3A8A", "Summary banner must have executive navy fill (#1E3A8A)");

    // 2. Check Detailed BOLs sheet formatting and metadata
    const detailedSheet = capturedWb.Sheets["Detailed BOLs"];
    assert.ok(detailedSheet, "Detailed BOLs sheet must exist");
    assert.ok(detailedSheet["!autofilter"], "Detailed BOLs must have autofilter configured");
    assert.ok(detailedSheet["!autofilter"].ref.startsWith("A1:"), "Autofilter ref must start at A1");
    assert.ok(detailedSheet["!freeze"], "Detailed BOLs must have freeze pane configured");
    assert.equal(detailedSheet["!freeze"].ySplit, 1, "Detailed BOLs must freeze header row (ySplit=1)");
    assert.ok(detailedSheet["!cols"]?.length > 10, "Detailed BOLs must configure smart column widths");
    assert.ok(detailedSheet["!rows"]?.length > 2, "Detailed BOLs must configure row heights");
    assert.equal(detailedSheet["A1"].s?.fill?.fgColor?.rgb, "1E3A8A", "Detailed BOLs header must have executive navy fill (#1E3A8A)");

    // Check custom number formatting applied
    // Find numeric cells in Detailed BOLs
    let hasFormattedNumber = false;
    for (const key of Object.keys(detailedSheet)) {
      if (key.startsWith("!")) continue;
      const cell = detailedSheet[key];
      if (cell.z) {
        hasFormattedNumber = true;
        break;
      }
    }
    assert.ok(hasFormattedNumber, "Detailed BOLs must contain styled number formats (cell.z)");

    // 3. Check Cargo Items Breakdown sheet
    const cargoSheet = capturedWb.Sheets["Cargo Items Breakdown"];
    assert.ok(cargoSheet, "Cargo Items Breakdown sheet must exist");
    assert.ok(cargoSheet["!autofilter"], "Cargo sheet must have autofilter");
    assert.ok(cargoSheet["!freeze"], "Cargo sheet must have freeze panes");

    // 4. Mathematical Accounting Invariance Identity
    // Net Balance = Total Debit - Total Credit (Revenue - Rent)
    const kpiRows = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });
    const summaryText = JSON.stringify(kpiRows);
    assert.ok(summaryText.includes("ACCOUNTING INVARIANCE AUDIT"), "Summary must display Accounting Invariance Audit");
    assert.ok(summaryText.includes("Total Goods Value"), "Summary must show Total Goods Value");
    assert.ok(summaryText.includes("Total Driver Rent"), "Summary must show Total Driver Rent");
  } finally {
    XLSX.writeFile = originalWriteFile;
  }
});

test("Saved Documents: UI contains 1-click Export Excel action and bulk Excel export", () => {
  const filePath = path.join(__dirname, "../components/bill-of-lading/saved-documents.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Verify function declarations
  assert.ok(content.includes("handleExportToExcel"), "Must declare handleExportToExcel handler");
  assert.ok(content.includes("handleBulkExportExcel"), "Must declare handleBulkExportExcel handler");
  assert.ok(content.includes("isExportingExcel"), "Must manage isExportingExcel loading state");

  // Verify dynamic import of exportReportToExcel
  assert.ok(content.includes('import("@/lib/reports/export-excel")'), "Must dynamically import exportReportToExcel");

  // Verify top toolbar button
  assert.ok(content.includes("Export Excel"), "Top toolbar must provide Export Excel button");
  assert.ok(content.includes("Export currently filtered list to Executive Multi-Sheet Excel"), "Top toolbar button must have descriptive title");

  // Verify bottom bulk actions button
  assert.ok(content.includes("Export Excel ({selectedDocIds.length})"), "Bulk action bar must provide selection-aware Export Excel button");
});
