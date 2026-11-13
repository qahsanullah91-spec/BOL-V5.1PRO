const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load-typescript.cjs');

const { parseLogisticsRoute, cleanRouteText } = load('lib/utils/transit-route-parser.ts');
const { CARGO_ROUTE_NOTE_OPTIONS } = load('lib/types/bill-of-lading.ts');

test('Transit Route Presets: CARGO_ROUTE_NOTE_OPTIONS includes international port routes', () => {
  assert.ok(Array.isArray(CARGO_ROUTE_NOTE_OPTIONS));
  assert.ok(CARGO_ROUTE_NOTE_OPTIONS.length >= 50);

  const mersinRoutes = CARGO_ROUTE_NOTE_OPTIONS.filter(r => r.includes('مرسین'));
  assert.ok(mersinRoutes.length >= 3, 'Should have multiple Mersin port routes');

  const hamriyaRoutes = CARGO_ROUTE_NOTE_OPTIONS.filter(r => r.includes('حمریه'));
  assert.ok(hamriyaRoutes.length >= 3, 'Should have multiple Hamriya port routes');

  const soharRoutes = CARGO_ROUTE_NOTE_OPTIONS.filter(r => r.includes('صحار'));
  assert.ok(soharRoutes.length >= 3, 'Should have multiple Sohar Oman port routes');

  const jebelAliRoutes = CARGO_ROUTE_NOTE_OPTIONS.filter(r => r.includes('جبل علی'));
  assert.ok(jebelAliRoutes.length >= 3, 'Should have multiple Jebel Ali port routes');
});

test('Transit Route Parser: Parses user Mersin -> Nhava Sheva Reefer route', () => {
  const input = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر مرسین با کانتینر معمولی؛ سپس از بندر مرسین به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const parsed = parseLogisticsRoute(input);

  assert.equal(parsed.isStructured, true);
  assert.ok(parsed.legs.length >= 2, 'Should have at least 2 legs');
  assert.equal(parsed.legs[0].origin, 'از دوغارون');
  assert.equal(parsed.legs[0].isDry, true);

  assert.equal(parsed.legs[1].origin, 'از بندر مرسین');
  assert.equal(parsed.legs[1].isReefer, true);

  assert.ok(parsed.destinationBadge && parsed.destinationBadge.includes('نهاوا شیوا'));
});

test('Transit Route Parser: Parses Hamriya Port multi-modal route', () => {
  const input = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر حمریه (شارجه) با کانتینر معمولی؛ سپس از بندر حمریه به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const parsed = parseLogisticsRoute(input);

  assert.equal(parsed.isStructured, true);
  assert.ok(parsed.legs.length >= 2);
  assert.equal(parsed.legs[0].origin, 'از دوغارون');
  assert.equal(parsed.legs[1].origin, 'از بندر حمریه');
  assert.equal(parsed.legs[1].isReefer, true);
  assert.ok(parsed.destinationBadge && parsed.destinationBadge.includes('نهاوا شیوا'));
});

test('Transit Route Parser: Parses Oman Sohar Port multi-modal route', () => {
  const input = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر صحار (عمان) با کانتینر معمولی؛ سپس از بندر صحار به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const parsed = parseLogisticsRoute(input);

  assert.equal(parsed.isStructured, true);
  assert.ok(parsed.legs.length >= 2);
  assert.equal(parsed.legs[0].origin, 'از دوغارون');
  assert.equal(parsed.legs[1].origin, 'از بندر صحار');
  assert.equal(parsed.legs[1].isReefer, true);
  assert.ok(parsed.destinationBadge && parsed.destinationBadge.includes('نهاوا شیوا'));
});

test('Route Preset Selector UI Source: Includes international ports group and quick modifier chips', () => {
  const filePath = path.join(__dirname, '..', 'components', 'bill-of-lading', 'route-preset-selector.tsx');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Verify group
  assert.ok(content.includes('id: "international-ports"'));
  assert.ok(content.includes('بنادر ترانزیت بین‌المللی'));
  assert.ok(content.includes('بندر مرسین'));
  assert.ok(content.includes('بندر حمریه'));
  assert.ok(content.includes('بندر صحار'));
  assert.ok(content.includes('بندر جبل علی'));

  // Verify quick modifier buttons
  assert.ok(content.includes('سوییچ B/L مرسین'));
  assert.ok(content.includes('سوییچ B/L حمریه'));
  assert.ok(content.includes('سوییچ B/L صحار عمان'));
  assert.ok(content.includes('سوییچ B/L جبل علی'));
});
