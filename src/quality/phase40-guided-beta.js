(function(C){'use strict';
const STEPS=[
{id:'orient',title:'Meet Codeopolis',why:'Your city is a visual record of engineering skill, not idle-game progress.',event:'tab:challenge',action:'challenge',hint:'Open Challenge and look at the problem, tests, and city.'},
{id:'solve',title:'Prove one skill',why:'Real judged Python is the source of truth for mastery and rewards.',event:'learning:mastered',action:'challenge',hint:'Solve any judged challenge and pass its hidden tests.'},
{id:'inspect',title:'See what changed',why:'Learning evidence should visibly change the civilization.',event:'tab:city',action:'city',hint:'Open City after your first mastery and inspect the new state.'},
{id:'learn',title:'Open the learning layer',why:'Skill graphs and retention turn a correct answer into durable interview ability.',event:'tab:learning',action:'learning',hint:'Open Learn and inspect your skill/retention state.'},
{id:'engineer',title:'Practice engineering judgment',why:'Strong interviews require reasoning, debugging, design, and communication—not only code.',event:'engineering:evidence',action:'mock',hint:'Complete any reasoning, incident, design, debugging, behavioral, or Interview Day activity.'},
{id:'return',title:'Verify persistence',why:'A beta is only useful if progress survives reloads and WebView restarts.',event:'session:return',action:null,hint:'Reload or close/reopen the app once. This step clears automatically on the next session.'}
];
class GuidedBeta{
 constructor(game){this.game=game;this.key='codeopolis-phase40-beta-v1';this.data=this.load();this.startSession()}
 load(){try{return Object.assign({steps:{},sessions:[],events:[],feedback:[],startedAt:Date.now()},JSON.parse(localStorage.getItem(this.key)||'{}'))}catch{return{steps:{},sessions:[],events:[],feedback:[],startedAt:Date.now()}}}
 save(){localStorage.setItem(this.key,JSON.stringify(this.data))}
 startSession(){const now=Date.now(),previous=this.data.sessions[0];this.data.sessions.unshift({at:now});this.data.sessions=this.data.sessions.slice(0,30);if(previous&&now-previous.at>1500)this.hit('session:return');this.record('session:start',{number:this.data.sessions.length});this.save()}
 record(type,detail={}){this.data.events.unshift({at:Date.now(),type,detail});this.data.events=this.data.events.slice(0,150);this.save();this.game.phase11?.telemetry?.track?.('beta:'+type,detail)}
 hit(event){const step=STEPS.find(s=>s.event===event&&!this.data.steps[s.id]);if(!step)return false;this.data.steps[step.id]={at:Date.now()};this.record('guide:step',{id:step.id,event});C.events.emit('phase40:step',{step});this.save();return true}
 visit(tab){this.record('tab:visit',{tab});this.hit('tab:'+tab)}
 feedback(kind,value,note=''){this.data.feedback.unshift({at:Date.now(),kind,value,note:String(note||'').slice(0,500)});this.data.feedback=this.data.feedback.slice(0,50);this.record('feedback',{kind,value});this.save()}
 resetGuide(){this.data.steps={};this.data.startedAt=Date.now();this.record('guide:reset');this.save()}
 snapshot(){const done=STEPS.filter(s=>this.data.steps[s.id]).length;return{steps:STEPS.map(s=>({...s,done:!!this.data.steps[s.id],doneAt:this.data.steps[s.id]?.at||null})),done,total:STEPS.length,complete:done===STEPS.length,sessions:this.data.sessions.length,feedback:this.data.feedback.slice(0,5),events:this.data.events.slice(0,10)}}
}
C.register('GuidedBeta',GuidedBeta);C.storyData=C.storyData||{};C.storyData.phase40Steps=STEPS;})(window.Codeopolis);