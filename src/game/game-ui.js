(function(C){
  'use strict';
  const ROAD_COST=15;
  class GameUI{
    constructor(world,camera,renderer,audio,rewards){this.world=world;this.camera=camera;this.renderer=renderer;this.audio=audio;this.rewards=rewards;this.rewardTimer=null;this.install();this.bindEvents()}
    install(){
      const canvas=document.getElementById('cityCanvas');if(!canvas)return;
      if(!canvas.parentElement.classList.contains('city-stage')){
        const stage=document.createElement('div');stage.className='city-stage';canvas.parentNode.insertBefore(stage,canvas);stage.appendChild(canvas);
        const toolbar=document.createElement('div');toolbar.id='cityToolbar';toolbar.className='city-toolbar';stage.appendChild(toolbar);
        const tip=document.createElement('div');tip.id='cityHoverTip';tip.className='city-hover-tip hidden';stage.appendChild(tip);
      }
      if(!document.getElementById('rewardOverlay')){
        const overlay=document.createElement('div');overlay.id='rewardOverlay';overlay.className='reward-overlay';overlay.innerHTML='<div class="reward-card" id="rewardCard"></div>';document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close-reward]'))this.hideReward()});
      }
      const stats=document.querySelector('.top .stats');if(stats&&!document.getElementById('momentumPill')){const pill=document.createElement('div');pill.id='momentumPill';pill.className='pill momentum-pill';stats.appendChild(pill)}
      this.camera.onTap=(tile)=>this.handleTileTap(tile);this.camera.onHover=(tile)=>this.handleHover(tile);this.refresh();
    }
    bindEvents(){
      C.events.on('reward:celebration',e=>this.showReward(e));C.events.on('reward:micro',e=>this.toast(`🧠 ${e.label} · Momentum ${e.momentum}`));
      C.events.on('world:selected',()=>this.refreshInspector());C.events.on('world:tool',()=>this.refresh());C.events.on('audio:muted',()=>this.refreshToolbar());
      C.events.on('world:building-placed',e=>{this.audio?.build();this.toast(`${e.def?.icon||'🏗️'} Construction started: ${e.def?.name||e.id}`)});
    }
    tool(){return this.world.world.tool||{mode:'inspect',buildingId:null}}
    setTool(mode,buildingId=null){this.world.setTool(mode,buildingId);this.audio?.click();this.refresh()}
    refresh(){this.refreshToolbar();this.refreshMomentum();this.decorateBuildTab();this.decorateCityTab()}
    refreshMomentum(){const el=document.getElementById('momentumPill');if(el)el.innerHTML=`⚡ Momentum <b>${Math.round(this.rewards.meta.momentum)}</b>`}
    refreshToolbar(){
      const el=document.getElementById('cityToolbar');if(!el)return;const t=this.tool(),label=t.mode==='building'?`Place ${this.world.buildingDef(t.buildingId)?.name||'building'}`:t.mode==='road'?'Build road':t.mode==='bulldoze'?'Remove road':'Inspect';
      el.innerHTML=`<div class="city-tool-status"><span class="tool-dot ${t.mode}"></span><b>${label}</b><small>${t.mode==='inspect'?'Tap a tile · drag to pan · pinch/scroll to zoom':t.mode==='road'?`Roads cost 💰 ${ROAD_COST} per tile`:'Tap a valid tile to place'}</small></div><div class="city-camera-actions"><button class="icon-btn" data-city-action="zoom-out" aria-label="Zoom out">−</button><button class="icon-btn" data-city-action="reset" aria-label="Reset camera">⌂</button><button class="icon-btn" data-city-action="zoom-in" aria-label="Zoom in">+</button><button class="icon-btn" data-city-action="sound" aria-label="Toggle sound">${this.audio?.muted?'🔇':'🔊'}</button></div>`;
      el.querySelectorAll('[data-city-action]').forEach(b=>b.onclick=()=>{const action=b.dataset.cityAction;if(action==='zoom-in')this.camera.zoomBy(1.15);if(action==='zoom-out')this.camera.zoomBy(.87);if(action==='reset')this.world.resetCamera();if(action==='sound')this.audio?.toggle();this.audio?.click();this.refreshToolbar()});
    }
    decorateBuildTab(){const root=document.getElementById('buildTab');if(!root||root.querySelector('.phase6-build-note'))return;root.insertAdjacentHTML('afterbegin','<div class="phase6-build-note">🏗️ <b>Phase 6 placement:</b> buying a building adds it to your city inventory, then switches you to placement mode on the interactive map.</div>')}
    decorateCityTab(){
      const root=document.getElementById('cityTab');if(!root)return;let panel=root.querySelector('.phase6-city-controls');if(!panel){panel=document.createElement('div');panel.className='phase6-city-controls';root.insertAdjacentElement('afterbegin',panel)}
      const inv=this.world.inventory().filter(x=>x.id!=='camp');const t=this.tool();
      panel.innerHTML=`<div class="city-control-head"><div><h3>🗺️ City Planner</h3><div class="muted">Your solved patterns shape the skyline. Place owned buildings and connect districts with roads.</div></div><div class="city-planner-tools"><button class="btn mini ${t.mode==='inspect'?'active-tool':''}" data-tool="inspect">👆 Inspect</button><button class="btn mini ${t.mode==='road'?'active-tool':''}" data-tool="road">🛣️ Road · ${ROAD_COST}</button><button class="btn mini ${t.mode==='bulldoze'?'active-tool':''}" data-tool="bulldoze">🚧 Remove road</button></div></div><div class="placement-inventory"><b>Placement inventory</b><div class="inventory-buttons">${inv.length?inv.map(v=>`<button class="btn inventory-btn ${t.mode==='building'&&t.buildingId===v.id?'active-tool':''}" data-building="${v.id}">${v.def?.icon||'🏢'} ${v.def?.name||v.id} <span>×${v.count}</span></button>`).join(''):'<span class="muted">Everything you own is placed. Buy another building to expand.</span>'}</div></div><div id="tileInspector" class="tile-inspector"></div>`;
      panel.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>this.setTool(b.dataset.tool));panel.querySelectorAll('[data-building]').forEach(b=>b.onclick=()=>this.setTool('building',b.dataset.building));this.refreshInspector();
    }
    refreshInspector(){
      const el=document.getElementById('tileInspector');if(!el)return;const s=this.world.selectedTile();if(!s){el.innerHTML='<span class="muted">Select a tile on the map to inspect it.</span>';return}
      const def=s.buildingId?this.world.buildingDef(s.buildingId):null;
      el.innerHTML=`<div><span class="tag">Tile ${s.x}, ${s.y}</span> ${s.road?'<span class="tag">Road</span>':''}</div><div class="tile-inspector-body">${def?`<div class="inspector-icon">${def.icon||'🏢'}</div><div><b>${def.name||s.buildingId}</b><div class="muted">${def.district||'core'} district</div>${s.buildingId!=='camp'?'<button class="btn mini" data-move-building>Move building</button>':''}</div>`:`<div class="muted">${s.road?'Connected road tile.':'Open land ready for construction.'}</div>`}</div>`;
      const move=el.querySelector('[data-move-building]');if(move)move.onclick=()=>{const result=this.world.unplaceBuilding(s.x,s.y);if(result.ok){this.world.setTool('building',result.id);persist(false);this.refresh();this.toast('Building picked up. Tap a new tile to relocate it.')}};
    }
    handleHover(tile){this.renderer.setHover(tile);const tip=document.getElementById('cityHoverTip');if(!tip)return;if(!this.world.inside(tile.x,tile.y)){tip.classList.add('hidden');return}const t=this.world.tile(tile.x,tile.y),def=t?.buildingId?this.world.buildingDef(t.buildingId):null;tip.textContent=def?`${def.icon||'🏢'} ${def.name}`:t?.road?'🛣️ Road':`Tile ${tile.x}, ${tile.y}`;tip.classList.remove('hidden')}
    handleTileTap(tile){
      if(!this.world.inside(tile.x,tile.y))return;const tool=this.tool();
      if(tool.mode==='inspect'){this.world.select(tile.x,tile.y);persist(false);this.refreshInspector();return}
      if(tool.mode==='road'){
        const existing=this.world.tile(tile.x,tile.y);if(existing?.road){this.world.select(tile.x,tile.y);this.toast('Road already built here.');return}
        if((state.money||0)<ROAD_COST){this.toast('Not enough money for this road tile.');return}
        const r=this.world.setRoad(tile.x,tile.y,true);if(!r.ok){this.toast(r.reason);return}state.money-=ROAD_COST;this.world.select(tile.x,tile.y);persist(false);render();this.audio?.build();return;
      }
      if(tool.mode==='bulldoze'){
        const existing=this.world.tile(tile.x,tile.y);if(!existing?.road){this.toast('There is no road on this tile.');return}this.world.setRoad(tile.x,tile.y,false);persist(false);render();return;
      }
      if(tool.mode==='building'){
        const r=this.world.placeBuilding(tool.buildingId,tile.x,tile.y);if(!r.ok){this.toast(r.reason);return}persist(false);this.world.setTool('inspect');render();this.renderer.focus({x:tile.x,y:tile.y},550);return;
      }
    }
    showReward(e){
      const overlay=document.getElementById('rewardOverlay'),card=document.getElementById('rewardCard');if(!overlay||!card)return;clearTimeout(this.rewardTimer);
      const title=e.first?(e.difficulty>=3?'LEGENDARY SOLVE':'MISSION MASTERED'):'MASTERY REINFORCED';
      card.innerHTML=`<button class="reward-close" data-close-reward aria-label="Close">×</button><div class="reward-kicker">${e.first?'NEW KNOWLEDGE':'SPACED PRACTICE'}</div><div class="reward-title">${title}</div><div class="reward-problem">${e.challenge.title}</div><div class="reward-pattern">${e.challenge.pattern}</div><div class="reward-grid"><div><span>💰</span><b>+${Math.max(0,e.moneyDelta)}</b><small>credits</small></div><div><span>🔬</span><b>+${Math.max(0,e.researchDelta)}</b><small>research</small></div><div><span>🏙️</span><b>+${Math.max(0,e.masteryDelta)}</b><small>district XP</small></div><div><span>⚡</span><b>${e.momentum}</b><small>momentum</small></div></div>${e.breakthrough?`<div class="breakthrough"><span>✨ RESEARCH BREAKTHROUGH</span><b>${e.breakthrough.title}</b><p>${e.breakthrough.text}</p><small>+${e.breakthrough.researchBonus} bonus research</small></div>`:''}<button class="btn primary reward-continue" data-close-reward>Return to Codeopolis</button>`;
      overlay.classList.add('show',`intensity-${Math.min(4,e.intensity)}`);if(Number.isFinite(e.x))this.renderer.focus({x:e.x,y:e.y},800);this.rewardTimer=setTimeout(()=>this.hideReward(),7000);
    }
    hideReward(){const o=document.getElementById('rewardOverlay');if(o)o.className='reward-overlay';clearTimeout(this.rewardTimer)}
    toast(message){let t=document.getElementById('gameToast');if(!t){t=document.createElement('div');t.id='gameToast';t.className='game-toast';document.body.appendChild(t)}t.textContent=message;t.classList.remove('show');requestAnimationFrame(()=>t.classList.add('show'));clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
  }
  C.register('GameUI',GameUI);
})(window.Codeopolis);
