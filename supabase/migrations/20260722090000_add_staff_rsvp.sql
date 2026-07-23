-- Tabelle: getrennt von event_attendance, fachlicher Schlüssel = Termin + Nutzer.
CREATE TABLE public.event_staff_rsvps (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status  text        NOT NULL
    CHECK (rsvp_status IN ('attending', 'declined', 'maybe')),
  rsvp_note    text,
  responded_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TRIGGER trg_event_staff_rsvps_updated_at
  BEFORE UPDATE ON public.event_staff_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.event_staff_rsvps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_staff_rsvp_trainer_for_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = p_event_id
      AND public.has_team_role(
        e.team_id, 'team_owner', 'head_coach', 'assistant_coach'
      )
  );
$$;

-- Codex gering-2: explizites REVOKE/GRANT auch auf der Hilfsfunktion.
REVOKE EXECUTE ON FUNCTION public.is_staff_rsvp_trainer_for_event(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_staff_rsvp_trainer_for_event(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_staff_rsvp_trainer_for_event(uuid) TO authenticated;

CREATE POLICY "esr_select_own"
  ON public.event_staff_rsvps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "esr_select_trainer"
  ON public.event_staff_rsvps FOR SELECT
  USING (public.is_staff_rsvp_trainer_for_event(event_id));

-- Codex gering-3: idx_esr_event entfernt (redundant zur führenden Spalte des
-- UNIQUE(event_id, user_id)-Index).
CREATE INDEX idx_esr_user ON public.event_staff_rsvps(user_id);

GRANT SELECT ON public.event_staff_rsvps TO authenticated;

-- RPC: eigene Trainer-RSVP abgeben/ändern (UPSERT).
-- Codex wichtig-1: starts_at wird jetzt geprüft (nicht mehr weggelassen).
-- Codex gering-1: NULL-sicherer Statuscheck.
CREATE OR REPLACE FUNCTION public.respond_to_event_as_staff(
  p_event_id    uuid,
  p_rsvp_status text,
  p_rsvp_note   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_team_id      uuid;
  v_is_cancelled boolean;
  v_starts_at    timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF p_rsvp_status IS NULL OR p_rsvp_status NOT IN ('attending', 'declined', 'maybe') THEN
    RAISE EXCEPTION
      'Ungültiger RSVP-Status "%". Erlaubt: attending, declined, maybe', p_rsvp_status;
  END IF;

  SELECT team_id, is_cancelled, starts_at INTO v_team_id, v_is_cancelled, v_starts_at
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  -- Enumerationsschutz: fremde/nicht-existente Termine identisch behandelt.
  IF NOT public.has_team_role(v_team_id, 'team_owner', 'head_coach', 'assistant_coach') THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF v_is_cancelled THEN
    RAISE EXCEPTION 'Termin wurde abgesagt — RSVP nicht möglich';
  END IF;

  IF v_starts_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Termin hat bereits begonnen — RSVP nicht mehr möglich';
  END IF;

  p_rsvp_note := NULLIF(trim(p_rsvp_note), '');

  INSERT INTO public.event_staff_rsvps (
    event_id, user_id, rsvp_status, rsvp_note, responded_at, updated_at
  ) VALUES (
    p_event_id, auth.uid(), p_rsvp_status, p_rsvp_note, now(), now()
  )
  ON CONFLICT (event_id, user_id) DO UPDATE
  SET
    rsvp_status  = EXCLUDED.rsvp_status,
    rsvp_note    = EXCLUDED.rsvp_note,
    responded_at = now(),
    updated_at   = now();

  RETURN v_team_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_event_as_staff(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.respond_to_event_as_staff(uuid, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.respond_to_event_as_staff(uuid, text, text) TO authenticated;

-- RPC: liefert Trainer-RSVP-Status für die Event-Detailseite.
-- Codex wichtig-3: UNION aus aktuell aktiven Trainern (auch ohne Antwort) und
-- historischen Antworten nicht mehr aktiver Trainer, damit weder Historie
-- verloren geht noch neu ernannte Trainer rückwirkend falsch erscheinen.
CREATE OR REPLACE FUNCTION public.list_staff_rsvps_for_event(p_event_id uuid)
RETURNS TABLE (
  user_id           uuid,
  full_name         text,
  rsvp_status       text,
  rsvp_note         text,
  responded_at      timestamptz,
  is_active_trainer boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
DECLARE
  v_team_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  SELECT team_id INTO v_team_id
  FROM public.events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF NOT public.has_team_role(v_team_id, 'team_owner', 'head_coach', 'assistant_coach') THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  RETURN QUERY
  SELECT
    combined.user_id,
    p.full_name,
    combined.rsvp_status,
    combined.rsvp_note,
    combined.responded_at,
    combined.is_active_trainer
  FROM (
    -- aktuell aktive Trainer, auch ohne Antwort (NULL-Status = "keine Antwort")
    SELECT DISTINCT
      tm.user_id,
      esr.rsvp_status,
      esr.rsvp_note,
      esr.responded_at,
      true AS is_active_trainer
    FROM public.team_memberships  tm
    JOIN public.team_member_roles tmr ON tmr.team_membership_id = tm.id
    JOIN public.roles              r   ON r.id = tmr.role_id
    LEFT JOIN public.event_staff_rsvps esr ON esr.event_id = p_event_id
                                           AND esr.user_id = tm.user_id
    WHERE tm.team_id = v_team_id
      AND tm.status  = 'active'
      AND r.key IN ('team_owner', 'head_coach', 'assistant_coach')

    UNION

    -- historische Antworten von Nutzern, die inzwischen keine aktive
    -- Trainerrolle mehr in diesem Team haben (Historie bleibt sichtbar).
    SELECT
      esr.user_id,
      esr.rsvp_status,
      esr.rsvp_note,
      esr.responded_at,
      false AS is_active_trainer
    FROM public.event_staff_rsvps esr
    WHERE esr.event_id = p_event_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.team_memberships  tm2
        JOIN public.team_member_roles tmr2 ON tmr2.team_membership_id = tm2.id
        JOIN public.roles              r2   ON r2.id = tmr2.role_id
        WHERE tm2.team_id = v_team_id
          AND tm2.user_id = esr.user_id
          AND tm2.status  = 'active'
          AND r2.key IN ('team_owner', 'head_coach', 'assistant_coach')
      )
  ) combined
  LEFT JOIN public.profiles p ON p.id = combined.user_id
  ORDER BY combined.is_active_trainer DESC, p.full_name NULLS LAST;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_staff_rsvps_for_event(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_staff_rsvps_for_event(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.list_staff_rsvps_for_event(uuid) TO authenticated;

-- delete_training(): additiv um Trainer-RSVP-Sperre erweitert.
CREATE OR REPLACE FUNCTION public.delete_training(
  p_event_id uuid,
  p_confirmation text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_team_id uuid;
  v_event_type text;
  v_is_cancelled boolean;
  v_starts_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  SELECT team_id, event_type, is_cancelled, starts_at
  INTO v_team_id, v_event_type, v_is_cancelled, v_starts_at
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND OR v_event_type <> 'training' THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF NOT public.has_team_role(v_team_id, 'team_owner', 'head_coach') THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF p_confirmation IS DISTINCT FROM 'LÖSCHEN' THEN
    RAISE EXCEPTION 'Bestätigungstext ist ungültig';
  END IF;

  IF v_is_cancelled THEN
    RAISE EXCEPTION 'Abgesagtes Training kann nicht gelöscht werden';
  END IF;

  IF v_starts_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Termin hat bereits begonnen und kann nicht gelöscht werden';
  END IF;

  PERFORM 1
  FROM public.event_attendance
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.event_attendance
    WHERE event_id = p_event_id AND rsvp_status IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Training mit Rückmeldungen kann nicht gelöscht werden';
  END IF;

  PERFORM 1
  FROM public.event_staff_rsvps
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.event_staff_rsvps
    WHERE event_id = p_event_id
  ) THEN
    RAISE EXCEPTION 'Training mit Rückmeldungen kann nicht gelöscht werden';
  END IF;

  DELETE FROM public.events
  WHERE id = p_event_id;

  RETURN v_team_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_training(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_training(uuid, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.delete_training(uuid, text) TO authenticated;
