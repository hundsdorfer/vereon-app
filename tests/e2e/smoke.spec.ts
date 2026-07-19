import { test, expect } from '@playwright/test'

test('Login-Seite lädt ohne Fehler', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveTitle(/Vereon/)
  await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
})

test('Register-Seite lädt ohne Fehler', async ({ page }) => {
  await page.goto('/register')
  await expect(page).toHaveTitle(/Vereon/)
  await expect(page.getByRole('button', { name: 'Konto erstellen' })).toBeVisible()
})

test('Root-Redirect zu /login oder /dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(login|dashboard)/)
})

test('/manifest.webmanifest ist ohne Supabase-Login erreichbar und leitet nicht zu /login um', async ({
  request,
}) => {
  const response = await request.get('/manifest.webmanifest', { maxRedirects: 0 })

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/manifest+json')
  expect(response.headers()['location']).toBeUndefined()
})
