(function(C){
  'use strict';
  const samples=[];
  function snapshot(){
    const p=C.phaserCity,game=p?.game,scene=game?.scene?.getScene?.('CodeopolisCity'),world=C.game?.world?.world;
    return{
      renderer:game?.renderer?.type===1?'canvas':game?'webgl':'fallback',
      phaserVersion:window.Phaser?.VERSION||null,
      active:!!p?.active,
      fps:Number(game?.loop?.actualFps||0).toFixed(1),
      world:world?{version:world.version,width:world.width,height:world.height,tiles:Object.keys(world.tiles||{}).length,camera:{...world.camera}}:null,
      scene:scene?{active:scene.scene.isActive(),sleeping:scene.scene.isSleeping(),objects:scene.children?.length||0}:null,
      viewport:{width:window.visualViewport?.width||innerWidth,height:window.visualViewport?.height||innerHeight,dpr:devicePixelRatio||1},
      timestamp:new Date().toISOString()
    };
  }
  function record(){const s=snapshot();samples.push(s);if(samples.length>60)samples.shift();return s}
  function exportReport(){return JSON.stringify({phase:'44-P0',latest:record(),samples:[...samples],world:C.game?.world?.world||null},null,2)}
  function downloadReport(){const blob=new Blob([exportReport()],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='codeopolis-map-diagnostics.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  function installControls(host){
    if(!host||host.querySelector('.phase44-diagnostics-button'))return;
    const b=document.createElement('button');b.type='button';b.className='phase44-diagnostics-button';b.textContent='⚙︎';b.title='Map diagnostics';Object.assign(b.style,{position:'absolute',left:'8px',top:'8px',zIndex:'30',width:'42px',height:'42px',borderRadius:'10px',border:'1px solid #ffffff44',background:'#101923cc',color:'#fff',fontSize:'20px'});
    b.onclick=()=>{const s=record();const text=`Renderer: ${s.renderer}\nFPS: ${s.fps}\nWorld: ${s.world?.width||0}×${s.world?.height||0}\nObjects: ${s.scene?.objects||0}\nViewport: ${Math.round(s.viewport.width)}×${Math.round(s.viewport.height)}\n\nExport diagnostic JSON?`;if(confirm(text))downloadReport()};host.style.position='relative';host.appendChild(b);
  }
  setInterval(()=>{if(C.phaserCity?.active)record()},5000);
  C.Phase44Diagnostics={snapshot,record,exportReport,downloadReport,installControls,samples};
})(window.Codeopolis);
