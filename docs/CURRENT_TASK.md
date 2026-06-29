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
  * Migration `20260628000000_add_profile_registration_fields` — lokal angewendet
* Phase G.1 — Trainer sieht Beitrittsanfragen — abgeschlossen:
  * `/teams/[teamId]/requests` Seite mit Approve/Reject-Aktionen
  * Team-Detailseite zeigt Badge mit Anzahl offener Anfragen und CTA
  * `approve_join_request` und `reject_join_request` Server Actions
* Phase H.1 Profilbasierter Join-Flow — abgeschlossen, lokal verifiziert:
  * Self-Player: Profildaten (Name, Geburtsdatum) read-only anzeigen, kein Name-Spoofing
  * Guardian: Pflicht-Datumsfeld `date_of_birth` statt optionalem `birth_year`
  * Migration `20260629000000_add_join_flow_improvements` — lokal angewendet
* Phase H — Angenommene Spieler im Team anzeigen — abgeschlossen, lint/build ok:
  * `player_team_assignments` mit `players`-Join serverseitig geladen (status = 'active')
  * Spieler-Karte auf Team-Detailseite zeigt Name, Geburtsdatum, Beitrittsart
  * Empty State, Fehlerbehandlung
* Phase I — MVP-Kernflow Review & Stabilisierung — abgeschlossen, lint/build ok
* Phase J — Spielerbereich MVP verbessern — abgeschlossen, lint/build ok
* Phase L — MVP-Qualitätscheck und erste Automatisierung — abgeschlossen, lint/build ok:
  * `docs/MVP_TEST_CHECKLIST.md` erstellt
  * `.github/workflows/ci.yml` erstellt
* Phase M — MVP-Testcheckliste manuell durchtesten — abgeschlossen, lokal verifiziert
* Phase K — QR-Code für Einladungslink — abgeschlossen, committed und gepushed
* Phase H RLS-Hotfix — `20260629100000_fix_players_trainer_rls` — abgeschlossen
* Phase N.1 — Events-Datenmodell, RLS, RPC und Trigger — abgeschlossen, committed und gepushed:
  * Migration `20260629200000_add_events.sql`
  * Tabellen `events` und `event_attendance`, RLS, Auto-Attendance-Trigger
  * RPCs `create_event()`, `respond_to_event()`, `cancel_event()`
  * Attendance-Backfill in `approve_join_request()`
  * TypeScript-Typen neu generiert
* Phase N.2 — Training erstellen UI — abgeschlossen, lint/build ok
* Phase N.3 — Trainings anzeigen — abgeschlossen, lint/build ok
* Phase N.4 — Trainingsdetailseite und RSVP — abgeschlossen, lint/build ok, committed und gepushed:
  * Event-Detailseite `/teams/[teamId]/events/[eventId]` erstellt
  * Trainings aus Team-Detailseite und Trainingsliste verlinkt
  * `RsvpForm` Client Component erstellt
  * Self-Player können zu Trainings zusagen, absagen oder vielleicht wählen
  * Guardians können für verknüpfte Kinder antworten
  * Trainer sehen RSVP-Übersicht nach Gruppen (Kommt / Kommt nicht / Vielleicht / Noch keine Antwort)
  * RLS-Hotfix `20260629300000_fix_player_event_rls`: `is_player_in_team()`, `is_guardian_in_team()`, Policies für `teams` und `events`
  * RLS-Hotfix `20260629400000_add_pta_player_policy`: `pta_select_player` — Self-Player kann eigene aktive Teamzuordnung lesen

## Aktuelle Hauptaufgabe

**Player-/Guardian-Dashboard UX prüfen**

Ziel: Analysieren, was Spieler und Eltern nach dem Login sehen und ob `/dashboard`, `/teams` und relevante Terminseiten für Nicht-Trainer sinnvoll funktionieren.

**Nächster Schritt: Zuerst analysieren, nicht bauen.**

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

| Migration | Inhalt | Status |
| --- | --- | --- |
| `001_init_mvp0_core` | Kern-Tabellen, Rollen, RLS, Funktionen | Lokal angewendet |
| `002_mvp0a_team_flows` | Self-Service Team Flow | Lokal angewendet |
| `fix_authenticated_table_grants` | SELECT-Grants für authenticated | Lokal angewendet |
| `20260627100000_add_team_public_code` | public_code, generate_team_code(), create_independent_team() | Lokal angewendet |
| `20260627200000_add_join_request_type` | request_type, requester_user_id, RLS, 3 neue Funktionen | Lokal angewendet |
| `20260628000000_add_profile_registration_fields` | Profilfelder, handle_new_user Trigger | Lokal angewendet |
| `20260629000000_add_join_flow_improvements` | players.date_of_birth, neue Join-RPCs ohne Name-Spoofing | Lokal angewendet |
| `20260629100000_fix_players_trainer_rls` | SECURITY DEFINER-Funktionen für Trainer-Player-Sichtbarkeit | Lokal angewendet |
| `20260629200000_add_events` | events, event_attendance, RLS, RPCs, Trigger | Lokal angewendet |
| `20260629300000_fix_player_event_rls` | is_player_in_team(), is_guardian_in_team(), Policies für teams + events | Lokal angewendet |
| `20260629400000_add_pta_player_policy` | pta_select_player — Self-Player liest eigene aktive Assignment | Lokal angewendet |
| `003_mvp0b_club_flows` | Vereinsflows | Offen |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell | Offen |
| `005_mvp2_affiliation` | Team-Zuordnung zu verifiziertem Verein | Offen |
