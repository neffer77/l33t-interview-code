(function(C){
  'use strict';
  const DISCOVERIES=[
    {id:'fast-retrieval',icon:'⚡',name:'Fast Retrieval Systems',clue:'Master multiple lookup and ordered-search techniques.',description:'Hashing and ordered search combine into city-scale information retrieval.',reward:35,check:(s,e)=>e.districtScore('hash')>=38&&e.districtScore('search')>=30},
    {id:'algorithmic-industry',icon:'🏭',name:'Algorithmic Industry',clue:'Demonstrate durable mastery of array transformations and contiguous-state reasoning.',description:'Array, window, pointer, and interval thinking become industrial planning tools.',reward:35,check:(s,e)=>e.districtScore('arrays')>=42},
    {id:'graph-theory',icon:'🕸️',name:'Network Science',clue:'Prove that connectivity and traversal are more than isolated tricks.',description:'Your engineers formalize connectivity, traversal, dependency, and routing as one field.',reward:45,check:(s,e)=>e.districtScore('graphs')>=42},
    {id:'dynamic-planning',icon:'🧠',name:'Dynamic Planning',clue:'Build reliable solutions from repeated subproblems.',description:'Optimization becomes a reusable civic planning discipline rather than a single algorithm.',reward:50,check:(s,e)=>e.districtScore('dp')>=46},
    {id:'structured-computation',icon:'🌳',name:'Structured Computation',clue:'Master enough stacks, lists, trees, heaps, or tries to see their common structure.',description:'The city recognizes data structures as programmable infrastructure.',reward:45,check:(s,e)=>e.districtScore('structures')>=45},
    {id:'systems-science',icon:'🔬',name:'Systems Science',clue:'Build competence across several independent algorithm districts.',description:'Researchers discover that city-scale computing is about tradeoffs between interacting subsystems.',reward:80,check:(s,e)=>e.breadthCount(38)>=4},
    {id:'resilient-infrastructure',icon:'🛡️',name:'Resilient Infrastructure',clue:'Combine network knowledge, search discipline, and a genuinely connected city.',description:'Your civilization learns to route around failures instead of merely recovering from them.',reward:65,check:(s,e)=>s.discoveryMeta?.unlocked?.includes('graph-theory')&&s.discoveryMeta?.unlocked?.includes('fast-retrieval')&&(s.world?.stats?.roadsBuilt||0)>=10},
    {id:'optimization-science',icon:'🧬',name:'Optimization Science',clue:'Combine dynamic planning with strong linear/array reasoning.',description:'Researchers can now reason about globally efficient choices under resource constraints.',reward:70,check:(s,e)=>s.discoveryMeta?.unlocked?.includes('dynamic-planning')&&e.districtScore('dp')>=62&&e.districtScore('arrays')>=45},
    {id:'autonomous-networks',icon:'🛰️',name:'Autonomous Networks',clue:'Push graph mastery far enough that routing decisions can be delegated to the infrastructure itself.',description:'Transit and communications networks can now adapt to changing conditions automatically.',reward:85,check:(s,e)=>s.discoveryMeta?.unlocked?.includes('resilient-infrastructure')&&e.districtScore('graphs')>=65&&e.districtScore('search')>=42},
    {id:'computational-frontier',icon:'✨',name:'Computational Frontier',clue:'Reach broad durable mastery and prove yourself beyond the entry-level career track.',description:'The civilization is ready to pursue technologies that require coordinated mastery across the entire computing stack.',reward:120,check:(s,e)=>s.discoveryMeta?.unlocked?.includes('systems-science')&&e.breadthCount(52)>=4&&(s.career?.rank||0)>=2}
  ];

  class DiscoverySystem{
    constructor(gameState,economy,audio){this.state=gameState;this.economy=economy;this.audio=audio;this.meta=this.ensure();this.queue=[]}
    ensure(){const old=this.state.discoveryMeta||{};return this.state.discoveryMeta={version:1,unlocked:old.unlocked||[],unlockedAt:old.unlockedAt||{},seen:old.seen||[]}}
    defs(){return DISCOVERIES}
    get(id){return DISCOVERIES.find(d=>d.id===id)||null}
    unlocked(id){return this.meta.unlocked.includes(id)}
    evaluate({silent=false}={}){
      const unlocked=[];
      for(const d of DISCOVERIES){
        if(this.unlocked(d.id))continue;
        let ok=false;try{ok=!!d.check(this.state,this.economy)}catch{}
        if(!ok)continue;
        this.meta.unlocked.push(d.id);this.meta.unlockedAt[d.id]=new Date().toISOString();this.state.research=(this.state.research||0)+d.reward;unlocked.push(d);
        const payload={definition:d,researchBonus:d.reward,silent};C.events.emit('discovery:unlocked',payload);if(!silent)this.audio?.discovery?.();
      }
      return unlocked;
    }
    markSeen(id){if(!this.meta.seen.includes(id))this.meta.seen.push(id)}
    progressHint(d){
      if(this.unlocked(d.id))return'Unlocked';
      const scores=['arrays','hash','structures','search','graphs','dp'].map(x=>({id:x,score:this.economy.districtScore(x)})).sort((a,b)=>b.score-a.score);
      return `Strongest current field: ${DISTRICTS[scores[0].id]?.name||scores[0].id} ${scores[0].score}`;
    }
  }
  DiscoverySystem.DEFINITIONS=DISCOVERIES;
  C.register('DiscoverySystem',DiscoverySystem);
})(window.Codeopolis);
