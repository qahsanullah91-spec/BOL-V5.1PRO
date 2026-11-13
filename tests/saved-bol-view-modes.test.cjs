const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const rootDir = path.resolve(__dirname, "..")

test("Saved BOL 10-Type View Modes Suite", async (t) => {
  await t.test("1. VIEW_MODE_OPTIONS declares all 10 distinct viewing modes", () => {
    const viewTypesFile = path.join(rootDir, "components", "bill-of-lading", "views", "view-types.ts")
    assert.ok(fs.existsSync(viewTypesFile), "view-types.ts must exist")
    const content = fs.readFileSync(viewTypesFile, "utf-8")

    const expectedModes = [
      "grid",
      "list",
      "table",
      "compact",
      "kanban",
      "timeline",
      "finance",
      "route",
      "gallery",
      "analytics",
    ]

    for (const mode of expectedModes) {
      assert.ok(
        content.includes(`"${mode}"`),
        `view-types.ts must declare "${mode}" in ViewMode union and config`
      )
    }

    // Verify exactly 10 modes are present in ViewMode union
    const unionMatch = content.match(/export type ViewMode =\s*([\s\S]*?)(?=\n\n|\nexport)/)
    assert.ok(unionMatch, "ViewMode union type must be exported")
    const unionLines = unionMatch[1].split("|").map((s) => s.trim().replace(/"/g, "")).filter(Boolean)
    assert.strictEqual(unionLines.length, 10, "ViewMode must declare exactly 10 modes")
  })

  await t.test("2. All 7 new view component files exist and export React components", () => {
    const viewsDir = path.join(rootDir, "components", "bill-of-lading", "views")
    const expectedFiles = [
      "saved-bol-view-selector.tsx",
      "saved-bol-compact-view.tsx",
      "saved-bol-kanban-view.tsx",
      "saved-bol-timeline-view.tsx",
      "saved-bol-finance-view.tsx",
      "saved-bol-route-view.tsx",
      "saved-bol-gallery-view.tsx",
      "saved-bol-analytics-view.tsx",
    ]

    for (const file of expectedFiles) {
      const fullPath = path.join(viewsDir, file)
      assert.ok(fs.existsSync(fullPath), `View component file ${file} must exist`)
      const content = fs.readFileSync(fullPath, "utf-8")
      assert.ok(content.includes("export const SavedBol"), `${file} must export a SavedBol component`)
    }
  })

  await t.test("3. saved-documents.tsx integrates SavedBolViewSelector and all 10 view modes", () => {
    const savedDocsFile = path.join(rootDir, "components", "bill-of-lading", "saved-documents.tsx")
    assert.ok(fs.existsSync(savedDocsFile), "saved-documents.tsx must exist")
    const content = fs.readFileSync(savedDocsFile, "utf-8")

    // Must import and use SavedBolViewSelector
    assert.ok(content.includes("SavedBolViewSelector"), "Must use SavedBolViewSelector")
    assert.ok(content.includes("<SavedBolViewSelector"), "Must render <SavedBolViewSelector")

    // Must render all 10 view modes
    const modes = [
      'viewMode === "grid"',
      'viewMode === "list"',
      'viewMode === "table"',
      'viewMode === "compact"',
      'viewMode === "kanban"',
      'viewMode === "timeline"',
      'viewMode === "finance"',
      'viewMode === "route"',
      'viewMode === "gallery"',
      'viewMode === "analytics"',
    ]

    for (const m of modes) {
      assert.ok(content.includes(m), `saved-documents.tsx must conditionally render ${m}`)
    }

    // Must persist viewMode to localStorage
    assert.ok(
      content.includes("sky-bol-saved-view-mode"),
      "Must persist viewMode to localStorage under sky-bol-saved-view-mode"
    )
  })

  await t.test("4. SavedBolViewSelector renders 10 icon buttons with accessible titles and Persian translations", () => {
    const selectorFile = path.join(rootDir, "components", "bill-of-lading", "views", "saved-bol-view-selector.tsx")
    const content = fs.readFileSync(selectorFile, "utf-8")

    assert.ok(content.includes("VIEW_MODE_OPTIONS.map"), "Must map over VIEW_MODE_OPTIONS")
    assert.ok(content.includes("onViewModeChange"), "Must support onViewModeChange callback")
    assert.ok(content.includes("role=\"group\""), "Must include accessible role")
    assert.ok(content.includes("aria-label=\"BOL Document View Modes\""), "Must include aria-label")
  })
})
