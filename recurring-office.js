(function(){
 const oldOpen=window.openOffice,oldSave=window.saveOffice;
 window.adjustOfficeEnd=function(delta){
  const start=document.getElementById('otime'),finish=document.getElementById('oend');
  if(!start.value||!finish.value)return;
  const next=min(finish.value)+delta;
  if(next<=min(start.value)||next>1439||next-min(start.value)>600){toast('Dauer muss zwischen 15 Minuten und 10 Stunden liegen.');return;}
  finish.value=tmin(next);previewOffice();
 };
 window.openOffice=function(entry){
  oldOpen(entry);
  document.getElementById('orepeat').value='none';
  document.getElementById('orepeatuntil').value='';
 };
 window.saveOffice=function(){
  const repeat=document.getElementById('orepeat').value;
  if(repeat==='none')return oldSave();
  if(oid.value)return toast('Wiederholungen bitte als neuen Termin anlegen.');
  if(!odate.value||!otitle.value.trim())return toast('Datum und Bezeichnung erforderlich.');
  const until=document.getElementById('orepeatuntil').value;
  if(!until||until<odate.value)return toast('Bitte gültiges Enddatum wählen.');
  const base=pdate(odate.value),limit=pdate(until);
  if(limit-base>366*86400000)return toast('Maximal ein Jahr Wiederholung.');
  const minutes=min(oend.value)-min(otime.value);
  if(minutes<=0||minutes>600)return toast('Ungültige Dauer (maximal 10 Stunden).');
  const dates=[];
  for(let n=0;n<370;n++){
   const d=new Date(base);
   if(repeat==='daily')d.setDate(d.getDate()+n);
   else if(repeat==='weekly')d.setDate(d.getDate()+n*7);
   else if(repeat==='biweekly')d.setDate(d.getDate()+n*14);
   else if(repeat==='monthly'){d.setDate(1);d.setMonth(d.getMonth()+n);if(base.getDate()>new Date(d.getFullYear(),d.getMonth()+1,0).getDate())continue;d.setDate(base.getDate());}
   if(d>limit)break;
   dates.push(iso(d));
  }
  const start=min(otime.value),end=start+minutes;
  const conflict=dates.filter(ds=>vac(ds)||[
   ...apps(ds).map(a=>({start:min(a.time),end:min(a.time)+dur(a)})),
   ...privs(ds).map(p=>({start:min(p.time),end:min(p.time)+Number(p.minutes||60)})),
   ...data.officeEntries.filter(e=>e.date===ds).map(e=>({start:min(e.time),end:min(e.time)+Number(e.minutes||60)}))
  ].some(x=>start<x.end&&end>x.start));
  if(conflict.length&&!confirm(conflict.length+' Termine überschneiden sich mit Urlaub oder bestehenden Terminen. Trotzdem alle anlegen?'))return;
  const series=id();
  data.officeEntries.push(...dates.map(ds=>({id:id(),seriesId:series,type:otype.value,title:otitle.value.trim(),date:ds,time:otime.value,endTime:oend.value,minutes,note:onote.value.trim()})));
  save();sel=odate.value;closeM('officeModal');render();toast(dates.length+' Termine angelegt.');
 };
})();