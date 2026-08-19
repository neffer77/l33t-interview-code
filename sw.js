const CACHE='codeopolis-v29-shell-1';
const CORE=['./','./index.html','./styles.css','./phase26.css','./phase27.css','./phase29.css','./manifest.webmanifest','./src/interview/interview-day.js','./src/interview/phase29-ui.js','./src/interview/phase29-bootstrap.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('codeopolis-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

async function networkFirst(request){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}
    return response;
  }catch(error){
    const cached=await caches.match(request);
    if(cached)return cached;
    if(request.mode==='navigate')return caches.match('./index.html');
    throw error;
  }
}
async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(request,copy));}
  return response;
}
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const destination=e.request.destination;
  const liveCode=e.request.mode==='navigate'||['script','style','worker'].includes(destination)||/\.(?:html?|js|css|json)$/i.test(u.pathname);
  e.respondWith(liveCode?networkFirst(e.request):cacheFirst(e.request));
});
