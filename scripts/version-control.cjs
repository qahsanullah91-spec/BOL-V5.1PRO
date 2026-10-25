/**
 * AQ COMPANIES - Advanced Automatic Version Control System
 *
 * Single writer for every version surface in the repository:
 *   - package.json / package-lock.json
 *   - lib/config/system-version.ts  (central source of truth for the UI)
 *   - electron display + IPC fallback literals
 *   - docs (GETTING-STARTED / CONFIGURATION / API)
 *   - release-history.json          (append-only structured release records)
 *
 * Commands:
 *   status                     Show version across all surfaces + drift check
 *   detect [--range A..B]      Classify working-tree (or range) changes -> PATCH/MINOR/MAJOR
 *   release --type <t> [opts]  Full release workflow (bump, build id, sync, validate, report)
 *   verify                     Assert all surfaces agree with the central config
 *   history [--limit N]        Print release history records
 *   revert --last              Undo the newest release using the scratch backup
 *
 * Rules enforced here:
 *   - One version increment per release (grouped changes).
 *   - Build ids derive from the actual release date, never a hardcoded date.
 *   - Same-day rebuilds get a -N counter; the display format stays YYYY.MM.DD-PRO.
 *   - Previous release records are never overwritten or rewritten.
 *   - Git tags are only created with --tag, and an existing tag is never replaced.
 *   - Nothing is committed or pushed by this script.
 */

const fs = require("node:fs")
const path = require("node:path")
const { execFileSync, spawnSync } = require("node:child_process")

const rootDir = path.resolve(__dirname, "..")

const PATHS = {
  packageJson: path.join(rootDir, "package.json"),
  packageLock: path.join(rootDir, "package-lock.json"),
  systemVersion: path.join(rootDir, "lib", "config", "system-version.ts"),
  releaseHistory: path.join(rootDir, "release-history.json"),
  electronMain: path.join(rootDir, "electron", "main.ts"),
  electronIpc: path.join(rootDir, "electron", "ipc", "register-ipc.ts"),
  electronUpdater: path.join(rootDir, "electron", "services", "updater.ts"),
  docGettingStarted: path.join(rootDir, "docs", "GETTING-STARTED.md"),
  docConfiguration: path.join(rootDir, "docs", "CONFIGURATION.md"),
  docApi: path.join(rootDir, "docs", "API.md"),
  appLoading: path.join(rootDir, "app", "loading.tsx"),
}

const CHANGE_TYPES = ["patch", "minor", "major"]

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"))
}

/** Atomic write: temp file + rename in the same directory. */
function writeAtomic(file, content) {
  const tmp = `${file}.tmp.${process.pid}.${Date.now()}`
  fs.writeFileSync(tmp, content, "utf8")
  fs.renameSync(tmp, file)
}

function todayParts(now = new Date()) {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return { y, m, d, iso: `${y}-${m}-${d}` }
}

function detectEol(content) {
  return content.includes("\r\n") ? "\r\n" : "\n"
}

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, { cwd: rootDir, encoding: "utf8" }).trim()
  } catch (err) {
    if (allowFailure) return null
    throw err
  }
}

function parseArgs(argv) {
  const opts = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("--")) {
      opts._.push(arg)
      continue
    }
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith("--")) {
      opts[key] = true
    } else {
      if (opts[key] === undefined) opts[key] = next
      else if (Array.isArray(opts[key])) opts[key].push(next)
      else opts[key] = [opts[key], next]
      i++
    }
  }
  return opts
}

function asList(value) {
  if (value === undefined) return []
  return (Array.isArray(value) ? value : [value]).filter(Boolean)
}

// ---------------------------------------------------------------------------
// Central config readers (system-version.ts is the source of truth for UI)
// ---------------------------------------------------------------------------

function readCentralConfig() {
  const raw = fs.readFileSync(PATHS.systemVersion, "utf8")
  const labelMatch = raw.match(/SYSTEM_RELEASE_LABEL\s*=\s*["']v([^"']+)["']/)
  const buildMatch = raw.match(/buildNumber:\s*["']([^"']+)["']/)
  const dateMatch = raw.match(/releaseDate:\s*["']([^"']+)["']/)
  if (!labelMatch || !buildMatch || !dateMatch) {
    throw new Error("Unable to parse lib/config/system-version.ts - is it well-formed?")
  }
  return { version: labelMatch[1], label: `v${labelMatch[1]}`, buildNumber: buildMatch[1], releaseDate: dateMatch[1], raw }
}

function readPackageVersion() {
  return readJson(PATHS.packageJson).version
}

// ---------------------------------------------------------------------------
// Release history (append-only)
// ---------------------------------------------------------------------------

function readReleaseHistory() {
  if (!fs.existsSync(PATHS.releaseHistory)) return { schemaVersion: 1, edition: "PRO", releases: [] }
  return readJson(PATHS.releaseHistory)
}

/**
 * Build identifier from the actual release date. First build of a day is
 * YYYY.MM.DD-PRO; later builds the same day get -2, -3, ... appended, keeping
 * the required display format intact while guaranteeing uniqueness.
 */
function generateBuildId(existingBuilds, now = new Date()) {
  const { y, m, d } = todayParts(now)
  const prefix = `${y}.${m}.${d}-PRO`
  const taken = new Set(existingBuilds.map(String))
  if (!taken.has(prefix)) return prefix
  let counter = 2
  while (taken.has(`${prefix}-${counter}`)) counter++
  return `${prefix}-${counter}`
}

function nextVersion(version, type) {
  const clean = String(version).replace(/^v/i, "")
  const parts = clean.split(".")
  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
    throw new Error(`Cannot bump non-semver version "${version}"`)
  }
  const [maj, min, pat] = parts.map(Number)
  if (type === "major") return `${maj + 1}.0.0`
  if (type === "minor") return `${maj}.${min + 1}.0`
  if (type === "patch") return `${maj}.${min}.${pat + 1}`
  throw new Error(`Unknown change type "${type}"`)
}

// ---------------------------------------------------------------------------
// Change detection & classification (advisory)
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS = {
  security: /(security|auth|password|token|login|session|permission|watermark)/i,
  performance: /(perf|benchmark|memo|cache|optimi[sz]|lazy|measure|profile)/i,
  database: /\.sql$|migrat|schema/i,
  ui: /(components\/|\.css$|layout|preview|toolbar|responsive|styling)/i,
  configuration: /(config|\.env|tsconfig|next\.config|electron-builder)/i,
}

function collectChangedFiles({ range = null, staged = false } = {}) {
  const args = ["status", "--porcelain"]
  if (range) {
    // Range mode: diff names between two refs
    const names = git(["diff", "--name-status", range]).split("\n").filter(Boolean)
    return names.map((line) => {
      const [status, ...rest] = line.split("\t")
      return { status: status.trim(), path: rest.join("\t") }
    })
  }
  if (staged) args.push("--untracked-files=no")
  const out = git(args).split("\n").filter(Boolean)
  return out.map((line) => {
    const status = line.slice(0, 2).trim()
    const p = line.slice(3).trim()
    return { status, path: p.replace(/^"|"$/g, "") }
  })
}

function classifyChanges(files, { range = null } = {}) {
  const categories = new Set()
  let newFeatureFiles = 0
  let removedFeatureFiles = 0
  let removedExports = 0
  const evidence = []

  for (const f of files) {
    const rel = f.path
    if (rel.startsWith("..") || rel.includes("node_modules")) continue
    const isNew = f.status.includes("?") || f.status.startsWith("A")
    const isDeleted = f.status.includes("D")
    const trackedSource = /^(app|components|lib|electron|scripts|tests)\//.test(rel)

    if (isNew && trackedSource) {
      newFeatureFiles++
      if (/^app\/(api|[^/]+\/page\.tsx)/.test(rel) || /page\.tsx$/.test(rel)) {
        categories.add("new-module-or-page")
      }
    }
    if (isDeleted && /^(app|components|lib|electron)\//.test(rel)) removedFeatureFiles++
    if (/\.sql$/.test(rel)) categories.add("database-change")
    for (const [cat, rx] of Object.entries(CATEGORY_KEYWORDS)) {
      if (rx.test(rel)) categories.add(cat)
    }
    evidence.push(`${f.status || "M"} ${rel}`)
  }

  if (range) {
    const diff = git(["diff", range, "--", "app", "components", "lib", "electron"], { allowFailure: true }) || ""
    removedExports = (diff.match(/^-export (const|function|class|default)/gm) || []).length
  }

  let suggested = "patch"
  const reasons = []
  if (newFeatureFiles > 0) {
    suggested = "minor"
    reasons.push(`${newFeatureFiles} new source file(s) indicate a new feature/module`)
  } else if (removedFeatureFiles > 0 || removedExports > 2) {
    suggested = "minor"
    reasons.push("feature removal / export removal detected - evaluate impact per the version rules")
  } else {
    reasons.push("modifications only - bug fixes / UI refinements default to PATCH")
  }
  if (categories.has("database-change")) {
    suggested = suggested === "major" ? suggested : "minor"
    reasons.push("database schema migration detected")
  }

  return {
    suggested,
    reasons,
    categories: [...categories],
    removedExports,
    newFeatureFiles,
    removedFeatureFiles,
    files: evidence,
  }
}

// ---------------------------------------------------------------------------
// Surface syncing
// ---------------------------------------------------------------------------

function replaceCount(content, search, replace) {
  let count = 0
  let idx = content.indexOf(search)
  if (search.length === 0) return { content, count: 0 }
  while (idx !== -1) {
    content = content.slice(0, idx) + replace + content.slice(idx + search.length)
    count++
    idx = content.indexOf(search, idx + replace.length)
  }
  return { content, count }
}

function syncSystemVersionTs(raw, { newVersion, newBuild, newDate, title, changes }) {
  let out = raw
  const old = readCentralConfig()
  const labelDecl = `export const SYSTEM_RELEASE_LABEL = "${old.label}" as const`
  if (!out.includes(labelDecl)) throw new Error("SYSTEM_RELEASE_LABEL declaration not found in expected form")
  out = out.replace(labelDecl, `export const SYSTEM_RELEASE_LABEL = "v${newVersion}" as const`)

  // Only the top-level CURRENT_SYSTEM_VERSION fields - changelog history stays frozen.
  out = out.replace(`buildNumber: "${old.buildNumber}"`, `buildNumber: "${newBuild}"`)
  out = out.replace(`releaseDate: "${old.releaseDate}"`, `releaseDate: "${newDate}"`)

  const entryLines = changes.map((c) => `        ${JSON.stringify(c)},`).join("\n")
  const eol = detectEol(raw)
  const entry = [
    "  changelog: [",
    "    {",
    `      version: "v${newVersion}",`,
    `      date: "${newDate}",`,
    `      title: ${JSON.stringify(title)},`,
    "      changes: [",
    entryLines,
    "      ],",
    "    },",
  ].join(eol)
  const anchor = "  changelog: ["
  const anchorIdx = out.indexOf(anchor)
  if (anchorIdx === -1) throw new Error("changelog array not found in system-version.ts")
  out = out.slice(0, anchorIdx) + entry + eol + out.slice(anchorIdx + anchor.length + 1)
  return out
}

function bumpVersionText(content, { oldVersion, newVersion, oldBuild, newBuild, withBuild = false }) {
  let out = content
  let versionHits = 0
  let buildHits = 0
  const passes = [
    [`v${oldVersion}`, `v${newVersion}`],
    [`"${oldVersion}"`, `"${newVersion}"`],
    [oldVersion, newVersion],
  ]
  for (const [search, replace] of passes) {
    if (search === replace) continue
    const r = replaceCount(out, search, replace)
    out = r.content
    versionHits += r.count
  }
  if (withBuild && oldBuild !== newBuild) {
    const b = replaceCount(out, oldBuild, newBuild)
    out = b.content
    buildHits = b.count
  }
  return { content: out, versionHits, buildHits }
}

function applySurfaceReplacements({ oldVersion, newVersion, oldBuild, newBuild }) {
  const report = []

  const plainSurfaces = [
    ["electron/ipc/register-ipc.ts", PATHS.electronIpc, true],
    ["electron/services/updater.ts", PATHS.electronUpdater, true],
    ["electron/main.ts", PATHS.electronMain, false],
    ["docs/GETTING-STARTED.md", PATHS.docGettingStarted, false],
    ["docs/CONFIGURATION.md", PATHS.docConfiguration, false],
    ["docs/API.md", PATHS.docApi, false],
  ]
  for (const [name, file, withBuild] of plainSurfaces) {
    if (!fs.existsSync(file)) {
      report.push({ surface: name, updated: false, reason: "missing" })
      continue
    }
    const content = fs.readFileSync(file, "utf8")
    const result = bumpVersionText(content, { oldVersion, newVersion, oldBuild, newBuild, withBuild })
    writeAtomic(file, result.content)
    report.push({ surface: name, updated: true, versionHits: result.versionHits, buildHits: result.buildHits })
  }
  return report
}

function bumpPackageLock(oldVersion, newVersion) {
  if (!fs.existsSync(PATHS.packageLock)) return 0
  let content = fs.readFileSync(PATHS.packageLock, "utf8")
  const r = replaceCount(content, `"version": "${oldVersion}"`, `"version": "${newVersion}"`)
  writeAtomic(PATHS.packageLock, r.content)
  return r.count
}

// ---------------------------------------------------------------------------
// Multi-surface verification
// ---------------------------------------------------------------------------

function verifySurfaces({ expectVersion, expectBuild } = {}) {
  const central = readCentralConfig()
  const version = expectVersion || central.version
  const build = expectBuild || central.buildNumber
  const issues = []

  if (readPackageVersion() !== version) {
    issues.push(`package.json version (${readPackageVersion()}) != central version (${version})`)
  }
  if (central.buildNumber !== build) issues.push(`central buildNumber (${central.buildNumber}) != expected (${build})`)

  const lock = fs.existsSync(PATHS.packageLock) ? fs.readFileSync(PATHS.packageLock, "utf8") : ""
  const lockHits = (lock.match(new RegExp(`"version": "${version.replace(/\./g, "\\.")}"`, "g")) || []).length
  if (lockHits < 2) issues.push(`package-lock.json root version fields not synced (found ${lockHits}, expected >= 2)`)

  const ipc = fs.existsSync(PATHS.electronIpc) ? fs.readFileSync(PATHS.electronIpc, "utf8") : ""
  if (!ipc.includes(`"${version}"`)) issues.push("electron/ipc/register-ipc.ts version fallback out of sync")
  if (!ipc.includes(`"${build}"`)) issues.push("electron/ipc/register-ipc.ts build fallback out of sync")

  const updater = fs.existsSync(PATHS.electronUpdater) ? fs.readFileSync(PATHS.electronUpdater, "utf8") : ""
  if (!updater.includes(`"${build}"`)) issues.push("electron/services/updater.ts build literal out of sync")

  const main = fs.existsSync(PATHS.electronMain) ? fs.readFileSync(PATHS.electronMain, "utf8") : ""
  if (!main.includes(`v${version}`)) issues.push("electron/main.ts error-page badge out of sync")

  const loading = fs.existsSync(PATHS.appLoading) ? fs.readFileSync(PATHS.appLoading, "utf8") : ""
  if (loading.includes(`v${version}`) === false && !loading.includes("SYSTEM_RELEASE_LABEL")) {
    issues.push("app/loading.tsx version badge out of sync")
  }

  for (const [name, file] of [
    ["docs/GETTING-STARTED.md", PATHS.docGettingStarted],
    ["docs/CONFIGURATION.md", PATHS.docConfiguration],
    ["docs/API.md", PATHS.docApi],
  ]) {
    if (fs.existsSync(file) && !fs.readFileSync(file, "utf8").includes(version)) {
      issues.push(`${name} does not mention current version ${version}`)
    }
  }

  const history = readReleaseHistory()
  const last = history.releases[history.releases.length - 1]
  if (last && String(last.newVersion).replace(/^v/i, "") !== version) {
    issues.push(`release-history.json last record newVersion (${last.newVersion}) != current version (${version})`)
  }

  return { ok: issues.length === 0, issues, version, build, releaseDate: central.releaseDate }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function runValidation({ withBuild = false, testsGlob = null } = {}) {
  const results = {}

  console.log("\n[validate] TypeScript typecheck (app + electron)...")
  const typecheck = spawnSync("npm run typecheck", { cwd: rootDir, stdio: "inherit", shell: true })
  results.typecheck = typecheck.status === 0 ? "SUCCESS" : "FAILED"

  console.log(`\n[validate] Unit tests (node --test ${testsGlob || "tests/*.test.cjs"})...`)
  const tests = spawnSync(`node --test --test-concurrency=1 ${testsGlob || "tests/*.test.cjs"}`, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  })
  results.tests = tests.status === 0 ? "SUCCESS" : "FAILED"

  if (withBuild) {
    console.log("\n[validate] Production build (next build)...")
    const build = spawnSync("npm run build", { cwd: rootDir, stdio: "inherit", shell: true })
    results.build = build.status === 0 ? "SUCCESS" : "FAILED"
  } else {
    results.build = "PENDING"
  }

  results.overall =
    results.typecheck === "FAILED" || results.tests === "FAILED" || results.build === "FAILED"
      ? "FAILED"
      : results.build === "PENDING"
        ? "VALIDATED"
        : "RELEASED"
  return results
}

// ---------------------------------------------------------------------------
// Backup / revert (build & release safety)
// ---------------------------------------------------------------------------

function backupDirName(oldVersion, newVersion, buildId) {
  return path.join(rootDir, "scratch", "version-control-backups", `v${oldVersion}-to-v${newVersion}-${buildId}`)
}

function createBackup(files, dir) {
  fs.mkdirSync(dir, { recursive: true })
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const rel = path.relative(rootDir, file)
    const dest = path.join(dir, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(file, dest)
  }
  return dir
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function commandStatus() {
  const central = readCentralConfig()
  const pkg = readPackageVersion()
  const history = readReleaseHistory()
  console.log("=================================================================")
  console.log("  AQ COMPANIES - Version Control Status")
  console.log("=================================================================")
  console.log(`Central version : ${central.label} (${central.version})`)
  console.log(`Build           : ${central.buildNumber}`)
  console.log(`Release date    : ${central.releaseDate}`)
  console.log(`package.json    : ${pkg}`)
  console.log(`History records : ${history.releases.length}`)
  const check = verifySurfaces()
  if (check.ok) {
    console.log("\nAll version surfaces are in sync. OK")
  } else {
    console.log("\nDRIFT DETECTED:")
    for (const issue of check.issues) console.log(`  ! ${issue}`)
  }
  return check.ok ? 0 : 1
}

function commandDetect(opts) {
  const range = typeof opts.range === "string" ? opts.range : null
  const files = collectChangedFiles({ range, staged: Boolean(opts.staged) })
  if (files.length === 0) {
    console.log("No software changes detected. No version increment is warranted.")
    return 0
  }
  const result = classifyChanges(files, { range })
  console.log("=================================================================")
  console.log("  Change Classification (advisory)")
  console.log("=================================================================")
  console.log(`Changed entries : ${files.length}`)
  console.log(`Categories      : ${result.categories.join(", ") || "general"}`)
  console.log(`Suggested bump  : ${result.suggested.toUpperCase()}`)
  for (const reason of result.reasons) console.log(`  - ${reason}`)
  console.log("\nFiles:")
  for (const line of result.files.slice(0, 60)) console.log(`  ${line}`)
  if (result.files.length > 60) console.log(`  ... and ${result.files.length - 60} more`)
  console.log("\nEvaluate overall impact before releasing - do not classify by file count alone.")
  return 0
}

function commandRelease(opts) {
  const type = typeof opts.type === "string" ? opts.type.toLowerCase() : null
  if (!type || !CHANGE_TYPES.includes(type)) {
    console.error("release requires --type patch|minor|major (use `detect` for a suggestion)")
    return 2
  }

  const central = readCentralConfig()
  const oldVersion = central.version
  const oldBuild = central.buildNumber
  const pkgVersion = readPackageVersion()
  if (pkgVersion !== oldVersion) {
    console.error(`ABORT: package.json (${pkgVersion}) and system-version.ts (${oldVersion}) disagree.`)
    console.error("Fix the drift first with `node scripts/version-control.cjs status`.")
    return 1
  }

  // Working-tree inspection (Git integration rule)
  let gitSummary = "git unavailable - local workflow"
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], { allowFailure: true })
  const changed = git(["status", "--porcelain"], { allowFailure: true })
  if (branch !== null) {
    const count = changed ? changed.split("\n").length : 0
    gitSummary = `branch ${branch}, ${count} uncommitted entr${count === 1 ? "y" : "ies"} (preserved, not committed by this script)`
  }

  const newVersion = nextVersion(oldVersion, type)
  const treeChanged = collectChangedFiles({})
  if (treeChanged.length === 0) {
    console.warn("Notice: working tree is clean - confirm this release corresponds to a real software change.")
    console.warn("If the task contained no actual software changes, abort now: do not increment the version.")
  }
  const history = readReleaseHistory()
  const existingBuilds = history.releases.map((r) => r.build).filter(Boolean)
  const { iso: releaseDate } = todayParts()
  const buildId = generateBuildId(existingBuilds)

  console.log("=================================================================")
  console.log("  AQ COMPANIES - Release Workflow")
  console.log("=================================================================")
  console.log(`Git             : ${gitSummary}`)
  console.log(`Previous version: ${oldVersion} (Build ${oldBuild})`)
  console.log(`Change type     : ${type.toUpperCase()}`)
  console.log(`New version     : ${newVersion}`)
  console.log(`Build id        : ${buildId}`)
  console.log(`Release date    : ${releaseDate}`)

  const title = typeof opts.title === "string" ? opts.title : `Release v${newVersion}`
  const summary = typeof opts.summary === "string" ? opts.summary : ""
  const featuresAdded = asList(opts.feature)
  const featuresModified = asList(opts.modified)
  const featuresRemoved = asList(opts.removed)
  const bugsFixed = asList(opts.fixed)
  const changes = [
    ...featuresAdded.map((f) => `Added: ${f}`),
    ...featuresModified.map((f) => `Modified: ${f}`),
    ...featuresRemoved.map((f) => `Removed: ${f}`),
    ...bugsFixed.map((f) => `Fixed: ${f}`),
  ]
  if (changes.length === 0 && typeof opts.summary === "string") changes.push(summary)

  // Backup every surface we are about to touch (safe retry / revert)
  const surfaces = [
    PATHS.packageJson,
    PATHS.packageLock,
    PATHS.systemVersion,
    PATHS.electronMain,
    PATHS.electronIpc,
    PATHS.electronUpdater,
    PATHS.docGettingStarted,
    PATHS.docConfiguration,
    PATHS.docApi,
    PATHS.appLoading,
    PATHS.releaseHistory,
  ]
  const backup = createBackup(surfaces.filter(fs.existsSync), backupDirName(oldVersion, newVersion, buildId))
  console.log(`Backup          : ${path.relative(rootDir, backup)}`)

  // 1) Central config + changelog entry
  const sysRaw = fs.readFileSync(PATHS.systemVersion, "utf8")
  writeAtomic(PATHS.systemVersion, syncSystemVersionTs(sysRaw, { newVersion, newBuild: buildId, newDate: releaseDate, title, changes }))

  // 2) package.json / package-lock.json (preserve original formatting/EOLs)
  const pkgRaw = fs.readFileSync(PATHS.packageJson, "utf8")
  const pkgEol = detectEol(pkgRaw)
  const pkg = JSON.parse(pkgRaw)
  pkg.version = newVersion
  writeAtomic(PATHS.packageJson, JSON.stringify(pkg, null, 2).replace(/\n/g, pkgEol) + pkgEol)
  const lockHits = bumpPackageLock(oldVersion, newVersion)

  // 3) Remaining display surfaces
  const surfaceReport = applySurfaceReplacements({ oldVersion, newVersion, oldBuild, newBuild: buildId })

  // 4) Append-only release record
  const record = {
    previousVersion: `v${oldVersion}`,
    newVersion: `v${newVersion}`,
    build: buildId,
    releaseDate,
    changeCategory: type.toUpperCase(),
    title,
    summary,
    featuresAdded,
    featuresModified,
    featuresRemoved,
    bugsFixed,
    changeTypes: asList(opts.category),
    validation: { typecheck: "PENDING", tests: "PENDING", build: "PENDING", overall: "PENDING" },
    git: { branch: branch || null, tag: null, committed: false },
    backupPath: path.relative(rootDir, backup),
    createdAt: new Date().toISOString(),
  }
  history.releases.push(record)
  writeAtomic(PATHS.releaseHistory, JSON.stringify(history, null, 2) + "\n")

  console.log("\nSurfaces updated:")
  console.log(`  package.json -> ${newVersion}`)
  console.log(`  package-lock.json -> ${lockHits} root version field(s)`)
  console.log(`  lib/config/system-version.ts -> ${buildId} + changelog entry`)
  for (const r of surfaceReport) {
    console.log(`  ${r.surface} -> ${r.updated ? `synced (v:${r.versionHits}, b:${r.buildHits})` : r.reason}`)
  }
  console.log(`  release-history.json -> appended record #${history.releases.length}`)

  // 5) Validation gate - never claim SUCCESS without it
  let validation = { typecheck: "SKIPPED", tests: "SKIPPED", build: opts.build ? "SKIPPED" : "PENDING", overall: "PENDING" }
  if (!opts["no-validate"]) {
    validation = runValidation({ withBuild: Boolean(opts.build), testsGlob: opts.tests || null })
    const idx = history.releases.length - 1
    const current = readReleaseHistory()
    current.releases[idx].validation = validation
    writeAtomic(PATHS.releaseHistory, JSON.stringify(current, null, 2) + "\n")
  }

  // 6) Optional tagging (never overwrite an existing tag, never auto-commit)
  if (opts.tag) {
    const tagName = `v${newVersion}`
    const exists = git(["rev-parse", "-q", "--verify", `refs/tags/${tagName}`], { allowFailure: true })
    if (exists !== null && exists !== "") {
      console.warn(`\nTag ${tagName} already exists - left untouched (existing release tags are never overwritten).`)
    } else {
      git(["tag", "-a", tagName, "-m", `Release ${tagName} (Build ${buildId})`])
      record.git.tag = tagName
      console.log(`Tag created: ${tagName}`)
    }
  }

  printReport({
    previousVersion: oldVersion,
    newVersion,
    buildId,
    changeType: type.toUpperCase(),
    featuresAdded,
    featuresModified,
    featuresRemoved,
    bugsFixed,
    summary,
    validation,
  })

  if (validation.overall === "FAILED") {
    console.error("\nValidation FAILED. Previous version metadata was preserved in:")
    console.error(`  ${backup}`)
    console.error("Roll back with: node scripts/version-control.cjs revert --last")
    return 1
  }
  return 0
}

function printReport(r) {
  const buildStatus = r.validation.build === "SUCCESS" ? "SUCCESS" : r.validation.build === "FAILED" ? "FAILED" : "PENDING"
  const metadataStatus = r.validation.overall === "FAILED" ? "FAILED" : "UPDATED"
  const notesStatus = r.summary || r.featuresAdded.length || r.bugsFixed.length ? "GENERATED" : "MINIMAL"
  console.log("\n=================================================================")
  console.log("                       SOFTWARE UPDATE REPORT")
  console.log("=================================================================")
  console.log(`Previous Version : ${r.previousVersion}`)
  console.log(`New Version      : ${r.newVersion}`)
  console.log(`Build            : ${r.buildId}`)
  console.log(`Change Type      : ${r.changeType}`)
  console.log("")
  console.log("Changes:")
  for (const f of r.featuresAdded) console.log(`  - Added: ${f}`)
  for (const f of r.featuresModified) console.log(`  - Modified: ${f}`)
  for (const f of r.featuresRemoved) console.log(`  - Removed: ${f}`)
  for (const f of r.bugsFixed) console.log(`  - Fixed: ${f}`)
  if (r.summary) console.log(`  - ${r.summary}`)
  console.log("")
  console.log(`Typecheck        : ${r.validation.typecheck}`)
  console.log(`Unit Tests       : ${r.validation.tests}`)
  console.log(`Production Build : ${r.validation.build === "PENDING" ? "PENDING (installer not built - run npm run release:win to publish)" : r.validation.build}`)
  console.log("")
  console.log(`Build Status     : ${buildStatus === "PENDING" ? "PENDING (not yet built/published)" : buildStatus}`)
  console.log(`Version Metadata : ${metadataStatus}`)
  console.log(`Release Notes    : ${notesStatus}`)
  console.log("=================================================================")
}

function commandHistory(opts) {
  const history = readReleaseHistory()
  const limit = Number(opts.limit) || history.releases.length
  const records = history.releases.slice(-limit).reverse()
  console.log(`Release history (${history.releases.length} records, append-only):`)
  for (const r of records) {
    console.log(`\n  ${r.newVersion}  (Build ${r.build}, ${r.releaseDate})  ${r.changeCategory}`)
    console.log(`  ${r.title}${r.summary ? ` - ${r.summary}` : ""}`)
    console.log(`  validation: typecheck=${r.validation?.typecheck}, tests=${r.validation?.tests}, build=${r.validation?.build}`)
    if (r.git?.tag) console.log(`  tag: ${r.git.tag}`)
  }
  return 0
}

function commandRevert(opts) {
  if (!opts.last) {
    console.error("revert currently supports only --last")
    return 2
  }
  const history = readReleaseHistory()
  const record = history.releases[history.releases.length - 1]
  if (!record) {
    console.error("Nothing to revert - release history is empty.")
    return 1
  }
  const backupRoot = path.join(rootDir, record.backupPath || "")
  if (!fs.existsSync(backupRoot)) {
    console.error(`Backup not found: ${record.backupPath}`)
    return 1
  }
  // Restore every file present in the backup snapshot
  const restore = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) restore(full)
      else {
        const rel = path.relative(backupRoot, full)
        const dest = path.join(rootDir, rel)
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(full, dest)
        console.log(`  restored ${rel}`)
      }
    }
  }
  restore(backupRoot)
  history.releases.pop()
  writeAtomic(PATHS.releaseHistory, JSON.stringify(history, null, 2) + "\n")
  console.log(`Reverted release ${record.newVersion} (Build ${record.build}). Previous records preserved.`)
  return 0
}

function commandRevalidate(opts) {
  const history = readReleaseHistory()
  if (history.releases.length === 0) {
    console.error("No release records to revalidate.")
    return 1
  }
  const record = history.releases[history.releases.length - 1]
  console.log("=================================================================")
  console.log(`  Re-validation: ${record.newVersion} (Build ${record.build})`)
  console.log("=================================================================")
  const validation = runValidation({ withBuild: Boolean(opts.build), testsGlob: opts.tests || null })
  const current = readReleaseHistory()
  current.releases[current.releases.length - 1].validation = validation
  writeAtomic(PATHS.releaseHistory, JSON.stringify(current, null, 2) + "\n")
  printReport({
    previousVersion: record.previousVersion,
    newVersion: String(record.newVersion).replace(/^v/, ""),
    buildId: record.build,
    changeType: record.changeCategory,
    featuresAdded: record.featuresAdded || [],
    featuresModified: record.featuresModified || [],
    featuresRemoved: record.featuresRemoved || [],
    bugsFixed: record.bugsFixed || [],
    summary: record.summary,
    validation,
  })
  return validation.overall === "FAILED" ? 1 : 0
}

function commandVerify() {
  const check = verifySurfaces()
  if (check.ok) {
    console.log(`OK - all version surfaces agree on ${check.version} (Build ${check.build}, ${check.releaseDate})`)
    return 0
  }
  console.error(`Version drift detected around ${check.version}:`)
  for (const issue of check.issues) console.error(`  ! ${issue}`)
  return 1
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const cmd = opts._[0] || "status"
  switch (cmd) {
    case "status": return commandStatus()
    case "detect": return commandDetect(opts)
    case "release": return commandRelease(opts)
    case "verify": return commandVerify()
    case "history": return commandHistory(opts)
    case "revalidate": return commandRevalidate(opts)
    case "revert": return commandRevert(opts)
    default:
      console.error(`Unknown command "${cmd}". Available: status | detect | release | verify | history | revalidate | revert`)
      return 2
  }
}

module.exports = {
  generateBuildId,
  nextVersion,
  classifyChanges,
  collectChangedFiles,
  readCentralConfig,
  readPackageVersion,
  readReleaseHistory,
  verifySurfaces,
  syncSystemVersionTs,
  applySurfaceReplacements,
  bumpVersionText,
  PATHS,
}

if (require.main === module) {
  process.exitCode = main()
}
