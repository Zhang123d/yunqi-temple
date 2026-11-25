// CC0 field recordings used in sanctuary.mp3:
// zheng142326, Shanghai Jinshan temple: https://freesound.org/s/350491/
// the_very_Real_Horst, Chinese Dragon Tempel Bell II: https://freesound.org/s/241064/
const music=document.getElementById('music'),soundBtn=document.getElementById('sound');
let sounds=false,soundChosen=false,audioCtx,loads;
const buffers=new Map(),voices=new Map();
music.volume=.78;
function silenceVoice(id){
  const voice=voices.get(id);if(!voice)return;
  voice.source.stop();voice.source.disconnect();voice.gain.disconnect();voices.delete(id);
}
let fishBuffer=null,fishSource=null,lastFishBeat=-1,rattleSource=null;
function quietActions(){
  for(const id of [...voices.keys()])silenceVoice(id);
  if(fishSource){fishSource.stop();fishSource=null;}
  if(rattleSource){rattleSource.stop();rattleSource=null;}
}
function bambooRattle(){
  if(!sounds||!audioCtx||audioCtx.state!=='running'||document.hidden)return;
  const rate=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,Math.ceil(rate*1.45),rate);
  const out=buf.getChannelData(0);
  for(const [i,at] of [.04,.11,.28,.33,.54,.62,.78,.88,1.08,1.20,1.31].entries()){
    const start=Math.floor(at*rate),freq=840+190*Math.sin(i*1.7);
    for(let j=0;j<rate*.10&&start+j<out.length;j++){
      const t=j/rate;out[start+j]+=.17*Math.min(1,t/.0015)*Math.exp(-t*64)*(Math.sin(t*freq*2*Math.PI)+.34*Math.sin(t*freq*3.6*Math.PI));
    }
  }
  const src=audioCtx.createBufferSource();src.buffer=buf;src.connect(audioCtx.destination);
  src.onended=()=>{src.disconnect();if(rattleSource===src)rattleSource=null;};
  src.start();rattleSource=src;
}
function woodfishSound(me,now){
  const beat=Math.ceil((now-25)/fishBeatMs),wait=beat*fishBeatMs-now;
  if(beat===lastFishBeat||wait>180)return;
  if(!fishBuffer){
    const rate=audioCtx.sampleRate;fishBuffer=audioCtx.createBuffer(1,Math.ceil(rate*.48),rate);
    const wave=fishBuffer.getChannelData(0);
    for(let i=0;i<wave.length;i++){
      const t=i/rate,w=2*Math.PI*t;
      wave[i]=Math.min(1,t/.0015)*(.70*Math.exp(-t*18)*Math.sin(w*438)+.34*Math.exp(-t*32)*Math.sin(w*912)+.18*Math.exp(-t*47)*Math.sin(w*1470)+.15*Math.exp(-t*185)*Math.sin(w*2430));
    }
  }
  const pos=atPosition(me,now),dx=fishMonk.x-pos.x,dy=(pos.y-fishMonk.y)*depthUnit;
  const dist=Math.hypot(dx,dy),pan=audioCtx.createStereoPanner(),gain=audioCtx.createGain();
  const yaw=eyeView.active?eyeView.yaw:0;
  pan.pan.value=Math.max(-.8,Math.min(.8,(dx*Math.cos(yaw)-dy*Math.sin(yaw))/190));
  gain.gain.value=(currentReward?.12:.29)/(1+dist/130);
  const src=audioCtx.createBufferSource();src.buffer=fishBuffer;src.playbackRate.value=1+.013*Math.sin(beat);
  src.connect(gain);gain.connect(pan);pan.connect(audioCtx.destination);
  src.onended=()=>{src.disconnect();gain.disconnect();pan.disconnect();if(fishSource===src)fishSource=null;};
  src.start(audioCtx.currentTime+Math.max(0,wait)/1000);lastFishBeat=beat;fishSource=src;
}
async function setSound(on){
  soundChosen=true;sounds=on;
  soundBtn.setAttribute('aria-pressed',String(on));
  document.getElementById('soundLabel').textContent=on?'关闭声音':'开启声音';
  if(!on){music.pause();quietActions();stopNarration();return;}
  try{
    audioCtx??=new AudioContext();
    const playback=Promise.all([audioCtx.resume(),music.play()]);
    loads??=Promise.all(['incense','bow'].map(async kind=>{
      const r=await fetch('/media/'+kind+'-fx.mp3');
      if(!r.ok)throw Error('音效载入失败');
      buffers.set(kind,await audioCtx.decodeAudioData(await r.arrayBuffer()));
    })).catch(e=>{loads=null;throw e;});
    await Promise.all([playback,loads]);if(sounds)narrate();
  }catch{if(sounds){setSound(false);document.getElementById('hint').textContent='声音未能播放，可再次点「开启声音」。';}}
}
soundBtn.onclick=()=>setSound(!sounds);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){music.pause();quietActions();}
  else if(sounds)music.play().catch(()=>setSound(false));
});
function soundRoom(snapshot,me,now){
  if(!sounds||!me||document.hidden||!audioCtx||audioCtx.state!=='running'){quietActions();return;}
  woodfishSound(me,now);
  const active=new Set();
  for(const p of snapshot.players){
    const buf=buffers.get(p.action);if(!p.action||!buf||p.arrive>now)continue;
    const self=p.id===me.id;
    const dist=Math.hypot(me.tx-p.tx,me.ty-p.ty);
    const level=(self?.69:.16/(1+dist/65)/Math.sqrt(Math.max(1,snapshot.players.length-1)))*(currentReward?.32:1);
    const key=p.arrive+'-'+p.action;active.add(p.id);
    let v=voices.get(p.id);
    if(v?.key!==key){
      silenceVoice(p.id);const source=audioCtx.createBufferSource(),gain=audioCtx.createGain();
      source.buffer=buf;source.loop=true;source.loopEnd=Math.min(buf.duration,7.4);
      gain.gain.value=level;source.connect(gain);gain.connect(audioCtx.destination);
      source.start(0,ritualTime(p,now)%source.loopEnd);
      v={key,source,gain};voices.set(p.id,v);
    }else v.gain.gain.setTargetAtTime(level,audioCtx.currentTime,.1);
  }
  for(const id of [...voices.keys()])if(!active.has(id))silenceVoice(id);
}

