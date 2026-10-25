const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing A4 Preview Route Timeline Cards Improvements ---');

const a4PreviewPath = path.join(__dirname, '../components/bill-of-lading/a4-preview.tsx');
assert.ok(fs.existsSync(a4PreviewPath), 'a4-preview.tsx must exist');
const a4PreviewContent = fs.readFileSync(a4PreviewPath, 'utf8');

// 1. Verify getRouteCountryMeta does NOT produce duplicate emojis or duplicate labels in RouteTimeline
assert.ok(
  a4PreviewContent.includes('const countryDisplay = countryMeta.label ? countryMeta.label.toUpperCase() : countryMeta.code'),
  'RouteTimeline must compute a single clean countryDisplay without repeating emoji or codes'
);

// Verify no emoji flag is rendered inside the capsule badge in RouteTimeline
const routeTimelineStart = a4PreviewContent.indexOf('function RouteTimeline(');
const routeTimelineEnd = a4PreviewContent.indexOf('function parseDriverContactPhones(');
assert.ok(routeTimelineStart !== -1 && routeTimelineEnd !== -1, 'Must locate RouteTimeline function');
const routeTimelineCode = a4PreviewContent.slice(routeTimelineStart, routeTimelineEnd);

assert.ok(
  !routeTimelineCode.includes('{countryMeta.emoji &&'),
  'RouteTimeline header capsule badge must not render countryMeta.emoji which duplicates text on Windows'
);

// 2. Verify increased font size for English City Name (at least 8.0pt for ultra)
assert.ok(
  routeTimelineCode.includes('isUltra ? "text-[8.0pt]" : isCompact ? "text-[8.6pt]" : "text-[9.4pt]"'),
  'English City Name must have enlarged typography (8.0pt / 8.6pt / 9.4pt)'
);

// 3. Verify increased font size for Persian City Name (at least 7.0pt for ultra)
assert.ok(
  routeTimelineCode.includes('isUltra ? "text-[7.0pt]" : isCompact ? "text-[7.6pt]" : "text-[8.4pt]"'),
  'Persian City Name must have enlarged typography (7.0pt / 7.6pt / 8.4pt)'
);

// 4. Verify increased font size for Transport Mode Pill (at least 5.4pt for ultra)
assert.ok(
  routeTimelineCode.includes('isUltra ? "px-2 py-0.4 text-[5.4pt]" : isCompact ? "px-2.5 py-0.5 text-[6.0pt]" : "px-3 py-0.6 text-[6.6pt]"'),
  'Transport mode pill must have enlarged typography (5.4pt / 6.0pt / 6.6pt)'
);

// 5. Verify enlarged Card minHeight (46px instead of 20px)
assert.ok(
  routeTimelineCode.includes('minHeight: isUltra ? "46px" : isCompact ? "50px" : "56px"'),
  'Route cards must have increased minHeight (46px / 50px / 56px)'
);

// 6. Verify enlarged Connecting Arrow Circle
assert.ok(
  routeTimelineCode.includes('w-4.5 h-4.5 sm:w-5 sm:h-5'),
  'Connecting arrow circle must be enlarged to w-4.5 h-4.5 / w-5 h-5'
);

// 7. Verify enhanced location formatter parsing
assert.ok(
  a4PreviewContent.includes('subFacility: subFacility !== primaryName ? subFacility : ""'),
  'formatRouteStopLocation must safely avoid duplicate subFacility'
);

console.log('✓ All 7 A4 Route Timeline Cards tests passed successfully!');
