-- ============================================================
-- Migration — Automatischer Team-Einladungscode (Phase E.1)
-- Datei: 20260627100000_add_team_public_code.sql
-- Datum: 2026-06-27
-- ============================================================
-- Änderungen:
--   1. team_invitation_links: token_hash nullable, expires_at nullable,
--      public_code TEXT hinzugefügt
--   2. Constraint: mindestens token_hash oder public_code muss gesetzt sein
--   3. Unique Index auf public_code WHERE IS NOT NULL
--   4. generate_team_code() — SECURITY DEFINER Hilfsfunktion
--   5. create_independent_team() — CREATE OR REPLACE, erstellt Code atomar
--   6. get_team_invite_code() — SQL-Funktion, RLS greift (kein SECURITY DEFINER)
--   7. Backfill bestehender aktiver Teams ohne aktiven public_code
-- ============================================================

-- ============================================================
-- 1. SCHEMA-ÄNDERUNGEN
-- ============================================================

ALTER TABLE public.team_invitation_links
  ALTER COLUMN token_hash DROP NOT NULL;

ALTER TABLE public.team_invitation_links
  ALTER COLUMN expires_at DROP NOT NULL;

ALTER TABLE public.team_invitation_links
  ADD COLUMN public_code text;

-- ============================================================
-- 2. CONSTRAINT: mindestens ein Identifier
-- ============================================================

ALTER TABLE public.team_invitation_links
  ADD CONSTRAINT til_has_identifier
  CHECK (token_hash IS NOT NULL OR public_code IS NOT NULL);

-- ============================================================
-- 3. INDEX
-- ============================================================

CREATE UNIQUE INDEX idx_til_public_code
  ON public.team_invitation_links(public_code)
  WHERE public_code IS NOT NULL;

-- ============================================================
-- 4. generate_team_code()
-- Format: VRN-XXXX-XXXX-XXXX
-- Zeichensatz: ABCDEFGHJKMNPQRSTUVWXYZ23456789
-- (kein O/0/I/1/L — visuelle Verwechslung vermieden)
-- Keyspace: 31^12 ≈ 1,8 × 10^17
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_team_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chars text  := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code  text  := 'VRN-';
  v_bytes bytea;
  i       int;
BEGIN
  v_bytes := extensions.gen_random_bytes(12);
  FOR i IN 0..11 LOOP
    IF i = 4 OR i = 8 THEN
      v_code := v_code || '-';
    END IF;
    v_code := v_code || substr(v_chars, (get_byte(v_bytes, i) % 31) + 1, 1);
  END LOOP;
  RETURN v_code;
END;
$$;

-- ============================================================
-- 5. create_independent_team() — CREATE OR REPLACE
-- Signatur identisch zu Migration 001.
-- Erweitert um atomaren Einladungscode-Eintrag nach Team-Erstellung.
-- ============================================================

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

  -- team_owner-Rolle holen und vergeben
  SELECT id INTO v_role_owner_id
  FROM public.roles
  WHERE key = 'team_owner';

  IF v_role_owner_id IS NULL THEN
    RAISE EXCEPTION 'Rolle "team_owner" nicht gefunden. Seed-Daten fehlen.';
  END IF;

  INSERT INTO public.team_member_roles (team_membership_id, role_id, assigned_by)
  VALUES (v_membership_id, v_role_owner_id, v_user_id);

  -- Optional: head_coach-Rolle vergeben
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

  -- Automatischer Einladungscode: dauerhaft (expires_at = NULL), kein hash-Modell
  INSERT INTO public.team_invitation_links (
    team_id, created_by, public_code, max_uses
  ) VALUES (
    v_team_id, v_user_id, public.generate_team_code(), 50
  );

  RETURN v_team_id;
END;
$$;

COMMENT ON FUNCTION public.create_independent_team(text, text, text, boolean) IS
  'Legt eigenständiges Team (club_id=NULL), Mitgliedschaft, team_owner, optional head_coach und automatischen Einladungscode atomar an.';

-- ============================================================
-- 6. get_team_invite_code()
-- Kein SECURITY DEFINER: RLS auf team_invitation_links greift.
-- Nur team_owner/head_coach sehen den Code (Policy til_select_team_staff).
-- Vorbereitet für den späteren /join/[code] Flow.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_team_invite_code(p_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public_code
  FROM public.team_invitation_links
  WHERE team_id    = p_team_id
    AND revoked_at IS NULL
    AND public_code IS NOT NULL
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- ============================================================
-- 7. BACKFILL bestehender aktiver Teams ohne aktiven public_code
-- Backfill läuft mit Superuser-Rechten im Migrations-Kontext.
-- ============================================================

INSERT INTO public.team_invitation_links (team_id, created_by, public_code, max_uses)
SELECT
  t.id,
  t.created_by,
  public.generate_team_code(),
  50
FROM public.teams t
WHERE t.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.team_invitation_links til
    WHERE til.team_id     = t.id
      AND til.revoked_at  IS NULL
      AND til.public_code IS NOT NULL
  );
