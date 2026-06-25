# MVP Scope — Vereon

**Stand:** 2026-06-25
**Ziel:** Ein funktionierender Kern, der einen echten Verein mit einem echten Team im Alltag begleiten kann.

---

## MVP-Philosophie

Das MVP ist nicht die kleinste mögliche App — es ist die kleinstmögliche App, die einem Trainer täglich nützlich ist. Ein Trainer muss damit seinen Alltag abbilden können: Termine planen, Zu-/Absagen einsammeln, Anwesenheit erfassen, Spielberichte schreiben.

---

## Im MVP enthalten

### 1. Authentifizierung
- Registrierung per E-Mail + Passwort
- Login / Logout
- Passwort-Reset per E-Mail
- Serverseitige Session (Supabase SSR)
- Middleware schützt alle App-Routen

### 2. Verein anlegen
- Erster User erstellt einen Verein
- Gibt Vereinsname und optionale Basisdaten an
- Wird automatisch `club_admin`
- Verein erhält einen eindeutigen Slug

### 3. Team anlegen
- `club_admin` legt ein oder mehrere Teams an
- Name, Altersgruppe, Saison
- Team ist sofort aktiv

### 4. Mitglieder einladen
- Einladungslinks/Codes für neue Mitglieder
- Einladungen laufen nach konfigurierbarer Zeit ab
- Einladung enthält Rolle und Team
- Drei Flows:
  - **Trainer einladen:** `club_admin` lädt `head_coach` ein
  - **Spieler einladen:** `head_coach` lädt `player` ein (mit Teamzuordnung)
  - **Elternteil einladen:** `head_coach` lädt `guardian` ein, verknüpft mit Spieler

### 5. Kalendertermine erstellen
- `head_coach` erstellt Termine: Training, Spiel, Sonstiges
- Felder: Titel, Typ, Datum + Uhrzeit, Ort, Beschreibung
- Termin kann als abgesagt markiert werden
- Termine sind nur für Teammitglieder sichtbar

### 6. Zu-/Absagen (RSVP)
- Spieler und Eltern sehen ihre Termine
- Können zusagen, absagen oder mit Kommentar absagen
- Trainer sieht alle Rückmeldungen in einer Übersicht
- Reminder-E-Mail (optional im MVP, nice-to-have)

### 7. Anwesenheit erfassen
- Nach einem Termin trägt der Trainer ein, wer tatsächlich da war
- Ansicht: Teilnehmerliste mit Checkbox
- Anwesenheitshistorie ist pro Spieler einsehbar (für Trainer)

### 8. Mein Team
- Spieler sieht: seine Teamkollegen (Name, Position, Nummer)
- Trainer sieht: alle Spieler mit Status, Positionen, Nummern
- Keine komplexen Statistiken — nur die Übersicht

### 9. Einfacher Spielbericht
- Trainer schreibt nach einem Spiel einen Bericht
- Felder: Ergebnis (Heim/Auswärts, Gegner), Zusammenfassung, interne Notizen
- Bericht kann als "veröffentlicht" markiert werden
- Spieler sehen nur veröffentlichte Berichte

---

## Nicht im MVP

| Feature | Begründung |
|---|---|
| Finanzen / Beitragsverwaltung | Eigene Komplexität, Phase 2 |
| Sponsorenmanagement | Phase 3 |
| In-App-Chat / Messaging | Eigene Infrastruktur (Realtime), Phase 2 |
| KI-Funktionen | Phase 4+ |
| Shop / Merchandise | Phase 4+ |
| Komplexe Statistiken (Tore, Pässe, etc.) | Phase 3 |
| Push-Benachrichtigungen | PWA-Phase (Phase 2) |
| Öffentliche Vereinswebsite | Separates Produkt |
| Mehrsprachigkeit (i18n) | Phase 2 |
| Dunkelmodus | Nice-to-have, Phase 2 |
| Spielerfotos / Medien | Phase 2 |
| Taktik-Board | Phase 3 |
| Video-Analyse | Phase 4+ |

---

## Akzeptanzkriterien MVP

Das MVP gilt als erfüllt, wenn folgender Ablauf vollständig funktioniert:

1. Ein neuer User registriert sich
2. Er legt einen Verein und ein Team an
3. Er lädt über einen Link einen Trainer ein
4. Der Trainer lädt über einen Link 3 Spieler ein
5. Der Trainer legt ein Training für nächste Woche an
6. Die Spieler geben Zu-/Absagen
7. Nach dem Training trägt der Trainer die Anwesenheit ein
8. Der Trainer legt ein Spiel an, trägt das Ergebnis ein und schreibt einen Bericht
9. Die Spieler sehen den veröffentlichten Bericht

---

## MVP Routen (App Router)

```
/                          → Landing / Redirect je nach Auth-Status
/login                     → Login
/register                  → Registrierung
/invite/[token]            → Einladungslink annehmen

/(dashboard)               → Geschützter Bereich (Middleware)
  /dashboard               → Übersicht / Home
  /clubs/new               → Verein anlegen
  /clubs/[clubId]          → Vereinsübersicht
  /clubs/[clubId]/teams/new
  /clubs/[clubId]/teams/[teamId]         → Mein Team
  /clubs/[clubId]/teams/[teamId]/events  → Kalender
  /clubs/[clubId]/teams/[teamId]/events/new
  /clubs/[clubId]/teams/[teamId]/events/[eventId]
  /clubs/[clubId]/teams/[teamId]/matches/[matchId]/report
  /clubs/[clubId]/invitations            → Einladungen verwalten
  /profile                               → Eigenes Profil
```

---

## MVP Tech-Entscheidungen

- **Kein Rich-Text-Editor** für Spielberichte — simples `<textarea>`, kein Markdown
- **Keine Echtzeit-Updates** im MVP — kein Supabase Realtime, kein Polling
- **Keine E-Mail-Benachrichtigungen** im MVP v1 (außer Supabase Auth-E-Mails)
- **Keine Bildupload** — kein Avatar, kein Logo im MVP v1
- **Kein Onboarding-Wizard** — direkt in die App

---

## Definition of Done (MVP)

- [ ] Auth-Flow komplett (Register, Login, Logout, Reset)
- [ ] Verein anlegen funktioniert
- [ ] Team anlegen funktioniert
- [ ] Einladungsflow für alle Rollen funktioniert
- [ ] Kalender: CRUD für Termine
- [ ] RSVP: Zu-/Absagen setzen und anzeigen
- [ ] Anwesenheit: Erfassen und anzeigen
- [ ] Mein Team: Spielerliste
- [ ] Spielbericht: Erstellen und veröffentlichen
- [ ] RLS auf allen Tabellen
- [ ] Middleware schützt alle geschützten Routen
- [ ] Mobil-responsive Layout
- [ ] Deployment auf Vercel funktioniert
