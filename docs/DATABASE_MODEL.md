# Datenmodell — Vereon

> **Dokumentationshinweis — Stand 2026-07-06:**
> Diese Datei enthält laut `docs/DOCS_INVENTORY.md` veraltete oder zu prüfende Aussagen. Für den tatsächlichen Code-Zustand haben aktuell `docs/ARCHITECTURE.md` und `docs/STATUS.md` Vorrang. Diese Datei darf bis zur Überarbeitung nicht allein als Umsetzungsgrundlage verwendet werden.

---

**Stand:** 2026-06-25 (überarbeitet: eigenständige Teams, Vereinsverifikation, team_owner, DSGVO-Anpassungen)
**Strategie:** Supabase Postgres, Row Level Security auf allen Tabellen, Multi-Tenant via `club_id` (optional), Mehrfachrollen via separate Rollentabellen

---

## Grundprinzipien

- **Teams können ohne Verein existieren** — eigenständige Teams haben `club_id = NULL`
- Ein Verein (`clubs`) ist ein verifizierter Mandant. Teams können später einem Verein zugeordnet werden.
- Ein User kann Mitglied in mehreren Vereinen und mehreren Teams sein — mit unterschiedlichen Rollen
- **Mehrfachrollen sind explizit erlaubt** — Mitgliedschaft und Rollen sind strikt getrennt
- Alle Tabellen haben RLS aktiviert. Policies basieren auf `auth.uid()` + Rollentabellen
- `id`-Felder sind immer `uuid` mit `gen_random_uuid()` als Default
- Zeitstempel: `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at` nur wo nötig
- Guardian-Rechte werden über `player_guardians` abgeleitet, nicht über `team_member_roles`
- `event_attendance` hängt primär an `player_id`, nicht an `user_id`
- Kein Hard-Delete auf zentralen Entitäten im MVP — Soft-Delete via `status`/`is_active`

---

## Phasenübersicht

| Phase | Tabellen |
|---|---|
| **Migration 001** | `roles`, `permissions`, `role_permissions`, `profiles`, `clubs`, `seasons`, `club_memberships`, `club_member_roles`, `teams`, `team_memberships`, `team_member_roles` |
| **MVP 0A** (nach 001) | `team_invitation_links`, `team_join_requests`, `players` (minimal), `events`, `event_attendance` |
| **MVP 0B** (nach 0A) | `invitations` (für Vereinseinladungen) |
| **MVP 1** | `player_guardians`, `player_team_assignments`, `matches`, `match_reports`, `audit_logs` |
| **MVP 2** | `team_affiliation_requests` |
| **Phase 2** | `player_transfer_requests`, Departments, Notifications |
| **Phase 3+** | `official_club_registry`, `plans`, `subscriptions`, `billing_customers`, `feature_flags` |

---

## Tabellen — Migration 001

---

### `roles`
Zentrale Rollendefinition. Seed-Tabelle, wird in der Migration befüllt.

```sql
roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,   -- maschinenlesbar: 'club_admin', 'head_coach'
  name_de     text        NOT NULL,          -- Anzeigename Deutsch: 'Vereinsadministrator/in'
  description text,
  scope       text        NOT NULL CHECK (scope IN ('system', 'club', 'team')),
  is_system   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
)
```

**Wichtig:** `key` wird nie geändert — RLS-Funktionen referenzieren diesen Wert direkt.
**RLS:** Für alle authentifizierten User lesbar. Nur `super_admin` (via Plattform) schreibt.

---

### `permissions`
Granulare Berechtigungsbasis. Struktur vorhanden, Einträge folgen in Phase 2.

```sql
permissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,
  description text,
  scope       text        NOT NULL CHECK (scope IN ('system', 'club', 'team')),
  created_at  timestamptz NOT NULL DEFAULT now()
)
```

---

### `role_permissions`
Zuordnung Rollen → Berechtigungen.

```sql
role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
)
```

---

### `profiles`
Erweiterung von `auth.users`. 1:1-Beziehung. Wird automatisch bei Registrierung via Trigger angelegt.

```sql
profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,         -- Denormalisiert für Lookups, Sync via Trigger
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
)
```

**RLS:** User sieht und bearbeitet nur eigenes Profil. Vereinsmitglieder können Profile anderer aktiver Mitglieder desselben Vereins lesen.
**Hinweis:** `email` wird bei Registrierung gesetzt. Änderungen an `auth.users.email` werden in Phase 2 synchronisiert.

---

### `clubs`
Verifizierter Mandant / Verein. Ausschließlich via `create_club()` anlegen.

```sql
clubs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  slug                 text        UNIQUE NOT NULL,
  country              text        NOT NULL DEFAULT 'AT',
  city                 text,
  logo_url             text,
  created_by           uuid        REFERENCES auth.users(id),
  verification_status  text        NOT NULL DEFAULT 'pending_verification'
    CHECK (verification_status IN ('draft', 'pending_verification', 'verified', 'rejected', 'suspended')),
  verified_at          timestamptz,
  verified_by          uuid        REFERENCES auth.users(id),  -- Plattform-Admin
  official_registry_id text,                                    -- Vorbereitung ÖFB/Landesverband
  claimed_by           uuid        REFERENCES auth.users(id),
  claim_submitted_at   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clubs_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$')
)
```

**Verifikationsprozess:**
- `create_club()` → `pending_verification` (sofort nach Erstellung)
- Plattform-Admin prüft und setzt `verified` (MVP: manuell via Supabase Studio)
- Verein kann in `pending_verification` bereits intern genutzt werden
- `verified` ist erst für öffentliche Sichtbarkeit und Team-Affiliation-Flow relevant

**RLS:** Vereinsmitglieder lesen. Nur `club_admin` schreibt. Kein direktes INSERT — ausschließlich via `create_club()`.
**Kein Hard-Delete:** Archivierung via `verification_status = 'suspended'`.

---

### `seasons`
Saison eines Vereins. Nur bei club-managed Teams relevant.

```sql
seasons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name        text        NOT NULL,     -- z.B. "2026/27"
  starts_at   date,                     -- optional: Saison ohne festes Datum möglich
  ends_at     date,
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, name)
)
```

**Partial Unique Index:** `CREATE UNIQUE INDEX idx_seasons_club_active ON seasons(club_id) WHERE is_active = true;`
**RLS:** Vereinsmitglieder lesen. `club_admin` schreibt.

---

### `club_memberships`
Grundmitgliedschaft eines Users in einem Verein. Enthält **keine** Rolle.

```sql
club_memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        NOT NULL REFERENCES clubs(id)      ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive', 'left')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
)
```

**RLS:** Eigener Eintrag lesbar. `club_admin` sieht und verwaltet alle Einträge des Vereins.

---

### `club_member_roles`
Beliebig viele vereinsweite Rollen pro Mitglied. Nur `scope = 'club'` erlaubt (via Trigger).

```sql
club_member_roles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_membership_id uuid        NOT NULL REFERENCES club_memberships(id) ON DELETE CASCADE,
  role_id            uuid        NOT NULL REFERENCES roles(id)            ON DELETE CASCADE,
  assigned_by        uuid        REFERENCES auth.users(id),
  assigned_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_membership_id, role_id)
)
```

**Hinweis Phase 2:** `scope`, `scope_ref_id` (für Departments/AgeGroups), `expires_at` werden in Phase 2 ergänzt.
**RLS:** `club_admin` schreibt und löscht. Eigene Rollen lesbar.

---

### `teams`
Ein Team gehört optional einem Verein. Eigenständige Teams haben `club_id = NULL`.

```sql
teams (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        uuid        REFERENCES clubs(id) ON DELETE SET NULL,  -- nullable!
  season_id      uuid        REFERENCES seasons(id) ON DELETE SET NULL,
  created_by     uuid        NOT NULL REFERENCES auth.users(id),
  name           text        NOT NULL,
  age_group      text,
  gender         text,
  team_type      text,
  ownership_type text        NOT NULL DEFAULT 'independent'
    CHECK (ownership_type IN ('independent', 'club_managed')),
  status         text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_affiliation', 'club_affiliated', 'archived')),
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, season_id, name),
  CONSTRAINT teams_ownership_club_consistent CHECK (
    ownership_type = 'independent'
    OR (ownership_type = 'club_managed' AND club_id IS NOT NULL)
  )
)
```

**ownership_type:**
- `independent` — Team ohne Vereinszugehörigkeit. `club_id` ist NULL. Ersteller ist `team_owner`.
- `club_managed` — Team gehört einem Verein. `club_id` ist NOT NULL. `club_admin` verwaltet.

**status:**
- `active` — normaler Betrieb
- `pending_affiliation` — Team hat Zuordnungsanfrage gestellt
- `club_affiliated` — Team wurde einem Verein zugeordnet (= club_managed + club_id gesetzt)
- `archived` — Archiviert, nicht aktiv

**UNIQUE-Verhalten mit nullable club_id:** PostgreSQL behandelt NULL-Werte in UNIQUE als distinct. Zwei eigenständige Teams dürfen denselben Namen haben (gewünschtes Verhalten). Innerhalb eines Vereins sind Namen pro Saison eindeutig.

**Kein Hard-Delete:** Deaktivierung via `is_active = false` oder `status = 'archived'`.
**RLS:** Teammitglieder sehen ihr Team. Vereinsmitglieder sehen alle Teams ihres Vereins.

---

### `team_memberships`
Grundzugehörigkeit eines Users zu einem Team. Enthält **keine** Rolle.

```sql
team_memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES teams(id)      ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive', 'left')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
)
```

**MVP-Vereinfachung:** Kein `season_id`. Bei Saisonwechsel: `status = 'left'` setzen, neuen Eintrag anlegen. Phase 2 erweitert auf `UNIQUE(team_id, user_id, season_id)`.
**RLS:** Eigener Eintrag lesbar. Teamkollegen sehen sich gegenseitig. `team_owner` und `head_coach` verwalten.

---

### `team_member_roles`
Beliebig viele teamspezifische Rollen pro Teammitglied. Nur `scope = 'team'` erlaubt (via Trigger).

```sql
team_member_roles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid        NOT NULL REFERENCES team_memberships(id) ON DELETE CASCADE,
  role_id            uuid        NOT NULL REFERENCES roles(id)            ON DELETE CASCADE,
  assigned_by        uuid        REFERENCES auth.users(id),
  assigned_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_membership_id, role_id)
)
```

**Hinweis Phase 2:** `position` (Spielposition) und `jersey_nr` (Trikotnummer) folgen in Phase 2.
**RLS:** `team_owner`, `head_coach` und `club_admin` schreiben. Teammitglieder lesen.

---

## Tabellen — MVP 0A (nach Migration 001)

---

### `team_invitation_links`
Wiederverwendbare Einladungslinks für eigenständige Teams. Kein Verein nötig.

```sql
team_invitation_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES auth.users(id),
  token       text        UNIQUE NOT NULL,  -- 32 Byte kryptografisch zufällig
  max_uses    integer     DEFAULT 50,       -- Gruppeneinladung
  use_count   integer     NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,         -- typisch: 30 Tage
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
)
```

**Unterschied zu `invitations`:** `team_invitation_links` sind für Self-Service-Eltern/Kinder-Beitritt ohne vorherige Genehmigung. `invitations` (MVP 0B) sind für gezielte Einzel-Einladungen mit Rollenvergabe.
**Partial Unique Index:** `ON team_invitation_links(token) WHERE revoked_at IS NULL`

---

### `team_join_requests`
Beitrittsanfragen aus dem Self-Service-Flow. Trainer prüft und nimmt an oder lehnt ab.

```sql
team_join_requests (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id                uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invitation_link_id     uuid        REFERENCES team_invitation_links(id) ON DELETE SET NULL,
  guardian_user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_first_name      text        NOT NULL,
  player_last_name       text        NOT NULL,
  player_birth_year      integer,
  player_position        text,
  player_jersey_nr       integer,
  player_id              uuid        REFERENCES players(id) ON DELETE SET NULL,  -- gesetzt nach Akzeptanz
  status                 text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewed_by            uuid        REFERENCES auth.users(id),
  reviewed_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
)
```

**Wichtig:**
- Kindsdaten sind ERST nach Akzeptanz (`status = 'approved'`) für das Team sichtbar
- Bei `rejected`: Kindsdaten werden nicht persistent gespeichert (nur in diesem Request-Datensatz)
- `player_id` wird erst nach Akzeptanz gesetzt (Server Action legt `players`-Eintrag an)
- DSGVO: Abgelehnte Anfragen sollten nach definiertem Zeitraum gelöscht werden

**RLS:** Guardian sieht eigene Anfragen. `team_owner` und `head_coach` sehen alle Anfragen ihres Teams.

---

### `players`
Spielerdatensatz. Existiert unabhängig vom Auth-Account. DSGVO-minimal.

```sql
players (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        REFERENCES clubs(id) ON DELETE SET NULL,     -- nullable für independent teams
  team_id     uuid        REFERENCES teams(id) ON DELETE SET NULL,     -- primäre Teamzugehörigkeit MVP 0A
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL, -- null = kein Account
  first_name  text        NOT NULL,
  last_name   text        NOT NULL,
  birth_year  integer,               -- Geburtsjahr (nicht Datum — weniger sensibel, reicht für U-Klassen)
  position    text,
  jersey_nr   integer,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
)
```

**DSGVO-Entscheidungen:**
- `birth_year` statt `date_of_birth` — reicht für Altersklassenzuordnung, weniger sensibel. Aktueller MVP-Stand, technisch umgesetzt seit Migration `20260702000000_players_birth_year_only`: Der Join-Flow befüllt `players.date_of_birth` nicht mehr.
- Kein `nationality`, keine `notes`, keine `dominant_foot` im MVP — Datensparsamkeit
- `full_name` → aufgeteilt in `first_name` / `last_name` für bessere Nutzbarkeit
- Fotos: kein `avatar_url` im MVP für Minderjährige

**Hinweis zu `players.date_of_birth`:** Die Spalte wurde in Migration `20260629000000_add_join_flow_improvements` ergänzt (nullable) und ist technisch weiterhin vorhanden, wird aber seit `20260702000000_players_birth_year_only` durch den Join-Flow nicht mehr befüllt. Ggf. vorhandene Altdaten aus früheren lokalen Testläufen wurden nicht rückwirkend bereinigt.

**Was nicht gespeichert wird (MVP):** Gesundheitsdaten, medizinische Infos, vollständige Privatadresse, Fotos, detaillierte Leistungsnotizen.

**Phase 2 (falls fachlich nötig):** erneute Prüfung von `date_of_birth` (aktuell bewusst nicht genutzt), `nationality`, Spielerhistorie.
**RLS:** Trainer und Admins lesen/schreiben. Spieler (via `user_id`) sehen nur eigene Daten.

---

### `events`
Kalendereinträge für ein Team.

```sql
events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  club_id     uuid        REFERENCES clubs(id),    -- nullable: aus teams.club_id via Trigger, NULL bei independent teams
  created_by  uuid        NOT NULL REFERENCES auth.users(id),
  title       text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('training', 'match', 'meeting', 'other')),
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz,
  location    text,
  description text,
  is_cancelled boolean    NOT NULL DEFAULT false,
  season_id   uuid        REFERENCES seasons(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
)
```

**events.club_id Integrität:** Wird via BEFORE-Trigger aus `teams.club_id` abgeleitet. Bei independent Teams (teams.club_id = NULL) ist events.club_id ebenfalls NULL. Frontend setzt `club_id` nie manuell.

**RLS:** Alle Teammitglieder lesen. `team_owner`, `head_coach`, `assistant_coach` erstellen/bearbeiten.

---

### `event_attendance`
RSVP und tatsächliche Anwesenheit. Primäranker ist `player_id`.

```sql
event_attendance (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             uuid        NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  player_id            uuid        NOT NULL REFERENCES players(id)  ON DELETE CASCADE,
  user_id              uuid        REFERENCES auth.users(id)        ON DELETE SET NULL,
  responded_by_user_id uuid        REFERENCES auth.users(id),
  rsvp_status          text        CHECK (rsvp_status IN ('attending', 'declined', 'maybe')),
  rsvp_note            text,
  responded_at         timestamptz,
  attended             boolean,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
)
```

**Automatische Befüllung via Trigger:** Beim Erstellen eines Events werden Attendance-Zeilen für alle aktiven Spieler des Teams angelegt. Status bleibt NULL bis Spieler/Guardian antwortet.
**RLS:** Spieler sehen/setzen eigene RSVP. Guardians setzen RSVP für ihr Kind. Trainer sehen alle und setzen `attended`.

---

## Tabellen — MVP 0B (Vereins-Einladungen)

---

### `invitations`
Gezielte Einzel-Einladungen mit Rollenvergabe (für Vereins-/Team-Einladungen durch Admin/Trainer).

```sql
invitations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid        REFERENCES clubs(id) ON DELETE CASCADE,
  team_id         uuid        REFERENCES teams(id) ON DELETE SET NULL,
  invited_by      uuid        NOT NULL REFERENCES auth.users(id),
  email           text,
  token           text        UNIQUE NOT NULL,
  invitation_type text        NOT NULL CHECK (invitation_type IN ('club_member', 'team_member', 'player_guardian')),
  target_role_key text        NOT NULL REFERENCES roles(key),  -- Referenz auf roles.key
  status          text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  max_uses        integer     NOT NULL DEFAULT 1,
  use_count       integer     NOT NULL DEFAULT 0,
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
)
```

**Token-Sicherheit:** Mindestens 32 Bytes kryptografisch zufällig: `encode(gen_random_bytes(32), 'hex')`
**Partial Unique Index:** `ON invitations(token) WHERE used_at IS NULL AND revoked_at IS NULL`

---

## Tabellen — MVP 1

---

### `player_guardians`
Erziehungsberechtigte, verknüpft mit einem Spieler. Rechte werden über diese Tabelle abgeleitet.

```sql
player_guardians (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id            uuid        NOT NULL REFERENCES players(id)      ON DELETE CASCADE,
  guardian_user_id     uuid        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  relationship         text,       -- 'mother' | 'father' | 'guardian' | 'other'
  is_primary_contact   boolean     NOT NULL DEFAULT false,
  can_rsvp             boolean     NOT NULL DEFAULT true,
  can_view_schedule    boolean     NOT NULL DEFAULT true,
  can_receive_messages boolean     NOT NULL DEFAULT true,
  verified_at          timestamptz,  -- null = Guardian-Rechte noch nicht aktiv
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, guardian_user_id)
)
```

**Design-Entscheidung:** Guardian-Rechte hängen am Spieler, nicht am Team. Teamwechsel bricht Guardian-Rechte nicht. `verified_at` muss gesetzt sein, bevor Rechte aktiv werden — nur via Einladungsflow.

---

### `player_team_assignments`
Ordnet Spieler einem Team für eine Saison zu. Unabhängig von Auth-Accounts.

```sql
player_team_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id     uuid        NOT NULL REFERENCES teams(id)   ON DELETE CASCADE,
  season_id   uuid        REFERENCES seasons(id) ON DELETE SET NULL,
  position    text,
  jersey_nr   integer,
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'loaned_out', 'left')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  left_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, team_id, season_id)
)
```

**Zweck:** Trennt "wer hat einen Account" von "wer spielt in welchem Team". Anwesenheitserfassung funktioniert auch ohne Account.

---

### `matches`

```sql
matches (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid    NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  opponent     text    NOT NULL,
  is_home_game boolean NOT NULL DEFAULT true,
  score_home   integer,
  score_away   integer,
  competition  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
)
```

---

### `match_reports`

```sql
match_reports (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     uuid    NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  author_id    uuid    NOT NULL REFERENCES auth.users(id),
  summary      text,           -- Sichtbar für Spieler wenn veröffentlicht
  tactics_notes text,          -- Nur Trainer — nie für Spieler sichtbar (RLS)
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
)
```

**DSGVO:** `tactics_notes` ist via RLS-Policy oder Column-Level Security nur für Trainer zugänglich.

---

### `audit_logs`

```sql
audit_logs (
  id            uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid   REFERENCES auth.users(id) ON DELETE SET NULL,
  club_id       uuid   REFERENCES clubs(id)      ON DELETE SET NULL,
  team_id       uuid   REFERENCES teams(id)      ON DELETE SET NULL,
  action        text   NOT NULL,   -- z.B. 'membership.created', 'invitation.revoked'
  resource_type text   NOT NULL,
  resource_id   uuid,
  payload       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
)
```

**Append-only:** Kein User darf direkt schreiben oder löschen — nur via SECURITY DEFINER Funktionen.

---

## Zukünftige Tabellen (dokumentiert, nicht in Migration 001)

### `team_affiliation_requests` — MVP 2
```
id, team_id, club_id, requested_by (club_admin),
approved_by_team_owner, approved_by_club_admin, reviewed_by_platform_admin,
status ('pending' | 'approved_by_team' | 'approved' | 'rejected'),
created_at, resolved_at
```

### `official_club_registry` — Phase 3+
```
id, source ('oefb' | 'stmk' | 'noe' | ...),
external_id, name, city, region, association, country,
status, last_synced_at
```
Verknüpfung: `clubs.official_registry_id` zeigt auf `external_id`.

### `player_transfer_requests` — Phase 2
Vereon-interne Vereinswechsel (keine offiziellen ÖFB-Transfers).
```
player_id, from_club_id, to_club_id, status,
requested_by, approved_by_old_club, approved_by_new_club,
created_at, resolved_at
```

### Billing — Phase 3
```
plans, subscriptions, subscription_items,
billing_customers, feature_flags, usage_limits
```
Zahlungsanbieter: Stripe (empfohlen).

---

## Beziehungsübersicht

```
auth.users
  └── profiles (1:1, via Trigger)
  └── club_memberships (1:n) → clubs
       └── club_member_roles (1:n) → roles (scope='club')
  └── team_memberships (1:n) → teams
       └── team_member_roles (1:n) → roles (scope='team')
  └── player_guardians (1:n) → players (MVP 1)
  └── team_join_requests (1:n, als guardian) → teams (MVP 0A)

clubs
  └── seasons (1:n)
  └── club_memberships (1:n)
  └── teams (1:n, club_managed)
  └── players (1:n, via club_id) (MVP 0A)
  └── invitations (1:n) (MVP 0B)

teams (club_id nullable)
  └── team_memberships (1:n)
  └── team_invitation_links (1:n) (MVP 0A)
  └── team_join_requests (1:n) (MVP 0A)
  └── player_team_assignments (1:n) → players (MVP 1)
  └── events (1:n) (MVP 0A)

players
  └── player_team_assignments (1:n) → teams (MVP 1)
  └── player_guardians (1:n) → auth.users (MVP 1)
  └── event_attendance (1:n, via player_id) (MVP 0A)

events
  └── event_attendance (1:n) (MVP 0A)
  └── matches (1:1, optional) (MVP 1)
       └── match_reports (1:n) (MVP 1)
```

---

## Index-Strategie (Migration 001)

```sql
-- club_memberships (RLS-kritisch)
CREATE INDEX idx_club_memberships_user_club   ON club_memberships(user_id, club_id);
CREATE INDEX idx_club_memberships_club        ON club_memberships(club_id);

-- club_member_roles (RLS-kritisch)
CREATE INDEX idx_club_member_roles_membership ON club_member_roles(club_membership_id, role_id);

-- team_memberships (RLS-kritisch)
CREATE INDEX idx_team_memberships_user_team   ON team_memberships(user_id, team_id);
CREATE INDEX idx_team_memberships_team        ON team_memberships(team_id);

-- team_member_roles (RLS-kritisch)
CREATE INDEX idx_team_member_roles_membership ON team_member_roles(team_membership_id, role_id);

-- teams
CREATE INDEX idx_teams_club                   ON teams(club_id);
CREATE INDEX idx_teams_club_season            ON teams(club_id, season_id);
CREATE INDEX idx_teams_created_by             ON teams(created_by);  -- für team_owner Lookup

-- seasons
CREATE UNIQUE INDEX idx_seasons_club_active   ON seasons(club_id) WHERE is_active = true;
CREATE INDEX idx_seasons_club                 ON seasons(club_id, is_active);
```

---

## SECURITY DEFINER Funktionen (Migration 001)

### `create_club(club_name, club_slug, season_name DEFAULT NULL)`
Legt Verein, optionale Saison, Mitgliedschaft und `club_admin`-Rolle atomar an.
- `verification_status = 'pending_verification'` bei Erstellung
- Slug-Validierung (a-z, 0-9, Bindestriche, 3–63 Zeichen)

### `create_independent_team(team_name, age_group DEFAULT NULL, gender DEFAULT NULL, also_head_coach DEFAULT true)`
Legt eigenständiges Team (club_id = NULL) atomar an.
- `created_by = auth.uid()`
- `ownership_type = 'independent'`
- `team_membership` für Ersteller
- `team_owner`-Rolle für Ersteller
- Optional: `head_coach`-Rolle wenn `also_head_coach = true`

---

## Migrations-Reihenfolge

### Migration 001: `init_mvp0_core`
```
1.  Hilfsfunktion set_updated_at()
2.  roles (inkl. Seed-Daten mit team_owner)
3.  permissions
4.  role_permissions
5.  profiles
6.  clubs (mit verification_status)
7.  seasons (+ idx_seasons_club_active)
8.  club_memberships
9.  club_member_roles
10. teams (mit nullable club_id, ownership_type, status)
11. team_memberships
12. team_member_roles
13. Trigger: updated_at (profiles, clubs, teams)
14. Trigger: handle_new_user() auf auth.users
15. Trigger: validate_club_member_role_scope()
16. Trigger: validate_team_member_role_scope()
17. RLS aktivieren (alle 11 Tabellen)
18. RLS-Hilfsfunktionen (is_super_admin, is_club_member, has_club_role, is_team_member, has_team_role)
19. RLS-Policies
20. Indexes
21. create_club()
22. create_independent_team()
23. Seed-Daten: Rollen (22 Rollen inkl. team_owner)
```

### Spätere Migrationen (separate Dateien)
```
002: team_invitation_links, team_join_requests, players (minimal), events, event_attendance, Trigger
003: invitations (MVP 0B)
004: player_guardians, player_team_assignments, matches, match_reports, audit_logs (MVP 1)
005: team_affiliation_requests (MVP 2)
```

---

## Offene Entscheidungen

| Frage | Empfehlung | Priorität |
|---|---|---|
| `notifications`-Tabelle oder nur Realtime? | Eigene Tabelle in Phase 2 | Phase 2 |
| Finanzen in gleichem Schema? | Separates Schema `finance.*` | Phase 3 |
| `departments` als Tabelle für Bereichsrollen? | Ja, Phase 2 | Phase 2 |
| pg_cron für Invitation-Cleanup? | Ja, Edge Function oder pg_cron | Vor Launch |
| Column-Level Security für `tactics_notes`? | Ja, via RLS-Policy | MVP 1 |
| `players.club_id` nullable oder Pflicht? | Nullable (für independent teams) | Entschieden |
| `team_join_requests` in Migration 001 oder 002? | Migration 002 (MVP 0A Features) | MVP 0A |
| Welcher Zeitraum für Löschung abgelehnter join_requests? | 90 Tage (DSGVO) | Vor MVP 0A Launch |
