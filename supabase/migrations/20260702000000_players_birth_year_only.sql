-- ============================================================
-- Migration: players_birth_year_only
-- Zweck:
--   Datenminimierung (siehe docs/DSGVO_PRIVACY_MODEL.md): Für Kinder/Player
--   im MVP wird künftig nur noch birth_year erfasst, kein volles Geburtsdatum.
--   players.date_of_birth wird NICHT gedroppt (Bestandsspalte, nullable,
--   enthält ggf. Altdaten aus 20260629000000), aber ab sofort nicht mehr
--   durch die Join-Flow-RPCs befüllt.
--   profiles.date_of_birth ist NICHT betroffen (separates Feld, andere
--   Zweckbindung — Erwachsenen-Registrierung).
--
--   1. Alte Signatur submit_join_request_guardian(text, text, text, date)
--      entfernen.
--   2. Neue submit_join_request_guardian(p_code text, p_first_name text,
--      p_last_name text, p_child_birth_year integer): Geburtsjahr statt
--      Geburtsdatum, Plausibilitätsprüfung 1900..aktuelles Jahr.
--   3. submit_join_request_self(p_code text): leitet birth_year weiterhin
--      aus profiles.date_of_birth ab, befüllt players.date_of_birth aber
--      nicht mehr.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Alte Signatur entfernen
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_join_request_guardian(text, text, text, date);

-- ------------------------------------------------------------
-- 2. submit_join_request_self(p_code text)
--    Unverändertes Verhalten außer: players.date_of_birth wird nicht mehr
--    befüllt. birth_year wird weiterhin aus profiles.date_of_birth abgeleitet.
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

  -- birth_year aus profiles.date_of_birth ableiten falls vorhanden
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
  -- date_of_birth wird bewusst NICHT befüllt (Datenminimierung, birth_year reicht)
  INSERT INTO public.players (
    created_by, user_id,
    first_name, last_name,
    birth_year
  ) VALUES (
    auth.uid(), auth.uid(),
    trim(v_profile.first_name), trim(v_profile.last_name),
    v_birth_year
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
-- 3. submit_join_request_guardian(p_code, p_first_name, p_last_name, p_child_birth_year)
--    Geburtsjahr statt vollständigem Geburtsdatum als Pflichtfeld.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_join_request_guardian(
  p_code              text,
  p_first_name        text,
  p_last_name         text,
  p_child_birth_year  integer
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

  IF p_child_birth_year IS NULL THEN
    RAISE EXCEPTION 'Geburtsjahr ist erforderlich';
  END IF;

  IF p_child_birth_year < 1900 OR p_child_birth_year > EXTRACT(YEAR FROM CURRENT_DATE)::integer THEN
    RAISE EXCEPTION 'Ungültiges Geburtsjahr (1900–aktuelles Jahr)';
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
  -- date_of_birth wird bewusst NICHT befüllt (Datenminimierung, birth_year reicht)
  INSERT INTO public.players (
    created_by, user_id,
    first_name, last_name,
    birth_year
  ) VALUES (
    auth.uid(), NULL,
    trim(p_first_name), trim(p_last_name),
    p_child_birth_year
  )
  RETURNING id INTO v_player_id;

  -- Guardian-Verknüpfung (verified_at = technischer Verknüpfungszeitpunkt,
  -- kein vollständiger Einwilligungsnachweis)
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
