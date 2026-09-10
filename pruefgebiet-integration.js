(function(){
  const ROUTE_GROUPS=[
    {group:'Holthausen',items:['Schule – von oben','Schule – von unten','Holthausen – von oben','Holthausen – von unten','Holthausen Sackgasse','Holthausen VB','TÜV – von oben','TÜV – von unten']},
    {group:'Welper',items:['Welper Stadt – FS Richtung Schule','Welper Stadt – Schule Richtung Fahrschule','Welper Sackgasse','Welper Hochhaus – kleine Runde','Welper Hochhaus – große Runde','Hellweg – bergab','Hellweg – bergauf']},
    {group:'Blankenstein',items:['Blankenstein KH Sackgasse','Blankenstein VB']},
    {group:'Sprockhövel',items:['Querspange Richtung Haßlinghausen','Osterhöfgen','Glückaufhalle','Sportplatz']},
    {group:'Südstadt',items:['Alte Feuerwehr links','Öko','Busbahnhof VB','Neue Feuerwehr','Grünstraße','Nordstraße – KH Richtung Harzer','Nordstraße – andersrum','Oberwinzerfeld','Harzer – Richtung Avantgarde','Harzer – andersrum','Talstraße – von oben','Talstraße – von unten','Bahnhofstraße',"Gegenüber McDonald's links",'Salzweg','Beschleunigungsstreifen Richtung Blankenstein','Beschleunigungsstreifen Richtung Hattingen','Polizei links','Avantgarde Hotel / Cappadocia – Richtung Kreis','Avantgarde Hotel / Cappadocia – andersrum','Rechts vor links','Rechts vor links Netto','Avantgarde Sackgasse umkehren','Avantgarde Ampel vor Netto']},
    {group:'Stopschilder',items:['Oberwinzerfeld','TÜV','Diergardt','Stolle Stop','Osterhöfgen','Avantgarde','Hellweg','Talstraße','Abknickende Vorfahrtstraße']},
    {group:'Grundfahraufgaben',items:['Parklücke','Parkbox (vorwärts)','Parkbox (rückwärts)','Umkehren','Gefahrbremsung']},
    {group:'Einbahnstraßen',items:['Aldi','Marktplatz – kleine Runde','Marktplatz – große Runde','Tanzschule','Hirschberger','Oberwinzerfeld','Avantgarde Hotel','Blankenstein']}
  ];

  const routeId=(g,i)=>g+'||'+i;
  const normalizeName=n=>String(n||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
  const fullName=s=>`${s.first||''} ${s.last||''}`.trim();

  if(!data.trainingRatings||typeof data.trainingRatings!=='object') data.trainingRatings={};
  if(!('trainingStudentId' in data)) data.trainingStudentId=null;

  // Einmalige Übernahme aus der bisherigen eigenständigen Prüfgebiet-App.
  if(!data.trainingMigratedV1){
    try{
      const old=JSON.parse(localStorage.getItem('pruefungsgebiete-schueler-v2')||'null');
      if(old&&Array.isArray(old.students)&&old.ratings&&typeof old.ratings==='object'){
        old.students.forEach(ls=>{
          const legacyName=String(ls.name||'').trim();
          if(!legacyName) return;
          let student=data.students.find(s=>normalizeName(fullName(s))===normalizeName(legacyName));
          if(!student){
            const parts=legacyName.split(/\s+/);
            const last=parts.length>1?parts.pop():'';
            student={id:id(),first:parts.join(' ')||legacyName,last,phone:'',cls:'',stage:'Grundstufe',note:'Aus der bisherigen Prüfgebiet-App übernommen'};
            data.students.push(student);
          }
          const legacyRatings=old.ratings[ls.id];
          if(legacyRatings&&typeof legacyRatings==='object'){
            data.trainingRatings[student.id]={...(data.trainingRatings[student.id]||{}),...legacyRatings};
          }
          if(old.selectedStudentId===ls.id) data.trainingStudentId=student.id;
        });
      }
    }catch(e){}
    data.trainingMigratedV1=true;
    save();
  }

  function selectedStudent(){return data.students.find(s=>s.id===data.trainingStudentId)||null}
  function ratings(){
    if(!data.trainingStudentId) return {};
    if(!data.trainingRatings[data.trainingStudentId]) data.trainingRatings[data.trainingStudentId]={};
    return data.trainingRatings[data.trainingStudentId];
  }
  function state(v){return v==='Sehr gut'?'good':v==='Solala'?'mid':v==='Nochmal fahren'?'bad':'none'}
  function counts(){
    const vals=Object.values(ratings());
    return {good:vals.filter(v=>v==='Sehr gut').length,mid:vals.filter(v=>v==='Solala').length,bad:vals.filter(v=>v==='Nochmal fahren').length};
  }

  window.selectTrainingStudent=function(v){data.trainingStudentId=v||null;save();render()};
  window.setTrainingRating=function(key,value,el){
    if(!data.trainingStudentId){toast('Bitte zuerst einen Fahrschüler auswählen.');if(el) el.value='';return;}
    const r=ratings();
    if(value) r[key]=value; else delete r[key];
    save();
    if(el) el.dataset.state=state(value);
    updateTrainingCounts();
  };
  window.updateTrainingCounts=function(){
    const c=counts();
    const g=document.getElementById('trainingGood'),m=document.getElementById('trainingMid'),b=document.getElementById('trainingBad');
    if(g) g.textContent=c.good;if(m) m.textContent=c.mid;if(b) b.textContent=c.bad;
  };
  window.resetTrainingRatings=function(){
    const s=selectedStudent();
    if(!s) return toast('Bitte zuerst einen Fahrschüler auswählen.');
    if(!confirm(`Alle Prüfgebiet-Bewertungen von ${fullName(s)} zurücksetzen?`)) return;
    data.trainingRatings[s.id]={};save();render();toast('Bewertungen zurückgesetzt.');
  };

  function practicePage(){
    const student=selectedStudent();
    const r=ratings(),c=counts();
    const options=data.students.slice().sort((a,b)=>fullName(a).localeCompare(fullName(b),'de')).map(s=>`<option value="${s.id}" ${s.id===data.trainingStudentId?'selected':''}>${esc(fullName(s))}</option>`).join('');
    const groups=ROUTE_GROUPS.map(g=>`<section class="route-group"><h3>${esc(g.group)}</h3>${g.items.map(item=>{
      const key=routeId(g.group,item),v=r[key]||'';
      return `<div class="route-row"><div>${esc(item)}</div><select data-key="${esc(key)}" data-state="${state(v)}" onchange="setTrainingRating(this.dataset.key,this.value,this)"><option value="" ${!v?'selected':''}>– nicht bewertet –</option><option ${v==='Sehr gut'?'selected':''}>Sehr gut</option><option ${v==='Solala'?'selected':''}>Solala</option><option ${v==='Nochmal fahren'?'selected':''}>Nochmal fahren</option></select></div>`;
    }).join('')}</section>`).join('');

    return `<div class="head"><div><h1>Prüfgebiet</h1><div class="sub">Hattingen / Sprockhövel · fahrschülerbezogene Streckenbewertung</div></div></div>
      <div class="route-toolbar panelbody panel">
        <div class="field"><label>Fahrschüler</label><select onchange="selectTrainingStudent(this.value)"><option value="">– Fahrschüler auswählen –</option>${options}</select></div>
        <button class="btn primary" onclick="openStudent()">+ Fahrschüler</button>
      </div>
      ${!data.students.length?'<div class="panel route-empty">Lege zuerst einen Fahrschüler an.</div>':`<div class="route-summary"><div class="route-stat good"><strong id="trainingGood">${c.good}</strong><small>Sehr gut</small></div><div class="route-stat mid"><strong id="trainingMid">${c.mid}</strong><small>Solala</small></div><div class="route-stat bad"><strong id="trainingBad">${c.bad}</strong><small>Nochmal fahren</small></div></div>
      <div class="route-actions no-print"><button class="btn light" onclick="window.print()">🖨️ Drucken / PDF</button><button class="btn light" onclick="resetTrainingRatings()">Bewertungen zurücksetzen</button></div>
      ${student?`<div class="route-note">Bewertungen für <b>${esc(fullName(student))}</b> werden automatisch zusammen mit den übrigen App-Daten gespeichert.</div>${groups}`:'<div class="panel route-empty">Wähle einen Fahrschüler aus, um das Prüfgebiet zu bewerten.</div>'}`}`;
  }

  const previousRender=render;
  render=function(){
    if(page==='practice'){
      main.innerHTML=practicePage();
      return;
    }
    previousRender();
  };

  // Beim endgültigen Löschen eines Fahrschülers auch dessen Prüfgebiet-Daten entfernen.
  if(typeof delStudent==='function'){
    const previousDelete=delStudent;
    delStudent=function(studentId){
      previousDelete(studentId);
      if(!data.students.some(s=>s.id===studentId)&&data.trainingRatings[studentId]){
        delete data.trainingRatings[studentId];
        if(data.trainingStudentId===studentId) data.trainingStudentId=null;
        save();
      }
    };
  }
})();