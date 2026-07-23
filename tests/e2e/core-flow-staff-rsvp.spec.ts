import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

type SupabaseEnv = { url: string; anonKey: string }

// Die echte Rollen-Fixture bleibt bewusst team_owner-only: Ohne Service-Role,
// direkte Manipulation von team_member_roles oder eine neue Rollenverwaltungs-
// RPC lassen sich weder ein fremder aktiver Trainer noch ein historischer
// Trainerdatensatz legitim erzeugen (FC-ROLE-002). SECURITY-DEFINER-Profiljoin,
// Historienzweig, Deduplizierung und team_manager-Ausschluss werden deshalb
// zusätzlich im statischen Vertrag trainingStaffRsvpRoleContract.spec.ts
// geprüft; dieser Kernflow verifiziert die erreichbaren Laufzeitpfade.

async function signInSupabaseClient(
  env: SupabaseEnv,
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createSupabaseClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Direkter Supabase-Login für ${email} fehlgeschlagen: ${error.message}`)
  }
  return client
}

test('Kernflow: Trainer-RSVP, Listen-RPC, Deadline und Lösch-Race', async ({ browser }) => {
  const supabaseEnv = getLoopbackSupabaseEnv()
  test.setTimeout(240_000)

  const ts = Date.now()
  const ownerEmail = `owner+staff-rsvp${ts}@vereon.test`
  const playerEmail = `player+staff-rsvp${ts}@vereon.test`
  const password = 'Test1234!'
  const teamName = `E2E Staff RSVP Team ${ts}`

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
    const { data: ownerUserData, error: ownerUserError } = await ownerApi.auth.getUser()
    expect(ownerUserError, ownerUserError?.message).toBeNull()
    const ownerUserId = ownerUserData.user!.id

    const { data: teamId, error: createTeamError } = await ownerApi.rpc(
      'create_independent_team',
      { p_team_name: teamName, p_also_head_coach: false },
    )
    expect(createTeamError, createTeamError?.message).toBeNull()
    expect(teamId).toBeTruthy()

    const createEvent = async (title: string, startsAt: string): Promise<string> => {
      const { data, error } = await ownerApi.rpc('create_event', {
        p_team_id: teamId,
        p_title: title,
        p_starts_at: startsAt,
        p_event_type: 'training',
        p_location: null,
        p_description: null,
      })
      expect(error, error?.message).toBeNull()
      expect(data).toBeTruthy()
      return data as string
    }

    const future = new Date(Date.now() + 86_400_000).toISOString()
    const successfulEventId = await createEvent(`E2E Staff RSVP Erfolg ${ts}`, future)

    const { data: firstTeamId, error: firstResponseError } = await ownerApi.rpc(
      'respond_to_event_as_staff',
      {
        p_event_id: successfulEventId,
        p_rsvp_status: 'attending',
        p_rsvp_note: 'Bin pünktlich da.',
      },
    )
    expect(firstResponseError, firstResponseError?.message).toBeNull()
    expect(firstTeamId).toBe(teamId)

    const { data: secondTeamId, error: secondResponseError } = await ownerApi.rpc(
      'respond_to_event_as_staff',
      {
        p_event_id: successfulEventId,
        p_rsvp_status: 'declined',
        p_rsvp_note: 'Kann heute nicht.',
      },
    )
    expect(secondResponseError, secondResponseError?.message).toBeNull()
    expect(secondTeamId).toBe(teamId)

    const { data: ownRows, error: ownRowsError } = await ownerApi
      .from('event_staff_rsvps')
      .select('user_id, rsvp_status, rsvp_note')
      .eq('event_id', successfulEventId)
    expect(ownRowsError, ownRowsError?.message).toBeNull()
    expect(ownRows).toEqual([
      {
        user_id: ownerUserId,
        rsvp_status: 'declined',
        rsvp_note: 'Kann heute nicht.',
      },
    ])

    const anonApi = createSupabaseClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonResponseError } = await anonApi.rpc('respond_to_event_as_staff', {
      p_event_id: successfulEventId,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(anonResponseError).not.toBeNull()
    expect(anonResponseError!.message.toLowerCase()).not.toContain('nicht eingeloggt')

    const { error: anonListError } = await anonApi.rpc('list_staff_rsvps_for_event', {
      p_event_id: successfulEventId,
    })
    expect(anonListError).not.toBeNull()
    expect(anonListError!.message.toLowerCase()).not.toContain('nicht eingeloggt')

    const missingEventId = '00000000-0000-4000-8000-000000000001'
    const { error: missingResponseError } = await ownerApi.rpc('respond_to_event_as_staff', {
      p_event_id: missingEventId,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(missingResponseError).not.toBeNull()
    expect(missingResponseError!.message.toLowerCase()).toContain('nicht gefunden')

    const cancelledEventId = await createEvent(`E2E Staff RSVP Abgesagt ${ts}`, future)
    const { error: cancelError } = await ownerApi.rpc('cancel_event', {
      p_event_id: cancelledEventId,
    })
    expect(cancelError, cancelError?.message).toBeNull()
    const { error: cancelledResponseError } = await ownerApi.rpc(
      'respond_to_event_as_staff',
      {
        p_event_id: cancelledEventId,
        p_rsvp_status: 'attending',
        p_rsvp_note: null,
      },
    )
    expect(cancelledResponseError).not.toBeNull()
    expect(cancelledResponseError!.message.toLowerCase()).toContain('abgesagt')

    const pastEventId = await createEvent(
      `E2E Staff RSVP Vergangenheit ${ts}`,
      new Date(Date.now() - 60_000).toISOString(),
    )
    const { error: pastResponseError } = await ownerApi.rpc('respond_to_event_as_staff', {
      p_event_id: pastEventId,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(pastResponseError).not.toBeNull()
    expect(pastResponseError!.message.toLowerCase()).toContain('begonnen')

    const boundaryStartsAt = Date.now() + 6_000
    const boundaryEventId = await createEvent(
      `E2E Staff RSVP Grenze ${ts}`,
      new Date(boundaryStartsAt).toISOString(),
    )
    const { error: beforeBoundaryError } = await ownerApi.rpc('respond_to_event_as_staff', {
      p_event_id: boundaryEventId,
      p_rsvp_status: 'maybe',
      p_rsvp_note: 'Noch offen.',
    })
    expect(beforeBoundaryError, beforeBoundaryError?.message).toBeNull()
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, boundaryStartsAt - Date.now() + 300)),
    )
    const { error: afterBoundaryError } = await ownerApi.rpc('respond_to_event_as_staff', {
      p_event_id: boundaryEventId,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(afterBoundaryError).not.toBeNull()
    expect(afterBoundaryError!.message.toLowerCase()).toContain('begonnen')

    const unansweredEventId = await createEvent(`E2E Staff RSVP Offen ${ts}`, future)
    const { data: unansweredRows, error: unansweredError } = await ownerApi.rpc(
      'list_staff_rsvps_for_event',
      { p_event_id: unansweredEventId },
    )
    expect(unansweredError, unansweredError?.message).toBeNull()
    expect(unansweredRows).toHaveLength(1)
    expect(unansweredRows![0]).toMatchObject({
      user_id: ownerUserId,
      full_name: 'Olivia Owner',
      rsvp_status: null,
      rsvp_note: null,
      is_active_trainer: true,
    })

    const { data: dualRoleTeamId, error: dualRoleTeamError } = await ownerApi.rpc(
      'create_independent_team',
      { p_team_name: `E2E Staff RSVP Doppelrolle ${ts}`, p_also_head_coach: true },
    )
    expect(dualRoleTeamError, dualRoleTeamError?.message).toBeNull()
    const { data: dualRoleEventId, error: dualRoleEventError } = await ownerApi.rpc(
      'create_event',
      {
        p_team_id: dualRoleTeamId,
        p_title: `E2E Staff RSVP Dedupe ${ts}`,
        p_starts_at: future,
        p_event_type: 'training',
        p_location: null,
        p_description: null,
      },
    )
    expect(dualRoleEventError, dualRoleEventError?.message).toBeNull()
    const { data: dualRoleRows, error: dualRoleListError } = await ownerApi.rpc(
      'list_staff_rsvps_for_event',
      { p_event_id: dualRoleEventId },
    )
    expect(dualRoleListError, dualRoleListError?.message).toBeNull()
    expect(dualRoleRows).toHaveLength(1)
    expect(dualRoleRows![0].user_id).toBe(ownerUserId)

    await ownerPage.goto(`/teams/${teamId}/invite`)
    const joinUrl = await ownerPage.inputValue('input[aria-label="Einladungslink"]')
    const joinCode = joinUrl.split('/join/')[1]
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
    const { error: playerResponseError } = await playerApi.rpc('respond_to_event_as_staff', {
      p_event_id: unansweredEventId,
      p_rsvp_status: 'attending',
      p_rsvp_note: null,
    })
    expect(playerResponseError).not.toBeNull()
    expect(playerResponseError!.message.toLowerCase()).toContain('nicht gefunden')

    const { error: playerListExistingError } = await playerApi.rpc(
      'list_staff_rsvps_for_event',
      { p_event_id: unansweredEventId },
    )
    const { error: playerListMissingError } = await playerApi.rpc(
      'list_staff_rsvps_for_event',
      { p_event_id: missingEventId },
    )
    expect(playerListExistingError).not.toBeNull()
    expect(playerListMissingError).not.toBeNull()
    expect(playerListExistingError!.message.toLowerCase()).toContain('nicht gefunden')
    expect(playerListMissingError!.message.toLowerCase()).toContain('nicht gefunden')

    const uiEventId = await createEvent(`E2E Staff RSVP UI ${ts}`, future)
    await ownerPage.goto(`/teams/${teamId}/events/${uiEventId}`)
    const staffCard = ownerPage
      .getByRole('heading', { name: 'Trainer-Rückmeldungen' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await expect(staffCard).toBeVisible()
    await expect(ownerPage.getByLabel(/Zum endgültigen Löschen/)).toBeVisible()
    await staffCard.getByLabel('Notiz (optional)').fill('UI-Notiz')
    await Promise.all([
      ownerPage.waitForURL(`/teams/${teamId}/events/${uiEventId}`),
      staffCard.getByRole('button', { name: 'Zusagen' }).click(),
    ])
    const refreshedStaffCard = ownerPage
      .getByRole('heading', { name: 'Trainer-Rückmeldungen' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await expect(refreshedStaffCard.getByRole('button', { name: 'Zusagen' })).toHaveClass(
      /bg-primary/,
    )
    await expect(ownerPage.getByLabel(/Zum endgültigen Löschen/)).toHaveCount(0)

    const raceEventId = await createEvent(`E2E Staff RSVP Race ${ts}`, future)
    const [raceResponse, raceDelete] = await Promise.all([
      ownerApi.rpc('respond_to_event_as_staff', {
        p_event_id: raceEventId,
        p_rsvp_status: 'attending',
        p_rsvp_note: 'Race',
      }),
      ownerApi.rpc('delete_training', {
        p_event_id: raceEventId,
        p_confirmation: 'LÖSCHEN',
      }),
    ])
    const raceSuccessCount = [raceResponse, raceDelete].filter(
      (result) => !result.error && result.data,
    ).length
    expect(raceSuccessCount).toBe(1)

    const { data: raceEvent, error: raceEventError } = await ownerApi
      .from('events')
      .select('id')
      .eq('id', raceEventId)
      .maybeSingle()
    const { data: raceStaffRows, error: raceStaffError } = await ownerApi
      .from('event_staff_rsvps')
      .select('id')
      .eq('event_id', raceEventId)
    expect(raceEventError, raceEventError?.message).toBeNull()
    expect(raceStaffError, raceStaffError?.message).toBeNull()

    if (!raceResponse.error) {
      expect(raceDelete.error?.message.toLowerCase()).toContain('rückmeldungen')
      expect(raceEvent?.id).toBe(raceEventId)
      expect(raceStaffRows).toHaveLength(1)
    } else {
      expect(raceResponse.error.message.toLowerCase()).toContain('nicht gefunden')
      expect(raceDelete.error).toBeNull()
      expect(raceEvent).toBeNull()
      expect(raceStaffRows).toHaveLength(0)
    }
  } finally {
    await ownerContext.close()
    await playerContext.close()
  }
})
