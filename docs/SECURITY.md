# Sicherheitsarchitektur — Vereon

**Stand:** 2026-07-18

**Zweck:** Sicherheitsregeln, bestätigte Schutzmechanismen und offene Risiken.
**Ist-Status:** Für den implementierten Stand sind `docs/ARCHITECTURE.md` und
`docs/STATUS.md` maßgeblich. Diese Datei trennt **implementiert**, **beschlossen,
nicht implementiert** und **offen**.

---

## 1. Verbindliche Grundregeln

1. Authentifizierung und Autorisierung werden serverseitig geprüft. UI-Logik ist
   kein Sicherheitsmechanismus.
2. Personenbezogene Tabellen müssen durch RLS und möglichst enge Grants geschützt
   sein.
3. Kritische Schreiboperationen laufen über geprüfte Serverlogik und, wenn mehrere
   Tabellen oder privilegierte Rechte betroffen sind, über gehärtete RPCs.
4. `SECURITY DEFINER`-Funktionen setzen `SET search_path = ''`, qualifizieren
   Objekte mit `public.` und leiten Nutzer- und Teamkontext aus der Datenbank ab.
5. Der Supabase-Service-Role-Key darf weder in Client- noch Anwendungscode,
   versionierten Dateien oder Ausgaben erscheinen.
6. Rollen werden aus aktiven Mitgliedschaften und Rollenbeziehungen ermittelt.
   `profiles.onboarding_role` ist keine Berechtigungsquelle.
7. Unverifizierte E-Mail-Konten dürfen sich anmelden und Informationsseiten sehen,
   aber keine produktiven Aktionen wie Team-Erstellung, Join-Anfrage oder RSVP
   ausführen. **Beschlossen, noch nicht durchgängig implementiert.**
8. Remote-Migrationen erfordern eine separate ausdrückliche Freigabe. Backup- und
   Rollback-Verfahren müssen vor einem Pilotbetrieb verifiziert sein.

---

## 2. Schlüssel und Umgebungen

| Variable | Einstufung | Verwendung |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | öffentlich | Browser und Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | öffentlich, RLS bleibt zwingend | Browser und Server |
| `SUPABASE_SERVICE_ROLE_KEY` | geheim, umgeht RLS | ausschließlich kontrollierte Admin-/CLI-Prozesse außerhalb des App-Codes |
| `INTERNAL_ACCESS_ENABLED` | serverseitig, kein Secret | schaltet den temporären internen Zugangsschutz scharf (`"true"`) |
| `INTERNAL_ACCESS_USERNAME` | serverseitig, geheim | Benutzername für den temporären internen Zugangsschutz |
| `INTERNAL_ACCESS_PASSWORD` | serverseitig, geheim | Passwort für den temporären internen Zugangsschutz; für ein künftiges Deployment wird ein langes, zufällig erzeugtes Passwort empfohlen, verwahrt außerhalb des Repositorys in einem Passwortmanager — in dieser Sitzung nicht erzeugt oder gesetzt |

Die lokale Next.js-Entwicklung verwendet laut geprüftem URL-Muster in
`.env.local` die lokale Supabase-Instanz. Das interne Vercel-Deployment nutzt
Supabase Cloud. Werte und Schlüssel werden nicht dokumentiert.

---

## 3. Bestätigter Schutz im Repository

| Bereich | Bestätigter Stand | Beleg |
|---|---|---|
| Interner Zugangsschutz (temporär) | HTTP Basic Auth vor der Supabase-Anmeldung, nur aktiv bei `INTERNAL_ACCESS_ENABLED === "true"`; fail-closed bei unvollständiger Konfiguration; Authorization-Header wird nach erfolgreicher Prüfung nicht an Server Components/Route Handler/Server Actions weitergereicht. Lokal implementiert und automatisiert getestet; auf `www.vereon.app` nicht deployed/extern nicht geprüft. Grund: Vercel Deployment Protection deckt Custom-Production-Domains auf dem aktuellen Tarif nicht ab (DEC-011). | `src/lib/internal-access.ts`, `src/proxy.ts`, `tests/e2e/internal-access.spec.ts`, `tests/e2e/internal-access-enabled.spec.ts` |
| Routenschutz | `src/proxy.ts` prüft die Supabase-Session und leitet nicht angemeldete Nutzer geschützter Routen zu `/login` um | `src/proxy.ts` |
| Server-Sessions | serverseitige Clients verwenden Cookie-basierte Supabase-Sessions und `getUser()`; der Proxy reicht erneuerte Cookies an Server Components und Browser weiter und übernimmt die von `@supabase/ssr` gelieferten Cache-Schutz-Header auch auf Session-Redirects | `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/lib/supabase/route-handler.ts`, `src/proxy.ts` |
| RLS | die vorhandenen Kerntabellen aktivieren RLS; Policies und Grants sind migrationsgeführt | `supabase/migrations/20260625190923_init_mvp0_core.sql`, `20260625221615_mvp0a_team_flows.sql`, `20260627000001_fix_authenticated_table_grants.sql`, `20260629200000_add_events.sql` |
| Team-Erstellung | eigenständiges Team, Mitgliedschaft und Rollen werden atomar über `create_independent_team()` angelegt | `20260625190923_init_mvp0_core.sql`, ersetzt/erweitert in `20260627100000_add_team_public_code.sql` |
| Join-Flow | Self- und Guardian-Anfragen verwenden getrennte RPCs; Annahme/Ablehnung prüft Teamrollen | `20260702000000_players_birth_year_only.sql`, `20260625221615_mvp0a_team_flows.sql` |
| RSVP | `respond_to_event()` prüft Spieler-/Guardian-Beziehung; entfernte Spieler verlieren künftige RSVP-Berechtigung | `20260704120000_remove_player_from_team.sql` |
| Spieler entfernen | nur `team_owner` und `head_coach`; Zuweisung wird beendet, vergangene Daten bleiben erhalten | `20260704120000_remove_player_from_team.sql` |
| Event-Erstellung/Absage | RPCs erlauben `team_owner`, `head_coach` und `assistant_coach`; Absage ist Soft-Cancel. Eine Absage-Aktion ist in `src/actions/events.ts` noch nicht verdrahtet | `20260629200000_add_events.sql`, `src/actions/events.ts` |
| Eingaben | Server Actions validieren bekannte Formwerte manuell; Supabase Query Builder/RPC-Parameter vermeiden zusammengesetztes SQL aus Nutzereingaben | `src/actions/*.ts` |

Die Tabelle bestätigt nur die genannten Schutzmechanismen. Sie ist kein
vollständiges Penetrationstest- oder RLS-Audit.

---

## 4. Rollen- und Aktionsgrenzen

Die fachliche Matrix steht in `docs/ROLES_AND_PERMISSIONS.md`. Für
sicherheitskritische Implementierungen gelten zusätzlich:

| Aktion | Erlaubte Rollen | Sicherheitsgrenze |
|---|---|---|
| Join-Anfrage annehmen/ablehnen | `team_owner`, `head_coach` | aktive Rolle im betroffenen Team |
| Einladungscode anzeigen/erneuern/deaktivieren | `team_owner`, `head_coach`, `assistant_coach` | Anzeigen ist für `assistant_coach` in der aktuellen RLS noch nicht freigegeben; erneuern/deaktivieren ist nicht implementiert |
| Training erstellen/bearbeiten/absagen | `team_owner`, `head_coach`, `assistant_coach` | Bearbeiten ist noch nicht implementiert |
| Training hart löschen | `team_owner`, `head_coach` | nur vor Beginn, ohne jegliche RSVP; zusätzliche Texteingabe `LÖSCHEN`; noch nicht implementiert |
| Spieler aus Team entfernen | `team_owner`, `head_coach` | Soft-Delete der Zuweisung, kein Löschen der Person/Historie |
| Rollen vergeben/entziehen | ausschließlich `team_owner` | vordefinierte Rollen, keine Einzelrechte; noch nicht implementiert |
| Eigentum übertragen | ausschließlich aktueller `team_owner` | Ziel ist registriert, volljährig, aktiv im selben Team und bestätigt; genau ein Owner; noch nicht implementiert |

Mehrfachrollen ergeben die Vereinigungsmenge ihrer Rechte. Ein Owner, der zugleich
Head Coach ist, kann die Head-Coach-Rolle ablegen, bleibt aber Owner. Die
Owner-Rolle wird nur durch eine bestätigte Eigentumsübertragung entzogen.

---

## 5. Datenschutzbezogene Sicherheitsgrenzen

- Für Spieler ist das Geburtsjahr Pflicht. Das vollständige Geburtsdatum ist
  freiwillig und darf nur für Geburtstagsübersicht und altersbezogene
  Teamorganisation verwendet werden.
- Teamseitig dürfen ein vollständiges Spielergeburtsdatum nur aktive
  `team_owner`, `head_coach` und `assistant_coach` des Teams sehen. Erfassung und
  Sichtbarkeit setzen eine klare Information und freiwillige Bestätigung voraus.
  Spieler dürfen das eigene Datum sehen und korrigieren; Guardians nur das Datum
  des eigenen verknüpften Kindes. Andere Spieler und Guardians haben keinen
  Zugriff.
- Endet die aktive Teamzuordnung, bleibt in notwendiger Historie nur das
  Geburtsjahr sichtbar. Der eigene Spieler-/Kind-Profilzugriff bleibt davon
  getrennt.
- Guardians sehen nur eigene verknüpfte Kinder; ein frühes MVP sieht nur einen
  Guardian-Account pro Kind vor.
- Weitere Bezugspersonen sind Kontaktangaben, keine Accounts und haben keine
  RSVP-Rechte.
- Der Guardian muss vor dem Kind-Beitritt ausdrücklich erklären, zur Anmeldung
  berechtigt zu sein. Zu speichern sind Nutzer, Zeitpunkt und Textversion.
  `player_guardians.verified_at` allein erfüllt diesen beschlossenen Nachweis
  nicht.
- Abgelehnte und zurückgezogene Join-Anfragen werden nach 90 Tagen automatisch
  bereinigt; unnötige Kinderdaten sollen früher entfernt werden. Die vorhandene
  Cleanup-Funktion ist nicht automatisiert.

Details und rechtliche Prüfgrenzen stehen in `docs/DSGVO_PRIVACY_MODEL.md` und
`docs/LEGAL_TODO.md`.

---

## 6. Offene und priorisierte Risiken

Die Priorisierung des technischen Audits bleibt in `docs/STATUS.md`. Für die
Security-Abnahme sind mindestens folgende Punkte relevant:

| Risiko | Status | Erforderliche Maßnahme |
|---|---|---|
| Produktive Aktionen ohne bestätigte E-Mail | offen | zentrale serverseitige Verifikationsprüfung und Negativtests |
| Self-Player-Join ohne serverseitige Altersgrenze | offen, Pilotblocker | rechtlich maßgebliche Grenze festlegen, serverseitig prüfen und Umgehung testen |
| Registrierung speichert Annahmezeitpunkte, aber keine Textversionen | offen | versionierte Terms-/Privacy-Annahme speichern |
| Guardian-Erklärung nicht versioniert gespeichert | offen | expliziten, serverseitig protokollierten Nachweis ergänzen |
| 90-Tage-Cleanup nicht geplant ausgeführt | offen, Pilotblocker | Job einrichten, Fehlerüberwachung und Testnachweis ergänzen |
| Vollständiges Spielergeburtsdatum fachlich beschlossen, aber Sichtbarkeits-/Consent-Modell nicht implementiert | offen | Feldfluss, RLS/Query-Grenzen und UI-Information gemeinsam umsetzen |
| Einladungscode ohne dokumentiertes Rate-Limit | offen | Bruteforce-Schutz und Monitoring festlegen |
| `team_manager` in Teilen der Migrationen/RLS | technische Altlast | vor Rollenänderungen vollständig inventarisieren und kontrolliert entfernen |
| Event-Bearbeitung und bedingter Hard-Delete fehlen | offen | serverseitige Zeit-, RSVP-, Rollen- und Bestätigungsprüfung |
| Manifest wird im gehosteten Zustand hinter Login umgeleitet | offen | `/manifest.webmanifest` öffentlich ausliefern und extern testen |
| Dediziertes Error-Tracking/Monitoring | nicht verifiziert | Konzept und Verantwortlichkeit vor Pilot festlegen |
| Cloud-Backup/Restore/Rollback | nicht verifiziert, Pilotblocker | Verfahren und Wiederherstellungstest dokumentieren |
| Rechtstexte enthalten Platzhalter | offen, Pilotblocker | fachanwaltlich prüfen und vor Pilot ersetzen |

---

## 7. Prüfpflicht bei sicherheitskritischen Änderungen

Mindestens zu prüfen sind:

1. angemeldet vs. nicht angemeldet,
2. E-Mail bestätigt vs. unbestätigt,
3. jede erlaubte Rolle sowie mindestens eine verbotene Rolle,
4. eigenes Team/Kind vs. fremdes Team/Kind,
5. aktive vs. beendete Mitgliedschaft/Zuweisung,
6. gültige, deaktivierte und erratene Einladungscodes,
7. Termin vor/nach Beginn, mit/ohne RSVP und abgesagter Termin,
8. direkter RPC-/Datenbankaufruf unabhängig von versteckten UI-Buttons,
9. keine Geheimnisse in Logs, Fehlermeldungen, Builds oder Commits.

Die ausführbaren Szenarien werden in `docs/MVP_TEST_CHECKLIST.md` gepflegt.

---

## 8. Bewusste Abgrenzung

- Club-/Mehrteam-Rollen sind technisch vorbereitet, aber nicht operativer
  MVP-Scope.
- `audit_logs`, Trainer-RSVP (`event_staff_rsvps`), detaillierte
  Anwesenheitserfassung und granulare Einzelrechte sind nicht implementiert.
- Diese Datei behauptet keine Produktionsreife. Unbekannte Vercel-, Supabase- oder
  organisatorische Einstellungen gelten bis zur Prüfung als **nicht verifiziert**.
