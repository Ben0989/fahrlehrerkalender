(function(){
'use strict';
const DIAGRAMM = {

"Grundstufe":[
"Besonderheiten beim Einsteigen",
"Sitz einstellen",
"Spiegel einstellen",
"Lenkrad einstellen",
"Kopfstütze einstellen",
"Lenkradhaltung",
"Pedale",
"Gurt anlegen / anpassen",
"Motor anlassen",
"Anfahr-/Anhalteübungen",
"Schaltübungen hoch 1-2",
"Schaltübungen hoch 2-3",
"Schaltübungen hoch 3-4",
"Schaltübungen runter 4-3",
"Schaltübungen runter 3-2",
"Schaltübungen runter 2-1",
"Lenkübungen"
],

"Aufbaustufe":[
"Rollen und Schalten",
"Abbremsen und Schalten",
"Bremsübung degressiv",
"Bremsübung Zielbremsung",
"Bremsübung Gefahrsituationen",
"Gefälle Anhalten",
"Gefälle Anfahren",
"Gefälle Rückwärts",
"Gefälle Sichern",
"Gefälle Schalten",
"Steigung Anhalten",
"Steigung Anfahren",
"Steigung Rückwärts",
"Steigung Sichern",
"Steigung Schalten",
"Tastgeschwindigkeit",
"Bedienungs- und Kontrolleinrichtungen",
"Örtliche Besonderheiten"
],

"Leistungsstufe":[
"Einordnen",
"Markierungen",
"Fahrstreifenwechsel links",
"Fahrstreifenwechsel rechts",
"Vorbeifahren / Überholen",
"Abbiegen rechts",
"Abbiegen links",
"Abbiegen mehrspurig",
"Radweg",
"Straßenbahn",
"Sonderfahrstreifen",
"Einbahnstraße",
"Vorfahrt rechts vor links",
"Vorfahrt Polizeibeamte",
"Vorfahrt Grünpfeil",
"Vorfahrt Grünpfeil-Schild",
"Geschwindigkeit / Abstand",
"Fußgängerüberwege",
"Öffentliche Verkehrsmittel",
"Ältere / Behinderte",
"Einbahnstraße / Radfahrer",
"Kinder",
"Schulbus",
"Radfahrer / Mofa",
"Verkehrsberuhigter Bereich",
"Schwierige Verkehrsführung",
"Engpass",
"Kreisverkehr",
"Bahnübergang warten",
"Hauptverkehrszeiten",
"Partnerschaftliches Verhalten",
"Schwung nutzen",
"Fußgänger Schutzbereich"
],

"Grundfahraufgaben":[
"Rückwärtsfahren",
"Umkehren",
"Gefahrenbremsung",
"Einparken längs vorwärts links",
"Einparken längs vorwärts rechts",
"Einparken längs rückwärts links",
"Einparken längs rückwärts rechts",
"Einparken quer vorwärts links",
"Einparken quer vorwärts rechts",
"Einparken quer rückwärts links",
"Einparken quer rückwärts rechts"
],

"Überland":[
"Angepasste Geschwindigkeit / Gangwahl",
"Abstand vorne",
"Abstand hinten",
"Abstand seitlich",
"Beobachtung / Spiegel",
"Verkehrszeichen",
"Kreuzungen / Einmündungen",
"Kurven",
"Steigungen",
"Gefälle",
"Alleen",
"Überholen",
"Liegenbleiben und Absichern",
"Einfahren in Ortschaften",
"Fußgänger",
"Wild / Tiere",
"Leistungsgrenze",
"Ablenkung",
"Orientierung"
],

"Autobahn":[
"Fahrtplanung",
"Einfahren in BAB",
"Fahrstreifenwahl",
"Geschwindigkeit",
"Abstand vorne",
"Abstand hinten",
"Abstand seitlich",
"Überholen",
"Schilder / Markierungen",
"Vorbeifahren Anschlussstellen",
"Rastplätze / Tankstellen",
"Verhalten bei Unfällen",
"Dichter Verkehr / Stau",
"Leistungsgrenze",
"Ablenkung",
"Konfliktsituationen",
"Verlassen der BAB"
],

"Dunkelheit":[
"Beleuchtung Kontrolle",
"Beleuchtung Einstellen",
"Beleuchtung Benutzung",
"Fernlicht",
"Beleuchtete Straßen",
"Unbeleuchtete Straßen",
"Parken",
"Schlechte Witterung",
"Bahnübergänge",
"Tiere",
"Unbeleuchtete Verkehrsteilnehmer",
"Blendung",
"Orientierung",
"Abschlussbesprechung"
],

"Reife-, Teststufe":[
"Selbstständiges Fahren innerorts",
"Selbstständiges Fahren außerorts",
"Verantwortungsbewusstes Fahren",
"Testfahrt Prüfungsbedingungen FAKT",
"Testfahrt Prüfungsbedingungen andere",
"Wiederholung / Vertiefung",
"Leistungsbewertung"
],

"Situative Bausteine":[
"Reifen Beschädigung",
"Reifen Profiltiefe",
"Reifen Reifendruck",
"Scheinwerfer Einschalten",
"Scheinwerfer Ausschalten",
"Standlicht",
"Abblendlicht",
"Fernlicht",
"Schlussleuchten mit Kennzeichenbeleuchtung",
"Nebelschlussleuchte",
"Warnblinkanlage",
"Blinker",
"Hupe",
"Bremsleuchte",
"Kontrollleuchten benennen",
"Rückstrahler vorhanden",
"Rückstrahler beschädigt",
"Lenkschloss entriegeln",
"Lenkspiel prüfen",
"Betriebsbremse",
"Feststellbremse"
],

"Fahrerassistenzsysteme":[
"Einschalten",
"Ausschalten",
"Anwenden"
],

"Heizung und Lüftung":[
"Heizung",
"Lüftung",
"Klimaanlage",
"Heckscheibenheizung",
"Sonderausstattung",
"Keine unnötigen Verbraucher",
"Rechtzeitiges Abschalten"
],

"Betriebs- und Verkehrssicherheit":[
"Motoröl",
"Kühlmittel",
"Scheibenwaschflüssigkeit",
"Warndreieck",
"Verbandskasten",
"Bordwerkzeug",
"Zusätzliche Ausrüstung",
"Scheiben / Wischer",
"Spiegel",
"Kennzeichen",
"Beleuchtung",
"Bremsen",
"Ladungssicherung",
"Ladungskennzeichnung"
],

"Witterung":[
"Lüftung",
"Scheibenwischer / Wasser",
"Regen / Sprühnebel",
"Aquaplaning",
"Wind / Sturm / Böen",
"Schnee / Matsch",
"Eis"
]

}

const trailer = {
  Grundstufe: ['Fahrzeug und Anhänger kontrollieren','Anhänger ankuppeln','Sicherung, Elektrik und Beleuchtung prüfen','Spiegel einstellen'],
  Aufbaustufe: ['Anfahren und Anhalten mit Anhänger','Kurven und Abbiegen mit Anhänger','Bremsen und Abstand einschätzen','Rückwärts geradeaus rangieren'],
  Leistungsstufe: ['Fahrstreifenwahl und Spurwechsel','Engstellen und Begegnungsverkehr','Geschwindigkeit und Abstand anpassen'],
  Grundfahraufgaben: ['Rückwärtsfahren um eine Ecke nach links','Anhänger trennen und sichern','Anhänger verbinden und Abfahrtskontrolle durchführen'],
  Überland: ['Kurven, Steigungen und Gefälle','Vorausschauend fahren'],
  Autobahn: ['Einfahren, Fahrstreifenwahl und Ausfahren','Geschwindigkeit und Abstand'],
  Dunkelheit: ['Beleuchtung prüfen und benutzen','Abstände und Fahrzeugbreite einschätzen'],
  'Reife-, Teststufe': ['Selbstständiges Fahren mit Anhänger','Testfahrt unter Prüfungsbedingungen','Wiederholung und Vertiefung'],
  'Situative Bausteine': ['Ladung und Ladungssicherung','Stützlast und Gewichte kontrollieren','Reifen und Beleuchtung prüfen']
};
const blocks = [
  ['Grundstufe','Einweisung und Bedienung','basic'],
  ['Aufbaustufe','Vorausschauendes Fahren und Blickschulung','build'],
  ['Leistungsstufe','Anspruchsvolle Verkehrssituationen','performance'],
  ['Grundfahraufgaben','','tasks'],
  ['Überland','Besondere Ausbildungsfahrten','country'],
  ['Autobahn','Besondere Ausbildungsfahrten','motorway'],
  ['Dunkelheit','Dämmerung und Dunkelheit','night'],
  ['Reife-, Teststufe','Abschluss und Prüfungsvorbereitung','test','Reife- und Teststufe'],
  ['Situative Bausteine','Fahrtechnische Vorbereitung','situational'],
  ['Fahrerassistenzsysteme','','assistance'],
  ['Heizung und Lüftung','','heating'],
  ['Betriebs- und Verkehrssicherheit','','safety'],
  ['Witterung','','weather']
];
const dialog = document.getElementById('studentDiagram');
const sheet = dialog.querySelector('.diagram-sheet');
function openDiagram(studentId){
  const student = data.students.find(entry => String(entry.id) === String(studentId));
  if (!student) return;
  const be = (student.cls || '').trim().toUpperCase() === 'BE';
  const variant = be ? 'BE' : 'B';
  const catalog = be ? trailer : DIAGRAMM;
  const checked = new Set(Array.isArray(student.diagramProgress?.[variant]) ? student.diagramProgress[variant] : []);
  dialog.querySelector('.diagram-student').textContent = [student.first, student.last, student.cls].filter(Boolean).join(' · ');
  sheet.innerHTML = blocks.filter(([group]) => catalog[group]).map(([group, subtitle, style, title]) => {
    const rows = catalog[group].map(item => {
      const key = group + ' / ' + item;
      return '<label><span>'+esc(item)+'</span><input type="checkbox" value="'+esc(key)+'"'+(checked.has(key)?' checked':'')+'></label>';
    }).join('');
    return '<section class="diagram-block diagram-'+style+'"><header><h3>'+esc(title || group)+'</h3><small>'+esc(subtitle)+'</small><output></output></header>'+rows+'</section>';
  }).join('');
  function refreshCounts(){
    for (const section of sheet.querySelectorAll('section')) {
      section.querySelector('output').textContent = section.querySelectorAll('input:checked').length + ' / ' + section.querySelectorAll('input').length;
    }
  }
  sheet.onchange = () => {
    const current = data.students.find(entry => String(entry.id) === String(studentId));
    if (!current) { dialog.close(); return; }
    current.diagramProgress = {
      ...current.diagramProgress,
      [variant]: Array.from(sheet.querySelectorAll('input:checked'), input => input.value)
    };
    save();
    refreshCounts();
  };
  refreshCounts();
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}
window.openStudentDiagram = openDiagram;
})();
