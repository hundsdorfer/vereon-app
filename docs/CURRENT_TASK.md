# Current Task — Vereon

## Aktueller Stand

Abgeschlossen:

* Migration 001 `init_mvp0_core` — lokal verifiziert
* Migration 002 `mvp0a_team_flows` — lokal verifiziert
* Hotfix-Migration `fix_authenticated_table_grants` — lokal verifiziert
* Phase A UI-Fundament — committed
* Phase B.1 Routing/Auth — committed
* Phase B.2 AppShell UX Cleanup — committed
* Phase B.3 Vollständiges Registrierungsprofil — committed
* Phase C Team-Erstellung und Teamübersicht — committed
* Phase D Team-Detailseite — committed
* Phase E Einladungslink erstellen — committed
* Phase E.1A Automatischer Einladungscode — committed
* Phase F.1 Join Request Datenmodell — committed
* Phase F.2 Öffentliche `/join/[code]` Seite — committed
* Phase G.1 Trainer sieht Beitrittsanfragen — committed
* Phase H.1 Profilbasierter Join-Flow — committed
* Phase H Angenommene Spieler im Team anzeigen — committed
* Phase I MVP-Kernflow Review & Stabilisierung — committed
* Phase J Spielerbereich MVP verbessern — committed
* Phase K QR-Code für Einladungslink — committed und gepushed
* Phase L MVP-Qualitätscheck und erste Automatisierung — committed
* Phase M MVP-Testcheckliste manuell durchtesten — lokal verifiziert
* RLS-Hotfix `20260629100000_fix_players_trainer_rls` — committed
* Phase N.1 Events-Datenmodell, RLS, RPC und Trigger — committed und gepushed
* Phase N.2 Training erstellen UI — committed
* Phase N.3 Trainings anzeigen — committed
* Phase N.4 Trainingsdetailseite und RSVP — committed und gepushed:
  * Event-Detailseite `/teams/[teamId]/events/[eventId]`
  * `RsvpForm` Client Component
  * Self-Player und Guardian können RSVP abgeben
  * Trainer sieht RSVP-Übersicht nach Gruppen
  * RLS-Hotfix `20260629300000_fix_player_event_rls`
  * RLS-Hotfix `20260629400000_add_pta_player_policy`
* Phase O `/teams` UX für Spieler/Eltern — committed und gepushed
* Dashboard minimale Rollenanpassung — committed und gepushed
* `/dev/ui-preview` in Production geschützt — committed
* Dokumentation aktualisiert:
  * `docs/DECISION_LOG.md` — langfristige Rollen-/Ansichtslogik
  * `docs/LEGAL_TODO.md` — DSGVO-Checkliste vor Pilotbetrieb
  * `docs/PROJECT_STATUS.md` — aktueller Gesamtstand

## Aktuelle Hauptaufgabe

**Phase UI.3 — Dashboard-Erweiterung** — abgeschlossen.

Umgesetzt:
* `src/components/ui/RsvpStatusBadge.tsx` — neue Komponente (attending/declined/maybe/null)
* `src/app/(app)/dashboard/page.tsx` — vollständig erweitert:
  * Nächste 5 Trainings mit Datum/Uhrzeit
  * Trainer: RSVP-Zusammenfassung (zugesagt/offen), kontextabhängiger CTA (0/1/N Teams)
  * Non-Trainer: RSVP-Status je Attendance-Row, Spieler-/Kindname wenn sichtbar
  * Beitrittsanfragen-Card (nur für Trainer, nur wenn offen)
  * Teams-Card mit rollenabhängigem CTA

**Nächster Schritt: offen — auf neue Aufgabe warten.**

## Nicht in der nächsten Phase

* Kein komplettes Redesign ohne vorherige Planung
* Kein Rollen-/Ansichtswechsler (langfristig, siehe `docs/DECISION_LOG.md`)
* Keine neuen Features ohne Bestätigung
* Kein `/my/*`-Bereich
* Keine Match- oder Spielberichtlogik
* Keine wiederkehrenden Trainings
* Keine Turniere

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
