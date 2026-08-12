(function(C){
  'use strict';
  const THEMES=[
    {id:'reliability',icon:'🧯',name:'Reliability Week',focus:['graphs','search','structures'],brief:'Stabilize a distributed service under uncertain failure conditions.'},
    {id:'optimization',icon:'⚙️',name:'Optimization Week',focus:['dp','arrays','search'],brief:'Cut latency and repeated work without sacrificing correctness.'},
    {id:'security',icon:'🛡️',name:'Security Response Week',focus:['hash','search','graphs'],brief:'Correlate signals, contain blast radius, and defend remediation design.'},
    {id:'scale',icon:'🌐',name:'Scale Week',focus:['structures','graphs','hash'],brief:'Prepare a service for a dramatic increase in traffic and coordination.'},
    {id:'frontier',icon:'🧬',name:'Frontier Systems Week',focus:['dp','graphs','arrays'],brief:'Combine optimization, distributed reasoning, and architecture under ambiguity.'}
  ];
  const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const isoWeekKey=(date=new Date())=>{const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);const y=d.getUTCFullYear(),start=new Date(Date.UTC(y,0,1)),week=Math.ceil((((d-start)/86400000)+1)/7);return `${y}-W${String(week).padStart(2,'0')}`};
  class EndgameRotation{
    constructor(state,economy,readiness,game){this.state=state;this.economy=economy;this.readiness=readiness;this.game=game;this.data=this.ensure();this.ensureCurrent()}
    ensure(){const old=this.state.endgameRotation||{};return this.state.endgameRotation={version:1,operations:old.operations||{},selectedKey:old.selectedKey||null,history:old.history||[],completedWeeks:old.completedWeeks||[],bestScore:old.bestScore||0}}
    currentKey(){return isoWeekKey()}
    seed(key){return hash(`codeopolis-phase17:${key}`)}
    pool(focus){return (typeof CHALLENGES==='undefined'?[]:CHALLENGES).filter(c=>!String(c.id||'').startsWith('debug-')&&focus.includes(c.district)).slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)))}
    pick(pool,seed,offset=0,exclude=new Set()){if(!pool.length)return null;for(let i=0;i<pool.length;i++){const c=pool[(seed+offset+i)%pool.length];if(!exclude.has(c.id))return c}return pool[0]}
    generate(key=this.currentKey()){
      if(this.data.operations[key])return this.data.operations[key];const seed=this.seed(key),theme=THEMES[seed%THEMES.length],pool=this.pool(theme.focus),used=new Set();
      const first=this.pick(pool,seed,1,used);if(first)used.add(first.id);const second=this.pick(pool,seed,7,used);if(second)used.add(second.id);
      const debugDefs=this.game?.phase9?.debugging?.constructor?.SCENARIOS||[],designDefs=this.game?.phase9?.design?.constructor?.SCENARIOS||[];
      const debug=debugDefs.length?debugDefs[seed%debugDefs.length]:null,design=designDefs.length?designDefs[(seed>>>3)%designDefs.length]:null;
      const stages=[
        first&&{type:'coding',icon:'⚔️',title:'Precision solve',challengeId:first.id,label:first.title,points:20},
        second&&{type:'reasoning',icon:'🎙️',title:'Explain the approach',challengeId:second.id,label:second.title,points:15},
        second&&{type:'coding',icon:'🧠',title:'Implement under scrutiny',challengeId:second.id,label:second.title,points:25},
        debug&&{type:'debug',icon:'🐛',title:'Production repair',scenarioId:debug.id,label:debug.title,points:20},
        design&&{type:'design',icon:'🏗️',title:'Architecture defense',scenarioId:design.id,label:design.name,points:20}
      ].filter(Boolean);
      const op={key,seed,themeId:theme.id,theme:{...theme},brief:theme.brief,stages,stage:0,status:'available',score:0,startedAt:null,completedAt:null,evidence:[],createdAt:new Date().toISOString()};
      this.data.operations[key]=op;if(!this.data.selectedKey)this.data.selectedKey=key;return op
    }
    ensureCurrent(){this.generate(this.currentKey());if(!this.data.selectedKey)this.data.selectedKey=this.currentKey()}
    selected(){return this.generate(this.data.selectedKey||this.currentKey())}
    select(key){if(!this.data.operations[key])return false;this.data.selectedKey=key;return true}
    currentStage(){const op=this.selected();return op?.stages?.[op.stage]||null}
    readinessGate(){const score=this.readiness?.score?.()||0,solved=this.state.solved?.length||0;return{ok:score>=55||solved>=35,score,solved,reason:'Recommended: 55+ readiness or 35 judged solves.'}}
    canLaunchStage(){const op=this.selected(),s=this.currentStage();if(!op||!s||op.status==='completed')return{ok:false,reason:'Operation already complete.'};const gate=this.readinessGate();if(!gate.ok)return gate;if((s.type==='coding'||s.type==='reasoning')&&typeof unlocked==='function'){const c=(typeof CHALLENGES==='undefined'?[]:CHALLENGES).find(x=>x.id===s.challengeId);if(c&&!unlocked(c))return{ok:false,reason:'This seeded challenge is still locked. Continue the Coach path and return later.'}}return{ok:true}}
    start(){const op=this.selected();if(!op||op.status==='completed')return false;const gate=this.readinessGate();if(!gate.ok)return false;if(!op.startedAt)op.startedAt=new Date().toISOString();op.status='active';C.events.emit('endgame:operation-started',{operation:op});return true}
    launch(){const op=this.selected(),s=this.currentStage(),gate=this.canLaunchStage();if(!gate.ok||!s)return gate;if(op.status==='available')this.start();if(s.type==='coding'){if(typeof selectChallenge==='function')selectChallenge(s.challengeId);else this.state.current=s.challengeId;if(typeof switchTab==='function')switchTab('challenge');if(typeof render==='function')render();return{ok:true}}
      if(s.type==='reasoning'){const c=(typeof CHALLENGES==='undefined'?[]:CHALLENGES).find(x=>x.id===s.challengeId);if(c){this.game.phase16?.director?.start?.(c);if(typeof switchTab==='function')switchTab('engineering');this.game.phase9?.ui?.refresh?.();return{ok:true}}}
      if(s.type==='debug'){this.game.phase9?.debugging?.start?.(s.scenarioId);return{ok:true}}
      if(s.type==='design'){this.game.phase9?.design?.start?.(s.scenarioId);if(typeof switchTab==='function')switchTab('engineering');this.game.phase9?.ui?.refresh?.();return{ok:true}}
      return{ok:false,reason:'Stage launcher unavailable.'}}
    completeStage(kind,score=100,meta={}){const op=this.selected(),s=this.currentStage();if(!op||!s||op.status==='completed'||s.type!==kind)return false;const normalized=Math.max(0,Math.min(100,Number(score)||0)),earned=Math.round((s.points||20)*(normalized/100));op.score+=earned;op.evidence.push({stage:op.stage,type:s.type,label:s.label,score:normalized,earned,at:new Date().toISOString(),...meta});op.stage++;C.events.emit('endgame:stage-completed',{operation:op,stage:s,earned,score:normalized});if(op.stage>=op.stages.length)this.finish();return true}
    onMastered(e){const s=this.currentStage();return s?.type==='coding'&&s.challengeId===e.challenge?.id?this.completeStage('coding',100,{challengeId:e.challenge.id}):false}
    onInterviewer(e){const s=this.currentStage(),score=e.record?.score||0;return s?.type==='reasoning'&&s.challengeId===e.challenge?.id&&score>=70?this.completeStage('reasoning',score,{challengeId:e.challenge.id}):false}
    onDebug(e){const s=this.currentStage();return s?.type==='debug'&&s.scenarioId===e.scenario?.id?this.completeStage('debug',100,{scenarioId:e.scenario.id}):false}
    onDesign(e){const s=this.currentStage(),score=e.record?.score||0;return s?.type==='design'&&s.scenarioId===e.scenario?.id&&score>=70?this.completeStage('design',score,{scenarioId:e.scenario.id}):false}
    finish(){const op=this.selected();if(!op||op.status==='completed')return null;op.status='completed';op.completedAt=new Date().toISOString();op.score=Math.max(0,Math.min(100,op.score));this.data.bestScore=Math.max(this.data.bestScore,op.score);if(!this.data.completedWeeks.includes(op.key))this.data.completedWeeks.push(op.key);this.data.history.unshift({key:op.key,themeId:op.themeId,name:op.theme.name,score:op.score,completedAt:op.completedAt});this.data.history=this.data.history.slice(0,52);this.state.money=(this.state.money||0)+500+op.score*5;this.state.research=(this.state.research||0)+80+Math.round(op.score*1.4);this.state.happiness=Math.min(100,(this.state.happiness||75)+5);C.events.emit('endgame:operation-completed',{operation:op});return op}
    archive(){return Object.values(this.data.operations).sort((a,b)=>String(b.key).localeCompare(String(a.key))).slice(0,16)}
  }
  EndgameRotation.THEMES=THEMES;EndgameRotation.isoWeekKey=isoWeekKey;C.register('EndgameRotation',EndgameRotation);
})(window.Codeopolis);
