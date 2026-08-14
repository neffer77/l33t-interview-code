(function(C){
  'use strict';
  class PhaserCityScene extends Phaser.Scene{
    constructor(){super({key:'CodeopolisCity'});this.tile=32;this.drag=null;this.pinch=null;this.ambient=[];this.buildingRefs=new Map();this.lastConstructionTick=0}
    init(data){this.adapter=data.adapter;this.world=data.world;this.snapshot=this.adapter.snapshot()}
    create(){
      this.assets=C.Phase44Assets;this.tile=this.assets.tileSize||32;this.generatePixelTextures();this.cameras.main.setBackgroundColor('#183b39');this.renderWorld();
      const cam=this.cameras.main,s=this.snapshot.camera||{};cam.setZoom(Math.max(.55,Math.min(2.5,s.zoom||1)));cam.scrollX=-(s.panX||0);cam.scrollY=-(s.panY||0);this.input.addPointer(2);
      this.input.on('pointerdown',p=>{const down=this.input.manager.pointers.filter(q=>q.isDown);if(down.length>=2){this.beginPinch(down[0],down[1]);this.drag=null;return}this.drag={id:p.id,x:p.x,y:p.y,sx:cam.scrollX,sy:cam.scrollY,moved:false}});
      this.input.on('pointermove',p=>{const down=this.input.manager.pointers.filter(q=>q.isDown);if(down.length>=2){this.updatePinch(down[0],down[1]);return}if(!p.isDown||!this.drag||this.drag.id!==p.id||this.pinch)return;const dx=p.x-this.drag.x,dy=p.y-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>7)this.drag.moved=true;cam.scrollX=this.drag.sx-dx/cam.zoom;cam.scrollY=this.drag.sy-dy/cam.zoom;this.persistCamera()});
      this.input.on('pointerup',p=>{const still=this.input.manager.pointers.filter(q=>q.isDown&&q.id!==p.id);if(this.pinch){if(still.length<2)this.pinch=null;this.drag=null;return}if(this.drag&&this.drag.id===p.id&&!this.drag.moved)this.selectPointer(p);this.drag=null});
      this.input.on('wheel',(_p,_g,_dx,dy)=>{cam.setZoom(Math.max(.55,Math.min(2.5,cam.zoom-dy*.001)));this.persistCamera()});this.scale.on('resize',()=>this.cameras.main.setViewport(0,0,this.scale.width,this.scale.height));
      C.events.on('world:selected',()=>this.refresh());C.events.on('world:road-changed',()=>this.refresh());C.events.on('world:building-placed',()=>this.refresh());C.events.on('world:building-unplaced',()=>this.refresh());
    }
    update(time){if(time-this.lastConstructionTick<120)return;this.lastConstructionTick=time;let complete=false;for(const [k,ref] of this.buildingRefs){if(ref.progress>=1)continue;const [x,y]=k.split(',').map(Number),tile=this.world.tile(x,y);if(!tile?.buildingId){complete=true;continue}const p=this.world.constructionProgress(tile);ref.progress=p;ref.image?.setAlpha(.45+.55*p);if(p>=1){ref.dust?.destroy();ref.dust=null;complete=true}}if(complete)this.snapshot=this.adapter.snapshot()}
    pixel(g,x,y,w,h,color,alpha=1){g.fillStyle(color,alpha);g.fillRect(x,y,w,h)}
    texture(key,draw,w=this.tile,h=this.tile){if(this.textures.exists(key))return;const g=this.make.graphics({x:0,y:0,add:false});draw(g);g.generateTexture(key,w,h);g.destroy()}
    generatePixelTextures(){
      const A=this.assets,t=this.tile;
      for(const [name,p] of Object.entries(A.terrain))for(let v=0;v<(A.variants[name]||1);v++){
        if(name==='water'){for(let f=0;f<2;f++)this.texture(`terrain-water-${v}-${f}`,g=>{this.pixel(g,0,0,t,t,p.base);for(let y=5+v*3+f*2;y<t;y+=9){this.pixel(g,(v*7+y)%15,y,12,2,p.light,.72);this.pixel(g,(v*11+y+10)%22,y+3,8,1,p.dark,.7)}this.pixel(g,0,t-2,t,2,p.dark)});const anim=`water-${v}`;if(!this.anims.exists(anim))this.anims.create({key:anim,frames:[{key:`terrain-water-${v}-0`},{key:`terrain-water-${v}-1`}],frameRate:2,repeat:-1})}
        else this.texture(`terrain-${name}-${v}`,g=>{this.pixel(g,0,0,t,t,p.base);this.pixel(g,0,t-2,t,2,p.dark,.45);const dots=name==='grass'?7:name==='dirt'?10:5;for(let i=0;i<dots;i++){const x=(i*11+v*7+3)%29,y=(i*17+v*5+4)%27,size=(i+v)%3===0?2:1;this.pixel(g,x,y,size,size,i%2?p.light:p.dark,.72)}if(name==='grass'){this.pixel(g,6+v*3,7,1,4,p.light,.8);this.pixel(g,5+v*3,8,1,1,p.accent,.8)}})
      }
      for(let v=0;v<3;v++)this.texture(`tree-${v}`,g=>{this.pixel(g,13,18,6,14,0x6c4930);this.pixel(g,7,9,18,14,0x285735);this.pixel(g,9,5,14,10,0x3c7845);this.pixel(g,12+v,4,8,6,0x5d9957);this.pixel(g,8,14,4,3,0x88b967)},32,36);
      for(let mask=0;mask<16;mask++)this.texture(`road-${mask}`,g=>{const R=A.roads;this.pixel(g,9,9,14,14,R.base);if(mask&1)this.pixel(g,9,0,14,16,R.base);if(mask&2)this.pixel(g,16,9,16,14,R.base);if(mask&4)this.pixel(g,9,16,14,16,R.base);if(mask&8)this.pixel(g,0,9,16,14,R.base);this.pixel(g,12,12,8,8,R.line,.22);if(mask&1)this.pixel(g,15,0,2,10,R.line,.45);if(mask&2)this.pixel(g,22,15,10,2,R.line,.45);if(mask&4)this.pixel(g,15,22,2,10,R.line,.45);if(mask&8)this.pixel(g,0,15,10,2,R.line,.45)});
      for(const [district,colors] of Object.entries(A.buildings))this.texture(`building-${district}`,g=>{const [wall,shadow,roof]=colors;this.pixel(g,5,17,22,25,shadow);this.pixel(g,8,13,18,27,wall);this.pixel(g,4,11,24,7,roof);this.pixel(g,7,8,18,5,roof);for(let y=20;y<=32;y+=7){this.pixel(g,11,y,4,4,0xcce7dc,.8);this.pixel(g,20,y,3,4,0xffd977,.75)}this.pixel(g,14,33,6,9,0x3b3140)},32,44);
      this.texture('building-unknown',g=>{this.pixel(g,6,15,20,27,0x5a5366);this.pixel(g,4,10,24,8,0x8a7f9c);this.pixel(g,14,20,4,13,0xffd166);this.pixel(g,14,35,4,4,0x2e2838)},32,44)
    }
    beginPinch(a,b){const c=this.cameras.main,dx=b.x-a.x,dy=b.y-a.y;this.pinch={distance:Math.max(1,Math.hypot(dx,dy)),zoom:c.zoom,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2,scrollX:c.scrollX,scrollY:c.scrollY}}
    updatePinch(a,b){if(!this.pinch)this.beginPinch(a,b);const c=this.cameras.main,p=this.pinch,dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),next=Math.max(.55,Math.min(2.5,p.zoom*(dist/p.distance))),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,worldX=p.scrollX+p.midX/p.zoom,worldY=p.scrollY+p.midY/p.zoom;c.setZoom(next);c.scrollX=worldX-mx/next;c.scrollY=worldY-my/next;this.persistCamera()}
    persistCamera(){const c=this.cameras.main,w=this.world.world.camera;w.zoom=c.zoom;w.panX=-c.scrollX;w.panY=-c.scrollY}
    selectPointer(p){const wp=p.positionToCamera(this.cameras.main),x=Math.floor(wp.x/this.tile),y=Math.floor(wp.y/this.tile);if(this.world.inside(x,y))this.world.select(x,y)}
    variant(x,y,count){let n=Math.imul(x+17,1103515245)^Math.imul(y+31,12345)^(this.snapshot.seed||1337);n=(n^(n>>>16))>>>0;return n%Math.max(1,count)}
    refresh(){this.snapshot=this.adapter.snapshot();this.tweens.killTweensOf(this.ambient);this.ambient=[];this.buildingRefs.clear();this.children.removeAll(true);this.renderWorld()}
    renderWorld(){
      const s=this.snapshot,t=this.tile;
      for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const terrain=s.terrain[y][x],count=this.assets.variants[terrain]||1,v=this.variant(x,y,count);if(terrain==='water'){const sprite=this.add.sprite(x*t+t/2,y*t+t/2,`terrain-water-${v}-0`).setDepth(0);sprite.play(`water-${v}`)}else this.add.image(x*t+t/2,y*t+t/2,`terrain-${terrain}-${v}`).setDepth(0);if(terrain==='forest'){const tree=this.add.image(x*t+t/2,y*t+t+4,`tree-${v%3}`).setOrigin(.5,1).setDepth(2+y*.001);this.ambient.push(tree);this.tweens.add({targets:tree,angle:{from:-1.2,to:1.2},duration:1800+v*250,yoyo:true,repeat:-1,ease:'Sine.easeInOut'})}}
      for(const r of s.roads)this.add.image(r.x*t+t/2,r.y*t+t/2,`road-${r.mask||0}`).setDepth(3);
      for(const b of s.buildings){const key=b.known&&this.assets.buildings[b.district]?`building-${b.district}`:b.known?'building-core':'building-unknown',img=this.add.image(b.x*t+t/2,b.y*t+t+7,key).setOrigin(.5,1).setDepth(6+b.y*.01);img.setAlpha(.45+.55*b.progress);let dust=null;if(b.progress<1){dust=this.add.rectangle(b.x*t+t/2,b.y*t+t/2,18,5,0xd9b26e,.38).setDepth(7);this.tweens.add({targets:dust,y:dust.y-8,alpha:0,duration:850,repeat:-1})}this.buildingRefs.set(`${b.x},${b.y}`,{image:img,dust,progress:b.progress,id:b.id})}
      if(s.selected){this.add.rectangle(s.selected.x*t+t/2,s.selected.y*t+t/2,t-2,t-2).setStrokeStyle(3,0xffdf72,1).setFillStyle(0xffffff,0).setDepth(20);const selectedBuilding=s.buildings.find(b=>b.x===s.selected.x&&b.y===s.selected.y);if(selectedBuilding)this.add.text(s.selected.x*t+t/2,s.selected.y*t-5,selectedBuilding.name,{fontFamily:'monospace',fontSize:'10px',color:'#fff3b0',backgroundColor:'#1b2730cc',padding:{x:4,y:2}}).setOrigin(.5,1).setDepth(21)}
      const d=s.diagnostics;if(d&&(d.outOfBounds||d.roadBuildingConflicts||d.unknownBuildings))console.warn('Codeopolis world compatibility diagnostics',d)
    }
  }
  C.PhaserCityScene=PhaserCityScene;
})(window.Codeopolis);
