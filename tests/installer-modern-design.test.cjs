const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')

function getMakensisPath() {
  const candidates = [
    'C:\\Users\\Ahsanullah Qureshi\\AppData\\Local\\electron-builder\\Cache\\nsis-3.0.4.1\\nsis-3.0.4.1-1mx3n\\Bin\\makensis.exe',
    'C:\\Users\\Ahsanullah Qureshi\\AppData\\Local\\electron-builder\\Cache\\nsis-3.0.4.1\\nsis-3.0.4.1-1mx3n\\makensis.exe',
    'C:\\Users\\Ahsanullah Qureshi\\AppData\\Local\\electron-builder\\Cache\\nsis@1.2.1\\nsis-bundle-3.12-wfwns\\windows\\Bin\\makensis.exe',
    'C:\\Users\\Ahsanullah Qureshi\\AppData\\Local\\electron-builder\\Cache\\nsis@1.2.1\\nsis-bundle-3.12-wfwns\\windows\\makensis.exe',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const res = cp.spawnSync(c, ['-VERSION'], { encoding: 'utf8' })
        if (res.status === 0) return c
      } catch {}
    }
  }
  return null
}

test('NSIS Modern Installer Design & Visual Architecture Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..')
  const nshPath = path.join(rootDir, 'build', 'installer.nsh')
  const headerBmp = path.join(rootDir, 'build', 'installerHeader.bmp')
  const sidebarBmp = path.join(rootDir, 'build', 'installerSidebar.bmp')
  const unSidebarBmp = path.join(rootDir, 'build', 'uninstallerSidebar.bmp')

  await t.test('1. installer.nsh contains modern styling, Fluent UI hooks, and process termination shield', () => {
    assert.ok(fs.existsSync(nshPath), 'build/installer.nsh must exist')
    const content = fs.readFileSync(nshPath, 'utf8')

    // Modern background and styling
    assert.match(content, /!define MUI_BGCOLOR "FFFFFF"/, 'Sets modern white background')
    assert.match(content, /!define MUI_INSTFILESPAGE_PROGRESSBAR "smooth"/, 'Sets smooth progress bar')
    assert.match(content, /!define MUI_CUSTOMFUNCTION_GUIINIT customGuiInit/, 'Binds custom GUI init')

    // InstFiles show hook
    assert.match(content, /customPageAfterChangeDir/, 'Defines customPageAfterChangeDir macro')
    assert.match(content, /!define MUI_PAGE_CUSTOMFUNCTION_SHOW customInstFilesShow/, 'Binds customInstFilesShow before instfiles page')

    // Royal Blue progress bar
    assert.match(content, /uxtheme::SetWindowTheme/, 'Detaches legacy WinXP theme bitmap')
    assert.match(content, /PBM_SETBARCOLOR/, 'Sets royal blue progress bar color')
    assert.match(content, /PBM_SETBKCOLOR/, 'Sets light slate background track')

    // Architecture card in the empty void
    assert.match(content, /AQ COMPANIES Enterprise Core Architecture/, 'Creates architecture showcase card')
    assert.match(content, /Multi-Modal BOL Engine/, 'Showcases BOL engine')
    assert.match(content, /Dual-Currency Ledgers/, 'Showcases accounting invariance')
    assert.match(content, /Biometric Security Vault/, 'Showcases biometric security')
    assert.match(content, /Cross-Device Peer Sync/, 'Showcases cloud sync')

    // Process termination shield
    assert.match(content, /taskkill \/F \/T \/IM "AQ COMPANIES\.exe"/, 'Terminates app instances')
    assert.match(content, /taskkill \/F \/T \/IM "aq-backend\.exe"/, 'Terminates backend workers')
    assert.match(content, /taskkill \/F \/T \/IM "electron\.exe"/, 'Terminates electron instances')

    // Lifecycle hooks
    assert.match(content, /!macro preInit/, 'Defines preInit for earliest termination')
    assert.match(content, /!macro customInit/, 'Defines customInit for inner & outer instances')
    assert.match(content, /!macro customUnInstallCheck/, 'Defines customUnInstallCheck to bypass error: 2')
    assert.match(content, /!macro customUnInstallCheckCurrentUser/, 'Defines customUnInstallCheckCurrentUser')
    assert.match(content, /!macro customRemoveFiles/, 'Defines customRemoveFiles to avoid atomicRMDir locks')
  })

  await t.test('2. High-DPI BMP assets exist with valid dimensions and signatures', () => {
    for (const [file, expectedWidth, expectedHeight] of [
      [headerBmp, 300, 114],
      [sidebarBmp, 328, 628],
      [unSidebarBmp, 328, 628],
    ]) {
      assert.ok(fs.existsSync(file), `${path.basename(file)} must exist`)
      const buf = fs.readFileSync(file)
      // Check BM signature
      assert.equal(buf.toString('ascii', 0, 2), 'BM', `${file} must be a valid BMP`)
      // Check dimensions from BMP DIB header (offset 18 = width, offset 22 = height)
      const w = buf.readInt32LE(18)
      const h = buf.readInt32LE(22)
      assert.equal(w, expectedWidth, `${path.basename(file)} width must be ${expectedWidth}`)
      assert.equal(h, expectedHeight, `${path.basename(file)} height must be ${expectedHeight}`)
    }
  })

  await t.test('3. NSIS compiler validates script syntax and compiles without error', () => {
    const makensis = getMakensisPath()
    if (!makensis) {
      console.log('Skipping standalone makensis verification (no working makensis found)')
      return
    }

    const testNsi = path.join(rootDir, 'build', 'test-compile-check.nsi')
    const testOut = path.join(rootDir, 'build', 'test-compile-out.exe')

    const nsiCode = `
!include "MUI2.nsh"
Name "Test"
OutFile "${testOut.replace(/\\/g, '\\\\')}"
RequestExecutionLevel user

!include "${nshPath.replace(/\\/g, '\\\\')}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro customPageAfterChangeDir
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  Sleep 100
SectionEnd
`
    fs.writeFileSync(testNsi, nsiCode, 'utf8')
    try {
      const res = cp.spawnSync(makensis, [testNsi], { encoding: 'utf8' })
      assert.equal(res.status, 0, `makensis exited with code ${res.status}: ${res.stdout}\n${res.stderr}`)
      assert.ok(fs.existsSync(testOut), 'Generated test installer binary must exist')
    } finally {
      if (fs.existsSync(testNsi)) fs.unlinkSync(testNsi)
      if (fs.existsSync(testOut)) fs.unlinkSync(testOut)
    }
  })

  await t.test('4. NSIS compiler validates customUnInstallCheck & customRemoveFiles integration', () => {
    const makensis = getMakensisPath()
    if (!makensis) {
      return
    }

    const testNsi = path.join(rootDir, 'build', 'test-uninstall-check.nsi')
    const testOut = path.join(rootDir, 'build', 'test-uninstall-out.exe')

    const nsiCode = `
!include "MUI2.nsh"
!include "LogicLib.nsh"
Name "TestUninstallCheck"
OutFile "${testOut.replace(/\\/g, '\\\\')}"
RequestExecutionLevel user

!include "${nshPath.replace(/\\/g, '\\\\')}"

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  ; Simulate uninstaller exit code 2 (the exact error the user encountered)
  StrCpy $R0 2
  !insertmacro customUnInstallCheck
  !insertmacro customUnInstallCheckCurrentUser
  !insertmacro preInit
  !insertmacro customInit
  !insertmacro customRemoveFiles
SectionEnd
`
    fs.writeFileSync(testNsi, nsiCode, 'utf8')
    try {
      const res = cp.spawnSync(makensis, [testNsi], { encoding: 'utf8' })
      assert.equal(res.status, 0, `makensis exited with code ${res.status}: ${res.stdout}\n${res.stderr}`)
      assert.ok(fs.existsSync(testOut), 'Generated test uninstall installer binary must exist')
    } finally {
      if (fs.existsSync(testNsi)) fs.unlinkSync(testNsi)
      if (fs.existsSync(testOut)) fs.unlinkSync(testOut)
    }
  })
})
