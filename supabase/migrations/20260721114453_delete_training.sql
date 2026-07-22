-- FC-TRAINING-004: Ein irrtümlich angelegtes Training darf ausschließlich
-- durch team_owner/head_coach, vor Beginn und ohne abgegebene RSVP hart
-- gelöscht werden. Automatisch angelegte event_attendance-Zeilen mit
-- rsvp_status IS NULL blockieren nicht. Trainer-RSVP ist noch nicht
-- implementiert; bei Einführung von event_staff_rsvps muss diese RPC in
-- derselben Migration um eine atomare Prüfung dieser Tabelle ergänzt werden.

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

  -- Existenz und Typ fremder Termine werden gegenüber unberechtigten Nutzern
  -- nicht offengelegt.
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

  -- Sperrt alle vorhandenen Teilnahmezeilen gegen parallele RSVP-Updates.
  -- Das FOR-UPDATE-Lock auf dem Event verhindert zugleich neue FK-Referenzen,
  -- bis die Löschentscheidung abgeschlossen ist.
  PERFORM 1
  FROM public.event_attendance
  WHERE event_id = p_event_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM public.event_attendance
    WHERE event_id = p_event_id
      AND rsvp_status IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Training mit Rückmeldungen kann nicht gelöscht werden';
  END IF;

  DELETE FROM public.events
  WHERE id = p_event_id;

  RETURN v_team_id;
END;
$$;

COMMENT ON FUNCTION public.delete_training(uuid, text) IS
  'Löscht ein irrtümlich angelegtes Training vor Beginn ohne abgegebene RSVP. '
  'Nur team_owner/head_coach und nur mit exaktem Bestätigungstext LÖSCHEN.';

REVOKE EXECUTE ON FUNCTION public.delete_training(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_training(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_training(uuid, text) TO authenticated;
