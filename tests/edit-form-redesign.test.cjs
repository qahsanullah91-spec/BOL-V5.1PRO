const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Edit Form Redesign - Quad Dashboard (Freight, Remarks, Container & Shipping)', async (t) => {
  const editorPath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'bol-editor.tsx');
  const appCssPath = path.join(__dirname, '..', 'app', 'globals.css');
  const stylesCssPath = path.join(__dirname, '..', 'styles', 'globals.css');

  assert.ok(fs.existsSync(editorPath), 'bol-editor.tsx must exist');
  assert.ok(fs.existsSync(appCssPath), 'app/globals.css must exist');
  assert.ok(fs.existsSync(stylesCssPath), 'styles/globals.css must exist');

  const editorCode = fs.readFileSync(editorPath, 'utf8');
  const appCss = fs.readFileSync(appCssPath, 'utf8');
  const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');

  await t.test('1. CSS Grid definitions: 4-column layout at >= 1600px with minmax(0, ...)', () => {
    // Both CSS files must define .edit-form-dashboard
    for (const [name, css] of [['app/globals.css', appCss], ['styles/globals.css', stylesCss]]) {
      assert.match(css, /\.edit-form-dashboard\s*\{/, `${name} must define .edit-form-dashboard`);
      assert.match(css, /minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)\s*minmax\(0,\s*0\.9fr\)\s*minmax\(0,\s*2\.1fr\)/,
        `${name} must have 1fr:1fr:0.9fr:2.1fr columns (20%, 20%, 18%, 42%) at 1600px`);
      assert.match(css, /@media\s*\(\s*min-width:\s*1600px\s*\)/, `${name} must have @media (min-width: 1600px)`);
      assert.match(css, /\.shipping-fields-grid\s*\{/, `${name} must define .shipping-fields-grid`);
    }
  });

  await t.test('2. Responsive rules: 2-column on 768px-1599px, 1-column below 768px', () => {
    for (const [name, css] of [['app/globals.css', appCss], ['styles/globals.css', stylesCss]]) {
      assert.match(css, /@media\s*\(\s*min-width:\s*768px\s*\)\s*and\s*\(\s*max-width:\s*1599px\s*\)\s*\{\s*\.edit-form-dashboard\s*\{\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
        `${name} must specify 2-column grid between 768px and 1599px`);
      assert.match(css, /\.edit-form-dashboard\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
        `${name} must default to 1-column below 768px`);
    }
  });

  await t.test('3. Parent container #section-logistics-quad encloses all 4 sections in order', () => {
    const quadIdx = editorCode.indexOf('id="section-logistics-quad"');
    const freightIdx = editorCode.indexOf('id="section-freight"');
    const remarksIdx = editorCode.indexOf('id="section-remarks"');
    const containerIdx = editorCode.indexOf('id="section-container"');
    const shippingIdx = editorCode.indexOf('id="section-shipping"');

    assert.ok(quadIdx !== -1, 'Parent quad container must exist');
    assert.ok(freightIdx !== -1, 'section-freight must exist');
    assert.ok(remarksIdx !== -1, 'section-remarks must exist');
    assert.ok(containerIdx !== -1, 'section-container must exist');
    assert.ok(shippingIdx !== -1, 'section-shipping must exist');

    assert.ok(quadIdx < freightIdx, 'Quad container must wrap freight section');
    assert.ok(freightIdx < remarksIdx, 'Freight section must come before remarks');
    assert.ok(remarksIdx < containerIdx, 'Remarks section must come before container details');
    assert.ok(containerIdx < shippingIdx, 'Container details must come before shipping details');
  });

  await t.test('4. Section Jump Strip updated with new ordering and labels', () => {
    assert.match(editorCode, /\{\s*id:\s*"section-freight",\s*label:\s*"07 Freight",\s*icon:\s*Receipt\s*\}/);
    assert.match(editorCode, /\{\s*id:\s*"section-remarks",\s*label:\s*"08 Remarks",\s*icon:\s*FileText\s*\}/);
    assert.match(editorCode, /\{\s*id:\s*"section-container",\s*label:\s*"09 Container",\s*icon:\s*Box\s*\}/);
    assert.match(editorCode, /\{\s*id:\s*"section-shipping",\s*label:\s*"10 Shipping",\s*icon:\s*Ship\s*\}/);
  });

  await t.test('5. Freight Information: preserves fields, vertical stacking, and bilingual labels', () => {
    const freightSub = editorCode.substring(
      editorCode.indexOf('id="section-freight"'),
      editorCode.indexOf('id="section-remarks"')
    );

    assert.match(freightSub, /Freight Information/, 'Must have Freight Information header');
    assert.match(freightSub, /اطلاعات حمل/, 'Must have Persian subtitle');
    assert.match(freightSub, /name="freight_payable_at"/, 'Must bind freight_payable_at');
    assert.match(freightSub, /value=\{formData\.freight_payable_at\}/, 'Must connect to formData');
    assert.match(freightSub, /محل پرداخت کرایه/, 'Must have Persian label for payable at');
    assert.match(freightSub, /name="freight_terms"/, 'Must bind freight_terms');
    assert.match(freightSub, /value=\{formData\.freight_terms\}/, 'Must connect to formData');
    assert.match(freightSub, /شرایط حمل/, 'Must have Persian label for terms');
    assert.match(freightSub, /flex-col/, 'Must be vertically stacked inside compact card');
  });

  await t.test('6. Remarks: multiline editable textarea filling width and height', () => {
    const remarksSub = editorCode.substring(
      editorCode.indexOf('id="section-remarks"'),
      editorCode.indexOf('id="section-container"')
    );

    assert.match(remarksSub, /Remarks/, 'Must have Remarks header');
    assert.match(remarksSub, /توضیحات/, 'Must have Persian subtitle');
    assert.match(remarksSub, /name="remarks"/, 'Must bind remarks field');
    assert.match(remarksSub, /value=\{formData\.remarks\}/, 'Must connect to formData');
    assert.match(remarksSub, /<Textarea\b/, 'Must use Textarea component');
    assert.match(remarksSub, /w-full\s+flex-1/, 'Textarea must fill available width and height');
    assert.match(remarksSub, /Additional Notes/, 'Must have Additional Notes label');
    assert.match(remarksSub, /یادداشت‌های اضافی/, 'Must have Persian label');
  });

  await t.test('7. Container Details: vertical narrow column with all dropdown options & inputs', () => {
    const containerSub = editorCode.substring(
      editorCode.indexOf('id="section-container"'),
      editorCode.indexOf('id="section-shipping"')
    );

    assert.match(containerSub, /Container Details/, 'Must have Container Details header');
    assert.match(containerSub, /جزئیات کانتینر/, 'Must have Persian subtitle');
    assert.match(containerSub, /container_type/, 'Must bind container_type');
    assert.match(containerSub, /dry/, 'Must have dry option');
    assert.match(containerSub, /reefer/, 'Must have reefer option');
    assert.match(containerSub, /open_top/, 'Must have open_top option');
    assert.match(containerSub, /flat_rack/, 'Must have flat_rack option');
    assert.match(containerSub, /tank/, 'Must have tank option');

    assert.match(containerSub, /container_size/, 'Must bind container_size');
    assert.match(containerSub, /20ft/, 'Must have 20ft option');
    assert.match(containerSub, /40ft/, 'Must have 40ft option');
    assert.match(containerSub, /40ft_hc/, 'Must have 40ft High Cube option');
    assert.match(containerSub, /45ft_hc/, 'Must have 45ft High Cube option');

    assert.match(containerSub, /name="container_numbers"/, 'Must bind container_numbers');
    assert.match(containerSub, /name="seal_numbers"/, 'Must bind seal_numbers');
  });

  await t.test('8. Shipping Details: widest column with presets, 2-col inputs & full-width delivery', () => {
    const shippingSub = editorCode.substring(
      editorCode.indexOf('id="section-shipping"'),
      editorCode.indexOf('id="section-afghan"')
    );

    assert.match(shippingSub, /Shipping Details/, 'Must have Shipping Details header');
    assert.match(shippingSub, /جزئیات حمل/, 'Must have Persian subtitle');
    assert.match(shippingSub, /Quick Port & Location Presets/, 'Must have Quick Port presets panel');

    // Check all 20 port preset buttons
    const presets = [
      'Abidjan Port & Ivory Coast',
      'Jebel Ali Port (Dubai)',
      'Port Rashid (Dubai)',
      'Al Hamriya Port (Dubai)',
      'Dubai Creek (Deira)',
      'Fujairah Port',
      'Khalifa Port (Abu Dhabi)',
      'Bandar Abbas',
      'Chabahar',
      'Jebel Ali / Dubai',
      'Nhava Sheva (Mumbai)',
      'Mundra Port',
      'Karachi Port',
      'Rotterdam',
      'Hamburg',
      'Shanghai',
      'Singapore',
      'Lagos (Apapa)',
      'Durban',
      'Mombasa',
    ];
    for (const preset of presets) {
      assert.ok(shippingSub.includes(preset), `Must contain preset: ${preset}`);
    }

    // Check shipping inputs
    assert.match(shippingSub, /name="vessel_name"/, 'Must bind vessel_name');
    assert.match(shippingSub, /name="voyage_number"/, 'Must bind voyage_number');
    assert.match(shippingSub, /name="port_of_loading"/, 'Must bind port_of_loading');
    assert.match(shippingSub, /name="port_of_discharge"/, 'Must bind port_of_discharge');
    assert.match(shippingSub, /name="place_of_delivery"/, 'Must bind place_of_delivery');

    // Check Place of Delivery has full-width class
    assert.match(shippingSub, /full-width/, 'Place of Delivery container must use full-width');

    // Check datalists
    assert.match(shippingSub, /id="world-seaports-list"/, 'Must contain world-seaports-list');
    assert.match(shippingSub, /id="world-places-list"/, 'Must contain world-places-list');
  });

  await t.test('9. Visual design & tokens: pale blue/white backgrounds, rounded cards, colored icons', () => {
    assert.match(editorCode, /bg-linear-to-br from-emerald-500 to-teal-600/, 'Freight icon badge');
    assert.match(editorCode, /bg-linear-to-br from-amber-500 to-orange-600/, 'Remarks icon badge');
    assert.match(editorCode, /bg-linear-to-br from-blue-500 to-indigo-600/, 'Container icon badge');
    assert.match(editorCode, /bg-linear-to-br from-cyan-500 to-blue-600/, 'Shipping icon badge');
    assert.match(editorCode, /font-\[vazirmatn\]/, 'Persian fonts');
    assert.match(editorCode, /dir="rtl"/, 'RTL directionality');
  });
});
