(function(C){
  'use strict';
  const MAX_LEVEL=3;
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1cManagementInstalled)return false;
    const p=World.prototype;p.__p1cManagementInstalled=true;
    const originalNormalize=p.normalize;
    p.buildingLevel=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y},t=this.tile(a.x,a.y);return Math.max(1,Math.min(MAX_LEVEL,Number(t?.level)||1))};
    p.upgradeCost=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return null;const def=C.BuildingRegistry?.definition?.(this,t.buildingId)||this.buildingDef(t.buildingId)||{},level=this.buildingLevel(a.x,a.y);if(level>=MAX_LEVEL)return null;const base=Math.max(80,Number(def.cost)||240);return Math.round(base*(0.55+level*.45));};
    p.upgradeBuilding=function(x,y,state){const a=this.anchorFor?this.anchorFor(x,y):{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return{ok:false,reason:'No building selected'};const level=this.buildingLevel(a.x,a.y);if(level>=MAX_LEVEL)return{ok:false,reason:'Building is already max level'};if(this.constructionProgress?.(t)<1)return{ok:false,reason:'Finish construction before upgrading'};const cost=this.upgradeCost(a.x,a.y);if((state?.money||0)<cost)return{ok:false,reason:`Need ${cost} money`};state.money-=cost;t.level=level+1;t.upgradedAt=Date.now();C.events.emit('world:building-upgraded',{id:t.buildingId,x:a.x,y:a.y,level:t.level,cost});return{ok:true,id:t.buildingId,x:a.x,y:a.y,level:t.level,cost}};
    p.demolishBuilding=function(x,y,{refundRate=.35}={}){const a=this.anchorFor?this.anchorFor(x,y):{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId||t.buildingId==='camp')return{ok:false,reason:'This building cannot be demolished'};const id=t.buildingId,def=C.BuildingRegistry?.definition?.(this,id)||this.buildingDef(id)||{},level=this.buildingLevel(a.x,a.y),refund=Math.round((Number(def.cost)||0)*refundRate*(1+(level-1)*.35));const r=this.unplaceBuilding(a.x,a.y);if(!r.ok)return r;const idx=(this.state?.buildings||[]).lastIndexOf?.(id);if(Number.isInteger(idx)&&idx>=0)this.state.buildings.splice(idx,1);C.events.emit('world:building-demolished',{id,x:a.x,y:a.y,level,refund});return{ok:true,id,refund,level}};
    p.buildingEffects=function(x,y){const a=this.anchorFor?this.anchorFor(x,y):{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return null;const def=C.BuildingRegistry?.definition?.(this,t.buildingId)||this.buildingDef(t.buildingId)||{},level=this.buildingLevel(a.x,a.y),mult=1+(level-1)*.5;return{level,maxLevel:MAX_LEVEL,multiplier:mult,population:Math.round((def.population||0)*mult),energy:Math.round((def.energy||0)*mult),happiness:Math.round((def.happiness||0)*mult),moneyRate:Number(((def.moneyRate||0)*mult).toFixed(1)),researchRate:Number(((def.researchRate||0)*mult).toFixed(1))}};
    p.normalize=function(world){originalNormalize.call(this,world);for(const t of Object.values(world.tiles||{})){if(!t?.buildingId)continue;t.level=Math.max(1,Math.min(MAX_LEVEL,Number(t.level)||1));if(t.upgradedAt&&!Number.isFinite(Number(t.upgradedAt)))delete t.upgradedAt}};
    return true;
  }
  C.register('BuildingManagement',{install,MAX_LEVEL});
})(window.Codeopolis);
