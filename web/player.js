const theater=document.getElementById('theater'),anim=document.getElementById('animation').getContext('2d');
const films={incense:document.getElementById('incenseFilm'),bow:document.getElementById('bowFilm')};
let film=null,lastRitual='',fallback=true,activeKind='',lastTitle='';
function stopFilm(){
  if(film){film.pause();film.classList.remove('show');film=null;}
  theater.hidden=true;theater.classList.remove('expanded');
  document.getElementById('expand').textContent='放大';
  activeKind='';lastTitle='';mixLevels();
}
document.getElementById('skip').onclick=stopFilm;
document.getElementById('expand').onclick=()=>{
  const expanded=theater.classList.toggle('expanded');
  document.getElementById('expand').textContent=expanded?'还原':'放大';
};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!theater.hidden)stopFilm();});
for(const v of Object.values(films)){
  v.addEventListener('playing',()=>{if(v===film){fallback=false;v.classList.add('show');}});
  for(const ev of ['waiting','error','stalled'])v.addEventListener(ev,()=>{
    if(v===film){fallback=true;v.classList.remove('show');}
  });
}
let requestedFilm=false,filmCycle=-1;
function showRitual(me,now){
  if(!me?.action||now<me.arrive){if(film)stopFilm();return;}
  const key=me.id+'-'+me.arrive+'-'+me.action,t=(now-me.arrive)/1000;
  const cycle=Math.floor(t/7.4),phaseTime=t%7.4;
  if(film && cycle!==filmCycle)stopFilm();
  if(requestedFilm || (key!==lastRitual && !eyeView.active && cycle===0)){
    requestedFilm=false;filmCycle=cycle;
    stopFilm();lastRitual=key;activeKind=me.action;film=films[activeKind];fallback=true;
    const v=film;v.muted=true;v.volume=.68;mixLevels();
    theater.hidden=false;
    document.getElementById('filmName').textContent=activeKind==='bow'?'合十跪拜':'敬香';
    const start=()=>{if(film!==v||lastRitual!==key)return;
      v.currentTime=Math.min(7.35,Math.max(0,((Date.now()+clockDelta-me.arrive)/1000)%7.4));
      v.play().catch(()=>{if(v===film){v.muted=true;v.play().catch(()=>{});}});
    };
    if(v.readyState>=1)start();else v.addEventListener('loadedmetadata',start,{once:true});
  }
  lastRitual=key;if(!film)return;
  if(fallback)closeup(anim,hall,activeKind,phaseTime);
  const title=ritualTitle(activeKind,phaseTime);
  if(title!==lastTitle){document.getElementById('phase').textContent=title;lastTitle=title;}
  document.getElementById('progress').style.transform='scaleX('+phaseTime/7.4+')';
}


