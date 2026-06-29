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

## Aktuelle Hauptaufgabe

**Phase H — Angenommene Spieler im Team anzeigen**

Ziel: Nachdem ein Trainer eine Beitrittsanfrage angenommen hat, soll der Spieler auf der Team-Detailseite sichtbar sein.

Umfang:
* Team-Detailseite um Spielerbereich erweitern
* Angenommene/aktive Spieler serverseitig laden
* Self-Player und Kind-Spieler müssen korrekt angezeigt werden
* Keine Spielerbearbeitung
* Keine Position/Trikotnummer-Verwaltung
* Keine Spielerprofilseite
* Keine Events, keine Anwesenheit
* Keine neue Migration, außer ein echter RLS-/Leseblocker wird gefunden und vorher gemeldet

### Nächster Schritt

Phase H kurz planen, dann nach Bestätigung umsetzen.

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
| `20260629000000_add_join_flow_improvements`      | players.date_of_birth; DROP alter submit_join_request_self/guardian (6-param); neue Funktionen ohne Name-Spoofing | Lokal anwenden: `npx supabase migration up` |
| `003_mvp0b_club_flows`                 | Vereinsflows, Vereins-Einladungen                                                        | Offen                               |
| `004_mvp1_players_full`                | vollständiges Spieler-/Elternmodell, Events, Anwesenheit                                 | Offen                               |
| `005_mvp2_affiliation`                 | Team-Zuordnung zu verifiziertem Verein                                                   | Offen                               |
