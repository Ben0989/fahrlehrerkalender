(function(){
  function normalizeStage(stage){
    if(stage==='Reifestufe' || stage==='Teststufe') return 'Reife- und Teststufe';
    return stage || 'Grundstufe';
  }
  function stageClass(stage){
    switch(normalizeStage(stage)){
      case 'Aufbaustufe': return 'stage-aufbaustufe';
      case 'Leistungsstufe': return 'stage-leistungsstufe';
      case 'Reife- und Teststufe': return 'stage-reifetest';
      default: return 'stage-grundstufe';
    }
  }

  let changed=false;
  data.students.forEach(s=>{const n=normalizeStage(s.stage); if(s.stage!==n){s.stage=n;changed=true;}});
  if(changed) save();

  students = function(){
    return `<div class="head"><div><h1>Fahrschüler</h1><div class="sub">${data.students.length} angelegt</div></div><button class="btn primary" onclick="openStudent()">+ Fahrschüler</button></div><div class="panel tablewrap"><table><thead><tr><th>Name</th><th>Stufe</th><th>Klasse</th><th>Telefon</th><th></th></tr></thead><tbody>${data.students.length?data.students.map(s=>`<tr><td><b>${esc(s.first)} ${esc(s.last)}</b></td><td><span class="stage ${stageClass(s.stage)}">${esc(normalizeStage(s.stage))}</span></td><td>${esc(s.cls||'–')}</td><td>${esc(s.phone||'–')}</td><td><button class="icon" onclick="editStudent('${s.id}')">✎</button> <button class="icon" onclick="delStudent('${s.id}')">🗑</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">Noch keine Fahrschüler.</td></tr>'}</tbody></table></div>`;
  };

  const originalOpenStudent = openStudent;
  openStudent = function(s){
    if(s) s={...s,stage:normalizeStage(s.stage)};
    originalOpenStudent(s);
  };

  const originalSaveStudent = saveStudent;
  saveStudent = function(){
    if(document.getElementById('sstage')) sstage.value=normalizeStage(sstage.value);
    originalSaveStudent();
  };

  const originalFillStudents = fillStudents;
  fillStudents = function(){
    astudent.innerHTML='<option value="">Bitte auswählen</option>'+data.students.map(s=>`<option value="${s.id}">${esc(s.first)} ${esc(s.last)} · ${esc(normalizeStage(s.stage))}</option>`).join('');
  };

  render();
})();