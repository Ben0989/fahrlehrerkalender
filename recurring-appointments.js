(function(){
 const originalOpen=openAppt,originalSave=saveAppt;
 window.adjustEnd=function(delta){
  const start=document.getElementById('atime'),finish=document.getElementById('aend');
  if(!start||!finish||finish.disabled)return;
  const current=min(finish.value||start.value);
  const next=current+delta;
  if(next<=min(start.value)||next>1439||next-min(start.value)>600){toast('Dauer muss zwischen 15 Minuten und 10 Stunden liegen.');return;}
  finish.value=tmin(next);preview();
 };
 openAppt=function(a){
  originalOpen(a);
  document.getElementById('arepeat').value='none';
  document.getElementById('arepeatuntil').value='';
 };
 function dates(start,until,repeat){
  const out=[],base=pdate(start),end=pdate(until);
  if(!(base<=end))return out;
  for(let n=0;n<370;n++){
   const d=new Date(base);
   if(repeat==='daily')d.setDate(d.getDate()+n);
   else if(repeat==='weekly')d.setDate(d.getDate()+n*7);
   else if(repeat==='biweekly')d.setDate(d.getDate()+n*14);
   else if(repeat==='monthly')d.setMonth(d.getMonth()+n);
   if(d>end)break;
   const date=iso(d);
   if(!out.includes(date))out.push(date);
  }
  return out;
 }
 saveAppt=function(){
  const repeat=document.getElementById('arepeat').value;
  if(repeat==='none')return originalSave();
  if(aid.value)return toast('Wiederholungen bitte bei einem neuen Termin anlegen.');
  const until=document.getElementById('arepeatuntil').value;
  if(!until||until<adate.value)return toast('Bitte gültiges Enddatum für die Wiederholung wählen.');
  if(pdate(until)-pdate(adate.value)>366*86400000)return toast('Maximal ein Jahr Wiederholung.');
  if(!astudent.value)return toast('Bitte Fahrschüler auswählen.');
  const minutes=atype.value==='exam'?60:min(aend.value)-min(atime.value);
  if(minutes<=0||minutes>600)return toast('Ungültige Termindauer.');
  const list=dates(adate.value,until,repeat);
  const conflicts=list.filter(ds=>vac(ds)||allIntervals(ds,'drive','').some(x=>min(atime.value)<x.end&&min(atime.value)+minutes>x.start));
  if(conflicts.length&&!confirm(conflicts.length+' Termine überschneiden sich mit bestehenden Terminen oder Urlaub. Trotzdem alle anlegen?'))return;
  const series=id();
  const entries=list.map(ds=>({id:id(),seriesId:series,studentId:astudent.value,date:ds,time:atime.value,type:atype.value,minutes,transmission:atransmission.value,note:anote.value.trim()}));
  data.appointments.push(...entries);save();sel=adate.value;closeM('appt');go('calendar');toast(entries.length+' Termine angelegt.');
 };
})();