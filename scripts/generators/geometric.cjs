const {
  wrapSvg,
  buildSecurityFrame,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  round,
} = require('../generate-document-backgrounds.cjs');

function getGeometricBackgrounds() {
  const backgrounds = {};

  // 33. Compass Lines
  backgrounds['compass-lines.svg'] = wrapSvg(
    'Compass Lines',
    `
    <linearGradient id="cl-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="50%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#cl-bg)" />

    <!-- Monumental 32-Point Master Marine Compass Rose (450, 700) -->
    ${generateRosette(450, 700, 240, 32, '#0369a1', 0.65)}
    ${generateSunburst(450, 700, 240, 420, 64, '#0284c7', 0.4)}
    
    <!-- Concentric Navigational Degree Calibration Rings -->
    ${[120, 180, 240, 300, 360, 420].map(r => `
      <circle cx="450" cy="700" r="${r}" fill="none" stroke="#0369a1" stroke-width="1.2" stroke-dasharray="6 3" opacity="0.5" />
    `).join('\n')}

    <!-- 16 Rhumb Lines Radiating Completely Across the Chart -->
    <g stroke="#0284c7" stroke-width="1" opacity="0.35">
      ${Array.from({ length: 16 }).map((_, i) => {
        const rad = (i * Math.PI) / 8;
        const x1 = 450 - Math.cos(rad) * 600;
        const y1 = 700 - Math.sin(rad) * 600;
        const x2 = 450 + Math.cos(rad) * 600;
        const y2 = 700 + Math.sin(rad) * 600;
        return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke-dasharray="12 4" />`;
      }).join('\n')}
    </g>

    <!-- Master North Arrow / Fleur-de-lis Marker -->
    <g transform="translate(450, 440)">
      <polygon points="0,-45 16,15 0,0 -16,15" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
      <text x="0" y="-55" font-family="monospace" font-size="16" font-weight="900" fill="#dc2626" text-anchor="middle">N</text>
    </g>
    <text x="450" y="990" font-family="monospace" font-size="16" font-weight="900" fill="#0369a1" text-anchor="middle">S</text>
    <text x="730" y="706" font-family="monospace" font-size="16" font-weight="900" fill="#0369a1" text-anchor="middle">E</text>
    <text x="170" y="706" font-family="monospace" font-size="16" font-weight="900" fill="#0369a1" text-anchor="middle">W</text>

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 12, 5, '#0369a1', 0.45)}
    ${buildSecurityFrame('#0369a1', '#0284c7', 'COMPASS LINES · 32-POINT NAUTICAL ROSE &amp; RHUMB LINES')}
    `
  );

  // 34. Contour Map
  backgrounds['contour-map.svg'] = wrapSvg(
    'Contour Map',
    `
    <linearGradient id="cm-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="50%" stop-color="#fef3c7" />
      <stop offset="100%" stop-color="#fed7aa" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#cm-bg)" />

    <!-- Ultra-Dense Topographic Survey Elevation Contour Relief -->
    <g fill="none" stroke="#78350f">
      ${Array.from({ length: 24 }).map((_, i) => {
        const yBase = 180 + i * 46;
        const elev = 6200 - i * 150;
        const strokeW = i % 4 === 0 ? 2.5 : 1;
        const op = i % 4 === 0 ? 0.75 : 0.4;
        let d = '';
        for (let x = 40; x <= 860; x += 25) {
          const wobble = Math.sin((x / 860) * Math.PI * 4 + i * 0.7) * 35 + Math.cos((x / 860) * Math.PI * 6 + i) * 18;
          const y = yBase + wobble;
          d += (x === 40 ? `M ${x},${round(y)}` : ` L ${x},${round(y)}`);
        }
        return `
          <path d="${d}" stroke-width="${strokeW}" opacity="${op}" />
          ${i % 4 === 0 ? `<text x="90" y="${round(yBase - 6)}" font-family="monospace" font-size="8" font-weight="900" fill="#78350f" stroke="none">${elev} M</text>` : ''}
        `;
      }).join('\n')}
    </g>

    <!-- Peak Spot Elevations & Triangulation Stations -->
    ${[
      { x: 320, y: 380, elev: '5,842 M' },
      { x: 620, y: 560, elev: '6,110 M' },
      { x: 420, y: 840, elev: '5,420 M' },
      { x: 700, y: 1040, elev: '4,890 M' },
    ].map(p => `
      <g transform="translate(${p.x},${p.y})">
        <polygon points="0,-10 8,6 -8,6" fill="#dc2626" stroke="#78350f" stroke-width="1.5" />
        <circle cx="0" cy="0" r="2" fill="#ffffff" />
        <text x="14" y="3" font-family="monospace" font-size="8" font-weight="900" fill="#78350f">${p.elev}</text>
      </g>
    `).join('\n')}

    ${generateGuillocheBand(1280, 22, 4, 10, 6, 8, 4, '#78350f', 0.4)}
    ${buildSecurityFrame('#78350f', '#d97706', 'CONTOUR MAP · HIGH-RESOLUTION TOPOGRAPHIC ELEVATION')}
    `
  );

  // 35. Trade Network
  backgrounds['trade-network.svg'] = wrapSvg(
    'Trade Network',
    `
    <linearGradient id="tn-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#tn-bg)" />

    <!-- Global Multi-Modal Supply Chain Network Mesh Nodes -->
    ${[
      { x: 450, y: 680, name: 'CENTRAL HUB / KBL', r: 24, c: '#38bdf8' },
      { x: 220, y: 440, name: 'ISLAM QALA GATE', r: 16, c: '#60a5fa' },
      { x: 680, y: 440, name: 'HAIRATAN PORT', r: 16, c: '#60a5fa' },
      { x: 200, y: 880, name: 'SPIN BOLDAK', r: 16, c: '#60a5fa' },
      { x: 700, y: 880, name: 'TORGHUNDI TERMINAL', r: 16, c: '#60a5fa' },
      { x: 450, y: 320, name: 'NORTHERN CORRIDOR', r: 14, c: '#a78bfa' },
      { x: 450, y: 1040, name: 'SOUTHERN HIGHWAY', r: 14, c: '#a78bfa' },
      { x: 120, y: 680, name: 'WESTERN LINK', r: 12, c: '#34d399' },
      { x: 780, y: 680, name: 'EASTERN PASS', r: 12, c: '#34d399' },
    ].map(node => `
      <!-- Interconnected High-Speed Network Arcs -->
      <line x1="450" y1="680" x2="${node.x}" y2="${node.y}" stroke="${node.c}" stroke-width="2.5" stroke-dasharray="10 5" opacity="0.75" />
      <g transform="translate(${node.x},${node.y})">
        <circle cx="0" cy="0" r="${node.r}" fill="#ffffff" stroke="${node.c}" stroke-width="3" />
        <circle cx="0" cy="0" r="${node.r * 0.4}" fill="${node.c}" />
        <circle cx="0" cy="0" r="${node.r * 1.6}" fill="none" stroke="${node.c}" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.6" />
        <text x="0" y="${node.r + 16}" font-family="monospace" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle">${node.name}</text>
      </g>
    `).join('\n')}

    <!-- Outer Perimeter Cross-Links -->
    <g stroke="#38bdf8" stroke-width="1.5" opacity="0.45" fill="none">
      <path d="M 220,440 L 450,320 L 680,440 L 780,680 L 700,880 L 450,1040 L 200,880 L 120,680 Z" stroke-dasharray="6 4" />
    </g>

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 12, 5, '#38bdf8', 0.45)}
    ${buildSecurityFrame('#38bdf8', '#60a5fa', 'TRADE NETWORK · MULTI-MODAL SUPPLY CHAIN INFRASTRUCTURE')}
    `
  );

  // 36. Meridian Grid
  backgrounds['meridian-grid.svg'] = wrapSvg(
    'Meridian Grid',
    `
    <linearGradient id="mg-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff" />
      <stop offset="50%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#mg-bg)" />

    <!-- Monumental Orthographic Globe Coordinate Projection (450, 700) -->
    <g transform="translate(450, 700)">
      <circle cx="0" cy="0" r="380" fill="#ffffff" fill-opacity="0.3" stroke="#0369a1" stroke-width="3" />
      <circle cx="0" cy="0" r="392" fill="none" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="4 6" />

      <!-- Latitudinal Parallels -->
      ${[-280, -200, -100, 0, 100, 200, 280].map(y => {
        const rx = Math.sqrt(Math.max(0, 380 * 380 - y * y));
        return `
          <ellipse cx="0" cy="${y}" rx="${round(rx)}" ry="${round(rx * 0.32)}" fill="none" stroke="#0284c7" stroke-width="${y === 0 ? 2.5 : 1.2}" stroke-dasharray="${y === 0 ? '' : '6 3'}" opacity="0.6" />
        `;
      }).join('\n')}

      <!-- Longitudinal Meridians -->
      ${[-300, -200, -100, 0, 100, 200, 300].map(x => {
        return `
          <ellipse cx="0" cy="0" rx="${Math.abs(x)}" ry="380" fill="none" stroke="#0284c7" stroke-width="${x === 0 ? 2.5 : 1.2}" stroke-dasharray="${x === 0 ? '' : '6 3'}" opacity="0.6" />
        `;
      }).join('\n')}

      <!-- Prime Meridian & Equator Crosshair Axes -->
      <line x1="-380" y1="0" x2="380" y2="0" stroke="#0369a1" stroke-width="2.5" />
      <line x1="0" y1="-380" x2="0" y2="380" stroke="#0369a1" stroke-width="2.5" />
    </g>

    ${generateRosette(450, 700, 120, 24, '#0369a1', 0.5)}
    ${buildSecurityFrame('#0369a1', '#0284c7', 'MERIDIAN GRID · GEODETIC CARTOGRAPHIC PROJECTION')}
    `
  );

  // 37. Soft Arches
  backgrounds['soft-arches.svg'] = wrapSvg(
    'Soft Arches',
    `
    <linearGradient id="sa-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdf4ff" />
      <stop offset="50%" stop-color="#fae8ff" />
      <stop offset="100%" stop-color="#f5d0fe" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sa-bg)" />

    <!-- Classic Banknote Neoclassical Engraved Archways -->
    <g fill="none" stroke="#86198f" stroke-width="2">
      <!-- 5 Concentric Grand Arches -->
      ${[260, 310, 360, 410, 460].map((r, i) => `
        <path d="M ${450 - r},880 L ${450 - r},620 A ${r},${r} 0 0 1 ${450 + r},620 L ${450 + r},880" stroke-width="${i % 2 === 0 ? 2.5 : 1.2}" opacity="0.75" />
      `).join('\n')}

      <!-- Neoclassical Pillars (Fluted Columns) -->
      ${[120, 180, 720, 780].map(x => `
        <rect x="${x - 16}" y="620" width="32" height="420" fill="#ffffff" fill-opacity="0.8" stroke="#86198f" stroke-width="2" />
        <line x1="${x - 8}" y1="620" x2="${x - 8}" y2="1040" stroke="#c026d3" stroke-width="1" />
        <line x1="${x + 8}" y1="620" x2="${x + 8}" y2="1040" stroke="#c026d3" stroke-width="1" />
      `).join('\n')}
    </g>

    <!-- Master Banknote Rosette in Arch Center -->
    ${generateRosette(450, 620, 140, 24, '#a21caf', 0.65)}

    <!-- Intaglio Engraving Fill Waves -->
    ${generateGuillocheBand(1180, 24, 4, 10, 8, 12, 5, '#a21caf', 0.45)}
    ${buildSecurityFrame('#701a75', '#a21caf', 'SOFT ARCHES · CLASSIC BANKNOTE ARCHITECTURAL SECURITY')}
    `
  );

  // 38. Route Geometry
  backgrounds['route-geometry.svg'] = wrapSvg(
    'Route Geometry',
    `
    <linearGradient id="rg-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4" />
      <stop offset="50%" stop-color="#dcfce7" />
      <stop offset="100%" stop-color="#bbf7d0" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#rg-bg)" />

    <!-- Golden Ratio Logarithmic Spiral & Vector Triangulations -->
    <g transform="translate(450, 700)" fill="none" stroke="#15803d">
      ${Array.from({ length: 12 }).map((_, i) => {
        const r = 40 + i * 32;
        const polyPts = Array.from({ length: 6 }).map((_, p) => {
          const rad = (p * Math.PI) / 3 + (i * 0.15);
          return `${round(Math.cos(rad) * r)},${round(Math.sin(rad) * r)}`;
        }).join(' ');
        return `<polygon points="${polyPts}" stroke-width="${i % 3 === 0 ? 2 : 1}" opacity="${round(0.4 + (i / 12) * 0.4)}" />`;
      }).join('\n')}

      <!-- Concentric Distance Arcs -->
      ${[160, 260, 360].map(r => `<circle cx="0" cy="0" r="${r}" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="8 4" opacity="0.5" />`).join('\n')}
    </g>

    ${generateGuillocheBand(320, 24, 3, 10, 6, 8, 4, '#15803d', 0.35)}
    ${generateGuillocheBand(1220, 24, 4, 10, 8, 10, 5, '#15803d', 0.35)}

    ${buildSecurityFrame('#166534', '#15803d', 'ROUTE GEOMETRY · VECTOR SUPPLY CHAIN TOPOLOGY')}
    `
  );

  // 39. Pearl Waves
  backgrounds['pearl-waves.svg'] = wrapSvg(
    'Pearl Waves',
    `
    <linearGradient id="pw-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fafaf9" />
      <stop offset="35%" stop-color="#f5f5f4" />
      <stop offset="70%" stop-color="#e7e5e4" />
      <stop offset="100%" stop-color="#d6d3d1" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#pw-bg)" />

    <!-- Dense Hypnotic Security Banknote Guilloche Ocean Waves Across Entire Page -->
    ${[220, 360, 500, 640, 780, 920, 1060, 1200].map(y => `
      ${generateGuillocheBand(y, 28, 4, 14, 8, 14, 4.5, '#44403c', 0.45)}
    `).join('\n')}

    <!-- 3 Center Banknote Rosettes -->
    ${generateRosette(250, 700, 100, 24, '#292524', 0.6)}
    ${generateRosette(450, 700, 140, 32, '#1c1917', 0.7)}
    ${generateRosette(650, 700, 100, 24, '#292524', 0.6)}

    ${buildSecurityFrame('#292524', '#78716c', 'PEARL WAVES · INTAGLIO SINUSOIDAL GUILLOCHE SECURITY')}
    `
  );

  // 40. Northern Star
  backgrounds['northern-star.svg'] = wrapSvg(
    'Northern Star',
    `
    <linearGradient id="ns-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="70%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ns-bg)" />

    <!-- Brilliant 8-Point Polaris Navigation Star in Center (450, 680) -->
    <g transform="translate(450, 680)">
      <!-- Main Star Beams -->
      <polygon points="0,-240 18,-40 240,0 18,40 0,240 -18,40 -240,0 -18,-40" fill="#ffffff" stroke="#60a5fa" stroke-width="3" />
      <!-- Diagonal Secondary Beams -->
      <polygon points="-120,-120 -15,-25 0,-140 15,-25 120,-120 25,-15 140,0 25,15 120,120 15,25 0,140 -15,25 -120,120 -25,15 -140,0 -25,-15" fill="#93c5fd" stroke="#3b82f6" stroke-width="1.8" />
      <!-- Radiant Diamond Core -->
      <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#60a5fa" stroke-width="3" />
      <circle cx="0" cy="0" r="10" fill="#38bdf8" />
      
      <!-- Concentric Celestial Coordinate Rings -->
      ${[80, 160, 240, 320].map(r => `
        <circle cx="0" cy="0" r="${r}" fill="none" stroke="#60a5fa" stroke-width="1" stroke-dasharray="6 4" opacity="0.5" />
      `).join('\n')}
    </g>

    <!-- Celestial Constellation Dots (Ursa Major & Ursa Minor) -->
    <g fill="#ffffff" opacity="0.85">
      ${[
        { x: 280, y: 340, r: 3 },
        { x: 340, y: 390, r: 2.5 },
        { x: 380, y: 460, r: 3 },
        { x: 450, y: 480, r: 3.5 },
        { x: 540, y: 440, r: 2.5 },
        { x: 620, y: 410, r: 3 },
        { x: 680, y: 350, r: 3.5 },
      ].map(s => `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" />`).join('\n')}
    </g>
    <!-- Constellation Lines -->
    <path d="M 280,340 L 340,390 L 380,460 L 450,480 L 540,440 L 620,410 L 680,350" fill="none" stroke="#93c5fd" stroke-width="1.2" stroke-dasharray="4 2" opacity="0.6" />

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 12, 5, '#60a5fa', 0.45)}
    ${buildSecurityFrame('#38bdf8', '#818cf8', 'NORTHERN STAR · POLARIS CELESTIAL NAVIGATIONAL BEACON')}
    `
  );

  return backgrounds;
}

module.exports = { getGeometricBackgrounds };
