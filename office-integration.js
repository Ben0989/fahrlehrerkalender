(function(){
  const COLORS={lesson:'#f59e0b',office:'#14b8a6'};
  const LABELS={lesson:'Unterricht',office:'Büro'};
  if(!Array.isArray(data.officeEntries)) data.officeEntries=[];

  const dateOnly=value=>{
    const s=String(value||'').trim(),m=s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m?m[1]:s;
  };
  const entries=ds=>{
    const wanted=dateOnly(ds);
    return data.officeEntries.filter(x=>dateOnly(x.date)===wanted).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  };
  window.officeEntriesForDate=entries;

  let normalized=false;
  data.officeEntries.forEach(x=>{const d=dateOnly(x.date);if(d!==x.date){x.date=d;normalized=true;}});
  if(normalized) save();

  const minutesBetween=(start,endTime)=>start&&endTime?min(endTime)-min(start):0;
  const formatDuration=minutes=>{
    const m=Number(minutes)||0;
    if(m>=60){const h=Math.floor(m/60),r=m%60;return r?`${h} Std. ${r} Min.`:`${h} Std.`;}
    return `${m} Min.`;
  };
  const officeEnd=e=>e.endTime||tmin(min(e.time)+Number(e.minutes||60));

  window.previewOffice=function(){
    const start=document.getElementById('otime'),finish=document.getElementById('oend'),box=document.getElementById('odur');
    if(!start||!finish||!box) return;
    const mins=minutesBetween(start.value,finish.value);
    box.textContent=mins<=0?'Ende muss nach dem Beginn liegen.':mins>600?'Maximale Dauer: 10 Stunden.':`Dauer: ${formatDuration(mins)} (${mins} Min.)`;
  };

  window.openOffice=function(entry){
    const e=entry||null;
    oid.value=e?.id||'';otype.value=e?.type||'lesson';otitle.value=e?.title||'';odate.value=e?.date||sel;otime.value=e?.time||'08:00';
    oend.value=e?.endTime||tmin(min(otime.value)+Number(e?.minutes||90));onote.value=e?.note||'';
    previewOffice();openM('officeModal');
  };
  window.editOffice=i=>{const e=data.officeEntries.find(x=>x.id===i);if(e) openOffice(e);};
  window.deleteOffice=function(i){
    const e=data.officeEntries.find(x=>x.id===i);if(!e) return;
    if(!confirm(`${LABELS[e.type]||'Termin'} „${e.title||'ohne Bezeichnung'}“ wirklich löschen?`)) return;
    data.officeEntries=data.officeEntries.filter(x=>x.id!==i);save();render();toast('Termin gelöscht.');
  };
  window.saveOffice=function(){
    if(!odate.value) return toast('Bitte ein Datum auswählen.');
    if(!otitle.value.trim()) return toast('Bitte eine Bezeichnung eingeben.');
    const minutes=minutesBetween(otime.value,oend.value);
    if(minutes<=0) return toast('Das Ende muss nach dem Beginn liegen.');
    if(minutes>600) return toast('Die maximale Termindauer beträgt 10 Stunden.');
    const start=min(otime.value),finish=min(oend.value),ds=dateOnly(odate.value),conflicts=[];
    apps(ds).forEach(a=>conflicts.push({start:min(a.time),end:min(a.time)+dur(a),label:sname(a.studentId)}));
    privs(ds).forEach(p=>conflicts.push({start:min(p.time),end:min(p.time)+Number(p.minutes||60),label:p.title||'Privater Termin'}));
    entries(ds).filter(x=>x.id!==oid.value).forEach(x=>conflicts.push({start:min(x.time),end:min(officeEnd(x)),label:x.title||LABELS[x.type]}));
    const conflict=conflicts.find(x=>start<x.end&&finish>x.start);
    if(conflict&&!confirm(`Terminüberschneidung mit ${conflict.label}. Trotzdem speichern?`)) return;
    const e={id:oid.value||id(),type:otype.value,title:otitle.value.trim(),date:ds,time:otime.value,endTime:oend.value,minutes,note:onote.value.trim()};
    data.officeEntries=oid.value?data.officeEntries.map(x=>x.id===e.id?e:x):[...data.officeEntries,e];
    save();sel=e.date;closeM('officeModal');render();toast('Termin gespeichert.');
  };

  function officePage(){
    const rows=data.officeEntries.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).map(e=>`<tr><td><b>${fmt(e.date,{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})}</b><div class="small">${esc(e.time)}–${esc(officeEnd(e))} · ${formatDuration(e.minutes)}</div></td><td><span class="office-pill ${e.type}">${LABELS[e.type]||'Termin'}</span></td><td><b>${esc(e.title)}</b>${e.note?`<div class="small">${esc(e.note)}</div>`:''}</td><td class="student-actions"><button class="icon" onclick="editOffice('${e.id}')">✎</button> <button class="icon delete-student" onclick="deleteOffice('${e.id}')">🗑</button></td></tr>`).join('');
    return `<div class="head"><div><h1>Unterricht & Büro</h1><div class="sub">Theorieunterricht, Bürozeiten und sonstige Fahrschultermine</div></div><button class="btn primary" onclick="openOffice()">+ Termin</button></div><div class="panel tablewrap"><table><thead><tr><th>Datum / Zeit</th><th>Art</th><th>Bezeichnung</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="empty">Noch keine Unterrichts- oder Bürotermine.</td></tr>'}</tbody></table></div>`;
  }

  function injectCalendarEntries(){
    if(page!=='calendar') return;
    if(view==='day'){
      const body=document.querySelector('.panelbody');
      if(!body||body.querySelector('.office-calendar-event')) return;
      entries(sel).forEach(e=>{
        const el=document.createElement('div');
        el.className='event office-calendar-event';el.style.setProperty('--c',COLORS[e.type]);el.style.background=COLORS[e.type]+'22';
        el.innerHTML=`<b>${esc(e.time)}–${esc(officeEnd(e))}</b><div><strong>${e.type==='lesson'?'📚':'🗂️'} ${esc(e.title)}</strong><span class="small">${LABELS[e.type]} · ${formatDuration(e.minutes)}</span></div><div class="ea"><button class="icon" onclick="editOffice('${e.id}')">✎</button> <button class="icon" onclick="deleteOffice('${e.id}')">🗑</button></div>`;
        body.appendChild(el);
      });
    }
    if(view==='week'){
      const start=monday(pdate(sel));
      document.querySelectorAll('.weekcol').forEach((col,i)=>{
        const body=col.querySelector('.weekbody');if(!body) return;
        entries(iso(add(start,i))).forEach(e=>{
          const el=document.createElement('div');el.className='weekevent office-calendar-event';el.style.setProperty('--c',COLORS[e.type]);
          el.innerHTML=`<b>${esc(e.time)}–${esc(officeEnd(e))}</b><br>${e.type==='lesson'?'📚':'🗂️'} ${esc(e.title)}<br><span class="small">${LABELS[e.type]}</span>`;body.appendChild(el);
        });
      });
    }
  }

  const previousRender=render;
  render=function(){
    if(page==='office'){main.innerHTML=officePage();return;}
    previousRender();setTimeout(injectCalendarEntries,0);
  };

  window.shareText=function(days){
    const lines=['Fahrplan ab '+fmt(sel)];
    for(let i=0;i<days;i++){
      const ds=iso(add(pdate(sel),i));lines.push('',fmt(ds));const items=[];
      apps(ds).forEach(a=>items.push({time:a.time,text:`${a.time}–${end(a)}  ${sname(a.studentId)} – ${TL[a.type]}`}));
      entries(ds).forEach(e=>items.push({time:e.time,text:`${e.time}–${officeEnd(e)}  ${LABELS[e.type]} – ${e.title}`}));
      items.sort((a,b)=>a.time.localeCompare(b.time));
      if(!items.length) lines.push('Keine Termine.');else items.forEach(x=>lines.push(x.text));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
    }
    return lines.join('\n');
  };
  window.shareDays=async function(days){
    const text=window.shareText(days);
    try{if(navigator.share) await navigator.share({title:'FahrlehrerKalender',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Plan in Zwischenablage kopiert.');}else prompt('Plan kopieren:',text);}catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  render();
})();