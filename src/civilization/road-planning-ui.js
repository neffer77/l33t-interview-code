(function(C){
  'use strict';
  class RoadPlanningUI{
    constructor(host,world){this.host=host;this.world=world;this.install();this.bind()}
    install(){if(document.getElementById('p1RoadFab'))return;const style=document.createElement('style');style.textContent=`.p1-road-fab{position:absolute;right:12px;bottom:112px;z-index:70;border:0;border-radius:999px;padding:11px 15px;background:#7ca9c9;color:#10212c;font-weight:900;box-shadow:0 5px 18px #0007;min-height:44px}.p1-road-fab.active{background:#8fe0aa}.p1-road-note{position:absolute;left:10px;right:10px;bottom:10px;z-index:75;padding:9px 10px;border-radius:10px;background:#12232ded;border:1px solid #537282;color:#eef5f3;font:12px system-ui;display:none;pointer-events:none}.p1-road-note.show{display:block}@media(max-width:600px){.p1-road-fab{right:10px;bottom:108px}}`;document.head.appendChild(style);const b=document.createElement('button');b.id='p1RoadFab';b.className='p1-road-fab';b.textContent='🛣️ Roads';b.onclick=()=>this.toggle();this.host.appendChild(b);const n=document.createElement('div');n.id='p1RoadNote';n.className='p1-road-note';n.textContent='Road mode: tap open tiles to add/remove roads. Roads give connected buildings +10% output.';this.host.appendChild(n);this.button=b;this.note=n}
    bind(){C.events.on('world:tool',()=>this.render());C.events.on('world:road-changed',()=>this.render())}
    toggle(){const active=this.world.world.tool?.mode==='road';this.world.setTool(active?'inspect':'road');if(!active){C.phaserCity?.catalog?.close?.();C.phaserCity?.manager?.close?.();try{typeof switchTab==='function'&&switchTab('city')}catch{}}this.render()}
    render(){const active=this.world.world.tool?.mode==='road';this.button?.classList.toggle('active',active);if(this.button)this.button.textContent=active?'✓ Road mode':'🛣️ Roads';this.note?.classList.toggle('show',active)}
  }
  C.RoadPlanningUI=RoadPlanningUI;
})(window.Codeopolis);
