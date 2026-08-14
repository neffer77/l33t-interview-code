(function(C){
  'use strict';
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1eServicesInstalled)return false;
    const p=World.prototype;p.__p1eServicesInstalled=true;const previousEffects=p.buildingEffects;
    p.serviceProfile=function(x,y){
      const a=this.anchorFor?.(x,y)||{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return null;
      const raw=this.buildingDef(t.buildingId)||{},def=C.BuildingRegistry?.definition?.(this,t.buildingId)||raw,level=this.buildingLevel?.(a.x,a.y)||1,fp=t.footprint||def.footprint||{w:1,h:1},area=Math.max(1,(fp.w||1)*(fp.h||1)),district=String(def.district||'core').toLowerCase(),name=String(def.name||t.buildingId);
      const utility=/power|energy|grid|utility|reactor|solar|plant/i.test(name)||['infrastructure','systems','reliability'].includes(district);
      const housing=/house|housing|residen|apartment|habitat|camp/i.test(name);
      const powerSupply=Number(raw.powerSupply)||Number(def.powerSupply)||(utility?Math.max(8,(Number(raw.energy)||0)*3+area*4*level):0);
      const powerDemand=Number(raw.powerDemand)||Number(def.powerDemand)||(t.buildingId==='camp'?0:Math.max(1,Math.round(area*(1.5+level*.8)*(utility?.45:1))));
      const workerDemand=Number(raw.workerDemand)||Number(def.workerDemand)||(t.buildingId==='camp'?0:Math.max(1,Math.round(area*(1+level*.75))));
      const housingCapacity=Number(raw.populationCapacity)||Number(def.populationCapacity)||(housing?Math.max(12,Number(raw.population)||20)*level:0);
      return{x:a.x,y:a.y,id:t.buildingId,district,level,powerSupply,powerDemand,workerDemand,housingCapacity,roadRequired:t.buildingId!=='camp'};
    };
    p.cityServiceSummary=function(){
      const profiles=this.placedBuildings().map(b=>this.serviceProfile(b.x,b.y)).filter(Boolean),state=this.state||{};
      const powerDemand=profiles.reduce((s,v)=>s+v.powerDemand,0),dedicatedPower=profiles.reduce((s,v)=>s+v.powerSupply,0),powerSupply=Math.max(25,Number(state.energy)||0)+dedicatedPower;
      const workerDemand=profiles.reduce((s,v)=>s+v.workerDemand,0),workers=Math.max(12,Number(state.population)||0),housingCapacity=20+profiles.reduce((s,v)=>s+v.housingCapacity,0),population=Math.max(0,Number(state.population)||0);
      const powerRatio=powerDemand?Math.min(1,powerSupply/powerDemand):1,workerRatio=workerDemand?Math.min(1,workers/workerDemand):1,housingRatio=population?Math.min(1,housingCapacity/population):1;
      let disconnected=0;for(const v of profiles){const a=this.adjacencyStatus?.(v.x,v.y);if(v.roadRequired&&!a?.roadConnected)disconnected++}
      const issues=[];if(disconnected)issues.push(`${disconnected} disconnected`);if(powerRatio<.999)issues.push('power shortage');if(workerRatio<.999)issues.push('worker shortage');if(housingRatio<.999)issues.push('housing pressure');
      return{powerSupply,powerDemand,powerRatio,workers,workerDemand,workerRatio,housingCapacity,population,housingRatio,disconnected,total:profiles.length,healthy:issues.length===0,issues};
    };
    p.buildingServiceStatus=function(x,y){const profile=this.serviceProfile(x,y);if(!profile)return null;const city=this.cityServiceSummary(),adj=this.adjacencyStatus?.(profile.x,profile.y),road=profile.roadRequired?!!adj?.roadConnected:true,roadFactor=road?1:.72,powerFactor=Math.max(.45,city.powerRatio),workerFactor=Math.max(.65,city.workerRatio),housingFactor=Math.max(.85,city.housingRatio),efficiency=Math.max(.35,Math.min(1,roadFactor*powerFactor*workerFactor*housingFactor));const issues=[];if(!road)issues.push('No road access');if(city.powerRatio<.999&&profile.powerDemand)issues.push('Power constrained');if(city.workerRatio<.999&&profile.workerDemand)issues.push('Worker constrained');if(city.housingRatio<.999)issues.push('Housing pressure');return{...profile,roadConnected:road,efficiency,issues,city};};
    p.buildingEffects=function(x,y){const fx=previousEffects?.call(this,x,y);if(!fx)return fx;const service=this.buildingServiceStatus(x,y),m=service?.efficiency||1;return{...fx,service,serviceMultiplier:m,happiness:Math.round((fx.happiness||0)*m),moneyRate:Number(((fx.moneyRate||0)*m).toFixed(1)),researchRate:Number(((fx.researchRate||0)*m).toFixed(1))};};
    return true;
  }
  C.register('CityServices',{install});
})(window.Codeopolis);
