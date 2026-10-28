(function(){
 const oldSavePrivate=savePrivate;
 savePrivate=function(){
  const current=data.privateEntries.find(x=>String(x.id)===String(pid.value));
  if(current && !pdate.value)return toast('Datum fehlt.');
  return oldSavePrivate();
 };
 const minOf=t=>{const p=String(t||'00:00').split(':').map(Number);return p[0]*60+p[1];};
 const timeOf=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
 function move(kind,id,delta){
  const list=kind==='drive'?data.appointments:kind==='private'?data.privateEntries:data.officeEntries;
  const a=list.find(x=>String(x.id)===String(id));if(!a)return;
  const duration=kind==='drive'?dur(a):Number(a.minutes||60);
  const next=minOf(a.time)+delta;
  if(next<0||next+duration>1440)return toast('Termin liegt außerhalb des Tages.');
  const other=[...data.appointments.map(x=>({kind:'drive',x})),...data.privateEntries.map(x=>({kind:'private',x})),...(data.officeEntries||[]).map(x=>({kind:'office',x}))];
  const conflicts=other.some(({kind:k,x})=>!(k===kind&&String(x.id)===String(id))&&x.date===a.date&&next<minOf(x.time)+(k==='drive'?dur(x):Number(x.minutes||60))&&next+duration>minOf(x.time));
  if(conflicts&&!confirm('Terminüberschneidung. Trotzdem verschieben?'))return;
  a.time=timeOf(next);
  if(kind==='office')a.endTime=timeOf(next+duration);
  save();render();toast('Termin um '+Math.abs(delta)+' Minuten verschoben.');
 }
 window.shiftCalendarEntry=move;
 const oldOpenPrivate=openPrivate;
 openPrivate=function(p){oldOpenPrivate(p);const b=document.querySelector('#private .mf .primary');if(b){b.type='button';b.style.pointerEvents='auto';b.style.position='relative';b.style.zIndex='2';b.onclick=function(e){e.preventDefault();e.stopPropagation();savePrivate();};}};
 const oldRender=render;
 function drawTimeline(){
  if(page!=='calendar'||view!=='week')return;
  const wrap=document.querySelector('.weekwrap'),week=wrap?.querySelector('.week');
  if(!week)return;
  const days=[...week.querySelectorAll('.weekcol')];if(days.length!==7)return;
  const start=monday(pdate(sel)),px=1,top=0;
  week.classList.add('timeline-week');
  let axis=document.createElement('div');axis.className='timeline-axis';
  for(let h=0;h<=24;h++)axis.insertAdjacentHTML('beforeend','<span style="top:'+(h*60*px)+'px">'+String(h).padStart(2,'0')+':00</span>');
  week.prepend(axis);
  days.forEach((col,i)=>{
   const ds=iso(add(start,i)),body=col.querySelector('.weekbody');if(!body)return;
   body.innerHTML='';body.classList.add('timeline-day');body.style.height=(1440*px)+'px';
   body.dataset.date=ds;
   body.addEventListener('click',e=>{
    if(e.target.closest('.timeline-entry'))return;
    const rect=body.getBoundingClientRect();
    const quarter=Math.max(0,Math.min(95,Math.floor((e.clientY-rect.top)/(15*px))));
    const time=timeOf(quarter*15);
    const choice=window.prompt('Termin ab '+time+' Uhr anlegen:\\n1 = Fahrstunde\\n2 = Büro\\n3 = Unterricht');
    if(choice==='1'){openAppt();adate.value=ds;atime.value=time;if(typeof syncAppointmentEnd==='function')syncAppointmentEnd();preview();}
    else if(choice==='2'||choice==='3'){openOffice();odate.value=ds;otime.value=time;otype.value=choice==='2'?'office':'lesson';if(typeof syncOfficeEnd==='function')syncOfficeEnd();previewOffice();}
   });
   const sr=typeof sunrise==='function'?sunrise(ds):null,ss=sunset(ds);
   for(const [label,t,cls] of [['Aufgang',sr,'rise'],['Untergang',ss,'set']]){
    if(!t)continue;const line=document.createElement('div');line.className='solar-line '+cls;line.style.top=(minOf(t)*px)+'px';line.textContent=label+' '+t;body.appendChild(line);
   }
   const entries=[...apps(ds).map(x=>({kind:'drive',x})),...privs(ds).map(x=>({kind:'private',x})),...(data.officeEntries||[]).filter(x=>x.date===ds).map(x=>({kind:'office',x}))];
   entries.forEach(({kind,x})=>{
    const duration=kind==='drive'?dur(x):Number(x.minutes||60);
    const el=document.createElement('div');el.className='timeline-entry';
    el.style.top=(minOf(x.time)*px)+'px';el.style.height=Math.max(24,duration*px-2)+'px';
    el.style.borderLeftColor=kind==='drive'?(C[x.type]||'#60a5fa'):kind==='private'?C.private:x.type==='lesson'?'#f59e0b':'#14b8a6';
    const label=kind==='drive'?sname(x.studentId):x.title;
    el.innerHTML='<b>'+esc(x.time)+'–'+timeOf(minOf(x.time)+duration)+'</b><div>'+esc(label)+'</div><div class="timeline-actions no-print"><button type="button" data-edit="1">✎</button></div>';
    el.querySelector('[data-edit]').addEventListener('click',e=>{e.stopPropagation();if(kind==='drive')editAppt(x.id);else if(kind==='private')editPrivate(x.id);else editOffice(x.id);});
    body.appendChild(el);
   });
  });
 }
 render=function(){oldRender();setTimeout(drawTimeline,80);};
 render();
})();