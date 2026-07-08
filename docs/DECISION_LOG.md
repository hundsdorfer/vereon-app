# Decision Log — Vereon

Archiv dauerhafter Produkt-, Architektur-, Security-, Privacy-, UX-, Business-, Technical- und Dokumentationsentscheidungen für Vereon.

Dieses Dokument ist keine Aufgabenliste, kein Git-Status, kein Bugtracker und kein Claude-Handoff. Es dokumentiert Entscheidungen, die langfristig steuern, wie Vereon geplant, gebaut, geprüft und weiterentwickelt wird.

---

## 1. Regeln für neue Entscheidungen

### Zweck

`DECISION_LOG.md` dokumentiert dauerhafte Grundsatzentscheidungen.

Dazu gehören insbesondere:

* Produktentscheidungen
* Scope- und MVP-Entscheidungen
* Architekturentscheidungen
* Security-Entscheidungen
* Privacy-/DSGVO-Entscheidungen
* UX-Grundsatzentscheidungen
* Business-Grundsatzentscheidungen
* Technical-Entscheidungen
* Dokumentationsentscheidungen

Nicht in dieses Dokument gehören:

* laufende Aufgaben
* kurzfristige Bugs
* temporärer Git-Status
* Build-/Lint-Ausgaben
* Claude-Handoffs
* einzelne Prompt-Anweisungen
* Tagesstatus oder kurzfristige Arbeitsnotizen

Dafür sind primär `CURRENT_TASK.md`, `STATUS.md`, `CHATGPT_CONTEXT.md` und aktuelle Chat-/Claude-Handoffs zuständig.

---

### Sprache

Dieses Dokument bleibt auf Deutsch.

Englische technische Begriffe, Dateinamen, Feature-IDs und Statuswerte bleiben dort englisch, wo sie sinnvoll oder projektüblich sind, z. B.:

* `FEATURE_CATALOG.md`
* `TEAM_CREATE`
* `PLAYER_REMOVE`
* `Server Actions`
* `RPC/RLS`
* `accepted-retrospective`

---

### Statuswerte

Zulässige Statuswerte:

| Status                   | Bedeutung                                                       |
| ------------------------ | --------------------------------------------------------------- |
| `accepted`               | aktiv beschlossen und gültig                                    |
| `accepted-retrospective` | früher im Projektverlauf beschlossen, nachträglich dokumentiert |
| `proposed`               | Vorschlag, noch nicht verbindlich                               |
| `superseded`             | durch spätere Entscheidung ersetzt                              |
| `rejected`               | bewusst verworfen                                               |

---

### Typen

Zulässige Entscheidungstypen:

| Typ             | Bedeutung                                                   |
| --------------- | ----------------------------------------------------------- |
| `Documentation` | Dokumentationsstruktur, Quellen, Pflegeprozesse             |
| `Product`       | Produktumfang, Zielgruppe, MVP-Logik                        |
| `Architecture`  | Systemarchitektur, Datenbeziehungen, technische Grundmuster |
| `Security`      | Zugriffsschutz, Autorisierung, sichere Operationen          |
| `Privacy`       | DSGVO, Datenminimierung, Minderjährigendaten                |
| `UX`            | dauerhafte UX-Grundsatzentscheidungen                       |
| `Business`      | Geschäftsmodell-Grundsatzentscheidungen                     |
| `Technical`     | konkrete technische Tooling-/Stack-Entscheidungen           |

Eine Entscheidung kann mehrere Typen haben.

---

### IDs und Sortierung

Neue Entscheidungen erhalten stabile IDs im Format:

```text
DEC-001
DEC-002
DEC-003
```

Die ID ist ein stabiler Referenzanker und richtet sich nach der Einfügereihenfolge, nicht zwingend nach dem historischen Entscheidungsdatum.

Grundsätzlich stehen neuere Entscheidungen weiter oben. Ausnahme: `DEC-001` bleibt als meta-strukturelle Dokumentationsentscheidung direkt nach dem Entscheidungsindex, damit Leser und KI-Tools zuerst die Dokumentationslogik verstehen.

---

### Entscheidung ersetzt andere Entscheidung

Wenn eine Entscheidung eine frühere Entscheidung ersetzt, wird dies explizit dokumentiert:

```text
Ersetzt: DEC-003
Ersetzt durch: DEC-014
```

Nicht jede Entscheidung benötigt diese Felder. Sie werden verwendet, wenn tatsächlich eine frühere Entscheidung abgelöst, eingeschränkt oder überholt wird.

---

### UI-/UX-Abgrenzung

UI-/UX-Grundsatzentscheidungen dürfen in dieses Dokument aufgenommen werden.

Konkrete Designausprägungen gehören nicht hierher, sondern in `DESIGN_SYSTEM.md`.

Beispiele:

| Thema                                  | Zuständige Datei        |
| -------------------------------------- | ----------------------- |
| Mobile-first als Produktleitplanke     | `DECISION_LOG.md`       |
| konkrete Farben, Abstände, Buttonhöhen | `DESIGN_SYSTEM.md`      |
| Nutzerabläufe                          | `USER_FLOWS.md`         |
| feature-spezifische UI-Anforderungen   | `FEATURE_CATALOG.md`    |
| Bedienbarkeits- und MVP-Tests          | `MVP_TEST_CHECKLIST.md` |

---

### Monetarisierungsabgrenzung

Monetarisierungsdetails werden nicht in diesem Dokument ausgearbeitet.

Zuständig dafür ist primär:

```text
docs/MONETIZATION_STRATEGY.md
```

Nur finale Business-Grundsatzentscheidungen werden später zusätzlich in `DECISION_LOG.md` übernommen.

---

### Claude-/KI-Arbeitsregeln

Detaillierte Claude-/KI-Arbeitsregeln werden nicht vollständig in diesem Dokument gepflegt.

Dieses Dokument hält nur den Grundsatz fest:

> Sicherheitskritische Repo-Operationen müssen kontrolliert, gezielt und mit expliziter Freigabe erfolgen.

Konkrete Arbeitsregeln wie kein `git add .`, kein `git add -A`, kein Push ohne Freigabe, kein `supabase db push`, kein `npx supabase db reset` ohne separate Freigabe und keine Secrets-Anzeige gehören in:

```text
docs/CHATGPT_CONTEXT.md
docs/CURRENT_TASK.md
```

---

### Vorrangregel

Bei dauerhaften Produkt-, Scope-, Architektur-, Security-, Privacy-, UX-, Business-, Technical- und Dokumentationsgrundsatzfragen hat `DECISION_LOG.md` Vorrang vor älteren widersprüchlichen Planungsdokumenten.

Für den tatsächlichen implementierten Code- und Repo-Zustand bleiben maßgeblich:

```text
Git-Repo
docs/ARCHITECTURE.md
docs/STATUS.md
docs/CURRENT_TASK.md
aktuelle Nutzer-/Claude-Handoffs
```

Das bedeutet:

* `DECISION_LOG.md` entscheidet Grundsatzfragen.
* `FEATURE_CATALOG.md` beschreibt Funktionen.
* `MVP_SCOPE.md` beschreibt Phasen und Scope-Grenzen.
* `USER_FLOWS.md` beschreibt Nutzerabläufe.
* `ARCHITECTURE.md` und `STATUS.md` beschreiben den realen Ist-Zustand.
* Ältere Dateien mit Warnhinweis oder Deprecated-Status dürfen keine alten Entscheidungen wieder aktivieren.

---

### Standardformat für Entscheidungen

Neue Entscheidungen sollen grundsätzlich dieses Format verwenden:

```md
## DEC-000 — YYYY-MM-DD — Titel

**Status:** accepted / accepted-retrospective / proposed / superseded / rejected  
**Typ:** Product / Architecture / Security / Privacy / UX / Business / Technical / Documentation  
**Entscheidungszeitpunkt:** ...  
**Ersetzt:** —  
**Ersetzt durch:** —

**Kontext:**  
Warum musste entschieden werden?

**Entscheidung:**  
Was wurde beschlossen?

**Begründung:**  
Warum wurde diese Lösung gewählt?

**Verworfene Alternativen:**  
Welche realistischen Alternativen wurden bewusst nicht gewählt?

**Gilt für:**  
Wo ist diese Entscheidung maßgeblich?

**Gilt nicht für / Nicht entschieden:**  
Was wird durch diese Entscheidung ausdrücklich nicht entschieden?

**Auswirkungen:**  
Welche Dateien, Features, Phasen oder technischen Bereiche betrifft die Entscheidung?

**Offene Folgeaufgaben:**  
Was muss später noch umgesetzt, geprüft oder dokumentiert werden?

**Verwandte Docs:**  
Relevante Dokumente.
```

Bei kleineren Entscheidungen dürfen einzelne Abschnitte kompakter sein oder entfallen. Bei Scope-, Security-, Privacy-, MVP-, Mobile- und Dokumentationsentscheidungen sollen Abgrenzungen wie „Gilt für“ und „Gilt nicht für“ verwendet werden.

---

## 2. Entscheidungsindex

| ID      |      Datum | Titel                                                    | Status                 | Typ                                 |
| ------- | ---------: | -------------------------------------------------------- | ---------------------- | ----------------------------------- |
| DEC-001 | 2026-07-06 | Dokumentationsstruktur und kanonische Quellen            | accepted               | Documentation                       |
| DEC-002 | 2026-07-06 | ChatGPT-Kontextdatei als primäre ChatGPT-Projektquelle   | accepted-retrospective | Documentation                       |
| DEC-003 | 2026-07-06 | Einzelteam-MVP vor Vereinsplattform                      | accepted-retrospective | Product / Architecture              |
| DEC-004 | 2026-06-29 | Datenbasierte Ansichtslogik statt fester Rollenidentität | accepted               | Product / Architecture / UX         |
| DEC-005 | 2026-07-06 | Web/PWA zuerst, native App später                        | accepted-retrospective | Product / UX / Technical            |
| DEC-006 | 2026-07-06 | Server Actions + Supabase RPC/RLS als Sicherheitsmuster  | accepted-retrospective | Architecture / Security / Technical |
| DEC-007 | 2026-07-06 | Datenminimierung bei Kinder-/Guardian-Daten              | accepted-retrospective | Privacy / Product / Security        |
| DEC-008 | 2026-07-08 | Feature-Catalog-ID-Format `FC-[MODUL]-[NUMMER]`          | accepted               | Documentation                       |

Hinweis: `FEATURE_CATALOG.md` wurde inzwischen erstellt und von Claude Code im Review-only-Modus geprüft (siehe `DEC-008`).

---

## DEC-001 — 2026-07-06 — Dokumentationsstruktur und kanonische Quellen

**Status:** accepted
**Typ:** Documentation
**Entscheidungszeitpunkt:** Am 2026-07-06 im Rahmen des Dokumentations-Cleanups beschlossen.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Die bisherige Dokumentation war über viele `.md`-Dateien verteilt. Einige Dateien enthielten veraltete, idealisierte oder widersprüchliche Aussagen zu MVP-Scope, Roadmap, Datenmodell, Rollen, Status und Architektur.

Dadurch bestand das Risiko, dass ChatGPT oder Claude Code alte Planungsstände als aktuelle Wahrheit behandelt.

Zudem wurde entschieden, dass konzeptionelle Dokumente künftig stärker gemeinsam durchdacht werden sollen, statt sie nur mechanisch von Claude überarbeiten zu lassen.

### Entscheidung

Vereon erhält eine klare Dokumentationsstruktur mit getrennten Verantwortlichkeiten.

#### Kanonische Funktions- und Produktdokumente

```text
docs/FEATURE_CATALOG.md
docs/MVP_SCOPE.md
docs/USER_FLOWS.md
```

* `FEATURE_CATALOG.md` wird die zentrale kanonische Funktionsquelle.
* `MVP_SCOPE.md` definiert Phasen, Scope-Grenzen und Priorisierung.
* `USER_FLOWS.md` beschreibt Nutzerabläufe aus Sicht von Trainer, Spieler, Guardian und später Verein.
* Diese drei Dateien werden nicht physisch zusammengeführt.
* Sie werden logisch über verbindliche Feature-IDs verknüpft.

Hinweis: `docs/FEATURE_CATALOG.md` ist durch diese Entscheidung als künftige kanonische Funktionsquelle beschlossen, existiert zum Zeitpunkt dieser Entscheidung aber noch nicht. Die Datei wird erst nach dem festgelegten ChatGPT-Entwurf-, manuellem Einfüge- und Claude-Review-Prozess kanonisch.

#### Feature-IDs

Feature-IDs verwenden künftig das Format:

```text
DOMAIN_ACTION
```

Beispiele:

```text
TEAM_CREATE
JOIN_REQUEST_APPROVE
PLAYER_REMOVE
TRAINING_CREATE
RSVP_SUBMIT
MATCH_CREATE
VIEW_SWITCHER
```

#### Technischer Funktionskern

```text
docs/DATABASE_MODEL.md
docs/ROLES_AND_PERMISSIONS.md
docs/SECURITY.md
docs/DSGVO_PRIVACY_MODEL.md
docs/ARCHITECTURE.md
```

Diese Dateien müssen später gegen `FEATURE_CATALOG.md`, `MVP_SCOPE.md` und echte Repo-/Code-Zustände geprüft werden.

#### UX und Qualität

```text
docs/DESIGN_SYSTEM.md
docs/MVP_TEST_CHECKLIST.md
```

`DESIGN_SYSTEM.md` regelt konkrete UI-/Designausprägungen.
`MVP_TEST_CHECKLIST.md` regelt MVP-nahe Prüf- und Testfälle.

#### Hot-Memory- und Ist-Zustandsdateien

```text
docs/CURRENT_TASK.md
docs/STATUS.md
docs/PROJECT_BRIEF.md
docs/CHATGPT_CONTEXT.md
```

Diese Dateien bleiben operative Steuerungs- und Handoff-Dateien. Sie sollen nicht mit vollständiger Funktionsspezifikation überladen werden.

#### Archivkandidaten

```text
docs/PROJECT_STATUS.md
docs/ROADMAP.md
```

Diese Dateien bleiben vorerst im `docs/`-Ordner, gelten aber als Deprecated-/Archivkandidaten und dürfen nicht mehr als primäre Quellen für aktuellen Projektstand oder aktuelle Roadmap verwendet werden.

Eine physische Verschiebung nach `docs/archive/` erfolgt erst später, wenn die neuen Kern-Dokumente stabil sind.

Falls über bestehende generische Warnhinweise hinaus nötig, sollen diese Dateien später direkt einen spezifischen Deprecated-/Archivhinweis erhalten.

#### Dokumentationsinventar

`docs/DOCS_INVENTORY.md` dokumentiert den Zustand, Pflegebedarf und Redundanzen der vorhandenen Dokumentation. Es ist keine Produkt-, Funktions- oder Statusquelle, sondern ein Hilfsdokument für Doku-Cleanup und Archivierungsentscheidungen.

### Neuer Dokumentationsprozess

Für konzeptionelle und dauerhaft steuernde Dokumente gilt künftig:

1. Nutzer liefert die aktuelle `.md`-Datei.
2. ChatGPT analysiert die Datei kritisch.
3. ChatGPT stellt schrittweise maximal 1–2 gezielte Fragen pro Antwort.
4. ChatGPT baut daraus eine neue Zielversion.
5. Nutzer fügt die neue Datei manuell ins Repo ein.
6. Claude Code prüft die Datei im Review-only-Modus kritisch gegen Repo, Code, Migrationen und andere Docs.
7. Erst nach Review, Korrektur und gezieltem Commit wird die Datei kanonisch.

Dieser Prozess gilt insbesondere für:

```text
FEATURE_CATALOG.md
MVP_SCOPE.md
USER_FLOWS.md
DATABASE_MODEL.md
ROLES_AND_PERMISSIONS.md
SECURITY.md
DSGVO_PRIVACY_MODEL.md
DESIGN_SYSTEM.md
MVP_TEST_CHECKLIST.md
PRODUCT_VISION.md
MONETIZATION_STRATEGY.md
MOBILE_APP_STRATEGY.md
```

Dieser Prozess gilt nicht automatisch für Dateien oder Aufgaben, bei denen Claude Code näher an der Wahrheit ist, insbesondere:

* Code-Features
* Migrationen
* Bugfixes
* echte Architektur-Ist-Stände
* Git-Status
* Build-/Lint-Ergebnisse
* aktuelle Repo-Audits
* `ARCHITECTURE.md`
* `STATUS.md`
* `CURRENT_TASK.md`
* `CHATGPT_CONTEXT.md`
* `PROJECT_BRIEF.md`

### Begründung

Diese Trennung verhindert, dass einzelne Dateien mehrere Rollen gleichzeitig übernehmen und dadurch widersprüchlich werden.

Beispiele:

* `FEATURE_CATALOG.md` beantwortet: Welche Funktion gibt es?
* `MVP_SCOPE.md` beantwortet: In welcher Phase gehört die Funktion?
* `USER_FLOWS.md` beantwortet: Wie läuft der Nutzer durch die Funktion?
* `STATUS.md` beantwortet: Was ist aktuell tatsächlich umgesetzt oder offen?
* `ARCHITECTURE.md` beantwortet: Wie ist der Code tatsächlich aufgebaut?

### Verworfene Alternativen

* Alle Produkt- und Funktionsinformationen in eine einzige große Datei zusammenführen.
* `PROJECT_STATUS.md` oder `ROADMAP.md` weiter als primäre Steuerungsquellen verwenden.
* Claude Code alte Dokumente direkt mechanisch „bereinigen“ lassen, ohne vorherige fachliche Klärung.
* ChatGPT-Entwürfe sofort als kanonisch behandeln, bevor sie gegen das echte Repo geprüft wurden.

### Gilt für

* Doku-Cleanup
* künftige Funktionsspezifikationen
* Claude-Code-Prompts für Dokumentationsreviews
* Abgrenzung von Produkt-, Technik-, Status- und Archivdateien
* neue Feature-IDs
* künftige Erstellung von `FEATURE_CATALOG.md`

### Gilt nicht für / Nicht entschieden

* finale Inhalte von `FEATURE_CATALOG.md`
* finales Match-MVP
* finale Club-/Vereinsrollen
* finales Monetarisierungsmodell
* konkrete UI-Details
* konkrete Code-Implementierung einzelner Features

### Auswirkungen

* `FEATURE_CATALOG.md` wird als neue zentrale Funktionsquelle eingeführt.
* `MVP_SCOPE.md` und `USER_FLOWS.md` werden später gegen Feature-IDs strukturiert.
* `PROJECT_STATUS.md` und `ROADMAP.md` werden später direkt als Deprecated-/Archivkandidaten markiert.
* `DOCS_INVENTORY.md` soll später entsprechend aktualisiert werden.
* Claude-Prompts für Doku-Arbeiten sollen künftig Review-only und quellenbezogen formuliert werden.

### Offene Folgeaufgaben

* `FEATURE_CATALOG.md` initial erstellen.
* `MVP_SCOPE.md` gegen Feature-Katalog neu strukturieren.
* `USER_FLOWS.md` gegen Feature-Katalog abgrenzen.
* Deprecated-Hinweise in `PROJECT_STATUS.md` und `ROADMAP.md` ergänzen.
* `DOCS_INVENTORY.md` nach größeren Doku-Blöcken aktualisieren.

### Verwandte Docs

```text
docs/CHATGPT_CONTEXT.md
docs/CURRENT_TASK.md
docs/STATUS.md
docs/PROJECT_BRIEF.md
docs/DOCS_INVENTORY.md
docs/FEATURE_CATALOG.md
docs/MVP_SCOPE.md
docs/USER_FLOWS.md
docs/PROJECT_STATUS.md
docs/ROADMAP.md
```

---

## DEC-008 — 2026-07-08 — Feature-Catalog-ID-Format

**Status:** accepted
**Typ:** Documentation
**Entscheidungszeitpunkt:** Am 2026-07-08 im Rahmen des ersten Claude-Code-Reviews von `docs/FEATURE_CATALOG.md` festgestellt und entschieden.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

`DEC-001` legt für künftige Feature-IDs das Format `DOMAIN_ACTION` fest (Beispiele: `TEAM_CREATE`, `JOIN_REQUEST_APPROVE`, `PLAYER_REMOVE`).

Die tatsächlich erstellte und von Claude Code im Review-only-Modus geprüfte Datei `docs/FEATURE_CATALOG.md` verwendet stattdessen durchgängig das Format `FC-[MODUL]-[NUMMER]` (Beispiele: `FC-TRAINING-001`, `FC-RSVP-003`, `FC-GUARDIAN-006`), inklusive eigener ID-Regeln in Abschnitt 6 der Datei (stabile IDs, keine Wiederverwendung, kein stilles Löschen).

Dieser Widerspruch wurde im Claude-Code-Review von `FEATURE_CATALOG.md` als offener Konflikt zwischen zwei kanonischen Dokumenten identifiziert und musste vor einem möglichen Commit aufgelöst werden.

### Entscheidung

Für `docs/FEATURE_CATALOG.md` gilt verbindlich das Format `FC-[MODUL]-[NUMMER]`.

Der in `DEC-001` skizzierte `DOMAIN_ACTION`-Ansatz wird für den Feature-Katalog nicht verwendet.

### Begründung

`FC-[MODUL]-[NUMMER]` ist für einen tabellarischen Feature-Katalog stabiler und lesbarer: Modul und laufende Nummer sind auf einen Blick erkennbar, IDs bleiben bei Umbenennung des Features unverändert, und neue Features lassen sich innerhalb eines Moduls einfach fortlaufend ergänzen, ohne dass ein sprechender Aktionsname wie bei `DOMAIN_ACTION` mehrdeutig oder mit der Zeit unpassend werden kann (z. B. wenn sich der fachliche Charakter einer Aktion ändert).

### Verworfene Alternativen

* Umstellung aller Feature-IDs in `docs/FEATURE_CATALOG.md` auf `DOMAIN_ACTION` gemäß ursprünglichem `DEC-001`-Wortlaut.
* Parallelbetrieb beider ID-Formate (z. B. `DOMAIN_ACTION` als zusätzliches Alias-Feld je Feature-Zeile).

### Gilt für

* `docs/FEATURE_CATALOG.md`
* künftige Erweiterungen des Feature-Katalogs um neue Module/Features

### Gilt nicht für / Nicht entschieden

* ID-Formate außerhalb von `FEATURE_CATALOG.md` (z. B. für technische Code-Identifier, Datenbank-Konstanten oder künftige Tracking-Systeme) — diese Entscheidung leitet keine Code-Identifier aus dem Feature-Katalog ab.
* Die übrige Dokumentationsstruktur aus `DEC-001` bleibt unverändert gültig; nur der konkrete ID-Format-Punkt wird präzisiert.

### Auswirkungen

* `DEC-001` bleibt für die Dokumentationsstruktur gültig, wird aber hinsichtlich des Feature-ID-Formats durch `DEC-008` präzisiert/überschrieben.
* Keine Umstellung bestehender Feature-IDs in `docs/FEATURE_CATALOG.md` nötig.
* Künftige Claude-Code-Reviews von `FEATURE_CATALOG.md` sollen `FC-[MODUL]-[NUMMER]` als korrektes, verbindliches Format ansetzen.

### Offene Folgeaufgaben

* Keine.

### Verwandte Docs

```text
docs/DECISION_LOG.md
docs/FEATURE_CATALOG.md
```

---

## DEC-007 — 2026-07-06 — Datenminimierung bei Kinder-/Guardian-Daten

**Status:** accepted-retrospective
**Typ:** Privacy / Product / Security
**Entscheidungszeitpunkt:** Früher im Projektverlauf getroffen, am 2026-07-06 nachträglich dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Vereon verarbeitet Daten von Spielern, darunter im Jugendbereich auch Minderjährige. Zusätzlich können Eltern bzw. Guardians Kind-/Spielerprofile verwalten und RSVP-Antworten abgeben.

Dadurch entstehen erhöhte Anforderungen an Datenminimierung, Zweckbindung, Einwilligung, Nachweisbarkeit und Zugriffsschutz.

### Entscheidung

Für Kinder-/Guardian-Funktionen gilt:

* Pflichtdaten bleiben minimal.
* Optionale Zusatzdaten durch Eltern/Guardians sind grundsätzlich möglich.
* Konkrete optionale Felder werden durch diese Entscheidung nicht freigegeben.
* Sensible oder detaillierte Felder müssen später einzeln in `DSGVO_PRIVACY_MODEL.md`, `FEATURE_CATALOG.md` und ggf. `LEGAL_TODO.md` geprüft werden.
* Der finale Consent-/Einwilligungsnachweis für Minderjährige bleibt eine offene Pre-Pilot-Anforderung.

### Begründung

Vereon soll im Jugendbereich nutzbar sein, ohne unnötig sensible Kinderprofile aufzubauen.

Gleichzeitig soll das Produkt später praktische Vereins- und Teamorganisation unterstützen können. Deshalb wird nicht ausgeschlossen, dass Eltern/Guardians freiwillige Zusatzdaten eintragen. Diese Felder müssen aber einzeln begründet, geprüft und dokumentiert werden.

### Verworfene Alternativen

* Sehr striktes Modell, das dauerhaft nur Minimaldaten erlaubt und jede spätere freiwillige Erweiterung ausschließt.
* Freies Profilmodell, in dem beliebige Kinderdaten gespeichert werden können, solange ein Elternteil sie einträgt.
* Medizinische, fotografische, private oder detailreiche Kinderdaten ohne separate spätere Prüfung als grundsätzlich freigegeben behandeln.

### Gilt für

* Guardian-/Kind-Join-Flows
* Self-Player- und Guardian-Profile
* RSVP-/Teilnahmelogik
* spätere optionale Spieler-/Kindinformationen
* Datenschutz- und Legal-Prüfung vor Pilotbetrieb
* `DSGVO_PRIVACY_MODEL.md`
* `LEGAL_TODO.md`
* `FEATURE_CATALOG.md`

### Gilt nicht für / Nicht entschieden

Diese Entscheidung gibt keine konkreten optionalen Felder frei.

Nicht durch diese Entscheidung entschieden sind insbesondere:

* medizinische Hinweise
* Notfallkontakte
* Fotos
* Telefonnummern von Kindern
* genaue Geburtsdaten
* Adressdaten
* Leistungsprofile
* Schul-/Privatinformationen
* Uploads oder Dokumente

Solche Felder müssen später einzeln geprüft und dokumentiert werden.

### Auswirkungen

* Feature-Spezifikationen müssen zwischen Pflichtdaten und optionalen Daten unterscheiden.
* DSGVO-Dokumentation muss Datenfelder je Feature begründen.
* Consent-/Einwilligungsnachweis bleibt vor echtem Pilotbetrieb offen.
* Claude darf keine unnötigen Kinderdatenfelder als selbstverständlich planen oder implementieren.

### Offene Folgeaufgaben

* `DSGVO_PRIVACY_MODEL.md` grundlegend gegen echte Funktionen und Datenfelder prüfen.
* Consent-/Einwilligungsnachweis für Minderjährige definieren.
* `LEGAL_TODO.md` um Pre-Pilot-Anforderungen ergänzen.
* Feature-Katalog später um Datenschutz-/Datenfeldhinweise je Feature ergänzen.

### Verwandte Docs

```text
docs/DSGVO_PRIVACY_MODEL.md
docs/LEGAL_TODO.md
docs/FEATURE_CATALOG.md
docs/DATABASE_MODEL.md
docs/SECURITY.md
```

---

## DEC-006 — 2026-07-06 — Server Actions + Supabase RPC/RLS als Sicherheitsmuster

**Status:** accepted-retrospective
**Typ:** Architecture / Security / Technical
**Entscheidungszeitpunkt:** Früher im Projektverlauf getroffen, am 2026-07-06 nachträglich dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Vereon benötigt serverseitig verlässliche Autorisierung für Team-, Spieler-, Guardian-, RSVP- und spätere Vereinsfunktionen.

Insbesondere sicherheitskritische Aktionen wie Beitrittsanfragen, RSVP-Abgabe, Spieler entfernen, Rollenprüfungen oder spätere Club-Funktionen dürfen nicht nur über UI-Logik geschützt werden.

### Entscheidung

Für sicherheitsrelevante Operationen gilt als Standardmuster:

```text
UI / Client Component
→ Server Action oder geprüfte Serverlogik
→ Supabase Query oder RPC
→ RLS / DB-Prüfung / ggf. SECURITY DEFINER Function
```

Kritische Schreiboperationen laufen über geprüfte Serverlogik und bei Bedarf über Supabase RPCs.

Einfache serverseitige Reads/Writes sind erlaubt, solange RLS sauber greift.

Client-Komponenten dürfen niemals die eigentliche Sicherheitsentscheidung treffen.

Die UI darf Rechte anzeigen, verbergen oder den Nutzer führen, aber nicht autorisieren.

### SECURITY DEFINER

`SECURITY DEFINER` wird insbesondere für privilegierte oder sicherheitskritische Schreiboperationen verwendet, wenn normale RLS-/Serverlogik nicht ausreicht oder mehrere Tabellen konsistent geprüft werden müssen. Einfache, unkritische serverseitige Reads/Writes können ohne `SECURITY DEFINER` auskommen, sofern RLS sauber greift.

Wenn `SECURITY DEFINER` genutzt wird, gelten harte Regeln:

* `SET search_path = ''`
* volle `public.`-Qualifizierung von Tabellen und Funktionen
* `auth.uid()` serverseitig prüfen
* Team-/Club-Zugehörigkeit aus der Datenbank ableiten
* keine ungeprüften IDs aus Client-Input vertrauen
* keine Secrets
* keine clientseitige Rollenannahme als Sicherheitsgrundlage

### Begründung

Dieses Muster verbindet pragmatische Entwicklung mit belastbarer Security.

Nicht jede kleine Operation muss in eine RPC gezwungen werden. Aber kritische Operationen brauchen serverseitige Prüfungen, RLS und bei komplexen Berechtigungen robuste Datenbanklogik.

### Verworfene Alternativen

* Sicherheitsentscheidungen in Client-Komponenten oder UI-Flags treffen.
* `profiles.onboarding_role` als Berechtigungsgrundlage verwenden.
* Jede Operation zwanghaft als RPC bauen, auch wenn serverseitige Queries plus RLS ausreichen.
* `SECURITY DEFINER` pauschal verwenden, ohne strikte Schutzregeln.

### Gilt für

* Team- und Rollenoperationen
* Join Requests
* RSVP
* Guardian-/Kind-Beziehungen
* Spieler entfernen
* spätere Club-/Vereinsfunktionen
* `SECURITY.md`
* `DATABASE_MODEL.md`
* `ROLES_AND_PERMISSIONS.md`
* Claude-Code-Reviews sicherheitsrelevanter Änderungen

### Gilt nicht für / Nicht entschieden

Diese Entscheidung definiert kein vollständiges Security-Audit und keine finale RLS-/RPC-Matrix.

Sie entscheidet auch nicht, dass jede einzelne Datenoperation zwingend eine RPC sein muss.

### Auswirkungen

* Security-Dokumentation muss echte Implementierung gegen dieses Muster prüfen.
* Neue kritische Features müssen serverseitige Autorisierung explizit beschreiben.
* Claude darf keine sicherheitskritische Client-only-Logik vorschlagen.
* RPCs mit `SECURITY DEFINER` müssen besonders streng geprüft werden.

### Offene Folgeaufgaben

* `SECURITY.md` gegen reale Implementierung und dieses Muster bereinigen.
* `DATABASE_MODEL.md` um echte RPC-/Policy-Zuordnung je Feature erweitern.
* `ROLES_AND_PERMISSIONS.md` gegen serverseitige Berechtigungsprüfungen spiegeln.
* Tests für kritische Autorisierungsfälle ausbauen.

### Verwandte Docs

```text
docs/SECURITY.md
docs/DATABASE_MODEL.md
docs/ROLES_AND_PERMISSIONS.md
docs/ARCHITECTURE.md
docs/MVP_TEST_CHECKLIST.md
```

---

## DEC-005 — 2026-07-06 — Web/PWA zuerst, native App später

**Status:** accepted-retrospective
**Typ:** Product / UX / Technical
**Entscheidungszeitpunkt:** Früher im Projektverlauf getroffen, am 2026-07-06 nachträglich dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Vereon soll für Trainer, Eltern und Spieler am Smartphone einfach zugänglich sein. Gleichzeitig soll der frühe MVP nicht durch parallele native iOS-/Android-Entwicklung überladen werden.

Ein zentrales Ziel ist, dass Nutzer Vereon praktisch über ein App-Icon am Smartphone öffnen können.

### Entscheidung

Vereon startet als Web-App / PWA.

Für MVP und frühen Pilot gilt:

* Web/PWA ist der klare Erstweg.
* Mobile-first-Bedienung ist Teil dieser Entscheidung.
* Installierbares App-Icon, PWA-Metadaten und mobile Layouts sind ausdrücklich erwünscht.
* Ein späterer Capacitor-Pfad darf berücksichtigt werden.
* Es wird keine parallele native Codebasis im MVP aufgebaut.
* Native App-Store-Veröffentlichungen sind kein frühes MVP-Ziel.

### Begründung

Eine Web/PWA-Strategie reduziert technische Komplexität, beschleunigt MVP-Iterationen und unterstützt trotzdem den wichtigen Smartphone-Zugang.

Trainer, Eltern und Spieler brauchen im frühen Produkt vor allem schnellen Zugriff, einfache Bedienung und klare mobile Flows — nicht zwingend eine native App.

### Verworfene Alternativen

* Frühe native iOS-/Android-App parallel zur Web-App.
* React Native oder Flutter als zweite Codebasis im MVP.
* App-Store-Launch als Voraussetzung für den ersten Pilot.
* Desktop-first Produktlogik.

### Gilt für

* Mobile UX
* PWA-Metadaten
* installierbares App-Icon
* MVP-/Pilotplanung
* `MOBILE_APP_STRATEGY.md`
* `DESIGN_SYSTEM.md`
* `USER_FLOWS.md`
* `MVP_TEST_CHECKLIST.md`

### Gilt nicht für / Nicht entschieden

Diese Entscheidung schließt eine spätere native App nicht aus.

Nicht final entschieden sind:

* konkrete technische Umsetzung und Zeitpunkt von Push-Notifications
* finale Native-App-Strategie nach PWA
* Capacitor-Umsetzungstermin
* Offline-Funktionalität
* App-Store-Veröffentlichung

### Auswirkungen

* UX muss mobil priorisiert werden.
* PWA-Funktionalität darf ausgebaut werden.
* Claude soll keine frühe native App-Schiene als MVP-Pflicht planen.
* `MOBILE_APP_STRATEGY.md` bleibt zuständig für spätere App-Pfade.

### Offene Folgeaufgaben

* PWA-/Installationsverhalten im MVP-Testplan prüfen.
* Mobile-first-Regeln im `DESIGN_SYSTEM.md` schärfen.
* Spätere Native-App-Strategie nach MVP/Pilot erneut bewerten.

### Verwandte Docs

```text
docs/MOBILE_APP_STRATEGY.md
docs/DESIGN_SYSTEM.md
docs/MVP_TEST_CHECKLIST.md
docs/USER_FLOWS.md
```

---

## DEC-003 — 2026-07-06 — Einzelteam-MVP vor Vereinsplattform

**Status:** accepted-retrospective
**Typ:** Product / Architecture
**Entscheidungszeitpunkt:** Früher im Projektverlauf getroffen, am 2026-07-06 nachträglich dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Vereon soll langfristig für Sportvereine, Teams, Trainer, Spieler und Eltern nutzbar sein. Gleichzeitig wäre eine vollständige Vereins-/Club-Suite im frühen MVP zu umfangreich.

Der erste reale Pilot soll mit einer einzelnen Jugendmannschaft starten.

### Entscheidung

Der frühe MVP und erste Pilot werden auf eine einzelne Jugendmannschaft mit Trainer, Spielern und Eltern/Guardians optimiert.

Technische und dokumentarische Vorbereitung für spätere Vereins-/Mehrteam-Strukturen ist erlaubt.

Sichtbare Club-Suite, Mehrteam-Dashboard und Club-Admin-Flows gehören nicht in den frühen MVP.

### Begründung

Eine einzelne Jugendmannschaft ist der klarste und risikoärmste Startfall.

Dieser Fokus ermöglicht:

* schnellere MVP-Validierung
* einfachere UX
* klarere Berechtigungen
* geringere technische Komplexität
* realistischen Pilotbetrieb
* bessere Testbarkeit

Gleichzeitig soll die Architektur spätere Vereins-/Mehrteam-Strukturen nicht blockieren.

### Verworfene Alternativen

* sofortige Vereins-/Club-Suite im MVP
* Mehrteam-Dashboard vor stabiler Einzelteam-Nutzung
* Club-Admin-Flows als frühe Pflichtfunktion
* MVP als vollständige SaaS-Plattform für Vereine starten

### Gilt für

* MVP-/Pilotplanung
* `FEATURE_CATALOG.md`
* `MVP_SCOPE.md`
* `USER_FLOWS.md`
* `DATABASE_MODEL.md`
* `ROLES_AND_PERMISSIONS.md`
* `SECURITY.md`
* Testpriorisierung

### Gilt nicht für / Nicht entschieden

Diese Entscheidung definiert nicht:

* finales Club-Admin-Modell
* finale Vereinsrollen
* finales Mehrteam-Dashboard
* finales Vereinsbilling
* vollständige Phase-2-SaaS-Struktur

Diese Themen werden später separat entschieden.

MVP 0B und spätere Vereins-/Club-Strukturen können bereits grob in `MVP_SCOPE.md` skizziert sein. Diese Entscheidung macht sie aber nicht zur frühen MVP-0A-Pflicht und ersetzt keine spätere Detailentscheidung zu Club-Admin, Mehrteam-UX oder Vereinsrollen.

### Auswirkungen

* Frühe Features müssen primär für eine Mannschaft sinnvoll sein.
* Club-/Vereinsfunktionen dürfen technisch vorbereitet, aber nicht als MVP-Pflicht behandelt werden.
* Claude soll keine Mehrteam-/Club-Suite in den frühen MVP ziehen.
* MVP-Scope und User Flows müssen diesen Fokus widerspiegeln.

### Offene Folgeaufgaben

* `MVP_SCOPE.md` entsprechend neu strukturieren.
* `FEATURE_CATALOG.md` mit klarer Phasenzuordnung erstellen.
* `USER_FLOWS.md` auf Einzelteam-Flows fokussieren.
* Spätere Club-/Mehrteam-Entscheidungen separat dokumentieren.

### Verwandte Docs

```text
docs/FEATURE_CATALOG.md
docs/MVP_SCOPE.md
docs/USER_FLOWS.md
docs/PRODUCT_VISION.md
docs/DATABASE_MODEL.md
docs/ROLES_AND_PERMISSIONS.md
```

---

## DEC-002 — 2026-07-06 — ChatGPT-Kontextdatei als primäre ChatGPT-Projektquelle

**Status:** accepted-retrospective
**Typ:** Documentation
**Entscheidungszeitpunkt:** Früher im Projektverlauf getroffen, am 2026-07-06 nachträglich dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Der Nutzer möchte in ChatGPT nicht laufend alle einzelnen `.md`-Dateien aus dem Projektordner manuell aktualisieren.

Da ältere Einzelquellen veraltet oder widersprüchlich sein können, wird eine kompakte Handoff-Datei benötigt.

### Entscheidung

`docs/CHATGPT_CONTEXT.md` ist die primäre Upload-/Handoff-Datei für ChatGPT-Projektquellen.

Sie ersetzt nicht:

* das Git-Repo
* `ARCHITECTURE.md`
* `STATUS.md`
* `CURRENT_TASK.md`
* `FEATURE_CATALOG.md`
* andere kanonische Repo-Dokumente

Sie dient als kompakter Einstieg, Prioritätsfilter und Schutz vor veralteten Einzelquellen.

### Aktualisierungsregel

`CHATGPT_CONTEXT.md` wird nicht zwanghaft nach jedem einzelnen Commit aktualisiert.

Sie soll nach relevanten Meilensteinen, Doku-Blöcken, Feature-Commits oder Statuswechseln aktualisiert und bei Bedarf neu in ChatGPT hochgeladen werden.

### Begründung

Eine zentrale Kontextdatei reduziert Pflegeaufwand und verhindert, dass ChatGPT alte Projektquellen vermischt.

Gleichzeitig bleibt das Git-Repo die echte Quelle der Wahrheit.

### Verworfene Alternativen

* dauerhaft alle `.md`-Dateien einzeln als ChatGPT-Projektquellen hochladen
* alte Einzelquellen parallel aktiv behalten
* `CHATGPT_CONTEXT.md` als Ersatz für Repo-Dokumentation behandeln
* Aktualisierung nach jedem einzelnen Commit erzwingen

### Gilt für

* ChatGPT-Projektquellen
* Handoffs zwischen Claude Code und ChatGPT
* Priorisierung bei widersprüchlichen älteren Dokumenten

### Gilt nicht für / Nicht entschieden

Diese Entscheidung macht `CHATGPT_CONTEXT.md` nicht zur technischen Wahrheit über Code, Migrationen oder aktuelle Repo-Zustände.

Für echte Ist-Zustände bleiben Git-Repo, `ARCHITECTURE.md`, `STATUS.md`, `CURRENT_TASK.md` und aktuelle Handoffs maßgeblich.

### Auswirkungen

* In ChatGPT sollen alte einzelne `.md`-Quellen grundsätzlich nicht parallel zur aktuellen Kontextdatei verwendet werden.
* Bei Unsicherheit soll ChatGPT nach aktuellem `git status`, `git log` oder Diff fragen.
* `CHATGPT_CONTEXT.md` wird als kompakter Einstieg gepflegt, nicht als vollständige Funktionsspezifikation.

### Offene Folgeaufgaben

* `CHATGPT_CONTEXT.md` nach relevanten Meilensteinen aktualisieren.
* Nach größeren Doku-Blöcken neue Version in ChatGPT hochladen.

### Verwandte Docs

```text
docs/CHATGPT_CONTEXT.md
docs/CURRENT_TASK.md
docs/STATUS.md
docs/PROJECT_BRIEF.md
docs/ARCHITECTURE.md
```

---

## DEC-004 — 2026-06-29 — Datenbasierte Ansichtslogik statt fester Rollenidentität

**Status:** accepted
**Typ:** Product / Architecture / UX
**Entscheidungszeitpunkt:** Am 2026-06-29 dokumentiert.
**Ersetzt:** —
**Ersetzt durch:** —

### Kontext

Nach Phase N.4 (RSVP) und Phase O (`/teams` UX) wurde festgestellt, dass `profiles.onboarding_role` kurzfristig als Heuristik genutzt wird, um zu entscheiden, ob ein User Trainer-CTAs sieht.

Das funktioniert für den MVP, wirft aber eine grundsätzliche Architekturfrage auf:

> Was bestimmt langfristig, welche Ansichten ein User sieht?

Im Amateurfußball sind Mehrfachrollen kein Ausnahmefall.

Beispiele:

* Spieler wird später Trainer.
* Elternteil ist gleichzeitig Trainer.
* Elternteil ist später Vereinsmanager.
* Obmann trainiert selbst.
* Nutzer kann Spieler-, Trainer-, Guardian- und später Vereinskontext kombinieren.

### Entscheidung

Ein User ist nicht dauerhaft auf eine Registrierungsrolle beschränkt.

Die sichtbaren Ansichten werden langfristig nicht aus `profiles.onboarding_role` abgeleitet, sondern aus echten Datenbeziehungen.

| Ansicht                 | Voraussetzung                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Traineransicht          | aktive `team_membership` mit Trainer-/Managerrolle, z. B. `team_owner`, `head_coach`, `assistant_coach`, `team_manager` |
| Spieleransicht          | eigener `players.user_id`-Eintrag                                                                                       |
| Eltern-/Guardianansicht | verifizierte `player_guardians`-Beziehung, z. B. `verified_at IS NOT NULL`                                              |
| Vereinsansicht          | aktive `club_membership` mit Vereinsrolle, später Phase 2+                                                              |

`profiles.onboarding_role` bleibt als historischer Registrierungskontext erlaubt, ist aber:

* keine dauerhafte Berechtigung
* keine feste Identität
* keine Sicherheitsgrundlage
* nicht maßgeblich für echte Autorisierung

### Ansicht ≠ Berechtigung

Der spätere Ansichtswechsler zeigt einem Nutzer nur Ansichten, für die bereits eine echte Datenbeziehung besteht.

Ein Nutzer sieht nicht pauschal alle möglichen Ansichten.

Zusätzliche Ansichten entstehen erst durch passende Produktflows, z. B.:

* Team erstellen
* zu einem Team eingeladen werden
* Guardian-Verknüpfung herstellen
* Spielerprofil verknüpfen
* später Vereinsrolle erhalten

Die sichtbare Ansicht steuert Navigation, Startseite und UX-Kontext.

Sie ist aber nicht die eigentliche Sicherheitsquelle.

Jede geschützte Aktion muss weiterhin serverseitig über Datenbeziehungen, RLS, RPCs oder geprüfte Serverlogik autorisiert werden.

### Späterer View Switcher

Langfristig soll ein eigener Ansichtswechsler entstehen.

Dieser soll zwei Ebenen abbilden:

1. **Ansicht:** Trainer / Guardian / Spieler / Verein
2. **Kontext:** konkretes Team, Kind, Verein oder später mehrere Teams

Beispiele:

```text
Traineransicht
- Team U10
- Team U11

Guardianansicht
- Kind A / Team U10
- Kind B / Team U12
```

Der View Switcher wird nicht in MVP 0A/0B gebaut.

Architektur, Navigation und Datenmodell sollen ihn aber später ermöglichen.

Im späteren `FEATURE_CATALOG.md` soll er als eigenes geplantes Feature geführt werden:

```text
VIEW_SWITCHER
```

### Begründung

Diese Entscheidung verhindert, dass Nutzer dauerhaft auf eine Registrierungsrolle reduziert werden.

Sie bildet reale Vereins- und Amateurfußballkonstellationen besser ab und verhindert, dass UX-Kontext und Berechtigung vermischt werden.

### Verworfene Alternativen

* `profiles.onboarding_role` als dauerhafte Rollenidentität behandeln.
* Nutzer bei Registrierung fest auf Trainer, Spieler oder Guardian festlegen.
* Alle möglichen Ansichten pauschal anzeigen und nur einzelne Aktionen sperren.
* View Switcher als frühes MVP-Feature erzwingen.
* UI-Ansicht als technische Sicherheitsquelle verwenden.

### Gilt für

* Rollen- und Ansichtslogik
* Dashboard-/Navigation-Konzept
* spätere Mehrfachrollen
* `ROLES_AND_PERMISSIONS.md`
* `DATABASE_MODEL.md`
* `USER_FLOWS.md`
* `FEATURE_CATALOG.md`
* spätere `VIEW_SWITCHER`-Planung

### Gilt nicht für / Nicht entschieden

Diese Entscheidung baut den View Switcher nicht als MVP-Feature.

Nicht entschieden sind:

* finale UI des View Switchers
* finale Reihenfolge der Ansichten
* finales Mehrteam-/Multikontext-UX-Modell
* finale Club-/Vereinsansicht
* spätere Native-App-UX

### Auswirkungen auf aktuellen Code

* Kurzfristige `showTrainerUI`-Heuristik in `/dashboard` und `/teams` bleibt für den MVP akzeptabel.
* Diese Heuristik darf nicht als dauerhafte Architektur oder Sicherheitsmodell missverstanden werden.
* Echte Berechtigungen müssen weiterhin aus Datenbeziehungen und serverseitigen Prüfungen entstehen.
* Keine sofortige Datenbankänderung ist allein durch diese Entscheidung erforderlich.

### Offene Folgeaufgaben

* `VIEW_SWITCHER` später in `FEATURE_CATALOG.md` als geplantes Feature aufnehmen.
* `ROLES_AND_PERMISSIONS.md` gegen diese Entscheidung prüfen.
* `USER_FLOWS.md` später auf Ansichts-/Kontextwechsel vorbereiten.
* `DATABASE_MODEL.md` zwischen `onboarding_role`, echter Mitgliedschaft und Guardian-Beziehung sauber abgrenzen.

### Verwandte Docs

```text
docs/ROLES_AND_PERMISSIONS.md
docs/DATABASE_MODEL.md
docs/USER_FLOWS.md
docs/FEATURE_CATALOG.md
docs/ARCHITECTURE.md
```

---

## 3. Noch nicht entschieden

Diese Sektion ist keine Todo-Liste. Sie enthält nur Grundsatzentscheidungen, die im Projektverlauf auftauchen und später bewusst entschieden werden müssen.

Aktuell bewusst nicht final entschieden:

* finales Einladungscode-Format
* Match-MVP-Umfang
* finale Club-/Vereinsrollen
* finales Monetarisierungsmodell
* finale Native-App-Strategie nach PWA
* finaler Consent-/Einwilligungsnachweis für Minderjährige
