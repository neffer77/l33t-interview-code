(function(C){
  'use strict';
  const ADVANCED_DISTRICTS=new Set(['graphs','dp','systems','reliability','infrastructure','network']);
  function baseFor(world,id){return world.buildingDef(id)||((typeof BUILDINGS!=='undefined')?BUILDINGS.find(b=>b.id===id):null)||{id,name:id,icon:'🏢',district:'core'}}
  function definition(world,id){
    const base=baseFor(world,id),district=String(base.district||'core').toLowerCase();
    const advanced=ADVANCED_DISTRICTS.has(district)||/(transit|network|optimization|resilien|data center|institute|campus|exchange)/i.test(base.name||id);
    return Object.freeze({
      id,name:base.name||id,icon:base.icon||'🏢',district,
      footprint:base.footprint|| (advanced?{w:2,h:2}:{w:1,h:1}),
      cost:Number(base.cost)||0,desc:base.desc||'',requiresTech:base.requiresTech||null,requiresEra:Number(base.requiresEra)||null,
      population:Number(base.population)||0,energy:Number(base.energy)||0,happiness:Number(base.happiness)||0,
      moneyRate:Number(base.moneyRate)||0,researchRate:Number(base.researchRate)||0
    });
  }
  function cells(def,x,y){const out=[];for(let dy=0;dy<def.footprint.h;dy++)for(let dx=0;dx<def.footprint.w;dx++)out.push({x:x+dx,y:y+dy,anchor:dx===0&&dy===0});return out}
  function lockReason(state,def){
    try{if(typeof buildingLockedReason==='function'){const r=buildingLockedReason(baseFor({buildingDef:()=>def},def.id));if(r)return String(r)}}catch{}
    if(def.requiresTech&&!(state.tech||[]).includes(def.requiresTech))return `Research ${def.requiresTech} first`;
    if(def.requiresEra&&(state.eraLevel||1)<def.requiresEra)return `Requires Age ${def.requiresEra}`;
    return null;
  }
  function status(world,state,id){
    const def=definition(world,id),locked=lockReason(state,def),owned=world.inventory().find(v=>v.id===id)?.count||0,affordable=(state.money||0)>=def.cost;
    return{def,locked,owned,affordable,canAcquire:!locked&&affordable,canPlace:owned>0};
  }
  function catalog(world,state){return (typeof BUILDINGS==='undefined'?[]:BUILDINGS).map(b=>status(world,state,b.id))}
  C.BuildingRegistry={definition,cells,status,catalog,lockReason};
})(window.Codeopolis);
