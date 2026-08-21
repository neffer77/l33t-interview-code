#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
if (!fs.existsSync(root)) {
  console.error(`Deploy bloat audit: missing build directory ${root}`);
  process.exit(1);
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, base));
    else out.push(path.relative(base, abs).replaceAll(path.sep, '/'));
  }
  return out;
}

const files = walk(root);
const violations = [];
const forbiddenPrefixes = ['docs/', 'tests/', 'scripts/', '.github/', 'node_modules/'];
for (const file of files) {
  if (forbiddenPrefixes.some(prefix => file.startsWith(prefix))) {
    violations.push(`${file}: repository/tooling content must not ship to players`);
  }
  if (file === 'README.md' || file === '.gitignore' || file.endsWith('.md')) {
    violations.push(`${file}: repository documentation must not ship to players`);
  }
}

const indexPath = path.join(root, 'index.html');
if (!fs.existsSync(indexPath)) violations.push('index.html: missing deploy entrypoint');
else {
  const html = fs.readFileSync(indexPath, 'utf8');
  if (/https:\/\/cdn\.jsdelivr\.net\/pyodide\/[^"']*pyodide\.js/i.test(html)) {
    violations.push('index.html: eager main-thread Pyodide loader is forbidden; normal browsers must use python-worker.js');
  }
  const gateAt = html.indexOf('python-runtime-gate.js');
  const appAt = html.indexOf('app.js');
  const workerAt = html.indexOf('worker-bridge.js');
  if (gateAt < 0) violations.push('index.html: python-runtime-gate.js is missing');
  if (appAt < 0) violations.push('index.html: app.js is missing');
  if (workerAt < 0) violations.push('index.html: worker-bridge.js is missing');
  if (gateAt >= 0 && appAt >= 0 && gateAt > appAt) {
    violations.push('index.html: python-runtime-gate.js must load before app.js');
  }

  const scriptRefs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  const localScripts = scriptRefs.filter(ref => !/^(?:https?:|data:)/.test(ref));
  const cssRefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m => m[1]);
  const phaseCss = cssRefs.filter(ref => /^phase\d+\.css$/.test(ref));
  console.log(`Runtime bootstrap inventory: ${localScripts.length} local scripts, ${phaseCss.length} historical phase stylesheets.`);
}

for (const required of ['python-runtime-gate.js', 'python-worker.js', 'worker-bridge.js', 'sw.js', 'manifest.webmanifest']) {
  if (!files.includes(required)) violations.push(`${required}: required runtime asset missing from deploy`);
}

const rows = files.map(file => ({ file, bytes: fs.statSync(path.join(root, file)).size }));
const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
const top = rows.sort((a, b) => b.bytes - a.bytes).slice(0, 12);
console.log(`Deploy bloat audit: ${files.length} files, ${(totalBytes / 1024).toFixed(1)} KiB repository-hosted payload.`);
console.log('Largest repository-hosted assets:');
for (const row of top) console.log(`  ${(row.bytes / 1024).toFixed(1).padStart(8)} KiB  ${row.file}`);

if (violations.length) {
  console.error('\nDeploy bloat audit failed:');
  for (const issue of violations) console.error(`- ${issue}`);
  process.exit(1);
}

console.log('Deploy bloat audit passed.');
