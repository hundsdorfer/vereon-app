# Supabase-Strategie — Vereon

**Stand:** 2026-07-18

Dieses Dokument beschreibt den verifizierten Einsatz von Supabase und die Regeln für weitere Arbeiten. Details des Schemas stehen in `docs/DATABASE_MODEL.md`, Sicherheitsrisiken in `docs/SECURITY.md`.

## 1. Aufgaben von Supabase

Supabase stellt bereit:

- E-Mail-/Passwort-Authentifizierung,
- PostgreSQL als Datenbank,
- PostgREST und RPC-Aufrufe über `supabase-js`,
- Row Level Security,
- lokale Entwicklungsdienste über die Supabase CLI und Docker.

Realtime und Storage laufen lokal mit, werden vom aktuellen App-Kern aber nicht fachlich genutzt.

## 2. Verwendete Pakete

| Paket | deklarierte Version | installiert | Zweck |
|---|---:|---:|---|
| `@supabase/supabase-js` | `^2.108.2` | `2.108.2` | Query Builder, Auth und RPC |
| `@supabase/ssr` | `^0.12.0` | `0.12.0` | Cookie-basierte Browser-/Server-Clients |
| `supabase` | `^2.108.0` | `2.108.0` | lokale Services, Migrationen und Typgenerierung |

Quelle: `package.json`, `package-lock.json` und lokales `npm ls --depth=0`.

## 3. Client-Kontexte

| Datei | Kontext | Besonderheit |
|---|---|---|
| `src/lib/supabase/server.ts` | Server Components und Server Actions | asynchroner Cookie-Zugriff; `server-only` |
| `src/lib/supabase/client.ts` | Client Components | `createBrowserClient()` |
| `src/lib/supabase/middleware.ts` | `src/proxy.ts` | validiert Nutzer mit `auth.getUser()` und aktualisiert Cookies |
| `src/lib/supabase/route-handler.ts` | Route Handlers | schreibt aktualisierte Cookies in die Response; `server-only` |

Server Components sind der Standard. Ein Browser-Client wird nur benötigt, wenn echter Browserzustand, Events oder Browser-APIs beteiligt sind.

## 4. Auth-Strategie

- Supabase Auth verwaltet Nutzer und Sessions.
- `src/proxy.ts` schützt App-Routen und bewahrt den ursprünglichen Zielpfad im `redirect`-Parameter.
- Die Auth-Callback-Route tauscht den Code serverseitig gegen eine Session.
- Registrierung speichert Profildaten in Auth-Metadaten; `handle_new_user()` erzeugt `profiles`.
- Autorisierung für Fachdaten erfolgt nicht über die Auth-Rolle allein, sondern über RLS, Mitgliedschaften und RPCs.

Aktuelle Lücke: E-Mail-Verifizierung wird lokal nicht verlangt und im App-Code nicht als Voraussetzung produktiver Aktionen geprüft. Das fachliche Ziel steht in `docs/DATABASE_MODEL.md`.

## 5. RLS- und RPC-Regeln

1. Jede öffentliche Fachtabelle hat RLS.
2. Ohne explizite Policy gilt deny by default.
3. UI-Sichtbarkeit ist kein Sicherheitsmechanismus.
4. Kritische Mehrschritt-Mutationen laufen atomar über RPCs.
5. `SECURITY DEFINER` wird nur gezielt verwendet.
6. Jede `SECURITY DEFINER`-Funktion setzt `SET search_path = ''`.
7. Tabellen und Funktionen werden in SQL vollständig mit Schema qualifiziert.
8. Nutzer- und Rollenbezüge werden aus `auth.uid()` beziehungsweise serverseitig ermittelten Daten abgeleitet, nicht aus vertrauenswürdig angenommenen Formularwerten.
9. Neue Tabellen benötigen passende Grants, Policies, Indizes und Tests.

Implementierte Beispiele:

- `create_independent_team()` erzeugt Team, Mitgliedschaft, Rollen und Einladungscode atomar.
- `submit_join_request_self()` und `submit_join_request_guardian()` legen Beitrittsdaten an.
- `approve_join_request()` und `reject_join_request()` entscheiden Anfragen.
- `create_event()` und `respond_to_event()` verwalten Training und RSVP.
- `remove_player_from_team()` beendet die Spielerzuordnung per Soft-Delete.

## 6. Umgebungsvariablen

Die Anwendung benötigt:

| Variable | Sichtbarkeit | Verwendung |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | öffentlich | Browser und Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | öffentlich | Browser und Server; RLS schützt Daten |

Regeln:

- `.env.local` wird nicht committed oder ausgegeben.
- Der Service-Role-Key gehört nicht in Browser- oder normalen Anwendungscode.
- Secrets erhalten nie ein `NEXT_PUBLIC_`-Präfix.
- CI verwendet ausschließlich Platzhalterwerte für Lint/Build.
- Vercel-Umgebungswerte werden außerhalb des Repositories verwaltet.

## 7. Lokale Entwicklung

Der verifizierte lokale Aufbau ist:

```text
npm run dev
  └─ .env.local
       └─ http://127.0.0.1:54321
            └─ lokaler Supabase-Docker-Stack
```

Die Kerncontainer waren am 2026-07-18 aktiv. `supabase_vector_vereon-app` startete fortlaufend neu; die fachlichen Kerncontainer liefen. Das ist ein lokales Übergaberisiko, nicht automatisch ein Fehler in Auth oder Datenbank.

Sichere Standardbefehle:

```bash
npx supabase start
npx supabase stop
npx supabase migration list --local
```

`npx supabase db reset` baut die lokale Datenbank aus allen Migrationen und Seeds neu auf und ist destruktiv für lokale Daten. Es darf nur nach ausdrücklicher Freigabe in der aktuellen Sitzung ausgeführt werden.

## 8. Gehostete interne Entwicklung

Die gehostete App läuft laut Nutzerangabe auf Vercel und verwendet Supabase Cloud. `main` wird automatisch bereitgestellt.

Nicht aus dem Repository verifizierbar:

- Supabase-Projektregion,
- Plan und Point-in-Time-Recovery,
- getestetes Backup-/Restore-Verfahren,
- Vercel-/Supabase-Zugriffsschutz,
- Cloud-Auth- und SMTP-Konfiguration im Detail,
- dediziertes Monitoring und Alerting.

Diese Punkte werden nicht als vorhanden oder fehlend behauptet. Sie müssen vor Pilotbetrieb verifiziert werden. Das gesamte Deployment soll bis dahin geschützt bleiben.

## 9. Migrationen

Verbindlicher Ablauf:

1. fachliche Entscheidung und Zielmodell abgleichen,
2. neue, additive Migration erstellen,
3. SQL, RLS, Grants und RPC-Berechtigungen prüfen,
4. vollständige lokale Migrationskette testen,
5. App-Code, Typen und relevante Tests prüfen,
6. Remote-Anwendung separat ankündigen und ausdrücklich freigeben lassen,
7. Ergebnis und Rücksetzweg dokumentieren.

Harte Regeln:

- keine bereits angewendete Migration umschreiben,
- kein automatisches `db push`,
- keine Remote-Datenbank ohne ausdrückliche Freigabe,
- kein Remote-Reset,
- keine Secrets in Ausgaben oder Dokumentation.

Die bestehenden Cloud-Migrationen wurden laut Nutzerangabe durch Claude Code ausgeführt. Der tatsächliche Remote-Migrationsstand wurde in diesem Audit nicht abgefragt.

## 10. Datenbanktypen

Zielbefehl:

```bash
npx supabase gen types typescript --local
```

Derzeit ist `src/types/database.types.ts` nur ein kleiner `Json`-Typ und kein generiertes Abbild des Schemas. Nach jeder Schemaänderung sollen Typen neu generiert und anschließend Typecheck, Lint und Build ausgeführt werden.

## 11. Nicht Teil der Strategie

- kein Prisma oder Drizzle,
- kein NextAuth/Auth.js,
- kein Service-Role-Key im normalen App-Prozess,
- keine direkte Datenbankänderung über die Cloud-Oberfläche als regulärer Entwicklungsweg,
- keine vorzeitige Club-, Realtime- oder Storage-Architektur ohne Produktbedarf.
