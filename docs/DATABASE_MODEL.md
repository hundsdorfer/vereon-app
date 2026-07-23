# Datenmodell — Vereon

**Stand:** 2026-07-22

Dieses Dokument beschreibt das fachliche Zielmodell und kennzeichnet den Umsetzungsstand. Es ist keine ausführbare Migration. Der technische Ist-Zustand ergibt sich aus `supabase/migrations/`; Abweichungen stehen in `docs/STATUS.md`.

## 1. Statuslegende

| Status | Bedeutung |
|---|---|
| **Implementiert** | Im aktuellen Migrationsstand vorhanden und im Repository verifiziert |
| **Beschlossen – nicht implementiert** | Fachlich entschieden, aber Schema, RLS oder App-Flow fehlen ganz oder teilweise |
| **Offen** | Noch nicht ausreichend entschieden oder technisch verifiziert |
| **Post-MVP** | Bewusst nicht Teil des frühen MVP |

## 2. Modellüberblick

```text
auth.users ── profiles
    │
    ├─ club_memberships ── club_member_roles ── roles
    ├─ team_memberships ── team_member_roles ── roles
    ├─ players
    └─ player_guardians ── players

clubs ── seasons
  └─ teams ── team_memberships
       ├─ team_invitation_links ── team_join_requests
       ├─ player_team_assignments ── players
       └─ events ── event_attendance ── players
                  └─ event_staff_rsvps
```

Der aktuelle Einzelteam-Flow funktioniert ohne Club: `teams.club_id` ist bei eigenständigen Teams `NULL`.

## 3. Technisch implementierte Tabellen

Der lokal angewendete und verifizierte Migrationsstand enthält 19 öffentliche
Tabellen:

| Bereich | Tabellen |
|---|---|
| Rollen und Profile | `roles`, `permissions`, `role_permissions`, `profiles` |
| Club und Saison | `clubs`, `seasons`, `club_memberships`, `club_member_roles` |
| Teams und Rollen | `teams`, `team_memberships`, `team_member_roles` |
| Spieler und Beitritt | `players`, `player_guardians`, `team_invitation_links`, `team_join_requests`, `player_team_assignments` |
| Termine und RSVP | `events`, `event_attendance`, `event_staff_rsvps` |

Für alle Tabellen ist RLS aktiviert. Die Tabellen `permissions` und `role_permissions` sind strukturell vorhanden, werden im Produkt aber noch nicht als granulare Rechteverwaltung genutzt.

## 4. Profile und Auth

### `profiles`

**Status: Implementiert**

Technische Ist-Felder:

- `id` als 1:1-Bezug zu `auth.users`,
- `email`, `full_name`, `first_name`, `last_name`,
- `avatar_url`, `phone`,
- `date_of_birth`,
- `onboarding_role`,
- `terms_accepted_at`, `privacy_accepted_at`,
- Zeitstempel.

Aktuell verlangt die Registrierung das vollständige Geburtsdatum. Die Datenbankspalte ist nullable, die Server Action jedoch nicht.

**Beschlossen – nicht implementiert:**

- Für jeden registrierten Nutzer ist nur das Geburtsjahr verpflichtend.
- Das vollständige Geburtsdatum ist freiwillig.
- Wird ein vollständiges Datum angegeben, wird das Geburtsjahr daraus abgeleitet oder muss damit übereinstimmen.
- AGB- und Datenschutzannahme speichern jeweils Dokumentversion und Zeitpunkt.
- Produktive Aktionen setzen eine bestätigte E-Mail voraus; Login und Verifizierungshinweise dürfen vorher möglich sein.

Die konkrete Abbildung von `birth_year` und den Dokumentversionen ist vor einer Migration festzulegen. Das ist eine technische Detailentscheidung, keine offene Produktfrage.

## 5. Rollen und Mitgliedschaften

### `roles`, `team_memberships`, `team_member_roles`

**Status: Implementiert**

- Rollen sind Seed-Daten mit `system`-, `club`- oder `team`-Scope.
- Eine aktive `team_memberships`-Zeile verbindet einen Nutzer mit einem Team.
- `team_member_roles` erlaubt mehrere Rollen pro Teammitglied.
- Die Team-Erstellung vergibt `team_owner` und standardmäßig `head_coach`.

Der Seed enthält weiterhin `team_manager`; die Rolle gehört nicht mehr zum fachlichen Zielmodell. Bestehende Leseprüfungen verwenden sie teilweise noch.

**Implementiert (`FC-ROLE-002`/`FC-ROLE-003`):** Vergabe und Entzug der Rolle
`assistant_coach` erfolgen ausschließlich durch den `team_owner`
(`grant_assistant_coach()`/`revoke_assistant_coach()` in
`20260723100000_add_role_management.sql`). Eine zweite Person erhält dabei
erstmals eine `team_memberships`-Zeile — bislang legte ausschließlich
`create_independent_team()` eine solche Zeile an (für den Team-Ersteller).
Vergabe setzt eine nachweisbare, aktive Spielerbeziehung voraus (aktive
`player_team_assignments`-Zeile mit gesetztem `players.user_id`); die neue
Tabelle `team_role_audit_log` protokolliert jede Vergabe/jeden Entzug. Ein
Entzug ohne verbleibende Rolle deaktiviert die Mitgliedschaft
(`status = 'inactive'`), damit keine dauerhafte, grundlose
Teamzugriffsberechtigung zurückbleibt.

**Beschlossen – nicht implementiert:**

- Pro Team existiert genau ein `team_owner` (kein DB-Constraint, nur durch
  `create_independent_team()` als einzigen `team_owner`-Schreibpfad
  faktisch abgesichert).
- Allgemeine Rollenverwaltung über `assistant_coach` hinaus (z. B.
  `head_coach`-Vergabe/-Entzug, Eigentumsübertragung).
- Es gibt zunächst nur vordefinierte Rollen, keine individuellen Einzelrechte.
- Eigentumsübertragung ist nur an einen bereits registrierten, volljährigen und aktiven Nutzer desselben Teams möglich.
- Der neue Owner muss die Übernahme ausdrücklich bestätigen.
- Die Übertragung ändert ausschließlich `team_owner`; andere Rollen beider Personen bleiben unverändert.
- Ein Nutzer mit `team_owner` und `head_coach` besitzt die Vereinigungsmenge beider Rechte und kann `head_coach` abgeben, ohne die Owner-Rolle zu verlieren.

Die atomare technische Umsetzung der Übertragung benötigt eine eigene RPC, Eindeutigkeitsabsicherung und Auditdaten.
Wie Volljährigkeit bei nur vorhandenem Geburtsjahr rechtssicher geprüft wird, ist technisch/fachlich noch festzulegen; aus einem Jahr allein ist der genaue 18. Geburtstag nicht ableitbar.

### `permissions`, `role_permissions`

**Status: Implementiert als ungenutzte Struktur**

Die Tabellen existieren, sind aber nicht die Quelle operativer Produktrechte. Eine Aktivierung granularer Einzelrechte ist nicht beschlossen.

### Club-Rollen

**Status: Post-MVP**

`clubs`, `club_memberships`, `club_member_roles` und die Rolle `club_admin` sind technisch vorbereitet. Sichtbare Club-/Mehrteam-Verwaltung, Team-Affiliation und operative Club-Rechte sind Post-MVP.

## 6. Teams und Saison

### `teams`

**Status: Implementiert**

Wichtige Ist-Felder:

- optionale Bezüge `club_id` und `season_id`,
- `created_by`, `name`, `age_group`, `gender`, `team_type`,
- `ownership_type` (`independent`, `club_managed`),
- `status` und `is_active`,
- Zeitstempel.

Eigenständige Teams haben `club_id = NULL`. Die `ownership_type`-/`club_id`-Konsistenz ist per Constraint abgesichert.

**Beschlossen – nicht implementiert:**

- Ein Team mit Mitgliedern, Terminen oder Historie wird nicht über einen normalen App-Flow hart gelöscht.
- Der `team_owner` kann es archivieren.
- Historische Zuordnungen und Termine bleiben erhalten.

### `seasons`

**Status: Implementiert, operativ kaum genutzt**

Das Schema erlaubt Saisonen pro Club und eine aktive Saison. `teams` und `events` besitzen optionale `season_id`-Bezüge. `player_team_assignments` besitzt noch keinen Saisonbezug.

**Offen:**

- fachlicher Saisonwechsel,
- Verhalten bei eigenständigen Teams ohne Club,
- Historisierung über mehrere Saisonen.

## 7. Spieler

### `players`

**Status: Implementiert**

Technische Ist-Felder:

- `created_by`, optionales `user_id`,
- `first_name`, `last_name`,
- nullable `birth_year`,
- nullable `date_of_birth` als Bestandsspalte,
- optionale `position`, `jersey_nr`,
- `is_active` und Zeitstempel.

Die aktuellen Join-RPCs verlangen beim Guardian-Flow ein Geburtsjahr und befüllen `date_of_birth` nicht. Beim Self-Player wird das Jahr aus `profiles.date_of_birth` abgeleitet, sofern vorhanden.

**Beschlossen – nicht implementiert:**

- `birth_year` ist für jeden Spieler verpflichtend.
- `date_of_birth` bleibt optional.
- Bei vorhandenem Datum wird das Jahr abgeleitet oder validiert.
- Zweck des vollständigen Datums sind Geburtstagsübersicht und altersbezogene Teamorganisation.
- Ein Spieler darf das eigene freiwillige Datum sehen und korrigieren.
- Ein Guardian darf es nur für das eigene verknüpfte Kind sehen und korrigieren.
- Zusätzlich dürfen aktive `team_owner`, `head_coach` und `assistant_coach` das Datum aktiver Spieler ihres Teams sehen.
- Andere Nutzer dürfen es nicht sehen.
- Die freiwillige Angabe muss transparent bestätigt werden.
- Nach Ende der aktiven Teamzuordnung bleibt in der Teamhistorie nur das Geburtsjahr sichtbar; eigener beziehungsweise kindbezogener Profilzugriff ist davon zu trennen.
- Ohne vollständiges Datum zeigt die App neutral den Jahrgang und fordert nicht wiederholt zur Ergänzung auf.

### `player_team_assignments`

**Status: Implementiert**

Die Tabelle verbindet Spieler und Team mit `active`, `loaned_out` oder `left`. `remove_player_from_team()` setzt `left` und `left_at`, ohne Spieler oder Historie zu löschen.

**Beschlossen – teilweise implementiert:**

- Entfernen dürfen nur `team_owner` und `head_coach`.
- Vergangene RSVP-Daten bleiben in der Teamhistorie.
- Zukünftige RSVP eines entfernten Spielers dürfen nicht mehr in Zusagen oder Teilnehmerzahlen erscheinen.

Die Sperre neuer RSVP ist implementiert. Das Entfernen oder Ausblenden bereits vorhandener zukünftiger RSVP-Zeilen aus allen Zählungen muss noch durchgängig geprüft werden.

## 8. Guardian und Kontaktpersonen

### `player_guardians`

**Status: Implementiert**

Die Tabelle verbindet einen Nutzer mit einem Spielerprofil. `verified_at` wird beim Guardian-Join gesetzt und ist technisch der Zeitpunkt der Verknüpfung, kein ausreichender Einwilligungsnachweis.

**Beschlossen – nicht implementiert:**

- Im frühen MVP gibt es höchstens einen Guardian-Account pro Kind.
- Der Guardian erklärt ausdrücklich, zur Anmeldung des Kindes berechtigt zu sein.
- Gespeichert werden Nutzer, Zeitpunkt und Version des bestätigten Erklärungstexts.
- Die Erklärung ist eine Selbstauskunft, keine Identitätsprüfung.

### Kontaktpersonen

**Status: Beschlossen – nicht implementiert**

Weitere Bezugspersonen werden als begrenzte Kontaktdatensätze geführt:

- kein eigener Login,
- keine eigene Rolle,
- kein eigenes RSVP-Recht.

Tabellenname und konkrete Minimalfelder sind vor Umsetzung festzulegen.

## 9. Einladung und Beitritt

### `team_invitation_links`

**Status: Implementiert**

Die Tabelle enthält aktuell:

- `team_id`, `created_by`,
- nullable `token_hash`,
- nullable `public_code`,
- `max_uses`, `use_count`,
- nullable `expires_at`,
- `revoked_at`, `created_at`.

Der sichtbare Code ist `public_code`. `token_hash` gehört zu einem älteren technischen Linkpfad und ist keine nutzerseitige Zielkennung.

**Beschlossen – nicht implementiert:**

- Der aktuelle Code bleibt gültig, bis eine berechtigte Trainerrolle ihn erneuert oder deaktiviert.
- Es gibt im frühen MVP keine automatische Ablaufzeit und kein sichtbares Nutzungslimit.
- `team_owner`, `head_coach` und `assistant_coach` dürfen Code anzeigen, erneuern und deaktivieren.
- Bei Erneuerung wird der vorige Code atomar deaktiviert.

Aktuell begrenzt `max_uses = 50` den Code technisch, und Anzeigen/Widerrufen ist in RLS/RPCs nicht für alle beschlossenen Rollen konsistent umgesetzt. Ein Erneuern-Flow fehlt.

### `team_join_requests`

**Status: Implementiert**

Die Tabelle unterscheidet `self_player` und `guardian_child`, speichert Antragsteller, optionalen Guardian und Spieler sowie Bearbeitungsstatus und Zeitstempel.

**Beschlossen – teilweise implementiert:**

- `team_owner`, `head_coach` und `assistant_coach` dürfen offene Anfragen sehen.
- `team_owner` und `head_coach` dürfen annehmen oder ablehnen.
- `assistant_coach` darf nicht entscheiden.
- Der Antragsteller kann eine offene Anfrage zurückziehen.
- Abgelehnte und zurückgezogene Anfragen werden nach 90 Tagen automatisch bereinigt.
- Nicht mehr notwendige Kinderdaten werden so früh wie möglich entfernt.

Die Bereinigungsfunktion existiert, aber keine automatische Ausführung. Der konkrete Umgang mit bereits genehmigten Anfragen ist für gesetzliche Aufbewahrung und Audit noch offen.

## 10. Termine

### `events`

**Status: Implementiert**

Wichtige Ist-Felder:

- `team_id`, optional `club_id` und `season_id`,
- `created_by`,
- `event_type` (`training`, `match`, `other`),
- `title`, `starts_at`, optional `ends_at`,
- `location`, `description`,
- `is_cancelled`,
- Zeitstempel.

Die Oberfläche verwendet derzeit nur `event_type = 'training'`.

**Beschlossen – teilweise implementiert:**

- `team_owner`, `head_coach` und `assistant_coach` dürfen Trainings erstellen, bearbeiten und absagen. Bearbeiten ist nur vor `starts_at`, nur für `event_type = 'training'` und nur solange nicht abgesagt zulässig; `team_id`, `club_id`, `season_id`, `created_by`, `event_type`, `is_cancelled` und `ends_at` sind dabei nicht änderbar.
- Nur `team_owner` und `head_coach` dürfen hart löschen.
- Hard-Delete ist nur vor `starts_at` und nur ohne abgegebene Spieler- oder Trainer-RSVP zulässig. Automatisch vorbereitete `event_attendance`-Zeilen ohne Status zählen nicht als Antwort.
- Die Oberfläche verlangt eine zusätzliche Texteingabe wie `LÖSCHEN`.
- Ab Terminbeginn oder sobald eine RSVP existiert, bleibt nur Absage beziehungsweise historischer Status.
- Abgesagte Trainings bleiben sichtbar und eindeutig markiert.
- Nach Absage sind keine neuen oder geänderten RSVP möglich.

Erstellen und Absagen sind vorhanden und in der App verdrahtet
(`cancelEventAction()` in `src/actions/events.ts` ruft `cancel_event()`;
UI in `src/app/(app)/teams/[teamId]/events/[eventId]/page.tsx` und
`src/features/events/CancelEventButton.tsx`). Bearbeiten ist lokal
vollständig umgesetzt, migriert und verifiziert (`update_training()` in
`supabase/migrations/20260721094219_update_training.sql`,
`updateTrainingAction()`, Route `.../events/[eventId]/edit/page.tsx`;
vollständiger Playwright-Lauf 58/58 am 2026-07-21). Bedingter Hard-Delete
ist lokal implementiert, migriert und verifiziert (`delete_training()` in
`supabase/migrations/20260721114453_delete_training.sql`,
`deleteTrainingAction()`, `src/features/events/DeleteTrainingForm.tsx`;
vollständiger Playwright-Lauf 60/60 am 2026-07-21; siehe Abschnitt 12 und
`docs/STATUS.md` für Details und offene Testlücken).

### `event_attendance`

**Status: Implementiert**

Die Tabelle enthält pro Event und Spieler:

- RSVP-Status (`attending`, `declined`, `maybe`),
- optionale Notiz,
- antwortenden Nutzer und Zeitpunkt,
- nullable `attended` für spätere Anwesenheit.

Zeilen werden beim Event-Erstellen sowie nach späterer Aufnahme eines Spielers erzeugt.

**Beschlossen – nicht vollständig implementiert:**

- Spieler und Guardians können RSVP bis `starts_at` ändern, danach nicht mehr.
- Attendance ist ein eigener späterer Schritt und verändert die historische RSVP nicht.

Die aktuelle RPC prüft Absage und aktive Teamzuordnung, aber keine Deadline am Terminbeginn.

### `event_staff_rsvps`

**Status: Implementiert**

Trainer-RSVP ist getrennt von Spieler-RSVP modelliert. Fachlicher Schlüssel ist
`UNIQUE (event_id, user_id)`. Die Tabelle enthält:

- `id`, `event_id`, `user_id`,
- `rsvp_status` (`attending`, `declined`, `maybe`),
- optionale freie `rsvp_note`,
- `responded_at`, `created_at`, `updated_at`.

`event_id` und `user_id` kaskadieren beim Löschen des jeweiligen Bezugs. Eigene
Antworten und die Trainerübersicht sind per RLS lesbar; Schreiben erfolgt nur
über `respond_to_event_as_staff()`. Die RPC erlaubt ausschließlich aktive
`team_owner`, `head_coach` und `assistant_coach`, sperrt abgesagte und bereits
begonnene Termine und aktualisiert die eigene Antwort per UPSERT.

`list_staff_rsvps_for_event()` liefert aktuelle aktive Trainer auch ohne Antwort
und ergänzt vorhandene Antworten inzwischen nicht mehr aktiver Trainer. Das
Rückgabefeld `is_active_trainer` kennzeichnet diese Historiensemantik; mehrere
Trainerrollen desselben Nutzers erzeugen nur eine Zeile. `team_manager` ist nicht
berechtigt.

## 11. Anwesenheit, Matches und Audit

### Anwesenheitsabschluss

**Status: Beschlossen für MVP-1 – nicht implementiert**

`event_attendance.attended` ist vorbereitet. Abschluss, Wiederöffnung und Audit fehlen.

### Matches und Spielberichte

**Status: Post-MVP beziehungsweise noch gesondert zu entscheiden**

`events.event_type = 'match'` ist technisch zulässig, besitzt aber keinen vollständigen Produktflow. Eigene Match-/Report-Tabellen existieren nicht.

### Audit-Log

**Status: Teilweise implementiert.** Ein allgemeines `audit_logs`-Konzept für
Eigentumsübertragung, Einladungswechsel und sensible Löschvorgänge existiert
weiterhin nicht — Umfang, Aufbewahrung und Sichtbarkeit dafür bleiben vor
Umsetzung zu entscheiden.

Für `assistant_coach`-Rollenänderungen (`FC-ROLE-002`/`FC-ROLE-003`) existiert
seit `20260723100000_add_role_management.sql` die dedizierte, eng geschnittene
Tabelle `team_role_audit_log` (`team_id`, `target_user_id`, `role_key`,
`action` (`granted`/`revoked`), `performed_by`, `performed_at`). Nur
`team_owner` darf sie lesen (RLS-`SELECT`-Policy über `has_team_role()`);
Schreibzugriff hat ausschließlich `SECURITY DEFINER` (keine `INSERT`/
`UPDATE`/`DELETE`-Grants für `authenticated`). `target_user_id` und
`performed_by` verwenden `ON DELETE SET NULL` statt `CASCADE`, damit eine
spätere Account-Löschung die Historie anonymisiert statt sie vollständig zu
entfernen oder die Löschung zu blockieren.

## 12. Löschung und Aufbewahrung

| Objekt | Zielverhalten | Status |
|---|---|---|
| Spieler aus Team | Soft-Delete der Zuordnung, Historie bleibt | implementiert |
| Team | Archivierung durch Owner statt normalem Hard-Delete | beschlossen, nicht implementiert |
| Training ohne abgegebene RSVP vor Beginn | Hard-Delete durch Owner/Head mit exakter Texteingabe `LÖSCHEN` | lokal implementiert; Spieler- und Trainer-RSVP werden atomar geprüft |
| Training mit abgegebener Spieler- oder Trainer-RSVP, nach Beginn oder nach Absage | kein Hard-Delete, nur Absage/Historie | implementiert; beide RSVP-Arten blockieren Hard-Delete |
| abgelehnte/zurückgezogene Join-Anfrage | automatische Bereinigung nach 90 Tagen | Funktion vorhanden, Scheduling fehlt |
| Account-Löschung | derzeit kein Self-Service; rechtlicher Prozess offen | offen |

## 13. Migrationsregeln

1. Änderungen erfolgen ausschließlich über neue versionierte Migrationen.
2. Bestehende Migrationen werden nicht nachträglich umgeschrieben.
3. Schema, RLS, RPCs, Grants und Typgenerierung werden gemeinsam geprüft.
4. Eine lokale Prüfung erfolgt gegen die vollständige Migrationskette.
5. Remote-Migrationen benötigen immer eine separate ausdrückliche Freigabe.
6. Backup- und Restore-Verfahren der Cloud sind vor Pilotbetrieb zu verifizieren.

## 14. Verbleibende technische Entscheidungen

Diese Punkte sind keine Aufforderung, Produktregeln neu zu erfinden:

- genaue Spalten und Constraints für Consent-Versionen,
- atomare Owner-Transfer-RPC und Auditmodell,
- Volljährigkeitsprüfung beim Owner-Transfer, wenn nur das Geburtsjahr vorliegt,
- technische Form der Kontaktperson,
- Umgang mit bestehenden `players.date_of_birth`-Altdaten,
- Bereinigung oder Migration von `token_hash`, `max_uses` und `team_manager`,
- Saisonmodell für eigenständige Teams.
