-- ============================================================
-- Migration — Registrierungsprofil (Phase B.3)
-- Datei: 20260628000000_add_profile_registration_fields.sql
-- Datum: 2026-06-28
-- ============================================================
-- Änderungen:
--   1. public.profiles: 6 neue Spalten (alle nullable für Backward-Compat)
--   2. Backfill: full_name → first_name/last_name für Bestandsuser
--   3. handle_new_user() CREATE OR REPLACE: liest neue Felder aus
--      raw_user_meta_data; EXCEPTION-Blöcke für date-/timestamptz-Castings
-- ============================================================

-- ============================================================
-- 1. SCHEMA-ÄNDERUNGEN
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name          text,
  ADD COLUMN IF NOT EXISTS last_name           text,
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS onboarding_role     text
    CONSTRAINT profiles_onboarding_role_check
    CHECK (onboarding_role IN ('player', 'guardian', 'coach', 'club_official', 'other')),
  ADD COLUMN IF NOT EXISTS terms_accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;

-- ============================================================
-- 2. BACKFILL
-- Bestandsuser haben full_name aber keine first_name/last_name.
-- Best-effort-Split am ersten Leerzeichen.
-- Einzel-Namen (kein Leerzeichen): first_name = full_name, last_name = NULL.
-- ============================================================

UPDATE public.profiles
SET
  first_name = trim(split_part(full_name, ' ', 1)),
  last_name  = nullif(
    trim(substring(full_name FROM position(' ' IN full_name) + 1)),
    ''
  )
WHERE
  full_name IS NOT NULL
  AND trim(full_name) <> ''
  AND first_name IS NULL;

-- ============================================================
-- 3. handle_new_user() — neue Felder aus raw_user_meta_data lesen
-- SECURITY DEFINER + SET search_path = '' bleiben unverändert.
-- EXCEPTION-Blöcke verhindern, dass malformed Werte die
-- gesamte Registrierung fehlschlagen lassen.
-- onboarding_role: Whitelist-Prüfung im Trigger als zweite Verteidigungslinie.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_first_name       text;
  v_last_name        text;
  v_full_name        text;
  v_phone            text;
  v_dob              date;
  v_onboarding_role  text;
  v_terms_at         timestamptz;
  v_privacy_at       timestamptz;
BEGIN
  v_first_name := nullif(trim(coalesce(NEW.raw_user_meta_data->>'first_name', '')), '');
  v_last_name  := nullif(trim(coalesce(NEW.raw_user_meta_data->>'last_name',  '')), '');

  -- full_name aus first+last zusammenbauen, Fallback auf legacy full_name-Feld
  v_full_name := nullif(trim(
    coalesce(v_first_name, '') ||
    CASE WHEN v_first_name IS NOT NULL AND v_last_name IS NOT NULL THEN ' ' ELSE '' END ||
    coalesce(v_last_name, '')
  ), '');
  IF v_full_name IS NULL THEN
    v_full_name := nullif(trim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), '');
  END IF;

  v_phone := nullif(trim(coalesce(NEW.raw_user_meta_data->>'phone', '')), '');

  BEGIN
    v_dob := (NEW.raw_user_meta_data->>'date_of_birth')::date;
  EXCEPTION WHEN OTHERS THEN
    v_dob := NULL;
  END;

  -- Whitelist: nur erlaubte Werte, sonst NULL (zweite Verteidigungslinie nach signUpAction)
  v_onboarding_role := nullif(trim(coalesce(NEW.raw_user_meta_data->>'onboarding_role', '')), '');
  IF v_onboarding_role IS NOT NULL AND
     v_onboarding_role NOT IN ('player', 'guardian', 'coach', 'club_official', 'other') THEN
    v_onboarding_role := NULL;
  END IF;

  BEGIN
    v_terms_at := (NEW.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_terms_at := NULL;
  END;

  BEGIN
    v_privacy_at := (NEW.raw_user_meta_data->>'privacy_accepted_at')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    v_privacy_at := NULL;
  END;

  INSERT INTO public.profiles (
    id,    email,          full_name,
    first_name,            last_name,
    phone,                 date_of_birth,
    onboarding_role,
    terms_accepted_at,     privacy_accepted_at
  ) VALUES (
    NEW.id,
    NEW.email,
    coalesce(v_full_name, ''),
    v_first_name,
    v_last_name,
    v_phone,
    v_dob,
    v_onboarding_role,
    v_terms_at,
    v_privacy_at
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
