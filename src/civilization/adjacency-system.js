(function(C){
  'use strict';
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1dAdjacencyInstalled)return false;
    const p=World.prototype;p.__p1dAdjacencyInstalled=true;
    const originalEffects=p.buildingEffects;
    p.footprintCellsAt=function(x,y){const a=this.anchorFor?.(x,y)||{x,y},t=this.tile(a.x,a.y),fp=t?.footprint||{w:1,h:1},cells=[];for(let dy=0;dy<fp.h;dy++)for(let dx=0;dx<fp.w;dx++)cells.push({x:a.x+dx,y:a.y+dy});return{anchor:a,cells,footprint:fp,tile:t}};
    p.adjacencyStatus=function(x,y){
      const fp=this.footprintCellsAt(x,y),t=fp.tile;if(!t?.buildingId)return null;
      const district=this.districtFor(t.buildingId),own=new Set(fp.cells.map(c=>`${c.x},${c.y}`)),roads=new Set(),neighbors=new Map();
      for(const c of fp.cells)for(const n of this.neighbors(c.x,c.y)){const nk=`${n.x},${n.y}`;if(own.has(nk))continue;const nt=this.tile(n.x,n.y);if(nt?.road)roads.add(nk);if(nt?.buildingId||nt?.occupiedBy){const a=this.anchorFor?.(n.x,n.y)||n,ak=`${a.x},${a.y}`;if(ak===`${fp.anchor.x},${fp.anchor.y}`)continue;const at=this.tile(a.x,a.y);if(at?.buildingId)neighbors.set(ak,{x:a.x,y:a.y,id:at.buildingId,district:this.districtFor(at.buildingId)})}}
      const sameDistrict=[...neighbors.values()].filter(n=>n.district===district).length;
      const roadConnected=roads.size>0,roadBonus=roadConnected?.10:0,districtBonus=Math.min(.20,sameDistrict*.05),multiplier=1+roadBonus+districtBonus;
      return{roadConnected,adjacentRoads:roads.size,sameDistrict,adjacentBuildings:neighbors.size,district,roadBonus,districtBonus,multiplier};
    };
    p.buildingEffects=function(x,y){const fx=originalEffects.call(this,x,y);if(!fx)return fx;const adj=this.adjacencyStatus(x,y),m=adj?.multiplier||1;return{...fx,adjacency:adj,totalMultiplier:Number((fx.multiplier*m).toFixed(3)),population:Math.round(fx.population*m),energy:Math.round(fx.energy*m),happiness:Math.round(fx.happiness*m),moneyRate:Number((fx.moneyRate*m).toFixed(1)),researchRate:Number((fx.researchRate*m).toFixed(1))}};
    p.cityAdjacencySummary=function(){let connected=0,clustered=0,total=0,weighted=0;for(const b of this.placedBuildings()){total++;const s=this.adjacencyStatus(b.x,b.y);if(s?.roadConnected)connected++;if(s?.sameDistrict)clustered++;weighted+=s?.multiplier||1}return{total,connected,clustered,roadCoverage:total?connected/total:0,averageMultiplier:total?weighted/total:1}};
    p.cityProductionMultiplier=function(){const s=this.cityAdjacencySummary();return Number(Math.max(1,s.averageMultiplier||1).toFixed(3))};
    if(typeof window!=='undefined'&&typeof window.productionRates==='function'&&!window.productionRates.__p1dAdjacencyWrapped){const legacy=window.productionRates,worldFor=()=>C.game?.world;const wrapped=function(){const r=legacy.apply(this,arguments),w=worldFor(),m=w?.cityProductionMultiplier?.()||1;if(Number.isFinite(r?.moneyRate))r.moneyRate*=m;if(Number.isFinite(r?.researchRate))r.researchRate*=m;return r};wrapped.__p1dAdjacencyWrapped=true;window.productionRates=wrapped}
    return true;
  }
  C.register('AdjacencySystem',{install});
})(window.Codeopolis);
