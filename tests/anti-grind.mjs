import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const failures=[];
const ok=(value,message)=>{if(!value)failures.push(message)};
const C={events:{emit(){},on(){}}};
const ctx=vm.createContext({window:{Codeopolis:C},Codeopolis:C,console,Date,Math,Number,Object,Array,JSON,setTimeout});
for(const file of [
  'src/progression/concept-resources.js',
  'src/progression/anti-grind.js',
  'src/progression/coding-reward-pipeline.js',
  'src/progression/concept-mastery.js',
  'src/progression/learning-objectives.js'
]) vm.runInContext(fs.readFileSync(path.join(process.cwd(),file),'utf8'),ctx);

const A=C.AntiGrind,R=C.CodingRewardPipeline,M=C.ConceptMastery,O=C.LearningObjectives;
const graph={id:'g1',district:'graphs',pattern:'BFS',diff:'Medium'};
const easy={id:'a1',district:'arrays',pattern:'Arrays',diff:'Easy'};

const state={eraLevel:4};
const fresh=A.evaluate(state,{challenge:graph,hintsUsed:0,attempts:1});
ok(fresh.newProblem&&fresh.newConcept&&fresh.multiplier>1,'new problem/concept should earn exploration bonus');
ok(fresh.progressionEligible&&fresh.objectiveEligible,'fresh useful solve should count for progression and objectives');
A.record(state,{challenge:graph},{antiGrind:fresh},100000000);

let repeated;
for(let i=1;i<=3;i++){
  repeated=A.evaluate(state,{challenge:graph,hintsUsed:0,attempts:1},100000000+i);
  A.record(state,{challenge:graph},{antiGrind:repeated},100000000+i);
}
ok(repeated.multiplier<.5,'repeated same-problem farming should strongly diminish');
ok(repeated.progressionBlocked,'fourth same-day successful solve should become practice-only');
ok(!repeated.objectiveEligible,'practice-only solve should not advance objectives');

const review=A.evaluate(state,{challenge:graph,spacedReview:true,explanationComplete:true,hintsUsed:0,attempts:1},100000010);
ok(review.spacedReview&&review.progressionEligible,'explicit spaced review should remain progression eligible');
ok(review.reasons.includes('spaced review'),'spaced review should be explainable');

const firstEasy=A.evaluate(state,{challenge:easy},300000000);
A.record(state,{challenge:easy},{antiGrind:firstEasy},300000000);
A.record(state,{challenge:easy},{antiGrind:A.evaluate(state,{challenge:easy},300000001)},300000001);
const trivial=A.evaluate(state,{challenge:easy},300000002);
ok(trivial.trivial&&trivial.progressionBlocked,'repeated easy work in a later age should become practice-only sooner');

const integrated={eraLevel:2};
const r1=R.process(integrated,{challenge:graph,correct:true,hintsUsed:0,attempts:1});
R.process(integrated,{challenge:graph,correct:true,hintsUsed:0,attempts:1,firstSolve:false});
R.process(integrated,{challenge:graph,correct:true,hintsUsed:0,attempts:1,firstSolve:false});
const blocked=R.process(integrated,{challenge:graph,correct:true,hintsUsed:0,attempts:1,firstSolve:false});
ok(blocked.progressionEligible===false,'reward pipeline should surface progression block');
ok(blocked.amount===0&&blocked.granted===0,'practice-only solve should grant zero learning resources');
ok(R.ensure(integrated).blockedSolves===1,'reward ledger should count practice-only solves');
ok(integrated.antiGrind.problems.g1.solves===4,'anti-grind history should persist solve counts');
ok(r1.amount>0,'fresh solve should still grant resources');

const masteryState={eraLevel:2};
const freshReward=R.process(masteryState,{challenge:graph,correct:true,hintsUsed:0,attempts:1});
const masteryFresh=M.record(masteryState,freshReward);
ok(masteryFresh.xp>0,'fresh solve should grant mastery XP');
for(let i=0;i<2;i++)R.process(masteryState,{challenge:graph,correct:true,hintsUsed:0,attempts:1,firstSolve:false});
const practiceReward=R.process(masteryState,{challenge:graph,correct:true,hintsUsed:0,attempts:1,firstSolve:false});
const beforeXp=M.status(masteryState,'bfs').concept?.xp||0;
const masteryBlocked=M.record(masteryState,practiceReward);
const afterXp=M.status(masteryState,'bfs').concept?.xp||0;
ok(masteryBlocked.xp===0&&masteryBlocked.blocked,'practice-only solve should grant zero mastery XP');
ok(beforeXp===afterXp,'practice-only solve must not increase concept mastery');

const objectiveState={eraLevel:2,learningObjectives:{version:2,cycle:1,civicMomentum:0,history:[],practiceOnlyIgnored:0,active:[
  {id:'focus-1',type:'focus',title:'Focus',resourceId:'research',target:3,progress:0,reward:{money:0}},
  {id:'quality-1',type:'quality',title:'Clean',minDifficulty:'medium',target:1,progress:0,reward:{money:0}}
]}};
const objectiveWorld={};
const eligibleEvent={...freshReward,resourceId:'research',objectiveEligible:true,antiGrind:{...freshReward.antiGrind,objectiveEligible:true,progressionBlocked:false}};
O.onSolve(objectiveState,objectiveWorld,eligibleEvent);
ok(objectiveState.learningObjectives.active[0].progress===1,'eligible solve should advance focus objective');
ok(objectiveState.learningObjectives.active[1].progress===1,'eligible clean solve should advance quality objective');
objectiveState.learningObjectives.active[1].completed=false;objectiveState.learningObjectives.active[1].rewarded=false;objectiveState.learningObjectives.active[1].progress=0;
const beforeFocus=objectiveState.learningObjectives.active[0].progress;
O.onSolve(objectiveState,objectiveWorld,{...practiceReward,resourceId:'research',objectiveEligible:false});
ok(objectiveState.learningObjectives.active[0].progress===beforeFocus,'practice-only solve should not advance focus objective');
ok(objectiveState.learningObjectives.active[1].progress===0,'practice-only clean solve should not complete quality objective');
ok(objectiveState.learningObjectives.practiceOnlyIgnored===1,'objective state should record ignored practice-only solves');

const snap=A.snapshot(integrated);
ok(snap.uniqueProblems===1&&snap.uniqueConcepts===1,'snapshot should expose learning breadth');
ok(snap.blockedProgression===1,'snapshot should expose blocked farming attempts');

if(failures.length){
  console.error('ANTI-GRIND FAILED');
  for(const failure of failures)console.error(' - '+failure);
  process.exit(1);
}
console.log('Anti-grind passed: novelty, clean-solve quality, repeat decay, trivial-work protection, spaced-review exception, resource/mastery/objective blocking, and persistence verified.');