# Current Task

**Stand:** 2026-07-23

## Aktuell: FC-RSVP-003 „Trainer-RSVP abgeben" — lokal implementiert, verifiziert, committet und Codex-reviewt

Die additive Migration `20260722090000_add_staff_rsvp.sql` ergänzt die von
Spieler-RSVP getrennte Tabelle `event_staff_rsvps`, die RLS-Hilfsfunktion und
Policies sowie `respond_to_event_as_staff()` und
`list_staff_rsvps_for_event()`. `delete_training()` wurde in derselben
Migration atomar um die Trainer-RSVP-Sperre erweitert. Alle neuen Funktionen
entziehen `PUBLIC` und `anon` explizit `EXECUTE` und gewähren den Aufruf nur
`authenticated`.

Anwendungscode und UI sind umgesetzt: `respondToEventAsStaffAction()` verwendet
nur die serverseitig zurückgegebene `team_id`,
`TRAINING_STAFF_RSVP_ROLES` enthält ausschließlich `team_owner`, `head_coach`
und `assistant_coach`, und die Event-Detailseite zeigt eine getrennte Card
„Trainer-Rückmeldungen" mit freier optionaler Notiz. Die Hard-Delete-Anzeige
fragt Trainer-RSVP zusätzlich fail-closed ab und verschwindet, sobald eine
solche Antwort vorhanden ist.

**Tests im Arbeitsbaum:** Neu sind
`tests/e2e/trainingStaffRsvpRoleContract.spec.ts` und
`tests/e2e/core-flow-staff-rsvp.spec.ts`; außerdem prüft
`tests/e2e/core-flow-delete-training.spec.ts` die Blockade durch eine
Trainer-RSVP. Der Kernflow deckt UPSERT, anonyme und unberechtigte Aufrufe,
Absage, Vergangenheit und Deadline-Grenze, die dedizierte Listen-RPC,
UI-Verhalten sowie das Parallelrennen mit `delete_training()` ab.

**Umsetzung erfolgte arbeitsteilig:** Codex hat Migration, Anwendungscode,
Tests und Dokumentation nach einem zuvor unabhängig durch Codex geprüften und
korrigierten Plan erstellt; die Docker-abhängigen Prüfungen (lokale Migration,
`db lint`/`db advisors`, Playwright) konnten in Codex' Sandbox mangels
Docker-Zugriff nicht ausgeführt werden und wurden anschließend in dieser
Umgebung nachgeholt.

**Lokal vollständig geprüft (Stand 2026-07-22):** Migration
`20260722090000_add_staff_rsvp.sql` mit `supabase migration up --local`
angewendet und über `supabase migration list --local` bestätigt. Danach
erfolgreich: `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`git diff --check`, `supabase db lint --local` (kein neuer Befund zu den
neuen Funktionen — nur ein bereits bestehender, unabhängiger Hinweis zu
`generate_team_code`) und `supabase db advisors --local` (sechs neue
WARN-Hinweise zu `event_staff_rsvps`, ausschließlich Performance-Kategorie
`auth_rls_initplan`/`multiple_permissive_policies` — exakt dasselbe bereits
akzeptierte Muster wie bei der bestehenden Schwestertabelle
`event_attendance`, keine neue Problemklasse).

Vollständiger `npx playwright test`-Lauf: **66/66 Tests bestanden.** Dabei
wurde ein durch die Implementierung verursachter, echter (kleiner) Fehler
gefunden und behoben: `StaffRsvpForm.tsx` verwendete für den abgesagten
Zustand denselben Wortlaut („Dieses Training wurde abgesagt.") wie das
bereits bestehende, allen Betrachtern angezeigte Absage-Banner auf derselben
Seite — dadurch erschien der Text doppelt und brach den zuvor unabhängig
grünen Test `core-flow-cancel-training.spec.ts` (Strict-Mode-Konflikt bei
`getByText`). Behoben durch abweichenden Text
(„Rückmeldung ist nicht mehr möglich."); anschließend erneut vollständig grün
verifiziert. Ein einzelner Testlauf-Ausreißer (Timeout durch Next.js/Turbopack
Dev-Server-Kaltstart-Kompilierung beim allerersten Testaufruf der Sitzung) war
beim Wiederholungslauf mit warmem Server reproduzierbar nicht mehr vorhanden —
kein Logikfehler.

**Commit und Codex-Review (Stand 2026-07-23):** Lokal als Commit `f89a8ae`
committet. Unabhängiger Codex-Review gegen Auftrag, Repository und
zuständige Dokumente durchgeführt: keine P0-/P1-Befunde; RPC-Autorisierung,
RLS und das Race-Handling zwischen `respond_to_event_as_staff()` und
`delete_training()` wurden als korrekt bestätigt. Die gemeldeten P2-Befunde
(Rollenvertrag deckte nur die Listen-RPC ab, mehrere widersprüchliche/
veraltete Doku-Aussagen zu Migrationsstand, Commit-Stand und
Rollenwechsel-Historie) wurden behoben — siehe `docs/STATUS.md` für den
vollständigen Review-Nachtrag. Ein P3-Hinweis (Race-Test erzwingt pro Lauf
nur eine Sperrreihenfolge) bleibt offen, laut Codex ohne erkennbaren
funktionalen Bypass.

**Remote-Migration und Push (Stand 2026-07-23, mit ausdrücklicher Freigabe):**
`supabase db push` gegen die Supabase-Cloud-Produktionsdatenbank ausgeführt;
`supabase migration list` bestätigt alle 16 Migrationen als Local == Remote,
inklusive `20260722090000_add_staff_rsvp.sql`. Anschließend `git push` auf
`origin/main`: `main` und `origin/main` sind identisch (`d1d89dc`). Kein
Deployment für diesen Stand bislang angestoßen oder verifiziert.

**Bekannte Testgrenze:** Echte E2E-Konten nur mit `head_coach` oder
`assistant_coach` können weiterhin nicht legitim provisioniert werden;
`FC-ROLE-002` bleibt `planned_mvp`. Die Rollen sind im RPC-Code und im
statischen Rollenvertrag abgedeckt, was die offenen Integrationsfälle nicht
ersetzt.

## Vorangegangene Aufgabe: FC-TRAINING-004 „Training löschen" — implementiert, committet, remote migriert und deployed

Die bereits fachlich festgelegte bedingte Hard-Delete-Funktion ist lokal
umgesetzt. `delete_training()` in
`supabase/migrations/20260721114453_delete_training.sql` erlaubt das Löschen
ausschließlich `team_owner` und `head_coach`, ausschließlich vor Beginn,
ausschließlich bei exakt eingegebenem Bestätigungstext `LÖSCHEN` und nur,
wenn keine Spieler-RSVP abgegeben wurde. Automatisch angelegte
`event_attendance`-Zeilen mit `rsvp_status IS NULL` blockieren nicht. Abgesagte
Trainings bleiben als Historie erhalten und können nicht gelöscht werden.

Die Detailseite zeigt das Löschformular nur, wenn die lokal ermittelten
Voraussetzungen erfüllt sind; bei nicht erfüllten Voraussetzungen bleibt die
Absage der vorgesehene UI-Weg. Sämtliche Regeln werden zusätzlich atomar in der
RPC geprüft. Neue Dateien: `src/features/events/DeleteTrainingForm.tsx`,
`tests/e2e/core-flow-delete-training.spec.ts` und
`tests/e2e/trainingDeleteRoleContract.spec.ts`; geändert wurden
`src/actions/events.ts`, die Event-Detailseite und `src/lib/permissions.ts`.

**Lokal geprüft:** Migration `20260721114453_delete_training.sql` angewendet
und per `supabase migration list --local` bestätigt; gezielte Tests 2/2 und
vollständiger Playwright-Lauf **60/60** grün. Außerdem erfolgreich:
`npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`,
`supabase db lint --local` und `supabase db advisors --local`. Die DB-Prüfungen
meldeten keinen neuen Befund zu `delete_training()`; bestehende Hinweise
anderer Funktionen/Policies bleiben getrennt offen.

**Damals bekannte Grenze, inzwischen im aktuellen Arbeitsbaum geschlossen:**
`event_staff_rsvps` und die atomare Trainer-RSVP-Sperre in
`delete_training()` sind Bestandteil der aktuellen FC-RSVP-003-Umsetzung; ihr
Laufzeit-Prüfstand steht oben. `head_coach`-only bleibt mangels legitimem
Testkonto-Weg nicht end-to-end verifiziert; `team_owner`-only ist für den
bisherigen Spieler-RSVP-Löschflow echt E2E geprüft.

**Unabhängiger Codex-Review (Stand 2026-07-22):** Review gegen Auftrag,
Repository und zuständige Dokumente durchgeführt. Ergebnis: RPC-Logik,
Autorisierung und Nebenläufigkeit korrekt, keine funktionalen Befunde. Ein
P2-Befund (veralteter, widersprüchlicher Statussatz in
`docs/DATABASE_MODEL.md` Zeile 300–301 gegenüber der bereits korrekten
Statuszeile in Abschnitt 12) wurde behoben.

**Freigabestand (Stand 2026-07-22):** Lokal implementiert, migriert,
getestet, reviewt und als Commit `71771bd` (Anwendungscode) sowie `a75df7d`
(Doku-Nachtrag) auf `main` committet. `main` wurde per `git push` auf
`origin/main` veröffentlicht (`origin/main` = `a75df7d`, lokal und remote
identisch). Alle 15 lokalen Migrationen — inklusive
`20260704120000_remove_player_from_team.sql`,
`20260721094219_update_training.sql` und
`20260721114453_delete_training.sql`, die zuvor remote fehlten — wurden per
`supabase db push` gegen die Supabase-Cloud-Produktionsdatenbank angewendet
und per `supabase migration list` bestätigt (Local == Remote für alle
Einträge).

Vercel-Deployment `dpl_CYKavARpN1woWMtD4hB34mAYAqX8` für exakt Commit
`a75df7d` ist `READY` auf `production` (Aliase `vereon.app`/`www.vereon.app`).
Nicht-mutierende externe HTTP-Prüfung ohne interne Zugangsdaten bestätigt das
bekannte Basic-Auth-Verhalten (`/manifest.webmanifest` und `/dashboard` →
`401` mit `WWW-Authenticate: Basic realm="Vereon Internal Access"`).

**Noch offen:** Eine funktionale Ende-zu-Ende-Verifikation des tatsächlichen
Lösch-Flows in Produktion (echter `team_owner`-Login, Training anlegen,
löschen, Bestätigungstext prüfen) wurde bewusst **nicht** durchgeführt, da
sie Produktionsdaten verändern würde; das braucht ein geeignetes
Produktions-Testkonto und eine eigene, separate Freigabe.

## Vorangegangene Aufgabe: FC-TRAINING-003 „Training bearbeiten" — lokal implementiert und verifiziert

**Stand:** 2026-07-21. Ausgangslage: `main` / `e3a0698` (enthält bereits
committet und auf `origin/main` gepusht `FC-TRAINING-005` „Training absagen";
Deployment dieses Commits nicht verifiziert). Die Planung wurde in
mehreren Runden unabhängig durch Codex reviewt und entsprechend korrigiert
(RPC-Benennung `update_training()` statt `update_event()`, serverseitig
ermittelte `team_id` statt Client-Wert für Redirect/Revalidation, explizite
`REVOKE`/`GRANT EXECUTE`, Entfernung beider dormant Schreib-Policies,
`clock_timestamp()` statt `now()` für die Zeitgrenzen, `src/lib/datetime.ts`
mit expliziter DST-/Kalenderdatum-Validierung, RSVP-Warnung, Testinfrastruktur
ohne neue Pakete).

**Bestätigte Produktentscheidungen:**

1. Ein abgesagtes Training bleibt unveränderliche Historie und ist nicht mehr bearbeitbar.
2. Bestehende Spieler-RSVP bleiben bei einer Terminverschiebung vollständig erhalten.
3. Bei vorhandenen RSVP und Zeitänderung weist das Formular deutlich darauf hin, dass Rückmeldungen erhalten bleiben und keine automatische Benachrichtigung versendet wird; bei tatsächlicher Zeitänderung ist eine zusätzliche bewusste Bestätigung erforderlich.
4. `ends_at` wird in diesem Block nicht bearbeitet und bleibt unverändert.
5. Die beiden bislang wirkungslosen RLS-Policies `events_insert_coach` und `events_update_coach` werden entfernt; Schreibzugriffe auf `events` erfolgen ausschließlich über gehärtete RPCs.
6. Sowohl das aktuell gespeicherte als auch das neu eingereichte `starts_at` müssen zum Ausführungszeitpunkt der RPC in der Zukunft liegen.

**Neue/geänderte Dateien:**

- `supabase/migrations/20260721094219_update_training.sql` (neu): RPC
  `update_training()` — nur `team_owner`/`head_coach`/`assistant_coach`, nur
  `event_type='training'`, nur solange weder gespeichertes noch neues
  `starts_at` erreicht ist (`clock_timestamp()`), nur solange nicht
  abgesagt; `team_id`, `club_id`, `season_id`, `created_by`, `event_type`,
  `is_cancelled`, `ends_at` sind nicht Teil der Signatur; generische
  Fehlermeldung „Termin nicht gefunden" für nicht existente, fremde und
  Nicht-Training-Events (Enumerationsschutz); explizites `REVOKE`/
  `GRANT EXECUTE` auf `authenticated`; `DROP POLICY` für
  `events_insert_coach` und `events_update_coach`.
- `src/lib/datetime.ts` (neu): `viennaLocalToUTC()`/`utcToViennaLocal()` mit
  expliziter Validierung ungültiger Kalenderdaten/Uhrzeiten, Ablehnung nicht
  existierender Lokalzeiten (Sommerzeit-Beginn) und dokumentierter,
  deterministischer Auflösung mehrdeutiger Lokalzeiten (Winterzeit-Beginn:
  frühere/Sommerzeit-Entsprechung).
- `src/actions/events.ts` (geändert): neue `updateTrainingAction()` (nutzt
  ausschließlich die von der RPC zurückgegebene `team_id`, nie einen
  Client-Wert, für Redirect/Revalidation); `createEventAction()` nutzt jetzt
  dieselbe zentrale `viennaLocalToUTC()` statt einer lokalen Kopie.
- `src/lib/permissions.ts` (geändert): neue `TRAINING_EDIT_ROLES`.
- `src/features/events/EditEventForm.tsx` (neu): Formular analog
  `CreateEventForm.tsx`, vorbefüllt, mit zweistufiger RSVP-Warnung
  (dauerhafter Hinweis + `ConfirmButton`-Bestätigung bei Zeitänderung).
- `src/app/(app)/teams/[teamId]/events/[eventId]/edit/page.tsx` (neu):
  Server Component, serverseitiges Rollen-/Status-/Zeit-Gating (kosmetisch,
  Durchsetzung liegt in der RPC).
- `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx` (geändert):
  „Bearbeiten"-Einstiegspunkt, sichtbar nur für berechtigte, nicht
  abgesagte, noch nicht begonnene Trainings.
- `tests/e2e/core-flow-edit-training.spec.ts` (neu), `tests/e2e/
  trainingEditRoleContract.spec.ts` (neu), `tests/e2e/datetime.spec.ts`
  (neu, reine Tests ohne Browser-Fixture).
- `docs/ARCHITECTURE.md`, `docs/DATABASE_MODEL.md`, `docs/FEATURE_CATALOG.md`,
  `docs/MVP_SCOPE.md`, `docs/MVP_TEST_CHECKLIST.md`, `docs/PROJECT_BRIEF.md`,
  `docs/ROADMAP.md`, `docs/SECURITY.md`, `docs/STATUS.md`,
  `docs/USER_FLOWS.md` aktualisiert.

**Lokal geprüft (Stand 2026-07-21):** Migration
`20260721094219_update_training.sql` mit `supabase migration up --local`
gegen den lokalen Supabase-Docker-Stack angewendet und über
`supabase migration list --local` bestätigt. Der gezielte
`core-flow-edit-training.spec.ts`-Lauf sowie der vollständige
`npx playwright test`-Lauf waren erfolgreich: **58/58 Tests bestanden**.
Ebenfalls erfolgreich: `npx tsc --noEmit`, `npm run lint`, `npm run build`,
`git diff --check`, `supabase db lint --local` und
`supabase db advisors --local`. Lint/Advisors meldeten keinen neuen Befund zu
`update_training()`; bestehende Hinweise bleiben getrennt dokumentiert.

**Bekannte Testlücke (wie bei FC-TRAINING-005):** `head_coach`-only und
`assistant_coach`-only sind **nicht** end-to-end verifizierbar — kein
legitimer App-/RPC-Weg für ein isoliertes Testkonto (`FC-ROLE-002`
weiterhin `planned_mvp`). Ersatzweise über RPC-Code-Review und den
statischen Rollenvertrags-Test `TRAINING_EDIT_ROLES`
(`tests/e2e/trainingEditRoleContract.spec.ts`) abgedeckt — ersetzt NICHT die
offene Integrationsverifikation.

**Dokumentierter Security-Folgebedarf (nicht in diesem Auftrag behoben):**
Die bereits bestehenden RPCs `create_event()`, `respond_to_event()`,
`cancel_event()` u. a. haben kein `REVOKE`/`GRANT EXECUTE` und laufen
weiterhin mit Standard-`PUBLIC`-Execute (neu dokumentiert in
`docs/SECURITY.md` Abschnitt 6). Kein Rückbau bestehender Funktionalität
ohne eigenen Auftrag.

**Getrennte Freigabepunkte (aus dem Planungsblock übernommen, jeweils
einzeln einzuholen, keine Kettenfreigabe):** Implementierung (**erteilt und
umgesetzt**) → lokale Migration und lokale Tests (**erteilt, umgesetzt und
58/58 grün**) → Remote-Migration/`db push` (**offen**) → Commit
(**umgesetzt: `44250f0`**)
→ Push (**offen**) → Deployment (**offen**).

Diese Umsetzung ist **lokal implementiert, migriert, getestet und committet**;
kein Push, kein Deployment und keine Remote-Datenbankaktion für
`FC-TRAINING-003`.

## Aufgabe abgeschlossen: /manifest.webmanifest ohne Login-Weiterleitung

`/manifest.webmanifest` (erzeugt von `src/app/manifest.ts`) wurde von
`src/proxy.ts` bislang wie jede andere geschützte Anwendungsroute behandelt:
Ohne Supabase-Session leitete der Proxy auf `/login` um, bevor Next.js die
Manifest-Antwort ausliefern konnte. Der vorgelagerte temporäre interne
Zugangsschutz (HTTP Basic Auth) prüft zwar vor jeder weiteren Logik, war
davon aber nicht betroffen — er blieb unverändert vor allen Routen aktiv.

**Lösung:** `/manifest.webmanifest` wurde in `PUBLIC_ROUTES` in
`src/proxy.ts` aufgenommen, analog zu `/`, `/login`, `/register` und
`/auth/callback`. Keine Änderung an `src/lib/internal-access.ts` oder an
der Prüfreihenfolge — der interne Zugangsschutz greift weiterhin zuerst und
unverändert vor dem Manifest und allen anderen Routen.

Geänderte/neue Dateien: `src/proxy.ts`, `tests/e2e/smoke.spec.ts` (neuer
Test: Manifest ohne Supabase-Login erreichbar, `200`,
`application/manifest+json`, kein Redirect), `tests/e2e/internal-access-enabled.spec.ts`
(neuer Test: mit korrekten internen Zugangsdaten ist das Manifest ohne
Supabase-Login erreichbar; der bereits vorhandene Test, dass das Manifest
ohne internen Zugang mit `401` blockiert bleibt, deckte den aktivierten
Schutzzustand bereits ab).

**Lokal geprüft (Stand 2026-07-19):** `npx tsc --noEmit`, `npm run lint`,
`npm run build` und `git diff --check` waren erfolgreich. Nach dem Start des
lokalen Supabase-Docker-Stacks wurde zusätzlich der vollständige
Playwright-Lauf mit `npx playwright test` ausgeführt: **29/29 Tests
bestanden**. Darin enthalten waren beide Kernflows, die
Cookie-Refresh-Regression, sämtliche Manifest-/Basic-Auth-Tests und die
POST-/Server-Action-Regression.

**Deployment und externe Verifikation (Stand 2026-07-19, laut Nutzerangabe):**
Deployed auf Production-Deployment `dpl_EQdwdj8bj5WidmbvAfKYptHtg5yT`, Commit
`5caf3b7276893013ba2ef1b5da39d66907bb2b17`, Status `READY`. Extern durch Codex
gegen `https://www.vereon.app` geprüft: `/manifest.webmanifest` antwortet ohne
interne Zugangsdaten mit `HTTP 401`, mit korrekten internen Zugangsdaten mit
`HTTP 200` und `Content-Type: application/manifest+json; charset=utf-8` ohne
Supabase-Login-Weiterleitung; `/dashboard` antwortet mit korrektem internem
Zugang ohne Supabase-Session weiterhin mit `HTTP 307` auf
`/login?redirect=%2Fdashboard`. Vollständiger Beleg: `docs/STATUS.md`. Damit
gilt dieser Auftrag als **abgeschlossen**, der P0-Punkt „Manifest-Korrektur
deployed/extern verifiziert" als verifiziert geschlossen.

## Vorangegangene Umsetzung: Temporärer interner Zugangsschutz

Ein temporärer interner Zugangsschutz (HTTP Basic Auth vor der bestehenden
Supabase-Anmeldung) wurde implementiert, weil Vercel Deployment Protection
auf dem aktuellen Tarif Custom-Production-Domains
(`vereon.app`/`www.vereon.app`) nicht abdeckt (`ssoProtection.deploymentType`
lässt sich dort nicht auf `all` setzen, HTTP 428). Grundlage: `DEC-011`
(geschütztes Entwicklungs-Deployment).

Ablauf: `Besucher → interner Zugangsschutz → Vereon-/Supabase-Login →
Anwendung`. **Basic Auth ist kein Ersatz für Supabase Auth oder RLS**, keine
Nutzerverwaltung, ausdrücklich **temporär** — wird vor einem externen Pilot
entfernt oder durch eine geeignete Plattformlösung ersetzt.

**Auftrag abgeschlossen (Stand 2026-07-19):** Der Schutz ist lokal
automatisiert getestet, auf Vercel aktiviert und extern gegen
`https://www.vereon.app` verifiziert. Für dieses Deployment wurde kein
weiterer Anwendungscode verändert. Vollständiger Betriebs- und
HTTP-Nachweis (Deployment-ID, Commit, externe Prüfergebnisse):
`docs/STATUS.md`. Der P0-Punkt „Deployment öffentlich erreichbar“ gilt
damit als **verifiziert geschlossen** — der Schutz bleibt ausdrücklich
temporär und ist vor einem externen Pilot zu entfernen oder durch eine
geeignete Plattformlösung zu ersetzen.

## Vorangegangene Umsetzung: Codex-Review-Korrekturen

**Nachgebesserter Stand nach unabhängigen Codex-Reviews:** Die Befunde aus
beiden Reviews wurden behoben.

- **P1 (Cookie-Staleness):** `updateSession()` (`src/lib/supabase/middleware.ts`)
  baute die an nachgelagerte Server Components weitergereichten Header vor
  dieser Korrektur einmalig aus einer eingefrorenen Kopie; ein von Supabase
  in `setAll()` gesetzter aktualisierter Session-Cookie wurde dadurch nicht
  weitergereicht. `updateSession()` erhält jetzt ein Flag
  (`stripAuthorization: boolean`) statt einer vorab erzeugten Header-Kopie
  und baut die Header bei jedem `NextResponse.next()`-Aufruf frisch aus dem
  jeweils aktuellen `request.headers`. Durch einen gezielten
  Regressionstest gegen echtes lokales Supabase nachgewiesen
  (`tests/e2e/internal-access.spec.ts`, Beschreibung „Cookie-Refresh
  (P1-Regression)“); der Test wurde verifiziert, indem er absichtlich gegen
  die alte fehlerhafte Logik ausgeführt wurde und dort fehlschlug.
- **P2 (tsconfig.json-Mutation):** Der zweite, dedizierte Dev-Server für den
  aktivierten Testzustand verwendet einen eigenen `distDir`
  (`NEXT_DIST_DIR=.next-internal-access-test`, `next.config.ts`), damit zwei
  parallele `next dev`-Instanzen nicht am selben Build-Ordner-Lockfile
  kollidieren. Next.js hätte dafür bei jedem Testlauf automatisch zwei
  `include`-Einträge in `tsconfig.json` ergänzt. Diese Einträge wurden
  stattdessen bewusst und dauerhaft in `tsconfig.json` ergänzt (Begründung
  dort als Kommentar), sodass Next.js beim Testlauf nichts mehr zu ergänzen
  findet und die Datei nicht mehr anfasst — geprüft per Prüfsummenvergleich
  vor/nach einem vollständigen `npx playwright test`-Lauf.
- **P1 (Supabase-Cache-Header):** `@supabase/ssr` `0.12.0` übergibt bei
  Auth-Cookie-Updates zusätzlich `Cache-Control`, `Expires` und `Pragma` an
  `setAll()`. `updateSession()` übernimmt diese gelieferten Werte jetzt
  unverändert auf die Session-Response. Login-/Dashboard-Redirects erhalten
  die aktualisierten Session-Cookies und Schutzheader ebenfalls, ohne interne
  `x-middleware-*`-Header zu kopieren.
- **P1 (lokale Testgrenze):** Der echte Cookie-Refresh-Test parst die
  konfigurierte Supabase-URL vor jeder Client-Erzeugung und läuft nur gegen
  `localhost`, `127.0.0.1` oder IPv6-Loopback. Ungültige oder Cloud-URLs
  werden ohne Netzwerkzugriff übersprungen. Ein fester lokaler Testaccount
  wird wiederverwendet, damit nicht jeder Lauf einen weiteren Nutzer anlegt.

Geänderte/neue Dateien: `src/lib/internal-access.ts` (neu),
`src/proxy.ts`, `src/lib/supabase/middleware.ts`, `playwright.config.ts`,
`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`,
`tests/e2e/internal-access.spec.ts` (neu, inkl. P1-Regressionstest),
`tests/e2e/internal-access-enabled.spec.ts` (neu).

Server-Umgebungsvariablen (Namen, keine Werte): `INTERNAL_ACCESS_ENABLED`,
`INTERNAL_ACCESS_USERNAME`, `INTERNAL_ACCESS_PASSWORD`. Sie sind laut
verifiziertem Betriebsstand vom 2026-07-19 für Production und Preview in
Vercel gesetzt; Werte, Benutzername und Passwort werden nicht dokumentiert.

## Abgeschlossen

Der Implementierungsblock ist vollständig geprüft und committet (`029de982`);
Branch, Commit und aktueller Dirty-Status werden bei Bedarf direkt mit Git
ermittelt. Lokal waren nach den Codex-Review-Korrekturen der vollständige
Playwright-Lauf (`27/27` Tests), der gezielte P1-Regressionstest,
`tsc --noEmit`, `lint`, `build` und `git diff --check` erfolgreich;
`tsconfig.json` und der Git-Status blieben dabei unverändert. Deployment,
Variablen-Setzung in Vercel und externe Verifikation sind erfolgt (siehe
oben und `docs/STATUS.md`). Damit ist dieser Auftrag abgeschlossen.

## Aufgabe lokal abgeschlossen: FC-TRAINING-005 „Training absagen" verdrahtet

Die bereits vorhandene, vollständig rechteprüfende `cancel_event()`-RPC
(`supabase/migrations/20260629200000_add_events.sql`) wurde ohne Migration in
den App-Flow verdrahtet (`FC-TRAINING-005` in `docs/FEATURE_CATALOG.md`, jetzt
`implemented`).

**Neue/geänderte Dateien:** `src/actions/events.ts` (`cancelEventAction`),
`src/lib/permissions.ts` (neu, `TRAINING_CANCEL_ROLES`
— von der bestehenden `isTrainer`-Anzeige bewusst getrennt, da diese die
fachlich nicht mehr aktive Rolle `team_manager` einschließt; produktiv
ausschließlich als Parameter von `has_team_role()` auf der Event-Detailseite
verwendet, keine eigene Gating-Funktion),
`src/features/events/CancelEventButton.tsx` (neu), Event-Detailseite,
Trainingsliste, Team-Detailseite und Dashboard (jeweils: „Abgesagt"-Badge
ergänzt, bisheriger `.eq('is_cancelled', false)`-Filter entfernt, damit
abgesagte Trainings wie fachlich gefordert sichtbar bleiben).

**Geprüft (Stand 2026-07-19):** `npx tsc --noEmit`, `npm run lint`,
`npm run build` und vollständiger `npx playwright test`-Lauf gegen lokales
Supabase: **40/40 Tests bestanden** (neu: `core-flow-cancel-training.spec.ts`,
`trainingCancelRoleContract.spec.ts` und
`helpers/supabaseTestGuard.spec.ts`; keine Regression in bestehenden Specs).
Details: `docs/STATUS.md`.

**Bekannte Testlücke:** `head_coach`-only und `assistant_coach`-only sind
**nicht** end-to-end verifiziert — es gibt aktuell keinen legitimen
App-/RPC-Weg, ein isoliertes Testkonto für diese Rollen zu erzeugen (kein
`GRANT INSERT`/`DELETE` auf `team_member_roles` für `authenticated`, keine
Co-Trainer-RPC; `FC-ROLE-002` weiterhin `planned_mvp`). Stattdessen über
RPC-Code-Review (`cancel_event()` prüft alle drei Rollen symmetrisch) und
einen statischen Rollenvertrags-Test für `TRAINING_CANCEL_ROLES`
(`tests/e2e/trainingCancelRoleContract.spec.ts`) abgedeckt — dies ersetzt
NICHT die offene End-to-End-Verifikation für `head_coach`-only und
`assistant_coach`-only. Isolierte, rein testbezogene
Rollen-Fixture-Provisionierung ist als separater Folgebedarf offen und braucht
eine eigene Freigabe.

**Nachtrag (Stand 2026-07-21):** Diese Umsetzung wurde inzwischen als Commit
`e3a0698` auf `main` committet und ist bestätigt auf `origin/main` gepusht
(`git rev-parse HEAD` entspricht `git rev-parse origin/main`). Ein
Deployment-Nachweis für diesen Commit liegt aktuell nicht vor und gilt als
nicht verifiziert, nicht als abgeschlossen (siehe `docs/STATUS.md`). Die
Formulierung „kein Commit" oben bezog sich auf den damaligen Stand zum
Zeitpunkt der Implementierung.

## Harte Grenzen

- keine Remote-Datenbank ohne separate ausdrückliche Freigabe,
- kein `db push`,
- kein `db reset` ohne ausdrückliche Freigabe in der aktuellen Sitzung,
- keine Secrets oder `.env`-Inhalte ausgeben,
- keine Packages ohne Freigabe,
- kein pauschales Staging über `git add .` oder `git add -A`.
