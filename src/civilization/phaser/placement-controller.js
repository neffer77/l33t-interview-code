(function(C){
  'use strict';
  class PlacementController{
    constructor(scene,world){this.scene=scene;this.world=world;this.tile=scene.tile||32;this.preview=null;this.down=null;this.lastTile=null;this.bind()}
    bind(){
      const input=this.scene.input;
      input.on('pointerdown',p=>{this.down={id:p.id,x:p.x,y:p.y,moved:false}});
      input.on('pointermove',p=>{if(this.down&&this.down.id===p.id&&Math.abs(p.x-this.down.x)+Math.abs(p.y-this.down.y)>8)this.down.moved=true;this.updatePreview(p)});
      input.on('pointerup',p=>{const tap=this.down&&this.down.id===p.id&&!this.down.moved;this.down=null;if(tap)this.confirm(p)});
      C.events.on('world:tool',()=>this.refreshPreview());
      C.events.on('world:building-placed',()=>this.clearPreview());
      C.events.on('world:building-unplaced',()=>this.refreshPreview());
    }
    tool(){return this.world.world.tool||{mode:'inspect',buildingId:null}}
    pointerTile(p){const wp=p.positionToCamera(this.scene.cameras.main);return{x:Math.floor(wp.x/this.tile),y:Math.floor(wp.y/this.tile)}}
    updatePreview(p){const tool=this.tool();if(tool.mode!=='building'||!tool.buildingId){this.clearPreview();return}const tile=this.pointerTile(p);if(this.lastTile&&tile.x===this.lastTile.x&&tile.y===this.lastTile.y)return;this.lastTile=tile;this.drawPreview(tile.x,tile.y,tool.buildingId)}
    refreshPreview(){if(this.tool().mode!=='building')this.clearPreview();else if(this.lastTile)this.drawPreview(this.lastTile.x,this.lastTile.y,this.tool().buildingId)}
    clearPreview(){this.preview?.destroy?.();this.preview=null;this.lastTile=null}
    drawPreview(x,y,id){this.preview?.destroy?.();const verdict=this.world.canPlaceBuilding(id,x,y),def=C.BuildingRegistry.definition(this.world,id),g=this.scene.add.graphics().setDepth(50),ok=verdict.ok,color=ok?0x76e39a:0xff6b6b;g.fillStyle(color,.22);g.lineStyle(3,color,.95);for(const c of C.BuildingRegistry.cells(def,x,y)){g.fillRect(c.x*this.tile+2,c.y*this.tile+2,this.tile-4,this.tile-4);g.strokeRect(c.x*this.tile+2,c.y*this.tile+2,this.tile-4,this.tile-4)}const label=this.scene.add.text(x*this.tile+(def.footprint.w*this.tile)/2,y*this.tile-5,ok?`${def.icon} ${def.name}`:`✕ ${verdict.reason}`,{fontFamily:'monospace',fontSize:'10px',color:ok?'#d9ffe6':'#ffd8d8',backgroundColor:'#13202bdd',padding:{x:5,y:3}}).setOrigin(.5,1).setDepth(51);const container=this.scene.add.container(0,0,[g,label]).setDepth(50);this.preview=container}
    confirm(p){const tool=this.tool();if(tool.mode!=='building'||!tool.buildingId)return;const tile=this.pointerTile(p),r=this.world.placeBuilding(tool.buildingId,tile.x,tile.y);if(!r.ok){this.drawPreview(tile.x,tile.y,tool.buildingId);C.events.emit('placement:rejected',{...tile,id:tool.buildingId,reason:r.reason});return}this.world.setTool('inspect');this.world.select(tile.x,tile.y);try{typeof persist==='function'&&persist(false)}catch{}try{typeof render==='function'&&render()}catch{}this.scene.cameras.main.pan((tile.x+(r.footprint?.w||1)/2)*this.tile,(tile.y+(r.footprint?.h||1)/2)*this.tile,420,'Sine.easeInOut');C.events.emit('placement:confirmed',{...tile,id:tool.buildingId,footprint:r.footprint});this.clearPreview()}
  }
  C.PlacementController=PlacementController;
})(window.Codeopolis);
