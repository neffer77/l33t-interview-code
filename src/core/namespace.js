(function(global){
  'use strict';
  const C=global.Codeopolis=global.Codeopolis||{};
  C.version='6.0.0';
  C.modules=C.modules||{};

  const listeners=new Map();
  C.events={
    on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name)?.delete(fn)},
    once(name,fn){const off=this.on(name,(payload)=>{off();fn(payload)});return off},
    off(name,fn){listeners.get(name)?.delete(fn)},
    emit(name,payload){for(const fn of listeners.get(name)||[]){try{fn(payload)}catch(err){console.error('[Codeopolis event]',name,err)}}}
  };

  C.util={
    clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
    lerp:(a,b,t)=>a+(b-a)*t,
    smoothstep:t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)},
    key:(x,y)=>`${x},${y}`,
    uid:(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
    hash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0},
    seeded(input){let x=C.util.hash(input)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}},
    formatNumber(v){return Math.abs(v)>=1000000?`${(v/1000000).toFixed(1)}m`:Math.abs(v)>=1000?`${(v/1000).toFixed(1)}k`:Math.round(v).toLocaleString()},
    now:()=>Date.now()
  };

  // R2's isometric projection is a hard renderer dependency. Keep the
  // canonical 64x32 projection available from first-party core bootstrap so
  // Phaser scene/controller creation cannot race a later dynamic asset load.
  if(!C.PixelWorldProjection){
    const VERSION=1,TILE_W=64,TILE_H=32,PAD_X=72,PAD_Y=74;
    const layout=(width=12,height=8)=>({tileW:TILE_W,tileH:TILE_H,originX:PAD_X+(Math.max(1,height)-1)*TILE_W/2,originY:PAD_Y,width,height,worldWidth:PAD_X*2+(Math.max(1,width)+Math.max(1,height))*TILE_W/2,worldHeight:PAD_Y*2+(Math.max(1,width)+Math.max(1,height))*TILE_H/2});
    const toWorld=(x,y,l=layout())=>({x:l.originX+(x-y)*l.tileW/2,y:l.originY+(x+y)*l.tileH/2});
    const fromWorld=(wx,wy,l=layout())=>{const dx=(wx-l.originX)/(l.tileW/2),dy=(wy-l.originY)/(l.tileH/2);return{x:Math.round((dx+dy)/2),y:Math.round((dy-dx)/2)}};
    const corners=(x,y,l=layout())=>{const p=toWorld(x,y,l),hw=l.tileW/2,hh=l.tileH/2;return[{x:p.x,y:p.y-hh},{x:p.x+hw,y:p.y},{x:p.x,y:p.y+hh},{x:p.x-hw,y:p.y}]};
    const depth=(x,y,layer=0)=>(x+y)*100+x+layer;
    const footprintCells=(def,x,y)=>{const w=Math.max(1,Number(def?.footprint?.w)||1),h=Math.max(1,Number(def?.footprint?.h)||1),out=[];for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)out.push({x:x+xx,y:y+yy});return out};
    const footprintCenter=(def,x,y,l)=>{const pts=footprintCells(def,x,y).map(c=>toWorld(c.x,c.y,l));return{x:pts.reduce((n,p)=>n+p.x,0)/pts.length,y:pts.reduce((n,p)=>n+p.y,0)/pts.length}};
    C.PixelWorldProjection={VERSION,TILE_W,TILE_H,PAD_X,PAD_Y,layout,toWorld,fromWorld,corners,depth,footprintCells,footprintCenter};
  }

  C.register=function(name,value){C.modules[name]=value;return value};
  C.get=function(name){return C.modules[name]};
})(window);
