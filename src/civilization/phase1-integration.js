(function(C){
  'use strict';
  const SCHEMA=1;
  const BALANCE=Object.freeze({
    upgrade:{level2:.75,level3:1.15,min:70},
    construction:{oneByOneBaseMs:12000,multiTileBaseMs:22000,costFactorMs:7,maxExtraMs:14000,maxMs:38000},
    targets:{roadCoverage:.75,serviceEfficiency:.8}
  });
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1jIntegrationInstalled)return false;
    const p=World.prototype;p.__p1jIntegrationInstalled=true;
    const previousNormalize=p.normalize,previousUpgradeCost=p.upgradeCost,previousConstructionDuration=p.constructionDurationFor;
    p.ensurePhase1State=function(){
      const w=this.world,phase=w.phase1||(w.phase1={schema:SCHEMA,guide:{dismissed:false,overlayViewed:false}});
      phase.schema=SCHEMA;phase.guide=phase.guide&&typeof phase.guide==='object'?phase.guide:{};
      phase.guide.dismissed=!!phase.guide.dismissed;phase.guide.overlayViewed=!!phase.guide.overlayViewed;
      return phase;
    };
    p.phase1Balance=function(){return BALANCE};
    p.upgradeCost=function(x,y){
      const a=this.anchorFor?.(x,y)||{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return previousUpgradeCost?.call(this,x,y)??null;
      const level=this.buildingLevel?.(a.x,a.y)||1;if(level>=3)return null;
      const def=C.BuildingRegistry?.definition?.(this,t.buildingId)||this.buildingDef(t.buildingId)||{},base=Math.max(BALANCE.upgrade.min,Number(def.cost)||240),mult=level===1?BALANCE.upgrade.level2:BALANCE.upgrade.level3;
      return Math.round(base*mult);
    };
    p.constructionDurationFor=function(id){
      const def=C.BuildingRegistry?.definition?.(this,id)||this.buildingDef(id)||{},fp=def.footprint||{w:1,h:1},area=Math.max(1,(fp.w||1)*(fp.h||1)),cost=Math.max(0,Number(def.cost)||0),b=BALANCE.construction;
      const base=area>1?b.multiTileBaseMs:b.oneByOneBaseMs,extra=Math.min(b.maxExtraMs,cost*b.costFactorMs);
      return Math.round(Math.min(b.maxMs,base+extra));
    };
    p.markPhase1Guide=function(key,value=true){const phase=this.ensurePhase1State();phase.guide[key]=!!value;C.events.emit('world:phase1-guide',{key,value:!!value});return phase.guide};
    p.phase1Checklist=function(){
      const placed=this.placedBuildings?.()||[],nonCamp=placed.filter(b=>b.id!=='camp'),adj=this.cityAdjacencySummary?.()||{},svc=this.cityServiceSummary?.()||{},phase=this.ensurePhase1State();
      const upgraded=nonCamp.some(b=>(this.buildingLevel?.(b.x,b.y)||1)>=2),specialized=nonCamp.some(b=>!!this.buildingSpecialization?.(b.x,b.y)),roadReady=(adj.total||0)>0&&(adj.roadCoverage||0)>=BALANCE.targets.roadCoverage,serviceRatio=nonCamp.length?nonCamp.reduce((n,b)=>n+(this.buildingServiceStatus?.(b.x,b.y)?.efficiency||0),0)/nonCamp.length:0;
      const steps=[
        {id:'build',label:'Place your first building',done:nonCamp.length>0,action:'build'},
        {id:'roads',label:'Connect the city with roads',done:roadReady,action:'roads'},
        {id:'services',label:'Reach 80% service efficiency',done:serviceRatio>=BALANCE.targets.serviceEfficiency,action:'services'},
        {id:'upgrade',label:'Upgrade a building to Level 2',done:upgraded,action:'select'},
        {id:'specialize',label:'Choose a building specialization',done:specialized,action:'select'},
        {id:'overlay',label:'Inspect a planning heatmap',done:!!phase.guide.overlayViewed,action:'map'}
      ];
      const complete=steps.every(s=>s.done);return{schema:SCHEMA,steps,complete,done:steps.filter(s=>s.done).length,total:steps.length,serviceRatio,roadCoverage:adj.roadCoverage||0};
    };
    p.normalize=function(world){previousNormalize.call(this,world);const phase=world.phase1||(world.phase1={});phase.schema=SCHEMA;phase.guide=phase.guide&&typeof phase.guide==='object'?phase.guide:{};phase.guide.dismissed=!!phase.guide.dismissed;phase.guide.overlayViewed=!!phase.guide.overlayViewed};
    this?.ensurePhase1State?.();
    return true;
  }
  C.register('Phase1Integration',{install,SCHEMA,BALANCE});
})(window.Codeopolis);
