# Rollen und Berechtigungen — Vereon

**Stand:** 2026-07-18
**Status:** Verbindliches fachliches Zielmodell; Abweichungen zur Umsetzung werden in `docs/STATUS.md` geführt
**Dokumenttyp:** Rollen- und Berechtigungskonzept, kein Implementierungsauftrag

---

## 1. Zweck dieser Datei

`docs/ROLES_AND_PERMISSIONS.md` beschreibt die fachlichen Rollen, Berechtigungslinien und Nicht-Rechte von Vereon.

Diese Datei beantwortet insbesondere:

- welche Rollen im frühen Einzelteam-MVP aktiv sind,
- welche Rechte diese Rollen fachlich haben,
- welche Rechte ausdrücklich nicht vergeben werden,
- welche Rollen nur spätere Kandidaten sind,
- welche offenen Punkte später in Datenmodell, Security, DSGVO oder Tests geprüft werden müssen.

Diese Datei ist **kein** technisches Datenbank-, RLS-, Migration- oder SQL-Dokument.

---

## 2. Quellen und Vorrang

| Bereich | Primäre Datei |
|---|---|
| Fachliche Produktfunktionen und Feature-IDs | `docs/FEATURE_CATALOG.md` |
| MVP-Phasen, Scope-Grenzen und Nicht-Ziele | `docs/MVP_SCOPE.md` |
| User-Flows | `docs/USER_FLOWS.md` |
| Rollen und Berechtigungen | `docs/ROLES_AND_PERMISSIONS.md` |
| Datenmodell | `docs/DATABASE_MODEL.md` |
| Security / RLS / serverseitige Durchsetzung | `docs/SECURITY.md` |
| Datenschutz / DSGVO / Minderjährige | `docs/DSGVO_PRIVACY_MODEL.md` |
| Tests / manuelle QA | `docs/MVP_TEST_CHECKLIST.md` |
| Technischer Ist-Zustand | `docs/ARCHITECTURE.md`, `docs/STATUS.md` |
| Dauerhafte Entscheidungen | `docs/DECISION_LOG.md` |

Wenn Feature-Status, Feature-Phase oder Feature-ID im Feature-Katalog geändert werden, muss dieses Dokument mitgeprüft werden.

---

## 3. Abgrenzung

Diese Datei beschreibt **keine**:

- Datenbanktabellen,
- Spalten,
- Migrationen,
- SQL-Seeds,
- RLS-Policies,
- SECURITY-DEFINER-Funktionen,
- konkrete Server Actions,
- konkrete UI-Komponenten,
- vollständige Testfälle,
- juristischen Detailtexte.

Technische Umsetzung gehört in `docs/DATABASE_MODEL.md`, `docs/SECURITY.md`, Migrationen oder konkrete Claude-Code-Aufträge.

Datenschutzdetails, Minderjährigenlogik, Löschkonzepte und Einwilligungsnachweise gehören in `docs/DSGVO_PRIVACY_MODEL.md` und müssen vor realem Einsatz mit Minderjährigen gesondert geprüft werden.

---

## 4. Grundprinzipien

### 4.1 Server entscheidet, UI unterstützt nur

Berechtigungen müssen serverseitig geprüft werden. Clientseitige Rollenprüfung dient nur der Navigation, Sichtbarkeit und UX.

Eine Rolle darf nicht nur deshalb Zugriff erhalten, weil ein UI-Element ausgeblendet oder angezeigt wird.

### 4.2 Rollen und Rechte bleiben phasengebunden

Eine Rolle kann fachlich existieren, ohne im frühen MVP operative Rechte zu haben.

Besonders wichtig:

- MVP-0A ist der bestehende Einzelteam-Kernflow.
- MVP-0B ist Einzelteam-Stabilisierung.
- MVP-0B ist **keine** sichtbare Vereinsverwaltungsphase.
- Sichtbare Club-/Mehrteam-Verwaltung wird nicht aus technisch vorhandenen Strukturen abgeleitet.

### 4.3 Mehrfachrollen sind normal

Eine Person kann mehrere Rollen gleichzeitig haben.

Beispiele:

| Person | Mögliche Rollen |
|---|---|
| Team-Ersteller und Cheftrainer | `team_owner` + `head_coach` |
| Cheftrainer mit Spieleraccount in anderem Team | `head_coach` + `player` |
| Elternteil und Co-Trainer | `guardian` + `assistant_coach` |
| Späterer Vereinsadmin und Trainer | `club_admin` + `head_coach` |

Die Rechte ergeben sich aus der jeweils passenden Rolle im jeweiligen Kontext.

### 4.4 Keine automatische Rechteausweitung durch spätere Rollen

Spätere Kandidatenrollen wie `club_admin`, `president`, `sporting_director` oder `super_admin` dürfen nicht still in MVP-0A oder MVP-0B hineinwirken.

Wenn eine spätere Rolle operativ aktiviert werden soll, braucht das vorher eine bewusste Produkt-, Rollen-, Datenmodell- und Security-Entscheidung.

### 4.5 Datenschutz bei Minderjährigen hat Vorrang

Bei Spielern, Kindern, Guardians und Kontaktpersonen gilt Datenminimierung.

Im frühen MVP dürfen Rollen nicht dazu führen, dass unnötige Daten sichtbar werden, insbesondere:

- vollständige Geburtsdaten außerhalb eigener bzw. kindbezogener Einsicht und aktiver `team_owner`-, `head_coach`- und `assistant_coach`-Zuordnungen,
- medizinische Daten,
- private Familieninformationen,
- fremde Guardian-Kontaktdaten,
- unnötige Notizen über Minderjährige.

---

## 5. Rollen-Key-Liste

Diese Liste beschreibt fachliche Rollen-Keys. Sie ist keine SQL-Seed-Liste und keine Migrationsanweisung.

### 5.1 Aktive Rollen / Zugriffskontexte im frühen MVP

| Key | Typ | Phase | Bedeutung |
|---|---|---|---|
| `authenticated_user` | Zugriffszustand | MVP-0A | Eingeloggter Nutzer. Keine Produktrolle, aber Voraussetzung für geschützte App-Bereiche. |
| `team_owner` | Teamrolle | MVP-0A | Administrativer Eigentümer eines eigenständigen Teams. Zuständig für Teamhoheit und Team-Einstellungen. |
| `head_coach` | Teamrolle | MVP-0A | Operativ verantwortlicher Haupttrainer. Zuständig für Trainings-, Join-, Spieler- und Trainerteamverwaltung im Einzelteam-Kontext. |
| `assistant_coach` | Teamrolle | MVP-0B | Operative Co-Trainerrolle mit begrenzten Rechten. Darf mitarbeiten, aber keine kritischen Verwaltungsentscheidungen treffen. |
| `player` | Team-/Nutzungskontext | MVP-0A | Spieler mit eigenem Account. Darf eigene Termine und eigene RSVP nutzen. |
| `guardian` | Guardian-/Kind-Kontext | MVP-0A | Elternteil, Erziehungsberechtigter oder verwaltende Bezugsperson. Kindbezogene Rechte entstehen nur über Guardian-Kind-Beziehung. |
| `system` | Systemkontext | nach Bedarf | Automatisierte systemseitige Verarbeitung, keine normale Nutzerrolle. |

### 5.2 Spätere Rollen / nicht operative Rollen im frühen MVP

| Key | Typ | Früheste Relevanz | Einordnung |
|---|---|---|---|
| `club_admin` | Clubrolle | Post-MVP | Erst mit sichtbarer Club-/Mehrteam-Struktur operativ relevant. Keine operative MVP-0A-/0B-Rolle. |
| `super_admin` | Plattformrolle | Later | Interne Vereon-Plattformadministration. Sicherheitskritisch, eigene Entscheidung erforderlich. |

### 5.3 Nicht aktive oder entfernte Rollen

| Key / Rollenidee | Entscheidung |
|---|---|
| `team_manager` | Keine Rolle des fachlichen Zielmodells. Legacy-Vorkommen in Rollen-Seed, RLS oder Lesewegen sind technische Abweichungen und werden in `docs/STATUS.md` verfolgt. Eine spätere fachliche Wiedereinführung braucht eine neue Produktentscheidung. |
| `goalkeeper_coach` | Keine eigene frühe Rolle. Später höchstens Anzeige-/Spezialisierungsvariante von `assistant_coach`, aber keine eigene Rechtebasis im MVP. |
| `president`, `board_member`, `secretary`, `treasurer`, `sporting_director`, `youth_director`, `youth_coordinator`, `viewer`, `media_manager`, `facility_manager`, `equipment_manager` | Ungeprüfte spätere Vereinsrollen-Kandidaten. Keine MVP-0A-/0B-Rechte, keine Matrix, keine Umsetzung ohne spätere Club-/Mehrteam-Entscheidung. |
| `canteen_manager`, `sponsor_contact` | Keine Kernrollen. Wenn diese Bereiche später relevant werden, gehören sie in separate Module, nicht in das frühe Rollenmodell. |

---

## 6. Rollen nach Phasen

### 6.1 MVP-0A — bestehender Einzelteam-Kernflow

Aktiv relevant:

- `authenticated_user`
- `team_owner`
- `head_coach`
- `player`
- `guardian`
- `system` bei systemseitigen Abläufen

`assistant_coach` kann in einzelnen bestehenden Funktionen bereits sichtbar oder referenziert sein, wird aber als bewusst zu konsolidierende operative MVP-0B-Minimalrolle behandelt.

### 6.2 MVP-0B — Einzelteam-Stabilisierung

Zusätzlich aktiv relevant:

- `assistant_coach`

MVP-0B ergänzt insbesondere:

- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Trainer-RSVP,
- Training bearbeiten,
- Training löschen,
- Training absagen,
- Einladungscode erneuern/deaktivieren,
- Beitrittsanfragen ablehnen,
- Legal-/Join-Hinweise,
- minimale Guardian-Berechtigungsbestätigung,
- E-Mail-Verifizierung,
- Passwort-Reset.

Rollen werden im MVP nur über vordefinierte Rollen vergeben. Granulare Einzelrechte pro Nutzer sind ausdrücklich nicht vorgesehen. Rollenvergabe und Rollenentzug liegen ausschließlich beim `team_owner`.

MVP-0B ist weiterhin keine Vereinsverwaltungsphase.

### 6.3 MVP-1 — erste real nutzbare Testversion

MVP-1 erweitert die bestehenden Rollen um bessere Alltagstauglichkeit, aber nicht automatisch um neue Rollen.

MVP-1-relevante Rechteblöcke sind insbesondere:

- Profil-Grunddaten bearbeiten,
- Rollen eines Mitglieds anzeigen,
- alltagstauglichere Team-/Spieleransichten,
- mehrere Kinder und Kontaktpersonen im Guardian-Kontext,
- Trainingsdetails, Ort und einfache wiederkehrende Trainings,
- RSVP-Deadline und späte Änderungen,
- Anwesenheit,
- Match-MVP,
- einfache Reports,
- mobile/PWA-Alltagstauglichkeit.

Diese Blöcke brauchen teilweise eigene Teilentscheidungen vor Umsetzung.

### 6.4 Post-MVP

Post-MVP betrifft insbesondere:

- sichtbare Mehrteam-/Club-Verwaltung,
- operative `club_admin`-Nutzung,
- Teamwechsel,
- Team-Affiliation,
- Kader-Nominierung,
- Notification-Center,
- Push-/E-Mail-Benachrichtigungen,
- DSGVO-Self-Service.

### 6.5 Later

Later betrifft insbesondere:

- `super_admin`,
- internes Admin-Panel,
- native Apps,
- Offlinefähigkeit,
- strukturierte Gegner-/Vereinsdatenbank,
- Future Platform Domains wie Finanzen, Material, Sponsoren, Dokumente oder Verbandsintegration.

---

## 7. Kernrollen im Detail

## 7.1 `team_owner`

`team_owner` ist die administrative Eigentümerrolle eines eigenständigen Teams.

Diese Rolle ist nicht identisch mit `head_coach`, auch wenn beide Rollen in der Praxis oft derselben Person zugeordnet werden.

### Zweck

- Teamhoheit sichern.
- Team-Einstellungen kontrollieren.
- Spätere Team-Affiliation ermöglichen.
- Verhindern, dass operative Trainerrechte automatisch Eigentümerrechte werden.

### Typische Rechte im MVP-0A/0B

`team_owner` darf:

- Mannschaft erstellen,
- Mannschaft anzeigen,
- Mannschaftsgrunddaten bearbeiten,
- Mannschaft archivieren,
- Einladungscode anzeigen,
- Einladungscode erneuern oder deaktivieren,
- Beitrittsanfragen sehen,
- Beitrittsanfragen annehmen,
- Beitrittsanfragen ablehnen,
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Training erstellen,
- Training bearbeiten,
- Training löschen,
- Training absagen,
- Spieler aus Team entfernen,
- eigene Trainer-RSVP abgeben,
- die Team-Eigentümerschaft kontrolliert übertragen.

Es gibt genau einen `team_owner` pro Team. Die Rolle kann nicht normal entzogen, sondern nur atomar übertragen werden. Zielperson ist ein bereits registrierter, volljähriger und aktiver Nutzer desselben Teams und muss die Übernahme ausdrücklich bestätigen. Andere Rollen beider Personen bleiben unverändert.

Ist der `team_owner` zugleich `head_coach`, gelten die Rechte beider Rollen. Die Person darf die eigene `head_coach`-Rolle ablegen, bleibt dabei aber `team_owner`.

### Begrenzung

`team_owner` ist keine spätere Clubrolle und kein Ersatz für `club_admin`.

Wenn `team_owner` und `head_coach` getrennte Personen sind, muss bei sensiblen operativen Daten später geprüft werden, ob der reine `team_owner` alle Trainerdaten sehen darf oder ob einzelne Ansichten stärker auf `head_coach` begrenzt werden sollen.

---

## 7.2 `head_coach`

`head_coach` ist die operative Haupttrainerrolle.

### Zweck

- Trainings- und Teamalltag führen.
- Join-Requests entscheiden.
- Spieler verwalten.
- Trainerteam und Spieler-/Guardian-Kommunikation im Einzelteam-Kontext steuern.

### Typische Rechte im MVP-0A/0B

`head_coach` darf:

- Mannschaft anzeigen,
- Mannschaftsgrunddaten sehen,
- Einladungscode anzeigen,
- Einladungscode erneuern oder deaktivieren,
- Beitrittsanfragen sehen,
- Beitrittsanfragen annehmen,
- Beitrittsanfragen ablehnen,
- Training erstellen,
- Training bearbeiten,
- Training löschen,
- Training absagen,
- RSVP-Übersicht sehen,
- eigene Trainer-RSVP abgeben,
- Spieler aus Team entfernen.

### Begrenzung

`head_coach` darf nicht automatisch:

- `team_owner`-Rechte übertragen,
- Rollen vergeben oder entziehen,
- Team-Affiliation entscheiden,
- spätere Club-/Mehrteam-Verwaltung ausüben,
- Mannschaftsgrunddaten bearbeiten, sofern diese als `team_owner`-Einstellung definiert sind.

Im MVP-0B darf `head_coach` Mannschaftseinstellungen sehen, aber nicht bearbeiten.

---

## 7.3 `assistant_coach`

`assistant_coach` ist eine operative Co-Trainerrolle mit begrenzten Rechten.

Diese Rolle ist ab MVP-0B aktiv zu konsolidieren, weil Co-Trainer im Einzelteam-Alltag mitarbeiten sollen.

### Zweck

- Trainerteam operativ unterstützen.
- Trainings- und RSVP-Alltag mittragen.
- Keine kritischen Verwaltungsentscheidungen treffen.

### Typische Rechte im MVP-0B

`assistant_coach` darf:

- Mannschaft anzeigen,
- Teammitglieder im erforderlichen operativen Umfang sehen,
- Trainings anzeigen,
- Training erstellen,
- Training bearbeiten,
- Training absagen,
- Einladungscode anzeigen und teilen,
- Einladungscode erneuern oder deaktivieren,
- RSVP-Übersicht sehen,
- eigene Trainer-RSVP abgeben,
- Beitrittsanfragen sehen.

### Explizite Begrenzung

`assistant_coach` darf nicht:

- Beitrittsanfragen annehmen,
- Beitrittsanfragen ablehnen,
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Spieler aus Team entfernen,
- Training löschen,
- Mannschaftsgrunddaten bearbeiten,
- `team_owner`-Rechte übertragen,
- Team-Affiliation entscheiden,
- Club-/Mehrteam-Verwaltung ausüben.

### Begründung

`assistant_coach` soll im Alltag nützlich sein, aber nicht dieselbe Entscheidungs- und Verwaltungsverantwortung wie `head_coach` oder `team_owner` erhalten.

---

## 7.4 `player`

`player` ist ein Spieler mit eigenem Account.

### Zweck

- Eigene Termine sehen.
- Eigene RSVP abgeben.
- Eigene relevanten Team- und Spielerinformationen sehen.

### Typische Rechte im MVP-0A/0B

`player` darf:

- eigene relevanten Termine sehen,
- eigene RSVP abgeben,
- eigenen RSVP-Status sehen,
- reduzierte Team-/Mitgliederinformationen sehen,
- eigene Stammdaten im vorgesehenen Umfang bereitstellen.

### Begrenzung

`player` darf nicht:

- fremde Guardian-Kontaktdaten sehen,
- fremde Kinder-/Spielerprofile im Detail sehen,
- Trainer-RSVP verwalten,
- andere Spieler-RSVP ändern,
- Anwesenheit erfassen,
- Team-, Rollen- oder Einladungseinstellungen ändern.

---

## 7.5 `guardian`

`guardian` ist ein Guardian-/Kind-Kontext, keine allgemeine Teamverwaltungsrolle.

Kindbezogene Rechte entstehen nur über eine gültige Guardian-Kind-Beziehung.

### Zweck

- Kind über Join-Flow anmelden.
- RSVP für eigenes Kind abgeben.
- Kindbezogene Termine und relevante Hinweise sehen.
- Im MVP-1 ggf. mehrere Kinder und Kontaktpersonen verwalten.

### Typische Rechte im MVP-0A/0B

`guardian` darf:

- ein Kind über den Join-Flow anmelden,
- notwendige Kinddaten im Join-Flow angeben,
- minimale Berechtigungsbestätigung abgeben,
- RSVP für eigenes Kind abgeben,
- kindbezogene Termine sehen,
- eigenen Guardian-/Kind-Kontext sehen.

### Begrenzung

`guardian` darf nicht:

- RSVP für fremde Kinder abgeben,
- fremde Kinderprofile sehen,
- fremde Guardian-Kontaktdaten sehen,
- allgemeine Teamverwaltung nutzen,
- Spieler entfernen,
- Trainer- oder Teamrechte ausüben,
- mehrere eigenständige Guardian-Accounts pro Kind erzwingen.

---

## 7.6 Kontaktpersonen

Kontaktpersonen sind keine Nutzerrolle.

Kontaktpersonen sind im MVP-1 höchstens begrenzte Datensätze im Guardian-Kontext.

Sie haben:

- keinen eigenen Login,
- keine eigene App-Rolle,
- keine eigenen RSVP-Rechte,
- keine Teamverwaltungsrechte,
- keine automatische Sichtbarkeit für andere Eltern oder Spieler.

Kontaktpersonen dürfen nicht als Hintertür für mehrere Guardian-Accounts pro Kind verwendet werden.

---

## 7.7 `club_admin`

`club_admin` ist eine spätere Club-/Mehrteam-Rolle.

### Einordnung

`club_admin` ist architektonisch vorgesehen, aber im frühen MVP nicht operativ relevant.

Im MVP-0A und MVP-0B gilt:

- keine sichtbare Vereinsverwaltung,
- keine operative `club_admin`-Workflows,
- kein Club-Dashboard,
- keine sichtbare Mehrteam-Verwaltung,
- keine Team-Affiliation.

### Früheste operative Relevanz

`club_admin` wird frühestens Post-MVP mit sichtbarer Club-/Mehrteam-Struktur relevant.

Vor operativer Aktivierung müssen mindestens geklärt werden:

- Club-/Mehrteam-UX,
- Team-Affiliation,
- Verhältnis `club_admin` zu `team_owner`,
- Zugriff auf Minderjährigendaten über Teamgrenzen hinweg,
- Audit und Rollenänderungen,
- DSGVO-/Datenschutzmodell.

---

## 7.8 `super_admin`

`super_admin` ist eine spätere interne Plattformrolle.

Diese Rolle ist kein normales Vereins- oder Teamfeature.

Vor jeder Umsetzung braucht es eine eigene Security- und Produktentscheidung.

Insbesondere sind im frühen MVP nicht enthalten:

- internes Admin-Panel,
- Impersonation,
- direkter Datenbankzugriff über ein Admin-UI,
- freie Bearbeitung fremder Vereins-, Team- oder Nutzerdaten.

---

## 7.9 Verbindliche Querschnittsregeln

### Rollenverwaltung und Eigentum

- Es gibt genau einen `team_owner`.
- Nur `team_owner` darf vordefinierte Teamrollen vergeben oder entziehen.
- Granulare Einzelrechte pro Nutzer sind vorerst nicht vorgesehen.
- Eigentum wird ausschließlich über den bestätigten Transfer an einen registrierten, volljährigen und aktiven Nutzer desselben Teams übertragen.
- Vor Umsetzung des Transfers muss geklärt werden, wie die Volljährigkeit trotz nur verpflichtendem Geburtsjahr verlässlich und datensparsam geprüft wird.
- Ein Nutzer mit mehreren Rollen erhält die Vereinigungsmenge dieser Rollen. Der Verlust einer Rolle verändert andere Rollen nicht automatisch.

### Trainings löschen und absagen

- `team_owner` und `head_coach` dürfen ein Training nur vor Beginn und nur ohne abgegebene Spieler- oder Trainer-RSVP hart löschen. Automatisch angelegte, noch unbeantwortete Teilnahmezeilen zählen dabei nicht als RSVP.
- Hard-Delete verlangt zusätzlich eine bewusste Texteingabe wie `LÖSCHEN`.
- Sobald der Termin begonnen hat oder eine RSVP abgegeben wurde, ist Hard-Delete gesperrt.
- `team_owner`, `head_coach` und `assistant_coach` dürfen absagen.
- Abgesagte Trainings bleiben sichtbar; abgegebene RSVP bleiben als Historie erhalten und können nicht mehr neu abgegeben oder geändert werden.

### RSVP

- Spieler, Guardians und Trainer dürfen die eigene RSVP bis zum relevanten Terminbeginn ändern.
- Danach ist RSVP gesperrt und eine spätere Anwesenheitserfassung ist fachlich getrennt.
- Wird ein Spieler aus dem Team entfernt, bleiben vergangene RSVP in der Historie; zukünftige RSVP zählen sofort nicht mehr zu Zusagen oder Teilnehmerzahlen.

### Geburtsdaten

- Das Geburtsjahr ist für jeden Spieler Pflicht.
- Das vollständige Geburtsdatum ist freiwillig. Wird es angegeben, muss das Geburtsjahr daraus abgeleitet werden oder dazu passen.
- Das vollständige Datum dient ausschließlich Geburtstagsübersicht und altersbezogener Teamorganisation.
- Sichtbar und korrigierbar ist es für den Spieler selbst beziehungsweise für den Guardian des eigenen Kindes. Zusätzlich sehen es aktive `team_owner`, `head_coach` und `assistant_coach` des jeweiligen Teams.
- Vor der freiwilligen Angabe muss verständlich über Zweck und Sichtbarkeit informiert werden; die Eingabe ist ausdrücklich zu bestätigen.
- Ohne vollständiges Datum wird nur das Geburtsjahr ohne Warnung oder wiederholte Aufforderung angezeigt.
- Nach Ende der aktiven Teamzuordnung bleibt in notwendiger Historie nur das Geburtsjahr sichtbar.

---

## 8. `team_owner` vs. `head_coach`

| Merkmal | `team_owner` | `head_coach` |
|---|---|---|
| Kernzweck | Administrative Teamhoheit | Operative Trainings-/Teamleitung |
| Entsteht bei Team-Erstellung | Ja | Standardmäßig ja, sofern Ersteller auch Trainerrolle übernimmt |
| Mannschaftsgrunddaten bearbeiten | Ja | Nein, nur sehen |
| Mannschaft archivieren | Ja | Nein |
| Trainings erstellen | Ja | Ja |
| Trainings bearbeiten | Ja | Ja |
| Trainings löschen | Ja | Ja |
| Trainings absagen | Ja | Ja |
| RSVP-Übersicht sehen | Ja, im Einzelteam-MVP zulässig | Ja |
| Eigene Trainer-RSVP abgeben | Ja | Ja |
| Beitrittsanfragen entscheiden | Ja | Ja |
| Co-Trainer hinzufügen/entfernen | Ja | Nein |
| Spieler aus Team entfernen | Ja | Ja |
| Team-Affiliation entscheiden | Später ja | Nein |
| `team_owner`-Rechte übertragen | Ja, nur bestätigter Transfer | Nein |
| Club-/Mehrteam-Verwaltung | Nein | Nein |

**Leitlinie:**  
`team_owner` schützt administrative Teamhoheit. `head_coach` führt den operativen Teamalltag. Beide Rollen können zusammenfallen, dürfen aber fachlich nicht gleichgesetzt werden.

---

## 9. `assistant_coach` vs. `head_coach`

| Merkmal | `head_coach` | `assistant_coach` |
|---|---|---|
| Operative Trainingsrolle | Ja | Ja |
| Training erstellen | Ja | Ja |
| Training bearbeiten | Ja | Ja |
| Training absagen | Ja | Ja |
| Training löschen | Ja | Nein |
| RSVP-Übersicht sehen | Ja | Ja |
| Eigene Trainer-RSVP abgeben | Ja | Ja |
| Beitrittsanfragen sehen | Ja | Ja |
| Beitrittsanfragen annehmen | Ja | Nein |
| Beitrittsanfragen ablehnen | Ja | Nein |
| Co-Trainer hinzufügen | Nein | Nein |
| Co-Trainer entfernen | Nein | Nein |
| Spieler entfernen | Ja | Nein |
| Mannschaftsgrunddaten bearbeiten | Nein | Nein |
| Einladungscode anzeigen/teilen | Ja | Ja |
| Einladungscode erneuern/deaktivieren | Ja | Ja |
| Teamhoheit | Nein | Nein |

**Leitlinie:**  
`assistant_coach` darf operativ helfen, aber keine Aufnahme-, Rollen-, Lösch- oder Eigentumsentscheidungen treffen.

---

## 10. Spieler, Guardian, Kind und Kontaktperson

Diese Begriffe müssen strikt getrennt bleiben.

| Begriff | Bedeutung | Account? | Eigene App-Rechte? |
|---|---|---:|---:|
| `player` | Spieler mit eigenem Account | Ja | Ja, eigene Spielerrechte |
| Kind / Spielerprofil | Minderjähriger oder verwalteter Spieler im Team | Nicht zwingend | Nein, wenn über Guardian verwaltet |
| `guardian` | Elternteil / Erziehungsberechtigter / verwaltende Bezugsperson | Ja | Ja, aber nur kindbezogen |
| Kontaktperson | Weitere Bezugsperson im Guardian-Kontext | Nein | Nein |

### 10.1 Spieler mit eigenem Account

Ein volljähriger oder eigenständig nutzender Spieler kann eigene RSVP abgeben und eigene relevante Termine sehen.

### 10.2 Guardian mit Kind

Ein Guardian verwaltet ein Kind im eigenen Kontext und darf kindbezogene Aktionen ausführen.

### 10.3 Kind / Spielerprofil

Ein Kind ist nicht automatisch ein eigener Nutzeraccount.

Das Spielerprofil enthält ein verpflichtendes Geburtsjahr. Das vollständige Geburtsdatum ist freiwillig und unterliegt den Zweck-, Informations- und Sichtbarkeitsgrenzen aus Abschnitt 7.9. Medizinische Daten oder unnötige private Angaben gehören nicht in den frühen MVP.

### 10.4 Kontaktperson

Kontaktpersonen sind reine Zusatzinformationen im Guardian-Kontext und dürfen keine eigene Rollenlogik erzeugen.

---

## 11. Unverifizierte Accounts

E-Mail-Verifizierung ist MVP-0B.

Bis zur Verifizierung dürfen Nutzer nur eingeschränkte Bereiche nutzen.

### Erlaubt für unverifizierte Nutzer

- Registrierung abschließen,
- Login versuchen,
- Verifizierungshinweise sehen,
- E-Mail-Verifizierung durchführen,
- Passwort-Reset nutzen,
- Legal-Seiten sehen.

### Nicht erlaubt für unverifizierte Nutzer

- produktive Teamaktionen ausführen,
- Mannschaft erstellen,
- Join-Request abschicken,
- RSVP abgeben,
- Trainings erstellen oder bearbeiten,
- Beitrittsanfragen bearbeiten,
- Rollen ändern,
- Einladungscode verwalten.

Die genaue technische Durchsetzung gehört in `docs/SECURITY.md`.

---

## 12. Berechtigungsmatrix MVP-0A / MVP-0B

Diese Matrix beschreibt die fachliche Zielberechtigung für MVP-0A/0B. Sie ersetzt keine RLS-Policy und keine Implementierungsprüfung.

Legende:

| Symbol | Bedeutung |
|---|---|
| ✓ | erlaubt |
| — | nicht erlaubt |
| eingeschränkt | nur im beschriebenen Kontext |
| später | nicht MVP-0A/0B |

| Aktion | `team_owner` | `head_coach` | `assistant_coach` | `player` | `guardian` | `club_admin` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Mannschaft erstellen | ✓ | ✓* | — | — | — | später |
| Mannschaft anzeigen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Mannschaftsgrunddaten sehen | ✓ | ✓ | eingeschränkt | — | — | später |
| Mannschaftsgrunddaten bearbeiten | ✓ | — | — | — | — | später |
| Mannschaft archivieren | ✓ | — | — | — | — | später |
| Teammitglieder anzeigen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Spieler im Team anzeigen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Spieler aus Team entfernen | ✓ | ✓ | — | — | — | später |
| Co-Trainer hinzufügen | ✓ | — | — | — | — | später |
| Co-Trainer entfernen | ✓ | — | — | — | — | später |
| Einladungscode anzeigen/teilen | ✓ | ✓ | ✓ | — | — | später |
| Einladungscode erneuern/deaktivieren | ✓ | ✓ | ✓ | — | — | später |
| Join-Link verwenden | — | — | — | ✓ | ✓ | — |
| Self-Player-Join starten | — | — | — | ✓ | — | — |
| Kind per Guardian-Join anmelden | — | — | — | — | ✓ | — |
| Beitrittsanfragen sehen | ✓ | ✓ | ✓ | — | — | später |
| Beitrittsanfrage annehmen | ✓ | ✓ | — | — | — | später |
| Beitrittsanfrage ablehnen | ✓ | ✓ | — | — | — | später |
| Training erstellen | ✓ | ✓ | ✓ | — | — | später |
| Training anzeigen | ✓ | ✓ | ✓ | ✓ | eingeschränkt | später |
| Training bearbeiten | ✓ | ✓ | ✓ | — | — | später |
| Training hart löschen | eingeschränkt* | eingeschränkt* | — | — | — | später |
| Training absagen | ✓ | ✓ | ✓ | — | — | später |
| Eigene Spieler-RSVP abgeben | — | — | — | ✓ | — | — |
| RSVP für eigenes Kind abgeben | — | — | — | — | ✓ | — |
| Eigene Trainer-RSVP abgeben | ✓ | ✓ | ✓ | — | — | später |
| RSVP-Übersicht sehen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Fremde Spieler-RSVP ändern | — | — | — | — | — | — |
| Vollständiges Spieler-Geburtsdatum sehen | eingeschränkt** | eingeschränkt** | eingeschränkt** | eigenes | eigenes Kind | später |
| Team-Eigentümerschaft übertragen | ✓ | — | — | — | — | später |
| Legal-Seiten sehen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Join-Hinweise sehen | — | — | — | ✓ | ✓ | — |
| Guardian-Berechtigungsbestätigung abgeben | — | — | — | — | ✓ | — |
| Club-/Mehrteam-Verwaltung | — | — | — | — | — | später |
| Team-Affiliation | später | — | — | — | — | später |

\* Hard-Delete nur vor Beginn, ohne abgegebene Spieler- oder Trainer-RSVP und nach zusätzlicher Texteingabe.
\** Nur freiwillig hinterlegtes Datum bei aktiver Teamzuordnung; Zweck und Sichtbarkeit müssen vor Eingabe bestätigt werden. Für Mannschaft erstellen gilt: Der Team-Ersteller erhält im bestehenden Flow typischerweise `team_owner` und `head_coach`.

---

## 13. Explizite Nicht-Rechte

Dieser Abschnitt ist bewusst redundant zur Matrix. Er soll verhindern, dass Claude oder spätere Umsetzungen Rechte aus Gewohnheit oder alter Dokumentation erweitern.

### 13.1 `assistant_coach` darf nicht

- Beitrittsanfragen annehmen,
- Beitrittsanfragen ablehnen,
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Spieler aus Team entfernen,
- Training löschen,
- Mannschaftsgrunddaten bearbeiten,
- Team-Affiliation entscheiden,
- `team_owner`-Rechte übertragen,
- Club-/Mehrteam-Verwaltung nutzen.

### 13.2 `head_coach` darf nicht automatisch

- `team_owner`-Rechte übertragen,
- Rollen vergeben oder entziehen,
- Team-Affiliation entscheiden,
- sichtbare Club-/Mehrteam-Verwaltung ausüben,
- vollständige Vereinsverwaltung starten,
- `super_admin`-Funktionen nutzen.

### 13.3 `team_owner` darf nicht automatisch

- als `club_admin` handeln,
- mehrere Teams eines Vereins verwalten,
- Club-Dashboard-Funktionen nutzen,
- Plattformadmin-Funktionen nutzen.

### 13.4 `player` darf nicht

- fremde RSVP ändern,
- fremde Guardian-Kontaktdaten sehen,
- fremde Kinderprofile sehen,
- Trainerteamfunktionen ausführen,
- Anwesenheit erfassen,
- Team- oder Rollenverwaltung nutzen.

### 13.5 `guardian` darf nicht

- RSVP für fremde Kinder abgeben,
- fremde Kinderprofile sehen,
- fremde Guardian-Kontaktdaten sehen,
- private Familieninformationen anderer Nutzer sehen,
- Trainer- oder Teamverwaltungsrechte nutzen,
- als Kontaktperson eigene App-Rechte erhalten.

### 13.6 `club_admin` darf im MVP-0A/0B nicht

- operative Club-/Mehrteam-Verwaltung ausüben,
- mehrere Teams sichtbar verwalten,
- Team-Affiliation steuern,
- als Ersatz für `team_owner` oder `head_coach` im Einzelteam-MVP dienen.

### 13.7 `super_admin` darf im MVP nicht

- als normales Produktfeature erscheinen,
- Impersonation nutzen,
- direkte Datenbankansicht im Produkt erhalten,
- ohne eigene Security-Entscheidung fremde Daten bearbeiten.

---

## 14. MVP-1-Rechteblöcke — nur Ausblick, kein Umsetzungsauftrag

Diese Rechteblöcke sind nicht Teil der verbindlichen MVP-0A/0B-Matrix. Sie dienen als Orientierung für spätere Konsolidierung.

### 14.1 Spieler- und Teamdaten

MVP-1 kann erlauben:

- `player` und `guardian` bearbeiten eigene bzw. kindbezogene Stammdaten im erlaubten Umfang.
- `head_coach` und `assistant_coach` pflegen sportliche Stammdaten wie Position oder Rückennummer.
- Trainerteam sieht Hinweise bei geänderten Stammdaten.

Nicht enthalten:

- freie Änderung sensibler Daten,
- medizinische Daten,
- verpflichtendes vollständiges Geburtsdatum oder eine weitergehende Nutzung außerhalb der festgelegten Zwecke,
- private Notizen über Kinder.

### 14.2 Guardian und Kontaktpersonen

MVP-1 kann erlauben:

- ein Guardian verwaltet mehrere Kinder,
- ein Guardian pflegt begrenzte Kontaktpersonen,
- Trainerteam sieht nur relevante Kontaktinformationen.

Nicht enthalten:

- mehrere eigenständige Guardian-Accounts pro Kind,
- Kontaktpersonen mit Login,
- Kontaktpersonen mit RSVP-Rechten,
- umfangreiche Familieninformationen.

### 14.3 Anwesenheit

MVP-1 kann erlauben:

- `head_coach` und `assistant_coach` sehen Anwesenheitslisten,
- `head_coach` und `assistant_coach` erfassen Anwesenheit,
- `head_coach` und `assistant_coach` schließen Anwesenheit ab,
- nur `head_coach` öffnet abgeschlossene Anwesenheit wieder.

Vor Umsetzung müssen Abschluss, Wiederöffnung und Audit geklärt werden.

### 14.4 Match und Reports

MVP-1 kann erlauben:

- `head_coach` und `assistant_coach` erstellen und bearbeiten Matches,
- `head_coach` und `assistant_coach` erstellen Reports,
- nur `head_coach` schließt Reports final ab,
- `player` und `guardian` sehen nur freigegebene Inhalte.

Vor Umsetzung braucht es eine eigene Match-MVP-Entscheidung.

### 14.5 Wiederkehrende Trainings

MVP-1 kann erlauben:

- `team_owner`, `head_coach` und `assistant_coach` erstellen einfache Trainingsserien,
- Einzeltermine bleiben individuell nutzbar,
- echte Serienverwaltung bleibt Post-MVP.

---

## 15. Spätere Club-/Vereinsrollen

Alte Vereinsrollen bleiben nur als ungeprüfte Kandidaten erhalten.

Sie dürfen nicht als bestehende Produktentscheidung gelesen werden.

| Kandidat | Mögliche spätere Bedeutung | Status |
|---|---|---|
| `president` | Obmann/Obfrau oder Vereinsleitung | ungeprüft |
| `board_member` | Vorstand | ungeprüft |
| `secretary` | Schriftführung / Verwaltung | ungeprüft |
| `treasurer` | Kassier / Finanzen | ungeprüft, Future Domain `FINANCE` |
| `sporting_director` | sportliche Leitung über mehrere Teams | ungeprüft |
| `youth_director` | Jugendleitung | ungeprüft |
| `youth_coordinator` | Nachwuchskoordination | ungeprüft |
| `viewer` | lesender Zugriff auf freigegebene Inhalte | ungeprüft |
| `media_manager` | Medienrolle | ungeprüft, Scope-Creep-Risiko |
| `facility_manager` | Platz-/Anlagenrolle | ungeprüft, Future Domain `FACILITY` |
| `equipment_manager` | Materialrolle | ungeprüft, Future Domain `EQUIPMENT` |

Vor Aktivierung dieser Rollen braucht es eine neue Produktentscheidung zur sichtbaren Club-/Mehrteam-Struktur.

---

## 16. Entfernte oder bewusst nicht aktive Rollen

### 16.1 `team_manager`

`team_manager` wird im aktuellen Rollenmodell nicht fortgeführt.

Begründung:

- Die neuen Dokumente führen operative Trainerteam-Rechte über `head_coach` und `assistant_coach`.
- Anwesenheit, Training und RSVP brauchen keine zusätzliche Betreuerrolle im frühen MVP.
- Eine unklare `team_manager`-Rolle würde Scope-Creep und Datenschutzrisiken erzeugen.

Eine spätere Wiedereinführung ist möglich, braucht aber eine eigene Entscheidung:

- Welche Aufgaben hat `team_manager`?
- Ist die Rolle Trainerteam, Organisation oder Betreuung?
- Welche Daten darf sie sehen?
- Darf sie Anwesenheit erfassen?
- Hat sie Zugriff auf Guardian-/Kinddaten?

### 16.2 `goalkeeper_coach`

`goalkeeper_coach` wird nicht als eigene Berechtigungsrolle geführt.

Wenn später gewünscht, kann die Rolle als Anzeige-/Spezialisierungslabel von `assistant_coach` geprüft werden.

---

## 17. Nachgelagerte technische und rechtliche Prüfpunkte

Die fachlichen Rollenentscheidungen sind getroffen. Nachgelagerte Dokumente
trennen davon noch offene Umsetzungs- und Rechtsfragen:

- `docs/DATABASE_MODEL.md` beschreibt bestehende Rollenbeziehungen sowie offene
  technische Details für Owner-Transfer, Kontaktpersonen und Auditierung.
- `docs/SECURITY.md` führt fehlende serverseitige Checks, RLS-Abweichungen,
  E-Mail-Verifizierung und Negativtests.
- `docs/DSGVO_PRIVACY_MODEL.md` beschreibt Datenminimierung, Sichtbarkeit,
  Guardian-Nachweis und Aufbewahrung; die rechtliche Bewertung bleibt
  fachanwaltlich offen.
- `docs/MVP_TEST_CHECKLIST.md` enthält die konkreten Bestands-, Ziel- und
  Pilotprüfungen für alle hier festgelegten Rollenrechte.

Diese technischen oder rechtlichen Folgefragen dürfen die Rollenmatrix nicht
stillschweigend verändern.

---

## 18. Pflege-Regeln

1. Neue Rollen oder Rechte werden nicht direkt in dieser Datei erfunden.
2. Neue Produktfunktionen müssen zuerst in `docs/FEATURE_CATALOG.md` stehen.
3. Phasen und Scope-Grenzen müssen danach in `docs/MVP_SCOPE.md` geprüft werden.
4. User-Flows müssen anschließend in `docs/USER_FLOWS.md` nachvollziehbar sein.
5. Erst danach wird `docs/ROLES_AND_PERMISSIONS.md` angepasst.
6. SQL, RLS, Tabellen und Seeds bleiben aus dieser Datei heraus.
7. Spätere Clubrollen dürfen nicht als MVP-0A-/0B-Rechte interpretiert werden.
8. `assistant_coach` darf nicht still auf `head_coach`-Niveau erweitert werden.
9. `guardian`-Rechte müssen immer kindbezogen und datensparsam bleiben.
10. Nach finaler Änderung muss geprüft werden, ob `docs/PROJECT_BRIEF.md` oder
    `docs/CURRENT_TASK.md` betroffen sind.

---

## 19. Pflege- und Reviewcheckliste

Nach relevanten Rollenänderungen prüft ein unabhängiger Review:

1. Stimmt die Rollenlogik mit `docs/FEATURE_CATALOG.md` überein?
2. Stimmt die Phasenlogik mit `docs/MVP_SCOPE.md` überein?
3. Stimmen die Rollen in den Flows mit `docs/USER_FLOWS.md` überein?
4. Wurden SQL-, RLS-, Seed- oder Migrationsdetails versehentlich in dieser Datei behalten?
5. Wurden `club_admin`, `team_manager` oder alte Vereinsrollen versehentlich als aktive MVP-Rollen behandelt?
6. Wurde `assistant_coach` zu breit berechtigt?
7. Sind Guardian-/Kind-/Kontaktpersonenrechte ausreichend getrennt?
8. Gibt es Folgeprüfpunkte für `DATABASE_MODEL.md`, `SECURITY.md`, `DSGVO_PRIVACY_MODEL.md` oder `MVP_TEST_CHECKLIST.md`?

Der Review verändert ohne eigenen Auftrag keine Datei, erstellt keine
Migration, verwendet keine Remote-Datenbank und führt keinen Commit aus.
