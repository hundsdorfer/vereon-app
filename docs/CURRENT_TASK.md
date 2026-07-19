# Current Task

**Stand:** 2026-07-19

## Aufgabe abgeschlossen: /manifest.webmanifest ohne Login-Weiterleitung

`/manifest.webmanifest` (erzeugt von `src/app/manifest.ts`) wurde von
`src/proxy.ts` bislang wie jede andere geschützte Anwendungsroute behandelt:
Ohne Supabase-Session leitete der Proxy auf `/login` um, bevor Next.js die
Manifest-Antwort ausliefern konnte. Der vorgelagerte temporäre interne
Zugangsschutz (HTTP Basic Auth) prüft zwar vor jeder weiteren Logik, war
davon aber nicht betroffen — er blieb unverändert vor allen Routen aktiv.

**Lösung:** `/manifest.webmanifest` wurde in `PUBLIC_ROUTES` in
`src/proxy.ts` aufgenommen, analog zu `/`, `/login`, `/register` und
`/auth/callback`. Keine Änderung an `src/lib/internal-access.ts` oder an
der Prüfreihenfolge — der interne Zugangsschutz greift weiterhin zuerst und
unverändert vor dem Manifest und allen anderen Routen.

Geänderte/neue Dateien: `src/proxy.ts`, `tests/e2e/smoke.spec.ts` (neuer
Test: Manifest ohne Supabase-Login erreichbar, `200`,
`application/manifest+json`, kein Redirect), `tests/e2e/internal-access-enabled.spec.ts`
(neuer Test: mit korrekten internen Zugangsdaten ist das Manifest ohne
Supabase-Login erreichbar; der bereits vorhandene Test, dass das Manifest
ohne internen Zugang mit `401` blockiert bleibt, deckte den aktivierten
Schutzzustand bereits ab).

**Lokal geprüft (Stand 2026-07-19):** `npx tsc --noEmit`, `npm run lint`,
`npm run build` und `git diff --check` waren erfolgreich. Nach dem Start des
lokalen Supabase-Docker-Stacks wurde zusätzlich der vollständige
Playwright-Lauf mit `npx playwright test` ausgeführt: **29/29 Tests
bestanden**. Darin enthalten waren beide Kernflows, die
Cookie-Refresh-Regression, sämtliche Manifest-/Basic-Auth-Tests und die
POST-/Server-Action-Regression. Diese Umsetzung ist ausschließlich **lokal
implementiert und getestet**; kein Deployment, kein Push, keine externe
Verifikation gegen `www.vereon.app`.

## Vorangegangene Umsetzung: Temporärer interner Zugangsschutz

Ein temporärer interner Zugangsschutz (HTTP Basic Auth vor der bestehenden
Supabase-Anmeldung) wurde implementiert, weil Vercel Deployment Protection
auf dem aktuellen Tarif Custom-Production-Domains
(`vereon.app`/`www.vereon.app`) nicht abdeckt (`ssoProtection.deploymentType`
lässt sich dort nicht auf `all` setzen, HTTP 428). Grundlage: `DEC-011`
(geschütztes Entwicklungs-Deployment).

Ablauf: `Besucher → interner Zugangsschutz → Vereon-/Supabase-Login →
Anwendung`. **Basic Auth ist kein Ersatz für Supabase Auth oder RLS**, keine
Nutzerverwaltung, ausdrücklich **temporär** — wird vor einem externen Pilot
entfernt oder durch eine geeignete Plattformlösung ersetzt.

**Auftrag abgeschlossen (Stand 2026-07-19):** Der Schutz ist lokal
automatisiert getestet, auf Vercel aktiviert und extern gegen
`https://www.vereon.app` verifiziert. Für dieses Deployment wurde kein
weiterer Anwendungscode verändert. Vollständiger Betriebs- und
HTTP-Nachweis (Deployment-ID, Commit, externe Prüfergebnisse):
`docs/STATUS.md`. Der P0-Punkt „Deployment öffentlich erreichbar“ gilt
damit als **verifiziert geschlossen** — der Schutz bleibt ausdrücklich
temporär und ist vor einem externen Pilot zu entfernen oder durch eine
geeignete Plattformlösung zu ersetzen.

## Vorangegangene Umsetzung: Codex-Review-Korrekturen

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

Server-Umgebungsvariablen (Namen, keine Werte): `INTERNAL_ACCESS_ENABLED`,
`INTERNAL_ACCESS_USERNAME`, `INTERNAL_ACCESS_PASSWORD`. Sie sind laut
verifiziertem Betriebsstand vom 2026-07-19 für Production und Preview in
Vercel gesetzt; Werte, Benutzername und Passwort werden nicht dokumentiert.

## Abgeschlossen

Der Implementierungsblock ist vollständig geprüft und committet (`029de982`);
Branch, Commit und aktueller Dirty-Status werden bei Bedarf direkt mit Git
ermittelt. Lokal waren nach den Codex-Review-Korrekturen der vollständige
Playwright-Lauf (`27/27` Tests), der gezielte P1-Regressionstest,
`tsc --noEmit`, `lint`, `build` und `git diff --check` erfolgreich;
`tsconfig.json` und der Git-Status blieben dabei unverändert. Deployment,
Variablen-Setzung in Vercel und externe Verifikation sind erfolgt (siehe
oben und `docs/STATUS.md`). Damit ist dieser Auftrag abgeschlossen.

## Nächste Aufgabe

Als nächste vorgesehene Produktaufgabe gilt die Verdrahtung der bereits
vorhandenen Training-Absage (`FC-TRAINING-005` in `docs/FEATURE_CATALOG.md`;
Datenbank-/Statusgrundlage laut `supabase/migrations/20260629200000_add_events.sql`
teilweise vorhanden) in den App-Flow. Diese Aufgabe wurde in dieser Sitzung
**nicht begonnen** und benötigt vor Umsetzung eine eigene ausdrückliche
Freigabe.

## Harte Grenzen

- keine Remote-Datenbank ohne separate ausdrückliche Freigabe,
- kein `db push`,
- kein `db reset` ohne ausdrückliche Freigabe in der aktuellen Sitzung,
- keine Secrets oder `.env`-Inhalte ausgeben,
- keine Packages ohne Freigabe,
- kein pauschales Staging über `git add .` oder `git add -A`.
