import fs from 'node:fs';
import vm from 'node:vm';
const fail=[];const ok=(v,m)=>{if(!v)fail.push(m)};
const C={events:{on(){},emit(){}},ConceptMastery:{LEVELS:[{level:0,name:'Unseen'},{level:1,name:'Introduced'},{level:2,name:'Practicing'},{level:3,name:'Competent'},{level:4,name:'Proficient'},{level:5,name:'Mastered'}],all:state=>state.rows||[]},phaserCity:{catalog:{render(){}}}};
const context=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Number,String,Object,Array,Set,Math});
vm.runInContext(fs.readFileSync('src/progression/mastery-building-gates.js','utf8'),context);
const G=C.MasteryBuildingGates;
const basic={id:'hut',name:'Array Hut',district:'materials',cost:100};
ok(G.status({rows:[]},basic).met,'basic buildings should not require mastery gates');
const lab={id:'graph-lab',name:'Graph Lab',district:'graphs',cost:700};
let state={rows:[{concept:{id:'bfs',district:'graphs',xp:30},level:{level:2,name:'Practicing'}}]};
let s=G.status(state,lab);ok(s.required&&s.target===3&&!s.met,'advanced district should require Competent mastery');
ok(G.missing(state,lab)?.need===1,'gate should expose exact mastery level gap');
state.rows[0].level={level:3,name:'Competent'};ok(G.status(state,lab).met,'Competent evidence should unlock standard advanced building gate');
const institute={id:'graph-institute',name:'Graph Institute',district:'graphs',cost:1400,requiresEra:3};
ok(G.requiredLevel(institute)===4,'late advanced buildings should require Proficient mastery');
state.rows[0].level={level:4,name:'Proficient'};ok(G.status(state,institute).met,'Proficient evidence should satisfy late advanced gate');
if(fail.length){console.error('MASTERY BUILDING GATES FAILED');for(const f of fail)console.error(' - '+f);process.exit(1)}
console.log('Mastery building gates passed: advanced city growth now requires demonstrated concept mastery.');
