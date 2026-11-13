// @ts-check
const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const centerPath = path.resolve(__dirname, "../components/bill-of-lading/settings/bol-settings-center.tsx")
const centerSource = fs.readFileSync(centerPath, "utf-8")

const skeletonPath = path.resolve(__dirname, "../components/bill-of-lading/settings/bol-settings-skeleton.tsx")
const skeletonSource = fs.readFileSync(skeletonPath, "utf-8")

test("BOL Settings Center Sub-Tab Navigation Responsive Layout Suite", async (t) => {
  await t.test("1. Settings Center uses flex-wrap to prevent horizontal tab clipping", () => {
    assert.match(
      centerSource,
      /className="flex flex-wrap items-center gap-1\.5/,
      "Expected sub-tab navigation strip to use flex-wrap to fit all tabs without horizontal overflow"
    )
    assert.doesNotMatch(
      centerSource,
      /overflow-x-auto[^"]*scrollbar-none/,
      "Expected no overflow-x-auto scrollbar-none on the sub-tab navigation strip"
    )
  })

  await t.test("2. All 7 configuration tabs are declared in SETTINGS_TABS", () => {
    const expectedTabs = ["watermark", "branding", "stamp", "general", "pdf-print", "defaults", "backup"]
    for (const tabId of expectedTabs) {
      assert.ok(
        centerSource.includes(`id: '${tabId}'`),
        `Expected tab '${tabId}' to be declared in SETTINGS_TABS`
      )
    }
  })

  await t.test("3. Skeleton loader mirrors flex-wrap layout structure", () => {
    assert.match(
      skeletonSource,
      /className="flex flex-wrap items-center gap-1\.5/,
      "Expected skeleton sub-tab strip to use flex-wrap"
    )
  })
})
