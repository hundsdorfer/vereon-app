# Sicherheitsarchitektur

## Grundregeln
1. Auth wird **immer serverseitig geprüft** — clientseitige Prüfung ist nur für UX (z.B. Button ausblenden)
2. **Row Level Security (RLS)** ist für alle Supabase-Tabellen Pflicht
3. Umgebungsvariablen mit Secrets (`SERVICE_ROLE_KEY`) kommen **niemals** in Client-Code
4. Alle geschützten Routen werden von `middleware.ts` abgesichert

## Supabase-Schlüssel

| Variable | Sicherheit | Verwendung |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Öffentlich (sicher) | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlich (RLS schützt) | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Geheim — niemals im Client | Nur in Server-Code mit vollem DB-Zugriff |

## Row Level Security (RLS)

Alle Tabellen haben RLS aktiviert. Policies basieren auf:
- `auth.uid()` — aktuell eingeloggter User
- `memberships`-Tabelle — Rolle des Users im Verein

Beispiel-Policies:
```sql
-- Spieler sieht nur Kalendereinträge seines Teams
CREATE POLICY "player_sees_own_team_events"
ON events FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Nur Admins können Mitglieder einladen
CREATE POLICY "admin_can_insert_memberships"
ON memberships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
    AND club_id = NEW.club_id
    AND role = 'admin'
  )
);
```

## Middleware
`middleware.ts` im Root:
- Prüft Supabase-Session bei jedem Request
- Leitet unauthentifizierte User auf `/login` um
- Erneuert abgelaufene Sessions (Token Refresh)
- Schützt alle Routen unter `/(dashboard)`

## Server-Komponenten & Route Handler
- Supabase Server Client (`createServerClient`) liest Session aus Cookies
- Rollen werden zusätzlich zur RLS geprüft (Defense in Depth)
- `server-only`-Paket verhindert, dass Server-Code in Client-Bundle landet

## Environment Poisoning verhindern
- Nur `NEXT_PUBLIC_*`-Variablen sind im Client verfügbar
- Kein `process.env.*` ohne `NEXT_PUBLIC_`-Prefix in Client Components
- Server-only Utilities in `src/lib/` mit `import 'server-only'` markieren

## Input-Validierung
- Alle Formulareingaben und API-Inputs mit Zod validieren (auf Server-Seite)
- Keine direkte SQL-Interpolation — Supabase Query Builder verhindert Injection

## Bekannte Risiken & Maßnahmen
| Risiko | Maßnahme |
|---|---|
| Tenant-Crossing (User sieht Daten anderes Vereins) | RLS-Policies prüfen immer `club_id` + `auth.uid()` |
| Session-Hijacking | Supabase JWT + HTTPOnly Cookies, kurze Ablaufzeiten |
| CSRF | Next.js Server Actions haben CSRF-Schutz eingebaut |
| Datenleck durch Service Role Key | Key nur in Server-Code, niemals `NEXT_PUBLIC_` |
