# Rollen und Berechtigungen

## Grundprinzipien
- Rollen sind **vereinsspezifisch** — ein User kann in Verein A Admin und in Verein B Spieler sein
- Rollen werden in eigenen DB-Tabellen modelliert, nicht nur in Supabase Auth-Metadaten
- Row Level Security (RLS) in Supabase setzt Berechtigungen auf Datenbankebene durch
- Die Anwendungsebene prüft Rollen zusätzlich — nie nur RLS allein vertrauen

## Datenbankmodell (geplant)

```sql
-- Ein Eintrag pro Verein
clubs (id, name, slug, ...)

-- Benutzerprofile (1:1 mit auth.users)
profiles (id, user_id, full_name, avatar_url, ...)

-- Mitgliedschaft eines Users in einem Verein, mit Rolle
memberships (id, user_id, club_id, role, created_at)
-- role: 'admin' | 'coach' | 'player' | 'parent'

-- Teams innerhalb eines Vereins
teams (id, club_id, name, age_group, ...)

-- Zugehörigkeit eines Users zu einem Team
team_members (id, team_id, user_id, position, jersey_number, ...)
```

## Rollen

### `admin` — Vereinsadministrator
- Vollzugriff auf alle Daten des Vereins
- Kann Mitglieder einladen und Rollen vergeben
- Verwaltet Finanzen, Teams, Vereinsdaten

### `coach` — Trainer
- Zugriff auf seine Teams
- Kann Training und Spiele planen
- Erfasst Anwesenheit, schreibt Spielberichte
- Kann keine Mitglieder einladen oder Rollen ändern

### `player` — Spieler
- Sieht seinen Kalender, sein Team, seine Statistiken
- Gibt Zu-/Absagen
- Kann keine anderen Spieler oder Vereinsdaten sehen

### `parent` — Elternteil (Jugend)
- Verknüpft mit einem oder mehreren Spieler-Accounts
- Gibt Zu-/Absagen für verknüpfte Kinder
- Empfängt Mitteilungen des Trainers

## RLS-Strategie
- Alle Tabellen haben RLS aktiviert (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- Policies basieren auf `auth.uid()` und der `memberships`-Tabelle
- Beispiel: Ein Spieler kann nur Kalendereinträge seines eigenen Teams lesen
- Admins erhalten breiten Zugriff innerhalb ihres Vereins via Policy

## Serverseitige Prüfung
- Middleware prüft Session vor jedem Request auf geschützte Routen
- Server Components und Route Handlers prüfen Rollen zusätzlich
- Clientseitige Rollenprüfung nur für UI-Rendering (z.B. Button ausblenden) — nie als Sicherheitsmechanismus
