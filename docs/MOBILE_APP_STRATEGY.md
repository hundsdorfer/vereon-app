# Mobile-App-Strategie — Vereon

**Stand:** 2026-07-18
**Status:** Web/PWA beschlossen; native Technik, Push und Offlinefähigkeit noch nicht final entschieden

## Ziel

Vereon wird zuerst als mobile-first Web-App und PWA entwickelt. Trainer, Spieler und Guardians sollen die Anwendung am Smartphone zuverlässig über Browser und App-Icon nutzen können, ohne dass für den frühen MVP eine zweite native Codebasis entsteht.

Verbindliche Produktfunktionen und Phasen stehen in `FEATURE_CATALOG.md` (`MOBILE`) und `MVP_SCOPE.md`. Technische Befunde stehen in `ARCHITECTURE.md` und `STATUS.md`.

## Stufenplan

### Stufe 1 — Responsive Web-App

**Status:** implementiert/fortlaufend zu verbessern

- Next.js-Web-App ist die primäre Plattform.
- Mobile Bedienbarkeit ist bereits für interne Tests erforderlich.
- Vor Pilotbetrieb werden die Kernflows auf realen Smartphones geprüft.

### Stufe 2 — Installierbare PWA

**Status:** teilweise implementiert, noch nicht pilotfähig verifiziert

- Manifest, Icons und PWA-Metadaten sind im Repo vorbereitet.
- Der Manifest-Abruf ist im aktuellen öffentlichen Routing-/Hostingzustand blockiert; dadurch ist die Installierbarkeit nicht zuverlässig gegeben.
- Vor Freigabe sind mindestens Smartphone-Installation und PWA-Qualität zu prüfen.

Push-Benachrichtigungen und Offlinefähigkeit sind keine Voraussetzung für diese Stufe. Push ist Post-MVP, Offlinefähigkeit `Later`.

### Stufe 3 — Native App

**Status:** langfristiger Kandidat, nicht entschieden

Eine native iOS-/Android-App wird erst nach PWA- und Pilot-Erfahrungen bewertet.

Ein späterer Capacitor-Pfad darf bei technischen Entscheidungen berücksichtigt werden, weil er grundsätzlich viel Web-Code wiederverwenden kann. Capacitor ist damit noch nicht als finale Technologie beschlossen. React Native/Expo oder eine andere Lösung wird nur geprüft, wenn reale Anforderungen dies rechtfertigen.

## Leitplanken

- Keine parallele native Codebasis im MVP.
- Mobile-first-UX vor Desktop-Komfortfunktionen.
- Kein früher Service Worker nur mit dem Ziel, „PWA“ sagen zu können; Caching, Aktualisierung und Offlineverhalten benötigen ein eigenes Konzept.
- Push, Offline-Synchronisation, App-Store-Veröffentlichung und native Geräte-APIs brauchen jeweils eine eigene Produkt-, Datenschutz- und Technikentscheidung.
- Der vollständige Deployment-Schutz soll während der internen Entwicklungsphase aktiv sein; die Aktivierung ist noch zu verifizieren. Eine spätere externe PWA-Freigabe wird bewusst vorbereitet.

## Entscheidungspunkte nach dem Pilot

- Reicht die PWA für die täglichen Kernflows?
- Werden zuverlässige Push-Benachrichtigungen benötigt?
- Gibt es echte Offline-Anwendungsfälle?
- Sind App-Store-Verteilung oder native Gerätefunktionen fachlich notwendig?
- Welche Native-Technologie passt dann zum bestätigten Anforderungsprofil?
