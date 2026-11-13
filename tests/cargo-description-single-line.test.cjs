// @ts-check
const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const a4PreviewPath = path.resolve(__dirname, "../components/bill-of-lading/a4-preview.tsx")
const a4PreviewSource = fs.readFileSync(a4PreviewPath, "utf-8")

test("Description of Goods Single-Line Side-by-Side Suite", async (t) => {
  await t.test("1. CargoDescriptionBlock renders meta items and single item side-by-side in one line", () => {
    const blockStart = a4PreviewSource.indexOf("function CargoDescriptionBlock(")
    const blockEnd = a4PreviewSource.indexOf("function BackgroundWatermark(")
    assert.ok(blockStart !== -1 && blockEnd !== -1, "Must find CargoDescriptionBlock boundaries")
    const blockCode = a4PreviewSource.slice(blockStart, blockEnd)

    assert.match(
      blockCode,
      /displayItemLines\.length === 1/,
      "Expected single-item branch in CargoDescriptionBlock"
    )
    assert.match(
      blockCode,
      /flex items-center\s+.*w-full\s+flex-wrap\s+sm:flex-nowrap/,
      "Expected single-line flex row container with side-by-side flow"
    )
    assert.match(
      blockCode,
      /metaLines\.map\(\(meta,\s*idx\)\s*=>\s*renderMetaChip\(meta,\s*idx\)\)/,
      "Expected metaLines to be mapped in the same row as item card"
    )
  })

  await t.test("2. Item card takes remaining space (flex-1) next to meta chips", () => {
    const blockStart = a4PreviewSource.indexOf("function CargoDescriptionBlock(")
    const blockEnd = a4PreviewSource.indexOf("function BackgroundWatermark(")
    const blockCode = a4PreviewSource.slice(blockStart, blockEnd)

    assert.match(
      blockCode,
      /flex-1\s+min-w-\[200px\]/,
      "Expected item card to have flex-1 min-w-[200px] to sit side-by-side cleanly"
    )
  })
})
