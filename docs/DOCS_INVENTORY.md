# Dokumentations-Inventar — docs/

**Stand: 2026-07-06.** Reine Bestandsaufnahme vor jeder Bereinigung. Keine der unten aufgeführten Dateien wurde durch dieses Inventar verändert, verschoben, umbenannt oder gelöscht. Grundlage: vollständige Lektüre aller 21 Markdown-Dateien in `docs/` (Stichprobenverifikation zweier zentraler Befunde gegen den tatsächlichen Dateiinhalt).

---

## 1. `PRODUCT_VISION.md`

**Zweck:** Produktvision auf hoher Flughöhe — zentrale Plattform für Fußballvereine (Jugend bis Kampfmannschaft) als Ersatz für WhatsApp-Gruppen/Excel/Papier. Definiert Zielgruppen, langfristige Kernfunktionen, Multi-Tenant-Konzept und Zielplattformen (Web/PWA/iOS/Android).

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** behalten
**Begründung:** Aspirative Aussagen ohne konkretes Datumsfeld, aber nicht durch Code widerlegt — bleibt als Nordstern-Dokument gültig.
**Überschneidungen:** `MOBILE_APP_STRATEGY.md` (Plattform-Roadmap nahezu identisch wiederholt).
**Risiko bei Fehlinterpretation:** Gering — könnte höchstens dazu verleiten, Funktionen als „MVP-relevant" zu behandeln, die laut `MVP_SCOPE.md` erst in späteren Phasen kommen.

---

## 2. `ROADMAP.md`

**Zweck:** Checkbox-Roadmap über Phase 0–6 (Grundgerüst → Auth → Teams/Spieler → Kalender/RSVP → Anwesenheit/Spielberichte → Kommunikation/Finanzen → PWA/Mobile), inklusive einer expliziten „nicht geplant"-Liste (Livestream, Videoanalyse, öffentliche Vereinswebsite).

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** später archivieren
**Begründung:** Checkboxen sind bei „Phase 0" eingefroren, obwohl laut `PROJECT_STATUS.md` (Stand 2026-07-02) und `STATUS.md` (Stand 2026-07-06) der komplette MVP-0A-Kernflow (Auth, Teams, Einladungen, Beitrittsanfragen, Trainings, RSVP, PWA-Basismetadaten) längst gebaut ist. Verwendet zudem eine eigene Phasen-Taxonomie (0–6), die inzwischen durch die MVP-0A/0B/1/2- bzw. Buchstaben-Phasen-Systematik in `CURRENT_TASK.md` ersetzt wurde.
**Überschneidungen:** `MVP_SCOPE.md`, `PROJECT_BRIEF.md` §3 (gleiche Grobplanung, inkompatible Nummerierung).
**Risiko bei Fehlinterpretation:** Hoch — wer nur diese Datei liest, hält das Projekt für unbegonnen, obwohl es weit fortgeschritten ist.

---

## 3. `MOBILE_APP_STRATEGY.md`

**Zweck:** Gestuftes Mobile-Konzept — Stufe 1 responsive Web (jetzt), Stufe 2 PWA (Manifest, Service Worker, Push), Stufe 3 nativ via Capacitor (bevorzugt) oder React Native/Expo (Fallback), inklusive technischer Vorbereitungshinweise.

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** behalten
**Begründung:** Die Entscheidungsbegründung (Capacitor statt React Native) ist dauerhaft gültig. Stufe 2 ist laut `ARCHITECTURE.md` (Stand 2026-07-06) bereits teilweise umgesetzt (`app/manifest.ts`, Icons) — die Datei selbst formuliert das noch rein zukünftig, ohne diesen Teilfortschritt zu nennen.
**Überschneidungen:** `PRODUCT_VISION.md` (Plattform-Liste), `PROJECT_STATUS.md`/`MVP_TEST_CHECKLIST.md` (Phase-PWA.1-Einträge als Umsetzungsstand dieser Strategie).
**Risiko bei Fehlinterpretation:** Mittel — könnte dazu führen, PWA-Grundlagen für „noch nicht begonnen" zu halten.

---

## 4. `TECH_STACK.md`

**Zweck:** Tabellarische Tech-Stack-Übersicht (Next.js 16, React 19, TypeScript 5, Tailwind v4, Supabase ohne ORM, kein NextAuth), inklusive „geplanter Ergänzungen" (server-only, Supabase CLI, Zod) und „nicht verwendet"-Liste (NextAuth, Prisma/Drizzle, Redux/Zustand — Status „Entscheidung steht aus").

**Empfohlener Memory-Typ:** Cold Memory
**Status:** kritisch prüfen
**Begründung:** Nennt nur 3 Supabase-Client-Varianten (server/client/middleware), tatsächlich existieren laut `ARCHITECTURE.md`/`SUPABASE_STRATEGY.md` 4 (inklusive `route-handler.ts`). Führt Zod als „geplante Ergänzung", obwohl `ARCHITECTURE.md` bestätigt, dass Zod nie installiert wurde und Validierung manuell erfolgt. Die „Entscheidung steht aus"-Formulierung zu Redux/Zustand ist faktisch längst beantwortet (keins von beiden wird verwendet, kein globaler State außer Theme-Context).
**Überschneidungen:** `SUPABASE_STRATEGY.md` (Client-Strategie-Tabelle, dort aktueller), `ARCHITECTURE.md` (tatsächliche installierte Versionen).
**Risiko bei Fehlinterpretation:** Mittel-Hoch — könnte dazu führen, Zod als „geplant, aber noch zu installieren" zu behandeln und unnötig zu installieren, obwohl das laut `CLAUDE.md` ohnehin nur nach Bestätigung dürfte.

---

## 5. `SUPABASE_STRATEGY.md`

**Zweck:** Detaillierter Supabase-Integrationsleitfaden — 4 Client-Kontexte mit vollständigen Codebeispielen, `proxy.ts`-Routing, Auth-Flow, sichere Vereinserstellung via `create_club()`, RLS-Prinzipien, SECURITY-DEFINER-Härtung, Env-Var-Regeln, lokale Supabase-Ports, Typgenerierung.

**Empfohlener Memory-Typ:** Cold Memory
**Status:** kritisch prüfen
**Begründung:** Größtenteils weiterhin zutreffend und laut `ARCHITECTURE.md` (Stand 2026-07-06) durch unabhängige Code-Analyse bestätigt — eines der verlässlicheren Dokumente. Zwei konkrete Widersprüche: (a) beschreibt `src/proxy.ts` als „minimale Version... noch keine Redirects", tatsächlich ist laut `ARCHITECTURE.md` die vollständige Redirect-Logik (`PUBLIC_ROUTES`/`PUBLIC_PREFIXES`) bereits implementiert; (b) behauptet, `database.types.ts` „wird nach jeder Schemamigration neu generiert" — tatsächlich ist die Datei laut `ARCHITECTURE.md`/`STATUS.md` weiterhin nur ein 7-Zeilen-Stub.
**Überschneidungen:** `TECH_STACK.md`, `SECURITY.md`, `ROLES_AND_PERMISSIONS.md` (RLS-Helper-SQL mehrfach dupliziert), `DATABASE_MODEL.md` (expliziter Verweis auf `create_club()`).
**Risiko bei Fehlinterpretation:** Mittel — falsche Annahme, generierte DB-Typen existierten bereits, könnte zu ungeprüftem `any`-artigem Umgang mit Supabase-Rückgaben führen.

---

## 6. `MONETIZATION_STRATEGY.md`

**Zweck:** Geschäfts-/Preismodell — Grundsatz „Eltern zahlen nie für Kernfunktionen", vier Pläne (Free Team, Team Plus, Club Basic, Club Pro) mit Feature-Tabellen, Add-ons für Phase 3+, zukünftiges Billing-Schema (Stripe empfohlen), offene Preisfragen.

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** behalten
**Begründung:** Explizit als „nicht in MVP 0 umgesetzt, Billing-Infrastruktur kommt in Phase 3" gekennzeichnet — konsistent mit dem Codestand (kein Billing-Code, keine entsprechenden Tabellen vorhanden laut `STATUS.md`/`ARCHITECTURE.md`).
**Überschneidungen:** `PROJECT_BRIEF.md` §7 (kondensierte Zusammenfassung mit Rückverweis auf diese Datei).
**Risiko bei Fehlinterpretation:** Gering — Datei ist in sich konsistent und wird durch nichts widersprochen.

---

## 7. `USER_FLOWS.md`

**Zweck:** 11 nummerierte Schritt-für-Schritt-Nutzerflows über MVP 0A/0B/1/2 (Team-Erstellung, Einladungslink, Self-Service-Beitritt, Trainer-Freigabe, Event/RSVP, Vereinserstellung, Guardian-Verknüpfung, Team-Affiliation) plus „zukünftige Flows".

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** später zusammenführen
**Begründung:** Inhaltlich nahezu deckungsgleich mit `MVP_SCOPE.md` — dieselben Flows, einmal aus Flow-Perspektive, einmal aus Scope-/Akzeptanzkriterien-Perspektive beschrieben, ohne gegenseitigen Verweis.
**Überschneidungen:** `MVP_SCOPE.md` (fast vollständige inhaltliche Dopplung), `DATABASE_MODEL.md`/`ROLES_AND_PERMISSIONS.md` (gleiche Tabellen-/RPC-/Rollennamen).
**Risiko bei Fehlinterpretation:** Mittel — beschreibt Vereinsverifikations-Flows (Flow 6–8) so, als wären sie aktiv nutzbar; laut `STATUS.md` existiert dafür keinerlei UI.

---

## 8. `MVP_SCOPE.md`

**Zweck:** MVP-Philosophie und detaillierter Funktionsumfang je Stufe (0A/0B/1/2) mit Feature-Listen, Akzeptanzkriterien, Routen, Definition-of-Done-Checklisten, „nicht in MVP"-Tabelle und idealisierter Migrations-Reihenfolge (`001_init_mvp0_core`, `002_mvp0a_team_flows`, …, `005_mvp2_affiliation`).

**Empfohlener Memory-Typ:** Strategy Memory
**Status:** kritisch prüfen
**Begründung:** Die idealisierte Migrationsnummerierung widerspricht den tatsächlichen, vollständig zeitgestempelten Dateinamen (z. B. `20260625190923_init_mvp0_core.sql`) und nennt keine der 11 zusätzlichen, ungeplanten Hotfix-Migrationen. Die Definition-of-Done-Checkboxen sind unverändert leer, obwohl laut `PROJECT_STATUS.md`/`CURRENT_TASK.md` die meisten MVP-0A-Punkte erledigt sind.
**Überschneidungen:** `USER_FLOWS.md` (Flow-Dopplung), `PROJECT_BRIEF.md` §3, `DATABASE_MODEL.md` „Migrations-Reihenfolge" (gleiche idealisierte Tabelle).
**Risiko bei Fehlinterpretation:** Hoch — eine künftige Session könnte versuchen, Migrationen gemäß `001_/002_`-Schema neu anzulegen oder umzubenennen, obwohl die echten Dateien längst existieren und angewendet sind.

---

## 9. `ROLES_AND_PERMISSIONS.md`

**Zweck:** Vollständiges Rollen-/Berechtigungsmodell — Begründung für Mehrfachrollen-Mitgliedschaft, Tabellenaufteilung `club_member_roles`/`team_member_roles`, vollständiger Rollenkatalog (System-/Club-/Team-Scope), `team_owner`-vs.-`head_coach`-Vergleich, Berechtigungsmatrix, Guardian-Rechte-Modell, RLS-Helper-Funktionen, Seed-Insert für die `roles`-Tabelle.

**Empfohlener Memory-Typ:** Cold Memory
**Status:** behalten
**Begründung:** Architektur ändert sich selten, Inhalt intern weitgehend konsistent. Kleinere Inkonsistenz: Text spricht von „21 Rollen", das tatsächliche Seed-Insert listet nur 19 Zeilen; `DATABASE_MODEL.md` wiederum nennt „22 Rollen inkl. team_owner".
**Überschneidungen:** `PROJECT_BRIEF.md` §4 (kondensiert mit Rückverweis), `SECURITY.md`/`SUPABASE_STRATEGY.md` (RLS-Helper-SQL fast wortgleich dupliziert), `DSGVO_PRIVACY_MODEL.md`/`DATABASE_MODEL.md` (Guardian-Rechte-Modell).
**Risiko bei Fehlinterpretation:** Mittel — laut `ARCHITECTURE.md` sind nur `team_owner`, `head_coach`, `player`, `guardian` tatsächlich im Code verdrahtet; alle übrigen hier dokumentierten Rollen (Club-Rollen, `assistant_coach`, `team_manager` etc.) existieren nur als Planung, ohne aktiven UI-/RLS-Pfad — Verwechslungsgefahr zwischen „dokumentiert" und „implementiert".

---

## 10. `SECURITY.md`

**Zweck:** Sicherheitsarchitektur-Referenz — Kernregeln (serverseitige Auth, RLS-Pflicht, keine clientseitigen Secrets), 9 nummerierte Risiken mit SQL-Gegenmaßnahmen (Privilege Escalation, unsichere Tokens, RSVP-Fälschung, Tenant-Crossing, Guardian-Rechte ohne Verifikation, fehlende RLS-Indexes, Schema-Injection, Kindsdaten, Trainer-Datenmissbrauch), abschließende Risiko-Übersichtstabelle.

**Empfohlener Memory-Typ:** Cold Memory
**Status:** kritisch prüfen
**Begründung:** Verifiziert (Zeilen 234–251): Die Status-Spalte der Übersichtstabelle markiert praktisch jede Maßnahme als **„Geplant"** — z. B. „Privilege Escalation (erster team_owner) — Geplant", „Unsichere Invitation Tokens — Geplant" — obwohl `create_independent_team()`, `create_club()`, 32-Byte-Tokens und die zugehörigen RLS-Policies laut `ARCHITECTURE.md`/`PROJECT_STATUS.md` seit Migration `20260625190923` implementiert sind. Die Tabelle wurde nach der tatsächlichen Umsetzung nie aktualisiert.
**Überschneidungen:** `SUPABASE_STRATEGY.md`/`ROLES_AND_PERMISSIONS.md` (RLS-/SECURITY-DEFINER-Muster dupliziert), `DSGVO_PRIVACY_MODEL.md` (Risiken 8/9 fast wortgleich).
**Risiko bei Fehlinterpretation:** Hoch — eine künftige Session könnte bereits umgesetzte Sicherheitsmaßnahmen für „noch zu bauen" halten und versuchen, sie doppelt zu implementieren, oder umgekehrt fälschlich annehmen, das System sei ungesichert.

---

## 11. `PROJECT_BRIEF.md`

**Zweck:** Kompakte, an Claude Code gerichtete Zusammenfassung — Produktvision, Architekturentscheidungstabelle, MVP-Reihenfolge (mit idealisierter `001_/002_`-Migrationsnummerierung), Rollenprinzipien, Datenmodellprinzipien, DSGVO-Prinzipien, Monetarisierungsprinzipien, harte Sicherheitsregeln, §9 „Nächster geplanter technischer Schritt".

**Empfohlener Memory-Typ:** Cold Memory
**Status:** kritisch prüfen
**Begründung:** Verifiziert (Zeile 160–170): §9 behauptet wörtlich, Migration 001 (`20260625190923_init_mvp0_core.sql`) müsse noch befüllt werden, „Aktueller Migrationsstand: Datei angelegt, **noch leer**". Tatsächlich sind laut `PROJECT_STATUS.md`, `CURRENT_TASK.md` und `ARCHITECTURE.md` längst 13 Migrationen geschrieben und angewendet, der komplette MVP-0A-Kernflow ist gebaut und getestet. Dies ist der schwerwiegendste Einzelbefund im gesamten Ordner — die Datei ist zugleich laut `CLAUDE.md` **Pflichtlektüre zu Sessionbeginn**.
**Überschneidungen:** Fungiert als Index-Dokument, verlinkt fast jede andere Datei (`SUPABASE_STRATEGY.md`, `DATABASE_MODEL.md`, `MVP_SCOPE.md`, `USER_FLOWS.md`, `ROLES_AND_PERMISSIONS.md`, `DSGVO_PRIVACY_MODEL.md`, `MONETIZATION_STRATEGY.md`).
**Risiko bei Fehlinterpretation:** Sehr hoch — als verpflichtende erste Lektüre könnte diese Datei eine neue Session dazu bringen, Migration 001 „von vorne" zu befüllen oder den Auth-Flow als „noch zu bauen" zu behandeln, obwohl beides längst existiert.

---

## 12. `DECISION_LOG.md`

**Zweck:** Entscheidungs-Log (ADR-Stil) — bislang ein einzelner, datierter Eintrag (2026-06-29) zur Umstellung von registrierungsbasierter (`onboarding_role`) auf datenbasierte Rollen-/Ansichtslogik, inklusive Ausblick auf einen künftigen Ansichtswechsler.

**Empfohlener Memory-Typ:** Warm Memory
**Status:** behalten
**Begründung:** Format (append-only, mit Datum) ist korrekt und funktioniert, wird aber nicht konsequent genutzt — seit dem 2026-06-29-Eintrag gab es mindestens zwei weitere entscheidungswürdige Änderungen (Umstellung `date_of_birth` → `birth_year`, Einführung des `ConfirmButton`-Musters), die hier nicht dokumentiert wurden.
**Überschneidungen:** `ROLES_AND_PERMISSIONS.md`, `DATABASE_MODEL.md` (explizit referenziert), `DESIGN_SYSTEM.md` (verlinkt zurück auf diesen Eintrag).
**Risiko bei Fehlinterpretation:** Gering — der eine vorhandene Eintrag ist korrekt, das Risiko liegt eher in dem, was hier fehlt, nicht in Falschaussagen.

---

## 13. `DESIGN_SYSTEM.md`

**Zweck:** UI-/UX-Leitfaden — Designprinzipien, vollständiges Farbtoken-System (Light/Dark), Typografie, Spacing, Komponenten-Spezifikationen (Button, Card, Badge, PageHeader, EmptyState, FormError, Input/Label), Seiten- und Navigationsmuster, rollenbasierte UI-Muster, Tabelle „geplante Erweiterungen" und „offene Design-Entscheidungen".

**Empfohlener Memory-Typ:** Cold Memory
**Status:** behalten
**Begründung:** Inhaltlich weitgehend aktuell — die dokumentierte Komponentenliste stimmt laut `ARCHITECTURE.md` mit dem tatsächlichen Bestand unter `components/ui/` überein. Die Datei erwähnt `ConfirmButton` nicht, was darauf hindeutet, dass sie vor dessen Einführung (Migration `20260704120000`) geschrieben wurde — kein Widerspruch, nur eine Lücke.
**Überschneidungen:** `DECISION_LOG.md`, `MOBILE_APP_STRATEGY.md` (PWA-Zeile), `ARCHITECTURE.md` §3 (tatsächlicher Komponentenbestand).
**Risiko bei Fehlinterpretation:** Gering — `PROJECT_STATUS.md` (Stand 2026-07-02) führt diese Datei fälschlich als „fehlt — noch nicht angelegt", obwohl sie bereits existiert; das Fehlinterpretationsrisiko liegt dort, nicht in dieser Datei selbst.

---

## 14. `MVP_TEST_CHECKLIST.md`

**Zweck:** Manuelle QA-Checkliste für den MVP-Kernflow — drei Testrollen (Trainer/Spieler/Guardian), 11-Schritte-Kernflow-Checkliste, Fehlerfall-Prüfungen, DSGVO-/Sichtbarkeitsprüfungen, SQL-Verifikationsqueries, Retest-Protokoll mit dokumentierten Ergebnissen (Retest 2026-07-01, Playwright-E2E 5/5 grün, PWA.1-Verifikation 2026-07-02).

**Empfohlener Memory-Typ:** QA Memory
**Status:** behalten
**Begründung:** Von den lebenden Dokumenten das am aktivsten und genauesten gepflegte — Retest-Einträge bis 2026-07-02 vorhanden, keine erkennbaren Widersprüche zum Codestand.
**Überschneidungen:** `PROJECT_STATUS.md`/`CURRENT_TASK.md` (Phase-M- und PWA.1-Status dort ebenfalls gelistet).
**Risiko bei Fehlinterpretation:** Gering.

---

## 15. `DSGVO_PRIVACY_MODEL.md`

**Zweck:** Datenschutz-/DSGVO-Referenz nach dem Privacy-by-Design-Prinzip — Rechtsgrundlagen (DSGVO, österreichisches DSG 2018), besonderer Minderjährigenschutz, minimales Spielerprofil-Schema (Geburtsjahr statt vollem Geburtsdatum), explizit ausgeschlossene Felder, rollenbasierte Datenzugriffsmatrix, Lösch-/Austrittsprozesse, offene Fragen (AV-Vertrag, Datenschutzerklärung, Einwilligungsprozess, DPIA, Datenregion).

**Empfohlener Memory-Typ:** Legal/Compliance Memory
**Status:** behalten
**Begründung:** Inhaltlich weiterhin korrekt — die Kopfzeile nennt „Stand: 2026-06-25", der Text referenziert jedoch an einer Stelle bereits die Migration `20260702000000_players_birth_year_only` (2. Juli), d. h. der Inhalt wurde nach dem angegebenen Stand-Datum ergänzt, ohne dieses zu aktualisieren.
**Überschneidungen:** `LEGAL_TODO.md` (explizit referenziert), `PROJECT_BRIEF.md` §6 (kondensiert), `SECURITY.md` (Risiken 8/9), `DATABASE_MODEL.md` (`players`/`player_guardians`-Definitionen).
**Risiko bei Fehlinterpretation:** Mittel — das veraltete Stand-Datum könnte den Eindruck erwecken, der Geburtsjahr-Passus sei nachträglich unvollständig ergänzt, obwohl er inhaltlich korrekt ist.

---

## 16. `DATABASE_MODEL.md`

**Zweck:** Kanonisches, geplantes Datenmodell — vollständige, DDL-artige Tabellendefinitionen für alle Phasen (Migration 001 bis MVP 2), Beziehungsdiagramm, Index-Strategie, SECURITY-DEFINER-Funktionsspezifikationen, idealisierte Migrations-Reihenfolge, Tabelle offener Entscheidungen.

**Empfohlener Memory-Typ:** Cold Memory
**Status:** kritisch prüfen
**Begründung:** Dieselbe idealisierte Migrationsnummerierung (`001_init_mvp0_core` usw.) wie in `MVP_SCOPE.md`/`PROJECT_BRIEF.md`, widerspricht den realen zeitgestempelten Dateinamen. Zusätzlich: Rollenanzahl „22 Rollen inkl. team_owner" (Zeile 724) widerspricht dem tatsächlichen 19-Zeilen-Seed-Insert in `ROLES_AND_PERMISSIONS.md`. Die Datei vermischt zwei Zeitpunkte unter einem unveränderten „Stand"-Datum (ursprüngliches Schema plus ein nachträglicher Hinweis auf die Geburtsjahr-Migration).
**Überschneidungen:** `PROJECT_BRIEF.md`, `MVP_SCOPE.md` (gleiche idealisierte Migrationstabelle), `SECURITY.md`/`ROLES_AND_PERMISSIONS.md`/`DSGVO_PRIVACY_MODEL.md` (Schemadetails referenziert von dort).
**Risiko bei Fehlinterpretation:** Hoch — als „kanonisches" Schema-Referenzdokument könnte es fälschlich als Quelle für die tatsächliche DB-Struktur herangezogen werden, statt die realen Migrationsdateien zu prüfen.

---

## 17. `PROJECT_STATUS.md`

**Zweck:** Fortschritts-Tracking — Checkliste umgesetzter Features (alle mit ✓ markiert), aktueller MVP-Funktionsumfang je Rolle, Tabelle der 12 lokal angewendeten Migrationen, UI-/UX-Stand, Dokumentationsstand-Tabelle, offene Pilot-Lücken, nächste empfohlene Schritte.

**Empfohlener Memory-Typ:** Warm Memory
**Status:** kritisch prüfen
**Begründung:** „Stand: 2026-07-02" — vier Tage älter als `STATUS.md` (2026-07-06) und kennt daher weder Migration 13 (`20260704120000_remove_player_from_team`) noch das dazugehörige, aktuell uncommittete Feature (`ConfirmButton`, `RemovePlayerButton`, `removePlayerFromTeamAction`). Zusätzlich führt die Dokumentationsstand-Tabelle (Zeile 126) `DESIGN_SYSTEM.md` fälschlich als „fehlt — noch nicht angelegt", obwohl diese Datei bereits am 2026-06-29 (vor dem Stand-Datum dieser Tabelle) angelegt wurde.
**Überschneidungen:** `CURRENT_TASK.md` (nahezu identische Migrationstabelle), `MVP_TEST_CHECKLIST.md` (Phase-Status dupliziert), `LEGAL_TODO.md` (offene Pilot-Lücken dupliziert).
**Risiko bei Fehlinterpretation:** Hoch — als „aktueller Gesamtstatus" gelesen, verbirgt diese Datei genau das wichtigste offene Risiko im Projekt (uncommittetes Feature).

---

## 18. `CURRENT_TASK.md`

**Zweck:** Laufender Phasen-/Aufgaben-Log — Liste abgeschlossener, benannter Phasen (A bis P.2A, plus M.1–M.4, PWA.1) mit Commit-Bezug, Abschnitt „Aktuelle Hauptaufgabe" mit offenen Entscheidungen, Ausschlussliste „Nicht in der nächsten Phase", erlaubte/verbotene Aktionen für den Coding-Agenten, Migrationsübersichtstabelle.

**Empfohlener Memory-Typ:** Warm Memory
**Status:** kritisch prüfen
**Begründung:** Kein „Stand:"-Feld, aber inhaltlich auf demselben Zeitpunkt wie `PROJECT_STATUS.md` (letzter Eintrag referenziert Migration `20260702000000_players_birth_year_only`, Commit `69a913e`). Erfasst weder Migration 13 noch das dazugehörige Remove-Player-Feature — laut `STATUS.md` (Stand 2026-07-06) liegt dieses Feature vollständig, aber uncommittet und unerfasst im Arbeitsverzeichnis.
**Überschneidungen:** `PROJECT_STATUS.md` (identische Migrationstabelle, „nächste Schritte" dupliziert).
**Risiko bei Fehlinterpretation:** Hoch — als „aktueller Arbeitsstand" gelesen, suggeriert die Datei, es gäbe kein offenes/unfertiges Feature, obwohl eines im Arbeitsverzeichnis liegt.

---

## 19. `LEGAL_TODO.md`

**Zweck:** DSGVO-/Rechts-Checkliste vor Pilotbetrieb — Status der Legal-Seiten (Platzhalter), DSGVO-Checkliste (Verantwortlicher, Zwecke, Rechtsgrundlage, Aufbewahrung, Betroffenenrechte, Einwilligung Minderjähriger, AV-Verträge), Löschungs-/Datenminimierungs-Checkliste, priorisierte „Vor Pilotbetrieb"-Tabelle.

**Empfohlener Memory-Typ:** Legal/Compliance Memory
**Status:** behalten
**Begründung:** „Stand: 2026-06-29" — inhaltlich weiterhin zutreffend: `STATUS.md` (Stand 2026-07-06) bestätigt unabhängig per Code-Prüfung, dass die Legal-Seiten weiterhin reine Platzhalter sind und `cleanup_expired_join_requests()` weiterhin nicht scheduled ist.
**Überschneidungen:** `DSGVO_PRIVACY_MODEL.md` („Offene Datenschutzfragen"), `PROJECT_STATUS.md` §7 („Offene Pilot-Lücken") — dieselben Punkte in drei Dateien nahezu wortgleich.
**Risiko bei Fehlinterpretation:** Gering inhaltlich, aber Pflegeaufwand-Risiko: eine Aktualisierung an einer Stelle (z. B. nach Fertigstellung der Legal-Seiten) müsste an drei Stellen synchron erfolgen.

---

## 20. `ARCHITECTURE.md`

**Zweck:** Code-basierte Architekturreferenz, Stand 2026-07-06 — tatsächliche Tech-Stack-Versionen, Konfigurationsdateien, Ordnerstruktur, Routenübersicht, Datenfluss-Pattern, Auth-/Autorisierungsdetails, Migrationstabelle, UI-Formular-Pattern.

**Empfohlener Memory-Typ:** Hot Memory
**Status:** behalten
**Begründung:** Grundlage ist eine unabhängige Code-Analyse (nicht Planungsdokument) und wurde am 2026-07-06 erstellt — aktuellster verlässlicher Bezugspunkt im Ordner.
**Überschneidungen:** Korrigiert/ergänzt explizit `TECH_STACK.md`, `SUPABASE_STRATEGY.md`, `PROJECT_BRIEF.md` (Migrationsnummerierung).
**Risiko bei Fehlinterpretation:** Gering aktuell — Risiko wächst mit der Zeit, sobald sich der Code weiterentwickelt, ohne dass diese Datei aktualisiert wird (kein Warm-Memory-Update-Mechanismus vorgesehen).

---

## 21. `STATUS.md`

**Zweck:** Code-Audit, Stand 2026-07-06 — was funktioniert (mit Beleg), was ist unvollständig/uncommittet, historisch behobene Bugs, ausdrücklich abgegrenzt vom phasenbasierten Log in `PROJECT_STATUS.md`/`CURRENT_TASK.md`.

**Empfohlener Memory-Typ:** Hot Memory
**Status:** behalten
**Begründung:** Deckt als einzige Datei im Ordner auf, dass ein vollständiges Feature („Remove player from team") uncommittet im Arbeitsverzeichnis liegt und in `CURRENT_TASK.md`/`PROJECT_STATUS.md` fehlt.
**Überschneidungen:** Referenziert explizit `PROJECT_STATUS.md`, `CURRENT_TASK.md`, `LEGAL_TODO.md`.
**Risiko bei Fehlinterpretation:** Gering aktuell — wie bei `ARCHITECTURE.md` wächst das Risiko mit zunehmendem zeitlichem Abstand zum Stand-Datum 2026-07-06, falls die Datei nicht aktualisiert wird.

---

## Gesamtübersicht

### Essenzielle Dateien
`ARCHITECTURE.md`, `STATUS.md`, `DATABASE_MODEL.md`, `ROLES_AND_PERMISSIONS.md`, `SECURITY.md`, `SUPABASE_STRATEGY.md`, `PROJECT_BRIEF.md` (als Index — sobald die in diesem Inventar benannten Widersprüche bereinigt sind).

### Laufend zu aktualisierende Dateien
`CURRENT_TASK.md`, `PROJECT_STATUS.md`, `DECISION_LOG.md`, `MVP_TEST_CHECKLIST.md`, `LEGAL_TODO.md`.

### Vermutlich redundante Dateien
- `USER_FLOWS.md` ↔ `MVP_SCOPE.md` (gleiche Flows, zwei Perspektiven)
- `PROJECT_STATUS.md` ↔ `CURRENT_TASK.md` (identische Migrationstabelle, beide ohne Migration 13)
- `SECURITY.md` ↔ `ROLES_AND_PERMISSIONS.md` ↔ `SUPABASE_STRATEGY.md` (RLS-/SECURITY-DEFINER-Helper-SQL dreifach dupliziert)
- `DSGVO_PRIVACY_MODEL.md` ↔ `SECURITY.md` (Risiken 8/9 inhaltlich doppelt)
- `LEGAL_TODO.md` ↔ `DSGVO_PRIVACY_MODEL.md` („Offene Datenschutzfragen") ↔ `PROJECT_STATUS.md` §7 („Offene Pilot-Lücken") — dieselben offenen Punkte dreifach gelistet

### Vermutlich veraltete Dateien
- `PROJECT_BRIEF.md` — §9 behauptet, Migration 001 sei noch leer (Stand der Behauptung widerspricht 13 angewendeten Migrationen)
- `ROADMAP.md` — Checkboxen bei „Phase 0" eingefroren, eigene Phasentaxonomie überholt
- `TECH_STACK.md` — nennt 3 statt 4 Supabase-Clients, Zod fälschlich als „geplant"
- `SECURITY.md` — Risiko-Statustabelle markiert nahezu alles als „Geplant" trotz Implementierung
- `MVP_SCOPE.md` und `DATABASE_MODEL.md` — idealisierte `001_/002_`-Migrationsnummerierung widerspricht den realen Dateinamen
- `PROJECT_STATUS.md` — Dokumentationsstand-Tabelle nennt `DESIGN_SYSTEM.md` fälschlich als fehlend; die Datei selbst ist gegenüber `STATUS.md` (2026-07-06) vier Tage veraltet

### Dateien, die vor weiterer Feature-Entwicklung bereinigt werden sollten
1. `PROJECT_BRIEF.md` §9 — Migrationsstand korrigieren, da dies laut `CLAUDE.md` Pflichtlektüre zu Sessionbeginn ist und aktuell den Eindruck erweckt, die Datenbank sei unmigriert.
2. `SECURITY.md` — Status-Spalte der Risikotabelle von „Geplant" auf den tatsächlichen Umsetzungsstand umstellen, um doppelte Neu-Implementierung bereits bestehender Sicherheitsmaßnahmen zu vermeiden.
3. `CURRENT_TASK.md` und `PROJECT_STATUS.md` — fehlenden Eintrag zum „Remove player from team"-Feature (inkl. Hinweis auf dessen Uncommitted-Status) ergänzen, bevor darauf aufbauende Arbeit beginnt.
