# MVP Scope — Vereon

**Stand:** 2026-07-18
**Status:** Gepflegter Scope auf Basis von `docs/FEATURE_CATALOG.md`
**Dokumenttyp:** Scope-Control-Dokument, kein Implementierungsauftrag

---

## 1. Zweck dieser Datei

`docs/MVP_SCOPE.md` legt fest, welche Feature-Catalog-Einträge in welche MVP-Phase gehören.

Diese Datei beschreibt nicht erneut alle Produktfunktionen im Detail. Die fachliche Beschreibung der Funktionen liegt in `docs/FEATURE_CATALOG.md`.

Die zentrale Frage dieser Datei lautet:

> Welche Feature-Catalog-Einträge gehören in welche Phase — und warum?

Diese Datei ist kein Umsetzungsauftrag für Code, Datenbank, Migrationen oder UI. Sie dient dazu, Scope-Grenzen, Prioritäten und bewusste Nicht-Ziele festzuhalten.

---

## 2. Quellen und Vorrang

| Bereich | Primäre Datei |
|---|---|
| Fachliche Produktfunktionen | `docs/FEATURE_CATALOG.md` |
| MVP-Phasenzuordnung und Scope-Grenzen | `docs/MVP_SCOPE.md` |
| User-Flows | `docs/USER_FLOWS.md` |
| Rollen und Berechtigungen | `docs/ROLES_AND_PERMISSIONS.md` |
| Datenmodell | `docs/DATABASE_MODEL.md` |
| Security | `docs/SECURITY.md` |
| Datenschutz / DSGVO | `docs/DSGVO_PRIVACY_MODEL.md` |
| Testabdeckung / manuelle QA | `docs/MVP_TEST_CHECKLIST.md` |
| Technischer Ist-Zustand | `docs/ARCHITECTURE.md`, `docs/STATUS.md` |
| Verbindliche Entscheidungen | `docs/DECISION_LOG.md` |

Statuswerte in dieser Datei werden aus `docs/FEATURE_CATALOG.md` übernommen. Maßgeblich bleibt immer der Feature-Katalog. Wenn sich Feature-Status, Feature-Phase oder Feature-ID im Feature-Katalog ändern, muss `docs/MVP_SCOPE.md` im selben Dokumentationsschritt mitgeprüft werden.

---

## 3. Scope-Prinzipien

### 3.1 Einzelteam zuerst

Vereon startet mit einer operativ nutzbaren Mannschaft.

Eine sichtbare Vereins-/Mehrteam-Verwaltung ist nicht Teil von MVP-0A oder MVP-0B. Die technische Vorbereitung für spätere Vereinsstrukturen darf existieren, wird aber im frühen MVP nicht als sichtbare Club-Suite ausgebaut.

### 3.2 Zusammenspiel von Trainerteam, Spielern und Guardians

Der MVP-Nutzungskern besteht aus Trainerteam, Spielern und Eltern/Erziehungsberechtigten.

Trainer und Co-Trainer brauchen Verwaltungs- und Organisationsfunktionen. Spieler und Guardians brauchen einen klaren Zugang zu Terminen, Rückmeldungen und relevanten Informationen. Der Scope darf keine dieser Gruppen ignorieren, darf aber auch nicht jede Komfortfunktion sofort in den MVP ziehen.

### 3.3 MVP-0B schließt Kernlücken

MVP-0B ist keine Vereinsverwaltungsphase.

MVP-0B schließt kurzfristige Lücken, die den bestehenden Einzelteam-Kernflow im Alltag stören, unsicher machen oder einen kontrollierten Pilotbetrieb verhindern.

### 3.4 Vereinsstruktur bleibt vorerst Hintergrundkontext

Club-/Vereinsstrukturen dürfen technisch vorbereitet sein. Sichtbare Club-Dashboards, Mehrteam-Verwaltung, operative `club_admin`-Workflows und Team-Affiliation gehören nicht in MVP-0A oder MVP-0B.

Sichtbare Vereinsfunktionen werden frühestens Post-MVP relevant, sofern der Einzelteam-Kern stabil funktioniert.

### 3.5 Datenminimierung bei Minderjährigen

Bei jedem Spieler ist das Geburtsjahr Pflicht. Das vollständige Geburtsdatum ist freiwillig und darf nur für Geburtstagsübersicht und altersbezogene Teamorganisation verwendet werden. Wird es angegeben, muss das Geburtsjahr daraus abgeleitet werden oder dazu passen.

Das vollständige Geburtsdatum ist für den Spieler selbst beziehungsweise den Guardian des eigenen Kindes sowie für aktive `team_owner`, `head_coach` und `assistant_coach` des Teams sichtbar. Spieler beziehungsweise Guardian dürfen es korrigieren. Ohne vollständiges Datum zeigt die App nur das Geburtsjahr und drängt nicht zur Ergänzung.

Nicht Teil des aktuellen MVP-Scopes sind:

- ein verpflichtendes vollständiges Geburtsdatum
- medizinische Daten
- Ausweis-/Dokumentdaten
- Gesundheitsnotizen
- private Familieninformationen außerhalb des notwendigen Guardian-/Kontaktkontexts

### 3.6 `team_owner` ist keine reine Trainerrolle

`team_owner` ist die administrative Eigentümerrolle eines eigenständigen Teams.

`team_owner` kann mit `head_coach` zusammenfallen, ist aber nicht automatisch dasselbe. Die Rolle ist wichtig für Teamhoheit, Team-Einstellungen und spätere Team-Affiliation. Operative Trainerarbeit und administrative Team-Eigentümerschaft müssen in Rollen- und Berechtigungsdokumenten sauber getrennt bleiben.

### 3.7 Mobile Alltagstauglichkeit

Mobile/PWA-Qualität gehört fachlich zu MVP-1. Trotzdem muss MVP-0B am Smartphone brauchbar responsiv sein, damit ein kontrollierter Pilot mit echten Nutzern nicht am Layout scheitert.

Eine native iOS-/Android-App ist kein früher MVP-Scope.

---

## 4. Phasenmodell

| Phase | Bedeutung |
|---|---|
| `MVP-0A` | Bestehender oder unmittelbar grundlegender Kernflow für eine einzelne Mannschaft |
| `MVP-0B` | Kurzfristige Kernlücken, damit der bestehende Kernflow alltagstauglicher, sicherer und pilotfähig wird |
| `MVP-1` | Erste real nutzbare Testversion mit besserer Alltagstauglichkeit |
| `Post-MVP` | Sinnvoll nach erstem echten Einsatz, aber nicht blockierend für den MVP |
| `Later` | Langfristige Plattformfunktion |
| `Unassigned / Rejected` | Nicht zugeordnet, bewusst verworfen oder ausdrücklich kein Produktfeature |

---

## 5. Prioritätsregeln

Diese Regeln verhindern, dass interessante Zusatzfunktionen den Kern verdrängen.

1. Keine sichtbare Vereinsverwaltung vor stabiler Einzelteam-Nutzung.
2. Kein Match-MVP vor Abschluss der MVP-0B-Kernlücken.
3. Keine Reports vor separater Match-MVP-Entscheidung.
4. Kein Taktikboard vor Training, RSVP, Rollen, Guardian-Flow und Anwesenheit.
5. Keine Push-/E-Mail-Benachrichtigungen vor brauchbarem Mobile- und In-App-Hinweiskonzept.
6. Keine Finanz-, Sponsoren-, Material-, Dokumenten-, Ehrenamts- oder Verbandsmodule im MVP.
7. Keine vollständige Club-/Mehrteam-Suite aus rein technisch vorhandenen Tabellen ableiten.
8. Keine neuen Features direkt aus `MVP_SCOPE.md` ableiten. Neue Features müssen zuerst in `docs/FEATURE_CATALOG.md` gepflegt werden.

---

## 6. MVP-0A — Bestehender Kernflow

### 6.1 Ziel

MVP-0A beschreibt den bestehenden oder unmittelbar grundlegenden Kernflow:

Eine einzelne Mannschaft kann operativ genutzt werden. Nutzer können sich anmelden, ein Team kann erstellt werden, Spieler oder Guardians können über Join-/Invite-Flows eingebunden werden, Trainings können erstellt und angezeigt werden, und RSVP-Grundfunktionen sind vorhanden.

MVP-0A ist keine vollständige Vereinsplattform.

Die Trennung zwischen Bestand und Prüfpunkten bedeutet: Bestand ist praktisch nutzbar oder im Feature-Katalog als implementiert/partial nachvollziehbar; Prüfpunkte sind fachlich oder technisch noch so unsicher, dass sie nicht als gesicherter Bestand behandelt werden dürfen.

### 6.2 MVP-0A — Bestand

| Modul | Feature-IDs | Status laut Feature-Katalog | Scope-Begründung |
|---|---|---|---|
| `AUTH` | `FC-AUTH-001`, `FC-AUTH-002`, `FC-AUTH-003`, `FC-AUTH-004` | `implemented` / `partial` | Registrierung, Login, Logout und geschützte App-Bereiche sind vorhanden; die beschlossene Registrierung mit Pflicht-Geburtsjahr und freiwilligem vollständigem Datum fehlt noch. |
| `DASHBOARD` | `FC-DASHBOARD-002` | `implemented` | Nächste Termine sind der wichtigste Einstiegspunkt für den Alltag. |
| `TEAM` | `FC-TEAM-001`, `FC-TEAM-002`, `FC-TEAM-004` | `implemented` | Mannschaft erstellen, anzeigen und Mitglieder sehen ist der Kern des Einzelteam-MVP. |
| `ROLE` | `FC-ROLE-004` | `partial` | Rollenabhängige Navigation ist notwendig, ersetzt aber noch keine vollständige Rechteverwaltung. |
| `PLAYER` | `FC-PLAYER-001` | `implemented` | Spieler müssen im Team sichtbar sein. |
| `GUARDIAN` | `FC-GUARDIAN-001`, `FC-GUARDIAN-002`, `FC-GUARDIAN-003` | `implemented` / `partial` | Guardian-/Kind-Logik ist vorhanden; die beschlossene Ein-Guardian-pro-Kind-Regel wird noch nicht technisch erzwungen. |
| `INVITE` | `FC-INVITE-001`, `FC-INVITE-002`, `FC-INVITE-003`, `FC-INVITE-004`, `FC-INVITE-005`, `FC-INVITE-006` | `implemented` / `partial` | Einladungscode, Join-Link und Entscheidung durch `team_owner` oder `head_coach` sind vorhanden. Assistant-Coach-Leserechte und serverseitige Altersgrenze des Self-Joins fehlen noch. |
| `EVENT` | `FC-EVENT-001` | `implemented` | Die Terminliste ist Basis für Training, RSVP und spätere Anwesenheit. |
| `TRAINING` | `FC-TRAINING-001`, `FC-TRAINING-002` | `implemented` | Trainings erstellen und anzeigen ist der operative Kernnutzen. |
| `RSVP` | `FC-RSVP-001`, `FC-RSVP-002`, `FC-RSVP-004`, `FC-RSVP-005` | `implemented` | Spieler-/Guardian-RSVP, Trainerübersicht und Statusanzeige machen Termine praktisch nutzbar. |

### 6.3 Club-Struktur ist kein MVP-0A-Produktscope

Die technische Vorbereitung von Club-/Mehrteam-Strukturen ist vorhanden, zählt aber nicht als nutzbare MVP-0A-Funktion. `FC-ORG-001` bis `FC-ORG-004` sind dem Post-MVP-Kontext zugeordnet. Eigenständige Teams erhalten im frühen MVP keinen automatischen oder versteckten Club-Kontext.

### 6.4 MVP-0A enthält ausdrücklich nicht

- vollständige Vereinsverwaltung
- sichtbare Mehrteam-Verwaltung
- Club-Dashboard
- operative `club_admin`-Funktionen
- Team-Affiliation
- Training bearbeiten/löschen/absagen
- Trainer-RSVP
- Co-Trainer-Verwaltung
- vollständige Anwesenheitserfassung
- Matchday-Vollumfang
- Reports
- Push-/E-Mail-Benachrichtigungen
- native App

---

## 7. MVP-0B — Kurzfristige Kernlücken

### 7.1 Ziel

MVP-0B macht den bestehenden Einzelteam-Kernflow alltagstauglicher, sicherer und weniger fehleranfällig.

Nach MVP-0B soll ein kleiner, kontrollierter Pilot mit einer Mannschaft möglich sein. MVP-0B ist weiterhin keine sichtbare Vereinsverwaltungsplattform.

### 7.2 Grobe Priorität innerhalb MVP-0B

1. **Training / RSVP / Rollen**
   - Training bearbeiten, löschen und absagen
   - Trainer-RSVP
   - Co-Trainer hinzufügen und entfernen

2. **Auth / Legal / Join-Sicherheit**
   - E-Mail-Verifizierung
   - Passwort zurücksetzen
   - Impressum, Datenschutzerklärung, Join-Flow-Hinweise
   - Guardian-Berechtigungsbestätigung mit Nutzer, Zeitpunkt und Textversion
   - Nachweis der angenommenen Nutzungsbedingungen und Datenschutzhinweise
   - automatische Bereinigung abgelehnter und zurückgezogener Join-Requests nach 90 Tagen

3. **Feinschliff / Stabilisierung**
   - Mannschaftsgrunddaten bearbeiten
   - Einladungscode erneuern oder deaktivieren
   - Beitrittsanfragen sauber ablehnen

Diese Reihenfolge ist keine detaillierte Aufgabenplanung. Sie beschreibt nur Scope-Priorität.

### 7.3 MVP-0B — bereits erledigter Bestand

| Modul | Feature-IDs | Status laut Feature-Katalog | Scope-Begründung |
|---|---|---|---|
| `PLAYER` | `FC-PLAYER-002` | `implemented` | Spieler entfernen gehört zur stabilen Teamverwaltung. |

### 7.4 MVP-0B — offene Kernlücken

| Modul | Feature-IDs | Status laut Feature-Katalog | Scope-Begründung |
|---|---|---|---|
| `AUTH` | `FC-AUTH-005`, `FC-AUTH-006` | `planned_mvp` | E-Mail-Verifizierung und Passwort-Reset sind grundlegende Sicherheits- und Recovery-Funktionen. |
| `PLAYER` | `FC-PLAYER-003` | `partial` | Das verpflichtende Geburtsjahr ist umgesetzt; die freiwillige Angabe des vollständigen Geburtsdatums mit enger Zweck- und Sichtbarkeitsbegrenzung fehlt noch. |
| `TEAM` | `FC-TEAM-003` | `planned_mvp` | Mannschaftsgrunddaten müssen korrigierbar sein. |
| `ROLE` | `FC-ROLE-002`, `FC-ROLE-003` | `planned_mvp` | Ausschließlich der `team_owner` vergibt oder entzieht die vordefinierte Co-Trainer-Rolle; granulare Einzelrechte sind nicht Teil des MVP. |
| `INVITE` | `FC-INVITE-007`, `FC-INVITE-008`, `FC-INVITE-009` | `partial` / `planned_mvp` | `team_owner` und `head_coach` entscheiden Beitrittsanfragen; alle drei Trainerrollen kontrollieren Einladungscodes; alte Anfragen müssen vor Pilotbetrieb automatisiert bereinigt werden. |
| `TRAINING` | `FC-TRAINING-003`, `FC-TRAINING-004`, `FC-TRAINING-005` | `implemented` / `planned_mvp` | Bearbeiten und Absagen sind umgesetzt; der bedingte Hard-Delete bleibt als Kernlücke offen. |
| `RSVP` | `FC-RSVP-003` | `planned_mvp` | Trainer und Co-Trainer müssen eigene Teilnahme rückmelden können. |
| `LEGAL` | `FC-LEGAL-001`, `FC-LEGAL-002`, `FC-LEGAL-003`, `FC-LEGAL-004`, `FC-LEGAL-008` | `partial` / `planned_mvp` | Impressum, Datenschutz, Join-Hinweise sowie versionierte Nachweise für Guardian-Erklärung und Dokumentenannahme sind vor externer Nutzung erforderlich. |

### 7.5 MVP-0B enthält ausdrücklich nicht

- sichtbare Vereinsverwaltung
- Club-Dashboard
- mehrere Mannschaften sichtbar verwalten
- Team-Switcher
- operative `club_admin`-Funktionen
- Team-Affiliation
- vollständige Matchday-Funktionen
- Reports
- Serienverwaltung
- Notification-Center
- Push-/E-Mail-Benachrichtigungen
- native App
- Finanz-/Sponsoren-/Materialverwaltung

---

## 8. Pilotfähigkeit

### 8.1 Interner Test

Ein interner Test kann mit Testaccounts und Testdaten vor MVP-0B erfolgen.

Ziel ist technische und fachliche Validierung ohne echte externe Eltern, Spieler oder Vereinsdaten.

### 8.2 Kontrollierter Pilot

Ein kontrollierter Pilot mit einer echten Mannschaft ist erst sinnvoll, wenn MVP-0B-Kernlücken geschlossen sind.

Für einen kontrollierten Pilot müssen mindestens erfüllt sein:

- Auth-Grundflow funktioniert zuverlässig.
- Eine Mannschaft kann erstellt und genutzt werden.
- Spieler-/Guardian-Join-Flow funktioniert.
- Beitrittsanfragen können angenommen und abgelehnt werden.
- Trainings können erstellt, bearbeitet, gelöscht und abgesagt werden.
- RSVP funktioniert für Spieler, Guardians und Trainerteam.
- Co-Trainer können operativ eingebunden und wieder entfernt werden.
- Impressum, Datenschutzerklärung und Join-Flow-Hinweise sind nicht mehr bloße Platzhalter.
- Die Guardian-Berechtigungsbestätigung speichert Nutzer, Zeitpunkt und Textversion.
- Die Annahme von Nutzungsbedingungen und Datenschutzhinweisen wird versioniert nachgewiesen.
- Abgelehnte und zurückgezogene Join-Requests werden nach 90 Tagen automatisiert bereinigt; unnötige Kinderdaten werden früher entfernt.
- Ein geprüftes Backup- und Wiederherstellungsverfahren für die Cloud-Datenbank ist dokumentiert.
- Mobile Nutzung ist zumindest brauchbar responsiv.
- `/manifest.webmanifest` wird im App-Routing ohne Login-Weiterleitung korrekt
  ausgeliefert. Die vollständige PWA-Installierbarkeit auf iOS und Android
  bleibt MVP-1.

Diese Kriterien sind keine technische Testcheckliste. Die eigentlichen Prüfungen gehören in `docs/MVP_TEST_CHECKLIST.md`.

### 8.3 Breiter Rollout

Ein breiter Rollout über mehrere Mannschaften oder Vereine ist nicht Ziel von MVP-0B.

Dafür braucht es mindestens MVP-1-Erkenntnisse, stabilere Rollen-/Security-Dokumentation, geklärte Datenschutzprozesse und eine bewusste Entscheidung zur sichtbaren Vereins-/Mehrteam-Struktur.

---

## 9. MVP-1 — Erste real nutzbare Testversion

### 9.1 Ziel

MVP-1 ist die erste Version, die mit einer echten Mannschaft über mehrere Wochen sinnvoll getestet werden kann.

MVP-1 erweitert den stabilisierten Einzelteam-Kern um bessere Alltagstauglichkeit, mobile Nutzung, Matchday-Grundlagen, Anwesenheit und strukturiertere Guardian-/Spielerfunktionen.

MVP-1 ist eine Sammelphase. Größere Blöcke dürfen nicht automatisch gleichzeitig umgesetzt werden. Vor Umsetzung sind eigene Teilentscheidungen erforderlich.

### 9.2 MVP-1 — Feature-Gruppen

| Modul | Feature-IDs / Bereich | Status laut Feature-Katalog | Scope-Begründung / Hinweis |
|---|---|---|---|
| `AUTH` | `FC-AUTH-007` | `planned_mvp` | Nutzer müssen eigene Profilgrunddaten korrigieren können. |
| `DASHBOARD` | `FC-DASHBOARD-001`, `FC-DASHBOARD-003` bis `FC-DASHBOARD-006` | `partial` / `planned_mvp` | Dashboard wird zur alltagstauglichen Arbeitszentrale, ohne frei konfigurierbare Widgets. |
| `TEAM` | `FC-TEAM-005`, `FC-TEAM-006`, `FC-TEAM-007` | `planned_mvp` | Teamansichten, primärer Team-Ort und Mannschaft archivieren/deaktivieren sind alltagsrelevant. |
| `ROLE` | `FC-ROLE-001`, `FC-ROLE-007` | `planned_mvp` | Rollen sichtbar machen und eine bestätigte Eigentumsübertragung sichern die Teamhoheit ohne granulare Einzelrechte. |
| `PLAYER` | `FC-PLAYER-004`, `FC-PLAYER-005`, `FC-PLAYER-006` | `planned_mvp` | Spielerprofil, sportliche Stammdaten und Statuslogik werden für echten Testbetrieb wichtig. |
| `GUARDIAN` | `FC-GUARDIAN-004`, `FC-GUARDIAN-006`, `FC-GUARDIAN-007`, `FC-GUARDIAN-008` | `planned_mvp` | Mehrere Kinder, Kontaktpersonen und Kontaktdaten sind für Jugendmannschaften alltagsrelevant. |
| `EVENT` | `FC-EVENT-002`, `FC-EVENT-003`, `FC-EVENT-004`, `FC-EVENT-005` | `planned_mvp` | Vergangene Termine, Filter, einfache Kalenderansicht und allgemeine interne Termine verbessern die Nutzung. |
| `TRAINING` | `FC-TRAINING-006` bis `FC-TRAINING-012`, `FC-TRAINING-014` | `planned_mvp` | Trainingsdetails, Ort und einfache wiederkehrende Trainings bleiben MVP-1, aber erst nach MVP-0B-Kernlücken. |
| `MATCH` | `FC-MATCH-001` bis `FC-MATCH-009` | `needs_review` / `planned_mvp` | Match bleibt MVP-1, aber nur als eigener offener Scope-Block nach separater Match-MVP-Entscheidung. |
| `RSVP` | `FC-RSVP-006` bis `FC-RSVP-009` | `planned_mvp` | Deadline, Begründung und Sperrlogik trennen RSVP sauber von Anwesenheit. |
| `ATTEND` | `FC-ATTEND-001` bis `FC-ATTEND-008` | `needs_review` / `planned_mvp` | Anwesenheitsliste anzeigen sowie Erfassen, Abschluss und Wiederöffnung bleiben MVP-1; Abschluss und Wiederöffnung sind vor Umsetzung bewusst zu prüfen. |
| `REPORT` | `FC-REPORT-001` bis `FC-REPORT-007` | `needs_review` / `planned_mvp` | Reports bleiben MVP-1, aber erst nach separater Match-MVP-Entscheidung. |
| `NOTIFY` | `FC-NOTIFY-001` bis `FC-NOTIFY-006` | `planned_mvp` | Kontextuelle Hinweise verbessern Alltagstauglichkeit ohne Notification-Center. |
| `MOBILE` | `FC-MOBILE-001`, `FC-MOBILE-002`, `FC-MOBILE-003` | `planned_mvp` / `partial` | Hochwertige mobile Nutzung und PWA-Installierbarkeit sind zentral für Trainer, Spieler und Guardians. |
| `LEGAL` | `FC-LEGAL-005`, `FC-LEGAL-007` | `planned_mvp` | Datenschutz-Kontaktweg und erweiterte Consent-/Berechtigungslogik (Folgeeintrag zum MVP-0B-Minimal-Consent) sind für belastbareren Pilotbetrieb wichtig. |

### 9.3 MVP-1 — eigene Teilentscheidungen vor Umsetzung

Vor Umsetzung dieser Blöcke sind eigene Scope-Entscheidungen erforderlich:

- Match-MVP (`FC-MATCH-001` bis `FC-MATCH-009`)
- Reports (`FC-REPORT-001` bis `FC-REPORT-007`)
- Anwesenheit mit Abschluss und Wiederöffnung (`FC-ATTEND-005`, `FC-ATTEND-006`)
- wiederkehrende Trainings (`FC-TRAINING-009` bis `FC-TRAINING-014`)
- mobile App-Shell / PWA-Qualitätsgrenze (`FC-MOBILE-001` bis `FC-MOBILE-003`)
- Guardian-Consent-Vollumfang (`FC-LEGAL-007`)

### 9.4 MVP-1 enthält ausdrücklich nicht

- vollständige Vereinsverwaltung
- vollständige Mehrteam-Club-Suite
- Finanzverwaltung
- Sponsorenverwaltung
- Materialverwaltung
- vollständige Kommunikationsplattform
- Chat
- Kader-Nominierung
- Aufstellungsplanung
- detaillierte Spielerstatistiken
- vollständige Taktikbibliothek
- Notification-Center
- Push-Benachrichtigungen
- native App
- Offlinefähigkeit
- Verbandsintegration

---

## 10. Post-MVP

### 10.1 Ziel

Post-MVP umfasst Funktionen, die nach erstem echten Einsatz sinnvoll werden, aber den MVP nicht blockieren.

Diese Funktionen können wichtig sein, dürfen aber nicht vor stabiler Einzelteam-Nutzung priorisiert werden.

### 10.2 Post-MVP — Feature-Gruppen

| Modul | Feature-IDs / Bereich | Scope-Begründung |
|---|---|---|
| `AUTH` | `FC-AUTH-008` | E-Mail-Änderung ist sinnvoll, aber nicht MVP-blockierend. |
| `DASHBOARD` | `FC-DASHBOARD-007` | Warnhinweise/offene Aufgaben sind nützlich, aber kein Kernflow. |
| `ORG` | `FC-ORG-005` | Sichtbare Mehrteam-Verwaltung gehört nach stabiler Einzelteam-Nutzung. |
| `ORG` | `FC-ORG-001` bis `FC-ORG-005` | Club-Grunddaten, bewusster Club-Kontext und nutzbare Mehrteam-Struktur sind trotz technischer Vorbereitung erst Post-MVP. |
| `TEAM` | `FC-TEAM-008` | Teamwechsel wird erst bei mehreren sichtbaren Teams relevant. |
| `TEAM` | `FC-TEAM-009` | Team-Affiliation (Beitritt zu einem Verein) darf nicht automatisch erfolgen und setzt eine sichtbare Vereins-/Mehrteam-Struktur voraus. |
| `ROLE` | `FC-ROLE-005` | `club_admin` wird erst mit sichtbarer Club-/Mehrteam-Struktur operativ relevant. |
| `PLAYER` | `FC-PLAYER-007` | Archivierung braucht Datenschutz-/Historienkonzept. |
| `INVITE` | `FC-INVITE-010` | Automatische Ablaufregeln für Einladungscodes sind nicht Teil des frühen MVP; Codes bleiben bis Erneuerung oder Deaktivierung gültig. |
| `EVENT` | `FC-EVENT-006`, `FC-EVENT-007` | Allgemeine RSVP-Termine und Kalenderexport sind spätere Komfortfunktionen. |
| `TRAINING` | `FC-TRAINING-013` | Echte Serienverwaltung ist langfristig wichtig, aber nicht erster Serienumfang. |
| `MATCH` | `FC-MATCH-010` | Kader-Nominierung ist fachlich wichtig, aber nicht MVP-Matchday. |
| `TACTIC` | `FC-TACTIC-001`, `FC-TACTIC-002` | Taktikboard darf Training/RSVP/Anwesenheit nicht verdrängen. |
| `REPORT` | `FC-REPORT-008` | Detaillierte Spielerstatistiken würden den MVP zu stark ausweiten. |
| `NOTIFY` | `FC-NOTIFY-007`, `FC-NOTIFY-008`, `FC-NOTIFY-009`, `FC-NOTIFY-010` | Notification-Center, Push und E-Mail brauchen eigene Infrastruktur und Einstellungen. |
| `MOBILE` | `FC-MOBILE-004` | Mobile Push gehört zu Benachrichtigungen, nicht zum frühen MVP. |
| `LEGAL` | `FC-LEGAL-006` | DSGVO-Self-Service ist rechtlich/technisch komplex und nicht MVP. |

---

## 11. Later

### 11.1 Ziel

Later umfasst langfristige Plattformfunktionen, die erst nach Validierung des MVP und nach bewusster Produktentscheidung ausgearbeitet werden dürfen.

### 11.2 Later — Feature-Gruppen

| Modul | Feature-IDs / Bereich | Scope-Begründung |
|---|---|---|
| `DASHBOARD` | `FC-DASHBOARD-008` | Personalisierbare Widgets sind komplex und nicht MVP-relevant. |
| `ROLE` | `FC-ROLE-006` | `super_admin` als Plattformrolle ist ein späterer Kandidat und erfordert eigene Security-/Decision-Prüfung. |
| `MATCH` | `FC-MATCH-011` | Strukturierte Gegner-/Vereinsdatenbank kann stark in Verbands-/Plattformlogik wachsen. |
| `TACTIC` | `FC-TACTIC-003`, `FC-TACTIC-004`, `FC-TACTIC-005` | Speichern, Zuordnen und Teilen von Taktiken ist langfristig, nicht MVP. |
| `MOBILE` | `FC-MOBILE-005`, `FC-MOBILE-006` | Offlinefähigkeit und native Apps sind langfristige Produkt-/Technikentscheidungen. |
| `ADMIN` | `FC-ADMIN-001`, `FC-ADMIN-002`, `FC-ADMIN-003`, `FC-ADMIN-004`, `FC-ADMIN-005` | Internes Admin-Panel ist kein frühes MVP und sicherheitskritisch. |

### 11.3 Future Platform Domains

Folgende langfristige Bereiche sind keine MVP-Features und werden in `docs/MVP_SCOPE.md` nicht konkret ausgearbeitet:

- `MEMBERSHIP`
- `FINANCE`
- `FACILITY`
- `EQUIPMENT`
- `COMMUNICATION`
- `DOCUMENTS`
- `VOLUNTEER`
- `SPONSOR`
- `SHOP`
- `ANALYTICS`
- `FEDERATION`

Diese Bereiche dürfen erst nach separater Produktentscheidung in konkrete Features, Rollen, Datenmodelle oder User-Flows übersetzt werden.

---

## 12. Rejected / bewusst nicht enthalten

Diese Feature-Catalog-Einträge sind bewusst nicht als normale Produktfunktionen vorgesehen:

| Feature-ID | Scope-Entscheidung |
|---|---|
| `FC-PLAYER-008` | Spieler vollständig löschen ist kein normales MVP-Feature und muss über DSGVO-/Löschkonzept behandelt werden. |
| `FC-RSVP-010` | Trainerteam soll keine Spieler-RSVP nachtragen; tatsächliche Anwesenheit wird separat geführt. |
| `FC-ADMIN-006` | Impersonation ist hochriskant und kein normales Produktfeature. |
| `FC-ADMIN-007` | Direkter Datenbankzugriff über Admin-Panel ist kein Produktfeature. |

---

## 13. Nicht-Ziele, die nicht vorgezogen werden dürfen

Diese Punkte sind besonders anfällig dafür, zu früh in den MVP gezogen zu werden. Sie bleiben ausdrücklich außerhalb von MVP-0A, MVP-0B und überwiegend auch außerhalb von MVP-1:

- vollständige Vereinsverwaltung
- sichtbare Mehrteam-Verwaltung
- Club-Dashboard
- Team-Affiliation vor Post-MVP
- Kader-Nominierung vor Match-MVP-Klärung
- Aufstellungsplanung
- Taktikboard vor stabiler Training-/RSVP-/Anwesenheitslogik
- detaillierte Spielerstatistiken
- Notification-Center
- Push-/E-Mail-Benachrichtigungen
- native App
- Offlinefähigkeit
- Finanzverwaltung
- Sponsorenverwaltung
- Materialverwaltung
- Verbandsintegration
- internes Admin-Panel

---

## 14. Abgrenzung zu anderen Dokumenten

`docs/MVP_SCOPE.md` darf nicht mit technischen oder prozessualen Detailinhalten aufgebläht werden.

| Inhalt | Gehört nach |
|---|---|
| konkrete Routen und Screens | `docs/USER_FLOWS.md`, `docs/ARCHITECTURE.md` |
| Schritt-für-Schritt-Abläufe | `docs/USER_FLOWS.md` |
| Rollenrechte und Berechtigungsmatrix | `docs/ROLES_AND_PERMISSIONS.md` |
| Tabellen, Spalten, Beziehungen | `docs/DATABASE_MODEL.md` |
| RLS, SECURITY DEFINER, Zugriffsschutz | `docs/SECURITY.md` |
| Datenschutzdetails, Löschung, Einwilligung, Minderjährige | `docs/DSGVO_PRIVACY_MODEL.md` |
| manuelle Tests und QA-Kriterien | `docs/MVP_TEST_CHECKLIST.md` |
| reale Routen-/Code-Struktur | `docs/ARCHITECTURE.md`, `docs/STATUS.md` |
| konkrete Implementierung | Claude-Code-Aufträge, nicht dieses Dokument |
| dauerhafte Produkt-/Architekturentscheidungen | `docs/DECISION_LOG.md` |

---

## 15. Feature-Catalog-Prüfpunkte

Diese Punkte müssen mit `docs/FEATURE_CATALOG.md` in Einklang gebracht werden.

| Punkt | Problem | Erwartete Klärung |
|---|---|---|
| Match-MVP | Viele Match-Features in MVP-1, teilweise `needs_review` | Vor Umsetzung eigene Match-MVP-Entscheidung treffen. |
| Reports | Reports hängen fachlich am Match-Modul | Vor Umsetzung erst Match-MVP klären. |

---

## 16. Pflege-Regeln

1. Neue Funktionen werden zuerst in `docs/FEATURE_CATALOG.md` angelegt.
2. Danach wird entschieden, ob und in welcher Phase sie in `docs/MVP_SCOPE.md` erscheinen.
3. Danach werden User-Flows, Rollen, Datenmodell, Security/DSGVO und Tests abgeleitet.
4. `docs/MVP_SCOPE.md` darf keine technische Umsetzung, Migration oder RLS-Regel ersetzen.
5. Wenn `docs/FEATURE_CATALOG.md` geändert wird, muss geprüft werden, ob `docs/MVP_SCOPE.md` angepasst werden muss.
6. Wenn eine Funktion aus `Post-MVP` oder `Later` vorgezogen werden soll, braucht das zuerst eine bewusste Produktentscheidung.
7. Rejected Features dürfen nicht still wieder als neue MVP-Funktionen auftauchen.
