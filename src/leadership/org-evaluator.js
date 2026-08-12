(function(C){
'use strict';
const RUBRICS={
 review:[['correctness',['correct','invariant','failure','edge case']],['complexity',['complexity','latency','memory','scale']],['testing',['test','validation','experiment']],['risk',['risk','blast radius','rollback']],['actionability',['change','recommend','owner','next']]],
 dependency:[['decision',['decide','choose','decision']],['tradeoffs',['tradeoff','cost','benefit','constraint']],['ownership',['owner','responsib','accountab']],['migration',['migration','compatib','rollout','sequence']],['safety',['blast radius','rollback','reversible','guardrail']],['measurement',['metric','slo','measure','observab']]],
 development:[['diagnosis',['gap','strength','weak','diagnos']],['delegation',['delegate','ownership','autonomy']],['coaching',['coach','teach','feedback','pair']],['milestones',['milestone','checkpoint','review']],['evidence',['evidence','metric','demonstrate']],['safety',['support','psychological','escalat','safe']]]
};
class OrgEvaluator{
 evaluate(type,text){const src=String(text||'').trim(),low=src.toLowerCase(),words=src?src.split(/\s+/).length:0,dims=RUBRICS[type]||[];const detail=dims.map(([name,keys])=>{const hits=keys.filter(k=>low.includes(k)).length;return{name,score:Math.min(100,hits?65+Math.min(35,hits*12):0),covered:hits>0}});const coverage=detail.filter(d=>d.covered).length,base=detail.length?detail.reduce((s,d)=>s+d.score,0)/detail.length:0,length=Math.min(100,words/90*100),score=Math.round(base*.8+length*.2);return{type,score,wordCount:words,coverage,total:detail.length,missing:detail.filter(d=>!d.covered).map(d=>d.name),dimensions:detail}}
}
OrgEvaluator.RUBRICS=RUBRICS;C.register('OrgEvaluator',OrgEvaluator);
})(window.Codeopolis);