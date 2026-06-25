# Sicherheitsarchitektur — Vereon

**Stand:** 2026-06-25 (überarbeitet: DSGVO-Risiken ergänzt, proxy.ts-Referenz, roles.key)

---

## Grundregeln

1. Auth wird **immer serverseitig geprüft** — clientseitige Prüfung ist ausschließlich für UX
2. **Row Level Security (RLS)** ist für alle Supabase-Tabellen Pflicht — kein Zugriff ohne explizite Policy
3. Umgebungsvariablen mit Secrets (`SERVICE_ROLE_KEY`) kommen **niemals** in Client-Code oder Next.js-Anwendungscode
4. Alle geschützten Routen werden von `src/proxy.ts` (Next.js 16 Proxy-Konvention) abgesichert
5. SECURITY DEFINER-Funktionen setzen immer `SET search_path = ''` und verwenden vollständige Schema-Prefixe

---

## Supabase-Schlüssel

| Variable | Sichtbarkeit | Verwendung |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Öffentlich (sicher) | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlich (RLS schützt) | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Geheim — niemals im Client oder in der App | Nur Supabase CLI, Admin-Scripts |

**Der Service-Role-Key umgeht RLS vollständig.** Ein Leck dieses Keys bedeutet vollständiger Datenbankzugriff ohne Einschränkungen.

---

## Top-Sicherheitsrisiken und Gegenmaßnahmen

---

### Risiko 1 — Privilege Escalation beim ersten club_admin

**Beschreibung:** Wenn ein Client direkt auf `club_memberships` und `club_member_roles` inserieren kann, könnte ein Angreifer sich selbst als `club_admin` eines fremden Vereins eintragen. Das erste Anlegen eines Vereins ist besonders kritisch, weil noch keine Mitgliedschaft existiert, gegen die eine Policy prüfen könnte.

**Maßnahme:**
- Keine direkte INSERT-Policy auf `club_memberships` und `club_member_roles` für den Erstellungsfall
- Ausschließlich via `create_club()` SECURITY DEFINER — Verein, Mitgliedschaft und Rolle werden atomar angelegt
- Nachfolgende Rollenvergaben: Policy prüft bestehende `club_admin`-Mitgliedschaft

```sql
-- Policy: Nur bestehende club_admins dürfen neue Rollen vergeben
CREATE POLICY "club_admin_grants_roles"
ON public.club_member_roles FOR INSERT
WITH CHECK (
  public.has_club_role((
    SELECT club_id FROM public.club_memberships WHERE id = club_membership_id
  ), 'club_admin')
);
```

---

### Risiko 1b — Privilege Escalation beim ersten team_owner

**Beschreibung:** Analog zu Risiko 1 — wer darf die erste team_owner-Rolle für ein eigenständiges Team vergeben? Ohne SECURITY DEFINER könnte ein User `team_member_roles` mit `team_owner` befüllen ohne legitime Berechtigung.

**Maßnahme:**
- Eigenständige Teams nur via `create_independent_team()` SECURITY DEFINER anlegen
- Funktion setzt `team_owner`-Rolle atomar für `auth.uid()` — kein direktes INSERT durch Client
- Nachträgliche `team_owner`-Vergabe: nur bestehender `team_owner` des gleichen Teams darf diese Rolle vergeben

---

### Risiko 2 — Unsichere Invitation Tokens

**Beschreibung:** Kurze oder vorhersehbare Einladungs-Tokens können durch Enumeration oder Bruteforce erraten werden.

**Maßnahme:**
- Token mindestens 32 Bytes kryptografisch zufällig: `encode(gen_random_bytes(32), 'hex')` → 64 Zeichen
- Partial Unique Index auf aktive Tokens:
  - `CREATE UNIQUE INDEX ON public.invitations(token) WHERE used_at IS NULL AND revoked_at IS NULL`
  - `CREATE UNIQUE INDEX ON public.team_invitation_links(token) WHERE revoked_at IS NULL`
- Maximale Gültigkeit: 7 Tage für Vereinseinladungen, 30 Tage für Team-Links
- Rate-Limiting auf `/join/[token]` und `/invite/[token]` (via `src/proxy.ts` oder Vercel-Firewall)
- Expired-Cleanup: pg_cron-Job oder Supabase Edge Function

---

### Risiko 3 — Fremde RSVP (RSVP-Fälschung)

**Beschreibung:** Ein User könnte `event_attendance` mit einer fremden `player_id` manipulieren.

**Maßnahme:**
- `responded_by_user_id` wird immer serverseitig auf `auth.uid()` gesetzt — kein Client-Input
- Guardian-RSVP: nur erlaubt wenn `is_guardian_of(player_id) = true`
- Trainer-RSVP für `attended`: nur wenn `has_team_role(team_id, 'team_owner', 'head_coach', 'assistant_coach', 'team_manager')`

```sql
-- Guardian setzt RSVP für Kind
CREATE POLICY "guardian_updates_child_rsvp"
ON public.event_attendance FOR UPDATE
USING (public.is_guardian_of(player_id))
WITH CHECK (public.is_guardian_of(player_id) AND responded_by_user_id = auth.uid());
```

---

### Risiko 4 — Zugriff auf andere Vereine (Tenant-Crossing)

**Beschreibung:** User manipuliert `club_id`-Parameter um auf Daten eines anderen Vereins zuzugreifen.

**Maßnahme:**
- Alle RLS-Policies prüfen `club_id` gegen Mitgliedschaft des aktuellen Users
- `is_club_member(p_club_id)` Hilfsfunktion als Basis aller Vereins-Policies
- `events.club_id` via Trigger aus `team_id` abgeleitet — User kann `club_id` nicht manuell setzen
- Server Actions prüfen Vereinsmitgliedschaft zusätzlich zur RLS (Defense in Depth)
- Bei eigenständigen Teams (club_id = NULL): `is_team_member(team_id)` Policy greift

---

### Risiko 5 — Guardian-Rechte ohne Verknüpfung

**Beschreibung:** User behauptet, Guardian eines Spielers zu sein, ohne verifizierte Verknüpfung.

**Maßnahme:**
- Guardian-Rechte ausschließlich über `player_guardians`-Tabelle
- `player_guardians.verified_at` muss gesetzt sein, bevor Rechte aktiv werden
- Verknüpfung entsteht nur durch Annahme einer validen Einladung, nie durch direkten INSERT des Clients
- `is_guardian_of()` prüft `verified_at IS NOT NULL`
- `verified_at = now()` wird serverseitig gesetzt (Server Action, nicht Client)

---

### Risiko 6 — Fehlende RLS-Indexes (Performance-Sicherheitsrisiko)

**Beschreibung:** Fehlende Indexes auf Lookup-Tabellen führen zu Sequential Scans bei jeder RLS-Policy-Prüfung. Langsame Queries öffnen die Tür für DoS-Versuche.

**Maßnahme:** Alle RLS-kritischen Indexes in Migration 001 anlegen (vollständige Liste in `DATABASE_MODEL.md`):

```sql
CREATE INDEX idx_club_memberships_user_club   ON public.club_memberships(user_id, club_id);
CREATE INDEX idx_club_member_roles_membership ON public.club_member_roles(club_membership_id, role_id);
CREATE INDEX idx_team_memberships_user_team   ON public.team_memberships(user_id, team_id);
CREATE INDEX idx_team_member_roles_membership ON public.team_member_roles(team_membership_id, role_id);
CREATE INDEX idx_teams_created_by             ON public.teams(created_by);
```

---

### Risiko 7 — SECURITY DEFINER Missbrauch (Schema-Injection)

**Beschreibung:** Ohne explizites `SET search_path = ''` kann ein Angreifer durch Manipulation des `search_path` eigene Objekte vorschalten.

**Maßnahme:**
- Jede SECURITY DEFINER-Funktion beginnt mit `SET search_path = ''`
- Alle Tabellen mit vollem Schema-Prefix: `public.club_memberships`, nicht `club_memberships`

```sql
CREATE OR REPLACE FUNCTION public.has_club_role(p_club_id uuid, p_role_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships cm
    JOIN public.club_member_roles cmr ON cmr.club_membership_id = cm.id
    JOIN public.roles r ON r.id = cmr.role_id
    WHERE cm.user_id = auth.uid()
    AND cm.club_id = p_club_id
    AND cm.status = 'active'
    AND r.key = p_role_key   -- roles.key, nicht roles.name_de
  );
$$;
```

---

### Risiko 8 — Kindsdaten in team_join_requests (DSGVO)

**Beschreibung:** `team_join_requests` enthält Kindsdaten (Vorname, Nachname, Geburtsjahr) im pending/rejected Status. Abgelehnte Anfragen werden nicht automatisch gelöscht. Bei Systemfehler oder unachtsamer Konfiguration könnten diese Daten zu lange erhalten bleiben oder unbefugten Trainern zugänglich werden.

**Maßnahme:**
- RLS: nur der `guardian_user_id` und der Trainer (has_team_role 'team_owner', 'head_coach') sehen Anfragen
- Keine automatische Sichtbarkeit für andere Teammitglieder
- Abgelehnte Anfragen: Löschfrist 90 Tage via pg_cron oder Supabase Edge Function
- `status = 'rejected'` + `reviewed_at` gesetzt → nach 90 Tagen löschen
- Beim Ablehnen: keine weiteren Daten aus dem Request in `players`-Tabelle speichern

```sql
-- Abgelehnte Anfragen nach 90 Tagen löschen (pg_cron)
DELETE FROM public.team_join_requests
WHERE status = 'rejected'
AND reviewed_at < now() - interval '90 days';
```

---

### Risiko 9 — Datenmissbrauch durch Trainer (DSGVO Minderjährige)

**Beschreibung:** Ein Trainer könnte Kindsdaten, die über den Guardian-Flow in das System kamen, über seinen Berechtigungsrahmen hinaus einsehen, exportieren oder weitergeben.

**Maßnahme:**
- `tactics_notes` in `match_reports`: Column-Level Security oder separate RLS-Policy — nur Trainer
- `players`-Daten: RLS beschränkt Zugriff auf das eigene Team (teamscoped)
- Kein direkter Export im MVP-UI — keine Daten-Dump-Funktion für Trainer
- Audit-Logs (MVP 1) für kritische Datenzugriffe
- Datenschutzerklärung (vor Launch): erklärt Guardian/Spieler was gespeichert wird

---

## Proxy-Sicherheit (src/proxy.ts)

`src/proxy.ts` (Next.js 16 Konvention, nicht `middleware.ts`):
- Ruft `supabase.auth.getUser()` bei jedem Request auf (nie `getSession()` — prüft JWT serverseitig)
- Leitet unauthentifizierte User auf `/login` um (mit `?redirect=`-Parameter)
- Erneuert abgelaufene Sessions via Token-Refresh
- Öffentliche Routen werden nicht blockiert: `/`, `/login`, `/register`, `/auth/callback`, `/join/*`, `/invite/*`
- Matcher schließt statische Dateien aus

---

## Server Components und Route Handlers

- Supabase Server Client liest Session aus HTTPOnly-Cookies
- Rollen werden zusätzlich zur RLS auf Anwendungsebene geprüft (Defense in Depth)
- `import 'server-only'` in `server.ts` und `route-handler.ts` verhindert Import in Client-Bundle
- Route Handlers prüfen User vor jeder Operation: `const { data: { user } } = await supabase.auth.getUser()`

---

## Input-Validierung

- Alle Formulardaten werden auf dem Server mit **Zod** validiert (Server Actions, Route Handlers)
- Kein Vertrauen auf clientseitige Validierung als Sicherheitsmechanismus
- Supabase Query Builder verhindert SQL-Injection durch parametrisierte Queries
- Slug-Generierung für Vereine: nur Kleinbuchstaben, Ziffern, Bindestriche — serverseitig via `create_club()` validiert

---

## Bekannte Risiken und Maßnahmen (Übersicht)

| Risiko | Schwere | Maßnahme | Status |
|---|---|---|---|
| Privilege Escalation (erster club_admin) | Kritisch | `create_club()` SECURITY DEFINER | Geplant |
| Privilege Escalation (erster team_owner) | Kritisch | `create_independent_team()` SECURITY DEFINER | Geplant |
| Unsichere Invitation Tokens | Hoch | 32-Byte-Token, Partial Index, Rate-Limit | Geplant |
| Unsichere Team-Link-Tokens | Hoch | 32-Byte-Token, Partial Index, Ablaufdatum | Geplant |
| Fremde RSVP | Hoch | RLS-Policies mit `auth.uid()`-Check | Geplant |
| Tenant-Crossing | Hoch | `club_id`-Prüfung in allen Policies | Geplant |
| Guardian ohne Verknüpfung | Hoch | `verified_at`-Check, Einladungsflow | Geplant |
| Kindsdaten in join_requests (DSGVO) | Hoch | RLS + 90-Tage-Löschfrist | Geplant |
| Datenmissbrauch durch Trainer (DSGVO) | Hoch | Column-Level Security, Audit-Logs | Geplant MVP 1 |
| Fehlende RLS-Indexes | Mittel | Index-Strategie in erster Migration | Geplant |
| SECURITY DEFINER Schema-Injection | Mittel | `SET search_path = ''` in allen Funktionen | Geplant |
| Session-Hijacking | Mittel | HTTPOnly Cookies, kurze JWT-Ablaufzeit | Via Supabase |
| CSRF | Niedrig | Next.js Server Actions eingebaut | Eingebaut |
| Environment Poisoning | Mittel | `server-only` Import, kein `NEXT_PUBLIC_` für Secrets | Geplant |
