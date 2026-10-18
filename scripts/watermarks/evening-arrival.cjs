const { wrapDocumentSvg } = require('./common.cjs');

function generateEveningArrival() {
  const twilight = '#1e1b4b';
  const amber = '#d97706';
  const cyan = '#0284c7';
  const slate = '#0f172a';

  const extraDefs = `
    <linearGradient id="landing-light-beam-left" x1="0%" y1="0%" x2="40%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.02" />
    </linearGradient>
    <linearGradient id="landing-light-beam-right" x1="100%" y1="0%" x2="60%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0.02" />
    </linearGradient>
  `;

  let art = `<g>`;

  // 1. Horizon & Distance Sky Graticule
  art += `
    <g stroke="${cyan}" stroke-width="1" opacity="0.35" stroke-dasharray="6 4">
      <line x1="60" y1="620" x2="840" y2="620" stroke-width="2" stroke="${twilight}" stroke-dasharray="none" opacity="0.8" />
      <line x1="60" y1="560" x2="840" y2="560" />
      <line x1="60" y1="500" x2="840" y2="500" />
      <line x1="60" y1="440" x2="840" y2="440" />
    </g>
  `;

  // 2. Distant ATC Control Tower Silhouette (Left horizon: x=140, y=520..620)
  art += `
    <g stroke="${twilight}" fill="${twilight}" opacity="0.8">
      <!-- Tower Shaft -->
      <polygon points="135,620 145,620 142,540 138,540" />
      <!-- Tower Cab -->
      <polygon points="132,540 148,540 152,525 128,525" fill="#ffffff" stroke="${twilight}" stroke-width="1.2" />
      <!-- Radome & Beacon -->
      <circle cx="140" cy="520" r="4" fill="${amber}" stroke="${twilight}" stroke-width="1" />
      <line x1="120" y1="510" x2="160" y2="530" stroke="${amber}" stroke-width="1.2" stroke-dasharray="2 2" />
      <text x="140" y="505" font-family="Courier, monospace" font-size="7" font-weight="900" fill="${twilight}" text-anchor="middle">ATC TWR</text>
    </g>
  `;

  // 3. 3D Perspective Runway & ALSF-2 Approach Lighting System (Horizon y=620 down to y=1340)
  // Vanishing point at (450, 620)
  art += `
    <!-- Runway Surface & Outer Edges -->
    <polygon points="420,620 480,620 670,1340 230,1340" fill="${twilight}" fill-opacity="0.06" stroke="${twilight}" stroke-width="3.2" />

    <!-- Runway Edge Lights -->
    <g stroke="${amber}" stroke-width="1.4" opacity="0.85">
      <line x1="420" y1="620" x2="230" y2="1340" stroke-width="2.5" />
      <line x1="480" y1="620" x2="670" y2="1340" stroke-width="2.5" />
    </g>

    <!-- Runway Threshold Piano Keys (y = 700 to 730) -->
    <g fill="${twilight}" opacity="0.85">
      <rect x="400" y="700" width="6" height="28" />
      <rect x="410" y="700" width="6" height="28" />
      <rect x="420" y="700" width="6" height="28" />
      <rect x="430" y="700" width="6" height="28" />
      <rect x="440" y="700" width="6" height="28" />
      <rect x="454" y="700" width="6" height="28" />
      <rect x="464" y="700" width="6" height="28" />
      <rect x="474" y="700" width="6" height="28" />
      <rect x="484" y="700" width="6" height="28" />
      <rect x="494" y="700" width="6" height="28" />
    </g>

    <!-- Runway Centerline Dashes (increasing length & thickness toward viewer) -->
    <g stroke="${amber}" stroke-linecap="round">
      <line x1="450" y1="740" x2="450" y2="765" stroke-width="3" />
      <line x1="450" y1="785" x2="450" y2="820" stroke-width="3.8" />
      <line x1="450" y1="845" x2="450" y2="895" stroke-width="4.6" />
      <line x1="450" y1="925" x2="450" y2="990" stroke-width="5.5" />
      <line x1="450" y1="1025" x2="450" y2="1110" stroke-width="6.5" />
      <line x1="450" y1="1155" x2="450" y2="1265" stroke-width="8" />
    </g>

    <!-- ALSF-2 Sequenced Flashing Approach Light Crossbars -->
    <g stroke="${amber}" stroke-width="1.8" opacity="0.9">
      <!-- Crossbars extending outward -->
      <line x1="400" y1="800" x2="500" y2="800" />
      <line x1="380" y1="900" x2="520" y2="900" stroke-width="2.2" />
      <line x1="350" y1="1020" x2="550" y2="1020" stroke-width="2.6" />
      <line x1="310" y1="1170" x2="590" y2="1170" stroke-width="3" />

      <!-- Station Strobe Flasher Orbs -->
      <circle cx="450" cy="800" r="4" fill="${amber}" />
      <circle cx="450" cy="900" r="5" fill="${amber}" />
      <circle cx="450" cy="1020" r="6" fill="${amber}" />
      <circle cx="450" cy="1170" r="7" fill="${amber}" />
    </g>

    <!-- PAPI 4-Light Glide Slope Box on Runway Left (x=185, y=780) -->
    <g transform="translate(290, 780)">
      <rect x="0" y="0" width="48" height="12" rx="2" fill="#ffffff" stroke="${twilight}" stroke-width="1.4" />
      <circle cx="8" cy="6" r="3.5" fill="#ef4444" />
      <circle cx="18" cy="6" r="3.5" fill="#ef4444" />
      <circle cx="28" cy="6" r="3.5" fill="#ffffff" stroke="${twilight}" stroke-width="0.8" />
      <circle cx="38" cy="6" r="3.5" fill="#ffffff" stroke="${twilight}" stroke-width="0.8" />
      <text x="-8" y="9" font-family="Courier, monospace" font-size="7" font-weight="900" fill="${twilight}" text-anchor="end">PAPI 3.0°</text>
    </g>
  `;

  // 4. Twin High-Intensity Landing Light Flare Beams
  art += `
    <!-- Left Engine Landing Light Beam -->
    <polygon points="340,380 180,820 320,860" fill="url(#landing-light-beam-left)" opacity="0.6" />
    <!-- Right Engine Landing Light Beam -->
    <polygon points="560,380 580,860 720,820" fill="url(#landing-light-beam-right)" opacity="0.6" />
  `;

  // 5. Heavy Cargo Jet Freighter Silhouette & Wireframe (Boeing 777F / 747-8F)
  // Aircraft Center: (450, 360), Wingspan: 660px (x=120 to 780)
  art += `
    <g transform="translate(450, 340)">
      <!-- Swept Wings & High-Lift Flaps -->
      <polygon points="0,0 280,-70 325,-65 330,-50 40,55 0,60 -40,55 -330,-50 -325,-65 -280,-70" fill="${twilight}" fill-opacity="0.18" stroke="${twilight}" stroke-width="3.2" />

      <!-- Vertical Winglets / Raked Wingtips -->
      <polygon points="325,-65 332,-90 338,-88 330,-50" fill="${amber}" stroke="${twilight}" stroke-width="1.5" />
      <polygon points="-325,-65 -332,-90 -338,-88 -330,-50" fill="${amber}" stroke="${twilight}" stroke-width="1.5" />

      <!-- Trailing-Edge Flap Fairings -->
      <line x1="80" y1="45" x2="75" y2="72" stroke="${twilight}" stroke-width="2" />
      <line x1="140" y1="28" x2="135" y2="58" stroke="${twilight}" stroke-width="2" />
      <line x1="200" y1="12" x2="195" y2="44" stroke="${twilight}" stroke-width="2" />

      <line x1="-80" y1="45" x2="-75" y2="72" stroke="${twilight}" stroke-width="2" />
      <line x1="-140" y1="28" x2="-135" y2="58" stroke="${twilight}" stroke-width="2" />
      <line x1="-200" y1="12" x2="-195" y2="44" stroke="${twilight}" stroke-width="2" />

      <!-- High-Bypass Turbofan Engines (Left: x=-110, Right: x=110) -->
      <!-- Left Engine -->
      <g transform="translate(-110, 20)">
        <ellipse cx="0" cy="0" rx="22" ry="26" fill="#ffffff" stroke="${twilight}" stroke-width="3" />
        <ellipse cx="0" cy="0" rx="16" ry="20" fill="${twilight}" fill-opacity="0.25" stroke="${cyan}" stroke-width="1.5" />
        <circle cx="0" cy="0" r="6" fill="${twilight}" />
        <!-- Pylon strut -->
        <rect x="-3" y="-32" width="6" height="14" fill="${twilight}" />
      </g>
      <!-- Right Engine -->
      <g transform="translate(110, 20)">
        <ellipse cx="0" cy="0" rx="22" ry="26" fill="#ffffff" stroke="${twilight}" stroke-width="3" />
        <ellipse cx="0" cy="0" rx="16" ry="20" fill="${twilight}" fill-opacity="0.25" stroke="${cyan}" stroke-width="1.5" />
        <circle cx="0" cy="0" r="6" fill="${twilight}" />
        <!-- Pylon strut -->
        <rect x="-3" y="-32" width="6" height="14" fill="${twilight}" />
      </g>

      <!-- Fuselage Centerline & Nose Radome -->
      <path d="M-36,55 C-36,20 -32,-40 0,-100 C32,-40 36,20 36,55 C36,75 22,85 0,85 C-22,85 -36,75 -36,55 Z" fill="#ffffff" stroke="${twilight}" stroke-width="3.5" />

      <!-- Cockpit Windshield Windows -->
      <polygon points="-16,-62 -4,-64 -4,-52 -15,-52" fill="${twilight}" />
      <polygon points="16,-62 4,-64 4,-52 15,-52" fill="${twilight}" />

      <!-- Tricycle Landing Gear Extended -->
      <!-- Nose Gear -->
      <g transform="translate(0, 35)">
        <line x1="0" y1="0" x2="0" y2="24" stroke="${twilight}" stroke-width="3" />
        <ellipse cx="-5" cy="24" rx="4" ry="7" fill="${twilight}" />
        <ellipse cx="5" cy="24" rx="4" ry="7" fill="${twilight}" />
      </g>
      <!-- Main Gear Bogies -->
      <g transform="translate(-50, 48)">
        <line x1="0" y1="0" x2="0" y2="28" stroke="${twilight}" stroke-width="3" />
        <ellipse cx="-6" cy="28" rx="5" ry="8" fill="${twilight}" />
        <ellipse cx="6" cy="28" rx="5" ry="8" fill="${twilight}" />
      </g>
      <g transform="translate(50, 48)">
        <line x1="0" y1="0" x2="0" y2="28" stroke="${twilight}" stroke-width="3" />
        <ellipse cx="-6" cy="28" rx="5" ry="8" fill="${twilight}" />
        <ellipse cx="6" cy="28" rx="5" ry="8" fill="${twilight}" />
      </g>

      <!-- Wing Nav Lights -->
      <circle cx="-330" cy="-52" r="5" fill="#ef4444" stroke="${twilight}" stroke-width="1.2" /> <!-- Red Port -->
      <circle cx="330" cy="-52" r="5" fill="#22c55e" stroke="${twilight}" stroke-width="1.2" />  <!-- Green Starboard -->
    </g>
  `;

  // 6. Avionics HUD Flight Telemetry Overlay & Bottom Banner
  art += `
    <g transform="translate(450, 1310)">
      <rect x="-350" y="-18" width="700" height="34" rx="4" fill="#ffffff" fill-opacity="0.96" stroke="${twilight}" stroke-width="2" />
      <text x="0" y="-2" font-family="Arial, sans-serif" font-size="10.5" font-weight="900" letter-spacing="3" fill="${twilight}" text-anchor="middle">INTERNATIONAL AIR CARGO DISPATCH · FINAL APPROACH ILS CAT III</text>
      <text x="0" y="11" font-family="Courier, monospace" font-size="8" font-weight="bold" fill="${amber}" text-anchor="middle">RWY 29 · GS 3.0° · DH 100 FT · WIND 280°/12KT · FREIGHT HEAVY CLASS 1</text>
    </g>

    <!-- Side HUD Angle-of-Attack Ladder -->
    <g stroke="${cyan}" stroke-width="1.2" opacity="0.75">
      <path d="M120,380 L140,380 L140,400" fill="none" />
      <text x="105" y="384" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${cyan}">+10°</text>
      <path d="M120,440 L150,440" fill="none" />
      <text x="105" y="444" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${cyan}"> 00°</text>
      <path d="M120,500 L140,500 L140,480" fill="none" />
      <text x="105" y="504" font-family="Courier, monospace" font-size="8" font-weight="900" fill="${cyan}">-10°</text>
    </g>
  `;

  art += `</g>`;

  return wrapDocumentSvg('Evening Arrival', twilight, art, extraDefs);
}

module.exports = { generateEveningArrival };
