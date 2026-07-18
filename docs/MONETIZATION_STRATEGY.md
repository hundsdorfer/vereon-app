# Monetarisierungsstrategie — Vereon

**Stand:** 2026-06-25
**Status:** Strategische Hypothese — keine verbindliche Preis-, Paket- oder
Featurefreigabe; keine Umsetzung im MVP

Die beschriebenen Pläne dienen der späteren Geschäftsmodellprüfung. Sie sind
keine Quelle für aktuelle Rollen-, Scope- oder Featureberechtigungen. Insbesondere
wird eine im MVP fachlich benötigte Trainerrolle nicht allein durch diese Datei
kostenpflichtig oder gesperrt. Verbindliche Produktrechte stehen in
`FEATURE_CATALOG.md`, `MVP_SCOPE.md` und `ROLES_AND_PERMISSIONS.md`.

---

## Philosophie

### Eltern zahlen nicht für Pflichtfunktionen
Eltern nutzen Vereon, weil ihr Kind bei einem Verein oder Team ist, das Vereon verwendet. Sie haben keine Wahl bei der Plattformwahl. Deshalb:

- Kernfunktionen für Eltern/Guardians sind immer kostenlos: RSVP, Kalender lesen, Benachrichtigungen empfangen
- Keine Paywall für die Basisteilnahme am Vereinsleben
- Zahlendes Subjekt ist der Trainer oder der Verein — nicht das Elternteil

### Keine aggressive Werbung
- Keine Pop-ups, Interstitials, Overlay-Werbung
- Keine personalisierte Werbung auf Basis von Kinder- oder Vereinsdaten
- Keine Third-Party-Tracking-Pixel auf Seiten mit Kinderprofilen
- Wenn überhaupt Werbung: vereinsnahe Sponsorflächen, klar als Werbung gekennzeichnet, kontrolliert

---

## Pläne

### Free Team
Zielgruppe: Einzelner Trainer ohne Vereinsstruktur. Niedrige Einstiegshürde.

| Feature | Inklusive |
|---|---|
| 1 eigenständiges Team | ✓ |
| Bis zu 20 Mitglieder | ✓ |
| Kalender / Termine | ✓ |
| Zu-/Absagen (RSVP) | ✓ |
| Team-Einladungslink | ✓ |
| Eltern/Kind Self-Service-Beitritt | ✓ |
| Basis-Teamverwaltung | ✓ |
| Vereon-Branding (nicht entfernbar) | ✓ |

Einschränkungen: 1 Team, begrenzte Mitgliederzahl, kein Export, keine Statistiken, keine erweiterten Rollen.

---

### Team Plus
Zielgruppe: Engagierter Trainer der mehr will. Monatlich oder jährlich.

| Feature | Inklusive |
|---|---|
| 1 eigenständiges Team | ✓ |
| Unbegrenzte Mitglieder | ✓ |
| Alles aus Free Team | ✓ |
| Anwesenheitsstatistiken | ✓ |
| Spielberichte | ✓ |
| PDF/Export | ✓ |
| Mehrere Trainerrollen (head_coach + assistant) | ✓ |
| Team-Archiv (vergangene Saisonen) | ✓ |
| Werbefrei | ✓ |

---

### Club Basic
Zielgruppe: Kleiner Verein mit mehreren Teams, braucht Struktur.

| Feature | Inklusive |
|---|---|
| Bis zu 5 Teams | ✓ |
| Vereinsdashboard | ✓ |
| Vereinsrollen (club_admin, president, …) | ✓ |
| Jugendleiterfunktionen | ✓ |
| Team-Zuordnung (club-managed teams) | ✓ |
| Einfache Mitgliederverwaltung | ✓ |
| Alles aus Team Plus pro Team | ✓ |

---

### Club Pro
Zielgruppe: Größere Amateurvereine, mehrere Mannschaften, professionelle Struktur.

| Feature | Inklusive |
|---|---|
| Unbegrenzte Teams | ✓ |
| Alles aus Club Basic | ✓ |
| Saisonwechsel-Management | ✓ |
| Erweiterte Statistiken | ✓ |
| Export (CSV, Excel) | ✓ |
| Priority Support | ✓ |
| Benutzerdefiniertes Branding (Logo) | ✓ |

---

### Add-ons (Phase 3+)

| Add-on | Beschreibung |
|---|---|
| Sponsorenmodul | Vereinsinterne Sponsorenverwaltung |
| SMS-Paket | Benachrichtigungen via SMS statt nur Push/E-Mail |
| Zahlungsmodul | Mitgliedsbeiträge, Fahrtkosten |
| KI-Spielberichte | Automatisch generierte Spielberichts-Vorlagen |
| KI-Trainingsplanung | Trainingseinheiten-Vorschläge |
| Cloud-Speicher | Dokumente, Verträge, Medien |
| Custom Domain | Eigene URL für den Verein |

---

## Warum dieses Modell

| Entscheidung | Begründung |
|---|---|
| Trainer zahlt, nicht Eltern | Trainer entscheidet sich für das Tool — er trägt die Kosten |
| Free Tier ist wirklich nutzbar | Ohne echtes Free Tier kein virales Wachstum im Amateursport |
| Verein statt Einzelperson als langfristiger Anker | Vereinsverträge sind stabiler als individuelle Abos |
| Keine Kinderdaten für Werbung | DSGVO-konform, Vertrauen schützen |
| Eltern-Funktionen immer kostenlos | Erzwingt Fairness, kein Lock-in auf Elternseite |

---

## Werbung — Leitlinien

Falls Werbung:
- Nur auf vereinsadmin/trainer-facing Seiten, nicht auf Kinderprofilen
- Nur vereinsnahe, lokal-relevante Werbung (Sportartikel, lokale Unternehmen)
- Klar als Werbung gekennzeichnet
- Keine Behavioral Tracking
- Kein Retargeting auf Basis von Vereins-/Kinderdaten
- Opt-out für bezahlte Pläne (werbefrei)

---

## Zukünftige Billing-Infrastruktur (Phase 3)

Diese Tabellen werden erst in Phase 3 angelegt. Hier dokumentiert für Architektur-Vorbereitung:

```
plans
  id, key, name, description, price_monthly, price_yearly,
  max_teams, max_members_per_team, features jsonb, is_active

subscriptions
  id, plan_id, owner_type ('team' | 'club'), owner_id,
  status ('active' | 'trialing' | 'past_due' | 'cancelled'),
  current_period_start, current_period_end,
  cancel_at_period_end, created_at

subscription_items
  id, subscription_id, add_on_key, quantity, unit_price, created_at

billing_customers
  id, user_id, stripe_customer_id, email, created_at

feature_flags
  id, key, description, is_enabled, enabled_for_plan_keys text[],
  created_at

usage_limits
  id, subscription_id, metric_key, current_value, max_value, period_start
```

**Zahlungsanbieter:** Stripe (empfohlen). Integration via Stripe Billing oder Stripe Checkout.

---

## Offene Fragen

| Frage | Priorität | Wann |
|---|---|---|
| Preisstruktur konkret festlegen (€/Monat) | Mittel | Vor Beta |
| Trial-Periode (z.B. 30 Tage Club Basic gratis) | Mittel | Vor Beta |
| Jahresrabatt-Logik | Niedrig | Phase 3 |
| Stripe vs. alternative Zahlungsanbieter | Mittel | Phase 3 |
| Österreich-spezifische USt-Behandlung | Hoch | Vor erster Zahlung |
| Vereinsrechnung vs. Privatperson | Mittel | Phase 3 |
