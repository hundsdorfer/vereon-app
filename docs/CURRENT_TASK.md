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
* Phase E.1A Automatischer Einladungscode — implementiert, lokal getestet, lint/build ok:
  * Migration `20260627100000_add_team_public_code` — lokal angewendet
  * `public_code` Spalte in `team_invitation_links` (Klartext, dauerhaft sichtbar)
  * `token_hash` und `expires_at` nullable (backward-compat), CHECK-Constraint `til_has_identifier`
  * `generate_team_code()` SECURITY DEFINER — Format `VRN-XXXX-XXXX-XXXX`, pgcrypto via `extensions.gen_random_bytes()`, 31-Zeichen-Zeichensatz (kein O/0/I/1/L), Keyspace 31¹² ≈ 1,8×10¹⁷
  * `create_independent_team()` CREATE OR REPLACE — erstellt Code atomar bei Team-Erstellung
  * `get_team_invite_code(p_team_id uuid)` — SQL-Funktion (kein SECURITY DEFINER), RLS greift
  * Backfill aktiver Teams ohne aktiven public_code in der Migration
  * `InviteCodeDisplay.tsx` — zeigt Code + Beitrittslink, je ein Copy-Button
  * `/teams/[teamId]/invite` umgebaut: kein Formular, liest public_code direkt aus DB
  * CTA-Text auf Team-Detailseite: „Spieler & Eltern einladen"
  * `database.types.ts` aktualisiert: `public_code`, `token_hash`/`expires_at` nullable, neue RPCs
* Phase F.1 Join Request Datenmodell — implementiert, lokal getestet, lint/build ok:
  * Migration `20260627200000_add_join_request_type` — lokal angewendet
  * `team_join_requests.request_type` TEXT NOT NULL CHECK IN ('self_player', 'guardian_child'), DEFAULT 'guardian_child'
  * `team_join_requests.requester_user_id` UUID NOT NULL REFERENCES auth.users — universelles „Wer hat eingereicht"-Feld für RLS
  * `team_join_requests.guardian_user_id` nullable (war NOT NULL) — für self_player leer
  * Konsistenz-Constraint `tjr_request_type_consistent`: `(request_type = 'guardian_child') = (guardian_user_id IS NOT NULL)`
  * Backfill: `requester_user_id = guardian_user_id` für bestehende Zeilen
  * RLS: `tjr_select_guardian` → `tjr_select_requester` (requester_user_id = auth.uid())
  * RLS: `players_select_own` neu (user_id = auth.uid(), für self_player nach Genehmigung)
  * `get_public_invitation_info_by_code(p_code text)` SECURITY DEFINER STABLE — gibt jsonb `{valid, reason?, team_name?, age_group?, gender?}` zurück, keine internen IDs
  * `submit_join_request_self(p_code, p_first_name, p_last_name, ...)` SECURITY DEFINER — players.user_id = auth.uid(), kein player_guardians-Eintrag, prüft Duplikat-pending + aktive Mitgliedschaft, FOR UPDATE Lock
  * `submit_join_request_guardian(p_code, p_first_name, p_last_name, ...)` SECURITY DEFINER — players.user_id = NULL, legt player_guardians mit verified_at = now() an (DSGVO-Nachweis), FOR UPDATE Lock
  * `withdraw_join_request()` CREATE OR REPLACE — Sicherheitsfix: Prüfung auf `requester_user_id` statt `guardian_user_id`
  * `database.types.ts` aktualisiert: alle neuen Spalten + 5 neue RPC-Typen

## Aktuelle Hauptaufgabe

Phase F.2 — Öffentliche `/join/[code]` Seite

### Was zu bauen ist

* `/join/[code]` — öffentliche Route (bereits in `PUBLIC_PREFIXES` in `proxy.ts`)
* Nicht eingeloggter User → Redirect zu `/login?redirect=/join/[code]` (oder `/register?redirect=...`)
* Eingeloggter User sieht Team-Info via `get_public_invitation_info_by_code()` + Auswahl:
  * „Ich trete selbst bei" → `JoinSelfForm`
  * „Ich melde mein Kind an" → `JoinGuardianForm`
* `JoinFlowSelector.tsx` — Client Component, steuert welches Formular sichtbar ist
* `JoinSelfForm.tsx` — Formular mit `useActionState`, ruft `submitJoinRequestSelfAction` auf
* `JoinGuardianForm.tsx` — Formular mit `useActionState`, ruft `submitJoinRequestGuardianAction` auf
* `src/actions/join.ts` — `submitJoinRequestSelfAction` und `submitJoinRequestGuardianAction` via RPC

### Nicht bauen

* Kein Trainer-Approval-UI (Beitrittsanfragen-Dashboard)
* Kein QR-Code
* Keine neue Migration
* Kein db reset / db push / Remote-DB-Zugriff
* Keine neuen Packages

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
| `003_mvp0b_club_flows`                 | Vereinsflows, Vereins-Einladungen                                                        | Offen                               |
| `004_mvp1_players_full`                | vollständiges Spieler-/Elternmodell, Events, Anwesenheit                                 | Offen                               |
| `005_mvp2_affiliation`                 | Team-Zuordnung zu verifiziertem Verein                                                   | Offen                               |
