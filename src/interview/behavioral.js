(function(C){
  'use strict';
  const QUESTIONS=[
    'Tell me about a time you had to debug a high-impact production issue under uncertainty.',
    'Describe a technical disagreement where you changed someone’s mind—or changed your own.',
    'Tell me about a project where the initial design failed and what you did next.',
    'Describe a time you improved a system beyond the immediate ticket or task.',
    'Tell me about a mistake you made and how your behavior changed afterward.'
  ];
  class BehavioralSystem{
    constructor(state,characters){this.state=state;this.characters=characters;this.data=this.ensure();this.activeQuestion=null}
    ensure(){const old=this.state.behavioral||{};return this.state.behavioral={version:1,history:old.history||[],best:old.best||0}}
    start(index){this.activeQuestion=QUESTIONS[index%QUESTIONS.length];return this.activeQuestion}
    evaluate(text){const t=String(text||'').toLowerCase(),words=t.split(/\s+/).filter(Boolean).length;const dimensions={
      situation:['situation','context','when','team','project'].some(x=>t.includes(x)),
      task:['responsible','goal','needed','task','owner'].some(x=>t.includes(x)),
      action:['i did','i built','i changed','i investigated','i decided','i proposed','i implemented'].some(x=>t.includes(x)),
      result:['result','improved','reduced','increased','saved','resolved','shipped'].some(x=>t.includes(x)),
      evidence:/\d|percent|%|ms|seconds|minutes|hours|users|requests/.test(t),
      reflection:['learned','next time','afterward','would','reflection'].some(x=>t.includes(x))
    };const hit=Object.values(dimensions).filter(Boolean).length;const score=Math.min(100,Math.round(hit/6*85+Math.min(15,words/4)));const feedback=[];if(!dimensions.action)feedback.push('make your personal actions explicit');if(!dimensions.result)feedback.push('state the outcome');if(!dimensions.evidence)feedback.push('quantify impact where possible');if(!dimensions.reflection)feedback.push('add what you learned');const rec={question:this.activeQuestion||QUESTIONS[0],score,dimensions,at:new Date().toISOString()};this.data.history.unshift(rec);this.data.history=this.data.history.slice(0,20);this.data.best=Math.max(this.data.best,score);if(score>=75)this.characters?.award?.('marcus',8,'behavioral interview practice');this.activeQuestion=null;return{record:rec,feedback:feedback.length?`Improve it by: ${feedback.join('; ')}.`:'Strong STAR-style answer with ownership, evidence, and reflection.'}}
  }
  BehavioralSystem.QUESTIONS=QUESTIONS;C.register('BehavioralSystem',BehavioralSystem);
})(window.Codeopolis);
