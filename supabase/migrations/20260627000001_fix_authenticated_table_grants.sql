-- Fehlende Postgres-GRANTs für die Rollen authenticated und anon.
-- Hintergrund: RLS-Policies wurden gesetzt, aber Postgres prüft GRANTs VOR RLS.
-- Ohne GRANT SELECT gibt Postgres sofort "permission denied" zurück, RLS läuft gar nicht.
-- RLS bleibt die eigentliche Datenfilterung — GRANTs öffnen nur die Schema-Tür.
-- Schreibzugriffe laufen ausschließlich über SECURITY DEFINER RPCs, daher keine
-- INSERT/UPDATE/DELETE-Grants nötig.

-- Schema-Zugang (Voraussetzung für jede Tabellen- und Funktionsnutzung)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ─── Teams und Mitgliedschaften ───────────────────────────────────────────────
-- Direkt über Supabase Client gelesen; RLS filtert auf eigene Teams/Mitgliedschaften.
GRANT SELECT ON public.teams               TO authenticated;
GRANT SELECT ON public.team_memberships    TO authenticated;
GRANT SELECT ON public.team_member_roles   TO authenticated;

-- ─── Rollen und Berechtigungen (Lookup-Tabellen) ─────────────────────────────
-- Werden für Rollennamen, Permission-Checks und RLS-Hilfsfunktionen gelesen.
GRANT SELECT ON public.roles               TO authenticated;
GRANT SELECT ON public.permissions         TO authenticated;
GRANT SELECT ON public.role_permissions    TO authenticated;

-- ─── Nutzerprofile ────────────────────────────────────────────────────────────
GRANT SELECT ON public.profiles            TO authenticated;

-- ─── Vereine, Vereinsmitgliedschaften und Saisons ────────────────────────────
GRANT SELECT ON public.clubs               TO authenticated;
GRANT SELECT ON public.club_memberships    TO authenticated;
GRANT SELECT ON public.club_member_roles   TO authenticated;
GRANT SELECT ON public.seasons             TO authenticated;

-- ─── MVP 0A: Einladungslinks und Join-Requests ───────────────────────────────
-- Trainer lesen eigene Links; RLS beschränkt Sicht auf eigene Teams.
-- Join-Requests: Trainer sieht nur Requests für seine Teams (via RLS).
-- Guardian-seitiger Read läuft über SECURITY DEFINER-RPCs, kein direkter Grant nötig.
GRANT SELECT ON public.team_invitation_links TO authenticated;
GRANT SELECT ON public.team_join_requests    TO authenticated;

-- ─── MVP 1: Spieler und Erziehungsberechtigte ────────────────────────────────
-- Tabellen existieren bereits im Schema; Grants vorab setzen,
-- damit Phase C nicht blockiert wird sobald die Daten befüllt werden.
GRANT SELECT ON public.players                  TO authenticated;
GRANT SELECT ON public.player_guardians         TO authenticated;
GRANT SELECT ON public.player_team_assignments  TO authenticated;
