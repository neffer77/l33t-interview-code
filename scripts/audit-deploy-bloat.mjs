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

  const scriptRefs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  const localScripts = scriptRefs.filter(ref => !/^(?:https?:|data:)/.test(ref));
  const cssRefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/g)].map(m => m[1]);
  const localCss = cssRefs.filter(ref => !/^(?:https?:|data:)/.test(ref));
  const phaseCss = cssRefs.filter(ref => /^phase\d+\.css$/.test(ref));

  if (localScripts.length !== 1 || localScripts[0] !== 'codeopolis-runtime.js') {
    violations.push(`index.html: expected one compiled local runtime script, found ${localScripts.join(', ') || 'none'}`);
  }
  if (localCss.length !== 1 || localCss[0] !== 'codeopolis.css') {
    violations.push(`index.html: expected one compiled local stylesheet, found ${localCss.join(', ') || 'none'}`);
  }
  if (phaseCss.length) violations.push(`index.html: historical phase stylesheet fan-out returned: ${phaseCss.join(', ')}`);

  console.log(`Runtime bootstrap inventory: ${localScripts.length} local script, ${localCss.length} local stylesheet, ${phaseCss.length} historical phase stylesheets.`);
}

const runtimePath = path.join(root, 'codeopolis-runtime.js');
if (fs.existsSync(runtimePath)) {
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const gateAt = runtime.indexOf('@codeopolis-source python-runtime-gate.js');
  const appAt = runtime.indexOf('@codeopolis-source app.js');
  const workerAt = runtime.indexOf('@codeopolis-source worker-bridge.js');
  if (gateAt < 0) violations.push('codeopolis-runtime.js: python-runtime-gate.js source is missing');
  if (appAt < 0) violations.push('codeopolis-runtime.js: app.js source is missing');
  if (workerAt < 0) violations.push('codeopolis-runtime.js: worker-bridge.js source is missing');
  if (gateAt >= 0 && appAt >= 0 && gateAt > appAt) violations.push('codeopolis-runtime.js: Python runtime gate must execute before app.js');
  if (appAt >= 0 && workerAt >= 0 && appAt > workerAt) violations.push('codeopolis-runtime.js: app.js must establish judge/render globals before worker-bridge.js overrides them');
}

for (const required of ['codeopolis-runtime.js', 'codeopolis.css', 'python-worker.js', 'sw.js', 'manifest.webmanifest']) {
  if (!files.includes(required)) violations.push(`${required}: required runtime asset missing from deploy`);
}
for (const retired of ['python-runtime-gate.js', 'app.js', 'worker-bridge.js', 'styles.css', 'phase26.css', 'phase27.css']) {
  if (files.includes(retired)) violations.push(`${retired}: source bootstrap asset should be compiled into the production bundle, not deployed separately`);
}

const swPath = path.join(root, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  if (!sw.includes("'./codeopolis.css'") && !sw.includes('"./codeopolis.css"')) violations.push('sw.js: compiled stylesheet is missing from precache shell');
  for (const stale of ['./styles.css', './phase26.css', './phase27.css']) {
    if (sw.includes(stale)) violations.push(`sw.js: stale precache reference survived bundling: ${stale}`);
  }
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
