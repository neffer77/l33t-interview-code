(function(C){
  'use strict';
  class AudioSystem{
    constructor(world){this.world=world;this.ctx=null;this.master=null;this.unlocked=false;this.bindUnlock()}
    get muted(){return !!this.world.world.audioMuted}
    set muted(v){this.world.world.audioMuted=!!v;if(this.master)this.master.gain.value=v?0:.16;C.events.emit('audio:muted',!!v)}
    toggle(){this.muted=!this.muted;return this.muted}
    bindUnlock(){const unlock=()=>{this.unlock();window.removeEventListener('pointerdown',unlock,true);window.removeEventListener('keydown',unlock,true)};window.addEventListener('pointerdown',unlock,true);window.addEventListener('keydown',unlock,true)}
    unlock(){if(this.unlocked)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;try{this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.16;this.master.connect(this.ctx.destination);this.unlocked=true}catch(err){console.warn('Audio unavailable',err)}}
    tone(freq,{start=0,duration=.12,type='sine',gain=.22,slide=0}={}){if(this.muted)return;this.unlock();if(!this.ctx||!this.master)return;const now=this.ctx.currentTime+start,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(gain,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.03)}
    click(){this.tone(520,{duration:.05,gain:.08,type:'triangle'})}
    build(){this.tone(180,{duration:.08,gain:.13,type:'square',slide:80});this.tone(310,{start:.07,duration:.11,gain:.12,type:'triangle',slide:90})}
    success(intensity=1){const notes=intensity>=3?[523,659,784,1047]:intensity>=2?[440,554,659,880]:[392,494,587];notes.forEach((f,i)=>this.tone(f,{start:i*.075,duration:.2,gain:.16+intensity*.02,type:'triangle',slide:12}));if(intensity>=3)this.tone(131,{start:.02,duration:.35,gain:.13,type:'sine',slide:30});this.haptic(intensity>=3?[20,40,25]:[18])}
    discovery(){[392,523,659,784,1047].forEach((f,i)=>this.tone(f,{start:i*.09,duration:.32,gain:.12,type:'sine',slide:20}));this.haptic([20,35,20,35,35])}
    haptic(pattern){try{navigator.vibrate?.(pattern)}catch{}}
  }
  C.register('AudioSystem',AudioSystem);
})(window.Codeopolis);
