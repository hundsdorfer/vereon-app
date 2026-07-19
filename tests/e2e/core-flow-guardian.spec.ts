import { test, expect } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

test('Kernflow: Trainer + Guardian + Kind', async ({ browser }) => {
  test.setTimeout(120_000)

  // Sicherheitsgrenze: registriert echte Nutzer und legt echte Daten über
  // den Browser an — bricht sofort ab, falls die konfigurierte
  // Supabase-URL nicht auf eine lokale Loopback-Adresse zeigt, statt
  // versehentlich gegen eine Cloud-Instanz zu laufen.
  getLoopbackSupabaseEnv()

  const ts            = Date.now()
  const trainerEmail  = `trainer+${ts}@vereon.test`
  const guardianEmail = `guardian+${ts}@vereon.test`
  const password      = 'Test1234!'
  const teamName      = `E2E Guardian Team ${ts}`
  const eventTitle    = `E2E Guardian Training ${ts}`
  const childFirst    = 'Lena'
  const childLast     = `E2EKind${ts}`
  const childName     = `${childFirst} ${childLast}`

  const trainerCtx  = await browser.newContext()
  const guardianCtx = await browser.newContext()
  const tPage       = await trainerCtx.newPage()
  const gPage       = await guardianCtx.newPage()

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
    await Promise.all([
      tPage.waitForURL(/\/teams\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),
      tPage.getByRole('button', { name: 'Team erstellen' }).click(),
    ])
    const teamId = tPage.url().split('/teams/')[1]
    await expect(tPage.getByText(teamName)).toBeVisible()

    // ── 3+4. Invite-Seite öffnen, Join-Link lesen ───────────────────────────
    await tPage.goto(`/teams/${teamId}/invite`)
    const joinUrl  = await tPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
    expect(joinCode).toBeTruthy()
    const joinPath = `/join/${joinCode}`

    // ── 5. Guardian registriert sich mit Redirect zur Join-Seite ────────────
    await gPage.goto(`/register?redirect=${encodeURIComponent(joinPath)}`)
    await gPage.fill('#first_name', 'Gabi')
    await gPage.fill('#last_name', 'Guardian')
    await gPage.fill('#email', guardianEmail)
    await gPage.fill('#date_of_birth', '1985-08-10')
    await gPage.selectOption('select#onboarding_role', 'guardian')
    await gPage.fill('#password', password)
    await gPage.check('input[name="terms_accepted"]')
    await gPage.check('input[name="privacy_accepted"]')
    await gPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await gPage.waitForURL(joinPath)
    await expect(gPage.getByText(teamName)).toBeVisible()

    // ── 6. Guardian wählt „Ich melde mein Kind an" ──────────────────────────
    await gPage.getByRole('button', { name: 'Ich melde mein Kind an' }).click()

    // ── 7. Kind-Daten eingeben ───────────────────────────────────────────────
    await gPage.fill('#child_first_name', childFirst)
    await gPage.fill('#child_last_name', childLast)
    await gPage.fill('#child_birth_year', '2015')

    // ── 8. Beitrittsanfrage senden ───────────────────────────────────────────
    // Achtung: Guardian-Form hat "Anfrage senden", nicht "Beitrittsanfrage senden"!
    await gPage.getByRole('button', { name: 'Anfrage senden' }).click()
    await expect(gPage.getByText('Anfrage gesendet')).toBeVisible()

    // ── 9. Trainer nimmt Kind-Anfrage an ─────────────────────────────────────
    await tPage.goto(`/teams/${teamId}/requests`)
    await expect(tPage.getByText(childName)).toBeVisible()
    await tPage.getByRole('button', { name: 'Annehmen' }).click()
    // revalidatePath re-rendert die Seite sofort → Anfrage verschwindet
    await expect(tPage.getByText('Keine offenen Anfragen')).toBeVisible({ timeout: 10_000 })

    // ── 10. Trainer erstellt Training ────────────────────────────────────────
    // Training NACH Annahme erstellen → Event-Attendance-Trigger greift für Kind
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

    // ── 11. Guardian sieht Training + Kindname auf Dashboard ─────────────────
    await gPage.goto('/dashboard')
    await expect(gPage.getByText(eventTitle)).toBeVisible()
    await expect(gPage.getByText(childName)).toBeVisible()

    // ── 12. Guardian öffnet Training, sieht Kindname in RsvpForm ─────────────
    await gPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(gPage.getByText(childName)).toBeVisible()

    // ── 13. Guardian klickt „Zusagen" für das Kind ───────────────────────────
    await Promise.all([
      gPage.waitForURL(/\/teams\/[^/]+\/events\/[^/]+$/),
      gPage.getByRole('button', { name: 'Zusagen' }).click(),
    ])

    // ── 14+15. Trainer öffnet Training, sieht Kind unter „Kommt" ─────────────
    await tPage.goto(`/teams/${teamId}/events/${eventId}`)
    await expect(tPage.locator('h3').filter({ hasText: 'Kommt' })).toBeVisible()
    await expect(tPage.getByText(childName)).toBeVisible()

  } finally {
    await trainerCtx.close()
    await guardianCtx.close()
  }
})
