import { test, expect } from '@playwright/test'
import {
  INTERNAL_ACCESS_TEST_USERNAME,
  INTERNAL_ACCESS_TEST_PASSWORD,
} from '../../playwright.config'

// Läuft ausschließlich im Projekt "internal-access-enabled" gegen einen
// dedizierten, isoliert gestarteten Server (Port 3101) mit aktiviertem
// internem Zugangsschutz. Der normale Dev-Server (Port 3000) für alle
// anderen Specs bleibt davon unberührt (Schutz dort weiterhin deaktiviert).

function basicAuthHeader(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`, 'utf8').toString('base64')
}

const VALID_AUTH = basicAuthHeader(INTERNAL_ACCESS_TEST_USERNAME, INTERNAL_ACCESS_TEST_PASSWORD)
const WRONG_AUTH = basicAuthHeader(INTERNAL_ACCESS_TEST_USERNAME, 'falsches-passwort')

test.describe('interner Zugangsschutz — aktivierter Zustand', () => {
  test('ohne Zugangsdaten → 401 mit WWW-Authenticate, kein Redirect zum Vereon-Login', async ({
    request,
  }) => {
    const response = await request.get('/', { maxRedirects: 0 })

    expect(response.status()).toBe(401)
    expect(response.headers()['www-authenticate']).toContain('Basic')
    expect(response.headers()['location']).toBeUndefined()
  })

  test('mit falschen Zugangsdaten → 401', async ({ request }) => {
    const response = await request.get('/dashboard', {
      headers: { authorization: WRONG_AUTH },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(401)
  })

  for (const path of ['/', '/register', '/legal/imprint', '/manifest.webmanifest']) {
    test(`${path} ist ohne internen Zugang nicht erreichbar`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(response.status()).toBe(401)
    })
  }

  test('mit korrekten Zugangsdaten ist eine öffentliche Vereon-Route erreichbar', async ({
    request,
  }) => {
    const response = await request.get('/login', {
      headers: { authorization: VALID_AUTH },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(200)
  })

  test('mit korrekten internen Zugangsdaten verlangt eine geschützte App-Route weiterhin Supabase-Login', async ({
    request,
  }) => {
    const response = await request.get('/dashboard', {
      headers: { authorization: VALID_AUTH },
      maxRedirects: 0,
    })

    expect(response.status()).toBeGreaterThanOrEqual(300)
    expect(response.status()).toBeLessThan(400)
    expect(response.headers()['location']).toContain('/login')
  })

  test('mit korrekten internen Zugangsdaten ist /manifest.webmanifest ohne Supabase-Login erreichbar', async ({
    request,
  }) => {
    const response = await request.get('/manifest.webmanifest', {
      headers: { authorization: VALID_AUTH },
      maxRedirects: 0,
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/manifest+json')
    expect(response.headers()['location']).toBeUndefined()
  })

  test('Basic-Auth-Zugangsdaten erscheinen nicht in der ausgelieferten Antwort', async ({
    request,
  }) => {
    const response = await request.get('/login', {
      headers: { authorization: VALID_AUTH },
    })
    const body = await response.text()

    expect(body).not.toContain(INTERNAL_ACCESS_TEST_PASSWORD)
    expect(body).not.toContain(VALID_AUTH)
  })

})

test.describe('POST/Server-Action-Regression (Browser mit automatischer Basic-Auth)', () => {
  // httpCredentials gilt bewusst nur innerhalb dieses Blocks, damit die
  // API-basierten Negativtests oben (ohne/mit falschen Zugangsdaten) davon
  // unberührt bleiben und ihre expliziten Header weiter greifen.
  test.use({
    httpCredentials: {
      username: INTERNAL_ACCESS_TEST_USERNAME,
      password: INTERNAL_ACCESS_TEST_PASSWORD,
    },
  })

  test('POST/Server-Action-Requests verlieren durch die Headerbereinigung weder Body noch Methode', async ({
    page,
  }) => {
    // Der Browser-Kontext beantwortet die interne Basic-Auth-Challenge
    // automatisch (siehe httpCredentials oben). Das eigentliche Formular-POST
    // (Server Action signInAction) muss trotz der Header-Bereinigung im
    // Proxy vollständig (Body + Methode) ankommen.
    await page.goto('/login')
    await page.getByLabel('E-Mail').fill('regressionstest-ohne-account@example.invalid')
    await page.getByLabel('Passwort').fill('irrelevantes-test-passwort')
    await page.getByRole('button', { name: 'Anmelden' }).click()

    // Erwartet: Die Server Action hat den POST-Body empfangen und
    // verarbeitet (Supabase lehnt die erfundenen Zugangsdaten ab) — sichtbar
    // an der gerenderten Fehlermeldung. Ein verlorener Body/eine verlorene
    // Methode würde stattdessen zu einem leeren/fehlerhaften Seitenzustand
    // ohne diese serverseitig erzeugte Fehlermeldung führen.
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
