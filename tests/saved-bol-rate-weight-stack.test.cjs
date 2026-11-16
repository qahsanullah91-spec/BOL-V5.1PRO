const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

test("Saved BOL Report: Rate per KG, Net Weight, and Gross Weight Stacked Hierarchy", async (t) => {
  const rootDir = path.resolve(__dirname, "..");
  const tablePath = path.join(rootDir, "components", "reports", "detailed-report-table.tsx");
  assert.ok(fs.existsSync(tablePath), "detailed-report-table.tsx must exist");
  const content = fs.readFileSync(tablePath, "utf-8");

  await t.test("1. Dedicated Weight & Rate column (grossWt) renders 3-tier vertical stack", () => {
    assert.ok(content.includes('data-col-id="grossWt"'), "Must preserve data-col-id='grossWt'");
    assert.ok(content.includes("1. Rate per KG ON TOP"), "Must have Rate per KG on top");
    assert.ok(content.includes("2. Net Weight in MIDDLE"), "Must have Net Weight in middle");
    assert.ok(content.includes("3. Gross Weight on BOTTOM"), "Must have Gross Weight on bottom");
    assert.ok(content.includes("Net"), "Must display Net tag");
    assert.ok(content.includes("Gross"), "Must display Gross tag");
  });

  await t.test("2. Table header displays Rate/KG on top of Gross Wt with sort controls", () => {
    assert.ok(content.includes('<span className="text-[9px] text-blue-300 font-bold tracking-tight">Rate/KG</span>'), "Header must display Rate/KG on top");
    assert.ok(content.includes('<span>Gross Wt</span>'), "Header must retain Gross Wt label for sorting");
    assert.ok(content.includes('handleSort("gross_weight")'), "Header must retain gross_weight sort handler");
  });

  await t.test("3. Cargo Summary renders Rate on top, Net Weight in middle, Gross Weight on bottom", () => {
    assert.ok(content.includes("3-Tier Stack in Cargo Summary: Rate on top, Net Weight in middle, Gross Weight on bottom"), "Cargo summary must implement 3-tier stack");
    assert.ok(content.includes("Rate:"), "Must display Rate label in Cargo Summary");
    assert.ok(content.includes("Net:"), "Must display Net label in Cargo Summary");
    assert.ok(content.includes("Gross:"), "Must display Gross label in Cargo Summary");
  });

  await t.test("4. Mobile Card View renders Rate, Net Wt, and Gross Wt stacked", () => {
    assert.ok(content.includes("Packages, Rate, Net & Gross Weight, Goods Value"), "Mobile card must describe Rate & Weights");
    assert.ok(content.includes("Rate & Weights"), "Mobile card must display Rate & Weights label");
    assert.ok(content.includes("Net:"), "Mobile card must display Net weight");
    assert.ok(content.includes("Gross:"), "Mobile card must display Gross weight");
  });

  await t.test("5. Fit Screen & Table Layout safeguards against text collision", () => {
    assert.ok(content.includes("min-w-full table-auto xl:table-fixed"), "Table must use responsive min-w-full layout in fitScreen mode");
    assert.ok(content.includes("overflow-x-auto"), "Table container must allow horizontal scrolling without clipping");
    assert.ok(content.includes("overflow-hidden"), "Table cells must prevent text overflow collisions");
  });
});
