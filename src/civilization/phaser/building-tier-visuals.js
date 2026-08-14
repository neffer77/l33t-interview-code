(function(C){
  'use strict';
  function install(){
    const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1cTierVisuals)return false;Scene.prototype.__p1cTierVisuals=true;
    const original=Scene.prototype.renderWorld;
    Scene.prototype.renderWorld=function(){original.call(this);const t=this.tile||32,s=this.snapshot;if(!s?.buildings)return;for(const b of s.buildings){const level=Math.max(1,Math.min(3,Number(b.level)||1));if(level<=1)continue;const cx=b.x*t+(b.footprint?.w||1)*t/2,top=b.y*t-2;this.add.text(cx,top,level===2?'◆ II':'✦ III',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:level===2?'#ffe28a':'#a9f0ff',backgroundColor:'#14202bdd',padding:{x:4,y:2}}).setOrigin(.5,1).setDepth(32);for(let i=0;i<level-1;i++)this.add.rectangle(cx-7+i*14,b.y*t+5,5,12,level===2?0xf0c95a:0x70d6ff,.9).setDepth(8+b.y*.01)} };
    return true;
  }
  C.BuildingTierVisuals={install};
})(window.Codeopolis);
