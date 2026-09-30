const TRIALS = 20;
const $ = id => document.getElementById(id);
const data = Array.isArray(window.CLASSROOM_PHONE_DATA) ? window.CLASSROOM_PHONE_DATA : [];
const signalData = data.filter(x => x.signal);
const noiseData = data.filter(x => !x.signal);

let trials=[], index=0, stats={}, stimulusTimer=null, ticker=null, trialStart=0;

function shuffle(a){
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function pick(pool,n){
  let out=[], bag=shuffle(pool);
  while(out.length<n){
    if(!bag.length) bag=shuffle(pool);
    out.push({...bag.pop()});
  }
  return out;
}

function difficultyConfig(){
  const v=$("difficulty").value;
  if(v==="easy") return {level:1,target:2.4,label:"简单",blur:0};
  if(v==="hard") return {level:3,target:0.8,label:"困难",blur:0};
  return {level:2,target:1.6,label:"中等",blur:0};
}

function poolForDifficulty(pool){
  const cfg=difficultyConfig();
  let ranked=[...pool].sort((a,b)=>a.difficulty-b.difficulty);
  if(cfg.level===1) return ranked.filter(x=>x.difficulty<=2).concat(ranked.filter(x=>x.difficulty===3));
  if(cfg.level===3) return ranked.filter(x=>x.difficulty>=2).reverse().concat(ranked.filter(x=>x.difficulty===1));
  return shuffle(ranked);
}

function buildTrials(){
  const p=Number($("prior").value);
  const ns=Math.round(TRIALS*p), nn=TRIALS-ns;
  return shuffle([
    ...pick(poolForDifficulty(signalData),ns),
    ...pick(poolForDifficulty(noiseData),nn)
  ]);
}

function normalPdf(x,mu,sd=1){
  return Math.exp(-.5*((x-mu)/sd)**2)/(sd*Math.sqrt(2*Math.PI));
}

function drawDistribution(canvas,dprime,c){
  const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  const L=44,R=18,T=18,B=38,minX=-3.5,maxX=4.5,base=h-B,scale=(h-T-B)/.42;
  const px=x=>L+(x-minX)/(maxX-minX)*(w-L-R);
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle="#a8b5c5";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,base);ctx.lineTo(w-R,base);ctx.stroke();

  function curve(mu,color,label){
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<=400;i++){
      const x=minX+(maxX-minX)*i/400,y=base-normalPdf(x,mu)*scale;
      i?ctx.lineTo(px(x),y):ctx.moveTo(px(x),y);
    }
    ctx.stroke();ctx.fillStyle=color;ctx.font="13px sans-serif";ctx.fillText(label,px(mu)-22,T+14);
  }
  curve(0,"#6d8098","Noise");
  curve(dprime,"#c83a3a","Signal");

  const criterionX=c+dprime/2;
  ctx.strokeStyle="#c69b29";ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();
  ctx.moveTo(px(criterionX),T);ctx.lineTo(px(criterionX),base);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#8c6e1e";ctx.fillText(`c=${c.toFixed(1)}`,Math.min(w-60,px(criterionX)+5),T+18);
  ctx.fillStyle="#6b7b90";ctx.fillText(`d′=${dprime.toFixed(2)}`,L,h-9);
}

function updateConcept(){
  const cfg=difficultyConfig(), c=Number($("criterionDemo").value);
  $("criterionDemoValue").textContent=c.toFixed(1);
  drawDistribution($("distributionCanvas"),cfg.target,c);
}

function startGame(){
  trials=buildTrials();index=0;
  stats={H:0,M:0,FA:0,CR:0,rts:[],fallbacks:0};
  $("startScreen").classList.add("hidden");
  $("resultScreen").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");
  showTrial();
}

function showTrial(){
  clearTimeout(stimulusTimer);clearInterval(ticker);
  if(index>=TRIALS){finishGame();return;}

  const t=trials[index],cfg=difficultyConfig(),ms=Number($("stimulusTime").value);
  $("trialText").textContent=`第 ${index+1} / ${TRIALS} 次`;
  $("progressBar").style.width=`${index/TRIALS*100}%`;
  $("priorText").textContent=`P(S)=${Number($("prior").value).toFixed(2)}`;
  $("difficultyText").textContent=`${cfg.label} · 目标d′≈${cfg.target.toFixed(1)}`;
  $("feedback").textContent="";
  $("mask").classList.add("hidden");
  $("loading").classList.remove("hidden");

  const img=$("stimulusImage");
  img.style.opacity="0";
  img.style.filter=`blur(${cfg.blur}px)`;
  img.onerror=null;

  let fallbackUsed=false;
  img.onload=()=>{
    $("loading").classList.add("hidden");
    img.style.opacity="1";
    beginTiming(ms);
  };
  img.onerror=()=>{
    if(fallbackUsed){
      $("loading").textContent="图片加载失败，正在跳过…";
      setTimeout(()=>{index++;showTrial();},350);
      return;
    }
    fallbackUsed=true;stats.fallbacks++;
    img.src=t.fallback;
  };
  img.src=t.src;
}

function beginTiming(ms){
  trialStart=performance.now();
  let remain=ms;
  $("timerText").textContent=(remain/1000).toFixed(1)+"s";
  clearInterval(ticker);
  ticker=setInterval(()=>{
    remain-=100;
    $("timerText").textContent=Math.max(0,remain/1000).toFixed(1)+"s";
  },100);
  stimulusTimer=setTimeout(()=>{
    clearInterval(ticker);
    $("timerText").textContent="0.0s";
    $("mask").classList.remove("hidden");
  },ms);
}

function answer(choice){
  const t=trials[index];
  if(!trialStart)return;
  clearTimeout(stimulusTimer);clearInterval(ticker);
  stats.rts.push(performance.now()-trialStart);
  trialStart=0;

  if(t.signal&&choice==="signal")stats.H++;
  if(t.signal&&choice==="noise")stats.M++;
  if(!t.signal&&choice==="signal")stats.FA++;
  if(!t.signal&&choice==="noise")stats.CR++;

  const ok=(t.signal&&choice==="signal")||(!t.signal&&choice==="noise");
  $("feedback").textContent=ok?"判断正确":`判断错误：实际为 ${t.signal?"Signal（存在手机使用）":"Noise（未发现手机使用）"}`;
  setTimeout(()=>{index++;showTrial();},500);
}

function invNorm(p){
  const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924];
  const b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857];
  const c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878];
  const d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742],pl=.02425,ph=1-pl;
  let q,r;
  if(p<pl){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p>ph){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  q=p-.5;r=q*q;
  return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
}

function compute(){
  const S=stats.H+stats.M,N=stats.FA+stats.CR;
  const ph=S?stats.H/S:0,pfa=N?stats.FA/N:0;
  const phA=(stats.H+.5)/(S+1),pfaA=(stats.FA+.5)/(N+1);
  const zH=invNorm(phA),zFA=invNorm(pfaA);
  const dp=zH-zFA,c=-.5*(zH+zFA),acc=(stats.H+stats.CR)/TRIALS;
  const rt=stats.rts.length?stats.rts.reduce((a,b)=>a+b,0)/stats.rts.length:0;
  return {ph,pfa,phA,pfaA,dp,c,acc,rt};
}

function interpret(r){
  const sens=r.dp>=2?"较高":r.dp>=1?"中等":"较低";
  let bias="判定标准接近中性。";
  if(r.c>.25)bias="判定标准偏保守：较不容易报告“有手机使用”，漏报倾向更强。";
  if(r.c<-.25)bias="判定标准偏激进：较容易报告“有手机使用”，误报倾向更强。";
  return `实测 d′=${r.dp.toFixed(2)}，辨别敏感性${sens}。${bias}`;
}

function drawROC(pfa,ph){
  const cv=$("rocCanvas"),ctx=cv.getContext("2d"),w=cv.width,h=cv.height,p=48;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle="#9aa8bb";ctx.beginPath();ctx.moveTo(p,h-p);ctx.lineTo(w-p,h-p);ctx.lineTo(w-p,p);ctx.stroke();
  ctx.strokeStyle="#c6cfdb";ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(p,h-p);ctx.lineTo(w-p,p);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#64758c";ctx.font="12px sans-serif";ctx.fillText("P(FA)",w/2-18,h-10);
  ctx.save();ctx.translate(15,h/2+18);ctx.rotate(-Math.PI/2);ctx.fillText("P(H)",0,0);ctx.restore();
  const x=p+pfa*(w-2*p),y=h-p-ph*(h-2*p);
  ctx.fillStyle="#1768bd";ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#17345f";ctx.fillText(`(${pfa.toFixed(2)}, ${ph.toFixed(2)})`,Math.min(x+8,w-115),Math.max(18,y-8));
}

function history(){
  try{return JSON.parse(localStorage.getItem("sdt_classroom_history")||"[]")}catch(e){return[]}
}
function renderHistory(h){
  const body=$("historyBody");body.innerHTML="";
  if(!h.length){body.innerHTML='<tr><td colspan="6">完成一轮后会记录在这里</td></tr>';return;}
  h.forEach((x,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td>${x.p.toFixed(2)}</td><td>${x.diff}</td><td>${x.dp.toFixed(2)}</td><td>${x.c.toFixed(2)}</td><td>${(x.acc*100).toFixed(0)}%</td>`;
    body.appendChild(tr);
  });
}
function saveHistory(r){
  const h=history();
  h.unshift({p:Number($("prior").value),diff:difficultyConfig().label,dp:r.dp,c:r.c,acc:r.acc});
  localStorage.setItem("sdt_classroom_history",JSON.stringify(h.slice(0,8)));
  renderHistory(h.slice(0,8));
}

function finishGame(){
  $("gameScreen").classList.add("hidden");$("resultScreen").classList.remove("hidden");
  const r=compute();
  $("H").textContent=`H = ${stats.H}`;$("M").textContent=`M = ${stats.M}`;
  $("FA").textContent=`FA = ${stats.FA}`;$("CR").textContent=`CR = ${stats.CR}`;
  $("hitRate").textContent=r.ph.toFixed(2);$("faRate").textContent=r.pfa.toFixed(2);
  $("dprime").textContent=r.dp.toFixed(2);$("criterion").textContent=r.c.toFixed(2);
  $("accuracy").textContent=(r.acc*100).toFixed(1)+"%";$("meanRt").textContent=(r.rt/1000).toFixed(2)+"s";
  $("interpretText").textContent=interpret(r);
  $("correctionText").textContent=`Z变换采用0.5校正：P(H)adj=${r.phA.toFixed(3)}，P(FA)adj=${r.pfaA.toFixed(3)}。本轮使用本地fallback ${stats.fallbacks} 次。`;
  drawROC(r.pfa,r.ph);drawDistribution($("resultDistributionCanvas"),r.dp,r.c);saveHistory(r);
}

$("dataCount").textContent=data.length;
$("difficulty").addEventListener("change",updateConcept);
$("criterionDemo").addEventListener("input",updateConcept);
$("startBtn").addEventListener("click",startGame);
$("yesBtn").addEventListener("click",()=>answer("signal"));
$("noBtn").addEventListener("click",()=>answer("noise"));
$("restartBtn").addEventListener("click",()=>{$("resultScreen").classList.add("hidden");$("startScreen").classList.remove("hidden");});
updateConcept();renderHistory(history());
