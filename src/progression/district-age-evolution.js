(function(C){
  'use strict';
  const VERSION=2;
  const STAGES=Object.freeze({
    1:{id:'outpost',name:'Learning Outpost',scale:1,alpha:.11,badge:'·'},
    2:{id:'workshop',name:'Workshop District',scale:1.03,alpha:.16,badge:'◆'},
    3:{id:'campus',name:'Established Campus',scale:1.07,alpha:.2,badge:'✦'},
    4:{id:'institute',name:'Advanced Institute',scale:1.11,alpha:.24,badge:'✶'},
    5:{id:'landmark',name:'Mastery Landmark',scale:1.16,alpha:.3,badge:'★'}
  });
  function clampLevel(v){return Math.max(1,Math.min(5,Number(v)||1))}
  function profile(v){return STAGES[clampLevel(v)]}
  function districtSummary(world,state){return C.CurriculumDistricts?.summary?.(world,state)||{}}
  function snapshot(state,world){const raw=districtSummary(world,state),districts={};for(const [id,row] of Object.entries(raw)){const level=clampLevel(row?.maturity?.level||row?.level||1);districts[id]={id,level,stage:profile(level),name:row?.name||C.CurriculumDistricts?.DISTRICTS?.[id]?.name||id,icon:C.CurriculumDistricts?.DISTRICTS?.[id]?.icon||'◆'}}return{version:VERSION,districts}}
  function colorFor(scene,id){const def=C.CurriculumDistricts?.DISTRICTS?.[id];return scene?.assets?.districtGround?.[id]||def?.accent||0x9bd6ff}
  function clear(scene){for(const o of scene?.__districtEvolutionOverlays||[])try{o?.destroy?.()}catch{}if(scene)scene.__districtEvolutionOverlays=[]}
  function keep(scene,o){if(o)(scene.__districtEvolutionOverlays||(scene.__districtEvolutionOverlays=[])).push(o);return o}
  function center(scene,b){return scene.iso?.footprintCenter?.({footprint:b.footprint||{w:1,h:1}},b.x,b.y,scene.layout)||scene.toWorld?.(b.x,b.y)||{x:b.x*32,y:b.y*32}}
  function physicalMarker(scene,b,row,color){const p=center(scene,b),d=scene.iso?.depth?.(b.x+(b.footprint?.w||1)-1,b.y+(b.footprint?.h||1)-1,34)||30,g=keep(scene,scene.add.graphics().setDepth(d));if(row.level===2){g.fillStyle(0x5b704b,.85);g.fillRect(p.x-22,p.y-7,7,4);g.fillStyle(color,.8);g.fillRect(p.x-19,p.y-10,2,3)}else if(row.level===3){g.fillStyle(0x596268,.9);g.fillRect(p.x+20,p.y-16,2,13);g.fillStyle(color,.95);g.fillRect(p.x+18,p.y-18,6,3);g.fillStyle(0x8c775e,.8);g.fillRect(p.x-22,p.y-6,11,3)}else if(row.level===4){g.fillStyle(0x5e6871,.9);g.fillRect(p.x+20,p.y-21,3,19);g.lineStyle(1,color,.9);g.beginPath();g.moveTo(p.x+21,p.y-18);g.lineTo(p.x+28,p.y-12);g.strokePath();g.fillStyle(color,.95);g.fillCircle(p.x+21,p.y-23,3)}else if(row.level===5){g.lineStyle(2,color,.9);g.strokeCircle(p.x,p.y-18,10);g.strokeCircle(p.x,p.y-18,6);g.fillStyle(color,.96);g.fillCircle(p.x,p.y-18,3);const beam=keep(scene,scene.add.rectangle(p.x,p.y-32,2,21,color,.35).setDepth(d));scene.tweens?.add?.({targets:beam,alpha:{from:.16,to:.65},duration:900,yoyo:true,repeat:-1})}return g}
  function apply(state,world){const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(!scene?.add)return false;clear(scene);const snap=snapshot(state,world),buildings=scene.snapshot?.buildings||[];for(const b of buildings){const id=b.curriculumDistrict||b.district||'materials',row=snap.districts[id];if(!row)continue;const color=colorFor(scene,id),p=center(scene,b),w=Math.max(34,(b.footprint?.w||1)*42),h=Math.max(15,(b.footprint?.h||1)*19);keep(scene,scene.add.ellipse(p.x,p.y-1,w*(1+(row.level-1)*.04),h*(1+(row.level-1)*.03),color,row.stage.alpha).setStrokeStyle(row.level>=4?2:1,color,.55).setDepth((scene.iso?.depth?.(b.x,b.y,5)||5)+.2));if(row.level>=2)physicalMarker(scene,b,row,color)}C.events?.emit?.('district-visuals:applied',snap);return snap}
  function install(state,world){if(install._done)return apply(state,world);install._done=true;const refresh=()=>{const run=()=>apply(C.game?.state||window.state||state,C.game?.world||world);if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0)};for(const evt of['mastery:updated','coding:rewarded','world:building-placed','world:building-upgraded','age:advanced','town-center:advanced','technology:unlocked','civilization:phaser-ready'])C.events?.on?.(evt,refresh);return apply(state,world)}
  C.DistrictAgeEvolution={VERSION,STAGES,clampLevel,profile,districtSummary,snapshot,center,clear,apply,install};
})(window.Codeopolis);
