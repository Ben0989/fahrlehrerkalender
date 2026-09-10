(function(){
  const originalRender = render;

  function solarTime(ds, isRise){
    const d=pdate(ds),lat=+data.settings.lat,lon=+data.settings.lon;
    if(!isFinite(lat)||!isFinite(lon)) return null;
    const rad=Math.PI/180;
    const day0=new Date(d.getFullYear(),0,0);
    const N=Math.floor((d-day0)/86400000);
    const lngHour=lon/15;
    const t=N+(((isRise?6:18)-lngHour)/24);
    const M=(0.9856*t)-3.289;
    let L=M+1.916*Math.sin(M*rad)+0.020*Math.sin(2*M*rad)+282.634;
    L=(L+360)%360;
    let RA=Math.atan(0.91764*Math.tan(L*rad))/rad;
    RA=(RA+360)%360;
    const Lq=Math.floor(L/90)*90,RAq=Math.floor(RA/90)*90;
    RA=(RA+(Lq-RAq))/15;
    const sinDec=0.39782*Math.sin(L*rad),cosDec=Math.cos(Math.asin(sinDec));
    const cosH=(Math.cos(90.833*rad)-(sinDec*Math.sin(lat*rad)))/(cosDec*Math.cos(lat*rad));
    if(cosH>1||cosH<-1) return null;
    let H=isRise?360-(Math.acos(cosH)/rad):Math.acos(cosH)/rad;
    H/=15;
    const T=H+RA-(0.06571*t)-6.622;
    const UT=(T-lngHour+24)%24;
    const utc=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(UT),Math.round((UT%1)*60)));
    return utc.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Berlin'});
  }

  window.sunrise=function(ds){return solarTime(ds,true)};

  function nightPlanningText(ds){
    const s=sunset(ds);
    if(!s) return 'Sonnenuntergang nicht verfügbar';
    return `Sonnenuntergang ${s} Uhr · Nachtfahrt sinnvoll ab Sonnenuntergang; Dämmerung/Dunkelheit und örtliche Lichtverhältnisse beachten.`;
  }

  window.shareWeek=async function(){
    const start=monday(pdate(sel));
    const lines=[`Wochenplan ${fmt(iso(start),{day:'2-digit',month:'2-digit'})} – ${fmt(iso(add(start,6)),{day:'2-digit',month:'2-digit',year:'numeric'})}`];
    for(let i=0;i<7;i++){
      const ds=iso(add(start,i));
      lines.push('',fmt(ds));
      const a=apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(`${x.time}–${end(x)}  ${sname(x.studentId)} – ${TL[x.type]}${x.type==='exam'?' (60 Min.)':' ('+x.ue+' UE)'}`));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
      const sr=sunrise(ds),ss=sunset(ds);
      if(sr||ss) lines.push(`Sonnenaufgang: ${sr||'–'} Uhr · Sonnenuntergang: ${ss||'–'} Uhr`);
    }
    const text=lines.join('\n');
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender – Wochenplan',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Wochenplan in Zwischenablage kopiert.');}
      else prompt('Wochenplan kopieren:',text);
    }catch(e){if(e.name!=='AbortError') toast('Teilen nicht möglich.');}
  };

  function enhanceCalendar(){
    if(page!=='calendar') return;
    const panelHead=document.querySelector('.panelhead .controls.no-print');

    if(view==='day'&&panelHead){
      const buttons=[...panelHead.querySelectorAll('button')];
      const twoDay=buttons.find(btn=>(btn.textContent||'').includes('2 Tage senden'));
      if(twoDay){twoDay.textContent='📤 Woche senden';twoDay.onclick=shareWeek;}
      const weekBtn=[...panelHead.querySelectorAll('button')].find(btn=>(btn.textContent||'').includes('Woche senden'));
      if(!weekBtn){
        const btn=document.createElement('button');
        btn.className='btn light';
        btn.textContent='📤 Woche senden';
        btn.onclick=shareWeek;
        panelHead.appendChild(btn);
      }
    }

    if(view==='week'&&panelHead&&!document.getElementById('shareWeekBtn')){
      const btn=document.createElement('button');
      btn.id='shareWeekBtn';
      btn.className='btn light';
      btn.textContent='📤 Woche senden';
      btn.onclick=shareWeek;
      panelHead.insertBefore(btn,panelHead.firstChild);
    }

    if(view==='day'){
      const cards=document.querySelector('.cards');
      if(cards&&!document.getElementById('sunriseCard')){
        const c=document.createElement('div');
        c.className='card';
        c.id='sunriseCard';
        const sr=sunrise(sel);
        c.innerHTML=`<div class="label">Sonnenaufgang</div><div class="metric">${sr||'–'}</div><div class="small">${esc(data.settings.location||'Standort')}</div>`;
        cards.appendChild(c);
      }
      if(cards&&!document.getElementById('nightHintCard')){
        const c=document.createElement('div');
        c.className='card';
        c.id='nightHintCard';
        const s=sunset(sel);
        c.innerHTML=`<div class="label">Nachtfahrt-Planung</div><div class="metric">${s?'ab '+s:'–'}</div><div class="small">Dämmerung/Dunkelheit und örtliche Lichtverhältnisse beachten.</div>`;
        cards.appendChild(c);
      }

      document.querySelectorAll('.event').forEach(ev=>{
        const txt=ev.textContent||'';
        if(txt.includes('Nachtfahrt')&&!ev.querySelector('.night-warning')){
          const timeText=ev.querySelector('b')?.textContent||'';
          const start=timeText.split('–')[0]?.trim(),s=sunset(sel);
          if(start&&s&&min(start)<min(s)){
            const target=ev.querySelector('div:nth-child(2)');
            if(target){
              const w=document.createElement('span');
              w.className='small night-warning';
              w.style.cssText='display:block;margin-top:4px;color:#b45309';
              w.textContent=`⚠ Beginn vor Sonnenuntergang (${s} Uhr). Dämmerung/Dunkelheit prüfen.`;
              target.appendChild(w);
            }
          }
        }
      });
    }

    if(view==='week'){
      const start=monday(pdate(sel));
      document.querySelectorAll('.weekhead').forEach((head,i)=>{
        const ds=iso(add(start,i));
        const sr=sunrise(ds),ss=sunset(ds);
        const old=[...head.querySelectorAll('.small')].find(x=>(x.textContent||'').includes('☀️↓'));
        if(old) old.textContent=`🌅 ${sr||'–'} · 🌇 ${ss||'–'}`;
        else if(!head.querySelector('.sunrise-week')){
          const info=document.createElement('div');
          info.className='small sunrise-week';
          info.style.marginTop='3px';
          info.textContent=`🌅 ${sr||'–'} · 🌇 ${ss||'–'}`;
          head.appendChild(info);
        }
      });
    }
  }

  render=function(){originalRender();setTimeout(enhanceCalendar,0)};

  const originalOpenAppt=openAppt;
  openAppt=function(a){originalOpenAppt(a);updateNightHint()};
  const originalPreview=preview;
  preview=function(){originalPreview();updateNightHint()};

  function updateNightHint(){
    const durBox=document.getElementById('dur');
    if(!durBox||!document.getElementById('atype')) return;
    document.getElementById('nightPlanHint')?.remove();
    if(atype.value!=='night') return;
    const ds=adate.value||sel;
    const hint=document.createElement('div');
    hint.id='nightPlanHint';
    hint.className='dur';
    hint.style.cssText='margin-top:8px;background:#fff7ed;color:#9a3412';
    hint.textContent=nightPlanningText(ds);
    durBox.insertAdjacentElement('afterend',hint);
  }

  document.addEventListener('change',e=>{if(e.target?.id==='adate'||e.target?.id==='atype') updateNightHint()});

  originalRender();
  setTimeout(enhanceCalendar,0);
})();