-- Additive RLS-Erweiterung: Self-Player und Guardians können
-- ihr Team und die Events ihres Teams lesen.
-- Keine bestehenden Policies werden geändert oder gelöscht.

-- Hilfsfunktion: TRUE wenn der aktuelle User ein aktiver Spieler im Team ist.
-- Prüft player_team_assignments.status = 'active' + players.user_id = auth.uid().
CREATE OR REPLACE FUNCTION public.is_player_in_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.player_team_assignments pta
    JOIN   public.players p ON p.id = pta.player_id
    WHERE  pta.team_id = p_team_id
      AND  pta.status  = 'active'
      AND  p.user_id   = auth.uid()
  );
$$;

-- Hilfsfunktion: TRUE wenn der aktuelle User Guardian eines aktiven Spielers
-- im Team ist und die Beziehung verifiziert ist (verified_at IS NOT NULL).
CREATE OR REPLACE FUNCTION public.is_guardian_in_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.player_team_assignments pta
    JOIN   public.player_guardians pg ON pg.player_id = pta.player_id
    WHERE  pta.team_id         = p_team_id
      AND  pta.status          = 'active'
      AND  pg.guardian_user_id = auth.uid()
      AND  pg.verified_at      IS NOT NULL
  );
$$;

-- teams: Self-Player darf sein eigenes Team lesen.
CREATE POLICY "teams_select_player"
  ON public.teams FOR SELECT
  USING (public.is_player_in_team(id));

-- teams: Guardian darf das Team seines verknüpften Kindes lesen.
CREATE POLICY "teams_select_guardian"
  ON public.teams FOR SELECT
  USING (public.is_guardian_in_team(id));

-- events: Self-Player darf Events seines Teams lesen.
CREATE POLICY "events_select_player"
  ON public.events FOR SELECT
  USING (public.is_player_in_team(team_id));

-- events: Guardian darf Events des Teams seines verknüpften Kindes lesen.
CREATE POLICY "events_select_guardian"
  ON public.events FOR SELECT
  USING (public.is_guardian_in_team(team_id));
