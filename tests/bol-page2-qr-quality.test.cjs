const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("BOL Continuation Sheet (Page 2) QR Code Suite", async (t) => {
  const previewPath = path.resolve("components/bill-of-lading/a4-preview.tsx");
  const previewSource = fs.readFileSync(previewPath, "utf8");

  await t.test("1. Page2Header wraps QR code in an enlarged executive container with mm sizing", () => {
    // Assert Page2Header has data-qr-code container with explicit mm sizing (14.5mm - 17.5mm)
    assert.ok(
      previewSource.includes('data-bol-page2-header="true"'),
      "a4-preview.tsx must contain Page2Header with data-bol-page2-header attribute"
    );
    assert.ok(
      previewSource.includes('isUltraCompact ? "14.5mm" : isCompact ? "16mm" : "17.5mm"'),
      "Page2Header QR container must use enlarged 14.5mm-17.5mm dimensions"
    );
    assert.ok(
      previewSource.includes('border-2 border-[#93c5fd]'),
      "Page2Header QR container must use executive border-2 border-[#93c5fd] matching Page 1"
    );
  });

  await t.test("2. DocumentQRCode on Page 2 receives size='100%' for lossless vector scaling", () => {
    assert.ok(
      previewSource.includes('size="100%"'),
      "DocumentQRCode on Page 2 must receive size='100%'"
    );
    assert.ok(
      !previewSource.includes("size={isUltraCompact ? 18 : 20}"),
      "Obsolete microscopic 18px-20px sizing must be removed from Page 2"
    );
  });

  await t.test("3. DocumentQRCode on Page 2 retains live formData and unstyled mode", () => {
    assert.ok(
      previewSource.includes("formData={formData}"),
      "Page2Header must pass live formData to DocumentQRCode"
    );
    assert.ok(
      previewSource.includes("unstyled={true}"),
      "Page2Header must pass unstyled={true} so the outer card manages styling and padding"
    );
    assert.ok(
      previewSource.includes("showQuietZone={false}"),
      "Page2Header must pass showQuietZone={false} to utilize full container area"
    );
  });
});
