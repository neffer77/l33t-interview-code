(function(C){
  'use strict';
  const VERSION=2;
  const PROFILES=Object.freeze({
    1:{id:'foundations',name:'Foundations Settlement',architecture:'Workshop settlement',background:'#1d3935',tint:0xffffff,scale:1,accent:0xd8b46a,ornament:'timber-bracing'},
    2:{id:'data_structures',name:'Data Structures Township',architecture:'Brick civic blocks',background:'#183b42',tint:0xffffff,scale:1,accent:0x75d7c8,ornament:'masonry-and-awnings'},
    3:{id:'algorithms',name:'Algorithmic City',architecture:'Stone institutes and campuses',background:'#1b3046',tint:0xffffff,scale:1,accent:0x92aef5,ornament:'columns-and-spires'},
    4:{id:'systems',name:'Systems Metropolis',architecture:'Industrial infrastructure',background:'#252e39',tint:0xffffff,scale:1,accent:0xf0b66b,ornament:'pipes-stacks-and-utilities'},
    5:{id:'advanced_engineering',name:'Advanced Engineering Capital',architecture:'Glass technical cores',background:'#20263e',tint:0xffffff,scale:1,accent:0x8fdaf0,ornament:'glass-cores-and-antennas'},
    6:{id:'frontier_engineer',name:'Frontier Engineering Arcology',architecture:'Frontier arcologies',background:'#171e35',tint:0xffffff,scale:1,accent:0xd7a5ff,ornament:'energy-rings-and-beacons'}
  });
  function level(state){return Math.max(1,Math.min(6,Number(C.AgeProgression?.current?.(state)?.level)||Number(state?.ageProgression?.level)||Number(state?.eraLevel)||1))}
  function profile(stateOrLevel){const n=typeof stateOrLevel==='number'?stateOrLevel:level(stateOrLevel);return PROFILES[Math.max(1,Math.min(6,Number(n)||1))]}
  function scene(){return C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')||null}
  function clear(s=scene()){for(const o of s?.__ageVisualDecor||[])try{o?.destroy?.()}catch{}if(s)s.__ageVisualDecor=[]}
  function buildingAccent(){return[]}
  function apply(state,s=scene()){if(!s)return{ok:false,reason:'City scene unavailable'};const p=profile(state),lvl=level(state);clear(s);s.cameras?.main?.setBackgroundColor?.(p.background);C.BuildingTierVisuals?.render?.(s);const physical=C.AgeCityTransformation?.apply?.(s,state)||null;s.__ageVisualDecor=[];const result={ok:true,level:lvl,profile:p,physical,buildings:s.buildingRefs?.size||0,decorations:physical?.physicalObjects||0,mode:'physical-city-transformation'};C.events?.emit?.('age-visual:applied',result);return result}
  function install(state){if(!state)return false;const refresh=()=>setTimeout(()=>{const s=scene();if(s){s.refresh?.();apply(C.game?.state||window.state||state,s)}},0);if(!install._done){install._done=true;for(const evt of['age:advanced','town-center:advanced','technology:unlocked','world:building-placed','world:building-upgraded','civilization:phaser-ready'])C.events?.on?.(evt,refresh)}setTimeout(()=>apply(state),0);return true}
  C.AgeVisualEvolution={VERSION,PROFILES,level,profile,scene,clear,buildingAccent,apply,install};
})(window.Codeopolis);
