(function(C){
  'use strict';
  function install(){const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1fSpecializationVisuals)return false;Scene.prototype.__p1fSpecializationVisuals=true;const original=Scene.prototype.renderWorld;Scene.prototype.renderWorld=function(){original.apply(this,arguments);const t=this.tile||32;for(const b of this.snapshot?.buildings||[]){const spec=b.effects?.specialization;if(!spec)continue;this.add.text((b.x+(b.footprint?.w||1))*t-6,b.y*t+5,spec.icon||'🧭',{fontFamily:'monospace',fontSize:'10px',color:'#fff4bd',backgroundColor:'#3b2e17dd',padding:{x:3,y:2}}).setOrigin(1,0).setDepth(29)}};return true}
  C.SpecializationVisuals={install};
})(window.Codeopolis);
