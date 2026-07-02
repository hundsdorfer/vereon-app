# Project Status — Vereon

**Stand:** 2026-07-02

---

## 1. Kurzstatus

MVP-Kernflow vollständig implementiert und lokal verifiziert. Trainer können Teams erstellen, Spieler und Kinder können beitreten, Trainings können erstellt und via RSVP beantwortet werden. Lint und Build sind sauber. CI läuft via GitHub Actions.

---

## 2. Aktuell umgesetzt

| Bereich | Status |
|---------|--------|
| Auth (Registrierung, Login, Callback, Logout) | ✓ |
| Vollständiges Registrierungsprofil (Name, Geburtsdatum, Telefon, Rolle, AGB) | ✓ |
| Team erstellen (`create_independent_team()`) | ✓ |
| Einladungscode, Einladungslink, QR-Code | ✓ |
| Join-Flow Self-Player (Profil read-only, kein Name-Spoofing) | ✓ |
| Join-Flow Guardian/Child (Vorname, Nachname, Geburtsdatum) | ✓ |
| Beitrittsanfragen: Trainer sieht, nimmt an, lehnt ab | ✓ |
| Orphan-Cleanup bei Ablehnung | ✓ |
| Angenommene Spieler erscheinen im Team | ✓ |
| Trainings erstellen (`create_event()`) | ✓ |
| Trainings anzeigen (Teamseite + Trainingsliste, Upcoming/Past) | ✓ |
| Trainingsdetailseite | ✓ |
| RSVP Self-Player (zusagen / vielleicht / absagen + Notiz) | ✓ |
| RSVP Guardian für verknüpfte Kinder | ✓ |
| RSVP-Übersicht für Trainer (4 Gruppen) | ✓ |
| `/teams` rollenabhängig (kein „Team erstellen"-CTA für Spieler/Guardian) | ✓ |
| `/dashboard` minimale Rollenanpassung (kein falscher Leer-Text) | ✓ |
| `/dev/ui-preview` in Production geschützt (404) | ✓ |
| GitHub Actions CI (lint + build) | ✓ |
| Dashboard: nächste Trainings, RSVP-Status, rollenabhängige CTAs | ✓ |
| Registrierung: Telefonnummer optional | ✓ |
| Redirect nach Team-/Training-Erstellung zu Detailseite | ✓ |
| Join-Erfolgsscreen: Navigation zurück zum Dashboard | ✓ |
| Dashboard Spieler/Guardian: wartende Beitrittsanfragen mit Typ + Teamname | ✓ |
| Dashboard Trainer: Beitrittsanfragen gruppiert nach Team mit Direktlink | ✓ |
| iOS Auto-Zoom-Fix (Input h-11, text-base mobile) | ✓ |
| Training erstellen: Datum und Uhrzeit getrennt | ✓ |
| Manueller MVP-Kernflow-Retest (P.1 nach P.2A) | ✓ 2026-07-01 |
| Playwright E2E — Smoke-Tests | ✓ |
| Playwright E2E — Self-Player Kernflow (M.2) | ✓ |
| Playwright E2E — Guardian/Kind Kernflow (M.3) | ✓ |
| GitHub Actions E2E-Workflow (M.4, manuell via `workflow_dispatch`) | ✓ |
| PWA-Basismetadaten (Manifest, Icons, Apple Web App Metadata, Theme Color) — Installierbarkeit vorbereitet, nicht praktisch getestet | ✓ |

---

## 3. Aktueller MVP-Funktionsumfang

**Was ein Trainer heute kann:**
- Account erstellen, einloggen
- Eigenständiges Team erstellen
- Einladungslink/QR-Code generieren und teilen
- Beitrittsanfragen annehmen oder ablehnen
- Trainings erstellen (Datum, Uhrzeit, Ort, Beschreibung)
- RSVP-Übersicht je Training einsehen

**Was ein Self-Player (erwachsener Spieler) heute kann:**
- Account erstellen, über Einladungslink beitreten
- Eigene Team(s) einsehen
- Zu Trainings zusagen, absagen oder vielleicht wählen (inkl. Notiz)

**Was ein Guardian (Elternteil) heute kann:**
- Account erstellen, Kind über Einladungslink anmelden (Vorname, Nachname, Geburtsdatum)
- Nach Annahme: RSVP für verknüpftes Kind

---

## 4. Datenbank/RLS-Stand

**11 Migrationen lokal angewendet:**

| Migration | Inhalt |
|-----------|--------|
| `20260625190923_init_mvp0_core` | Kern-Tabellen, Rollen, RLS, Funktionen |
| `20260625221615_mvp0a_team_flows` | Self-Service Team Flow |
| `20260627000001_fix_authenticated_table_grants` | SELECT-Grants für authenticated |
| `20260627100000_add_team_public_code` | public_code, generate_team_code(), create_independent_team() |
| `20260627200000_add_join_request_type` | request_type, requester_user_id, RLS, 3 neue Funktionen |
| `20260628000000_add_profile_registration_fields` | Profilfelder, handle_new_user Trigger |
| `20260629000000_add_join_flow_improvements` | players.date_of_birth, neue Join-RPCs ohne Name-Spoofing |
| `20260629100000_fix_players_trainer_rls` | SECURITY DEFINER-Funktionen für Trainer-Player-Sichtbarkeit |
| `20260629200000_add_events` | events, event_attendance, RLS, RPCs, Trigger |
| `20260629300000_fix_player_event_rls` | is_player_in_team(), is_guardian_in_team(), Policies für teams + events |
| `20260629400000_add_pta_player_policy` | pta_select_player — Self-Player liest eigene aktive Assignment |

**RLS-Modell:** Variante B — Player/Guardian via eigene Relationen (nicht via team_memberships). SECURITY DEFINER Funktionen mit `SET search_path = ''` durchgängig umgesetzt.

---

## 5. UI-/UX-Stand

- AppShell mit Light/Dark-Theme, Mobile-Safe-Area, responsive Navigation
- Rollenabhängige UI: Trainer sieht „Team erstellen" und Trainer-CTAs; Spieler/Guardian sieht diese nicht
- `/teams`: Titel und EmptyState je nach Rolle unterschiedlich
- `/dashboard`: Leer-Text rollenabhängig (Trainer vs. Spieler/Guardian)
- Event-Detailseite: Trainer sieht RSVP-Übersicht, Spieler/Guardian sieht eigene RSVP-Form
- `/dev/ui-preview`: nur in Development erreichbar (in Production 404)

---

## 6. Dokumentationsstand

| Dokument | Status |
|----------|--------|
| `CLAUDE.md`, `AGENTS.md` | ✓ aktuell |
| `docs/PROJECT_BRIEF.md` | ✓ |
| `docs/CURRENT_TASK.md` | ✓ aktuell (2026-06-29) |
| `docs/DECISION_LOG.md` | ✓ neu — Rollen-/Ansichtslogik dokumentiert |
| `docs/LEGAL_TODO.md` | ✓ neu — DSGVO-Checkliste vor Pilotbetrieb |
| `docs/MVP_TEST_CHECKLIST.md` | ✓ vorhanden |
| `docs/MVP_SCOPE.md` | ✓ |
| `docs/DATABASE_MODEL.md` | ✓ |
| `docs/ROLES_AND_PERMISSIONS.md` | ✓ |
| `docs/SECURITY.md` | ✓ |
| `docs/DSGVO_PRIVACY_MODEL.md` | ✓ |
| `docs/SUPABASE_STRATEGY.md` | ✓ |
| `docs/TECH_STACK.md` | ✓ |
| `docs/MOBILE_APP_STRATEGY.md` | ✓ |
| `docs/DESIGN_SYSTEM.md` | fehlt — noch nicht angelegt |

---

## 7. Offene Pilot-Lücken

| Lücke | Priorität |
|-------|-----------|
| Legal-Seiten (`/legal/privacy`, `/legal/terms`, `/legal/imprint`) finalisieren — `/legal/imprint` bisher nur als Platzhalter erstellt, Betreiberangaben fehlen weiterhin | Hoch — vor echtem Pilotbetrieb |
| Datenmodell-Abgleich `players.date_of_birth` vs. dokumentiertes `birth_year`-Minimalprinzip klären | Mittel |
| AV-Vertrag mit Supabase abschließen | Hoch |
| `cleanup_expired_join_requests()` als Scheduled Job einrichten | Mittel |
| Dashboard-UX für Spieler/Guardian verbessern (nächste Trainings, offene RSVP) | Mittel |
| Self-Service Account-Löschung (Art. 17 DSGVO) | Mittel — aktuell manuell |
| `DESIGN_SYSTEM.md` anlegen | Niedrig |
| Supabase EU-Region für Datenspeicher bestätigen | Hoch — vor Launch |
| Service Worker / Offline-Support — bewusst nicht im Scope von PWA.1 | — |
| Praktischer Install-Test (iOS/Android) und Lighthouse-PWA-Audit — noch offen | Mittel |

---

## 8. Nächste empfohlene Schritte

1. **Legal-Seiten finalisieren** — `/legal/privacy`, `/legal/terms` vor Pilotbetrieb erforderlich
2. **Nächste Feature-Entscheidung** — P.2B Einladungscode, Match-MVP
3. **Langfristigen Rollen-/Ansichtswechsel planen** — UI-Switcher „Aktive Ansicht: Trainer ▼" (steht in `docs/DECISION_LOG.md`)
4. **`cleanup_expired_join_requests()` schedulen** — pg_cron oder Supabase Edge Function
5. **E2E CI auf push/PR erweitern** — wenn `e2e.yml` stabil läuft

---

## 9. Nicht im aktuellen MVP-Scope

- Matches / Spielberichte
- Wiederkehrende Trainings
- Interne Events (Vereinsfeste, Spielerversammlungen)
- Turniere (eigenständiger Produktbereich, Phase 3+)
- Vereinsflows (club_memberships, club_admin, Vereinsverifikation) — Migration existiert, UI fehlt
- Team-Affiliation-Flow (eigenständiges Team schließt sich Verein an)
- Rollen-/Ansichtswechsler im UI
- Audit-Logs
- Monetarisierung / Billing
- ÖFB-Integration / offizielle Spielertransfers
- Service Worker / Offline-Modus / Push Notifications (PWA.1 bewusst ohne)
