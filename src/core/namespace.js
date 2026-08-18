(function(global){
  'use strict';
  const C=global.Codeopolis=global.Codeopolis||{};
  C.version='6.0.0';
  C.modules=C.modules||{};

  const listeners=new Map();
  C.events={
    on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name)?.delete(fn)},
    once(name,fn){const off=this.on(name,(payload)=>{off();fn(payload)});return off},
    off(name,fn){listeners.get(name)?.delete(fn)},
    emit(name,payload){for(const fn of listeners.get(name)||[]){try{fn(payload)}catch(err){console.error('[Codeopolis event]',name,err)}}}
  };

  C.util={
    clamp:(v,min,max)=>Math.max(min,Math.min(max,v)),
    lerp:(a,b,t)=>a+(b-a)*t,
    smoothstep:t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)},
    key:(x,y)=>`${x},${y}`,
    uid:(prefix='id')=>`${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
    hash(input){let h=2166136261;const s=String(input);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0},
    seeded(input){let x=C.util.hash(input)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}},
    formatNumber(v){return Math.abs(v)>=1000000?`${(v/1000000).toFixed(1)}m`:Math.abs(v)>=1000?`${(v/1000).toFixed(1)}k`:Math.round(v).toLocaleString()},
    now:()=>Date.now()
  };

  C.register=function(name,value){C.modules[name]=value;return value};
  C.get=function(name){return C.modules[name]};
})(window);
