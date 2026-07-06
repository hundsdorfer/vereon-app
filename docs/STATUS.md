# Status — Code-Audit

**Stand:** 2026-07-06. Dieses Dokument ist ein **code-basiertes Audit** (statische Analyse des aktuellen Arbeitsverzeichnisses inkl. uncommitteter Änderungen), unabhängig vom phasenbasierten Fortschritts-Log in `docs/PROJECT_STATUS.md` und `docs/CURRENT_TASK.md`. Jede Aussage ist durch einen konkreten Code-Fund belegt.

---

## 1. Kurzstatus

Der MVP-0A-Kernflow (Team erstellen, Beitritt via Einladungscode, Trainings + RSVP) ist vollständig implementiert und funktioniert im Code konsistent. Lint und Build sind sauber, CI läuft. Es gibt jedoch **keine Unit-/Integrationstests** (nur 3 E2E-Specs, die nicht automatisch in CI laufen), ein fertiges Feature liegt **uncommitted** im Arbeitsverzeichnis, und mehrere DSGVO-/Sicherheitsrelevante Punkte sind vor einem Pilotbetrieb offen.

---

## 2. Funktioniert (mit Beleg)

| Bereich | Beleg |
|---|---|
| Auth (Sign-up/-in/-out) | `src/actions/auth.ts` — vollständige Validierung (E-Mail-Regex, Passwort-Komplexität, DOB-Plausibilität), Fehler-Mapping auf deutsche Texte |
| Team-Erstellung | `src/actions/team.ts` → RPC `create_independent_team`, Redirect zur Detailseite |
| Join-Flow Self + Guardian | `src/actions/join.ts`, `src/features/join/*` → RPCs `submit_join_request_self/guardian`; Migration `20260702000000_players_birth_year_only.sql` (Geburtsjahr statt vollem Geburtsdatum) vollständig durchgezogen bis ins UI |
| Beitrittsanfragen genehmigen/ablehnen | `src/actions/joinRequests.ts`, `src/features/joinRequests/RequestCard.tsx` |
| Trainings + RSVP | `src/actions/events.ts` (inkl. Vienna-Timezone-Konvertierung `viennaLocalToISO`), `src/features/events/*` |
| Dashboard, rollenabhängig | `src/app/(app)/dashboard/page.tsx` — echte `Promise.all`-Abfragen, keine Stub-Daten |
| Routenschutz | `src/proxy.ts` — Public-Routes/-Prefixes, blockt `/dev/*` in Production |
| Lint | `npm run lint` — 0 Fehler/Warnungen |
| CI | `.github/workflows/ci.yml` — lint + build auf jeden Push/PR |

---

## 3. Unvollständig / Uncommitted

### 3.1 „Remove player from team“-Feature ist nicht committet (wichtigster Befund)

`git status` zeigt folgende **untracked** Dateien sowie eine **modifizierte** Datei, die zusammen ein vollständiges Feature bilden, aber in keinem Commit stecken:

- `src/actions/players.ts` (neu) — `removePlayerFromTeamAction`
- `src/components/ui/ConfirmButton.tsx` (neu) — generisches Zwei-Schritt-Bestätigungsmuster
- `src/features/players/RemovePlayerButton.tsx` (neu)
- `supabase/migrations/20260704120000_remove_player_from_team.sql` (neu) — RPC `remove_player_from_team()` (Soft-Delete via `status='left'`), **plus** ein `CREATE OR REPLACE` von `respond_to_event()`, das eine echte Autorisierungslücke schließt: bisher konnte ein aus dem Team entfernter Spieler (bzw. dessen Guardian) weiterhin per RSVP antworten, weil nur die Spieler-Zeile, nie die aktive Team-Zuordnung geprüft wurde
- `src/app/(app)/teams/[teamId]/page.tsx` (modifiziert) — verdrahtet `canManageMembers` (`has_team_role(['team_owner','head_coach'])`) und rendert `RemovePlayerButton`

Der Code selbst wirkt vollständig und konsistent (Fehlerbehandlung, RLS-Autorisierung, UI-Anbindung) — er ist nur **nicht in `docs/CURRENT_TASK.md` als abgeschlossene Phase erfasst** und liegt bislang nur im Arbeitsverzeichnis, nicht in der Git-Historie.

### 3.2 Weitere offene Punkte

- **Legal-Seiten sind reine Platzhalter**: `src/app/legal/{imprint,privacy,terms}/page.tsx` — jeder Abschnitt enthält wörtlich `[Platzhalter — wird ergänzt]`, keine Betreiberangaben. Bereits in `docs/LEGAL_TODO.md` als Blocker vor Pilotbetrieb bekannt.
- **Keine Unit-/Integrationstests**: keine `*.test.ts`/`*.spec.ts`/`__tests__` unter `src/`, kein `test`-Script in `package.json`. Nur 3 Playwright-E2E-Dateien unter `tests/e2e/`.
- **E2E nicht Teil des CI-Gates**: `.github/workflows/e2e.yml` läuft nur via `workflow_dispatch` (manuell), nicht bei jedem Push/PR — nur `lint`+`build` sind automatisch abgesichert.
- **`cleanup_expired_join_requests()` ist nie scheduled**: Funktion existiert (`supabase/migrations/20260625221615_mvp0a_team_flows.sql`, Kommentar „Aufzurufen via pg_cron oder manuell“), aber kein `pg_cron.schedule(...)`-Aufruf ist in den Migrationen zu finden — die dokumentierte 90-Tage-Löschfrist für abgelehnte/abgelaufene Beitrittsanfragen mit Kinderdaten greift nicht automatisch.
- **Guardian-Consent ist nur ein Zeitstempel**: `player_guardians.verified_at` wird beim Absenden der Guardian-Join-Anfrage sofort automatisch gesetzt (`submit_join_request_guardian`, Migration `20260702000000_players_birth_year_only.sql`) — kein echter Einwilligungsnachweis, nur ein technischer Verknüpfungszeitpunkt.
- **Club/Verein-Flows: Datenmodell da, UI fehlt komplett**: Tabellen `clubs`, `club_memberships`, `club_member_roles` existieren seit der ersten Migration, aber es gibt keine einzige Seite/Aktion für Club-Erstellung, -Verwaltung oder Team-Affiliation.
- **`src/types/database.types.ts` ist nur ein Stub**: 7 Zeilen (`Json`-Typ), keine aus dem Schema generierten Supabase-Typen — trotz `SUPABASE_STRATEGY.md`-Vorgabe, `supabase gen types typescript --local` zu nutzen. Keine Typsicherheit zwischen App-Code und DB-Schema.
- **Duplizierte Rollen-Erkennungslogik**: dieselbe `NON_TRAINER_ROLES`-Formel zur Trainer/Nicht-Trainer-Unterscheidung ist unabhängig sowohl in `src/app/(app)/dashboard/page.tsx` als auch in `src/app/(app)/teams/page.tsx` implementiert statt in einem gemeinsamen Helper.
- **`ThemeDebug`**-Komponente in `src/components/layout/ThemeProvider.tsx` ist explizit als „Phase-A-Diagnoseanzeige, kann nach Phase A entfernt werden“ kommentiert, aber noch nicht entfernt.

---

## 4. Historisch behobene Bugs (kein offenes Problem, aber Beleg für reaktive Schema-Entwicklung)

5 von 13 Migrationen sind explizit Hotfixes für zuvor eingeführte Lücken:

| Migration | Ursache | Fix |
|---|---|---|
| `20260627000001_fix_authenticated_table_grants` | RLS-Policies vorhanden, aber Postgres-`GRANT`s fehlten → „permission denied“ trotz korrekter Policy | SELECT-Grants für `authenticated` ergänzt |
| `20260629100000_fix_players_trainer_rls` | SQL-Scope-Shadowing (`WHERE pta.player_id = id` löste `id` auf die falsche Tabelle auf) → Policy immer `false` | Neue SECURITY-DEFINER-Helper-Funktionen |
| `20260629300000_fix_player_event_rls` | Self-Player/Guardian hatten keine SELECT-Policy auf `teams`/`events` → leere Listen | `is_player_in_team()`, `is_guardian_in_team()` ergänzt |
| `20260629400000_add_pta_player_policy` | Self-Player konnte eigene aktive Zuordnung nicht lesen | Policy `pta_select_player` ergänzt |
| `20260704120000_remove_player_from_team` (uncommitted) | Entfernte Spieler konnten weiterhin per RSVP antworten | `respond_to_event()` prüft jetzt zusätzlich aktive Team-Zuordnung |

---

## 5. Nicht geprüft / außerhalb des Scopes dieses Audits

- Laufzeitverhalten gegen die produktive Supabase-Cloud-Instanz (Audit basiert auf statischer Code-/Migrationsanalyse, nicht auf Ausführung).
- Performance/Ladezeiten, Lighthouse-/PWA-Audit (laut `docs/CURRENT_TASK.md` ohnehin noch nicht durchgeführt).
- Tatsächliches Verhalten von E-Mail-Zustellung/Double-Opt-in in Produktion.
- Barrierefreiheit (a11y) — nicht gezielt untersucht.
