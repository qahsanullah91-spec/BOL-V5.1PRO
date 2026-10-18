const {
  wrapSvg,
  buildSecurityFrame,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  round,
} = require('../generate-document-backgrounds.cjs');

function getAviationBackgrounds() {
  const backgrounds = {};

  // 25. Cloud Atlas
  backgrounds['cloud-atlas.svg'] = wrapSvg(
    'Cloud Atlas',
    `
    <linearGradient id="ca-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="40%" stop-color="#38bdf8" />
      <stop offset="75%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ca-sky)" />

    <!-- Jet Aircraft Cruising at High Altitude (450, 280) -->
    <g transform="translate(450, 280)">
      <polygon points="0,-40 14,0 90,20 18,30 18,55 35,68 0,64 -35,68 -18,55 -18,30 -90,20 -14,0" fill="#ffffff" stroke="#0369a1" stroke-width="2.5" />
      <!-- Twin Jet Engine Pods & Contrails -->
      <line x1="-35" y1="26" x2="-35" y2="480" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 8" opacity="0.8" />
      <line x1="35" y1="26" x2="35" y2="480" stroke="#ffffff" stroke-width="3" stroke-dasharray="16 8" opacity="0.8" />
    </g>

    <!-- Layered Cirrus & Cumulus Cloud Formations -->
    ${[520, 680, 860, 1040, 1220].map((y, i) => `
      <g fill="#ffffff" fill-opacity="${0.6 + i * 0.08}" stroke="#0284c7" stroke-width="1.8">
        <path d="M 40,${y} Q 180,${y - 60} 320,${y} T 600,${y - 40} T 860,${y} L 860,1340 L 40,1340 Z" />
      </g>
    `).join('\n')}

    <!-- Cloud Engraving Cross-Hatch Guilloche Waves -->
    ${generateGuillocheBand(760, 24, 3, 10, 6, 8, 4, '#0369a1', 0.35)}
    ${generateGuillocheBand(1120, 26, 4, 12, 7, 10, 5, '#0284c7', 0.35)}

    ${buildSecurityFrame('#0369a1', '#38bdf8', 'CLOUD ATLAS · HIGH ALTITUDE ATMOSPHERIC CORRIDOR')}
    `
  );

  // 26. Flight Corridor
  backgrounds['flight-corridor.svg'] = wrapSvg(
    'Flight Corridor',
    `
    <linearGradient id="fc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#fc-sky)" />

    <!-- Master VOR / DME Radio Navigation Rose in Center -->
    ${generateRosette(450, 480, 180, 36, '#38bdf8', 0.55)}
    ${generateSunburst(450, 480, 180, 260, 36, '#60a5fa', 0.4)}

    <!-- Airway Corridors Intersecting at VOR Station -->
    <!-- Airway 1 (Diagonal Left to Right) -->
    <line x1="80" y1="180" x2="820" y2="780" stroke="#38bdf8" stroke-width="4" stroke-dasharray="16 8" />
    <text x="740" y="740" font-family="monospace" font-size="10" font-weight="900" fill="#38bdf8">AIRWAY G111 · FL 380</text>
    
    <!-- Airway 2 (Diagonal Right to Left) -->
    <line x1="820" y1="180" x2="80" y2="780" stroke="#60a5fa" stroke-width="4" stroke-dasharray="16 8" />
    <text x="160" y="740" font-family="monospace" font-size="10" font-weight="900" fill="#60a5fa">AIRWAY M875 · FL 410</text>

    <!-- Waypoint Reporting Triangles -->
    ${[
      { x: 260, y: 320, name: 'KABUL VOR (KBL)' },
      { x: 640, y: 320, name: 'PARIS WAYPOINT' },
      { x: 450, y: 480, name: 'INTERSECTION FIX' },
      { x: 260, y: 640, name: 'DUBAI WAYPOINT' },
      { x: 640, y: 640, name: 'DELHI CORRIDOR' },
    ].map(w => `
      <g transform="translate(${w.x},${w.y})">
        <polygon points="0,-16 14,10 -14,10" fill="#ffffff" stroke="#0284c7" stroke-width="2" />
        <circle cx="0" cy="0" r="4" fill="#0284c7" />
        <text x="0" y="26" font-family="monospace" font-size="8.5" font-weight="900" fill="#ffffff" text-anchor="middle">${w.name}</text>
      </g>
    `).join('\n')}

    <!-- Radar Range Sweep Concentric Rings -->
    ${[320, 440, 560].map(r => `<circle cx="450" cy="480" r="${r}" fill="none" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 8" opacity="0.4" />`).join('\n')}

    ${generateGuillocheBand(1220, 24, 4, 10, 8, 12, 5, '#38bdf8', 0.4)}
    ${buildSecurityFrame('#38bdf8', '#60a5fa', 'FLIGHT CORRIDOR · ICAO EN-ROUTE RADIONAVIGATION')}
    `
  );

  // 27. Sky Express
  backgrounds['sky-express.svg'] = wrapSvg(
    'Sky Express',
    `
    <linearGradient id="se-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="40%" stop-color="#312e81" />
      <stop offset="75%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#se-sky)" />

    <!-- Jet Climbing Steeply at High Speed (Ascending Right to Left) -->
    <g transform="translate(450, 480) rotate(-35)">
      <polygon points="0,-70 20,-10 140,25 25,40 25,75 48,95 0,90 -48,95 -25,75 -25,40 -140,25 -20,-10" fill="#ffffff" stroke="#38bdf8" stroke-width="3" />
      <!-- Cockpit Windows -->
      <polygon points="-8,-45 8,-45 12,-35 -12,-35" fill="#38bdf8" />
      <!-- Aerodynamic Speed Streamlines -->
      ${Array.from({ length: 12 }).map((_, i) => {
        const offset = (i - 6) * 24;
        return `<line x1="${offset}" y1="110" x2="${offset}" y2="${380 + Math.abs(offset) * 2}" stroke="#60a5fa" stroke-width="2" stroke-dasharray="16 8" opacity="0.75" />`;
      }).join('\n')}
    </g>

    <!-- Runway Lighting Grid Below Aircraft -->
    <g stroke="#fde047" stroke-width="2" opacity="0.65">
      ${Array.from({ length: 16 }).map((_, i) => {
        const y = 980 + i * 22;
        return `<line x1="320" y1="${y}" x2="580" y2="${y}" stroke-dasharray="8 4" /><circle cx="320" cy="${y}" r="3" fill="#fde047" /><circle cx="580" cy="${y}" r="3" fill="#fde047" />`;
      }).join('\n')}
    </g>

    ${generateGuillocheBand(1280, 24, 4, 10, 8, 10, 5, '#38bdf8', 0.45)}
    ${buildSecurityFrame('#38bdf8', '#818cf8', 'SKY EXPRESS · RAPID AIR FREIGHT CLIMB-OUT')}
    `
  );

  // 28. Dawn Departure
  backgrounds['dawn-departure.svg'] = wrapSvg(
    'Dawn Departure',
    `
    <linearGradient id="dd-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fff7ed" />
      <stop offset="35%" stop-color="#ffedd5" />
      <stop offset="65%" stop-color="#fdba74" />
      <stop offset="85%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#9a3412" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#dd-sky)" />

    <!-- Sunrise Horizon Disk on Airport Runway -->
    <circle cx="450" cy="560" r="70" fill="#ffffff" stroke="#ea580c" stroke-width="3" />
    ${generateSunburst(450, 560, 75, 340, 40, '#f97316', 0.45)}

    <!-- Aircraft Rotating Off Runway into Sun -->
    <g transform="translate(450, 480)">
      <polygon points="0,-45 16,0 120,25 22,35 22,65 42,80 0,75 -42,80 -22,65 -22,35 -120,25 -16,0" fill="#ffffff" stroke="#c2410c" stroke-width="2.5" />
      <line x1="-30" y1="35" x2="-30" y2="280" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="14 7" opacity="0.8" />
      <line x1="30" y1="35" x2="30" y2="280" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="14 7" opacity="0.8" />
    </g>

    <!-- Airport Air Traffic Control Tower (Silhouette on Left) -->
    <g transform="translate(180, 540)" fill="#431407" stroke="#7c2d12" stroke-width="1.8">
      <rect x="-14" y="0" width="28" height="260" />
      <!-- Cab -->
      <polygon points="-30,-40 30,-40 22,0 -22,0" fill="#ffffff" />
      <rect x="-34" y="-55" width="68" height="15" fill="#431407" />
      <!-- Radar Dome -->
      <circle cx="0" cy="-70" r="14" fill="#ffffff" />
    </g>

    <!-- Runway Threshold & Centerline Lights -->
    <polygon points="440,560 460,560 760,1340 140,1340" fill="#431407" fill-opacity="0.3" stroke="#9a3412" stroke-width="3" />
    <line x1="450" y1="560" x2="450" y2="1340" stroke="#ffffff" stroke-width="5" stroke-dasharray="24 16" />

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 10, 5, '#ea580c', 0.45)}
    ${buildSecurityFrame('#9a3412', '#ea580c', 'DAWN DEPARTURE · EARLY MORNING FLIGHT DISPATCH')}
    `
  );

  // 29. Air Bridge
  backgrounds['air-bridge.svg'] = wrapSvg(
    'Air Bridge',
    `
    <linearGradient id="ab-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="50%" stop-color="#bfdbfe" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ab-sky)" />

    <!-- Orthographic Earth Globe Horizon Curve Across Center -->
    <ellipse cx="450" cy="1100" rx="600" ry="420" fill="#ffffff" fill-opacity="0.25" stroke="#1e3a8a" stroke-width="3" />
    <ellipse cx="450" cy="1100" rx="580" ry="400" fill="none" stroke="#2563eb" stroke-width="1" stroke-dasharray="6 3" />

    <!-- Massive Great-Circle Intercontinental Air Bridge Arcs -->
    <path d="M 120,950 Q 450,220 780,950" fill="none" stroke="#dc2626" stroke-width="4" stroke-dasharray="16 8" />
    <path d="M 180,980 Q 450,340 720,980" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="12 6" />
    
    <!-- Aircraft Flying on the Air Bridge Arc -->
    <g transform="translate(450, 380)">
      <polygon points="0,-40 14,0 90,20 18,30 18,55 35,68 0,64 -35,68 -18,55 -18,30 -90,20 -14,0" fill="#ffffff" stroke="#dc2626" stroke-width="2.5" />
      <text x="0" y="-55" font-family="monospace" font-size="10" font-weight="900" fill="#dc2626" text-anchor="middle">AIR CARGO FREIGHTER · FLIGHT SA-902</text>
    </g>

    <!-- Terminal Hub Waypoint Badges -->
    <g transform="translate(120, 950)">
      <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5" />
      <text x="0" y="28" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">DUBAI (DXB)</text>
    </g>
    <g transform="translate(780, 950)">
      <circle cx="0" cy="0" r="16" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5" />
      <text x="0" y="28" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">KABUL (KBL)</text>
    </g>

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 12, 5, '#1e3a8a', 0.4)}
    ${buildSecurityFrame('#1e3a8a', '#2563eb', 'AIR BRIDGE · INTERCONTINENTAL CARGO BRIDGE')}
    `
  );

  // 30. Above the Clouds
  backgrounds['above-the-clouds.svg'] = wrapSvg(
    'Above the Clouds',
    `
    <linearGradient id="atc-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="30%" stop-color="#0c2340" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="85%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#atc-sky)" />

    <!-- Stratospheric High Altitude Jet Wing in Perspective -->
    <g transform="translate(180, 280)">
      <!-- Swept Wing Leading Edge -->
      <polygon points="0,320 540,80 500,40 -20,240" fill="#ffffff" stroke="#0284c7" stroke-width="2.5" />
      <!-- Winglet Tip -->
      <polygon points="500,40 540,80 550,-10 520,-20" fill="#38bdf8" stroke="#0284c7" stroke-width="1.8" />
      <!-- Engine Nacelle Under Wing -->
      <ellipse cx="260" cy="240" rx="55" ry="32" fill="#e2e8f0" stroke="#0369a1" stroke-width="2.5" />
      <circle cx="230" cy="240" r="28" fill="#0f172a" />
      <circle cx="230" cy="240" r="10" fill="#ffffff" />
    </g>

    <!-- Sea of Billowing Clouds Below (Guilloche Cloud Waves) -->
    ${generateGuillocheBand(780, 30, 3, 14, 6, 12, 6, '#ffffff', 0.9)}
    ${generateGuillocheBand(960, 34, 4, 16, 7, 12, 6, '#f1f5f9', 0.9)}
    ${generateGuillocheBand(1160, 32, 3, 14, 6, 12, 6, '#e2e8f0', 0.85)}

    ${buildSecurityFrame('#0284c7', '#38bdf8', 'ABOVE THE CLOUDS · STRATOSPHERIC CRUISE FL410')}
    `
  );

  // 31. Global Flight
  backgrounds['global-flight.svg'] = wrapSvg(
    'Global Flight',
    `
    <linearGradient id="gf-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#gf-sky)" />

    <!-- Worldwide Aeronautical Graticule Grid -->
    <g stroke="#38bdf8" stroke-width="1" opacity="0.35">
      ${[200, 360, 520, 680, 840, 1000, 1160].map(y => `<line x1="40" y1="${y}" x2="860" y2="${y}" stroke-dasharray="6 3" />`).join('\n')}
      ${[180, 320, 460, 600, 740].map(x => `<line x1="${x}" y1="40" x2="${x}" y2="1360" stroke-dasharray="6 3" />`).join('\n')}
    </g>

    <!-- 3 Interlocking Master Navigation Rose Seals -->
    ${generateRosette(260, 480, 120, 24, '#38bdf8', 0.5)}
    ${generateRosette(640, 480, 120, 24, '#38bdf8', 0.5)}
    ${generateRosette(450, 840, 160, 32, '#60a5fa', 0.55)}

    <!-- Global Air Routes Network Arcs -->
    <path d="M 120,380 Q 450,140 780,380" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="14 7" />
    <path d="M 120,780 Q 450,540 780,780" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="12 6" />
    <path d="M 260,480 Q 450,840 640,480" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="10 5" />

    <!-- Hub Badges -->
    ${[
      { x: 260, y: 480, name: 'EUROPE / IST' },
      { x: 640, y: 480, name: 'ASIA / DEL' },
      { x: 450, y: 840, name: 'CENTRAL / KBL' },
    ].map(h => `
      <g transform="translate(${h.x},${h.y})">
        <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5" />
        <circle cx="0" cy="0" r="6" fill="#1e3a8a" />
        <text x="0" y="34" font-family="monospace" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">${h.name}</text>
      </g>
    `).join('\n')}

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 12, 5, '#38bdf8', 0.45)}
    ${buildSecurityFrame('#38bdf8', '#0284c7', 'GLOBAL FLIGHT · INTERNATIONAL AVIATION SECURITY')}
    `
  );

  // 32. Evening Arrival
  backgrounds['evening-arrival.svg'] = wrapSvg(
    'Evening Arrival',
    `
    <linearGradient id="ea-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="35%" stop-color="#2e1065" />
      <stop offset="65%" stop-color="#581c87" />
      <stop offset="85%" stop-color="#9333ea" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ea-sky)" />

    <!-- Aircraft on Glide Slope on Final Approach (Landing Gear Down) -->
    <g transform="translate(450, 480)">
      <polygon points="0,-45 16,0 120,25 22,35 22,65 42,80 0,75 -42,80 -22,65 -22,35 -120,25 -16,0" fill="#ffffff" stroke="#c084fc" stroke-width="2.5" />
      <!-- Deployed Landing Gear -->
      <line x1="-35" y1="35" x2="-35" y2="60" stroke="#ffffff" stroke-width="3" />
      <circle cx="-35" cy="62" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <line x1="35" y1="35" x2="35" y2="60" stroke="#ffffff" stroke-width="3" />
      <circle cx="35" cy="62" r="5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <!-- ILS Glideslope Beam Guideline -->
      <line x1="0" y1="75" x2="0" y2="520" stroke="#fde047" stroke-width="3" stroke-dasharray="16 8" />
    </g>

    <!-- Precision Runway PAPI Light Array (2 Red / 2 White) -->
    <g transform="translate(320, 880)">
      <circle cx="-30" cy="0" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
      <circle cx="-10" cy="0" r="8" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
      <circle cx="10" cy="0" r="8" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
      <circle cx="30" cy="0" r="8" fill="#ffffff" stroke="#ffffff" stroke-width="2" />
      <text x="0" y="24" font-family="monospace" font-size="7.5" font-weight="900" fill="#fde047" text-anchor="middle">PAPI GLIDESLOPE ON-PATH</text>
    </g>

    <!-- Runway Lighting Grid -->
    <polygon points="440,780 460,780 740,1340 160,1340" fill="#0f172a" fill-opacity="0.5" stroke="#9333ea" stroke-width="3" />
    <line x1="450" y1="780" x2="450" y2="1340" stroke="#ffffff" stroke-width="4" stroke-dasharray="24 16" />

    ${generateGuillocheBand(1240, 24, 4, 10, 8, 10, 5, '#c084fc', 0.45)}
    ${buildSecurityFrame('#581c87', '#c084fc', 'EVENING ARRIVAL · RUNWAY ILS GLIDESLOPE TOUCHDOWN')}
    `
  );

  return backgrounds;
}

module.exports = { getAviationBackgrounds };
