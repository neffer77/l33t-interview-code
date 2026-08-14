(function(C){
  'use strict';
  class PlacementController{
    constructor(scene,world){this.scene=scene;this.world=world;this.tile=scene.tile||32;this.preview=null;this.down=null;this.lastTile=null;this.hud=null;this.bind();this.installHud();this.syncTool()}
    bind(){
      const input=this.scene.input;
      input.on('pointerdown',p=>{this.down={id:p.id,x:p.x,y:p.y,moved:false}});
      input.on('pointermove',p=>{if(this.down&&this.down.id===p.id&&Math.abs(p.x-this.down.x)+Math.abs(p.y-this.down.y)>8)this.down.moved=true;this.updatePreview(p)});
      input.on('pointerup',p=>{const tap=this.down&&this.down.id===p.id&&!this.down.moved;this.down=null;if(tap)this.confirm(p)});
      C.events.on('world:tool',()=>this.syncTool());
      C.events.on('world:building-placed',()=>this.clearPreview());
      C.events.on('world:building-unplaced',()=>this.refreshPreview());
      C.events.on('placement:rejected',e=>this.setHudStatus(e.reason,false));
    }
    tool(){return this.world.world.tool||{mode:'inspect',buildingId:null}}
    installHud(){
      const host=this.scene.game?.canvas?.parentElement;if(!host||host.querySelector('.p1-placement-hud'))return;
      host.style.position=host.style.position||'relative';const hud=document.createElement('div');hud.className='p1-placement-hud';hud.style.cssText='position:absolute;left:10px;right:10px;bottom:10px;z-index:30;display:none;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;background:rgba(13,28,35,.92);border:1px solid rgba(255,255,255,.16);border-radius:10px;color:#fff;font:12px system-ui;backdrop-filter:blur(8px);pointer-events:auto';hud.innerHTML='<div><b data-placement-title>Place building</b><div data-placement-status style="opacity:.75;margin-top:2px">Move over the map, then tap a green footprint.</div></div><button type="button" data-placement-cancel style="min-width:72px;min-height:42px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#243944;color:#fff;font-weight:800">Cancel</button>';host.appendChild(hud);hud.querySelector('[data-placement-cancel]').onclick=()=>{this.world.setTool('inspect');this.clearPreview()};this.hud=hud;
    }
    setHudStatus(text,ok=true){if(!this.hud)return;const el=this.hud.querySelector('[data-placement-status]');if(el){el.textContent=text;el.style.color=ok?'#b8f6ca':'#ffb5b5'}}
    syncTool(){
      const tool=this.tool(),placing=tool.mode==='building'&&tool.buildingId;if(this.hud)this.hud.style.display=placing?'flex':'none';
      if(placing){const def=C.BuildingRegistry.definition(this.world,tool.buildingId),title=this.hud?.querySelector('[data-placement-title]');if(title)title.textContent=`${def.icon} Place ${def.name} · ${def.footprint.w}×${def.footprint.h}`;this.setHudStatus('Move over the map, then tap a green footprint.',true);try{if(typeof switchTab==='function')switchTab('city')}catch{}requestAnimationFrame(()=>{const shell=document.querySelector('#codeopolisIonicShell');if(shell)shell.dataset.view='city'});this.refreshPreview()}else this.clearPreview();
    }
    pointerTile(p){const wp=p.positionToCamera(this.scene.cameras.main);return{x:Math.floor(wp.x/this.tile),y:Math.floor(wp.y/this.tile)}}
    updatePreview(p){const tool=this.tool();if(tool.mode!=='building'||!tool.buildingId){this.clearPreview();return}const tile=this.pointerTile(p);if(this.lastTile&&tile.x===this.lastTile.x&&tile.y===this.lastTile.y)return;this.lastTile=tile;this.drawPreview(tile.x,tile.y,tool.buildingId)}
    refreshPreview(){if(this.tool().mode!=='building')this.clearPreview();else if(this.lastTile)this.drawPreview(this.lastTile.x,this.lastTile.y,this.tool().buildingId)}
    clearPreview(){this.preview?.destroy?.();this.preview=null;this.lastTile=null}
    drawPreview(x,y,id){this.preview?.destroy?.();const verdict=this.world.canPlaceBuilding(id,x,y),def=C.BuildingRegistry.definition(this.world,id),g=this.scene.add.graphics().setDepth(50),ok=verdict.ok,color=ok?0x76e39a:0xff6b6b;g.fillStyle(color,.22);g.lineStyle(3,color,.95);for(const c of C.BuildingRegistry.cells(def,x,y)){g.fillRect(c.x*this.tile+2,c.y*this.tile+2,this.tile-4,this.tile-4);g.strokeRect(c.x*this.tile+2,c.y*this.tile+2,this.tile-4,this.tile-4)}const label=this.scene.add.text(x*this.tile+(def.footprint.w*this.tile)/2,y*this.tile-5,ok?`${def.icon} ${def.name}`:`✕ ${verdict.reason}`,{fontFamily:'monospace',fontSize:'10px',color:ok?'#d9ffe6':'#ffd8d8',backgroundColor:'#13202bdd',padding:{x:5,y:3}}).setOrigin(.5,1).setDepth(51);this.preview=this.scene.add.container(0,0,[g,label]).setDepth(50);this.setHudStatus(ok?'Tap to construct':verdict.reason,ok)}
    confirm(p){const tool=this.tool();if(tool.mode!=='building'||!tool.buildingId)return;const tile=this.pointerTile(p),r=this.world.placeBuilding(tool.buildingId,tile.x,tile.y);if(!r.ok){this.drawPreview(tile.x,tile.y,tool.buildingId);C.events.emit('placement:rejected',{...tile,id:tool.buildingId,reason:r.reason});return}this.world.setTool('inspect');this.world.select(tile.x,tile.y);try{typeof persist==='function'&&persist(false)}catch{}try{typeof render==='function'&&render()}catch{}this.scene.cameras.main.pan((tile.x+(r.footprint?.w||1)/2)*this.tile,(tile.y+(r.footprint?.h||1)/2)*this.tile,420,'Sine.easeInOut');C.events.emit('placement:confirmed',{...tile,id:tool.buildingId,footprint:r.footprint});this.clearPreview()}
  }
  C.PlacementController=PlacementController;
})(window.Codeopolis);
