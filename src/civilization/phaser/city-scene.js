(function(C){
  'use strict';
  // Optional hand-drawn sprite atlas. Any frame it provides replaces the
  // procedurally generated texture of the same name; anything it lacks still
  // falls back to generatePixelTextures(), so the game renders correctly with
  // no assets/ folder at all.
  const ATLAS='city';
  class PhaserCityScene extends Phaser.Scene{
    constructor(){super({key:'CodeopolisCity'});this.tile=64;this.drag=null;this.pinch=null;this.ambient=[];this.buildingRefs=new Map();this.lastConstructionTick=0}
    init(data){this.adapter=data.adapter;this.world=data.world;this.snapshot=this.adapter.snapshot()}
    preload(){this.load.atlas(ATLAS,'assets/city.png','assets/city.json')}
    // Frame names present in the atlas. Empty when the atlas failed to load.
    art(){return this.atlasFrames||(this.atlasFrames=this.textures.exists(ATLAS)?new Set(this.textures.get(ATLAS).getFrameNames()):new Set())}
    hasArt(key){return this.art().has(key)}
    // Draw from the atlas when it has this key, otherwise the generated texture.
    sprite(x,y,key){return this.hasArt(key)?this.add.image(x,y,ATLAS,key):this.add.image(x,y,key)}
    create(){
      this.assets=C.Phase44Assets;this.iso=C.PixelWorldProjection;this.layout=this.iso.layout(this.snapshot.width,this.snapshot.height);this.tile=this.layout.tileW;this.generatePixelTextures();this.cameras.main.setBackgroundColor('#3f5138');this.renderWorld();
      const cam=this.cameras.main,s=this.world.world.camera||{};if(s.projection==='iso-pixel-v1'){cam.setZoom(Math.max(.55,Math.min(2.5,s.zoom||1)));cam.scrollX=-(s.panX||0);cam.scrollY=-(s.panY||0)}else{const fit=Math.max(.62,Math.min(1.05,(this.scale.width||390)/(this.layout.worldWidth*.92)));cam.setZoom(fit);cam.centerOn(this.layout.worldWidth/2,this.layout.worldHeight/2);s.projection='iso-pixel-v1';this.persistCamera()}
      cam.setBounds(0,0,this.layout.worldWidth,this.layout.worldHeight,true);this.input.addPointer(2);
      this.input.on('pointerdown',p=>{const down=this.input.manager.pointers.filter(q=>q.isDown);if(down.length>=2){this.beginPinch(down[0],down[1]);this.drag=null;return}this.drag={id:p.id,x:p.x,y:p.y,sx:cam.scrollX,sy:cam.scrollY,moved:false}});
      this.input.on('pointermove',p=>{const down=this.input.manager.pointers.filter(q=>q.isDown);if(down.length>=2){this.updatePinch(down[0],down[1]);return}if(!p.isDown||!this.drag||this.drag.id!==p.id||this.pinch)return;const dx=p.x-this.drag.x,dy=p.y-this.drag.y;if(Math.abs(dx)+Math.abs(dy)>7)this.drag.moved=true;cam.scrollX=this.drag.sx-dx/cam.zoom;cam.scrollY=this.drag.sy-dy/cam.zoom;this.persistCamera()});
      this.input.on('pointerup',p=>{const still=this.input.manager.pointers.filter(q=>q.isDown&&q.id!==p.id);if(this.pinch){if(still.length<2)this.pinch=null;this.drag=null;return}if(this.drag&&this.drag.id===p.id&&!this.drag.moved)this.selectPointer(p);this.drag=null});
      this.input.on('wheel',(_p,_g,_dx,dy)=>{cam.setZoom(Math.max(.55,Math.min(2.5,cam.zoom-dy*.001)));this.persistCamera()});this.scale.on('resize',()=>this.cameras.main.setViewport(0,0,this.scale.width,this.scale.height));
      for(const evt of ['world:selected','world:road-changed','world:building-placed','world:building-unplaced','world:building-upgraded'])C.events.on(evt,()=>this.refresh());
      C.events?.emit?.('r2:pixel-world-ready',{projection:this.assets.projection,tileWidth:this.layout.tileW,tileHeight:this.layout.tileH,worldWidth:this.layout.worldWidth,worldHeight:this.layout.worldHeight});
    }
    toWorld(x,y){return this.iso.toWorld(x,y,this.layout)}
    fromWorld(x,y){return this.iso.fromWorld(x,y,this.layout)}
    tilePolygon(x,y){return this.iso.corners(x,y,this.layout)}
    update(time){if(time-this.lastConstructionTick<120)return;this.lastConstructionTick=time;let complete=false;for(const [k,ref] of this.buildingRefs){if(ref.progress>=1)continue;const [x,y]=k.split(',').map(Number),tile=this.world.tile(x,y);if(!tile?.buildingId){complete=true;continue}const p=this.world.constructionProgress(tile);ref.progress=p;ref.image?.setAlpha(.45+.55*p);if(p>=1){ref.dust?.destroy();ref.dust=null;this.celebrateBuild(ref.image);complete=true}}if(complete)this.snapshot=this.adapter.snapshot()}
    celebrateBuild(img){if(!img||!img.active||!this.tweens)return;const sx=img.scaleX||1,sy=img.scaleY||1;this.tweens.add({targets:img,scaleX:sx*1.22,scaleY:sy*1.22,duration:160,yoyo:true,ease:'Back.easeOut'});if(img.setTintFill){img.setTintFill(0xfff2b0);this.time?.delayedCall?.(120,()=>{if(img&&img.active)img.clearTint()})}if(!this.add)return;const dep=(img.depth||0)+50,bx=img.x,by=img.y+2;if(this.add.ellipse){const ring=this.add.ellipse(bx,by,34,17,0xffe6a3,0);if(ring.setStrokeStyle){ring.setStrokeStyle(2.5,0xffe6a3,.95);ring.setDepth(dep);this.tweens.add({targets:ring,scaleX:2.6,scaleY:2.6,alpha:0,duration:520,ease:'Cubic.easeOut',onComplete:()=>ring.destroy&&ring.destroy()})}for(let i=0;i<6;i++){const a=(-Math.PI/2)+(i-2.5)*0.5,d=14+Math.random()*10,sp=this.add.ellipse(bx,by-6,3,3,0xfff2b0,.95);if(!sp)break;sp.setDepth(dep+1);this.tweens.add({targets:sp,x:bx+Math.cos(a)*d,y:(by-6)+Math.sin(a)*d-10,alpha:0,scaleX:.2,scaleY:.2,duration:430+Math.random()*160,ease:'Cubic.easeOut',onComplete:()=>sp.destroy&&sp.destroy()})}}}
    pixel(g,x,y,w,h,color,alpha=1){g.fillStyle(color,alpha);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
    texture(key,draw,w=64,h=64){if(this.hasArt(key)||this.textures.exists(key))return;const g=this.make.graphics({x:0,y:0,add:false});draw(g);g.generateTexture(key,w,h);g.destroy()}
    diamond(g,color,alpha=1,y0=0){g.fillStyle(color,alpha);g.fillTriangle(32,y0,64,y0+16,32,y0+32);g.fillTriangle(32,y0,32,y0+32,0,y0+16)}
    generatePixelTextures(){
      const A=this.assets;
      for(const [name,p] of Object.entries(A.terrain))for(let v=0;v<(A.variants[name]||1);v++)for(let f=0;f<(name==='water'?2:1);f++)this.texture(`terrain-${name}-${v}-${f}`,g=>{const base=(p.patch&&p.patch[v%p.patch.length])||p.base;this.diamond(g,base);
        // No hard grid outline on land — the tonal patchwork carries the tiling.
        // Water keeps a soft rim so the pond reads as recessed.
        if(name==='water'){g.lineStyle(1,p.edge,.5);g.strokePoints([{x:32,y:0},{x:63,y:16},{x:32,y:31},{x:1,y:16}],true)}
        const dots=name==='grass'?7:name==='dirt'?9:name==='forest'?6:4;for(let i=0;i<dots;i++){const xx=13+((i*17+v*9)%38),yy=8+((i*7+v*5)%15);this.pixel(g,xx,yy,(i+v)%3===0?3:2,1,i%2?p.light:p.dark,.5)}if(name==='water'){for(let i=0;i<3;i++){const yy=8+i*6+f*2,xx=17+((i*13+v*7)%18);this.pixel(g,xx,yy,13,1,p.light,.8)}}if(name==='grass'&&v%2===0){this.pixel(g,20+v,10,2,3,p.accent,.7);this.pixel(g,42-v,20,2,2,p.dark,.5)}},64,32);
      for(let v=0;v<5;v++)this.texture(`tree-${v}`,g=>{const P=A.props;
        g.fillStyle(0x24352e,.30);g.fillEllipse(24,57,26,8);// ground shadow so it sits on the tile
        this.pixel(g,22,40,5,17,P.treeTrunk);this.pixel(g,25,40,2,17,P.treeDark,.5);// trunk + shaded side
        // rounded canopy silhouette built from tapering rows (not stacked boxes)
        const rows=[[6,19,10],[10,15,18],[14,11,26],[18,9,30],[23,9,30],[28,11,26],[33,15,18],[37,19,10]];
        for(const row of rows)this.pixel(g,row[1],row[0],row[2],5,P.treeMid);
        this.pixel(g,24,20,16,16,P.treeDark,.5);this.pixel(g,26,32,12,6,P.treeDark,.45);// shadow on lower-right
        this.pixel(g,12+v%3,10,12,10,P.treeLight,.9);this.pixel(g,16,15,7,6,P.treeLight,.7);// highlight upper-left
        if(P.treeRim!==undefined){this.pixel(g,11,9,3,2,P.treeRim,.95);this.pixel(g,9,12,2,5,P.treeRim,.8);this.pixel(g,13,7,4,2,P.treeRim,.7)}// warm sunlit rim
        this.pixel(g,14+(v*5)%16,22,3,3,P.treeDark,.5);this.pixel(g,21+(v*3)%10,29,3,3,P.treeDark,.45);// foliage clumps, varied per tree
      },48,64);
      for(let mask=0;mask<16;mask++)this.texture(`road-${mask}`,g=>{const R=A.roads;
        // Ribbon roads: no full-diamond fill (that made every cell a tan blob that read
        // as a muddy trail). Draw only spokes toward connected neighbours so the terrain
        // shows through around a paved surface with a dark curb and a dashed centreline.
        /* Aim each spoke at the MIDPOINT OF THE SHARED EDGE, not the diamond's corner. roadMask sets bit 1 for neighbour (x,y-1), 2 for (x+1,y), 4 for (x,y+1) and 8 for (x-1,y); in screen space those sit across the tile's four edges, whose midpoints are (48,8) (48,24) (16,24) and (16,8). The old targets were the four vertices — 17.9px off each — so a spoke stopped at a corner while the neighbour's opposing spoke stopped at its own corner ~36px away. They never met; the road only looked joined because a 16px stroke is fat enough to smear over the gap, which is what made the paths read lumpy. Ending on the shared edge makes adjacent tiles join exactly. */const dirs=[[1,48,8],[2,48,24],[4,16,24],[8,16,8]];
        const spoke=(w,color,alpha)=>{g.lineStyle(w,color,alpha);for(const d of dirs){if(mask&d[0]){g.beginPath();g.moveTo(32,16);g.lineTo(d[1],d[2]);g.strokePath()}}};
        spoke(16,R.edge,1);   // curb (dark outer)
        spoke(11,R.base,1);   // paved surface
        spoke(4,R.dark,.5);   // subtle crown shading
        /* A dark disc with a lighter disc inside is a RING, and stamping one at every road tile centre printed a concentric ring the length of every road. The spokes are 16px and 11px wide and all radiate from the centre, so they already cover it — the pad is only needed for an isolated tile with no spokes at all. */if(!mask){g.fillStyle(R.edge,1);g.fillCircle(32,16,9);g.fillStyle(R.base,1);g.fillCircle(32,16,6)}// junction hub / isolated pad
        let ci=0;for(const d of dirs){if(!(mask&d[0]))continue;for(let t=.28;t<.92;t+=.2)this.pixel(g,Math.round(32+(d[1]-32)*t)-1,Math.round(16+(d[2]-16)*t)-1,2,2,(ci++%2)?R.line:R.dark,.75)}// warm cobble specks
      },64,32);
      for(const [district,colors] of Object.entries(A.buildings))this.texture(`building-${district}`,g=>{const [wall,shadow,roof]=colors,W=A.windows;g.fillStyle(0x25342e,.34);g.fillEllipse(32,58,43,11);this.pixel(g,12,31,20,24,shadow);this.pixel(g,32,31,20,24,wall);g.fillStyle(roof,1);g.fillTriangle(8,31,32,16,32,39);g.fillTriangle(32,16,56,31,32,39);
        this.pixel(g,42,19,5,10,shadow);this.pixel(g,42,19,5,3,roof);// chimney on the ridge
        this.pixel(g,16,37,10,11,W.glow,.45);this.pixel(g,37,36,10,11,W.glow,.45);// warm glow halos
        this.pixel(g,18,39,6,7,W.lit,1);this.pixel(g,39,38,6,7,W.lit,1);// lit window panes
        this.pixel(g,27,44,8,12,W.door,1);this.pixel(g,29,46,4,8,W.lit,.8)},64,64);// lit doorway
      this.texture('building-unknown',g=>{g.fillStyle(0x26352e,.35);g.fillEllipse(32,58,43,11);this.pixel(g,13,31,19,24,0x575d67);this.pixel(g,32,31,19,24,0x747c86);g.fillStyle(0xa49a86,1);g.fillTriangle(8,31,32,17,32,39);g.fillTriangle(32,17,56,31,32,39)},64,64);
    }
    beginPinch(a,b){const c=this.cameras.main,dx=b.x-a.x,dy=b.y-a.y;this.pinch={distance:Math.max(1,Math.hypot(dx,dy)),zoom:c.zoom,midX:(a.x+b.x)/2,midY:(a.y+b.y)/2,scrollX:c.scrollX,scrollY:c.scrollY}}
    updatePinch(a,b){if(!this.pinch)this.beginPinch(a,b);const c=this.cameras.main,p=this.pinch,dx=b.x-a.x,dy=b.y-a.y,dist=Math.max(1,Math.hypot(dx,dy)),next=Math.max(.55,Math.min(2.5,p.zoom*(dist/p.distance))),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,worldX=p.scrollX+p.midX/p.zoom,worldY=p.scrollY+p.midY/p.zoom;c.setZoom(next);c.scrollX=worldX-mx/next;c.scrollY=worldY-my/next;this.persistCamera()}
    persistCamera(){const c=this.cameras.main,w=this.world.world.camera;w.zoom=c.zoom;w.panX=-c.scrollX;w.panY=-c.scrollY;w.projection='iso-pixel-v1'}
    selectPointer(p){const wp=p.positionToCamera(this.cameras.main),q=this.fromWorld(wp.x,wp.y);if(this.world.inside(q.x,q.y))this.world.select(q.x,q.y)}
    variant(x,y,count,salt=0){let n=Math.imul(x+17+salt,1103515245)^Math.imul(y+31,12345)^(this.snapshot.seed||1337);n=(n^(n>>>16))>>>0;return n%Math.max(1,count)}
    decorateTile(x,y,terrain,occupied){if(occupied||terrain==='water')return;const p=this.toWorld(x,y),roll=this.variant(x,y,1000,71)/1000,P=this.assets.props,d=this.iso.depth(x,y,8);if(terrain==='forest'||roll<.10){const tree=this.sprite(p.x,p.y+9,`tree-${this.variant(x,y,5,9)}`).setOrigin(.5,.92).setDepth(d+12);this.ambient.push(tree);return}if(roll<.18){const g=this.add.graphics().setDepth(d+3);g.fillStyle(P.flowerA,1);g.fillRect(p.x-7,p.y-4,2,2);g.fillStyle(P.flowerB,1);g.fillRect(p.x+5,p.y+3,2,2);g.fillStyle(0x497544,1);g.fillRect(p.x-6,p.y-2,1,3);this.ambient.push(g)}else if(roll<.24){const g=this.add.graphics().setDepth(d+3);g.fillStyle(P.stone,1);g.fillRect(p.x-5,p.y-2,8,4);g.fillStyle(P.stoneLight,.8);g.fillRect(p.x-3,p.y-3,4,2);this.ambient.push(g)}}
    refresh(){this.snapshot=this.adapter.snapshot();this.layout=this.iso.layout(this.snapshot.width,this.snapshot.height);this.tweens.killTweensOf(this.ambient);this.ambient=[];this.buildingRefs.clear();this.children.removeAll(true);this.renderWorld()}
    renderWorld(){
      const s=this.snapshot;
      for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const terrain=s.terrain[y][x],v=this.variant(x,y,this.assets.variants[terrain]||1),p=this.toWorld(x,y),key=`terrain-${terrain}-${v}-${terrain==='water'?this.variant(x,y,2,33):0}`,img=this.sprite(p.x,p.y,key).setDepth(this.iso.depth(x,y,0));if(terrain==='water')this.tweens.add({targets:img,alpha:{from:.88,to:1},duration:1300+v*120,yoyo:true,repeat:-1});const occupied=!!this.world.tile(x,y)?.buildingId||!!this.world.tile(x,y)?.road;this.decorateTile(x,y,terrain,occupied)}
      for(const r of s.roads){const p=this.toWorld(r.x,r.y);this.sprite(p.x,p.y,`road-${r.mask||0}`).setDepth(this.iso.depth(r.x,r.y,4))}
      for(const b of s.buildings){const p=this.toWorld(b.x,b.y),key=b.known&&this.assets.buildings[b.district]?`building-${b.district}`:b.known?'building-core':'building-unknown',img=this.sprite(p.x,p.y+9,key).setOrigin(.5,.86).setDepth(this.iso.depth(b.x,b.y,30));img.setAlpha(.45+.55*b.progress);let dust=null;if(b.progress<1){dust=this.add.rectangle(p.x,p.y-2,24,6,0xd9b26e,.4).setDepth(this.iso.depth(b.x,b.y,40));this.tweens.add({targets:dust,y:dust.y-11,alpha:0,duration:850,repeat:-1})}this.buildingRefs.set(`${b.x},${b.y}`,{image:img,dust,progress:b.progress,id:b.id})}
      if(s.selected){const p=this.toWorld(s.selected.x,s.selected.y),g=this.add.graphics().setDepth(9999);g.lineStyle(3,0xffdf72,1);g.strokePoints([{x:p.x,y:p.y-16},{x:p.x+32,y:p.y},{x:p.x,y:p.y+16},{x:p.x-32,y:p.y}],true);const b=s.buildings.find(v=>v.x===s.selected.x&&v.y===s.selected.y);if(b)this.add.text(p.x,p.y-38,b.name,{fontFamily:'monospace',fontSize:'10px',color:'#fff3b0',backgroundColor:'#24332bdd',padding:{x:5,y:3}}).setOrigin(.5,1).setDepth(10000)}
      const d=s.diagnostics;if(d&&(d.outOfBounds||d.roadBuildingConflicts||d.unknownBuildings))console.warn('Codeopolis world compatibility diagnostics',d)
    }
  }
  C.PhaserCityScene=PhaserCityScene;
})(window.Codeopolis);
