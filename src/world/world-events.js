(function(C){
  'use strict';
  const EVENTS=[
    {id:'cloud-outage',icon:'☁️',title:'Regional Cloud Outage',orgId:'atlas',focus:['structures','graphs'],brief:'A regional compute fabric has lost healthy capacity.'},
    {id:'security-alert',icon:'🚨',title:'Coordinated Security Alert',orgId:'vector',focus:['hash','search'],brief:'Correlated indicators suggest a fast-moving software exposure.'},
    {id:'research-breakthrough',icon:'🧬',title:'Competing AI Breakthrough',orgId:'helix',focus:['dp','arrays'],brief:'Helix announced an optimization result that changes the research race.'},
    {id:'fleet-disruption',icon:'🤖',title:'Autonomous Fleet Disruption',orgId:'nova',focus:['graphs','search'],brief:'A robotics fleet is producing inconsistent route decisions.'},
    {id:'orbital-link',icon:'🛰️',title:'Orbital Link Degradation',orgId:'orbital',focus:['graphs','structures'],brief:'Intermittent links are reducing orbital compute availability.'}
  ];
  class WorldEventSystem{
    constructor(state,economy,world,generator){this.state=state;this.economy=economy;this.world=world;this.generator=generator;this.data=this.ensure()}
    ensure(){const old=this.state.worldEvents||{};return this.state.worldEvents={version:1,active:old.active||null,history:old.history||[],meaningful:old.meaningful||0,lastEventAt:old.lastEventAt||0}}
    maybe(){this.data.meaningful++;if(this.data.active||this.data.meaningful%5!==0)return null;const e=EVENTS[(this.data.meaningful/5-1)%EVENTS.length],org=this.world.org(e.orgId);const mission=this.generator.generate({orgId:e.orgId,orgName:org?.name||e.orgId,focus:e.focus});if(!mission)return null;this.data.active={...e,mission,startedAt:Date.now(),status:'active'};this.data.lastEventAt=Date.now();this.world.log(`${e.title}: ${e.brief}`,'event');this.world.changeInfluence(e.orgId,2,'world event opportunity');C.events.emit('world:event-started',{event:this.data.active});return this.data.active}
    current(){return this.data.active?.status==='active'?this.data.active:null}
    open(){const a=this.current(),id=a?.mission?.challengeId;if(!id)return false;state.current=id;persist(false);if(typeof switchTab==='function')switchTab('challenge');if(typeof render==='function')render();return true}
    onMastered(e){const a=this.current();if(!a||e.challenge?.id!==a.mission?.challengeId)return false;a.status='resolved';a.resolvedAt=Date.now();a.mission.status='completed';const c=e.challenge;const money=220+Math.round((c.money||100)*.6),research=40+Math.round((c.rp||20)*.5);this.state.money=(this.state.money||0)+money;this.state.research=(this.state.research||0)+research;this.world.changeInfluence('codeopolis',3,`${a.title} resolved`);this.world.changeInfluence(a.orgId,2,'collaborative response');this.world.log(`${a.title} resolved through ${c.title}.`,'event');this.data.history.unshift({...a,reward:{money,research}});this.data.history=this.data.history.slice(0,30);this.data.active=null;C.events.emit('world:event-resolved',{event:a,reward:{money,research}});return true}
    defer(){const a=this.current();if(!a)return false;a.status='deferred';a.deferredAt=Date.now();this.data.history.unshift({...a});this.data.active=null;this.world.log(`${a.title} was deferred; no progress was lost.`,'event');C.events.emit('world:event-deferred',{event:a});return true}
  }
  WorldEventSystem.EVENTS=EVENTS;C.register('WorldEventSystem',WorldEventSystem);
})(window.Codeopolis);