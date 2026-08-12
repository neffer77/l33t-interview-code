(function(C){
  'use strict';
  const LADDERS={
    nova:['Software Engineer','Senior Software Engineer','Staff Robotics Engineer','Principal Robotics Engineer'],
    atlas:['Infrastructure Engineer','Senior Infrastructure Engineer','Staff Infrastructure Engineer','Principal Infrastructure Engineer'],
    helix:['Machine Learning Engineer','Senior Machine Learning Engineer','Staff AI Engineer','Principal AI Engineer'],
    vector:['Security Engineer','Senior Security Engineer','Staff Security Engineer','Principal Security Engineer'],
    orbital:['Systems Engineer','Senior Distributed Systems Engineer','Staff Distributed Systems Engineer','Principal Distributed Systems Engineer']
  };
  const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0));
  class PerformanceReview{
    constructor(state,game,projects,team){this.state=state;this.game=game;this.projects=projects;this.team=team;this.data=this.ensure()}
    ensure(){const old=this.state.companyPerformance||{};return this.state.companyPerformance={version:1,reviews:old.reviews||[],lastProjectCount:old.lastProjectCount||0,promotions:old.promotions||[]}}
    employment(){return this.game.phase18?.pipeline?.data?.employment||null}
    inferLevel(role){const r=String(role||'').toLowerCase();if(r.includes('principal'))return 3;if(r.includes('staff'))return 2;if(r.includes('senior'))return 1;return 0}
    level(){const e=this.employment();return e?this.inferLevel(e.role):0}
    newProjects(){return Math.max(0,(this.projects.data.history||[]).length-this.data.lastProjectCount)}
    eligible(){const e=this.employment();if(!e)return{ok:false,reason:'Accept a company offer first.'};const count=this.newProjects();return count>=3?{ok:true,count}:{ok:false,count,reason:`Complete ${3-count} more evidence-backed project${3-count===1?'':'s'} before the next review.`}}
    evidence(){const recent=(this.projects.data.history||[]).slice(0,this.newProjects()||3),delivery=recent.length?Math.round(recent.reduce((s,p)=>s+(p.score||0),0)/recent.length):0,types=new Set(recent.flatMap(p=>(p.evidence||[]).map(e=>e.type))),breadth=Math.min(100,Math.round(types.size/5*100)),trust=this.team.averageTrust(),readiness=this.game.phase16?.readiness?.score?.()||0;return{delivery,breadth,trust,readiness,projects:recent.length,types:[...types]}}
    review(){const gate=this.eligible();if(!gate.ok)return gate;const e=this.employment(),signals=this.evidence(),score=clamp(signals.delivery*.5+signals.readiness*.2+signals.trust*.15+signals.breadth*.15),promotionReady=score>=86&&signals.delivery>=82&&signals.readiness>=75&&signals.trust>=10&&this.level()<3,band=promotionReady?'Promotion Ready':score>=82?'Exceeds Expectations':score>=70?'Meets Expectations':'Needs Stronger Evidence';const rec={id:`review-${Date.now()}`,companyId:e.companyId,role:e.role,score,band,promotionReady,signals,projectCount:(this.projects.data.history||[]).length,at:new Date().toISOString()};this.data.reviews.unshift(rec);this.data.reviews=this.data.reviews.slice(0,24);this.data.lastProjectCount=(this.projects.data.history||[]).length;C.events.emit('company:performance-review',{review:rec,employment:e});return{ok:true,review:rec}}
    last(){return this.data.reviews[0]||null}
    nextRole(){const e=this.employment();if(!e)return null;const ladder=LADDERS[e.companyId]||[],level=this.level();return ladder[Math.min(ladder.length-1,level+1)]||null}
    canPromote(){const r=this.last(),e=this.employment();return !!(r?.promotionReady&&e&&r.companyId===e.companyId&&this.level()<3&&!r.promotedAt)}
    promote(){if(!this.canPromote())return{ok:false,reason:'Earn a promotion-ready performance review first.'};const e=this.employment(),r=this.last(),from=e.role,to=this.nextRole();if(!to||to===from)return{ok:false,reason:'You are already at the top of this company ladder.'};e.role=to;r.promotedAt=new Date().toISOString();r.promotion={from,to};this.data.promotions.unshift({companyId:e.companyId,from,to,reviewId:r.id,at:r.promotedAt});this.state.money=(this.state.money||0)+1000;this.state.research=(this.state.research||0)+150;C.events.emit('company:promoted',{employment:e,from,to,review:r});return{ok:true,from,to}}
  }
  PerformanceReview.LADDERS=LADDERS;C.register('PerformanceReview',PerformanceReview);
})(window.Codeopolis);
