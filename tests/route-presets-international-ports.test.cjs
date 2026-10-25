const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parseLogisticsRoute } = require('../lib/utils/transit-route-parser.ts');

describe('International Hub Ports Route Presets & Multi-Modal Corridors', () => {
  const userRoute = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر مرسین با کانتینر معمولی؛ سپس از بندر مرسین به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const hamriyahRoute = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر حمریه (شارجه) با کانتینر معمولی؛ سپس از بندر حمریه به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const soharRoute = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر صحار (عمان) با کانتینر معمولی؛ سپس از بندر صحار به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';
  const jebelAliRoute = '🗺️ مسیر حمل کانتینر: از دوغارون به بندر جبل علی (دبی) با کانتینر معمولی؛ سپس از بندر جبل علی به مقصد نهایی بندر نهاوا شیوا (Nhava Sheva)، هند، با کانتینر یخچالی (Reefer).';

  it('1. User exact Mersin route parses with 2 distinct legs, mixed modality, and Nhava Sheva destination', () => {
    const parsed = parseLogisticsRoute(userRoute);
    assert.equal(parsed.isStructured, true);
    assert.equal(parsed.legs.length, 2, 'Should parse 2 legs');

    // Leg 1: Dogharoun with dry container
    assert.equal(parsed.legs[0].origin.includes('دوغارون'), true);
    assert.equal(parsed.legs[0].isDry, true);
    assert.equal(parsed.legs[0].isReefer, false);
    assert.equal(parsed.legs[0].containerType, 'کانتینر معمولی');

    // Leg 2: Mersin Port with reefer container
    assert.equal(parsed.legs[1].origin.includes('مرسین'), true);
    assert.equal(parsed.legs[1].isReefer, true);
    assert.equal(parsed.legs[1].isDry, false);
    assert.equal(parsed.legs[1].containerType, 'کانتینر یخچالی');

    // Destination
    assert.ok(parsed.destinationBadge);
    assert.equal(parsed.destinationBadge.includes('نهاوا شیوا'), true);
    assert.equal(parsed.destinationBadge.includes('Nhava Sheva'), true);
  });

  it('2. Hamriyah Port (Sharjah, UAE) route parses with 2 legs and Nhava Sheva destination', () => {
    const parsed = parseLogisticsRoute(hamriyahRoute);
    assert.equal(parsed.isStructured, true);
    assert.equal(parsed.legs.length, 2);
    assert.equal(parsed.legs[0].origin.includes('دوغارون'), true);
    assert.equal(parsed.legs[0].isDry, true);
    assert.equal(parsed.legs[1].origin.includes('حمریه'), true);
    assert.equal(parsed.legs[1].isReefer, true);
    assert.equal(parsed.destinationBadge.includes('نهاوا شیوا'), true);
  });

  it('3. Oman Sohar Port route parses with 2 legs and Nhava Sheva destination', () => {
    const parsed = parseLogisticsRoute(soharRoute);
    assert.equal(parsed.isStructured, true);
    assert.equal(parsed.legs.length, 2);
    assert.equal(parsed.legs[0].origin.includes('دوغارون'), true);
    assert.equal(parsed.legs[0].isDry, true);
    assert.equal(parsed.legs[1].origin.includes('صحار'), true);
    assert.equal(parsed.legs[1].isReefer, true);
    assert.equal(parsed.destinationBadge.includes('نهاوا شیوا'), true);
  });

  it('4. Jebel Ali Port (Dubai, UAE) route parses with 2 legs and Nhava Sheva destination', () => {
    const parsed = parseLogisticsRoute(jebelAliRoute);
    assert.equal(parsed.isStructured, true);
    assert.equal(parsed.legs.length, 2);
    assert.equal(parsed.legs[0].origin.includes('دوغارون'), true);
    assert.equal(parsed.legs[0].isDry, true);
    assert.equal(parsed.legs[1].origin.includes('جبل علی'), true);
    assert.equal(parsed.legs[1].isReefer, true);
    assert.equal(parsed.destinationBadge.includes('نهاوا شیوا'), true);
  });

  it('5. Switch B/L directives for all 4 ports extract balanced location labels', () => {
    const mersinSwitch = 'از دوغارون کانتینر یخچالی از بندر مرسین کانتینر یخچالی با سوییچ بی ال در بندر مرسین ترکیه (Full Way Reefer)';
    const hamriyahSwitch = 'از دوغارون با کانتینر معمولی، با سوییچ B/L در بندر حمریه (شارجه)، مقصد نهایی: نهاوا شیوا';
    const soharSwitch = 'از دوغارون کانتینر یخچالی (با سوییچ بی ال در بندر صحار (عمان))';

    const pMersin = parseLogisticsRoute(mersinSwitch);
    assert.ok(pMersin.switchBlBadge);
    assert.equal(pMersin.switchBlBadge.includes('مرسین'), true);

    const pHamriyah = parseLogisticsRoute(hamriyahSwitch);
    assert.ok(pHamriyah.switchBlBadge);
    assert.equal(pHamriyah.switchBlBadge.includes('حمریه'), true);
    assert.equal(pHamriyah.switchBlBadge.includes('شارجه'), true);

    const pSohar = parseLogisticsRoute(soharSwitch);
    assert.ok(pSohar.switchBlBadge);
    assert.equal(pSohar.switchBlBadge.includes('صحار'), true);
    assert.equal(pSohar.switchBlBadge.includes('عمان'), true);
  });

  it('6. RoutePresetSelector source code contains international-ports group and quick buttons', () => {
    const componentCode = fs.readFileSync(
      path.join(__dirname, '..', 'components', 'bill-of-lading', 'route-preset-selector.tsx'),
      'utf8'
    );

    // Group exists
    assert.equal(componentCode.includes('id: "international-ports"'), true);
    assert.equal(componentCode.includes('بنادر ترانزیت بین‌المللی'), true);
    assert.equal(componentCode.includes('مرسین ترکیه، حمریه شارجه، صحار عمان، جبل علی دبی'), true);

    // User exact route is included in preset definitions
    assert.equal(componentCode.includes(userRoute), true);
    assert.equal(componentCode.includes(hamriyahRoute), true);
    assert.equal(componentCode.includes(soharRoute), true);

    // Quick Action Bar 1-click corridor buttons exist
    assert.equal(componentCode.includes('دوغارون ➔ مرسین ➔ نهاوا شیوا'), true);
    assert.equal(componentCode.includes('دوغارون ➔ حمریه (شارجه) ➔ نهاوا شیوا'), true);
    assert.equal(componentCode.includes('دوغارون ➔ صحار عمان ➔ نهاوا شیوا'), true);
    assert.equal(componentCode.includes('مرسین تمام یخچالی'), true);
    assert.equal(componentCode.includes('حمریه شارجه (سوییچ B/L)'), true);
    assert.equal(componentCode.includes('صحار عمان (سوییچ B/L)'), true);

    // Smart modifier buttons exist
    assert.equal(componentCode.includes('سوییچ B/L مرسین'), true);
    assert.equal(componentCode.includes('سوییچ B/L حمریه'), true);
    assert.equal(componentCode.includes('سوییچ B/L صحار عمان'), true);
    assert.equal(componentCode.includes('مقصد: موندرا (Mundra)'), true);
    assert.equal(componentCode.includes('مقصد: مرسین (Mersin)'), true);
    assert.equal(componentCode.includes('مقصد: صحار (Sohar)'), true);
  });
});
