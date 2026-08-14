(function(C){
  'use strict';
  class CivilizationWorldAdapter{
    constructor(world,state){this.world=world;this.state=state}
    terrainAt(x,y){
      const tile=this.world.tile(x,y);
      if(tile?.buildingId||tile?.occupiedBy)return'grass';
      if(tile?.road)return'dirt';
      const seed=(this.world.world.seed||1337)>>>0;
      let n=(Math.imul(x+11,374761393)^Math.imul(y+17,668265263)^seed)>>>0;
      n=(n^(n>>>13));n=Math.imul(n,1274126177)>>>0;n=(n^(n>>>16))>>>0;
      const v=n/4294967295;
      if(v<.055)return'water';if(v<.14)return'forest';if(v<.20)return'dirt';return'grass';
    }
    roadMask(x,y,set){let m=0;if(set.has(`${x},${y-1}`))m|=1;if(set.has(`${x+1},${y}`))m|=2;if(set.has(`${x},${y+1}`))m|=4;if(set.has(`${x-1},${y}`))m|=8;return m}
    diagnostics(){
      const w=this.world.world,out={outOfBounds:0,roadBuildingConflicts:0,unknownBuildings:0};
      for(const [k,t] of Object.entries(w.tiles||{})){
        const [x,y]=k.split(',').map(Number);if(!Number.isInteger(x)||!Number.isInteger(y)||!this.world.inside(x,y)){out.outOfBounds++;continue}
        if(t?.road&&(t?.buildingId||t?.occupiedBy))out.roadBuildingConflicts++;
        if(t?.buildingId&&!this.world.buildingDef(t.buildingId))out.unknownBuildings++;
      }
      return out;
    }
    snapshot(now=Date.now()){
      const w=this.world.world,roads=this.world.roadTiles().filter(r=>this.world.inside(r.x,r.y)),roadSet=new Set(roads.map(r=>`${r.x},${r.y}`));
      const buildings=this.world.placedBuildings().filter(b=>this.world.inside(b.x,b.y)).map(b=>({
        x:b.x,y:b.y,id:b.id,name:b.def?.name||b.id,icon:b.def?.icon||'🏗️',district:b.def?.district||'core',known:!!b.def,
        footprint:b.footprint||b.tile?.footprint||{w:1,h:1},level:this.world.buildingLevel?this.world.buildingLevel(b.x,b.y):Math.max(1,Number(b.tile?.level)||1),outputMultiplier:this.world.buildingOutputMultiplier?this.world.buildingOutputMultiplier(b.x,b.y):1,
        progress:this.world.constructionProgress(b.tile,now),placedAt:b.tile?.placedAt||null,constructionMs:b.tile?.constructionMs||0
      }));
      return{version:4,width:w.width,height:w.height,seed:w.seed||1337,dayPhase:w.dayPhase||0,camera:{...w.camera},selected:w.selected?{...w.selected}:null,
        roads:roads.map(r=>({x:r.x,y:r.y,mask:this.roadMask(r.x,r.y,roadSet)})),buildings,
        terrain:Array.from({length:w.height},(_,y)=>Array.from({length:w.width},(_,x)=>this.terrainAt(x,y))),diagnostics:this.diagnostics()};
    }
  }
  C.register('CivilizationWorldAdapter',CivilizationWorldAdapter);
})(window.Codeopolis);
