(function(){
  function dateOnly(value){
    const s=String(value||'').trim();
    const m=s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m?m[1]:s;
  }

  // Gespeicherte Datumswerte vereinheitlichen, damit ein Termin immer nur an
  // genau seinem Kalendertag erscheint – auch bei älteren/importierten Daten.
  let changed=false;
  data.appointments.forEach(a=>{
    const d=dateOnly(a.date);
    if(d!==a.date){a.date=d;changed=true;}
  });
  data.privateEntries.forEach(a=>{
    const d=dateOnly(a.date);
    if(d!==a.date){a.date=d;changed=true;}
  });
  if(changed) save();

  apps=function(ds){
    const wanted=dateOnly(ds);
    return data.appointments
      .filter(a=>dateOnly(a.date)===wanted)
      .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  };

  privs=function(ds){
    const wanted=dateOnly(ds);
    return data.privateEntries
      .filter(a=>dateOnly(a.date)===wanted)
      .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  };

  // Beim Speichern nur das tatsächlich ausgewählte Datum übernehmen.
  const previousSaveAppt=saveAppt;
  saveAppt=function(){
    const field=document.getElementById('adate');
    if(!field?.value) return toast('Bitte ein Datum auswählen.');
    field.value=dateOnly(field.value);
    previousSaveAppt();
  };

  const previousSavePrivate=savePrivate;
  savePrivate=function(){
    const field=document.getElementById('pdate');
    if(!field?.value) return toast('Bitte ein Datum auswählen.');
    field.value=dateOnly(field.value);
    previousSavePrivate();
  };

  // Nach Laden sofort mit dem strikten Tagesfilter neu zeichnen.
  render();
})();