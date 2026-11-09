(function(){
  const K = {participant:'attn_participant', project:'attn_project_code', trials:'attn_trials_v1', consent:'attn_consent'};
  const cfg = window.ATTN_CONFIG || {};
  function qs(s){return document.querySelector(s)}
  function qsa(s){return [...document.querySelectorAll(s)]}
  function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
  function mean(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:NaN}
  function uid(){return 'S'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
  function getParticipant(){return localStorage.getItem(K.participant)||''}
  function setParticipant(v){localStorage.setItem(K.participant,String(v).trim())}
  function getProjectCode(){
    const embedded=String(cfg.PROJECT_CODE||'').trim().toUpperCase();
    // 仓库中填写的公开项目码优先；防止某位被试本地曾保存另一个项目码。
    if(/^[A-Z0-9]{6}$/.test(embedded))return embedded;
    const local=String(localStorage.getItem(K.project)||'').trim().toUpperCase();
    return /^[A-Z0-9]{6}$/.test(local)?local:'';
  }
  function setProjectCode(v){localStorage.setItem(K.project,String(v).trim().toUpperCase())}
  function setConsent(v){localStorage.setItem(K.consent,v?'1':'0')}
  function getConsent(){return localStorage.getItem(K.consent)==='1'}
  function loadTrials(){try{return JSON.parse(localStorage.getItem(K.trials)||'[]')}catch(e){return []}}
  function saveTrials(rows){const all=loadTrials();all.push(...rows);localStorage.setItem(K.trials,JSON.stringify(all));return all.length}
  function experimentTrials(name){return loadTrials().filter(x=>x.experiment===name)}
  function clearLocalTrials(){localStorage.removeItem(K.trials)}
  function csvEscape(v){if(v==null)return '';const s=typeof v==='object'?JSON.stringify(v):String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  function toCSV(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];return [keys.join(','),...rows.map(r=>keys.map(k=>csvEscape(r[k])).join(','))].join('\n')}
  function downloadText(filename,text,type='text/plain'){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},300)}
  function downloadRows(rows,base){downloadText(base+'.csv',toCSV(rows),'text/csv;charset=utf-8');downloadText(base+'.json',JSON.stringify(rows,null,2),'application/json')}
  function experimentName(base){return (cfg.TEST_MODE?'test_':'')+base}
  function warningsText(w){
    if(!w)return '';
    const entries=Array.isArray(w)?w:[w];
    return entries.map(x=>typeof x==='string'?x:JSON.stringify(x)).join('；');
  }
  async function submitExperiment(experiment, rows){
    const project=getProjectCode(), participant=getParticipant();
    if(!/^[A-Z0-9]{6}$/.test(project)) return {ok:false,message:'未配置合法的6位项目码。数据已保存在本机，请先填写 js/config.js 的 PROJECT_CODE。'};
    if(!Array.isArray(rows)||rows.length===0||rows.length>2000) return {ok:false,message:'试次数不符合提交要求（需要 1–2000 次）。本机数据已保留。'};
    if(rows.some(x=>!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length>40)) return {ok:false,message:'某个试次超过40个字段或格式错误；本机数据已保留。'};
    if(!/^[a-z0-9_]+$/.test(experiment)) return {ok:false,message:'实验名称只能使用小写字母、数字和下划线。'};
    const payload={project,experiment,participant,condition:'within_subject_mixed',trials:rows};
    const serialized=JSON.stringify(payload);
    if(new Blob([serialized]).size>256*1024) return {ok:false,message:'数据超过单次256KB限制，请缩短字段；本机数据已保留。'};
    try{
      const res=await fetch(cfg.SUBMIT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:serialized});
      const raw=await res.text();let result={};
      try{result=JSON.parse(raw)}catch(_){result={msg:raw.slice(0,240)}}
      if(!res.ok||result.ok!==true){
        const why=result.msg||result.message||('HTTP '+res.status);
        throw new Error(String(why));
      }
      // 课程后端可能以 warnings 提醒字段被截断/转换：保存成功不等于无损保存。
      const warn=[warningsText(result.warnings),warningsText(result.warning_details)].filter(Boolean).join('；');
      const id=result.record_id!=null?`，记录编号 ${result.record_id}`:'';
      const note=warn?`【请检查后台CSV】上传警告：${warn}`:'无上传警告；请仍在后台下载CSV核对。';
      return {ok:true,warnings:result.warnings||null,record_id:result.record_id,message:`课程后台确认已收到 ${rows.length} 条试次${id}。${note}`};
    }catch(e){return {ok:false,message:'课程后台未确认上传，本机备份已保留：'+e.message+'。请下载备份并联系实验管理员。'}}
  }
  function requireSetup(){
    if(!getParticipant()){alert('请先回到首页填写匿名参与者编号。');location.href='index.html';return false}
    if(!getConsent()){alert('请先在首页勾选知情同意。');location.href='index.html';return false}
    return true;
  }
  window.Attn={K,qs,qsa,shuffle,mean,uid,getParticipant,setParticipant,getProjectCode,setProjectCode,setConsent,getConsent,loadTrials,saveTrials,experimentTrials,clearLocalTrials,toCSV,downloadText,downloadRows,experimentName,submitExperiment,requireSetup};
})();
