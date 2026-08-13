(function(C){
  'use strict';
  const DISTRICTS=['arrays','hash','structures','search','graphs','dp'];
  const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));
  const avg=(xs,fallback=0)=>xs.length?xs.reduce((s,x)=>s+(Number(x)||0),0)/xs.length:fallback;
  class ReadinessModel{
    constructor(state,economy,game){this.state=state;this.economy=economy;this.game=game}
    recent(list,n=5){return (list||[]).slice(0,n)}
    components(){
      const solved=this.state.solved?.length||0,coverage=clamp(solved/50*100),knowledge=this.economy.knowledgeIndex();
      const breadth=clamp(this.economy.breadthCount(45)/DISTRICTS.length*100);
      const mocks=this.recent(this.state.mock?.history,5),mock=clamp(avg(mocks.map(x=>x.score),Math.min(knowledge,45)));
      const reasoningHistory=this.recent(this.state.aiInterview?.sessions,8),reasoning=clamp(avg(reasoningHistory.map(x=>x.score),this.state.aiInterview?.bestReasoning||Math.min(knowledge,45)));
      const design=this.recent(this.state.systemDesign?.history,8),designScore=clamp(avg(design.map(x=>x.score),Math.min(knowledge*.75,45)));
      const incidents=this.recent(this.state.engineeringIncidents?.history,8),incidentScore=clamp(avg(incidents.map(x=>x.score),0));
      const debugDefs=this.game?.phase9?.debugging?.constructor?.SCENARIOS||[],debugDone=this.state.debugging?.completed?.length||0,debugScore=debugDefs.length?clamp(debugDone/debugDefs.length*100):0;
      const production=clamp(incidentScore*.65+debugScore*.35);
      const behavioral=clamp(this.state.behavioral?.best||0);
      const coding=clamp(knowledge*.72+coverage*.28);
      const systems=clamp(designScore*.7+incidentScore*.3);
      return{coding,mock,reasoning,systems,production,behavioral,breadth,knowledge,coverage};
    }
    score(){const c=this.components(),w={coding:.28,mock:.19,reasoning:.15,systems:.13,production:.1,behavioral:.07,breadth:.08};return Math.round(Object.entries(w).reduce((s,[k,v])=>s+c[k]*v,0))}
    confidence(){const evidence=(this.state.solved?.length||0)+Math.min(10,this.state.mock?.history?.length||0)*2+Math.min(10,this.state.aiInterview?.sessions?.length||0)+Math.min(8,this.state.systemDesign?.history?.length||0)*2+Math.min(8,this.state.engineeringIncidents?.history?.length||0)*2;return clamp(Math.round(evidence/70*100))}
    districts(){return DISTRICTS.map(id=>({id,score:this.economy.districtScore(id)})).sort((a,b)=>a.score-b.score)}
    pathFit(){const p=this.game?.phase13?.paths?.path?.();if(!p)return null;const focus=(p.focus||[]).filter(x=>DISTRICTS.includes(x)),score=focus.length?Math.round(avg(focus.map(x=>this.economy.districtScore(x)))):this.score();return{name:p.name,icon:p.icon,focus,score}}
    gaps(){const c=this.components(),labels={coding:'Coding mastery',mock:'Mock interview execution',reasoning:'Reasoning communication',systems:'System design',production:'Production debugging',behavioral:'Behavioral stories',breadth:'Pattern breadth'};return['coding','mock','reasoning','systems','production','behavioral','breadth'].map(id=>({id,label:labels[id],score:Math.round(c[id])})).sort((a,b)=>a.score-b.score)}
    band(){const s=this.score();if(s>=85)return{name:'Interview-ready',icon:'🏆',next:'Maintain breadth and rehearse realistic full loops.'};if(s>=70)return{name:'Strong',icon:'🚀',next:'Close the weakest interview dimension and increase mock consistency.'};if(s>=55)return{name:'Developing',icon:'🧭',next:'Alternate weak-pattern coding with reasoning and production practice.'};if(s>=35)return{name:'Building',icon:'🏗️',next:'Grow retained mastery and accumulate more judged evidence.'};return{name:'Foundation',icon:'🌱',next:'Focus on a few core patterns and explain each solution out loud.'}}
    snapshot(){return{score:this.score(),confidence:this.confidence(),band:this.band(),components:this.components(),gaps:this.gaps(),districts:this.districts(),path:this.pathFit(),at:new Date().toISOString()}}
  }
  ReadinessModel.DISTRICTS=DISTRICTS;C.register('ReadinessModel',ReadinessModel);
})(window.Codeopolis);
