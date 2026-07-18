# Vereon

Vereon ist eine rollenbasierte Webanwendung für die Organisation von Fußballmannschaften. Der aktuelle Einzelteam-MVP umfasst Authentifizierung, Mannschaftserstellung, Beitritt per Einladungscode, Trainingsplanung und RSVP für Spieler beziehungsweise Guardians.

Die Anwendung basiert auf Next.js 16, React 19, TypeScript, Tailwind CSS 4 und Supabase. Der tatsächliche technische Stand ist in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) dokumentiert; offene Abweichungen und Pilotrisiken stehen in [`docs/STATUS.md`](docs/STATUS.md).

## Lokale Entwicklung

Voraussetzungen:

- Node.js und npm; CI verwendet derzeit Node.js 20
- Docker

Einmalige Einrichtung:

```text
npm ci
Kopie von .env.example als .env.local anlegen
npx supabase start
```

Die Vorlage beschreibt die für die lokale Anwendung erwarteten
Umgebungsvariablen. Werte und Secrets aus `.env.local` werden weder committed
noch ausgegeben.

Entwicklung starten:

```bash
npm run dev
```

Die Webanwendung ist anschließend standardmäßig unter `http://localhost:3000` erreichbar. Die lokale Supabase-Instanz läuft über die in `supabase/config.toml` hinterlegten Ports.

`supabase/seed.sql` enthält derzeit keine wiederverwendbaren Testkonten. Die
vorhandenen E2E-Kernflows registrieren eigene isolierte Testnutzer.

## Verfügbare Befehle

```bash
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npx supabase stop
```

Es gibt derzeit keinen eigenen npm-Befehl für den Typecheck sowie keine Unit- oder Integrationstests. Details zur Testabdeckung stehen in [`docs/MVP_TEST_CHECKLIST.md`](docs/MVP_TEST_CHECKLIST.md).

## Dokumentation

- [`docs/FEATURE_CATALOG.md`](docs/FEATURE_CATALOG.md) — fachliche Funktionsquelle
- [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md) — Phasen und Scope
- [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) — Nutzerabläufe
- [`docs/ROLES_AND_PERMISSIONS.md`](docs/ROLES_AND_PERMISSIONS.md) — Rollen und Berechtigungen
- [`docs/DATABASE_MODEL.md`](docs/DATABASE_MODEL.md) — fachliches Ziel-Datenmodell
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — implementierter technischer Ist-Zustand
- [`docs/STATUS.md`](docs/STATUS.md) — aktuelles technisches Audit und Risiken
- [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md) — dauerhafte Entscheidungen

Vor Änderungen sind außerdem [`AGENTS.md`](AGENTS.md) und [`CLAUDE.md`](CLAUDE.md) zu beachten.

## Deployment

Das interne Entwicklungs-Deployment wird über Vercel bereitgestellt und verwendet Supabase Cloud. Remote-Migrationen, Deployments, Commits und Pushes erfolgen ausschließlich nach ausdrücklicher Freigabe.
