-- ============================================================
-- Migration: add_role_management
-- Datei: 20260723100000_add_role_management.sql
-- Datum: 2026-07-23
--
-- Enthält:
--   Tabelle: team_role_audit_log
--   RPC:     grant_assistant_coach()
--   RPC:     revoke_assistant_coach()
--   RPC:     list_assistant_coaches()
--
-- Hintergrund: FC-ROLE-002 / FC-ROLE-003. Ausschließlich team_owner darf die
-- Rolle assistant_coach für ein bestehendes, aktives Teammitglied vergeben
-- oder entziehen. Diese Migration erzeugt/entfernt NIE team_owner- oder
-- head_coach-Zeilen — sie berührt ausschließlich die Rolle assistant_coach.
--
-- Provisionierung: Der bestehende Join-Flow (Self-Player/Guardian) erzeugt
-- ausschließlich player_team_assignments-Zeilen, niemals team_memberships
-- (nur create_independent_team() befüllt team_memberships, für den
-- Team-Ersteller). Es gibt daher aktuell keinen anderen Weg, wie eine
-- zweite Person eine team_memberships-Zeile erhält. grant_assistant_coach()
-- legt diese Zeile deshalb selbst an — aber ausschließlich für Nutzer mit
-- einer nachweisbaren, aktiven Spielerbeziehung zum Team (aktive
-- player_team_assignments-Zeile mit players.user_id = Zielnutzer). Das
-- schließt zusätzlich die seit mehreren Features offene Testinfrastruktur-
-- Lücke: erster legitimer Weg, ein reales assistant_coach-Testkonto zu
-- provisionieren.
--
-- Lifecycle: grant_assistant_coach() legt team_memberships NUR an, wenn
-- noch keine Zeile existiert — eine bestehende, nicht aktive Zeile wird
-- NICHT reaktiviert (das würde stillschweigend alle noch daran hängenden
-- Altrollen wieder wirksam machen); der Fallback-Read sperrt die Zeile
-- (FOR UPDATE), um mit einem gleichzeitigen Entzug zu serialisieren.
-- revoke_assistant_coach() setzt die Mitgliedschaft auf 'inactive', sobald
-- WEDER eine Rolle NOCH eine aktive Spielerbeziehung mehr besteht — damit
-- bleibt sie für weiterhin aktive Spieler nach einem einfachen Rollenentzug
-- aktiv (ein erneuter Grant bleibt möglich) und wird nur bei kombinierter
-- Spieler- plus Rollenentfernung deaktiviert, damit keine dauerhafte,
-- grundlose Teammitgliedschaft zurückbleibt.
--
-- Audit: team_role_audit_log protokolliert jede tatsächliche Vergabe/jeden
-- tatsächlichen Entzug (kein Eintrag bei idempotentem No-Op). assigned_by/
-- assigned_at auf team_member_roles reichen für Entzüge nicht aus, da beim
-- DELETE keine Historie bleibt. ON DELETE SET NULL (nicht CASCADE) auf
-- beiden Nutzerreferenzen, damit ein späterer Account-Löschvorgang weder
-- die Historie vollständig löscht noch dauerhaft blockiert wird.
--
-- Kein ALTER TABLE nötig — rein additiv (neue Tabelle, neue Funktionen).
-- ============================================================


-- ------------------------------------------------------------
-- team_role_audit_log
-- ------------------------------------------------------------
CREATE TABLE public.team_role_audit_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  target_user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  role_key        text        NOT NULL,
  action          text        NOT NULL CHECK (action IN ('granted', 'revoked')),
  performed_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_role_audit_log_select_owner"
  ON public.team_role_audit_log FOR SELECT
  USING (public.has_team_role(team_id, 'team_owner'));

GRANT SELECT ON public.team_role_audit_log TO authenticated;
-- Kein INSERT/UPDATE/DELETE-Grant — geschrieben ausschließlich durch die
-- SECURITY-DEFINER-RPCs unten.


-- ------------------------------------------------------------
-- grant_assistant_coach()
-- Vergibt die Rolle assistant_coach an ein nachweislich aktives Teammitglied
-- (aktiver Spieler). Legt die team_memberships-Zeile bei Bedarf an, aber
-- reaktiviert nie eine bestehende, nicht aktive Zeile.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_assistant_coach(
  p_team_id        uuid,
  p_target_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_membership_id     uuid;
  v_membership_status text;
  v_role_id           uuid;
  v_role_row_id       uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF NOT public.has_team_role(p_team_id, 'team_owner') THEN
    RAISE EXCEPTION 'Keine Berechtigung: team_owner erforderlich';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Eigene Rolle kann nicht auf diesem Weg geändert werden';
  END IF;

  -- Eligibility: nachweisbare, aktive Spielerbeziehung zum Team. Sperrt
  -- dieselbe player_team_assignments-Zeile wie remove_player_from_team()
  -- und serialisiert damit gegen eine gleichzeitige Entfernung.
  PERFORM 1
  FROM public.player_team_assignments pta
  JOIN public.players p ON p.id = pta.player_id
  WHERE pta.team_id = p_team_id
    AND p.user_id   = p_target_user_id
    AND pta.status  = 'active'
  FOR UPDATE OF pta;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Diese Person ist kein aktiver Spieler in diesem Team';
  END IF;

  -- team_memberships nur anlegen, wenn noch keine Zeile existiert. Eine
  -- bestehende, nicht aktive Zeile wird NIE per UPDATE reaktiviert — das
  -- würde stillschweigend alle noch daran hängenden Altrollen (z. B.
  -- head_coach) wieder wirksam machen.
  INSERT INTO public.team_memberships (team_id, user_id, status)
  VALUES (p_team_id, p_target_user_id, 'active')
  ON CONFLICT (team_id, user_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  -- Codex-Review 2: Ohne FOR UPDATE könnte ein gleichzeitiger Revoke
  -- zwischen diesem Read und dem folgenden Rollen-INSERT committen — Grant
  -- würde dann fälschlich Erfolg melden, obwohl die Mitgliedschaft inzwischen
  -- inactive ist. Der Lock serialisiert Grant und Revoke auf derselben Zeile.
  IF v_membership_id IS NULL THEN
    SELECT id, status INTO v_membership_id, v_membership_status
    FROM public.team_memberships
    WHERE team_id = p_team_id AND user_id = p_target_user_id
    FOR UPDATE;

    IF v_membership_id IS NULL OR v_membership_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'Mitgliedschaft ist nicht aktiv';
    END IF;
  END IF;

  SELECT id INTO v_role_id FROM public.roles WHERE key = 'assistant_coach';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rolle "assistant_coach" nicht gefunden. Seed-Daten fehlen.';
  END IF;

  -- Idempotent: erneuter Grant ist ein No-Op, kein Fehler.
  INSERT INTO public.team_member_roles (team_membership_id, role_id, assigned_by)
  VALUES (v_membership_id, v_role_id, auth.uid())
  ON CONFLICT (team_membership_id, role_id) DO NOTHING
  RETURNING id INTO v_role_row_id;

  IF v_role_row_id IS NOT NULL THEN
    INSERT INTO public.team_role_audit_log (team_id, target_user_id, role_key, action, performed_by)
    VALUES (p_team_id, p_target_user_id, 'assistant_coach', 'granted', auth.uid());
  END IF;

  RETURN p_team_id;
END;
$$;

COMMENT ON FUNCTION public.grant_assistant_coach(uuid, uuid) IS
  'Vergibt assistant_coach an einen aktiven Spieler des Teams. Nur team_owner. Idempotent, protokolliert nur echte Neuvergaben in team_role_audit_log.';

REVOKE EXECUTE ON FUNCTION public.grant_assistant_coach(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_assistant_coach(uuid, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.grant_assistant_coach(uuid, uuid) TO authenticated;


-- ------------------------------------------------------------
-- revoke_assistant_coach()
-- Entzieht die Rolle assistant_coach. Die team_memberships-Zeile bleibt
-- aktiv, solange noch eine Rolle ODER eine aktive Spielerbeziehung
-- besteht — nur wenn beides fehlt, wird sie deaktiviert, damit keine
-- dauerhafte, grundlose Teammitgliedschaft zurückbleibt.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_assistant_coach(
  p_team_id        uuid,
  p_target_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
  v_membership_id uuid;
  v_role_id       uuid;
  v_deleted_id    uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF NOT public.has_team_role(p_team_id, 'team_owner') THEN
    RAISE EXCEPTION 'Keine Berechtigung: team_owner erforderlich';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Eigene Rolle kann nicht auf diesem Weg geändert werden';
  END IF;

  SELECT id INTO v_membership_id
  FROM public.team_memberships
  WHERE team_id = p_team_id AND user_id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Diese Person ist kein Co-Trainer';
  END IF;

  SELECT id INTO v_role_id FROM public.roles WHERE key = 'assistant_coach';
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Rolle "assistant_coach" nicht gefunden. Seed-Daten fehlen.';
  END IF;

  -- Nicht idempotent: ein Entzug ohne vorhandene Rolle ist ein harter Fehler
  -- (analog zum "bereits entfernt"-Verhalten von remove_player_from_team()).
  DELETE FROM public.team_member_roles
  WHERE team_membership_id = v_membership_id AND role_id = v_role_id
  RETURNING id INTO v_deleted_id;

  IF v_deleted_id IS NULL THEN
    RAISE EXCEPTION 'Diese Person ist kein Co-Trainer';
  END IF;

  INSERT INTO public.team_role_audit_log (team_id, target_user_id, role_key, action, performed_by)
  VALUES (p_team_id, p_target_user_id, 'assistant_coach', 'revoked', auth.uid());

  -- Lifecycle (Codex-Review 2 präzisiert): eine Mitgliedschaft, die dieses
  -- Feature selbst angelegt hat, bleibt nicht grundlos aktiv, wenn WEDER
  -- eine Rolle noch eine aktive Spielerbeziehung mehr besteht. Solange die
  -- Person weiterhin aktiver Spieler ist, bleibt die Mitgliedschaft aktiv —
  -- sonst würde ein einfacher Revoke (ohne vorherige Spielerentfernung) die
  -- Mitgliedschaft deaktivieren und ein direkt anschließender erneuter Grant
  -- an derselben, weiterhin aktiven Person fälschlich mit "Mitgliedschaft
  -- ist nicht aktiv" scheitern.
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_roles WHERE team_membership_id = v_membership_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.player_team_assignments pta
    JOIN public.players p ON p.id = pta.player_id
    WHERE pta.team_id = p_team_id
      AND p.user_id   = p_target_user_id
      AND pta.status  = 'active'
  ) THEN
    UPDATE public.team_memberships SET status = 'inactive' WHERE id = v_membership_id;
  END IF;

  RETURN p_team_id;
END;
$$;

COMMENT ON FUNCTION public.revoke_assistant_coach(uuid, uuid) IS
  'Entzieht assistant_coach. Nur team_owner. Deaktiviert die Mitgliedschaft nur, wenn weder eine Rolle noch eine aktive Spielerbeziehung verbleibt. Protokolliert in team_role_audit_log.';

REVOKE EXECUTE ON FUNCTION public.revoke_assistant_coach(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_assistant_coach(uuid, uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.revoke_assistant_coach(uuid, uuid) TO authenticated;


-- ------------------------------------------------------------
-- list_assistant_coaches()
-- Liefert ausschließlich die aktuellen assistant_coach-Inhaber eines Teams,
-- bewusst eng geschnitten für die Revoke-Anzeige — kein allgemeiner
-- Mitglieder-/Rollen-Viewer (das bleibt die separate, offene FC-ROLE-001).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_assistant_coaches(p_team_id uuid)
RETURNS TABLE (
  user_id   uuid,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nicht eingeloggt';
  END IF;

  IF NOT public.has_team_role(p_team_id, 'team_owner') THEN
    RAISE EXCEPTION 'Team nicht gefunden';
  END IF;

  RETURN QUERY
  SELECT tm.user_id, p.full_name
  FROM public.team_memberships  tm
  JOIN public.team_member_roles tmr ON tmr.team_membership_id = tm.id
  JOIN public.roles              r   ON r.id = tmr.role_id
  LEFT JOIN public.profiles      p   ON p.id = tm.user_id
  WHERE tm.team_id = p_team_id
    AND tm.status  = 'active'
    AND r.key      = 'assistant_coach'
  ORDER BY p.full_name NULLS LAST;
END;
$$;

COMMENT ON FUNCTION public.list_assistant_coaches(uuid) IS
  'Listet aktuelle assistant_coach-Inhaber eines Teams. Nur team_owner. Bewusst nicht als allgemeiner Rollen-Viewer nutzbar (siehe FC-ROLE-001).';

REVOKE EXECUTE ON FUNCTION public.list_assistant_coaches(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_assistant_coaches(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.list_assistant_coaches(uuid) TO authenticated;
