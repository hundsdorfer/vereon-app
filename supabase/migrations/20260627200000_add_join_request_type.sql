-- ============================================================
-- Migration — Join Request Typ (Phase F.1)
-- Datei: 20260627200000_add_join_request_type.sql
-- Datum: 2026-06-27
-- ============================================================
-- Änderungen:
--   1. team_join_requests: request_type, requester_user_id,
--      guardian_user_id nullable, CHECK-Constraint, Index
--   2. RLS: tjr_select_guardian → tjr_select_requester,
--      players_select_own (neu)
--   3. Neue Funktionen:
--      get_public_invitation_info_by_code()
--      submit_join_request_self()
--      submit_join_request_guardian()
--   4. Fix withdraw_join_request(): guardian_user_id → requester_user_id
--      (Sicherheitsfix: NULL-guardian bei self_player ermöglichte
--       sonst beliebigen Zugriff auf die Funktion)
-- ============================================================

-- ============================================================
-- 1. SCHEMA-ÄNDERUNGEN
-- ============================================================

-- request_type: Unterscheidet self_player von guardian_child.
-- DEFAULT 'guardian_child': Bestehende Zeilen erhalten automatisch den richtigen Wert.
ALTER TABLE public.team_join_requests
  ADD COLUMN request_type text NOT NULL DEFAULT 'guardian_child'
    CHECK (request_type IN ('self_player', 'guardian_child'));

-- requester_user_id: Immer der eingeloggte User, der die Anfrage stellt.
-- Für beide request_type gesetzt — universal für RLS und Duplikat-Checks.
-- Nullable vorerst, damit Backfill vor der NOT NULL Einschränkung möglich ist.
ALTER TABLE public.team_join_requests
  ADD COLUMN requester_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================
-- 2. BACKFILL
-- ============================================================

-- Bestehende Zeilen: alle guardian_child, daher requester_user_id = guardian_user_id.
UPDATE public.team_join_requests
SET requester_user_id = guardian_user_id
WHERE requester_user_id IS NULL
  AND guardian_user_id  IS NOT NULL;

-- ============================================================
-- 3. CONSTRAINTS
-- ============================================================

-- NOT NULL setzen — nach Backfill sicher.
ALTER TABLE public.team_join_requests
  ALTER COLUMN requester_user_id SET NOT NULL;

-- guardian_user_id nullable machen — für self_player Zeilen.
ALTER TABLE public.team_join_requests
  ALTER COLUMN guardian_user_id DROP NOT NULL;

-- Konsistenz-Constraint:
-- guardian_child → guardian_user_id IS NOT NULL
-- self_player    → guardian_user_id IS NULL
ALTER TABLE public.team_join_requests
  ADD CONSTRAINT tjr_request_type_consistent
  CHECK ((request_type = 'guardian_child') = (guardian_user_id IS NOT NULL));

-- ============================================================
-- 4. INDEX
-- ============================================================

CREATE INDEX idx_tjr_requester
  ON public.team_join_requests(requester_user_id);

-- ============================================================
-- 5. RLS
-- ============================================================

-- tjr_select_guardian → tjr_select_requester
-- requester_user_id deckt beide request_type ab.
DROP POLICY "tjr_select_guardian" ON public.team_join_requests;

CREATE POLICY "tjr_select_requester"
  ON public.team_join_requests FOR SELECT
  USING (requester_user_id = auth.uid());

-- Selbst beitretende Spieler können ihren eigenen players-Eintrag sehen.
-- Guardian-Spieler werden via is_guardian_of() bereits abgedeckt.
CREATE POLICY "players_select_own"
  ON public.players FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- 6. get_public_invitation_info_by_code()
-- SECURITY DEFINER: Öffentlicher Lookup — RLS auf team_invitation_links
-- erfordert team_owner/head_coach, diese Funktion ist für anon/authenticated.
-- Gibt nur sichere öffentliche Daten zurück — keine internen IDs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_invitation_info_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
DECLARE
  v_link record;
BEGIN
  IF p_code IS NULL OR char_length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid_code');
  END IF;

  SELECT
    til.expires_at,
    til.revoked_at,
    til.use_count,
    til.max_uses,
    t.name      AS team_name,
    t.age_group AS age_group,
    t.gender    AS gender
  INTO v_link
  FROM public.team_invitation_links til
  JOIN public.teams t ON t.id = til.team_id
  WHERE til.public_code = p_code
    AND til.public_code IS NOT NULL
    AND t.is_active     = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_link.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', false, 'reason', 'revoked',
      'team_name', v_link.team_name
    );
  END IF;

  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false, 'reason', 'expired',
      'team_name', v_link.team_name
    );
  END IF;

  IF v_link.use_count >= v_link.max_uses THEN
    RETURN jsonb_build_object(
      'valid', false, 'reason', 'max_uses_reached',
      'team_name', v_link.team_name
    );
  END IF;

  RETURN jsonb_build_object(
    'valid',      true,
    'team_name',  v_link.team_name,
    'age_group',  v_link.age_group,
    'gender',     v_link.gender
  );
END;
$$;

-- ============================================================
-- 7. submit_join_request_self()
-- Volljähriger Spieler tritt selbst bei.
-- players.user_id = auth.uid(), kein player_guardians Eintrag.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_join_request_self(
  p_code       text,
  p_first_name text,
  p_last_name  text,
  p_birth_year integer DEFAULT NULL,
  p_position   text    DEFAULT NULL,
  p_jersey_nr  integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_link       public.team_invitation_links%ROWTYPE;
  v_player_id  uuid;
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF p_first_name IS NULL OR char_length(trim(p_first_name)) = 0 THEN
    RAISE EXCEPTION 'Vorname darf nicht leer sein';
  END IF;

  IF p_last_name IS NULL OR char_length(trim(p_last_name)) = 0 THEN
    RAISE EXCEPTION 'Nachname darf nicht leer sein';
  END IF;

  IF p_birth_year IS NOT NULL AND (p_birth_year < 1900 OR p_birth_year > 2100) THEN
    RAISE EXCEPTION 'Ungültiges Geburtsjahr (1900–2100)';
  END IF;

  -- Link sperren: race-safe Prüfung von use_count / max_uses
  SELECT * INTO v_link
  FROM public.team_invitation_links
  WHERE public_code = p_code
    AND public_code IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Einladungscode nicht gefunden';
  END IF;

  IF v_link.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Einladungscode wurde widerrufen';
  END IF;

  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
    RAISE EXCEPTION 'Einladungscode ist abgelaufen';
  END IF;

  IF v_link.use_count >= v_link.max_uses THEN
    RAISE EXCEPTION 'Einladungscode hat maximale Nutzungen erreicht';
  END IF;

  -- Doppelte pending Anfrage prüfen
  IF EXISTS (
    SELECT 1 FROM public.team_join_requests
    WHERE team_id           = v_link.team_id
      AND requester_user_id = auth.uid()
      AND status            = 'pending'
  ) THEN
    RAISE EXCEPTION 'Du hast bereits eine offene Beitrittsanfrage für dieses Team';
  END IF;

  -- Bereits aktives Teammitglied prüfen (via team_memberships)
  IF EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = v_link.team_id
      AND user_id = auth.uid()
      AND status  = 'active'
  ) THEN
    RAISE EXCEPTION 'Du bist bereits Mitglied dieses Teams';
  END IF;

  -- Spieler anlegen (user_id = auth.uid(): Spieler hat eigenen Account)
  INSERT INTO public.players (created_by, user_id, first_name, last_name, birth_year, position, jersey_nr)
  VALUES (auth.uid(), auth.uid(), trim(p_first_name), trim(p_last_name), p_birth_year, p_position, p_jersey_nr)
  RETURNING id INTO v_player_id;

  -- Beitrittsanfrage
  INSERT INTO public.team_join_requests (
    team_id, invitation_link_id, requester_user_id, guardian_user_id, player_id, request_type
  ) VALUES (
    v_link.team_id, v_link.id, auth.uid(), NULL, v_player_id, 'self_player'
  )
  RETURNING id INTO v_request_id;

  -- use_count atomar erhöhen
  UPDATE public.team_invitation_links
  SET use_count = use_count + 1
  WHERE id = v_link.id;

  RETURN v_request_id;
END;
$$;

-- ============================================================
-- 8. submit_join_request_guardian()
-- Erziehungsberechtigte/r meldet Kind an.
-- players.user_id = NULL, player_guardians Eintrag wird angelegt.
-- ============================================================

CREATE OR REPLACE FUNCTION public.submit_join_request_guardian(
  p_code       text,
  p_first_name text,
  p_last_name  text,
  p_birth_year integer DEFAULT NULL,
  p_position   text    DEFAULT NULL,
  p_jersey_nr  integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_link       public.team_invitation_links%ROWTYPE;
  v_player_id  uuid;
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF p_first_name IS NULL OR char_length(trim(p_first_name)) = 0 THEN
    RAISE EXCEPTION 'Vorname darf nicht leer sein';
  END IF;

  IF p_last_name IS NULL OR char_length(trim(p_last_name)) = 0 THEN
    RAISE EXCEPTION 'Nachname darf nicht leer sein';
  END IF;

  IF p_birth_year IS NOT NULL AND (p_birth_year < 1900 OR p_birth_year > 2100) THEN
    RAISE EXCEPTION 'Ungültiges Geburtsjahr (1900–2100)';
  END IF;

  -- Link sperren
  SELECT * INTO v_link
  FROM public.team_invitation_links
  WHERE public_code = p_code
    AND public_code IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Einladungscode nicht gefunden';
  END IF;

  IF v_link.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'Einladungscode wurde widerrufen';
  END IF;

  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
    RAISE EXCEPTION 'Einladungscode ist abgelaufen';
  END IF;

  IF v_link.use_count >= v_link.max_uses THEN
    RAISE EXCEPTION 'Einladungscode hat maximale Nutzungen erreicht';
  END IF;

  -- Doppelte pending Anfrage prüfen (dieser Guardian, dieses Team)
  IF EXISTS (
    SELECT 1 FROM public.team_join_requests
    WHERE team_id           = v_link.team_id
      AND requester_user_id = auth.uid()
      AND status            = 'pending'
  ) THEN
    RAISE EXCEPTION 'Du hast bereits eine offene Beitrittsanfrage für dieses Team';
  END IF;

  -- Kind anlegen (user_id = NULL: Kind hat keinen eigenen Account)
  INSERT INTO public.players (created_by, user_id, first_name, last_name, birth_year, position, jersey_nr)
  VALUES (auth.uid(), NULL, trim(p_first_name), trim(p_last_name), p_birth_year, p_position, p_jersey_nr)
  RETURNING id INTO v_player_id;

  -- Guardian-Verknüpfung (verified_at = now() ist der DSGVO-Einwilligungsnachweis)
  INSERT INTO public.player_guardians (player_id, guardian_user_id, verified_at)
  VALUES (v_player_id, auth.uid(), now());

  -- Beitrittsanfrage
  INSERT INTO public.team_join_requests (
    team_id, invitation_link_id, requester_user_id, guardian_user_id, player_id, request_type
  ) VALUES (
    v_link.team_id, v_link.id, auth.uid(), auth.uid(), v_player_id, 'guardian_child'
  )
  RETURNING id INTO v_request_id;

  -- use_count atomar erhöhen
  UPDATE public.team_invitation_links
  SET use_count = use_count + 1
  WHERE id = v_link.id;

  RETURN v_request_id;
END;
$$;

-- ============================================================
-- 9. withdraw_join_request() — Sicherheitsfix
-- Prüfung auf requester_user_id statt guardian_user_id.
-- Begründung: guardian_user_id ist für self_player NULL —
-- NULL <> auth.uid() evaluiert zu NULL (nicht TRUE), daher
-- würde die RAISE EXCEPTION nie feuern, und jeder authentifizierte
-- User könnte beliebige self_player Anfragen zurückziehen.
-- ============================================================

CREATE OR REPLACE FUNCTION public.withdraw_join_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_request               public.team_join_requests%ROWTYPE;
  v_player_id             uuid;
  v_has_other_pending     boolean;
  v_has_active_assignment boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  SELECT * INTO v_request
  FROM public.team_join_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Anfrage nicht gefunden';
  END IF;

  IF v_request.requester_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Keine Berechtigung: nur der Antragsteller kann die Anfrage zurückziehen';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Anfrage ist nicht mehr offen (Status: %)', v_request.status;
  END IF;

  v_player_id := v_request.player_id;

  UPDATE public.team_join_requests
  SET status = 'withdrawn', reviewed_at = now()
  WHERE id = p_request_id;

  -- Orphan-Check: Player löschen wenn keine weiteren Bezüge
  IF v_player_id IS NOT NULL THEN
    PERFORM id FROM public.players WHERE id = v_player_id FOR UPDATE;

    SELECT EXISTS (
      SELECT 1 FROM public.team_join_requests
      WHERE player_id = v_player_id
        AND status    = 'pending'
        AND id        <> p_request_id
    ) INTO v_has_other_pending;

    SELECT EXISTS (
      SELECT 1 FROM public.player_team_assignments
      WHERE player_id = v_player_id
        AND status    = 'active'
    ) INTO v_has_active_assignment;

    IF NOT v_has_other_pending AND NOT v_has_active_assignment THEN
      DELETE FROM public.players WHERE id = v_player_id;
    END IF;
  END IF;
END;
$$;
