(function(C){'use strict';
const ARC_TEMPLATES={
 research:{id:'frontier-discovery',title:'The Frontier Discovery Program',icon:'🧪',chapters:[['Decode the anomaly','challenge'],['Defend the model','reasoning'],['Ship the prototype','project'],['Present the breakthrough','interview']]},
 resilience:{id:'grid-under-siege',title:'The Grid Under Siege',icon:'🛡️',chapters:[['Trace the fault','debug'],['Review the risky patch','review'],['Stabilize production','incident'],['Harden the district','project']]},
 automation:{id:'autonomous-expansion',title:'The Autonomous Expansion',icon:'⚙️',chapters:[['Optimize the core','challenge'],['Review the automation','review'],['Build the control plane','project'],['Scale the architecture','design']]},
 commons:{id:'civic-compact',title:'The Civic Compact',icon:'🏛️',chapters:[['Explain the tradeoff','reasoning'],['Resolve the public incident','incident'],['Lead the decision','behavioral'],['Defend the city plan','interview']]}
};
class Phase35Campaigns{
 constructor(game,city,crises,legacy){this.game=game;this.city=city;this.crises=crises;this.legacy=legacy;this.key='codeopolis-phase35-campaigns-v1';this.data=this.load();this.ensureCampaign()}
 load(){try{return Object.assign({active:null,history:[],chapterEvidence:{}},JSON.parse(localStorage.getItem(this.key)||'{}'))}catch{return{active:null,history:[],chapterEvidence:{}}}}
 save(){localStorage.setItem(this.key,JSON.stringify(this.data))}
 weakestDistrict(){const d=this.city?.snapshot?.().districts||{};return Object.entries(d).sort((a,b)=>a[1]-b[1])[0]?.[0]||'knowledge'}
 chooseTemplate(){const path=this.city?.snapshot?.().pathId||'research';return ARC_TEMPLATES[path]||ARC_TEMPLATES.research}
 ensureCampaign(){if(this.data.active)return this.data.active;const t=this.chooseTemplate(),weak=this.weakestDistrict(),health=this.crises?.health?.()||{};this.data.active={id:`${t.id}-${Date.now()}`,templateId:t.id,title:t.title,icon:t.icon,chapter:0,startedAt:Date.now(),weakDistrict:weak,context:{health,era:this.legacy?.snapshot?.().era?.name||'Settlement'},chapters:t.chapters.map(([title,type],i)=>({id:`c${i+1}`,title,type,complete:false,score:null}))};this.save();C.events.emit('campaign:started',{campaign:this.data.active});return this.data.active}
 current(){return this.data.active?.chapters?.[this.data.active.chapter]||null}
 matchEvent(type,e){const c=this.current();if(!c||c.type!==type)return false;const score=Number(e?.score??e?.result?.score??e?.day?.summary?.overall??100);c.complete=true;c.score=Number.isFinite(score)?score:null;c.completedAt=Date.now();this.data.chapterEvidence[c.id]={at:Date.now(),type,score:c.score};this.data.active.chapter++;if(this.data.active.chapter>=this.data.active.chapters.length)this.finish();this.save();C.events.emit('campaign:progress',{campaign:this.data.active,chapter:c});return true}
 finish(){const completed={...this.data.active,finishedAt:Date.now()};this.data.history.unshift(completed);this.data.history=this.data.history.slice(0,10);this.data.active=null;this.save();C.events.emit('campaign:completed',{campaign:completed})}
 nextCampaign(){if(this.data.active)return false;this.ensureCampaign();return true}
 snapshot(){const active=this.ensureCampaign();return{active,history:this.data.history.slice(0,5),current:this.current(),progress:active?Math.round((active.chapter/active.chapters.length)*100):100}}
 static get TEMPLATES(){return ARC_TEMPLATES}
}
C.register('Phase35Campaigns',Phase35Campaigns);})(window.Codeopolis);