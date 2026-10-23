/**
 * AQ COMPANIES - Release Manifest Generator
 * Atomically generates or refreshes release-manifest.json in the release directory.
 */

const fs = require("node:fs")
const path = require("node:path")
const crypto = require("node:crypto")

const rootDir = path.resolve(__dirname, "..")
const releaseDir = path.join(rootDir, "release")

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath)
  return crypto.createHash("sha256").update(fileBuffer).digest("hex")
}

function getAppVersionInfo() {
  let version = "5.1.2"
  let buildNumber = "2026.10.23-PRO"
  
  const pkgPath = path.join(rootDir, "package.json")
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      if (pkg.version) version = pkg.version
    } catch {}
  }

  const sysVerPath = path.join(rootDir, "lib", "config", "system-version.ts")
  if (fs.existsSync(sysVerPath)) {
    try {
      const raw = fs.readFileSync(sysVerPath, "utf8")
      const buildMatch = raw.match(/buildNumber:\s*["']([^"']+)["']/)
      if (buildMatch) buildNumber = buildMatch[1]
    } catch {}
  }

  return { version, buildNumber }
}

function generateReleaseManifest(targetDir = releaseDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  // Find the installer
  const files = fs.readdirSync(targetDir)
  const installerName = files.find(f => f.startsWith("AQ-COMPANIES-Setup") && f.endsWith(".exe"))
  if (!installerName) {
    console.error(`Error: No AQ-COMPANIES-Setup*.exe found in ${targetDir}`)
    return null
  }

  const installerPath = path.join(targetDir, installerName)
  const stats = fs.statSync(installerPath)
  const sha256 = computeSha256(installerPath)
  const { version, buildNumber } = getAppVersionInfo()

  // Extract releaseDate from latest.yml if present
  let releaseDate = stats.mtime.toISOString()
  const latestYmlPath = path.join(targetDir, "latest.yml")
  if (fs.existsSync(latestYmlPath)) {
    try {
      const yml = fs.readFileSync(latestYmlPath, "utf8")
      const dateMatch = yml.match(/releaseDate:\s*['"]?([^'"\n]+)/)
      if (dateMatch) releaseDate = dateMatch[1]
    } catch {}
  }

  const manifest = {
    appName: "AQ-COMPANIES",
    version,
    build: buildNumber,
    platform: "win32",
    architecture: "x64",
    installer: installerName,
    sha256,
    size: stats.size,
    formattedSize: formatBytes(stats.size),
    releaseDate,
    channel: "stable",
    minimumSupportedVersion: "5.0.0"
  }

  // Write atomically
  const manifestPath = path.join(targetDir, "release-manifest.json")
  const tempPath = `${manifestPath}.tmp.${Date.now()}`
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), "utf8")
  fs.renameSync(tempPath, manifestPath)

  // Also ensure companion .sha256 file exists
  const shaFile = `${installerPath}.sha256`
  fs.writeFileSync(shaFile, `${sha256} *${installerName}\n`, "utf8")

  console.log(`✓ Generated release-manifest.json for ${installerName} (${formatBytes(stats.size)})`)
  console.log(`  Version: ${version} | Build: ${buildNumber} | SHA-256: ${sha256}`)
  return manifest
}

if (require.main === module) {
  generateReleaseManifest()
}

module.exports = {
  generateReleaseManifest,
  computeSha256,
  getAppVersionInfo,
  formatBytes,
}
