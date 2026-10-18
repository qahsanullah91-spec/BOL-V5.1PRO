const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const appDataRoot = path.join(process.env.APPDATA || '', 'AQ COMPANIES', 'data');
const backupsRoot = path.join(process.env.APPDATA || '', 'AQ COMPANIES', 'data_backups');
const winUnpackedData = path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'seed-data');
const programFilesData = path.join('C:', 'Program Files', 'AQ COMPANIES', 'resources', 'seed-data');

console.log('=====================================================');
console.log(' AQ COMPANIES - Sync Desktop Data to AppData & Seed');
console.log('=====================================================');

if (!fs.existsSync(appDataRoot)) {
  fs.mkdirSync(appDataRoot, { recursive: true });
}

function formatDriverRentValue(rawRent, fallbackRent) {
  const rawStr = rawRent !== undefined && rawRent !== null ? String(rawRent).trim() : '';
  const fbStr = fallbackRent !== undefined && fallbackRent !== null ? String(fallbackRent).trim() : '';
  const isZeroOrEmpty = (s) => !s || s === '0' || s === '0.00' || s === '0.0000' || s === 'null' || s === 'undefined';

  let candidate = rawStr;
  if (isZeroOrEmpty(rawStr) && !isZeroOrEmpty(fbStr)) {
    candidate = fbStr;
  } else if (
    !isZeroOrEmpty(fbStr) &&
    /^[\d,.]+$/.test(rawStr) &&
    (fbStr.includes('AFN') || fbStr.includes('کرایه') || fbStr.includes('USD') || fbStr.includes('$'))
  ) {
    candidate = fbStr;
  }

  if (isZeroOrEmpty(candidate)) return '';
  const numCheck = candidate.match(/[\d,]+(?:\.\d+)?/);
  const parsedCheck = numCheck ? parseFloat(numCheck[0].replace(/,/g, '')) : NaN;
  if (/\bUSD\b|\$|دالر/i.test(candidate) && (isNaN(parsedCheck) || parsedCheck < 30000)) return candidate;

  const afnMatch = candidate.match(/^\s*([\d,]+(?:\.\d+)?)\s*(?:[-–—]?\s*(?:AFN|USD|افغانی))?(?:\s*[-–—:]\s*(.*))?$/i);
  if (afnMatch) {
    const numVal = parseFloat(afnMatch[1].replace(/,/g, ''));
    const notePart = (afnMatch[2] || '').trim();
    const hasAfnKeyword = /AFN|افغانی|کرایه/i.test(candidate);
    if (!isNaN(numVal) && numVal > 0 && (numVal >= 5000 || hasAfnKeyword)) {
      const formattedNum = Math.round(numVal).toLocaleString('en-US');
      const suffix = notePart || 'کرایه واپسی';
      return `${formattedNum} AFN - ${suffix}`;
    }
  }

  return candidate
    .replace(/([\d,]+)\s*[-–—]\s*AFN/gi, '$1 AFN')
    .replace(/AFN\s*[-–—]\s*کرایه واپسی/gi, 'AFN - کرایه واپسی');
}

function writeJsonAtomically(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

// 1. Create timestamped backup of existing AppData
const backupDir = path.join(backupsRoot, `backup-${Date.now()}`);
fs.mkdirSync(backupDir, { recursive: true });

const existingAppDataFiles = fs.readdirSync(appDataRoot);
let backedUpCount = 0;
for (const f of existingAppDataFiles) {
  const src = path.join(appDataRoot, f);
  if (fs.statSync(src).isFile()) {
    fs.copyFileSync(src, path.join(backupDir, f));
    backedUpCount++;
  }
}
console.log(`[1] Created timestamped backup of AppData: ${backedUpCount} files in ${backupDir}`);

// 1b. Merge .local-bols.json across projectRoot, appDataRoot, and recent 2026-10-12 backups so no BOL is ever lost
try {
  const bolMap = new Map();
  const sources = [
    path.join(projectRoot, '.local-bols.json'),
    path.join(backupsRoot, 'backup-1791792768091', '.local-bols.json'),
    path.join(backupsRoot, 'backup-1791793646503', '.local-bols.json'),
    path.join(backupsRoot, 'backup-1791795471843', '.local-bols.json'),
    path.join(backupsRoot, 'backup-1791797243948', '.local-bols.json'),
    path.join(backupsRoot, 'backup-1791834151424', '.local-bols.json'),
    path.join(appDataRoot, '.local-bols.json'),
  ];

  for (const srcPath of sources) {
    if (!fs.existsSync(srcPath)) continue;
    try {
      const list = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        const key = String(item?.bol_number || item?.id || '').trim();
        if (!key || key === 'BOL-RESTORE-TEST-1') continue;
        const prev = bolMap.get(key);
        const normalizedRent = formatDriverRentValue(
          item.driver_rent,
          item.driverFreight || item.driverRent || prev?.driver_rent || prev?.driverFreight
        );
        const mergedItem = {
          ...(prev || {}),
          ...item,
          driver_rent: normalizedRent,
          driverRent: normalizedRent,
          driverFreight: normalizedRent,
        };
        bolMap.set(key, mergedItem);
      }
    } catch (_) {}
  }

  const parseSeq = (bol) => {
    const m = String(bol || '').match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const mergedBols = [...bolMap.values()].sort((a, b) => {
    const seqB = parseSeq(b.bol_number);
    const seqA = parseSeq(a.bol_number);
    if (seqB !== seqA) return seqB - seqA;
    return String(b.updated_at || b.created_at || '').localeCompare(String(a.updated_at || a.created_at || ''));
  });

  if (mergedBols.length > 0) {
    writeJsonAtomically(path.join(projectRoot, '.local-bols.json'), mergedBols);
  }
} catch (err) {
  console.warn('[1b] Warning merging .local-bols.json:', err.message);
}

// 1c. Preserve newer ledger files from AppData / recent backup into projectRoot
for (const ledgerFile of ['.local-account-ledgers.json', '.local-bol-account-ledgers.json']) {
  try {
    const projPath = path.join(projectRoot, ledgerFile);
    const candidatePaths = [
      path.join(backupsRoot, 'backup-1791797243948', ledgerFile),
      path.join(appDataRoot, ledgerFile),
    ];
    let bestData = fs.existsSync(projPath) ? JSON.parse(fs.readFileSync(projPath, 'utf8')) : null;
    for (const candPath of candidatePaths) {
      if (!fs.existsSync(candPath)) continue;
      const candData = JSON.parse(fs.readFileSync(candPath, 'utf8'));
      if (!bestData || String(candData?.updated_at || '') > String(bestData?.updated_at || '')) {
        bestData = candData;
      }
    }
    if (bestData) {
      writeJsonAtomically(projPath, bestData);
    }
  } catch (_) {}
}

// 2. Identify all .local-*.json files in project root
const DATA_FILE_PATTERN = /^(?:\.local-[a-z0-9-]+\.json|\.(?:bol|invoice)-counter)$/i;
const projectFiles = fs.readdirSync(projectRoot).filter(f => DATA_FILE_PATTERN.test(f));

const targetDirs = [appDataRoot];
if (fs.existsSync(winUnpackedData)) targetDirs.push(winUnpackedData);
if (fs.existsSync(programFilesData)) targetDirs.push(programFilesData);

for (const targetDir of targetDirs) {
  try {
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    let copied = 0;
    for (const f of projectFiles) {
      const src = path.join(projectRoot, f);
      const dest = path.join(targetDir, f);
      try {
        fs.copyFileSync(src, dest);
        copied++;
      } catch (e) {
        // Skip protected directories like C:\Program Files if running without elevated admin
      }
    }
    console.log(`[2] Copied ${copied} data files -> ${targetDir}`);
  } catch (err) {
    console.warn(`[2] Skipping non-writable target: ${targetDir}`);
  }
}

// 3. Synchronize app.db
const srcDb = path.join(projectRoot, 'data', 'app.db');
if (fs.existsSync(srcDb)) {
  const dbTargets = [
    path.join(appDataRoot, 'app.db'),
    path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'seed-data', 'data', 'app.db'),
    path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'seed-data', 'app.db'),
    path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'backend', 'data', 'app.db'),
  ];

  for (const dest of dbTargets) {
    try {
      const dir = path.dirname(dest);
      if (fs.existsSync(path.dirname(dir)) || fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(srcDb, dest);
        console.log(`[3] Copied app.db -> ${dest} (${(fs.statSync(dest).size / (1024*1024)).toFixed(2)} MB)`);
      }
    } catch (e) {}
  }
}

// 4. Synchronize public/uploads
const srcUploads = path.join(projectRoot, 'public', 'uploads');
if (fs.existsSync(srcUploads)) {
  const uploadTargets = [
    path.join(appDataRoot, 'uploads'),
    path.join(projectRoot, 'release', 'win-unpacked', 'resources', 'app-server', 'public', 'uploads'),
  ];

  function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcItem = path.join(src, item);
      const destItem = path.join(dest, item);
      if (fs.statSync(srcItem).isDirectory()) {
        copyDirRecursive(srcItem, destItem);
      } else {
        try { fs.copyFileSync(srcItem, destItem); } catch (e) {}
      }
    }
  }

  for (const dest of uploadTargets) {
    try {
      const parent = path.dirname(dest);
      if (fs.existsSync(parent)) {
        copyDirRecursive(srcUploads, dest);
        console.log(`[4] Synced uploads directory -> ${dest}`);
      }
    } catch (e) {}
  }
}

// 5. Verification
const verifiedBols = JSON.parse(fs.readFileSync(path.join(appDataRoot, '.local-bols.json'), 'utf8'));
console.log(`\nVerification:`);
console.log(`  AppData .local-bols.json count: ${verifiedBols.length}`);
console.log(`  Project .local-bols.json count: ${JSON.parse(fs.readFileSync(path.join(projectRoot, '.local-bols.json'), 'utf8')).length}`);
console.log(`  Latest BOLs: ${verifiedBols.slice(0, 6).map(x => `${x.bol_number} (${x.driver_rent})`).join(', ')}`);
console.log('Sync complete successfully!\n');
