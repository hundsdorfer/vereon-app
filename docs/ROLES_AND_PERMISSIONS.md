# Rollen und Berechtigungen — Vereon

**Stand:** 2026-06-25 (überarbeitet: team_owner hinzugefügt, MVP-Zuweisung auf 0A/0B/1/2 angepasst)

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
| Trainer ohne Verein | — | `team_owner` + `head_coach` (eigenständiges Team) |

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

**Referenz:** Policies und Funktionen verwenden `roles.key` (nicht `roles.name_de`), da `key` maschinenlesbar und unveränderlich ist.

---

## Rollenübersicht

### Systemebene

| Rolle (key) | Scope | MVP | Anmerkung |
|---|---|---|---|
| `super_admin` | system | Stub | `is_super_admin()` gibt false zurück bis system_admins-Tabelle existiert |

### Vereinsebene (club_member_roles)

| Rolle (key) | Scope | MVP | Anmerkung |
|---|---|---|---|
| `club_admin` | club | **0B** | Technischer Vereinsadmin, vollständiger Zugriff |
| `president` | club | 1 | Obmann — sichtbare Führungsrolle, ähnliche Rechte wie `club_admin` |
| `board_member` | club | Später | Vorstandsmitglied |
| `secretary` | club | Später | Schriftführer — Protokolle, Mitgliederverwaltung |
| `treasurer` | club | Später | Kassier — Finanzdaten |
| `sporting_director` | club | 1 | Sportlicher Leiter — teamübergreifende Sportrechte |
| `youth_director` | club | Später | Jugendleiter — Rechte über alle Nachwuchsteams |
| `youth_coordinator` | club | Später | Nachwuchskoordinator |
| `media_manager` | club | Später | Medienverantwortlicher |
| `facility_manager` | club | Später | Platzwart |
| `equipment_manager` | club | Später | Zeugwart |
| `canteen_manager` | club | Nicht MVP | Eigenes Modul |
| `sponsor_contact` | club | Nicht MVP | Nur lesend, reicht als `viewer`-Variante |
| `viewer` | club | 1 | Nur-Lese-Zugriff auf freigegebene Inhalte |

### Teamebene (team_member_roles)

| Rolle (key) | Scope | MVP | Anmerkung |
|---|---|---|---|
| `team_owner` | team | **0A** | Eigentümer eines eigenständigen Teams. Voll-Zugriff auf Team, kein Verein nötig. Kann team_owner-Rechte übertragen. |
| `head_coach` | team | **0A** | Cheftrainer — voller Teamzugriff auf Training/Spiele. Wird auch bei Vereinsteams vergeben. |
| `assistant_coach` | team | 1 | Co-Trainer |
| `goalkeeper_coach` | team | Später | Tormanntrainer — ähnlich wie `assistant_coach` |
| `team_manager` | team | 1 | Betreuer/Mannschaftsverantwortlicher — Logistik, kein Trainingsinhalt |
| `player` | team | 1 | Spieler mit eigenem Account |
| `guardian` | team | 1 | Erziehungsberechtigter — Rechte via `player_guardians`-Tabelle |

---

## team_owner vs. head_coach

| Merkmal | team_owner | head_coach |
|---|---|---|
| Zweck | Administrativer Eigentümer des Teams | Fachliche Trainingsleitung |
| Kann Team-Einstellungen ändern | ✓ | — |
| Kann team_owner-Rechte übertragen | ✓ | — |
| Kann Affiliation-Anfragen annehmen/ablehnen | ✓ | — |
| Kann Einladungslinks erstellen | ✓ | ✓ |
| Kann Termine erstellen | ✓ | ✓ |
| Kann Beitrittsanfragen bearbeiten | ✓ | ✓ |
| Wird bei eigenständigem Team automatisch vergeben | ✓ (Ersteller) | ✓ (Ersteller, falls auch_head_coach=true) |
| Wird bei Vereinsteam vergeben | — | ✓ (via club_admin-Einladung) |
| Notwendig für MVP 0A | ✓ | ✓ |

**Designentscheidung:** Ein Trainer ohne Vereinsstruktur braucht `team_owner` als administrative Basis. `head_coach` ist die fachliche Rolle. Beide werden bei `create_independent_team()` standardmäßig vergeben.

---

## Welche Rollen müssen aktiv im MVP umgesetzt werden?

### MVP 0A (eigenständiges Team)
- `team_owner` — Team anlegen, Einladungslinks erstellen, Beitrittsanfragen verwalten
- `head_coach` — Termine erstellen, RSVP sehen, Spieler verwalten

### MVP 0B (Vereinskonfiguration)
- `club_admin` — Verein anlegen, Trainer einladen, Teams anlegen

### MVP 1 (Spieler und Eltern)
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
- `canteen_manager` — zu spezifisch, besser ein eigenes Modul
- `sponsor_contact` — nur lesend, reicht als `viewer`-Variante
- Unterschied zwischen `goalkeeper_coach` und `assistant_coach` — nur in der Anzeige relevant

---

## Welche Rollen sind Overengineering für Amateurvereine?

Amateurvereine haben typischerweise 50–500 Mitglieder, 3–15 Teams und eine Handvoll aktiver Funktionäre:

- Separate Rollen für `canteen_manager` und `facility_manager` im Kern-Rechtesystem — besser als optionale Module
- `media_manager` mit eigenen Rechten — in der Praxis macht das der Obmann
- Komplexe Hierarchien innerhalb der Vereinsebene
- Granulare Bereichsrollen (Frauen, Jugend, Herren) im MVP — via `department`-Scope in Phase 2 erweiterbar

---

## Bereichsrollen (Departments) — Phase 2

Für größere Amateurvereine soll das System bereichsbezogene Rollen unterstützen.

**Geplante Scopes:**
```
system          → super_admin
club            → vereinsweite Rollen (alle Teams)
department      → Nachwuchs, Frauen/Mädchen, Herren (Bereichsebene)
age_group       → U8–U19 (innerhalb Nachwuchs)
team            → einzelnes Team
```

**Umsetzung in Phase 2:** `club_member_roles` bekommt `scope` und `scope_reference_id` für bereichsbezogene Rollen ohne Schemaänderung.

---

## Berechtigungsmatrix (Kernfunktionen)

| Aktion | super_admin | club_admin | president | s_director | team_owner | head_coach | a_coach | t_manager | player | guardian |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Verein bearbeiten | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| Vereinsmitglieder sehen | ✓ | ✓ | ✓ | ✓* | — | — | — | — | — | — |
| Mitglieder einladen (Vereinsebene) | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| Rollen vergeben (Vereinsebene) | ✓ | ✓ | — | — | — | — | — | — | — | — |
| Team anlegen (eigenständig) | ✓ | — | — | — | ✓ | — | — | — | — | — |
| Team anlegen (Vereinskontext) | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Einladungslink erstellen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| Beitrittsanfragen verwalten | ✓ | ✓ | — | ✓* | ✓ | ✓ | — | — | — | — |
| Team-Affiliation annehmen | ✓ | — | — | — | ✓ | — | — | — | — | — |
| Spieler einladen (Teamebene) | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — | — | — |
| Guardian einladen | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |
| Termin erstellen | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | — | — |
| Termin löschen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| Anwesenheit erfassen | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | ✓ | — | — |
| RSVP für sich selbst | — | — | — | — | — | — | — | — | ✓ | — |
| RSVP für Kind | — | — | — | — | — | — | — | — | — | ✓ |
| RSVP aller sehen | ✓ | ✓ | — | ✓* | ✓ | ✓ | ✓ | ✓ | — | — |
| Spielbericht schreiben | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| Spielbericht veröffentlichen | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| Spielbericht lesen (veröffentlicht) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spielbericht lesen (intern) | ✓ | ✓ | — | ✓* | ✓ | ✓ | ✓ | — | — | — |
| Audit-Log lesen | ✓ | ✓ | — | — | — | — | — | — | — | — |

\* `sporting_director` (s_director) nur für Teams unter seiner Zuständigkeit

---

## Guardian-Rechte — separates Modell

Guardians erhalten ihre Rechte **nicht** aus `team_member_roles`, sondern aus der `player_guardians`-Tabelle:

```
player_guardians.player_id      → bestimmt, auf welchen Spieler die Rechte gelten
player_guardians.can_rsvp       → darf Zu-/Absagen abgeben
player_guardians.can_view_schedule → darf Kalender sehen
player_guardians.can_receive_messages → darf Mitteilungen empfangen
player_guardians.verified_at    → muss gesetzt sein, bevor Rechte aktiv werden
```

Wenn ein Kind das Team wechselt, bleiben die Guardian-Rechte gültig — weil sie am Spieler hängen, nicht am Team.

---

## RLS-Hilfsfunktionen (Muster)

Alle SECURITY DEFINER Funktionen setzen `SET search_path = ''` und verwenden vollständige Schema-Prefixe.

```sql
-- Hat der User eine bestimmte Rolle im Verein? (via roles.key)
CREATE OR REPLACE FUNCTION has_club_role(p_club_id uuid, p_role_key text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships cm
    JOIN public.club_member_roles cmr ON cmr.club_membership_id = cm.id
    JOIN public.roles r ON r.id = cmr.role_id
    WHERE cm.user_id = auth.uid()
    AND cm.club_id = p_club_id
    AND cm.status = 'active'
    AND r.key = p_role_key
  );
$$;

-- Hat der User eine der angegebenen Rollen im Team? (via roles.key)
CREATE OR REPLACE FUNCTION has_team_role(p_team_id uuid, VARIADIC p_role_keys text[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships tm
    JOIN public.team_member_roles tmr ON tmr.team_membership_id = tm.id
    JOIN public.roles r ON r.id = tmr.role_id
    WHERE tm.user_id = auth.uid()
    AND tm.team_id = p_team_id
    AND tm.status = 'active'
    AND r.key = ANY(p_role_keys)
  );
$$;

-- Ist der User Guardian des Spielers (mit verified_at)?
CREATE OR REPLACE FUNCTION is_guardian_of(p_player_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_guardians
    WHERE guardian_user_id = auth.uid()
    AND player_id = p_player_id
    AND verified_at IS NOT NULL
  );
$$;
```

---

## Seed-Daten für `roles`-Tabelle

```sql
INSERT INTO public.roles (key, name_de, scope, is_system) VALUES
  -- System
  ('super_admin',       'Plattformadministrator/in',     'system', true),
  -- Vereinsebene MVP 0B
  ('club_admin',        'Vereinsadministrator/in',       'club',   true),
  -- Vereinsebene MVP 1
  ('president',         'Obmann/Obfrau',                 'club',   true),
  ('sporting_director', 'Sportliche/r Leiter/in',        'club',   true),
  -- Vereinsebene später
  ('board_member',      'Vorstandsmitglied',             'club',   true),
  ('secretary',         'Schriftführer/in',              'club',   true),
  ('treasurer',         'Kassier/in',                    'club',   true),
  ('youth_director',    'Jugendleiter/in',               'club',   true),
  ('youth_coordinator', 'Nachwuchskoordinator/in',       'club',   true),
  ('media_manager',     'Medienverantwortliche/r',       'club',   true),
  ('facility_manager',  'Platzwart/in',                  'club',   true),
  ('equipment_manager', 'Zeugwart/in',                   'club',   true),
  ('viewer',            'Beobachter/in',                 'club',   true),
  -- Teamebene MVP 0A
  ('team_owner',        'Teameigentümer/in',             'team',   true),
  ('head_coach',        'Cheftrainer/in',                'team',   true),
  -- Teamebene MVP 1
  ('assistant_coach',   'Co-Trainer/in',                 'team',   true),
  ('team_manager',      'Betreuer/in',                   'team',   true),
  ('player',            'Spieler/in',                    'team',   true),
  ('guardian',          'Erziehungsberechtigte/r',       'team',   true),
  -- Teamebene später
  ('goalkeeper_coach',  'Tormanntrainer/in',             'team',   true);
```
