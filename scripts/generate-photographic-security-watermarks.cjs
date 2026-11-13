/**
 * High-Definition Security Watermark Generator for Sky Ariana BOL
 * 
 * Transforms the 12 aviation & geometric watermark SVGs from crude vector drawings
 * into high-definition, banknote-grade security document watermarks featuring authentic
 * logistics photography, precision guilloche lathework, microline frames, corner rosettes,
 * and calibrated paper luminance gradients.
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const primaryTarget = path.join(rootDir, 'public', 'images', 'document-backgrounds');
const unpackedTarget = path.join(rootDir, 'release', 'win-unpacked', 'resources', 'app-server', 'public', 'images', 'document-backgrounds');
const standaloneTarget = path.join(rootDir, '.next-production', 'standalone', 'public', 'images', 'document-backgrounds');

fs.mkdirSync(primaryTarget, { recursive: true });

function round(n, d = 1) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// Generate Guilloche Wave Band
function generateGuillocheBand(yCenter, amp1, freq1, amp2, freq2, lines = 8, spacing = 4, color = '#1e3a8a', opacity = 0.45) {
  let out = `<g fill="none" stroke="${color}" opacity="${opacity}">\n`;
  for (let l = 0; l < lines; l++) {
    const offset = (l - lines / 2) * spacing;
    const strokeW = l % 3 === 0 ? 1.4 : 0.7;
    let d = '';
    for (let x = 30; x <= 870; x += 15) {
      const rad1 = (x / 900) * Math.PI * 2 * freq1;
      const rad2 = (x / 900) * Math.PI * 2 * freq2 + (l * 0.25);
      const y = yCenter + offset + Math.sin(rad1) * amp1 + Math.cos(rad2) * amp2;
      d += (x === 30 ? `M ${x},${round(y)}` : ` L ${x},${round(y)}`);
    }
    out += `  <path d="${d}" stroke-width="${strokeW}" />\n`;
  }
  out += `</g>\n`;
  return out;
}

// Generate Banknote Rosette
function generateRosette(cx, cy, R, petals = 16, color = '#1e3a8a', opacity = 0.7) {
  let out = `<g transform="translate(${cx},${cy})" fill="none" stroke="${color}" opacity="${opacity}">\n`;
  out += `  <circle cx="0" cy="0" r="${R}" stroke-width="1.8" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.88}" stroke-width="0.8" stroke-dasharray="3 3" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.45}" stroke-width="1.2" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.12}" fill="${color}" />\n`;
  
  for (let i = 0; i < petals; i++) {
    const angle = (i * 360) / petals;
    const rad = (angle * Math.PI) / 180;
    const x1 = Math.cos(rad) * (R * 0.45);
    const y1 = Math.sin(rad) * (R * 0.45);
    const x2 = Math.cos(rad) * (R * 0.95);
    const y2 = Math.sin(rad) * (R * 0.95);
    out += `  <line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke-width="0.9" />\n`;
    
    // Petal loop
    const ctrlAngle1 = angle - 180 / petals;
    const ctrlAngle2 = angle + 180 / petals;
    const radC1 = (ctrlAngle1 * Math.PI) / 180;
    const radC2 = (ctrlAngle2 * Math.PI) / 180;
    const cx1 = Math.cos(radC1) * (R * 0.8);
    const cy1 = Math.sin(radC1) * (R * 0.8);
    const cx2 = Math.cos(radC2) * (R * 0.8);
    const cy2 = Math.sin(radC2) * (R * 0.8);
    out += `  <path d="M 0,0 Q ${round(cx1)},${round(cy1)} ${round(x2)},${round(y2)} Q ${round(cx2)},${round(cy2)} 0,0" stroke-width="0.7" />\n`;
  }
  out += `</g>\n`;
  return out;
}

// Master Security Frame
function generateSecurityFrame(title, primaryColor, secondaryColor, microtextTop, microtextBottom) {
  return `
  <!-- Full-Page Banknote Security Border -->
  <g fill="none" stroke="${primaryColor}">
    <rect x="22" y="22" width="856" height="1356" rx="4" stroke-width="2.5" opacity="0.85" />
    <rect x="30" y="30" width="840" height="1340" rx="2" stroke-width="1" stroke-dasharray="6 3" stroke="${secondaryColor}" opacity="0.7" />
    <rect x="40" y="40" width="820" height="1320" stroke-width="0.8" opacity="0.5" />

    <!-- Corner Alignment Crosshairs -->
    <path d="M14,44 L14,14 L44,14" stroke-width="2.8" opacity="0.9" />
    <path d="M886,44 L886,14 L856,14" stroke-width="2.8" opacity="0.9" />
    <path d="M14,1356 L14,1386 L44,1386" stroke-width="2.8" opacity="0.9" />
    <path d="M886,1356 L886,1386 L856,1386" stroke-width="2.8" opacity="0.9" />

    <!-- Side Calibration Marks -->
    <g opacity="0.5" stroke-width="1">
      <line x1="18" y1="350" x2="26" y2="350" />
      <line x1="16" y1="700" x2="30" y2="700" stroke-width="2" />
      <line x1="18" y1="1050" x2="26" y2="1050" />
      <line x1="874" y1="350" x2="882" y2="350" />
      <line x1="870" y1="700" x2="884" y2="700" stroke-width="2" />
      <line x1="874" y1="1050" x2="882" y2="1050" />
      <line x1="225" y1="18" x2="225" y2="26" />
      <line x1="450" y1="14" x2="450" y2="30" stroke-width="2" />
      <line x1="675" y1="18" x2="675" y2="26" />
      <line x1="225" y1="1374" x2="225" y2="1382" />
      <line x1="450" y1="1370" x2="450" y2="1386" stroke-width="2" />
      <line x1="675" y1="1374" x2="675" y2="1382" />
    </g>

    <!-- Top & Bottom Micro-Text Security Banners -->
    <text x="450" y="21" font-family="'Courier New', Courier, monospace" font-size="8" font-weight="900" letter-spacing="3" text-anchor="middle" fill="${primaryColor}" stroke="none" opacity="0.95">${microtextTop}</text>
    <text x="450" y="1379" font-family="'Courier New', Courier, monospace" font-size="7.5" font-weight="700" letter-spacing="2.5" text-anchor="middle" fill="${primaryColor}" stroke="none" opacity="0.9">${microtextBottom}</text>
  </g>

  <!-- 4 Corner Security Banknote Rosettes -->
  ${generateRosette(75, 75, 34, 16, primaryColor, 0.75)}
  ${generateRosette(825, 75, 34, 16, primaryColor, 0.75)}
  ${generateRosette(75, 1325, 34, 16, primaryColor, 0.75)}
  ${generateRosette(825, 1325, 34, 16, primaryColor, 0.75)}
  `;
}

// Configuration of the 12 watermarks
const WATERMARK_CONFIGS = [
  // 1. Cloud Atlas (Aviation)
  {
    filename: 'cloud-atlas.svg',
    title: 'Cloud Atlas',
    category: 'Aviation',
    sourceImage: 'public/images/photo_aviation_cargo_aircraft.jpg',
    primaryColor: '#0284c7',
    secondaryColor: '#38bdf8',
    microtextTop: '★ SKY ARIANA LOGISTICS · CLOUD ATLAS · HIGH ALTITUDE ATMOSPHERIC CORRIDOR ★',
    microtextBottom: '★ INTERNATIONAL AIR FREIGHT WAYBILL SECURITY · STRATOSPHERIC TRANSIT PASS ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(480, 24, 3, 10, 6, 6, 5, '#0284c7', 0.4)}
      ${generateGuillocheBand(920, 22, 4, 12, 7, 6, 5, '#0369a1', 0.35)}
      <!-- Flight Altimeter Graticule -->
      <g stroke="#0284c7" stroke-width="0.8" opacity="0.4" stroke-dasharray="6 4">
        <line x1="120" y1="300" x2="780" y2="300" />
        <line x1="120" y1="700" x2="780" y2="700" stroke-width="1.2" stroke-dasharray="none" />
        <line x1="120" y1="1100" x2="780" y2="1100" />
      </g>
    `,
  },
  // 2. Flight Corridor (Aviation)
  {
    filename: 'flight-corridor.svg',
    title: 'Flight Corridor',
    category: 'Aviation',
    sourceImage: 'public/images/photo_cargo_freighter_jet.jpg',
    primaryColor: '#1e3a8a',
    secondaryColor: '#0284c7',
    microtextTop: '★ SKY ARIANA LOGISTICS · FLIGHT CORRIDOR · INTERCONTINENTAL AIR TRANSIT ★',
    microtextBottom: '★ AUTHENTIC AIR CARGO MANIFEST · FLIGHT CORRIDOR SECURITY SEAL ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(400, 26, 4, 12, 8, 7, 5, '#1e3a8a', 0.45)}
      ${generateGuillocheBand(1000, 26, 4, 12, 8, 7, 5, '#0284c7', 0.4)}
      <!-- Navigation Waypoint Reticle -->
      <g transform="translate(450, 700)" stroke="#1e3a8a" fill="none" opacity="0.45">
        <circle cx="0" cy="0" r="260" stroke-width="1.4" stroke-dasharray="8 4" />
        <circle cx="0" cy="0" r="180" stroke-width="1" />
        <circle cx="0" cy="0" r="80" stroke-width="1.2" />
        <line x1="-280" y1="0" x2="280" y2="0" stroke-width="1.2" />
        <line x1="0" y1="-280" x2="0" y2="280" stroke-width="1.2" />
      </g>
    `,
  },
  // 3. Sky Express (Aviation)
  {
    filename: 'sky-express.svg',
    title: 'Sky Express',
    category: 'Aviation',
    sourceImage: 'public/images/sky_freight_cargo_plane.jpg',
    primaryColor: '#0369a1',
    secondaryColor: '#d97706',
    microtextTop: '★ SKY ARIANA LOGISTICS · SKY EXPRESS · EXPEDITED GLOBAL DISPATCH ★',
    microtextBottom: '★ PRIORITY AIR WAYBILL VERIFICATION · EXPRESS GLOBAL TRANSIT CORRIDOR ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(420, 28, 5, 14, 9, 6, 5, '#0369a1', 0.4)}
      ${generateGuillocheBand(980, 25, 4, 10, 6, 6, 5, '#d97706', 0.35)}
      <!-- Aerodynamic Speed Vectors -->
      <g stroke="#0369a1" stroke-width="1.2" opacity="0.45">
        <line x1="160" y1="250" x2="740" y2="250" stroke-dasharray="12 6" />
        <line x1="200" y1="270" x2="700" y2="270" stroke-dasharray="8 4" />
        <line x1="160" y1="1130" x2="740" y2="1130" stroke-dasharray="12 6" />
        <line x1="200" y1="1150" x2="700" y2="1150" stroke-dasharray="8 4" />
      </g>
    `,
  },
  // 4. Dawn Departure (Aviation)
  {
    filename: 'dawn-departure.svg',
    title: 'Dawn Departure',
    category: 'Aviation',
    sourceImage: 'public/images/air_cargo_jet.jpg',
    primaryColor: '#d97706',
    secondaryColor: '#1e293b',
    microtextTop: '★ SKY ARIANA LOGISTICS · DAWN DEPARTURE · SUNRISE AIR CARGO OPERATIONS ★',
    microtextBottom: '★ FIRST-DEPARTURE AIR FREIGHT DISPATCH · VERIFIED CARGO MANIFEST ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(450, 24, 3, 10, 6, 6, 5, '#d97706', 0.45)}
      ${generateGuillocheBand(950, 22, 4, 12, 7, 6, 5, '#1e293b', 0.35)}
      <!-- Runway Approach Lighting Vectors -->
      <g stroke="#d97706" opacity="0.5">
        <line x1="450" y1="600" x2="260" y2="1280" stroke-width="2.2" />
        <line x1="450" y1="600" x2="640" y2="1280" stroke-width="2.2" />
        <line x1="450" y1="600" x2="450" y2="1280" stroke-width="1.5" stroke-dasharray="16 8" />
      </g>
    `,
  },
  // 5. Air Bridge (Aviation)
  {
    filename: 'air-bridge.svg',
    title: 'Air Bridge',
    category: 'Aviation',
    sourceImage: 'public/images/photo_aviation_cargo_aircraft.jpg',
    primaryColor: '#0891b2',
    secondaryColor: '#1e3a8a',
    microtextTop: '★ SKY ARIANA LOGISTICS · AIR BRIDGE · TRANS-CONTINENTAL FLIGHT CORRIDOR ★',
    microtextBottom: '★ STRATEGIC AIR BRIDGE FREIGHT NETWORK · INTER-REGIONAL LOGISTICS ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(380, 26, 4, 12, 8, 6, 5, '#0891b2', 0.45)}
      ${generateGuillocheBand(1020, 24, 3, 11, 7, 6, 5, '#1e3a8a', 0.4)}
      <!-- Great-Circle Bridge Arc -->
      <path d="M 120,720 Q 450,420 780,720" fill="none" stroke="#0891b2" stroke-width="2.5" opacity="0.55" />
      <path d="M 140,740 Q 450,450 760,740" fill="none" stroke="#1e3a8a" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.45" />
    `,
  },
  // 6. Above the Clouds (Aviation)
  {
    filename: 'above-the-clouds.svg',
    title: 'Above the Clouds',
    category: 'Aviation',
    sourceImage: 'public/images/photo_hindu_kush_peaks.jpg',
    primaryColor: '#0284c7',
    secondaryColor: '#334155',
    microtextTop: '★ SKY ARIANA LOGISTICS · ABOVE THE CLOUDS · STRATOSPHERIC TRANSIT PASS ★',
    microtextBottom: '★ TRANS-HIMALAYAN & HINDU KUSH AIR CORRIDOR · MOUNTAIN TRANSIT OVERFLIGHT ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(460, 25, 4, 11, 7, 6, 5, '#0284c7', 0.4)}
      ${generateGuillocheBand(940, 25, 4, 11, 7, 6, 5, '#334155', 0.35)}
      <!-- Cloud Isobar Lines -->
      <g stroke="#0284c7" stroke-width="1.2" fill="none" opacity="0.45">
        <ellipse cx="450" cy="700" rx="320" ry="160" stroke-dasharray="8 4" />
        <ellipse cx="450" cy="700" rx="220" ry="110" />
      </g>
    `,
  },
  // 7. Global Flight (Aviation)
  {
    filename: 'global-flight.svg',
    title: 'Global Flight',
    category: 'Aviation',
    sourceImage: 'public/images/document-backgrounds/global-flight-premium.png',
    primaryColor: '#1e3a8a',
    secondaryColor: '#ca8a04',
    microtextTop: '★ SKY ARIANA LOGISTICS · GLOBAL FLIGHT · INTERNATIONAL MULTI-MODAL LOGISTICS ★',
    microtextBottom: '★ WORLDWIDE AIR FREIGHT NETWORK · OFFICIAL CARGO SECURITY EMBLEM ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(350, 24, 3, 10, 6, 6, 5, '#1e3a8a', 0.45)}
      ${generateGuillocheBand(1050, 24, 3, 10, 6, 6, 5, '#ca8a04', 0.4)}
      <!-- Global Flight Reticle -->
      <g transform="translate(450, 700)" stroke="#ca8a04" fill="none" opacity="0.45">
        <circle cx="0" cy="0" r="320" stroke-width="1.5" stroke-dasharray="6 4" />
        <circle cx="0" cy="0" r="240" stroke-width="1" />
        <line x1="-340" y1="0" x2="340" y2="0" stroke-width="1.2" />
        <line x1="0" y1="-340" x2="0" y2="340" stroke-width="1.2" />
      </g>
    `,
  },
  // 8. Evening Arrival (Aviation)
  {
    filename: 'evening-arrival.svg',
    title: 'Evening Arrival',
    category: 'Aviation',
    sourceImage: 'public/images/photo_airport_cargo_night.jpg',
    primaryColor: '#1e1b4b',
    secondaryColor: '#f59e0b',
    microtextTop: '★ SKY ARIANA LOGISTICS · EVENING ARRIVAL · NIGHT CARGO RAMP TERMINAL ★',
    microtextBottom: '★ AIRPORT CARGO APRON OPERATIONS · AUTHENTIC TRANSIT VERIFICATION ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(440, 24, 4, 12, 7, 6, 5, '#1e1b4b', 0.45)}
      ${generateGuillocheBand(960, 22, 3, 10, 6, 6, 5, '#f59e0b', 0.4)}
      <!-- Night Runway ILS Light Rays -->
      <g stroke="#f59e0b" opacity="0.5">
        <line x1="450" y1="580" x2="220" y2="1300" stroke-width="2.5" />
        <line x1="450" y1="580" x2="680" y2="1300" stroke-width="2.5" />
        <line x1="450" y1="580" x2="450" y2="1300" stroke-width="1.5" stroke-dasharray="14 6" />
      </g>
    `,
  },
  // 9. Compass Lines (Geometric)
  {
    filename: 'compass-lines.svg',
    title: 'Compass Lines',
    category: 'Geometric',
    sourceImage: 'public/images/photo_golden_compass_rose.jpg',
    primaryColor: '#b45309',
    secondaryColor: '#1e3a8a',
    microtextTop: '★ SKY ARIANA LOGISTICS · COMPASS LINES · GEOMETRIC TRANSIT MATRIX ★',
    microtextBottom: '★ 360-DEGREE GEODESIC CALIBRATION · MULTI-MODAL NAVIGATION CHART ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(360, 26, 4, 12, 8, 6, 5, '#b45309', 0.45)}
      ${generateGuillocheBand(1040, 26, 4, 12, 8, 6, 5, '#1e3a8a', 0.45)}
      <!-- Compass Degree Dial -->
      <g transform="translate(450, 700)" stroke="#1e3a8a" fill="none" opacity="0.5">
        <circle cx="0" cy="0" r="300" stroke-width="1.8" />
        <circle cx="0" cy="0" r="270" stroke-width="1" stroke-dasharray="4 4" />
        <circle cx="0" cy="0" r="140" stroke-width="1.2" />
        <line x1="-320" y1="0" x2="320" y2="0" stroke-width="1.5" />
        <line x1="0" y1="-320" x2="0" y2="320" stroke-width="1.5" />
        <line x1="-226" y1="-226" x2="226" y2="226" stroke-width="1" stroke-dasharray="6 3" />
        <line x1="-226" y1="226" x2="226" y2="-226" stroke-width="1" stroke-dasharray="6 3" />
      </g>
    `,
  },
  // 10. Contour Map (Geometric)
  {
    filename: 'contour-map.svg',
    title: 'Contour Map',
    category: 'Geometric',
    sourceImage: 'public/images/photo_hindu_kush_peaks.jpg',
    primaryColor: '#047857',
    secondaryColor: '#1e293b',
    microtextTop: '★ SKY ARIANA LOGISTICS · CONTOUR MAP · TOPOGRAPHIC TRANSIT ELEVATION ★',
    microtextBottom: '★ TOPOGRAPHIC ELEVATION CONTOURS · HIGHWAY & MOUNTAIN PASS RELIEF ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(400, 25, 4, 12, 7, 6, 5, '#047857', 0.45)}
      ${generateGuillocheBand(1000, 25, 4, 12, 7, 6, 5, '#1e293b', 0.4)}
      <!-- Elevation Iso-Lines -->
      <g fill="none" stroke="#047857" opacity="0.45">
        <path d="M 120,620 Q 300,560 450,600 T 780,580" stroke-width="1.6" />
        <path d="M 120,660 Q 320,610 450,640 T 780,620" stroke-width="1.2" stroke-dasharray="6 4" />
        <path d="M 120,740 Q 300,780 450,750 T 780,770" stroke-width="1.6" />
        <path d="M 120,780 Q 320,830 450,800 T 780,820" stroke-width="1.2" stroke-dasharray="6 4" />
      </g>
    `,
  },
  // 11. Trade Network (Geometric)
  {
    filename: 'trade-network.svg',
    title: 'Trade Network',
    category: 'Geometric',
    sourceImage: 'public/images/photo_border_customs_terminal.jpg',
    primaryColor: '#0369a1',
    secondaryColor: '#b45309',
    microtextTop: '★ SKY ARIANA LOGISTICS · TRADE NETWORK · REGIONAL CUSTOMS & COMMERCE HUB ★',
    microtextBottom: '★ INTERMODAL CROSS-BORDER LOGISTICS · FREIGHT FORWARDING TERMINALS ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(420, 26, 4, 12, 8, 6, 5, '#0369a1', 0.45)}
      ${generateGuillocheBand(980, 26, 4, 12, 8, 6, 5, '#b45309', 0.4)}
      <!-- Trade Grid Nodes -->
      <g transform="translate(450, 700)" stroke="#0369a1" fill="none" opacity="0.45">
        <circle cx="0" cy="0" r="280" stroke-width="1.5" stroke-dasharray="6 4" />
        <circle cx="0" cy="0" r="190" stroke-width="1.2" />
        <circle cx="0" cy="0" r="100" stroke-width="1.4" />
        <circle cx="-160" cy="-90" r="12" fill="#0369a1" opacity="0.6" />
        <circle cx="160" cy="-90" r="12" fill="#0369a1" opacity="0.6" />
        <circle cx="-160" cy="90" r="12" fill="#0369a1" opacity="0.6" />
        <circle cx="160" cy="90" r="12" fill="#0369a1" opacity="0.6" />
        <line x1="-160" y1="-90" x2="160" y2="90" stroke-width="1.2" />
        <line x1="-160" y1="90" x2="160" y2="-90" stroke-width="1.2" />
      </g>
    `,
  },
  // 12. Meridian Grid (Geometric)
  {
    filename: 'meridian-grid.svg',
    title: 'Meridian Grid',
    category: 'Geometric',
    sourceImage: 'public/images/photo_banknote_security_crest.jpg',
    primaryColor: '#065f46',
    secondaryColor: '#ca8a04',
    microtextTop: '★ SKY ARIANA LOGISTICS · MERIDIAN GRID · GLOBAL GEOMETRIC COORDINATES ★',
    microtextBottom: '★ BANKNOTE SECURITY ENGRAVING · GEODETIC REFERENCE MERIDIAN SYSTEM ★',
    generateCustomOverlay: () => `
      ${generateGuillocheBand(380, 28, 5, 14, 9, 6, 5, '#065f46', 0.45)}
      ${generateGuillocheBand(1020, 28, 5, 14, 9, 6, 5, '#ca8a04', 0.45)}
      <!-- Spherical Meridian Coordinate Grid -->
      <g transform="translate(450, 700)" stroke="#065f46" fill="none" opacity="0.5">
        <circle cx="0" cy="0" r="300" stroke-width="2" />
        <ellipse cx="0" cy="0" rx="300" ry="120" stroke-width="1.2" />
        <ellipse cx="0" cy="0" rx="300" ry="210" stroke-width="1.2" stroke-dasharray="6 3" />
        <ellipse cx="0" cy="0" rx="120" ry="300" stroke-width="1.2" />
        <ellipse cx="0" cy="0" rx="210" ry="300" stroke-width="1.2" stroke-dasharray="6 3" />
        <line x1="-320" y1="0" x2="320" y2="0" stroke-width="1.8" />
        <line x1="0" y1="-320" x2="0" y2="320" stroke-width="1.8" />
      </g>
    `,
  },
];

async function generateAll() {
  console.log(`Starting generation of 12 High-Definition Security Watermarks...`);
  
  for (const config of WATERMARK_CONFIGS) {
    const srcPath = path.join(rootDir, config.sourceImage);
    if (!fs.existsSync(srcPath)) {
      console.error(`[ERROR] Missing source image: ${srcPath}`);
      continue;
    }

    // Process & compress photographic background to 900x1400 high-clarity portrait JPEG
    const isPng = config.sourceImage.endsWith('.png');
    let jpegBuffer;
    if (isPng) {
      jpegBuffer = await sharp(srcPath)
        .resize(900, 1400, { fit: 'cover', position: 'center' })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 84 })
        .toBuffer();
    } else {
      jpegBuffer = await sharp(srcPath)
        .resize(900, 1400, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 84 })
        .toBuffer();
    }

    const b64 = jpegBuffer.toString('base64');
    const customOverlay = config.generateCustomOverlay();
    const securityFrame = generateSecurityFrame(
      config.title,
      config.primaryColor,
      config.secondaryColor,
      config.microtextTop,
      config.microtextBottom
    );

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 900 1400" width="100%" height="100%">
  <title>${config.title} — Sky Ariana Logistics Security Watermark</title>
  <defs>
    <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- Paper Softening & Luminance Gradients -->
    <linearGradient id="paper-vignette" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" />
      <stop offset="30%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.36" />
    </linearGradient>
    <radialGradient id="center-fade" cx="50%" cy="50%" r="50%">
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.0" />
      <stop offset="85%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.52" />
    </radialGradient>
  </defs>

  <!-- 1. Authentic High-Definition Photographic Base Artwork -->
  <image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="900" height="1400" preserveAspectRatio="xMidYMid slice" opacity="0.94" />

  <!-- 2. Paper Luminance Balancing Layers -->
  <rect width="900" height="1400" fill="url(#paper-vignette)" />
  <rect width="900" height="1400" fill="url(#center-fade)" />

  <!-- 3. Mathematical Guilloche & Vector Security Accents -->
  ${customOverlay}

  <!-- 4. Banknote Security Framing, Corner Rosettes & Microtext Banners -->
  ${securityFrame}
</svg>`;

    // Write to primary public/images/document-backgrounds
    const p1 = path.join(primaryTarget, config.filename);
    fs.writeFileSync(p1, svgContent, 'utf8');

    // Write to release/win-unpacked if exists
    if (fs.existsSync(path.dirname(unpackedTarget))) {
      fs.mkdirSync(unpackedTarget, { recursive: true });
      fs.writeFileSync(path.join(unpackedTarget, config.filename), svgContent, 'utf8');
    }

    // Write to .next-production if exists
    if (fs.existsSync(path.dirname(standaloneTarget))) {
      fs.mkdirSync(standaloneTarget, { recursive: true });
      fs.writeFileSync(path.join(standaloneTarget, config.filename), svgContent, 'utf8');
    }

    const stat = fs.statSync(p1);
    console.log(`✓ Generated ${config.filename} (${config.title}) — ${(stat.size / 1024).toFixed(1)} KB`);
  }

  console.log(`\nAll 12 high-definition security watermarks successfully generated!`);
}

generateAll().catch(err => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
