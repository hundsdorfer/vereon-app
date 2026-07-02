# Legal-Checkliste — Vereon

> **Diese Datei ist keine Rechtsberatung, sondern eine technische/produktseitige Checkliste für die spätere rechtliche Prüfung.**

**Stand:** 2026-06-29
**Verwandte Docs:** `docs/DSGVO_PRIVACY_MODEL.md`, `docs/SECURITY.md`

---

## 1. Status der Legal-Seiten

| Seite | Route | Status |
|-------|-------|--------|
| Datenschutzerklärung | `/legal/privacy` | Platzhalter — alle Abschnitte mit `[Platzhalter — wird ergänzt]` |
| Nutzungsbedingungen | `/legal/terms` | Platzhalter — alle Abschnitte mit `[Platzhalter — wird ergänzt]` |

Beide Seiten sind öffentlich erreichbar (kein Login erforderlich) und enthalten sichtbare Platzhalter-Hinweise im UI. Sie müssen vor echtem Pilotbetrieb mit echten Nutzern geprüft und finalisiert werden.

---

## 2. Datenschutz / DSGVO

Relevante Grundlagen: DSGVO (EU 2016/679), DSG 2018 (Österreich), Art. 8 (Minderjährige), Art. 15–20 (Betroffenenrechte), Art. 17 (Löschung).

### Checkliste

- [ ] **Verantwortlicher / Kontakt** — Name, Adresse, E-Mail-Kontakt für Datenschutzanfragen in `/legal/privacy` eintragen
- [ ] **Welche personenbezogenen Daten werden verarbeitet?** Tatsächliches Datenmodell gegen Datenschutzerklärung abgleichen:
  - Nutzerprofile: Vorname, Nachname, E-Mail, Geburtsdatum (`profiles.date_of_birth`, unverändert), Telefonnummer (falls angegeben)
  - Spielerdaten: Vorname, Nachname, Geburtsjahr (`players.birth_year`), Teamzuordnung — **Teilaspekt technisch bereinigt** seit Migration `20260702000000_players_birth_year_only`: Der Join-Flow befüllt `players.date_of_birth` nicht mehr; die Spalte bleibt nullable bestehen, ggf. vorhandene Altdaten wurden nicht rückwirkend bereinigt. Der übrige Datenschutz-/Legal-Abgleich (Zwecke, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte) ist damit **nicht** erledigt.
  - Kinderdaten: Vorname, Nachname, Geburtsjahr (über Guardian-Flow erfasst, seit `20260702000000` nur noch Jahr, kein volles Geburtsdatum mehr)
  - Guardian-/Elternbeziehung: `player_guardians.verified_at` als technischer Verknüpfungszeitpunkt; kein vollständiger Einwilligungsnachweis
  - Trainings- und RSVP-Daten: Anwesenheitsstatus, optionale Notiz, Zeitstempel
  - Einladungs- und Join-Request-Daten (temporär, Löschfrist beachten)
- [ ] **Zweck der Verarbeitung** — je Datenkategorie dokumentieren (Teamverwaltung, Anwesenheitserfassung, RSVP, Einladungsflow)
- [ ] **Rechtsgrundlage prüfen** — Einwilligung (Art. 6 Abs. 1 lit. a) vs. Vertragserfüllung (lit. b) vs. berechtigtes Interesse (lit. f) je Verarbeitungszweck
- [ ] **Speicherdauer / Löschkonzept** — Fristen je Datenkategorie definieren und in der Datenschutzerklärung angeben
- [ ] **Betroffenenrechte dokumentieren** — Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Widerspruch (Art. 21), Datenübertragbarkeit (Art. 20); Prozess für manuelle DSGVO-Requests beschreiben
- [ ] **Umgang mit Minderjährigen** — Abschnitt 5 der Datenschutzerklärung gemäß Art. 8 DSGVO ausformulieren
- [ ] **Einwilligung / Information der Erziehungsberechtigten** — dokumentieren, wie der Guardian-Einladungsflow als Einwilligungsnachweis gilt
- [ ] **Auftragsverarbeiter prüfen** — insbesondere:
  - Supabase (Datenbankhosting, Auth) → AV-Vertrag prüfen, EU-Datenspeicherort (EU-Region bei Supabase sicherstellen)
  - Vercel / Hosting-Provider → AV-Vertrag prüfen
  - E-Mail-Provider (Supabase Auth-Mails) → AV-Vertrag prüfen

---

## 3. Minderjährige

Besonderer Schutzbedarf: Viele Spieler im Amateurfußball sind unter 14 Jahren (Art. 8 DSGVO — Einwilligung durch Erziehungsberechtigte erforderlich).

- [ ] **Anforderungen für Minderjährige klären** — ab welchem Alter gilt was, österreichisches DSG 2018 beachten
- [ ] **Einwilligungs- und Informationsprozess dokumentieren** — wie und wann werden Eltern informiert, welche Daten über ihr Kind gespeichert werden
- [ ] **`player_guardians.verified_at` als Nachweis prüfen** — reicht das Setzen von `verified_at` durch den Server (via Einladungsflow) als dokumentierter Einwilligungsnachweis, oder muss ein explizites Einwilligungs-Feld ergänzt werden?
- [ ] **Datenschutz-Folgenabschätzung (DSFA)** — für Verarbeitung von Kinderdaten prüfen, ob eine DSFA nach Art. 35 DSGVO erforderlich ist

---

## 4. Löschung / Datenminimierung

- [ ] **`cleanup_expired_join_requests()` automatisieren** — Funktion existiert in der Datenbank, wird aber noch nicht automatisch aufgerufen. Offener Punkt: Scheduled Job via pg_cron oder Supabase Edge Function definieren. Ziel: abgelehnte Join-Requests nach 90 Tagen löschen (enthält Kindsdaten — DSGVO-Pflicht).
- [ ] **Löschfristen für weitere Daten definieren:**
  - Abgelehnte / abgelaufene Join-Requests (Kindsdaten): 90 Tage nach `reviewed_at`
  - Abgelaufene Einladungslinks: nach Ablaufdatum bereinigen
  - Verwaiste Spielerprofile (kein `user_id`, kein aktives Team): Frist klären
  - Alte RSVP-Daten (Event lange vorbei, Team inaktiv): Frist klären
- [ ] **Account-Löschprozess dokumentieren** — Art. 17 DSGVO; aktuell manuell durch Plattform-Admin (`auth.users` CASCADE löscht `profiles`, entkoppelt `players.user_id`); Self-Service-Löschung für spätere Phase vormerken

---

## 5. Nutzungsbedingungen

- [ ] **Rollen und Verantwortlichkeiten klären:**
  - Trainer: Welche Pflichten entstehen beim Anlegen von Spieler-/Kinderdaten?
  - Spieler: Eigenverantwortung für eigene Profildaten
  - Elternteil / Guardian: Verantwortung für Korrektheit der Kindsdaten
  - Verein (Phase 2+): Verantwortlichkeit für Vereinsdaten
- [ ] **Haftung / Verfügbarkeit / Testbetrieb** — klarstellen, dass die App im Pilotbetrieb ohne Garantien betrieben wird; Haftungsausschluss prüfen
- [ ] **Umgang mit falschen Daten** — was passiert, wenn ein Guardian falsche Kindsdaten eingibt?
- [ ] **Mindestalter für eigenen Account** — ab welchem Alter dürfen Nutzer ohne Guardian-Einwilligung einen eigenen Account anlegen?
- [ ] **Nutzung durch Minderjährige** — Self-Player können einen eigenen Account haben; Bedingungen formulieren

---

## 6. Vor Pilotbetrieb zu erledigen

| Aufgabe | Priorität | Verantwortung |
|---------|-----------|---------------|
| `/legal/privacy` finalisieren (Verantwortlichen eintragen, alle Platzhalter ersetzen) | Hoch | Rechtsanwalt + Produkt |
| `/legal/terms` finalisieren (alle Platzhalter ersetzen, rechtlich prüfen lassen) | Hoch | Rechtsanwalt + Produkt |
| AV-Vertrag mit Supabase abschließen | Hoch | Produkt |
| Supabase-Region auf EU prüfen/sicherstellen | Hoch | Technik |
| AV-Vertrag mit Vercel / Hosting abschließen | Hoch | Produkt |
| Datenverarbeitungen gegen tatsächliches Datenmodell abgleichen | Hoch | Technik + Rechtsanwalt |
| Einwilligungsprozess für Minderjährige (u14) dokumentieren / prüfen | Hoch | Rechtsanwalt |
| `cleanup_expired_join_requests()` als Scheduled Job einrichten | Mittel | Technik |
| Löschfristen je Datenkategorie definieren und dokumentieren | Mittel | Rechtsanwalt + Technik |
| Pilot-Hinweis in der App ergänzen, falls App noch im Testbetrieb ist | Niedrig | Produkt |
