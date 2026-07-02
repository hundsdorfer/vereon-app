# MVP-Testcheckliste — Vereon

**Stand:** 2026-07-01
**Zweck:** Manueller Qualitätscheck des MVP-Kernflows vor Releases und nach größeren Änderungen.

> **Wichtig:** Alle Tests laufen auf der lokalen Supabase-Instanz (`npx supabase start`).
> Keine Produktivdaten. Keine Remote-Datenbank. Kein `db push`.

---

## Testrollen

Für den vollständigen Kernflow werden drei separate Test-Accounts benötigt:

| Rolle | Beschreibung |
|---|---|
| **Trainer** | Registriert sich, erstellt Team, verwaltet Anfragen |
| **Spieler (erwachsen)** | Registriert sich, tritt selbst bei |
| **Elternteil / Guardian** | Registriert sich, meldet Kind an |

---

## Kernflow — Schritt für Schritt

### 1. Trainer registrieren

- [ ] `/register` aufrufen
- [ ] Alle Pflichtfelder ausfüllen: Vorname, Nachname, E-Mail, Geburtsdatum, Telefon, Rolle, Passwort
- [ ] Passwort-Anforderungen prüfen: mind. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen
- [ ] Nutzungsbedingungen und Datenschutzerklärung akzeptieren (beide Checkboxen)
- [ ] Nach Registrierung: Redirect zu `/dashboard` (lokal ohne E-Mail-Bestätigung)
- [ ] `profiles`-Eintrag in DB vorhanden (Supabase Studio → Table Editor → profiles)

### 2. Team erstellen

- [ ] „Team erstellen" aufrufen (`/teams/new`)
- [ ] Teamname eingeben, optional Altersgruppe und Geschlecht setzen
- [ ] Nach Erstellung: Redirect zu `/teams/[teamId]`
- [ ] Team erscheint in `/teams`
- [ ] DB: `teams`-Eintrag mit `ownership_type = 'independent'`, `status = 'active'`
- [ ] DB: `team_memberships`-Eintrag für den Trainer
- [ ] DB: `team_member_roles` mit `team_owner` und `head_coach`

### 3. Einladungscode, Link und QR-Code prüfen

- [ ] Auf der Team-Detailseite: CTA „Spieler & Eltern einladen" vorhanden
- [ ] `/teams/[teamId]/invite` aufrufen
- [ ] Einladungscode wird angezeigt (Format: 8-stellig, Großbuchstaben/Zahlen)
- [ ] „Code kopieren" kopiert den Code in die Zwischenablage
- [ ] Join-Link wird angezeigt: `http://localhost:3000/join/[code]`
- [ ] „Link kopieren" kopiert den vollständigen Link
- [ ] QR-Code wird gerendert (schwarz auf weißem Hintergrund, auch im Dark Mode)
- [ ] DB: `team_invitation_links`-Eintrag mit `revoked_at = NULL`

### 4. Join-Link ausgeloggt öffnen

- [ ] Ausloggen
- [ ] `/join/[code]` im Browser öffnen
- [ ] Teamname und Beitrittsmöglichkeit werden angezeigt
- [ ] Keine Fehlermeldung, kein 404

### 5. Login/Register-Redirect prüfen

- [ ] Auf der Join-Seite: Login-Link anklicken → landet auf `/login?redirect=/join/[code]`
- [ ] Auf der Login-Seite: „Registrieren"-Link anklicken → landet auf `/register?redirect=/join/[code]` (Redirect bleibt erhalten)
- [ ] Auf der Register-Seite: „Anmelden"-Link anklicken → landet auf `/login?redirect=/join/[code]` (Redirect bleibt erhalten)

### 6. Selbstbeitritt testen (Spieler-Account)

- [ ] Mit Spieler-Account registrieren oder einloggen
- [ ] Nach Login: automatischer Redirect zurück zu `/join/[code]`
- [ ] Option „Ich trete selbst bei" auswählen
- [ ] Profildaten werden read-only angezeigt (kein Name-Spoofing möglich)
- [ ] Beitrittsanfrage absenden
- [ ] Bestätigungsmeldung erscheint
- [ ] DB: `team_join_requests` mit `status = 'pending'`, `request_type = 'self'`, `player_id` gesetzt

### 7. Kind anmelden testen (Guardian-Account)

- [ ] Mit Elternteil-Account registrieren oder einloggen
- [ ] Nach Login: automatischer Redirect zurück zu `/join/[code]`
- [ ] Option „Ich melde mein Kind an" auswählen
- [ ] Kindsdaten eingeben: Vorname, Nachname, Geburtsdatum (Pflichtfelder)
- [ ] Anfrage absenden
- [ ] Bestätigungsmeldung erscheint
- [ ] DB: `team_join_requests` mit `status = 'pending'`, `request_type = 'guardian'`, `player_id` gesetzt
- [ ] DB: `players`-Eintrag mit Kindsdaten, `user_id = NULL`

### 8. Trainer sieht offene Anfragen

- [ ] Mit Trainer-Account einloggen
- [ ] Team-Detailseite: Badge „X offen" bei Beitrittsanfragen sichtbar (falls Anfragen vorhanden)
- [ ] CTA „Anfragen ansehen" führt zu `/teams/[teamId]/requests`
- [ ] Beide Anfragen (Self + Guardian) erscheinen in der Liste
- [ ] Name und Beitrittstyp erkennbar

### 9. Anfrage annehmen

- [ ] Auf `/teams/[teamId]/requests`: „Annehmen" für die Self-Player-Anfrage klicken
- [ ] Anfrage verschwindet aus der Liste (oder Status wechselt)
- [ ] DB: `team_join_requests.status = 'approved'`
- [ ] DB: `player_team_assignments`-Eintrag vorhanden (`status = 'active'`)

### 10. Anfrage ablehnen

- [ ] Auf `/teams/[teamId]/requests`: „Ablehnen" für die Guardian-Anfrage klicken
- [ ] Anfrage verschwindet aus der Liste
- [ ] DB: `team_join_requests.status = 'rejected'`
- [ ] DB: Kein `player_team_assignments`-Eintrag für diesen Spieler

### 11. Angenommener Spieler erscheint im Team

- [ ] Team-Detailseite aufrufen
- [ ] Spielerbereich zeigt „1 Spieler"
- [ ] Name des angenommenen Spielers in der Liste sichtbar
- [ ] Geburtsdatum oder Jahrgang korrekt formatiert
- [ ] Beitrittsart korrekt: „Selbst beigetreten" oder „Über Erziehungsberechtigte/n angemeldet"
- [ ] Abgelehnter Spieler erscheint **nicht** in der Liste

---

## Fehlerfälle

### Ungültiger Code

- [ ] `/join/UNGUELTIG` aufrufen → sinnvolle Fehlermeldung (kein 500, kein leerer Screen)
- [ ] `/join/` ohne Code → 404 oder Redirect

### Abgelaufener/deaktivierter Code

> Lokal testbar durch direktes Setzen in Supabase Studio: `team_invitation_links.revoked_at = now()`

- [ ] `revoked_at` manuell setzen, Link erneut öffnen → Fehlermeldung „Link ungültig oder abgelaufen"

### Doppelte Anfrage

- [ ] Mit demselben Spieler-Account nochmals dieselbe Join-URL öffnen
- [ ] Erwartet: Hinweis, dass bereits eine Anfrage existiert — oder Anfrage wird nicht doppelt erstellt
- [ ] DB: Nur ein `team_join_requests`-Eintrag mit `status = 'pending'` für diese Kombination

### Ablehnen einer Anfrage (bereits oben in Schritt 10)

- [ ] Kein `player_team_assignments`-Eintrag nach Ablehnung
- [ ] Abgelehnter Spieler nicht in Teamliste sichtbar

### Unvollständiges Profil beim Selbstbeitritt

- [ ] Trainer-Account hat vollständiges Profil (durch Registrierung sichergestellt)
- [ ] Join als Spieler mit fehlendem Profilnamen: prüfen, ob Fehlermeldung kommt oder Profildaten korrekt geladen werden

---

## Lokale DB-Prüfqueries (Supabase Studio)

Supabase Studio läuft lokal unter `http://127.0.0.1:54323` → SQL Editor.

```sql
-- Alle Teams prüfen
SELECT id, name, ownership_type, status, created_at FROM public.teams;

-- Trainer-Rollen prüfen
SELECT u.email, r.key AS role
FROM auth.users u
JOIN public.team_memberships tm ON tm.user_id = u.id
JOIN public.team_member_roles tmr ON tmr.team_membership_id = tm.id
JOIN public.roles r ON r.id = tmr.role_id;

-- Aktive Einladungslinks
SELECT id, team_id, created_at, revoked_at
FROM public.team_invitation_links
WHERE revoked_at IS NULL
ORDER BY created_at DESC;

-- Offene Join-Anfragen
SELECT id, team_id, request_type, status, created_at
FROM public.team_join_requests
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Alle Spieler
SELECT id, first_name, last_name, birth_year, date_of_birth, user_id
FROM public.players
ORDER BY created_at DESC;

-- Aktive Spielerzuordnungen
SELECT pta.id, pta.team_id, pta.player_id, pta.status, pta.joined_at,
       p.first_name, p.last_name
FROM public.player_team_assignments pta
JOIN public.players p ON p.id = pta.player_id
WHERE pta.status = 'active';
```

---

## DSGVO- und Sichtbarkeitschecks

### Wann sieht der Trainer Kindesdaten?

- [ ] Solange `team_join_requests.status = 'pending'`: Trainer sieht Name und Anfragedaten in `/teams/[teamId]/requests`
- [ ] Nach Annehmen (`status = 'approved'`): Spieler erscheint in der Team-Liste
- [ ] Nach Ablehnen (`status = 'rejected'`): Keine Daten im UI sichtbar, kein `player_team_assignments`-Eintrag

### Wann wird ein Spieler in der Team-Liste sichtbar?

- [ ] Erst nach `approve_join_request` → `player_team_assignments.status = 'active'`
- [ ] Pending-Anfragen erscheinen **nicht** in der Spielerliste auf der Team-Detailseite

### Self-Player vs. Guardian-Child

- [ ] Self-Player: `players.user_id` gesetzt → Label „Selbst beigetreten"
- [ ] Guardian-Child: `players.user_id = NULL` → Label „Über Erziehungsberechtigte/n angemeldet"
- [ ] Guardian-Child: Geburtsdatum aus `players.date_of_birth` (Pflichtfeld beim Guardian-Flow)

### Kein Name-Spoofing beim Selbstbeitritt

- [ ] Profildaten (Vorname, Nachname) werden aus `profiles` gelesen, nicht aus dem Formular übernommen
- [ ] User kann keinen anderen Namen für sich selbst angeben

---

## Abschlusskriterien

Der MVP-Kernflow gilt als bestanden, wenn:

- [ ] Alle 11 Kernflow-Schritte ohne Fehler durchlaufen
- [ ] Alle Fehlerfälle zeigen sinnvolle Fehlermeldungen (kein 500, kein weißer Screen)
- [ ] DB-Prüfqueries bestätigen korrekten Datenbankzustand
- [ ] DSGVO-Checks: Kindesdaten erst nach Trainer-Akzeptanz im Team sichtbar
- [ ] `npm run lint` — keine Fehler
- [ ] `npm run build` — kein Fehler

---

## Retest-Protokoll

### Retest P.1 nach Phase P.2A — 2026-07-01

Manueller Retest des Kernflows nach Umsetzung der 9 P.2A-Fixes. Alle Punkte bestanden.

| Bereich | Ergebnis |
|---------|----------|
| Registrierung ohne Telefonnummer | ✓ funktioniert, kein Fehler |
| Team-Erstellung → Redirect zu `/teams/[teamId]` | ✓ direkter Redirect zur Detailseite |
| Training erstellen: Datum + Uhrzeit getrennt | ✓ zwei Felder, Wiener Zeit korrekt |
| Training erstellen → Redirect zu Detailseite | ✓ landet direkt auf `/teams/[teamId]/events/[eventId]` |
| Join-Erfolgsscreen: „Zurück zum Dashboard"-Link | ✓ vorhanden nach Self-Player und Guardian-Flow |
| Dashboard Spieler: wartende Beitrittsanfrage | ✓ zeigt Typ (self/guardian), Teamname, Hinweistext |
| Dashboard Trainer: Beitrittsanfragen mit Teamname | ✓ gruppiert nach Team, Direktlink zu `/teams/[teamId]/requests` |
| iOS Auto-Zoom (Inputs, DevTools-Emulator) | ✓ kein Auto-Zoom bei Input-Focus |
| RootLayout Script-Warnung | ✓ behoben via `next/script beforeInteractive` |
| `npm run lint` | ✓ keine Fehler |
| `npm run build` | ✓ erfolgreich, 18 Routen |

**Phase M abgeschlossen** — 5/5 E2E-Tests lokal und in GitHub Actions grün.

---

### Playwright E2E-Automatisierung — 2026-07-01

Kernflow automatisiert mit Playwright. Alle Tests laufen lokal gegen die lokale Supabase-Instanz.

```
npm run test:e2e
```

Supabase (`npx supabase start`) und Dev-Server (`npm run dev`) müssen laufen.

GitHub Actions: `.github/workflows/e2e.yml` — manuell via `workflow_dispatch` auslösbar (M.4). `ci.yml` bleibt für Lint + Build zuständig.

| Test-Datei | Inhalt | Ergebnis |
|------------|--------|----------|
| `tests/e2e/smoke.spec.ts` | Login-Seite, Register-Seite, Root-Redirect | 3/3 ✓ |
| `tests/e2e/core-flow-self-player.spec.ts` | Trainer → Team → Invite → Self-Player Join → Annahme → Training → RSVP → Trainer sieht „Kommt" | 1/1 ✓ |
| `tests/e2e/core-flow-guardian.spec.ts` | Trainer → Team → Invite → Guardian → Kind anmelden → Annahme → Training → RSVP fürs Kind → Trainer sieht Kind unter „Kommt" | 1/1 ✓ |

**Gesamt: 5/5 grün**

---

### Phase PWA.1 — Basis-PWA-Metadaten / Installierbarkeit vorbereitet — 2026-07-02

| Prüfpunkt | Ergebnis |
|-----------|----------|
| `/manifest.webmanifest` wird im Next.js-Build erzeugt | ✓ |
| `public/icon-192.png` vorhanden | ✓ |
| `public/icon-512.png` vorhanden | ✓ |
| `public/apple-touch-icon.png` vorhanden | ✓ |
| `metadata.icons` ergänzt | ✓ |
| `metadata.appleWebApp` ergänzt | ✓ |
| `viewport.themeColor` gesetzt | ✓ |
| `npm run lint` | ✓ keine Fehler |
| `npm run build` | ✓ erfolgreich |
| Service Worker | nicht vorhanden (bewusst) |
| Offline-Modus | nicht vorhanden (bewusst) |
| Push Notifications | nicht vorhanden (bewusst) |

**Nicht durchgeführt:** praktischer Install-Test auf iOS/Android, Lighthouse-PWA-Audit. Beides bleibt offen und wird nicht als erledigt markiert.
