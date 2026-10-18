const {
  wrapSvg,
  buildSecurityFrame,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  round,
} = require('../generate-document-backgrounds.cjs');

function getMaritimeBackgrounds() {
  const backgrounds = {};

  // 17. Ocean Passage
  backgrounds['ocean-passage.svg'] = wrapSvg(
    'Ocean Passage',
    `
    <linearGradient id="op-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff" />
      <stop offset="45%" stop-color="#bae6fd" />
      <stop offset="70%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#op-sky)" />

    <!-- Master Navigational Compass Rose in Sky (450, 380) -->
    ${generateRosette(450, 380, 160, 32, '#0369a1', 0.5)}
    ${generateSunburst(450, 380, 160, 240, 32, '#0284c7', 0.35)}

    <!-- Large Container Ship in Profile -->
    <g transform="translate(140, 580)">
      <!-- Hull -->
      <path d="M 0,90 L 40,140 L 540,140 L 620,80 L 600,40 L 0,40 Z" fill="#0f172a" stroke="#0284c7" stroke-width="2.5" />
      <!-- Waterline Stripe -->
      <line x1="20" y1="120" x2="560" y2="120" stroke="#dc2626" stroke-width="3" />
      <!-- Deck Superstructure & Bridge Tower -->
      <rect x="460" y="-30" width="70" height="70" rx="2" fill="#ffffff" stroke="#0369a1" stroke-width="2" />
      <rect x="470" y="-20" width="50" height="15" fill="#38bdf8" />
      <line x1="495" y1="-60" x2="495" y2="-30" stroke="#0369a1" stroke-width="2.5" />
      <!-- Container Blocks (Bays 1..6) -->
      ${[40, 105, 170, 235, 300, 365].map(x => `
        <rect x="${x}" y="0" width="60" height="40" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />
        <rect x="${x}" y="-35" width="60" height="35" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5" />
        <rect x="${x + 5}" y="-65" width="50" height="30" fill="#ffffff" stroke="#0284c7" stroke-width="1.2" />
      `).join('\n')}
    </g>

    <!-- Deep Ocean Swell Waves Guilloche Bands -->
    ${generateGuillocheBand(780, 24, 4, 10, 8, 12, 5, '#ffffff', 0.75)}
    ${generateGuillocheBand(920, 28, 3, 12, 6, 12, 5, '#38bdf8', 0.65)}
    ${generateGuillocheBand(1080, 26, 4, 10, 7, 12, 5, '#0284c7', 0.55)}
    ${generateGuillocheBand(1240, 24, 3, 12, 6, 12, 5, '#0369a1', 0.45)}

    ${buildSecurityFrame('#0369a1', '#0284c7', 'OCEAN PASSAGE · INTERNATIONAL MARITIME SEA LANE')}
    `
  );

  // 18. Harbor Morning
  backgrounds['harbor-morning.svg'] = wrapSvg(
    'Harbor Morning',
    `
    <linearGradient id="hm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed" />
      <stop offset="40%" stop-color="#fed7aa" />
      <stop offset="70%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#hm-sky)" />

    <!-- Morning Sun over Harbor Basin -->
    <circle cx="700" cy="380" r="70" fill="#ffffff" stroke="#ea580c" stroke-width="3" />
    ${generateSunburst(700, 380, 75, 260, 36, '#f97316', 0.4)}

    <!-- Ship-to-Shore Gantry Cranes (STS) Lining the Quay -->
    ${[120, 340, 560].map(cx => `
      <g stroke="#0369a1" stroke-width="2.5" fill="none">
        <!-- Crane Legs (A-Frame) -->
        <line x1="${cx - 50}" y1="620" x2="${cx - 20}" y2="340" />
        <line x1="${cx + 50}" y1="620" x2="${cx + 20}" y2="340" />
        <line x1="${cx - 50}" y1="620" x2="${cx + 50}" y2="620" stroke-width="6" stroke="#0f172a" />
        <!-- Crane Boom (Extending over Water) -->
        <line x1="${cx - 80}" y1="340" x2="${cx + 140}" y2="340" stroke-width="5" stroke="#0284c7" />
        <!-- Diagonal Tension Cables -->
        <line x1="${cx}" y1="260" x2="${cx - 80}" y2="340" stroke-width="1.5" />
        <line x1="${cx}" y1="260" x2="${cx + 140}" y2="340" stroke-width="1.5" />
        <!-- Tower Apex -->
        <polygon points="${cx - 20},340 ${cx},260 ${cx + 20},340" fill="#ffffff" />
      </g>
    `).join('\n')}

    <!-- Berthed Container Ship at Quayside -->
    <rect x="80" y="620" width="740" height="90" rx="3" fill="#0f172a" stroke="#0284c7" stroke-width="2" />
    <line x1="80" y1="680" x2="820" y2="680" stroke="#dc2626" stroke-width="4" />

    <!-- Harbor Basin Water Swell Guilloche Waves -->
    ${generateGuillocheBand(840, 20, 4, 8, 8, 10, 4, '#38bdf8', 0.6)}
    ${generateGuillocheBand(1020, 22, 3, 10, 6, 12, 5, '#ffffff', 0.65)}
    ${generateGuillocheBand(1200, 24, 4, 12, 7, 12, 5, '#0284c7', 0.55)}

    ${buildSecurityFrame('#0369a1', '#ea580c', 'HARBOR MORNING · DEEPWATER COMMERCIAL TERMINAL')}
    `
  );

  // 19. Coastal Freight
  backgrounds['coastal-freight.svg'] = wrapSvg(
    'Coastal Freight',
    `
    <linearGradient id="cf-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0fdf4" />
      <stop offset="50%" stop-color="#ccfbf1" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#cf-sky)" />

    <!-- Coastline & Offshore Archipelago Islands -->
    <path d="M 40,240 Q 180,380 120,620 T 220,940 T 80,1340 L 40,1340 Z" fill="#047857" fill-opacity="0.25" stroke="#065f46" stroke-width="2.5" />
    
    <!-- Offshore Islands -->
    <ellipse cx="640" cy="420" rx="120" ry="60" fill="#047857" fill-opacity="0.2" stroke="#065f46" stroke-width="2" />
    <ellipse cx="740" cy="740" rx="80" ry="40" fill="#047857" fill-opacity="0.2" stroke="#065f46" stroke-width="2" />
    <ellipse cx="580" cy="980" rx="100" ry="50" fill="#047857" fill-opacity="0.2" stroke="#065f46" stroke-width="2" />

    <!-- Navigational Light Buoys with Flashing Light Beams -->
    ${[
      { x: 380, y: 480, name: 'BUOY 01 [Q.G]' },
      { x: 480, y: 720, name: 'BUOY 02 [Q.R]' },
      { x: 390, y: 980, name: 'BUOY 03 [FL.W]' },
      { x: 450, y: 1220, name: 'FAIRWAY BUOY' },
    ].map(b => `
      <g transform="translate(${b.x},${b.y})">
        <polygon points="0,-24 10,0 -10,0" fill="#dc2626" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="0" cy="-26" r="4" fill="#facc15" />
        <circle cx="0" cy="0" r="12" fill="none" stroke="#0284c7" stroke-width="1.2" stroke-dasharray="3 2" />
        <text x="18" y="4" font-family="monospace" font-size="7.5" font-weight="900" fill="#0f172a">${b.name}</text>
      </g>
    `).join('\n')}

    <!-- Coastal Shipping Lane Transit Track -->
    <path d="M 420,240 Q 360,600 480,850 T 420,1340" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="12 6" />

    <!-- Bathymetric Depth Contours -->
    ${generateGuillocheBand(620, 24, 3, 8, 6, 8, 4, '#0284c7', 0.4)}
    ${generateGuillocheBand(1140, 26, 3, 10, 6, 10, 5, '#047857', 0.4)}

    ${buildSecurityFrame('#065f46', '#0284c7', 'COASTAL FREIGHT · INSHORE NAVIGATION CHANNEL')}
    `
  );

  // 20. Container Port
  backgrounds['container-port.svg'] = wrapSvg(
    'Container Port',
    `
    <linearGradient id="cp-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="40%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#cp-bg)" />

    <!-- Massive Multi-Tier Container Yard Grid Block Architecture -->
    <g transform="translate(60, 280)">
      ${Array.from({ length: 6 }).map((_, row) => {
        const y = row * 130;
        return Array.from({ length: 10 }).map((_, col) => {
          const x = col * 78;
          const colors = ['#1e3a8a', '#0284c7', '#0f766e', '#d97706', '#dc2626', '#475569'];
          const c = colors[(row * 3 + col) % colors.length];
          return `
            <rect x="${x}" y="${y}" width="72" height="42" rx="2" fill="#ffffff" stroke="${c}" stroke-width="1.8" />
            <line x1="${x + 8}" y1="${y}" x2="${x + 8}" y2="${y + 42}" stroke="${c}" stroke-width="0.8" opacity="0.6" />
            <line x1="${x + 64}" y1="${y}" x2="${x + 64}" y2="${y + 42}" stroke="${c}" stroke-width="0.8" opacity="0.6" />
            <text x="${x + 36}" y="${y + 24}" font-family="monospace" font-size="7" font-weight="900" fill="${c}" text-anchor="middle">TEU 0${row + 1}</text>
          `;
        }).join('\n');
      }).join('\n')}
    </g>

    <!-- Railhead Transfer Tracks at Base -->
    <g stroke="#0f172a" stroke-width="2.5" fill="none">
      <line x1="40" y1="1120" x2="860" y2="1120" stroke-width="5" />
      <line x1="40" y1="1136" x2="860" y2="1136" stroke-width="5" />
      ${Array.from({ length: 30 }).map((_, i) => `<line x1="${50 + i * 27}" y1="1115" x2="${50 + i * 27}" y2="1141" stroke-width="2" />`).join('\n')}
    </g>

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 10, 5, '#1e3a8a', 0.4)}
    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'CONTAINER PORT · MULTI-MODAL LOGISTICS TERMINAL')}
    `
  );

  // 21. Lighthouse Bay
  backgrounds['lighthouse-bay.svg'] = wrapSvg(
    'Lighthouse Bay',
    `
    <linearGradient id="lb-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="70%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#lb-sky)" />

    <!-- Cliffside Historic Lighthouse on the Left -->
    <g transform="translate(180, 480)">
      <!-- Cliff Base -->
      <polygon points="-120,480 60,480 40,240 -120,280" fill="#0f172a" stroke="#334155" stroke-width="2.5" />
      <!-- Lighthouse Tower (Tapered) -->
      <polygon points="-24,240 24,240 14,0 -14,0" fill="#ffffff" stroke="#0284c7" stroke-width="2.5" />
      <!-- Red Banding Stripes -->
      <polygon points="-20,180 20,180 17,130 -17,130" fill="#dc2626" />
      <polygon points="-16,80 16,80 15,40 -15,40" fill="#dc2626" />
      <!-- Lantern Room & Gallery -->
      <rect x="-22" y="-12" width="44" height="12" fill="#334155" stroke="#ffffff" stroke-width="1.5" />
      <rect x="-16" y="-36" width="32" height="24" fill="#fef08a" stroke="#0284c7" stroke-width="2" />
      <polygon points="-18,-36 0,-56 18,-36" fill="#0f172a" stroke="#ffffff" stroke-width="2" />

      <!-- Sweeping Fresnel Light Beams Across Ocean -->
      <polygon points="0,-24 720,-180 720,280" fill="#fef08a" fill-opacity="0.3" stroke="none" />
      <line x1="0" y1="-24" x2="720" y2="50" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 8" opacity="0.85" />
    </g>

    <!-- Breaking Ocean Surf Waves Guilloche Bands -->
    ${generateGuillocheBand(880, 24, 4, 10, 8, 12, 5, '#ffffff', 0.65)}
    ${generateGuillocheBand(1040, 28, 3, 12, 6, 12, 5, '#38bdf8', 0.55)}
    ${generateGuillocheBand(1220, 26, 4, 10, 8, 12, 5, '#0284c7', 0.45)}

    ${buildSecurityFrame('#0284c7', '#fef08a', 'LIGHTHOUSE BAY · NAVIGATIONAL HAZARD BEACON')}
    `
  );

  // 22. Island Channel
  backgrounds['island-channel.svg'] = wrapSvg(
    'Island Channel',
    `
    <linearGradient id="ic-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="50%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ic-sky)" />

    <!-- Strait Islands on Port & Starboard Sides -->
    <path d="M 40,240 Q 240,420 180,780 T 40,1340 Z" fill="#0f766e" fill-opacity="0.25" stroke="#0f766e" stroke-width="3" />
    <path d="M 860,240 Q 660,420 720,780 T 860,1340 Z" fill="#0f766e" fill-opacity="0.25" stroke="#0f766e" stroke-width="3" />

    <!-- Central Traffic Separation Zone (TSS) -->
    <line x1="450" y1="240" x2="450" y2="1340" stroke="#dc2626" stroke-width="5" stroke-dasharray="24 16" />
    <text x="430" y="480" font-family="monospace" font-size="9" font-weight="900" fill="#dc2626" transform="rotate(-90,430,480)" text-anchor="middle">TRAFFIC SEPARATION SCHEME · NORTHBOUND LANE</text>
    <text x="470" y="480" font-family="monospace" font-size="9" font-weight="900" fill="#0284c7" transform="rotate(90,470,480)" text-anchor="middle">TRAFFIC SEPARATION SCHEME · SOUTHBOUND LANE</text>

    <!-- Navigational Leading Lights Alignment Line -->
    ${generateGuillocheBand(740, 24, 3, 10, 6, 8, 4, '#0284c7', 0.45)}
    ${generateGuillocheBand(1180, 26, 4, 12, 7, 10, 5, '#0f766e', 0.4)}

    ${buildSecurityFrame('#0f766e', '#0284c7', 'ISLAND CHANNEL · MARITIME STRAIT PASSAGE')}
    `
  );

  // 23. Deep Blue
  backgrounds['deep-blue.svg'] = wrapSvg(
    'Deep Blue',
    `
    <linearGradient id="db-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="40%" stop-color="#0c2340" />
      <stop offset="70%" stop-color="#075985" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#db-bg)" />

    <!-- Bathymetric Ocean Trench Contours -->
    ${[380, 520, 680, 840, 1020, 1180].map((y, i) => `
      <g fill="none" stroke="#38bdf8" opacity="${round(0.3 + i * 0.08)}">
        <path d="M 40,${y} Q 280,${y - 40} 450,${y} T 860,${y - 20}" stroke-width="${round(1.5 + i * 0.4)}" />
        <text x="90" y="${y - 8}" font-family="monospace" font-size="8" font-weight="bold" fill="#38bdf8">DEPTH: -${(i + 1) * 850} METERS</text>
      </g>
    `).join('\n')}

    <!-- Nautical Graticule Grid Coordinates -->
    <g stroke="#0284c7" stroke-width="0.8" opacity="0.45">
      ${[200, 400, 600, 800, 1000, 1200].map(y => `<line x1="40" y1="${y}" x2="860" y2="${y}" stroke-dasharray="6 3" />`).join('\n')}
      ${[200, 350, 500, 650, 800].map(x => `<line x1="${x}" y1="40" x2="${x}" y2="1360" stroke-dasharray="6 3" />`).join('\n')}
    </g>

    ${generateRosette(450, 700, 180, 24, '#38bdf8', 0.45)}
    ${buildSecurityFrame('#0284c7', '#38bdf8', 'DEEP BLUE · ABYSSAL NAUTICAL BATHYMETRY')}
    `
  );

  // 24. Sunset Anchorage
  backgrounds['sunset-anchorage.svg'] = wrapSvg(
    'Sunset Anchorage',
    `
    <linearGradient id="sa-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff1f2" />
      <stop offset="40%" stop-color="#fecdd3" />
      <stop offset="70%" stop-color="#fda4af" />
      <stop offset="90%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#9f1239" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sa-sky)" />

    <!-- Golden Horizon Sun Setting into Roadstead Anchorage -->
    <ellipse cx="450" cy="540" rx="360" ry="140" fill="#ffffff" fill-opacity="0.35" />
    <circle cx="450" cy="540" r="64" fill="#ffffff" stroke="#e11d48" stroke-width="3" />
    ${generateSunburst(450, 540, 70, 320, 40, '#f43f5e', 0.45)}

    <!-- Anchored Ships on the Waterline -->
    ${[
      { x: 220, y: 550, scale: 0.75 },
      { x: 580, y: 540, scale: 0.9 },
    ].map(s => `
      <g transform="translate(${s.x},${s.y}) scale(${s.scale})">
        <path d="M -80,20 L -60,40 L 60,40 L 80,20 L 70,0 L -70,0 Z" fill="#4c0519" stroke="#fda4af" stroke-width="2" />
        <rect x="20" y="-20" width="30" height="20" fill="#ffffff" />
        <line x1="-50" y1="20" x2="-80" y2="60" stroke="#f43f5e" stroke-width="2" />
        <circle cx="-80" cy="60" r="5" fill="#f43f5e" />
      </g>
    `).join('\n')}

    <!-- Golden Sunset Water Ripples Guilloche Bands -->
    ${generateGuillocheBand(740, 22, 4, 10, 8, 12, 5, '#ffffff', 0.75)}
    ${generateGuillocheBand(920, 26, 3, 12, 6, 12, 5, '#fecdd3', 0.65)}
    ${generateGuillocheBand(1120, 28, 4, 10, 7, 12, 5, '#e11d48', 0.55)}
    ${generateGuillocheBand(1280, 24, 3, 12, 6, 10, 5, '#9f1239', 0.45)}

    ${buildSecurityFrame('#9f1239', '#f43f5e', 'SUNSET ANCHORAGE · COMMERCIAL ROADSTEAD WAITING ZONE')}
    `
  );

  return backgrounds;
}

module.exports = { getMaritimeBackgrounds };
