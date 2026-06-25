# MVP Scope — Vereon

**Stand:** 2026-06-25 (überarbeitet: MVP in vier Stufen aufgeteilt, eigenständige Teams als Einstieg)

---

## MVP-Philosophie

Das MVP ist nicht die kleinste mögliche App — es ist die kleinstmögliche App, die einem Trainer täglich nützlich ist.

- **MVP 0A**: Ein einzelner Trainer kann sofort loslegen — ohne Verein, ohne Admin-Genehmigung
- **MVP 0B**: Vereine können sich registrieren und mehrere Teams verwalten
- **MVP 1**: Spieler, Eltern/Guardians, Anwesenheit, Spielberichte
- **MVP 2**: Eigenständige Teams können sich einem Verein anschließen

Jede Stufe ist für sich vollständig deploybar. Kein Schritt setzt den Abschluss des nächsten voraus.

---

## MVP 0A — Eigenständiges Team

*Ziel: Ein Trainer kann sich anmelden, ein eigenständiges Team anlegen, Eltern/Kinder per Link einladen und Termine erstellen.*

**Kernentscheidung:** Teams existieren ohne Verein. Der Trainer braucht keine Genehmigung und wartet nicht auf Vereinsverifikation.

### 1. Authentifizierung
- Registrierung per E-Mail + Passwort
- Login / Logout
- Passwort-Reset per E-Mail
- Serverseitige Session via Supabase SSR (Cookie-basiert)
- `src/proxy.ts` schützt alle geschützten Routen

### 2. Profil
- Profil wird automatisch bei Registrierung via DB-Trigger angelegt
- Bearbeitbar: Name, optional Telefon

### 3. Eigenständiges Team anlegen
- Trainer erstellt Team via `create_independent_team()` (SECURITY DEFINER)
- Felder: Teamname, Altersgruppe (optional), Geschlecht (optional)
- Trainer wird automatisch `team_owner` + `head_coach`
- Team ist sofort aktiv — kein Vereins-Kontext, kein Warten

### 4. Team-Einladungslink erstellen
- `team_owner` oder `head_coach` erstellt einen Einladungslink
- Einladungslink ist kryptografisch sicher (Token: 32 Byte), wiederverwendbar (bis max_uses), zeitlich begrenzt (Default: 30 Tage)
- Link-Format: `/join/[token]`
- Trainer teilt Link per WhatsApp, E-Mail, etc.

### 5. Elternteil/Kind Self-Service-Beitritt
- Elternteil öffnet Link → sieht Teamname
- Elternteil registriert sich oder loggt sich ein
- Elternteil gibt Kindsdaten ein: Vorname, Nachname, Geburtsjahr (optional: Position, Trikotnummer)
- `team_join_request` wird mit Status `pending` angelegt
- Kind ist NOCH NICHT im Team — keine Daten sichtbar für Trainer

**Warum zwingend MVP 0A:**
`team_join_requests` und `team_invitation_links` sind der Kern des Self-Service-Flows. Ohne diese beiden Tabellen ist der Flow "Trainer sendet Link → Eltern registrieren sich → Kind wird erstellt → Trainer nimmt an/lehnt ab" nicht umsetzbar. Dieser Flow ersetzt das manuelle Anlegen von Spielern und ist das differenzierende Feature für Amateurvereine.

### 6. Trainer verwaltet Beitrittsanfragen
- Trainer sieht offene Anfragen mit Kindsdaten (Vorname, Nachname, Geburtsjahr)
- Trainer nimmt an → `player` wird in `players`-Tabelle angelegt, `team_join_request.status = 'approved'`
- Trainer lehnt ab → `team_join_request.status = 'rejected'`, Kindsdaten nicht dauerhaft gespeichert

### 7. Termine und RSVP
- Trainer erstellt Termine: Training, Spiel, Sonstiges
- Felder: Titel, Typ, Datum + Uhrzeit, Ort, optionale Beschreibung
- `event_attendance`-Zeilen werden via Trigger für alle aktiven Spieler angelegt
- Eltern geben RSVP für ihr Kind ab
- Trainer sieht RSVP-Übersicht

### 8. Basis-Dashboard
- Übersicht nach Login: Meine Teams
- Wenn kein Team vorhanden: Prompt "Team erstellen" oder "Team beitreten"

---

## MVP 0A — Akzeptanzkriterium

Folgender Ablauf muss komplett funktionieren:

1. Trainer A registriert sich und legt Team "U10 SK Musterstadt" an
2. Trainer A ist automatisch `team_owner` + `head_coach`
3. Trainer A erstellt einen Team-Einladungslink (30 Tage, max. 50 Nutzungen)
4. Elternteil B öffnet Link, registriert sich, gibt Kindsdaten ein
5. Kind erscheint als "ausstehende Anfrage" bei Trainer A
6. Trainer A nimmt Anfrage an — Kind erscheint als aktiver Spieler im Team
7. Trainer A erstellt ein Training für nächste Woche
8. Elternteil B sagt für das Kind ab
9. Trainer A sieht die Absage in der RSVP-Übersicht

---

## MVP 0A — Routen

```
/                          → Redirect: /dashboard wenn eingeloggt, /login wenn nicht
/login                     → Login
/register                  → Registrierung
/auth/callback             → Supabase Auth Callback
/join/[token]              → Team-Einladungslink annehmen (Self-Service-Flow)

/(dashboard)/
  dashboard/               → Übersicht
  teams/new/               → Eigenständiges Team erstellen
  teams/[teamId]/          → Team-Übersicht (eigenständig)
  teams/[teamId]/join-requests/     → Beitrittsanfragen verwalten
  teams/[teamId]/invitation-links/  → Einladungslinks verwalten
  teams/[teamId]/events/
  teams/[teamId]/events/new/
  teams/[teamId]/events/[eventId]/
  profile/
```

---

## MVP 0A — Definition of Done

- [ ] Auth-Flow komplett (Register, Login, Logout, Reset, Auth-Callback)
- [ ] `create_independent_team()` SECURITY DEFINER implementiert
- [ ] Eigenständiges Team anlegen funktioniert
- [ ] Team-Einladungslink erstellen (kryptografischer Token, zeitlich begrenzt, multi-use)
- [ ] Self-Service-Beitritt via Link (Elternteil registriert sich, gibt Kindsdaten ein)
- [ ] Beitrittsanfragen: Trainer nimmt an/lehnt ab
- [ ] Spieler erscheint nach Akzeptanz im Team
- [ ] Kalender: Termine erstellen, bearbeiten, abbrechen
- [ ] RSVP: Eltern geben Zu-/Absage für Kind ab
- [ ] Basis-Dashboard mit Navigation
- [ ] Mobil-responsive Layout
- [ ] RLS auf allen MVP-0A-Tabellen
- [ ] `proxy.ts` schützt alle geschützten Routen

---

## MVP 0B — Verein erstellen

*Ziel: Vereinsverantwortliche können einen Verein registrieren, Teams zuordnen und Trainer einladen.*

### 1. Verein anlegen
- User erstellt Verein via `create_club()` (SECURITY DEFINER)
- Felder: Vereinsname, Slug, Stadt, Land
- Ersteller wird automatisch `club_admin`
- Verein startet mit `verification_status = 'pending_verification'`
- Verein ist intern sofort nutzbar — Verifizierung ist für öffentliche Sichtbarkeit und Affiliations-Flow

### 2. Vereinsverifikation (manuell MVP)
- Plattform-Admin setzt `verification_status = 'verified'` via Supabase Studio (MVP: kein UI)
- Verifizierung ist in MVP 0B kein Blocker für den internen Betrieb

### 3. Club-managed Teams anlegen
- `club_admin` legt Teams an (club_id gesetzt, ownership_type = 'club_managed')
- Felder: Name, Altersgruppe, Geschlecht, optional Saison

### 4. Trainer einladen (Vereinskontext)
- `club_admin` erstellt Einladungslink für `head_coach` (via `invitations`-Tabelle)
- Ablauf: 7 Tage, Single-Use
- Eingeladener registriert sich, bekommt `club_membership` + `team_membership` + `head_coach`-Rolle

### 5. Vereins-Dashboard
- Vereinsübersicht: Teams, Mitglieder
- Navigation zwischen Vereins- und Team-Kontext

---

## MVP 0B — Routen (zusätzlich zu MVP 0A)

```
/(dashboard)/
  clubs/new/                                         → Verein anlegen
  clubs/[clubId]/                                    → Vereinsübersicht
  clubs/[clubId]/teams/new/                          → Club-managed Team anlegen
  clubs/[clubId]/teams/[teamId]/                     → Team-Übersicht (club-managed)
  clubs/[clubId]/teams/[teamId]/events/              → (wie MVP 0A)
  clubs/[clubId]/invitations/                        → Einladungen verwalten
  /invite/[token]                                    → Vereinseinladung annehmen
```

---

## MVP 0B — Definition of Done

- [ ] `create_club()` SECURITY DEFINER mit Slug-Validierung
- [ ] Verein anlegen funktioniert (club_admin automatisch)
- [ ] Club-managed Team anlegen
- [ ] Einladungsflow für head_coach (kryptografischer Token, Single-Use)
- [ ] Vereins-Dashboard
- [ ] Vereinsmitgliederliste (club_admin)

---

## MVP 1 — Spieler und Eltern vollständig

*Ziel: Vollständige Spielerverwaltung, Guardian-Verknüpfung, Anwesenheitserfassung, Spielberichte.*

### 1. Vollständiges Spielerprofil
- Trainer legt Spieler manuell an (auch ohne Account)
- Felder: Vorname, Nachname, Geburtsjahr, Position, Trikotnummer
- Spieler wird via `player_team_assignments` einem Team zugeordnet

### 2. Guardian-Einladung und Verknüpfung
- Trainer erstellt Einladung vom Typ `player_guardian` mit eingebetteter `player_id`
- Guardian registriert sich → `player_guardians`-Eintrag mit `verified_at = now()`
- Guardian sieht Kalender des Kindes, kann RSVP abgeben

### 3. Anwesenheit erfassen
- `event_attendance`-Zeilen für alle Spieler via Trigger (bei Event-Erstellen)
- Trainer sieht alle Spieler inkl. jene ohne Account
- Trainer setzt `attended = true/false` via `player_id`
- Anwesenheitsquote pro Spieler

### 4. Mein Team
- Spieler: sieht Teamkollegen (Name, Position, Nummer)
- Trainer: sieht alle Spieler mit RSVP-Status und Anwesenheitsquote
- Guardian: sieht das Team seines Kindes

### 5. Einfacher Spielbericht
- Trainer schreibt Bericht nach einem Spiel
- Felder: Ergebnis, Zusammenfassung, interne Trainernotizen (`tactics_notes`)
- Veröffentlichen → Spieler und Eltern sehen `summary`, nie `tactics_notes`
- Kein Rich-Text-Editor — `<textarea>`

### 6. Rollenprüfung im UI
- UI-Elemente rollenbasiert ein-/ausgeblendet
- Alle Server Actions und Route Handlers prüfen Rollen serverseitig
- Spieler sieht keine Admin-Funktionen

---

## MVP 1 — Akzeptanzkriterium (aufbauend auf MVP 0A/0B)

1. Trainer legt 3 Spieler manuell an (ohne Account)
2. Trainer lädt 1 Elternteil ein, verknüpft mit Spieler 1
3. Elternteil sieht Kalender des Kindes, gibt Absage für Training
4. Trainer sieht Absage in der RSVP-Übersicht
5. Nach dem Training: Trainer erfasst Anwesenheit für alle 3 Spieler
6. Trainer legt ein Spiel an, trägt Ergebnis ein, schreibt Bericht
7. Trainer veröffentlicht Bericht
8. Eingeloggte Spieler sehen veröffentlichten Bericht, nicht die internen Notizen

---

## MVP 1 — Zusätzliche Routen

```
/(dashboard)/
  teams/[teamId]/players/
  teams/[teamId]/players/new/
  teams/[teamId]/players/[playerId]/
  teams/[teamId]/events/[eventId]/attendance/
  teams/[teamId]/matches/[matchId]/report/
```

---

## MVP 2 — Team-Affiliation

*Ziel: Eigenständige Teams können sich einem verifizierten Verein anschließen.*

### Ablauf
1. Verein (club_admin) sendet Anfrage an eigenständiges Team
2. `team_owner` nimmt an oder lehnt ab
3. Bei Akzeptanz: Plattform-Admin prüft optional (MVP: automatisch bei Verein verified)
4. Team: `club_id` gesetzt, `ownership_type = 'club_managed'`, `status = 'club_affiliated'`

**Invariante:** Zuordnung passiert NIEMALS automatisch. Explizite Bestätigung des team_owners ist Pflicht.

### Neue Tabelle
- `team_affiliation_requests`: team_id, club_id, status, requested_by, approved_by_team_owner, created_at

---

## Nicht ins MVP (Phase 2+)

| Feature | Begründung | Phase |
|---|---|---|
| Finanzen / Beitragsverwaltung | Eigene Komplexität, eigenes Modul | Phase 3 |
| Sponsorenmanagement | Separates Modul | Phase 4 |
| In-App-Chat / Messaging | Realtime-Infrastruktur | Phase 3 |
| KI-Funktionen | Phase 5+ | — |
| Saisonwechsel-Automatik | Phase 2 | — |
| Push-Benachrichtigungen | PWA-Phase | Phase 2 |
| Mehrsprachigkeit (i18n) | Phase 2 | — |
| E-Mail-Benachrichtigungen | Außer Auth-E-Mails | Phase 2 |
| Departments / Bereichsrollen | Für größere Vereine | Phase 2 |
| Aufstellungen / Taktik | Phase 3 | — |
| Export / Statistiken | Team Plus Feature | Phase 3 |
| Bild-Upload | Kein Avatar, kein Vereinslogo im MVP | Phase 2 |
| Offizieller ÖFB-Transfer | Externe Systeme | Phase 3+ |

---

## Tech-Entscheidungen für das MVP

- **Kein Rich-Text-Editor** — `<textarea>` für alle Textfelder
- **Kein Supabase Realtime** — kein Live-Update, kein Polling im MVP
- **Keine E-Mail-Benachrichtigungen** außer Supabase Auth-E-Mails
- **Kein Bild-Upload** — kein Avatar, kein Vereinslogo in MVP
- **Kein Onboarding-Wizard** — direkte UI ohne geführten Setup-Flow
- **Kein Dunkelmodus** — eine Theme-Variante reicht für MVP

---

## Migrations-Reihenfolge (Tabellen nach MVP-Stufe)

| Migration | Stufe | Tabellen |
|---|---|---|
| `001_init_mvp0_core` | Fundament | roles, permissions, role_permissions, profiles, clubs, seasons, club_memberships, club_member_roles, teams, team_memberships, team_member_roles |
| `002_mvp0a_team_flows` | MVP 0A | team_invitation_links, team_join_requests, players (minimal), events, event_attendance |
| `003_mvp0b_invitations` | MVP 0B | invitations |
| `004_mvp1_players_full` | MVP 1 | player_guardians, player_team_assignments, matches, match_reports, audit_logs |
| `005_mvp2_affiliation` | MVP 2 | team_affiliation_requests |
