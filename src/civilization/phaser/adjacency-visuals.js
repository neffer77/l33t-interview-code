(function(C){
  'use strict';
  function install(){
    const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1dAdjacencyVisuals)return false;Scene.prototype.__p1dAdjacencyVisuals=true;
    const original=Scene.prototype.renderWorld;
    Scene.prototype.renderWorld=function(){
      original.apply(this,arguments);const t=this.tile||32;
      for(const b of this.snapshot?.buildings||[]){const a=b.adjacency;if(!a)continue;const parts=[];if(a.roadConnected)parts.push('🛣');if(a.sameDistrict)parts.push(`+${a.sameDistrict}`);if(!parts.length)continue;const badge=this.add.text(b.x*t+4,b.y*t+4,parts.join(' '),{fontFamily:'monospace',fontSize:'8px',color:'#dfffea',backgroundColor:'#153a2dcc',padding:{x:3,y:2}}).setDepth(25);badge.setAlpha(.9)}
    };return true;
  }
  C.AdjacencyVisuals={install};
})(window.Codeopolis);
