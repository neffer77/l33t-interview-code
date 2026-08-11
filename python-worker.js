const PYODIDE_VERSION='314.0.3';
let pyodide=null;

async function boot(){
  importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`);
  pyodide=await loadPyodide({indexURL:`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`});
  postMessage({type:'ready'});
}

function normalizerSource(kind){
  if(kind==='triplets')return `def normalize(v):\n    return sorted([sorted(list(x)) for x in v])`;
  if(kind==='groups')return `def normalize(v):\n    return sorted([sorted(list(group)) for group in v])`;
  if(kind==='unordered')return `def normalize(v):\n    return sorted(list(v))`;
  if(kind==='intervals')return `def normalize(v):\n    return sorted([list(x) for x in v])`;
  return `def normalize(v):\n    return v`;
}

function harness(job){
  const payload=JSON.stringify(job.cases);
  const normalize=normalizerSource(job.normalize);
  return `import json, traceback, time, copy\n${normalize}\nns={}\ntry:\n    exec(${JSON.stringify(job.code)}, ns)\n    fn=ns.get(${JSON.stringify(job.fn)})\n    if not callable(fn):\n        raise NameError('Expected a function named ${job.fn}')\n    cases=json.loads(${JSON.stringify(payload)})\n    results=[]\n    started=time.perf_counter()\n    for idx,pair in enumerate(cases):\n        args=eval(pair[0], {})\n        expected=eval(pair[1], {})\n        try:\n            actual=fn(*copy.deepcopy(args))\n            ok=normalize(actual)==normalize(expected)\n            results.append({'index':idx,'ok':ok,'actual':repr(actual),'expected':repr(expected),'error':None})\n        except Exception as e:\n            results.append({'index':idx,'ok':False,'actual':None,'expected':repr(expected),'error':type(e).__name__+': '+str(e)})\n    elapsed=(time.perf_counter()-started)*1000\n    json.dumps({'fatal':None,'elapsed':elapsed,'results':results})\nexcept Exception as e:\n    json.dumps({'fatal':type(e).__name__+': '+str(e),'trace':traceback.format_exc(limit=2),'elapsed':0,'results':[]})`;
}

onmessage=async event=>{
  const job=event.data;
  if(!job||job.type!=='judge')return;
  try{
    if(!pyodide)throw new Error('Python worker is not ready');
    const result=JSON.parse(await pyodide.runPythonAsync(harness(job)));
    postMessage({type:'result',id:job.id,result});
  }catch(error){
    postMessage({type:'result',id:job.id,result:{fatal:String(error),elapsed:0,results:[]}});
  }
};

boot().catch(error=>postMessage({type:'boot-error',error:String(error)}));
