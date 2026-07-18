# Status — technisches Audit

**Stand:** 2026-07-18
**Geprüfter Stand:** `main` / `bf2158c`, einschließlich lokaler Dokumentationsänderungen

Dieses Dokument ist die verbindliche lebende Übersicht für belegte technische Abweichungen, Risiken und Übergabepunkte. Technischer Ist-Zustand: `docs/ARCHITECTURE.md`. Fachliches Ziel: `docs/FEATURE_CATALOG.md`, `docs/ROLES_AND_PERMISSIONS.md` und `docs/DATABASE_MODEL.md`.

## 1. Kurzurteil

Der Einzelteam-Kernflow ist im Repository implementiert: Auth, Team-Erstellung, Einladung, Self-/Guardian-Join, Join-Entscheidung, Spieler-Soft-Remove, Trainingsanlage und Spieler-/Guardian-RSVP.

Die App ist intern gehostet, aber nicht pilotbereit. Die größten Lücken betreffen Deployment-Schutz, Legal-/Consent-Themen, E-Mail-Verifizierung, automatisierte Datenbereinigung, Backup/Restore sowie mehrere beschlossene MVP-0B-Funktionen.

## 2. Verifiziert funktionsfähig

| Bereich | Beleg |
|---|---|
| Registrierung, Login, Logout und Callback | `src/actions/auth.ts`, `src/app/auth/callback/route.ts` |
| Session-Refresh und Routenschutz | `src/proxy.ts`, `src/lib/supabase/middleware.ts` |
| Eigenständiges Team mit Owner, Head Coach und Code | `src/actions/team.ts`, `create_independent_team()` in `20260627100000_add_team_public_code.sql` |
| Self-Player- und Guardian-Join | `src/actions/join.ts`, Migration `20260702000000_players_birth_year_only.sql` |
| Annehmen/Ablehnen von Anfragen | `src/actions/joinRequests.ts`, `approve_join_request()`, `reject_join_request()` |
| Spieler per Soft-Delete entfernen | `src/actions/players.ts`, Migration `20260704120000_remove_player_from_team.sql` |
| Trainings erstellen und anzeigen | `src/actions/events.ts`, `src/app/(app)/teams/[teamId]/events/*` |
| Spieler-/Guardian-RSVP und Trainerübersicht | `respond_to_event()`, `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx` |
| RLS auf allen 18 öffentlichen Tabellen | `supabase/migrations/*` |
| CI für Lint und Build | `.github/workflows/ci.yml` |

## 3. Prüfstand

Am 2026-07-18 wurden ohne Codeänderung erfolgreich ausgeführt:

- `npm run lint`,
- `npx tsc --noEmit`,
- `npm run build` mit Next.js `16.2.9`.

E2E wurde in diesem Audit nicht ausgeführt. Der Workflow `.github/workflows/e2e.yml` ist nur manuell startbar.

Lokale Supabase-Prüfung:

- `.env.local` verweist auf die lokale API `127.0.0.1:54321`,
- Datenbank, Auth, REST, Realtime, Storage, Studio und weitere Kerncontainer liefen,
- `supabase_vector_vereon-app` startete wiederholt neu.

Die Vector-Störung ist ein lokales Betriebsrisiko; ein Fehler des fachlichen Kernflows ist daraus nicht belegt.

## 4. Priorität 0 — vor externem Pilotbetrieb

| Abweichung/Risiko | Beleg oder Verifikationsstand | Erforderliches Ergebnis |
|---|---|---|
| Deployment noch öffentlich erreichbar | `www.vereon.app` antwortet; Nutzer möchte bis zum Pilot vollständigen Schutz | Vercel-Deployment-Schutz aktivieren und prüfen |
| Legal-Seiten enthalten Platzhalter | `src/app/legal/{imprint,privacy,terms}/page.tsx` | rechtlich geprüfte Texte und Betreiberangaben |
| E-Mail-Verifizierung nicht als Aktionsvoraussetzung erzwungen | `supabase/config.toml`: lokal aus; kein zentraler App-/RPC-Check | Team, Join und RSVP nur für verifizierte E-Mail |
| Produktionsfähiger E-Mail-Versand fehlt | Nutzerangabe: nur Supabase-Test-/Standardversand | SMTP/Provider, Zustellung und Absender verifizieren |
| Guardian-Erklärung nicht versioniert | Join-Flow setzt nur `player_guardians.verified_at` | Erklärungstext, Version, Nutzer und Zeitpunkt speichern |
| AGB/Datenschutz ohne Dokumentversion | `profiles` speichert nur Annahmezeitpunkte | Version und Zeitpunkt je Dokument speichern |
| Self-Player-Join erzwingt keine Altersgrenze | `submit_join_request_self()` prüft keine Volljährigkeit | rechtlich maßgebliche Grenze festlegen und serverseitig durchsetzen |
| Join-Request-Cleanup nicht automatisiert | `cleanup_expired_join_requests()` existiert ohne Scheduler | 90-Tage-Job einrichten und beobachten |
| Backup/Restore der Cloud nicht verifiziert | nicht im Repo belegt, Nutzer unbekannt | Verfahren dokumentieren und Rücksetzung testen |
| Supabase-Region/AV und Vercel-AV nicht verifiziert | nicht aus Repo ableitbar; `docs/LEGAL_TODO.md` | vor Pilot organisatorisch bestätigen |
| Monitoring/Alerting nicht verifiziert | keine dedizierte Konfiguration im Repo | Mindestkonzept, Zuständigkeit und Alarmweg festlegen |
| Manifest ist unangemeldet nicht erreichbar | `src/app/manifest.ts` plus fehlende Ausnahme in `src/proxy.ts` | `/manifest.webmanifest` öffentlich ausliefern |

„Nicht verifiziert“ bedeutet ausdrücklich nicht „nicht vorhanden“.

## 5. Priorität 1 — beschlossene MVP-0B-Kernlücken

| Ziel | Ist-Zustand |
|---|---|
| Training bearbeiten | keine Action, RPC oder UI |
| Training absagen | `cancel_event()` existiert, aber keine App-Verdrahtung |
| Training bedingt hart löschen | keine RPC/UI; Regeln in `docs/DATABASE_MODEL.md` |
| RSVP nur bis Terminbeginn | `respond_to_event()` prüft keine `starts_at`-Deadline |
| Trainer-RSVP | keine `event_staff_rsvps`-Tabelle und kein Flow |
| Einladungscode erneuern/deaktivieren | ältere Revoke-RPC vorhanden, aber kein vollständiger `public_code`-Flow |
| Einladungscode-Rechte für Assistant Coach | aktuelle Policies/RPCs sind nicht konsistent mit dem beschlossenen Ziel |
| Beitrittsanfragen für Assistant Coach sichtbar | Ziel erlaubt Einsicht, aktuelle `team_join_requests`-RLS nur `team_owner`/`head_coach` |
| Rollenverwaltung durch Team Owner | kein App-Flow; DB-Strukturen allein genügen nicht |
| genau ein Owner und bestätigte Übertragung | keine Eindeutigkeitsregel oder Transfer-RPC |
| Team archivieren | Statusfeld vorhanden, kein App-Flow |
| verpflichtendes Geburtsjahr, optionales volles Datum | aktuelles Profil verlangt volles Datum; Spieler-Spalte `birth_year` ist nullable |
| Freiwilliges volles Spielergeburtsdatum | optionale Erfassung, Zweckbestätigung, Korrekturfluss und Beschränkung der Teamhistorie auf das Geburtsjahr fehlen beziehungsweise sind nicht vollständig verifiziert |
| Kontaktperson ohne Login | kein Ziel-Datensatz implementiert |
| zukünftige RSVP entfernter Spieler aus Zählungen entfernen | neue RSVP blockiert; bestehende zukünftige Zeilen werden nicht bereinigt |

## 6. Priorität 2 — technische Schulden

| Punkt | Beleg |
|---|---|
| `team_manager` lebt technisch weiter, obwohl fachlich entfernt | Rollenseed und Prüfungen in Team-/Event-Seiten und RLS |
| Supabase-Typen fehlen | `src/types/database.types.ts` enthält nur `Json` |
| keine Unit-/Integrationstests | kein `test`-Script, keine Tests unter `src/` |
| E2E kein automatisches Merge-Gate | `.github/workflows/e2e.yml`: nur `workflow_dispatch` |
| Trainer-Erkennung dupliziert | unabhängige Rollenlisten in Dashboard, Teams und Detailseiten |
| `ThemeDebug` ist noch enthalten | `src/components/layout/ThemeProvider.tsx` |
| kein dediziertes `typecheck`-Script | `package.json`; manueller Befehl funktioniert |
| Node-Version nicht projektweit fixiert | kein `engines`, keine `.nvmrc`; CI nutzt Node 20 |

## 7. Datenbank- und Betriebsgrenzen

- Das Repository enthält 13 additive Migrationen.
- Der Remote-Migrationsstand wurde in diesem Audit nicht abgefragt.
- Laut Nutzer wurden Cloud-Migrationen bisher durch Claude Code angewendet.
- Jede künftige Remote-Migration braucht eine separate ausdrückliche Freigabe.
- Es wurde kein `db push`, `db reset` oder Remote-Zugriff ausgeführt.
- Die gehostete Instanz verwendet laut Nutzer Supabase Cloud; lokale Entwicklung verwendet den Docker-Stack.

## 8. Übergaberisiken im Arbeitsbaum

- `docs/ARCHITECTURE.md` und `docs/DATABASE_MODEL.md` hatten vor diesem Audit umfangreiche uncommittete Arbeitsfassungen; sie wurden innerhalb des Dokumentationsauftrags konsolidiert.
- `.claude/settings.local.json` existiert lokal und ist nicht versioniert. Im
  aktuellen Prüflauf konnte Git die konfigurierte globale Ignore-Datei nicht
  lesen und zeigte die Datei deshalb als unversioniert an. Sie darf nicht in den
  Dokumentationscommit aufgenommen werden; Ignore-Status und Commit-Scope sind
  vor dem Staging nochmals zu prüfen.
- Kein `git add .` oder `git add -A`; Commit-Scope gezielt prüfen.
- Vor Commit mindestens `git diff --check`, Querverweise und die Liste geänderter Dateien prüfen.

## 9. Nicht verifiziert

- Laufzeitverhalten der Supabase-Cloud-Datenbank,
- aktiver Vercel-Deployment-Schutz,
- Cloud-Auth-, Redirect- und SMTP-Konfiguration,
- Backup-/Restore-Funktion,
- Supabase-Datenregion und AV-Verträge,
- dediziertes Monitoring,
- Barrierefreiheit,
- mobile PWA-Installierbarkeit nach Manifest-Fix,
- tatsächlicher Remote-Migrationsgleichstand.
