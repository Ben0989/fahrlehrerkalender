(function(){
 window.syncAppointmentEnd=function(){
  const start=document.getElementById('atime'),finish=document.getElementById('aend'),type=document.getElementById('atype');
  if(!start||!finish||!start.value)return;
  finish.value=tmin(min(start.value)+(type?.value==='exam'?60:90));
 };
 window.syncOfficeEnd=function(){
  const start=document.getElementById('otime'),finish=document.getElementById('oend');
  if(!start||!finish||!start.value)return;
  finish.value=tmin(min(start.value)+90);
 };
})();