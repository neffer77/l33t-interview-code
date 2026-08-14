(function(C){
  'use strict';
  function install(){const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1eServiceVisuals)return false;Scene.prototype.__p1eServiceVisuals=true;const original=Scene.prototype.renderWorld;Scene.prototype.renderWorld=function(){original.apply(this,arguments);const t=this.tile||32;for(const b of this.snapshot?.buildings||[]){const s=b.service;if(!s||s.efficiency>=.995)continue;const icons=[];if(!s.roadConnected)icons.push('🛣');if(s.city?.powerRatio<.999&&s.powerDemand)icons.push('⚡');if(s.city?.workerRatio<.999&&s.workerDemand)icons.push('👷');if(s.city?.housingRatio<.999)icons.push('🏠');if(!icons.length)continue;this.add.text(b.x*t+4,b.y*t+18,`${icons.join('')} ${Math.round(s.efficiency*100)}%`,{fontFamily:'monospace',fontSize:'8px',color:'#ffe2bf',backgroundColor:'#58351fdd',padding:{x:3,y:2}}).setDepth(27)}};return true}
  C.ServiceVisuals={install};
})(window.Codeopolis);
