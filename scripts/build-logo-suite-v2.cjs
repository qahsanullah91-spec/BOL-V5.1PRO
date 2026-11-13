/**
 * scripts/build-logo-suite-v2.cjs
 * 
 * Rebuilds the Sky Ariana Logo Presets Suite with high-impact, professional designs:
 * 1. Modern Flat Vector (Official):
 *    - Emblem: Pristine royal blue flat vector emblem (1024x1024)
 *    - Lockup: Vector brand lockup with crisp Kufic and typography (1938x634)
 *    - Full Showcase Banner: Combined horizontal logo for settings gallery (2600x720)
 * 2. Modern 3D Metallic Gloss:
 *    - Emblem: 3D multi-layered beveled chrome outer ring, sapphire crystal enamel dome with glass specular gloss reflection, 3D beveled embossed letters S-K-Y (1024x1024)
 *    - Lockup: 3D metallic chrome gradient on SKY ARIANA, glossy royal blue badge with glass reflection line, embossed Kufic and Persian typography (1938x634)
 *    - Full Showcase Banner: 3D chrome emblem + 3D lockup (2600x720)
 * 3. Classic Vintage Horizontal (Old Logo):
 *    - Full horizontal vintage banner with heritage emblem and vintage lockup (2600x720)
 * 4. Classic Vintage Stacked (Old Logo):
 *    - Centered vertical stack banner with emblem on top and heritage lockup below (1600x1100)
 * 5. Official Circular Seal & Monogram:
 *    - Master corporate seal with concentric precision rings and SKY monogram (1024x1024)
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PUBLIC_IMG = path.join(ROOT, 'public', 'images');
const LOGOS_DIR = path.join(PUBLIC_IMG, 'logos');

if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. EMBLEM GENERATORS (Vector SVG)
// -------------------------------------------------------------
function getEmblemSvg(type = 'flat') {
  const size = 2048;
  const cx = 1024;
  const cy = 1024;

  const rOuterRingCenter = 940;
  const wOuterRing = 56;
  const rInnerDisc = 840;
  const rLetterClip = 760;
  const strokeW = 104;

  // Geometric coordinates for S, K, Y
  const kStemX1 = 820;
  const kStemX2 = kStemX1 + strokeW; // 924
  const kColX1 = 1126;
  const kColX2 = kColX1 + strokeW; // 1230

  const yLColX1 = 1312;
  const yLColX2 = yLColX1 + strokeW; // 1416
  const yRColX1 = 1620;
  const yRColX2 = yRColX1 + strokeW; // 1724
  const yStemX1 = 1466;
  const yStemX2 = yStemX1 + strokeW; // 1570

  const sBarX2 = 738;
  const sBarX1 = sBarX2 - strokeW; // 634

  if (type === '3d') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Metallic Chrome Ring Gradient -->
    <linearGradient id="chromeRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="15%" stop-color="#cbd5e1"/>
      <stop offset="30%" stop-color="#64748b"/>
      <stop offset="45%" stop-color="#f8fafc"/>
      <stop offset="60%" stop-color="#334155"/>
      <stop offset="80%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Chrome Outer Rim Bevel -->
    <linearGradient id="chromeBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#94a3b8" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.85"/>
    </linearGradient>

    <!-- Deep 3D Sapphire Enamel Dome Gradient -->
    <radialGradient id="sapphireDome" cx="42%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="35%" stop-color="#1d4ed8"/>
      <stop offset="70%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#09142e"/>
    </radialGradient>

    <!-- Upper Dome Glass Specular Gloss Reflection -->
    <linearGradient id="glassGloss" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.58"/>
      <stop offset="40%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- 3D Letter Chrome Bevel - Top-Left Light -->
    <linearGradient id="letterLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>

    <!-- 3D Letter Shadow Gradient -->
    <linearGradient id="letterShadow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </linearGradient>

    <filter id="sealDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#020617" flood-opacity="0.45"/>
    </filter>

    <filter id="letterDepth" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="4" dy="10" stdDeviation="8" flood-color="#020617" flood-opacity="0.6"/>
    </filter>

    <clipPath id="letterClip">
      <circle cx="${cx}" cy="${cy}" r="${rLetterClip}"/>
    </clipPath>
    <clipPath id="domeClip">
      <circle cx="${cx}" cy="${cy}" r="${rInnerDisc}"/>
    </clipPath>
  </defs>

  <!-- 1. Ambient Drop Shadow Ring Base -->
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter + wOuterRing/2}" fill="none" stroke="url(#chromeRing)" stroke-width="${wOuterRing}" filter="url(#sealDropShadow)"/>

  <!-- 2. Outer Chrome Ring with Bevel -->
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter}" fill="none" stroke="url(#chromeRing)" stroke-width="${wOuterRing}"/>
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter + wOuterRing/2 - 2}" fill="none" stroke="url(#chromeBevel)" stroke-width="4"/>
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter - wOuterRing/2 + 2}" fill="none" stroke="#0f172a" stroke-width="3" opacity="0.7"/>

  <!-- 3. Concentric Spacing Channel -->
  <circle cx="${cx}" cy="${cy}" r="912" fill="none" stroke="#ffffff" stroke-width="72"/>
  <circle cx="${cx}" cy="${cy}" r="876" fill="none" stroke="#cbd5e1" stroke-width="3" opacity="0.8"/>

  <!-- 4. Deep Sapphire Enamel Dome with Chrome Rim -->
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc}" fill="url(#sapphireDome)"/>
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc}" fill="none" stroke="url(#chromeRing)" stroke-width="8"/>
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc - 6}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>

  <!-- 5. Glass Specular Highlight Arc (Upper Dome Gloss) -->
  <path d="M 320 840 A 840 840 0 0 1 1728 840 C 1500 640 1200 560 1024 560 C 848 560 548 640 320 840 Z" fill="url(#glassGloss)" clip-path="url(#domeClip)"/>

  <!-- 6. Letters Geometry with 3D Emboss & Shadow -->
  <!-- Shadow Pass -->
  <g clip-path="url(#letterClip)" transform="translate(6, 12)" fill="url(#letterShadow)" opacity="0.65">
    <rect x="0" y="284" width="${sBarX2}" height="${strokeW}"/>
    <rect x="${sBarX1}" y="284" width="${strokeW}" height="${cy - 284 + strokeW/2}"/>
    <rect x="${sBarX1}" y="${cy - strokeW/2}" width="${size - sBarX1}" height="${strokeW}"/>
    <rect x="0" y="${cy - strokeW/2}" width="${strokeW + 284}" height="${size - cy + strokeW/2}"/>
    <rect x="0" y="${1764 - strokeW}" width="${sBarX2}" height="${strokeW}"/>
    <rect x="${kStemX1}" y="0" width="${strokeW}" height="${size}"/>
    <polygon points="${kColX2},284 ${kColX1},284 ${kStemX2},${cy} ${kStemX2},${cy - strokeW} ${kColX1},284"/>
    <polygon points="${kColX2},1764 ${kColX1},1764 ${kStemX2},${cy} ${kStemX2},${cy + strokeW} ${kColX1},1764"/>
    <rect x="${kColX1}" y="0" width="${strokeW}" height="284"/>
    <rect x="${kColX1}" y="1764" width="${strokeW}" height="${size - 1764}"/>
    <rect x="${yLColX1}" y="0" width="${strokeW}" height="840"/>
    <rect x="${yRColX1}" y="0" width="${strokeW}" height="840"/>
    <polygon points="${yLColX2},840 ${yStemX2},1016 ${yStemX2},1060 ${yStemX1},1060 ${yLColX1},894"/>
    <polygon points="${yRColX2},840 ${yRColX1},840 ${yStemX1},1016 ${yStemX1},1060 ${yStemX2},1060 ${yRColX2},894"/>
    <rect x="${yStemX1}" y="1040" width="${strokeW}" height="${size - 1040}"/>
  </g>

  <!-- Foreground 3D Chrome Letters Pass -->
  <g clip-path="url(#letterClip)" fill="url(#letterLight)" filter="url(#letterDepth)">
    <rect x="0" y="284" width="${sBarX2}" height="${strokeW}"/>
    <rect x="${sBarX1}" y="284" width="${strokeW}" height="${cy - 284 + strokeW/2}"/>
    <rect x="${sBarX1}" y="${cy - strokeW/2}" width="${size - sBarX1}" height="${strokeW}"/>
    <rect x="0" y="${cy - strokeW/2}" width="${strokeW + 284}" height="${size - cy + strokeW/2}"/>
    <rect x="0" y="${1764 - strokeW}" width="${sBarX2}" height="${strokeW}"/>
    <line x1="0" y1="284" x2="${sBarX2}" y2="284" stroke="#ffffff" stroke-width="6"/>
    <line x1="${sBarX1}" y1="284" x2="${sBarX1}" y2="${cy}" stroke="#ffffff" stroke-width="6"/>

    <rect x="${kStemX1}" y="0" width="${strokeW}" height="${size}"/>
    <polygon points="${kColX2},284 ${kColX1},284 ${kStemX2},${cy} ${kStemX2},${cy - strokeW} ${kColX1},284"/>
    <polygon points="${kColX2},1764 ${kColX1},1764 ${kStemX2},${cy} ${kStemX2},${cy + strokeW} ${kColX1},1764"/>
    <rect x="${kColX1}" y="0" width="${strokeW}" height="284"/>
    <rect x="${kColX1}" y="1764" width="${strokeW}" height="${size - 1764}"/>
    <line x1="${kStemX1}" y1="0" x2="${kStemX1}" y2="${size}" stroke="#ffffff" stroke-width="6"/>
    <line x1="${kColX1}" y1="0" x2="${kColX1}" y2="284" stroke="#ffffff" stroke-width="6"/>

    <rect x="${yLColX1}" y="0" width="${strokeW}" height="840"/>
    <rect x="${yRColX1}" y="0" width="${strokeW}" height="840"/>
    <polygon points="${yLColX2},840 ${yStemX2},1016 ${yStemX2},1060 ${yStemX1},1060 ${yLColX1},894"/>
    <polygon points="${yRColX2},840 ${yRColX1},840 ${yStemX1},1016 ${yStemX1},1060 ${yStemX2},1060 ${yRColX2},894"/>
    <rect x="${yStemX1}" y="1040" width="${strokeW}" height="${size - 1040}"/>
    <line x1="${yLColX1}" y1="0" x2="${yLColX1}" y2="840" stroke="#ffffff" stroke-width="6"/>
    <line x1="${yRColX1}" y1="0" x2="${yRColX1}" y2="840" stroke="#ffffff" stroke-width="6"/>
    <line x1="${yStemX1}" y1="1040" x2="${yStemX1}" y2="${size}" stroke="#ffffff" stroke-width="6"/>
  </g>
</svg>`;
  }

  // Master / Flat Vector
  const royalBlue = "#164e9e";
  const lightAzure = "#2563eb";
  const deepNavy = "#0f2d6b";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="discGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${lightAzure}"/>
      <stop offset="35%" stop-color="${royalBlue}"/>
      <stop offset="100%" stop-color="${deepNavy}"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d4ed8"/>
      <stop offset="100%" stop-color="#0e3a8a"/>
    </linearGradient>
    <clipPath id="letterClip">
      <circle cx="${cx}" cy="${cy}" r="${rLetterClip}"/>
    </clipPath>
  </defs>

  <!-- 1. Outer Concentric Ring -->
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter}" fill="none" stroke="url(#ringGrad)" stroke-width="${wOuterRing}"/>

  <!-- 2. Concentric Spacing Channel -->
  <circle cx="${cx}" cy="${cy}" r="912" fill="none" stroke="#ffffff" stroke-width="72"/>

  <!-- 3. Solid Royal Blue Disc -->
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc}" fill="url(#discGrad)"/>
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc - 6}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>

  <!-- 4. Letters Geometry (S, K, Y) -->
  <g clip-path="url(#letterClip)">
    <!-- LETTER S -->
    <rect x="0" y="284" width="${sBarX2}" height="${strokeW}" fill="#ffffff"/>
    <rect x="${sBarX1}" y="284" width="${strokeW}" height="${cy - 284 + strokeW/2}" fill="#ffffff"/>
    <rect x="${sBarX1}" y="${cy - strokeW/2}" width="${size - sBarX1}" height="${strokeW}" fill="#ffffff"/>
    <rect x="0" y="${cy - strokeW/2}" width="${strokeW + 284}" height="${size - cy + strokeW/2}" fill="#ffffff"/>
    <rect x="0" y="${1764 - strokeW}" width="${sBarX2}" height="${strokeW}" fill="#ffffff"/>

    <!-- LETTER K -->
    <rect x="${kStemX1}" y="0" width="${strokeW}" height="${size}" fill="#ffffff"/>
    <polygon points="${kColX2},284 ${kColX1},284 ${kStemX2},${cy} ${kStemX2},${cy - strokeW} ${kColX1},284" fill="#ffffff"/>
    <polygon points="${kColX2},1764 ${kColX1},1764 ${kStemX2},${cy} ${kStemX2},${cy + strokeW} ${kColX1},1764" fill="#ffffff"/>
    <rect x="${kColX1}" y="0" width="${strokeW}" height="284" fill="#ffffff"/>
    <rect x="${kColX1}" y="1764" width="${strokeW}" height="${size - 1764}" fill="#ffffff"/>

    <!-- LETTER Y -->
    <rect x="${yLColX1}" y="0" width="${strokeW}" height="840" fill="#ffffff"/>
    <rect x="${yRColX1}" y="0" width="${strokeW}" height="840" fill="#ffffff"/>
    <polygon points="${yLColX2},840 ${yStemX2},1016 ${yStemX2},1060 ${yStemX1},1060 ${yLColX1},894" fill="#ffffff"/>
    <polygon points="${yRColX2},840 ${yRColX1},840 ${yStemX1},1016 ${yStemX1},1060 ${yStemX2},1060 ${yRColX2},894" fill="#ffffff"/>
    <rect x="${yStemX1}" y="1040" width="${strokeW}" height="${size - 1040}" fill="#ffffff"/>
  </g>
</svg>`;
}

// -------------------------------------------------------------
// 2. 3D LOCKUP GENERATOR
// -------------------------------------------------------------
function generate3DLockupSvg() {
  const w = 1938;
  const h = 634;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Chrome Gradient for SKY ARIANA -->
    <linearGradient id="chromeText" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#64748b"/>
      <stop offset="55%" stop-color="#f8fafc"/>
      <stop offset="85%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Metallic Royal Blue Badge Gradient -->
    <linearGradient id="metallicBadge" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="40%" stop-color="#1d4ed8"/>
      <stop offset="70%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Chrome Border Gradient -->
    <linearGradient id="chromeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="35%" stop-color="#94a3b8"/>
      <stop offset="70%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>

    <!-- Glass Specular Reflection on Badge -->
    <linearGradient id="glassBadge" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>

    <!-- 3D Bevel Dropshadow -->
    <filter id="textDropShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#020617" flood-opacity="0.35"/>
    </filter>

    <filter id="badgeShadow" x="-10%" y="-20%" width="120%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#020617" flood-opacity="0.3"/>
    </filter>
  </defs>

  <g transform="translate(48, 20)">
    <!-- 1. Top Row: Kufic Calligraphy "اسکای آریانا" with 3D Depth -->
    <g filter="url(#textDropShadow)">
      <text x="1842" y="152" font-family="'Vazirmatn', 'Noto Kufi Arabic', Arial, sans-serif" font-size="140" font-weight="900" fill="#020617" text-anchor="end" dir="rtl" letter-spacing="0.06em">اسکای آریانا</text>
      <text x="1842" y="150" font-family="'Vazirmatn', 'Noto Kufi Arabic', Arial, sans-serif" font-size="140" font-weight="900" fill="#0f172a" text-anchor="end" dir="rtl" letter-spacing="0.06em">اسکای آریانا</text>
    </g>

    <!-- 2. Middle Row: Metallic Badge + 3D Chrome SKY ARIANA -->
    <g transform="translate(0, 185)">
      <rect x="0" y="8" width="1150" height="116" rx="22" fill="url(#metallicBadge)" stroke="url(#chromeBorder)" stroke-width="4" filter="url(#badgeShadow)"/>
      <path d="M 4 30 Q 4 12 22 12 L 1128 12 Q 1146 12 1146 30 L 1146 64 L 4 64 Z" fill="url(#glassBadge)"/>
      <text x="575" y="80" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" letter-spacing="0.05em" fill="#ffffff" text-anchor="middle" filter="url(#textDropShadow)">
        International Transport Company
      </text>

      <g transform="translate(1200, 0)" filter="url(#textDropShadow)">
        <text x="0" y="104" font-family="ui-sans-serif, system-ui, -apple-system, 'Arial Black', sans-serif" font-size="112" font-weight="900" letter-spacing="0.08em" fill="url(#chromeText)">
          SKY ARIANA
        </text>
      </g>
    </g>

    <!-- 3. Bottom Row: Persian Title with 3D Emboss -->
    <g transform="translate(0, 480)" filter="url(#textDropShadow)">
      <text x="1842" y="70" font-family="'Vazirmatn', 'Noto Naskh Arabic', Tahoma, Arial, sans-serif" font-size="82" font-weight="900" fill="#0f172a" text-anchor="end" dir="rtl">
        شرکت حمل و نقل بین المللی اسکای آریانا
      </text>
    </g>
  </g>
</svg>`;
}

// -------------------------------------------------------------
// 3. COMPOSITE SHOWCASE BUILDER
// -------------------------------------------------------------
async function compositeHorizontalBanner(emblemBuffer, lockupBuffer, outPath, options = {}) {
  const canvasW = 2600;
  const canvasH = 720;

  const emblemSize = 580;
  const emblemResized = await sharp(emblemBuffer)
    .resize(emblemSize, emblemSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const lockupH = 570;
  const lockupW = 1740;
  const lockupResized = await sharp(lockupBuffer)
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

  console.log(`Generated showcase banner: ${path.basename(outPath)}`);
}

// -------------------------------------------------------------
// 4. MAIN BUILD WORKFLOW
// -------------------------------------------------------------
async function main() {
  console.log('=== Rebuilding Sky Ariana Logo Suite ===');

  // A. Generate Emblems
  const flatEmblemSvg = getEmblemSvg('flat');
  const d3EmblemSvg = getEmblemSvg('3d');

  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-flat.svg'), flatEmblemSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-3d.svg'), d3EmblemSvg);
  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-logo.svg'), flatEmblemSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-circular-seal.svg'), flatEmblemSvg);

  const flatEmblem1024 = await sharp(Buffer.from(flatEmblemSvg)).resize(1024, 1024).png().toBuffer();
  const d3Emblem1024 = await sharp(Buffer.from(d3EmblemSvg)).resize(1024, 1024).png().toBuffer();

  // Save distinct emblem files
  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-logo.png'), flatEmblem1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-circular-seal.png'), flatEmblem1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-flat-emblem.png'), flatEmblem1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-3d-emblem.png'), d3Emblem1024);

  // B. Generate Lockups
  const flatLockupPath = path.join(PUBLIC_IMG, 'sky-ariana-brand-lockup.png');
  const flatLockupBuf = fs.readFileSync(flatLockupPath);

  const d3LockupSvg = generate3DLockupSvg();
  const d3LockupBuf = await sharp(Buffer.from(d3LockupSvg)).resize(1938, 634).png().toBuffer();
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-3d-lockup.png'), d3LockupBuf);

  // C. Generate Full Showcase Banners for Gallery Cards
  // 1. Modern Flat Vector Showcase
  await compositeHorizontalBanner(
    flatEmblem1024,
    flatLockupBuf,
    path.join(LOGOS_DIR, 'sky-ariana-modern-flat.png')
  );

  // 2. Modern 3D Metallic Gloss Showcase
  await compositeHorizontalBanner(
    d3Emblem1024,
    d3LockupBuf,
    path.join(LOGOS_DIR, 'sky-ariana-modern-3d.png')
  );

  // 3. Classic Vintage Horizontal Showcase
  await compositeHorizontalBanner(
    flatEmblem1024,
    flatLockupBuf,
    path.join(LOGOS_DIR, 'sky-ariana-classic-horizontal.png')
  );

  // 4. Classic Vintage Stacked Showcase (1600x1100)
  const stackCanvasW = 1600;
  const stackCanvasH = 1100;
  const stackEmblem = await sharp(flatEmblem1024).resize(460, 460).toBuffer();
  const stackLockup = await sharp(flatLockupBuf).resize(1440, 470).toBuffer();
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
  console.log('Generated showcase banner: sky-ariana-classic-stack.png');

  console.log('=== Logo Suite Rebuild Complete ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
