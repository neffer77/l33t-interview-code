(function(C){
  'use strict';
  const {clamp,lerp,seeded}=C.util;

  class CitySimulation{
    constructor(world,gameState){
      this.world=world;this.state=gameState;this.agents=[];this.particles=[];this.time=0;this.rand=seeded(`city-${gameState.solved?.length||0}-${gameState.buildings?.length||0}`);
      C.events.on('reward:particles',e=>this.burst(e));
      C.events.on('world:building-placed',e=>this.burst({x:e.x,y:e.y,kind:'construction',count:18}));
    }

    update(dt){
      dt=Math.min(dt,.05);this.time+=dt;
      this.world.world.dayPhase=(this.world.world.dayPhase+dt/210)%1;
      this.syncAgents();
      for(const a of this.agents)this.updateAgent(a,dt);
      for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.25*dt}
      this.particles=this.particles.filter(p=>p.life>0);
      C.events.emit('world:tick',{dt,time:this.time,dayPhase:this.world.world.dayPhase});
    }

    syncAgents(){
      const roads=this.world.roadTiles();if(!roads.length){this.agents.length=0;return}
      const desired=clamp(Math.round((this.state.population||12)/8),5,34);
      while(this.agents.length<desired){const r=roads[Math.floor(this.rand()*roads.length)];this.agents.push(this.makeAgent(r))}
      if(this.agents.length>desired)this.agents.length=desired;
    }

    makeAgent(tile){
      const kind=this.rand()<.32?'car':'citizen';
      return{kind,x:tile.x,y:tile.y,from:{x:tile.x,y:tile.y},to:{x:tile.x,y:tile.y},t:this.rand(),speed:(kind==='car'?1.2:.55)*(0.75+this.rand()*.5),variant:Math.floor(this.rand()*5)};
    }

    chooseNext(a){
      const options=this.world.neighbors(a.to.x,a.to.y,{roadsOnly:true});
      if(!options.length)return{x:a.to.x,y:a.to.y};
      // Avoid immediate reversals when possible so traffic looks intentional.
      const forward=options.filter(p=>p.x!==a.from.x||p.y!==a.from.y),pool=forward.length?forward:options;
      return pool[Math.floor(this.rand()*pool.length)];
    }

    updateAgent(a,dt){
      a.t+=a.speed*dt;
      while(a.t>=1){a.t-=1;a.from={x:a.to.x,y:a.to.y};a.to=this.chooseNext(a)}
      const eased=a.t*a.t*(3-2*a.t);a.x=lerp(a.from.x,a.to.x,eased);a.y=lerp(a.from.y,a.to.y,eased);
    }

    burst({x,y,kind='reward',count=24}={}){
      if(!Number.isFinite(x)||!Number.isFinite(y)){const target=this.world.placedBuildings()[0];if(!target)return;x=target.x;y=target.y}
      for(let i=0;i<count;i++){
        const angle=this.rand()*Math.PI*2,speed=.25+this.rand()*.75;
        this.particles.push({x:x+(this.rand()-.5)*.3,y:y+(this.rand()-.5)*.3,z:.3+this.rand()*.7,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.8+this.rand()*1.2,maxLife:2,kind,variant:Math.floor(this.rand()*4)});
      }
    }

    daylight(){
      const p=this.world.world.dayPhase;
      // 0 = midnight, .25 sunrise, .5 noon, .75 sunset.
      return clamp((Math.sin((p-.25)*Math.PI*2)+1)/2,.08,1);
    }
  }

  C.register('CitySimulation',CitySimulation);
})(window.Codeopolis);
