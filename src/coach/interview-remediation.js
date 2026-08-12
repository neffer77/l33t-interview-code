(function(C){'use strict';
const TARGET={coding:100,reasoning:75,incident:75,debug:100,design:75,behavioral:75};
const LABEL={coding:'Coding correctness',reasoning:'Technical explanation',incident:'Production judgment',debug:'Debugging',design:'System design',behavioral:'Behavioral communication'};
class InterviewRemediation{
 constructor(game,day){this.game=game;this.day=day;this.state=game?.state||window.state||{};this.key='codeopolis-phase30-remediation-v1';this.data=this.load()}
 load(){try{return Object.assign({active:null,history:[]},JSON.parse(localStorage.getItem(this.key)||'{}'))}catch{return{active:null,history:[]}}}
 save(){localStorage.setItem(this.key,JSON.stringify(this.data))}
 challengePool(){return (typeof CHALLENGES==='undefined'?[]:CHALLENGES).filter(c=>!String(c.id||'').startsWith('debug-')&&(typeof unlocked!=='function'||unlocked(c)))}
 lastDay(){return this.day?.data?.history?.find(d=>d.status==='complete')||null}
 sourceRound(day,type){return day?.rounds?.find(r=>r.type===type)||null}
 freshChallenge(source){const all=this.challengePool(),src=all.find(c=>c.id===source?.challengeId);const solved=new Set(this.state.solved||[]);const family=src?.family||src?.district;return all.find(c=>c.id!==src?.id&&!solved.has(c.id)&&(c.family===family||c.district===src?.district))||all.find(c=>c.id!==src?.id&&!solved.has(c.id))||all.find(c=>c.id!==src?.id)||src||all[0]}
 create(day=this.lastDay()){if(!day?.summary)return{ok:false,reason:'Complete an Interview Day first.'};if(this.data.active?.status==='active')return{ok:false,reason:'Finish the active remediation plan first.'};const weak=day.summary.weakest||[...day.rounds].sort((a,b)=>(a.score||0)-(b.score||0))[0]?.type;if(!weak)return{ok:false,reason:'No measurable weak signal found.'};const source=this.sourceRound(day,weak),tasks=[],challenge=this.freshChallenge(source);if(weak==='coding'){if(challenge)tasks.push(this.task('coding',`Fresh judged solve: ${challenge.title}`,`Prove correctness on a different problem before re-testing under interview pressure.`,{challengeId:challenge.id,target:100}));if(challenge)tasks.push(this.task('reasoning',`Defend the solution: ${challenge.title}`,'Explain invariants, complexity, edge cases, and alternatives after the fresh solve.',{challengeId:challenge.id,target:75}))}
 else if(weak==='reasoning'){const c=challenge||this.challengePool()[0];if(c)tasks.push(this.task('reasoning',`Technical deep dive: ${c.title}`,'Repair explanation quality with a fresh scored reasoning round.',{challengeId:c.id,target:75}));if(c)tasks.push(this.task('coding',`Validate implementation: ${c.title}`,'Back the explanation with a judged implementation, not verbal fluency alone.',{challengeId:c.id,target:100}))}
 else if(weak==='incident')tasks.push(this.task('incident','Production incident remediation','Demonstrate containment, diagnosis, repair, scale, and postmortem judgment.',{target:75,scenarioId:source?.scenarioId||'routing-meltdown'}));
 else if(weak==='debug')tasks.push(this.task('debug','Debugging remediation','Resolve a fresh production defect and prove the fix with regression evidence.',{target:100}));
 else if(weak==='design')tasks.push(this.task('design','System design remediation','Clear the architecture rubric with explicit requirements, tradeoffs, failure modes, and observability.',{target:75,scenarioId:source?.scenarioId||'job-queue'}));
 else if(weak==='behavioral')tasks.push(this.task('behavioral','Behavioral evidence remediation','Give a specific ownership story with actions, measurable outcome, conflict/tradeoff, and reflection.',{target:75}));
 tasks.push(this.task('retest',`Re-test: ${day.company} Interview Day`,'Transfer only counts when the repaired signal survives a fresh end-to-end mock loop.',{target:day.bar,sourceDayId:day.id,company:day.company,profileId:day.profileId}));
 const plan={id:`repair-${Date.now()}`,status:'active',sourceDayId:day.id,company:day.company,profileId:day.profileId,weakSignal:weak,weakScore:source?.score||0,createdAt:Date.now(),tasks};this.data.active=plan;this.save();C.events.emit('remediation:created',{plan});return{ok:true,plan}}
 task(type,title,why,extra={}){return{id:`${type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,title,why,status:'open',...extra}}
 active(){return this.data.active?.status==='active'?this.data.active:null}
 mark(predicate,score,meta={}){const p=this.active();if(!p)return false;let changed=false;for(const t of p.tasks){if(t.status==='open'&&predicate(t)&&Number(score)>=Number(t.target||0)){t.status='done';t.score=Math.round(Number(score)||0);t.completedAt=Date.now();t.meta=meta;changed=true;C.events.emit('remediation:task-complete',{plan:p,task:t})}}if(changed){this.finishIfDone();this.save()}return changed}
 onMastered(e){return this.mark(t=>t.type==='coding'&&t.challengeId===e.challenge?.id,100,{challengeId:e.challenge?.id})}
 onInterviewer(e){return this.mark(t=>t.type==='reasoning'&&t.challengeId===e.challenge?.id,e.record?.score||0,{challengeId:e.challenge?.id})}
 onIncident(e){return this.mark(t=>t.type==='incident'&&(!t.scenarioId||t.scenarioId===e.incident?.id),e.score??e.incident?.score??0,{scenarioId:e.incident?.id})}
 onDebug(e){return this.mark(t=>t.type==='debug',100,{scenarioId:e.scenario?.id})}
 onDesign(e){return this.mark(t=>t.type==='design'&&(!t.scenarioId||t.scenarioId===e.scenario?.id),e.record?.score||0,{scenarioId:e.scenario?.id})}
 onBehavioral(e){return this.mark(t=>t.type==='behavioral',e.record?.score||0,{question:e.record?.question})}
 onInterviewDay(e){const d=e.day,p=this.active();if(!p||d.id===p.sourceDayId)return false;return this.mark(t=>t.type==='retest'&&t.profileId===d.profileId,d.summary?.overall||0,{dayId:d.id,verdict:d.summary?.verdict,weakest:d.summary?.weakest})}
 finishIfDone(){const p=this.active();if(!p||p.tasks.some(t=>t.status!=='done'))return false;p.status='complete';p.completedAt=Date.now();this.data.history.unshift({...p});this.data.history=this.data.history.slice(0,30);this.data.active=null;C.events.emit('remediation:complete',{plan:p});return true}
 progress(){const p=this.active();if(!p)return{done:0,total:0,pct:0};const done=p.tasks.filter(t=>t.status==='done').length,total=p.tasks.length;return{done,total,pct:total?Math.round(done/total*100):0}}
 label(type){return LABEL[type]||type}
 target(type){return TARGET[type]||75}
}
C.register('InterviewRemediation',InterviewRemediation);})(window.Codeopolis);