const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('BOL Settings Logo Designs & Vintage Heritage Selector Suite', async (t) => {
  const rootDir = path.resolve(__dirname, '..')
  const typesPath = path.join(rootDir, 'components', 'bill-of-lading', 'settings', 'bol-settings-types.ts')
  const storagePath = path.join(rootDir, 'components', 'bill-of-lading', 'settings', 'bol-settings-storage.ts')
  const centerPath = path.join(rootDir, 'components', 'bill-of-lading', 'settings', 'bol-settings-center.tsx')
  const headerPath = path.join(rootDir, 'components', 'bill-of-lading', 'header.tsx')
  const previewPath = path.join(rootDir, 'components', 'bill-of-lading', 'a4-preview.tsx')
  const editorPath = path.join(rootDir, 'components', 'bill-of-lading', 'bol-editor.tsx')

  const typesSource = fs.readFileSync(typesPath, 'utf8')
  const storageSource = fs.readFileSync(storagePath, 'utf8')
  const centerSource = fs.readFileSync(centerPath, 'utf8')
  const headerSource = fs.readFileSync(headerPath, 'utf8')
  const previewSource = fs.readFileSync(previewPath, 'utf8')
  const editorSource = fs.readFileSync(editorPath, 'utf8')

  await t.test('1. bol-settings-types exports OFFICIAL_LOGO_PRESETS with all required presets', () => {
    assert.ok(typesSource.includes('OFFICIAL_LOGO_PRESETS'), 'Must export OFFICIAL_LOGO_PRESETS')
    assert.ok(typesSource.includes('modern-flat'), 'Must include modern-flat preset')
    assert.ok(typesSource.includes('modern-3d'), 'Must include modern-3d preset')
    assert.ok(typesSource.includes('vintage-founding-2011'), 'Must include vintage-founding-2011 preset')
    assert.ok(typesSource.includes('modern-typography'), 'Must include modern-typography preset')
    assert.ok(typesSource.includes('classic-heritage-full'), 'Must include classic-heritage-full preset')
    assert.ok(typesSource.includes('classic-horizontal'), 'Must include classic-horizontal preset')
    assert.ok(typesSource.includes('classic-stack'), 'Must include classic-stack preset')
    assert.ok(typesSource.includes('circular-seal'), 'Must include circular-seal preset')
    assert.ok(typesSource.includes('logoDesignId?: string'), 'BolDocumentSettings must declare logoDesignId')
    assert.ok(typesSource.includes('brandLockupUrl?: string'), 'BolDocumentSettings must declare brandLockupUrl')
  })

  await t.test('2. All official logo image files exist on disk in public/images/logos and have valid size', () => {
    const expectedFiles = [
      'sky-ariana-modern-flat.png',
      'sky-ariana-modern-flat-lockup.png',
      'sky-ariana-modern-3d.png',
      'sky-ariana-modern-3d-lockup.png',
      'sky-ariana-modern-typography.png',
      'sky-ariana-vintage-heritage.png',
      'sky-ariana-vintage-heritage-emblem.png',
      'sky-ariana-vintage-heritage-lockup.png',
      'sky-ariana-classic-heritage.png',
      'sky-ariana-classic-horizontal.png',
      'sky-ariana-classic-stack.png',
      'sky-ariana-circular-seal.png',
    ]

    for (const filename of expectedFiles) {
      const fullPath = path.join(rootDir, 'public', 'images', 'logos', filename)
      assert.ok(fs.existsSync(fullPath), `File ${filename} must exist in public/images/logos`)
      const stats = fs.statSync(fullPath)
      assert.ok(stats.size > 10000, `File ${filename} must be a substantial image (> 10KB)`)
    }
  })

  await t.test('3. bol-settings-storage loads, saves, and exports logoDesignId and brandLockupUrl', () => {
    assert.ok(storageSource.includes('logoDesignId: parsed.logoDesignId'), 'loadBolDocumentSettings must parse logoDesignId')
    assert.ok(storageSource.includes('brandLockupUrl: parsed.brandLockupUrl'), 'loadBolDocumentSettings must parse brandLockupUrl')
    assert.ok(storageSource.includes('logoDesignId: settings.logoDesignId'), 'exportSettingsToJson must serialize logoDesignId')
  })

  await t.test('4. BillOfLadingHeader receives brandLockupSrc and supports classic stacked styling', () => {
    assert.ok(headerSource.includes('brandLockupSrc?: string'), 'BillOfLadingHeaderProps must include brandLockupSrc')
    assert.ok(headerSource.includes('logoDesignId?: string'), 'BillOfLadingHeaderProps must include logoDesignId')
    assert.ok(headerSource.includes('resolvedBrandLockup'), 'Must compute resolvedBrandLockup')
    assert.ok(headerSource.includes('classic-stack'), 'Must support specialized height for classic-stack')
  })

  await t.test('5. A4Preview passes brandLockupSrc and logoDesignId to Page1Header', () => {
    assert.ok(previewSource.includes('brandLockupUrl?: string'), 'A4PreviewProps must declare brandLockupUrl')
    assert.ok(previewSource.includes('logoDesignId?: string'), 'A4PreviewProps must declare logoDesignId')
    assert.ok(previewSource.includes('brandLockupSrc={resolvedBrandLockup}'), 'Must pass brandLockupSrc to Page1Header')
  })

  await t.test('6. BolSettingsCenter renders Logo & Branding gallery with filter pills and live preview', () => {
    assert.ok(centerSource.includes('OFFICIAL_LOGO_PRESETS'), 'Must utilize OFFICIAL_LOGO_PRESETS in gallery')
    assert.ok(centerSource.includes('handleSelectLogoPreset'), 'Must define handleSelectLogoPreset')
    assert.ok(centerSource.includes('Live Bill of Lading Header Preview'), 'Must render live header preview strip')
    assert.ok(centerSource.includes('Upload Custom Logo'), 'Must support custom logo uploads')
  })

  await t.test('7. bol-editor connects brandLockupUrl and logoDesignId state to BolSettingsCenter and A4Preview', () => {
    assert.ok(editorSource.includes('const [brandLockupUrl, setBrandLockupUrl]'), 'Must declare brandLockupUrl state')
    assert.ok(editorSource.includes('const [logoDesignId, setLogoDesignId]'), 'Must declare logoDesignId state')
    assert.ok(editorSource.includes('brandLockupUrl={brandLockupUrl}'), 'Must pass brandLockupUrl to BolSettingsCenter and A4Preview')
    assert.ok(editorSource.includes('onLogoDesignChange'), 'Must wire onLogoDesignChange handler')
  })
})
