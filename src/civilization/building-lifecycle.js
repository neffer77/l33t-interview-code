(function(C){
  'use strict';
  const MAX_LEVEL=3;
  const levelFor=t=>Math.max(1,Math.min(MAX_LEVEL,Number(t?.level)||1));
  function upgradeCost(world,tile){
    if(!tile?.buildingId)return 0;const def=world.buildingDef(tile.buildingId),base=Math.max(0,Number(def?.cost)||0),level=levelFor(tile);
    if(!base||level>=MAX_LEVEL)return 0;return Math.max(50,Math.round(base*(.55+.35*level)/10)*10);
  }
  function investedValue(world,tile){const def=world.buildingDef(tile?.buildingId),base=Math.max(0,Number(def?.cost)||0),level=levelFor(tile);let total=base;for(let l=1;l<level;l++)total+=Math.max(50,Math.round(base*(.55+.35*l)/10)*10);return total}
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1LifecycleInstalled)return false;
    const p=World.prototype;p.__p1LifecycleInstalled=true;
    p.buildingLevel=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y};return levelFor(this.tile(a.x,a.y))};
    p.buildingUpgradeStatus=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y},tile=this.tile(a.x,a.y);if(!tile?.buildingId)return{ok:false,reason:'No building selected'};const level=levelFor(tile),def=this.buildingDef(tile.buildingId);if(tile.buildingId==='camp')return{ok:false,reason:'Founder Camp cannot be upgraded',level,maxLevel:MAX_LEVEL,def};if(level>=MAX_LEVEL)return{ok:false,reason:'Maximum level reached',level,maxLevel:MAX_LEVEL,def};const cost=upgradeCost(this,tile);return{ok:(this.state.money||0)>=cost,reason:(this.state.money||0)>=cost?'':`Need 💰 ${cost}`,cost,level,nextLevel:level+1,maxLevel:MAX_LEVEL,def,x:a.x,y:a.y}};
    p.upgradeBuilding=function(x,y){const s=this.buildingUpgradeStatus(x,y);if(!s.cost||s.level>=MAX_LEVEL)return s;if(!s.ok)return s;const tile=this.tile(s.x,s.y);this.state.money=Math.max(0,(this.state.money||0)-s.cost);tile.level=s.nextLevel;tile.upgradedAt=Date.now();C.events.emit('world:building-upgraded',{id:tile.buildingId,x:s.x,y:s.y,level:tile.level,cost:s.cost,def:this.buildingDef(tile.buildingId)});return{ok:true,id:tile.buildingId,x:s.x,y:s.y,level:tile.level,cost:s.cost}};
    p.demolishStatus=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y},tile=this.tile(a.x,a.y);if(!tile?.buildingId)return{ok:false,reason:'No building selected'};if(tile.buildingId==='camp')return{ok:false,reason:'Founder Camp cannot be demolished'};const refund=Math.round(investedValue(this,tile)*.35);return{ok:true,id:tile.buildingId,x:a.x,y:a.y,refund,level:levelFor(tile),def:this.buildingDef(tile.buildingId)}};
    p.demolishBuilding=function(x,y){const s=this.demolishStatus(x,y);if(!s.ok)return s;const a={x:s.x,y:s.y},tile=this.tile(a.x,a.y),fp=tile?.footprint||{w:1,h:1};for(let dy=0;dy<fp.h;dy++)for(let dx=0;dx<fp.w;dx++){const k=C.util.key(a.x+dx,a.y+dy),cell=this.world.tiles[k];if(!cell)continue;delete cell.buildingId;delete cell.occupiedBy;delete cell.placedAt;delete cell.constructionMs;delete cell.footprint;delete cell.level;delete cell.upgradedAt;if(!cell.road)delete this.world.tiles[k]}
      const owned=this.state.buildings||[],idx=owned.indexOf(s.id);if(idx>=0)owned.splice(idx,1);this.state.money=(this.state.money||0)+s.refund;this.world.selected=null;C.events.emit('world:building-demolished',{...s,footprint:fp});C.events.emit('world:selected',null);return{...s,ok:true}}
    p.buildingOutputMultiplier=function(x,y){return 1+(this.buildingLevel(x,y)-1)*.25};
    if(typeof productionRates==='function'&&!productionRates.__p1LifecycleWrapped){const legacy=productionRates,worldGetter=()=>C.game?.world;const wrapped=function(){const r=legacy.apply(this,arguments),w=worldGetter();if(!w)return r;for(const b of w.placedBuildings()){const level=levelFor(b.tile);if(level<=1)continue;const d=w.buildingDef(b.id),bonus=(level-1)*.25;if(Number.isFinite(r.moneyRate))r.moneyRate+=(Number(d?.moneyRate)||0)*bonus;if(Number.isFinite(r.researchRate))r.researchRate+=(Number(d?.researchRate)||0)*bonus;if(Number.isFinite(r.energyDelta))r.energyDelta+=(Number(d?.energy)||0)*bonus;if(Number.isFinite(r.popBonus))r.popBonus+=(Number(d?.population)||0)*bonus;if(Number.isFinite(r.happyBonus))r.happyBonus+=(Number(d?.happiness)||0)*bonus}return r};wrapped.__p1LifecycleWrapped=true;productionRates=wrapped}
    return true;
  }
  C.BuildingLifecycle={install,MAX_LEVEL,levelFor,upgradeCost,investedValue};
})(window.Codeopolis);
