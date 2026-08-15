(function(C){
  'use strict';
  const GATES=Object.freeze({
    materials:{minEarned:20,minDistrictLevel:1,support:{trade:8}},
    trade:{minEarned:24,minDistrictLevel:1,support:{materials:8}},
    research:{minEarned:40,minDistrictLevel:2,support:{materials:12}},
    compute:{minEarned:48,minDistrictLevel:2,support:{research:18}},
    infrastructure:{minEarned:56,minDistrictLevel:2,support:{materials:16}},
    stability:{minEarned:56,minDistrictLevel:2,support:{infrastructure:16}}
  });
  function primary(def={}){return C.MultiResourceEconomy?.primaryFor?.(def)||C.ConceptResources?.conceptKey?.({challenge:def})||'materials'}
  function gateFor(def={}){const id=primary(def),base=GATES[id]||GATES.materials,scale=Math.max(1,Math.round((Number(def.cost)||100)/250));return{resourceId:id,minEarned:base.minEarned+Math.max(0,scale-1)*8,minDistrictLevel:base.minDistrictLevel,support:{...base.support}}}
  function districtLevel(state,world,id){const s=C.CurriculumDistricts?.summary?.(world,state)||{};return s[id]?.maturity?.level||0}
  function status(state,world,def={}){const g=gateFor(def),r=C.ConceptResources?.ensure?.(state),earned=r?.earned||{},missing=[];if((earned[g.resourceId]||0)<g.minEarned)missing.push({type:'earned',id:g.resourceId,need:g.minEarned-(earned[g.resourceId]||0),target:g.minEarned});const dl=districtLevel(state,world,g.resourceId);if(dl<g.minDistrictLevel)missing.push({type:'district',id:g.resourceId,need:g.minDistrictLevel-dl,target:g.minDistrictLevel});for(const [id,n] of Object.entries(g.support||{}))if((earned[id]||0)<n)missing.push({type:'support',id,need:n-(earned[id]||0),target:n});return{locked:missing.length>0,gate:g,missing,districtLevel:dl,earned:earned[g.resourceId]||0}}
  function formatMissing(state,world,def){const s=status(state,world,def);if(!s.locked)return'';return s.missing.map(m=>{const d=C.ConceptResources?.RESOURCE_DEFS?.[m.id],name=d?.name||m.id;if(m.type==='district')return`${name} district level ${m.target}`;return`${m.need} more ${name} earned`}).join(' · ')}
  function install(){if(install._done)return true;install._done=true;const R=C.BuildingRegistry,orig=R?.status;if(R&&orig&&!orig.__p2eWrapped){R.status=function(world,state,id){const out=orig.call(this,world,state,id),gate=status(state,world,out.def||{});if(!out.owned&&gate.locked)out.locked=`Learn more first: ${formatMissing(state,world,out.def)}`;out.resourceGate=gate;return out};R.status.__p2eWrapped=true}return true}
  C.ResourceGatedBuildings={GATES,primary,gateFor,status,formatMissing,install};
})(window.Codeopolis);