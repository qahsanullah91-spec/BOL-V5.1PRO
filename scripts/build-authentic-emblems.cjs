/**
 * scripts/build-authentic-emblems.cjs
 *
 * Generates the authentic Sky Ariana Logo Suite using the master pristine artwork:
 * - 3D Metallic Blue Emblem (sky-ariana-modern-3d-emblem.png)
 * - Gold Luxury Seal (sky-ariana-gold-seal.png)
 * - Master Circular Seal (sky-ariana-circular-seal.png)
 * - Modern Flat Emblem (sky-ariana-modern-flat-emblem.png)
 * - Master Root Logo (public/images/sky-ariana-logo.png)
 * - 3D Showcase Banner (sky-ariana-modern-3d.png)
 * - Modern Flat Showcase Banner (sky-ariana-modern-flat.png)
 * - Classic Horizontal Showcase Banner (sky-ariana-classic-horizontal.png)
 * - Classic Stack Showcase Banner (sky-ariana-classic-stack.png)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_IMG = path.join(ROOT, 'public', 'images');
const LOGOS_DIR = path.join(PUBLIC_IMG, 'logos');

async function buildAll() {
  console.log('=== Building Authentic Sky Ariana Logo Suite ===');

  const masterPath = path.join(ROOT, 'scratch', 'clean_logo_2048.png');
  if (!fs.existsSync(masterPath)) {
    throw new Error('Master artwork scratch/clean_logo_2048.png not found!');
  }

  const masterBuf = await sharp(masterPath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = masterBuf;
  const { width, height } = info;
  const cx = width / 2;
  const cy = height / 2;

  // 1. Extract Letter Mask (S, K, Y)
  const isLetter = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 870) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a > 128 && r > 200 && g > 200 && b > 200) {
          isLetter[y * width + x] = 1;
        }
      }
    }
  }

  // 2. Generate 3D Metallic Blue Emblem (2048 -> 1024)
  console.log('Rendering 3D Metallic Blue Emblem...');
  const out3d = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const angle = Math.atan2(y - cy, x - cx);

      if (dist > 1018) {
        out3d[idx + 3] = 0;
        continue;
      }

      // Outer Chrome Beveled Ring (dist 948 - 1018)
      if (dist >= 948) {
        const chromeLight = 0.5 + 0.5 * Math.cos(angle * 2 - Math.PI / 4) * Math.sin(((dist - 948) / 70) * Math.PI);
        const rimEdge = dist > 1014 || dist < 952 ? 0.4 : 1.0;
        const val = Math.min(255, Math.max(0, Math.round((140 + 115 * chromeLight) * rimEdge)));
        out3d[idx] = val;
        out3d[idx + 1] = Math.min(255, val + 10);
        out3d[idx + 2] = Math.min(255, val + 25);
        out3d[idx + 3] = 255;
        continue;
      }

      // Concentric Spacing Channel (dist 874 - 948)
      if (dist >= 874) {
        const rim = dist > 944 || dist < 878 ? 180 : 245;
        out3d[idx] = Math.round(rim * 0.95);
        out3d[idx + 1] = Math.round(rim * 0.97);
        out3d[idx + 2] = rim;
        out3d[idx + 3] = 255;
        continue;
      }

      // Inner Sapphire Blue Dome (dist < 874)
      const domeDist = Math.hypot(x - (cx - 140), y - (cy - 160)) / 1100;
      const t = Math.min(1, Math.max(0, domeDist));
      let dr = Math.round(37 * (1 - t) + 10 * t);
      let dg = Math.round(99 * (1 - t) + 26 * t);
      let db = Math.round(235 * (1 - t) + 74 * t);

      // Glass specular gloss reflection arc
      if (y < cy + 100) {
        const glossDist = Math.hypot(x - cx, y - (cy - 200));
        if (glossDist < 600) {
          const glossFactor = Math.pow(1 - glossDist / 600, 2) * 0.35;
          dr = Math.min(255, Math.round(dr + 255 * glossFactor));
          dg = Math.min(255, Math.round(dg + 255 * glossFactor));
          db = Math.min(255, Math.round(db + 255 * glossFactor));
        }
      }

      // Letter drop shadow (offset dx=12, dy=18)
      const shadowX = x - 12;
      const shadowY = y - 18;
      if (shadowX >= 0 && shadowX < width && shadowY >= 0 && shadowY < height) {
        if (isLetter[shadowY * width + shadowX] && !isLetter[y * width + x]) {
          dr = Math.round(dr * 0.35);
          dg = Math.round(dg * 0.35);
          db = Math.round(db * 0.45);
        }
      }

      // 3D Beveled Chrome Letters
      if (isLetter[y * width + x]) {
        const isTopLeftEdge = x > 3 && y > 3 && (!isLetter[(y - 4) * width + (x - 4)] || !isLetter[(y - 5) * width + x] || !isLetter[y * width + (x - 5)]);
        const isBottomRightEdge = x < width - 4 && y < height - 4 && (!isLetter[(y + 4) * width + (x + 4)] || !isLetter[(y + 5) * width + x] || !isLetter[y * width + (x + 5)]);

        if (isTopLeftEdge) {
          out3d[idx] = 255;
          out3d[idx + 1] = 255;
          out3d[idx + 2] = 255;
          out3d[idx + 3] = 255;
        } else if (isBottomRightEdge) {
          out3d[idx] = 130;
          out3d[idx + 1] = 145;
          out3d[idx + 2] = 170;
          out3d[idx + 3] = 255;
        } else {
          const letterSheen = 0.5 + 0.5 * Math.cos((x + y * 1.5) / 180);
          const val = Math.round(210 + 45 * letterSheen);
          out3d[idx] = val;
          out3d[idx + 1] = Math.min(255, val + 15);
          out3d[idx + 2] = Math.min(255, val + 25);
          out3d[idx + 3] = 255;
        }
      } else {
        out3d[idx] = dr;
        out3d[idx + 1] = dg;
        out3d[idx + 2] = db;
        out3d[idx + 3] = 255;
      }
    }
  }

  const d3Emblem1024 = await sharp(out3d, { raw: { width, height, channels: 4 } })
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const d3EmblemPath = path.join(LOGOS_DIR, 'sky-ariana-modern-3d-emblem.png');
  fs.writeFileSync(d3EmblemPath, d3Emblem1024);
  console.log('Saved:', d3EmblemPath, `(${d3Emblem1024.length} bytes)`);

  // 3. Generate Gold Luxury Seal (2048 -> 1024)
  console.log('Rendering Gold Luxury Seal...');
  const outGold = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const angle = Math.atan2(y - cy, x - cx);

      if (dist > 1018) {
        outGold[idx + 3] = 0;
        continue;
      }

      // Outer 24K Polished Gold Beveled Ring (dist 948 - 1018)
      if (dist >= 948) {
        const goldLight = 0.5 + 0.5 * Math.cos(angle * 2 - Math.PI / 4) * Math.sin(((dist - 948) / 70) * Math.PI);
        const rimEdge = dist > 1014 || dist < 952 ? 0.6 : 1.0;
        const gr = Math.min(255, Math.max(0, Math.round((170 + 85 * goldLight) * rimEdge)));
        const gg = Math.min(255, Math.max(0, Math.round((120 + 95 * goldLight) * rimEdge)));
        const gb = Math.min(255, Math.max(0, Math.round((20 + 80 * goldLight) * rimEdge)));
        outGold[idx] = gr;
        outGold[idx + 1] = gg;
        outGold[idx + 2] = gb;
        outGold[idx + 3] = 255;
        continue;
      }

      // Concentric Spacing Channel (dist 874 - 948)
      if (dist >= 874) {
        if (dist > 942 || dist < 880) {
          outGold[idx] = 230;
          outGold[idx + 1] = 180;
          outGold[idx + 2] = 50;
        } else {
          const navyT = (dist - 880) / 62;
          outGold[idx] = Math.round(15 + 10 * navyT);
          outGold[idx + 1] = Math.round(25 + 15 * navyT);
          outGold[idx + 2] = Math.round(55 + 25 * navyT);
        }
        outGold[idx + 3] = 255;
        continue;
      }

      // Inner Midnight Blue / Onyx Navy Dome (dist < 874)
      const domeDist = Math.hypot(x - (cx - 140), y - (cy - 160)) / 1100;
      const t = Math.min(1, Math.max(0, domeDist));
      let dr = Math.round(14 * (1 - t) + 6 * t);
      let dg = Math.round(35 * (1 - t) + 14 * t);
      let db = Math.round(75 * (1 - t) + 30 * t);

      // Glass specular gloss reflection arc
      if (y < cy + 100) {
        const glossDist = Math.hypot(x - cx, y - (cy - 200));
        if (glossDist < 600) {
          const glossFactor = Math.pow(1 - glossDist / 600, 2) * 0.28;
          dr = Math.min(255, Math.round(dr + 255 * glossFactor));
          dg = Math.min(255, Math.round(dg + 245 * glossFactor));
          db = Math.min(255, Math.round(db + 200 * glossFactor));
        }
      }

      // Letter drop shadow (offset dx=12, dy=18)
      const shadowX = x - 12;
      const shadowY = y - 18;
      if (shadowX >= 0 && shadowX < width && shadowY >= 0 && shadowY < height) {
        if (isLetter[shadowY * width + shadowX] && !isLetter[y * width + x]) {
          dr = Math.round(dr * 0.25);
          dg = Math.round(dg * 0.25);
          db = Math.round(db * 0.35);
        }
      }

      // 24K Embossed Gold Letters
      if (isLetter[y * width + x]) {
        const isTopLeftEdge = x > 3 && y > 3 && (!isLetter[(y - 4) * width + (x - 4)] || !isLetter[(y - 5) * width + x] || !isLetter[y * width + (x - 5)]);
        const isBottomRightEdge = x < width - 4 && y < height - 4 && (!isLetter[(y + 4) * width + (x + 4)] || !isLetter[(y + 5) * width + x] || !isLetter[y * width + (x + 5)]);

        if (isTopLeftEdge) {
          outGold[idx] = 255;
          outGold[idx + 1] = 248;
          outGold[idx + 2] = 190;
          outGold[idx + 3] = 255;
        } else if (isBottomRightEdge) {
          outGold[idx] = 140;
          outGold[idx + 1] = 75;
          outGold[idx + 2] = 10;
          outGold[idx + 3] = 255;
        } else {
          const goldSheen = 0.5 + 0.5 * Math.cos((x + y * 1.5) / 180);
          outGold[idx] = Math.round(225 + 30 * goldSheen);
          outGold[idx + 1] = Math.round(175 + 50 * goldSheen);
          outGold[idx + 2] = Math.round(45 + 55 * goldSheen);
          outGold[idx + 3] = 255;
        }
      } else {
        outGold[idx] = dr;
        outGold[idx + 1] = dg;
        outGold[idx + 2] = db;
        outGold[idx + 3] = 255;
      }
    }
  }

  const goldSeal1024 = await sharp(outGold, { raw: { width, height, channels: 4 } })
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toBuffer();

  const goldSealPath = path.join(LOGOS_DIR, 'sky-ariana-gold-seal.png');
  fs.writeFileSync(goldSealPath, goldSeal1024);
  console.log('Saved:', goldSealPath, `(${goldSeal1024.length} bytes)`);

  // 4. Generate Master Authentic Flat & Circular Seals (1024x1024)
  console.log('Generating Master Circular & Flat Seals...');
  const master1024 = await sharp(masterPath)
    .resize(1024, 1024)
    .png({ compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-logo.png'), master1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-circular-seal.png'), master1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-flat-emblem.png'), master1024);
  console.log('Updated sky-ariana-logo.png and circular-seal.png');

  // 5. Generate Showcase Banners for Gallery Cards
  console.log('Generating Showcase Banners...');
  const lockupPath = path.join(PUBLIC_IMG, 'sky-ariana-brand-lockup.png');
  const lockupBuf = fs.readFileSync(lockupPath);

  const lockup3dPath = path.join(LOGOS_DIR, 'sky-ariana-modern-3d-lockup.png');
  const lockup3dBuf = fs.existsSync(lockup3dPath) ? fs.readFileSync(lockup3dPath) : lockupBuf;

  async function makeBanner(emblemBuf, lockupBufIn, outPath) {
    const canvasW = 2600;
    const canvasH = 720;
    const emblemSize = 580;
    const emblemResized = await sharp(emblemBuf)
      .resize(emblemSize, emblemSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const lockupH = 570;
    const lockupW = 1740;
    const lockupResized = await sharp(lockupBufIn)
      .resize(lockupW, lockupH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([
        { input: emblemResized, top: 70, left: 80 },
        { input: lockupResized, top: 75, left: 740 },
      ])
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log('Saved showcase banner:', path.basename(outPath));
  }

  // Modern 3D Metallic Banner
  await makeBanner(d3Emblem1024, lockup3dBuf, path.join(LOGOS_DIR, 'sky-ariana-modern-3d.png'));

  // Modern Flat Banner
  await makeBanner(master1024, lockupBuf, path.join(LOGOS_DIR, 'sky-ariana-modern-flat.png'));

  // Classic Horizontal Banner
  await makeBanner(master1024, lockupBuf, path.join(LOGOS_DIR, 'sky-ariana-classic-horizontal.png'));

  // Classic Stack Banner (1600x1100)
  const stackCanvasW = 1600;
  const stackCanvasH = 1100;
  const stackEmblem = await sharp(master1024).resize(460, 460).toBuffer();
  const stackLockup = await sharp(lockupBuf).resize(1440, 470).toBuffer();
  await sharp({
    create: {
      width: stackCanvasW,
      height: stackCanvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: stackEmblem, top: 40, left: Math.round((stackCanvasW - 460) / 2) },
      { input: stackLockup, top: 540, left: Math.round((stackCanvasW - 1440) / 2) },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(LOGOS_DIR, 'sky-ariana-classic-stack.png'));
  console.log('Saved showcase banner: sky-ariana-classic-stack.png');

  console.log('=== All Authentic Logos Successfully Built! ===');
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
