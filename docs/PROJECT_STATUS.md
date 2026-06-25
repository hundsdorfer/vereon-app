# Project Status

**Stand:** 2026-06-25

---

## Kontext

Vereon wurde als **neue technische Basis neu gestartet**. Der alte Ordner `footworld` enthält nur eine statische Demo und dient ausschließlich als visuelle Referenz — er ist keine technische Grundlage.

Die aktuelle Codebasis (`vereon-app`) ist bewusst leer gehalten: technisch sauber, korrekt konfiguriert, bereit für echte Entwicklung.

---

## Aktueller Zustand

### Technische Basis
- [x] Next.js 16 (App Router) mit TypeScript, Tailwind CSS v4, ESLint 9
- [x] `src/`-Ordnerstruktur eingerichtet
- [x] TypeScript-Alias `@/*` → `./src/*` konfiguriert
- [x] Projektordner: `components`, `features`, `hooks`, `lib`, `lib/supabase`, `styles`, `types`
- [x] Build und Lint funktionieren fehlerfrei
- [x] GitHub Repository vorhanden
- [x] Vercel Deployment vorbereitet

### Dokumentation
- [x] `CLAUDE.md` — Projektregeln für Claude
- [x] `docs/PRODUCT_VISION.md` — Produktvision und Zielgruppe
- [x] `docs/ROADMAP.md` — Phasenplanung
- [x] `docs/MVP_SCOPE.md` — MVP-Abgrenzung und Akzeptanzkriterien
- [x] `docs/DATABASE_MODEL.md` — Vollständiges Datenmodell (15 Tabellen)
- [x] `docs/ROLES_AND_PERMISSIONS.md` — 10 Rollen, Berechtigungsmatrix
- [x] `docs/SUPABASE_STRATEGY.md` — Client-Strategie, Auth-Flow, RLS, Env-Variablen
- [x] `docs/TECH_STACK.md` — Tech-Entscheidungen
- [x] `docs/SECURITY.md` — Sicherheitsarchitektur
- [x] `docs/MOBILE_APP_STRATEGY.md` — PWA + Capacitor-Plan

### Noch nicht vorhanden
- [ ] Supabase-Projekt (Cloud) angelegt
- [ ] `.env.local` mit Supabase-Keys
- [ ] Supabase Packages installiert
- [ ] Datenbankschema / Migrationen
- [ ] Auth-Flow
- [ ] Irgendein Feature

---

## Nächste Schritte (in dieser Reihenfolge)

### Schritt 1 — Supabase einrichten
- Supabase Cloud-Projekt anlegen (Vereon Dev)
- `.env.local` mit URL + Anon Key anlegen
- Packages installieren: `@supabase/supabase-js`, `@supabase/ssr`
- Drei Supabase-Clients implementieren: `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts`

### Schritt 2 — Datenbankschema
- Migrations-Ordner anlegen (Supabase CLI oder direkt im Dashboard)
- Tabellen erstellen (Reihenfolge laut `DATABASE_MODEL.md`)
- RLS auf allen Tabellen aktivieren
- Seed-Daten für `roles` und `permissions`
- Trigger für automatisches `profiles`-Anlegen bei Registrierung

### Schritt 3 — Auth-Flow
- `middleware.ts` im Root (Route-Schutz)
- `/login` Seite und Server Action
- `/register` Seite und Server Action
- Passwort-Reset-Flow
- `/invite/[token]` — Einladungslink annehmen

### Schritt 4 — Erstes Feature: Verein anlegen
- Dashboard-Shell (Layout mit Sidebar/Header)
- `/clubs/new` — Verein anlegen
- Automatische `club_admin`-Mitgliedschaft

---

## Bekannte Entscheidungen (unveränderlich)

| Entscheidung | Begründung |
|---|---|
| Supabase statt NextAuth + Prisma | Weniger Schichten, RLS als echte Sicherheitsebene |
| Multi-Tenant von Anfang an | Nachträglich fast unmöglich einzubauen |
| `src/`-Ordnerstruktur | Langfristige Skalierbarkeit |
| Kein Realtime im MVP | Komplexität reduzieren, später nachrüsten |
| Capacitor statt React Native | Code-Sharing mit Web, eine Codebasis |

---

## Bekannte offene Fragen

| Frage | Priorität |
|---|---|
| Lokale Supabase-Instanz (Docker) oder nur Cloud? | Mittel |
| Supabase Realtime vs. Polling für Zu-/Absagen? | Phase 2 |
| Zod für Formularvalidierung von Anfang an? | Klären bei Schritt 3 |
| Notifications-Tabelle oder nur Supabase Realtime? | Phase 2 |
| Seasons als eigene Tabelle? | Klären bei Schritt 2 |
