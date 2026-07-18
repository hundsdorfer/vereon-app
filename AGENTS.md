<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Vereon — gemeinsame Agentenregeln

Diese Regeln gelten für Codex, Claude Code und andere Agenten mit
Repository-Zugriff.

## Pflichtlektüre

Zu Beginn einer Entwicklungs- oder Review-Aufgabe:

1. `docs/PROJECT_BRIEF.md`
2. `docs/CURRENT_TASK.md`
3. `docs/DOCS_INVENTORY.md`
4. die dort für das betroffene Fachgebiet genannten kanonischen Dokumente

Vor Änderungen außerdem Git-Status und vorhandene lokale Diffs prüfen.
Bestehende Nutzeränderungen sind zu erhalten und dürfen nicht pauschal
überschrieben werden.

## Arbeitsweise

- Vor einer größeren Änderung geplante Dateien, Vorgehen, Risiken und
  Prüfungen nennen.
- Anwendungscode, Migrationen oder Packages nur im Rahmen eines ausdrücklich
  freigegebenen Auftrags ändern.
- Unbekanntes nicht erfinden, sondern als offen oder nicht verifiziert
  kennzeichnen.
- Dauerhafte Produkt-, Architektur- und Sicherheitsentscheidungen sowie
  relevante Statusänderungen in den laut `docs/DOCS_INVENTORY.md` zuständigen
  Dokumenten pflegen.
- Dokumentation und Kommentare auf Deutsch; Code-Bezeichner folgen den
  bestehenden Konventionen.
- Server Components sind Standard. `'use client'` nur für Interaktion,
  lokalen Zustand oder Browser-APIs.

## Rollen im Standardworkflow

- Claude Code implementiert ausdrücklich freigegebene Entwicklungsaufträge und
  übergibt geänderte Dateien, Diff, Prüfergebnisse und bekannte Risiken.
- Erhält Codex eine solche Implementierungsübergabe zum Review, prüft Codex den
  Diff unabhängig gegen Auftrag, Repository, zuständige Dokumente und
  ausgeführte Tests.
- Codex meldet konkrete Befunde nach Schweregrad mit Datei und möglichst enger
  Zeilenangabe. Fehlende Tests, nicht verifizierte Annahmen und
  Dokumentationsfolgen werden ausdrücklich genannt.
- Ein Reviewauftrag erlaubt keine automatische Korrektur. Codex verändert
  Dateien erst, wenn der Nutzer zusätzlich eine Umsetzung beauftragt.

## Datenbank und Secrets

- Keine Remote-Datenbankaktion und kein `supabase db push` ohne separate,
  ausdrückliche Freigabe.
- Kein lokaler `supabase db reset` ohne ausdrückliche Bestätigung in der
  aktuellen Sitzung.
- Bestehende angewendete Migrationen nicht umschreiben. Schemaänderungen
  erfolgen über neue additive Migrationen.
- Migrationen dürfen nur als Teil eines ausdrücklich freigegebenen
  Implementierungsauftrags erstellt, geändert oder angewendet werden.
- Keine Secrets oder Inhalte aus `.env.local` ausgeben.
- `SUPABASE_SERVICE_ROLE_KEY` niemals in Clientcode, normalen Anwendungscode,
  Dokumentation, Logs oder Commits aufnehmen.

## Git und externe Änderungen

- Keine Commits, Pushes, Deployments oder Pull Requests ohne ausdrücklichen
  Auftrag.
- Kein pauschales Staging mit `git add .` oder `git add -A`; Dateien gezielt
  auswählen.
- Lokale Agentenkonfiguration wie `.claude/settings.local.json` gehört nicht
  ohne bewusste Einzelentscheidung in einen Commit.
- Keine destruktiven Git- oder Dateisystemaktionen zum Bereinigen fremder
  Änderungen.

## Qualität und Abschluss

Die Prüfung wird dem Risiko der Änderung angepasst. Für Anwendungscode sind
mindestens zu berücksichtigen:

- gezielter Test des geänderten Verhaltens,
- `npx tsc --noEmit`,
- `npm run lint`,
- `npm run build`,
- relevante Playwright-Tests bei betroffenen Kernflows,
- Prüfung des finalen Diffs und gegebenenfalls Aktualisierung der zuständigen
  Dokumente.

Im Abschlussbericht werden geänderte Dateien, ausgeführte Prüfungen, nicht
ausgeführte Prüfungen und verbleibende Risiken genannt.
