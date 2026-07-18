# Design System — Vereon

> **Stand:** 2026-07-18
> Dieses Dokument beschreibt die UI/UX-Richtlinien für Vereon. Es ist Grundlage für alle zukünftigen UI-Entscheidungen. Keine Umsetzung ohne vorherige Dokumentation hier.

---

## 1. Designprinzipien

1. **Aktiver Nutzungskontext zuerst** — was ein User sieht, hängt von echten
   Datenbeziehungen und aktiven Teamrollen ab, nicht von
   `profiles.onboarding_role`. Traineransichten dürfen informationsdichter sein;
   Spieler-/Guardianansichten bleiben fokussierter.
2. **3-Sekunden-Regel für RSVP** — ein Elternteil muss die nächste offene RSVP-Frage in unter 3 Sekunden sehen und beantworten können.
3. **Outdoor-Kontrast** — alle Statusfarben müssen auch bei grellem Sonnenlicht lesbar sein (WCAG AA Minimum).
4. **Touch-first** — Mindest-Touch-Target 44×44 px. Keine hover-only-Interaktionen.
5. **Informationsdichte variiert mit Kontext** — Listenseiten brauchen Dichte. Dashboard-Summaries dürfen mehr Luft haben.
6. **Kein Shadow in funktionalen Listen** — Schatten nur für modale/Overlay-Elemente und Dashboard-Summaries, nicht für List-Items.
7. **Statusfarben sind kanonisch** — RSVP-Status, Event-Status und Anfragen-Status haben festgelegte, dokumentierte Farben. Keine Ad-hoc-Farben pro Seite.
8. **Kein Big-Bang-Redesign** — gezielte Verbesserungen in kleinen, bestätigten Schritten.

---

## 2. Farbsystem

### 2.1 Drei Farbebenen

Vereon unterscheidet drei Ebenen, die klar voneinander getrennt sind:

| Ebene | Beschreibung | Status |
|-------|-------------|--------|
| **Brand / Primary** | Vereon-Grün — globale Aktionen, Logo, primäre CTAs | Aktiv |
| **Surface / Dashboard** | Blau-/Grau-Töne — Hintergründe, Karten, Navigation | Richtung festgelegt, exakter Ton offen |
| **Vereinsfarbe / Team Theme** | Pro Verein oder Team konfigurierbar, nur Akzentebene | MVP: noch nicht bauen |

### 2.2 Vereon-Brand (Primary)

- Primary-Farbe ist **Grün** (`#16a34a`) — Vereon-Mark, primäre Schaltflächen, aktive Nav-Links
- Die endgültige Grün-vs.-Blau-Entscheidung als Primary bleibt **bewusst offen**, bis ein finales Brand-Konzept feststeht
- Bis dahin: Vereon-Grün bleibt Primary, Blau/Grau bleibt Surface-Richtung

### 2.3 Aktuelle Token-Übersicht

Alle Token sind in Tailwind v4 via `@theme` in der globalen CSS-Datei definiert.

| Token | Verwendung |
|-------|------------|
| `bg-background` | Seitenhintergrund |
| `bg-surface` | Kartenhintergrund, Sidebar |
| `bg-surface-muted` | Card-Footer, Hover-Hintergrund, Chips |
| `border-border` | Alle Rahmen |
| `text-foreground` | Primärer Text |
| `text-muted-foreground` | Sekundärer Text, Beschriftungen |
| `bg-primary` | Primäre Schaltflächen |
| `text-primary-foreground` | Text auf primären Schaltflächen |
| `text-primary` | Links, aktive Zustände |
| `bg-danger` | Gefährliche Aktionen (Delete, Cancel) |
| `text-danger` | Fehlertext, Danger-Badge |
| `bg-danger-subtle` | Danger-Badge-Hintergrund |
| `border-danger-subtle` | Danger-Badge-Rahmen |
| `text-success` | Erfolgstext, Success-Badge |
| `bg-success-subtle` | Success-Badge-Hintergrund |
| `border-success-subtle` | Success-Badge-Rahmen |
| `text-warning` | Warntext, Warning-Badge |
| `bg-warning-subtle` | Warning-Badge-Hintergrund |
| `border-warning-subtle` | Warning-Badge-Rahmen |
| `bg-nav-bg` | Navigationsbereich (Sidebar + Mobile Bottom Nav) |
| `border-nav-border` | Navigationsrahmen |
| `text-nav-fg` | Navigationstext aktiv |
| `text-nav-muted` | Navigationstext inaktiv |
| `text-nav-active-fg` | Fokusring in Navigation |
| `bg-nav-item-hover` | Hover-Hintergrund in Navigation |

### 2.4 Kanonische Statusfarben (RSVP)

Diese Zuordnung ist verbindlich und darf durch keine Vereinsfarbe überschrieben werden.

| RSVP-Status | Badge-Variante | Farbe | DB-Wert |
|-------------|---------------|-------|---------|
| Zugesagt | `success` | Grün | `attending` |
| Abgesagt | `danger` | Rot | `declined` |
| Vielleicht | `warning` | Gelb/Amber | `maybe` |
| Offen (keine Antwort) | `outline` | Grau | `pending` |

### 2.5 Weitere kanonische Status-Zuordnungen

**Beitrittsanfragen:**

| Status | Badge-Variante | DB-Wert |
|--------|---------------|---------|
| Offen | `warning` | `pending` |
| Angenommen | `success` | `approved` |
| Abgelehnt | `danger` | `rejected` |

**Team-Status:**

| Status | Badge-Variante | DB-Wert |
|--------|---------------|---------|
| Aktiv | `success` | `active` |
| Eigenständig | `outline` | `independent` |
| Archiviert | `danger` | `archived` |

**Termin-Status:**

| Status | Badge-Variante | Darstellung |
|--------|---------------|-------------|
| Geplant | `outline` | normaler Termin |
| Abgesagt | `danger` | weiterhin in Kalender und Historie sichtbar, deutlich mit „Abgesagt" markiert |

### 2.6 Dark Mode

- Dark Mode ist vollständig unterstützt via Tailwind v4 `@theme`-Token
- Alle Token haben Light- und Dark-Varianten in der CSS-Konfiguration
- Shadow-Werte (sobald eingeführt) brauchen ebenfalls Dark-Varianten
- Statusfarben müssen in beiden Modi WCAG AA Kontrast erfüllen

---

## 3. Vereinsfarben / Team Theme

> **MVP: Noch nicht implementieren.** Diese Entscheidung ist dokumentiert; Umsetzung als eigene Phase nach MVP-Pilot.

### Konzept

Vereon hat ein neutrales, hochwertiges Basisinterface. Pro Verein oder Team kann später eine individuelle Farbe hinterlegt werden, die als **Akzentfarbe im Teamkontext** erscheint — nicht als vollständige Umfärbung der UI.

### Einsatzbereiche der Vereinsfarbe (geplant)

- Team-Hero-Card (Hintergrundakzent oder Akzentstreifen)
- Kleiner Farbstreifen an Teamkarten in der Listenansicht
- Team-Avatar / Initialen-Hintergrund
- Header-Akzent auf teamspezifischen Seiten
- Ausgewählte Primäraktionen im Team-Kontext
- Icons oder kleine UI-Akzente im Teambereich

### Regeln

- Statusfarben (RSVP, Anfragen) sind **unveränderlich** — Vereinsfarben dürfen sie nicht überschreiben
- Vereinsfarben müssen WCAG AA Kontrast erfüllen (Text auf Vereinsfarbe oder umgekehrt)
- Bei zu hellen, zu dunklen oder schlecht lesbaren Farben: automatischer Fallback auf Vereon-Neutral

### Langfristige Datenbasis (noch nicht anlegen)

```sql
-- Geplante Spalten (noch nicht in Migrationen):
clubs.primary_color    -- hex, z. B. '#c00000'
clubs.secondary_color  -- hex, optional
teams.theme_color      -- überschreibt clubs.primary_color für dieses Team
```

---

## 4. Typografie

### Skala

| Stufe | Klasse | Verwendung |
|-------|--------|------------|
| Display | `text-2xl font-bold` | große Zahlen, Hero-Summaries (z. B. „12 Spieler") |
| Heading 1 | `text-xl font-semibold tracking-tight` | Page-Header (`PageHeader`-Komponente) |
| Heading 2 | `text-base font-semibold` | Sektion-Überschriften innerhalb von Seiten |
| Body | `text-sm` | Lauftext, Card-Inhalt, Formularelemente |
| Caption | `text-xs` | Labels, Badges, Hilfetext, Nav-Kategorienbeschriften |
| Micro | `text-[11px]` | Nav-Kategorienlabels (`uppercase tracking-widest`) |

### Schriftgewichte

| Gewicht | Klasse | Verwendung |
|---------|--------|------------|
| Bold | `font-bold` | Display-Elemente |
| Semibold | `font-semibold` | Überschriften, wichtige Daten |
| Medium | `font-medium` | Labels, CTAs, aktive Nav-Links |
| Regular | kein modifier | Lauftext, sekundäre Inhalte |

### Richtlinien

- Kein Text unter `text-xs` (12px) für inhaltstragende Elemente — Lesbarkeit outdoor
- `tracking-tight` nur für Überschriften; Fließtext ohne Letter-Spacing-Manipulation
- `truncate` für Listenelemente mit unbekannter Textlänge (z. B. Teamname, E-Mail)

---

## 5. Spacing

### Basis-Einheiten

Tailwind 4px-Raster (`space-1 = 4px`). Intern verwendete Abstände:

| Kontext | Innenabstand | Außenabstand |
|---------|-------------|--------------|
| Card | `px-5 py-4` | — |
| Card-Footer | `px-5 py-3` | — |
| Seiten-Content | `px-4` (Mobile) / `px-6` (Desktop) | `max-w-5xl mx-auto` |
| Nav-Items (Desktop) | `px-2.5 py-2` | — |
| Gap zwischen Listenelementen | `space-y-3` | — |
| Gap im PageHeader | `gap-3` (Mobile) / `gap-4` (Desktop) | — |

### Seiten-Außenabstand

- Mobile: `px-4 pt-4`
- Desktop: `px-6 pt-6 pb-6`
- Maximale Contentbreite: `max-w-5xl`

---

## 6. Komponenten

### 6.1 Button

**Varianten:**

| Variante | Verwendung |
|----------|------------|
| `primary` | Hauptaktion auf einer Seite (je Seite maximal 1–2) |
| `secondary` | Sekundäre Aktion, weniger Gewicht |
| `ghost` | Tertiäre Aktion, z. B. „Abbrechen", Navigationslinks |
| `danger` | Destruktive Aktionen (Löschen, Ablehnen) |

**Größen:** `sm` für Inline-Aktionen in Cards, `md` Standard, `lg` selten (große Hero-CTAs)

**Regel:** Nicht mehr als zwei `primary`-Buttons auf einer Seite sichtbar.

**Destruktive Aktionen:** Absagen und Löschen sind unterschiedliche Aktionen.
Hard-Delete wird nur angezeigt, wenn es fachlich erlaubt ist. Vor dem endgültigen
Löschen eines Trainings ist eine Texteingabe wie `LÖSCHEN` erforderlich. Ein
gewöhnlicher Bestätigungsdialog allein genügt dafür nicht.

### 6.2 Card

Aktuell: `rounded-lg`, `border border-border bg-surface`, kein Shadow.

**Wann welches Card-Muster:**

| Muster | Verwendung |
|--------|------------|
| Border-only (Standard) | Listenseiten (Teams, Trainings, Spieler) |
| Mit Shadow (geplant) | Dashboard-Summaries, Hero-Cards im Teamkontext |
| Mit Vereinsfarb-Akzent (langfristig) | Team-Hero-Card, Einladungsseite |

**CardFooter:** nur wenn Aktionen zum Card-Inhalt gehören (z. B. Buttons). Nicht für rein informativen Inhalt.

### 6.3 Badge

Verbindliche Zuordnung: Statusfarben gemäß Abschnitt 2.4 und 2.5. Keine eigenen Farben pro Seite.

### 6.4 PageHeader

Immer oben auf der Seite. `title` Pflicht, `subtitle` optional, `action` für primäre CTA der Seite.

Regel: `action` nur zeigen, wenn der aktuelle User die Berechtigung hat (rollenabhängig).

### 6.5 EmptyState

Immer: `title` + `description`. `action` nur zeigen, wenn der User eine sinnvolle nächste Handlung hat.

Nicht-Trainer sehen **keinen** „Team erstellen"-CTA im EmptyState der Teamliste.

### 6.6 FormError

Für Server-Action-Fehler. Zeigt string oder string[]. Immer direkt über dem Submit-Button platziert.

### 6.7 Input / Label

`Label` mit `required`-Prop für Pflichtfelder. `Input` mit `error`-Prop für feldspezifische Fehlermeldungen.

---

## 7. Seiten-Muster

### 7.1 Listen-Seite

Schema: `PageHeader` (title + optionale CTA) → Liste (`ul space-y-3`) mit klickbaren Cards → `EmptyState` wenn leer.

Beispiele: `/teams`, `/teams/[teamId]/events`, `/teams/[teamId]/requests`

**Regel:** Listenkarten sind kompakt (`px-5 py-4`), klickbar (ganzer Card-Bereich als Link), mit `truncate` für lange Texte.

### 7.2 Detail-Seite

Schema: Zurück-Link (optional) → `PageHeader` → Sektionen in Cards (nicht alle Infos in eine Card).

Beispiel: `/teams/[teamId]`, `/teams/[teamId]/events/[eventId]`

**Regel:** Trainer-CTAs (Einladen, Training erstellen, Anfragen verwalten) sind separate Cards/Sektionen, nicht in der Haupt-Info-Card.

### 7.3 Formular-Seite

Schema: `PageHeader` → einzelnes Formular in Card → Submit oben oder unten je nach Formular-Länge → `FormError` direkt über Submit.

Beispiele: `/teams/new`, `/teams/[teamId]/events/new`

### 7.4 Dashboard-Muster (rollenabhängig)

Aktuell: eine Summary-Card („Meine Teams"). Langfristig: mehrere Summary-Cards je nach Rolle.

**Traineransicht (Dashboard):**
- Nächste Trainings (mit offener RSVP-Zahl)
- Offene Beitrittsanfragen (Badge)
- Team-Übersicht

**Spieleransicht (Dashboard):**
- Nächstes Training + eigener RSVP-Status
- Direktlink zum RSVP-Formular

**Elternansicht (Dashboard):**
- Nächstes Training des Kindes + RSVP-Status des Kindes
- Direktlink zum RSVP-Formular für das Kind

**Regel:** Dashboard-Cards dürfen Schatten haben (geplant). Listenseiten nicht.

---

## 8. Navigations-Muster

### 8.1 Mobile Bottom Nav (unter md)

Sticky am unteren Bildschirmrand. `env(safe-area-inset-bottom)` für iOS Home Indicator. Zeigt 3–4 Hauptziele: Dashboard, Teams, (zukünftig: Kalender, Profil).

**Regel:** Kein rollenabhängiger Austausch der Nav-Items im MVP. Alle sehen dieselben Punkte; leere Seiten haben eigene EmptyStates.

### 8.2 Desktop Sidebar (ab md)

Feste Breite `w-60`. Logo oben, Nav-Links in der Mitte, User-Info + Logout unten. Kein Collapse im MVP.

### 8.3 Rollenabhängige Navigation (langfristig)

Geplant: Ansichtswechsler oben in der App (`Aktive Ansicht: Trainer ▼`). Noch nicht bauen. Beschreibung in `docs/DECISION_LOG.md`.

---

## 9. Rollenbasierte UI-Muster

Vollständige Architekturentscheidung in `docs/DECISION_LOG.md`.

### 9.1 Traineransicht

- Informationsdichter: RSVP-Übersicht nach Gruppen, Spielerliste mit Status, Anfragen-Badge
- Verwaltungs-CTAs sichtbar: „Team erstellen", „Training erstellen", „Spieler einladen", „Anfragen ansehen"
- Dashboard: Überblick + schneller Zugang zu Verwaltungsaufgaben

### 9.2 Spieleransicht (Self-Player)

- Fokussiert: eigener RSVP-Status im Vordergrund
- Keine Trainer-CTAs (kein „Team erstellen", kein „Training erstellen")
- Teams-Seite: Titel „Deine Teams", kein Erstellen-CTA
- Dashboard: nächstes Training + direkter RSVP-Zugang

### 9.3 Elternansicht (Guardian)

- Minimal: Kind im Fokus
- Kein Zugang zu Spielerlisten anderer Kinder
- RSVP-Formular zeigt Kindname
- Dashboard: nächstes Training des Kindes + direkter RSVP-Zugang

### 9.4 Vereinsansicht (Phase 2+)

Noch nicht implementiert. Breitere Übersicht über mehrere Teams, Club-Admin-Funktionen.

---

## 10. Geplante Erweiterungen (noch nicht bauen)

| Erweiterung | Beschreibung | Wann |
|-------------|-------------|------|
| Shadow-System | Definierte Shadow-Tokens für Dashboard-Cards und Modals | Nach Phase UI.2 |
| Vereinsfarben / Team Theme | Akzentfarbe pro Verein/Team (siehe Abschnitt 3) | Nach MVP-Pilot |
| Rollen-/Ansichtswechsler | „Aktive Ansicht: Trainer ▼" oben in der App | Nach MVP-Pilot |
| PWA-Ausbau | Manifest und App-Icons sind im Repository vorhanden; öffentliche Auslieferung, praktischer Install-Test, Splash-/Safe-Area-Feinschliff bleiben offen | Stufe 2 lt. `docs/MOBILE_APP_STRATEGY.md` |
| Typografie-Erweiterung | Display-Schriftart für Hero-Zahlen (z. B. Spieleranzahl) | Bei Dashboard-Erweiterung |
| Illustrationen / Icons | Einheitliches Icon-Set (aktuell nur wenige inline SVGs) | Eigene Phase |

---

## 11. Offene Designentscheidungen

| Entscheidung | Status | Auswirkung |
|-------------|--------|------------|
| Grün vs. Blau als Primary | **Offen** — Vereon-Grün bleibt vorerst | Betrifft Logo, Brand, alle primären CTAs |
| Exakter Blauton für Surfaces | **Offen** — Richtung Blau-/Grau festgelegt, Token noch nicht definiert | Betrifft `bg-nav-bg`, `bg-background`, `bg-surface` |
| Border-Radius Standardwert | **Offen** — aktuell `rounded-lg`, Vorlage zeigt größere Radien | Betrifft alle Cards und Buttons |
| Shadow-Tokens | **Offen** — noch kein Shadow-System | Betrifft Dashboard-Summaries |
| Vereinsfarben-Implementierung | **Offen** — Entscheidung dokumentiert, Umsetzung nach MVP | DB-Spalten + Theme-Logik |
