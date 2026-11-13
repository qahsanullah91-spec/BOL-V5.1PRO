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
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="35%" stop-color="#f8fafc" />
      <stop offset="70%" stop-color="#f0f9ff" />
      <stop offset="100%" stop-color="#e0f2fe" />
    </linearGradient>
    <linearGradient id="ad-peak1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#dbeafe" />
    </linearGradient>
    <linearGradient id="ad-peak2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#ad-sky)" />
    
    <!-- Background Guilloche Waves -->
    ${generateGuillocheBand(220, 20, 4, 10, 8, 8, 4, '#d97706', 0.22)}
    ${generateGuillocheBand(1220, 24, 3, 12, 6, 10, 5, '#1e3a8a', 0.25)}

    <!-- Rising Sunburst (Center 450, 480) with Dual Rosette Core -->
    ${generateSunburst(450, 480, 55, 360, 48, '#d97706', 0.4)}
    <circle cx="450" cy="480" r="54" fill="#ffffff" stroke="#b45309" stroke-width="2.5" />
    <circle cx="450" cy="480" r="42" fill="none" stroke="#d97706" stroke-width="1.2" stroke-dasharray="4 2" />
    <circle cx="450" cy="480" r="16" fill="#fef3c7" stroke="#b45309" stroke-width="1.8" />
    <circle cx="450" cy="480" r="5" fill="#b45309" />

    <!-- Mountain Layer 1 (Far High Hindu Kush Ridges) -->
    <polygon points="40,680 160,420 280,520 450,340 600,490 730,320 860,560 860,780 40,780" fill="url(#ad-peak1)" stroke="#1e3a8a" stroke-width="2.4" />
    
    <!-- Mountain Facet Shading & Intaglio Snow Crevasses -->
    <g stroke="#0284c7" stroke-width="1.2" opacity="0.75">
      <line x1="730" y1="320" x2="710" y2="580" /><line x1="730" y1="320" x2="765" y2="530" />
      <line x1="450" y1="340" x2="420" y2="600" /><line x1="450" y1="340" x2="495" y2="550" />
      <line x1="160" y1="420" x2="190" y2="620" /><line x1="160" y1="420" x2="140" y2="560" />
      <!-- Left Shadow Facet Hatching -->
      ${Array.from({ length: 14 }).map((_, i) => `<line x1="${450 - i * 16}" y1="${340 + i * 22}" x2="${450 - i * 8}" y2="${380 + i * 22}" stroke-width="0.8" />`).join('\n')}
      ${Array.from({ length: 14 }).map((_, i) => `<line x1="${730 - i * 16}" y1="${320 + i * 20}" x2="${730 - i * 8}" y2="${360 + i * 20}" stroke-width="0.8" />`).join('\n')}
    </g>

    <!-- Summit Altimetry Micro-Banners -->
    <g transform="translate(450, 315)">
      <rect x="-110" y="-12" width="220" height="20" rx="3" fill="#ffffff" fill-opacity="0.95" stroke="#1e3a8a" stroke-width="1.2" />
      <text x="0" y="2" font-family="monospace" font-size="8.5" font-weight="900" fill="#1e3a8a" text-anchor="middle">TIRICH MIR SUMMIT · 7,708 M</text>
    </g>
    <g transform="translate(730, 295)">
      <rect x="-95" y="-12" width="190" height="20" rx="3" fill="#ffffff" fill-opacity="0.95" stroke="#1e3a8a" stroke-width="1.2" />
      <text x="0" y="2" font-family="monospace" font-size="8.5" font-weight="900" fill="#1e3a8a" text-anchor="middle">NOSHAQ PEAK · 7,492 M</text>
    </g>

    <!-- Mountain Layer 2 (Mid-Range Rugged Ridges) -->
    <polygon points="40,820 150,640 300,740 470,580 630,710 780,600 860,730 860,940 40,940" fill="url(#ad-peak2)" stroke="#1e3a8a" stroke-width="2.2" />
    
    <!-- Foothill Topographic Relief Contours -->
    ${generateTopographicContours(940, 1260, 6, '#1e3a8a', 0.35)}

    ${buildSecurityFrame('#1e3a8a', '#d97706', 'ALPINE DAWN · HINDU KUSH INTAGLIO ENGRAVING')}
    `
  );

  // 2. Glacier Valley
  backgrounds['glacier-valley.svg'] = wrapSvg(
    'Glacier Valley',
    `
    <linearGradient id="gv-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#f0fdfa" />
      <stop offset="80%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#ccfbf1" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#gv-sky)" />

    <!-- Wakhan Glacier Central Braided River Guilloche Ribbon -->
    <path d="M 450,220 Q 380,480 470,720 T 430,1020 T 460,1340" fill="none" stroke="#0891b2" stroke-width="6" stroke-linecap="round" />
    <path d="M 450,220 Q 380,480 470,720 T 430,1020 T 460,1340" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="8 4" />
    
    <!-- Glacial Crevasse Lateral Waves -->
    ${generateGuillocheBand(460, 22, 3, 10, 5, 8, 4, '#0f766e', 0.28)}
    ${generateGuillocheBand(780, 26, 3, 12, 6, 10, 5, '#0284c7', 0.3)}
    ${generateGuillocheBand(1100, 24, 4, 10, 6, 8, 4, '#0891b2', 0.28)}

    <!-- Flanking Valley Topographic Contours (Left & Right) -->
    <g stroke="#0f766e" stroke-width="1.2" opacity="0.45" fill="none">
      ${Array.from({ length: 12 }).map((_, i) => {
        const y = 300 + i * 75;
        return `<path d="M 40,${y} Q 180,${y - 20} 340,${y + 15} T 410,${y + 10}" />
                <path d="M 860,${y} Q 720,${y - 20} 560,${y + 15} T 490,${y + 10}" />`;
      }).join('\n')}
    </g>

    <!-- Snowflake Security Rosettes (Left & Right Balance) -->
    ${generateRosette(200, 600, 48, 12, '#0891b2', 0.45)}
    ${generateRosette(700, 600, 48, 12, '#0891b2', 0.45)}
    ${generateRosette(450, 880, 64, 16, '#0f766e', 0.45)}

    <!-- Header Medallion Badge -->
    <g transform="translate(450, 160)">
      <rect x="-190" y="-18" width="380" height="36" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#0f766e" stroke-width="2" />
      <text x="0" y="5" font-family="monospace" font-size="10" font-weight="900" fill="#0f766e" text-anchor="middle" letter-spacing="1.5">WAKHAN GLACIER CORRIDOR · 4,800 M</text>
    </g>

    ${buildSecurityFrame('#0f766e', '#0284c7', 'GLACIER VALLEY · TRANS-HIMALAYAN TRANSIT')}
    `
  );

  // 3. Snow Ridge
  backgrounds['snow-ridge.svg'] = wrapSvg(
    'Snow Ridge',
    `
    <linearGradient id="sr-sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sr-sky)" />

    <!-- Central Razor-Sharp Mountain Arête Spine -->
    <path d="M 450,140 Q 410,380 480,620 T 420,950 T 470,1340" fill="none" stroke="#1e3a8a" stroke-width="4.5" />
    
    <!-- Leeward Ridge Facet (Left Shadow with Precision Hatching) -->
    <path d="M 450,140 Q 410,380 480,620 T 420,950 T 470,1340 L 40,1340 L 40,140 Z" fill="#1e3a8a" fill-opacity="0.05" />
    <g stroke="#1e3a8a" stroke-width="0.8" opacity="0.35">
      ${Array.from({ length: 28 }).map((_, i) => {
        const y = 160 + i * 42;
        return `<line x1="60" y1="${y}" x2="430" y2="${y + 15}" />`;
      }).join('\n')}
    </g>

    <!-- Windward Ridge Facet (Right Subtle Tonal Grid) -->
    <g stroke="#0284c7" stroke-width="0.9" opacity="0.35">
      ${Array.from({ length: 28 }).map((_, i) => {
        const y = 160 + i * 42;
        return `<line x1="480" y1="${y + 15}" x2="840" y2="${y + 30}" stroke-dasharray="6 3" />`;
      }).join('\n')}
    </g>

    <!-- Altitude Waypoint Compass Badges -->
    <g transform="translate(480, 420)">
      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#1e3a8a" stroke-width="2" />
      <circle cx="0" cy="0" r="5" fill="#1e3a8a" />
      <rect x="22" y="-10" width="180" height="20" rx="3" fill="#ffffff" stroke="#1e3a8a" stroke-width="1" />
      <text x="32" y="4" font-family="monospace" font-size="8.5" font-weight="900" fill="#1e3a8a">SALANG SUMMIT PASS · 3,363 M</text>
    </g>
    <g transform="translate(420, 820)">
      <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#1e3a8a" stroke-width="2" />
      <circle cx="0" cy="0" r="5" fill="#1e3a8a" />
      <rect x="22" y="-10" width="180" height="20" rx="3" fill="#ffffff" stroke="#1e3a8a" stroke-width="1" />
      <text x="32" y="4" font-family="monospace" font-size="8.5" font-weight="900" fill="#1e3a8a">NORTH TUNNEL PORTAL · 3,120 M</text>
    </g>

    ${generateGuillocheBand(1180, 22, 4, 10, 8, 10, 5, '#1e3a8a', 0.28)}
    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'SNOW RIDGE · HINDU KUSH SUMMIT CREST')}
    `
  );

  // 4. Highland Lake
  backgrounds['highland-lake.svg'] = wrapSvg(
    'Highland Lake',
    `
    <linearGradient id="hl-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f0fdf4" />
    </linearGradient>
    <linearGradient id="hl-water" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.1" />
      <stop offset="50%" stop-color="#0369a1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0f766e" stop-opacity="0.3" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#hl-sky)" />

    <!-- Encircling Canyon Mountain Ridges -->
    <polygon points="40,540 180,360 340,460 480,310 620,440 760,340 860,520 860,680 40,680" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.2" />
    <g stroke="#0284c7" stroke-width="1" opacity="0.6">
      <line x1="480" y1="310" x2="460" y2="520" /><line x1="480" y1="310" x2="520" y2="490" />
      <line x1="180" y1="360" x2="210" y2="520" /><line x1="760" y1="340" x2="730" y2="520" />
    </g>

    <!-- Band-e Amir Alpine Crater Lake Surface with Concentric Guilloche Waves -->
    <ellipse cx="450" cy="940" rx="380" ry="240" fill="url(#hl-water)" stroke="#0284c7" stroke-width="2.5" />
    ${generateGuillocheBand(840, 16, 5, 8, 10, 8, 4, '#0284c7', 0.35)}
    ${generateGuillocheBand(940, 20, 4, 10, 8, 10, 5, '#0f766e', 0.4)}
    ${generateGuillocheBand(1040, 16, 5, 8, 10, 8, 4, '#0284c7', 0.35)}

    <!-- Travertine Barrier Wall Cascade -->
    <path d="M 120,1180 Q 450,1210 780,1180" stroke="#0f766e" stroke-width="3" fill="none" />
    <g stroke="#0284c7" stroke-width="1" opacity="0.5">
      ${Array.from({ length: 18 }).map((_, i) => `<line x1="${160 + i * 34}" y1="1185" x2="${160 + i * 34}" y2="1240" stroke-dasharray="4 2" />`).join('\n')}
    </g>

    <!-- Lake Stamp Badge -->
    <g transform="translate(450, 1270)">
      <rect x="-190" y="-16" width="380" height="32" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="#1e3a8a" stroke-width="1.6" />
      <text x="0" y="4" font-family="monospace" font-size="8.5" font-weight="900" fill="#1e3a8a" text-anchor="middle" letter-spacing="1">BAND-E AMIR HIGH ALPINE LAKES · 2,900 M</text>
    </g>

    ${buildSecurityFrame('#1e3a8a', '#0284c7', 'HIGHLAND LAKE · BAND-E AMIR SECURITY')}
    `
  );

  // 5. Golden Summit
  backgrounds['golden-summit.svg'] = wrapSvg(
    'Golden Summit',
    `
    <linearGradient id="gs-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#fffbeb" />
      <stop offset="100%" stop-color="#fef3c7" />
    </linearGradient>
    <linearGradient id="gs-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#gs-sky)" />

    <!-- Grand Solar Sunburst Aura Behind Summit (Fine Intaglio Rays) -->
    ${generateSunburst(450, 520, 75, 410, 64, '#d97706', 0.35)}
    <circle cx="450" cy="520" r="85" fill="none" stroke="#d97706" stroke-width="1.8" opacity="0.6" />
    <circle cx="450" cy="520" r="140" fill="none" stroke="#b45309" stroke-width="1" stroke-dasharray="6 3" opacity="0.45" />

    <!-- Monumental Golden Intaglio Pyramid Peak -->
    <polygon points="450,280 200,940 700,940" fill="url(#gs-gold)" fill-opacity="0.35" stroke="#78350f" stroke-width="2.6" />
    <line x1="450" y1="280" x2="450" y2="940" stroke="#78350f" stroke-width="2.8" />
    <polygon points="450,280 200,940 450,940" fill="#78350f" fill-opacity="0.08" />

    <!-- Precision Horizontal Intaglio Shading Lines -->
    <g stroke="#b45309" stroke-width="1.1" opacity="0.65">
      ${Array.from({ length: 18 }).map((_, i) => {
        const y = 320 + i * 34;
        const xOffset = (y - 280) * 0.38;
        return `<line x1="${450 - xOffset}" y1="${y}" x2="450" y2="${y}" /><line x1="450" y1="${y}" x2="${450 + xOffset}" y2="${y}" stroke-dasharray="4 2" />`;
      }).join('\n')}
    </g>

    <!-- Summit Altimetry Emblem -->
    <g transform="translate(450, 240)">
      <polygon points="0,-16 14,10 -14,10" fill="#d97706" />
      <rect x="-130" y="-36" width="260" height="18" rx="2" fill="#ffffff" stroke="#78350f" stroke-width="1" />
      <text x="0" y="-24" font-family="monospace" font-size="9" font-weight="900" fill="#78350f" text-anchor="middle">NOSHAQ GOLDEN SUMMIT</text>
      <text x="0" y="24" font-family="monospace" font-size="8.5" font-weight="bold" fill="#b45309" text-anchor="middle">ELEVATION 7,492 M // 24,580 FT</text>
    </g>

    ${generateGuillocheBand(1140, 24, 4, 12, 6, 12, 5, '#b45309', 0.32)}
    ${buildSecurityFrame('#78350f', '#d97706', 'GOLDEN SUMMIT · HIGHEST AFGHAN ELEVATION')}
    `
  );

  // 6. Silent Peaks
  backgrounds['silent-peaks.svg'] = wrapSvg(
    'Silent Peaks',
    `
    <linearGradient id="sp-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#sp-sky)" />

    <!-- Delicate Celestial Astrolabe Graticule & Crescent Moon -->
    <g stroke="#1e293b" opacity="0.35" fill="none">
      <circle cx="450" cy="400" r="280" stroke-width="1.2" />
      <circle cx="450" cy="400" r="200" stroke-width="0.8" stroke-dasharray="6 4" />
      <line x1="450" y1="120" x2="450" y2="680" stroke-width="1" />
      <line x1="170" y1="400" x2="730" y2="400" stroke-width="1" />
    </g>
    <!-- Silver Crescent Moon at (700, 240) -->
    <path d="M 700,220 A 30,30 0 1 0 735,270 A 25,25 0 1 1 700,220 Z" fill="#64748b" opacity="0.8" />

    <!-- 4 Tier Cascading Himalayan Mountain Ridges (Precision Intaglio Linework) -->
    <polygon points="40,640 180,440 340,560 520,380 680,520 860,400 860,820 40,820" fill="none" stroke="#64748b" stroke-width="1.6" />
    <polygon points="40,760 140,580 300,680 480,500 660,660 800,540 860,640 860,940 40,940" fill="none" stroke="#475569" stroke-width="1.8" />
    <polygon points="40,880 200,720 380,840 560,680 720,800 860,690 860,1080 40,1080" fill="none" stroke="#1e293b" stroke-width="2.2" />

    <!-- Rolling Valley Mist Guilloche Bands Between Peaks -->
    ${generateGuillocheBand(680, 18, 4, 8, 8, 8, 4, '#64748b', 0.3)}
    ${generateGuillocheBand(820, 20, 3, 10, 6, 8, 4, '#475569', 0.32)}
    ${generateGuillocheBand(1180, 24, 3, 12, 6, 12, 5, '#1e293b', 0.35)}

    ${buildSecurityFrame('#0f172a', '#475569', 'SILENT PEAKS · NOCTURNAL HIMALAYAN RIDGES')}
    `
  );

  // 7. Mountain Mist
  backgrounds['mountain-mist.svg'] = wrapSvg(
    'Mountain Mist',
    `
    <linearGradient id="mm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="45%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#mm-sky)" />

    <!-- Majestic 5 Granite Mountain Spires with Vertical Intaglio Facets -->
    ${[
      { x: 180, topY: 340, width: 70, name: 'SPIRE 01' },
      { x: 320, topY: 260, width: 80, name: 'SPIRE 02' },
      { x: 450, topY: 180, width: 90, name: 'CATHEDRAL SPIRE · 6,200 M' },
      { x: 580, topY: 260, width: 80, name: 'SPIRE 04' },
      { x: 720, topY: 340, width: 70, name: 'SPIRE 05' },
    ].map((spire) => `
      <!-- Tower Polygon -->
      <polygon points="${spire.x - spire.width / 2},1080 ${spire.x},${spire.topY} ${spire.x + spire.width / 2},1080" fill="#f8fafc" stroke="#334155" stroke-width="2.2" />
      <!-- Center Facet Spine -->
      <line x1="${spire.x}" y1="${spire.topY}" x2="${spire.x}" y2="1080" stroke="#1e293b" stroke-width="2.4" />
      <!-- Left Shadow Hatching -->
      <polygon points="${spire.x - spire.width / 2},1080 ${spire.x},${spire.topY} ${spire.x},1080" fill="#334155" fill-opacity="0.08" />
    `).join('\n')}

    <!-- 4 Tiers of Floating Horizontal Guilloche Mist Bands Across Spires -->
    ${generateGuillocheBand(420, 28, 3, 14, 6, 8, 4, '#0284c7', 0.35)}
    ${generateGuillocheBand(580, 32, 2, 16, 5, 10, 5, '#1e3a8a', 0.38)}
    ${generateGuillocheBand(740, 34, 3, 18, 4, 12, 6, '#0f766e', 0.35)}
    ${generateGuillocheBand(920, 30, 4, 14, 7, 10, 5, '#0284c7', 0.32)}

    <!-- Foothill Forest Topographic Contours -->
    ${generateTopographicContours(1080, 1310, 6, '#334155', 0.35)}

    ${buildSecurityFrame('#334155', '#0284c7', 'MOUNTAIN MIST · ATMOSPHERIC GRANITE SPIRES')}
    `
  );

  // 8. Twilight Range
  backgrounds['twilight-range.svg'] = wrapSvg(
    'Twilight Range',
    `
    <linearGradient id="tr-sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#fdf4ff" />
      <stop offset="80%" stop-color="#fae8ff" />
      <stop offset="100%" stop-color="#f5d0fe" />
    </linearGradient>
    `,
    `
    <rect width="900" height="1400" fill="url(#tr-sky)" />

    <!-- Brilliant Evening Star (Venus) Compass Rosette -->
    <g transform="translate(680, 220)">
      <circle cx="0" cy="0" r="8" fill="#9d174d" />
      <line x1="-30" y1="0" x2="30" y2="0" stroke="#9d174d" stroke-width="1.8" />
      <line x1="0" y1="-30" x2="0" y2="30" stroke="#9d174d" stroke-width="1.8" />
      <circle cx="0" cy="0" r="22" fill="none" stroke="#9d174d" stroke-width="0.8" opacity="0.6" />
    </g>

    <!-- Celestial Navigational Graticule Arc -->
    <path d="M 80,480 Q 450,220 820,480" fill="none" stroke="#9d174d" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.45" />

    <!-- Multi-Tiered Twilight Alpine Ridges with Intaglio Facets -->
    <polygon points="40,780 180,560 320,680 480,490 620,640 760,510 860,680 860,980 40,980" fill="none" stroke="#312e81" stroke-width="2.2" />
    <polygon points="40,890 220,740 400,850 580,720 740,840 860,760 860,1140 40,1140" fill="none" stroke="#1e1b4b" stroke-width="2.4" />

    <!-- Twilight Valley River Ribbon -->
    <path d="M 480,780 Q 440,940 490,1120 T 460,1340" fill="none" stroke="#9d174d" stroke-width="6" opacity="0.5" />

    ${generateGuillocheBand(1180, 24, 4, 12, 6, 12, 5, '#4c1d95', 0.35)}
    ${buildSecurityFrame('#1e1b4b', '#9d174d', 'TWILIGHT RANGE · EVENING ALPINE HORIZON')}
    `
  );

  return backgrounds;
}

module.exports = { getMountainBackgrounds };
