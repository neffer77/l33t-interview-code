(() => {
  function boot(){
    const C=window.Codeopolis;if(!C?.events)return setTimeout(boot,150);
    const game=C.game||window.game;
    window.addEventListener('codeopolis:real-project-scored',e=>{
      const d=e.detail||{};
      C.events.emit('project:scored',d);
      game?.phase11?.telemetry?.track?.('real-project-scored',d);
      if(d.passed) C.events.emit('reward:micro',{label:`🧰 Project CI ${d.score}/100`});
    });
    window.addEventListener('codeopolis:real-project-complete',e=>{
      const d=e.detail||{};
      C.events.emit('project:completed',d);
      game?.phase11?.telemetry?.track?.('real-project-completed',d);
      if(window.state){state.money=(state.money||0)+650;state.research=(state.research||0)+180;try{persist(false)}catch{}}
      game?.phase15?.director?.card?.('🧰','Engineering project shipped',`${d.title} · ${d.score}/100`);
      game?.phase15?.director?.flash?.();
      game?.phase19?.ui?.refresh?.();game?.phase16?.ui?.refresh?.();
    });
    if(game)game.phase23={projects:window.RealProjects};
    C.events.emit('phase23:ready',{projects:window.RealProjects});
  }
  boot();
})();