import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=[];
const ok=(cond,msg)=>{if(!cond)fail.push(msg)};
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

for(const p of ['index.html','app.js','manifest.webmanifest','sw.js','scriptable/Codeopolis.js']) ok(exists(p),`missing required runtime asset: ${p}`);

const html=read('index.html');
ok(/viewport/i.test(html),'index.html missing viewport metadata');
ok(/app\.js/.test(html),'index.html does not load app.js');

for(let n=9;n<=38;n++){
  const candidates=[`src/story/phase${n}-bootstrap.js`,`src/game/phase${n}-bootstrap.js`,`src/interview/phase${n}-bootstrap.js`,`src/learning/phase${n}-bootstrap.js`,`phase${n}.js`];
  ok(candidates.some(exists),`no bootstrap/runtime entry found for phase ${n}`);
}

const manifest=JSON.parse(read('manifest.webmanifest'));
ok(Boolean(manifest.name||manifest.short_name),'manifest missing app name');
ok(manifest.display==='standalone'||manifest.display==='fullscreen','manifest should launch as an app');

const scriptable=read('scriptable/Codeopolis.js');
ok(/WebView/.test(scriptable),'Scriptable launcher does not use WebView');
ok(/https:\/\//.test(scriptable),'Scriptable launcher has no hosted URL');

const jsFiles=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules'].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.js'))jsFiles.push(p)}};
walk(root);
const corpus=jsFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
ok(/localStorage/.test(corpus),'no localStorage persistence found');
ok(/learning:mastered/.test(corpus),'authoritative mastery event contract missing');
ok(/interview-day:finished/.test(corpus),'Interview Day completion contract missing');
ok(/codeopolis:project-completed/.test(corpus),'engineering project completion contract missing');

if(fail.length){console.error('\nBETA SMOKE FAILED');for(const x of fail)console.error(' - '+x);process.exit(1)}
console.log(`Beta smoke passed: ${jsFiles.length} JS files inspected, phases 9-38 represented, PWA + Scriptable contracts present.`);
