import { test, expect } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

test('Kernflow: Trainer + Self-Player', async ({ browser }) => {
  test.setTimeout(120_000)

  // Sicherheitsgrenze: registriert echte Nutzer und legt echte Daten über
  // den Browser an — bricht sofort ab, falls die konfigurierte
  // Supabase-URL nicht auf eine lokale Loopback-Adresse zeigt, statt
  // versehentlich gegen eine Cloud-Instanz zu laufen.
  getLoopbackSupabaseEnv()

  const ts           = Date.now()
  const trainerEmail = `trainer+${ts}@vereon.test`
  const playerEmail  = `player+${ts}@vereon.test`
  const password     = 'Test1234!'
  const teamName     = `E2E Team ${ts}`
  const eventTitle   = `E2E Training ${ts}`
  const playerFirst  = 'Erika'
  const playerLast   = 'Spielerin'
  const playerName   = `${playerFirst} ${playerLast}`

  const trainerCtx = await browser.newContext()
  const playerCtx  = await browser.newContext()
  const tPage      = await trainerCtx.newPage()
  const pPage      = await playerCtx.newPage()

  try {
    // ── 1. Trainer registrieren ──────────────────────────────────────────────
    await tPage.goto('/register')
    await tPage.fill('#first_name', 'Tanja')
    await tPage.fill('#last_name', 'Trainerin')
    await tPage.fill('#email', trainerEmail)
    await tPage.fill('#date_of_birth', '1985-03-20')
    await tPage.selectOption('select#onboarding_role', 'coach')
    await tPage.fill('#password', password)
    await tPage.check('input[name="terms_accepted"]')
    await tPage.check('input[name="privacy_accepted"]')
    await tPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await tPage.waitForURL('/dashboard')

    // ── 2. Team erstellen ────────────────────────────────────────────────────
    await tPage.goto('/teams/new')
    await tPage.fill('#team_name', teamName)
    // Promise.all: Listener vor dem Click setzen, damit waitForURL nicht sofort
    // mit der aktuellen /teams/new-URL resolvet (URL matcht das Pattern schon).
    await Promise.all([
      tPage.waitForURL(/\/teams\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      tPage.getByRole('button', { name: 'Team erstellen' }).click(),
    ])
    const teamId = tPage.url().split('/teams/')[1]
    await expect(tPage.getByText(teamName)).toBeVisible()

    // ── 3. Join-Link lesen ───────────────────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/invite`)
    const joinUrl  = await tPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
    expect(joinCode).toBeTruthy()
    const joinPath = `/join/${joinCode}`

    // ── 4. Player registriert sich mit redirect zur Join-Seite ───────────────
    await pPage.goto(`/register?redirect=${encodeURIComponent(joinPath)}`)
    await pPage.fill('#first_name', playerFirst)
    await pPage.fill('#last_name', playerLast)
    await pPage.fill('#email', playerEmail)
    await pPage.fill('#date_of_birth', '2000-06-15')
    await pPage.selectOption('select#onboarding_role', 'player')
    await pPage.fill('#password', password)
    await pPage.check('input[name="terms_accepted"]')
    await pPage.check('input[name="privacy_accepted"]')
    await pPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await pPage.waitForURL(joinPath)
    await expect(pPage.getByText(teamName)).toBeVisible()

    // ── 5. Beitrittsanfrage senden ───────────────────────────────────────────
    await pPage.getByRole('button', { name: 'Ich trete selbst bei' }).click()
    await expect(pPage.getByText(playerFirst)).toBeVisible()
    await pPage.getByRole('button', { name: 'Beitrittsanfrage senden' }).click()
    await expect(pPage.getByText('Anfrage gesendet')).toBeVisible()

    // ── 6. Trainer nimmt Anfrage an ──────────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/requests`)
    await expect(tPage.getByText(playerName)).toBeVisible()
    await tPage.getByRole('button', { name: 'Annehmen' }).click()
    // revalidatePath re-rendert die Seite sofort → keine offenen Anfragen mehr sichtbar
    await expect(tPage.getByText('Keine offenen Anfragen')).toBeVisible({ timeout: 10_000 })

    // ── 7. Trainer erstellt Training ─────────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/events/new`)
    await tPage.fill('#title', eventTitle)
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    await tPage.fill('#starts_at_date', tomorrow)
    await tPage.fill('#starts_at_time', '18:00')
    await Promise.all([
      tPage.waitForURL(/\/teams\/[^/]+\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      tPage.getByRole('button', { name: 'Training erstellen' }).click(),
    ])
    const eventId = tPage.url().split('/events/')[1]
    await expect(tPage.getByText(eventTitle)).toBeVisible()

    // ── 8. Player sieht Training auf Dashboard ───────────────────────────────
    await pPage.goto('/dashboard')
    await expect(pPage.getByText(eventTitle)).toBeVisible()

    // ── 9. Player sagt zu ────────────────────────────────────────────────────
    await pPage.goto(`/teams/${teamId}/events/${eventId}`)
    // respondToEventAction redirectet zur selben URL → Listener vor dem Click setzen
    await Promise.all([
      pPage.waitForURL(/\/teams\/[^/]+\/events\/[^/]+$/),
      pPage.getByRole('button', { name: 'Zusagen' }).click(),
    ])

    // ── 10. Trainer sieht Spieler unter „Kommt" ─────────────────────────────
    await tPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(tPage.locator('h3').filter({ hasText: 'Kommt' })).toBeVisible()
    await expect(tPage.getByText(playerName)).toBeVisible()

  } finally {
    await trainerCtx.close()
    await playerCtx.close()
  }
})
