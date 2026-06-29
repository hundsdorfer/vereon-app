-- ============================================================
-- Migration: add_events — Phase N.1
-- Datei: 20260629200000_add_events.sql
-- Datum: 2026-06-29
--
-- Enthält:
--   Tabellen:       public.events, public.event_attendance
--   Trigger:        updated_at (beide Tabellen),
--                   Auto-Attendance bei Event-Erstellung
--   RLS:            SELECT / INSERT / UPDATE für beide Tabellen
--                   Kein direktes DELETE (cancel_event() für Soft-Cancel)
--   Hilfsfunktionen (SECURITY DEFINER):
--                   is_trainer_for_event(p_event_id)
--                   is_own_player_attendance(p_player_id)
--   Indexes:        4
--   RPCs:           create_event(), respond_to_event(), cancel_event()
--   Geändert:       approve_join_request() — Attendance-Backfill für neue Spieler
--
-- Zeitzone:
--   starts_at und ends_at werden als timestamptz (UTC) gespeichert.
--   Phase N.2 (UI) muss datetime-local-Inputs als Europe/Vienna
--   interpretieren und den UTC-Offset vor dem RPC-Aufruf einrechnen.
--   Kein DB-seitiges Timezone-Casting — Verantwortung liegt im Client.
-- ============================================================


-- ============================================================
-- 1. TABELLEN
-- ============================================================

-- events: Kalendereinträge für ein Team
-- club_id wird intern aus teams.club_id abgeleitet — kein direkter Client-Input
-- Kein Hard-Delete: Absagen via is_cancelled = true (cancel_event RPC)
-- created_by NOT NULL: Trainer-User darf nicht gelöscht werden solange Events existieren.
--   DSGVO-Hinweis: Falls User-Löschung nötig wird, muss created_by nullable werden (Phase 2).
CREATE TABLE public.events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid        NOT NULL REFERENCES public.teams(id)   ON DELETE CASCADE,
  club_id      uuid        REFERENCES public.clubs(id)            ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES auth.users(id),
  event_type   text        NOT NULL DEFAULT 'training'
    CHECK (event_type IN ('training', 'match', 'other')),
  title        text        NOT NULL CHECK (char_length(trim(title)) > 0),
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz,
  location     text,
  description  text,
  is_cancelled boolean     NOT NULL DEFAULT false,
  season_id    uuid        REFERENCES public.seasons(id)          ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_ends_after_starts CHECK (
    ends_at IS NULL OR ends_at > starts_at
  )
);

-- event_attendance: RSVP und Anwesenheit pro Spieler pro Termin
-- player_id ist Primäranker — funktioniert auch ohne Auth-Account (Guardian-Kinder)
-- ON DELETE CASCADE: Spieler- oder Event-Löschung zieht Attendance-Zeilen mit
-- responded_by_user_id ON DELETE SET NULL: User-Löschung löscht nicht den RSVP-Eintrag
CREATE TABLE public.event_attendance (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             uuid        NOT NULL REFERENCES public.events(id)  ON DELETE CASCADE,
  player_id            uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  responded_by_user_id uuid        REFERENCES auth.users(id)             ON DELETE SET NULL,
  rsvp_status          text
    CHECK (rsvp_status IS NULL OR rsvp_status IN ('attending', 'declined', 'maybe')),
  rsvp_note            text,
  responded_at         timestamptz,
  attended             boolean,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
);


-- ============================================================
-- 2. TRIGGER-FUNKTION: Auto-Attendance bei Event-Erstellung
--
-- SECURITY DEFINER: event_attendance hat keine direkte INSERT-Policy —
-- der Trigger benötigt erhöhte Rechte, um Zeilen anlegen zu können.
-- Wird AFTER INSERT ausgelöst, damit events.id bereits gesetzt ist.
-- ON CONFLICT DO NOTHING: idempotent, verhindert Fehler bei Wiederholung.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_attendance_for_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.event_attendance (event_id, player_id)
  SELECT NEW.id, pta.player_id
  FROM public.player_team_assignments pta
  WHERE pta.team_id = NEW.team_id
    AND pta.status  = 'active'
  ON CONFLICT (event_id, player_id) DO NOTHING;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 3. TRIGGER ANLEGEN
-- ============================================================

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_event_attendance_updated_at
  BEFORE UPDATE ON public.event_attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-Attendance: AFTER INSERT damit events.id bereits vergeben ist
CREATE TRIGGER trg_events_create_attendance
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.create_attendance_for_event();


-- ============================================================
-- 4. RLS AKTIVIEREN
-- Deny by default: ohne explizite Policy kein Zugriff
-- ============================================================

ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS-HILFSFUNKTIONEN (SECURITY DEFINER)
--
-- Explizite Parameternamen verhindern SQL-Scope-Shadowing
-- (Lerneffekt aus Hotfix fix_players_trainer_rls:
--  id in EXISTS-Subqueries wurde als innerer Scope aufgelöst).
-- ============================================================

-- Prüft ob auth.uid() eine Trainerrolle im Team des Events hat.
-- Verwendet p_event_id-Parameter — keine Scope-Ambiguität mit events.id möglich.
CREATE OR REPLACE FUNCTION public.is_trainer_for_event(p_event_id uuid)
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
        e.team_id,
        'team_owner', 'head_coach', 'assistant_coach', 'team_manager'
      )
  );
$$;

-- Prüft ob der Spieler des Attendance-Eintrags dem auth.uid()-User gehört.
-- Verwendet p_player_id-Parameter — keine Scope-Ambiguität mit players.id möglich.
CREATE OR REPLACE FUNCTION public.is_own_player_attendance(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.id      = p_player_id
      AND p.user_id = auth.uid()
  );
$$;


-- ============================================================
-- 6. RLS-POLICIES
-- Benennungsschema: "<tabelle>_<operation>_<wer>"
-- Schreibzugriff ausschließlich über SECURITY DEFINER RPCs:
--   create_event()         → INSERT events + Auto-Attendance-Trigger
--   respond_to_event()     → UPDATE event_attendance (rsvp)
--   cancel_event()         → UPDATE events.is_cancelled
--   approve_join_request() → INSERT event_attendance (Backfill neue Spieler)
-- ============================================================

-- events: SELECT für alle aktiven Teammitglieder
CREATE POLICY "events_select_team_member"
  ON public.events FOR SELECT
  USING (public.is_team_member(team_id));

-- events: INSERT für Coaches (Termin erstellen)
-- team_id und club_id werden über create_event() RPC gesetzt —
-- direkter INSERT durch Client erfordert trotzdem Rollenprüfung als zweite Linie
CREATE POLICY "events_insert_coach"
  ON public.events FOR INSERT
  WITH CHECK (
    public.has_team_role(team_id, 'team_owner', 'head_coach', 'assistant_coach')
  );

-- events: UPDATE für Coaches (Titel, Ort, Zeit korrigieren)
-- Kein Hard-Delete: Absagen via cancel_event() RPC
CREATE POLICY "events_update_coach"
  ON public.events FOR UPDATE
  USING (
    public.has_team_role(team_id, 'team_owner', 'head_coach', 'assistant_coach')
  )
  WITH CHECK (
    public.has_team_role(team_id, 'team_owner', 'head_coach', 'assistant_coach')
  );

-- event_attendance: SELECT für Trainer (alle RSVP des Teams)
CREATE POLICY "ea_select_trainer"
  ON public.event_attendance FOR SELECT
  USING (public.is_trainer_for_event(event_id));

-- event_attendance: SELECT für Self-Player (eigener RSVP-Eintrag)
CREATE POLICY "ea_select_own_player"
  ON public.event_attendance FOR SELECT
  USING (public.is_own_player_attendance(player_id));

-- event_attendance: SELECT für Guardian (Kinder mit verified_at in player_guardians)
-- is_guardian_of() ist aus Migration 002 vorhanden und prüft verified_at IS NOT NULL
CREATE POLICY "ea_select_guardian"
  ON public.event_attendance FOR SELECT
  USING (public.is_guardian_of(player_id));


-- ============================================================
-- 7. INDEXES
-- ============================================================

-- events: Team + Zeitraum-Abfragen (nächste Trainings, zukünftige Events)
CREATE INDEX idx_events_team_starts
  ON public.events(team_id, starts_at);

-- events: Team + is_cancelled (aktive Events filtern)
CREATE INDEX idx_events_team_cancelled
  ON public.events(team_id, is_cancelled);

-- event_attendance: JOIN über event_id
CREATE INDEX idx_ea_event
  ON public.event_attendance(event_id);

-- event_attendance: Lookup über player_id (Guardian-Child-RSVP, eigene Einträge)
CREATE INDEX idx_ea_player
  ON public.event_attendance(player_id);


-- ============================================================
-- 8. GRANTS
-- Supabase: authenticated role braucht explizite SELECT-Grants.
-- INSERT/UPDATE/DELETE laufen ausschließlich über SECURITY DEFINER RPCs.
-- ============================================================

GRANT SELECT ON public.events           TO authenticated;
GRANT SELECT ON public.event_attendance TO authenticated;


-- ============================================================
-- 9. SECURITY DEFINER RPCs
-- Alle: auth.uid() IS NOT NULL prüfen, vollständig qualifizierte public.*
-- ============================================================


-- ------------------------------------------------------------
-- create_event()
-- Legt Termin für ein Team an.
-- club_id wird intern aus teams.club_id abgeleitet — kein Client-Input.
-- Auto-Attendance-Trigger (trg_events_create_attendance) läuft danach automatisch.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_event(
  p_team_id     uuid,
  p_title       text,
  p_starts_at   timestamptz,
  p_event_type  text        DEFAULT 'training',
  p_ends_at     timestamptz DEFAULT NULL,
  p_location    text        DEFAULT NULL,
  p_description text        DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_club_id  uuid;
  v_event_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF NOT public.has_team_role(p_team_id, 'team_owner', 'head_coach', 'assistant_coach') THEN
    RAISE EXCEPTION 'Keine Berechtigung: Trainerrolle (team_owner, head_coach oder assistant_coach) erforderlich';
  END IF;

  p_title := trim(p_title);
  IF p_title IS NULL OR char_length(p_title) = 0 THEN
    RAISE EXCEPTION 'Titel darf nicht leer sein';
  END IF;

  IF p_event_type NOT IN ('training', 'match', 'other') THEN
    RAISE EXCEPTION 'Ungültiger Termintyp "%". Erlaubt: training, match, other', p_event_type;
  END IF;

  IF p_starts_at IS NULL THEN
    RAISE EXCEPTION 'Startzeit ist erforderlich';
  END IF;

  IF p_ends_at IS NOT NULL AND p_ends_at <= p_starts_at THEN
    RAISE EXCEPTION 'Endzeit muss nach Startzeit liegen';
  END IF;

  -- club_id intern aus Team ableiten — kein Client-Input für dieses Feld
  SELECT club_id INTO v_club_id
  FROM public.teams
  WHERE id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team nicht gefunden';
  END IF;

  INSERT INTO public.events (
    team_id, club_id, created_by,
    event_type, title,
    starts_at, ends_at,
    location, description
  ) VALUES (
    p_team_id, v_club_id, auth.uid(),
    p_event_type, p_title,
    p_starts_at, p_ends_at,
    p_location, p_description
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.create_event(uuid, text, timestamptz, text, timestamptz, text, text) IS
  'Legt Termin für ein Team an. club_id intern aus teams abgeleitet. Auto-Attendance-Trigger folgt.';


-- ------------------------------------------------------------
-- respond_to_event()
-- Self-Player oder verifizierter Guardian antwortet für p_player_id.
-- Guardian-RSVP: DB-seitig vorbereitet. Phase-N.4-UI exponiert zunächst
-- nur Self-Player-RSVP — Guardian-UI folgt in späterem Phase (nach MVP 1).
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF p_rsvp_status NOT IN ('attending', 'declined', 'maybe') THEN
    RAISE EXCEPTION
      'Ungültiger RSVP-Status "%". Erlaubt: attending, declined, maybe', p_rsvp_status;
  END IF;

  -- Termin prüfen: existiert und ist nicht abgesagt
  SELECT is_cancelled INTO v_is_cancelled
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
  'RSVP für einen Termin. Erlaubt: Self-Player oder verifizierter Guardian. Guardian-UI ab MVP 1.';


-- ------------------------------------------------------------
-- cancel_event()
-- Sagt Termin ab (is_cancelled = true). Kein Hard-Delete.
-- Nur Coaches des Teams dürfen einen Termin absagen.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
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
    RAISE EXCEPTION 'Keine Berechtigung: Trainerrolle (team_owner, head_coach oder assistant_coach) erforderlich';
  END IF;

  UPDATE public.events
  SET is_cancelled = true, updated_at = now()
  WHERE id = p_event_id;
END;
$$;

COMMENT ON FUNCTION public.cancel_event(uuid) IS
  'Sagt Termin ab (is_cancelled = true). Kein Hard-Delete. Nur Coaches des Teams.';


-- ============================================================
-- 10. approve_join_request() ERWEITERN
--
-- Neue Funktionalität: Nach Anlegen des player_team_assignments-Eintrags
-- werden Attendance-Zeilen für alle zukünftigen, nicht abgesagten
-- Events des Teams erzeugt (Backfill für später beigetretene Spieler).
--
-- ON CONFLICT DO NOTHING: verhindert Fehler falls Zeile bereits existiert
-- (z.B. wenn der Spieler vorher schon im Team war und wieder hinzugefügt wird).
-- Bestehende Funktionalität bleibt unverändert.
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_request       public.team_join_requests%ROWTYPE;
  v_assignment_id uuid;
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

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Anfrage ist nicht mehr offen (Status: %)', v_request.status;
  END IF;

  IF v_request.player_id IS NULL THEN
    RAISE EXCEPTION 'Anfrage hat keinen zugeordneten Spieler (bereits gelöscht)';
  END IF;

  IF NOT public.has_team_role(v_request.team_id, 'team_owner', 'head_coach') THEN
    RAISE EXCEPTION 'Keine Berechtigung: team_owner oder head_coach erforderlich';
  END IF;

  INSERT INTO public.player_team_assignments (player_id, team_id)
  VALUES (v_request.player_id, v_request.team_id)
  RETURNING id INTO v_assignment_id;

  UPDATE public.team_join_requests
  SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_request_id;

  -- Attendance-Backfill: zukünftige, nicht abgesagte Events des Teams
  -- für den neu angenommenen Spieler anlegen.
  -- starts_at >= now(): vergangene Events werden nicht rückwirkend befüllt.
  INSERT INTO public.event_attendance (event_id, player_id)
  SELECT e.id, v_request.player_id
  FROM public.events e
  WHERE e.team_id      = v_request.team_id
    AND e.is_cancelled = false
    AND e.starts_at    >= now()
  ON CONFLICT (event_id, player_id) DO NOTHING;

  RETURN v_assignment_id;
END;
$$;

COMMENT ON FUNCTION public.approve_join_request(uuid) IS
  'Nimmt Beitrittsanfrage an: erstellt player_team_assignments und Attendance-Backfill für zukünftige Events.';
