import fs from 'node:fs';
import vm from 'node:vm';
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const buildings=[
  {id:'graph_lab',name:'Graph Lab',district:'graphs',icon:'🕸️'},
  {id:'materials_yard',name:'Materials Yard',district:'core',icon:'🏗️'}
];
const C={events:{on(){},emit(){}},phaserCity:{catalog:{render(){},showLearningFeedback(){},open(){}}},ConceptResources:{RESOURCE_DEFS:{materials:{name:'Materials'}},conceptKey:()=> 'materials'},MasteryBuildingGates:{missing:(state,def)=>def.id==='graph_lab'?{type:'mastery',id:'graphs',need:2,target:3,current:1,text:'Reach Competent mastery in graphs (1/3)'}:null,status:()=>null},ResourceGatedBuildings:{status:(state,world,def)=>({missing:def.id==='materials_yard'?[{type:'earned',id:'materials',need:10,target:20}]:[]})},BuildingRegistry:{status:(world,state,id)=>{const def=buildings.find(x=>x.id===id);return{def,locked:'blocked',owned:0,canAcquire:false,resourceGate:C.ResourceGatedBuildings.status(state,world,def)}},catalog:(world,state)=>buildings.map(def=>C.BuildingRegistry.status(world,state,def.id))},AdaptiveChallengeSelector:{conceptCandidates:c=>[c.district],ranked:()=>[
  {challenge:{id:'array_easy',title:'Two Sum',district:'arrays'},score:99,resourceId:'materials',reasons:['generic high score']},
  {challenge:{id:'graph_medium',title:'Number of Islands',district:'graphs'},score:70,resourceId:'research',reasons:['graph mastery']},
  {challenge:{id:'materials_easy',title:'Array Build',district:'arrays'},score:80,resourceId:'materials',reasons:['materials reward']}
],startChallenge:()=>true}};
const context=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Date,Math,Number,Object,Array,Set,JSON,setTimeout:fn=>fn()});
vm.runInContext(fs.readFileSync('src/progression/learning-city-loop.js','utf8'),context);
const L=C.LearningCityLoop,state={},world={};
const nav=L.navigator(state,world);
ok(nav.target?.buildingId==='graph_lab','navigator should prioritize a mastery-gated city goal over pure resource accumulation');
ok(nav.challenge?.id==='graph_medium','navigator should expose the concept-matched mission for its target building');
ok(nav.target?.next?.type==='mastery','navigator should explain the exact missing evidence type');
ok(nav.matchedConcept==='graphs','navigator should expose the matched concept for UI explanation');
const resource=L.contract(state,world,'materials_yard');
ok(resource.next?.recommendation?.challenge?.id==='array_easy','resource contracts should still choose the highest-ranked matching resource mission');
if(fail.length){console.error('CITY LEARNING NAVIGATOR FAILED');for(const f of fail)console.error(' - '+f);process.exit(1)}
console.log('City learning navigator passed: mastery-first goal selection, exact prerequisite explanation, and direct concept-matched mission verified.');
