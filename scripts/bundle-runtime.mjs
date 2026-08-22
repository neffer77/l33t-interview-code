#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  PRUNED_RUNTIME_SCRIPTS,
  PRUNED_RUNTIME_STYLES,
  PRUNED_RUNTIME_DOM_IDS,
} from './runtime-prune-manifest.mjs';

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
const prunedScripts = new Set(PRUNED_RUNTIME_SCRIPTS);
const prunedStyles = new Set(PRUNED_RUNTIME_STYLES);

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

const indexedScripts = new Set(localScripts.map(entry => cleanRef(entry.ref)));
const indexedStyles = new Set(localCss.map(entry => cleanRef(entry.ref)));
for (const ref of PRUNED_RUNTIME_SCRIPTS) {
  if (!indexedScripts.has(ref)) throw new Error(`Runtime prune manifest drift: script is no longer index-loaded: ${ref}`);
}
for (const ref of PRUNED_RUNTIME_STYLES) {
  if (!indexedStyles.has(ref)) throw new Error(`Runtime prune manifest drift: stylesheet is no longer index-loaded: ${ref}`);
}

function readDeployFile(ref) {
  const rel = cleanRef(ref);
  const abs = path.join(root, rel);
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(root + path.sep)) throw new Error(`Runtime bundler: unsafe asset path ${ref}`);
  if (!fs.existsSync(resolved)) throw new Error(`Runtime bundler: referenced asset missing: ${ref}`);
  return { rel, abs: resolved, text: fs.readFileSync(resolved, 'utf8') };
}

const allCssFiles = localCss.map(entry => readDeployFile(entry.ref));
const allScriptFiles = localScripts.map(entry => readDeployFile(entry.ref));
const cssFiles = allCssFiles.filter(file => !prunedStyles.has(file.rel));
const scriptFiles = allScriptFiles.filter(file => !prunedScripts.has(file.rel));
if (!cssFiles.length || !scriptFiles.length) throw new Error('Runtime bundler: prune manifest removed the complete bootstrap');

const cssBundleName = 'codeopolis.css';
const jsBundleName = 'codeopolis-runtime.js';
const cssBundle = cssFiles.map(file => `/* @codeopolis-source ${file.rel} */\n${file.text.trim()}\n`).join('\n');
const jsBundle = scriptFiles.map(file => `/* @codeopolis-source ${file.rel} */\n${file.text.trim()}\n;\n`).join('\n');
fs.writeFileSync(path.join(root, cssBundleName), cssBundle);
fs.writeFileSync(path.join(root, jsBundleName), jsBundle);

// Preserve the first retained synchronous local asset position while removing
// both historical fan-out and explicitly retired P2 surfaces.
const firstCss = localCss.find(entry => !prunedStyles.has(cleanRef(entry.ref)))?.full;
let cssInserted = false;
html = html.replace(cssTagRe, full => {
  const match = full.match(/href=["']([^"']+)["']/i);
  if (!match || !local(match[1])) return full;
  const rel = cleanRef(match[1]);
  if (prunedStyles.has(rel)) return '';
  if (!cssInserted && full === firstCss) {
    cssInserted = true;
    return `<link rel="stylesheet" href="${cssBundleName}">`;
  }
  return '';
});

const firstScript = localScripts.find(entry => !prunedScripts.has(cleanRef(entry.ref)))?.full;
let scriptInserted = false;
html = html.replace(scriptTagRe, full => {
  const match = full.match(/src=["']([^"']+)["']/i);
  if (!match || !local(match[1])) return full;
  const rel = cleanRef(match[1]);
  if (prunedScripts.has(rel)) return '';
  if (!scriptInserted && full === firstScript) {
    scriptInserted = true;
    return `<script src="${jsBundleName}"></script>`;
  }
  return '';
});

if (!cssInserted || !scriptInserted) throw new Error('Runtime bundler: failed to rewrite index asset fan-out');

// Remove empty roots that existed only for retired top-level historical tools.
for (const id of PRUNED_RUNTIME_DOM_IDS) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<section\\b(?=[^>]*\\bid=["']${escaped}["'])[^>]*>\\s*</section>`, 'gi');
  html = html.replace(re, '');
  if (new RegExp(`\\bid=["']${escaped}["']`, 'i').test(html)) {
    throw new Error(`Runtime prune manifest: failed to remove retired DOM root #${id}`);
  }
}
fs.writeFileSync(indexPath, html);

// Service worker install must not keep precaching files removed by bundling or
// P2 retirement. Retained index assets map to the compiled bundles; retired
// assets are dropped outright.
if (fs.existsSync(swPath)) {
  let sw = fs.readFileSync(swPath, 'utf8');
  const cssSet = new Set(cssFiles.map(file => `./${file.rel}`));
  const jsSet = new Set(scriptFiles.map(file => `./${file.rel}`));
  const prunedSet = new Set([
    ...PRUNED_RUNTIME_STYLES.map(ref => `./${ref}`),
    ...PRUNED_RUNTIME_SCRIPTS.map(ref => `./${ref}`),
  ]);
  sw = sw.replace(/const CORE=\[([^\]]*)\];/, (full, body) => {
    const refs = [...body.matchAll(/["']([^"']+)["']/g)].map(match => match[1]);
    if (!refs.length) return full;
    const mapped = refs.flatMap(ref => {
      if (prunedSet.has(ref)) return [];
      if (cssSet.has(ref)) return [`./${cssBundleName}`];
      if (jsSet.has(ref)) return [`./${jsBundleName}`];
      return [ref];
    });
    const unique = [...new Set(mapped)];
    return `const CORE=[${unique.map(ref => `'${ref}'`).join(',')}];`;
  });
  fs.writeFileSync(swPath, sw);
}

// The compiled bundle is authoritative. Remove all source bootstrap assets from
// the deploy, including P2-pruned modules that are deliberately not in the bundle.
for (const file of [...allCssFiles, ...allScriptFiles]) fs.rmSync(file.abs);

function pruneEmpty(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const abs = path.join(dir, entry.name);
    pruneEmpty(abs);
    if (fs.readdirSync(abs).length === 0) fs.rmdirSync(abs);
  }
}
pruneEmpty(root);

console.log(`Runtime bundle: ${scriptFiles.length}/${allScriptFiles.length} scripts retained -> ${jsBundleName} (${allScriptFiles.length - scriptFiles.length} pruned)`);
console.log(`Style bundle: ${cssFiles.length}/${allCssFiles.length} stylesheets retained -> ${cssBundleName} (${allCssFiles.length - cssFiles.length} pruned)`);
