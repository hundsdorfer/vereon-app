import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { getLoopbackSupabaseEnv } from './helpers/supabaseTestGuard'

type SupabaseEnv = { url: string; anonKey: string }

// FC-ROLE-002/FC-ROLE-003: grant_assistant_coach() ist der erste legitime
// Schreibweg auf team_member_roles für eine zweite Person — daher der erste
// Kernflow, der ein reales assistant_coach-Testkonto provisionieren kann.
// head_coach-only bleibt weiterhin nicht real provisionierbar (nur über
// create_independent_team(p_also_head_coach: true), derselbe Nutzer wie
// team_owner) — das löst dieses Feature nicht. Der "Mitgliedschaft ist nicht
// aktiv"-Zweig in grant_assistant_coach() ist über keinen aktuellen App-Flow
// erreichbar (team_memberships.status wechselt nirgends von 'active' weg)
// und bleibt daher nur über den statischen Rollenvertrag
// (roleManagementRoleContract.spec.ts) abgedeckt.

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

test('Kernflow: Co-Trainer hinzufügen/entfernen, Audit-Log und Lifecycle', async ({ browser }) => {
  const supabaseEnv = getLoopbackSupabaseEnv()
  test.setTimeout(180_000)

  const ts = Date.now()
  const ownerEmail = `owner+role-mgmt${ts}@vereon.test`
  const playerEmail = `player+role-mgmt${ts}@vereon.test`
  const password = 'Test1234!'
  const teamName = `E2E Role Management Team ${ts}`

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

    // Zweiter, echter Account tritt als Self-Player bei — die einzige
    // aktuell legitime Voraussetzung, um später als Co-Trainer-Kandidat zu
    // gelten.
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
    const { data: playerUserData, error: playerUserError } = await playerApi.auth.getUser()
    expect(playerUserError, playerUserError?.message).toBeNull()
    const playerUserId = playerUserData.user!.id

    const { data: playerRow, error: playerRowError } = await ownerApi
      .from('players')
      .select('id')
      .eq('user_id', playerUserId)
      .single()
    expect(playerRowError, playerRowError?.message).toBeNull()

    const { data: assignmentRow, error: assignmentRowError } = await ownerApi
      .from('player_team_assignments')
      .select('id')
      .eq('team_id', teamId)
      .eq('player_id', playerRow!.id)
      .single()
    expect(assignmentRowError, assignmentRowError?.message).toBeNull()
    const assignmentId = assignmentRow!.id as string

    // UI: Owner sieht Paula unter "Trainerteam" als Grant-Kandidatin.
    await ownerPage.goto(`/teams/${teamId}`)
    const trainerteamCard = ownerPage
      .getByRole('heading', { name: 'Trainerteam' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await expect(trainerteamCard).toBeVisible()
    await expect(trainerteamCard.getByText('Paula Player')).toBeVisible()
    await Promise.all([
      ownerPage.waitForResponse((res) => res.request().method() === 'POST'),
      trainerteamCard.getByRole('button', { name: 'Co-Trainer machen' }).click(),
    ])
    // Next.js aktualisiert die Server-Component-Card nach der Server Action
    // sofort mit frischen Daten — der lokale Erfolgs-Client-State der Buttons
    // ist daher nicht verlässlich prüfbar, nur das Verschwinden des
    // Grant-Buttons (unabhängig davon, ob lokal oder per Refresh).
    await expect(
      trainerteamCard.getByRole('button', { name: 'Co-Trainer machen' }),
    ).toHaveCount(0, { timeout: 10_000 })

    // Direkte RPC-Verifikation: die Rolle ist funktional real, nicht nur ein
    // UI-Label.
    const { data: hasRoleAfterGrant, error: hasRoleAfterGrantError } = await playerApi.rpc(
      'has_team_role',
      { p_team_id: teamId, p_role_keys: ['assistant_coach'] },
    )
    expect(hasRoleAfterGrantError, hasRoleAfterGrantError?.message).toBeNull()
    expect(hasRoleAfterGrant).toBe(true)

    const future = new Date(Date.now() + 86_400_000).toISOString()
    const { data: trainingId, error: createEventError } = await ownerApi.rpc('create_event', {
      p_team_id: teamId,
      p_title: `E2E Role Management Training ${ts}`,
      p_starts_at: future,
      p_event_type: 'training',
      p_location: null,
      p_description: null,
    })
    expect(createEventError, createEventError?.message).toBeNull()

    const { data: staffRsvpTeamId, error: staffRsvpError } = await playerApi.rpc(
      'respond_to_event_as_staff',
      { p_event_id: trainingId, p_rsvp_status: 'attending', p_rsvp_note: null },
    )
    expect(staffRsvpError, staffRsvpError?.message).toBeNull()
    expect(staffRsvpTeamId).toBe(teamId)

    // UI: nach Reload erscheint Paula unter den aktuellen Co-Trainern mit
    // Entzug-Option.
    await ownerPage.reload()
    const reloadedCard = ownerPage
      .getByRole('heading', { name: 'Trainerteam' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await expect(reloadedCard.getByText('Paula Player')).toBeVisible()
    await expect(reloadedCard.getByRole('button', { name: 'Entziehen' })).toBeVisible()

    // Audit-Log: genau ein "granted"-Eintrag.
    const { data: auditAfterGrant, error: auditAfterGrantError } = await ownerApi
      .from('team_role_audit_log')
      .select('action, target_user_id, performed_by, role_key')
      .eq('team_id', teamId)
    expect(auditAfterGrantError, auditAfterGrantError?.message).toBeNull()
    expect(auditAfterGrant).toEqual([
      {
        action: 'granted',
        target_user_id: playerUserId,
        performed_by: ownerUserId,
        role_key: 'assistant_coach',
      },
    ])

    // Negativ-/Berechtigungsprüfungen — alle drei RPCs gegen einen
    // authentifizierten Nicht-Owner (jetzt selbst echter assistant_coach).
    const { error: playerGrantError } = await playerApi.rpc('grant_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: ownerUserId,
    })
    expect(playerGrantError).not.toBeNull()
    expect(playerGrantError!.message.toLowerCase()).toContain('keine berechtigung')

    const { error: playerRevokeError } = await playerApi.rpc('revoke_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: ownerUserId,
    })
    expect(playerRevokeError).not.toBeNull()
    expect(playerRevokeError!.message.toLowerCase()).toContain('keine berechtigung')

    const { error: playerListError } = await playerApi.rpc('list_assistant_coaches', {
      p_team_id: teamId,
    })
    expect(playerListError).not.toBeNull()
    expect(playerListError!.message.toLowerCase()).toContain('team nicht gefunden')

    // Direkter Tabellenzugriff auf das Audit-Log: nur SELECT, nur für den
    // Owner sichtbar; kein INSERT/UPDATE/DELETE möglich, auch nicht für den
    // Owner selbst (keine Schreibgrants — nur die RPCs schreiben).
    const { error: playerAuditInsertError } = await playerApi.from('team_role_audit_log').insert({
      team_id: teamId,
      target_user_id: playerUserId,
      role_key: 'assistant_coach',
      action: 'granted',
      performed_by: playerUserId,
    })
    expect(playerAuditInsertError).not.toBeNull()

    const { error: ownerAuditInsertError } = await ownerApi.from('team_role_audit_log').insert({
      team_id: teamId,
      target_user_id: playerUserId,
      role_key: 'assistant_coach',
      action: 'granted',
      performed_by: ownerUserId,
    })
    expect(ownerAuditInsertError).not.toBeNull()

    const { data: playerAuditSelect, error: playerAuditSelectError } = await playerApi
      .from('team_role_audit_log')
      .select('id')
      .eq('team_id', teamId)
    expect(playerAuditSelectError, playerAuditSelectError?.message).toBeNull()
    expect(playerAuditSelect).toEqual([])

    // Idempotenter Re-Grant durch den Owner: Erfolg, aber kein doppelter
    // Rollen- oder Audit-Eintrag.
    const { data: idempotentTeamId, error: idempotentGrantError } = await ownerApi.rpc(
      'grant_assistant_coach',
      { p_team_id: teamId, p_target_user_id: playerUserId },
    )
    expect(idempotentGrantError, idempotentGrantError?.message).toBeNull()
    expect(idempotentTeamId).toBe(teamId)

    const { data: auditAfterIdempotent, error: auditAfterIdempotentError } = await ownerApi
      .from('team_role_audit_log')
      .select('action')
      .eq('team_id', teamId)
    expect(auditAfterIdempotentError, auditAfterIdempotentError?.message).toBeNull()
    expect(auditAfterIdempotent).toHaveLength(1)

    // Self-Targeting: serverseitig verboten, unabhängig von der UI.
    const { error: selfGrantError } = await ownerApi.rpc('grant_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: ownerUserId,
    })
    expect(selfGrantError).not.toBeNull()
    expect(selfGrantError!.message.toLowerCase()).toContain('eigene rolle')

    const { error: selfRevokeError } = await ownerApi.rpc('revoke_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: ownerUserId,
    })
    expect(selfRevokeError).not.toBeNull()
    expect(selfRevokeError!.message.toLowerCase()).toContain('eigene rolle')

    // Teamfremde Ziel-ID: Paula hat keine Spielerbeziehung zu einem zweiten
    // Team desselben Owners.
    const { data: otherTeamId, error: otherTeamError } = await ownerApi.rpc(
      'create_independent_team',
      { p_team_name: `E2E Role Management Fremdteam ${ts}`, p_also_head_coach: false },
    )
    expect(otherTeamError, otherTeamError?.message).toBeNull()
    const { error: crossTeamError } = await ownerApi.rpc('grant_assistant_coach', {
      p_team_id: otherTeamId,
      p_target_user_id: playerUserId,
    })
    expect(crossTeamError).not.toBeNull()
    expect(crossTeamError!.message.toLowerCase()).toContain('kein aktiver spieler')

    // Nicht existierende Ziel-ID.
    const missingUserId = '00000000-0000-4000-8000-000000000099'
    const { error: missingGrantError } = await ownerApi.rpc('grant_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: missingUserId,
    })
    expect(missingGrantError).not.toBeNull()
    expect(missingGrantError!.message.toLowerCase()).toContain('kein aktiver spieler')

    const { error: missingRevokeError } = await ownerApi.rpc('revoke_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: missingUserId,
    })
    expect(missingRevokeError).not.toBeNull()
    expect(missingRevokeError!.message.toLowerCase()).toContain('kein co-trainer')

    // Anonyme Aufrufe aller drei RPCs.
    const anonApi = createSupabaseClient(supabaseEnv.url, supabaseEnv.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: anonGrantError } = await anonApi.rpc('grant_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: playerUserId,
    })
    expect(anonGrantError).not.toBeNull()
    const { error: anonRevokeError } = await anonApi.rpc('revoke_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: playerUserId,
    })
    expect(anonRevokeError).not.toBeNull()
    const { error: anonListError } = await anonApi.rpc('list_assistant_coaches', {
      p_team_id: teamId,
    })
    expect(anonListError).not.toBeNull()

    // Reales Inaktivitäts-Gate: Owner entfernt Paula als Spieler, danach
    // schlägt ein erneuter Grant fehl — obwohl sie bereits Co-Trainerin ist.
    const { error: removePlayerError } = await ownerApi.rpc('remove_player_from_team', {
      p_assignment_id: assignmentId,
    })
    expect(removePlayerError, removePlayerError?.message).toBeNull()

    const { error: grantAfterRemoveError } = await ownerApi.rpc('grant_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: playerUserId,
    })
    expect(grantAfterRemoveError).not.toBeNull()
    expect(grantAfterRemoveError!.message.toLowerCase()).toContain('kein aktiver spieler')

    // Revoke via UI (ConfirmButton).
    await ownerPage.reload()
    const revokeCard = ownerPage
      .getByRole('heading', { name: 'Trainerteam' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await revokeCard.getByRole('button', { name: 'Entziehen' }).click()
    await Promise.all([
      ownerPage.waitForResponse((res) => res.request().method() === 'POST'),
      revokeCard.getByRole('button', { name: 'Bestätigen' }).click(),
    ])
    // Wie beim Grant oben: die Server-Component-Card wird nach der Server
    // Action sofort mit frischen Daten neu gerendert (Paula verschwindet aus
    // der Co-Trainer-Liste), daher hier ebenfalls über den Reload-Zustand
    // statt über den transienten lokalen Erfolgstext prüfen.
    await ownerPage.reload()
    const revokeCardAfter = ownerPage
      .getByRole('heading', { name: 'Trainerteam' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-lg")]')
    await expect(revokeCardAfter.getByText('Paula Player')).toHaveCount(0)
    await expect(
      revokeCardAfter.getByText('Noch keine Co-Trainer'),
    ).toBeVisible()

    const { data: hasRoleAfterRevoke, error: hasRoleAfterRevokeError } = await playerApi.rpc(
      'has_team_role',
      { p_team_id: teamId, p_role_keys: ['assistant_coach'] },
    )
    expect(hasRoleAfterRevokeError, hasRoleAfterRevokeError?.message).toBeNull()
    expect(hasRoleAfterRevoke).toBe(false)

    const { error: staffRsvpAfterRevokeError } = await playerApi.rpc(
      'respond_to_event_as_staff',
      { p_event_id: trainingId, p_rsvp_status: 'declined', p_rsvp_note: null },
    )
    expect(staffRsvpAfterRevokeError).not.toBeNull()
    expect(staffRsvpAfterRevokeError!.message.toLowerCase()).toContain('nicht gefunden')

    // Lifecycle: die von diesem Feature angelegte Mitgliedschaft ist jetzt
    // inaktiv — kein dauerhafter, grundloser Teamzugriff mehr.
    const { data: membershipRow, error: membershipRowError } = await ownerApi
      .from('team_memberships')
      .select('status')
      .eq('team_id', teamId)
      .eq('user_id', playerUserId)
      .single()
    expect(membershipRowError, membershipRowError?.message).toBeNull()
    expect(membershipRow!.status).toBe('inactive')

    // Erneuter Entzug schlägt fehl.
    const { error: revokeAgainError } = await ownerApi.rpc('revoke_assistant_coach', {
      p_team_id: teamId,
      p_target_user_id: playerUserId,
    })
    expect(revokeAgainError).not.toBeNull()
    expect(revokeAgainError!.message.toLowerCase()).toContain('kein co-trainer')

    // Audit-Log: granted + revoked, in dieser Reihenfolge.
    const { data: auditFinal, error: auditFinalError } = await ownerApi
      .from('team_role_audit_log')
      .select('action')
      .eq('team_id', teamId)
      .order('performed_at', { ascending: true })
    expect(auditFinalError, auditFinalError?.message).toBeNull()
    expect(auditFinal).toEqual([{ action: 'granted' }, { action: 'revoked' }])
  } finally {
    await ownerContext.close()
    await playerContext.close()
  }
})
