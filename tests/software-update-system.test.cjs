const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")

// Import services and utilities
const loadTypescript = require("./load-typescript.cjs")
const { generateReleaseManifest } = require("../scripts/generate-release-manifest.cjs")
const {
  compareSemVer,
  evaluateSystemUpdate,
  runSystemDiagnostics,
  createPreUpdateBackup,
  getUpdateHistory,
  getUpdateSettings,
  saveUpdateSettings,
} = loadTypescript("lib/services/system-update-service.ts")
const { CURRENT_SYSTEM_VERSION } = loadTypescript("lib/config/system-version.ts")

test("TEST 1: Same Version (5.1.2 == 5.1.2) - Software Is Up to Date", async () => {
  const result = await evaluateSystemUpdate()
  assert.equal(result.success, true)
  assert.equal(result.currentVersion, CURRENT_SYSTEM_VERSION.version)
  
  if (result.installerPath && fs.existsSync(result.installerPath)) {
    // When the release installer is 5.1.2, status must be up_to_date and hasUpdate must be false
    if (result.availableVersion === result.currentVersion) {
      assert.equal(result.status, "up_to_date")
      assert.equal(result.hasUpdate, false)
      assert.equal(result.isRepairOrReinstall, true)
    }
  }
})

test("TEST 2: SemVer Comparison Logic", () => {
  // Test newer version available
  assert.equal(compareSemVer("5.1.3", "5.1.2") > 0, true)
  assert.equal(compareSemVer("5.2.0", "5.1.9") > 0, true)
  assert.equal(compareSemVer("6.0.0", "5.9.9") > 0, true)

  // Test same version
  assert.equal(compareSemVer("5.1.2", "5.1.2") === 0, true)
  assert.equal(compareSemVer("v5.1.2", "5.1.2") === 0, true)

  // Test older version (downgrade)
  assert.equal(compareSemVer("5.1.1", "5.1.2") < 0, true)
  assert.equal(compareSemVer("4.9.0", "5.0.0") < 0, true)
})

test("TEST 3: Release Manifest Generation and SHA-256 Calculation", () => {
  const releaseDir = path.join(process.cwd(), "release")
  const installerPath = path.join(releaseDir, "AQ-COMPANIES-Setup.exe")
  
  if (fs.existsSync(installerPath)) {
    const manifest = generateReleaseManifest(releaseDir)
    assert.equal(manifest.appName, "AQ-COMPANIES")
    assert.equal(typeof manifest.sha256, "string")
    assert.equal(manifest.sha256.length, 64)
    assert.equal(manifest.size > 0, true)
    assert.equal(manifest.platform, "win32")
    assert.equal(manifest.architecture, "x64")
    
    // Verify hash matches actual file
    const actualBytes = fs.readFileSync(installerPath)
    const actualHash = crypto.createHash("sha256").update(actualBytes).digest("hex")
    assert.equal(manifest.sha256, actualHash)
  }
})

test("TEST 4: Missing Installer Handling", async () => {
  const fakePath = path.join(process.cwd(), "release", "non-existent-setup.exe")
  const result = await evaluateSystemUpdate(fakePath)
  assert.equal(result.success, true)
  assert.equal(result.status, "not_found")
  assert.equal(result.hasUpdate, false)
  assert.equal(result.installerPath, null)
})

test("TEST 5: Corrupted / Hash Mismatch Detection", async () => {
  // Create a temporary invalid file to test hash mismatch
  const tempDir = path.join(process.cwd(), "data", "temp-test")
  fs.mkdirSync(tempDir, { recursive: true })
  const fakeInstaller = path.join(tempDir, "Fake-Setup.exe")
  const manifestFile = path.join(tempDir, "release-manifest.json")

  try {
    fs.writeFileSync(fakeInstaller, "Corrupted installer bytes")
    fs.writeFileSync(manifestFile, JSON.stringify({
      appName: "AQ-COMPANIES",
      version: "5.1.3",
      sha256: "0000000000000000000000000000000000000000000000000000000000000000",
      size: 999999
    }))

    const result = await evaluateSystemUpdate(fakeInstaller)
    assert.equal(result.status, "verification_failed")
    assert.equal(result.isHashVerified, false)
    assert.equal(result.hasUpdate, false)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test("TEST 6: System Diagnostics & Disk Space Verification", async () => {
  const diag = await runSystemDiagnostics()
  assert.equal(typeof diag.isHealthy, "boolean")
  assert.equal(typeof diag.diskSpace.hasSufficientSpace, "boolean")
  assert.equal(typeof diag.diskSpace.freeBytes, "number")
  assert.equal(Array.isArray(diag.workers), true)
  assert.equal(Array.isArray(diag.fileLocks), true)
  // Ensure disk space required is minimum 2GB
  assert.equal(diag.diskSpace.requiredBytes >= 2 * 1024 * 1024 * 1024, true)
})

test("TEST 7: Pre-Update Backup and Business Data Preservation", async () => {
  const backup = await createPreUpdateBackup()
  assert.equal(backup.success, true)
  assert.equal(typeof backup.backupPath, "string")
  assert.equal(fs.existsSync(backup.backupPath), true)

  // Verify backup manifest exists
  const manifestPath = path.join(backup.backupPath, "backup-manifest.json")
  assert.equal(fs.existsSync(manifestPath), true)
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  assert.equal(manifest.appVersion, CURRENT_SYSTEM_VERSION.version)
  assert.equal(typeof manifest.recordCounts, "object")
})

test("TEST 8: Update Settings Configuration Persistence", () => {
  const current = getUpdateSettings()
  assert.equal(typeof current.autoCheck, "boolean")
  assert.equal(typeof current.autoBackupBeforeUpdate, "boolean")

  // Update a test setting
  const updated = saveUpdateSettings({
    checkIntervalHours: 6,
    releaseChannel: "stable"
  })
  assert.equal(updated.checkIntervalHours, 6)
  assert.equal(updated.releaseChannel, "stable")
})

test("TEST 9: Update History Logging", () => {
  const history = getUpdateHistory()
  assert.equal(Array.isArray(history), true)
})

test("TEST 10: Desktop Window Interface API Contract", () => {
  // Verify electron/desktop-api.d.ts exports required functions
  const desktopApiFile = path.join(process.cwd(), "electron", "desktop-api.d.ts")
  assert.equal(fs.existsSync(desktopApiFile), true)
  const apiContent = fs.readFileSync(desktopApiFile, "utf8")
  
  const requiredMethods = [
    "checkForUpdates",
    "installUpdate",
    "diagnoseUpdate",
    "prepareUpdate",
    "createUpdateBackup",
    "getUpdateHistory",
    "getUpdateSettings",
    "saveUpdateSettings",
    "openUpdateFolder",
    "selectInstallerFile"
  ]

  for (const method of requiredMethods) {
    assert.equal(
      apiContent.includes(method),
      true,
      `desktop-api.d.ts must expose ${method}`
    )
  }
})
