# DSGVO und Datenschutzmodell — Vereon

**Stand:** 2026-06-25
**Kontext:** Vereon verarbeitet potenziell Daten von Minderjährigen, Erziehungsberechtigten, Trainern und Vereinen. Datenschutz ist keine nachgelagerte Aufgabe, sondern Teil der Architektur.

---

## Rechtliche Grundlagen

- **DSGVO (EU 2016/679)** — gilt für alle personenbezogenen Daten
- **Art. 8 DSGVO** — Einwilligung Minderjähriger: unter 14 Jahren ist Einwilligung der Erziehungsberechtigten erforderlich
- **Art. 17 DSGVO** — Recht auf Löschung ("Recht auf Vergessenwerden")
- **Art. 20 DSGVO** — Recht auf Datenübertragbarkeit
- **DSG 2018 (Österreich)** — nationale Umsetzung; Vereon startet in Österreich
- **DSGVO gilt unabhängig davon, ob der Verein selbst als Verantwortlicher agiert** — Vereon als Plattformbetreiber ist Auftragsverarbeiter und/oder gemeinsam Verantwortlicher

---

## Grundprinzipien (Privacy by Design)

### Datensparsamkeit
Nur Daten erfassen, die für den konkreten Zweck zwingend nötig sind. Kein spekulatives Sammeln für "später mal nützliche" Features.

### Zweckbindung
Jede gespeicherte Information hat einen definierten, dokumentierten Zweck. Keine Zweckentfremdung (z.B. keine Nutzung von Spielerdaten für Werbung).

### Speicherbegrenzung
Daten werden nur solange aufbewahrt wie nötig. Austrittsprozesse und Löschkonzepte sind Teil der Architektur.

### Transparenz
Nutzer wissen, was gespeichert wird. Eltern wissen, welche Daten über ihr Kind gespeichert sind.

---

## Minderjährige — besonderer Schutz

Viele Spieler in Amateurfußballvereinen sind Minderjährige, oft unter 14 Jahren.

### Was das bedeutet:
- Einwilligung zur Datenspeicherung **muss von Erziehungsberechtigten** erteilt werden
- Keine direkte Vermarktung an Minderjährige
- Keine Fotos von Minderjährigen ohne explizite Einwilligung der Erziehungsberechtigten
- Keine öffentlich zugänglichen Profile von Minderjährigen
- Kein Account für Kinder unter 14 ohne Guardian-Verknüpfung empfohlen

### Architektonische Konsequenz:
- `player_guardians.verified_at` ist ein technischer Verknüpfungszeitpunkt (gesetzt beim Absenden der Beitrittsanfrage über den Einladungsflow) — **kein vollständiger Einwilligungsnachweis** im Sinne von Art. 8 DSGVO (keine Referenz auf eine konkrete Consent-Version, keine separate Protokollierung des Einwilligungsinhalts). Offener Punkt, siehe `docs/LEGAL_TODO.md`.
- Guardian-Verknüpfung über Einladungsflow (nicht durch Kinder selbst)
- Kinder ohne Account erscheinen in Anwesenheitslisten, haben aber keine eigene Authentifizierung

---

## Minimales Spielerprofil (MVP 1)

Das Spielerprofil muss so minimal wie möglich sein, solange die Kernfunktionen (Anwesenheit, Kalender) davon abhängen.

### Was gespeichert wird (MVP 1):
```
players (minimal):
  id
  first_name          -- Vorname
  last_name           -- Nachname
  birth_year          -- Geburtsjahr (nicht Geburtsdatum — weniger sensibel)
  position            -- optional, Spielposition
  jersey_nr           -- optional, Trikotnummer
  user_id             -- optional, wenn Account vorhanden
  club_id / team_id   -- Zuordnung
```

### Was bewusst NICHT im MVP gespeichert wird:
| Datenfeld | Begründung |
|---|---|
| Vollständiges Geburtsdatum | Geburtsjahr reicht für Altersklassen, weniger sensibel. Technisch umgesetzt seit Migration `20260702000000_players_birth_year_only`: Der Join-Flow (`submit_join_request_self`, `submit_join_request_guardian`) befüllt `players.date_of_birth` nicht mehr. Die Spalte existiert weiterhin nullable als Bestandsspalte; ggf. vorhandene Altdaten aus früheren lokalen Testläufen wurden nicht rückwirkend bereinigt. `profiles.date_of_birth` ist ein separates Feld für das Profil des registrierten Nutzers (Trainer/Self-Player/Guardian selbst) und von dieser Umstellung nicht betroffen. |
| Nationalität | Nicht nötig für Kernfunktionen |
| Gesundheitsdaten | Streng sensibel nach Art. 9 DSGVO, nie in MVP |
| Medizinische Informationen | Dito — separates Modul wenn überhaupt |
| Detaillierte Leistungsbewertungen | Risiko bei Minderjährigen, Phase 3 |
| Fotos / Bilder von Kindern | Einwilligung komplex, nie automatisch |
| Vollständige Privatadresse | Nicht nötig für Vereinsmanagement |
| Telefonnummer des Kindes | Elternkontakt reicht |
| Freie Trainernotizen über Kinder | Sensibel, kein freies Textfeld in MVP |

### `tactics_notes` im Spielbericht:
Interne Trainernotizen über Spieler (`tactics_notes` in `match_reports`) sind:
- Niemals für Spieler oder Eltern sichtbar
- Column-Level Security oder separate RLS-Policy
- Kein Freitextfeld zu Minderjährigen ohne klare Einschränkung

---

## Sichtbarkeit von Kinderdaten

### Grundregel:
**Ein Elternteil sieht nur die Daten seines eigenen Kindes — nicht die Daten anderer Kinder oder Elternkontakte.**

| Daten | Sichtbar für |
|---|---|
| Eigenes Kindprofil | Guardian (via player_guardians) |
| Kalender des eigenen Kindes | Guardian (can_view_schedule = true) |
| RSVP des eigenen Kindes | Guardian (can_rsvp = true) |
| Profil anderer Kinder | NICHT automatisch — nur Trainer/Admin |
| Liste aller Eltern im Team | NICHT automatisch — nur Trainer/Admin |
| Anwesenheitsquote anderer Kinder | NICHT für Eltern |

### RLS-Umsetzung:
`player_guardians.verified_at` muss gesetzt sein, bevor Guardian-Rechte aktiv werden. Kein direkter INSERT durch den Client — ausschließlich über verifizierten Einladungsflow.

---

## Rollenbasierter Datenzugriff

| Datenkategorie | Trainer | club_admin | sporting_director | Spieler | Guardian | Öffentlich |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Eigenes Profil | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Profile Vereinsmitglieder | ✓ (Team) | ✓ | ✓* | — | — | — |
| Spielerprofil (eigenes Team) | ✓ | ✓ | ✓* | Nur eigenes | Nur eigenes Kind | — |
| Anwesenheitsquote | ✓ | ✓ | ✓* | Nur eigene | Nur eigenes Kind | — |
| tactics_notes | ✓ | ✓ | — | — | — | — |
| Finanzdaten | — | ✓ | — | — | — | — |
| Audit-Logs | — | ✓ | — | — | — | — |

\* sporting_director nur für Teams unter seiner Zuständigkeit

---

## Audit-Logs (Langfristplanung)

`audit_logs` ist als zukünftige Tabelle dokumentiert (MVP 1+). Kritische Aktionen, die protokolliert werden sollen:

- Vereinserstellung und -änderung
- Mitgliedschaftsvergabe und -entzug
- Rollenvergabe und -entzug
- Einladungen erstellen, einlösen, widerrufen
- Team-Affiliation-Entscheidungen
- Datenlöschungen (DSGVO-Requests)

**Wichtig:** `audit_logs` ist append-only. Kein User kann direkt schreiben — nur via SECURITY DEFINER Funktionen. Kein User kann Einträge löschen (außer für DSGVO-Löschanfragen durch Plattform-Admin).

---

## Lösch- und Austrittsprozesse

### Benutzer verlässt einen Verein:
- `club_memberships.status = 'left'` (Soft-Delete)
- Vereinsdaten bleiben erhalten (anderen Mitgliedern zugehörig)
- Profildaten des Users werden NICHT automatisch gelöscht
- Spielerdaten (falls vorhanden) bleiben im Verein erhalten, `user_id` wird entkoppelt

### Benutzer möchte Account löschen (Art. 17 DSGVO):
- Prozess über Support-Kanal (MVP: manuell durch Plattform-Admin)
- `auth.users` CASCADE löscht `profiles`, entkoppelt `players.user_id`
- Zugehörige Spielerdaten bleiben im Verein (gehören dem Verein, nicht dem User)
- Historische Audit-Logs bleiben mit `actor_id = NULL`

### Verein wird archiviert:
- Alle zugehörigen Daten werden nicht sofort gelöscht
- `clubs.verification_status = 'suspended'` als erster Schritt
- Echte Löschung mit Datenschutzfolgenabschätzung — Phase 3

---

## Self-Service-Eltern/Kind-Beitritt (MVP 0A)

Der Beitrittsprozess für Eltern/Kinder ist DSGVO-relevant:

1. Trainer erstellt `team_invitation_link` — kein personenbezogenes Datum
2. Elternteil öffnet Link, registriert sich (eigene E-Mail, Passwort)
3. Elternteil legt Kind an — nur: Vorname, Nachname, Geburtsjahr
4. `team_join_request` entsteht mit Status `pending`
5. Trainer akzeptiert → `player` wird dem Team zugeordnet
6. Erst nach Akzeptanz sind Daten des Kindes für das Team sichtbar

**Kein automatischer Datenzugriff durch unbefugte Trainer.** Der Trainer sieht die Kindesdaten erst nach bewusstem Akzeptieren.

---

## Service-Role-Key

**Der `SUPABASE_SERVICE_ROLE_KEY` umgeht RLS vollständig.**

Er darf niemals in:
- Next.js-Anwendungscode (`/app`, `/src`)
- Client Components
- Server Actions im App-Code
- `.env.example`
- versionierten Dateien

Er darf nur in:
- Supabase CLI (lokale Entwicklung)
- Admin-Scripts (nicht im Repo)
- Serverseitige CI/CD-Prozesse (isoliert)

---

## Offene Datenschutzfragen

| Frage | Priorität | Wann klären |
|---|---|---|
| AV-Vertrag mit Supabase (Auftragsverarbeitungsvertrag) | Hoch | Vor Launch |
| Datenschutzerklärung für Endnutzer | Hoch | Vor Launch |
| Einwilligungsprozess für Minderjährige (u14) | Hoch | MVP 1 |
| Datenexport für User (Art. 20) | Mittel | Phase 2 |
| Automatische Löschroutinen | Mittel | Phase 2 |
| Datenschutz-Folgenabschätzung für Kinderdaten | Hoch | Vor MVP 1 go-live |
| Datenspeicherort (EU-Region bei Supabase) | Hoch | Vor Launch |
