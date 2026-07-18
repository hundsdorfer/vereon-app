# Tech Stack

**Stand:** 2026-07-18

Die Versionsangaben stammen aus `package.json`, `package-lock.json` und dem installierten Abhängigkeitsbaum.

## Anwendung

| Technologie | deklariert | installiert | Einsatz |
|---|---:|---:|---|
| Next.js | `16.2.9` | `16.2.9` | App Router, Server Components, Server Actions, Proxy |
| React / React DOM | `19.2.4` | `19.2.4` | UI und interaktive Formulare |
| TypeScript | `^5` | `5.9.3` | `strict`, `noEmit`, Bundler-Auflösung |
| Tailwind CSS | `^4` | `4.3.1` | Styling über CSS und PostCSS |
| `react-qr-code` | `^2.2.0` | `2.2.0` | QR-Code für Team-Einladungen |
| `server-only` | `^0.0.1` | `0.0.1` | Schutz serverseitiger Module vor Client-Import |

Wichtige Konventionen:

- `src/`-Struktur und Alias `@/*` → `./src/*`,
- `src/proxy.ts` statt `middleware.ts`,
- dynamische `params` werden als Promise behandelt,
- Server Components sind Standard,
- `'use client'` nur bei Interaktion, lokalem Zustand oder Browser-APIs,
- kein `tailwind.config.js`; Design-Tokens stehen in `src/app/globals.css`.

Vor Änderungen an Next.js-Code sind die passenden lokalen Hinweise unter `node_modules/next/dist/docs/` zu prüfen.

## Backend und Datenbank

| Technologie | deklariert | installiert | Einsatz |
|---|---:|---:|---|
| `@supabase/supabase-js` | `^2.108.2` | `2.108.2` | Auth, Queries und RPCs |
| `@supabase/ssr` | `^0.12.0` | `0.12.0` | Browser-/Server-Clients mit Cookies |
| Supabase CLI | `^2.108.0` | `2.108.0` | lokaler Stack, Migrationen, Typgenerierung |
| PostgreSQL | lokal Major `17` | über Supabase | relationale Daten, RLS und RPCs |

Es gibt kein ORM. Die App verwendet Supabase Query Builder und PostgreSQL-Funktionen direkt. `src/types/database.types.ts` ist aktuell kein generierter Schematyp.

## Authentifizierung

- Supabase Auth mit E-Mail und Passwort,
- Session-Cookies über `@supabase/ssr`,
- serverseitige Sessionprüfung über `auth.getUser()`,
- Routenschutz in `src/proxy.ts`,
- kein NextAuth/Auth.js,
- kein OAuth-Provider implementiert.

## Qualität und Tooling

| Tool | deklariert | installiert | Verwendung |
|---|---:|---:|---|
| ESLint | `^9` | `9.39.4` | Flat Config, Next Core Web Vitals und TypeScript |
| `eslint-config-next` | `16.2.9` | `16.2.9` | Next.js-Regeln |
| Playwright | `^1.61.1` | `1.61.1` | drei Chromium-E2E-Specs |
| GitHub Actions | Workflow-Dateien | — | Lint/Build automatisch; E2E manuell |

## Befehle

| Zweck | Befehl | Hinweis |
|---|---|---|
| Entwicklung | `npm run dev` | Next.js Dev-Server |
| Produktionsbuild | `npm run build` | enthält Next.js-Typecheck |
| Produktionsstart | `npm run start` | setzt vorhandenen Build voraus |
| Lint | `npm run lint` | ESLint |
| Typecheck | `npx tsc --noEmit` | kein eigenes `typecheck`-Script |
| E2E | `npm run test:e2e` | benötigt laufende lokale Supabase-Dienste |
| E2E mit UI | `npm run test:e2e:ui` | interaktiv |
| E2E sichtbar | `npm run test:e2e:headed` | Chromium mit Fenster |

Es gibt kein `test`-Script und keine Unit-/Integrationstest-Bibliothek.

## CI- und Laufzeitstand

- `.github/workflows/ci.yml` verwendet Node.js 20 und führt `npm ci`, Lint und Build bei Push/PR auf `main` aus.
- `.github/workflows/e2e.yml` startet Supabase und Playwright nur manuell.
- Das Repository definiert kein `engines`-Feld und keine `.nvmrc`.
- Der lokal beobachtete Runtime-Stand war Node.js `24.18.0` und npm `11.16.0`; das ist keine verbindliche Projektversion.

## Nicht verwendet

- Prisma oder Drizzle,
- Redux oder Zustand,
- React Query,
- Zod,
- externe Komponentenbibliothek,
- Service Worker oder Push-Bibliothek.
