const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Transit Route Header Badge and Removal of Red مسیر ---');

const a4PreviewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
const a4PreviewCode = fs.readFileSync(a4PreviewPath, 'utf8');

// 1. Verify Section has badge support in props and JSX
assert.ok(
  a4PreviewCode.includes('badge?: ReactNode'),
  'Section component must accept an optional badge prop'
);
assert.ok(
  a4PreviewCode.includes('{badge && (') && a4PreviewCode.includes('{badge}'),
  'Section component must render badge in the blue header bar'
);

// 2. Verify TransitRouteHeaderBadge component exists with improved bilingual title
assert.ok(
  a4PreviewCode.includes('function TransitRouteHeaderBadge'),
  'TransitRouteHeaderBadge component must be defined'
);
assert.ok(
  a4PreviewCode.includes('مسیر ترانزیت'),
  'TransitRouteHeaderBadge must contain improved Persian title "مسیر ترانزیت"'
);
assert.ok(
  a4PreviewCode.includes('Transit Route'),
  'TransitRouteHeaderBadge must contain improved English title "Transit Route"'
);
assert.ok(
  a4PreviewCode.includes('<Route className='),
  'TransitRouteHeaderBadge must render the Route icon'
);

// 3. Verify redundant red "مسیر" title is completely removed from CargoRouteNoteBanner
const bannerFunctionStart = a4PreviewCode.indexOf('function CargoRouteNoteBanner');
const bannerFunctionEnd = a4PreviewCode.indexOf('function ExporterConsigneeSection');
const bannerCode = a4PreviewCode.slice(bannerFunctionStart, bannerFunctionEnd);

assert.ok(
  !bannerCode.includes('مسیر\n      </div>') && !bannerCode.includes('مسیر\r\n      </div>'),
  'The standalone red "مسیر" title must be removed from CargoRouteNoteBanner body'
);

// 4. Verify Section badge is hooked up in Page 1
assert.ok(
  a4PreviewCode.includes('badge={hasValue(formData.cargo_route_note) ? <TransitRouteHeaderBadge isUltra={page1Ultra} /> : undefined}'),
  'Page 1 Cargo Description Section must pass TransitRouteHeaderBadge when cargo_route_note is present'
);

// 5. Verify Section badge is hooked up in Single Page
assert.ok(
  a4PreviewCode.includes('badge={hasValue(formData.cargo_route_note) ? <TransitRouteHeaderBadge isUltra={isUltraCompact} /> : undefined}'),
  'Single Page Cargo Description Section must pass TransitRouteHeaderBadge when cargo_route_note is present'
);

console.log('✓ All 5 Transit Route Header Badge test checks passed successfully!');
