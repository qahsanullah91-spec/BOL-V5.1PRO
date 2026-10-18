const { wrapDocumentSvg } = require('./common.cjs');

function generateMeridianGrid() {
  const slate = '#0f172a';
  const cyan = '#0284c7';
  const navy = '#1e3a8a';
  const gold = '#d97706';

  let art = `<g transform="translate(450, 700)">`;

  const R = 360;

  // 1. Outer Calibrated Globe Limb Ring (radius 360)
  art += `<circle cx="0" cy="0" r="${R}" fill="none" stroke="${navy}" stroke-width="3.5" opacity="0.95" />`;
  art += `<circle cx="0" cy="0" r="${R + 12}" fill="none" stroke="${slate}" stroke-width="1.6" opacity="0.8" />`;
  art += `<circle cx="0" cy="0" r="${R - 12}" fill="none" stroke="${cyan}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.7" />`;

  // Limb Degree Ticks (360 degrees)
  art += `<g stroke="${navy}" opacity="0.8">`;
  for (let deg = 0; deg < 360; deg += 2) {
    const rad = (deg * Math.PI) / 180;
    const is10 = deg % 10 === 0;
    const is30 = deg % 30 === 0;
    const len = is30 ? 18 : is10 ? 12 : 6;
    const x1 = R * Math.cos(rad);
    const y1 = R * Math.sin(rad);
    const x2 = (R - len) * Math.cos(rad);
    const y2 = (R - len) * Math.sin(rad);
    art += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke-width="${is30 ? '2' : is10 ? '1.4' : '0.8'}" />`;

    if (is30) {
      const tx = (R - 26) * Math.cos(rad);
      const ty = (R - 26) * Math.sin(rad) + 4;
      art += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${navy}" text-anchor="middle">${deg}°</text>`;
    }
  }
  art += `</g>`;

  // 2. Longitude Meridians (Ellipses from North Pole to South Pole)
  // Semi-minor horizontal radii: 0, 50, 100, 150, 200, 250, 290, 330
  const meridianRadii = [0, 55, 110, 165, 220, 275, 320];
  meridianRadii.forEach((rx, idx) => {
    if (rx === 0) {
      // Prime Meridian Center Axis
      art += `<line x1="0" y1="${-R}" x2="0" y2="${R}" stroke="${navy}" stroke-width="3" opacity="0.95" />`;
    } else {
      art += `<ellipse cx="0" cy="0" rx="${rx}" ry="${R}" fill="none" stroke="${idx % 2 === 0 ? navy : cyan}" stroke-width="${idx % 2 === 0 ? '2.2' : '1.4'}" stroke-dasharray="${idx % 3 === 0 ? 'none' : '6 4'}" opacity="${idx % 2 === 0 ? '0.85' : '0.6'}" />`;
    }
  });

  // 3. Latitude Parallels (Horizontal Slices across Sphere)
  // For latitude angle theta: y = -R * sin(theta), rx = R * cos(theta), ry = rx * 0.25 (3D perspective tilt)
  const latitudes = [
    { deg: 0, name: 'EQUATOR 0°', major: true, stroke: 3.2 },
    { deg: 23.44, name: 'TROPIC OF CANCER +23.44°', major: true, stroke: 2.2 },
    { deg: -23.44, name: 'TROPIC OF CAPRICORN -23.44°', major: true, stroke: 2.2 },
    { deg: 45, name: '+45° N PARALLEL', major: false, stroke: 1.4 },
    { deg: -45, name: '-45° S PARALLEL', major: false, stroke: 1.4 },
    { deg: 66.5, name: 'ARCTIC CIRCLE +66.5°', major: true, stroke: 1.8 },
    { deg: -66.5, name: 'ANTARCTIC CIRCLE -66.5°', major: true, stroke: 1.8 },
    { deg: 75, name: '', major: false, stroke: 1 },
    { deg: -75, name: '', major: false, stroke: 1 },
  ];

  latitudes.forEach((lat) => {
    const rad = (lat.deg * Math.PI) / 180;
    const yCenter = -R * Math.sin(rad);
    const rx = R * Math.cos(rad);
    const ry = rx * 0.28; // perspective foreshortening

    art += `<ellipse cx="0" cy="${yCenter.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="${lat.major ? navy : cyan}" stroke-width="${lat.stroke}" stroke-dasharray="${lat.major ? 'none' : '4 3'}" opacity="${lat.major ? '0.9' : '0.6'}" />`;

    if (lat.name) {
      art += `<text x="${(rx + 6).toFixed(1)}" y="${(yCenter + 3).toFixed(1)}" font-family="Courier, monospace" font-size="7.5" font-weight="900" fill="${navy}" opacity="0.9">${lat.name}</text>`;
    }
  });

  // 4. Tilted Ecliptic Band (Tilted 23.44 degrees)
  art += `
    <g transform="rotate(-23.44)">
      <ellipse cx="0" cy="0" rx="${R}" ry="110" fill="none" stroke="${gold}" stroke-width="3" opacity="0.9" />
      <ellipse cx="0" cy="0" rx="${R - 16}" ry="95" fill="none" stroke="${gold}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75" />
      <text x="0" y="-116" font-family="Arial, sans-serif" font-size="9" font-weight="900" letter-spacing="4" fill="${gold}" text-anchor="middle">ECLIPTIC CELESTIAL PLANE · 23.44° INCLINATION</text>
    </g>
  `;

  // 5. Orbital Satellite Tracking Ellipses
  art += `
    <g transform="rotate(45)" stroke="${cyan}" stroke-width="1.8" opacity="0.7">
      <ellipse cx="0" cy="0" rx="420" ry="140" fill="none" stroke-dasharray="8 6" />
      <circle cx="360" cy="70" r="6" fill="${cyan}" stroke="${slate}" stroke-width="1.5" />
      <text x="375" y="74" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${cyan}">SAT-GEO 01</text>
    </g>
    <g transform="rotate(-45)" stroke="${cyan}" stroke-width="1.8" opacity="0.7">
      <ellipse cx="0" cy="0" rx="420" ry="140" fill="none" stroke-dasharray="8 6" />
      <circle cx="-360" cy="-70" r="6" fill="${cyan}" stroke="${slate}" stroke-width="1.5" />
      <text x="-445" y="-66" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${cyan}">SAT-MEO 02</text>
    </g>
  `;

  // 6. North & South Pole Finials
  art += `
    <!-- North Pole Pivot -->
    <g transform="translate(0, ${-R})">
      <polygon points="0,-24 -10,0 10,0" fill="${navy}" stroke="${slate}" stroke-width="1.2" />
      <circle cx="0" cy="0" r="7" fill="${gold}" stroke="${navy}" stroke-width="1.5" />
      <text x="0" y="-30" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="${navy}" text-anchor="middle">NORTH CELESTIAL POLE</text>
    </g>
    <!-- South Pole Pivot -->
    <g transform="translate(0, ${R})">
      <polygon points="0,24 -10,0 10,0" fill="${navy}" stroke="${slate}" stroke-width="1.2" />
      <circle cx="0" cy="0" r="7" fill="${gold}" stroke="${navy}" stroke-width="1.5" />
      <text x="0" y="40" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="${navy}" text-anchor="middle">SOUTH CELESTIAL POLE</text>
    </g>
  `;

  // 7. Center Rosette Core
  art += `
    <circle cx="0" cy="0" r="42" fill="#ffffff" fill-opacity="0.95" stroke="${navy}" stroke-width="3" />
    <circle cx="0" cy="0" r="32" fill="${navy}" fill-opacity="0.2" stroke="${cyan}" stroke-width="1.5" stroke-dasharray="4 2" />
    <circle cx="0" cy="0" r="14" fill="${navy}" stroke="#ffffff" stroke-width="1.4" />
    <circle cx="0" cy="0" r="4" fill="#ffffff" />
  `;

  art += `</g>`;

  return wrapDocumentSvg('Meridian Grid', navy, art);
}

module.exports = { generateMeridianGrid };
