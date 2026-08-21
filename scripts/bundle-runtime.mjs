#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const indexPath = path.join(root, 'index.html');
const swPath = path.join(root, 'sw.js');

if (!fs.existsSync(indexPath)) {
  console.error(`Runtime bundler: missing ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
const local = ref => !/^(?:https?:|data:|#)/i.test(ref);
const cleanRef = ref => ref.replace(/^\.\//, '').split(/[?#]/, 1)[0];

const cssTagRe = /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
const scriptTagRe = /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;

const cssTags = [...html.matchAll(cssTagRe)].map(match => ({ full: match[0], ref: match[1], index: match.index ?? 0 }));
const scriptTags = [...html.matchAll(scriptTagRe)].map(match => ({ full: match[0], attrs: `${match[1]} ${match[3]}`, ref: match[2], index: match.index ?? 0 }));
const localCss = cssTags.filter(entry => local(entry.ref));
const localScripts = scriptTags.filter(entry => local(entry.ref));

if (!localCss.length) throw new Error('Runtime bundler: no local stylesheets found in index.html');
if (!localScripts.length) throw new Error('Runtime bundler: no local scripts found in index.html');
for (const entry of localScripts) {
  if (/\b(?:async|defer)\b|\btype\s*=\s*["']module["']/i.test(entry.attrs)) {
    throw new Error(`Runtime bundler: ${entry.ref} is async/defer/module and cannot join the synchronous classic bundle safely`);
  }
}

function readDeployFile(ref) {
  const rel = cleanRef(ref);
  const abs = path.join(root, rel);
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(root + path.sep)) throw new Error(`Runtime bundler: unsafe asset path ${ref}`);
  if (!fs.existsSync(resolved)) throw new Error(`Runtime bundler: referenced asset missing: ${ref}`);
  return { rel, abs: resolved, text: fs.readFileSync(resolved, 'utf8') };
}

const cssFiles = localCss.map(entry => readDeployFile(entry.ref));
const scriptFiles = localScripts.map(entry => readDeployFile(entry.ref));

const cssBundleName = 'codeopolis.css';
const jsBundleName = 'codeopolis-runtime.js';
const cssBundle = cssFiles.map(file => `/* @codeopolis-source ${file.rel} */\n${file.text.trim()}\n`).join('\n');
const jsBundle = scriptFiles.map(file => `/* @codeopolis-source ${file.rel} */\n${file.text.trim()}\n;\n`).join('\n');
fs.writeFileSync(path.join(root, cssBundleName), cssBundle);
fs.writeFileSync(path.join(root, jsBundleName), jsBundle);

// Preserve the exact position of the first synchronous local asset while removing
// the historical fan-out. External assets and inline tags remain untouched.
const firstCss = localCss[0].full;
let cssInserted = false;
html = html.replace(cssTagRe, full => {
  const match = full.match(/href=["']([^"']+)["']/i);
  if (!match || !local(match[1])) return full;
  if (!cssInserted && full === firstCss) {
    cssInserted = true;
    return `<link rel="stylesheet" href="${cssBundleName}">`;
  }
  return '';
});

const firstScript = localScripts[0].full;
let scriptInserted = false;
html = html.replace(scriptTagRe, full => {
  const match = full.match(/src=["']([^"']+)["']/i);
  if (!match || !local(match[1])) return full;
  if (!scriptInserted && full === firstScript) {
    scriptInserted = true;
    return `<script src="${jsBundleName}"></script>`;
  }
  return '';
});

if (!cssInserted || !scriptInserted) throw new Error('Runtime bundler: failed to rewrite index asset fan-out');
fs.writeFileSync(indexPath, html);

// Service worker install must not keep precaching files removed by bundling.
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  const cssSet = new Set(cssFiles.map(file => `./${file.rel}`));
  const jsSet = new Set(scriptFiles.map(file => `./${file.rel}`));
  sw = sw.replace(/const CORE=\[([^\]]*)\];/, (full, body) => {
    const refs = [...body.matchAll(/["']([^"']+)["']/g)].map(match => match[1]);
    if (!refs.length) return full;
    const mapped = refs.map(ref => cssSet.has(ref) ? `./${cssBundleName}` : jsSet.has(ref) ? `./${jsBundleName}` : ref);
    const unique = [...new Set(mapped)];
    return `const CORE=[${unique.map(ref => `'${ref}'`).join(',')}];`;
  });
  fs.writeFileSync(swPath, sw);
}

// The bundle is now authoritative for these index-loaded assets. Removing the
// originals avoids doubling the deploy payload and turns accidental direct use
// of a retired bootstrap asset into an acceptance-test failure.
for (const file of [...cssFiles, ...scriptFiles]) fs.rmSync(file.abs);

// Remove empty directories left behind only by bundled bootstrap files. Keep
// non-empty feature directories because workers, dynamically loaded controllers,
// images, manifests and other runtime assets still live there.
function pruneEmpty(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const abs = path.join(dir, entry.name);
    pruneEmpty(abs);
    if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
  }
}
pruneEmpty(root);

console.log(`Runtime bundle: ${scriptFiles.length} scripts -> ${jsBundleName}`);
console.log(`Style bundle: ${cssFiles.length} stylesheets -> ${cssBundleName}`);
