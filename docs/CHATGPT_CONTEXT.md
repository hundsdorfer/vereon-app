# Vereon — ChatGPT Context

## 1. Zweck dieser Datei

Diese Datei ist die kompakte Übergabequelle für ChatGPT. Sie ersetzt nicht die Projekt-Dokumentation im Repo, sondern fasst den aktuellen Stand, Risiken und nächsten Schritte zusammen. Bei künftigen ChatGPT-Projektquellen soll primär diese Datei aktualisiert/hochgeladen werden — nicht mehr alle einzelnen `.md`-Dateien manuell.

---

## 2. Stand

* **Datum:** 2026-07-06
* **Aktueller Branch:** `main`
* **Aktueller Commit:** `5337867` — „docs: update hot memory after remove player commit"
* **Branch-Status zu `origin/main`:** 6 Commits voraus, kein Push
* **Arbeitsbaum-Status:** clean bis auf `docs/CHATGPT_CONTEXT.md` selbst (untracked, wird gerade aktualisiert)
* **Push-Status:** kein Push erfolgt

---

## 3. Vorrangregel

* Echte Quelle der Wahrheit ist das Git-Repo.
* Für tatsächlichen Code-Zustand: `docs/ARCHITECTURE.md`
* Für aktuellen Arbeits-/Risikostand: `docs/STATUS.md`
* Für aktuelle Aufgabe: `docs/CURRENT_TASK.md`
* Für Kurzkompass: `docs/PROJECT_BRIEF.md`
* Für ChatGPT-Handoff: `docs/CHATGPT_CONTEXT.md`

---

## 4. Aktueller Projektstand

* MVP-0A-Kernflow ist implementiert
* Implementiert sind insbesondere:
  * Auth
  * eigenständiges Team erstellen
  * Einladungscode / Join-Link
  * Self-Player-Join-Flow
  * Guardian/Kind-Join-Flow
  * Beitrittsanfragen annehmen/ablehnen
  * Trainings erstellen
  * RSVP für Self-Player und Guardian
  * Trainer-RSVP-Übersicht
  * Dashboard-/Team-Grundlogik
* Remove-Player-Feature ist inzwischen lokal getestet und committed (`6b4e93b`)
* Migration `20260704120000_remove_player_from_team.sql` wurde lokal mit `npx supabase db reset` erfolgreich getestet
* `npm run lint` erfolgreich
* `npm run build` erfolgreich
* Hot-Memory-Dokumente (`docs/CURRENT_TASK.md`, `docs/PROJECT_BRIEF.md`, `docs/STATUS.md`) wurden nachgezogen und mit `5337867` committed
* Kein Push erfolgt (durch `git status` bestätigt)

---

## 5. Letzte relevante Commits

Aus `git log --oneline -n 10` (reale Werte):

* `5337867` — docs: update hot memory after remove player commit (`CURRENT_TASK.md`, `PROJECT_BRIEF.md`, `STATUS.md`)
* `6b4e93b` — feat: allow coaches to remove players from team (Remove-Player-Feature committed)
* `c2225b5` — chore: update gitignore (separater Commit, `.vercel`/`.env*` ignoriert)
* `7a11258` — docs: update current task state (`CURRENT_TASK.md` aktualisiert)
* `a8eaf85` — docs: update project brief current status (`PROJECT_BRIEF.md` korrigiert)
* `51a97ee` — docs: add documentation inventory and stale-doc warnings (Dokumentations-Inventar + Warnhinweise)
* `9632d40` — Document player birth year data minimization
* `69a913e` — Use birth year for player join requests
* `24a5650` — Add imprint placeholder page
* `4f2d666` — Document PWA.1 metadata completion

---

## 6. Aktuelle offene Aufgaben

Priorisiert:

1. **`docs/CHATGPT_CONTEXT.md` prüfen und separat committen**

2. Danach weiter mit Doku-Cleanup:
   * `SECURITY.md`
   * `PROJECT_STATUS.md`
   * `ROADMAP.md`
   * `TECH_STACK.md`
   * `MVP_SCOPE.md` / `USER_FLOWS.md`
   * `DATABASE_MODEL.md`

3. Danach fachliche nächste Entscheidungen:
   * P.2B Einladungscode-Format
   * Legal-Seiten
   * Cleanup-Job für Join-Requests
   * Consent-Nachweis Minderjährige
   * Match-MVP

---

## 7. Offene Risiken / Blocker

* Legal-Seiten weiterhin Platzhalter
* Cleanup für abgelehnte/abgelaufene Join-Requests noch nicht automatisiert
* Consent-/Einwilligungsnachweis für Minderjährige noch unzureichend
* Supabase-/Hosting-AV und EU-Datenregion noch zu dokumentieren
* Keine Unit-/Integrationstests
* E2E nicht automatisch als CI-Gate auf jeden Push/PR
* `database.types.ts` ist weiterhin nur Stub
* `PROJECT_STATUS.md` ist veraltet und soll nicht mehr als primäre Statusquelle dienen

---

## 8. Harte Projektregeln für Claude Code

* Keine Remote-Datenbank
* Kein `supabase db push`
* Kein `npx supabase db reset` ohne ausdrückliche separate Freigabe
* Keine Migrationen ohne ausdrückliche Bestätigung
* Keine Secrets oder `.env` anzeigen
* Keine Packages ohne Bestätigung
* Keine Codeänderungen ohne geplante Dateiliste und Freigabe
* Kein `git add .`
* Kein `git add -A`
* Commits nur gezielt mit expliziten Dateien

---

## 9. Hinweise für ChatGPT

* ChatGPT soll bei Projektfragen primär diese Datei als aktuellen Einstieg nutzen.
* Ältere einzeln hochgeladene `.md`-Quellen können veraltet sein.
* Bei Widersprüchen gilt:
  1. Nutzer-/Claude-Handoff im aktuellen Chat
  2. `CHATGPT_CONTEXT.md`
  3. `STATUS.md` / `ARCHITECTURE.md`
  4. ältere Dokumente mit Warnhinweis nur nach Prüfung
* Wenn ChatGPT unsicher ist, soll es gezielt nach aktuellem `git status`, `git log` oder Diff fragen, statt aus alten Quellen zu schließen.
