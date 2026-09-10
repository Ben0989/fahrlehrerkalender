(function(){
  function normalizeStageLocal(stage){
    if(stage==='Reifestufe'||stage==='Teststufe') return 'Reife- und Teststufe';
    return stage||'Grundstufe';
  }

  function stageClassLocal(stage){
    switch(normalizeStageLocal(stage)){
      case 'Aufbaustufe': return 'stage-aufbaustufe';
      case 'Leistungsstufe': return 'stage-leistungsstufe';
      case 'Reife- und Teststufe': return 'stage-reifetest';
      default: return 'stage-grundstufe';
    }
  }

  function formatDurationLocal(minutes){
    const m=Number(minutes)||0;
    if(m>=60){const h=Math.floor(m/60),r=m%60;return r?`${h} Std. ${r} Min.`:`${h} Std.`;}
    return `${m} Min.`;
  }

  function nextAppointment(studentId){
    const nowDate=today();
    const now=new Date();
    const nowMinutes=now.getHours()*60+now.getMinutes();
    return data.appointments
      .filter(a=>a.studentId===studentId && (a.date>nowDate || (a.date===nowDate && min(a.time)+dur(a)>nowMinutes)))
      .sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0]||null;
  }

  function nextAppointmentText(studentId){
    const a=nextAppointment(studentId);
    if(!a) return 'Kein weiterer Termin geplant';
    const date=fmt(a.date,{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
    return `Nächster Termin: ${date}, ${a.time} Uhr · ${TL[a.type]} · ${formatDurationLocal(dur(a))}`;
  }

  window.filterStudentRows=function(value){
    const q=(value||'').trim().toLocaleLowerCase('de-DE');
    document.querySelectorAll('#studentTableBody tr[data-search]').forEach(row=>{
      row.style.display=!q||row.dataset.search.includes(q)?'':'none';
    });
    const visible=[...document.querySelectorAll('#studentTableBody tr[data-search]')].filter(r=>r.style.display!=='none').length;
    const count=document.getElementById('studentFilterCount');
    if(count) count.textContent=q?`${visible} Treffer`:`${data.students.length} Fahrschüler`;
  };

  students=function(){
    const rows=data.students.map(s=>{
      const name=`${s.first} ${s.last}`;
      const search=esc(name.toLocaleLowerCase('de-DE'));
      return `<tr data-search="${search}"><td><b>${esc(name)}</b><div class="student-next">${esc(nextAppointmentText(s.id))}</div></td><td><span class="stage ${stageClassLocal(s.stage)}">${esc(normalizeStageLocal(s.stage))}</span></td><td>${esc(s.cls||'–')}</td><td>${esc(s.phone||'–')}</td><td class="student-actions"><button class="icon" onclick="editStudent('${s.id}')" title="Bearbeiten">✎</button> <button class="icon delete-student" onclick="delStudent('${s.id}')" title="Fahrschüler löschen">🗑</button></td></tr>`;
    }).join('');

    return `<div class="head"><div><h1>Fahrschüler</h1><div class="sub" id="studentFilterCount">${data.students.length} Fahrschüler</div></div><button class="btn primary" onclick="openStudent()">+ Fahrschüler</button></div>
      <div class="student-filter"><span>🔎</span><input id="studentSearch" type="search" placeholder="Nach Vor- oder Nachname filtern …" oninput="filterStudentRows(this.value)" autocomplete="off"></div>
      <div class="panel tablewrap"><table><thead><tr><th>Name</th><th>Stufe</th><th>Klasse</th><th>Telefon</th><th></th></tr></thead><tbody id="studentTableBody">${rows||'<tr><td colspan="5" class="empty">Noch keine Fahrschüler.</td></tr>'}</tbody></table></div>`;
  };

  delStudent=function(i){
    const s=data.students.find(x=>x.id===i);
    if(!s) return;
    const linked=data.appointments.filter(x=>x.studentId===i);
    const name=`${s.first} ${s.last}`;
    const message=linked.length
      ? `${name} wirklich löschen?\n\nDabei werden auch ${linked.length} zugehörige${linked.length===1?'r Termin':' Termine'} dauerhaft aus dem Kalender gelöscht.\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
      : `${name} wirklich dauerhaft löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`;
    if(!confirm(message)) return;

    data.students=data.students.filter(x=>x.id!==i);
    if(linked.length) data.appointments=data.appointments.filter(x=>x.studentId!==i);
    save();
    render();
    toast(linked.length?`Fahrschüler und ${linked.length} Termin${linked.length===1?'':'e'} gelöscht.`:'Fahrschüler gelöscht.');
  };

  if(page==='students') render();
})();