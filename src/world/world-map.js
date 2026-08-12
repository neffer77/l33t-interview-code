(function(C){
  'use strict';
  const ORGS=[
    {id:'codeopolis',name:'Codeopolis',icon:'🏙️',x:50,y:55,domain:'player'},
    {id:'nova',name:'Nova Robotics',icon:'🤖',x:18,y:28,domain:'robotics'},
    {id:'atlas',name:'Atlas Cloud',icon:'☁️',x:76,y:23,domain:'cloud'},
    {id:'helix',name:'Helix AI',icon:'🧬',x:82,y:69,domain:'ai'},
    {id:'vector',name:'Vector Security',icon:'🛡️',x:28,y:77,domain:'security'},
    {id:'orbital',name:'Orbital Systems',icon:'🛰️',x:53,y:12,domain:'space'}
  ];
  const REGIONS=[
    {id:'north-grid',name:'Northern Compute Grid',x:49,y:20},{id:'west-transit',name:'Western Transit Belt',x:20,y:52},
    {id:'central-core',name:'Civic Core',x:50,y:53},{id:'east-labs',name:'Eastern Research Corridor',x:78,y:49},
    {id:'south-net',name:'Southern Resilience Network',x:48,y:82}
  ];
  class LivingWorld{
    constructor(state,rivals){this.state=state;this.rivals=rivals;this.data=this.ensure()}
    ensure(){const old=this.state.livingWorld||{};const influence=Object.assign({codeopolis:28,nova:18,atlas:18,helix:18,vector:18,orbital:18},old.influence||{});return this.state.livingWorld={version:1,influence,regions:old.regions||{},year:old.year||1,history:old.history||[],lastTick:old.lastTick||Date.now(),competitionTicks:old.competitionTicks||0,projects:old.projects||[]}}
    org(id){return ORGS.find(o=>o.id===id)}
    influence(id){return Math.max(0,Math.round(this.data.influence[id]||0))}
    changeInfluence(id,delta,reason){if(!id)return;this.data.influence[id]=Math.max(0,(this.data.influence[id]||0)+delta);this.log(`${this.org(id)?.name||id} ${delta>=0?'gained':'lost'} ${Math.abs(delta)} influence${reason?` — ${reason}`:''}`);C.events.emit('world:influence',{id,delta,reason,total:this.influence(id)})}
    reputation(id){return this.rivals?.reputation?.(id)||0}
    syncReputation(){for(const o of ORGS.filter(x=>x.id!=='codeopolis')){const rep=this.reputation(o.id);this.data.influence[o.id]=Math.max(this.data.influence[o.id]||0,16+Math.floor(rep/8))}}
    tickCompetition(){this.data.competitionTicks++;if(this.data.competitionTicks%3!==0)return null;const rivals=ORGS.filter(x=>x.id!=='codeopolis'),o=rivals[(this.data.competitionTicks/3-1)%rivals.length];this.changeInfluence(o.id,1,`${o.name} completed independent engineering work`);C.events.emit('world:rival-progress',{org:o,tick:this.data.competitionTicks});return o}
    leader(){return ORGS.slice().sort((a,b)=>this.influence(b.id)-this.influence(a.id))[0]}
    log(text,kind='world'){this.data.history.unshift({at:new Date().toISOString(),year:this.data.year,text,kind});this.data.history=this.data.history.slice(0,100)}
    advanceYear(reason='engineering progress'){this.data.year++;this.log(`Year ${this.data.year} began after ${reason}.`,'year');C.events.emit('world:year',{year:this.data.year,reason})}
    project(id,name,orgId,status='active'){let p=this.data.projects.find(x=>x.id===id);if(!p){p={id,name,orgId,status,startedAt:new Date().toISOString()};this.data.projects.unshift(p)}else p.status=status;return p}
    completeProject(id,reason){const p=this.data.projects.find(x=>x.id===id);if(!p)return;p.status='completed';p.completedAt=new Date().toISOString();this.changeInfluence(p.orgId,6,reason||`${p.name} completed`);C.events.emit('world:project-completed',{project:p})}
    snapshot(){this.syncReputation();return{year:this.data.year,leader:this.leader(),orgs:ORGS.map(o=>({...o,influence:this.influence(o.id),reputation:this.reputation(o.id)})),regions:REGIONS,projects:this.data.projects.slice(0,8),history:this.data.history.slice(0,12)}}
  }
  LivingWorld.ORGS=ORGS;LivingWorld.REGIONS=REGIONS;C.register('LivingWorld',LivingWorld);
})(window.Codeopolis);