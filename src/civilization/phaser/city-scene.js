(function(C){
  'use strict';
  class PhaserCityScene extends Phaser.Scene{
    constructor(){super({key:'CodeopolisCity'});this.tile=32;this.drag=null}
    init(data){this.adapter=data.adapter;this.world=data.world;this.snapshot=this.adapter.snapshot()}
    create(){
      this.cameras.main.setBackgroundColor('#132c31');this.renderWorld();
      const cam=this.cameras.main,s=this.snapshot.camera||{};cam.setZoom(Math.max(.55,Math.min(2.5,s.zoom||1)));cam.scrollX=-(s.panX||0);cam.scrollY=-(s.panY||0);
      this.input.on('pointerdown',p=>{this.drag={x:p.x,y:p.y,sx:cam.scrollX,sy:cam.scrollY,moved:false}});
      this.input.on('pointermove',p=>{if(!p.isDown||!this.drag)return;const dx=p.x-this.drag.x,dy=p.y-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>7)this.drag.moved=true;cam.scrollX=this.drag.sx-dx/cam.zoom;cam.scrollY=this.drag.sy-dy/cam.zoom;this.persistCamera()});
      this.input.on('pointerup',p=>{if(this.drag&&!this.drag.moved)this.selectPointer(p);this.drag=null});
      this.input.on('wheel',(_p,_g,_dx,dy)=>{cam.setZoom(Math.max(.55,Math.min(2.5,cam.zoom-dy*.001)));this.persistCamera()});
      this.scale.on('resize',()=>this.cameras.main.setViewport(0,0,this.scale.width,this.scale.height));
      C.events.on('world:selected',()=>this.refresh());C.events.on('world:road-changed',()=>this.refresh());C.events.on('world:building-placed',()=>this.refresh());C.events.on('world:building-unplaced',()=>this.refresh());
    }
    persistCamera(){const c=this.cameras.main,w=this.world.world.camera;w.zoom=c.zoom;w.panX=-c.scrollX;w.panY=-c.scrollY}
    selectPointer(p){const wp=p.positionToCamera(this.cameras.main),x=Math.floor(wp.x/this.tile),y=Math.floor(wp.y/this.tile);if(this.world.inside(x,y))this.world.select(x,y)}
    refresh(){this.snapshot=this.adapter.snapshot();this.children.removeAll(true);this.renderWorld()}
    renderWorld(){
      const s=this.snapshot,t=this.tile;
      for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
        const terrain=s.terrain[y][x],color={grass:0x477a4c,forest:0x285b3a,dirt:0x8b6845,water:0x397b9b}[terrain]||0x477a4c;
        const g=this.add.rectangle(x*t+t/2,y*t+t/2,t-1,t-1,color).setStrokeStyle(1,0x18382b,.35);g.setDepth(0);
        if(terrain==='forest')this.add.text(x*t+8,y*t+5,'♣',{fontSize:'17px',color:'#9ac66e'}).setDepth(1);
      }
      for(const r of s.roads)this.add.rectangle(r.x*t+t/2,r.y*t+t/2,t-5,t-5,0x59616a).setDepth(2);
      for(const b of s.buildings){const base=this.add.rectangle(b.x*t+t/2,b.y*t+t/2,t-5,t-5,0x33495f).setStrokeStyle(2,0xe4c46b,.75).setDepth(3);this.add.text(b.x*t+5,b.y*t+3,b.icon,{fontSize:'20px'}).setDepth(4);if(b.progress<1)base.setAlpha(.45+.55*b.progress)}
      if(s.selected)this.add.rectangle(s.selected.x*t+t/2,s.selected.y*t+t/2,t-2,t-2).setStrokeStyle(3,0xffdf72,1).setFillStyle(0xffffff,0).setDepth(10);
    }
  }
  C.PhaserCityScene=PhaserCityScene;
})(window.Codeopolis);
