(function(){
  function syncExamDuration(){
    const type=document.getElementById('atype');
    const ue=document.getElementById('aue');
    const box=document.getElementById('dur');
    if(!type||!ue||!box) return;
    if(type.value==='exam'){
      ue.disabled=true;
      ue.style.display='none';
      const field=ue.closest('.field');
      if(field) field.style.display='none';
      box.textContent='Prüfung = 60 Minuten';
    }else{
      ue.disabled=false;
      ue.style.display='';
      const field=ue.closest('.field');
      if(field) field.style.display='';
      box.textContent=ue.value+' UE = '+(+ue.value*45)+' Min.';
    }
  }

  const priorPreview=preview;
  preview=function(){priorPreview();syncExamDuration()};

  const priorOpenAppt=openAppt;
  openAppt=function(a){priorOpenAppt(a);syncExamDuration()};

  const priorSaveAppt=saveAppt;
  saveAppt=function(){
    if(document.getElementById('atype')?.value==='exam'){
      // UE is irrelevant for exams; duration is always fixed by dur() at 60 minutes.
      aue.disabled=false;
      aue.value='1';
    }
    priorSaveAppt();
  };

  document.addEventListener('change',e=>{
    if(e.target?.id==='atype'||e.target?.id==='aue') syncExamDuration();
  });
})();