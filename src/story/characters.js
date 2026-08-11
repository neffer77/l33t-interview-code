(function(C){
  'use strict';
  const CHARACTER_DEFS={
    maya:{id:'maya',name:'Maya Chen',role:'Staff Algorithms Engineer',icon:'🧠',specialties:['graphs','dp'],intro:'I care about whether you can recognize structure, not whether you memorized a trick.'},
    theo:{id:'theo',name:'Theo Brooks',role:'Infrastructure Engineer',icon:'🛠️',specialties:['search','structures'],intro:'Fast code is nice. Predictable code under pressure is better.'},
    luna:{id:'luna',name:'Luna Alvarez',role:'Research Scientist',icon:'🔬',specialties:['dp','arrays'],intro:'Every solution is an experiment. I want to know what you learned from the failed ones.'},
    marcus:{id:'marcus',name:'Marcus Reed',role:'Engineering Manager',icon:'🎙️',specialties:['communication','career'],intro:'A correct solution you cannot explain is still an interview risk.'},
    jin:{id:'jin',name:'Jin Park',role:'Systems Architect',icon:'🏗️',specialties:['graphs','search','systems'],intro:'Think in invariants, interfaces, and failure modes.'},
    ada:{id:'ada',name:'Ada Vale',role:'Founder',icon:'🚀',specialties:['career','strategy'],intro:'Skill creates leverage. Choose what kind of engineer you want that leverage to become.'}
  };

  class CharacterSystem{
    constructor(state){this.state=state;this.data=this.ensure()}
    ensure(){
      const old=this.state.characters||{};
      const rel=old.relationships||{};
      for(const id of Object.keys(CHARACTER_DEFS))rel[id]=Object.assign({xp:0,level:1,lastEvent:null,met:false},rel[id]||{});
      return this.state.characters={version:1,relationships:rel,unlocked:old.unlocked||['maya','theo','marcus'],log:old.log||[]};
    }
    def(id){return CHARACTER_DEFS[id]||null}
    relationship(id){return this.data.relationships[id]}
    levelFromXP(xp){return Math.max(1,1+Math.floor(Math.sqrt(Math.max(0,xp)/25)))}
    award(id,xp,reason){const r=this.relationship(id);if(!r)return;const before=r.level;r.xp+=Math.max(0,xp);r.level=this.levelFromXP(r.xp);r.met=true;r.lastEvent={at:new Date().toISOString(),reason};this.data.log.unshift({id,xp,reason,at:r.lastEvent.at});this.data.log=this.data.log.slice(0,60);C.events.emit('story:relationship',{id,def:this.def(id),xp,reason,level:r.level,leveled:r.level>before})}
    unlock(id,reason='story progression'){if(this.data.unlocked.includes(id))return false;this.data.unlocked.push(id);C.events.emit('story:character-unlocked',{id,def:this.def(id),reason});return true}
    unlocked(){return this.data.unlocked.map(id=>this.def(id)).filter(Boolean)}
    bestForDistrict(d){return this.unlocked().find(c=>c.specialties.includes(d))||this.def('marcus')}
    onMastery(event){const d=event.challenge?.district;const c=this.bestForDistrict(d);if(c)this.award(c.id,event.first?10:5,`${event.challenge.title} mastery`);if((this.state.solved||[]).length>=10)this.unlock('luna','broad algorithm progress');if((this.state.career?.rank||0)>=2)this.unlock('jin','senior career progression');if((this.state.career?.rank||0)>=3)this.unlock('ada','staff-level readiness')}
    onCrisisResolved(crisis){const c=this.bestForDistrict(crisis.district);if(c)this.award(c.id,12,`${crisis.title} resolved`)}
  }

  C.register('CharacterSystem',CharacterSystem);
  C.storyData=C.storyData||{};C.storyData.characters=CHARACTER_DEFS;
})(window.Codeopolis);
