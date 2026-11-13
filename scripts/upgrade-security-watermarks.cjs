const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { generateRouteGeometry } = require('./watermarks/route-geometry.cjs');
const { generateSoftArches } = require('./watermarks/soft-arches.cjs');
const { generatePearlWaves } = require('./watermarks/pearl-waves.cjs');
const { generateNorthernStar } = require('./watermarks/northern-star.cjs');

const targetDir = path.join(__dirname, '../public/images/document-backgrounds');

const geometricWatermarks = [
  { file: 'route-geometry.svg', generate: generateRouteGeometry, title: 'Route Geometry' },
  { file: 'soft-arches.svg', generate: generateSoftArches, title: 'Soft Arches' },
  { file: 'pearl-waves.svg', generate: generatePearlWaves, title: 'Pearl Waves' },
  { file: 'northern-star.svg', generate: generateNorthernStar, title: 'Northern Star' },
];

console.log(`Starting security watermark generation for geometric files...`);

geometricWatermarks.forEach(({ file, generate, title }) => {
  const destPath = path.join(targetDir, file);
  const svgContent = generate();
  fs.writeFileSync(destPath, svgContent, 'utf8');
  const stats = fs.statSync(destPath);
  console.log(`✓ Generated ${file} (${title}) — ${(stats.size / 1024).toFixed(2)} KB`);
});

// Run the photographic security watermarks generator for the 12 master watermarks
console.log('Synchronizing high-definition photographic security watermarks...');
execFileSync(process.execPath, [path.join(__dirname, 'generate-photographic-security-watermarks.cjs')], { stdio: 'inherit' });

console.log('All security watermarks successfully updated and synchronized!');
