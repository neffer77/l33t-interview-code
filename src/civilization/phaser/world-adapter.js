(function(C){
  'use strict';
  const SNAPSHOT_TTL_MS=2000;
  class CivilizationWorldAdapter{
    constructor(world,state){this.world=world;this.state=state}
    terrainAt(x,y){const tile=this.world.tile(x,y);if(tile?.buildingId||tile?.occupiedBy)return'grass';if(tile?.road)return'dirt';const custom=this.world.customTerrainAt?.(x,y)||C.WorldCustomization?.terrainAt?.(this.state,this.world,x,y);if(custom)return custom;const seed=(this.world.world.seed||1337)>>>0;let n=(Math.imul(x+11,374761393)^Math.imul(y+17,668265263)^seed)>>>0;n=(n^(n>>>13));n=Math.imul(n,1274126177)>>>0;n=(n^(n>>>16))>>>0;const v=n/4294967295;if(v<.055)return'water';if(v<.14)return'forest';if(v<.20)return'dirt';return'grass'}
    roadMask(x,y,set){let m=0;if(set.has(`${x},${y-1}`))m|=1;if(set.has(`${x+1},${y}`))m|=2;if(set.has(`${x},${y+1}`))m|=4;if(set.has(`${x-1},${y}`))m|=8;return m}
    decorations(){const data=C.WorldCustomization?.ensure?.(this.state,this.world)?.decorations||{},out=[];for(const [k,v]of Object.entries(data)){const[x,y]=k.split(',').map(Number);if(!this.world.inside(x,y)||!v?.id)continue;out.push({x,y,id:v.id,variant:v.variant||0,placedAt:v.placedAt||null})}return out}
    diagnostics(){const w=this.world.world,out={outOfBounds:0,roadBuildingConflicts:0,unknownBuildings:0};for(const [k,t] of Object.entries(w.tiles||{})){const [x,y]=k.split(',').map(Number);if(!Number.isInteger(x)||!Number.isInteger(y)||!this.world.inside(x,y)){out.outOfBounds++;continue}if(t?.road&&(t?.buildingId||t?.occupiedBy))out.roadBuildingConflicts++;if(t?.buildingId&&!this.world.buildingDef(t.buildingId))out.unknownBuildings++}return out}
    /* A snapshot reads every system in the city (zoning, supply, population,
       the learning navigator) and took ~150 ms, while the renderer asked for
       one several times a second and three or four times per edit. What it
       reads only changes when something is announced on the event bus, so it
       is kept until the next event (C.events.revision) and rebuilt at least
       every SNAPSHOT_TTL_MS for anything that changes without saying so. The
       parts that move with the clock (construction progress, time of day,
       camera, selection) are read fresh on every call. */
    snapshot(now=Date.now()){
      this.world.updateConstruction?.(now);
      const rev=C.events?.revision,c=this.cached;
      if(typeof rev==='number'&&c&&c.rev===rev&&c.state===this.state&&now>=c.at&&now-c.at<SNAPSHOT_TTL_MS)return this.live(c.value,now);
      const value=this.build(now);
      this.cached=typeof rev==='number'?{rev,at:now,state:this.state,value}:null;
      return value}
    invalidate(){this.cached=null}
    live(s,now){
      const w=this.world.world;s.dayPhase=w.dayPhase||0;s.camera={...w.camera};s.selected=w.selected?{...w.selected}:null;
      for(const b of s.buildings){if(!b.construction&&b.progress>=1)continue;const job=this.world.constructionJobAt?.(b.x,b.y)||null,tile=this.world.tile(b.x,b.y);
        b.construction=job?{status:job.status,durationMs:job.durationMs,startedAt:job.startedAt,boostMs:job.boostMs||0}:null;b.progress=this.world.constructionProgress(tile,now)}
      s.constructionSummary=this.world.constructionSummary?.(now)||null;
      return s}
    build(now){
      const w=this.world.world,roads=this.world.roadTiles().filter(r=>this.world.inside(r.x,r.y)),roadSet=new Set(roads.map(r=>`${r.x},${r.y}`)),districtSummary=C.CurriculumDistricts?.summary?.(this.world,this.state)||null,ageLevel=Math.max(1,Math.min(6,Number(C.AgeProgression?.current?.(this.state)?.level)||Number(this.state?.ageProgression?.level)||Number(this.state?.eraLevel)||1)),ageDef=C.AgeProgression?.age?.(ageLevel)||null,technologies=Array.isArray(this.state?.tech)?[...this.state.tech]:[];
      const buildings=this.world.placedBuildings().filter(b=>this.world.inside(b.x,b.y)).map(b=>{const job=this.world.constructionJobAt?.(b.x,b.y)||null,curriculumDistrict=C.CurriculumDistricts?.districtIdFor?.(b.def||{})||'materials',district=districtSummary?.[curriculumDistrict]||null,visualVariant=this.world.buildingVisualStyle?.(b.x,b.y)||C.WorldCustomization?.styleAt?.(this.state,b.x,b.y)||'standard';return{x:b.x,y:b.y,id:b.id,name:b.def?.name||b.id,icon:b.def?.icon||'🏗️',district:b.def?.district||'core',curriculumDistrict,districtMaturity:district?.maturity||null,known:!!b.def,footprint:b.footprint||b.tile?.footprint||{w:1,h:1},level:this.world.buildingLevel?.(b.x,b.y)||1,ageLevel,visualVariant,effects:this.world.buildingEffects?.(b.x,b.y)||null,adjacency:this.world.adjacencyStatus?.(b.x,b.y)||null,service:this.world.buildingServiceStatus?.(b.x,b.y)||null,infrastructure:this.world.infrastructureStatus?.(b.x,b.y)||null,operation:this.world.buildingOperationStatus?.(b.x,b.y)||null,zoning:this.world.buildingZoningStatus?.(b.x,b.y)||C.DistrictZoning?.buildingStatus?.(this.state,this.world,b.x,b.y)||null,supply:this.world.buildingSupplyStatus?.(b.x,b.y)||null,ageCapability:this.world.buildingAgeCapability?.(b.x,b.y)||C.AgeCityTransformation?.buildingCapability?.(this.state,this.world,b.x,b.y)||null,crisis:this.world.buildingCrisisStatus?.(b.x,b.y)||null,specialization:this.world.buildingSpecialization?.(b.x,b.y)||null,construction:job?{status:job.status,durationMs:job.durationMs,startedAt:job.startedAt,boostMs:job.boostMs||0}:null,progress:this.world.constructionProgress(b.tile,now),placedAt:b.tile?.placedAt||null,constructionMs:b.tile?.constructionMs||0}});
      return{version:16,width:w.width,height:w.height,seed:w.seed||1337,dayPhase:w.dayPhase||0,age:{level:ageLevel,id:ageDef?.id||C.AgeCityTransformation?.profile?.(this.state)?.id||`age_${ageLevel}`,name:ageDef?.name||C.AgeCityTransformation?.profile?.(this.state)?.name||`Age ${ageLevel}`},technologies,camera:{...w.camera},selected:w.selected?{...w.selected}:null,roads:roads.map(r=>({x:r.x,y:r.y,mask:this.roadMask(r.x,r.y,roadSet)})),zones:C.DistrictZoning?.zoneTiles?.(this.state)||[],decorations:this.decorations(),buildings,adjacencySummary:this.world.cityAdjacencySummary?.()||null,serviceSummary:this.world.cityServiceSummary?.()||null,infrastructureSummary:this.world.infrastructureNetwork?.()||null,populationSummary:C.PopulationSimulation?.summary?.(this.state,this.world)||null,operationsSummary:this.world.operationsSummary?.()||null,zoningSummary:this.world.cityZoningSummary?.()||C.DistrictZoning?.summary?.(this.state,this.world)||null,zoningDemand:this.world.cityZoningDemand?.()||C.DistrictZoning?.demand?.(this.state,this.world)||null,supplySummary:this.world.citySupplySummary?.()||C.CitySupplyRuntime?.summary?.(this.state,this.world)||null,ageTransformation:C.AgeCityTransformation?.audit?.(this.state,this.world)||null,crisisSummary:this.world.cityCrisisSummary?.()||C.CityCrisisSystem?.summary?.(this.state,this.world)||null,customizationSummary:this.world.customizationSummary?.()||C.WorldCustomization?.summary?.(this.state,this.world)||null,campaignSummary:C.InterviewCityCampaign?.snapshot?.(this.state,this.world)||null,constructionSummary:this.world.constructionSummary?.(now)||null,districtSummary,dominantDistrict:C.CurriculumDistricts?.dominant?.(this.world,this.state)||null,terrain:Array.from({length:w.height},(_,y)=>Array.from({length:w.width},(_,x)=>this.terrainAt(x,y))),diagnostics:this.diagnostics()};
    }
  }
  C.register('CivilizationWorldAdapter',CivilizationWorldAdapter);
})(window.Codeopolis);
