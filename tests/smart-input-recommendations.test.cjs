const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function loadEngine() {
  const filePath = path.join(__dirname, "..", "lib", "smart", "smart-predictor-engine.ts")
  const content = fs.readFileSync(filePath, "utf8")
  const js = ts.transpileModule(content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const m = { exports: {} }
  const fn = new Function("module", "exports", "require", js)
  fn(m, m.exports, require)
  return m.exports.SmartPredictorEngine
}

test("SmartPredictorEngine - Zero-Character Suppression & Query-Triggered Recommendations", async (t) => {
  const engine = loadEngine()

  await t.test("Empty query returns 0 recommendations (does not show on empty focus)", () => {
    engine.learn("MANIK TRADERS", "consignee")
    engine.learn("RCA EXIM PRIVATE LIMITED", "consignee")
    engine.learn("SAFFRON HOME LLP", "consignee")

    const emptyResults = engine.suggest("consignee", "")
    assert.equal(emptyResults.length, 0, "Empty query must return 0 results so popover never opens on empty input")

    const whitespaceResults = engine.suggest("consignee", "   ")
    assert.equal(whitespaceResults.length, 0, "Whitespace query must also return 0 results")
  })

  await t.test("Writing words triggers accurate recommendations", () => {
    const res = engine.suggest("consignee", "man")
    assert.ok(res.length > 0, "Writing 'man' must return suggestions")
    assert.equal(res[0].value, "MANIK TRADERS")
  })

  await t.test("Word-level prefix matching (e.g. 'tra' matches second word in 'MANIK TRADERS')", () => {
    const res = engine.suggest("consignee", "tra")
    assert.ok(res.some((r) => r.value === "MANIK TRADERS"), "Query 'tra' must match 'MANIK TRADERS'")
  })

  await t.test("Multi-word search (e.g. 'rca exim' matches 'RCA EXIM PRIVATE LIMITED')", () => {
    const res = engine.suggest("consignee", "rca ex")
    assert.ok(res.length > 0)
    assert.equal(res[0].value, "RCA EXIM PRIVATE LIMITED")
  })

  await t.test("Bilingual / Persian search matching", () => {
    engine.learn("Dry Figs (انجیر خشک قندهار)", "commodity")
    const res = engine.suggest("commodity", "انجیر")
    assert.ok(res.length > 0)
    assert.ok(res[0].value.includes("انجیر"))
  })

  await t.test("GlobalSmartInputLayer source code guarantees recommendations only show on typed text", () => {
    const layerPath = path.join(__dirname, "..", "components", "smart", "global-smart-inputs.tsx")
    const layerCode = fs.readFileSync(layerPath, "utf8")

    assert.ok(
      layerCode.includes("isTextEmpty || suggestions.length === 0"),
      "Popover must explicitly return null when isTextEmpty is true"
    )
    assert.ok(
      layerCode.includes("if (trimmed.length === 0)"),
      "Refresh handler must clear suggestions when input trimmed length is 0"
    )
    assert.ok(
      layerCode.includes("HighlightedMatch"),
      "Must include HighlightedMatch component for query word highlighting"
    )
  })
})
