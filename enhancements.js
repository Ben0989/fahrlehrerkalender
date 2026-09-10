(function(){
  const originalRender = render;

  function nightPlanningText(ds){
    const s = sunset(ds);
    if(!s) return 'Sonnenuntergang nicht verfügbar';
    return `Sonnenuntergang ${s} Uhr · Nachtfahrt sinnvoll ab Sonnenuntergang; Dämmerung/Dunkelheit und örtliche Lichtverhältnisse beachten.`;
  }

  function enhanceCalendar(){
    if(page !== 'calendar') return;

    const panelHead = document.querySelector('.panelhead .controls.no-print');

    if(view === 'day' && panelHead){
      const buttons = [...panelHead.querySelectorAll('button')];
      const twoDayButton = buttons.find(btn => (btn.textContent || '').includes('2 Tage senden'));
      if(twoDayButton){
        twoDayButton.textContent = '📤 Woche senden';
        twoDayButton.onclick = shareWeek;
      }
    }

    if(view === 'week' && panelHead && !document.getElementById('shareWeekBtn')){
      const btn = document.createElement('button');
      btn.id = 'shareWeekBtn';
      btn.className = 'btn light';
      btn.textContent = '📤 Woche senden';
      btn.onclick = shareWeek;
      panelHead.insertBefore(btn, panelHead.firstChild);
    }

    if(view === 'day'){
      const cards = document.querySelector('.cards');
      if(cards && !document.getElementById('nightHintCard')){
        const c = document.createElement('div');
        c.className = 'card';
        c.id = 'nightHintCard';
        const s = sunset(sel);
        c.innerHTML = `<div class="label">Nachtfahrt-Planung</div><div class="metric">${s ? 'ab '+s : '–'}</div><div class="small">Beleuchtungsfahrten bei Dämmerung oder Dunkelheit. Wetter und örtliche Lichtverhältnisse beachten.</div>`;
        cards.appendChild(c);
      }

      document.querySelectorAll('.event').forEach(ev=>{
        const txt = ev.textContent || '';
        if(txt.includes('Nachtfahrt') && !ev.querySelector('.night-warning')){
          const timeText = ev.querySelector('b')?.textContent || '';
          const start = timeText.split('–')[0]?.trim();
          const s = sunset(sel);
          if(start && s && min(start) < min(s)){
            const target = ev.querySelector('div:nth-child(2)');
            if(target){
              const w = document.createElement('span');
              w.className = 'small night-warning';
              w.style.display = 'block';
              w.style.marginTop = '4px';
              w.style.color = '#b45309';
              w.textContent = `⚠ Beginn vor Sonnenuntergang (${s} Uhr). Dämmerung/Dunkelheit prüfen.`;
              target.appendChild(w);
            }
          }
        }
      });
    }
  }

  render = function(){
    originalRender();
    setTimeout(enhanceCalendar,0);
  };

  window.shareWeek = async function(){
    const start = monday(pdate(sel));
    const lines = [`Wochenplan ${fmt(iso(start),{day:'2-digit',month:'2-digit'})} – ${fmt(iso(add(start,6)),{day:'2-digit',month:'2-digit',year:'numeric'})}`];

    for(let i=0;i<7;i++){
      const ds = iso(add(start,i));
      lines.push('', fmt(ds));
      const a = apps(ds);
      if(!a.length) lines.push('Keine Fahrschüler-Termine.');
      else a.forEach(x=>lines.push(`${x.time}–${end(x)}  ${sname(x.studentId)} – ${TL[x.type]}${x.type==='exam'?' (60 Min.)':' ('+x.ue+' UE)'}`));
      if(privs(ds).length) lines.push('Privater Termin vorhanden (Details ausgeblendet).');
      const ss = sunset(ds);
      if(ss) lines.push(`Sonnenuntergang: ${ss} Uhr`);
    }

    const text = lines.join('\n');
    try{
      if(navigator.share) await navigator.share({title:'FahrlehrerKalender – Wochenplan',text});
      else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Wochenplan in Zwischenablage kopiert.');}
      else prompt('Wochenplan kopieren:',text);
    }catch(e){
      if(e.name!=='AbortError') toast('Teilen nicht möglich.');
    }
  };

  const originalOpenAppt = openAppt;
  openAppt = function(a){
    originalOpenAppt(a);
    updateNightHint();
  };

  const originalPreview = preview;
  preview = function(){
    originalPreview();
    updateNightHint();
  };

  function updateNightHint(){
    const durBox = document.getElementById('dur');
    if(!durBox || !document.getElementById('atype')) return;
    const existing = document.getElementById('nightPlanHint');
    if(existing) existing.remove();
    if(atype.value !== 'night') return;
    const ds = adate.value || sel;
    const hint = document.createElement('div');
    hint.id = 'nightPlanHint';
    hint.className = 'dur';
    hint.style.marginTop = '8px';
    hint.style.background = '#fff7ed';
    hint.style.color = '#9a3412';
    hint.textContent = nightPlanningText(ds);
    durBox.insertAdjacentElement('afterend',hint);
  }

  document.addEventListener('change',e=>{
    if(e.target?.id==='adate' || e.target?.id==='atype') updateNightHint();
  });

  originalRender();
  setTimeout(enhanceCalendar,0);
})();