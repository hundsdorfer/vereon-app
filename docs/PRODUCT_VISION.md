# Product Vision

## Kernidee
Vereon ist die zentrale Plattform für Fußballvereine — von der Jugendabteilung bis zur ersten Mannschaft. Sie ersetzt Gruppenwebchats, Excel-Tabellen und papierbasierte Prozesse durch eine einheitliche, rollenbasierte Vereinssoftware.

## Zielgruppe
- **Vereinsadministratoren:** Verwalten Verein, Teams, Mitglieder, Finanzen
- **Trainer:** Planen Training und Spiele, erfassen Anwesenheit, schreiben Spielberichte
- **Spieler:** Sehen ihren Kalender, geben Zu-/Absagen, sehen Spielberichte
- **Eltern (Jugend):** Verwalten Zu-/Absagen für ihre Kinder, empfangen Mitteilungen

## Kernfunktionen (Langfrist)
- Vereins- und Teamverwaltung
- Spielerverwaltung inkl. Nachwuchs
- Kalender, Training, Spielplanung
- Zu-/Absagen und Anwesenheitsverfolgung
- Spielberichte
- Kommunikation (Mitteilungen, Benachrichtigungen)
- Rollen- und Rechtesystem
- Finanzen und Sponsoring
- Statistiken und Auswertungen

## Multi-Tenant
Jeder Verein ist ein eigener Tenant. Ein User kann Mitglied in mehreren Vereinen mit unterschiedlichen Rollen sein.

## Plattformen (Ziel)
1. **Web-App** (primär) — Next.js, responsiv
2. **PWA** — installierbar, Offline-Fähigkeit
3. **iOS App** — über React Native oder Capacitor (später)
4. **Android App** — über React Native oder Capacitor (später)

## Qualitätsziele
- Schnell: Server-first, minimales Client-JS
- Sicher: RLS, serverseitige Auth-Prüfung
- Skalierbar: Multi-Tenant, cloudnative (Supabase)
- Wartbar: Klare Struktur, gute Dokumentation
