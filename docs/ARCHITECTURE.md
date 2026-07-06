# Architecture — Vereon

**Stand:** 2026-07-06 — beschreibt den tatsächlichen Code-Zustand (nicht die Planung). Für Entscheidungsbegründungen siehe `TECH_STACK.md`, `SUPABASE_STRATEGY.md`, `DATABASE_MODEL.md`, `ROLES_AND_PERMISSIONS.md`.

---

## 1. Tech-Stack

| Bereich | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI | React / react-dom | 19.2.4 |
| Sprache | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS (kein `tailwind.config.js`, Konfiguration via `@theme` in `globals.css`) | ^4 |
| Backend/DB | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | ^0.12 / ^2.108 |
| QR-Code | `react-qr-code` | ^2.2 |
| E2E-Tests | `@playwright/test` | ^1.61 |
| Lint | ESLint + `eslint-config-next` | ^9 / 16.2.9 |

Bewusst **nicht** vorhanden: Prisma, NextAuth, Redux/Zustand, globales Toast-System. **Zod ist trotz Empfehlung in `SECURITY.md` nicht installiert** — serverseitige Validierung erfolgt manuell in den Server Actions (String-Checks, Regex, Enum-Vergleiche).

Scripts (`package.json`): `dev`, `build`, `start`, `lint`, `test:e2e` (+ `:ui`, `:headed`). Kein Unit-Test-Script.

---

## 2. Konfiguration

- **`next.config.ts`** — minimal, setzt nur `allowedDevOrigins` (private IP-Ranges für Geräte-Tests im lokalen Netz während der Entwicklung).
- **`tsconfig.json`** — `strict: true`, `moduleResolution: bundler`, Pfad-Alias `@/*` → `./src/*`.
- **`src/proxy.ts`** — Next.js-16-Ersatz für `middleware.ts` (Export-Name `proxy` statt `middleware`). Ruft `updateSession()` aus `src/lib/supabase/middleware.ts` auf, die immer `supabase.auth.getUser()` verwendet (nie `getSession()`, da nur `getUser()` das JWT serverseitig verifiziert). Definiert `PUBLIC_ROUTES` (`/`, `/login`, `/register`, `/auth/callback`) und `PUBLIC_PREFIXES` (`/join/`, `/legal/`, sowie `/dev/` nur in `development`). Leitet nicht eingeloggte Nutzer zu `/login?redirect=` um, eingeloggte Nutzer weg von `/login`/`/register` zu `/dashboard`.
- **`src/app/globals.css`** — Tailwind-v4-Theme über `@theme inline`. Farb-Umschaltung über `data-theme`-Attribut (per `@custom-variant dark`), nicht über reine `prefers-color-scheme`-Media-Query — letztere dient nur als Fallback beim allerersten Laden (Inline-Script in `layout.tsx`, vor Hydration), danach übernimmt `localStorage('vereon-theme')`. Definiert ein vollständiges Light/Dark-Farbtoken-System plus eine eigene, immer dunkle Navigations-Palette (`--nav-*`).

---

## 3. Ordnerstruktur (`src/`)

```
src/
  actions/            Server Actions ('use server'), je Feature eine Datei
    auth.ts             signIn / signUp / signOut
    team.ts             createTeamAction
    join.ts             submitJoinRequestSelf/GuardianAction
    joinRequests.ts     approve/rejectJoinRequestAction
    events.ts           createEventAction, respondToEventAction
    players.ts          removePlayerFromTeamAction (uncommitted, s. STATUS.md)

  app/                App Router
    (app)/              Route-Gruppe: authentifizierter Bereich (Sidebar/Shell)
      dashboard/
      teams/            Liste, Detail, Invite, Requests, Events (+ new/[eventId])
    (auth)/             Route-Gruppe: Login/Register (zentrierte Card-Shell)
    auth/callback/      Route Handler — PKCE Code-Exchange nach E-Mail-Bestätigung
    join/[code]/        Öffentliche Beitritts-Landingpage (außerhalb der Route-Gruppen)
    legal/{imprint,privacy,terms}/  Platzhalter-Seiten (s. STATUS.md)
    dev/ui-preview/     Nur in development erreichbar (proxy blockt in production)
    layout.tsx          Root-Layout: Fonts, Theme-Init-Script, PWA-Metadaten
    manifest.ts         PWA-Manifest

  components/
    ui/                 Generische Design-System-Primitives: Button, Card, Input,
                        Label, Badge, EmptyState, FormError, PageHeader,
                        RsvpStatusBadge, ConfirmButton
    layout/             App-Chrome: AppShell, NavLinks, ThemeProvider, ThemeToggle

  features/             Client Components, pro Feature-Slice, ohne eigene
                        actions/hooks/types-Unterordner (Actions liegen zentral)
    auth/  teams/  join/  joinRequests/  events/  players/

  hooks/                leer (.gitkeep)
  lib/
    supabase/           client.ts, server.ts, route-handler.ts, middleware.ts
                        (kein admin.ts — Service-Role-Key wird nie im App-Code verwendet)
    format.ts, utils.ts
  styles/               leer (.gitkeep)
  types/
    database.types.ts   aktuell nur 7-Zeilen-`Json`-Stub, keine generierten
                        Supabase-Typen (s. STATUS.md)
  proxy.ts
```

### Routen-Übersicht

| Pfad | Datei | Zweck |
|---|---|---|
| `/` | `app/page.tsx` | Reiner Redirect: eingeloggt → `/dashboard`, sonst → `/login` |
| `/login`, `/register` | `app/(auth)/*/page.tsx` | Auth-Formulare |
| `/auth/callback` | `app/auth/callback/route.ts` | PKCE-Code-Exchange |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Rollenabhängige Übersicht (Trainer vs. Spieler/Guardian) |
| `/teams` | `app/(app)/teams/page.tsx` | Teamliste |
| `/teams/new` | `.../teams/new/page.tsx` | Team-Erstellung |
| `/teams/[teamId]` | `.../teams/[teamId]/page.tsx` | Team-Detail: Roster, nächste Trainings, Invite-/Requests-CTAs |
| `/teams/[teamId]/invite` | `.../invite/page.tsx` | Einladungscode + QR-Code |
| `/teams/[teamId]/requests` | `.../requests/page.tsx` | Beitrittsanfragen prüfen |
| `/teams/[teamId]/events` | `.../events/page.tsx` | Trainingsliste (upcoming/past) |
| `/teams/[teamId]/events/new` | `.../events/new/page.tsx` | Training erstellen |
| `/teams/[teamId]/events/[eventId]` | `.../events/[eventId]/page.tsx` | Trainingsdetail + RSVP |
| `/join/[code]` | `app/join/[code]/page.tsx` | Öffentliche Beitrittsseite (Self/Guardian) |
| `/legal/{imprint,privacy,terms}` | `app/legal/*/page.tsx` | Platzhalter-Rechtstexte |
| `/dev/ui-preview` | `app/dev/ui-preview/page.tsx` | Komponenten-Showcase, nur Dev |

---

## 4. Datenfluss-Pattern

Durchgängiges Muster für jede Mutation, nachvollzogen am Beispiel **Team erstellen**:

1. **Page** (`app/(app)/teams/new/page.tsx`) — Server Component, rendert nur `<CreateTeamForm />`.
2. **Client Component** (`features/teams/CreateTeamForm.tsx`) — `'use client'`, bindet die Server Action per React-19-`useActionState(createTeamAction, null)` an `<form action={action}>`.
3. **Server Action** (`actions/team.ts` → `createTeamAction`) — validiert Minimalfelder, holt den Server-Client aus `lib/supabase/server.ts`, ruft `supabase.rpc('create_independent_team', {...})` auf.
4. **DB-Funktion** `create_independent_team()` (SECURITY DEFINER) — legt atomar `teams`-Zeile, `team_memberships` und `team_member_roles` (Owner + optional Head Coach) an, gibt `team_id` zurück.
5. Action ruft `revalidatePath('/teams')` + `revalidatePath('/dashboard')` und `redirect('/teams/[teamId]')`.
6. **Detailseite** liest danach direkt per Supabase-Query-Builder (Server-Client) sowie über `supabase.rpc('has_team_role', ...)` für Rollen-Gating.

Dieses Muster (Server Component → `useActionState`-Formular → Server Action → `supabase.rpc()` auf SECURITY-DEFINER-Funktion → `revalidatePath`/`redirect`) wiederholt sich identisch in `events.ts`, `join.ts`, `joinRequests.ts`, `players.ts`. **Privilegierte Mutationen laufen praktisch nie über rohe `.insert()`/`.update()`** — Autorisierungslogik liegt in Postgres (RLS + SECURITY DEFINER), nicht verdoppelt in TypeScript. Lesezugriffe (z. B. Team-Detailseite) nutzen dagegen direkt den Supabase-Query-Builder, da hier RLS allein ausreicht.

---

## 5. Auth & Autorisierung

- **4 Supabase-Client-Varianten** unter `src/lib/supabase/`:
  - `server.ts` — Server Components/Actions, Cookie-Zugriff via `next/headers`, `import 'server-only'`.
  - `route-handler.ts` — für `NextRequest`-Kontexte (genutzt in `auth/callback/route.ts`).
  - `client.ts` — `'use client'`, Browser-Client.
  - `middleware.ts` — `updateSession()`, aufgerufen aus `src/proxy.ts`.
  - Kein Admin-/Service-Role-Client existiert im App-Code.
- **Session-Prüfung**: immer `getUser()`, nie `getSession()` (verifiziert das JWT tatsächlich server-seitig statt nur den Cookie zu lesen).
- **Routenschutz**: zentral über `src/proxy.ts` (Public-Routes/-Prefixes-Listen), zusätzlich pro Seite ein eigener `if (!user) redirect('/login')`-Check (Doppelung, aber konsistent).
- **Rollenprüfung zur Laufzeit**: über RPCs `has_team_role(p_team_id, p_role_keys[])` / `has_club_role(...)`, direkt aus Server Components aufgerufen (z. B. `isTrainer`, `canManageMembers` in der Team-Detailseite). Diese App-seitige Prüfung ist reine UI-Convenience — die SECURITY-DEFINER-Funktionen prüfen die Berechtigung beim Schreiben erneut (Defense in Depth).
- **Tatsächlich verdrahtete Rollen**: `team_owner`, `head_coach` (Management-UI), `player`, `guardian` (Self-Service). Weitere in `ROLES_AND_PERMISSIONS.md` dokumentierte Rollen (Club-Rollen, `assistant_coach`, `team_manager`, `goalkeeper_coach` etc.) sind architektonisch vorgesehen, aber ohne aktiven UI-/RLS-Pfad.

---

## 6. Datenbank & Migrationen

13 Migrationsdateien unter `supabase/migrations/` (Dateinamen tragen volle Timestamps, nicht das idealisierte `001_/002_`-Schema aus `PROJECT_BRIEF.md`):

| Migration | Inhalt |
|---|---|
| `20260625190923_init_mvp0_core` | Kern-Tabellen (roles, profiles, clubs, teams, memberships), RLS, Helper-Funktionen, `create_club()`, `create_independent_team()` |
| `20260625221615_mvp0a_team_flows` | `team_invitation_links`, `team_join_requests`, `players` (minimal) |
| `20260627000001_fix_authenticated_table_grants` | Hotfix: fehlende SELECT-Grants für `authenticated` |
| `20260627100000_add_team_public_code` | `public_code`, `generate_team_code()` |
| `20260627200000_add_join_request_type` | `request_type`/`requester_user_id`, 3 neue RPCs |
| `20260628000000_add_profile_registration_fields` | Profilfelder, `handle_new_user`-Trigger erweitert |
| `20260629000000_add_join_flow_improvements` | `players.date_of_birth`, Join-RPCs ohne Name-Spoofing |
| `20260629100000_fix_players_trainer_rls` | Hotfix: SECURITY-DEFINER-Funktionen für Trainer-Sichtbarkeit auf Spieler |
| `20260629200000_add_events` | `events`, `event_attendance`, RLS, RPCs, Attendance-Trigger |
| `20260629300000_fix_player_event_rls` | Hotfix: `is_player_in_team()`, `is_guardian_in_team()` |
| `20260629400000_add_pta_player_policy` | Hotfix: Self-Player liest eigene aktive Assignment |
| `20260702000000_players_birth_year_only` | `submit_join_request_guardian` auf `birth_year` umgestellt |
| `20260704120000_remove_player_from_team.sql` | Remove-Player-RPC + RSVP-Autorisierungsfix (uncommitted, s. STATUS.md) |

**Konventionen**: jede Tabelle mit `CREATE TABLE IF NOT EXISTS`, UUID-PK via `gen_random_uuid()`, Enum-artige Spalten über `CHECK`-Constraints, kein Hard-Delete (Soft-Delete via `status`/`is_active`/`left_at`). Jede SECURITY-DEFINER-Funktion setzt `SET search_path = ''` und referenziert Tabellen explizit mit `public.`-Präfix (verhindert Schema-Injection).

---

## 7. UI-/Formular-Pattern

- Jedes mutierende Formular nutzt React 19 `useActionState(actionFn, null)` → `[state, action, isPending]`, gebunden an `<form action={action}>`.
- Einheitliche Fehleranzeige über `<FormError message={state?.error} />` (rendert `null` wenn kein Fehler).
- `Button` trägt einen `loading`-Prop mit eingebautem Spinner — keine separate Spinner-Komponente nötig.
- **Kein globales Toast-System** — Erfolg wird inline im jeweiligen Formular angezeigt (z. B. „Entfernt“-Text nach Abschluss), nicht per Redirect/Notification.
- `ConfirmButton` (`components/ui/ConfirmButton.tsx`) ist das erste wiederverwendbare Zwei-Schritt-Bestätigungsmuster für destruktive Aktionen (Klick → Inline-Warnung → Bestätigen/Abbrechen), aktuell genutzt von `RemovePlayerButton`.
- Rollenbasierte UI-Verzweigung (`isTrainer`, `canManageMembers`) wird pro Seite serverseitig berechnet, nicht über einen gemeinsamen Hook — dieselbe Formel ist unabhängig in `dashboard/page.tsx` und `teams/page.tsx` dupliziert.
