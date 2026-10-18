const {
  wrapSvg,
  buildSecurityFrame,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  generateTopographicContours,
  round,
} = require('../generate-document-backgrounds.cjs');

function getOverlandBackgrounds() {
  const backgrounds = {};

  // 9. Silk Road
  backgrounds['silk-road.svg'] = wrapSvg(
    'Silk Road',
    `
    <linearGradient id="sr-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="50%" stop-color="#fef3c7" />
      <stop offset="100%" stop-color="#fde68a" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sr-bg)" />
    
    <!-- Ancient & Modern Trade Route Winding Highway -->
    <path d="M 120,240 Q 280,380 450,320 T 780,480 T 320,720 T 680,950 T 240,1180 T 520,1340" fill="none" stroke="#b45309" stroke-width="8" stroke-linecap="round" />
    <path d="M 120,240 Q 280,380 450,320 T 780,480 T 320,720 T 680,950 T 240,1180 T 520,1340" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="12 6" />

    <!-- Mountain Ridge Backdrop -->
    <polygon points="40,420 180,260 340,360 520,220 680,340 860,240 860,560 40,560" fill="#d97706" fill-opacity="0.15" stroke="#92400e" stroke-width="2" />

    <!-- Historic Oasis Trading Hub Waypoints -->
    ${[
      { x: 120, y: 240, name: 'BALKH OASIS' },
      { x: 450, y: 320, name: 'KUNDUZ DEPOT' },
      { x: 780, y: 480, name: 'SAMANGAN' },
      { x: 320, y: 720, name: 'KABUL DRY PORT' },
      { x: 680, y: 950, name: 'GHAZNI HUB' },
      { x: 240, y: 1180, name: 'KANDAHAR GATE' },
      { x: 520, y: 1340, name: 'SPIN BOLDAK' },
    ].map(pt => `
      <g transform="translate(${pt.x},${pt.y})">
        <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#b45309" stroke-width="2.5" />
        <circle cx="0" cy="0" r="6" fill="#b45309" />
        <text x="0" y="28" font-family="monospace" font-size="8" font-weight="900" fill="#78350f" text-anchor="middle">${pt.name}</text>
      </g>
    `).join('\n')}

    <!-- Camel Caravan & Freight Truck Silhouettes -->
    <g fill="#78350f" opacity="0.85">
      <!-- Truck on Upper Curve -->
      <rect x="420" y="305" width="40" height="16" rx="2" />
      <circle cx="430" cy="323" r="4" fill="#ffffff" stroke="#78350f" stroke-width="2" />
      <circle cx="452" cy="323" r="4" fill="#ffffff" stroke="#78350f" stroke-width="2" />
      <!-- Truck on Lower Curve -->
      <rect x="660" y="935" width="40" height="16" rx="2" />
      <circle cx="670" cy="953" r="4" fill="#ffffff" stroke="#78350f" stroke-width="2" />
      <circle cx="692" cy="953" r="4" fill="#ffffff" stroke="#78350f" stroke-width="2" />
    </g>

    ${generateGuillocheBand(600, 24, 4, 10, 6, 8, 4, '#d97706', 0.35)}
    ${generateGuillocheBand(1240, 26, 3, 12, 6, 10, 5, '#b45309', 0.35)}

    ${buildSecurityFrame('#78350f', '#d97706', 'SILK ROAD · HISTORIC TRANS-ASIA TRADE CORRIDOR')}
    `
  );

  // 10. Desert Highway
  backgrounds['desert-highway.svg'] = wrapSvg(
    'Desert Highway',
    `
    <linearGradient id="dh-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed" />
      <stop offset="45%" stop-color="#fed7aa" />
      <stop offset="70%" stop-color="#fdba74" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#dh-sky)" />

    <!-- Low Desert Sun & Radiant Horizon Rays -->
    ${generateSunburst(450, 480, 50, 360, 44, '#ea580c', 0.45)}
    <circle cx="450" cy="480" r="50" fill="#ffffff" stroke="#c2410c" stroke-width="3" />

    <!-- Vanishing Point Highway into Desert Horizon -->
    <!-- Horizon Line -->
    <line x1="40" y1="480" x2="860" y2="480" stroke="#9a3412" stroke-width="2.5" />
    
    <!-- Highway Road Surface (Perspective Trapezoid from 450,480 to 140,1340 and 760,1340) -->
    <polygon points="445,480 455,480 760,1340 140,1340" fill="#7c2d12" fill-opacity="0.25" stroke="#9a3412" stroke-width="3" />
    
    <!-- Dashed Centerline in Perspective -->
    <line x1="450" y1="480" x2="450" y2="1340" stroke="#ffffff" stroke-width="4" stroke-dasharray="24 16" />

    <!-- Desert Sand Dune Undulations -->
    <path d="M 40,540 Q 220,500 440,540 T 860,520" stroke="#c2410c" stroke-width="2" fill="none" />
    <path d="M 40,620 Q 260,570 450,620 T 860,590" stroke="#ea580c" stroke-width="2" fill="none" />
    <path d="M 40,740 Q 200,680 420,740 T 860,700" stroke="#c2410c" stroke-width="2.2" fill="none" />

    <!-- High-Voltage Transmission Pylons along Highway -->
    <g stroke="#9a3412" stroke-width="1.8" fill="none">
      <!-- Pylon 1 -->
      <line x1="280" y1="620" x2="280" y2="820" /><line x1="240" y1="660" x2="320" y2="660" /><line x1="250" y1="710" x2="310" y2="710" />
      <!-- Pylon 2 -->
      <line x1="180" y1="840" x2="180" y2="1140" stroke-width="2.5" /><line x1="120" y1="900" x2="240" y2="900" /><line x1="140" y1="980" x2="220" y2="980" />
      <!-- Power Lines -->
      <path d="M 240,660 Q 180,780 120,900" stroke-dasharray="4 2" />
      <path d="M 320,660 Q 280,780 240,900" stroke-dasharray="4 2" />
    </g>

    <!-- Heat Shimmer Waves -->
    ${generateGuillocheBand(440, 16, 6, 6, 12, 6, 3, '#ea580c', 0.4)}
    ${buildSecurityFrame('#9a3412', '#ea580c', 'DESERT HIGHWAY · SOUTHERN REGISTAN CORRIDOR')}
    `
  );

  // 11. Border Crossing
  backgrounds['border-crossing.svg'] = wrapSvg(
    'Border Crossing',
    `
    <linearGradient id="bc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="60%" stop-color="#dbeafe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#bc-sky)" />

    <!-- Official Customs & Border Station Canopy Terminal -->
    <g transform="translate(450, 480)">
      <!-- Main Canopy Roof -->
      <rect x="-380" y="-80" width="760" height="40" rx="4" fill="#1e3a8a" />
      <rect x="-370" y="-70" width="740" height="20" fill="#2563eb" />
      <text x="0" y="-56" font-family="monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">★ INTERNATIONAL CUSTOMS BORDER TERMINAL · ISLAM QALA ★</text>

      <!-- Structural Support Pillars (4 Lanes) -->
      ${[-280, -90, 90, 280].map(x => `
        <rect x="${x - 12}" y="-40" width="24" height="260" fill="#334155" stroke="#1e293b" stroke-width="2" />
        <line x1="${x}" y1="-40" x2="${x}" y2="220" stroke="#94a3b8" stroke-width="1.5" />
      `).join('\n')}

      <!-- Lane Inspection Booths -->
      ${[-280, -90, 90, 280].map((x, i) => `
        <rect x="${x - 30}" y="100" width="60" height="120" rx="3" fill="#ffffff" stroke="#1e3a8a" stroke-width="2" />
        <rect x="${x - 22}" y="115" width="44" height="30" fill="#93c5fd" stroke="#1e40af" stroke-width="1.2" />
        <!-- Security Boom Barrier -->
        <line x1="${x + 30}" y1="180" x2="${x + 150}" y2="180" stroke="#dc2626" stroke-width="4" />
        <line x1="${x + 30}" y1="180" x2="${x + 150}" y2="180" stroke="#ffffff" stroke-width="4" stroke-dasharray="16 16" />
        <text x="${x}" y="200" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">LANE 0${i + 1}</text>
      `).join('\n')}
    </g>

    <!-- Inspection Scanner Gantry & Weighbridge Floor Markings -->
    <g stroke="#1e3a8a" stroke-width="2" fill="none">
      <rect x="120" y="820" width="660" height="320" rx="4" />
      <line x1="120" y1="980" x2="780" y2="980" stroke-dasharray="8 4" />
      <text x="450" y="860" font-family="monospace" font-size="12" font-weight="900" fill="#1e3a8a" text-anchor="middle" stroke="none">AUTOMATED X-RAY CARGO SCANNER &amp; WEIGHBRIDGE PLATFORM</text>
    </g>

    <!-- Official TIR Customs Compliance Seal -->
    <g transform="translate(450, 1060)">
      <circle cx="0" cy="0" r="54" fill="#ffffff" fill-opacity="0.9" stroke="#dc2626" stroke-width="2.5" />
      <circle cx="0" cy="0" r="44" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="4 2" />
      <text x="0" y="-8" font-family="monospace" font-size="13" font-weight="900" fill="#dc2626" text-anchor="middle">TIR CARNET</text>
      <text x="0" y="12" font-family="monospace" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">CUSTOMS PASSED</text>
      <text x="0" y="24" font-family="monospace" font-size="7" fill="#1e3a8a" text-anchor="middle">VERIFIED TRANSIT</text>
    </g>

    ${generateGuillocheBand(1280, 22, 4, 10, 6, 8, 4, '#1e3a8a', 0.35)}
    ${buildSecurityFrame('#1e3a8a', '#2563eb', 'BORDER CROSSING · CUSTOMS VERIFIED PORT OF ENTRY')}
    `
  );

  // 12. Valley Transit
  backgrounds['valley-transit.svg'] = wrapSvg(
    'Valley Transit',
    `
    <linearGradient id="vt-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff" />
      <stop offset="50%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#vt-sky)" />

    <!-- Salang Pass Canyon Walls -->
    <path d="M 40,240 Q 220,520 200,940 L 40,1340 Z" fill="#334155" fill-opacity="0.2" stroke="#1e293b" stroke-width="3" />
    <path d="M 860,240 Q 680,520 700,940 L 860,1340 Z" fill="#334155" fill-opacity="0.2" stroke="#1e293b" stroke-width="3" />

    <!-- High Mountain Viaduct Bridge Across the Gorge -->
    <g stroke="#1e3a8a" stroke-width="3" fill="none">
      <line x1="160" y1="620" x2="740" y2="620" stroke-width="12" stroke="#1e3a8a" />
      <line x1="160" y1="616" x2="740" y2="616" stroke-width="2" stroke="#ffffff" stroke-dasharray="10 5" />
      <!-- Bridge Piers -->
      <line x1="320" y1="626" x2="320" y2="1080" stroke-width="14" stroke="#475569" />
      <line x1="580" y1="626" x2="580" y2="1080" stroke-width="14" stroke="#475569" />
      <!-- Pier Cross Bracing -->
      <line x1="320" y1="740" x2="580" y2="920" stroke-width="2.5" />
      <line x1="320" y1="920" x2="580" y2="740" stroke-width="2.5" />
    </g>

    <!-- Mountain Gorge River Rushing Below Viaduct -->
    <path d="M 450,626 Q 410,880 480,1120 T 450,1340" fill="none" stroke="#0284c7" stroke-width="28" opacity="0.75" />
    <path d="M 450,626 Q 410,880 480,1120 T 450,1340" fill="none" stroke="#ffffff" stroke-width="8" stroke-dasharray="16 8" />

    <!-- Topographic Contour Lines -->
    ${generateTopographicContours(980, 1310, 6, '#1e3a8a', 0.4)}

    <!-- Salang Pass Elevation Header -->
    <g transform="translate(450, 260)">
      <rect x="-180" y="-22" width="360" height="44" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#1e3a8a" stroke-width="2" />
      <text x="0" y="5" font-family="monospace" font-size="11" font-weight="900" fill="#1e3a8a" text-anchor="middle">SALANG PASS HIGH VIADUCT · 3,363 M</text>
    </g>

    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'VALLEY TRANSIT · HIGH-ALTITUDE PASSAGE')}
    `
  );

  // 13. Cargo Convoy
  backgrounds['cargo-convoy.svg'] = wrapSvg(
    'Cargo Convoy',
    `
    <linearGradient id="cc-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#cc-bg)" />

    <!-- Multi-Vehicle Logistics Convoy in Elevation Profile -->
    ${[
      { y: 340, scale: 0.7, label: 'LEAD ESCORT #01' },
      { y: 560, scale: 1.0, label: 'PRIMARY FREIGHT #02' },
      { y: 840, scale: 1.25, label: 'HEAVY HAUL TRAILER #03' },
    ].map((item, idx) => `
      <g transform="translate(180, ${item.y}) scale(${item.scale})">
        <!-- Tractor Cab -->
        <rect x="0" y="0" width="90" height="60" rx="4" fill="#ffffff" stroke="#38bdf8" stroke-width="2" />
        <rect x="15" y="10" width="30" height="20" fill="#38bdf8" stroke="#1e40af" stroke-width="1.2" />
        <circle cx="25" cy="60" r="14" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        <circle cx="65" cy="60" r="14" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        <!-- Headlight Beams -->
        <polygon points="0,35 -140,0 -140,70 0,45" fill="#fef08a" fill-opacity="0.3" stroke="none" />
        <!-- Trailer Box -->
        <rect x="100" y="-15" width="280" height="75" rx="3" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        ${[130, 160, 190, 220, 250, 280, 310, 340].map(rx => `<line x1="${rx}" y1="-15" x2="${rx}" y2="60" stroke="#94a3b8" stroke-width="1" />`).join('\n')}
        <!-- Trailer Wheels Tri-Axle -->
        <circle cx="280" cy="60" r="14" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        <circle cx="315" cy="60" r="14" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        <circle cx="350" cy="60" r="14" fill="#ffffff" stroke="#38bdf8" stroke-width="2.5" />
        <!-- Label -->
        <text x="240" y="25" font-family="monospace" font-size="9" font-weight="900" fill="#0f172a" text-anchor="middle">SKY ARIANA FLEET · ${item.label}</text>
      </g>
    `).join('\n')}

    <!-- Road Base & Guideway Lines -->
    <line x1="40" y1="1100" x2="860" y2="1100" stroke="#38bdf8" stroke-width="3" />
    <line x1="40" y1="1110" x2="860" y2="1110" stroke="#38bdf8" stroke-width="1" stroke-dasharray="12 6" />

    ${generateGuillocheBand(1220, 24, 4, 10, 8, 10, 5, '#38bdf8', 0.4)}
    ${buildSecurityFrame('#38bdf8', '#0284c7', 'CARGO CONVOY · INTER-CITY FREIGHT SQUADRON')}
    `
  );

  // 14. Rail Corridor
  backgrounds['rail-corridor.svg'] = wrapSvg(
    'Rail Corridor',
    `
    <linearGradient id="rc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="45%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#rc-sky)" />

    <!-- Perspective Railway Tracks Converging to Center (Hairatan-Mazar Line) -->
    <!-- Vanishing Point at (450, 360) -->
    <!-- Rails -->
    <line x1="440" y1="360" x2="160" y2="1340" stroke="#0f172a" stroke-width="6" />
    <line x1="460" y1="360" x2="740" y2="1340" stroke="#0f172a" stroke-width="6" />
    <line x1="438" y1="360" x2="152" y2="1340" stroke="#38bdf8" stroke-width="1.8" />
    <line x1="462" y1="360" x2="748" y2="1340" stroke="#38bdf8" stroke-width="1.8" />

    <!-- Cross Ties / Sleepers in Perspective -->
    <g stroke="#334155" stroke-linecap="round">
      ${Array.from({ length: 28 }).map((_, i) => {
        const t = (i + 1) / 29;
        const y = 360 + Math.pow(t, 1.8) * (1340 - 360);
        const w = 20 + t * 560;
        const h = 2 + t * 8;
        return `<line x1="${450 - w / 2}" y1="${round(y)}" x2="${450 + w / 2}" y2="${round(y)}" stroke-width="${round(h)}" />`;
      }).join('\n')}
    </g>

    <!-- Catenary Overhead Electrification Gantries -->
    ${[480, 680, 960].map(y => {
      const scale = (y - 300) / 700;
      const w = 180 + scale * 380;
      const h = 100 + scale * 160;
      return `
        <g stroke="#0f172a" stroke-width="${round(1.5 + scale * 2)}" fill="none">
          <line x1="${450 - w / 2}" y1="${y - h}" x2="${450 - w / 2}" y2="${y}" />
          <line x1="${450 + w / 2}" y1="${y - h}" x2="${450 + w / 2}" y2="${y}" />
          <line x1="${450 - w / 2}" y1="${y - h}" x2="${450 + w / 2}" y2="${y - h}" />
          <circle cx="450" cy="${y - h + 15}" r="6" stroke="#0284c7" />
        </g>
      `;
    }).join('\n')}

    <!-- Header Badge -->
    <g transform="translate(450, 240)">
      <rect x="-180" y="-20" width="360" height="40" rx="4" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <text x="0" y="6" font-family="monospace" font-size="11" font-weight="900" fill="#0f172a" text-anchor="middle">TRANS-AFGHAN RAILWAY MAINLINE · 1,520 MM GAUGE</text>
    </g>

    ${generateGuillocheBand(1280, 24, 3, 10, 6, 8, 4, '#0f172a', 0.35)}
    ${buildSecurityFrame('#0f172a', '#0284c7', 'RAIL CORRIDOR · INTERMODAL HEAVY RAIL SYSTEM')}
    `
  );

  // 15. Winding Pass
  backgrounds['winding-pass.svg'] = wrapSvg(
    'Winding Pass',
    `
    <linearGradient id="wp-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="50%" stop-color="#fef3c7" />
      <stop offset="100%" stop-color="#fed7aa" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#wp-sky)" />

    <!-- Mountain Hairpin Switchbacks Ascending the Mountain (Khyber / Salang Style) -->
    <path d="M 140,280 C 780,280 780,440 220,440 C 760,440 760,620 180,620 C 780,620 780,820 160,820 C 780,820 780,1040 180,1040 C 760,1040 760,1260 220,1260 L 680,1340" fill="none" stroke="#78350f" stroke-width="12" stroke-linecap="round" />
    <path d="M 140,280 C 780,280 780,440 220,440 C 760,440 760,620 180,620 C 780,620 780,820 160,820 C 780,820 780,1040 180,1040 C 760,1040 760,1260 220,1260 L 680,1340" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="14 8" />

    <!-- Hairpin Turn Waypoint Markers & Gradient Percentages -->
    ${[
      { x: 740, y: 360, label: 'TURN #01 · 9%' },
      { x: 200, y: 530, label: 'TURN #02 · 11%' },
      { x: 740, y: 720, label: 'TURN #03 · 12%' },
      { x: 180, y: 930, label: 'TURN #04 · 10%' },
      { x: 740, y: 1150, label: 'TURN #05 · 8%' },
    ].map(m => `
      <g transform="translate(${m.x},${m.y})">
        <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
        <circle cx="0" cy="0" r="5" fill="#dc2626" />
        <text x="24" y="4" font-family="monospace" font-size="8.5" font-weight="900" fill="#78350f">${m.label}</text>
      </g>
    `).join('\n')}

    <!-- Topographic Contour Lines -->
    ${generateTopographicContours(320, 1310, 8, '#78350f', 0.25)}

    ${buildSecurityFrame('#78350f', '#d97706', 'WINDING PASS · MOUNTAIN HAIRPIN SWITCHBACK')}
    `
  );

  // 16. Horizon Route
  backgrounds['horizon-route.svg'] = wrapSvg(
    'Horizon Route',
    `
    <linearGradient id="hr-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdf4ff" />
      <stop offset="40%" stop-color="#fae8ff" />
      <stop offset="70%" stop-color="#f0abfc" />
      <stop offset="100%" stop-color="#c026d3" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#hr-sky)" />

    <!-- Golden Horizon Glow -->
    <ellipse cx="450" cy="620" rx="380" ry="120" fill="#ffffff" fill-opacity="0.4" />
    <line x1="40" y1="620" x2="860" y2="620" stroke="#86198f" stroke-width="2" />

    <!-- Infinite Straight Highway Disappearing into Sunset -->
    <polygon points="446,620 454,620 780,1340 120,1340" fill="#4a044e" fill-opacity="0.3" stroke="#86198f" stroke-width="3" />
    <line x1="450" y1="620" x2="450" y2="1340" stroke="#ffffff" stroke-width="4" stroke-dasharray="24 16" />

    <!-- Overhead Directional Sign Gantry -->
    <g transform="translate(450, 920)">
      <rect x="-240" y="-80" width="480" height="70" rx="4" fill="#047857" stroke="#ffffff" stroke-width="2.5" />
      <text x="0" y="-45" font-family="monospace" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle">TRANS-ASIA HIGHWAY AH1 // KABUL 120 KM</text>
      <text x="0" y="-25" font-family="monospace" font-size="9" font-weight="bold" fill="#a7f3d0" text-anchor="middle">SPEED LIMIT: 100 KM/H · GPS TRACKED</text>
      <!-- Gantry Steel Legs -->
      <line x1="-220" y1="-10" x2="-220" y2="280" stroke="#334155" stroke-width="8" />
      <line x1="220" y1="-10" x2="220" y2="280" stroke="#334155" stroke-width="8" />
    </g>

    ${generateGuillocheBand(1240, 24, 4, 10, 6, 10, 5, '#86198f', 0.35)}
    ${buildSecurityFrame('#701a75', '#c026d3', 'HORIZON ROUTE · INTERSTATE TRANSIT CORRIDOR')}
    `
  );

  return backgrounds;
}

module.exports = { getOverlandBackgrounds };
