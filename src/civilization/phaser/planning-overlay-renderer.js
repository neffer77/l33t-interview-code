(function(C){
  'use strict';
  const COLORS={good:0x4fd58a,warn:0xf0c95a,bad:0xe65f6e,source:0x6db8ff,road:0xcaa66a,active:0xffd166,queued:0xa884ff,neutral:0x8aa0aa};
  function install(){
    const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1hOverlayRendererInstalled)return false;
    const p=Scene.prototype;p.__p1hOverlayRendererInstalled=true;
    p.clearPlanningOverlay=function(){if(this.planningOverlayGroup){this.planningOverlayGroup.clear(true,true);this.planningOverlayGroup.destroy(true);this.planningOverlayGroup=null}}
    p.renderPlanningOverlay=function(mode='none'){
      this.clearPlanningOverlay();this.planningOverlayMode=mode;if(mode==='none'||!this.world.planningOverlayData)return;
      const data=this.world.planningOverlayData(mode),t=this.tile,group=this.add.group();this.planningOverlayGroup=group;
      for(const c of data.cells){const color=COLORS[c.kind]||COLORS.neutral,alpha=.14+Math.min(.38,(c.value||0)*.32),rect=this.add.rectangle(c.x*t+t/2,c.y*t+t/2,t-3,t-3,color,alpha).setDepth(14);rect.setStrokeStyle(c.kind==='bad'?2:1,color,Math.min(.9,alpha+.25));group.add(rect)}
      C.events.emit('planning:overlay-rendered',{mode,count:data.cells.length,summary:data.summary});
    };
    const oldRefresh=p.refresh;p.refresh=function(){const mode=this.planningOverlayMode||'none';oldRefresh.call(this);if(mode!=='none')this.renderPlanningOverlay(mode)};
    return true;
  }
  C.register('PlanningOverlayRenderer',{install,COLORS});
})(window.Codeopolis);
