(function(C){
  'use strict';
  const COMMUNICATION_PROMPTS=[
    {q:'Before coding, what should you communicate first?',options:['Exact syntax','Your approach, invariant, and assumptions','That you have seen the problem','The final complexity only'],score:[0,2,0,1]},
    {q:'A visible test fails on an edge case. What is the strongest interview response?',options:['Patch the expected output','Explain the violated assumption, then revise','Start over silently','Ask for a different question'],score:[0,2,0,0]},
    {q:'Your solution passes. The interviewer asks for tradeoffs. What should you discuss?',options:['Only runtime','Time, space, alternatives, and input constraints','Your typing speed','Whether Python is your favorite language'],score:[1,2,0,0]},
    {q:'You are unsure which of two approaches to use. What is best?',options:['Choose randomly','Compare constraints and tradeoffs out loud','Wait silently','Implement both fully'],score:[0,2,0,0]},
    {q:'What makes a complexity claim convincing?',options:['Saying Big-O confidently','Connecting operations to input growth','Using the fastest-looking syntax','Avoiding follow-up questions'],score:[0,2,0,0]}
  ];
  class InterviewEncounterSystem{
    constructor(state,recruiting,characters){this.state=state;this.recruiting=recruiting;this.characters=characters;this.pendingPrompt=null}
    active(){return this.recruiting.current()}
    company(){const a=this.active();return a?this.recruiting.company(a.companyId):null}
    currentProblem(){const a=this.active();if(!a)return null;const id=a.problemIds[a.round];return (typeof CHALLENGES!=='undefined'?CHALLENGES:[]).find(c=>c.id===id)||null}
    openCurrentProblem(){const c=this.currentProblem();if(!c)return;if(typeof selectChallenge==='function')selectChallenge(c.id);if(typeof switchTab==='function')switchTab('challenge');C.events.emit('story:interview-round',{company:this.company(),challenge:c,round:this.active().round})}
    onMastered(e){const a=this.active();if(!a||a.problemIds[a.round]!==e.challenge?.id)return;this.recruiting.markPass(e.challenge);this.pendingPrompt=this.promptFor(a.round,e.challenge.id);C.events.emit('story:communication-prompt',{company:this.company(),challenge:e.challenge,prompt:this.pendingPrompt,round:a.round})}
    promptFor(round,id){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return COMMUNICATION_PROMPTS[(h+round)%COMMUNICATION_PROMPTS.length]}
    answer(index){const p=this.pendingPrompt,a=this.active();if(!p||!a)return;const score=p.score[Number(index)]||0;this.pendingPrompt=null;this.characters.award('marcus',score===2?7:2,'interview communication practice');this.recruiting.answerCommunication(score);const next=this.active();if(next){setTimeout(()=>this.openCurrentProblem(),250)}C.events.emit('story:communication-answered',{score,correct:score===2})}
    skipRound(){const a=this.active();if(!a)return;a.communication[a.round]=0;a.round++;if(a.round>=a.problemIds.length)this.recruiting.finish();else this.openCurrentProblem()}
  }
  C.register('InterviewEncounterSystem',InterviewEncounterSystem);
})(window.Codeopolis);
