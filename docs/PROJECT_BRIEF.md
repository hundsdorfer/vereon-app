# Project Brief — Vereon

**Kompaktzusammenfassung für Claude Code.** Details in den verlinkten Docs.

---

## 1. Produktvision

SaaS-Plattform für Amateurfußball-Vereinsmanagement. Zielgruppe: Trainer, Vereinsfunktionäre, Eltern/Guardians.

**Kernversprechen:**
- Trainer kann sofort loslegen — ohne Verein, ohne Genehmigung (eigenständige Teams)
- Vereine können mehrere Teams und Mitglieder verwalten
- Eltern nutzen Kernfunktionen immer kostenlos (RSVP, Kalender)
- DSGVO-konform von Anfang an, besonders bei Minderjährigen

---

## 2. Wichtigste Architekturentscheidungen

| Entscheidung | Begründung |
|---|---|
| Next.js 16 App Router, TypeScript strict, Tailwind v4 | Moderner Stack, keine Legacy-Patterns |
| Supabase — kein NextAuth, kein Prisma | Weniger Schichten, RLS als echte Sicherheitsebene |
| `src/proxy.ts` statt `middleware.ts` | Next.js 16 Breaking Change — Exportname `proxy` |
| 4 Supabase-Clients (server / route-handler / client / middleware) | Jeder Kontext braucht eigenen Cookie-Zugriff |
| `teams.club_id` nullable | Eigenständige Teams ohne Verein — Trainer-First |
| Multi-Tenant via `club_id` (optional) | Nachträglich fast unmöglich einzubauen |
| Mehrfachrollen via separate Tabellen | Obmann = Trainer = Kassier ist Realität |
| SECURITY DEFINER Funktionen für atomare Operationen | Privilege Escalation beim ersten club_admin/team_owner verhindert |
| `roles.key` (maschinenlesbar) in RLS-Funktionen | Nicht `roles.name_de` — key ist unveränderlich |
| Kein Hard-Delete im MVP | Soft-Delete via `status`-Felder |
| `getUser()` nicht `getSession()` in Proxy/Middleware | Serverseitige JWT-Prüfung, keine Session-Fälschung |

Vollständige Details: `docs/SUPABASE_STRATEGY.md`, `docs/DATABASE_MODEL.md`

---

## 3. MVP-Reihenfolge

```
MVP 0A  → Eigenständiges Team, team_invitation_links, team_join_requests,
           players (minimal), events, RSVP
           Warum team_join_requests in 0A: Self-Service-Eltern/Kind-Flow
           ist das differenzierende Kernfeature, kein Add-on

MVP 0B  → Verein anlegen (pending_verification), invitations, club_managed Teams

MVP 1   → player_guardians, player_team_assignments, matches, match_reports,
           audit_logs — vollständige Spieler/Guardian-Verwaltung

MVP 2   → team_affiliation_requests — eigenständige Teams treten Verein bei

Phase 3+→ Billing, official_club_registry, player_transfer_requests
```

Migrationen: `001_init_mvp0_core` → `002_mvp0a_team_flows` → `003_mvp0b_invitations` → `004_mvp1_players_full` → `005_mvp2_affiliation`

Details: `docs/MVP_SCOPE.md`, `docs/USER_FLOWS.md`

---

## 4. Rollen-Grundsätze

- Rollen sind scope-getrennt: `system` / `club` / `team`
- Vereinsrollen: `club_member_roles` (n pro Mitglied)
- Teamrollen: `team_member_roles` (n pro Mitglied)
- **MVP 0A:** `team_owner` (Eigentümer eigenständiges Team), `head_coach`
- **MVP 0B:** `club_admin` (technischer Vereinsadmin)
- **MVP 1:** `player`, `guardian`, `team_manager`, `assistant_coach`, `president`, `sporting_director`
- `team_owner` ≠ `head_coach`: owner = administrativ, head_coach = fachlich
- Guardian-Rechte kommen aus `player_guardians`, nicht aus `team_member_roles`
- `player_guardians.verified_at` muss gesetzt sein — einziger Weg: Einladungsflow

21 Rollen total, Seed-Insert in Migration 001. Details: `docs/ROLES_AND_PERMISSIONS.md`

---

## 5. Datenmodell-Grundsätze

**Kernstruktur:**
```
auth.users → profiles (1:1, Trigger)
auth.users → club_memberships → clubs
auth.users → team_memberships → teams (club_id nullable)
club_memberships → club_member_roles → roles (scope='club')
team_memberships → team_member_roles → roles (scope='team')
auth.users → player_guardians → players (MVP 1)
teams → team_invitation_links → team_join_requests (MVP 0A)
teams → events → event_attendance (via player_id)
```

**Wichtige Felder:**
- `teams.ownership_type`: `independent` | `club_managed`
- `teams.status`: `active` | `pending_affiliation` | `club_affiliated` | `archived`
- `clubs.verification_status`: `draft` | `pending_verification` | `verified` | `rejected` | `suspended`
- `players.birth_year` (nicht `date_of_birth`) — Datensparsamkeit

**SECURITY DEFINER Funktionen:**
- `create_club()` — atomar: club + club_membership + club_admin
- `create_independent_team()` — atomar: team + team_membership + team_owner + head_coach

Alle SECURITY DEFINER Funktionen: `SET search_path = ''` + vollständige Schema-Prefixe (`public.*`)

Details: `docs/DATABASE_MODEL.md`

---

## 6. DSGVO-Grundsätze

- Spieler sind häufig Minderjährige — besonderer Schutz nach Art. 8 DSGVO
- `birth_year` statt `date_of_birth` — reicht für Altersklassen, weniger sensibel
- Keine Fotos von Minderjährigen im MVP, keine Gesundheitsdaten, keine freien Trainernotizen über Kinder
- Kindsdaten in `team_join_requests` erst nach Trainer-Akzeptanz für Team sichtbar
- Abgelehnte `team_join_requests`: Löschfrist 90 Tage (pg_cron)
- `tactics_notes` in `match_reports`: nur für Trainer (Column-Level Security oder RLS)
- Guardian-Verknüpfung nur via Einladungsflow — `verified_at` ist Einwilligungsnachweis
- `SUPABASE_SERVICE_ROLE_KEY` niemals in App-Code, niemals committed

Details: `docs/DSGVO_PRIVACY_MODEL.md`

---

## 7. Monetarisierungs-Grundsätze

- **Eltern zahlen nie** für Pflichtfunktionen (RSVP, Kalender) — Trainer/Verein zahlt
- Pläne: Free Team → Team Plus → Club Basic → Club Pro
- Billing-Infrastruktur kommt erst in Phase 3 (Stripe, `plans`/`subscriptions`/`feature_flags`)
- Keine personalisierte Werbung auf Basis von Kinder- oder Vereinsdaten
- Free Tier muss wirklich nutzbar sein — sonst kein virales Wachstum im Amateursport

Details: `docs/MONETIZATION_STRATEGY.md`

---

## 8. Verbote und Sicherheitsregeln

### Hard Constraints (jede Session)
- **NEVER** Migration SQL befüllen ohne explizite Bestätigung in dieser Session
- **NEVER** `npx supabase db reset` ohne separate explizite Bestätigung
- **NEVER** `npx supabase db push` ausführen
- **NEVER** Remote-Datenbank verbinden oder modifizieren
- **NEVER** `.env.local` oder Secrets/Keys anzeigen
- **NEVER** Anwendungscode ändern ohne vorherige Bestätigung
- **NEVER** Packages installieren ohne Bestätigung
- **NEVER** `SUPABASE_SERVICE_ROLE_KEY` committen
- **Immer** geplante Dateiänderungen auflisten und Bestätigung abwarten

### Technische Verbote
- `getSession()` in Proxy/Middleware — immer `getUser()` (serverseitige JWT-Prüfung)
- Direkte INSERTs auf `club_memberships`/`team_member_roles` für ersten Admin/Owner — nur via SECURITY DEFINER
- Client Components mit Datenbankzugriff oder API-Keys
- SECURITY DEFINER ohne `SET search_path = ''`
- `roles.name_de` als Vergleichswert in Policies — immer `roles.key`

---

## 9. Nächster geplanter technischer Schritt

**Migration 001 befüllen** (`supabase/migrations/20260625190923_init_mvp0_core.sql`)

Inhalt: `roles` (21 Rollen inkl. team_owner, mit `key`/`name_de`), `permissions`, `role_permissions`, `profiles`, `clubs` (verification_status), `seasons`, `club_memberships`, `club_member_roles`, `teams` (nullable club_id, ownership_type, status), `team_memberships`, `team_member_roles`, Trigger (updated_at, handle_new_user, scope-Validierung), RLS, Hilfsfunktionen, `create_club()`, `create_independent_team()`, Indexes.

Danach (separate Bestätigungen nötig):
1. `npx supabase db reset` — Migration lokal testen
2. `npx supabase gen types typescript --local > src/types/database.types.ts`
3. Auth-Flow (MVP 0A): proxy.ts erweitern, /login, /register, /auth/callback
4. MVP 0A Features: eigenständiges Team, team_invitation_links, join flow

Aktueller Migrationsstand: Datei angelegt, **noch leer**.
