(function(){
  const oldStudents=students;
  const transmissionLabel=a=>a?.transmission==='manual'?'Schalter':'Automatik';
  const formatDuration=m=>{m=Number(m)||0;const h=Math.floor(m/60),r=m%60;return h?(r?`${h} Std. ${r} Min.`:`${h} Std.`):`${r} Min.`};

  function isCompleted(a){
    const nowDate=today();
    if(a.date<nowDate) return true;
    if(a.date>nowDate) return false;
    const now=new Date(),nowMinutes=now.getHours()*60+now.getMinutes();
    return min(a.time)+dur(a)<=nowMinutes;
  }

  function completedLessons(studentId){
    return data.appointments
      .filter(a=>a.studentId===studentId&&a.type!=='exam'&&isCompleted(a))
      .sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
  }

  window.openStudentAppointments=function(studentId){
    const s=data.students.find(x=>x.id===studentId);
    if(!s) return;
    const completed=completedLessons(studentId);
    const totalMinutes=completed.reduce((sum,a)=>sum+dur(a),0);
    const manual=completed.filter(a=>a.transmission==='manual').length;
    const automatic=completed.length-manual;
    const all=data.appointments.filter(a=>a.studentId===studentId).sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
    const rows=all.map(a=>`<tr><td><b>${fmt(a.date,{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})}</b><div class="small">${esc(a.time)}–${esc(end(a))}</div></td><td>${esc(TL[a.type]||a.type)}<div class="small">${formatDuration(dur(a))} · ${transmissionLabel(a)}${isCompleted(a)?' · gefahren':' · geplant'}</div></td><td>${a.note?esc(a.note):'<span class="small">Keine Notiz</span>'}</td></tr>`).join('');
    document.getElementById('historyTitle').textContent=`Fahrstunden – ${s.first} ${s.last}`;
    document.getElementById('historyBody').innerHTML=`<tr class="student-history-summary"><td colspan="3"><div class="history-stats"><div><b>${completed.length}</b><span>gefahrene Fahrstunden</span></div><div><b>${formatDuration(totalMinutes)}</b><span>gesamte Fahrzeit</span></div><div><b>${automatic}</b><span>Automatik</span></div><div><b>${manual}</b><span>Schalter</span></div></div></td></tr>${rows||'<tr><td colspan="3" class="empty">Keine Termine vorhanden.</td></tr>'}`;
    openM('studentHistoryModal');
  };

  students=function(){
    const html=oldStudents();
    const wrap=document.createElement('div');wrap.innerHTML=html;
    const rows=wrap.querySelectorAll('#studentTableBody tr[data-search]');
    rows.forEach((row,i)=>{
      const s=data.students[i];
      if(!s) return;
      const completed=completedLessons(s.id);
      const totalMinutes=completed.reduce((sum,a)=>sum+dur(a),0);
      const nameCell=row.querySelector('td');
      if(nameCell){
        const info=document.createElement('div');
        info.className='student-driven-summary';
        info.textContent=completed.length?`${completed.length} Fahrstunde${completed.length===1?'':'n'} gefahren · ${formatDuration(totalMinutes)}`:'Noch keine Fahrstunde gefahren';
        nameCell.appendChild(info);
      }
      const actions=row.querySelector('.student-actions');
      if(actions&&!actions.querySelector('.all-appts')){
        const btn=document.createElement('button');
        btn.className='btn light all-appts';
        btn.textContent='Fahrstunden';
        btn.onclick=()=>openStudentAppointments(s.id);
        actions.insertBefore(btn,actions.firstChild);
      } else if(actions?.querySelector('.all-appts')) actions.querySelector('.all-appts').textContent='Fahrstunden';
    });
    return wrap.innerHTML;
  };

  const oldShareText=window.shareText;
  window.shareText=function(days){
    const lines=['Fahrplan ab '+fmt(sel)];
    for(let i=0;i<days;i++){
      const ds=iso(add(pdate(sel),i));lines.push('',fmt(ds));const items=[];
      apps(ds).forEach(a=>items.push({time:a.time,text:`${a.time}–${end(a)}  ${sname(a.studentId)} – ${TL[a.type]} · ${transmissionLabel(a)} (${formatDuration(dur(a))})`}));
      if(typeof officeEntriesForDate==='function') officeEntriesForDate(ds).forEach(e=>items.push({time:e.time,text:`${e.time}–${e.endTime||''}  ${e.type==='lesson'?'Unterricht':'Büro'} – ${e.title}`}));
      items.sort((a,b)=>a.time.localeCompare(b.time));
      if(!items.length) lines.push('Keine Termine.'); else items.forEach(x=>lines.push(x.text));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
    }
    return lines.join('\n');
  };
  window.shareDays=async function(days){
    const text=window.shareText(days);
    try{if(navigator.share) await navigator.share({title:'FahrlehrerKalender',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Plan in Zwischenablage kopiert.');}else prompt('Plan kopieren:',text);}catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  if(page==='students') render();
})();