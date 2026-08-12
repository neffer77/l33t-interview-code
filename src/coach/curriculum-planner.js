(function(C){
  'use strict';
  const today=()=>new Date().toISOString().slice(0,10);
  class CurriculumPlanner{
    constructor(state,economy,readiness,game){this.state=state;this.economy=economy;this.readiness=readiness;this.game=game;this.data=this.ensure()}
    ensure(){const old=this.state.personalCurriculum||{};return this.state.personalCurriculum={version:1,date:old.date||null,goalMinutes:old.goalMinutes||25,tasks:old.tasks||[],history:old.history||[],completed:old.completed||0}}
    challengePool(){return typeof CHALLENGES==='undefined'?[]:CHALLENGES.filter(c=>typeof unlocked!=='function'||unlocked(c))}
    weaknessOrder(){return this.readiness.districts().map(x=>x.id)}
    pickReview(exclude=new Set()){for(const d of this.weaknessOrder()){const solved=this.challengePool().filter(c=>c.district===d&&(this.state.solved||[]).includes(c.id)&&!exclude.has(c.id));solved.sort((a,b)=>this.economy.challengeStrength(a)-this.economy.challengeStrength(b));if(solved[0])return solved[0]}return null}
    pickStretch(exclude=new Set()){for(const d of this.weaknessOrder()){const pool=this.challengePool().filter(c=>c.district===d&&!(this.state.solved||[]).includes(c.id)&&!c.id.startsWith('debug-')&&!exclude.has(c.id));if(pool[0])return pool[0]}return null}
    pickCareer(exclude=new Set()){const focus=this.game?.phase13?.paths?.path?.()?.focus||[];for(const d of focus){const pool=this.challengePool().filter(c=>c.district===d&&!exclude.has(c.id));pool.sort((a,b)=>this.economy.challengeStrength(a)-this.economy.challengeStrength(b));if(pool[0])return pool[0]}return null}
    task(type,title,why,extra={}){return{id:`${type}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,title,why,status:'open',createdAt:new Date().toISOString(),...extra}}
    generate(minutes=this.data.goalMinutes,force=false){
      minutes=Math.max(10,Math.min(90,Number(minutes)||25));if(!force&&this.data.date===today()&&this.data.tasks.length)return this.data.tasks;
      this.data.goalMinutes=minutes;const tasks=[],used=new Set(),gaps=this.readiness.gaps(),weak=gaps[0];
      const review=this.pickReview(used);if(review){used.add(review.id);tasks.push(this.task('review',`Review: ${review.title}`,`Retained ${review.district} mastery is one of your weakest durable areas.`,{challengeId:review.id,minutes:10}))}
      const stretch=this.pickStretch(used);if(stretch){used.add(stretch.id);tasks.push(this.task('challenge',`Stretch solve: ${stretch.title}`,`Build breadth in ${stretch.district} with a fresh hidden-test problem.`,{challengeId:stretch.id,minutes:15}))}
      const interviewChallenge=stretch||review||this.pickCareer(used);if(interviewChallenge&&minutes>=25)tasks.push(this.task('reasoning',`Explain before coding: ${interviewChallenge.title}`,`Your ${weak.label.toLowerCase()} score is ${weak.score}/100; practice assumptions, invariants, edge cases, and tradeoffs.`,{challengeId:interviewChallenge.id,minutes:8}));
      if(minutes>=40){const debug=this.game?.phase9?.debugging?.available?.()?.[0];if(debug)tasks.push(this.task('debug',debug.title,'Add production-debugging evidence, not just greenfield algorithm solves.',{scenarioId:debug.id,minutes:12}));else{const scenario=this.game?.phase9?.design?.constructor?.SCENARIOS?.find(s=>!(this.state.systemDesign?.completed||[]).includes(s.id))||this.game?.phase9?.design?.constructor?.SCENARIOS?.[0];if(scenario)tasks.push(this.task('design',scenario.name,'Practice architecture and tradeoff communication under a scored rubric.',{scenarioId:scenario.id,minutes:15}))}}
      if(minutes>=60){const career=this.pickCareer(used);if(career){used.add(career.id);tasks.push(this.task('career',`Career-focus solve: ${career.title}`,`Align practice with your ${this.game?.phase13?.paths?.path?.()?.name||'chosen'} specialization.`,{challengeId:career.id,minutes:15}))}}
      this.data.history.unshift({date:this.data.date,tasks:this.data.tasks,completed:this.data.tasks.filter(x=>x.status==='done').length});this.data.history=this.data.history.filter(x=>x.date).slice(0,30);this.data.date=today();this.data.tasks=tasks;C.events.emit('curriculum:generated',{minutes,tasks});return tasks
    }
    mark(predicate){let changed=false;for(const t of this.data.tasks)if(t.status!=='done'&&predicate(t)){t.status='done';t.completedAt=new Date().toISOString();this.data.completed++;changed=true;C.events.emit('curriculum:task-completed',{task:t})}return changed}
    onMastered(e){return this.mark(t=>['review','challenge','career'].includes(t.type)&&t.challengeId===e.challenge?.id)}
    onInterviewer(e){return this.mark(t=>t.type==='reasoning'&&t.challengeId===e.challenge?.id)}
    onDebug(e){return this.mark(t=>t.type==='debug'&&t.scenarioId===e.scenario?.id)}
    onDesign(e){return this.mark(t=>t.type==='design'&&t.scenarioId===e.scenario?.id&&(e.record?.score||0)>=70)}
    progress(){const total=this.data.tasks.length,done=this.data.tasks.filter(x=>x.status==='done').length;return{done,total,pct:total?Math.round(done/total*100):0}}
    regenerate(minutes){return this.generate(minutes,true)}
  }
  C.register('CurriculumPlanner',CurriculumPlanner);
})(window.Codeopolis);
