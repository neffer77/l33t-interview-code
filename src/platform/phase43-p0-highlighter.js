// Phase 43 P0 — lightweight Python syntax highlighting for Scriptable-safe textareas.
(() => {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const keywords = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
  const builtins = new Set('abs all any bin bool bytearray bytes callable chr classmethod compile complex dict dir divmod enumerate eval exec filter float format frozenset getattr globals hasattr hash help hex id input int isinstance issubclass iter len list locals map max memoryview min next object oct open ord pow print property range repr reversed round set setattr slice sorted staticmethod str sum super tuple type vars zip'.split(' '));
  function tokenize(code){
    let out='',i=0;
    while(i<code.length){
      const c=code[i];
      if(c==='#'){let j=i;while(j<code.length&&code[j]!=='\n')j++;out+=`<span class="py-com">${esc(code.slice(i,j))}</span>`;i=j;continue;}
      if(c==='"'||c==="'"){
        const q=c,triple=code.slice(i,i+3)===q.repeat(3);let j=i+(triple?3:1),end=triple?q.repeat(3):q;
        while(j<code.length){if(code.slice(j,j+end.length)===end){j+=end.length;break;}if(code[j]==='\\')j+=2;else j++;}
        out+=`<span class="py-str">${esc(code.slice(i,j))}</span>`;i=j;continue;
      }
      if(/[0-9]/.test(c)){let j=i+1;while(j<code.length&&/[0-9A-Fa-f_xXbBoO\.eEjJ+-]/.test(code[j]))j++;out+=`<span class="py-num">${esc(code.slice(i,j))}</span>`;i=j;continue;}
      if(/[A-Za-z_]/.test(c)){let j=i+1;while(j<code.length&&/[A-Za-z0-9_]/.test(code[j]))j++;const w=code.slice(i,j);let cls='';if(keywords.has(w))cls='py-key';else if(builtins.has(w))cls='py-built';else if(/\s*\(/.test(code.slice(j,j+3)))cls='py-fn';out+=cls?`<span class="${cls}">${w}</span>`:w;i=j;continue;}
      if('+-*/%=<>!&|^~:@'.includes(c)){let j=i+1;while(j<code.length&&'+-*/%=<>!&|^~:@'.includes(code[j]))j++;out+=`<span class="py-op">${esc(code.slice(i,j))}</span>`;i=j;continue;}
      out+=esc(c);i++;
    }
    return out+'\n';
  }
  function applyMetrics(el,pre){
    const cs=getComputedStyle(el);
    ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius'].forEach(k=>pre.style[k]=cs[k]);
    pre.style.width=el.clientWidth+'px';pre.style.height=el.clientHeight+'px';
  }
  function decorate(el){
    if(!el||el.dataset.phase43Highlight)return;el.dataset.phase43Highlight='1';
    const wrap=document.createElement('div');wrap.className='phase43-code-wrap';el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);
    const pre=document.createElement('pre');pre.className='phase43-highlight';pre.setAttribute('aria-hidden','true');wrap.insertBefore(pre,el);
    const sync=()=>{applyMetrics(el,pre);pre.innerHTML=tokenize(el.value||'');pre.scrollTop=el.scrollTop;pre.scrollLeft=el.scrollLeft;};
    el.addEventListener('input',sync);el.addEventListener('scroll',sync);window.addEventListener('resize',sync);sync();
  }
  function scan(){document.querySelectorAll('textarea[data-phase43-editor],textarea[id*=code i],textarea[class*=code i]').forEach(decorate);}
  const style=document.createElement('style');style.textContent=`.phase43-code-wrap{position:relative;width:100%}.phase43-code-wrap textarea,.phase43-highlight{box-sizing:border-box;margin:0!important;tab-size:4;white-space:pre;overflow:auto}.phase43-highlight{position:absolute;inset:0;z-index:3;pointer-events:none;color:#d7e1ef;background:transparent;border-color:transparent!important}.phase43-code-wrap textarea{position:relative;z-index:2;color:transparent!important;caret-color:#fff;background:transparent!important;-webkit-text-fill-color:transparent!important}.phase43-code-wrap textarea::selection{background:rgba(90,145,255,.35)}.py-key{color:#ff7ab2;font-weight:700}.py-built{color:#82d2ff}.py-fn{color:#ffd580}.py-str{color:#a8db8f}.py-num{color:#d9a6ff}.py-com{color:#7285a3;font-style:italic}.py-op{color:#8ee8de}`;document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});},{once:true});else{scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});}
  (window.Codeopolis=window.Codeopolis||{}).phase43Syntax={scan,tokenize};
})();
