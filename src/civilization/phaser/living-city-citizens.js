(function(C){'use strict';const VERSION=8,MAX_CITIZENS=10,SCHEDULE_URL='src/civilization/phaser/citizen-schedules.js',AMBIENT_URL='src/civilization/phaser/ambient-city-activity.js',REACTION_URL='src/civilization/phaser/city-event-reactions.js',IDENTITY_URL='src/civilization/phaser/citizen-identities.js',DIALOGUE_URL='src/civilization/phaser/citizen-dialogue-mentorship.js';function load(src,flag,ready,onload){if(ready())return onload?.();if(typeof document==='undefined')return;const old=document.querySelector(`script[data-${flag}="1"]`);if(old)return;const s=document.createElement('script');s.src=src;s.dataset[flag.replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]='1';s.onload=()=>onload?.();document.head.appendChild(s)}function ensureSchedules(){load(SCHEDULE_URL,'p5b-schedules',()=>!!C.CitizenSchedules,refresh)}function ensureAmbient(){load(AMBIENT_URL,'p5c-ambient',()=>!!C.AmbientCityActivity,()=>{C.AmbientCityActivity?.install?.();refresh()})}function ensureReactions(){load(REACTION_URL,'p5d-reactions',()=>!!C.CityEventReactions,()=>C.CityEventReactions?.install?.())}function ensureIdentities(){load(IDENTITY_URL,'p5e-identities',()=>!!C.CitizenIdentities,refresh)}function ensureDialogue(){load(DIALOGUE_URL,'p5f-dialogue',()=>!!C.CitizenDialogueMentorship,refresh)}// Citizens were coloured dots. When the sprite atlas is loaded, draw the real
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
function labelY(sprite){const h=sprite?.displayHeight||0;return h>8?{top:sprite.y-h*1.02,bot:sprite.y+h*.04}:{top:sprite.y-8,bot:sprite.y+7}}
/* One steady front view and one back view per role, read off the sheet at 9x.
   The other variants are pose studies, not a walk cycle — stepping through them
   reads as fidgeting (the scholar's book appears and vanishes) — and keeper-4 is
   a slicing error, a gardener's hat on a keeper's body. */
const FACING=Object.freeze({builder:[1,4],scholar:[1,4],merchant:[1,7],gardener:[1,4],keeper:[1,3],messenger:[1,7]});
function citizenArt(scene,i,view='front'){const frames=scene?.art?.();if(!frames||!frames.size)return null;const fam=ROLE_ART[i%ROLE_ART.length],pair=FACING[fam]||[1,1],want=`cit-${fam}-${view==='back'?pair[1]:pair[0]}`;if(frames.has(want))return want;for(let n=1;n<=8;n++){const k=`cit-${fam}-${n}`;if(frames.has(k))return k}return null}
function key(p){return`${p.x},${p.y}`}function roadSet(s){return new Set((s?.roads||[]).map(key))}function neighbors(p,set){return[{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}].filter(n=>set.has(key(n)))}function nearestRoad(point,roads){if(!roads?.length)return null;let best=null,dist=1e9;for(const r of roads){const d=Math.abs(r.x-point.x)+Math.abs(r.y-point.y);if(d<dist){dist=d;best=r}}return best}
  /* Every cell a building covers. Advanced buildings are 2x2, and marking only the
     anchor let citizens walk across the other three cells of the roof. */
  function buildingSet(s){const out=new Set();for(const b of s?.buildings||[]){const w=b.footprint?.w||1,h=b.footprint?.h||1;for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)out.add(key({x:b.x+dx,y:b.y+dy}))}return out}
  /* Buildings, plus the flower beds, rocks and trees the scene dressed the ground
     with. Those live only in the scene, never in the snapshot, so withScenery()
     hands them over; roads are never decorated, so this never blocks a street. */
  function blockedSet(s){const b=buildingSet(s);for(const k of s?.scenery||[])b.add(k);return b}
  function withScenery(scene,s){return s&&scene?.propTiles?.size?{...s,scenery:scene.propTiles}:s}
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
    const bend=clips(xFirst)<=clips(yFirst)?xFirst:yFirst;
    return clips(bend)?around(a,b,blocked)||bend:bend;
  }
  /* When both bends clip something, look for a way round within a tile or two of
     the direct line: a short breadth-first search over open ground. The far end
     may itself be a building (the doorstep trim happens later), so it stays open. */
  function around(a,b,blocked){
    const lo={x:Math.max(0,Math.min(a.x,b.x)-2),y:Math.max(0,Math.min(a.y,b.y)-2)},hi={x:Math.max(a.x,b.x)+2,y:Math.max(a.y,b.y)+2},goal=key(b);
    const prev=new Map([[key(a),null]]),q=[a];
    for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===goal){const out=[];for(let c=p;c&&key(c)!==key(a);c=prev.get(key(c)))out.unshift(c);return out}
      for(const n of[{x:p.x+(Math.sign(b.x-p.x)||1),y:p.y},{x:p.x,y:p.y+(Math.sign(b.y-p.y)||1)},{x:p.x-(Math.sign(b.x-p.x)||1),y:p.y},{x:p.x,y:p.y-(Math.sign(b.y-p.y)||1)}]){
        const k=key(n);if(prev.has(k)||n.x<lo.x||n.y<lo.y||n.x>hi.x||n.y>hi.y||(k!==goal&&blocked.has(k)))continue;prev.set(k,p);q.push(n)}}
    return null;
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
  /* Errands end on the doorstep, not the roof. A building's tile centre is the
     middle of its facade, so a citizen who walked onto it stood on the roof for the
     whole of its stay. Stop one tile short, go inside, and come back out later. */
  function toDoor(s,path){const b=buildingSet(s);let n=path?.length||0;const full=n;
    while(n>1&&b.has(key(path[n-1])))n--;
    return n<full?{path:path.slice(0,n),enters:true}:{path,enters:false}}
  /* Leave by the door too. A route drawn from inside a building starts on its roof;
     drop those tiles and put the (still faded-out) citizen on the doorstep. */
  function setRoute(scene,c,s,path){const d=toDoor(s,path),b=buildingSet(s);let k=0;
    while(k<d.path.length-1&&b.has(key(d.path[k])))k++;
    if(k){const p=point(scene,d.path[k]);c.step&&scene?.tweens?.killTweensOf?.(c.step);c.sprite?.setPosition?.(p.x,p.y-5);c.shadow?.setPosition?.(p.x,p.y-5)}
    c.route=d.path.slice(k);c.index=0;c.enters=d.enters}
  function route(s,from,to,rng){
    const roads=s?.roads||[],set=roadSet(s),blocked=blockedSet(s),goal=nearestRoad(to,roads);
    if(!goal)return expand([from,to],blocked);
    /* Flood the road network outward from the destination, then enter it at the
       reachable road nearest the start. Choosing both ends by raw distance and
       hoping they connect is what stranded a citizen on a lone stub whenever
       that stub happened to sit closer than the road that actually goes there. */
    const prev=new Map([[key(goal),null]]),q=[goal];
    /* With an rng, shuffle each tile's neighbours before the flood claims them, so
       among equally short ways between two corners a different street wins each
       time. Without one it is deterministic, which the router tests rely on. */
    for(let i=0;i<q.length;i++){const ns=neighbors(q[i],set);
      if(rng)for(let j=ns.length-1;j>0;j--){const r=Math.floor(rng()*(j+1));[ns[j],ns[r]]=[ns[r],ns[j]]}
      for(const n of ns){const k=key(n);if(prev.has(k))continue;prev.set(k,q[i]);q.push(n)}}
    let start=null,best=1e9;
    for(const r of roads){if(!prev.has(key(r)))continue;
      const d=Math.abs(r.x-from.x)+Math.abs(r.y-from.y);if(d<best){best=d;start=r}}
    if(!start)return expand([from,to],blocked);
    const path=[];for(let cur=start;cur;cur=prev.get(key(cur)))path.push(cur);
    return expand([from,...path,to],blocked).filter((p,i,a)=>i===0||key(p)!==key(a[i-1]));
  }function destinations(s){return(s?.buildings||[]).filter(b=>Number(b.progress)>=1).map(b=>({x:b.x,y:b.y,id:b.id,name:b.name||b.id,district:b.district||'core'}))}function populationFor(s){const pop=Math.max(0,Number(s?.populationSummary?.population)||0);if(!pop)return 0;const d=destinations(s).length,r=(s?.roads||[]).length,physical=Math.max(1,Math.floor(d+r/8));/* A few people out for a walk, not a crowd.
     It was one figure per two residents and two per building, which put thirteen
     on the road in a five-building town; a stroll reads as a stroll only when
     there is room around each walker. */return Math.max(1,Math.min(MAX_CITIZENS,Math.ceil(pop/5),physical))}function clockNow(date=new Date()){return(date.getHours()*60+date.getMinutes())/(24*60)}function plan(s,index=0,clock=clockNow()){const ds=destinations(s);if(ds.length<2)return null;const home=ds[index%ds.length],seed=index*3+1,workDistrict=ds[seed%ds.length]?.district||home.district,base={home,from:home,indexSeed:index,workDistrict},sched=C.CitizenSchedules?.schedule?.(s,base,clock),to=sched?.destination||ds[seed%ds.length],person=C.CitizenIdentities?.identity?.(index,home,workDistrict)||{id:`citizen-${index}`,name:`Citizen ${index+1}`,role:'Engineer',workDistrict};return{from:home,to,path:route(s,home,to),home,activity:sched?.activity||'walking',period:sched?.period||'workday',workDistrict,person}}function clear(scene){C.CitizenDialogueMentorship?.close?.(scene);for(const c of scene?.livingCitizens||[]){scene.tweens?.killTweensOf?.([c.sprite,c.shadow,c.badge,c.nameplate,c.step].filter(Boolean));c.sprite?.destroy?.();c.shadow?.destroy?.();c.badge?.destroy?.();c.nameplate?.destroy?.()}/* Bump the generation so walks already queued on a setTimeout do not wake up
     and start tweening sprites this call just destroyed. refresh() runs on seven
     different world events, so several generations can otherwise overlap. */
  if(scene){scene.livingCitizens=[];scene.citizenGen=(scene.citizenGen||0)+1}}function activityGlyph(a){return({resting:'·',commuting:'→',socializing:'☻',work:'⚒',craft:'⚒',market:'¤',study:'?',research:'?',compute:'⌘',maintain:'⚙',operate:'⚙',inspect:'!',respond:'!'})[a]||'•'}function point(scene,p){return scene?.toWorld?scene.toWorld(p.x,p.y):{x:p.x*32+16,y:p.y*32+16}}function updateSchedule(scene,c,s,clock=clockNow()){const sched=C.CitizenSchedules?.schedule?.(s,c,clock);if(!sched?.destination)return false;c.activity=sched.activity;c.period=sched.period;c.to=sched.destination;const iso=scene.fromWorld?.(c.sprite.x,c.sprite.y+5)||{x:c.to.x,y:c.to.y};setRoute(scene,c,s,route(s,{x:Math.round(iso.x),y:Math.round(iso.y)},c.to));updateBadge(scene,c.badge,c.activity);C.events?.emit?.('living-city:citizen-activity',{id:c.id,name:c.name,role:c.role,activity:c.activity,period:c.period,destination:c.to?.id});return true}function spawn(scene,s){if(!scene||!s)return[];
  /* Remember where everyone was standing. A rebuild used to drop every citizen back
     on their own doorstep, so any world change teleported the whole population home
     mid-errand — the single most visible thing wrong with how people moved. */
  const resume=new Map();for(const c of scene.livingCitizens||[]){if(c?.id&&c.sprite?.active)resume.set(c.id,{x:c.sprite.x,y:c.sprite.y})}
  clear(scene);const n=populationFor(s),out=[];for(let i=0;i<n;i++){const p=plan(s,i);if(!p||p.path.length<2)continue;
  let startTile=p.path[0],routePath=p.path,held=null;const back=resume.get(p.person?.id);
  if(back){const iso=scene.fromWorld?.(back.x,back.y+5);
    if(iso){const at={x:Math.round(iso.x),y:Math.round(iso.y)},rp=route(s,at,p.to);
      if(rp&&rp.length>1){routePath=rp;startTile=rp[0];held=back}}}
  /* Starting at home means starting indoors: appear on the doorstep, faded out, and
     step out into the street — not materialise on the roof. */
  let indoors=false;if(!held){const b=buildingSet(s);let k=0;while(routePath.length-k>1&&b.has(key(routePath[k])))k++;if(k){routePath=routePath.slice(k);startTile=routePath[0];indoors=true}}
  const first=held?{x:held.x,y:held.y+5}:point(scene,startTile),depth=C.PixelWorldProjection?.depth?.(startTile.x,startTile.y,60)||900,art=citizenArt(scene,i),sprite=art?scene.add.image(first.x,first.y-5,ATLAS,art).setOrigin(.5,1).setDepth(depth):scene.add.circle(first.x,first.y-5,3,i%3===0?0xffd166:i%3===1?0x8ee3c1:0x9ab8ff,1).setDepth(depth);if(!art)sprite.setStrokeStyle?.(1,0x142129,.9);/* A soft contact shadow. Without one the figures had no ground contact and,
     drawn in the same tans and greys as the cobbles, dissolved into the road. The
     shadow stays put while the body bobs, which also sells the footfalls. */
  const shadow=scene.add.ellipse?.(sprite.x,sprite.y,11,4,0x1b120d,.34)?.setDepth?.(depth-1)||null;if(indoors){sprite.setAlpha?.(0);shadow?.setAlpha?.(0)}const badge=makeBadge(scene,sprite.x,labelY(sprite).top,p.activity,sprite.depth+1).setVisible(false),nameplate=scene.add.text(sprite.x,labelY(sprite).bot,p.person.name,{fontFamily:'system-ui',fontSize:'7px',color:'#dcecff',backgroundColor:'#0b151fcc',padding:{x:2,y:1}}).setOrigin(.5,0).setDepth(sprite.depth+1).setVisible(false),citizen={...p.person,indexSeed:i,gen:scene.citizenGen,sprite,shadow,artFront:art,artBack:art?citizenArt(scene,i,'back'):null,badge,nameplate,route:toDoor(s,routePath).path,enters:toDoor(s,routePath).enters,index:0,from:p.from,home:p.home,to:p.to,activity:p.activity,period:p.period};sprite.setInteractive?.({useHandCursor:true});sprite.on?.('pointerover',()=>{nameplate.setText?.(`${citizen.name} · ${citizen.role}`);nameplate.setVisible?.(true);badge.setVisible?.(true)});sprite.on?.('pointerout',()=>{nameplate.setText?.(citizen.name);nameplate.setVisible?.(false);badge.setVisible?.(false)});sprite.on?.('pointerdown',()=>C.CitizenDialogueMentorship?.open?.(scene,citizen,C.game?.state||window.state,C.game?.world));out.push(citizen);walk(scene,citizen)}C.CitizenIdentities?.apply?.(out);scene.livingCitizens=out;C.events?.emit?.('living-city:citizens-rendered',{count:out.length,population:s?.populationSummary?.population||0,period:C.CitizenSchedules?.phase?.(clockNow())?.id||'workday',named:out.filter(c=>c.name).length,projection:'iso-pixel-v1'});return out}function wander(scene,c,s){
  /* Strolls, not shuttles. Most trips are a walk along the roads to somewhere this
     citizen has not just been and nobody else is already heading, routed with a
     shuffled tie-break — so two people between the same corners take different
     streets, and nobody laps the same block. The rest keep their errand, which is
     what sends people in and out of buildings. */
  const roads=s?.roads||[];if(roads.length<3||Math.random()<0.28)return;
  const iso=scene.fromWorld?.(c.sprite.x,c.sprite.y+5),from=iso?{x:Math.round(iso.x),y:Math.round(iso.y)}:(c.to||roads[0]);
  const heading=new Set((scene.livingCitizens||[]).filter(o=>o!==c&&o.to).map(o=>key(o.to))),recent=c.recent||(c.recent=[]);
  let best=null,score=-1e9;
  for(let i=0;i<6;i++){const r=roads[Math.floor(Math.random()*roads.length)],k=key(r),
    sc=Math.abs(r.x-from.x)+Math.abs(r.y-from.y)-(recent.includes(k)?6:0)-(heading.has(k)?4:0)+Math.random();
    if(sc>score){score=sc;best=r}}
  if(!best)return;
  const wr=route(s,from,{x:best.x,y:best.y},Math.random);
  if(wr&&wr.length>1){setRoute(scene,c,s,wr);c.to={x:best.x,y:best.y};recent.push(key(best));if(recent.length>4)recent.shift()}}
  function fade(scene,c,to){c.sprite.input&&(c.sprite.input.enabled=to>0);
    scene.tweens.add({targets:[c.sprite,c.shadow].filter(Boolean),alpha:to?1:0,duration:420,ease:'Sine.easeInOut'})}
  function walk(scene,c){if(!c?.sprite||!c.route?.length)return;if(c.gen!==scene?.citizenGen||!c.sprite.active)return;const nextIndex=c.index+1,seed=(c.indexSeed||0)*7+((c.id&&c.id.length)||0)*37;if(nextIndex>=c.route.length){const went=c.enters,s=withScenery(scene,scene.adapter?.snapshot?.()||scene.snapshot);updateSchedule(scene,c,s);wander(scene,c,s);
    /* Pause between walks: a long, per-citizen linger so the street is never all in
       motion at once and arrivals do not line up. Someone who went into a building
       stays in longer — and while they are in, the street is that much quieter. */
    if(went)fade(scene,c,0);
    const dwell=(went?4200:2200)+(seed*97%(went?5000:3800));return setTimeout(()=>walk(scene,c),dwell)}
  if(c.sprite.alpha<1)fade(scene,c,1);
  const here=c.route[c.index]||c.route[nextIndex],tile=c.route[nextIndex],target=point(scene,tile),D=(t)=>C.PixelWorldProjection?.depth?.(t.x,t.y,60)||900,
    /* Hold the higher of the two tiles' depths for the length of the step. Taking the
       target's depth up front meant a citizen stepping away from the camera was
       drawn one row back while its feet were still on the tile in front, and that
       tile's terrain painted over it — the head-over-a-bevel in the crops. */
    depth=Math.max(D(here),D(tile));
  c.sprite.setDepth(depth);c.shadow?.setDepth(depth-1);c.badge?.setDepth(depth+1);c.nameplate?.setDepth(depth+1);
  /* Face the way you are going: mirrored left and right, and the back view when
     walking away from the camera, the front view when walking toward it. */
  const dx=target.x-c.sprite.x,dy=target.y-5-c.sprite.y;if(Math.abs(dx)>0.5)c.sprite.setFlipX?.(dx<0);
  if(Math.abs(dy)>0.5&&c.artFront&&c.artBack&&c.sprite.setFrame){const want=dy<0?c.artBack:c.artFront;if(c.sprite.frame?.name!==want)c.sprite.setFrame(want)}
  /* A stroll: roughly two seconds a tile at an even pace, easing only out of the
     first step and into the last, so a walk starts and stops rather than every tile
     surging and braking. It used to be 0.56-1.08s a tile, eased in and out on every
     tile, which read as a hurried shuffle once routes were walked a tile at a time. */
  const duration=1900+(seed*53%700),first=nextIndex===1,last=nextIndex===c.route.length-1,
    ease=first&&last?'Sine.easeInOut':first?'Sine.easeIn':last?'Sine.easeOut':'Linear',
    from={x:c.sprite.x,y:c.sprite.y+(c.bob||0)},to={x:target.x,y:target.y-5},step={t:0};
  c.step=step;
  scene.tweens.add({targets:step,t:1,duration,ease,onUpdate:()=>{if(!c.sprite?.active)return;
    const x=from.x+(to.x-from.x)*step.t,y=from.y+(to.y-from.y)*step.t;
    /* Two footfalls a tile: the body lifts a single whole pixel and the shadow stays
       on the ground, which is what makes slow movement read as walking. */
    c.bob=Math.abs(Math.sin(step.t*Math.PI*2))>0.6?1:0;
    c.sprite.setPosition(x,y-c.bob);c.shadow?.setPosition(x,y);
    const L=labelY(c.sprite);c.badge?.setPosition(x,L.top);c.nameplate?.setPosition(x,L.bot)},
    onComplete:()=>{c.bob=0;if(!c.sprite?.active)return;c.sprite.y=to.y;c.sprite.setDepth(D(tile));c.shadow?.setDepth(D(tile)-1);c.index=nextIndex;walk(scene,c)}})}/* One rebuild per burst. Each of these events used to schedule its own
     teardown-and-respawn, so painting a fifteen-tile road stroke rebuilt the whole
     population fifteen times over. Coalesce to a single trailing rebuild. */
  let refreshTimer=0;
  function queueRefresh(){if(refreshTimer)clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>{refreshTimer=0;refresh()},260)}
  function refresh(){const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(!scene)return false;spawn(scene,withScenery(scene,scene.adapter?.snapshot?.()||scene.snapshot));C.AmbientCityActivity?.render?.(scene,scene.adapter?.snapshot?.()||scene.snapshot);return true}function install(){ensureSchedules();ensureAmbient();ensureReactions();ensureIdentities();ensureDialogue();if(install._done)return true;install._done=true;for(const evt of['world:building-placed','world:building-unplaced','world:road-changed','world:building-upgraded','age:advanced','civilization:phaser-ready','population:migrated'])C.events?.on?.(evt,queueRefresh);setTimeout(refresh,120);return true}C.LivingCityCitizens={VERSION,MAX_CITIZENS,SCHEDULE_URL,AMBIENT_URL,REACTION_URL,IDENTITY_URL,DIALOGUE_URL,ensureSchedules,ensureAmbient,ensureReactions,ensureIdentities,ensureDialogue,roadSet,neighbors,nearestRoad,route,destinations,populationFor,clockNow,plan,activityGlyph,point,updateSchedule,spawn,refresh,install};})(window.Codeopolis);
