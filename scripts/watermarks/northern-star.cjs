const { wrapDocumentSvg } = require('./common.cjs');

function generateNorthernStar() {
  const gold = '#d97706';
  const amber = '#b45309';
  const navy = '#1e3a8a';
  const slate = '#0f172a';

  let art = `<g transform="translate(450, 700)">`;

  // 1. Concentric Declination Rings
  const declinationRings = [400, 360, 320, 280, 240, 200, 160, 120, 80];
  declinationRings.forEach((r, idx) => {
    const isMajor = idx % 2 === 0;
    art += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${isMajor ? gold : navy}" stroke-width="${isMajor ? '2.4' : '1.3'}" stroke-dasharray="${idx === 1 ? '4 3' : idx === 3 ? '8 4' : 'none'}" opacity="${isMajor ? '0.85' : '0.6'}" />`;
    if (idx > 0 && idx % 2 === 0) {
      art += `<text x="8" y="${-r + 14}" font-family="Courier, monospace" font-size="7.5" font-weight="900" fill="${gold}">+${90 - idx * 10}° DEC</text>`;
    }
  });

  // 24 Hour-Angle Radial Spokes (every 15 degrees)
  art += `<g stroke="${navy}" stroke-width="1.2" opacity="0.45" stroke-dasharray="6 4">`;
  for (let i = 0; i < 24; i++) {
    const rad = (i * Math.PI) / 12;
    const x2 = 400 * Math.cos(rad);
    const y2 = 400 * Math.sin(rad);
    art += `<line x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
    // Hour labels
    const tx = 416 * Math.cos(rad);
    const ty = 416 * Math.sin(rad) + 3;
    art += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="Courier, monospace" font-size="7" font-weight="900" fill="${navy}" text-anchor="middle">${i}h</text>`;
  }
  art += `</g>`;

  // 2. 64-Ray Radiant Sunburst
  art += `<g stroke="${gold}" opacity="0.65">`;
  for (let i = 0; i < 64; i++) {
    const rad = (i * Math.PI) / 32;
    const isMajor = i % 4 === 0;
    const isMed = i % 2 === 0;
    const len = isMajor ? 390 : isMed ? 340 : 290;
    const x1 = 110 * Math.cos(rad);
    const y1 = 110 * Math.sin(rad);
    const x2 = len * Math.cos(rad);
    const y2 = len * Math.sin(rad);
    art += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${isMajor ? '2' : '0.9'}" />`;
  }
  art += `</g>`;

  // 3. Helper for Faceted Star Points
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

    const leftPoly = `0,0 ${bLX.toFixed(1)},${bLY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`;
    const rightPoly = `0,0 ${tipX.toFixed(1)},${tipY.toFixed(1)} ${bRX.toFixed(1)},${bRY.toFixed(1)}`;

    return `
      <polygon points="${leftPoly}" fill="${colorLeft}" opacity="${opacity}" stroke="${slate}" stroke-width="0.8" />
      <polygon points="${rightPoly}" fill="${colorRight}" opacity="${opacity}" stroke="${slate}" stroke-width="0.8" />
    `;
  }

  // 8 Intermediate Beams (Length 180, Width 22)
  for (let i = 0; i < 8; i++) {
    const deg = i * 45 + 22.5;
    art += renderFacetedPoint(deg, 180, 22, amber, gold, 0.85);
  }

  // 4 Major Ordinal Beams (Length 270, Width 34)
  for (let i = 0; i < 4; i++) {
    const deg = i * 90 + 45;
    art += renderFacetedPoint(deg, 270, 34, gold, navy, 0.92);
  }

  // 4 Primary Cardinal Beams (Length 360, Width 46)
  art += renderFacetedPoint(270, 360, 48, gold, amber, 0.98); // North
  art += renderFacetedPoint(0, 360, 48, gold, amber, 0.98);   // East
  art += renderFacetedPoint(90, 360, 48, gold, amber, 0.98);  // South
  art += renderFacetedPoint(180, 360, 48, gold, amber, 0.98); // West

  // 4. Center Gold & Navy Lathe Rosette Core
  art += `
    <circle cx="0" cy="0" r="76" fill="#ffffff" fill-opacity="0.96" stroke="${gold}" stroke-width="3.5" />
    <circle cx="0" cy="0" r="66" fill="none" stroke="${navy}" stroke-width="1.8" stroke-dasharray="4 2" />
    <circle cx="0" cy="0" r="52" fill="${gold}" fill-opacity="0.25" stroke="${gold}" stroke-width="2.2" />
    <circle cx="0" cy="0" r="32" fill="${navy}" fill-opacity="0.3" stroke="${navy}" stroke-width="1.6" />
    <circle cx="0" cy="0" r="14" fill="${gold}" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="0" cy="0" r="4" fill="#ffffff" />
  `;

  // 5. Constellation Guide: Ursa Major Pointer Stars & Cassiopeia Vector
  // Ursa Major Pointer Stars at bottom left
  art += `
    <g stroke="${gold}" stroke-width="2" fill="none">
      <!-- Pointer Vector to Polaris -->
      <line x1="-280" y1="260" x2="0" y2="0" stroke="${gold}" stroke-width="1.6" stroke-dasharray="6 4" opacity="0.8" />
      <text x="-295" y="240" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="${gold}" stroke="none">URSA MAJOR (POINTER VECTOR)</text>

      <!-- Dubhe & Merak Stars -->
      <circle cx="-280" cy="260" r="6" fill="${gold}" stroke="${slate}" stroke-width="1.5" />
      <circle cx="-240" cy="310" r="5" fill="${gold}" stroke="${slate}" stroke-width="1.5" />
      <line x1="-280" y1="260" x2="-240" y2="310" stroke="${gold}" stroke-width="2" />
    </g>
  `;

  // True North Zenith Cartouche
  art += `
    <text x="0" y="-315" font-family="Georgia, serif" font-size="28" font-weight="900" fill="${gold}" text-anchor="middle">★</text>
    <text x="0" y="-372" font-family="Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="3" fill="${gold}" text-anchor="middle">TRUE NORTH ZENITH · 90°00'00" N</text>
    <text x="0" y="384" font-family="Courier, monospace" font-size="9" font-weight="900" letter-spacing="2" fill="${navy}" text-anchor="middle">POLARIS · ALPHA URSAE MINORIS · CELESTIAL PIVOT</text>
  `;

  art += `</g>`;

  return wrapDocumentSvg('Northern Star', gold, art);
}

module.exports = { generateNorthernStar };
