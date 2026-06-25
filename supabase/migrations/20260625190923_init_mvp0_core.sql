-- ============================================================
-- Vereon — Migration 001: init_mvp0_core
-- Erstellt: 2026-06-25
--
-- Enthält:
--   Tabellen:   roles, permissions, role_permissions, profiles,
--               clubs, seasons, club_memberships, club_member_roles,
--               teams, team_memberships, team_member_roles
--   Funktionen: set_updated_at, handle_new_user,
--               validate_club_member_role_scope, validate_team_member_role_scope,
--               is_super_admin, is_club_member, has_club_role,
--               is_team_member, has_team_role,
--               create_club, create_independent_team
--   Trigger:    updated_at (profiles/clubs/teams), on_auth_user_created,
--               Scope-Validierung (club_member_roles, team_member_roles)
--   RLS:        alle 11 Tabellen + 26 Policies
--   Indexes:    11 (inkl. 1 Partial Unique Index für aktive Saison)
--   Seed:       20 Rollen (ON CONFLICT DO NOTHING — idempotent)
--
-- Bewusst NICHT enthalten (folgt Migration 002+):
--   team_invitation_links, team_join_requests, players, events,
--   event_attendance, invitations, player_guardians,
--   player_team_assignments, matches, match_reports, audit_logs,
--   team_affiliation_requests
-- ============================================================


-- ============================================================
-- TEIL 1: HILFSFUNKTION FÜR updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- TEIL 2: TABELLEN
-- Reihenfolge: Abhängigkeiten zuerst
-- ============================================================

-- ------------------------------------------------------------
-- roles: Zentrale Rollendefinition (Seed-Tabelle)
-- key ist maschinenlesbar, unveränderlich und wird in RLS-Policies verwendet —
-- niemals name_de als Vergleichswert nutzen
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,
  name_de     text        NOT NULL,
  description text,
  scope       text        NOT NULL CHECK (scope IN ('system', 'club', 'team')),
  is_system   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- permissions: Granulare Berechtigungen (Struktur vorhanden, Einträge Phase 2)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text        UNIQUE NOT NULL,
  description text,
  scope       text        NOT NULL CHECK (scope IN ('system', 'club', 'team')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- role_permissions: Zuordnung Rollen → Berechtigungen
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       uuid NOT NULL REFERENCES public.roles(id)       ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ------------------------------------------------------------
-- profiles: Erweiterung von auth.users (1:1)
-- Wird automatisch via Trigger handle_new_user angelegt
-- email denormalisiert für einfache Lookups — Sync-Logik Phase 2
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- clubs: Vereinsmandat
-- Ausschließlich via create_club() anlegen — kein direktes INSERT
-- verification_status: pending_verification direkt nach Erstellung;
-- 'verified' wird im MVP manuell via Supabase Studio gesetzt
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clubs (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  slug                 text        UNIQUE NOT NULL,
  country              text        NOT NULL DEFAULT 'AT',
  city                 text,
  logo_url             text,
  created_by           uuid        REFERENCES auth.users(id),
  verification_status  text        NOT NULL DEFAULT 'pending_verification'
    CHECK (verification_status IN (
      'draft', 'pending_verification', 'verified', 'rejected', 'suspended'
    )),
  verified_at          timestamptz,
  verified_by          uuid        REFERENCES auth.users(id),
  official_registry_id text,
  claimed_by           uuid        REFERENCES auth.users(id),
  claim_submitted_at   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clubs_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$')
);

-- ------------------------------------------------------------
-- seasons: Saisonen eines Vereins
-- starts_at/ends_at optional — Saison ohne festes Datum möglich
-- Partial Unique Index stellt sicher: max. 1 aktive Saison pro Verein
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seasons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  starts_at   date,
  ends_at     date,
  is_active   boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, name)
);

-- ------------------------------------------------------------
-- club_memberships: Grundmitgliedschaft in einem Verein
-- Keine Rolle hier — Rollen ausschließlich in club_member_roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid        NOT NULL REFERENCES public.clubs(id)  ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive', 'left')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

-- ------------------------------------------------------------
-- club_member_roles: Vereinsweite Rollen pro Mitglied (n Rollen möglich)
-- Trigger validate_club_member_role_scope stellt sicher:
--   - nur Rollen mit scope='club' erlaubt
--   - super_admin (scope='system') ist implizit blockiert
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_member_roles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_membership_id uuid        NOT NULL REFERENCES public.club_memberships(id) ON DELETE CASCADE,
  role_id            uuid        NOT NULL REFERENCES public.roles(id)            ON DELETE CASCADE,
  assigned_by        uuid        REFERENCES auth.users(id),
  assigned_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_membership_id, role_id)
);

-- ------------------------------------------------------------
-- teams: Eigenständig (club_id NULL) oder vereinsgebunden
--
-- ownership_type/club_id-Konsistenz via CHECK-Constraint:
--   independent  → club_id muss NULL sein
--   club_managed → club_id muss NOT NULL sein
--
-- UNIQUE(club_id, season_id, name): NULLs gelten in PostgreSQL als
-- distinct → eigenständige Teams dürfen gleiche Namen haben (gewollt)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        uuid        REFERENCES public.clubs(id)   ON DELETE SET NULL,
  season_id      uuid        REFERENCES public.seasons(id) ON DELETE SET NULL,
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
    (ownership_type = 'independent' AND club_id IS NULL)
    OR (ownership_type = 'club_managed' AND club_id IS NOT NULL)
  )
);

-- ------------------------------------------------------------
-- team_memberships: Grundzugehörigkeit zu einem Team
-- Keine Rolle hier — Rollen ausschließlich in team_member_roles
-- MVP-Vereinfachung: kein season_id (Phase 2)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES public.teams(id)  ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'inactive', 'left')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ------------------------------------------------------------
-- team_member_roles: Teamspezifische Rollen pro Mitglied (n Rollen möglich)
-- Trigger validate_team_member_role_scope stellt sicher:
--   - nur Rollen mit scope='team' erlaubt
--   - super_admin (scope='system') ist implizit blockiert
-- team_owner (administrativ) und head_coach (fachlich) sind strikt getrennt
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_member_roles (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_membership_id uuid        NOT NULL REFERENCES public.team_memberships(id) ON DELETE CASCADE,
  role_id            uuid        NOT NULL REFERENCES public.roles(id)            ON DELETE CASCADE,
  assigned_by        uuid        REFERENCES auth.users(id),
  assigned_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_membership_id, role_id)
);


-- ============================================================
-- TEIL 3: TRIGGER-FUNKTIONEN
-- Alle SECURITY DEFINER mit SET search_path = ''
-- ============================================================

-- ------------------------------------------------------------
-- handle_new_user: Profil automatisch bei Registrierung anlegen
-- ON CONFLICT DO NOTHING verhindert Fehler bei Wiederholung
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- validate_club_member_role_scope: Erzwingt scope='club' in club_member_roles
-- super_admin hat scope='system' und ist damit implizit blockiert
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_club_member_role_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_scope text;
  v_key   text;
BEGIN
  SELECT scope, key INTO v_scope, v_key
  FROM public.roles
  WHERE id = NEW.role_id;

  IF v_scope IS NULL THEN
    RAISE EXCEPTION 'Rolle nicht gefunden: %', NEW.role_id;
  END IF;

  IF v_scope != 'club' THEN
    RAISE EXCEPTION
      'Ungültiger Rollen-Scope: Rolle "%" hat scope "%" — in club_member_roles sind nur club-Rollen erlaubt.',
      v_key, v_scope;
  END IF;

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- validate_team_member_role_scope: Erzwingt scope='team' in team_member_roles
-- super_admin hat scope='system' und ist damit implizit blockiert
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_team_member_role_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_scope text;
  v_key   text;
BEGIN
  SELECT scope, key INTO v_scope, v_key
  FROM public.roles
  WHERE id = NEW.role_id;

  IF v_scope IS NULL THEN
    RAISE EXCEPTION 'Rolle nicht gefunden: %', NEW.role_id;
  END IF;

  IF v_scope != 'team' THEN
    RAISE EXCEPTION
      'Ungültiger Rollen-Scope: Rolle "%" hat scope "%" — in team_member_roles sind nur team-Rollen erlaubt.',
      v_key, v_scope;
  END IF;

  RETURN NEW;
END;
$$;


-- ============================================================
-- TEIL 4: TRIGGER ANLEGEN
-- ============================================================

CREATE OR REPLACE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_clubs_updated_at
  BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profil automatisch anlegen bei Registrierung (auth.users ist Supabase-intern)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Scope-Validierung läuft BEFORE INSERT OR UPDATE → blockiert ungültige Einträge
CREATE OR REPLACE TRIGGER trg_validate_club_member_role_scope
  BEFORE INSERT OR UPDATE ON public.club_member_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_club_member_role_scope();

CREATE OR REPLACE TRIGGER trg_validate_team_member_role_scope
  BEFORE INSERT OR UPDATE ON public.team_member_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_team_member_role_scope();


-- ============================================================
-- TEIL 5: RLS AKTIVIEREN
-- Deny by default: ohne explizite Policy kein Zugriff
-- ============================================================

ALTER TABLE public.roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_roles ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- TEIL 6: RLS-HILFSFUNKTIONEN
-- Alle: SECURITY DEFINER, SET search_path = '', STABLE
-- Vergleich immer gegen roles.key (maschinenlesbar, unveränderlich)
-- ============================================================

-- is_super_admin: Stub — gibt false zurück
-- Wird in Phase 2 aktiviert wenn system_admins-Tabelle existiert.
-- Solange false: super_admin-Checks in allen Policies schlagen fehl (gewollt).
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT false;
$$;

COMMENT ON FUNCTION public.is_super_admin() IS
  'Stub: gibt immer false zurück. Aktivierung in Phase 2 wenn system_admins-Tabelle existiert.';

-- is_club_member: Ist auth.uid() aktives Mitglied des Vereins?
CREATE OR REPLACE FUNCTION public.is_club_member(p_club_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships
    WHERE club_id = p_club_id
      AND user_id = auth.uid()
      AND status  = 'active'
  );
$$;

-- has_club_role: Hat auth.uid() eine bestimmte Rolle im Verein?
CREATE OR REPLACE FUNCTION public.has_club_role(p_club_id uuid, p_role_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships  cm
    JOIN public.club_member_roles cmr ON cmr.club_membership_id = cm.id
    JOIN public.roles              r   ON r.id = cmr.role_id
    WHERE cm.club_id = p_club_id
      AND cm.user_id = auth.uid()
      AND cm.status  = 'active'
      AND r.key      = p_role_key
  );
$$;

-- is_team_member: Ist auth.uid() aktives Mitglied des Teams?
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND status  = 'active'
  );
$$;

-- has_team_role: Hat auth.uid() eine der angegebenen Rollen im Team?
CREATE OR REPLACE FUNCTION public.has_team_role(p_team_id uuid, VARIADIC p_role_keys text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships  tm
    JOIN public.team_member_roles tmr ON tmr.team_membership_id = tm.id
    JOIN public.roles              r   ON r.id = tmr.role_id
    WHERE tm.team_id = p_team_id
      AND tm.user_id = auth.uid()
      AND tm.status  = 'active'
      AND r.key      = ANY(p_role_keys)
  );
$$;


-- ============================================================
-- TEIL 7: RLS-POLICIES
-- Benennungsschema: "<tabelle>_<operation>_<wer>"
-- Keine DELETE-Policies für clubs, seasons, teams (Produktentscheidung)
-- ============================================================

-- ------------------------------------------------------------
-- roles / permissions / role_permissions: Lesbar für alle eingeloggten User
-- ------------------------------------------------------------
CREATE POLICY "roles_select_authenticated"
  ON public.roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "permissions_select_authenticated"
  ON public.permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "role_permissions_select_authenticated"
  ON public.role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- profiles: Nur eigenes Profil sichtbar (konservativ)
-- Vereins-/Teammitglieder-Sichtbarkeit folgt in MVP 1
-- handle_new_user() ist SECURITY DEFINER → umgeht RLS (INSERT-Policy als Fallback)
-- ------------------------------------------------------------
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING    (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- clubs
-- Kein direktes INSERT — nur via create_club() (SECURITY DEFINER, umgeht RLS)
-- ------------------------------------------------------------
CREATE POLICY "clubs_select_member"
  ON public.clubs FOR SELECT
  USING (public.is_club_member(id));

CREATE POLICY "clubs_update_admin"
  ON public.clubs FOR UPDATE
  USING    (public.has_club_role(id, 'club_admin'))
  WITH CHECK (public.has_club_role(id, 'club_admin'));

-- ------------------------------------------------------------
-- seasons
-- ------------------------------------------------------------
CREATE POLICY "seasons_select_member"
  ON public.seasons FOR SELECT
  USING (public.is_club_member(club_id));

CREATE POLICY "seasons_insert_admin"
  ON public.seasons FOR INSERT
  WITH CHECK (public.has_club_role(club_id, 'club_admin'));

CREATE POLICY "seasons_update_admin"
  ON public.seasons FOR UPDATE
  USING    (public.has_club_role(club_id, 'club_admin'))
  WITH CHECK (public.has_club_role(club_id, 'club_admin'));

-- ------------------------------------------------------------
-- club_memberships
-- create_club() ist SECURITY DEFINER → umgeht RLS für die initiale Mitgliedschaft
-- ------------------------------------------------------------
CREATE POLICY "club_memberships_select_own_or_admin"
  ON public.club_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_club_role(club_id, 'club_admin')
  );

CREATE POLICY "club_memberships_insert_admin"
  ON public.club_memberships FOR INSERT
  WITH CHECK (public.has_club_role(club_id, 'club_admin'));

CREATE POLICY "club_memberships_update_admin"
  ON public.club_memberships FOR UPDATE
  USING    (public.has_club_role(club_id, 'club_admin'))
  WITH CHECK (public.has_club_role(club_id, 'club_admin'));

-- ------------------------------------------------------------
-- club_member_roles
-- club_id wird via Subquery aus club_memberships ermittelt
-- create_club() ist SECURITY DEFINER → umgeht RLS für die initiale Rollenvergabe
-- ------------------------------------------------------------
CREATE POLICY "club_member_roles_select_own_or_admin"
  ON public.club_member_roles FOR SELECT
  USING (
    auth.uid() = (
      SELECT cm.user_id FROM public.club_memberships cm
      WHERE cm.id = club_membership_id
    )
    OR public.has_club_role(
      (SELECT cm.club_id FROM public.club_memberships cm WHERE cm.id = club_membership_id),
      'club_admin'
    )
  );

CREATE POLICY "club_member_roles_insert_admin"
  ON public.club_member_roles FOR INSERT
  WITH CHECK (
    public.has_club_role(
      (SELECT cm.club_id FROM public.club_memberships cm WHERE cm.id = club_membership_id),
      'club_admin'
    )
  );

CREATE POLICY "club_member_roles_delete_admin"
  ON public.club_member_roles FOR DELETE
  USING (
    public.has_club_role(
      (SELECT cm.club_id FROM public.club_memberships cm WHERE cm.id = club_membership_id),
      'club_admin'
    )
  );

-- ------------------------------------------------------------
-- teams
-- SELECT: Teammitglieder + alle Vereinsmitglieder (falls club_id gesetzt)
--   Eigenständige Teams (club_id IS NULL): nur Teammitglieder
-- INSERT: club_admin für club_managed Teams
--   Eigenständige Teams: ausschließlich via create_independent_team() (SECURITY DEFINER)
-- UPDATE: team_owner oder club_admin
-- Keine DELETE-Policy (Soft-Delete via status='archived')
-- ------------------------------------------------------------
CREATE POLICY "teams_select_member_or_club_member"
  ON public.teams FOR SELECT
  USING (
    public.is_team_member(id)
    OR (club_id IS NOT NULL AND public.is_club_member(club_id))
  );

CREATE POLICY "teams_insert_club_admin"
  ON public.teams FOR INSERT
  WITH CHECK (
    club_id IS NOT NULL
    AND ownership_type = 'club_managed'
    AND public.has_club_role(club_id, 'club_admin')
  );

CREATE POLICY "teams_update_owner_or_admin"
  ON public.teams FOR UPDATE
  USING (
    public.has_team_role(id, 'team_owner')
    OR (club_id IS NOT NULL AND public.has_club_role(club_id, 'club_admin'))
  )
  WITH CHECK (
    public.has_team_role(id, 'team_owner')
    OR (club_id IS NOT NULL AND public.has_club_role(club_id, 'club_admin'))
  );

-- ------------------------------------------------------------
-- team_memberships
-- INSERT: team_owner/head_coach oder club_admin des Vereins
-- create_independent_team() ist SECURITY DEFINER → umgeht RLS
-- ------------------------------------------------------------
CREATE POLICY "team_memberships_select_own_or_member"
  ON public.team_memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_team_member(team_id)
  );

CREATE POLICY "team_memberships_insert_coach_or_admin"
  ON public.team_memberships FOR INSERT
  WITH CHECK (
    public.has_team_role(team_id, 'team_owner', 'head_coach')
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id        = team_id
        AND t.club_id   IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  );

CREATE POLICY "team_memberships_update_owner_or_admin"
  ON public.team_memberships FOR UPDATE
  USING (
    public.has_team_role(team_id, 'team_owner')
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id        = team_id
        AND t.club_id   IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  )
  WITH CHECK (
    public.has_team_role(team_id, 'team_owner')
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id        = team_id
        AND t.club_id   IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  );

-- ------------------------------------------------------------
-- team_member_roles
-- team_id wird via Subquery aus team_memberships ermittelt
-- create_independent_team() ist SECURITY DEFINER → umgeht RLS
-- team_owner kann Rollen vergeben; club_admin bei Vereinsteams
-- ------------------------------------------------------------
CREATE POLICY "team_member_roles_select_own_or_owner"
  ON public.team_member_roles FOR SELECT
  USING (
    auth.uid() = (
      SELECT tm.user_id FROM public.team_memberships tm
      WHERE tm.id = team_membership_id
    )
    OR public.has_team_role(
      (SELECT tm.team_id FROM public.team_memberships tm WHERE tm.id = team_membership_id),
      'team_owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_memberships tm
      JOIN public.teams            t  ON t.id = tm.team_id
      WHERE tm.id        = team_membership_id
        AND t.club_id    IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  );

CREATE POLICY "team_member_roles_insert_owner_or_admin"
  ON public.team_member_roles FOR INSERT
  WITH CHECK (
    public.has_team_role(
      (SELECT tm.team_id FROM public.team_memberships tm WHERE tm.id = team_membership_id),
      'team_owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_memberships tm
      JOIN public.teams            t  ON t.id = tm.team_id
      WHERE tm.id        = team_membership_id
        AND t.club_id    IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  );

CREATE POLICY "team_member_roles_delete_owner_or_admin"
  ON public.team_member_roles FOR DELETE
  USING (
    public.has_team_role(
      (SELECT tm.team_id FROM public.team_memberships tm WHERE tm.id = team_membership_id),
      'team_owner'
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_memberships tm
      JOIN public.teams            t  ON t.id = tm.team_id
      WHERE tm.id        = team_membership_id
        AND t.club_id    IS NOT NULL
        AND public.has_club_role(t.club_id, 'club_admin')
    )
  );


-- ============================================================
-- TEIL 8: INDEXES
-- RLS-kritische Indexes müssen vor dem ersten Datenbankzugriff existieren
-- ============================================================

-- club_memberships (bei fast jeder Vereins-RLS-Policy geprüft)
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_club
  ON public.club_memberships(user_id, club_id);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club
  ON public.club_memberships(club_id);

-- club_member_roles
CREATE INDEX IF NOT EXISTS idx_club_member_roles_membership
  ON public.club_member_roles(club_membership_id, role_id);

-- team_memberships (bei fast jeder Team-RLS-Policy geprüft)
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_team
  ON public.team_memberships(user_id, team_id);

CREATE INDEX IF NOT EXISTS idx_team_memberships_team
  ON public.team_memberships(team_id);

-- team_member_roles
CREATE INDEX IF NOT EXISTS idx_team_member_roles_membership
  ON public.team_member_roles(team_membership_id, role_id);

-- teams
CREATE INDEX IF NOT EXISTS idx_teams_club
  ON public.teams(club_id);

CREATE INDEX IF NOT EXISTS idx_teams_club_season
  ON public.teams(club_id, season_id);

CREATE INDEX IF NOT EXISTS idx_teams_created_by
  ON public.teams(created_by);

-- seasons
CREATE INDEX IF NOT EXISTS idx_seasons_club
  ON public.seasons(club_id, is_active);

-- Partial Unique Index: max. 1 aktive Saison pro Verein
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_club_active
  ON public.seasons(club_id)
  WHERE is_active = true;


-- ============================================================
-- TEIL 9: SECURITY DEFINER HAUPTFUNKTIONEN
-- Beide erfordern einen eingeloggten User (auth.uid() IS NOT NULL)
-- Beide arbeiten atomar (alle Schritte in einer Transaktion)
-- ============================================================

-- ------------------------------------------------------------
-- create_club: Legt Verein, optionale Saison, Mitgliedschaft und
-- club_admin-Rolle atomar an.
-- Einziger erlaubter Weg, einen Verein zu erstellen.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_club(
  p_name        text,
  p_slug        text,
  p_season_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id       uuid;
  v_club_id       uuid;
  v_membership_id uuid;
  v_role_id       uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt. create_club() erfordert einen authentifizierten User.';
  END IF;

  -- Slug normalisieren: trim + lowercase
  p_slug := lower(trim(p_slug));

  -- Slug validieren: a-z/0-9/Bindestriche, 3–63 Zeichen, kein Anfang/Ende mit Bindestrich
  IF p_slug !~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$' THEN
    RAISE EXCEPTION
      'Ungültiger Slug "%". Erlaubt: a-z, 0-9, Bindestriche. Länge 3–63 Zeichen. Kein Anfang/Ende mit Bindestrich.',
      p_slug;
  END IF;

  p_name := trim(p_name);
  IF p_name = '' THEN
    RAISE EXCEPTION 'Vereinsname darf nicht leer sein.';
  END IF;

  -- Verein anlegen (verification_status = 'pending_verification')
  INSERT INTO public.clubs (name, slug, created_by, verification_status)
  VALUES (p_name, p_slug, v_user_id, 'pending_verification')
  RETURNING id INTO v_club_id;

  -- Optionale Saison anlegen (sofort als aktive Saison markiert)
  IF p_season_name IS NOT NULL AND trim(p_season_name) != '' THEN
    INSERT INTO public.seasons (club_id, name, is_active)
    VALUES (v_club_id, trim(p_season_name), true);
  END IF;

  -- Mitgliedschaft anlegen
  INSERT INTO public.club_memberships (club_id, user_id, status)
  VALUES (v_club_id, v_user_id, 'active')
  RETURNING id INTO v_membership_id;

  -- club_admin-Rolle holen
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE key = 'club_admin';

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rolle "club_admin" nicht gefunden. Seed-Daten fehlen.';
  END IF;

  -- club_admin-Rolle vergeben (Scope-Trigger prüft scope=''club'' automatisch)
  INSERT INTO public.club_member_roles (club_membership_id, role_id, assigned_by)
  VALUES (v_membership_id, v_role_id, v_user_id);

  RETURN v_club_id;
END;
$$;

COMMENT ON FUNCTION public.create_club(text, text, text) IS
  'Legt Verein (pending_verification), optional Saison, Mitgliedschaft und club_admin-Rolle atomar an.';


-- ------------------------------------------------------------
-- create_independent_team: Legt eigenständiges Team (club_id = NULL),
-- Mitgliedschaft, team_owner-Rolle und optional head_coach-Rolle atomar an.
--
-- team_owner (administrativ) und head_coach (fachlich) sind strikt getrennte
-- Rollen. Beide können gleichzeitig vergeben werden — und werden es standardmäßig.
--
-- Einziger erlaubter Weg, ein eigenständiges Team zu erstellen.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_independent_team(
  p_team_name       text,
  p_age_group       text    DEFAULT NULL,
  p_gender          text    DEFAULT NULL,
  p_also_head_coach boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id         uuid;
  v_team_id         uuid;
  v_membership_id   uuid;
  v_role_owner_id   uuid;
  v_role_coach_id   uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt. create_independent_team() erfordert einen authentifizierten User.';
  END IF;

  p_team_name := trim(p_team_name);
  IF p_team_name = '' THEN
    RAISE EXCEPTION 'Teamname darf nicht leer sein.';
  END IF;

  -- Eigenständiges Team anlegen (club_id = NULL, ownership_type = 'independent')
  INSERT INTO public.teams (
    name, age_group, gender,
    club_id, created_by,
    ownership_type, status, is_active
  ) VALUES (
    p_team_name, p_age_group, p_gender,
    NULL, v_user_id,
    'independent', 'active', true
  )
  RETURNING id INTO v_team_id;

  -- Mitgliedschaft anlegen
  INSERT INTO public.team_memberships (team_id, user_id, status)
  VALUES (v_team_id, v_user_id, 'active')
  RETURNING id INTO v_membership_id;

  -- team_owner-Rolle holen und vergeben (administrativer Eigentümer des Teams)
  SELECT id INTO v_role_owner_id
  FROM public.roles
  WHERE key = 'team_owner';

  IF v_role_owner_id IS NULL THEN
    RAISE EXCEPTION 'Rolle "team_owner" nicht gefunden. Seed-Daten fehlen.';
  END IF;

  INSERT INTO public.team_member_roles (team_membership_id, role_id, assigned_by)
  VALUES (v_membership_id, v_role_owner_id, v_user_id);

  -- Optional: head_coach-Rolle vergeben (fachliche Trainingsrolle, getrennt von team_owner)
  IF p_also_head_coach THEN
    SELECT id INTO v_role_coach_id
    FROM public.roles
    WHERE key = 'head_coach';

    IF v_role_coach_id IS NULL THEN
      RAISE EXCEPTION 'Rolle "head_coach" nicht gefunden. Seed-Daten fehlen.';
    END IF;

    INSERT INTO public.team_member_roles (team_membership_id, role_id, assigned_by)
    VALUES (v_membership_id, v_role_coach_id, v_user_id);
  END IF;

  RETURN v_team_id;
END;
$$;

COMMENT ON FUNCTION public.create_independent_team(text, text, text, boolean) IS
  'Legt eigenständiges Team (club_id=NULL), Mitgliedschaft, team_owner und optional head_coach atomar an.';


-- ============================================================
-- TEIL 10: SEED-DATEN
-- ON CONFLICT (key) DO NOTHING → idempotent (mehrfaches Ausführen sicher)
-- ============================================================

INSERT INTO public.roles (key, name_de, scope, is_system)
VALUES
  -- Systemebene
  ('super_admin',       'Plattformadministrator/in', 'system', true),

  -- Vereinsebene — MVP 0B
  ('club_admin',        'Vereinsadministrator/in',   'club',   true),

  -- Vereinsebene — MVP 1
  ('president',         'Obmann/Obfrau',             'club',   true),
  ('sporting_director', 'Sportliche/r Leiter/in',    'club',   true),

  -- Vereinsebene — später
  ('board_member',      'Vorstandsmitglied',         'club',   true),
  ('secretary',         'Schriftführer/in',          'club',   true),
  ('treasurer',         'Kassier/in',                'club',   true),
  ('youth_director',    'Jugendleiter/in',           'club',   true),
  ('youth_coordinator', 'Nachwuchskoordinator/in',   'club',   true),
  ('media_manager',     'Medienverantwortliche/r',   'club',   true),
  ('facility_manager',  'Platzwart/in',              'club',   true),
  ('equipment_manager', 'Zeugwart/in',               'club',   true),
  ('viewer',            'Beobachter/in',             'club',   true),

  -- Teamebene — MVP 0A
  ('team_owner',        'Teameigentümer/in',         'team',   true),
  ('head_coach',        'Cheftrainer/in',            'team',   true),

  -- Teamebene — MVP 1
  ('assistant_coach',   'Co-Trainer/in',             'team',   true),
  ('team_manager',      'Betreuer/in',               'team',   true),
  ('player',            'Spieler/in',                'team',   true),
  ('guardian',          'Erziehungsberechtigte/r',   'team',   true),

  -- Teamebene — später
  ('goalkeeper_coach',  'Tormanntrainer/in',         'team',   true)

ON CONFLICT (key) DO NOTHING;
