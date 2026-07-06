# Current Task — Vereon

> **Dokumentationshinweis — Stand 2026-07-06:**
> Diese Datei enthält laut `docs/DOCS_INVENTORY.md` veraltete oder zu prüfende Aussagen. Für den tatsächlichen Code-Zustand haben aktuell `docs/ARCHITECTURE.md` und `docs/STATUS.md` Vorrang. Diese Datei darf bis zur Überarbeitung nicht allein als Umsetzungsgrundlage verwendet werden.
> Besonders kritisch: Das uncommitted „Remove player from team"-Feature ist laut `docs/STATUS.md` noch nicht vollständig im Phasenstand erfasst.

---

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
* Phase UI.3 — Dashboard-Erweiterung — committed
* Phase P.1 — Manueller MVP-Kernflow-Test — abgeschlossen (lokal)
* Phase P.2A — 9 MVP-Testbefunde behoben (ohne Migration) — lokal umgesetzt:
  * Redirect nach Team-Erstellung zu `/teams/[teamId]`
  * Redirect nach Training-Erstellung zu `/teams/[teamId]/events/[eventId]`
  * Telefonnummer optional bei Registrierung
  * iOS Auto-Zoom-Fix: `h-11`, `text-base md:text-sm` in Input-Komponente
  * RootLayout Script-Warnung behoben (`next/script beforeInteractive`)
  * Join-Erfolgsscreen: „Zurück zum Dashboard"-Link
  * Dashboard Spieler/Guardian: wartende Beitrittsanfragen mit Typ und Teamname
  * Dashboard Trainer: Beitrittsanfragen mit Teamname und Direktlink je Team
  * Training erstellen: Datum und Uhrzeit als getrennte Felder
* Phase P.1-Retest nach P.2A-Fixes — abgeschlossen (2026-07-01)
* Phase M.1 — Playwright Setup (`playwright.config.ts`, Smoke-Tests) — 3/3 grün
* Phase M.2 — Self-Player E2E-Kernflow (`tests/e2e/core-flow-self-player.spec.ts`) — lokal grün
* Phase M.3 — Guardian/Kind E2E-Kernflow (`tests/e2e/core-flow-guardian.spec.ts`) — lokal grün
* Lokal gesamt: 5/5 Tests grün (`npm run test:e2e`)
* Phase M.4 — GitHub Actions E2E-Workflow (`.github/workflows/e2e.yml`) — manuell via `workflow_dispatch`, grün
* Phase M abgeschlossen — 5/5 E2E-Tests bestanden (lokal + CI)
* Phase PWA.1 — Basis-PWA-Metadaten / Installierbarkeit vorbereitet — committed (61923e5):
  * `src/app/manifest.ts` vorhanden
  * `/manifest.webmanifest` wird im Next.js-Build erzeugt
  * `public/icon-192.png` vorhanden
  * `public/icon-512.png` vorhanden
  * `public/apple-touch-icon.png` vorhanden
  * `metadata.icons` ergänzt
  * `metadata.appleWebApp` ergänzt
  * `viewport.themeColor` gesetzt
  * `npm run lint` erfolgreich
  * `npm run build` erfolgreich
  * kein Service Worker
  * kein Offline-Modus
  * keine Push Notifications
  * kein praktischer Smartphone-Install-Test durchgeführt, kein Lighthouse-PWA-Audit durchgeführt
* `/legal/imprint` als Platzhalter erstellt und aus `RegisterForm` verlinkt (dezente Info-Zeile, keine Zustimmungspflicht):
  * Legal-Seiten (`/legal/privacy`, `/legal/terms`, `/legal/imprint`) weiterhin nicht final
  * Betreiberangaben fehlen weiterhin
  * Datenschutzfinalisierung bleibt offen
  * Datenmodell-Abgleich `date_of_birth` vs. `birth_year` für Player/Kinder technisch bereinigt; übrige Datenschutzfinalisierung bleibt offen
* Player/Kinder-Join-Flow auf `birth_year` umgestellt — committed und gepusht (`69a913e`):
  * Migration `20260702000000_players_birth_year_only` — lokal und remote (Supabase Cloud) angewendet
  * `submit_join_request_guardian` neue Signatur (`p_code, p_first_name, p_last_name, p_child_birth_year integer`), alte Signatur mit `date`-Parameter gedroppt
  * `submit_join_request_self` befüllt `players.date_of_birth` nicht mehr, leitet `birth_year` weiterhin aus `profiles.date_of_birth` ab
  * `players.date_of_birth`-Spalte bleibt nullable bestehen (nicht gedroppt), wird aber im Join-Flow nicht mehr befüllt
  * `profiles.date_of_birth` unverändert — separates Feld für das Profil des registrierten Nutzers
  * `JoinGuardianForm.tsx`, `src/actions/join.ts` auf Geburtsjahr-Eingabe umgestellt
  * `npm run lint`, `npm run build`, `npx supabase db reset`, Guardian- und Self-Player-E2E-Test erfolgreich
* Dokumentations-Inventar erstellt und committed:
  * `docs/ARCHITECTURE.md`
  * `docs/STATUS.md`
  * `docs/DOCS_INVENTORY.md`
  * Warnhinweise in 8 riskanten/veralteten docs-Dateien
  * Commit: `51a97ee`
* `docs/PROJECT_BRIEF.md` korrigiert und committed:
  * neue Vorrangregel ergänzt
  * idealisierte Migrationsliste klargestellt
  * alten veralteten Abschnitt „Migration 001 noch leer" ersetzt
  * Commit: `a8eaf85`

## Aktueller Git-Zustand

**Stand:** 2026-07-06, nach lokalem Commit a8eaf85

* Lokaler Branch ist 2 Commits vor `origin/main`
* Kein Push erfolgt
* Weiterhin uncommitted:
  * `.gitignore` — modifiziert
  * `src/app/(app)/teams/[teamId]/page.tsx` — modifiziert
  * `src/actions/players.ts` — untracked
  * `src/components/ui/ConfirmButton.tsx` — untracked
  * `src/features/players/` — untracked
  * `supabase/migrations/20260704120000_remove_player_from_team.sql` — untracked

## Aktuelle Hauptaufgabe

**Priorität 1 — Remove-Player-Feature klären:**

* Laut `docs/STATUS.md` vollständig implementiert, aber uncommitted im Arbeitsverzeichnis:
  * `removePlayerFromTeamAction`
  * `ConfirmButton`
  * `RemovePlayerButton`
  * Migration `20260704120000_remove_player_from_team.sql`
  * Anpassung der Team-Detailseite (`src/app/(app)/teams/[teamId]/page.tsx`)
* Die Migration schließt laut `docs/STATUS.md` zusätzlich eine RSVP-Autorisierungslücke (entfernte Spieler/Guardians konnten sonst weiter per RSVP antworten)
* Entscheidung erforderlich: vollständig committen, bewusst verwerfen, oder vor Commit korrigieren
* **Keine neue Feature-Entwicklung, bevor dieser Zustand geklärt ist**

**Danach — weiterhin offen:**

* P.2B — Einladungscode-Format vereinfachen
* Legal-Seiten finalisieren (`/legal/privacy`, `/legal/terms`, `/legal/imprint`) — vor Pilotbetrieb erforderlich, Betreiberangaben fehlen weiterhin
* `cleanup_expired_join_requests()` als Scheduled Job automatisieren
* Consent-/Einwilligungsnachweis für Minderjährige verbessern (`verified_at` ist nur technischer Verknüpfungszeitpunkt)
* Match-MVP planen

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
| `20260702000000_players_birth_year_only` | submit_join_request_guardian auf birth_year umgestellt, submit_join_request_self befüllt players.date_of_birth nicht mehr | Lokal + Supabase Cloud angewendet |
| `20260704120000_remove_player_from_team` | remove_player_from_team()-RPC, RSVP-Autorisierungsfix | Uncommitted im Arbeitsverzeichnis / nicht als angewendet behandeln / zu prüfen |
| `003_mvp0b_club_flows` | Vereinsflows | Offen |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell | Offen |
| `005_mvp2_affiliation` | Team-Zuordnung zu verifiziertem Verein | Offen |
