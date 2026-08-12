(function(C){
  'use strict';
  const STYLES={
    collaborative:{name:'Collaborative',icon:'🤝',tone:'Supportive interviewer who asks one clear question at a time.'},
    structured:{name:'Structured',icon:'📋',tone:'Standard technical interviewer focused on assumptions, invariant, complexity, and tests.'},
    probing:{name:'Probing',icon:'🔎',tone:'Senior interviewer who challenges edge cases, tradeoffs, and scaling.'},
    adversarial:{name:'Principal-level',icon:'🧠',tone:'Principal-level interviewer who expects concise reasoning, alternative designs, and production implications.'}
  };
  class InterviewDirector{
    constructor(state,readiness,game){this.state=state;this.readiness=readiness;this.game=game;this.data=this.ensure()}
    ensure(){const old=this.state.interviewDirector||{};return this.state.interviewDirector={version:1,styleOverride:old.styleOverride||null,history:old.history||[]}}
    style(){if(STYLES[this.data.styleOverride])return this.data.styleOverride;const s=this.readiness.score();return s>=82?'adversarial':s>=67?'probing':s>=45?'structured':'collaborative'}
    setStyle(id){this.data.styleOverride=STYLES[id]?id:null;return this.style()}
    careerLens(){const p=this.game?.phase13?.paths?.path?.();if(!p)return'general software engineering';return`${p.name} (${(p.focus||[]).join(', ')})`}
    brief(challenge){const style=STYLES[this.style()],weak=this.readiness.gaps()[0],district=challenge?.district||'general';return{style:this.style(),styleName:style.name,challengeId:challenge?.id,headline:`${style.icon} ${style.name} interview`,prompt:`You are interviewing for ${this.careerLens()}. Before coding ${challenge?.title||'this problem'}, state assumptions, derive the core invariant, identify edge cases, and give target time/space complexity. I will especially probe ${weak.label.toLowerCase()} because current evidence is ${weak.score}/100. Treat ${district} correctness as authoritative only after the real hidden-test judge passes.`,why:`Difficulty adapts from readiness ${this.readiness.score()}/100; grading remains unchanged.`}}
    start(challenge){const interviewer=this.game?.phase9?.interviewer;if(!interviewer||!challenge)return null;const session=interviewer.start(challenge),brief=this.brief(challenge);session.prompt=brief.prompt;session.director={style:brief.style,readiness:this.readiness.score(),career:this.careerLens()};this.data.history.unshift({at:new Date().toISOString(),challengeId:challenge.id,style:brief.style,readiness:this.readiness.score()});this.data.history=this.data.history.slice(0,40);C.events.emit('coach:interview-started',{challenge,brief,session});return session}
    profile(){const id=this.style();return{id,...STYLES[id],readiness:this.readiness.score(),career:this.careerLens()}}
  }
  InterviewDirector.STYLES=STYLES;C.register('InterviewDirector',InterviewDirector);
})(window.Codeopolis);
