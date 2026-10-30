(function(){
'use strict';
const key='fahrlehrerkalender_gps_routes_v1';
let active=null,watchId=null,map=null,layer=null,leafletPromise=null;
const escText=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function routes(){try{const x=JSON.parse(localStorage.getItem(key)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function persist(obj){try{localStorage.setItem(key,JSON.stringify(obj));return true}catch(e){alert('GPS-Route konnte nicht gespeichert werden. Gerätespeicher prüfen.');return false}}
function currentStudent(){return data.trainingStudentId||''}
function getRoutes(id){return (routes()[id]||[]).slice().reverse()}
function labelTime(ms){return new Date(ms).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function distance(a,b){const R=6371000,rad=x=>x*Math.PI/180;const dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);const x=Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function status(message){const el=document.getElementById('gps-record-status');if(el)el.textContent=message}
function updateButtons(){const start=document.getElementById('gps-start'),stop=document.getElementById('gps-stop');if(start)start.disabled=!!active||!currentStudent();if(stop)stop.disabled=!active}
window.startTrainingGPS=function(){
 if(active)return;
 const studentId=currentStudent();if(!studentId)return alert('Bitte zuerst einen Fahrschüler auswählen.');
 if(!navigator.geolocation)return alert('GPS wird von diesem Browser nicht unterstützt.');
 if(!window.isSecureContext)return alert('GPS benötigt HTTPS.');
 active={studentId,started:Date.now(),points:[]};
 try{
 watchId=navigator.geolocation.watchPosition(pos=>{
  if(!active)return;
  const p=[pos.coords.latitude,pos.coords.longitude];
  if(!Number.isFinite(p[0])||!Number.isFinite(p[1])||pos.coords.accuracy>100)return;
  const last=active.points[active.points.length-1];
  if(last&&distance(last.p,p)<7&&pos.timestamp-last.t<15000)return;
  active.points.push({p,t:pos.timestamp,accuracy:pos.coords.accuracy});
  status('GPS läuft · '+active.points.length+' Messpunkte · Genauigkeit ca. '+Math.round(pos.coords.accuracy)+' m');
 },err=>{status('GPS-Fehler: '+err.message+'. Standortberechtigung prüfen.');},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
 }catch(e){active=null;alert('GPS konnte nicht gestartet werden: '+e.message)}
 updateButtons();
};
async function matchRoads(points){
 // OSRM map-matching service: route follows the road network instead of straight GPS connectors.
 // Process small overlapping chunks; reject missing matches rather than inventing a road route.
 const result=[];
 for(let offset=0;offset<points.length-1;offset+=70){
  const chunk=points.slice(offset,Math.min(points.length,offset+71));
  if(chunk.length<2)break;
  const coords=chunk.map(x=>x.p[1].toFixed(6)+','+x.p[0].toFixed(6)).join(';');
  const timestamps=chunk.map(x=>Math.floor(x.t/1000)).join(';');
  const url='https://router.project-osrm.org/match/v1/driving/'+coords+'?overview=full&geometries=geojson&gaps=split&tidy=true&timestamps='+timestamps;
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const res=await fetch(url,{signal:controller.signal});if(!res.ok)throw Error('HTTP '+res.status);
   const json=await res.json();
   if(json.code!=='Ok'||!Array.isArray(json.matchings)||!json.matchings.length)throw Error('Keine Straßenanpassung');
   const segments=json.matchings.map(x=>x.geometry?.coordinates?.map(c=>[c[1],c[0]])).filter(Boolean);
   if(!segments.length)throw Error('Keine Geometrie');
   for(const segment of segments)result.push(segment);
  }finally{clearTimeout(timeout)}
 }
 return result.length?result:null;
}
window.stopTrainingGPS=async function(){
 if(!active)return;
 if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;
 const trip=active;active=null;updateButtons();
 if(trip.points.length<2){status('Zu wenige GPS-Punkte. Mindestens zwei Messpunkte erforderlich.');return}
 status('Aufzeichnung beendet. Straßenverlauf wird berechnet …');
 const entry={id:String(Date.now()),started:trip.started,ended:Date.now(),points:trip.points,matched:null};
 let matched=false;
 try{entry.matched=await matchRoads(trip.points);matched=!!entry.matched}catch(e){console.warn('GPS Map Matching nicht verfügbar',e)}
 const all=routes();(all[trip.studentId]||(all[trip.studentId]=[])).push(entry);
 if(!persist(all))return;
 status(matched?'Route gespeichert und an Straßen angepasst.':'GPS-Route gespeichert. Straßenanpassung derzeit nicht verfügbar.');
 if(page==='practice')render();
};
window.deleteTrainingGPS=function(id){const sid=currentStudent();if(!sid||!confirm('Diese GPS-Aufzeichnung endgültig löschen?'))return;const all=routes();all[sid]=(all[sid]||[]).filter(r=>r.id!==id);persist(all);render()};
function loadLeaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=new Promise((resolve,reject)=>{
  if(!document.querySelector('link[data-gps-leaflet]')){const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';css.dataset.gpsLeaflet='1';document.head.appendChild(css)}
  const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.onload=()=>resolve(window.L);script.onerror=()=>reject(Error('Kartendienst konnte nicht geladen werden'));document.head.appendChild(script);
 });
 return leafletPromise;
}
window.showTrainingGPS=async function(id){
 const sid=currentStudent(),entry=(routes()[sid]||[]).find(r=>r.id===id);
 if(!entry)return;
 const el=document.getElementById('gps-route-map');if(!el)return;
 el.hidden=false;
 document.getElementById('gps-map-caption').textContent=labelTime(entry.started)+(entry.matched?' · Straßenangepasste Route':' · GPS-Messpunkte (nicht straßenangepasst)');
 try{
  const L=await loadLeaflet();
  if(map){map.remove();map=null}
  map=L.map(el,{scrollWheelZoom:false});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap-Mitwirkende'}).addTo(map);
  const raw=entry.points.map(x=>x.p);
  const lines=entry.matched?.length?entry.matched:[raw];
  const paths=lines.map(line=>L.polyline(line,{color:entry.matched?'#2563eb':'#f97316',weight:5,opacity:.9,dashArray:entry.matched?null:'6,7'}).addTo(map));
  L.circleMarker(raw[0],{radius:6,color:'#15803d',fillOpacity:1}).addTo(map).bindPopup('Start');
  L.circleMarker(raw[raw.length-1],{radius:6,color:'#dc2626',fillOpacity:1}).addTo(map).bindPopup('Ende');
  const bounds=L.featureGroup(paths).getBounds();if(bounds.isValid())map.fitBounds(bounds.pad(.12));
  setTimeout(()=>map?.invalidateSize(),100);
 }catch(e){el.textContent='Karte konnte nicht geladen werden: '+e.message}
};
function mount(){
 if(page!=='practice')return;
 const toolbar=document.querySelector('.route-toolbar');
 if(!toolbar)return;
 const box=document.createElement('div');box.className='gps-controls no-print';
 box.innerHTML='<button id="gps-start" class="btn primary" type="button" onclick="startTrainingGPS()">📍 GPS Start</button><button id="gps-stop" class="btn light" type="button" onclick="stopTrainingGPS()">■ GPS Ende</button><span id="gps-record-status" role="status">'+(active?'GPS-Aufzeichnung läuft · '+active.points.length+' Punkte':'Standortfreigabe beim Start erforderlich. GPS-Aufzeichnung nur bei geöffneter App.')+'</span>';
 toolbar.insertAdjacentElement('afterend',box);
 updateButtons();
 const sid=currentStudent(),items=sid?getRoutes(sid):[];
 const section=document.createElement('section');section.className='gps-routes-section panel';
 section.innerHTML='<h3>Aufgezeichnete Fahrstrecken</h3>'+(sid?(items.length?items.map(r=>'<div class="gps-route-item"><span>'+escText(labelTime(r.started))+' · '+r.points.length+' GPS-Punkte'+(r.matched?' · Straßenverlauf':' · Rohdaten')+'</span><button class="btn light" type="button" data-show="'+escText(r.id)+'">Karte anzeigen</button><button class="btn light" type="button" data-delete="'+escText(r.id)+'">Löschen</button></div>').join(''):'<p>Noch keine GPS-Strecken für diesen Fahrschüler.</p>'):'<p>Bitte zuerst einen Fahrschüler auswählen.</p>')+'<p id="gps-map-caption" class="small"></p><div id="gps-route-map" hidden></div><p class="small">Straßenanpassung über einen externen Routingdienst; Kartendaten © OpenStreetMap. GPS-Genauigkeit und Straßenanpassung können abweichen.</p>';
 document.querySelector('main')?.appendChild(section);
 section.querySelectorAll('[data-show]').forEach(b=>b.addEventListener('click',()=>window.showTrainingGPS(b.dataset.show)));
 section.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>window.deleteTrainingGPS(b.dataset.delete)));
}
const previousRender=render;
render=function(){previousRender();if(page==='practice')mount()};
if(page==='practice')mount();
})();