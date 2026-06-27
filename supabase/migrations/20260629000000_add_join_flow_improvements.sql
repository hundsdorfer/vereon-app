-- ============================================================
-- Migration: add_join_flow_improvements
-- Zweck:
--   1. players.date_of_birth (date, nullable) hinzufügen
--   2. Alte unsichere Funktionssignaturen entfernen:
--      submit_join_request_self(text, text, text, integer, text, integer)
--      submit_join_request_guardian(text, text, text, integer, text, integer)
--   3. Neue submit_join_request_self(p_code text):
--      liest Profildaten aus public.profiles — kein Name-Spoofing durch Client möglich
--   4. Neue submit_join_request_guardian(p_code text, p_first_name text, p_last_name text, p_child_date_of_birth date):
--      speichert vollständiges Geburtsdatum, leitet birth_year intern ab
-- ============================================================

-- ------------------------------------------------------------
-- 1. players.date_of_birth hinzufügen
-- ------------------------------------------------------------
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Kein Backfill: bestehende Zeilen haben nur birth_year, kein Tag/Monat bekannt.

-- ------------------------------------------------------------
-- 2. Alte unsichere Funktionssignaturen entfernen
-- ------------------------------------------------------------

-- Sicherheitsprinzip: Nach dem DROP können diese Signaturen nicht mehr
-- von außen aufgerufen werden. Die neuen Funktionen haben engere Signaturen.
DROP FUNCTION IF EXISTS public.submit_join_request_self(text, text, text, integer, text, integer);
DROP FUNCTION IF EXISTS public.submit_join_request_guardian(text, text, text, integer, text, integer);

-- ------------------------------------------------------------
-- 3. submit_join_request_self(p_code text)
--    Liest first_name, last_name, date_of_birth aus profiles.
--    Client übergibt nur den Code — kein Name-Spoofing möglich.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_join_request_self(
  p_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_profile    public.profiles%ROWTYPE;
  v_link       public.team_invitation_links%ROWTYPE;
  v_player_id  uuid;
  v_request_id uuid;
  v_birth_year integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  -- Profil laden
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil unvollständig';
  END IF;

  IF v_profile.first_name IS NULL OR char_length(trim(v_profile.first_name)) = 0 THEN
    RAISE EXCEPTION 'Profil unvollständig';
  END IF;

  IF v_profile.last_name IS NULL OR char_length(trim(v_profile.last_name)) = 0 THEN
    RAISE EXCEPTION 'Profil unvollständig';
  END IF;

  -- birth_year aus date_of_birth ableiten falls vorhanden
  IF v_profile.date_of_birth IS NOT NULL THEN
    v_birth_year := EXTRACT(YEAR FROM v_profile.date_of_birth)::integer;
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

  -- Doppelte pending Anfrage verhindern
  IF EXISTS (
    SELECT 1 FROM public.team_join_requests
    WHERE team_id           = v_link.team_id
      AND requester_user_id = auth.uid()
      AND status            = 'pending'
  ) THEN
    RAISE EXCEPTION 'Du hast bereits eine offene Beitrittsanfrage für dieses Team';
  END IF;

  -- Bereits aktives Teammitglied verhindern
  IF EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = v_link.team_id
      AND user_id = auth.uid()
      AND status  = 'active'
  ) THEN
    RAISE EXCEPTION 'Du bist bereits Mitglied dieses Teams';
  END IF;

  -- Spieler mit Profildaten anlegen (user_id = auth.uid())
  INSERT INTO public.players (
    created_by, user_id,
    first_name, last_name,
    date_of_birth, birth_year
  ) VALUES (
    auth.uid(), auth.uid(),
    trim(v_profile.first_name), trim(v_profile.last_name),
    v_profile.date_of_birth, v_birth_year
  )
  RETURNING id INTO v_player_id;

  -- Beitrittsanfrage anlegen
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

-- ------------------------------------------------------------
-- 4. submit_join_request_guardian(p_code, p_first_name, p_last_name, p_child_date_of_birth)
--    Vollständiges Geburtsdatum des Kindes als Pflichtfeld.
--    birth_year wird serverseitig abgeleitet.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_join_request_guardian(
  p_code                text,
  p_first_name          text,
  p_last_name           text,
  p_child_date_of_birth date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_link       public.team_invitation_links%ROWTYPE;
  v_player_id  uuid;
  v_request_id uuid;
  v_birth_year integer;
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

  IF p_child_date_of_birth IS NULL THEN
    RAISE EXCEPTION 'Geburtsdatum ist erforderlich';
  END IF;

  IF p_child_date_of_birth >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Geburtsdatum muss in der Vergangenheit liegen';
  END IF;

  -- birth_year ableiten
  v_birth_year := EXTRACT(YEAR FROM p_child_date_of_birth)::integer;

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

  -- Doppelte pending Anfrage verhindern
  IF EXISTS (
    SELECT 1 FROM public.team_join_requests
    WHERE team_id           = v_link.team_id
      AND requester_user_id = auth.uid()
      AND status            = 'pending'
  ) THEN
    RAISE EXCEPTION 'Du hast bereits eine offene Beitrittsanfrage für dieses Team';
  END IF;

  -- Kind anlegen (user_id = NULL: Kind hat keinen eigenen Account)
  INSERT INTO public.players (
    created_by, user_id,
    first_name, last_name,
    date_of_birth, birth_year
  ) VALUES (
    auth.uid(), NULL,
    trim(p_first_name), trim(p_last_name),
    p_child_date_of_birth, v_birth_year
  )
  RETURNING id INTO v_player_id;

  -- Guardian-Verknüpfung (verified_at = DSGVO-Einwilligungsnachweis)
  INSERT INTO public.player_guardians (player_id, guardian_user_id, verified_at)
  VALUES (v_player_id, auth.uid(), now());

  -- Beitrittsanfrage anlegen
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
