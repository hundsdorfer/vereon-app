# Rollen und Berechtigungen — Vereon

**Stand:** 2026-06-25

---

## Grundprinzipien

1. **Serverseitig erzwungen** — Rollen werden immer auf dem Server geprüft. Clientseitige Prüfung dient nur der UX.
2. **RLS als letzte Verteidigungslinie** — Supabase Row Level Security erzwingt Rechte auf Datenbankebene.
3. **Scope-Trennung** — Rollen haben unterschiedliche Gültigkeitsbereiche (System / Verein / Team).
4. **Additiv** — Ein User kann mehrere Rollen in verschiedenen Kontexten haben (z.B. `club_admin` in Verein A, `player` in Verein B).

---

## Rollenübersicht

| Rolle | Scope | Beschreibung |
|---|---|---|
| `super_admin` | System | Plattformbetreiber, vollständiger Zugriff |
| `club_admin` | Verein | Vereinsadministrator, voller Vereinszugriff |
| `board_member` | Verein | Vorstandsmitglied, Verwaltungsrechte ohne Tech-Admin |
| `sporting_director` | Verein | Sportlicher Leiter, vereinsübergreifende Teamverantwortung |
| `treasurer` | Verein | Kassenwart, Finanzzugriff |
| `head_coach` | Team | Cheftrainer eines Teams |
| `assistant_coach` | Team | Co-Trainer, eingeschränkte Schreibrechte |
| `player` | Team | Spieler, Lesezugriff auf eigenes Team |
| `guardian` | Team | Elternteil/Erziehungsberechtigter eines Spielers |
| `viewer` | Team | Gast/Beobachter ohne Schreibrechte |

---

## Rollendefinitionen

---

### `super_admin`
**Scope:** Gesamte Plattform
**Vergabe:** Nur manuell durch Plattformbetreiber

Darf:
- Alle Vereine, Teams und User sehen und verwalten
- Supabase-Daten direkt einsehen (via Service Role, nie im Frontend)
- Audit-Logs aller Vereine lesen
- Rollen und Berechtigungen bearbeiten
- Plattform-Konfiguration ändern

Darf nicht:
- Direkt in App als normaler User agieren (separater Kontext)

---

### `club_admin`
**Scope:** Ein Verein
**Vergabe:** Durch `super_admin` oder beim Erstellen eines Vereins (erster User wird automatisch Admin)

Darf:
- Vereinsdaten bearbeiten (Name, Logo, etc.)
- Mitglieder einladen und entfernen
- Rollen innerhalb des Vereins vergeben und ändern
- Teams anlegen und verwalten
- Alle Daten des Vereins lesen
- Audit-Logs des Vereins lesen
- Einladungen erstellen und widerrufen
- Spieler anlegen und verwalten

Darf nicht:
- Andere Vereine sehen oder beeinflussen
- Supabase Service-Role-Operationen ausführen

---

### `board_member`
**Scope:** Ein Verein
**Vergabe:** Durch `club_admin`

Darf:
- Vereinsdaten lesen
- Mitglieder und Teams des Vereins lesen
- Einladungen für neue Mitglieder erstellen
- Finanzdaten des Vereins lesen (Phase 2)
- Ankündigungen an alle Mitglieder senden

Darf nicht:
- Rollen vergeben oder ändern
- Mitglieder entfernen
- Teams löschen

---

### `sporting_director`
**Scope:** Ein Verein
**Vergabe:** Durch `club_admin`

Darf:
- Alle Teams des Vereins lesen und bearbeiten
- Trainer zu Teams zuweisen
- Spieler zwischen Teams verschieben
- Spielberichte aller Teams lesen
- Trainingsstatistiken aller Teams sehen

Darf nicht:
- Vereinsdaten oder Mitgliedschaften verwalten
- Finanzdaten sehen
- Rollen vergeben

---

### `treasurer`
**Scope:** Ein Verein
**Vergabe:** Durch `club_admin`

Darf:
- Finanzdaten des Vereins lesen und schreiben (Phase 2)
- Mitgliederliste lesen (für Beitragsverwaltung)
- Zahlungsstatus von Mitgliedern verwalten

Darf nicht:
- Teams oder Spielerdaten bearbeiten
- Einladungen senden
- Kalender verwalten

---

### `head_coach`
**Scope:** Ein Team
**Vergabe:** Durch `club_admin` oder `sporting_director`

Darf:
- Teamdaten lesen und bearbeiten
- Trainingseinheiten und Spiele erstellen, bearbeiten, löschen
- Anwesenheit erfassen (`attended`-Flag setzen)
- Spielberichte erstellen und veröffentlichen
- Spielerpositionen und Trikotnummern verwalten
- `assistant_coach` zu seinem Team einladen
- Zu-/Absagen aller Teammitglieder sehen
- Spieler einladen (mit Code/Link)
- Interne Notizen zu Spielern schreiben

Darf nicht:
- Vereinsdaten bearbeiten
- Rollen auf Vereinsebene vergeben
- Andere Teams sehen (außer er ist auch dort Trainer)

---

### `assistant_coach`
**Scope:** Ein Team
**Vergabe:** Durch `head_coach` oder `club_admin`

Darf:
- Alle Teamdaten lesen
- Trainingseinheiten erstellen (nicht löschen)
- Anwesenheit erfassen
- Zu-/Absagen aller Teammitglieder sehen
- Spielberichte lesen (auch unveröffentlichte)

Darf nicht:
- Spielberichte veröffentlichen
- Teammitglieder einladen oder entfernen
- Spieler-Notizen schreiben
- Spielergebnisse eintragen

---

### `player`
**Scope:** Ein Team
**Vergabe:** Durch `head_coach`, `club_admin` oder via Einladungslink

Darf:
- Eigenes Profil lesen und bearbeiten
- Kalender des eigenen Teams lesen
- Eigene Zu-/Absagen setzen und ändern
- Veröffentlichte Spielberichte lesen
- Eigene Anwesenheitshistorie sehen
- Teamkollegen (Name, Position) sehen

Darf nicht:
- Kalendereinträge erstellen oder bearbeiten
- Anwesenheit anderer Spieler sehen
- Interne Notizen sehen
- Unveröffentlichte Spielberichte sehen
- Andere Spieler einladen

---

### `guardian`
**Scope:** Team des verknüpften Spielers
**Vergabe:** Durch `head_coach` oder `club_admin` (Verknüpfung mit Spieler-Account)

Darf:
- Kalender des Teams des Kindes lesen
- Zu-/Absagen für verknüpfte Kinder abgeben
- Veröffentlichte Spielberichte lesen
- Eigenes Profil bearbeiten

Darf nicht:
- Auf andere Spielerdaten zugreifen
- Eigene Zu-/Absagen abgeben (nur für Kind)
- Interne Notizen sehen
- Kalender bearbeiten

---

### `viewer`
**Scope:** Ein Team oder Verein
**Vergabe:** Durch `club_admin`

Darf:
- Kalender lesen (öffentliche Termine)
- Veröffentlichte Spielberichte lesen
- Grundlegende Teaminformationen sehen

Darf nicht:
- Irgendetwas schreiben
- Mitgliederliste sehen
- Anwesenheitsdaten sehen

---

## Berechtigungsmatrix (Kernfunktionen)

| Aktion | super_admin | club_admin | board_member | sporting_director | head_coach | assistant_coach | player | guardian | viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Verein bearbeiten | ✓ | ✓ | — | — | — | — | — | — | — |
| Mitglieder einladen | ✓ | ✓ | ✓ | — | ✓* | — | — | — | — |
| Rollen vergeben | ✓ | ✓ | — | — | — | — | — | — | — |
| Team anlegen | ✓ | ✓ | — | ✓ | — | — | — | — | — |
| Team bearbeiten | ✓ | ✓ | — | ✓ | ✓ | — | — | — | — |
| Training erstellen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| Spiel erstellen | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Anwesenheit erfassen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| Zu-/Absage setzen | — | — | — | — | — | — | ✓ | ✓** | — |
| Spielbericht schreiben | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Spielbericht veröffentlichen | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Spielbericht lesen (pub.) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spielbericht lesen (intern) | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — | — |
| Audit-Log lesen | ✓ | ✓ | — | — | — | — | — | — | — |

\* `head_coach` kann nur Spieler/Eltern zu seinem Team einladen, keine Vereinsrollen vergeben
\** `guardian` gibt Zu-/Absagen für verknüpfte Kinder ab

---

## Datenbankimplementierung

Rollen werden in zwei Tabellen gespeichert:

- `club_memberships.role` — vereinsweite Rolle (`club_admin`, `board_member`, `sporting_director`, `treasurer`, `viewer`)
- `team_memberships.role` — teamspezifische Rolle (`head_coach`, `assistant_coach`, `player`, `guardian`)

Ein User kann in `club_memberships` z.B. `board_member` sein und gleichzeitig in `team_memberships` eines bestimmten Teams `head_coach`.

### RLS-Hilfsfunktion (Beispiel)

```sql
-- Prüft ob der aktuelle User eine bestimmte Rolle in einem Verein hat
CREATE OR REPLACE FUNCTION has_club_role(p_club_id uuid, p_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM club_memberships
    WHERE user_id = auth.uid()
    AND club_id = p_club_id
    AND role = p_role
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## Seed-Daten für `roles`-Tabelle

```sql
INSERT INTO roles (name, scope, description) VALUES
  ('super_admin',       'system', 'Plattformbetreiber mit vollem Zugriff'),
  ('club_admin',        'club',   'Vereinsadministrator'),
  ('board_member',      'club',   'Vorstandsmitglied'),
  ('sporting_director', 'club',   'Sportlicher Leiter'),
  ('treasurer',         'club',   'Kassenwart'),
  ('head_coach',        'team',   'Cheftrainer'),
  ('assistant_coach',   'team',   'Co-Trainer'),
  ('player',            'team',   'Spieler'),
  ('guardian',          'team',   'Erziehungsberechtigter'),
  ('viewer',            'team',   'Gast/Beobachter');
```
