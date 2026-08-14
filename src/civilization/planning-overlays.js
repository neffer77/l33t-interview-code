(function(C){
  'use strict';
  const MODES=['none','roads','districts','power','workforce','housing','service','construction'];
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1hPlanningOverlaysInstalled)return false;
    const p=World.prototype;p.__p1hPlanningOverlaysInstalled=true;
    p.planningOverlayModes=function(){return MODES.slice()};
    p.planningOverlayData=function(mode='service',now=Date.now()){
      if(!MODES.includes(mode))mode='service';this.updateConstruction?.(now);
      const width=this.world.width,height=this.world.height,cells=[],buildings=this.placedBuildings(),city=this.cityServiceSummary?.()||null;
      const roadSet=new Set(this.roadTiles().map(r=>`${r.x},${r.y}`));
      const push=(x,y,value,label,kind='neutral',extra={})=>cells.push({x,y,value:clamp01(value),label,kind,...extra});
      if(mode==='roads'){
        for(let y=0;y<height;y++)for(let x=0;x<width;x++){const road=roadSet.has(`${x},${y}`),t=this.tile(x,y),anchor=t?.buildingId?{x,y}:t?.occupiedBy?this.anchorFor(x,y):null;let connected=false;if(anchor){const a=this.adjacencyStatus?.(anchor.x,anchor.y);connected=!!a?.roadConnected}push(x,y,road?1:connected?.8:0,road?'Road':connected?'Road served':'No road access',road?'road':connected?'good':'bad')}
      }else if(mode==='districts'){
        for(const b of buildings){const a=this.adjacencyStatus?.(b.x,b.y),bonus=Math.min(.2,Number(a?.districtBonus)||0),fp=b.footprint||{w:1,h:1};for(let dy=0;dy<fp.h;dy++)for(let dx=0;dx<fp.w;dx++)push(b.x+dx,b.y+dy,bonus/.2,bonus?`+${Math.round(bonus*100)}% district bonus`:'No district cluster',bonus>=.1?'good':bonus>0?'warn':'bad',{district:b.def?.district||'core',buildingId:b.id})}
      }else if(mode==='construction'){
        for(const b of buildings){const job=this.constructionJobAt?.(b.x,b.y),progress=this.constructionProgress?.(b.tile,now)??1,fp=b.footprint||{w:1,h:1},kind=!job?'good':job.status==='active'?'active':'queued';for(let dy=0;dy<fp.h;dy++)for(let dx=0;dx<fp.w;dx++)push(b.x+dx,b.y+dy,job?Math.max(.08,progress):1,job?`${job.status==='active'?'Building':'Queued'} · ${Math.round(progress*100)}%`:'Complete',kind,{buildingId:b.id,status:job?.status||'complete'})}
      }else{
        for(const b of buildings){const svc=this.buildingServiceStatus?.(b.x,b.y),profile=this.serviceProfile?.(b.x,b.y),fp=b.footprint||{w:1,h:1};let value=1,label='Healthy',kind='good';
          if(mode==='service'){value=svc?.efficiency??1;label=`${Math.round(value*100)}% service`;kind=value>=.95?'good':value>=.7?'warn':'bad'}
          if(mode==='power'){value=city?.powerRatio??1;label=profile?.powerDemand?`${Math.round(value*100)}% power availability`:'Power producer';kind=profile?.powerSupply>profile?.powerDemand?'source':value>=.95?'good':value>=.7?'warn':'bad'}
          if(mode==='workforce'){value=city?.workerRatio??1;label=profile?.workerDemand?`${Math.round(value*100)}% workforce availability`:'No worker demand';kind=value>=.95?'good':value>=.7?'warn':'bad'}
          if(mode==='housing'){value=city?.housingRatio??1;label=profile?.housingCapacity?`Housing +${Math.round(profile.housingCapacity)}`:`${Math.round(value*100)}% housing capacity`;kind=profile?.housingCapacity?'source':value>=.95?'good':value>=.7?'warn':'bad'}
          for(let dy=0;dy<fp.h;dy++)for(let dx=0;dx<fp.w;dx++)push(b.x+dx,b.y+dy,value,label,kind,{buildingId:b.id});
        }
      }
      const summary={mode,width,height,count:cells.length};if(city)Object.assign(summary,{powerRatio:city.powerRatio,workerRatio:city.workerRatio,housingRatio:city.housingRatio,healthy:city.healthy});
      return{mode,cells,summary};
    };
    return true;
  }
  C.register('PlanningOverlays',{install,MODES});
})(window.Codeopolis);
