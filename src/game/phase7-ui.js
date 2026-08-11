(function(C){
  'use strict';
  class Phase7UI{
    constructor(game,economy,discoveries,crises,quests){this.game=game;this.economy=economy;this.discoveries=discoveries;this.crises=crises;this.quests=quests;this.discoveryQueue=[];this.install();this.bind()}
    install(){
      const tabs=document.querySelector('.tabs');if(tabs&&!tabs.querySelector('[data-tab="strategy"]')){
        const research=tabs.querySelector('[data-tab="research"]'),btn=document.createElement('button');btn.dataset.tab='strategy';btn.textContent='✨ Strategy';btn.onclick=()=>{if(typeof switchTab==='function')switchTab('strategy');this.renderStrategy()};if(research)research.insertAdjacentElement('afterend',btn);else tabs.appendChild(btn);
      }
      if(!document.getElementById('strategyTab')){
        const research=document.getElementById('researchTab'),panel=document.createElement('div');panel.id='strategyTab';panel.className='hidden';if(research)research.insertAdjacentElement('afterend',panel);else document.querySelector('.panel')?.appendChild(panel);
      }
      const stats=document.querySelector('.top .stats');if(stats&&!document.getElementById('knowledgePill')){const pill=document.createElement('div');pill.id='knowledgePill';pill.className='pill knowledge-pill';stats.appendChild(pill)}
      const boss=document.getElementById('bossCard');if(boss&&!document.getElementById('crisisBanner')){const el=document.createElement('div');el.id='crisisBanner';el.className='crisis-banner hidden';boss.insertAdjacentElement('afterend',el)}
      if(!document.getElementById('discoveryOverlay')){const o=document.createElement('div');o.id='discoveryOverlay';o.className='discovery-overlay';o.innerHTML='<div id="discoveryCard" class="discovery-card"></div>';document.body.appendChild(o);o.onclick=e=>{if(e.target===o||e.target.closest('[data-close-discovery]'))this.closeDiscovery()}}
      this.refresh();
    }
    bind(){
      C.events.on('discovery:unlocked',e=>{if(!e.silent)this.enqueueDiscovery(e)});
      C.events.on('crisis:triggered',()=>{this.refresh();this.game.ui?.toast('🚨 A city systems incident needs an engineer.');this.game.audio?.click?.()});
      C.events.on('crisis:resolved',e=>{this.refresh();this.game.ui?.toast(`✅ ${e.crisis.title} resolved through mastery.`)});
      C.events.on('crisis:mitigated',()=>this.refresh());
      C.events.on('quest:completed',e=>{this.refresh();this.game.ui?.toast(`📋 Civic contract complete: ${e.quest.title}`);this.game.audio?.success?.(1)});
      C.events.on('project:completed',e=>{this.refresh();this.game.ui?.toast(`🏛️ Megaproject complete: ${e.project.name}`);this.game.audio?.discovery?.()});
      C.events.on('strategy:doctrine',e=>{this.refresh();this.game.ui?.toast(`${e.def.icon} Doctrine adopted: ${e.def.name}`)});
    }
    refresh(){this.renderKnowledgePill();this.renderCrisis();this.renderStrategy();this.decorateBuildTab()}
    renderKnowledgePill(){const el=document.getElementById('knowledgePill');if(el)el.innerHTML=`🧠 Knowledge <b>${this.economy.knowledgeIndex()}</b>`}
    renderCrisis(){
      const el=document.getElementById('crisisBanner');if(!el)return;const a=this.crises.meta.active;if(!a){el.classList.add('hidden');el.innerHTML='';return}const c=this.crises.activeChallenge(),cost=this.crises.mitigationCost();el.classList.remove('hidden');
      el.innerHTML=`<div class="crisis-head"><span>${a.icon}</span><div><b>LIVE INCIDENT · ${a.title}</b><small>${a.effect==='money'?'Economic':'Research'} output reduced until stabilized</small></div></div><p>${a.text}</p><div class="crisis-target">Engineering response: <b>${c?.title||'Adaptive challenge'}</b> · ${c?.pattern||a.district}</div><div class="actions"><button class="btn primary" data-crisis-respond>🛠️ Solve incident</button><button class="btn" data-crisis-mitigate>Emergency mitigation · 💰 ${cost}</button></div>`;
      el.querySelector('[data-crisis-respond]').onclick=()=>{this.crises.respond();this.game.ui?.toast('Incident challenge loaded. Passing it will restore the city.')};
      el.querySelector('[data-crisis-mitigate]').onclick=()=>{const r=this.crises.mitigate();if(!r.ok)this.game.ui?.toast(r.reason);else{persist(false);render();this.game.ui?.toast(`Emergency mitigation deployed for ${r.cost} credits.`)}};
    }
    districtCards(){return['arrays','hash','structures','search','graphs','dp'].map(id=>{const d=DISTRICTS[id],score=this.economy.districtScore(id);return `<div class="knowledge-card"><div class="knowledge-icon">${d.icon}</div><div><b>${d.name}</b><div class="knowledge-score">${score}</div><div class="progress"><i style="width:${score}%"></i></div><small>${score>=65?'Advanced durable mastery':score>=45?'Operational mastery':score>=25?'Developing':'Needs training'}</small></div></div>`}).join('')}
    discoveryCards(){return this.discoveries.defs().map(d=>{const unlocked=this.discoveries.unlocked(d.id);return `<div class="discovery-node ${unlocked?'unlocked':'locked'}"><div class="discovery-node-icon">${unlocked?d.icon:'❔'}</div><div><b>${unlocked?d.name:'Undiscovered Field'}</b><p>${unlocked?d.description:d.clue}</p><small>${unlocked?'Discovered · +'+d.reward+' research':this.discoveries.progressHint(d)}</small></div></div>`}).join('')}
    doctrineCards(){
      const unlocked=this.discoveries.unlocked('systems-science');if(!unlocked)return '<div class="strategy-lock">🔒 Discover <b>Systems Science</b> to choose a civilization-wide compute doctrine.</div>';
      const active=this.economy.meta.doctrine,defs=this.economy.doctrineOptions();return `<div class="doctrine-grid">${Object.entries(defs).map(([id,d])=>{const v=this.economy.canChooseDoctrine(id);return `<div class="doctrine-card ${active===id?'active':''}"><span>${d.icon}</span><b>${d.name}</b><p>${d.description}</p><div class="doctrine-effects">💰 ×${d.money.toFixed(2)} · 🔬 ×${d.research.toFixed(2)} · 🛡️ ${Math.round(d.resilience*100)}%</div><button class="btn ${active===id?'good':'primary'}" data-doctrine="${id}" ${!v.ok&&active!==id?'disabled':''}>${active===id?'Active doctrine':v.ok?(v.cost?`Retool · 🔬 ${v.cost}`:'Adopt doctrine'):v.reason}</button></div>`}).join('')}</div>`}
    contractCards(){return this.quests.contracts().map(q=>`<div class="contract-card ${q.claimed?'complete':''}"><div><b>${q.claimed?'✅':'📋'} ${q.title}</b><p>${q.text}</p></div><div class="contract-progress"><span>${q.progress}/${q.target}</span><div class="progress"><i style="width:${Math.min(100,q.progress/q.target*100)}%"></i></div><small>${q.claimed?'Reward claimed':`💰 ${q.rewardMoney} · 🔬 ${q.rewardResearch}`}</small></div></div>`).join('')}
    projectCards(){return this.quests.projects().map(({definition:d,status:s})=>`<div class="project-card ${s.claimed?'claimed':s.ready?'ready':''}"><div class="project-icon">${d.icon}</div><div><b>${d.name}</b><p>${d.description}</p><div class="project-reqs">${s.details.map(x=>`<span>${x}</span>`).join('')}</div><small>${s.claimed?'🏆 Completed — landmark earned':`Landmark: ${this.game.world.buildingDef(d.rewardBuilding)?.name||d.rewardBuilding} · 💰 ${d.rewardMoney} · 🔬 ${d.rewardResearch}`}</small>${!s.claimed?`<button class="btn ${s.ready?'primary':''}" data-project="${d.id}" ${s.ready?'':'disabled'}>${s.ready?'Complete megaproject':'Requirements not met'}</button>`:''}</div></div>`).join('')}
    renderStrategy(){
      const root=document.getElementById('strategyTab');if(!root)return;const mods=this.economy.modifiers();
      root.innerHTML=`<div class="strategy-hero"><div><span class="tag">PHASE 7</span><h3>Mastery Civilization</h3><p>Your economy now scales with retained knowledge. Currency can buy infrastructure, but mastery determines whether your civilization understands how to build it.</p></div><div class="knowledge-index"><b>${this.economy.knowledgeIndex()}</b><span>Knowledge Index</span><small>Production knowledge multiplier ×${mods.knowledge.toFixed(2)}</small></div></div><h3>🧠 Durable knowledge</h3><div class="knowledge-grid">${this.districtCards()}</div><h3>✨ Discovery Atlas</h3><p class="muted">Most of the technology tree starts hidden. New fields appear when multiple learned ideas become strong enough to combine.</p><div class="discovery-grid">${this.discoveryCards()}</div><h3>⚖️ Compute Doctrine</h3>${this.doctrineCards()}<h3>📋 Civic Contracts</h3><div class="contracts">${this.contractCards()}</div><h3>🏛️ Megaprojects</h3><p class="muted">These are long-horizon accomplishments. They cannot be purchased outright: the requirements represent actual knowledge, city development, and discoveries.</p><div class="project-grid">${this.projectCards()}</div>`;
      root.querySelectorAll('[data-doctrine]').forEach(b=>b.onclick=()=>{const r=this.economy.chooseDoctrine(b.dataset.doctrine);if(!r.ok)this.game.ui?.toast(r.reason);else{persist(false);render();this.refresh()}});
      root.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>{const r=this.quests.claimProject(b.dataset.project);if(!r.ok)this.game.ui?.toast(r.reason);else{persist(false);render();this.refresh();if(typeof switchTab==='function')switchTab('city')}});
    }
    decorateBuildTab(){
      const root=document.getElementById('buildTab');if(!root)return;let banner=root.querySelector('.mastery-economy-note');if(!banner){banner=document.createElement('div');banner.className='mastery-economy-note';root.insertAdjacentElement('afterbegin',banner)}banner.innerHTML=`🧠 <b>Mastery Economy:</b> advanced infrastructure now requires maintained algorithm knowledge as well as credits and research. Current Knowledge Index: <b>${this.economy.knowledgeIndex()}</b>.`;
      const items=[...root.querySelectorAll('.shop-item')];items.forEach((item,i)=>{const b=BUILDINGS[i];if(!b)return;let gate=item.querySelector('.knowledge-gate');if(!gate){gate=document.createElement('div');gate.className='knowledge-gate';item.appendChild(gate)}const s=this.economy.gateStatus(b.id);gate.innerHTML=s.ok?'<span class="gate-ready">🧠 Knowledge gate satisfied</span>':`<span>🔒 ${s.reasons.join(' · ')}</span>`});
    }
    enqueueDiscovery(e){this.discoveryQueue.push(e);if(this.discoveryQueue.length===1)this.showNextDiscovery()}
    showNextDiscovery(){const e=this.discoveryQueue[0];if(!e)return;const o=document.getElementById('discoveryOverlay'),card=document.getElementById('discoveryCard'),d=e.definition;if(!o||!card)return;card.innerHTML=`<button class="reward-close" data-close-discovery>×</button><div class="discovery-kicker">NEW FIELD DISCOVERED</div><div class="discovery-big-icon">${d.icon}</div><h2>${d.name}</h2><p>${d.description}</p><div class="discovery-reward">🔬 +${e.researchBonus} research</div><button class="btn primary" data-close-discovery>Study discovery</button>`;o.classList.add('show');this.discoveries.markSeen(d.id);this.game.audio?.discovery?.()}
    closeDiscovery(){document.getElementById('discoveryOverlay')?.classList.remove('show');this.discoveryQueue.shift();if(this.discoveryQueue.length)setTimeout(()=>this.showNextDiscovery(),180)}
  }
  C.register('Phase7UI',Phase7UI);
})(window.Codeopolis);
