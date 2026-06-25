# Current Task — Vereon

## Aktueller Stand

Vereon hat die Datenbankfundament-Phase abgeschlossen.

Abgeschlossen:

* Next.js 16 Projekt steht
* Supabase Client Foundation ist eingebaut
* Docker Desktop läuft
* Lokale Supabase-Instanz läuft
* `.env.local` ist lokal befüllt und wird nicht committed
* Migration 001 `20260625190923_init_mvp0_core.sql` ist befüllt
* `npx supabase db reset` wurde lokal erfolgreich ausgeführt
* TypeScript-Datenbanktypen wurden generiert
* Lint und Build waren erfolgreich
* `create_independent_team()` wurde lokal mit Auth-User getestet
* `create_club()` wurde lokal mit Auth-User getestet
* Migration 001 gilt als lokal verifiziert

## Aktuelle Hauptaufgabe

Migration 002 planen: MVP 0A Self-Service Team Flow.

Ziel von Migration 002 ist der erste echte Nutzungsflow für eigenständige Teams:

Trainer erstellt Team
→ Trainer erzeugt Einladungslink
→ Eltern registrieren sich
→ Eltern legen Kind an
→ Beitrittsanfrage entsteht
→ Trainer nimmt Kind an oder lehnt ab

## Scope-Fragen für Migration 002

Vor dem SQL-Schreiben klären:

* `players`: wahrscheinlich ja, minimal nötig für Kinderprofile
* `team_invitation_links`: ja, Kernfeature MVP 0A
* `team_join_requests`: ja, Kernfeature MVP 0A
* `player_guardians`: kritisch prüfen, eventuell direkt nötig
* `player_team_assignments`: kritisch prüfen, eventuell direkt nötig
* `events`: eher spätere eigene Migration
* `event_attendance`: erst nach stabilem `player_id`-Modell
* 90-Tage-Löschlogik für abgelehnte/abgelaufene Anfragen: dokumentieren, technische Umsetzung prüfen

## Voraussichtlicher Inhalt Migration 002

Wahrscheinlich enthalten:

* `players`
* `team_invitation_links`
* `team_join_requests`
* RLS-Policies für neue Tabellen
* Indexes für Token-Lookups und Status-Queries
* DSGVO-Regeln für Join Requests

Noch offen:

* `player_guardians`
* `player_team_assignments`
* `events`
* `event_attendance`

## Erlaubt

* Dokumentation prüfen
* Migration 001 lesen
* Migrationsplan 002 erstellen
* bestehende Architektur kritisch prüfen
* lokale Supabase-Struktur analysieren
* Lint und Build ausführen

## Verboten

* Keine SQL-Migration befüllen ohne ausdrückliche Freigabe
* Kein `npx supabase db reset` ohne ausdrückliche Freigabe
* Kein `npx supabase db push`
* Kein Remote-Linking
* Keine Remote-Datenbank verändern
* Keine Secrets anzeigen
* `.env.local` nicht anzeigen
* Keine Anwendungscode-Features bauen
* Kein Login-UI bauen
* Keine Designänderungen
* Keine Packages installieren

## Relevante Dokumente

Claude Code soll zuerst lesen:

* `CLAUDE.md`
* `docs/PROJECT_BRIEF.md`
* `docs/CURRENT_TASK.md`

Für Migration 002 zusätzlich:

* `docs/DATABASE_MODEL.md`
* `docs/ROLES_AND_PERMISSIONS.md`
* `docs/MVP_SCOPE.md`
* `docs/SECURITY.md`
* `docs/DSGVO_PRIVACY_MODEL.md`
* `docs/USER_FLOWS.md`

## Migrationsübersicht

| Migration               | Inhalt                                                   | Status                              |
| ----------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`    | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`  | Self-Service Team Flow                                   | Als nächstes planen                 |
| `003_mvp0b_club_flows`  | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`  | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Finalen Plan für Migration 002 erstellen.

Noch kein SQL schreiben.
Noch keine Migration befüllen.
Erst Scope klären.
