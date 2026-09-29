(function(){
  const ueText=minutes=>{
    const value=(Number(minutes)||0)/45;
    return (Number.isInteger(value)?String(value):value.toLocaleString('de-DE',{maximumFractionDigits:2}))+' UE';
  };
  const completed=a=>{
    const now=today();
    if(a.date<now) return true;
    if(a.date>now) return false;
    const d=new Date(),nowMin=d.getHours()*60+d.getMinutes();
    return min(a.time)+dur(a)<=nowMin;
  };
  const range=()=>{
    const d=pdate(sel);
    if(view==='day') return [sel,sel];
    if(view==='week'){const s=monday(d);return [iso(s),iso(add(s,6))];}
    if(view==='month'){return [iso(new Date(d.getFullYear(),d.getMonth(),1)),iso(new Date(d.getFullYear(),d.getMonth()+1,0))];}
    return [d.getFullYear()+'-01-01',d.getFullYear()+'-12-31'];
  };
  function injectUE(){
    if(page!=='calendar'||!['day','week','month'].includes(view)) return;
    const [from,to]=range();
    const minutes=data.appointments.filter(a=>a.type!=='exam'&&a.date>=from&&a.date<=to&&completed(a)).reduce((sum,a)=>sum+dur(a),0);
    let cards=document.querySelector('.cards');
    if(!cards){
      const head=document.querySelector('#main .head');
      if(!head)return;
      cards=document.createElement('div');cards.className='cards calendar-ue-cards';head.insertAdjacentElement('afterend',cards);
    }
    let card=cards.querySelector('.calendar-total-ue');
    if(!card){card=document.createElement('div');card.className='card calendar-total-ue';cards.appendChild(card);}
    card.innerHTML=`<div class="label">Gefahrene UE · ${view==='day'?'Tag':view==='week'?'Woche':'Monat'}</div><div class="metric">${ueText(minutes)}</div><div class="small">45 Min. = 1 UE · Prüfungen nicht eingerechnet</div>`;
  }
  function makeStudentClickable(){
    if(page!=='calendar'||!['day','week','month'].includes(view))return;
    const map=new Map(data.students.map(s=>[(s.first+' '+s.last).trim(),s.id]));
    const candidates=document.querySelectorAll('.event strong,.weekevent,.badge');
    candidates.forEach(el=>{
      let match=null;
      for(const [name,id] of map){
        const text=el.textContent||'';
        if(text.includes(name)){match={name,id};break;}
      }
      if(!match)return;
      if(el.querySelector?.('.calendar-student-link')||el.classList.contains('calendar-student-link'))return;
      if(el.matches('.event strong')){
        el.classList.add('calendar-student-link');el.dataset.studentId=match.id;
      }else{
        const nodes=[...el.childNodes];
        const textNode=nodes.find(n=>n.nodeType===3&&String(n.textContent).includes(match.name));
        if(textNode){
          const span=document.createElement('span');span.className='calendar-student-link';span.dataset.studentId=match.id;span.textContent=match.name;
          textNode.textContent=String(textNode.textContent).replace(match.name,'');el.insertBefore(span,textNode.nextSibling);
        }else{
          el.classList.add('calendar-student-link');el.dataset.studentId=match.id;
        }
      }
    });
  }
  document.addEventListener('click',e=>{
    const target=e.target.closest('.calendar-student-link');
    if(!target)return;
    if(e.target.closest('button'))return;
    e.preventDefault();e.stopPropagation();
    const studentId=target.dataset.studentId;
    if(typeof window.openStudentAppointments==='function') window.openStudentAppointments(studentId);
  });
  const previousRender=render;
  render=function(){previousRender();setTimeout(()=>{injectUE();makeStudentClickable();},30);};
  render();
})();