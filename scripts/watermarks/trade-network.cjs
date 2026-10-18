const { wrapDocumentSvg } = require('./common.cjs');

function generateTradeNetwork() {
  const cobalt = '#1d4ed8';
  const cyan = '#0284c7';
  const emerald = '#059669';
  const slate = '#0f172a';

  let art = `<g>`;

  // 1. Concentric Geodesic Radar Rings radiating from Central Kabul Hub (450, 700)
  const radarRings = [80, 150, 220, 290, 360, 430, 500];
  radarRings.forEach((r, idx) => {
    art += `<circle cx="450" cy="700" r="${r}" fill="none" stroke="${cobalt}" stroke-width="${idx % 2 === 0 ? '2' : '1.2'}" stroke-dasharray="${idx % 2 === 0 ? 'none' : '6 4'}" opacity="${0.7 - idx * 0.08}" />`;
    art += `<text x="${450 + r - 4}" y="714" font-family="Courier, monospace" font-size="7.5" font-weight="900" fill="${cyan}" opacity="0.8">${r * 5} NM</text>`;
  });

  // 12-Ray Geodesic Bearing Lines from Kabul
  art += `<g stroke="${cyan}" stroke-width="0.9" opacity="0.4" stroke-dasharray="4 4">`;
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x2 = 450 + 500 * Math.cos(angle);
    const y2 = 700 + 500 * Math.sin(angle);
    art += `<line x1="450" y1="700" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" />`;
  }
  art += `</g>`;

  // 2. Hub Nodes Coordinates & Metadata
  const hubs = [
    { code: 'KBL', name: 'KABUL CENTRAL', type: 'AIR / ROAD', x: 450, y: 700, major: true, mode: '✈ 🚛' },
    { code: 'HRT', name: 'HERAT GATEWAY', type: 'DRY PORT', x: 270, y: 680, major: false, mode: '🚛' },
    { code: 'ISQ', name: 'ISLAM QALA', type: 'BORDER CUSTOMS', x: 160, y: 660, major: false, mode: '🚛' },
    { code: 'TRG', name: 'TORGHUNDI', type: 'RAIL TERMINAL', x: 210, y: 520, major: false, mode: '🚂' },
    { code: 'MZR', name: 'MAZAR / HAIRATAN', type: 'RIVER & RAIL', x: 460, y: 480, major: true, mode: '🚂 ⚓' },
    { code: 'SBD', name: 'SPIN BOLDAK', type: 'BORDER POST', x: 390, y: 880, major: false, mode: '🚛' },
    { code: 'DXB', name: 'DUBAI AIR/SEA', type: 'GLOBAL HUB', x: 180, y: 960, major: true, mode: '✈ ⚓' },
    { code: 'IST', name: 'ISTANBUL EURASIA', type: 'BRIDGE HUB', x: 120, y: 390, major: true, mode: '✈ 🚛' },
    { code: 'FRA', name: 'FRANKFURT CARGO', type: 'EUROPEAN GATEWAY', x: 100, y: 220, major: true, mode: '✈' },
    { code: 'PVG', name: 'SHANGHAI INT\'L', type: 'PACIFIC CARGO', x: 800, y: 520, major: true, mode: '✈ ⚓' },
    { code: 'KHI', name: 'KARACHI PORT', type: 'MARITIME TERMINAL', x: 430, y: 1100, major: true, mode: '⚓' },
    { code: 'BND', name: 'BANDAR ABBAS', type: 'GULF PORT', x: 230, y: 1120, major: true, mode: '⚓' },
    { code: 'DEL', name: 'DELHI REGIONAL', type: 'INLAND HUB', x: 670, y: 830, major: false, mode: '✈ 🚛' },
    { code: 'TAS', name: 'TASHKENT CENTRAL', type: 'NORTHERN CORRIDOR', x: 470, y: 320, major: false, mode: '🚂 ✈' },
    { code: 'GYD', name: 'BAKU CASPIAN', type: 'TRANS-CAUCASUS', x: 190, y: 320, major: false, mode: '⚓ 🚂' },
  ];

  // 3. Sweeping Multi-Modal Transit Corridors (Great-Circle Arcs)
  const routes = [
    // Lapis Lazuli Route: KBL -> HRT -> TRG -> GYD -> IST -> FRA
    { path: 'M450,700 Q360,690 270,680 Q240,600 210,520 Q200,420 190,320 Q155,355 120,390 Q110,305 100,220', color: cobalt, width: '3.4', dash: 'none', label: 'LAPIS LAZULI MULTI-MODAL CORRIDOR' },
    // Air Silk Road: PVG -> DEL -> KBL -> DXB -> FRA
    { path: 'M800,520 Q735,675 670,830 Q560,765 450,700 Q315,830 180,960 Q140,590 100,220', color: cyan, width: '3.2', dash: '8 5', label: 'GLOBAL AIR SILK ROAD (FRA-DXB-KBL-PVG)' },
    // Northern Railway & Caspian Link: KBL -> MZR -> TAS -> GYD
    { path: 'M450,700 Q455,590 460,480 Q465,400 470,320 Q330,320 190,320', color: emerald, width: '3', dash: '12 4', label: 'NORTHERN TRANS-CASPIAN RAIL NETWORK' },
    // Western Border Transit: KBL -> HRT -> ISQ -> BND
    { path: 'M450,700 L270,680 L160,660 Q195,890 230,1120', color: cobalt, width: '2.8', dash: 'none', label: 'WESTERN ACCESS (ISLAM QALA - BANDAR ABBAS)' },
    // Southern Sea Gateway: KBL -> SBD -> KHI
    { path: 'M450,700 Q420,790 390,880 Q410,990 430,1100', color: emerald, width: '3.2', dash: 'none', label: 'SOUTHERN OCEAN MARITIME ACCESS (KHI)' },
    // Persian Gulf Maritime Lane: BND -> DXB -> KHI
    { path: 'M230,1120 Q205,1040 180,960 Q305,1030 430,1100', color: cyan, width: '2.4', dash: '6 4', label: 'ARABIAN SEA FEEDER LANE' },
    // Direct Central Asia link: MZR -> TRG
    { path: 'M460,480 Q335,500 210,520', color: cobalt, width: '2.2', dash: '4 4' },
  ];

  routes.forEach((rt) => {
    art += `<path d="${rt.path}" fill="none" stroke="${rt.color}" stroke-width="${rt.width}" stroke-dasharray="${rt.dash}" opacity="0.9" />`;
  });

  // 4. Render Hub Reticles & Node Tags
  hubs.forEach((h) => {
    art += `<g transform="translate(${h.x}, ${h.y})">`;
    // Outer pulse rings
    art += `<circle cx="0" cy="0" r="${h.major ? '22' : '16'}" fill="none" stroke="${h.major ? cobalt : cyan}" stroke-width="2" opacity="0.85" />`;
    art += `<circle cx="0" cy="0" r="${h.major ? '16' : '11'}" fill="none" stroke="${h.major ? emerald : cobalt}" stroke-width="1.2" stroke-dasharray="3 2" />`;
    // Solid Hub Core
    art += `<circle cx="0" cy="0" r="${h.major ? '8' : '6'}" fill="${h.major ? cobalt : cyan}" stroke="#ffffff" stroke-width="1.8" />`;
    art += `<circle cx="0" cy="0" r="2.5" fill="#ffffff" />`;

    // Hub Code & Metadata Badge
    const isRightSide = h.x > 500;
    const badgeX = isRightSide ? -14 : 14;
    const textAnchor = isRightSide ? 'end' : 'start';

    art += `
      <rect x="${isRightSide ? badgeX - 70 : badgeX}" y="-16" width="70" height="28" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="${cobalt}" stroke-width="1.4" />
      <text x="${isRightSide ? badgeX - 8 : badgeX + 8}" y="-3" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="${cobalt}" text-anchor="${textAnchor}">[${h.code}]</text>
      <text x="${isRightSide ? badgeX - 8 : badgeX + 8}" y="8" font-family="Courier, monospace" font-size="7.5" font-weight="bold" fill="${slate}" text-anchor="${textAnchor}">${h.mode}</text>
    `;
    art += `</g>`;
  });

  // 5. Corridor Telemetry Data Banner at Bottom
  art += `
    <g transform="translate(450, 1310)">
      <rect x="-360" y="-18" width="720" height="34" rx="4" fill="#ffffff" fill-opacity="0.95" stroke="${cobalt}" stroke-width="2" />
      <text x="0" y="-2" font-family="Arial, sans-serif" font-size="10.5" font-weight="900" letter-spacing="3" fill="${cobalt}" text-anchor="middle">INTERNATIONAL MULTI-MODAL LOGISTICS CORRIDORS · TRANSIT TELEMETRY</text>
      <text x="0" y="11" font-family="Courier, monospace" font-size="8" font-weight="bold" fill="${slate}" text-anchor="middle">ACTIVE CHANNELS: 15 STRATEGIC HUBS · 7 CROSS-BORDER ROUTINGS · MULTI-CARRIER DISPATCH VERIFIED</text>
    </g>
  `;

  art += `</g>`;

  return wrapDocumentSvg('Trade Network', cobalt, art);
}

module.exports = { generateTradeNetwork };
