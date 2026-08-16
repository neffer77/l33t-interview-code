import fs from 'node:fs';
import vm from 'node:vm';
const fail=[]; const ok=(v,m)=>{if(!v)fail.push(m)};
const C={events:{on(){},emit(){}},ConceptResources:{RESOURCE_DEFS:{research:{name:'Research'}}},ResourceGatedBuildings:{status:()=>({locked:true,missing:[{type:'earned',id:'research',need:20,target:40}]})},BuildingRegistry:{status:(w,s,id)=>({def:{id,name:'Graph Lab'},locked:'Learn more first',owned:0,canAcquire:false,resourceGate:{missing:[{type:'earned',id:'research',need:20,target:40}]}}),catalog:(w,s)=>[C.BuildingRegistry.status(w,s,'lab')]},AdaptiveChallengeSelector:{ranked:()=>[{challenge:{id:'graph-one',title:'Number of Islands',diff:'Medium'},score:90,resourceId:'research',reasons:['weak concept']}],startChallenge:id=>(C.started=id,true)}};
const context=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Date,Math,Number,Object,Array,Set,JSON});
vm.runInContext(fs.readFileSync('src/progression/learning-city-loop.js','utf8'),context);
const L=C.LearningCityLoop, contract=L.contract({}, {}, 'lab');
ok(contract.locked,'locked building should expose a contract');
ok(/20 more Research/.test(contract.next.text),'contract should explain exact missing evidence');
ok(contract.next.recommendation.challenge.id==='graph-one','mission should align to missing resource');
const run=L.train({}, {}, 'lab'); ok(run.ok&&C.started==='graph-one','train should launch recommended challenge');
if(fail.length){console.error('LEARNING CITY LOOP FAILED');for(const f of fail)console.error(' - '+f);process.exit(1)}
console.log('Learning city loop passed: exact building prerequisites and direct training mission launch verified.');
