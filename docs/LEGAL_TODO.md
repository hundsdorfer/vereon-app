# Legal- und Datenschutz-Checkliste — Vereon

**Stand:** 2026-07-18

**Status:** offene Pre-Pilot-Checkliste

**Hinweis:** Keine Rechtsberatung. Rechtliche Bewertungen und Texte müssen durch
eine für Österreich geeignete Fachperson geprüft werden.

Produkt- und Datenmodell: `docs/DSGVO_PRIVACY_MODEL.md`

Technische Risiken: `docs/SECURITY.md` und `docs/STATUS.md`

---

## 1. Harte Pilotblocker

Solange einer dieser Punkte offen ist, bleibt `www.vereon.app` ein geschütztes
internes Entwicklungs-Deployment und wird nicht als produktions- oder
pilotbereit bezeichnet.

- [ ] Verantwortlichen, ladungsfähige Angaben und Datenschutzkontakt festlegen.
- [ ] `/legal/imprint`, `/legal/privacy` und `/legal/terms` fachanwaltlich prüfen,
  alle Platzhalter ersetzen und mit dem tatsächlichen Produkt abgleichen.
- [ ] Rechtliche Rollen und Verantwortlichkeiten von Vereon, Team/Verein,
  Supabase, Vercel und künftigem E-Mail-Anbieter klären.
- [ ] Rechtsgrundlage je Datenkategorie und Zweck festlegen; nicht pauschal
  „Einwilligung“ annehmen.
- [ ] Anforderungen für Minderjährige, Altersgrenzen und Guardian-Nachweis für
  Österreich prüfen.
- [ ] Prüfen, ob eine Datenschutz-Folgenabschätzung erforderlich ist; Ergebnis
  dokumentieren.
- [ ] Auftragsverarbeitungsverträge, Unterauftragsverarbeiter, internationale
  Datenübermittlungen und Datenregion bei Supabase/Vercel prüfen.
- [ ] Betroffenenrechte und operative Prozesse für Auskunft, Berichtigung,
  Einschränkung, Widerspruch, Export und Löschung definieren.
- [ ] Automatischen 90-Tage-Cleanup für abgelehnte und zurückgezogene
  Join-Anfragen einrichten, überwachen und testen.
- [ ] Versionierte Annahme von Terms/Privacy implementieren.
- [ ] Versionierte Guardian-Selbsterklärung implementieren: Nutzer, Zeitpunkt,
  Textversion; ausdrücklich keine Identitätsprüfung behaupten.
- [ ] Freiwilliges vollständiges Geburtsdatum einschließlich Zweck,
  Trainer-Sichtbarkeit, Information/Bestätigung und Lösch-/Ausblendelogik
  vollständig umsetzen.
- [ ] Backup-, Restore-, Rollback-, Incident- und Monitoring-Verfahren festlegen
  und mindestens die Wiederherstellung testen.
- [ ] Funktionierenden produktiven E-Mail-Versand einrichten und
  E-Mail-Verifikation für produktive Aktionen durchsetzen.

---

## 2. Abgleich der Datenschutzerklärung

Mindestens folgende tatsächlich vorhandenen oder beschlossenen Verarbeitungen
müssen berücksichtigt werden:

- registrierter Nutzer: Name, E-Mail, Geburtsjahr, optional vollständiges
  Geburtsdatum, optional Telefon, Registrierungskontext;
- Spieler/Kind: Name, Pflicht-Geburtsjahr, optional vollständiges Geburtsdatum,
  Teamzuordnung;
- Guardian-Beziehung und versionierte Berechtigungserklärung;
- Teammitgliedschaften und Rollen;
- Einladungscode und Join-Anfragen;
- Termine, RSVP-Status, optionale RSVP-Notiz und Zeitstempel;
- Annahme von Nutzungsbedingungen und Datenschutzerklärung samt Version;
- technische Auth-, Hosting-, Sicherheits- und Diagnosedaten der eingesetzten
  Dienstleister.

Für jede Kategorie sind Zweck, Rechtsgrundlage, Empfänger, Speicherdauer,
Pflicht-/Freiwilligkeitsstatus, Folgen der Nichtbereitstellung und
Betroffenenrechte zu prüfen.

---

## 3. Minderjährige und freiwilliges Geburtsdatum

- [ ] Verständliche, altersgerechte Informationen und Guardian-Informationen
  rechtlich prüfen.
- [ ] Genau klären, wann ein Spieler selbst handeln darf und wann ein Guardian
  erforderlich ist.
- [ ] Guardian-Selbsterklärung rechtlich bewerten; sie nicht als verifizierte
  Obsorge oder Identität darstellen.
- [ ] Klären, wie fehlerhafte oder unberechtigte Kind-Anmeldungen gemeldet,
  gesperrt und bereinigt werden.
- [ ] Zweck „Geburtstagsübersicht und altersbezogene Teamorganisation“ prüfen.
- [ ] Freiwilligkeit und Widerruf/Entfernung des vollständigen Geburtsdatums
  abbilden.
- [ ] Teamseitige Sichtbarkeit ausschließlich für aktive `team_owner`,
  `head_coach` und `assistant_coach` des Teams rechtlich und technisch prüfen.
- [ ] Rechtlich und technisch prüfen, dass Spieler nur das eigene Datum und
  Guardians nur das Datum des eigenen verknüpften Kindes sehen/korrigieren;
  andere Spieler und Guardians erhalten keinen Zugriff.
- [ ] Sicherstellen, dass nach Ende der Teamzuordnung nur das Geburtsjahr in
  notwendiger Historie sichtbar bleibt.

---

## 4. Aufbewahrung und Löschung

Bereits entschieden:

- abgelehnte und zurückgezogene Join-Anfragen: automatische Bereinigung nach
  90 Tagen;
- unnötige Kinderdaten: früher löschen, sobald kein legitimer Zweck mehr besteht;
- beendete Spielerzuordnung: Historie bleibt, zukünftige RSVP zählt nicht mehr;
- abgesagte Termine: sichtbar als abgesagt, keine neuen/geänderten RSVP;
- Team mit Mitgliedern, Terminen oder Historie: archivieren statt normalem
  Hard-Delete.

Noch fachlich/rechtlich festzulegen:

- [ ] Fristen für angenommene Join-Anfragen und aktive/inaktive Profile;
- [ ] Fristen für Termine, RSVP, Sicherheits- und Diagnoseprotokolle;
- [ ] Löschung/Anonymisierung in Backups;
- [ ] Account-Löschung und Auswirkungen auf Kind-, Team- und Historienbeziehungen;
- [ ] Nachweis- und gesetzliche Aufbewahrungspflichten;
- [ ] Verantwortlicher Ausführungs- und Kontrollprozess.

---

## 5. Nutzungsbedingungen und Pilotbetrieb

- [ ] Rollen und Pflichten von `team_owner`, Trainerteam, Spieler und Guardian
  verständlich festlegen.
- [ ] Klarstellen, dass ein Guardian für Richtigkeit und Berechtigung seiner
  Angaben einsteht, ohne eine nicht vorhandene Identitätsprüfung vorzutäuschen.
- [ ] Eigentumsübertragung und Folgen für Teamdaten/rechtliche Zuständigkeit
  prüfen.
- [ ] Test-/Pilotstatus, Verfügbarkeit, Support, Haftung und Änderungen rechtlich
  formulieren.
- [ ] Mindestalter und Nutzung mit/ohne eigenen Account festlegen.
- [ ] Verfahren bei Missbrauch, falschen Daten und Sicherheitsvorfällen
  beschreiben.

---

## 6. Technischer Status — nicht als erledigt missverstehen

| Punkt | Aktueller Stand |
|---|---|
| Legal-Seiten | öffentlich erreichbar, inhaltlich Platzhalter |
| E-Mail-Versand | nur Supabase-Test-/Standardversand bekannt |
| Terms-/Privacy-Nachweis | Zeitpunkte vorhanden, Textversionen fehlen |
| Guardian-Nachweis | `verified_at` vorhanden, versionierte Erklärung fehlt |
| Join-Cleanup | Datenbankfunktion vorhanden, keine automatisierte Ausführung verifiziert |
| vollständiges Spielergeburtsdatum | nullable Bestandsspalte vorhanden; Zielmodell noch nicht umgesetzt |
| Deployment | Vercel, `main` deployt automatisch; vollständiger Deployment-Schutz gewünscht |
| Datenbank | lokal Supabase in Docker; gehostet Supabase Cloud |
| Datenregion | nicht verifiziert |
| Monitoring | kein dediziertes Konzept im Repository verifiziert |
| Backup/Restore | nicht bekannt bzw. nicht verifiziert |

Die konkrete Priorität und aktuelle Implementierungsabweichungen stehen in
`docs/STATUS.md`.
