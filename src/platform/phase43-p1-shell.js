(() => {
  const SESSION_KEY='codeopolis-ui-session-v1';
  const PROFILE_KEY='codeopolis-profile-v1';
  const parse=(value,fallback)=>{try{return JSON.parse(value)||fallback}catch{return fallback}};
  const session=Object.assign({tab:'challenge',challenge:null,lastSeen:0},parse(localStorage.getItem(SESSION_KEY),{}));
  const profile=Object.assign({id:'player-1',name:'Player',createdAt:Date.now()},parse(localStorage.getItem(PROFILE_KEY),{}));
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));

  function saveSession(extra={}){
    Object.assign(session,extra,{lastSeen:Date.now()});
    localStorage.setItem(SESSION_KEY,JSON.stringify(session));
    const el=document.querySelector('#phase43SaveState');
    if(el){el.textContent='Saved';setTimeout(()=>el.textContent='Autosave',800)}
  }

  function currentTab(){return document.querySelector('.tabs button.active')?.dataset.tab||session.tab||'challenge'}

  function resume(){
    const tab=session.tab||'challenge';
    try{window.switchTab?.(tab)}catch{}
    if(session.challenge&&window.state){window.state.current=session.challenge;try{window.persist?.(false);window.renderChallenge?.()}catch{}}
  }

  function showStart(force=false){
    if(!force&&session.lastSeen){resume();return;}
    document.querySelector('.phase43-start')?.remove();
    const first=!session.lastSeen;
    const overlay=document.createElement('div');
    overlay.className='phase43-start';
    overlay.innerHTML=`<div class="phase43-start-card"><span class="tag">${first?'FIRST SESSION':'WELCOME BACK'}</span><h2>${first?'Start here':'Continue Codeopolis'}</h2><p>${first?'Your first goal is simple: solve one Python challenge. Passing real tests grows the city and unlocks everything else.':'Resume exactly where you left off. Your game state autosaves locally on this device.'}</p><button class="btn phase43-primary" id="phase43Primary">${first?'⚔️ Start first challenge':'▶ Continue'}</button><button class="btn phase43-secondary" id="phase43City">🏙️ Open City</button><p class="muted">Profile: <b>${profile.name}</b> · local autosave enabled</p></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#phase43Primary').onclick=()=>{overlay.remove();first?window.switchTab?.('challenge'):resume();saveSession({tab:first?'challenge':currentTab()})};
    overlay.querySelector('#phase43City').onclick=()=>{overlay.remove();window.switchTab?.('city');saveSession({tab:'city'})};
  }

  function addSessionBar(){
    const top=document.querySelector('.top'); if(!top||document.querySelector('.phase43-sessionbar'))return;
    const bar=document.createElement('div');bar.className='phase43-sessionbar';
    bar.innerHTML=`<span class="phase43-profile">${profile.name}</span><span id="phase43SaveState">Autosave</span><button class="btn" id="phase43HomeBtn">⌂</button>`;
    top.appendChild(bar);
    bar.querySelector('#phase43HomeBtn').onclick=()=>showStart(true);
  }

  function boot(){
    addSessionBar();
    document.addEventListener('click',e=>{const b=e.target.closest?.('[data-tab]');if(b)setTimeout(()=>saveSession({tab:b.dataset.tab}),0)},true);
    document.addEventListener('input',e=>{if(e.target?.tagName==='TEXTAREA')saveSession({tab:currentTab(),challenge:window.state?.current||session.challenge})},true);
    window.addEventListener('pagehide',()=>saveSession({tab:currentTab(),challenge:window.state?.current||session.challenge}));
    setTimeout(()=>showStart(false),650);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
