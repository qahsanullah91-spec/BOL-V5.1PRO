const fs = require('fs');
const path = 'components/accounts/account-manager.tsx';
const s = fs.readFileSync(path, 'utf8');
let stack = [];
for (let i = 0; i < s.length; i++) {
  const c = s[i];
  if (c === '(') stack.push(i);
  if (c === ')') stack.pop();
}
if (stack.length) {
  const i = stack[stack.length - 1];
  const prefix = s.slice(0, i + 1);
  const lines = prefix.split(/\r?\n/);
  console.log('unmatched ( at pos', i, 'line', lines.length, 'col', lines[lines.length - 1].length + 1);
  console.log('line text:', lines[lines.length - 1]);
} else {
  console.log('no unmatched (');
}
