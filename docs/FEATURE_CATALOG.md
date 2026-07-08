# Vereon — Feature Catalog

## 1. Zweck dieser Datei

`FEATURE_CATALOG.md` ist die kanonische fachliche Funktionsquelle für Vereon.

Diese Datei beschreibt, welche nutzbaren Produktfunktionen Vereon enthält, welche Funktionen geplant sind, welche Funktionen später geprüft werden und welche Funktionen für frühe MVP-Phasen ausdrücklich nicht enthalten sind.

Diese Datei beschreibt **nicht** die technische Umsetzung im Detail. Technische Umsetzung, Datenmodell, RLS, Sicherheitsregeln, User-Flows und Tests werden in nachgelagerten Dokumenten oder Claude-Code-Aufträgen behandelt.

## 2. Abgrenzung

Der Feature-Katalog beschreibt nutzbare Funktionen für:

- Vereine / Mannschaften
- Trainer
- Co-Trainer
- Spieler
- Eltern / Erziehungsberechtigte
- spätere interne Vereon-Plattformadministration

Nicht Teil dieser Datei sind:

- Geschäftsmodell / Monetarisierung von Vereon
- SaaS-Abrechnung
- interne Unternehmensentscheidungen
- konkrete technische Implementierungsschritte
- Datenbankmigrationen
- RLS-Policy-Details
- Package-Entscheidungen
- CI/CD
- Supabase-Konfiguration
- juristische Detailtexte

Monetarisierung gehört in `MONETIZATION_STRATEGY.md` oder ein separates Business-Dokument, nicht in diesen Feature-Katalog.

## 3. Status-Legende

| Status | Bedeutung |
|---|---|
| `implemented` | Laut aktuellem Projektstand im Code vorhanden und grundsätzlich nutzbar. Muss durch Claude gegen Repo/Code/Migrationen/RLS geprüft werden. |
| `partial` | Teilweise umgesetzt, aber fachlich oder technisch unvollständig. |
| `planned_mvp` | Für den MVP vorgesehen, aber noch nicht oder nicht vollständig umgesetzt. |
| `planned_later` | Sinnvoll, aber bewusst nach MVP verschoben. |
| `candidate` | Idee oder späterer Kandidat, noch nicht entschieden. |
| `rejected` | Bewusst verworfen oder nicht als Produktfunktion vorgesehen. |
| `needs_review` | Unklar, widersprüchlich oder gegen Code/Dokumentation/DSGVO zu prüfen. |

## 4. Phasen-Legende

| Phase | Bedeutung |
|---|---|
| `MVP-0A` | Bereits vorhandener oder unmittelbar grundlegender Kernflow. |
| `MVP-0B` | Kurzfristig notwendige Kernlücken, damit der bestehende Kernflow brauchbar wird. |
| `MVP-1` | Erste real nutzbare Testversion mit deutlich besserer Alltagstauglichkeit. |
| `Post-MVP` | Nach erstem echten Einsatz sinnvoll. |
| `Later` | Langfristige Plattformfunktion. |
| `Unassigned` | Noch nicht zugeordnet. |

## 5. Rollenhinweis

Die Spalte `Rollen` verwendet technische bzw. code-nahe Rollenbezeichnungen:

| Rolle | Bedeutung |
|---|---|
| `authenticated_user` | eingeloggter, verifizierter Nutzer |
| `team_owner` | administrativer Eigentümer eines eigenständigen Teams; wird beim Erstellen eines unabhängigen Teams vergeben; zentrale MVP-0A-Rolle neben `head_coach` |
| `head_coach` | Haupttrainer / operativ verantwortlicher Teamverwalter |
| `assistant_coach` | Co-Trainer |
| `player` | Spieler mit eigenem Account |
| `guardian` | Elternteil / Erziehungsberechtigter / verwaltende Bezugsperson |
| `club_admin` | Vereinsadministrator, erst mit sichtbarer Club-/Mehrteam-Struktur voll relevant |
| `super_admin` | interne Vereon-Plattformadministration, späteres Admin-Panel |
| `system` | systemseitige Funktion ohne normale Nutzerinteraktion |

Die genaue Rechteabbildung gehört in `ROLES_AND_PERMISSIONS.md`. Dieser Feature-Katalog ersetzt keine Rechte-Matrix.

## 6. ID-Regeln

Feature-IDs folgen diesem Format:

```text
FC-[MODUL]-[NUMMER]
```

Beispiele:

```text
FC-TRAINING-001
FC-RSVP-003
FC-GUARDIAN-006
```

Regeln:

- Feature-IDs bleiben stabil.
- IDs werden nicht wiederverwendet.
- Features werden nicht still gelöscht.
- Verworfene Funktionen werden als `rejected` markiert.
- Verschobene Funktionen werden als `planned_later` markiert.
- Neue Module entstehen nur nach bewusster Entscheidung.
- Future Domains dürfen nicht eigenständig ausgearbeitet werden.

## 7. Prioritätsregel

Bei Konflikten haben MVP-0B-Kernlücken Vorrang vor neuen Zusatzfunktionen.

Vorrangig sind insbesondere:

- Training bearbeiten
- Training löschen
- Training absagen
- Match bearbeiten
- Match löschen
- Match absagen
- Trainer-RSVP
- Co-Trainer hinzufügen / entfernen
- RSVP-Deadline
- Anwesenheit abschließen
- Guardian-/Join-/Consent-Lücken

Nachrangig sind insbesondere:

- Taktikboard
- Kalenderexport
- Notification-Center
- internes Admin-Panel
- native App
- Offlinefähigkeit
- Vereinsfinanzen
- Materialverwaltung
- Sponsorenverwaltung

## 8. Core Modules

| Modul | Bereich |
|---|---|
| `AUTH` | Authentifizierung & Profil |
| `DASHBOARD` | Startseite / Übersicht / Schnellzugriff |
| `ORG` | Verein / Club-Grundstruktur |
| `TEAM` | Mannschaft |
| `ROLE` | Rollenverwaltungsfunktionen |
| `PLAYER` | Spieler |
| `GUARDIAN` | Eltern / Erziehungsberechtigte / Kontaktpersonen |
| `INVITE` | Einladungscode & Beitrittsprozess |
| `EVENT` | Kalenderbasis & allgemeine Termine |
| `TRAINING` | Training |
| `MATCH` | Spiel / Matchday |
| `RSVP` | Zu- und Absagen |
| `ATTEND` | Anwesenheit |
| `TACTIC` | Taktikboard |
| `REPORT` | Spielberichte |
| `NOTIFY` | Benachrichtigungen / Hinweise |
| `MOBILE` | Mobile Nutzung / PWA |
| `LEGAL` | Legal-/Consent-Funktionen |
| `ADMIN` | internes Vereon-Admin-Panel |

## 9. Future Platform Domains

Future Platform Domains sind langfristige Orientierungsbereiche. Sie sind keine ausgearbeiteten Features, kein MVP-Scope und bekommen in dieser Datei keine Feature-Tabellen und keine Feature-IDs.

Claude darf diese Domains nicht eigenständig in konkrete Features, Datenbanktabellen, Rollen oder User-Flows übersetzen.

| Domain | Langfristiger Bereich |
|---|---|
| `MEMBERSHIP` | Mitgliederverwaltung |
| `FINANCE` | vereinsinterne Beiträge, Zahlungen, Rechnungen |
| `FACILITY` | Plätze, Räume, Anlagen, Kabinen |
| `EQUIPMENT` | Materialverwaltung |
| `COMMUNICATION` | vereinsinterne Kommunikation |
| `DOCUMENTS` | Dokumente, Formulare, Nachweise |
| `VOLUNTEER` | Ehrenamt, Dienste, Helferplanung |
| `SPONSOR` | Sponsorenverwaltung |
| `SHOP` | Vereinsartikel / Merchandising |
| `ANALYTICS` | Auswertungen, Statistiken, Vereinskennzahlen |
| `FEDERATION` | Verband, Ligen, Spielbetrieb-Schnittstellen |

## 10. Nicht-Ziele für MVP-0A / MVP-0B

Diese Punkte sind nur für MVP-0A / MVP-0B ausgeschlossen. Sie sind nicht dauerhaft verworfen.

- keine vollständige Vereinsverwaltung
- keine sichtbare Mehrteam-Verwaltung
- keine Beitrags-/Finanzverwaltung
- keine Rechnungsstellung
- keine Verbandsintegration
- keine native iOS-/Android-App
- keine Offlinefähigkeit
- keine Push-/E-Mail-Benachrichtigungen
- keine frei personalisierbaren Dashboard-Widgets
- keine Kader-Nominierung
- keine Aufstellungsplanung
- keine detaillierten Spielerstatistiken
- keine Materialverwaltung
- keine Sponsorenverwaltung
- kein Vereins-Shop
- kein automatisierter DSGVO-Self-Service
- kein internes Admin-Panel im frühen MVP

---

# 11. Feature-Katalog

## AUTH — Authentifizierung & Profil

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-AUTH-001` | Registrierung | `implemented` | `MVP-0A` | `authenticated_user` | Nutzer kann einen Account registrieren. | vollständige Account-Recovery, manuelle Passwortvergabe | Claude-Review gegen Auth-Flow und Supabase-Konfiguration erforderlich. |
| `FC-AUTH-002` | Login | `implemented` | `MVP-0A` | `authenticated_user` | Nutzer kann sich anmelden. | Social Login, SSO | Claude-Review gegen aktuellen Auth-Flow erforderlich. |
| `FC-AUTH-003` | Logout | `implemented` | `MVP-0A` | `authenticated_user` | Nutzer kann sich abmelden. | Session-Management-UI im Detail | Claude-Review erforderlich. |
| `FC-AUTH-004` | Geschützte App-Bereiche | `implemented` | `MVP-0A` | `authenticated_user` | App-Bereiche sind nur für eingeloggte Nutzer zugänglich. | feingranulare Rechteprüfung je Feature | Rechteprüfung gehört in `ROLES_AND_PERMISSIONS.md` und `SECURITY.md`. |
| `FC-AUTH-005` | E-Mail-Verifizierung erzwingen | `planned_mvp` | `MVP-0B` | `authenticated_user` | Produktive App-Nutzung ist erst nach bestätigter E-Mail möglich. | Nutzung unverifizierter Accounts für Teamaktionen | Muss gegen aktuellen Supabase-Auth-Flow geprüft werden. |
| `FC-AUTH-006` | Passwort zurücksetzen | `planned_mvp` | `MVP-0B` | `authenticated_user` | Nutzer kann Passwort per E-Mail zurücksetzen. | Passwort-Reset durch Trainer, Telefon-Support, komplexe Recovery | E-Mail-Konfiguration und UX prüfen. |
| `FC-AUTH-007` | Eigene Profil-Grunddaten bearbeiten | `planned_mvp` | `MVP-1` | `authenticated_user` | Verifizierter Nutzer kann Vorname, Nachname und optionale Telefonnummer bearbeiten. | Rollen, Teamzuordnung, Spielerstatus, Guardian-Kind-Beziehungen | Profil darf nicht Rollen-/Teamverwaltung ersetzen. |
| `FC-AUTH-008` | E-Mail-Adresse ändern | `planned_later` | `Post-MVP` | `authenticated_user` | Nutzer kann E-Mail ändern; neue Adresse muss erneut verifiziert werden. | ungeprüfte E-Mail-Änderung | Sicherheits- und Verifizierungslogik nötig. |

## DASHBOARD — Startseite / Übersicht / Schnellzugriff

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-DASHBOARD-001` | Modulares Dashboard anzeigen | `partial` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Gemeinsames Dashboard-System mit systemdefinierten Kacheln je Rolle. | frei konfigurierbare Widgets, Drag-and-Drop, persönliche Layouts | Muss UX-seitig einfach bleiben. |
| `FC-DASHBOARD-002` | Nächste Termine anzeigen | `implemented` | `MVP-0A` | `head_coach`, `assistant_coach`, `player`, `guardian` | Dashboard zeigt kommende relevante Termine. | komplexe Kalenderansicht | Claude-Review gegen aktuelle Dashboard-Implementierung erforderlich. |
| `FC-DASHBOARD-003` | Offene RSVP anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Dashboard zeigt offene eigene oder teambezogene Rückmeldungen. | Notification-Center, Push, E-Mail | Abhängig von RSVP-Deadline-Logik. |
| `FC-DASHBOARD-004` | Offene Beitrittsanfragen anzeigen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach` | Dashboard zeigt offene Beitrittsanfragen. | Genehmigung durch `assistant_coach` | Abhängig von INVITE-Modul. |
| `FC-DASHBOARD-005` | Teamstatus / Anwesenheitslage anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Einfache Zusammenfassung zu RSVP, offenen Rückmeldungen und offenen Anwesenheitsabschlüssen. | langfristige Statistik, Leistungsbewertung, Trendanalysen | Darf keine Statistikplattform werden. |
| `FC-DASHBOARD-006` | Schnellzugriffe je Rolle anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Rollenabhängige Schnellzugriffe auf wichtige Funktionen. | frei personalisierbare Shortcuts | Muss mit Navigation konsistent bleiben. |
| `FC-DASHBOARD-007` | Warnhinweise / offene Aufgaben anzeigen | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach`, `guardian`, `player` | Späterer Hinweisbereich für offene Aufgaben. | vollwertiges Notification-Center | Nicht MVP-0A/MVP-0B. |
| `FC-DASHBOARD-008` | Personalisierbare Dashboard-Widgets | `planned_later` | `Later` | `authenticated_user` | Nutzer kann Widgets später selbst konfigurieren. | MVP-Funktion | Komplexe Layout-, Persistenz- und Mobile-Logik. |

## ORG — Verein / Club-Grundstruktur

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-ORG-001` | Club/Verein als Organisationseinheit führen | `partial` | `MVP-0A` | `team_owner`, `head_coach` | Organisationseinheit ist technisch/fachlich vorhanden (Tabelle `clubs`, RPC `create_club()`), aber es existiert noch keine vollständige nutzbare Club-Verwaltung (kein UI-Flow zum Anlegen/Verwalten eines Vereins). | vollständige Vereinsverwaltung | Claude-Review bestätigt: Datenmodell/RPC vorhanden, aber keine Server Action/Route für Club-Erstellung im Code (`docs/STATUS.md`). |
| `FC-ORG-002` | Club im Hintergrund beim Team-Setup mitführen | `partial` | `MVP-0A` | `head_coach` | Nutzer arbeitet operativ primär mit einer Mannschaft; Club-Kontext läuft reduziert im Hintergrund. | komplexes Club-Onboarding | Muss mit Team-Erstellung konsistent sein. |
| `FC-ORG-003` | Club-Grunddaten anzeigen/verwalten | `planned_later` | `MVP-1` | `club_admin`, `head_coach` | Später können Vereinsname, Sportart, Land/Region sowie optional Logo/Farbe gepflegt werden. | Adresse, Registernummer, Vorstandsdaten, Bankdaten, Steuernummer | Nicht zur vollständigen Vereinsverwaltung ausweiten. |
| `FC-ORG-004` | Mehrteam-Struktur vorbereiten | `needs_review` | `MVP-0A` | `club_admin`, `head_coach` | Datenmodell soll mehrere Mannschaften pro Verein ermöglichen. | sichtbare Mehrteam-Verwaltung im frühen MVP | Gegen Datenmodell und Rollenlogik prüfen. |
| `FC-ORG-005` | Mehrere Mannschaften pro Verein sichtbar verwalten | `planned_later` | `Post-MVP` | `club_admin` | Club-/Vereinsadmin kann mehrere Teams sichtbar verwalten. | MVP-0A/MVP-0B | Benötigt Team-Switcher, Club-Dashboard und Rollenmodell. |

## TEAM — Mannschaft

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-TEAM-001` | Mannschaft erstellen | `implemented` | `MVP-0A` | `team_owner`, `head_coach` | Ersteller kann eine operative Mannschaft erstellen; wird dabei automatisch `team_owner` und (standardmäßig) `head_coach`. | vollständiges Vereins-Onboarding | Claude-Review gegen aktuellen Create-Flow erforderlich. |
| `FC-TEAM-002` | Mannschaft anzeigen | `implemented` | `MVP-0A` | `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian` | Nutzer sehen die für sie relevante Mannschaftsansicht. | Mehrteam-Switcher | Rollenabhängige Sichtbarkeit prüfen. |
| `FC-TEAM-003` | Mannschafts-Grunddaten bearbeiten | `planned_mvp` | `MVP-0B` | `team_owner` | Grunddaten wie Name, Altersklasse, Saison, Sportart und Beschreibung können bearbeitet werden. Laut `ROLES_AND_PERMISSIONS.md` ("team_owner vs. head_coach") kann ausschließlich `team_owner` Team-Einstellungen ändern, nicht `head_coach`. | vollständige Vereinsdaten | Abhängig von ORG-Abgrenzung. |
| `FC-TEAM-004` | Teammitglieder anzeigen | `implemented` | `MVP-0A` | `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian` | Zeigt Teammitglieder rollenabhängig. | gleiche vollständige Liste für alle Rollen | Datenschutz bei Minderjährigen beachten. |
| `FC-TEAM-005` | Rollenabhängige Teamliste anzeigen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian` | Trainerteam sieht vollständige sportliche und verwaltungsrelevante Ansicht; Spieler/Guardian sehen reduzierte Ansichten. | fremde Guardian-Kontaktdaten für Spieler/Eltern | Datenschutz und Rollenmodell prüfen. |
| `FC-TEAM-006` | Mannschaft archivieren / deaktivieren | `planned_later` | `MVP-1` | `team_owner`, `club_admin` | Mannschaft kann später deaktiviert oder archiviert werden. Archivieren ist eine Team-Einstellungsänderung und laut `ROLES_AND_PERMISSIONS.md` `team_owner`-Sache, nicht `head_coach`. | vollständiges hartes Löschen | Historie, Termine und Teamdaten dürfen nicht unkontrolliert verschwinden. |
| `FC-TEAM-007` | Primären Team-Ort verwalten | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | In Mannschaftseinstellungen kann ein primärer Ort, z. B. Sportplatz/Stadion, hinterlegt werden. | Anlagen-/Platzverwaltung, Buchungssystem | Dient nur als schneller Ort für Trainings. |
| `FC-TEAM-008` | Zwischen Mannschaften wechseln | `planned_later` | `Post-MVP` | `club_admin`, `head_coach`, `assistant_coach`, `player`, `guardian` | Nutzer kann später zwischen mehreren berechtigten Mannschaften wechseln. | MVP-0A/MVP-0B | Abhängig von sichtbarer Mehrteam-Verwaltung. |

## ROLE — Rollenverwaltungsfunktionen

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-ROLE-001` | Rollen eines Mitglieds anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `club_admin` | Rollen eines Team-/Clubmitglieds werden sichtbar gemacht. | vollständige Rechte-Matrix | Details gehören in `ROLES_AND_PERMISSIONS.md`. |
| `FC-ROLE-002` | Co-Trainer hinzufügen | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach`, `club_admin` | `team_owner`/`head_coach` kann `assistant_coach` hinzufügen; `club_admin` erst nach sichtbarer Club-Struktur voll relevant. | Hinzufügen durch `assistant_coach` | Bekannte Kernlücke. |
| `FC-ROLE-003` | Co-Trainer entfernen | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach`, `club_admin` | `team_owner`/`head_coach` kann Co-Trainer entfernen; `club_admin` später. | Entfernen durch `assistant_coach` | Rollenänderungen müssen nachvollziehbar sein. |
| `FC-ROLE-004` | Rollenbasierte Navigation anzeigen | `partial` | `MVP-0A` | `authenticated_user` | App zeigt Funktionen abhängig von Rolle/Berechtigung. | vollständiges Rollen-Admin-Panel | Gegen UI und RLS prüfen. |
| `FC-ROLE-005` | `club_admin` operativ nutzen | `planned_later` | `Post-MVP` | `club_admin` | Vereinsadministrator wird mit sichtbarer Club-/Mehrteam-Struktur relevant. | frühe vollständige Vereinsverwaltung | Nicht Voraussetzung für MVP-0B-Kernlücken. |
| `FC-ROLE-006` | `super_admin` als Plattformrolle vorbereiten | `candidate` | `Later` | `super_admin` | Spätere interne Plattformrolle für Vereon-Betreiber. | normale Vereinsrolle | Erfordert eigene Security-/Decision-Prüfung. |

## PLAYER — Spieler

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-PLAYER-001` | Spieler im Team anzeigen | `implemented` | `MVP-0A` | `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian` | Spieler werden in der Teamansicht sichtbar. | vollständige öffentliche Spielerliste für alle | Rollenabhängige Sichtbarkeit prüfen. |
| `FC-PLAYER-002` | Spieler aus Team entfernen | `implemented` | `MVP-0B` | `team_owner`, `head_coach` | Trainerteam kann Spieler aus der Mannschaft entfernen. | vollständiges Löschen der Person/Historie | Umsetzung wurde laut Projektstand committed und im Code verifiziert (`has_team_role(['team_owner','head_coach'])` in `teams/[teamId]/page.tsx`) — `assistant_coach` hat aktuell keinen Zugriff. |
| `FC-PLAYER-003` | Spielerstammdaten erfassen | `implemented` | `MVP-0B` | `player`, `guardian`, `team_owner`, `head_coach` | Erfasst Name, Geburtsjahr und Teamzuordnung. Im MVP wird aus Datenschutz-/Datenminimierungsgründen nur das Geburtsjahr gespeichert (kein vollständiges Geburtsdatum). | Adresse, medizinische Daten, Ausweisdaten, vollständiges Geburtsdatum | Datenminimierung bereits entschieden (`DEC-007`) und umgesetzt (Migration `20260702000000_players_birth_year_only`, `join.ts` nimmt nur `child_birth_year integer` entgegen). Eine spätere erneute Prüfung eines vollständigen Geburtsdatums wäre ein separater, künftiger Kandidat — kein aktueller MVP-Plan. |
| `FC-PLAYER-004` | Spielerstammdaten bearbeiten | `planned_mvp` | `MVP-1` | `player`, `guardian` | Spieler/Guardian können Vorname, Nachname und Geburtsjahr bearbeiten. Änderungen sollen für Trainer nachvollziehbar sichtbar sein. | freie Änderung durch Trainerteam | Risiko: Altersklasse, Minderjährigenlogik, Änderungsverlauf. |
| `FC-PLAYER-005` | Sportliche Stammdaten pflegen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Trainerteam kann Rückennummer und Position pflegen. | Leistungsbewertung, interne Charakter-/Bewertungsnotizen | Datenschutz und Scope beachten. |
| `FC-PLAYER-006` | Teamzuordnung und Spielerstatus pflegen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Trainerteam kann Teamzuordnung und Status im Team pflegen. | Bearbeitung durch Spieler/Guardian | Statuslogik muss mit Entfernen/Archivieren konsistent sein. |
| `FC-PLAYER-007` | Spieler archivieren / deaktivieren | `planned_later` | `Post-MVP` | `head_coach`, `club_admin` | Spieler kann später archiviert/deaktiviert werden. | vollständige Löschung personenbezogener Historie | Gehört eng zu DSGVO-/Archivierungsmodell. |
| `FC-PLAYER-008` | Spieler vollständig löschen | `rejected` | `Unassigned` | — | Vollständiges Löschen ist kein normales MVP-Feature. | einfacher Löschbutton | Muss später über DSGVO-/Löschkonzept behandelt werden. |

## GUARDIAN — Eltern / Erziehungsberechtigte / Kontaktpersonen

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-GUARDIAN-001` | Guardian-Kind-Beziehung führen | `implemented` | `MVP-0A` | `guardian`, `head_coach` | Guardian ist verwaltende Einheit für ein oder mehrere Kinder. | mehrere eigenständige Guardian-Accounts pro Kind im MVP | Datenmodell gegen gewünschte Ein-Guardian-Regel prüfen. |
| `FC-GUARDIAN-002` | Guardian meldet Kind an | `implemented` | `MVP-0A` | `guardian` | Guardian kann ein Kind über Join-Flow anmelden. | Uploadpflicht für Nachweise | Consent-/Berechtigungsbestätigung ergänzen. |
| `FC-GUARDIAN-003` | Guardian gibt RSVP für Kind ab | `implemented` | `MVP-0A` | `guardian` | Guardian kann für sein Kind RSVP abgeben. | RSVP für fremde Kinder | Muss mit Guardian-Kind-Beziehung abgesichert sein. |
| `FC-GUARDIAN-004` | Mehrere Kinder pro Guardian verwalten | `planned_mvp` | `MVP-1` | `guardian` | Ein Guardian kann mehrere Kinder verwalten. | mehrere Guardian-Accounts pro Kind | Gegen Datenmodell prüfen. |
| `FC-GUARDIAN-005` | Mehrere Guardian-Accounts pro Kind erlauben | `rejected` | `Unassigned` | — | Mehrere eigenständige Guardian-Accounts pro Kind sind grundsätzlich nicht vorgesehen. | — | Weitere Angehörige werden als Kontaktpersonen im Guardian-Kontext dokumentiert. |
| `FC-GUARDIAN-006` | Guardian-Kontaktpersonen verwalten | `planned_mvp` | `MVP-1` | `guardian` | Guardian kann Kontaktpersonen mit Name, Beziehung, optionaler Telefonnummer und begrenzter Notiz verwalten. | eigener Login, eigene App-Rechte, eigene RSVP-Funktion | Datenschutz und Sichtbarkeit begrenzen. |
| `FC-GUARDIAN-007` | Guardian-Kontaktpersonen für Trainerteam anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam sieht relevante Kontaktpersonen mit Name, Beziehung und Telefonnummer. | private Notizen, umfangreiche Familieninformationen | Nur relevante Kontaktinformationen anzeigen. |
| `FC-GUARDIAN-008` | Guardian-Kontaktdaten bearbeiten | `planned_mvp` | `MVP-1` | `guardian` | Guardian kann eigene Kontakt- und Profildaten bearbeiten. | Bearbeitung durch Trainer | Telefonnummer bleibt optional. |

## INVITE — Einladungscode & Beitrittsprozess

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-INVITE-001` | Team-Einladungscode anzeigen | `implemented` | `MVP-0A` | `team_owner`, `head_coach` | Trainer kann Einladungscode/Join-Link für Team anzeigen. | mehrere parallele Codes pro Team | Code-Sicherheit prüfen. |
| `FC-INVITE-002` | Join-Link verwenden | `implemented` | `MVP-0A` | `authenticated_user` | Nutzer kann über Link/Code dem Join-Flow folgen. | öffentliche Teamaufnahme ohne Freigabe | Muss mit Beitrittsanfragen gekoppelt bleiben. |
| `FC-INVITE-003` | Volljähriger Spieler tritt selbst bei | `implemented` | `MVP-0A` | `player` | Volljähriger Spieler kann selbst als Spieler beitreten. | Minderjährige ohne Guardian-Logik | Alters-/Geburtsdatum-Logik prüfen. |
| `FC-INVITE-004` | Guardian meldet Kind per Join-Flow an | `implemented` | `MVP-0A` | `guardian` | Guardian meldet Kind über Join-Flow an. | mehrere Guardian-Accounts pro Kind | Consent-Erfassung noch ergänzen. |
| `FC-INVITE-005` | Beitrittsanfragen anzeigen | `implemented` | `MVP-0A` | `head_coach`, `assistant_coach` | Trainerteam kann offene Beitrittsanfragen sehen. | Genehmigung durch `assistant_coach` | Nur `head_coach` darf entscheiden. |
| `FC-INVITE-006` | Beitrittsanfrage annehmen | `implemented` | `MVP-0A` | `head_coach` | `head_coach` kann Beitrittsanfrage annehmen. | Annahme durch `assistant_coach` | Sicherheits- und Datenschutzrelevanz. |
| `FC-INVITE-007` | Beitrittsanfrage ablehnen | `partial` | `MVP-0B` | `head_coach` | `head_coach` kann Anfrage ablehnen, optional mit kurzer Begründung. | Pflichtbegründung, Chat, Diskussion | Optionaler Grund ggf. noch nicht umgesetzt. |
| `FC-INVITE-008` | Einladungscode erneuern / deaktivieren | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach` | Einladungscode kann manuell erneuert oder deaktiviert werden. | automatisches Ablaufdatum im frühen MVP | Sicherheitsrelevant. |
| `FC-INVITE-009` | Alte Beitrittsanfragen bereinigen | `planned_later` | `Post-MVP` | `system`, `super_admin` | Alte, abgelehnte oder abgelaufene Anfragen werden später fachlich bereinigt. | konkrete Cron-/RPC-/Datenbankimplementierung | Technische Umsetzung nicht hier beschreiben. |
| `FC-INVITE-010` | Einladungscode automatisch ablaufen lassen | `planned_later` | `Post-MVP` | `head_coach`, `system` | Codes können später zeitlich begrenzt werden. | MVP-0A/MVP-0B | Muss mit UX und Sicherheit abgestimmt werden. |

## EVENT — Kalenderbasis & allgemeine Termine

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-EVENT-001` | Terminliste anzeigen | `implemented` | `MVP-0A` | `head_coach`, `assistant_coach`, `player`, `guardian` | Kommende Termine werden als Liste angezeigt. | komplexe Kalenderansicht | Claude-Review gegen aktuelle UI. |
| `FC-EVENT-002` | Vergangene Termine erreichbar machen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Vergangene Termine bleiben über separaten Bereich/Filter erreichbar. | vergangene und kommende Termine ungefiltert mischen | Wichtig für Anwesenheit und Reports. |
| `FC-EVENT-003` | Einfache Terminfilter nutzen | `planned_mvp` | `MVP-1` | `authenticated_user` | Filter werden einfach gehalten und je nach vorhandener Terminart erweitert. | abstrakte Filtermaschine, komplexe Saison-/Teamfilter im MVP | Filter wachsen nur mit echten Funktionen. |
| `FC-EVENT-004` | Einfache Kalenderansicht anzeigen | `planned_mvp` | `MVP-1` | `authenticated_user` | Zusätzlich zur Liste gibt es eine einfache Kalenderansicht. | Drag-and-Drop, externe Kalenderintegration | Mobile UX beachten. |
| `FC-EVENT-005` | Allgemeine interne Termine erstellen | `planned_later` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Später können interne Termine wie Elternabend oder Mannschaftsfoto verwaltet werden. | früher MVP-0A/0B-Scope | Erhöht Termin-/RSVP-Logik. |
| `FC-EVENT-006` | Allgemeine Termine optional mit RSVP nutzen | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach`, `player`, `guardian` | Allgemeine Termine können später RSVP-pflichtig oder informativ sein. | frühe MVP-Funktion | Abhängig von allgemeiner Terminverwaltung. |
| `FC-EVENT-007` | Kalender-Abo / Export anbieten | `planned_later` | `Post-MVP` | `authenticated_user` | Später iCal-Abo/Export pro Nutzer oder Team. | bidirektionale Google/Apple/Outlook-Synchronisation | Externe Kalenderfunktion ist sinnvoll, aber später. |

## TRAINING — Training

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-TRAINING-001` | Training erstellen | `implemented` | `MVP-0A` | `team_owner`, `head_coach`, `assistant_coach` | Trainerteam kann Training anlegen. | vollständige Serienverwaltung | Claude-Review gegen aktuelle Trainingsfunktion. |
| `FC-TRAINING-002` | Training anzeigen | `implemented` | `MVP-0A` | `team_owner`, `head_coach`, `assistant_coach`, `player`, `guardian` | Trainings werden sichtbar angezeigt. | komplexe Kalenderansicht | Rollenabhängige Sichtbarkeit prüfen. |
| `FC-TRAINING-003` | Training bearbeiten | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach`, `assistant_coach` | Training kann vor Startzeit bearbeitet werden. | Bearbeitung von Kernfeldern ab Trainingsbeginn | Kernfelder bleiben ab Beginn stabil. |
| `FC-TRAINING-004` | Training löschen | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach` | Training kann vor Trainingsbeginn hart gelöscht werden. Laut `ROLES_AND_PERMISSIONS.md`-Berechtigungsmatrix ist „Termin löschen" nicht für `assistant_coach` vorgesehen (anders als „Termin erstellen"). | Löschen ab Trainingsbeginn | Fehleingaben korrigieren, Historie schützen. |
| `FC-TRAINING-005` | Training absagen | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach`, `assistant_coach` | Training kann vor Beginn abgesagt werden; Termin bleibt sichtbar und bekommt Status `abgesagt`. | Löschen statt Absage, Pflichtbegründung | Optionale Begründung; RSVP bleibt erhalten. |
| `FC-TRAINING-006` | Trainingsdetails pflegen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Optionale Beschreibung und optionales Thema/Schwerpunkt können gepflegt werden. | detaillierte Trainingsplanung, Übungsdatenbank, Minutenplan | Darf nicht zur Trainingsplanungssoftware ausufern. |
| `FC-TRAINING-007` | Trainingsort pflegen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Training hat einen Ort; kein eigenes Treffpunktfeld im MVP. | separater Treffpunkt, Anlagenverwaltung | Primärer Team-Ort kann übernommen werden. |
| `FC-TRAINING-008` | Primären Team-Ort übernehmen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Beim Erstellen kann der primäre Team-Ort per 1-Klick übernommen werden. | mehrere Sportstätten, Platzbuchung | Abhängig von `FC-TEAM-007`. |
| `FC-TRAINING-009` | Wiederkehrende Trainings erstellen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Trainerteam kann einfache Wochenserien mit Start-/Enddatum, Wochentagen, Startzeit, Endzeit und Ort erstellen. | komplexe Serienregeln, Ferienlogik, Feiertage | Enddatum ist Pflicht. |
| `FC-TRAINING-010` | Mehrere Wochentage in einem Erstellvorgang wählen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Trainer kann z. B. Mo/Di/Do in einem Vorgang erstellen. | unterschiedliche Zeiten/Orte je Wochentag im MVP | Im MVP gleiche Startzeit, Endzeit und gleicher Ort. |
| `FC-TRAINING-011` | Serienvorschau anzeigen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Vor Erstellung werden Anzahl Termine, erster/letzter Termin, Wochentage, Uhrzeit und Ort angezeigt. | komplexe Konfliktprüfung | Verhindert Massen-Fehleingaben. |
| `FC-TRAINING-012` | Einzeltermine mit Serienbezug erzeugen | `planned_mvp` | `MVP-1` | `system` | Serien erzeugen konkrete Einzeltermine mit Serienbezug. Jeder Einzeltermin hat eigenes RSVP. | RSVP auf Serienebene | Serienbezug darf spätere Serienverwaltung nicht blockieren. |
| `FC-TRAINING-013` | Echte Serienverwaltung | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach` | Später: nur diesen Termin, alle Termine, diesen und zukünftige Termine, Serie beenden, Ausnahmen. | initialer MVP-Umfang | Langfristig verpflichtend, aber nicht erster Serienumfang. |
| `FC-TRAINING-014` | Serientermine nicht automatisch wiederherstellen | `planned_mvp` | `MVP-1` | `system` | Gelöschte oder abgesagte Einzeltermine einer Serie dürfen später nicht automatisch neu erzeugt werden. | automatische Wiederherstellung | Wichtig für spätere Serienverwaltung. |

## MATCH — Spiel / Matchday

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-MATCH-001` | Match erstellen | `needs_review` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam kann ein Spiel anlegen. | Kader-Nominierung, Aufstellung, Verbandsdaten | Aktuellen Codezustand prüfen. |
| `FC-MATCH-002` | Match anzeigen | `needs_review` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Matchday-Informationen werden angezeigt. | Live-Ticker, detaillierte Statistik | Rollenabhängige Sichtbarkeit prüfen. |
| `FC-MATCH-003` | Match bearbeiten | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Match kann vor relevantem Startzeitpunkt bearbeitet werden. | Bearbeitung von Kernfeldern ab Treffpunkt/Spielbeginn | Historie, RSVP und Anwesenheit stabil halten. |
| `FC-MATCH-004` | Match löschen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Match kann vor Matchbeginn/Treffpunkt bei Fehleingabe gelöscht werden. | Löschen ab Beginn | Gleiche Grundlogik wie Training. |
| `FC-MATCH-005` | Match absagen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Match kann vor Beginn abgesagt werden; Termin bleibt sichtbar und bekommt Status `abgesagt`. | RSVP-Daten löschen, Pflichtbegründung | Optionale Begründung; RSVP bleibt erhalten. |
| `FC-MATCH-006` | Matchdetails pflegen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Match führt Gegner, Spielort, Treffpunkt-Ort, Treffpunkt-Zeit, Spielbeginn und home/away/neutral. | Schiedsrichter, Dresscode, Kabineninfo, Verbands-Spielnummer | Treffpunkt und Spielort müssen getrennt sein. |
| `FC-MATCH-007` | Gegner als Freitext erfassen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Gegner wird im MVP als Freitext gepflegt. | strukturierte Gegnerdatenbank | Vereins-/Gegnerdatenbank später. |
| `FC-MATCH-008` | Match-RSVP nutzen | `planned_mvp` | `MVP-1` | `player`, `guardian`, `head_coach`, `assistant_coach` | Match nutzt dieselbe RSVP-Logik wie Training; Standard-Ende ist die Treffpunkt-Zeit. | eigenes Match-RSVP-System | Verspätung wird in ATTEND über `late` dokumentiert. |
| `FC-MATCH-009` | Matchergebnis anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Match kann Ergebnis anzeigen, das im REPORT-Modul erfasst wurde. | Ergebnis direkt im Match pflegen | Ergebnis gehört fachlich zu REPORT. |
| `FC-MATCH-010` | Kader nominieren | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach` | Später können Spieler für ein Match nominiert werden. | MVP-Funktion, automatische Kaderempfehlung | Keine Aufstellung/Statistik im MVP. |
| `FC-MATCH-011` | Strukturierte Vereins-/Gegnerdatenbank | `planned_later` | `Later` | `head_coach`, `club_admin` | Gegner/Vereine können später strukturiert verwaltet werden. | MVP-Freitext ersetzen im frühen MVP | Kann stark Richtung Verbands-/Vereinsdatenbank wachsen. |

## RSVP — Zu- und Absagen

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-RSVP-001` | Spieler-RSVP abgeben | `implemented` | `MVP-0A` | `player` | Spieler kann für eigene Termine zusagen, absagen oder `maybe` wählen. | Trainer trägt Spieler-RSVP nach | `maybe` zählt nicht als Zusage. |
| `FC-RSVP-002` | Guardian-RSVP für Kind abgeben | `implemented` | `MVP-0A` | `guardian` | Guardian gibt RSVP für sein Kind ab. | RSVP für fremde Kinder | Guardian-Kind-Zuordnung prüfen. |
| `FC-RSVP-003` | Trainer-RSVP abgeben | `planned_mvp` | `MVP-0B` | `team_owner`, `head_coach`, `assistant_coach` | Trainerteam kann eigene Teilnahme zu Terminen rückmelden. | RSVP für Spieler nachtragen | Bekannte Kernlücke. |
| `FC-RSVP-004` | Trainer-RSVP-Übersicht anzeigen | `implemented` | `MVP-0A` | `head_coach`, `assistant_coach` | Trainerteam sieht Rückmeldungen zu Terminen. | vollständige Statistikplattform | Claude-Review erforderlich. |
| `FC-RSVP-005` | RSVP-Status anzeigen | `implemented` | `MVP-0A` | `head_coach`, `assistant_coach`, `player`, `guardian` | Status wird je Termin sichtbar. | komplexe Historie | Rollenabhängige Sicht prüfen. |
| `FC-RSVP-006` | `maybe` mit optionaler Notiz nutzen | `planned_mvp` | `MVP-1` | `player`, `guardian`, `head_coach`, `assistant_coach` | Nur bei `maybe` kann eine kurze optionale Notiz hinterlegt werden. | allgemeine Notiz bei `yes`/`no`, Gesundheitsdokumentation | Keine strukturierte Krankheits-/Abwesenheitslogik. |
| `FC-RSVP-007` | Optionale RSVP-Deadline festlegen | `planned_mvp` | `MVP-1` | `team_owner`, `head_coach`, `assistant_coach` | Trainer kann Frist setzen; Standard ist bis Terminbeginn bzw. Treffpunkt. | starre globale Frist | Match nutzt standardmäßig Treffpunkt-Zeit. |
| `FC-RSVP-008` | RSVP nach Deadline mit Begründung ändern | `planned_mvp` | `MVP-1` | `player`, `guardian`, `head_coach`, `assistant_coach` | Nach Deadline bleibt Änderung möglich, aber nur mit Begründung. | folgenlose Spätänderung | Vor Terminbeginn; ab Beginn gesperrt. |
| `FC-RSVP-009` | RSVP ab Termin-/Treffpunktbeginn sperren | `planned_mvp` | `MVP-1` | `system` | Ab Startzeit übernimmt ATTEND; RSVP ist nicht mehr änderbar. | nachträgliche RSVP-Änderung | Klare Trennung RSVP vs. Anwesenheit. |
| `FC-RSVP-010` | Trainer trägt RSVP für Spieler nach | `rejected` | `Unassigned` | — | Trainerteam soll keine Spieler-RSVP nachtragen. | — | Tatsächliche Anwesenheit wird in ATTEND gepflegt. |

## ATTEND — Anwesenheit

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-ATTEND-001` | Anwesenheitsliste anzeigen | `needs_review` | `MVP-0A` | `head_coach`, `assistant_coach` | Trainerteam sieht Anwesenheitsliste je Termin. | Spieler-/Guardian-Bearbeitung | Aktuellen Codezustand prüfen. |
| `FC-ATTEND-002` | Anwesenheit erfassen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam setzt `present`, `absent`, `excused` oder `late`. | `injured` als strukturierter Status | `injured` wegen Gesundheitsdatenrisiko nicht MVP-Status. |
| `FC-ATTEND-003` | Verspätung mit Minutenangabe erfassen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Bei `late` kann optional eine Minutenangabe erfasst werden. | Pflicht-Minutenangabe | Besonders für Match-Kontext relevant. |
| `FC-ATTEND-004` | Anwesenheit bis Abschluss bearbeiten | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam kann Anwesenheit bearbeiten, bis Termin abgeschlossen wird. | Bearbeitung durch Spieler/Guardian | Klares Ende durch Abschlusslogik. |
| `FC-ATTEND-005` | Termin-Anwesenheit abschließen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam schließt Anwesenheit ab; danach normale Bearbeitung gesperrt. | stilles Sperren ohne Verantwortlichkeit | Abschluss durch Person sichtbar machen. |
| `FC-ATTEND-006` | Abgeschlossene Anwesenheit wieder öffnen | `planned_mvp` | `MVP-1` | `head_coach` | `head_coach` kann abgeschlossene Anwesenheit wieder öffnen. | Wiederöffnung durch `assistant_coach`, Spieler oder Guardian | Korrekturkompetenz bleibt beim Haupttrainer. |
| `FC-ATTEND-007` | RSVP mit Anwesenheit vergleichen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam kann sehen, ob RSVP und tatsächliche Anwesenheit abweichen. | automatische Sanktionen, Bewertung | Nützlich für Übersicht, keine Disziplinwertung. |
| `FC-ATTEND-008` | Einfache Anwesenheitsübersicht anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Einfache Übersicht pro Spieler: anwesend, abwesend, entschuldigt, verspätet. | Leistungsbewertung, Trendanalysen, Kaderempfehlung, Export | Darf keine Statistikplattform werden. |

## TACTIC — Taktikboard

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-TACTIC-001` | Taktikboard anzeigen | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach` | Späteres Taktikboard als Zusatzfunktion. | MVP-Kernvoraussetzung | Darf Training/RSVP/Anwesenheit nicht verdrängen. |
| `FC-TACTIC-002` | Einfache Formation darstellen | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach` | Einfache Formation kann dargestellt werden. | vollständige Aufstellungsplanung | Kein MVP-0A/MVP-0B. |
| `FC-TACTIC-003` | Taktik speichern | `planned_later` | `Later` | `head_coach`, `assistant_coach` | Taktik kann später gespeichert werden. | komplexe Taktikbibliothek | Später ausarbeiten. |
| `FC-TACTIC-004` | Taktik einem Match zuordnen | `planned_later` | `Later` | `head_coach`, `assistant_coach` | Taktik kann später mit Match verknüpft werden. | Match-MVP | Abhängig von MATCH und ggf. Kader/Aufstellung. |
| `FC-TACTIC-005` | Taktik mit Team teilen | `planned_later` | `Later` | `head_coach`, `assistant_coach`, `player`, `guardian` | Taktik kann später für Team sichtbar gemacht werden. | MVP-Kommunikation | Sichtbarkeit und Datenschutz prüfen. |

## REPORT — Spielberichte

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-REPORT-001` | Spielbericht anzeigen | `needs_review` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Spielberichte können angezeigt werden; Spieler/Guardian sehen nur abgeschlossene Berichte. | Kommentare, Reaktionen, Diskussionen | Sichtbarkeit prüfen. |
| `FC-REPORT-002` | Einfachen Spielbericht erstellen/bearbeiten | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam kann einfachen Bericht erstellen und bearbeiten. | detaillierte Spielerstatistiken, Spielerbewertungen | Bericht wird später nach Abschluss sichtbar. |
| `FC-REPORT-003` | Ergebnis erfassen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Ergebnis wird fachlich im REPORT-Modul erfasst. | Ergebnis direkt im MATCH-Modul pflegen | MATCH darf Ergebnis nur anzeigen. |
| `FC-REPORT-004` | Trainerkommentar erfassen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Sachlicher Trainerkommentar zum Match. | Einzelkritik, sensible personenbezogene Bewertung | Da Spieler/Guardian lesen können, Formulierung sachlich halten. |
| `FC-REPORT-005` | Spielbericht als Entwurf speichern | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Bericht kann ohne Ergebnis als Entwurf gespeichert werden. | Sichtbarkeit für Spieler/Guardian im Entwurf | Entwürfe nur intern. |
| `FC-REPORT-006` | Spielbericht abschließen | `planned_mvp` | `MVP-1` | `head_coach` | `head_coach` kann Bericht abschließen; Abschluss verlangt Ergebnis. | Abschluss durch `assistant_coach`, Freigabe durch Vereinsadmin | Nach Abschluss nicht mehr normal bearbeitbar. |
| `FC-REPORT-007` | Abgeschlossenen Bericht für Spieler/Guardian freigeben | `planned_mvp` | `MVP-1` | `player`, `guardian` | Nach Abschluss dürfen Spieler/Guardian Ergebnis und Bericht lesen. | Kommentare, Reaktionen, Chat | Keine Diskussionsfunktion. |
| `FC-REPORT-008` | Detaillierte Spielerstatistiken erfassen | `planned_later` | `Post-MVP` | `head_coach`, `assistant_coach` | Torschützen, Assists, Karten, Minuten ggf. später. | frühes MVP | Kann schnell zu Statistikplattform werden. |

## NOTIFY — Benachrichtigungen / Hinweise

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-NOTIFY-001` | Kontextuelle In-App-Hinweise anzeigen | `planned_mvp` | `MVP-1` | `authenticated_user` | Hinweise erscheinen kontextuell in Dashboard, Termin-, RSVP- oder Invite-Bereichen. | eigenes Notification-Center im frühen MVP | Schlank halten. |
| `FC-NOTIFY-002` | Absagehinweis anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach`, `player`, `guardian` | Abgesagte Termine werden deutlich sichtbar markiert. | Push/E-Mail | Terminstatus gehört zu TRAINING/MATCH, Hinweis zu NOTIFY/DASHBOARD. |
| `FC-NOTIFY-003` | Offene RSVP anzeigen | `planned_mvp` | `MVP-1` | `player`, `guardian`, `head_coach`, `assistant_coach` | Offene Rückmeldungen werden in der App sichtbar. | externe Benachrichtigung | Abhängig von RSVP. |
| `FC-NOTIFY-004` | RSVP-Deadline überschritten anzeigen | `planned_mvp` | `MVP-1` | `player`, `guardian`, `head_coach`, `assistant_coach` | Überfällige Rückmeldungen werden sichtbar. | automatische Sanktionen | Muss mit RSVP-Deadline konsistent sein. |
| `FC-NOTIFY-005` | Offene Beitrittsanfrage anzeigen | `planned_mvp` | `MVP-1` | `head_coach` | Offene Join-Requests werden sichtbar angezeigt. | Genehmigung durch Co-Trainer | Abhängig von INVITE. |
| `FC-NOTIFY-006` | Geänderte Spielerstammdaten anzeigen | `planned_mvp` | `MVP-1` | `head_coach`, `assistant_coach` | Trainerteam sieht Hinweis, wenn Spieler/Guardian Stammdaten geändert haben. | komplexer Audit-Verlauf in UI | Wichtig bei Name/Geburtsdatum. |
| `FC-NOTIFY-007` | Notification-Center | `planned_later` | `Post-MVP` | `authenticated_user` | Später zentraler Hinweisbereich mit gelesen/ungelesen. | früher MVP | Zusätzliche Datenmodell- und UX-Komplexität. |
| `FC-NOTIFY-008` | Push-Benachrichtigungen | `planned_later` | `Post-MVP` | `authenticated_user` | Später Push über PWA/native App. | MVP-0A/MVP-0B | Abhängig von PWA/Push-Infrastruktur. |
| `FC-NOTIFY-009` | E-Mail-Benachrichtigungen | `planned_later` | `Post-MVP` | `authenticated_user` | Später E-Mail-Hinweise für relevante Ereignisse. | früher MVP | E-Mail-Zustellbarkeit, Opt-out, Einstellungen. |
| `FC-NOTIFY-010` | Benachrichtigungseinstellungen verwalten | `planned_later` | `Post-MVP` | `authenticated_user` | Nutzer kann später Kanäle/Ereignisse konfigurieren. | MVP-Funktion | Abhängig von Push/E-Mail/Notification-Center. |

## MOBILE — Mobile Nutzung / PWA

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-MOBILE-001` | Mobile-optimierte App-Nutzung | `planned_mvp` | `MVP-1` | `authenticated_user` | Vereon soll auf Smartphones hochwertig nutzbar sein. | nur grob responsives Desktop-Layout | Mobile UX ist zentral für Trainer/Eltern/Spieler. |
| `FC-MOBILE-002` | Mobile Navigation | `planned_mvp` | `MVP-1` | `authenticated_user` | Mobile Navigation unterstützt schnelle Nutzung im Alltag. | komplexe App-Shell vor Kernflow | Muss mit Dashboard und Rollenlogik konsistent sein. |
| `FC-MOBILE-003` | PWA-installierbar mit App-Icon | `partial` | `MVP-1` | `authenticated_user` | PWA-Grundlagen vorhanden (Manifest, Icons, `appleWebApp`-Metadaten, Phase PWA.1 committed); praktische Installierbarkeit und Qualität (Smartphone-Install-Test, Lighthouse-PWA-Audit) müssen noch geprüft werden. | native App Store App | Installierbar bedeutet im MVP PWA. |
| `FC-MOBILE-004` | Push-Benachrichtigungen mobil nutzen | `planned_later` | `Post-MVP` | `authenticated_user` | Spätere mobile Push-Funktion. | MVP-0A/MVP-0B | Gehört zu NOTIFY. |
| `FC-MOBILE-005` | Offlinefähigkeit | `planned_later` | `Later` | `authenticated_user` | Später teilweise Offline-Nutzung. | früher MVP | Hohe Komplexität bei Sync/Konflikten. |
| `FC-MOBILE-006` | Native iOS-/Android-App | `planned_later` | `Later` | `authenticated_user` | Später mögliche native App. | MVP-0A/MVP-0B | Store, Builds, Wartung, Push-Infrastruktur. |

## LEGAL — Legal-/Consent-Funktionen

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-LEGAL-001` | Impressum anzeigen | `partial` | `MVP-0B` | `anonymous_user`, `authenticated_user` | Impressumsseite ist sichtbar. | finale juristische Textprüfung | Aktuell ggf. Platzhalter; rechtlich prüfen. |
| `FC-LEGAL-002` | Datenschutzerklärung anzeigen | `partial` | `MVP-0B` | `anonymous_user`, `authenticated_user` | Datenschutzerklärung ist sichtbar. | vollständige DSGVO-Ausarbeitung in dieser Datei | Gehört in `DSGVO_PRIVACY_MODEL.md` und juristische Prüfung. |
| `FC-LEGAL-003` | Join-Flow-Hinweise anzeigen | `planned_mvp` | `MVP-0B` | `player`, `guardian` | Join-Flow zeigt relevante Hinweise zu Anmeldung und Datenverarbeitung. | vollständige Rechtsberatung | Muss verständlich und knapp sein. |
| `FC-LEGAL-004` | Guardian-Berechtigungsbestätigung erfassen | `planned_mvp` | `MVP-1` | `guardian` | Guardian bestätigt direkt im Guardian-Kind-Join-Flow, dass er/sie berechtigt ist, das Kind anzumelden. | digitale Signatur, Nachweis-Upload, Dokumentenmanagement | Wichtig für Minderjährigenlogik. |
| `FC-LEGAL-005` | Datenschutz-/Löschanfrage-Kontaktweg anzeigen | `planned_mvp` | `MVP-1` | `authenticated_user`, `anonymous_user` | Nutzer sieht klaren Kontaktweg für Datenschutz- oder Löschanfragen. | automatisierte Kontolöschung, Datenexport, Self-Service-Portal | Vollständige Prozesse in DSGVO-Dokumentation. |
| `FC-LEGAL-006` | DSGVO-Self-Service anbieten | `planned_later` | `Post-MVP` | `authenticated_user` | Später automatisierter Export-/Löschanfrageprozess. | früher MVP | Hohe rechtliche und technische Komplexität. |

## ADMIN — internes Vereon-Admin-Panel

| ID | Feature | Status | Phase | Rollen | Kurzbeschreibung | Nicht enthalten | Abhängigkeiten / Risiko |
|---|---|---|---|---|---|---|---|
| `FC-ADMIN-001` | Vereine / Organisationen anzeigen | `candidate` | `Later` | `super_admin` | Internes Admin-Panel kann später Organisationen anzeigen. | MVP-0A/MVP-0B, direkte Datenbankansicht | Datenschutz und Zugriffsschutz kritisch. |
| `FC-ADMIN-002` | Nutzer suchen | `candidate` | `Later` | `super_admin` | Interne Plattformadministration kann Nutzer zu Supportzwecken suchen. | freie Bearbeitung fremder Daten | Zugriff streng begrenzen. |
| `FC-ADMIN-003` | Teams eines Vereins einsehen | `candidate` | `Later` | `super_admin` | Support kann später Teams einer Organisation einsehen. | unkontrollierter Datenzugriff | Rollen- und Auditmodell nötig. |
| `FC-ADMIN-004` | Support-relevante Stammdaten einsehen | `candidate` | `Later` | `super_admin` | Nur notwendige Stammdaten für Supportfälle einsehen. | private Inhalte, Gesundheitsdaten, freie Datenbearbeitung | Datenminimierung auch intern beachten. |
| `FC-ADMIN-005` | Plattformweite Hinweise verwalten | `planned_later` | `Later` | `super_admin` | Interne Admins können später globale Hinweise verwalten. | Marketing-/CMS-System | Nicht MVP. |
| `FC-ADMIN-006` | Impersonation nutzen | `rejected` | `Unassigned` | — | Impersonation ist nicht als normales Feature vorgesehen. | — | Hochriskant; nur mit separater Security-Entscheidung. |
| `FC-ADMIN-007` | Direkten Datenbankzugriff über Admin-Panel anbieten | `rejected` | `Unassigned` | — | Direkter DB-Zugriff ist keine Produktfunktion. | — | Technische Administration gehört nicht in Feature-Katalog. |

---

# 12. Claude Review Targets

Nach dem manuellen Einfügen von `docs/FEATURE_CATALOG.md` soll Claude im Review-only-Modus prüfen:

1. Stimmen alle `implemented`-Statuswerte mit Repo, UI, Server Actions, Migrationen, RLS und vorhandener Dokumentation überein?
2. Gibt es Features, die im Code existieren, aber im Katalog fehlen?
3. Gibt es Features, die im Katalog stehen, aber nicht durch Code, Migrationen oder Dokumentation gedeckt sind?
4. Gibt es Features, die anders implementiert sind als hier fachlich geplant?
5. Gibt es Konflikte zwischen Feature-Katalog und `ROLES_AND_PERMISSIONS.md`?
6. Gibt es Konflikte zwischen Feature-Katalog und `DATABASE_MODEL.md`?
7. Gibt es Konflikte zwischen Feature-Katalog und `SECURITY.md`?
8. Gibt es DSGVO-/Datenminimierungsrisiken, insbesondere bei Geburtsdatum, Guardian-Kontaktpersonen und Minderjährigenlogik?
9. Wurden Future Domains versehentlich zu konkretem MVP-Scope gemacht?
10. Sind Out-of-Scope-Grenzen eingehalten?
11. Sind bekannte MVP-0B-Kernlücken korrekt sichtbar?
12. Werden technische Tasks fälschlich als Produktfeatures geführt?

Claude soll nach dem Review eine Status-/Konflikt-Matrix liefern:

| Feature-ID | Feature | Status laut Katalog | Status laut Repo-Prüfung | Konflikt? | Empfohlene Änderung | Begründung |
|---|---|---|---|---|---|---|

Claude soll im ersten Review keine Datei automatisch umbauen, sondern Abweichungen und Korrekturvorschläge melden.

## 13. Nachgelagerte Dokumente

Folgende Dokumente sollen sich künftig am Feature-Katalog ausrichten:

- `MVP_SCOPE.md`
- `USER_FLOWS.md`
- `ROLES_AND_PERMISSIONS.md`
- `DATABASE_MODEL.md`
- `SECURITY.md`
- `DSGVO_PRIVACY_MODEL.md`
- `DESIGN_SYSTEM.md`
- `MVP_TEST_CHECKLIST.md`

Der Feature-Katalog ersetzt diese Dokumente nicht. Er definiert die fachliche Funktionsbasis, an der diese Dokumente später abgeglichen werden.
