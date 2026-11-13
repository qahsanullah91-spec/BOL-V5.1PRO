// @ts-check
const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const routeSelectorPath = path.resolve(__dirname, "../components/bill-of-lading/route-preset-selector.tsx")
const routeSelectorSource = fs.readFileSync(routeSelectorPath, "utf-8")

test("Route Preset Selector Fitted Adaptive Layout & Density Suite", async (t) => {
  await t.test("1. View mode toggle state and buttons are present", () => {
    assert.match(
      routeSelectorSource,
      /const\s*\[viewMode,\s*setViewMode\]\s*=\s*useState<"compact"\s*\|\s*"grid">\("compact"\)/,
      "Expected default viewMode to be 'compact'"
    )
    assert.match(routeSelectorSource, /setViewMode\("compact"\)/, "Expected compact mode button handler")
    assert.match(routeSelectorSource, /setViewMode\("grid"\)/, "Expected grid mode button handler")
    assert.match(routeSelectorSource, /لیست فشرده/, "Expected 'لیست فشرده' label in UI")
    assert.match(routeSelectorSource, /کارت‌ها/, "Expected 'کارت‌ها' label in UI")
  })

  await t.test("2. Station pills render as single-row scrollable rail", () => {
    assert.match(
      routeSelectorSource,
      /overflow-x-auto\s+no-scrollbar\s+scroll-smooth/,
      "Expected station pills container to have horizontal smooth scrolling without scrollbars"
    )
    assert.match(
      routeSelectorSource,
      /whitespace-nowrap/,
      "Expected station tabs to prevent text wrapping"
    )
  })

  await t.test("3. Container type filters render as single-row scrollable rail", () => {
    assert.match(
      routeSelectorSource,
      /فیلتر نوع کانتینر/,
      "Expected container filter heading"
    )
    assert.match(
      routeSelectorSource,
      /containerFilter\s*===\s*"full_reefer"/,
      "Expected full_reefer filter option"
    )
    assert.match(
      routeSelectorSource,
      /containerFilter\s*===\s*"switch_only"/,
      "Expected switch_only filter option"
    )
    assert.match(
      routeSelectorSource,
      /containerFilter\s*===\s*"mixed"/,
      "Expected mixed filter option"
    )
  })

  await t.test("4. Quick shortcuts bar provides collapse/expand toggle and categorization", () => {
    assert.match(
      routeSelectorSource,
      /const\s*\[isShortcutsExpanded,\s*setIsShortcutsExpanded\]\s*=\s*useState<boolean>\(false\)/,
      "Expected isShortcutsExpanded state defaulted to false"
    )
    assert.match(
      routeSelectorSource,
      /const\s*\[shortcutTab,\s*setShortcutTab\]\s*=\s*useState<"routes"\s*\|\s*"modifiers"\s*\|\s*"all">\("routes"\)/,
      "Expected shortcutTab state defaulted to 'routes'"
    )
    assert.match(
      routeSelectorSource,
      /setIsShortcutsExpanded/,
      "Expected toggle handler for expanding/collapsing shortcuts"
    )
  })

  await t.test("5. High-density compact list mode displays streamlined rows", () => {
    assert.match(
      routeSelectorSource,
      /COMPACT LIST VIEW MODE/,
      "Expected compact list view mode comment"
    )
    assert.match(
      routeSelectorSource,
      /viewMode === "compact"/,
      "Expected conditional branch for compact mode"
    )
    assert.match(
      routeSelectorSource,
      /CARDS GRID VIEW MODE/,
      "Expected cards grid view mode comment"
    )
    assert.match(
      routeSelectorSource,
      /grid-cols-1\s+lg:grid-cols-2/,
      "Expected grid mode to use responsive single-column on split view and 2 columns on lg screens"
    )
  })
})
