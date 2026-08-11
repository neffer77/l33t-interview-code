(function(C){
  'use strict';
  const {hash}=C.util;
  const CRISES=[
    {id:'cache-stampede',district:'hash',icon:'🧺',title:'Cache Stampede',effect:'money',text:'Duplicate lookups are overwhelming the commerce network. The city needs a retrieval strategy that scales.',rewardMoney:260,rewardResearch:35},
    {id:'pipeline-congestion',district:'arrays',icon:'🏭',title:'Data Pipeline Congestion',effect:'money',text:'A production pipeline is repeatedly scanning the same stream. Find the right linear or windowed approach.',rewardMoney:280,rewardResearch:35},
    {id:'scheduler-overload',district:'structures',icon:'📚',title:'Scheduler Overload',effect:'research',text:'Work queues are backing up across the Stack Quarter. Restore predictable state handling.',rewardMoney:240,rewardResearch:45},
    {id:'index-outage',district:'search',icon:'🔭',title:'Search Index Outage',effect:'research',text:'The city index is answering requests too slowly. Re-establish ordered reasoning and bounded search.',rewardMoney:250,rewardResearch:45},
    {id:'transit-partition',district:'graphs',icon:'🚇',title:'Transit Network Partition',effect:'money',text:'Several districts have become disconnected from the transit backbone. Map the network and restore connectivity.',rewardMoney:340,rewardResearch:55},
    {id:'planning-deadlock',district:'dp',icon:'🧠',title:'Planning Deadlock',effect:'research',text:'The planning bureau keeps recomputing the same expensive decisions. Reuse subproblem knowledge to unblock the city.',rewardMoney:300,rewardResearch:65}
  ];

  class CrisisSystem{
    constructor(gameState,economy,world,audio){this.state=gameState;this.economy=economy;this.world=world;this.audio=audio;this.meta=this.ensure()}
    ensure(){const old=this.state.crisisMeta||{};return this.state.crisisMeta={version:1,active:old.active||null,resolved:old.resolved||[],lastTriggeredAt:old.lastTriggeredAt||null,mitigated:old.mitigated||0}}
    weakestDistrict(){return['hash','arrays','structures','search','graphs','dp'].map(id=>({id,score:this.economy.districtScore(id)})).sort((a,b)=>a.score-b.score)[0]?.id||'arrays'}
    candidateChallenge(district){
      if(typeof CHALLENGES==='undefined')return null;
      const pool=CHALLENGES.filter(c=>c.district===district&&(typeof unlocked!=='function'||unlocked(c)));
      pool.sort((a,b)=>this.economy.challengeStrength(a)-this.economy.challengeStrength(b)||(this.state.solved||[]).includes(a.id)-(this.state.solved||[]).includes(b.id));
      return pool[0]||null;
    }
    maybeTrigger(masteredEvent){
      if(this.meta.active)return null;
      const meaningful=this.state.rewardMeta?.totalMeaningfulActions||0;if(meaningful<5)return null;
      if(this.meta.lastTriggeredAt&&Date.now()-new Date(this.meta.lastTriggeredAt).getTime()<20*60*1000)return null;
      const roll=hash(`${meaningful}:${masteredEvent?.challenge?.id||'x'}:${this.state.level||1}`)%100;if(roll>=27)return null;
      const district=this.weakestDistrict(),def=CRISES.find(c=>c.district===district)||CRISES[0],challenge=this.candidateChallenge(district);if(!challenge)return null;
      const active={id:`${def.id}-${Date.now()}`,type:def.id,district:def.district,title:def.title,icon:def.icon,text:def.text,effect:def.effect,challengeId:challenge.id,createdAt:new Date().toISOString(),rewardMoney:def.rewardMoney,rewardResearch:def.rewardResearch};
      this.meta.active=active;this.meta.lastTriggeredAt=active.createdAt;C.events.emit('crisis:triggered',{crisis:active,challenge});
      const target=this.world.districtTile(district);if(target)C.events.emit('reward:particles',{x:target.x,y:target.y,kind:'crisis',count:32});this.audio?.alert?.();return active;
    }
    respond(){const a=this.meta.active;if(!a)return false;const c=CHALLENGES.find(x=>x.id===a.challengeId);if(!c)return false;state.current=c.id;persist(false);if(typeof switchTab==='function')switchTab('challenge');C.events.emit('crisis:responding',{crisis:a,challenge:c});return true}
    onMastered(e){const a=this.meta.active;if(!a||e.challenge.id!==a.challengeId)return false;this.state.money=(this.state.money||0)+a.rewardMoney;this.state.research=(this.state.research||0)+a.rewardResearch;this.state.happiness=Math.min(100,(this.state.happiness||75)+4);const record=Object.assign({},a,{resolvedAt:new Date().toISOString(),method:'mastery'});this.meta.resolved.unshift(record);this.meta.resolved=this.meta.resolved.slice(0,20);this.meta.active=null;C.events.emit('crisis:resolved',{crisis:record,challenge:e.challenge});const target=this.world.districtTile(a.district);if(target)C.events.emit('reward:particles',{x:target.x,y:target.y,kind:'discovery',count:46});this.audio?.success?.(3);return true}
    mitigationCost(){const resilience=this.economy.modifiers().resilience;return Math.max(80,Math.round(240*(1-resilience)))}
    mitigate(){const a=this.meta.active;if(!a)return{ok:false,reason:'No active crisis'};const cost=this.mitigationCost();if((this.state.money||0)<cost)return{ok:false,reason:`Need ${cost} credits`};this.state.money-=cost;this.state.happiness=Math.max(25,(this.state.happiness||75)-2);this.meta.mitigated++;this.meta.resolved.unshift(Object.assign({},a,{resolvedAt:new Date().toISOString(),method:'mitigation'}));this.meta.active=null;C.events.emit('crisis:mitigated',{crisis:a,cost});return{ok:true,cost}}
    activeChallenge(){const a=this.meta.active;return a?CHALLENGES.find(c=>c.id===a.challengeId)||null:null}
  }
  CrisisSystem.DEFINITIONS=CRISES;
  C.register('CrisisSystem',CrisisSystem);
})(window.Codeopolis);
