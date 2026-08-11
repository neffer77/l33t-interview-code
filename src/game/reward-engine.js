(function(C){
  'use strict';
  const {clamp,hash}=C.util;

  class RewardEngine{
    constructor(gameState,world,audio){this.state=gameState;this.world=world;this.audio=audio;this.meta=this.ensure()}
    ensure(){
      const old=this.state.rewardMeta||{};
      return this.state.rewardMeta={
        version:1,
        momentum:Number.isFinite(old.momentum)?old.momentum:35,
        lastMeaningfulAt:old.lastMeaningfulAt||null,
        celebrations:old.celebrations||0,
        breakthroughs:old.breakthroughs||[],
        totalMeaningfulActions:old.totalMeaningfulActions||0
      };
    }
    decayMomentum(){
      if(!this.meta.lastMeaningfulAt)return this.meta.momentum;
      const days=(Date.now()-new Date(this.meta.lastMeaningfulAt).getTime())/86400000;
      // Momentum bends instead of breaking. Missing a day never resets long-term identity.
      this.meta.momentum=clamp(this.meta.momentum-Math.max(0,days-1)*3,0,100);return this.meta.momentum;
    }
    snapshot(challenge){
      const mastery=this.state.mastery?.[challenge.id]||{};
      return{id:challenge.id,wasSolved:(this.state.solved||[]).includes(challenge.id),money:this.state.money||0,research:this.state.research||0,xp:this.state.xp||0,districtXP:this.state.districtXP?.[challenge.district]||0,history:(this.state.history||[]).length,passes:mastery.passes||0,hints:this.state.hints||0};
    }
    resolve(before,challenge){
      const history=this.state.history||[],latest=history[0];
      const newHistory=history.length>before.history;
      const passed=!!(newHistory&&latest?.id===challenge.id&&latest.passed);
      if(!passed){C.events.emit('learning:attempt',{challenge,passed:false});return null}
      const first=!before.wasSolved&&(this.state.solved||[]).includes(challenge.id),review=!first;
      const difficulty=challenge.diff==='Hard'?3:challenge.diff==='Medium'?2:1;
      this.decayMomentum();this.meta.momentum=clamp(this.meta.momentum+(first?8:5)+difficulty*2,0,100);this.meta.lastMeaningfulAt=new Date().toISOString();this.meta.totalMeaningfulActions++;this.meta.celebrations++;
      let breakthrough=null;
      if(first&&!this.meta.breakthroughs.includes(challenge.id)){
        // Variable reinforcement only follows demonstrated mastery. It never rewards opening the app or waiting.
        const roll=(hash(`${challenge.id}:${this.meta.totalMeaningfulActions}:${this.state.level||1}`)%1000)/1000;
        const chance=.14+difficulty*.055;
        if(roll<chance){
          const researchBonus=15+difficulty*15;this.state.research=(this.state.research||0)+researchBonus;this.state.happiness=Math.min(100,(this.state.happiness||75)+2);this.meta.breakthroughs.push(challenge.id);
          breakthrough={title:`${challenge.pattern} breakthrough`,researchBonus,text:'Your research team extracted a reusable insight from this newly mastered pattern.'};
        }
      }
      const event={
        challenge,first,review,difficulty,
        moneyDelta:(this.state.money||0)-before.money,
        researchDelta:(this.state.research||0)-before.research,
        xpDelta:(this.state.xp||0)-before.xp,
        masteryDelta:(this.state.districtXP?.[challenge.district]||0)-before.districtXP,
        momentum:Math.round(this.meta.momentum),
        breakthrough,
        intensity:clamp(difficulty+(first?1:0),1,4)
      };
      const target=this.world.districtTile(challenge.district);if(target){event.x=target.x;event.y=target.y}
      C.events.emit('learning:mastered',event);C.events.emit('reward:celebration',event);C.events.emit('reward:particles',{x:event.x,y:event.y,kind:breakthrough?'discovery':'reward',count:18+event.intensity*8});
      this.audio?.success(event.intensity);if(breakthrough)setTimeout(()=>this.audio?.discovery(),450);
      return event;
    }
    recordRecall(correct){if(!correct)return;this.decayMomentum();this.meta.momentum=clamp(this.meta.momentum+3,0,100);this.meta.lastMeaningfulAt=new Date().toISOString();this.meta.totalMeaningfulActions++;C.events.emit('reward:micro',{label:'Recall strengthened',momentum:Math.round(this.meta.momentum)})}
  }
  C.register('RewardEngine',RewardEngine);
})(window.Codeopolis);
