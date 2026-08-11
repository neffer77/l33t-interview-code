// Phase 5 finishing layer: career progression and mock UI polish.
const CAREER_RANKS=[
{name:'Candidate',solved:0,mock:0,rewardMoney:0,rewardResearch:0},
{name:'Software Engineer',solved:12,mock:55,rewardMoney:600,rewardResearch:100},
{name:'Senior Engineer',solved:24,mock:68,rewardMoney:1200,rewardResearch:220},
{name:'Staff Engineer',solved:38,mock:78,rewardMoney:2200,rewardResearch:400},
{name:'Principal Engineer',solved:50,mock:88,rewardMoney:4000,rewardResearch:750}
];
state.career=Object.assign({rank:0,promotions:[]},state.career||{});

function careerBestMock(){return Math.max(0,...(state.mock?.history||[]).map(x=>x.score||0))}
function nextCareerRank(){return CAREER_RANKS[state.career.rank+1]||null}
function careerEligible(){const next=nextCareerRank();return !!next&&state.solved.length>=next.solved&&careerBestMock()>=next.mock}
function promoteCareer(){const next=nextCareerRank();if(!next||!careerEligible())return;state.career.rank++;state.money+=next.rewardMoney;state.research+=next.rewardResearch;state.happiness=Math.min(100,(state.happiness||75)+5);state.career.promotions.unshift({rank:next.name,at:new Date().toISOString()});persist()}

renderMock=function(){
  const root=$('#mockTab');if(!root)return;
  const m=currentMock();
  if(m){
    const done=m.problemIds.filter(id=>m.passed[id]).length;
    root.innerHTML=`<div class="mock-header"><div><h3>🎙️ Live Mock Interview</h3><div class="muted">${done}/${m.problemIds.length} solved · ${m.minutes} minute block</div></div><div class="mock-clock" id="mockClock">${formatClock(mockRemaining())}</div></div><div class="mock-problems">${m.problemIds.map((id,i)=>{const c=CHALLENGES.find(x=>x.id===id),pass=m.passed[id];return `<button class="btn mock-problem ${pass?'mock-pass':''}" onclick="openMockProblem('${id}')">${pass?'✅':(i+1)+'.'} ${esc(c.title)} <span>${esc(c.pattern)}</span></button>`}).join('')}</div><div class="actions"><button class="btn primary" onclick="finishMockInterview('ended')">End & score interview</button></div>`;
    return;
  }
  const history=state.mock.history||[],currentRank=CAREER_RANKS[state.career.rank],next=nextCareerRank(),eligible=careerEligible();
  root.innerHTML=`<div class="career-card"><div><span class="tag">Career Rank</span><h3>${currentRank.name}</h3><div class="muted">Best mock ${careerBestMock()}/100 · ${state.solved.length}/${CHALLENGES.length} problems solved</div></div>${next?`<div class="career-next"><b>Next: ${next.name}</b><div class="muted">Requires ${next.solved} solved + ${next.mock} mock score</div><button class="btn ${eligible?'primary':''}" ${eligible?'':'disabled'} onclick="promoteCareer()">${eligible?'Accept promotion':'Requirements not met'}</button></div>`:'<div class="career-next"><b>🏆 Principal track complete</b></div>'}</div><h3>🎙️ Mock Interview Center</h3><p class="muted">Mocks select multiple adaptive problems across different patterns. Only real hidden-test passes count toward the scorecard.</p><div class="mock-launch"><button class="btn primary" onclick="startMockInterview(2,30)">30 min · 2 problems</button><button class="btn primary" onclick="startMockInterview(3,45)">45 min · 3 problems</button><button class="btn primary" onclick="startMockInterview(4,60)">60 min · 4 problems</button></div><h3>Interview history</h3><div class="history">${history.slice(0,10).map(x=>`<div class="history-item"><b>${x.score}/100</b> · ${x.solved}/${x.total} solved · ${x.accuracy}% accuracy · ${x.hints} hints <span class="muted">${new Date(x.at).toLocaleDateString()}</span></div>`).join('')||'<div class="muted">Complete a mock interview to create your first scorecard.</div>'}</div>`;
};

const careerRenderStats=renderStats;
renderStats=function(){careerRenderStats();const root=$('#statsTab');if(!root)return;const rank=CAREER_RANKS[state.career.rank],next=nextCareerRank();root.insertAdjacentHTML('afterbegin',`<div class="career-summary"><b>💼 ${rank.name}</b><span class="muted">${next?`Next promotion: ${next.solved} solved + ${next.mock} mock score`:'Principal career milestone achieved'}</span></div>`)};

const careerRender=render;
render=function(){careerRender();renderMock();const phase=$('#phaseLabel');if(phase)phase.textContent='Phase 5 · Interview Realism'};
render();
