const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Watermark Background Gallery Assets & XML Integrity Suite', async (t) => {
  const backgroundsJsonPath = path.resolve('lib/document-backgrounds.json');
  const backgroundsJson = JSON.parse(fs.readFileSync(backgroundsJsonPath, 'utf8'));

  const backgroundsTsPath = path.resolve('lib/document-backgrounds.ts');
  const backgroundsTs = fs.readFileSync(backgroundsTsPath, 'utf8');

  await t.test('1. Verified SVGs parse as valid XML without bare ampersands', () => {
    const svgsToCheck = [
      'public/images/document-backgrounds/above-the-clouds.svg',
      'public/images/document-backgrounds/contour-map.svg',
      'public/images/document-backgrounds/trade-network.svg',
      'public/images/document-backgrounds/harbor-morning.svg'
    ];

    for (const svgFile of svgsToCheck) {
      const fullPath = path.resolve(svgFile);
      assert.ok(fs.existsSync(fullPath), `${svgFile} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check no unescaped ampersand in text elements
      const withoutComments = content.replace(/<!--[\s\S]*?-->/g, '');
      const hasBareAmp = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(withoutComments);
      assert.strictEqual(hasBareAmp, false, `${svgFile} must not contain bare unescaped ampersands`);
      assert.ok(content.startsWith('<?xml') || content.startsWith('<svg'), `${svgFile} must start with XML/SVG declaration`);
    }
  });

  await t.test('2. "Above the Clouds" has authentic airliner photo base', () => {
    const svgPath = path.resolve('public/images/document-backgrounds/above-the-clouds.svg');
    const content = fs.readFileSync(svgPath, 'utf8');
    assert.ok(content.includes('data:image/jpeg;base64,'), 'Above the clouds must contain base64 JPEG artwork');
    // Ensure it is not an identical duplicate of contour-map
    const contourContent = fs.readFileSync(path.resolve('public/images/document-backgrounds/contour-map.svg'), 'utf8');
    const aboveMatch = content.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)?.[1];
    const contourMatch = contourContent.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)?.[1];
    assert.notStrictEqual(aboveMatch, contourMatch, 'Above the clouds and contour map must have distinct photos');
  });

  await t.test('3. New vector and photo watermarks exist in library catalog and on disk', () => {
    // 4 new vector SVGs in JSON
    const labelsInJson = backgroundsJson.map(x => x.label);
    assert.ok(labelsInJson.includes('Northern Star'), 'Northern Star must be in JSON');
    assert.ok(labelsInJson.includes('Pearl Waves'), 'Pearl Waves must be in JSON');
    assert.ok(labelsInJson.includes('Route Geometry'), 'Route Geometry must be in JSON');
    assert.ok(labelsInJson.includes('Soft Arches'), 'Soft Arches must be in JSON');

    // 12 new watermark-photos in TS
    assert.ok(backgroundsTs.includes('/images/watermark-photos/winding-pass.jpg'), 'Winding pass must be in TS');
    assert.ok(backgroundsTs.includes('/images/watermark-photos/cargo-convoy.jpg'), 'Cargo convoy photo must be in TS');
    assert.ok(backgroundsTs.includes('/images/watermark-photos/ocean-passage.jpg'), 'Ocean passage photo must be in TS');
    assert.ok(backgroundsTs.includes('/images/watermark-photos/container-port.jpg'), 'Container port photo must be in TS');

    // Verify all JSON files exist on disk
    for (const item of backgroundsJson) {
      if (item.url) {
        const filePath = path.resolve('public' + item.url);
        assert.ok(fs.existsSync(filePath), `JSON asset ${item.label} (${filePath}) must exist on disk`);
      }
    }
  });
});
