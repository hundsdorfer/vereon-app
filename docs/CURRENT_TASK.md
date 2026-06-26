# Current Task — Vereon

## Aktueller Stand

Abgeschlossen:

* Migration 001 `init_mvp0_core` — lokal verifiziert
* Migration 002 `mvp0a_team_flows` — lokal verifiziert
* Phase A UI-Fundament — committed:
  * responsive AppShell, Light/Dark Theme, Mobile, Safe Area, Touch Targets, allowedDevOrigins, UI-Basiskomponenten
* Phase B.1 Routing/Auth — committed:
  * Login/Register, Auth Actions, Auth Callback, Route-Gruppen, /dashboard Platzhalter, Root Redirect, proxy.ts Route-Schutz
* Phase B.2 AppShell UX Cleanup — committed:
  * User-E-Mail in AppShell, Logout auf Desktop + Mobile, aktive Navigation, /teams Platzhalterseite, kein toter Nav-Link

## Aktuelle Hauptaufgabe

Phase C umsetzen: Team erstellen + eigene Teams anzeigen.

Ziel: Ein eingeloggter User kann über die Browser-App ein eigenständiges Team erstellen und seine eigenen Teams unter /teams und im Dashboard sehen.

## Scope Phase C

### Zu bauen (5 Dateien)

| Datei | Aktion | Inhalt |
|---|---|---|
| `src/actions/team.ts` | neu | Server Action `createTeamAction` — ruft `create_independent_team()` RPC mit `p_team_name`, optional `p_age_group`, `p_gender`, fest `p_also_head_coach = true` auf; bei Erfolg `redirect('/teams')` |
| `src/features/teams/CreateTeamForm.tsx` | neu | Client Component, `useActionState`, Felder: Teamname (required), Altersgruppe (optional, Freitext), Geschlecht (optional, Select: Gemischt / Männlich / Weiblich) |
| `src/app/(app)/teams/new/page.tsx` | neu | Server Component, Card-Container mit `CreateTeamForm` |
| `src/app/(app)/teams/page.tsx` | erweitern | Lädt Teams via RLS-gefilterter `teams`-Tabelle (`.from('teams').select(...).eq('is_active', true).order('created_at', ...)`), zeigt Cards oder EmptyState; "Team erstellen"-Link im `PageHeader`-action |
| `src/app/(app)/dashboard/page.tsx` | erweitern | Zeigt Team-Anzahl + Link zu `/teams` statt statischem Platzhalter |

### RPC-Signatur (aus database.types.ts)

```ts
supabase.rpc('create_independent_team', {
  p_team_name: string,      // required
  p_age_group?: string,     // optional
  p_gender?: string,        // optional
  p_also_head_coach?: boolean,  // default true — immer true setzen
})
// Returns: string (team UUID)
```

### Query für Teamliste

```ts
supabase
  .from('teams')
  .select('id, name, age_group, gender, ownership_type, created_at')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

RLS filtert automatisch auf Teams des eingeloggten Users.

### Nicht in Phase C

* Keine Migration ändern
* Kein `npx supabase db reset`
* Kein `npx supabase db push`
* Kein Einladungslink-Flow
* Kein Join-Request-Flow
* Kein Spieler-/Elternflow
* Kein echtes Team-Cockpit (Detailseite)
* Keine neuen Packages installieren

## Hinweise für die Umsetzung

* `p_also_head_coach = true` immer explizit setzen
* Bei RLS-/Query-Fehlern: nicht Migration ändern, sondern berichten
* "Team erstellen"-Link im PageHeader als styled `<Link>` umsetzen (kein Slot/asChild nötig)
* Phase-A-Design, Dark Mode und Mobile dürfen nicht beschädigt werden
* Nach Umsetzung: `npm run lint` + `npm run build` prüfen, dann committen

## Erlaubt

* Phase C implementieren (die 5 Dateien oben)
* bestehende Supabase-Clients verwenden (`src/lib/supabase/server.ts`)
* RPC `create_independent_team()` aufrufen
* bestehende Tabellen lesen (`teams`)
* Lint und Build ausführen

## Verboten

* Keine Migration ändern
* Kein `npx supabase db reset`
* Kein `npx supabase db push`
* Keine Remote-Datenbank
* Keine Secrets anzeigen
* `.env.local` nicht anzeigen
* Keine Packages installieren
* Phase-A-Design, Dark Mode und Mobile nicht beschädigen
* Kein Einladungslink-/Join-Request-Scope

## Relevante Dokumente

* `CLAUDE.md`, `docs/PROJECT_BRIEF.md`, `docs/CURRENT_TASK.md`
* `docs/SUPABASE_STRATEGY.md`, `docs/SECURITY.md`
* `docs/USER_FLOWS.md`, `docs/DATABASE_MODEL.md`

## Migrationsübersicht

| Migration               | Inhalt                                                   | Status                              |
| ----------------------- | -------------------------------------------------------- | ----------------------------------- |
| `001_init_mvp0_core`    | Kern-Tabellen, Rollen, RLS, Funktionen                   | Abgeschlossen und lokal verifiziert |
| `002_mvp0a_team_flows`  | Self-Service Team Flow                                   | Abgeschlossen und lokal verifiziert |
| `003_mvp0b_club_flows`  | Vereinsflows, Vereins-Einladungen                        | Offen                               |
| `004_mvp1_players_full` | vollständiges Spieler-/Elternmodell, Events, Anwesenheit | Offen                               |
| `005_mvp2_affiliation`  | Team-Zuordnung zu verifiziertem Verein                   | Offen                               |

## Nächster Schritt

Phase C direkt umsetzen (Plan ist bestätigt).
