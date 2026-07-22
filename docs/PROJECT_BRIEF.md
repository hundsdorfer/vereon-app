# Vereon — Project Brief

**Stand:** 2026-07-21

Kompakter Einstieg für neue Entwicklungs- und Review-Sitzungen. Details nicht aus dieser Datei ableiten, sondern in den jeweils genannten Quellen prüfen.

## Produkt

Vereon ist eine deutschsprachige, mobile Webanwendung für Fußballteams. Der aktuelle Schwerpunkt ist ein stabiler Einzelteam-Flow für Trainer, Spieler und Guardians. Sichtbare Club-/Mehrteam-Verwaltung ist Post-MVP.

## Technischer Kern

- Next.js `16.2.9`, React `19.2.4`, TypeScript strict, Tailwind CSS `4.3.1`
- App Router mit Server Components und Server Actions
- Supabase Auth und PostgreSQL
- RLS auf allen öffentlichen Tabellen
- kritische Mutationen über `SECURITY DEFINER`-RPCs mit leerem `search_path`
- lokale Entwicklung gegen Supabase in Docker
- interne gehostete Entwicklung auf Vercel mit Supabase Cloud

Technische Details: `docs/ARCHITECTURE.md`, `docs/TECH_STACK.md`, `docs/SUPABASE_STRATEGY.md`.

## Implementierter Flow

- Registrierung, Login, Logout
- eigenständiges Team erstellen
- automatischer Einladungscode
- Self-Player- und Guardian/Kind-Beitrittsanfrage
- Anfrage annehmen oder ablehnen
- Spieler per Soft-Delete aus Team entfernen
- Training erstellen, anzeigen, bearbeiten und absagen
- Spieler-/Guardian-RSVP
- Trainerübersicht über Spieler-RSVP

Training bearbeiten (`FC-TRAINING-003`) und der bedingte Hard-Delete
(`FC-TRAINING-004`) sind lokal implementiert, migriert und im vollständigen
Playwright-Lauf verifiziert (60/60 am 2026-07-21; bekannte rollen- und
Trainer-RSVP-bezogene Testlücken siehe `docs/STATUS.md`).

Nicht vollständig implementiert sind unter anderem E-Mail-Verifizierung, Passwort-Reset, Rollenverwaltung, Owner-Transfer, Einladungscode-Erneuerung, RSVP-Deadline, Trainer-RSVP, Anwesenheitsabschluss und Teamarchivierung.

## Zielrollen

| Rolle | Kurzfunktion |
|---|---|
| `team_owner` | genau eine administrative Eigentümerrolle pro Team |
| `head_coach` | operative Team- und Trainingsleitung |
| `assistant_coach` | operative Trainingshilfe mit begrenzten Strukturrechten |
| `player` | eigener Spieleraccount und eigene RSVP |
| `guardian` | kindbezogener Zugriff und RSVP für eigenes Kind |
| `club_admin` | erst Post-MVP operativ |

Wesentliche Zielregeln:

- Rollenverwaltung nur durch `team_owner`.
- Join-Anfragen entscheiden `team_owner` und `head_coach`.
- Spieler entfernen `team_owner` und `head_coach`, immer als Soft-Delete.
- Trainings erstellen, bearbeiten und absagen dürfen alle drei Trainerrollen.
- Training hart löschen dürfen nur `team_owner` und `head_coach`, nur vor Beginn und ohne abgegebene RSVP, mit zusätzlicher Texteingabe.
- Einladungscode anzeigen, erneuern und deaktivieren dürfen alle drei Trainerrollen.
- `team_manager` ist keine Zielrolle, existiert aber noch als technische Altlast.

Vollständige Zielmatrix: `docs/ROLES_AND_PERMISSIONS.md`; technische Abweichungen: `docs/STATUS.md`.

## Datenschutzentscheidungen

- Für Accounts und Spieler ist das Geburtsjahr verpflichtend.
- Vollständiges Geburtsdatum ist freiwillig.
- Das freiwillige vollständige Spielergeburtsdatum sehen der Spieler selbst, der Guardian nur für das eigene Kind sowie aktive `team_owner`, `head_coach` und `assistant_coach` für aktive Teamspieler; andere nicht.
- Guardian bestätigt eine versionierte Berechtigungserklärung; die Erklärung ist keine Identitätsprüfung.
- Im frühen MVP höchstens ein Guardian-Account pro Kind.
- Weitere Bezugspersonen sind Kontaktangaben ohne Login oder RSVP-Recht.
- Abgelehnte und zurückgezogene Join-Anfragen werden nach 90 Tagen automatisch bereinigt; die Automatisierung fehlt noch.

Zielmodell: `docs/DATABASE_MODEL.md`; Datenschutz: `docs/DSGVO_PRIVACY_MODEL.md`.

## Aktueller Betriebsstatus

- Branch, Commit und lokale Änderungen werden zu Sitzungsbeginn direkt mit Git
  geprüft und nicht dauerhaft in dieser Übergabedatei festgeschrieben.
- Lint, TypeScript-Check und Build waren am 2026-07-18 erfolgreich.
- E2E wurde im Dokumentationsaudit nicht ausgeführt.
- Die gehostete Instanz ist interne Entwicklung, keine freigegebene Produktion.
- Ein temporärer interner Zugangsschutz (HTTP Basic Auth vor dem Supabase-Login) ist auf Vercel aktiviert und wurde am 2026-07-19 extern gegen `https://www.vereon.app` verifiziert; kein Ersatz für Supabase Auth/RLS, vor externem Pilot zu entfernen oder zu ersetzen (`DEC-011`, Details in `docs/STATUS.md`, `docs/SECURITY.md`).
- Legal-Texte, produktionsfähiger E-Mail-Versand, Backup/Restore, Monitoring, Supabase-Region und AV-Themen sind vor Pilot zu verifizieren.
- Seit 2026-07-19 leitet `/manifest.webmanifest` nicht mehr zum Login um; deployed und extern gegen `www.vereon.app` verifiziert (Details: `docs/STATUS.md`).

Prioritäten und Belege: `docs/STATUS.md`.

## Quellenordnung

| Bedarf | Quelle |
|---|---|
| Produktfunktionen | `docs/FEATURE_CATALOG.md` |
| Phasen und Scope | `docs/MVP_SCOPE.md` |
| Nutzerabläufe | `docs/USER_FLOWS.md` |
| Rollen und Rechte | `docs/ROLES_AND_PERMISSIONS.md` |
| Datenzielmodell | `docs/DATABASE_MODEL.md` |
| technischer Ist-Zustand | `docs/ARCHITECTURE.md` |
| Risiken und Abweichungen | `docs/STATUS.md` |
| aktuelle Arbeitsaufgabe | `docs/CURRENT_TASK.md` |
| Entscheidungen | `docs/DECISION_LOG.md` |

Bei technischen Widersprüchen haben Code, Konfiguration und Migrationen Vorrang. Unbekanntes wird nicht geraten.

## Arbeitsregeln

- Vor Codeänderungen passende lokale Next.js-Dokumentation unter `node_modules/next/dist/docs/` lesen.
- Erst geplante Dateien und Vorgehen nennen; Anwendungscode nur nach Freigabe ändern.
- Keine Packages ohne Freigabe.
- Keine Secrets oder `.env`-Inhalte ausgeben.
- Keine Remote-Datenbank und kein `db push` ohne separate ausdrückliche Freigabe.
- Kein `db reset` ohne ausdrückliche Freigabe in der aktuellen Sitzung.
- Migrationen additiv; bestehende Migrationen nicht umschreiben.
- Staging und Commits nur mit expliziten Dateien.
