# MVP-Testcheckliste — Vereon

**Stand:** 2026-07-22

**Zweck:** Manuelle und automatisierte Abnahme des Einzelteam-MVP.

**Umgebung:** Lokale Next.js-App mit lokaler Supabase-Instanz. Keine
Produktivdaten, keine Remote-Migration und kein `db push`.

Diese Datei trennt:

- **Bestandstest:** heute implementierbarer Ablauf;
- **Zieltest:** beschlossene MVP-0B-Anforderung, die erst nach Implementierung
  bestanden werden kann;
- **Pilotblocker:** muss vor echten Testnutzern bestanden sein.

Fachliche Quelle: `docs/FEATURE_CATALOG.md`, `docs/MVP_SCOPE.md`,
`docs/USER_FLOWS.md`, `docs/ROLES_AND_PERMISSIONS.md`

Technische Abweichungen: `docs/STATUS.md`

---

## 1. Testvoraussetzungen

- [ ] Docker und lokale Supabase-Container laufen.
- [ ] `.env.local` verweist auf die lokale Supabase-URL.
- [ ] Entwicklungsserver läuft.
- [ ] Testdaten sind künstlich und enthalten keine realen Minderjährigendaten.
- [ ] Browserdaten lassen sich pro Rolle isolieren.

Benötigte Konten:

| Konto | Zweck |
|---|---|
| `team_owner` + `head_coach` | Team erstellen und Kernverwaltung |
| `head_coach` ohne Owner | Rollenabgrenzung |
| `assistant_coach` | erlaubte/unerlaubte Traineraktionen |
| volljähriger Self-Player | Self-Join und eigenes RSVP |
| Guardian | Kind-Join und RSVP fürs Kind |
| fremder angemeldeter Nutzer | Mandantentrennung |
| unverifiziertes Konto | Verifikationsgrenzen |

---

## 2. Automatisierte Basisprüfungen

```text
npm run lint
npm run build
npm run test:e2e
```

- [ ] `npm run lint` ohne Fehler.
- [ ] `npm run build` ohne Fehler; dies ist zugleich der vorhandene
  TypeScript-Buildcheck.
- [ ] `npm run test:e2e` lokal mit laufender Supabase und App.
- [ ] Drei vorhandene E2E-Dateien laufen:
  `smoke.spec.ts`, `core-flow-self-player.spec.ts`,
  `core-flow-guardian.spec.ts`.

Es gibt derzeit kein separates `typecheck`-Skript und keine Unit- oder
Integrationstest-Suite. GitHub führt Lint und Build bei Push/PR nach `main` aus;
E2E ist nur manuell per `workflow_dispatch` konfiguriert.

---

## 3. Bestandstest — Auth und Registrierung

- [ ] `/register` und `/login` sind ohne Anmeldung erreichbar.
- [ ] Registrierung validiert Name, E-Mail, heutige Passwortregeln und
  verpflichtende Checkboxen serverseitig.
- [ ] Ungültige E-Mail und schwaches Passwort liefern verständliche Fehler.
- [ ] Offener Redirect bleibt nach Login/Registrierung erhalten.
- [ ] Externe oder Auth-Schleifen-Redirects werden nicht akzeptiert.
- [ ] Abmeldung beendet die Session und führt zu `/login`.
- [ ] Nicht angemeldeter Zugriff auf `/dashboard` führt zu `/login?redirect=...`.
- [ ] Öffentliche Legal-Seiten sind ohne Anmeldung erreichbar.

Aktuell verlangt die Registrierung das vollständige Geburtsdatum. Das ist ein
bekannter Widerspruch zum beschlossenen Zielmodell und wird nicht als finale
Anforderung festgeschrieben.

---

## 4. Zieltest — Verifikation, Profil und Rechtstexte

**Pilotblocker**

- [ ] Geburtsjahr ist Pflicht; vollständiges Geburtsdatum ist freiwillig.
- [ ] Bei vollständigem Datum stimmt das gespeicherte Geburtsjahr überein.
- [ ] Ohne vollständiges Datum erscheint keine Warnung oder wiederholte
  Aufforderung.
- [ ] Terms- und Privacy-Annahme speichern Nutzer, Textversion und Zeitpunkt.
- [ ] Unverifiziertes Konto darf sich anmelden und Informationsseiten sehen.
- [ ] Unverifiziertes Konto kann kein Team erstellen, keine Join-Anfrage senden
  und kein RSVP abgeben — auch nicht über direkten Server-/RPC-Aufruf.
- [ ] Verifiziertes Konto kann diese Aktionen bei sonstiger Berechtigung ausführen.
- [ ] Passwort-Reset funktioniert ohne Kontoinformationen unnötig preiszugeben.
- [ ] Produktiver E-Mail-Versand und Bestätigungslink funktionieren in einer
  kontrollierten gehosteten Testumgebung.

---

## 5. Bestandstest — Team, Einladung und Join

### Team-Erstellung

- [ ] Berechtigter Trainer erstellt ein eigenständiges Team.
- [ ] Team, aktive Mitgliedschaft sowie `team_owner` und `head_coach` entstehen
  atomar.
- [ ] Ersteller landet auf `/teams/[teamId]`.
- [ ] Fremder Nutzer kann Teamdaten weder über URL noch direkten Datenzugriff
  verwalten.

### Einladungscode

- [ ] Ein `public_code` im Format `VRN-XXXX-XXXX-XXXX` wird angezeigt.
- [ ] Join-Link und QR-Code verwenden diesen Code.
- [ ] `/join/[code]` ist ausgeloggt erreichbar.
- [ ] Ungültiger Code liefert eine verständliche Fehlermeldung, keinen
  500-Fehler.
- [ ] Ein aktiver Code bleibt ohne automatische Ablaufzeit gültig.

### Self-Join

- [ ] Self-Player sendet eine `pending`-Anfrage mit
  `request_type = 'self_player'`.
- [ ] Name wird aus dem Profil bezogen und kann nicht im Join-Formular gefälscht
  werden.
- [ ] Doppelte offene Anfrage wird verhindert.

### Guardian-/Kind-Join

- [ ] Guardian gibt Vorname, Nachname und Pflicht-Geburtsjahr des Kindes an.
- [ ] Anfrage erhält `request_type = 'guardian_child'`.
- [ ] Kind besitzt keinen eigenen Login, wenn kein `players.user_id` gesetzt ist.
- [ ] Guardian-Beziehung wird nur für das eigene Kind wirksam.
- [ ] Trainer sieht `pending`-Anfragedaten zur Prüfung; das Kind erscheint erst
  nach Annahme in der aktiven Team-Spielerliste.
---

## 6. Zieltest — Guardian-Erklärung und freiwilliges Spielergeburtsdatum

**Pilotblocker**

- [ ] Vor Kind-Join wird verständlich erklärt, welche Daten gespeichert werden
  und welche aktiven Trainerrollen sie sehen.
- [ ] Die rechtlich festgelegte Altersgrenze zwischen Self-Player- und
  Guardian-Flow wird serverseitig durchgesetzt und kann nicht über einen
  direkten RPC-Aufruf umgangen werden.
- [ ] Guardian bestätigt ausdrücklich, zur Anmeldung des Kindes berechtigt zu
  sein.
- [ ] Gespeichert sind Guardian-Nutzer, Zeitpunkt und Textversion.
- [ ] UI bezeichnet dies als Selbsterklärung, nicht als Identitäts- oder
  Obsorgeprüfung.
- [ ] Ein vollständiges Spielergeburtsdatum ist freiwillig.
- [ ] Zweckhinweis nennt nur Geburtstagsübersicht und altersbezogene
  Teamorganisation.
- [ ] Nur aktive `team_owner`, `head_coach` und `assistant_coach` desselben Teams
  sehen das vollständige Datum im Teamkontext.
- [ ] Fremdes Team und inaktive Trainerbeziehung sehen es nicht.
- [ ] Spieler kann das eigene freiwillige Datum sehen und korrigieren.
- [ ] Guardian kann das Datum des eigenen verknüpften Kindes sehen und
  korrigieren.
- [ ] Andere Spieler und Guardians sehen das Datum nicht.
- [ ] Nach Ende der aktiven Teamzuordnung wird im Team-/Historienkontext nur das
  Geburtsjahr angezeigt.
- [ ] Der eigene Spieler-/Kind-Profilzugriff bleibt davon getrennt erhalten,
  solange die eigene bzw. Guardian-Beziehung aktiv ist.

---

## 7. Bestandstest — Join-Anfragen und Spieler entfernen

- [ ] `team_owner` kann offene Anfrage annehmen und ablehnen.
- [ ] `head_coach` kann offene Anfrage annehmen und ablehnen.
- [ ] `assistant_coach` kann beides weder über UI noch direkten RPC-Aufruf.
- [ ] Annahme erzeugt eine aktive `player_team_assignments`-Zuordnung.
- [ ] Ablehnung erzeugt keine aktive Zuordnung.
- [ ] `team_owner` und `head_coach` können Spieler aus dem Team entfernen.
- [ ] `assistant_coach` kann das nicht.
- [ ] Entfernen beendet die Zuweisung, löscht aber weder Person noch vergangene
  RSVP-Historie.
- [ ] Entfernte Spieler können auf künftige Termine nicht mehr antworten.

---

## 8. Zieltest — Rollen und Eigentumsübertragung

- [ ] Nur `team_owner` vergibt oder entzieht vordefinierte Rollen.
- [ ] Es können keine granularen Einzelrechte vergeben werden.
- [ ] Es existiert jederzeit genau ein `team_owner`.
- [ ] Owner-Entzug ist nur als explizite Eigentumsübertragung möglich.
- [ ] Zielnutzer ist registriert, volljährig, aktiv im selben Team und bestätigt
  die Übernahme.
- [ ] Eigentumsübertragung ändert nur `team_owner`; andere Rollen beider Nutzer
  bleiben erhalten.
- [ ] Owner + Head Coach besitzt die Vereinigungsmenge beider Rollen.
- [ ] Entfernt dieser Nutzer seine eigene Head-Coach-Rolle, bleibt Owner erhalten.
- [ ] `team_owner`, `head_coach` und `assistant_coach` dürfen Einladungscode
  anzeigen, erneuern und deaktivieren.
- [ ] Alter Code funktioniert nach Erneuerung/Deaktivierung nicht mehr.
- [ ] `assistant_coach` darf offene Beitrittsanfragen sehen, aber weder annehmen
  noch ablehnen.

---

## 9. Bestandstest — Training und Spieler-RSVP

- [ ] `team_owner`, `head_coach` und `assistant_coach` erstellen ein Training.
- [ ] Datum/Uhrzeit werden als Wiener Lokalzeit korrekt gespeichert und angezeigt,
  einschließlich Sommer-/Winterzeit-Grenzfällen.
- [ ] Training erscheint in Liste und Detailansicht.
- [ ] Self-Player antwortet nur für sich selbst.
- [ ] Guardian antwortet nur für das verknüpfte Kind.
- [ ] Fremder Spieler/Guardian kann kein RSVP setzen.
- [ ] Antwortwerte `attending`, `declined`, `maybe` funktionieren; andere Werte
  werden abgelehnt.

---

## 10. Zieltest — Training bearbeiten, löschen und Trainer-RSVP

### Training bearbeiten (`FC-TRAINING-003`)

- [ ] Alle drei Trainerrollen dürfen ein Training bearbeiten. Implementierung
  und statischer Rollenvertrag vorhanden; echte E2E-Verifikation für zwei
  Rollen bleibt wie unten beschrieben offen.
- [x] `team_owner`-only: End-to-End-Test bestanden
  (`tests/e2e/core-flow-edit-training.spec.ts`, vollständiger Lauf 58/58 am
  2026-07-21).
- [ ] `head_coach`-only: End-to-End-Test offen/blockiert (kein legitimer
  App-/RPC-Weg für ein isoliertes Testkonto, siehe `docs/STATUS.md`,
  verknüpft mit `FC-ROLE-002`).
- [ ] `assistant_coach`-only: End-to-End-Test offen/blockiert (dito).
- [x] Statischer Rollenvertrag (`TRAINING_EDIT_ROLES`,
  `tests/e2e/trainingEditRoleContract.spec.ts`) bestanden — ersetzt NICHT die
  beiden offenen Integrationsfälle oben.
- [x] Bearbeitung ist nur vor Trainingsbeginn möglich (serverseitig geprüft
  gegen `clock_timestamp()`, nicht nur UI-Gating).
- [x] Ein bereits abgesagtes Training kann nicht mehr bearbeitet werden.
- [x] Verschieben auf eine vergangene Startzeit wird serverseitig abgelehnt.
- [x] `team_id`, `club_id`, `season_id`, `created_by`, `event_type`,
  `is_cancelled` und `ends_at` bleiben bei jeder Bearbeitung unverändert
  (strukturell durch die Funktionssignatur ausgeschlossen).
- [x] Bestehende RSVP/Attendance-Zeilen bleiben nach Bearbeitung vollständig
  erhalten, auch bei Terminverschiebung.
- [x] Sind Rückmeldungen vorhanden, zeigt das Formular einen dauerhaften
  Hinweis; bei tatsächlicher Zeitänderung ist zusätzlich eine bewusste
  Bestätigung erforderlich.
- [x] Änderungen sind auf Detailseite, Trainingsliste, Teamseite und
  Dashboard sichtbar.
- [x] Match-/Nicht-Training-Events werden von der RPC direkt abgewiesen
  (nicht nur über Seiten-`notFound()`).
- [x] Anonyme Aufrufer können `update_training()` wegen explizitem
  `REVOKE EXECUTE` nicht ausführen; der direkte lokale RPC-Test bestätigt,
  dass die Funktion für `anon` nicht bis zur internen Login-Prüfung gelangt.

### Training absagen (`FC-TRAINING-005`, bestehend)

- [x] `team_owner`-only: echter End-to-End-Test bestanden
  (`tests/e2e/core-flow-cancel-training.spec.ts`).
- [ ] `head_coach`-only: End-to-End-Test offen/blockiert (kein legitimer
  App-/RPC-Weg für ein isoliertes Testkonto, siehe `docs/STATUS.md`,
  verknüpft mit `FC-ROLE-002`).
- [ ] `assistant_coach`-only: End-to-End-Test offen/blockiert (dito).
- [x] Statischer Rollenvertrag (`TRAINING_CANCEL_ROLES`) und RPC-Code-Review
  für alle drei Rollen vorhanden — dies ersetzt NICHT die beiden offenen
  Integrationsfälle oben. `cancel_event()` prüft serverseitig symmetrisch
  `team_owner`, `head_coach` und `assistant_coach` (Code-Review gegen
  `supabase/migrations/20260629200000_add_events.sql`); der statische
  Rollenvertrag (`tests/e2e/trainingCancelRoleContract.spec.ts`) prüft nur
  den Inhalt der Konstante `TRAINING_CANCEL_ROLES`. Die produktive
  UI-Gating-Entscheidung erfolgt serverseitig über `has_team_role()` mit
  `TRAINING_CANCEL_ROLES` (Event-Detailseite) — es gibt keine eigene
  Gating-Funktion.
- [x] Abgesagtes Training bleibt sichtbar und klar markiert (Trainingsliste,
  Team- und Dashboard-Übersicht, Detailseite; `danger`-Badge „Abgesagt").
- [x] Abgesagtes Training akzeptiert keine neue oder geänderte RSVP (UI- und
  serverseitig verifiziert).
- [x] Wiederholtes Absagen eines bereits abgesagten Trainings bleibt
  konsistent (zustands-idempotent, kein Fehler).
- [ ] Nur `team_owner` und `head_coach` sehen/verwenden Hard-Delete. Lokal echt
  E2E-verifiziert für `team_owner`-only; `head_coach`-only bleibt mangels
  legitimem Testkonto-Weg offen. Rollenvertrag und RPC schließen
  `assistant_coach`/`team_manager` aus.
- [x] Hard-Delete ist ausschließlich vor Terminbeginn möglich.
- [x] Sobald eine Spieler-RSVP vorhanden ist, ist Hard-Delete gesperrt.
- [x] Sobald eine Trainer-RSVP vorhanden ist, ist Hard-Delete gesperrt. Die
  atomare RPC-Sperre und das fail-closed UI-Gating sind lokal migriert und im
  Playwright-Lauf verifiziert (`team_owner`-only).
- [x] Nach Terminbeginn ist Hard-Delete gesperrt.
- [x] Vor Hard-Delete muss exakt `LÖSCHEN` eingegeben werden; UI und RPC prüfen
  dies unabhängig voneinander.
- [x] Wenn Löschen wegen Spieler-RSVP gesperrt ist, zeigt die UI weiterhin die
  Absage statt eines funktionslosen Löschbuttons.
- [x] Änderung/Absage/Löschung wird serverseitig geprüft, nicht nur über UI.
- [ ] Spieler und Guardians können RSVP bis zum Terminbeginn ändern, danach
  nicht mehr (`respond_to_event()` prüft die Deadline noch nicht;
  `FC-RSVP-009`).
- [x] Trainer können RSVP bis zum Terminbeginn ändern, danach nicht mehr
  (`respond_to_event_as_staff()`, im Gegensatz zur Spieler-RSVP bereits
  durchgesetzt). Grenzfalltest kurz vor/nach `starts_at` im Playwright-Lauf
  verifiziert.
- [x] Trainer-RSVP liegt getrennt von Spieler-RSVP in
  `event_staff_rsvps`. Migration lokal angewendet, Test grün.
- [x] `team_owner`, `head_coach` und `assistant_coach` dürfen nur für sich
  selbst Trainer-RSVP setzen; `team_manager` bleibt ausgeschlossen. Echte E2E-
  Abdeckung ist nur für `team_owner` vorhanden und grün; die beiden übrigen
  Rollen bleiben mangels legitimer Provisionierung mit `FC-ROLE-002` offen,
  abgedeckt über den statischen Rollenvertrag.
- [x] `list_staff_rsvps_for_event()` schützt vor Enumeration, liefert aktive
  Trainer auch ohne Antwort, historische Antworten mit
  `is_active_trainer = false`, Namen trotz fehlender Fremd-`profiles`-SELECT-
  Policy und dedupliziert Mehrfachrollen. Im Playwright-Lauf verifiziert.
- [x] Gleichzeitige Aufrufe von `respond_to_event_as_staff()` und
  `delete_training()` lassen höchstens eine Operation erfolgreich enden und
  hinterlassen einen konsistenten Zustand. Paralleltest grün.
- [ ] Anwesenheitserfassung ist von RSVP getrennt.

---

## 11. Zieltest — Archivierung und Historie

- [ ] Ein Team mit Mitgliedern, Terminen oder Historie bietet keinen normalen
  Hard-Delete-Button.
- [ ] Nur `team_owner` archiviert das Team.
- [ ] Archivierung entzieht produktive Schreibrechte, erhält aber notwendige
  Historie.
- [ ] Vergangene RSVP eines entfernten Spielers bleibt historisch nachvollziehbar.
- [ ] Künftige RSVP/Teilnehmerzahlen schließen entfernte Spieler aus.
- [ ] Abgesagte Termine bleiben in Kalender/Historie sichtbar.

---

## 12. Datenschutz- und Cleanup-Tests

**Pilotblocker**

- [ ] Pending-Join-Anfrage ist nur für Antragsteller und berechtigte
  Einsichtsrollen sichtbar.
- [ ] Abgelehnte Anfrage erscheint nicht als aktiver Spieler.
- [ ] Abgelehnte und zurückgezogene Join-Anfragen werden nach 90 Tagen
  automatisch bereinigt.
- [ ] Cleanup läuft wiederholbar, protokolliert Fehler und löscht keine aktiven
  oder angenommenen Anfragen.
- [ ] Unnötige Kinderdaten werden beim frühestmöglichen fachlich sicheren Schritt
  entfernt.
- [ ] Kein Rollenwechsel macht frühere Kinderdaten unbefugt sichtbar.
- [ ] Legal-Seiten enthalten keine Platzhalter und stimmen mit realen Feldern,
  Diensten und Fristen überein.

---

## 13. Deployment-, PWA- und Betriebsabnahme

Die jeweilige Prüfung ist als Pilotblocker oder späterer Zieltest
gekennzeichnet.

- [ ] **Pilotblocker:** Vollständiges Vercel-Deployment ist während der internen Entwicklung
  geschützt.
- [ ] **Pilotblocker:** `https://vereon.app` leitet dauerhaft auf
  `https://www.vereon.app` weiter.
- [ ] **Pilotblocker:** `/manifest.webmanifest` ist im App-Routing ohne
  App-Login als Manifest erreichbar und
  liefert kein HTML.
- [ ] **MVP-1-Zieltest:** Manifest, Icons und Installierbarkeit werden auf iOS
  und Android praktisch getestet.
- [ ] Service Worker, Offline-Modus und Push werden nicht als vorhanden behauptet.
- [ ] **Pilotblocker:** Cloud-Backup-/Restore-/Rollback-Verfahren ist
  dokumentiert und getestet.
- [ ] **Pilotblocker:** Monitoring, Fehlerverantwortung und Alarmierung sind
  geklärt.
- [ ] Remote-Migrationen werden nur nach separater ausdrücklicher Freigabe
  angewendet und verifiziert.

---

## 14. Abschlussprotokoll

Ein Testlauf dokumentiert:

- Datum, Branch und Commit,
- lokale oder kontrollierte gehostete Umgebung,
- verwendete Testrollen,
- bestandene/fehlgeschlagene Abschnitte,
- Belege für Negativtests,
- offene Abweichungen mit Verweis auf `docs/STATUS.md`,
- Lint-, Build- und E2E-Ergebnis.

Frühere erfolgreiche Testläufe bleiben Git-Historie, sind aber kein Nachweis, dass
der aktuelle Stand unverändert grün ist.
