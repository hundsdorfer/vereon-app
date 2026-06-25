# MVP Scope — Vereon

**Stand:** 2026-06-25 (überarbeitet: MVP in zwei Stufen aufgeteilt)
**Ziel:** Ein funktionierendes Grundsystem, das einem Trainer im Alltag hilft.

---

## MVP-Philosophie

Das MVP ist nicht die kleinste mögliche App — es ist die kleinstmögliche App, die einem Trainer täglich nützlich ist. Die Aufteilung in MVP 0 und MVP 1 stellt sicher, dass jede Stufe für sich vollständig und deploybar ist.

**MVP 0** liefert: Auth, Verein, Team, Trainer, Kalender, RSVP.
**MVP 1** liefert: Spielerverwaltung, Eltern/Guardian, Anwesenheit, Spielbericht.

---

## MVP 0 — Fundament

*Ziel: Ein Trainer kann sich anmelden, einen Verein anlegen, ein Team anlegen und Termine mit RSVP erstellen.*

### 1. Authentifizierung
- Registrierung per E-Mail + Passwort
- Login / Logout
- Passwort-Reset per E-Mail
- Serverseitige Session via Supabase SSR (Cookie-basiert)
- Middleware schützt alle App-Routen

### 2. Verein anlegen
- Erster User erstellt einen Verein via `create_club()`-Funktion (SECURITY DEFINER)
- Felder: Vereinsname, optionaler Slug
- Ersteller wird automatisch `club_admin`
- Keine manuelle Rollenzuweisung durch den Client

### 3. Profil
- Eigenes Profil anlegen und bearbeiten (Name, optional Telefon)
- Profil wird automatisch bei Registrierung via DB-Trigger angelegt

### 4. Team anlegen
- `club_admin` legt ein oder mehrere Teams an
- Felder: Name, Altersgruppe, Geschlecht
- Team ist sofort aktiv

### 5. Trainer einladen
- `club_admin` erstellt eine Einladung für einen `head_coach`
- Einladungslink mit kryptografisch sicherem Token (32 Bytes)
- Ablauf: 7 Tage, Single-Use
- Eingeladener registriert sich (oder loggt sich ein) und nimmt Einladung an
- Nach Annahme: `club_membership` + `team_membership` + `head_coach`-Rolle werden angelegt
- Einladungsstatus: `pending` → `accepted`

### 6. Basis-Dashboard
- Übersicht nach Login: Meine Vereine, meine Teams
- Wenn kein Verein vorhanden: Prompt "Verein anlegen"
- Wenn kein Team vorhanden: Prompt "Team anlegen"
- Navigation: Kalender, Mein Team (Platzhalter MVP 1)

### 7. Kalendertermine erstellen
- `head_coach` erstellt Termine: Training, Spiel, Sonstiges
- Felder: Titel, Typ, Datum + Uhrzeit, Ort, optionale Beschreibung
- Termin kann als abgesagt markiert werden

### 8. Einfache Zu-/Absagen (RSVP)
- **Achtung MVP 0:** RSVP ist nur für User mit Account möglich (Spieler als `player`-Rolle noch nicht im System)
- In MVP 0 können nur eingeladene Trainer RSVP abgeben — als Machbarkeitsnachweis des Flows
- Vollständiges RSVP (Spieler, Eltern) kommt in MVP 1

---

## MVP 0 — Akzeptanzkriterium

Folgender Ablauf muss komplett funktionieren:

1. User A registriert sich
2. User A legt Verein "FC Muster" und Team "Herren 1" an
3. User A ist automatisch `club_admin`
4. User A erstellt einen Einladungslink für `head_coach`
5. User B öffnet den Link, registriert sich, wird `head_coach` des Teams
6. User B erstellt ein Training für nächste Woche
7. User A und User B sehen den Termin im Kalender
8. User B kann für sich selbst zusagen

---

## MVP 0 — Routen

```
/                          → Redirect: /dashboard wenn eingeloggt, /login wenn nicht
/login                     → Login
/register                  → Registrierung
/auth/callback             → Supabase Auth Callback
/invite/[token]            → Einladungslink annehmen

/(dashboard)/
  dashboard/               → Übersicht
  clubs/new/               → Verein anlegen
  clubs/[clubId]/          → Vereinsübersicht
  clubs/[clubId]/teams/new/
  clubs/[clubId]/teams/[teamId]/
  clubs/[clubId]/teams/[teamId]/events/
  clubs/[clubId]/teams/[teamId]/events/new/
  clubs/[clubId]/teams/[teamId]/events/[eventId]/
  clubs/[clubId]/invitations/
  profile/
```

---

## MVP 1 — Spieler und Eltern

*Ziel: Spieler können angelegt, eingeladen und verwaltet werden. Eltern können RSVP abgeben. Anwesenheit wird erfasst. Spielberichte werden geschrieben.*

### 1. Spieler anlegen
- `head_coach` oder `club_admin` legt Spieler an (auch ohne Account)
- Felder: Name, Geburtsdatum, Position, Trikotnummer
- Spieler wird einem Team zugeordnet (`player_team_assignments`)
- Spieler ohne Account: erscheint in Anwesenheitslisten, kein RSVP möglich

### 2. Spieler einladen (Account verknüpfen)
- `head_coach` erstellt Einladungslink für einen bereits angelegten Spieler
- Spieler registriert sich und sein `players`-Datensatz wird mit `user_id` verknüpft
- Nach Verknüpfung: RSVP möglich

### 3. Guardian einladen und verknüpfen
- `head_coach` oder `team_manager` erstellt Einladung vom Typ `player_guardian`
- Einladung enthält `player_id` — welches Kind wird verknüpft?
- Elternteil registriert sich und erhält `player_guardians`-Eintrag mit `can_rsvp = true`
- Elternteil sieht Kalender des Kindes und kann RSVP abgeben

### 4. Anwesenheit erfassen
- `event_attendance`-Zeilen existieren für alle Spieler des Teams (via Trigger beim Event-Erstellen)
- Trainer sieht nach dem Termin eine Liste aller Spieler (inkl. ohne Account)
- Trainer setzt `attended = true/false` pro Spieler via `player_id`
- Anwesenheitshistorie: Trainer sieht Quote pro Spieler

### 5. Mein Team
- Spieler: sieht Teamkollegen (Name, Position, Nummer)
- Trainer: sieht alle Spieler mit RSVP-Status und Anwesenheitsquote
- Guardian: sieht das Team seines Kindes

### 6. Einfacher Spielbericht
- Trainer schreibt nach einem Spiel einen Bericht
- Felder: Ergebnis (Heim/Auswärts, Gegner), Zusammenfassung, interne Trainernotizen
- Bericht veröffentlichen → Spieler und Eltern sehen `summary`, nie `tactics_notes`
- Kein Rich-Text-Editor — einfaches `<textarea>`

### 7. Rollenprüfung im UI
- UI-Elemente werden rollenbasiert ein-/ausgeblendet
- Rollenprüfung im Server: jede Server Action und Route Handler prüft Rollen
- Spieler sieht keine Admin-Funktionen
- Guardian sieht nur das Team seines Kindes

---

## MVP 1 — Akzeptanzkriterium

Folgender Ablauf muss komplett funktionieren (aufbauend auf MVP 0):

1. Trainer legt 3 Spieler an (ohne Account)
2. Trainer lädt 2 Spieler per Link ein — sie registrieren sich
3. Trainer lädt 1 Elternteil ein, verknüpft mit Spieler 1
4. Elternteil sieht Kalender des Kindes, gibt Absage für Training
5. Trainer sieht Absage in der RSVP-Übersicht
6. Nach dem Training: Trainer erfasst Anwesenheit für alle 3 Spieler
7. Trainer legt ein Spiel an, trägt Ergebnis ein, schreibt Bericht
8. Trainer veröffentlicht Bericht
9. Eingeloggte Spieler sehen veröffentlichten Bericht, nicht die internen Notizen

---

## MVP 1 — Zusätzliche Routen

```
/(dashboard)/
  clubs/[clubId]/teams/[teamId]/players/
  clubs/[clubId]/teams/[teamId]/players/new/
  clubs/[clubId]/teams/[teamId]/players/[playerId]/
  clubs/[clubId]/teams/[teamId]/events/[eventId]/attendance/
  clubs/[clubId]/teams/[teamId]/matches/[matchId]/report/
```

---

## Nicht ins MVP (Phase 2+)

| Feature | Begründung | Phase |
|---|---|---|
| Finanzen / Beitragsverwaltung | Eigene Komplexität, eigenes Modul | Phase 3 |
| Sponsorenmanagement | Separates Modul | Phase 4 |
| In-App-Chat / Messaging | Realtime-Infrastruktur | Phase 3 |
| KI-Funktionen | Phase 5+ | — |
| Shop / Merchandise | Separates Produkt | — |
| Inventar / Zeugwart-Modul | Separates Modul | Phase 4 |
| Kantine / Kantinenmodul | Separates Modul | Phase 4 |
| Social Media / Medienmodul | Separates Modul | Phase 4 |
| Komplexe Statistiken | Phase 3 | — |
| Transferhistorie | `player_transfers`-Tabelle | Phase 2 |
| Vollständige Saisonwechsel-Automatik | Phase 2 | — |
| Push-Benachrichtigungen | PWA-Phase | Phase 2 |
| Mehrsprachigkeit (i18n) | Phase 2 | — |
| E-Mail-Benachrichtigungen | Außer Auth-E-Mails | Phase 2 |
| Departments / Bereichsrollen | Für größere Vereine | Phase 2 |
| Aufstellungen / Taktik | Phase 3 | — |

---

## Tech-Entscheidungen für das MVP

- **Kein Rich-Text-Editor** — `<textarea>` für alle Textfelder
- **Kein Supabase Realtime** — kein Live-Update, kein Polling
- **Keine E-Mail-Benachrichtigungen** außer Supabase Auth-E-Mails
- **Kein Bild-Upload** — kein Avatar, kein Vereinslogo in MVP
- **Kein Onboarding-Wizard** — direkte UI ohne geführten Setup-Flow
- **Kein Dunkelmodus** — eine Theme-Variante reicht für MVP

---

## Definition of Done (MVP 0)

- [ ] Auth-Flow komplett (Register, Login, Logout, Reset, Auth-Callback)
- [ ] `create_club()`-Funktion in Supabase implementiert
- [ ] Verein anlegen funktioniert
- [ ] Team anlegen funktioniert
- [ ] Einladungsflow für `head_coach` funktioniert (kryptografischer Token, Single-Use)
- [ ] Kalender: Termine erstellen, bearbeiten, abbrechen
- [ ] RSVP: Zu-/Absage für eingeloggte User
- [ ] Basis-Dashboard mit Navigation
- [ ] Mobil-responsive Layout
- [ ] RLS auf allen MVP-0-Tabellen
- [ ] Middleware schützt alle geschützten Routen
- [ ] Deployment auf Vercel funktioniert

## Definition of Done (MVP 1)

- [ ] Spieler anlegen (mit und ohne Account)
- [ ] Spieler via Einladungslink verknüpfen
- [ ] Guardian-Einladung mit `player_id`-Verknüpfung
- [ ] RSVP für Spieler und Guardians
- [ ] Anwesenheit erfassen via `player_id`
- [ ] Mein Team: Spielerübersicht
- [ ] Spielbericht: erstellen und veröffentlichen
- [ ] Rollenprüfung im Server (Server Actions, Route Handlers)
- [ ] Rollenbasierte UI-Anzeige
