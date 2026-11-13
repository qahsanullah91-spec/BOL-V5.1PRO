const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('Party Directory & Smart Merge: Shipper Seed Data Validation', async (t) => {
  const seedPath = path.join(__dirname, '..', 'lib', 'data', 'shippers-from-pdf.json')
  assert.ok(fs.existsSync(seedPath), 'shippers-from-pdf.json must exist')

  const shippers = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
  assert.ok(Array.isArray(shippers), 'shippers-from-pdf.json must be an array')
  assert.ok(shippers.length >= 60, `Expected at least 60 shippers, got ${shippers.length}`)

  await t.test('RAHMAT NAZAR LTD has full address and contact', () => {
    const rahmat = shippers.find((s) => s.name.toUpperCase().includes('RAHMAT NAZAR'))
    assert.ok(rahmat, 'RAHMAT NAZAR LTD must exist in seed data')
    assert.equal(rahmat.name, 'RAHMAT NAZAR LTD')
    assert.ok(rahmat.address && rahmat.address.length > 10, 'RAHMAT NAZAR LTD address must not be empty')
    assert.match(rahmat.address, /SHORANDAM INDUSTRIAL AREA/i)
    assert.ok(rahmat.contact && rahmat.contact.includes('700 300 979'), 'RAHMAT NAZAR LTD contact must be present')
  })

  await t.test('RAMIN HAROON NAZAMI LTD has clean name without trailing @', () => {
    const ramin = shippers.find((s) => s.name.toUpperCase().includes('RAMIN HAROON'))
    assert.ok(ramin, 'RAMIN HAROON NAZAMI LTD must exist in seed data')
    assert.ok(!ramin.name.includes('@'), 'RAMIN HAROON NAZAMI LTD must not contain trailing @')
    assert.equal(ramin.name, 'RAMIN HAROON NAZAMI LTD')
    assert.ok(ramin.address && ramin.address.includes('HERAT'), 'RAMIN HAROON NAZAMI LTD address must be present')
  })
})

test('Party Directory & Smart Merge: Component Wiring in bol-editor.tsx', (t) => {
  const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx')
  const content = fs.readFileSync(editorPath, 'utf8')

  assert.ok(content.includes('cleanPartyName'), 'bol-editor.tsx must define cleanPartyName')
  assert.ok(content.includes('mergeSavedParties'), 'bol-editor.tsx must define mergeSavedParties')

  // Check onUpdateParty wiring on all 3 PartyDirectoryModal instances
  const updateOccurrences = (content.match(/onUpdateParty=\{\(updated\)\s*=>/g) || []).length
  assert.ok(updateOccurrences >= 3, `Expected at least 3 onUpdateParty bindings in bol-editor.tsx, found ${updateOccurrences}`)

  // Check that saveCurrentShipper, saveCurrentConsignee, saveCurrentNotifyParty protect existing addresses
  assert.ok(content.includes('existingMatch?.address'), 'Save functions must preserve existing non-empty addresses')
})

test('Party Directory & Smart Merge: PartyDirectoryModal features', (t) => {
  const modalPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'party-directory-modal.tsx')
  const content = fs.readFileSync(modalPath, 'utf8')

  assert.ok(content.includes('onUpdateParty?: (party: SavedPartyItem) => void'), 'PartyDirectoryModal must accept onUpdateParty prop')
  assert.ok(content.includes('editingParty'), 'PartyDirectoryModal must have edit party state')
  assert.ok(content.includes('NEEDS_ADDRESS') || content.includes('filterMode'), 'PartyDirectoryModal must provide address completion filter')
  assert.ok(content.includes('getInitials'), 'PartyDirectoryModal must render monogram initials')
})
