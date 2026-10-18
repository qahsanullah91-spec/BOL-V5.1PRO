const { wrapDocumentSvg } = require('./common.cjs');

function generateRouteGeometry() {
  const color1 = '#0369a1';
  const color2 = '#0284c7';
  const color3 = '#0f172a';

  let art = `<g transform="translate(450, 700)">`;

  // Concentric calibrated background rings
  const ringRadii = [410, 380, 350, 320, 290, 260, 230, 200, 170, 140, 110, 80, 50];
  for (let idx = 0; idx < ringRadii.length; idx++) {
    const r = ringRadii[idx];
    const isMajor = idx % 2 === 0;
    art += `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${isMajor ? color1 : color2}" stroke-width="${isMajor ? '2.4' : '1.4'}" stroke-dasharray="${idx % 3 === 0 ? 'none' : idx % 3 === 1 ? '6 4' : '3 3'}" opacity="${isMajor ? '0.85' : '0.6'}" />`;
  }

  // 64-Ray Astrolabe Radial Sunburst
  art += `<g stroke="${color2}" opacity="0.65">`;
  for (let i = 0; i < 64; i++) {
    const angle = (i * Math.PI) / 32;
    const len = i % 4 === 0 ? 410 : i % 2 === 0 ? 380 : 350;
    const x1 = 110 * Math.cos(angle);
    const y1 = 110 * Math.sin(angle);
    const x2 = len * Math.cos(angle);
    const y2 = len * Math.sin(angle);
    art += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${i % 4 === 0 ? '2' : '1'}" />`;
  }
  art += `</g>`;

  // 24-point Sacred Geometry Polygon Star (Golden Ratio)
  const starPoints24 = [];
  for (let i = 0; i < 24; i++) {
    const angle = (i * Math.PI) / 12;
    const r = i % 2 === 0 ? 350 : 220;
    starPoints24.push(`${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`);
  }
  art += `<polygon points="${starPoints24.join(' ')}" fill="${color1}" fill-opacity="0.18" stroke="${color1}" stroke-width="3" opacity="0.95" />`;

  // 16-point Intersecting Star Polygon
  const starPoints16 = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8;
    const r = i % 2 === 0 ? 290 : 160;
    starPoints16.push(`${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`);
  }
  art += `<polygon points="${starPoints16.join(' ')}" fill="${color2}" fill-opacity="0.22" stroke="${color2}" stroke-width="2.6" opacity="0.95" />`;

  // Interlocking Hexagrams & Metatron Circles
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const cx = 160 * Math.cos(angle);
    const cy = 160 * Math.sin(angle);
    art += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="160" fill="none" stroke="${color1}" stroke-width="2" opacity="0.65" />`;
    art += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="36" fill="${color2}" fill-opacity="0.25" stroke="${color2}" stroke-width="1.6" opacity="0.8" />`;
  }

  // Dual Central Polygons (Octagram and Dodecagram)
  const octa1 = [];
  const octa2 = [];
  for (let i = 0; i < 8; i++) {
    const a1 = (i * Math.PI) / 4;
    const a2 = ((i + 0.5) * Math.PI) / 4;
    octa1.push(`${(190 * Math.cos(a1)).toFixed(1)},${(190 * Math.sin(a1)).toFixed(1)}`);
    octa2.push(`${(190 * Math.cos(a2)).toFixed(1)},${(190 * Math.sin(a2)).toFixed(1)}`);
  }
  art += `<polygon points="${octa1.join(' ')}" fill="none" stroke="${color3}" stroke-width="2.2" opacity="0.75" />`;
  art += `<polygon points="${octa2.join(' ')}" fill="none" stroke="${color3}" stroke-width="2.2" opacity="0.75" />`;

  // Central Banknote Guilloche Lathe Rosette
  art += `<circle cx="0" cy="0" r="100" fill="#ffffff" fill-opacity="0.95" stroke="${color1}" stroke-width="3.5" />`;
  art += `<circle cx="0" cy="0" r="90" fill="none" stroke="${color2}" stroke-width="1.6" stroke-dasharray="4 3" />`;
  art += `<circle cx="0" cy="0" r="70" fill="${color1}" fill-opacity="0.28" stroke="${color1}" stroke-width="2.4" />`;
  art += `<circle cx="0" cy="0" r="48" fill="none" stroke="${color2}" stroke-width="1.8" />`;
  art += `<circle cx="0" cy="0" r="18" fill="${color1}" opacity="0.95" />`;
  art += `<circle cx="0" cy="0" r="6" fill="#ffffff" />`;

  // Caliper & Coordinate Axes extending outward
  art += `<line x1="-420" y1="0" x2="420" y2="0" stroke="${color1}" stroke-width="2.6" opacity="0.85" />`;
  art += `<line x1="0" y1="-420" x2="0" y2="420" stroke="${color1}" stroke-width="2.6" opacity="0.85" />`;
  art += `<line x1="-300" y1="-300" x2="300" y2="300" stroke="${color2}" stroke-width="1.8" stroke-dasharray="8 6" opacity="0.65" />`;
  art += `<line x1="-300" y1="300" x2="300" y2="-300" stroke="${color2}" stroke-width="1.8" stroke-dasharray="8 6" opacity="0.65" />`;

  // Astrolabe Calibration Text Badges
  art += `<text x="0" y="-418" font-family="Courier, monospace" font-size="11" font-weight="900" fill="${color1}" text-anchor="middle">GEOMETRIC AXIS 000°</text>`;
  art += `<text x="0" y="432" font-family="Courier, monospace" font-size="11" font-weight="900" fill="${color1}" text-anchor="middle">GOLDEN RATIO 1.618</text>`;
  art += `<text x="428" y="4" font-family="Courier, monospace" font-size="11" font-weight="900" fill="${color1}">090°</text>`;
  art += `<text x="-438" y="4" font-family="Courier, monospace" font-size="11" font-weight="900" fill="${color1}" text-anchor="end">270°</text>`;

  art += `</g>`;

  // Full-Page Sacred Geometry Alignment Guides
  art += `<g stroke="${color2}" stroke-width="1.2" stroke-dasharray="6 6" opacity="0.4">`;
  art += `<line x1="75" y1="75" x2="825" y2="1325" />`;
  art += `<line x1="825" y1="75" x2="75" y2="1325" />`;
  art += `<line x1="450" y1="40" x2="450" y2="1360" />`;
  art += `</g>`;

  return wrapDocumentSvg('Route Geometry', color1, art);
}

module.exports = { generateRouteGeometry };
