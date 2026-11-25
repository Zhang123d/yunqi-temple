function browserIdentity(){
  function create(){
    const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
    const s=Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');
    return [s.slice(0,8),s.slice(8,12),s.slice(12,16),s.slice(16,20),s.slice(20)].join('-');
  }
  try{
    const key=localStorage.getItem('yunqi-pilgrim');
    if(key&&/^[a-f0-9-]{36}$/i.test(key))return key;
    const next=create();localStorage.setItem('yunqi-pilgrim',next);return next;
  }catch{return create();}
}
const pilgrimKey=browserIdentity();
const ranking=document.getElementById('rankDialog'),verseCard=document.getElementById('verseReveal');
let rulebook=null,ruleRequest=null;
function loadRules(){
  ruleRequest??=fetch('/verses.json').then(async r=>{
    if(!r.ok)throw Error();rulebook=await r.json();
  }).catch(()=>{ruleRequest=null;});
  return ruleRequest;
}
loadRules();
let latestReward=0,pendingRewards=[],currentReward=null,voiceNode=null,revealAt=0,revealEnd=0;
const spokenClips=new Map();
function stopNarration(){if(voiceNode){voiceNode.stop();voiceNode.disconnect();voiceNode=null;}}
function mixLevels(){music.volume=currentReward ? .28 : (film ? .58 : .78);}
async function narrate(){
  const reward=currentReward;if(!sounds||!reward||!audioCtx||document.hidden)return;
  try{
    let buffer=spokenClips.get(reward.verse);
    if(!buffer){
      const r=await fetch('/media/verse-'+reward.verse+'.mp3');if(!r.ok)return;
      buffer=await audioCtx.decodeAudioData(await r.arrayBuffer());spokenClips.set(reward.verse,buffer);
    }
    if(currentReward!==reward||!sounds||document.hidden)return;
    const offset=(performance.now()-revealAt)/1000;
    if(offset>=buffer.duration)return;
    stopNarration();voiceNode=audioCtx.createBufferSource();voiceNode.buffer=buffer;
    voiceNode.connect(audioCtx.destination);voiceNode.start(0,Math.max(0,offset));
    revealEnd=Math.max(revealEnd,revealAt+buffer.duration*1000+1300);
  }catch{/* The full verse remains readable if the voice asset is unavailable. */}
}
function closeVerse(){
  stopNarration();currentReward=null;verseCard.hidden=true;verseCard.classList.remove('receding');mixLevels();
}
function receiveScore(data){
  if(data.score)document.getElementById('roundCount').textContent=data.score.rounds;
  if(data.reward&&data.reward.count>latestReward){
    latestReward=data.reward.count;pendingRewards.push(data.reward);loadRules();
  }
}
function updateVerse(){
  if(currentReward){
    const left=revealEnd-performance.now();
    if(left<=0)closeVerse();else if(left<1100)verseCard.classList.add('receding');
    return;
  }
  if(!pendingRewards.length||!rulebook||document.hidden||ranking.open||lotDialog.open||theater.classList.contains('expanded'))return;
  const reward=pendingRewards.shift(),v=rulebook.verses.find(v=>v.at===reward.verse);if(!v)return;
  const lines=document.getElementById('inkLines');lines.replaceChildren();
  let n=0;const rows=Math.ceil(rulebook.glyphs.length/rulebook.columns);
  for(const line of v.lines){
    const col=document.createElement('div');col.className='verseColumn';
    for(const char of line.replace(/[，。]/g,'')){
      const span=document.createElement('span'),index=rulebook.glyphs.indexOf(char);
      span.className='inkGlyph';span.textContent=char;
      span.style.setProperty('--wait',(n++*.085)+'s');
      span.style.backgroundSize=rulebook.columns+'em '+rows+'em';
      span.style.backgroundPosition=-(index%rulebook.columns)+'em '+(-Math.floor(index/rulebook.columns))+'em';
      col.append(span);
    }
    lines.append(col);
  }
  document.getElementById('verseSeal').textContent='第'+reward.count+'次祈福';
  document.getElementById('verseReader').textContent=v.lines.join('');
  currentReward=reward;revealAt=performance.now();revealEnd=revealAt+10100;
  verseCard.hidden=false;mixLevels();narrate();
}
document.getElementById('dismissVerse').onclick=closeVerse;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopNarration();else if(currentReward)narrate();});
let rankLoading=false,rankStamp=0;
async function refreshRank(force=false){
  if(!ranking.open||!token||rankLoading||(!force&&Date.now()-rankStamp<1500))return;
  rankLoading=true;rankStamp=Date.now();
  try{
    const res=await request('ranking',{token});
    const list=document.getElementById('rankRows');list.replaceChildren();
    if(!res.top.length)list.textContent='完成第一轮祈福，即可上榜。';
    for(const row of res.top){
      const li=document.createElement('li');if(row.me)li.className='myRow';
      for(const value of [row.rank,row.name+(row.me?'（我）':''),row.rounds+' 次']){
        const span=document.createElement('span');span.textContent=value;li.append(span);
      }list.append(li);
    }
    document.getElementById('myRank').textContent='我的累计 '+res.mine.rounds+' 次 · '+(res.mine.rank?'第 '+res.mine.rank+' 名':'尚未上榜');
  }catch{document.getElementById('myRank').textContent='暂时无法更新排名，正在重试。';}
  finally{rankLoading=false;}
}
document.getElementById('openRank').onclick=()=>{ranking.showModal();refreshRank(true);};
document.getElementById('closeRank').onclick=()=>ranking.close();
ranking.addEventListener('click',e=>{if(e.target===ranking){const box=ranking.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)ranking.close();}});


