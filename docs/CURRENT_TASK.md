# CURRENT_TASK.md – Aktueller Arbeitsstand

## Aktuelle Phase

Vereon befindet sich in der Architektur- und Datenmodellierungsphase vor der ersten echten Datenbankmigration.

Die lokale Entwicklungsumgebung steht:

* Next.js 16 Projekt vorhanden
* Supabase Client Foundation vorhanden
* Docker Desktop läuft
* Lokale Supabase-Instanz läuft
* `.env.local` ist lokal befüllt und wird nicht committed
* Migration-Datei `20260625190923_init_mvp0_core.sql` existiert, ist aber leer

## Aktuelle Hauptaufgabe

Migration 001 final vorbereiten, aber noch nicht blind ausführen.

Vor dem Befüllen der Migration müssen die letzten Produktentscheidungen vollständig berücksichtigt sein:

* Vereon startet nicht nur vereinszentriert, sondern auch teamzentriert.
* Trainer können eigenständige Teams ohne offiziellen Verein erstellen.
* Teams können später einem geprüften Verein zugeordnet werden.
* Vereine brauchen einen Verifikationsstatus.
* `team_owner` ist getrennt von `head_coach`.
* Eltern/Kinder nutzen bevorzugt Self-Service über Einladungslink und Beitrittsanfrage.
* Kinder werden nicht automatisch Teammitglieder.
* Mehrfachrollen und Mehrfachteamzugehörigkeiten sind Pflicht.
* DSGVO/Datenschutz ist Kernanforderung.
* Monetarisierung wird dokumentiert, aber nicht in MVP 0 gebaut.

## Erlaubt

* Dokumentation aktualisieren
* Migrationsplan erstellen
* bestehende Architektur kritisch prüfen
* kleine, gezielte Änderungen an Dokumenten
* Lint und Build ausführen

## Verboten

* Keine SQL-Migration befüllen ohne ausdrückliche Freigabe
* Kein `npx supabase db reset` ohne ausdrückliche Freigabe
* Kein `npx supabase db push`
* Kein Remote-Linking
* Keine Remote-Datenbank verändern
* Keine Secrets anzeigen
* `.env.local` nicht ausgeben
* Keine Anwendungscode-Features bauen
* Kein Login-UI bauen
* Keine Designänderungen
* Keine Packages installieren, außer ausdrücklich beauftragt

## Nächster geplanter Schritt

1. Dokumentation für unabhängige Teams, Self-Service-Onboarding, DSGVO und Monetarisierung finalisieren.
2. Danach finalen Plan für Migration 001 erstellen.
3. Erst nach Freigabe Migration 001 befüllen.
4. Danach lokale Migration testen.
5. Danach TypeScript-Datenbanktypen generieren.

## Relevante Dokumente

Claude Code soll bei Aufgaben zuerst diese Dateien lesen:

* `CLAUDE.md`
* `docs/PROJECT_BRIEF.md`
* `docs/CURRENT_TASK.md`

Je nach Aufgabe zusätzlich:

* `docs/DATABASE_MODEL.md`
* `docs/ROLES_AND_PERMISSIONS.md`
* `docs/MVP_SCOPE.md`
* `docs/SECURITY.md`
* `docs/SUPABASE_STRATEGY.md`
* `docs/DSGVO_PRIVACY_MODEL.md`
* `docs/MONETIZATION_STRATEGY.md`
* `docs/USER_FLOWS.md`

## Ziel der nächsten Migration

Migration 001 soll nur den stabilen MVP-0-Core enthalten.

Voraussichtlich enthalten:

* Rollen
* Berechtigungen
* Profile
* Clubs mit Verifikationsstatus
* Seasons
* Club-Mitgliedschaften
* Club-Rollen
* Teams mit optionalem `club_id`
* Team-Mitgliedschaften
* Team-Rollen
* `team_owner`
* `create_club()`
* wahrscheinlich `create_independent_team()`
* RLS-Grundfunktionen
* erste RLS-Policies
* Indexes
* Seed-Rollen

Noch nicht enthalten oder kritisch zu entscheiden:

* `team_invitation_links`
* `team_join_requests`
* `players`
* `player_guardians`
* `player_team_assignments`
* `events`
* `event_attendance`
* `matches`
* `match_reports`
* `billing`
* `official_club_registry`
* `team_affiliation_requests`
* `player_transfer_requests`
