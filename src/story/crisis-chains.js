(function(C){
  'use strict';
  const CHAINS={
    graphs:[
      {title:'Transit Aftershock',text:'Restoring connectivity exposed a second problem: route choices now concentrate too much traffic through a few hubs.',mentor:'jin'},
      {title:'Network Review',text:'The transit board wants a resilience review before expansion. Explain what invariants keep the network connected as it grows.',mentor:'maya'}
    ],
    hash:[
      {title:'Cache Policy Review',text:'The stampede is over, but duplicate work exposed a weak caching policy. The commerce team wants a principled retrieval strategy.',mentor:'theo'},
      {title:'Data Locality Briefing',text:'Fast lookup solved the incident. Now decide what should stay hot, what can be recomputed, and what belongs in durable storage.',mentor:'jin'}
    ],
    dp:[
      {title:'Planning Model Audit',text:'The bureau is moving again. Luna wants to know which subproblems are truly independent and where state can be compressed.',mentor:'luna'},
      {title:'Optimization Council',text:'The city council asks whether the optimal local decision is guaranteed to produce the best global plan.',mentor:'maya'}
    ],
    search:[
      {title:'Index Consistency Review',text:'Search is healthy again, but Theo found inconsistent boundary handling across services. Standardize the invariant.',mentor:'theo'}
    ],
    arrays:[
      {title:'Streaming Capacity Review',text:'The pipeline recovered. The next question is how much of the stream must be retained to make each decision.',mentor:'luna'}
    ],
    structures:[
      {title:'Queue Discipline Review',text:'The scheduler is stable. Marcus wants you to explain why the chosen ordering discipline matches the system requirement.',mentor:'marcus'}
    ]
  };
  class CrisisChainSystem{
    constructor(state,narrative,characters){this.state=state;this.narrative=narrative;this.characters=characters;const old=state.crisisChains||{};this.data=state.crisisChains={version:1,progress:old.progress||{},completed:old.completed||[]}}
    onResolved(e){const d=e.crisis?.district;if(!d)return;const steps=CHAINS[d]||[],idx=this.data.progress[d]||0;if(idx>=steps.length)return;const step=steps[idx];this.data.progress[d]=idx+1;if(idx+1>=steps.length&&!this.data.completed.includes(d))this.data.completed.push(d);this.characters.award(step.mentor,8,`${e.crisis.title} follow-up`);this.narrative.push('crisis-chain',step.title,step.text,step.mentor,{district:d,step:idx+1,total:steps.length})}
  }
  C.register('CrisisChainSystem',CrisisChainSystem);
})(window.Codeopolis);
