# Project Status

**Stand:** 2026-06-25

## Phase
Alpha — technisches Grundgerüst

## Abgeschlossen
- [x] Next.js 16 Projekt initialisiert
- [x] `src/`-Struktur eingerichtet
- [x] TypeScript-Alias `@/*` → `./src/*` konfiguriert
- [x] Ordnerstruktur angelegt (`components`, `features`, `hooks`, `lib`, `types`)
- [x] Projektdokumentation erstellt (`docs/`)
- [x] `CLAUDE.md` mit Projektregeln

## In Arbeit
- [ ] Supabase-Client einrichten (`src/lib/supabase/`)
- [ ] Auth-Flow (Login, Register, Logout)
- [ ] Middleware für Route-Schutz
- [ ] Datenbank-Schema (Vereine, Teams, Rollen, Mitgliedschaften)

## Noch offen
- [ ] Dashboard-Layout (App-Shell, Sidebar, Header)
- [ ] Kern-Features (Teams, Spieler, Kalender, Anwesenheit)
- [ ] Rollen- und Rechtesystem
- [ ] PWA-Konfiguration
- [ ] Mobile App Strategie umsetzen

## Bekannte Entscheidungen
- Kein NextAuth, kein Prisma — direkte Supabase-Integration
- Row Level Security ist Pflicht
- Multi-Tenant-Architektur von Anfang an

## Nächste Schritte
1. Supabase-Projekt anlegen und Umgebungsvariablen setzen
2. Supabase-Clients implementieren (server, browser, middleware)
3. Auth-Seiten anlegen (`/login`, `/register`)
4. Datenbank-Schema definieren und migrieren
