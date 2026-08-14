(function(C){
  'use strict';
  class CivilizationWorldAdapter{
    constructor(world,state){this.world=world;this.state=state}
    terrainAt(x,y){
      const seed=(this.world.world.seed||1337)>>>0;
      let n=(Math.imul(x+11,374761393)^Math.imul(y+17,668265263)^seed)>>>0;
      n=(n^(n>>>13));n=Math.imul(n,1274126177)>>>0;n=(n^(n>>>16))>>>0;
      const v=n/4294967295;
      if(v<.055)return'water';if(v<.14)return'forest';if(v<.20)return'dirt';return'grass';
    }
    snapshot(){
      const w=this.world.world;
      return{version:1,width:w.width,height:w.height,seed:w.seed||1337,dayPhase:w.dayPhase||0,camera:{...w.camera},selected:w.selected?{...w.selected}:null,
        roads:this.world.roadTiles().map(r=>({x:r.x,y:r.y})),
        buildings:this.world.placedBuildings().map(b=>({x:b.x,y:b.y,id:b.id,name:b.def?.name||b.id,icon:b.def?.icon||'🏗️',district:b.def?.district||'core',progress:this.world.constructionProgress(b.tile)})),
        terrain:Array.from({length:w.height},(_,y)=>Array.from({length:w.width},(_,x)=>this.terrainAt(x,y)))};
    }
  }
  C.register('CivilizationWorldAdapter',CivilizationWorldAdapter);
})(window.Codeopolis);
