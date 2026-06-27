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

## Aktuelle Hauptaufgabe

Phase E planen und umsetzen: Einladungslink für ein Team erstellen.

Ziel: Ein Team-Owner/Trainer kann aus der Team-Detailseite heraus einen Einladungslink erzeugen und diesen an Eltern weitergeben.

## Scope Phase E

### Zu bauen

* `src/app/(app)/teams/[teamId]/invite/page.tsx` — Server Component, Formularseite
* `src/features/teams/CreateInviteLinkForm.tsx` — Client Component mit `useActionState`
* `src/actions/team.ts` erweitern — Server Action `createInviteLinkAction`
  * Ruft bestehende RPC `create_invitation_link()` auf
  * Parameter: `p_team_id`, `p_max_uses` (optional), `p_expires_in_days` (optional)
  * Gibt nach Erfolg den fertigen Link zurück (kein Redirect)
* Team-Detailseite `/teams/[teamId]` — CTA im Einladungslink-Platzhalterbereich ergänzen
* Nach Erstellung: Link anzeigen, kopierbar machen (kein erneuter DB-Aufruf möglich — token wird nur einmal angezeigt)
* Bestehende Links optional als Metadaten anzeigen (Anzahl, Ablaufdatum), raw token nicht rekonstruierbar

### Produktprinzipien für Phase E

* UI darf nicht datenbankmäßig wirken — einfache deutsche Begriffe
* Nutzerführung vor Rohdaten
* Mobile-first
* Formularbegriffe: „Maximale Einladungen" (statt `max_uses`), „Gültig für X Tage" (statt `expires_in_days`)

### Nicht in Phase E

* Kein `/join/[token]` Flow
* Kein Elternformular
* Kein `submit_join_request()` in der UI
* Kein `approve_join_request()` in der UI
* Kein Spieler-/Elternflow
* Keine neue Migration
* Kein db reset / db push

## Erlaubt

* Phase E planen und App-Dateien umsetzen
* bestehende Supabase-Clients verwenden (`src/lib/supabase/server.ts`)
* RPC `create_invitation_link()` aufrufen
* bestehende Tabellen lesen (`team_invitation_links`)
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
* Kein Join-Request-Scope in Phase E

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

Phase E kurz planen, dann nach Bestätigung umsetzen.
