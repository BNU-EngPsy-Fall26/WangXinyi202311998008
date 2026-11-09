(()=>{
  const file=Attn.qs('#dataFile'), status=Attn.qs('#parseStatus'), results=Attn.qs('#results');let summaryRows=[];
  function parseCSV(text){let rows=[],row=[],field='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(q){if(c==='"'&&n==='"'){field+='"';i++}else if(c==='"')q=false;else field+=c}else{if(c==='"')q=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field);rows.push(row);row=[];field=''}else if(c!=='\r')field+=c}}if(field.length||row.length){row.push(field);rows.push(row)}if(rows.length<2)return[];const h=rows[0].map(x=>x.trim());return rows.slice(1).filter(r=>r.some(x=>x.trim())).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]??''])))}
  function normalize(raw){
    // /api/hw2/data、后台CSV以及本机备份可能有不同的外层结构。
    const candidates=[raw,raw?.records,raw?.data,raw?.data?.records,raw?.data?.rows,raw?.rows,raw?.trials];
    const arr=candidates.find(Array.isArray)||[];
    const out=[];
    for(const r of arr){
      if(!r||typeof r!=='object')continue;
      let trials=r.trials;
      if(typeof trials==='string'){try{trials=JSON.parse(trials)}catch(_){}}
      if(Array.isArray(trials)){
        for(const trial of trials)out.push({...trial,participant:r.participant||trial.participant,experiment:r.experiment||trial.experiment});
      }else{
        // 后台CSV把试次字段写成 trial.cue_condition 等；优先固定列 participant。
        const x={...r};
        for(const [key,val] of Object.entries(r)){
          if(key.startsWith('trial.')){
            const k=key.slice(6);
            if(!Object.hasOwn(x,k))x[k]=val;
            else x['trial_'+k]=val;
          }
        }
        out.push(x);
      }
    }
    return out.map(r=>{
      const x={...r};
      ['correct','rt_ms','true_pct','response_pct','absolute_error_pct','trial_index'].forEach(k=>{
        if(k in x&&x[k]!==''&&x[k]!=null)x[k]=Number(x[k]);
      });
      x.participant=String(x.participant||x.participant_id||x.subject||'').trim();
      x.experiment=String(x.experiment||'').trim().toLowerCase();
      return x;
    }).filter(r=>r.participant&&r.experiment&&!r.experiment.startsWith('test_'));
  }
  function mean(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:NaN}function sd(a){if(a.length<2)return NaN;const m=mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1))}
  function gammaln(z){const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,.1208650973866179e-2,-.5395239384953e-5];let x=z,y=z,tmp=x+5.5;tmp-=(x+.5)*Math.log(tmp);let ser=1.000000000190015;for(let j=0;j<6;j++)ser+=c[j]/++y;return -tmp+Math.log(2.5066282746310005*ser/x)}
  function betacf(a,b,x){const MAXIT=100,EPS=3e-7,FPMIN=1e-30;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<FPMIN)d=FPMIN;d=1/d;let h=d;for(let m=1;m<=MAXIT;m++){let m2=2*m,aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<EPS)break}return h}
  function betai(a,b,x){if(x<0||x>1)return NaN;if(x===0||x===1)return x;const bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b}
  function tP2(t,df){if(!Number.isFinite(t)||df<1)return NaN;const x=df/(df+t*t);return betai(df/2,.5,x)}
  function paired(a,b){const d=[];for(let i=0;i<Math.min(a.length,b.length);i++)if(Number.isFinite(a[i])&&Number.isFinite(b[i]))d.push(a[i]-b[i]);const n=d.length,m=mean(d),s=sd(d),t=n>1&&s>0?m/(s/Math.sqrt(n)):NaN;return{n,meanDiff:m,sdDiff:s,t,df:n-1,p:tP2(Math.abs(t),n-1),dz:s>0?m/s:NaN}}
  function fmt(x,d=2){return Number.isFinite(x)?x.toFixed(d):'—'}
  function participantSummaries(rows){const ps=[...new Set(rows.map(r=>r.participant))].sort();return ps.map(p=>{const pr=rows.filter(r=>r.participant===p), f=pr.filter(r=>r.experiment.includes('flanker')&&r.phase!=='practice'), g=pr.filter(r=>r.experiment.includes('graphical')&&r.phase!=='practice');const fv=f.filter(r=>r.correct===1&&r.rt_ms>=150&&r.rt_ms<=3000);const fm=(cue,cong)=>mean(fv.filter(r=>r.cue_condition===cue&&r.congruency===cong).map(r=>r.rt_ms));const sC=fm('standard','congruent'),sI=fm('standard','incongruent'),hC=fm('highlight','congruent'),hI=fm('highlight','incongruent');const ge=(cond)=>mean(g.filter(r=>r.guide_condition===cond).map(r=>Number.isFinite(r.absolute_error_pct)?r.absolute_error_pct:Math.abs(r.response_pct-r.true_pct)));return{participant:p,flanker_n:f.length,flanker_standard_effect:sI-sC,flanker_highlight_effect:hI-hC,flanker_improvement:(sI-sC)-(hI-hC),graphical_n:g.length,error_no_guides:ge('none'),error_guides:ge('quartile'),error_improvement:ge('none')-ge('quartile')}})}
  function drawBars(canvas,labels,values,yLabel){const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);const vals=values.filter(Number.isFinite),max=Math.max(...vals,1)*1.2,left=55,bottom=45,top=20,right=20,plotW=W-left-right,plotH=H-top-bottom;ctx.strokeStyle='#94a3b8';ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,H-bottom);ctx.lineTo(W-right,H-bottom);ctx.stroke();ctx.fillStyle='#64748b';ctx.font='12px sans-serif';ctx.textAlign='right';for(let i=0;i<=4;i++){const y=H-bottom-plotH*i/4,v=max*i/4;ctx.fillText(v.toFixed(0),left-8,y+4);ctx.strokeStyle='#e2e8f0';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(W-right,y);ctx.stroke()}ctx.save();ctx.translate(14,top+plotH/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText(yLabel,0,0);ctx.restore();const gap=plotW/labels.length,bw=Math.min(80,gap*.55);labels.forEach((lab,i)=>{const v=values[i],x=left+gap*(i+.5)-bw/2,h=Number.isFinite(v)?plotH*v/max:0,y=H-bottom-h;ctx.fillStyle=i%2===0?'#123466':'#2568c6';ctx.fillRect(x,y,bw,h);ctx.fillStyle='#1f2937';ctx.textAlign='center';ctx.fillText(lab,left+gap*(i+.5),H-bottom+18);ctx.fillText(Number.isFinite(v)?v.toFixed(1):'—',left+gap*(i+.5),Math.max(top+12,y-7))})}
  function render(rows){const s=participantSummaries(rows);summaryRows=s;const f=s.filter(x=>Number.isFinite(x.flanker_standard_effect)&&Number.isFinite(x.flanker_highlight_effect)),g=s.filter(x=>Number.isFinite(x.error_no_guides)&&Number.isFinite(x.error_guides));const pAll=[...new Set(rows.map(r=>r.participant))];Attn.qs('#sampleKpis').innerHTML=`<div class="kpi"><div class="value">${pAll.length}</div><div class="label">总参与者</div></div><div class="kpi"><div class="value">${f.length}</div><div class="label">Flanker 可分析</div></div><div class="kpi"><div class="value">${g.length}</div><div class="label">比例判断可分析</div></div><div class="kpi"><div class="value">${rows.length}</div><div class="label">导入 trial</div></div>`;const sw=Attn.qs('#sampleWarning');if(Math.min(f.length,g.length)<5){sw.style.display='block';sw.innerHTML='<strong>样本仍不足：</strong>至少一个实验的可分析参与者少于 5 人，暂不满足作业最低收数要求。'}else sw.style.display='none';
    const incomplete=s.filter(x=>(x.flanker_n>0&&x.flanker_n!==48)||(x.graphical_n>0&&x.graphical_n!==24));
    if(incomplete.length){sw.style.display='block';sw.innerHTML+=(sw.innerHTML?'<br>':'')+`<strong>试次核验：</strong>${incomplete.length}名参与者的试次数不是预期的 Flanker 48 / 比例判断 24。请核查后台CSV是否缺失、重复或有字段截断。`;}
    const fs=mean(f.map(x=>x.flanker_standard_effect)),fh=mean(f.map(x=>x.flanker_highlight_effect)),fp=paired(f.map(x=>x.flanker_standard_effect),f.map(x=>x.flanker_highlight_effect));drawBars(Attn.qs('#flankerChart'),['同色','目标突出'],[fs,fh],'Flanker 效应 (ms)');Attn.qs('#flankerStats').innerHTML=`<p><strong>参与者层级 Flanker 效应：</strong>同色 ${fmt(fs,1)} ms；目标突出 ${fmt(fh,1)} ms；平均削弱量 ${fmt(fp.meanDiff,1)} ms。</p><p class="small">配对 t(${fp.df}) = ${fmt(fp.t,2)}, p = ${fmt(fp.p,3)}, Cohen's dz = ${fmt(fp.dz,2)}。</p>`;
    const gn=mean(g.map(x=>x.error_no_guides)),gg=mean(g.map(x=>x.error_guides)),gp=paired(g.map(x=>x.error_no_guides),g.map(x=>x.error_guides));drawBars(Attn.qs('#graphChart'),['无刻度','参考刻度'],[gn,gg],'平均绝对误差 (%)');Attn.qs('#graphStats').innerHTML=`<p><strong>比例判断误差：</strong>无刻度 ${fmt(gn,2)}%；参考刻度 ${fmt(gg,2)}%；平均误差降低 ${fmt(gp.meanDiff,2)} 个百分点。</p><p class="small">配对 t(${gp.df}) = ${fmt(gp.t,2)}, p = ${fmt(gp.p,3)}, Cohen's dz = ${fmt(gp.dz,2)}。</p>`;
    const table=Attn.qs('#participantTable'),cols=['participant','flanker_standard_effect','flanker_highlight_effect','flanker_improvement','error_no_guides','error_guides','error_improvement'];table.innerHTML='<thead><tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr></thead><tbody>'+s.map(r=>'<tr>'+cols.map(c=>`<td>${c==='participant'?r[c]:fmt(r[c],2)}</td>`).join('')+'</tr>').join('')+'</tbody>';
    Attn.qs('#readmeSnippet').textContent=`### 实验1：Flanker（请自行解释）\n可分析参与者 n = ${f.length}。同色条件平均 Flanker 效应为 ${fmt(fs,1)} ms，目标颜色突出条件为 ${fmt(fh,1)} ms，两者平均差为 ${fmt(fp.meanDiff,1)} ms。配对 t(${fp.df}) = ${fmt(fp.t,2)}, p = ${fmt(fp.p,3)}, dz = ${fmt(fp.dz,2)}。\n\n### 实验2：比例判断（请自行解释）\n可分析参与者 n = ${g.length}。无参考刻度时平均绝对误差为 ${fmt(gn,2)}%，加入 25%/50%/75% 刻度后为 ${fmt(gg,2)}%，平均降低 ${fmt(gp.meanDiff,2)} 个百分点。配对 t(${gp.df}) = ${fmt(gp.t,2)}, p = ${fmt(gp.p,3)}, dz = ${fmt(gp.dz,2)}。\n\n【注意】以上仅为数字汇总。是否支持预测、为何出现该结果、与原文如何比较、局限是什么，需要你基于真实数据独立完成。`;
    results.style.display='block';status.className='status ok';status.textContent=`已识别 ${rows.length} 条 trial，${pAll.length} 名参与者。`}
  async function handleFile(f){try{const text=await f.text();let raw;if(f.name.toLowerCase().endsWith('.json'))raw=JSON.parse(text);else raw=parseCSV(text);const rows=normalize(raw);if(!rows.length)throw new Error('没有识别到 participant + experiment 的 trial 数据。');render(rows)}catch(e){status.className='status err';status.textContent='解析失败：'+e.message}}
  const backendBtn=Attn.qs('#loadBackend');
  if(backendBtn)backendBtn.onclick=async()=>{
    const code=Attn.getProjectCode();
    if(!code){status.className='status err';status.textContent='请先在 js/config.js 配置6位项目码，或回首页填写。';return}
    backendBtn.disabled=true;status.className='status';status.textContent='正在从课程后台读取匿名数据……';
    try{
      const url=(window.ATTN_CONFIG?.DATA_ENDPOINT||'https://attention-lab-production.up.railway.app/api/hw2/data')+'?project='+encodeURIComponent(code);
      const response=await fetch(url);
      const payload=await response.json();
      if(!response.ok||payload?.ok===false)throw new Error(payload?.msg||payload?.message||'HTTP '+response.status);
      const rows=normalize(payload);
      if(!rows.length)throw new Error('后台暂无可识别的正式试次，或返回结构与当前页面不一致。请使用后台CSV导入。');
      render(rows);
    }catch(error){status.className='status err';status.textContent='后台读取失败：'+error.message+'。可在 /hw2 下载 CSV/JSON 后手工导入。';}
    finally{backendBtn.disabled=false}
  };
  file.onchange=()=>file.files[0]&&handleFile(file.files[0]);Attn.qs('#loadLocal').onclick=()=>{const rows=normalize(Attn.loadTrials());if(!rows.length){status.className='status err';status.textContent='本机暂无数据。';return}render(rows)};Attn.qs('#clearLocal').onclick=()=>{if(confirm('确定清空当前浏览器保存的实验 trial？请先下载备份。')){Attn.clearLocalTrials();status.className='status ok';status.textContent='本机实验数据已清空。';results.style.display='none'}};Attn.qs('#exportSummary').onclick=()=>Attn.downloadText('participant_level_summary.csv',Attn.toCSV(summaryRows),'text/csv;charset=utf-8');
})();
