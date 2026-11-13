let A,P,I,filtered=[],shown=100;
const $=id=>document.getElementById(id);
const fmt=(v,d=1)=>Number(v).toLocaleString(undefined,{maximumFractionDigits:d});
const label=s=>String(s).replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase()).replace('Ai ','AI ').replace('Hdi ','HDI ').replace('Ias ','IAS ').replace('Gci ','GCI ');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=(row,key)=>row[I[key]];
const display=x=>typeof x==='number'?fmt(x,2):String(x??'');
function table(head,rows){return '<table><thead><tr>'+head.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'}
function options(id,items,selected){$(id).innerHTML=items.map(([value,text])=>`<option value="${esc(value)}">${esc(text)}</option>`).join('');if(selected)$(id).value=selected}
function bars(id,items,mean=false,limit=12){const subset=items.slice(0,limit),max=Math.max(...subset.map(x=>mean?x.value:x.n),1);$(id).innerHTML=subset.map(x=>`<div class="barrow" title="${esc(x.label)}"><span class="barlabel">${esc(x.label)}</span><div class="track"><div class="fill" style="width:${Math.max(1,100*(mean?x.value:x.n)/max)}%"></div></div><b>${mean?fmt(x.value,2):fmt(x.n,0)}${mean?`<small> n=${fmt(x.n,0)}</small>`:''}</b></div>`).join('')}
function histogram(id,foot,key,lo,hi,step){const bins=Array(Math.ceil((hi-lo)/step)).fill(0);P.rows.forEach(r=>{let j=Math.floor((+val(r,key)-lo)/step);if(j>=0&&j<bins.length)bins[j]++});const w=620,h=230,p=33,bw=(w-2*p)/bins.length,top=Math.max(...bins);let svg=`<line x1="${p}" x2="${w-p}" y1="${h-p}" y2="${h-p}" stroke="#bac8c7"/>`;bins.forEach((n,i)=>{let bh=(h-2*p)*n/top;svg+=`<rect x="${p+i*bw+1}" y="${h-p-bh}" width="${Math.max(1,bw-2)}" height="${bh}" fill="#999"><title>${fmt(lo+i*step,1)}–${fmt(lo+(i+1)*step,1)}: ${n} profiles</title></rect>`});for(let i=0;i<=5;i++){let x=p+i*(w-2*p)/5;svg+=`<text x="${x}" y="${h-8}" text-anchor="middle" fill="#66777e" font-size="11">${fmt(lo+i*(hi-lo)/5,0)}</text>`}$(id).innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Histogram of ${label(key)}">${svg}</svg>`;let s=A.summary[key];$(foot).textContent=`Mean ${fmt(s.mean,2)} · median ${fmt(s.median,2)} · middle 50%: ${fmt(s.p25,1)}–${fmt(s.p75,1)}`}
const rOf=(a,b)=>A.correlations.find(c=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a))?.r;
function scatter(){let xkey=$('xMetric').value,ykey=$('yMetric').value,age=$('scatterFilter').value,rows=age==='all'?P.rows:P.rows.filter(r=>val(r,'Age_Group')===age);const x=rows.map(r=>+val(r,xkey)),y=rows.map(r=>+val(r,ykey));let xmin=Math.min(...x),xmax=Math.max(...x),ymin=Math.min(...y),ymax=Math.max(...y);if(xmin===xmax)xmax++;if(ymin===ymax)ymax++;let cvs=$('scatter'),scale=window.devicePixelRatio||1,w=cvs.clientWidth,h=330;cvs.width=w*scale;cvs.height=h*scale;let ctx=cvs.getContext('2d');ctx.scale(scale,scale);ctx.clearRect(0,0,w,h);const left=48,right=15,top=13,bottom=36,px=n=>left+(n-xmin)*(w-left-right)/(xmax-xmin),py=n=>h-bottom-(n-ymin)*(h-top-bottom)/(ymax-ymin);ctx.strokeStyle='#c3d0ce';ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,h-bottom);ctx.lineTo(w-right,h-bottom);ctx.stroke();ctx.fillStyle='#687981';ctx.font='11px system-ui';for(let i=0;i<=4;i++){let t=i/4;ctx.fillText(fmt(xmin+t*(xmax-xmin),1),px(xmin+t*(xmax-xmin))-10,h-12);ctx.fillText(fmt(ymin+t*(ymax-ymin),1),3,py(ymin+t*(ymax-ymin))+4)}ctx.fillStyle='rgba(0,0,0,.15)';for(let i=0;i<rows.length;i++){ctx.beginPath();ctx.arc(px(x[i]),py(y[i]),2.1,0,2*Math.PI);ctx.fill()}let mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length,cov=0,xx=0,yy=0;for(let i=0;i<rows.length;i++){cov+=(x[i]-mx)*(y[i]-my);xx+=(x[i]-mx)**2;yy+=(y[i]-my)**2}let slope=xx?cov/xx:0,r=xx&&yy?cov/Math.sqrt(xx*yy):0;ctx.beginPath();ctx.moveTo(px(xmin),py(my+slope*(xmin-mx)));ctx.lineTo(px(xmax),py(my+slope*(xmax-mx)));ctx.strokeStyle='#333';ctx.lineWidth=2;ctx.stroke();$('scatterStat').textContent=`Pearson r = ${fmt(r,3)} · ${fmt(rows.length,0)} modeled profiles · line shows an ordinary least-squares fit. This relationship may reflect construction rules.`}
function heatmap(){let keys=['Daily_Screen_Hours','Daily_Pickups','Avg_Session_Duration_Minutes','Digital_Wellbeing_Index','Night_Use_Pct_Modelled','School_Screen_Use_Minutes','AI_Assisted_School_Use_Minutes','Sleep_Score_Modelled'],short=['Screen h','Pickups','Session','Wellbeing','Night use','School','AI school','Sleep'];let html='<table class="heat"><thead><tr><th></th>'+short.map(s=>`<th>${s}</th>`).join('')+'</tr></thead><tbody>';keys.forEach((a,i)=>{html+=`<tr><th>${short[i]}</th>`;keys.forEach((b,j)=>{let r=i===j?1:rOf(a,b),color=r>=0?'110,110,110':'150,150,150';html+=`<td data-x="${a}" data-y="${b}" style="background:rgba(${color},${(Math.abs(r)*.25+.04).toFixed(2)});cursor:pointer" title="${label(a)} vs ${label(b)}: r=${fmt(r,3)}">${i===j?'1.00':fmt(r,2)}</td>`});html+='</tr>'});$('heatmap').innerHTML=html+'</tbody></table>';$('heatmap').querySelectorAll('td').forEach(c=>c.onclick=()=>{$('xMetric').value=c.dataset.x;$('yMetric').value=c.dataset.y;scatter()})}
function groups(){let key=$('groupSelect').value,metric=$('groupMetric').value,rows=A.groupStats[key].map(x=>({...x,value:x[metric]}));$('groupTitle').textContent=label(key)+' · '+label(metric);$('groupContext').textContent=`${rows.length} categories; means of modeled values.`;$('groupTable').innerHTML=table(['Group','Profiles','Share','Mean '+label(metric)],rows.map(x=>[x.label,fmt(x.n,0),fmt(x.pct,1)+'%',fmt(x.value,2)]))}
function cross(){let c=A.crosses[$('crossSelect').value];let html='<table class="heat"><thead><tr><th></th>'+c.columns.map(x=>`<th>${esc(x)}</th>`).join('')+'<th>Total</th></tr></thead><tbody>';c.rows.forEach((r,i)=>{let total=c.cells[i].reduce((a,b)=>a+b,0);html+=`<tr><th>${esc(r)}</th>`+c.cells[i].map(n=>`<td style="background:rgba(110,110,110,${(n/Math.max(total,1)*.45+.02).toFixed(2)})">${fmt(n,0)}<small>${fmt(100*n/Math.max(total,1),1)}%</small></td>`).join('')+`<td><b>${fmt(total,0)}</b></td></tr>`});$('crossTable').innerHTML=html+'</tbody></table>'}
const preview=['_ID','Age_Group','Country','Primary_Platform','Daily_Screen_Hours','Daily_Pickups','School_Screen_Use_Minutes','AI_Assisted_School_Use_Minutes','Sleep_Score_Modelled'];
function profiles(){let q=$('profileSearch').value.trim().toLowerCase(),age=$('ageFilter').value,platform=$('platformFilter').value,continent=$('continentFilter').value;filtered=P.rows.filter(r=>(!age||val(r,'Age_Group')===age)&&(!platform||val(r,'Primary_Platform')===platform)&&(!continent||val(r,'Continent')===continent)&&(!q||r.some(x=>String(x??'').toLowerCase().includes(q))));let page=filtered.slice(0,shown);$('profileCount').textContent=`Showing ${fmt(page.length,0)} of ${fmt(filtered.length,0)} matching modeled profiles`;$('profileTable').innerHTML='<thead><tr><th>Open</th>'+preview.map(k=>`<th>${label(k)}</th>`).join('')+'</tr></thead><tbody>'+page.map((r,i)=>`<tr><td><button data-index="${i}" aria-label="Open ${esc(val(r,'_ID'))}">View</button></td>${preview.map(k=>`<td>${esc(display(val(r,k)))}</td>`).join('')}</tr>`).join('')+'</tbody>';$('profileTable').querySelectorAll('button').forEach(b=>b.onclick=()=>detail(filtered[+b.dataset.index]));$('loadMore').hidden=shown>=filtered.length}
function detail(r){$('profileDetail').hidden=false;$('profileDetail').innerHTML=`<h3>${esc(val(r,'_ID'))} · Modeled profile</h3><p class="foot">All 53 fields from the supplied workbook, with an explicit provenance marker.</p><dl>${A.fields.map(k=>`<div><dt>${esc(label(k))}</dt><dd>${esc(display(val(r,k)))}</dd></div>`).join('')}</dl>`;$('profileDetail').scrollIntoView({behavior:'smooth',block:'start'})}
function init(){
 I=Object.fromEntries(P.fields.map((k,i)=>[k,i]));
 $('continentTable').innerHTML=table(['Continent','Source count'],A.source.continents.map(x=>[x.continent,fmt(x.respondents,0)]));
 [['ageFilter','Age_Group'],['platformFilter','Primary_Platform'],['continentFilter','Continent']].forEach(([id,key])=>options(id,[['','All'],...A.categories[key].map(x=>[x.label,x.label])]));
 ['ageFilter','platformFilter','continentFilter','profileSearch'].forEach(id=>$(id).addEventListener(id==='profileSearch'?'input':'change',()=>{shown=100;profiles()}));
 $('clearFilters').onclick=()=>{for(let id of ['ageFilter','platformFilter','continentFilter','profileSearch'])$(id).value='';shown=100;profiles()};
 $('loadMore').onclick=()=>{shown+=100;profiles()};profiles();
 $('summaryTable').innerHTML=table(['Metric','Count','Mean','P25','Median','P75','Min','Max'],A.allMetrics.map(k=>{let x=A.summary[k];return[label(k),fmt(x.n,0),x.mean,x.p25,x.median,x.p75,x.min,x.max]}));
 histogram('hoursChart','hoursFoot','Daily_Screen_Hours',3,12,.5);
 histogram('pickupsChart','pickupsFoot','Daily_Pickups',5,40,2);
 histogram('schoolChart','schoolFoot','School_Screen_Use_Minutes',35,235,10);
 histogram('sleepChart','sleepFoot','Sleep_Score_Modelled',35,95,3);
 $('platformTable').innerHTML=table(['Platform','Profiles','Share'],A.categories.Primary_Platform.map(x=>[x.label,fmt(x.n,0),fmt(x.pct,2)+'%']));
 $('timeTable').innerHTML=table(['Peak time','Profiles','Share'],A.categories.Peak_Usage_Time.map(x=>[x.label,fmt(x.n,0),fmt(x.pct,2)+'%']));
 options('xMetric',A.allMetrics.map(k=>[k,label(k)]),'Daily_Screen_Hours');
 options('yMetric',A.allMetrics.map(k=>[k,label(k)]),'Sleep_Score_Modelled');
 options('scatterFilter',[['all','All ages'],...A.categories.Age_Group.map(x=>[x.label,x.label])]);
 ['xMetric','yMetric','scatterFilter'].forEach(id=>$(id).onchange=scatter);
 window.addEventListener('resize',scatter);scatter();heatmap();
 let excluded=new Set(['Daily_Screen_Hours|Daily_Screen_Minutes','Sleep_Score_Modelled|Sleep_Duration_Hours_Modelled']);
 let pairs=A.correlations.filter(x=>!excluded.has(x.a+'|'+x.b)&&!excluded.has(x.b+'|'+x.a)).slice(0,30);
 $('correlationTable').innerHTML=table(['Measure A','Measure B','Pearson r'],pairs.map(x=>[label(x.a),label(x.b),fmt(x.r,3)]));
 $('findingsTable').innerHTML=table(['Connection','Profile result','Interpretation'],[
 ['Screen time and modeled sleep',`r = ${fmt(rOf('Daily_Screen_Hours','Sleep_Score_Modelled'),3)}`,'Sleep score uses screen time in its formula.'],
 ['School use and AI-assisted use',`r = ${fmt(rOf('School_Screen_Use_Minutes','AI_Assisted_School_Use_Minutes'),3)}`,'AI minutes are modeled partly as a share of school use.'],
 ['Pickups and session duration',`${fmt(A.checks.negativeMinutesDifference,0)} rows exceed daily minutes`,'Pickup count × session duration can exceed the daily screen total.']]);
 options('groupSelect',A.groups.map(k=>[k,label(k)]),'Primary_Platform');
 options('groupMetric',A.coreMetrics.map(k=>[k,label(k)]),'Daily_Screen_Hours');
 $('groupSelect').onchange=groups;$('groupMetric').onchange=groups;groups();
 options('crossSelect',Object.keys(A.crosses).map(k=>[k,k.split('__').map(label).join(' × ')]));
 $('crossSelect').onchange=cross;cross();
 $('regressionTable').innerHTML=table(['Model','Equation for modeled sleep score','R²','RMSE'],A.regression.map(x=>[x.model,`${fmt(x.intercept,2)} ${x.slope<0?'−':'+'} ${fmt(Math.abs(x.slope),2)} × ${x.model==='Linear'?'hours':'ln(hours)'}`,fmt(x.r2,3),fmt(x.rmse,2)]));
 $('classificationTable').innerHTML=table(['Model','Accuracy','Macro F1','Settings'],A.classification.map(x=>[x.model,fmt(100*x.accuracy,1)+'%',fmt(x.macroF1,3),x.settings]));
 $('pathTable').innerHTML=table(['Leaf','Decision path','Predicted band','Training profiles'],A.treePaths.map(x=>[x.leaf,x.path.replaceAll('_',' '),x.result,fmt(x.trainingProfiles,0)]));
 let c=A.checks;
 $('checksTable').innerHTML=table(['Check','Value'],[['Unique profile IDs',fmt(c.uniqueIds,0)],['Blank provenance cells in attachment',fmt(c.blankRecordType,0)],['Distinct usage templates',fmt(c.distinctUsageTemplates,0)],['Template region differs from profile',fmt(c.differentTemplateRegions,0)],['Pickup × session exceeds daily minutes',fmt(c.negativeMinutesDifference,0)]]);
 $('sourceGender').innerHTML=table(['Gender','Source count'],A.source.gender.map(x=>[x.label,fmt(x.count,0)]));
 $('sourceCountries').innerHTML=table(['Country','Continent','Source count','Source share field'],A.source.countries.map(x=>[x.country,x.continent,fmt(x.respondents,0),x.share]));
 $('dictionaryTable').innerHTML=table(['Field','Unit / values','Description','Basis'],A.dictionary.map(x=>[x.field,x.unit,x.description,x.basis]));
}
A=window.__A;P=window.__P;init();

(() => {
  const endpoint = './demo-summary.json';
  const get = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const format = value => value == null ? 'Not reported' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const table = (headers, rows) => `<table><thead><tr>${headers.map(x => `<th>${escape(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(x => `<td>${escape(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const box = (value, label) => `<div class="number"><strong>${escape(value)}</strong>${escape(label)}</div>`;
  const group = (id, rows, n) => {
    get(id).innerHTML = rows.length ? table(['Group', 'Responses', 'Daily screen hours', 'School use min', 'AI school min', 'Sleep hours', 'Wellbeing rating'], rows.map(r => [r.label, format(r.n), format(r.screenHours), format(r.schoolMinutes), format(r.aiMinutes), format(r.sleepHours), format(r.wellbeing)])) : `<p class="note">Grouped results appear once a category has at least ${n} responses.</p>`;
  };
  const multi = (id, rows) => {
    get(id).innerHTML = rows.length ? table(['Answer', 'Responses'], rows.map(r => [r.label, format(r.n)])) : '<p class="note">Counts appear once an answer has at least five responses.</p>';
  };

  async function refresh() {
    try {
      const data = window.__DEMO;
      const n = Number(data.count) || 0;
      get('liveStatus').textContent = `${format(n)}  entries in this private static snapshot. These are not live survey submissions.`;
      get('liveNumbers').innerHTML = [
        box(format(n), ' entries'),
        ...(n >= 5 ? [
          box(format(data.means.screenHours), 'mean daily screen hours'),
          box(format(data.means.pickups), 'mean daily pickups'),
          box(format(data.means.sleepHours), 'mean modeled sleep hours'),
        ] : []),
      ].join('');
      get('liveAverages').innerHTML = n >= 5 ? table(['Screen h', 'Pickups', 'Session min', 'Night use %', 'School min', 'AI min', 'AI sessions', 'Sleep h', 'Sleep quality /5', 'Wellbeing /100', 'Before bed min', 'Phone wakeups /week', 'Offline STEM /10', 'Notifications /day', 'Reduction min', 'Mood impact /5', 'Focus impact /5', 'Reduction attempts'], [[
        data.means.screenHours, data.means.pickups, data.means.sessionMinutes,
        data.means.nightUsePct, data.means.schoolMinutes, data.means.aiMinutes,
        data.means.aiSessions, data.means.sleepHours, data.means.sleepQuality,
        data.means.wellbeing, data.means.beforeBedMinutes, data.means.phoneWakeups,
        data.means.offlineStemInterest, data.means.notificationCount, data.means.reductionMinutes,
        data.means.moodImpact, data.means.focusImpact, data.reductionAttempts,
      ].map(format)]) : '<p class="note">Metric averages appear after five collected responses.</p>';
      group('liveAge', data.groups.age, 5);
      group('liveGender', data.groups.gender, 5);
      group('liveEnvironment', data.groups.environment, 5);
      group('liveSES', data.groups.socioeconomicTier, 5);
      group('livePlatform', data.groups.platform, 5);
      group('livePeak', data.groups.peakTime, 5);
      group('liveCountry', data.groups.country, 10);
      group('liveReduction', data.groups.reductionAttempt, 5);
      multi('livePurposes', data.groups.screenPurposes);
      multi('liveAiTasks', data.groups.aiTasks);
      get('liveBands').innerHTML = data.screenTimeBands.length ? table(['Daily screen time', 'Responses'], data.screenTimeBands.map(x => [x.label, format(x.n)])) : '<p class="note">Bands appear once a group has at least five responses.</p>';
      const pairs = [['Screen time and reported sleep', 'screenSleep'], ['School screen use and AI-assisted use', 'schoolAI'], ['Night use and reported sleep', 'nightSleep'], ['Wellbeing rating and reported sleep', 'wellbeingSleep'], ['Pickups and screen time', 'pickupsScreen']];
      get('liveCorrelations').innerHTML = data.correlations ? table(['Measures', 'Pearson r'], pairs.map(([label, key]) => [label, format(data.correlations[key])])) : '<p class="note">Correlations appear after at least 10 collected responses.</p>';
    } catch (error) {
      get('liveStatus').textContent = 'Dashboard summary unavailable. Open this folder through a local web server or use the packaged preview.';
    }
  }
  get('refreshLive').addEventListener('click', refresh);
  refresh();
})();
