// Material motion is calculated in the original painting's 480 × 300 coordinates.
const liveHall=document.createElement('canvas');
liveHall.width=1440;liveHall.height=900;
const interior=liveHall.getContext('2d',{alpha:false});
let paintedAt=-Infinity,lastSmoke=-1;
function breeze(t){
  return .56*Math.sin(t*.76)+.30*Math.sin(t*1.37+.8)+.14*Math.sin(t*2.32-.4);
}
const hangings=[
  {x:109,y:4,w:61,h:64,type:'lamp',phase:0},{x:370,y:4,w:61,h:64,type:'lamp',phase:.7},
  {x:109,y:62,w:11,h:44,type:'cord',phase:.08},{x:370,y:62,w:11,h:44,type:'cord',phase:.78},
  {x:93,y:65,w:27,h:92,type:'silk',phase:.25},{x:128,y:65,w:28,h:92,type:'silk',phase:.68},
  {x:352,y:65,w:28,h:92,type:'silk',phase:1},{x:387,y:65,w:28,h:92,type:'silk',phase:1.4},
  {x:151.5,y:105,w:46,h:38,type:'lotus',phase:.85},{x:328,y:105,w:46,h:38,type:'lotus',phase:1.2}
];
function swayDetail(c,obj,t,strength){
  const {x,y,w,h,type,phase}=obj;
  const wind=breeze(t-phase);
  // Warp the border as well as the object so the painting has no standing duplicate.
  const left=Math.round((x-w/2-4)*3),right=Math.round((x+w/2+4)*3);
  const pad=Math.round((type==='cord'?3:5)*3);
  const top=Math.round(y*3),height=Math.round(h*3);
  const band=type==='lamp'?7:6;
  for(let row=0;row<height;row+=band){
    const bh=Math.min(band,height-row),f=(row+bh*.5)/height;
    const edge=smooth(0,.08,f)*(1-smooth(.90,1,f));
    let offset;
    if(type==='lotus')offset=(1-f)*3.9*(wind+.23*Math.sin(t*1.7+f*3+phase));
    else if(type==='lamp')offset=f*3.9*wind;
    else if(type==='cord')offset=(2.8+f*2.6)*breeze(t-phase-.21*f);
    else offset=f*(3.95*breeze(t-phase-.45*f)+1.7*Math.sin(t*1.3-f*6.8+phase));
    const dx=offset*edge*strength*3,Y=top+row;
    const sy=Y*hall.naturalHeight/900,sh=bh*hall.naturalHeight/900,ratio=hall.naturalWidth/1440;
    let src=left,dst=left;
    for(const [sx,ex] of [[left+pad,left+pad+dx],[right-pad,right-pad+dx],[right,right]]){
      c.drawImage(hall,src*ratio,sy,(sx-src)*ratio,sh,dst,Y,ex-dst,bh);
      src=sx;dst=ex;
    }
  }
}
function halo(c,x,y,w,h,alpha,ink){
  c.save();c.translate(x,y);c.scale(w,h);const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,ink);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}
function daylight(t){
  return .52+.28*Math.sin(t*.139)+.20*Math.sin(t*.31-1.2);
}
function castWindow(c,x,y,direction,light,t){
  c.save();c.translate(x,y);c.transform(direction,.05,-direction*.95,.26,0,0);
  // Moving window light retains the dark bars of its lattice.
  c.translate(Math.sin(t*.24)*6,Math.sin(t*.36)*4);
  c.globalCompositeOperation='screen';c.fillStyle='#ffdd91';
  for(let row=0;row<3;row++)for(let col=0;col<6;col++){
    const power=(1-Math.abs(col-2.5)/4.3)*(.7+.3*Math.sin(t*.8+row*.85+col*.62));
    c.globalAlpha=(.09+.21*light)*power;
    c.fillRect(col*6.5,row*11,5.35,9.4);
  }
  c.restore();
}
function relight(c,t){
  const sun=daylight(t),wind=breeze(t);
  c.save();c.globalCompositeOperation='multiply';
  const shade=grad(c,0,0,480,235,[[0,'#bfbaae'],[.36,'#d2cac0'],[1,'#a99d8b']]);
  c.globalAlpha=.24+.43*(1-sun);c.fillStyle=shade;c.fillRect(0,0,480,300);
  // Dappled shade from branches outside each lattice window.
  for(const side of [-1,1]){
    const x=side<0?49:431;
    c.save();c.beginPath();c.rect(x-24,64,48,97);c.clip();
    c.globalAlpha=.2+.13*(1-sun);
    for(let i=0;i<16;i++){
      const y=74+(i*19)%80;
      const dx=Math.sin(i*6.3+y)*20+wind*(4+i%4);
      ellipse(c,x+dx,y+Math.sin(t*.5+i)*2,5+i%4,1.7,'#826c52',side*.5+wind*.15);
    }
    c.restore();
  }
  c.globalAlpha=1;c.globalCompositeOperation='screen';
  for(const o of hangings.slice(0,2)){
    const f=.68+.21*Math.sin(t*2.21+o.phase)+.10*Math.sin(t*4.96);
    halo(c,o.x+wind*2,o.y+37,27,32,.12+.23*f,'#ffc068');
  }
  // Warm changes on gold leaf, porcelain, lacquer, bronze and stone.
  halo(c,231+sun*12,88,64,70,.035+.14*sun,'#ffcc77');
  for(const x of [151,328])halo(c,x+wind,150,8,13,.055+.14*sun,'#eed8af');
  halo(c,236+wind*2,184,20,13,.05+.15*sun,'#eebc74');
  halo(c,128+sun*176,165,62,4,.045+.09*sun,'#ffc17c');
  halo(c,75+sun*25,235,110,31,.09+.14*sun,'#ffd598');
  halo(c,414-sun*22,222,84,24,.07+.14*sun,'#ffcd8c');
  c.restore();
  castWindow(c,27+sun*7,223,1,sun,t);castWindow(c,455-sun*8,218,-1,sun,t+.9);
}
function liveInterior(now,smokeCount){
  if(!hall.complete||!hall.naturalWidth)return null;
  const interval=reduced?180:40;
  if(now>=paintedAt&&now-paintedAt<interval&&lastSmoke===smokeCount)return liveHall;
  paintedAt=now;lastSmoke=smokeCount;
  const t=now/1000,c=interior;
  c.setTransform(1,0,0,1,0,0);c.drawImage(hall,0,0,1440,900);
  for(const obj of hangings)swayDetail(c,obj,t,reduced?.20:1);
  c.setTransform(3,0,0,3,0,0);relight(c,t);templeLight(c,t,reduced,smokeCount);
  return liveHall;
}

