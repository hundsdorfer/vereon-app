# Architektur — Vereon

**Stand:** 2026-07-23
**Dokumenttyp:** code-verifizierte technische Ist-Dokumentation
**Geprüfter Stand:** `main` / `78cb449` (lokal committet, noch nicht auf
`origin/main` gepusht: `FC-ROLE-002`/`FC-ROLE-003`; `b9425ed` davor
committet, gepusht und deployed: `FC-RSVP-003`). Details:
`docs/CURRENT_TASK.md`.

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
- getrennte Spieler-/Guardian- und Trainer-RSVP-Übersichten für Trainerrollen.

Club-/Mehrteam-Verwaltung ist im Schema vorbereitet, besitzt aber keinen vollständigen App-Flow. Match und Anwesenheitsabschluss sind nicht implementiert. Rollenverwaltung ist für `assistant_coach` implementiert (`FC-ROLE-002`/`FC-ROLE-003`); darüber hinaus (`head_coach`-Vergabe, Eigentumsübertragung) nicht. Training bearbeiten, der bedingte Hard-Delete und Trainer-RSVP sind lokal umgesetzt; Prüfnachweise und bekannte Grenzen stehen in `docs/CURRENT_TASK.md`.

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

Supabase Auth verwaltet Nutzer und Sessions. `src/proxy.ts` behandelt `/`, `/login`, `/register`, `/auth/callback`, `/manifest.webmanifest`, `/join/*` und `/legal/*` als öffentlich. Andere Routen führen ohne Session zu `/login`. `/manifest.webmanifest` (erzeugt von `src/app/manifest.ts`) wurde lokal implementiert und getestet in die öffentliche Routenliste aufgenommen, damit Next.js' generierte Manifest-Route nicht fälschlich zu `/login` umgeleitet wird; der vorgelagerte interne Zugangsschutz bleibt davon unberührt und greift weiterhin zuerst.

Vor dieser bestehenden Logik prüft `src/proxy.ts` seit dieser Änderung
zusätzlich einen **temporären internen Zugangsschutz** (`src/lib/internal-access.ts`,
HTTP Basic Auth). Der Schutz ist nur aktiv, wenn die Server-Umgebungsvariable
`INTERNAL_ACCESS_ENABLED` exakt `"true"` ist; ohne diese Variable ist das
Verhalten unverändert. Aktiviert, aber unvollständig konfiguriert (Username/
Passwort fehlt), antwortet die Anwendung fail-closed mit `401` für jede
Anfrage. Der Ablauf ist `Besucher → interner Zugangsschutz → Supabase-Login
→ Anwendung`; Grund ist die auf dem aktuellen Vercel-Tarif fehlende
Deployment-Protection-Abdeckung für Custom-Production-Domains (siehe
`docs/DECISION_LOG.md` DEC-011). Der Schutz ist ausdrücklich temporär, kein
Ersatz für Supabase Auth oder RLS und wird vor einem externen Pilot entfernt
oder durch eine geeignete Plattformlösung ersetzt. Er ist auf Vercel
aktiviert und extern verifiziert; vollständiger Betriebs- und HTTP-Nachweis:
`docs/STATUS.md`. Nach erfolgreicher Prüfung der Basic-Auth-Zugangsdaten
wird der Authorization-Header vor Weitergabe an Server Components/Route
Handler aus den weitergereichten Request-Headern entfernt
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

`create_event()` erlaubt `team_owner`, `head_coach` und `assistant_coach` das Erstellen. `cancel_event()` ist über `cancelEventAction()` (`src/actions/events.ts`) und `CancelEventButton` (`src/features/events/CancelEventButton.tsx`) in der Oberfläche verdrahtet; die Berechtigung wird auf der Detailseite über eine von der bestehenden `isTrainer`-Anzeige getrennte Prüfung (`has_team_role()` mit `TRAINING_CANCEL_ROLES` aus `src/lib/permissions.ts`, ohne `team_manager`) ermittelt. Abgesagte Trainings bleiben in Trainingsliste, Team- und Dashboard-Übersicht sichtbar und sind mit einem `danger`-Badge „Abgesagt" gekennzeichnet.

Training bearbeiten (`update_training()` in `supabase/migrations/20260721094219_update_training.sql`, `updateTrainingAction()` in `src/actions/events.ts`, Route `src/app/(app)/teams/[teamId]/events/[eventId]/edit/page.tsx`, `EditEventForm`) ist lokal vollständig vorhanden, migriert und per Playwright verifiziert. Die RPC erlaubt ausschließlich `team_owner`, `head_coach` und `assistant_coach`, ausschließlich `event_type = 'training'`, ausschließlich solange weder das gespeicherte noch das neu eingereichte `starts_at` erreicht ist, und ausschließlich solange das Training nicht abgesagt ist; `team_id`, `club_id`, `season_id`, `created_by`, `event_type`, `is_cancelled` und `ends_at` sind nicht Teil der Funktionssignatur. Die Server Action verwendet für Redirect/Revalidation ausschließlich die von der RPC zurückgegebene `team_id`, nie einen Client-Wert. Der echte E2E-Rollennachweis besteht für `team_owner`-only; die bekannten Integrationslücken für `head_coach`-only und `assistant_coach`-only bleiben offen.

Der bedingte Hard-Delete (`delete_training()` in `supabase/migrations/20260721114453_delete_training.sql`, `deleteTrainingAction()` und `DeleteTrainingForm`) ist für Spieler-RSVP lokal migriert und im vollständigen Playwright-Lauf verifiziert. Die additive Migration `20260722090000_add_staff_rsvp.sql` erweitert dieselbe RPC um eine atomare Trainer-RSVP-Sperre. Sie sperrt das Event und beide RSVP-Tabellen, prüft `team_owner`/`head_coach`, exaktes `LÖSCHEN`, zukünftigen Beginn, nicht abgesagten Zustand und das Fehlen abgegebener Spieler- sowie Trainer-RSVP. Nicht beantwortete Spieler-Teilnahmezeilen werden über den bestehenden FK-Cascade zusammen mit dem Event entfernt. Die Erweiterung ist lokal migriert und im vollständigen Playwright-Lauf verifiziert (Details: `docs/CURRENT_TASK.md`).

Beim Erstellen eines Termins erzeugt ein Trigger `event_attendance`-Zeilen für aktive Spieler. Self-Player oder verifizierte Guardians setzen RSVP über `respond_to_event()`. Entfernte Spieler werden durch `is_active_player_assignment()` blockiert. Eine RSVP-Deadline am Terminbeginn wird derzeit nicht geprüft.

Trainer-RSVP ist über die getrennte Tabelle `event_staff_rsvps`,
`respond_to_event_as_staff()`, `list_staff_rsvps_for_event()` und eine eigene
Card auf der Event-Detailseite umgesetzt. Die Schreib-RPC sperrt das Event per
`FOR UPDATE`, prüft aktive `team_owner`-/`head_coach`-/`assistant_coach`-Rollen,
Absagestatus und `starts_at` und schreibt ausschließlich die eigene Antwort per
UPSERT. Die Listen-RPC liefert aktive Trainer auch ohne Antwort sowie
historische Antworten nicht mehr aktiver Trainer mit `is_active_trainer = false`.
`event_attendance` bleibt ausschließlich spielerbezogen.

`delete_training()` sperrt und prüft zusätzlich `event_staff_rsvps`; jede
Trainer-RSVP blockiert den Hard-Delete atomar. Die Event-Detailseite fragt die
Existenz zusätzlich fail-closed ab und blendet das Löschformular nach einer
Trainer-RSVP aus.

### Spieler entfernen

`remove_player_from_team()` setzt die Zuordnung auf `status = 'left'` und `left_at = now()`. Spielerprofil und historische RSVP-Zeilen bleiben erhalten. Nur `team_owner` und `head_coach` dürfen die RPC ausführen.

## 8. Datenbank und Sicherheit

Das Repository enthält 17 Migrationen. Die neueste additive Migration
`20260723100000_add_role_management.sql` erzeugt die 20. öffentliche Tabelle
(`team_role_audit_log`) sowie `grant_assistant_coach()`,
`revoke_assistant_coach()` und `list_assistant_coaches()`; lokal angewendet
und verifiziert (Details: `docs/CURRENT_TASK.md`).

- Rollen/Organisation: `roles`, `permissions`, `role_permissions`, `profiles`, `clubs`, `seasons`,
- Mitgliedschaften: `club_memberships`, `club_member_roles`, `teams`, `team_memberships`, `team_member_roles`,
- Spieler/Join: `players`, `player_guardians`, `team_invitation_links`, `team_join_requests`, `player_team_assignments`,
- Termine: `events`, `event_attendance`, `event_staff_rsvps`,
- Audit: `team_role_audit_log`.

RLS ist für alle öffentlichen Tabellen aktiviert. Kritische RPCs verwenden `SECURITY DEFINER` und `SET search_path = ''`. `src/types/database.types.ts` ist nur ein `Json`-Stub; generierte Schematypen fehlen.

## 9. Umgebungen und Deployment

| Umgebung | App | Datenbank | Verifizierter Stand |
|---|---|---|---|
| lokal | `npm run dev` | lokaler Supabase-Docker-Stack | `.env.local` verweist auf `127.0.0.1:54321`; Kerncontainer laufen, `supabase_vector_vereon-app` startet wiederholt neu |
| gehostete interne Entwicklung | Vercel, `www.vereon.app` | Supabase Cloud | Nutzerangabe und öffentlich sichtbare Vercel-Antworten; Cloud-Konfiguration nicht aus dem Repo auslesbar; temporärer interner Zugangsschutz aktiviert, Betriebsnachweis: `docs/STATUS.md` |

`main` wird laut Nutzerangabe automatisch über Vercel bereitgestellt. Laut
öffentlich sichtbarer Vercel-Antwort leitet `vereon.app` permanent auf
`www.vereon.app` um. Die gehostete Instanz ist noch keine freigegebene
Produktion: Legal-Texte, E-Mail, Backup/Restore und Monitoring sind vor
einem Pilotbetrieb zu klären. Der temporäre interne Zugangsschutz begrenzt
den Zugriff bereits, ist aber kein Ersatz für die noch offenen Punkte und
bleibt selbst vor Pilot zu entfernen oder zu ersetzen.

Remote-Migrationen wurden bisher durch Claude Code ausgeführt. Künftig ist dafür immer eine separate ausdrückliche Freigabe erforderlich.

## 10. Qualitätssicherung

- `npm run lint` führt ESLint aus.
- `npm run build` erstellt den Next.js-Produktionsbuild und beinhaltet den TypeScript-Check.
- Ein separates `typecheck`- oder Unit-Test-Script existiert nicht.
- Playwright enthält 15 Spec-Dateien unter `tests/e2e/`, darunter reine
  Vertrags- und Hilfstests ohne Browser-Fixture (`datetime.spec.ts`,
  `trainingCancelRoleContract.spec.ts`, `trainingDeleteRoleContract.spec.ts`,
  `trainingEditRoleContract.spec.ts`, `trainingStaffRsvpRoleContract.spec.ts`
  und `helpers/supabaseTestGuard.spec.ts`).
- `.github/workflows/ci.yml` führt bei Push/PR auf `main` Lint und Build aus.
- `.github/workflows/e2e.yml` läuft nur manuell über `workflow_dispatch`.

## 11. Quellen- und Pflegeordnung

Bei Abweichungen gilt:

1. Code, Konfiguration und Migrationen bestimmen den technischen Ist-Zustand.
2. `docs/STATUS.md` dokumentiert belegte Abweichungen und Risiken.
3. `docs/DATABASE_MODEL.md` beschreibt das fachliche Zielmodell mit Statusmarkierungen.
4. Produktentscheidungen werden in den fachlichen Dokumenten gepflegt.
5. Unverifizierte Betriebsangaben werden ausdrücklich als solche gekennzeichnet.
