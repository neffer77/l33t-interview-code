(function(C){
  'use strict';
  class RoadPlannerUI{
    constructor(host,world,scene,state){this.host=host;this.world=world;this.scene=scene;this.state=state;this.down=null;this.install();this.bind();this.render()}
    install(){
      if(document.getElementById('p1RoadFab'))return;
      const style=document.createElement('style');style.textContent=`
        .p1-road-fab{position:absolute;right:12px;bottom:112px;z-index:70;border:0;border-radius:999px;padding:11px 15px;background:#6b7c89;color:#fff;font-weight:900;box-shadow:0 5px 18px #0007;min-height:44px}.p1-road-fab.active{background:#69c58b;color:#10231a}.p1-road-hud{position:absolute;left:10px;right:10px;bottom:10px;z-index:84;display:none;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;background:#101d26f2;border:1px solid #4f6873;border-radius:11px;color:#fff;font:12px system-ui}.p1-road-hud.show{display:flex}.p1-road-hud button{min-width:74px;min-height:42px;border:0;border-radius:8px;background:#304753;color:#fff;font-weight:900}.p1-road-summary{position:absolute;left:10px;top:10px;z-index:38;padding:6px 9px;border-radius:9px;background:#12212ae8;color:#d9efea;font:11px system-ui;border:1px solid #3c5964;pointer-events:none}@media(max-width:600px){.p1-road-fab{right:10px;bottom:108px}}
      `;document.head.appendChild(style);
      this.host.style.position='relative';
      const fab=document.createElement('button');fab.id='p1RoadFab';fab.className='p1-road-fab';fab.textContent='🛣️ Roads';fab.onclick=()=>this.toggle();this.host.appendChild(fab);this.fab=fab;
      const hud=document.createElement('div');hud.className='p1-road-hud';hud.innerHTML='<div><b>🛣️ Road planner</b><div style="opacity:.72;margin-top:2px">Tap open tiles to add/remove roads. Roads give adjacent buildings +10% output.</div></div><button type="button">Done</button>';hud.querySelector('button').onclick=()=>this.stop();this.host.appendChild(hud);this.hud=hud;
      const summary=document.createElement('div');summary.className='p1-road-summary';this.host.appendChild(summary);this.summary=summary;
    }
    bind(){
      C.events.on('world:tool',()=>this.render());C.events.on('world:road-changed',()=>this.render());C.events.on('world:building-placed',()=>this.render());C.events.on('world:building-unplaced',()=>this.render());C.events.on('world:building-upgraded',()=>this.render());
      this.scene.input.on('pointerdown',p=>{this.down={id:p.id,x:p.x,y:p.y,moved:false}});
      this.scene.input.on('pointermove',p=>{if(this.down&&this.down.id===p.id&&Math.abs(p.x-this.down.x)+Math.abs(p.y-this.down.y)>8)this.down.moved=true});
      this.scene.input.on('pointerup',p=>{const tap=this.down&&this.down.id===p.id&&!this.down.moved;this.down=null;if(tap&&this.active())this.applyAt(p)});
    }
    active(){return this.world.world.tool?.mode==='road'}
    toggle(){this.active()?this.stop():this.start()}
    start(){C.phaserCity?.catalog?.close?.();C.phaserCity?.manager?.close?.();this.world.setTool('road');try{if(typeof switchTab==='function')switchTab('city')}catch{}this.render()}
    stop(){this.world.setTool('inspect');this.render()}
    applyAt(pointer){const wp=pointer.positionToCamera(this.scene.cameras.main),x=Math.floor(wp.x/(this.scene.tile||32)),y=Math.floor(wp.y/(this.scene.tile||32));if(!this.world.inside(x,y))return;const t=this.world.tile(x,y),next=!t?.road,r=this.world.setRoad(x,y,next);if(!r.ok){C.phaserCity?.catalog?.notify?.(`⚠️ ${r.reason}`);return}try{typeof persist==='function'&&persist(false)}catch{}this.world.select(x,y);C.events.emit('road:planned',{x,y,value:next})}
    render(){const active=this.active();this.fab?.classList.toggle('active',active);if(this.fab)this.fab.textContent=active?'✓ Road mode':'🛣️ Roads';this.hud?.classList.toggle('show',active);const s=this.world.cityAdjacencySummary?.()||{total:0,connected:0,clustered:0,roadCoverage:0};if(this.summary)this.summary.textContent=`Road access ${s.connected}/${s.total} · District clusters ${s.clustered} · ${Math.round((s.roadCoverage||0)*100)}% coverage`}
  }
  C.RoadPlannerUI=RoadPlannerUI;
})(window.Codeopolis);
