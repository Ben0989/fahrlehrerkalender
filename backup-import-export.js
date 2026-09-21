(function(){
  function validBackup(obj){
    return obj&&typeof obj==='object'&&!Array.isArray(obj)&&Array.isArray(obj.students)&&Array.isArray(obj.appointments);
  }
  function backupName(){
    const stamp=new Date().toISOString().slice(0,10);
    return 'fahrlehrerkalender-backup-'+stamp+'.json';
  }
  window.exportData=function(){
    const payload={...data,_backup:{app:'FahrlehrerKalender NRW',version:3,exportedAt:new Date().toISOString()}};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=backupName();document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Backup exportiert.');
  };
  window.chooseImport=function(){
    const input=document.getElementById('backupImportFile');
    if(input) input.click();
  };
  window.importDataFile=function(file){
    if(!file) return;
    const reader=new FileReader();
    reader.onload=function(){
      try{
        const incoming=JSON.parse(String(reader.result||''));
        if(!validBackup(incoming)) return toast('Ungültige Backup-Datei.');
        const students=incoming.students||[],appointments=incoming.appointments||[];
        const vacations=Array.isArray(incoming.vacations)?incoming.vacations:[];
        const privateEntries=Array.isArray(incoming.privateEntries)?incoming.privateEntries:[];
        const officeEntries=Array.isArray(incoming.officeEntries)?incoming.officeEntries:[];
        const trainingRatings=incoming.trainingRatings&&typeof incoming.trainingRatings==='object'?incoming.trainingRatings:{};
        const settings=incoming.settings&&typeof incoming.settings==='object'?incoming.settings:{};
        const msg='Backup importieren?\n\n'+students.length+' Fahrschüler\n'+appointments.length+' Fahrtermine\n'+officeEntries.length+' Unterricht/Büro-Termine\n'+vacations.length+' Urlaubseinträge\n\nDie aktuell gespeicherten Daten auf diesem Gerät werden ersetzt.';
        if(!confirm(msg)) return;
        const clean={...incoming,students,appointments,vacations,privateEntries,officeEntries,trainingRatings,settings:{...(data.settings||{}),...settings}};
        delete clean._backup;
        data=clean;
        save();
        sel=today();page='calendar';view='day';
        document.querySelectorAll('.nav,.mnav').forEach(x=>x.classList.toggle('active',x.dataset.page==='calendar'));
        render();
        toast('Backup erfolgreich importiert.');
      }catch(e){toast('Backup konnte nicht gelesen werden.');}
    };
    reader.onerror=()=>toast('Datei konnte nicht gelesen werden.');
    reader.readAsText(file);
  };

  const previousSettings=settings;
  settings=function(){
    const html=previousSettings();
    const wrap=document.createElement('div');wrap.innerHTML=html;
    const controls=wrap.querySelector('.panelbody .controls');
    if(controls){
      const exportBtn=Array.from(controls.querySelectorAll('button')).find(b=>b.textContent.includes('Backup exportieren'));
      if(exportBtn){exportBtn.textContent='⬇️ Backup exportieren';exportBtn.setAttribute('onclick','exportData()');}
      if(!controls.querySelector('.backup-import-btn')){
        const btn=document.createElement('button');btn.type='button';btn.className='btn light backup-import-btn';btn.textContent='⬆️ Backup importieren';btn.setAttribute('onclick','chooseImport()');controls.appendChild(btn);
      }
    }
    const p=wrap.querySelector('.panelbody p.sub');
    if(p) p.insertAdjacentHTML('beforebegin','<p class="sub"><b>Datensicherung:</b> Export speichert Fahrschüler, Fahrtermine, Notizen, Urlaub, Unterricht/Büro, Prüfgebiet-Bewertungen und Einstellungen. Beim Import werden die lokalen Daten dieses Geräts durch das Backup ersetzt.</p>');
    return wrap.innerHTML;
  };
  if(page==='settings') render();
})();