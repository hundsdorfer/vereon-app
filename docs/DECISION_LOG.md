# Decision Log — Vereon

Archiv wichtiger Produkt- und Architekturentscheidungen. Neueste Einträge zuerst.

---

## 2026-06-29 — Rollen- und Ansichtslogik: datenbasierte Ansichten statt fester Rollenidentität

**Kontext:**
Nach Phase N.4 (RSVP) und Phase O (/teams UX) wurde festgestellt, dass `profiles.onboarding_role` als kurzfristiger Heuristik genutzt wird, um zu entscheiden, ob ein User Trainer-CTAs sieht. Das funktioniert für den MVP, wirft aber eine grundsätzliche Architekturfrage auf: Was bestimmt langfristig, welche Ansichten ein User sieht?

**Entscheidung:**
Ein User ist nicht dauerhaft auf eine Registrierungsrolle beschränkt. Die sichtbaren Ansichten werden nicht aus `onboarding_role` abgeleitet, sondern aus echten Datenbeziehungen:

| Ansicht | Voraussetzung |
|---------|--------------|
| Traineransicht | Aktive `team_membership` mit Trainer-/Managerrolle (`team_owner`, `head_coach`, `assistant_coach`, `team_manager`) |
| Spieleransicht | Eigener `players.user_id`-Eintrag (Self-Player) |
| Eltern-/Guardianansicht | Verifizierte `player_guardians`-Beziehung (`verified_at IS NOT NULL`) |
| Vereinsansicht | Aktive `club_membership` mit Vereinsrolle (Phase 2+) |

**UI-Ziel (noch nicht bauen):**
Oben in der App erscheint später ein Ansichtswechsler:

```
Aktive Ansicht: Trainer ▼
```

Ein User mit mehreren freigeschalteten Ansichten (z. B. Elternteil = Guardian + gleichzeitig Trainer) kann dort wechseln. Jede Ansicht zeigt eine auf diese Rolle zugeschnittene Navigation und Startseite.

**Status von `onboarding_role`:**
- Ist nur ein Startkontext aus der Registrierung.
- Hilft kurzfristig als Heuristik (MVP-Dashboard, /teams UX), bis echte Datenbeziehungen vorhanden sind.
- Ist keine dauerhafte Berechtigung und keine feste Identität.
- Wird langfristig durch die datenbasierten Ansichten ersetzt.

**Typische Mehrfach-Rollen im Amateurfußball (kein Ausnahmefall):**
- Spieler wird Trainer → Spieleransicht + Traineransicht
- Elternteil ist gleichzeitig Vereinsmanager → Elternansicht + Traineransicht
- Obmann trainiert selbst → Vereinsansicht + Traineransicht + Spieleransicht

**Auswirkung auf aktuellen Code:**
- `showTrainerUI`-Logik in `/dashboard` und `/teams` bleibt korrekt für MVP.
- Der Ansichtswechsler kommt als eigene Phase (nach MVP-Pilot).
- Keine Datenbankänderung nötig — die Datenbeziehungen existieren bereits.

**Verwandte Docs:** `docs/ROLES_AND_PERMISSIONS.md`, `docs/DATABASE_MODEL.md`
