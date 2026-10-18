const fs = require('node:fs');
const path = require('node:path');

const { generateRouteGeometry } = require('./watermarks/route-geometry.cjs');
const { generateCompassLines } = require('./watermarks/compass-lines.cjs');
const { generateContourMap } = require('./watermarks/contour-map.cjs');
const { generateTradeNetwork } = require('./watermarks/trade-network.cjs');
const { generateMeridianGrid } = require('./watermarks/meridian-grid.cjs');
const { generateSoftArches } = require('./watermarks/soft-arches.cjs');
const { generatePearlWaves } = require('./watermarks/pearl-waves.cjs');
const { generateNorthernStar } = require('./watermarks/northern-star.cjs');
const { generateEveningArrival } = require('./watermarks/evening-arrival.cjs');

const targetDir = path.join(__dirname, '../public/images/document-backgrounds');

const watermarks = [
  { file: 'route-geometry.svg', generate: generateRouteGeometry, title: 'Route Geometry' },
  { file: 'compass-lines.svg', generate: generateCompassLines, title: 'Compass Lines' },
  { file: 'contour-map.svg', generate: generateContourMap, title: 'Contour Map' },
  { file: 'trade-network.svg', generate: generateTradeNetwork, title: 'Trade Network' },
  { file: 'meridian-grid.svg', generate: generateMeridianGrid, title: 'Meridian Grid' },
  { file: 'soft-arches.svg', generate: generateSoftArches, title: 'Soft Arches' },
  { file: 'pearl-waves.svg', generate: generatePearlWaves, title: 'Pearl Waves' },
  { file: 'northern-star.svg', generate: generateNorthernStar, title: 'Northern Star' },
  { file: 'evening-arrival.svg', generate: generateEveningArrival, title: 'Evening Arrival' },
];

console.log(`Starting security watermark generation for ${watermarks.length} files...`);

watermarks.forEach(({ file, generate, title }) => {
  const destPath = path.join(targetDir, file);
  const svgContent = generate();
  fs.writeFileSync(destPath, svgContent, 'utf8');
  const stats = fs.statSync(destPath);
  console.log(`✓ Generated ${file} (${title}) — ${(stats.size / 1024).toFixed(2)} KB`);
});

console.log('All 9 security watermarks successfully generated and written!');
