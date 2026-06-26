# Current Task — Vereon

## Aktueller Stand

Abgeschlossen:

* Next.js 16 Projekt steht
* Supabase Client Foundation ist eingebaut
* Docker Desktop läuft, lokale Supabase-Instanz läuft
* `.env.local` ist lokal befüllt und wird nicht committed
* Migration 001 `init_mvp0_core` ist abgeschlossen und lokal verifiziert
* Migration 002 `mvp0a_team_flows` ist abgeschlossen und lokal verifiziert
* Auth/RPC-Testflow Migration 002 funktioniert:
  Trainer erstellt Team → erstellt Einladungslink → Elternteil erstellt Kind + Join Request → Trainer approved → Player/Guardian/Assignment entstehen korrekt
* TypeScript-Datenbanktypen wurden generiert
* Lint und Build waren erfolgreich
* Phase A UI-Fundament ist abgeschlossen:
  * responsive AppShell mit Mobile Topbar und Bottom Navigation
  * Light/Dark Theme über `data-theme`-Attribut
  * localStorage-Key `vereon-theme`
  * ThemeToggle funktioniert auf PC und echtem Smartphone
  * Bottom Navigation, Safe Area und Touch Targets korrekt
  * `allowedDevOrigins` in `next.config.ts` gesetzt — Handy-Hydration lokal funktioniert
  * temporäre Debug-Seiten und Diagnoseanzeigen entfernt
  * UI-Basiskomponenten (Button, Input, Label, Card, Badge, EmptyState, FormError, PageHeader)

## Aktuelle Hauptaufgabe

Phase B.1 umsetzen: Routing- und Auth-Grundstruktur.

Ziel: Die App soll lokal im Browser testbar Login/Register, geschützte App-Routen und Redirects unterstützen.

## Scope Phase B.1

Zu bauen:

* Route-Gruppen `(auth)` und `(app)`
* Login-Seite mit `LoginForm`
* Register-Seite mit `RegisterForm`
* Auth-Layout (kein AppShell)
* App-Layout mit AppShell
* `/dashboard` Platzhalter
* `/auth/callback/route.ts`
* `src/actions/auth.ts`
* Root `/` Redirect: eingeloggt → `/dashboard`, nicht eingeloggt → `/login`
* Phase-A-Preview von `/` nach `/dev/ui-preview` verschieben
* `proxy.ts` Route-Schutz:
  * geschützt: `/dashboard`, `/teams`
  * öffentlich: `/login`, `/register`, `/auth/callback`, `/join/*`, `/dev/ui-preview`

Noch nicht bauen:

* Kein Team-erstellen-Flow in der UI
* Kein `create_independent_team()` in der UI
* Kein Einladungslink-Flow
* Kein Join Request Flow
* Kein echtes Team-Dashboard
* Keine neue Migration

## Erlaubt

* Dokumentation lesen
* Phase B.1 planen
* Phase B.1 App-Dateien umsetzen
* Lint und Build ausführen

## Verboten

* Keine Migration ändern
* Kein `npx supabase db reset`
* Kein `npx supabase db push`
* Keine Remote-Datenbank
* Keine Secrets anzeigen
* `.env.local` nicht anzeigen
* Keine Packages installieren
* Keine Design-Neuerfindung
* Phase-A-Design, Dark Mode und Mobile nicht beschädigen

## Relevante Dokumente

* `CLAUDE.md`
* `docs/PROJECT_BRIEF.md`
* `docs/CURRENT_TASK.md`
* `docs/SUPABASE_STRATEGY.md`
* `docs/SECURITY.md`
* `docs/USER_FLOWS.md`
* `docs/DATABASE_MODEL.md`

## Migrationsübersicht

| Migration               | Inhalt                                                   | Status                              |
| ----------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`    | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`  | Self-Service Team Flow                                   | Abgeschlossen und lokal verifiziert |
| `003_mvp0b_club_flows`  | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`  | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Phase B.1 Routing- und Auth-Grundstruktur umsetzen.
