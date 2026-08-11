(function(C){
  'use strict';
  const {clamp,lerp}=C.util;

  const PALETTE={
    core:['#5a6f95','#314765','#96b8e8'],arrays:['#c8773f','#754423','#ffc16c'],hash:['#a87845','#66482a','#f6d08a'],structures:['#745ea6','#45366a','#c5a9ff'],search:['#397ba4','#23506c','#83d5ff'],graphs:['#318277','#1f544f','#77e2c9'],dp:['#9a4f85','#5a3153','#f0a6d9']
  };

  class CityRenderer{
    constructor(canvas,world,camera,simulation,gameState){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.world=world;this.camera=camera;this.sim=simulation;this.state=gameState;
      this.hover=null;this.focusAnim=null;this.lastW=0;this.lastH=0;this.needsDraw=true;
      C.events.on('camera:changed',()=>this.requestDraw());C.events.on('world:selected',()=>this.requestDraw());C.events.on('world:road-changed',()=>this.requestDraw());C.events.on('world:building-placed',()=>this.requestDraw());
    }
    requestDraw(){this.needsDraw=true}
    setHover(tile){this.hover=tile;this.requestDraw()}

    resize(){
      const r=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
      if(w===this.lastW&&h===this.lastH)return;this.lastW=w;this.lastH=h;this.canvas.width=w;this.canvas.height=h;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.requestDraw();
    }

    focus(tile,duration=700){
      if(!tile)return;const size=this.camera.cssSize(),p=this.camera.tileToScreen(tile.x,tile.y);
      this.focusAnim={started:performance.now(),duration,fromX:this.camera.state.panX,fromY:this.camera.state.panY,toX:this.camera.state.panX+(size.width*.5-p.x),toY:this.camera.state.panY+(size.height*.46-p.y)};
    }
    updateFocus(now){if(!this.focusAnim)return;const a=this.focusAnim,t=clamp((now-a.started)/a.duration,0,1),e=1-Math.pow(1-t,3);this.camera.state.panX=lerp(a.fromX,a.toX,e);this.camera.state.panY=lerp(a.fromY,a.toY,e);if(t>=1)this.focusAnim=null}

    render(now=performance.now()){
      this.resize();this.updateFocus(now);const ctx=this.ctx,size=this.camera.cssSize(),light=this.sim.daylight();
      ctx.clearRect(0,0,size.width,size.height);this.drawBackdrop(ctx,size,light);
      const entries=[];for(let y=0;y<this.world.world.height;y++)for(let x=0;x<this.world.world.width;x++)entries.push({x,y,depth:x+y});entries.sort((a,b)=>a.depth-b.depth||a.x-b.x);
      for(const p of entries)this.drawGroundTile(ctx,p.x,p.y,light);
      for(const p of entries){const t=this.world.tile(p.x,p.y);if(t?.road)this.drawRoad(ctx,p.x,p.y,light)}
      const objects=[];
      for(const b of this.world.placedBuildings())objects.push({type:'building',x:b.x,y:b.y,depth:b.x+b.y+.3,data:b});
      for(const a of this.sim.agents)objects.push({type:'agent',x:a.x,y:a.y,depth:a.x+a.y+.55,data:a});
      objects.sort((a,b)=>a.depth-b.depth);
      for(const o of objects)o.type==='building'?this.drawBuilding(ctx,o.data,light,now):this.drawAgent(ctx,o.data,light);
      this.drawParticles(ctx,light);
      this.drawSelection(ctx);this.drawHUD(ctx,size,light);
      if(light<.55){ctx.fillStyle=`rgba(2,7,20,${(1-light)*.28})`;ctx.fillRect(0,0,size.width,size.height)}
      this.needsDraw=false;
    }

    drawBackdrop(ctx,size,light){
      const g=ctx.createLinearGradient(0,0,0,size.height);g.addColorStop(0,light>.45?'#183454':'#0b1630');g.addColorStop(1,light>.45?'#0f2139':'#07111f');ctx.fillStyle=g;ctx.fillRect(0,0,size.width,size.height);
      const glow=ctx.createRadialGradient(size.width*.72,size.height*.08,0,size.width*.72,size.height*.08,size.width*.55);glow.addColorStop(0,`rgba(255,210,125,${.15*light})`);glow.addColorStop(1,'rgba(255,210,125,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,size.width,size.height);
      // distant skyline silhouette
      ctx.fillStyle=`rgba(4,12,25,${.34+.3*(1-light)})`;for(let x=0;x<size.width;x+=34){const h=18+((x*17)%51);ctx.fillRect(x,size.height-h,24,h)}
    }

    diamond(ctx,p,w,h){ctx.beginPath();ctx.moveTo(p.x,p.y-h/2);ctx.lineTo(p.x+w/2,p.y);ctx.lineTo(p.x,p.y+h/2);ctx.lineTo(p.x-w/2,p.y);ctx.closePath()}
    drawGroundTile(ctx,x,y,light){
      const p=this.camera.tileToScreen(x,y),w=this.camera.tileW*this.camera.state.zoom,h=this.camera.tileH*this.camera.state.zoom,t=this.world.tile(x,y),b=t?.buildingId?this.world.buildingDef(t.buildingId):null,dist=b?.district||'core';
      this.diamond(ctx,p,w-2,h-2);ctx.fillStyle=b?`${PALETTE[dist]?.[1]||'#314765'}88`:`rgba(28,58,70,${.55+.14*light})`;ctx.fill();ctx.strokeStyle='rgba(102,151,170,.18)';ctx.lineWidth=1;ctx.stroke();
    }

    drawRoad(ctx,x,y,light){
      const p=this.camera.tileToScreen(x,y),z=this.camera.state.zoom,w=this.camera.tileW*z,h=this.camera.tileH*z;
      this.diamond(ctx,p,w*.88,h*.78);ctx.fillStyle=light>.45?'#263849':'#1a2939';ctx.fill();ctx.strokeStyle='rgba(129,166,184,.35)';ctx.stroke();
      ctx.save();ctx.strokeStyle=light>.45?'rgba(239,209,121,.62)':'rgba(255,216,112,.88)';ctx.lineWidth=Math.max(1,1.3*z);ctx.setLineDash([5*z,5*z]);
      const n=this.world.neighbors(x,y,{roadsOnly:true});for(const q of n){const qp=this.camera.tileToScreen(q.x,q.y);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo((p.x+qp.x)/2,(p.y+qp.y)/2);ctx.stroke()}ctx.restore();
    }

    districtLevel(district){const xp=this.state.districtXP?.[district]||0;return 1+Math.floor(xp/3)}
    buildingHeight(b){
      if(b.id==='camp')return 18;
      const level=this.districtLevel(b.def?.district||'core'),base={house:30,market:42,foundry:48,observatory:58,transit:38,lab:62,park:12,solar:18,tower:88,academy:68}[b.id]||45;
      return base+Math.min(42,(level-1)*5);
    }

    drawBuilding(ctx,b,light,now){
      const p=this.camera.tileToScreen(b.x,b.y),z=this.camera.state.zoom,def=b.def||{},district=def.district||'core',colors=PALETTE[district]||PALETTE.core,progress=this.world.constructionProgress(b.tile,Date.now()),fullH=this.buildingHeight(b)*z,height=Math.max(7,fullH*(.15+.85*progress)),w=(b.id==='camp'?38:46)*z,depth=22*z;
      if(b.id==='park'){this.drawPark(ctx,p,w,light);return}
      if(b.id==='solar'){this.drawSolar(ctx,p,w,light);return}
      ctx.save();ctx.translate(p.x,p.y);
      // shadow
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(7*z,8*z,w*.62,depth*.38,0,0,Math.PI*2);ctx.fill();
      // left face
      ctx.fillStyle=colors[1];ctx.beginPath();ctx.moveTo(-w/2,-height);ctx.lineTo(0,-height+depth/2);ctx.lineTo(0,depth/2);ctx.lineTo(-w/2,0);ctx.closePath();ctx.fill();
      // right face
      ctx.fillStyle=colors[0];ctx.beginPath();ctx.moveTo(0,-height+depth/2);ctx.lineTo(w/2,-height);ctx.lineTo(w/2,0);ctx.lineTo(0,depth/2);ctx.closePath();ctx.fill();
      // roof
      ctx.fillStyle=colors[2];ctx.beginPath();ctx.moveTo(0,-height-depth/2);ctx.lineTo(w/2,-height);ctx.lineTo(0,-height+depth/2);ctx.lineTo(-w/2,-height);ctx.closePath();ctx.fill();
      // windows become a major nighttime visual reward
      const floors=Math.max(1,Math.floor(height/(13*z)));for(let f=0;f<floors;f++){const wy=-9*z-f*12*z;if(wy<-height+5*z)break;ctx.fillStyle=light<.55?'rgba(255,221,122,.88)':'rgba(167,225,255,.48)';ctx.fillRect(8*z,wy,5*z,3*z);ctx.fillRect(20*z,wy+5*z,5*z,3*z)}
      if(progress<1)this.drawConstruction(ctx,w,height,progress,z,now);
      else if(def.icon&&z>.72){ctx.font=`${Math.max(12,15*z)}px system-ui`;ctx.textAlign='center';ctx.fillText(def.icon,0,-height-depth*.6)}
      ctx.restore();
    }

    drawConstruction(ctx,w,height,progress,z,now){
      ctx.strokeStyle='rgba(255,205,91,.9)';ctx.lineWidth=Math.max(1,1.2*z);for(let yy=0;yy<height;yy+=10*z){ctx.beginPath();ctx.moveTo(-w*.55,-yy);ctx.lineTo(w*.55,-yy);ctx.stroke()}
      const craneX=w*.65,craneH=Math.max(30*z,height+18*z);ctx.strokeStyle='#f1bd4c';ctx.lineWidth=2*z;ctx.beginPath();ctx.moveTo(craneX,2*z);ctx.lineTo(craneX,-craneH);ctx.lineTo(craneX-w*.8,-craneH);ctx.stroke();const swing=Math.sin(now/450)*8*z;ctx.beginPath();ctx.moveTo(craneX-w*.45,-craneH);ctx.lineTo(craneX-w*.45+swing,-craneH+18*z);ctx.stroke();
    }

    drawPark(ctx,p,w,light){ctx.save();ctx.translate(p.x,p.y);const z=this.camera.state.zoom;ctx.fillStyle='#315f46';ctx.beginPath();ctx.ellipse(0,1*z,w*.62,w*.25,0,0,Math.PI*2);ctx.fill();for(let i=-1;i<=1;i++){ctx.fillStyle=light<.5?'#214b38':'#4f9a63';ctx.beginPath();ctx.arc(i*12*z,-10*z-Math.abs(i)*4*z,9*z,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6d4b34';ctx.fillRect(i*12*z-1.5*z,-4*z,3*z,10*z)}ctx.restore()}
    drawSolar(ctx,p,w,light){ctx.save();ctx.translate(p.x,p.y);const z=this.camera.state.zoom;ctx.fillStyle='#1c4d67';for(let i=-1;i<=1;i++){ctx.save();ctx.translate(i*15*z,-4*z);ctx.transform(1,-.25,0,1,0,0);ctx.fillRect(-6*z,-6*z,12*z,10*z);ctx.strokeStyle='#7fd3ff';ctx.strokeRect(-6*z,-6*z,12*z,10*z);ctx.restore()}ctx.fillStyle=`rgba(255,220,120,${.2+.4*light})`;ctx.beginPath();ctx.ellipse(0,2*z,w*.6,w*.2,0,0,Math.PI*2);ctx.fill();ctx.restore()}

    drawAgent(ctx,a,light){
      const p=this.camera.tileToScreen(a.x,a.y),z=this.camera.state.zoom;if(z<.62)return;ctx.save();ctx.translate(p.x,p.y-3*z);
      if(a.kind==='car'){ctx.fillStyle=['#ff8c66','#76b8ff','#f4cb62','#86d59c','#d28cff'][a.variant%5];ctx.beginPath();ctx.roundRect?.(-5*z,-3*z,10*z,6*z,2*z);if(ctx.roundRect)ctx.fill();else ctx.fillRect(-5*z,-3*z,10*z,6*z);if(light<.45){ctx.fillStyle='#fff0a5';ctx.fillRect(3*z,-2*z,2*z,2*z)}}
      else{ctx.fillStyle=['#85d7ff','#ffd477','#ff9aa9','#9de0ad','#c5a7ff'][a.variant%5];ctx.beginPath();ctx.arc(0,-4*z,2.2*z,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(220,235,255,.7)';ctx.lineWidth=1*z;ctx.beginPath();ctx.moveTo(0,-2*z);ctx.lineTo(0,4*z);ctx.stroke()}
      ctx.restore();
    }

    drawParticles(ctx){for(const p of this.sim.particles){const s=this.camera.tileToScreen(p.x,p.y),z=this.camera.state.zoom,alpha=clamp(p.life/p.maxLife,0,1);ctx.globalAlpha=alpha;ctx.fillStyle=p.kind==='construction'?'#ffd26c':['#72e6a3','#6cb6ff','#ffd166','#e39cff'][p.variant%4];ctx.beginPath();ctx.arc(s.x,s.y-p.z*28*z,2.5*z,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}

    drawSelection(ctx){
      const selected=this.world.world.selected,hover=this.hover,z=this.camera.state.zoom,w=this.camera.tileW*z,h=this.camera.tileH*z;
      if(hover&&this.world.inside(hover.x,hover.y)){const p=this.camera.tileToScreen(hover.x,hover.y);this.diamond(ctx,p,w*.98,h*.96);ctx.fillStyle='rgba(108,182,255,.08)';ctx.fill();ctx.strokeStyle='rgba(125,205,255,.65)';ctx.lineWidth=1.5;ctx.stroke()}
      if(selected){const p=this.camera.tileToScreen(selected.x,selected.y);this.diamond(ctx,p,w*1.02,h);ctx.strokeStyle='#ffd166';ctx.lineWidth=2.2;ctx.stroke()}
    }

    drawHUD(ctx,size,light){
      const z=this.camera.state.zoom,phase=this.world.world.dayPhase;ctx.save();ctx.font='600 12px system-ui';ctx.textAlign='left';ctx.fillStyle='rgba(6,13,27,.72)';ctx.beginPath();ctx.roundRect?.(12,12,162,34,10);if(ctx.roundRect)ctx.fill();else ctx.fillRect(12,12,162,34);ctx.fillStyle='#dce9ff';ctx.fillText(`${light<.35?'🌙':light<.68?'🌅':'☀️'} ${light<.35?'Night':light<.68?'Golden hour':'Day'} · ${Math.round(z*100)}%`,24,33);ctx.restore();
    }
  }

  C.register('CityRenderer',CityRenderer);
})(window.Codeopolis);
