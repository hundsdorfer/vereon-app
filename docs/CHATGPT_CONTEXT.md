# Vereon — ChatGPT Context

## 1. Zweck dieser Datei

Diese Datei ist die kompakte Übergabequelle für ChatGPT. Sie ersetzt nicht die Projekt-Dokumentation im Repo, sondern fasst den aktuellen Stand, Risiken und nächsten Schritte zusammen. Bei künftigen ChatGPT-Projektquellen soll primär diese Datei aktualisiert/hochgeladen werden — nicht mehr alle einzelnen `.md`-Dateien manuell.

---

## 2. Stand

* **Datum:** 2026-07-07
* **Aktueller Branch:** `main`
* **Letzter abgeschlossener Projektstand vor dieser Kontext-Aktualisierung:** `d6d3c36` — „docs: restructure decision log"
* **Branch-Status zu `origin/main`:** 8 Commits voraus, kein Push
* **Arbeitsbaum-Status:** **nicht clean** — `docs/CHATGPT_CONTEXT.md` wird durch diese Aktualisierung gerade geändert und danach gezielt committed; `docs/DECISION_LOG.md` ist bereits committed (`d6d3c36`) und nicht mehr modifiziert
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
* `docs/DECISION_LOG.md` wurde grundlegend überarbeitet und mit `d6d3c36` committed: neues Standardformat für Entscheidungen, Entscheidungsindex, sieben Initialentscheidungen `DEC-001` bis `DEC-007`
  * `DEC-001` definiert die neue Dokumentationsstruktur und den künftigen manuellen ChatGPT-Doku-Prozess (Nutzer + ChatGPT entwerfen, Claude reviewt danach im Review-only-Modus)
  * `docs/FEATURE_CATALOG.md` ist dadurch als künftige kanonische Funktionsquelle beschlossen, **existiert aber noch nicht**
  * Claude-Review vor Commit ergab „commitfähig" — die Datei wurde unverändert übernommen und mit `d6d3c36` committed
* Kein Push erfolgt (durch `git status` bestätigt)

---

## 5. Letzte relevante Commits

Aus `git log --oneline -n 10` (reale Werte):

* `d6d3c36` — docs: restructure decision log (`docs/DECISION_LOG.md` committed)
* `61f7cc6` — docs: add chatgpt project context (`CHATGPT_CONTEXT.md` initial committed)
* `5337867` — docs: update hot memory after remove player commit (`CURRENT_TASK.md`, `PROJECT_BRIEF.md`, `STATUS.md`)
* `6b4e93b` — feat: allow coaches to remove players from team (Remove-Player-Feature committed)
* `c2225b5` — chore: update gitignore (separater Commit, `.vercel`/`.env*` ignoriert)
* `7a11258` — docs: update current task state (`CURRENT_TASK.md` aktualisiert)
* `a8eaf85` — docs: update project brief current status (`PROJECT_BRIEF.md` korrigiert)
* `51a97ee` — docs: add documentation inventory and stale-doc warnings (Dokumentations-Inventar + Warnhinweise)
* `9632d40` — Document player birth year data minimization
* `69a913e` — Use birth year for player join requests

---

## 6. Aktuelle offene Aufgaben

Priorisiert:

1. **`docs/FEATURE_CATALOG.md` gemeinsam mit ChatGPT konzipieren** (nach dem in `DEC-001` festgelegten Prozess: ChatGPT entwirft, Nutzer fügt manuell ins Repo ein, Claude reviewt danach im Review-only-Modus gegen Repo/Code/Migrationen/Docs)
   * `MVP_SCOPE.md` gegen den Feature-Katalog neu strukturieren
   * `USER_FLOWS.md` entsprechend abgrenzen
   * danach technische Kern-Dokumente: `DATABASE_MODEL.md`, `ROLES_AND_PERMISSIONS.md`, `SECURITY.md`

2. Danach fachliche nächste Entscheidungen:
   * P.2B Einladungscode-Format
   * Legal-Seiten
   * Cleanup-Job für Join-Requests
   * Consent-Nachweis Minderjährige
   * Match-MVP

---

## 7. Offene Risiken / Blocker

* `docs/FEATURE_CATALOG.md` existiert noch nicht (als kanonische Funktionsquelle beschlossen, aber nicht erstellt)
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
* **Aktueller nächster Startpunkt:** `docs/FEATURE_CATALOG.md` gemeinsam mit ChatGPT konzipieren (`docs/DECISION_LOG.md` und `docs/CHATGPT_CONTEXT.md` sind bereits abgeschlossen und committed).
* `docs/FEATURE_CATALOG.md` darf **nicht eigenmächtig durch Claude erstellt werden**. Sie wird nach dem in `DEC-001` festgelegten Prozess zuerst gemeinsam mit ChatGPT konzipiert, erst danach von Claude im Review-only-Modus geprüft.
* Bei Widersprüchen gilt:
  1. Aktueller Nutzer-/Claude-Handoff im laufenden Chat und der tatsächliche Git-Status
  2. `CHATGPT_CONTEXT.md`
  3. `STATUS.md` / `ARCHITECTURE.md`
  4. ältere Dokumente mit Warnhinweis nur nach Prüfung
* Wenn ChatGPT unsicher ist, soll es gezielt nach aktuellem `git status`, `git log` oder Diff fragen, statt aus alten Quellen zu schließen.
