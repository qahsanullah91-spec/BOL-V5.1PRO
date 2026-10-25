/**
 * Tests: Advanced Automatic Version Control System
 * Covers: semver increment rules, build-id generation (date-derived, same-day
 * counter), multi-surface consistency, append-only release history, change
 * classification, and integration with the release manifest generator.
 */

const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const {
  generateBuildId,
  nextVersion,
  classifyChanges,
  readCentralConfig,
  readPackageVersion,
  readReleaseHistory,
  verifySurfaces,
  syncSystemVersionTs,
  bumpVersionText,
  PATHS,
} = require("../scripts/version-control.cjs")
const { getAppVersionInfo } = require("../scripts/generate-release-manifest.cjs")

test("TEST 1: SemVer increment rules (5.1.2 baseline)", () => {
  assert.equal(nextVersion("5.1.2", "patch"), "5.1.3")
  assert.equal(nextVersion("5.1.2", "minor"), "5.2.0")
  assert.equal(nextVersion("5.1.2", "major"), "6.0.0")
  assert.equal(nextVersion("v5.1.2", "minor"), "5.2.0")
  assert.equal(nextVersion("5.9.9", "minor"), "5.10.0")
  assert.equal(nextVersion("4.0.0", "major"), "5.0.0")
  assert.throws(() => nextVersion("not-a-version", "patch"))
})

test("TEST 2: Build IDs derive from the actual release date, never a hardcoded date", () => {
  const first = generateBuildId([], new Date("2026-10-25T14:30:00"))
  assert.equal(first, "2026.10.25-PRO")
  assert.ok(first.endsWith("-PRO"), "PRO edition identifier must be preserved")

  const otherDay = generateBuildId([first], new Date("2026-10-26T09:00:00"))
  assert.equal(otherDay, "2026.10.26-PRO")
  assert.notEqual(otherDay, first)
})

test("TEST 3: Same-day rebuilds get a unique counter without breaking the display format", () => {
  const builds = ["2026.10.25-PRO"]
  assert.equal(generateBuildId(builds, new Date("2026-10-25T16:00:00")), "2026.10.25-PRO-2")
  builds.push("2026.10.25-PRO-2")
  assert.equal(generateBuildId(builds, new Date("2026-10-25T18:00:00")), "2026.10.25-PRO-3")
  // uniqueness across the whole set
  const next = generateBuildId(builds, new Date("2026-10-25T20:00:00"))
  assert.ok(!builds.includes(next))
})

test("TEST 4: Central config and package.json agree (single source of truth)", () => {
  const central = readCentralConfig()
  const pkg = readPackageVersion()
  assert.equal(pkg, central.version, "package.json version must equal system-version.ts label")
  assert.match(central.buildNumber, /^\d{4}\.\d{2}\.\d{2}-PRO(-\d+)?$/, "build id must match YYYY.MM.DD-PRO[-N]")
  assert.match(central.releaseDate, /^\d{4}-\d{2}-\d{2}$/)
})

test("TEST 5: All version display surfaces are in sync (verify passes on real tree)", () => {
  const check = verifySurfaces()
  assert.deepEqual(check.issues, [], `surface drift detected: ${check.issues.join("; ")}`)
  assert.equal(check.ok, true)
})

test("TEST 6: verifySurfaces reports drift for a wrong expected version (negative path)", () => {
  const check = verifySurfaces({ expectVersion: "9.9.9", expectBuild: "1999.01.01-PRO" })
  assert.equal(check.ok, false)
  assert.ok(check.issues.length > 0)
})

test("TEST 7: Release history is append-only and well-formed", () => {
  const history = readReleaseHistory()
  assert.equal(history.schemaVersion, 1)
  assert.ok(Array.isArray(history.releases) && history.releases.length >= 1)

  const seenBuilds = new Set()
  for (const r of history.releases) {
    for (const field of ["previousVersion", "newVersion", "build", "releaseDate", "changeCategory", "title"]) {
      assert.ok(r[field] !== undefined, `release record missing field: ${field}`)
    }
    for (const field of ["featuresAdded", "featuresModified", "featuresRemoved", "bugsFixed"]) {
      assert.ok(Array.isArray(r[field]), `release record field must be an array: ${field}`)
    }
    assert.ok(!seenBuilds.has(r.build), `duplicate build id in history: ${r.build}`)
    seenBuilds.add(r.build)
  }

  // Baseline record (5.1.2) must still be intact - history is never rewritten
  const baseline = history.releases[0]
  assert.equal(baseline.newVersion, "v5.1.2")
  assert.equal(baseline.build, "2026.10.23-PRO")
  assert.equal(baseline.releaseDate, "2026-10-23")
})

test("TEST 8: Release chain is contiguous - one increment per release", () => {
  const history = readReleaseHistory()
  for (let i = 1; i < history.releases.length; i++) {
    const prev = history.releases[i - 1]
    const cur = history.releases[i]
    const prevNew = String(prev.newVersion).replace(/^v/, "")
    const curPrev = String(cur.previousVersion).replace(/^v/, "")
    assert.equal(curPrev, prevNew, `record ${i} must continue from the previous release's new version`)
  }
})

test("TEST 9: Current version equals the latest history record", () => {
  const history = readReleaseHistory()
  const last = history.releases[history.releases.length - 1]
  const central = readCentralConfig()
  assert.equal(String(last.newVersion).replace(/^v/, ""), central.version)
  assert.equal(last.build, central.buildNumber)
})

test("TEST 10: Release manifest generator reads the same version/build as the central config", () => {
  const info = getAppVersionInfo()
  const central = readCentralConfig()
  assert.equal(info.version, central.version)
  assert.equal(info.buildNumber, central.buildNumber)
})

test("TEST 11: Change classification heuristics", () => {
  // Only modifications -> PATCH
  const mods = classifyChanges([
    { status: "M", path: "components/bill-of-lading/header.tsx" },
    { status: "M", path: "lib/utils/qr-code.ts" },
  ])
  assert.equal(mods.suggested, "patch")

  // New source files -> MINOR (new feature/module)
  const withNew = classifyChanges([
    { status: "M", path: "components/header.tsx" },
    { status: "??", path: "components/settings/new-dashboard-tab.tsx" },
    { status: "??", path: "tests/new-dashboard-tab.test.cjs" },
  ])
  assert.equal(withNew.suggested, "minor")
  assert.ok(withNew.newFeatureFiles >= 1)

  // SQL migration -> database-change category, at least MINOR
  const withSql = classifyChanges([{ status: "??", path: "scripts/014_add_column.sql" }])
  assert.ok(withSql.categories.includes("database-change"))
  assert.equal(withSql.suggested, "minor")

  // Removed feature files -> MINOR with removal evaluation note
  const withRemoval = classifyChanges([{ status: "D", path: "lib/services/legacy-service.ts" }])
  assert.ok(withRemoval.removedFeatureFiles >= 1)
})

test("TEST 12: syncSystemVersionTs bumps label/build/date and prepends changelog without touching history", () => {
  const raw = fs.readFileSync(PATHS.systemVersion, "utf8")
  const central = readCentralConfig()
  const out = syncSystemVersionTs(raw, {
    newVersion: "9.9.9",
    newBuild: "2099.01.01-PRO",
    newDate: "2099-01-01",
    title: "Test Release",
    changes: ["Added: synthetic entry for test", "Fixed: nothing real"],
  })

  assert.match(out, /SYSTEM_RELEASE_LABEL = "v9\.9\.9" as const/)
  assert.match(out, /buildNumber: "2099\.01\.01-PRO"/)
  assert.match(out, /releaseDate: "2099-01-01"/)
  assert.match(out, /version: "v9\.9\.9",\s*\n\s*date: "2099-01-01",\s*\n\s*title: "Test Release",/)
  assert.match(out, /"Added: synthetic entry for test"/)

  // Previous changelog entries must remain untouched (history is frozen)
  assert.ok(out.includes(`version: "v${central.version}",`), "old changelog entry must be preserved")
  const entryCount = (out.match(/      version: "/g) || []).length
  assert.equal(entryCount, central.raw.match(/      version: "/g).length + 1, "exactly one changelog entry appended")

  // Line endings of the host file are preserved (repo uses CRLF)
  if (raw.includes("\r\n")) assert.ok(out.includes("\r\n"), "CRLF must be preserved")
})

test("TEST 13: bumpVersionText syncs v-prefixed, quoted and bare version literals", () => {
  const sample = [
    'const fallback = "5.1.2"',
    "currentBuild: \"2026.10.23-PRO\",",
    "<div>AQ-SYSTEM v5.1.2 PRO</div>",
    "installer AQ-COMPANIES-Setup-5.1.2.exe",
  ].join("\n")
  const { content, versionHits, buildHits } = bumpVersionText(sample, {
    oldVersion: "5.1.2",
    newVersion: "5.2.0",
    oldBuild: "2026.10.23-PRO",
    newBuild: "2026.10.25-PRO",
    withBuild: true,
  })
  assert.ok(content.includes('"5.2.0"'))
  assert.ok(content.includes("AQ-SYSTEM v5.2.0 PRO"))
  assert.ok(content.includes("AQ-COMPANIES-Setup-5.2.0.exe"))
  assert.ok(content.includes('"2026.10.25-PRO"'))
  assert.ok(!content.includes("5.1.2"), "no stale version literals may remain")
  assert.ok(!content.includes("2026.10.23-PRO"))
  assert.equal(versionHits >= 3, true)
  assert.equal(buildHits, 1)
})

test("TEST 14: app loading screen reads the central version instead of a hardcoded literal", () => {
  const loading = fs.readFileSync(PATHS.appLoading, "utf8")
  assert.ok(loading.includes("SYSTEM_RELEASE_LABEL"), "loading badge must use the central config export")
  const central = readCentralConfig()
  assert.ok(!loading.includes(`v${central.version}`), "no hardcoded version literal may remain in loading.tsx")
})
