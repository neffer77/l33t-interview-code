// Phase 43 P0 — make judged Python usable in iOS/Scriptable and make the textarea act like a code editor.
(() => {
  const root = window.Codeopolis = window.Codeopolis || {};
  const runtime = root.phase43P0 = root.phase43P0 || {};
  const isScriptable = new URLSearchParams(location.search).get('source') === 'scriptable';
  let fallbackPyodide = null;
  let fallbackBoot = null;

  function pyNormalizer(kind) {
    if (kind === 'triplets') return `def normalize(v):\n    return sorted([sorted(list(x)) for x in v])`;
    if (kind === 'groups') return `def normalize(v):\n    return sorted([sorted(list(group)) for group in v])`;
    if (kind === 'unordered') return `def normalize(v):\n    return sorted(list(v))`;
    if (kind === 'intervals') return `def normalize(v):\n    return sorted([list(x) for x in v])`;
    return `def normalize(v):\n    return v`;
  }

  function fallbackHarness(job) {
    const normalize = pyNormalizer(job.normalize);
    const payload = JSON.stringify(job.cases);
    return `import json, traceback, time, copy\n${normalize}\nclass ListNode:\n    def __init__(self,val=0,next=None): self.val=val; self.next=next\nclass TreeNode:\n    def __init__(self,val=0,left=None,right=None): self.val=val; self.left=left; self.right=right\ndef build_list(vals):\n    dummy=ListNode(); cur=dummy\n    for v in vals: cur.next=ListNode(v); cur=cur.next\n    return dummy.next\ndef list_to_array(node):\n    out=[]; seen=0\n    while node is not None and seen<10000: out.append(node.val); node=node.next; seen+=1\n    return out\ndef build_tree(vals):\n    if not vals:return None\n    nodes=[None if v is None else TreeNode(v) for v in vals]; kids=nodes[::-1]; root=kids.pop()\n    for node in nodes:\n        if node is not None:\n            if kids: node.left=kids.pop()\n            if kids: node.right=kids.pop()\n    return root\ndef tree_to_level(root):\n    if root is None:return []\n    out=[]; q=[root]\n    while q:\n        node=q.pop(0)\n        if node is None: out.append(None); continue\n        out.append(node.val); q.extend([node.left,node.right])\n    while out and out[-1] is None: out.pop()\n    return out\ndef find_node(root,val):\n    if root is None:return None\n    q=[root]\n    while q:\n        n=q.pop(0)\n        if n.val==val:return n\n        if n.left:q.append(n.left)\n        if n.right:q.append(n.right)\n    return None\ndef adapt_args(args,kind):\n    args=list(args)\n    if kind=='list_first' and args: args[0]=build_list(args[0])\n    elif kind=='two_lists' and len(args)>=2: args[0]=build_list(args[0]); args[1]=build_list(args[1])\n    elif kind=='tree_first' and args: args[0]=build_tree(args[0])\n    elif kind=='two_trees' and len(args)>=2: args[0]=build_tree(args[0]); args[1]=build_tree(args[1])\n    elif kind=='tree_pq' and len(args)>=3:\n        root=build_tree(args[0]); args=[root,find_node(root,args[1]),find_node(root,args[2])]+args[3:]\n    return tuple(args)\ndef adapt_output(v,kind):\n    if kind=='listnode': return list_to_array(v)\n    if kind=='treenode': return tree_to_level(v)\n    if kind=='nodeval': return None if v is None else v.val\n    return v\nns={'ListNode':ListNode,'TreeNode':TreeNode}\ntry:\n    exec(${JSON.stringify(job.code)}, ns); fn=ns.get(${JSON.stringify(job.fn)})\n    if not callable(fn): raise NameError('Expected a function named ${job.fn}')\n    cases=json.loads(${JSON.stringify(payload)}); results=[]; started=time.perf_counter()\n    for idx,pair in enumerate(cases):\n        raw_args=eval(pair[0], {}); expected=eval(pair[1], {})\n        try:\n            args=adapt_args(copy.deepcopy(raw_args), ${JSON.stringify(job.inputAdapter || null)}); actual=fn(*args); actual=adapt_output(actual, ${JSON.stringify(job.outputAdapter || null)})\n            results.append({'index':idx,'ok':normalize(actual)==normalize(expected),'actual':repr(actual),'expected':repr(expected),'error':None})\n        except Exception as e: results.append({'index':idx,'ok':False,'actual':None,'expected':repr(expected),'error':type(e).__name__+': '+str(e)})\n    json.dumps({'fatal':None,'elapsed':(time.perf_counter()-started)*1000,'results':results})\nexcept Exception as e: json.dumps({'fatal':type(e).__name__+': '+str(e),'trace':traceback.format_exc(limit=2),'elapsed':0,'results':[]})`;
  }

  async function ensureFallbackPython() {
    if (fallbackPyodide) return fallbackPyodide;
    if (!fallbackBoot) fallbackBoot = (async () => {
      if (typeof loadPyodide !== 'function') throw new Error('Pyodide failed to load. Check the network connection and reload Codeopolis.');
      fallbackPyodide = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${window.PYODIDE_VERSION || '314.0.3'}/full/` });
      return fallbackPyodide;
    })();
    return fallbackBoot;
  }

  function enableFallback(reason) {
    if (runtime.fallbackEnabled) return;
    runtime.fallbackEnabled = true;
    runtime.fallbackReason = reason || (isScriptable ? 'Scriptable WebView' : 'Web Worker unavailable');
    const workerJudge = window.judge;
    window.judge = async function(c, code, cases) {
      if (!runtime.fallbackEnabled && workerJudge) return workerJudge(c, code, cases);
      try {
        const py = await ensureFallbackPython();
        return JSON.parse(await py.runPythonAsync(fallbackHarness({ fn:c.fn, normalize:c.normalize, inputAdapter:c.inputAdapter, outputAdapter:c.outputAdapter, code, cases })));
      } catch (error) {
        return { fatal: `Python runtime unavailable: ${String(error)}`, elapsed:0, results:[] };
      }
    };
    window.judgeWorkerStatus = 'loading';
    window.pyStatus = 'loading';
    if (typeof window.renderPythonStatus === 'function') window.renderPythonStatus();
    ensureFallbackPython().then(() => {
      window.judgeWorkerStatus = 'ready'; window.pyStatus = 'ready';
      const el = document.querySelector('#pythonStatus');
      if (el) { el.className='tag ready'; el.textContent='Python ready · iOS mode'; }
      if (typeof window.renderChallenge === 'function') window.renderChallenge();
    }).catch(error => {
      console.error('Phase 43 Python fallback boot error:', error);
      window.judgeWorkerStatus = 'error'; window.pyStatus = 'error';
      const el = document.querySelector('#pythonStatus');
      if (el) { el.className='tag error'; el.textContent='Python runtime unavailable'; }
    });
  }

  function insertText(el, text, selectionOffset) {
    const start=el.selectionStart, end=el.selectionEnd;
    el.setRangeText(text, start, end, 'end');
    const pos = start + (selectionOffset == null ? text.length : selectionOffset);
    el.setSelectionRange(pos,pos); el.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function enhanceEditor(el) {
    if (!el || el.dataset.phase43Editor) return;
    el.dataset.phase43Editor='1'; el.spellcheck=false; el.autocapitalize='off'; el.autocomplete='off'; el.autocorrect='off';
    el.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start=el.selectionStart, end=el.selectionEnd;
        if (start !== end) {
          const before=el.value.slice(0,start), selected=el.value.slice(start,end);
          const lineStart=before.lastIndexOf('\n')+1;
          const block=el.value.slice(lineStart,end);
          const changed=event.shiftKey ? block.replace(/^ {1,4}/gm,'') : block.replace(/^/gm,'    ');
          el.setRangeText(changed,lineStart,end,'select'); el.dispatchEvent(new Event('input',{bubbles:true}));
        } else if (event.shiftKey) {
          const lineStart=el.value.lastIndexOf('\n',start-1)+1; const prefix=el.value.slice(lineStart,start); const m=prefix.match(/^ {1,4}/);
          if (m) { el.setRangeText('',lineStart,lineStart+m[0].length,'preserve'); el.setSelectionRange(Math.max(lineStart,start-m[0].length),Math.max(lineStart,start-m[0].length)); }
        } else insertText(el,'    ');
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const before=el.value.slice(0,el.selectionStart); const line=(before.split('\n').pop()||''); const indent=(line.match(/^\s*/)||[''])[0];
        insertText(el,'\n'+indent+(line.trimEnd().endsWith(':')?'    ':''));
      }
    });
    const toolbar=document.createElement('div'); toolbar.className='phase43-editor-toolbar';
    [['⇥','    '],['←','←'],['→','→'],['(', '()'],[':',':'],['"','""']].forEach(([label,value])=>{ const b=document.createElement('button'); b.type='button'; b.className='btn phase43-key'; b.textContent=label; b.addEventListener('click',()=>{ el.focus(); if(value==='←') el.setSelectionRange(Math.max(0,el.selectionStart-1),Math.max(0,el.selectionStart-1)); else if(value==='→') el.setSelectionRange(Math.min(el.value.length,el.selectionStart+1),Math.min(el.value.length,el.selectionStart+1)); else if(value.length===2) insertText(el,value,1); else insertText(el,value); }); toolbar.appendChild(b); });
    el.parentNode.insertBefore(toolbar,el);
  }

  function scanEditors() {
    document.querySelectorAll('textarea').forEach(el => {
      const id=(el.id||'').toLowerCase(), cls=(el.className||'').toString().toLowerCase();
      if (id.includes('code') || cls.includes('code') || /def\s+\w+\s*\(/.test(el.value||'')) enhanceEditor(el);
    });
  }

  const observer=new MutationObserver(scanEditors);
  function boot() {
    scanEditors(); observer.observe(document.body,{childList:true,subtree:true});
    if (isScriptable || typeof Worker !== 'function') enableFallback(isScriptable?'Scriptable WebView':'Web Workers unsupported');
    else setTimeout(()=>{ if (window.judgeWorkerStatus === 'error') enableFallback('Worker boot failed'); },4500);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
