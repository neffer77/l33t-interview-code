// Preserve routed workspaces and override the first-pass move/remove behavior.
(() => {
  const surfaces=[['ai','aiStudio','🤖 AI Studio'],['projects','realProjects','🛠️ Projects'],['repo','repositorySim','🧪 Repository Lab']];
  const host=document.querySelector('.phase43-route-host');
  const body=host?.querySelector('.phase43-route-body');
  if(!host||!body)return;
  const map=new Map();
  surfaces.forEach(([key,id,label])=>{const el=document.getElementById(id);if(!el)return;map.set(key,{el,label});el.classList.add('phase43-routed-surface');body.appendChild(el);});
  const title=host.querySelector('[data-route-title]');
  function showCore(){host.classList.add('hidden');document.querySelector('.layout')?.classList.remove('phase43-core-hidden');document.body.classList.remove('phase43-route-open');map.forEach(({el})=>el.classList.remove('phase43-active-route'));}
  function open(key){const item=map.get(key);if(!item)return;document.querySelector('.layout')?.classList.add('phase43-core-hidden');host.classList.remove('hidden');document.body.classList.add('phase43-route-open');map.forEach(({el})=>el.classList.remove('phase43-active-route'));item.el.classList.add('phase43-active-route');if(title)title.textContent=item.label;}
  const back=host.querySelector('[data-route-back]');if(back)back.onclick=showCore;
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-phase43-route]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();open(b.dataset.phase43Route);},true);
  if(window.Codeopolis)window.Codeopolis.phase43SingleWindow={openRoute:open,showCore,surfaces};
})();
