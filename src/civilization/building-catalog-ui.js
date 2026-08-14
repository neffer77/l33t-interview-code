(function(C){
  'use strict';
  class BuildingCatalogUI{
    constructor(host,world,state){this.host=host;this.world=world;this.state=state;this.selected=null;this.install();this.bind()}
    install(){
      if(document.getElementById('p1BuildingCatalog'))return;
      const style=document.createElement('style');style.textContent=`
        .p1-build-fab{position:absolute;right:12px;bottom:62px;z-index:70;border:0;border-radius:999px;padding:11px 15px;background:#f0c95a;color:#17222a;font-weight:900;box-shadow:0 5px 18px #0007;min-height:44px}
        .p1-catalog{position:absolute;left:8px;right:8px;bottom:8px;z-index:80;background:#101b25f5;border:1px solid #496474;border-radius:15px;box-shadow:0 10px 35px #000a;max-height:min(72%,520px);display:flex;flex-direction:column;color:#eef5f3;overflow:hidden}.p1-catalog.hidden{display:none}.p1-catalog-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px;border-bottom:1px solid #314752}.p1-catalog-head h3{margin:0;font-size:15px}.p1-catalog-close{min-width:42px;min-height:42px;border:0;border-radius:10px;background:#263845;color:#fff;font-size:20px}.p1-catalog-grid{padding:10px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:9px}.p1-building-card{background:#172733;border:1px solid #35505e;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:7px;min-height:150px}.p1-building-card.locked{opacity:.68}.p1-building-title{font-weight:900}.p1-building-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:11px}.p1-building-chip{background:#263b47;border-radius:999px;padding:3px 7px}.p1-building-desc{font-size:11px;color:#bad0d2;line-height:1.35;flex:1}.p1-building-reason{font-size:11px;color:#ffb8ad}.p1-building-cost{font-size:11px;color:#e7d7a0;line-height:1.4}.p1-building-action{border:0;border-radius:9px;min-height:40px;padding:8px;font-weight:900;background:#65c887;color:#10231a}.p1-building-action[disabled]{background:#344752;color:#91a4aa}.p1-construction-toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:90;padding:8px 12px;border-radius:10px;background:#172733ef;color:#fff;border:1px solid #607a84;font-size:12px;pointer-events:none;opacity:0;transition:opacity .2s}.p1-construction-toast.show{opacity:1}
        @media(max-width:600px){.p1-catalog-grid{grid-template-columns:1fr 1fr}.p1-catalog{bottom:6px;max-height:67%}.p1-build-fab{right:10px;bottom:58px}}
      `;document.head.appendChild(style);
      this.host.style.position='relative';
      const fab=document.createElement('button');fab.className='p1-build-fab';fab.id='p1BuildFab';fab.textContent='🏗️ Build';fab.onclick=()=>this.open();this.host.appendChild(fab);
      const panel=document.createElement('section');panel.className='p1-catalog hidden';panel.id='p1BuildingCatalog';panel.innerHTML='<div class="p1-catalog-head"><div><h3>🏗️ Build in Codeopolis</h3><small id="p1CatalogTile">Choose a structure</small></div><button class="p1-catalog-close" aria-label="Close building catalog">×</button></div><div class="p1-catalog-grid"></div>';this.host.appendChild(panel);panel.querySelector('.p1-catalog-close').onclick=()=>this.close();
      const toast=document.createElement('div');toast.id='p1ConstructionToast';toast.className='p1-construction-toast';this.host.appendChild(toast);
      this.panel=panel;this.grid=panel.querySelector('.p1-catalog-grid');this.tileLabel=panel.querySelector('#p1CatalogTile');
    }
    bind(){
      C.events.on('world:selected',s=>{this.selected=s;const t=s?this.world.selectedTile():null;if(s&&t&&!t.buildingId&&!t.occupiedBy&&!t.road&&this.world.world.tool?.mode==='inspect')this.open(s);else this.render()});
      C.events.on('world:tool',()=>this.render());C.events.on('learning:resource-earned',()=>this.render());C.events.on('learning:resources-spent',()=>this.render());
      C.events.on('world:building-placed',e=>{this.close();this.notify(`🏗️ ${e.def?.name||e.id} construction started`);setTimeout(()=>this.notify(`✅ ${e.def?.name||e.id} online`),4400)});
      C.events.on('placement:rejected',e=>this.notify(`⚠️ ${e.reason}`));
    }
    open(tile=null){if(tile)this.selected=tile;this.render();this.panel?.classList.remove('hidden')}
    close(){this.panel?.classList.add('hidden')}
    notify(text){const el=document.getElementById('p1ConstructionToast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}
    acquire(id){
      const s=C.BuildingRegistry.status(this.world,this.state,id);if(s.locked){this.notify(`🔒 ${s.locked}`);return false}if(!s.owned){const r=C.MultiResourceEconomy?.purchaseBuilding?.(this.world,this.state,id);if(!r?.ok){this.notify(`⚠️ ${r?.reason||'Cannot afford this building'}`);return false}try{typeof persist==='function'&&persist(false)}catch{}C.phaserCity?.resources?.render?.()}
      this.world.setTool('building',id);try{if(typeof switchTab==='function')switchTab('city')}catch{}
      const tile=this.selected;if(tile&&C.phaserCity?.placement){C.phaserCity.placement.lastTile={x:tile.x,y:tile.y};C.phaserCity.placement.drawPreview(tile.x,tile.y,id)}
      this.close();return true;
    }
    render(){
      if(!this.grid)return;const tile=this.selected;this.tileLabel.textContent=tile?`Selected tile ${tile.x}, ${tile.y} · choose what to place`:'Choose a structure to build or place';
      const list=C.BuildingRegistry.catalog(this.world,this.state);this.grid.innerHTML=list.map(s=>{const d=s.def,cost=s.economyCost||{money:d.cost,resources:{}},costText=C.MultiResourceEconomy?.format?.(cost)||`💰 ${d.cost}`,missing=C.MultiResourceEconomy?.formatMissing?.(this.state,cost)||'',action=s.owned?`Place owned ×${s.owned}`:s.locked?'Locked':s.affordable?`Build · ${costText}`:`Need ${missing}`,disabled=!!s.locked||(!s.owned&&!s.affordable);return `<article class="p1-building-card ${disabled?'locked':''}"><div class="p1-building-title">${d.icon} ${d.name}</div><div class="p1-building-meta"><span class="p1-building-chip">${d.footprint.w}×${d.footprint.h}</span><span class="p1-building-chip">${d.district}</span></div><div class="p1-building-cost">${costText}</div><div class="p1-building-desc">${d.desc||'Civilization infrastructure.'}</div>${s.locked?`<div class="p1-building-reason">🔒 ${s.locked}</div>`:(!s.owned&&!s.affordable?`<div class="p1-building-reason">Missing ${missing}</div>`:'')}<button class="p1-building-action" data-build-id="${d.id}" ${disabled?'disabled':''}>${action}</button></article>`}).join('')||'<div>No buildings available yet.</div>';
      this.grid.querySelectorAll('[data-build-id]').forEach(b=>b.onclick=()=>this.acquire(b.dataset.buildId));
    }
  }
  C.BuildingCatalogUI=BuildingCatalogUI;
})(window.Codeopolis);
