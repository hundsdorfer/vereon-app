# Datenmodell — Vereon

**Stand:** 2026-06-25 (überarbeitet nach kritischer Architekturprüfung)
**Strategie:** Supabase Postgres, Row Level Security auf allen Tabellen, Multi-Tenant via `club_id`, Mehrfachrollen via separate Rollentabellen

---

## Grundprinzipien

- Jeder Verein (`clubs`) ist ein isolierter Tenant
- Ein User (`auth.users`) kann Mitglied in mehreren Vereinen sein — mit unterschiedlichen Rollen
- **Mehrfachrollen sind explizit erlaubt** — Mitgliedschaft und Rollen sind strikt getrennt
- Alle Tabellen haben RLS aktiviert. Policies basieren auf `auth.uid()` + Rollentabellen
- `id`-Felder sind immer `uuid` mit `gen_random_uuid()` als Default
- Zeitstempel: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`
- Guardian-Rechte werden über `player_guardians` abgeleitet, nicht über `team_member_roles`
- `event_attendance` hängt primär an `player_id`, nicht an `user_id`

---

## Tabellen

---

### `profiles`
Erweiterung von `auth.users`. 1:1-Beziehung. Wird automatisch bei Registrierung via Trigger angelegt.

```sql
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

**RLS:** User sieht und bearbeitet nur eigenes Profil. Vereinsadmins können Profile ihrer Mitglieder lesen (via View oder Funktion, nicht via direktem Table-Scan).

---

### `clubs`
Ein Verein = ein Tenant.

```sql
clubs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,       -- URL-sicherer Name: "fc-musterstadt-2026"
  logo_url      text,
  city          text,
  country       text DEFAULT 'AT',          -- Österreich als primärer Markt
  founded_year  integer,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)
```

**RLS:** Vereinsmitglieder lesen. Nur `club_admin`/`president` schreiben.
**Wichtig:** Verein wird ausschließlich via `create_club()`-Funktion (SECURITY DEFINER) angelegt — nie via direktem INSERT durch den Client.

---

### `seasons`
Repräsentiert eine Saison eines Vereins. Teams, Kader und Events können einer Saison zugeordnet werden.

```sql
seasons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name        text NOT NULL,              -- z.B. "2026/27"
  starts_at   date NOT NULL,
  ends_at     date NOT NULL,
  is_active   boolean DEFAULT false,      -- Nur eine Saison pro Verein aktiv
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT one_active_season_per_club UNIQUE (club_id, is_active)
  -- Hinweis: Der UNIQUE-Constraint funktioniert nur korrekt wenn is_active = true eindeutig ist.
  -- Alternative: Partial UNIQUE Index: CREATE UNIQUE INDEX ON seasons(club_id) WHERE is_active = true;
)
```

**RLS:** Vereinsmitglieder lesen. `club_admin` schreibt.

---

### `club_memberships`
Grundmitgliedschaft eines Users in einem Verein. Enthält **keine** Rolle — Rollen stehen in `club_member_roles`.

```sql
club_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'left'
  joined_at   timestamptz DEFAULT now(),
  left_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
)
```

**RLS:** Eigener Eintrag immer lesbar. `club_admin` sieht und verwaltet alle Einträge des Vereins.

---

### `club_member_roles`
Weist einer Vereinsmitgliedschaft beliebig viele vereinsweite Rollen zu. Ersetzt `club_memberships.role`.

```sql
club_member_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id   uuid NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  role_id         uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  scope           text NOT NULL DEFAULT 'club',   -- 'club' | 'department' | 'age_group' (Erweiterung Phase 2)
  scope_ref_id    uuid,                            -- Optional: Referenz auf Department/AgeGroup (Phase 2)
  granted_by      uuid REFERENCES auth.users(id),
  granted_at      timestamptz DEFAULT now(),
  expires_at      timestamptz,                     -- Optionale Befristung
  created_at      timestamptz DEFAULT now(),
  UNIQUE(membership_id, role_id)
)
```

**RLS:** Nur `club_admin` schreibt. Eigene Rollen lesbar.

---

### `teams`
Ein Team gehört zu genau einem Verein und optional einer Saison.

```sql
teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  season_id   uuid REFERENCES seasons(id) ON DELETE SET NULL,
  name        text NOT NULL,          -- z.B. "U17 Jungs", "Damen 1", "Reserve"
  age_group   text,                   -- z.B. "U17", "Herren", "Damen", "U10"
  gender      text DEFAULT 'mixed',   -- 'male' | 'female' | 'mixed'
  description text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

**RLS:** Vereinsmitglieder können Teams ihres Vereins lesen. `club_admin`/`sporting_director` verwalten.

---

### `team_memberships`
Grundzugehörigkeit eines Users zu einem Team. Enthält **keine** Rolle — Rollen stehen in `team_member_roles`.

```sql
team_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id   uuid REFERENCES seasons(id) ON DELETE SET NULL,  -- Saisonzugehörigkeit
  status      text NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'left'
  joined_at   timestamptz DEFAULT now(),
  left_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id, season_id)          -- Gleicher User kann in neuer Saison erneut beitreten
)
```

**Wichtig:** `UNIQUE(team_id, user_id)` wäre falsch — ein Spieler kann in der nächsten Saison erneut im selben Team sein, als neuer Eintrag mit neuer `season_id`.
**RLS:** Eigener Eintrag lesbar. Teamkollegen sehen sich gegenseitig (nur Name/Rolle). `head_coach` verwaltet.

---

### `team_member_roles`
Weist einer Teamzugehörigkeit beliebig viele teamspezifische Rollen zu. Ersetzt `team_memberships.role`.

```sql
team_member_roles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id  uuid NOT NULL REFERENCES team_memberships(id) ON DELETE CASCADE,
  role_id             uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  position            text,           -- Spielposition: 'goalkeeper', 'defender', etc.
  jersey_nr           integer,
  granted_by          uuid REFERENCES auth.users(id),
  granted_at          timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE(team_membership_id, role_id)
)
```

**RLS:** `head_coach` und `club_admin` schreiben. Teammitglieder lesen.

---

### `players`
Spielerdatensatz. Existiert unabhängig davon, ob der Spieler einen Vereon-Account hat.

```sql
players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- null = kein Account
  full_name       text NOT NULL,
  date_of_birth   date,
  nationality     text,
  dominant_foot   text,               -- 'left' | 'right' | 'both'
  position        text,               -- primäre Spielposition
  notes           text,               -- interne Trainernotizen
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**RLS:** Trainer und Admins lesen/schreiben. Spieler (via `user_id`) sehen nur eigene Daten.

---

### `player_team_assignments`
Ordnet Spieler einem Team für eine Saison zu. Unabhängig von `team_memberships` (Auth-Account nicht erforderlich).

```sql
player_team_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id   uuid REFERENCES seasons(id) ON DELETE SET NULL,
  position    text,
  jersey_nr   integer,
  status      text NOT NULL DEFAULT 'active',    -- 'active' | 'loaned_out' | 'left'
  joined_at   timestamptz DEFAULT now(),
  left_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(player_id, team_id, season_id)
)
```

**Zweck:** Trennt "wer hat einen Account" von "wer spielt in welchem Team". Ermöglicht Anwesenheitserfassung auch für Spieler ohne Account.
**RLS:** Trainer lesen/schreiben. Spieler sehen eigene Zuordnungen.

---

### `player_guardians`
Erziehungsberechtigte, verknüpft mit einem Spieler. Rechte werden über diese Tabelle abgeleitet.

```sql
player_guardians (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guardian_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship        text,           -- 'mother' | 'father' | 'guardian' | 'other'
  is_primary_contact  boolean DEFAULT false,
  can_rsvp            boolean DEFAULT true,   -- Darf Zu-/Absagen für Kind abgeben
  can_view_schedule   boolean DEFAULT true,   -- Darf Kalender des Kindes sehen
  can_receive_messages boolean DEFAULT true,  -- Darf Mitteilungen empfangen
  verified_at         timestamptz,            -- null = noch nicht verifiziert
  created_at          timestamptz DEFAULT now(),
  UNIQUE(player_id, guardian_user_id)
)
```

**Schlüssel-Design-Entscheidung:** Guardian-Rechte hängen am Spieler, nicht am Team. Wenn das Kind das Team wechselt, bleiben Guardian-Rechte automatisch gültig — kein manuelles Update nötig.
**RLS:** Guardian sieht nur eigene Verknüpfungen. Trainer und Admins sehen alle Guardians ihrer Spieler.

---

### `roles`
Zentrale Rollendefinition. Seed-Tabelle, wird initial befüllt.

```sql
roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,       -- z.B. 'club_admin', 'head_coach'
  scope       text NOT NULL,              -- 'system' | 'club' | 'team'
  is_mvp      boolean DEFAULT false,      -- Wird im MVP aktiv genutzt?
  description text,
  created_at  timestamptz DEFAULT now()
)
```

**RLS:** Für alle authentifizierten User lesbar. Nur `super_admin` schreibt.

---

### `invitations`
Einladungslinks für neue Mitglieder. Sicherheitsanforderungen sind Teil des Schemas.

```sql
invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id) ON DELETE SET NULL,
  player_id       uuid REFERENCES players(id) ON DELETE SET NULL,  -- Für Guardian-Einladungen
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  email           text,                   -- Optional: direkte E-Mail-Einladung
  token           text UNIQUE NOT NULL,   -- Mindestens 32 kryptografisch zufällige Bytes, hex-kodiert
  invitation_type text NOT NULL,          -- 'club_member' | 'team_member' | 'player_guardian'
  target_role     text NOT NULL REFERENCES roles(name),
  target_scope    text NOT NULL DEFAULT 'club',   -- 'club' | 'team' | 'player_guardian'
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'expired' | 'revoked'
  max_uses        integer DEFAULT 1,       -- Typischerweise 1 (Single-Use)
  use_count       integer DEFAULT 0,
  expires_at      timestamptz NOT NULL,    -- Pflicht, typisch: now() + interval '7 days'
  accepted_at     timestamptz,             -- Umbenannt von accepted_at für Klarheit
  used_at         timestamptz,             -- Wann wurde der Token eingelöst?
  revoked_at      timestamptz,             -- Wann wurde die Einladung widerrufen?
  created_at      timestamptz DEFAULT now()
)
```

**Token-Sicherheitsanforderungen:**
- Mindestens 32 Bytes kryptografisch zufällig: `encode(gen_random_bytes(32), 'hex')`
- Niemals kurze erratbare Codes für sensitive Rollen (`club_admin`, `head_coach`)
- Ablauf: maximal 7 Tage, typisch 48 Stunden
- Single-Use: `max_uses = 1`, nach Einlösung `used_at` setzen
- Abgelaufene/widerrufene Tokens: regelmäßiger Cleanup via Cron oder pg_cron

**RLS:** Nur Admins und Coaches lesen/erstellen. Token ist öffentlich zugänglich (für Einladungsflow — kein Auth erforderlich), aber nur einmalig und zeitlich begrenzt gültig.

---

### `events`
Kalendereinträge. `club_id` wird via Trigger aus `team_id` abgeleitet — niemals manuell gesetzt.

```sql
events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL,          -- Abgeleitet via Trigger aus teams.club_id. NIEMALS manuell setzen.
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  title           text NOT NULL,
  type            text NOT NULL,          -- 'training' | 'match' | 'meeting' | 'other'
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  location        text,
  description     text,
  is_cancelled    boolean DEFAULT false,
  season_id       uuid REFERENCES seasons(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  FOREIGN KEY (club_id, team_id) REFERENCES ... -- Siehe "events.club_id Integrität" unten
)
```

**events.club_id Integrität:**
`CHECK`-Constraints mit Subqueries sind in Postgres nicht erlaubt. Stattdessen wird die Integrität via Trigger erzwungen:

```sql
CREATE OR REPLACE FUNCTION events_set_club_id()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT club_id INTO NEW.club_id FROM teams WHERE id = NEW.team_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_before_insert_or_update
BEFORE INSERT OR UPDATE OF team_id ON events
FOR EACH ROW EXECUTE FUNCTION events_set_club_id();
```

Damit wird `club_id` automatisch korrekt gesetzt und kann nicht manuell auf einen falschen Wert gesetzt werden. Das Frontend darf `club_id` bei INSERT niemals mitsenden — es wird ignoriert oder durch den Trigger überschrieben.

**RLS:** Alle Teammitglieder lesen. Trainer erstellen/bearbeiten.

---

### `event_attendance`
RSVP und tatsächliche Anwesenheit. Hängt primär an `player_id`, nicht an `user_id`.

```sql
event_attendance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id           uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,  -- Primärer Anker
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,        -- Null wenn kein Account
  responded_by_user_id uuid REFERENCES auth.users(id),                          -- Wer hat geantwortet (Spieler oder Guardian)
  rsvp_status         text,                -- 'attending' | 'declined' | 'maybe' | null
  rsvp_note           text,
  responded_at        timestamptz,
  attended            boolean,             -- Tatsächliche Anwesenheit nach dem Termin
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(event_id, player_id)
)
```

**Design-Entscheidung:** `player_id` ist der primäre Schlüssel für Anwesenheit. Auch Spieler ohne Account (`user_id = null`) erscheinen in Anwesenheitslisten. Trainer erfassen Anwesenheit immer via `player_id`. Ein Guardian kann `rsvp_status` setzen wenn `responded_by_user_id = guardian_user_id` und `player_guardians.can_rsvp = true`.

**Automatische Befüllung:** Beim Erstellen eines Events werden automatisch `event_attendance`-Zeilen für alle aktiven `player_team_assignments` des Teams angelegt (via Trigger). Status bleibt `null` bis der Spieler/Guardian antwortet.

```sql
CREATE OR REPLACE FUNCTION create_attendance_for_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO event_attendance (event_id, player_id, user_id)
  SELECT NEW.id, p.id, p.user_id
  FROM player_team_assignments pta
  JOIN players p ON p.id = pta.player_id
  WHERE pta.team_id = NEW.team_id
  AND pta.status = 'active'
  ON CONFLICT (event_id, player_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_after_insert_attendance
AFTER INSERT ON events
FOR EACH ROW EXECUTE FUNCTION create_attendance_for_event();
```

**RLS:** Spieler sehen/setzen nur eigene RSVP. Guardians setzen RSVP für ihr Kind (via `player_guardians`-Prüfung). Trainer sehen alle und setzen `attended`.

---

### `matches`
Spielspezifische Daten, verknüpft mit einem Event vom Typ `'match'`.

```sql
matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  opponent        text NOT NULL,
  is_home_game    boolean DEFAULT true,
  score_home      integer,
  score_away      integer,
  competition     text,           -- z.B. "Unterliga West", "Landesliga"
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**RLS:** Teammitglieder lesen. Trainer schreiben.

---

### `match_reports`
Spielbericht nach einem Spiel.

```sql
match_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES auth.users(id),
  summary         text,           -- Allgemeine Zusammenfassung (für Spieler sichtbar wenn veröffentlicht)
  tactics_notes   text,           -- Interne Trainernotizen (nie für Spieler)
  is_published    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**RLS:** Trainer schreiben. Spieler lesen nur wenn `is_published = true`. `tactics_notes` ist für Spieler niemals sichtbar (separate Policy oder Spalte via Column-Level Security).

---

### `audit_logs`
Unveränderliches Protokoll kritischer Aktionen.

```sql
audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  club_id         uuid REFERENCES clubs(id) ON DELETE SET NULL,
  team_id         uuid REFERENCES teams(id) ON DELETE SET NULL,
  action          text NOT NULL,          -- z.B. 'membership.created', 'invitation.revoked'
  resource_type   text NOT NULL,
  resource_id     uuid,
  payload         jsonb,
  created_at      timestamptz DEFAULT now()
)
```

**RLS:** Nur `club_admin`/`super_admin` lesen. Kein User schreibt direkt — nur via `SECURITY DEFINER`-Funktionen.

---

### `player_transfers` *(Phase 2 — nicht im MVP)*

Dokumentiert als geplante spätere Tabelle. Nicht in der ersten Migration.

```sql
-- player_transfers (PHASE 2)
-- player_id       → Spieler
-- from_club_id    → Abgebender Verein
-- to_club_id      → Aufnehmender Verein
-- from_team_id    → Abgebendes Team (optional)
-- to_team_id      → Aufnehmendes Team (optional)
-- transfer_type   → 'permanent' | 'loan' | 'internal' | 'return_from_loan'
-- transfer_date   → Datum des Wechsels
-- season_id       → In welcher Saison
-- notes           → Interne Notizen
-- created_at
```

---

## Beziehungsübersicht

```
auth.users
  └── profiles (1:1)
  └── club_memberships (1:n) → clubs
       └── club_member_roles (1:n) → roles
  └── team_memberships (1:n) → teams → clubs
       └── team_member_roles (1:n) → roles
  └── player_guardians (1:n) → players

clubs
  └── seasons (1:n)
  └── club_memberships (1:n)
  └── teams (1:n)
  └── players (1:n)
  └── invitations (1:n)

teams
  └── team_memberships (1:n)
  └── player_team_assignments (1:n) → players
  └── events (1:n)

players
  └── player_team_assignments (1:n) → teams
  └── player_guardians (1:n) → auth.users
  └── event_attendance (1:n, via player_id)

events
  └── event_attendance (1:n, via player_id)
  └── matches (1:1, optional)
       └── match_reports (1:n)
```

---

## Index-Strategie

Alle Indexes müssen in der ersten Migration angelegt werden, da RLS-Policies sie voraussetzen.

```sql
-- club_memberships: User-Lookup für RLS
CREATE INDEX idx_club_memberships_user_club ON club_memberships(user_id, club_id);
CREATE INDEX idx_club_memberships_club ON club_memberships(club_id);

-- club_member_roles: Rollen-Lookup für RLS-Hilfsfunktionen
CREATE INDEX idx_club_member_roles_membership ON club_member_roles(membership_id, role_id);

-- team_memberships: User-Lookup für RLS
CREATE INDEX idx_team_memberships_user_team ON team_memberships(user_id, team_id);
CREATE INDEX idx_team_memberships_team ON team_memberships(team_id);

-- team_member_roles: Rollen-Lookup für RLS-Hilfsfunktionen
CREATE INDEX idx_team_member_roles_membership ON team_member_roles(team_membership_id, role_id);

-- teams: Vereins- und Saison-Lookup
CREATE INDEX idx_teams_club ON teams(club_id);
CREATE INDEX idx_teams_club_season ON teams(club_id, season_id);

-- players: Vereins-Lookup
CREATE INDEX idx_players_club ON players(club_id);
CREATE INDEX idx_players_user ON players(user_id) WHERE user_id IS NOT NULL;

-- player_team_assignments: Team-Spieler-Lookup
CREATE INDEX idx_pta_team_season ON player_team_assignments(team_id, season_id);
CREATE INDEX idx_pta_player ON player_team_assignments(player_id);

-- player_guardians: Guardian-Lookup für RLS
CREATE INDEX idx_player_guardians_player ON player_guardians(player_id);
CREATE INDEX idx_player_guardians_guardian ON player_guardians(guardian_user_id);

-- events: Kalender-Queries
CREATE INDEX idx_events_team_starts ON events(team_id, starts_at);
CREATE INDEX idx_events_club_starts ON events(club_id, starts_at);
CREATE INDEX idx_events_season ON events(season_id);

-- event_attendance: Anwesenheits-Lookup
CREATE INDEX idx_event_attendance_event_player ON event_attendance(event_id, player_id);
CREATE INDEX idx_event_attendance_player ON event_attendance(player_id);

-- invitations: Token-Lookup (Partial Index für aktive Einladungen)
CREATE UNIQUE INDEX idx_invitations_token_active
  ON invitations(token)
  WHERE used_at IS NULL AND revoked_at IS NULL;

-- seasons: Aktive Saison pro Verein
CREATE UNIQUE INDEX idx_seasons_club_active
  ON seasons(club_id)
  WHERE is_active = true;
```

---

## Sichere Club-Erstellung via SECURITY DEFINER

Der erste `club_admin` darf **nie** durch einen direkten INSERT auf `club_memberships` entstehen. Stattdessen eine atomare Funktion:

```sql
CREATE OR REPLACE FUNCTION create_club(p_name text, p_slug text)
RETURNS clubs LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_club clubs;
  v_membership_id uuid;
  v_role_id uuid;
BEGIN
  -- Verein anlegen
  INSERT INTO clubs (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO v_club;

  -- Mitgliedschaft anlegen
  INSERT INTO club_memberships (club_id, user_id)
  VALUES (v_club.id, auth.uid())
  RETURNING id INTO v_membership_id;

  -- club_admin-Rolle ermitteln
  SELECT id INTO v_role_id FROM roles WHERE name = 'club_admin';

  -- Rolle zuweisen
  INSERT INTO club_member_roles (membership_id, role_id, granted_by)
  VALUES (v_membership_id, v_role_id, auth.uid());

  -- Audit-Log
  INSERT INTO audit_logs (actor_id, club_id, action, resource_type, resource_id)
  VALUES (auth.uid(), v_club.id, 'club.created', 'clubs', v_club.id);

  RETURN v_club;
END;
$$;
```

---

## Migrations-Reihenfolge

1. `roles` (Seed-Daten, `is_mvp`-Flag)
2. `clubs`
3. `seasons`
4. `profiles` (+ Trigger auf `auth.users`)
5. `club_memberships`
6. `club_member_roles`
7. `teams`
8. `team_memberships`
9. `team_member_roles`
10. `players`
11. `player_team_assignments`
12. `player_guardians`
13. `invitations`
14. `events` (+ `events_set_club_id`-Trigger)
15. `event_attendance` (+ `create_attendance_for_event`-Trigger)
16. `matches`
17. `match_reports`
18. `audit_logs`
19. Alle Indexes
20. RLS-Hilfsfunktionen (`has_club_role`, `has_team_role`, `is_guardian_of`)
21. RLS-Policies

---

## Offene Entscheidungen

| Frage | Empfehlung | Priorität |
|---|---|---|
| `notifications`-Tabelle oder nur Supabase Realtime? | Eigene Tabelle in Phase 2 | Phase 2 |
| Finanzen in gleichem Schema? | Separates Schema `finance.*` | Phase 3 |
| `departments` als eigene Tabelle für Bereichsrollen? | Ja, in Phase 2 | Phase 2 |
| pg_cron für Invitation-Cleanup? | Ja, als Supabase Edge Function oder pg_cron | Vor Launch |
| Column-Level Security für `tactics_notes`? | Ja, via RLS-Policy auf Column | MVP 1 |
