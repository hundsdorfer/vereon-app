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
  * `docs/FEATURE_CATALOG.md` ist dadurch als künftige kanonische Funktionsquelle beschlossen; die Datei existiert inzwischen und wurde mit Commit `00a103d` hinzugefügt (siehe Abschnitt 10)
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

1. **`docs/FEATURE_CATALOG.md` wurde erstellt (Commit `00a103d`) und ist die kanonische fachliche Funktionsquelle.** Nächster Schritt ist nicht mehr Konzeption, sondern Abgleich weiterer Dokumente dagegen:
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
* **Aktueller Stand:** `docs/FEATURE_CATALOG.md` wurde erstellt (Commit `00a103d`) und ist die kanonische fachliche Funktionsquelle (`docs/DECISION_LOG.md` und `docs/CHATGPT_CONTEXT.md` sind ebenfalls abgeschlossen und committed).
* Weitere Dokumente sollen künftig gegen `docs/FEATURE_CATALOG.md` abgeglichen werden (`MVP_SCOPE.md`, `USER_FLOWS.md`, technische Kern-Dokumente); der in `DEC-001` festgelegte Konzeptions-/Review-Prozess gilt weiterhin für künftige neue kanonische Dokumente.
* Bei Widersprüchen gilt:
  1. Aktueller Nutzer-/Claude-Handoff im laufenden Chat und der tatsächliche Git-Status
  2. `CHATGPT_CONTEXT.md`
  3. `STATUS.md` / `ARCHITECTURE.md`
  4. ältere Dokumente mit Warnhinweis nur nach Prüfung
* Wenn ChatGPT unsicher ist, soll es gezielt nach aktuellem `git status`, `git log` oder Diff fragen, statt aus alten Quellen zu schließen.

---

## 10. Stand-Nachtrag (2026-07-08)

* `docs/FEATURE_CATALOG.md` wurde mit Commit `00a103d` hinzugefügt.
* `docs/DECISION_LOG.md` enthält nun `DEC-008` zum Feature-ID-Format `FC-[MODUL]-[NUMMER]`.
* Der Arbeitsbaum war nach dem Commit clean.
* Kein Push wurde ausgeführt.

---

## 11. Markdown-Dokumentenverzeichnis

Kompakter Überblick über alle `.md`-Dateien im Repo. Für Details siehe `docs/DOCS_INVENTORY.md`. Diese Datei (`CHATGPT_CONTEXT.md`) ist selbst nur ein kompakter ChatGPT-Handoff/Projektkontext, keine Quelle für technische Wahrheit — dafür gelten `ARCHITECTURE.md`/`STATUS.md`.

**Root:**
- `AGENTS.md` — Hinweis, dass dieses Next.js 16 Breaking Changes ggü. Trainingswissen hat; vor Codeänderungen `node_modules/next/dist/docs/` lesen.
- `CLAUDE.md` — Projektregeln für Claude Code (Pflichtlektüre, Arbeitsregeln, Hard Constraints).
- `README.md` — Standard-`create-next-app`-Boilerplate, keine projektspezifische Doku.

**docs/ — kanonische Funktions-/Entscheidungsquellen:**
- `docs/FEATURE_CATALOG.md` — **neue kanonische fachliche Funktionsquelle**: Status, Phase, Rollen und Abgrenzung aller Produktfunktionen.
- `docs/DECISION_LOG.md` — **verbindliches Entscheidungsprotokoll** für Produkt-, Architektur-, Security-, Privacy-, UX-, Business- und Dokumentationsentscheidungen.
- `docs/MVP_SCOPE.md` — MVP-Philosophie und Funktionsumfang je Stufe (0A/0B/1/2); kritisch prüfen, idealisierte Migrationsnummerierung weicht von echten Dateien ab.
- `docs/USER_FLOWS.md` — nummerierte Nutzerflows je MVP-Stufe; inhaltlich stark deckungsgleich mit `MVP_SCOPE.md`.

**docs/ — technischer Ist-Zustand (verlässlichste Quellen):**
- `docs/ARCHITECTURE.md` — code-basierte Architekturreferenz, aktuellster verlässlicher Ist-Zustand.
- `docs/STATUS.md` — code-basiertes Audit (was funktioniert/uncommitted/offen), ebenfalls verlässlicher Ist-Zustand.
- `docs/CURRENT_TASK.md` — laufender Phasen-/Aufgaben-Log; kritisch prüfen, Aktualisierungsstand kann hinter `STATUS.md` zurückliegen.
- `docs/PROJECT_BRIEF.md` — Kompaktzusammenfassung für Claude Code; kritisch prüfen, enthält bekannte veraltete Einzelaussagen (siehe eigener Warnhinweis in der Datei).

**docs/ — technischer Funktionskern (gegen Feature-Katalog/Code abzugleichen):**
- `docs/DATABASE_MODEL.md` — kanonisches geplantes Datenmodell (DDL-artig); kritisch prüfen, idealisierte Migrationsnummerierung.
- `docs/ROLES_AND_PERMISSIONS.md` — Rollen- und Berechtigungskonzept.
- `docs/SECURITY.md` — Sicherheitsarchitektur-Referenz mit Risiken/Gegenmaßnahmen; kritisch prüfen, Status-Spalte veraltet (zeigt „Geplant" trotz Umsetzung).
- `docs/DSGVO_PRIVACY_MODEL.md` — Datenschutz-/DSGVO-Referenz, Minderjährigenschutz, Datenminimierung.
- `docs/SUPABASE_STRATEGY.md` — Supabase-Integrationsleitfaden (Clients, RLS, SECURITY DEFINER); kritisch prüfen, kleinere Widersprüche zu `ARCHITECTURE.md`.
- `docs/TECH_STACK.md` — Tech-Stack-Übersicht; kritisch prüfen, veraltete Client-Anzahl und Zod-Status.

**docs/ — UX und Qualität:**
- `docs/DESIGN_SYSTEM.md` — UI-/UX-Leitfaden, Farbtoken- und Komponenten-Spezifikationen.
- `docs/MVP_TEST_CHECKLIST.md` — manuelle QA-Checkliste für den MVP-Kernflow, aktiv gepflegt.

**docs/ — Legal/Business/Strategie:**
- `docs/LEGAL_TODO.md` — DSGVO-/Rechts-Checkliste vor Pilotbetrieb (Legal-Seiten sind Platzhalter).
- `docs/MONETIZATION_STRATEGY.md` — Geschäfts-/Preismodell, Billing erst Phase 3.
- `docs/PRODUCT_VISION.md` — Produktvision auf hoher Flughöhe (Nordstern-Dokument).
- `docs/MOBILE_APP_STRATEGY.md` — gestuftes Mobile-Konzept (Web/PWA → später nativ via Capacitor).

**docs/ — Archivkandidaten / nur Referenz:**
- `docs/PROJECT_STATUS.md` — veraltetes Fortschritts-Tracking, nicht mehr primäre Statusquelle (siehe `STATUS.md`).
- `docs/ROADMAP.md` — veraltete Checkbox-Roadmap mit überholter Phasentaxonomie, Archivkandidat.
- `docs/DOCS_INVENTORY.md` — Bestandsaufnahme/Pflegezustand aller `docs/`-Dateien; kein Statuswert-Ersatz, reines Cleanup-Hilfsdokument.
- `docs/CHATGPT_CONTEXT.md` — diese Datei; kompakter ChatGPT-Handoff, keine technische Wahrheitsquelle.

---

## 12. Nächster Dokumentationsplan

**Grundprinzip:** `Feature → Scope → Flow → Rollen → Datenmodell → Security/DSGVO → Tests`

`docs/FEATURE_CATALOG.md` ist die kanonische fachliche Funktionsquelle. Die weiteren Dokumente sollen nicht isoliert erweitert werden, sondern gegen `FEATURE_CATALOG.md` abgeglichen und daraus abgeleitet werden — nicht alle gleichzeitig, sondern der Reihe nach:

1. `docs/MVP_SCOPE.md` bereinigen — legt fest, welche Features wirklich in MVP-0A, MVP-0B, MVP-1, Post-MVP oder Later gehören.
2. `docs/USER_FLOWS.md` ausarbeiten — beschreibt die wichtigsten Nutzerabläufe auf Basis des bereinigten Scopes.
3. `docs/ROLES_AND_PERMISSIONS.md` konsolidieren — Rollen und Rechte aus Feature-Katalog und User-Flows zusammenführen.
4. `docs/DATABASE_MODEL.md` gegen `FEATURE_CATALOG.md` prüfen — Datenmodell nicht isoliert von Produktlogik und Rollen entwickeln.
5. `docs/SECURITY.md` und `docs/DSGVO_PRIVACY_MODEL.md` schärfen — insbesondere wegen Minderjährigen, Guardian-Logik, `birth_year`, Kontaktpersonen, RSVP, Anwesenheit und Spielberichten.
6. `docs/MVP_TEST_CHECKLIST.md` daraus ableiten — abgeleitet aus Scope, Flows und Rollen.
