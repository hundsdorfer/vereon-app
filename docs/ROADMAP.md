# Roadmap — Vereon

**Stand:** 2026-07-18
**Status:** Strategische Reihenfolge; kein technischer Ist-Nachweis und kein Implementierungsauftrag

## Zweck

Diese Roadmap ordnet die nächsten Produktblöcke. Feature-Status und Phasen liegen verbindlich in `FEATURE_CATALOG.md` und `MVP_SCOPE.md`. Der technische Ist-Stand und priorisierte Abweichungen liegen in `ARCHITECTURE.md` und `STATUS.md`.

Checkboxen werden hier bewusst nicht geführt: Erledigungsstände würden die kanonischen Statusdokumente duplizieren und schnell veralten.

## Aktueller Fokus — interne Entwicklung

Vereon wird derzeit intern entwickelt. Das gehostete System unter `www.vereon.app` ist ein internes Entwicklungs-Deployment und noch kein freigegebenes Produktionssystem. Der MVP-0A-Einzelteam-Kern ist weitgehend vorhanden; Ziel ist nun ein kontrollierter, abgesicherter Übergang zu MVP-0B und später zu einem Pilot mit einer Mannschaft.

Bis es externe Tester gibt, soll das gesamte Deployment geschützt bleiben.

## 1. Pilot-Gates parallel absichern

Diese Punkte müssen vor einem externen Pilot geschlossen sein. Sie laufen
parallel zur internen MVP-0B-Produktentwicklung und blockieren nicht jede
interne Featurearbeit. Deployment-Schutz und andere unmittelbar wirksame
Sicherheitsgrenzen haben dennoch sofort Vorrang.

- Legal-Seiten durch geprüfte Inhalte ersetzen.
- Produktive Aktionen an verifizierte E-Mail-Adressen binden (`FC-AUTH-005`).
- Passwort-Reset und produktionsfähigen E-Mail-Versand klären (`FC-AUTH-006`).
- Guardian-Berechtigung mit Nutzer, Zeitpunkt und Textversion nachweisen (`FC-LEGAL-004`).
- Annahme von Nutzungsbedingungen und Datenschutzhinweisen versioniert speichern (`FC-LEGAL-008`).
- Abgelehnte und zurückgezogene Join-Requests nach 90 Tagen automatisiert bereinigen (`FC-INVITE-009`).
- Backup- und Wiederherstellungsverfahren für Supabase Cloud prüfen und dokumentieren.
- PWA-Manifest im App-Routing öffentlich korrekt ausliefern. Die vollständige
  PWA-Installierbarkeit auf iOS und Android bleibt ein MVP-1-Ziel
  (`FC-MOBILE-003`).

## 2. MVP-0B — Produktkern parallel alltagstauglich machen

Parallel zu den Pilot-Gates werden die beschlossenen fachlichen Kernlücken
geschlossen:

- Training bearbeiten, bedingt hart löschen und absagen (`FC-TRAINING-003` bis `FC-TRAINING-005`).
- Trainer-RSVP getrennt von Spieler-RSVP ermöglichen (`FC-RSVP-003`).
- Co-Trainer-Rolle ausschließlich durch `team_owner` vergeben und entziehen (`FC-ROLE-002`, `FC-ROLE-003`).
- Einladungscode für alle drei Trainerrollen anzeigen, erneuern und deaktivieren (`FC-INVITE-001`, `FC-INVITE-008`).
- Join-Requests durch `team_owner` oder `head_coach` entscheiden (`FC-INVITE-006`, `FC-INVITE-007`).
- Mannschaftsgrunddaten durch `team_owner` korrigierbar machen (`FC-TEAM-003`).
- Verpflichtendes Spieler-Geburtsjahr beibehalten und das vollständige Datum freiwillig, zweckgebunden und zugriffsbeschränkt ergänzen (`FC-PLAYER-003`).

MVP-0B bleibt eine Einzelteam-Stabilisierung. Sichtbare Club-, Mehrteam- und `club_admin`-Flows gehören nicht hierher.

## 3. MVP-1 — Nutzung über mehrere Wochen

MVP-1 wird erst nach einem stabilen MVP-0B in getrennten Blöcken geplant:

- bessere Team-, Spieler- und Dashboard-Ansichten,
- Mannschaft archivieren und Team-Eigentümerschaft bestätigt übertragen,
- mobile/PWA-Alltagstauglichkeit,
- RSVP-Deadline und klare Sperre ab Terminbeginn,
- Anwesenheit,
- einfache wiederkehrende Trainings,
- Match-MVP und Reports erst nach eigenen Scope-Entscheidungen.

Die vollständige Zuordnung steht in `MVP_SCOPE.md`. Die dort genannten Teilentscheidungen dürfen nicht durch diese Roadmap übersprungen werden.

## 4. Post-MVP

Erst nach erfolgreicher Einzelteam-Validierung werden geprüft:

- sichtbare Club-/Mehrteam-Verwaltung,
- operative `club_admin`-Flows,
- Team-Affiliation und Teamwechsel,
- Notification-Center, Push und E-Mail-Benachrichtigungen,
- Kalenderexport,
- Kader-, Taktik- und erweiterte Reportfunktionen,
- DSGVO-Self-Service.

## 5. Later

Native Apps, Offlinefähigkeit, internes Plattform-Admin-Panel und die Future Platform Domains aus `FEATURE_CATALOG.md` bleiben langfristige Kandidaten. Sie erhalten erst nach einer eigenen Produktentscheidung konkrete Features oder Umsetzungsaufträge.

## Pflege

Ändert sich eine Feature-Phase, wird zuerst `FEATURE_CATALOG.md`, danach `MVP_SCOPE.md` und erst anschließend diese Reihenfolge geprüft. Technische Erledigungsstände werden nicht hier, sondern in `STATUS.md` gepflegt.
