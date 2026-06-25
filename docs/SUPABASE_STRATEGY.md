# Supabase Strategie — Vereon

**Stand:** 2026-06-25 (überarbeitet: Route-Handler-Client getrennt, Middleware weniger aggressiv)

---

## Überblick

Vereon verwendet Supabase als Backend-as-a-Service für:
- **Postgres-Datenbank** mit Row Level Security
- **Supabase Auth** für Authentifizierung und Session-Management
- **Supabase Storage** (Phase 2 — Profilbilder, Vereinslogo)
- **Supabase Realtime** (Phase 3 — Live-Updates)

Supabase wird **nicht als abstrahiertes ORM** genutzt — wir arbeiten direkt mit dem Query Builder.

---

## Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Kein NextAuth. Kein Prisma.**

---

## Client-Strategie — Vier Kontexte

Next.js 16 mit App Router hat vier verschiedene Ausführungskontexte mit unterschiedlichem Cookie-Zugriff. Jeder braucht eine eigene Client-Instanz:

```
src/lib/supabase/
  server.ts          → Server Components, Server Actions
  route-handler.ts   → Route Handlers (API-Endpunkte unter app/api/)
  client.ts          → Client Components ('use client')
  middleware.ts      → middleware.ts im Root (Cookies lesen + schreiben)
```

---

### `src/lib/supabase/server.ts`
Für **Server Components** und **Server Actions**.

Liest Cookies aus dem Request-Store von Next.js. Schreibt keine Cookies — das ist in Server Components technisch nicht möglich.

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
        setAll(cookiesToSet) {
          // Server Components können keine Response-Cookies setzen.
          // Token-Refresh passiert ausschließlich in der Middleware.
          // Dieser Client ist bewusst read-only für Cookies.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignoriert — in Server Components erwartet und kein Problem,
            // weil die Middleware den Refresh bereits erledigt hat.
          }
        },
      },
    }
  )
}
```

---

### `src/lib/supabase/route-handler.ts`
Für **Route Handlers** (`app/api/.../route.ts`).

Route Handlers haben Zugriff auf `NextRequest` und `NextResponse` — deshalb können hier Cookies korrekt geschrieben werden. Token-Refresh funktioniert in Route Handlers vollständig.

```ts
import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}
```

**Verwendung in einem Route Handler:**
```ts
// app/api/example/route.ts
import { createClient } from '@/lib/supabase/route-handler'

export async function GET(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... Query
  return NextResponse.json({ data }, { headers: response.headers })
}
```

---

### `src/lib/supabase/client.ts`
Für **Client Components** (`'use client'`).

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Wann verwenden:** Nur wenn clientseitiger State, Event Handler oder Browser-APIs benötigt werden. Für reine Datenanzeige immer den Server-Client bevorzugen.

---

### `src/lib/supabase/middleware.ts`
Für **`middleware.ts`** im Root. Liest und schreibt Cookies für Token-Refresh.

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

  // KRITISCH: Immer getUser() aufrufen — das ist der Token-Refresh-Mechanismus.
  // Niemals durch getSession() ersetzen — getSession() prüft den JWT nicht serverseitig.
  const { data: { user } } = await supabase.auth.getUser()

  return { supabase, supabaseResponse, user }
}
```

---

## Middleware — Route-Schutz

Die Middleware unterscheidet drei Kategorien von Routen:

```ts
// middleware.ts (Root)
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routen, die ohne Auth zugänglich sind
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback']
const PUBLIC_PREFIXES = ['/invite/', '/about', '/impressum', '/datenschutz']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))

  // Unauthentifiziert → nur Public Routes erlaubt
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return Response.redirect(loginUrl)
  }

  // Eingeloggt auf Login/Register → ins Dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return Response.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Alle Routen außer:
     * - _next/static (statische Dateien)
     * - _next/image (Bildoptimierung)
     * - favicon.ico
     * - Öffentliche statische Dateien (SVG, PNG, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Wichtig:** Die Landing Page `/` und statische Inhalte sind öffentlich. Der Redirect fügt `?redirect=` hinzu, damit nach dem Login zurücknavigiert werden kann.

---

## Auth-Flow

### Registrierung
1. User füllt Formular aus (E-Mail, Passwort)
2. Server Action ruft `supabase.auth.signUp()` auf
3. Supabase sendet Bestätigungs-E-Mail (Double-Opt-In)
4. Nach E-Mail-Bestätigung: Redirect zu `/auth/callback`
5. `/auth/callback` Route Handler tauscht Code gegen Session (PKCE-Flow)
6. DB-Trigger legt `profiles`-Eintrag an
7. Redirect zu `/dashboard`

### Login
1. Server Action ruft `supabase.auth.signInWithPassword()` auf
2. Session-Cookie wird gesetzt (HTTPOnly, Secure)
3. Redirect zu `/dashboard` oder gespeichertem `?redirect=`

### Logout
1. Server Action ruft `supabase.auth.signOut()` auf
2. Cookies werden gelöscht
3. Redirect zu `/login`

### Auth-Callback Route Handler
```ts
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/route-handler'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const { supabase, response } = createClient(request)
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/dashboard', request.url), {
      headers: response.headers,
    })
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## Sichere Club-Erstellung

Der erste `club_admin` darf **nie** via direktem Client-INSERT entstehen. Stattdessen:

```ts
// Server Action
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createClubAction(name: string, slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_club', { p_name: name, p_slug: slug })
  if (error) throw error
  return data
}
```

Die `create_club()`-Funktion in der Datenbank (SECURITY DEFINER) legt Verein, Mitgliedschaft und Rolle atomar an. Siehe `DATABASE_MODEL.md`.

---

## Row Level Security (RLS)

### Grundsatz
- Alle Tabellen: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Ohne explizite Policy: kein Zugriff (deny by default)
- Policies basieren auf `auth.uid()` + `club_member_roles` / `team_member_roles`

### SECURITY DEFINER Hilfsfunktionen

RLS-Policies sollen Hilfsfunktionen nutzen, nicht inline komplexe JOINs. Die Funktionen sind `STABLE` — innerhalb einer Query gecacht.

```sql
-- Beispiel-Policy mit Hilfsfunktion
CREATE POLICY "coaches_can_create_events"
ON events FOR INSERT
WITH CHECK (
  has_team_role(team_id, 'head_coach', 'assistant_coach')
);
```

**Sicherheitshinweis zu SECURITY DEFINER:**
- Alle SECURITY DEFINER-Funktionen dürfen **keine** User-kontrollierten Parameter direkt in SQL interpolieren
- Parameter müssen immer als `$1`, `$2` etc. übergeben werden (Parameterized Queries)
- Jede SECURITY DEFINER-Funktion muss `search_path = ''` setzen:
  ```sql
  SET search_path = '';
  ```
  Verhindert Schema-Injection via `search_path`-Manipulation.

### Beispiel-Policies

```sql
-- Events: Teammitglieder lesen
CREATE POLICY "team_members_read_events"
ON events FOR SELECT
USING (has_team_role(team_id, 'head_coach', 'assistant_coach', 'team_manager', 'player', 'guardian'));

-- Events: Coaches erstellen
CREATE POLICY "coaches_insert_events"
ON events FOR INSERT
WITH CHECK (has_team_role(team_id, 'head_coach', 'assistant_coach'));

-- event_attendance: Spieler setzt eigene RSVP
CREATE POLICY "player_sets_own_rsvp"
ON event_attendance FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- event_attendance: Guardian setzt RSVP für Kind
CREATE POLICY "guardian_sets_child_rsvp"
ON event_attendance FOR UPDATE
USING (is_guardian_of(player_id))
WITH CHECK (is_guardian_of(player_id));
```

---

## Umgebungsvariablen

### `.env.local` (niemals committen)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Niemals im Frontend-Code:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Der Service-Role-Key umgeht RLS vollständig. Er gehört **ausschließlich** in:
- Supabase CLI für Migrationen
- Serverless Admin-Scripts
- Niemals in Next.js-Anwendungscode, auch nicht in Server Actions

### Variablen-Regeln

| Präfix | Sichtbarkeit | Verwendung |
|---|---|---|
| `NEXT_PUBLIC_` | Client + Server | Supabase URL, Anon Key |
| *(kein Präfix)* | Nur Server | Service Role Key (nur CLI/Scripts) |

---

## Dev / Prod Trennung

### Entwicklung (lokal)
- Supabase Cloud Projekt: **Vereon Dev**
- `.env.local` mit Dev-Keys
- Supabase Dashboard für manuelle Inspektion

### Produktion
- Supabase Cloud Projekt: **Vereon Prod**
- Keys ausschließlich in Vercel Environment Variables (nicht in `.env.production`)
- Separate Migrations-History — Prod wird nie manuell geändert

### Option: Lokale Supabase-Instanz (empfohlen für Entwicklung)

```bash
npx supabase init
npx supabase start
```

Vorteile: Offline-fähig, Migrations testbar, keine Dev-Daten in Cloud.
Entscheidung: Wird zu Beginn mit lokaler Instanz entwickelt.

---

## Supabase-Typen generieren

Sobald das Datenbankschema stabil ist:

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

Diese Datei:
- Wird nicht manuell bearbeitet
- Ermöglicht vollständige TypeScript-Typen für alle Queries
- Wird nach jeder Schemamigration neu generiert
- Liegt in `src/types/database.types.ts`, nicht in `src/types/supabase.ts` (klarerer Name)

---

## Was Supabase nicht macht (in Vereon)

- **Kein Supabase Edge Functions** — Logik lebt in Next.js Route Handlers und Server Actions
- **Kein Supabase Auth UI** — eigene Login/Register-Seiten
- **Kein Supabase Realtime im MVP** — Phase 3
- **Kein Supabase Storage im MVP** — Phase 2
- **Kein Service Role Key in der App** — nur CLI und Admin-Scripts
