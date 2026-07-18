# Dokumentations-Inventar — Vereon

**Stand:** 2026-07-18

**Bestand:** 23 Markdown-Dateien in `docs/`, zusätzlich `README.md`,
`CLAUDE.md` und `AGENTS.md` im Repository-Stamm.

Diese Datei ist eine Zuständigkeits- und Pflegeübersicht. Sie ist weder
technischer Statusbericht noch Aufgabenliste.

---

## 1. Quellen und Vorrang

| Frage | Maßgebliche Quelle |
|---|---|
| Was ist technisch implementiert oder offen? | Repository, `ARCHITECTURE.md`, `STATUS.md` |
| Welche dauerhafte Entscheidung gilt? | `DECISION_LOG.md` |
| Welche Funktion ist in welcher Phase vorgesehen? | `FEATURE_CATALOG.md`, danach `MVP_SCOPE.md` |
| Wie läuft ein Nutzerablauf? | `USER_FLOWS.md` |
| Wer darf fachlich was? | `ROLES_AND_PERMISSIONS.md` |
| Wie soll das Datenmodell aussehen? | `DATABASE_MODEL.md`, mit jeweiligem Implementierungsstatus |
| Welche Sicherheits-/Datenschutzgrenze gilt? | `SECURITY.md`, `DSGVO_PRIVACY_MODEL.md` |
| Was blockiert den Pilot? | `STATUS.md`, `LEGAL_TODO.md`, `MVP_TEST_CHECKLIST.md` |
| Was erhält eine neue Planungs-/Entwicklungssitzung als Übergabe? | `PROJECT_BRIEF.md` plus `CURRENT_TASK.md` |

Bei Widerspruch darf kein Dokument aus seinem Zuständigkeitsbereich heraus eine
Entscheidung oder Ist-Aussage überschreiben.

---

## 2. Kanonische Kerndokumente

| Datei | Aufgabe | Pflegeart |
|---|---|---|
| `ARCHITECTURE.md` | kompakte, code-verifizierte technische Ist-Architektur | nach relevanten technischen Änderungen |
| `STATUS.md` | lebendes technisches Audit und priorisierte Abweichungen | laufend |
| `DECISION_LOG.md` | dauerhafte Grundsatzentscheidungen | bei neuer/ersetzter Entscheidung |
| `FEATURE_CATALOG.md` | kanonischer fachlicher Funktionskatalog | bei Scope-/Feature-Entscheidungen |
| `MVP_SCOPE.md` | Phasen und Scope-Grenzen | bei Phasenentscheidung |
| `USER_FLOWS.md` | fachliche Nutzerabläufe | bei Flow-Änderung |
| `ROLES_AND_PERMISSIONS.md` | fachliche Rollen- und Rechtematrix | bei Berechtigungsentscheidung |
| `DATABASE_MODEL.md` | fachliches Zielmodell mit Kennzeichnung Implementiert/Beschlossen/Offen/Post-MVP | bei Datenmodellentscheidung oder Migration |
| `SECURITY.md` | Sicherheitsregeln, bestätigte Schutzmechanismen und Risiken | bei sicherheitsrelevanter Änderung |
| `DSGVO_PRIVACY_MODEL.md` | Datenkategorien, Zwecke, Sichtbarkeit, Löschung und rechtliche Prüfgrenzen | bei personenbezogener Datenänderung |
| `MVP_TEST_CHECKLIST.md` | ausführbare Bestands-, Ziel- und Pilot-Abnahme | mit Scope/Flows/Rollen/Security |
| `LEGAL_TODO.md` | offene fachanwaltliche und organisatorische Pilot-Checkliste | bis zur belegten Erledigung |

---

## 3. Übergabe- und Arbeitsdokumente

| Datei | Aufgabe | Hinweis |
|---|---|---|
| `CURRENT_TASK.md` | aktuelle Arbeitsphase/Aufgabe | kann schnell veralten; gegen `STATUS.md` prüfen |
| `PROJECT_BRIEF.md` | Kurzkompass für neue Sessions | keine Detailquelle |
| `PROJECT_STATUS.md` | historisches Fortschrittsprotokoll | nicht als aktuelles Audit verwenden |

Flüchtige Commit-Hashes, „x Commits voraus“ und der momentane Dirty-Status gehören
nicht dauerhaft in mehrere Dokumente. Sie werden bei Bedarf direkt mit Git
ermittelt.

---

## 4. Strategie- und Referenzdokumente

| Datei | Aufgabe | Verbindliche Abgrenzung |
|---|---|---|
| `PRODUCT_VISION.md` | langfristiger Produkt-Nordstern | kein MVP-Scope |
| `MONETIZATION_STRATEGY.md` | Business-/Preismodell | keine frühe Billing-Freigabe |
| `MOBILE_APP_STRATEGY.md` | Web/PWA zuerst, spätere native Optionen | technischer Ist-Stand aus `ARCHITECTURE.md` |
| `DESIGN_SYSTEM.md` | UI-/UX-Regeln und Design-Tokens | keine Autorisierungsquelle |
| `SUPABASE_STRATEGY.md` | Integrations- und Entwicklungsleitfaden | Code/Migrationen haben bei Ist-Aussagen Vorrang |
| `TECH_STACK.md` | kompakte Technologieübersicht | Versionsstand gegen `package.json` prüfen |
| `ROADMAP.md` | strategische Reihenfolge der nächsten Produktblöcke | keine technische Status- oder Aufgabenquelle |

---

## 5. Repository-Stamm

| Datei | Aufgabe |
|---|---|
| `AGENTS.md` | verbindliche Agentenhinweise, insbesondere zu Next.js-Dokumentation |
| `CLAUDE.md` | Sicherheits- und Arbeitsregeln für Claude Code |
| `README.md` | Einstieg für Menschen; soll projektbezogene Installation und Befehle beschreiben |

---

## 6. Pflege- und Review-Regeln

1. Ist-Aussagen werden gegen Code, Migrationen, Konfiguration und Git belegt.
2. Beschlossene, aber nicht implementierte Zielzustände werden genauso benannt.
3. Unbekanntes heißt „nicht verifiziert“ oder „offen“, nicht „vorhanden“ oder
   „fehlt“.
4. Rechtliche Dokumente sind keine Rechtsberatung und erfinden keine
   Verantwortlichkeit oder Rechtsgrundlage.
5. `STATUS.md` enthält technische Abweichungen; andere Dateien verlinken darauf,
   statt parallele Prioritätslisten zu pflegen.
6. Neue Details werden in der fachlich zuständigen Datei ergänzt, nicht überall
   kopiert.
7. Veraltete Dokumente werden klar als historisch/deprecated markiert oder
   aktualisiert; ihr Inhalt darf nicht still als aktuelle Wahrheit weiterwirken.
8. Nach einem größeren Dokumentationsblock werden Querverweise, Markdown,
   Dateinamen und Git-Diff gemeinsam geprüft.

---

## 7. Aktuell bekannte Übergaberisiken

- `PROJECT_STATUS.md` ist eine historische Quelle und darf nicht als aktueller
  Stand gelesen werden.
- Bei technischen Ist-Aussagen haben Repository und `ARCHITECTURE.md` weiterhin
  Vorrang vor Strategie- und Referenzdokumenten.
- Verzeichnisse lokaler Agenten-Konfiguration, z. B. `.claude/`, gehören nur nach
  bewusster Prüfung in einen Commit.
