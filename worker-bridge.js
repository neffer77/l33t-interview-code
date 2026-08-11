// Phase 4/5 judge hardening: run submitted Python in a killable Web Worker.
let judgeWorker=null;
let judgeWorkerReady=false;
let judgeWorkerStatus='loading';
let judgeSeq=0;
const judgePending=new Map();
const JUDGE_TIMEOUT_MS=5000;

const baseWorkerRenderChallenge=renderChallenge;
renderPythonStatus=function(){
  pyStatus=judgeWorkerStatus;
  const el=$('#pythonStatus');
  if(!el)return;
  el.className='tag '+(judgeWorkerStatus==='ready'?'ready':judgeWorkerStatus==='error'?'error':'loading');
  el.textContent=judgeWorkerStatus==='ready'?'Python worker ready':judgeWorkerStatus==='error'?'Python worker unavailable':'Loading Python worker…';
};
renderChallenge=function(){
  pyStatus=judgeWorkerStatus;
  baseWorkerRenderChallenge();
};

function startJudgeWorker(){
  if(judgeWorker)judgeWorker.terminate();
  judgeWorkerReady=false;
  judgeWorkerStatus='loading';
  pyStatus='loading';
  renderPythonStatus();
  judgeWorker=new Worker('python-worker.js');
  judgeWorker.onmessage=event=>{
    const msg=event.data||{};
    if(msg.type==='ready'){
      judgeWorkerReady=true;
      judgeWorkerStatus='ready';
      pyStatus='ready';
      renderPythonStatus();
      renderChallenge();
      return;
    }
    if(msg.type==='boot-error'){
      judgeWorkerReady=false;
      judgeWorkerStatus='error';
      pyStatus='error';
      renderPythonStatus();
      renderChallenge();
      console.error('Python worker boot error:',msg.error);
      return;
    }
    if(msg.type==='result'){
      const pending=judgePending.get(msg.id);
      if(!pending)return;
      clearTimeout(pending.timer);
      judgePending.delete(msg.id);
      pending.resolve(msg.result);
    }
  };
  judgeWorker.onerror=error=>{
    console.error('Python worker error:',error);
    judgeWorkerReady=false;
    judgeWorkerStatus='error';
    pyStatus='error';
    renderPythonStatus();
    renderChallenge();
  };
}

function failPendingForRestart(message){
  for(const [id,pending] of judgePending){
    clearTimeout(pending.timer);
    pending.resolve({fatal:message,elapsed:0,results:[],timedOut:true});
    judgePending.delete(id);
  }
}

judge=function(c,code,cases){
  if(!judgeWorker||!judgeWorkerReady)return Promise.resolve({fatal:'Python worker is still loading. Try again in a moment.',elapsed:0,results:[]});
  return new Promise(resolve=>{
    const id=++judgeSeq;
    const timer=setTimeout(()=>{
      judgePending.delete(id);
      resolve({fatal:`Execution timed out after ${JUDGE_TIMEOUT_MS/1000} seconds. Check for an infinite loop or unexpectedly expensive algorithm.`,elapsed:JUDGE_TIMEOUT_MS,results:[],timedOut:true});
      failPendingForRestart('Python worker restarted after another submission timed out.');
      startJudgeWorker();
    },JUDGE_TIMEOUT_MS);
    judgePending.set(id,{resolve,timer});
    judgeWorker.postMessage({type:'judge',id,fn:c.fn,normalize:c.normalize||null,inputAdapter:c.inputAdapter||null,outputAdapter:c.outputAdapter||null,code,cases});
  });
};

startJudgeWorker();
