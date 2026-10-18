const {
  wrapSvg,
  buildSecurityFrame,
  generateGuillocheBand,
  generateRosette,
  generateSunburst,
  generateTopographicContours,
  round,
} = require('../generate-document-backgrounds.cjs');

function getMountainBackgrounds() {
  const backgrounds = {};

  // 1. Alpine Dawn
  backgrounds['alpine-dawn.svg'] = wrapSvg(
    'Alpine Dawn',
    `
    <linearGradient id="ad-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="40%" stop-color="#fef3c7" />
      <stop offset="70%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
    <linearGradient id="ad-peak1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#dbeafe" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="ad-peak2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bfdbfe" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.4" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ad-sky)" />
    
    <!-- Background Guilloche Waves -->
    ${generateGuillocheBand(260, 24, 4, 12, 8, 8, 4, '#d97706', 0.25)}
    ${generateGuillocheBand(1180, 28, 3, 14, 6, 12, 5, '#1e3a8a', 0.3)}

    <!-- Rising Sunburst (Center 580, 480) -->
    ${generateSunburst(580, 480, 60, 280, 40, '#f59e0b', 0.45)}
    <circle cx="580" cy="480" r="58" fill="#ffffff" stroke="#d97706" stroke-width="2.5" />
    <circle cx="580" cy="480" r="44" fill="#fef3c7" stroke="#b45309" stroke-width="1.2" stroke-dasharray="4 2" />

    <!-- Mountain Layer 1 (Far High Hindu Kush Ridges) -->
    <polygon points="40,680 160,420 280,520 450,340 600,490 730,320 860,560 860,780 40,780" fill="url(#ad-peak1)" stroke="#1e3a8a" stroke-width="2.5" />
    <!-- Mountain Facet Shading & Snow Crevasses -->
    <g stroke="#0284c7" stroke-width="1.2" opacity="0.75">
      <line x1="730" y1="320" x2="710" y2="580" /><line x1="730" y1="320" x2="765" y2="530" />
      <line x1="450" y1="340" x2="420" y2="600" /><line x1="450" y1="340" x2="495" y2="550" />
      <line x1="160" y1="420" x2="190" y2="620" /><line x1="160" y1="420" x2="140" y2="560" />
    </g>
    <text x="730" y="305" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">NOSHAQ 7,492 M</text>
    <text x="450" y="325" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">TIRICH MIR 7,708 M</text>

    <!-- Mountain Layer 2 (Mid-Range Rugged Ridges) -->
    <polygon points="40,820 150,650 300,740 470,580 630,710 780,600 860,730 860,940 40,940" fill="url(#ad-peak2)" stroke="#1e3a8a" stroke-width="2.2" />
    
    <!-- Foothill Pine Forest Silhouettes -->
    <g fill="#1e3a8a" opacity="0.35">
      ${Array.from({ length: 24 }).map((_, i) => {
        const x = 60 + i * 34;
        const y = 920 + (i % 3) * 12;
        return `<polygon points="${x},${y - 25} ${x - 10},${y} ${x + 10},${y}" />`;
      }).join('\n')}
    </g>

    <!-- Topographic Contour Lines -->
    ${generateTopographicContours(960, 1310, 8, '#1e3a8a', 0.45)}

    <!-- Geodetic Survey Benchmark Stamp -->
    <g transform="translate(220, 240)">
      <circle cx="0" cy="0" r="64" fill="#ffffff" fill-opacity="0.9" stroke="#1e3a8a" stroke-width="2" />
      <circle cx="0" cy="0" r="54" fill="none" stroke="#d97706" stroke-width="1" stroke-dasharray="4 2" />
      <polygon points="0,-16 -14,10 14,10" fill="none" stroke="#1e3a8a" stroke-width="1.8" />
      <circle cx="0" cy="0" r="3.5" fill="#d97706" />
      <text x="0" y="24" font-family="monospace" font-size="7.5" font-weight="900" fill="#1e3a8a" text-anchor="middle">ALPINE GEODETIC SURVEY</text>
      <text x="0" y="36" font-family="monospace" font-size="6.5" font-weight="bold" fill="#0284c7" text-anchor="middle">HINDU KUSH CORRIDOR</text>
    </g>

    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'ALPINE DAWN · HINDU KUSH GEODETIC SECURITY')}
    `
  );

  // 2. Glacier Valley
  backgrounds['glacier-valley.svg'] = wrapSvg(
    'Glacier Valley',
    `
    <linearGradient id="gv-sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0fdfa" />
      <stop offset="50%" stop-color="#ccfbf1" />
      <stop offset="100%" stop-color="#99f6e4" />
    </linearGradient>
    <linearGradient id="gv-ice" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#a5f3fc" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#gv-sky)" />
    ${generateGuillocheBand(200, 20, 5, 10, 10, 8, 4, '#0f766e', 0.25)}
    
    <!-- U-Shaped Glacial Valley Walls -->
    <!-- Left Canyon Wall -->
    <path d="M 40,240 Q 180,480 200,820 L 250,1320 L 40,1320 Z" fill="#ffffff" fill-opacity="0.8" stroke="#0f766e" stroke-width="2.5" />
    <!-- Right Canyon Wall -->
    <path d="M 860,240 Q 720,480 700,820 L 650,1320 L 860,1320 Z" fill="#ffffff" fill-opacity="0.8" stroke="#0f766e" stroke-width="2.5" />
    
    <!-- Rock Strata Hatching on Walls -->
    <g stroke="#0d9488" stroke-width="1.2" opacity="0.6">
      <line x1="40" y1="360" x2="160" y2="460" /><line x1="40" y1="520" x2="185" y2="620" />
      <line x1="40" y1="680" x2="195" y2="780" /><line x1="40" y1="840" x2="215" y2="940" />
      <line x1="860" y1="360" x2="740" y2="460" /><line x1="860" y1="520" x2="715" y2="620" />
      <line x1="860" y1="680" x2="705" y2="780" /><line x1="860" y1="840" x2="685" y2="940" />
    </g>

    <!-- Braided Turquoise Glacial Meltwater River -->
    <path d="M 450,340 Q 430,550 470,750 T 430,1050 T 450,1330" fill="none" stroke="#0284c7" stroke-width="16" stroke-linecap="round" opacity="0.75" />
    <path d="M 450,340 Q 430,550 470,750 T 430,1050 T 450,1330" fill="none" stroke="#ffffff" stroke-width="6" stroke-dasharray="16 8" opacity="0.9" />

    <!-- Glacial Crevasse Arcs -->
    ${generateGuillocheBand(650, 30, 2, 8, 4, 10, 8, '#0891b2', 0.4)}
    ${generateGuillocheBand(920, 24, 3, 10, 6, 10, 8, '#0891b2', 0.4)}

    <!-- Valley Contour Lines -->
    ${generateTopographicContours(1020, 1320, 6, '#0f766e', 0.4)}

    <!-- Header Badge -->
    <g transform="translate(450, 180)">
      <rect x="-180" y="-22" width="360" height="44" rx="4" fill="#ffffff" fill-opacity="0.92" stroke="#0f766e" stroke-width="2" />
      <text x="0" y="6" font-family="monospace" font-size="11" font-weight="900" fill="#0f766e" text-anchor="middle">WAKHAN GLACIER VALLEY CORRIDOR</text>
    </g>

    ${buildSecurityFrame('#0f766e', '#0284c7', 'GLACIER VALLEY · TRANS-HIMALAYAN TRANSIT')}
    `
  );

  // 3. Snow Ridge
  backgrounds['snow-ridge.svg'] = wrapSvg(
    'Snow Ridge',
    `
    <linearGradient id="sr-sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f9ff" />
      <stop offset="50%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sr-sky)" />

    <!-- Central Razor-Sharp Mountain Arête Spine -->
    <path d="M 450,140 Q 410,380 480,620 T 420,950 T 470,1340" fill="none" stroke="#1e3a8a" stroke-width="5" />
    
    <!-- Leeward Ridge Facet (Left Shadow) -->
    <path d="M 450,140 Q 410,380 480,620 T 420,950 T 470,1340 L 40,1340 L 40,140 Z" fill="#1e3a8a" fill-opacity="0.14" />
    <!-- Windward Ridge Facet (Right Bright Snow) -->
    <path d="M 450,140 Q 410,380 480,620 T 420,950 T 470,1340 L 860,1340 L 860,140 Z" fill="#ffffff" fill-opacity="0.6" />

    <!-- High-Altitude Wind Jetstream Cross-Hatch Lines -->
    <g stroke="#0284c7" stroke-width="1.2" opacity="0.5">
      ${Array.from({ length: 22 }).map((_, i) => {
        const y = 180 + i * 50;
        return `<line x1="80" y1="${y}" x2="430" y2="${y + 20}" stroke-dasharray="8 4" /><line x1="490" y1="${y + 20}" x2="820" y2="${y + 40}" />`;
      }).join('\n')}
    </g>

    <!-- Altitude Waypoint Badges -->
    <g transform="translate(480, 420)">
      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
      <circle cx="0" cy="0" r="5" fill="#dc2626" />
      <text x="24" y="4" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a">HIGH RIDGE CAMP IV · 7,200 M</text>
    </g>
    <g transform="translate(420, 820)">
      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
      <circle cx="0" cy="0" r="5" fill="#dc2626" />
      <text x="24" y="4" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a">SNOW SADDLE CAMP III · 6,400 M</text>
    </g>

    ${generateGuillocheBand(1180, 24, 4, 10, 8, 10, 5, '#1e3a8a', 0.35)}
    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'SNOW RIDGE · HINDU KUSH SUMMIT CREST')}
    `
  );

  // 4. Highland Lake
  backgrounds['highland-lake.svg'] = wrapSvg(
    'Highland Lake',
    `
    <linearGradient id="hl-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff" />
      <stop offset="45%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="hl-water" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.2" />
      <stop offset="50%" stop-color="#0369a1" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0c4a6e" stop-opacity="0.6" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#hl-sky)" />

    <!-- Encircling Canyon Mountain Ridges -->
    <polygon points="40,540 180,360 340,460 480,310 620,440 760,340 860,520 860,680 40,680" fill="#ffffff" fill-opacity="0.9" stroke="#1e3a8a" stroke-width="2.5" />
    <g stroke="#0284c7" stroke-width="1.2" opacity="0.7">
      <line x1="480" y1="310" x2="460" y2="520" /><line x1="480" y1="310" x2="520" y2="490" />
      <line x1="180" y1="360" x2="210" y2="520" /><line x1="760" y1="340" x2="730" y2="520" />
    </g>

    <!-- Band-e Amir Alpine Crater Lake Surface -->
    <ellipse cx="450" cy="940" rx="380" ry="240" fill="url(#hl-water)" stroke="#0284c7" stroke-width="3" />
    
    <!-- Concentric Ripple Guilloche Waves -->
    ${generateGuillocheBand(840, 18, 5, 8, 10, 8, 4, '#38bdf8', 0.5)}
    ${generateGuillocheBand(940, 22, 4, 10, 8, 10, 5, '#ffffff', 0.6)}
    ${generateGuillocheBand(1040, 18, 5, 8, 10, 8, 4, '#38bdf8', 0.5)}

    <!-- Inverted Mirror Peak Reflection -->
    <path d="M 160,940 L 260,1080 L 380,980 L 480,1140 L 580,1020 L 700,1090 L 780,940" stroke="#bae6fd" stroke-width="2" fill="none" opacity="0.6" stroke-dasharray="6 3" />

    <!-- Travertine Barrier Wall Cascade -->
    <path d="M 120,1180 Q 450,1220 780,1180" stroke="#0f766e" stroke-width="4" fill="none" />
    <g stroke="#38bdf8" stroke-width="1.2" opacity="0.6">
      ${Array.from({ length: 18 }).map((_, i) => `<line x1="${160 + i * 34}" y1="1185" x2="${160 + i * 34}" y2="1240" stroke-dasharray="4 2" />`).join('\n')}
    </g>

    <!-- Lake Stamp Badge -->
    <g transform="translate(450, 1280)">
      <rect x="-180" y="-18" width="360" height="36" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#1e3a8a" stroke-width="1.8" />
      <text x="0" y="5" font-family="monospace" font-size="9" font-weight="900" fill="#1e3a8a" text-anchor="middle">BAND-E AMIR NATIONAL HIGH ALPINE LAKES · 2,900 M</text>
    </g>

    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'HIGHLAND LAKE · BAND-E AMIR SECURITY')}
    `
  );

  // 5. Golden Summit
  backgrounds['golden-summit.svg'] = wrapSvg(
    'Golden Summit',
    `
    <linearGradient id="gs-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="50%" stop-color="#fef3c7" />
      <stop offset="100%" stop-color="#fed7aa" />
    </linearGradient>
    <linearGradient id="gs-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#gs-sky)" />

    <!-- Grand Solar Sunburst Aura Behind Summit -->
    ${generateSunburst(450, 520, 80, 420, 48, '#d97706', 0.45)}
    <circle cx="450" cy="520" r="90" fill="none" stroke="#d97706" stroke-width="2" opacity="0.6" />
    <circle cx="450" cy="520" r="140" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="6 3" opacity="0.5" />
    <circle cx="450" cy="520" r="220" fill="none" stroke="#d97706" stroke-width="0.8" opacity="0.35" />

    <!-- Monumental Golden Pyramid Peak -->
    <polygon points="450,280 200,940 700,940" fill="url(#gs-gold)" stroke="#78350f" stroke-width="3" fill-opacity="0.85" />
    
    <!-- Ridge Face Division & Intaglio Engraving Lines -->
    <line x1="450" y1="280" x2="450" y2="940" stroke="#78350f" stroke-width="3.5" />
    <polygon points="450,280 200,940 450,940" fill="#78350f" fill-opacity="0.25" />

    <g stroke="#fef3c7" stroke-width="1.5" opacity="0.75">
      ${Array.from({ length: 16 }).map((_, i) => {
        const y = 340 + i * 36;
        const xOffset = (y - 280) * 0.36;
        return `<line x1="${450 - xOffset}" y1="${y}" x2="450" y2="${y}" /><line x1="450" y1="${y}" x2="${450 + xOffset}" y2="${y}" stroke="#78350f" />`;
      }).join('\n')}
    </g>

    <!-- Summit Altimetry Emblem -->
    <g transform="translate(450, 240)">
      <polygon points="0,-20 18,12 -18,12" fill="#d97706" />
      <text x="0" y="-28" font-family="monospace" font-size="11" font-weight="900" fill="#78350f" text-anchor="middle">NOSHAQ GOLDEN SUMMIT</text>
      <text x="0" y="32" font-family="monospace" font-size="9" font-weight="bold" fill="#b45309" text-anchor="middle">ELEVATION 7,492 M // 24,580 FT</text>
    </g>

    ${generateGuillocheBand(1140, 26, 4, 12, 6, 12, 5, '#b45309', 0.4)}
    ${buildSecurityFrame('#78350f', '#d97706', 'GOLDEN SUMMIT · HIGHEST AFGHAN ELEVATION')}
    `
  );

  // 6. Silent Peaks
  backgrounds['silent-peaks.svg'] = wrapSvg(
    'Silent Peaks',
    `
    <linearGradient id="sp-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="40%" stop-color="#1e293b" />
      <stop offset="70%" stop-color="#334155" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sp-sky)" />

    <!-- Starry Midnight Sky & Moon Crescent -->
    <g fill="#ffffff" opacity="0.8">
      ${Array.from({ length: 40 }).map((_, i) => {
        const x = 60 + (i * 97) % 780;
        const y = 80 + (i * 53) % 400;
        const r = (i % 3 === 0) ? 2 : 1.2;
        return `<circle cx="${x}" cy="${y}" r="${r}" />`;
      }).join('\n')}
    </g>
    <!-- Silver Crescent Moon -->
    <path d="M 720,180 A 36,36 0 1 0 760,240 A 30,30 0 1 1 720,180 Z" fill="#f8fafc" opacity="0.9" />

    <!-- 5 Tier Cascading Himalayan Mountain Ridges -->
    <polygon points="40,640 180,440 340,560 520,380 680,520 860,400 860,820 40,820" fill="#334155" stroke="#94a3b8" stroke-width="1.8" />
    <polygon points="40,760 140,580 300,680 480,500 660,660 800,540 860,640 860,940 40,940" fill="#1e293b" stroke="#cbd5e1" stroke-width="2" />
    <polygon points="40,880 200,720 380,840 560,680 720,800 860,690 860,1080 40,1080" fill="#0f172a" stroke="#e2e8f0" stroke-width="2.2" />

    <!-- Rolling Valley Mist Guilloche Bands Between Peaks -->
    ${generateGuillocheBand(680, 20, 4, 8, 8, 8, 4, '#cbd5e1', 0.4)}
    ${generateGuillocheBand(820, 22, 3, 10, 6, 8, 4, '#e2e8f0', 0.45)}
    ${generateGuillocheBand(1200, 26, 3, 12, 6, 12, 5, '#94a3b8', 0.35)}

    ${buildSecurityFrame('#334155', '#94a3b8', 'SILENT PEAKS · NOCTURNAL HIMALAYAN RIDGES')}
    `
  );

  // 7. Mountain Mist
  backgrounds['mountain-mist.svg'] = wrapSvg(
    'Mountain Mist',
    `
    <linearGradient id="mm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="50%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#mm-sky)" />

    <!-- Towering Granite Needle Pinnacles / Trango Towers Style Spires -->
    <g fill="#475569" stroke="#0f172a" stroke-width="2">
      <!-- Spire 1 (Left) -->
      <polygon points="220,180 190,920 260,920" />
      <!-- Spire 2 (Center Master Tower) -->
      <polygon points="450,110 405,1020 500,1020" fill="#334155" />
      <!-- Spire 3 (Right) -->
      <polygon points="680,220 645,920 720,920" />
    </g>

    <!-- Vertical Rock Stratum Fissures on Spires -->
    <g stroke="#94a3b8" stroke-width="1.2" opacity="0.65">
      <line x1="450" y1="110" x2="450" y2="1020" />
      <line x1="430" y1="320" x2="435" y2="980" />
      <line x1="470" y1="320" x2="465" y2="980" />
      <line x1="220" y1="180" x2="225" y2="920" />
      <line x1="680" y1="220" x2="680" y2="920" />
    </g>

    <!-- 8 Dense Undulating Valley Fog Guilloche Bands Sweeping Across Spires -->
    ${generateGuillocheBand(420, 32, 3, 14, 6, 8, 4, '#ffffff', 0.85)}
    ${generateGuillocheBand(580, 36, 2, 16, 5, 10, 5, '#ffffff', 0.9)}
    ${generateGuillocheBand(740, 40, 3, 18, 4, 12, 6, '#f1f5f9', 0.9)}
    ${generateGuillocheBand(920, 34, 4, 14, 7, 10, 5, '#e2e8f0', 0.85)}

    <!-- Foothill Forest Band at Bottom -->
    ${generateTopographicContours(1080, 1320, 6, '#334155', 0.45)}

    ${buildSecurityFrame('#334155', '#64748b', 'MOUNTAIN MIST · ATMOSPHERIC GRANITE SPIRES')}
    `
  );

  // 8. Twilight Range
  backgrounds['twilight-range.svg'] = wrapSvg(
    'Twilight Range',
    `
    <linearGradient id="tr-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="35%" stop-color="#312e81" />
      <stop offset="65%" stop-color="#6b21a8" />
      <stop offset="85%" stop-color="#c026d3" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#tr-sky)" />

    <!-- Brilliant Evening Star (Venus) -->
    <g transform="translate(680, 220)">
      <circle cx="0" cy="0" r="8" fill="#ffffff" />
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#ffffff" stroke-width="1.8" />
      <line x1="0" y1="-30" x2="0" y2="30" stroke="#ffffff" stroke-width="1.8" />
      <circle cx="0" cy="0" r="22" fill="none" stroke="#f472b6" stroke-width="0.8" opacity="0.6" />
    </g>

    <!-- Celestial Navigational Graticule Arc -->
    <path d="M 80,480 Q 450,220 820,480" fill="none" stroke="#f472b6" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.55" />

    <!-- Jagged Twilight Ridge Silhouettes Backlit by Sunset -->
    <polygon points="40,780 180,560 320,680 480,490 620,640 760,510 860,680 860,980 40,980" fill="#18181b" stroke="#f43f5e" stroke-width="2.5" />
    <polygon points="40,890 220,740 400,850 580,720 740,840 860,760 860,1140 40,1140" fill="#09090b" stroke="#e11d48" stroke-width="2" />

    <!-- Twilight Valley River of Light -->
    <path d="M 480,780 Q 440,940 490,1120 T 460,1340" fill="none" stroke="#fb7185" stroke-width="8" opacity="0.7" />

    ${generateGuillocheBand(1180, 26, 4, 12, 6, 12, 5, '#c026d3', 0.4)}
    ${buildSecurityFrame('#4c1d95', '#c026d3', 'TWILIGHT RANGE · EVENING ALPINE HORIZON')}
    `
  );

  return backgrounds;
}

module.exports = { getMountainBackgrounds };
