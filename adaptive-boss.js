// Phase 4: boss interviews are assembled from current mastery weaknesses.
function adaptiveBossQuestions(){
  const weakPatterns=adaptiveQueue(12).map(c=>c.pattern);
  const ranked=[];
  for(const pattern of weakPatterns){
    const q=RECALL_QUESTIONS.find(item=>pattern.includes(item.pattern)||item.pattern.includes(pattern));
    if(q&&!ranked.some(x=>x.q===q.q))ranked.push(q);
  }
  for(const q of RECALL_QUESTIONS)if(!ranked.some(x=>x.q===q.q))ranked.push(q);
  return ranked.slice(0,3).map(q=>({q:q.q,options:[...q.options],answer:q.answer,pattern:q.pattern}));
}

renderBoss=function(){
  const b=currentBoss();
  if(!b){
    const weak=adaptiveQueue(3);
    bossCard.innerHTML=`<b>🏆 Era interviews complete</b><div class="muted">Adaptive readiness now drives your continuing practice.</div>${weak.length?`<p class="muted">Current weak areas: ${weak.map(c=>esc(c.pattern)).join(', ')}</p>`:''}`;
    return;
  }
  const eligible=bossEligible(b);
  if(state.bossRun?.id===b.id){
    const questions=state.bossRun.questions||adaptiveBossQuestions();
    const q=questions[state.bossRun.index];
    bossCard.innerHTML=`<b>👔 ${esc(b.title)}</b><div class="tag">Adaptive weakness: ${esc(q.pattern||'mixed')}</div><p>${esc(q.q)}</p><div class="boss-options">${q.options.map((o,i)=>`<button class="btn" onclick="answerBoss(${i})">${esc(o)}</button>`).join('')}</div><small>Question ${state.bossRun.index+1}/${questions.length} · score ${state.bossRun.score}</small>`;
    return;
  }
  const weak=adaptiveQueue(3);
  bossCard.innerHTML=`<b>👔 Era Boss: ${esc(b.title)}</b><div class="muted">Requires ${b.requiresSolved} solved missions across multiple districts. Questions will target your weakest current patterns.</div><p>${state.solved.length}/${b.requiresSolved} solved</p>${weak.length?`<p class="muted">Likely focus: ${weak.map(c=>esc(c.pattern)).join(', ')}</p>`:''}<button class="btn primary" ${eligible?'':'disabled'} onclick="startBoss()">${eligible?'Start adaptive boss':'Not ready yet'}</button>`;
};

startBoss=function(){
  const b=currentBoss();
  if(!bossEligible(b))return;
  state.bossRun={id:b.id,index:0,score:0,questions:adaptiveBossQuestions()};
  persist();
};

answerBoss=function(choice){
  const b=currentBoss();
  if(!b||!state.bossRun)return;
  const questions=state.bossRun.questions||adaptiveBossQuestions();
  const q=questions[state.bossRun.index];
  const correct=choice===q.answer;
  if(correct){state.bossRun.score++;state.research+=3}else state.happiness=Math.max(25,state.happiness-1);
  state.bossRun.index++;
  if(state.bossRun.index>=questions.length){
    const passed=state.bossRun.score>=Math.ceil(questions.length*.67);
    if(passed){
      state.bossesPassed.push(b.id);
      state.eraLevel=b.nextEra;
      state.money+=b.rewardMoney;
      state.research+=b.rewardResearch;
      state.happiness=Math.min(100,state.happiness+5);
      state.eventLog.unshift({title:`Boss passed: ${b.title}`,result:`Advanced to ${eraName()} using adaptive weakness questions`,at:new Date().toISOString()});
    }else{
      state.eventLog.unshift({title:`Boss attempt: ${b.title}`,result:'Adaptive interview not passed. Weak patterns were added back to the practice priority.',at:new Date().toISOString()});
      for(const c of adaptiveQueue(3)){const m=masteryFor(c.id);m.nextReviewAt=new Date().toISOString();state.mastery[c.id]=m}
    }
    state.bossRun=null;
  }
  persist();
};

renderBoss();
