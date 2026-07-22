# User Flows — Vereon

**Stand:** 2026-07-18
**Status:** Gepflegte Fassung auf Basis von `docs/FEATURE_CATALOG.md` und `docs/MVP_SCOPE.md`
**Dokumenttyp:** Produkt-/UX-Flow-Dokument, kein Implementierungsauftrag

---

## 1. Zweck dieser Datei

`docs/USER_FLOWS.md` beschreibt die wichtigsten Nutzerabläufe von Vereon.

Diese Datei beantwortet je Flow:

- welche Rolle handelt,
- welcher Auslöser den Ablauf startet,
- welche groben Schritte passieren,
- welches Ergebnis entsteht,
- welche Feature-Catalog-IDs betroffen sind,
- welche offenen UX-/Produktfragen bestehen.

Diese Datei ersetzt weder den Feature-Katalog noch das Scope-Dokument. Die fachlichen Produktfunktionen liegen in `docs/FEATURE_CATALOG.md`. Die Phasenzuordnung und Scope-Grenzen liegen in `docs/MVP_SCOPE.md`.

---

## 2. Quellen und Vorrang

| Bereich | Primäre Datei |
|---|---|
| Fachliche Produktfunktionen und Feature-IDs | `docs/FEATURE_CATALOG.md` |
| MVP-Phasen, Scope-Grenzen und Nicht-Ziele | `docs/MVP_SCOPE.md` |
| User-Flows | `docs/USER_FLOWS.md` |
| Rollen und Berechtigungen | `docs/ROLES_AND_PERMISSIONS.md` |
| Datenmodell | `docs/DATABASE_MODEL.md` |
| Security | `docs/SECURITY.md` |
| Datenschutz / DSGVO | `docs/DSGVO_PRIVACY_MODEL.md` |
| Tests / QA | `docs/MVP_TEST_CHECKLIST.md` |
| Technischer Ist-Zustand | `docs/ARCHITECTURE.md`, `docs/STATUS.md` |
| Verbindliche Entscheidungen | `docs/DECISION_LOG.md` |

Wenn Feature-IDs, Status oder Phasen in `docs/FEATURE_CATALOG.md` geändert werden, muss dieses Dokument mitgeprüft werden.

---

## 3. Abgrenzung

Diese Datei beschreibt **keine**:

- Datenbanktabellen,
- Spalten,
- Migrationen,
- RLS-Policies,
- RPCs,
- Server Actions,
- konkrete Code-Dateien,
- konkrete UI-Komponenten,
- vollständige Testfälle,
- vollständige Rechte-Matrix,
- juristischen Detailtexte.

Technische Umsetzung gehört in Architektur-, Security-, Datenmodell- oder Claude-Code-Aufträge. Datenschutzdetails und juristische Formulierungen gehören in `docs/DSGVO_PRIVACY_MODEL.md` und juristische Prüfung.

---

## 4. Flow-Format

Jeder Flow folgt grundsätzlich diesem Schema:

```text
Flow-ID: UF-[PHASE]-[NUMMER]
Phase: MVP-0A / MVP-0B / MVP-1 / Post-MVP / Later
Flow-Status: bestehend / offen / teilweise / prüfen
Hauptrollen: technische Rollen aus dem Feature-Katalog
Betroffene Feature-IDs: FC-...
Auslöser: Warum beginnt der Flow?
Grobe Schritte: Was passiert fachlich aus Nutzersicht?
Ergebnis: Welcher nutzbare Zustand entsteht?
Offene UX-/Produktfragen: Was muss vor Umsetzung oder Review geklärt werden?
```

### 4.1 Flow-Status

| Flow-Status | Bedeutung |
|---|---|
| `bestehend` | Der Flow ist laut Feature-Katalog und aktuellem Projektstand grundsätzlich vorhanden. Repo-Review bleibt möglich. |
| `offen` | Der Flow ist fachlich vorgesehen, aber noch nicht oder nicht vollständig umgesetzt. |
| `teilweise` | Teile des Flows existieren, aber der Ablauf ist noch nicht durchgängig vollständig. |
| `prüfen` | Der Flow ist fachlich relevant, muss aber vor Umsetzung oder Dokumentationsübernahme gegen Repo, Rollen, Security oder DSGVO geprüft werden. |

Die genaue Wahrheit zu Feature-Status und Feature-Phase bleibt im Feature-Katalog. Ein Flow kann mehrere Feature-IDs mit unterschiedlichen Statuswerten enthalten.

### 4.2 Rollenbezeichnungen

Diese Datei verwendet technische Rollenbezeichnungen aus `docs/FEATURE_CATALOG.md`, insbesondere:

- `authenticated_user`
- `team_owner`
- `head_coach`
- `assistant_coach`
- `player`
- `guardian`
- `club_admin`
- `super_admin`
- `system`

Die genaue Rechteabbildung gehört in `docs/ROLES_AND_PERMISSIONS.md`.

`assistant_coach` ist im Zielmodell eine operative Trainerteamrolle. Die Rolle darf Trainings erstellen, bearbeiten und absagen sowie Einladungsinformationen verwalten, aber weder Rollen vergeben noch Spieler entfernen, Join-Requests entscheiden oder Trainings hart löschen.

---

## 5. MVP-0A — Bestehender Einzelteam-Kernflow

### 5.1 Ziel

MVP-0A beschreibt den bestehenden Kernablauf für eine einzelne Mannschaft:

Ein Nutzer kann sich registrieren oder anmelden, eine Mannschaft erstellen, andere Nutzer über Join-/Invite-Flows einbinden, Trainings erstellen und grundlegende RSVP nutzen.

MVP-0A ist keine Vereinsplattform und keine sichtbare Mehrteam-Verwaltung.

---

### UF-0A-01 — Account erstellen, anmelden und geschützten Bereich öffnen

**Phase:** `MVP-0A`  
**Flow-Status:** `teilweise`
**Hauptrollen:** `authenticated_user`  
**Betroffene Feature-IDs:** `FC-AUTH-001`, `FC-AUTH-002`, `FC-AUTH-003`, `FC-AUTH-004`, `FC-DASHBOARD-002`

**Auslöser:** Ein Nutzer möchte Vereon verwenden.

**Grobe Schritte:**

1. Nutzer registriert sich mit E-Mail, Passwort und verpflichtendem Geburtsjahr; das vollständige Geburtsdatum kann freiwillig ergänzt werden. Alternativ meldet sich der Nutzer an.
2. Nach erfolgreicher Anmeldung öffnet sich der geschützte App-Bereich.
3. Der Nutzer sieht je nach Zustand relevante nächste Schritte oder kommende Termine.
4. Der Nutzer kann sich wieder abmelden.

**Ergebnis:** Der Nutzer hat einen nutzbaren Account und Zugriff auf geschützte Vereon-Bereiche.

**Offene UX-/Produktfragen:**

- Ab MVP-0B muss geklärt sein, welche App-Bereiche ohne bestätigte E-Mail blockiert werden.

---

### UF-0A-02 — Mannschaft erstellen

**Phase:** `MVP-0A`  
**Flow-Status:** `bestehend`  
**Hauptrollen:** `authenticated_user`, `team_owner`, `head_coach`  
**Betroffene Feature-IDs:** `FC-TEAM-001`, `FC-TEAM-002`, `FC-TEAM-004`, `FC-ROLE-004`, `FC-ORG-002`

**Auslöser:** Ein eingeloggter Nutzer möchte eine neue operative Mannschaft starten.

**Grobe Schritte:**

1. Nutzer startet den Mannschafts-Erstellungsflow.
2. Nutzer gibt die notwendigen Mannschaftsgrunddaten ein.
3. Die Mannschaft wird erstellt.
4. Der erstellende Nutzer erhält die notwendigen Rollen für Teamhoheit und operative Trainerverwaltung.
5. Der Nutzer landet in der Mannschaftsansicht oder im Dashboard.

**Ergebnis:** Eine einzelne Mannschaft ist operativ nutzbar. Der Ersteller kann sie verwalten.

**Offene UX-/Produktfragen:**

- Die Trennung zwischen `team_owner` und `head_coach` muss in UI und Rollenlogik sichtbar genug sein, ohne den MVP unnötig zu verkomplizieren.

---

### UF-0A-03 — Team-Einladungscode anzeigen und teilen

**Phase:** `MVP-0A`  
**Flow-Status:** `teilweise`
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`
**Betroffene Feature-IDs:** `FC-INVITE-001`, `FC-INVITE-002`

**Auslöser:** Ein Teamverantwortlicher möchte Spieler oder Guardians zur Mannschaft einladen.

**Grobe Schritte:**

1. `team_owner`, `head_coach` oder `assistant_coach` öffnet den Einladungsbereich der Mannschaft.
2. Der vorhandene Einladungscode oder Join-Link wird angezeigt.
3. Der Link oder Code wird kopiert und außerhalb von Vereon geteilt.
4. Eingeladene Personen können über den Link oder Code den Join-Flow starten.

**Ergebnis:** Eingeladene Nutzer können eine Beitrittsanfrage starten. Der Einladungscode erzeugt noch keine automatische Mitgliedschaft.

**Festgelegte Grenzen und Ist-Abweichung:**

- Ab MVP-0B muss der Code erneuerbar oder deaktivierbar sein.
- Die aktuelle RLS erlaubt die Anzeige noch nicht für `assistant_coach`.

---

### UF-0A-04 — Volljähriger Spieler tritt über Join-Flow bei

**Phase:** `MVP-0A`  
**Flow-Status:** `teilweise`
**Hauptrollen:** `player`, `authenticated_user`, `head_coach`  
**Betroffene Feature-IDs:** `FC-INVITE-002`, `FC-INVITE-003`, `FC-INVITE-005`, `FC-INVITE-006`, `FC-PLAYER-003`

**Hinweis zur Feature-Phase:** Der Flow selbst bleibt `MVP-0A`. `FC-PLAYER-003` ist laut Feature-Katalog und Scope als `MVP-0B`-Bestand geführt, wird hier aber als mitgenutzte Spielerstammdaten-Funktion des Join-Flows referenziert.

**Auslöser:** Ein volljähriger Spieler erhält einen Team-Link oder Team-Code.

**Grobe Schritte:**

1. `player` öffnet den Join-Link oder gibt den Code ein.
2. `player` registriert sich oder meldet sich an.
3. `player` wählt den Self-Player-Beitritt.
4. `player` gibt Name und verpflichtendes Geburtsjahr ein; das vollständige Geburtsdatum kann freiwillig ergänzt werden.
5. Der Beitritt wird als Anfrage an das Trainerteam übermittelt.
6. `team_owner` oder `head_coach` kann die Anfrage annehmen.

**Ergebnis:** Der Spieler wird nicht automatisch Teammitglied, sondern erst nach Freigabe durch `team_owner` oder `head_coach`.

**Offene UX-/Produktfragen:**

- Der Flow muss klar zwischen volljährigem Self-Player-Beitritt und Guardian-Kind-Beitritt unterscheiden.

---

### UF-0A-05 — Guardian meldet Kind über Join-Flow an

**Phase:** `MVP-0A`  
**Flow-Status:** `teilweise`
**Hauptrollen:** `guardian`, `authenticated_user`, `head_coach`  
**Betroffene Feature-IDs:** `FC-INVITE-002`, `FC-INVITE-004`, `FC-INVITE-005`, `FC-INVITE-006`, `FC-GUARDIAN-001`, `FC-GUARDIAN-002`, `FC-PLAYER-003`

**Hinweis zur Feature-Phase:** Der Flow selbst bleibt `MVP-0A`. `FC-PLAYER-003` ist laut Feature-Katalog und Scope als `MVP-0B`-Bestand geführt, wird hier aber als mitgenutzte Spielerstammdaten-Funktion des Guardian-Join-Flows referenziert.

**Auslöser:** Ein Guardian erhält einen Team-Link oder Team-Code für ein Kind.

**Grobe Schritte:**

1. `guardian` öffnet den Join-Link oder gibt den Code ein.
2. `guardian` registriert sich oder meldet sich an.
3. `guardian` wählt den Kind-/Guardian-Beitritt.
4. `guardian` gibt Name und verpflichtendes Geburtsjahr des Kindes ein; das vollständige Geburtsdatum kann freiwillig ergänzt werden.
5. Die Beitrittsanfrage wird an das Trainerteam übermittelt.
6. Das Kind wird erst nach Freigabe aktives Teammitglied.

**Ergebnis:** Ein Guardian kann ein Kind anmelden, ohne dass das Kind sofort Mitglied der Mannschaft wird.

**Offene UX-/Produktfragen:**

- Ab MVP-0B muss dieser Flow minimale Join-Hinweise und eine Berechtigungsbestätigung enthalten.
- Der Flow darf kein vollständiges Geburtsdatum verlangen und keine medizinischen Daten oder Dokumente abfragen. Ein freiwillig angegebenes vollständiges Geburtsdatum dient ausschließlich Geburtstagsübersicht und altersbezogener Teamorganisation.

---

### UF-0A-06 — Beitrittsanfragen anzeigen und annehmen

**Phase:** `MVP-0A`  
**Flow-Status:** `teilweise`
**Hauptrollen:** `team_owner`, `head_coach`
**Weitere Rollen:** `assistant_coach`, `player`, `guardian`
**Betroffene Feature-IDs:** `FC-INVITE-005`, `FC-INVITE-006`, `FC-PLAYER-001`, `FC-TEAM-004`, `FC-GUARDIAN-001`

**Auslöser:** Eine neue Beitrittsanfrage liegt vor.

**Grobe Schritte:**

1. `team_owner` oder `head_coach` öffnet die offenen Beitrittsanfragen.
2. `team_owner` oder `head_coach` sieht die für die Entscheidung notwendigen Anfragedaten.
3. Die berechtigte Rolle nimmt eine passende Anfrage an.
4. Die Person oder das Kind wird der Mannschaft zugeordnet.
5. Die Teamansicht zeigt das neue Mitglied rollenabhängig an.

**Ergebnis:** Eine Beitrittsanfrage wird zu einer aktiven Teamzuordnung.

**Festgelegte Grenzen und Ist-Abweichung:**

- Die Anzeige von Anfragedaten muss klar von der Anzeige regulärer Team-/Kaderdaten getrennt bleiben.
- Ablehnen wird als MVP-0B-Kernlücke separat geführt.
- `assistant_coach` darf Anfragen sehen, aber weder annehmen noch ablehnen. Die
  aktuelle RLS erlaubt diese Einsicht noch nicht.

---

### UF-0A-07 — Training erstellen und anzeigen

**Phase:** `MVP-0A`  
**Flow-Status:** `bestehend`  
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`  
**Weitere Rollen:** `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-TRAINING-001`, `FC-TRAINING-002`, `FC-EVENT-001`, `FC-DASHBOARD-002`

**Auslöser:** Das Trainerteam möchte ein Training planen.

**Grobe Schritte:**

1. Berechtigte Trainerrolle öffnet den Bereich zur Trainingserstellung.
2. Die notwendigen Trainingsdaten werden eingetragen.
3. Das Training wird erstellt.
4. Das Training erscheint in der Terminliste und in relevanten Übersichten.
5. Spieler und Guardians können den Termin sehen.

**Ergebnis:** Ein Training ist für alle relevanten Rollen sichtbar.

**Offene UX-/Produktfragen:**

- Bearbeiten, Löschen und Absagen sind nicht MVP-0A, sondern MVP-0B.

---

### UF-0A-08 — RSVP für Training abgeben und anzeigen

**Phase:** `MVP-0A`  
**Flow-Status:** `bestehend`  
**Hauptrollen:** `player`, `guardian`, `head_coach`, `assistant_coach`  
**Betroffene Feature-IDs:** `FC-RSVP-001`, `FC-RSVP-002`, `FC-RSVP-004`, `FC-RSVP-005`, `FC-GUARDIAN-003`

**Auslöser:** Ein Training steht bevor und ein Spieler oder Guardian soll Rückmeldung geben.

**Grobe Schritte:**

1. `player` oder `guardian` öffnet den Termin.
2. `player` gibt die eigene RSVP ab oder `guardian` gibt RSVP für das Kind ab.
3. Der RSVP-Status wird gespeichert.
4. `head_coach` und `assistant_coach` sehen die Rückmeldungen in der Übersicht.

**Ergebnis:** Das Trainerteam sieht, wer zu- oder abgesagt hat.

**Offene UX-/Produktfragen:**

- Trainer-RSVP ist in MVP-0A nicht enthalten und wird in MVP-0B separat ergänzt.

---

## 6. MVP-0B — Kernlücken und Pilotfähigkeit

### 6.1 Ziel

MVP-0B stabilisiert den Einzelteam-Kernflow.

MVP-0B ist keine Vereinsverwaltungsphase. Es schließt Lücken, die den Alltag stören, Sicherheit reduzieren oder einen kontrollierten Pilot mit echten Nutzern verhindern.

---

### UF-0B-01 — E-Mail-Verifizierung für produktive Nutzung

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `authenticated_user`  
**Betroffene Feature-IDs:** `FC-AUTH-005`

**Auslöser:** Ein Nutzer registriert sich oder versucht, produktive Teamaktionen auszuführen.

**Grobe Schritte:**

1. Nutzer registriert sich.
2. Vereon weist auf die notwendige E-Mail-Verifizierung hin.
3. Nutzer bestätigt die E-Mail-Adresse.
4. Erst danach werden produktive Teamaktionen freigegeben.

**Ergebnis:** Unverifizierte Accounts können keine kritischen Teamaktionen ausführen.

**Offene UX-/Produktfragen:**

- Wie deutlich wird der Verifizierungsstatus im UI angezeigt?

**Festgelegt:** Login und reine Informationsansichten bleiben möglich. Mannschaft erstellen, Join-Request absenden, RSVP abgeben und andere produktive Teamaktionen sind bis zur Verifizierung gesperrt.

---

### UF-0B-02 — Passwort zurücksetzen

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `authenticated_user`  
**Betroffene Feature-IDs:** `FC-AUTH-006`

**Auslöser:** Ein Nutzer kann sich nicht mehr anmelden.

**Grobe Schritte:**

1. Nutzer öffnet den Passwort-Reset-Flow.
2. Nutzer gibt die E-Mail-Adresse ein.
3. Nutzer erhält einen Reset-Hinweis per E-Mail.
4. Nutzer setzt ein neues Passwort.
5. Nutzer kann sich wieder anmelden.

**Ergebnis:** Account-Recovery funktioniert ohne Trainer- oder Admin-Eingriff.

**Offene UX-/Produktfragen:**

- Reset-Meldungen dürfen keine Account-Existenz unnötig offenlegen.

---

### UF-0B-03 — Mannschaftsgrunddaten bearbeiten

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`  
**Betroffene Feature-IDs:** `FC-TEAM-003`

**Auslöser:** Mannschaftsgrunddaten sind falsch, unvollständig oder haben sich geändert.

**Grobe Schritte:**

1. `team_owner` öffnet die Mannschaftseinstellungen.
2. `team_owner` bearbeitet erlaubte Grunddaten.
3. Vereon speichert die Änderungen.
4. Relevante Ansichten zeigen die aktualisierten Daten.

**Ergebnis:** Grunddaten der Mannschaft können korrigiert werden, ohne eine neue Mannschaft anzulegen.

**Offene UX-/Produktfragen:**

- Muss `head_coach` diese Einstellungen sehen, aber nicht bearbeiten können?
- Welche Felder gelten als Grunddaten und welche gehören erst in MVP-1?

---

### UF-0B-04 — Co-Trainer hinzufügen

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`
**Weitere Rollen:** `assistant_coach`  
**Betroffene Feature-IDs:** `FC-ROLE-002`

**Auslöser:** Ein Team benötigt weitere operative Unterstützung im Trainerteam.

**Grobe Schritte:**

1. `team_owner` öffnet die Team-/Rollenverwaltung.
2. Eine Person wird als Co-Trainer eingeladen oder hinzugefügt.
3. Die Person erhält die Rolle `assistant_coach`.
4. `assistant_coach` kann freigegebene operative Funktionen nutzen.

**Ergebnis:** Ein Co-Trainer kann im Team mitarbeiten.

**Offene UX-/Produktfragen:**

- Erfolgt die Aufnahme über Einladungscode, E-Mail oder Auswahl bestehender Mitglieder?

Die sichtbaren Funktionen ergeben sich aus `docs/ROLES_AND_PERMISSIONS.md` und
sind keine offene Berechtigungsentscheidung dieses Flows.

---

### UF-0B-05 — Co-Trainer entfernen

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`
**Weitere Rollen:** `assistant_coach`  
**Betroffene Feature-IDs:** `FC-ROLE-003`

**Auslöser:** Ein Co-Trainer soll keinen Zugriff mehr auf die Mannschaft haben.

**Grobe Schritte:**

1. `team_owner` öffnet die Team-/Rollenverwaltung.
2. Eine bestehende `assistant_coach`-Rolle wird ausgewählt.
3. Die Entfernung wird bestätigt.
4. Die betroffene Person verliert die Co-Trainer-Berechtigung.

**Ergebnis:** Nicht mehr berechtigte Co-Trainer haben keinen operativen Zugriff mehr.

**Offene UX-/Produktfragen:**

- Wird eine entfernte Person weiterhin als normales Teammitglied geführt oder vollständig aus dem Team entfernt?

Unabhängig davon bleibt jederzeit genau ein `team_owner` erhalten.

---

### UF-0B-06 — Einladungscode erneuern oder deaktivieren

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`
**Betroffene Feature-IDs:** `FC-INVITE-008`

**Auslöser:** Ein Einladungscode wurde zu breit geteilt, ist kompromittiert oder wird nicht mehr benötigt.

**Grobe Schritte:**

1. `team_owner`, `head_coach` oder `assistant_coach` öffnet den Einladungsbereich.
2. Der aktuelle Code wird deaktiviert oder erneuert.
3. Alte Links oder Codes funktionieren nicht mehr.
4. Ein neuer Code kann geteilt werden.

**Ergebnis:** Das Trainerteam kann den Zugang zur Mannschaft kontrollieren.

**Offene UX-/Produktfragen:**

- Wie wird verhindert, dass bestehende offene Beitrittsanfragen unnötig verloren gehen?

**Festgelegt:** Der Code läuft im frühen MVP nicht automatisch ab und hat kein sichtbares Nutzungslimit. Er bleibt gültig, bis eine berechtigte Trainerrolle ihn erneuert oder deaktiviert; Erneuern macht den bisherigen Code ungültig.

---

### UF-0B-07 — Beitrittsanfrage ablehnen

**Phase:** `MVP-0B`  
**Flow-Status:** `teilweise`  
**Hauptrollen:** `team_owner`, `head_coach`
**Weitere Rollen:** `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-INVITE-007`

**Auslöser:** Eine Beitrittsanfrage ist falsch, unberechtigt oder soll nicht angenommen werden.

**Grobe Schritte:**

1. `team_owner` oder `head_coach` öffnet die offenen Beitrittsanfragen.
2. Die berechtigte Rolle wählt eine Anfrage aus.
3. Die berechtigte Rolle lehnt die Anfrage ab.
4. Der anfragende Nutzer sieht einen passenden Statushinweis.
5. Nicht benötigte Anfragedaten werden nicht als reguläre Teamdaten übernommen.

**Ergebnis:** Falsche oder unpassende Anfragen können kontrolliert beendet werden.

**Offene UX-/Produktfragen:**

- Ist eine kurze optionale Begründung sinnvoll oder erzeugt sie unnötige Konfliktfläche?
- Wie lange bleiben abgelehnte Anfragen sichtbar?

---

### UF-0B-08 — Spieler aus Team entfernen

**Phase:** `MVP-0B`  
**Flow-Status:** `bestehend`  
**Hauptrollen:** `team_owner`, `head_coach`  
**Weitere Rollen:** `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-PLAYER-002`, `FC-PLAYER-001`, `FC-TEAM-004`

**Auslöser:** Ein Spieler gehört nicht mehr zur Mannschaft oder wurde falsch zugeordnet.

**Grobe Schritte:**

1. `team_owner` oder `head_coach` öffnet die Team- oder Spielerliste.
2. Eine berechtigte Rolle wählt den betroffenen Spieler aus.
3. Vereon zeigt eine klare Bestätigung, dass der Spieler aus dieser Mannschaft entfernt wird.
4. Nach Bestätigung ist der Spieler nicht mehr aktives Teammitglied.
5. Vergangene RSVP bleiben für die Teamhistorie erhalten.
6. Zukünftige RSVP dieses Spielers erscheinen sofort nicht mehr in Zusagen oder Teilnehmerzahlen.
7. Historie und personenbezogene Daten werden nicht unkontrolliert vollständig gelöscht.

**Ergebnis:** Ein Spieler kann aus der Mannschaft entfernt werden, ohne dass daraus ein allgemeiner Lösch- oder DSGVO-Self-Service-Flow wird.

**Offene UX-/Produktfragen:**

- Muss der Unterschied zwischen „aus Team entfernen“, „archivieren“ und „vollständig löschen“ im UI deutlicher erklärt werden?
- Welche Information sieht ein betroffener `player` oder `guardian` nach der Entfernung?

---

### UF-0B-09 — Join-Hinweise und minimale Guardian-Berechtigungsbestätigung

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `guardian`, `player`  
**Betroffene Feature-IDs:** `FC-LEGAL-003`, `FC-LEGAL-004`, `FC-GUARDIAN-002`, `FC-INVITE-004`

**Auslöser:** Ein `guardian` meldet ein Kind an oder ein `player` nutzt den Join-Flow.

**Grobe Schritte:**

1. `guardian` startet den Kind-Join-Flow oder `player` startet den Self-Player-Join-Flow.
2. Vereon zeigt knappe Hinweise zur Anmeldung und Datenverarbeitung.
3. Bei Kind-Anmeldung bestätigt `guardian`, zur Anmeldung des Kindes berechtigt zu sein.
4. Erst danach kann die Beitrittsanfrage abgeschickt werden.

**Ergebnis:** Der Join-Flow enthält verständliche Hinweise. Beim Guardian werden Nutzer, Zeitpunkt und Version des bestätigten Textes gespeichert. Dies ist eine Selbsterklärung und keine Identitätsprüfung.

**Offene UX-/Produktfragen:**

- Die genaue rechtliche Formulierung gehört nicht in dieses Dokument und muss in DSGVO-/Legal-Dokumentation geprüft werden.
- Keine Uploadpflicht, digitale Signatur oder Identitätsprüfung in MVP-0B.

---

### UF-0B-10 — Legal-Seiten anzeigen

**Phase:** `MVP-0B`  
**Flow-Status:** `teilweise`  
**Hauptrollen:** `authenticated_user`  
**Betroffene Feature-IDs:** `FC-LEGAL-001`, `FC-LEGAL-002`

**Auslöser:** Ein Nutzer möchte Impressum oder Datenschutzhinweise einsehen.

**Grobe Schritte:**

1. Nutzer öffnet Impressum oder Datenschutzerklärung.
2. Vereon zeigt die jeweilige Seite an.
3. Vor externer Nutzung dürfen diese Seiten keine bloßen Platzhalter mehr sein.

**Ergebnis:** Nutzer finden grundlegende rechtliche Informationen an erwartbarer Stelle.

**Offene UX-/Produktfragen:**

- Inhaltliche Prüfung ist kein Produktflow und muss außerhalb dieses Dokuments erfolgen.

---

### UF-0B-11 — Training bearbeiten

**Phase:** `MVP-0B`  
**Flow-Status:** `umgesetzt` (lokal migriert und im vollständigen Playwright-Lauf verifiziert; bekannte rollenbezogene Testlücken siehe unten)
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`  
**Betroffene Feature-IDs:** `FC-TRAINING-003`

**Auslöser:** Ein Training wurde mit falschen oder geänderten Angaben erstellt.

**Grobe Schritte:**

1. Berechtigte Trainerrolle öffnet das Training.
2. Die Bearbeitungsfunktion wird gewählt (nicht sichtbar bei bereits abgesagtem oder bereits begonnenem Training).
3. Titel, Datum/Uhrzeit, Ort und Beschreibung werden geändert.
4. Sind bereits Rückmeldungen vorhanden, weist das Formular deutlich darauf hin, dass sie erhalten bleiben und keine automatische Benachrichtigung versendet wird; bei einer tatsächlichen Zeitänderung wird dies zusätzlich bewusst bestätigt.
5. Änderungen werden gespeichert.
6. Relevante Rollen sehen die aktualisierten Trainingsdaten auf Detailseite, Trainingsliste, Teamseite und Dashboard.

**Ergebnis:** Fehlerhafte Trainingsdaten können vor dem Training korrigiert werden, ohne bestehende RSVP zu verändern.

**Festgelegt:**

- Kernfelder (`team_id`, `club_id`, `season_id`, `created_by`, `event_type`, `is_cancelled`, `ends_at`) bleiben immer stabil und sind ab Trainingsbeginn ohnehin nicht mehr erreichbar, da die gesamte Bearbeitung ab Beginn gesperrt ist.
- Ein bereits abgesagtes Training bleibt unveränderliche Historie und ist nicht mehr bearbeitbar.
- Bestehende RSVP bleiben bei jeder Bearbeitung, auch bei Terminverschiebung, vollständig erhalten.

**Bekannte Testlücke:** `head_coach`-only und `assistant_coach`-only sind mangels legitimem App-/RPC-Weg für isolierte Testkonten nicht end-to-end verifizierbar (wie bei `FC-TRAINING-005`, abhängig von `FC-ROLE-002`).

---

### UF-0B-12 — Training löschen

**Phase:** `MVP-0B`  
**Flow-Status:** `bestehend`<br>
**Hauptrollen:** `team_owner`, `head_coach`  
**Betroffene Feature-IDs:** `FC-TRAINING-004`

**Auslöser:** Ein Training wurde irrtümlich angelegt.

**Grobe Schritte:**

1. `team_owner` oder `head_coach` öffnet das Training.
2. Löschfunktion wird gewählt.
3. Vereon zeigt statt Löschen nur Absagen an, sobald bereits eine Spieler- oder Trainer-RSVP abgegeben wurde oder der Termin begonnen hat. Automatisch angelegte, noch unbeantwortete Teilnahmezeilen zählen nicht als RSVP.
4. Ist Hard-Delete zulässig, muss die berechtigte Rolle zusätzlich einen Bestätigungstext wie `LÖSCHEN` eingeben.
5. Erst danach wird das irrtümlich angelegte Training hart gelöscht.

**Ergebnis:** Fehleingaben können entfernt werden, ohne dass falsche Termine im Teamkalender bleiben.

**Offene UX-/Produktfragen:**

- Löschen darf nicht als Ersatz für Absagen verwendet werden.
- `assistant_coach` darf absagen, aber nicht hart löschen.

**Technischer Nachweis (2026-07-21):** Lokal implementiert, migriert und im
vollständigen Playwright-Lauf 60/60 verifiziert. Der echte Rollen-E2E-Nachweis
besteht für `team_owner`-only; `head_coach`-only bleibt mangels legitimem
Testkonto-Weg offen. Die vorhandene RPC prüft Spieler-RSVP. Die noch nicht
implementierte Trainer-RSVP muss bei Einführung von `event_staff_rsvps`
zusätzlich atomar geprüft werden.

---

### UF-0B-13 — Training absagen

**Phase:** `MVP-0B`  
**Flow-Status:** `bestehend`<br>
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`  
**Betroffene Feature-IDs:** `FC-TRAINING-005`

**Auslöser:** Ein geplantes Training findet nicht statt.

**Grobe Schritte:**

1. Berechtigte Trainerrolle öffnet das Training.
2. Absagefunktion wird gewählt.
3. Optional kann eine kurze Begründung erfasst werden, falls diese Produktentscheidung bestätigt wird.
4. Das Training bleibt sichtbar, erhält aber den Status `abgesagt`.
5. Abgegebene RSVP bleiben als Historie erhalten; neue oder geänderte RSVP sind gesperrt.
6. Spieler und Guardians sehen, dass der Termin nicht stattfindet.

**Ergebnis:** Ein nicht stattfindendes Training bleibt nachvollziehbar dokumentiert, wird aber nicht mit einem normalen Training verwechselt.

**Offene UX-/Produktfragen:**

- Soll die Absagebegründung für Spieler/Guardians sichtbar sein?
- Wie prominent muss ein abgesagtes Training ohne Push-/E-Mail-Benachrichtigung angezeigt werden?

---

### UF-0B-14 — Trainer-RSVP abgeben

**Phase:** `MVP-0B`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`  
**Betroffene Feature-IDs:** `FC-RSVP-003`, `FC-RSVP-004`, `FC-RSVP-005`

**Auslöser:** Das Trainerteam muss intern wissen, welche Trainer bei einem Termin anwesend sind.

**Grobe Schritte:**

1. Trainerrolle öffnet einen Termin.
2. Trainerrolle gibt die eigene RSVP ab.
3. Der Trainer-RSVP-Status wird gespeichert.
4. Bis zum Terminbeginn kann die eigene RSVP geändert werden; danach ist sie gesperrt.
5. Trainerteam sieht Spieler-/Guardian-RSVP und Trainer-RSVP nachvollziehbar getrennt.

**Ergebnis:** Traineranwesenheit wird planbar, ohne dass Trainer als Spieler behandelt werden.

**Offene UX-/Produktfragen:**

- Wird Trainer-RSVP in derselben Übersicht wie Spieler-RSVP angezeigt oder getrennt?

Die aktiven Trainerrollen dürfen die getrennte Trainer-RSVP-Übersicht sehen.

---

### UF-0B-15 — Alte Beitrittsanfragen automatisch bereinigen

**Phase:** `MVP-0B`
**Flow-Status:** `offen`
**Hauptrollen:** `system`
**Betroffene Feature-IDs:** `FC-INVITE-009`

**Auslöser:** Eine abgelehnte oder zurückgezogene Beitrittsanfrage wird nicht mehr für den Aufnahmeprozess benötigt.

**Grobe Schritte:**

1. Nicht mehr notwendige Kinderdaten werden so früh wie möglich entfernt.
2. Spätestens 90 Tage nach Ablehnung oder Rückzug wird die Anfrage automatisiert bereinigt.
3. Die Bereinigung benötigt keine manuelle Traineraktion.

**Ergebnis:** Personen- und Kinderdaten aus erfolglosen Beitrittsprozessen bleiben nicht unbegrenzt gespeichert.

**Offene UX-/Produktfragen:** Keine. Technische Ausführung und Nachweis gehören in Datenschutz-, Security- und Statusdokumentation.

---

### UF-0B-16 — Dokumentenannahme versioniert nachweisen

**Phase:** `MVP-0B`
**Flow-Status:** `offen`
**Hauptrollen:** `authenticated_user`
**Betroffene Feature-IDs:** `FC-LEGAL-008`

**Auslöser:** Ein Nutzer registriert sich oder muss eine neue verbindliche Fassung der Nutzungsbedingungen beziehungsweise Datenschutzhinweise annehmen.

**Grobe Schritte:**

1. Vereon zeigt die gültigen Dokumente oder eindeutige Verweise darauf.
2. Der Nutzer bestätigt die Annahme.
3. Vereon speichert die jeweilige Version und den Zeitpunkt der Annahme.
4. Erst danach werden die davon abhängigen produktiven Aktionen freigegeben.

**Ergebnis:** Die angenommene Dokumentenfassung ist nachvollziehbar, ohne den juristischen Inhalt in diesem Flow festzulegen.

**Offene UX-/Produktfragen:** Der genaue Wortlaut und der Umgang mit späteren Fassungsänderungen müssen vor Pilotbetrieb juristisch geprüft werden.

---

## 7. MVP-1 — Erste real nutzbare Testversion

### 7.1 Ziel

MVP-1 erweitert den stabilisierten Einzelteam-Kern um bessere Alltagstauglichkeit.

MVP-1 wird hier bewusst als Flow-Gruppen beschrieben. Größere Blöcke wie Match, Reports, Anwesenheit und wiederkehrende Trainings brauchen vor Umsetzung eigene Teilentscheidungen.

---

### UF-1-01 — Profil-Grunddaten bearbeiten

**Phase:** `MVP-1`  
**Flow-Status:** `offen`  
**Hauptrollen:** `authenticated_user`  
**Betroffene Feature-IDs:** `FC-AUTH-007`

**Auslöser:** Ein Nutzer möchte eigene Profilgrunddaten korrigieren.

**Grobe Schritte:**

1. Nutzer öffnet das eigene Profil.
2. Nutzer bearbeitet erlaubte Grunddaten.
3. Vereon speichert die Änderungen.
4. Relevante Anzeigen verwenden die aktualisierten Daten.

**Ergebnis:** Nutzer können einfache Profilfehler selbst korrigieren.

**Offene UX-/Produktfragen:**

- Profilbearbeitung darf keine Rollen-, Team- oder Guardian-Kind-Beziehungen verändern.

---

### UF-1-02 — Dashboard, Schnellzugriffe und mobile Nutzung verbessern

**Phase:** `MVP-1`  
**Flow-Status:** `teilweise`  
**Hauptrollen:** `authenticated_user`, `head_coach`, `assistant_coach`, `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-DASHBOARD-001`, `FC-DASHBOARD-003`, `FC-DASHBOARD-004`, `FC-DASHBOARD-005`, `FC-DASHBOARD-006`, `FC-MOBILE-001`, `FC-MOBILE-002`, `FC-MOBILE-003`, `FC-NOTIFY-001`, `FC-NOTIFY-003`, `FC-NOTIFY-005`

**Auslöser:** Nutzer verwenden Vereon im Alltag regelmäßig, insbesondere mobil.

**Grobe Schritte:**

1. Nutzer öffnet Vereon auf Desktop oder Smartphone.
2. Dashboard zeigt rollenabhängig relevante Informationen und offene Aufgaben.
3. Schnellzugriffe führen zu den wichtigsten nächsten Aktionen.
4. Die mobile Nutzung ist nicht nur technisch responsive, sondern praktisch bedienbar.
5. PWA-Installierbarkeit wird als App-Icon-Nutzung geprüft.

**Ergebnis:** Vereon wird im Alltag schneller nutzbar, ohne frei konfigurierbare Widgets oder Notification-Center.

**Offene UX-/Produktfragen:**

- Welche Dashboard-Kacheln sind pro Rolle wirklich notwendig?
- Wo liegt die Qualitätsgrenze zwischen brauchbarer Mobile-UX und späterer App-Shell?

---

### UF-1-03 — Team-, Rollen- und Spieleransichten alltagstauglich machen

**Phase:** `MVP-1`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-ROLE-001`, `FC-TEAM-005`, `FC-TEAM-006`, `FC-TEAM-007`, `FC-PLAYER-004`, `FC-PLAYER-005`, `FC-PLAYER-006`

**Auslöser:** Die Mannschaft wird über längere Zeit real genutzt und braucht bessere Pflege- und Ansichtslogik.

**Grobe Schritte:**

1. Berechtigte Rollen öffnen Team-, Rollen- oder Spielerbereiche.
2. Vereon zeigt rollenabhängig passende Informationen.
3. Spieler können das eigene und Guardians das kindbezogene freiwillige vollständige Geburtsdatum sehen und korrigieren; fremde Spieler-/Kinddaten bleiben verborgen.
4. Nur `team_owner` kann eine Mannschaft archivieren; sobald Mitglieder, Termine oder Historie vorhanden sind, gibt es keinen normalen Hard-Delete-Button.
5. Primäre Teamorte können als Alltagserleichterung genutzt werden.

**Ergebnis:** Teamverwaltung wird belastbarer, ohne vollständige Vereinsverwaltung zu werden.

**Offene UX-/Produktfragen:**

- Welche Spielerdaten dürfen Spieler/Guardians selbst ändern?
- Welche sportlichen Stammdaten darf nur das Trainerteam pflegen?
- Ab wann ist Archivieren besser als Entfernen?

---

### UF-1-04 — Guardian verwaltet mehrere Kinder und Kontaktpersonen

**Phase:** `MVP-1`  
**Flow-Status:** `offen`  
**Hauptrollen:** `guardian`, `head_coach`, `assistant_coach`  
**Betroffene Feature-IDs:** `FC-GUARDIAN-004`, `FC-GUARDIAN-006`, `FC-GUARDIAN-007`, `FC-GUARDIAN-008`, `FC-LEGAL-007`

**Auslöser:** Ein Guardian hat mehrere Kinder oder relevante Kontaktpersonen müssen dokumentiert werden.

**Grobe Schritte:**

1. `guardian` öffnet den Guardian-/Kind-Bereich.
2. `guardian` verwaltet mehrere Kinder im eigenen Kontext.
3. `guardian` ergänzt begrenzte Kontaktpersonen.
4. Trainerteam sieht nur relevante Kontaktinformationen.
5. Ein freiwillig hinterlegtes vollständiges Geburtsdatum sehen der Spieler selbst beziehungsweise der Guardian des eigenen Kindes; zusätzlich sehen es aktive `team_owner`, `head_coach` und `assistant_coach` für aktive Teamspieler. Andere Spieler oder Guardians sehen es nicht.
6. Erweiterte Consent-/Berechtigungslogik wird separat abgestimmt.

**Ergebnis:** Jugendmannschaften werden alltagstauglicher unterstützt, ohne mehrere eigenständige Guardian-Accounts pro Kind zu erlauben.

**Offene UX-/Produktfragen:**

- Welche Kontaktpersonen sind sichtbar für `head_coach` und `assistant_coach`?
- Wie wird verhindert, dass private Familieninformationen gesammelt werden?

---

### UF-1-05 — Termine, Kalender und wiederkehrende Trainings verbessern

**Phase:** `MVP-1`  
**Flow-Status:** `offen`  
**Hauptrollen:** `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian`, `system`  
**Betroffene Feature-IDs:** `FC-EVENT-002`, `FC-EVENT-003`, `FC-EVENT-004`, `FC-EVENT-005`, `FC-TRAINING-006`, `FC-TRAINING-007`, `FC-TRAINING-008`, `FC-TRAINING-009`, `FC-TRAINING-010`, `FC-TRAINING-011`, `FC-TRAINING-012`, `FC-TRAINING-014`

**Auslöser:** Einzeltermine reichen im Alltag nicht mehr aus.

**Grobe Schritte:**

1. Nutzer können vergangene und kommende Termine besser unterscheiden.
2. Einfache Filter und Kalenderansicht unterstützen den Überblick.
3. Trainerteam kann Trainingsdetails und Orte besser pflegen.
4. Trainerteam kann einfache wiederkehrende Trainings erstellen.
5. Vor Erstellung von Serien wird eine klare Vorschau angezeigt.
6. Einzeltermine bleiben auch bei Serienbezug individuell nutzbar.

**Ergebnis:** Trainingsplanung wird effizienter, ohne komplexe Serienverwaltung vorwegzunehmen.

**Offene UX-/Produktfragen:**

- Wie simpel muss die erste Serienlogik bleiben?
- Welche Fehlerfälle müssen vor Massenanlage verhindert werden?

---

### UF-1-06 — RSVP-Deadline und späte Änderungen nutzen

**Phase:** `MVP-1`  
**Flow-Status:** `offen`  
**Hauptrollen:** `player`, `guardian`, `team_owner`, `head_coach`, `assistant_coach`, `system`
**Betroffene Feature-IDs:** `FC-RSVP-006`, `FC-RSVP-007`, `FC-RSVP-008`, `FC-RSVP-009`

**Auslöser:** Das Trainerteam braucht planbarere Rückmeldungen.

**Grobe Schritte:**

1. Trainerteam legt optional eine RSVP-Deadline fest.
2. Spieler oder Guardian geben RSVP ab.
3. Nach Deadline sind Änderungen nur noch mit Begründung möglich.
4. Ab Terminbeginn wird RSVP gesperrt und die Anwesenheitslogik übernimmt.

**Ergebnis:** RSVP wird planbarer und sauber von Anwesenheit getrennt.

**Offene UX-/Produktfragen:**

- Wie streng soll die Deadline wirken, ohne Eltern/Spieler unnötig zu blockieren?
- Welche Begründungstexte sind erlaubt, ohne Gesundheitsdaten zu provozieren?

---

### UF-1-07 — Anwesenheit erfassen, abschließen und wieder öffnen

**Phase:** `MVP-1`  
**Flow-Status:** `prüfen`  
**Hauptrollen:** `head_coach`, `assistant_coach`  
**Weitere Rollen:** `system`  
**Betroffene Feature-IDs:** `FC-ATTEND-001`, `FC-ATTEND-002`, `FC-ATTEND-003`, `FC-ATTEND-004`, `FC-ATTEND-005`, `FC-ATTEND-006`, `FC-ATTEND-007`, `FC-ATTEND-008`

**Auslöser:** Ein Termin hat stattgefunden und tatsächliche Anwesenheit soll dokumentiert werden.

**Grobe Schritte:**

1. Trainerteam öffnet die Anwesenheitsliste eines Termins.
2. Trainerteam erfasst Anwesenheitsstatus je Spieler.
3. Bei Verspätung kann eine einfache Minutenangabe ergänzt werden.
4. Anwesenheit kann bis zum Abschluss korrigiert werden.
5. Nach Abschluss ist normale Bearbeitung gesperrt.
6. Wiederöffnung ist nur kontrolliert möglich.

**Ergebnis:** Tatsächliche Teilnahme wird getrennt von RSVP dokumentiert.

**Offene UX-/Produktfragen:**

- Abschluss und Wiederöffnung brauchen vor Umsetzung eine eigene Entscheidung.
- Keine Gesundheitsstatus wie `injured` als MVP-Status führen.

---

### UF-1-08 — Match-MVP planen und nutzen

**Phase:** `MVP-1`  
**Flow-Status:** `prüfen`  
**Hauptrollen:** `head_coach`, `assistant_coach`, `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-MATCH-001`, `FC-MATCH-002`, `FC-MATCH-003`, `FC-MATCH-004`, `FC-MATCH-005`, `FC-MATCH-006`, `FC-MATCH-007`, `FC-MATCH-008`, `FC-MATCH-009`

**Auslöser:** Vereon soll neben Trainings auch Spiele abbilden.

**Grobe Schritte:**

1. Trainerteam erstellt ein Match mit den notwendigen Matchday-Angaben.
2. Spieler und Guardians sehen relevante Matchinformationen.
3. RSVP wird für Matches analog zum Training genutzt.
4. Match kann vor relevanten Zeitpunkten bearbeitet, gelöscht oder abgesagt werden.
5. Ergebnisanzeige hängt am Report-Modul.

**Ergebnis:** Matchday-Grundlagen werden abgebildet, ohne Kader-Nominierung, Aufstellung oder Verbandsintegration.

**Offene UX-/Produktfragen:**

- Match-MVP braucht vor Umsetzung eine eigene Produktentscheidung.
- Treffpunkt, Spielort und Spielbeginn müssen fachlich sauber getrennt werden.

---

### UF-1-09 — Spielbericht erstellen und freigeben

**Phase:** `MVP-1`  
**Flow-Status:** `prüfen`  
**Hauptrollen:** `head_coach`, `assistant_coach`, `player`, `guardian`  
**Betroffene Feature-IDs:** `FC-REPORT-001`, `FC-REPORT-002`, `FC-REPORT-003`, `FC-REPORT-004`, `FC-REPORT-005`, `FC-REPORT-006`, `FC-REPORT-007`

**Auslöser:** Nach einem Match soll ein einfacher Bericht entstehen.

**Grobe Schritte:**

1. Trainerteam erstellt oder bearbeitet einen Spielbericht.
2. Ergebnis und sachlicher Trainerkommentar werden erfasst.
3. Bericht kann als Entwurf gespeichert werden.
4. `head_coach` schließt den Bericht ab.
5. Nach Abschluss sehen Spieler und Guardians freigegebene Inhalte.

**Ergebnis:** Ein einfacher Matchbericht wird dokumentiert und kontrolliert sichtbar gemacht.

**Offene UX-/Produktfragen:**

- Reports dürfen nicht vor Match-MVP entschieden werden.
- Keine Spielerbewertungen, Einzelkritik oder detaillierte Statistikplattform im MVP.

---

### UF-1-10 — Team-Eigentümerschaft übertragen

**Phase:** `MVP-1`
**Flow-Status:** `offen`
**Hauptrollen:** `team_owner`
**Weitere Rollen:** `authenticated_user`
**Betroffene Feature-IDs:** `FC-ROLE-007`

**Auslöser:** Die administrative Verantwortung für ein Team soll dauerhaft an eine andere Person übergehen.

**Grobe Schritte:**

1. Der aktuelle `team_owner` wählt einen bereits registrierten, volljährigen und aktiven Nutzer desselben Teams.
2. Vereon zeigt die Folgen der Übertragung eindeutig an.
3. Die Zielperson bestätigt die Übernahme ausdrücklich.
4. Erst dann wird die einzige `team_owner`-Rolle übertragen.
5. Alle anderen Rollen beider Personen bleiben unverändert.

**Ergebnis:** Das Team hat weiterhin genau einen `team_owner`. War eine Person zusätzlich `head_coach`, bleibt diese Rolle erhalten, sofern sie nicht separat durch den `team_owner` entzogen oder bei der eigenen Person abgelegt wird.

**Offene UX-/Produktfragen:** Vor Umsetzung muss entschieden werden, wie Volljährigkeit mit nur verpflichtendem Geburtsjahr verlässlich und datensparsam geprüft wird. Technische Atomarität und Nachvollziehbarkeit gehören in Datenmodell, Security und Tests.

---

## 8. Post-MVP — kurze Flow-Kandidaten

Post-MVP-Flows werden hier bewusst nicht detailliert ausgearbeitet. Sie sind sinnvoll nach erstem echten Einsatz, dürfen aber MVP-0A, MVP-0B und MVP-1 nicht verdrängen.

| Flow-Kandidat | Phase | Betroffene Feature-IDs | Kurzbeschreibung | Grenze |
|---|---|---|---|---|
| Mehrteam-/Club-Verwaltung sichtbar machen | `Post-MVP` | `FC-ORG-005`, `FC-TEAM-008`, `FC-ROLE-005` | Mehrere Teams und operative Clubrollen werden sichtbar nutzbar. | Nicht vor stabiler Einzelteam-Nutzung. |
| Team-Affiliation beantragen/annehmen | `Post-MVP` | `FC-TEAM-009` | Eigenständiges Team kann später bewusst einem Verein zugeordnet werden. | Nie automatisch; Zustimmung durch `team_owner` erforderlich. |
| E-Mail-Adresse ändern | `Post-MVP` | `FC-AUTH-008` | Nutzer kann eigene E-Mail-Adresse ändern und neu verifizieren. | Sicherheitslogik nötig. |
| Einladungscodes automatisch ablaufen lassen | `Post-MVP` | `FC-INVITE-010` | Codes können später optional zeitlich begrenzt werden. | Im frühen MVP bleiben sie bis Erneuerung oder Deaktivierung gültig. |
| Allgemeine Termine mit RSVP und Kalenderexport | `Post-MVP` | `FC-EVENT-006`, `FC-EVENT-007` | Erweiterte Kalender-/Exportfunktionen. | Kein externer Kalender-Sync im MVP. |
| Echte Serienverwaltung | `Post-MVP` | `FC-TRAINING-013` | Komplexere Serienbearbeitung mit Ausnahmen. | Nicht mit MVP-1-Serienstart verwechseln. |
| Kader nominieren | `Post-MVP` | `FC-MATCH-010` | Match-Kader kann später geplant werden. | Keine Aufstellungs-/Statistikplattform im MVP. |
| Taktikboard-Grundlagen | `Post-MVP` | `FC-TACTIC-001`, `FC-TACTIC-002` | Taktikboard und einfache Formation. | Darf Training/RSVP/Anwesenheit nicht verdrängen. |
| Detaillierte Spielerstatistiken | `Post-MVP` | `FC-REPORT-008` | Erweiterte Match-Statistiken. | Hohes Scope-Creep-Risiko. |
| Notification-Center, Push, E-Mail | `Post-MVP` | `FC-NOTIFY-007`, `FC-NOTIFY-008`, `FC-NOTIFY-009`, `FC-NOTIFY-010`, `FC-MOBILE-004` | Spätere zentrale und externe Benachrichtigung. | Erst nach In-App-Hinweiskonzept und Mobile-Basis. |
| DSGVO-Self-Service | `Post-MVP` | `FC-LEGAL-006` | Späterer automatisierter Export-/Löschprozess. | Rechtlich und technisch separat klären. |

---

## 9. Later — nicht ausarbeiten

Later-Themen werden in `USER_FLOWS.md` nicht als konkrete Flows ausgearbeitet.

Dazu zählen insbesondere:

- personalisierbare Dashboard-Widgets,
- `super_admin`-Plattformrolle,
- strukturierte Gegner-/Vereinsdatenbank,
- gespeicherte und teilbare Taktiken,
- Offlinefähigkeit,
- native iOS-/Android-App,
- internes Admin-Panel,
- Future Platform Domains wie `FINANCE`, `EQUIPMENT`, `SPONSOR`, `SHOP`, `FEDERATION`.

Diese Themen dürfen erst nach separater Produktentscheidung in konkrete Features, Rollen, Datenmodelle oder Flows übersetzt werden.

---

## 10. Zentrale offene UX-/Produktfragen

Diese Fragen sind nicht alle vor der Pflege dieses Dokuments zu klären, aber sie dürfen vor Umsetzung nicht ignoriert werden.

| Bereich | Offene Frage | Relevanz |
|---|---|---|
| Guardian-Join | Exakter Wortlaut der minimalen Berechtigungsbestätigung | MVP-0B / Minderjährige / Legal |
| Co-Trainer | Aufnahme per Link, E-Mail oder bestehendem Nutzer? | MVP-0B / Rollen-UX |
| Spieler entfernen | Unterschied zwischen Entfernen, Archivieren und vollständigem Löschen klar genug? | MVP-0B / Teamverwaltung / DSGVO-Abgrenzung |
| Trainer-RSVP | Gemeinsame oder getrennte Darstellung zu Spieler-RSVP? | MVP-0B / UX |
| Mobile MVP-Qualität | Wann gilt mobile Nutzung als ausreichend pilotfähig? | MVP-0B / MVP-1 |
| Match-MVP | Welche Match-Felder sind wirklich minimal? | MVP-1 / eigene Entscheidung |
| Anwesenheit | Abschluss und Wiederöffnung vor Umsetzung klären | MVP-1 / Rollen / Audit |
| Reports | Sachlicher Bericht ohne Spielerbewertung | MVP-1 / Datenschutz / UX |
| MVP-1 Hinweise / Legal-Kontaktweg | Prüfen, ob Absagehinweise, Deadline-Hinweise, geänderte Stammdaten und Datenschutz-Kontaktweg später als eigene Flow-Ergänzung nötig sind. | MVP-1 / `FC-NOTIFY-002`, `FC-NOTIFY-004`, `FC-NOTIFY-006`, `FC-LEGAL-005` |
| Club-Struktur | Wann wird sichtbare Vereinsverwaltung wirklich benötigt? | Post-MVP / Scope-Creep |

---

## 11. Pflege-Regeln

1. Neue Produktfunktionen werden zuerst in `docs/FEATURE_CATALOG.md` gepflegt.
2. Phasen- und Scope-Entscheidungen werden danach in `docs/MVP_SCOPE.md` geprüft.
3. Erst danach werden User-Flows in `docs/USER_FLOWS.md` ergänzt oder geändert.
4. Jeder Flow muss auf Feature-Catalog-IDs verweisen.
5. `USER_FLOWS.md` darf keine technischen Implementierungsdetails aufnehmen.
6. MVP-0A und MVP-0B müssen strikt von sichtbarer Vereins-/Mehrteam-Verwaltung getrennt bleiben.
7. MVP-1-Flow-Gruppen dürfen keine Umsetzung vorwegnehmen, wenn `MVP_SCOPE.md` eine eigene Teilentscheidung fordert.
8. Post-MVP- und Later-Themen bleiben kurz, bis sie bewusst vorgezogen werden.
9. Änderungen an `USER_FLOWS.md` können Folgeprüfungen in `ROLES_AND_PERMISSIONS.md`, `DATABASE_MODEL.md`, `SECURITY.md`, `DSGVO_PRIVACY_MODEL.md` und `MVP_TEST_CHECKLIST.md` auslösen.
10. Nach einer finalen Änderung an `docs/USER_FLOWS.md` muss geprüft werden, ob
    `docs/PROJECT_BRIEF.md` oder `docs/CURRENT_TASK.md` betroffen sind.
