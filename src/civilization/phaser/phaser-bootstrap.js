(function(C){
  'use strict';
  const PHASER_URL='https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js';
  const ASSET_URL='src/civilization/phaser/city-assets.js';
  const SCENE_URL='src/civilization/phaser/city-scene.js';
  function loadScript(src,key){
    if(key&&window[key])return Promise.resolve();
    const existing=document.querySelector(`script[data-phase44-src="${src}"]`);if(existing)return new Promise((resolve,reject)=>{if(existing.dataset.loaded==='1')resolve();else{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true})}});
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.dataset.phase44Src=src;s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=reject;document.head.appendChild(s)});
  }
  async function loadRuntime(){
    await loadScript(PHASER_URL,'Phaser');
    if(!C.Phase44Assets)await loadScript(ASSET_URL);
    if(!C.PhaserCityScene)await loadScript(SCENE_URL);
    if(!window.Phaser||!C.PhaserCityScene||!C.Phase44Assets)throw new Error('Phaser city runtime failed to load');
  }
  function setActive(active){
    const p=C.phaserCity;if(!p?.game)return;
    const scene=p.game.scene.getScene('CodeopolisCity');if(!scene)return;
    if(active){if(scene.scene.isSleeping())scene.scene.wake();if(scene.scene.isPaused())scene.scene.resume();p.game.loop.wake();p.resize?.()}
    else{if(scene.scene.isActive())scene.scene.sleep();p.game.loop.sleep()}
    p.active=!!active;
  }
  async function start(world,state){
    const canvas=document.getElementById('cityCanvas');if(!canvas||C.phaserCity)return false;
    try{
      await loadRuntime();
      const Adapter=C.get('CivilizationWorldAdapter'),adapter=new Adapter(world,state),host=document.createElement('div');host.id='phaserCityHost';host.className='phaser-city-host';canvas.insertAdjacentElement('afterend',host);canvas.style.display='none';
      const game=new Phaser.Game({type:Phaser.AUTO,parent:host,backgroundColor:'#132c31',pixelArt:true,roundPixels:true,antialias:false,scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:[]});
      game.scene.add('CodeopolisCity',C.PhaserCityScene,false);game.scene.start('CodeopolisCity',{adapter,world});
      C.phaserCity={game,adapter,host,legacyCanvas:canvas,active:true,resize:()=>{if(host.clientWidth&&host.clientHeight)game.scale.resize(host.clientWidth,host.clientHeight)},setActive};
      new ResizeObserver(()=>C.phaserCity?.resize()).observe(host);C.events.emit('civilization:phaser-ready',{renderer:'phaser',version:Phaser.VERSION});return true;
    }catch(err){console.warn('Phaser city unavailable; retaining Canvas2D renderer.',err);canvas.style.display='';C.events.emit('civilization:phaser-fallback',{error:String(err)});return false}
  }
  C.register('PhaserCivilizationBootstrap',{start,setActive});
})(window.Codeopolis);
