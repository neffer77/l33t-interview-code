(function(C){
  'use strict';
  const SCENARIOS=[
    {id:'timeline',name:'Design a Social Timeline',icon:'📰',goal:'Serve a personalized feed under bursty read load.',components:['API Gateway','Post Service','Timeline Service','Cache','Queue','Database','CDN'],required:['API Gateway','Timeline Service','Cache','Database'],nice:['Queue','CDN'],principles:['cache','fanout','queue','partition']},
    {id:'url-shortener',name:'Design a URL Shortener',icon:'🔗',goal:'Create short links with very high read volume and reliable redirects.',components:['API Gateway','ID Generator','Redirect Service','Cache','Database','Analytics Queue'],required:['API Gateway','ID Generator','Redirect Service','Database'],nice:['Cache','Analytics Queue'],principles:['id','cache','partition','availability']},
    {id:'job-queue',name:'Design a Distributed Job Runner',icon:'⚙️',goal:'Process asynchronous jobs reliably across many workers.',components:['API Gateway','Scheduler','Durable Queue','Worker Pool','Database','Dead Letter Queue','Metrics'],required:['Scheduler','Durable Queue','Worker Pool','Database'],nice:['Dead Letter Queue','Metrics'],principles:['retry','idempotent','queue','backpressure']}
  ];
  class SystemDesignSystem{
    constructor(state,characters){this.state=state;this.characters=characters;this.data=this.ensure()}
    ensure(){const old=this.state.systemDesign||{};return this.state.systemDesign={version:1,completed:old.completed||[],history:old.history||[],active:old.active||null}}
    scenario(id){return SCENARIOS.find(s=>s.id===id)}
    start(id){const s=this.scenario(id);if(!s)return false;this.data.active={id,selected:[],explanation:'',startedAt:Date.now()};C.events.emit('design:started',{scenario:s});return true}
    toggle(component){const a=this.data.active;if(!a)return;const i=a.selected.indexOf(component);if(i>=0)a.selected.splice(i,1);else a.selected.push(component)}
    submit(explanation){const a=this.data.active;if(!a)return null;const s=this.scenario(a.id),selected=new Set(a.selected),text=String(explanation||'').toLowerCase();const requiredHits=s.required.filter(x=>selected.has(x)).length,niceHits=s.nice.filter(x=>selected.has(x)).length,principleHits=s.principles.filter(x=>text.includes(x)).length;const componentScore=Math.round(requiredHits/s.required.length*65+niceHits/Math.max(1,s.nice.length)*10);const reasoningScore=Math.min(25,principleHits*7+Math.min(8,Math.floor(text.split(/\s+/).length/20)));const score=Math.min(100,componentScore+reasoningScore);const record={id:s.id,score,selected:[...a.selected],at:new Date().toISOString()};this.data.history.unshift(record);this.data.history=this.data.history.slice(0,20);if(score>=70&&!this.data.completed.includes(s.id))this.data.completed.push(s.id);if(score>=70){this.state.research=(this.state.research||0)+60;this.characters?.award?.('jin',12,'system design review')}this.data.active=null;C.events.emit('design:finished',{scenario:s,record});return record}
  }
  SystemDesignSystem.SCENARIOS=SCENARIOS;C.register('SystemDesignSystem',SystemDesignSystem);
})(window.Codeopolis);
