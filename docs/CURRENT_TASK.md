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
* Phase A UI-Fundament ist abgeschlossen und committed:
  * responsive AppShell mit Mobile Topbar und Bottom Navigation
  * Light/Dark Theme über `data-theme`-Attribut, localStorage-Key `vereon-theme`
  * ThemeToggle funktioniert auf PC und echtem Smartphone
  * Bottom Navigation, Safe Area und Touch Targets korrekt
  * `allowedDevOrigins` in `next.config.ts` gesetzt — Handy-Hydration lokal funktioniert
  * Debug-Reste entfernt
  * UI-Basiskomponenten (Button, Input, Label, Card, Badge, EmptyState, FormError, PageHeader)
* Phase B.1 Routing- und Auth-Grundstruktur ist abgeschlossen und committed:
  * Route-Gruppen `(auth)` und `(app)`
  * Login-Seite, Register-Seite, Auth-Layout (kein AppShell)
  * App-Layout mit AppShell, `/dashboard` Platzhalter
  * `/auth/callback/route.ts` — PKCE Code Exchange
  * `src/actions/auth.ts` — signIn/signUp/signOut Server Actions
  * LoginForm und RegisterForm als Client Components (`useActionState`)
  * Root `/` Redirect: eingeloggt → `/dashboard`, nicht eingeloggt → `/login`
  * Phase-A-Preview nach `/dev/ui-preview` verschoben
  * `proxy.ts` Route-Schutz aktiv (Open-Redirect-Schutz eingebaut)
  * Login/Register/Logout/Redirects lokal getestet

## Aktuelle Hauptaufgabe

Phase B.2 umsetzen: Auth/AppShell UX Cleanup.

Ziel: Die eingeloggte App-Grundstruktur soll sauber bedienbar sein, bevor Phase C echte Teamfunktionen baut.

## Scope Phase B.2

Zu bauen:

* User-E-Mail oder Accountbereich in AppShell anzeigen
* Logout fest in AppShell integrieren (nicht nur als Button auf /dashboard)
* Aktive Navigation markieren (aktuell aktiver Link hervorheben)
* Keine AppShell-Hauptnavigation darf auf 404 führen
* `/teams` als geschützte Platzhalterseite anlegen, falls nötig

Zu prüfen / sicherstellen:

* `/dev/ui-preview` öffentlich belassen, aber nicht in der Hauptnavigation sichtbar
* Route-Schutz nochmals verifizieren:
  * `/dashboard` geschützt ✓
  * `/teams` geschützt
  * `/login` und `/register` für eingeloggte User → `/dashboard` ✓
  * `/join/*` bleibt öffentlich ✓

Noch nicht bauen:

* Kein Team-erstellen-Flow
* Kein `create_independent_team()` in der UI
* Kein Einladungslink-Flow
* Kein Join Request Flow
* Kein echtes Team-Dashboard
* Keine neue Migration

## Erlaubt

* Phase B.2 planen
* Phase B.2 App-Dateien umsetzen
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
* Keine Team-RPCs verwenden

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

Phase B.2 Auth/AppShell UX Cleanup umsetzen.
