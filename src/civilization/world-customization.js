(function(C){
  'use strict';
  const VERSION=1;
  const EXPANSIONS=Object.freeze([
    {level:0,width:12,height:8,money:0,infrastructure:0,name:'Starter Plot'},
    {level:1,width:16,height:11,money:120,infrastructure:6,name:'Neighborhood Tract'},
    {level:2,width:20,height:14,money:280,infrastructure:12,name:'Township Annex'},
    {level:3,width:24,height:17,money:540,infrastructure:20,name:'Metro Expansion'},
    {level:4,width:28,height:20,money:900,infrastructure:30,name:'Regional Grid'},
    {level:5,width:32,height:23,money:1400,infrastructure:42,name:'Capital Territory'},
    {level:6,width:36,height:26,money:2100,infrastructure:58,name:'Megacity Reach'}
  ]);
  const TERRAINS=Object.freeze({
    grass:{id:'grass',name:'Grass',icon:'🌱',money:1},
    dirt:{id:'dirt',name:'Earth',icon:'🟫',money:1},
    forest:{id:'forest',name:'Woodland',icon:'🌲',money:2},
    water:{id:'water',name:'Water',icon:'💧',money:4}
  });
  const DECORATIONS=Object.freeze({
    tree:{id:'tree',name:'Tree',icon:'🌳',money:4,happiness:.3},
    flowers:{id:'flowers',name:'Flower Bed',icon:'🌷',money:3,happiness:.4},
    bench:{id:'bench',name:'Bench',icon:'🪑',money:5,happiness:.35},
    lamp:{id:'lamp',name:'Street Lamp',icon:'💡',money:6,happiness:.2},
    fountain:{id:'fountain',name:'Fountain',icon:'⛲',money:14,happiness:1},
    sculpture:{id:'sculpture',name:'Sculpture',icon:'🗿',money:18,happiness:1.2},
    garden:{id:'garden',name:'Community Garden',icon:'🪴',money:10,happiness:.8},
    plaza:{id:'plaza',name:'Plaza',icon:'◈',money:8,happiness:.5}
  });
  const STYLES=Object.freeze({
    standard:{id:'standard',name:'Standard',icon:'🏢',minAge:1},
    heritage:{id:'heritage',name:'Heritage',icon:'🧱',minAge:1},
    garden:{id:'garden',name:'Green',icon:'🌿',minAge:1},
    campus:{id:'campus',name:'Campus',icon:'📚',minAge:2},
    industrial:{id:'industrial',name:'Industrial',icon:'🏭',minAge:3},
    glass:{id:'glass',name:'Glass',icon:'💠',minAge:4},
    neon:{id:'neon',name:'Neon',icon:'✨',minAge:5},
    frontier:{id:'frontier',name:'Frontier',icon:'🛸',minAge:6}
  });
  function key(x,y){return`${x},${y}`}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function ensure(state,world){
    const d=state.cityCustomization||(state.cityCustomization={version:VERSION,expansionLevel:0,terrain:{},decorations:{},buildingStyles:{},history:[]});
    d.version=VERSION;d.terrain=d.terrain&&typeof d.terrain==='object'?d.terrain:{};d.decorations=d.decorations&&typeof d.decorations==='object'?d.decorations:{};d.buildingStyles=d.buildingStyles&&typeof d.buildingStyles==='object'?d.buildingStyles:{};d.history=Array.isArray(d.history)?d.history.slice(-79):[];
    const w=world?.world||state.world||{};let inferred=0;for(const e of EXPANSIONS)if((Number(w.width)||0)>=e.width&&(Number(w.height)||0)>=e.height)inferred=e.level;d.expansionLevel=clamp(Math.max(Number(d.expansionLevel)||0,inferred),0,EXPANSIONS.length-1);return d;
  }
  function age(state){return clamp(Number(C.AgeProgression?.current?.(state)?.level)||Number(state?.ageProgression?.level)||Number(state?.eraLevel)||1,1,6)}
  function terrainAt(state,_world,x,y){const v=ensure(state).terrain[key(x,y)];return TERRAINS[v]?v:null}
  function decorationAt(state,x,y){const v=ensure(state).decorations[key(x,y)];return v&&DECORATIONS[v.id]?{...v,def:DECORATIONS[v.id]}:null}
  function styleAt(state,x,y){return ensure(state).buildingStyles[key(x,y)]||'standard'}
  function expansionStatus(state,world){const d=ensure(state,world),current=EXPANSIONS[d.expansionLevel]||EXPANSIONS[0],next=EXPANSIONS[d.expansionLevel+1]||null,balances=C.ConceptResources?.balances?.(state)||state.learningResources?.balances||{},money=Number(state.money)||0;return{current,next,maxed:!next,canAfford:!!next&&money>=next.money&&(Number(balances.infrastructure)||0)>=next.infrastructure,money,infrastructure:Number(balances.infrastructure)||0}}
  function record(state,type,payload={}){const d=ensure(state);d.history.push({type,at:Date.now(),...payload});if(d.history.length>80)d.history.shift()}
  function edit(_world,_label,fn){return fn()}
  function spend(state,money,resources={}){if((Number(state.money)||0)<money)return{ok:false,reason:`Need 💰 ${money}`};if(C.ConceptResources?.missing){const missing=C.ConceptResources.missing(state,resources);if(Object.keys(missing).length)return{ok:false,reason:'Need more infrastructure resources',missing}}else{const b=state.learningResources?.balances||{};for(const[id,n]of Object.entries(resources))if((Number(b[id])||0)<n)return{ok:false,reason:`Need ${n} ${id}`}}
    state.money=Math.max(0,(Number(state.money)||0)-money);if(Object.keys(resources).length){if(C.ConceptResources?.spend){const r=C.ConceptResources.spend(state,resources,'world-customization');if(r&&r.ok===false){state.money+=money;return r}}else{const b=state.learningResources?.balances||{};for(const[id,n]of Object.entries(resources))b[id]=Math.max(0,(Number(b[id])||0)-n)}}return{ok:true}}
  function expand(state,world,{free=false}={}){const d=ensure(state,world),s=expansionStatus(state,world),next=s.next;if(!next)return{ok:false,reason:'Maximum city territory unlocked'};if(!free){const paid=spend(state,next.money,{infrastructure:next.infrastructure});if(!paid.ok)return paid}
    return edit(world,`Expand city to ${next.name}`,()=>{world.world.width=Math.max(world.world.width,next.width);world.world.height=Math.max(world.world.height,next.height);d.expansionLevel=next.level;record(state,'expand',{level:next.level,width:world.world.width,height:world.world.height,name:next.name});C.events?.emit?.('world:expanded',{...next,width:world.world.width,height:world.world.height});return{ok:true,...next,width:world.world.width,height:world.world.height}})
  }
  function canLandscape(world,x,y){if(!world?.inside?.(x,y))return{ok:false,reason:'Outside city limits'};const t=world.tile?.(x,y);if(t?.buildingId)return{ok:false,reason:'A building occupies this tile'};if(t?.road)return{ok:false,reason:'Remove the road first'};return{ok:true}}
  function setTerrain(state,world,x,y,id,{free=false}={}){if(!TERRAINS[id])return{ok:false,reason:'Unknown terrain'};const v=canLandscape(world,x,y);if(!v.ok)return v;const d=ensure(state,world),k=key(x,y),before=d.terrain[k]||null;if(before===id)return{ok:true,changed:false};if(!free){const paid=spend(state,TERRAINS[id].money);if(!paid.ok)return paid}
    return edit(world,`Landscape ${TERRAINS[id].name}`,()=>{d.terrain[k]=id;delete d.decorations[k];record(state,'terrain',{x,y,id});C.events?.emit?.('customization:terrain',{x,y,id});return{ok:true,changed:true,id}})
  }
  function clearTerrain(state,world,x,y){const d=ensure(state,world),k=key(x,y);if(!d.terrain[k])return{ok:true,changed:false};return edit(world,'Restore natural terrain',()=>{delete d.terrain[k];record(state,'terrain-clear',{x,y});C.events?.emit?.('customization:terrain',{x,y,id:null});return{ok:true,changed:true}})}
  function placeDecoration(state,world,x,y,id,{free=false}={}){const def=DECORATIONS[id];if(!def)return{ok:false,reason:'Unknown decoration'};const v=canLandscape(world,x,y);if(!v.ok)return v;const d=ensure(state,world),k=key(x,y);if(d.decorations[k]?.id===id)return{ok:true,changed:false};if(!free){const paid=spend(state,def.money);if(!paid.ok)return paid}
    return edit(world,`Place ${def.name}`,()=>{d.decorations[k]={id,placedAt:Date.now(),variant:(x*17+y*31+id.length)%3};record(state,'decor',{x,y,id});C.events?.emit?.('customization:decoration',{x,y,id});return{ok:true,changed:true,id}})}
  function removeDecoration(state,world,x,y){const d=ensure(state,world),k=key(x,y),old=d.decorations[k];if(!old)return{ok:true,changed:false};return edit(world,`Remove ${DECORATIONS[old.id]?.name||'decoration'}`,()=>{delete d.decorations[k];record(state,'decor-remove',{x,y,id:old.id});C.events?.emit?.('customization:decoration',{x,y,id:null});return{ok:true,changed:true,id:old.id}})}
  function setBuildingStyle(state,world,x,y,id){const def=STYLES[id];if(!def)return{ok:false,reason:'Unknown building style'};if(age(state)<def.minAge)return{ok:false,reason:`Unlocks in Age ${def.minAge}`};const a=world.anchorFor?.(x,y)||{x,y},t=world.tile?.(a.x,a.y);if(!t?.buildingId)return{ok:false,reason:'Select a building'};const d=ensure(state,world),k=key(a.x,a.y);return edit(world,`Restyle ${world.buildingDef?.(t.buildingId)?.name||t.buildingId}`,()=>{if(id==='standard')delete d.buildingStyles[k];else d.buildingStyles[k]=id;record(state,'style',{x:a.x,y:a.y,id,buildingId:t.buildingId});C.events?.emit?.('customization:building-style',{x:a.x,y:a.y,id,buildingId:t.buildingId});return{ok:true,changed:true,id,x:a.x,y:a.y}})}
  function decorationBonus(state,world){let happiness=0,count=0;for(const [k,v] of Object.entries(ensure(state,world).decorations)){const [x,y]=k.split(',').map(Number);if(!world?.inside?.(x,y)||!DECORATIONS[v.id])continue;happiness+=DECORATIONS[v.id].happiness||0;count++}return{count,happiness:Number(happiness.toFixed(1))}}
  function summary(state,world){const d=ensure(state,world),exp=expansionStatus(state,world),bonus=decorationBonus(state,world);return{version:VERSION,expansionLevel:d.expansionLevel,width:world?.world?.width||0,height:world?.world?.height||0,maxed:exp.maxed,next:exp.next,terrainTiles:Object.keys(d.terrain).length,decorations:bonus.count,decorationHappiness:bonus.happiness,styledBuildings:Object.keys(d.buildingStyles).length,age:age(state)}}
  function install(state,world){if(!state||!world)return false;ensure(state,world);const p=world.constructor?.prototype||Object.getPrototypeOf(world);if(p&&!p.__r12Customization){p.__r12Customization=true;const can=p.canPlaceBuilding,setRoad=p.setRoad;p.customizationSummary=function(){return summary(C.game?.state||this.state||state,this)};p.expandCity=function(opts){return expand(C.game?.state||this.state||state,this,opts)};p.customTerrainAt=function(x,y){return terrainAt(C.game?.state||this.state||state,this,x,y)};p.setCustomTerrain=function(x,y,id,opts){return setTerrain(C.game?.state||this.state||state,this,x,y,id,opts)};p.clearCustomTerrain=function(x,y){return clearTerrain(C.game?.state||this.state||state,this,x,y)};p.decorationAt=function(x,y){return decorationAt(C.game?.state||this.state||state,x,y)};p.placeDecoration=function(x,y,id,opts){return placeDecoration(C.game?.state||this.state||state,this,x,y,id,opts)};p.removeDecoration=function(x,y){return removeDecoration(C.game?.state||this.state||state,this,x,y)};p.buildingVisualStyle=function(x,y){const a=this.anchorFor?.(x,y)||{x,y};return styleAt(C.game?.state||this.state||state,a.x,a.y)};p.setBuildingVisualStyle=function(x,y,id){return setBuildingStyle(C.game?.state||this.state||state,this,x,y,id)};if(typeof can==='function')p.canPlaceBuilding=function(id,x,y){const r=can.call(this,id,x,y);if(!r?.ok)return r;if(this.decorationAt?.(x,y))return{ok:false,reason:'Remove the decoration before building here'};return r};if(typeof setRoad==='function')p.setRoad=function(x,y,value=true){if(value&&this.decorationAt?.(x,y))return{ok:false,reason:'Remove the decoration before building a road'};return setRoad.call(this,x,y,value)}}
    if(!install._events){install._events=true;for(const evt of['customization:terrain','customization:decoration','customization:building-style','world:expanded'])C.events?.on?.(evt,()=>C.events?.emit?.('customization:updated',summary(C.game?.state||state,C.game?.world||world)))}C.events?.emit?.('customization:ready',summary(state,world));return true}
  C.WorldCustomization={VERSION,EXPANSIONS,TERRAINS,DECORATIONS,STYLES,ensure,age,terrainAt,decorationAt,styleAt,expansionStatus,expand,canLandscape,setTerrain,clearTerrain,placeDecoration,removeDecoration,setBuildingStyle,decorationBonus,summary,install};
})(window.Codeopolis);
