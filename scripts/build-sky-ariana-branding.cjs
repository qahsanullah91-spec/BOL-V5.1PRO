/**
 * scripts/build-sky-ariana-branding.cjs
 * 
 * Generates the official Sky Ariana corporate branding assets:
 * 1. Mathematically perfected vector SVG & 2048x2048 / 1024x1024 PNGs for the Circular "SKY" Emblem:
 *    - Master Corporate Seal (Deep Royal Sapphire Gradient + Crisp Concentric Rings)
 *    - Modern Flat Variant
 *    - Executive 3D Luxury Variant (Sapphire Depth + Metallic Accent Ring)
 *    - Gold & Sapphire Official Customs Seal Variant
 *    - Classic Horizontal Lockup (Emblem + Wordmark)
 * 2. Vector-perfect Brand Lockup ("اسکای آریانا" + "International Transport Company" Badge + "SKY ARIANA" + Persian Calligraphy):
 *    - High-DPI transparent PNG (1938x634)
 *    - Full SVG Master Lockup
 * 
 * Replaces:
 * - public/images/sky-ariana-logo.png
 * - public/images/sky-ariana-logo.svg
 * - public/images/bol-logo.png
 * - public/images/logo.png
 * - public/images/sky-ariana-emblem.png
 * - public/images/sky-ariana-brand-lockup.png
 * - public/images/sky-ariana-brand-lockup.svg
 * - public/images/logos/*
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
// 1. EMBLEM GENERATOR (Mathematical SVG)
// -------------------------------------------------------------
function generateEmblemSvg(variant = 'master') {
  const size = 2048;
  const cx = 1024;
  const cy = 1024;

  const rOuterRingCenter = 940;
  const wOuterRing = 56;
  const rInnerDisc = 840;
  const rLetterClip = 760;
  const strokeW = 104;

  const royalBlue = "#164e9e";
  const lightAzure = "#2563eb";
  const deepNavy = "#0f2d6b";
  const darkIndigo = "#0a1936";
  const goldAccent = "#d97706";
  const goldLight = "#fbbf24";
  const goldDark = "#b45309";

  let defs = '';
  let ringStroke = '';
  let discFill = '';
  let whiteRingStroke = '#ffffff';
  let letterFill = '#ffffff';
  let innerRim = '';

  if (variant === 'master') {
    defs = `
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
    `;
    ringStroke = "url(#ringGrad)";
    discFill = "url(#discGrad)";
    innerRim = `<circle cx="${cx}" cy="${cy}" r="${rInnerDisc - 6}" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>`;
  } else if (variant === 'flat') {
    defs = `
      <clipPath id="letterClip">
        <circle cx="${cx}" cy="${cy}" r="${rLetterClip}"/>
      </clipPath>
    `;
    ringStroke = royalBlue;
    discFill = royalBlue;
  } else if (variant === '3d') {
    defs = `
      <linearGradient id="disc3D" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="30%" stop-color="#1d4ed8"/>
        <stop offset="70%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="#0a1936"/>
      </linearGradient>
      <linearGradient id="ring3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa"/>
        <stop offset="50%" stop-color="#1d4ed8"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="chromeRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#93c5fd"/>
        <stop offset="100%" stop-color="#1e3a8a"/>
      </linearGradient>
      <clipPath id="letterClip">
        <circle cx="${cx}" cy="${cy}" r="${rLetterClip}"/>
      </clipPath>
    `;
    ringStroke = "url(#ring3D)";
    discFill = "url(#disc3D)";
    innerRim = `<circle cx="${cx}" cy="${cy}" r="${rInnerDisc - 6}" fill="none" stroke="url(#chromeRim)" stroke-width="4"/>`;
  } else if (variant === 'gold') {
    defs = `
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${goldAccent}"/>
        <stop offset="50%" stop-color="${goldLight}"/>
        <stop offset="100%" stop-color="${goldDark}"/>
      </linearGradient>
      <linearGradient id="navyGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="${darkIndigo}"/>
      </linearGradient>
      <clipPath id="letterClip">
        <circle cx="${cx}" cy="${cy}" r="${rLetterClip}"/>
      </clipPath>
    `;
    ringStroke = "url(#goldGrad)";
    discFill = "url(#navyGoldGrad)";
    innerRim = `<circle cx="${cx}" cy="${cy}" r="${rInnerDisc - 6}" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>`;
  }

  // Letter columns
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defs}
  </defs>

  <!-- 1. Outer Concentric Ring -->
  <circle cx="${cx}" cy="${cy}" r="${rOuterRingCenter}" fill="none" stroke="${ringStroke}" stroke-width="${wOuterRing}"/>

  <!-- 2. Concentric White Spacing Ring -->
  <circle cx="${cx}" cy="${cy}" r="912" fill="none" stroke="${whiteRingStroke}" stroke-width="72"/>

  <!-- 3. Inner Solid Disc -->
  <circle cx="${cx}" cy="${cy}" r="${rInnerDisc}" fill="${discFill}"/>
  ${innerRim}

  <!-- 4. Monogram Letters (S - K - Y) clipped to inner letter radius -->
  <g clip-path="url(#letterClip)">
    
    <!-- ==================== LETTER S ==================== -->
    <rect x="${sBarX1}" y="0" width="${strokeW}" height="850" fill="${letterFill}"/>
    
    <path d="
      M ${sBarX2} 340
      A ${rLetterClip} ${rLetterClip} 0 0 0 ${cx - rLetterClip} ${cy}
      L ${cx - rLetterClip + strokeW} ${cy}
      A ${rLetterClip - strokeW} ${rLetterClip - strokeW} 0 0 1 ${sBarX1} 444
      L ${sBarX2} 444
      Z
    " fill="${letterFill}"/>

    <polygon points="
      ${cx - rLetterClip + strokeW - 10},940 
      ${cx - rLetterClip + strokeW + 94},940 
      ${sBarX2 + 10},1108 
      ${sBarX1 - 10},1108
    " fill="${letterFill}"/>

    <rect x="${sBarX1}" y="1198" width="${strokeW}" height="${size - 1198}" fill="${letterFill}"/>

    <path d="
      M ${cx - rLetterClip} ${cy}
      A ${rLetterClip} ${rLetterClip} 0 0 0 ${sBarX2} ${cy + rLetterClip - 104}
      L ${sBarX1} ${cy + rLetterClip - 104}
      A ${rLetterClip - strokeW} ${rLetterClip - strokeW} 0 0 1 ${cx - rLetterClip + strokeW} ${cy}
      Z
    " fill="${letterFill}"/>

    <!-- ==================== LETTER K ==================== -->
    <rect x="${kStemX1}" y="0" width="${strokeW}" height="${size}" fill="${letterFill}"/>
    
    <rect x="${kColX1}" y="0" width="${strokeW}" height="760" fill="${letterFill}"/>
    <rect x="${kColX1}" y="1288" width="${strokeW}" height="${size - 1288}" fill="${letterFill}"/>

    <polygon points="
      ${kStemX2},${cy - 50} 
      ${kColX1},740 
      ${kColX2},740 
      ${kColX2},848 
      ${kStemX2},${cy + 58}
    " fill="${letterFill}"/>

    <polygon points="
      ${kStemX2},${cy + 50} 
      ${kColX1},1308 
      ${kColX2},1308 
      ${kColX2},1200 
      ${kStemX2},${cy - 58}
    " fill="${letterFill}"/>

    <!-- ==================== LETTER Y ==================== -->
    <rect x="${yLColX1}" y="0" width="${strokeW}" height="840" fill="${letterFill}"/>
    <rect x="${yRColX1}" y="0" width="${strokeW}" height="840" fill="${letterFill}"/>

    <polygon points="
      ${yLColX1},840 
      ${yLColX2},840 
      ${yStemX2},1016 
      ${yStemX2},1060 
      ${yStemX1},1060 
      ${yLColX1},894
    " fill="${letterFill}"/>

    <polygon points="
      ${yRColX2},840 
      ${yRColX1},840 
      ${yStemX1},1016 
      ${yStemX1},1060 
      ${yStemX2},1060 
      ${yRColX2},894
    " fill="${letterFill}"/>

    <rect x="${yStemX1}" y="1040" width="${strokeW}" height="${size - 1040}" fill="${letterFill}"/>

  </g>
</svg>`;
}

// -------------------------------------------------------------
// 2. HORIZONTAL LOCKUP GENERATOR (Emblem + Wordmark)
// -------------------------------------------------------------
function generateHorizontalLockupSvg() {
  const w = 1920;
  const h = 512;
  const emblemSize = 440;
  const emblemX = 36;
  const emblemY = 36;
  
  const emblemSvg = generateEmblemSvg('master')
    .replace('<?xml version="1.0" encoding="UTF-8"?>', '')
    .replace('<svg width="2048" height="2048" viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg">', `<g transform="translate(${emblemX}, ${emblemY}) scale(${emblemSize / 2048})">`)
    .replace('</svg>', '</g>');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="textBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#164e9e"/>
    </linearGradient>
  </defs>

  ${emblemSvg}

  <!-- Text Column -->
  <g transform="translate(530, 0)">
    <!-- English Wordmark -->
    <text x="0" y="195" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="142" font-weight="900" letter-spacing="0.04em" fill="url(#textBlue)">SKY ARIANA</text>
    
    <!-- Tagline / Transport scope in navy badge -->
    <rect x="0" y="240" width="860" height="74" rx="14" fill="#164e9e"/>
    <text x="430" y="291" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" letter-spacing="0.12em" fill="#ffffff" text-anchor="middle">INTERNATIONAL TRANSPORT CO.</text>
    
    <!-- Persian / Dari Corporate Title -->
    <text x="860" y="415" font-family="'Vazirmatn', 'Noto Naskh Arabic', Tahoma, Arial, sans-serif" font-size="48" font-weight="800" fill="#0f172a" text-anchor="end" dir="rtl">شرکت حمل و نقل بین المللی اسکای آریانا</text>
  </g>
</svg>`;
}

// -------------------------------------------------------------
// 3. BRAND LOCKUP PROCESSOR & RE-BUILDER
// -------------------------------------------------------------
async function processBrandLockup() {
  const perfectedPng = path.join(ROOT, 'scratch', 'perfected_brand_lockup.png');
  
  if (fs.existsSync(perfectedPng)) {
    // Generate high-resolution target assets
    const lockup1938 = path.join(PUBLIC_IMG, 'sky-ariana-brand-lockup.png');
    await sharp(perfectedPng)
      .resize(1938, 634, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(lockup1938);
    console.log('Updated public/images/sky-ariana-brand-lockup.png (1938x634)');
    
    // Also save in logos/
    await sharp(perfectedPng)
      .resize(1938, 634, { fit: 'fill' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(LOGOS_DIR, 'sky-ariana-classic-horizontal.png'));
  }
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
async function main() {
  console.log('Generating official Sky Ariana branding suite...');

  // 1. Generate Emblem variants
  const masterSvg = generateEmblemSvg('master');
  const flatSvg = generateEmblemSvg('flat');
  const d3Svg = generateEmblemSvg('3d');
  const goldSvg = generateEmblemSvg('gold');
  const horizSvg = generateHorizontalLockupSvg();

  // Save SVGs
  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-logo.svg'), masterSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-circular-seal.svg'), masterSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-flat.svg'), flatSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-modern-3d.svg'), d3Svg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-gold-seal.svg'), goldSvg);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-classic-horizontal.svg'), horizSvg);

  // Render High-DPI PNGs (2048x2048 for master, 1024x1024 for standard)
  const master2048 = await sharp(Buffer.from(masterSvg)).resize(2048, 2048).png().toBuffer();
  const master1024 = await sharp(Buffer.from(masterSvg)).resize(1024, 1024).png().toBuffer();

  // Write primary app logos
  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-logo.png'), master1024);
  fs.writeFileSync(path.join(PUBLIC_IMG, 'bol-logo.png'), master1024);
  fs.writeFileSync(path.join(PUBLIC_IMG, 'logo.png'), master1024);
  fs.writeFileSync(path.join(PUBLIC_IMG, 'sky-ariana-emblem.png'), master1024);
  fs.writeFileSync(path.join(LOGOS_DIR, 'sky-ariana-circular-seal.png'), master1024);

  // Write emblem variants
  await sharp(Buffer.from(flatSvg)).resize(1024, 1024).png().toFile(path.join(LOGOS_DIR, 'sky-ariana-modern-flat-emblem.png'));
  await sharp(Buffer.from(d3Svg)).resize(1024, 1024).png().toFile(path.join(LOGOS_DIR, 'sky-ariana-modern-3d-emblem.png'));
  await sharp(Buffer.from(goldSvg)).resize(1024, 1024).png().toFile(path.join(LOGOS_DIR, 'sky-ariana-gold-seal.png'));

  // 2. Process Brand Lockup
  await processBrandLockup();

  console.log('Brand asset generation complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
