const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file.startsWith('.') || file === 'release' || file === 'dist-electron') continue;
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full));
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(full);
      }
    }
  } catch (e) {}
  return results;
}

const files = walk('components').concat(walk('app'));
const results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match any <span that eventually has onClick before its closing >
  const regex = /<span\b([^>]*?)>/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tagContent = match[1];
    if (
      tagContent.includes('onClick') ||
      tagContent.includes('onMouseDown') ||
      tagContent.includes('onPointerDown') ||
      tagContent.includes('cursor-pointer') ||
      tagContent.includes('role="button"')
    ) {
      const line = content.slice(0, match.index).split('\n').length;
      results.push({
        file,
        line,
        snippet: ('<span ' + tagContent).slice(0, 150).replace(/\s+/g, ' ')
      });
    }
  }
}

console.log('Results count:', results.length);
results.forEach(r => console.log(`${r.file}:${r.line} -> ${r.snippet}`));
