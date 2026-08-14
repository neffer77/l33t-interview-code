(function(C){
  'use strict';
  const clone=v=>JSON.parse(JSON.stringify(v));
  function install(){
    const World=C.get?.('WorldSystem');if(!World||World.prototype.__p1iEditingInstalled)return false;
    const p=World.prototype;p.__p1iEditingInstalled=true;
    const rawPlace=p.placeBuilding,rawRoad=p.setRoad,rawDemolish=p.demolishBuilding;
    p.ensureEditState=function(){return this.__cityEdit||(this.__cityEdit={undo:[],tx:null,relocation:null,restoring:false})};
    p.captureEditSnapshot=function(label='City edit'){
      return{label,world:clone(this.world),money:Number(this.state?.money)||0,buildings:clone(this.state?.buildings||[])};
    };
    p.restoreEditSnapshot=function(s){if(!s)return false;const e=this.ensureEditState();e.restoring=true;try{const restored=clone(s.world);for(const k of Object.keys(this.world))delete this.world[k];Object.assign(this.world,restored);this.state.world=this.world;this.state.money=s.money;this.state.buildings=clone(s.buildings);this.normalize(this.world);C.events.emit('world:city-restored',{label:s.label});C.events.emit('world:selected',this.world.selected);return true}finally{e.restoring=false}};
    p.pushUndo=function(s){if(!s)return;const e=this.ensureEditState();e.undo.push(s);if(e.undo.length>20)e.undo.shift();C.events.emit('world:undo-state',{available:true,label:s.label})};
    p.beginCityEdit=function(label){const e=this.ensureEditState();if(e.tx)return false;e.tx=this.captureEditSnapshot(label);return true};
    p.commitCityEdit=function(){const e=this.ensureEditState();if(!e.tx)return false;this.pushUndo(e.tx);e.tx=null;return true};
    p.cancelCityEdit=function(){const e=this.ensureEditState(),s=e.tx;e.tx=null;return s?this.restoreEditSnapshot(s):false};
    p.undoCityEdit=function(){const e=this.ensureEditState();if(e.tx)this.cancelCityEdit();const s=e.undo.pop();if(!s)return{ok:false,reason:'Nothing to undo'};this.restoreEditSnapshot(s);C.events.emit('world:undo-state',{available:e.undo.length>0,label:e.undo.at(-1)?.label||null});return{ok:true,label:s.label}};
    p.beginRelocation=function(x,y){const e=this.ensureEditState();if(e.relocation)return{ok:false,reason:'Finish the current move first'};const a=this.anchorFor?.(x,y)||{x,y},t=this.tile(a.x,a.y);if(!t?.buildingId)return{ok:false,reason:'No building selected'};if(this.constructionJobAt?.(a.x,a.y))return{ok:false,reason:'Finish construction before moving'};this.beginCityEdit(`Move ${this.buildingDef(t.buildingId)?.name||t.buildingId}`);const r=this.unplaceBuilding(a.x,a.y);if(!r.ok){e.tx=null;return r}e.relocation={id:r.id,from:{x:a.x,y:a.y}};this.setTool('building',r.id);C.events.emit('world:relocation-started',e.relocation);return{ok:true,...e.relocation}};
    p.finishRelocation=function(){const e=this.ensureEditState();if(!e.relocation)return false;const info=e.relocation;e.relocation=null;this.commitCityEdit();C.events.emit('world:relocation-finished',info);return true};
    p.cancelRelocation=function(){const e=this.ensureEditState();if(!e.relocation)return false;const info=e.relocation;e.relocation=null;this.cancelCityEdit();this.setTool('inspect');C.events.emit('world:relocation-cancelled',info);return true};
    p.placeBuilding=function(id,x,y,opts={}){const e=this.ensureEditState(),auto=!e.restoring&&!e.tx;if(auto)this.beginCityEdit(`Place ${this.buildingDef(id)?.name||id}`);const r=rawPlace.call(this,id,x,y,opts);if(auto){if(r?.ok)this.commitCityEdit();else e.tx=null}return r};
    p.setRoad=function(x,y,value=true){const e=this.ensureEditState(),auto=!e.restoring&&!e.tx;if(auto)this.beginCityEdit(value?'Build road':'Remove road');const r=rawRoad.call(this,x,y,value);if(auto){if(r?.ok&&r.changed)this.commitCityEdit();else e.tx=null}return r};
    if(rawDemolish)p.demolishBuilding=function(x,y,opts={}){const e=this.ensureEditState(),auto=!e.restoring&&!e.tx;if(auto)this.beginCityEdit('Demolish building');const r=rawDemolish.call(this,x,y,opts);if(auto){if(r?.ok)this.commitCityEdit();else e.tx=null}return r};
    return true;
  }
  C.register('CityEditing',{install});
})(window.Codeopolis);
