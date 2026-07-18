@AGENTS.md

# Vereon — Projektregeln für Claude

Alle gemeinsamen Arbeits-, Sicherheits-, Datenbank-, Git- und Qualitätsregeln
stehen in `AGENTS.md` und gelten auch für Claude Code.

---

## Tech Stack (Kurzversion)

- Next.js 16 App Router — Breaking Changes beachten, `node_modules/next/dist/docs/` lesen
- TypeScript strict, Tailwind CSS v4 (kein `tailwind.config.js`, Konfiguration via `@theme`)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — kein NextAuth, kein Prisma
- `src/proxy.ts` statt `middleware.ts` (Next.js 16), `params` immer awaiten
- `@/*` → `./src/*`

---

## Arbeitsregeln

- Claude Code übernimmt die Implementierung ausdrücklich freigegebener
  Entwicklungsaufträge.
- Vor einer Änderung Dateiliste, Vorgehen und vorgesehene Prüfungen nennen.
- Nach der Umsetzung erhält Codex den Diff und die Prüfergebnisse für einen
  unabhängigen Review.
- Bestätigte Reviewkorrekturen werden gezielt umgesetzt; Commit und Push bleiben
  eigene, ausdrücklich freizugebende Schritte.
- Antworten kurz halten. Der Abschluss nennt nur geänderte Dateien,
  ausgeführte beziehungsweise ausgelassene Prüfungen und verbleibende Risiken.

---

## Dokumentation

Alle Architektur- und Produktentscheidungen landen in `docs/`. Zuständigkeiten
und die vollständige Dokumentliste stehen in `docs/DOCS_INVENTORY.md`.
