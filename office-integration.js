(function(){
  const OFFICE_COLORS={lesson:'#f59e0b',office:'#14b8a6'};
  const OFFICE_LABELS={lesson:'Unterricht',office:'Büro'};

  if(!Array.isArray(data.officeEntries)) data.officeEntries=[];

  function dateOnly(value){
    const s=String(value||'').trim();
    const m=s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m?m[1]:s;
  }
  function entries(ds){
    const wanted=dateOnly(ds);
    return data.officeEntries
      .filter(x=>dateOnly(x.date)===wanted)
      .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  }
  window.officeEntriesForDate=entries;

  let normalized=false;
  data.officeEntries.forEach(x=>{
    const d=dateOnly(x.date);
    if(d!==x.date){x.date=d;normalized=true;}
  });
  if(normalized) save();

  function minutesBetween(start,endTime){
    if(!start||!endTime) return 0;
    return min(endTime)-min(start);
  }
  function formatDuration(minutes){
    const m=Number(minutes)||0;
    if(m>=60){
      const h=Math.floor(m/60),r=m%60;
      return r?`${h} Std. ${r} Min.`:`${h} Std.`;
    }
    return `${m} Min.`;
  }
  function officeEnd(x){return x.endTime||tmin(min(x.time)+Number(x.minutes||60))}

  window.previewOffice=function(){
    const start=document.getElementById('otime'),finish=document.getElementById('oend'),box=document.getElementById('odur');
    if(!start||!finish||!box) return;
    const mins=minutesBetween(start.value,finish.value);
    if(mins<=0){box.textContent='Ende muss nach dem Beginn liegen.';return;}
    if(mins>600){box.textContent='Maximale Dauer: 10 Stunden.';return;}
    box.textContent=`Dauer: ${formatDuration(mins)} (${mins} Min.)`;
  };

  window.openOffice=function(entry){
    const e=entry||null;
    oid.value=e?.id||'';
    otype.value=e?.type||'lesson';
    otitle.value=e?.title||'';
    odate.value=e?.date||sel;
    otime.value=e?.time||'08:00';
    oend.value=e?.endTime||tmin(min(otime.value)+(e?.minutes||90));
    onote.value=e?.note||'';
    previewOffice();
    openM('officeModal');
  };

  window.editOffice=function(i){
    const e=data.officeEntries.find(x=>x.id===i);
    if(e) openOffice(e);
  };

  window.deleteOffice=function(i){
    const e=data.officeEntries.find(x=>x.id===i);
    if(!e) return;
    if(!confirm(`${OFFICE_LABELS[e.type]||'Termin'} „${e.title||'ohne Bezeichnung'}“ wirklich löschen?`)) return;
    data.officeEntries=data.officeEntries.filter(x=>x.id!==i);
    save();render();toast('Termin gelöscht.');
  };

  window.saveOffice=function(){
    if(!odate.value) return toast('Bitte ein Datum auswählen.');
    if(!otitle.value.trim()) return toast('Bitte eine Bezeichnung eingeben.');
    const minutes=minutesBetween(otime.value,oend.value);
    if(minutes<=0) return toast('Das Ende muss nach dem Beginn liegen.');
    if(minutes>600) return toast('Die maximale Termindauer beträgt 10 Stunden.');

    const start=min(otime.value),finish=min(oend.value),ds=dateOnly(odate.value);
    const conflicts=[];
    apps(ds).forEach(a=>conflicts.push({start:min(a.time),end:min(a.time)+dur(a),label:sname(a.studentId)}));
    privs(ds).forEach(p=>conflicts.push({start:min(p.time),end:min(p.time)+Number(p.minutes||60),label:p.title||'Privater Termin'}));
    entries(ds).filter(x=>x.id!==oid.value).forEach(x=>conflicts.push({start:min(x.time),end:min(officeEnd(x)),label:x.title||OFFICE_LABELS[x.type]}));
    const conflict=conflicts.find(x=>start<x.end&&finish>x.start);
    if(conflict&&!confirm(`Terminüberschneidung mit ${conflict.label}. Trotzdem speichern?`)) return;

    const e={id:oid.value||id(),type:otype.value,title:otitle.value.trim(),date:ds,time:otime.value,endTime:oend.value,minutes,note:onote.value.trim()};
    data.officeEntries=oid.value?data.officeEntries.map(x=>x.id===e.id?e:x):[...data.officeEntries,e];
    save();sel=e.date;closeM('officeModal');render();toast('Termin gespeichert.');
  };

  function officePage(){
    const upcoming=data.officeEntries.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    const rows=upcoming.map(e=>`<tr><td><b>${fmt(e.date,{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})}</b><div class="small">${esc(e.time)}–${esc(officeEnd(e))} · ${formatDuration(e.minutes)}</div></td><td><span class="office-pill ${e.type}">${OFFICE_LABELS[e.type]||'Termin'}</span></td><td><b>${esc(e.title)}</b>${e.note?`<div class="small">${esc(e.note)}</div>`:''}</td><td class="student-actions"><button class="icon" onclick="editOffice('${e.id}')">✎</button> <button class="icon delete-student" onclick="deleteOffice('${e.id}')">🗑</button></td></tr>`).join('');
    return `<div class="head"><div><h1>Unterricht & Büro</h1><div class="sub">Theorieunterricht, Bürozeiten und sonstige Fahrschultermine</div></div><button class="btn primary" onclick="openOffice()">+ Termin</button></div>
      <div class="panel tablewrap"><table><thead><tr><th>Datum / Zeit</th><th>Art</th><th>Bezeichnung</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="empty">Noch keine Unterrichts- oder Bürotermine.</td></tr>'}</tbody></table></div>`;
  }

  const previousRender=render;
  render=function(){
    if(page==='office'){
      main.innerHTML=officePage();
      return;
    }
    previousRender();
  };

  // Unterricht/Büro auch im Tageskalender anzeigen.
  const previousDay=day;
  day=function(){
    let html=previousDay();
    const list=entries(sel);
    if(!list.length) return html;
    const extra=list.map(e=>`<div class="event office-calendar-event" style="--c:${OFFICE_COLORS[e.type]};background:${OFFICE_COLORS[e.type]}22"><b>${esc(e.time)}–${esc(officeEnd(e))}</b><div><strong>${e.type==='lesson'?'📚':'🗂️'} ${esc(e.title)}</strong><span class="small">${OFFICE_LABELS[e.type]} · ${formatDuration(e.minutes)}</span></div><div class="ea"><button class="icon" onclick="editOffice('${e.id}')">✎</button> <button class="icon" onclick="deleteOffice('${e.id}')">🗑</button></div></div>`).join('');
    return html.replace('</div>',extra+'</div>');
  };

  // Und in der Wochenansicht in die jeweilige Tages-Spalte einfügen.
  const previousWeek=week;
  week=function(){
    let html=previousWeek();
    const start=monday(pdate(sel));
    const wrapper=document.createElement('div');
    wrapper.innerHTML=html;
    const cols=wrapper.querySelectorAll('.weekcol');
    cols.forEach((col,i)=>{
      const ds=iso(add(start,i));
      const body=col.querySelector('.weekbody');
      entries(ds).forEach(e=>{
        const el=document.createElement('div');
        el.className='weekevent';
        el.style.setProperty('--c',OFFICE_COLORS[e.type]);
        el.innerHTML=`<b>${esc(e.time)}–${esc(officeEnd(e))}</b><br>${e.type==='lesson'?'📚':'🗂️'} ${esc(e.title)}<br><span class="small">${OFFICE_LABELS[e.type]}</span>`;
        body?.appendChild(el);
      });
    });
    return wrapper.innerHTML;
  };

  // Tag teilen: Unterricht/Büro mit ausgeben.
  const priorShareText=window.shareText||shareText;
  window.shareText=function(days){
    const lines=['Fahrplan ab '+fmt(sel)];
    for(let i=0;i<days;i++){
      const ds=iso(add(pdate(sel),i));
      lines.push('',fmt(ds));
      const dayItems=[];
      apps(ds).forEach(a=>dayItems.push({time:a.time,text:`${a.time}–${end(a)}  ${sname(a.studentId)} – ${TL[a.type]}`}));
      entries(ds).forEach(e=>dayItems.push({time:e.time,text:`${e.time}–${officeEnd(e)}  ${OFFICE_LABELS[e.type]} – ${e.title}`}));
      dayItems.sort((a,b)=>a.time.localeCompare(b.time));
      if(!dayItems.length) lines.push('Keine Termine.'); else dayItems.forEach(x=>lines.push(x.text));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
    }
    return lines.join('\n');
  };
  window.shareDays=async function(days){
    const text=window.shareText(days);
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Plan in Zwischenablage kopiert.');}
      else prompt('Plan kopieren:',text);
    }catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  render();
})();