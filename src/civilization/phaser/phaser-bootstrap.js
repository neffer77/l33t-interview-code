(function(C){
  'use strict';
  const PHASER_URL='https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
  function loadPhaser(){if(window.Phaser)return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=PHASER_URL;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function start(world,state){
    const canvas=document.getElementById('cityCanvas');if(!canvas||C.phaserCity)return false;
    try{
      await loadPhaser();if(!C.PhaserCityScene)throw new Error('City scene unavailable');
      const Adapter=C.get('CivilizationWorldAdapter'),adapter=new Adapter(world,state),host=document.createElement('div');host.id='phaserCityHost';host.className='phaser-city-host';canvas.insertAdjacentElement('afterend',host);canvas.style.display='none';
      const game=new Phaser.Game({type:Phaser.AUTO,parent:host,backgroundColor:'#132c31',pixelArt:true,roundPixels:true,antialias:false,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:[]});
      game.scene.add('CodeopolisCity',C.PhaserCityScene,false);game.scene.start('CodeopolisCity',{adapter,world});
      C.phaserCity={game,adapter,host,legacyCanvas:canvas,resize:()=>game.scale.resize(host.clientWidth,host.clientHeight)};
      new ResizeObserver(()=>C.phaserCity?.resize()).observe(host);C.events.emit('civilization:phaser-ready',{renderer:'phaser',version:Phaser.VERSION});return true;
    }catch(err){console.warn('Phaser city unavailable; retaining Canvas2D renderer.',err);canvas.style.display='';C.events.emit('civilization:phaser-fallback',{error:String(err)});return false}
  }
  C.register('PhaserCivilizationBootstrap',{start});
})(window.Codeopolis);
