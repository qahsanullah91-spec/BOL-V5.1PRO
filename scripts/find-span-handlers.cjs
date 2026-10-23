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
const found = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Match <span ... onClick ... > even across multiple lines
  const regex = /<span\s+[^>]*\bon[A-Z][a-zA-Z]*\s*=/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const line = content.slice(0, match.index).split('\n').length;
    found.push({ file, line, snippet: match[0].slice(0, 100).replace(/\s+/g, ' ') });
  }
}

console.log('Found spans with direct event handlers:', found.length);
found.forEach(f => console.log(f.file + ':' + f.line + ' -> ' + f.snippet));
