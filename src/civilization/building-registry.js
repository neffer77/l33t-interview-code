(function(C){
  'use strict';
  const ADVANCED_DISTRICTS=new Set(['graphs','dp','systems','reliability','infrastructure','network']);
  function definition(world,id){
    const base=world.buildingDef(id)||{id,name:id,icon:'🏢',district:'core'};
    const district=String(base.district||'core').toLowerCase();
    const advanced=ADVANCED_DISTRICTS.has(district)||/(transit|network|optimization|resilien|data center|institute|campus|exchange)/i.test(base.name||id);
    return Object.freeze({id,name:base.name||id,icon:base.icon||'🏢',district,footprint:advanced?{w:2,h:2}:{w:1,h:1}});
  }
  function cells(def,x,y){const out=[];for(let dy=0;dy<def.footprint.h;dy++)for(let dx=0;dx<def.footprint.w;dx++)out.push({x:x+dx,y:y+dy,anchor:dx===0&&dy===0});return out}
  C.BuildingRegistry={definition,cells};
})(window.Codeopolis);
