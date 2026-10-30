# FahrlehrerKalender NRW – ChatGPT-Site-Vorbereitung

Diese Entwicklung liegt ausschließlich im Branch `chatgpt-site-supabase`. Der GitHub-Pages-Stand auf `main` bleibt unverändert online.

## Bereits vorbereitet
- Anmeldemaske für Supabase Auth (E-Mail und Passwort).
- RLS-geschütztes, benutzerbezogenes JSONB-Speicherschema: `supabase/migrations/20261030_calendar_state.sql`.
- Explizite Übernahme lokaler Kalenderdaten (auch ältere `fahrlehrerkalender_v1`-Daten) und GPS-Aufzeichnungen.
- JSON-Backup vor der Migration; kein automatisches Überschreiben vorhandener Cloud-Daten.
- Debounced Synchronisierung mit Revisionsprüfung, lokale Sicherung bei Verbindungsfehlern.
- Bestehende Kalender-, Fahrschüler-, Büro-, Prüfgebiet- und GPS-Module bleiben eingebunden.

## Noch erforderlich
1. Altes Supabase-Projekt `kummerkasten` erst nach abgeschlossener Website- und Auth-Migration pausieren.
2. Das gewünschte Projekt `pruefungsrouten` (`jkeecmedgsqymiskwtcl`) wiederherstellen.
3. SQL-Migration ist im Projekt \`kummerkasten\` bereits angewendet.
4. In `index.html` die öffentliche Supabase-URL und den **Publishable Key** in `window.FAHRLEHRER_SUPABASE` eintragen. Niemals einen Service-Role-Key veröffentlichen.
5. Auth-Konfiguration, E-Mail-Bestätigung, Site-URL/Redirects und ggf. Benutzerregistrierung einstellen.
6. Die zweite Version in der gewünschten Site-Umgebung bereitstellen; Veröffentlichung einer ChatGPT Site kann nicht über GitHub allein erfolgen.
7. Migration mit Testkonto, altem Gerät, zwei Geräten, Konfliktfall, Offlinefall und GPS-Routen prüfen.

**Hinweis:** Der Code ist vorbereitet, aber nicht produktiv aktiviert oder Ende-zu-Ende getestet. Die GitHub-Pages-Seite des Hauptbranches wurde nicht geändert. Für die initiale Übernahme muss die neue Site im selben Browserprofil geöffnet werden, in dem die Daten gespeichert sind. Sind die Domains unterschiedlich, ist ein JSON-Export auf der alten Site und ein Import in der neuen Site erforderlich, weil LocalStorage pro Origin getrennt ist. In diesem Fall zunächst den vorhandenen Backup-Import nutzen, danach die Cloud-Migration bestätigen.
