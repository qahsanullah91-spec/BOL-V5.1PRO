const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ARTIFACT_DIR = 'C:/Users/Ahsanullah Qureshi/.gemini/antigravity/brain/f663e4ff-99ba-43eb-ab00-e8df2cdf9603';

async function generateCompleteHeaderBanner() {
  const width = 2048;
  const height = 440;
  
  // Load improved logo (1024x1024)
  const logoBuf = fs.readFileSync(path.join(ROOT, 'public', 'images', 'sky-ariana-logo.png'));
  const logoResized = await sharp(logoBuf).resize(360, 360).png().toBuffer();

  // Load improved brand lockup (1938x634)
  const lockupBuf = fs.readFileSync(path.join(ROOT, 'public', 'images', 'sky-ariana-brand-lockup.png'));
  const lockupResized = await sharp(lockupBuf).resize(1180, 386, { fit: 'inside' }).png().toBuffer();

  // Create container SVG background
  const bgSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerBg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#eff6ff"/>
          <stop offset="30%" stop-color="#ffffff"/>
          <stop offset="70%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#f0f7ff"/>
        </linearGradient>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#1e40af" flood-opacity="0.08"/>
        </filter>
      </defs>
      
      <!-- Card background with rounded corners and border -->
      <rect x="12" y="12" width="${width - 24}" height="${height - 24}" rx="32" fill="url(#headerBg)" stroke="#bfdbfe" stroke-width="3" filter="url(#shadow)"/>
      
      <!-- Circular Logo White Badge Backdrop -->
      <circle cx="224" cy="220" r="184" fill="#ffffff" stroke="#93c5fd" stroke-width="3"/>
      
      <!-- Lower Registration Strip -->
      <g transform="translate(450, 400)">
        <text x="590" y="0" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="0.08em" fill="#1e293b" text-anchor="middle">
          HEAD OFFICE: ETIMAD RAHMI MARKET, KANDAHAR   <tspan fill="#2563eb" font-weight="900">•</tspan>   REG: 90021-AFG   <tspan fill="#2563eb" font-weight="900">•</tspan>   CARRIER CODE: SKY-AF
        </text>
      </g>
    </svg>
  `;

  const bgBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer();

  // Composite elements
  const finalHeader = await sharp(bgBuf)
    .composite([
      // Logo in left badge
      { input: logoResized, left: 44, top: 40 },
      // Brand lockup centered
      { input: lockupResized, left: 450, top: 12 },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(ARTIFACT_DIR, 'improved-header-banner.png');
  fs.writeFileSync(outPath, finalHeader);
  console.log('Saved improved header banner to:', outPath);

  // Copy logo variants to artifact dir
  fs.copyFileSync(path.join(ROOT, 'public', 'images', 'sky-ariana-logo.png'), path.join(ARTIFACT_DIR, 'sky-ariana-logo-master.png'));
  fs.copyFileSync(path.join(ROOT, 'public', 'images', 'logos', 'sky-ariana-modern-3d.png'), path.join(ARTIFACT_DIR, 'sky-ariana-logo-3d.png'));
  fs.copyFileSync(path.join(ROOT, 'public', 'images', 'logos', 'sky-ariana-gold-seal.png'), path.join(ARTIFACT_DIR, 'sky-ariana-logo-gold.png'));
  fs.copyFileSync(path.join(ROOT, 'public', 'images', 'sky-ariana-brand-lockup.png'), path.join(ARTIFACT_DIR, 'sky-ariana-brand-lockup.png'));
  
  if (fs.existsSync(path.join(ROOT, 'scratch', 'current_user_logo_crop.png'))) {
    fs.copyFileSync(path.join(ROOT, 'scratch', 'current_user_logo_crop.png'), path.join(ARTIFACT_DIR, 'original-user-logo.png'));
  }

  console.log('Copied all presentation assets to artifact directory.');
}

generateCompleteHeaderBanner().catch(console.error);
