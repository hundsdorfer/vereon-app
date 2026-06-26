# Current Task — Vereon

## Aktueller Stand

Abgeschlossen:

* Migration 001 `init_mvp0_core` — lokal verifiziert
* Migration 002 `mvp0a_team_flows` — lokal verifiziert
* Phase A UI-Fundament — committed:
  * responsive AppShell, Light/Dark Theme, Mobile, Safe Area, Touch Targets, allowedDevOrigins, UI-Basiskomponenten
* Phase B.1 Routing/Auth — committed:
  * Login/Register, Auth Actions, Auth Callback, Route-Gruppen, /dashboard Platzhalter, Root Redirect, proxy.ts Route-Schutz
* Phase B.2 AppShell UX Cleanup — committed:
  * User-E-Mail in AppShell, Logout auf Desktop + Mobile, aktive Navigation, /teams Platzhalterseite, kein toter Nav-Link

## Aktuelle Hauptaufgabe

Phase C planen und umsetzen: Team erstellen + eigene Teams anzeigen.

Ziel: Ein eingeloggter User soll über die Browser-App ein eigenständiges Team erstellen und seine eigenen Teams sehen können.

## Scope Phase C

Zu bauen:

* Team-Erstellungsformular (verwendet `create_independent_team()` RPC)
* `/teams` von Platzhalter zu echter Teamübersicht erweitern
* eigene Teams über bestehende Tabellen laden und anzeigen
* nach Team-Erstellung zu `/teams` oder Teamseite redirecten
* `/dashboard` mit sinnvollem Einstieg zu Teams erweitern

Noch nicht bauen:

* Kein Einladungslink-Flow
* Kein `/join/[token]` Flow
* Kein `submit_join_request()` in der UI
* Kein `approve_join_request()` in der UI
* Keine neue Migration
* Keine Club-Flows
* Keine Events/Anwesenheit

## Erlaubt

* Phase C planen und umsetzen
* bestehende Supabase-Clients verwenden
* RPC `create_independent_team()` verwenden
* bestehende Tabellen lesen
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
* Kein Einladungslink-/Join-Request-Scope

## Relevante Dokumente

* `CLAUDE.md`, `docs/PROJECT_BRIEF.md`, `docs/CURRENT_TASK.md`
* `docs/SUPABASE_STRATEGY.md`, `docs/SECURITY.md`
* `docs/USER_FLOWS.md`, `docs/DATABASE_MODEL.md`

## Migrationsübersicht

| Migration               | Inhalt                                                   | Status                              |
| ----------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`    | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`  | Self-Service Team Flow                                   | Abgeschlossen und lokal verifiziert |
| `003_mvp0b_club_flows`  | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`  | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Phase C zuerst kurz planen, dann nach Bestätigung umsetzen.
