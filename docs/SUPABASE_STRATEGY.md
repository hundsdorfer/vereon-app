# Supabase Strategie — Vereon

**Stand:** 2026-06-25

---

## Überblick

Vereon verwendet Supabase als Backend-as-a-Service für:
- **Postgres-Datenbank** mit Row Level Security
- **Supabase Auth** für Authentifizierung und Session-Management
- **Supabase Storage** (später, für Profilbilder etc.)
- **Supabase Realtime** (später, für Live-Updates)

Supabase wird **nicht als abstrahiertes ORM** genutzt — wir arbeiten direkt mit dem Query Builder.

---

## Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- `@supabase/supabase-js` — Supabase Client (Queries, Auth, Storage)
- `@supabase/ssr` — SSR-kompatible Client-Factory für Next.js (Cookie-basierte Sessions)

**Kein NextAuth. Kein Prisma.**

---

## Client-Strategie

Next.js 16 mit App Router erfordert drei verschiedene Supabase-Client-Instanzen, weil jede Umgebung anders mit Cookies umgeht.

```
src/lib/supabase/
  server.ts      → Server Components, Route Handlers (nur lesen)
  client.ts      → Client Components (Browser)
  middleware.ts  → middleware.ts (lesen + schreiben)
```

---

### `src/lib/supabase/server.ts`
Für **Server Components** und **Route Handlers**.
Liest Cookies aus dem Request — schreibt keine (read-only Cookie-Store).

```ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Server Components können keine Cookies setzen — bewusst leer
        },
      },
    }
  )
}
```

---

### `src/lib/supabase/client.ts`
Für **Client Components** (`'use client'`).
Erstellt einen Browser-Client mit Cookie-Zugriff über `document.cookie`.

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

### `src/lib/supabase/middleware.ts`
Für **`middleware.ts`** im Root.
Muss Cookies lesen **und schreiben** können (Token-Refresh).

```ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session auffrischen — kritisch: nicht weglassen
  const { data: { user } } = await supabase.auth.getUser()

  return { supabase, supabaseResponse, user }
}
```

---

## Auth-Flow

### Registrierung
1. User füllt Formular aus (E-Mail, Passwort)
2. Server Action ruft `supabase.auth.signUp()` auf
3. Supabase sendet Bestätigungs-E-Mail
4. Nach Bestätigung wird `profiles`-Eintrag via DB-Trigger angelegt
5. User wird zu `/dashboard` weitergeleitet

### Login
1. User gibt E-Mail + Passwort ein
2. Server Action ruft `supabase.auth.signInWithPassword()` auf
3. Supabase setzt Session-Cookie (HTTPOnly)
4. Middleware erkennt Session ab dem nächsten Request
5. Redirect zu `/dashboard`

### Logout
1. Client-seitiger Button ruft Server Action auf
2. `supabase.auth.signOut()` löscht Session
3. Cookies werden gelöscht
4. Redirect zu `/login`

### Session-Refresh (automatisch)
- `middleware.ts` ruft bei jedem Request `supabase.auth.getUser()` auf
- Das erneuert stillschweigend abgelaufene Access Tokens
- Ohne diesen Schritt werden Sessions nach kurzer Zeit ungültig

---

## Middleware — Route-Schutz

```ts
// middleware.ts (Root)
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register') ||
                      request.nextUrl.pathname.startsWith('/invite')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return Response.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/login' ||
               request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return Response.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
```

---

## Row Level Security (RLS)

### Grundsatz
- Alle Tabellen haben `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Ohne explizite Policy: **kein Zugriff** (deny by default)
- Policies basieren auf `auth.uid()` und den `club_memberships` / `team_memberships` Tabellen

### Beispiel: Events

```sql
-- Nur Teammitglieder können Events ihres Teams lesen
CREATE POLICY "team_members_read_events"
ON events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_memberships
    WHERE team_id = events.team_id
    AND user_id = auth.uid()
  )
);

-- Nur Coaches können Events erstellen
CREATE POLICY "coaches_insert_events"
ON events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_memberships
    WHERE team_id = events.team_id
    AND user_id = auth.uid()
    AND role IN ('head_coach', 'assistant_coach')
  )
);
```

### Hilfsfunktionen

Häufig genutzte Prüfungen als SECURITY DEFINER Funktionen kapseln:

```sql
-- Ist der aktuelle User Mitglied des Vereins?
CREATE FUNCTION is_club_member(p_club_id uuid) RETURNS boolean ...

-- Hat der aktuelle User eine bestimmte Rolle im Verein?
CREATE FUNCTION has_club_role(p_club_id uuid, p_role text) RETURNS boolean ...

-- Ist der aktuelle User Mitglied des Teams?
CREATE FUNCTION is_team_member(p_team_id uuid) RETURNS boolean ...
```

---

## Umgebungsvariablen

### `.env.local` (lokale Entwicklung, nie committen)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Niemals im Frontend:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Nur in isolierten Server-Operationen, nicht in Next.js App
```

### Variablen-Regeln
- `NEXT_PUBLIC_*` — im Client-Bundle sichtbar. Nur URL und Anon-Key hier.
- Ohne `NEXT_PUBLIC_` — nur auf dem Server verfügbar. Für Service-Role-Key.
- Der Service-Role-Key **umgeht RLS vollständig** — nur für Admin-Scripts, Migrations, nie in der App.

---

## Dev / Prod Trennung

### Lokal (Entwicklung)
- Supabase Cloud Projekt: **Vereon Dev**
- Eigene Datenbank, eigene Auth-Keys
- `.env.local` mit Dev-Keys

### Produktion
- Supabase Cloud Projekt: **Vereon Prod**
- Keys in Vercel Environment Variables hinterlegt (nicht in `.env`)
- Separate Migrations-History

### Später: Lokale Supabase-Instanz (optional)
```bash
supabase init
supabase start   # Startet lokale Postgres + Auth Instanz via Docker
```
Für vollständig offline-fähige Entwicklung — Entscheidung steht noch aus.

---

## Supabase Typen (geplant)

Sobald das Schema stabil ist:

```bash
supabase gen types typescript --project-id xxxx > src/types/supabase.ts
```

Diese Datei wird nicht manuell bearbeitet — sie wird generiert.
Sie ermöglicht vollständige TypeScript-Typen für alle Queries.

---

## Was Supabase nicht macht (in Vereon)

- **Kein Supabase Edge Functions** — Logik lebt in Next.js Route Handlers und Server Actions
- **Kein Supabase UI / Auth UI** — eigene Login-Seiten
- **Kein Supabase Realtime im MVP** — kein Echtzeit-Polling in Phase 1
- **Kein Supabase Storage im MVP** — kein Bild-Upload in Phase 1
