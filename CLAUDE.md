@AGENTS.md

# Vereon — Projektregeln für Claude

## Pflichtlektüre zu Sessionbeginn

1. `docs/PROJECT_BRIEF.md` — Kompaktzusammenfassung: Architektur, MVP, Rollen, Verbote
2. `docs/CURRENT_TASK.md` — Aktueller Arbeitsstand und nächste Schritte (falls vorhanden)

Bei Datenbankaufgaben zusätzlich: `docs/DATABASE_MODEL.md`, `docs/SECURITY.md`
Bei Rollenaufgaben zusätzlich: `docs/ROLES_AND_PERMISSIONS.md`
Bei Supabase-Aufgaben zusätzlich: `docs/SUPABASE_STRATEGY.md`
Bei MVP/Feature-Planung zusätzlich: `docs/MVP_SCOPE.md`

---

## Tech Stack (Kurzversion)

- Next.js 16 App Router — Breaking Changes beachten, `node_modules/next/dist/docs/` lesen
- TypeScript strict, Tailwind CSS v4 (kein `tailwind.config.js`, Konfiguration via `@theme`)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — kein NextAuth, kein Prisma
- `src/proxy.ts` statt `middleware.ts` (Next.js 16), `params` immer awaiten
- `@/*` → `./src/*`

---

## Arbeitsregeln

- **Kein großer Schritt ohne Plan** — erst Dateiliste + Vorhaben nennen, dann auf Bestätigung warten
- **Immer auflisten** welche Dateien geändert werden, bevor geändert wird
- Antworten kurz halten — keine Wiederholungen aus Docs, keine Zusammenfassungen am Ende
- Standard: Server Component. `'use client'` nur für State, Event Handler, Browser APIs
- Deutsch für Dokumentation und Kommentare; keine unnötigen Kommentare im Code

---

## Hard Constraints

- **Keine Remote-Datenbank** anfassen (kein `db push`, kein direkter Zugriff)
- **Kein `db reset`** ohne ausdrückliche Bestätigung in dieser Session
- **Migration nie befüllen** ohne ausdrückliche Bestätigung in dieser Session
- **Keine Secrets anzeigen** — kein `.env.local`, kein Service Role Key
- **`SUPABASE_SERVICE_ROLE_KEY` nie committen** — er umgeht RLS vollständig
- **Kein Anwendungscode ändern** ohne vorherige Bestätigung
- **Keine Packages installieren** ohne Bestätigung

---

## Dokumentation

Alle Architektur- und Produktentscheidungen landen in `docs/`. Vollständige Docs-Liste in `docs/PROJECT_BRIEF.md`.
