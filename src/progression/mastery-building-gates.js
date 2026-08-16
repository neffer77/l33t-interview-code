(function(C){
  'use strict';
  const VERSION=1;
  const ADVANCED=new Set(['graphs','dp','systems','reliability','infrastructure','network']);
  function requiredLevel(def={}){const d=String(def.district||'').toLowerCase();if(!ADVANCED.has(d))return 0;return Number(def.requiresEra)>=3||Number(def.cost)>=1200?4:3}
  function best(state,district){const rows=C.ConceptMastery?.all?.(state)||[];return rows.filter(r=>String(r.concept?.district||'').toLowerCase()===String(district||'').toLowerCase()).sort((a,b)=>(b.level?.level||0)-(a.level?.level||0)||(b.concept?.xp||0)-(a.concept?.xp||0))[0]||null}
  function status(state,def={}){const target=requiredLevel(def);if(!target)return{required:false,met:true,target:0,current:0,district:def.district||'core',best:null};const row=best(state,def.district),current=Number(row?.level?.level)||0,level=C.ConceptMastery?.LEVELS?.find?.(x=>x.level===target)||{level:target,name:target===4?'Proficient':'Competent'};return{required:true,met:current>=target,target,current,district:def.district,best:row,level,text:current>=target?`${level.name} ${def.district} mastery demonstrated`:`Reach ${level.name} mastery in ${def.district} (${current}/${target})`}}
  function missing(state,def){const s=status(state,def);return s.required&&!s.met?{type:'mastery',id:s.district,need:s.target-s.current,target:s.target,current:s.current,text:s.text,level:s.level}:null}
  function install(){if(install._done)return true;install._done=true;C.events?.on?.('mastery:updated',()=>C.phaserCity?.catalog?.render?.());return true}
  C.MasteryBuildingGates={VERSION,ADVANCED,requiredLevel,best,status,missing,install};
})(window.Codeopolis);
