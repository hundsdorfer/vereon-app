# Current Task — Vereon

## Aktueller Stand

Abgeschlossen:

* Migration 001 `init_mvp0_core` — lokal verifiziert
* Migration 002 `mvp0a_team_flows` — lokal verifiziert
* Hotfix-Migration `fix_authenticated_table_grants` — lokal verifiziert
* Phase A UI-Fundament — committed:
  * responsive AppShell, Light/Dark Theme, Mobile, Safe Area, Touch Targets, allowedDevOrigins, UI-Basiskomponenten
* Phase B.1 Routing/Auth — committed:
  * Login/Register, Auth Actions, Auth Callback, Route-Gruppen, /dashboard Platzhalter, Root Redirect, proxy.ts Route-Schutz
* Phase B.2 AppShell UX Cleanup — committed:
  * User-E-Mail in AppShell, Logout auf Desktop + Mobile, aktive Navigation, /teams Platzhalterseite, kein toter Nav-Link
* Phase C Team-Erstellung und Teamübersicht — committed:
  * `createTeamAction` via RPC `create_independent_team()`
  * `CreateTeamForm` Client Component mit `useActionState`
  * `/teams/new` Formularseite
  * `/teams` zeigt echte Teams via RLS-gefilterter Query
  * `/dashboard` zeigt Team-Anzahl mit Link zu /teams
  * `revalidatePath` nach Team-Erstellung
  * `force-dynamic` auf /teams und /dashboard
  * Grant-Hotfix: SELECT-Grants für `authenticated` auf alle relevanten Tabellen
* Phase D Team-Detailseite — committed:
  * `/teams/[teamId]` lädt Teamdaten serverseitig via RLS
  * Teamname, Altersgruppe, Geschlecht, Typ, Status, Erstellungsdatum
  * `notFound()` bei fehlendem Zugriff oder unbekannter ID
  * Teams in `/teams` sind klickbar (ganzer Card-Bereich verlinkt)
  * Platzhalterbereiche für Spieler, Einladungslink, Beitrittsanfragen
* Phase E Einladungslink erstellen — committed:
  * `createInvitationLinkAction` via RPC `create_invitation_link()`
  * `CreateInvitationLinkForm` Client Component mit `useActionState`
  * `/teams/[teamId]/invite` Formularseite mit One-Time-Token-Anzeige
  * CTA auf Team-Detailseite
* Phase E.1A Automatischer Einladungscode — abgeschlossen, lokal verifiziert, lint/build ok
* Phase F.1 Join Request Datenmodell — abgeschlossen, lokal verifiziert, lint/build ok
* Phase F.2 Öffentliche `/join/[code]` Seite — abgeschlossen, lokal verifiziert, lint/build ok:
  * gültiger Code zeigt Teaminfo
  * Login/Register mit Redirect zurück zum Join-Link
  * Auswahl: Selbstbeitritt oder Kind anmelden
  * Self-Player- und Guardian-Child-Anfrage funktionieren
  * Position und Trikotnummer werden nicht abgefragt
* Phase B.3 Vollständiges Registrierungsprofil — abgeschlossen, lokal verifiziert, lint/build ok:
  * Felder: Vorname, Nachname, E-Mail, Geburtsdatum, Telefonnummer, Rolle, Passwort
  * Passwort: mindestens 8 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen
  * E-Mail- und Telefonnummernvalidierung verschärft
  * Nutzungsbedingungen und Datenschutzerklärung als Pflicht-Checkboxen mit Links
  * Legal-Platzhalterseiten unter `/legal/terms` und `/legal/privacy`
  * Formularwerte bleiben bei Validierungsfehlern erhalten; Passwort und Checkboxen werden zurückgesetzt
  * Migration `20260628000000_add_profile_registration_fields` — lokal anwenden mit `npx supabase migration up`
* Phase G.1 — Trainer sieht Beitrittsanfragen — abgeschlossen:
  * `/teams/[teamId]/requests` Seite mit Approve/Reject-Aktionen
  * Team-Detailseite zeigt Badge mit Anzahl offener Anfragen und CTA
  * `approve_join_request` und `reject_join_request` Server Actions
* Phase H.1 Profilbasierter Join-Flow — implementiert, Migration lokal anwenden:
  * Self-Player: Profildaten (Name, Geburtsdatum) read-only anzeigen, kein Name-Spoofing
  * Guardian: Pflicht-Datumsfeld `date_of_birth` statt optionalem `birth_year`
  * Migration `20260629000000_add_join_flow_improvements` — lokal anwenden mit `npx supabase migration up`

* Phase H — Angenommene Spieler im Team anzeigen — abgeschlossen, lint/build ok:
  * `player_team_assignments` mit `players`-Join serverseitig geladen (status = 'active')
  * Spieler-Karte auf Team-Detailseite zeigt Name, Geburtsdatum (date_of_birth bevorzugt, birth_year als Fallback), Label „Selbst beigetreten" vs. „Über Erziehungsberechtigte/n angemeldet" (via user_id)
  * Anzahl-Badge bei ≥ 1 Spieler
  * Empty State wenn keine aktiven Spieler
  * Query-Fehler: console.error + verständlicher Fehlertext im UI ohne Absturz
* Phase I — MVP-Kernflow Review & Stabilisierung — abgeschlossen, lint/build ok:
  * Login/Register-Cross-Links erhalten nun den `?redirect=`-Parameter (kein Redirect-Verlust beim Wechsel)
  * `build.log` und `supabase/snippets/` in `.gitignore` eingetragen
  * MVP-Kernflow komplett geprüft und stabil — keine weiteren Blocker
* Phase J — Spielerbereich MVP verbessern — abgeschlossen, lint/build ok:
  * Spieleranzahl im Header als Text „N Spieler" statt Badge
  * Name als `font-semibold` prominenter dargestellt
  * Geburtsdatum/Jahrgang und Beitrittsart als separate Zeilen
  * kein technischer Begriff im UI, keine neue Datei, keine Migration
* Phase L — MVP-Qualitätscheck und erste Automatisierung — abgeschlossen, lint/build ok:
  * `docs/MVP_TEST_CHECKLIST.md` erstellt: 11-Schritte-Kernflow, 5 Fehlerfälle, lokale DB-Queries, DSGVO-Sichtbarkeitschecks, Abschlusskriterien
  * `.github/workflows/ci.yml` erstellt: Trigger push/PR auf main, Node 20, npm ci + lint + build, Dummy-Env-Variablen (kein Secret, kein Remote-Zugriff)
* Phase M — MVP-Testcheckliste manuell durchtesten — abgeschlossen, lokal verifiziert:
  * Kompletter MVP-Kernflow lokal erfolgreich durchlaufen
  * Trainer registrieren, Team erstellen, Einladungscode/Link/QR-Code geprüft
  * Selbstbeitritt und Kind-Anmeldung funktionieren
  * Beitrittsanfragen annehmen/ablehnen funktionieren
  * Angenommene Spieler erscheinen im Team
  * GitHub Actions CI grün, lint und build sauber
* Phase K — QR-Code für Einladungslink — abgeschlossen, lint/build ok, committed und gepushed:
  * `react-qr-code` installiert (lokale SVG-Generierung, keine externe API)
  * QR-Code auf `/teams/[teamId]/invite` unter Code und Link angezeigt
  * schwarzer Code auf weißem Hintergrund — funktioniert in Light und Dark Mode
  * Code und Link bleiben weiterhin kopierbar
* Phase H RLS-Hotfix — `20260629100000_fix_players_trainer_rls` — abgeschlossen, lint/build ok:
  * Root Cause: In EXISTS-Subqueries der alten Policies (`players_select_trainer_assignment`, `players_select_trainer_pending_request`) wurde `id` als innerer SQL-Scope (`pta.id` bzw. `tjr.id`) aufgelöst statt als `players.id` → Bedingung war immer false → 0 Zeilen
  * Fix: `can_trainer_read_player(p_player_id uuid)` und `can_trainer_read_player_pending(p_player_id uuid)` als SECURITY DEFINER-Hilfsfunktionen; keine Scope-Ambiguität möglich
  * Beide Policies neu erstellt mit Verweis auf die Hilfsfunktionen
* Phase N.1 — Events-Datenmodell, RLS, RPC und Trigger — abgeschlossen, lokal verifiziert, lint/build ok, committed und gepushed:
  * Migration `20260629200000_add_events.sql` erstellt und angewendet
  * Tabellen `events` und `event_attendance` angelegt (inkl. CHECK-Constraints, UNIQUE, ON DELETE)
  * RLS für beide Tabellen: SELECT für Teammitglieder/Trainer/Self-Player/Guardian; INSERT/UPDATE nur Coaches; kein direktes DELETE
  * Hilfsfunktionen `is_trainer_for_event()` und `is_own_player_attendance()` (SECURITY DEFINER, kein Scope-Shadowing)
  * Auto-Attendance-Trigger: bei Event-Erstellung werden automatisch Attendance-Zeilen für alle aktiven Spieler des Teams angelegt
  * `create_event()`, `respond_to_event()`, `cancel_event()` als SECURITY DEFINER RPCs
  * `approve_join_request()` erweitert: Attendance-Backfill für zukünftige Events bei später angenommenen Spielern
  * TypeScript-Typen neu generiert

* Phase N.2 — Training erstellen UI — abgeschlossen, lint/build ok:
  * `/teams/[teamId]/events/new` mit `CreateEventForm` Client Component
  * `createEventAction` ruft RPC `create_event()` auf (event_type = 'training')
  * Datetime-Local → UTC-Konvertierung via `Europe/Vienna`-Offset
  * CTA auf Team-Detailseite
* Phase N.3 — Trainings anzeigen — abgeschlossen, lint/build ok:
  * `src/lib/format.ts`: zentrale `formatTrainingDateTime()` (de-AT, Europe/Vienna)
  * Team-Detailseite zeigt nächste 3 kommende Trainings (Titel, Datum/Uhrzeit, Ort)
  * Trainingsliste `/teams/[teamId]/events`: Kommende + Vergangene Trainings, EmptyState
  * Beide CTAs: „Training erstellen" + „Alle Trainings ansehen"
  * Keine Event-Detailseite, keine RSVP-UI

## Aktuelle Hauptaufgabe

**Phase N.4 — Trainingsdetails und RSVP**

Ziel: Spieler/Eltern können zu Trainings zusagen oder absagen. Trainer sieht wer kommt, wer absagt, wer noch nicht geantwortet hat.

### Produktnotiz: Langfristige Terminlogik

Vereon unterscheidet langfristig mehrere Terminarten:

1. **Training** — einzelne Trainings; später: wiederkehrende Trainings
2. **Match / Spiel** — später mit Gegner, Heim/Auswärts, Treffpunkt, Anstoßzeit; wichtig: Kader-Nominierung (nicht alle Spieler, nur Nominierte müssen zusagen)
3. **Internes Event / Vereinsveranstaltung** — z. B. Weihnachtsfeier, Abschlussfeier, Elternabend, Teamabend, Vereinsfest
4. **Turnier** — eigener großer Produktbereich; später mit Spielplan, Kader, mehreren Spielen, Ergebnissen, Tagesorganisation

**Aktueller MVP-Scope bleibt:** nur einzelnes Training erstellen (Phase N.2) — keine wiederkehrenden Termine, keine Matches, keine Kader-Nominierung, keine Turniere, keine Vereinsevents.

### Scope

* Event-Detailseite `/teams/[teamId]/events/[eventId]`
* Trainingsliste und Team-Detailseite verlinken auf das Training
* Trainer sieht RSVP-Übersicht (Zusagen / Absagen / Noch nicht geantwortet)
* Self-Player kann für sich antworten
* Elternteil kann für verknüpfte Kinder antworten, sofern bestehende RLS/RPC das unterstützt
* Antworten: Zusagen, Absagen, Vielleicht
* Kurze Notiz optional, wenn ohne Scope-Creep möglich

### Wichtig

* `respond_to_event()` RPC und `event_attendance`-Tabelle existieren bereits
* Keine neue Migration, außer ein echter Blocker wird zuerst gemeldet
* Keine Event-Bearbeitung, kein Termin absagen im UI
* Kein db reset, kein db push

### Nächste Schritte

1. Phase N.4 zuerst planen, dann nach Bestätigung umsetzen

## Erlaubt

* Lokale Supabase-Instanz testen
* App-Dateien anpassen (nach Bestätigung)

## Verboten

* Keine Remote-Datenbank
* Kein `npx supabase db push`
* Kein `npx supabase db reset` ohne ausdrückliche Bestätigung in der Session
* Keine Packages installieren ohne Bestätigung
* Keine Secrets anzeigen

## Migrationsübersicht

| Migration                              | Inhalt                                                                                   | Status                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`                   | Kern-Tabellen, Rollen, RLS, Funktionen                                                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`                 | Self-Service Team Flow                                                                   | Abgeschlossen und lokal verifiziert |
| `fix_authenticated_table_grants`       | SELECT-Grants für authenticated auf alle Tabellen                                        | Abgeschlossen und lokal verifiziert |
| `20260627100000_add_team_public_code`  | public_code, generate_team_code(), create_independent_team() erweitert, Backfill         | Abgeschlossen und lokal verifiziert |
| `20260627200000_add_join_request_type` | request_type, requester_user_id, guardian_user_id nullable, RLS, 3 neue Funktionen, Fix  | Abgeschlossen und lokal verifiziert |
| `20260628000000_add_profile_registration_fields` | first_name, last_name, date_of_birth, onboarding_role, terms_accepted_at, privacy_accepted_at in profiles; handle_new_user Trigger aktualisiert | Lokal anwenden: `npx supabase migration up` |
| `20260629000000_add_join_flow_improvements`      | players.date_of_birth; DROP alter submit_join_request_self/guardian (6-param); neue Funktionen ohne Name-Spoofing | Abgeschlossen und lokal verifiziert |
| `20260629100000_fix_players_trainer_rls`         | SECURITY DEFINER-Funktionen `can_trainer_read_player`, `can_trainer_read_player_pending`; DROP + Recreate beider players-Trainer-Policies | Abgeschlossen und lokal verifiziert |
| `20260629200000_add_events`                      | Tabellen `events` und `event_attendance`, RLS, Auto-Attendance-Trigger, RPCs `create_event`, `respond_to_event`, `cancel_event`, Attendance-Backfill in `approve_join_request` | Abgeschlossen und lokal verifiziert |
| `003_mvp0b_club_flows`                 | Vereinsflows, Vereins-Einladungen                                                        | Offen                               |
| `004_mvp1_players_full`                | vollständiges Spieler-/Elternmodell, Events, Anwesenheit                                 | Offen                               |
| `005_mvp2_affiliation`                 | Team-Zuordnung zu verifiziertem Verein                                                   | Offen                               |
