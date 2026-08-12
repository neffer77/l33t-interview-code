(function(C){
  'use strict';
  class LLMInterviewerAdapter{
    constructor(localEvaluator){this.localEvaluator=localEvaluator;this.config=this.loadConfig()}
    loadConfig(){try{return JSON.parse(localStorage.getItem('codeopolis-llm-config')||'{}')}catch{return{}}}
    saveConfig(next){this.config={...this.config,...next};localStorage.setItem('codeopolis-llm-config',JSON.stringify(this.config));return this.config}
    enabled(){return Boolean(this.config.endpoint)}
    async evaluate({challenge,text,history=[]}){
      if(!this.enabled())return{provider:'local',...this.localEvaluator.evaluate(text,challenge)};
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
      try{
        const res=await fetch(this.config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'interview_reasoning',challenge:{id:challenge.id,title:challenge.title,prompt:challenge.prompt,pattern:challenge.pattern,complexity:challenge.complexity},answer:String(text||''),history}),signal:controller.signal});
        if(!res.ok)throw new Error(`LLM proxy ${res.status}`);
        const data=await res.json();
        return{provider:'llm',score:Math.max(0,Math.min(100,Number(data.score)||0)),scores:data.scores||{},missing:Array.isArray(data.missing)?data.missing:[],feedback:String(data.feedback||''),followUp:String(data.followUp||'What assumption is most likely to break at scale?')};
      }catch(err){return{provider:'local-fallback',error:String(err.message||err),...this.localEvaluator.evaluate(text,challenge)}}finally{clearTimeout(timer)}
    }
  }
  C.register('LLMInterviewerAdapter',LLMInterviewerAdapter);
})(window.Codeopolis);
