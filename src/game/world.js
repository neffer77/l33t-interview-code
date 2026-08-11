(function(C){
  'use strict';
  const {key,clamp}=C.util;

  class WorldSystem{
    constructor(gameState){this.state=gameState;this.world=this.ensure(gameState)}

    ensure(gameState){
      const old=gameState.world||{};
      const world=gameState.world={
        version:2,
        width:old.width||12,
        height:old.height||8,
        tiles:old.tiles||{},
        camera:Object.assign({panX:0,panY:-30,zoom:1},old.camera||{}),
        tool:Object.assign({mode:'inspect',buildingId:null},old.tool||{}),
        selected:old.selected||null,
        dayPhase:Number.isFinite(old.dayPhase)?old.dayPhase:.3,
        audioMuted:!!old.audioMuted,
        migrated:!!old.migrated,
        stats:Object.assign({roadsBuilt:0,buildingsPlaced:0,buildingsMoved:0},old.stats||{})
      };
      if(!world.migrated)this.migrateLegacy(gameState,world);
      return world;
    }

    migrateLegacy(gameState,world){
      const owned=(gameState.buildings||['camp']).slice();
      if(!owned.includes('camp'))owned.unshift('camp');
      const center={x:Math.floor(world.width/2)-1,y:Math.floor(world.height/2)-1};
      const spots=[];
      for(let y=0;y<world.height;y++)for(let x=0;x<world.width;x++)spots.push({x,y,d:Math.abs(x-center.x)+Math.abs(y-center.y)});
      spots.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
      const preferred=[center,...spots.filter(p=>p.x!==center.x||p.y!==center.y)];
      owned.forEach((id,i)=>{
        const p=preferred[i];if(!p)return;
        world.tiles[key(p.x,p.y)]={buildingId:id,road:false,placedAt:Date.now()-10000,constructionMs:0};
      });
      // Seed a small road spine so the migrated city immediately feels connected.
      const cy=center.y+1;
      for(let x=1;x<world.width-1;x++){
        const k=key(x,cy);if(!world.tiles[k]?.buildingId)world.tiles[k]=Object.assign({},world.tiles[k],{road:true});
      }
      world.stats.roadsBuilt=Math.max(world.stats.roadsBuilt,world.width-2);
      world.stats.buildingsPlaced=Math.max(world.stats.buildingsPlaced,owned.length);
      world.migrated=true;
    }

    inside(x,y){return x>=0&&y>=0&&x<this.world.width&&y<this.world.height}
    tile(x,y){return this.world.tiles[key(x,y)]||null}
    ensureTile(x,y){const k=key(x,y);return this.world.tiles[k]||(this.world.tiles[k]={road:false})}
    buildingDef(id){if(id==='camp')return{id:'camp',name:'Founder Camp',icon:'⛺',district:'core'};return typeof BUILDINGS!=='undefined'?BUILDINGS.find(b=>b.id===id):null}
    districtFor(id){return this.buildingDef(id)?.district||'core'}
    placedBuildings(){const out=[];for(const [k,t] of Object.entries(this.world.tiles)){if(!t.buildingId)continue;const [x,y]=k.split(',').map(Number);out.push({x,y,id:t.buildingId,tile:t,def:this.buildingDef(t.buildingId)})}return out}
    roadTiles(){const out=[];for(const [k,t] of Object.entries(this.world.tiles)){if(!t.road)continue;const [x,y]=k.split(',').map(Number);out.push({x,y,tile:t})}return out}

    ownedCounts(){const counts={};for(const id of this.state.buildings||[])counts[id]=(counts[id]||0)+1;return counts}
    placedCounts(){const counts={};for(const b of this.placedBuildings())counts[b.id]=(counts[b.id]||0)+1;return counts}
    inventory(){
      const owned=this.ownedCounts(),placed=this.placedCounts(),out=[];
      for(const [id,count] of Object.entries(owned)){
        const remaining=Math.max(0,count-(placed[id]||0));
        if(remaining)out.push({id,count:remaining,def:this.buildingDef(id)});
      }
      return out;
    }

    canPlaceBuilding(id,x,y){
      if(!this.inside(x,y))return{ok:false,reason:'Outside city limits'};
      const t=this.tile(x,y);if(t?.buildingId)return{ok:false,reason:'Tile already has a building'};
      if(t?.road)return{ok:false,reason:'Move the road before placing a building'};
      const available=this.inventory().find(v=>v.id===id)?.count||0;
      if(!available)return{ok:false,reason:'Build or unplace this structure first'};
      return{ok:true};
    }

    placeBuilding(id,x,y,{construction=true}={}){
      const verdict=this.canPlaceBuilding(id,x,y);if(!verdict.ok)return verdict;
      const t=this.ensureTile(x,y);t.buildingId=id;t.road=false;t.placedAt=Date.now();t.constructionMs=construction?4200:0;
      this.world.stats.buildingsPlaced++;
      this.world.selected={x,y};
      C.events.emit('world:building-placed',{id,x,y,def:this.buildingDef(id),construction});
      return{ok:true};
    }

    unplaceBuilding(x,y){
      const t=this.tile(x,y);if(!t?.buildingId||t.buildingId==='camp')return{ok:false,reason:'This building cannot be moved'};
      const id=t.buildingId;delete t.buildingId;delete t.placedAt;delete t.constructionMs;
      this.world.stats.buildingsMoved++;
      this.world.selected=null;
      C.events.emit('world:building-unplaced',{id,x,y});
      return{ok:true,id};
    }

    setRoad(x,y,value=true){
      if(!this.inside(x,y))return{ok:false,reason:'Outside city limits'};
      const t=this.ensureTile(x,y);if(t.buildingId)return{ok:false,reason:'A building occupies this tile'};
      const changed=!!t.road!==!!value;t.road=!!value;
      if(changed&&value)this.world.stats.roadsBuilt++;
      C.events.emit('world:road-changed',{x,y,value:!!value});
      return{ok:true,changed};
    }

    constructionProgress(tile,now=Date.now()){
      if(!tile?.buildingId||!tile.constructionMs)return 1;
      return clamp((now-(tile.placedAt||now))/tile.constructionMs,0,1);
    }

    neighbors(x,y,{roadsOnly=false}={}){
      const list=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:x+dx,y:y+dy})).filter(p=>this.inside(p.x,p.y));
      return roadsOnly?list.filter(p=>this.tile(p.x,p.y)?.road):list;
    }

    select(x,y){this.world.selected=this.inside(x,y)?{x,y}:null;C.events.emit('world:selected',this.world.selected);return this.world.selected}
    selectedTile(){const s=this.world.selected;return s?Object.assign({x:s.x,y:s.y},this.tile(s.x,s.y)||{}):null}
    setTool(mode,buildingId=null){this.world.tool={mode,buildingId};C.events.emit('world:tool',{mode,buildingId})}

    districtTile(district){
      const candidates=this.placedBuildings().filter(b=>this.districtFor(b.id)===district);
      return candidates[0]||this.placedBuildings()[0]||null;
    }

    resetCamera(){this.world.camera.panX=0;this.world.camera.panY=-30;this.world.camera.zoom=1;C.events.emit('camera:changed',this.world.camera)}
  }

  C.register('WorldSystem',WorldSystem);
})(window.Codeopolis);
