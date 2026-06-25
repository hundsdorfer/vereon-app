# Mobile App Strategie

## Ziel
Vereon soll langfristig nativ auf iOS und Android verfügbar sein — mit einer gemeinsamen Codebasis.

## Stufenplan

### Stufe 1 — Responsive Web App (jetzt)
- Next.js App mit mobilem Layout (Tailwind, responsive Design)
- Primäre Plattform für alle User
- Funktioniert im Mobile Browser

### Stufe 2 — Progressive Web App (PWA)
- `manifest.json` für Installierbarkeit
- Service Worker für Offline-Fähigkeit (grundlegende Daten)
- Push-Benachrichtigungen via Web Push API
- Kein App-Store notwendig — direkte Installation vom Browser
- Umsetzbar innerhalb von Next.js

### Stufe 3 — Native App (später)
**Bevorzugte Option: Capacitor**
- Vereon-Web-App wird in eine native Shell verpackt
- iOS und Android aus einer Codebasis
- Zugriff auf native APIs (Kamera, Push, Biometrie)
- Kein React Native notwendig — bestehender Next.js-Code bleibt

**Alternative: React Native + Expo**
- Höhere Performance für animationsintensive UI
- Größerer Umbauaufwand (kein Code-Sharing mit Web)
- Nur falls Capacitor nicht ausreicht

## Entscheidungskriterium
Capacitor-Ansatz wird bevorzugt, weil:
1. Maximales Code-Sharing mit der Web-App
2. Kein separates React Native-Projekt
3. Supabase JS SDK funktioniert ohne Änderungen
4. Niedrigere Wartungskosten

## Technische Vorbereitung (schon jetzt beachten)
- Kein `window`-Zugriff ohne Guard (`typeof window !== 'undefined'`)
- Responsive Design von Anfang an (Mobile First)
- API-Schicht sauber trennen (Server Actions / Route Handlers) — Mobile App kann dieselbe API nutzen
- Push-Benachrichtigungen über Supabase Realtime oder externen Provider planen
