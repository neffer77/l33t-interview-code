(function(C){
  'use strict';
  class CityEditingUI{
    constructor(host,world){this.host=host;this.world=world;this.install();this.bind();this.render()}
    install(){if(document.getElementById('p1UndoFab'))return;const style=document.createElement('style');style.textContent=`.p1-undo-fab{position:absolute;left:10px;bottom:112px;z-index:72;min-height:44px;border:0;border-radius:999px;padding:10px 14px;background:#263845;color:#eef5f3;font-weight:900;box-shadow:0 5px 18px #0007}.p1-undo-fab:disabled{opacity:.42;filter:saturate(.3)}@media(max-width:600px){.p1-undo-fab{left:8px;bottom:108px}}`;document.head.appendChild(style);const b=document.createElement('button');b.id='p1UndoFab';b.className='p1-undo-fab';b.onclick=()=>this.undo();this.host.appendChild(b);this.button=b}
    bind(){for(const e of ['world:undo-state','world:building-placed','world:building-demolished','world:road-changed','world:relocation-finished','world:relocation-cancelled','world:city-restored'])C.events.on(e,()=>this.render())}
    haptic(){try{navigator.vibrate?.(12)}catch{}}
    undo(){const r=this.world.undoCityEdit?.();if(!r?.ok){C.phaserCity?.catalog?.notify?.(`↩️ ${r?.reason||'Nothing to undo'}`);return}this.haptic();try{typeof persist==='function'&&persist(false)}catch{}try{typeof render==='function'&&render()}catch{}C.phaserCity?.game?.scene?.getScene?.('CodeopolisCity')?.refresh?.();C.phaserCity?.services?.render?.();C.phaserCity?.planning?.render?.();C.phaserCity?.catalog?.notify?.(`↩️ Undid ${r.label}`);this.render()}
    render(){if(!this.button)return;const e=this.world.ensureEditState?.(),last=e?.undo?.at?.(-1);this.button.disabled=!last;this.button.textContent=last?`↩️ Undo`:'↩️ Undo';this.button.title=last?`Undo ${last.label}`:'Nothing to undo'}
  }
  C.CityEditingUI=CityEditingUI;
})(window.Codeopolis);
