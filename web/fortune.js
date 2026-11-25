const lotDialog=document.getElementById('lotDialog'),shakeLot=document.getElementById('shakeLot');
let lotBusy=false,latestLot=null;
const lotNode=id=>document.getElementById(id);
for(let i=0;i<9;i++){
  const stick=document.createElement('i');
  stick.style.setProperty('--angle',((i-4)*5)+'deg');
  stick.style.setProperty('--height',(62+(i*13)%21)+'px');
  lotDialog.querySelector('.slips').append(stick);
}
function presentLot(){
  lotNode('lotPaper').hidden=!latestLot;
  lotNode('lotPrompt').hidden=!!latestLot;
  if(latestLot){
    lotNode('lotNumber').textContent='云栖签 · 第 '+latestLot.number+' 签';
    lotNode('lotTitle').textContent=latestLot.title;
    lotNode('lotPoem').textContent=latestLot.poem.replace('，','，\n');
    lotNode('lotReading').textContent=latestLot.reading;
  }
  shakeLot.textContent=latestLot?'再摇一签':'摇签';
  if(localPlayer()?.action)shakeLot.textContent='收礼摇签';
}
lotNode('openLot').onclick=()=>{
  if(!lotBusy)presentLot();
  lotDialog.showModal();
};
lotNode('closeLot').onclick=()=>lotDialog.close();
shakeLot.onclick=async()=>{
  if(lotBusy||!token)return;
  lotBusy=true;shakeLot.disabled=true;lotDialog.classList.add('shaking');
  if(!soundChosen)setSound(true).then(()=>{if(lotBusy)bambooRattle();});else bambooRattle();
  lotNode('lotPaper').hidden=true;lotNode('lotPrompt').hidden=false;lotNode('lotPrompt').textContent='竹签轻响……';
  try{
    const [answer]=await Promise.all([act('lot'),new Promise(r=>setTimeout(r,reduced?250:1700))]);
    if(!answer?.lot)throw Error();
    latestLot=answer.lot;presentLot();
  }catch{
    lotNode('lotPrompt').textContent='这支签还没有摇出，请再试一次。';shakeLot.textContent='重新摇签';
  }finally{lotBusy=false;shakeLot.disabled=false;lotDialog.classList.remove('shaking');}
};

