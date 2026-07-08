# Rollen und Berechtigungen — Vereon

**Stand:** 2026-07-08  
**Status:** Arbeitsfassung / konsolidierte Neufassung auf Basis von `docs/FEATURE_CATALOG.md`, `docs/MVP_SCOPE.md` und `docs/USER_FLOWS.md`  
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

- vollständige Geburtsdaten,
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
| `team_manager` | Nicht aktive Rolle. Wird aus dem aktuellen Rollenmodell gestrichen, weil die neuen Dokumente operative Trainer- und Anwesenheitslogik über `head_coach` und `assistant_coach` führen. Eine spätere Wiedereinführung braucht eine neue Produktentscheidung. |
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
- Einladungscode anzeigen,
- Einladungscode erneuern oder deaktivieren,
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Training erstellen,
- Training bearbeiten,
- Training löschen,
- Training absagen,
- Spieler aus Team entfernen,
- eigene Trainer-RSVP abgeben.

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
- Co-Trainer operativ einbinden.
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
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
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
- RSVP-Übersicht sehen,
- eigene Trainer-RSVP abgeben,
- Beitrittsanfragen sehen oder fachlich vorbereiten.

### Explizite Begrenzung

`assistant_coach` darf nicht:

- Beitrittsanfragen annehmen,
- Beitrittsanfragen ablehnen,
- Co-Trainer hinzufügen,
- Co-Trainer entfernen,
- Spieler aus Team entfernen,
- Training löschen,
- Mannschaftsgrunddaten bearbeiten,
- Einladungscode erneuern oder deaktivieren,
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

## 8. `team_owner` vs. `head_coach`

| Merkmal | `team_owner` | `head_coach` |
|---|---|---|
| Kernzweck | Administrative Teamhoheit | Operative Trainings-/Teamleitung |
| Entsteht bei Team-Erstellung | Ja | Standardmäßig ja, sofern Ersteller auch Trainerrolle übernimmt |
| Mannschaftsgrunddaten bearbeiten | Ja | Nein, nur sehen |
| Trainings erstellen | Ja | Ja |
| Trainings bearbeiten | Ja | Ja |
| Trainings löschen | Ja | Ja |
| Trainings absagen | Ja | Ja |
| RSVP-Übersicht sehen | Ja, im Einzelteam-MVP zulässig | Ja |
| Eigene Trainer-RSVP abgeben | Ja | Ja |
| Beitrittsanfragen entscheiden | Nur wenn zusätzlich `head_coach` oder explizit später entschieden | Ja |
| Co-Trainer hinzufügen/entfernen | Ja | Ja |
| Spieler aus Team entfernen | Ja | Ja |
| Team-Affiliation entscheiden | Später ja | Nein |
| `team_owner`-Rechte übertragen | Später zu prüfen | Nein |
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
| Co-Trainer hinzufügen | Ja | Nein |
| Co-Trainer entfernen | Ja | Nein |
| Spieler entfernen | Ja | Nein |
| Mannschaftsgrunddaten bearbeiten | Nein | Nein |
| Einladungscode erneuern/deaktivieren | Ja | Nein |
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

Das Spielerprofil darf im MVP nur notwendige Daten enthalten. Vollständiges Geburtsdatum, medizinische Daten oder unnötige private Angaben gehören nicht in den frühen MVP.

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
| Teammitglieder anzeigen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Spieler im Team anzeigen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Spieler aus Team entfernen | ✓ | ✓ | — | — | — | später |
| Co-Trainer hinzufügen | ✓ | ✓ | — | — | — | später |
| Co-Trainer entfernen | ✓ | ✓ | — | — | — | später |
| Einladungscode anzeigen/teilen | ✓ | ✓ | — | — | — | später |
| Einladungscode erneuern/deaktivieren | ✓ | ✓ | — | — | — | später |
| Join-Link verwenden | — | — | — | ✓ | ✓ | — |
| Self-Player-Join starten | — | — | — | ✓ | — | — |
| Kind per Guardian-Join anmelden | — | — | — | — | ✓ | — |
| Beitrittsanfragen sehen | —** | ✓ | ✓ | — | — | später |
| Beitrittsanfragen vorbereiten/kommentieren | —** | ✓ | eingeschränkt | — | — | später |
| Beitrittsanfrage annehmen | —** | ✓ | — | — | — | später |
| Beitrittsanfrage ablehnen | —** | ✓ | — | — | — | später |
| Training erstellen | ✓ | ✓ | ✓ | — | — | später |
| Training anzeigen | ✓ | ✓ | ✓ | ✓ | eingeschränkt | später |
| Training bearbeiten | ✓ | ✓ | ✓ | — | — | später |
| Training löschen | ✓ | ✓ | — | — | — | später |
| Training absagen | ✓ | ✓ | ✓ | — | — | später |
| Eigene Spieler-RSVP abgeben | — | — | — | ✓ | — | — |
| RSVP für eigenes Kind abgeben | — | — | — | — | ✓ | — |
| Eigene Trainer-RSVP abgeben | ✓ | ✓ | ✓ | — | — | später |
| RSVP-Übersicht sehen | ✓ | ✓ | ✓ | eingeschränkt | eingeschränkt | später |
| Fremde Spieler-RSVP ändern | — | — | — | — | — | — |
| Legal-Seiten sehen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Join-Hinweise sehen | — | — | — | ✓ | ✓ | — |
| Guardian-Berechtigungsbestätigung abgeben | — | — | — | — | ✓ | — |
| Club-/Mehrteam-Verwaltung | — | — | — | — | — | später |
| Team-Affiliation | später | — | — | — | — | später |

\* In der Praxis erhält der Team-Ersteller typischerweise `team_owner` und `head_coach`. Die fachliche Team-Erstellung wird aber über den Team-Erstellungsflow gesteuert, nicht über eine isolierte `head_coach`-Rolle.  
\** Wenn dieselbe Person zusätzlich `head_coach` ist, entstehen Join-Entscheidungsrechte aus `head_coach`, nicht aus reinem `team_owner`.

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
- Einladungscode erneuern oder deaktivieren,
- Team-Affiliation entscheiden,
- `team_owner`-Rechte übertragen,
- Club-/Mehrteam-Verwaltung nutzen.

### 13.2 `head_coach` darf nicht automatisch

- `team_owner`-Rechte übertragen,
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
- vollständiges Geburtsdatum,
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

## 17. Offene Prüfpunkte für nachgelagerte Dokumente

Diese Punkte sind bewusst nicht in dieser Datei zu lösen.

### 17.1 Für `docs/DATABASE_MODEL.md`

Zu prüfen:

- Wie werden Mehrfachrollen technisch modelliert?
- Wie werden `team_owner`, `head_coach`, `assistant_coach`, `player` und `guardian` gespeichert?
- Ist `guardian` eine echte Teamrolle, ein Zugriffskontext oder beides?
- Wie wird die Guardian-Kind-Beziehung technisch abgebildet?
- Wie werden Kontaktpersonen ohne Account gespeichert?
- Wie werden entfernte Spieler historisiert, ohne vollständige Löschung zu simulieren?
- Wie werden Rollenänderungen nachvollziehbar gemacht?

### 17.2 Für `docs/SECURITY.md`

Zu prüfen:

- Welche serverseitigen Checks sichern jede Aktion ab?
- Welche Aktionen werden für unverifizierte Accounts blockiert?
- Welche RLS-Policies sichern Team-, Spieler-, Guardian- und RSVP-Zugriffe?
- Wie wird verhindert, dass `assistant_coach` sensible Entscheidungen trifft?
- Wie wird verhindert, dass Guardian-Zugriffe auf fremde Kinder ausweiten?
- Wie wird verhindert, dass spätere `club_admin`-Logik frühzeitig Zugriff auf Einzelteamdaten erhält?

### 17.3 Für `docs/DSGVO_PRIVACY_MODEL.md`

Zu prüfen:

- Welche Daten von Kindern sind wirklich notwendig?
- Wie wird minimale Guardian-Berechtigungsbestätigung dokumentiert?
- Wie lange bleiben Join-Requests und abgelehnte Anfragen sichtbar?
- Was sieht ein Spieler oder Guardian nach Entfernung aus dem Team?
- Wie werden Kontaktpersonen datensparsam geführt?
- Welche Informationen dürfen Trainerteamrollen über Minderjährige sehen?

### 17.4 Für `docs/MVP_TEST_CHECKLIST.md`

Zu prüfen:

- Rollenbasierte Sichtbarkeit je Rolle,
- erlaubte und verbotene Aktionen je Rolle,
- unverifizierte Accounts,
- Guardian-Kind-Zugriff,
- Co-Trainer-Rechte,
- Join-Request-Entscheidungen,
- Spieler entfernen,
- Training bearbeiten/löschen/absagen,
- Einladungscode erneuern/deaktivieren.

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
10. Nach finaler Änderung muss geprüft werden, ob `docs/CHATGPT_CONTEXT.md` aktualisiert werden soll.

---

## 19. Claude-Review-Ziel nach Übernahme

Nach manueller Übernahme oder Copy-/Replace soll Claude nur im Review-only-Modus prüfen:

1. Stimmt die Rollenlogik mit `docs/FEATURE_CATALOG.md` überein?
2. Stimmt die Phasenlogik mit `docs/MVP_SCOPE.md` überein?
3. Stimmen die Rollen in den Flows mit `docs/USER_FLOWS.md` überein?
4. Wurden SQL-, RLS-, Seed- oder Migrationsdetails versehentlich in dieser Datei behalten?
5. Wurden `club_admin`, `team_manager` oder alte Vereinsrollen versehentlich als aktive MVP-Rollen behandelt?
6. Wurde `assistant_coach` zu breit berechtigt?
7. Sind Guardian-/Kind-/Kontaktpersonenrechte ausreichend getrennt?
8. Gibt es Folgeprüfpunkte für `DATABASE_MODEL.md`, `SECURITY.md`, `DSGVO_PRIVACY_MODEL.md` oder `MVP_TEST_CHECKLIST.md`?

Claude soll dabei keine Datei automatisch ändern, keine Codeänderungen durchführen, keine Migrationen erstellen, keine Remote-Datenbank verwenden und keinen Commit ausführen.
