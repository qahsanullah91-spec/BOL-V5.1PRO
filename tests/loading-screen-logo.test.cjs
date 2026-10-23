const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

test("Loading Screen Logo: AQ Companies image assets exist and are valid PNGs", () => {
  const emblemPath = path.join(process.cwd(), "public", "images", "aq-companies-emblem.png")
  const fullLogoPath = path.join(process.cwd(), "public", "images", "aq-companies-logo.png")

  assert.ok(fs.existsSync(emblemPath), "public/images/aq-companies-emblem.png must exist")
  assert.ok(fs.existsSync(fullLogoPath), "public/images/aq-companies-logo.png must exist")

  const emblemBuf = fs.readFileSync(emblemPath)
  assert.ok(emblemBuf.length > 5000, "Emblem image must be populated and non-empty")
  assert.equal(emblemBuf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Emblem must be a valid PNG")

  const logoBuf = fs.readFileSync(fullLogoPath)
  assert.ok(logoBuf.length > 5000, "Logo image must be populated and non-empty")
  assert.equal(logoBuf.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Logo must be a valid PNG")
})

test("Loading Screen Logo: electron/main.ts embeds AQ Companies emblem in getSplashHtml()", () => {
  const mainTsPath = path.join(process.cwd(), "electron", "main.ts")
  const mainTs = fs.readFileSync(mainTsPath, "utf-8")

  assert.ok(mainTs.includes("getAqEmblemBase64"), "electron/main.ts must define getAqEmblemBase64")
  assert.ok(mainTs.includes("aq-companies-emblem.png"), "electron/main.ts must check aq-companies-emblem.png")
  assert.ok(mainTs.includes("emblem-img"), "electron/main.ts must style emblem-img")
  assert.ok(mainTs.includes("${emblemContent}"), "getSplashHtml must render dynamic emblemContent")
  assert.ok(mainTs.includes("AQ COMPANIES"), "Splash must feature AQ COMPANIES brand")
  assert.ok(mainTs.includes("Logistics & Bill of Lading Platform"), "Splash must feature platform subtitle")
})

test("Loading Screen Logo: app/loading.tsx provides matching Next.js loading screen", () => {
  const loadingPath = path.join(process.cwd(), "app", "loading.tsx")
  assert.ok(fs.existsSync(loadingPath), "app/loading.tsx must exist")

  const loadingCode = fs.readFileSync(loadingPath, "utf-8")
  assert.ok(loadingCode.includes("/images/aq-companies-emblem.png"), "app/loading.tsx must display the AQ emblem")
  assert.ok(loadingCode.includes("AQ COMPANIES"), "app/loading.tsx must have AQ COMPANIES title")
  assert.ok(loadingCode.includes("ULTRA PERFORMANCE RUNTIME"), "app/loading.tsx must include runtime badge")
})
