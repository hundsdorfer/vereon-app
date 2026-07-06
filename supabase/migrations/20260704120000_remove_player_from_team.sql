-- ============================================================
-- Migration: remove_player_from_team
-- Datei: 20260704120000_remove_player_from_team.sql
-- Datum: 2026-07-04
--
-- Enthält:
--   Hilfsfunktion (SECURITY DEFINER): is_active_player_assignment()
--   RPC:            remove_player_from_team()
--   Geändert:       respond_to_event() — prüft jetzt zusätzlich, ob der
--                   Spieler noch aktiv im Team des Termins ist.
--
-- Hintergrund:
--   player_team_assignments.status/left_at existieren bereits seit
--   Migration 002, wurden bisher aber von keinem Code-Pfad beschrieben.
--   respond_to_event() prüfte bisher nur players.user_id = auth.uid()
--   ODER is_guardian_of(p_player_id) — nicht, ob die Teamzuordnung noch
--   aktiv ist. Ein entfernter Spieler (oder dessen Guardian) konnte
--   dadurch weiterhin RSVPs für Termine dieses Teams abgeben, solange
--   die event_attendance-Zeile bereits existierte. Diese Migration
--   schließt die Lücke.
--
--   Kein ALTER TABLE nötig — rein additiv (neue Funktion,
--   CREATE OR REPLACE auf einer bestehenden Funktion).
-- ============================================================


-- ------------------------------------------------------------
-- is_active_player_assignment()
-- Prüft ob der Spieler eine aktive player_team_assignments-Zuordnung
-- zum angegebenen Team hat.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_player_assignment(
  p_player_id uuid,
  p_team_id   uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.player_team_assignments pta
    WHERE pta.player_id = p_player_id
      AND pta.team_id   = p_team_id
      AND pta.status    = 'active'
  );
$$;


-- ------------------------------------------------------------
-- respond_to_event() — CREATE OR REPLACE, Signatur unverändert.
-- Ergänzt: Prüfung, dass der Spieler noch aktiv im Team des Termins ist.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_event(
  p_event_id    uuid,
  p_player_id   uuid,
  p_rsvp_status text,
  p_rsvp_note   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_is_cancelled boolean;
  v_team_id      uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF p_rsvp_status NOT IN ('attending', 'declined', 'maybe') THEN
    RAISE EXCEPTION
      'Ungültiger RSVP-Status "%". Erlaubt: attending, declined, maybe', p_rsvp_status;
  END IF;

  -- Termin prüfen: existiert und ist nicht abgesagt
  SELECT is_cancelled, team_id INTO v_is_cancelled, v_team_id
  FROM public.events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF v_is_cancelled THEN
    RAISE EXCEPTION 'Termin wurde abgesagt — RSVP nicht möglich';
  END IF;

  -- Berechtigung prüfen:
  --   Self-Player:  players.user_id = auth.uid()
  --   Guardian:     player_guardians.verified_at IS NOT NULL (via is_guardian_of)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id      = p_player_id
        AND p.user_id = auth.uid()
    )
    OR public.is_guardian_of(p_player_id)
  ) THEN
    RAISE EXCEPTION 'Keine Berechtigung für diesen Spieler';
  END IF;

  -- Team-Zugehörigkeit prüfen: entfernte Spieler (status <> 'active')
  -- dürfen nicht mehr RSVPen, auch wenn eine alte Attendance-Zeile existiert.
  IF NOT public.is_active_player_assignment(p_player_id, v_team_id) THEN
    RAISE EXCEPTION 'Spieler ist nicht (mehr) aktiv in diesem Team';
  END IF;

  UPDATE public.event_attendance
  SET
    rsvp_status          = p_rsvp_status,
    rsvp_note            = p_rsvp_note,
    responded_by_user_id = auth.uid(),
    responded_at         = now(),
    updated_at           = now()
  WHERE event_id  = p_event_id
    AND player_id = p_player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Kein Attendance-Eintrag für diesen Spieler und Termin gefunden. '
      'Der Spieler ist möglicherweise nicht (mehr) im Team.';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.respond_to_event(uuid, uuid, text, text) IS
  'RSVP für einen Termin. Erlaubt: Self-Player oder verifizierter Guardian, nur bei aktiver Teamzuordnung.';


-- ------------------------------------------------------------
-- remove_player_from_team()
-- Entfernt einen Spieler aus dem Team (Soft-Delete via status = 'left').
-- Kein Hard-Delete von players/player_team_assignments, kein Löschen von
-- event_attendance-Historie. Nur team_owner/head_coach berechtigt —
-- bewusst ohne assistant_coach (Struktur-/Mitgliedschaftsentscheidung).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_player_from_team(p_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_assignment public.player_team_assignments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  SELECT * INTO v_assignment
  FROM public.player_team_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Zuordnung nicht gefunden';
  END IF;

  IF NOT public.has_team_role(v_assignment.team_id, 'team_owner', 'head_coach') THEN
    RAISE EXCEPTION 'Keine Berechtigung: team_owner oder head_coach erforderlich';
  END IF;

  IF v_assignment.status = 'left' THEN
    RAISE EXCEPTION 'Spieler ist bereits nicht mehr im Team';
  END IF;

  UPDATE public.player_team_assignments
  SET status = 'left', left_at = now()
  WHERE id = p_assignment_id;
END;
$$;

COMMENT ON FUNCTION public.remove_player_from_team(uuid) IS
  'Entfernt einen Spieler aus dem Team (status=left, left_at=now()). Kein Hard-Delete, Attendance-Historie bleibt erhalten. Nur team_owner/head_coach.';
