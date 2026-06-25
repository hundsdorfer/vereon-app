# Datenmodell — Vereon

**Stand:** 2026-06-25
**Strategie:** Supabase Postgres, Row Level Security auf allen Tabellen, Multi-Tenant via `club_id`

---

## Grundprinzipien

- Jeder Verein (`clubs`) ist ein isolierter Tenant
- Ein User (`auth.users`) kann Mitglied in mehreren Vereinen sein — mit unterschiedlichen Rollen
- Rollen werden in `club_memberships` und `team_memberships` gespeichert — nicht in Supabase Auth-Metadaten
- Alle Tabellen haben RLS aktiviert. Policies basieren auf `auth.uid()` + Mitgliedschaft
- `id`-Felder sind immer `uuid` mit `gen_random_uuid()` als Default
- Zeitstempel: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`

---

## Tabellen

---

### `profiles`
Erweiterung von `auth.users`. 1:1-Beziehung. Wird automatisch bei Registrierung angelegt (Trigger).

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

**Zweck:** Öffentliche Profildaten eines Users. Kein Auth-State hier.
**RLS:** User sieht nur eigenes Profil. Admins sehen Profile ihrer Vereinsmitglieder.

---

### `clubs`
Ein Verein = ein Tenant.

```sql
clubs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,           -- URL-sicherer Name, z.B. "fc-musterstadt"
  logo_url      text,
  city          text,
  country       text DEFAULT 'DE',
  founded_year  integer,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)
```

**Zweck:** Stammdaten eines Vereins.
**RLS:** Jeder Mitglieder des Vereins kann ihn lesen. Nur `club_admin` / `board_member` können schreiben.

---

### `club_memberships`
Verknüpft einen User mit einem Verein und weist ihm eine vereinsweite Rolle zu.

```sql
club_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL,                   -- Werte aus: club_roles
  status      text NOT NULL DEFAULT 'active',  -- 'active' | 'suspended' | 'left'
  joined_at   timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
)
```

**Zweck:** Wer ist in welchem Verein mit welcher Rolle?
**RLS:** Eigener Eintrag immer lesbar. Admins sehen und verwalten alle Einträge ihres Vereins.

---

### `teams`
Ein Team gehört zu genau einem Verein.

```sql
teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name            text NOT NULL,               -- z.B. "U17 Junioren"
  age_group       text,                        -- z.B. "U17", "Herren", "Damen"
  season          text,                        -- z.B. "2025/2026"
  description     text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**Zweck:** Organisiert Spieler und Trainer in Gruppen innerhalb eines Vereins.
**RLS:** Vereinsmitglieder können Teams ihres Vereins lesen. Admins und Coaches verwalten.

---

### `team_memberships`
Verknüpft einen User mit einem Team und definiert seine Rolle innerhalb des Teams.

```sql
team_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL,                   -- 'head_coach' | 'assistant_coach' | 'player' | 'guardian'
  position    text,                            -- Spielposition, optional
  jersey_nr   integer,                         -- Trikotnummer, optional
  joined_at   timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
)
```

**Zweck:** Feingranulare Zuordnung auf Teamebene. Ein Trainer kann mehrere Teams betreuen.
**RLS:** Eigene Einträge immer lesbar. Teamkollegen sehen sich gegenseitig. Coaches verwalten.

---

### `players`
Erweiterte Spielerdaten. Ergänzt `profiles` um vereins-/sportspezifische Informationen.

```sql
players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- null = noch kein Account
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  full_name       text NOT NULL,               -- Redundant zu profiles, aber für Spieler ohne Account
  date_of_birth   date,
  nationality     text,
  dominant_foot   text,                        -- 'left' | 'right' | 'both'
  notes           text,                        -- Interne Notizen des Trainers
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**Zweck:** Spielerdaten unabhängig davon, ob der Spieler schon einen Vereon-Account hat.
**RLS:** Coaches und Admins des Vereins lesen/schreiben. Spieler sehen nur eigene Daten.

---

### `guardians`
Verknüpft Erziehungsberechtigte mit Spielern (Jugendbereich).

```sql
guardians (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- Elternteil
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  relation    text,                            -- 'mother' | 'father' | 'guardian'
  is_primary  boolean DEFAULT false,           -- Hauptkontakt
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
)
```

**Zweck:** Eltern können Zu-/Absagen für ihre Kinder abgeben und Informationen empfangen.
**RLS:** Erziehungsberechtigte sehen nur ihre eigenen Verknüpfungen und die Daten ihrer Kinder.

---

### `events`
Kalendereinträge: Training, Spiele, Meetings, sonstige Termine.

```sql
events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  title           text NOT NULL,
  type            text NOT NULL,               -- 'training' | 'match' | 'meeting' | 'other'
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  location        text,
  description     text,
  is_cancelled    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**Zweck:** Zentrale Kalenderstruktur für alle Teamtermine.
**RLS:** Alle Teammitglieder lesen. Coaches erstellen/bearbeiten.

---

### `event_attendance`
Zu-/Absagen und tatsächliche Anwesenheit pro Termin und Spieler.

```sql
event_attendance (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  responded_by    uuid REFERENCES auth.users(id),   -- Wer hat geantwortet (Spieler oder Elternteil)
  rsvp_status     text,                              -- 'attending' | 'declined' | 'maybe' | null (kein Response)
  rsvp_note       text,                              -- Optionale Begründung bei Absage
  attended        boolean,                           -- Tatsächliche Anwesenheit (nach dem Termin)
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
)
```

**Zweck:** Vor dem Termin: RSVP. Nach dem Termin: Anwesenheitsbestätigung durch Trainer.
**RLS:** Spieler sehen/setzen nur eigene RSVP. Coaches sehen alle, setzen `attended`.

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
  competition     text,                        -- z.B. "Kreisliga A"
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**Zweck:** Ergebnis und Spielkontext. Trennt Spieldaten sauber von Kalenderdaten.
**RLS:** Teammitglieder lesen. Coaches schreiben.

---

### `match_reports`
Spielbericht nach einem Spiel, geschrieben vom Trainer.

```sql
match_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES auth.users(id),
  summary         text,                        -- Allgemeine Zusammenfassung
  tactics_notes   text,                        -- Taktische Notizen (intern)
  is_published    boolean DEFAULT false,        -- Für Spieler sichtbar?
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

**Zweck:** Strukturiertes Feedback nach Spielen. Interne und öffentliche Notizen getrennt.
**RLS:** Coaches schreiben. Spieler lesen nur wenn `is_published = true`.

---

### `invitations`
Einladungslinks/-codes für neue Mitglieder.

```sql
invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  team_id         uuid REFERENCES teams(id) ON DELETE SET NULL,  -- optional: direkt in Team einladen
  invited_by      uuid NOT NULL REFERENCES auth.users(id),
  email           text,                                           -- optional: direkte E-Mail-Einladung
  token           text UNIQUE NOT NULL,                           -- sicherer zufälliger Code
  role            text NOT NULL,                                  -- welche Rolle bekommt der Eingeladene?
  status          text NOT NULL DEFAULT 'pending',                -- 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at      timestamptz NOT NULL,
  accepted_at     timestamptz,
  created_at      timestamptz DEFAULT now()
)
```

**Zweck:** Kontrollierter Onboarding-Prozess ohne offene Registrierung.
**RLS:** Nur Admins und Coaches können Einladungen erstellen/lesen.

---

### `roles`
Definiert alle bekannten Rollen im System. Dient als Referenztabelle / Enum-Ersatz.

```sql
roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,            -- z.B. 'club_admin', 'head_coach'
  scope       text NOT NULL,                   -- 'club' | 'team' | 'system'
  description text,
  created_at  timestamptz DEFAULT now()
)
```

**Zweck:** Zentrale Rollendefinition. Wird initial per Migration befüllt (Seed).
**RLS:** Für alle authentifizierten User lesbar. Nur `super_admin` schreibt.

---

### `permissions`
Feingranulare Berechtigungen pro Rolle. Für spätere Erweiterbarkeit.

```sql
permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name   text NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  resource    text NOT NULL,                   -- z.B. 'events', 'match_reports'
  action      text NOT NULL,                   -- 'create' | 'read' | 'update' | 'delete'
  created_at  timestamptz DEFAULT now(),
  UNIQUE(role_name, resource, action)
)
```

**Zweck:** Ermöglicht später dynamische Rechteverwaltung ohne Code-Änderungen.
**RLS:** Lesbar für alle. Nur `super_admin` schreibt.

---

### `audit_logs`
Unveränderliches Log aller kritischen Aktionen im System.

```sql
audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  club_id         uuid REFERENCES clubs(id) ON DELETE SET NULL,
  action          text NOT NULL,               -- z.B. 'membership.created', 'event.deleted'
  resource_type   text NOT NULL,               -- z.B. 'club_memberships', 'events'
  resource_id     uuid,
  payload         jsonb,                        -- Vorher/Nachher-Snapshot (optional)
  created_at      timestamptz DEFAULT now()
)
```

**Zweck:** Nachvollziehbarkeit für Admins. Einträge werden niemals gelöscht.
**RLS:** Nur `club_admin` und `super_admin` lesen. Kein User schreibt direkt — nur via Server-Funktionen (SECURITY DEFINER).

---

## Beziehungsübersicht

```
auth.users
  └── profiles (1:1)
  └── club_memberships (1:n) → clubs
  └── team_memberships (1:n) → teams → clubs
  └── players (1:1, optional — user_id kann null sein)
  └── guardians (n:m) → players

clubs
  └── teams (1:n)
  └── club_memberships (1:n)
  └── players (1:n)
  └── invitations (1:n)

teams
  └── team_memberships (1:n)
  └── events (1:n)

events
  └── event_attendance (1:n)
  └── matches (1:1, optional)
      └── match_reports (1:n)
```

---

## Migrations-Reihenfolge

1. `roles` + `permissions` (Seed-Daten)
2. `profiles` (Trigger auf `auth.users`)
3. `clubs`
4. `club_memberships`
5. `teams`
6. `team_memberships`
7. `players`
8. `guardians`
9. `events`
10. `event_attendance`
11. `matches`
12. `match_reports`
13. `invitations`
14. `audit_logs`

---

## Offene Entscheidungen

- Sollen `notifications` eine eigene Tabelle bekommen oder reicht Supabase Realtime?
- Sollen Finanzen (`transactions`, `budgets`) in Phase 2 in dasselbe Schema?
- Brauchen wir `seasons` als eigene Tabelle, oder reicht `season text` in `teams`?
