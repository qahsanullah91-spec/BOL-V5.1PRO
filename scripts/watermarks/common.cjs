const fs = require('node:fs');
const path = require('node:path');

function wrapDocumentSvg(title, color, innerArtwork, extraDefs = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1400" width="100%" height="100%">
  <title>${title} — Sky Ariana Logistics Security Watermark</title>
  <defs>
    <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.95" />
      <stop offset="100%" stop-color="${color}" stop-opacity="0.5" />
    </linearGradient>
    ${extraDefs}
  </defs>

  <!-- Security Document Outer Border & Calibrated Framing -->
  <g fill="none" stroke="${color}">
    <rect x="22" y="22" width="856" height="1356" rx="4" stroke-width="2.4" opacity="0.8" />
    <rect x="30" y="30" width="840" height="1340" rx="2" stroke-width="1" stroke-dasharray="6 4" opacity="0.65" />
    <rect x="40" y="40" width="820" height="1320" stroke-width="0.8" opacity="0.45" />

    <!-- Corner Alignment Crosshairs -->
    <path d="M14,44 L14,14 L44,14" stroke-width="3" opacity="0.9" />
    <path d="M886,44 L886,14 L856,14" stroke-width="3" opacity="0.9" />
    <path d="M14,1356 L14,1386 L44,1386" stroke-width="3" opacity="0.9" />
    <path d="M886,1356 L886,1386 L856,1386" stroke-width="3" opacity="0.9" />

    <!-- Corner Security Rosettes -->
    <g transform="translate(75,75)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.75" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.65" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.75" />
      <circle cx="0" cy="0" r="5" fill="${color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(825,75)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.75" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.65" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.75" />
      <circle cx="0" cy="0" r="5" fill="${color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(75,1325)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.75" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.65" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.75" />
      <circle cx="0" cy="0" r="5" fill="${color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(825,1325)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.75" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.65" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.75" />
      <circle cx="0" cy="0" r="5" fill="${color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>

    <!-- Top & Bottom Micro-Text Security Banners -->
    <text x="450" y="19" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" letter-spacing="4" text-anchor="middle" fill="${color}" opacity="0.9">★ SKY ARIANA LOGISTICS · OFFICIAL MULTI-MODAL BILL OF LADING SECURITY SYSTEM ★</text>
    <text x="450" y="1391" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" letter-spacing="4" text-anchor="middle" fill="${color}" opacity="0.9">★ AUTHENTIC SECURE CARGO WAYBILL · VERIFIED INTERNATIONAL TRANSIT NETWORK ★</text>
  </g>

  <!-- Central Security Engraving Artwork -->
  ${innerArtwork}
</svg>`;
}

module.exports = {
  wrapDocumentSvg,
};
