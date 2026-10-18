/**
 * Master Security Watermark Artwork Generator for Sky Ariana BOL
 * Generates all 40 high-resolution, full-bleed portrait vector document backgrounds
 * with authentic banknote guilloche engraving, topographic relief, and rich security framing.
 */
const fs = require('node:fs');
const path = require('node:path');

const targetDir = path.resolve(__dirname, '..', 'public', 'images', 'document-backgrounds');
fs.mkdirSync(targetDir, { recursive: true });

function round(n, d = 1) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// -------------------------------------------------------------
// Core Mathematical Curve & Security Pattern Generators
// -------------------------------------------------------------

function generateGuillocheBand(yCenter, amp1, freq1, amp2, freq2, lines = 12, spacing = 5, color = '#1e3a8a', opacity = 0.35) {
  let out = `<g fill="none" stroke="${color}" opacity="${opacity}">\n`;
  for (let l = 0; l < lines; l++) {
    const offset = (l - lines / 2) * spacing;
    const strokeW = l % 3 === 0 ? 1.2 : 0.6;
    let d = '';
    for (let x = 30; x <= 870; x += 15) {
      const rad1 = (x / 900) * Math.PI * 2 * freq1;
      const rad2 = (x / 900) * Math.PI * 2 * freq2 + (l * 0.2);
      const y = yCenter + offset + Math.sin(rad1) * amp1 + Math.cos(rad2) * amp2;
      d += (x === 30 ? `M ${x},${round(y)}` : ` L ${x},${round(y)}`);
    }
    out += `  <path d="${d}" stroke-width="${strokeW}" />\n`;
  }
  out += `</g>\n`;
  return out;
}

function generateRosette(cx, cy, R, petals = 16, color = '#1e3a8a', opacity = 0.5) {
  let out = `<g transform="translate(${cx},${cy})" fill="none" stroke="${color}" opacity="${opacity}">\n`;
  out += `  <circle cx="0" cy="0" r="${R}" stroke-width="1.2" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.88}" stroke-width="0.7" stroke-dasharray="3 3" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.4}" stroke-width="0.8" />\n`;
  out += `  <circle cx="0" cy="0" r="${R * 0.1}" fill="${color}" />\n`;
  
  for (let i = 0; i < petals; i++) {
    const angle = (i * 360) / petals;
    const rad = (angle * Math.PI) / 180;
    const x1 = Math.cos(rad) * (R * 0.4);
    const y1 = Math.sin(rad) * (R * 0.4);
    const x2 = Math.cos(rad) * (R * 0.95);
    const y2 = Math.sin(rad) * (R * 0.95);
    out += `  <line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke-width="0.8" />\n`;
    
    // Petal loop
    const ctrlAngle1 = angle - 180 / petals;
    const ctrlAngle2 = angle + 180 / petals;
    const radC1 = (ctrlAngle1 * Math.PI) / 180;
    const radC2 = (ctrlAngle2 * Math.PI) / 180;
    const cx1 = Math.cos(radC1) * (R * 0.8);
    const cy1 = Math.sin(radC1) * (R * 0.8);
    const cx2 = Math.cos(radC2) * (R * 0.8);
    const cy2 = Math.sin(radC2) * (R * 0.8);
    out += `  <path d="M 0,0 Q ${round(cx1)},${round(cy1)} ${round(x2)},${round(y2)} Q ${round(cx2)},${round(cy2)} 0,0" stroke-width="0.6" />\n`;
  }
  out += `</g>\n`;
  return out;
}

function generateSunburst(cx, cy, innerR, outerR, rays = 36, color = '#f59e0b', opacity = 0.4) {
  let out = `<g transform="translate(${cx},${cy})" fill="none" stroke="${color}" opacity="${opacity}">\n`;
  for (let i = 0; i < rays; i++) {
    const angle = (i * 360) / rays;
    const rad = (angle * Math.PI) / 180;
    const x1 = Math.cos(rad) * innerR;
    const y1 = Math.sin(rad) * innerR;
    const x2 = Math.cos(rad) * outerR;
    const y2 = Math.sin(rad) * outerR;
    const strokeW = i % 4 === 0 ? 1.8 : i % 2 === 0 ? 1.1 : 0.6;
    out += `  <line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke-width="${strokeW}" />\n`;
  }
  out += `</g>\n`;
  return out;
}

function generateTopographicContours(yStart, yEnd, count = 8, color = '#1e3a8a', opacity = 0.35) {
  let out = `<g fill="none" stroke="${color}" opacity="${opacity}">\n`;
  const step = (yEnd - yStart) / count;
  for (let i = 0; i < count; i++) {
    const yBase = yStart + i * step;
    const elev = Math.round(5200 - (i * 380));
    const strokeW = i % 3 === 0 ? 1.5 : 0.8;
    let d = '';
    for (let x = 40; x <= 860; x += 30) {
      const wobble = Math.sin((x / 860) * Math.PI * 3 + i) * 22 + Math.cos((x / 860) * Math.PI * 5 + i * 2) * 14;
      const y = yBase + wobble;
      d += (x === 40 ? `M ${x},${round(y)}` : ` L ${x},${round(y)}`);
    }
    out += `  <path d="${d}" stroke-width="${strokeW}" />\n`;
    if (i % 2 === 0) {
      out += `  <text x="75" y="${round(yBase - 4)}" font-family="monospace" font-size="7.5" font-weight="bold" fill="${color}" stroke="none">${elev} M</text>\n`;
    }
  }
  out += `</g>\n`;
  return out;
}

function buildSecurityFrame(primaryColor = '#1e3a8a', secondaryColor = '#0284c7', titleText = 'OFFICIAL MULTI-MODAL LOGISTICS SECURITY DOCUMENT') {
  return `
  <!-- Full-Page Banknote Security Border -->
  <g fill="none" stroke="${primaryColor}">
    <rect x="24" y="24" width="852" height="1352" rx="4" stroke-width="2.2" opacity="0.8" />
    <rect x="32" y="32" width="836" height="1336" rx="2" stroke-width="0.8" stroke-dasharray="6 3" stroke="${secondaryColor}" opacity="0.6" />
    <rect x="42" y="42" width="816" height="1316" stroke-width="0.6" opacity="0.4" />

    <!-- Corner Alignment Crosshairs -->
    <path d="M16,40 L16,16 L40,16" stroke-width="2.5" opacity="0.85" />
    <path d="M884,40 L884,16 L860,16" stroke-width="2.5" opacity="0.85" />
    <path d="M16,1360 L16,1384 L40,1384" stroke-width="2.5" opacity="0.85" />
    <path d="M884,1360 L884,1384 L860,1384" stroke-width="2.5" opacity="0.85" />

    <!-- Top & Bottom Micro-Text Security Banners -->
    <text x="450" y="20" font-family="Arial, sans-serif" font-size="7.5" font-weight="bold" letter-spacing="4" text-anchor="middle" fill="${primaryColor}" stroke="none" opacity="0.85">★ SKY ARIANA LOGISTICS · ${titleText} ★</text>
    <text x="450" y="1390" font-family="Arial, sans-serif" font-size="7.5" font-weight="bold" letter-spacing="4" text-anchor="middle" fill="${primaryColor}" stroke="none" opacity="0.85">★ AUTHENTIC SECURE CARGO WAYBILL · VERIFIED INTERNATIONAL TRANSIT NETWORK ★</text>

    <!-- Side Margin Degree & Metric Ticks -->
    <g opacity="0.45" stroke-width="0.8">
      <line x1="20" y1="350" x2="28" y2="350" /><line x1="20" y1="700" x2="32" y2="700" stroke-width="1.6" /><line x1="20" y1="1050" x2="28" y2="1050" />
      <line x1="872" y1="350" x2="880" y2="350" /><line x1="868" y1="700" x2="880" y2="700" stroke-width="1.6" /><line x1="872" y1="1050" x2="880" y2="1050" />
      <line x1="225" y1="20" x2="225" y2="28" /><line x1="450" y1="16" x2="450" y2="32" stroke-width="1.6" /><line x1="675" y1="20" x2="675" y2="28" />
      <line x1="225" y1="1372" x2="225" y2="1380" /><line x1="450" y1="1368" x2="450" y2="1384" stroke-width="1.6" /><line x1="675" y1="1372" x2="675" y2="1380" />
    </g>
  </g>

  <!-- 4 Corner Security Banknote Rosettes -->
  ${generateRosette(75, 75, 34, 16, primaryColor, 0.65)}
  ${generateRosette(825, 75, 34, 16, primaryColor, 0.65)}
  ${generateRosette(75, 1325, 34, 16, primaryColor, 0.65)}
  ${generateRosette(825, 1325, 34, 16, primaryColor, 0.65)}
  `;
}

function wrapSvg(title, defs, bodyContent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1400" width="100%" height="100%">
  <title>${title} — Sky Ariana Logistics Security Watermark</title>
  <defs>
    <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    ${defs}
  </defs>
  ${bodyContent}
</svg>`;
}

module.exports = {
  targetDir,
  round,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  generateTopographicContours,
  buildSecurityFrame,
  wrapSvg,
};
