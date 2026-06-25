@AGENTS.md

# Vereon — Projektregeln für Claude

## Was ist Vereon?
SaaS-Plattform für Fußball-Vereinsmanagement. Multi-Tenant: mehrere Vereine, mehrere Teams, mehrere Rollen pro User.

## Tech Stack
- **Framework:** Next.js 16 (App Router) — Breaking Changes beachten, docs in `node_modules/next/dist/docs/` lesen
- **Sprache:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 — kein `tailwind.config.js`, Konfiguration in CSS via `@theme`
- **Auth & DB:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Kein** NextAuth, kein Prisma, kein separates ORM

## Projektstruktur
```
src/
  app/           → Next.js App Router (Routing)
  components/    → Wiederverwendbare UI-Komponenten
  components/ui/ → Primitive (Button, Input, Card…)
  features/      → Feature-Module (teams, players, matches…)
  hooks/         → Custom React Hooks
  lib/           → Utilities, Server-Logik
  lib/supabase/  → Supabase-Clients (server/client/middleware)
  styles/        → Zusätzliche globale Styles
  types/         → Globale TypeScript-Typen
docs/            → Projektdokumentation
```

## TypeScript-Alias
`@/*` zeigt auf `./src/*`. Beispiel: `import { cn } from '@/lib/utils'`

## Architekturregel: Auth & Sicherheit
- Auth **immer serverseitig prüfen** — nie nur im Client
- **Row Level Security (RLS)** in Supabase ist Pflicht für alle Tabellen
- Supabase-Server-Client (`@supabase/ssr`) für Server Components, Route Handlers und Middleware
- Supabase-Browser-Client nur für clientseitige Reads ohne sensitive Daten
- Rollen und Rechte über eigene DB-Tabellen (`roles`, `memberships`) — nicht nur über Supabase-Metadaten
- `middleware.ts` schützt alle geschützten Routen

## Architekturregel: Routing
- Route Groups: `(auth)` für Login/Register, `(dashboard)` für die gesicherte App
- `params` in Next.js 16 ist ein **Promise** — immer awaiten: `const { id } = await params`

## Architekturregel: Server vs. Client Components
- Standard: Server Component (kein `'use client'`)
- `'use client'` nur für: State, Event Handler, Browser APIs, Custom Hooks
- Datenbankzugriffe und API-Keys **niemals** in Client Components

## Stil
- Keine unnötigen Kommentare
- Keine Docstrings, keine Zusammenfassungen am Ende
- Kein Boilerplate, keine Features die nicht gefragt sind
- Deutsch ist die Arbeitssprache für Dokumentation und Kommentare

## Dokumentation
Alle Architektur- und Produktentscheidungen landen in `docs/`. Vor größeren Änderungen die relevanten Docs lesen.
