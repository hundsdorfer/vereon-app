# User Flows — Vereon

**Stand:** 2026-06-25
**Zweck:** Beschreibt die wichtigsten Nutzerflüsse für MVP 0A, 0B, 1 und 2. Dient als Referenz für Entwicklung und Produktentscheidungen.

---

## MVP 0A — Eigenständiges Team

### Flow 1: Trainer erstellt eigenständiges Team

```
1. Trainer öffnet Vereon
2. Trainer registriert sich (E-Mail + Passwort)
3. Profil wird automatisch via Trigger angelegt
4. Trainer wird zu "Team erstellen" geleitet
5. Trainer gibt Teamname ein (z.B. "U10 SK Musterstadt")
6. Optional: Altersgruppe, Geschlecht
7. → create_independent_team() SECURITY DEFINER:
     - Team wird angelegt (club_id = NULL, ownership_type = 'independent')
     - Trainer bekommt team_membership
     - Trainer bekommt Rolle team_owner
     - Trainer bekommt Rolle head_coach (Default)
8. Trainer landet auf Team-Dashboard
```

**Ergebnis:** Funktionierendes Team, Trainer hat volle Kontrolle, kein Verein nötig.

---

### Flow 2: Trainer erstellt Team-Einladungslink für Eltern/Kinder

```
1. Trainer öffnet Team → "Mitglieder" → "Einladen"
2. Trainer erstellt Team-Einladungslink
   → team_invitation_links:
     - team_id
     - created_by = auth.uid()
     - token (32 Byte kryptografisch zufällig)
     - expires_at (z.B. 30 Tage, konfigurierbar)
     - max_uses (z.B. 50 für eine Gruppe)
3. Trainer kopiert Link oder teilt ihn (WhatsApp, E-Mail, etc.)
4. Link sieht aus wie: vereon.app/join/[token]
```

**Wichtig:** Der Link erzeugt noch keine Mitgliedschaft. Er öffnet nur den Beitrittsprozess.

---

### Flow 3: Elternteil tritt über Einladungslink bei (Self-Service)

```
1. Elternteil öffnet vereon.app/join/[token]
2. Link wird validiert (aktiv, nicht abgelaufen, max_uses nicht erreicht)
3. Elternteil sieht: "Du wurdest eingeladen, dem Team [Teamname] beizutreten"
4. Elternteil registriert sich oder loggt sich ein
5. Elternteil landet auf "Kind hinzufügen"
6. Elternteil gibt Kindsdaten ein:
   - Vorname, Nachname (Pflicht)
   - Geburtsjahr (Pflicht, für Altersklasse)
   - Position (optional)
   - Trikotnummer (optional)
7. → Beitrittsanfrage wird erstellt:
   → team_join_requests:
     - team_id
     - guardian_user_id = auth.uid()
     - player info (eingebettet oder in players-Datensatz)
     - status = 'pending'
     - via_invitation_link_id = id des verwendeten Links
8. Elternteil sieht: "Deine Anfrage wurde gesendet. Der Trainer wird sie bestätigen."
9. Kind ist NOCH NICHT im Team. Daten sind NOCH NICHT für Trainer sichtbar.
```

**DSGVO-Hinweis:** Kindsdaten sind erst nach Akzeptanz durch den Trainer für das Team zugänglich.

---

### Flow 4: Trainer nimmt Beitrittsanfragen an oder lehnt ab

```
1. Trainer sieht Benachrichtigung: "3 neue Beitrittsanfragen"
2. Trainer öffnet "Beitrittsanfragen"
3. Für jede Anfrage: Name, Geburtsjahr, optional Position
4. Trainer klickt "Annehmen" oder "Ablehnen"
5. Bei Annehmen:
   → player wird in players-Tabelle angelegt (falls noch nicht vorhanden)
   → player_team_assignment wird erstellt (team_id, player_id)
   → team_join_request.status = 'approved'
   → Elternteil wird benachrichtigt
6. Bei Ablehnen:
   → team_join_request.status = 'rejected'
   → Elternteil wird benachrichtigt (optional)
   → Kindsdaten werden NICHT gespeichert / werden gelöscht
```

---

### Flow 5: Trainer erstellt Termin und sieht RSVP

```
1. Trainer öffnet Kalender → "Termin erstellen"
2. Felder: Titel, Typ (Training/Spiel/Sonstiges), Datum, Uhrzeit, Ort
3. Termin wird gespeichert
4. event_attendance-Zeilen werden via Trigger für alle aktiven Spieler angelegt
5. Teammitglieder mit Account sehen den Termin in ihrem Kalender
6. Eltern sehen Termin und können für ihr Kind zu-/absagen
7. Trainer sieht RSVP-Liste
```

---

## MVP 0B — Verein erstellen / beanspruchen

### Flow 6: Vereinsverantwortlicher erstellt offiziellen Verein

```
1. User (Obmann, Jugendleiter, Vereinsadmin) registriert sich
2. User öffnet "Verein erstellen"
3. Felder: Vereinsname, Slug, Stadt, Land
4. → create_club() SECURITY DEFINER:
   - Club wird angelegt (verification_status = 'pending_verification')
   - User bekommt club_membership
   - User bekommt Rolle club_admin
5. User sieht: "Dein Verein wurde erstellt und wartet auf Verifizierung durch Vereon."
6. Verein ist funktionsfähig (interne Nutzung), aber nicht offiziell "verifiziert"
7. Plattform-Admin überprüft und setzt verification_status = 'verified' (manuell via Supabase Studio)
```

---

### Flow 7: Vereinsverantwortlicher legt club-managed Team an

```
1. Eingeloggter club_admin öffnet Vereinsdashboard → "Teams" → "Team anlegen"
2. Felder: Teamname, Altersgruppe, Geschlecht, optional Saison
3. → club_admin INSERT auf teams (club_id gesetzt, ownership_type = 'club_managed')
4. Team ist sofort aktiv
5. club_admin kann head_coach einladen
```

---

### Flow 8: club_admin lädt head_coach ein

```
1. club_admin öffnet Team → "Trainer einladen"
2. Einladungslink wird erstellt (via invitations-Tabelle)
   - Token: 32 Byte kryptografisch zufällig
   - Ablauf: 7 Tage
   - Zielrolle: head_coach
3. Link wird geteilt
4. Eingeladener öffnet Link, registriert sich oder loggt sich ein
5. Server Action:
   - Einladungstoken validieren (aktiv, nicht abgelaufen, nicht eingelöst)
   - team_membership anlegen
   - head_coach-Rolle vergeben
   - invitation.status = 'accepted', used_at = now()
6. Trainer landet auf Team-Dashboard
```

---

## MVP 1 — Spieler und Guardians vollständig

### Flow 9: Guardian-Verknüpfung mit Spieler

```
1. Trainer erstellt Einladung für Guardian eines bestimmten Spielers
   - Einladungslink enthält player_id
2. Guardian öffnet Link, registriert sich oder loggt sich ein
3. Server Action:
   - Einladung validieren
   - player_guardians-Eintrag erstellen:
     guardian_user_id, player_id, relationship, verified_at = now()
4. Guardian sieht nun den Kalender des Kindes
5. Guardian kann RSVP für Kind abgeben
```

---

### Flow 10: Anwesenheit erfassen

```
1. Termin ist vergangen
2. Trainer öffnet Termin → "Anwesenheit erfassen"
3. Liste aller zugeordneten Spieler (via player_team_assignments)
4. Trainer setzt attended = true/false pro Spieler (via player_id)
5. Auch Spieler ohne Account erscheinen in der Liste
```

---

## MVP 2 — Vereins-Team-Affiliation

### Flow 11: Verein beantragt Zuordnung eines eigenständigen Teams

```
1. Verifizierter Verein (club_admin) öffnet "Teams zuordnen"
2. Suche nach eigenständigem Team (z.B. "U10 SK Musterstadt")
3. Verein sendet Anfrage:
   → team_affiliation_requests:
     team_id, club_id, status = 'pending', requested_by = auth.uid()
4. team_owner des Teams sieht Benachrichtigung: "[Vereinsname] möchte dein Team aufnehmen"
5. team_owner akzeptiert oder lehnt ab
6. Bei Akzeptanz:
   - Plattform-Admin prüft optional
   - teams.club_id = club_id
   - teams.ownership_type = 'club_managed'
   - teams.status = 'club_affiliated'
7. Team ist nun Teil des Vereins
```

**Wichtig:** Zuordnung passiert NIEMALS automatisch. Immer explizite Bestätigung des team_owners erforderlich.

---

## Zukünftige Flows (Phase 2+)

### Vereon-interner Vereinswechsel (Phase 2)
```
Spieler → Beitrittsanfrage neuer Verein
→ player_transfer_requests
→ Genehmigung alter + neuer Verein
→ Spielerhistorie bleibt erhalten
```

*Kein offizieller ÖFB-Transfer. Nur interne Vereon-Dokumentation.*

### ÖFB-Vereinsreferenz (Phase 3+)
```
Plattform-Admin importiert official_club_registry
→ Verein verknüpft sich mit official_registry_id
→ optional: halbautomatische Verifikation für bekannte Vereine
```

### Saisonwechsel (Phase 2)
```
club_admin erstellt neue Saison
→ Teams können neuer Saison zugeordnet werden
→ Kader kann für neue Saison neu zusammengestellt werden
→ Alte Saison wird archiviert (nicht gelöscht)
```
