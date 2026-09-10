(function(){
  function formatDuration(minutes){
    const m=Number(minutes)||0;
    if(m>=60){
      const h=Math.floor(m/60),rest=m%60;
      return rest?`${h} Std. ${rest} Min.`:`${h} Std.`;
    }
    return `${m} Min.`;
  }

  function appointmentMinutes(a){
    if(a?.type==='exam') return 60;
    if(Number(a?.minutes)>0) return Number(a.minutes);
    if(Number(a?.ue)>0) return Number(a.ue)*45;
    return 90;
  }

  // Bestehende Termine aus dem alten UE-System verlustfrei auf Minuten migrieren.
  let migrated=false;
  data.appointments.forEach(a=>{
    if(a.type!=='exam' && !Number(a.minutes)){
      a.minutes=Math.min(600,Math.max(15,Number(a.ue||2)*45));
      migrated=true;
    }
    if(a.type==='exam' && a.minutes!==60){a.minutes=60;migrated=true;}
  });
  if(migrated) save();

  // Zentrale Dauerberechnung: Prüfung immer 60 Min., sonst frei in 15-Minuten-Schritten.
  dur=function(a){return appointmentMinutes(a)};

  function setupDurationSelect(value){
    const select=document.getElementById('aue');
    if(!select) return;
    if(select.dataset.minuteMode!=='1'){
      select.innerHTML='';
      for(let m=15;m<=600;m+=15){
        const opt=document.createElement('option');
        opt.value=String(m);
        opt.textContent=formatDuration(m);
        select.appendChild(opt);
      }
      select.dataset.minuteMode='1';
      const label=select.closest('.field')?.querySelector('label');
      if(label) label.textContent='Dauer';
    }
    let chosen=Number(value)||90;
    chosen=Math.min(600,Math.max(15,Math.round(chosen/15)*15));
    select.value=String(chosen);
  }

  preview=function(){
    const type=document.getElementById('atype'),select=document.getElementById('aue'),box=document.getElementById('dur');
    if(!type||!select||!box) return;
    const field=select.closest('.field');
    if(type.value==='exam'){
      select.disabled=true;
      if(field) field.style.display='none';
      box.textContent='Prüfung = 60 Minuten';
    }else{
      select.disabled=false;
      if(field) field.style.display='';
      setupDurationSelect(select.value||90);
      box.textContent='Dauer: '+formatDuration(select.value);
    }
  };

  openAppt=function(a){
    fillStudents();
    aid.value=a?.id||'';
    astudent.value=a?.studentId||'';
    adate.value=a?.date||sel;
    atime.value=a?.time||'08:00';
    atype.value=a?.type||'normal';
    setupDurationSelect(a?appointmentMinutes(a):90);
    anote.value=a?.note||'';
    preview();
    openM('appt');
  };

  saveAppt=function(){
    if(!astudent.value) return toast('Bitte Fahrschüler auswählen.');
    const minutes=atype.value==='exam'?60:Number(aue.value||90);
    const a={
      id:aid.value||id(),studentId:astudent.value,date:adate.value,time:atime.value,
      type:atype.value,minutes,note:anote.value.trim()
    };
    const start=min(a.time),finish=start+dur(a);
    const conf=allIntervals(a.date,'drive',a.id).find(x=>start<x.end&&finish>x.start);
    if(vac(a.date)&&!confirm('Termin liegt im Urlaub. Trotzdem speichern?')) return;
    if(conf&&!confirm('Terminüberschneidung mit '+conf.label+'. Trotzdem speichern?')) return;
    data.appointments=aid.value?data.appointments.map(x=>x.id===a.id?a:x):[...data.appointments,a];
    save();sel=a.date;closeM('appt');go('calendar');toast('Termin gespeichert.');
  };

  day=function(){
    let out='',h=holiday(sel),s=school(sel),v=vac(sel);
    if(h) out+=`<div class="event" style="--c:#d946ef;background:#fae8ff"><b>Feiertag</b><div><strong>${h.name}</strong><span class="small">NRW</span></div></div>`;
    if(s) out+=`<div class="event" style="--c:#f97316;background:#ffedd5"><b>Ferien</b><div><strong>${s[0]}</strong><span class="small">NRW</span></div></div>`;
    if(v) out+=`<div class="event" style="--c:${C.vac};background:#fee2e2"><b>Urlaub</b><div><strong>${esc(v.label)}</strong></div></div>`;
    const all=[...apps(sel).map(x=>({...x,kind:'drive'})),...privs(sel).map(x=>({...x,kind:'private'}))].sort((a,b)=>a.time.localeCompare(b.time));
    out+=all.map(x=>x.kind==='private'
      ?`<div class="event" style="--c:${C.private};background:#ede9fe"><b>${x.time}–${pend(x)}</b><div><strong>🔒 ${esc(x.title)}</strong><span class="small">Privater Eintrag · ${x.minutes} Min.</span></div><div class="ea"><button class="icon" onclick="editPrivate('${x.id}')">✎</button> <button class="icon" onclick="delPrivate('${x.id}')">🗑</button></div></div>`
      :`<div class="event" style="--c:${C[x.type]};background:${C[x.type]}44"><b>${x.time}–${end(x)}</b><div><strong>${esc(sname(x.studentId))}</strong><span class="small">${TL[x.type]} · ${formatDuration(dur(x))}</span></div><div class="ea"><button class="icon" onclick="editAppt('${x.id}')">✎</button> <button class="icon" onclick="delAppt('${x.id}')">🗑</button></div></div>`).join('');
    return `<div class="panelbody">${out||'<div class="empty">Noch keine Termine.<br><br><button class="btn primary" onclick="openAppt()">+ Termin anlegen</button></div>'}</div>`;
  };

  week=function(){
    let start=monday(pdate(sel)),cols='';
    for(let i=0;i<7;i++){
      let d=add(start,i),ds=iso(d),events=[...apps(ds).map(x=>({...x,kind:'drive'})),...privs(ds).map(x=>({...x,kind:'private'}))].sort((a,b)=>a.time.localeCompare(b.time));
      cols+=`<div class="weekcol"><div class="weekhead">${DOW[i]}<br>${fmt(ds,{day:'2-digit',month:'2-digit'})}<br><span class="small">☀️↓ ${sunset(ds)||'–'}</span></div><div class="weekbody">${events.length?events.map(x=>x.kind==='private'?`<div class="weekevent" style="--c:${C.private}"><b>${x.time}–${pend(x)}</b><br>🔒 ${esc(x.title)}</div>`:`<div class="weekevent" style="--c:${C[x.type]}"><b>${x.time}–${end(x)}</b><br>${esc(sname(x.studentId))}<br><span class="small">${TL[x.type]} · ${formatDuration(dur(x))}</span></div>`).join(''):'<span class="small">Keine Termine</span>'}</div></div>`;
    }
    return `<div class="panelbody"><div class="printonly"><h2>Wochenplan ${calendarTitle()}</h2></div><div class="weekwrap"><div class="week">${cols}</div></div></div>`;
  };

  shareText=function(days){
    const lines=['Fahrplan ab '+fmt(sel)];
    for(let i=0;i<days;i++){
      const ds=iso(add(pdate(sel),i));
      lines.push('',fmt(ds));
      const a=apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(`${x.time}–${end(x)}  ${sname(x.studentId)} – ${TL[x.type]} (${formatDuration(dur(x))})`));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
    }
    return lines.join('\n');
  };

  window.shareWeek=async function(){
    const start=monday(pdate(sel));
    const lines=[`Wochenplan ${fmt(iso(start),{day:'2-digit',month:'2-digit'})} – ${fmt(iso(add(start,6)),{day:'2-digit',month:'2-digit',year:'numeric'})}`];
    for(let i=0;i<7;i++){
      const ds=iso(add(start,i));
      lines.push('',fmt(ds));
      const a=apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(`${x.time}–${end(x)}  ${sname(x.studentId)} – ${TL[x.type]} (${formatDuration(dur(x))})`));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
      const sr=typeof sunrise==='function'?sunrise(ds):null,ss=sunset(ds);
      if(sr||ss) lines.push(`Sonnenaufgang: ${sr||'–'} Uhr · Sonnenuntergang: ${ss||'–'} Uhr`);
    }
    const text=lines.join('\n');
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender – Wochenplan',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Wochenplan in Zwischenablage kopiert.');}
      else prompt('Wochenplan kopieren:',text);
    }catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  const previousRender=render;
  render=function(){
    previousRender();
    setTimeout(()=>{
      // Alte UE-Kennzahl im Dashboard durch echte Fahrzeit ersetzen.
      document.querySelectorAll('.cards .card').forEach(card=>{
        const label=card.querySelector('.label');
        if(label?.textContent==='Fahr-UE'){
          const total=apps(sel).reduce((sum,a)=>sum+dur(a),0);
          label.textContent='Fahrzeit';
          const metric=card.querySelector('.metric');
          if(metric) metric.textContent=formatDuration(total);
        }
      });
      document.querySelectorAll('.panelhead button').forEach(btn=>{
        if((btn.textContent||'').includes('Woche senden')) btn.onclick=window.shareWeek;
      });
    },0);
  };

  document.addEventListener('change',e=>{
    if(e.target?.id==='atype'||e.target?.id==='aue') preview();
  });

  render();
})();