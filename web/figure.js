/* Shared character rig. Coordinates are relative to the visitor's feet. */
const robes=['#7ba995','#cf826c','#b19ab9','#c49b53','#76a6b7','#c0889b','#9ca36b','#929bac','#ca987d','#a69b82'];
function smooth(a,b,t){
  const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);
}
function keyframes(t,keys){
  let prev=keys[0];
  for(const next of keys.slice(1)){
    if(t<=next[0]){
      const f=smooth(prev[0],next[0],t);
      return prev.slice(1).map((v,i)=>v+(next[i+1]-v)*f);
    }
    prev=next;
  }
  return prev.slice(1);
}
function paintPath(c,d,fill,edge,width=1){
  const path=new Path2D(d);
  if(fill){c.fillStyle=fill;c.fill(path);}
  if(edge){c.strokeStyle=edge;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke(path);}
}
function ellipse(c,x,y,rx,ry,fill,rot=0){
  c.beginPath();c.ellipse(x,y,rx,ry,rot,0,2*Math.PI);c.fillStyle=fill;c.fill();
}
function grad(c,x,y,xx,yy,stops){
  const g=c.createLinearGradient(x,y,xx,yy);stops.forEach(([n,color])=>g.addColorStop(n,color));return g;
}
function strand(c,pts,color,width){
  c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);
  c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.stroke();
}
function petalMark(c,x,y,s){
  c.save();c.translate(x,y);c.scale(s,s);
  paintPath(c,'M0 0 Q-6 -2 -7 -7 Q-2 -7 0 -2 Q1 -9 4 -10 Q6 -4 2 -1 Q7 -6 10 -4 Q7 0 0 0Z','#dfbd72');
  c.restore();
}
const poseKeys={
  // seconds, knee bend, body lean (degrees), right hand X/Y, hand separation
  bow:[[0,0,0,15,-55,15],[.85,0,1,19,-76,0],[1.55,0,1,19,-80,0],[2.6,1,7,21,-54,0],[3.2,1,25,43,-42,0],[4.15,1,88,87,-5,8],[4.95,1,90,88,-5,9],[5.9,1,9,26,-51,0],[6.85,0,0,19,-76,0],[7.4,0,0,19,-74,0]],
  incense:[[0,0,0,17,-52,4],[.75,0,12,42,-60,3],[1.55,0,24,62,-69,3],[2.12,0,24,62,-69,3],[3.15,0,0,21,-87,2],[3.85,0,0,21,-87,2],[4.9,0,25,65,-60,3],[5.55,0,27,72,-47,3],[6.05,0,22,59,-53,6],[6.85,0,0,20,-70,0],[7.4,0,0,20,-70,0]]
};
function incenseAngle(t){return keyframes(t,[[0,0],[.75,36],[1.55,63],[2.12,63],[3.15,0],[7.4,0]])[0];}
function sticks(c,x,y,angle,lit,t){
  c.save();c.translate(x,y);c.rotate(angle*Math.PI/180);
  for(const n of [-1,0,1]){
    const d=n*2.2,h=39+n*1.5;
    strand(c,[[d,3],[d+n*1.3,-h]],'#b4753d',1.2);
    strand(c,[[d,3],[d,-7]],'#a74337',1.2);
    if(lit)ellipse(c,d+n*1.3,-h,1.1,1.4,'#ffab4d');
  }
  c.restore();
  if(lit){
    const r=angle*Math.PI/180,sx=x+39*Math.sin(r),sy=y-39*Math.cos(r);
    c.save();c.strokeStyle='#eadfce99';c.lineWidth=.9;
    for(let n=0;n<2;n++){const wave=Math.sin(t*2+n)*3;c.beginPath();c.moveTo(sx+n*2,sy-2);c.bezierCurveTo(sx+8+wave,sy-12,sx-10,sy-16,sx+wave,sy-26-n*3);c.stroke();}c.restore();
  }
}
// Heading is zero towards the altar, positive clockwise. The same rig is
// projected from the room camera, a visitor's eye, and the close-up camera.
function figure(c,{slot=0,action='',t=0,step=0,heading=0,shaking=false}){
  const cs=Math.cos(heading),sn=Math.sin(heading),robe=robes[slot],ink='#503f35';
  const [kneel,lean,reach,handY,gap]=action?keyframes(t,poseKeys[action]):[0,2,7,-52,23];
  const rad=lean*Math.PI/180,hip=-39+23*kneel;
  const project=(width,forward,y)=>[width*cs+forward*sn,y-.40*(forward*cs-width*sn)];
  const joint=(width,height)=>project(width,-height*Math.sin(rad),hip+height*Math.cos(rad));
  const path=(points,color,line)=>strand(c,points,color,line);
  const face=cs<-.18;
  const bias=Math.min(1,Math.abs(sn));
  c.save();
  for(const side of [-1,1]){
    const foot=project(8*side,-8*kneel+step*side*6,-3),knee=project(8*side,12*kneel,-13+8*kneel);
    path([joint(7*side,0),knee,foot],ink,10);
    ellipse(c,foot[0],foot[1],6.8,3.5,'#453e37');path([[foot[0]-5,foot[1]+1],[foot[0]+5,foot[1]+1]],'#c6af83',.9);
  }
  const shoulder=joint(0,-37),waist=joint(0,-6),hem=joint(0,17-10*kneel);
  const half=17-bias*3,hemWidth=22-bias*3;
  const coat=grad(c,waist[0]-20,0,waist[0]+20,5,[[0,'#52675a'],[.28,robe],[.72,robe],[1,'#516356']]);
  function body(){
    const d='M'+(shoulder[0]-half)+' '+shoulder[1]+' Q'+shoulder[0]+' '+(shoulder[1]-10)+' '+(shoulder[0]+half)+' '+shoulder[1]+' L'+(waist[0]+14)+' '+waist[1]+' L'+(hem[0]+hemWidth)+' '+hem[1]+' Q'+hem[0]+' '+(hem[1]+10)+' '+(hem[0]-hemWidth)+' '+hem[1]+' L'+(waist[0]-14)+' '+waist[1]+'Z';
    paintPath(c,d,coat,ink,1.35);
    path([[waist[0]-14,waist[1]],[waist[0],waist[1]+2],[waist[0]+14,waist[1]]],'#83664b',3.8);
    path([[shoulder[0]-10,shoulder[1]-2],[shoulder[0],shoulder[1]+(face?12:3)],[shoulder[0]+10,shoulder[1]-2]],'#eed8aa',2.1);
    petalMark(c,hem[0]-9,hem[1]-.6,.48);
  }
  function arms(){
    for(const side of [-1,1]){
      const h=project(side*(action?Math.max(1.5,gap*.5):15),reach,handY+(action?0:step*side*5));
      const sh=joint(side*14,-33);
      const elbow=[(sh[0]+h[0])*.5+side*4,Math.max(sh[1]+9,h[1]+9)];
      path([sh,elbow,[h[0],h[1]+4]],ink,10.5);path([sh,elbow,[h[0],h[1]+4]],robe,8.8);
      ellipse(c,h[0],h[1],2.6,4.4,'#efc39d',side*.14);
    }
  }
  const head=joint(0,-69),headHeight=22-3*kneel;
  function drawHead(){
    c.save();c.translate(...head);
    const skin=grad(c,-21,-13,19,18,[[0,'#cb997c'],[.5,'#f8d3a7'],[1,'#e6af88']]);
    const hair=grad(c,-21,-20,21,15,[[0,'#6e5042'],[.52,'#4a3931'],[1,'#332e29']]);
    ellipse(c,0,0,25,headHeight,ink);ellipse(c,0,0,24,headHeight-1,skin);
    for(const k of [-1,1])ellipse(c,k*23,3,3.2,4.7,'#e4b18c');
    if(face){
      paintPath(c,'M-24 1 Q-28 -24 -2 -25 Q20 -27 25 -7 Q19 -6 14 -13 Q10 -8 8 -4 Q6 -10 3 -13 Q-6 -5 -14 -5 L-21 4Z',hair,ink,.8);
      for(const k of [-1,1]){
        const x=k*8+sn*8;
        if(action||t%4.5<.14)paintPath(c,'M'+(x-3)+' 4 q3 2 6 -1',null,ink,1.3);
        else ellipse(c,x,4,1.9,3,ink);
      }
      paintPath(c,'M-2 13 q3 2 6 -1',null,'#a77861',1);
    }else{
      ellipse(c,-sn*2,-2,24,headHeight,hair);
      paintPath(c,'M-17 -8 Q-14 -18 -5 -19 M-11 12 Q-1 18 9 13',null,'#7c5e4d',1.1);
    }
    ellipse(c,-sn*8,-headHeight,8.9,7.7,hair);path([[-sn*8-6,-headHeight+4],[-sn*8+6,-headHeight+4]],'#e2bd79',1.5);
    c.restore();
  }
  if(cs>.1){arms();body();drawHead();}else{body();drawHead();arms();}
  if(shaking){
    c.save();c.translate(15,-46+Math.sin(t*18)*3);c.rotate(.17*Math.sin(t*18));
    for(let k=-2;k<=2;k++)strand(c,[[k,0],[k*2,-17-Math.cos(k*2)*2]],'#e7be78',1.8);
    paintPath(c,'M-6 -8 Q0 -6 6 -8 L5 6 Q0 8 -5 6Z','#9d5035','#5c3729',1);c.restore();
  }
  if(action==='incense'&&t<5.63){
    const angle=incenseAngle(t)*Math.PI/180;
    for(const k of [-1,0,1]){
      const base=project(k*2,reach,handY),tip=project(k*2,reach+39*Math.sin(angle),handY-39*Math.cos(angle));
      path([base,tip],'#b57542',1.05);if(t>1.55)ellipse(c,...tip,.9,1,'#ffd16f');
      if(k===0&&t>1.55){c.beginPath();c.moveTo(...tip);c.bezierCurveTo(tip[0]+5,tip[1]-8,tip[0]-6,tip[1]-15,tip[0]+3*Math.sin(t*2),tip[1]-23);c.strokeStyle='#f0e4ceaa';c.lineWidth=.75;c.stroke();}
    }
  }
  c.restore();
}

