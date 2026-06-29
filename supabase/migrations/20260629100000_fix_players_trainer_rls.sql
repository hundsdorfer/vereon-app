-- ============================================================
-- Hotfix: players — RLS-Scope-Bug in EXISTS-Subqueries
-- Datum: 2026-06-29
--
-- Root Cause:
--   players_select_trainer_assignment:
--     WHERE pta.player_id = id
--     `id` liegt im inneren SQL-Scope → player_team_assignments.id (PK)
--     → Bedingung = pta.player_id = pta.id → immer false
--
--   players_select_trainer_pending_request:
--     WHERE tjr.player_id = id
--     `id` liegt im inneren SQL-Scope → team_join_requests.id (PK)
--     → Bedingung = tjr.player_id = tjr.id → immer false
--
-- Fix:
--   Zwei SECURITY DEFINER-Hilfsfunktionen ersetzen die EXISTS-
--   Subqueries vollständig. Parameter p_player_id ist eindeutig;
--   kein Scope-Shadowing möglich. Alle Tabellenzugriffe laufen
--   innerhalb der SECURITY DEFINER-Funktion → RLS auf
--   player_team_assignments / team_join_requests wird umgangen,
--   Rollenprüfung via bestehendem has_team_role() bleibt erhalten.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Hilfsfunktion: Trainer darf Spieler lesen
--    Voraussetzung: aktive player_team_assignments-Zeile für
--    ein Team, in dem der User eine Trainerrolle hat.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_trainer_read_player(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.player_team_assignments pta
        WHERE pta.player_id = p_player_id
          AND pta.status    = 'active'
          AND public.has_team_role(
                  pta.team_id,
                  'team_owner', 'head_coach', 'assistant_coach', 'team_manager'
              )
    );
$$;


-- ------------------------------------------------------------
-- 2. Hilfsfunktion: Trainer darf Spieler mit pendender Anfrage lesen
--    Voraussetzung: pending team_join_requests-Zeile für ein
--    Team, in dem der User eine Trainerrolle hat.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_trainer_read_player_pending(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_join_requests tjr
        WHERE tjr.player_id = p_player_id
          AND tjr.status    = 'pending'
          AND public.has_team_role(
                  tjr.team_id,
                  'team_owner', 'head_coach', 'assistant_coach', 'team_manager'
              )
    );
$$;


-- ------------------------------------------------------------
-- 3. Defekte Policy ersetzen: players_select_trainer_assignment
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "players_select_trainer_assignment" ON public.players;

CREATE POLICY "players_select_trainer_assignment"
    ON public.players FOR SELECT
    USING (public.can_trainer_read_player(id));


-- ------------------------------------------------------------
-- 4. Defekte Policy ersetzen: players_select_trainer_pending_request
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "players_select_trainer_pending_request" ON public.players;

CREATE POLICY "players_select_trainer_pending_request"
    ON public.players FOR SELECT
    USING (public.can_trainer_read_player_pending(id));
