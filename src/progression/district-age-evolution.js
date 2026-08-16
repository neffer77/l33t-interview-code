(function(C){
  'use strict';
  const VERSION=1;
  const STAGES=Object.freeze({
    1:{id:'outpost',name:'Learning Outpost',scale:1,alpha:.16,badge:'·'},
    2:{id:'workshop',name:'Workshop District',scale:1.03,alpha:.22,badge:'◆'},
    3:{id:'campus',name:'Established Campus',scale:1.07,alpha:.28,badge:'✦'},
    4:{id:'institute',name:'Advanced Institute',scale:1.11,alpha:.35,badge:'✶'},
    5:{id:'landmark',name:'Mastery Landmark',scale:1.16,alpha:.43,badge:'★'}
  });
  function clampLevel(v){return Math.max(1,Math.min(5,Number(v)||1))}
  function profile(v){return STAGES[clampLevel(v)]}
  function districtSummary(world,state){return C.CurriculumDistricts?.summary?.(world,state)||{}}
  function snapshot(state,world){const raw=districtSummary(world,state);const districts={};for(const [id,row] of Object.entries(raw)){const level=clampLevel(row?.maturity?.level||row?.level||1);districts[id]={id,level,stage:profile(level),name:row?.name||C.CurriculumDistricts?.DISTRICTS?.[id]?.name||id,icon:C.CurriculumDistricts?.DISTRICTS?.[id]?.icon||'◆'}}return{version:VERSION,districts}}
  function colorFor(scene,id){const def=C.CurriculumDistricts?.DISTRICTS?.[id];return scene?.assets?.districtGround?.[id]||def?.accent||0x9bd6ff}
  function clear(scene){for(const o of scene?.__districtEvolutionOverlays||[])try{o?.destroy?.()}catch{}if(scene)scene.__districtEvolutionOverlays=[]}
  function apply(state,world){const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(!scene?.add)return false;clear(scene);const snap=snapshot(state,world),t=scene.tile||32,buildings=scene.snapshot?.buildings||[];scene.__districtEvolutionOverlays=[];for(const b of buildings){const id=b.curriculumDistrict||b.district||'materials',row=snap.districts[id];if(!row)continue;const p=row.stage,color=colorFor(scene,id),ref=scene.buildingRefs?.get?.(`${b.x},${b.y}`);ref?.image?.setScale?.(p.scale);const halo=scene.add.ellipse(b.x*t+t/2,b.y*t+t*.78,t*(1.05+(row.level-1)*.08),t*(.48+(row.level-1)*.04),color,p.alpha).setStrokeStyle(1+(row.level>=4?1:0),color,.65).setDepth(4.5+b.y*.001);scene.__districtEvolutionOverlays.push(halo);if(row.level>=2){const mark=scene.add.text(b.x*t+t*.78,b.y*t+2,`${p.badge}${row.level}`,{fontFamily:'monospace',fontSize:row.level>=4?'10px':'9px',fontStyle:'bold',color:'#ffffff',backgroundColor:'#101c26dd',padding:{x:3,y:2}}).setOrigin(.5,0).setDepth(29);scene.__districtEvolutionOverlays.push(mark)}if(row.level>=4){const glow=scene.add.rectangle(b.x*t+t/2,b.y*t-t*.04,3,row.level===5?15:10,color,.8).setDepth(8+b.y*.01);scene.__districtEvolutionOverlays.push(glow)}}C.events?.emit?.('district-visuals:applied',snap);return snap}
  function install(state,world){if(install._done)return apply(state,world);install._done=true;const refresh=()=>requestAnimationFrame?.(()=>apply(C.game?.state||window.state||state,C.game?.world||world));for(const evt of['mastery:updated','coding:rewarded','world:building-placed','world:building-upgraded','age:advanced','town-center:advanced','civilization:phaser-ready'])C.events?.on?.(evt,refresh);return apply(state,world)}
  C.DistrictAgeEvolution={VERSION,STAGES,clampLevel,profile,districtSummary,snapshot,clear,apply,install};
})(window.Codeopolis);
