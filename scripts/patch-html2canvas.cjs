const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Unminified SUPPORTED_COLOR_FUNCTIONS injection
  if (content.includes('var SUPPORTED_COLOR_FUNCTIONS = {') && !content.includes('oklch:')) {
    content = content.replace(
      'var SUPPORTED_COLOR_FUNCTIONS = {',
      'var safeUnsupportedColor = function () { return (typeof COLORS !== "undefined" && COLORS.TRANSPARENT) ? COLORS.TRANSPARENT : 0; };\n    var SUPPORTED_COLOR_FUNCTIONS = {\n        oklch: safeUnsupportedColor,\n        oklab: safeUnsupportedColor,\n        lab: safeUnsupportedColor,\n        lch: safeUnsupportedColor,\n        color: safeUnsupportedColor,\n        \'color-mix\': safeUnsupportedColor,'
    );
    changed = true;
  }

  // 2. Minified SUPPORTED_COLOR_FUNCTIONS map injection (e.g. yt={hsl:Bt,hsla:Bt,rgb:mt,rgba:mt})
  const minifiedMapPattern = /(\b\w+)=\{hsl:(\w+),hsla:\2,rgb:(\w+),rgba:\3\}/g;
  if (minifiedMapPattern.test(content) && !content.includes('oklch:function')) {
    content = content.replace(
      minifiedMapPattern,
      '$1={oklch:function(){return 0},oklab:function(){return 0},lab:function(){return 0},lch:function(){return 0},color:function(){return 0},\'color-mix\':function(){return 0},hsl:$2,hsla:$2,rgb:$3,rgba:$3}'
    );
    changed = true;
  }

  // 3. Pattern covering all unminified and minified throw variants:
  // throw new Error("Attempting to parse an unsupported color function \"" + value.name + "\"");
  // throw new Error('Attempting to parse an unsupported color function "'+e.name+'"')
  // throw new Error('Attempting to parse an unsupported color function "'+t.name+'"')
  const throwPattern = /throw (?:new )?Error\(\s*['"]Attempting to parse an unsupported color function\s*['"]\s*\+\s*[^)]+\);?/g;

  if (throwPattern.test(content)) {
    const isMinified = filePath.endsWith('.min.js') || (!content.includes('\n') || content.length / (content.split('\n').length || 1) > 500);
    const replacement = isMinified
      ? 'return 0;'
      : 'return (typeof COLORS !== "undefined" && COLORS.TRANSPARENT) ? COLORS.TRANSPARENT : 0;';

    content = content.replace(throwPattern, replacement);
    changed = true;
  }

  // 4. Fallback check for any lingering "unsupported color function" error throws
  if (content.includes('unsupported color function')) {
    const fallbackPattern = /throw\s+(?:new\s+)?Error\([^)]*unsupported color function[^)]*\);?/g;
    if (fallbackPattern.test(content)) {
      content = content.replace(fallbackPattern, 'return 0;');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-html2canvas] Patched: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git') walkDir(full);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      patchFile(full);
    }
  }
}

function removeDirectoryRecursive(dir) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[patch-html2canvas] Purged cache directory: ${dir}`);
    } catch (err) {
      console.warn(`[patch-html2canvas] Warning: could not purge ${dir}: ${err.message}`);
    }
  }
}

function run() {
  console.log('[patch-html2canvas] Scanning for html2canvas and html2pdf color error guards...');
  const root = path.join(__dirname, '..');
  const candidateDirs = [
    path.join(root, 'node_modules', 'html2canvas'),
    path.join(root, 'node_modules', 'html2pdf.js'),
    path.join(root, 'node_modules', '.ignored_html2pdf.js'),
    path.join(root, 'node_modules', '.ignored_html2canvas'),
  ];

  const pnpmDir = path.join(root, 'node_modules', '.pnpm');
  if (fs.existsSync(pnpmDir)) {
    try {
      const pnpmEntries = fs.readdirSync(pnpmDir);
      for (const p of pnpmEntries) {
        if (p.includes('html2canvas') || p.includes('html2pdf')) {
          candidateDirs.push(path.join(pnpmDir, p));
        }
      }
    } catch {}
  }

  for (const dir of candidateDirs) {
    walkDir(dir);
  }

  // Purge persistent webpack and Next.js caches to force re-bundling from patched files
  removeDirectoryRecursive(path.join(root, 'node_modules', '.cache', 'webpack'));
  removeDirectoryRecursive(path.join(root, '.next'));

  console.log('[patch-html2canvas] Complete.');
}

run();
