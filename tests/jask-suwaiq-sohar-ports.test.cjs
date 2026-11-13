const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load-typescript.cjs');

const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
const previewPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'a4-preview.tsx');
const routeSelectorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'route-preset-selector.tsx');
const routeServicePath = path.join(__dirname, '..', 'lib', 'services', 'route-location-service.ts');
const parserPath = path.join(__dirname, '..', 'lib', 'utils', 'transit-route-parser.ts');

const editorSrc = fs.readFileSync(editorPath, 'utf8');
const previewSrc = fs.readFileSync(previewPath, 'utf8');
const routeSelectorSrc = fs.readFileSync(routeSelectorPath, 'utf8');
const routeServiceSrc = fs.readFileSync(routeServicePath, 'utf8');
const parserSrc = fs.readFileSync(parserPath, 'utf8');

const { CARGO_ROUTE_NOTE_OPTIONS } = load('lib/types/bill-of-lading.ts');
const { parseLogisticsRoute } = load('lib/utils/transit-route-parser.ts');

test('Route Location Service: includes IRJSK (Jask), OMSWQ (Suwaiq), and OMSOH (Sohar) with screenshot labels and aliases', () => {
  assert.ok(routeServiceSrc.includes("code: 'IRJSK'"), 'IRJSK code must be in SEED_LOCATIONS');
  assert.ok(routeServiceSrc.includes("name: 'Jask Port (Bandar Jask)'"), 'Jask Port name must match');
  assert.ok(routeServiceSrc.includes("Jask Port – IRAN"), 'Jask Port aliases must include Jask Port – IRAN');
  assert.ok(routeServiceSrc.includes("جاسک – ایران"), 'Jask Port aliases must include جاسک – ایران');

  assert.ok(routeServiceSrc.includes("code: 'OMSWQ'"), 'OMSWQ code must be in SEED_LOCATIONS');
  assert.ok(routeServiceSrc.includes("Suwaiq Port – Oman"), 'OMSWQ aliases must include Suwaiq Port – Oman');
  assert.ok(routeServiceSrc.includes("بندر السویق – عمان"), 'OMSWQ nativeName/aliases must include بندر السویق – عمان');

  assert.ok(routeServiceSrc.includes("code: 'OMSOH'"), 'OMSOH code must be in SEED_LOCATIONS');
  assert.ok(routeServiceSrc.includes("Sohar Port – Oman"), 'OMSOH aliases must include Sohar Port – Oman');
  assert.ok(routeServiceSrc.includes("بندر صحار – عمان"), 'OMSOH nativeName/aliases must include بندر صحار – عمان');
});

test('Transit Route Parser: KNOWN_TRANSIT_LOCATIONS includes exact screenshot port definitions', () => {
  // Iran
  assert.ok(parserSrc.includes('جاسک – ایران'), 'Parser must include جاسک – ایران');
  assert.ok(parserSrc.includes('Jask Port – IRAN'), 'Parser must include Jask Port – IRAN');

  // Oman
  assert.ok(parserSrc.includes('بندر السویق – عمان'), 'Parser must include بندر السویق – عمان');
  assert.ok(parserSrc.includes('Suwaiq Port – Oman'), 'Parser must include Suwaiq Port – Oman');
  assert.ok(parserSrc.includes('بندر صحار – عمان'), 'Parser must include بندر صحار – عمان');
  assert.ok(parserSrc.includes('Sohar Port – Oman'), 'Parser must include Sohar Port – Oman');
});

test('A4 Preview: getRouteCountryMeta maps Jask to Iran (IR) and Suwaiq/Sohar to Oman (OM)', () => {
  assert.ok(previewSrc.includes('jask'), 'getRouteCountryMeta must detect jask');
  assert.ok(previewSrc.includes('جاسک'), 'getRouteCountryMeta must detect جاسک');
  assert.ok(previewSrc.includes('suwaiq'), 'getRouteCountryMeta must detect suwaiq');
  assert.ok(previewSrc.includes('سویق'), 'getRouteCountryMeta must detect سویق');
  assert.ok(previewSrc.includes('صحار'), 'getRouteCountryMeta must detect صحار');
});

test('BOL Editor: predefinedLocations contains explicit entries for Jask Port – IRAN, Suwaiq Port – Oman, Sohar Port – Oman', () => {
  assert.ok(editorSrc.includes('name: "Jask Port – IRAN"'), 'Must have Jask Port – IRAN');
  assert.ok(editorSrc.includes('persian: "جاسک – ایران"'), 'Must have جاسک – ایران');
  assert.ok(editorSrc.includes('name: "Suwaiq Port – Oman"'), 'Must have Suwaiq Port – Oman');
  assert.ok(editorSrc.includes('persian: "بندر السویق – عمان"'), 'Must have بندر السویق – عمان');
  assert.ok(editorSrc.includes('name: "Sohar Port – Oman"'), 'Must have Sohar Port – Oman');
  assert.ok(editorSrc.includes('persian: "بندر صحار – عمان"'), 'Must have بندر صحار – عمان');
});

test('BOL Editor: applyJaskSuwaiqSoharCorridorPreset sets up the 4-stop multi-modal corridor matching screenshot', () => {
  assert.ok(editorSrc.includes('const applyJaskSuwaiqSoharCorridorPreset = () =>'), 'Preset handler must exist');
  assert.ok(editorSrc.includes('location: "Jask Port – IRAN"'), 'Preset must include Jask Port – IRAN');
  assert.ok(editorSrc.includes('locationPersian: "جاسک – ایران"'), 'Preset must include جاسک – ایران');
  assert.ok(editorSrc.includes('location: "Suwaiq Port – Oman"'), 'Preset must include Suwaiq Port – Oman');
  assert.ok(editorSrc.includes('locationPersian: "بندر السویق – عمان"'), 'Preset must include بندر السویق – عمان');
  assert.ok(editorSrc.includes('location: "Sohar Port – Oman"'), 'Preset must include Sohar Port – Oman');
  assert.ok(editorSrc.includes('locationPersian: "بندر صحار – عمان"'), 'Preset must include بندر صحار – عمان');

  // Verify preset button triggers in both Section 05 and Note strips
  assert.ok(editorSrc.includes('onClick={applyJaskSuwaiqSoharCorridorPreset}'), 'Section 05 / Notes preset button must be hooked');
  // Verify POL button for Jask Port
  assert.ok(editorSrc.includes('port_of_loading: "Jask Port – IRAN"'), 'POL button for Jask Port must exist');
});

test('Route Preset Selector & Cargo Route Options: contain Jask, Suwaiq, and Sohar entries', () => {
  assert.ok(routeSelectorSrc.includes('از نیمروز به بندر جاسک (ایران) با موتر/لاری'), 'Route preset selector must include corridor option');
  assert.ok(routeSelectorSrc.includes('بندر السویق (عمان)'), 'Route preset selector must reference بندر السویق (عمان)');

  const corridorNotes = CARGO_ROUTE_NOTE_OPTIONS.filter(opt => opt.includes('جاسک') && opt.includes('السویق'));
  assert.ok(corridorNotes.length >= 1, 'CARGO_ROUTE_NOTE_OPTIONS must have Jask and Suwaiq corridor notes');
});
