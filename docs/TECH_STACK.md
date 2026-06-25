# Tech Stack

## Frontend & Framework

| Technologie | Version | Zweck |
|---|---|---|
| Next.js | 16.x | App Framework (App Router, Server Components, Route Handlers) |
| React | 19.x | UI-Library |
| TypeScript | 5.x | Typsicherheit (strict mode) |
| Tailwind CSS | 4.x | Styling (utility-first, kein `tailwind.config.js`) |

### Wichtige Besonderheiten
- **Next.js 16:** `params` ist ein Promise, muss geawaitet werden
- **Tailwind v4:** Konfiguration via `@theme` in CSS, nicht in JS-Config
- **React 19:** Server Actions, `use()`-API, `'use client'` / `'use server'` Direktiven

## Backend & Datenbank

| Technologie | Zweck |
|---|---|
| Supabase | Postgres-Datenbank, Auth, Realtime, Storage |
| `@supabase/supabase-js` | Supabase JS Client |
| `@supabase/ssr` | SSR-kompatibler Supabase Client für Next.js |

### Kein separates ORM
- Direktes Arbeiten mit Supabase Query Builder
- Später optional: Supabase-generierte Typen via `supabase gen types`
- Kein Prisma, kein Drizzle

## Auth
- **Supabase Auth** (E-Mail/Passwort, später OAuth)
- Session-Management via `@supabase/ssr` (Cookies)
- Middleware-basierter Route-Schutz
- Kein NextAuth

## Supabase Client Strategie
```
src/lib/supabase/
  server.ts      → Für Server Components und Route Handlers (createServerClient)
  client.ts      → Für Client Components (createBrowserClient)
  middleware.ts  → Für middleware.ts (createServerClient mit Cookie-Mutation)
```

## Styling
- Tailwind CSS v4
- Keine externe Component-Library zu Beginn
- Eigene Primitives in `src/components/ui/`
- Später optional: shadcn/ui (wenn v4-kompatibel)

## Entwicklungswerkzeuge

| Tool | Zweck |
|---|---|
| ESLint 9 | Linting (Flat Config) |
| TypeScript | Typprüfung |
| `next dev` | Entwicklungsserver |

## Geplante Ergänzungen
- `server-only` Paket — verhindert Import von Server-Code in Client Components
- Supabase CLI — für lokale Entwicklung und Migrationen
- Zod — Schema-Validierung für Formulare und API-Inputs

## Nicht verwendet
- NextAuth
- Prisma / Drizzle
- Redux / Zustand (Entscheidung steht aus)
- React Query (Entscheidung steht aus — Supabase Realtime kann vieles abdecken)
