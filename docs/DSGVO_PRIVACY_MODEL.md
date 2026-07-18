# Datenschutzmodell — Vereon

**Stand:** 2026-07-18

**Zweck:** Produkt- und Technikmodell für personenbezogene Daten, insbesondere
Minderjährigendaten.

**Hinweis:** Dieses Dokument ist keine Rechtsberatung. Rechtsgrundlagen,
Verantwortlichkeiten, Altersgrenzen, Informationspflichten, Einwilligung und eine
mögliche Datenschutz-Folgenabschätzung müssen vor einem Pilotbetrieb
fachanwaltlich geprüft werden.

Offizielle Ausgangsquellen für diese Prüfung sind die
[DSGVO bei EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=de) und
die Hinweise der
[österreichischen Datenschutzbehörde zu Kindern](https://dsb.gv.at/ueber-die-datenschutzbehoerde/teens-kids).

---

## 1. Verbindliche Produktprinzipien

- **Datenminimierung:** Nur Daten mit dokumentiertem Zweck erfassen.
- **Zweckbindung:** Keine Nutzung von Spieler- oder Kinderdaten für Werbung,
  Leistungsprofile oder Weitergabe ohne neue Entscheidung und Rechtsprüfung.
- **Transparenz:** Nutzer und Guardians werden verständlich über Daten, Zweck,
  Empfänger, Sichtbarkeit und Löschung informiert.
- **Speicherbegrenzung:** Lösch- und Anonymisierungsfristen gehören zum Feature,
  nicht in einen späteren Nachtrag.
- **Zugriffsminimierung:** Aktive Beziehung und fachliche Rolle begrenzen den
  Zugriff; UI-Sichtbarkeit allein reicht nicht.
- **Nachweisbarkeit:** Rechtstext-, Privacy- und Guardian-Erklärungen werden mit
  Textversion und Zeitpunkt gespeichert.

---

## 2. Datenkategorien und Zwecke

| Kategorie | Früher MVP-Zweck | Minimale Felder / Status |
|---|---|---|
| registrierter Nutzer | Anmeldung, Zuordnung, Kommunikation | Name, E-Mail, Geburtsjahr; vollständiges Geburtsdatum optional; Telefon optional |
| Spieler/Kind | Teamzuordnung, Kalender, RSVP | Name, Geburtsjahr; vollständiges Geburtsdatum optional |
| Guardian-Beziehung | Kind verwalten und RSVP abgeben | Nutzer, Kind, aktive/verifizierte Beziehung |
| Guardian-Erklärung | dokumentieren, dass der Nutzer zur Anmeldung berechtigt zu sein erklärt | Nutzer, Zeitpunkt, Textversion |
| Teammitgliedschaft/Rollen | Autorisierung | Nutzer, Team, Status, vordefinierte Rolle |
| Join-Anfrage | kontrollierter Beitritt | Team, Antragsteller/Kind, Typ, Status, Zeitpunkte |
| Termin/RSVP | Kalender und Teilnahmeplanung | Termin, Spieler, Antwortstatus, optionale RSVP-Notiz, Zeitpunkte |
| Rechtstextannahme | Nachweis der angezeigten Fassung | Nutzer, Textart, Version, Zeitpunkt |

Kontaktdatensätze weiterer Bezugspersonen sind keine Accounts, Rollen oder
RSVP-Berechtigungen. Gesundheitsdaten, medizinische Informationen, Kinderfotos,
Adressen, freie Trainerbewertungen und Uploads gehören nicht in den frühen MVP.

---

## 3. Geburtsjahr und vollständiges Geburtsdatum

### Beschlossenes Zielmodell

- Jeder registrierte Nutzer gibt sein Geburtsjahr an.
- Jeder Spieler gibt sein Geburtsjahr an.
- Das vollständige Geburtsdatum ist in beiden Fällen freiwillig.
- Bei vorhandenem vollständigem Datum wird das Geburtsjahr daraus abgeleitet oder
  muss damit übereinstimmen.
- Kein vollständiges Datum führt zu keiner Warnung oder wiederholten Aufforderung;
  die Oberfläche zeigt dann nur das Geburtsjahr.

### Zusätzliche Grenze für Spieler

Das vollständige Spielergeburtsdatum dient ausschließlich:

1. einer Geburtstagsübersicht für das Trainerteam und
2. altersbezogener Teamorganisation.

Teamseitig ist es nur für aktive `team_owner`, `head_coach` und
`assistant_coach` des betroffenen Teams sichtbar. Vor freiwilliger Eingabe wird
klar erklärt, dass diese Rollen das Datum sehen können. Endet die aktive
Teamzuordnung, bleibt in notwendiger Teamhistorie nur das Geburtsjahr sichtbar;
der eigene Spieler-/Kind-Profilzugriff bleibt davon getrennt.
Spieler dürfen das eigene freiwillige Datum sehen und korrigieren; Guardians nur
das Datum des eigenen verknüpften Kindes. Andere Spieler und Guardians sehen es
nicht.

### Aktueller Implementierungsstand

- `profiles.date_of_birth` ist vorhanden und bei Registrierung derzeit
  verpflichtend (`src/actions/auth.ts`).
- `players.birth_year` und die nullable Bestandsspalte
  `players.date_of_birth` existieren.
- Der aktuelle Guardian-Join erfasst nur das Geburtsjahr und befüllt
  `players.date_of_birth` nicht
  (`20260702000000_players_birth_year_only.sql`).

Das Zielmodell ist damit **beschlossen, aber nicht implementiert**. Insbesondere
fehlen freiwillige Eingabe, versionierte Information/Bestätigung und die
beschriebene Sichtbarkeitsbegrenzung.

---

## 4. Minderjährige und Guardian-Modell

- Im frühen MVP ist genau ein Guardian-Account pro Kind vorgesehen.
- Der Guardian sieht nur das eigene verknüpfte Kind und dessen Termine/RSVP.
- Andere Elternkontakte und andere Kinder sind nicht automatisch sichtbar.
- Kinder ohne Account können als Spielerprofil geführt werden.
- Der Guardian muss vor Absenden des Kind-Beitritts ausdrücklich erklären, zur
  Anmeldung berechtigt zu sein.
- Zu speichern sind der erklärende Nutzer, Zeitpunkt und Version des
  Erklärungstextes.
- Diese Erklärung ist eine Selbsterklärung, keine Identitäts- oder
  Obsorgeprüfung.

`player_guardians.verified_at` ist heute ein technischer
Verknüpfungszeitpunkt. Er enthält weder die Textversion noch eine eigenständige
rechtliche Bewertung und genügt deshalb nicht dem beschlossenen Nachweismodell.

Ob und auf welcher Rechtsgrundlage Vereon Minderjährigendaten verarbeiten darf,
welche Altersgrenze gilt und welche zusätzliche elterliche Einwilligung oder
Prüfung erforderlich ist, bleibt ausdrücklich der Rechtsprüfung vorbehalten.

---

## 5. Sichtbarkeit

| Daten | Zulässige Sichtbarkeit im Zielmodell |
|---|---|
| eigenes Nutzerprofil | betroffener Nutzer; notwendige Plattformprozesse |
| eigenes Spielerprofil | verknüpfter Nutzer |
| eigenes Kindprofil | aktiver Guardian |
| Spieler-Stammdaten im Team | aktive `team_owner`, `head_coach`, `assistant_coach` |
| vollständiges Spielergeburtsdatum | Spieler für sich selbst; Guardian für das eigene verknüpfte Kind; teamseitig nur aktive `team_owner`, `head_coach`, `assistant_coach`, nach vorheriger Information/Bestätigung |
| RSVP eines Spielers | Spieler/Guardian im eigenen Kontext; aktive Trainerrollen für Teamplanung |
| Profile anderer Kinder | nicht für Spieler oder Guardians |
| Elternkontakte anderer Spieler | nicht für Spieler oder Guardians |

Teamseitige Sichtbarkeit nach einer beendeten Beziehung wird nicht aus
historischen Rollen abgeleitet. Vergangene Termin- und RSVP-Historie darf
fachlich erhalten bleiben; das vollständige Geburtsdatum wird darin nicht weiter
angezeigt. Der Spielerzugriff auf das eigene Profil und der Guardian-Zugriff auf
das eigene verknüpfte Kind werden getrennt davon behandelt.

---

## 6. Aufbewahrung und Löschung

| Daten / Ereignis | Beschlossene Behandlung | Implementierungsstand |
|---|---|---|
| abgelehnte Join-Anfrage | nach 90 Tagen automatisch löschen; unnötige Kinderdaten früher entfernen | Cleanup-Funktion vorhanden, Ausführung nicht automatisiert |
| zurückgezogene Join-Anfrage | nach 90 Tagen automatisch löschen; unnötige Kinderdaten früher entfernen | Rücknahme und Cleanup-Funktion vorhanden, automatische Ausführung fehlt |
| aktive Spielerzuordnung endet | Soft-Delete der Zuordnung; vergangene RSVP-Historie erhalten; künftige RSVP zählt nicht mehr | Spielerentfernung implementiert |
| vollständiges Geburtsdatum nach Teamende | nicht mehr im Teamkontext anzeigen; notwendige Historie nur mit Geburtsjahr | nicht implementiert |
| abgesagter Termin | sichtbar als abgesagt; keine neuen/geänderten RSVP | Absage-RPC vorhanden, App-Flow fehlt |
| Nutzerkonto löschen | Prozess, Rechtsfolgen, Aufbewahrung und Entkopplung fachanwaltlich/technisch definieren | kein bestätigter Self-Service-Prozess |
| Team archivieren | Historie erhalten; kein pauschaler Hard-Delete | Zielmodell, nicht vollständig implementiert |

Fristen für angenommene Join-Anfragen, Profile, Events, RSVP, Sicherheitslogs und
Backups sind noch nicht final festgelegt. Sie dürfen nicht erfunden werden.

---

## 7. Dienstleister und Verantwortlichkeiten

Bestätigt sind Vercel als Hostingplattform sowie Supabase für Cloud-Datenbank,
Authentifizierung und derzeitigen Test-E-Mail-Versand. Nicht verifiziert sind:

- datenschutzrechtliche Rollen von Vereon, Verein/Team, Supabase und Vercel,
- Auftragsverarbeitungsverträge,
- Supabase-Datenregion,
- Unterauftragsverarbeiter und internationale Übermittlungen,
- produktiver E-Mail-Anbieter,
- Backup-, Restore- und Löschverhalten in Sicherungen,
- technische und organisatorische Maßnahmen außerhalb des Repositories.

Diese Punkte sind Pilotblocker in `docs/LEGAL_TODO.md`; sie werden hier nicht als
erfüllt dargestellt.

---

## 8. Pilot-Abnahmekriterien

Vor echten Testnutzern müssen mindestens:

- Privacy-, Terms- und Impressumsangaben ohne Platzhalter fachanwaltlich geprüft
  sein,
- Verantwortlichkeiten und Rechtsgrundlagen je Datenkategorie feststehen,
- Guardian-Erklärung und Rechtstextannahmen versioniert gespeichert werden,
- 90-Tage-Cleanup automatisiert und überwacht sein,
- freiwilliges Geburtsdatum samt Zweck, Information, Sichtbarkeit und Löschung
  vollständig umgesetzt und negativ getestet sein,
- Betroffenenrechte, Kontaktweg, Export-, Berichtigungs- und Löschprozess
  dokumentiert sein,
- Supabase/Vercel-Verträge, Region, Unterauftragsverarbeiter und Transfers geprüft
  sein,
- Backup/Restore sowie Security-/Incident-Prozess geklärt sein,
- eine mögliche Datenschutz-Folgenabschätzung fachkundig bewertet sein.

Technische Abweichungen und Prioritäten werden in `docs/STATUS.md`, ausführbare
Szenarien in `docs/MVP_TEST_CHECKLIST.md` gepflegt.
