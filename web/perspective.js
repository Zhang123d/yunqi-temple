// The first-person camera and all visitors share the same floor coordinates.
const eyeView={active:false,yaw:0,pitch:0,cam:null};
const focal=178,depthUnit=2.45,farWall=164,roomDepth=380;
const front=document.createElement('canvas'),panel=document.createElement('canvas');
front.width=1200;front.height=520;panel.width=840;panel.height=340;
const wallPen=front.getContext('2d'),wc=panel.getContext('2d');
let wallStamp=-Infinity;
function sidePanel(){
  const c=wc;c.fillStyle=grad(c,0,0,0,340,[[0,'#573c2c'],[.22,'#aa7245'],[1,'#6a4230']]);c.fillRect(0,0,840,340);
  for(let bay=0;bay<4;bay++){
    const x=bay*210;c.fillStyle='#51362b';c.fillRect(x+17,65,176,170);
    c.fillStyle=grad(c,x,68,x+190,231,[[0,'#b98a50'],[.55,'#ffe1a3'],[1,'#caa574']]);c.fillRect(x+23,71,164,157);
    c.save();c.beginPath();c.rect(x+23,71,164,157);c.clip();
    for(let k=-170;k<340;k+=28){
      strand(c,[[x+k,70],[x+k+158,228]],'#795439',3);
      strand(c,[[x+k,228],[x+k+158,70]],'#795439',3);
    }c.restore();
    for(const y of [69,147,229]){c.fillStyle='#5e3829';c.fillRect(x+17,y,176,5);}
    for(const xx of [x+18,x+100,x+186]){c.fillStyle='#5d3929';c.fillRect(xx,68,5,166);}
    c.strokeStyle='#bd9057';c.lineWidth=2;c.strokeRect(x+24,248,160,60);c.strokeRect(x+30,254,148,48);
    c.fillStyle=grad(c,x,0,x+15,0,[[0,'#67382a'],[.3,'#ac5d3c'],[1,'#603627']]);c.fillRect(x,0,16,331);
    c.fillStyle='#b18a51';c.fillRect(x,295,16,5);
    petalMark(c,x+95,281,1.5);
  }
  c.fillStyle='#39534a';c.fillRect(0,5,840,26);for(let x=0;x<840;x+=40)petalMark(c,x+12,25,1);
  c.fillStyle='#dab47a';c.fillRect(0,30,840,3);c.fillStyle='#685242';c.fillRect(0,326,840,14);
}
sidePanel();
const panelBase=document.createElement('canvas');
panelBase.width=panel.width;panelBase.height=panel.height;
panelBase.getContext('2d').drawImage(panel,0,0);
function lightWindows(t){
  wc.drawImage(panelBase,0,0);
  const wind=breeze(t),sun=daylight(t);
  for(let bay=0;bay<4;bay++){
    wc.save();wc.beginPath();wc.rect(bay*210+23,71,164,157);wc.clip();
    for(let i=0;i<16;i++){
      const x=bay*210+27+(i*39)%158+wind*(2+i%5),y=76+(i*17)%140;
      ellipse(wc,x,y,9+i%4,3,'#78604048',-.5+wind*.12);
    }
    wc.globalCompositeOperation='screen';
    halo(wc,bay*210+89+wind*10,140,110,93,.09+.20*sun,'#ffd69b');wc.restore();
  }
}
function floorSun(cam,t){
  const sun=daylight(t);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const sign of [-1,1]){
    for(let j=0;j<3;j++)for(let i=0;i<6;i++){
      const x=(sign<0?20:460)+sign*(-i*6.8-j*1.9-4*sun);
      const y=230+j*4.3+i*1.3;
      const corners=[[x,y],[x-sign*5.9,y+1],[x-sign*7.5,y+4.3],[x-sign*1.6,y+3.3]].map(([xx,yy])=>project(cam,xx,yy,.08));
      if(corners.some(p=>!p||p.depth<7))continue;
      ctx.fillStyle='#f5cf96';ctx.globalAlpha=(.085+.19*sun)*(.7+.3*Math.sin(t*.55+i+j));
      ctx.beginPath();corners.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
    }
  }
  ctx.restore();
}
function atPosition(p,now){
  const f=Math.max(0,Math.min(1,(now-p.start)/Math.max(1,p.arrive-p.start)));
  return {x:p.x+(p.tx-p.x)*f,y:p.y+(p.ty-p.y)*f,f};
}
function faceAltar(p,now){
  if(!p)return;
  const a=atPosition(p,now);eyeView.yaw=altarHeading(a.x,a.y);eyeView.pitch=0;
}
function altarHeading(x,y){return Math.atan2(240-x,(y-farWall)*depthUnit);}
function project(c,x,y,h=0){
  const dx=x-c.x,dz=(c.y-y)*depthUnit,depth=dx*c.sin+dz*c.cos;
  if(depth<3)return null;
  const scale=focal/depth;
  return {x:240+(dx*c.cos-dz*c.sin)*scale,y:c.horizon+(c.height-h)*scale,scale,depth};
}
function floorTarget(px,py){
  const c=eyeView.cam;if(!c||py<c.horizon+1)return null;
  const depth=c.height*focal/(py-c.horizon),lateral=(px-240)*depth/focal;
  return {x:c.x+depth*c.sin+lateral*c.cos,y:c.y-(depth*c.cos-lateral*c.sin)/depthUnit};
}
// Sample the stone and timber in world space, so they stay anchored while turning.
const surface=document.createElement('canvas');surface.width=480;surface.height=300;
const surfacePen=surface.getContext('2d'),surfaceFrame=surfacePen.createImageData(480,300);
let stonePixels,ceilingPixels,lastSurface='';
function paintSurfaces(cam){
  if(!hall.complete||!hall.naturalWidth)return;
  const key=[cam.x,cam.y,cam.sin,cam.cos,cam.horizon,cam.height].join('/');
  if(key===lastSurface){ctx.drawImage(surface,0,0);return;}
  lastSurface=key;
  if(!stonePixels){
    const tile=document.createElement('canvas');tile.width=tile.height=128;
    const c=tile.getContext('2d',{willReadFrequently:true});
    c.drawImage(hall,650,906,220,71,0,0,128,128);
    stonePixels=c.getImageData(0,0,128,128).data;
    c.fillStyle='#5a4030';c.fillRect(0,0,128,128);
    for(let i=0;i<5;i++){c.fillStyle='#70503b';c.fillRect(0,i*26,128,1);}
    c.fillStyle='#354943';c.fillRect(0,0,128,9);c.fillRect(0,0,9,128);
    c.fillStyle='#b19561';c.fillRect(0,8,128,1);c.fillRect(8,0,1,128);
    petalMark(c,66,69,.85);ceilingPixels=c.getImageData(0,0,128,128).data;
  }
  const out=surfaceFrame.data,cz=(cam.y-farWall)*depthUnit;
  for(let row=0;row<300;row++){
    const dy=row+.5-cam.horizon,ground=dy>0,tex=ground?stonePixels:ceilingPixels;
    const depth=focal*(ground?cam.height:185-cam.height)/Math.max(.1,Math.abs(dy));
    const unit=ground?3.2:1.6,inc=depth/focal;
    let x=(cam.x+cam.sin*depth-239.5*inc*cam.cos)*unit;
    let z=(cz-cam.cos*depth-239.5*inc*cam.sin)*unit;
    const sx=inc*cam.cos*unit,sz=inc*cam.sin*unit,light=ground?.85+Math.min(.13,depth/2000):.88;
    for(let col=0,i=row*480*4;col<480;col++,i+=4,x+=sx,z+=sz){
      const tx=Math.floor(x)&255,tz=Math.floor(z)&255;
      const idx=((tz>127?255-tz:tz)*128+(tx>127?255-tx:tx))*4;
      out[i]=tex[idx]*light;out[i+1]=tex[idx+1]*light;out[i+2]=tex[idx+2]*light;out[i+3]=255;
    }
  }
  surfacePen.putImageData(surfaceFrame,0,0);ctx.drawImage(surface,0,0);
}
function roomWalls(c,now,offerings){
  const g=ctx;g.fillStyle=grad(g,0,0,0,300,[[0,'#443324'],[.43,'#8e704e'],[.58,'#ac9377'],[1,'#705644']]);g.fillRect(0,0,480,300);
  paintSurfaces(c);
  floorSun(c,now/1000);
  if(now-wallStamp>95&&hall.complete&&hall.naturalWidth){
    wallPen.setTransform(2.5,0,0,2.5,0,0);
    wallPen.drawImage(liveInterior(now,offerings.length),0,0,480,300);lightWindows(now/1000);
    drawOfferings(wallPen,offerings,now);wallStamp=now;
  }
  const cz=(c.y-farWall)*depthUnit;
  for(let i=0;i<480;i+=1.5){
    const u=(i+.75-240)/focal,dx=c.sin+u*c.cos,dz=-c.cos+u*c.sin;
    const tx=Math.abs(dx)<.0001?1e9:((dx>0?480:0)-c.x)/dx;
    const tz=Math.abs(dz)<.0001?1e9:((dz>0?roomDepth:0)-cz)/dz;
    const dist=Math.max(1,Math.min(tx,tz)),x=c.x+dx*dist,z=cz+dz*dist,face=tz<tx&&dz<0;
    const tex=face?front:panel;
    const fraction=face?x/480:tz<tx?1-x/480:(dx>0?z:roomDepth-z)/roomDepth;
    const sx=Math.max(0,Math.min(tex.width-1,fraction*tex.width));
    const scale=focal/dist,top=c.horizon-(185-c.height)*scale,high=185*scale;
    g.drawImage(tex,sx,0,Math.max(1,Math.min(tex.width-sx,dist*.018)),tex.height,i,top,1.55,high+.1);
  }
  // Clip ground lines at the near plane before projection.
  function floorLine(x1,y1,x2,y2){
    const z1=(x1-c.x)*c.sin+(c.y-y1)*depthUnit*c.cos,z2=(x2-c.x)*c.sin+(c.y-y2)*depthUnit*c.cos;
    if(z1<4&&z2<4)return;
    if(z1<4){const v=(4-z1)/(z2-z1);x1+=(x2-x1)*v;y1+=(y2-y1)*v;}
    else if(z2<4){const v=(4-z2)/(z1-z2);x2+=(x1-x2)*v;y2+=(y1-y2)*v;}
    const a=project(c,x1,y1),b=project(c,x2,y2);
    if(a&&b)strand(g,[[a.x,a.y],[b.x,b.y]],'#715b4d8c',.8);
  }
  for(let x=0;x<=480;x+=40)floorLine(x,farWall,x,farWall+roomDepth/depthUnit);
  for(let y=farWall;y<farWall+roomDepth/depthUnit;y+=16)floorLine(0,y,480,y);
}
function hands(kind,t,slot,walk){
  const bow=kind==='bow',offering=kind==='incense';
  const joined=bow?Math.min(1,t/.8):offering?.96:0;
  const lift=bow?13+24*Math.sin(Math.PI*t/7.4):offering?18+25*Math.sin(Math.PI*t/7.4):0;
  const gap=joined?2+(1-joined)*24:82;
  const y=300-lift+Math.sin(walk?t*8:t*1.3)*1.2;
  ctx.save();ctx.translate(240,y);
  for(const k of [-1,1]){
    ctx.save();ctx.scale(k,1);ctx.translate(gap,0);
    if(offering && t<5.65){
      paintPath(ctx,'M59 32 Q29 24 7 9 Q0 6 -2 1 L-5 -7 Q-6 -11 -3 -11 L3 -7 L-3 -12 Q-4 -16 0 -15 L8 -10 Q4 -19 7 -19 Q10 -19 15 -10 L18 -1 L36 10Z','#efc29b','#765443',1);
    }else{
      paintPath(ctx,'M59 32 Q29 24 7 9 Q1 6 -1 0 Q-3 -8 -2 -21 Q-2 -26 0 -26 Q2 -26 2 -20 Q2 -29 4 -29 Q6 -29 6 -21 Q7 -26 9 -24 Q11 -21 11 -12 Q14 -17 16 -14 Q16 -11 14 -5 L36 10Z','#efc29b','#765443',1);
    }
    paintPath(ctx,'M11 3 Q19 -3 24 -7 L81 28 L63 52Z',robes[slot],'#635244',1);
    paintPath(ctx,'M15 5 L25 -4',null,'#edd39e',2);ctx.restore();
  }
  if(offering&&t<5.65)sticks(ctx,0,-5,Math.sin(t*.85)*5,t>1.55,t);
  ctx.restore();
}
function firstPerson(snapshot,me,now,actors){
  const pos=atPosition(me,now),kind=pos.f===1?me.action:'',t=kind?ritualTime(me,now):now/1000;
  const dip=kind==='bow'?smooth(1.65,4.1,t)*(1-smooth(4.95,6.85,t)):0;
  const key=kind?me.id+'-'+me.arrive:'';
  if(key&&key!==eyeView.ritual)faceAltar(me,now);
  eyeView.ritual=key;
  const cam={...pos,sin:Math.sin(eyeView.yaw),cos:Math.cos(eyeView.yaw),height:40-25*dip,
    horizon:158+eyeView.pitch-90*dip+(pos.f<1&&!reduced?Math.sin(now/100)*1.1:0)};
  eyeView.cam=cam;roomWalls(cam,now,snapshot.offerings);
  const items=[];
  for(const mat of snapshot.mats||[]){
    const p=project(cam,mat.x,mat.y);if(p)items.push({p,mat});
  }
  for(const a of actors){
    if(a.p?.id===me.id)continue;const p=project(cam,a.x,a.y);
    if(p&&p.x>-100&&p.x<580&&p.depth>9)items.push({p,a});
  }
  items.sort((a,b)=>b.p.depth-a.p.depth);
  for(const {p,a,mat} of items){
    if(mat)prayerMat(ctx,mat,snapshot.players,me.id,now,p.x,p.y,8*p.scale);
    else actor(a,false,now,p.x,p.y,p.scale*.35,Math.atan2(a.x-cam.x,(cam.y-a.y)*depthUnit));
  }
  hands(kind,t,me.slot,pos.f<1);
}
