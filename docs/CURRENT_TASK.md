# Current Task

**Stand:** 2026-07-18

## Aktueller Stand

Die projekt-eigenen Markdown-Dateien wurden gegen Code, Konfiguration,
Migrationen und die bestätigten Produktentscheidungen konsolidiert.

Im aktuellen Arbeitsbaum nachvollziehbar sind:

- klar getrennte Dokumentrollen für technischen Ist-Zustand, fachliches
  Zielmodell, Entscheidungen, Scope, Tests und Pilotrisiken,
- konsistente Rollen-, Trainings-, RSVP-, Guardian-, Datenschutz- und
  Deployment-Regeln,
- ein als historisch markiertes `PROJECT_STATUS.md`,
- der durch `DEC-012` dokumentierte Handoff über `PROJECT_BRIEF.md` plus
  `CURRENT_TASK.md`,
- ausschließlich Markdown-Änderungen im vorgesehenen Dokumentations-Diff.

Die abschließenden Übergabe- und Pflegekorrekturen sind ebenfalls erledigt:

- gemeinsame Regeln für Codex und Claude stehen zentral in `AGENTS.md`,
- `PROJECT_BRIEF.md` plus `CURRENT_TASK.md` ersetzen den redundanten
  ChatGPT-Handoff,
- Roadmap-Priorität und Manifest/PWA-Phasengrenze sind eindeutig,
- Bestands-, Ziel- und Pilotprüfungen sind sauber getrennt,
- lokales Onboarding und flüchtige Übergabeangaben wurden bereinigt,
- Querverweise, Feature-/Flow-/Decision-IDs und `git diff --check` wurden
  erfolgreich geprüft.

## Verbleibender Schritt

Der Dokumentationsstand wurde lokal committed. `.claude/settings.local.json`
war nicht Teil des Commits. Branch und Commit lassen sich bei Bedarf direkt
mit Git ermitteln. Push bleibt weiterhin ein eigener, ausdrücklich
freizugebender Schritt.

## Nächste Produkt-/Technikarbeit

Nach dem Dokumentationscommit wird `CURRENT_TASK.md` auf einen einzelnen,
freigegebenen Entwicklungsauftrag umgestellt.

Als kleine risikoarme erste Aufgabe ist weiterhin vorgesehen:

- `/manifest.webmanifest` im App-Routing ohne Login-Weiterleitung korrekt
  ausliefern,
- einen passenden Routentest ergänzen,
- geschützte Anwendungsrouten unverändert geschützt lassen.

Nicht Teil dieser ersten Aufgabe sind vollständige PWA-Installierbarkeit,
Service Worker, Offlinebetrieb, Push oder native Apps.

## Harte Grenzen

- keine Remote-Datenbank ohne separate ausdrückliche Freigabe,
- kein `db push`,
- kein `db reset` ohne ausdrückliche Freigabe in der aktuellen Sitzung,
- keine Secrets oder `.env`-Inhalte ausgeben,
- keine Packages ohne Freigabe,
- keine Anwendungscodeänderung vor Abschluss und Commit dieses
  Dokumentationsauftrags,
- kein pauschales Staging über `git add .` oder `git add -A`.
