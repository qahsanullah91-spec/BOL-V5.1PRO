const fs = require('fs');
const path = require('path');

const b64 = fs.readFileSync(path.resolve(__dirname, '../public/images/afghan-plate-landmark.b64.txt'), 'utf8').trim();

const code = `/**
 * Official Kabul Landmark Silhouette Asset
 * Extracted directly from official Afghan vehicle registration reference plate.
 * Encoded as optimized data URI for instant offline rendering & zero-latency PDF exports.
 */
export const KABUL_LANDMARK_DATA_URI = "${b64}";
`;

fs.writeFileSync(path.resolve(__dirname, '../lib/utils/afghan-plate-landmark.ts'), code, 'utf8');
console.log('Successfully generated lib/utils/afghan-plate-landmark.ts');
