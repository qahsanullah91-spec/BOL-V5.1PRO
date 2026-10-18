const { wrapDocumentSvg } = require('./common.cjs');

function generateSoftArches() {
  const lapis = '#1e3a8a';
  const bronze = '#b45309';
  const gold = '#d97706';
  const slate = '#0f172a';

  let art = `<g>`;

  // 1. Flanking Colonnade Pillars (Left: x=75..145, Right: x=755..825)
  // Left Pillar
  art += `
    <g stroke="${lapis}" fill="none">
      <!-- Plinth Base -->
      <rect x="75" y="1240" width="70" height="70" stroke-width="2.6" fill="${lapis}" fill-opacity="0.08" />
      <rect x="85" y="1225" width="50" height="15" stroke-width="2" />
      <!-- Vertical Fluted Shaft -->
      <rect x="88" y="240" width="44" height="985" stroke-width="2.4" />
      <line x1="99" y1="240" x2="99" y2="1225" stroke-width="1.2" stroke-dasharray="6 3" />
      <line x1="110" y1="240" x2="110" y2="1225" stroke-width="1.8" />
      <line x1="121" y1="240" x2="121" y2="1225" stroke-width="1.2" stroke-dasharray="6 3" />
      <!-- Capital Top -->
      <rect x="85" y="225" width="50" height="15" stroke-width="2" />
      <rect x="75" y="170" width="70" height="55" stroke-width="2.6" fill="${lapis}" fill-opacity="0.08" />
      <polygon points="75,225 145,225 135,170 85,170" stroke-width="1.8" />
    </g>
  `;

  // Right Pillar
  art += `
    <g stroke="${lapis}" fill="none">
      <!-- Plinth Base -->
      <rect x="755" y="1240" width="70" height="70" stroke-width="2.6" fill="${lapis}" fill-opacity="0.08" />
      <rect x="765" y="1225" width="50" height="15" stroke-width="2" />
      <!-- Vertical Fluted Shaft -->
      <rect x="768" y="240" width="44" height="985" stroke-width="2.4" />
      <line x1="779" y1="240" x2="779" y2="1225" stroke-width="1.2" stroke-dasharray="6 3" />
      <line x1="790" y1="240" x2="790" y2="1225" stroke-width="1.8" />
      <line x1="801" y1="240" x2="801" y2="1225" stroke-width="1.2" stroke-dasharray="6 3" />
      <!-- Capital Top -->
      <rect x="765" y="225" width="50" height="15" stroke-width="2" />
      <rect x="755" y="170" width="70" height="55" stroke-width="2.6" fill="${lapis}" fill-opacity="0.08" />
      <polygon points="755,225 825,225 815,170 765,170" stroke-width="1.8" />
    </g>
  `;

  // 2. Concentric Pointed Ogival Arches
  // Apex at x=450, y=yApex. Left foot at x=450-w, y=1240. Right foot at x=450+w, y=1240.
  // In Islamic architecture, pointed arch left arc curves with center at (450+d, yImpost), right arc curves with center at (450-d, yImpost).
  const archConfigs = [
    { w: 360, yApex: 150, stroke: '3.6', color: lapis, major: true },
    { w: 335, yApex: 185, stroke: '2.4', color: bronze, major: false },
    { w: 310, yApex: 220, stroke: '2', color: lapis, major: false },
    { w: 285, yApex: 255, stroke: '2.8', color: lapis, major: true },
    { w: 260, yApex: 290, stroke: '1.8', color: bronze, major: false },
    { w: 235, yApex: 325, stroke: '2.2', color: lapis, major: false },
    { w: 210, yApex: 360, stroke: '2.6', color: bronze, major: true },
    { w: 185, yApex: 395, stroke: '1.6', color: lapis, major: false },
    { w: 160, yApex: 430, stroke: '2', color: bronze, major: false },
    { w: 135, yApex: 465, stroke: '2.4', color: lapis, major: true },
  ];

  archConfigs.forEach((cfg) => {
    const xL = 450 - cfg.w;
    const xR = 450 + cfg.w;
    const yBase = 1240;
    // Cubic bezier for graceful pointed arch: M(xL, yBase) C(xL, 500) (410, cfg.yApex) (450, cfg.yApex) C(490, cfg.yApex) (xR, 500) (xR, yBase)
    const ctrlY = (cfg.yApex + yBase) * 0.45;
    const pathD = `M${xL},${yBase} C${xL},${ctrlY} 415,${cfg.yApex} 450,${cfg.yApex} C485,${cfg.yApex} ${xR},${ctrlY} ${xR},${yBase}`;
    art += `<path d="${pathD}" fill="none" stroke="${cfg.color}" stroke-width="${cfg.stroke}" opacity="${cfg.major ? '0.92' : '0.65'}" />`;
  });

  // 3. Muqarnas Scalloped Cusps along Arch #4 (w=285)
  art += `<g stroke="${bronze}" fill="none" stroke-width="1.6" opacity="0.8">`;
  const cuspCount = 20;
  for (let i = 0; i <= cuspCount; i++) {
    const t = i / cuspCount;
    // Angle along arch
    const ang = Math.PI * (1 - t);
    const cx = 450 + 260 * Math.cos(ang);
    const cy = 600 - 320 * Math.sin(ang);
    art += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="14" />`;
  }
  art += `</g>`;

  // 4. Central 8-Pointed Khatam Star Medallion (Center: 450, 700)
  art += `<g transform="translate(450, 700)">`;
  // Concentric framing rings
  art += `<circle cx="0" cy="0" r="180" fill="none" stroke="${lapis}" stroke-width="3" opacity="0.9" />`;
  art += `<circle cx="0" cy="0" r="165" fill="none" stroke="${bronze}" stroke-width="1.8" stroke-dasharray="4 3" opacity="0.75" />`;
  art += `<circle cx="0" cy="0" r="140" fill="${lapis}" fill-opacity="0.12" stroke="${lapis}" stroke-width="2.4" />`;

  // 8-Pointed Khatam Star (interlocking dual squares)
  const sq1 = [];
  const sq2 = [];
  const rStar = 135;
  for (let i = 0; i < 4; i++) {
    const a1 = (i * Math.PI) / 2;
    const a2 = ((i + 0.5) * Math.PI) / 2;
    sq1.push(`${(rStar * Math.cos(a1)).toFixed(1)},${(rStar * Math.sin(a1)).toFixed(1)}`);
    sq2.push(`${(rStar * Math.cos(a2)).toFixed(1)},${(rStar * Math.sin(a2)).toFixed(1)}`);
  }
  art += `<polygon points="${sq1.join(' ')}" fill="${bronze}" fill-opacity="0.15" stroke="${bronze}" stroke-width="2.6" opacity="0.9" />`;
  art += `<polygon points="${sq2.join(' ')}" fill="${bronze}" fill-opacity="0.15" stroke="${bronze}" stroke-width="2.6" opacity="0.9" />`;

  // 16-Ray Ornamental Petals
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const x2 = 110 * Math.cos(a);
    const y2 = 110 * Math.sin(a);
    art += `<line x1="0" y1="0" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${lapis}" stroke-width="1.8" opacity="0.75" />`;
    art += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="6" fill="${gold}" stroke="${lapis}" stroke-width="1.2" />`;
  }

  // Inner Guilloche Lathe Rosette Core
  art += `
    <circle cx="0" cy="0" r="65" fill="#ffffff" fill-opacity="0.95" stroke="${lapis}" stroke-width="3" />
    <circle cx="0" cy="0" r="52" fill="none" stroke="${bronze}" stroke-width="1.8" stroke-dasharray="3 2" />
    <circle cx="0" cy="0" r="38" fill="${lapis}" fill-opacity="0.25" stroke="${lapis}" stroke-width="2" />
    <circle cx="0" cy="0" r="16" fill="${bronze}" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="0" cy="0" r="5" fill="#ffffff" />
  `;

  // Architectural Title & Motif in Medallion
  art += `<text x="0" y="200" font-family="Arial, sans-serif" font-size="11" font-weight="900" letter-spacing="3" fill="${lapis}" text-anchor="middle">MUQARNAS VAULTING · ISLAMIC ARCHITECTURAL GEOMETRY</text>`;
  art += `</g>`;

  // 5. Spandrel Corner Arabesques (Top Left & Top Right)
  art += `
    <g stroke="${bronze}" fill="none" stroke-width="1.4" opacity="0.5">
      <!-- Top Left Spandrel Ribbon -->
      <path d="M150,170 C220,170 280,120 330,80 C360,130 310,180 250,200 Z" />
      <path d="M170,190 C230,190 280,150 310,110" />
      <!-- Top Right Spandrel Ribbon -->
      <path d="M750,170 C680,170 620,120 570,80 C540,130 590,180 650,200 Z" />
      <path d="M730,190 C670,190 620,150 590,110" />
    </g>
  `;

  art += `</g>`;

  return wrapDocumentSvg('Soft Arches', lapis, art);
}

module.exports = { generateSoftArches };
