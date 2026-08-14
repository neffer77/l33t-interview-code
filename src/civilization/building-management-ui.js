(function(C){
  'use strict';
  class BuildingManagementUI{
    constructor(host,world,state){this.host=host;this.world=world;this.state=state;this.install();this.bind()}
    install(){
      if(document.getElementById('p1BuildingManager'))return;
      const style=document.createElement('style');style.textContent=`
        .p1-manager{position:absolute;left:8px;right:8px;bottom:8px;z-index:86;background:#101b25f7;border:1px solid #496474;border-radius:15px;box-shadow:0 10px 35px #000a;color:#eef5f3;padding:12px}.p1-manager.hidden{display:none}.p1-manager-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.p1-manager-title{font-size:16px;font-weight:900}.p1-manager-close{min-width:42px;min-height:42px;border:0;border-radius:10px;background:#263845;color:white;font-size:20px}.p1-level-row{display:flex;gap:7px;align-items:center;margin:8px 0}.p1-level-pip{width:24px;height:7px;border-radius:99px;background:#314550}.p1-level-pip.on{background:#f0c95a}.p1-manager-effects{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.p1-effect{background:#172733;border:1px solid #314a57;border-radius:9px;padding:7px;font-size:11px}.p1-manager-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}.p1-manager-actions button{min-height:43px;border:0;border-radius:9px;font-weight:900}.p1-upgrade{background:#65c887;color:#10231a}.p1-move{background:#e4bd58;color:#231f13}.p1-remove{background:#8d4650;color:#fff}.p1-manager-note{font-size:11px;color:#b7cbd0;margin-top:7px}.p1-manager-upgrade{font-size:12px;color:#d8e7df;margin-top:7px}@media(max-width:600px){.p1-manager{bottom:6px}.p1-manager-actions{grid-template-columns:1fr 1fr}.p1-remove{grid-column:1/-1}}
      `;document.head.appendChild(style);
      const el=document.createElement('section');el.id='p1BuildingManager';el.className='p1-manager hidden';this.host.appendChild(el);this.el=el;
    }
    bind(){
      C.events.on('world:selected',()=>this.onSelection());
      C.events.on('world:building-upgraded',e=>{this.render();this.notify(`⬆️ ${this.nameAt(e.x,e.y)} reached level ${e.level}`)});
      C.events.on('world:building-unplaced',()=>this.close());C.events.on('world:building-demolished',()=>this.close());C.events.on('world:tool',()=>{if(this.world.world.tool?.mode!=='inspect')this.close()});
    }
    nameAt(x,y){const t=this.world.tile(x,y);return this.world.buildingDef(t?.buildingId)?.name||t?.buildingId||'Building'}
    selected(){const s=this.world.world.selected;if(!s)return null;const a=this.world.anchorFor?.(s.x,s.y)||s,t=this.world.tile(a.x,a.y);return t?.buildingId?{x:a.x,y:a.y,tile:t}:null}
    onSelection(){const b=this.selected();if(!b||this.world.world.tool?.mode!=='inspect'){this.close();return}C.phaserCity?.catalog?.close?.();this.open()}
    open(){this.render();this.el?.classList.remove('hidden')}
    close(){this.el?.classList.add('hidden')}
    notify(text){C.phaserCity?.catalog?.notify?.(text)}
    upgrade(){const b=this.selected();if(!b)return;const r=this.world.upgradeBuilding(b.x,b.y,this.state);if(!r.ok){this.notify(`⚠️ ${r.reason}`);return}try{typeof persist==='function'&&persist(false)}catch{}try{typeof render==='function'&&render()}catch{}this.render()}
    move(){const b=this.selected();if(!b)return;const r=this.world.unplaceBuilding(b.x,b.y);if(!r.ok){this.notify(`⚠️ ${r.reason}`);return}this.world.setTool('building',r.id);try{typeof persist==='function'&&persist(false)}catch{}this.close();this.notify('Move mode: tap an open footprint')}
    remove(){const b=this.selected();if(!b)return;const def=C.BuildingRegistry.definition(this.world,b.tile.buildingId);if(!confirm(`Demolish ${def.name}? A partial refund will be returned.`))return;const r=this.world.demolishBuilding(b.x,b.y);if(!r.ok){this.notify(`⚠️ ${r.reason}`);return}this.state.money=(this.state.money||0)+r.refund;try{typeof persist==='function'&&persist(false)}catch{}try{typeof render==='function'&&render()}catch{}this.close();this.notify(`🚧 Demolished · refunded 💰 ${r.refund}`)}
    render(){const b=this.selected();if(!b||!this.el)return;const def=C.BuildingRegistry.definition(this.world,b.tile.buildingId),fx=this.world.buildingEffects(b.x,b.y),cost=this.world.upgradeCost(b.x,b.y),complete=this.world.constructionProgress(b.tile)>=1,max=fx.level>=fx.maxLevel;
      const effects=[['👥 Population',fx.population],['⚡ Energy',fx.energy],['😊 Happiness',fx.happiness],['💰 /min',fx.moneyRate],['🔬 /min',fx.researchRate]].filter(x=>x[1]);
      this.el.innerHTML=`<div class="p1-manager-head"><div><div class="p1-manager-title">${def.icon} ${def.name}</div><div class="p1-level-row">${Array.from({length:fx.maxLevel},(_,i)=>`<span class="p1-level-pip ${i<fx.level?'on':''}"></span>`).join('')}<b>Level ${fx.level}</b></div></div><button class="p1-manager-close" aria-label="Close">×</button></div><div class="p1-manager-effects">${effects.length?effects.map(e=>`<div class="p1-effect"><b>${e[0]}</b><div>${e[1]>0?'+':''}${e[1]}</div></div>`).join(''):'<div class="p1-effect">Civic utility structure</div>'}</div><div class="p1-manager-upgrade">${!complete?'🏗️ Construction in progress':max?'⭐ Maximum tier reached':`Next tier: +50% base output · cost 💰 ${cost}`}</div><div class="p1-manager-actions"><button class="p1-upgrade" ${(!complete||max)?'disabled':''}>⬆️ ${max?'Max level':`Upgrade · ${cost}`}</button><button class="p1-move">↔️ Move</button><button class="p1-remove" ${b.tile.buildingId==='camp'?'disabled':''}>🚧 Demolish</button></div><div class="p1-manager-note">${def.footprint.w}×${def.footprint.h} footprint · ${def.district} district · Level bonuses scale the building's base effects.</div>`;
      this.el.querySelector('.p1-manager-close').onclick=()=>this.close();this.el.querySelector('.p1-upgrade').onclick=()=>this.upgrade();this.el.querySelector('.p1-move').onclick=()=>this.move();this.el.querySelector('.p1-remove').onclick=()=>this.remove();
    }
  }
  C.BuildingManagementUI=BuildingManagementUI;
})(window.Codeopolis);
