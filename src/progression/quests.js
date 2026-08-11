(function(C){
  'use strict';
  const PROJECTS=[
    {id:'knowledge-cloud',icon:'☁️',name:'Civic Knowledge Cloud',description:'Fuse retrieval and ordered search into a city-wide information utility.',requiresDiscovery:'fast-retrieval',requirements:[['hash',58],['search',42]],roads:8,rewardBuilding:'knowledge-exchange',rewardMoney:500,rewardResearch:80},
    {id:'autonomous-transit-grid',icon:'🚄',name:'Autonomous Transit Grid',description:'Turn graph mastery and resilient roads into an adaptive transportation network.',requiresDiscovery:'autonomous-networks',requirements:[['graphs',65],['search',45]],roads:14,rewardBuilding:'routing-nexus',rewardMoney:700,rewardResearch:110},
    {id:'optimization-campus',icon:'🧬',name:'Optimization Campus',description:'Create a research campus dedicated to dynamic planning and constrained optimization.',requiresDiscovery:'optimization-science',requirements:[['dp',65],['arrays',48]],roads:10,rewardBuilding:'optimization-institute',rewardMoney:650,rewardResearch:130},
    {id:'resilience-network',icon:'🛡️',name:'Resilient Civic Network',description:'Build a civilization that keeps functioning when individual systems fail.',requiresDiscovery:'resilient-infrastructure',breadth:{count:4,min:48},roads:18,rewardBuilding:'resilience-center',rewardMoney:800,rewardResearch:120}
  ];

  class QuestSystem{
    constructor(gameState,economy,discoveries){this.state=gameState;this.economy=economy;this.discoveries=discoveries;this.meta=this.ensure();this.ensureDaily()}
    ensure(){const old=this.state.questMeta||{};return this.state.questMeta={version:1,date:old.date||'',contracts:old.contracts||[],projects:old.projects||{},completedContracts:old.completedContracts||0}}
    today(){return new Date().toISOString().slice(0,10)}
    weakest(){return['arrays','hash','structures','search','graphs','dp'].map(id=>({id,score:this.economy.districtScore(id)})).sort((a,b)=>a.score-b.score)[0]?.id||'arrays'}
    ensureDaily(){
      const date=this.today();if(this.meta.date===date&&this.meta.contracts.length)return;
      const weak=this.weakest(),recallBase=this.state.learning?.recallCorrect||0,solvedBase=(this.state.solved||[]).length;
      this.meta.date=date;this.meta.contracts=[
        {id:`weak-${date}`,type:'district',district:weak,title:`Reinforce ${DISTRICTS[weak]?.name||weak}`,text:'Pass one problem or scheduled review in your weakest district.',target:1,progress:0,rewardMoney:120,rewardResearch:20,claimed:false},
        {id:`recall-${date}`,type:'recall',title:'Memory Calibration',text:'Answer two recall drills correctly.',target:2,progress:0,base:recallBase,rewardMoney:60,rewardResearch:30,claimed:false},
        {id:`new-${date}`,type:'new',title:'Expand the Frontier',text:'Master one problem you had not solved before today.',target:1,progress:0,base:solvedBase,rewardMoney:180,rewardResearch:25,claimed:false}
      ];
    }
    contracts(){this.ensureDaily();this.refreshPassive();return this.meta.contracts}
    refreshPassive(){for(const q of this.meta.contracts){if(q.type==='recall')q.progress=Math.min(q.target,Math.max(0,(this.state.learning?.recallCorrect||0)-(q.base||0)));if(q.type==='new')q.progress=Math.min(q.target,Math.max(0,(this.state.solved||[]).length-(q.base||0)))}}
    onMastered(e){this.ensureDaily();for(const q of this.meta.contracts)if(q.type==='district'&&q.district===e.challenge.district)q.progress=Math.min(q.target,q.progress+1);this.refreshPassive();this.autoClaimReady()}
    onRecall(){this.ensureDaily();this.refreshPassive();this.autoClaimReady()}
    autoClaimReady(){for(const q of this.meta.contracts)if(!q.claimed&&q.progress>=q.target)this.claimContract(q.id)}
    claimContract(id){const q=this.meta.contracts.find(x=>x.id===id);if(!q||q.claimed||q.progress<q.target)return false;q.claimed=true;this.meta.completedContracts++;this.state.money=(this.state.money||0)+q.rewardMoney;this.state.research=(this.state.research||0)+q.rewardResearch;C.events.emit('quest:completed',{quest:q});return true}
    projectStatus(def){
      const claimed=!!this.meta.projects[def.id]?.claimed,details=[];let ok=true;
      if(def.requiresDiscovery&&!this.discoveries.unlocked(def.requiresDiscovery)){ok=false;details.push(`Discovery: ${def.requiresDiscovery.replaceAll('-',' ')}`)}
      for(const [district,min] of def.requirements||[]){const score=this.economy.districtScore(district);if(score<min)ok=false;details.push(`${DISTRICTS[district]?.name||district} ${score}/${min}`)}
      if(def.breadth){const count=this.economy.breadthCount(def.breadth.min);if(count<def.breadth.count)ok=false;details.push(`${count}/${def.breadth.count} districts at ${def.breadth.min}+`)}
      const roads=this.state.world?.stats?.roadsBuilt||0;if(def.roads){if(roads<def.roads)ok=false;details.push(`Road network ${roads}/${def.roads}`)}
      return{claimed,ready:ok&&!claimed,details};
    }
    projects(){return PROJECTS.map(d=>({definition:d,status:this.projectStatus(d)}))}
    claimProject(id){const def=PROJECTS.find(x=>x.id===id);if(!def)return{ok:false,reason:'Unknown project'};const status=this.projectStatus(def);if(!status.ready)return{ok:false,reason:'Requirements not met'};this.meta.projects[id]={claimed:true,claimedAt:new Date().toISOString()};if(def.rewardBuilding&&!(this.state.buildings||[]).includes(def.rewardBuilding))this.state.buildings.push(def.rewardBuilding);this.state.money=(this.state.money||0)+def.rewardMoney;this.state.research=(this.state.research||0)+def.rewardResearch;this.state.happiness=Math.min(100,(this.state.happiness||75)+5);C.events.emit('project:completed',{project:def});return{ok:true,project:def}}
  }
  QuestSystem.PROJECTS=PROJECTS;
  C.register('QuestSystem',QuestSystem);
})(window.Codeopolis);
