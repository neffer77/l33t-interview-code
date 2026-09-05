(function(C){
  'use strict';
  if(!C.PixelWorldProjection){const TILE_W=64,TILE_H=32,PAD_X=72,PAD_Y=74;const layout=(width=12,height=8)=>({tileW:TILE_W,tileH:TILE_H,originX:PAD_X+(Math.max(1,height)-1)*TILE_W/2,originY:PAD_Y,width,height,worldWidth:PAD_X*2+(Math.max(1,width)+Math.max(1,height))*TILE_W/2,worldHeight:PAD_Y*2+(Math.max(1,width)+Math.max(1,height))*TILE_H/2});const toWorld=(x,y,l=layout())=>({x:l.originX+(x-y)*l.tileW/2,y:l.originY+(x+y)*l.tileH/2});const fromWorld=(wx,wy,l=layout())=>{const dx=(wx-l.originX)/(l.tileW/2),dy=(wy-l.originY)/(l.tileH/2);return{x:Math.round((dx+dy)/2),y:Math.round((dy-dx)/2)}};const corners=(x,y,l=layout())=>{const p=toWorld(x,y,l),hw=l.tileW/2,hh=l.tileH/2;return[{x:p.x,y:p.y-hh},{x:p.x+hw,y:p.y},{x:p.x,y:p.y+hh},{x:p.x-hw,y:p.y}]};const depth=(x,y,layer=0)=>(x+y)*100+x+layer;const footprintCells=(def,x,y)=>{const w=Math.max(1,Number(def?.footprint?.w)||1),h=Math.max(1,Number(def?.footprint?.h)||1),out=[];for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)out.push({x:x+xx,y:y+yy});return out};const footprintCenter=(def,x,y,l)=>{const pts=footprintCells(def,x,y).map(c=>toWorld(c.x,c.y,l));return{x:pts.reduce((n,p)=>n+p.x,0)/pts.length,y:pts.reduce((n,p)=>n+p.y,0)/pts.length}};C.PixelWorldProjection={VERSION:1,TILE_W,TILE_H,PAD_X,PAD_Y,layout,toWorld,fromWorld,corners,depth,footprintCells,footprintCenter}}
  C.Phase44Assets={
    version:2,projection:'iso-pixel-v1',tileWidth:64,tileHeight:32,
    // Golden Hour Meadow direction: warm afternoon light. Grass tones are a soft
    // tonal patchwork (a `patch` list picked per tile variant) so the map reads as
    // a sunlit meadow instead of a hard grid; only water keeps a rim so it reads
    // as sunken.
    terrain:{grass:{base:0x83bd5e,dark:0x5a8642,light:0xbfe088,accent:0xe4dc86,edge:0x4f7d3e,patch:[0x83bd5e,0x8fc766,0x79b355,0x9dd070,0x74ab52,0x8ac061]},dirt:{base:0xc19566,dark:0x8a6440,light:0xdcb47c,accent:0xecca92,edge:0x6b4d38,patch:[0xc19566,0xb88958,0xcaa06f,0xb27f50]},water:{base:0x5bb3c6,dark:0x3d8aa0,light:0x9fe0e6,accent:0xc4ece8,edge:0x357f97},forest:{base:0x5e9a4c,dark:0x356338,light:0x86bf5e,accent:0xbfd07a,edge:0x2c5233,patch:[0x5e9a4c,0x6aa651,0x548d45,0x74b058,0x5f9e4e]}},
    // Warm cobbled paths: honey-toned surface, warm shoulder, light cobble specks.
    roads:{base:0xc1a06f,dark:0x9a7c50,edge:0x7a5f3f,line:0xe8d19c,grassEdge:0xb6ad78},
    // Warmer foliage with a bright rim-light tone for the sunlit upper-left edge.
    props:{treeTrunk:0x7c5236,treeDark:0x3a6b43,treeMid:0x5ea052,treeLight:0x96c766,treeRim:0xe2ee9c,stone:0x8a8f82,stoneLight:0xc0c3a8,flowerA:0xf5cf6b,flowerB:0xef8fa4,fence:0xb0844f},
    // Lit windows make the houses feel occupied — the single biggest cozy cue.
    windows:{lit:0xffd57a,glow:0xffe6a8,door:0x3a2a20},
    buildings:{core:[0x7f8b91,0x59636a,0xc9a86b],arrays:[0xbf7046,0x84482d,0xe4a365],hash:[0xb58b4e,0x775b36,0xe5c477],structures:[0x7d6ba8,0x51436e,0xb8a8dd],search:[0x4f86a5,0x315d78,0x83c4da],graphs:[0x4c8d75,0x2e6153,0x7fc4a0],dp:[0xa05b82,0x6a3e5b,0xdf9bb9],materials:[0xbf7046,0x84482d,0xe4a365],trade:[0xb58b4e,0x775b36,0xe5c477],research:[0x4c8d75,0x2e6153,0x7fc4a0],compute:[0xa05b82,0x6a3e5b,0xdf9bb9],infrastructure:[0x5d7fa8,0x3a5574,0x91b6d8],stability:[0x9a665e,0x653f3b,0xd79b8e]},
    districtGround:{materials:0xc27b4a,trade:0xc7a554,research:0x579b82,compute:0xaa6d94,infrastructure:0x6788ae,stability:0xa16d66},variants:{grass:6,dirt:4,water:3,forest:5},worldDecor:{flowers:.075,stones:.045,tufts:.11,fences:.02}
  };
})(window.Codeopolis);
