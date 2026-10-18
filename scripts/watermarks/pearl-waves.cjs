const { wrapDocumentSvg } = require('./common.cjs');

function generatePearlWaves() {
  const emerald = '#047857';
  const forest = '#065f46';
  const cyan = '#0284c7';
  const slate = '#0f172a';

  let art = `<g>`;

  // 1. Dual-Frequency Mathematical Moiré Wave Array (36 undulating horizontal ribbons)
  const waveCount = 36;
  const yStart = 100;
  const yEnd = 1300;
  const ySpacing = (yEnd - yStart) / waveCount;

  for (let w = 0; w <= waveCount; w++) {
    const yBase = yStart + w * ySpacing;
    const isMajor = w % 3 === 0;
    const strokeWidth = isMajor ? '2.6' : '1.3';
    const strokeColor = isMajor ? emerald : cyan;
    const opacity = isMajor ? '0.85' : '0.55';

    // Generate smooth bezier points across x=40 to 860
    const pts = [];
    const segments = 16;
    for (let s = 0; s <= segments; s++) {
      const x = 40 + (s * (860 - 40)) / segments;
      // Phase interference: dual harmonic sine waves
      const wave1 = 28 * Math.sin((x / 140) + w * 0.35);
      const wave2 = 14 * Math.cos((x / 75) - w * 0.2);
      const y = yBase + wave1 + wave2;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Build smooth cubic bezier path
    let d = `M${pts[0]}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L${pts[i]}`;
    }

    art += `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
  }

  // 2. Secondary Vertical Interference Waves (12 vertical rippling columns)
  for (let v = 0; v < 12; v++) {
    const xBase = 90 + v * 65;
    const pts = [];
    for (let s = 0; s <= 20; s++) {
      const y = 80 + (s * (1320 - 80)) / 20;
      const x = xBase + 16 * Math.sin((y / 110) + v * 0.5);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    art += `<path d="M${pts[0]} L${pts.slice(1).join(' ')}" fill="none" stroke="${forest}" stroke-width="1.1" stroke-dasharray="8 6" opacity="0.4" />`;
  }

  // 3. Central Master Banknote Lathe Rosette (Center: 450, 700, R=220)
  art += `<g transform="translate(450, 700)">`;

  // Concentric framing rings
  art += `<circle cx="0" cy="0" r="220" fill="none" stroke="${emerald}" stroke-width="3" opacity="0.9" />`;
  art += `<circle cx="0" cy="0" r="200" fill="none" stroke="${cyan}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.75" />`;

  // Outer "Pearl Necklace" Beaded Ring (72 small pearls along R=180)
  const pearlCountOuter = 72;
  const rPearlOuter = 180;
  art += `<g fill="#ffffff" stroke="${emerald}" stroke-width="1.2">`;
  for (let i = 0; i < pearlCountOuter; i++) {
    const ang = (i * 2 * Math.PI) / pearlCountOuter;
    const px = rPearlOuter * Math.cos(ang);
    const py = rPearlOuter * Math.sin(ang);
    art += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" />`;
  }
  art += `</g>`;

  // 48 Harmonically Looped Spirograph Lathe Petals
  // Mathematical hypotrochoid / epicycloid equations
  art += `<g stroke="${emerald}" fill="none" stroke-width="1.5" opacity="0.75">`;
  const petalCount = 48;
  for (let p = 0; p < petalCount; p++) {
    const ang = (p * 2 * Math.PI) / petalCount;
    // Each petal is an ellipse rotated by ang
    const deg = (ang * 180) / Math.PI;
    art += `<ellipse cx="0" cy="0" rx="145" ry="42" transform="rotate(${deg.toFixed(1)})" />`;
  }
  art += `</g>`;

  // Intermediate Pearl Ring (48 pearls along R=110)
  const pearlCountInner = 48;
  const rPearlInner = 110;
  art += `<g fill="${emerald}" stroke="#ffffff" stroke-width="1">`;
  for (let i = 0; i < pearlCountInner; i++) {
    const ang = (i * 2 * Math.PI) / pearlCountInner;
    const px = rPearlInner * Math.cos(ang);
    const py = rPearlInner * Math.sin(ang);
    art += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" />`;
  }
  art += `</g>`;

  // Central Emerald Rosette Core
  art += `
    <circle cx="0" cy="0" r="80" fill="#ffffff" fill-opacity="0.96" stroke="${emerald}" stroke-width="3.5" />
    <circle cx="0" cy="0" r="68" fill="none" stroke="${cyan}" stroke-width="1.6" stroke-dasharray="3 2" />
    <circle cx="0" cy="0" r="50" fill="${emerald}" fill-opacity="0.22" stroke="${emerald}" stroke-width="2.2" />
    <circle cx="0" cy="0" r="30" fill="${forest}" fill-opacity="0.3" stroke="${forest}" stroke-width="1.6" />
    <circle cx="0" cy="0" r="14" fill="${emerald}" stroke="#ffffff" stroke-width="1.5" />
    <circle cx="0" cy="0" r="4" fill="#ffffff" />
  `;

  // Guilloche Badge Text
  art += `<text x="0" y="240" font-family="Arial, sans-serif" font-size="10" font-weight="900" letter-spacing="3" fill="${emerald}" text-anchor="middle">BANKNOTE GUILLOCHE · OPTICAL MOIRÉ SECURITY PATTERN</text>`;
  art += `</g>`;

  // 4. Corner Fan Rosettes (4 Quadrants)
  const cornerPositions = [
    { x: 160, y: 200 },
    { x: 740, y: 200 },
    { x: 160, y: 1200 },
    { x: 740, y: 1200 },
  ];

  cornerPositions.forEach((cp) => {
    art += `<g transform="translate(${cp.x}, ${cp.y})">`;
    art += `<circle cx="0" cy="0" r="60" fill="none" stroke="${emerald}" stroke-width="2" opacity="0.8" />`;
    art += `<circle cx="0" cy="0" r="48" fill="none" stroke="${cyan}" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.7" />`;
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      art += `<ellipse cx="0" cy="0" rx="42" ry="12" transform="rotate(${(i * 22.5).toFixed(1)})" fill="none" stroke="${emerald}" stroke-width="1" opacity="0.6" />`;
    }
    art += `<circle cx="0" cy="0" r="12" fill="${emerald}" opacity="0.9" />`;
    art += `<circle cx="0" cy="0" r="4" fill="#ffffff" />`;
    art += `</g>`;
  });

  art += `</g>`;

  return wrapDocumentSvg('Pearl Waves', emerald, art);
}

module.exports = { generatePearlWaves };
