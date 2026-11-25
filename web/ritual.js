/* Close-up choreography, also used if video decoding is unavailable. */
function censer(c){
  const pat=(d,fill,edge,w)=>paintPath(c,d,fill,edge,w);
  const bronze=grad(c,50,0,100,0,[[0,'#50382b'],[.18,'#b9884b'],[.36,'#edd397'],[.51,'#a1743f'],[.79,'#624737'],[1,'#cba467']]);
  for(const x of [60,88]){pat('M'+x+' -15 q3 4 1 9 l-3 4 q3 2 7 0 l1 -5 2 -8Z',bronze,'#513b29',1);}
  for(const k of [-1,1]){c.save();c.translate(75,0);c.scale(k,1);pat('M18 -30 Q39 -30 35 -48 Q33 -57 26 -51 Q24 -48 29 -46 Q32 -49 32 -43 Q30 -35 19 -36',null,'#6c4b2f',4);pat('M19 -31 Q37 -33 34 -47 Q32 -53 28 -50',null,'#e7c68b',1.2);c.restore();}
  pat('M53 -45 Q50 -38 46 -31 Q42 -11 74 -8 Q104 -10 104 -27 Q105 -34 97 -42 L97 -46Z',bronze,'#60492f',1);
  ellipse(c,75,-46,24,4.5,'#d9b376');ellipse(c,75,-46.3,21.5,2.9,'#77604f');
  pat('M48 -32 Q76 -25 102 -32 M47 -29 Q75 -22 103 -29',null,'#f0c985',.8);
  for(const x of [55,65,75,85,95])petalMark(c,x,-17,.55);
  for(let x=55;x<96;x+=4)ellipse(c,x,-37+Math.cos((x-75)/17)*2,.8,.8,'#e4c28a');
}
function lamp(c,t){
  const x=100;ellipse(c,x,-2,10,2.2,'#7f5b3e');strand(c,[[x,-4],[x,-52]],'#bd955b',2.6);
  ellipse(c,x,-53,9,2.6,'#d4ac69');c.fillStyle=grad(c,x-3,0,x+3,0,[[0,'#a34a37'],[.5,'#f19863'],[1,'#a34c38']]);c.fillRect(x-3,-83,6,30);
  ellipse(c,x,-83,3,.9,'#ffbe79');strand(c,[[x,-83],[x,-86]],'#513726',.9);
  const v=Math.sin(t*9)*.8;
  paintPath(c,'M100 -85 Q95 -88 101 -96 Q101 -93 '+(102+v)+' -90 Q104 -86 100 -85Z','#ffdf8d');
}
const titles={
  incense:[[0,'拈香'],[1.45,'点香'],[2.65,'举香'],[4.38,'奉香入炉'],[6.12,'合十']],
  bow:[[0,'合十'],[1.65,'屈膝'],[3.20,'俯身礼佛'],[5.01,'起身'],[6.45,'合十还礼']]
};
function ritualTitle(kind,t){return titles[kind].filter(([start])=>t>=start).at(-1)[1];}
function closeup(c,background,kind,t){
  const w=c.canvas.width,h=c.canvas.height;c.save();c.setTransform(w/1280,0,0,h/720,0,0);
  c.fillStyle='#49301f';c.fillRect(0,0,1280,720);
  if(background.complete&&background.naturalWidth){
    c.save();c.filter='blur(6px)';const z=1.15+.045*smooth(0,7.4,t);
    c.drawImage(background,640-640*z-24,310-450*z,1280*z,850*z);c.restore();
  }
  c.fillStyle=grad(c,0,0,0,720,[[0,'#38201632'],[.68,'#39251f36'],[1,'#251b17a8']]);c.fillRect(0,0,1280,720);
  for(let i=0;i<18;i++){const x=(i*117+t*(4+i%3))%1280,y=(i*73+510-t*(2+i%4))%720;ellipse(c,x,y,1+i%3,1+i%3,'#ffe5af55');}
  c.translate(550,645);const z=3.1+.09*smooth(0,3,t);c.scale(z,z);
  const heading=.34,forwardX=d=>Math.sin(heading)*d,groundY=d=>-.40*Math.cos(heading)*d;
  ellipse(c,0,1,31,4,'#36271f55');
  if(kind==='bow'){
    ellipse(c,8,-8,43,18,'#673e2c');ellipse(c,8,-11,43,17,'#ac7952');ellipse(c,8,-12,38,15,'#d3a46c');ellipse(c,8,-12,35,13,'#c59360');
  }else{
    c.save();c.translate(forwardX(100)-100,groundY(100));lamp(c,t);c.restore();
    c.save();c.translate(forwardX(75)-75,groundY(75));if(t>=5.63)sticks(c,75,-47,0,true,t);censer(c);c.restore();
  }
  figure(c,{action:kind,t,heading});
  c.restore();
}
