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

## Aktuelle Hauptaufgabe

Phase D planen und umsetzen: Team-Detailseite `/teams/[teamId]`.

Ziel: Ein eingeloggter User kann ein Team aus der Teamübersicht öffnen und eine einfache Team-Detailseite sehen.

## Scope Phase D

### Zu bauen

* `src/app/(app)/teams/[teamId]/page.tsx` — Server Component
  * Teamdaten serverseitig laden (`id`, `name`, `age_group`, `gender`, `ownership_type`, `status`, `created_at`)
  * RLS filtert automatisch — kein Team-Mitglied → 404 oder Redirect
  * Teamname, Altersgruppe, Geschlecht, Status, Typ anzeigen
  * Navigation zurück zu `/teams`
  * Vorbereitete (leere) Bereiche für: Spieler, Einladungslink, Beitrittsanfragen
  * `force-dynamic`

### Nicht in Phase D

* Kein Einladungslink-Flow
* Kein `/join/[token]`
* Kein `submit_join_request()` / `approve_join_request()`
* Kein Spieler-/Elternflow
* Kein echtes Spielerlistung
* Keine neue Migration
* Kein db reset / db push

## Erlaubt

* Phase D planen und App-Dateien umsetzen
* bestehende Supabase-Clients verwenden (`src/lib/supabase/server.ts`)
* Teams über bestehende Tabellen lesen
* Lint und Build ausführen

## Verboten

* Keine Migration ändern
* Kein `npx supabase db reset`
* Kein `npx supabase db push`
* Keine Remote-Datenbank
* Keine Secrets anzeigen
* `.env.local` nicht anzeigen
* Keine Packages installieren
* Phase-A-Design, Dark Mode und Mobile nicht beschädigen
* Kein Einladungslink-/Join-Request-Scope in Phase D

## Migrationsübersicht

| Migration                          | Inhalt                                                   | Status                              |
| ---------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`               | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`             | Self-Service Team Flow                                   | Abgeschlossen und lokal verifiziert |
| `fix_authenticated_table_grants`   | SELECT-Grants für authenticated auf alle Tabellen        | Abgeschlossen und lokal verifiziert |
| `003_mvp0b_club_flows`             | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full`            | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`             | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Phase D kurz planen, dann nach Bestätigung umsetzen.
