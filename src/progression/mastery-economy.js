(function(C){
  'use strict';
  const {clamp}=C.util;

  const BUILDING_GATES={
    market:{districts:{hash:25}},
    foundry:{districts:{arrays:25}},
    observatory:{districts:{search:30}},
    transit:{districts:{graphs:38},discoveries:['graph-theory']},
    lab:{districts:{dp:42},discoveries:['dynamic-planning']},
    tower:{breadth:{count:3,min:35},discoveries:['systems-science']},
    academy:{breadth:{count:5,min:40},careerRank:1,discoveries:['systems-science']},
    'knowledge-exchange':{districts:{hash:62,search:42},discoveries:['fast-retrieval']},
    'routing-nexus':{districts:{graphs:65,search:45},discoveries:['autonomous-networks']},
    'optimization-institute':{districts:{dp:65,arrays:48},discoveries:['optimization-science']},
    'resilience-center':{breadth:{count:4,min:48},discoveries:['resilient-infrastructure']}
  };

  const PHASE7_BUILDINGS=[
    {id:'knowledge-exchange',name:'Knowledge Exchange',icon:'💠',cost:1150,district:'hash',moneyRate:14,researchRate:4,energy:-2,happiness:2,desc:'+14 money/min · +4 research/min · requires durable Hash + Search mastery'},
    {id:'routing-nexus',name:'Autonomous Routing Nexus',icon:'🛰️',cost:1450,district:'graphs',moneyRate:8,researchRate:8,population:30,energy:-3,desc:'+8 money/min · +8 research/min · +30 population'},
    {id:'optimization-institute',name:'Optimization Institute',icon:'🧬',cost:1550,district:'dp',researchRate:14,energy:-3,happiness:3,desc:'+14 research/min · +3 happiness · requires durable DP mastery'},
    {id:'resilience-center',name:'Resilience Command Center',icon:'🛡️',cost:1750,district:'core',moneyRate:7,researchRate:7,energy:-2,happiness:6,desc:'+7 money/min · +7 research/min · +6 happiness · improves crisis resilience'}
  ];

  const DOCTRINES={
    centralized:{name:'Centralized Supercomputing',icon:'🖥️',description:'Push research throughput aggressively at the cost of economic flexibility.',money:0.95,research:1.30,resilience:0.05},
    distributed:{name:'Distributed Systems',icon:'🌐',description:'Trade peak output for balanced production and stronger crisis resilience.',money:1.12,research:1.12,resilience:0.35},
    edge:{name:'Edge Civilization',icon:'📡',description:'Favor local autonomy and commercial productivity with modest research gains.',money:1.20,research:1.05,resilience:0.18}
  };

  class MasteryEconomy{
    constructor(gameState){this.state=gameState;this.meta=this.ensure();this.installBuildings()}
    ensure(){
      const old=this.state.masteryEconomy||{};
      return this.state.masteryEconomy={version:1,doctrine:old.doctrine||null,doctrineChangedAt:old.doctrineChangedAt||null,doctrineChanges:old.doctrineChanges||0};
    }
    installBuildings(){
      if(typeof BUILDINGS==='undefined')return;
      for(const def of PHASE7_BUILDINGS)if(!BUILDINGS.some(b=>b.id===def.id))BUILDINGS.push(def);
    }
    challengeStrength(c){
      if(typeof effectiveStrength==='function')return clamp(Number(effectiveStrength(c))||0,0,100);
      const m=this.state.mastery?.[c.id]||{},solved=(this.state.solved||[]).includes(c.id);
      if(!solved)return 0;
      let strength=Math.min(100,42+(m.passes||1)*13);
      if(m.lastSolvedAt){const days=(Date.now()-new Date(m.lastSolvedAt).getTime())/86400000;strength-=Math.max(0,days-2)*2.5}
      return clamp(Math.round(strength),0,100);
    }
    districtChallenges(district){return typeof CHALLENGES==='undefined'?[]:CHALLENGES.filter(c=>c.district===district)}
    districtScore(district){
      const solved=this.districtChallenges(district).filter(c=>(this.state.solved||[]).includes(c.id));
      if(!solved.length)return district==='core'?Math.min(100,15+(this.state.level||1)*4):0;
      const strengths=solved.map(c=>this.challengeStrength(c)).sort((a,b)=>b-a).slice(0,5);
      const avg=strengths.reduce((s,v)=>s+v,0)/strengths.length;
      const breadth=Math.min(1,solved.length/3);
      return Math.round(clamp(avg*(0.55+0.45*breadth),0,100));
    }
    knowledgeIndex(){
      const ds=['arrays','hash','structures','search','graphs','dp'];
      return Math.round(ds.reduce((s,d)=>s+this.districtScore(d),0)/ds.length);
    }
    breadthCount(min=35){return ['arrays','hash','structures','search','graphs','dp'].filter(d=>this.districtScore(d)>=min).length}
    discoverySet(){return new Set(this.state.discoveryMeta?.unlocked||[])}
    gateFor(id){return BUILDING_GATES[id]||null}
    gateStatus(id){
      const gate=this.gateFor(id);if(!gate)return{ok:true,reasons:[]};const reasons=[];
      for(const [district,min] of Object.entries(gate.districts||{})){const score=this.districtScore(district);if(score<min)reasons.push(`${DISTRICTS?.[district]?.name||district} mastery ${score}/${min}`)}
      if(gate.breadth){const count=this.breadthCount(gate.breadth.min);if(count<gate.breadth.count)reasons.push(`${count}/${gate.breadth.count} districts at ${gate.breadth.min}+ mastery`)}
      const discoveries=this.discoverySet();for(const id of gate.discoveries||[])if(!discoveries.has(id))reasons.push(`Undiscovered knowledge: ${id.replaceAll('-',' ')}`);
      if(Number.isFinite(gate.careerRank)&&(this.state.career?.rank||0)<gate.careerRank)reasons.push(`Requires career rank ${gate.careerRank}`);
      return{ok:!reasons.length,reasons};
    }
    doctrine(){return DOCTRINES[this.meta.doctrine]||null}
    modifiers(){
      const d=this.doctrine()||{money:1,research:1,resilience:0};
      const knowledge=1+this.knowledgeIndex()/500;
      const crisis=this.state.crisisMeta?.active;
      const crisisMoney=crisis?.effect==='money'?0.84:1;
      const crisisResearch=crisis?.effect==='research'?0.84:1;
      return{money:d.money*knowledge*crisisMoney,research:d.research*knowledge*crisisResearch,resilience:clamp(d.resilience+(this.state.buildings||[]).filter(x=>x==='resilience-center').length*.15,0,.8),knowledge};
    }
    doctrineOptions(){return DOCTRINES}
    canChooseDoctrine(id){if(!DOCTRINES[id])return{ok:false,reason:'Unknown doctrine'};if(!(this.state.discoveryMeta?.unlocked||[]).includes('systems-science'))return{ok:false,reason:'Discover Systems Science first'};if(this.meta.doctrine===id)return{ok:false,reason:'Already active'};const switching=!!this.meta.doctrine,cost=switching?180:0;if((this.state.research||0)<cost)return{ok:false,reason:`Need ${cost} research to retool`};return{ok:true,cost}}
    chooseDoctrine(id){const v=this.canChooseDoctrine(id);if(!v.ok)return v;if(v.cost)this.state.research-=v.cost;this.meta.doctrine=id;this.meta.doctrineChangedAt=new Date().toISOString();this.meta.doctrineChanges++;C.events.emit('strategy:doctrine',{id,def:DOCTRINES[id],cost:v.cost});return{ok:true,cost:v.cost}}
    installCompat(){
      if(this.compatInstalled)return;this.compatInstalled=true;
      if(typeof buildingLockedReason==='function'){
        const legacy=buildingLockedReason,economy=this;
        buildingLockedReason=function(b){const gate=economy.gateStatus(b.id);if(!gate.ok)return gate.reasons[0];return legacy.apply(this,arguments)};
      }
      if(typeof productionRates==='function'){
        const legacy=productionRates,economy=this;
        productionRates=function(){const r=legacy.apply(this,arguments),m=economy.modifiers();if(Number.isFinite(r.moneyRate))r.moneyRate*=m.money;if(Number.isFinite(r.researchRate))r.researchRate*=m.research;return r};
      }
    }
  }

  MasteryEconomy.BUILDING_GATES=BUILDING_GATES;MasteryEconomy.DOCTRINES=DOCTRINES;MasteryEconomy.PHASE7_BUILDINGS=PHASE7_BUILDINGS;
  C.register('MasteryEconomy',MasteryEconomy);
})(window.Codeopolis);
