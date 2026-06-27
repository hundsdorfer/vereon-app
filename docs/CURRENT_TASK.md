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
* Phase E.1 Automatischer Einladungscode — implementiert, lokal zu testen:
  * Migration `20260627100000_add_team_public_code` (lokal noch nicht angewendet)
  * `public_code` Spalte in `team_invitation_links` (Klartext, dauerhaft sichtbar)
  * `token_hash` und `expires_at` nullable (backward-compat)
  * `generate_team_code()` — VRN-XXXX-XXXX-XXXX Format, pgcrypto, 31^12 Keyspace
  * `create_independent_team()` — erweitert, erstellt Code atomar bei Team-Erstellung
  * `get_team_invite_code()` — SQL-Funktion für spätere /join/[code]-Seite
  * Backfill bestehender Teams in der Migration
  * `InviteCodeDisplay.tsx` — zeigt Code + Link, Copy-Buttons
  * `/teams/[teamId]/invite` umgebaut zur Code-Anzeige-Seite (kein Formular)
  * CTA-Text auf Team-Detailseite: „Eltern einladen"

## Aktuelle Hauptaufgabe

Phase E.1 lokal testen: Migration anwenden, neue Team erstellen, Einladungscode prüfen.

## Nächste Schritte

1. `npx supabase db reset` lokal (alle Migrations neu), oder nur `npx supabase migration up` für die neue Migration
2. Neues Team erstellen → `/teams/[teamId]/invite` prüfen → Code sehen
3. Bestehende Teams prüfen → Backfill hat Code vergeben
4. Phase E.1B (optional): QR-Code — erst nach Bestätigung Package installieren

## Erlaubt

* Lokale Supabase-Instanz testen (`npx supabase db reset` oder `migration up`)
* App-Dateien anpassen

## Verboten

* Keine Remote-Datenbank
* Kein `npx supabase db push`
* Kein `npx supabase db reset` ohne ausdrückliche Bestätigung in der Session
* Keine Packages installieren ohne Bestätigung
* Keine Secrets anzeigen

## Migrationsübersicht

| Migration                          | Inhalt                                                   | Status                              |
| ---------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`               | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`             | Self-Service Team Flow                                   | Abgeschlossen und lokal verifiziert |
| `fix_authenticated_table_grants`   | SELECT-Grants für authenticated auf alle Tabellen        | Abgeschlossen und lokal verifiziert |
| `add_team_public_code`             | public_code, generate_team_code(), create_independent_team() erweitert, Backfill | Implementiert, lokal zu testen |
| `003_mvp0b_club_flows`             | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full`            | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`             | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Phase E kurz planen, dann nach Bestätigung umsetzen.
