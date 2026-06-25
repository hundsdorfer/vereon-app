# Rollen und Berechtigungen — Vereon

**Stand:** 2026-06-25 (überarbeitet nach kritischer Architekturprüfung)

---

## Grundprinzipien

1. **Serverseitig erzwungen** — Rollen werden immer auf dem Server geprüft. Clientseitige Prüfung dient nur der UX.
2. **RLS als letzte Verteidigungslinie** — Supabase Row Level Security erzwingt Rechte auf Datenbankebene, unabhängig vom Anwendungscode.
3. **Mehrfachrollen** — Eine Person kann beliebig viele Rollen gleichzeitig haben. Das ist kein Ausnahmefall, sondern die Norm im Amateurfußball.
4. **Scope-Trennung** — Rollen gelten auf System-, Vereins- oder Teamebene. Sie werden in separaten Tabellen gespeichert.
5. **Nicht alle Unterschiede brauchen eigene Rollen** — Viele Berechtigungsunterschiede werden besser über Flags oder Permissions abgebildet als über separate fixe Rollen.

---

## Warum Mehrfachrollen unvermeidbar sind

Im österreichischen und deutschen Amateurfußball ist eine Person regelmäßig gleichzeitig:

| Person | Vereinsrolle | Teamrolle |
|---|---|---|
| Obmann | `president` | `head_coach` (trainiert selbst) |
| Jugendleiter | `youth_director` | `assistant_coach` (U15) |
| Kassier | `treasurer` | `player` (spielt in der Reserve) |
| Elternteil | — | `guardian` + `team_manager` (betreut gleichzeitig) |
| Sportlicher Leiter | `sporting_director` | `head_coach` (erste Mannschaft) |

Ein Modell mit `UNIQUE(club_id, user_id)` in der Mitgliedschaftstabelle würde diese Realität brechen. Die Architektur trennt deshalb Mitgliedschaft und Rollen konsequent.

---

## Datenbankarchitektur für Mehrfachrollen

```
club_memberships       → 1 Eintrag pro User pro Verein (Mitgliedschaft)
club_member_roles      → n Einträge pro Mitglied (vereinsweite Rollen)

team_memberships       → 1 Eintrag pro User pro Team (Teamzugehörigkeit)
team_member_roles      → n Einträge pro Teammitglied (teamspezifische Rollen)
```

Rollen-Checks in RLS und Anwendungscode prüfen immer gegen `club_member_roles` oder `team_member_roles`, nie gegen einen einzelnen `role`-String in `club_memberships`.

---

## Rollenübersicht

### Systemebene

| Rolle | Scope | Status |
|---|---|---|
| `super_admin` | System | MVP-ready |

### Vereinsebene (club_member_roles)

| Rolle | Scope | MVP | Anmerkung |
|---|---|---|---|
| `club_admin` | club | MVP 0 | Technischer Vereinsadmin, vollständiger Zugriff |
| `president` | club | MVP 1 | Obmann — sichtbare Führungsrolle, ähnliche Rechte wie `club_admin` |
| `board_member` | club | Später | Vorstandsmitglied, allgemeine Verwaltungsrechte |
| `secretary` | club | Später | Schriftführer — Protokolle, Mitgliederverwaltung |
| `treasurer` | club | Später | Kassier — Finanzdaten |
| `sporting_director` | club | MVP 1 | Sportlicher Leiter — teamübergreifende Sportrechte |
| `youth_director` | club | Später | Jugendleiter — Rechte über alle Nachwuchsteams |
| `youth_coordinator` | club | Später | Nachwuchskoordinator — operative Ebene unter Jugendleiter |
| `media_manager` | club | Später | Medienverantwortlicher |
| `facility_manager` | club | Später | Platzwart |
| `equipment_manager` | club | Später | Zeugwart |
| `canteen_manager` | club | Nicht MVP | Kantinenverantwortlicher — eigenes Modul |
| `sponsor_contact` | club | Nicht MVP | Sponsorenkontakt — eigenes Modul |
| `viewer` | club | MVP 1 | Nur-Lese-Zugriff auf freigegebene Inhalte |

### Teamebene (team_member_roles)

| Rolle | Scope | MVP | Anmerkung |
|---|---|---|---|
| `head_coach` | team | MVP 0 | Cheftrainer — voller Teamzugriff |
| `assistant_coach` | team | MVP 1 | Co-Trainer |
| `goalkeeper_coach` | team | Später | Tormanntrainer — ähnlich wie `assistant_coach` |
| `team_manager` | team | MVP 1 | Betreuer/Mannschaftsverantwortlicher — kein Trainingsinhalt, aber Logistik |
| `player` | team | MVP 1 | Spieler |
| `guardian` | team | MVP 1 | Erziehungsberechtigter — Rechte via `player_guardians`-Tabelle |

---

## Welche Rollen müssen aktiv im MVP umgesetzt werden?

### MVP 0 (erste Version)
- `club_admin` — Verein anlegen, Trainer einladen, Team anlegen
- `head_coach` — Termine erstellen, RSVP sehen, Einladungen für Spieler/Betreuer

### MVP 1 (zweite Version)
- `player` — RSVP, eigener Kalender, Spielberichte lesen
- `guardian` — RSVP für Kind, Kalender sehen
- `team_manager` — Anwesenheit erfassen, Spielerbetreuer
- `assistant_coach` — Termine und Anwesenheit
- `sporting_director` — vereinsübergreifende Teamsicht
- `president` — ähnlich club_admin, historisch sinnvoll im Amateurkontext
- `viewer` — Gastzugang

### Nur architektonisch vorgesehen (keine aktive UI)
- `secretary`, `board_member`, `treasurer`, `youth_director`, `youth_coordinator`
- `goalkeeper_coach`, `media_manager`, `facility_manager`, `equipment_manager`

### Bewusst nicht als eigene Rolle (lieber als Permission oder Flag)
- `canteen_manager` — zu spezifisch, besser ein eigenes Modul mit separatem Zugangsmanagement
- `sponsor_contact` — nur lesend auf freigegebene Vereinsdaten, reicht als `viewer`-Variante
- Unterschied zwischen `goalkeeper_coach` und `assistant_coach` — nur in der Anzeige relevant, nicht im Berechtigungssystem

---

## Welche Rollen sind Overengineering für Amateurvereine?

Amateurvereine haben typischerweise 50–500 Mitglieder, 3–15 Teams und eine handvoll aktiver Funktionäre. Folgendes würde den Alltag verkomplizieren ohne Mehrwert:

- Separate Rollen für `canteen_manager` und `facility_manager` im Kern-Rechtesystem — besser als optionale Module
- `media_manager` mit eigenen Rechten — in der Praxis macht das der Obmann oder ein engagierter Mitglieder; reicht als `club_admin`-Unterrecht
- Komplexe Hierarchien innerhalb der Vereinsebene (z.B. "Vorstand Typ A darf mehr als Vorstand Typ B")
- Granulare Bereichsrollen (Frauen, Jugend, Herren) im MVP — diese sind später via `department`-Scope erweiterbar

---

## Bereichsrollen (Departments) — Zukunft

Für größere Amateurvereine (z.B. Verein mit separater Jugendabteilung, Frauenmannschaft und Herrenbereich) soll das System später bereichsbezogene Rollen unterstützen.

**Geplante Scopes:**
```
system          → super_admin
club            → vereinsweite Rollen (alle Teams)
department      → Nachwuchs, Frauen/Mädchen, Herren (Bereichsebene)
age_group       → U8–U19 (innerhalb Nachwuchs)
team            → einzelnes Team
finance         → Finanzmodul
media           → Medienmodul
facilities      → Platz- und Gerätemanagement
```

**Umsetzung in Phase 2:**
Die `club_member_roles`-Tabelle enthält bereits ein `scope`-Feld und ein optionales `scope_reference_id`-Feld. Damit können bereichsbezogene Rollen ohne Schemaänderung nachgerüstet werden.

**Beispiel:**
```sql
-- Jugendleiter hat Scope 'department', scope_reference_id zeigt auf den 'youth'-Department
INSERT INTO club_member_roles (membership_id, role_id, scope, scope_reference_id)
VALUES (uuid_member, uuid_role_youth_director, 'department', uuid_youth_department);
```

---

## Berechtigungsmatrix (Kernfunktionen, MVP-relevant)

| Aktion | super_admin | club_admin | president | sporting_director | head_coach | assistant_coach | team_manager | player | guardian |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Verein bearbeiten | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Vereinsmitglieder sehen | ✓ | ✓ | ✓ | ✓* | — | — | — | — | — |
| Mitglieder einladen (Vereinsebene) | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Rollen vergeben | ✓ | ✓ | — | — | — | — | — | — | — |
| Team anlegen | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| Spieler einladen (Teamebene) | ✓ | ✓ | — | ✓ | ✓ | — | — | — | — |
| Guardian einladen | ✓ | ✓ | — | — | ✓ | — | ✓ | — | — |
| Termin erstellen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| Termin löschen | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Anwesenheit erfassen | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | — |
| RSVP für sich selbst | — | — | — | — | — | — | — | ✓ | — |
| RSVP für Kind | — | — | — | — | — | — | — | — | ✓ |
| RSVP aller sehen | ✓ | ✓ | — | ✓* | ✓ | ✓ | ✓ | — | — |
| Spielbericht schreiben | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Spielbericht veröffentlichen | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| Spielbericht lesen (veröffentlicht) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spielbericht lesen (intern) | ✓ | ✓ | — | ✓* | ✓ | ✓ | — | — | — |
| Audit-Log lesen | ✓ | ✓ | — | — | — | — | — | — | — |

\* `sporting_director` nur für Teams unter seiner Zuständigkeit

---

## Guardian-Rechte — separates Modell

Guardians erhalten ihre Rechte **nicht** aus `team_member_roles`, sondern aus der `player_guardians`-Tabelle:

```
player_guardians.player_id → bestimmt, auf welchen Spieler die Rechte gelten
player_guardians.can_rsvp → darf Zu-/Absagen abgeben
player_guardians.can_view_schedule → darf Kalender sehen
player_guardians.can_receive_messages → darf Mitteilungen empfangen
```

Wenn ein Kind das Team wechselt, bleiben die Guardian-Rechte gültig — weil sie am Spieler hängen, nicht am Team. Die RLS-Policies auf `event_attendance` und `events` prüfen deshalb `player_guardians`, nicht `team_member_roles`.

---

## RLS-Hilfsfunktionen (Muster)

```sql
-- Hat der User eine bestimmte Rolle im Verein?
CREATE OR REPLACE FUNCTION has_club_role(p_club_id uuid, p_role text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM club_memberships cm
    JOIN club_member_roles cmr ON cmr.membership_id = cm.id
    JOIN roles r ON r.id = cmr.role_id
    WHERE cm.user_id = auth.uid()
    AND cm.club_id = p_club_id
    AND cm.status = 'active'
    AND r.name = p_role
  );
$$;

-- Hat der User eine der angegebenen Rollen im Team?
CREATE OR REPLACE FUNCTION has_team_role(p_team_id uuid, VARIADIC p_roles text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_memberships tm
    JOIN team_member_roles tmr ON tmr.team_membership_id = tm.id
    JOIN roles r ON r.id = tmr.role_id
    WHERE tm.user_id = auth.uid()
    AND tm.team_id = p_team_id
    AND tm.status = 'active'
    AND r.name = ANY(p_roles)
  );
$$;

-- Ist der User Guardian des Spielers (mit RSVP-Recht)?
CREATE OR REPLACE FUNCTION is_guardian_of(p_player_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM player_guardians
    WHERE guardian_user_id = auth.uid()
    AND player_id = p_player_id
    AND verified_at IS NOT NULL
  );
$$;
```

---

## Seed-Daten für `roles`-Tabelle

```sql
INSERT INTO roles (name, scope, is_mvp, description) VALUES
  -- System
  ('super_admin',       'system', true,  'Plattformbetreiber'),
  -- Vereinsebene MVP
  ('club_admin',        'club',   true,  'Vereinsadministrator'),
  ('president',         'club',   false, 'Obmann/Obfrau'),
  ('sporting_director', 'club',   false, 'Sportlicher Leiter'),
  -- Vereinsebene später
  ('board_member',      'club',   false, 'Vorstandsmitglied'),
  ('secretary',         'club',   false, 'Schriftführer/in'),
  ('treasurer',         'club',   false, 'Kassier/in'),
  ('youth_director',    'club',   false, 'Jugendleiter/in'),
  ('youth_coordinator', 'club',   false, 'Nachwuchskoordinator/in'),
  ('media_manager',     'club',   false, 'Medienverantwortliche/r'),
  ('facility_manager',  'club',   false, 'Platzwart/in'),
  ('equipment_manager', 'club',   false, 'Zeugwart/in'),
  ('viewer',            'club',   false, 'Gast/Beobachter/in'),
  -- Teamebene MVP
  ('head_coach',        'team',   true,  'Cheftrainer/in'),
  ('assistant_coach',   'team',   false, 'Co-Trainer/in'),
  ('team_manager',      'team',   false, 'Betreuer/in'),
  ('player',            'team',   true,  'Spieler/in'),
  ('guardian',          'team',   true,  'Erziehungsberechtigte/r'),
  -- Teamebene später
  ('goalkeeper_coach',  'team',   false, 'Tormanntrainer/in');
```
