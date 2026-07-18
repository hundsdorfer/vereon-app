import { defineConfig, devices } from '@playwright/test'

// Test-only Zugangsdaten ausschließlich für den dedizierten, temporären
// Testserver mit aktiviertem internem Zugangsschutz (siehe
// tests/e2e/internal-access-enabled.spec.ts). Keine realen Zugangsdaten,
// keine Wiederverwendung außerhalb dieses Testservers.
export const INTERNAL_ACCESS_TEST_USERNAME = 'playwright-internal-test-user'
export const INTERNAL_ACCESS_TEST_PASSWORD = 'playwright-internal-test-pass-only-local'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /internal-access-enabled\.spec\.ts/,
    },
    {
      // Eigenes Projekt gegen einen dedizierten Server mit aktiviertem
      // internem Zugangsschutz — läuft nicht gegen den normalen Dev-Server
      // auf Port 3000, damit dessen Default-Verhalten (Schutz deaktiviert)
      // für alle anderen Specs unverändert bleibt.
      name: 'internal-access-enabled',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3101',
        // Kein projektweites httpCredentials: Das würde auch die
        // `request`-Fixture-Aufrufe ohne/mit falschen Zugangsdaten
        // automatisch mit gültigen Credentials versehen und damit genau die
        // Negativfälle (401 ohne/mit falschen Zugangsdaten) unbeabsichtigt
        // maskieren. httpCredentials wird stattdessen gezielt nur für den
        // einen page-basierten POST-Regressionstest per `test.use(...)`
        // gesetzt.
      },
      testMatch: /internal-access-enabled\.spec\.ts/,
    },
  ],
  // Dev-Server automatisch starten falls noch nicht läuft
  webServer: [
    {
      command: 'npm run dev -- -p 3000',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      // Dedizierter, isolierter Server nur für den aktivierten
      // Zugangsschutz-Test. Immer frisch gestartet (kein Reuse), damit die
      // Env-Variablen garantiert wie unten gesetzt gelten. Eigener
      // NEXT_DIST_DIR, weil zwei gleichzeitig laufende `next dev`-Instanzen
      // auf demselben `.next`-Ordner an dessen Lockfile kollidieren würden,
      // unabhängig vom Port.
      command: 'npm run dev -- -p 3101',
      url: 'http://localhost:3101',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        INTERNAL_ACCESS_ENABLED: 'true',
        INTERNAL_ACCESS_USERNAME: INTERNAL_ACCESS_TEST_USERNAME,
        INTERNAL_ACCESS_PASSWORD: INTERNAL_ACCESS_TEST_PASSWORD,
        // Der Wert muss mit den beiden zusätzlichen include-Einträgen in
        // tsconfig.json übereinstimmen (dort begründet), sonst schreibt
        // Next.js beim Start dieses Servers tsconfig.json automatisch um.
        NEXT_DIST_DIR: '.next-internal-access-test',
      },
    },
  ],
})
