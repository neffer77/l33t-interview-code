(function(C){
  'use strict';
  function install(){
    const Scene=C.PhaserCityScene;if(!Scene||Scene.prototype.__p1cVisuals)return false;Scene.prototype.__p1cVisuals=true;
    const original=Scene.prototype.renderWorld;
    Scene.prototype.renderWorld=function(){
      original.call(this);const t=this.tile||32;
      for(const b of this.snapshot?.buildings||[]){const level=Math.max(1,Number(b.level)||1),ref=this.buildingRefs?.get(`${b.x},${b.y}`);if(!ref?.image)continue;ref.image.setScale(1+(level-1)*.08);if(level===2)ref.image.setTint(0xffefb0);if(level>=3)ref.image.setTint(0xffd86b);if(level>1)this.add.text(b.x*t+t-3,b.y*t+3,`L${level}`,{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#18222a',backgroundColor:level>=3?'#ffd86b':'#ffefb0',padding:{x:3,y:2}}).setOrigin(1,0).setDepth(25)}
    };
    C.events.on('world:building-upgraded',e=>{const scene=C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity');if(!scene?.add)return;scene.refresh?.();const x=e.x*t(scene),y=e.y*t(scene);const text=scene.add.text(x+16,y+8,`⬆ LEVEL ${e.level}`,{fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#fff4b0',backgroundColor:'#192630dd',padding:{x:5,y:3}}).setOrigin(.5).setDepth(80);scene.tweens.add({targets:text,y:y-18,alpha:0,duration:1100,ease:'Cubic.easeOut',onComplete:()=>text.destroy()})});
    return true;
  }
  function t(scene){return scene.tile||32}
  C.BuildingUpgradeVisuals={install};
})(window.Codeopolis);
