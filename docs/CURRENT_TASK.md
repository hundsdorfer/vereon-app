# Current Task

**Stand:** 2026-07-18

## Aktueller Stand

Ein temporärer interner Zugangsschutz (HTTP Basic Auth vor der bestehenden
Supabase-Anmeldung) wurde lokal implementiert, weil Vercel Deployment
Protection auf dem aktuellen Tarif Custom-Production-Domains
(`vereon.app`/`www.vereon.app`) nicht abdeckt (`ssoProtection.deploymentType`
lässt sich dort nicht auf `all` setzen, HTTP 428). Grundlage: `DEC-011`
(geschütztes Entwicklungs-Deployment).

Ablauf: `Besucher → interner Zugangsschutz (neu) → Vereon-/Supabase-Login
(bestehend) → Anwendung`. Kein Ersatz für Supabase Auth/RLS, keine
Nutzerverwaltung, ausdrücklich **temporär** — wird vor einem externen Pilot
entfernt oder durch eine geeignete Plattformlösung ersetzt.

**Wichtig:** Der Schutz ist ausschließlich **lokal implementiert und
lokal automatisiert getestet**. Ein Deployment auf `www.vereon.app` hat in
dieser Sitzung nicht stattgefunden und wurde extern nicht geprüft. Bis zur
Verifikation gegen die gehostete Umgebung gilt der Schutz dort **nicht** als
aktiv.

**Nachgebesserter Stand nach unabhängigen Codex-Reviews:** Die Befunde aus
beiden Reviews wurden behoben.

- **P1 (Cookie-Staleness):** `updateSession()` (`src/lib/supabase/middleware.ts`)
  baute die an nachgelagerte Server Components weitergereichten Header vor
  dieser Korrektur einmalig aus einer eingefrorenen Kopie; ein von Supabase
  in `setAll()` gesetzter aktualisierter Session-Cookie wurde dadurch nicht
  weitergereicht. `updateSession()` erhält jetzt ein Flag
  (`stripAuthorization: boolean`) statt einer vorab erzeugten Header-Kopie
  und baut die Header bei jedem `NextResponse.next()`-Aufruf frisch aus dem
  jeweils aktuellen `request.headers`. Durch einen gezielten
  Regressionstest gegen echtes lokales Supabase nachgewiesen
  (`tests/e2e/internal-access.spec.ts`, Beschreibung „Cookie-Refresh
  (P1-Regression)“); der Test wurde verifiziert, indem er absichtlich gegen
  die alte fehlerhafte Logik ausgeführt wurde und dort fehlschlug.
- **P2 (tsconfig.json-Mutation):** Der zweite, dedizierte Dev-Server für den
  aktivierten Testzustand verwendet einen eigenen `distDir`
  (`NEXT_DIST_DIR=.next-internal-access-test`, `next.config.ts`), damit zwei
  parallele `next dev`-Instanzen nicht am selben Build-Ordner-Lockfile
  kollidieren. Next.js hätte dafür bei jedem Testlauf automatisch zwei
  `include`-Einträge in `tsconfig.json` ergänzt. Diese Einträge wurden
  stattdessen bewusst und dauerhaft in `tsconfig.json` ergänzt (Begründung
  dort als Kommentar), sodass Next.js beim Testlauf nichts mehr zu ergänzen
  findet und die Datei nicht mehr anfasst — geprüft per Prüfsummenvergleich
  vor/nach einem vollständigen `npx playwright test`-Lauf.
- **P1 (Supabase-Cache-Header):** `@supabase/ssr` `0.12.0` übergibt bei
  Auth-Cookie-Updates zusätzlich `Cache-Control`, `Expires` und `Pragma` an
  `setAll()`. `updateSession()` übernimmt diese gelieferten Werte jetzt
  unverändert auf die Session-Response. Login-/Dashboard-Redirects erhalten
  die aktualisierten Session-Cookies und Schutzheader ebenfalls, ohne interne
  `x-middleware-*`-Header zu kopieren.
- **P1 (lokale Testgrenze):** Der echte Cookie-Refresh-Test parst die
  konfigurierte Supabase-URL vor jeder Client-Erzeugung und läuft nur gegen
  `localhost`, `127.0.0.1` oder IPv6-Loopback. Ungültige oder Cloud-URLs
  werden ohne Netzwerkzugriff übersprungen. Ein fester lokaler Testaccount
  wird wiederverwendet, damit nicht jeder Lauf einen weiteren Nutzer anlegt.

Geänderte/neue Dateien: `src/lib/internal-access.ts` (neu),
`src/proxy.ts`, `src/lib/supabase/middleware.ts`, `playwright.config.ts`,
`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`,
`tests/e2e/internal-access.spec.ts` (neu, inkl. P1-Regressionstest),
`tests/e2e/internal-access-enabled.spec.ts` (neu).

Benötigte, noch nicht gesetzte Server-Umgebungsvariablen (Namen, keine
Werte): `INTERNAL_ACCESS_ENABLED`, `INTERNAL_ACCESS_USERNAME`,
`INTERNAL_ACCESS_PASSWORD`. Für ein künftiges Deployment wird ein langes,
zufällig erzeugtes Passwort empfohlen, das außerhalb des Repositorys in
einem Passwortmanager verwahrt wird — in dieser Sitzung wurde kein Passwort
erzeugt oder gesetzt.

## Verbleibende Schritte

Der lokale Implementierungsblock ist vollständig geprüft und für einen
gezielten Git-Handoff vorbereitet; Branch, Commit und aktueller Dirty-Status
werden bei Bedarf direkt mit Git ermittelt. Der vollständige Playwright-Lauf
ist nach den Korrekturen mit `27/27` Tests erfolgreich gelaufen;
`tsconfig.json` und der Git-Status blieben dabei unverändert. Die übrigen
vereinbarten Prüfungen (gezielter P1-Regressionstest, `tsc --noEmit`, `lint`,
`build`, `git diff --check`) sind ebenfalls erfolgreich. Nicht erfolgt sind
Push, Deployment, das Setzen der `INTERNAL_ACCESS_*`-Variablen in Vercel und
die externe Verifikation; diese Schritte benötigen weiterhin eine separate
Freigabe.

## Nächste Produkt-/Technikarbeit

Nach Abschluss dieses Auftrags bleibt als nächste kleine, risikoarme Aufgabe
weiterhin vorgesehen:

- `/manifest.webmanifest` im App-Routing ohne Login-Weiterleitung korrekt
  ausliefern,
- einen passenden Routentest ergänzen,
- geschützte Anwendungsrouten unverändert geschützt lassen.

Nicht Teil dieser Aufgabe sind vollständige PWA-Installierbarkeit, Service
Worker, Offlinebetrieb, Push oder native Apps.

## Harte Grenzen

- keine Remote-Datenbank ohne separate ausdrückliche Freigabe,
- kein `db push`,
- kein `db reset` ohne ausdrückliche Freigabe in der aktuellen Sitzung,
- keine Secrets oder `.env`-Inhalte ausgeben,
- keine Packages ohne Freigabe,
- kein pauschales Staging über `git add .` oder `git add -A`.
