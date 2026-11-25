const byId=id=>document.getElementById(id);
let token='',myId='',seq=0,clockDelta=0,pending=false,joining=false,latest=0;
let snapshot={players:[],offerings:[],visits:[]};
const hint=byId('hint'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function enabled(on){for(const id of ['incense','bow','openRank','openLot'])byId(id).disabled=!on;}
function notice(message,button){
  byId('overlay').hidden=false;byId('message').textContent=message;byId('retry').hidden=!button;
}
async function request(route,data){
  const res=await fetch('/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(6000)});
  if(!res.ok)throw Object.assign(new Error(),{code:res.status});
  return res.json();
}
function update(data){
  if(data.now<latest)return;
  latest=data.now;clockDelta=data.now-Date.now();snapshot=data;
  const me=data.players.find(p=>p.id===myId);
  byId('count').textContent='在线 '+data.players.length+' / 10';
  byId('activity').textContent=data.visits[0]||'';
  receiveScore(data);refreshRank();refreshActions(me);if(me){byId('name').textContent=me.name;byId('color').style.background=robes[me.slot];}
}
function failed(e){
  if(e.code===401){
    stopFilm();token='';myId='';snapshot={players:[],offerings:[],visits:[]};enabled(false);
    byId('count').textContent='已离开';notice('已暂离佛殿，重新入殿即可继续。',true);
  }else{byId('count').textContent='正在重连';hint.textContent='连接暂时中断，正在重新连接…';enabled(false);}
}
async function join(){
  if(joining||token)return;joining=true;notice('正在进入佛殿…',false);
  try{
    const data=await request('join',{browserKey:pilgrimKey});token=data.token;myId=data.id;seq=0;latest=0;
    update(data);enabled(true);byId('overlay').hidden=true;
    hint.textContent='点殿内地面行走，选一个动作祈福。';
  }catch(e){
    byId('count').textContent=e.code===409?'在线 10 / 10':'未连接';
    notice(e.code===409?'佛殿已有十位香客，请稍后再来。':'暂时连不上佛殿，请稍后重试。',true);
  }finally{joining=false;}
}
async function sync(){
  if(!token||pending)return;pending=true;const current=token;
  try{
    const data=await request('state',{token:current});
    if(current===token){update(data);enabled(true);if(hint.textContent.includes('重新连接'))hint.textContent='已回到佛殿。';}
  }catch(e){if(current===token)failed(e);}finally{pending=false;}
}
async function act(action,pos={}){
  if(!token)return;const current=token;
  try{
    const data=await request('act',{token,seq:++seq,action,...pos});
    if(current===token){update(data);const me=localPlayer();hint.textContent=me?.action?'已选最近的空拜垫，完整祈福一轮计一次。':'点殿内地面行走，选一个动作祈福。';return data;}
  }catch(e){if(current===token)failed(e);}
}
byId('retry').onclick=join;
function localPlayer(){return snapshot.players.find(p=>p.id===myId);}
function refreshActions(me){
  for(const kind of ['incense','bow']){
    const button=byId(kind),active=me?.action===kind;
    button.setAttribute('aria-pressed',String(active));
    button.querySelector('b').textContent=kind==='incense'?(active?'停止烧香':'烧香'):(active?'停止跪拜':'合十跪拜');
  }
  byId('watch').hidden=!me?.action;
}
for(const id of ['incense','bow'])byId(id).onclick=()=>{
  if(!soundChosen)setSound(true);
  const p=localPlayer();requestedFilm=false;
  const stopping=p?.action===id;
  if(stopping)stopFilm();else if(eyeView.active)faceAltar(p,Date.now()+clockDelta);
  act(stopping?'stop':id);
};
byId('filmStop').onclick=()=>{requestedFilm=false;stopFilm();act('stop');};
byId('watch').onclick=()=>{if(localPlayer()?.action)requestedFilm=true;};
byId('camera').onclick=()=>{
  stopFilm();requestedFilm=false;eyeView.active=!eyeView.active;
  if(eyeView.active)faceAltar(localPlayer(),Date.now()+clockDelta);
  byId('camera').setAttribute('aria-pressed',String(eyeView.active));
  byId('camera').textContent=eyeView.active?'切换第三人称':'切换第一人称';
  canvas.classList.toggle('eye',eyeView.active);
  hint.textContent=eyeView.active?'第一人称：拖动画面环顾，点地面行走。':'第三人称：点地面行走。';
  canvas.focus({preventScroll:true});
};
let drag=null;
canvas.addEventListener('pointerdown',e=>{
  if(!token||!e.isPrimary)return;canvas.focus({preventScroll:true});
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:eyeView.yaw,pitch:eyeView.pitch,moved:false};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId||!eyeView.active)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.hypot(dx,dy)>4)drag.moved=true;
  if(drag.moved){eyeView.yaw=drag.yaw-dx*3.3/canvas.clientWidth;eyeView.pitch=Math.max(-95,Math.min(110,drag.pitch+dy*210/canvas.clientHeight));}
});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const moved=drag.moved;drag=null;if(moved)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*480/r.width,y=(e.clientY-r.top)*300/r.height;
  const target=eyeView.active?floorTarget(x,y):{x,y};
  if(!target||target.y<207||target.y>310||target.x<0||target.x>480){hint.textContent='点殿内地面行走，或选一个动作祈福。';return;}
  act('move',target);
});
let lastKey=0;
canvas.addEventListener('keydown',e=>{
  const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
  const dir=dirs[e.key];if(!dir||!token)return;e.preventDefault();
  if(Date.now()-lastKey<85)return;lastKey=Date.now();
  if(eyeView.active&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){eyeView.yaw+=dir[0]*.14;return;}
  let [dx,dy]=dir;const p=localPlayer();if(!p)return;
  if(eyeView.active){const a=eyeView.yaw;[dx,dy]=[dx*Math.cos(a)-dy*Math.sin(a),(dx*Math.sin(a)+dy*Math.cos(a))/depthUnit];}
  act('move',{x:p.tx+dx*16,y:p.ty+dy*16});
});
window.addEventListener('pagehide',()=>{
  quietActions();closeVerse();stopFilm();music.pause();if(token)navigator.sendBeacon('/leave',JSON.stringify({token}));
  token='';myId='';
});
window.addEventListener('pageshow',e=>{if(e.persisted)join();});
let lastFrame=-100;
function frame(ts){
  if(ts-lastFrame>(reduced?120:32)){const now=Date.now()+clockDelta;const me=snapshot.players.find(p=>p.id===myId);showRitual(me,now);soundRoom(snapshot,me,now);updateVerse();if(theater.hidden)paint(snapshot,myId,now);lastFrame=ts;}
  requestAnimationFrame(frame);
}
frame(0);join();setInterval(sync,600);




