# Status — technisches Audit

**Stand:** 2026-07-21
**Geprüfter Stand:** `main` / `e3a0698` (enthält bereits committet `FC-TRAINING-005`), einschließlich lokaler, noch nicht committeter Code- und Migrationsänderungen für `FC-TRAINING-003` (Details: `docs/CURRENT_TASK.md`).

Dieses Dokument ist die verbindliche lebende Übersicht für belegte technische Abweichungen, Risiken und Übergabepunkte. Technischer Ist-Zustand: `docs/ARCHITECTURE.md`. Fachliches Ziel: `docs/FEATURE_CATALOG.md`, `docs/ROLES_AND_PERMISSIONS.md` und `docs/DATABASE_MODEL.md`.

## 1. Kurzurteil

Der Einzelteam-Kernflow ist im Repository implementiert: Auth, Team-Erstellung, Einladung, Self-/Guardian-Join, Join-Entscheidung, Spieler-Soft-Remove, Trainingsanlage, Trainingsabsage und Spieler-/Guardian-RSVP.

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
| Training bedingt hart löschen | `delete_training()` in `20260721114453_delete_training.sql`, `deleteTrainingAction()`, `DeleteTrainingForm` und Event-Detailseite; lokal migriert und in `tests/e2e/core-flow-delete-training.spec.ts` für `team_owner`-only verifiziert. Serverseitig geprüft: exaktes `LÖSCHEN`, zukünftiger Beginn, nicht abgesagt, keine abgegebene Spieler-RSVP, kein `assistant_coach`/`team_manager`, explizites `REVOKE` für `PUBLIC`/`anon`. `head_coach`-only bleibt wegen fehlendem legitimen Testkonto-Weg offen; Trainer-RSVP ist noch nicht implementiert und muss bei Einführung von `event_staff_rsvps` ergänzt werden. |
| Spieler-/Guardian-RSVP und Trainerübersicht | `respond_to_event()`, `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx` |
| RLS auf allen 18 öffentlichen Tabellen | `supabase/migrations/*` |
| CI für Lint und Build | `.github/workflows/ci.yml` |
| Temporärer interner Zugangsschutz (HTTP Basic Auth vor Supabase-Login) | lokal automatisiert getestet (`tests/e2e/internal-access.spec.ts`, `tests/e2e/internal-access-enabled.spec.ts`); auf Vercel aktiviert (Projekt `vereon`, Scope `vereon-app`, Production-Deployment `dpl_NnTeWpNNmmEP9BbSAXfmwcXFxM5t`, Commit `029de982`); extern gegen `https://www.vereon.app` geprüft am 2026-07-19: ohne Zugangsdaten `HTTP 401` mit `WWW-Authenticate: Basic realm="Vereon Internal Access"` und `Cache-Control: private, no-store`, mit korrekten Zugangsdaten `HTTP 307` auf `/login`. Kein Ersatz für Supabase Auth/RLS, ausdrücklich temporär (`DEC-011`), vor externem Pilot zu entfernen/ersetzen. |
| `/manifest.webmanifest` ohne Supabase-Login-Weiterleitung, interner Zugangsschutz bleibt davor aktiv | lokal implementiert und automatisiert getestet (`src/proxy.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/internal-access-enabled.spec.ts`); deployed (Production-Deployment `dpl_EQdwdj8bj5WidmbvAfKYptHtg5yT`, Commit `5caf3b7276893013ba2ef1b5da39d66907bb2b17`, Status `READY`) und extern gegen `https://www.vereon.app` verifiziert am 2026-07-19 (durch Codex geprüft, laut Nutzerangabe): ohne interne Zugangsdaten `HTTP 401`, mit korrekten internen Zugangsdaten `HTTP 200` mit `Content-Type: application/manifest+json; charset=utf-8` ohne Supabase-Login-Weiterleitung; `/dashboard` antwortet mit korrektem internem Zugang ohne Supabase-Session weiterhin mit `HTTP 307` auf `/login?redirect=%2Fdashboard`. Damit ist die Reihenfolge extern bestätigt: interner Zugangsschutz → Supabase-Routenschutz → Anwendung. |

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

Lokale Supabase-Prüfung:

- `.env.local` verweist auf die lokale API `127.0.0.1:54321`,
- Datenbank, Auth, REST, Realtime, Storage, Studio und weitere Kerncontainer liefen,
- `supabase_vector_vereon-app` startete wiederholt neu.

Die Vector-Störung ist ein lokales Betriebsrisiko; ein Fehler des fachlichen Kernflows ist daraus nicht belegt.

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
| Training bedingt hart löschen | lokal umgesetzt und verifiziert; echte E2E-Abdeckung für `team_owner`-only, `head_coach`-only offen; Trainer-RSVP-Sperre folgt erst mit der noch nicht vorhandenen `event_staff_rsvps`-Tabelle |
| RSVP nur bis Terminbeginn | `respond_to_event()` prüft keine `starts_at`-Deadline |
| Trainer-RSVP | keine `event_staff_rsvps`-Tabelle und kein Flow |
| Einladungscode erneuern/deaktivieren | ältere Revoke-RPC vorhanden, aber kein vollständiger `public_code`-Flow |
| Einladungscode-Rechte für Assistant Coach | aktuelle Policies/RPCs sind nicht konsistent mit dem beschlossenen Ziel |
| Beitrittsanfragen für Assistant Coach sichtbar | Ziel erlaubt Einsicht, aktuelle `team_join_requests`-RLS nur `team_owner`/`head_coach` |
| Rollenverwaltung durch Team Owner | kein App-Flow; DB-Strukturen allein genügen nicht |
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

- Das Repository enthält 15 additive Migrationen; die letzte,
  `20260721114453_delete_training.sql`, ist gegen den lokalen
  Supabase-Docker-Stack angewendet und in der lokalen Migrationsliste
  bestätigt.
- Der Remote-Migrationsstand wurde in diesem Audit nicht abgefragt.
- Laut Nutzer wurden Cloud-Migrationen bisher durch Claude Code angewendet.
- Jede künftige Remote-Migration braucht eine separate ausdrückliche Freigabe.
- Es wurde kein `db push`, `db reset` oder Remote-Zugriff ausgeführt.
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
- tatsächlicher Remote-Migrationsgleichstand.
