import fs from 'node:fs';
import vm from 'node:vm';
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const C={events:{on(){},emit(){}},ConceptResources:{RESOURCE_DEFS:{research:{name:'Research'}}},MasteryBuildingGates:{missing:()=>({type:'mastery',id:'graphs',need:1,target:3,current:2,text:'Reach Competent mastery in graphs (2/3)'})},ResourceGatedBuildings:{status:()=>({locked:false,missing:[]})},BuildingRegistry:{status:()=>({def:{id:'graph_lab',name:'Graph Lab',district:'graphs'},locked:'Reach Competent mastery in graphs',owned:0,canAcquire:false,resourceGate:{missing:[]}}),catalog:()=>[]},AdaptiveChallengeSelector:{conceptCandidates:c=>[c.pattern,c.district].filter(Boolean),ranked:()=>[
 {challenge:{id:'array-fast',title:'Two Sum',pattern:'arrays',district:'arrays'},score:99,resourceId:'research',reasons:['high generic score']},
 {challenge:{id:'graph-fit',title:'Number of Islands',pattern:'graphs',district:'graphs'},score:72,resourceId:'research',reasons:['weak graph concept']}
],startChallenge:id=>(C.started=id,true)}};
const context=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Date,Math,Number,Object,Array,Set,JSON,setTimeout:fn=>fn()});
vm.runInContext(fs.readFileSync('src/progression/learning-city-loop.js','utf8'),context);
const L=C.LearningCityLoop,state={},world={};
const c=L.contract(state,world,'graph_lab');
ok(c.next.type==='mastery','mastery evidence should remain the first city requirement');
ok(c.next.recommendation?.challenge?.id==='graph-fit','mastery-gated graph building must choose a graph mission even when another same-resource challenge scores higher');
ok(c.next.recommendation?.matchedConcept==='graphs','recommendation should record the concept matched to the city requirement');
const run=L.train(state,world,'graph_lab');
ok(run.ok&&C.started==='graph-fit','Train to unlock should launch the concept-specific mission');
if(fail.length){console.error('CONCEPT-SPECIFIC CITY MISSIONS FAILED');for(const f of fail)console.error(' - '+f);process.exit(1)}
console.log('Concept-specific city missions passed: city mastery requirements select matching concept challenges rather than generic same-resource work.');
