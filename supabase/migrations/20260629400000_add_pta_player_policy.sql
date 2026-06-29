-- Additive RLS-Erweiterung: Self-Player darf eigene aktive Zuordnung lesen.
-- Keine bestehenden Policies werden geändert oder gelöscht.
--
-- Hintergrund: pta_select_trainer und pta_select_guardian existieren bereits.
-- Self-Player hatten keinen SELECT-Zugriff auf player_team_assignments,
-- weshalb die Spielerliste auf der Team-Seite für sie leer erschien.
--
-- Nutzung von is_own_player_attendance(player_id): prüft players.user_id = auth.uid().
-- status = 'active' verhindert, dass ausgetretene Spieler alte Einträge sehen.

CREATE POLICY "pta_select_player"
  ON public.player_team_assignments FOR SELECT
  USING (
    status = 'active'
    AND public.is_own_player_attendance(player_id)
  );
