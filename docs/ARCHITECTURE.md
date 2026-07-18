# Architektur — Vereon

**Stand:** 2026-07-18
**Dokumenttyp:** code-verifizierte technische Ist-Dokumentation
**Geprüfter Stand:** `main` / `bf2158c`, einschließlich lokaler Dokumentationsänderungen

Dieses Dokument beschreibt ausschließlich den im Repository belegbaren Ist-Zustand. Fachliche Zielentscheidungen stehen in `docs/FEATURE_CATALOG.md`, `docs/ROLES_AND_PERMISSIONS.md` und `docs/DATABASE_MODEL.md`. Abweichungen zwischen Ist und Ziel werden in `docs/STATUS.md` geführt.

## 1. Zweck und Systemgrenze

Vereon ist eine deutschsprachige Webanwendung für die Organisation einzelner Fußballteams. Der implementierte Kern umfasst:

- Registrierung, Login und Logout,
- Erstellen eines eigenständigen Teams,
- Einladungscode und Beitrittsanfragen für Self-Player und Guardian/Kind,
- Annahme oder Ablehnung von Beitrittsanfragen,
- Anzeige und Soft-Entfernung von Spielern,
- Erstellen und Anzeigen von Trainings,
- Spieler- und Guardian-RSVP,
- RSVP-Übersicht für Trainerrollen.

Club-/Mehrteam-Verwaltung ist im Schema vorbereitet, besitzt aber keinen vollständigen App-Flow. Match, Trainer-RSVP, Anwesenheitsabschluss, Rollenverwaltung, Training bearbeiten und Training hart löschen sind nicht implementiert.

## 2. Laufzeitarchitektur

```text
Browser
  │
  ├─ Next.js App Router
  │    ├─ Server Components
  │    ├─ Client Components für Formzustand/Interaktion
  │    ├─ Server Actions für Mutationen
  │    └─ src/proxy.ts für Session-Aktualisierung und Routenschutz
  │
  └─ Supabase
       ├─ Auth
       ├─ PostgreSQL
       ├─ PostgREST / supabase-js
       ├─ Row Level Security
       └─ SECURITY-DEFINER-RPCs für kritische Mutationen
```

Die Anwendung verwendet keinen eigenen klassischen API-Layer. Server Components lesen über den Supabase-Server-Client; Server Actions rufen überwiegend RPCs auf. Kritische Autorisierung liegt in den Datenbankfunktionen und RLS-Policies, nicht nur in der Oberfläche.

## 3. Einstiegspunkte und Verzeichnisse

| Pfad | Aufgabe |
|---|---|
| `src/app/layout.tsx` | Root-Layout und globale Metadaten |
| `src/app/page.tsx` | öffentliche Startseite |
| `src/app/(auth)/*` | Login und Registrierung |
| `src/app/(app)/*` | geschützter App-Bereich |
| `src/app/join/[code]/page.tsx` | öffentlicher Einladungseinstieg |
| `src/actions/*` | Server Actions für Auth, Teams, Join, Events und Spieler |
| `src/features/*` | fachliche Formular- und UI-Komponenten |
| `src/components/*` | wiederverwendbare Layout- und UI-Bausteine |
| `src/lib/supabase/*` | Browser-, Server-, Proxy- und Route-Handler-Clients |
| `src/proxy.ts` | Session-Refresh und Login-Redirects |
| `supabase/migrations/*` | versionierte, additive Datenbankentwicklung |
| `supabase/seed.sql` | lokale Seed-Daten |
| `tests/e2e/*` | Playwright-End-to-End-Tests |
| `.github/workflows/*` | CI und manuell gestartete E2E-Pipeline |

## 4. Rendering und Datenzugriff

- Seiten sind standardmäßig Server Components.
- Interaktive Formulare verwenden Client Components und `useActionState`.
- Mutationen laufen über Server Actions in `src/actions/`.
- Der Browser-Client in `src/lib/supabase/client.ts` ist vorhanden, im aktuellen Kern aber nicht die primäre Mutationsschicht.
- `src/lib/supabase/server.ts` liest und aktualisiert Auth-Cookies serverseitig.
- `src/lib/supabase/middleware.ts` validiert die Session mit `auth.getUser()`.
- `src/lib/supabase/route-handler.ts` stellt einen separaten Client für Route Handlers bereit; derzeit gibt es außer dem Auth-Callback keinen eigenen fachlichen Route-Handler.
- Seiten mit nutzerabhängigen Daten sind überwiegend `force-dynamic`.

## 5. Authentifizierung und Routing

Supabase Auth verwaltet Nutzer und Sessions. `src/proxy.ts` behandelt `/`, `/login`, `/register`, `/auth/callback`, `/join/*` und `/legal/*` als öffentlich. Andere Routen führen ohne Session zu `/login`.

Vor dieser bestehenden Logik prüft `src/proxy.ts` seit dieser Änderung
zusätzlich einen **temporären internen Zugangsschutz** (`src/lib/internal-access.ts`,
HTTP Basic Auth). Der Schutz ist nur aktiv, wenn die Server-Umgebungsvariable
`INTERNAL_ACCESS_ENABLED` exakt `"true"` ist; ohne diese Variable ist das
Verhalten unverändert. Aktiviert, aber unvollständig konfiguriert (Username/
Passwort fehlt), antwortet die Anwendung fail-closed mit `401` für jede
Anfrage. Der Ablauf ist `Besucher → interner Zugangsschutz → Supabase-Login
→ Anwendung`; Grund ist die auf dem aktuellen Vercel-Tarif fehlende
Deployment-Protection-Abdeckung für Custom-Production-Domains (siehe
`docs/DECISION_LOG.md` DEC-011). Der Schutz ist ausdrücklich temporär und
lokal implementiert; ein Deployment und externe Prüfung stehen aus (siehe
`docs/CURRENT_TASK.md`). Nach erfolgreicher interner Prüfung wird der
Authorization-Header vor Weitergabe an Server Components/Route Handler aus
den weitergereichten Request-Headern entfernt
(`NextResponse.next({ request: { headers } })`). `src/lib/supabase/middleware.ts`
`updateSession()` erhält dafür ein `stripAuthorization`-Flag statt einer vorab
erzeugten Header-Kopie und baut die weiterzureichenden Header bei jedem
`NextResponse.next()`-Aufruf frisch aus dem dann aktuellen `request.headers` —
notwendig, weil Supabase in `setAll()` `request.cookies` in-place mutiert und
eine vorab eingefrorene Header-Kopie einen aktualisierten Session-Cookie sonst
verdeckt hätte (per Regressionstest in `tests/e2e/internal-access.spec.ts`
nachgewiesen). Seit `@supabase/ssr` `0.10.0` liefert `setAll()` zusätzlich
Cache-Schutz-Header für Antworten mit aktualisierten Auth-Cookies. Die
Anwendung übernimmt diese gelieferten Werte unverändert auf die Response.
Ersetzt `src/proxy.ts` die Session-Response durch einen Login- oder
Dashboard-Redirect, werden ausschließlich die aktualisierten Session-Cookies
und diese Cache-Schutz-Header auf den Redirect übertragen; interne
`x-middleware-*`-Weiterleitungsheader werden nicht kopiert.

Der bestehende Matcher in `src/proxy.ts` schließt weiterhin
`_next/static`, `_next/image`, `favicon.ico` sowie einzelne Bilddateiendungen
aus. Diese bleiben — wie schon vor dieser Änderung — auch unter aktiviertem
internem Zugangsschutz direkt abrufbare, reine statische Dateien ohne HTML,
Anwendungsdaten oder ausführbare Routen; insbesondere JavaScript-Bundles
unter `_next/static` sind dadurch nicht vertraulich. Der interne
Zugangsschutz verhindert die Nutzung der Anwendung (HTML, RSC-/Daten-
anfragen, Route Handler, Server Actions), ist aber keine vollständige
Vertraulichkeit sämtlicher Deployment-Artefakte.

Belegte Einschränkungen:

- Der Proxy prüft nur, ob eine gültige Session existiert; eine produktweit erzwungene E-Mail-Verifizierung ist nicht implementiert.
- Die lokale Supabase-Konfiguration hat `enable_confirmations = false`.
- Registrierung verlangt aktuell ein vollständiges Geburtsdatum und speichert Annahmezeitpunkte für AGB und Datenschutz, aber keine Dokumentversionen.
- Passwort-Reset ist nicht implementiert.
- `src/app/manifest.ts` erzeugt `/manifest.webmanifest`, doch der Pfad ist im Proxy weder öffentlich noch vom Matcher ausgenommen. Unangemeldete Abrufe werden daher zum Login umgeleitet.

## 6. Autorisierung

Die technische Autorisierung besteht aus drei Schichten:

1. rollenabhängige UI-Anzeige,
2. Server Actions und RPCs,
3. RLS und Datenbank-Helper wie `has_team_role()`.

Die Rollen werden über `roles`, `team_memberships` und `team_member_roles` modelliert. Mehrfachrollen sind möglich. Die Team-Erstellung vergibt atomar `team_owner` und standardmäßig `head_coach`.

Der Ist-Code führt die fachlich nicht mehr aktive Rolle `team_manager` weiterhin in mehreren Lese- und Trainerprüfungen. Das ist technische Altlast und keine Zielrolle.

## 7. Implementierte fachliche Datenflüsse

### Team und Einladung

`createTeamAction()` ruft `create_independent_team()` auf. Die RPC erstellt Team, Mitgliedschaft, Rollen und einen `public_code` im Format `VRN-XXXX-XXXX-XXXX`.

Das Schema enthält parallel:

- `public_code` als aktuellen nutzerseitigen Einladungscode,
- `token_hash` als älteren technischen Linkpfad,
- `max_uses`, `use_count`, `expires_at` und `revoked_at`.

Die App zeigt nur den aktiven `public_code`. Erneuern oder Deaktivieren ist nicht als App-Flow umgesetzt.

### Beitritt

`submit_join_request_self()` legt einen Spieler mit Bezug zum angemeldeten Nutzer an. `submit_join_request_guardian()` legt ein Spielerprofil ohne Login, eine Guardian-Beziehung und eine Join-Anfrage an. Der aktuelle Join-Flow verlangt für Spieler ein Geburtsjahr; `players.date_of_birth` bleibt als nullable Bestandsspalte vorhanden, wird aber nicht befüllt.

Der Self-Player-Flow wird derzeit nicht serverseitig auf Volljährigkeit begrenzt.

`approve_join_request()` erzeugt eine aktive `player_team_assignments`-Zuordnung und RSVP-Zeilen für zukünftige Termine. `reject_join_request()` entfernt verwaiste Spielerdaten. Die 90-Tage-Bereinigung existiert als Funktion, wird aber nicht automatisch geplant ausgeführt.

### Trainings und RSVP

`create_event()` erlaubt `team_owner`, `head_coach` und `assistant_coach` das Erstellen. `cancel_event()` existiert in der Datenbank, ist aber nicht in der Oberfläche verdrahtet. Eine Bearbeiten- oder Hard-Delete-Funktion existiert nicht.

Beim Erstellen eines Termins erzeugt ein Trigger `event_attendance`-Zeilen für aktive Spieler. Self-Player oder verifizierte Guardians setzen RSVP über `respond_to_event()`. Entfernte Spieler werden durch `is_active_player_assignment()` blockiert. Eine RSVP-Deadline am Terminbeginn wird derzeit nicht geprüft.

Trainer-RSVP ist nicht implementiert; `event_attendance` ist ausschließlich spielerbezogen.

### Spieler entfernen

`remove_player_from_team()` setzt die Zuordnung auf `status = 'left'` und `left_at = now()`. Spielerprofil und historische RSVP-Zeilen bleiben erhalten. Nur `team_owner` und `head_coach` dürfen die RPC ausführen.

## 8. Datenbank und Sicherheit

Das Repository enthält 13 Migrationen. Sie erzeugen 18 öffentliche Tabellen:

- Rollen/Organisation: `roles`, `permissions`, `role_permissions`, `profiles`, `clubs`, `seasons`,
- Mitgliedschaften: `club_memberships`, `club_member_roles`, `teams`, `team_memberships`, `team_member_roles`,
- Spieler/Join: `players`, `player_guardians`, `team_invitation_links`, `team_join_requests`, `player_team_assignments`,
- Termine: `events`, `event_attendance`.

RLS ist für alle öffentlichen Tabellen aktiviert. Kritische RPCs verwenden `SECURITY DEFINER` und `SET search_path = ''`. `src/types/database.types.ts` ist nur ein `Json`-Stub; generierte Schematypen fehlen.

## 9. Umgebungen und Deployment

| Umgebung | App | Datenbank | Verifizierter Stand |
|---|---|---|---|
| lokal | `npm run dev` | lokaler Supabase-Docker-Stack | `.env.local` verweist auf `127.0.0.1:54321`; Kerncontainer laufen, `supabase_vector_vereon-app` startet wiederholt neu |
| gehostete interne Entwicklung | Vercel, `www.vereon.app` | Supabase Cloud | Nutzerangabe und öffentlich sichtbare Vercel-Antworten; Cloud-Konfiguration nicht aus dem Repo auslesbar |

`main` wird laut Nutzerangabe automatisch über Vercel bereitgestellt. Laut
öffentlich sichtbarer Vercel-Antwort leitet `vereon.app` permanent auf
`www.vereon.app` um. Die gehostete Instanz ist noch keine freigegebene
Produktion: Deployment-Schutz, Legal-Texte, E-Mail, Backup/Restore und Monitoring
sind vor einem Pilotbetrieb zu klären.

Remote-Migrationen wurden bisher durch Claude Code ausgeführt. Künftig ist dafür immer eine separate ausdrückliche Freigabe erforderlich.

## 10. Qualitätssicherung

- `npm run lint` führt ESLint aus.
- `npm run build` erstellt den Next.js-Produktionsbuild und beinhaltet den TypeScript-Check.
- Ein separates `typecheck`- oder Unit-Test-Script existiert nicht.
- Playwright enthält drei E2E-Specs.
- `.github/workflows/ci.yml` führt bei Push/PR auf `main` Lint und Build aus.
- `.github/workflows/e2e.yml` läuft nur manuell über `workflow_dispatch`.

## 11. Quellen- und Pflegeordnung

Bei Abweichungen gilt:

1. Code, Konfiguration und Migrationen bestimmen den technischen Ist-Zustand.
2. `docs/STATUS.md` dokumentiert belegte Abweichungen und Risiken.
3. `docs/DATABASE_MODEL.md` beschreibt das fachliche Zielmodell mit Statusmarkierungen.
4. Produktentscheidungen werden in den fachlichen Dokumenten gepflegt.
5. Unverifizierte Betriebsangaben werden ausdrücklich als solche gekennzeichnet.
