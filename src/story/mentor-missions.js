(function(C){
  'use strict';
  const MENTORS={arrays:'maya',hash:'maya',structures:'theo',search:'theo',graphs:'jin',dp:'luna'};
  class MentorMissionSystem{
    constructor(state,economy,characters){this.state=state;this.economy=economy;this.characters=characters;this.data=this.ensure()}
    ensure(){const old=this.state.mentorMissions||{};return this.state.mentorMissions={version:1,active:old.active||null,history:old.history||[],lastGeneratedAt:old.lastGeneratedAt||0}}
    weakest(){return['arrays','hash','structures','search','graphs','dp'].map(id=>({id,score:this.economy.districtScore(id)})).sort((a,b)=>a.score-b.score)[0]}
    chooseChallenge(district){const pool=(typeof CHALLENGES!=='undefined'?CHALLENGES:[]).filter(c=>c.district===district&&(typeof unlocked!=='function'||unlocked(c)));pool.sort((a,b)=>((this.state.solved||[]).includes(a.id)?1:0)-((this.state.solved||[]).includes(b.id)?1:0));return pool[0]||null}
    generate(force=false){if(this.data.active)return this.data.active;const now=Date.now();if(!force&&now-this.data.lastGeneratedAt<10*60*1000)return null;const weak=this.weakest(),challenge=this.chooseChallenge(weak.id);if(!challenge)return null;const mentor=MENTORS[weak.id]||'marcus';const m={id:`mentor-${now}`,mentor,district:weak.id,challengeId:challenge.id,title:`Strengthen ${weak.id} systems`,brief:`${this.characters.character?.(mentor)?.name||'Your mentor'} wants you to reinforce a weak ${weak.id} pattern before it becomes a production risk.`,createdAt:now,rewardMoney:180,rewardResearch:35,status:'active'};this.data.active=m;this.data.lastGeneratedAt=now;C.events.emit('mission:mentor-generated',{mission:m,challenge});return m}
    accept(){const m=this.data.active;if(!m)return false;const c=CHALLENGES.find(x=>x.id===m.challengeId);if(!c)return false;state.current=c.id;persist(false);if(typeof switchTab==='function')switchTab('challenge');C.events.emit('mission:mentor-accepted',{mission:m,challenge:c});return true}
    onMastered(e){const m=this.data.active;if(!m||m.challengeId!==e.challenge?.id)return false;this.state.money=(this.state.money||0)+m.rewardMoney;this.state.research=(this.state.research||0)+m.rewardResearch;this.characters.award?.(m.mentor,10,'mentor mission completed');m.status='completed';m.completedAt=Date.now();this.data.history.unshift(m);this.data.history=this.data.history.slice(0,30);this.data.active=null;C.events.emit('mission:mentor-completed',{mission:m,challenge:e.challenge});return true}
  }
  C.register('MentorMissionSystem',MentorMissionSystem);
})(window.Codeopolis);
