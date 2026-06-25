# Sicherheitsarchitektur — Vereon

**Stand:** 2026-06-25 (überarbeitet: Tabellennamen korrigiert, Sicherheitsrisiken ergänzt)

---

## Grundregeln

1. Auth wird **immer serverseitig geprüft** — clientseitige Prüfung ist ausschließlich für UX (z.B. Button ausblenden)
2. **Row Level Security (RLS)** ist für alle Supabase-Tabellen Pflicht — kein Zugriff ohne explizite Policy
3. Umgebungsvariablen mit Secrets (`SERVICE_ROLE_KEY`) kommen **niemals** in Client-Code oder Next.js-Anwendungscode
4. Alle geschützten Routen werden von `middleware.ts` abgesichert
5. SECURITY DEFINER-Funktionen setzen immer `SET search_path = ''`

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

**Beschreibung:** Wenn ein Client direkt auf `club_memberships` und `club_member_roles` inserieren kann, könnte ein Angreifer sich selbst als `club_admin` eines fremden Vereins eintragen — sofern die INSERT-Policies nicht korrekt sind. Das erste Anlegen eines Vereins ist besonders kritisch, weil noch keine Mitgliedschaft existiert, gegen die eine Policy prüfen könnte.

**Maßnahme:**
- RLS-Policy für `clubs` INSERT: nur authentifizierte User (`auth.uid() IS NOT NULL`)
- Keine direkte INSERT-Policy auf `club_memberships` und `club_member_roles` für den Erstellungsfall
- Stattdessen: ausschließlich via `create_club()` Datenbankfunktion (SECURITY DEFINER), die Verein, Mitgliedschaft und Rolle atomar anlegt
- Nachfolgende `club_admin`-Zuweisungen: Policy prüft, ob der aufrufende User bereits `club_admin` des Vereins ist

```sql
-- Policy: Nur bestehende club_admins dürfen neue Rollen vergeben
CREATE POLICY "club_admin_grants_roles"
ON club_member_roles FOR INSERT
WITH CHECK (
  has_club_role((
    SELECT club_id FROM club_memberships WHERE id = membership_id
  ), 'club_admin')
);
```

---

### Risiko 2 — Unsichere Invitation Tokens

**Beschreibung:** Kurze oder vorhersehbare Einladungs-Tokens können durch Enumeration oder Bruteforce erraten werden. Ein erfolgreicher Angriff gibt dem Angreifer eine Vereins- oder Trainermitgliedschaft.

**Maßnahme:**
- Token mindestens 32 Bytes kryptografisch zufällig: `encode(gen_random_bytes(32), 'hex')` → 64 Zeichen hexadekodiert
- Partial Unique Index auf aktive Tokens: `CREATE UNIQUE INDEX ON invitations(token) WHERE used_at IS NULL AND revoked_at IS NULL`
- Maximale Gültigkeit: 7 Tage für normale Einladungen, 48 Stunden für sensitive Rollen (`club_admin`)
- Single-Use: `max_uses = 1`, nach Einlösung `used_at = now()` setzen
- Expired-Cleanup: pg_cron-Job oder Supabase Edge Function (wöchentlich)
- Rate-Limiting auf `/invite/[token]`-Route (via Middleware oder Vercel-Firewall)

---

### Risiko 3 — Fremde RSVP (RSVP-Fälschung)

**Beschreibung:** Ein authentifizierter User könnte `event_attendance` mit einer fremden `player_id` oder `user_id` manipulieren und so RSVP für andere Spieler fälschen.

**Maßnahme:**
- `event_attendance.user_id` kann nur auf `auth.uid()` gesetzt werden (Policy mit `user_id = auth.uid()`)
- `responded_by_user_id` wird immer serverseitig auf `auth.uid()` gesetzt — kein Client-Input
- Guardian-RSVP: nur erlaubt wenn `is_guardian_of(player_id) = true` (via Hilfsfunktion)
- Trainer-RSVP für `attended`-Flag: nur erlaubt wenn `has_team_role(team_id, 'head_coach', 'assistant_coach', 'team_manager')`

```sql
-- Spieler setzt nur eigene RSVP
CREATE POLICY "player_updates_own_rsvp"
ON event_attendance FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND responded_by_user_id = auth.uid());

-- Guardian setzt RSVP für Kind
CREATE POLICY "guardian_updates_child_rsvp"
ON event_attendance FOR UPDATE
USING (is_guardian_of(player_id))
WITH CHECK (is_guardian_of(player_id) AND responded_by_user_id = auth.uid());
```

---

### Risiko 4 — Zugriff auf andere Vereine (Tenant-Crossing)

**Beschreibung:** Ein User könnte versuchen, auf Daten eines anderen Vereins zuzugreifen, indem er direkt `club_id`-Parameter manipuliert.

**Maßnahme:**
- Alle RLS-Policies prüfen `club_id` gegen die Mitgliedschaft des aktuellen Users
- `is_club_member(p_club_id)` Hilfsfunktion als Basis für alle Vereins-Policies
- Events: `club_id` wird via Trigger aus `team_id` abgeleitet — User kann `club_id` nicht selbst setzen
- Server Actions und Route Handlers prüfen Vereinsmitgliedschaft zusätzlich zur RLS (Defense in Depth)
- Logs in `audit_logs` für verdächtige Cross-Tenant-Zugriffsversuche (via Server-Code)

---

### Risiko 5 — Guardian-Rechte ohne Verknüpfung

**Beschreibung:** Ein User könnte behaupten, Guardian eines Spielers zu sein, ohne verifizierte Verknüpfung, und so auf Spieler- oder Teamdaten zugreifen.

**Maßnahme:**
- Guardian-Rechte ausschließlich über `player_guardians`-Tabelle
- `player_guardians.verified_at` muss gesetzt sein, bevor Rechte aktiv werden
- Einladungsflow: `player_id` ist in der `invitations`-Tabelle gespeichert → Verknüpfung entsteht nur durch Annahme einer validen Einladung, nie durch direkten INSERT des Clients
- `is_guardian_of()`-Hilfsfunktion prüft `verified_at IS NOT NULL`
- Beim Annehmen einer Guardian-Einladung: `verified_at = now()` wird serverseitig gesetzt (Server Action, nicht Client)

---

### Risiko 6 — Fehlende RLS-Indexes (Performance-Sicherheitsrisiko)

**Beschreibung:** Fehlende Indexes auf den Lookup-Tabellen (`club_member_roles`, `team_member_roles`, `player_guardians`) führen zu Sequential Scans bei jeder RLS-Policy-Prüfung. Bei wachsenden Daten werden Queries langsam — und langsame Queries öffnen die Tür für DoS-Versuche via exzessiver Anfragen.

**Maßnahme:** Alle RLS-kritischen Indexes in der ersten Migration anlegen (vollständige Liste in `DATABASE_MODEL.md`). Kritischste Indexes:

```sql
CREATE INDEX idx_club_memberships_user_club ON club_memberships(user_id, club_id);
CREATE INDEX idx_club_member_roles_membership ON club_member_roles(membership_id, role_id);
CREATE INDEX idx_team_memberships_user_team ON team_memberships(user_id, team_id);
CREATE INDEX idx_team_member_roles_membership ON team_member_roles(team_membership_id, role_id);
CREATE INDEX idx_player_guardians_guardian ON player_guardians(guardian_user_id);
```

---

### Risiko 7 — SECURITY DEFINER Missbrauch (Schema-Injection)

**Beschreibung:** Ohne explizites `SET search_path = ''` in SECURITY DEFINER-Funktionen kann ein Angreifer durch Manipulation des `search_path` eigene Objekte mit gleichen Namen vorschalten und so die Funktion umleiten.

**Maßnahme:**
- Jede SECURITY DEFINER-Funktion beginnt mit `SET search_path = ''`
- Alle Tabellen in Funktionen werden mit vollem Schema-Prefix referenziert (`public.club_memberships`, nicht `club_memberships`)
- Beispiel:

```sql
CREATE OR REPLACE FUNCTION has_club_role(p_club_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships cm
    JOIN public.club_member_roles cmr ON cmr.membership_id = cm.id
    JOIN public.roles r ON r.id = cmr.role_id
    WHERE cm.user_id = auth.uid()
    AND cm.club_id = p_club_id
    AND cm.status = 'active'
    AND r.name = p_role
  );
$$;
```

---

## Middleware-Sicherheit

`middleware.ts` im Root:
- Ruft `supabase.auth.getUser()` bei jedem Request auf (nie `getSession()` — prüft JWT serverseitig)
- Leitet unauthentifizierte User auf `/login` um (mit `?redirect=` Parameter)
- Erneuert abgelaufene Sessions via Token-Refresh (Cookie-Schreiben möglich in Middleware)
- Öffentliche Routen (`/`, `/login`, `/register`, `/auth/callback`, `/invite/*`) werden nicht blockiert
- Matcher schließt statische Dateien aus (`_next/static`, `_next/image`, `favicon.ico`, Bilddateien)

---

## Server Components und Route Handlers

- Supabase Server Client (`createServerClient`) liest Session aus HTTPOnly-Cookies
- Rollen werden zusätzlich zur RLS auf Anwendungsebene geprüft (Defense in Depth)
- `import 'server-only'` in `src/lib/supabase/server.ts` und `route-handler.ts` verhindert Import in Client-Bundle
- Route Handler prüfen User vor jeder Operation: `const { data: { user } } = await supabase.auth.getUser()`

---

## Input-Validierung

- Alle Formulardaten werden auf dem Server mit **Zod** validiert (Server Actions, Route Handlers)
- Kein Vertrauen auf Client-seitige Validierung als Sicherheitsmechanismus
- Supabase Query Builder verhindert SQL-Injection durch parametrisierte Queries
- Slug-Generierung für Vereine: nur Kleinbuchstaben, Ziffern, Bindestriche — serverseitig normalisiert

---

## Bekannte Risiken und Maßnahmen (Übersicht)

| Risiko | Schwere | Maßnahme | Status |
|---|---|---|---|
| Privilege Escalation (erster club_admin) | Kritisch | `create_club()` SECURITY DEFINER | Geplant |
| Unsichere Invitation Tokens | Hoch | 32-Byte-Token, Partial Index, Rate-Limit | Geplant |
| Fremde RSVP | Hoch | RLS-Policies mit `auth.uid()`-Check | Geplant |
| Tenant-Crossing | Hoch | `club_id`-Prüfung in allen Policies | Geplant |
| Guardian ohne Verknüpfung | Hoch | `verified_at`-Check, Einladungsflow | Geplant |
| Fehlende RLS-Indexes | Mittel | Index-Strategie in erster Migration | Geplant |
| SECURITY DEFINER Schema-Injection | Mittel | `SET search_path = ''` in allen Funktionen | Geplant |
| Session-Hijacking | Mittel | HTTPOnly Cookies, kurze JWT-Ablaufzeit | Via Supabase |
| CSRF | Niedrig | Next.js Server Actions eingebaut | Eingebaut |
| Environment Poisoning | Mittel | `server-only` Import, kein `NEXT_PUBLIC_` für Secrets | Geplant |
