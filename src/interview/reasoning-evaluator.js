(function(C){
  'use strict';
  const RUBRICS={
    approach:{label:'Approach',terms:['approach','use','maintain','track','iterate','traverse','search','store','window','stack','queue','heap','map','set','dp','dfs','bfs']},
    assumptions:{label:'Assumptions',terms:['assume','input','constraint','sorted','duplicate','empty','null','negative','size']},
    invariant:{label:'Invariant',terms:['invariant','always','maintain','valid','window','visited','minimum','maximum','prefix','state']},
    edgeCases:{label:'Edge cases',terms:['edge','empty','single','duplicate','overflow','cycle','none','null','negative','boundary']},
    complexity:{label:'Complexity',terms:['o(','time','space','complexity','linear','log','quadratic','memory']},
    tradeoffs:{label:'Tradeoffs',terms:['tradeoff','trade-off','alternative','memory','space','faster','slower','instead','versus','vs']}
  };
  class ReasoningEvaluator{
    normalize(text){return String(text||'').toLowerCase().replace(/\s+/g,' ').trim()}
    evaluate(text,challenge){
      const t=this.normalize(text),scores={},missing=[];let total=0;
      for(const [id,r] of Object.entries(RUBRICS)){
        const hits=r.terms.reduce((n,term)=>n+(t.includes(term)?1:0),0);const score=Math.min(2,hits);scores[id]=score;total+=score;if(score===0)missing.push(id);
      }
      const pattern=String(challenge?.pattern||'').toLowerCase();const patternMention=pattern&&t.includes(pattern.split('/')[0].trim().split(' ')[0]);if(patternMention){scores.approach=Math.min(2,scores.approach+1);total++}
      const length=Math.min(2,Math.floor(t.split(' ').filter(Boolean).length/28));total+=length;
      return{score:Math.min(100,Math.round(total/(Object.keys(RUBRICS).length*2+2)*100)),scores,missing,wordCount:t?t.split(' ').length:0,patternMention,feedback:this.feedback(scores,missing)};
    }
    feedback(scores,missing){
      if(!missing.length)return'Clear reasoning: you covered approach, assumptions, invariants, edge cases, complexity, and tradeoffs.';
      const names=missing.map(id=>RUBRICS[id].label.toLowerCase());return`Strengthen this explanation by explicitly covering ${names.join(', ')}.`;
    }
    followUp(result,challenge){
      const first=result?.missing?.[0];const prompts={
        approach:`Why is ${challenge?.pattern||'this approach'} a better fit than the most obvious brute-force alternative?`,
        assumptions:'What assumptions are you making about the input, and which one would break your solution?',
        invariant:'What must remain true after every iteration or recursive call?',
        edgeCases:'Name two boundary cases you would test before submitting.',
        complexity:'Walk me through the time and space complexity and what drives each term.',
        tradeoffs:'What alternative approach would you consider if memory became the limiting constraint?'
      };return prompts[first]||'What would you change if the input became 100× larger?';
    }
  }
  C.register('ReasoningEvaluator',ReasoningEvaluator);
})(window.Codeopolis);
