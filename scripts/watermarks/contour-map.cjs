const { wrapDocumentSvg } = require('./common.cjs');

function generateContourMap() {
  const teal = '#0f766e';
  const alpine = '#134e4a';
  const blue = '#0369a1';
  const slate = '#0f172a';

  let art = `<g>`;

  // 1. UTM Cartographic Grid
  art += `<g stroke="${teal}" stroke-width="0.8" opacity="0.35" stroke-dasharray="4 6">`;
  for (let x = 120; x <= 780; x += 110) {
    art += `<line x1="${x}" y1="60" x2="${x}" y2="1340" />`;
  }
  for (let y = 120; y <= 1300; y += 120) {
    art += `<line x1="60" y1="${y}" x2="840" y2="${y}" />`;
  }
  art += `</g>`;

  // 2. Mathematical Topographic Contours (Pamir & Hindu Kush Elevation Model)
  // Two summit centers: P1=(330, 480) [Noshaq Peak], P2=(600, 860) [Koh-e Baba]
  const p1x = 330, p1y = 480;
  const p2x = 600, p2y = 860;

  // We generate 28 concentric organic elevation loops around P1, P2, and merged regional loops
  // Helper for generating organic closed contour curves using multi-harmonic sine/cos
  function generateOrganicLoop(cx, cy, baseRx, baseRy, harmonics, stepCount = 90) {
    const pts = [];
    for (let i = 0; i <= stepCount; i++) {
      const angle = (i * 2 * Math.PI) / stepCount;
      let rOffset = 0;
      harmonics.forEach(({ freq, amp, phase }) => {
        rOffset += amp * Math.sin(freq * angle + phase);
      });
      const rx = baseRx + rOffset;
      const ry = baseRy + rOffset * 0.9;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M${pts[0]} L${pts.slice(1).join(' ')} Z`;
  }

  // Peak 1: Noshaq Elevation Tiers (High Alpine)
  const p1Tiers = [
    { r: 28, index: true, elev: '7,492M (SUMMIT)' },
    { r: 52, index: false },
    { r: 78, index: true, elev: '7,000M' },
    { r: 106, index: false },
    { r: 136, index: false },
    { r: 168, index: true, elev: '6,500M' },
    { r: 202, index: false },
    { r: 238, index: true, elev: '6,000M' },
    { r: 276, index: false },
    { r: 316, index: true, elev: '5,500M' },
  ];

  p1Tiers.forEach((tier, idx) => {
    const pathD = generateOrganicLoop(p1x, p1y, tier.r, tier.r * 0.85, [
      { freq: 3, amp: 8 + idx * 2.2, phase: 0.4 },
      { freq: 5, amp: 4 + idx * 1.2, phase: 1.2 },
      { freq: 2, amp: 10 + idx * 1.5, phase: 2.1 },
    ]);
    const isMajor = tier.index;
    art += `<path d="${pathD}" fill="${isMajor ? teal : 'none'}" fill-opacity="${isMajor ? '0.04' : '0'}" stroke="${isMajor ? alpine : teal}" stroke-width="${isMajor ? '3' : '1.3'}" opacity="${isMajor ? '0.9' : '0.6'}" />`;

    // Elevation badge on index contours
    if (tier.elev) {
      const labelX = p1x + tier.r + 8;
      const labelY = p1y - 8;
      art += `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" font-family="Courier, monospace" font-size="8.5" font-weight="900" fill="${alpine}" opacity="0.95">${tier.elev}</text>`;
    }
  });

  // Peak 2: Koh-e Baba Elevation Tiers
  const p2Tiers = [
    { r: 32, index: true, elev: '5,140M (BABA)' },
    { r: 60, index: false },
    { r: 92, index: true, elev: '4,500M' },
    { r: 126, index: false },
    { r: 162, index: true, elev: '4,000M' },
    { r: 200, index: false },
    { r: 240, index: true, elev: '3,500M' },
    { r: 282, index: false },
    { r: 326, index: true, elev: '3,000M' },
  ];

  p2Tiers.forEach((tier, idx) => {
    const pathD = generateOrganicLoop(p2x, p2y, tier.r, tier.r * 0.9, [
      { freq: 4, amp: 6 + idx * 2, phase: 0.8 },
      { freq: 6, amp: 3 + idx * 1.1, phase: 1.5 },
      { freq: 2, amp: 12 + idx * 1.8, phase: 0.2 },
    ]);
    const isMajor = tier.index;
    art += `<path d="${pathD}" fill="${isMajor ? blue : 'none'}" fill-opacity="${isMajor ? '0.04' : '0'}" stroke="${isMajor ? alpine : blue}" stroke-width="${isMajor ? '2.8' : '1.2'}" opacity="${isMajor ? '0.9' : '0.6'}" />`;

    if (tier.elev) {
      const labelX = p2x - tier.r - 54;
      const labelY = p2y + 4;
      art += `<text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}" font-family="Courier, monospace" font-size="8.5" font-weight="900" fill="${blue}" opacity="0.95">${tier.elev}</text>`;
    }
  });

  // 3. Wide Valley & Regional Basin Contours spanning entire sheet
  const valleyTiers = [
    { yMid: 220, rx: 390, ry: 140, elev: '2,500M REGIONAL BASIN' },
    { yMid: 400, rx: 420, ry: 190, elev: '2,000M SALANG PASS CORRIDOR' },
    { yMid: 680, rx: 430, ry: 240, elev: '1,800M KABUL PLATEAU' },
    { yMid: 980, rx: 410, ry: 210, elev: '1,500M LOGAR VALLEY' },
    { yMid: 1180, rx: 380, ry: 150, elev: '1,200M SOUTHERN PLAINS' },
  ];

  valleyTiers.forEach((vt, idx) => {
    const pathD = generateOrganicLoop(450, vt.yMid, vt.rx, vt.ry, [
      { freq: 3, amp: 26, phase: idx * 1.1 },
      { freq: 5, amp: 14, phase: idx * 0.7 },
      { freq: 1, amp: 35, phase: 0.5 },
    ]);
    art += `<path d="${pathD}" fill="none" stroke="${teal}" stroke-width="3" stroke-dasharray="${idx % 2 === 0 ? 'none' : '12 4'}" opacity="0.85" />`;
    art += `<text x="90" y="${(vt.yMid - vt.ry * 0.6).toFixed(1)}" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}">${vt.elev}</text>`;
  });

  // 4. Summit Triangles & Spot Height Markers
  art += `
    <!-- Peak 1: Noshaq Summit -->
    <g transform="translate(${p1x}, ${p1y})">
      <polygon points="0,-16 -12,8 12,8" fill="${alpine}" stroke="${slate}" stroke-width="1.5" />
      <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      <text x="0" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="${alpine}" text-anchor="middle">▲ NOSHAQ PEAK</text>
      <text x="0" y="36" font-family="Courier, monospace" font-size="9" font-weight="900" fill="${blue}" text-anchor="middle">7,492M · 24,580 FT</text>
    </g>

    <!-- Peak 2: Koh-e Baba Summit -->
    <g transform="translate(${p2x}, ${p2y})">
      <polygon points="0,-16 -12,8 12,8" fill="${alpine}" stroke="${slate}" stroke-width="1.5" />
      <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      <text x="0" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="900" fill="${alpine}" text-anchor="middle">▲ KOH-E BABA</text>
      <text x="0" y="36" font-family="Courier, monospace" font-size="9" font-weight="900" fill="${blue}" text-anchor="middle">5,140M · 16,863 FT</text>
    </g>
  `;

  // 5. Alpine Cartographic Scale Bar & Marginal Metadata
  art += `
    <g transform="translate(450, 1310)">
      <!-- Scale Bar -->
      <rect x="-180" y="-8" width="360" height="12" fill="none" stroke="${alpine}" stroke-width="1.8" />
      <rect x="-180" y="-8" width="90" height="12" fill="${alpine}" />
      <rect x="0" y="-8" width="90" height="12" fill="${alpine}" />
      <line x1="-180" y1="-14" x2="-180" y2="-8" stroke="${alpine}" stroke-width="1.8" />
      <line x1="-90" y1="-14" x2="-90" y2="-8" stroke="${alpine}" stroke-width="1.8" />
      <line x1="0" y1="-14" x2="0" y2="-8" stroke="${alpine}" stroke-width="1.8" />
      <line x1="90" y1="-14" x2="90" y2="-8" stroke="${alpine}" stroke-width="1.8" />
      <line x1="180" y1="-14" x2="180" y2="-8" stroke="${alpine}" stroke-width="1.8" />

      <text x="-180" y="-18" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}" text-anchor="middle">0 KM</text>
      <text x="-90" y="-18" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}" text-anchor="middle">25</text>
      <text x="0" y="-18" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}" text-anchor="middle">50</text>
      <text x="90" y="-18" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}" text-anchor="middle">75</text>
      <text x="180" y="-18" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${alpine}" text-anchor="middle">100 KM</text>

      <text x="0" y="20" font-family="Arial, sans-serif" font-size="9" font-weight="900" letter-spacing="2" fill="${alpine}" text-anchor="middle">SCALE 1 : 250,000 · CONTOUR INTERVAL 500 METERS · WGS-84</text>
    </g>

    <!-- Boundary Coordinate Annotations -->
    <text x="65" y="705" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${teal}" transform="rotate(-90, 65, 705)" text-anchor="middle">E 68° 30' 00" · NORTHERN LOGISTICS SECTOR</text>
    <text x="835" y="705" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${teal}" transform="rotate(90, 835, 705)" text-anchor="middle">E 71° 45' 00" · HINDU KUSH TRANSIT AXIS</text>
  `;

  art += `</g>`;

  return wrapDocumentSvg('Contour Map', teal, art);
}

module.exports = { generateContourMap };
