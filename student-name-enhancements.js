(function(){
  function studentLine(a){
    return `${a.time}–${end(a)}  ${sname(a.studentId)} – ${TL[a.type]}${a.type==='exam'?' (60 Min.)':' ('+a.ue+' UE)'}`;
  }

  function addStudentOverview(){
    if(page!=='calendar'||view!=='day') return;
    const cards=document.querySelector('.cards');
    if(!cards||document.getElementById('studentOverviewCard')) return;
    const todays=apps(sel);
    const card=document.createElement('div');
    card.className='card';
    card.id='studentOverviewCard';
    card.innerHTML=`<div class="label">Fahrschüler heute</div>${todays.length
      ? `<div style="margin-top:7px;display:grid;gap:4px">${todays.map(a=>`<div><b>${esc(a.time)}</b> · ${esc(sname(a.studentId))}</div>`).join('')}</div>`
      : '<div class="small" style="margin-top:7px">Keine Fahrschüler-Termine.</div>'}`;
    cards.appendChild(card);
  }

  const previousRender=render;
  render=function(){previousRender();setTimeout(addStudentOverview,0)};

  window.shareText=function(days){
    const lines=['Fahrplan ab '+fmt(sel)];
    for(let i=0;i<days;i++){
      const ds=iso(add(pdate(sel),i));
      lines.push('',fmt(ds));
      const a=apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(studentLine(x)));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
    }
    return lines.join('\n');
  };

  window.shareDays=async function(days){
    const text=shareText(days);
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Plan in Zwischenablage kopiert.');}
      else prompt('Plan kopieren:',text);
    }catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  window.shareWeek=async function(){
    const start=monday(pdate(sel));
    const lines=[`Wochenplan ${fmt(iso(start),{day:'2-digit',month:'2-digit'})} – ${fmt(iso(add(start,6)),{day:'2-digit',month:'2-digit',year:'numeric'})}`];
    for(let i=0;i<7;i++){
      const ds=iso(add(start,i));
      lines.push('',fmt(ds));
      const a=apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(studentLine(x)));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
      const sr=typeof sunrise==='function'?sunrise(ds):null,ss=sunset(ds);
      if(sr||ss) lines.push(`Sonnenaufgang: ${sr||'–'} Uhr · Sonnenuntergang: ${ss||'–'} Uhr`);
    }
    const text=lines.join('\n');
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender – Wochenplan',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Wochenplan in Zwischenablage kopiert.');}
      else prompt('Wochenplan kopieren:',text);
    }catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  setTimeout(addStudentOverview,0);
})();