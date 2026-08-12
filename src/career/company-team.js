(function(C){
  'use strict';
  const TEAMS={
    nova:{name:'Autonomy Platform',members:[
      {id:'priya',name:'Priya Natarajan',role:'Staff Robotics Engineer',icon:'🤖',specialties:['graphs','search','systems'],lens:'Keep the planner observable: state the invariant, latency budget, and fallback behavior.'},
      {id:'eli',name:'Eli Foster',role:'Robotics Reliability Engineer',icon:'🧯',specialties:['incident','debug','systems'],lens:'Assume hardware and network timing will be messy. Design a safe degradation path before optimizing.'}]},
    atlas:{name:'Core Infrastructure',members:[
      {id:'samira',name:'Samira Okafor',role:'Staff Distributed Systems Engineer',icon:'🌐',specialties:['graphs','structures','systems'],lens:'Make ownership and failure domains explicit before choosing the data structure or service boundary.'},
      {id:'ben',name:'Ben Cho',role:'Site Reliability Engineer',icon:'📈',specialties:['incident','debug','search'],lens:'Define what healthy looks like, how you detect drift, and which rollback is safe under pressure.'}]},
    helix:{name:'Frontier Model Systems',members:[
      {id:'nadia',name:'Nadia Rahman',role:'Applied Research Scientist',icon:'🧬',specialties:['dp','arrays','reasoning'],lens:'Treat the implementation as an experiment: name the hypothesis, baseline, metric, and failure case.'},
      {id:'owen',name:'Owen Price',role:'ML Systems Engineer',icon:'⚙️',specialties:['systems','structures','debug'],lens:'Separate model quality from serving-system behavior. Measure batching, memory pressure, and tail latency independently.'}]},
    vector:{name:'Detection & Response',members:[
      {id:'imani',name:'Imani Brooks',role:'Staff Product Security Engineer',icon:'🛡️',specialties:['hash','search','debug'],lens:'Start with attacker-controlled inputs, trust boundaries, and the invariant the fix must preserve.'},
      {id:'victor',name:'Victor Chen',role:'Detection Engineer',icon:'🔎',specialties:['graphs','search','incident'],lens:'Prefer explainable signals. Track false positives, correlation windows, and what evidence justifies containment.'}]},
    orbital:{name:'Mission Compute',members:[
      {id:'rina',name:'Rina Sato',role:'Principal Mission Systems Engineer',icon:'🛰️',specialties:['graphs','dp','systems'],lens:'Assume partial failure. Define the mission-critical path, degraded mode, and recovery invariant first.'},
      {id:'gabe',name:'Gabriel Ortiz',role:'Reliability Engineer',icon:'📡',specialties:['incident','structures','debug'],lens:'Design for delayed telemetry and uncertain clocks. Make retries, deduplication, and observability explicit.'}]}
  };
  const ROLE_LENSES={
    algorithms:{name:'Algorithms',icon:'🧠',focus:['graphs','dp','search']},
    systems:{name:'Systems',icon:'🏗️',focus:['graphs','structures','systems']},
    reliability:{name:'Reliability',icon:'🧯',focus:['incident','debug','search']},
    security:{name:'Security',icon:'🛡️',focus:['hash','search','graphs']},
    research:{name:'Research',icon:'🔬',focus:['dp','arrays','reasoning']},
    lead:{name:'Tech Lead',icon:'🧭',focus:['reasoning','systems','career']}
  };
  const STAGE_GUIDE={
    coding:'Before editing code, state the invariant, target complexity, boundary cases, and the smallest regression test that would prove the fix.',
    reasoning:'Frame the review around assumptions, rejected alternatives, complexity, failure modes, and what evidence would change your mind.',
    design:'Name traffic shape, ownership, storage, scaling bottleneck, failure handling, observability, and the tradeoff you are consciously accepting.',
    incident:'Separate symptoms from hypotheses. Define blast radius, immediate mitigation, root-cause evidence, rollback criteria, and post-incident prevention.',
    debug:'Reproduce first, minimize the failing case, identify the violated invariant, patch narrowly, then add a regression test.'
  };
  class CompanyTeam{
    constructor(state,game){this.state=state;this.game=game;this.data=this.ensure()}
    ensure(){const old=this.state.companyTeam||{};return this.state.companyTeam={version:1,roleLens:old.roleLens||'systems',relations:old.relations||{},consultations:old.consultations||[],lastAdvice:old.lastAdvice||null}}
    employment(){return this.game.phase18?.pipeline?.data?.employment||null}
    team(){const e=this.employment();return e?TEAMS[e.companyId]||null:null}
    members(){return this.team()?.members||[]}
    relation(id){return this.data.relations[id]||(this.data.relations[id]={trust:0,completedCollaborations:0,lastProjectId:null})}
    setRoleLens(id){if(!ROLE_LENSES[id])return false;this.data.roleLens=id;C.events.emit('company:role-lens',{id,lens:ROLE_LENSES[id]});return true}
    lens(){return ROLE_LENSES[this.data.roleLens]||ROLE_LENSES.systems}
    advice(memberId,project,stage){const m=this.members().find(x=>x.id===memberId);if(!m||!project||!stage)return null;const role=this.lens();const text=`${m.lens} ${STAGE_GUIDE[stage.type]||STAGE_GUIDE.reasoning} Your ${role.name} lens should emphasize ${(role.focus||[]).join(', ')}.`;const rec={memberId,projectId:project.id,stageIndex:project.stage,stageType:stage.type,text,at:new Date().toISOString()};this.data.consultations.unshift(rec);this.data.consultations=this.data.consultations.slice(0,60);this.data.lastAdvice={...rec,name:m.name,icon:m.icon,role:m.role};C.events.emit('company:advice',{member:m,project,stage,advice:rec});return this.data.lastAdvice}
    onStageCompleted(project,stage){const consulted=this.data.consultations.filter(x=>x.projectId===project.id&&x.stageIndex===project.stage-1);for(const c of consulted){const r=this.relation(c.memberId);r.trust=Math.min(100,r.trust+3);r.completedCollaborations++;r.lastProjectId=project.id}if(consulted.length)C.events.emit('company:collaboration-earned',{project,memberIds:[...new Set(consulted.map(x=>x.memberId))]})}
    averageTrust(){const ms=this.members();if(!ms.length)return 0;return Math.round(ms.reduce((s,m)=>s+(this.relation(m.id).trust||0),0)/ms.length)}
  }
  CompanyTeam.TEAMS=TEAMS;CompanyTeam.ROLE_LENSES=ROLE_LENSES;C.register('CompanyTeam',CompanyTeam);
})(window.Codeopolis);
