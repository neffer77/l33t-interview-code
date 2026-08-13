(function(C){'use strict';
const PROJECTS=[
{id:'reliability-platform',title:'Reliability Platform Launch',icon:'🛰️',risks:['incident','review','project'],milestones:[['review','Audit critical paths'],['incident','Prove failure response'],['project','Ship reliability automation']]},
{id:'algorithm-service',title:'Algorithm Service Expansion',icon:'🧠',risks:['mastery','reasoning','design'],milestones:[['mastery','Implement core algorithm'],['reasoning','Defend complexity and invariants'],['design','Design the production service']]},
{id:'developer-platform',title:'Developer Platform Migration',icon:'⚙️',risks:['design','review','project'],milestones:[['design','Design migration architecture'],['review','Review migration surface'],['project','Ship migration tooling']]},
{id:'customer-trust',title:'Customer Trust Recovery',icon:'🛡️',risks:['incident','behavioral','review'],milestones:[['incident','Stabilize production'],['review','Find systemic code risks'],['behavioral','Communicate ownership and recovery']]}
];
const ROLE_MAP={incident:['theo','jin'],review:['theo','jin'],project:['luna','theo','jin'],mastery:['maya','luna'],reasoning:['maya','jin'],design:['jin','ada'],behavioral:['marcus','ada']};
class SquadProjects{
 constructor(game,network){this.game=game;this.network=network;this.key='codeopolis-phase38-squads-v1';this.data=this.load();if(!this.data.active)this.next()}
 load(){try{return Object.assign({active:null,history:[],rotation:0},JSON.parse(localStorage.getItem(this.key)||'{}'))}catch{return{active:null,history:[],rotation:0}}}
 save(){localStorage.setItem(this.key,JSON.stringify(this.data))}
 eligible(signal){const people=this.network.snapshot().filter(p=>p.tier.index>=1&&ROLE_MAP[signal]?.includes(p.id));return people.sort((a,b)=>b.tier.index-a.tier.index||b.xp-a.xp)}
 next(){const template=PROJECTS[this.data.rotation%PROJECTS.length];this.data.rotation++;this.data.active={id:`${template.id}-${Date.now()}`,templateId:template.id,title:template.title,icon:template.icon,risks:template.risks,milestones:template.milestones.map(([type,title])=>({type,title,done:false})),staff:{},startedAt:Date.now(),completedAt:null};this.save();C.events.emit('squad-project:new',{project:this.data.active});return this.data.active}
 assign(signal,npc){const p=this.data.active;if(!p||!ROLE_MAP[signal]?.includes(npc))return false;const allowed=this.eligible(signal).some(x=>x.id===npc);if(!allowed)return false;p.staff[signal]=npc;this.save();C.events.emit('squad-project:staffed',{project:p,signal,npc});return true}
 coverage(){const p=this.data.active;if(!p)return{covered:0,total:0};const covered=p.risks.filter(r=>p.staff[r]).length;return{covered,total:p.risks.length}}
 match(type){const p=this.data.active;if(!p||p.completedAt)return false;const m=p.milestones.find(x=>!x.done&&x.type===type);if(!m)return false;m.done=true;m.doneAt=Date.now();const npc=p.staff[type];if(npc)this.network.award(npc,type,8,{label:`Squad project: ${m.title}`});C.events.emit('squad-project:milestone',{project:p,milestone:m,npc});if(p.milestones.every(x=>x.done)){p.completedAt=Date.now();this.data.history.unshift(JSON.parse(JSON.stringify(p)));this.data.history=this.data.history.slice(0,20);C.events.emit('squad-project:completed',{project:p});setTimeout(()=>this.next(),0)}this.save();return true}
 snapshot(){const p=this.data.active;return{active:p,coverage:this.coverage(),history:this.data.history.slice(0,6),people:this.network.snapshot()}}
}
C.register('SquadProjects',SquadProjects);C.storyData=C.storyData||{};C.storyData.phase38Projects=PROJECTS;})(window.Codeopolis);