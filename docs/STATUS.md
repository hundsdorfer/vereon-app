# Status — technisches Audit

**Stand:** 2026-07-23
**Geprüfter Stand:** `main` / `72cf287` (committet und auf `origin/main`
gepusht: `FC-ROLE-002`/`FC-ROLE-003`, inklusive Codex-Review-Korrekturen).
Alle 17 Migrationen sind remote angewendet (inklusive
`20260723100000_add_role_management.sql`, mit ausdrücklicher Freigabe per
`supabase db push`) und lokal vollständig verifiziert (81/81
Playwright-Tests). Vercel-Production-Deployment
`dpl_8MPs4gZgBeEsJCyhyMf6JjoBKSWs` für exakt diesen Commit ist `READY`
(Alias `vereon.app`/`www.vereon.app`), extern gegen bekanntes
Basic-Auth-Verhalten geprüft. Details und aktueller Prüfstand:
`docs/CURRENT_TASK.md`.

Dieses Dokument ist die verbindliche lebende Übersicht für belegte technische Abweichungen, Risiken und Übergabepunkte. Technischer Ist-Zustand: `docs/ARCHITECTURE.md`. Fachliches Ziel: `docs/FEATURE_CATALOG.md`, `docs/ROLES_AND_PERMISSIONS.md` und `docs/DATABASE_MODEL.md`.

## 1. Kurzurteil

Der Einzelteam-Kernflow ist im Repository implementiert: Auth, Team-Erstellung, Einladung, Self-/Guardian-Join, Join-Entscheidung, Spieler-Soft-Remove, Trainingsanlage, Trainingsabsage, Spieler-/Guardian-RSVP und lokal migriert und verifiziert Trainer-RSVP.

Die App ist intern gehostet, aber nicht pilotbereit. Der Zugriff auf die gehostete Instanz ist seit 2026-07-19 durch einen temporären internen Zugangsschutz begrenzt (verifiziert, siehe Abschnitt 2). Die größten verbleibenden Lücken betreffen Legal-/Consent-Themen, E-Mail-Verifizierung, automatisierte Datenbereinigung, Backup/Restore sowie mehrere beschlossene MVP-0B-Funktionen.

## 2. Verifiziert funktionsfähig

| Bereich | Beleg |
|---|---|
| Registrierung, Login, Logout und Callback | `src/actions/auth.ts`, `src/app/auth/callback/route.ts` |
| Session-Refresh und Routenschutz | `src/proxy.ts`, `src/lib/supabase/middleware.ts` |
| Eigenständiges Team mit Owner, Head Coach und Code | `src/actions/team.ts`, `create_independent_team()` in `20260627100000_add_team_public_code.sql` |
| Self-Player- und Guardian-Join | `src/actions/join.ts`, Migration `20260702000000_players_birth_year_only.sql` |
| Annehmen/Ablehnen von Anfragen | `src/actions/joinRequests.ts`, `approve_join_request()`, `reject_join_request()` |
| Spieler per Soft-Delete entfernen | `src/actions/players.ts`, Migration `20260704120000_remove_player_from_team.sql` |
| Trainings erstellen und anzeigen | `src/actions/events.ts`, `src/app/(app)/teams/[teamId]/events/*` |
| Training absagen (`team_owner`, `head_coach`, `assistant_coach` laut RPC-Rechteprüfung) | `cancelEventAction()` in `src/actions/events.ts`, `cancel_event()` in `20260629200000_add_events.sql`, UI in `src/features/events/CancelEventButton.tsx` und `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx`; abgesagte Trainings bleiben in allen Übersichten (Liste, Team, Dashboard) sichtbar und markiert; neue/geänderte RSVP nach Absage serverseitig gesperrt; wiederholte Absage bleibt konsistent (zustands-idempotent). End-to-end verifiziert nur für `team_owner`-only (`tests/e2e/core-flow-cancel-training.spec.ts`); `head_coach`-only/`assistant_coach`-only sind **weiterhin nicht end-to-end verifiziert** (Begründung: Abschnitt 5) und stattdessen nur über RPC-Code-Review sowie einen statischen Rollenvertrags-Test für `TRAINING_CANCEL_ROLES` (`tests/e2e/trainingCancelRoleContract.spec.ts`) abgedeckt — kein Ersatz für die offenen Integrationsfälle. |
| Training bedingt hart löschen | `delete_training()` in `20260721114453_delete_training.sql`, `deleteTrainingAction()`, `DeleteTrainingForm` und Event-Detailseite; für Spieler-RSVP lokal migriert und in `tests/e2e/core-flow-delete-training.spec.ts` für `team_owner`-only verifiziert. Die lokale Migration `20260722090000_add_staff_rsvp.sql` erweitert die RPC atomar um eine Trainer-RSVP-Sperre; für `team_owner`-only end-to-end verifiziert (Parallel-Race-Test gegen `respond_to_event_as_staff()` eingeschlossen). `head_coach`-only bleibt wegen fehlendem legitimen Testkonto-Weg offen. |
| Trainer-RSVP abgeben (`FC-RSVP-003`) | `respond_to_event_as_staff()`, `list_staff_rsvps_for_event()` und `event_staff_rsvps` in `20260722090000_add_staff_rsvp.sql`; `respondToEventAsStaffAction()`, `StaffRsvpForm.tsx`, getrennte Card „Trainer-Rückmeldungen" auf der Event-Detailseite. Lokal migriert und in `tests/e2e/core-flow-staff-rsvp.spec.ts` für `team_owner`-only verifiziert (UPSERT, Deadline-Grenze, Absage, Enumerationsschutz, dedizierte Listen-RPC). Die Rollenwechsel-Historie (`is_active_trainer = false` für inzwischen nicht mehr aktive Trainer) ist mangels legitimem Weg, einen solchen Datensatz zu erzeugen, **nicht** im Playwright-Lauf, sondern nur statisch über `tests/e2e/trainingStaffRsvpRoleContract.spec.ts` abgedeckt. `head_coach`-/`assistant_coach`-only bleiben ebenfalls wegen fehlendem legitimen Testkonto-Weg offen und sind über denselben statischen Rollenvertrag abgedeckt. |
| Co-Trainer hinzufügen/entfernen (`FC-ROLE-002`/`FC-ROLE-003`) | `grant_assistant_coach()`, `revoke_assistant_coach()`, `list_assistant_coaches()` und `team_role_audit_log` in `20260723100000_add_role_management.sql`; Actions in `src/actions/team.ts`, UI-Card „Trainerteam" auf der Team-Detailseite. Lokal migriert und in `tests/e2e/core-flow-role-management.spec.ts` für `team_owner`-only end-to-end verifiziert — erstmals inklusive eines **real provisionierten** `assistant_coach`-Kontos (bislang stets über statische Rollenverträge ersetzt). Vergabe ist auf existierende, aktive, selbst registrierte Spieler beschränkt (bewusste Scope-Grenze, kein separater Coach-Einladungsweg); ein Entzug ohne verbleibende Rolle deaktiviert die zugrunde liegende Mitgliedschaft, damit kein dauerhafter, grundloser Teamzugriff zurückbleibt. `head_coach`-only bleibt weiterhin ohne legitimen Testkonto-Weg offen. Die vier bereits bestehenden Core-Flow-Tests (Training bearbeiten/absagen/löschen, Trainer-RSVP) wurden bewusst **nicht** um echte `assistant_coach`-only-Zweige erweitert — siehe „Bekannte Folgearbeiten" unten. |
| Spieler-/Guardian-RSVP und Trainerübersicht | `respond_to_event()`, `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx` |
| RLS auf allen 20 lokal angewendeten öffentlichen Tabellen | `supabase/migrations/*`, inklusive der neuen Tabelle `team_role_audit_log` |
| CI für Lint und Build | `.github/workflows/ci.yml` |
| Temporärer interner Zugangsschutz (HTTP Basic Auth vor Supabase-Login) | lokal automatisiert getestet (`tests/e2e/internal-access.spec.ts`, `tests/e2e/internal-access-enabled.spec.ts`); auf Vercel aktiviert (Projekt `vereon`, Scope `vereon-app`, Production-Deployment `dpl_NnTeWpNNmmEP9BbSAXfmwcXFxM5t`, Commit `029de982`); extern gegen `https://www.vereon.app` geprüft am 2026-07-19: ohne Zugangsdaten `HTTP 401` mit `WWW-Authenticate: Basic realm="Vereon Internal Access"` und `Cache-Control: private, no-store`, mit korrekten Zugangsdaten `HTTP 307` auf `/login`. Kein Ersatz für Supabase Auth/RLS, ausdrücklich temporär (`DEC-011`), vor externem Pilot zu entfernen/ersetzen. |
| `/manifest.webmanifest` ohne Supabase-Login-Weiterleitung, interner Zugangsschutz bleibt davor aktiv | lokal implementiert und automatisiert getestet (`src/proxy.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/internal-access-enabled.spec.ts`); deployed (Production-Deployment `dpl_EQdwdj8bj5WidmbvAfKYptHtg5yT`, Commit `5caf3b7276893013ba2ef1b5da39d66907bb2b17`, Status `READY`) und extern gegen `https://www.vereon.app` verifiziert am 2026-07-19 (durch Codex geprüft, laut Nutzerangabe): ohne interne Zugangsdaten `HTTP 401`, mit korrekten internen Zugangsdaten `HTTP 200` mit `Content-Type: application/manifest+json; charset=utf-8` ohne Supabase-Login-Weiterleitung; `/dashboard` antwortet mit korrektem internem Zugang ohne Supabase-Session weiterhin mit `HTTP 307` auf `/login?redirect=%2Fdashboard`. Damit ist die Reihenfolge extern bestätigt: interner Zugangsschutz → Supabase-Routenschutz → Anwendung. |

**Bekannte Folgearbeiten (aus `FC-ROLE-002`/`FC-ROLE-003`, Stand 2026-07-23):**
Jetzt, da ein legitimer Weg existiert, ein reales `assistant_coach`-Testkonto
zu provisionieren, könnten die vier bestehenden Core-Flow-Tests
(`core-flow-cancel-training.spec.ts`, `core-flow-edit-training.spec.ts`,
`core-flow-delete-training.spec.ts`, `core-flow-staff-rsvp.spec.ts`) um
echte `assistant_coach`-only-Zweige erweitert werden, statt weiterhin nur auf
die jeweiligen statischen Rollenverträge zu vertrauen. Bewusst nicht Teil
dieses Auftrags (Scope-Entscheidung), noch nicht beauftragt. `head_coach`-only
bleibt davon unberührt weiterhin ungelöst (`FC-ROLE-002` löst nur die
`assistant_coach`-Seite; `head_coach` ist ausschließlich über
`create_independent_team(p_also_head_coach: true)` erreichbar, identisch mit
`team_owner`).

## 3. Prüfstand

Am 2026-07-18 wurden ohne Codeänderung erfolgreich ausgeführt:

- `npm run lint`,
- `npx tsc --noEmit`,
- `npm run build` mit Next.js `16.2.9`.

E2E wurde in diesem Audit nicht ausgeführt. Der Workflow `.github/workflows/e2e.yml` ist nur manuell startbar.

**Am 2026-07-19, nach Implementierung von FC-TRAINING-005 (inzwischen
committet als `e3a0698`), erfolgreich ausgeführt:** `npx tsc --noEmit`,
`npm run lint`, `npm run build` und der vollständige `npx playwright test`-Lauf
gegen den lokalen Supabase-Docker-Stack: **40/40 Tests bestanden**, darin
enthalten die drei neuen Specs (`core-flow-cancel-training.spec.ts`,
`trainingCancelRoleContract.spec.ts`, `helpers/supabaseTestGuard.spec.ts`)
sowie Regression der bestehenden Specs
(`core-flow-self-player.spec.ts`, `core-flow-guardian.spec.ts`,
`smoke.spec.ts`, `internal-access*.spec.ts`).

**Am 2026-07-21, nach Implementierung von FC-TRAINING-003 (inzwischen lokal
committet als `44250f0`), erfolgreich ausgeführt:** Migration
`20260721094219_update_training.sql` mit `supabase migration up --local`,
Bestätigung über `supabase migration list --local`, gezielter Lauf von
`core-flow-edit-training.spec.ts`, vollständiger `npx playwright test`-Lauf
mit **58/58 bestandenen Tests**, `npx tsc --noEmit`, `npm run lint`,
`npm run build` und `git diff --check`. `supabase db lint --local` und
`supabase db advisors --local` lieferten keinen neuen Befund zu
`update_training()`; vorhandene Hinweise betreffen bestehenden Bestand.

**Am 2026-07-21, nach Implementierung von FC-TRAINING-004 (lokale, noch nicht
committete Änderungen), erfolgreich ausgeführt:** Migration
`20260721114453_delete_training.sql` lokal angewendet und bestätigt, gezielte
Tests 2/2, vollständiger Playwright-Lauf **60/60**, `npx tsc --noEmit`,
`npm run lint`, `npm run build`, `git diff --check`, `supabase db lint --local`
und `supabase db advisors --local`. Kein neuer DB-Lint-/Advisor-Befund zu
`delete_training()`.

**Am 2026-07-22, nach Implementierung von FC-RSVP-003 (inzwischen lokal
committet als `f89a8ae`, noch nicht auf `origin/main` gepusht), erfolgreich
ausgeführt:** Migration
`20260722090000_add_staff_rsvp.sql` mit `supabase migration up --local`
angewendet und über `supabase migration list --local` bestätigt;
vollständiger `npx playwright test`-Lauf **66/66 Tests bestanden**;
`npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`,
`supabase db lint --local` (kein neuer Befund zu den neuen Funktionen) und
`supabase db advisors --local` (sechs neue, unkritische WARN-Hinweise zu
`event_staff_rsvps` — dasselbe bereits akzeptierte Performance-Muster wie bei
`event_attendance`, keine neue Problemklasse).

Die Implementierung erfolgte arbeitsteilig: Codex erstellte Migration, Code,
Tests und Doku nach einem zuvor unabhängig geprüften Plan; die
Docker-abhängigen Prüfungen (Migration, DB-Lint/Advisors, Playwright) konnten
in Codex' Sandbox mangels Docker-Zugriff nicht laufen und wurden danach in
dieser Umgebung nachgeholt. Dabei wurde ein durch die Implementierung
verursachter echter Fehler gefunden und behoben: `StaffRsvpForm.tsx` nutzte
für den abgesagten Zustand denselben Text wie ein bereits bestehendes,
seitenweites Absage-Banner, was `core-flow-cancel-training.spec.ts` durch
doppelten Text brach (Strict-Mode-Konflikt) — nach Textanpassung erneut
vollständig grün verifiziert.

**Unabhängiger Codex-Review (Stand 2026-07-23) des Commits `f89a8ae`:** Keine
P0-/P1-Befunde. RPC-Autorisierung, `REVOKE`/`GRANT EXECUTE`, RLS und das
Race-Handling zwischen `respond_to_event_as_staff()` und `delete_training()`
(beide sperren dieselbe Event-Zeile per `FOR UPDATE`) wurden als korrekt
bestätigt; kein direkter Tabellen-Bypass der Rollenprüfung möglich. Befunde
betrafen ausschließlich Testabdeckung und Dokumentation: der statische
Rollenvertrag prüfte ursprünglich nur `list_staff_rsvps_for_event()`, nicht
auch `respond_to_event_as_staff()` und `is_staff_rsvp_trainer_for_event()`
(behoben, s. `tests/e2e/trainingStaffRsvpRoleContract.spec.ts`); außerdem
mehrere widersprüchliche beziehungsweise veraltete Aussagen in diesem
Dokument, `docs/USER_FLOWS.md`, `docs/ARCHITECTURE.md` und
`docs/CURRENT_TASK.md` (korrigiert). Ein P3-Hinweis bleibt offen: Der
Parallel-Race-Test (`tests/e2e/core-flow-staff-rsvp.spec.ts`) beobachtet pro
Lauf nur eine der beiden möglichen Sperrreihenfolgen, nicht beide
deterministisch erzwungen — laut Codex durch die RPC-seitige SQL-Analyse
dennoch abgedeckt, kein funktionaler Bypass.

Lokale Supabase-Prüfung:

- `.env.local` verweist auf die lokale API `127.0.0.1:54321`,
- Datenbank, Auth, REST, Realtime, Storage, Studio und weitere Kerncontainer liefen,
- `supabase_vector_vereon-app` startete wiederholt neu.

Die Vector-Störung ist ein lokales Betriebsrisiko; ein Fehler des fachlichen Kernflows ist daraus nicht belegt.

**Am 2026-07-23, nach Implementierung von FC-ROLE-002/FC-ROLE-003 (inzwischen
lokal committet als `78cb449`, noch nicht auf `origin/main` gepusht),
erfolgreich ausgeführt:** Migration
`20260723100000_add_role_management.sql` mit `supabase migration up --local`
angewendet und über `supabase migration list --local` bestätigt; gezielte
Tests (11 statischer Rollenvertrag + 1 Kernflow, 12/12), vollständiger
`npx playwright test`-Lauf **80/80 Tests bestanden**; `npx tsc --noEmit`,
`npm run lint`, `npm run build`, `git diff --check`, `supabase db lint --local`
(ein neuer, echter Befund — ungenutzte Variable in `grant_assistant_coach()`
— noch während der Umsetzung behoben, siehe Migration; kein Befund zu
`generate_team_code` verändert) und `supabase db advisors --local` (keine
neuen Befunde zu `team_role_audit_log` oder den drei neuen Funktionen).

**Unabhängiger Codex-Review (Stand 2026-07-23) des Commits `78cb449`:** Keine
P0-Befunde. Ein **P1-Befund**: `grant_assistant_coach()` und
`revoke_assistant_coach()` waren nicht gegeneinander serialisiert — der
Fallback-Read einer bereits bestehenden Mitgliedschaft in
`grant_assistant_coach()` sperrte die Zeile nicht (`FOR UPDATE` fehlte),
wodurch ein gleichzeitiger Revoke dazwischenkommen und einen scheinbar
erfolgreichen Grant auf einer inzwischen inaktiven Mitgliedschaft
hinterlassen konnte — behoben durch `FOR UPDATE` auf dem Fallback-Read. Vier
**P2-Befunde**: (1) ein einfacher Revoke ohne vorherige Spielerentfernung
deaktivierte die Mitgliedschaft trotz weiterhin aktiver Spielerbeziehung,
wodurch ein direkt anschließender erneuter Grant fälschlich mit
„Mitgliedschaft ist nicht aktiv" scheiterte — behoben, indem die
Lifecycle-Deaktivierung zusätzlich das Fehlen einer aktiven
Spielerbeziehung voraussetzt; (2) der Kernflow-Test behauptete
UPDATE-/DELETE-Ablehnung auf `team_role_audit_log` zu prüfen, testete zur
Laufzeit aber nur INSERT — ergänzt um echte UPDATE-/DELETE-Versuche für
Owner und Nicht-Owner; (3) mehrere kanonische Dokumente (`ARCHITECTURE.md`,
`STATUS.md`, `CURRENT_TASK.md`) beschrieben den bereits committeten Stand
noch als „nicht committet" und zählten Migrationen/Tabellen falsch (16/19
statt 17/20 inklusive `team_role_audit_log`) — korrigiert; (4)
`SECURITY.md` behauptete fälschlich, auch Revoke verlange eine aktive
Spielerbeziehung — korrigiert. Ein neuer, gezielter Test
(„Revoke ohne Spielerentfernung …") deckt die P1-/P2-Korrektur jetzt explizit
ab. Alle Korrekturen wurden umgesetzt und erneut lokal verifiziert (siehe
`docs/CURRENT_TASK.md`).

## 4. Priorität 0 — vor externem Pilotbetrieb

**Verifiziert geschlossen (2026-07-19):** „Deployment öffentlich erreichbar“
ist kein offener P0-Punkt mehr. Der temporäre interne Zugangsschutz ist auf
Vercel aktiviert und extern gegen `https://www.vereon.app` verifiziert
(Beleg siehe Abschnitt 2). Der Schutz bleibt ausdrücklich temporär und ist
vor einem externen Pilot zu entfernen oder durch eine geeignete
Plattformlösung zu ersetzen (`DEC-011`).

**Verifiziert geschlossen (2026-07-19):** „Manifest-Korrektur noch nicht
deployed oder extern verifiziert" ist kein offener P0-Punkt mehr. Deployment
und externe Verifikation gegen `https://www.vereon.app` sind erfolgt (Beleg
siehe Abschnitt 2). Praktischer Installationstest auf iOS/Android bleibt ein
separater, nicht-P0-Zieltest (siehe `docs/MVP_TEST_CHECKLIST.md`).

| Abweichung/Risiko | Beleg oder Verifikationsstand | Erforderliches Ergebnis |
|---|---|---|
| Legal-Seiten enthalten Platzhalter | `src/app/legal/{imprint,privacy,terms}/page.tsx` | rechtlich geprüfte Texte und Betreiberangaben |
| E-Mail-Verifizierung nicht als Aktionsvoraussetzung erzwungen | `supabase/config.toml`: lokal aus; kein zentraler App-/RPC-Check | Team, Join und RSVP nur für verifizierte E-Mail |
| Produktionsfähiger E-Mail-Versand fehlt | Nutzerangabe: nur Supabase-Test-/Standardversand | SMTP/Provider, Zustellung und Absender verifizieren |
| Guardian-Erklärung nicht versioniert | Join-Flow setzt nur `player_guardians.verified_at` | Erklärungstext, Version, Nutzer und Zeitpunkt speichern |
| AGB/Datenschutz ohne Dokumentversion | `profiles` speichert nur Annahmezeitpunkte | Version und Zeitpunkt je Dokument speichern |
| Self-Player-Join erzwingt keine Altersgrenze | `submit_join_request_self()` prüft keine Volljährigkeit | rechtlich maßgebliche Grenze festlegen und serverseitig durchsetzen |
| Join-Request-Cleanup nicht automatisiert | `cleanup_expired_join_requests()` existiert ohne Scheduler | 90-Tage-Job einrichten und beobachten |
| Backup/Restore der Cloud nicht verifiziert | nicht im Repo belegt, Nutzer unbekannt | Verfahren dokumentieren und Rücksetzung testen |
| Supabase-Region/AV und Vercel-AV nicht verifiziert | nicht aus Repo ableitbar; `docs/LEGAL_TODO.md` | vor Pilot organisatorisch bestätigen |
| Monitoring/Alerting nicht verifiziert | keine dedizierte Konfiguration im Repo | Mindestkonzept, Zuständigkeit und Alarmweg festlegen |

„Nicht verifiziert“ bedeutet ausdrücklich nicht „nicht vorhanden“.

## 5. Priorität 1 — beschlossene MVP-0B-Kernlücken

**Lokal verifiziert abgeschlossen (2026-07-21):** Training bearbeiten
(`FC-TRAINING-003`) und bedingt hart löschen (`FC-TRAINING-004`) sind
implementiert, lokal migriert und im vollständigen Playwright-Lauf verifiziert.
Der echte E2E-Nachweis umfasst jeweils `team_owner`-only; `head_coach`-only und
für Bearbeiten zusätzlich `assistant_coach`-only bleiben mangels legitimem
Testkonto-Weg als Integrationslücke offen (`FC-ROLE-002`).

| Ziel | Ist-Zustand |
|---|---|
| Training absagen | umgesetzt und verifiziert (siehe Abschnitt 2); bekannte Testlücke: keine legitime `head_coach`-only-/`assistant_coach`-only-E2E-Verifikation ohne Service-Role oder neue Migration — kein `GRANT INSERT`/`DELETE` auf `team_member_roles` für `authenticated`, keine Co-Trainer-RPC (`FC-ROLE-002` noch `planned_mvp`). Isolierte Rollen-Fixture-Provisionierung für Tests ist als separater Folgebedarf offen, eigene Freigabe nötig. |
| Training bedingt hart löschen | für Spieler- und Trainer-RSVP lokal migriert und verifiziert (atomare Sperre, fail-closed UI-Gating, Parallel-Race-Test); echte Rollen-E2E-Abdeckung bleibt auf `team_owner`-only begrenzt |
| RSVP nur bis Terminbeginn | `respond_to_event()` (Spieler-RSVP) prüft weiterhin keine `starts_at`-Deadline; `respond_to_event_as_staff()` (Trainer-RSVP, neu) prüft sie bereits — Inkonsistenz zwischen den beiden RSVP-Pfaden bleibt offen für `FC-RSVP-009` |
| Trainer-RSVP (`FC-RSVP-003`) | lokal implementiert, migriert und im vollständigen Playwright-Lauf verifiziert (66/66); `team_owner`-only echt E2E geprüft, `head_coach`-/`assistant_coach`-only bleiben mangels Testkonto-Weg offen (`FC-ROLE-002`) |
| Einladungscode erneuern/deaktivieren | ältere Revoke-RPC vorhanden, aber kein vollständiger `public_code`-Flow |
| Einladungscode-Rechte für Assistant Coach | aktuelle Policies/RPCs sind nicht konsistent mit dem beschlossenen Ziel |
| Beitrittsanfragen für Assistant Coach sichtbar | Ziel erlaubt Einsicht, aktuelle `team_join_requests`-RLS nur `team_owner`/`head_coach` |
| Rollenverwaltung durch Team Owner | `assistant_coach` hinzufügen/entfernen implementiert (`FC-ROLE-002`/`FC-ROLE-003`, siehe Abschnitt 2); `head_coach`-Vergabe/-Entzug und allgemeine Rollenverwaltung darüber hinaus weiterhin ohne App-Flow |
| genau ein Owner und bestätigte Übertragung | keine Eindeutigkeitsregel oder Transfer-RPC |
| Team archivieren | Statusfeld vorhanden, kein App-Flow |
| verpflichtendes Geburtsjahr, optionales volles Datum | aktuelles Profil verlangt volles Datum; Spieler-Spalte `birth_year` ist nullable |
| Freiwilliges volles Spielergeburtsdatum | optionale Erfassung, Zweckbestätigung, Korrekturfluss und Beschränkung der Teamhistorie auf das Geburtsjahr fehlen beziehungsweise sind nicht vollständig verifiziert |
| Kontaktperson ohne Login | kein Ziel-Datensatz implementiert |
| zukünftige RSVP entfernter Spieler aus Zählungen entfernen | neue RSVP blockiert; bestehende zukünftige Zeilen werden nicht bereinigt |

## 6. Priorität 2 — technische Schulden

| Punkt | Beleg |
|---|---|
| `team_manager` lebt technisch weiter, obwohl fachlich entfernt | Rollenseed und Prüfungen in Team-/Event-Seiten und RLS |
| Bestehende Event-RPCs (`create_event()`, `respond_to_event()`, `cancel_event()` u. a.) haben kein `REVOKE`/`GRANT EXECUTE` und laufen mit Standard-`PUBLIC`-Execute | bei `FC-TRAINING-003` identifiziert; neue `update_training()`-RPC hat bereits explizites `REVOKE`/`GRANT`, ältere RPCs (noch) nicht; siehe `docs/SECURITY.md` Abschnitt 6 |
| Supabase-Typen fehlen | `src/types/database.types.ts` enthält nur `Json` |
| kein separater Unit-Test-Runner, kein eigenes Unit-Test-Script | kein `test`-Script in `package.json`; reine, unit-artige Tests (`tests/e2e/datetime.spec.ts`, `tests/e2e/trainingCancelRoleContract.spec.ts`, `tests/e2e/trainingEditRoleContract.spec.ts`) laufen stattdessen ohne Browser-Fixture über den vorhandenen Playwright-Runner (`npx playwright test`) |
| E2E kein automatisches Merge-Gate | `.github/workflows/e2e.yml`: nur `workflow_dispatch` |
| Trainer-Erkennung dupliziert | unabhängige Rollenlisten in Dashboard, Teams und Detailseiten |
| `ThemeDebug` ist noch enthalten | `src/components/layout/ThemeProvider.tsx` |
| kein dediziertes `typecheck`-Script | `package.json`; manueller Befehl funktioniert |
| Node-Version nicht projektweit fixiert | kein `engines`, keine `.nvmrc`; CI nutzt Node 20 |

## 7. Datenbank- und Betriebsgrenzen

- Das Repository enthält 17 additive Migrationen, alle gegen den lokalen
  Supabase-Docker-Stack und die Supabase-Cloud-Produktionsdatenbank angewendet.
- Remote-Migrationsstand am 2026-07-23 per `supabase migration list`
  bestätigt: alle 17 Migrationen Local == Remote, inklusive der zuvor remote
  fehlenden `20260704120000_remove_player_from_team.sql`,
  `20260721094219_update_training.sql`, `20260721114453_delete_training.sql`,
  `20260722090000_add_staff_rsvp.sql` und `20260723100000_add_role_management.sql`
  (jeweils mit ausdrücklicher Freigabe per `supabase db push` angewendet).
- Jede künftige Remote-Migration braucht weiterhin eine separate
  ausdrückliche Freigabe.
- Kein `db reset` ausgeführt.
- Die gehostete Instanz verwendet laut Nutzer Supabase Cloud; lokale Entwicklung verwendet den Docker-Stack.

## 8. Übergaberisiken im Arbeitsbaum

- `docs/ARCHITECTURE.md` und `docs/DATABASE_MODEL.md` hatten vor diesem Audit umfangreiche uncommittete Arbeitsfassungen; sie wurden innerhalb des Dokumentationsauftrags konsolidiert.
- `.claude/settings.local.json` existiert lokal und ist nicht versioniert. Im
  aktuellen Prüflauf konnte Git die konfigurierte globale Ignore-Datei nicht
  lesen und zeigte die Datei deshalb als unversioniert an. Sie darf nicht in den
  Dokumentationscommit aufgenommen werden; Ignore-Status und Commit-Scope sind
  vor dem Staging nochmals zu prüfen.
- Kein `git add .` oder `git add -A`; Commit-Scope gezielt prüfen.
- Vor Commit mindestens `git diff --check`, Querverweise und die Liste geänderter Dateien prüfen.

## 9. Nicht verifiziert

- Laufzeitverhalten der Supabase-Cloud-Datenbank,
- aktiver Vercel-Deployment-Schutz,
- Cloud-Auth-, Redirect- und SMTP-Konfiguration,
- Backup-/Restore-Funktion,
- Supabase-Datenregion und AV-Verträge,
- dediziertes Monitoring,
- Barrierefreiheit,
- mobile PWA-Installierbarkeit nach Manifest-Fix,
- funktionale Ende-zu-Ende-Verifikation des `delete_training()`-Lösch-Flows
  in Produktion (echter `team_owner`-Login, Training anlegen/löschen); nicht
  durchgeführt, da produktionsdatenverändernd (Details `docs/CURRENT_TASK.md`).
