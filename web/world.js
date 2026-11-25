const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const hall=new Image();hall.src='/media/hall.webp';
function cushion(c,x,y,r){
  c.save();c.translate(x,y);c.scale(r,r*.46);
  ellipse(c,.10,.22,1.06,.94,'#30272440');
  ellipse(c,0,0,1,1,'#825234');ellipse(c,0,-.13,.96,.86,'#bd8250');
  c.strokeStyle='#ebbf77';c.lineWidth=.06;c.beginPath();c.ellipse(0,-.13,.82,.7,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(c,Math.cos(a)*.44,Math.sin(a)*.39-.13,.23,.08,'#e1ac6d',a);}
  c.restore();
}

function ritualTime(p,now){return Math.max(0,(now-p.arrive)/1000)%7.4;}
function prayerMat(c,mat,players,self,now,x,y,r){
  const guest=players.find(p=>p.action&&p.mat===mat.id);
  const seconds=guest?(now-guest.arrive)/1000:0;
  const phase=Math.max(0,seconds)%7.4;
  const weight=guest?.action==='bow'?smooth(1.65,2.7,phase)*(1-smooth(5.6,6.85,phase)):0;
  c.save();c.translate(x,y);c.scale(1+.055*weight,1-.16*weight);
  cushion(c,0,0,r);
  if(guest&&guest.id===self){
    c.strokeStyle=seconds<0?'#ffdf93':'#efd093';c.lineWidth=Math.max(.5,r*.082);
    c.globalAlpha=seconds<0?.75+.23*Math.sin(now*.008):.76;
    c.beginPath();c.ellipse(0,0,r*(seconds<0?1.2:1.04),r*.49,0,0,Math.PI*2);c.stroke();
  }
  c.restore();
}
function drawOfferings(c,offerings,now){
  for(const slot of new Set(offerings.map(v=>v.slot))){
    c.save();c.translate(235+slot*1.1,169);c.scale(.27,.27);sticks(c,0,0,(slot-5)*.9,true,now/1000);c.restore();
  }
}
function actor(a,self,now,x,y,scale,viewHeading=0){
  const {p,n}=a,action=p&&a.f===1?p.action:'';
  const t=now/1000,light=daylight(t);
  ctx.save();ctx.translate(x,y);
  ellipse(ctx,-scale*(6+light*9),scale*1.4,scale*(24+9*light),scale*5.5,'#52382138',-.09);
  ellipse(ctx,0,.4,scale*22,scale*5,'#38292055');
  if(self){ctx.strokeStyle='#fff1b8';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(0,.3,scale*24,scale*6,0,0,2*Math.PI);ctx.stroke();}
  ctx.save();ctx.scale(scale,scale);
  const breath=Math.sin(t*1.65+(p?.slot??a.x)*.83)*(reduced?.25:1);
  ctx.scale(1-.008*breath,1+.012*breath);
  if(!action)ctx.rotate(.011*Math.sin(t*.77+a.x));
  if(n){
    const factor=n.kind==='abbot'?2.38:n.kind==='woodfish'?2:1.66;ctx.scale(factor,factor);
    if(n.kind==='woodfish')drawWoodfishMonk(ctx,t,n.heading-viewHeading);
    else monk(ctx,n,t);
  }
  else {
    const moving=a.f<1||(!action&&(p.tx!==p.x||p.ty!==p.y));
    const heading=moving?Math.atan2(p.tx-p.x,(p.y-p.ty)*depthUnit):altarHeading(a.x,a.y);
    const shaking=p.lotAt&&now-p.lotAt<1700;
    figure(ctx,{slot:p.slot,action,t:action?ritualTime(p,now):now/1000,step:a.f<1?Math.sin(now/85):0,heading:heading-viewHeading,shaking});
  }
  ctx.restore();
  const caption=n?(n.kind==='novice'?'小和尚 · '+n.name:n.name):p.name+(action?(action==='bow'?' · 礼佛':' · 上香'):p.lotAt&&now-p.lotAt<1700?' · 求签':'');
  const font=Math.max(6.1,Math.min(9,scale*18));
  ctx.font='600 '+font+'px "Microsoft YaHei",sans-serif';const w=ctx.measureText(caption).width+7,top=-scale*(n?(n.kind==='abbot'?166:113):142)-font-4;
  ctx.fillStyle=n?'#644d32e6':self?'#314438ef':'#493a31d9';ctx.beginPath();ctx.roundRect(-w/2,top,w,font+3,3);ctx.fill();
  ctx.fillStyle=self||n?'#ffdf9f':'#fff1d3';ctx.textAlign='center';ctx.fillText(caption,0,top+font+.3);ctx.restore();
}
function paint(snapshot,id,now){
  const d=Math.min(2,window.devicePixelRatio||1),width=Math.max(480,Math.round(canvas.clientWidth*d));
  if(canvas.width!==width){canvas.width=width;canvas.height=Math.round(width*300/480);}
  ctx.setTransform(canvas.width/480,0,0,canvas.height/300,0,0);
  const actors=snapshot.players.map(p=>({p,...atPosition(p,now)}));
  for(const n of sceneMonks(now))actors.push({n,x:n.x,y:n.y});
  const me=snapshot.players.find(p=>p.id===id);
  if(eyeView.active&&me){firstPerson(snapshot,me,now,actors);return;}
  const scene=liveInterior(now,snapshot.offerings.length);
  if(scene)ctx.drawImage(scene,0,0,480,300);
  else{ctx.fillStyle='#402b22';ctx.fillRect(0,0,480,300);}
  drawOfferings(ctx,snapshot.offerings,now);
  for(const mat of snapshot.mats||[])prayerMat(ctx,mat,snapshot.players,id,now,mat.x,mat.y,9);
  actors.sort((a,b)=>a.y-b.y);
  for(const a of actors)actor(a,a.p?.id===id,now,a.x,a.y,.32+(a.y-210)*.0012);
}
