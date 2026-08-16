(function(C){
  'use strict';
  const VERSION=1;
  const POOLS=Object.freeze({
    1:{id:'foundations',districts:['arrays','strings','core'],concepts:['array','arrays','string','strings','implementation','hashing'],difficulties:['easy']},
    2:{id:'data_structures',districts:['arrays','strings','hashing','stacks','queues','trees','core'],concepts:['array','arrays','string','strings','hash','hashing','stack','stacks','queue','queues','tree','trees','binary_tree','linked_list'],difficulties:['easy','medium']},
    3:{id:'algorithms',districts:['graphs','dp','algorithms','search','optimization'],concepts:['graph','graphs','bfs','dfs','search','greedy','dynamic_programming','dp','backtracking','heap','priority_queue'],difficulties:['medium']},
    4:{id:'systems',districts:['systems','infrastructure','network','reliability','stability'],concepts:['systems','system_design','network','networking','concurrency','reliability','infrastructure','distributed_systems'],difficulties:['medium','hard']},
    5:{id:'advanced_engineering',districts:['optimization','systems','infrastructure','network','reliability'],concepts:['optimization','distributed_systems','production_engineering','scalability','performance','reliability'],difficulties:['medium','hard']},
    6:{id:'frontier_engineer',districts:[],concepts:[],difficulties:['medium','hard']}
  });
  function slug(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
  function level(state){return Math.max(1,Math.min(6,Number(C.AgeProgression?.current?.(state)?.level)||Number(state?.eraLevel)||1))}
  function pool(stateOrLevel){const n=typeof stateOrLevel==='number'?stateOrLevel:level(stateOrLevel);return POOLS[Math.max(1,Math.min(6,Number(n)||1))]}
  function challengeTags(c={}){return [...new Set([c.pattern,c.family,c.topic,c.category,c.district,...(Array.isArray(c.skillIds)?c.skillIds:[])].map(slug).filter(Boolean))]}
  function difficulty(c){return slug(c?.diff||c?.difficulty||'easy')}
  function eligibility(state,c){const p=pool(state),tags=challengeTags(c),d=difficulty(c),difficultyMatch=p.difficulties.includes(d);if(p.id==='frontier_engineer')return{eligible:difficultyMatch,pool:p,tags,difficulty:d,reasons:difficultyMatch?['frontier curriculum']:['difficulty outside frontier curriculum']};const district=slug(c?.district),conceptMatch=tags.some(t=>p.concepts.includes(t)),districtMatch=!!district&&p.districts.includes(district),eligible=difficultyMatch&&(conceptMatch||districtMatch);const reasons=[];if(!difficultyMatch)reasons.push(`requires ${p.difficulties.join(' / ')} difficulty`);if(!conceptMatch&&!districtMatch)reasons.push(`outside ${p.id.replace(/_/g,' ')} curriculum`);if(eligible)reasons.push(`fits ${p.id.replace(/_/g,' ')} curriculum`);return{eligible,pool:p,tags,difficulty:d,conceptMatch,districtMatch,reasons}}
  function available(state,challenges){return Array.from(challenges||[]).filter(c=>eligibility(state,c).eligible)}
  function snapshot(state,challenges){const p=pool(state),all=Array.from(challenges||[]),rows=all.map(c=>({challenge:c,...eligibility(state,c)}));return{version:VERSION,level:level(state),pool:p,total:all.length,eligible:rows.filter(r=>r.eligible).length,rows}}
  C.AgeCurriculumPools={VERSION,POOLS,slug,level,pool,challengeTags,difficulty,eligibility,available,snapshot};
})(window.Codeopolis);
