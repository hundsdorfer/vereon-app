-- ============================================================
-- Migration 002 — MVP 0A Team Flows
-- Datei: 20260625221615_mvp0a_team_flows.sql
-- Datum: 2026-06-26
-- Tabellen:   5   (players, player_guardians, team_invitation_links,
--                  team_join_requests, player_team_assignments)
-- Funktionen: 10  (is_guardian_of + 9 SECURITY DEFINER)
-- Trigger:    1   (players updated_at)
-- Policies:   10  (nur SELECT — kein direkter Client-Schreibzugriff)
-- Indexes:    10  (+ 1 implizit via UNIQUE auf token_hash)
-- ============================================================
--
-- Reihenfolge:
--   1. Extension pgcrypto
--   2. Tabellen
--   3. Trigger
--   4. RLS aktivieren
--   5. RLS-Hilfsfunktion is_guardian_of()
--   6. RLS-Policies
--   7. Indexes
--   8. SECURITY DEFINER Funktionen
-- ============================================================

-- ============================================================
-- 1. EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- 2. TABELLEN
-- ============================================================

-- players
-- Minimal-Profil. Kein team_id, kein club_id — Zuordnung via player_team_assignments.
-- created_by nullable: User-Löschung darf keine aktiven Spielerdaten blockieren.
CREATE TABLE public.players (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name  text        NOT NULL CHECK (char_length(trim(first_name)) > 0),
    last_name   text        NOT NULL CHECK (char_length(trim(last_name))  > 0),
    birth_year  integer     CHECK (birth_year IS NULL OR birth_year BETWEEN 1900 AND 2100),
    position    text,
    jersey_nr   integer,
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- player_guardians
-- Verbindet Erziehungsberechtigte mit Spielern.
-- verified_at wird atomar in submit_join_request() gesetzt — Einwilligungsnachweis MVP 0A.
CREATE TABLE public.player_guardians (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id        uuid        NOT NULL REFERENCES public.players(id)    ON DELETE CASCADE,
    guardian_user_id uuid        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
    verified_at      timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (player_id, guardian_user_id)
);

-- team_invitation_links
-- Wiederverwendbare Einladungslinks. Nur token_hash gespeichert, kein raw token.
-- created_by nullable: gelöschter Trainer darf Team-Daten nicht blockieren.
CREATE TABLE public.team_invitation_links (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    token_hash  text        NOT NULL,
    max_uses    integer     NOT NULL DEFAULT 50 CHECK (max_uses > 0),
    use_count   integer     NOT NULL DEFAULT 0  CHECK (use_count >= 0),
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (token_hash),
    CONSTRAINT til_use_count_within_max CHECK (use_count <= max_uses)
);

-- team_join_requests
-- Beitrittsanfragen via Einladungslink.
-- player_id nullable + ON DELETE SET NULL: Bei DSGVO-Löschung des players
-- bleibt der Anfrage-Datensatz als Audit-Spur ohne Kindesdaten erhalten.
CREATE TABLE public.team_join_requests (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id            uuid        NOT NULL REFERENCES public.teams(id)              ON DELETE CASCADE,
    invitation_link_id uuid        REFERENCES public.team_invitation_links(id)      ON DELETE SET NULL,
    guardian_user_id   uuid        NOT NULL REFERENCES auth.users(id)               ON DELETE CASCADE,
    player_id          uuid        REFERENCES public.players(id)                    ON DELETE SET NULL,
    status             text        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    reviewed_by        uuid        REFERENCES auth.users(id),
    reviewed_at        timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- player_team_assignments
-- Ordnet Spieler einem Team zu. Kein season_id in MVP 0A (kommt in Migration 005).
-- UNIQUE(player_id, team_id) wird in Migration 005 auf (player_id, team_id, season_id) erweitert.
CREATE TABLE public.player_team_assignments (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   uuid        NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    team_id     uuid        NOT NULL REFERENCES public.teams(id)   ON DELETE CASCADE,
    status      text        NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'loaned_out', 'left')),
    joined_at   timestamptz NOT NULL DEFAULT now(),
    left_at     timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (player_id, team_id)
);

-- ============================================================
-- 3. TRIGGER
-- ============================================================

-- set_updated_at() ist aus Migration 001 vorhanden.
CREATE TRIGGER trg_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. RLS AKTIVIEREN
-- ============================================================

ALTER TABLE public.players                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_guardians        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitation_links   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_join_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_team_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS-HILFSFUNKTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_guardian_of(p_player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.player_guardians pg
        WHERE pg.player_id        = p_player_id
          AND pg.guardian_user_id = auth.uid()
          AND pg.verified_at      IS NOT NULL
    );
$$;

-- ============================================================
-- 6. RLS-POLICIES
-- Ausschließlich SELECT. Kein direkter INSERT/UPDATE durch Clients.
-- Alle Schreibzugriffe laufen über SECURITY DEFINER Funktionen.
-- ============================================================

-- players: Guardian sieht eigene Kinder
CREATE POLICY "players_select_guardian"
    ON public.players FOR SELECT
    USING (public.is_guardian_of(id));

-- players: Trainer sieht Spieler mit aktiver Teamzuordnung
CREATE POLICY "players_select_trainer_assignment"
    ON public.players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.player_team_assignments pta
            WHERE pta.player_id = id
              AND public.has_team_role(pta.team_id,
                  'team_owner', 'head_coach', 'assistant_coach', 'team_manager')
        )
    );

-- players: Trainer sieht Spieler mit pendender Anfrage für sein Team
CREATE POLICY "players_select_trainer_pending_request"
    ON public.players FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_join_requests tjr
            WHERE tjr.player_id = id
              AND tjr.status = 'pending'
              AND public.has_team_role(tjr.team_id, 'team_owner', 'head_coach')
        )
    );

-- player_guardians: Guardian sieht eigene Einträge
CREATE POLICY "pg_select_own"
    ON public.player_guardians FOR SELECT
    USING (guardian_user_id = auth.uid());

-- player_guardians: Trainer sieht Guardian-Einträge für Spieler seines Teams
CREATE POLICY "pg_select_trainer"
    ON public.player_guardians FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.player_team_assignments pta
            WHERE pta.player_id = player_id
              AND public.has_team_role(pta.team_id, 'team_owner', 'head_coach')
        )
    );

-- team_invitation_links: team_owner und head_coach sehen Links ihres Teams
CREATE POLICY "til_select_team_staff"
    ON public.team_invitation_links FOR SELECT
    USING (public.has_team_role(team_id, 'team_owner', 'head_coach'));

-- team_join_requests: Guardian sieht eigene Anfragen
CREATE POLICY "tjr_select_guardian"
    ON public.team_join_requests FOR SELECT
    USING (guardian_user_id = auth.uid());

-- team_join_requests: Trainer sieht alle Anfragen seines Teams
CREATE POLICY "tjr_select_trainer"
    ON public.team_join_requests FOR SELECT
    USING (public.has_team_role(team_id, 'team_owner', 'head_coach'));

-- player_team_assignments: Trainer sieht Zuordnungen seines Teams
CREATE POLICY "pta_select_trainer"
    ON public.player_team_assignments FOR SELECT
    USING (
        public.has_team_role(team_id,
            'team_owner', 'head_coach', 'assistant_coach', 'team_manager')
    );

-- player_team_assignments: Guardian sieht Zuordnungen seiner Kinder
CREATE POLICY "pta_select_guardian"
    ON public.player_team_assignments FOR SELECT
    USING (public.is_guardian_of(player_id));

-- ============================================================
-- 7. INDEXES
-- ============================================================

-- team_invitation_links
-- token_hash UNIQUE-Index entsteht implizit via UNIQUE-Constraint in der Tabelle.
CREATE INDEX idx_til_team
    ON public.team_invitation_links(team_id);

-- team_join_requests
CREATE INDEX idx_tjr_team_status
    ON public.team_join_requests(team_id, status);

CREATE INDEX idx_tjr_guardian
    ON public.team_join_requests(guardian_user_id);

CREATE INDEX idx_tjr_player
    ON public.team_join_requests(player_id);

CREATE INDEX idx_tjr_cleanup
    ON public.team_join_requests(reviewed_at)
    WHERE status IN ('rejected', 'withdrawn');

-- players
CREATE INDEX idx_players_created_by
    ON public.players(created_by);

-- player_guardians
CREATE INDEX idx_pg_player
    ON public.player_guardians(player_id);

CREATE INDEX idx_pg_guardian
    ON public.player_guardians(guardian_user_id);

-- player_team_assignments
CREATE INDEX idx_pta_player
    ON public.player_team_assignments(player_id);

CREATE INDEX idx_pta_team_status
    ON public.player_team_assignments(team_id, status);

-- ============================================================
-- 8. SECURITY DEFINER FUNKTIONEN
-- Alle Funktionen: SET search_path = '', vollständig qualifizierte public.*
-- ============================================================

-- 8a. create_invitation_link
-- Generiert raw token, speichert nur token_hash, gibt raw token einmalig zurück.
CREATE OR REPLACE FUNCTION public.create_invitation_link(
    p_team_id         uuid,
    p_max_uses        integer DEFAULT 50,
    p_expires_in_days integer DEFAULT 30
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    v_raw_token  text;
    v_token_hash text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Nicht eingeloggt';
    END IF;

    IF NOT public.has_team_role(p_team_id, 'team_owner', 'head_coach') THEN
        RAISE EXCEPTION 'Keine Berechtigung: team_owner oder head_coach erforderlich';
    END IF;

    IF p_max_uses IS NULL OR p_max_uses <= 0 THEN
        RAISE EXCEPTION 'max_uses muss größer als 0 sein';
    END IF;

    IF p_expires_in_days IS NULL OR p_expires_in_days <= 0 THEN
        RAISE EXCEPTION 'expires_in_days muss größer als 0 sein';
    END IF;

    v_raw_token  := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(convert_to(v_raw_token, 'UTF8'), 'sha256'), 'hex');

    INSERT INTO public.team_invitation_links (
        team_id, created_by, token_hash, max_uses, expires_at
    ) VALUES (
        p_team_id,
        auth.uid(),
        v_token_hash,
        p_max_uses,
        now() + (p_expires_in_days || ' days')::interval
    );

    RETURN v_raw_token;
END;
$$;

-- 8b. revoke_invitation_link
CREATE OR REPLACE FUNCTION public.revoke_invitation_link(p_link_id uuid)
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
    FROM public.team_invitation_links
    WHERE id = p_link_id AND revoked_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Link nicht gefunden oder bereits widerrufen';
    END IF;

    IF NOT public.has_team_role(v_team_id, 'team_owner', 'head_coach') THEN
        RAISE EXCEPTION 'Keine Berechtigung: team_owner oder head_coach erforderlich';
    END IF;

    UPDATE public.team_invitation_links
    SET revoked_at = now()
    WHERE id = p_link_id;
END;
$$;

-- 8c. get_invitation_link_info
-- Für unauthentifizierte Link-Vorschau auf /join/[token].
-- Gibt Teamname und Gültigkeit zurück — kein direkter RLS-Zugriff nötig.
CREATE OR REPLACE FUNCTION public.get_invitation_link_info(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
DECLARE
    v_hash text;
    v_link record;
BEGIN
    IF p_token IS NULL OR char_length(trim(p_token)) = 0 THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'invalid_token');
    END IF;

    v_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');

    SELECT
        til.id,
        til.expires_at,
        til.revoked_at,
        til.use_count,
        til.max_uses,
        t.id   AS team_id,
        t.name AS team_name
    INTO v_link
    FROM public.team_invitation_links til
    JOIN public.teams t ON t.id = til.team_id
    WHERE til.token_hash = v_hash;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
    END IF;

    IF v_link.revoked_at IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', false, 'reason', 'revoked', 'team_name', v_link.team_name
        );
    END IF;

    IF v_link.expires_at < now() THEN
        RETURN jsonb_build_object(
            'valid', false, 'reason', 'expired', 'team_name', v_link.team_name
        );
    END IF;

    IF v_link.use_count >= v_link.max_uses THEN
        RETURN jsonb_build_object(
            'valid', false, 'reason', 'max_uses_reached', 'team_name', v_link.team_name
        );
    END IF;

    RETURN jsonb_build_object(
        'valid',     true,
        'team_id',   v_link.team_id,
        'team_name', v_link.team_name
    );
END;
$$;

-- 8d. submit_join_request
-- Atomar: player + player_guardian + team_join_request + use_count++.
-- SELECT ... FOR UPDATE auf Einladungslink verhindert race condition bei max_uses.
CREATE OR REPLACE FUNCTION public.submit_join_request(
    p_token      text,
    p_first_name text,
    p_last_name  text,
    p_birth_year integer DEFAULT NULL,
    p_position   text    DEFAULT NULL,
    p_jersey_nr  integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    v_hash       text;
    v_link       public.team_invitation_links%ROWTYPE;
    v_player_id  uuid;
    v_request_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Nicht eingeloggt';
    END IF;

    IF p_first_name IS NULL OR char_length(trim(p_first_name)) = 0 THEN
        RAISE EXCEPTION 'Vorname darf nicht leer sein';
    END IF;

    IF p_last_name IS NULL OR char_length(trim(p_last_name)) = 0 THEN
        RAISE EXCEPTION 'Nachname darf nicht leer sein';
    END IF;

    IF p_birth_year IS NOT NULL AND (p_birth_year < 1900 OR p_birth_year > 2100) THEN
        RAISE EXCEPTION 'Ungültiges Geburtsjahr (1900–2100)';
    END IF;

    v_hash := encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');

    -- Link sperren: race-safe max_uses/use_count Prüfung
    SELECT * INTO v_link
    FROM public.team_invitation_links
    WHERE token_hash = v_hash
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Einladungslink nicht gefunden';
    END IF;

    IF v_link.revoked_at IS NOT NULL THEN
        RAISE EXCEPTION 'Einladungslink wurde widerrufen';
    END IF;

    IF v_link.expires_at < now() THEN
        RAISE EXCEPTION 'Einladungslink ist abgelaufen';
    END IF;

    IF v_link.use_count >= v_link.max_uses THEN
        RAISE EXCEPTION 'Einladungslink hat maximale Nutzungen erreicht';
    END IF;

    -- Player anlegen
    INSERT INTO public.players (created_by, first_name, last_name, birth_year, position, jersey_nr)
    VALUES (auth.uid(), trim(p_first_name), trim(p_last_name), p_birth_year, p_position, p_jersey_nr)
    RETURNING id INTO v_player_id;

    -- Guardian-Verknüpfung (verified_at = Einwilligungsnachweis für MVP 0A)
    INSERT INTO public.player_guardians (player_id, guardian_user_id, verified_at)
    VALUES (v_player_id, auth.uid(), now());

    -- Beitrittsanfrage
    INSERT INTO public.team_join_requests (
        team_id, invitation_link_id, guardian_user_id, player_id
    ) VALUES (
        v_link.team_id, v_link.id, auth.uid(), v_player_id
    )
    RETURNING id INTO v_request_id;

    -- use_count erhöhen
    UPDATE public.team_invitation_links
    SET use_count = use_count + 1
    WHERE id = v_link.id;

    RETURN v_request_id;
END;
$$;

-- 8e. approve_join_request
-- Atomar: player_team_assignment anlegen, Anfrage auf approved setzen.
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

    RETURN v_assignment_id;
END;
$$;

-- 8f. reject_join_request
-- Setzt status=rejected. Löscht orphaned player wenn keine weiteren
-- pending Requests oder aktiven Assignments existieren.
-- CASCADE löscht player_guardians; ON DELETE SET NULL setzt team_join_requests.player_id = NULL.
CREATE OR REPLACE FUNCTION public.reject_join_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    v_request               public.team_join_requests%ROWTYPE;
    v_player_id             uuid;
    v_has_other_pending     boolean;
    v_has_active_assignment boolean;
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

    IF NOT public.has_team_role(v_request.team_id, 'team_owner', 'head_coach') THEN
        RAISE EXCEPTION 'Keine Berechtigung: team_owner oder head_coach erforderlich';
    END IF;

    v_player_id := v_request.player_id;

    UPDATE public.team_join_requests
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = p_request_id;

    -- Orphan-Check: Player löschen wenn keine weiteren Bezüge
    IF v_player_id IS NOT NULL THEN
        PERFORM id FROM public.players WHERE id = v_player_id FOR UPDATE;

        SELECT EXISTS (
            SELECT 1 FROM public.team_join_requests
            WHERE player_id = v_player_id
              AND status    = 'pending'
              AND id        <> p_request_id
        ) INTO v_has_other_pending;

        SELECT EXISTS (
            SELECT 1 FROM public.player_team_assignments
            WHERE player_id = v_player_id
              AND status    = 'active'
        ) INTO v_has_active_assignment;

        IF NOT v_has_other_pending AND NOT v_has_active_assignment THEN
            DELETE FROM public.players WHERE id = v_player_id;
        END IF;
    END IF;
END;
$$;

-- 8g. withdraw_join_request
-- Nur der eigene Guardian darf zurückziehen.
-- Dieselbe Orphan-Logik wie reject_join_request.
-- reviewed_by bleibt NULL (Selbstentzug, kein Trainer-Review).
CREATE OR REPLACE FUNCTION public.withdraw_join_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    v_request               public.team_join_requests%ROWTYPE;
    v_player_id             uuid;
    v_has_other_pending     boolean;
    v_has_active_assignment boolean;
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

    IF v_request.guardian_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Keine Berechtigung: nur der eigene Guardian kann zurückziehen';
    END IF;

    IF v_request.status <> 'pending' THEN
        RAISE EXCEPTION 'Anfrage ist nicht mehr offen (Status: %)', v_request.status;
    END IF;

    v_player_id := v_request.player_id;

    UPDATE public.team_join_requests
    SET status = 'withdrawn', reviewed_at = now()
    WHERE id = p_request_id;

    -- Orphan-Check: Player löschen wenn keine weiteren Bezüge
    IF v_player_id IS NOT NULL THEN
        PERFORM id FROM public.players WHERE id = v_player_id FOR UPDATE;

        SELECT EXISTS (
            SELECT 1 FROM public.team_join_requests
            WHERE player_id = v_player_id
              AND status    = 'pending'
              AND id        <> p_request_id
        ) INTO v_has_other_pending;

        SELECT EXISTS (
            SELECT 1 FROM public.player_team_assignments
            WHERE player_id = v_player_id
              AND status    = 'active'
        ) INTO v_has_active_assignment;

        IF NOT v_has_other_pending AND NOT v_has_active_assignment THEN
            DELETE FROM public.players WHERE id = v_player_id;
        END IF;
    END IF;
END;
$$;

-- 8h. update_player_basic_info
-- Nur Guardian des Kindes darf aktualisieren.
-- Ändert ausschließlich: first_name, last_name, birth_year, position, jersey_nr.
-- Ändert NICHT: created_by, user_id, is_active.
CREATE OR REPLACE FUNCTION public.update_player_basic_info(
    p_player_id  uuid,
    p_first_name text,
    p_last_name  text,
    p_birth_year integer DEFAULT NULL,
    p_position   text    DEFAULT NULL,
    p_jersey_nr  integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Nicht eingeloggt';
    END IF;

    IF NOT public.is_guardian_of(p_player_id) THEN
        RAISE EXCEPTION 'Keine Berechtigung: Guardian-Verknüpfung mit verified_at erforderlich';
    END IF;

    IF p_first_name IS NULL OR char_length(trim(p_first_name)) = 0 THEN
        RAISE EXCEPTION 'Vorname darf nicht leer sein';
    END IF;

    IF p_last_name IS NULL OR char_length(trim(p_last_name)) = 0 THEN
        RAISE EXCEPTION 'Nachname darf nicht leer sein';
    END IF;

    IF p_birth_year IS NOT NULL AND (p_birth_year < 1900 OR p_birth_year > 2100) THEN
        RAISE EXCEPTION 'Ungültiges Geburtsjahr (1900–2100)';
    END IF;

    UPDATE public.players
    SET
        first_name = trim(p_first_name),
        last_name  = trim(p_last_name),
        birth_year = p_birth_year,
        position   = p_position,
        jersey_nr  = p_jersey_nr,
        updated_at = now()
    WHERE id = p_player_id;
END;
$$;

-- 8i. cleanup_expired_join_requests
-- Löscht abgelehnte/zurückgezogene Anfragen älter als 90 Tage (DSGVO).
-- Aufzurufen via pg_cron oder manuell. Gibt Anzahl gelöschter Zeilen zurück.
CREATE OR REPLACE FUNCTION public.cleanup_expired_join_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '' AS $$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.team_join_requests
    WHERE status IN ('rejected', 'withdrawn')
      AND reviewed_at < now() - interval '90 days';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;
