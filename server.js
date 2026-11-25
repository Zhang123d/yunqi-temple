const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID,randomInt } = require('node:crypto');
const lots=require('./web/lots.json');
const { spawn } = require('node:child_process');
const ledger=require('./ledger');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8765);
const players = new Map();
const offerings = [];
const visits = [];
const mats = Array.from({length:10},(_,id)=>({
  id,x:166+(id%5)*36+(id>=5?12:0),y:id<5?215:233
}));
const assets = new Map(['index.html','style.css','world.js','figure.js','game.js','ritual.js','player.js','temple.js','perspective.js','audio.js','interior.js',
  'rewards.js','fortune.js','verses.json','media/ink.webp',...require('./web/verses.json').verses.map(v=>'media/verse-'+v.at+'.mp3'),
  'media/hall.webp','media/incense.mp4','media/bow.mp4','media/sanctuary.mp3','media/bow-fx.mp3','media/incense-fx.mp3'].map(file=>[
    file==='index.html'?'/':'/'+file,path.join(__dirname,'web',file)
  ]));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8','.webp':'image/webp','.mp4':'video/mp4','.mp3':'audio/mpeg'};
function serveAsset(req,res,file){
  fs.stat(file,(err,stat)=>{
    if(err)return reply(res,404,{});
    const size=stat.size,range=req.headers.range;
    const headers={'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    let first=0,last=size-1;
    if(range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(match && (match[1]||match[2])){
        first=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
        last=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
      }else first=size;
      if(first>last||first>=size){res.writeHead(416,{'Content-Range':'bytes */'+size});return res.end();}
      headers['Content-Range']='bytes '+first+'-'+last+'/'+size;
    }
    headers['Content-Length']=last-first+1;
    res.writeHead(range?206:200,headers);
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(file,{start:first,end:last});
    res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
  });
}
function position(p, now) {
  const t = Math.max(0, Math.min(1, (now-p.start)/Math.max(1,p.arrive-p.start)));
  return [p.x+(p.tx-p.x)*t,p.y+(p.ty-p.y)*t];
}
function travel(p, x, y, now) {
  [p.x,p.y] = position(p,now);
  Object.assign(p,{tx:x,ty:y,start:now,arrive:now+Math.hypot(x-p.x,y-p.y)/72*1000,action:'',mat:null,lotAt:0});
}
function nearestMat(player,now){
  const [x,y]=position(player,now);
  const reserved=new Set([...players.values()].filter(p=>p!==player&&p.action).map(p=>p.mat));
  let nearest=null,best=Infinity;
  for(const mat of mats){
    const distance=(x-mat.x)**2+(y-mat.y)**2;
    if(!reserved.has(mat.id)&&distance<best){nearest=mat;best=distance;}
  }
  return nearest;
}
function record(message) {
  visits.unshift(message); visits.length = Math.min(visits.length,4);
}
function tick(now) {
  const completed=[];
  for (const [token,p] of players) {
    const until=Math.min(now,p.last+20000);
    if(p.action){
      const round=Math.floor((until-p.arrive)/ledger.cycle);
      while(p.counted<round){
        p.counted++;
        completed.push({p,finished:p.arrive+p.counted*ledger.cycle});
      }
    }
    if(now-p.last>20000) { players.delete(token); continue; }
    if(p.action && !p.logged && now>=p.arrive) {
      p.logged=true;
      record(p.name + (p.action==='bow'?' 虔诚一拜':' 敬上一炷香'));
    }
    if(p.action==='incense' && now>=p.arrive+5630){
      const cycle=Math.floor((now-p.arrive-5630)/7400);
      if(cycle!==p.offered){
        p.offered=cycle;offerings.push({slot:p.slot,at:p.arrive+5630+7400*cycle});
      }
    }
  }
  for(const {p,finished} of completed.sort((a,b)=>a.finished-b.finished)){
    const count=ledger.award(p.profile,finished);
    if(count){
      const verse=ledger.milestone(count);if(verse)p.reward={count,verse};
    }
  }
  while(offerings.length && now-offerings[0].at>45000) offerings.shift();
}
function state(now,me) {
  return {now,mats,players:[...players.values()].map(({last,logged,offered,seq,profile,reward,counted,lastLot,...p})=>p),offerings,visits,score:ledger.summary(me.profile),reward:me.reward};
}
function reply(res,code,data) {
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
const server = http.createServer(async(req,res)=>{
  const route=req.url.split('?')[0];
  if((req.method==='GET'||req.method==='HEAD') && assets.has(route))return serveAsset(req,res,assets.get(route));
  if(req.method!=='POST' || !['/join','/state','/act','/leave','/ranking'].includes(route)) return reply(res,404,{});
  if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host && req.headers.origin!=='https://'+req.headers.host) return reply(res,403,{});
  try {
    let raw='';
    for await(const chunk of req) {
      raw+=chunk;
      if(raw.length>2048) return reply(res,413,{});
    }
    const data=JSON.parse(raw||'{}');
    if(!data || typeof data!=='object') return reply(res,400,{});
    const now=Date.now(); tick(now);
    const p=players.get(data.token);
    if(route==='/join') {
      if(players.size>=10) return reply(res,409,{full:true});
      const used=new Set([...players.values()].map(v=>v.slot));
      const slot=mats.findIndex((_,i)=>!used.has(i));
      const x=200+(slot%5)*18, y=251+Math.floor(slot/5)*21;
      const token=randomUUID(), id=randomUUID();
      const profile=ledger.open(data.browserKey);
      let name=ledger.name(profile);
      if([...players.values()].some(q=>q.profile===profile))name+='·'+(slot+1);
      const guest={id,slot,profile,name,x,y,tx:x,ty:y,start:now,arrive:now,mat:null,action:'',last:now,logged:true,seq:0,counted:0};
      players.set(token,guest);
      return reply(res,200,{token,id,...state(now,guest)});
    }
    if(!p) return reply(res,401,{});
    p.last=now;
    if(route==='/ranking')return reply(res,200,ledger.ranking(p.profile));
    if(route==='/leave') { players.delete(data.token); return reply(res,200,{}); }
    if(route==='/act' && Number.isSafeInteger(data.seq) && data.seq>p.seq) {
      if(data.action==='move' && Number.isFinite(data.x) && Number.isFinite(data.y)) {
        travel(p,Math.max(32,Math.min(448,data.x)),Math.max(213,Math.min(289,data.y)),now);
      } else if(data.action==='lot'){
        if(!p.lastLot||now-p.lastLot.at>=1700){
          const previous=p.lastLot?.index;
          let index=randomInt(lots.length-(previous===undefined?0:1));
          if(previous!==undefined&&index>=previous)index++;
          const [x,y]=position(p,now);travel(p,x,y,now);
          p.lotAt=now;p.lastLot={index,at:now};record(p.name+' 摇了一支签');
        }
      } else if(data.action==='stop') {
        const [x,y]=position(p,now);
        travel(p,x,y,now);
      } else if(['incense','bow'].includes(data.action)) {
        const mat=nearestMat(p,now);
        if(!mat)return reply(res,409,{message:'拜垫已满'});
        travel(p,mat.x,mat.y,now);
        p.mat=mat.id;p.action=data.action;p.logged=false;p.offered=-1;p.counted=0;
      } else return reply(res,400,{});
      p.seq=data.seq;
    }
    const result=state(now,p);
    if(route==='/act' && data.action==='lot' && p.lastLot){
      const {index,at}=p.lastLot;result.lot={number:index+1,at,...lots[index]};
    }
    reply(res,200,result);
  } catch { if(!res.headersSent) reply(res,400,{}); }
});
function openBrowser(url) {
  spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{detached:true,stdio:'ignore'}).unref();
}
server.on('error',async e=>{
  if(e.code==='EADDRINUSE' && process.argv.includes('--open') && process.platform==='win32'){
    const url='http://127.0.0.1:'+port;
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(2000)});
      if(response.ok && (await response.text()).includes('<title>云栖小寺')){openBrowser(url);return;}
    }catch{}
  }
  console.error('启动失败：',e.message);process.exitCode=1;
});
server.listen(port,host,()=>{
  const url='http://'+(host==='0.0.0.0'?'127.0.0.1':host)+':'+server.address().port;
  console.log('云栖小寺已启动  '+url+'  （按 Ctrl+C 关闭）');
  if(process.argv.includes('--open') && process.platform==='win32') {
    openBrowser(url);
  }
});
