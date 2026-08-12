(function(C){
  'use strict';
  const TEMPLATES={
    graphs:[['Network partition','A regional routing fabric is fragmenting under load.','restore connectivity'],['Transit overload','Autonomous transit routes are colliding around saturated hubs.','stabilize routing'],['Dependency cascade','A service dependency graph is propagating failures.','contain the cascade']],
    search:[['Index saturation','A global lookup tier is missing latency targets.','restore predictable lookup'],['Capacity probe','A sorted capacity table is returning incorrect boundaries.','repair capacity search'],['Telemetry hunt','Operations must locate the first failing interval quickly.','find the boundary']],
    dp:[['Planning deadlock','The resource planner is recomputing overlapping states.','restore planning throughput'],['Allocation collapse','Long-horizon allocation is producing expensive suboptimal plans.','optimize the plan'],['Inference budget','Helix needs to schedule constrained inference batches.','minimize compute cost']],
    hash:[['Cache identity fault','Duplicate identities are corrupting a shared cache.','restore deterministic lookup'],['Dedup storm','Event ingestion is overwhelmed by repeated records.','deduplicate efficiently'],['Session collision','Session routing is confusing repeated identifiers.','repair identity mapping']],
    arrays:[['Sensor burst','A fleet is producing a high-volume numerical stream.','process the stream in one pass'],['Market telemetry','A pricing window needs an efficient aggregate decision.','extract the useful signal'],['Resource scan','The civic grid needs a compact pass over capacity data.','compute the answer efficiently']],
    structures:[['Queue corruption','A worker queue is losing ordering guarantees.','restore queue correctness'],['State stack fault','A parser service is mishandling nested state.','repair state tracking'],['Tree catalog outage','Hierarchical metadata queries are failing.','restore traversal correctness']]
  };
  class MissionGenerator{
    constructor(state,economy){this.state=state;this.economy=economy;this.serial=state.worldMissionSerial||0}
    weakest(focus=[]){const ds=focus.length?focus:['arrays','hash','structures','search','graphs','dp'];return ds.slice().sort((a,b)=>this.economy.districtScore(a)-this.economy.districtScore(b))[0]||'arrays'}
    challenge(district){const pool=(typeof CHALLENGES==='undefined'?[]:CHALLENGES).filter(c=>c.district===district&&(typeof unlocked!=='function'||unlocked(c)));pool.sort((a,b)=>this.economy.challengeStrength(a)-this.economy.challengeStrength(b));return pool[0]||null}
    generate({orgId='codeopolis',orgName='Codeopolis',focus=[],campaignId=null}={}){const district=this.weakest(focus),c=this.challenge(district);if(!c)return null;const variants=TEMPLATES[district]||TEMPLATES.arrays;const i=(this.serial++)%variants.length;this.state.worldMissionSerial=this.serial;const [title,brief,goal]=variants[i];return{id:`wm-${Date.now()}-${this.serial}`,campaignId,orgId,district,challengeId:c.id,title:`${orgName}: ${title}`,brief:`${brief} Your objective is to ${goal}.`,generatedAt:new Date().toISOString(),status:'open',rewardMoney:260+Math.round((c.money||100)*.8),rewardResearch:45+Math.round((c.rp||20)*.55)}}
  }
  MissionGenerator.TEMPLATES=TEMPLATES;C.register('MissionGenerator',MissionGenerator);
})(window.Codeopolis);