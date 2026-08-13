// Phase 43 P3 — focused mobile navigation.
(() => {
  const primary = [['challenge','⚔️','Code'],['learning','🧠','Learn'],['city','🏙️','City'],['mock','🎙️','Interview'],['stats','📊','Progress']];
  const go = tab => { if (typeof window.switchTab === 'function') window.switchTab(tab); else document.querySelector(`.tabs button[data-tab="${tab}"]`)?.click(); sync(); };
  function current(){ return document.querySelector('.tabs button.active[data-tab]')?.dataset.tab || 'challenge'; }
  function sync(){ const tab=current(); document.querySelectorAll('.phase43-dock [data-p3-tab]').forEach(b=>b.classList.toggle('active',b.dataset.p3Tab===tab)); const label=document.querySelector('.phase43-context-label'); const src=document.querySelector(`.tabs button[data-tab="${tab}"]`); if(label&&src) label.textContent=src.textContent.trim(); }
  function more(){
    const old=document.querySelector('.phase43-more-sheet'); if(old){old.remove();return;}
    const sheet=document.createElement('div'); sheet.className='phase43-more-sheet'; sheet.innerHTML='<div class="phase43-more-title"><b>More systems</b><button type="button">×</button></div><div class="phase43-more-grid"></div>';
    sheet.querySelector('button').onclick=()=>sheet.remove(); const grid=sheet.querySelector('.phase43-more-grid');
    document.querySelectorAll('.tabs button[data-tab]').forEach(src=>{ if(primary.some(x=>x[0]===src.dataset.tab))return; const b=document.createElement('button'); b.className='btn'; b.textContent=src.textContent.trim(); b.onclick=()=>{go(src.dataset.tab);sheet.remove();}; grid.appendChild(b); });
    document.body.appendChild(sheet); requestAnimationFrame(()=>sheet.classList.add('open'));
  }
  function boot(){
    if(document.querySelector('.phase43-dock'))return;
    const context=document.createElement('div'); context.className='phase43-context-bar'; context.innerHTML='<b class="phase43-context-label">⚔️ Challenge</b><span>Choose one action</span>'; document.body.appendChild(context);
    const dock=document.createElement('nav'); dock.className='phase43-dock'; dock.setAttribute('aria-label','Primary game navigation');
    primary.forEach(([tab,icon,label])=>{const b=document.createElement('button');b.type='button';b.dataset.p3Tab=tab;b.innerHTML=`<span>${icon}</span><small>${label}</small>`;b.onclick=()=>go(tab);dock.appendChild(b);});
    const b=document.createElement('button');b.type='button';b.innerHTML='<span>•••</span><small>More</small>';b.onclick=more;dock.appendChild(b);document.body.appendChild(dock);
    document.querySelector('.tabs')?.classList.add('phase43-tabs-source'); document.addEventListener('click',e=>{if(e.target.closest?.('.tabs button[data-tab]'))setTimeout(sync,0);}); sync();
    (window.Codeopolis=window.Codeopolis||{}).phase43P3={go,sync,more};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
