import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

async function signInSupabaseClient(
  env: { url: string; anonKey: string },
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createSupabaseClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Direkter Supabase-Login für ${email} fehlgeschlagen: ${error.message}`)
  return client
}

test('Kernflow: Training bedingt hart löschen (team_owner-only)', async ({ browser }) => {
  test.setTimeout(180_000)

  const supabaseEnv = getLoopbackSupabaseEnv()
  const ts = Date.now()
  const ownerEmail = `owner+delete${ts}@vereon.test`
  const playerEmail = `player+delete${ts}@vereon.test`
  const password = 'Test1234!'
  const teamName = `E2E Delete Team ${ts}`

  const ownerContext = await browser.newContext()
  const playerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()
  const playerPage = await playerContext.newPage()

  try {
    await ownerPage.goto('/register')
    await ownerPage.fill('#first_name', 'Olivia')
    await ownerPage.fill('#last_name', 'Owner')
    await ownerPage.fill('#email', ownerEmail)
    await ownerPage.fill('#date_of_birth', '1985-03-20')
    await ownerPage.selectOption('select#onboarding_role', 'coach')
    await ownerPage.fill('#password', password)
    await ownerPage.check('input[name="terms_accepted"]')
    await ownerPage.check('input[name="privacy_accepted"]')
    await ownerPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await ownerPage.waitForURL('/dashboard')

    const ownerApi = await signInSupabaseClient(supabaseEnv, ownerEmail, password)
    const { data: teamId, error: createTeamError } = await ownerApi.rpc(
      'create_independent_team',
      { p_team_name: teamName, p_also_head_coach: false },
    )
    expect(createTeamError, createTeamError?.message).toBeNull()
    expect(teamId).toBeTruthy()

    const createEvent = async (
      title: string,
      startsAt: string,
      eventType: 'training' | 'match' = 'training',
    ): Promise<string> => {
      const { data, error } = await ownerApi.rpc('create_event', {
        p_team_id: teamId,
        p_title: title,
        p_starts_at: startsAt,
        p_event_type: eventType,
        p_location: null,
        p_description: null,
      })
      expect(error, error?.message).toBeNull()
      expect(data).toBeTruthy()
      return data as string
    }

    const future = new Date(Date.now() + 86_400_000).toISOString()
    const later = new Date(Date.now() + 172_800_000).toISOString()
    const deletableId = await createEvent(`E2E Deletable ${ts}`, future)
    const rsvpBlockedId = await createEvent(`E2E RSVP Blocked ${ts}`, later)
    const cancelledId = await createEvent(`E2E Cancelled ${ts}`, later)
    const pastId = await createEvent(`E2E Past ${ts}`, new Date(Date.now() - 60_000).toISOString())
    const matchId = await createEvent(`E2E Match ${ts}`, later, 'match')

    await ownerPage.goto(`/teams/${teamId}/invite`)
    const joinUrl = await ownerPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
    expect(joinCode).toBeTruthy()
    const joinPath = `/join/${joinCode}`

    await playerPage.goto(`/register?redirect=${encodeURIComponent(joinPath)}`)
    await playerPage.fill('#first_name', 'Paula')
    await playerPage.fill('#last_name', 'Player')
    await playerPage.fill('#email', playerEmail)
    await playerPage.fill('#date_of_birth', '2000-06-15')
    await playerPage.selectOption('select#onboarding_role', 'player')
    await playerPage.fill('#password', password)
    await playerPage.check('input[name="terms_accepted"]')
    await playerPage.check('input[name="privacy_accepted"]')
    await playerPage.getByRole('button', { name: 'Konto erstellen' }).click()
    await playerPage.waitForURL(joinPath)
    await playerPage.getByRole('button', { name: 'Ich trete selbst bei' }).click()
    await playerPage.getByRole('button', { name: 'Beitrittsanfrage senden' }).click()

    await ownerPage.goto(`/teams/${teamId}/requests`)
    await ownerPage.getByRole('button', { name: 'Annehmen' }).click()
    await expect(ownerPage.getByText('Keine offenen Anfragen')).toBeVisible({ timeout: 10_000 })

    const playerApi = await signInSupabaseClient(supabaseEnv, playerEmail, password)
    const { data: playerRow, error: playerError } = await playerApi
      .from('players')
      .select('id')
      .eq('user_id', (await playerApi.auth.getUser()).data.user!.id)
      .single()
    expect(playerError, playerError?.message).toBeNull()

    const { error: rsvpError } = await playerApi.rpc('respond_to_event', {
      p_event_id: rsvpBlockedId,
      p_player_id: playerRow!.id,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(rsvpError, rsvpError?.message).toBeNull()

    const anonApi = createSupabaseClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonDeleteError } = await anonApi.rpc('delete_training', {
      p_event_id: deletableId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(anonDeleteError).not.toBeNull()
    expect(anonDeleteError!.message.toLowerCase()).not.toContain('nicht eingeloggt')

    const { error: playerDeleteError } = await playerApi.rpc('delete_training', {
      p_event_id: deletableId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(playerDeleteError).not.toBeNull()
    expect(playerDeleteError!.message.toLowerCase()).toContain('nicht gefunden')

    const { error: wrongConfirmationError } = await ownerApi.rpc('delete_training', {
      p_event_id: deletableId,
      p_confirmation: 'löschen',
    })
    expect(wrongConfirmationError).not.toBeNull()
    expect(wrongConfirmationError!.message.toLowerCase()).toContain('bestätigungstext')

    const { error: rsvpDeleteError } = await ownerApi.rpc('delete_training', {
      p_event_id: rsvpBlockedId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(rsvpDeleteError).not.toBeNull()
    expect(rsvpDeleteError!.message.toLowerCase()).toContain('rückmeldungen')

    const { error: cancelError } = await ownerApi.rpc('cancel_event', { p_event_id: cancelledId })
    expect(cancelError, cancelError?.message).toBeNull()
    const { error: cancelledDeleteError } = await ownerApi.rpc('delete_training', {
      p_event_id: cancelledId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(cancelledDeleteError).not.toBeNull()
    expect(cancelledDeleteError!.message.toLowerCase()).toContain('abgesagt')

    const { error: pastDeleteError } = await ownerApi.rpc('delete_training', {
      p_event_id: pastId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(pastDeleteError).not.toBeNull()
    expect(pastDeleteError!.message.toLowerCase()).toContain('bereits begonnen')

    const { error: matchDeleteError } = await ownerApi.rpc('delete_training', {
      p_event_id: matchId,
      p_confirmation: 'LÖSCHEN',
    })
    expect(matchDeleteError).not.toBeNull()
    expect(matchDeleteError!.message.toLowerCase()).toContain('nicht gefunden')

    await ownerPage.goto(`/teams/${teamId}/events/${rsvpBlockedId}`)
    await expect(ownerPage.getByRole('button', { name: 'Training absagen' })).toBeVisible()
    await expect(ownerPage.getByLabel(/Zum endgültigen Löschen/)).toHaveCount(0)

    await ownerPage.goto(`/teams/${teamId}/events/${deletableId}`)
    const confirmationInput = ownerPage.getByLabel(/Zum endgültigen Löschen/)
    const deleteButton = ownerPage.getByRole('button', { name: 'Training endgültig löschen' })
    await expect(confirmationInput).toBeVisible()
    await expect(deleteButton).toBeDisabled()
    await confirmationInput.fill('LÖSCHEN')
    await expect(deleteButton).toBeEnabled()
    await Promise.all([
      ownerPage.waitForURL(`/teams/${teamId}/events`),
      deleteButton.click(),
    ])

    const { data: deletedEvent, error: deletedEventError } = await ownerApi
      .from('events')
      .select('id')
      .eq('id', deletableId)
      .maybeSingle()
    expect(deletedEventError, deletedEventError?.message).toBeNull()
    expect(deletedEvent).toBeNull()
  } finally {
    await ownerContext.close()
    await playerContext.close()
  }
})
