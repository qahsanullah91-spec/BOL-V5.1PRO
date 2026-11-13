const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("BOL A4 Preview - Auto-Fit Layout & Dense Content Optimization Suite", async (t) => {
  const a4PreviewPath = path.join(__dirname, "..", "components", "bill-of-lading", "a4-preview.tsx");
  const globalsCssPath = path.join(__dirname, "..", "app", "globals.css");

  assert.ok(fs.existsSync(a4PreviewPath), "a4-preview.tsx must exist");
  assert.ok(fs.existsSync(globalsCssPath), "app/globals.css must exist");

  const a4Code = fs.readFileSync(a4PreviewPath, "utf8");
  const cssCode = fs.readFileSync(globalsCssPath, "utf8");

  await t.test("1. Dynamic Content Auto-Fit Scaling Canvas is rendered inside <main>", () => {
    assert.match(
      a4Code,
      /data-bol-autofit-canvas="true"/,
      "a4-preview must render data-bol-autofit-canvas wrapper"
    );
    assert.match(
      a4Code,
      /data-auto-fit-scale=\{effectiveFitScale < 1 \? effectiveFitScale : undefined\}/,
      "main must track effective auto-fit scale attribute"
    );
    assert.match(
      a4Code,
      /transform:\s*`scale\(\$\{effectiveFitScale\}\)`/,
      "autofit canvas must dynamically scale down when content exceeds A4 budget"
    );
  });

  await t.test("2. Density scoring accounts for multi-line party addresses & contacts", () => {
    assert.match(
      a4Code,
      /const consigneeLines = \(formData\.consignee_address \|\| ""\)\.split\("\\n"\)/,
      "Must count lines in consignee address"
    );
    assert.match(
      a4Code,
      /const shipperLines = \(formData\.shipper_address \|\| ""\)\.split\("\\n"\)/,
      "Must count lines in shipper address"
    );
    assert.match(
      a4Code,
      /const notifyLines = \(formData\.notify_party_address \|\| ""\)\.split\("\\n"\)/,
      "Must count lines in notify party address"
    );
    assert.match(
      a4Code,
      /if \(totalPartyLines >= 12\) densityScore \+= 4/,
      "Must add high density score for 12+ address lines"
    );
  });

  await t.test("3. globals.css enforces 0.5mm ultra-compact gap and 46px route cards", () => {
    assert.match(
      cssCode,
      /\[data-bol-content="true"\]\[data-density="ultra"\]\s*\{\s*gap:\s*0\.5mm\s*!important;/,
      "globals.css must enforce 0.5mm gap in ultra mode"
    );
    assert.match(
      cssCode,
      /\[data-density="ultra"\]\s*\.route-timeline-card\s*\{\s*padding:\s*2px\s*2px\s*3px\s*!important;\s*min-height:\s*46px\s*!important;/,
      "globals.css must enforce 46px min-height for ultra route cards"
    );
  });

  await t.test("4. globals.css adaptively compacts party text in ultra density mode", () => {
    assert.match(
      cssCode,
      /\[data-bol-a4="true"\]\[data-density="ultra"\]\s*\.party-card-info-text[\s\S]*font-size:\s*7\.6pt\s*!important;/,
      "globals.css must compact party card text to 7.6pt in ultra density mode"
    );
    assert.match(
      cssCode,
      /\[data-bol-a4="true"\]\[data-density="ultra"\]\s*\.party-card-body[\s\S]*padding:\s*2\.5px\s*5px\s*!important;/,
      "globals.css must tighten party card body padding in ultra density mode"
    );
  });

  await t.test("5. ShipmentOverview truck card uses 17.5mm min-height in ultra mode", () => {
    assert.match(
      a4Code,
      /isUltra\s*\?\s*"px-1\s+py-0\.8\s+min-h-\[17\.5mm\]"/,
      "ShipmentOverview must compact truck card to 17.5mm min-height in ultra mode"
    );
  });

  await t.test("6. Real-time DOM ResizeObserver checks overflow dynamically", () => {
    assert.match(
      a4Code,
      /new\s+ResizeObserver\(checkOverflow\)/,
      "Must instantiate ResizeObserver to monitor live DOM layout changes"
    );
    assert.match(
      a4Code,
      /setDynamicFitScale\(\(prev\)\s*=>\s*Math\.min\(prev,\s*measured\)\)/,
      "Must dynamically adapt scale based on actual DOM scrollHeight vs clientHeight"
    );
  });

  await t.test("7. Driver Rent card header renders bilingual labels in a single line", () => {
    assert.match(
      a4Code,
      /<div className="flex items-center justify-center[^"]*whitespace-nowrap[^"]*">[\s\S]*?DRIVER RENT[\s\S]*?کرایه راننده[\s\S]*?<\/div>/,
      "Driver Rent bilingual title (DRIVER RENT / کرایه راننده) must render in a single horizontal line"
    );
  });
});
