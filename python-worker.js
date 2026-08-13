// Pyodide 314.x ships an ESM-only core (pyodide.asm.mjs, no pyodide.asm.js) and
// its loader uses dynamic import(). A classic worker can load neither, so
// importScripts() of pyodide.js fails with NetworkError. worker-bridge.js starts
// this file with {type:'module'} and we import the ESM entrypoint instead.
const PYODIDE_VERSION='314.0.3';
const PYODIDE_BASE=`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let pyodide=null;

async function boot(){
  const {loadPyodide}=await import(`${PYODIDE_BASE}pyodide.mjs`);
  pyodide=await loadPyodide({indexURL:PYODIDE_BASE});
  self.postMessage({type:'ready'});
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
  // Python has no `null`. Challenges without an adapter must emit None, or every
  // test case dies with NameError before the solution is ever called.
  const pyLiteral=v=>v==null?'None':JSON.stringify(v);
  return `import json, traceback, time, copy\n${normalize}\nclass ListNode:\n    def __init__(self,val=0,next=None):\n        self.val=val; self.next=next\nclass TreeNode:\n    def __init__(self,val=0,left=None,right=None):\n        self.val=val; self.left=left; self.right=right\ndef build_list(vals):\n    dummy=ListNode(); cur=dummy\n    for v in vals:\n        cur.next=ListNode(v); cur=cur.next\n    return dummy.next\ndef list_to_array(node):\n    out=[]; seen=0\n    while node is not None and seen<10000:\n        out.append(node.val); node=node.next; seen+=1\n    return out\ndef build_tree(vals):\n    if not vals:return None\n    nodes=[None if v is None else TreeNode(v) for v in vals]\n    kids=nodes[::-1]; root=kids.pop()\n    for node in nodes:\n        if node is not None:\n            if kids: node.left=kids.pop()\n            if kids: node.right=kids.pop()\n    return root\ndef tree_to_level(root):\n    if root is None:return []\n    out=[]; q=[root]\n    while q:\n        node=q.pop(0)\n        if node is None: out.append(None); continue\n        out.append(node.val); q.extend([node.left,node.right])\n    while out and out[-1] is None: out.pop()\n    return out\ndef find_node(root,val):\n    if root is None:return None\n    q=[root]\n    while q:\n        n=q.pop(0)\n        if n.val==val:return n\n        if n.left:q.append(n.left)\n        if n.right:q.append(n.right)\n    return None\ndef adapt_args(args,kind):\n    args=list(args)\n    if kind=='list_first' and args: args[0]=build_list(args[0])\n    elif kind=='two_lists' and len(args)>=2: args[0]=build_list(args[0]); args[1]=build_list(args[1])\n    elif kind=='tree_first' and args: args[0]=build_tree(args[0])\n    elif kind=='two_trees' and len(args)>=2: args[0]=build_tree(args[0]); args[1]=build_tree(args[1])\n    elif kind=='tree_pq' and len(args)>=3:\n        root=build_tree(args[0]); args=[root,find_node(root,args[1]),find_node(root,args[2])]+args[3:]\n    return tuple(args)\ndef adapt_output(v,kind):\n    if kind=='listnode': return list_to_array(v)\n    if kind=='treenode': return tree_to_level(v)\n    if kind=='nodeval': return None if v is None else v.val\n    return v\nns={'ListNode':ListNode,'TreeNode':TreeNode}\ntry:\n    exec(${JSON.stringify(job.code)}, ns)\n    fn=ns.get(${JSON.stringify(job.fn)})\n    if not callable(fn):\n        raise NameError('Expected a function named ${job.fn}')\n    cases=json.loads(${JSON.stringify(payload)})\n    results=[]\n    started=time.perf_counter()\n    for idx,pair in enumerate(cases):\n        raw_args=eval(pair[0], {})\n        expected=eval(pair[1], {})\n        try:\n            args=adapt_args(copy.deepcopy(raw_args), ${pyLiteral(job.inputAdapter)})\n            actual=fn(*args)\n            actual=adapt_output(actual, ${pyLiteral(job.outputAdapter)})\n            ok=normalize(actual)==normalize(expected)\n            results.append({'index':idx,'ok':ok,'actual':repr(actual),'expected':repr(expected),'error':None})\n        except Exception as e:\n            results.append({'index':idx,'ok':False,'actual':None,'expected':repr(expected),'error':type(e).__name__+': '+str(e)})\n    elapsed=(time.perf_counter()-started)*1000\n    _result = json.dumps({'fatal':None,'elapsed':elapsed,'results':results})\nexcept Exception as e:\n    _result = json.dumps({'fatal':type(e).__name__+': '+str(e),'trace':traceback.format_exc(limit=2),'elapsed':0,'results':[]})\n_result`;
}

self.onmessage=async event=>{
  const job=event.data;
  if(!job||job.type!=='judge')return;
  try{
    if(!pyodide)throw new Error('Python worker is not ready');
    const result=JSON.parse(await pyodide.runPythonAsync(harness(job)));
    self.postMessage({type:'result',id:job.id,result});
  }catch(error){
    self.postMessage({type:'result',id:job.id,result:{fatal:String(error),elapsed:0,results:[]}});
  }
};

boot().catch(error=>self.postMessage({type:'boot-error',error:String(error)}));
