const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
const routeServicePath = path.join(__dirname, '..', 'lib', 'services', 'route-location-service.ts');
const parserPath = path.join(__dirname, '..', 'lib', 'utils', 'transit-route-parser.ts');

const editorSrc = fs.readFileSync(editorPath, 'utf8');
const routeServiceSrc = fs.readFileSync(routeServicePath, 'utf8');
const parserSrc = fs.readFileSync(parserPath, 'utf8');

test('All Oman ports are present in predefinedLocations with bilingual names and port flags', () => {
  const requiredOmanPorts = [
    'Sohar Port & Freezone, OM',
    'Port of Salalah, OM',
    'Port Sultan Qaboos (Muscat / Muttrah), OM',
    'Port of Duqm (SEZAD), OM',
    'Port of Suwaiq (Al Suwaiq), OM',
    'Port of Khasab (Musandam), OM',
    'Port of Shinas, OM',
    'Port of Sur, OM',
    'Qalhat LNG Marine Terminal (Sur), OM',
    'Mina Al Fahal Port (Muscat), OM',
    'Masirah Port, OM',
    'Shannah Ferry & Cargo Port, OM',
    'Khazaen Dry Port (Barka / Muscat ICD), OM',
    'Port of Dibba (Musandam), OM',
    'Lima Port (Musandam), OM',
    'Al Ashkharah Port, OM',
    'Raysut Port Terminal (Salalah), OM',
    'Hasik Port (Dhofar), OM',
    'Mirbat Port (Dhofar), OM',
  ];

  for (const portName of requiredOmanPorts) {
    assert.ok(editorSrc.includes(portName), `Missing Oman port in bol-editor.tsx: ${portName}`);
  }

  assert.ok(editorSrc.includes('Suwaiq Port - Oman'), 'Port of Suwaiq must include alias "Suwaiq Port - Oman"');
  assert.ok(editorSrc.includes('بندر السويق، عمان'), 'Port of Suwaiq must include Persian/Arabic label');
});

test('All Iran seaports (Persian Gulf, Sea of Oman & Caspian Sea) are present in predefinedLocations', () => {
  const requiredIranPorts = [
    'Bandar Abbas (Shahid Rajaee Port), IR',
    'Bandar Abbas (Shahid Bahonar Port), IR',
    'Chabahar Port (Shahid Beheshti), IR',
    'Chabahar (Shahid Kalantari Port), IR',
    'Bandar Imam Khomeini (BIK), IR',
    'Bushehr Port, IR',
    'Khorramshahr Port, IR',
    'Abadan Port, IR',
    'Bandar Lengeh Port, IR',
    'Qeshm Island Port (Bahman / Kaveh), IR',
    'Kish Island Port, IR',
    'Bandar Jask Port, IR',
    'Bandar Mahshahr Port (Imam Khomeini Petrochemical), IR',
    'Assaluyeh Port (Pars Special Energy Zone), IR',
    'Bandar Kangan Port, IR',
    'Bandar Genaveh Port, IR',
    'Bandar Deylam Port, IR',
    'Bandar Dayyer Port, IR',
    'Bandar Charak Port, IR',
    'Bandar Khamir / Pohl Port, IR',
    'Bandar Kong Port, IR',
    'Bandar Tiab Port, IR',
    'Bandar Sirik Port, IR',
    'Konarak Port, IR',
    'Beris / Pasabandar Port, IR',
    'Parsian Commercial Port, IR',
    'Kharg Island Oil & Cargo Terminal, IR',
    'Lavan Island Port, IR',
    'Sirri Island Port, IR',
    'Hormuz Island Port, IR',
    'Hendijan Port (Sajafi), IR',
    'Arvandkenar Port, IR',
    'Bandar Anzali Port, IR',
    'Caspian Port (Anzali Free Zone), IR',
    'Nowshahr Port, IR',
    'Amirabad Port (Behshahr SEZ), IR',
    'Fereydunkenar Port, IR',
    'Astara Port (Gilan), IR',
    'Bandar Torkaman Port, IR',
    'Bandar Gaz Port, IR',
    'Khaje Nafas Port, IR',
  ];

  for (const portName of requiredIranPorts) {
    assert.ok(editorSrc.includes(portName), `Missing Iran port in bol-editor.tsx: ${portName}`);
  }

  assert.ok(editorSrc.includes('Jask Port - Iran'), 'Jask Port must be present as "Jask Port - Iran"');
  assert.ok(editorSrc.includes('جاسک - ایران'), 'Jask Port must include Persian label "جاسک - ایران"');
  assert.ok(editorSrc.includes('Set POL: Jask Port (Iran)'), 'Jask Port must have quick POL button');
});

test('BOL Editor exposes dedicated Oman and Iran filter tabs and fixes pre-filled input filter behavior', () => {
  assert.ok(editorSrc.includes('{ label: "🇴🇲 Oman", value: "Oman" }'), 'Inline popover must have Oman tab');
  assert.ok(editorSrc.includes('{ label: "🇴🇲 OMAN PORTS", country: "Oman" }'), 'Directory bar must have OMAN PORTS tab');
  assert.ok(editorSrc.includes('{ label: "🇮🇷 IRAN PORTS", country: "Iran" }'), 'Directory bar must have IRAN PORTS tab');
  assert.ok(editorSrc.includes('const [filterByRouteInput, setFilterByRouteInput] = useState(false)'), 'Must track filterByRouteInput');
  assert.ok(editorSrc.includes('(routeLocationSearch || (filterByRouteInput ? activeInputLocation : "")).trim().toLowerCase()'), 'Must not let stale pre-filled input block browsing ports on focus');
});

test('Route Location Service SEED_LOCATIONS and Transit Route Parser cover Oman and Iran ports', () => {
  for (const code of ['OMSOH', 'OMSLL', 'OMMCT', 'OMDQM', 'OMSWQ', 'OMKHS', 'OMSHN', 'IRJSK', 'IRZBR', 'IRBKM', 'IRBUZ', 'IRKHO', 'IRBAZ', 'IRAMR']) {
    assert.ok(routeServiceSrc.includes(`unlocode: '${code}'`), `SEED_LOCATIONS missing UN/LOCODE ${code}`);
  }

  for (const persianPort of ['بندر السويق', 'بندر دقم', 'بندر صلاله', 'بندر مسقط', 'بندر بوشهر', 'بندر خرمشهر', 'بندر انزلی', 'بندر امیرآباد', 'بندر جاسک', 'جاسک - ایران']) {
    assert.ok(parserSrc.includes(persianPort), `KNOWN_TRANSIT_LOCATIONS missing Persian port: ${persianPort}`);
  }
});
