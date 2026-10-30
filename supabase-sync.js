/* FahrlehrerKalender NRW – optional Supabase companion build.
 * Kept on a separate GitHub branch; the existing Pages site remains unchanged.
 * Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY after restoring the selected project.
 */
(() => {
  'use strict';
  const config = window.FAHRLEHRER_SUPABASE || {};
  const MAIN_KEY = 'fahrlehrerkalender_v2';
  const LEGACY_KEY = 'fahrlehrerkalender_v1';
  const GPS_KEY = 'fahrlehrerkalender_gps_routes_v1';
  const CLOUD_TABLE = 'fahrlehrer_calendar_state';
  const app = document.getElementById('cloud-auth');
  const message = document.getElementById('cloud-message');
  const status = document.getElementById('cloud-status');
  const controls = document.getElementById('cloud-controls');
  let client, currentUser = null, revision = null, syncTimer = null, syncing = false;
  let dirty = false, applyingRemote = false, remoteSnapshot = null;

  function show(messageText, isError = false) {
    message.textContent = messageText;
    message.style.color = isError ? '#b91c1c' : '#334155';
  }
  function statusText(s) { status.textContent = s; }
  function parseJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { throw new Error('Lokale Daten beschädigt: ' + key + '. Bitte zuerst ein Backup sichern.'); }
  }
  function snapshot() {
    return { calendar_data: localStorage.getItem(MAIN_KEY) ? parseJSON(MAIN_KEY, {}) : (localStorage.getItem(LEGACY_KEY) ? parseJSON(LEGACY_KEY, {}) : JSON.parse(JSON.stringify(data))), gps_routes: parseJSON(GPS_KEY, {}) };
  }
  function validSnapshot(s) {
    return s && s.calendar_data && typeof s.calendar_data === 'object' &&
      !Array.isArray(s.calendar_data) && Array.isArray(s.calendar_data.students) &&
      Array.isArray(s.calendar_data.appointments) &&
      s.gps_routes && typeof s.gps_routes === 'object' && !Array.isArray(s.gps_routes);
  }
  function localHasContent(s) {
    const d = s.calendar_data;
    return ['students','appointments','vacations','privateEntries','officeEntries'].some(k => Array.isArray(d[k]) && d[k].length) ||
      Object.keys(s.gps_routes).length > 0 ||
      (d.trainingRatings && Object.keys(d.trainingRatings).length > 0);
  }
  function downloadBackup() {
    if (typeof window.exportData === 'function') return window.exportData();
    const file = new Blob([JSON.stringify(snapshot(), null, 2)], {type:'application/json'});
    const a = document.createElement('a'); const url = URL.createObjectURL(file);
    a.href = url; a.download = 'fahrlehrerkalender-sicherung.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function applyCloud(s) {
    if (!validSnapshot(s)) throw new Error('Der Cloud-Datensatz ist unvollständig. Keine Daten wurden ersetzt.');
    applyingRemote = true;
    try {
      localStorage.setItem(MAIN_KEY, JSON.stringify(s.calendar_data));
      localStorage.setItem(GPS_KEY, JSON.stringify(s.gps_routes));
      data = load(); // existing app global state
      render();
    } finally { applyingRemote = false; }
  }
  function makeButton(label, callback, primary = false) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ' + (primary ? 'primary' : 'light');
    b.textContent = label; b.addEventListener('click', callback);
    controls.appendChild(b);
  }
  function openApp() {
    app.hidden = true;
    document.body.classList.add('cloud-ready');
    const header = document.querySelector('.top .actions');
    if (header && !document.getElementById('cloud-sync-state')) {
      const el = document.createElement('button');
      el.id = 'cloud-sync-state'; el.type = 'button'; el.className = 'btn light';
      el.textContent = '☁ Cloud verbunden'; el.title = 'Cloud-Speicherung';
      el.onclick = () => { app.hidden = false; renderDashboard(); };
      header.prepend(el);
    }
  }
  function renderDashboard() {
    controls.replaceChildren();
    statusText('Angemeldet: ' + (currentUser?.email || 'Benutzerkonto'));
    show(dirty ? 'Änderungen sind noch nicht in Supabase gespeichert.' : 'Die Cloud-Verbindung ist aktiv.');
    makeButton('Jetzt synchronisieren', () => flush(), true);
    makeButton('JSON-Backup herunterladen', downloadBackup);
    makeButton('Schließen', () => {app.hidden = true;});
    makeButton('Abmelden', async () => {
      if (dirty) { show('Bitte erst synchronisieren oder ein Backup erstellen.'); return; }
      await client.auth.signOut();
      currentUser = null; revision = null; remoteSnapshot = null;
      document.body.classList.remove('cloud-ready');
      app.hidden = false;
      show('Abgemeldet. Lokale Daten bleiben als Sicherung auf diesem Gerät erhalten.');
      renderLogin();
    });
  }
  function renderLogin() {
    controls.replaceChildren();
    statusText('Anmeldung erforderlich');
    show('Der bestehende GitHub-Kalender bleibt unverändert. Melde dich für die Cloud-Version an.');
    const email = document.createElement('input'); email.type = 'email'; email.placeholder = 'E-Mail';
    const pass = document.createElement('input'); pass.type = 'password'; pass.placeholder = 'Passwort';
    email.autocomplete = 'email'; pass.autocomplete = 'current-password';
    controls.append(email, pass);
    makeButton('Anmelden', async () => {
      const r = await client.auth.signInWithPassword({email:email.value.trim(),password:pass.value});
      if (r.error) { show('Anmeldung fehlgeschlagen: ' + r.error.message, true); return; }
      await afterLogin(r.data.user);
    }, true);
    makeButton('Konto registrieren', async () => {
      if (!email.value.trim() || pass.value.length < 12) {
        show('Bitte E-Mail und ein Passwort mit mindestens 12 Zeichen angeben.', true); return;
      }
      const r = await client.auth.signUp({email:email.value.trim(),password:pass.value});
      if (r.error) { show('Registrierung fehlgeschlagen: ' + r.error.message, true); return; }
      show('Registrierung eingereicht. Falls E-Mail-Bestätigung aktiviert ist, bestätige zuerst die E-Mail.');
      if (r.data.session) await afterLogin(r.data.user);
    });
    makeButton('Lokale Daten als Backup sichern', downloadBackup);
  }
  async function getRemote() {
    const r = await client.from(CLOUD_TABLE).select('calendar_data,gps_routes,revision').eq('user_id',currentUser.id).maybeSingle();
    if (r.error) throw r.error;
    return r.data;
  }
  async function afterLogin(user) {
    currentUser = user;
    statusText('Cloud-Daten werden geprüft …');
    try {
      const remote = await getRemote();
      const local = snapshot();
      if (!validSnapshot(local)) throw new Error('Lokale Datenstruktur ungültig. Bitte zuerst sichern.');
      revision = remote?.revision || null;
      remoteSnapshot = remote ? {calendar_data:remote.calendar_data,gps_routes:remote.gps_routes} : null;
      controls.replaceChildren();
      if (!remote) {
        if (localHasContent(local)) {
          show('Lokale Daten gefunden. Vor dem ersten Upload bitte eine Sicherung herunterladen. Die Übertragung erfolgt nur nach deiner Bestätigung.');
          makeButton('1. JSON-Backup herunterladen', downloadBackup);
          makeButton('2. Lokale Daten in Supabase übernehmen', async () => {
            if (!confirm('Lokale Daten dieses Geräts erstmalig in dein angemeldetes Supabase-Konto übertragen?')) return;
            try {
              const r = await client.from(CLOUD_TABLE).insert({user_id:currentUser.id,...snapshot()}).select('revision').single();
              if (r.error) throw r.error;
              revision = r.data.revision; remoteSnapshot = snapshot(); dirty = false;
              openApp(); renderDashboard();
            } catch (e) {show('Übernahme fehlgeschlagen: ' + e.message, true);}
          }, true);
        } else {
          show('Noch keine Cloud-Daten vorhanden. Ein leerer Kalender wird eingerichtet.');
          makeButton('Kalender starten', async () => {
            try {
              const r = await client.from(CLOUD_TABLE).insert({user_id:currentUser.id,...snapshot()}).select('revision').single();
              if (r.error) throw r.error;
              revision = r.data.revision; remoteSnapshot = snapshot();
              openApp(); renderDashboard();
            } catch (e) {show(e.message, true);}
          }, true);
        }
      } else if (!localHasContent(local) || JSON.stringify(local) === JSON.stringify(remoteSnapshot)) {
        applyCloud(remoteSnapshot);
        openApp();
      } else {
        show('Es existieren sowohl lokale als auch Cloud-Daten. Nichts wird automatisch überschrieben. Bitte sichere die lokalen Daten und entscheide bewusst.');
        makeButton('1. Lokales JSON-Backup herunterladen', downloadBackup);
        makeButton('Cloud-Daten auf diesem Gerät verwenden', () => {
          if (!confirm('Lokale Daten werden auf diesem Gerät durch den Cloud-Stand ersetzt. Backup erstellt?')) return;
          applyCloud(remoteSnapshot); dirty = false; openApp();
        });
        makeButton('Lokale Daten als neuen Cloud-Stand übernehmen', async () => {
          if (!confirm('Der bestehende Cloud-Stand wird durch die lokalen Daten ersetzt. Hast du beide Datenstände gesichert?')) return;
          dirty = true; await flush(true);
          if (!dirty) openApp();
        }, true);
      }
    } catch (e) { show('Cloud-Verbindung fehlgeschlagen: ' + e.message, true); renderRetry(user); }
  }
  function renderRetry(user) {
    controls.replaceChildren();
    makeButton('Erneut versuchen', () => afterLogin(user), true);
    makeButton('Lokale Sicherung herunterladen', downloadBackup);
  }
  function markDirty() {
    if (applyingRemote || !currentUser || revision === null) return;
    dirty = true;
    const el = document.getElementById('cloud-sync-state');
    if (el) el.textContent = '☁ Speicherung ausstehend';
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => flush(), 1600);
  }
  async function flush(explicit = false) {
    if (!currentUser || revision === null || syncing || (!dirty && !explicit)) return;
    syncing = true;
    const s = snapshot(), expected = revision;
    try {
      const r = await client.from(CLOUD_TABLE)
        .update({...s,revision:expected + 1,updated_at:new Date().toISOString()})
        .eq('user_id',currentUser.id).eq('revision',expected)
        .select('revision').maybeSingle();
      if (r.error) throw r.error;
      if (!r.data) {
        dirty = true;
        show('Speicherkonflikt: Der Cloud-Stand wurde auf einem anderen Gerät geändert. Bitte sichere die lokalen Daten und lade neu.', true);
        return;
      }
      revision = r.data.revision;
      if (JSON.stringify(snapshot()) === JSON.stringify(s)) dirty = false;
      const el = document.getElementById('cloud-sync-state');
      if (el) el.textContent = dirty ? '☁ Speicherung ausstehend' : '☁ Gespeichert';
      if (dirty) { clearTimeout(syncTimer); syncTimer = setTimeout(() => flush(), 1600); }
    } catch (e) {
      dirty = true;
      show('Cloud-Speicherung fehlgeschlagen. Lokale Daten bleiben erhalten: ' + e.message, true);
      const el = document.getElementById('cloud-sync-state');
      if (el) el.textContent = '⚠ Cloud-Speicherfehler';
    } finally { syncing = false; }
  }
  // Both app.js save() and GPS tracking use localStorage.setItem.
  const originalSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    const result = originalSet.call(this, key, value);
    if (this === localStorage && (key === MAIN_KEY || key === GPS_KEY)) markDirty();
    return result;
  };
  window.addEventListener('beforeunload', e => {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('online', () => { if (dirty) flush(); });
  if (!config.url || !config.publishableKey || !window.supabase?.createClient) {
    statusText('Cloud-Konfiguration ausstehend');
    show('Supabase-Projekt pruefungsrouten muss erst aktiviert und konfiguriert werden. Der GitHub-Kalender bleibt online.', true);
    controls.replaceChildren();
    makeButton('Lokale Daten sichern', downloadBackup);
    return;
  }
  client = window.supabase.createClient(config.url, config.publishableKey, {
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  client.auth.getUser().then(({data:{user},error}) => {
    if (error || !user) renderLogin(); else afterLogin(user);
  }).catch(() => renderLogin());
})();
