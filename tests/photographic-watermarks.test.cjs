const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('High-Definition Photographic Logistics Watermarks Suite', async (t) => {
  const backgroundsDir = path.join(__dirname, '..', 'public', 'images', 'document-backgrounds')
  assert.ok(fs.existsSync(backgroundsDir), 'document-backgrounds directory must exist')

  const items = [
    { name: 'cargo-convoy', title: 'Cargo Convoy', category: 'Overland' },
    { name: 'rail-corridor', title: 'Rail Corridor', category: 'Overland' },
    { name: 'winding-pass', title: 'Winding Pass', category: 'Overland' },
    { name: 'horizon-route', title: 'Horizon Route', category: 'Overland' },
    { name: 'ocean-passage', title: 'Ocean Passage', category: 'Maritime' },
    { name: 'harbor-morning', title: 'Harbor Morning', category: 'Maritime' },
    { name: 'coastal-freight', title: 'Coastal Freight', category: 'Maritime' },
    { name: 'container-port', title: 'Container Port', category: 'Maritime' },
    { name: 'lighthouse-bay', title: 'Lighthouse Bay', category: 'Maritime' },
    { name: 'island-channel', title: 'Island Channel', category: 'Maritime' },
    { name: 'deep-blue', title: 'Deep Blue', category: 'Maritime' },
    { name: 'sunset-anchorage', title: 'Sunset Anchorage', category: 'Maritime' },
  ]

  await t.test('1. All 12 replaced watermarks exist physically with high-definition size', () => {
    for (const item of items) {
      const p = path.join(backgroundsDir, `${item.name}.svg`)
      assert.ok(fs.existsSync(p), `${item.name}.svg must physically exist on disk`)
      const stat = fs.statSync(p)
      assert.ok(stat.size > 50 * 1024, `${item.name}.svg must be high-definition (> 50KB): was ${stat.size} bytes`)
    }
  })

  await t.test('2. All 12 files embed photographic base64 data and responsive viewBox', () => {
    for (const item of items) {
      const p = path.join(backgroundsDir, `${item.name}.svg`)
      const content = fs.readFileSync(p, 'utf8')

      assert.ok(content.includes('<svg'), `${item.name}.svg must be valid XML SVG`)
      assert.ok(content.includes('viewBox="0 0 900 1400"'), `${item.name}.svg must declare viewBox="0 0 900 1400"`)
      assert.ok(content.includes('<image href="data:image/jpeg;base64,'), `${item.name}.svg must embed realistic photographic JPEG`)
      assert.ok(content.includes('preserveAspectRatio="xMidYMid slice"'), `${item.name}.svg must scale photo edge-to-edge`)
    }
  })

  await t.test('3. Document legibility vignette & security frames are present', () => {
    for (const item of items) {
      const p = path.join(backgroundsDir, `${item.name}.svg`)
      const content = fs.readFileSync(p, 'utf8')

      assert.ok(content.includes('id="doc-vignette"'), `${item.name}.svg must have document legibility vignette`)
      assert.ok(content.includes('fill="url(#doc-vignette)"'), `${item.name}.svg must render vignette overlay`)
      assert.ok(content.includes('SKY ARIANA LOGISTICS'), `${item.name}.svg must include carrier security watermark`)
      assert.ok(content.includes('DOCUMENT WATERMARK VERIFIED'), `${item.name}.svg must include document verification ribbon`)
    }
  })
})
