// Hall coordinates match the painted backdrop and the shared walking area.
function templeLight(c,sec,soft=false,smokeCount=0){
  const t=soft?sec*.36:sec;
  const wind=breeze(sec)*(soft?.22:1);
  c.save();c.globalCompositeOperation='screen';
  for(const [x,y] of [[179.8,134.8],[301.1,134.1]]){
    const n=Math.sin(t*5.1+x)*.6+Math.sin(t*8.7+x)*.3+wind*.85;
    const halo=c.createRadialGradient(x,y,0,x,y,9+n);
    halo.addColorStop(0,'#ffad4a8c');halo.addColorStop(1,'#f0852700');
    c.fillStyle=halo;c.fillRect(x-11,y-11,22,22);
    c.fillStyle='#fff0af';c.beginPath();c.moveTo(x-1.2,y+1);c.quadraticCurveTo(x-2,y-1,x+n*1.2,y-5+n);c.quadraticCurveTo(x+2.4,y-.6,x,y+1);c.fill();
  }
  // Each ribbon rises from the censer mouth, expands and disperses.
  for(let k=0;k<5+Math.min(5,smokeCount);k++){
    c.beginPath();
    for(let i=0;i<=23;i++){
      const f=i/23, y=163-48*f;
      const x=239+(k-2)*1.15+f*(7*Math.sin(f*8.5-t*.68+k*.44)+6*Math.sin(f*4+t*.4)+f*4)+f*f*wind*14;
      if(!i)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.strokeStyle=grad(c,0,163,0,115,[[0,'#dfd6c000'],[.25,'#f5e8cd54'],[.68,'#f1e1ce30'],[1,'#fff4db00']]);c.lineWidth=.65+k*.16;c.stroke();
  }
  for(let i=0;i<12+Math.min(8,smokeCount);i++){
    const f=(sec*.135+i*.61803)%1;
    const x=240+wind*14*f*f+f*(8*Math.sin(f*6-t*.64+i*.35));
    halo(c,x,160-42*f,1.8+8*f,2+4.5*f,.105*Math.sin(Math.PI*f),'#f4ede0');
  }
  for(let i=0;i<4;i++){
    const sway=Math.sin(t*.085+i)*4,x=468-i*4;
    const glow=grad(c,x,55,x-115,223,[[0,'#fff1af00'],[.22,'#ffde9827'],[.76,'#ffde9813'],[1,'#ffde9800']]);
    c.fillStyle=glow;c.beginPath();c.moveTo(x,44+i*7);c.lineTo(x+2.3,51+i*7);c.lineTo(x-93+sway,224);c.lineTo(x-118+sway,227);c.fill();
  }
  for(let i=0;i<44;i++){
    const f=(t*(.010+(i%4)*.002)+i*.381966)%1, x=412+Math.sin(i*11.2)*34-67*f+Math.sin(t*.26+i)*2;
    c.globalAlpha=.65*Math.sin(f*Math.PI);ellipse(c,(i%2?x:480-x)+wind*f*6,96+103*f,.36+i%3*.09,.50,'#ffe7af');
  }
  c.restore();
}
const fishBeatMs=1550;
const fishMonk={name:'木鱼僧 · 惟安',kind:'woodfish',x:357,y:201,heading:-3*Math.PI/4,walk:false};
function sceneMonks(now){
  const s=now/1000;
  const route=(start,end,t)=>{
    const p=((t%48)+48)%48;
    if(p<13)return {x:start+(end-start)*smooth(0,13,p),walk:true,mirror:end<start};
    if(p<25)return {x:end,walk:false,mirror:end<start};
    if(p<38)return {x:end+(start-end)*smooth(25,38,p),walk:true,mirror:end>start};
    return {x:start,walk:false,mirror:end>start};
  };
  return [
    {name:'方丈',kind:'abbot',x:124,y:211,mirror:false,walk:false},
    fishMonk,
    {name:'明净',kind:'novice',y:230,...route(58,111,s)},
    {name:'明心',kind:'novice',y:218,...route(412,347,s+15)}
  ];
}
function drawWoodfishMonk(c,t,heading){
  const side=Math.sin(heading),forward=Math.cos(heading);
  const point=(right,ahead,height)=>[right*forward+ahead*side,-height-.40*(ahead*forward-right*side)];
  const ink='#594532',cloth='#82705a',skin='#deb28c';
  const phase=t*1000%fishBeatMs/fishBeatMs;
  const lift=smooth(0,.19,phase)*(1-smooth(.82,1,phase));
  const instrument=point(0,39,0);
  function drum(){
    c.save();c.translate(...instrument);
    ellipse(c,0,0,15,3,'#9a6345');ellipse(c,0,-6,12,8,'#68432a');
    ellipse(c,0,-7.3,11.6,7.3,grad(c,-6,-15,7,0,[[0,'#d6a362'],[.55,'#a46836'],[1,'#714829']]));
    c.scale(forward>=0?1:-1,1);
    paintPath(c,'M-10 -7 Q-2 -3 10 -9 M-8 -10 Q-6 -13 -1 -12',null,'#553621',1.3);
    ellipse(c,8,-10.2,1,1,'#eed49c');c.restore();
  }
  function arm(k){
    const hand=k===1?point(4,23,22+lift*5):point(-5,10,18);
    const points=[point(k*10,1,32),point(k*12,8,22),hand];
    strand(c,points,ink,7);strand(c,points,cloth,5.7);
    if(k===1){
      const tip=point(0,39-lift*6,17+lift*17);
      strand(c,[hand,tip],'#8e633d',1.9);ellipse(c,...tip,2.8,2.6,'#c39258');
    }
    ellipse(c,...hand,2.5,2.5,skin);
  }
  ellipse(c,0,0,23,5,'#a67749');ellipse(c,0,-1.7,21,4,'#d4ac70');
  if(forward>=0)drum();
  const nearArm=side>=0?1:-1;
  arm(-nearArm);
  paintPath(c,'M-9 -41 Q0 -44 9 -40 Q14 -37 15 -23 Q27 -16 23 -8 Q19 -2 0 -4 Q-20 -2 -23 -9 Q-24 -16 -15 -22 Q-15 -34 -9 -41Z',cloth,ink,1);
  const collar=point(0,forward<0?4:-3,37);
  paintPath(c,'M-9 -39 Q'+collar[0]+' '+(forward<0?-22:-33)+' 9 -39',null,'#d3c2a2',1.5);
  paintPath(c,'M-18 -11 Q-7 -8 -3 -11 M6 -11 Q14 -16 16 -17',null,'#675542',1);
  const [hx,hy]=point(0,2,52);
  c.save();c.translate(hx,hy);
  ellipse(c,0,0,13.4,14.5,grad(c,-9,-12,8,10,[[0,'#a59584'],[.53,'#e5bf9b'],[1,'#ce9d79']]));
  const ear=point(11*nearArm,0,0);ellipse(c,ear[0],3,2.9,4.2,skin);
  if(forward<.05){
    c.save();c.translate(side*7,0);c.scale(Math.max(.3,-forward),1);
    paintPath(c,'M-7 2 Q-4 4 -1 2 M3 2 Q6 4 9 1 M0 9 Q3 10 5 8',null,ink,1);c.restore();
  }else{
    paintPath(c,'M-7 10 Q0 14 7 10',null,'#bd967a',.65);
    ellipse(c,-side*2,-3,11,9,'#af99832a');
  }
  c.restore();
  if(forward<0)drum();
  arm(nearArm);
}
function monk(c,n,t){
  const elder=n.kind==='abbot',gray=n.name==='明净'?'#7f8c87':'#918372';
  const ink='#584536',sleeve=elder?'#ad7747':gray;
  c.save();if(n.mirror)c.scale(-1,1);
  const hop=n.walk?Math.sin(t*4.2):0;
  if(elder){
    ellipse(c,0,-2,24,4.5,'#a27b4e');ellipse(c,0,-4,21,3.4,'#dfb374');
  }else{
    for(const k of [-1,1]){strand(c,[[k*6,-16],[k*(7+hop*3),-4]],'#514c43',7);ellipse(c,k*(7+hop*3)+1,-2,5.3,2.1,'#3d3930');}
  }
  c.translate(0,elder?1+Math.sin(t*.9)*.42:Math.abs(hop)*-1.5);
  const sweeping=n.name==='明净'&&!n.walk;
  const dip=elder?.45*(1+Math.sin(t*.82)):n.walk?0:sweeping?1.7+.9*Math.sin(t*2.1):2.6*(1+Math.sin(t*.9));
  c.save();c.translate(0,dip);c.rotate(dip*.009);
  paintPath(c,elder?'M-10 -41 Q-16 -38 -18 -24 Q-26 -19 -24 -9 Q-17 -2 0 -4 Q18 -2 24 -10 Q24 -17 14 -22 L12 -37 Q7 -43 -10 -41Z':'M-9 -39 Q-16 -36 -13 -22 L-16 -11 Q-3 -7 15 -12 L12 -32 Q10 -40 1 -40Z',sleeve,ink,.9);
  if(elder){
    paintPath(c,'M-13 -39 L-6 -41 Q5 -29 14 -27 L18 -12 Q2 -12 -15 -7 L-21 -12 Q-10 -23 -13 -39Z','#964d38',ink,.8);
    paintPath(c,'M-11 -38 Q0 -27 14 -25 M-14 -13 L15 -18 M-10 -22 L13 -25 M-4 -28 L-3 -20 M4 -21 L5 -15',null,'#d9a75f',1);
    ellipse(c,0,-9,17,4,'#965a41');
  }else{
    paintPath(c,'M-8 -39 L0 -33 L9 -40 L7 -36 L-7 -22 M0 -33 L3 -30',null,'#d4c9ae',1.5);
    paintPath(c,'M-13 -17 Q-1 -14 12 -18',null,'#625749',2);
  }
  const hy=elder?-55:-52;
  c.save();c.translate(1,hy);
  ellipse(c,-11,2,3,4.5,'#d9a582');ellipse(c,1,-.6,13,14.6,grad(c,-9,-12,9,9,[[0,'#ae957f'],[.35,'#edc7a1'],[.72,'#f5d1a9'],[1,'#d7a07d']]));
  paintPath(c,'M-10 -8 Q-6 -17 3 -15 Q8 -15 12 -9 Q3 -13 -6 -8Z',elder?'#b0a193':'#988f82');
  paintPath(c,'M-3 2 Q0 4 3 1 M7 1 Q10 3 12 0',null,ink,1);
  if(elder){paintPath(c,'M-5 -.5 Q-1 -4 3 -2 M6 -2 Q9 -4 12 -3',null,'#f1dfbe',1.8);paintPath(c,'M-5 6 q2 2 4 1 M5 8 q2 1 4 -1',null,'#b98c71',.7);}
  else{ellipse(c,-4,6,2.5,.9,'#dc9e84');}
  c.restore();
  for(const k of [-1,1]){
    const sway=n.walk?hop*3*k:sweeping?3.4*Math.sin(t*2.1):elder?Math.sin(t*1.8)*.85:0;
    strand(c,[[k*9,-31],[k*11,-23],[k*(n.walk?8:2)+sway,-25+(elder?2:0)]],ink,6.6);
    strand(c,[[k*9,-31],[k*11,-23],[k*(n.walk?8:2)+sway,-25+(elder?2:0)]],sleeve,5.5);
    ellipse(c,k*(n.walk?8:1.45)+sway,-27+(elder?2:0),2,3.7,'#e7b58a',k*.17);
  }
  if(elder)for(let i=0;i<15;i++){
    const a=t*.30+i*2*Math.PI/15;
    ellipse(c,3+4.5*Math.cos(a)+Math.sin(t*1.8)*.85,-24+7*Math.sin(a),1,1.1,i===0?'#c99c65':'#583d2c');
  }
  if(n.name==='明净'){
    c.save();c.translate(5+(sweeping?3.4*Math.sin(t*2.1):0),-24);
    c.rotate(n.walk?-.26+hop*.09:-.55+.36*Math.sin(t*2.1));
    strand(c,[[0,-14],[0,19]],'#8a6339',1.9);
    paintPath(c,'M-2 12 Q-3 17 -6 23 Q0 26 6 24 Q2 17 2 12Z','#be975c','#87683e',.7);
    for(let i=-2;i<=2;i++)strand(c,[[i*.45,15],[i*2,23]],'#e4c487',.55);
    c.restore();
  }
  c.restore();c.restore();
}
