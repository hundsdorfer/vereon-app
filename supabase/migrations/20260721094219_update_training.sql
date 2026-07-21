-- ============================================================
-- Migration: update_training
-- Datei: 20260721094219_update_training.sql
-- Datum: 2026-07-21
--
-- Enthält:
--   RPC (SECURITY DEFINER): update_training()
--   Grants:                 REVOKE/GRANT EXECUTE auf update_training()
--   Policy-Bereinigung:     DROP POLICY events_insert_coach, events_update_coach
--
-- FC-TRAINING-003 „Training bearbeiten": nur team_owner, head_coach,
-- assistant_coach; nur event_type = 'training'; nur solange weder das
-- gespeicherte noch das neu eingereichte starts_at bereits erreicht ist;
-- nur solange das Training nicht abgesagt ist. team_id, club_id, season_id,
-- created_by, event_type, is_cancelled und ends_at sind nicht Teil der
-- Funktionssignatur und bleiben dadurch strukturell unveränderlich.
-- event_attendance/RSVP werden nicht berührt.
-- ============================================================


-- ============================================================
-- 1. RPC: update_training()
--
-- Bewusst "update_training" statt "update_event", weil die Funktion
-- ausschließlich event_type = 'training' bearbeiten darf.
--
-- Prüfreihenfolge:
--   1. auth.uid() vorhanden
--   2. Event per SELECT ... FOR UPDATE laden (Row-Lock gegen parallele
--      cancel_event()/update_training()-Aufrufe auf dasselbe Event)
--   3. Event nicht gefunden ODER event_type <> 'training'
--      -> EIN generischer Fehler ("Termin nicht gefunden"), keine
--      Unterscheidung zwischen "existiert nicht" und "ist kein Training"
--      (Enumerationsschutz)
--   4. keine Trainerrolle (team_owner/head_coach/assistant_coach, KEIN
--      team_manager) -> DERSELBE generische Fehler wie Schritt 3
--   5. is_cancelled = true -> spezifischer Fehler (Nutzer ist an dieser
--      Stelle bereits als berechtigter Trainer verifiziert)
--   6. aktuell gespeichertes starts_at bereits erreicht -> spezifischer Fehler
--   7. neu eingereichtes starts_at bereits erreicht -> spezifischer Fehler
--   8. Titel trimmen/nicht leer
--   9. location/description trimmen, leer -> NULL
--  10. UPDATE ausschließlich title, starts_at, location, description,
--      updated_at
--  11. event_attendance bleibt unberührt
--  12. RETURN team_id (serverseitig ermittelt, für Client-Redirect/
--      Revalidation)
--
-- now() vs. clock_timestamp(): now() ist in PL/pgSQL über die gesamte
-- Funktionslaufzeit auf den Transaktionsstart eingefroren, auch über die
-- Wartezeit eines FOR-UPDATE-Locks hinweg. clock_timestamp() liefert die
-- tatsächliche Wanduhrzeit zum Auswertungszeitpunkt. Da die Zeitprüfungen
-- in Schritt 6/7 eine sicherheits-/fachlich-relevante Grenze durchsetzen
-- (kein reiner Audit-Wert), wird hier bewusst clock_timestamp() verwendet.
-- updated_at (Schritt 10) bleibt bei now(), konsistent mit allen
-- bestehenden Triggern/RPCs im Repo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_training(
  p_event_id    uuid,
  p_title       text,
  p_starts_at   timestamptz,
  p_location    text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_team_id      uuid;
  v_event_type   text;
  v_is_cancelled boolean;
  v_starts_at    timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  SELECT team_id, event_type, is_cancelled, starts_at
  INTO   v_team_id, v_event_type, v_is_cancelled, v_starts_at
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND OR v_event_type <> 'training' THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF NOT public.has_team_role(v_team_id, 'team_owner', 'head_coach', 'assistant_coach') THEN
    RAISE EXCEPTION 'Termin nicht gefunden';
  END IF;

  IF v_is_cancelled THEN
    RAISE EXCEPTION 'Termin wurde abgesagt und kann nicht mehr bearbeitet werden';
  END IF;

  IF v_starts_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Termin hat bereits begonnen und kann nicht mehr bearbeitet werden';
  END IF;

  IF p_starts_at IS NULL THEN
    RAISE EXCEPTION 'Startzeit ist erforderlich';
  END IF;

  IF p_starts_at <= clock_timestamp() THEN
    RAISE EXCEPTION 'Startzeit muss in der Zukunft liegen';
  END IF;

  p_title := trim(p_title);
  IF p_title IS NULL OR char_length(p_title) = 0 THEN
    RAISE EXCEPTION 'Titel darf nicht leer sein';
  END IF;

  p_location    := NULLIF(trim(p_location), '');
  p_description := NULLIF(trim(p_description), '');

  UPDATE public.events
  SET
    title       = p_title,
    starts_at   = p_starts_at,
    location    = p_location,
    description = p_description,
    updated_at  = now()
  WHERE id = p_event_id;

  RETURN v_team_id;
END;
$$;

COMMENT ON FUNCTION public.update_training(uuid, text, timestamptz, text, text) IS
  'Bearbeitet ein Training (event_type=training) vor Beginn. Nur team_owner/head_coach/assistant_coach. '
  'team_id, club_id, season_id, created_by, event_type, is_cancelled, ends_at sind nicht Teil der Signatur '
  'und bleiben unveränderlich. event_attendance/RSVP werden nicht berührt. Gibt team_id zurück.';


-- ============================================================
-- 2. GRANTS: EXECUTE explizit auf authenticated begrenzen
--
-- Postgres vergibt EXECUTE auf neu erstellte Funktionen standardmäßig an
-- PUBLIC (schließt anon ein). Die internen auth.uid()-/Rollenprüfungen
-- bleiben zusätzlich bestehen (Defense-in-Depth, kein Ersatz füreinander).
--
-- Bestehende RPCs (create_event, respond_to_event, cancel_event u.a.) haben
-- kein solches REVOKE/GRANT und laufen daher weiterhin mit Standard-
-- PUBLIC-Execute. Das wird hier NICHT rückwirkend geändert (kein Rückbau
-- bestehender Funktionalität ohne eigenen Auftrag) und ist als separater
-- Security-Folgebedarf in docs/SECURITY.md zu dokumentieren.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.update_training(uuid, text, timestamptz, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_training(uuid, text, timestamptz, text, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.update_training(uuid, text, timestamptz, text, text) TO authenticated;


-- ============================================================
-- 3. POLICY-BEREINIGUNG: dormant Schreib-Policies entfernen
--
-- events_insert_coach und events_update_coach (20260629200000_add_events.sql)
-- sind heute wirkungslos, weil authenticated auf public.events ausschließlich
-- GRANT SELECT besitzt (kein INSERT-/UPDATE-Grant, weder hier noch in
-- 20260627000001_fix_authenticated_table_grants.sql) — Postgres prüft
-- Grants vor RLS. Das Entfernen ändert das Verhalten für Endnutzer nicht,
-- schreibt aber "Schreibzugriff auf events ausschließlich über geprüfte
-- RPCs" strukturell fest, konsistent mit create_event()/cancel_event()/
-- respond_to_event(), die alle ohne begleitende Client-Write-Policy
-- auskommen. Das bestehende GRANT SELECT ON public.events TO authenticated
-- bleibt unverändert bestehen.
-- ============================================================

DROP POLICY IF EXISTS "events_insert_coach" ON public.events;
DROP POLICY IF EXISTS "events_update_coach" ON public.events;
