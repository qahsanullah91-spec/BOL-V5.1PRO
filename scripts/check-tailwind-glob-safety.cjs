#!/usr/bin/env node
// Pre-flight check: fails when any filename would corrupt Tailwind v4's
// automatic source-detection watcher globs (the per-directory
// "**" + "/*.{" + comma-joined extensions + "}" pattern).
//
// Background: @tailwindcss/oxide walks the project and fills one brace
// alternation per directory with the "extension" of every filename it sees
// (everything after the last dot). A file named `x.name)})` injects
// `name)})` into that group; the embedded `}` closes the alternation early
// and the Rust glob parser aborts the whole `next build` with:
//   "unopened alternate group; missing '{' (maybe escape '}' with '[}]'?)"
// as happened in SKY-ARIANA-DOC on 2026-10-18 (fixed by commit af94cc6).
//
// Usage:
//   node scripts/check-tailwind-glob-safety.cjs        // check only, exit 1 on offenders
//   node scripts/check-tailwind-glob-safety.cjs --fix  // also delete the offending files
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_ARG = process.argv.find((a) => a.startsWith('--root='));
const ROOT = ROOT_ARG ? path.resolve(ROOT_ARG.slice(7)) : path.resolve(__dirname, '..');
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.next-production',
  '.next-candidate',
  '.build-temp',
]);
// A `{` or `}` anywhere in a filename terminates/corrupts the alternation
// group and is always fatal. Other characters are only dangerous in the
// learned "extension" (the text after the last dot) — parens/quotes in the
// stem are harmless (e.g. "invoice (1).pdf" learns only "pdf").
const FATAL = /[{}]/;
const RISKY_EXT = /[(),'"\\]|\s/;

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // unreadable directory (permissions, junctions) — skip
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function isUnsafe(baseName) {
  if (FATAL.test(baseName)) return 'brace in filename breaks glob alternation';
  const dot = baseName.lastIndexOf('.');
  if (dot <= 0) return null; // no extension — contributes nothing to the glob
  if (RISKY_EXT.test(baseName.slice(dot + 1))) {
    return 'glob-risky characters in extension';
  }
  return null;
}

const fix = process.argv.includes('--fix');
const files = walk(ROOT, []);

let tracked = new Set();
try {
  tracked = new Set(
    execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
      .map((p) => p.replace(/\//g, path.sep)),
  );
} catch {
  // not a git checkout — treat every file as untracked
}

const offenders = [];
for (const file of files) {
  const reason = isUnsafe(path.basename(file));
  if (reason) offenders.push({ file, reason, tracked: tracked.has(path.relative(ROOT, file)) });
}

if (offenders.length === 0) {
  console.log(`tailwind glob safety: OK (${files.length} files checked)`);
  process.exit(0);
}

for (const { file, reason, tracked } of offenders) {
  const rel = path.relative(ROOT, file);
  if (fix) {
    if (tracked) {
      execFileSync('git', ['rm', '-f', '--', rel], { cwd: ROOT, stdio: 'inherit' });
    } else {
      fs.rmSync(file);
    }
    console.log(`removed (${reason}): ${rel}${tracked ? ' [was git-tracked]' : ''}`);
  } else {
    console.error(`UNSAFE (${reason}): ${rel}${tracked ? ' [git-tracked]' : ' [untracked]'}`);
  }
}

if (!fix) {
  console.error(
    `\n${offenders.length} file(s) would break Tailwind v4 source detection and crash \`next build\`.` +
      `\nRe-run with --fix to remove them, or delete/rename them manually, then commit.`,
  );
  process.exit(1);
}
console.log(`\nremoved ${offenders.length} unsafe file(s); re-run without --fix to verify.`);
