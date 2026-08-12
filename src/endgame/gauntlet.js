(function(C){
  'use strict';
  const DIFF={Easy:1,Medium:2,Hard:3};
  class FrontierGauntlet{
    constructor(state,economy,readiness){this.state=state;this.economy=economy;this.readiness=readiness;this.data=this.ensure()}
    ensure(){const old=this.state.frontierGauntlet||{};return this.state.frontierGauntlet={version:1,runCounter:old.runCounter||0,active:old.active||null,history:old.history||[],bestScore:old.bestScore||0,completed:old.completed||0}}
    eligible(){const r=this.readiness?.score?.()||0,solved=this.state.solved?.length||0;return{ok:r>=65||solved>=45,readiness:r,solved,reason:'Recommended: 65+ readiness or 45 judged solves.'}}
    pool(){return (typeof CHALLENGES==='undefined'?[]:CHALLENGES).filter(c=>!String(c.id||'').startsWith('debug-')&&(typeof unlocked!=='function'||unlocked(c)))}
    choose(){
      const pool=this.pool(),by={};for(const c of pool)(by[c.district]||=[]).push(c);const districts=(this.readiness?.districts?.()||[]).map(x=>x.id).filter(id=>by[id]?.length);const out=[];
      for(let i=0;i<districts.length&&out.length<3;i++){const id=districts[(i+this.data.runCounter)%districts.length],items=by[id].slice().sort((a,b)=>{const unsolvedA=(this.state.solved||[]).includes(a.id)?0:1,unsolvedB=(this.state.solved||[]).includes(b.id)?0:1;if(unsolvedA!==unsolvedB)return unsolvedB-unsolvedA;const d=(DIFF[b.diff]||2)-(DIFF[a.diff]||2);if(d)return d;return this.economy.challengeStrength(a)-this.economy.challengeStrength(b)});const pick=items[(this.data.runCounter+i)%Math.max(1,Math.min(items.length,3))]||items[0];if(pick)out.push(pick)}
      if(out.length<3){for(const c of pool)if(!out.some(x=>x.id===c.id)&&!out.some(x=>x.district===c.district)){out.push(c);if(out.length===3)break}}
      return out
    }
    start(){const gate=this.eligible();if(!gate.ok)return gate;if(this.data.active?.status==='active')return{ok:true,run:this.data.active};const chosen=this.choose();if(chosen.length<3)return{ok:false,reason:'Not enough distinct unlocked challenge districts yet.'};this.data.runCounter++;this.data.active={id:`gauntlet-${Date.now()}`,status:'active',challengeIds:chosen.map(c=>c.id),passed:{},index:0,score:0,startedAt:new Date().toISOString(),events:[]};C.events.emit('endgame:gauntlet-started',{run:this.data.active,challenges:chosen});return{ok:true,run:this.data.active}}
    current(){const a=this.data.active;return a?.status==='active'?a:null}
    currentChallenge(){const a=this.current();if(!a)return null;const id=a.challengeIds[a.index];return (typeof CHALLENGES==='undefined'?[]:CHALLENGES).find(c=>c.id===id)||null}
    openCurrent(){let a=this.current();if(!a){const s=this.start();if(!s.ok)return s;a=s.run}const c=this.currentChallenge();if(!c)return{ok:false,reason:'No active gauntlet challenge.'};if(typeof selectChallenge==='function')selectChallenge(c.id);else this.state.current=c.id;if(typeof switchTab==='function')switchTab('challenge');if(typeof render==='function')render();return{ok:true,challenge:c}}
    onMastered(e){const a=this.current(),c=this.currentChallenge();if(!a||!c||e.challenge?.id!==c.id)return false;if(a.passed[c.id])return false;a.passed[c.id]=true;const difficulty=DIFF[c.diff]||2,points=25+(difficulty-1)*5;a.score+=points;a.events.push({challengeId:c.id,title:c.title,district:c.district,diff:c.diff||'Medium',points,at:new Date().toISOString()});a.index++;C.events.emit('endgame:gauntlet-stage',{run:a,challenge:c,points});if(a.index>=a.challengeIds.length)this.finish();return true}
    finish(){const a=this.current();if(!a)return null;a.status='completed';a.completedAt=new Date().toISOString();a.score=Math.min(100,a.score+10);a.elapsedMinutes=Math.max(1,Math.round((new Date(a.completedAt)-new Date(a.startedAt))/60000));this.data.bestScore=Math.max(this.data.bestScore,a.score);this.data.completed++;this.data.history.unshift({...a});this.data.history=this.data.history.slice(0,30);this.data.active=null;this.state.money=(this.state.money||0)+350+a.score*3;this.state.research=(this.state.research||0)+60+a.score;C.events.emit('endgame:gauntlet-completed',{run:a});return a}
    abandon(){const a=this.current();if(!a)return false;a.status='abandoned';a.completedAt=new Date().toISOString();this.data.history.unshift({...a});this.data.history=this.data.history.slice(0,30);this.data.active=null;C.events.emit('endgame:gauntlet-abandoned',{run:a});return true}
  }
  C.register('FrontierGauntlet',FrontierGauntlet);
})(window.Codeopolis);
