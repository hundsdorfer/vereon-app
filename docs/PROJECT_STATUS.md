# Project Status

**Stand:** 2026-06-25

---

## Kontext

Vereon wurde als **neue technische Basis neu gestartet**. Der alte Ordner `footworld` enthält nur eine statische Demo und dient ausschließlich als visuelle Referenz — er ist keine technische Grundlage.

Die aktuelle Codebasis (`vereon-app`) ist bewusst leer gehalten: technisch sauber, korrekt konfiguriert, bereit für echte Entwicklung.

---

## Architektur-Korrekturschleife 1 (abgeschlossen)

Nach der initialen Erstellung der Architekturdokumente wurde eine kritische Prüfung durchgeführt:

### Datenmodell-Korrekturen
- `UNIQUE(club_id, user_id)` auf `club_memberships` bleibt — aber Rollen werden in `club_member_roles` ausgelagert
- Neue Tabelle `club_member_roles`: n Vereinsrollen pro Mitglied
- Neue Tabelle `team_member_roles`: n Teamrollen pro Teammitglied
- `player_guardians` ersetzt bisherige Guardian-Struktur
- `event_attendance` hängt primär an `player_id` — Spieler ohne Account werden unterstützt
- Neue Tabellen: `player_team_assignments`, `seasons`
- Vollständige Index-Strategie ergänzt
- `events.club_id` Integrität via Trigger
- `create_club()` SECURITY DEFINER als einziger Weg zum ersten club_admin

### Rollenmodell-Korrekturen
- Mehrfachrollen explizit unterstützt
- 19 Rollen definiert (System, Verein, Team)
- Department-Scopes für Phase 2 vorgeplant

### Supabase-Strategie-Korrekturen
- Vier statt drei Supabase-Clients
- Route-Handler-Client separat mit vollem Cookie-Schreib-Zugriff
- SECURITY DEFINER Funktionen mit `SET search_path = ''`

### MVP-Neuaufteilung (Runde 1)
- MVP 0: Auth + Verein + Team + Trainer + Kalender + RSVP
- MVP 1: Spieler + Guardian + Anwesenheit + Mein Team + Spielbericht

---

## Architektur-Korrekturschleife 2 (abgeschlossen)

Vor dem Befüllen von Migration 001 wurden 14 neue Produktentscheidungen eingearbeitet. Alle Dokumentationsänderungen wurden **vor** der ersten Migration umgesetzt.

### Neue Produktentscheidungen

1. **Eigenständige Teams ohne Verein** — `teams.club_id` nullable, `team_owner`-Rolle, `create_independent_team()`-Funktion
2. **team_owner als neue Rolle** — administrativer Eigentümer eigenständiger Teams; wird in Migration 001 als Seed-Datum angelegt
3. **Vereinsverifikation** — `clubs.verification_status` mit 5 Zuständen; `pending_verification` ab Erstellung
4. **ÖFB-Vorbereitung** — `clubs.official_registry_id`, `official_club_registry`-Tabelle für Phase 3+
5. **Team-Affiliation-Flow** — eigenständige Teams können sich einem Verein anschließen (MVP 2); `team_affiliation_requests`
6. **Self-Service-Eltern/Kind-Beitritt** — `team_invitation_links` + `team_join_requests` als MVP 0A (nicht MVP 1)
7. **Mehrfachrollen explizit** — `club_member_roles` und `team_member_roles` als Pflichtstruktur bestätigt
8. **club_admin als technische Rolle** — `president` ist die sichtbare Führungsrolle, `club_admin` ist der technische Admin
9. **DSGVO-Modell dokumentiert** — Minderjährigenschutz, Datensparsamkeit, Guardian-Einwilligungsflow
10. **Vereinsinterne Transfers** — `player_transfer_requests` in Phase 2 (kein offizieller ÖFB-Transfer)
11. **Monetarisierungsstrategie** — Free Team → Team Plus → Club Basic → Club Pro; Billing-Infrastruktur Phase 3
12. **MVP-Neugliederung** — 0A (eigenständiges Team) → 0B (Verein) → 1 (Spieler/Guardians) → 2 (Affiliation)
13. **roles.key statt roles.name** — maschinenlesbarer Schlüssel für RLS-Funktionsaufrufe
14. **Keine DELETE-Policies im MVP** — Soft-Delete via status-Felder

### Neue/aktualisierte Dokumentation (Runde 2)
- **NEU:** `docs/DSGVO_PRIVACY_MODEL.md`
- **NEU:** `docs/MONETIZATION_STRATEGY.md`
- **NEU:** `docs/USER_FLOWS.md`
- **Überarbeitet:** `docs/DATABASE_MODEL.md` (nullable teams.club_id, ownership_type, verification_status, team_invitation_links/team_join_requests als MVP 0A)
- **Überarbeitet:** `docs/ROLES_AND_PERMISSIONS.md` (team_owner, Seed-Daten mit roles.key)
- **Überarbeitet:** `docs/MVP_SCOPE.md` (4-stufige Gliederung: 0A/0B/1/2)
- **Überarbeitet:** `docs/PROJECT_STATUS.md` (dieser Eintrag)
- **Überarbeitet:** `docs/SECURITY.md` (DSGVO-Risiken, team_join_requests-Datenschutz)

---

## Aktueller Zustand

### Technische Basis
- [x] Next.js 16 (App Router) mit TypeScript, Tailwind CSS v4, ESLint 9
- [x] `src/`-Ordnerstruktur eingerichtet
- [x] TypeScript-Alias `@/*` → `./src/*` konfiguriert
- [x] Build und Lint funktionieren fehlerfrei
- [x] GitHub Repository vorhanden
- [x] Vercel Deployment vorbereitet

### Dokumentation
- [x] `CLAUDE.md` — Projektregeln für Claude
- [x] `AGENTS.md` — Hinweis auf Next.js 16 Breaking Changes
- [x] `docs/PRODUCT_VISION.md` — Produktvision und Zielgruppe
- [x] `docs/ROADMAP.md` — Phasenplanung
- [x] `docs/MVP_SCOPE.md` — MVP 0A/0B/1/2 Aufteilung, Akzeptanzkriterien
- [x] `docs/DATABASE_MODEL.md` — Vollständiges Datenmodell (eigenständige Teams, Verifikation, MVP 0A)
- [x] `docs/ROLES_AND_PERMISSIONS.md` — 21 Rollen inkl. team_owner, Mehrfachrollen, roles.key
- [x] `docs/SUPABASE_STRATEGY.md` — 4 Clients, Route Handler, Middleware, Auth-Flow
- [x] `docs/TECH_STACK.md` — Tech-Entscheidungen
- [x] `docs/SECURITY.md` — 8+ Sicherheitsrisiken mit Maßnahmen
- [x] `docs/MOBILE_APP_STRATEGY.md` — PWA + Capacitor-Plan
- [x] `docs/DSGVO_PRIVACY_MODEL.md` — Datenschutzmodell, Minderjährigenschutz
- [x] `docs/MONETIZATION_STRATEGY.md` — Pläne, Billing-Infrastruktur Phase 3
- [x] `docs/USER_FLOWS.md` — Alle Flows MVP 0A bis MVP 2

### Supabase-Technische Basis
- [x] `@supabase/supabase-js`, `@supabase/ssr`, `server-only` installiert
- [x] `supabase` CLI als devDependency installiert
- [x] `.env.example` erstellt (committierbar, ohne echte Keys)
- [x] `src/lib/supabase/client.ts` — Browser-Client für Client Components
- [x] `src/lib/supabase/server.ts` — Server-Client für Server Components + Server Actions
- [x] `src/lib/supabase/route-handler.ts` — Client für Route Handlers
- [x] `src/lib/supabase/middleware.ts` — `updateSession`-Helper für Proxy
- [x] `src/proxy.ts` — Minimaler Proxy (Session-Refresh, Next.js 16 Konvention)
- [x] Lint und Build fehlerfrei

### Lokale Supabase-Instanz
- [x] `supabase init` — `supabase/config.toml` + `supabase/.gitignore` erstellt
- [x] `supabase/seed.sql` — leere Datei erstellt
- [x] `config.toml` — `minimum_password_length` auf 8 angehoben
- [x] `supabase start` — läuft (Docker Desktop, lokale Instanz aktiv)
- [x] `.env.local` mit lokalen Keys befüllt

### Migration
- [x] `supabase/migrations/20260625190923_init_mvp0_core.sql` — Datei angelegt, **noch leer** (wartet auf Bestätigung)

### Noch nicht vorhanden
- [ ] Supabase-Projekt (Cloud) angelegt
- [ ] Migration 001 befüllt (wartet auf separate Bestätigung)
- [ ] Auth-Flow
- [ ] Irgendein Feature

---

## Nächste Schritte (in dieser Reihenfolge)

### Schritt 3 — Migration 001 befüllen (wartet auf Bestätigung)
- `supabase/migrations/20260625190923_init_mvp0_core.sql` befüllen
- Enthält: roles (inkl. team_owner), permissions, role_permissions, profiles, clubs, seasons, club_memberships, club_member_roles, teams (nullable club_id), team_memberships, team_member_roles, Trigger, RLS, Funktionen (create_club, create_independent_team)
- **Niemals ohne separate, explizite Bestätigung in dieser Session**

### Schritt 3b — Migration 001 lokal testen
- `npx supabase db reset` ausführen (erfordert separate Bestätigung)
- Prüfen: Tabellen, Rollen, Trigger, RLS-Policies
- TypeScript-Typen generieren: `npx supabase gen types typescript --local > src/types/database.types.ts`

### Schritt 4 — Auth-Flow (MVP 0A)
- `src/proxy.ts` um vollständigen Route-Schutz erweitern
- `/login`, `/register`, `/auth/callback` Seiten und Server Actions
- Passwort-Reset-Flow

### Schritt 5 — MVP 0A Features
- Dashboard-Shell
- `/teams/new` — eigenständiges Team erstellen via `create_independent_team()`
- `/join/[token]` — Self-Service-Beitrittsflow
- Beitrittsanfragen-Verwaltung
- Kalender: Termine erstellen, RSVP

---

## Bekannte Entscheidungen (unveränderlich)

| Entscheidung | Begründung |
|---|---|
| Supabase statt NextAuth + Prisma | Weniger Schichten, RLS als echte Sicherheitsebene |
| Multi-Tenant von Anfang an | Nachträglich fast unmöglich einzubauen |
| Mehrfachrollen via separate Tabellen | Amateurfußball-Realität: Obmann = Trainer, etc. |
| Eigenständige Teams (nullable club_id) | Trainer-First-Strategie: sofort nutzbar ohne Vereins-Overhead |
| team_owner als eigene Rolle | Administrativer Eigentümer klar von fachlicher Rolle (head_coach) getrennt |
| Vereinsverifikation (pending_verification) | Öffentliche Sichtbarkeit und Affiliation erst nach Verifikation |
| Guardian-Rechte über player_guardians | Teamwechsel des Kindes bricht nicht die Elternrechte |
| event_attendance via player_id | Spieler ohne Account erscheinen in Anwesenheitslisten |
| `create_club()` SECURITY DEFINER | Privilege Escalation beim ersten club_admin verhindert |
| `create_independent_team()` SECURITY DEFINER | team_owner-Zuweisung sicher und atomar |
| Vier Supabase-Clients | Jeder Kontext braucht eigenen Cookie-Zugriff |
| MVP 0A vor MVP 0B | Eigenständige Teams sind der Einstieg, Verein ist der Upgrade-Pfad |
| team_join_requests in MVP 0A | Self-Service-Eltern/Kind-Flow ist Kernfeature, kein Add-on |
| roles.key als Referenz in RLS | Maschinenlesbar, unveränderlich, kein Displayname in Policies |
| Capacitor statt React Native | Code-Sharing mit Web, eine Codebasis |

---

## Bekannte offene Fragen

| Frage | Priorität | Klären wann |
|---|---|---|
| `notifications`-Tabelle oder nur Supabase Realtime? | Mittel | Phase 2 |
| pg_cron für Invitation-Cleanup? | Mittel | Vor Launch |
| Departments als eigene Tabelle? | Niedrig | Phase 2 |
| Finanzmodul in gleichem Schema? | Niedrig | Phase 3 |
| Column-Level Security für `tactics_notes`? | Mittel | MVP 1 |
| AV-Vertrag mit Supabase | Hoch | Vor Launch |
| Datenschutzerklärung für Endnutzer | Hoch | Vor Launch |
| Einwilligungsprozess für Minderjährige (u14) | Hoch | MVP 1 |
| Löschfrist für abgelehnte team_join_requests (DSGVO) | Mittel | Vor MVP 0A Launch |
| Supabase EU-Region für Datenspeicher | Hoch | Vor Launch |

---

## Hard Constraints (gelten in jeder Session)

- NEVER fill migration SQL without explicit per-session confirmation
- NEVER run `npx supabase db reset` without separate explicit confirmation
- NEVER run `npx supabase db push`
- NEVER connect to or modify remote database
- NEVER show .env.local contents or any secrets/keys
- NEVER change application code without prior confirmation
- NEVER install packages without confirmation
- NEVER commit `SUPABASE_SERVICE_ROLE_KEY`
- Always list planned file changes and wait for confirmation before making them
