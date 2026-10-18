/**
 * Master Runner: Generates and synchronizes all 40 high-resolution security vector watermarks
 * and all high-resolution photographic watermarks across all deployment targets.
 */
const fs = require('node:fs');
const path = require('node:path');

const { getMountainBackgrounds } = require('./generators/mountains.cjs');
const { getOverlandBackgrounds } = require('./generators/overland.cjs');
const { getMaritimeBackgrounds } = require('./generators/maritime.cjs');
const { getAviationBackgrounds } = require('./generators/aviation.cjs');
const { getGeometricBackgrounds } = require('./generators/geometric.cjs');

const rootDir = path.resolve(__dirname, '..');
const publicImagesDir = path.join(rootDir, 'public', 'images');
const primaryTarget = path.join(publicImagesDir, 'document-backgrounds');

const unpackedImagesDir = path.join(rootDir, 'release', 'win-unpacked', 'resources', 'app-server', 'public', 'images');
const unpackedTarget = path.join(unpackedImagesDir, 'document-backgrounds');

const standaloneImagesDir = path.join(rootDir, '.next-production', 'standalone', 'public', 'images');
const standaloneTarget = path.join(standaloneImagesDir, 'document-backgrounds');

fs.mkdirSync(primaryTarget, { recursive: true });
if (fs.existsSync(path.dirname(unpackedTarget))) {
  fs.mkdirSync(unpackedTarget, { recursive: true });
}
if (fs.existsSync(path.dirname(standaloneTarget))) {
  fs.mkdirSync(standaloneTarget, { recursive: true });
}

console.log('Generating 40 Security Document Watermark SVGs...');

const allBackgrounds = {
  ...getMountainBackgrounds(),
  ...getOverlandBackgrounds(),
  ...getMaritimeBackgrounds(),
  ...getAviationBackgrounds(),
  ...getGeometricBackgrounds(),
};

let count = 0;
for (const [filename, svgContent] of Object.entries(allBackgrounds)) {
  const p1 = path.join(primaryTarget, filename);
  fs.writeFileSync(p1, svgContent, 'utf8');

  if (fs.existsSync(unpackedTarget)) {
    const p2 = path.join(unpackedTarget, filename);
    fs.writeFileSync(p2, svgContent, 'utf8');
  }

  if (fs.existsSync(standaloneTarget)) {
    const p3 = path.join(standaloneTarget, filename);
    fs.writeFileSync(p3, svgContent, 'utf8');
  }

  count++;
}

console.log(`Successfully generated and synced all ${count} security watermark SVGs!`);

// Synchronize all photographic & raster images in public/images
console.log('Synchronizing high-resolution photographic pictures to release targets...');
const imageFiles = fs.readdirSync(publicImagesDir).filter((file) => {
  const ext = path.extname(file).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
});

let photoCount = 0;
for (const file of imageFiles) {
  const src = path.join(publicImagesDir, file);

  if (fs.existsSync(unpackedImagesDir)) {
    const dst = path.join(unpackedImagesDir, file);
    fs.copyFileSync(src, dst);
  }

  if (fs.existsSync(standaloneImagesDir)) {
    const dst = path.join(standaloneImagesDir, file);
    fs.copyFileSync(src, dst);
  }

  photoCount++;
}

console.log(`Successfully synchronized ${photoCount} photographic images to all targets!`);
