const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ARTIFACT_DIR = 'C:/Users/Ahsanullah Qureshi/.gemini/antigravity/brain/f663e4ff-99ba-43eb-ab00-e8df2cdf9603';

async function generateCardsPreview() {
  const cardW = 680;
  const cardH = 360;
  const gap = 40;
  const totalW = cardW * 2 + gap + 80;
  const totalH = cardH + 120;

  // Load preview images
  const flatBuf = await sharp('public/images/logos/sky-ariana-modern-flat.png')
    .resize(580, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const d3Buf = await sharp('public/images/logos/sky-ariana-modern-3d.png')
    .resize(580, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create SVG card frame
  const svg = `
<svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="${totalW}" height="${totalH}" fill="#f8fafc"/>

  <!-- Top Title -->
  <text x="${totalW / 2}" y="42" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#0f172a" text-anchor="middle">
    SKY ARIANA - IMPROVED &amp; FIXED LOGO DESIGNS GALLERY
  </text>

  <!-- CARD 1: Modern Flat Vector (Official) -->
  <g transform="translate(40, 70)" filter="url(#shadow)">
    <!-- Card Container -->
    <rect width="${cardW}" height="${cardH}" rx="16" fill="#ffffff" stroke="#2563eb" stroke-width="2.5"/>
    
    <!-- Pills -->
    <rect x="20" y="18" width="120" height="24" rx="6" fill="#dbeafe" stroke="#bfdbfe" stroke-width="1"/>
    <text x="80" y="34" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#1e40af" text-anchor="middle">Standard / پیش‌فرض</text>

    <rect x="${cardW - 140}" y="18" width="120" height="24" rx="12" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1"/>
    <text x="${cardW - 80}" y="34" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#059669" text-anchor="middle">✓ Active on BOL</text>

    <!-- Title -->
    <text x="20" y="68" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#0f172a">Modern Flat Vector (Official)</text>
    <text x="${cardW - 20}" y="68" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#64748b" text-anchor="end" dir="rtl">طرح مدرن فلت رسمی</text>

    <!-- Chamber Background -->
    <rect x="20" y="86" width="${cardW - 40}" height="170" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.2"/>

    <!-- Descriptions -->
    <text x="20" y="280" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#475569">Clean contemporary vector lockup with blue typography and bilingual subline.</text>
    <text x="${cardW - 20}" y="300" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="end" dir="rtl">طراحی مینیمال و معاصر با تایپوگرافی آبی و خط زیرین دوزبانه رسمی.</text>

    <!-- Bottom Action Row -->
    <text x="20" y="336" font-family="monospace" font-size="11" fill="#94a3b8">Vector Lockup</text>
    <rect x="${cardW - 120}" y="316" width="100" height="30" rx="8" fill="#2563eb"/>
    <text x="${cardW - 70}" y="335" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">✓ Selected</text>
  </g>

  <!-- CARD 2: Modern 3D Metallic Gloss -->
  <g transform="translate(${40 + cardW + gap}, 70)" filter="url(#shadow)">
    <!-- Card Container -->
    <rect width="${cardW}" height="${cardH}" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

    <!-- Pills -->
    <rect x="20" y="18" width="130" height="24" rx="6" fill="#e0e7ff" stroke="#c7d2fe" stroke-width="1"/>
    <text x="85" y="34" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#3730a3" text-anchor="middle">3D Chrome / سه‌بعدی</text>

    <!-- Title -->
    <text x="20" y="68" font-family="system-ui, sans-serif" font-size="15" font-weight="900" fill="#0f172a">Modern 3D Metallic Gloss</text>
    <text x="${cardW - 20}" y="68" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#64748b" text-anchor="end" dir="rtl">طرح مدرن ۳ بعدی متالیک</text>

    <!-- Chamber Background -->
    <rect x="20" y="86" width="${cardW - 40}" height="170" rx="12" fill="#0b1329" stroke="#1e293b" stroke-width="1.2"/>

    <!-- Descriptions -->
    <text x="20" y="280" font-family="system-ui, sans-serif" font-size="12" font-weight="500" fill="#475569">High-impact 3D metallic chrome blue emblem with extruded Persian brand lettering.</text>
    <text x="${cardW - 20}" y="300" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b" text-anchor="end" dir="rtl">نشان متالیک سه بعدی کروم با حروف‌نگاری برجسته و درخشان فارسی و انگلیسی.</text>

    <!-- Bottom Action Row -->
    <text x="20" y="336" font-family="monospace" font-size="11" fill="#94a3b8">Vector Lockup</text>
    <rect x="${cardW - 130}" y="316" width="110" height="30" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="${cardW - 75}" y="335" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Use This Logo</text>
  </g>
</svg>`;

  const bgBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  const finalImg = await sharp(bgBuf)
    .composite([
      { input: flatBuf, top: 70 + 91, left: 40 + 50 },
      { input: d3Buf, top: 70 + 91, left: 40 + cardW + gap + 50 },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(ARTIFACT_DIR, 'improved-logo-designs-preview.png');
  fs.writeFileSync(outPath, finalImg);
  console.log('Saved preview to:', outPath);
}

generateCardsPreview().catch(console.error);
