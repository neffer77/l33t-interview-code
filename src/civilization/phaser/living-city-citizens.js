(function(C){'use strict';const VERSION=8,MAX_CITIZENS=18,SCHEDULE_URL='src/civilization/phaser/citizen-schedules.js',AMBIENT_URL='src/civilization/phaser/ambient-city-activity.js',REACTION_URL='src/civilization/phaser/city-event-reactions.js',IDENTITY_URL='src/civilization/phaser/citizen-identities.js',DIALOGUE_URL='src/civilization/phaser/citizen-dialogue-mentorship.js';function load(src,flag,ready,onload){if(ready())return onload?.();if(typeof document==='undefined')return;const old=document.querySelector(`script[data-${flag}="1"]`);if(old)return;const s=document.createElement('script');s.src=src;s.dataset[flag.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]='1';s.onload=()=>onload?.();document.head.appendChild(s)}function ensureSchedules(){load(SCHEDULE_URL,'p5b-schedules',()=>!!C.CitizenSchedules,refresh)}function ensureAmbient(){load(AMBIENT_URL,'p5c-ambient',()=>!!C.AmbientCityActivity,()=>{C.AmbientCityActivity?.install?.();refresh()})}function ensureReactions(){load(REACTION_URL,'p5d-reactions',()=>!!C.CityEventReactions,()=>C.CityEventReactions?.install?.())}function ensureIdentities(){load(IDENTITY_URL,'p5e-identities',()=>!!C.CitizenIdentities,refresh)}function ensureDialogue(){load(DIALOGUE_URL,'p5f-dialogue',()=>!!C.CitizenDialogueMentorship,refresh)}// Citizens were coloured dots. When the sprite atlas is loaded, draw the real
// villager art instead, cycling the six role families so a crowd reads as a mix
// of people. Falls straight back to the dot when no atlas frame is available.
const ATLAS='city',BADGE_PX=11,ROLE_ART=['builder','scholar','merchant','gardener','keeper','messenger'];
// The badge and nameplate used fixed +-offsets tuned for a 3px dot. A villager
// sprite is many times taller, so those offsets printed the badge across its
// chest. Derive both from the sprite's real height, keeping the old numbers for
// the circle fallback.
/* The activity badge was a black text box with an ASCII glyph floating over every citizen — 18 of them sitting on the art. The atlas now carries a real pixel icon per activity, so use that and drop the box. Falls back to the glyph when no atlas frame matches. */
const ACTIVITY_ART={walking:'commute',resting:'rest',commuting:'commute',socializing:'socialize',work:'work',craft:'craft',market:'market',study:'study',research:'research',compute:'compute',maintain:'maintain',operate:'operate',inspect:'inspect',respond:'respond'};
function activityFrame(scene,a){const frames=scene?.art?.(),k=ACTIVITY_ART[a];return frames&&k&&frames.has(k)?k:null}
function makeBadge(scene,x,y,activity,depth){const fr=activityFrame(scene,activity);
  if(!fr)return scene.add.text(x,y,activityGlyph(activity),{fontFamily:'monospace',fontSize:'8px',color:'#ffffff',backgroundColor:'#14212999',padding:{x:1,y:0}}).setOrigin(.5,1).setDepth(depth);
  /* Fixed pixel height, not a scale factor — atlas frames differ in size, so a
     flat .5 made some badges taller than the citizen carrying them. */
  const img=scene.add.image(x,y,ATLAS,fr).setOrigin(.5,1).setDepth(depth);
  return fitBadge(img)}
/* Pin the display size outright rather than deriving a scale from .height:
   the frames vary, and setFrame() re-sizes the object on an activity change,
   which silently undid a scale computed at creation. */
function fitBadge(img){const h=img.frame?.realHeight||img.height||BADGE_PX,w=img.frame?.realWidth||img.width||BADGE_PX;
  return img.setDisplaySize(Math.max(1,Math.round(BADGE_PX*(w/Math.max(1,h)))),BADGE_PX)}
function updateBadge(scene,badge,activity){if(!badge)return;const fr=activityFrame(scene,activity);if(fr&&badge.setFrame){badge.setFrame(fr);fitBadge(badge)}else badge.setText?.(activityGlyph(activity))}
function labelY(sprite){const h=sprite?.displayHeight||0;return h>8?{top:sprite.y-h*.92,bot:sprite.y+h*.14}:{top:sprite.y-8,bot:sprite.y+7}}
function citizenArt(scene,i){const frames=scene?.art?.();if(!frames||!frames.size)return null;const fam=ROLE_ART[i%ROLE_ART.length];for(let n=1;n<=8;n++){const k=`cit-${fam}-${n}`;if(frames.has(k))return k}return null}
function key(p){return`${p.x},${p.y}`}function roadSet(s){return new Set((s?.roads||[]).map(key))}function neighbors(p,set){return[{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}].filter(n=>set.has(key(n)))}function nearestRoad(point,roads){if(!roads?.length)return null;let best=null,dist=1e9;for(const r of roads){const d=Math.abs(r.x-point.x)+Math.abs(r.y-point.y);if(d<dist){dist=d;best=r}}return best}
  function buildingSet(s){return new Set((s?.buildings||[]).map(key))}
  /* Walk a multi-tile leg out into single tiles. A leg longer than one tile used
     to be a single tween, so a citizen crossing open ground slid over it — and
     straight through anything in the way. Pick whichever L-shape clips fewer
     buildings so the detour looks like walking round a wall, not through it. */
  function legSteps(a,b,blocked){
    const run=(first)=>{const out=[];let p={x:a.x,y:a.y};
      const dx=()=>{while(p.x!==b.x){p={x:p.x+Math.sign(b.x-p.x),y:p.y};out.push(p)}};
      const dy=()=>{while(p.y!==b.y){p={x:p.x,y:p.y+Math.sign(b.y-p.y)};out.push(p)}};
      first==='x'?(dx(),dy()):(dy(),dx());return out};
    const xFirst=run('x'),yFirst=run('y');
    const clips=l=>l.reduce((n,q,i)=>n+(i<l.length-1&&blocked.has(key(q))?1:0),0);
    return clips(xFirst)<=clips(yFirst)?xFirst:yFirst;
  }
  function expand(points,blocked){
    const out=[points[0]];
    for(let i=1;i<points.length;i++){
      const a=out[out.length-1],b=points[i],d=Math.abs(b.x-a.x)+Math.abs(b.y-a.y);
      if(d===0)continue;
      if(d===1){out.push(b);continue}
      for(const st of legSteps(a,b,blocked))out.push(st);
    }
    return out;
  }
  function route(s,from,to){
    const roads=s?.roads||[],set=roadSet(s),blocked=buildingSet(s),goal=nearestRoad(to,roads);
    if(!goal)return expand([from,to],blocked);
    /* Flood the road network outward from the destination, then enter it at the
       reachable road nearest the start. Choosing both ends by raw distance and
       hoping they connect is what stranded a citizen on a lone stub whenever
       that stub happened to sit closer than the road that actually goes there. */
    const prev=new Map([[key(goal),null]]),q=[goal];
    for(let i=0;i<q.length;i++)for(const n of neighbors(q[i],set)){
      const k=key(n);if(prev.has(k))continue;prev.set(k,q[i]);q.push(n)}
    let start=null,best=1e9;
    for(const r of roads){if(!prev.has(key(r)))continue;
      const d=Math.abs(r.x-from.x)+Math.abs(r.y-from.y);if(d<best){best=d;start=r}}
    if(!start)return expand([from,to],blocked);
    const path=[];for(let cur=start;cur;cur=prev.get(key(cur)))path.push(cur);
    return expand([from,...path,to],blocked).filter((p,i,a)=>i===0||key(p)!==key(a[i-1]));
  }function destinations(s){return(s?.buildings||[]).filter(b=>Number(b.progress)>=1).map(b=>({x:b.x,y:b.y,id:b.id,name:b.name||b.id,district:b.district||'core'}))}function populationFor(s){const pop=Math.max(0,Number(s?.populationSummary?.population)||0);if(!pop)return 0;const d=destinations(s).length,r=(s?.roads||[]).length,physical=Math.max(1,Math.floor(d*2+r/5));return Math.max(1,Math.min(MAX_CITIZENS,Math.ceil(pop/2),physical))}function clockNow(date=new Date()){return(date.getHours()*60+date.getMinutes())/(24*60)}function plan(s,index=0,clock=clockNow()){const ds=destinations(s);if(ds.length<2)return null;const home=ds[index%ds.length],seed=index*3+1,workDistrict=ds[seed%ds.length]?.district||home.district,base={home,from:home,indexSeed:index,workDistrict},sched=C.CitizenSchedules?.schedule?.(s,base,clock),to=sched?.destination||ds[seed%ds.length],person=C.CitizenIdentities?.identity?.(index,home,workDistrict)||{id:`citizen-${index}`,name:`Citizen ${index+1}`,role:'Engineer',workDistrict};return{from:home,to,path:route(s,home,to),home,activity:sched?.activity||'walking',period:sched?.period||'workday',workDistrict,person}}function clear(scene){C.CitizenDialogueMentorship?.close?.(scene);for(const c of scene?.livingCitizens||[]){scene.tweens?.killTweensOf?.([c.sprite,c.badge,c.nameplate]);c.sprite?.destroy?.();c.badge?.destroy?.();c.nameplate?.destroy?.()}/* Bump the generation so walks already queued on a setTimeout do not wake up
     and start tweening sprites this call just destroyed. refresh() runs on seven
     different world events, so several generations can otherwise overlap. */
  if(scene){scene.livingCitizens=[];scene.citizenGen=(scene.citizenGen||0)+1}}function activityGlyph(a){return({resting:'·',commuting:'→',socializing:'☻',work:'⚒',craft:'⚒',market:'¤',study:'?',research:'?',compute:'⌘',maintain:'⚙',operate:'⚙',inspect:'!',respond:'!'})[a]||'•'}function point(scene,p){return scene?.toWorld?scene.toWorld(p.x,p.y):{x:p.x*32+16,y:p.y*32+16}}function updateSchedule(scene,c,s,clock=clockNow()){const sched=C.CitizenSchedules?.schedule?.(s,c,clock);if(!sched?.destination)return false;c.activity=sched.activity;c.period=sched.period;c.to=sched.destination;const iso=scene.fromWorld?.(c.sprite.x,c.sprite.y+5)||{x:c.to.x,y:c.to.y};c.route=route(s,{x:Math.round(iso.x),y:Math.round(iso.y)},c.to);c.index=0;updateBadge(scene,c.badge,c.activity);C.events?.emit?.('living-city:citizen-activity',{id:c.id,name:c.name,role:c.role,activity:c.activity,period:c.period,destination:c.to?.id});return true}function spawn(scene,s){if(!scene||!s)return[];
  /* Remember where everyone was standing. A rebuild used to drop every citizen back
     on their own doorstep, so any world change teleported the whole population home
     mid-errand — the single most visible thing wrong with how people moved. */
  const resume=new Map();for(const c of scene.livingCitizens||[]){if(c?.id&&c.sprite?.active)resume.set(c.id,{x:c.sprite.x,y:c.sprite.y})}
  clear(scene);const n=populationFor(s),out=[];for(let i=0;i<n;i++){const p=plan(s,i);if(!p||p.path.length<2)continue;
  let startTile=p.path[0],routePath=p.path,held=null;const back=resume.get(p.person?.id);
  if(back){const iso=scene.fromWorld?.(back.x,back.y+5);
    if(iso){const at={x:Math.round(iso.x),y:Math.round(iso.y)},rp=route(s,at,p.to);
      if(rp&&rp.length>1){routePath=rp;startTile=rp[0];held=back}}}
  const first=held?{x:held.x,y:held.y+5}:point(scene,startTile),depth=C.PixelWorldProjection?.depth?.(startTile.x,startTile.y,60)||900,art=citizenArt(scene,i),sprite=art?scene.add.image(first.x,first.y-5,ATLAS,art).setOrigin(.5,.9).setDepth(depth):scene.add.circle(first.x,first.y-5,3,i%3===0?0xffd166:i%3===1?0x8ee3c1:0x9ab8ff,1).setDepth(depth);if(!art)sprite.setStrokeStyle?.(1,0x142129,.9);const badge=makeBadge(scene,sprite.x,labelY(sprite).top,p.activity,sprite.depth+1).setVisible(false),nameplate=scene.add.text(sprite.x,labelY(sprite).bot,p.person.name,{fontFamily:'system-ui',fontSize:'7px',color:'#dcecff',backgroundColor:'#0b151fcc',padding:{x:2,y:1}}).setOrigin(.5,0).setDepth(sprite.depth+1).setVisible(false),citizen={...p.person,indexSeed:i,gen:scene.citizenGen,sprite,badge,nameplate,route:routePath,index:0,from:p.from,home:p.home,to:p.to,activity:p.activity,period:p.period};sprite.setInteractive?.({useHandCursor:true});sprite.on?.('pointerover',()=>{nameplate.setText?.(`${citizen.name} · ${citizen.role}`);nameplate.setVisible?.(true);badge.setVisible?.(true)});sprite.on?.('pointerout',()=>{nameplate.setText?.(citizen.name);nameplate.setVisible?.(false);badge.setVisible?.(false)});sprite.on?.('pointerdown',()=>C.CitizenDialogueMentorship?.open?.(scene,citizen,C.game?.state||window.state,C.game?.world));out.push(citizen);walk(scene,citizen)}C.CitizenIdentities?.apply?.(out);scene.livingCitizens=out;C.events?.emit?.('living-city:citizens-rendered',{count:out.length,population:s?.populationSummary?.population||0,period:C.CitizenSchedules?.phase?.(clockNow())?.id||'workday',named:out.filter(c=>c.name).length,projection:'iso-pixel-v1'});return out}function wander(scene,c,s){/* Half the time, stroll to a random road tile instead of shuttling between the same two buildings — varied paths read as ambient life rather than a shuttle going back and forth. */const roads=s?.roads||[];if(roads.length<3||Math.random()<0.5)return;const dest=roads[Math.floor(Math.random()*roads.length)],iso=scene.fromWorld?.(c.sprite.x,c.sprite.y+5),from=iso?{x:Math.round(iso.x),y:Math.round(iso.y)}:(c.to||dest),wr=route(s,from,{x:dest.x,y:dest.y});if(wr&&wr.length>1){c.route=wr;c.index=0}}
  function walk(scene,c){if(!c?.sprite||!c.route?.length)return;if(c.gen!==scene?.citizenGen||!c.sprite.active)return;const nextIndex=c.index+1,seed=(c.indexSeed||0)*7+((c.id&&c.id.length)||0)*37;if(nextIndex>=c.route.length){const s=scene.adapter?.snapshot?.()||scene.snapshot;updateSchedule(scene,c,s);wander(scene,c,s);/* Linger at the destination before the next errand — a randomized, per-citizen dwell so arrivals desync and citizens stop ping-ponging in lockstep (the "metronome"). */const dwell=520+(seed%1300);return setTimeout(()=>walk(scene,c),dwell)}const tile=c.route[nextIndex],target=point(scene,tile),depth=C.PixelWorldProjection?.depth?.(tile.x,tile.y,60)||900;c.sprite.setDepth(depth);c.badge?.setDepth(depth+1);c.nameplate?.setDepth(depth+1);/* Per-citizen pace varies and each step eases in/out like a footstep instead of gliding at constant velocity, so the crowd never moves as one machine. */const duration=560+(seed%520);/* Face the way you are going. Without this everyone walks the whole map
     drawn facing one direction, which reads as sliding rather than walking. */
  const dx=target.x-c.sprite.x;if(Math.abs(dx)>0.5)c.sprite.setFlipX?.(dx<0);
  scene.tweens.add({targets:[c.sprite,c.badge,c.nameplate],x:target.x,y:target.y-5,duration,ease:'Sine.easeInOut',onUpdate:()=>{const L=labelY(c.sprite);if(c.badge)c.badge.y=L.top;if(c.nameplate)c.nameplate.y=L.bot},onComplete:()=>{c.index=nextIndex;walk(scene,c)}})}/* One rebuild per burst. Each of these events used to schedule its own
     teardown-and-respawn, so painting a fifteen-tile road stroke rebuilt the whole
     population fifteen times over. Coalesce to a single trailing rebuild. */
  let refreshTimer=0;
  function queueRefresh(){if(refreshTimer)clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{refreshTimer=0;refresh()},260)}
  function refresh(){const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(!scene)return false;spawn(scene,scene.adapter?.snapshot?.()||scene.snapshot);C.AmbientCityActivity?.render?.(scene,scene.adapter?.snapshot?.()||scene.snapshot);return true}function install(){ensureSchedules();ensureAmbient();ensureReactions();ensureIdentities();ensureDialogue();if(install._done)return true;install._done=true;for(const evt of['world:building-placed','world:building-unplaced','world:road-changed','world:building-upgraded','age:advanced','civilization:phaser-ready','population:migrated'])C.events?.on?.(evt,queueRefresh);setTimeout(refresh,120);return true}C.LivingCityCitizens={VERSION,MAX_CITIZENS,SCHEDULE_URL,AMBIENT_URL,REACTION_URL,IDENTITY_URL,DIALOGUE_URL,ensureSchedules,ensureAmbient,ensureReactions,ensureIdentities,ensureDialogue,roadSet,neighbors,nearestRoad,route,destinations,populationFor,clockNow,plan,activityGlyph,point,updateSchedule,spawn,refresh,install};})(window.Codeopolis);
