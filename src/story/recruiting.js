(function(C){
  'use strict';
  const COMPANIES=[
    {id:'nova',name:'Nova Robotics',icon:'🤖',focus:['graphs','search'],minKnowledge:38,minSolved:14,minCareer:1,offer:'Senior Software Engineer'},
    {id:'atlas',name:'Atlas Cloud',icon:'☁️',focus:['graphs','structures'],minKnowledge:45,minSolved:20,minCareer:2,offer:'Senior Infrastructure Engineer'},
    {id:'helix',name:'Helix AI',icon:'🧬',focus:['dp','arrays'],minKnowledge:52,minSolved:26,minCareer:2,offer:'Machine Learning Engineer'},
    {id:'vector',name:'Vector Security',icon:'🛡️',focus:['search','hash'],minKnowledge:58,minSolved:32,minCareer:3,offer:'Staff Security Engineer'},
    {id:'orbital',name:'Orbital Systems',icon:'🛰️',focus:['graphs','dp','systems'],minKnowledge:68,minSolved:40,minCareer:3,offer:'Staff Distributed Systems Engineer'}
  ];

  class RecruitingSystem{
    constructor(state,economy,characters){this.state=state;this.economy=economy;this.characters=characters;this.data=this.ensure()}
    ensure(){const old=this.state.recruiting||{};return this.state.recruiting={version:1,offers:old.offers||[],completed:old.completed||[],active:old.active||null,declined:old.declined||[],history:old.history||[]}}
    company(id){return COMPANIES.find(c=>c.id===id)}
    eligible(c){return this.economy.knowledgeIndex()>=c.minKnowledge&&(this.state.solved||[]).length>=c.minSolved&&(this.state.career?.rank||0)>=c.minCareer}
    evaluate(){for(const c of COMPANIES){if(this.data.offers.includes(c.id)||this.data.completed.includes(c.id)||this.data.declined.includes(c.id))continue;if(this.eligible(c)){this.data.offers.push(c.id);C.events.emit('story:recruiter-message',{company:c})}}}
    start(id){const c=this.company(id);if(!c||!this.data.offers.includes(id)||this.data.active)return false;const problems=this.pickProblems(c);this.data.active={companyId:id,startedAt:Date.now(),round:0,problemIds:problems.map(p=>p.id),passed:{},communication:{},status:'active'};C.events.emit('story:interview-started',{company:c,interview:this.data.active});return true}
    pickProblems(c){const pool=(typeof CHALLENGES!=='undefined'?CHALLENGES:[]).filter(ch=>typeof unlocked==='function'?unlocked(ch):true).sort((a,b)=>{const af=c.focus.includes(a.district)?1:0,bf=c.focus.includes(b.district)?1:0;return bf-af});const out=[];for(const p of pool){if(out.length>=3)break;if(!out.some(x=>x.district===p.district)||out.length>=2)out.push(p)}return out}
    current(){return this.data.active?.status==='active'?this.data.active:null}
    markPass(challenge){const a=this.current();if(!a||!a.problemIds.includes(challenge.id))return;a.passed[challenge.id]=true;C.events.emit('story:interview-progress',{interview:a,challenge})}
    answerCommunication(score){const a=this.current();if(!a)return;a.communication[a.round]=Math.max(0,Math.min(2,score));a.round++;if(a.round>=a.problemIds.length)this.finish()}
    finish(){const a=this.current();if(!a)return null;const company=this.company(a.companyId);const coding=a.problemIds.filter(id=>a.passed[id]).length;const comm=Object.values(a.communication).reduce((s,x)=>s+x,0);const score=Math.round((coding/a.problemIds.length)*75+(comm/(a.problemIds.length*2))*25);const passed=score>=70&&coding>=Math.ceil(a.problemIds.length*.67);a.status=passed?'passed':'failed';const rec={companyId:a.companyId,at:new Date().toISOString(),score,coding,total:a.problemIds.length,passed};this.data.history.unshift(rec);if(passed){this.data.completed.push(a.companyId);this.state.money=(this.state.money||0)+800+score*5;this.state.research=(this.state.research||0)+100;this.characters.award('marcus',18,`${company.name} interview completed`)}this.data.active=null;C.events.emit('story:interview-finished',{company,record:rec});return rec}
    decline(id){if(!this.data.offers.includes(id))return;this.data.offers=this.data.offers.filter(x=>x!==id);this.data.declined.push(id)}
  }

  C.register('RecruitingSystem',RecruitingSystem);C.storyData=C.storyData||{};C.storyData.companies=COMPANIES;
})(window.Codeopolis);
