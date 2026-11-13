// @ts-check
const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const a4PreviewPath = path.resolve(__dirname, "../components/bill-of-lading/a4-preview.tsx")
const a4PreviewSource = fs.readFileSync(a4PreviewPath, "utf-8")

test("Shipment Information Header Transit Date and Invoice Display Suite", async (t) => {
  await t.test("1. shipmentHeaderDetails extracts transit date and invoice number with fallbacks", () => {
    assert.match(
      a4PreviewSource,
      /const shipmentHeaderDetails = \(transitDate \|\| invoiceNumber\)/,
      "Expected shipmentHeaderDetails to gate on transitDate or invoiceNumber"
    )
    assert.match(
      a4PreviewSource,
      /rawInvoice\s*=\s*cleanText\(formData\.invoice_number\)/,
      "Expected invoice fallback extraction"
    )
    assert.match(
      a4PreviewSource,
      /transitDate\s*=\s*cleanText\(\(formData as any\)\.transit_date\)/,
      "Expected transit date fallback extraction"
    )
  })

  await t.test("2. Executive badge capsule renders TRANSIT DATE and only invoice value with red theme", () => {
    const headerStart = a4PreviewSource.indexOf("const shipmentHeaderDetails =")
    const headerEnd = a4PreviewSource.indexOf("const hasExporter =", headerStart)
    assert.ok(headerStart !== -1 && headerEnd !== -1, "Must find shipmentHeaderDetails block")
    const headerCode = a4PreviewSource.slice(headerStart, headerEnd)

    const transitIdx = headerCode.indexOf("TRANSIT DATE:")
    assert.ok(transitIdx !== -1, "Expected TRANSIT DATE: label in shipmentHeaderDetails")

    // User requirement: In invoice number ONLY show the value e.g. INV-036 (no INVOICE NO: label and no receipt icon)
    assert.ok(!headerCode.includes("INVOICE NO:"), "INVOICE NO: label must NOT be present")
    assert.ok(!headerCode.includes("<Receipt"), "Receipt icon must NOT be present for invoice item")
    assert.ok(headerCode.includes("<CalendarDays"), "CalendarDays icon must be present for transit date item")

    assert.match(
      headerCode,
      /\{invoiceNumber && \(\s*<span[^>]*title=\{`Invoice: \$\{invoiceNumber\}`\}[^>]*>\s*<span className="sr-only">Invoice: <\/span>\s*<span[^>]*>\s*\{invoiceNumber\}\s*<\/span>\s*<\/span>\s*\)\}/,
      "Expected invoiceNumber to render directly with sr-only label and tooltip"
    )

    assert.match(
      headerCode,
      /bg-white\/95\s+border\s+border-red-300\/90\s+shadow-sm/,
      "Expected crisp white badge container with red border and soft shadow"
    )
    assert.match(
      headerCode,
      /<CalendarDays\s+className=\{`\$\{pdfMode\s+\?\s*"h-3\s+w-3"\s*:\s*"h-3\.5\s+w-3\.5"\}\s+text-red-500/,
      "Expected red CalendarDays icon with fitted PDF and screen size"
    )
    assert.match(
      headerCode,
      /text-red-500\s+font-extrabold\s+uppercase\s+tracking-wider/,
      "Expected refined red typography for transit date label"
    )
    assert.match(
      headerCode,
      /text-red-700\s+font-black\s+font-mono\s+tracking-tight/,
      "Expected high-contrast red font-mono typography for values"
    )
  })

  await t.test("3. Section calls pass centerContent={shipmentHeaderDetails}", () => {
    const matches = a4PreviewSource.match(/centerContent=\{shipmentHeaderDetails\}/g)
    assert.ok(matches && matches.length >= 2, "Expected at least 2 Section calls passing centerContent={shipmentHeaderDetails}")
  })
})
