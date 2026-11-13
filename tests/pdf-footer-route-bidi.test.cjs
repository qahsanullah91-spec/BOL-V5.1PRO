const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

test('PDF Footer Text Collision and Iran Office Deduplication', () => {
  const a4Path = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
  const a4Code = fs.readFileSync(a4Path, 'utf8');

  // 1. Verify companyTitle in ExecutiveBOLFooter has whitespace-nowrap and shrink-0 to prevent wrapping
  assert.ok(
    a4Code.includes('{companyTitle}\r\n          </span>') || a4Code.includes('{companyTitle}\n          </span>'),
    'companyTitle should be rendered in ExecutiveBOLFooter'
  );
  assert.ok(
    a4Code.includes('whitespace-nowrap shrink-0') && a4Code.includes('{companyTitle}'),
    'ExecutiveBOLFooter must apply whitespace-nowrap shrink-0 to companyTitle to prevent wrapping across tiers'
  );

  // 2. Verify Tier 1 has overflow-hidden
  assert.ok(
    a4Code.includes('border-b border-blue-100 bg-white/70 overflow-hidden'),
    'Tier 1 must have overflow-hidden so company title cannot collide with Tier 2'
  );

  // 3. Verify HEAD OFFICE: has whitespace-nowrap shrink-0
  assert.ok(
    a4Code.includes('HEAD OFFICE:</span>'),
    'HEAD OFFICE label must exist'
  );
  assert.ok(
    a4Code.includes('text-blue-800 uppercase font-mono font-black tracking-wider whitespace-nowrap'),
    'HEAD OFFICE label must have whitespace-nowrap'
  );

  // 4. Verify cleanIranOffice deduplication logic
  assert.ok(
    a4Code.includes('cleanIranOffice = iranOffice'),
    'ExecutiveBOLFooter must define cleanIranOffice to sanitize prefix'
  );
  assert.ok(
    a4Code.includes('IRAN TRANSIT OFFICE: {cleanIranOffice}'),
    'ExecutiveBOLFooter must render cleanIranOffice to prevent duplicate IRAN TRANSIT OFFICE: IRAN OFFICE:'
  );
});

test('Logistics Route Directive Bidi Normalization and Parentheses Isolation', () => {
  const { cleanRouteText } = require('../lib/utils/transit-route-parser.ts');

  // 1. Word healing: split یخچا...لی with English term
  const input1 = 'از دوغارون كانتينر یخچالی از بندر مرسین کانتینر یخچا)Full Way Reefer(لی، و مقصد نهایی: موندر)Mundra(، هند.';
  const output1 = cleanRouteText(input1);
  assert.strictEqual(
    output1,
    'از دوغارون كانتينر یخچالی از بندر مرسین کانتینر یخچالی (Full Way Reefer)، و مقصد نهایی: موندرا (Mundra)، هند.'
  );

  // 2. Already normal text stays normal with clean spacing
  const input2 = 'از دوغارون کانتینر یخچالی از بندر مرسین کانتینر یخچالی (Full Way Reefer)، و مقصد نهایی: موندرا (Mundra)، هند.';
  const output2 = cleanRouteText(input2);
  assert.strictEqual(output2, input2);

  // 3. Parentheses spacing repair
  const input3 = 'از دوغارون کانتینر یخچالی(Full Way Reefer)از بندر مرسین';
  const output3 = cleanRouteText(input3);
  assert.strictEqual(output3, 'از دوغارون کانتینر یخچالی (Full Way Reefer) از بندر مرسین');

  // 4. Inverted parentheses repair
  const input4 = 'مقصد نهایی: نهاوا شیوا)Nhava Sheva(، هند';
  const output4 = cleanRouteText(input4);
  assert.strictEqual(output4, 'مقصد نهایی: نهاوا شیوا (Nhava Sheva)، هند');

  // 4b. Parentheses internal whitespace and floating punctuation cleanup
  const input4b = 'از دوغارون به بندر مرسین با کانتینر معمولی؛ سپس از بندر مرسین به مقصد نهایی بندر نهاوا شیوا ( Nhava Sheva ) ، هند ، با کانتینر یخچالی ( Reefer ) .';
  const output4b = cleanRouteText(input4b);
  assert.strictEqual(
    output4b,
    'از دوغارون به بندر مرسین با کانتینر معمولی؛ سپس از بندر مرسین به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).'
  );

  // 5. Verify CargoRouteNoteBanner uses <bdi dir="ltr"> and cleanRouteText
  const a4Path = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
  const a4Code = fs.readFileSync(a4Path, 'utf8');

  assert.ok(
    a4Code.includes('const normalizedRoute = cleanRouteText(cargoRouteNote)'),
    'CargoRouteNoteBanner must normalize route note using cleanRouteText'
  );
  assert.ok(
    a4Code.includes('<bdi') && a4Code.includes('dir="ltr"') && a4Code.includes('unicodeBidi: "isolate"'),
    'CargoRouteNoteBanner must isolate Latin/English parentheticals using <bdi dir="ltr">'
  );
});
