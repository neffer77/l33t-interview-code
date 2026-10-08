(function(C){
  'use strict';
  /* The solve -> city payoff.
     Solving a problem changes the city: concept resources land, a building in that
     district is placed or upgraded, the construction crew banks a boost. All of it
     happens while the player is on the challenge tab, so none of it was ever seen.
     This module collects what one solve did, hands a summary to the reward card, and
     plays the change in the city the next time the city is actually on screen. */
  const VERSION=1,FRESH_MS=30*60*1000,MAX_QUEUE=4,GAP_MS=3600;
  const COLORS=Object.freeze({materials:0xc8925a,trade:0xffd166,research:0x8ecae6,compute:0xb39ddb,infrastructure:0xf9c74f,stability:0x8ee3c1});
  const DEPTH=1e6;
  let current=null,queue=[],timer=null,playing=false;

  function now(){return Date.now()}
  function raf(f){return typeof requestAnimationFrame==='function'?requestAnimationFrame(f):setTimeout(f,16)}
  function resourceDef(id){return C.ConceptResources?.RESOURCE_DEFS?.[id]||C.ConceptResources?.definitions?.[id]||{id,name:id?String(id).replace(/^./,c=>c.toUpperCase()):'Resources',icon:'✦'}}
  function buildingName(row){return row?.name||C.game?.world?.buildingDef?.(row?.id)?.name||row?.id||'Building'}
  function fresh(m){return!!m&&now()-m.at<FRESH_MS}

  /* Event intake. A solve emits, in order and synchronously: learning:mastered,
     challenge:solved -> coding:rewarded -> city-growth:applied, then reward:celebration.
     So by the time the reward card renders, the moment holds everything it needs. */
  function begin(e={}){
    current={type:'solve',at:now(),challenge:{id:e.challenge?.id,title:e.challenge?.title||'Challenge',pattern:e.challenge?.pattern||'',district:e.challenge?.district||''},first:!!e.first,focus:Number.isFinite(e.x)?{x:e.x,y:e.y}:null,resource:null,growth:null,boostMs:0,unlock:null};
    enqueue(current);return current}
  function onRewarded(r={}){if(!current||!(r.granted>0))return;const d=resourceDef(r.resourceId);current.resource={id:r.resourceId,amount:r.granted,name:d.name,icon:d.icon}}
  function onGrowth(row={}){if(!current||!row.ok)return;current.growth={kind:row.kind,id:row.id,name:buildingName(row),x:row.x,y:row.y,level:row.level||1};current.focus={x:row.x,y:row.y}}
  function onBoost(e={}){if(current&&now()-current.at<5000)current.boostMs+=Math.max(0,Number(e.ms)||0)}
  function onUnlock(e={}){if(current)current.unlock={id:e.buildingId,name:e.building?.name||e.buildingId}}
  /* The mentor's reaction to this solve. It used to open its own full-screen popup right
     behind the reward card, so a solve was card, then popup, then building panel. Fold it
     into the card instead; the beat stays in the story feed. */
  function onBeat(b={}){if(!current||b.kind!=='reaction'||b.meta?.challengeId!==current.challenge.id||now()-current.at>3000)return;
    if(typeof document==='undefined'||!document.getElementById('rewardOverlay'))return;
    const c=C.game?.phase8?.characters?.def?.(b.characterId)||null;current.mentor={text:b.text,name:c?.name||String(b.title||'').replace(/ reacts$/,''),role:c?.role||'',icon:c?.icon||'🎙️'};b.inRewardCard=true}
  /* Only a solve that changed the city is worth walking the player over to see. */
  function worthShowing(m=current){return m?.type==='solve'&&!!(m.resource||m.growth||m.unlock)}
  function mentor(m=current){return m?.type==='solve'&&m.mentor?m.mentor:null}
  function onComplete(e={}){if(!Number.isFinite(e.x))return;enqueue({type:'complete',at:now(),id:e.id,name:buildingName(e),x:e.x,y:e.y})}
  function enqueue(m){queue=queue.filter(fresh).filter(q=>!(m.type==='complete'&&q.type==='complete'&&q.x===m.x&&q.y===m.y));queue.push(m);if(queue.length>MAX_QUEUE)queue.splice(0,queue.length-MAX_QUEUE);watch()}

  /* The reward card's "Your city" rows, in the order they matter to the player. */
  function summary(m=current){
    if(!m||m.type!=='solve')return[];const rows=[];
    if(m.resource)rows.push({key:'resource',icon:m.resource.icon,text:`+${m.resource.amount} ${m.resource.name}`,detail:'for your city'});
    if(m.growth)rows.push(m.growth.kind==='upgrade'?{key:'growth',icon:'⬆️',text:`${m.growth.name} → Level ${m.growth.level}`,detail:'upgraded'}:{key:'growth',icon:'🏗️',text:`New ${m.growth.name}`,detail:'under construction'});
    if(m.boostMs>0)rows.push({key:'boost',icon:'⚡',text:`+${Math.round(m.boostMs/1000)}s build boost`,detail:'banked for your crew'});
    if(m.unlock)rows.push({key:'unlock',icon:'🏛️',text:`${m.unlock.name} unlocked`,detail:'ready to place'});
    const next=nextGoal();if(next)rows.push({key:'goal',icon:'🎯',text:next,detail:'next city goal'});
    return rows}
  function nextGoal(){try{const s=C.game?.state||window.state,w=C.game?.world;return C.LearningCityLoop?.contract?.(s,w)?.next?.text||null}catch{return null}}
  function pending(){return queue.filter(fresh)}

  /* Is the city actually on screen? The scene keeps running behind other tabs, and
     a tween played there is a tween nobody sees. */
  function scene(){return C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')||null}
  function cityVisible(){
    if(typeof document==='undefined'||document.visibilityState==='hidden')return false;
    const s=scene(),host=C.phaserCity?.host;if(!s?.sys?.isActive?.()||!host)return false;
    const r=host.getBoundingClientRect();if(r.width<120||r.height<120||r.bottom<=0||r.top>=innerHeight)return false;
    const hit=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,r.left+r.width/2)),Math.min(innerHeight-1,Math.max(0,r.top+r.height/2)));
    return!!hit&&(host.contains(hit)||hit===host)}
  function watch(){if(timer||typeof setInterval==='undefined')return;timer=setInterval(tick,450)}
  function tick(){queue=queue.filter(fresh);if(!queue.length){clearInterval(timer);timer=null;return}if(playing||!cityVisible())return;const m=queue.shift();if(m.type==='solve'&&!worthShowing(m))return;playing=true;
    /* Let the city finish relaying out after a tab switch before the camera moves. */
    setTimeout(()=>{try{play(m)}catch(err){console.warn?.('City payoff skipped',err)}setTimeout(()=>{playing=false},m.type==='solve'?GAP_MS:GAP_MS-900)},280)}

  /* Take the player there: switch to the city and let the watcher play the queue. */
  function show(){const ion=C.ionicShell;if(ion?.go&&typeof document!=='undefined'&&document.querySelector('#codeopolisIonicShell'))ion.go('city');else if(typeof window.switchTab==='function')window.switchTab('city');else document.querySelector('.tabs button[data-tab="city"]')?.click?.();
    raf(()=>C.phaserCity?.resize?.());watch();return true}

  // ---- rendering -------------------------------------------------------------
  /* The scene rebuilds itself from scratch on resizes and on world events (a finished
     building fires several), and a rebuild destroys every object on it. Effects are
     lifted off the display list for the rebuild and put back after, so a moment in
     flight survives it. */
  function guardRefresh(s){const P=Object.getPrototypeOf(s);if(!P||P.__payoffRefreshGuard||typeof P.refresh!=='function')return;const original=P.refresh;P.__payoffRefreshGuard=true;
    P.refresh=function(){const keep=[...(this.payoffFx||[])].filter(o=>o.active&&o.scene);for(const o of keep)o.removeFromDisplayList?o.removeFromDisplayList():this.children.remove(o,true);try{return original.apply(this,arguments)}finally{for(const o of keep)if(o.active)o.addToDisplayList?o.addToDisplayList():this.children.add(o)}}}
  function fx(s,o){if(!o)return o;(s.payoffFx||(s.payoffFx=new Set())).add(o);o.once?.('destroy',()=>s.payoffFx?.delete(o));return o}
  function world(s,x,y){const p=s.toWorld?s.toWorld(x,y):{x:x*(s.tile||32),y:y*(s.tile||32)};return{x:p.x,y:p.y}}
  /* Draw labels at four times their size and scale them down, so they stay sharp at the
     zoom the moment ends on. (Raising Text resolution instead enlarged the text itself
     under the canvas renderer phones use.) */
  const LABEL_SCALE=4;
  function label(s,x,y,text,color='#fff4c4',delay=0){
    const k=LABEL_SCALE,t=fx(s,s.add.text(x,y,text,{fontFamily:'system-ui,-apple-system,sans-serif',fontSize:`${10*k}px`,fontStyle:'bold',color,backgroundColor:'#0b151fe6',padding:{x:5*k,y:3*k}}).setScale(1/k).setOrigin(.5,1).setDepth(DEPTH+3).setAlpha(0));
    s.tweens.add({targets:t,alpha:1,y:y-6,duration:260,delay,ease:'Back.easeOut'});
    s.tweens.add({targets:t,alpha:0,y:y-20,duration:600,delay:delay+1900,ease:'Sine.easeIn',onComplete:()=>t.destroy()});return t}
  function ring(s,x,y,color,delay=0,repeat=0){
    /* A tile-shaped ripple: an isometric diamond growing out from the footprint. */
    const g=fx(s,s.add.graphics().setDepth(DEPTH).setPosition(x,y).setAlpha(0));g.lineStyle(2,color,1);g.strokePoints([{x:0,y:-16},{x:32,y:0},{x:0,y:16},{x:-32,y:0}],true);
    s.tweens.add({targets:g,alpha:{from:.95,to:0},scaleX:{from:.7,to:1.7},scaleY:{from:.7,to:1.7},duration:820,delay,repeat,ease:'Sine.easeOut',onComplete:()=>g.destroy()});return g}
  function sparks(s,x,y,color,n=10,delay=0){
    for(let i=0;i<n;i++){const a=Math.PI*2*i/n+(i%2)*.3,r=16+(i%3)*7,d=fx(s,s.add.rectangle(x,y,3,3,color,1).setDepth(DEPTH+1).setAngle(45).setAlpha(0));
      s.tweens.add({targets:d,alpha:{from:1,to:0},x:x+Math.cos(a)*r,y:y+Math.sin(a)*r*.6-6,duration:620+(i%3)*90,delay:delay+(i%4)*25,ease:'Quad.easeOut',onComplete:()=>d.destroy()})}}
  function dust(s,x,y,n=9,delay=0){
    for(let i=0;i<n;i++){const side=i%2?1:-1,c=fx(s,s.add.circle(x+side*(4+i*2),y,2+(i%3),0xd9c3a0,.85).setDepth(DEPTH).setAlpha(0));
      s.tweens.add({targets:c,alpha:{from:.85,to:0},x:x+side*(14+i*3),y:y-4-(i%3)*3,scale:{from:.6,to:1.6},duration:650,delay:delay+i*18,ease:'Quad.easeOut',onComplete:()=>c.destroy()})}}
  function tokens(s,to,color,count,delay=0,onLand){
    /* Resources drop in from above and land in the building, so the player sees the
       reward go somewhere instead of a number appearing. */
    const from={x:to.x,y:to.y-96},n=Math.max(3,Math.min(8,count));
    for(let i=0;i<n;i++){const o=fx(s,s.add.circle(from.x+(i-n/2)*8,from.y,4,color,1).setDepth(DEPTH+2).setAlpha(0));o.setStrokeStyle?.(1,0x22180f,1);
      s.tweens.add({targets:o,alpha:1,duration:120,delay:delay+i*80});
      s.tweens.add({targets:o,x:to.x+(i%3-1)*4,y:to.y,duration:560,delay:delay+i*80,ease:'Quad.easeIn',onComplete:()=>{o.destroy();if(i===n-1)onLand?.()}})}}
  function bounce(s,img,delay=0,big=false){
    if(!img)return;const sx=img.scaleX||1,sy=img.scaleY||1;
    s.tweens.add({targets:img,scaleX:sx*(big?.9:.95),scaleY:sy*(big?1.16:1.08),duration:150,delay,yoyo:true,ease:'Quad.easeOut',onComplete:()=>img.setScale?.(sx,sy)})}
  function ref(s,x,y){return s.buildingRefs?.get?.(`${x},${y}`)||null}
  function pan(s,p,d=650){const cam=s.cameras?.main;if(!cam)return;cam.stopFollow?.();cam.pan?.(p.x,p.y-12,d,'Sine.easeInOut')}
  /* Close in on the building for the moment, then hand the player their own zoom back.
     A whole-city view puts a tile at 25px on a phone, where the effects are specks.
     Aim for a tile about 30% of the view wide, and never zoom out from where they are. */
  function closeIn(s,hold){const cam=s.cameras?.main;if(!cam?.zoomTo)return;const prev=cam.zoom,w=C.phaserCity?.host?.clientWidth||cam.width||390,want=Math.max(prev,Math.min(2.4,w*.3/64));
    if(want-prev<.05)return;cam.zoomTo(want,700,'Sine.easeInOut');setTimeout(()=>{if(Math.abs(cam.zoom-want)<.02)cam.zoomTo(prev,900,'Sine.easeInOut')},hold)}
  /* The growth loop selects what it built, which opens the building panel over half the
     map. The moment is about the building, so clear the way; it stays selected. */
  function clearStage(){try{C.phaserCity?.manager?.close?.()}catch{}}

  function banner(text,tone='solve'){
    const host=C.phaserCity?.host;if(!host||typeof document==='undefined')return null;
    host.querySelector('.city-payoff-banner')?.remove();
    const b=document.createElement('div');b.className=`city-payoff-banner city-payoff-${tone}`;b.setAttribute('role','status');b.setAttribute('aria-live','polite');b.textContent=text;host.appendChild(b);
    raf(()=>b.classList.add('show'));setTimeout(()=>{b.classList.remove('show');setTimeout(()=>b.remove(),400)},3200);return b}

  function play(m){
    const s=scene();if(!s?.add||!s.tweens)return false;guardRefresh(s);
    if(m.type==='complete')return playComplete(s,m);
    const at=m.growth?{x:m.growth.x,y:m.growth.y}:m.focus;if(!at)return false;
    const p=world(s,at.x,at.y),r=ref(s,at.x,at.y),top=r?.image?{x:r.image.x,y:r.image.getTopCenter?.().y??p.y-30}:{x:p.x,y:p.y-30},color=COLORS[m.resource?.id]||0xffd166;
    clearStage();pan(s,p);closeIn(s,3300);
    const parts=[`✨ ${m.challenge.title} solved`];
    if(m.resource)parts.push(`+${m.resource.amount} ${m.resource.icon} ${m.resource.name}`);
    if(m.growth)parts.push(m.growth.kind==='upgrade'?`⬆️ ${m.growth.name} Lv ${m.growth.level}`:`🏗️ ${m.growth.name} rising`);
    banner(parts.join('  ·  '));
    tokens(s,{x:p.x,y:p.y+2},color,m.resource?.amount||5,700,()=>{ring(s,p.x,p.y+2,color);bounce(s,r?.image);sparks(s,p.x,top.y+8,color,8)});
    if(m.resource)label(s,top.x,top.y-2,`+${m.resource.amount} ${m.resource.icon} ${m.resource.name}`,'#fff4c4',1350);
    if(m.growth){
      if(m.growth.kind==='upgrade'){bounce(s,r?.image,1700,true);sparks(s,p.x,top.y+6,0xfff1a8,12,1700);label(s,top.x,top.y-20,`⬆️ ${m.growth.name} · Level ${m.growth.level}`,'#d9ffef',1900)}
      else{ring(s,p.x,p.y+2,0xffd166,1600,2);label(s,top.x,top.y-20,`🏗️ ${m.growth.name} rising`,'#ffe8b0',1900)}}
    cheer(s,p,1500);
    C.events?.emit?.('city-payoff:played',{type:m.type,challenge:m.challenge.id,growth:m.growth?.kind||null,resource:m.resource?.id||null,x:at.x,y:at.y});
    return true}
  function playComplete(s,m){
    /* The scene rebuilds itself when construction finishes; wait for the new sprite. */
    const p=world(s,m.x,m.y);clearStage();pan(s,p,700);closeIn(s,3000);banner(`🏛️ ${m.name} is open`,'complete');
    setTimeout(()=>{const r=ref(s,m.x,m.y),img=r?.image;if(img){const sx=img.scaleX||1,sy=img.scaleY||1;img.setScale(sx,sy*.25).setAlpha(.4);
        s.tweens.add({targets:img,scaleY:sy,alpha:1,duration:620,ease:'Back.easeOut',onComplete:()=>img.setScale(sx,sy)})}
      const base=p.y+6,top=img?.getTopCenter?.().y??p.y-30;dust(s,p.x,base,10,80);sparks(s,p.x,top+6,0xfff1a8,12,420);ring(s,p.x,p.y+2,0x8ee3c1,360);label(s,p.x,top-4,`🏛️ ${m.name} complete!`,'#d9ffef',520);cheer(s,p,500)},760);
    C.events?.emit?.('city-payoff:played',{type:'complete',id:m.id,x:m.x,y:m.y});return true}
  function cheer(s,p,delay){
    /* The two nearest people outdoors hop where they stand. */
    const near=(s.livingCitizens||[]).filter(c=>c.sprite?.active&&c.sprite.alpha>.5).map(c=>({c,d:Math.hypot(c.sprite.x-p.x,c.sprite.y-p.y)})).filter(o=>o.d<260).sort((a,b)=>a.d-b.d).slice(0,2);
    for(const{c}of near)s.tweens.add({targets:c.sprite,y:c.sprite.y-4,duration:140,delay,yoyo:true,repeat:1,ease:'Quad.easeOut'})}

  function install(){
    if(install._done)return true;install._done=true;const on=(n,f)=>C.events?.on?.(n,f);
    on('learning:mastered',begin);on('coding:rewarded',onRewarded);on('city-growth:applied',onGrowth);on('world:construction-boost-earned',onBoost);on('learning-city:build-ready',onUnlock);on('story:beat',onBeat);on('world:construction-complete',onComplete);
    return true}
  C.CityPayoff={VERSION,FRESH_MS,summary,mentor,worthShowing,pending,cityVisible,show,play,install,_state:()=>({current,queue:[...queue]})};
  install();
})(window.Codeopolis);
