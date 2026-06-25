# Project Status

**Stand:** 2026-06-25

---

## Kontext

Vereon wurde als **neue technische Basis neu gestartet**. Der alte Ordner `footworld` enthält nur eine statische Demo und dient ausschließlich als visuelle Referenz — er ist keine technische Grundlage.

Die aktuelle Codebasis (`vereon-app`) ist bewusst leer gehalten: technisch sauber, korrekt konfiguriert, bereit für echte Entwicklung.

---

## Architektur-Korrekturschleife (abgeschlossen)

Nach der initialen Erstellung der Architekturdokumente wurde eine kritische Prüfung durchgeführt. Folgende Korrekturen wurden in einer zweiten Überarbeitungsrunde umgesetzt, **bevor** mit der Supabase-Integration begonnen wird:

### Datenmodell-Korrekturen
- `UNIQUE(club_id, user_id)` auf `club_memberships` bleibt — aber Rollen werden in `club_member_roles` ausgelagert (separate Tabelle, beliebig viele Rollen pro Mitglied)
- Neue Tabelle `club_member_roles`: n Vereinsrollen pro Mitglied
- Neue Tabelle `team_member_roles`: n Teamrollen pro Teammitglied
- `player_guardians` ersetzt und erweitert bisherige Guardian-Struktur: Rechte aus Spieler-Guardian-Beziehung, nicht aus Team-Mitgliedschaft
- `invitations` um `player_id`, `invitation_type`, `target_scope`, `used_at`, `revoked_at`, Sicherheitsanforderungen für Tokens erweitert
- `event_attendance` hängt primär an `player_id` (nicht `user_id`) — Spieler ohne Account werden unterstützt
- Neue Tabelle `player_team_assignments`: Kader unabhängig von Auth-Accounts
- Neue Tabelle `seasons`: Saisonzugehörigkeit für Teams, Events, Kader
- `player_transfers` als Phase-2-Tabelle dokumentiert
- Vollständige Index-Strategie ergänzt (RLS-kritische Indexes)
- `events.club_id` Integrität via Trigger statt unsicherem CHECK-Constraint
- `create_club()`-Funktion (SECURITY DEFINER) als einziger Weg zum ersten club_admin

### Rollenmodell-Korrekturen
- Mehrfachrollen explizit unterstützt — reale Amateurfußball-Struktur berücksichtigt
- 19 Rollen definiert (System, Verein, Team), davon 5 MVP-relevant
- Klare Trennung: MVP-Rollen vs. architektonisch vorgesehene Rollen vs. Overengineering
- Department-Scopes für Phase 2 vorgeplant (Jugend, Frauen, Herren, Finanzen etc.)
- Guardian-Rechte-Modell korrekt: über `player_guardians`, nicht `team_member_roles`

### Supabase-Strategie-Korrekturen
- Vier statt drei Supabase-Clients: `server.ts`, `route-handler.ts`, `client.ts`, `middleware.ts`
- Route-Handler-Client separat mit vollem Cookie-Schreib-Zugriff
- Middleware weniger aggressiv: öffentliche Routen (`/`, `/invite/*`, `/about`) werden nicht blockiert
- `?redirect=`-Parameter für Post-Login-Navigation
- SECURITY DEFINER Funktionen mit `SET search_path = ''` — Schema-Injection verhindert

### Security-Korrekturen
- Falscher Tabellenname `team_members` → `team_memberships` korrigiert
- 7 konkrete Sicherheitsrisiken mit Maßnahmen dokumentiert
- Privilege-Escalation-Szenarien explizit adressiert

### MVP-Neuaufteilung
- MVP 0: Auth + Verein + Team + Trainer + Kalender + RSVP
- MVP 1: Spieler + Guardian + Anwesenheit + Mein Team + Spielbericht
- Klare Akzeptanzkriterien für beide Stufen

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
- [x] `docs/PRODUCT_VISION.md` — Produktvision und Zielgruppe
- [x] `docs/ROADMAP.md` — Phasenplanung
- [x] `docs/MVP_SCOPE.md` — MVP 0/1 Aufteilung, Akzeptanzkriterien
- [x] `docs/DATABASE_MODEL.md` — Vollständiges Datenmodell (20 Tabellen, Indexes, Trigger)
- [x] `docs/ROLES_AND_PERMISSIONS.md` — 19 Rollen, Mehrfachrollen, Berechtigungsmatrix
- [x] `docs/SUPABASE_STRATEGY.md` — 4 Clients, Route Handler, Middleware, Auth-Flow
- [x] `docs/TECH_STACK.md` — Tech-Entscheidungen
- [x] `docs/SECURITY.md` — 7 Sicherheitsrisiken mit Maßnahmen
- [x] `docs/MOBILE_APP_STRATEGY.md` — PWA + Capacitor-Plan

### Supabase-Technische Basis
- [x] `@supabase/supabase-js`, `@supabase/ssr`, `server-only` installiert
- [x] `supabase` CLI als devDependency installiert (`npx supabase ...`)
- [x] `.env.example` erstellt (committierbar, ohne echte Keys)
- [x] `src/lib/supabase/client.ts` — Browser-Client für Client Components
- [x] `src/lib/supabase/server.ts` — Server-Client für Server Components + Server Actions
- [x] `src/lib/supabase/route-handler.ts` — Client für Route Handlers
- [x] `src/lib/supabase/middleware.ts` — `updateSession`-Helper für Proxy
- [x] `src/proxy.ts` — Minimaler Proxy (Session-Refresh, Next.js 16 Konvention)
- [x] Lint und Build fehlerfrei

### Lokale Supabase-Instanz
- [x] `supabase init` — `supabase/config.toml` + `supabase/.gitignore` erstellt
- [x] `supabase/seed.sql` — leere Datei erstellt (verhindert Fehler bei `db reset`)
- [x] `config.toml` — `minimum_password_length` auf 8 angehoben
- [ ] `supabase start` — noch nicht gestartet (benötigt Docker Desktop, nach Bestätigung)
- [ ] `.env.local` mit lokalen Keys befüllt (nach `supabase start`)

### Noch nicht vorhanden
- [ ] Supabase-Projekt (Cloud) angelegt
- [ ] Datenbankschema / Migrationen
- [ ] Auth-Flow
- [ ] Irgendein Feature

---

## Nächste Schritte (in dieser Reihenfolge)

### ~~Schritt 1 — Supabase Packages + Clients~~ ✓ abgeschlossen
Alle Packages installiert, alle vier Clients implementiert, `src/proxy.ts` erstellt.

### Schritt 2 — Lokale Supabase-Instanz starten
- ~~`npx supabase init`~~ ✓ abgeschlossen
- `npx supabase start` — benötigt Docker Desktop (startet Postgres, Auth, Studio lokal)
- `.env.local` mit lokalen Keys befüllen (URL + anon key aus der CLI-Ausgabe von `supabase start`)

### Schritt 3 — Datenbankschema migrieren
- Migrationsdateien in `supabase/migrations/` anlegen
- Reihenfolge: `roles` → `clubs` → `seasons` → `profiles` (+ Trigger) → Mitgliedschaften → Teams → Spieler → Guardian → Events (+ Trigger) → Attendance (+ Trigger) → Matches → Reports → Audit
- RLS aktivieren, Hilfsfunktionen anlegen, Policies schreiben
- Alle Indexes anlegen
- `create_club()`-Funktion anlegen
- Lokal testen

### Schritt 4 — Auth-Flow (MVP 0)
- `src/proxy.ts` um vollständigen Route-Schutz erweitern (Public Routes, Redirects)
- `/login`, `/register`, `/auth/callback` Seiten und Server Actions
- Passwort-Reset-Flow
- Profil-Trigger testen

### Schritt 5 — Erste Features (MVP 0)
- Dashboard-Shell (Layout mit Sidebar/Header)
- `/clubs/new` — Verein anlegen via `create_club()`
- `/clubs/[clubId]/teams/new` — Team anlegen
- Einladungsflow für `head_coach`
- Kalender: Termine erstellen und anzeigen
- RSVP: Zu-/Absage setzen

---

## Bekannte Entscheidungen (unveränderlich)

| Entscheidung | Begründung |
|---|---|
| Supabase statt NextAuth + Prisma | Weniger Schichten, RLS als echte Sicherheitsebene |
| Multi-Tenant von Anfang an | Nachträglich fast unmöglich einzubauen |
| Mehrfachrollen via separate Tabellen | Amateurfußball-Realität: Obmann = Trainer, etc. |
| Guardian-Rechte über player_guardians | Teamwechsel des Kindes bricht nicht die Elternrechte |
| event_attendance via player_id | Spieler ohne Account erscheinen in Anwesenheitslisten |
| `create_club()` SECURITY DEFINER | Privilege Escalation beim ersten club_admin verhindert |
| Vier Supabase-Clients | Jeder Kontext (Server/Route Handler/Client/Middleware) braucht eigenen Cookie-Zugriff |
| MVP 0 vor MVP 1 | Jede Stufe ist vollständig deploybar |
| Lokale Supabase-Instanz | Offline-fähig, Migrations sicher testbar |
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
