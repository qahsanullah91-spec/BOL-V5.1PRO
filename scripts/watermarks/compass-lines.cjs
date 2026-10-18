const { wrapDocumentSvg } = require('./common.cjs');

function generateCompassLines() {
  const navy = '#1e3a8a';
  const bronze = '#b45309';
  const amber = '#d97706';
  const slate = '#0f172a';

  let art = `<g transform="translate(450, 700)">`;

  // Concentric calibrated degree rings
  const rings = [390, 360, 340, 310, 260, 210, 160, 110, 70];
  rings.forEach((r, idx) => {
    const isMajor = idx % 2 === 0;
    art += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${isMajor ? navy : bronze}" stroke-width="${isMajor ? '2.4' : '1.4'}" stroke-dasharray="${idx === 2 ? '4 3' : idx === 4 ? '8 4' : 'none'}" opacity="${isMajor ? '0.85' : '0.6'}" />`;
  });

  // 360-Degree Calibrated Outer Dial Ticks
  art += `<g stroke="${navy}" opacity="0.75">`;
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const is10 = deg % 10 === 0;
    const is30 = deg % 30 === 0;
    const len = is30 ? 24 : is10 ? 16 : 8;
    const rOuter = 390;
    const rInner = rOuter - len;
    const x1 = rOuter * Math.cos(rad);
    const y1 = rOuter * Math.sin(rad);
    const x2 = rInner * Math.cos(rad);
    const y2 = rInner * Math.sin(rad);
    art += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${is30 ? '2.2' : is10 ? '1.5' : '0.8'}" />`;

    // Numerical degree marks every 30 deg
    if (is30) {
      const textR = 352;
      const tx = textR * Math.cos(rad);
      const ty = textR * Math.sin(rad) + 4;
      art += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="Courier, monospace" font-size="9" font-weight="900" fill="${navy}" text-anchor="middle">${deg}°</text>`;
    }
  }
  art += `</g>`;

  // Helper for faceted 2-tone star points
  function renderFacetedPoint(angleDeg, length, baseWidth, colorLeft, colorRight, opacity = 0.95) {
    const rad = (angleDeg * Math.PI) / 180;
    const tipX = length * Math.cos(rad);
    const tipY = length * Math.sin(rad);

    const radLeft = rad - Math.PI / 2;
    const radRight = rad + Math.PI / 2;

    const bLX = (baseWidth / 2) * Math.cos(radLeft);
    const bLY = (baseWidth / 2) * Math.sin(radLeft);
    const bRX = (baseWidth / 2) * Math.cos(radRight);
    const bRY = (baseWidth / 2) * Math.sin(radRight);

    // Left facet
    const leftPoly = `0,0 ${bLX.toFixed(1)},${bLY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`;
    // Right facet
    const rightPoly = `0,0 ${tipX.toFixed(1)},${tipY.toFixed(1)} ${bRX.toFixed(1)},${bRY.toFixed(1)}`;

    return `
      <polygon points="${leftPoly}" fill="${colorLeft}" opacity="${opacity}" stroke="${slate}" stroke-width="0.8" />
      <polygon points="${rightPoly}" fill="${colorRight}" opacity="${opacity}" stroke="${slate}" stroke-width="0.8" />
    `;
  }

  // 16 Quarter-winds (r = 160)
  for (let i = 0; i < 16; i++) {
    const deg = i * 22.5 + 11.25;
    art += renderFacetedPoint(deg, 170, 18, bronze, amber, 0.7);
  }

  // 8 Half-winds (r = 220)
  for (let i = 0; i < 8; i++) {
    const deg = i * 45 + 22.5;
    art += renderFacetedPoint(deg, 230, 26, amber, bronze, 0.85);
  }

  // 4 Ordinal Points (NE, SE, SW, NW - r = 290)
  for (let i = 0; i < 4; i++) {
    const deg = i * 90 + 45;
    art += renderFacetedPoint(deg, 290, 36, navy, '#2563eb', 0.92);
  }

  // 4 Major Cardinal Points (N, E, S, W - r = 360)
  art += renderFacetedPoint(270, 360, 48, navy, bronze, 0.98); // N
  art += renderFacetedPoint(0, 360, 48, navy, bronze, 0.98);   // E
  art += renderFacetedPoint(90, 360, 48, navy, bronze, 0.98);  // S
  art += renderFacetedPoint(180, 360, 48, navy, bronze, 0.98); // W

  // North Fleur-de-lis Spearhead Ornament atop North Tip (y = -360)
  art += `
    <g transform="translate(0, -360)">
      <path d="M0,-35 C-12,-18 -18,-5 0,0 C18,-5 12,-18 0,-35 Z" fill="${bronze}" stroke="${navy}" stroke-width="1.8" />
      <path d="M-5,-10 C-22,-22 -32,-8 -12,4 C-5,5 -2,2 -4,-4 Z" fill="${amber}" stroke="${navy}" stroke-width="1.4" />
      <path d="M5,-10 C22,-22 32,-8 12,4 C5,5 2,2 4,-4 Z" fill="${amber}" stroke="${navy}" stroke-width="1.4" />
      <rect x="-14" y="0" width="28" height="4" rx="2" fill="${navy}" />
      <circle cx="0" cy="-38" r="4" fill="${bronze}" stroke="${navy}" stroke-width="1.2" />
    </g>
  `;

  // Central Lathe Medallion with Silk Road Coordinates
  art += `
    <circle cx="0" cy="0" r="75" fill="#ffffff" fill-opacity="0.95" stroke="${navy}" stroke-width="3.5" />
    <circle cx="0" cy="0" r="66" fill="none" stroke="${bronze}" stroke-width="1.8" stroke-dasharray="4 2" />
    <circle cx="0" cy="0" r="54" fill="${navy}" fill-opacity="0.2" stroke="${navy}" stroke-width="2" />
    <circle cx="0" cy="0" r="32" fill="${bronze}" fill-opacity="0.25" stroke="${bronze}" stroke-width="1.6" />
    <circle cx="0" cy="0" r="14" fill="${navy}" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="0" cy="0" r="4" fill="#ffffff" />
  `;

  // Cardinal Initials (N, E, S, W)
  art += `
    <text x="0" y="-305" font-family="Georgia, serif" font-size="28" font-weight="900" fill="${navy}" text-anchor="middle">N</text>
    <text x="315" y="10" font-family="Georgia, serif" font-size="26" font-weight="900" fill="${navy}" text-anchor="middle">E</text>
    <text x="0" y="325" font-family="Georgia, serif" font-size="26" font-weight="900" fill="${navy}" text-anchor="middle">S</text>
    <text x="-315" y="10" font-family="Georgia, serif" font-size="26" font-weight="900" fill="${navy}" text-anchor="middle">W</text>

    <!-- Ordinal Labels -->
    <text x="215" y="-195" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bronze}">NE</text>
    <text x="215" y="225" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bronze}">SE</text>
    <text x="-240" y="225" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bronze}">SW</text>
    <text x="-240" y="-195" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${bronze}">NW</text>

    <!-- Kabul Logistics Coordinates in Center Medallion -->
    <text x="0" y="-18" font-family="Courier, monospace" font-size="6.5" font-weight="900" fill="${navy}" text-anchor="middle" letter-spacing="1">LAT 34°31'31" N</text>
    <text x="0" y="24" font-family="Courier, monospace" font-size="6.5" font-weight="900" fill="${navy}" text-anchor="middle" letter-spacing="1">LON 69°10'42" E</text>
  </g>`;

  // 16 Full-Sheet Rhumb Lines traversing corner-to-corner across entire sheet
  art += `<g stroke="${bronze}" stroke-width="1.2" opacity="0.38" stroke-dasharray="8 6">`;
  const rhumbAngles = [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5];
  rhumbAngles.forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x1 = 450 - 900 * Math.cos(rad);
    const y1 = 700 - 900 * Math.sin(rad);
    const x2 = 450 + 900 * Math.cos(rad);
    const y2 = 700 + 900 * Math.sin(rad);
    art += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
  });
  art += `</g>`;

  return wrapDocumentSvg('Compass Lines', navy, art);
}

module.exports = { generateCompassLines };
