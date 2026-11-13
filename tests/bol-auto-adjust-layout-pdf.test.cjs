const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("BOL Dynamic Auto-Adjusting Layout & PDF Download Optimization Suite", async (t) => {
  const a4PreviewPath = path.join(__dirname, "..", "components", "bill-of-lading", "a4-preview.tsx");
  const cargoGridPath = path.join(__dirname, "..", "lib", "utils", "cargo-grid.ts");
  const shippingDocsPath = path.join(__dirname, "..", "lib", "utils", "shipping-documents.ts");
  const pdfUploadPath = path.join(__dirname, "..", "lib", "utils", "pdf-upload.ts");

  assert.ok(fs.existsSync(a4PreviewPath), "a4-preview.tsx must exist");
  assert.ok(fs.existsSync(cargoGridPath), "cargo-grid.ts must exist");
  assert.ok(fs.existsSync(shippingDocsPath), "shipping-documents.ts must exist");
  assert.ok(fs.existsSync(pdfUploadPath), "pdf-upload.ts must exist");

  const a4Code = fs.readFileSync(a4PreviewPath, "utf8");
  const cargoCode = fs.readFileSync(cargoGridPath, "utf8");
  const shippingCode = fs.readFileSync(shippingDocsPath, "utf8");
  const pdfUploadCode = fs.readFileSync(pdfUploadPath, "utf8");

  await t.test("1. Stamp Scale is strictly bounded dynamically to prevent overflowing into route cards or footer", () => {
    assert.match(
      a4Code,
      /const maxAllowedScale = isUltraCompact \? 1\.8 : isCompact \? 2\.2 : 2\.5/,
      "Must clamp stamp scale to safe bounds depending on document density tier"
    );
    assert.match(
      a4Code,
      /const currentScale = Math\.min\(maxAllowedScale, Math\.max\(0\.6, rawScale\)\)/,
      "Current stamp scale must be clamped against maxAllowedScale even if user had saved oversized scale"
    );
  });

  await t.test("2. Stamp controls pill is positioned neatly above the signature block", () => {
    assert.match(
      a4Code,
      /data-stamp-controls="true"\s+className="no-print absolute -top-8 right-0/,
      "Controls pill must be placed at -top-8 right-0 so it does not cover the stamp"
    );
  });

  await t.test("3. Adaptive section compaction in ultra-compact mode", () => {
    assert.match(
      a4Code,
      /isUltra \? "px-1\.5 py-\[0\.8px\]" : isCompact \? "px-1\.8 py-\[1\.4px\]" : "px-2 py-\[2px\]"/,
      "Section header must adaptively compact padding in ultra mode"
    );
    assert.match(
      a4Code,
      /isUltraCompact \? "gap-\[0\.5mm\]" : isCompact \? "gap-\[1\.0mm\]" : "gap-\[1\.6mm\]"/,
      "Main content gap must adaptively tighten down to 0.5mm in ultra-compact mode"
    );
  });

  await t.test("4. Multi-page pagination budget triggers for dense consignments", () => {
    assert.match(
      cargoCode,
      /if \(routeCount >= 5\) budgetScore \+= 3\.5\s+else if \(routeCount >= 4\) budgetScore \+= 2\.5/,
      "shouldSplitToPage2 must factor 4+ route stops into page split budget"
    );
    assert.match(
      cargoCode,
      /return budgetScore > 12/,
      "shouldSplitToPage2 threshold must be calibrated at > 12"
    );
  });

  await t.test("5. Download PDF uses toSvg + Image rasterizer with timeout cap and filter", () => {
    assert.match(
      shippingCode,
      /const \{ toSvg \} = await import\("html-to-image"\)/,
      "drawBolPage must use toSvg for Electron-safe background rendering"
    );
    assert.match(
      shippingCode,
      /data-stamp-controls/,
      "drawBolPage elementFilter must strip stamp controls from downloaded PDF"
    );
    assert.match(
      shippingCode,
      /data-preview-toolbar/,
      "drawBolPage elementFilter must strip preview toolbar from downloaded PDF"
    );
  });

  await t.test("6. pdf-upload.ts uses toSvg + Image rasterizer with timeout cap and filter", () => {
    assert.match(
      pdfUploadCode,
      /const \{ toSvg \} = await import\("html-to-image"\)/,
      "pdf-upload must use toSvg for Electron-safe background rendering"
    );
    assert.match(
      pdfUploadCode,
      /data-stamp-controls/,
      "pdf-upload elementFilter must strip stamp controls from PDF"
    );
  });
});
