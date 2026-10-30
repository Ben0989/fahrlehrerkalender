(function(){
  const gpsStorageKey='fahrlehrerkalender_gps_routes_v1';
  function validGPSRoutes(value){
    return value&&typeof value==='object'&&!Array.isArray(value)&&
      Object.values(value).every(trips=>Array.isArray(trips)&&trips.every(trip=>
        trip&&typeof trip==='object'&&Array.isArray(trip.points)&&
        trip.points.every(point=>point&&Array.isArray(point.p)&&point.p.length===2&&
          point.p.every(coord=>typeof coord==='number'&&Number.isFinite(coord)))));
  }
  function readGPSRoutes(){
    const raw=localStorage.getItem(gpsStorageKey);
    if(raw===null)return {};
    const parsed=JSON.parse(raw);
    if(!validGPSRoutes(parsed))throw new Error('Ungültige GPS-Daten im Gerätespeicher');
    return parsed;
  }
  function gpsRouteCount(routes){return Object.values(routes).reduce((sum,list)=>sum+list.length,0)}
  function validBackup(obj){
    return obj&&typeof obj==='object'&&!Array.isArray(obj)&&Array.isArray(obj.students)&&Array.isArray(obj.appointments);
  }
  function backupName(){
    const stamp=new Date().toISOString().slice(0,10);
    return 'fahrlehrerkalender-backup-'+stamp+'.json';
  }
  window.exportData=function(){
    let gpsRoutes;
    try{gpsRoutes=readGPSRoutes()}catch(e){alert('Backup abgebrochen: GPS-Strecken konnten nicht gelesen werden. '+e.message);return}
    const payload={...data,gpsRoutes,_backup:{app:'FahrlehrerKalender NRW',version:4,exportedAt:new Date().toISOString()}};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=backupName();document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Backup exportiert – inklusive '+gpsRouteCount(gpsRoutes)+' GPS-Strecken.');
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
        const containsGPS=Object.prototype.hasOwnProperty.call(incoming,'gpsRoutes');
        if(containsGPS&&!validGPSRoutes(incoming.gpsRoutes))return toast('Ungültige GPS-Streckendaten im Backup.');
        const importedGPS=containsGPS?incoming.gpsRoutes:null;
        const msg='Backup importieren?\n\n'+students.length+' Fahrschüler\n'+appointments.length+' Fahrtermine\n'+officeEntries.length+' Unterricht/Büro-Termine\n'+vacations.length+' Urlaubseinträge\n\nDie aktuell gespeicherten Daten auf diesem Gerät werden ersetzt.';
        if(!confirm(msg)) return;
        const clean={...incoming,students,appointments,vacations,privateEntries,officeEntries,trainingRatings,settings:{...(data.settings||{}),...settings}};
        delete clean._backup;
        delete clean.gpsRoutes;
        // GPS-Strecken liegen separat im Browser. Bei älteren Backups ohne GPS
        // bleiben bereits gespeicherte Routen erhalten, um Datenverlust zu vermeiden.
        if(containsGPS){
          try{localStorage.setItem(gpsStorageKey,JSON.stringify(importedGPS))}
          catch(e){alert('Import abgebrochen: GPS-Strecken konnten nicht gespeichert werden (Speicherplatz prüfen).');return}
        }
        data=clean;
        save();
        sel=today();page='calendar';view='day';
        document.querySelectorAll('.nav,.mnav').forEach(x=>x.classList.toggle('active',x.dataset.page==='calendar'));
        render();
        toast('Backup erfolgreich importiert'+(containsGPS?' – inklusive '+gpsRouteCount(importedGPS)+' GPS-Strecken':'')+'.');
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
    if(p) p.insertAdjacentHTML('beforebegin','<p class="sub"><b>Datensicherung:</b> Export speichert Fahrschüler, Fahrtermine, Notizen, Urlaub, Unterricht/Büro, Prüfgebiet-Bewertungen, GPS-Fahrstrecken und Einstellungen. Beim Import werden die lokalen Daten dieses Geräts durch das Backup ersetzt.</p>');
    return wrap.innerHTML;
  };
  if(page==='settings') render();
})();