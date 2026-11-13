const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Watermark Cargo Freighter Jet Photo & Thumbnail Audit', async (t) => {
  const projectRoot = path.join(__dirname, '..')
  const photoPath = path.join(projectRoot, 'public', 'images', 'photo_cargo_freighter_jet.jpg')

  await t.test('1. photo_cargo_freighter_jet.jpg exists on disk with high resolution', () => {
    assert.ok(fs.existsSync(photoPath), 'photo_cargo_freighter_jet.jpg must exist')
    const stat = fs.statSync(photoPath)
    assert.ok(stat.size > 50000, `Image must be a high-resolution asset (> 50KB): was ${stat.size}`)
  })

  await t.test('2. lib/document-backgrounds.ts registers Cargo Freighter Jet (Photo)', () => {
    const bgTsPath = path.join(projectRoot, 'lib', 'document-backgrounds.ts')
    const bgTs = fs.readFileSync(bgTsPath, 'utf8')
    assert.ok(
      bgTs.includes("label: 'Cargo Freighter Jet (Photo)'"),
      'Cargo Freighter Jet (Photo) must be registered in document-backgrounds.ts'
    )
    assert.ok(
      bgTs.includes("url: '/images/photo_cargo_freighter_jet.jpg'"),
      'Cargo Freighter Jet must point to /images/photo_cargo_freighter_jet.jpg'
    )
    assert.ok(
      bgTs.includes("category: 'Aviation'"),
      'Cargo Freighter Jet category must be Aviation'
    )
  })

  await t.test('3. watermark-thumbnail.tsx presents clean un-obscured preview without corner crop brackets', () => {
    const thumbPath = path.join(projectRoot, 'components', 'bill-of-lading', 'watermark-thumbnail.tsx')
    const thumbTs = fs.readFileSync(thumbPath, 'utf8')
    assert.ok(
      !thumbTs.includes('Subtle Paper Corner Marks to simulate authentic security document'),
      'Thumbnail must not draw distracting corner brackets over watermark photos'
    )
    assert.ok(
      !thumbTs.includes("top-1 left-1 w-1.5 h-1.5 border-t border-l"),
      'Thumbnail must not contain corner overlay borders'
    )
    assert.ok(
      thumbTs.includes("contrast(1.04) brightness(0.98)"),
      'Photo contrast must use gentle calibrated grading rather than heavy oversaturation'
    )
  })
})
