(function(C){
  'use strict';
  const DISTRICTS=Object.freeze({
    materials:{id:'materials',name:'Foundations Quarter',icon:'🪵',resourceId:'materials',focus:'Arrays, strings, sorting, intervals',accent:0xc47b45},
    trade:{id:'trade',name:'Data Exchange',icon:'💱',resourceId:'trade',focus:'Hash maps, sets, heaps, stacks, queues',accent:0xd2a94f},
    research:{id:'research',name:'Graph & Search Institute',icon:'🔬',resourceId:'research',focus:'Trees, graphs, BFS/DFS, search',accent:0x4ea6a1},
    compute:{id:'compute',name:'Optimization Works',icon:'⚙️',resourceId:'compute',focus:'Dynamic programming, greedy, optimization',accent:0xb36b9d},
    infrastructure:{id:'infrastructure',name:'Systems Grid',icon:'⚡',resourceId:'infrastructure',focus:'Systems, networking, concurrency, architecture',accent:0x5f83bd},
    stability:{id:'stability',name:'Reliability Ward',icon:'🛡️',resourceId:'stability',focus:'Debugging, testing, security, incidents',accent:0x9b655e}
  });
  const LEVELS=Object.freeze([{level:1,name:'Outpost',earned:0},{level:2,name:'Neighborhood',earned:40},{level:3,name:'District',earned:120},{level:4,name:'Center',earned:260},{level:5,name:'Metropolis',earned:500}]);
  function districtIdFor(def={}){return C.MultiResourceEconomy?.primaryFor?.(def)||C.ConceptResources?.conceptKey?.({challenge:def})||'materials'}
  function levelFor(earned=0,buildingScore=0){const score=Math.max(0,Number(earned)||0)+Math.max(0,Number(buildingScore)||0)*25;let out=LEVELS[0];for(const l of LEVELS)if(score>=l.earned)out=l;return{...out,score}}
  function buildingRows(world){return world.placedBuildings().map(b=>{const id=districtIdFor(b.def||{}),level=world.buildingLevel?.(b.x,b.y)||1;return{...b,curriculumDistrict:id,buildingLevel:level}})}
  function summary(world,state){const resources=C.ConceptResources?.ensure?.(state),rows=buildingRows(world),out={};for(const d of Object.values(DISTRICTS)){const buildings=rows.filter(b=>b.curriculumDistrict===d.id),earned=Number(resources?.earned?.[d.resourceId])||0,balance=Number(resources?.balances?.[d.resourceId])||0,buildingScore=buildings.reduce((n,b)=>n+(b.buildingLevel||1),0),maturity=levelFor(earned,buildingScore);out[d.id]={...d,earned,balance,buildingCount:buildings.length,buildingScore,maturity,progressToNext:(()=>{const next=LEVELS.find(l=>l.level===maturity.level+1);if(!next)return 1;const prev=maturity.earned;return Math.max(0,Math.min(1,(maturity.score-prev)/(next.earned-prev)))} )()}}return out}
  function dominant(world,state){const s=summary(world,state);return Object.values(s).sort((a,b)=>b.maturity.score-a.maturity.score||b.earned-a.earned)[0]||s.materials}
  C.CurriculumDistricts={DISTRICTS,LEVELS,districtIdFor,levelFor,buildingRows,summary,dominant};
})(window.Codeopolis);