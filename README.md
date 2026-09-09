# FahrlehrerKalender NRW

Digitaler Jahres- und Terminplaner für Fahrlehrer in Nordrhein-Westfalen.

## Funktionen

- Tages-, Monats- und Jahresansicht
- Fahrschülerverwaltung mit Vorname, Nachname, Telefonnummer und Führerscheinklasse
- Automatische Dauerberechnung: 1 UE = 45 Minuten
- Praktische Prüfung = 60 Minuten
- Sonderfahrten farblich markiert:
  - Nacht = Grau
  - Autobahn = Blau
  - Überland = Gelb
  - Urlaub = Rot
- NRW-Schulferien hinterlegt
- Gesetzliche Feiertage in NRW automatisch berechnet
- Warnung bei Terminüberschneidungen
- Warnung bei Terminen innerhalb des Urlaubs
- Responsive Smartphone-Navigation
- Lokale Speicherung im Browser per localStorage
- Backup-Export als JSON

## Nutzung

Die Anwendung besteht aktuell aus einer einzelnen `index.html` und kann direkt über GitHub Pages bereitgestellt werden.

## Nächster sinnvoller Ausbau

Supabase-Anbindung für geräteübergreifende Speicherung und Synchronisierung von Fahrschülern, Terminen und Urlaub.